/**
 * Nội dung:
 * Key:
 * * =======================================================================================
 *  Date                Author                  Description
 *  04 Apr 2025         Khanh Tran	    		Init & create file. Tự động tạo WO sau khi phê duyệt OWO, from mr.Phúc(https://app.clickup.com/t/86cx2y1j1)
 *  */
/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define([
        '../cons/scv_cons_other_work_order.js',
        '../common/scv_common_check_bom_item.js'
    ],
    
    (
        constOWO,
        cmCheckBomItem
    ) => {
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
            let triggerType = scriptContext.type;
            if (triggerType === 'create') {
                //goi phan xu ly cap nhap field custcol_scv_check_bom_item
                cmCheckBomItem.setCheckBomLineItems(scriptContext.newRecord, 'item', 'custcol_scv_owo_assembly');
            }
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
            let triggerType = scriptContext.type;
            let curRec = scriptContext.newRecord;
            if (triggerType == 'edit') {
                constOWO.createMultiWOAfterApproval(curRec, scriptContext.oldRecord)
            }
        }
        
        return {
            // beforeLoad,
            beforeSubmit,
            afterSubmit
        }
        
    });
