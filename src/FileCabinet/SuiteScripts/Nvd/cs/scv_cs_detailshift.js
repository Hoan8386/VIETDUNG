/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  2 Mar 2025          Huy Pham			    Init, create file, Chức năng tính toán Số lượng lỗi lật tấm, from mr.NĐHuy(https://app.clickup.com/t/86cy51faq)
 */
/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define([
    '../cons/scv_cons_detailshift.js'
],

    function (
        constDetailShift
    ) {

        function pageInit(scriptContext) {

        }

        function fieldChanged(scriptContext) {
            let curRec = scriptContext.currentRecord;
            let fieldId = scriptContext.fieldId;

            if(["custrecord_scv_ds_to", "custrecord_scv_ds_error_des"].includes(fieldId)){
                constDetailShift.calcSingleError(curRec);
            }
            if(["custrecord_scv_ds_error", "custrecord_scv_ds_single_error"].includes(fieldId)){
                constDetailShift.calcMultiError(curRec);
            }
        }

        return {
            //pageInit,
            fieldChanged,
        };

    });
