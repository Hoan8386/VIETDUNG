/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['../lib/scv_lib_current_code'],
    
    (libCc) => {
        
        const beforeLoad = (scriptContext) => {
            let tgType = scriptContext.type;
            if(tgType === scriptContext.UserEventType.CREATE || tgType === scriptContext.UserEventType.COPY) {
                scriptContext.newRecord.setValue('name', libCc.NAME_TOGEN);
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
            libCc.generateAndSetCode(scriptContext.newRecord, scriptContext.type);
        }
        
        return {beforeLoad, beforeSubmit}
        
    });
