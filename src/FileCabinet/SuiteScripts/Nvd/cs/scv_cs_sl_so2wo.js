/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  24 Feb 2025         Huy Pham			    Init, create file, Tạo hàng loạt WO từ SO, from ms.Ngọc(https://app.clickup.com/t/86cy2jttc)
 */
/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */ 
define(['N/currentRecord', 'N/url', 'N/search',
    '../lib/scv_lib_function.js',
    '../lib/scv_lib_cs.js',
    '../lib/scv_lib_cs_xls.js',
    '../olib/alasql/alasql.min@1.7.3.js', 

    '../cons/scv_cons_record.js'
],

function(currentRecord, url, search,
    lbf,
    libCs,
    libCsXLS,
    alasql,

    constRecord
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
        
        pageInit_initQuickFindFieldSelect(curRec, [
            "custpage_subsidiary", "custpage_customer", "custpage_requestor",
            "custpage_tranid", "custpage_item", "custpage_def_location",
            "custpage_def_ordertype"
        ]);

        initDataOptionSublist(curRec);
    }

    const pageInit_initQuickFindFieldSelect = (_curRec, _lstFieldId = []) =>{
        _lstFieldId.forEach(_fieldId => {
            constRecord.initQuickFindFieldSelect(_curRec, _fieldId, {
                data: _curRec.getField(_fieldId).getSelectOptions(),
                valueExpr: "value",
                displayExpr: "text",
                reInsertOption: false
            }, false);
        });
    }

    const initDataOptionSublist = (_curRec) =>{
        let subsidiaryId = _curRec.getValue("custpage_subsidiary");
        //let arrItem = _curRec.getField("custpage_item").getSelectOptions();
        let arrItemId = [];//arrItem.filter(e => !!e.value).map(e => e.value);
        let arrBomId = [];
        
        let sublistId = "custpage_sl_result";
        if(_curRec.getLineCount(sublistId) > 0){
            let arrBom = _curRec.getSublistField(sublistId, "custpage_col_bom", 0).getSelectOptions()
            arrBomId = arrBom.filter(e => !!e.value).map(e => e.value);
            
            for(let i = 0; i < _curRec.getLineCount(sublistId); i++){
                let itemId = _curRec.getSublistValue(sublistId, "custpage_col_item_id", i);

                let idxItemExists = arrItemId.findIndex(e => e == itemId);
                if(idxItemExists > -1) continue;

                arrItemId.push(itemId);
            }
        }

        let params = {
            custpage_subsidiary: subsidiaryId,
            custpage_item: arrItemId.toString(),
            bom_id: arrBomId.toString()
        };

        let arrActionFunc = [
            {action: "getDataSource_SS02", params: {...params}, data: []},
            {action: "getDataSource_SS03", params: {...params}, data: []},
        ];

        let objResErr = {isError: false, msg: []};

        libCsXLS.asyncPostMultiRequestByAjax(_scvForm.serviceScript.url, arrActionFunc, function (_res){
            arrActionFunc = _res;
            
            if(objResErr.isError){
                objResErr.msg.forEach(_msg => libCs.showMsgError(_msg));
            }
            else{
                initDataOptionSublistBom(_curRec, arrActionFunc.find(e => e.action == "getDataSource_SS02").data);
                initDataOptionSublistBomRevision(_curRec, arrActionFunc.find(e => e.action == "getDataSource_SS03").data);
            }
            
        },function(_res, _paramsCallback){
            
        },function(request, status, error, _paramsCallback){
            objResErr.isError = true;
            objResErr.msg.push(`${_paramsCallback.action} (page ${_paramsCallback.page||0}): ` + (error.message||status))
        });
    }

    const initDataOptionSublistBom = (_curRec, _arrDataSource) =>{
        let sublistId = "custpage_sl_result";
        let size = _curRec.getLineCount(sublistId);
        
        for(let i = 0; i < size; i++){
            let bomField = _curRec.getSublistField(sublistId, "custpage_col_bom", i);

            let itemId = _curRec.getSublistValue(sublistId, "custpage_col_item_id", i);

            let arrBom = _arrDataSource.filter(e => e.assembly == itemId);
            arrBom = alasql("SELECT DISTINCT internalid, name FROM ? ORDER BY name", [arrBom]);

            constRecord.initLoadFieldClient(bomField, {
                data: arrBom,
                valueExpr: "internalid",
                displayExpr: "name"
            },true);

            let bomId = _curRec.getSublistValue(sublistId, "custpage_col_bom_id", i);

            _curRec.selectLine(sublistId, i);
            _curRec.setCurrentSublistValue(sublistId, "custpage_col_bom", bomId);
            _curRec.commitLine(sublistId);
        }
    }

    const initDataOptionSublistBomRevision = (_curRec, _arrDataSource) =>{
        let sublistId = "custpage_sl_result";
        let size = _curRec.getLineCount(sublistId);
        
        for(let i = 0; i < size; i++){
            let bomField = _curRec.getSublistField(sublistId, "custpage_col_bomrevison", i);

            let bomId = _curRec.getSublistValue(sublistId, "custpage_col_bom_id", i);

            let arrBomRevision = _arrDataSource.filter(e => e.bom_internalid == bomId);
            arrBomRevision = alasql("SELECT DISTINCT internalid, name FROM ? ORDER BY name", [arrBomRevision]);

            constRecord.initLoadFieldClient(bomField, {
                data: arrBomRevision,
                valueExpr: "internalid",
                displayExpr: "name"
            },true);

            let bomRevisionId = _curRec.getSublistValue(sublistId, "custpage_col_bomrevison_id", i);

            _curRec.selectLine(sublistId, i);
            _curRec.setCurrentSublistValue(sublistId, "custpage_col_bomrevison", bomRevisionId);
            _curRec.commitLine(sublistId);
        }
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
        let sublistId = scriptContext.sublistId;
        let fieldId = scriptContext.fieldId;

        switch(fieldId){
            case "custpage_subsidiary":
                setTimeout(() => loadFieldDataBySubsidiary(curRec), 0);
            break;
        }

    }

    const loadFieldDataBySubsidiary = (_curRec) =>{
        let subsidiaryId = _curRec.getValue("custpage_subsidiary");

        let params = {
            custpage_subsidiary: subsidiaryId
        };

        let arrActionFunc = [
            {action: "getDataSource_SS04", params: {...params}, data: []},
            {action: "getDataSource_SS05", params: {...params}, data: []},
            {action: "getDataSource_SS06", params: {...params}, data: []},
            {action: "getDataSource_SS07", params: {...params}, data: []},
            {action: "getDataSourceLocation", params: {...params}, data: []},
        ];

        let objResErr = {isError: false, msg: []};

        libCsXLS.asyncPostMultiRequestByAjax(_scvForm.serviceScript.url, arrActionFunc, function (_res){
            arrActionFunc = _res;

            if(objResErr.isError){
                objResErr.msg.forEach(_msg => libCs.showMsgError(_msg));
            }
            else{
                loadFieldDataCustomer(_curRec, arrActionFunc.find(e => e.action == "getDataSource_SS06").data);
                loadFieldDataRequestor(_curRec, arrActionFunc.find(e => e.action == "getDataSource_SS07").data);
                loadFieldDataTranid(_curRec, arrActionFunc.find(e => e.action == "getDataSource_SS04").data);
                loadFieldDataItem(_curRec, arrActionFunc.find(e => e.action == "getDataSource_SS05").data);
                loadFieldDataDefLocation(_curRec, arrActionFunc.find(e => e.action == "getDataSourceLocation").data);
            }
            
        },function(_res, _paramsCallback){
            
        },function(request, status, error, _paramsCallback){
            objResErr.isError = true;
            objResErr.msg.push(`${_paramsCallback.action} (page ${_paramsCallback.page||0}): ` + (error.message||status))
        });
    }

    const loadFieldDataCustomer = (_curRec, _arrDataSource) =>{
        constRecord.initQuickFindFieldSelect(_curRec, "custpage_customer", {
            data: _arrDataSource,
            valueExpr: "customer_id",
            displayExpr: "customer",
            reInsertOption: true
        }, false);
    }

    const loadFieldDataRequestor = (_curRec, _arrDataSource) =>{
        constRecord.initQuickFindFieldSelect(_curRec, "custpage_requestor", {
            data: _arrDataSource,
            valueExpr: "requestor_id",
            displayExpr: "requestor_display",
            reInsertOption: true
        }, false);
    }

    const loadFieldDataTranid = (_curRec, _arrDataSource) =>{
        constRecord.initQuickFindFieldSelect(_curRec, "custpage_tranid", {
            data: _arrDataSource,
            valueExpr: "internalid",
            displayExpr: "tranid",
            reInsertOption: true
        }, false);
    }

    const loadFieldDataItem = (_curRec, _arrDataSource) =>{
        constRecord.initQuickFindFieldSelect(_curRec, "custpage_item", {
            data: _arrDataSource,
            valueExpr: "item_id",
            displayExpr: "item_display",
            reInsertOption: true
        }, false);
    }

    const loadFieldDataDefLocation = (_curRec, _arrDataSource) =>{
        constRecord.initQuickFindFieldSelect(_curRec, "custpage_def_location", {
            data: _arrDataSource,
            valueExpr: "internalid",
            displayExpr: "name",
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
        let curRec = scriptContext.currentRecord;

        let locationId = curRec.getValue("custpage_def_location");

        let sublistId = "custpage_sl_result";
        let size = curRec.getLineCount(sublistId);

        let objResErr = {isError: true, msg: []};

        for(let i = 0; i < size; i++){
            let chk = curRec.getSublistValue(sublistId, "custpage_col_chk", i);
            if(!chk) continue;

            objResErr.isError = false;

            let quantity = curRec.getSublistValue(sublistId, "custpage_col_quantity", i);
            if(!lbf.isContainValue(quantity)){
                objResErr.msg.push(`Dòng [${i + 1}] chưa nhập số lượng sản xuất.`);
                objResErr.isError = true;
                break;
            }

            let bomId = curRec.getSublistValue(sublistId, "custpage_col_bom", i);
            if(!lbf.isContainValue(bomId)){
                objResErr.msg.push(`Dòng [${i + 1}] chưa nhập BOM.`);
                objResErr.isError = true;
                break;
            }

            let bomRevisionId = curRec.getSublistValue(sublistId, "custpage_col_bomrevison", i);
            if(!lbf.isContainValue(bomRevisionId)){
                objResErr.msg.push(`Dòng [${i + 1}] chưa nhập BOM Revision.`);
                objResErr.isError = true;
                break;
            }

            let workOrderTypeId = curRec.getSublistValue(sublistId, "custpage_col_workordertype", i);
            if(!lbf.isContainValue(workOrderTypeId)){
                objResErr.msg.push(`Dòng [${i + 1}] chưa nhập Loại Lệnh Sản Xuất.`);
                objResErr.isError = true;
                break;
            }

            let lineLocationId = curRec.getSublistValue(sublistId, "custpage_col_location", i);
            if(!lbf.isContainValue(lineLocationId) && !lbf.isContainValue(locationId)){
                objResErr.msg.push(`Dòng [${i + 1}] chưa nhập Kho Sản Xuất.`);
                objResErr.isError = true;
                break;
            }
        }

        if(objResErr.isError){
            if(objResErr.msg.length > 0){
                objResErr.msg.forEach(_msg => libCs.showMsgError(_msg));
            }
            else{
                libCs.showMsgError("Chọn ít nhất 1 dòng để Tạo Lệnh Sản Xuất")
            }
            
            return false;
        }

        return confirm("Bạn muốn Tạo Lệnh Sản Xuất?");
    }

    const onSearchResult = () =>{
        window.onbeforeunload = null;

        let curRec = currentRecord.get();
        let isValid = libCs.validateFieldMandatory(curRec, [
            "custpage_subsidiary", "custpage_fromdt", "custpage_todt"
        ]);
        if(!isValid) return;

        let params = _scvForm.getParameter();

        let urlScript = url.resolveScript({
            scriptId: _scvForm.currentScript.id,
            deploymentId: _scvForm.currentScript.deploymentId,
            params: params
        });

        urlScript += "&isSearch=T";

        window.location.replace(urlScript);
    }

    const openStatusQueue = (_urlPopup, _width, _height, _title) =>{
        nlExtOpenWindow(_urlPopup, 'popupStatusQueue', _width, _height, this, true, _title);
    }

    return {
        pageInit,
        fieldChanged,
        saveRecord,
        onSearchResult,
        openStatusQueue
    };
    
});
