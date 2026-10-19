/**
 * Nội dung:
 * Key:
 * * =======================================================================================
 *  Date                Author                  Description
 *  ?                   ?                       ?
 *  06 Aug 2025         Thành Ngô                 Create file kiểm tra trùng tên mã thanh toán from Ms.Kỳ (https://app.clickup.com/t/86czwru9k)
 *
**/

/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['../common/scv_common_ma_tt_xnk'],

function(comMaTt) {
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
        let rec = scriptContext.currentRecord;
        return !comMaTt.trungMaThanhToan(rec);
    }

    return {
        saveRecord: saveRecord
    };
    
});
