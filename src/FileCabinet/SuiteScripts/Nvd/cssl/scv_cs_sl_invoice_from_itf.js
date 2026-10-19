/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/url'],
    
    function (ccr, url) {
        
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
            let sublistId = 'result_invoice';
            let isValid = false;
            let currentRecord = scriptContext.currentRecord;
            let message = 'Hãy chọn ít nhất một line!';
            
            let lineCount = currentRecord.getLineCount(sublistId);
            for(let i = 0; i < lineCount; i++) {
                let chon = currentRecord.getSublistValue({sublistId: sublistId, fieldId: 'check', line: i});
                if(chon === true) {
                    isValid = true; break;
                }
            }
            if(!isValid) {
                alert(message);
            }
            return isValid;
        }
        
        function doSearchResult() {
            window.onbeforeunload = null;
            let currRecord = ccr.get();
            let params = getParmas(currRecord);
            let messageInfo = validateSearch(params);
            if(messageInfo) {
                alert(messageInfo);
                return;
            }
            let urlInvoiceFromItf = url.resolveScript({
                scriptId: 'customscript_scv_sl_invoice_from_itf',
                deploymentId: 'customdeploy_scv_sl_invoice_from_itf',
                returnExternalUrl: false,
                params: params
            });
            window.location.replace(`${urlInvoiceFromItf}&isSearch=T`);
        }
        
        const validateSearch = (params) => {
            let messageInfo = '';
            if(!params.custpage_fromdate || !params.custpage_todate) {
                messageInfo = 'Hãy chọn Từ ngày XK, Đến ngày XK!';
            }
            return messageInfo;
        }
        
        const getParmas = (currRecord) => {
            return {
                custpage_subsidiary: currRecord.getValue('custpage_subsidiary'),
                custpage_customer: currRecord.getValue('custpage_customer'),
                custpage_fromdate: currRecord.getText('custpage_fromdate'),
                custpage_todate: currRecord.getText('custpage_todate'),
                custpage_itemfulfillment: currRecord.getValue('custpage_itemfulfillment'),
                custpage_salesorder: currRecord.getValue('custpage_salesorder'),
                custpage_trandate: currRecord.getText('custpage_trandate')
            };
        }
        
        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            saveRecord: saveRecord,
            doSearchResult: doSearchResult
            
        };
    });
