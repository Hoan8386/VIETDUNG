/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  25 Feb 2025         Huy Pham			    Init, create file, Tạo hàng loạt WO từ SO, from ms.Ngọc(https://app.clickup.com/t/86cy2jttc)
 */
/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/runtime', 'N/file',
    
    '../cons/scv_cons_queue_job.js',
    '../cons/scv_cons_workorder.js'
],
    
    (runtime, file,

        constQueueJob,
        constWorkOrder
        ) => {

        const getInputData = (inputContext) => {
            let curScript = runtime.getCurrentScript();

            let paramsInput = curScript.getParameter({name : "custscript_scv_mr_so2wo_param"});
                
            paramsInput = !!paramsInput ? JSON.parse(paramsInput) : {};
            
            let dataFileId = paramsInput.dataFileId;
            if(!dataFileId) return [];

            let jsonFile = file.load({id: dataFileId});
            let contents = jsonFile.getContents();
            let objResJSON = JSON.parse(contents);
            let arrResult = objResJSON.arrLine;

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
                constWorkOrder.createWorkOrderBySO(objValueInput);
                objResReduce.value = "T";
            }
            catch(err){
                log.error("ERROR: Try-Catch-map", {err: err});

                objResReduce.value = "F";
                constQueueJob.updateNoteQueueJob(curScript.id, curScript.deploymentId, "Error: " + err.message);
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
