/**
 * @NApiVersion 2.1
 */
define(['N/query', 'N/record', 'N/runtime'],
    
    (query, record, runtime) => {
        
        const updateInventoryNumber = (transactionId) => {
            const inventoryNumbers = getInventoryDetails(transactionId);
            let objKeyInvNumbers = {};
            inventoryNumbers.forEach(invNumber => {
                const invNumberId = invNumber.id;
                if (!objKeyInvNumbers[invNumberId]) {
                    objKeyInvNumbers[invNumberId] = invNumber;
                    if (invNumber.custrecord_scv_inl_new_memo !== invNumber.memo
                        || invNumber.custrecord_scv_inl_new_tll !== invNumber.custitemnumber_scv_core_weight
                        || invNumber.custrecord_scv_inl_new_color_seri !== invNumber.custitemnumber_scv_item_num_color_seri
                        || invNumber.custrecord_scv_ir_receipt !== invNumber.custitemnumber_scv_import_date) {
                        record.submitFields({
                            type: 'inventorynumber',
                            id: invNumberId,
                            values: {
                                memo: invNumber.custrecord_scv_inl_new_memo,
                                custitemnumber_scv_core_weight: invNumber.custrecord_scv_inl_new_tll,
                                custitemnumber_scv_item_num_color_seri: invNumber.custrecord_scv_inl_new_color_seri,
                                custitemnumber_scv_import_date: invNumber.custrecord_scv_ir_receipt
                            }
                        });
                    }
                }
            });
        }
        
        const getInventoryDetails = (transactionId) => {
            const suiteQl = `
                SELECT
                    IN.id,
                    IN.memo,
                    IN.item,
                    IN.inventorynumber,
                    IN.custitemnumber_scv_item_num_color_seri,
                    IN.custitemnumber_scv_core_weight,
                    IN.custitemnumber_scv_import_date,
                    inl.custrecord_scv_inl_new_memo,
                    inl.custrecord_scv_inl_new_tll,
                    inl.custrecord_scv_inl_new_color_seri,
                    inl.custrecord_scv_ir_receipt
                FROM inventoryassignment ass
                JOIN inventorynumber IN ON ass.inventorynumber = IN.id
                join customrecord_scv_inl inl on IN.id = inl.custrecord_scv_inl_lot_num_id
                WHERE ass.transaction = ?
                and ass.quantity > 0
                and (inl.custrecord_scv_inl_new_memo IS NOT NULL
                    OR inl.custrecord_scv_inl_new_tll IS NOT NULL
                    OR inl.custrecord_scv_inl_new_color_seri IS NOT NULL
                    OR inl.custrecord_scv_ir_receipt IS NOT NULL)
                order by inl.custrecord_scv_inl_lot_last_change_time desc
            `;
            
            try {
                const pagedData = query.runSuiteQL({
                    query: suiteQl,
                    params: [transactionId]
                });
                return pagedData.asMappedResults();
            } catch (e) {
                log.error({
                    title: 'Lỗi khi chạy SuiteQL trong getInventoryDetails',
                    details: e
                });
                return [];
            }
        }
        
        const createLogRecord = (options) => {
            const logRec = record.create({type: 'customrecord_scv_inl'});
            for (let key in options) {
                logRec.setValue({fieldId: key, value: options[key]});
            }
            logRec.setValue({fieldId: 'custrecord_scv_inl_lot_last_change_time', value: new Date()});
            logRec.setValue({fieldId: 'custrecord_scv_inl_event_change', value: runtime.getCurrentUser().id});
            
            try {
                logRec.save();
            } catch (e) {
                log.error('options', options)
                log.error('(e)', e)
            }
            
        }
        
        return {updateInventoryNumber, createLogRecord}
        
    });
