/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/url'],
    function (ccr,  url) {

        function getUrlSL(curRec,objParams) {
            return url.resolveScript({ scriptId: 'customscript_scv_sl_BangKeThue_HHDV', deploymentId: 'customdeploy_scv_sl_BangKeThue_HHDV', params:  (objParams || {})})
                + plusParam(curRec);
        }

        function plusParam(currentRecord) {
            let subsidiary_param = currentRecord.getValue('custpage_subsidiary');
            let subsidiaryText_param = currentRecord.getText('custpage_subsidiary');
            let loaibangke_param = currentRecord.getValue('custpage_loaibangke');
            let loaibangkeText_param = currentRecord.getText('custpage_loaibangke');
            let from_Date_param = currentRecord.getText('custpage_fromdate');
            let to_Date_param = currentRecord.getText('custpage_todate');
            let from_nhd = currentRecord.getText('custpage_fromdate_nhd');
            let to_nhd = currentRecord.getText('custpage_todate_nhd');
            let currency = currentRecord.getValue('custpage_currency');
            let chief_accountant = currentRecord.getValue('custpage_chief_accountant');
            return '&isRun=1'+ '&custpage_loaibangke=' + loaibangke_param + '&custpage_loaibangkeText=' + loaibangkeText_param
                + '&custpage_subsidiary=' + subsidiary_param + '&custpage_subsidiaryText=' + subsidiaryText_param
                + '&custpage_fromdate=' + from_Date_param + '&custpage_todate=' + to_Date_param
                + '&custpage_fromdate_nhd=' + from_nhd + '&custpage_todate_nhd=' + to_nhd
                + '&custpage_currency=' + currency
                + '&custpage_chief_accountant=' + chief_accountant;
        }

        function onSearch() {
            window.onbeforeunload = null;
            let currentRecord = ccr.get();
            window.location.replace(getUrlSL(currentRecord));
        }

        function onExport() {
            window.onbeforeunload = null;
            window.open(getUrlSL(ccr.get()));

        }

        function onBKHD() {
            window.onbeforeunload = null;
            window.open(getUrlSL(ccr.get()).concat('&isexport=T'));

        }
        function onExportPdf(){
            window.onbeforeunload = null;
            window.open(getUrlSL(ccr.get()).concat('&ispdf=T'));
        }

        function pageInit(context) {
            let currentRecord = ccr.get();
            let lc = currentRecord.getLineCount("custpage_table");
            if (lc > 1) {
                for (let i = lc - 1; i < lc; i++) {
                    document
                        .getElementById("custpage_tablerow" + i)
                        .style.fontWeight = "bold";
                }
            }
        }


        return {
            onExport: onExport,
            onSearch: onSearch,
            onBKHD: onBKHD,
            onExportPdf: onExportPdf,
            pageInit: pageInit
        };
    });