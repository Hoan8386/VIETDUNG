/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  22 Nov 2024         Huy Pham			    Init, create file, Tính toán phân bổ trọng lượng nâng hạ trong sản xuất, from mr.Bính(https://app.clickup.com/t/86cx40ye7)
 *  19 Dec 2024         Huy Pham                Updatte chức năng tự mapping asb, from mr.Bính(https://app.clickup.com/t/86cx40ye7?comment=90160080579394)
 *  23 Dec 2024         Huy Pham                Thay đổi logic lưu history , from mr.Bính(https://app.clickup.com/t/86cx40ye7?comment=90160081199408)
 *  24 Dec 2024         Huy Pham                Bổ sung logic Group Lifting/Lowering, from mr.Bính(meeting)
 */
/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/runtime', 'N/record', 'N/file',
    '../olib/alasql/alasql.min@1.7.3',
    
    '../cons/scv_cons_queue_job.js',
    '../cons/scv_cons_assemblybuild',
    '../cons/scv_cons_allocated_ab_lift_lower.js',
    '../cons/scv_cons_err_file.js',
],
    
    (runtime, record, file,
        alasql,

        constQueueJob,
        constAssemblyBuild,
        constAllocatedAbLiftLower,
        constErrFile
        ) => {

        const getInputData = (inputContext) => {
            let curScript = runtime.getCurrentScript();

            let paramsInput = curScript.getParameter({name : "custscript_scv_mr_liftmat_allocate_param"});
                
            paramsInput = !!paramsInput ? JSON.parse(paramsInput) : {};
            
            let dataFileId = paramsInput.dataFileId;
            if(!dataFileId) return [];

            let jsonFile = file.load({id: dataFileId});
            let contents = jsonFile.getContents();
            let objResContents = JSON.parse(contents)

            let arrAsb = objResContents.arrAsb;
            let arrResult = objResContents.arrAsb;

            let msg = "Start Date: " + (new Date()).toISOString();
            msg += "\nUpdate: " + arrResult.length + " (records)";

            if(arrResult.length == 0){
                msg = (!!msg ? "\n" : "") +  "Result: 0 (records)";
                msg += "\nEnd Date: " + (new Date()).toISOString();
            }
            try{
                let arrrLiftLowerGroup = alasql(`SELECT DISTINCT liftId, lowerId FROM ?`, [arrAsb]);
                for(let i = 0; i < arrrLiftLowerGroup.length; i++){
                    let objLiftLower = arrrLiftLowerGroup[i];
    
                    let arrAsbId = arrAsb.filter(e => e.liftId == objLiftLower.liftId
                        && e.lowerId == objLiftLower.lowerId
                    );
                    arrAsbId = alasql(`SELECT DISTINCT internalid FROM ? `, [arrAsbId]).map(e => e.internalid);
    
                    let arrLiftId = objLiftLower.liftId.split(",");
                    let arrLowerId = objLiftLower.lowerId.split(",");

                    for(let j = 0; j < arrLiftId.length; j++){
                        let liftId = arrLiftId[j];
                        let lowerId = arrLowerId[j]||"";

                        record.submitFields({
                            type: 'customrecord_scv_lifting_mat_history',
                            id: liftId, 
                            values: {
                                custrecord_scv_lift_mat_document_related: lowerId,
                                custrecord_scv_lift_mat_ab_related: arrAsbId
                            },
                            options: {
                                enableSourcing: false, ignoreMandatoryFields : true
                            } 
                        })
                    }

                    constAllocatedAbLiftLower.deleteByLiftLowerHeader(objLiftLower.liftId);
                }
            }
            catch(err){
                msg += "\nError update Lifting/Lowering Material history: " + err.message;
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
                constAssemblyBuild.allocateComponent(objValueInput.internalid, objValueInput.components);
                objResReduce.value = "T";

                constAllocatedAbLiftLower.allocateComponent(objValueInput.liftId, objValueInput.components);
            }
            catch(err){
                log.error("ERROR: Try-Catch-map", {objValueInput: objValueInput, err: err});

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
                    let arrUpdate = arrValue.filter(e => e == "T");
                    let arrError = arrValue.filter(e => e == "F");
                    let msg = "Response: Update " + arrUpdate.length + " (records); Error " + arrError.length + " (records)";
                    
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
