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
            let params = getParam(currRecord);
            if(!params.custpage_fromdate || !params.custpage_todate) {
                alert('Vui lòng chọn ngày bắt đầu và ngày kết thúc!');
                return;
            }
            let urlDC = url.resolveScript({
                scriptId: 'customscript_scv_sl_cmms_nhancong_pxcd',
                deploymentId: 'customdeploy_scv_sl_cmms_nhancong_pxcd',
                params: params
            });
            window.location.replace(`${urlDC}&isSearch=T`);
        }
        
        const URL_RQ = '/app/site/hosting/scriptlet.nl?script=customscript_scv_sl_cmms_nhancong_pxcd&deploy=customdeploy_scv_sl_cmms_nhancong_pxcd';
        
        function exportReport() {
            window.onbeforeunload = null;
            let currRecord = currentRecord.get();
            let params = getParam(currRecord);
            if(!params.custpage_fromdate || !params.custpage_todate) {
                alert('Vui lòng chọn ngày bắt đầu và ngày kết thúc!');
                return;
            }
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
                let fromDate = currRecord.getValue('custpage_fromdate');
                let toDate = currRecord.getValue('custpage_todate');
                let {groupTeam, inforReport} = objDataCol;
                let {strLegalNameSub, strMainAddrSub} = inforReport;
                let year = fromDate.getFullYear();
                let month = fromDate.getMonth() + 1;
                
                let formattedFromDate = formatDateToDDMMYYYY(fromDate);
                let formattedToDate = formatDateToDDMMYYYY(toDate);
                workbook.removeWorksheet(1);
                updateSheetNKCV(workbook, objDataCol, strMainAddrSub, strLegalNameSub, formattedFromDate, formattedToDate, groupTeam);    // Sheet Nhật ký công việc
                updateSheetNgayCong(workbook, objDataCol, year, month, strMainAddrSub, strLegalNameSub, formattedFromDate, formattedToDate, groupTeam);    // Sheet Ngày công
                updateSheetNCCD(workbook, objDataCol, year, month, strMainAddrSub, strLegalNameSub, groupTeam);    // Sheet Nhân công cơ điện
                
                await libCsXLS.saveWorkbook(workbook, reportName + ".xlsx");
            } catch (error) {
                console.log("error", error);
            } finally {
                libCs.showLoadingDialog(false);
            }
        };
        
        const formatDateToDDMMYYYY = (date) => {
            let day = date.getDate().toString().padStart(2, "0");
            let month = (date.getMonth() + 1).toString().padStart(2, "0");
            let year = date.getFullYear();
            return `${day}/${month}/${year}`;
        }
        
        const updateSheetNKCV = (workbook, objDataCol, mainaddress_text, legalname, fromDate, toDate, groupTeam) => {
            let currentSheet = workbook.worksheets[1];
            let listData = objDataCol.listData;
            let startRow = 7;
            let colEnd = 'G';
            let endRow = startRow + listData.length - 1;
            updateHeaderNKCV(currentSheet, mainaddress_text, legalname, fromDate, toDate, groupTeam);
            updateSheetValuesNKCV(currentSheet, listData, startRow);
            applyBordersToSheetCells(currentSheet, startRow, endRow, colEnd);
        }
        
        const updateHeaderNKCV = (_currSheet, mainaddress_text, legalname, fromDate, toDate, groupTeam) => {
            libCsXLS.updMultiValueToCell(_currSheet, [
                {addressCell: 'A1', keys: '{congty}', values: legalname},
                {addressCell: 'A2', keys: '{diachi}', values: mainaddress_text},
                {addressCell: 'A5', keys: '{to}', values: groupTeam},
            ]);
            updateCellValueHeader(_currSheet, 'A4', `Từ ngày ${fromDate} đến ngày ${toDate}`);
            
            _currSheet.getCell('A1').font = fontSettings;
            _currSheet.getCell('A2').font = fontSettings;
            _currSheet.getCell('A5').font = fontSettings;
        }
        
        const fontSettings = {name: 'Times New Roman', size: 10, bold: true};
        
        const updateSheetNgayCong = (workbook, objDataCol, year, month, mainaddress_text, legalname, fromDate, toDate, groupTeam) => {
            let currentSheet = workbook.worksheets[2];
            let listDataBCC = objDataCol.listDataBCC;
            let startRow = 9;
            let endRow = startRow + listDataBCC.length - 1;
            updateHeaderNgayCong(currentSheet, year, month, mainaddress_text, legalname, fromDate, toDate, groupTeam);
            updateSheetValuesNgayCong(currentSheet, listDataBCC, startRow, year, month, endRow);
        }
        
        const updateHeaderNCCD = (_currSheet, mainaddress_text, legalname, year, month) => {
            libCsXLS.updMultiValueToCell(_currSheet, [
                {addressCell: 'A1', keys: '{congty}', values: legalname},
                {addressCell: 'A2', keys: '{diachi}', values: mainaddress_text},
                {addressCell: 'A4', keys: '{thangnam}', values: `Tháng ${month} năm ${year}`},
            ]);
            _currSheet.getCell('A1').font = fontSettings;
            _currSheet.getCell('A2').font = fontSettings;
            _currSheet.getCell('A4').font = fontSettings;
        }
        
        const updateSheetNCCD = (workbook, objDataCol, year, month, mainaddress_text, legalname) => {
            let currentSheet = workbook.worksheets[3];
            let listDataNCCD = objDataCol.listDataNCCD;
            let startRow = 7;
            let colEnd = 'F';
            let endRow = startRow + listDataNCCD.length;
            updateHeaderNCCD(currentSheet, mainaddress_text, legalname, year, month);
            updateSheetValuesNCCD(currentSheet, listDataNCCD, startRow, year, month);
            updateFooterNCCD(currentSheet, startRow, endRow);
            applyBordersToSheetCells(currentSheet, startRow, endRow, colEnd);
        }
        
        const updateSheetValuesNgayCong = (_currSheet, listDataBCC, startRow, year, month) => {
            let workDaysColumn;
            let daysInMonth = new Date(year, month, 0).getDate();
            let totalManhours = Array(daysInMonth).fill(0);
            let grandTotalManhours = 0;
            let grandTotalWorkDays = 0;
            
            listDataBCC.forEach((dataItem, rowIndex) => {
                let row = startRow + rowIndex;
                updateCellValue(_currSheet, `A${row}`, dataItem.empcode);
                updateCellValue(_currSheet, `B${row}`, dataItem.empname || '');
                
                for (let i = 1; i <= daysInMonth; i++) {
                    let key = `manhours${i}`;
                    let column = getColumnLetter(2 + i - 1);
                    let manhours = parseFloat(dataItem[key]) || 0;
                    updateCellValue(_currSheet, `${column}${row}`, manhours);
                    totalManhours[i - 1] += manhours;
                }
                
                let totalHoursColumn = getColumnLetter(2 + daysInMonth);
                workDaysColumn = getColumnLetter(3 + daysInMonth);
                
                let totalManhoursRow = parseFloat(dataItem.total_manhours) || 0;
                let totalWorkDaysRow = parseFloat(dataItem.ngay_cong) || 0;
                
                updateCellValue(_currSheet, `${totalHoursColumn}${row}`, totalManhoursRow);
                updateCellValue(_currSheet, `${workDaysColumn}${row}`, totalWorkDaysRow);
                
                // Cộng dồn tổng cho cả bảng
                grandTotalManhours += totalManhoursRow;
                grandTotalWorkDays += totalWorkDaysRow;
            });
            
            // Thêm dòng tổng cuối cùng
            let totalRow = startRow + listDataBCC.length;
            updateCellValueHeader(_currSheet, `A${totalRow}`, "Tổng cộng");
            updateCellValueHeader(_currSheet, `B${totalRow}`, "");
            
            for (let i = 1; i <= daysInMonth; i++) {
                let column = getColumnLetter(2 + i - 1);
                updateCellValueHeader(_currSheet, `${column}${totalRow}`, totalManhours[i - 1]);
            }
            
            let totalHoursColumn = getColumnLetter(2 + daysInMonth);
            let totalColumn = getColumnLetter(daysInMonth);
            workDaysColumn = getColumnLetter(3 + daysInMonth);
            updateCellValueHeader(_currSheet, `${totalHoursColumn}${totalRow}`, grandTotalManhours);
            updateCellValueHeader(_currSheet, `${workDaysColumn}${totalRow}`, grandTotalWorkDays);
            
            // Áp dụng viền cho bảng
            let startrow = 7;
            applyBordersToSheetCells(_currSheet, startrow, totalRow, workDaysColumn);
            
            updateCellValueHeader(_currSheet, `B${totalRow + 3}`, 'Người lập');
            // updateCellValue(_currSheet, `B${totalRow + 4}`, '(Ký, họ tên)');
            let cellB = _currSheet.getCell(`B${totalRow + 4}`);
            cellB.value = '(Ký, họ tên)';
            cellB.font = {
                name: 'Times New Roman',
                size: 10,
                italic: true
            };
            cellB.alignment = {
                vertical: 'middle',
                horizontal: 'center',
                wrapText: true
            };
            
            let cell2 = _currSheet.getCell(`${totalColumn}${totalRow + 2}`);
            cell2.value = 'Ngày ..... tháng ..... năm ..........';
            cell2.font = {
                name: 'Times New Roman',
                size: 10,
                italic: true // In nghiêng
            };
            cell2.alignment = {
                vertical: 'middle',
                horizontal: 'center',
                wrapText: true
            };
            let cell4 = _currSheet.getCell(`${totalColumn}${totalRow + 4}`);
            cell4.value = '(Ký, họ tên)';
            cell4.font = {
                name: 'Times New Roman',
                size: 10,
                italic: true // In nghiêng
            };
            cell4.alignment = {
                vertical: 'middle',
                horizontal: 'center',
                wrapText: true
            };
            // updateCellValue(_currSheet, `${totalColumn}${totalRow + 2}`, 'Ngày ..... tháng ..... năm ..........');
            updateCellValueHeader(_currSheet, `${totalColumn}${totalRow + 3}`, 'Kế toán trưởng');
            // updateCellValue(_currSheet, `${totalColumn}${totalRow + 4}`, '(Ký, họ tên)');
            libCsXLS.mergeCell(_currSheet, totalRow + 2, daysInMonth + 1, totalRow + 2, daysInMonth + 4);
            libCsXLS.mergeCell(_currSheet, totalRow + 3, daysInMonth + 1, totalRow + 3, daysInMonth + 4);
            libCsXLS.mergeCell(_currSheet, totalRow + 4, daysInMonth + 1, totalRow + 4, daysInMonth + 4);
            
        }
        
        const getColumnLetter = (colIndex) => {
            let letter = '';
            while (colIndex >= 0) {
                letter = String.fromCharCode((colIndex % 26) + 65) + letter;
                colIndex = Math.floor(colIndex / 26) - 1;
            }
            return letter;
        };
        
        
        const updateSheetValuesNKCV = (_currSheet, listData, startRow) => {
            listData.forEach((dataItem, rowIndex) => {
                let row = startRow + rowIndex;
                updateCellValueNKCV(_currSheet, `A${row}`, dataItem.date);
                updateCellValueNKCV(_currSheet, `B${row}`, dataItem.workcode || '');
                updateCellValueNKCV(_currSheet, `C${row}`, dataItem.workname || '');
                updateCellValueNKCV(_currSheet, `D${row}`, dataItem.empcode || '');
                updateCellValueNKCV(_currSheet, `E${row}`, dataItem.empname || '');
                updateCellValueNKCV(_currSheet, `F${row}`, dataItem.workdes || '');
                updateCellValueNKCV(_currSheet, `G${row}`, dataItem.manhours || '');
            });
        };

        const updateSheetValuesNCCD = (_currSheet, listData, startRow, year, month) => {
            let line = 0;
            let totalManhours = 0;
            let totalMandays = 0;

            for (let objData of listData) {
                let row = startRow + line;
                if (objData.isTeamLine) {
                    updateCellValueHeader(_currSheet, `A${row}`, "");
                    updateCellValueHeader(_currSheet, `B${row}`, "");
                    updateCellValueHeader(_currSheet, `C${row}`, `Nhật ký công việc tổ ${objData.team} - tháng ${month}.${year}`);
                    updateCellValueHeader(_currSheet, `D${row}`, objData.totalManhours || 0);
                    updateCellValueHeader(_currSheet, `E${row}`, objData.totalMandays || 0);
                    updateCellValueHeader(_currSheet, `F${row}`, "");
                } else {
                    updateCellValueNCCD(_currSheet, `A${row}`, objData.stt); // STT
                    updateCellValueNCCD(_currSheet, `B${row}`, objData.workcode || "");
                    updateCellValueNCCD(_currSheet, `C${row}`, objData.workname || "");
                    updateCellValueNCCD(_currSheet, `D${row}`, objData.manhours || 0);
                    updateCellValueNCCD(_currSheet, `E${row}`, objData.mandays || 0);
                    //updateCellValueNCCD(_currSheet, `F${row}`, objData.workdes || "");
                    totalManhours += parseFloat(objData.manhours) || 0;
                    totalMandays += parseFloat(objData.mandays) || 0;
                }
                line++;
            }
            
            let totalRow = startRow + line;
            updateCellValueHeader(_currSheet, `A${totalRow}`, "");
            updateCellValueHeader(_currSheet, `B${totalRow}`, "");
            updateCellValueHeader(_currSheet, `C${totalRow}`, "Tổng cộng");
            updateCellValueHeader(_currSheet, `D${totalRow}`, totalManhours);
            updateCellValueHeader(_currSheet, `E${totalRow}`, totalMandays);
            updateCellValueHeader(_currSheet, `F${totalRow}`, ""); // Không có mô tả
        };
        
        const updateFooterNCCD = (_currSheet, startRow, endRow) => {
            updateCellValueHeader(_currSheet, `A${endRow + 3}`, 'Người lập');
            let cellB = _currSheet.getCell(`A${endRow + 4}`);
            cellB.value = '(Ký, họ tên)';
            cellB.font = {
                name: 'Times New Roman',
                size: 10,
                italic: true
            };
            cellB.alignment = {
                vertical: 'middle',
                horizontal: 'center',
                wrapText: true
            };
            
            updateCellValueHeader(_currSheet, `C${endRow + 3}`, 'PX Cơ điện');
            let cellC = _currSheet.getCell(`C${endRow + 4}`);
            cellC.value = '(Ký, họ tên)';
            cellC.font = {
                name: 'Times New Roman',
                size: 10,
                italic: true
            };
            cellC.alignment = {
                vertical: 'middle',
                horizontal: 'center',
                wrapText: true
            };
            
            let cell2 = _currSheet.getCell(`D${endRow + 2}`);
            cell2.value = 'Ngày ..... tháng ..... năm ..........';
            cell2.font = {
                name: 'Times New Roman',
                size: 10,
                italic: true // In nghiêng
            };
            cell2.alignment = {
                vertical: 'middle',
                horizontal: 'center',
                wrapText: true
            };
            let cell4 = _currSheet.getCell(`D${endRow + 4}`);
            cell4.value = '(Ký, họ tên)';
            cell4.font = {
                name: 'Times New Roman',
                size: 10,
                italic: true // In nghiêng
            };
            cell4.alignment = {
                vertical: 'middle',
                horizontal: 'center',
                wrapText: true
            };
            updateCellValueHeader(_currSheet, `D${endRow + 3}`, 'Kế toán trưởng');
            libCsXLS.mergeCell(_currSheet, endRow + 3, 1, endRow + 3, 2);
            libCsXLS.mergeCell(_currSheet, endRow + 4, 1, endRow + 4, 2);
            libCsXLS.mergeCell(_currSheet, endRow + 2, 4, endRow + 2, 6);
            libCsXLS.mergeCell(_currSheet, endRow + 3, 4, endRow + 3, 6);
            libCsXLS.mergeCell(_currSheet, endRow + 4, 4, endRow + 4, 6);
        }
        
        const updateHeaderNgayCong = (_currSheet, year, month, mainaddress_text, legalname, fromDate, toDate, groupTeam) => {
            let column;
            libCsXLS.updMultiValueToCell(_currSheet, [
                {addressCell: 'A1', keys: '{congty}', values: legalname},
                {addressCell: 'A2', keys: '{diachi}', values: mainaddress_text},
                {addressCell: 'A5', keys: '{bophan}', values: groupTeam},
            ]);
            _currSheet.getCell('A1').font = fontSettings;
            _currSheet.getCell('A2').font = fontSettings;
            _currSheet.getCell('A5').font = fontSettings;
            updateCellValueHeader(_currSheet, 'A4', `Từ ngay ${fromDate} đến ngày ${toDate}`);
            updateCellValueHeader(_currSheet, 'A7', 'Mã nhân viên');
            updateCellValueHeader(_currSheet, 'B7', 'Tên nhân viên');
            updateCellValueHeader(_currSheet, 'C7', 'Số giờ làm việc/ngày');
            
            let daysInMonth = new Date(year, month, 0).getDate();
            for (let i = 1; i <= daysInMonth; i++) {
                column = getColumnLetter(2 + i - 1);
                updateCellValueHeader(_currSheet, `${column}8`, i || '');
                _currSheet.getColumn(column).width = 5;
            }
            
            let totalHoursColumn = getColumnLetter(2 + daysInMonth);
            let workDaysColumn = getColumnLetter(3 + daysInMonth);
            updateCellValueHeader(_currSheet, `${totalHoursColumn}7`, 'Tổng số giờ/tháng');
            updateCellValueHeader(_currSheet, `${workDaysColumn}7`, 'Ngày công');
            
            let totalHoursNumber = columnLetterToNumber(totalHoursColumn);
            let workDaysNumber = columnLetterToNumber(workDaysColumn);
            let columnMonthNumber = columnLetterToNumber(column);
            
            // Merge các ô
            libCsXLS.mergeCell(_currSheet, 7, 1, 8, 1);
            libCsXLS.mergeCell(_currSheet, 7, 2, 8, 2);
            libCsXLS.mergeCell(_currSheet, 7, 3, 7, columnMonthNumber);
            libCsXLS.mergeCell(_currSheet, 7, totalHoursNumber, 8, totalHoursNumber);
            libCsXLS.mergeCell(_currSheet, 7, workDaysNumber, 8, workDaysNumber);
        };
        
        const applyBordersToSheetCells = (_currSheet, startRow, endRow, colEnd) => {
            let startCol = 1;
            let endCol = columnLetterToNumber(colEnd);
            
            for (let row = startRow; row <= endRow; row++) {
                for (let col = startCol; col <= endCol; col++) {
                    let cellAddress = getColumnBoder(col) + row;
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
        
        const getColumnBoder = (colNumber) => {
            let column = '';
            while (colNumber > 0) {
                let remainder = (colNumber - 1) % 26;
                column = String.fromCharCode('A'.charCodeAt(0) + remainder) + column;
                colNumber = Math.floor((colNumber - 1) / 26);
            }
            return column;
        }
        
        const columnLetterToNumber = (column) => {
            let columnNumber = 0;
            for (let i = 0; i < column.length; i++) {
                columnNumber = columnNumber * 26 + (column.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
            }
            return columnNumber;
        }
        
        const updateCellValueNCCD = (sheet, cellAddress, value) => {
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
                case 'D':
                case 'E':
                    cell.alignment = {
                        vertical: 'middle',
                        horizontal: 'center',
                        wrapText: true
                    };
                    break;
                case 'C':
                case 'F':
                    cell.alignment = {
                        vertical: 'middle',
                        horizontal: 'left',
                        wrapText: true
                    };
                    break;
            }
        }
        
        const updateCellValueNKCV = (sheet, cellAddress, value) => {
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
                case 'D':
                case 'E':
                    cell.alignment = {
                        vertical: 'middle',
                        horizontal: 'center',
                        wrapText: true
                    };
                    break;
                case 'C':
                case 'F':
                    cell.alignment = {
                        vertical: 'middle',
                        horizontal: 'left',
                        wrapText: true
                    };
                    break;
                case 'G':
                    cell.alignment = {
                        vertical: 'middle',
                        horizontal: 'right',
                        wrapText: true
                    };
                    break;
            }
        }
        
        const updateCellValue = (sheet, cellAddress, value) => {
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
                    cell.alignment = {
                        vertical: 'middle',
                        horizontal: 'center',
                        wrapText: true
                    };
                    break;
                default:
                    cell.alignment = {
                        vertical: 'middle',
                        horizontal: 'center',
                        wrapText: true
                    };
                    break;
            }
        }
        
        const updateCellValueHeader = (sheet, cellAddress, value) => {
            let cell = sheet.getCell(cellAddress);
            cell.value = value;
            let column = cellAddress.charAt(0);
            cell.font = {
                name: 'Times New Roman',
                size: 10,
                bold: true
            };
            switch (column) {
                case 'A':
                case 'B':
                    cell.alignment = {
                        vertical: 'middle',
                        horizontal: 'center',
                        wrapText: true
                    };
                    break;
                default:
                    cell.alignment = {
                        vertical: 'middle',
                        horizontal: 'center',
                        wrapText: true
                    };
                    break;
            }
        }
        
        const getParam = (currentRecord) => {
            return {
                custpage_subsidiary: currentRecord.getValue('custpage_subsidiary'),
                custpage_fromdate: currentRecord.getText('custpage_fromdate'),
                custpage_todate: currentRecord.getText('custpage_todate'),
                custpage_department: currentRecord.getValue('custpage_department'),
                custpage_employee: currentRecord.getValue('custpage_employee'),
                custpage_workitem: currentRecord.getValue('custpage_workitem')
            }
        }
        
        return {
            onSearchResult: onSearchResult,
            exportReport: exportReport,
            fieldChanged: fieldChanged
        };
    });
