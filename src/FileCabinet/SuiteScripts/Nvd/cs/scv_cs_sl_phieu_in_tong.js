/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/record', 'N/search', 'N/url', '../common/scv_common_excel_helper', '../lib/scv_lib_cs_xls.js'],
    (ccr, record, search, url, excelHelper, libCsXLS) => {

        //đặt const do không lấy được label trực tiếp của field sublist trên cs
        const LABELS_SUBLIST_FIELD_YCDC = {
            'Internal ID': 'custpage_col_0',
            'Chọn': 'custpage_col_1',
            'Chi nhánh': 'custpage_col_2',
            'Kho xuất': 'custpage_col_3',
            'Kho nhập': 'custpage_col_4',
            'Tên người tạo': 'custpage_col_5',
            'Số chứng từ': 'custpage_col_6',
            'Ngày giao dịch': 'custpage_col_7',
            'Loại điều chuyển': 'custpage_col_8'
        }

        const LABELS_SUBLIST_FIELD_LXH = {
            'Internal ID': 'custpage_col_0',
            'Chọn': 'custpage_col_1',
            'Số ITF': 'custpage_col_2',
            'Căn cứ vào đơn số': 'custpage_col_3',
            'Khách hàng': 'custpage_col_4',
            'Ngày giao dịch': 'custpage_col_5',
            'Địa chỉ giao hàng': 'custpage_col_6',
            'Người nhận hàng': 'custpage_col_7',
            'Điện thoại': 'custpage_col_8'
        }

        const LABELS_SUBLIST_FIELD_PXK = {
            'Internal ID': 'custpage_col_0',
            'Chọn': 'custpage_col_1',
            'Tạo từ': 'custpage_col_3',
            'Kho xuất': 'custpage_col_8',
        }

        const LABELS_SUBLIST_FIELD_PNK = {
            'Internal ID': 'custpage_col_0',
            'Chọn': 'custpage_col_1',
            'Tạo từ': 'custpage_col_3',
            'Kho nhập': 'custpage_col_5',
        }

        const LABELS_SUBLIST_FIELD_PXB = {
            'Internal ID': 'custpage_col_0',
            'Chọn': 'custpage_col_1',
            'Công Ty': 'custpage_col_2',
            'Số đơn hàng': 'custpage_col_4',
        }

        const pageInit = (context) => {
        }

        const refreshForm = () => {
            let urlDC = getUrlSuiteLet();
            window.location.replace(urlDC);
        }

        const searchData = () => {
            if (checkDateFields()) {
                let params = getObjParams();
                params.isrun = 'T';
                let urlDC = getUrlSuiteLet(params);
                window.location.replace(urlDC);
            }
        }

        let URL_RQ = '/app/site/hosting/scriptlet.nl?script=customscript_scv_sl_phieu_in_tong&deploy=customdeploy_scv_sl_phieu_in_tong';
        const onExport = async (exportType) => {
            window.onbeforeunload = null;
            let selectedTransactions = getSelectedLines();
            let arrInternalIds = selectedTransactions.arrInternalId
            let arrSelectedTranLines = selectedTransactions.arrTranLines;
            if (arrInternalIds.length === 0) {
                alert("Bạn chưa chọn dữ liệu để thực thi!!!");
                return false;
            } else {
                if (!isFulfillExportRequirements(arrSelectedTranLines)) {
                    return false;
                }
                let params = getObjParams();
                params.arrInternalId = arrInternalIds.join(',');
                params.arrSelectedTranLines = encodeURIComponent(JSON.stringify(arrSelectedTranLines))
                params.isexport = 'T';
                params.export_type = exportType;
                let suiteletUrl = getUrlSuiteLet(params);

                if (exportType.startsWith("PDF")) {
                    excelHelper.showLoadingDialog(true);
                    let pdfParams = getObjParams();
                    pdfParams.arrInternalId = arrInternalIds.join(',');
                    pdfParams.isexport = 'T';
                    pdfParams.export_type = exportType;
                    pdfParams.arrSelectedTranLines = arrSelectedTranLines;
                    postToSuitelet(pdfParams);

                    setTimeout(() => excelHelper.showLoadingDialog(false), 3000);

                } else if (exportType.startsWith("EXCEL")) {
                    try {
                        excelHelper.showLoadingDialog(true);
                        let urlDC = getUrlSuiteLet(params);
                        let resCallData = nlapiRequestURL(URL_RQ, params);
                        let objResponse = JSON.parse(resCallData.getBody());

                        // let objResponse = await excelHelper.postRequestByAjax(urlDC, {});
                        if (objResponse.templatetype === 'excel') {
                            let workbook = await excelHelper.loadWorkbookFromUrl(objResponse.url);
                            let arrData = objResponse.arrData;
                            let fileName = objResponse.filename;
                            if (objResponse.type === 'ACP' && arrData.length > 0) {
                                let logoBase64 = objResponse.logoBase64;
                                await handleMultiSheetAcpExport(workbook, arrData, objResponse.colId, exportType, logoBase64);
                            } else {
                                let curSheet = workbook.worksheets[0];
                                excelHelper.replaceValueColumn(curSheet, objResponse.mappedData);
                                excelHelper.insertValueTable({
                                    curSheet: curSheet,
                                    arrData: arrData,
                                    colId: objResponse.colId,
                                    idxSourceRow: objResponse.idxSourceRow,
                                    idxRowData: objResponse.idxRowData
                                });
                            }
                            await excelHelper.saveWorkbook(workbook, fileName);
                        }
                        excelHelper.showLoadingDialog(false);
                    } catch (error) {
                        alert(error.message.toString());
                        excelHelper.showLoadingDialog(false);
                    }
                }
            }
        }

        function handleMultiSheetAcpExport(workbook, arrData, colId, exportType, logoBase64) {
            if (!arrData || arrData.length === 0) {
                return;
            }

            let logoImageId = null;
            if (logoBase64) {
                try {
                    logoImageId = workbook.addImage({
                        base64: logoBase64,
                        extension: 'png',
                    });
                } catch (e) {
                    console.error("Không thể thêm logo vào workbook.", e);
                    logoImageId = null;
                }
            }

            const templateSheet = workbook.worksheets[0];
            let cellMapping = {};

            if (exportType === 'EXCEL_ACP_NO_LOT') {
                cellMapping = {
                    ngayNhap: 'B2',
                    maNhom: 'B3',
                    tenGoi: 'B4',
                    seri: 'B5',
                    lo: 'B6',
                    tlTinh: 'B7',
                    tlLoi: 'B9',
                    tinhTrangNhom: 'B11',
                    nguoiLap: 'G15',
                    tpBoPhan: 'H15',
                };
            } else {
                cellMapping = {
                    tenGoi: 'A2',
                    seri: 'A4',
                    // tlTinh: 'C4',
                    tlLoi: 'E4',
                    lo: 'G4',
                    nguoiLap: 'A6',
                    tpBoPhan: 'E6',
                };
            }

            arrData.forEach((dataLine, index) => {
                let currentSheet;
                const sheetName = (dataLine.tranid || `Label_${index + 1}`)
                    .replace(/[\*\?\/\\\[\]]/g, '-')
                    .substring(0, 31);

                if (index === 0) {
                    currentSheet = templateSheet;
                    currentSheet.name = sheetName;
                } else {
                    currentSheet = workbook.addWorksheet(sheetName);
                    cloneSheetLayout(currentSheet, templateSheet);
                }

                // if (logoImageId) {
                    currentSheet.addImage(logoImageId, {
                        tl: { col: 0, row: 0 },
                        ext: { width: 130, height: 80 }
                    });
                // }

                for (const key in cellMapping) {
                    if (dataLine.hasOwnProperty(key)) {
                        const cellAddress = cellMapping[key];
                        const cell = currentSheet.getCell(cellAddress);
                        if (cell) {
                            cell.value = dataLine[key];
                        }
                    }
                    const tlTinh = parseFloat(dataLine.tlTinh) || 0;
                    const tlLoi = parseFloat(dataLine.tlLoi) || 0;

                    if (exportType === 'EXCEL_ACP_NO_LOT') {
                        const tongTrongLuong = tlTinh + tlLoi;

                        const cellB10 = currentSheet.getCell('B10');
                        if (cellB10) {
                            cellB10.value = tongTrongLuong;
                        }
                        const cellB7 = currentSheet.getCell('B7');
                        if (cellB7) {
                            cellB7.value = tlTinh;
                        }
                    } else {
                        const cellC4 = currentSheet.getCell('C4');
                        if (cellC4) {
                            cellC4.value = tlTinh;
                        }
                    }


                }
            });

            if (arrData.length === 0) {
                workbook.removeWorksheet(templateSheet.id);
            }
        }

        function cloneSheetLayout(newSheet, templateSheet) {
            templateSheet.columns.forEach((column, index) => {
                const newColumn = newSheet.getColumn(index + 1);
                newColumn.width = column.width;
            });

            templateSheet.model.merges.forEach(merge => {
                newSheet.mergeCells(merge);
            });

            templateSheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
                const newRow = newSheet.getRow(rowNumber);
                newRow.height = row.height;
                row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                    const newCell = newRow.getCell(colNumber);
                    newCell.value = cell.value;
                    newCell.style = JSON.parse(JSON.stringify(cell.style));
                });
            });
        }

        function postToSuitelet(params) {
            let suiteletUrl = getUrlSuiteLet({});
            let form = document.createElement('form');
            form.method = 'POST';
            form.action = suiteletUrl;
            form.target = '_blank';

            for (const key in params) {
                if (params.hasOwnProperty(key)) {
                    let input = document.createElement('input');
                    input.type = 'hidden';
                    input.name = key;
                    if (key === 'arrSelectedTranLines') {
                        input.value = JSON.stringify(params[key]);
                    } else {
                        input.value = params[key];
                    }
                    form.appendChild(input);
                }
            }

            document.body.appendChild(form);
            form.submit();
            document.body.removeChild(form);
        }

        const mergeAndAlign = (sheet, startRow, startCol, endRow, endCol, alignment = {}) => {
            libCsXLS.mergeCell(sheet, startRow, startCol, endRow, endCol);
            const cell = sheet.getCell(startRow, startCol);
            cell.alignment = {
                wrapText: true,
                vertical: 'top',
                horizontal: 'left',
                ...alignment, // cho phép tuỳ chỉnh nếu cần
            };
        };

        const doMergeCell = (curSheet) => {
            mergeAndAlign(curSheet, 4, 1, 4, 8);
            // mergeAndAlign(curSheet, 22, 1, 22, 3);
        };

        const getSelectedLines = () => {
            let currRecord = ccr.get();
            let arrInternalId = [];
            let arrTranLines = [];
            for (let i = 0; i < currRecord.getLineCount("custpage_sl_result"); i++) {
                let checkField = currRecord.getSublistValue("custpage_sl_result", "custpage_col_1", i);
                if (checkField === "F" || !checkField) continue;
                arrInternalId.push(currRecord.getSublistValue("custpage_sl_result", 'custpage_col_0', i));
                arrTranLines.push({
                    custpage_col_0: currRecord.getSublistValue("custpage_sl_result", 'custpage_col_0', i) || null,
                    custpage_col_2: currRecord.getSublistValue("custpage_sl_result", 'custpage_col_2', i) || null,
                    custpage_col_3: currRecord.getSublistValue("custpage_sl_result", 'custpage_col_3', i) || null,
                    custpage_col_4: currRecord.getSublistValue("custpage_sl_result", 'custpage_col_4', i) || null,
                    custpage_col_5: currRecord.getSublistValue("custpage_sl_result", 'custpage_col_5', i) || null,
                    custpage_col_6: currRecord.getSublistValue("custpage_sl_result", 'custpage_col_6', i) || null,
                    custpage_col_7: currRecord.getSublistValue("custpage_sl_result", 'custpage_col_7', i) || null,
                    custpage_col_8: currRecord.getSublistValue("custpage_sl_result", 'custpage_col_8', i) || null
                });
            }
            return {
                arrInternalId,
                arrTranLines
            };
        }

        const getUrlSuiteLet = (params = {}) => {
            return url.resolveScript({
                scriptId: 'customscript_scv_sl_phieu_in_tong',
                deploymentId: 'customdeploy_scv_sl_phieu_in_tong',
                params: params,
                returnExternalUrl: false
            });
        }

        const getObjParams = () => {
            let currentRecord = ccr.get();
            return {
                select_field: currentRecord.getValue('select_field'),
                custpage_fromdate: currentRecord.getText('custpage_fromdate'),
                custpage_todate: currentRecord.getText('custpage_todate'),
                custpage_kho_nhap: currentRecord.getValue('custpage_kho_nhap').join(','),
                custpage_kho_xuat: currentRecord.getValue('custpage_kho_xuat').join(','),
                custpage_so: currentRecord.getValue('custpage_so').join(','),
                custpage_po: currentRecord.getValue('custpage_po').join(','),
                custpage_to: currentRecord.getValue('custpage_to').join(','),
            };
        }

        const isFulfillExportRequirements = (arrSelectedTranLines) => {
            let currentRecord = ccr.get();
            let textSelectField = currentRecord.getText('select_field')
            // if (textSelectField === 'Phiếu yêu cầu điều chuyển in tổng') {
            //     // check dòng cần cùng kho xuất, kho nhập, loại điều chuyển, các check bên dưới tương tự
            //     return checkFieldGrouping(arrSelectedTranLines, LABELS_SUBLIST_FIELD_YCDC, ['Loại điều chuyển']);
            // } else if (textSelectField === 'Phiếu xuất kho in tổng') {
            //     // return checkFieldGrouping(arrSelectedTranLines, LABELS_SUBLIST_FIELD_PXK, ['Kho xuất']);
            // } else if (textSelectField === 'Phiếu nhập kho in tổng') {
            //     return checkFieldGrouping(arrSelectedTranLines, LABELS_SUBLIST_FIELD_PNK, ['Kho nhập']);
            // } else if (textSelectField === 'Phiếu xuất bán không giá in tổng' || textSelectField === 'Phiếu xuất bán có giá in tổng') {
            //     return checkFieldGrouping(arrSelectedTranLines, LABELS_SUBLIST_FIELD_PXB, ['Công Ty']);
            // } else if (textSelectField === 'Phiếu lệnh xuất hàng in tổng') {
            //     // return checkFieldGrouping(arrSelectedTranLines, LABELS_SUBLIST_FIELD_LXH, ['Căn cứ vào đơn số']);
            // }
            if (textSelectField === 'Phiếu LXH MBNB') {
                return true; // Luôn cho phép xuất nếu là LXH MBNB
            }
            return true;
        }

        const checkFieldGrouping = (arrSelectedTranLines, labels, arrFields) => {
            let firstLine = arrSelectedTranLines[0];
            // loop qua từng line
            for (let i = 1; i < arrSelectedTranLines.length; i++) {
                // loop qua từng field cần check trên line đó, so sánh nó với line đầu tiên
                for (let j = 0; j < arrFields.length; j++) {
                    if (firstLine[labels[arrFields[j]]] !== arrSelectedTranLines[i][labels[arrFields[j]]]) {
                        alert(`Bạn phải chọn các dòng có cùng cột '${arrFields[j]}' để xuất dữ liệu!!!`);
                        return false;
                    }
                }
            }
            return true;
        }

        const checkDateFields = () => {
            let currentRecord = ccr.get();
            let fromDate = currentRecord.getValue('custpage_fromdate');
            let toDate = currentRecord.getValue('custpage_todate');
            if (!fromDate || !toDate) {
                alert("Bạn chưa chọn khoảng thời gian để xuất dữ liệu!!!");
                return false;
            }
            return true;
        }

        return {
            refreshForm,
            searchData,
            pageInit,
            onExport,
        };
    });