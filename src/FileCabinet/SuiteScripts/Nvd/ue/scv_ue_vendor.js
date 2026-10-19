/**
 * Nội dung: 
 * Key:
 * * =======================================================================================
 *  Date                Author                  Description
 *  28 Oct 2024         Khanh Tran	    		Init, create file. Sinh vendor code from mr. Hải(https://app.clickup.com/t/86cwwtmmz)
 *  */
/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/search',
    '../cons/scv_cons_vendor.js'
],
    /**
 * @param{search} search
 */
    (search, 
        constVendor
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
            constVendor.genVendorCode(scriptContext);
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

        return {
            beforeLoad, 
            beforeSubmit, 
            // afterSubmit
        }

    });
