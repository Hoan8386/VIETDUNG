/**
 * @NApiVersion 2.1
 */
define([],

    () => {

         // hàm hoàn chỉnh
        // v dụ cách dùng
        // let workbook = await libCsXLS.loadWorkbookFromUrl(urlTemplate);
        //                 let templateSheet = workbook.worksheets[0];
        //                 templateSheet.name = libUtils.removeVietnameseTones('PHIEU DONG GOI').slice(0, 31);
        //                 Object.values(data).forEach((packageData, index) => {
        //                     let sanitizedSheetName = "Sheet" + index;
        //                     let _currSheet = fnCloneSheet(workbook, 1, sanitizedSheetName);
        //                     updateHeaderPDG(_currSheet, packageData)
        //                 });
        //                 workbook.removeWorksheet(1);
        //                 await libCsXLS.saveWorkbook(workbook, reportName + ".xlsx");

        const fnCloneSheet = (workbook, indexSheet, nameSheet) => {
            const sheetToClone = workbook.getWorksheet(indexSheet);
            const cloneSheet = workbook.addWorksheet(nameSheet);
            cloneSheet.model = sheetToClone.model

            // 1️⃣ Copy columns (widths, keys, styles if any)
            sheetToClone.columns.forEach((col, i) => {
                const newCol = cloneSheet.getColumn(i + 1);
                newCol.width = col.width;
                newCol.hidden = col.hidden;
                newCol.style = { ...col.style };
            });

            // 2️⃣ Copy rows (height, cell values, and styles)
            sheetToClone.eachRow({ includeEmpty: true }, (row, rowNumber) => {
                const newRow = cloneSheet.getRow(rowNumber);
                newRow.height = row.height;
                row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                    const newCell = newRow.getCell(colNumber);
                    newCell.value = cell.value;
                    newCell.style = { ...cell.style };
                });
            });

            // 3️⃣ Copy merged cells
            sheetToClone.model.merges.forEach(range => {
                cloneSheet.mergeCells(range);
            });

            // 4️⃣ Copy page setup and properties
            cloneSheet.pageSetup = { ...sheetToClone.pageSetup };
            cloneSheet.properties = { ...sheetToClone.properties };
            cloneSheet.views = JSON.parse(JSON.stringify(sheetToClone.views || []));

            return cloneSheet;
        };

         const cloneSheet = (workbook, arrData, sheetRuleName, imageId = null) => {
             // tạo form mới
             // ví dụ có thể truyền vào arrData là một mảng các object, mỗi object là một sheet mới
             // imageId là id của hình ảnh đã được thêm vào workbook trước đó
             // objData.imagebase64 = base64 của hình ảnh, nếu có thì sẽ thêm vào sheet mới ( file.load().getContents() trả về base64 của file )
             // const myBase64Image = objData.imagebase64;
             // const imageId = workbook.addImage({
             //     base64:    myBase64Image,
             //     extension: 'png',
             // });
             let firstSheet = workbook.worksheets[0];

             for (let i = 1; i < arrData.length; i++){
                 let curSheet = workbook.addWorksheet(`${sheetRuleName} ${i + 1}`);
                 curSheet.pageSetup = { ...firstSheet.pageSetup };

                 // nếu có image được truyền vào ()
                 if(imageId) {
                     curSheet.addImage(imageId, {
                         tl: {col: 0.5, row: 0}, // Top-left corner
                         br: {col: 1.5, row: 1}, // Bottom-right corner
                     });
                 }

                 firstSheet.columns.forEach((col, index) => {
                     curSheet.getColumn(index + 1).width = col.width;
                 });

                 firstSheet.model.merges.forEach((mergeRange) => {
                     curSheet.mergeCells(mergeRange);
                 });

                 // Copy rows from template
                 firstSheet.eachRow({includeEmpty: true}, (row, rowNumber) => {
                     let newRow = curSheet.getRow(rowNumber)
                     newRow.height = row.height; // row height
                     row.eachCell({includeEmpty: true}, (cell, colNumber) => {
                         let newCell = newRow.getCell(colNumber);
                         newCell.value = cell.value;

                         // Optional: Copy styles if needed
                         if (cell.style) {
                             newCell.style = {...cell.style};
                         }
                     });
                     newRow.commit();
                 });
             }
         }

         const addHeaderLine = (cells, height, params) => {
             let curSheet = params.curSheet;
             let idxSourceRow = params.idxRow;
             let row = curSheet.getRow(idxSourceRow);
             row.height = height;
             for(let i = 0; i < cells.length; i++) {
                 let cell = row.getCell(i + 1);

                 cell.value = cells[i].value;
                 cell.style = cells[i].style || cell.style;
             }
         }

        // column trong bảng phải tuongwn ứng với bên ngoài, nếu trong bảng có cột merge phải tự xử lý the yêu cầu
        const insertValueTable = (params) => {
            let curSheet = params.curSheet;
            let idxSourceRow = params.idxSourceRow;
            let idxRowData = params.idxRowData;
            let arrData = params.arrData;
            let rowSrc = curSheet.getRow(idxSourceRow);
            let arrLength = arrData.length;
            if (arrLength === 0) {
                let obj = {}
                params.colId.forEach(col => {
                    obj[col] = '';
                })
                arrData.push(obj);
                arrLength = 1;
            }
            for (let i = 0; i < arrLength; i++) {
                let dataRow = getValueRow(arrData[i], params.colId);
                let newRow = curSheet.insertRow(idxRowData, dataRow);
                newRow.height = rowSrc.height;
                newRow.eachCell((cell, colNumber) => {
                    cell.style = {...rowSrc.getCell(colNumber).style};
                    if ( !isNaN(Number(cell.value)) && colNumber !== 1) {
                        cell.alignment = {horizontal: 'right', vertical: 'middle'};
                        cell.numFmt = '#,##0';
                    }
                    if (isFloat(cell.value) && colNumber !== 1) {
                        cell.alignment = {horizontal: 'right', vertical: 'middle'};
                        cell.numFmt = '#,##0.00';
                    }
                    // cell.value= cell.value
                });

                idxRowData += 1;
            }
            curSheet.spliceRows(idxSourceRow, 1);
            syncRangeMergeAfterInsertRow(curSheet, idxSourceRow, arrLength - 1);
            return idxRowData - 1;
        }

        const getPositionCell = (worksheet, position) => {
            let objPos = {row: 1, col: 1, address: "A1"};

            if (typeof position == "string") {
                objPos.address = position.toUpperCase();

                let cell_start = worksheet.getCell(objPos.address);

                objPos.row = cell_start.row;
                objPos.col = cell_start.col;
            } else if (typeof position == "object") {
                objPos.row = position.row || 1;
                objPos.col = position.col || 1;

                let cell_start = worksheet.getCell(objPos.row, objPos.col);

                objPos.address = cell_start._address;
            }

            return objPos;
        }

        const syncRangeMergeAfterInsertRow = (worksheet, rowStartInsert, numLineInserted) => {
            let arrRangeMerge = worksheet.model.merges;
            let arrRangeMergeFinal = [];
            for (let i = 0; i < arrRangeMerge.length; i++) {
                let address_range = arrRangeMerge[i];
                let address_cell_start = getPositionCell(worksheet, address_range.split(":")[0]);
                let address_cell_end = getPositionCell(worksheet, address_range.split(":")[1]);

                if (address_cell_start.row >= rowStartInsert) {
                    worksheet.unMergeCells(address_range);

                    arrRangeMergeFinal.push({
                        row_start: address_cell_start.row + numLineInserted,
                        col_start: address_cell_start.col,
                        row_end: address_cell_end.row + numLineInserted,
                        col_end: address_cell_end.col
                    })

                }
            }

            for (let i = 0; i < arrRangeMergeFinal.length; i++) {
                let objRangeMerge = arrRangeMergeFinal[i];
                worksheet.mergeCells(objRangeMerge.row_start, objRangeMerge.col_start, objRangeMerge.row_end, objRangeMerge.col_end);
            }
        }

        //
        const getValueRow = (objData, arrHeader) => {
            let arrResult = [];
            arrHeader.forEach(col => {
                arrResult.push(objData[col])
            })
            return arrResult;
        }

        // replace các giá trị độc lập trong file excel
        // đầu vào là một object có dạng {cellRef: {key1: value1, key2: value2, ...}, ...}
        const replaceValueColumn = (curSheet, objCellReplace) => {
            try {
                for (let cellRef in objCellReplace) {
                    let cell = curSheet.getCell(cellRef);
                    if (cell) {
                        let objData = objCellReplace[cellRef];
                        for (let key in objData) {
                            let vla = objData[key] || '';
                            if (key === 'all') {
                                cell.value = vla;
                                if (!isNaN(Number(cell.value))) {
                                    cell.alignment = {horizontal: 'right', vertical: 'middle'};
                                    cell.numFmt = '#,###';
                                }
                            } else {
                                if (cell.value.richText?.length > 0) {
                                    for (let i = 0; i < cell.value.richText.length; i++) {
                                        cell.value.richText[i].text = cell.value.richText[i].text.replaceAll(`{${key}}`, vla);
                                    }
                                } else {
                                    cell.value = cell.value.replaceAll(`{${key}}`, vla);
                                    if (!!Number(cell.value)) {
                                        cell.alignment = {horizontal: 'right', vertical: 'middle'};
                                        cell.numFmt = '#,###';
                                        cell.value  = Number(vla);
                                    }
                                }
                            }
                        }
                    }
                }
            } catch (error) {
                console.log("error - replaceValueColumn", error)
            }
        }

        const putValueCell = (orgData, objData) => {
            return new Function('data', `with(data) { return \`${orgData}\`; }`)(objData)
        }

        // điều chỉnh chiều cao của dòng dựa vào độ dài của giá trị trong ô, ý tưởng tốt, thực thi không ổn,
        // vì không thể tính toán chính xác chiều cao của dòng trong excel, trừ các dòng lớn , có merge và không cần
        // đồng nhất giữa các line
        const adjustRowHeight = (curSheet, cellValue, rowIndex, extraHeightPer100Chars = 16) => {
            let cell = curSheet.getCell(`A${rowIndex}`);
            let textLength = cellValue.length;
            let numExtraLines = Math.ceil(textLength / 100);
            let newHeight1 = numExtraLines * extraHeightPer100Chars;
            curSheet.getRow(rowIndex).height = newHeight1;
            cell.alignment = {horizontal: 'left', vertical: 'top', wrapText: true};
        }

        // hiển thị giao diện loading khi bấm in
        const showLoadingDialog = (isShow) => {
            let progessElement = "";
            if (isShow) {
                let container = document.getElementById("pageContainer") || document.getElementById("outerwrapper");
                if (!container) return console.error("Not found ElementId");

                loadStyleToHtmlPage(container);
                let mainLoader = document.createElement('div');
                mainLoader.classList.add("scvMainLoader");
                mainLoader.innerHTML = '<span class="scvLoader"></span><span id="idxProgessStatus" class="scvProgessStatus">Processing...</span>';

                container.appendChild(mainLoader);
                progessElement = document.querySelector(".scvProgessStatus");
            } else {
                let mainLoader = document.querySelector(".scvMainLoader");
                if (mainLoader) mainLoader.remove();
            }
            return progessElement;
        }

        const loadStyleToHtmlPage = (container) => {
            let addLoading = container.getAttribute("scv-add-loading");
            if (addLoading === "T") return;
            container.setAttribute("scv-add-loading", "T");

            let linkElement = document.createElement('style');
            let textNode = document.createTextNode(`
                .scvLoader {
                    width: 100px; height: 100px; 
                    border: 8px solid #e0e0e0; 
                    border-bottom-color: #0288d1;
                    border-radius: 50%; display: inline-block; box-sizing: border-box; position: fixed;
                    transform: translate(-50%, -50%); animation: scvRotationLoading 1s linear infinite;
                }
                .scvProgessStatus {
                    position: fixed; top: 50%; left: 50%; font-size: 12px; transform: translate(-50%, -50%);
                }
                .scvMainLoader {
                    position: fixed; top: 0; left: 0; height: 100%; width: 100%; z-index: 9999;
                    display: flex; justify-content:center; align-items:center; 
                    flex-direction: column; background-color: rgba(255, 255, 255, 0.85);
                }
                @keyframes scvRotationLoading {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }`
            );
            linkElement.appendChild(textNode);
            document.head.appendChild(linkElement);
        }

        // request ajax để lấy data từ suitelet
        const postRequestByAjax = async (urlReq, params = {}) => {
            return new Promise((resolve, reject) => {
                jQuery.ajax({
                    type: 'post',
                    url: urlReq,
                    dataType: 'json',
                    data: {...params},
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                })
                    .done(function (response) {
                        resolve(response);
                    })
                    .fail(function (request, status, error) {
                        console.log(error);
                        reject(error);
                    })
            });
        }

        // load file xlsx
        const loadWorkbookFromUrl = async (urlFile) => {
            let workbook = null;
            await fetch(urlFile).then(res => res.blob())
                .then(async blob => {
                    let buf = await blob.arrayBuffer();
                    workbook = new ExcelJS.Workbook();
                    await workbook.xlsx.load(buf);
                })
            return workbook;
        }

        // ghi file xlsx ra browser
        const saveWorkbook = async (workbook, name) => {
            workbook.xlsx.writeBuffer().then((buffer) => {
                saveAs(new Blob([buffer]), name);
            });
        }

        const isFloat = (n) => {
            return Number(n) === n && n % 1 !== 0;
        }

        return {
             cloneSheet,
             addHeaderLine,
            insertValueTable,
            getPositionCell,
            syncRangeMergeAfterInsertRow,
            getValueRow,
            replaceValueColumn,
            showLoadingDialog,
            postRequestByAjax,
            loadWorkbookFromUrl,
            saveWorkbook,
            isFloat,
            fnCloneSheet
        }

    });
