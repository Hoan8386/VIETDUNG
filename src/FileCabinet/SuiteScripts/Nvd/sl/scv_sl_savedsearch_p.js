/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  03 Jul 2025         Huy Pham                Init & create file
 */
/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define([
    'N/runtime', 'N/search',
    '../cons/scv_cons_form.js',
],
    (
        runtime, search,
        constForm,
    ) => {
        const CUR_SCRIPT = {
            ID: "customscript_scv_sl_savedsearch_p",
            DEPLOYID_UI: "customdeploy_scv_sl_savedsearch_p",
            DEPLOYID_DATA: "customdeploy_scv_sl_savedsearch_p_svc"
        }
        const onRequest = (context) => {
            constForm.setContext(context);
            constForm.setServiceScript(CUR_SCRIPT.ID, CUR_SCRIPT.DEPLOYID_DATA);

            let request = context.request;
            let params = request.parameters;

            let curScript = runtime.getCurrentScript();

            if(curScript.deploymentId == CUR_SCRIPT.DEPLOYID_DATA){
                let objResponse = {data: []};
                
                switch(params.action){
                    case "getSavedSearchByID":
						objResponse.data = getSavedSearchByID(params);
						break;
                    case "submitResult_Import":
						objResponse.data = submitResult_Import(params);
						break;
				}

				constForm.write(objResponse);
            }else{
                if(context.request.method == "GET"){
                    constForm.createForm({title: "Saved Search", hideNavBar: true}, "../cssl/scv_cs_sl_savedsearch_p.js");

                    if(params.custpage_action == "import"){
                        onCreateFormUI_Import(params);
                    }
                    else if(params.custpage_action == "loadbyid"){
                        onCreateFormUI_LoadByID(params);
                    }

                    constForm.writePage();
                }
            }
        }

        const onCreateFormUI_LoadByID = (_params) =>{
            constForm.addButton({id: "custpage_btn_submit", label: "Submit", functionName: "submitResult_LoadByID()"},{
                styleSubmit: true
            });

            constForm.addField({
                id: 'custpage_fromurl', label: 'URL (includes Saved Search ID - customsearch)', 
                type: "url"
            });

            constForm.addField({
                id: 'custpage_uploadfile', label: 'Upload File (includes Saved Search ID - customsearch)', 
                type: "inlinehtml"
            }, false, {
                defaultValue: includesUploadFileHtml_LoadByID()
            });

            let resultTab = constForm.addTab({id: "tab_result", label: "Result"});

            constForm.addGridDx({
                id: "custpage_sl_result",
                type: "grid",
                label: "Result",
                tab: resultTab.id,
                columns: [
                    {dataField: "scriptid", caption: "ID", dataType: "string", minWidth: 200},
                ],
                optionsDx: {
                    width: "100%",
                }
            });
        }

        const onCreateFormUI_Import = (_params) =>{
            constForm.addButton({id: "custpage_btn_submit", label: "Submit", functionName: "submitResult_Import()"},{
                styleSubmit: true
            });

            constForm.addField({
                id: 'custpage_uploadfile', label: 'Upload File JSON', 
                type: "inlinehtml"
            }, false, {
                defaultValue: includesUploadFileHtml()
            });

            let stringTab = constForm.addTab({id: "tab_string", label: "String"});

            constForm.addGridDx({
                id: "custpage_sl_result",
                type: "grid",
                label: "Result",
                tab: stringTab.id,
                columns: [
                    {dataField: "chk_imported", caption: "Imported", dataType: "checkbox", width: 80},
                    {dataField: "import_msg", caption: "message", dataType: "string", minWidth: 150},
                    {dataField: "type", caption: "Type", dataType: "string", width: 300},
                    {dataField: "scriptid", caption: "ID", dataType: "string", width: 300},
                    {dataField: "searchtitle", caption: "Title", dataType: "string", width: 300},
                    {dataField: "ispublic", caption: "Public", dataType: "boolean", width: 120},
                    {dataField: "size_columns", caption: "Size Columns", dataType: "number", width: 120},
                    {dataField: "contents", caption: "Contents", dataType: "string", minWidth: 200},
                ],
                optionsDx: {
                    width: "100%",
                    wordWrapEnabled: false
                }
            });
        }
        
        const includesUploadFileHtml_LoadByID = () =>{
            return `
            <div style="margin-top: 16px">
                <input id="scvUploadByID" type=file multiple name="files[]" accept=".json, .js, .txt, .xml" required>
            </div>
            `;
        }

        const includesUploadFileHtml = () =>{
            return `
            <div style="margin-top: 16px">
                <input id="scvUpload" type=file name="files[]" accept=".json" required>
            </div>
            `;
        }

        const getSavedSearchByID = (_params) => {
            let objRes = null;
            
            try{
                objRes = search.load(_params.scriptid);
                objRes = JSON.parse(JSON.stringify(objRes));

                objRes.title = search.lookupFields({
                    type: "savedsearch", id: objRes.id, columns: "title"
                }).title;
            }
            catch(e){
            }

            return objRes;
        }

        const submitResult_Import = (_params) => {
            let objResponse = {
                msg: "Success",
                newInternalId: "",
            };

            try{
                let objResSearch = JSON.parse(_params.contents);
                if(!objResSearch.id){
                    objResSearch.id = objResSearch.scriptid||objResSearch.scriptId;
                }

                let filters = objResSearch.filters ?? [];
                filters.forEach(objFilter => {
                    if(!!objFilter.summarytype){
                        objFilter.summary = objFilter.summarytype;
                    }
                });
                
                objResponse.newInternalId = search.create(objResSearch).save();
            }
            catch(e){
                objResponse.msg = e.message;
            }

            return objResponse;
        }

        return {onRequest}

    });
