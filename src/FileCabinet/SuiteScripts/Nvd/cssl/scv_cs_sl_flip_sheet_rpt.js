/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([
    'N/currentRecord', 'N/url',
    '../cons/scv_cons_color.js',
    '../lib/scv_lib_cs.js',
    '../lib/scv_lib_cs_xls.js',
    '../olib/moment.js'
],
/**
 * @param{currentRecord} currentRecord
 */
function(
    currentRecord, url, constColor,
    libCS,
    libCsXLS,
    moment
) {

    const CurScript = {
        ID: 'customscript_scv_sl_flip_sheet_rpt',
        DEPLOYID_UI: 'customdeploy_scv_sl_flip_sheet_rpt',
        DEPLOYID_DATA: 'customdeploy_scv_sl_flip_sheet_data'
    };

    const ReportType = {
        Detail: {
            ID: "detail", NAME: "Chi tiết"
        },
        Summary: {
            ID: "summary", NAME: "Tổng hợp"
        },
    };
    
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
        let curRec = scriptContext.currentRecord;

        let reportType = curRec.getValue("custpage_report_type");
        let itemField = curRec.getField("custpage_item");

        if(reportType == ReportType.Summary.ID) {
            itemField.isDisplay = false;
        }
        // add background cell
        let sl = "custpage_sl_result";
        let totalLine = curRec.getLineCount(sl);
        for(let i = 0; i < totalLine; i++) {
            if(i === totalLine - 1) {
                let rowId = `${sl}row${i}`;
                let rowElement = document.getElementById(rowId);
                rowElement.style.setProperty("font-weight", 600, "important");
                rowElement.querySelectorAll("td").forEach((cellElement) => {
                    cellElement.style.setProperty("background", constColor.TEAL[300], "important");
                });
            }
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
        let curRec = scriptContext.currentRecord;
        let sublistId = scriptContext.sublistId;
        let fieldId = scriptContext.fieldId;

        if(fieldId === "custpage_report_type") {
            let reportType = curRec.getValue(fieldId);
            let itemField = curRec.getField("custpage_item");

            if(reportType == ReportType.Summary.ID) {
                itemField.isDisplay = false;
            } else {
                itemField.isDisplay = true;
            }
        }
    }

    /**
     * Validation function to be executed when record is saved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @returns {boolean} Return true if record is valid
     *
     * @since 2015.2
     */
    function saveRecord(scriptContext) {

    }

    const onSearchResult = () => {
        window.onbeforeunload = null;
        const BASE_URL = url.resolveScript({
            scriptId: CurScript.ID,
            deploymentId:CurScript.DEPLOYID_UI,
            returnExternalUrl: false
        });

        let currRecord = currentRecord.get();
        let urlDC = BASE_URL + plusParam(currRecord) + "&isrun=T";
        window.location.replace(urlDC);
    }

    const onExport = async () => {
        libCS.showLoadingDialog(true);
        window.onbeforeunload = null;
        let curRec = currentRecord.get();
        let urlData = url.resolveScript({
            scriptId: CurScript.ID, deploymentId: CurScript.DEPLOYID_DATA,
            returnExternalUrl: false
        });
        urlData += plusParam(curRec);

        let response = await fetchData(urlData);
        let arrData = response.data;

        let reportType = curRec.getValue("custpage_report_type");
        switch (reportType) {
            case ReportType.Detail.ID:
                await onExportReportDetail(arrData, curRec);
                break;
            case ReportType.Summary.ID:
                await onExportReportSummary(arrData, curRec);
                break;
        }

        libCS.showLoadingDialog(false);
    }

    const onExportReportDetail = async (arrData, curRec) => {
        // export excel
        let file_export = curRec.getValue("custpage_url_file_detail");
        let to_date = curRec.getValue("custpage_todt");
        let workbook = await libCsXLS.loadWorkbookFromUrl(file_export);
        let curSheet = workbook.worksheets[0];
        // current sheet
        let cellTotal = curSheet.getCell("A2");
        cellTotal.value = `Tháng ${moment(to_date).format('MM')} Năm ${moment(to_date).format('YYYY')}`;

        let idxRow = 5;
        for(let i = 0; i < arrData.length - 1; i++) {
            let obj = arrData[i];

            let rowData  = curSheet.getRow(idxRow);
            let idxCurRow = i + 1 + idxRow;

            let newRow = curSheet.insertRow(idxCurRow, [
                obj.receipt_date, obj.item_upccode, obj.item_display, obj.tsl_a,
                obj.employee_display, obj.he_so, obj.qty_quy_doi, obj.single_error,
                obj.multi_error, obj.error_description, obj.note,
            ]);

            newRow.height = newRow.height * 20 / newRow.width;
            rowData.eachCell((cell, colNumber) => {
                const newCell = newRow.getCell(colNumber);
                newCell.style = { ...cell.style };
            });
        }
        curSheet.spliceRows(idxRow, 1);
        libCsXLS.syncRangeMergeAfterInsertRow(curSheet, idxRow, arrData.length - 1);

        await libCsXLS.saveWorkbook(workbook, "Báo cáo lật tấm chi tiết.xlsx");
    }

    const onExportReportSummary = async (arrData, curRec) => {
        // export excel
        let file_export = curRec.getValue("custpage_url_file_summary");
        let to_date = curRec.getValue("custpage_todt");
        let workbook = await libCsXLS.loadWorkbookFromUrl(file_export);
        let curSheet = workbook.worksheets[0];
        // current sheet
        let cellTotal = curSheet.getCell("A2");
        cellTotal.value = `Tháng ${moment(to_date).format('MM')} Năm ${moment(to_date).format('YYYY')}`;

        let idxRow = 5;
        for(let i = 0; i < arrData.length - 1; i++) {
            let obj = arrData[i];

            let rowData  = curSheet.getRow(idxRow);
            let idxCurRow = i + 1 + idxRow;

            let newRow = curSheet.insertRow(idxCurRow, [
                obj.employee_display, obj.tsl_a, obj.he_so, obj.qty_quy_doi, 
                obj.single_error, obj.multi_error, null, null, null, 
                null, null, null, null, null, null, null
            ]);

            newRow.height = newRow.height * 20 / newRow.width;
            rowData.eachCell((cell, colNumber) => {
                const newCell = newRow.getCell(colNumber);
                newCell.style = { ...cell.style };
            });
        }
        curSheet.spliceRows(idxRow, 1);
        libCsXLS.syncRangeMergeAfterInsertRow(curSheet, idxRow, arrData.length - 1);

        await libCsXLS.saveWorkbook(workbook, "Báo cáo lật tấm tổng hợp.xlsx");
    }

    const fetchData = async (url) => {
        try {
            let response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Error fetching ${url}: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(error.message);
            return null;
        }
    }

    function plusParam(currRecord) {
        return '&custpage_report_type=' + currRecord.getValue('custpage_report_type')
            + '&custpage_subsidiary=' + currRecord.getValue('custpage_subsidiary')
            + '&custpage_item=' + currRecord.getValue('custpage_item')
            + '&custpage_employee=' + currRecord.getValue('custpage_employee')
            + '&custpage_fromdt=' + currRecord.getText('custpage_fromdt')
            + '&custpage_todt=' + currRecord.getText('custpage_todt');
    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        onSearchResult: onSearchResult,
        onExport: onExport,
        // saveRecord: saveRecord
    };
    
});
