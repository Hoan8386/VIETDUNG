/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/url', '../lib/scv_lib_cs.js'],
    
    function (currentRecord, url, libCS) {
        
        const arrFldsMandatory = ['custpage_fromdt', 'custpage_todt', 'custpage_subsidiary'];
        
        const getUrlSL = (curRec) => {
            return url.resolveScript({
                scriptId: 'customscript_scv_sl_bkct',
                deploymentId: 'customdeploy_scv_sl_bkct',
                returnExternalUrl: false,
                params: getParam(curRec)
            });
        }
        
        const onSearchResult = () => {
            window.onbeforeunload = null;
            let currRecord = currentRecord.get();
            if (!libCS.fnValidateFields(currRecord, arrFldsMandatory)) return;
            window.location.replace(getUrlSL(currRecord).concat('&isrun=T'));
        }
        
        const onExportExcel = () => {
            window.onbeforeunload = null;
            let currRecord = currentRecord.get();
            if (!libCS.fnValidateFields(currRecord, arrFldsMandatory)) return;
            window.open(getUrlSL(currRecord).concat('&isexport_excel=T'));
        }
        
        const onPrint = () => {
            window.onbeforeunload = null;
            let currRecord = currentRecord.get();
            if (!libCS.fnValidateFields(currRecord, arrFldsMandatory)) return;
            window.open(getUrlSL(currRecord).concat('&isPrint=T').concat('&isexport_excel=T'));
        }
        
        const getParam = (currRecord) => {
            return {
                custpage_subsidiary: currRecord.getValue('custpage_subsidiary').join(','),
                custpage_fromdt: currRecord.getText('custpage_fromdt'),
                custpage_todt: currRecord.getText('custpage_todt'),
                custpage_account: currRecord.getValue('custpage_account'),
                custpage_contraaccount: currRecord.getValue('custpage_contraaccount')
            }
        }
        
        return {
            pageInit: () => ({}),
            onPrint: onPrint,
            onSearchResult: onSearchResult,
            onExportExcel: onExportExcel
        };
    });
