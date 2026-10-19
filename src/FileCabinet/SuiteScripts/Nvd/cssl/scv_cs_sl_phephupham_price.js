/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/url',
        '../lib/scv_lib_cs.js'],
    
    function (ccr, url,
              libCs) {
        
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
            let fieldId = scriptContext.fieldId;
            let currentRecord = scriptContext.currentRecord;
            if (fieldId === 'custpage_subsidiary') {
                let subsidiary = currentRecord.getValue('custpage_subsidiary');
                
                let c = ['name', 'namenohierarchy'];
                let f = [];
                if (subsidiary) {
                    f = [['subsidiary', 'anyOf', subsidiary], 'and', ['isinactive', 'is', false]];
                }
                
                let locationfield = currentRecord.getField('custpage_location');
                if (locationfield != null) {
                    let locationvalue = currentRecord.getValue('custpage_location');
                    locationfield.removeSelectOption({value: null});
                    libCs.insertSelection([locationfield], 'location', c, f, true, locationvalue);
                }
                
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
            let sublistId = 'custpage_result';
            let isValid = false;
            let currentRecord = scriptContext.currentRecord;
            let message = 'Hãy chọn ít nhất một line!';
            
            let lineCount = currentRecord.getLineCount(sublistId);
            for (let i = 0; i < lineCount; i++) {
                let chon = currentRecord.getSublistValue({sublistId: sublistId, fieldId: 'check', line: i});
                if (chon === true) {
                    isValid = true;
                    break;
                }
            }
            if (!isValid) {
                alert(message);
            }
            return isValid;
        }
        
        function doSearchResult() {
            window.onbeforeunload = null;
            let currRecord = ccr.get();
            let params = getParmas(currRecord);
            let messageInfo = validateSearch(params);
            if (messageInfo) {
                alert(messageInfo);
                return;
            }
            let urlInvoiceFromItf = url.resolveScript({
                scriptId: 'customscript_scv_sl_phephupham_price',
                deploymentId: 'customdeploy_scv_sl_phephupham_price',
                returnExternalUrl: false,
                params: params
            });
            window.location.replace(`${urlInvoiceFromItf}&isSearch=T`);
        }
        
        const validateSearch = (params) => {
            let messageInfo = '';
            if (!params.custpage_fromdate || !params.custpage_todate) {
                messageInfo = 'Hãy chọn Từ ngày, Đến ngày!';
            }
            return messageInfo;
        }
        
        const getParmas = (currRecord) => {
            return {
                custpage_subsidiary: currRecord.getValue('custpage_subsidiary'),
                custpage_location: currRecord.getValue('custpage_location'),
                custpage_fromdate: currRecord.getText('custpage_fromdate'),
                custpage_todate: currRecord.getText('custpage_todate'),
                custpage_item: currRecord.getValue('custpage_item')
            };
        }
        
        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            saveRecord: saveRecord,
            doSearchResult: doSearchResult
            
        };
    });
