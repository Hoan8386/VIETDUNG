/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/url'],
    
    function (currentRecord, url) {
        
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
        
        function onExport() {
            window.onbeforeunload = null;
            var currRecord = currentRecord.get();
            var urlDC = url.resolveScript({
                scriptId: 'customscript_scv_sl_bs_rpt_export',
                deploymentId: 'customdeploy_scv_sl_bs_rpt_export',
                returnExternalUrl: false
            });
            urlDC = urlDC + plusParam(currRecord);
            window.open(urlDC);
            
        }
        
        function onSearchResult() {
            window.onbeforeunload = null;
            var currRecord = currentRecord.get();
            var urlDC = url.resolveScript({
                scriptId: 'customscript_scv_sl_bs_rpt',
                deploymentId: currRecord.getValue("custpage_scv_deploymentid"),
                returnExternalUrl: false
            });
            urlDC = urlDC + plusParam(currRecord);
            window.location.replace(urlDC);
        }
        
        function plusParam(currRecord) {
            var curtodt = currRecord.getValue('custpage_curtodt');
            var curtodt_header = "ngày " + curtodt.getDate() + " tháng " + (curtodt.getMonth() + 1) + " năm " + curtodt.getFullYear();
            
            return '&custpage_subsidiary=' + currRecord.getValue('custpage_subsidiary')
                + '&custpage_curtodt=' + currRecord.getText('custpage_curtodt')
                + '&custpage_beftodt=' + currRecord.getText('custpage_beftodt')
                + '&curtodt_header=' + curtodt_header
                + '&isrun=1';
        }
        
        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            onSearchResult: onSearchResult,
            onExport: onExport
        };
        
    });
