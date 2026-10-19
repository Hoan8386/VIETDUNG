/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([
    '../cons/scv_cons_search.js',
    '../lib/scv_lib_cs_xls.js'
],

function(
    constSearch,
    libCsXLS
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

    const WorkOrderType = {
        GiaCongCoKhi: {
            ID: 6, NAME: "Gia công cơ khí"
        },
        XayDungCoBan: {
            ID: 12, NAME: "Xây dựng cơ bản"
        }
    };

    function pageInit(scriptContext) {

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
        let fieldId = scriptContext.fieldId;

        if(fieldId === "custpage_subsidiary") {
            fieldChanged_Subsidiary(curRec, fieldId);
        }
    }

    const fieldChanged_Subsidiary = async (curRec, fieldId) => {
        _scvForm.showLoadingDialog(true);
        await delay(200);

        let subsidiary_id = curRec.getValue(fieldId);
        let fWorkOrder = curRec.getField('custpage_wo');
        fWorkOrder.removeSelectOption({value: null});

        if(!!subsidiary_id) {
            fWorkOrder.insertSelectOption({ value: '', text: '' });
            let arrWO = getDataWorkOrderWithFilter(subsidiary_id);

            for(let obj of arrWO) {
                fWorkOrder.insertSelectOption({ value: obj.internalid, text: obj.wo_item_nm });
            }
        }

        _scvForm.showLoadingDialog(false);
    }

    const getDataWorkOrderWithFilter = (subsidiary) => {
        if(!subsidiary) return [];
        let resultSearch =  constSearch.createSearchWithFilter({
            type: "workorder",
            filters:
            [
                [
                    "custbody_scv_work_order_type", "anyof", 
                    [WorkOrderType.GiaCongCoKhi.ID, WorkOrderType.XayDungCoBan.ID]
                ],
                "AND",
                ["subsidiary", "anyof", subsidiary],
                "AND",
                ["mainline","is","T"],
                "AND",
                ["taxline","is","F"], 
            ],
            columns:
            [
                "internalid", "tranid", "custbody_scv_work_order_type", "item",
                // search.createColumn({ name: 'upccode', join: 'item' })
            ]
        }, []);
        
        let arrResult = constSearch.fetchResultSearchRunEach(resultSearch, function(_objTmpl, _column){
            let objResTmpl = constSearch.getObjResultFromSearchByKey(_objTmpl, _column, [
                "internalid", "tranid", "custbody_scv_work_order_type", "item",
                // "item_code"
            ]);

            objResTmpl.wo_item_nm = objResTmpl.tranid + " | " + objResTmpl.item_display;
            return objResTmpl;
        });

        return arrResult;
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
    
    const onSearchResult = async () => {
        window.onbeforeunload = null;

        let isValid = _scvForm.validateFieldMandatory([
            "custpage_subsidiary", "custpage_wo"
        ]);
        if(!isValid) return;

        _scvForm.showLoadingDialog(true);
        
        let params = _scvForm.getParameter();

        let arrActionFunc = [{
            action: "getDataWOCompletion", params: {...params}, data: []
        }];

        _scvForm.ajax.postAsyncMulti(_scvForm.serviceScript.url, arrActionFunc, function (_res){
            let searchResult = _res.find(e => e.action == "getDataWOCompletion").data;

            _scvDx.setDataSource("custpage_sl_mro_comp_wo", searchResult.arrMroCompWO);
            _scvDx.setDataSource("custpage_sl_nhan_cong_wo", searchResult.arrNhanCongWO);
            _scvForm.showLoadingDialog(false);
        });
    }

    const onExport = async () => {
        window.onbeforeunload = null;

        let isValid = _scvForm.validateFieldMandatory([
            "custpage_subsidiary", "custpage_wo"
        ]);
        if(!isValid) return;

        _scvForm.showLoadingDialog(true);
        
        let params = _scvForm.getParameter();

        let arrActionFunc = [
            { action: "getDataWOCompletion", params: {...params}, data: [] },
            // { action: "getDataWorkOrder", params: {...params}, data: [] },
            { action: "getDataSearchInfoWO", params: {...params}, data: [] },
        ];

        _scvForm.ajax.postAsyncMulti(_scvForm.serviceScript.url, arrActionFunc, function (_res){
            let searchResult = _res.find(e => e.action == "getDataWOCompletion").data;
            let objWO = _res.find(e => e.action == "getDataSearchInfoWO").data;

            objWO.built = objWO.built * 1;
            objWO.quantity = objWO.quantity * 1;
            objWO.custbody_scv_total_qty_store = objWO.custbody_scv_total_qty_store * 1;
            onExportData(params, searchResult, objWO);
            _scvForm.showLoadingDialog(false);
        });
    }

    const onExportData = async (params, objSearchData, objWO) => {
        // export excel
        let file_export = params.custpage_url_file_exp;
        let workbook = await libCsXLS.loadWorkbookFromUrl(file_export);
        let curSheet = workbook.worksheets[0];

        // libCsXLS.replaceKeyCellValue(curSheet, "A1", "{pSubLegalname}", objWO.sub_legalname);
        // libCsXLS.replaceKeyCellValue(curSheet, "A2", "{pSubAddress}", objWO.sub_address);
        libCsXLS.replaceKeyCellValue(curSheet, "C2", "{pFromMonth}", objWO.trandate);
        libCsXLS.replaceKeyCellValue(curSheet, "C2", "{pToMonth}", objWO.actualproductionstartdate || "......");
        libCsXLS.replaceKeyCellValue(curSheet, "C3", "{pAssemblyItem}", objWO.item_display);
        libCsXLS.replaceKeyCellValue(curSheet, "C4", "{pWorkOrder}", objWO.tranid);
        libCsXLS.replaceKeyCellValue(curSheet, "A20", "{pUnits}", objWO.unit_display);
        libCsXLS.replaceKeyCellValue(curSheet, "D20", "{pUnits}", objWO.unit_display);
        libCsXLS.replaceKeyCellValue(curSheet, "K20", "{pUnits}", objWO.unit_display);

        // TODO: sublist 1
        let idxTHVT = 8, idxTotalTHVT = 9;
        let ttlMrrUsageAmt = 0;
        let arrMroCompWO = objSearchData.arrMroCompWO;
        
        for(let i = 0; i < arrMroCompWO.length; i++) {
            let obj = arrMroCompWO[i];
            let idxCurRow = i + 1 + idxTotalTHVT;

            let newRow, rowData;
            if(obj.level == 1) {
                rowData  = curSheet.getRow(idxTotalTHVT);
                newRow = curSheet.insertRow(idxCurRow, [
                    null, obj.item_name, obj.item_name, null, (obj.mro_usage_qty * 1), null,
                    (obj.mro_usage_amount * 1), null, obj.out_qty_actual, obj.in_qty_actual, 
                    obj.actual_usage, obj.amount_difference, obj.gtri_hoan_cong, null
                ]);
                ttlMrrUsageAmt = obj.mro_usage_amount;
            } else {
                rowData  = curSheet.getRow(idxTHVT);
                
                let mro_usage_qty = null, mro_usage_rate = null, mro_usage_amount = null;
                if(!!obj.mro_usage_qty || !!obj.mro_usage_rate || !!obj.mro_usage_amount) {
                    mro_usage_qty = (obj.mro_usage_qty * 1);
                    mro_usage_rate = (obj.mro_usage_rate * 1);
                    mro_usage_amount = (obj.mro_usage_amount * 1);
                }

                newRow = curSheet.insertRow(idxCurRow, [
                    obj.stt, obj.item_code, obj.item_name, obj.unit, mro_usage_qty, mro_usage_rate, 
                    mro_usage_amount, obj.inventoryadjust, obj.out_qty_actual, obj.in_qty_actual, 
                    obj.actual_usage, obj.amount_difference, obj.gtri_hoan_cong, null
                ]);
            }
            setStyleRowData(newRow, rowData);
        }
        curSheet.spliceRows(idxTHVT, 2);
        libCsXLS.syncRangeMergeAfterInsertRow(curSheet, idxTHVT, arrMroCompWO.length - 2);

        // TODO: sublist 2
        let rangeNC = 6;
        let idxNC = (idxTHVT + rangeNC) + arrMroCompWO.length - 2;
        let idxTotalNC = (idxTotalTHVT + rangeNC) + arrMroCompWO.length - 2;
        let arrNhanCongWO = objSearchData.arrNhanCongWO;
        
        let ttlPlanAmt = 0;
        let arrNewMerge = [];

        // console.log(arrNhanCongWO);
        if(arrNhanCongWO.length === 1) {
            let obj = arrNhanCongWO[0];
            ttlPlanAmt = obj.planamount;

            let idxCurRow = 1 + idxTotalNC;
            insertDataHCNCOther(arrNewMerge, curSheet, idxCurRow, idxNC, [
                null, null, null, null, null, null,
                null, null, null, null, null, null
            ]);

            insertDataHCNCLvl1(arrNewMerge, curSheet, idxCurRow + 1, idxTotalNC, [
                null, obj.description, null, obj.planquantity, obj.planrate, obj.planamount,
                obj.actualquantity, null, null, null, obj.workday_difference, 
                null
            ]);
        } else {
            for(let j = 0; j < arrNhanCongWO.length; j++) {
                let obj = arrNhanCongWO[j];
                let idxCurRow = j + 1 + idxTotalNC;

                if(obj.level == 1) {
                    insertDataHCNCLvl1(arrNewMerge, curSheet, idxCurRow, idxTotalNC, [
                        null, obj.description, null, obj.planquantity, obj.planrate, obj.planamount,
                        obj.actualquantity, obj.actualrate, obj.actualamount, obj.actualamount, obj.workday_difference, 
                        obj.amount_difference
                    ]);
                    ttlPlanAmt = obj.planamount;
                } else {
                    insertDataHCNCOther(arrNewMerge, curSheet, idxCurRow, idxNC, [
                        obj.stt, obj.description, null, obj.planquantity, obj.planrate, obj.planamount,
                        obj.actualquantity, obj.actualrate, obj.actualamount, obj.actualamount, obj.workday_difference, 
                        obj.amount_difference
                    ]);
                }
            }
        }
        curSheet.spliceRows(idxNC, 2);
        if(arrNhanCongWO.length === 1) {
            libCsXLS.syncRangeMergeAfterInsertRow(curSheet, idxNC, arrNhanCongWO.length - 1);
        } else {
            libCsXLS.syncRangeMergeAfterInsertRow(curSheet, idxNC, arrNhanCongWO.length - 2);
        }

        // recalc merge sublist hoan cong nhan cong
        for(let i = 0; i < arrNewMerge.length - 2; i++) {
            let rowIdx = arrNewMerge[i] - 2;
            curSheet.mergeCells(`B${rowIdx}:C${rowIdx}`);
            curSheet.mergeCells(`I${rowIdx}:J${rowIdx}`);
        }
        
        // TODO: sublist 3
        let idxNhanCongWO = (arrNhanCongWO.length === 1) ? 0 : arrNhanCongWO.length - 2;
        let idxSummary = (idxTHVT + 7) + arrMroCompWO.length - 2 + idxNhanCongWO + 6;
        let rowSummary = curSheet.getRow(idxSummary);
        let ttlAmtDuToan = (ttlMrrUsageAmt + ttlPlanAmt);
        let totalDifQty = objWO.built - objWO.quantity;
        let totalDifAmt = objWO.custbody_scv_total_qty_store - ttlAmtDuToan;
        let percent = !!ttlAmtDuToan ? ((totalDifAmt / ttlAmtDuToan) * 100) : 0;

        libCsXLS.replaceKeyCellValue(curSheet, `A${idxSummary}`, "{pWoQty}", objWO.quantity);
        libCsXLS.replaceKeyCellValue(curSheet, `C${idxSummary}`, "{pTtlAmtDuToan}", ttlAmtDuToan);
        libCsXLS.replaceKeyCellValue(curSheet, `D${idxSummary}`, "{pWoBuilt}", objWO.built || 0);
        libCsXLS.replaceKeyCellValue(curSheet, `G${idxSummary}`, "{pWoTtlQtyStore}", objWO.custbody_scv_total_qty_store);

        libCsXLS.replaceKeyCellValue(curSheet, `K${idxSummary}`, "{pTotalDiffQty}", totalDifQty);
        libCsXLS.replaceKeyCellValue(curSheet, `L${idxSummary}`, "{pTotalDiffAmt}", objWO.custbody_scv_total_qty_store ? totalDifAmt : null);
        libCsXLS.replaceKeyCellValue(curSheet, `M${idxSummary}`, "{percentDiffAmt}", objWO.custbody_scv_total_qty_store ? (percent.toFixed(2) + "%") : null);
        // download template
        await libCsXLS.saveWorkbook(workbook, "BÁO CÁO HOÀN CÔNG.xlsx");
    }

    const insertDataHCNCLvl1 = (arrNewMerge, curSheet, idxCurRow, idxTotalNC, data) => {
        let rowData  = curSheet.getRow(idxTotalNC);
        let newRow = curSheet.insertRow(idxCurRow, data);
        arrNewMerge.push(idxCurRow);
        setStyleRowData(newRow, rowData);
    }

    const insertDataHCNCOther = (arrNewMerge, curSheet, idxCurRow, idxNC, data) => {
        let rowData = curSheet.getRow(idxNC);
        let newRow = curSheet.insertRow(idxCurRow, data);
        arrNewMerge.push(idxCurRow);
        setStyleRowData(newRow, rowData);
    }

    const setStyleRowData = (newRow, rowData) => {
        newRow.height = newRow.height * 20 / newRow.width;
        rowData.eachCell((cell, colNumber) => {
            const newCell = newRow.getCell(colNumber);
            newCell.style = { ...cell.style };
        });
    }

    const delay = (ms) => {
		return new Promise(function (resolve) {
			setTimeout(resolve, ms);
		});
	}

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        onSearchResult: onSearchResult,
        onExport: onExport
        // saveRecord: saveRecord
    };
    
});
