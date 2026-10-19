/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  21 May 2025         Huy Pham			    Init, create file, báo cáo phương án bán hàng,from ms.Ngọc(https://app.clickup.com/t/86cyzcz1u)
 *  30 Jun 2025         Huy Pham			    Update default Split Result, CK hiện tại, từ ms.Ngọc(https://app.clickup.com/t/86cyzcz1u?comment=90160118821507)
 *  11 Sep 2025         Huy Pham                Bổ sung filter Location, from ms.Ngọc(https://app.clickup.com/t/86cyzcz1u?comment=90160133652302)
 */
/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */ 
define([
    '../lib/scv_lib_cs_xls.js', '../olib/alasql/alasql.min@1.7.3.js',
    '../common/scv_common_rpt_pabh.js',
    '../cons/scv_cons_record.js',
    '../cons/scv_cons_format.js'
],

function(
    libCsXLS, alasql,
    commonRptPabh,
    constRecord,
    constFormat
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
            "custpage_entitycategory", "custpage_customer",
            "custpage_grouplevel1", "custpage_grouplevel2",
            "custpage_location"
        ]);
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

        if(["custpage_subsidiary", "custpage_entitycategory"].includes(fieldId)){
            initFieldCustomer(curRec);
            initFieldLocation(curRec);
        }
        else if(["custpage_grouplevel1"].includes(fieldId)){
            initFieldGroupLevel2(curRec);
        }
        else if(["custpage_grouplevel2"].includes(fieldId)){
            let isSplitResult = false;

            let groupLevel2Id = curRec.getValue("custpage_grouplevel2");
            if(!!groupLevel2Id.toString()){
                isSplitResult = true;
            }

            curRec.setValue("custpage_splitresult", isSplitResult)
        }
    }

    const initFieldCustomer = (_curRec) =>{
        let params = _scvForm.getParameter();
        params.action = "getDataCustomerSS02";

        _scvForm.ajax.postAsync(_scvForm.serviceScript.url, params, function (_res){
            constRecord.initQuickFindFieldSelect(_curRec, "custpage_customer", {
                data: _res.data,
                valueExpr: "internalid",
                reInsertOption: true
            });
        });
    }

    const initFieldLocation = (_curRec) =>{
        let params = _scvForm.getParameter();
        params.action = "getDataLocation";

        _scvForm.ajax.postAsync(_scvForm.serviceScript.url, params, function (_res){
            constRecord.initQuickFindFieldSelect(_curRec, "custpage_location", {
                data: _res.data,
                valueExpr: "internalid", displayExpr: "name",
                reInsertOption: true
            });
        });
    }

    const initFieldGroupLevel2 = (_curRec) =>{
        let params = _scvForm.getParameter();
        params.action = "getDataGroupLevel2SS04";

        _scvForm.ajax.postAsync(_scvForm.serviceScript.url, params, function (_res){
            constRecord.initQuickFindFieldSelect(_curRec, "custpage_grouplevel2", {
                data: _res.data,
                valueExpr: "internalid",
                reInsertOption: true
            });
        });
    }

    const onSearchResult = async () => {
        let isValid = _scvForm.validateFieldMandatory([
            "custpage_subsidiary", "custpage_date", 
            "custpage_entitycategory", "custpage_grouplevel1"
        ]);
        if(!isValid) return;

        _scvForm.showLoadingDialog(true);

        let params = _scvForm.getParameter();

        let arrActionFunc = [
            {action: "getDataTransSalesSS05", params: {...params}, data: []},
            {action: "getDataSalesTermSS06", params: {...params}, data: []}
        ];
        
        _scvForm.ajax.postAsyncMultiFetchSSPage(_scvForm.serviceScript.url, arrActionFunc, function (_res){
            let arrResult = syncDataResultMapped(_res, params);

            _scvDx.setDataSource("custpage_grid_result", [...arrResult]);

            _scvForm.showLoadingDialog(false);
        });
    }

    const syncDataResultMapped = (_arrResponse, _params) => {
        let arrTransSales = _scvForm.getResultActionPage(_arrResponse, "getDataTransSalesSS05");
        let arrSalesTerm = _scvForm.getResultActionPage(_arrResponse, "getDataSalesTermSS06");
        
        commonRptPabh.setDataInput({arrTransSales, arrSalesTerm, parameters: _params});
        
        let arrResult = commonRptPabh.getDataSourceResult();
        
        _scvDx.setDataSource("dataPivotGrid", [...arrTransSales])

        return arrResult;
    }

    const onExportResult = async () => {
        let arrLineSelected = _scvDx.getDataSource("custpage_grid_result").filter(e => e.checked);
        if(arrLineSelected.length == 0){
            _scvForm.showMsgError("Vui lòng chọn ít nhất 1 dòng để xuất dữ liệu!");
            return;
        }

        let params = _scvForm.getParameter();
        let paramsLastSearch = commonRptPabh.getParameterLastSearch();

        let objDateOfLastSearch = constFormat.getInfoDate(paramsLastSearch.custpage_date);

        let date_3MonthAgo = constFormat.getBeginOfMonth(constFormat.addMonth(paramsLastSearch.custpage_date, -2));
        let date_thisMonth = constFormat.getBeginOfMonth(paramsLastSearch.custpage_date);
        let this_month = "Tháng " + objDateOfLastSearch.mm * 1;
        let next_month = "Tháng " + constFormat.getMM(constFormat.addMonth(paramsLastSearch.custpage_date, 1)) * 1;

        let objResTmpl = getTemplateExportExcel();

        let objResSubsidiary = objResTmpl.subsidiary;

        let workbook = await libCsXLS.loadWorkbookFromUrl(objResTmpl.url);

        let tmplSheet = workbook.worksheets[0];

        let col_end = 9;
        let idxRowTotal = 6;
        let idxRowDataDetail = 7;

        let numFmtVnd = constFormat.getMaskFormatVndXls();
        let arrColNumFmt = [
            {idxCol: 4, numFmt: numFmtVnd},
            {idxCol: 5, numFmt: numFmtVnd},
            {idxCol: 6, numFmt: "0%"},
            {idxCol: 7, numFmt: "0.#%"},
            {idxCol: 8, numFmt: "0.#%"},
        ];

        let arrResItemGroup = alasql(`SELECT DISTINCT itemgroup_display FROM ?`, [arrLineSelected]);
        for(let i = 0; i < arrResItemGroup.length; i++){
            let objResItemGroup = arrResItemGroup[i];

            let itemgroup_display = objResItemGroup.itemgroup_display || "- NONE -";
            
            let curSheet = libCsXLS.copyWorkSheet(workbook, tmplSheet, libCsXLS.truncatedSheetName(itemgroup_display), false);
            
            libCsXLS.replaceKeyCellValue(curSheet, "G1", [
                "{pState}", "{pDate}", "{pMonth}", "{pYear}"
            ], [
                objResSubsidiary.state, objDateOfLastSearch.dd, objDateOfLastSearch.mm, objDateOfLastSearch.yyyy
            ]);
            libCsXLS.replaceKeyCellValue(curSheet, "A2", "{pMonthYear}", objDateOfLastSearch.mm + "/" + objDateOfLastSearch.yyyy);
            libCsXLS.replaceKeyCellValue(curSheet, "A3", "{pItemGroup}", itemgroup_display);
            libCsXLS.replaceKeyCellValue(curSheet, "D5", "{pTitleAvg3Month}", `(${date_3MonthAgo} - ${paramsLastSearch.custpage_date})`);
            libCsXLS.replaceKeyCellValue(curSheet, "E5", "{pTitleDate}", paramsLastSearch.custpage_date || "");
            libCsXLS.replaceKeyCellValue(curSheet, "G5", "{pTitleThisMonth}", this_month);
            libCsXLS.replaceKeyCellValue(curSheet, "H5", "{pTitleNextMonth}", next_month);
            libCsXLS.replaceKeyCellValue(curSheet, "A7", "{pNote}", params.custpage_def_note);
            libCsXLS.replaceKeyCellValue(curSheet, "A8", "{pNoteChange}", params.custpage_def_note_change);

            let arrLine = arrLineSelected.filter(e => e.itemgroup_display == objResItemGroup.itemgroup_display);

            curSheet.insertRow(idxRowTotal, [
                "", "Tổng cộng:", "",
                0, 0, "",
                "", "", ""
            ]);

            setDefaultFontCell(curSheet, idxRowTotal);
            setDefaultStyleCellTotal(curSheet, idxRowTotal);

            libCsXLS.syncRangeMergeAfterInsertRow(curSheet, idxRowTotal, 1);
            curSheet.mergeCells(idxRowTotal, 2, idxRowTotal, 3);

            let objResTotal = {amount_avg_3month: 0, amount: 0};
            for(let j = 0; j < arrLine.length; j++){
                let objLine = arrLine[j];
                let idxCurRow = j + idxRowDataDetail;
                
                curSheet.insertRow(idxCurRow, [
                    j + 1, objLine.customer_code, objLine.customer_name,
                    objLine.amount_avg_3month, objLine.amount, objLine.percent_fluctuation,
                    objLine.percent_discount_month, objLine.percent_discount_next_month, objLine.note
                ]);

                libCsXLS.syncRangeMergeAfterInsertRow(curSheet, idxCurRow, 1);

                setDefaultFontCell(curSheet, idxCurRow);

                objResTotal.amount_avg_3month += objLine.amount_avg_3month * 1;
                objResTotal.amount += objLine.amount * 1;

                arrColNumFmt.forEach(e=>{
                    curSheet.getCell(idxCurRow, e.idxCol).numFmt = e.numFmt;
                })
            }

            curSheet.getCell('D' + idxRowTotal).value = {
                formula: `=SUM(D${ idxRowDataDetail }:D${ idxRowDataDetail + arrLine.length })`,
                result: objResTotal.amount_avg_3month
            };
            curSheet.getCell('E' + idxRowTotal).value = {
                formula: `=SUM(E${ idxRowDataDetail }:E${ idxRowDataDetail + arrLine.length })`,
                result: objResTotal.amount
            };

            arrColNumFmt.forEach(e=>{
                curSheet.getCell(idxRowTotal, e.idxCol).numFmt = e.numFmt;
            })

            libCsXLS.createBorderWithRange(curSheet, 
                {row: idxRowTotal, col: 1}, 
                {row: arrLine.length + idxRowTotal, col: col_end},
                "thin", 
                {rowStyle: "thin", colStyle: "thin"}
            );
        }
        
        workbook.removeWorksheet(tmplSheet.id)

        libCsXLS.saveWorkbook(workbook, objResTmpl.name + ".xlsx");
    }

    const setDefaultStyleCellTotal = (_sheet, _row) => {
        _sheet.getRow(_row).eachCell( function(cell, colNumber){
            cell.font = {
                ...cell.font,
                bold: true
            };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FAFAD2' }
            }
        });
    }

    const setDefaultFontCell = (_sheet, _row) => {
        _sheet.getRow(_row).eachCell( function(cell, colNumber){
            cell.font = {
                ...cell.font, 
                family: 1, 
                size: 9, 
                name: "Times New Roman"
            };
            
            //Column: STT
            if(colNumber == 1){
                cell.alignment = {horizontal: 'center' };
            }
        });
    }

    const getTemplateExportExcel = (_params) => {
        let paramsLastSearch = commonRptPabh.getParameterLastSearch();

        return _scvForm.ajax.post(_scvForm.serviceScript.url, {
            ...paramsLastSearch,
            action: "getTemplateExportExcel"
        }).data;
    }

    return {
        pageInit,
        fieldChanged,
        onSearchResult,
        onExportResult
    };
    
});
