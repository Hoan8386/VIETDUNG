/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/url', '../common/scv_common_excel_helper'],

    function (currentRecord, url, excelHelper) {
        const xuatPhieuKiemTra = async (strIsBltt) => {
            let curRec = currentRecord.get();
            let urlSl = url.resolveScript({
                scriptId: 'customscript_scv_sl_salescontract_print',
                deploymentId: 'customdeploy_scv_sl_salescontract_print',
                returnExternalUrl: false
            });

            let params = {
                recId: curRec.id,
                rectype: curRec.type,
                exportType: 'excel',
                isBltt: strIsBltt
            }

            try {
                excelHelper.showLoadingDialog(true);
                let objResponse = await excelHelper.postRequestByAjax(urlSl, {...params});

                if (objResponse.exporttype === 'excel') {
                    let workbook = await excelHelper.loadWorkbookFromUrl(objResponse.url, params);
                    // mẫu dữ liệu thay thế
                    let mappedData = objResponse.mappedData;
                    let fileName = objResponse.filename;
                    let curSheet = workbook.worksheets[0];
                    replaceValueColumn(curSheet, mappedData);
                    await excelHelper.saveWorkbook(workbook, fileName);
                }

                excelHelper.showLoadingDialog(false);
            } catch (error) {
                alert(error.message.toString());
                excelHelper.showLoadingDialog(false);
            }
        }

        const xuatHopDongMuaBan = async (params) => {
            try {
                excelHelper.showLoadingDialog(true);
                let suiteletUrl = nlapiResolveURL('suitelet', 'customscript_scv_sl_salescontract_print', 'customdeploy_scv_sl_salescontract_print');
                let placeHolderData = await getSalesContractData(suiteletUrl, {...params});
                let content = await loadFile(placeHolderData.urlTemplate)//('https://9684031-sb1.app.netsuite.com/core/media/media.nl?id=9113&c=9684031_SB1&h=QchlHsiSOx_s7AbTZZ7etYs4m_R16HhTuZb23KKA6ePvyK8h&_xt=.doc');
                const zip = new PizZip(content);
                let doc = new window.docxtemplater(zip, {
                    nullGetter() {
                        return '';
                    },
                    linebreaks: true,
                    paragraphLoop: true,
                    xmlOptions: { enabled: true }
                });

                doc.render(placeHolderData);
                doc.setData({
                    "BÊN_A": "<w:b>John Doe</w:b>"
                });
                const blob = doc.getZip().generate({
                    type: "blob",
                    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    compression: "DEFLATE",
                });

                saveAs(blob, (params.isBltt === 'T') ? "HDMB BLTT-SC.docx" : "HDMB-SC.docx");
                excelHelper.showLoadingDialog(false);
            } catch (err) {
                excelHelper.showLoadingDialog(false);
                throw (err);
            }
        }

        const loadFile = (url) => {
            return new Promise((resolve, reject) => {
                PizZipUtils.getBinaryContent(url, (error, content) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(content);
                    }
                });
            });
        }

        const getSalesContractData = async (url, params) => {
            return new Promise((resolve, reject) => {
                $.ajax({
                    url: url,
                    method: 'post',
                    data: {...params},
                    dataType: 'json',
                    async: true,
                }).done((msg) => {
                    resolve(msg);
                }).fail((jqXHR, textStatus, errorThrown) => {
                    reject({
                        status: jqXHR.status,
                        statusText: textStatus,
                        responseText: jqXHR.responseText,
                        error: errorThrown
                    })
                })
            });
        }

        const replaceValueColumn = (curSheet, objCellReplace) => {
            try {
                for (let cellRef in objCellReplace) {
                    let cell = curSheet.getCell(cellRef);
                    if (cell) {
                        let objData = objCellReplace[cellRef];
                        for (let key in objData) {
                            let vla = objData[key] || '';
                            if (key === 'all') cell.value = vla;
                            else {
                                if (cell.value.richText?.length > 0) {
                                    for (let i = 0; i < cell.value.richText.length; i++) {
                                        cell.value.richText[i].text = cell.value.richText[i].text.replaceAll(`{${key}}`, vla);
                                    }
                                } else {
                                    cell.value = cell.value.replaceAll(`{${key}}`, vla);
                                }
                            }


                        }
                    }
                }
            } catch (error) {
                console.log("error - replaceValueColumn", error)
            }
        }

        const exportPdf = (props) => {
            let templateId = 'CUSTTMPL_SCV_SC_HDNT';
            let urlSlPrint = url.resolveScript({
                scriptId: 'customscript_scv_sl_sc_hdnt_print',
                deploymentId: 'customdeploy_scv_sl_sc_hdnt_print',
                returnExternalUrl: false,
                params: {
                    recId: props.recId,
                    recType: props.recType,
                    exportType: props.exportType,
                    btnType: props.btnType,
                    templateid: templateId
                }
            });
            window.open(urlSlPrint, '_blank');
        }
        const exportHdntWord = async (props) => {
            try {
                excelHelper.showLoadingDialog(true);
                let suiteletUrl = nlapiResolveURL('suitelet', 'customscript_scv_sl_sc_hdnt_print', 'customdeploy_scv_sl_sc_hdnt_print');
                let placeHolderData = await getSalesContractData(suiteletUrl, {...props});
                let content = await loadFile(placeHolderData.urlTemplate)//('https://9684031-sb1.app.netsuite.com/core/media/media.nl?id=9113&c=9684031_SB1&h=QchlHsiSOx_s7AbTZZ7etYs4m_R16HhTuZb23KKA6ePvyK8h&_xt=.doc');
                const zip = new PizZip(content);
                let doc = new window.docxtemplater(zip, {
                    nullGetter() {
                        return '';
                    },
                    linebreaks: true,
                    paragraphLoop: true,
                    xmlOptions: { enabled: true }
                });

                doc.render(placeHolderData);
                const blob = doc.getZip().generate({
                    type: "blob",
                    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    compression: "DEFLATE",
                });

                saveAs(blob, (props.isDa === 'T') ? "HDMB_DA_SC.docx" : "HDNT_SC.docx");
                excelHelper.showLoadingDialog(false);
            } catch (err) {
                excelHelper.showLoadingDialog(false);
                throw (err);
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

        return {
            pageInit: pageInit,
            xuatPhieuKiemTra: xuatPhieuKiemTra,
            exportPdf: exportPdf,
            exportHdntWord: exportHdntWord,
            xuatHopDongMuaBan: xuatHopDongMuaBan
        };

    });
