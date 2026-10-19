/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['../lib/scv_lib_cmms.js'],
    
    (libCmms) => {
        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (scriptContext) => {
            let tgType = scriptContext.type;
            if(tgType === scriptContext.UserEventType.CREATE || tgType === scriptContext.UserEventType.EDIT || tgType === scriptContext.UserEventType.COPY) {
                let newRecord = scriptContext.newRecord;
                let options = {
                    sublistId: libCmms.CmmsSublistId.CHI_TIET_MAY_DINH_MUC,
                    fieldIdQuantity: 'custrecord_scv_cmms_bom_quantity',
                    fieldIdRate: 'custrecord_scv_cmms_bom_rate',
                    fieldIdAmount: 'custrecord_scv_cmms_bom_amount',
                    line: null
                };
                libCmms.setSublistValueAmount(newRecord, options);
            }
        }

        return {beforeSubmit}

    });
