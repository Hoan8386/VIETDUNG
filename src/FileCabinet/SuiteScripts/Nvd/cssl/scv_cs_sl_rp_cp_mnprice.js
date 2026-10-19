/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/url', '../lib/scv_lib_cs.js'],
    
    function (ccr, url, libCs) {
        
        const refresh = () => {
            window.location.reload();
        }
        
        const searchReport = () => {
            window.onbeforeunload = null;
            let currentRecord = ccr.get();
            let urlDC = url.resolveScript({
                scriptId: 'customscript_scv_sl_rp_cp_mnprice',
                deploymentId: 'customdeploy_scv_sl_rp_cp_mnprice',
                returnExternalUrl: false,
                params: getParams(currentRecord)
            });
            window.location.replace(urlDC);
        }
        
        const exportReport = () => {
            let currentRecord = ccr.get();
            let urlDC = url.resolveScript({
                scriptId: 'customscript_scv_sl_rp_cp_mnprice',
                deploymentId: 'customdeploy_scv_sl_rp_cp_mnprice',
                returnExternalUrl: false,
                params: getParams(currentRecord)
            });
            urlDC = urlDC + '&isExport=T';
            window.open(urlDC);
        }
        
        const checkAll = () => {
            setValueSelect(true);
        }
        
        const unCheckAll = () => {
            setValueSelect(false);
        }
        
        const setValueSelect = (value) => {
            let currentRecord = ccr.get();
            let sl = 'custpage_sl';
            let sl_select = 'custpage_sl_select';
            let lc = currentRecord.getLineCount(sl);
            for (let i = 0; i < lc; i++) {
                currentRecord.selectLine({sublistId: sl, line: i});
                currentRecord.setCurrentSublistValue({sublistId: sl, fieldId: sl_select, value: value});
                currentRecord.commitLine(sl);
            }
        }
        
        const getParams = (currentRecord) => {
            return {
                custpage_subsidiary: currentRecord.getValue('custpage_subsidiary'),
                custpage_subsidiary_text: currentRecord.getText('custpage_subsidiary'),
                custpage_location: currentRecord.getValue('custpage_location'),
                custpage_location_text: currentRecord.getText('custpage_location'),
                custpage_thanhpham: currentRecord.getValue('custpage_thanhpham'),
                custpage_thanhpham_text: currentRecord.getText('custpage_thanhpham'),
                custpage_item: currentRecord.getValue('custpage_item'),
                custpage_item_text: currentRecord.getText('custpage_item'),
                custpage_fromdate: currentRecord.getText('custpage_fromdate'),
                custpage_todate: currentRecord.getText('custpage_todate'),
                custpage_fromdate_prv: currentRecord.getText('custpage_fromdate_prv'),
                custpage_todate_prv: currentRecord.getText('custpage_todate_prv'),
                custpage_mainline: currentRecord.getValue('custpage_mainline') ? 'T' : 'F'
            }
        }
        
        function pageInit(scriptContext) {
            let currentRecord = scriptContext.currentRecord;
            let mainline = currentRecord.getValue('custpage_mainline');
            if (mainline === true) {
                //jQuery(".uir-list-row-cell:contains(*)").parent.css( "background-color", "red" ); //.attr("style", "background-color: yellow !important;");
                //jQuery(".uir-list-row-tr:contains(*)").attr("style", "background-color: yellow !important;");
                //jQuery(".uir-list-row-cell:contains(*)").attr("style", "font-weight:bold; background-color: #cce57f !important;border-color: white #cce57f #cce57f #cce57f !important;");
                let style = "font-weight:bold; background-color: #cce57f !important;border-color: white #cce57f #cce57f #cce57f !important;";
                let sl = 'custpage_sl', mainline_line, idrow;
                let lc = currentRecord.getLineCount(sl);
                for (let i = 0; i < lc; i++) {
                    mainline_line = currentRecord.getSublistValue({sublistId: sl, fieldId: 'mainline', line: i});
                    if (mainline_line === '*') {
                        idrow = '#' + sl + 'row' + i;
                        //jQuery(idrow).attr("style", style);
                        jQuery(idrow).find("td").attr('style', style);
                    }
                }
                
                
            }
        }
        
        function fieldChanged(scriptContext) {
            let fieldId = scriptContext.fieldId;
            let currentRecord = scriptContext.currentRecord;
            if (fieldId === 'custpage_subsidiary') {
                let subsidiary = currentRecord.getValue('custpage_subsidiary');
                let c = ['internalid', 'namenohierarchy', 'name'];
                let f = [['isinactive', 'is', false]];
                if (typeof subsidiary == 'string') {
                    subsidiary = subsidiary.split(',');
                }
                if (libCs.isContainValue(subsidiary)) {
                    f.push('and');
                    f.push(['subsidiary', 'anyOf', subsidiary]);
                }
                let list_fields = [currentRecord.getField('custpage_location')];
                libCs.insertSelection(list_fields, 'location', c, f, true, null);
                
            }
        }
        
        return {
            refresh: refresh,
            searchReport: searchReport,
            exportReport: exportReport,
            checkAll: checkAll,
            unCheckAll: unCheckAll,
            pageInit: pageInit,
            fieldChanged: fieldChanged,
        };
        
    });
