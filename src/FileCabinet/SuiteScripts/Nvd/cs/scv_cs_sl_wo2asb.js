/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  05 Feb 2025         Huy Pham			    Init, create file, Thống kê tiêu hao hàng loạt, from mr.Bính(https://app.clickup.com/t/86cxwt5k9)
 *  17 Feb 2025         Huy Pham                Bổ sung chức năng, from mr.Việt(https://app.clickup.com/t/86cxwt5k9?comment=90160092309501) 
 */
/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */ 
define(['N/currentRecord', 'N/https', 'N/search',
    '../lib/scv_lib_cs_xls.js',

    '../cons/scv_cons_record.js',
    '../cons/scv_cons_format.js',

    '../cons/scv_cons_location.js',
    '../cons/scv_cons_entitygroup.js',
    '../cons/scv_cons_locationtype.js',
    '../cons/scv_cons_inventorydetail.js'
],

function(currentRecord, https, search,
    libCsXLS,

    constRecord,
    constFormat,

    constLocation,
    constEntityGroup,
    constLocationType,
    constInventoryDetail,
) {
    const STEP_ACTION = {
        LOAD_DATA: {
            ID: 0,
            NAME: "Lấy dữ liệu"
        },
        INPUT_WO: {
            ID: 1,
            NAME: "Thống kê TP"
        },
        INPUT_COMPONENT: {
            ID: 2,
            NAME: "Thống kê tiêu hao"
        },
        VIEW_RESULT: {
            ID: 3,
            NAME: "Hoàn thành"
        },
    }
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

            constRecord.initQuickFindFieldSelect(curRec, "custpage_prod_lotno", {
                data: curRec.getField("custpage_prod_lotno").getSelectOptions(),
                valueExpr: "value",
                displayExpr: "text",
                reInsertOption: false
            }, false);
            
        }
        else if(currentStep == STEP_ACTION.INPUT_WO.ID){
            pageInit_InputWO(curRec);
            
        }
        else if(currentStep == STEP_ACTION.INPUT_COMPONENT.ID){
            pageInit_InputComponent(curRec);
            
        }
    }

    const pageInit_InputWO = (curRec) =>{
        _scvForm.setDisabledSublistField("custpage_sl_wo_1", ["custpage_col_tlg_hang", "custpage_col_tlg_dm", "custpage_col_percentdiff"]);
        _scvForm.setDisabledSublistField("custpage_sl_component_1", ["custpage_col_issue_qty"]);

        let woSublistId = "custpage_sl_wo_1";
        let sizeWO = curRec.getLineCount(woSublistId);
        for(let i = 0; i < sizeWO; i++){
            let percent_diff = curRec.getSublistValue(woSublistId, "custpage_col_percentdiff", i);
            percent_diff = !!percent_diff ? percent_diff.toString().replace("%", "") * 1 : 0;
            
            addStyleWarningPercentDiff(curRec, woSublistId, percent_diff, i);
        }
    }

    const pageInit_InputComponent = (curRec) =>{
        ShowTab("tab_component");
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
        else if(currentStep == STEP_ACTION.INPUT_WO.ID){
            fieldChanged_InputWO(scriptContext);
        }
        else if(currentStep == STEP_ACTION.INPUT_COMPONENT.ID){
            fieldChanged_InputComponent(scriptContext);
        }
    }

    const fieldChanged_LoadData = (scriptContext) =>{
        let curRec = scriptContext.currentRecord;
        let sublistId = scriptContext.sublistId;
        let fieldId = scriptContext.fieldId;
        let lineNum = scriptContext.line;
        
        switch(fieldId){
            case "custpage_subsidiary":
                let custpage_location = curRec.getField("custpage_location");
                let subsidiaryId = curRec.getValue("custpage_subsidiary");

                setTimeout(() => loadFieldDataLocation(custpage_location, subsidiaryId), 0);
            break;
            case "custpage_location":
                let custpage_workcenter = curRec.getField("custpage_workcenter");
                let locationId = curRec.getValue("custpage_location");

                setTimeout(() => loadFieldDataWorkCenter(custpage_workcenter, locationId), 0);
            break;
        }

    }

    const fieldChanged_InputWO = (scriptContext) =>{
        let curRec = scriptContext.currentRecord;
        let sublistId = scriptContext.sublistId;
        let fieldId = scriptContext.fieldId;
        let lineNum = scriptContext.line;

        if(sublistId == "custpage_sl_wo_1"){
            switch(fieldId){
                case "custpage_col_built_qty":
                    caclTlDm_InputWO(curRec, sublistId);
                    calcIssuedQty_InputWO(curRec, sublistId);
                break;
                case "custpage_col_tlg_total":
                    caclTlgHang_InputWO(curRec, sublistId);
                break;
                case "custpage_col_tlg_pallet":
                    caclTlgHang_InputWO(curRec, sublistId);
                break;
                case "custpage_col_tlg_khac":
                    caclTlgHang_InputWO(curRec, sublistId);
                break;
                case "custpage_col_trandt":
                    let tranDt = curRec.getCurrentSublistValue(sublistId, "custpage_col_trandt");
                    curRec.setCurrentSublistValue(sublistId, "custpage_col_mfgdt", tranDt);
                break;
            }

            _scvInventoryDetail.validateField(scriptContext);
        }
        
    }

    const fieldChanged_InputComponent = (scriptContext) =>{
        let curRec = scriptContext.currentRecord;
        let sublistId = scriptContext.sublistId;
        let fieldId = scriptContext.fieldId;
        let lineNum = scriptContext.line;

        if(sublistId == "custpage_sl_component_2"){
            switch(fieldId){
                case "custpage_col_issue_qty":

                break;
            }

            _scvInventoryDetail.validateField(scriptContext);
        }
        
    }

    const calcIssuedQty_InputWO = (_curRec, _sublistId) =>{
        let built_qty = _curRec.getCurrentSublistValue(_sublistId, "custpage_col_built_qty") * 1;
        let woId = _curRec.getCurrentSublistValue(_sublistId, "custpage_col_wo_id");

        let componentSublistId = "custpage_sl_component_1";
        let componentSize = _curRec.getLineCount(componentSublistId);

        for(let i = 0; i < componentSize; i++){
            let component_woId = _curRec.getSublistValue(componentSublistId, "custpage_col_wo_id", i);
            
            if(component_woId != woId) continue;
            
            let usestd_bom_qty = _curRec.getSublistValue(componentSublistId, "custpage_col_usestd_bomqty", i) * 1;
            let conversionrate = _curRec.getSublistValue(componentSublistId, "custpage_col_conversionrate", i) * 1;

            let issued_qty = built_qty * usestd_bom_qty * conversionrate;

            _curRec.selectLine(componentSublistId, i);
            _curRec.setCurrentSublistValue(componentSublistId, "custpage_col_issue_qty", issued_qty);
            _curRec.commitLine(componentSublistId);
        }
    }

    const caclTlDm_InputWO = (_curRec, _sublistId) =>{
        let built_qty = _curRec.getCurrentSublistValue(_sublistId, "custpage_col_built_qty") * 1;
        let dinhmuc = _curRec.getCurrentSublistValue(_sublistId, "custpage_col_wo_dinhmuc") * 1;
        
        let tl_dm = built_qty * dinhmuc;

        _curRec.setCurrentSublistValue(_sublistId, "custpage_col_tlg_dm", tl_dm);

        caclPercentDiff_InputWO(_curRec, _sublistId);
    }

    const caclTlgHang_InputWO = (_curRec, _sublistId) =>{
        let tlg_total = _curRec.getCurrentSublistValue(_sublistId, "custpage_col_tlg_total") * 1;
        let tlg_pallet = _curRec.getCurrentSublistValue(_sublistId, "custpage_col_tlg_pallet") * 1;
        let tlg_khac = _curRec.getCurrentSublistValue(_sublistId, "custpage_col_tlg_khac") * 1;

        let tlg_hang = tlg_total - tlg_pallet - tlg_khac;

        _curRec.setCurrentSublistValue(_sublistId, "custpage_col_tlg_hang", tlg_hang);

        caclPercentDiff_InputWO(_curRec, _sublistId);
    }

    const caclPercentDiff_InputWO = (_curRec, _sublistId) =>{
        let tlg_hang = _curRec.getCurrentSublistValue(_sublistId, "custpage_col_tlg_hang") * 1;
        let tl_dm = _curRec.getCurrentSublistValue(_sublistId, "custpage_col_tlg_dm") * 1;

        let percent_diff = tl_dm == 0 ? 0 : (100 * (tlg_hang - tl_dm)/tl_dm);//to-do
        percent_diff = constFormat.roundNumber(percent_diff);

        _curRec.setCurrentSublistValue(_sublistId, "custpage_col_percentdiff", percent_diff + "%");

        addStyleWarningPercentDiff(_curRec, _sublistId, percent_diff);
    }

    const addStyleWarningPercentDiff = (_curRec, _sublistId, _percentDiff, _index = -1) =>{
        let idxCurLine = _index == -1 ? _curRec.getCurrentSublistIndex(_sublistId) : _index;

        if(_percentDiff < -5 || _percentDiff > 5){
            jQuery("#custpage_col_percentdiff" + (idxCurLine + 1)).attr("style","color: red !important; font-weight: bold !important;")
        }
        else{
            jQuery("#custpage_col_percentdiff" + (idxCurLine + 1)).css({"color": "", "font-weight": ""})

        }
    }

    const loadFieldDataLocation = (_field, _subsidiaryId) => {
        let arrResult = [];

        if(!!_subsidiaryId){
            arrResult = constLocation.getDataSource([
                search.createFilter({
                    name: 'subsidiary',
                    operator: "anyof",
                    values: _subsidiaryId
                }),
                search.createFilter({
                    name: 'custrecord_scv_loc_type',
                    operator: "anyof",
                    values: constLocationType.RECORDS.SANXUAT.ID
                }),
            ]);
        }

        let curRec = constRecord.getCurrentRecord();

        constRecord.initQuickFindFieldSelect(curRec, "custpage_location", {
            data: arrResult,
            valueExpr: "internalid",
            displayExpr: "name",
            reInsertOption: true
        }, false);
    }

    const loadFieldDataWorkCenter = (_field, _locationId) => {
        let arrResult = [];

        if(!!_locationId){
            arrResult = constEntityGroup.getDataSource(
                search.createFilter({
                    name: 'custentity_mfgmob_wclocation',
                    operator: "anyof",
                    values: _locationId
                })
            );
        }

        let curRec = constRecord.getCurrentRecord();

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

    const getCurrentUrlScript = () =>{
        let params = _scvForm.getParameter();

        let urlScript = _scvForm.currentScript.url;
        Object.keys(params).forEach(key => {
            urlScript += "&" + key + "=" + params[key];
        });

        return urlScript;
    }

    const onSearchResult = () =>{
        window.onbeforeunload = null;

        let isValid = _scvForm.validateFieldMandatory([
            "custpage_subsidiary", "custpage_location", "custpage_workcenter",
            "custpage_fromdt", "custpage_todt"
        ]);
        if(!isValid) return;

        let params = _scvForm.getParameter();
        
        let objResParams = excuteWriteCacheData("params", JSON.stringify(params));

        let urlScript = _scvForm.currentScript.url;
        urlScript += "&custpage_externalid=" + params.custpage_externalid;
        urlScript += "&isSearch=T&custpage_currentstep=" + STEP_ACTION.LOAD_DATA.ID;

        window.location.replace(urlScript);
    }

    const backAction = () =>{
        window.onbeforeunload = null;

        let curRec = currentRecord.get();

        let params = _scvForm.getParameter();

        let backStep = params.custpage_currentstep;

        let isValid = false;
        if(params.custpage_currentstep == STEP_ACTION.INPUT_WO.ID){
            isValid = backAction_InputWO(curRec, params);

            backStep = STEP_ACTION.LOAD_DATA.ID;
        }
        else if(params.custpage_currentstep == STEP_ACTION.INPUT_COMPONENT.ID){
            isValid = backAction_InputComponent(curRec, params);
            
            backStep = STEP_ACTION.INPUT_WO.ID;
        }
        else if(params.custpage_currentstep == STEP_ACTION.VIEW_RESULT.ID){
            isValid = backAction_ViewResult(curRec, params);

            backStep = STEP_ACTION.INPUT_COMPONENT.ID;
        }

        if(!isValid) return;
        
        let urlScript = _scvForm.currentScript.url;
        urlScript += "&custpage_externalid=" + params.custpage_externalid;
        urlScript += "&isSearch=T&isBack=T&custpage_currentstep=" + backStep;

        window.location.replace(urlScript);
    }

    const backAction_InputWO = (_curRec, _params) =>{
        let arrWOSelected = getDataOfSublist(_curRec, "custpage_sl_wo_1");
        let arrComponentSelected = getDataOfSublist(_curRec, "custpage_sl_component_1");

        excuteWriteCacheData("custpage_sl_wo_1", JSON.stringify(arrWOSelected));
        excuteWriteCacheData("custpage_sl_component_1", JSON.stringify(arrComponentSelected));

        return true;
    }

    const backAction_InputComponent = (_curRec, _params) =>{
        let arrWOSelected = getDataOfSublist(_curRec, "custpage_sl_wo_2");
        let arrComponentSelected = getDataOfSublist(_curRec, "custpage_sl_component_2");

        excuteWriteCacheData("custpage_sl_wo_2", JSON.stringify(arrWOSelected));
        excuteWriteCacheData("custpage_sl_component_2", JSON.stringify(arrComponentSelected));

        return true;
    }

    const backAction_ViewResult = (_curRec, _params) =>{
        let arrResultSelected = getDataOfSublist(_curRec, "custpage_sl_result");

        excuteWriteCacheData("custpage_sl_result", JSON.stringify(arrResultSelected));

        return true;
    }

    const nextAction = () =>{
        window.onbeforeunload = null;

        let curRec = currentRecord.get();

        let params = _scvForm.getParameter();

        let nextStep = params.custpage_currentstep;

        let isValid = false;
        if(params.custpage_currentstep == STEP_ACTION.LOAD_DATA.ID){
            isValid = nextAction_LoadData(curRec, params);

            nextStep = STEP_ACTION.INPUT_WO.ID;
        }
        else if(params.custpage_currentstep == STEP_ACTION.INPUT_WO.ID){
            isValid = nextAction_InputWO(curRec, params);

            nextStep = STEP_ACTION.INPUT_COMPONENT.ID;
        }
        else if(params.custpage_currentstep == STEP_ACTION.INPUT_COMPONENT.ID){
            isValid = nextAction_InputComponent(curRec, params);

            nextStep = STEP_ACTION.VIEW_RESULT.ID;
        }

        if(!isValid) return;

        let urlScript = _scvForm.currentScript.url;
        urlScript += "&custpage_externalid=" + params.custpage_externalid;
        urlScript += "&isNext=T&custpage_currentstep=" + nextStep;

        window.location.replace(urlScript);
    }

    const nextAction_LoadData = (_curRec, _params) =>{
        let arrWOSelected = getDataOfSublist(_curRec, "custpage_sl_wo");
        if(arrWOSelected.length == 0){
            alert("Chọn ít nhất 1 line WO.");
            return false;
        }

        let arrComponent = getDataOfSublist(_curRec, "custpage_sl_component");
        let arrComponentSelected = [];
        for(let i = 0; i < arrComponent.length; i++){
            let objComponent = arrComponent[i];

            let objWOSelected_find = arrWOSelected.find(e => e.custpage_col_wo == objComponent.custpage_col_wo);
            if(!!objWOSelected_find){
                arrComponentSelected.push({...objComponent});
            }
        }

        if(arrComponentSelected.length == 0){
            alert("Chọn ít nhất 1 line Component.");
            return false;
        }

        excuteWriteCacheData("custpage_sl_wo", JSON.stringify(arrWOSelected));
        excuteWriteCacheData("custpage_sl_component", JSON.stringify(arrComponentSelected));

        return true;
    }

    const nextAction_InputWO = (_curRec, _params) =>{
        let isValidInvDetail = validateInventoryDetail(_curRec, "custpage_sl_wo_1");
        if(!isValidInvDetail) return false

        let arrWOSelected = getDataOfSublist(_curRec, "custpage_sl_wo_1");
        let arrComponentSelected = getDataOfSublist(_curRec, "custpage_sl_component_1");

        excuteWriteCacheData("custpage_sl_wo_1", JSON.stringify(arrWOSelected));
        excuteWriteCacheData("custpage_sl_component_1", JSON.stringify(arrComponentSelected));

        return true;
    }

    const nextAction_InputComponent = (_curRec, _params) =>{
        let isValidInvDetail = validateInventoryDetail(_curRec, "custpage_sl_component_2");
        if(!isValidInvDetail) return false

        let arrWOSelected = getDataOfSublist(_curRec, "custpage_sl_wo_2");
        let arrComponentSelected = getDataOfSublist(_curRec, "custpage_sl_component_2");

        excuteWriteCacheData("custpage_sl_wo_2", JSON.stringify(arrWOSelected));
        excuteWriteCacheData("custpage_sl_component_2", JSON.stringify(arrComponentSelected));

        return true;
    }

    const validateInventoryDetail = (_curRec, _sublistId) =>{
        let size = _curRec.getLineCount(_sublistId);

        for(let i = 0; i < size; i++){
            let isValid = _scvInventoryDetail.validateLine(_sublistId, "custpage_col_inventorydetail", i, true);
            if(!isValid) return false;
        }

        return true;
    }

    const submitFinish = async () =>{
        window.onbeforeunload = null;
        
        let curRec = currentRecord.get();

        let params = _scvForm.getParameter();

        let isValid = nextAction_InputComponent(curRec, params);

        if(!isValid) return;

        if(!confirm("Bạn có chắc chắn muốn tạo Assembly từ WO không?")) return;

        _scvForm.showLoadingDialog(true);

        params.isSubmit = "T";
        params.custpage_currentstep = STEP_ACTION.VIEW_RESULT.ID;

        let urlScript = _scvForm.currentScript.url;
        urlScript += "&custpage_externalid=" + params.custpage_externalid;
        urlScript += "&isSubmit=T&custpage_currentstep=" + STEP_ACTION.VIEW_RESULT.ID;

        libCsXLS.asyncPostDataByAjax(_scvForm.serviceScript.url, {
            action: "createAssemblyFromWO", 
            body: JSON.stringify(params)
        }, function(_res, _paramsCallback){
            _scvForm.showLoadingDialog(false);

            let objRes = _res.data;
            debugger
            if(objRes.isSuccess == true){
                window.location.replace(urlScript);
            }
            else{
                _scvForm.showMsgError("Error: " + objRes.message??"");
            }
            
        },function(request, status, error, _paramsCallback){
            _scvForm.showMsgError(error.message||status);
            _scvForm.showLoadingDialog(false);
        });

        /* let urlScript = _scvForm.currentScript.url;
        urlScript += "&custpage_externalid=" + params.custpage_externalid;
        urlScript += "&isSubmit=T&custpage_currentstep=" + STEP_ACTION.VIEW_RESULT.ID;

        window.location.replace(urlScript); */
    }

    const cancelAction = () =>{
        window.location.replace(_scvForm.currentScript.url);
    }

    const refreshAction = () =>{
        window.onbeforeunload = null;

        let urlScript = getCurrentUrlScript();

        urlScript += "&custpage_currentstep=" + STEP_ACTION.PROCESSING.ID;

        window.location.replace(urlScript);
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

            if(_sublistId == "custpage_sl_wo"){
                let chk = _curRec.getSublistValue(_sublistId, "custpage_col_chk", i);
                if(!chk) continue;
            }

            for(let j = 0; j < arrFields.length; j++){
                let fieldId = arrFields[j];

                objRes[fieldId] = _curRec.getSublistValue(_sublistId, fieldId, i);

                if(["custpage_col_trandt", "custpage_col_mfgdt"].includes(fieldId) && !!objRes[fieldId]){
                    objRes[fieldId] = nlapiDateToString(objRes[fieldId]);
                }
            }

            arrResult.push(objRes);
        }

        return arrResult;
    }

    const excuteWriteCacheData = (_keyCache, _data) =>{
        let curRec = currentRecord.get();

        let keyExternalId = curRec.getValue("custpage_externalid")

        let objRes = https.post({
            url: _scvForm.serviceScript.url,
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

    const openStatusQueue = (_urlPopup, _width, _height, _title) =>{
        nlExtOpenWindow(_urlPopup, 'popupStatusQueue', _width, _height, this, true, _title);
    }

    window.l_sort = () =>{
        return;
    }

    _scvInventoryDetail.callBackPageInit = (scriptContext) =>{
        let curRec = currentRecord.get();
        let inventoryDetalRec = scriptContext.scriptContextPopup.currentRecord;
        let parentSublistId = scriptContext.parentSublistId;
        let parentFieldId = scriptContext.parentFieldId;
        let parentLine = scriptContext.parentLine * 1;

        let detailSublistId = "custpage_inventoryassignment";

        if(inventoryDetalRec.getLineCount(detailSublistId) > 0) return;

        let prodLotNo = curRec.getSublistValue(parentSublistId, "custpage_col_prodlot", parentLine);
        if(!prodLotNo) return;

        inventoryDetalRec.selectNewLine(detailSublistId);
        inventoryDetalRec.setCurrentSublistValue(detailSublistId,"custpage_inventorynumber", prodLotNo);
    }

    const autoInvDetail = (_sublistId) =>{
        _scvForm.showLoadingDialog(true);

        setTimeout(() => autoInvDetail_InputComponent(_sublistId), 100);
    }

    const autoInvDetail_InputComponent = async (_sublistId) =>{
        let params = _scvForm.getParameter();

        let curRec = _scvForm.currentRecord;
        let sizeSublist = curRec.getLineCount(_sublistId);

        let arrItemId = []
        for(let i = 0; i < sizeSublist; i++){
            let itemId = curRec.getSublistValue(_sublistId, "custpage_col_item", i);
            
            arrItemId.push(itemId)
        }

        let arrDataOnhand = constInventoryDetail.getDataItemOnhand({
            location: params.custpage_location,
            item: arrItemId.toString()
        });

        let invDetailStoreFieldId = _scvInventoryDetail.getStoreFieldId("custpage_col_inventorydetail");
        let invDetailNeededFieldId = _scvInventoryDetail.getNeededFieldId("custpage_col_inventorydetail");

        for(let i = 0; i < sizeSublist; i++){
            curRec.selectLine(_sublistId, i);

            //TO-DO
            let locationId = params.custpage_location;
            let itemId = curRec.getSublistValue(_sublistId, "custpage_col_item", i);
            let quantity = curRec.getSublistValue(_sublistId, "custpage_col_issue_qty", i) * 1;

            let objInvDetail = {
                item: itemId,
                quantity: quantity,
                location: locationId,
                inventoryassignment: [],
            };

            let arrOnhandItem = arrDataOnhand.filter(e => e.item == itemId && e.location == locationId && e.available > 0);
            for(let j = 0; j < arrOnhandItem.length; j++){
                let objOnhand = arrOnhandItem[j];

                objOnhand.available = objOnhand.available * 1;

                if(objOnhand.available <= 0) continue;

                let objResInvAss = {
                    custpage_issueinventorynumber: objOnhand.inventorynumber,
                    custpage_issueinventorynumber_display: objOnhand.inventorynumber_display,
                    custpage_binnumber: objOnhand.binnumber,
                    custpage_inventorystatus: objOnhand.status,
                    custpage_inventorystatus_display: objOnhand.status_display,
                    custpage_expirationdate: objOnhand.expirationdate,
                    custpage_lotquantityavailable: objOnhand.available,
                    custpage_quantity: 0,
                };

                if(objOnhand.available > quantity){
                    objResInvAss.custpage_quantity = quantity;

                    objOnhand.available = objOnhand.available - quantity;

                    objInvDetail.inventoryassignment.push(objResInvAss);

                    break;
                }
                else if(objOnhand.available <= quantity){
                    objResInvAss.custpage_quantity = objOnhand.available;

                    quantity = quantity - objOnhand.available;

                    objOnhand.available = 0;

                    objInvDetail.inventoryassignment.push(objResInvAss);
                }
            }

            let invDetailStoreId = _scvInventoryDetail.setDataStoreInventoryClientSide(objInvDetail);

            curRec.setCurrentSublistValue(_sublistId, invDetailStoreFieldId, invDetailStoreId);

            let isNeeded = objInvDetail.inventoryassignment.length == 0 ? true : false;
            curRec.setCurrentSublistValue(_sublistId, invDetailNeededFieldId, isNeeded);

            curRec.commitLine(_sublistId);

            _scvInventoryDetail.enableLineInventoryDetail(_sublistId, "custpage_col_inventorydetail", i);
        }

        _scvForm.showLoadingDialog(false);
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
        markAllOfSublist,
        openStatusQueue,
        autoInvDetail
    };
    
});
