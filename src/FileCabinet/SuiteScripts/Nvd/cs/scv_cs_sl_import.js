/**
 * Nội dung: Import Record
 * Key word:
 * =======================================================================================
 *  Date                Author                  Description
 * 08 Nov 2024		    Huy Pham                Init & create file, move from Adv, from mr.Việt(https://app.clickup.com/t/86cx0fvqd)
 */
/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/url',
    '../lib/scv_lib_cs.js', '../lib/scv_lib_cs_xls.js',
    '../lib/scv_lib_import.js',

    '../cons/scv_cons_datastore.js',
    '../cons/scv_cons_format.js',

    '../cons/scv_cons_importline.js'
],

function(currentRecord, url,
    libCs, libCsXLS,
    libImport,

    constDataStore,
    constFormat,

    constImportLine
) {
    const CUR_SCRIPT = Object.freeze({
        ID: "customscript_scv_sl_import",
        DEPLOYID_UI: "customdeploy_scv_sl_import",
        DEPLOYID_DATA: "customdeploy_scv_sl_import_data"
    })
    const URL_DATA = "/app/site/hosting/scriptlet.nl?script=" + CUR_SCRIPT.ID + "&deploy=" + CUR_SCRIPT.DEPLOYID_DATA;
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
        let fieldUpload = document.getElementById("scvUpload");
        fieldUpload.addEventListener("change", onChangeFieldUploadFile);

        renderDxGridUploadFile([], []);
        resizeGrid("grdDataUpload");
    }

    const renderDxGridUploadFile = (_arrColumn, _arrData) => {
        let optionGrid = getOptionGrid();
        optionGrid.dataSource.store = _arrData;
        optionGrid.columns = _arrColumn;

        $('#grdDataUpload').dxDataGrid(optionGrid);
    }

    const getOptionGrid = () => {
        return {
            dataSource: {
                store: [],
                reshapeOnPush: true,
            },
            columns: [],
            columnResizingMode: "widget",
            showBorders: true,
            showColumnLines: true,
            showRowLines: true,
            allowColumnResizing: true,
            columnAutoWidth: true,
            repaintChangesOnly: true,
            wordWrapEnabled: true,
            selection: "single",
            searchPanel: { visible: true },
            rowAlternationEnabled: false,
            paging: { pageSize: 500},
            loadPanel: { enabled: false},
            columnFixing: {enabled: true},
            pager: {
                showPageSizeSelector: true,
                allowedPageSizes: [100, 200, 500, 1000],
                showPageSizeSelector: true,
                showInfo: true,
                showNavigationButtons: true,
            },
            editing: {
                mode: 'cell',
                allowUpdating: false
            },
            sorting: {mode: "none"}
        };
    }

    const resizeGrid = (_gridId) => {
        var windowWidth = window.innerWidth;
        $('#' + _gridId).css("width",(windowWidth - 70) + "px");
        $('#' + _gridId).css("max-width",(windowWidth - 70) + "px");
        setTimeout(function(){
            resizeGrid(_gridId)
        }, 100);
    }

    const onChangeFieldUploadFile = (_event) =>{
        let files = _event.target.files;

        let wb = new ExcelJS.Workbook();
        let reader = new FileReader()
        reader.readAsArrayBuffer(files[0]);
        reader.onload = () => {
            wb.xlsx.load(reader.result).then(workbook => {
                loadDataWithWorkBook(workbook)
            })
        }
    }

    const loadDataWithWorkBook = (_workbook) =>{debugger
        let curRec = currentRecord.get();
        let params = getObjParams(curRec);
        let arrFieldTemplate = libImport.getListFieldTemplateColumn(params.custpage_import, params.custpage_import_line, params.custpage_chk_importheader);
        let arrFieldMapping = [];

        let worksheet = _workbook.worksheets[0];

        let arrColumn = [], arrResult = [], arrResultUpload = [];
        
        for(let idxCol = 1; idxCol <= worksheet.columnCount; idxCol++){
            let colXls = worksheet.getColumn(idxCol);
            let fieldLabelOrg = worksheet.getCell(1, idxCol).value;

            if(!fieldLabelOrg) continue;
            
            if(typeof(fieldLabelOrg) == "object"){
                //case title is hyperlink
                fieldLabelOrg = fieldLabelOrg.text||fieldLabelOrg.hyperlink;
            }
            let fieldLabel = fieldLabelOrg.toString().toLowerCase().trim();

            let objFieldTemplate_find = arrFieldTemplate.find(e => e.isMapped != "T" 
                && (e.id.toLowerCase() == fieldLabel || e.label.toLowerCase().includes(fieldLabel))
            );
            if(!!objFieldTemplate_find){
                objFieldTemplate_find.isMapped = "T";

                let objFieldMapping = {...objFieldTemplate_find};
                objFieldMapping.idxColExcel = idxCol;
                objFieldMapping.letterColExcel = colXls.letter;
                objFieldMapping.labelColExcel = fieldLabelOrg;
                arrFieldMapping.push(objFieldMapping);
                
                arrColumn.push({dataField: objFieldTemplate_find.id, caption: fieldLabelOrg, dataType: "string", width: 150, idxColExcel: idxCol, letterColExcel: colXls.letter});
            }
            else{
                arrFieldMapping.push({
                    id: "",
                    label: "",
                    sublistId: "",
                    fieldId: "",
                    idxColExcel: idxCol,
                    letterColExcel: colXls.letter,
                    labelColExcel: fieldLabelOrg,
                    isMapped: "F"
                });
            }
        }

        for(let idxRow = 2; idxRow <= worksheet.rowCount; idxRow++){
            let objRes = {};
            for(let idxCol = 0; idxCol < arrColumn.length; idxCol++){
                let curCell = worksheet.getCell(idxRow, arrColumn[idxCol].idxColExcel);

                let numFmt = curCell.numFmt;
                let val_col = curCell.value??"";
                let value_result = "";

                if(typeof(val_col) == "object"){
                    if(val_col instanceof Date){
                        value_result = nlapiDateToString(val_col);
                    }
                    else{
                        value_result = val_col.result||val_col.sharedFormula;
                    }
                }
                else{
                    value_result = val_col;
                }

                if(!!numFmt && !!value_result && !isNaN(value_result)){
                    let precision = (numFmt.toString().replaceAll("%","").split(".")?.[1]?.length || 0) * 1;

                    value_result = constFormat.roundNumber(value_result, precision);
                }

                objRes[arrColumn[idxCol].dataField] = value_result;
            }

            arrResult.push(objRes);

            let objResUpload = {};
            for(let idxCol = 1; idxCol <= worksheet.columnCount; idxCol++){
                let colXls = worksheet.getColumn(idxCol);

                objResUpload[colXls.letter] = worksheet.getCell(idxRow, idxCol).value??"";
            }
            arrResultUpload.push(objResUpload);
        }

        constDataStore.setDataStore("arrFieldMapping", arrFieldMapping);
        constDataStore.setDataStore("arrResultUpload", arrResultUpload);

        let arrFieldMappingNotFound = arrFieldMapping.filter(e => e.isMapped == "F");
        
        if(arrFieldMappingNotFound.length > 0){
            let arrLabel = arrFieldMappingNotFound.map(e => `(${e.letterColExcel}) ` + e.labelColExcel);
            libCs.showMsgError(`Cột "${arrLabel.toString()}" chưa được tự động mapping.`);
        }
        
        
        renderDxGridUploadFile(arrColumn, arrResult);
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
        switch(scriptContext.fieldId){
            case "custpage_import":
                let importId = curRec.getValue("custpage_import");
                let importLineField = curRec.getField("custpage_import_line");

                constImportLine.initLoadFieldByCriteriaQuery(importLineField, {
                    custrecord_scv_import_line_rectype: importId??""
                }, false);
            break;
        }
    }

    /**
     * Validation function to be executed when record is saved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @returns {boolean} Return true if record is valid
     *
     * @since 2015.2
     */
    function saveRecord(scriptContext) {
        return false;
    }

    const onDownload = async () => {
        window.onbeforeunload = null;
        var curRec = currentRecord.get();
        
        var isValid = libCs.validateFieldMandatory(curRec, [
            "custpage_import"
        ]);
        if(!isValid){
            return;
        };

        let params = getObjParams(curRec);

        let workbook = new ExcelJS.Workbook();

        let pageSetup = {
            pageSetup: { paperSize: 9, orientation: 'landscape', scale: 100 }
        };

        let worksheet = workbook.addWorksheet("Template Import", pageSetup);

        let arrFieldTemplate = libImport.getListFieldTemplateColumn(params.custpage_import, params.custpage_import_line, params.custpage_chk_importheader);
        
        let idxRowFieldLabel = 1, idxRowFieldGuide = 2;
        let idxCurrentColumn = 1;
        for(let i = 0; i < arrFieldTemplate.length; i++){
            let cellFieldLabel = worksheet.getCell(idxRowFieldLabel, idxCurrentColumn);
            let cellFieldGuide = worksheet.getCell(idxRowFieldGuide, idxCurrentColumn);

            cellFieldLabel.value = arrFieldTemplate[i].label;
            cellFieldGuide.value = arrFieldTemplate[i].guideNote||"";

            worksheet.getColumn(idxCurrentColumn).width = 20;
            idxCurrentColumn++;
        }

        libCsXLS.saveWorkbook(workbook, curRec.getText("custpage_import") + ".xlsx");
    }

    const onRefresh = () => {
        window.onbeforeunload = null;
        window.location.reload();
    }

    const getObjParams = (_curRec) => {
        var params = {};
        params.custpage_rectype = _curRec.getValue("custpage_rectype")??"";
        params.custpage_recid = _curRec.getValue("custpage_recid")??"";
        params.custpage_import = _curRec.getValue("custpage_import")??"";
        params.custpage_chk_importheader = _curRec.getValue("custpage_chk_importheader") == true ? "T" : "F";
        params.custpage_import_line = (_curRec.getValue("custpage_import_line")??"").toString();

        let isPopup = new URLSearchParams(window.location.search).get('isPopup');
        if(isPopup == "T"){
            params.isPopup = "T"
        }
        return params;
    }

    const onImportResult = async () =>{
        window.onbeforeunload = null;
            
        let curRec = currentRecord.get();

        var isValid = libCs.validateFieldMandatory(curRec, ["custpage_import"]);
        if(!isValid) return;

        let arrLines = $('#grdDataUpload').dxDataGrid("instance")._controllers.data._dataSource._cachedPagingData;
        if(arrLines.length == 0){
            libCs.showMsgError("Phải tồn tại ít nhất 1 line để import.");
            return;
        }

        libCs.showLoadingDialog(true);

        let params = getObjParams(curRec);

        let objReqBody = {...params};
        objReqBody.arrLines = arrLines;

        libCsXLS.asyncPostDataByAjax(URL_DATA, {action: "importDataUpload", body: JSON.stringify(objReqBody)}, function(_res, _paramsCallback){
                
            libCs.showLoadingDialog(false);

            let objRes = _res.data;

            if(objRes.isSuccess == true){
                showAlertBox('toast_msg', 'Success!', "", NLAlertDialog.INFORMATION);
                /* setTimeout(function(){
                    jQuery("#div__alert").remove();
                }, 10000) */

                if(params.isPopup == "T"){
                    window.getParent().location.reload();
                    onCancelPopup();
                }
                else{
                    if(!!objRes.internalid){
                        let arrInternalId = objRes.internalid.split(",");
                        for(let i = 0; i < arrInternalId.length; i++){
                            let urlRecord = url.resolveRecord({
                                recordType: objRes.recordType,
                                recordId: arrInternalId[i]
                            });
    
                            window.open(urlRecord);
                        }
                    }

                    //onRefresh();
                }
            }
            else{
                libCs.showMsgError("Error: " + objRes.message??"");
            }
            
        },function(request, status, error, _paramsCallback){
            libCs.showMsgError(error.message||status)

            libCs.showLoadingDialog(false);
        });
    }

    const onMappingField = () =>{
        let curRec = currentRecord.get();

        let arrFieldMapping = constDataStore.getDataStore("arrFieldMapping");

        let params = getObjParams(curRec);
        params.sizeRow = arrFieldMapping.length;

        

        let urlScript = url.resolveScript({
            scriptId: 'customscript_scv_sl_import_popup_map',
            deploymentId: 'customdeploy_scv_sl_import_popup_map',
            params: params
        });

        nlExtOpenWindow(urlScript, 'popupFieldMap', screen.width - 300, screen.height - 300, this, true, "Import Mapping Field");
    }

    const onCancelPopup = () => {
        window.onbeforeunload = null;
        closePopup(true); 
    }

    window._scvGetDataFieldMapping = () =>{
        return constDataStore.getDataStore("arrFieldMapping");
    }

    window._scvGetDataParams = () =>{
        let curRec = currentRecord.get();

        return getObjParams(curRec);
    }

    window._scvUpdateFieldMapping = () =>{
        let arrFieldMapping = constDataStore.getDataStore("arrFieldMapping");
        let arrResultUpload = constDataStore.getDataStore("arrResultUpload");

        let arrColumn = [], arrResult = [];

        for(let i = 0; i < arrFieldMapping.length; i++){
            let objFieldMapping = arrFieldMapping[i];

            if(objFieldMapping.isMapped != "T") continue;

            arrColumn.push({
                dataField: objFieldMapping.id, caption: objFieldMapping.label, 
                dataType: "string", width: 150, 
                idxColExcel: objFieldMapping.idxColExcel,
                letterColExcel: objFieldMapping.letterColExcel
            });
        }

        for(let i = 0; i < arrResultUpload.length; i++){
            let objResUpload = arrResultUpload[i];

            let objRes = {};
            for(let idxCol = 0; idxCol < arrColumn.length; idxCol++){
                let objColumn = arrColumn[idxCol];

                objRes[objColumn.dataField] = objResUpload[objColumn.letterColExcel];
            }

            arrResult.push(objRes);
        }

        renderDxGridUploadFile(arrColumn, arrResult);
    }

    const openStatusQueue = (_urlPopup, _width, _height, _title) =>{
        nlExtOpenWindow(_urlPopup, 'popupStatusQueue', _width, _height, this, true, _title);
    }

    return {
        pageInit,
        fieldChanged,
        onDownload,
        onRefresh,
        saveRecord,
        onImportResult,
        onMappingField,
        onCancelPopup,
        openStatusQueue
    };
    
});
