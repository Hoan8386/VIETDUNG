/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/runtime',
        '../common/scv_common_inventory_number.js'],
    
    (runtime, cmInvNumber) => {
        
        /**
         * afterSubmit function - Runs on a Transaction record.
         * @param {Object} scriptContext
         */
        const afterSubmit = (scriptContext) => {
            if (scriptContext.type !== scriptContext.UserEventType.CREATE && scriptContext.type !== scriptContext.UserEventType.EDIT) {
                if (scriptContext.newRecord.type === 'inventorynumber') {
                    log.error('user event type', scriptContext.type);
                    log.error('newRecord.id', scriptContext.newRecord.id);
                    log.error('runtime.executionContext', runtime.executionContext);
                }
                return;
            }
            
            const newRecord = scriptContext.newRecord;
            const recType = newRecord.type;
            if (recType !== 'inventorynumber') {
                if (recType === 'itemreceipt' && newRecord.getValue('ordertype') !== 'PurchOrd') {
                    return;
                }
                cmInvNumber.updateInventoryNumber(newRecord.id);
            } else {
                if (runtime.executionContext === runtime.ContextType.USER_INTERFACE) {
                    const oldRecord = scriptContext.oldRecord;
                    const FIELD_CORE_WEIGHT = 'custitemnumber_scv_core_weight';
                    const FIELD_COLOR_SERIES = 'custitemnumber_scv_item_num_color_seri';
                    const FIELD_MEMO = 'memo';
                    
                    const newMemo = newRecord.getValue({fieldId: FIELD_MEMO});
                    const newCoreWeight = newRecord.getValue({fieldId: FIELD_CORE_WEIGHT});
                    const newColorSeries = newRecord.getValue({fieldId: FIELD_COLOR_SERIES});
                    const import_date = newRecord.getValue({fieldId: 'custitemnumber_scv_import_date'});
                    
                    if (newMemo || newCoreWeight || newColorSeries || import_date) {
                        cmInvNumber.createLogRecord({
                            custrecord_scv_inl_item: newRecord.getValue('item'),
                            custrecord_scv_inl_lot_num_id: newRecord.id,
                            custrecord_scv_inl_lot: newRecord.getValue('inventorynumber'),
                            custrecord_scv_inl_old_memo: oldRecord.getValue({fieldId: FIELD_MEMO}),
                            custrecord_scv_inl_new_memo: newMemo,
                            custrecord_scv_inl_old_tll: oldRecord.getValue({fieldId: FIELD_CORE_WEIGHT}),
                            custrecord_scv_inl_new_tll: newCoreWeight,
                            custrecord_scv_inl_old_color_seri: oldRecord.getValue({fieldId: FIELD_COLOR_SERIES}),
                            custrecord_scv_inl_new_color_seri: newColorSeries,
                            custrecord_scv_ir_receipt: import_date
                        });
                    }
                } else {
                    log.error('user event type', scriptContext.type);
                    log.error('newRecord.id', scriptContext.newRecord.id);
                    log.error('runtime.executionContext', runtime.executionContext);
                }
            }
        }
        
        return {
            afterSubmit
        };
    });