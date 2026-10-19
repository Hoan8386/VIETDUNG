/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  14 May 2025         Huy Pham			    Init, create file, tạo PO từ SO (nội bộ), from ms.Ngọc(https://app.clickup.com/t/86cyxbm9m)
 */
/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */ 
define([
    '../cons/scv_cons_record.js'
],

function(
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
            constRecord.pageInitQuickFindFieldSelect(curRec, ["custpage_def_vendor", "custpage_def_location"]);
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
        debugger
        let curRec = scriptContext.currentRecord;

        let sublistId = "custpage_sl_result";
        let size = curRec.getLineCount(sublistId);

        let objResErr = {isError: true, msg: []};

        for(let i = 0; i < size; i++){
            let chk = curRec.getSublistValue(sublistId, "custpage_col_chk", i);
            if(!chk) continue;

            objResErr.isError = false;

            let quantity = curRec.getSublistValue(sublistId, "custpage_col_quantity", i);
            if(!_scvForm.isContainValue(quantity)){
                objResErr.msg.push(`Dòng [${i + 1}] chưa nhập số lượng.`);
                objResErr.isError = true;
                break;
            }
        }

        if(objResErr.isError){
            if(objResErr.msg.length > 0){
                objResErr.msg.forEach(_msg => _scvForm.showMsgError(_msg));
            }
            else{
                _scvForm.showMsgError("Chọn ít nhất 1 dòng để Tạo Yêu Cầu")
            }
            
            return false;
        }

        if(!confirm("Bạn muốn Tạo Yêu Cầu?")) return false;

        setTimeout(() => _scvForm.showLoadingDialog(true), 0);

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
