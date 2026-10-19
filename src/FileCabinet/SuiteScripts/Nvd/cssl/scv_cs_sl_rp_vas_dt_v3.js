/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([
        'N/currentRecord', 'N/url', '../lib/scv_lib_cs', '../lib/scv_lib_cs_xls', '../lib/scv_lib_utils',
        '../lib/scv_lib_custom_form.js'
    ],
    function (
        ccr, url, libCs, libCsXLS, libUtils,
        libCustomForm
    ) {

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
            let currentRecord = scriptContext.currentRecord;
            // toggleCurrencyField(currentRecord);
            if (objProjectData.needsAjaxData) {
                fetchDataIfNeeded(currentRecord);
            }
            if(objProjectData.isearch === "T") {
                let curRec = scriptContext.currentRecord;
                libCustomForm.resizeGrid("scvTabsContainer");
                renderDxTabsWithDxGrid(curRec, objProjectData);
            }
        }

        function fieldChanged(context) {
        }

        function decodeHtmlEntities(text) {
            if (typeof text !== 'string') return text;
            var textarea = document.createElement('textarea');
            textarea.innerHTML = text;
            return textarea.value;
        }

        function fetchDataIfNeeded(curRec) {
            if (!objProjectData || !objProjectData.needsAjaxData) {
                return;
            }
            try {
                let params = getParam(curRec);
                params.custpage_account = curRec.getValue('custpage_account').join(',');
                params.custpage_accounttext = getAccountText(curRec.getText('custpage_account'), ' ');
                params.isearch = 'T';
                params.isgetdata = 'T';
                let res = nlapiRequestURL(URL_RQ, params);
                let body = res && res.getBody();
                if (body) {
                    let parsed = JSON.parse(body);
                    objProjectData.objData = parsed.objData || [];
                    objProjectData.needsAjaxData = false;
                    curRec.setValue({fieldId: 'custpage_fielddata', value: JSON.stringify(objProjectData.objData)});
                }
            } catch (e) {
                console.log('fetchDataIfNeeded error', e);
            }
        }

        function renderDxTabsWithDxGrid(curRec, objProjectData) {
            let { objData, reportType, currencyValue } = objProjectData;
            let columns;
            if (reportType !== "customsearch_scv_vas_ctcndt_limit_nt" && currencyValue) {
                columns = getCurrencyColumns();
            } else if (reportType === "customsearch_scv_vas_ctcndt_limit_nt") {
                columns = [...getBaseColumns(), getNestedAriseColumns(), getNestedBalanceColumns()];
            } else {
                columns = getDefaultColumns();
            }
            objData = filterAccounts(objData);

            if (objData && objData.length > 0) {
                objData.forEach(item => {
                    if (item.diengiai) {
                        item.diengiai = decodeHtmlEntities(item.diengiai);
                    }
                });
            }

            const items = [{
                title: "Báo cáo chi tiết",
                template: function () {
                    return $("<div>").dxDataGrid({
                        dataSource: objData,
                        columns: columns,
                        showBorders: true,
                        rowAlternationEnabled: true,
                        columnAutoWidth: false,
                        allowColumnResizing: true,
                        columnResizingMode: "widget",
                        columnMinWidth: 110,
                        wordWrapEnabled: false,      // không wrap số; riêng 'diengiai' vẫn wrap ở dưới
                        width: "100%",

                        scrolling: {
                            mode: 'standard'
                        },
                        paging: {
                            pageSize: 100
                        },

                        pager: {
                            showPageSizeSelector: true,
                            allowedPageSizes: [20, 50, 100, 200],
                            showInfo: true
                        },

                        searchPanel: {
                            visible: true,
                            width: 300,
                            placeholder: "Tìm kiếm..."
                        },
                        onCellPrepared: function (e) {
                            if (e.rowType === "data" && e.data.typebold === "2") {
                                e.cellElement.css("font-weight", "bold");
                            }
                            if (e.rowType === "data" && e.column.dataField === "diengiai") {
                                e.cellElement.css("white-space", "normal");
                                e.cellElement.css("word-wrap", "break-word");
                            }
                        }
                    });
                }
            }];

            $("#scvTabsContainer").dxTabPanel({ items });
        }

        function filterAccounts(data) {
            const allGroups = [];
            let currentGroup = [];

            const safeParseFloat = (value) => {
                if (value === null || value === undefined || value === '') return 0;
                const num = parseFloat(String(value).replace(/,/g, ''));
                return isNaN(num) ? 0 : num;
            };

            const numericKeys = [
                'tygia', 'sodudauno', 'sodudauco', 'phatsinhno', 'phatsinhco', 'soducuoino', 'soducuoico',
                'sodudaunovnd', 'sodudaucovnd', 'phatsinhnovnd', 'phatsinhcovnd', 'soducuoinovnd', 'soducuoicovnd'
            ];

            // Chuẩn hoá số
            data.forEach(item => {
                numericKeys.forEach(key => {
                    if (item.hasOwnProperty(key)) {
                        item[key] = safeParseFloat(item[key]);
                    }
                });
            });

            data.forEach(item => {
                if (item.isAccount && currentGroup.length > 0) {
                    allGroups.push(currentGroup);
                    currentGroup = [];
                }
                currentGroup.push(item);
            });
            if (currentGroup.length > 0) {
                allGroups.push(currentGroup);
            }

            const filteredGroups = allGroups.filter(group => {
                const finalBalanceItem = group.find(item => item.diengiai === "- Số dư cuối kỳ");

                const isBalanceZero = finalBalanceItem ?
                    (finalBalanceItem.sodunovnd === 0 && finalBalanceItem.soducovnd === 0) :
                    true;

                const hasTransactions = group.some(item => item.hasOwnProperty('account') || item.hasOwnProperty('sophieu'));

                const shouldRemove = isBalanceZero && !hasTransactions;

                return !shouldRemove;
            });

            return filteredGroups.flat();
        }

        function getBaseColumns() {
            return [
                { dataField: 'trandate', caption: 'Ngày', dataType: 'string' },
                {
                    caption: 'Chứng từ',
                    columns: [
                        { dataField: 'ngayct', caption: 'Ngày CT', dataType: 'string', width: 100},
                        { dataField: 'soct', caption: 'Số CT', dataType: 'string', width: 190,
                            cellTemplate: function (cellElement, cellInfo) {
                                getUrlCell(cellElement, cellInfo);
                            }
                        },
                    ]
                },
                // { dataField: 'soct', caption: 'Số hiệu chứng từ', dataType: 'string', width: 190,
                //     cellTemplate: function (cellElement, cellInfo) {
                //         getUrlCell(cellElement, cellInfo);
                //     }
                // },
                // { dataField: 'ngayct', caption: 'Ngày, tháng chứng từ', dataType: 'string', width: 100},
                { dataField: 'diengiai', caption: 'Diễn giải', dataType: 'string', width: 400, wordWrapEnabled: true },
                { dataField: 'currency', caption: 'Loại tiền tệ', dataType: 'string'},
                { dataField: 'tygia', caption: 'Tỷ giá', dataType: 'number', format: "#,##0.00"}
            ];
        }

        function getNestedAriseColumns() {
            return {
                caption: 'Ngoại tệ',
                columns: [
                    { dataField: 'phatsinhno', caption: 'Nợ PS', dataType: 'number', alignment: 'right', format: "#,##0.00" },
                    { dataField: 'phatsinhco', caption: 'Có PS', dataType: 'number', alignment: 'right', format: "#,##0.00" },
                    { dataField: 'soduno', caption: 'Dư nợ', dataType: 'number', alignment: 'right', format: "#,##0.00" },
                    { dataField: 'soduco', caption: 'Dư có', dataType: 'number', alignment: 'right', format: "#,##0.00" },
                ]
            }
        }

        function getNestedBalanceColumns() {
            return {
                caption: 'VNĐ',
                columns: [
                    { dataField: 'phatsinhnovnd', caption: 'Nợ PS', dataType: 'number', alignment: 'right', format: "###,###,##0" },
                    { dataField: 'phatsinhcovnd', caption: 'Có PS', dataType: 'number', alignment: 'right', format: "###,###,##0" },
                    { dataField: 'sodunovnd', caption: 'Dư nợ', dataType: 'number', alignment: 'right', format: "###,###,##0" },
                    { dataField: 'soducovnd', caption: 'Dư có', dataType: 'number', alignment: 'right', format: "###,###,##0" },
                ]
            }
        }

        function getDefaultColumns() {
            return [
                { dataField: 'trandate', caption: 'Ngày', dataType: 'string', alignment: 'left' },
                {
                    caption: 'Chứng từ',
                    columns: [
                        { dataField: 'ngayct', caption: 'Ngày CT', dataType: 'string', width: 100, alignment: 'left' },
                        { dataField: 'soct', caption: 'Số CT', dataType: 'string', alignment: 'left',
                            cellTemplate: function (cellElement, cellInfo) {
                                getUrlCell(cellElement, cellInfo);
                            }
                        },
                    ]
                },
                // { dataField: 'ngayct', caption: 'Ngày CT', dataType: 'string', width: 100, alignment: 'left' },
                // { dataField: 'soct', caption: 'Số CT', dataType: 'string', alignment: 'left',
                //     cellTemplate: function (cellElement, cellInfo) {
                //         getUrlCell(cellElement, cellInfo);
                //     }
                // },
                { dataField: 'diengiai', caption: 'Diễn giải', dataType: 'string', alignment: 'left', width: 400, wordWrapEnabled: true},
                { dataField: 'tygia', caption: 'Tỷ giá', dataType: 'number', alignment: 'right', format: "#,##0.00"},
                { dataField: 'phatsinhnovnd', caption: 'Phát sinh nợ (VNĐ)', dataType: 'number', alignment: 'right', format: "###,###,##0" },
                { dataField: 'phatsinhcovnd', caption: 'Phát sinh có (VNĐ)', dataType: 'number', alignment: 'right', format: "###,###,##0" },
                { dataField: 'sodunovnd', caption: 'Số dư nợ (VNĐ)', dataType: 'number', alignment: 'right', format: "###,###,##0" },
                { dataField: 'soducovnd', caption: 'Số dư có (VNĐ)', dataType: 'number', alignment: 'right', format: "###,###,##0" },
            ];
        }

        function getCurrencyColumns() {
            return [
                { dataField: 'trandate', caption: 'Ngày', dataType: 'string', alignment: 'left' },
                {
                    caption: 'Chứng từ',
                    columns: [
                        { dataField: 'ngayct', caption: 'Ngày CT', dataType: 'string', width: 100, alignment: 'left' },
                        { dataField: 'soct', caption: 'Số CT', dataType: 'string', alignment: 'left',
                            cellTemplate: function (cellElement, cellInfo) {
                                getUrlCell(cellElement, cellInfo);
                            }
                        },
                    ]
                },
                { dataField: 'diengiai', caption: 'Diễn giải', dataType: 'string', alignment: 'left', width: 400, wordWrapEnabled: true },
                { dataField: 'tygia', caption: 'Tỷ giá', dataType: 'number', alignment: 'right', format: "#,##0.00"},
                { dataField: 'phatsinhno', caption: 'Phát sinh nợ (NT)', dataType: 'number', alignment: 'right', format: "#,##0.00" },
                { dataField: 'phatsinhco', caption: 'Phát sinh có (NT)', dataType: 'number', alignment: 'right', format: "#,##0.00" },
                { dataField: 'soduno', caption: 'Số dư nợ (NT)', dataType: 'number', alignment: 'right', format: "#,##0.00" },
                { dataField: 'soduco', caption: 'Số dư có (NT)', dataType: 'number', alignment: 'right', format: "#,##0.00" },
                { dataField: 'phatsinhnovnd', caption: 'Phát sinh nợ (VNĐ)', dataType: 'number', alignment: 'right', format: "###,###,##0" },
                { dataField: 'phatsinhcovnd', caption: 'Phát sinh có (VNĐ)', dataType: 'number', alignment: 'right', format: "###,###,##0" },
                { dataField: 'sodunovnd', caption: 'Số dư nợ (VNĐ)', dataType: 'number', alignment: 'right', format: "###,###,##0" },
                { dataField: 'soducovnd', caption: 'Số dư có (VNĐ)', dataType: 'number', alignment: 'right', format: "###,###,##0" },
            ];
        }

        function getUrlCell(cellElement, cellInfo) {
            const rawHtml = cellInfo.value;

            if (!rawHtml || typeof rawHtml !== 'string' || !rawHtml.includes('<a')) {
                cellElement.text(rawHtml || "");
                return;
            }

            try {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = rawHtml;
                const linkElement = tempDiv.querySelector('a');

                if (linkElement) {
                    const url = linkElement.getAttribute('href');
                    const text = linkElement.textContent || linkElement.innerText;

                    $('<a>', {
                        'href': url,
                        'text': text,
                        'target': '_blank'
                    }).appendTo(cellElement);
                } else {
                    cellElement.text(rawHtml);
                }
            } catch (e) {
                console.error("Lỗi xử lý HTML cho soct:", e);
                cellElement.text(rawHtml);
            }
        }

        // function searchReport() {
        //     debugger;
        //     window.onbeforeunload = null;
        //     libCs.showLoadingDialog(true);
        //     let currentRecord = ccr.get();
        //
        //     if (!libCs.validateDate(currentRecord, 19)) {
        //         libCs.showLoadingDialog(false);
        //         return;
        //     }
        //     let params = getParam(currentRecord);
        //     params.isearch = 'T';
        //
        //     let newUrl = url.resolveScript({
        //         scriptId: 'customscript_scv_sl_rp_vas_dt_v3',
        //         deploymentId: 'customdeploy_scv_sl_rp_vas_dt_v3',
        //         returnExternalUrl: false,
        //         params: params // Sử dụng object `params` đã bao gồm 'isearch=T'
        //     });
        //
        //     window.history.pushState(params, document.title, newUrl);
        //     params.isgetdata = 'T';
        //
        //     let resCallData = nlapiRequestURL(URL_RQ, params);
        //     let body = resCallData.getBody();
        //
        //     libCustomForm.resizeGrid("scvTabsContainer");
        //     renderDxTabsWithDxGrid(currentRecord, JSON.parse(body));
        //     libCs.showLoadingDialog(false);
        // }

        function searchReport() {
            window.onbeforeunload = null;
            let currentRecord = ccr.get();
            if (!libCs.validateDate(currentRecord, 19)) {
                return;
            }
            let urlDC = getUrlParam(currentRecord) + '&isearch=T';
            urlDC = urlDC + plusAccount(currentRecord);
            window.location.replace(urlDC);
        }

        function getUrlParam(currentRecord) {
            return url.resolveScript({
                scriptId: 'customscript_scv_sl_rp_vas_dt_v3',
                deploymentId: 'customdeploy_scv_sl_rp_vas_dt_v3',
                returnExternalUrl: false,
                params: getParam(currentRecord)
            });
        }

        function getParam(currentRecord) {
            return {
                custpage_entity: currentRecord.getValue('custpage_entity'),
                custpage_subsidiary: currentRecord.getValue('custpage_subsidiary').join(','),
                custpage_subsidiarytext: currentRecord.getText('custpage_subsidiary'),
                custpage_paymentcode: currentRecord.getValue('custpage_paymentcode'),
                custpage_order_type: currentRecord.getValue('custpage_order_type'),
                custpage_classification: currentRecord.getValue('custpage_classification'),
                custpage_location: currentRecord.getValue('custpage_location'),
                custpage_department: currentRecord.getValue('custpage_department'),
                custpage_kmcp: currentRecord.getValue('custpage_kmcp'),
                custpage_not_level: currentRecord.getValue('custpage_not_level') ? 'T' : 'F',
                custpage_acc_level: currentRecord.getValue('custpage_acc_level'),
                custpage_date_dauky: currentRecord.getText('custpage_date_dauky'),
                custpage_date_cuoiky: currentRecord.getText('custpage_date_cuoiky'),
                custpage_reportype: currentRecord.getValue('custpage_reportype'),
                custpage_currencyvalue: currentRecord.getValue('custpage_currencyvalue'),
                custpage_currencytext: currentRecord.getText('custpage_currencyvalue'),
                custpage_debitloanagreement: currentRecord.getValue('custpage_debitloanagreement'),
                custpage_debitloanagreementtext: currentRecord.getText('custpage_debitloanagreement'),
                custpage_account_parent: currentRecord.getValue('custpage_account_parent').join(','),
                custpage_account_parent_text: currentRecord.getText('custpage_account_parent'),
                custpage_exportbc: currentRecord.getValue('custpage_exportbc'),
                custpage_category: currentRecord.getValue('custpage_category').join(','),
            }
        }
        function plusAccount(currentRecord) {
            let account_parent_text = getAccountText(currentRecord.getText('custpage_account_parent'), ' ');
            let account_text = getAccountText(currentRecord.getText('custpage_account'), ' ');
            let acc_t = (!!account_parent_text && !!account_text) ? (account_parent_text + ', ' + account_text) : (!!account_text ? account_text : account_parent_text);
            return '&custpage_account=' + currentRecord.getValue('custpage_account') + '&custpage_accounttext=' + acc_t;
        }

        function getAccountText(account, space) {
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

        const URL_RQ = '/app/site/hosting/scriptlet.nl?script=customscript_scv_sl_rp_vas_dt_v3&deploy=customdeploy_scv_sl_rp_vas_dt_v3';

        function exportReport() {
            window.onbeforeunload = null;
            let currentRecord = ccr.get();
            if (!libCs.validateDate(currentRecord, 19)) {
                return;
            }
            let params = getParam(currentRecord);
            params.isearch = 'T';
            params.isgetdata = 'T';
            if (objProjectData.needsAjaxData) {
                fetchDataIfNeeded(currentRecord);
            }
            libCs.showLoadingDialog(true);

            let data = currentRecord.getValue('custpage_fielddata');
            let objDataCol = {objData: (objProjectData.objData && objProjectData.objData.length) ? objProjectData.objData : (data ? JSON.parse(data) : [])};
            let objDataConfig = JSON.parse(nlapiRequestURL(URL_RQ, {
                action: 'getUrlTemplate',
                custpage_subsidiary: currentRecord.getValue('custpage_subsidiary'),
                custpage_reportype: params.custpage_reportype,
                custpage_entity: params.custpage_entity,
                custpage_currencytext: params.custpage_currencytext,
                custpage_currencyvalue: params.custpage_currencyvalue,
            }).getBody());
            try {
                exportExcel(params, currentRecord, objDataConfig, objDataCol);
            } catch (error) {
                console.log("error", error)
                libCs.showLoadingDialog(false);
            }
            libCs.showLoadingDialog(false);

        }

        const exportExcel = async (params, currentRecord, objDataConfig, listDataLines) => {
            let reportName = '';
            const objDataHeader = objDataConfig.objDataHeader;

            let workbook = await libCsXLS.loadWorkbookFromUrl(objDataConfig.urlTemplate);
            let reportType = params.custpage_reportype;
            let currencyValue = params.custpage_currencyvalue;
            let currentSheet = workbook.worksheets[0];

            initDataHeaderSheet(currentSheet, objDataHeader, params);

            if (reportType === 'customsearch_scv_vas_ctcndt_limit_nt' || reportType === 'customsearch_scv_vas_ctcndt_limit') {
                currentSheet.name = 'Chi Tiet Cong No';
                updateValueParam(currentSheet, "BÁO CÁO CHI TIẾT CÔNG NỢ", params);
                reportName = 'BÁO CÁO CHI TIẾT CÔNG NỢ';
            } else if (reportType === 'customsearch_scv_vas_cdpsdt_limit') {
                currentSheet.name = 'Can doi phat sinh';
                updateValueParam(currentSheet, "BẢNG CÂN ĐỐI PHÁT SINH", params);
                reportName = 'CÂN ĐỐI PHÁT SINH';
            } else {
                updateValueParam(currentSheet, "SỔ QUỸ TIỀN", params);
                currentSheet.name = 'So quy tien';
                reportName = 'SỔ QUỸ TIỀN';
            }

            const currentRowForDynamicData_Start = 13;
            const templateRowNumber = 14;
            const columnCount = 14;

            const styleBold = libCsXLS.getObjStyleRow(currentSheet, templateRowNumber, ['A','B','C','D','E','F','G','H','I','J','K','L','M','N'], 0, columnCount - 1 , true);
            const styleNormal = libCsXLS.getObjStyleRow(currentSheet, templateRowNumber, ['A','B','C','D','E','F','G','H','I','J','K','L','M','N'], 0, columnCount - 1);

            const fcNumberFormat = '#,##0.00';
            const vndNumberFormat = '###,###,##0';

            let fcNumericColumns = [];
            let vndNumericColumns = [];

            if (reportType === 'customsearch_scv_vas_ctcndt_limit_nt') {
                fcNumericColumns = ['F', 'G', 'H', 'I', 'J'];
                vndNumericColumns = ['K', 'L', 'M', 'N'];
            } else if (reportType !== 'customsearch_scv_vas_ctcndt_limit_nt' && currencyValue) {
                fcNumericColumns = ['E', 'F', 'G', 'H', 'I'];
                vndNumericColumns = ['J', 'K', 'L', 'M'];
            } else if (!currencyValue) {
                vndNumericColumns = ['E', 'F', 'G', 'H'];
            }

            fcNumericColumns.forEach(col => {
                if (styleBold[col]) styleBold[col].numFmt = fcNumberFormat;
                if (styleNormal[col]) styleNormal[col].numFmt = fcNumberFormat;
            });

            vndNumericColumns.forEach(col => {
                if (styleBold[col]) styleBold[col].numFmt = vndNumberFormat;
                if (styleNormal[col]) styleNormal[col].numFmt = vndNumberFormat;
            });

            let objData = listDataLines.objData;
            objData = filterAccounts(objData);
            if (objData && objData.length > 0) {
                objData.forEach(item => {
                    if (item.diengiai) {
                        item.diengiai = decodeHtmlEntities(item.diengiai);
                    }
                });
            }
            let currentRowForDynamicData = currentRowForDynamicData_Start;

            for (let i = 0; i < objData.length; i++) {
                let objDataLine = objData[i];

                if (currentRowForDynamicData > templateRowNumber) {
                    currentSheet.insertRow(currentRowForDynamicData);
                }

                if (objDataLine.isAccount) {
                    libCsXLS.mergeCell(currentSheet, currentRowForDynamicData, 1, currentRowForDynamicData, 4);
                }

                let styleToApply;
                if (objDataLine.typebold === '2') {
                    styleToApply = styleBold;
                } else {
                    styleToApply = styleNormal;
                }

                setCellValueDetailLine(currentSheet, objDataLine, currentRowForDynamicData, reportType, currencyValue);

                for (let j = 0; j < columnCount; j++) {
                    let colName = String.fromCharCode(65 + j);
                    const newCell = currentSheet.getCell(colName + currentRowForDynamicData);

                    const specificColumnStyle = styleToApply[colName];

                    if (specificColumnStyle) {
                        newCell.style = JSON.parse(JSON.stringify(specificColumnStyle));
                    }
                    if (specificColumnStyle && specificColumnStyle.font) {
                        newCell.font = {
                            ...specificColumnStyle.font,
                            name: 'Times New Roman',
                            size: 10,
                        };
                    } else {
                        newCell.font = {
                            name: 'Times New Roman',
                            size: 10,
                        };
                    }
                }

                currentRowForDynamicData++;
            }

            await libCsXLS.saveWorkbook(workbook, reportName + ".xlsx");
        }

        function initDataHeaderSheet(currentSheet, objDataHeader, params) {
            libCsXLS.updMultiValueToCell(currentSheet, [
                {addressCell: 'A1', keys: '{pSubsidiary}', values: objDataHeader.strLegalNameSub},
                {addressCell: 'A1', keys: '{pCode}', values: objDataHeader.strFederalNumberSub},
                {addressCell: 'A2', keys: '{pAddress}', values: objDataHeader.strMainAddrSub},
                {addressCell: 'A5', keys: '{pAccount}', values: Array.isArray(params.custpage_account_parent_text) ? params.custpage_account_parent_text.join(', ') : params.custpage_account_parent_text},
                {addressCell: 'A6', keys: '{pEntity}', values: params.custpage_entity || 'Tổng hợp'},
                {addressCell: 'A7', keys: '{pCurrency}', values: params.custpage_currencytext || 'VNĐ'},
                {addressCell: 'A8', keys: '{pFromDate}', values: params.custpage_date_dauky},
                {addressCell: 'A8', keys: '{pToDate}', values: params.custpage_date_cuoiky},
            ]);
        }

        function updateValueParam(currentSheet, reportTitle, params) {
            libCsXLS.updMultiValueToCell(currentSheet, [
                {addressCell: 'A4', keys: '{pReportTitle}', values: reportTitle},
                {addressCell: 'A5', keys: '{pFromdate}', values: params.custpage_date_dauky},
                {addressCell: 'A5', keys: '{pTodate}', values: params.custpage_date_cuoiky}
            ]);
        }

        function mergeCellBodyParm(currentSheet) {
            libCsXLS.mergeCell(currentSheet, 1, 1, 1, 5); // A1:M1
            libCsXLS.mergeCell(currentSheet, 2, 1, 2, 5); // A2:M2
        }

        function setCellValueDetailLine(currentSheet, objDataLine, rowInsert, reportType, currencyValue) {
            let cellMap = [];
            if (reportType === 'customsearch_scv_vas_ctcndt_limit_nt') {
                cellMap = [
                    { col: 'A', key: 'trandate' },
                    { col: 'B', key: 'ngayct' },
                    { col: 'C', key: 'soctText' },
                    { col: 'D', key: 'diengiai' },
                    { col: 'E', key: 'currency', isNumber: true },
                    { col: 'F', key: 'tygia', isNumber: true },
                    { col: 'G', key: 'phatsinhno', isNumber: true },
                    { col: 'H', key: 'phatsinhco', isNumber: true },
                    { col: 'I', key: 'soduno', isNumber: true },
                    { col: 'J', key: 'soduco', isNumber: true},
                    { col: 'K', key: 'phatsinhnovnd', isNumber: true },
                    { col: 'L', key: 'phatsinhcovnd',  isNumber: true},
                    { col: 'M', key: 'sodunovnd', isNumber: true},
                    { col: 'N', key: 'soducovnd', isNumber: true},
                ];
            } else if (reportType !== 'customsearch_scv_vas_ctcndt_limit_nt' && currencyValue) {
                cellMap = [
                    { col: 'A', key: 'trandate' },
                    { col: 'B', key: 'ngayct' },
                    { col: 'C', key: 'soctText' },
                    { col: 'D', key: 'diengiai' },
                    { col: 'E', key: 'tygia', isNumber: true },
                    { col: 'F', key: 'phatsinhno', isNumber: true },
                    { col: 'G', key: 'phatsinhco', isNumber: true },
                    { col: 'H', key: 'soduno', isNumber: true },
                    { col: 'I', key: 'soduco', isNumber: true},
                    { col: 'J', key: 'phatsinhnovnd', isNumber: true },
                    { col: 'K', key: 'phatsinhcovnd',  isNumber: true},
                    { col: 'L', key: 'sodunovnd', isNumber: true},
                    { col: 'M', key: 'soducovnd', isNumber: true},
                ];
            } else if (!currencyValue) {
                cellMap = [
                    { col: 'A', key: 'trandate' },
                    { col: 'B', key: 'ngayct' },
                    { col: 'C', key: 'soctText' },
                    { col: 'D', key: 'diengiai' },
                    { col: 'E', key: 'phatsinhnovnd', isNumber: true },
                    { col: 'F', key: 'phatsinhcovnd',  isNumber: true},
                    { col: 'G', key: 'sodunovnd', isNumber: true},
                    { col: 'H', key: 'soducovnd', isNumber: true},
                ]
            }

            cellMap.forEach(({ col, key, isNumber, defaultValue }) => {
                const cell = currentSheet.getCell(`${col}${rowInsert}`);
                let value = objDataLine?.[key];
                // cell.value = isNumber ? parseVietnameseNumber(value) : (value ?? defaultValue ?? null);
                cell.value = value ?? defaultValue ?? null;
                if (key === 'diengiai' && value) {
                    libCsXLS.updateRowHeight(currentSheet, value, 0, rowInsert, 35);
                    cell.alignment = {
                        vertical: 'middle',
                        horizontal: 'left',
                        wrapText: true
                    };
                }
            });
        }

        function parseVietnameseNumber(formattedString) {
            if (typeof formattedString !== 'string' || !formattedString) {
                return null;
            }
            // Remove thousand separators (.) and replace decimal separator (,) with a standard dot.
            const parsableString = formattedString.replace(/\./g, '').replace(',', '.');
            const number = parseFloat(parsableString);
            return isNaN(number) ? null : number;
        }


        return {
            pageInit: pageInit,
            searchReport: searchReport,
            exportReport: exportReport,
            fieldChanged: fieldChanged
        };

    });
