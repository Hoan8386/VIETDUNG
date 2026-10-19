/**
 * Nội dung:
 * Key:
 * * =======================================================================================
 *  Date                Author                  Description
 *  ?                   ?                       ?
 *  08 Aug 2025         Thành Ngô           Create cs cho file báo cáo Kết quả bảo dưỡng, from Mr.Tâm (https://app.clickup.com/t/86czx6vp2)
 *
 **/
/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([
        'N/currentRecord',
        'N/url',
        '../lib/scv_lib_cs',
        '../common/scv_common_excel_helper',
        '../lib/scv_lib_custom_form.js'
    ],

    function (
        ccr,
        url,
        libCs,
        comExcelHelper,
        libCustomForm) {
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
            if (objProjectData.isearch === "T") {
                libCustomForm.renderDxGridResult(objProjectData.data, objProjectData.columns, 'scvTabsContainer',);
            }
        }

        /**
         * Function to be executed when field is changed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
         * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
         *
         * @since 2015.2
         */
        function fieldChanged(scriptContext) {
        }

        const MANDATORY_FIELDS = ['custpage_taisan', 'custpage_year'];

        function searchReport() {
            window.onbeforeunload = null;
            let currentRecord = ccr.get();
            if (!libCs.fnValidateFields(currentRecord, MANDATORY_FIELDS)) {
                return;
            }
            let urlDC = getUrlParam(currentRecord) + '&isearch=T';
            window.location.replace(urlDC);
        }

        function getUrlParam(currentRecord) {
            return url.resolveScript({
                scriptId: 'customscript_scv_sl_rp_cmms_kqbd',
                deploymentId: 'customdeploy_scv_sl_rp_cmms_kqbd',
                returnExternalUrl: false,
                params: getParam(currentRecord)
            });
        }

        function getParam(currentRecord) {
            return {
                custpage_taisan: currentRecord.getValue('custpage_taisan'),
                custpage_year: currentRecord.getValue('custpage_year')
            }
        }

        const URL_RQ = '/app/site/hosting/scriptlet.nl?script=customscript_scv_sl_rp_cmms_kqbd&deploy=customdeploy_scv_sl_rp_cmms_kqbd';

        async function exportReport() {
            window.onbeforeunload = null;
            let currentRecord = ccr.get();
            if (!libCs.fnValidateFields(currentRecord, MANDATORY_FIELDS)) {
                return;
            }
            let params = getParam(currentRecord);
            params.isearch = 'T';
            params.isgetdata = 'T';
            let taiSanText = currentRecord.getText('custpage_taisan');
            let yearText = currentRecord.getText('custpage_year').replace(/^FY\s*/i, '');

            try {
                libCs.showLoadingDialog(true);
                let resCallData = JSON.parse(nlapiRequestURL(URL_RQ, params).getBody());
                let objData = resCallData.data;
                let objDataCol = resCallData.excelIdCols;
                let objDataConfig = JSON.parse(nlapiRequestURL(URL_RQ, {
                    action: 'getUrlTemplate',
                }).getBody());

                await exportExcel(objDataConfig, objDataCol, objData, taiSanText, yearText);
            } catch (error) {
                console.log("error", error);
                alert('Xuất file thất bại: ' + (error?.message || error));
            } finally {
                libCs.showLoadingDialog(false);
            }
        }

        const TEMPLATE_DATA_ROW = 10;
        const TITLE_ROW = 1;
        const TITLE_PREFIX = 'KẾ HOẠCH BẢO DƯỠNG NĂM';
        const ASSET_HEADER_ROW = 2;
        const ASSET_HEADER_PREFIX = 'DÂY CHUYỀN/MÁY:';

        const exportExcel = async (objDataConfig, cols, data, taiSanText, yearText) => {
            let urlTemplate = objDataConfig.urlTemplate;
            let workbook = await comExcelHelper.loadWorkbookFromUrl(urlTemplate);
            let sheet = workbook.worksheets[0];

            setTitleHeaderText(sheet, yearText);
            setAssetHeaderText(sheet, taiSanText);

            let rows = (data || []).filter(row => row.ma_chi_tiet);

            insertReportDataRows(sheet, TEMPLATE_DATA_ROW, rows, cols);
            await saveWorkbookFile(workbook, objDataConfig.reportName + '.xlsx');
        }

        const setTitleHeaderText = (worksheet, yearText) => {
            if (!yearText) return;
            let newText = `${TITLE_PREFIX} ${yearText}`;
            worksheet.getRow(TITLE_ROW).eachCell({includeEmpty: true}, cell => {
                if (typeof cell.value === 'string' && cell.value.startsWith(TITLE_PREFIX)) {
                    cell.value = newText;
                }
            });
        }

        const setAssetHeaderText = (worksheet, taiSanText) => {
            if (!taiSanText) return;
            let newText = `${ASSET_HEADER_PREFIX} ${taiSanText}`;
            worksheet.getRow(ASSET_HEADER_ROW).eachCell({includeEmpty: true}, cell => {
                if (typeof cell.value === 'string' && cell.value.startsWith(ASSET_HEADER_PREFIX)) {
                    cell.value = newText;
                }
            });
        }

        const insertReportDataRows = (worksheet, templateRowIndex, dataRows, columns) => {
            let templateRow = worksheet.getRow(templateRowIndex);
            let templateHeight = templateRow.height;
            let templateStyles = columns.map((_, idx) => ({...templateRow.getCell(idx + 1).style}));

            let rows = dataRows.length ? dataRows : [{}];
            let insertAt = templateRowIndex + 1;
            rows.forEach(rowData => {
                let newRow = worksheet.insertRow(insertAt, []);
                newRow.height = templateHeight;
                columns.forEach((col, idx) => {
                    let cell = newRow.getCell(idx + 1);
                    cell.value = rowData[col];
                    cell.style = {...templateStyles[idx]};
                    if (idx === 0 || !isNumericValue(cell.value)) return;
                    cell.alignment = {horizontal: 'right', vertical: 'middle'};
                    cell.numFmt = Number(cell.value) % 1 !== 0 ? '#,##0.00' : '#,##0';
                });
                insertAt += 1;
            });

            worksheet.spliceRows(templateRowIndex, 1);
            shiftMergesFrom(worksheet, templateRowIndex, rows.length - 1);
        }

        const isNumericValue = (value) => value !== '' && value !== null && value !== undefined && !isNaN(Number(value));

        // Dịch xuống (theo số dòng đã chèn) mọi vùng merge nằm từ rowStart trở xuống, ví dụ
        // khối chữ ký nằm ngay dưới bảng dữ liệu trong template.
        const shiftMergesFrom = (worksheet, rowStart, rowOffset) => {
            if (rowOffset === 0) return;
            let merges = worksheet.model.merges.filter(range => getRowOfAddress(worksheet, range.split(':')[0]) >= rowStart);
            merges.forEach(range => worksheet.unMergeCells(range));
            merges.forEach(range => {
                let [start, end] = range.split(':');
                let posStart = worksheet.getCell(start.toUpperCase());
                let posEnd = worksheet.getCell(end.toUpperCase());
                worksheet.mergeCells(posStart.row + rowOffset, posStart.col, posEnd.row + rowOffset, posEnd.col);
            });
        }

        const getRowOfAddress = (worksheet, address) => worksheet.getCell(address.toUpperCase()).row;

        const saveWorkbookFile = async (workbook, fileName) => {
            let buffer = await workbook.xlsx.writeBuffer();
            saveAs(new Blob([buffer]), fileName);
        }

        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            searchReport: searchReport,
            exportReport: exportReport
        };

    });
