/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/url', '../lib/scv_lib_cs.js', '../lib/scv_lib_cs_xls'],
    
    function (currentRecord, url, libCs, libCsXLS) {
        
        function fieldChanged(scriptContext) {
        
        }
        
        function onSearchResult() {
            window.onbeforeunload = null;
            let currRecord = currentRecord.get();
            let urlDC = url.resolveScript({
                scriptId: 'customscript_scv_sl_rp_thongke_nhancong',
                deploymentId: 'customdeploy_scv_sl_rp_thongke_nhancong',
                params: getParam(currRecord)
            });
            window.location.replace(`${urlDC}&isSearch=T`);
        }
        
        const URL_RQ = '/app/site/hosting/scriptlet.nl?script=customscript_scv_sl_rp_thongke_nhancong&deploy=customdeploy_scv_sl_rp_thongke_nhancong';
        
        function exportReport() {
            window.onbeforeunload = null;
            let currRecord = currentRecord.get();
            let params = getParam(currRecord);
            params.isSearch = 'T';
            params.isgetdata = 'T';
            libCs.showLoadingDialog(true);
            
            let resCallData = nlapiRequestURL(URL_RQ, params);
            let objDataCol = JSON.parse(resCallData.getBody());
            let objDataConfig = JSON.parse(nlapiRequestURL(URL_RQ, {action: 'getUrlTemplate'}).getBody());
            try {
                exportExcel(params, currRecord, objDataConfig, objDataCol);
            } catch (error) {
                console.log("error", error)
                libCs.showLoadingDialog(false);
            }
        }
        
        const exportExcel = async (params, currRecord, objDataConfig, objDataCol) => {
            const reportName = 'Bảng thống kê nhân công';
            try {
                let workbook = await libCsXLS.loadWorkbookFromUrl(objDataConfig.urlTemplate);
                let listDataCMMS = objDataCol.listDataCMMS;
                let ngaytao = getNgaygioin()
                let fromdate = currRecord.getValue('custpage_fromdt');
                let todate = currRecord.getValue('custpage_todt');
                let workItemText = currRecord.getText('custpage_workitem');

                let fromMonth = fromdate ? fromdate.getMonth() + 1 : '';
                let toMonth = todate ? todate.getMonth() + 1 : '';
                let toYear = todate ? todate.getFullYear() : '';
                let currentSheet = workbook.worksheets[0];
                currentSheet.name = 'BANG THONG KE NHAN CONG';
                let startRow = 10;

                let totalHours = listDataCMMS.reduce((sum, item) => sum + (parseFloat(item.hours) || 0), 0);
                let totalMemo= listDataCMMS.reduce((sum, item) => sum + (parseFloat(item.memo) || 0), 0);
                let endRow = startRow + listDataCMMS.length - 1;
                updateSheetValues(currentSheet, listDataCMMS, startRow);
                applyBordersToSheetCells(currentSheet, endRow, startRow);
                updateFooter(currentSheet, endRow, ngaytao, fromMonth, toMonth, toYear, totalHours, totalMemo, workItemText);
                await libCsXLS.saveWorkbook(workbook, reportName + ".xlsx");
            } catch (error) {
                console.log("error", error);
            } finally {
                libCs.showLoadingDialog(false);
            }
        };
        
        const updateSheetValues = (_currSheet, rsData, startRow) => {
            let stt = 1;
            rsData.forEach((dataItem, rowIndex) => {
                let row = startRow + rowIndex;
                let formattedHours = parseFloat(dataItem.hours || 0).toFixed(2);
                let formattedMemo = parseFloat(dataItem.memo || 0).toFixed(2);

                updateCellValue(_currSheet, `A${row}`, dataItem.date);
                updateCellValue(_currSheet, `B${row}`, dataItem.code || '');
                updateCellValue(_currSheet, `C${row}`, dataItem.name || '');
                updateCellValue(_currSheet, `D${row}`, dataItem.work || '');
                updateCellValue(_currSheet, `E${row}`, formattedHours || '');
                updateCellValue(_currSheet, `F${row}`,  '');
                stt++;
            });
        };
        
        function applyBordersToSheetCells(_currSheet, endRow, startRow) {
            for (let row = startRow; row <= endRow; row++) {
                for (let col = 'A'.charCodeAt(0); col <= 'F'.charCodeAt(0); col++) {
                    let cellAddress = String.fromCharCode(col) + row;
                    let cell = _currSheet.getCell(cellAddress);
                    cell.border = {
                        top: {style: 'thin', color: {argb: 'FF000000'}},
                        left: {style: 'thin', color: {argb: 'FF000000'}},
                        bottom: {style: 'thin', color: {argb: 'FF000000'}},
                        right: {style: 'thin', color: {argb: 'FF000000'}}
                    };
                }
            }
        }
        
        const updateFooter = (_currSheet, endRow, ngaytao, fromMonth, toMonth, toYear, totalHours, totalMemo, workItemText) => {
            // updateCellValue(_currSheet, `A${endRow + 1}`, 'Nhân công dự kiến (giờ)');
            // updateCellValue(_currSheet, `E${endRow + 1}`, totalHours);
            // updateCellValue(_currSheet, `F${endRow + 1}`, 'công');
            updateCellValue(_currSheet, `A${endRow + 2}`, "Nhân công thực hiện (giờ)");
            updateCellValue(_currSheet, `E${endRow + 2}`, totalHours);
            updateCellValue(_currSheet, `F${endRow + 2}`, (totalHours/8).toFixed(2) + ' ' +'công');
            updateCellValue(_currSheet, `A${endRow + 4}`, ngaytao.trandate);
            updateCellValue(_currSheet, `A${endRow + 6}`, 'Người lập');
            updateCellValue(_currSheet, `C${endRow + 6}`, 'PXCĐ');
            updateCellValue(_currSheet, `D${endRow + 6}`, 'P.Nhân sự');
            updateCellValue(_currSheet, `E${endRow + 6}`, 'Phê duyệt');
            let value = `Từ tháng ${fromMonth} đến tháng ${toMonth} năm ${toYear}`;
            updateCellValue(_currSheet, 'C5', value);
            updateCellValue(_currSheet, 'C6', `Hạng mục ${workItemText}`);
            
            setCellStyle(_currSheet, 'C5', true, true, true, false);
            setCellStyle(_currSheet, 'C6', true, false, true, false);
            libCsXLS.mergeCell(_currSheet, endRow + 1, 1, endRow + 1, 4);
            libCsXLS.mergeCell(_currSheet, endRow + 2, 1, endRow + 2, 4);
            libCsXLS.mergeCell(_currSheet, endRow + 6, 1, endRow + 6, 2);
            libCsXLS.mergeCell(_currSheet, endRow + 6, 5, endRow + 6, 6);
            libCsXLS.mergeCell(_currSheet, endRow + 4, 1, endRow + 4, 4);
            
            setCellStyle(_currSheet, `A${endRow + 1}`, true, false, true, true);
            setCellStyle(_currSheet, `E${endRow + 1}`, true, false, true, true);
            setCellStyle(_currSheet, `F${endRow + 1}`, true, false, false, true);
            setCellStyle(_currSheet, `A${endRow + 2}`, true, false, true, true);
            setCellStyle(_currSheet, `E${endRow + 2}`, true, false, true, true);
            setCellStyle(_currSheet, `F${endRow + 2}`, true, false, false, true);
            setCellStyle(_currSheet, `A${endRow + 4}`, false, true, false, false);
            setCellStyle(_currSheet, `A${endRow + 6}`, true, false, true, false);
            setCellStyle(_currSheet, `C${endRow + 6}`, true, false, true, false);
            setCellStyle(_currSheet, `D${endRow + 6}`, true, false, true, false);
            setCellStyle(_currSheet, `E${endRow + 6}`, true, false, true, false);
        };
        
        function setCellStyle(sheet, cellAddress, isBold = false, isItalic = false, isCentered = false, isBorder = false) {
            let cell = sheet.getCell(cellAddress);
            cell.font = {
                bold: isBold,
                italic: isItalic,
                name: 'Times New Roman',
                size: 10
            };
            if (isCentered) {
                cell.alignment = {vertical: 'middle', horizontal: 'center'};
            } else {
                cell.alignment = {vertical: 'middle', horizontal: 'left'};
            }
            if (isBorder) {
                cell.border = {
                    top: {style: 'thin', color: {argb: 'FF000000'}},
                    left: {style: 'thin', color: {argb: 'FF000000'}},
                    bottom: {style: 'thin', color: {argb: 'FF000000'}},
                    right: {style: 'thin', color: {argb: 'FF000000'}}
                };
            }
        }
        
        function updateCellValue(sheet, cellAddress, value) {
            let cell = sheet.getCell(cellAddress);
            cell.value = value;
            let column = cellAddress.charAt(0);
            cell.font = {
                name: 'Times New Roman',
                size: 10
            };
            switch (column) {
                case 'A':
                case 'B':
                case 'C':
                case 'E':
                    cell.alignment = {
                        vertical: 'middle',
                        horizontal: 'center',
                        wrapText: true
                    };
                    break;
                case 'D':
                case 'F':
                    cell.alignment = {
                        vertical: 'middle',
                        horizontal: 'left',
                        wrapText: true
                    };
                    break;
                default:
                    cell.alignment = {
                        vertical: 'middle',
                        horizontal: 'right',
                        wrapText: true
                    };
                    break;
            }
        }
        
        function getParam(currentRecord) {
            return {
                custpage_fromdt: currentRecord.getText('custpage_fromdt'),
                custpage_todt: currentRecord.getText('custpage_todt'),
                custpage_subsidiary: currentRecord.getValue('custpage_subsidiary'),
                custpage_department: currentRecord.getValue('custpage_department'),
                custpage_employee: currentRecord.getValue('custpage_employee'),
                custpage_workitem: currentRecord.getValue('custpage_workitem'),
            }
        }
        
        function getNgaygioin() {
            let today = new Date();
            let timezoneOffset = today.getTimezoneOffset() / 60;
            today.setHours(today.getHours() + timezoneOffset + 7);
            let dd_now = String(today.getDate()).padStart(2, '0');
            let mm_now = String(today.getMonth() + 1).padStart(2, '0');
            let yyyy_now = today.getFullYear();
            let trandate = 'Ngày ' + dd_now + ' tháng ' + mm_now + ' năm ' + yyyy_now;
            return {trandate};
        }
        
        return {
            onSearchResult: onSearchResult,
            exportReport: exportReport,
            fieldChanged: fieldChanged,
            
        };
    });
