/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/url', '../common/scv_common_excel_helper', '../common/scv_common_word_exp_helper'],

    function (currentRecord, url, excelHelper, wordHelper) {

        const URL_PO_NOI_DIA_DATA = '/app/site/hosting/scriptlet.nl?script=customscript_scv_sl_po_noi_dia_print&deploy=customdeploy_scv_sl_po_noi_dia_print';

        const printDonMuaNhapKhau = async () => {
            let curRec = currentRecord.get();
            let urlSl = url.resolveScript({
                scriptId: 'customscript_scv_sl_po_nhap_khau_print',
                deploymentId: 'customdeploy_scv_sl_po_nhap_khau_print',
                returnExternalUrl: false
            });

            let params = {
                recid: curRec.id,
                rectype: curRec.type,
            }

            try {
                excelHelper.showLoadingDialog(true);
                let objResponse = await excelHelper.postRequestByAjax(urlSl, {...params, isExcel: 'T'});

                if (objResponse.templatetype === 'excel') {

                    let workbook = await excelHelper.loadWorkbookFromUrl(objResponse.url, params);
                    // mẫu dữ liệu thay thế
                    let objCellReplace = objResponse.mappedData;
                    let arrData = objResponse.arrData;
                    let colId = objResponse.colId;
                    let idxSourceRow = objResponse.idxSourceRow;
                    let idxRowData = objResponse.idxRowData;
                    let fileName = objResponse.filename;
                    let curSheet = workbook.worksheets[0];

                    excelHelper.replaceValueColumn(curSheet, objCellReplace);
                    if(objResponse.template === '2uom') {
                        curSheet.getCell('F17').numFmt = '#,##0.00';
                        curSheet.getCell('G17').numFmt = '#,##0.00';
                        curSheet.getCell('I17').numFmt = '#,##0.00';
                        curSheet.getCell('F17').value = Number(curSheet.getCell('F17').value);
                        curSheet.getCell('G17').value = Number(curSheet.getCell('G17').value);
                        curSheet.getCell('I17').value = Number(curSheet.getCell('I17').value);
                        excelHelper.insertValueTable({curSheet, arrData, colId, idxSourceRow, idxRowData});

                        for (let i = idxSourceRow; i < idxSourceRow + arrData.length; i++) {
                            let curRow = curSheet.getRow(i);
                            curRow.eachCell((cell, colNumber) => {
                                cell.border = {
                                    top: {style: 'thin'},
                                    left: {style: 'thin'},
                                    bottom: {style: 'thin'},
                                    right: {style: 'thin'}
                                };

                                if (colNumber === 6) {
                                    cell.numFmt = '#,##0.00';
                                    cell.value = Number(cell.value);
                                }

                                if (colNumber === 8) {
                                    cell.numFmt = '#,##0.000';
                                    cell.value = Number(cell.value);
                                }
                            });
                        }
                    }else{
                        excelHelper.insertValueTable({curSheet, arrData, colId, idxSourceRow, idxRowData});
                    }

                    //let objData = objResponse.data;
                    await excelHelper.saveWorkbook(workbook, fileName);
                } else {
                    let placeHolderData = objResponse.mappedData;
                    let content = await wordHelper.loadFileDocx(objResponse.url)
                    const zip = new PizZip(content);
                    let doc = new window.docxtemplater(zip, {
                        nullGetter() {
                            return '';
                        },
                        linebreaks: true,
                        paragraphLoop: true,
                    });

                    doc.render(placeHolderData);

                    const blob = doc.getZip().generate({
                        type: "blob",
                        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                        compression: "DEFLATE",
                    });

                    let fileName = objResponse.filename;
                    await saveAs(blob, fileName);
                }

                excelHelper.showLoadingDialog(false);
            } catch (error) {
                alert(error.message.toString());
                excelHelper.showLoadingDialog(false);
            }
        }

        const printDonMuaNhapKhauPdf = async () => {
            let curRec = currentRecord.get();
            let params = {
                recid: curRec.id,
                rectype: curRec.type,
                isPdf: 'T'
            }

            let urlSl = url.resolveScript({
                scriptId: 'customscript_scv_sl_po_nhap_khau_print',
                deploymentId: 'customdeploy_scv_sl_po_nhap_khau_print',
                params : params
            });

            window.open(urlSl);
        }

        const printDonMuaNoiDiaPdf = async () => {
            let curRec = currentRecord.get();
            window.open(URL_PO_NOI_DIA_DATA + `&recid=${curRec.id}&rectype=${curRec.type}&isPdf=T`);
        }

        const printDonMuaNoiDiaExcel = async () => {
            let curRec = currentRecord.get();
            let urlSl = url.resolveScript({
                scriptId: 'customscript_scv_sl_po_noi_dia_print',
                deploymentId: 'customdeploy_scv_sl_po_noi_dia_print',
                returnExternalUrl: false
            });

            let params = {
                recid: curRec.id,
                rectype: curRec.type,
                isExcel : 'T'
            }

            try {
                excelHelper.showLoadingDialog(true);
                let objResponse = await excelHelper.postRequestByAjax(urlSl, {...params, isExcel: 'T'});

                if (objResponse.templatetype === 'excel') {

                    let workbook = await excelHelper.loadWorkbookFromUrl(objResponse.url, params);
                    // mẫu dữ liệu thay thế
                    let objCellReplace = objResponse.mappedData;
                    let arrData = objResponse.arrData;
                    let colId = objResponse.colId;
                    let idxSourceRow = objResponse.idxSourceRow;
                    let idxRowData = objResponse.idxRowData;
                    let fileName = objResponse.filename;
                    let curSheet = workbook.worksheets[0];

                    excelHelper.replaceValueColumn(curSheet, objCellReplace);
                    excelHelper.insertValueTable({curSheet, arrData, colId, idxSourceRow, idxRowData});

                    for (let i = 0; i < arrData.length ; i++) {
                        let curRow = curSheet.getRow(idxSourceRow + i);
                        curRow.eachCell((cell, colNumber) => {
                            cell.border = {
                                top: {style: 'thin'},
                                left: {style: 'thin'},
                                bottom: {style: 'thin'},
                                right: {style: 'thin'}
                            };
                            if ( cell.type === 'number' ) {
                                cell.alignment = {
                                    horizontal: 'right',
                                }
                            }
                        });
                    }

                    //let objData = objResponse.data;
                    await excelHelper.saveWorkbook(workbook, fileName);
                } else {
                    let placeHolderData = objResponse.mappedData;
                    let content = await wordHelper.loadFileDocx(objResponse.url)
                    const zip = new PizZip(content);
                    let doc = new window.docxtemplater(zip, {
                        nullGetter() {
                            return '';
                        },
                        linebreaks: true,
                        paragraphLoop: true,
                    });

                    doc.render(placeHolderData);

                    const blob = doc.getZip().generate({
                        type: "blob",
                        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                        compression: "DEFLATE",
                    });

                    let fileName = objResponse.filename;
                    await saveAs(blob, fileName);
                }

                excelHelper.showLoadingDialog(false);
            } catch (error) {
                alert(error.message.toString());
                excelHelper.showLoadingDialog(false);
            }
        }

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

        }

        function redirectToSuitelet() {
            debugger;
            let curRec = currentRecord.get();
            var suiteletUrl = url.resolveScript({
                scriptId: 'customscriptsl_close_line_transaction', // Thay thế bằng ID của Suitelet
                deploymentId: 'customdeploysl_close_line_ts', // Thay thế bằng ID của Deployment
                params: {
                    'recordId': curRec.id, // Truyền ID của Purchase Order
                    'rectype': curRec.type, // Truyền ID của Purchase Order
                }
            });
            // window.open(suiteletUrl, '_blank'); // Mở URL trong tab mới
            // var popupWindow = window.open(suiteletUrl, 'popup', 'width=800,height=600,scrollbars=yes,resizable=yes');
            // if (!popupWindow) {
            //     alert("Popup bị chặn. Vui lòng cho phép popup trong trình duyệt.");
            // }

            window.open(
                suiteletUrl,
                'popupWindow',
                'width=600,height=400,toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes'
            );
        }

        function openredirectToSuitelet() {
            debugger;
            let curRec = currentRecord.get();
            var suiteletUrl = url.resolveScript({
                scriptId: 'customscript_sl_open_line_transaction', // Thay thế bằng ID của Suitelet
                deploymentId: 'customdeploy_sl_open_line_ts', // Thay thế bằng ID của Deployment
                params: {
                    'recordId': curRec.id, // Truyền ID của Purchase Order
                    'rectype': curRec.type, // Truyền ID của Purchase Order
                }
            });
            // window.open(suiteletUrl, '_blank'); // Mở URL trong tab mới
            // var popupWindow = window.open(suiteletUrl, 'popup', 'width=800,height=600,scrollbars=yes,resizable=yes');
            // if (!popupWindow) {
            //     alert("Popup bị chặn. Vui lòng cho phép popup trong trình duyệt.");
            // }

            window.open(
                suiteletUrl,
                'popupWindow',
                'width=600,height=400,toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes'
            );
        }

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
                let dataRow = excelHelper.getValueRow(arrData[i], params.colId);
                let newRow = curSheet.insertRow(idxRowData, dataRow);
                newRow.height = rowSrc.height;
                newRow.eachCell((cell, colNumber) => {
                    cell.style = {...rowSrc.getCell(colNumber).style};
                    //cell.numFmt = {...rowSrc.getCell(colNumber).numFmt};
                    if (!isNaN(Number(cell.value)) && colNumber !== 1) {
                        cell.alignment = {horizontal: 'right', vertical: 'middle'};
                        cell.numFmt = '0.00';
                        cell.value = Number(cell.value);
                    }
                    if (isFloat(cell.value) && colNumber !== 1) {
                        cell.alignment = {horizontal: 'right', vertical: 'middle'};
                        cell.numFmt = '#,##0.00';
                        cell.value = Number(cell.value);
                    }
                    if (isFloat(cell.value) && colNumber !== 1 && cell.value < 1) {
                        cell.alignment = {horizontal: 'right', vertical: 'middle'};
                        cell.numFmt = '0.###';
                        cell.value = Number(cell.value);
                    }
                });

                idxRowData += 1;
            }
            curSheet.spliceRows(idxSourceRow, 1);
            excelHelper.syncRangeMergeAfterInsertRow(curSheet, idxSourceRow, arrLength - 1);
            return idxRowData - 1;
        }

        const isFloat = (n) => {
            return Number(n) === n && n % 1 !== 0;
        }

        return {
            pageInit: pageInit,
            printDonMuaNoiDiaPdf: printDonMuaNoiDiaPdf,
            printDonMuaNoiDiaExcel: printDonMuaNoiDiaExcel,
            printDonMuaNhapKhau: printDonMuaNhapKhau,
            redirectToSuitelet: redirectToSuitelet,
            openredirectToSuitelet: openredirectToSuitelet,
            printDonMuaNhapKhauPdf: printDonMuaNhapKhauPdf,
        };

    });
