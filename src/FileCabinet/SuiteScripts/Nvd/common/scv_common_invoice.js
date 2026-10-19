/**
 * @NApiVersion 2.1
 */
define(['N/format', 'N/record', '../lib/scv_lib_function.js'],
    
    (format, record, libFunc) => {
        
        const SublistIds = {
            ITEM: 'item',
            INVENTORY_ASSIGNMENT: 'inventoryassignment',
        }
        
        const doCreateInvoice = (options) => {
            let recITF = record.load({type: 'itemfulfillment', id: options.itfid});
            let slIt = SublistIds.ITEM;
            let listItemItf = [];
            makeListItemItf(recITF, slIt, listItemItf);
            return transformToInvoice(slIt, recITF, listItemItf, options);
        }
        
        const transformToInvoice = (slIt, recITF, listItemItf, options) => {
            let {createdfrom, trandate, postingperiod} = options;
            if (!listItemItf || listItemItf.length === 0) return null;
            
            let recINV = record.transform({
                fromType: 'salesorder',
                fromId: createdfrom,
                toType: 'invoice'
            });
            let nField = ['trandate', 'postingperiod'];
            let nFieldData = ['custbody_scv_created_transaction'];
            let rField = ['trandate', 'postingperiod'];
            
            let isdiscount = false;
            libFunc.setValue(recINV, recITF, nField, rField);
            libFunc.setValueData(recINV, nFieldData, [recITF.id]);
            if (trandate && postingperiod) {
                recINV.setValue('trandate', format.parse({value: trandate, type: format.Type.DATE}));
                recINV.setValue('postingperiod', postingperiod);
            }
            let lcItInv = recINV.getLineCount(slIt);
            
            let isRemove, listLineRm = [], listOLEx = {};
            for (let i = 0; i < lcItInv; i++) {
                let orderline = recINV.getSublistValue({sublistId: slIt, fieldId: 'orderline', line: i});
                let line = recINV.getSublistValue({sublistId: slIt, fieldId: 'line', line: i});
                let itemtype = recINV.getSublistValue({sublistId: slIt, fieldId: 'itemtype', line: i});
                let rate = recINV.getSublistValue({sublistId: slIt, fieldId: 'rate', line: i});
                let amount = recINV.getSublistValue({sublistId: slIt, fieldId: 'amount', line: i});
                if (itemtype === 'Discount') {
                    isdiscount = true;
                }
                
                isRemove = true;
                let objItf = listItemItf.find(o => o.orderline === orderline);
                if (objItf && !listOLEx[String(orderline)]) {
                    isRemove = false;
                    recINV.setSublistValue({
                        sublistId: slIt,
                        fieldId: 'location',
                        value: objItf.location,
                        line: i
                    });
                    if (!rate) {
                        recINV.setSublistValue({
                            sublistId: slIt,
                            fieldId: 'amount',
                            line: i,
                            value: amount
                        });
                    }
                    let quantity = recINV.getSublistValue({
                        sublistId: slIt,
                        fieldId: 'quantity',
                        line: i
                    });
                    if (objItf.quantity !== quantity) {
                        recINV.setSublistValue({
                            sublistId: slIt,
                            fieldId: 'quantity',
                            line: i,
                            value: objItf.quantity
                        });
                        //removeInventoryDetail(recINV, slIt, i);
                        removeLineInventoryDetailWrong(recINV, slIt, objItf.inventorydetail, i);
                        createInventoryDetail(recINV, slIt, objItf.inventorydetail, i);
                    } else {
                        removeLineInventoryDetailWrong(recINV, slIt, objItf.inventorydetail, i);
                    }
                    listOLEx[String(orderline)] = orderline;
                }
                if (isRemove) {
                    listLineRm.push(line);
                }
            }
            removeLineLine(recINV, slIt, listLineRm);
            
            let recSO = record.load({type: 'salesorder', id: createdfrom});
            let listItem = getListItemSo(recSO, slIt);
            let lcIt = recINV.getLineCount(slIt);
            
            let promotion_rate_01, promotion_rate_02, promotion_rate_03, amount, tax1amt, grossamt;
            for (let i = 0; i < lcIt; i++) {
                //let taxcode = recINV.getSublistValue({sublistId: slIt, fieldId: 'taxcode', line: i});
                let orderline = recINV.getSublistValue({sublistId: slIt, fieldId: 'orderline', line: i});
                let objItemSo = listItem.find(o => o.line === orderline);
                //Truong hop Ma so thue SO khac voi IT phai set lai khi su dung script
                recINV.setSublistValue({sublistId: slIt, fieldId: 'taxcode', line: i, value: objItemSo.taxcode});
                if (isdiscount) {
                    promotion_rate_01 = recINV.getSublistValue({
                        sublistId: slIt,
                        fieldId: 'custcol_scv_promotion_rate_01',
                        line: i
                    });
                    promotion_rate_02 = recINV.getSublistValue({
                        sublistId: slIt,
                        fieldId: 'custcol_scv_promotion_rate_02',
                        line: i
                    });
                    promotion_rate_03 = recINV.getSublistValue({
                        sublistId: slIt,
                        fieldId: 'custcol_scv_promotion_rate_03',
                        line: i
                    });
                    
                    if ((!!promotion_rate_01 || !!promotion_rate_02 || !!promotion_rate_03) && !(objItemSo.line_isfreegift === true || objItemSo.line_isfreegift === "T")) {
                        
                        amount = recINV.getSublistValue({
                            sublistId: slIt,
                            fieldId: 'quantity',
                            line: i
                        }) * recINV.getSublistValue({sublistId: slIt, fieldId: 'rate', line: i});
                        tax1amt = amount * recINV.getSublistValue({
                            sublistId: slIt,
                            fieldId: 'taxrate1',
                            line: i
                        }) / 100;
                        grossamt = amount + tax1amt;
                        if (!!promotion_rate_01) {
                            insertLineDiscount(recINV, recSO, listItem, slIt, i, objItemSo, '01', promotion_rate_01 / 100, amount, tax1amt, grossamt)
                            i++;
                            lcIt++;
                        }
                        if (!!promotion_rate_02) {
                            insertLineDiscount(recINV, recSO, listItem, slIt, i, objItemSo, '02', promotion_rate_02 / 100, amount, tax1amt, grossamt)
                            i++;
                            lcIt++;
                        }
                        if (!!promotion_rate_03) {
                            insertLineDiscount(recINV, recSO, listItem, slIt, i, objItemSo, '03', promotion_rate_03 / 100, amount, tax1amt, grossamt)
                            i++;
                            lcIt++;
                        }
                        break;
                    }
                }
                
            }
            
            return recINV.save({enableSourcing: true, ignoreMandatoryFields: true});
        }
        
        const removeLineInventoryDetailWrong = (recIvt, slIvt, list_value, line) => {
            if (!list_value) return;
            
            let listIssueIvn = list_value.map(o => o.issueinventorynumber);
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
                    let issueinventorynumber = recSubIVD.getSublistValue({
                        sublistId: slIVD,
                        fieldId: 'issueinventorynumber',
                        line: iass
                    });
                    if (!listIssueIvn.includes(issueinventorynumber)) {
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
                        fieldId: 'issueinventorynumber',
                        line: iass
                    }));
                    //recSubIVD.removeLine({sublistId: slIVD, line: 0});
                }
                let lineIvd = 0;
                for (let objT of list_value) {
                    if (listIvd.includes(objT.issueinventorynumber)) {
                        continue; // nếu đã tồn tại thì không thêm nữa
                    }
                    for (let key in objT) {
                        if (objT[key] !== undefined) {
                            recSubIVD.setSublistValue({
                                sublistId: slIVD,
                                fieldId: key,
                                value: objT[key],
                                line: lineIvd
                            });
                        }
                    }
                    lineIvd++;
                }
            }
        }
        
        const getListItemSo = (recSalesOrder, slItem) => {
            let lcItem = recSalesOrder.getLineCount(slItem);
            let listItem = [];
            for (let j = 0; j < lcItem; j++) {
                let line = recSalesOrder.getSublistValue({sublistId: slItem, fieldId: 'line', line: j});
                let quantity = recSalesOrder.getSublistValue({sublistId: slItem, fieldId: 'quantity', line: j});
                let location = recSalesOrder.getSublistValue({sublistId: slItem, fieldId: 'location', line: j});
                let taxcode = recSalesOrder.getSublistValue({sublistId: slItem, fieldId: 'taxcode', line: j});
                let taxrate1 = recSalesOrder.getSublistValue({sublistId: slItem, fieldId: 'taxrate1', line: j});
                let line_isfreegift = recSalesOrder.getSublistValue({
                    sublistId: slItem,
                    fieldId: 'custcol_scv_line_isfreegift',
                    line: j
                });
                listItem.push({
                    line,
                    quantity,
                    location,
                    taxcode,
                    taxrate1,
                    line_isfreegift,
                    idx: j
                });
            }
            return listItem;
        }
        
        const makeListItemItf = (recITF, slIt, listItemItf) => {
            let lcItItf = recITF.getLineCount(slIt);
            for (let j = 0; j < lcItItf; j++) {
                let line = recITF.getSublistValue({sublistId: slIt, fieldId: 'line', line: j});
                let orderline = recITF.getSublistValue({sublistId: slIt, fieldId: 'orderline', line: j});
                let quantity = recITF.getSublistValue({sublistId: slIt, fieldId: 'quantity', line: j});
                let location = recITF.getSublistValue({sublistId: slIt, fieldId: 'location', line: j});
                let recSubIvd = recITF.getSublistSubrecord({sublistId: slIt, fieldId: 'inventorydetail', line: j});
                let inventorydetail = null;
                if (recSubIvd) {
                    inventorydetail = [];
                    let lcSubIvd = recSubIvd.getLineCount(SublistIds.INVENTORY_ASSIGNMENT);
                    for (let i = 0; i < lcSubIvd; i++) {
                        inventorydetail.push({
                            issueinventorynumber: recSubIvd.getSublistValue({
                                sublistId: SublistIds.INVENTORY_ASSIGNMENT,
                                fieldId: 'issueinventorynumber',
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
                        });
                    }
                }
                listItemItf.push({line, orderline, quantity, location, inventorydetail});
            }
        }
        
        const insertLineDiscount = (newRecord, recSO, listItem, slIt, i, objItemSo, suffix, discountrate, amount, tax1amt, grossamt) => {
            amount = amount * discountrate;
            tax1amt = tax1amt * discountrate;
            grossamt = grossamt * discountrate;
            
            let itemdiscount = listItem.find(o => o.idx === (objItemSo.idx + 1))?.item;
            if (itemdiscount) {
                newRecord.insertLine({sublistId: slIt, line: i + 1});
                newRecord.setSublistValue({sublistId: slIt, fieldId: 'item', value: itemdiscount, line: i + 1});
                let fieldlines = ['custcol_scv_tc_item_code', 'description', 'taxcode', 'class', 'custcol_scv_line_promotion_' + suffix,
                    'custcol_scv_promotion_rate_' + suffix];
                libFunc.setSublistValueDiff(newRecord, recSO, slIt, slIt, fieldlines, fieldlines, i + 1, objItemSo.idx + 1);
                newRecord.setSublistValue({sublistId: slIt, fieldId: 'price', value: -1, line: i + 1});
                newRecord.setSublistValue({sublistId: slIt, fieldId: 'rate', value: -amount, line: i + 1});
                newRecord.setSublistValue({sublistId: slIt, fieldId: 'amount', value: -amount, line: i + 1});
                newRecord.setSublistValue({sublistId: slIt, fieldId: 'tax1amt', value: -tax1amt, line: i + 1});
                newRecord.setSublistValue({sublistId: slIt, fieldId: 'grossamt', value: -grossamt, line: i + 1});
                
                newRecord.setSublistValue({
                    sublistId: slIt,
                    fieldId: 'custcol_scv_discount_amount_' + suffix,
                    value: amount,
                    line: i
                });
                newRecord.setSublistValue({
                    sublistId: slIt,
                    fieldId: 'custcol_scv_discount_amt_af_tax',
                    value: grossamt,
                    line: i
                });
            }
            
        }
        
        const removeLineLine = (recINV, slIt, listLineRm) => {
            let lLRemove = listLineRm.length;
            let lcItInv, line;
            for (let j = 0; j < lLRemove; j++) {
                lcItInv = recINV.getLineCount(slIt);
                for (let i = lcItInv - 1; i >= 0; i--) {
                    line = recINV.getSublistValue({sublistId: slIt, fieldId: 'line', line: i});
                    if (listLineRm[j] === line) {
                        recINV.removeLine({sublistId: slIt, line: i});
                        lcItInv = lcItInv - 1;
                    }
                }
            }
        }
        
        return {doCreateInvoice}
        
    });
