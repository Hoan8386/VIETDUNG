/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  03 Nov 2025         Huy Pham			    Init, create file, Phát triển báo cáo phân tích giá thành, from mr.Trương Minh phúc(https://app.clickup.com/t/86d0tym86)
 */
/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */ 
define([
    '../common/scv_common_rpt_cost_anlyt.js',
    '../cons/scv_cons_record.js',
],

function(
    commonRptCostAnlyt,
    constRecord,
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

        constRecord.pageInitQuickFindFieldSelect(curRec, [
            "custpage_rpttype", "custpage_subsidiary", "custpage_location",
        ]);

        setOptionGridResult();
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
        
        switch(fieldId){
            case "custpage_rpttype":
                initDataGrid();
            break;
            case "custpage_subsidiary":
                initFieldLocation(curRec);
            break;
        }
    }

    const setOptionGridResult = () => {
        let currentToolbar = _scvDx.getOption("custpage_grid_result",  "toolbar") || { items: [] };

        currentToolbar.items.push({
            location: "before",
            widget: "dxButton",
            options: {
                icon: "export",
                text: "Export of Result",
                onClick: async () => {
                    let arrResOfGrid = _scvDx.getDataSource("custpage_grid_result");

                    onExportResultData(arrResOfGrid);
                }
            }
        });

        _scvDx.setOption("custpage_grid_result",  "toolbar", currentToolbar)
        _scvDx.getInstanceDx("custpage_grid_result").refresh();
    }

    const initDataGrid = () => {
        let params = _scvForm.getParameter();

        _scvDx.setDataSource("custpage_grid_result", []);
        _scvDx.setColumns("custpage_grid_result", commonRptCostAnlyt.getColumns(params));

        _scvDx.getInstanceDx("custpage_grid_result").refresh();
    }

    const initFieldLocation = (_curRec) =>{
        let params = _scvForm.getParameter();
        params.action = "getDataLocation";

        _scvForm.ajax.postAsync(_scvForm.serviceScript.url, params, function (_res){
            constRecord.initQuickFindFieldSelect(_curRec, "custpage_location", {
                data: _res.data,
                valueExpr: "internalid",
                displayExpr: "name",
                reInsertOption: true
            });
        });
    }

    const searchResult = async (_isExport) => {
        let isValid = _scvForm.validateFieldMandatory([
            "custpage_rpttype", "custpage_subsidiary", 
            "custpage_fromdt", "custpage_todt"
        ]);
        if(!isValid) return;

        _scvForm.showLoadingDialog(true);

        let params = _scvForm.getParameter();

        let arrActionFunc = [];

        if(params.custpage_rpttype == commonRptCostAnlyt.ReportType._01GiaThanhTheoGiaTri.ID){
            arrActionFunc.push(
                {action: "scv_cons_search_rpt_cost_anlyt_01", params: {...params}, data: []},
            );
        }
        else if(params.custpage_rpttype == commonRptCostAnlyt.ReportType._02GiaThanhTheoSoLuong.ID){
            arrActionFunc.push(
                {action: "scv_cons_search_rpt_cost_anlyt_02", params: {...params}, data: []},
                {action: "scv_cons_search_rpt_cost_anlyt_03", params: {...params}, data: []},
                {action: "scv_cons_search_rpt_cost_anlyt_04", params: {...params}, data: []},
            );
        }
        
        _scvForm.ajax.postAsyncMultiFetchSSPage(_scvForm.serviceScript.url, arrActionFunc, async function (_res){

            let arrResValue01 = [];
            let arrResDetail02 = [];
            let arrResSummary03 = [];
            let arrResBomForWO04 = [];
            if(params.custpage_rpttype == commonRptCostAnlyt.ReportType._01GiaThanhTheoGiaTri.ID){
                arrResValue01 = _scvForm.getResultActionPage(_res, "scv_cons_search_rpt_cost_anlyt_01");
            }
            else if(params.custpage_rpttype == commonRptCostAnlyt.ReportType._02GiaThanhTheoSoLuong.ID){
                arrResDetail02 = _scvForm.getResultActionPage(_res, "scv_cons_search_rpt_cost_anlyt_02");
                arrResSummary03 = _scvForm.getResultActionPage(_res, "scv_cons_search_rpt_cost_anlyt_03");
                arrResBomForWO04 = _scvForm.getResultActionPage(_res, "scv_cons_search_rpt_cost_anlyt_04");
            }

            commonRptCostAnlyt.setDataInput({
                params,
                arrResValue01, arrResDetail02, arrResSummary03, arrResBomForWO04,
            });
            
            let arrResult = commonRptCostAnlyt.getDataSourceResult();

            if(_isExport == "T"){
                await onExportResultData(arrResult, params);
            }else{
                _scvDx.setColumns("custpage_grid_result", commonRptCostAnlyt.getColumns(params));
                _scvDx.setDataSource("custpage_grid_result", [...arrResult]);
            }

            _scvForm.showLoadingDialog(false);
        });
    }

    const onExportResultData = async (_arrResult) => {
        let params = commonRptCostAnlyt.params;

        if(_arrResult.length == 0){
            params = _scvForm.getParameter();
        }

        let objTmpl = _scvForm.ajax.post(_scvForm.serviceScript.url,{
            ...params,
            action: "getTemplateExcel",
        }).data;

        let objSubsidiary = objTmpl.subsidiary[0];

        let workbook = await _scvExcelJS.loadWorkbookFromUrl(objTmpl.url);
        let worksheet =  workbook.worksheets[0];

        let rptName = "PHÂN TÍCH GIÁ THÀNH SẢN PHẨM";
        if(params.custpage_rpttype == commonRptCostAnlyt.ReportType._01GiaThanhTheoGiaTri.ID){
            rptName += " (THEO GIÁ TRỊ)";
        }
        else if(params.custpage_rpttype == commonRptCostAnlyt.ReportType._02GiaThanhTheoSoLuong.ID){
            rptName += " (THEO SỐ LƯỢNG)";
        }

        _scvExcelJS.replaceKey(worksheet, [
            "{pSubsidiary}", "{pSubsidiaryAddress}",
            "{pFromDate}", "{pToDate}",
            "{pReportName}"
        ], [
            objSubsidiary.legalname, objSubsidiary.mainaddress_display,
            params.custpage_fromdt, params.custpage_todt,
            rptName
        ]);

        let arrColumnGrid = commonRptCostAnlyt.getColumns(params);

        arrColumnGrid = _scvExcelJS.extendGridColumnVisible(arrColumnGrid);
        
        let objRenderColumn = _scvExcelJS.extendGridRenderColumn(worksheet, arrColumnGrid, 7, 1);

        let arrColumnFlat = _scvExcelJS.extendGridColumnFlat(arrColumnGrid);

        let idxRowDetailStart = objRenderColumn.row_end + 1;
        let idxRowDetailEnd = objRenderColumn.row_end + 1;
        let idxColDetailEnd = objRenderColumn.col_end;

        for(let i = 0; i < _arrResult.length; i++){
            let objRes = _arrResult[i];

            let arrValues = [];

            arrColumnFlat.forEach(objCol => {
                let dataField = objCol.dataField;

                arrValues.push(objRes[dataField] || "");
            });

            worksheet.insertRow(idxRowDetailEnd, arrValues, "o+");

            arrColumnFlat.forEach((objCol, idxCol) => {
                if(objCol.dataType != "number") return;

                let currentCell = worksheet.getCell(idxRowDetailEnd, idxCol + 1);

                currentCell.numFmt = objCol.formatXls;
            });
            
            if(objRes.lvl == 1){
                _scvExcelJS.syncRangeMergeAfterInsertRow(worksheet, idxRowDetailEnd, 1);
                worksheet.mergeCells(idxRowDetailEnd, 1, idxRowDetailEnd, 4);
            }

            _scvExcelJS.extendGridStyleRow(worksheet,
                {row: idxRowDetailEnd, col: 1},
                {row: idxRowDetailEnd, col: idxColDetailEnd},
                objRes
            );

            idxRowDetailEnd++;
        }

        if(_arrResult.length > 0){
            idxRowDetailEnd -= 1;
        }

        _scvExcelJS.createBorderWithRange(worksheet, 
            {row: idxRowDetailStart, col: 1}, 
            {row: idxRowDetailEnd, col: idxColDetailEnd},
            "thin",
            {rowStyle: "thin", colStyle: "thin"}
        );

        _scvExcelJS.saveWorkbook(workbook, (params.custpage_rpttype_display || objTmpl.name) + ".xlsx");
    }

    return {
        pageInit,
        fieldChanged,
        searchResult,
    };
    
});
