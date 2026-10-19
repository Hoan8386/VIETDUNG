/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  10 Jul 2025         Huy Pham			    Init, create file, Phát triển báo cáo tổng hợp và chi tiết kết quả sản xuất,from mr.Trương Minh Phúc(https://app.clickup.com/t/86czjzct2)
 *  16 Jul 2025         Huy Pham			    Update logic, from mr.TMPhúc(https://app.clickup.com/t/86czjzct2?comment=90160122733369)
 *  06 Aug 2025         Huy Pham			    Điều chỉnh #005->#008, from mr.TMPhúc(https://app.clickup.com/t/86czjzct2?comment=90160125571957)
 *  11 Aug 2025         Huy Pham			    Điều chỉnh & bổ sung type, from mr.TMPhúc(https://app.clickup.com/t/86czjzct2?comment=90160125571957&threadedComment=90160126831766)
 *  03 Oct 2025         Huy Pham                Type 03, #017->#018, from mr.Phúc(https://app.clickup.com/t/86czjzct2?comment=90160137526808)
 *  10 Oct 2025         Huy Pham                Điều chỉnh, #018->#019, from mr.Phúc(https://app.clickup.com/t/86czjzct2?comment=90160139042550)
 */
/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */ 
define([
    '../common/scv_common_rpt_mfg_result.js',
    '../cons/scv_cons_record.js',
],

function(
    commonRptMfgResult,
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
            "custpage_rpttype", "custpage_workcenter", 
            "custpage_grplvl_1", "custpage_grplvl_2"
        ]);

        setOptionGridResult();
        disabledFields();
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
                initFieldPeriodType(curRec);
                initDataGrid();
                disabledFields();
            break;
            case "custpage_subsidiary":
                initFieldWorkCenter(curRec);
            break;
            case "custpage_grplvl_1":
                initFieldGroupLevel02(curRec);
            break;
            case "custpage_periodtype":
                initDataGrid();
            break;
        }
    }

    const disabledFields = () =>{
        let curRec = _scvForm.currentRecord;

        let rptTypeId = curRec.getValue("custpage_rpttype");


        if(rptTypeId == commonRptMfgResult.ReportType._03Detail.ID){
            nlapiSetFieldDisabled("custpage_item", false);

            nlapiSetFieldDisabled("custpage_brand", true);
            nlapiSetFieldDisabled("custpage_dodaynhom", true);
        }
        else{
            nlapiSetFieldDisabled("custpage_item", true);

            nlapiSetFieldDisabled("custpage_brand", false);
            nlapiSetFieldDisabled("custpage_dodaynhom", false);
        }
    }

    const setOptionGridResult = () => {
        _scvDx.setOption("custpage_grid_result", "onRowDblClick", function(e){
            if(!!e.data.so_internalid){
                window.open("/app/accounting/transactions/salesord.nl?id=" + e.data.so_internalid)
            }
        });

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
        let rptTypeId = _scvForm.currentRecord.getValue("custpage_rpttype");
        let periodTypeId = _scvForm.currentRecord.getValue("custpage_periodtype");

        _scvDx.setDataSource("custpage_grid_result", []);
        _scvDx.setColumns("custpage_grid_result", commonRptMfgResult.getColumns(rptTypeId, periodTypeId));

        _scvDx.getInstanceDx("custpage_grid_result").refresh();
    }

    const initFieldPeriodType = (_curRec) => {
        let rptTypeId = _curRec.getValue("custpage_rpttype");

        let typePeriodField = _curRec.getField("custpage_periodtype");

        if(rptTypeId == commonRptMfgResult.ReportType._03Detail.ID){
            typePeriodField.isMandatory = false;
            typePeriodField.isDisabled  = true;
        }
        else{
            typePeriodField.isMandatory = true;
            typePeriodField.isDisabled  = false;
        }
    }

    const initFieldWorkCenter = (_curRec) =>{
        let params = _scvForm.getParameter();
        params.action = "getDataWorkCenter";

        _scvForm.ajax.postAsync(_scvForm.serviceScript.url, params, function (_res){
            constRecord.initQuickFindFieldSelect(_curRec, "custpage_workcenter", {
                data: _res.data,
                valueExpr: "internalid",
                displayExpr: "groupname",
                reInsertOption: true
            });
        });
    }

    const initFieldGroupLevel02 = (_curRec) =>{
        let params = _scvForm.getParameter();
        params.action = "getDataGroupLevel02";

        _scvForm.ajax.postAsync(_scvForm.serviceScript.url, params, function (_res){
            constRecord.initQuickFindFieldSelect(_curRec, "custpage_grplvl_2", {
                data: _res.data,
                valueExpr: "internalid",
                displayExpr: "name",
                reInsertOption: true
            });
        });
    }

    const onSearchResult = async (_isExport) => {
        let isValid = _scvForm.validateFieldMandatory([
            "custpage_rpttype", "custpage_subsidiary", 
            "custpage_fromdt", "custpage_todt"
        ]);
        if(!isValid) return;

        _scvForm.showLoadingDialog(true);

        let params = _scvForm.getParameter();

        let arrActionFunc = [];

        if(params.custpage_rpttype == commonRptMfgResult.ReportType._01SummaryACP.ID){
            arrActionFunc.push(
                {action: "getDataMfgProdResultACPSummarySS01", params: {...params}, data: []},
                {action: "getDataMfgPhePhuPhamtACPSummarySS02", params: {...params}, data: []},
                {action: "getDataMfgInspectionResultACPSummarySS03", params: {...params}, data: []},
            );
        }
        else if(params.custpage_rpttype == commonRptMfgResult.ReportType._02SummaryAC.ID){
            arrActionFunc.push(
                {action: "getDataMfgProdResultACSummarySS04", params: {...params}, data: []},
                {action: "getDataMfgPhePhuPhamACSummarySS05", params: {...params}, data: []},
                {action: "getDataMfgInspectionResultACSummarySS12", params: {...params}, data: []},
            );
        }
        else if(params.custpage_rpttype == commonRptMfgResult.ReportType._03Detail.ID){
            arrActionFunc.push(
                {action: "getDataMfgProdResultDetailSS06", params: {...params}, data: []},
                {action: "getDataMfgPhePhuPhamDetailSS07", params: {...params}, data: []},
                {action: "getDataMfgInspectionResultDetailSS08", params: {...params}, data: []},
                {action: "getDataMfgInventoryReceivingSS09", params: {...params}, data: []},
                {action: "getDataMfgTotalByTransDetailSS10", params: {...params}, data: []},
            );
        }
        else if(params.custpage_rpttype == commonRptMfgResult.ReportType._04TongHopKetQuaSXACP_TheoMayNhomKeHoach.ID){
            arrActionFunc.push(
                {action: "getDataMfgProdResultACPSummarySS01", params: {...params}, data: []},
                {action: "getDataMfgPhePhuPhamtACPSummarySS02", params: {...params}, data: []},
                {action: "getDataMfgInspectionResultACPSummarySS03", params: {...params}, data: []},
            );
        }
        else if(params.custpage_rpttype == commonRptMfgResult.ReportType._05TongHopKetQuaSXACP_TheoMayNhomKeHoach.ID){
            arrActionFunc.push(
                {action: "getDataMfgProdResultACPSummarySS01", params: {...params}, data: []},
                {action: "getDataMfgPhePhuPhamtACPSummarySS02", params: {...params}, data: []},
                {action: "getDataMfgInspectionResultACPSummarySS03", params: {...params}, data: []},
                {action: "getDataMfgNhanCongtACPSummarySS011", params: {...params}, data: []},
            );
        }
        else if(params.custpage_rpttype == commonRptMfgResult.ReportType._06TongHopKetQuaSXAC_TheoNhomKeHoach.ID){
            arrActionFunc.push(
                {action: "getDataMfgProdResultACSummarySS04", params: {...params}, data: []},
                {action: "getDataMfgPhePhuPhamACSummarySS05", params: {...params}, data: []},
                {action: "getDataMfgInspectionResultACSummarySS12", params: {...params}, data: []},
            );
        }
        
        _scvForm.ajax.postAsyncMultiFetchSSPage(_scvForm.serviceScript.url, arrActionFunc, async function (_res){
            let arrResult = syncDataResultMapped(_res, params);

            if(_isExport == "T"){
                await onExportResultData(arrResult, params);
            }else{
                _scvDx.setColumns("custpage_grid_result", commonRptMfgResult.getColumns(params.custpage_rpttype));
                _scvDx.setDataSource("custpage_grid_result", [...arrResult]);
            }

            _scvForm.showLoadingDialog(false);
        });
    }

    const syncDataResultMapped = (_arrResponse, _params) => {
        let arrProdResultACPSummary = [], arrPhePhuPhamACPSummary = [], arrInspectionResultACPSummary = [];
        let arrProdResultACSummary = [], arrPhePhuPhamACSummary = [];
        let arrProdResultDetail = [], arrPhePhuPhamDetail = [];
        let arrInspectionResultDetail = [], arrInventoryReceiving = [];

        let arrNhanCongtACPSummary = [];
        let arrInspectionResultACSummary = [];
        let arrTotalByTransDetail = [];
        
        if(_params.custpage_rpttype == commonRptMfgResult.ReportType._01SummaryACP.ID){
            arrProdResultACPSummary = _scvForm.getResultActionPage(_arrResponse, "getDataMfgProdResultACPSummarySS01");
            arrPhePhuPhamACPSummary = _scvForm.getResultActionPage(_arrResponse, "getDataMfgPhePhuPhamtACPSummarySS02");
            arrInspectionResultACPSummary = _scvForm.getResultActionPage(_arrResponse, "getDataMfgInspectionResultACPSummarySS03");
        }
        else if(_params.custpage_rpttype == commonRptMfgResult.ReportType._02SummaryAC.ID){
            arrProdResultACSummary = _scvForm.getResultActionPage(_arrResponse, "getDataMfgProdResultACSummarySS04");
            arrPhePhuPhamACSummary = _scvForm.getResultActionPage(_arrResponse, "getDataMfgPhePhuPhamACSummarySS05");
            arrInspectionResultACSummary = _scvForm.getResultActionPage(_arrResponse, "getDataMfgInspectionResultACSummarySS12");
        }
        else if(_params.custpage_rpttype == commonRptMfgResult.ReportType._03Detail.ID){
            arrProdResultDetail = _scvForm.getResultActionPage(_arrResponse, "getDataMfgProdResultDetailSS06");
            arrPhePhuPhamDetail = _scvForm.getResultActionPage(_arrResponse, "getDataMfgPhePhuPhamDetailSS07");
            arrInspectionResultDetail = _scvForm.getResultActionPage(_arrResponse, "getDataMfgInspectionResultDetailSS08");
            arrInventoryReceiving = _scvForm.getResultActionPage(_arrResponse, "getDataMfgInventoryReceivingSS09");
            arrTotalByTransDetail = _scvForm.getResultActionPage(_arrResponse, "getDataMfgTotalByTransDetailSS10");
        }
        else if(_params.custpage_rpttype == commonRptMfgResult.ReportType._04TongHopKetQuaSXACP_TheoMayNhomKeHoach.ID){
            arrProdResultACPSummary = _scvForm.getResultActionPage(_arrResponse, "getDataMfgProdResultACPSummarySS01");
            arrPhePhuPhamACPSummary = _scvForm.getResultActionPage(_arrResponse, "getDataMfgPhePhuPhamtACPSummarySS02");
            arrInspectionResultACPSummary = _scvForm.getResultActionPage(_arrResponse, "getDataMfgInspectionResultACPSummarySS03");
        }
        else if(_params.custpage_rpttype == commonRptMfgResult.ReportType._05TongHopKetQuaSXACP_TheoMayNhomKeHoach.ID){
            arrProdResultACPSummary = _scvForm.getResultActionPage(_arrResponse, "getDataMfgProdResultACPSummarySS01");
            arrPhePhuPhamACPSummary = _scvForm.getResultActionPage(_arrResponse, "getDataMfgPhePhuPhamtACPSummarySS02");
            arrInspectionResultACPSummary = _scvForm.getResultActionPage(_arrResponse, "getDataMfgInspectionResultACPSummarySS03");
            arrNhanCongtACPSummary = _scvForm.getResultActionPage(_arrResponse, "getDataMfgNhanCongtACPSummarySS011");
        }
        else if(_params.custpage_rpttype == commonRptMfgResult.ReportType._06TongHopKetQuaSXAC_TheoNhomKeHoach.ID){
            arrProdResultACSummary = _scvForm.getResultActionPage(_arrResponse, "getDataMfgProdResultACSummarySS04");
            arrPhePhuPhamACSummary = _scvForm.getResultActionPage(_arrResponse, "getDataMfgPhePhuPhamACSummarySS05");
            arrInspectionResultACSummary = _scvForm.getResultActionPage(_arrResponse, "getDataMfgInspectionResultACSummarySS12");
        }

        commonRptMfgResult.setDataInput({
            arrProdResultACPSummary, arrPhePhuPhamACPSummary, arrInspectionResultACPSummary,
            arrProdResultACSummary, arrPhePhuPhamACSummary,
            arrProdResultDetail, arrPhePhuPhamDetail, arrInspectionResultDetail, arrInventoryReceiving,
            arrNhanCongtACPSummary, arrInspectionResultACSummary, arrTotalByTransDetail,
            params: _params,
        });

        return commonRptMfgResult.getDataSourceResult();
    }

    const onExportResultData = async (_arrResult) => {
        let params = commonRptMfgResult.params;

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

        _scvExcelJS.replaceKey(worksheet, [
            "{pSubsidiary}", "{pSubsidiaryAddress}",
            "{pFromDate}", "{pToDate}",
            "{pReportName}"
        ], [
            objSubsidiary.legalname, objSubsidiary.mainaddress_display,
            params.custpage_fromdt, params.custpage_todt,
            ("BÁO CÁO " + params.custpage_rpttype_display).toUpperCase()
        ]);

        let arrColumnGrid = commonRptMfgResult.getColumns(params.custpage_rpttype);

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
        onSearchResult,
    };
    
});
