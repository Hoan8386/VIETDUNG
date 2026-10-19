/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['../lib/scv_lib_cmms'],
    
    function (libCmms) {
        
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
            let options = {
                fieldIdQuantity: 'custrecord_scv_cmms_bom_quantity',
                fieldIdRate: 'custrecord_scv_cmms_bom_rate',
                fieldIdAmount: 'custrecord_scv_cmms_bom_amount'
            };
            libCmms.setCurrentSublistValueAmount(scriptContext, options);
        }
        
        return {
            fieldChanged: fieldChanged
        };
        
    });
