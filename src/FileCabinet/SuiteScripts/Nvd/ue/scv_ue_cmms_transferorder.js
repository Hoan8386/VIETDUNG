/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/format', 'N/record', 'N/runtime', 'N/search',
        '../lib/scv_lib_cmms.js', '../lib/scv_lib_function.js'],
    
    (format, record, runtime, search, libCmms, libFunc) => {
        /**
         * Defines the function definition that is executed before record is loaded.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @param {Form} scriptContext.form - Current form
         * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
         * @since 2015.2
         */
        const beforeLoad = (scriptContext) => {
            let tgType = scriptContext.type;
            let newRecord = scriptContext.newRecord;
            let recType = newRecord.type;
            if (tgType === scriptContext.UserEventType.CREATE) {
                if (recType === record.Type.TRANSFER_ORDER) {
                    let request = scriptContext.request;
                    if (request && request.parameters && request.parameters.cmms_wo_action === record.Type.TRANSFER_ORDER) {
                        let currentUser = runtime.getCurrentUser();
                        newRecord.setValue('subsidiary', currentUser.subsidiary);
                        newRecord.setValue('custbody_scv_cmms_workorder', request.parameters.scbd_id);
                        newRecord.setValue('custbody_scv_cmms_plan', request.parameters.khbd_id);
                        if (request.parameters.khbd_id) {
                            let recScbd = record.load({
                                type: libCmms.CmmsRecordType.KE_HOACH_BAO_DUONG,
                                id: request.parameters.khbd_id
                            });
                            setSublistValueItemTransferOrderFromKhbd(newRecord, recScbd);
                        } else if (request.parameters.scbd_id) {
                            let recScbd = record.load({
                                type: libCmms.CmmsRecordType.SUA_CHUA_BAO_DUONG,
                                id: request.parameters.scbd_id
                            });
                            setSublistValueItemTransferOrderFromScbd(newRecord, recScbd);
                        }
                    }
                }
            }
        }
        
        const setSublistValueItemTransferOrderFromScbd = (newRecord, recScbd) => {
            let lcBudget = recScbd.getLineCount({sublistId: libCmms.CmmsSublistId.SCBD_DU_TOAN});
            let dateNow = format.format({type: format.Type.DATE, value: libCmms.getDateNow(7)});
            for (let i = 0; i < lcBudget; i++) {
                let itemId = recScbd.getSublistValue({
                    sublistId: libCmms.CmmsSublistId.SCBD_DU_TOAN,
                    fieldId: 'custrecord_scv_cmms_bg_item',
                    line: i
                });
                if (itemId) {
                    let lkItem = search.lookupFields({
                        type: search.Type.ITEM,
                        id: itemId,
                        columns: ['islotitem', 'usebins', 'stockunit', 'upccode']
                    });
                    newRecord.setSublistValue({
                        sublistId: libCmms.CmmsSublistId.ITEM,
                        fieldId: 'item',
                        line: i,
                        value: itemId
                    });
                    newRecord.setSublistValue({
                        sublistId: libCmms.CmmsSublistId.ITEM, fieldId: 'quantity', line: i,
                        value: recScbd.getSublistValue({
                            sublistId: libCmms.CmmsSublistId.SCBD_DU_TOAN,
                            fieldId: 'custrecord_scv_cmms_bg_estimatequantity',
                            line: i
                        })
                    });
                    newRecord.setSublistValue({
                        sublistId: libCmms.CmmsSublistId.ITEM,
                        fieldId: 'units',
                        line: i,
                        value: lkItem.stockunit[0]?.value
                    });
                    newRecord.setSublistValue({
                        sublistId: libCmms.CmmsSublistId.ITEM,
                        fieldId: 'custcol_scv_tc_item_code',
                        line: i,
                        value: lkItem.upccode
                    });
                    newRecord.setSublistValue({
                        sublistId: libCmms.CmmsSublistId.ITEM,
                        fieldId: 'expectedshipdate',
                        line: i,
                        value: dateNow
                    });
                    newRecord.setSublistValue({
                        sublistId: libCmms.CmmsSublistId.ITEM,
                        fieldId: 'expectedreceiptdate',
                        line: i,
                        value: dateNow
                    });
                    if (lkItem.islotitem === true) {
                        newRecord.setSublistValue({
                            sublistId: libCmms.CmmsSublistId.ITEM,
                            fieldId: 'inventorydetailreq',
                            line: i,
                            value: true
                        });
                        newRecord.setSublistValue({
                            sublistId: libCmms.CmmsSublistId.ITEM,
                            fieldId: 'inventorydetailavail',
                            line: i,
                            value: true
                        });
                    }
                }
            }
        }
        
        const setSublistValueItemTransferOrderFromKhbd = (newRecord, recKhbd) => {
            let listBgPlanLineFieldIds = ['custrecord_scv_cmms_bg_item', 'custrecord_scv_cmms_bg_estimatequantity', 'custrecord_scv_cmms_bg_unit'];
            let listToFromPlan = libFunc.getSublistValueLine(recKhbd, libCmms.CmmsSublistId.KHBD_BG_PLAN, listBgPlanLineFieldIds);
            if (!listToFromPlan.length) return;
            listToFromPlan = listToFromPlan.map(o => {return {
                item: o.custrecord_scv_cmms_bg_item,
                quantity: o.custrecord_scv_cmms_bg_estimatequantity,
                unit: o.custrecord_scv_cmms_bg_unit
            }});
            
            let dateNow = format.format({type: format.Type.DATE, value: libCmms.getDateNow(7)});
            let line = 0;
            for (let objPlan of listToFromPlan) {
                if (objPlan.item) {
                    let lkItem = search.lookupFields({
                        type: search.Type.ITEM,
                        id: objPlan.item,
                        columns: ['islotitem', 'usebins', 'stockunit', 'upccode']
                    });
                    newRecord.setSublistValue({
                        sublistId: libCmms.CmmsSublistId.ITEM,
                        fieldId: 'item',
                        line: line,
                        value: objPlan.item
                    });
                    newRecord.setSublistValue({
                        sublistId: libCmms.CmmsSublistId.ITEM,
                        fieldId: 'quantity',
                        line: line,
                        value: objPlan.quantity
                    });
                    newRecord.setSublistValue({
                        sublistId: libCmms.CmmsSublistId.ITEM,
                        fieldId: 'units',
                        line: line,
                        value: objPlan.unit || lkItem.stockunit[0]?.value
                    });
                    newRecord.setSublistValue({
                        sublistId: libCmms.CmmsSublistId.ITEM,
                        fieldId: 'custcol_scv_tc_item_code',
                        line: line,
                        value: lkItem.upccode
                    });
                    newRecord.setSublistValue({
                        sublistId: libCmms.CmmsSublistId.ITEM,
                        fieldId: 'expectedshipdate',
                        line: line,
                        value: dateNow
                    });
                    newRecord.setSublistValue({
                        sublistId: libCmms.CmmsSublistId.ITEM,
                        fieldId: 'expectedreceiptdate',
                        line: line,
                        value: dateNow
                    });
                    if (lkItem.islotitem === true) {
                        newRecord.setSublistValue({
                            sublistId: libCmms.CmmsSublistId.ITEM,
                            fieldId: 'inventorydetailreq',
                            line: line,
                            value: true
                        });
                        newRecord.setSublistValue({
                            sublistId: libCmms.CmmsSublistId.ITEM,
                            fieldId: 'inventorydetailavail',
                            line: line,
                            value: true
                        });
                    }
                    line++;
                }
            }
        }
        
        return {beforeLoad}
        
    });
