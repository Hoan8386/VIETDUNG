/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/url', '../lib/scv_lib_cs'],
    
    function (ccr, url, libCs) {
        
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
            const customButtonTransferOrder = document.getElementById('tr_custpage_bt_transferorder');
            if (customButtonTransferOrder) {
                customButtonTransferOrder.classList.add('pgBntB');
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
            let isValid = false;
            let sublistId = 'custpage_sl_result';
            let currentRecord = scriptContext.currentRecord;
            let message = 'Hãy chọn ít nhất một line!';
            
            let lineCount = currentRecord.getLineCount(sublistId);
            for (let i = 0; i < lineCount; i++) {
                let chon = currentRecord.getSublistValue({sublistId: sublistId, fieldId: 'chon', line: i});
                if (chon === true) {
                    isValid = true;
                    break;
                }
            }
            if (!isValid) {
                alert(message);
            } else {
                libCs.showPleaseWait();
            }
            return isValid;
        }
        
        function transferOrder() {
            window.onbeforeunload = null;
            let currentRecord = ccr.get();
            if (saveRecord({currentRecord})) {
                currentRecord.setValue('custpage_type', 'transferorder');
                const submitButtonTransferOrder = document.getElementById('custpage_bt_transferorder');
                if (submitButtonTransferOrder.disabled) {
                    alert('Giao dịch đang được xử lý, vui lòng chờ...');
                    return false;
                }
                submitButtonTransferOrder.disabled = true;
                const submitButton = document.querySelector('input[type="submit"]');
                submitButton.click();
            }
        }
        
        function searchReport() {
            window.onbeforeunload = null;
            let currentRecord = ccr.get();
            let urlDC = getUrlParam(currentRecord) + '&issearch=T';
            window.location.replace(urlDC);
        }
        
        function getUrlParam(currentRecord) {
            return url.resolveScript({
                scriptId: 'customscript_scv_sl_cmms_thongke_vtscbd',
                deploymentId: 'customdeploy_scv_sl_cmms_thongke_vtscbd',
                returnExternalUrl: false,
                params: getParam(currentRecord)
            });
        }
        
        function getParam(currentRecord) {
            return {
                custpage_subsidiary: currentRecord.getValue('custpage_subsidiary'),
                custpage_fromdate: currentRecord.getText('custpage_fromdate'),
                custpage_todate: currentRecord.getText('custpage_todate'),
                custpage_asset: currentRecord.getValue('custpage_asset')
            }
        }
        
        return {
            pageInit: pageInit,
            saveRecord: saveRecord,
            transferOrder: transferOrder,
            searchReport: searchReport
        };
        
    });
