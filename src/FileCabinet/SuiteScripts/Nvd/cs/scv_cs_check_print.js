/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/url', '../common/scv_common_excel_helper', '../common/scv_common_word_exp_helper'],

    function (currentRecord, url, excelHelper, wordHelper) {

        // const UrlLoaiMauIn = {
        //     LCT_EXCEL :  'https://system.na2.netsuite.com/app/site/hosting/scriptlet.nl?script=123&deploy=1',
        //     //LCT_WORD :
        // }

        // Hàm in lệnh chuyển tiền Excel

        const printLenhChuyenTienExcel = async () => {
            let curRec = currentRecord.get();
            let urlSl = url.resolveScript({
                scriptId: 'customscript_scv_sl_lct_print',
                deploymentId: 'customdeploy_scv_sl_lct_print',
                returnExternalUrl: false
            });

            let params = {
                recid: curRec.id,
                rectype: curRec.type
            }

            try {
                excelHelper.showLoadingDialog(true);
                let objResponse = await excelHelper.postRequestByAjax(urlSl, {...params, isExcel: 'T'});
                if (objResponse.templatetype === 'excel') {
                    let workbook = await excelHelper.loadWorkbookFromUrl(objResponse.url, params);
                    // mẫu dữ liệu thay thế
                    let objCellReplace = objResponse.mappeddata;
                    let fileName = objResponse.filename;
                    let curSheet = workbook.worksheets[0];
                    if(fileName === 'LCT SCB.xlsx'){
                        curSheet.pageSetup = {
                            paperSize: 9,             // 9 = A4 (210mm x 297mm)e
                            orientation: 'portrait',  // 'landscape' or 'portrait'
                            scale: 88,                 // Scale to 84%
                            margins: {
                                left: 0.5,    // inches
                                right: 0.5,
                                top: 0.25,
                                bottom: 0.75,
                                header: 0.3,
                                footer: 0.3
                            }
                        };
                    }
                    replaceValueColumn(curSheet, objCellReplace);

                    //let objData = objResponse.data;
                    await excelHelper.saveWorkbook(workbook, fileName);
                }
                else{
                    let placeHolderData = objResponse.mappeddata;
                    let content = await wordHelper.loadFileDocx(objResponse.url)//('https://9684031-sb1.app.netsuite.com/core/media/media.nl?id=9113&c=9684031_SB1&h=QchlHsiSOx_s7AbTZZ7etYs4m_R16HhTuZb23KKA6ePvyK8h&_xt=.doc');
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
                                let a = cell.value;
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
            printLenhChuyenTienExcel,
        };

    });
