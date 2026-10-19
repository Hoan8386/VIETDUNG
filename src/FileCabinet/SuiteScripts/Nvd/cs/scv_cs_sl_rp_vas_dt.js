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
                scriptId: 'customscript_scv_sl_rp_vas_dt',
                deploymentId: 'customdeploy_scv_sl_rp_vas_dt',
                returnExternalUrl: false,
                params: (objParams || {})
            });
        }
        
        function pageInit(scriptContext) {
            debugger;
            let currentRecord = scriptContext.currentRecord;
            console.log('currentRecord', currentRecord);
            const sublistId = 'custpage_sl_tt';
            const lineCount = currentRecord.getLineCount({sublistId: sublistId});
            // Chỉ chạy khi có kết quả để tránh lỗi giao diện
            if (lineCount > 0) {
                try {
                    // 2. Định nghĩa HTML cho header mới của bạn
                    // Chú ý sử dụng colspan và rowspan để gộp ô
                    const newHeaderHTML = `
                        <tr class="uir-machine-headerrow" id="new_header_row_1">
                            <th rowspan="2" class="uir-machine-header" style="text-align:center;">Information</th>
                            <th rowspan="2" class="uir-machine-header" style="text-align:center;">Mã tài khoản</th>
                            <th rowspan="2" class="uir-machine-header" style="text-align:center;">Tên tài khoản</th>
                            <th rowspan="2" class="uir-machine-header" style="text-align:center;">Mã đối tượng</th>
                            <th rowspan="2" class="uir-machine-header" style="text-align:center;">Đối tượng</th>
                            <th colspan="4" class="uir-machine-header" style="text-align:center; border-bottom: 1pt solid #a8a8a8;">Số dư đầu</th>
                            <th colspan="4" class="uir-machine-header" style="text-align:center; border-bottom: 1pt solid #a8a8a8;">Số phát sinh</th>
                            <th colspan="4" class="uir-machine-header" style="text-align:center; border-bottom: 1pt solid #a8a8a8;">Số dư cuối</th>
                        </tr>
                        <tr class="uir-machine-headerrow" id="new_header_row_2">
                            <th class="uir-machine-header" style="text-align:center;">Nợ</th>
                            <th class="uir-machine-header" style="text-align:center;">Nợ quy ra VND</th>
                            <th class="uir-machine-header" style="text-align:center;">Có</th>
                            <th class="uir-machine-header" style="text-align:center;">Có quy ra VND</th>
                            <th class="uir-machine-header" style="text-align:center;">Nợ</th>
                            <th class="uir-machine-header" style="text-align:center;">Nợ quy ra VND</th>
                            <th class="uir-machine-header" style="text-align:center;">Có</th>
                            <th class="uir-machine-header" style="text-align:center;">Có quy ra VND</th>
                            <th class="uir-machine-header" style="text-align:center;">Nợ</th>
                            <th class="uir-machine-header" style="text-align:center;">Nợ quy ra VND</th>
                            <th class="uir-machine-header" style="text-align:center;">Có</th>
                            <th class="uir-machine-header" style="text-align:center;">Có quy ra VND</th>
                        </tr>
                    `;
                    
                    // 3. Sử dụng jQuery để thao tác với DOM
                    // Tìm đến thẻ a có name='custpage_sl_tt_header' là thẻ cha của header
                    const headerTable = jQuery("a[name='custpage_sl_tt_header']").closest('table');
                    
                    // Ẩn dòng header gốc do NetSuite tạo ra
                    headerTable.find('.uir-machine-headerrow').hide();
                    
                    // Thêm header mới của bạn vào đầu của thead
                    headerTable.find('thead').prepend(newHeaderHTML);
                    
                } catch (e) {
                    console.error('Error modifying sublist header', e);
                }
            }
            const style = "font-weight:bold; background-color: #cce57f !important;border-color: white #cce57f #cce57f #cce57f !important;";
            const sl = 'custpage_sl_ct';
            const lc = currentRecord.getLineCount(sl);
            for (let i = 0; i < lc; i++) {
                const idrow = '#' + sl + 'row' + i;
                const trandate = currentRecord.getSublistValue({sublistId: sl, fieldId: 'trandate', line: i});
                if (!trandate) {
                    const vDebitAmtVND = currentRecord.getSublistValue({sublistId: sl, fieldId: 'sodunovnd', line: i});
                    if (libCs.isContainValue(vDebitAmtVND)) {
                        jQuery(idrow).find("td").attr('style', style);
                    } else {
                        jQuery(idrow).attr("style", style);
                    }
                }
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
            let account_parent_text = getAcccountText(currentRecord.getText('custpage_account_parent'), ' ');
            let account_text = getAcccountText(currentRecord.getText('custpage_account'), ' ');
            let acc_t = (!!account_parent_text && !!account_text) ? (account_parent_text + ', ' + account_text) : (!!account_text ? account_text : account_parent_text);
            return '&custpage_account=' + currentRecord.getValue('custpage_account') + '&custpage_accounttext=' + acc_t;
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
            if (accounttext.length > 0)
                accounttext = accounttext.slice(0, -1);
            return accounttext;
        }
        
        const getAcccountNumber = (account, space) => {
            let accounttext = [], tempvalue;
            if (!!account && account.length > 0) {
                for (let i in account) {
                    tempvalue = account[i];
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
            reportype = !!entity ? (reportype + '_' + entity) : reportype;
            urlDC += plusParam(currentRecord) + plusAccount(currentRecord) + '&isexport=T' + '&namefile=' + reportype + '.xls';
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
                window.open(urlDC + plusAccount(currentRecord) + '&namefile=' + reportype + '.xls');
            }
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
        
        
        return {
            pageInit: pageInit,
            refresh: refresh,
            searchReport: searchReport,
            exportReport: exportReport,
            onPrintPdf: onPrintPdf,
            exportReportDetail: exportReportDetail,
        };
        
    });
