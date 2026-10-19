/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  03 Jul 2025         Huy Pham                Init & create file
 */
/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([
],

    function(
        ) {
        function pageInit(scriptContext) {
            let paramsUrl = _scvForm.getUrlParams()

            _scvDx.setDataSource("custpage_sl_result", []);

            if(paramsUrl.custpage_action == "loadbyid"){
                let fieldUpload = document.getElementById("scvUploadByID");
                fieldUpload.addEventListener("change", onChangeFieldUploadFile_LoadByID);
            }
            else if(paramsUrl.custpage_action == "import"){
                let fieldUpload = document.getElementById("scvUpload");
                fieldUpload.addEventListener("change", onChangeFieldUploadFile);
            }
        }

        function fieldChanged(scriptContext) {
            let curRec = scriptContext.currentRecord;
            let fieldId = scriptContext.fieldId;

            switch(fieldId){
                case "custpage_fromurl":
                    crawlDataFromUrl(curRec);
                break;
            }
        }
        
        const onChangeFieldUploadFile_LoadByID = (_event) =>{
            let arrFiles = _event.target.files;
            if (!arrFiles || arrFiles.length == 0) return;

            for(let i = 0; i < arrFiles.length; i++){
                let targetFile = arrFiles[i];

                let reader = new FileReader();
                
                reader.onload = (e) => {
                    let arrResult = e.target.result.match(/customsearch\w*/g);
                    addDataResultGrid_LoadByID(arrResult);
                };

                reader.readAsText(targetFile)
            }
        }
        
        const onChangeFieldUploadFile = (_event) =>{
            let targetFiles = _event.target.files[0];
            if (!targetFiles) return;

            let reader = new FileReader();
            reader.onload = (e) => {

                let arrResImport = JSON.parse(e.target.result);

                let arrResult = [];

                arrResImport.forEach(objResImport =>{
                    arrResult.push({
                        chk_imported: false,
                        import_msg: "",
                        type: objResImport.type,
                        scriptid: objResImport.scriptId || objResImport.scriptid || objResImport.id,
                        internalid: objResImport.id || objResImport.internalid,
                        searchtitle: objResImport.title,
                        ispublic: objResImport.isPublic, 
                        size_columns: objResImport.columns.length,
                        contents: JSON.stringify(objResImport)
                    });
                });

                _scvDx.setDataSource("custpage_sl_result", arrResult);
            };

            reader.readAsText(targetFiles)
        }

        const crawlDataFromUrl = async (_curRec) => {
            let fromUrl = _curRec.getValue("custpage_fromurl");
            if(!fromUrl) return;

            jQuery.ajax({
                url: fromUrl,
                method: 'GET',
                success: function(contentHTML) {
                    let arrResult = contentHTML.match(/customsearch\w*/g);
                    addDataResultGrid_LoadByID(arrResult);
                },
                error: function() {
                    alert("Failed to fetch data from the URL.");
                }
            });
        }

        const addDataResultGrid_LoadByID = (_arrSearchID = []) => {
            let arrResDataSource = _scvDx.getDataSource("custpage_sl_result");

            for(let i = 0; i < _arrSearchID.length; i++){
                let searchID = _arrSearchID[i];

                let idxResDataSource = arrResDataSource.findIndex(e => e.scriptid == searchID);
                if(idxResDataSource > -1) continue;

                arrResDataSource.push({
                    scriptid: searchID,
                });
            }

            _scvDx.setDataSource("custpage_sl_result", arrResDataSource);

            _scvDx.getInstanceDx("custpage_sl_result").refresh();
        }

        const submitResult_LoadByID = async () => {
            let arrResult = _scvDx.getDataSource("custpage_sl_result");
            if(arrResult.length == 0){
                alert("No data to submit");
                return;
            }

            _scvForm.showLoadingDialog(true);

            let arrActionFunc = [];

            arrResult.forEach(objRes =>{
                arrActionFunc.push({action: "getSavedSearchByID", params: {...objRes}, data: []});
            });

            _scvForm.ajax.postWaitQueue(_scvForm.serviceScript.url, arrActionFunc, 0, function (_res){
                let arrResult = [];
                
                for(let i = 0; i < _res.length; i++){
                    let objRes = _res[i];

                    if(!objRes.data){
                        arrResult.push({
                            exist: false,
                            type: "",
                            scriptid: objRes.params.scriptid,
                            internalid: "",
                            searchtitle: objRes.params.scriptid,
                            ispublic: false, 
                            size_columns: 0,
                            contents: ""
                        });

                        continue;
                    }

                    let objResSearch = objRes.data;

                    arrResult.push({
                        exist: true,
                        type: objResSearch.type,
                        scriptid: objResSearch.scriptId,
                        internalid: objResSearch.id,
                        searchtitle: objResSearch.title,
                        ispublic: objResSearch.isPublic, 
                        size_columns: objResSearch.columns.length,
                        contents: JSON.stringify(objResSearch)
                    });
                }

                window.getParent()._addDataImportGrid(arrResult);

                _scvForm.showLoadingDialog(false);
                closePopup(true);
            });
        }

        const submitResult_Import = async () => {
            let arrResult = _scvDx.getDataSource("custpage_sl_result").filter(e => !e.chk_imported);
            if(arrResult.length == 0){
                alert("No data to import.");
                return;
            }

            if(!confirm("Are you sure you want to import these saved search?")) return;

            _scvForm.showLoadingDialog(true);

            let arrActionFunc = [];

            arrResult.forEach(objRes =>{
                arrActionFunc.push({action: "submitResult_Import", params: {...objRes}, data: []});
            });

            _scvForm.ajax.postWaitQueue(_scvForm.serviceScript.url, arrActionFunc, 0, function (_res){
                for(let i = 0; i < _res.length; i++){
                    let objRes = _res[i];

                    let paramsExecute = objRes.params;
                    let objResSearch = objRes.data;

                    let objLineImport = _scvDx.getDataSource("custpage_sl_result").find(e => e.scriptid == paramsExecute.scriptid);

                    objLineImport.import_msg = objResSearch.msg;

                    if(!!objResSearch.newInternalId){
                        objLineImport.chk_imported = true;
                    }
                }

                _scvDx.getInstanceDx("custpage_sl_result").refresh();

                _scvForm.showLoadingDialog(false);
            });
        }

        return {
            pageInit,
            fieldChanged,
            submitResult_LoadByID,
            submitResult_Import
        };

    });
