/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([],

function() {

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
        let currentRecord = scriptContext.currentRecord;
        let fieldId = scriptContext.fieldId;
        let fieldIdsToResetName = ['custrecord_scv_sales_price_cate', 'custrecord_scv_sales_price_start_date', 'custrecord_scv_st_customer', 'custrecord_scv_spt_group'];
        if(fieldIdsToResetName.includes(fieldId)) {
            currentRecord.setValue('name', 'ToBeGen');
        }
    }

    return {
        fieldChanged: fieldChanged
    };
    
});
