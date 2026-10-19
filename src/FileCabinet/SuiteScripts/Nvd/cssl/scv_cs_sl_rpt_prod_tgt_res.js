/**
 * Nội dung:
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  28 Aug 2025         Khanh Tran			    Init, create file. Phát triển báo cáo kết quả mục tiêu sản xuất ACP, form mr.TMPhúc(https://app.clickup.com/t/86d04224z)
 */
/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */ 
define(['N/search',
    '../common/scv_common_rpt_prod_tgt_res.js',
    '../cons/scv_cons_record.js',
    '../cons/scv_cons_entitygroup.js',
],

function(search,
    commRptAcpProdTgtRes,
    constRecord,
    constEntityGroup,
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

        setOptionGridResult();
        
        constRecord.initQuickFindFieldSelect(curRec, "custpage_shift", {
            data: curRec.getField("custpage_shift").getSelectOptions(),
            valueExpr: "value",
            displayExpr: "text",
            reInsertOption: false
        }, false);

        constRecord.initQuickFindFieldSelect(curRec, "custpage_work_center", {
            data: curRec.getField("custpage_work_center").getSelectOptions(),
            valueExpr: "value",
            displayExpr: "text",
            reInsertOption: false
        }, false);

        constRecord.initQuickFindFieldSelect(curRec, "custpage_planing_category", {
            data: curRec.getField("custpage_planing_category").getSelectOptions(),
            valueExpr: "value",
            displayExpr: "text",
            reInsertOption: false
        }, false);

        constRecord.initQuickFindFieldSelect(curRec, "custpage_trademark", {
            data: curRec.getField("custpage_trademark").getSelectOptions(),
            valueExpr: "value",
            displayExpr: "text",
            reInsertOption: false
        }, false);
    }

    const setOptionGridResult = () => {
        _scvDx.setOption("custpage_grid_result", "onCellPrepared", function(e){
            if(e.rowType == "data") {
                let field = e.column.dataField;
                let value = e.data[field];
               
                if (["csm_chenh_lech", "nsm_chenh_lech", "tamb_chenh_lech", "pp_chenh_lech_tlpp", "nt_chenh_lech"].includes(field) && value < 0) {
                    e.cellElement[0].style.color = "red";
                }
            }
        });
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

        if(fieldId == 'custpage_subsidiary'){
            let subsidiaryIdId = curRec.getValue("custpage_subsidiary");

            setTimeout(() => loadFieldDataWorkCenter(curRec, subsidiaryIdId), 0);
        }
        
    }

    const loadFieldDataWorkCenter = (curRec, subsidiaryIdId) => {
        let arrResult = [];

        if(subsidiaryIdId){
            arrResult = constEntityGroup.getDataSource(
                search.createFilter({
                    name: 'custentity_scv_sub',
                    operator: "anyof",
                    values: subsidiaryIdId
                })
            );
        }

        constRecord.initQuickFindFieldSelect(curRec, "custpage_work_center", {
            data: arrResult,
            valueExpr: "internalid",
            displayExpr: "groupname",
            reInsertOption: true
        }, false);
    }

    const onSearchResult = async (_isExport) => {
        let isValid = _scvForm.validateFieldMandatory([
            "custpage_rpttype", "custpage_subsidiary", 
            "custpage_fromdt", "custpage_todt"
        ]);
        if(!isValid) return;

        _scvForm.showLoadingDialog(true);

        let params = _scvForm.getParameter();
        
        delete params.custpage_rpttype_display;
        delete params.custpage_subsidiary_display;
        delete params.custpage_shift_display;
        delete params.custpage_work_center_display;
        delete params.custpage_planing_category_display;
        delete params.custpage_trademark_display;

        let arrActionFunc = [];

        if(params.custpage_rpttype == commRptAcpProdTgtRes.ReportType._01BeforeQcTarget.ID){
            arrActionFunc.push(
                {action: "getDataMfgProdResultSS01", params: {...params}, data: []},
                {action: "getDataMfgScrapSS02", params: {...params}, data: []},
                {action: "getDataWorkbenchSS04", params: {...params}, data: []},
            );
        }
        else if(params.custpage_rpttype == commRptAcpProdTgtRes.ReportType._02AfterQcTarget.ID){
            arrActionFunc.push(
                {action: "getDataMfgProdResultSS01", params: {...params}, data: []},
                {action: "getDataMfgScrapSS02", params: {...params}, data: []},
                {action: "getDataQcResultSS03", params: {...params}, data: []},
                {action: "getDataWorkbenchSS04", params: {...params}, data: []},
            );
        }
        
        _scvForm.ajax.postAsyncMultiFetchSSPage(_scvForm.serviceScript.url, arrActionFunc, async function (_res){
            let arrResult = syncDataResultMapped(_res, params);

            if(_isExport == "T"){
                await onExportResultData(arrResult, params);
            }

            _scvDx.setDataSource("custpage_grid_result", arrResult);
            _scvForm.showLoadingDialog(false);
        });
    }

    const syncDataResultMapped = (arrResponse, params) => {
        let arrMfgProdResultSS01 = [], arrMfgScrapSS02 = [];
        let arrQcResultSS03 = [], arrWorkbenchSS04 = [];
        
        if(params.custpage_rpttype == commRptAcpProdTgtRes.ReportType._01BeforeQcTarget.ID){
            arrMfgProdResultSS01 = _scvForm.getResultActionPage(arrResponse, "getDataMfgProdResultSS01");
            arrMfgScrapSS02 = _scvForm.getResultActionPage(arrResponse, "getDataMfgScrapSS02");
            arrWorkbenchSS04 = _scvForm.getResultActionPage(arrResponse, "getDataWorkbenchSS04");
        }
        else if(params.custpage_rpttype == commRptAcpProdTgtRes.ReportType._02AfterQcTarget.ID){
            arrMfgProdResultSS01 = _scvForm.getResultActionPage(arrResponse, "getDataMfgProdResultSS01");
            arrMfgScrapSS02 = _scvForm.getResultActionPage(arrResponse, "getDataMfgScrapSS02");
            arrQcResultSS03 = _scvForm.getResultActionPage(arrResponse, "getDataQcResultSS03");
            arrWorkbenchSS04 = _scvForm.getResultActionPage(arrResponse, "getDataWorkbenchSS04");
        }

        commRptAcpProdTgtRes.setDataInput({
            arrMfgProdResultSS01, arrMfgScrapSS02, 
            arrQcResultSS03, arrWorkbenchSS04,
            params: params,
        });

        return commRptAcpProdTgtRes.getDataSourceResult();
    }

    const onExportResultData = async (arrResult) => {
        let params = commRptAcpProdTgtRes.params;
        let objTmpl = _scvForm.ajax.post(_scvForm.serviceScript.url,{
            ...params,
            action: "getTemplateExcel",
        }).data;
        let objSubsidiary = objTmpl.subsidiary[0];
        let curDate = new Date();
        let workbook = await _scvExcelJS.loadWorkbookFromUrl(objTmpl.url);
        let curSheet =  workbook.worksheets[0];
        let idxRowData = 10;
        let idxRowDetailStart = 10;
        let colEnd = 24;
        let arrColumnFlat = commRptAcpProdTgtRes.getColumnFlat();

        _scvExcelJS.replaceKey(curSheet, [
            "{pSubsidiary}", "{pSubsidiaryAddress}",
            "{pFromDate}", "{pToDate}", "{pCurDate}"
        ], [
            objSubsidiary.legalname, objSubsidiary.mainaddress_display,
            params.custpage_fromdt, params.custpage_todt,
            `Ngày ${curDate.getDate()} tháng ${curDate.getMonth() + 1} năm ${curDate.getFullYear()}`
        ]);

        for(let i = 0; i < arrResult.length; i++){
            let objRes = arrResult[i];

            curSheet.insertRow(idxRowData, [
                objRes.may, objRes.dong_san_pham, 
                objRes.tg_chay_may, objRes.tg_gian_doan * 1, objRes.tong_tg,
                objRes.thanh_pham_tam,
                objRes.csm_muc_tieu, objRes.csm_thuc_te, objRes.csm_chenh_lech,
                objRes.nsm_muc_tieu, objRes.nsm_thuc_te, objRes.nsm_chenh_lech,
                objRes.tamb_muc_tieu, objRes.tamb_thuc_te, objRes.tamb_chenh_lech,
                objRes.pp_klpp, objRes.pp_tam_3ly_kc, objRes.pp_muc_tieu_tlpp, objRes.pp_thuc_te_tlpp, objRes.pp_chenh_lech_tlpp,
                objRes.nt_muc_tieu, objRes.nt_thuc_te, objRes.nt_chenh_lech,
                objRes.nhom_vun
            ]);

            arrColumnFlat.forEach((objCol, idxCol) => {
                let cell = curSheet.getCell(idxRowData, idxCol + 1);
                let value = objRes[objCol.dataField];
                
                if(objCol.dataType == "number"){
                    cell.numFmt = objCol.format;
                }

                if (["csm_chenh_lech", "nsm_chenh_lech", "tamb_chenh_lech", "pp_chenh_lech_tlpp", "nt_chenh_lech"].includes(objCol.dataField) && value < 0) {
                    cell.font = { 
                        ...(cell.font || {}), 
                        color: { argb: "FFFF0000" } 
                    };
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
            { name: 'Times New Roman', size: 10 }
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
