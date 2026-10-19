/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  19 Jun 2025         Huy Pham			    Init, create file, báo cáo đối chiếu công nợ,from ms.Ngọc(https://app.clickup.com/t/86czaq0qp)
 */
/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */ 
define([
    '../common/scv_common_rpt_dccn.js',
    '../cons/scv_cons_record.js',
    '../cons/scv_cons_format.js',
],

function(
    commonRptDccn,
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

        constRecord.pageInitQuickFindFieldSelect(curRec, ["custpage_customer", "custpage_entitycategory"]);

        setOptionGridResult();
    }

    const setOptionGridResult = () => {
        _scvDx.setOption("custpage_grid_result", "onRowDblClick", function(e){
            if(!!e.data.internal_id){
                window.open("/app/accounting/transactions/transaction.nl?id=" + e.data.internal_id)
            }
        });

        let currentToolbar = _scvDx.getOption("custpage_grid_result",  "toolbar") || { items: [] };

        currentToolbar.items.push({
            location: "before",
            widget: "dxButton",
            options: {
                icon: "exportxlsx",
                text: "Download Excel",
                onClick: async () => {
                    let params = commonRptDccn.params;

                    if(!params.custpage_subsidiary){
                        params = _scvForm.getParameter();
                    }
                    params.custpage_owner = _scvForm.currentRecord.getValue("custpage_owner") || "";

                    let arrResOfGrid = _scvDx.getDataSource("custpage_grid_result")||[];
                    
                    onExportResultData(arrResOfGrid, params);
                }
            }
        });

        currentToolbar.items.push({
            location: "before",
            widget: "dxButton",
            options: {
                icon: "pdffile",
                text: "Download PDF",
                onClick: async () => {
                    downloadResultFilePDF();
                }
            }
        });

        _scvDx.setOption("custpage_grid_result",  "toolbar", currentToolbar)
        _scvDx.getInstanceDx("custpage_grid_result").refresh();
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
            case "custpage_subsidiary":
            case "custpage_entitycategory":
                initFieldCustomer(curRec);
            break;
        }
    }

    const initFieldCustomer = (_curRec) =>{
        let params = _scvForm.getParameter();
        params.action = "getDataCustomer";

        _scvForm.ajax.postAsync(_scvForm.serviceScript.url, params, function (_res){
            constRecord.initQuickFindFieldSelect(_curRec, "custpage_customer", {
                data: _res.data.arrResult,
                valueExpr: "internalid",
                displayExpr: "entityid",
                reInsertOption: true
            });
        });
    }

    const onSearchResult = async (_isExport) => {
        let isValid = _scvForm.validateFieldMandatory([
            "custpage_subsidiary", 
            "custpage_fromdt", "custpage_todt"
        ]);
        if(!isValid) return;

        _scvForm.showLoadingDialog(true);

        let params = _scvForm.getParameter();

        delete params.custpage_customer_display;

        let arrActionFunc = [
            {action: "getDataCustomer", params: {...params}, data: []},
            {action: "getDataSoDuSS01", params: {...params}, data: []},
            {action: "getDataXuatKhoSS02", params: {...params}, data: []},
            {action: "getDataThanhToanSS03", params: {...params}, data: []},
        ];
        
        _scvForm.ajax.postAsyncMultiFetchSSPage(_scvForm.serviceScript.url, arrActionFunc, async function (_res){
            let arrResult = syncDataResultMapped(_res, params);

            if(_isExport == "T"){
                await onExportResultData(arrResult, params);
            }else{
                _scvDx.setDataSource("custpage_grid_result", [...arrResult]);
            }

            _scvForm.showLoadingDialog(false);
        });
    }

    const syncDataResultMapped = (_arrResponse, _params) => {
        let arrCustomer = _scvForm.getResultActionPage(_arrResponse, "getDataCustomer");
        let arrSoDu = _scvForm.getResultActionPage(_arrResponse, "getDataSoDuSS01");
        let arrXuatKho = _scvForm.getResultActionPage(_arrResponse, "getDataXuatKhoSS02");
        let arrThanhToan = _scvForm.getResultActionPage(_arrResponse, "getDataThanhToanSS03");
        
        commonRptDccn.setDataInput({arrCustomer, arrSoDu, arrXuatKho, arrThanhToan, params: _params});
        
        let arrResult = commonRptDccn.getDataSourceResult();

        return arrResult;
    }

    const onExportResultData = async (_arrResult, _params) => {
        let arrResEntity = _arrResult.filter(e => e.lvl == 2);
        if(arrResEntity.length == 0) return;

        let arrResEntityId = arrResEntity.map(e => e.entity_id);

        let objTmpl = _scvForm.ajax.post(_scvForm.serviceScript.url,{
            ..._params,
            action: "getTemplateExcel",
            entity_id: arrResEntityId.join(","),
        }).data;

        let arrSubsidiary = objTmpl.subsidiary;

        if(arrResEntity.length == 1){
            let arrResDetail = _arrResult.filter(e => e.idxRowParent == arrResEntity[0].idxRow);

            let workbook = await createWorkbookResult(objTmpl, arrResDetail, _params);

            _scvExcelJS.saveWorkbook(workbook, objTmpl.name + ".xlsx");
        }
        else{
            let folderZip = new JSZip();

            for(let i = 0; i < arrResEntity.length; i++){
                let objResEntity = arrResEntity[i];
                
                let arrResDetail = _arrResult.filter(e => e.idxRowParent == objResEntity.idxRow);

                let workbook = await createWorkbookResult(objTmpl, arrResDetail, _params);

                folderZip.file(objTmpl.name + "_" + objResEntity.entity_name + '.xlsx', await workbook.xlsx.writeBuffer());
            }

            let zipBlob = await folderZip.generateAsync({ type: 'blob' });

            saveAs(zipBlob, "EXCEL_" + objTmpl.name + '_' + arrResEntity.length + '.zip', {type: "application/zip"});
        }
    }

    const createWorkbookResult = async (_objTmpl, _arrResultDetail, _params) =>{
        let workbook = await _scvExcelJS.loadWorkbookFromUrl(_objTmpl.url);

        let sheetDetail = workbook.worksheets[0];

        let objResFirst = _arrResultDetail[0];

        let objSubsidiary = _objTmpl.subsidiary.find(e => e.id == objResFirst.subsidiary_id);

        let subsidiaryName = (objSubsidiary.legalname||"").toUpperCase();

        let objEntity = _objTmpl.entity.find(e => e.internalid == objResFirst.entity_id);

        let entityName = (objEntity?.companyname || objResFirst.entity_name || "").toUpperCase();

        _scvExcelJS.replaceKey(sheetDetail, [
            "{pSubsidiary}", "{pSubsidiaryAddress}",
            "{pSubsidiaryIFAddress}", "{pSubsidiaryEmail}",
            "{pSubsidiaryWebsite}",
            "{pSubsidiaryPhone}", "{pEntity}",
            "{pFromDate}", "{pToDate}",
            "{pOwner}"
        ], [
            subsidiaryName, objSubsidiary.mainaddress_display,
            objSubsidiary.custrecord_scv_o2c_if_add, objSubsidiary.email,
            objSubsidiary.custrecord_scv_website,
            objSubsidiary.custrecord_scv_sub_phone, entityName,
            _params.custpage_fromdt, _params.custpage_todt,
            _params.custpage_owner
        ]);

        let idxRowDetailStart = 12, idxRowDetailEnd = 12;
        let idxColDetailEnd = 8;

        let numFmtVnd = constFormat.getMaskFormatVndXls();

        for(let i = 0; i < _arrResultDetail.length; i++){
            let objRes = _arrResultDetail[i];
            if(objRes.lvl == 1 || objRes.lvl == 2) continue;

            let objRow = sheetDetail.insertRow(idxRowDetailEnd, [
                objRes.trandate, objRes.tranid, objRes.memo, objRes.unit,
                objRes.quantity, objRes.rate, objRes.amount, objRes.amount_paid,
            ], "o+");
            setDefaultFontRowExcel(objRow);

            _scvExcelJS.syncRangeMergeAfterInsertRow(sheetDetail, idxRowDetailEnd, 1);

            _scvExcelJS.createNumFmtWithRange(sheetDetail, 
                {row: idxRowDetailEnd, col: 5},
                {row: idxRowDetailEnd, col: 8},
                numFmtVnd
            );

            _scvExcelJS.extendGridStyleRow(sheetDetail,
                {row: idxRowDetailEnd, col: 1},
                {row: idxRowDetailEnd, col: idxColDetailEnd},
                objRes
            );

            sheetDetail.getCell(idxRowDetailEnd, 3).alignment = {vertical: 'top', horizontal: 'left', wrapText: true};

            idxRowDetailEnd++;
        }

        if(_arrResultDetail.length > 0){
            idxRowDetailEnd -= 1; // Bỏ dòng cuối cùng vì không có dữ liệu
        }

        _scvExcelJS.createBorderWithRange(sheetDetail, 
            {row: idxRowDetailStart, col: 1}, 
            {row: idxRowDetailEnd, col: idxColDetailEnd},
            "thin",
            {rowStyle: "dotted", colStyle: "thin"}
        );

        return workbook;
    }

    const setDefaultFontRowExcel = (_curRow) => {
        _curRow.eachCell( function(cell, colNumber){
            cell.font = {
                ...cell.font,
                size: 10,
                name: "Times New Roman"
            };
        });
    }

    const exportResult = async (_exportType, _idxRow = -1) => {
        let arrResOfGrid = _scvDx.getDataSource("custpage_grid_result")||[];

        let params = _scvForm.getParameter();

        let arrResOfEntity = [];

        if(_idxRow != -1){
            params = commonRptDccn.params;

            arrResOfEntity = arrResOfGrid.filter(e => e.idxRow == _idxRow || e.idxRowParent == _idxRow);
        }

        if(_exportType == "xlsx"){
            onExportResultData(arrResOfEntity, params);
        }
        else if(_exportType == "pdf"){

            let urlScript = _scvForm.currentScript.url;

            urlScript += `&custpage_subsidiary=` + arrResOfEntity[0].subsidiary_id;
            urlScript += `&custpage_customer=` + arrResOfEntity[0].entity_id;
            urlScript += `&custpage_entitycategory=` + params.custpage_entitycategory;
            urlScript += `&custpage_fromdt=` + params.custpage_fromdt;
            urlScript += `&custpage_todt=` + params.custpage_todt;
            urlScript += `&custpage_owner=` + (_scvForm.currentRecord.getValue("custpage_owner") || "");
            urlScript += `&exportPdf=T`;

            window.open(urlScript);
        }
    }

    const downloadResultFilePDF = async () => {
        let params = commonRptDccn.params;

        if(!params.custpage_subsidiary){
            params = _scvForm.getParameter();
        }

        params.custpage_owner = _scvForm.currentRecord.getValue("custpage_owner") || "";

        let arrReqAction = [];

        let arrResOfGrid = _scvDx.getDataSource("custpage_grid_result")||[];

        let arrResOfEntity = arrResOfGrid.filter(e => e.lvl == 2);

        for(let i = 0; i < arrResOfEntity.length; i++){
            let objResEntity = arrResOfEntity[i];

            let arrResDetailEntity = arrResOfGrid.filter(e => e.idxRow == objResEntity.idxRow || e.idxRowParent == objResEntity.idxRow);

            arrReqAction.push({
                action: "getDataFilePDF",
                params: {
                    ...params,
                    data: JSON.stringify(arrResDetailEntity)
                }
            });
        }

        _scvForm.showLoadingDialog(true);

        setTimeout(() =>{
            _scvForm.ajax.postWaitQueue(_scvForm.serviceScript.url, arrReqAction, 0, function (_res){
                let arrResData = _scvForm.getResultActionPage(_res, "getDataFilePDF");
                
                let folderZip = new JSZip();

                for(let i = 0; i < arrResData.length; i++){
                    let objRes = arrResData[i];

                    folderZip.file(objRes.name, objRes.contents_base64, {base64: true});
                }

                let nameZip = "PDF_Bảng kê chi tiết và đối chiếu công nợ_" + arrResData.length;

                folderZip.generateAsync({type: 'blob'}).then(function (_dataEncode) {
                    saveAs(_dataEncode, nameZip + ".zip", {type: "application/zip"});
                });

                _scvForm.showLoadingDialog(false);
            });
        }, 100);
    }

    window._scvExportResult = exportResult;

    return {
        pageInit,
        fieldChanged,
        onSearchResult,
    };
    
});
