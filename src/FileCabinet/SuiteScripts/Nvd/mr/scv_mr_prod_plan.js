/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  03 Jan 2025         Huy Pham			    Init, create file, Production Planning, from mr.Bính(https://app.clickup.com/t/86cxfpxbb)
 */
/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/runtime', 
    
    '../cons/scv_cons_queue_job.js',
    '../sl/scv_sl_prod_plan.js',
],
    
    (runtime,

        constQueueJob,
        slProdPlan
        ) => {

        const getInputData = (inputContext) => {
            let curScript = runtime.getCurrentScript();

            let paramsInput = curScript.getParameter({name : "custscript_scv_mr_prod_plan_param"});
                
            paramsInput = !!paramsInput ? JSON.parse(paramsInput) : {};
            
            let arrResult = paramsInput.data||[];

            let msg = "Start Date: " + (new Date()).toISOString();
            msg += "\nUpdate: " + arrResult.length + "";

            if(arrResult.length == 0){
                msg = (!!msg ? "\n" : "") +  "Result: 0";
                msg += "\nEnd Date: " + (new Date()).toISOString();
            }

            constQueueJob.updateNoteQueueJob(curScript.id, curScript.deploymentId, msg);

            return arrResult;
        }

        const map = (mapContext) => {
            let objResInput = JSON.parse(mapContext.value);

            let curScript = runtime.getCurrentScript();
            let objResReduce = {
                key: curScript.id,
                value: "UPDATE"
            };

            try{
                slProdPlan.updateProductionSchedule(objResInput);
            }
            catch(err){
                log.error("ERROR: Try-Catch-map", {objResInput: objResInput, err: err});

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
                    let arrCreate = arrValue.filter(e => e == "UPDATE");
                    let arrError = arrValue.filter(e => e == "ERROR");

                    let msg = "Response: Updated " + arrCreate.length + "; Error " + arrError.length + ";";
                    
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
