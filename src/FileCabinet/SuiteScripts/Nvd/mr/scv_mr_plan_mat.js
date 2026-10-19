/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  12 Dec 2024         Huy Pham			    Init, create file, Planning Materials, from mr.Hải(https://app.clickup.com/t/86cx7mw5a)
 */
/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/runtime', 
    
    '../cons/scv_cons_queue_job.js',
    '../sl/scv_sl_plan_mat.js',
],
    
    (runtime,

        constQueueJob,
        slPlanMat
        ) => {

        const getInputData = (inputContext) => {
            let curScript = runtime.getCurrentScript();

            let paramsInput = curScript.getParameter({name : "custscript_scv_mr_plan_mat_param"});
                
            paramsInput = !!paramsInput ? JSON.parse(paramsInput) : {};
            
            let arrResult = slPlanMat.getDataParamsPurPlanExcute(paramsInput);

            let msg = "Start Date: " + (new Date()).toISOString();
            msg += "\nCreate: " + arrResult.length + "";

            if(arrResult.length == 0){
                msg = (!!msg ? "\n" : "") +  "Result: 0";
                msg += "\nEnd Date: " + (new Date()).toISOString();
            }

            constQueueJob.updateNoteQueueJob(curScript.id, curScript.deploymentId, msg);

            return arrResult;
        }

        const map = (mapContext) => {
            let objParamsExcute = JSON.parse(mapContext.value);

            let curScript = runtime.getCurrentScript();
            let objResReduce = {
                key: curScript.id,
                value: "CREATE"
            };

            try{
                let arrDataSource = slPlanMat.getDataSource(objParamsExcute);
                if(arrDataSource.length > 0){
                    for(let i = 0; i < arrDataSource.length; i++){
                        slPlanMat.createPurchasePlan(arrDataSource[i]);
                    }
    
                    objResReduce.value = "CREATE";
                }
                else{
                    objResReduce.value = "OTHER";
                }
            }
            catch(err){
                log.error("ERROR: Try-Catch-map", {objParamsExcute: objParamsExcute, err: err});

                objResReduce.value = "ERROR";
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
                    let arrCreate = arrValue.filter(e => e == "CREATE");
                    let arrError = arrValue.filter(e => e == "ERROR");
                    let arrOther = arrValue.filter(e => e == "OTHER");

                    let msg = "Response: Created " + arrCreate.length + "; Error " + arrError.length + "; Other " + arrOther.length;
                    
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
