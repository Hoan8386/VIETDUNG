/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/url', '../lib/scv_lib_cs.js'],
    function (ccr, url, libCs) {
    
        const arrFldsMandatory = ['custpage_subsidiary'];
        
        const getUrlSL = (objParams = {}) => {
            return url.resolveScript({
                scriptId: 'customscript_scv_sl_rp_vas_tt',
                deploymentId: 'customdeploy_scv_sl_rp_vas_tt',
                returnExternalUrl: false,
                params: objParams
            });
        }
        
        function pageInit(scriptContext) {
            let currentRecord = scriptContext.currentRecord;
            const style = "font-weight:bold; background-color: #12e57f !important;border-color: white #12e57f #12e57f #12e57f !important;";
            const sl = 'custpage_sl_tt';
            const lc = currentRecord.getLineCount(sl);
            for (let i = 0; i < lc; i++) {
                const subHierarchy = currentRecord.getSublistValue({
                    sublistId: sl,
                    fieldId: 'subsidiarynohierarchy',
                    line: i
                });
                if (subHierarchy) continue;
                const idrow = '#' + sl + 'row' + i;
                jQuery(idrow).attr("style", style);
            }
        }
        
        const refresh = () => {
            window.location.reload();
        }
        
        const searchReport = () => {
            window.onbeforeunload = null;
            let currentRecord = ccr.get();
            if (!libCs.fnValidateFields(currentRecord, arrFldsMandatory)) return;
            let urlDC = getUrlSL();
            urlDC = urlDC + plusParam(currentRecord) + plusAccount(currentRecord);
            window.location.replace(urlDC);
        }
        
        const plusParam = (currentRecord) => {
            return '&custpage_entity=' + encodeURIComponent(currentRecord.getValue('custpage_entity'))
                + '&custpage_subsidiary=' + currentRecord.getValue('custpage_subsidiary')
                + '&custpage_subsidiarytext=' + currentRecord.getText('custpage_subsidiary')
                + '&custpage_order_type=' + currentRecord.getValue('custpage_order_type')
                + '&custpage_classification=' + currentRecord.getValue('custpage_classification')
                + '&custpage_location=' + currentRecord.getValue('custpage_location')
                + '&custpage_department=' + currentRecord.getValue('custpage_department')
                + '&custpage_kmcp=' + currentRecord.getValue('custpage_kmcp')
                + '&custpage_netnoco=' + (currentRecord.getValue('custpage_netnoco') ? 'T' : 'F')
                + '&custpage_not_level=' + (currentRecord.getValue('custpage_not_level') ? 'T' : 'F')
                + '&custpage_acc_level=' + currentRecord.getValue('custpage_acc_level')
                + '&custpage_date_dauky=' + currentRecord.getText('custpage_date_dauky')
                + '&custpage_date_cuoiky=' + currentRecord.getText('custpage_date_cuoiky')
                + '&custpage_reportype=' + currentRecord.getValue('custpage_reportype')
                + '&custpage_currencyvalue=' + currentRecord.getValue('custpage_currencyvalue')
                + '&custpage_currencytext=' + currentRecord.getText('custpage_currencyvalue')
                + '&custpage_debitloanagreement=' + currentRecord.getValue('custpage_debitloanagreement')
                + '&custpage_debitloanagreementtext=' + currentRecord.getText('custpage_debitloanagreement')
                + '&custpage_account_parent=' + currentRecord.getValue('custpage_account_parent')
                + '&custpage_exportbc=' + currentRecord.getValue('custpage_exportbc')
                ;
        }
        
        const plusAccount = (currentRecord) => {
            return '&custpage_account=' + currentRecord.getValue('custpage_account')
                + '&custpage_accounttext=' + getAcccountText(currentRecord.getText('custpage_account'), ' ');
        }
        
        const getAcccountText = (account, space) => {
            let accounttext = '';
            if (!!account && account.length > 0) {
                for (let i in account) {
                    let tempvalue = account[i];
                    if (!!tempvalue) {
                        tempvalue = tempvalue.split(space);
                        accounttext = accounttext + tempvalue[0] + ','
                    }
                }
            }
            if (accounttext.length > 0) {
                accounttext = accounttext.slice(0, -1);
            }
            return accounttext;
        }
        
        const getAcccountNumber = (account, space) => {
            let accounttext = [];
            if (!!account && account.length > 0) {
                for (let i in account) {
                    let tempvalue = account[i];
                    if (!!tempvalue) {
                        tempvalue = tempvalue.split(space);
                        accounttext.push(tempvalue[0]);
                    }
                }
            }
            return accounttext;
        }
        
        const exportReport = () => {
            window.onbeforeunload = null;
            let currentRecord = ccr.get();
            if (!libCs.fnValidateFields(currentRecord, arrFldsMandatory)) return;
            let urlDC = getUrlSL();
            let reportype = currentRecord.getText('custpage_reportype');
            let entity = currentRecord.getValue('custpage_entity');
            reportype = !!entity ? reportype + '_' + entity : reportype;
            
            urlDC += plusParam(currentRecord) + plusAccount(currentRecord) + '&isexport=T' + '&namefile=' + reportype + '.xls';
            window.open(urlDC);
        }
        
        const onPrintPdf = () => {
            window.onbeforeunload = null;
            let currentRecord = ccr.get();
            if (!libCs.fnValidateFields(currentRecord, arrFldsMandatory)) return;
            let urlDC = getUrlSL();
            let reportype = currentRecord.getText('custpage_reportype');
            let entity = currentRecord.getValue('custpage_entity');
            reportype = !!entity ? reportype + '_' + entity : reportype;
            
            urlDC += plusParam(currentRecord) + plusAccount(currentRecord) + '&isexport=T' + '&namefile=' + reportype + '.xls&isPrint=T';
            window.open(urlDC);
        }
        
        function exportReportDetail() {
            window.onbeforeunload = null;
            let currentRecord = ccr.get();
            if (!libCs.fnValidateFields(currentRecord, arrFldsMandatory)) return;
            let urlDC = getUrlSL();
            urlDC += plusParam(currentRecord) + '&isexport=T';
            let account = currentRecord.getValue('custpage_account');
            let accountnumber = getAcccountNumber(currentRecord.getText('custpage_account'), ' ');
            let reportype = currentRecord.getText('custpage_reportype');
            let entity = currentRecord.getValue('custpage_entity');
            reportype = !!entity ? reportype + '_' + entity : reportype;
            let fn = function fn(accountp, accountnumberp, reportypep) {
                window.open(urlDC + '&custpage_account=' + accountp + '&custpage_accounttext=' + accountnumberp + '&namefile=' + reportypep + '_' + accountnumberp + '.xls')
            };
            if (accountnumber.length > 0) {
                for (let i in accountnumber) {
                    setTimeout(fn, i * 7000, account[i], accountnumber[i], reportype);
                }
            } else {
                window.open(urlDC + '&namefile=' + reportype + '.xls');
            }
        }
        
        return {
            pageInit: pageInit,
            refresh: refresh,
            searchReport: searchReport,
            exportReport: exportReport,
            onPrintPdf: onPrintPdf,
            exportReportDetail: exportReportDetail
        };
        
    });
