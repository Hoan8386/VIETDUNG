/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['../lib/scv_lib_cmms'],
    
    function (libCmms) {
        
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
            setTimeout(() => {
                recmachcustrecord_scv_cmms_bg_wo_machine.clearline(true);
            }, 1000);
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
            if (scriptContext.sublistId === libCmms.CmmsSublistId.SCBD_DU_TOAN) {
                let optionsDuToanEstimate = {
                    fieldIdQuantity: 'custrecord_scv_cmms_bg_estimatequantity',
                    fieldIdRate: 'custrecord_scv_cmms_bg_estimaterate',
                    fieldIdAmount: 'custrecord_scv_cmms_bg_estimateamount'
                };
                let optionsDuToanActual = {
                    fieldIdQuantity: 'custrecord_scv_cmms_bg_actualquantity',
                    fieldIdRate: 'custrecord_scv_cmms_bg_actualrate',
                    fieldIdAmount: 'custrecord_scv_cmms_bg_actualamount'
                };
                libCmms.setCurrentSublistValueAmount(scriptContext, optionsDuToanEstimate);
                libCmms.setCurrentSublistValueAmount(scriptContext, optionsDuToanActual);
            } else if (scriptContext.sublistId === libCmms.CmmsSublistId.SCBD_THUE_NGOAI) {
                let optionsThueNgoai = {
                    fieldIdQuantity: 'custrecord_scv_cmms_os_quantity',
                    fieldIdRate: 'custrecord_scv_cmms_os_rate',
                    fieldIdAmount: 'custrecord_scv_cmms_os_amount'
                };
                libCmms.setCurrentSublistValueAmount(scriptContext, optionsThueNgoai);
                let optionsTNGrossAmount = {
                    fieldIdAmount: 'custrecord_scv_cmms_os_amount',
                    fieldIdTax: 'custrecord_scv_cmms_os_vat',
                    fieldIdGrossAmount: 'custrecord_scv_cmms_os_grossamount'
                }
                libCmms.setCurrentSublistValueGrossAmount(scriptContext, optionsTNGrossAmount);
            } else if (scriptContext.sublistId === libCmms.CmmsSublistId.SCBD_NHAN_CONG) {
                let optionsNhanCongPlan = {
                    fieldIdQuantity: 'custrecord_scv_cmms_lb_planquantity',
                    fieldIdRate: 'custrecord_scv_cmms_lb_planrate',
                    fieldIdAmount: 'custrecord_scv_cmms_lb_planamout'
                };
                let optionsNhanCongActual = {
                    fieldIdQuantity: 'custrecord_scv_cmms_lb_actualquantity',
                    fieldIdRate: 'custrecord_scv_cmms_lb_actualrate',
                    fieldIdAmount: 'custrecord_scv_cmms_lb_actualamount'
                };
                libCmms.setCurrentSublistValueAmount(scriptContext, optionsNhanCongPlan);
                libCmms.setCurrentSublistValueAmount(scriptContext, optionsNhanCongActual);
            }
        }
        
        /**
         * Function to be executed after line is selected.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @since 2015.2
         */
        function lineInit(scriptContext) {
            if (scriptContext.sublistId === libCmms.CmmsSublistId.SCBD_DU_TOAN) {
                let currentRecord = scriptContext.currentRecord;
                let options = {
                    sublistId: libCmms.CmmsSublistId.SCBD_DU_TOAN,
                    listFields: libCmms.CmmsFieldsAndFieldsHeader.SCBD_DU_TOAN
                }
                initCurrentSublistValueFromHeader(currentRecord, options);
            }
        }
        
        function initCurrentSublistValueFromHeader(currentRecord, options) {
            for (let objField of options.listFields) {
                if (!currentRecord.getCurrentSublistValue({sublistId: options.sublistId, fieldId: objField.fieldId})) {
                    currentRecord.setCurrentSublistValue({
                        sublistId: options.sublistId,
                        fieldId: objField.fieldId,
                        value: currentRecord.getValue(objField.fieldIdHeader)
                    });
                }
            }
        }
        
        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            lineInit: lineInit
        };
        
    });
