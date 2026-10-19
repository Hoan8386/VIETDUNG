/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  01 Mar 2025         Huy Pham                Init, create file, Chuyển chức năng sinh số phiếu nhập, phiếu xuất kho từ LSS => Refactor, from mr.Việt(https://app.clickup.com/t/86cy4pj9u)
 */
/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define([
    '../cons/scv_cons_invdocnumber.js'
],

    (
        constInvDocNumber
    ) => {
        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (scriptContext) => {
            let triggerType = scriptContext.type;

            if(["create", "edit"].includes(triggerType)){
                constInvDocNumber.updateCounter(scriptContext.newRecord);
            }
        }

        return {beforeSubmit}

    }
)
;
