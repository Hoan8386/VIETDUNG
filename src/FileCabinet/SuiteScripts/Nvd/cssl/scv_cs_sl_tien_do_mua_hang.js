/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/url', '../lib/scv_lib_function.js', '../common/scv_common_excel_helper', '../lib/scv_lib_cs.js'],
    (currentRecord, url, lbf, excelHelper , libCs) => {
        const CUR_SCRIPT = {
            ID: "customscript_scv_sl_report_tiendomuahang",
            DEPLOYID_UI: "customdeploy_scv_sl_report_tiendomuahang",
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

        const onRefreshForm = () => {
            window.onbeforeunload = null;
            excelHelper.showLoadingDialog(true);
            let urlDC = getUrlSuitelet()
            window.location.replace(urlDC);
        }

        const onSearchResult = async (isExport) => {
            debugger;
            window.onbeforeunload = null;
            let currRecord = currentRecord.get();
            let isValid = validateFieldMandatory(currRecord, ['custpage_subsidiary']);
            if (!isValid) return;

            libCs.showLoadingDialog(true);
            await new Promise(resolve => setTimeout(resolve, 0));

            try {
                await asynSearchResult(isExport);
                updateFilterParamsInUrl(currRecord);
            } catch (error) {
                console.error('Error loading purchase progress report', error);
                alert(error.message || error);
            } finally {
                libCs.showLoadingDialog(false);
            }
        }

        const asynSearchResult = async (isExport) => {
            let currRecord = currentRecord.get();
            let params = getObjParams(currRecord);
            if (isExport !== "T") {
                arrData.length = 0;
            }
            let urlSl = getUrlSuitelet();

            const response = await new Promise((resolve, reject) => {
                jQuery.ajax({
                    url: urlSl,
                    type: "POST",
                    data: {...params, action: "getData"},
                    dataType: "json"
                }).done(resolve).fail((request, status, error) => {
                    reject(new Error(error || status || 'Không thể tải dữ liệu báo cáo'));
                });
            });

            const arrResult = response.data || [];
            if (isExport === "T") {
                await onExportResult(currRecord, arrResult);
            } else {
                arrData = [...arrResult];
                renderGridLogCall();
            }
        }

        const onExportResult = async (curRec, arrResult) => {
            try {
                let urlSl = getUrlSuitelet();
                let templateUrl = getTemplateExcel(urlSl);
                let workbook = await excelHelper.loadWorkbookFromUrl(templateUrl);
                let worksheet = workbook.worksheets[0];

                let i = 3;
                // Add rows to the worksheet
                arrResult.forEach(objRes => {
                    const rowData = [
                        objRes.so_ycmh,
                        objRes.ngay_duyet_ycmh,
                        objRes.upcode,
                        objRes.item_text,
                        objRes.mo_ta_chi_tiet,
                        objRes.don_vi_tinh,
                        objRes.sl_duyet_mua,
                        objRes.thoi_gian_can,
                        objRes.so_po,
                        objRes.ngay_po,
                        objRes.so_luong_po,
                        objRes.sl_con_lai_co_the_tao_po,
                        objRes.ngay_inbound,
                        objRes.so_luong_inb,
                        objRes.ngay_itr,
                        objRes.so_luong_itr,
                        objRes.sl_con_lai_co_the_nhap_kho,
                        objRes.complete_percentage,
                    ];
                    const row = worksheet.getRow(i++);
                    row.values = rowData;

                    // Apply border style to each cell
                    row.eachCell((cell) => {
                        cell.border = {
                            top: { style: 'thin' },
                            left: { style: 'thin' },
                            bottom: { style: 'thin' },
                            right: { style: 'thin' }
                        };
                    });

                    row.commit(); // Commit changes to the row
                });

                // Write to a file
                const buffer = await workbook.xlsx.writeBuffer();
                const blob = new Blob([buffer], {type: 'application/octet-stream'});
                saveAs(blob, 'Báo cáo tiến độ thực hiện mua hàng.xlsx');
            } catch (err) {
                alert(err)
            }
        }

        const getTemplateExcel = (urlSl) => {
            let params = {};
            params.action = "getTemplateExcel";

            let objUrl = {};
            $.ajax({
                url: urlSl, type: "POST", data: params, dataType: "json", async: false
            }).done((response) => {
                objUrl = response.url;
            }).fail((request, status, error) => {
                alert(status);
            });

            return objUrl;
        }

        const validateFieldMandatory = (curRec, lstFields) => {
            let isValid = true;
            for (let i = 0; i < lstFields.length; i++) {
                let infoField = curRec.getField(lstFields[i]);
                if (infoField.isMandatory === true) {
                    let valueField = curRec.getValue(lstFields[i]);
                    if (!lbf.isContainValue(valueField)) {
                        isValid = false;
                        alert("Please enter value(s) for: " + infoField.label);
                        break;
                    }
                }
            }

            return isValid;
        }

        const getObjParams = (currRecord) => {
            return {
                custpage_subsidiary: currRecord.getValue('custpage_subsidiary'),
                custpage_ycmh_fromdt: currRecord.getText('custpage_ycmh_fromdt'),
                custpage_ycmh_todt: currRecord.getText('custpage_ycmh_todt'),
                custpage_po_fromdt: currRecord.getText('custpage_po_fromdt'),
                custpage_po_todt: currRecord.getText('custpage_po_todt'),
                custpage_customsegment : currRecord.getValue('custpage_customsegment'),
                custpage_bophan_muahang : currRecord.getValue('custpage_bophan_muahang'),
                custpage_phanloai_ycmh : currRecord.getValue('custpage_phanloai_ycmh'),
                custpage_phanloai_hanghoa : currRecord.getValue('custpage_phanloai_hanghoa').join(','),
                custpage_requestor : currRecord.getValue('custpage_requestor'),
            };
        }

        const getUrlSuitelet = () => {
            return url.resolveScript({
                scriptId: CUR_SCRIPT.ID,
                deploymentId: CUR_SCRIPT.DEPLOYID_UI,
                returnExternalUrl: false
            });
        }

        const updateFilterParamsInUrl = (currRecord) => {
            const filterUrl = url.resolveScript({
                scriptId: CUR_SCRIPT.ID,
                deploymentId: CUR_SCRIPT.DEPLOYID_UI,
                returnExternalUrl: false,
                params: getObjParams(currRecord)
            });
            window.history.replaceState(null, document.title, filterUrl);
        }

        return {
            pageInit: pageInit,
            onSearchResult,
            onRefreshForm
        };

    });
