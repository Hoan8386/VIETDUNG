/**
 * Nội dung: Import Record
 * Key word:
 * =======================================================================================
 *  Date                Author                  Description
 * 08 Nov 2024		    Huy Pham                Init & create file, move from Adv, from mr.Việt(https://app.clickup.com/t/86cx0fvqd)
 */
/**
* @NApiVersion 2.1
* @NScriptType ScheduledScript
*/
define(['N/file', 'N/runtime', 
    '../lib/scv_lib_import.js',
    '../cons/scv_cons_queue_job.js'
],function (file, runtime, 
    libImport,
    constQueueJob
) {

    const execute = function(context){
        let curScript = runtime.getCurrentScript();

        let paramsInput = curScript.getParameter({name : "custscript_scv_ss_import_param"});
            
        paramsInput = !!paramsInput ? JSON.parse(paramsInput) : {};

        let objResContents = libImport.getContentsFileJson(file, paramsInput.fileImportId);
        let arrResultRecord = objResContents.arrResultRecord;

        let msg_note = "Start Date: " + (new Date()).toISOString();
        msg_note += "\nCreate: " + arrResultRecord.length + " (records)";

        constQueueJob.updateNoteQueueJob(curScript.id, curScript.deploymentId, msg_note);

        let countCreated = 0, countErr = 0;
        for(let i = 0; i < arrResultRecord.length; i++){
            try{
                libImport.importDataFromRecordJson(arrResultRecord[i], objResContents.arrFieldTemplate, objResContents.recordType);

                countCreated++;
            }catch(err){
                constQueueJob.updateNoteQueueJob(curScript.id, curScript.deploymentId, "Error: " + err.message);

                countErr++;

                log.error("ERROR: TRY-CATCH", err.message)
            }
            
        }

        msg_note = "Response: Create " + countCreated + " (records);  Error " + countErr + " (records)";
        msg_note += "\nEnd Date: " + (new Date()).toISOString()
        constQueueJob.completeQueueJob(curScript.id, curScript.deploymentId, msg_note);
    }

    return {
        execute
    };
});