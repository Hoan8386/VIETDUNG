/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/record', 'N/search', 'N/url'],
    
    function (ccr, record, search, url) {
        
        function refresh() {
            window.location.reload();
        }
        
        function searchReport() {
            window.onbeforeunload = null;
            let currentRecord = ccr.get();
            let urlDC = url.resolveScript({
                scriptId: 'customscript_scv_sl_fam_report',
                deploymentId: 'customdeploy_scv_sl_fam_report',
                returnExternalUrl: false
            });
            urlDC = urlDC + plusParam(currentRecord);
            window.location.replace(urlDC);
        }
        
        function plusParam(currentRecord) {
            let reportype = currentRecord.getValue('custpage_reportype');
            let param = '&custpage_subsidiary=' + currentRecord.getValue('custpage_subsidiary')
                + '&custpage_subsidiarytext=' + currentRecord.getText('custpage_subsidiary')
                + '&custpage_date_dauky=' + document.getElementById("custpage_date_dauky").value
                + '&custpage_date_cuoiky=' + document.getElementById("custpage_date_cuoiky").value
                + '&custpage_reportype=' + currentRecord.getValue('custpage_reportype')
                + '&custpage_managedepartment=' + currentRecord.getValue('custpage_managedepartment')
                + '&custpage_assetdepartment=' + currentRecord.getValue('custpage_assetdepartment');
            
            if (reportype === 'customsearch_scv_fa_detail' || reportype === 'bangphanbo_cp_tra_truoc') {
                let asset_category = currentRecord.getValue('custpage_asset_category');
                let asset = currentRecord.getValue('custpage_asset');
                let assettype = currentRecord.getValue('custpage_assettype');
                if (asset_category !== undefined && asset_category !== 'undefined' && asset_category != null) {
                    param = param + '&custpage_asset_category=' + asset_category
                        + '&custpage_asset_category_text=' + currentRecord.getText('custpage_asset_category');
                }
                if (asset !== undefined && asset !== 'undefined' && asset != null) {
                    param = param + '&custpage_asset=' + asset
                        + '&custpage_asset_text=' + currentRecord.getText('custpage_asset');
                }
                if (assettype !== undefined && assettype !== 'undefined' && assettype != null) {
                    param = param + '&custpage_assettype=' + assettype
                        + '&custpage_assettype_text=' + currentRecord.getText('custpage_asset');
                }
            }
            
            return param;
        }
        
        function exportReport() {
            let currentRecord = ccr.get();
            let urlDC = url.resolveScript({
                scriptId: 'customscript_scv_sl_fam_report_export',
                deploymentId: 'customdeploy_scv_sl_fam_report_export',
                returnExternalUrl: false
            });
            urlDC = urlDC + plusParam(currentRecord);
            window.open(urlDC);
        }
        
        function onPrint() {
            let currentRecord = ccr.get();
            let urlDC = url.resolveScript({
                scriptId: 'customscript_scv_sl_fam_report_export',
                deploymentId: 'customdeploy_scv_sl_fam_report_export',
                returnExternalUrl: false
            });
            urlDC = urlDC + plusParam(currentRecord) + "&isPrint=T";
            window.open(urlDC);
        }
        
        function fieldChanged(scriptContext) {
        
        }
        
        function postSourcing(scriptContext) {
        
        }
        
        return {
            refresh: refresh,
            searchReport: searchReport,
            exportReport: exportReport,
            fieldChanged: fieldChanged,
            postSourcing: postSourcing,
            onPrint: onPrint
        };
        
    });
