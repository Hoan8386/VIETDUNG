/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/url', '../lib/scv_lib_cs', '../lib/scv_lib_cs_xls', '../lib/scv_lib_custom_form.js'],
    function(ccr, url, libCS, libCsXLS, libCustomForm) {
        const arrFldsMandatory = ['custpage_subsidiary'];
        function getUrlSL(objParams = {}) {
            return url.resolveScript({
                scriptId: 'customscript_scv_sl_rp_vas_tt_v3',
                deploymentId: 'customdeploy_scv_sl_rp_vas_tt_v3',
                returnExternalUrl: false,
                params: objParams
            });
        }

        function pageInit(scriptContext) {
            if(objProjectData.isearch === "T") {
                let curRec = scriptContext.currentRecord;
                libCustomForm.resizeGrid("scvTabsContainer");
                renderDxTabsWithDxGrid(curRec, objProjectData);
            }
        }

        function decodeHtmlEntities(text) {
            if (typeof text !== 'string') return text;
            var textarea = document.createElement('textarea');
            textarea.innerHTML = text;
            return textarea.value;
        }

        function renderDxTabsWithDxGrid(curRec, objProjectData) {
            let { objData, isCnNt, isCdps, isVay, currencyValue } = objProjectData;
            let columns;
            if (!isCnNt && currencyValue) {
                columns = getCurrencyColumns(isCdps, isVay);
            } else if (isCnNt) {
                columns = [...getBaseColumns(isCdps, isVay), getNestedAriseColumns(), getNestedBalanceColumns(), getNestedFinalColumns()];
            } else {
                columns = getDefaultColumns(isCdps, isVay);
            }

            objData = handleData(objData);

            if (objData && objData.length > 0) {
                objData.forEach(item => {
                    if (item.doituong) {
                        item.doituong = decodeHtmlEntities(item.doituong);
                    }
                    if (item.accname) {
                        item.accname = decodeHtmlEntities(item.accname);
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
                        columnAutoWidth: true,
                        scrolling: { // Thêm đối tượng này
                            mode: 'standard' // 'virtual' hoặc 'infinite' cũng có thể được sử dụng
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
                            e.cellElement.css('font-size', '12px');
                            if (e.rowType === "data" && e.data.typebold === "2") {
                                e.cellElement.css("font-weight", "bold");
                            }
                            if (e.rowType === "data" && e.data.color) {
                                e.cellElement.css("color", e.data.color);
                            }
                            if (e.rowType === "data" && e.data.background) {
                                e.cellElement.css("background", e.data.background);
                            }
                            if (e.rowType === "data" && e.column.dataField === "doituong") {
                                e.cellElement.css("white-space", "normal");
                                e.cellElement.css("word-wrap", "break-word");
                            }
                        }
                    });
                }
            }];

            $("#scvTabsContainer").dxTabPanel({ items });
        }

        function handleData(objData) {
            if (!objData || objData.length === 0) {
                return [];
            }

            const groupSums = {};

            const safeParseFloat = (value) => {
                if (value === null || value === undefined || value === '') return 0;
                const num = parseFloat(String(value).replace(/,/g, ''));
                return isNaN(num) ? 0 : num;
            };

            const numericKeys = [
                'sodudauno', 'sodudauco', 'phatsinhno', 'phatsinhco', 'soducuoino', 'soducuoico',
                'sodudaunovnd', 'sodudaucovnd', 'phatsinhnovnd', 'phatsinhcovnd', 'soducuoinovnd', 'soducuoicovnd'
            ];

            // Chuẩn hoá số
            objData.forEach(item => {
                numericKeys.forEach(key => {
                    if (item.hasOwnProperty(key)) {
                        item[key] = safeParseFloat(item[key]);
                    }
                });
            });

            objData.forEach(item => {
                const groupingString = item.phanloai || (item.typebold === '2' ? item.doituong : null);

                if (groupingString && groupingString.includes(':')) {
                    const parentGroup = groupingString.split(':')[0].trim();

                    if (!groupSums[parentGroup]) {
                        groupSums[parentGroup] = {
                            sodudauno: 0, sodudauco: 0, phatsinhno: 0, phatsinhco: 0, soducuoino: 0, soducuoico: 0,
                            sodudaunovnd: 0, sodudaucovnd: 0, phatsinhnovnd: 0, phatsinhcovnd: 0, soducuoinovnd: 0, soducuoicovnd: 0
                        };
                    }

                    if (item.typebold === "2") {
                        const sum = groupSums[parentGroup];
                        sum.sodudauno       += item.sodudauno;
                        sum.sodudauco       += item.sodudauco;
                        sum.phatsinhno      += item.phatsinhno;
                        sum.phatsinhco      += item.phatsinhco;
                        sum.soducuoino      += item.soducuoino;
                        sum.soducuoico      += item.soducuoico;
                        sum.sodudaunovnd    += item.sodudaunovnd;
                        sum.sodudaucovnd    += item.sodudaucovnd;
                        sum.phatsinhnovnd   += item.phatsinhnovnd;
                        sum.phatsinhcovnd   += item.phatsinhcovnd;
                        sum.soducuoinovnd   += item.soducuoinovnd;
                        sum.soducuoicovnd   += item.soducuoicovnd;
                    }
                }
            });

            const finalData = [];
            const groupsAdded = {};

            objData.forEach(item => {
                const groupingString = item.phanloai || (item.typebold === '2' ? item.doituong : null);

                if (groupingString && groupingString.includes(':')) {
                    const parentGroup = groupingString.split(':')[0].trim();

                    if (!groupsAdded[parentGroup]) {
                        const calculatedSum = groupSums[parentGroup];
                        if (calculatedSum) {
                            const parentRow = {
                                doituong: parentGroup,
                                typebold: "2",
                                color: 'black',
                                background: '#cce57f',
                                accnumber: '',
                                accname: '',
                                ...calculatedSum
                            };
                            finalData.push(parentRow);
                        }
                        groupsAdded[parentGroup] = true;
                    }
                }

                finalData.push(item);
            });

            const isAllZero = (row) => numericKeys.every(k => Math.abs(safeParseFloat(row[k])) === 0 );

            const cleaned = finalData.filter(row => {
                if (row.lineName === 'total') return true;

                return !isAllZero(row);
            });

            return cleaned;
        }

        function getBaseColumns(isCdps, isVay) {
            let columns = [
                { dataField: 'accnumber', caption: 'Mã tài khoản', dataType: 'string', width: 100 },
                { dataField: 'accname', caption: 'Tên tài khoản', dataType: 'string', width: 300 },
            ];

            if (!isCdps) {
                columns = [
                    {
                        dataField: 'doituong', caption: 'Đối tượng', dataType: 'string', width: 300, cellTemplate: function (cellElement, cellInfo) {
                            getUrlCell(cellElement, cellInfo);
                        }
                    },
                    ...columns
                ]
            } else {
                columns = [
                    {
                        dataField: 'url_chitiet', caption: 'Mã tài khoản', dataType: 'string', cellTemplate: function (cellElement, cellInfo) {
                            getUrlCell(cellElement, cellInfo);
                        }
                    },
                    { dataField: 'accname', caption: 'Tên tài khoản', dataType: 'string', width: 300},
                ];
            }

            if (isVay) {
                columns.push({ dataField: 'kheuocvay_text', caption: 'Khế ước vay', dataType: 'string' });
            }

            return columns;
        }

        function getNestedAriseColumns() {
            return {
                caption: 'Số dư đầu',
                columns: [
                    { dataField: 'sodudauno', caption: 'Nợ', dataType: 'number',  format: "#,##0.00", alignment: 'right'},
                    { dataField: 'sodudauco', caption: 'Có', dataType: 'number',  format: "#,##0.00", alignment: 'right'},
                ]
            }
        }

        function getNestedBalanceColumns() {
            return {
                caption: 'Số phát sinh',
                columns: [
                    { dataField: 'phatsinhno', caption: 'Nợ', dataType: 'number',  format: "#,##0.00", alignment: 'right' },
                    { dataField: 'phatsinhco', caption: 'Có', dataType: 'number',  format: "#,##0.00", alignment: 'right' },
                ]
            }
        }

        function getNestedFinalColumns() {
            return {
                caption: 'Số dư cuối',
                columns: [
                    { dataField: 'soducuoino', caption: 'Nợ', dataType: 'number',  format: "#,##0.00", alignment: 'right' },
                    { dataField: 'soducuoico', caption: 'Có', dataType: 'number',  format: "#,##0.00", alignment: 'right' },
                ]
            }
        }

        function getDefaultColumns(isCdps, isVay) {
            let columns = [
                { dataField: 'accnumber', caption: 'Mã tài khoản', dataType: 'string', width: 150},
                { dataField: 'accname', caption: 'Tên tài khoản', dataType: 'string', width: 300},
            ];

            if (!isCdps) {
                columns = [
                    {
                        dataField: 'doituong', caption: 'Đối tượng', dataType: 'string', width: 300, cellTemplate: function (cellElement, cellInfo) {
                            getUrlCell(cellElement, cellInfo);
                        }
                    },
                    ...columns
                ]
            } else {
                columns = [
                    {
                        dataField: 'url_chitiet', caption: 'Mã tài khoản', width: 150, dataType: 'string', cellTemplate: function (cellElement, cellInfo) {
                            getUrlCell(cellElement, cellInfo);
                        }
                    },
                    { dataField: 'accname', caption: 'Tên tài khoản', dataType: 'string', width: 300},
                ];
            }

            if (isVay) {
                columns.push({ dataField: 'kheuocvay_text', caption: 'Khế ước vay', dataType: 'string' });
            }

            // Thêm các cột còn lại
            columns.push(
                { dataField: 'sodudaunovnd', caption: 'Số dư đầu: Nợ', dataType: 'number', format: "###,###,##0", alignment: 'right' },
                { dataField: 'sodudaucovnd', caption: 'Số dư đầu: Có', dataType: 'number', format: "###,###,##0", alignment: 'right' },
                { dataField: 'phatsinhnovnd', caption: 'Phát sinh: Nợ', dataType: 'number', format: "###,###,##0", alignment: 'right' },
                { dataField: 'phatsinhcovnd', caption: 'Phát sinh: Có', dataType: 'number', format: "###,###,##0", alignment: 'right' },
                { dataField: 'soducuoinovnd', caption: 'Số dư cuối: Nợ', dataType: 'number', format: "###,###,##0", alignment: 'right' },
                { dataField: 'soducuoicovnd', caption: 'Số dư cuối: Có', dataType: 'number', format: "###,###,##0", alignment: 'right' }
            );

            return columns;
        }

        function getCurrencyColumns(isCdps, isVay) {
            let columns = [
                { dataField: 'accnumber', caption: 'Mã tài khoản', dataType: 'string', width: 150},
                { dataField: 'accname', caption: 'Tên tài khoản', dataType: 'string', width: 300},

            ];

            if (!isCdps) {
                columns = [{
                        dataField: 'doituong', caption: 'Đối tượng', dataType: 'string', width: 300, cellTemplate: function (cellElement, cellInfo) {
                            getUrlCell(cellElement, cellInfo);
                        }
                    },
                    ...columns
                ]
            } else {
                columns = [
                    {
                        dataField: 'url_chitiet', caption: 'Mã tài khoản', dataType: 'string', width: 150, cellTemplate: function (cellElement, cellInfo) {
                            getUrlCell(cellElement, cellInfo);
                        }
                    },
                    { dataField: 'accname', caption: 'Tên tài khoản', dataType: 'string', width: 300},
                ];
            }

            if (isVay) {
                columns.push({ dataField: 'kheuocvay_text', caption: 'Khế ước vay', dataType: 'string' });
            }

            // Thêm các cột còn lại
            columns.push(
                { dataField: 'sodudauno', caption: 'Số dư đầu: Nợ (NT)', dataType: 'number', format: "#,##0.00", alignment: 'right' },
                { dataField: 'sodudauco', caption: 'Số dư đầu: Có (NT)', dataType: 'number', format: "#,##0.00", alignment: 'right' },
                { dataField: 'phatsinhno', caption: 'Phát sinh: Nợ (NT)', dataType: 'number', format: "#,##0.00", alignment: 'right' },
                { dataField: 'phatsinhco', caption: 'Phát sinh: Có (NT)', dataType: 'number', format: "#,##0.00", alignment: 'right' },
                { dataField: 'soducuoino', caption: 'Số dư cuối: Nợ(NT)', dataType: 'number', format: "#,##0.00", alignment: 'right' },
                { dataField: 'soducuoico', caption: 'Số dư cuối: Có (NT)', dataType: 'number', format: "#,##0.00", alignment: 'right' },
                { dataField: 'sodudaunovnd', caption: 'Số dư đầu: Nợ (VNĐ)', dataType: 'number', format: "###,###,##0", alignment: 'right' },
                { dataField: 'sodudaucovnd', caption: 'Số dư đầu: Có (VNĐ)', dataType: 'number', format: "###,###,##0", alignment: 'right' },
                { dataField: 'phatsinhnovnd', caption: 'Phát sinh: Nợ (VNĐ)', dataType: 'number', format: "###,###,##0", alignment: 'right' },
                { dataField: 'phatsinhcovnd', caption: 'Phát sinh: Có (VNĐ)', dataType: 'number', format: "###,###,##0", alignment: 'right' },
                { dataField: 'soducuoinovnd', caption: 'Số dư cuối: Nợ (VNĐ)', dataType: 'number', format: "###,###,##0", alignment: 'right' },
                { dataField: 'soducuoicovnd', caption: 'Số dư cuối: Có (VNĐ)', dataType: 'number', format: "###,###,##0", alignment: 'right' }
            );

            return columns;
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

        function refresh() {
            window.location.reload();
        }

        function searchReport() {
            window.onbeforeunload = null;
            let currentRecord = ccr.get();
            if (!libCS.validateDate(currentRecord, 19)) {
                return;
            }
            let urlDC = getUrlParam(currentRecord) + '&isearch=T';
            urlDC = urlDC + plusAccount(currentRecord);
            window.location.replace(urlDC);
        }

        function getUrlParam(currentRecord) {
            return url.resolveScript({
                scriptId: 'customscript_scv_sl_rp_vas_tt_v3',
                deploymentId: 'customdeploy_scv_sl_rp_vas_tt_v3',
                returnExternalUrl: false,
                params: getParam(currentRecord)
            });
        }

        function getParam(currentRecord) {
            return {
                custpage_entity: currentRecord.getValue('custpage_entity'),
                custpage_subsidiary: currentRecord.getValue('custpage_subsidiary').join(','),
                custpage_subsidiarytext: currentRecord.getText('custpage_subsidiary'),
                custpage_order_type: currentRecord.getValue('custpage_order_type'),
                custpage_classification: currentRecord.getValue('custpage_classification'),
                custpage_location: currentRecord.getValue('custpage_location'),
                custpage_department: currentRecord.getValue('custpage_department'),
                custpage_kmcp: currentRecord.getValue('custpage_kmcp'),
                custpage_netnoco: currentRecord.getValue('custpage_netnoco') ? 'T' : 'F',
                custpage_not_level: currentRecord.getValue('custpage_not_level') ? 'T' : 'F',
                custpage_acc_level: currentRecord.getValue('custpage_acc_level'),
                custpage_date_dauky: currentRecord.getText('custpage_date_dauky'),
                custpage_date_cuoiky: currentRecord.getText('custpage_date_cuoiky'),
                custpage_reportype: currentRecord.getValue('custpage_reportype'),
                custpage_currencyvalue: currentRecord.getValue('custpage_currencyvalue'),
                custpage_currencytext: currentRecord.getText('custpage_currencyvalue'),
                custpage_debitloanagreement: currentRecord.getValue('custpage_debitloanagreement'),
                custpage_debitloanagreementtext: currentRecord.getText('custpage_debitloanagreement'),
                custpage_matt: currentRecord.getValue('custpage_matt'),
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

        const URL_RQ = '/app/site/hosting/scriptlet.nl?script=customscript_scv_sl_rp_vas_tt_v3&deploy=customdeploy_scv_sl_rp_vas_tt_v3';

        function exportReport() {
            window.onbeforeunload = null;
            let currentRecord = ccr.get();
            if (!libCS.validateDate(currentRecord, 19)) {
                return;
            }
            let params = getParam(currentRecord);
            params.isearch = 'T';
            params.isgetdata = 'T';
            libCS.showLoadingDialog(true);

            let resCallData = nlapiRequestURL(URL_RQ, params);
            let body = resCallData.getBody();
            let jsonEnd = body.lastIndexOf('}');
            let cleanJson = body.slice(0, jsonEnd + 1);

            let objDataCol = JSON.parse(cleanJson);
            let objDataConfig = JSON.parse(nlapiRequestURL(URL_RQ, {
                action: 'getUrlTemplate',
                custpage_subsidiary: currentRecord.getValue('custpage_subsidiary'),
                date_dauky: (currentRecord.getValue('custpage_date_dauky')).toLocaleDateString('vi-VN'),
                date_cuoiky: (currentRecord.getValue('custpage_date_cuoiky')).toLocaleDateString('vi-VN'),
                custpage_reportype: params.custpage_reportype,
                custpage_entity: params.custpage_entity,
                custpage_currencytext: params.custpage_currencytext,
                custpage_currencyvalue: params.custpage_currencyvalue,
            }).getBody());
            try {
                exportExcel(params, currentRecord, objDataConfig, objDataCol);
            } catch (error) {
                console.log("error", error)
                libCS.showLoadingDialog(false);
            }
            libCS.showLoadingDialog(false);
        }

        function getTextFromHtml(rawHtml) {
            if (!rawHtml || typeof rawHtml !== 'string' || !rawHtml.includes('<a')) {
                return rawHtml;
            }

            try {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = rawHtml;
                return tempDiv.textContent || tempDiv.innerText;
            } catch (e) {
                return rawHtml;
            }
        }

        const exportExcel = async (params, currentRecord, objDataConfig, listDataLines) => {
            let reportName = '';
            const objDataHeader = objDataConfig.objDataHeader;

            let workbook = await libCsXLS.loadWorkbookFromUrl(objDataConfig.urlTemplate);
            let reportType = params.custpage_reportype;
            let currencyValue = params.custpage_currencyvalue;
            let currentSheet = workbook.worksheets[0];
            currentSheet.name = 'Tong hop Cong No';

            initDataHeaderSheet(currentSheet, objDataHeader, params);
            mergeCellBodyParm(currentSheet);

            let currentRowForDynamicData = 14;
            let columnSet = 15;

            const styleBold = libCsXLS.getObjStyleRow(currentSheet, columnSet, ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O'], 0, 14, true);
            const styleNormal = libCsXLS.getObjStyleRow(currentSheet, columnSet, ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O'], 0, 14);

            const fcNumberFormat = '#,##0.00';
            const vndNumberFormat = '###,###,##0';
            let fcNumericColumns = [];
            let vndNumericColumns = [];

            if ((reportType === 'customsearch_scv_vas_cntt_limit' || reportType === 'customsearch_scv_vas_vaytt_limit') && currencyValue) {
                fcNumericColumns = ['D', 'E', 'F', 'G', 'H', 'I'];
                vndNumericColumns = ['J', 'K', 'L', 'M', 'N', 'O'];
                if (reportType === 'customsearch_scv_vas_vaytt_limit') {
                    reportName = 'Vay, cho vay, gửi tiết kiệm';
                } else {
                    reportName = 'BÁO CÁO TỔNG HỢP CÔNG NỢ';
                }
            } else if ((reportType === 'customsearch_scv_vas_cntt_limit' || reportType === 'customsearch_scv_vas_vaytt_limit') && !currencyValue) {
                vndNumericColumns = ['D', 'E', 'F', 'G', 'H', 'I'];
                if (reportType === 'customsearch_scv_vas_vaytt_limit') {
                    reportName = 'Vay, cho vay, gửi tiết kiệm';
                } else {
                    reportName = 'BÁO CÁO TỔNG HỢP CÔNG NỢ';
                }
            } else if (reportType === 'customsearch_scv_vas_cdpstt_limit' && !currencyValue) {
                vndNumericColumns = ['C', 'D', 'E', 'F', 'G', 'H'];
                reportName = 'CÂN ĐỐI PHÁT SINH';
            } else if (reportType === 'customsearch_scv_vas_cdpstt_limit' && currencyValue) {
                fcNumericColumns = ['C', 'D', 'E', 'F', 'G', 'H'];
                vndNumericColumns = ['I', 'J', 'K', 'L', 'M', 'N'];
                reportName = 'CÂN ĐỐI PHÁT SINH';
            } else if (reportType === 'customsearch_scv_vas_cntt_limit_nt') {
                fcNumericColumns = ['D', 'E', 'F', 'G', 'H', 'I'];
                reportName = 'BÁO CÁO TỔNG HỢP CÔNG NỢ';
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
            objData.forEach(line => {
                if (line.doituong) {
                    line.doituong = decodeHtmlEntities(line.doituong);
                }
                if (line.accname) {
                    line.accname = decodeHtmlEntities(line.accname);
                }
            });

            objData = handleData(objData);

            const templateRowNumber = 14;

            for (let i = 0; i < objData.length; i++) {
                let objDataLine = objData[i];
                let styleToApply;
                if (objDataLine.doituong) {
                    objDataLine.doituong = getTextFromHtml(objDataLine.doituong);
                }
                if (currentRowForDynamicData > templateRowNumber) {
                    currentSheet.insertRow(currentRowForDynamicData);
                }
                if (objDataLine.isAccount) {
                    libCsXLS.mergeCell(currentSheet, currentRowForDynamicData, 1, currentRowForDynamicData, 4);
                }

                styleToApply = (objDataLine.typebold === '2') ? styleBold : styleNormal;

                setCellValueDetailLine(currentSheet, objDataLine, currentRowForDynamicData, reportType, currencyValue);

                const templateRow = currentSheet.getRow(templateRowNumber);

                for (let j = 0; j < columnSet; j++) {
                    let colName = String.fromCharCode(65 + j);
                    const cell = currentSheet.getCell(colName + currentRowForDynamicData);
                    const templateCell = templateRow.getCell(j + 1);

                    cell.style = JSON.parse(JSON.stringify(templateCell.style || {}));

                    const specificStyle = styleToApply[colName];
                    if (specificStyle) {
                        if (specificStyle.font) cell.font = specificStyle.font;
                        if (specificStyle.numFmt) cell.numFmt = specificStyle.numFmt;
                    }

                    cell.alignment = {
                        vertical: 'middle',
                        wrapText: true
                    };
                    if (specificStyle && specificStyle.font) {
                        cell.font = {
                            ...specificStyle.font,
                            name: 'Times New Roman',
                            size: 9,
                        };
                    } else {
                        cell.font = {
                            name: 'Times New Roman',
                            size: 9,
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
                {addressCell: 'A5', keys: '{pFromDate}', values: params.custpage_date_dauky},
                {addressCell: 'A5', keys: '{pToDate}', values: params.custpage_date_cuoiky},
                {addressCell: 'A6', keys: '{pAccount}', values: Array.isArray(params.custpage_account_parent_text) ? params.custpage_account_parent_text.join(', ') : params.custpage_account_parent_text},
                {addressCell: 'A7', keys: '{pEntity}', values: params.custpage_entity || 'Tổng hợp'},
                {addressCell: 'A8', keys: '{pCurrency}', values: params.custpage_currencytext || 'VNĐ'},
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
            if (reportType === 'customsearch_scv_vas_cntt_limit_nt') {
                cellMap = [
                    { col: 'A', key: 'doituong' },
                    { col: 'B', key: 'accnumber' },
                    { col: 'C', key: 'accname' },
                    { col: 'D', key: 'sodudauno', isNumber: true },
                    { col: 'E', key: 'sodudauco', isNumber: true},
                    { col: 'F', key: 'phatsinhno', isNumber: true },
                    { col: 'G', key: 'phatsinhco', isNumber: true },
                    { col: 'H', key: 'soducuoino', isNumber: true },
                    { col: 'I', key: 'soducuoico', isNumber: true},
                ];
            } else if ((reportType === 'customsearch_scv_vas_cntt_limit' || reportType === 'customsearch_scv_vas_vaytt_limit') && currencyValue) {
                cellMap = [
                    { col: 'A', key: 'doituong' },
                    { col: 'B', key: 'accnumber' },
                    { col: 'C', key: 'accname' },
                    { col: 'D', key: 'sodudauno', isNumber: true },
                    { col: 'E', key: 'sodudauco', isNumber: true},
                    { col: 'F', key: 'phatsinhno', isNumber: true },
                    { col: 'G', key: 'phatsinhco', isNumber: true },
                    { col: 'H', key: 'soducuoino', isNumber: true},
                    { col: 'I', key: 'soducuoico', isNumber: true },
                    { col: 'J', key: 'sodudaunovnd', isNumber: true},
                    { col: 'K', key: 'sodudaucovnd', isNumber: true},
                    { col: 'L', key: 'phatsinhnovnd', isNumber: true },
                    { col: 'M', key: 'phatsinhcovnd', isNumber: true },
                    { col: 'N', key: 'soducuoinovnd', isNumber: true},
                    { col: 'O', key: 'soducuoicovnd',  isNumber: true},
                ];
            } else if (reportType === 'customsearch_scv_vas_cdpstt_limit' && currencyValue) {
                cellMap = [
                    { col: 'A', key: 'accnumber' },
                    { col: 'B', key: 'accname' },
                    { col: 'C', key: 'sodudauno', isNumber: true },
                    { col: 'D', key: 'sodudauco', isNumber: true},
                    { col: 'E', key: 'phatsinhno', isNumber: true },
                    { col: 'F', key: 'phatsinhco', isNumber: true },
                    { col: 'G', key: 'soducuoino', isNumber: true},
                    { col: 'H', key: 'soducuoico', isNumber: true },
                    { col: 'I', key: 'sodudaunovnd', isNumber: true},
                    { col: 'J', key: 'sodudaucovnd', isNumber: true},
                    { col: 'K', key: 'phatsinhnovnd', isNumber: true },
                    { col: 'L', key: 'phatsinhcovnd', isNumber: true },
                    { col: 'M', key: 'soducuoinovnd', isNumber: true},
                    { col: 'N', key: 'soducuoicovnd',  isNumber: true},
                ];
            }
            else if (reportType === 'customsearch_scv_vas_cdpstt_limit' && !currencyValue) {
                cellMap = [
                    { col: 'A', key: 'accnumber' },
                    { col: 'B', key: 'accname' },
                    { col: 'C', key: 'sodudaunovnd', isNumber: true},
                    { col: 'D', key: 'sodudaucovnd', isNumber: true},
                    { col: 'E', key: 'phatsinhnovnd', isNumber: true },
                    { col: 'F', key: 'phatsinhcovnd', isNumber: true },
                    { col: 'G', key: 'soducuoinovnd', isNumber: true},
                    { col: 'H', key: 'soducuoicovnd',  isNumber: true},
                ];
            } else if (reportType === 'customsearch_scv_vas_vaytt_limit' && !currencyValue) {
                cellMap = [
                    { col: 'A', key: 'doituong' },
                    { col: 'B', key: 'accnumber' },
                    { col: 'C', key: 'accname'},
                    { col: 'D', key: 'kheuocvay_text'},
                    { col: 'E', key: 'sodudaunovnd', isNumber: true},
                    { col: 'F', key: 'sodudaucovnd', isNumber: true },
                    { col: 'G', key: 'phatsinhnovnd',  isNumber: true},
                    { col: 'H', key: 'phatsinhcovnd', isNumber: true},
                    { col: 'I', key: 'soducuoinovnd', isNumber: true},
                    { col: 'J', key: 'soducuoicovnd', isNumber: true},
                ];
            } else if (reportType === 'customsearch_scv_vas_cntt_limit' && !currencyValue) {
                cellMap = [
                    { col: 'A', key: 'doituong' },
                    { col: 'B', key: 'accnumber' },
                    { col: 'C', key: 'accname' },
                    { col: 'D', key: 'sodudaunovnd', isNumber: true},
                    { col: 'E', key: 'sodudaucovnd', isNumber: true },
                    { col: 'F', key: 'phatsinhnovnd',  isNumber: true},
                    { col: 'G', key: 'phatsinhcovnd', isNumber: true},
                    { col: 'H', key: 'soducuoinovnd', isNumber: true},
                    { col: 'I', key: 'soducuoicovnd', isNumber: true},
                ]
            }

            cellMap.forEach(({ col, key, isNumber, defaultValue }) => {
                const cell = currentSheet.getCell(`${col}${rowInsert}`);
                let value = objDataLine?.[key];
                if (key === 'doituong' && value) {
                    cell.value = value ?? defaultValue ?? null;
                    libCsXLS.updateRowHeight(currentSheet, value, 0, rowInsert, 35);
                } else {
                    cell.value = parseVietnameseNumber(value) ? parseVietnameseNumber(value) : (value ?? defaultValue ?? null);
                }

                if ((key === 'accname' || key === 'accnumber') && value) {
                    cell.alignment = {
                        vertical: 'middle',
                        horizontal: 'left',
                        wrapText: true
                    };
                    libCsXLS.updateRowHeight(currentSheet, value, 0, rowInsert, 35);
                }
                if (isNumber) {
                    cell.alignment = {
                        vertical: 'middle',
                        horizontal: 'right',
                    };
                }
            });
        }

        function parseVietnameseNumber(formattedString) {
            if (typeof formattedString !== 'string' || !formattedString) {
                return null;
            }
            const parsableString = formattedString.replace(/\./g, '').replace(',', '.');
            const number = parseFloat(parsableString);
            return isNaN(number) ? null : number;
        }

        return {
            pageInit: pageInit,
            refresh: refresh,
            searchReport: searchReport,
            exportReport: exportReport,
        };

    });
