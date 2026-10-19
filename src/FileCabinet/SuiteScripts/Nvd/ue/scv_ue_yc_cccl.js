/**
 * Nội dung: 
 * Key:
 * * =======================================================================================
 *  Date                Author                  Description
 *  16 Dec 2024         Huy Pham	    		Init & create file, Sinh số chứng chỉ chất lượng, from mr.NĐHuy(https://app.clickup.com/t/86cxax85q)
 *  */
/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/search',
    '../cons/scv_cons_seqnumber.js'
],
    /**
 * @param{search} search
 */
    (search, 
        constSeqNumber
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

            if(["create", "edit"].includes(triggerType)){
                let newRec = scriptContext.newRecord;

                constSeqNumber.genNumberChungChiChatLuong(newRec);
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
            
        }

        return {
            //beforeLoad, 
            beforeSubmit, 
            // afterSubmit
        }

    });
