/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  26 Jun 2025         Huy Pham			    Init, create file, Báo cáo quyết toán lô. form ms.Sâm(https://app.clickup.com/t/86czdzkb4)
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
    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */
    function pageInit(scriptContext) {
        let curRec = scriptContext.currentRecord;
        
        setOptionGridImport();
    }

    const setOptionGridImport = () => {
        _scvDx.setDataSource("custpage_sl_import", []);

        _scvDx.setOption("custpage_sl_import", "onRowDblClick", function(e){
            if(!!e.data.internalid){
                window.open("/app/common/search/search.nl?&e=T&cu=T&id=" + e.data.internalid);
            }
        });

        let currentToolbar = _scvDx.getOption("custpage_sl_import",  "toolbar") || { items: [] };

        currentToolbar.items.push(
        {
            location: "before",
            widget: "dxButton",
            options: {
                icon: "upload",
                text: "Load By ID",
                onClick: () => {
                    let urlDetail = `/app/site/hosting/scriptlet.nl?`;
                    urlDetail += `script=customscript_scv_sl_savedsearch_p&deploy=customdeploy_scv_sl_savedsearch_p`;
                    urlDetail += `&custpage_action=loadbyid`;

                    nlExtOpenWindow(urlDetail, 'SavedSearch', 850, 600, this, true, 'Load By ID');
                }
            }
        },
        {
            location: "before",
            widget: "dxButton",
            options: {
                icon: "export",
                text: "Export",
                onClick: async () => {
                    let arrResSelected = _scvDx.getDataSource("custpage_sl_import");
                    arrResSelected = arrResSelected.filter(e => e.exist == true);
                    if(arrResSelected.length == 0) return;

                    let nameFile = "ScriptSavedSearch";

                    let arrSearchContents = arrResSelected.map(e => JSON.parse(e.contents));

                    saveAs(new Blob([JSON.stringify(arrSearchContents, null, 4)], { 
                        type: "application/json;charset=utf-8"
                    }), nameFile + ".json");
                }
            }
        },
        {
            location: "before",
            widget: "dxButton",
            options: {
                icon: "import",
                text: "Import",
                onClick: () => {
                    let urlDetail = `/app/site/hosting/scriptlet.nl?`;
                    urlDetail += `script=customscript_scv_sl_savedsearch_p&deploy=customdeploy_scv_sl_savedsearch_p`;
                    urlDetail += `&custpage_action=import`;

                    nlExtOpenWindow(urlDetail, 'SavedSearch', 850, 600, this, true, 'Import Saved Search');
                }
            }
        },
        {
            location: "before",
            widget: "dxButton",
            options: {
                icon: "trash",
                text: "Clear All",
                onClick: async () => {
                    _scvDx.setDataSource("custpage_sl_import", []);
                }
            }
        });

        _scvDx.setOption("custpage_sl_import",  "toolbar", currentToolbar)
        _scvDx.getInstanceDx("custpage_sl_import").refresh();
    }

    /**
     * Function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @since 2015.2
     */
    function fieldChanged(scriptContext) {
        let curRec = scriptContext.currentRecord;
        let fieldId = scriptContext.fieldId;

        switch(fieldId){
            case "custpage_contents":
                let contents = curRec.getValue(fieldId);
                convertContent2Search(contents);
            break;
        }
    }

    const createSavedSearch = async () =>{
        let params = _scvForm.getParameter();

        if(!params.custpage_contents){
            alert("Please enter the contents of the saved search.");
            return;
        }
        
        let searchId = params.custpage_id;
        let title = params.custpage_title;

        let currentTime = (new Date()).getTime();

        if(!title){
            title = "Custom Search - " + currentTime;
        }
        
        if(!searchId){
            searchId = "customsearch_" + currentTime;
        }
        else if(searchId.indexOf("customsearch") == -1){
            searchId = "customsearch_" + searchId;
        }

        let strScriptSavedSearch = `require(['N'], function(N) {for(var n in N){window[n] = N[n];};
            try{
                let objResSearch = ${params.custpage_contents};
                objResSearch.title = "${title}";
                objResSearch.id = "${searchId}";
                objResSearch.isPublic = ${params.custpage_ispublic == "T" ? true : false};

                let filters = objResSearch.filters ?? [];
                filters.forEach(objFilter => {
                    if(!!objFilter.summarytype && !objFilter.summary){
                        objFilter.summary = objFilter.summarytype;
                    }
                });

                let ss_id = search.create(objResSearch).save();

                _scvForm.modul.ui.message.create({
                    title: 'Created Saved Search: Success',
                    message: 'Internal ID: ' + ss_id,
                    type: 0
                }).show({duration: 5000});
                window.open("/app/common/search/search.nl?id=" + ss_id + "&e=T&cu=T");
            } catch(e){alert(e.message);}});`

        eval(strScriptSavedSearch);
    }

    const updateSavedSearch = async () =>{
        let params = _scvForm.getParameter();

        if(!params.custpage_id){
            alert("Please enter id of the saved search.");
            return;
        }

        if(!params.custpage_title){
            alert("Please enter title of the saved search.");
            return;
        }

        let strScriptSavedSearch = `require(['N'], function(N) {
            for(var n in N){window[n] = N[n];};
            try{
                let resultSearch = search.load('${params.custpage_id}');
                let params = _scvForm.getParameter();

                if(!!params.custpage_title){
                    resultSearch.title = params.custpage_title;
                }
                resultSearch.isPublic = params.custpage_ispublic == "T" ? true : false;

                if(!!params.custpage_contents){
                    let objNewSearch = search.create(${params.custpage_contents});

                    resultSearch.filters = objNewSearch.filters;
                    resultSearch.columns = objNewSearch.columns;
                }
                resultSearch.save();

                callbackUpdateSavedSearch(resultSearch);
            } catch(e){alert(e.message);}
        });`

        return eval(strScriptSavedSearch);
    }

    const callbackUpdateSavedSearch = (_objResSearch) => {
        _scvForm.modul.ui.message.create({
            title: 'Update Saved Search: Success',
            message: 'Internal ID: ' + _objResSearch.id,
            type: 0
        }).show({duration: 5000});


        loadSavedSearch();
    }

    const loadSavedSearch = async () => {
        let params = _scvForm.getParameter();

        if(!["tab_content", "tab_import"].includes(sCurrentlySelectedTab)){
            ShowTab("tab_content");
        }

        if(!params.custpage_id){
            alert("Please enter id of the saved search.");
            return;
        }

        _scvForm.showLoadingDialog(true);

        _scvForm.ajax.postAsync(_scvForm.serviceScript.url, {
            ...params,
            action: "getSavedSearchByID",
        }, function (_res){
            let objRes = _res.data;

            _scvForm.showLoadingDialog(false);

            if(objRes.isError){
                alert(objRes.msg);
                return;
            }
            
            let curRec = _scvForm.currentRecord;

            let objResContents = {
                type: objRes.type.toLowerCase(),
                title: objRes.title,
                id: objRes.scriptId,
                isPublic: objRes.isPublic ?? true,
                settings: objRes.settings || [],
                filters: objRes.filters || [],
                columns: objRes.columns || [],
            };
            
            curRec.setValue("custpage_title", objRes.title);
            curRec.setValue("custpage_ispublic", objRes.isPublic);
            curRec.setValue("custpage_contents", JSON.stringify(objResContents, null, 4));

            addDataImportGrid([
                {
                    exist: true,
                    type: objResContents.type,
                    scriptid: objResContents.id,
                    internalid: objRes.id,
                    searchtitle: objResContents.title,
                    ispublic: objResContents.isPublic, 
                    size_columns: objResContents.columns.length,
                    contents: JSON.stringify(objResContents)
                }
            ]);
        });
    }

    const convertContent2Search = (_content) =>{
        let strScriptSavedSearch = `require(['N'], function(N) {
            for(var n in N){window[n] = N[n];};
            try{
                let resultSearch = search.create(${_content});
                callbackConvertContent2Search(resultSearch);
            } catch(e){alert(e.message);}
        });`

        return eval(strScriptSavedSearch);
    }

    const callbackConvertContent2Search = (_objRes) => {
        let curRec = _scvForm.currentRecord;

        if(!!_objRes.title){
            curRec.setValue("custpage_title", _objRes.title);
        }
        if(!!_objRes.id){
            curRec.setValue("custpage_id", _objRes.id);
        }
        if(_objRes.isPublic == false){
            curRec.setValue("custpage_ispublic", false);
        }
        else{
            curRec.setValue("custpage_ispublic", true);
        }
    }

    const executeResultSearch = async () => {
        let params = _scvForm.getParameter();

        _scvDx.setDataSource("custpage_sl_result", []);
        _scvDx.getInstanceDx("custpage_sl_result").refresh();

        if(!params.custpage_id){
            alert("Please enter id of the saved search.");
            return;
        }

        ShowTab("tab_result");

        _scvForm.showLoadingDialog(true);

        _scvForm.ajax.postAsync(_scvForm.serviceScript.url, {
            ...params,
            action: "getDataSavedSearchByID",
        }, function (_res){
            let objResData = _res.data;

            _scvForm.showLoadingDialog(false);

            if(objResData.isError){
                alert(objResData.msg);
                return;
            }

            let arrResult = objResData.arrResult;
            let objResInfo = objResData.info;

            let arrColumnsGrid = [];

            if(arrResult.length > 0){
                Object.keys(arrResult[0]).forEach(key => {
                    arrColumnsGrid.push({
                        dataField: key,
                        caption: key,
                    });
                });
            }

            _scvDx.setColumns("custpage_sl_result", arrColumnsGrid);
            _scvDx.setDataSource("custpage_sl_result", objResData.arrResult);
            _scvDx.getInstanceDx("custpage_sl_result").refresh();

            _scvForm.showLoadingDialog(false);

            _scvForm.modul.ui.message.create({
                title: 'Execute By Content: Success',
                message: `Chỉ lấy 1000 bản ghi đầu tiên. (Total page: ${objResInfo.ttlPage})`,
                type: 0
            }).show({duration: 10000});
        });
    }

    window._addDataImportGrid = (_arrResNew = []) => {
        addDataImportGrid(_arrResNew);
    }

    const addDataImportGrid = (_arrResNew = []) => {
        let arrResDataSource = _scvDx.getDataSource("custpage_sl_import");

        for(let i = 0; i < _arrResNew.length; i++){
            let objResNew = _arrResNew[i];

            let idxResDataSource = arrResDataSource.findIndex(e => e.scriptid == objResNew.scriptid);
            if(idxResDataSource > -1) continue;

            arrResDataSource.push({...objResNew});
        }

        _scvDx.setDataSource("custpage_sl_import", arrResDataSource);

        _scvDx.getInstanceDx("custpage_sl_import").refresh();
    }
    return {
        pageInit,
        fieldChanged,
        createSavedSearch,
        updateSavedSearch,
        loadSavedSearch,
        executeResultSearch,
        callbackUpdateSavedSearch,
        callbackConvertContent2Search,
    };
    
});
