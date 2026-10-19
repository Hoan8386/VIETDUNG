/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define([
    'N/record', 'N/runtime',
    '../cons/scv_cons_queue_job.js',
    '../common/scv_common_update_build.js',
], 
    (
        record, runtime,
        constQueueJob,
        commonUpdateBuild,
    ) => {

        /**
         * Defines the Scheduled script trigger point.
         * @param {Object} scriptContext
         * @param {string} scriptContext.type - Script execution context. Use values from the scriptContext.InvocationType enum.
         * @since 2015.2
         */

        const execute = (scriptContext) => {
            let curScript = runtime.getCurrentScript();
            let inputParam = commonUpdateBuild.ScheduledScript.INPUT_PARAM;

            let paramsInput = curScript.getParameter({ name: inputParam });
            paramsInput = !!paramsInput ? JSON.parse(paramsInput) : {};

            const arrBuild = paramsInput.arrBuild;

            let msg_note = "Start Date: " + (new Date()).toISOString();
            msg_note += "\nTotal Build Updated: " + arrBuild.length + " (records)";

            constQueueJob.updateNoteQueueJob(curScript.id, curScript.deploymentId, msg_note);

            for(let objBuild of arrBuild) {
                try {
                    commonUpdateBuild.updateRelatedTransBuild(objBuild, paramsInput.id);
                } catch (err) {
                    log.error("ERROR Update Related Trans Build", err);
                }
            }
    
            constQueueJob.completeQueueJob(curScript.id, curScript.deploymentId, "End Date: " + (new Date()).toISOString());
        }

        return {execute}

    });
