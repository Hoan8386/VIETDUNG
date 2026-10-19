/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['../lib/scv_lib_function', 'N/record'],
    (libFn, record) => {
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
            try {
                if (scriptContext.type === 'copy') {
                    setEmptyFieldOriLineId(scriptContext.newRecord);
                }
            } catch (e) {
                log.error('Error beforeLoad', e);
            }
        }

        function setEmptyFieldOriLineId(curRec) {
            const objConfigData = getDataConfigGenerateOriLineId(curRec.type);
            const lc = curRec.getLineCount(objConfigData.sublistId);
            for (let i = 0; i < lc; i++) {
                curRec.setSublistValue({
                    sublistId: objConfigData.sublistId,
                    fieldId: objConfigData.fieldId,
                    line: i,
                    value: ''
                });
            }
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
            try {
                if (scriptContext.type === 'create' || scriptContext.type === 'edit') {
                    const objConfigData = getDataConfigGenerateOriLineId(scriptContext.newRecord.type);
                    libFn.generateUniqueIdForMultiLines(scriptContext.newRecord, objConfigData.sublistId, objConfigData.fieldId);
                }
            } catch (e) {
                log.error('Error beforeSubmit', e);
            }
        }

        function getDataConfigGenerateOriLineId(recordType) {
            let objConfigData = {
                fieldId: 'custcol_scv_ori_lineid',
                sublistId: 'item'
            };
            if (recordType === record.Type.INVENTORY_ADJUSTMENT) objConfigData.sublistId = 'inventory';
            return objConfigData;
        }


        /**
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const afterSubmit = (scriptContext) => {

        }

        return {beforeLoad, beforeSubmit, afterSubmit}

    });
