/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  28 Jun 2025         Huy Pham			    Init, create file
 */
/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/runtime', 'N/search',
    '../cons/scv_cons_search.js',
    '../cons/scv_cons_form.js',
],
    
    ( runtime, search,
        constSearch,
        constForm,
    ) => {
        const CUR_SCRIPT = {
            ID: "customscript_scv_sl_savedsearch",
            DEPLOYID_UI: "customdeploy_scv_sl_savedsearch",
            DEPLOYID_DATA: "customdeploy_scv_sl_savedsearch_svc"
        }
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            constForm.setContext(scriptContext);
            constForm.setServiceScript(CUR_SCRIPT.ID, CUR_SCRIPT.DEPLOYID_DATA);

            let request = scriptContext.request;
            let params = request.parameters;

            let curScript = runtime.getCurrentScript();

            if(curScript.deploymentId == CUR_SCRIPT.DEPLOYID_DATA){
                let objResponse = {data: []};
                
                switch(params.action){
                    case "getSavedSearchByID":
						objResponse.data = getSavedSearchByID(params);
					break;
                    case "getDataSavedSearchByID":
                        objResponse.data = getDataSavedSearchByID(params);
                    break;
				}

				constForm.write(objResponse);
            }else{
                if(request.method == "GET"){

                    onCreateFormUI(params);
        
                    constForm.writePage();

                }
            }
        }

        const onCreateFormUI = (_params) =>{
            constForm.createForm("Saved Search", "../cssl/scv_cs_sl_savedsearch.js");

            constForm.addButton({id: "custpage_btn_create", label: "Create", functionName: "createSavedSearch()"}, {
                styleSubmit: true
            });
            constForm.addButton({id: "custpage_btn_update", label: "Update", functionName: "updateSavedSearch()"}, {
                styleSubmit: true
            });

            constForm.addButton({id: "custpage_btn_execute", label: "Execute", functionName: "executeResultSearch()"});
            
            constForm.addButton({id: "custpage_btn_load", label: "Load Content", functionName: "loadSavedSearch()"});
            
            
            let mainGrp = constForm.addFieldGroup({id: "fieldgrp_main", label: "Điều kiện lọc"});
            let contentGrp = constForm.addTab({id: "tab_content", label: "Content"});
            let resultGrp = constForm.addTab({id: "tab_result", label: "Result Of Search"});
            let importGrp = constForm.addTab({id: "tab_import", label: "Import/Export"});

            constForm.addField({
                id: 'custpage_id', label: 'ID', type: "text", container: mainGrp.id
            }, false, {
                defaultValue: _params.custpage_id
            });

            constForm.addField({
                id: 'custpage_title', label: 'Title', type: "text", container: mainGrp.id
            }, false, {
                defaultValue: _params.custpage_title
            });

            constForm.addField({
                id: 'custpage_ispublic', label: 'Is Public', type: "checkbox", container: mainGrp.id
            }, false, {
                defaultValue: "T"
            });

            let custpage_contents = constForm.addField({
                id: 'custpage_contents', label: 'Contents', type: "longtext",  container: contentGrp.id
            }, false, {
                defaultValue: _params.custpage_contents
            });

            custpage_contents.updateDisplaySize({
                height: 50,
                width: 200
            });

            constForm.addGridDx({
                id : "custpage_sl_result",
                type : "grid",
                label : "Result",
                tab: resultGrp.id,
                columns: []
            });

            constForm.addGridDx({
                id : "custpage_sl_import",
                type : "grid",
                label : "Import/Export",
                tab: importGrp.id,
                columns: [
                    {dataField: "exist", caption: "Exist", dataType: "boolean", width: 120},
                    {dataField: "type", caption: "Type", dataType: "string", width: 150},
                    {dataField: "scriptid", caption: "ID", dataType: "string", width: 250},
                    {dataField: "searchtitle", caption: "Title", dataType: "string", width: 300},
                    {dataField: "ispublic", caption: "Public", dataType: "boolean", width: 120},
                    {dataField: "size_columns", caption: "Size Columns", dataType: "number", width: 120},
                    {dataField: "contents", caption: "Contents", dataType: "string", minWidth: 200},
                ],
                optionsDx: {
                    wordWrapEnabled: false
                }
            });
        }

        const getSavedSearchByID = (_params) => {
            let objRes = {};
            
            try{
                let resultSearch = constSearch.createSearchWithFilter({
                    type: "savedsearch",
                    filters: [
                        ["id","is",_params.custpage_id]
                    ],
                    columns: [
                        "internalid", "id", "title", 
                        "recordtype", "access", "owner"
                    ]
                });

                let arrResult = constSearch.fetchResultSearchRun(resultSearch, function(obj, column){
                    return constSearch.getObjResultFromSearchWithLabel_V2(obj, column);
                })
                
                let objResSavedSearch = arrResult.length > 0 ? arrResult[0] : {};
                
                objRes = search.load({id: objResSavedSearch.internalid});
                objRes = JSON.parse(JSON.stringify(objRes));

                objRes.title = search.lookupFields({
                    type: "savedsearch", id: objRes.id, columns: "title"
                }).title;

                objRes.msg = "";
                objRes.isError = false;
            }
            catch(e){
                objRes.msg = e.message;
                objRes.isError = true;
            }

            return objRes;
        }

        const getDataSavedSearchByID = (_params) => {
            let objRes = {};
            
            try{
                let objResSavedSearch = getSavedSearchByID(_params);
                
                objRes = constSearch.getDataSourceFetchPage({
                    type: objResSavedSearch.type, id: objResSavedSearch.scriptId
                });

                objRes.msg = "";
                objRes.isError = false;
            }
            catch(e){
                objRes.msg = e.message;
                objRes.isError = true;
            }

            return objRes;
        }

        return {onRequest}

    });
