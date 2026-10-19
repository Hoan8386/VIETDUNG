/**
 * Nội dung: Import Record
 * Key word:
 * =======================================================================================
 *  Date                Author                  Description
 * 08 Nov 2024		    Huy Pham                Init & create file, move from Adv, from mr.Việt(https://app.clickup.com/t/86cx0fvqd)
 */
/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget','N/runtime', 'N/search', 'N/file', 
    '../lib/scv_lib_function.js', '../lib/scv_lib_common_html.js',
    '../lib/scv_lib_import.js',
    
    '../cons/scv_cons_import.js',
    '../cons/scv_cons_importline.js',
    '../cons/scv_cons_queue_job.js',
],
    
    (serverWidget,runtime, search, file, 
        lbf, libHtml,
        libImport,
        
        constImport,
        constImportLine,
        constQueueJob
    ) => {
        const CUR_SCRIPT = Object.freeze({
            ID: "customscript_scv_sl_import",
            DEPLOYID_UI: "customdeploy_scv_sl_import",
            DEPLOYID_DATA: "customdeploy_scv_sl_import_data"
        })
        const JOB_SCRIPT = {
            ID: "customscript_scv_ss_import",
            DEPLOYID: "customdeploy_scv_ss_import",
            PARAMSID: "custscript_scv_ss_import_param"
        }
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            let request = scriptContext.request;
            let response = scriptContext.response;
            let params = request.parameters;
            let curScript = runtime.getCurrentScript();

            if(curScript.deploymentId == CUR_SCRIPT.DEPLOYID_DATA) {
                let objResponse = {data: []};

                switch(params.action){
                    case "importDataUpload":
                        objResponse.data = importDataUpload(JSON.parse(params.body));
                    break;
				}

                scriptContext.response.setHeader({
                    name: 'Content-Type',
                    value: 'application/json'
                });
                scriptContext.response.write(JSON.stringify(objResponse));
            } else {
                if(request.method === "GET") {
                    let MainForm = onCreateFormUI(params);
                    
                    response.writePage(MainForm.form);
                }
            }
        }

        const onCreateFormUI = (_params) => {
            let mainForm = serverWidget.createForm({title: "Import Data", hideNavBar: _params.isPopup == "T" ? true : false});
            mainForm.clientScriptModulePath = '../cs/scv_cs_sl_import.js';

            let mainGrp = lbf.addFieldGroup(mainForm, "fieldgrp_main","Main");
            let uploadGrp = lbf.addFieldGroup(mainForm, "fieldgrp_upload", "Upload");
            let dataUploadTab = addTab(mainForm, "tab_uploaddata", "Data Update");

            let objPopupQueue = constQueueJob.getPopupQueueJobStatus(JOB_SCRIPT.ID, JOB_SCRIPT.DEPLOYID);

            mainForm.addButton({id: "custpage_btn_import", label: "Import", functionName: "onImportResult()"});
            mainForm.addButton({id: "custpage_btn_mapping", label: "Mapping", functionName: "onMappingField()"});
            mainForm.addButton({id: "custpage_btn_download", label: "Download", functionName: "onDownload()"});
            mainForm.addButton({id: "custpage_btn_refresh", label: "Refresh", functionName: "onRefresh()"});
            mainForm.addButton({id: "custpage_btn_queue", label: "Queue Job", functionName: `openStatusQueue('${objPopupQueue.url}', ${objPopupQueue.width}, ${objPopupQueue.height}, '${objPopupQueue.title}')`});
            if(_params.isPopup == "T"){
                mainForm.addButton({id: "custpage_btn_cancel", label: "Cancel", functionName: "onCancelPopup()"});
            }

            libHtml.addClassBtnSubmit(mainForm, "custpage_btn_import");

            let custpage_import = mainForm.addField({
                id: 'custpage_import',
                type: 'select',
                label: 'Import Record',
                source: 'customrecord_scv_import',
                container: mainGrp.id
            }).setHelpText({help: "Field custom: Import Record", showInlineForAssistant: true});
            custpage_import.isMandatory = true;

            let custpage_chk_importheader = mainForm.addField({
                id: 'custpage_chk_importheader',
                type: 'checkbox',
                label: 'Header',
                container: mainGrp.id
            }).setHelpText({help: "Field custom: Import Header", showInlineForAssistant: true});

            let custpage_import_line = mainForm.addField({
                id: 'custpage_import_line',
                type: 'multiselect',
                label: 'Import Line',
                container: mainGrp.id
            }).setHelpText({help: "Field custom: Import Line", showInlineForAssistant: true});

            let custpage_rectype = mainForm.addField({
                id: 'custpage_rectype',
                type: 'text',
                label: 'Rec Type',
                container: mainGrp.id
            }).updateDisplayType({displayType: 'HIDDEN'});

            let custpage_recid = mainForm.addField({
                id: 'custpage_recid',
                type: 'text',
                label: 'Rec ID',
                container: mainGrp.id
            }).updateDisplayType({displayType: 'HIDDEN'})

            if(_params.isPopup == "T"){
                custpage_import.updateDisplayType({displayType: 'DISABLED'});
                custpage_rectype.defaultValue = _params.custpage_rectype;
                custpage_recid.defaultValue = _params.custpage_recid;
                if(!_params.custpage_chk_importheader) _params.custpage_chk_importheader = "F";

                let arrImport = constImport.getDataSourceByCriteriaQuery({custrecord_scv_import_rectype: _params.custpage_rectype});
                if(arrImport.length == 0) throw "Record chưa được setup chức năng Import!";

                let objImport = arrImport[0];

                _params.custpage_import = objImport.id;
            }else{
                if(!_params.custpage_chk_importheader) _params.custpage_chk_importheader = "T";
            }

            if(!!_params.custpage_import){
                custpage_import.defaultValue = _params.custpage_import
            }

            custpage_chk_importheader.defaultValue = _params.custpage_chk_importheader;

            if(!!_params.custpage_import){
                constImportLine.initLoadFieldByCriteriaQuery(custpage_import_line, {
                    custrecord_scv_import_line_rectype: _params.custpage_import??""
                }, false);
            }

            if(!!_params.custpage_import_line){
                custpage_import_line.defaultValue = _params.custpage_import_line.split(",")
            }

            mainForm.addField({
                id: "custpage_uploadfile",
                type: "inlinehtml",
                label: "HTML",
                container: uploadGrp.id
            }).defaultValue = includesUploadFileHtml();

            let custpage_grid_library = mainForm.addField({
				id: 'custpage_grid_library',
				type: "inlinehtml",
				label: 'Grid Library'
			});
            custpage_grid_library.defaultValue = includeHtmlCustomDxGrid();

            let custpage_grid_upload = mainForm.addField({
				id: 'custpage_grid_upload',
				type: "inlinehtml",
				label: 'Result Upload',
				container: dataUploadTab.id
			});
            custpage_grid_upload.defaultValue = `<div id="grdDataUpload"></div>`;

            return {form: mainForm};
        }

        const importDataUpload = (_reqBody) =>{
            let objResponse = {
                isSuccess: true,
                message: "",
                internalid: "",
                recordType: "",
                taskId: ""
            }
            
            try{
                let recType = search.lookupFields({
                    type: constImport.TYPE, id: _reqBody.custpage_import, 
                    columns: "custrecord_scv_import_rectype"
                }).custrecord_scv_import_rectype;

                objResponse.recordType = recType;

                let arrFieldTemplate = libImport.getListFieldTemplateColumn(_reqBody.custpage_import, _reqBody.custpage_import_line, _reqBody.custpage_chk_importheader);
                let arrResult = libImport.convertRawDataToRecordJson(_reqBody.arrLines, _reqBody.custpage_import, _reqBody.custpage_import_line, _reqBody.custpage_chk_importheader);
                log.error("huy-arrResult",arrResult)
                if(_reqBody.isPopup == "T"){
                    for(let i = 0; i < arrResult.length; i++){
                        let objRes = arrResult[i];
                        objRes.internalid = _reqBody.custpage_recid;
    
                        libImport.importDataFromRecordJson(objRes, arrFieldTemplate, recType);
                    }

                    objResponse.internalid = _reqBody.custpage_recid;
                }
                else if(arrResult.length <= 5){
                    let arrInternalId = [];

                    for(let i = 0; i < arrResult.length; i++){
                        let objRes = arrResult[i];
                        if(!!_reqBody.custpage_recid){
                            objRes.internalid = _reqBody.custpage_recid;
                        }
    
                        let createRecId = libImport.importDataFromRecordJson(objRes, arrFieldTemplate, recType);

                        arrInternalId.push(createRecId);
                    }
                    objResponse.internalid = arrInternalId.toString();
                }
                else{
                    //TO-DO: Tạo file lưu JSON, excute map/reduce xử lý, vì data import có thể đến 1k row
                    let jsonFileId = libImport.createFileJson(file, arrResult, arrFieldTemplate, recType);
                    //let test = libImport.getContentsFileJson(file, jsonFileId);

                    let objParamsInput = {
                        fileImportId: jsonFileId
                    }

                    //HuyPQ: Không được sử dụng map/reduce
                    let queueJobId = constQueueJob.createQueueJob("SCHEDULED_SCRIPT", JOB_SCRIPT.ID, JOB_SCRIPT.DEPLOYID, JOB_SCRIPT.PARAMSID, JSON.stringify(objParamsInput));
                    let processingQueueJobId = constQueueJob.processQueueJob(JOB_SCRIPT.ID, JOB_SCRIPT.DEPLOYID);

                    /* let mrTask = task.create({
                        taskType: task.TaskType.MAP_REDUCE,
                        scriptId: "customscript_scv_mr_import",
                        deploymentId: "customdeploy_scv_mr_import",
                        params: {
                            custscript_scv_import_fileid: jsonFileId
                        }
                    });
            
                    let taskId = mrTask.submit();

                    objResponse.taskId = taskId; */
                }

            }catch(err){
                objResponse.isSuccess = false;
                objResponse.message = err.message;

                log.error("ERROR: Try-Catch: importDataUpload", err)
            }

            return objResponse;
        }
        
        const includesUploadFileHtml = () =>{
            return `
            <div style="margin-top: 16px">
                <input id="scvUpload" type=file name="files[]" accept=".xls, .xlsx, .csv" required>
            </div>
            `;
        }

        const includeHtmlCustomDxGrid = () =>{
            return `
                ${libHtml.includeLibaryExternalHtml()}
                ${libHtml.includeTagStyleHtml()}
            `;
        }

        function addTab(_form, _id,_label){
            var _obj = {id: _id, label: _label}
            _form.addTab(_obj);
            return _obj;
        }

        return {onRequest}

    });