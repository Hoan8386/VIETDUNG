/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  27 Feb 2025         Huy Pham			    Init, create file, Nút Tạo Intercompany Transfer Order từ SO, from ms.Ngọc(https://app.clickup.com/t/86cy2vkkk)
 *  12 Mar 2025         Huy Pham			    Thay đổi Sub + location nhập, from ms.Ngọc(https://app.clickup.com/t/86cy2vkkk?comment=90160097408858)   
 */
/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */ 
define([
    '../lib/scv_lib_function.js', '../lib/scv_lib_cs.js', '../lib/scv_lib_cs_xls.js',

    '../cons/scv_cons_record.js'
],

function(
    lbf, libCs, libCsXLS,

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
        
        let objParamsUrl = _scvForm.getUrlParams();
        if(objParamsUrl.isCompeleted == "T"){
            window.getParent().location.reload();
            cancelPopup();
            return;
        }
        else{
            pageInit_initQuickFindFieldSelect(curRec, [
                "custpage_def_location", "custpage_def_locationin"
            ]);
        }
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
            case "custpage_def_subsidiary":
                setTimeout(() => loadFieldDataBySubsidiary(curRec), 0);
            break;
            case "custpage_def_location":
                setDefaultLineLocation(curRec);
            break;
            case "custpage_def_subsidiaryin":
                setTimeout(() => loadFieldDataBySubsidiaryIn(curRec), 0);
            break;
            case "custpage_def_locationin":
                setDefaultLineLocationIn(curRec);
            break;
        }
    }

    const loadFieldDataBySubsidiaryIn = (_curRec) =>{
        let params = {
            custpage_def_subsidiaryin: _curRec.getValue("custpage_def_subsidiaryin")
        };

        let arrActionFunc = [
            {action: "getDataSourceLocationIn", params: {...params}, data: []},
        ];

        let objResErr = {isError: false, msg: []};

        libCsXLS.asyncPostMultiRequestByAjax(_scvForm.serviceScript.url, arrActionFunc, function (_res){
            arrActionFunc = _res;

            if(objResErr.isError){
                objResErr.msg.forEach(_msg => libCs.showMsgError(_msg));
            }
            else{
                loadFieldDataDefLocationIn(_curRec, arrActionFunc.find(e => e.action == "getDataSourceLocationIn").data);
            }
            
        },function(_res, _paramsCallback){
            
        },function(request, status, error, _paramsCallback){
            objResErr.isError = true;
            objResErr.msg.push(`${_paramsCallback.action} (page ${_paramsCallback.page||0}): ` + (error.message||status))
        });
    }

    const loadFieldDataDefLocationIn = (_curRec, _arrDataSource) =>{
        constRecord.initQuickFindFieldSelect(_curRec, "custpage_def_locationin", {
            data: _arrDataSource,
            valueExpr: "internalid",
            displayExpr: "name",
            reInsertOption: true
        }, false);

        let sublistId = "custpage_sl_result";
        let size = _curRec.getLineCount(sublistId);
        
        for(let i = 0; i < size; i++){
            let locationField = _curRec.getSublistField(sublistId, "custpage_col_locationin", i);

            constRecord.initLoadFieldClient(locationField, {
                data: _arrDataSource,
                valueExpr: "internalid",
                displayExpr: "name"
            },true);
            
            _curRec.selectLine(sublistId, i);
            _curRec.setCurrentSublistValue(sublistId, "custpage_col_locationin", "");
            _curRec.commitLine(sublistId);
        }
    }

    const setDefaultLineLocationIn = (_curRec) =>{
        let locationId = _curRec.getValue("custpage_def_locationin");

        let sublistId = "custpage_sl_result";
        let size = _curRec.getLineCount(sublistId);

        for(let i = 0; i < size; i++){
            let chk = _curRec.getSublistValue(sublistId, "custpage_col_chk", i);
            if(!chk) continue;

            _curRec.selectLine(sublistId, i);
            _curRec.setCurrentSublistValue(sublistId, "custpage_col_locationin", locationId);
            _curRec.commitLine(sublistId);
        }
    }

    const loadFieldDataBySubsidiary = (_curRec) =>{
        let params = {
            custpage_def_subsidiary: _curRec.getValue("custpage_def_subsidiary")
        };

        let arrActionFunc = [
            {action: "getDataSourceLocation", params: {...params}, data: []},
        ];

        let objResErr = {isError: false, msg: []};

        libCsXLS.asyncPostMultiRequestByAjax(_scvForm.serviceScript.url, arrActionFunc, function (_res){
            arrActionFunc = _res;

            if(objResErr.isError){
                objResErr.msg.forEach(_msg => libCs.showMsgError(_msg));
            }
            else{
                loadFieldDataDefLocation(_curRec, arrActionFunc.find(e => e.action == "getDataSourceLocation").data);
            }
            
        },function(_res, _paramsCallback){
            
        },function(request, status, error, _paramsCallback){
            objResErr.isError = true;
            objResErr.msg.push(`${_paramsCallback.action} (page ${_paramsCallback.page||0}): ` + (error.message||status))
        });
    }

    const loadFieldDataDefLocation = (_curRec, _arrDataSource) =>{
        constRecord.initQuickFindFieldSelect(_curRec, "custpage_def_location", {
            data: _arrDataSource,
            valueExpr: "internalid",
            displayExpr: "name",
            reInsertOption: true
        }, false);

        let sublistId = "custpage_sl_result";
        let size = _curRec.getLineCount(sublistId);
        
        for(let i = 0; i < size; i++){
            let locationField = _curRec.getSublistField(sublistId, "custpage_col_location", i);

            constRecord.initLoadFieldClient(locationField, {
                data: _arrDataSource,
                valueExpr: "internalid",
                displayExpr: "name"
            },true);

            _curRec.selectLine(sublistId, i);
            _curRec.setCurrentSublistValue(sublistId, "custpage_col_location", "");
            _curRec.commitLine(sublistId);
        }
    }

    const setDefaultLineLocation = (_curRec) =>{
        let locationId = _curRec.getValue("custpage_def_location");

        let sublistId = "custpage_sl_result";
        let size = _curRec.getLineCount(sublistId);

        for(let i = 0; i < size; i++){
            let chk = _curRec.getSublistValue(sublistId, "custpage_col_chk", i);
            if(!chk) continue;

            _curRec.selectLine(sublistId, i);
            _curRec.setCurrentSublistValue(sublistId, "custpage_col_location", locationId);
            _curRec.commitLine(sublistId);
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
        let curRec = scriptContext.currentRecord;

        let locationId = curRec.getValue("custpage_def_location");
        let locationInId = curRec.getValue("custpage_def_locationin");

        let sublistId = "custpage_sl_result";
        let size = curRec.getLineCount(sublistId);

        let objResErr = {isError: true, msg: []};
        debugger
        for(let i = 0; i < size; i++){
            let chk = curRec.getSublistValue(sublistId, "custpage_col_chk", i);
            if(!chk) continue;

            objResErr.isError = false;

            let quantity = curRec.getSublistValue(sublistId, "custpage_col_quantity", i);
            if(!lbf.isContainValue(quantity)){
                objResErr.msg.push(`Dòng [${i + 1}] chưa nhập số lượng.`);
                objResErr.isError = true;
                break;
            }

            let lineLocationId = curRec.getSublistValue(sublistId, "custpage_col_location", i);
            if(!lbf.isContainValue(lineLocationId) && !lbf.isContainValue(locationId)){
                objResErr.msg.push(`Dòng [${i + 1}] chưa nhập Kho Xuất.`);
                objResErr.isError = true;
                break;
            }

            let lineLocationInId = curRec.getSublistValue(sublistId, "custpage_col_locationin", i);
            if(!lbf.isContainValue(lineLocationInId) && !lbf.isContainValue(locationInId)){
                objResErr.msg.push(`Dòng [${i + 1}] chưa nhập Kho Nhập.`);
                objResErr.isError = true;
                break;
            }
        }

        if(objResErr.isError){
            if(objResErr.msg.length > 0){
                objResErr.msg.forEach(_msg => libCs.showMsgError(_msg));
            }
            else{
                libCs.showMsgError("Chọn ít nhất 1 dòng để Tạo Yêu Cầu")
            }
            
            return false;
        }

        if(!confirm("Bạn muốn Tạo Yêu Cầu?")) return false;

        setTimeout(() => libCs.showLoadingDialog(true), 0);
        return true;
    }

    const cancelPopup = () =>{
        closePopup(true);
    }

    return {
        pageInit,
        fieldChanged,
        saveRecord,
        cancelPopup
    };
    
});
