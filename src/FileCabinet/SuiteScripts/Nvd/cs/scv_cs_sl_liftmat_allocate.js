/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  20 Nov 2024         Huy Pham			    Init, create file, Tính toán phân bổ trọng lượng nâng hạ trong sản xuất, from mr.Bính(https://app.clickup.com/t/86cx40ye7)
 *  19 Dec 2024         Huy Pham                Updatte chức năng tự mapping asb, from mr.Bính(https://app.clickup.com/t/86cx40ye7?comment=90160080579394)
 *  23 Dec 2024         Huy Pham                Thay đổi logic lưu history , from mr.Bính(https://app.clickup.com/t/86cx40ye7?comment=90160081199408)
 *  24 Dec 2024         Huy Pham                Bổ sung logic Group Lifting/Lowering, from mr.Bính(meeting)
 */
/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */ 
define(['N/currentRecord', 'N/url', 'N/https', 'N/search',
    '../lib/scv_lib_cs.js', '../lib/scv_lib_cs_xls.js', '../olib/alasql/alasql.min@1.7.3',

    '../cons/scv_cons_datastore.js',
    '../cons/scv_cons_record.js',

    '../cons/scv_cons_location.js',
    '../cons/scv_cons_entitygroup.js',
    '../cons/scv_cons_locationtype.js',
],

function(currentRecord, url, https, search,
    libCs, libCsXLS, alasql,

    constDataStore,
    constRecord,

    constLocation,
    constEntityGroup,
    constLocationType
) {
    const CUR_SCRIPT = {
        ID: "customscript_scv_sl_liftmat_allocate",
        DEPLOYID_UI: "customdeploy_scv_sl_liftmat_allocate",
        DEPLOYID_DATA: "customdeploy_scv_sl_liftmat_allocate_dat"
    }
    const URL_DATA = "/app/site/hosting/scriptlet.nl?script=" + CUR_SCRIPT.ID + "&deploy=" + CUR_SCRIPT.DEPLOYID_DATA;
    const STEP_ACTION = {
        LOAD_DATA: {
            ID: 0,
            NAME: "Load Data"
        },
        MAPPING: {
            ID: 1,
            NAME: "Mapping"
        },
        PROCESSING: {
            ID: 2,
            NAME: "Processing"
        }
    }
    const COLOR_PROCESS = ["#98FB98", "#FFA07A", "#87CEEB", "#FFA500", "#F0E68C", "#3E75F7", "#B945F7"];
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
        let currentStep = curRec.getValue("custpage_currentstep");
        constRecord.setCurrentRecord(curRec);

        if(currentStep == STEP_ACTION.LOAD_DATA.ID){
            constRecord.initQuickFindFieldSelect(curRec, "custpage_location", {
                data: curRec.getField("custpage_location").getSelectOptions(),
                valueExpr: "value",
                displayExpr: "text",
                reInsertOption: false
            }, false);

            syncDataProcess_LoadData(curRec);
        }
        else if(currentStep == STEP_ACTION.MAPPING.ID){
            syncDataProcess_Mapping(curRec);
        }
        
    }

    const syncDataProcess_LoadData = (_curRec) => {
        let liftLowerSublistId = "custpage_sl_liftlower", assBuildSublistId = "custpage_sl_assbuild";

        let sizeLiftLower = _curRec.getLineCount(liftLowerSublistId);
        let sizeAssBuild = _curRec.getLineCount(assBuildSublistId);

        let arrResult = [];

        for(let i = 0; i < sizeLiftLower; i++){
            let objRes = {};
            objRes.line = i;
            objRes.sublistId = liftLowerSublistId;
            objRes.custpage_col_internalid = _curRec.getSublistValue(liftLowerSublistId, "custpage_col_internalid", i);
            objRes.custpage_col_idxprocess = _curRec.getSublistValue(liftLowerSublistId, "custpage_col_idxprocess", i);
            objRes.custpage_col_isdetail = false;
            
            arrResult.push(objRes);
        }

        for(let i = 0; i < sizeAssBuild; i++){
            let objRes = {};
            objRes.line = i;
            objRes.sublistId = assBuildSublistId;
            objRes.custpage_col_internalid = _curRec.getSublistValue(assBuildSublistId, "custpage_col_internalid", i);
            objRes.custpage_col_idxprocess = _curRec.getSublistValue(assBuildSublistId, "custpage_col_idxprocess", i);
            objRes.custpage_col_isdetail = true;

            arrResult.push(objRes);
        }

        constDataStore.setDataStore("arrDataOfSublist", arrResult);

        setTimeout(setColorDefaultProcess(), 0);
    }

    const syncDataProcess_Mapping = (_curRec) => {
        let mappingSublistId = "custpage_sl_mapping";

        let sizeLiftLower = _curRec.getLineCount(mappingSublistId);

        let arrResult = [];

        for(let i = 0; i < sizeLiftLower; i++){
            let objRes = {};
            objRes.line = i;
            objRes.sublistId = mappingSublistId;
            objRes.custpage_col_internalid = _curRec.getSublistValue(mappingSublistId, "custpage_col_internalid", i);
            objRes.custpage_col_idxprocess = _curRec.getSublistValue(mappingSublistId, "custpage_col_idxprocess", i);
            objRes.custpage_col_isdetail = _curRec.getSublistValue(mappingSublistId, "custpage_col_isdetail", i);
            
            arrResult.push(objRes);

            if(!objRes.custpage_col_isdetail){
                document.getElementById(mappingSublistId + "row" + i).querySelectorAll("td")[7].querySelectorAll("span")[0].innerHTML = "";
                document.getElementById(mappingSublistId + "row" + i).querySelectorAll("td")[8].querySelectorAll("span")[0].innerHTML = "";
            }
        }

        constDataStore.setDataStore("arrDataOfSublist", arrResult);

        setTimeout(setColorDefaultProcess(), 0);
    }

    const setColorDefaultProcess = () =>{
        let arrDataOfSublist = constDataStore.getDataStore("arrDataOfSublist");
        let arrProcess = alasql(`SELECT DISTINCT custpage_col_idxprocess FROM ?`, [arrDataOfSublist])

        let idxColor = 0;
        for(let i = 0; i < arrProcess.length; i++){
            let arrDataOfSublist_filter = arrDataOfSublist.filter(e => e.custpage_col_idxprocess == arrProcess[i].custpage_col_idxprocess);
            let codeColor = COLOR_PROCESS[idxColor];
            let codeColorDetail = adjustBrightness(codeColor, 15);

            for(let j = 0; j < arrDataOfSublist_filter.length; j++){
                let objDataLine = arrDataOfSublist_filter[j];

                let columnFirst = jQuery(`#${objDataLine.sublistId}row${objDataLine.line} td`)[0];

                if(!objDataLine.custpage_col_idxprocess){
                    columnFirst.style = `border-radius: 10px; text-align: center`;
                    continue;
                }
                if(objDataLine.custpage_col_isdetail){
                    columnFirst.style = `background-color: ${codeColorDetail} !important; border-radius: 10px; text-align: center;`;
                }
                else{
                    columnFirst.style = `background-color: ${codeColor} !important; border-radius: 10px`;
                }
            }

            idxColor++;
            if(idxColor ==  COLOR_PROCESS.length){
                idxColor = 0;
            }
        }
    }

    const adjustBrightness = (hex, percent) => {
        // Remove the hash symbol if present
        hex = hex.replace(/^#/, '');
    
        // Parse the hex values to integers
        let r = parseInt(hex.substring(0, 2), 16);
        let g = parseInt(hex.substring(2, 4), 16);
        let b = parseInt(hex.substring(4, 6), 16);
    
        // Calculate the new RGB values
        r = Math.min(255, Math.max(0, r + Math.round(255 * (percent / 100))));
        g = Math.min(255, Math.max(0, g + Math.round(255 * (percent / 100))));
        b = Math.min(255, Math.max(0, b + Math.round(255 * (percent / 100))));
    
        // Convert the new RGB values back to hex
        let newHex = '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
        
        return newHex;
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
        let currentStep = curRec.getValue("custpage_currentstep");

        if(currentStep == STEP_ACTION.LOAD_DATA.ID){
            fieldChanged_LoadData(scriptContext);
        }
        else if(currentStep == STEP_ACTION.MAPPING.ID){
            fieldChanged_Mapping(scriptContext);
        }
    }

    const fieldChanged_LoadData = (scriptContext) =>{
        let curRec = scriptContext.currentRecord;
        let sublistId = scriptContext.sublistId;
        let fieldId = scriptContext.fieldId;
        let lineNum = scriptContext.line;
        
        switch(fieldId){
            case "custpage_col_chk":
                let col_chk = curRec.getCurrentSublistValue(sublistId, fieldId);
                let idxProcess = curRec.getCurrentSublistValue(sublistId, "custpage_col_idxprocess");
                let internalId = curRec.getCurrentSublistValue(sublistId, "custpage_col_internalid");
                
                let arrDataOfSublist = constDataStore.getDataStore("arrDataOfSublist");
                let objLineOther = arrDataOfSublist.find(e => e.sublistId == sublistId
                    && e.custpage_col_idxprocess == idxProcess
                    && e.custpage_col_internalid != internalId
                );
                if(!!objLineOther){
                    curRec.selectLine(sublistId, objLineOther.line);
                    curRec.setCurrentSublistValue({
                        sublistId: sublistId, fieldId: "custpage_col_chk", 
                        value: col_chk, ignoreFieldChange: true
                    });
                    curRec.commitLine(sublistId);
                }
                else{
                    curRec.setCurrentSublistValue({
                        sublistId: sublistId, fieldId: "custpage_col_chk", 
                        value: false, ignoreFieldChange: true
                    });
                }
            break;
            case "custpage_subsidiary":
                setTimeout(() => loadFieldDataLocation(curRec), 0);
            break;
            case "custpage_location":
                setTimeout(() => loadFieldDataWorkCenter(curRec), 0);
            break;
            case "custpage_group_liftlower":
                let isGroupLiftLower = curRec.getValue("custpage_group_liftlower") ? "T" : "F";
                debugger
            break;
        }

        if(sublistId == "custpage_sl_assbuild" && fieldId == "custpage_col_idxprocess"){
            debugger
            let arrDataOfSublist = constDataStore.getDataStore("arrDataOfSublist");
            let objCurrrentLine = arrDataOfSublist.find(e => e.sublistId == "custpage_sl_assbuild" && e.line == lineNum);
            if(!!objCurrrentLine){
                objCurrrentLine.custpage_col_idxprocess = curRec.getCurrentSublistValue(sublistId, "custpage_col_idxprocess");
            }

            setColorDefaultProcess();
        }
    }

    const fieldChanged_Mapping = (scriptContext) =>{
        let curRec = scriptContext.currentRecord;
    }

    const loadFieldDataLocation = (_curRec) => {
        let subsidiaryId = _curRec.getValue("custpage_subsidiary");

        let arrResult = [];

        if(!!subsidiaryId){
            arrResult = constLocation.getDataSource([
                search.createFilter({
                    name: 'subsidiary',
                    operator: "anyof",
                    values: subsidiaryId
                }),
                search.createFilter({
                    name: 'custrecord_scv_loc_type',
                    operator: "anyof",
                    values: constLocationType.RECORDS.SANXUAT.ID
                }),
            ]);
        }

        constRecord.initQuickFindFieldSelect(_curRec, "custpage_location", {
            data: arrResult,
            valueExpr: "internalid",
            displayExpr: "name",
            reInsertOption: true
        }, false);
    }

    const loadFieldDataWorkCenter = (_field) => {
        let curRec = constRecord.getCurrentRecord();

        let locationId = curRec.getValue("custpage_location");

        let arrResult = [];

        if(!!locationId){
            arrResult = constEntityGroup.getDataSource(
                search.createFilter({
                    name: 'custentity_mfgmob_wclocation',
                    operator: "anyof",
                    values: locationId
                })
            );
        }

        constRecord.initQuickFindFieldSelect(curRec, "custpage_workcenter", {
            data: arrResult,
            valueExpr: "internalid",
            displayExpr: "groupname",
            reInsertOption: true
        }, false);
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
        return true;
    }

    const onSearchResult = () =>{
        window.onbeforeunload = null;

        let curRec = currentRecord.get();
        let isValid = libCs.validateFieldMandatory(curRec, [
            "custpage_subsidiary", "custpage_location", 
            "custpage_fromdt", "custpage_todt"
        ]);
        if(!isValid) return;

        let params = getObjParams(curRec);
        
        let objResParams = excuteWriteCacheData("params", JSON.stringify(params));

        let urlScript = getCurrentUrlScript(curRec)

        urlScript += "&isSearch=T&custpage_currentstep=" + STEP_ACTION.LOAD_DATA.ID;

        window.location.replace(urlScript);
    }

    const backAction = () =>{
        window.onbeforeunload = null;

        let curRec = currentRecord.get();

        let arrMapping = getDataOfSublist(curRec, "custpage_sl_mapping");

        let objResMapping = excuteWriteCacheData("custpage_sl_mapping", JSON.stringify(arrMapping));

        let urlScript = getCurrentUrlScript(curRec)

        urlScript += "&isSearch=T&isBack=T&custpage_currentstep=" + STEP_ACTION.LOAD_DATA.ID;

        window.location.replace(urlScript);
    }

    const nextAction = () =>{
        window.onbeforeunload = null;

        let curRec = currentRecord.get();

        let arrLiftLowerSelected = getDataOfSublist(curRec, "custpage_sl_liftlower");
        if(arrLiftLowerSelected.length == 0){
            alert("Chọn ít nhất 1 line Lifting/Lowering.")

            return;
        }

        let arrAssBuild = getDataOfSublist(curRec, "custpage_sl_assbuild");
        let arrAssBuildSelected = [];
        for(let i = 0; i < arrAssBuild.length; i++){
            let objAssBuild = arrAssBuild[i];

            let objLiftLowerSelected_find = arrLiftLowerSelected.find(e => e.custpage_col_idxprocess == objAssBuild.custpage_col_idxprocess);
            if(!!objLiftLowerSelected_find){
                arrAssBuildSelected.push({...objAssBuild});
            }
        }

        if(arrAssBuildSelected.length == 0){
            alert("Chọn ít nhất 1 line Assembly.")

            return;
        }

        excuteWriteCacheData("custpage_sl_liftlower", JSON.stringify(arrLiftLowerSelected));
        excuteWriteCacheData("custpage_sl_assbuild", JSON.stringify(arrAssBuildSelected));

        let urlScript = getCurrentUrlScript(curRec)

        urlScript += "&isNext=T&custpage_currentstep=" + STEP_ACTION.MAPPING.ID;

        window.location.replace(urlScript);s
    }

    const submitFinish = async () =>{
        window.onbeforeunload = null;
        debugger
        let curRec = currentRecord.get();

        libCs.showLoadingDialog(true);

        let params = getObjParams(curRec);

        let arrMapping = getDataOfSublist(curRec, "custpage_sl_mapping");
        let arrLineDetail = arrMapping.filter(e => e.custpage_col_isdetail);

        let arrAsb = alasql(`SELECT DISTINCT custpage_col_liftid, custpage_col_lowerid, custpage_col_type_tranid, custpage_col_ab_id FROM ? `, [arrLineDetail]);

        let arrResult = [];

        for(let i = 0; i < arrAsb.length; i++){
            let objAbs = arrAsb[i];

            let objRes = {
                internalid: objAbs.custpage_col_ab_id,
                tranid: objAbs.custpage_col_type_tranid,
                liftId: objAbs.custpage_col_liftid,
                lowerId: objAbs.custpage_col_lowerid,
                components: []
            }

            let arrLineDetail_filter = arrLineDetail.filter(e => e.custpage_col_ab_id == objRes.internalid
                && e.custpage_col_liftid == objRes.liftId
                && e.custpage_col_lowerid == objRes.lowerId
            );

            for(let j = 0; j < arrLineDetail_filter.length; j++){
                let objLineDetail = arrLineDetail_filter[j];

                let objLine = {...objLineDetail};

                objLine.linenumber = objLineDetail.custpage_col_ab_lineid;
                objLine.quantity = objLineDetail.custpage_col_mat_qty_allocate;
                objLine.inventorynumber = objLineDetail.custpage_col_matlot;

                objRes.components.push(objLine);
            }

            arrResult.push(objRes);
        }

        let objReqBody = {...params};
        objReqBody.arrAsb = arrResult;

        libCsXLS.asyncPostDataByAjax(URL_DATA, {
            action: "updateAllocateMaterial", 
            body: JSON.stringify(objReqBody)
        }, function(_res, _paramsCallback){
            libCs.showLoadingDialog(false);

            let objRes = _res.data;

            if(objRes.isSuccess == true){
                refreshAction();
            }
            else{
                libCs.showMsgError("Error: " + objRes.message??"");
            }
            
        },function(request, status, error, _paramsCallback){
            libCs.showMsgError(error.message||status);
            libCs.showLoadingDialog(false);
        });
    }

    const cancelAction = () =>{
        let urlScript = url.resolveScript({
            scriptId: 'customscript_scv_sl_liftmat_allocate',
            deploymentId: 'customdeploy_scv_sl_liftmat_allocate'
        });

        window.location.replace(urlScript);
    }

    const refreshAction = () =>{
        window.onbeforeunload = null;

        let curRec = currentRecord.get();

        let urlScript = getCurrentUrlScript(curRec)

        urlScript += "&custpage_currentstep=" + STEP_ACTION.PROCESSING.ID;

        window.location.replace(urlScript);
    }

    const getObjParams = (_curRec) => {
        let params = {
            custpage_externalid: _curRec.getValue("custpage_externalid")
        };

        let currentStep = _curRec.getValue("custpage_currentstep");

        if(currentStep == STEP_ACTION.LOAD_DATA.ID){
            params.custpage_subsidiary =_curRec.getValue("custpage_subsidiary");
            params.custpage_prod_lotno =_curRec.getValue("custpage_prod_lotno").toString();
            params.custpage_item = _curRec.getValue("custpage_item").toString();
            params.custpage_mat_lotno = _curRec.getValue("custpage_mat_lotno");
            params.custpage_qc_serial = _curRec.getValue("custpage_qc_serial");
            params.custpage_location = _curRec.getValue("custpage_location");
            params.custpage_workcenter = _curRec.getValue("custpage_workcenter");
            params.custpage_fromdt = _curRec.getText("custpage_fromdt");
            params.custpage_todt = _curRec.getText("custpage_todt");
            params.custpage_group_liftlower = _curRec.getValue("custpage_group_liftlower") ? "T" : "F";
        }
        else if(currentStep == STEP_ACTION.MAPPING.ID){
            params.custpage_group_liftlower = _curRec.getValue("custpage_group_liftlower") ? "T" : "F";
        }
        return params;
    }

    const getCurrentUrlScript = (_curRec) =>{
        let objParams = getObjParams(_curRec);

        let urlScript = url.resolveScript({
            scriptId: 'customscript_scv_sl_liftmat_allocate',
            deploymentId: 'customdeploy_scv_sl_liftmat_allocate',
            params: objParams
        });

        return urlScript;
    }

    const markAllOfSublist = (_sublistId, _isMark) =>{
        let curRec = currentRecord.get();
        let sizeSublist = curRec.getLineCount(_sublistId);
        let isMarkAll = _isMark == "T" ? true : false;
        
        for(let i = 1; i <= sizeSublist; i++){
            nlapiSelectLineItem(_sublistId,i)
            nlapiSetCurrentLineItemValue(_sublistId, "custpage_col_chk", isMarkAll, true, false)
            nlapiCommitLineItem(_sublistId)
        }
    }

    const getDataOfSublist = (_curRec, _sublistId) => {
        let fields = _curRec.getValue(_sublistId + "fields");
        let arrFields = !!fields ? fields.split("\x01") : [];
        
        let sizeSublist = _curRec.getLineCount(_sublistId);

        let arrResult = [];

        for(let i = 0; i < sizeSublist; i++){
            let objRes = {};

            if(_sublistId == "custpage_sl_liftlower"){
                let chk = _curRec.getSublistValue(_sublistId, "custpage_col_chk", i);
                if(!chk) continue;
            }

            for(let j = 0; j < arrFields.length; j++){
                let fieldId = arrFields[j];

                objRes[fieldId] = _curRec.getSublistValue(_sublistId, fieldId, i);
            }

            if(_sublistId == "custpage_sl_liftlower"){
                objRes.custpage_col_units_display = _curRec.getSublistText(_sublistId, "custpage_col_units", i);
            }

            arrResult.push(objRes);
        }

        return arrResult;
    }

    const excuteWriteCacheData = (_keyCache, _data) =>{
        let curRec = currentRecord.get();

        let keyExternalId = curRec.getValue("custpage_externalid")

        let objRes = https.post({
            url: URL_DATA,
            body: {
                action: "writeCacheData",
                custpage_externalid: keyExternalId,
                keyCache: _keyCache,
                data: _data
            }
        });
        objRes = JSON.parse(objRes.body);
        if(!objRes.data) return null;
        
        return objRes.data;
    }

    const excuteReadCacheData = (_keyCache) =>{
        let curRec = currentRecord.get();

        let keyExternalId = curRec.getValue("custpage_externalid")

        let objRes = https.post({
            url: URL_DATA,
            body: {
                action: "readCacheData",
                custpage_externalid: keyExternalId,
                keyCache: _keyCache
            }
        });
        objRes = JSON.parse(objRes.body);
        if(!objRes.data) return null;
        
        return objRes.data;
    }

    window.l_sort = () =>{
        return;
    }

    return {
        pageInit,
        fieldChanged,
        saveRecord,
        onSearchResult,
        backAction,
        nextAction,
        submitFinish,
        refreshAction,
        cancelAction,
        markAllOfSublist
    };
    
});
