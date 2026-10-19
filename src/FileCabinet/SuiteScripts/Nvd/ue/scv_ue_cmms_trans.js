/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', '../lib/scv_lib_cmms.js', '../lib/scv_lib_function.js'],
    (record, libCmms, libFunc) => {
        
        /**
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const afterSubmit = (scriptContext) => {
            if (scriptContext.type === scriptContext.UserEventType.DELETE) {
                let oldRecord = scriptContext.oldRecord;
                let cmms_workorder = oldRecord.getValue({fieldId: 'custbody_scv_cmms_workorder'});
                let cmms_plan = oldRecord.getValue({fieldId: 'custbody_scv_cmms_plan'});
                if (cmms_workorder || cmms_plan) {
                    let recType = oldRecord.type;
                    let listItemValueLines = null;
                    if (recType === record.Type.INVENTORY_ADJUSTMENT) {
                        listItemValueLines = libFunc.getSublistValueLine(oldRecord, libCmms.CmmsSublistId.INVENTORY, ['item', 'adjustqtyby']);
                    } else if (recType === libCmms.CmmsRecordType.YEU_CAU_NHAP_XUAT) {
                        listItemValueLines = libFunc.getSublistValueLine(oldRecord, libCmms.CmmsSublistId.ITEM, ['item', 'quantity', 'custcol_scv_plan_qty']);
                    }
                    if (listItemValueLines) {
                        let {
                            recordTypeScbd,
                            sublistIdBgPlan,
                            scbdId
                        } = libCmms.getScbdInfoBgPlan({custpage_scbd: cmms_workorder, custpage_khbd: cmms_plan});
                        let recScbd = record.load({
                            type: recordTypeScbd,
                            id: scbdId
                        });
                        let lineCountWo = recScbd.getLineCount(sublistIdBgPlan);
                        for (let i = 0; i < lineCountWo; i++) {
                            let item = recScbd.getSublistValue({
                                sublistId: sublistIdBgPlan,
                                fieldId: 'custrecord_scv_cmms_bg_actualitem',
                                line: i
                            });
                            let objItemLine = listItemValueLines.find(e => e.item === item && !e.isFind);
                            if (objItemLine) {
                                objItemLine.isFind = true;
                                let quantityNhap = objItemLine.custcol_scv_plan_qty || (objItemLine.adjustqtyby > 0 ? objItemLine.adjustqtyby : 0);
                                let quantityXuat = objItemLine.quantity || (objItemLine.adjustqtyby < 0 ? Math.abs(objItemLine.adjustqtyby) : 0);
                                if (quantityNhap) {
                                    let recoveredqty = Number(recScbd.getSublistValue({
                                        sublistId: sublistIdBgPlan,
                                        fieldId: 'custrecord_scv_cmms_bg_recoveredqty',
                                        line: i
                                    }) || 0);
                                    recScbd.setCurrentSublistValue({
                                        sublistId: sublistIdBgPlan,
                                        fieldId: 'custrecord_scv_cmms_bg_recoveredqty',
                                        line: i,
                                        value: recoveredqty - quantityNhap,
                                    });
                                }
                                if (quantityXuat) {
                                    let replacementqty = Number(recScbd.getSublistValue({
                                        sublistId: sublistIdBgPlan,
                                        fieldId: 'custrecord_scv_cmms_bg_replacementqty',
                                        line: i
                                    }) || 0);
                                    recScbd.setSublistValue({
                                        sublistId: sublistIdBgPlan,
                                        fieldId: 'custrecord_scv_cmms_bg_replacementqty',
                                        line: i,
                                        value: replacementqty - quantityXuat,
                                    });
                                }
                            }
                        }
                        recScbd.save();
                    }
                }
            }
        }
        
        return {afterSubmit}
        
    });
