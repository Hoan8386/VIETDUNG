/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  07 Feb 2025         Huy Pham			    Init, create file, Thống kê tiêu hao hàng loạt, from mr.Bính(https://app.clickup.com/t/86cxwt5k9)
 */
/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/runtime', 'N/file',
    '../cons/scv_cons_queue_job.js',
    '../cons/scv_cons_err_file.js',
    '../cons/scv_cons_assemblybuild.js'
],
    
    (runtime, file,
        constQueueJob,
        constErrFile,
        constAssemblyBuild
        ) => {

        const getInputData = (inputContext) => {
            let curScript = runtime.getCurrentScript();

            let paramsInput = curScript.getParameter({name : "custscript_scv_mr_wo2asb_param"});
                
            paramsInput = !!paramsInput ? JSON.parse(paramsInput) : {};
            
            let dataFileId = paramsInput.dataFileId;
            if(!dataFileId) return [];

            let jsonFile = file.load({id: dataFileId});
            let contents = jsonFile.getContents();
            let arrResult = JSON.parse(contents)

            let msg = "Start Date: " + (new Date()).toISOString();
            msg += "\nCreate: " + arrResult.length + " (records)";

            if(arrResult.length == 0){
                msg = (!!msg ? "\n" : "") +  "Result: 0 (records)";
                msg += "\nEnd Date: " + (new Date()).toISOString();
            }

            constQueueJob.updateNoteQueueJob(curScript.id, curScript.deploymentId, msg);

            return arrResult;
        }

        const map = (mapContext) => {
            let objValueInput = JSON.parse(mapContext.value);

            let curScript = runtime.getCurrentScript();
            let objResReduce = {
                key: curScript.id,
                value: "T"
            };

            try{
                constAssemblyBuild.createAssemblyByWorkOrder(objValueInput);
                objResReduce.value = "T";
            }
            catch(err){
                log.error("ERROR: Try-Catch-map", {err: err});

                objResReduce.value = "F";
                constQueueJob.updateNoteQueueJob(curScript.id, curScript.deploymentId, "Error: " + err.message);

                constErrFile.createErrorFile(objValueInput, err.message);
            }

            mapContext.write(objResReduce);
        }

        const reduce = (context) => {
            let strKey = context.key;
            var arrValue = context.values;
            let curScript = runtime.getCurrentScript();

            try{
                if(strKey == curScript.id){
                    let arrCreate = arrValue.filter(e => e == "T");
                    let arrError = arrValue.filter(e => e == "F");
                    let msg = "Response: Create " + arrCreate.length + " (records); Error " + arrError.length + " (records)";
                    
                    constQueueJob.updateNoteQueueJob(curScript.id, curScript.deploymentId, msg);
                }
            }catch(err){
                log.error("ERROR: Try-Catch-reduce", err);
            }
        }

        const summarize = (summary) => {
            try{
                let curScript = runtime.getCurrentScript();
                let msg = "End Date: " + (new Date()).toISOString();

                constQueueJob.completeQueueJob(curScript.id, curScript.deploymentId, msg);
            }catch(err){
                log.error("ERROR: Try-Catch-summarize", err);
            }
        }

        return {getInputData, map, reduce, summarize}

    });
