/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define([
    'N/runtime',
    '../cons/scv_cons_queue_job.js',
    '../cons/scv_cons_sales_promotion.js'
],
    (
        runtime,
        constQueueJob,
        constSalesPromotion
    ) => {

        /**
         * Defines the Scheduled script trigger point.
         * @param {Object} scriptContext
         * @param {string} scriptContext.type - Script execution context. Use values from the scriptContext.InvocationType enum.
         * @since 2015.2
         */

        const ScheduledScript = {
            ID: 'customscript_scv_ss_sales_promotion_term',
            DEPLOYMENT: 'customdeploy_scv_ss_sales_promotion_term',
            INPUT_PARAM: 'custscript_scv_ss_input_sales_promotion'
        };

        const execute = (scriptContext) => {
            let curScript = runtime.getCurrentScript();

            let paramsInput = curScript.getParameter({name : ScheduledScript.INPUT_PARAM});
            paramsInput = !!paramsInput ? JSON.parse(paramsInput) : {};

            const soId = paramsInput.internalid;
            const details = paramsInput.details;
            const arrSalesPromotion = constSalesPromotion.getDataSalesPromotion(soId);

            let msg_note = "Start Date: " + (new Date()).toISOString();
            msg_note += "\nCreate or Update: " + details.length + " (records)";

            constQueueJob.updateNoteQueueJob(curScript.id, curScript.deploymentId, msg_note);

            for(let i = 0; i < details.length; i++) {
                let obj_find_sales_promotion = arrSalesPromotion.find(e => {
                    return e.custrecord_scv_spt_so_item == details[i].item && 
                        e.custrecord_scv_spt_so_ori_lineid == details[i].custcol_scv_ori_lineid &&
                        e.custrecord_scv_spt_so_detail == details[i].detail_id;
                });
                if(!!obj_find_sales_promotion) {
                    constSalesPromotion.updateSalesPromotionTermSO(obj_find_sales_promotion.id, details[i]);
                } else {
                    constSalesPromotion.createSalesPromotionTermSO(soId, details[i]);
                }
            }
    
            constQueueJob.completeQueueJob(curScript.id, curScript.deploymentId, "End Date: " + (new Date()).toISOString());
        }

        return {execute}

    });
