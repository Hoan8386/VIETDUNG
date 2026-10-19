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
            /*if(objProjectData.isearch === "T") {
                let curRec = scriptContext.currentRecord;
                libCustomForm.resizeGrid("scvTabsContainer");
                renderDxTabsWithDxGrid(curRec, objProjectData);
            }*/
        }

        function fieldChanged(context) {
            let currentRecord = context.currentRecord;
            let fieldId = context.fieldId;

            // if (fieldId === 'custpage_reportype') {
            //     toggleCurrencyField(currentRecord);
            // }
        }

        function toggleCurrencyField(currentRecord) {
            let reportType = currentRecord.getValue('custpage_reportype');
            let hideCurrency = (reportType === 'customsearch_scv_vas_ctcndt_nt');

            let currencyField = currentRecord.getField('custpage_currencyvalue');
            if (currencyField) {
                currencyField.isDisplay = !hideCurrency;
                if (hideCurrency) {
                    currentRecord.setValue({ fieldId: 'custpage_currencyvalue', value: '' });
                }
            }
        }

        function renderDxTabsWithDxGrid(curRec, objProjectData) {
            const { objData, reportType, currencyValue } = objProjectData;
            let columns;
            if (reportType !== "customsearch_scv_vas_ctcndt_nt" && currencyValue) {
                columns = getCurrencyColumns();
            } else if (reportType === "customsearch_scv_vas_ctcndt_nt") {
                columns = [...getBaseColumns(), getNestedAriseColumns(), getNestedBalanceColumns()];
            } else {
                columns = getDefaultColumns();
            }

            // Build Tab Panel
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
                            if (e.rowType === "data" && e.data.typebold === "2") {
                                e.cellElement.css("font-weight", "bold");
                            }
                        }
                    });
                }
            }];

            $("#scvTabsContainer").dxTabPanel({ items });
        }

        function getBaseColumns() {
            return [
                { dataField: 'trandate', caption: 'Ngày', dataType: 'string' },
                { dataField: 'soct', caption: 'Số hiệu chứng từ', dataType: 'string', width: 190,
                    cellTemplate: function (cellElement, cellInfo) {
                        getUrlCell(cellElement, cellInfo);
                    }
                },
                { dataField: 'ngayct', caption: 'Ngày, tháng chứng từ', dataType: 'string', width: 100},
                { dataField: 'diengiai', caption: 'Diễn giải', dataType: 'string', width: 300 },
                { dataField: 'currency', caption: 'Loại tiền tệ', dataType: 'string'},
                { dataField: 'tygia', caption: 'Tỷ giá', dataType: 'string', format: "###,###,##0" }
            ];
        }

        function getNestedAriseColumns() {
            return {
                caption: 'Ngoại tệ',
                columns: [
                    { dataField: 'phatsinhno', caption: 'Nợ PS', dataType: 'string', alignment: 'right' },
                    { dataField: 'phatsinhco', caption: 'Có PS', dataType: 'string', alignment: 'right' },
                    { dataField: 'soduno', caption: 'Dư nợ', dataType: 'string', alignment: 'right' },
                    { dataField: 'soduco', caption: 'Dư có', dataType: 'string', alignment: 'right' },
                ]
            }
        }

        function getNestedBalanceColumns() {
            return {
                caption: 'VNĐ',
                columns: [
                    { dataField: 'phatsinhnovnd', caption: 'Nợ PS', dataType: 'string', alignment: 'right' },
                    { dataField: 'phatsinhcovnd', caption: 'Có PS', dataType: 'string', alignment: 'right' },
                    { dataField: 'sodunovnd', caption: 'Dư nợ', dataType: 'string', alignment: 'right' },
                    { dataField: 'soducovnd', caption: 'Dư có', dataType: 'string', alignment: 'right' },
                ]
            }
        }

        function getDefaultColumns() {
            return [
                { dataField: 'trandate', caption: 'DATE', dataType: 'string', alignment: 'left' },
                { dataField: 'ngayct', caption: 'Ngày CT', dataType: 'string', width: 100, alignment: 'left' },
                { dataField: 'soct', caption: 'Số CT', dataType: 'string', alignment: 'left',
                    cellTemplate: function (cellElement, cellInfo) {
                        getUrlCell(cellElement, cellInfo);
                    }
                },
                { dataField: 'diengiai', caption: 'Diễn giải', dataType: 'string', width: 300, alignment: 'left' },
                { dataField: 'tygia', caption: 'Tỷ giá', dataType: 'string', alignment: 'right' },
                { dataField: 'phatsinhnovnd', caption: 'Phát sinh nợ (VNĐ)', dataType: 'string', alignment: 'right' },
                { dataField: 'phatsinhcovnd', caption: 'Phát sinh có (VNĐ)', dataType: 'string', alignment: 'right' },
                { dataField: 'sodunovnd', caption: 'Số dư nợ (VNĐ)', dataType: 'string', alignment: 'right' },
                { dataField: 'soducovnd', caption: 'Số dư có (VNĐ)', dataType: 'string', alignment: 'right' },
            ];
        }

        function getCurrencyColumns() {
            return [
                { dataField: 'trandate', caption: 'DATE', dataType: 'string', alignment: 'left' },
                { dataField: 'ngayct', caption: 'Ngày CT', dataType: 'string', width: 100, alignment: 'left' },
                { dataField: 'soct', caption: 'Số CT', dataType: 'string', alignment: 'left',
                    cellTemplate: function (cellElement, cellInfo) {
                        getUrlCell(cellElement, cellInfo);
                    }
                },
                { dataField: 'diengiai', caption: 'Diễn giải', dataType: 'string', width: 300, alignment: 'left' },
                { dataField: 'tygia', caption: 'Tỷ giá', dataType: 'string', alignment: 'right' },
                { dataField: 'phatsinhno', caption: 'Phát sinh nợ (NT)', dataType: 'string', alignment: 'right' },
                { dataField: 'phatsinhco', caption: 'Phát sinh có (NT)', dataType: 'string', alignment: 'right' },
                { dataField: 'soduno', caption: 'Số dư nợ (NT)', dataType: 'string', alignment: 'right' },
                { dataField: 'soduco', caption: 'Số dư có (NT)', dataType: 'string', alignment: 'right' },
                { dataField: 'phatsinhnovnd', caption: 'Phát sinh nợ (VNĐ)', dataType: 'string', alignment: 'right' },
                { dataField: 'phatsinhcovnd', caption: 'Phát sinh có (VNĐ)', dataType: 'string', alignment: 'right' },
                { dataField: 'sodunovnd', caption: 'Số dư nợ (VNĐ)', dataType: 'string', alignment: 'right' },
                { dataField: 'soducovnd', caption: 'Số dư có (VNĐ)', dataType: 'string', alignment: 'right' },
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

        function searchReport() {
            window.onbeforeunload = null;
            libCs.showLoadingDialog(true);
            let currentRecord = ccr.get();

            if (!libCs.validateDate(currentRecord, 19)) {
                libCs.showLoadingDialog(false);
                return;
            }
            let params = getParam(currentRecord);
            params.isearch = 'T';

            let newUrl = url.resolveScript({
                scriptId: 'customscript_scv_sl_rp_vas_dt_v2',
                deploymentId: 'customdeploy_scv_sl_rp_vas_dt_v2',
                returnExternalUrl: false,
                params: params // Sử dụng object `params` đã bao gồm 'isearch=T'
            });

            window.history.pushState(params, document.title, newUrl);
            params.isgetdata = 'T';

            let resCallData = nlapiRequestURL(URL_RQ, params);
            let body = resCallData.getBody();

            libCustomForm.resizeGrid("scvTabsContainer");
            renderDxTabsWithDxGrid(currentRecord, JSON.parse(body));
            libCs.showLoadingDialog(false);
        }

        function getUrlParam(currentRecord) {
            return url.resolveScript({
                scriptId: 'customscript_scv_sl_rp_vas_dt_v2',
                deploymentId: 'customdeploy_scv_sl_rp_vas_dt_v2',
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
                custpage_exportbc: currentRecord.getValue('custpage_exportbc')
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

        const URL_RQ = '/app/site/hosting/scriptlet.nl?script=customscript_scv_sl_rp_vas_dt_v2&deploy=customdeploy_scv_sl_rp_vas_dt_v2';

        function exportReport() {
            window.onbeforeunload = null;
            let currentRecord = ccr.get();
            if (!libCs.validateDate(currentRecord, 19)) {
                return;
            }
            let params = getParam(currentRecord);
            params.isearch = 'T';
            params.isgetdata = 'T';
            libCs.showLoadingDialog(true);

            let resCallData = nlapiRequestURL(URL_RQ, params);
            let body = resCallData.getBody();
            let objDataCol = JSON.parse(body);
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
            const reportName = 'BÁO CÁO CHI TIẾT CÔNG NỢ';
            const objDataHeader = objDataConfig.objDataHeader;

            let workbook = await libCsXLS.loadWorkbookFromUrl(objDataConfig.urlTemplate);
            let reportType = params.custpage_reportype;
            let currencyValue = params.custpage_currencyvalue;
            let currentSheet = workbook.worksheets[0];
            currentSheet.name = 'Chi Tiet Cong No';

            initDataHeaderSheet(currentSheet, objDataHeader, params);
            //updateValueParam(currentSheet, "BÁO CÁO CHI TIẾT CÔNG NỢ", params);

            // mergeCellBodyParm(currentSheet);

            let currentRowForDynamicData = 13;
            let columnSet = params.custpage_reportype !== 'customsearch_scv_vas_ctcndt_nt' && !params.custpage_currencytext ? 13 : 14
            const styleBold = libCsXLS.getObjStyleRow(currentSheet, columnSet, ['A','B','C','D','E','F','G','H','I','J','K','L','M','N'], 0, 13, true);
            const styleNormal = libCsXLS.getObjStyleRow(currentSheet, columnSet, ['A','B','C','D','E','F','G','H','I','J','K','L','M', 'N'], 0, 13); // Style cho các dòng chi tiết
            const numberFormat = '#,##0.00'; // Định dạng số với 2 chữ số thập phân
            let numericColumns = [];

            if (reportType === 'customsearch_scv_vas_ctcndt_nt') {
                numericColumns = ['G', 'H', 'K', 'L'];
            } else if (reportType !== 'customsearch_scv_vas_ctcndt_nt' && currencyValue) {
                numericColumns = ['F', 'G', 'J', 'K'];
            }
            if (numericColumns.length > 0) {
                numericColumns.forEach(col => {
                    if (styleBold[col]) {
                        styleBold[col].numFmt = numberFormat;
                    }
                    if (styleNormal[col]) {
                        styleNormal[col].numFmt = numberFormat;
                    }
                });
            }

            let objData = listDataLines.objData;
            for (let i = 0; i < objData.length; i++) {
                let objDataLine = objData[i];
                let styleToApply;

                if (currentRowForDynamicData > columnSet) {
                    currentSheet.insertRow(currentRowForDynamicData);
                }
                if (objDataLine.isAccount) {
                    libCsXLS.mergeCell(currentSheet, currentRowForDynamicData, 1, currentRowForDynamicData, 4);
                }
                if (objDataLine.typebold === '2') {
                    styleToApply = styleBold;
                } else {
                    styleToApply = styleNormal;
                }
                setCellValueDetailLine(currentSheet, objDataLine, currentRowForDynamicData, reportType, currencyValue);

                for (let j = 0; j < columnSet; j++) {
                    let colName = String.fromCharCode(65 + j);
                    let cell = currentSheet.getCell(colName + currentRowForDynamicData);
                    cell.style = styleToApply[colName];
                }

                currentRowForDynamicData++;
            }
            // addFooterSignature(currentSheet, currentRowForDynamicData + 2);

            // Save File
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
            if (reportType === 'customsearch_scv_vas_ctcndt_nt') {
                cellMap = [
                    { col: 'A', key: 'trandate' },
                    { col: 'B', key: 'soctText' },
                    { col: 'C', key: 'ngayct' },
                    { col: 'D', key: 'diengiai' },
                    { col: 'E', key: 'currency', isNumber: true },
                    { col: 'F', key: 'tygia', isNumber: true },
                    { col: 'G', key: 'phatsinhno', isNumber: true },
                    { col: 'H', key: 'phatsinhco', isNumber: true },
                    { col: 'I', key: 'phatsinhnovnd', isNumber: true },
                    { col: 'J', key: 'phatsinhcovnd',  isNumber: true},
                    { col: 'K', key: 'soduno', isNumber: true },
                    { col: 'L', key: 'soduco', isNumber: true},
                    { col: 'M', key: 'sodunovnd', isNumber: true},
                    { col: 'N', key: 'soducovnd', isNumber: true},
                ];
            } else if (reportType !== 'customsearch_scv_vas_ctcndt_nt' && currencyValue) {
                cellMap = [
                    { col: 'A', key: 'trandate' },
                    { col: 'B', key: 'soctText' },
                    { col: 'C', key: 'ngayct' },
                    { col: 'D', key: 'diengiai' },
                    { col: 'E', key: 'tygia', isNumber: true },
                    { col: 'F', key: 'phatsinhno', isNumber: true },
                    { col: 'G', key: 'phatsinhco', isNumber: true },
                    { col: 'H', key: 'phatsinhnovnd', isNumber: true },
                    { col: 'I', key: 'phatsinhcovnd',  isNumber: true},
                    { col: 'J', key: 'soduno', isNumber: true },
                    { col: 'K', key: 'soduco', isNumber: true},
                    { col: 'L', key: 'sodunovnd', isNumber: true},
                    { col: 'M', key: 'soducovnd', isNumber: true},
                ];
            } else if (!currencyValue) {
                cellMap = [
                    { col: 'A', key: 'trandate' },
                    { col: 'B', key: 'soctText' },
                    { col: 'C', key: 'ngayct' },
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
                cell.value = isNumber ? parseVietnameseNumber(value) : (value ?? defaultValue ?? null);
                // cell.value = value ?? defaultValue ?? null;
                if (key === 'diengiai' && value) {
                    libCsXLS.updateRowHeight(currentSheet, value, 0, rowInsert, 35);
                }
            });
        }

        function addFooterSignature(currentSheet, startRow) {
            const rowTitle = startRow;
            const rowSign = startRow + 1;
            const rowDate = startRow - 1;

            // Dòng ngày tháng
            currentSheet.getCell(`M${rowDate}`).value = `Ngày ...... tháng ...... năm ......`;
            currentSheet.getCell(`M${rowDate}`).alignment = { horizontal: 'center' };

            // Chức danh
            currentSheet.getCell(`B${rowTitle}`).value = 'Đối tượng công nợ';
            currentSheet.getCell(`E${rowTitle}`).value = 'Người ghi sổ';
            currentSheet.getCell(`J${rowTitle}`).value = 'Kế toán trưởng';
            currentSheet.getCell(`M${rowTitle}`).value = 'Giám đốc';

            // Ghi chú ký tên
            currentSheet.getCell(`B${rowSign}`).value = '(Ký, họ tên)';
            currentSheet.getCell(`E${rowSign}`).value = '(Ký, họ tên)';
            currentSheet.getCell(`J${rowSign}`).value = '(Ký, họ tên)';
            currentSheet.getCell(`M${rowSign}`).value = '(Ký, họ tên, đóng dấu)';

            // Định dạng
            ['B', 'E', 'J', 'M'].forEach(col => {
                let titleCell = currentSheet.getCell(`${col}${rowTitle}`);
                titleCell.font = { bold: true };
                titleCell.alignment = { horizontal: 'center' };

                let signCell = currentSheet.getCell(`${col}${rowSign}`);
                signCell.font = { italic: true };
                signCell.alignment = { horizontal: 'center' };
            });

            currentSheet.getCell(`L${rowDate}`).alignment = { horizontal: 'center' };
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
