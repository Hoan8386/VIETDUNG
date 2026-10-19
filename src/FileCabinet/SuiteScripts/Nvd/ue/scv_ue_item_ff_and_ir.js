/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(
    ['N/search', 'N/url',
        '../lib/scv_lib_function.js'],
    //, '../cons/scv_cons_so_gia_thanh_toan.js' , constSoGiaTT
    (search, url, libFunc) => {
        
        const TTPheDuyet = {
            DA_XAC_THUC: '22',
            CHO_KTT_OR_PPKT_XAC_NHAN: '25',
            CHO_KTTT_XAC_NHAN: '26',
        }
        
        const beforeLoad = (scriptContext) => {
            let tgType = scriptContext.type;
            let newRecord = scriptContext.newRecord;
            
            if (newRecord.type === "itemfulfillment") {
                // constSoGiaTT.initLoadGiaThanhToanFromSO(scriptContext);
            }
            if (tgType === 'view') {
                let form = scriptContext.form;
                libFunc.addCssPleaseWait(form);
                let ordertype = newRecord.getValue('ordertype');
                if (ordertype === 'SalesOrd') {
                    let related_transaction = newRecord.getValue('custbody_scv_related_transaction') || [];
                    if (related_transaction.length === 0) {
                        let createdfrom = newRecord.getValue('createdfrom');
                        let lkT = search.lookupFields({type: 'salesorder', id: createdfrom, columns: ['status']});
                        let status = lkT.status[0].value;
                        if (status === 'pendingBilling' || status === 'pendingBillingPartFulfilled' || status === 'pendingFulfillment') {
                            if (sINV(newRecord.id) === 0) {
                                addButtonITFToINV(form, newRecord.id, ordertype, createdfrom, status);
                            }
                        }
                    }
                } else if (ordertype === 'PurchOrd') {
                    let related_transaction = newRecord.getValue('custbody_scv_related_transaction') || [];
                    let tt_phe_duyet = newRecord.getValue('custbody_scv_tt_phe_duyet');
                    if (!isRelatedTransaction(related_transaction, search.Type.VENDOR_BILL) && Object.values(TTPheDuyet).includes(tt_phe_duyet)) {
                        let createdfrom = newRecord.getValue('createdfrom');
                        let lkT = search.lookupFields({type: 'transaction', id: createdfrom, columns: ['status']});
                        let status = lkT.status[0].value;
                        if (status === 'pendingBilling' || status === 'partiallyReceived' || status === 'pendingBillPartReceived') {
                            let lVb = sVB(newRecord.id);
                            if (lVb === 0) {
                                addButtonIRToVb(form, newRecord.id, ordertype, createdfrom, status);
                            }
                        }
                    }
                }
                addButonCreateJournal(form, newRecord);
            }
        }
        
        const isRelatedTransaction = (related_transaction, recordtype) => {
            let isRelated = false;
            for (let relatedId of related_transaction) {
                let lkTransaction = search.lookupFields({
                    type: search.Type.TRANSACTION,
                    id: relatedId,
                    columns: ['recordtype']
                });
                if (lkTransaction.recordtype === recordtype) {
                    isRelated = true;
                    break;
                }
            }
            return isRelated;
        }
        
        const addButonCreateJournal = (form, newRecord) => {
            if (newRecord.type === search.Type.ITEM_RECEIPT) {
                let landedcostamount2 = newRecord.getValue('landedcostamount2');
                let landedcostamount3 = newRecord.getValue('landedcostamount3');
                let landedcostamount5 = newRecord.getValue('landedcostamount5');
                
                let related_transaction = newRecord.getValue('custbody_scv_related_transaction');
                if (!related_transaction && related_transaction.length > 0 && (landedcostamount2 > 0 || landedcostamount3 > 0 || landedcostamount5 > 0)) {
                    let isAddButonCreateJournal = true;
                    for (let relatedId of related_transaction) {
                        let lkTransaction = search.lookupFields({
                            type: search.Type.TRANSACTION,
                            id: relatedId,
                            columns: ['recordtype']
                        });
                        if (lkTransaction.recordtype === search.Type.JOURNAL_ENTRY) {
                            isAddButonCreateJournal = false;
                            break;
                        }
                    }
                    if (isAddButonCreateJournal) {
                        let viewUrl = '/app/accounting/transactions/journal.nl?whence=&createdfromid=' + newRecord.id + '&createdrectype=' + newRecord.type;
                        form.addButton({
                            id: 'custpage_bt_create_journal',
                            label: 'Create Journal',
                            functionName: "window.location.replace('" + viewUrl + "');"
                        });
                    }
                }
            }
        }
        
        const sINV = (itfid) => {
            let f = [['custbody_scv_created_transaction', 'anyof', itfid]];
            let s = search.create({
                type: 'invoice',
                filters: f,
                columns: ['internalid']
            });
            let r = s.run().getRange(0, 1000);
            return r.length;
        }
        
        const addButtonITFToINV = (form, internalId, ordertype, createdfrom, status) => {
            let urlItfToInv = url.resolveScript({
                scriptId: 'customscript_scv_sl_transform_itf_to_inv',
                deploymentId: 'customdeploy_scv_sl_transform_itf_to_inv',
                returnExternalUrl: false,
                params: {
                    itfid: internalId,
                    ordertype,
                    createdfrom,
                    status
                }
            });
            let idButtonCreateBill = 'custpage_bt_itf_to_inv';
            libFunc.addButtonReplace(form, idButtonCreateBill, 'Create Bill', urlItfToInv);
        }
        
        const sVB = (itfid) => {
            let nativeLinkCount = sVbByNativeItemReceiptLink(itfid);
            if (nativeLinkCount > 0) return nativeLinkCount;

            return sVbByCreatedReference(itfid, getItemReceiptTranId(itfid));
        }

        const sVbByNativeItemReceiptLink = (itfid) => {
            try {
                let s = search.create({
                    type: search.Type.ITEM_RECEIPT,
                    filters: [
                        ['internalid', 'anyof', itfid],
                        'AND',
                        ['applyingtransaction.type', 'anyof', 'VendBill']
                    ],
                    columns: [
                        search.createColumn({name: 'internalid', join: 'applyingtransaction'})
                    ]
                });
                let r = s.run().getRange(0, 1);
                return r.length;
            } catch (e) {
                log.error('Cannot search Vendor Bill by native Item Receipt link', {
                    itemReceiptId: itfid,
                    error: e
                });
                return 0;
            }
        }

        const getItemReceiptTranId = (itfid) => {
            let lkIr = search.lookupFields({
                type: search.Type.ITEM_RECEIPT,
                id: itfid,
                columns: ['tranid']
            });
            return lkIr.tranid || '';
        }

        const sVbByCreatedReference = (itfid, tranid) => {
            let referenceFilters = [
                ['custbody_scv_created_transaction', 'anyof', itfid],
                'OR',
                ['custcol_scv_list_itr', 'anyof', itfid]
            ];
            if (tranid) {
                referenceFilters.push('OR', ['custcol_scv_bill_itr', 'contains', tranid]);
            }

            let s = search.create({
                type: 'vendorbill',
                filters: [
                    referenceFilters,
                    'AND',
                    ['mainline', 'is', 'F']
                ],
                columns: ['internalid']
            });
            let r = s.run().getRange(0, 1000);
            return r.length;
        }
        
        const addButtonIRToVb = (form, internalId, ordertype, createdfrom, status) => {
            let urlIrToVb = url.resolveScript({
                scriptId: 'customscript_scv_sl_transform_ir_to_vb',
                deploymentId: 'customdeploy_scv_sl_transform_ir_to_vb',
                returnExternalUrl: false,
                params: {
                    irid: internalId,
                    ordertype,
                    createdfrom,
                    status
                }
            });
            let idButtonCreateBill = 'custpage_bt_ir_to_vb';
            libFunc.addButtonReplace(form, idButtonCreateBill, 'Create Bill', urlIrToVb);
        }
        
        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (scriptContext) => {
            if (scriptContext.type === scriptContext.UserEventType.EDIT) {
                //Loi bi mat landed cost tren item receipt o ban 2026.1 khi edit tu form view cua record do, code duoi day de fix loi do
                let newRecord = scriptContext.newRecord;
                if(newRecord.type === search.Type.ITEM_RECEIPT) {
                    let slItem = 'item', slLandedCost = 'landedcostdata';
                    let listDataLineItem = libFunc.getSublistValueLine(newRecord, slItem, ['itemreceive', 'tracklandedcost']);
                    for (let objLineItem of listDataLineItem) {
                        if (objLineItem.itemreceive === true && objLineItem.tracklandedcost === 'T') {
                            let recLdc = newRecord.getSublistSubrecord({
                                sublistId: slItem,
                                fieldId: 'landedcost',
                                line: objLineItem.idx
                            });
                            let listDataLandedCost = libFunc.getSublistValueLine(recLdc, slLandedCost, ['costcategory', 'amount']);
                            let lcLine = recLdc.getLineCount(slLandedCost);
                            for (let j = 0; j < lcLine; j++) {
                                recLdc.removeLine({sublistId: slLandedCost, line: 0});
                            }
                            
                            let lineIdx = 0;
                            for (let objLandedCost of listDataLandedCost) {
                                recLdc.insertLine({sublistId: slLandedCost, line: lineIdx});
                                recLdc.setSublistValue({
                                    sublistId: slLandedCost,
                                    fieldId: 'costcategory',
                                    value: objLandedCost.costcategory,
                                    line: lineIdx
                                });
                                recLdc.setSublistValue({
                                    sublistId: slLandedCost,
                                    fieldId: 'amount',
                                    value: objLandedCost.amount,
                                    line: lineIdx
                                });
                                lineIdx++;
                            }
                        }
                    }
                }
            }
        }
        
        return {
            beforeLoad,
            beforeSubmit
        }
    });
