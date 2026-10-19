/**
 * @NApiVersion 2.1
 */
define(['N/format', 'N/record', 'N/search', '../lib/scv_lib_function.js'],
    
    (format, record, search, libFunc) => {
        
        const RecordType = {
            DATA_TEMP: 'customrecord_scv_data_temp'
        }
        
        const Type = {
            NHIEU_PHIEU_NHAP: '1',
            HANG_LOAT: '2'
        }
        
        const SublistIds = {
            ITEM: 'item',
            INVENTORY_ASSIGNMENT: 'inventoryassignment',
        }
        
        const SavedSearchId = {
            ITR_BILL_CODE: 'customsearch_scv_itr_bill_code',
            ITR_PURCHASE_ITEM: 'customsearch_scv_itr_purchase_item'
        }
        
        const FormIds = {
            VENDOR_BILL_MULTI_ITR:  '101'
        }
        
        const doCreateVendorBill = (options) => {
            let existingVendorBillId = findVendorBillByItemReceipt(options.irid);
            if (existingVendorBillId) return existingVendorBillId;

            let recIr = record.load({type: 'itemreceipt', id: options.irid});
            let recVb = record.transform({
                fromType: 'purchaseorder',
                fromId: options.createdfrom,
                toType: 'vendorbill',
                defaultValues: {itemrcpt: options.irid}
            });
            recVb.setValue('locationsrequired', false);
            let nFieldData = ['custbody_scv_created_transaction'];
            try {
                libFunc.setValueData(recVb, nFieldData, [options.irid]);
            } catch (e) {
                log.error('Cannot set Vendor Bill created transaction', {
                    itemReceiptId: options.irid,
                    error: e
                });
            }
            let {trandate, postingperiod} = options;
            if (trandate && postingperiod) {
                recVb.setValue('trandate', format.parse({value: trandate, type: format.Type.DATE}));
                recVb.setValue('postingperiod', postingperiod);
            } else {
                setVendorBillDateFromItemReceipt(recVb, recIr);
            }
            recVb.setValue('exchangerate', recIr.getValue('exchangerate'));
            
            let slIt = SublistIds.ITEM;
            let listItemItr = [];
            makeListItemItr(recIr, slIt, listItemItr);
            
            let lcItVb = recVb.getLineCount(slIt);
            let isRemove, listLineRm = [], listOLEx = {};
            for (let i = 0; i < lcItVb; i++) {
                let orderline = recVb.getSublistValue({sublistId: slIt, fieldId: 'orderline', line: i});
                let line = recVb.getSublistValue({sublistId: slIt, fieldId: 'line', line: i});
                isRemove = true;
                let objItr = listItemItr.find(o => o.orderline === orderline);
                
                if (objItr && !listOLEx[String(orderline)]) {
                    isRemove = false;
                    let quantity = recVb.getSublistValue({
                        sublistId: slIt,
                        fieldId: 'quantity',
                        line: i
                    });
                    let location = recVb.getSublistValue({
                        sublistId: slIt,
                        fieldId: 'location',
                        line: i
                    });
                    recVb.setSublistValue({sublistId: slIt, fieldId: 'custcol_scv_created_from', value: recIr.getValue('createdfrom'), line: i});
                    recVb.setSublistValue({sublistId: slIt, fieldId: 'custcol_scv_list_itr', value: recIr.id, line: i});
                    recVb.setSublistValue({sublistId: slIt, fieldId: 'rate', value: objItr.rate, line: i});
                    recVb.setSublistValue({
                        sublistId: slIt,
                        fieldId: 'location',
                        value: objItr.location,
                        line: i
                    });
                    recVb.setSublistValue({
                        sublistId: slIt,
                        fieldId: 'quantity',
                        value: objItr.quantity,
                        line: i
                    });
                    
                    if (objItr.quantity !== quantity || objItr.location !== location) {
                        //removeInventoryDetail(recVb, slIt, i);
                        removeLineInventoryDetailWrong(recVb, slIt, objItr.inventorydetail, i);
                        createInventoryDetail(recVb, slIt, objItr.inventorydetail, i);
                    } else {
                        removeLineInventoryDetailWrong(recVb, slIt, objItr.inventorydetail, i);
                    }
                    
                    listOLEx[String(orderline)] = orderline;
                }
                
                if (isRemove) {
                    listLineRm.push(line);
                }
            }
            removeLineLine(recVb, slIt, listLineRm);
            let vendorBillId = recVb.save({enableSourcing: true, ignoreMandatoryFields: true});
            let related_transaction = recIr.getValue('custbody_scv_related_transaction') || [];
            related_transaction.push(vendorBillId);
            try {
                submitFieldITR(recIr.id, {custbody_scv_related_transaction: related_transaction});
            } catch (e) {
                log.error('Cannot update Item Receipt related transaction', {
                    itemReceiptId: recIr.id,
                    vendorBillId,
                    error: e
                });
            }
            return vendorBillId;
        }

        const findVendorBillByItemReceipt = (itemReceiptId) => {
            if (!itemReceiptId) return null;
            let itemReceiptTranId = getItemReceiptTranId(itemReceiptId);
            let referenceFilters = [
                ['custbody_scv_created_transaction', 'anyof', itemReceiptId],
                'OR',
                ['custcol_scv_list_itr', 'anyof', itemReceiptId]
            ];
            if (itemReceiptTranId) {
                referenceFilters.push('OR', ['custcol_scv_bill_itr', 'contains', itemReceiptTranId]);
            }
            let s = search.create({
                type: record.Type.VENDOR_BILL,
                filters: [
                    referenceFilters,
                    'AND',
                    ['mainline', 'is', 'F']
                ],
                columns: ['internalid']
            });
            let r = s.run().getRange(0, 1);
            return r.length > 0 ? r[0].getValue('internalid') : null;
        }

        const getItemReceiptTranId = (itemReceiptId) => {
            let lkIr = search.lookupFields({
                type: record.Type.ITEM_RECEIPT,
                id: itemReceiptId,
                columns: ['tranid']
            });
            return lkIr.tranid || '';
        }

        const setVendorBillDateFromItemReceipt = (recVb, recIr) => {
            const itemReceiptDate = recIr.getValue('trandate');
            const billDate = getBillDateFromSourceDate(itemReceiptDate, new Date());
            if (!billDate) return;
            recVb.setValue('trandate', billDate);
        };

        const getBillDateFromSourceDate = (sourceDate, compareDate) => {
            if (!sourceDate) return compareDate;
            if (!compareDate) return sourceDate;
            return getYearMonthValue(sourceDate) < getYearMonthValue(compareDate) ? compareDate : sourceDate;
        };

        const getYearMonthValue = (dateValue) => dateValue.getFullYear() * 100 + dateValue.getMonth();
        
        const submitFieldRelatedTransaction = (listItrIds, vendorBillId) => {
            listItrIds.forEach((id) => {
                let lkItr = search.lookupFields({type: record.Type.ITEM_RECEIPT, id: id, columns: ['custbody_scv_related_transaction']});
                let related_transaction = lkItr.custbody_scv_related_transaction || [];
                related_transaction = related_transaction.map(o => o.value);
                related_transaction.push(vendorBillId);
                submitFieldITR(id, {custbody_scv_related_transaction: related_transaction});
            });
            
        }
        
        const submitFieldITR = (id, values) => {
            record.submitFields({
                type: record.Type.ITEM_RECEIPT,
                id: id,
                values: values
            });
        }
        
        const removeLineInventoryDetailWrong = (recIvt, slIvt, list_value, line) => {
            if (!list_value) return;
            
            let listIssueIvn = list_value.map(o => o.receiptinventorynumber);
            let slIVD = SublistIds.INVENTORY_ASSIGNMENT, recSubIVD;
            let inventorydetailavail = recIvt.getSublistValue({
                sublistId: slIvt,
                fieldId: 'inventorydetailavail',
                line: line
            });
            if (inventorydetailavail === true || inventorydetailavail === 'T') {
                recSubIVD = recIvt.getSublistSubrecord({sublistId: slIvt, fieldId: 'inventorydetail', line: line});
                let lcIVD = recSubIVD.getLineCount(slIVD);
                let quantityHeader = recSubIVD.getValue('quantity');
                for (let iass = 0; iass < lcIVD; iass++) {
                    let receiptinventorynumber = recSubIVD.getSublistValue({
                        sublistId: slIVD,
                        fieldId: 'receiptinventorynumber',
                        line: iass
                    });
                    if (!listIssueIvn.includes(receiptinventorynumber)) {
                        recSubIVD.removeLine({sublistId: slIVD, line: iass});
                        lcIVD--;
                        iass--;
                    } else {
                        let quantity = recSubIVD.getSublistValue({
                            sublistId: slIVD,
                            fieldId: 'quantity',
                            line: iass
                        });
                        if (quantity > quantityHeader && quantityHeader > 0) {
                            quantity = quantityHeader;
                        }
                        //phải set lại quantity thi mới tính lại inventory detail quantity
                        recSubIVD.setSublistValue({
                            sublistId: slIVD,
                            fieldId: 'quantity',
                            line: iass,
                            value: quantity
                        });
                        quantityHeader = quantityHeader - quantity;
                    }
                }
            }
        }
        
        // const removeInventoryDetail = (recIvt, slIvt, line) => {
        //     let inventorydetailavail = recIvt.getSublistValue({
        //         sublistId: slIvt,
        //         fieldId: 'inventorydetailavail',
        //         line: line
        //     });
        //     if (inventorydetailavail === true || inventorydetailavail === 'T') {
        //         recIvt.removeSublistSubrecord({sublistId: slIvt, fieldId: 'inventorydetail', line: line});
        //     }
        // }
        
        const createInventoryDetail = (recIvt, slIvt, list_value, line) => {
            if (!list_value) return;
            
            let slIVD = SublistIds.INVENTORY_ASSIGNMENT, recSubIVD;
            let inventorydetailavail = recIvt.getSublistValue({
                sublistId: slIvt,
                fieldId: 'inventorydetailavail',
                line: line
            });
            if (inventorydetailavail === true || inventorydetailavail === 'T') {
                recSubIVD = recIvt.getSublistSubrecord({sublistId: slIvt, fieldId: 'inventorydetail', line: line});
                let lcIVD = recSubIVD.getLineCount(slIVD);
                let listIvd = [];
                for (let iass = 0; iass < lcIVD; iass++) {
                    listIvd.push(recSubIVD.getSublistValue({
                        sublistId: slIVD,
                        fieldId: 'receiptinventorynumber',
                        line: iass
                    }));
                    //recSubIVD.removeLine({sublistId: slIVD, line: 0});
                }
                let lineIvd = lcIVD;
                for (let objT of list_value) {
                    if (listIvd.includes(objT.receiptinventorynumber)) {
                        continue; // nếu đã tồn tại thì không thêm nữa
                    }
                    recSubIVD.setSublistValue({
                        sublistId: slIVD,
                        fieldId: 'receiptinventorynumber',
                        value: objT.receiptinventorynumber,
                        line: lineIvd
                    });
                    if (objT.binnumber) {
                        recSubIVD.setSublistValue({
                            sublistId: slIVD,
                            fieldId: 'binnumber',
                            value: objT.binnumber,
                            line: lineIvd
                        });
                    }
                    if (objT.inventorystatus) {
                        recSubIVD.setSublistValue({
                            sublistId: slIVD,
                            fieldId: 'inventorystatus',
                            value: objT.inventorystatus,
                            line: lineIvd
                        });
                    }
                    if (objT.expirationdate) {
                        recSubIVD.setSublistValue({
                            sublistId: slIVD,
                            fieldId: 'expirationdate',
                            value: typeof objT.expirationdate === 'string' ? format.parse({
                                value: objT.expirationdate,
                                type: format.Type.DATE
                            }) : objT.expirationdate,
                            line: lineIvd
                        });
                    }
                    recSubIVD.setSublistValue({
                        sublistId: slIVD,
                        fieldId: 'quantity',
                        value: objT.quantity,
                        line: lineIvd
                    });
                    lineIvd++;
                }
            }
        }
        
        const makeListItemItr = (recItr, slIt, listItemItf) => {
            let lcItItf = recItr.getLineCount(slIt);
            for (let j = 0; j < lcItItf; j++) {
                let line = recItr.getSublistValue({sublistId: slIt, fieldId: 'line', line: j});
                let orderline = recItr.getSublistValue({sublistId: slIt, fieldId: 'orderline', line: j});
                let quantity = recItr.getSublistValue({sublistId: slIt, fieldId: 'quantity', line: j});
                let location = recItr.getSublistValue({sublistId: slIt, fieldId: 'location', line: j});
                let rate = recItr.getSublistValue({sublistId: slIt, fieldId: 'rate', line: j});
                let recSubIvd = recItr.getSublistSubrecord({sublistId: slIt, fieldId: 'inventorydetail', line: j});
                let inventorydetail = null;
                if (recSubIvd) {
                    inventorydetail = [];
                    let lcSubIvd = recSubIvd.getLineCount(SublistIds.INVENTORY_ASSIGNMENT);
                    for (let i = 0; i < lcSubIvd; i++) {
                        inventorydetail.push({
                            receiptinventorynumber: recSubIvd.getSublistValue({
                                sublistId: SublistIds.INVENTORY_ASSIGNMENT,
                                fieldId: 'receiptinventorynumber',
                                line: i
                            }),
                            quantity: recSubIvd.getSublistValue({
                                sublistId: SublistIds.INVENTORY_ASSIGNMENT,
                                fieldId: 'quantity',
                                line: i
                            }),
                            binnumber: recSubIvd.getSublistValue({
                                sublistId: SublistIds.INVENTORY_ASSIGNMENT,
                                fieldId: 'binnumber',
                                line: i
                            }),
                            inventorystatus: recSubIvd.getSublistValue({
                                sublistId: SublistIds.INVENTORY_ASSIGNMENT,
                                fieldId: 'inventorystatus',
                                line: i
                            }),
                            expirationdate: recSubIvd.getSublistValue({
                                sublistId: SublistIds.INVENTORY_ASSIGNMENT,
                                fieldId: 'inventorystatus',
                                line: i
                            })
                        });
                    }
                }
                listItemItf.push({line, orderline, quantity, location, rate, inventorydetail});
            }
        }
        
        const removeLineLine = (recVb, slIt, listLineRm) => {
            let lLRemove = listLineRm.length;
            let lcItVb, line;
            for (let j = 0; j < lLRemove; j++) {
                lcItVb = recVb.getLineCount(slIt);
                for (let i = lcItVb - 1; i >= 0; i--) {
                    line = recVb.getSublistValue({sublistId: slIt, fieldId: 'line', line: i});
                    if (listLineRm[j] === line) {
                        recVb.removeLine({sublistId: slIt, line: i});
                        lcItVb = lcItVb - 1;
                    }
                }
            }
        }
        
        const getListItemsInventoryDetail = (libRep, listItrIds) => {
            let sqlIivd = `select tl.transaction transactionid, t.tranid, tl.createdfrom, tl.item, tl.location, ordertl.id orderline, ass.transactionline line, t.exchangerate, t.entity,
                tl.units, nvl(ass.quantity,tl.quantity) quantity, (tl.rate/nvl(t.exchangerate,1)) rate, ass.inventorynumber, ivn.inventorynumber inventorynumber_display, ass.bin binnumber, BUILTIN.DF(ass.bin) binnumber_display, ass.inventorystatus, ivn.expirationdate
                from transactionline tl
                join transaction t on tl.transaction = t.id
                join transactionline ordertl on tl.createdfrom = ordertl.transaction and tl.custcol_scv_ori_lineid = ordertl.custcol_scv_ori_lineid
                left join inventoryassignment ass on ass.transaction = tl.transaction and ass.transactionline = tl.id
                left join inventorynumber ivn on ass.inventorynumber = ivn.id
                where tl.transaction in (${listItrIds.join(',')})
            `;
            let listDataItemInventoryDetail = [];
            libRep.doSearchSqlAll(listDataItemInventoryDetail, sqlIivd, []);
            return listDataItemInventoryDetail;
        }
        
        const doCreateVendorBillMultiItemReceipt = (alasql, objEntity, listEntityItrIds, listItemsInventoryDetail, listPoItems, options) => {
            let recBill = record.create({
                type: record.Type.VENDOR_BILL,
                isDynamic: true,
                defaultValues: {
                    customform: FormIds.VENDOR_BILL_MULTI_ITR,
                    //inventorylocation: locationIds
                }
            });
            let slItem = SublistIds.ITEM;
            recBill.setValue({fieldId: 'entity', value: objEntity.entity});
            recBill.setValue({fieldId: 'subsidiary', value: objEntity.subsidiary});
            recBill.setText({fieldId: 'trandate', text: options.trandate});
            recBill.setValue({fieldId: 'postingperiod', value: options.postingperiod});
            recBill.setValue({fieldId: 'currency', value: objEntity.currency});
            recBill.setValue({fieldId: 'exchangerate', value: listItemsInventoryDetail.filter(o => String(o.entity) === String(objEntity.entity))[0].exchangerate});
            
            let listPoIds = alasql("select distinct dt.createdfrom from ? dt where dt.entity = ?", [listEntityItrIds, objEntity.entity]);
            listPoIds.forEach(objPo => {
                let listItemItr = listItemsInventoryDetail.filter(o => String(o.createdfrom) === String(objPo.createdfrom));
                if (listItemItr.length > 0) {
                    let listGroupItemPo = alasql("select dt.createdfrom, dt.item, dt.units, dt.orderline, dt.rate, sum(Number(dt.quantity || 0)) quantity from ? dt group by dt.createdfrom, dt.item, dt.units, dt.orderline, dt.rate", [listItemItr]);
                    listGroupItemPo.forEach(objItem => {
                        let objPoItem = listPoItems.find(o => String(o.internalid) === String(objItem.createdfrom) && String(o.line) === String(objItem.orderline));
                        recBill.selectNewLine({sublistId: slItem});
                        recBill.setCurrentSublistValue({sublistId: slItem, fieldId: 'custcol_scv_created_from', value: objItem.createdfrom});
                        //recBill.setCurrentSublistValue({sublistId: slItem, fieldId: 'custcol_scv_list_itr', value: objItem.transactionid});
                        recBill.setCurrentSublistValue({sublistId: slItem, fieldId: 'item', value: objItem.item});
                        recBill.setCurrentSublistValue({sublistId: slItem, fieldId: 'units', value: objItem.units});
                        recBill.setCurrentSublistValue({
                            sublistId: slItem,
                            fieldId: 'taxcode',
                            value: objPoItem.taxcode
                        });
                        recBill.setCurrentSublistValue({
                            sublistId: slItem,
                            fieldId: 'quantity',
                            value: objItem.quantity
                        });
                        recBill.setCurrentSublistValue({sublistId: slItem, fieldId: 'rate', value: objItem.rate});
                        
                        // recBill.setCurrentSublistValue({
                        //     sublistId: slItem,
                        //     fieldId: 'billreceipts',
                        //     value: objItem.transactionid
                        // });
                        recBill.setCurrentSublistValue({
                            sublistId: slItem,
                            fieldId: 'orderdoc',
                            value: objItem.createdfrom
                        });
                        recBill.setCurrentSublistValue({
                            sublistId: slItem,
                            fieldId: 'orderline',
                            value: objItem.orderline
                        });
                        
                        let listInventoryDetail = listItemItr.filter(o => String(o.createdfrom) === String(objItem.createdfrom) && String(o.orderline) === String(objItem.orderline)
                            && o.units === objItem.units && o.rate === objItem.rate && (o.inventorynumber || o.binnumber || o.inventorystatus));
                        
                        let listItrTranId = Array.from(new Set(listInventoryDetail.map(o => o.tranid)));
                        recBill.setCurrentSublistValue({sublistId: slItem, fieldId: 'custcol_scv_bill_itr', value: listItrTranId.join(',')});
                        recBill.setCurrentSublistValue({
                            sublistId: slItem,
                            fieldId: 'location',
                            value: listInventoryDetail[0].location
                        });
                        /*recBill.setCurrentSublistValue({
                            sublistId: slItem,
                            fieldId: 'inventorydetailreq',
                            value: false
                        });
                        recBill.setCurrentSublistValue({
                            sublistId: slItem,
                            fieldId: 'inventorydetailavail',
                            value: false
                        });*/
                        removeCurrentInventoryDetail(recBill, slItem);
                        createCurrentInventoryDetail(recBill, slItem, listInventoryDetail);
                        
                        recBill.commitLine({sublistId: slItem});
                    });
                }
            });
            
            let vendorBillId = recBill.save();
            let listItrIds = Array.from(new Set(listEntityItrIds.map(o => o.internalid)));
            try {
                submitFieldRelatedTransaction(listItrIds, vendorBillId);
            } catch (e) {
                log.error('Cannot update multi Item Receipt related transaction', {
                    itemReceiptIds: listItrIds,
                    vendorBillId,
                    error: e
                });
            }
            return vendorBillId;
        }
        
        const removeCurrentInventoryDetail = (recBill, slItem) => {
            let inventorydetailavail = recBill.getCurrentSublistValue({
                sublistId: slItem,
                fieldId: 'inventorydetailavail'
            });
            if (inventorydetailavail === true || inventorydetailavail === 'T') {
                recBill.removeCurrentSublistSubrecord({sublistId: slItem, fieldId: 'inventorydetail'});
            }
        }
        
        const createCurrentInventoryDetail = (recBill, slItem, listInventoryDetail) => {
            if (!listInventoryDetail) return;
            
            let slIVD = SublistIds.INVENTORY_ASSIGNMENT, recSubIVD;
            let inventorydetailavail = recBill.getCurrentSublistValue({
                sublistId: slItem,
                fieldId: 'inventorydetailavail'
            });
            if (inventorydetailavail === true || inventorydetailavail === 'T') {
                recSubIVD = recBill.getCurrentSublistSubrecord({sublistId: slItem, fieldId: 'inventorydetail'});
                let lcIVD = recSubIVD.getLineCount(slIVD);
                for (let iass = 0; iass < lcIVD; iass++) {
                    recSubIVD.removeLine({sublistId: slIVD, line: 0});
                }
                //let binnumber = listInventoryDetail[0].binnumber;
                let inventorystatus = listInventoryDetail[0].inventorystatus;
                for (let objT of listInventoryDetail) {
                    recSubIVD.selectNewLine({sublistId: slIVD});
                    recSubIVD.setCurrentSublistValue({
                        sublistId: slIVD,
                        fieldId: 'receiptinventorynumber',
                        value: objT.inventorynumber_display,
                    });
                    
                    try {
                        if (objT.binnumber) {
                            recSubIVD.setCurrentSublistValue({
                                sublistId: slIVD,
                                fieldId: 'binnumber',
                                value: objT.binnumber,
                            });
                        }
                    } catch (e) {
                        recSubIVD.setCurrentSublistValue({
                            sublistId: slIVD,
                            fieldId: 'binnumber',
                            value: '',
                        });
                    }
                    
                    try {
                        if (objT.inventorystatus) {
                            recSubIVD.setCurrentSublistValue({
                                sublistId: slIVD,
                                fieldId: 'inventorystatus',
                                value: objT.inventorystatus,
                            });
                        }
                    } catch (e) {
                        if (inventorystatus) {
                            recSubIVD.setCurrentSublistValue({
                                sublistId: slIVD,
                                fieldId: 'inventorystatus',
                                value: inventorystatus,
                            });
                        }
                    }
                    
                    if (objT.expirationdate) {
                        recSubIVD.setCurrentSublistText({
                            sublistId: slIVD,
                            fieldId: 'expirationdate',
                            text: objT.expirationdate,
                        });
                    }
                    recSubIVD.setCurrentSublistValue({
                        sublistId: slIVD,
                        fieldId: 'quantity',
                        value: objT.quantity,
                    });
                    recSubIVD.commitLine({sublistId: slIVD});
                }
            }
        }
        
        const buildDataVendorBillFromItemReceipt = (alasql, libRep, listDataCheck, listEntityPo) => {
            let listEntityItrIds = alasql("select distinct dt.entity, dt.internalid, dt.createdfrom from ? dt join ? et on dt.entity = et.entity and dt.subsidiary = et.subsidiary and dt.currency = et.currency", [listDataCheck, listEntityPo]);
            let listItrIds = alasql("select distinct dt.internalid from ? dt", [listEntityItrIds]);
            let listPoIds = alasql("select distinct dt.createdfrom from ? dt", [listEntityItrIds]);
            let listItemsInventoryDetail = getListItemsInventoryDetail(libRep, listItrIds.map(o => (o.internalid)));
            let filterPo = [{name: 'internalid', operator: 'anyof', values: listPoIds.map(o => (o.createdfrom))}];
            let listPoItems = [];
            libRep.doSearchSSRangeLabelId(SavedSearchId.ITR_PURCHASE_ITEM, 1000, listPoItems, filterPo);
            
            return {listEntityItrIds, listItemsInventoryDetail, listPoItems}
        }
        
        const createVendorBillFromItemReceipt = (alasql, libRep, listDataCheck, listEntityPo, options) => {
            let {
                listEntityItrIds,
                listItemsInventoryDetail,
                listPoItems
            } = buildDataVendorBillFromItemReceipt(alasql, libRep, listDataCheck, listEntityPo);
            listEntityPo.forEach(objEntity => {
                doCreateVendorBillMultiItemReceipt(alasql, objEntity, listEntityItrIds.filter(o => o.entity === objEntity.entity), listItemsInventoryDetail, listPoItems, options);
            });
        }
        
        const createDataTemp = (strContent) => {
            let recDataTemp = record.create({type: RecordType.DATA_TEMP});
            recDataTemp.setValue({fieldId: 'custrecord_scv_data_temp_content', value: strContent});
            return recDataTemp.save();
        }
        
        const lookupDataTemp = (dataTempId) => {
            return search.lookupFields({
                type: RecordType.DATA_TEMP,
                id: dataTempId,
                columns: ['custrecord_scv_data_temp_content']
            });
        }
        
        return {
            RecordType,
            Type,
            SavedSearchId,
            doCreateVendorBill,
            getListItemsInventoryDetail,
            doCreateVendorBillMultiItemReceipt,
            buildDataVendorBillFromItemReceipt,
            createVendorBillFromItemReceipt,
            createDataTemp,
            lookupDataTemp
        };
        
    });
