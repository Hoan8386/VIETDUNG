/**
 * Nội dung:
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  19 Sep 2025         Khanh Tran			    Init, create file. Phát triển báo cáo Tăng giảm TSCĐ, form mr.Kỳ(https://app.clickup.com/t/86d0butgj)
 */
/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */ 
define([
    '../common/scv_common_rpt_fa_movement.js',
    
    '../cons/scv_cons_format.js',
],

function(
    cmRptFaMvmt,

    constFormat,
) {
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
        
    }
    
    const onSearchResult = async (isExport) => {
        let isValid = _scvForm.validateFieldMandatory([
           'custpage_subsidiary', 'custpage_fromdt', 'custpage_todt'
        ]);
        if(!isValid) return;

        _scvForm.showLoadingDialog(true);

        let params = _scvForm.getParameter();
    
        let arrActionFunc = [
            {action: 'getDataFaMvmtSS01', params: {...params}, data: []},
            {action: 'getDataFaMvmtSS02', params: {...params}, data: []},
        ]
        
        _scvForm.ajax.postAsyncMultiFetchSSPage(_scvForm.serviceScript.url, arrActionFunc, async function (_res){
            let arrResult = syncDataResultMapped(_res, params);

            if(isExport == 'T'){
                await onExportResultData(arrResult, params);
            }

            _scvDx.setDataSource('custpage_grid_result', arrResult);
            _scvForm.showLoadingDialog(false);
        });
    }

    const syncDataResultMapped = (arrResponse, params) => {
        let arrFaMvmtSS01 = _scvForm.getResultActionPage(arrResponse, 'getDataFaMvmtSS01');
        let arrFaMvmtSS02 = _scvForm.getResultActionPage(arrResponse, 'getDataFaMvmtSS02');

        cmRptFaMvmt.setDataInput({
            arrFaMvmtSS01, arrFaMvmtSS02, 
            params: params,
        });

        return cmRptFaMvmt.getDataSourceResult();
    }

    const onExportResultData = async (arrResult) => {
        let params = cmRptFaMvmt.params;
        let objTmpl = _scvForm.ajax.post(_scvForm.serviceScript.url,{
            ...params,
            action: "getTemplateExcel",
        }).data;
        let objSubsidiary = objTmpl.subsidiary[0];
        let todateInfo = constFormat.getInfoDate(params.custpage_todt);
        let workbook = await _scvExcelJS.loadWorkbookFromUrl(objTmpl.url);
        let curSheet =  workbook.worksheets[0];
        let idxRowData = 7;
        let idxRowDetailStart = 7;
        let colEnd = 10;
        let arrColumnGrid = cmRptFaMvmt.getColumnGrid();

        _scvExcelJS.replaceKey(curSheet, [
            "{pSubsidiary}", "{pSubsidiaryAddress}", "{pDateReport}"
        ], [
            objSubsidiary.legalname, objSubsidiary.mainaddress_display, `Tháng ${todateInfo.mm} năm ${todateInfo.yyyy}`
        ]);

        for(let i = 0; i < arrResult.length; i++){
            let objRes = arrResult[i];

            curSheet.insertRow(idxRowData, [
                objRes.asset_code, objRes.asset_name, 
                objRes.units_display, objRes.movement_date,
                objRes.movement_code, objRes.opening_cost,
                objRes.cost_increase, objRes.cost_decrease,
                objRes.dep_increase, objRes.dep_decrease,

            ]);

            arrColumnGrid.forEach((objCol, idxCol) => {
                let cell = curSheet.getCell(idxRowData, idxCol + 1);
                
                if(objCol.dataType == "number"){
                    cell.numFmt = objCol.format;
                }
                
            });
            
            _scvExcelJS.extendGridStyleRow(curSheet, {row: idxRowData, col: 1}, {row: idxRowData, col: colEnd}, objRes);

            idxRowData++
        }

        _scvExcelJS.createBorderWithRange(curSheet, 
            {row: idxRowDetailStart, col: 1}, 
            {row: idxRowData -1, col: colEnd},
            "thin",
            {rowStyle: "thin", colStyle: "thin"}
        );

        _scvExcelJS.createFontsWithRange(curSheet, 
            {row: idxRowDetailStart, col: 1}, 
            {row: idxRowData - 1, col: colEnd},
            { name: 'Times New Roman', size: 9 }
        );

        _scvExcelJS.syncRangeMergeAfterInsertRow(curSheet, idxRowDetailStart, arrResult.length);
        _scvExcelJS.saveWorkbook(workbook, objTmpl.name);
    }

    return {
        pageInit,
        fieldChanged,
        onSearchResult,
    };
    
});
