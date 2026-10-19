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
                scriptId: 'customscript_scv_sl_rp_vas_tt_v2',
                deploymentId: 'customdeploy_scv_sl_rp_vas_tt_v2',
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

        function renderDxTabsWithDxGrid(curRec, objProjectData) {
            const { objData, isCnNt, isCdps, isVay, currencyValue } = objProjectData;
            let columns;
            if (!isCnNt && currencyValue) {
                columns = getCurrencyColumns(isCdps, isVay);
            } else if (isCnNt) {
                columns = [...getBaseColumns(isCdps, isVay), getNestedAriseColumns(), getNestedBalanceColumns(), getNestedFinalColumns()];
            } else {
                columns = getDefaultColumns(isCdps, isVay);
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
                            e.cellElement.css('font-size', '12px');
                            if (e.rowType === "data" && e.data.typebold === "2") {
                                e.cellElement.css("font-weight", "bold");
                            }
                        }
                    });
                }
            }];

            $("#scvTabsContainer").dxTabPanel({ items });
        }

        function getBaseColumns(isCdps, isVay) {
            let columns = [
                // {
                //     dataField: 'url_chitiet', caption: 'Mã tài khoản', dataType: 'string', width: 300, cellTemplate: function (cellElement, cellInfo) {
                //         getUrlCell(cellElement, cellInfo);
                //     }
                // },
                { dataField: 'accnumber', caption: 'Mã tài khoản', dataType: 'string', width: 100 },
                { dataField: 'accname', caption: 'Tên tài khoản', dataType: 'string', width: 180 },
            ];

            if (!isCdps) {
                columns.push({
                    dataField: 'url_chitiet', caption: 'Đối tượng', dataType: 'string', width: 350, cellTemplate: function (cellElement, cellInfo) {
                        getUrlCell(cellElement, cellInfo);
                    }
                });
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
                {
                    dataField: 'accnumber', caption: 'Mã tài khoản', dataType: 'string', width: 300, cellTemplate: function (cellElement, cellInfo) {
                        getUrlCell(cellElement, cellInfo);
                    }
                },
                { dataField: 'accname', caption: 'Tên tài khoản', dataType: 'string' },
            ];

            // Nếu isCdps là false thì hiển thị cột Đối tượng
            if (!isCdps) {
                columns.push({
                    dataField: 'url_chitiet', caption: 'Đối tượng', dataType: 'string', width: 300, cellTemplate: function (cellElement, cellInfo) {
                        getUrlCell(cellElement, cellInfo);
                    }
                });
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
                {
                    dataField: 'url_chitiet', caption: 'Mã tài khoản', dataType: 'string', width: 300, cellTemplate: function (cellElement, cellInfo) {
                        getUrlCell(cellElement, cellInfo);
                    }
                },
                { dataField: 'accname', caption: 'Tên tài khoản', dataType: 'string' },
            ];

            // Nếu isCdps là false thì hiển thị cột Đối tượng
            if (!isCdps) {
                columns.push({
                    dataField: 'url_chitiet', caption: 'Đối tượng', dataType: 'string', width: 300, cellTemplate: function (cellElement, cellInfo) {
                        getUrlCell(cellElement, cellInfo);
                    }
                });
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

        // function searchReport() {
        //     window.onbeforeunload = null;
        //     libCS.showLoadingDialog(true);
        //     let currentRecord = ccr.get();
        //     let params = getParam(currentRecord);
        //     if (!libCS.fnValidateFields(currentRecord, arrFldsMandatory)) {
        //         libCS.showLoadingDialog(false);
        //         return;
        //     }
        //     params.isearch = 'T';
        //     params.isgetdata = 'T';
        //
        //     let resCallData = nlapiRequestURL(URL_RQ, params);
        //     let body = resCallData.getBody();
        //
        //     libCustomForm.resizeGrid("scvTabsContainer");
        //     renderDxTabsWithDxGrid(currentRecord, JSON.parse(body));
        //     libCS.showLoadingDialog(false);
        // }
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
                scriptId: 'customscript_scv_sl_rp_vas_tt_v2',
                deploymentId: 'customdeploy_scv_sl_rp_vas_tt_v2',
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
                custpage_matt: currentRecord.getText('custpage_matt'),
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

        const URL_RQ = '/app/site/hosting/scriptlet.nl?script=customscript_scv_sl_rp_vas_tt_v2&deploy=customdeploy_scv_sl_rp_vas_tt_v2';

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

        const exportExcel = async (params, currentRecord, objDataConfig, listDataLines) => {
            debugger;
            const reportName = 'BÁO CÁO TỔNG HỢP CÔNG NỢ';
            const objDataHeader = objDataConfig.objDataHeader;

            let workbook = await libCsXLS.loadWorkbookFromUrl(objDataConfig.urlTemplate);
            let reportType = params.custpage_reportype;
            let currencyValue = params.custpage_currencyvalue;
            let currentSheet = workbook.worksheets[0];
            currentSheet.name = 'Tong hop Cong No';

            initDataHeaderSheet(currentSheet, objDataHeader, params);
            // updateValueParam(currentSheet, "BÁO CÁO TỔNG HỢP CÔNG NỢ KHÁCH HÀNG", params);

            mergeCellBodyParm(currentSheet);

            let currentRowForDynamicData = 14;
            let columnSet = params.custpage_reportype !== 'customsearch_scv_vas_cntt_nt' && !params.custpage_currencytext ? 13 : 14
            const styleBold = libCsXLS.getObjStyleRow(currentSheet, columnSet, ['A','B','C','D','E','F','G','H','I','J','K','L','M','N'], 0, 13, true);
            const styleNormal = libCsXLS.getObjStyleRow(currentSheet, columnSet, ['A','B','C','D','E','F','G','H','I','J','K','L','M', 'N'], 0, 13); // Style cho các dòng chi tiết
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
            if (reportType === 'customsearch_scv_vas_cntt_nt') {
                cellMap = [
                    { col: 'A', key: 'accnumber' },
                    { col: 'B', key: 'accname' },
                    { col: 'C', key: 'doituong' },
                    { col: 'D', key: 'sodudauno', isNumber: true },
                    { col: 'E', key: 'sodudauco', isNumber: true},
                    { col: 'F', key: 'phatsinhno', isNumber: true },
                    { col: 'G', key: 'phatsinhco', isNumber: true },
                    { col: 'H', key: 'soducuoino', isNumber: true },
                    { col: 'I', key: 'soducuoico', isNumber: true},
                ];
            } else if (reportType !== 'customsearch_scv_vas_cntt_nt' && currencyValue) {
                cellMap = [
                    { col: 'A', key: 'accnumber' },
                    { col: 'B', key: 'accname' },
                    { col: 'C', key: 'subsidiarynohierarchy' },
                    { col: 'D', key: 'sodudauno', isNumber: true },
                    { col: 'E', key: 'sodudaunovnd', isNumber: true},
                    { col: 'F', key: 'sodudauco', isNumber: true},
                    { col: 'G', key: 'sodudaucovnd' },
                    { col: 'H', key: 'phatsinhco', isNumber: true },
                    { col: 'I', key: 'phatsinhcovnd', isNumber: true },
                    { col: 'J', key: 'phatsinhno', isNumber: true },
                    { col: 'K', key: 'phatsinhnovnd', isNumber: true },
                    { col: 'L', key: 'soducuoico', isNumber: true },
                    { col: 'M', key: 'soducuoicovnd',  isNumber: true},
                    { col: 'N', key: 'soducuoino', isNumber: true},
                    { col: 'O', key: 'soducuoinovnd', isNumber: true},
                ];
            } else if (!currencyValue) {
                cellMap = [
                    { col: 'A', key: 'accnumber' },
                    { col: 'B', key: 'accname' },
                    { col: 'C', key: 'subsidiarynohierarchy' },
                    { col: 'D', key: 'sodudaunovnd' },
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
                cell.value = value ?? defaultValue ?? null;
                if (key === 'diengiai' && value) {
                    libCsXLS.updateRowHeight(currentSheet, value, 0, rowInsert, 35);
                } else if (key === 'doituong' && value) {
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

        return {
            pageInit: pageInit,
            refresh: refresh,
            searchReport: searchReport,
            exportReport: exportReport,
        };

    });
