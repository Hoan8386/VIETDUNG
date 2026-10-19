/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/url', '../common/scv_common_excel_helper', '../common/scv_common_word_exp_helper'],

function(currentRecord, url, excelHelper, wordHelper) {

    const xuatKeHoachMuaHangExcel = async () => {
        let curRec = currentRecord.get();
        let urlSl = url.resolveScript({
            scriptId: 'customscript_scv_sl_purchase_plan_print',
            deploymentId: 'customdeploy_scv_sl_purchase_plan_print',
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

    const xuatKeHoachMuaHangPdf = async () => {
        let curRec = currentRecord.get();
        let params = {
            recid: curRec.id,
            rectype: curRec.type,
            isPdf: 'T'
        }
        let urlSl = url.resolveScript({
            scriptId: 'customscript_scv_sl_purchase_plan_print',
            deploymentId: 'customdeploy_scv_sl_purchase_plan_print',
            params : params,
            returnExternalUrl: false
        });

        window.open(urlSl);
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
        xuatKeHoachMuaHangExcel: xuatKeHoachMuaHangExcel,
        xuatKeHoachMuaHangPdf : xuatKeHoachMuaHangPdf
        // fieldChanged: fieldChanged,
        // postSourcing: postSourcing,
        // sublistChanged: sublistChanged,
        // lineInit: lineInit,
        // validateField: validateField,
        // validateLine: validateLine,
        // validateInsert: validateInsert,
        // validateDelete: validateDelete,
        // saveRecord: saveRecord
    };
    
});
