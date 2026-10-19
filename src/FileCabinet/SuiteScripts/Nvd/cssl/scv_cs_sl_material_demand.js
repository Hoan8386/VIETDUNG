/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([
    'N/currentRecord', 'N/url', 'N/query',
    '../cons/scv_cons_search.js',
    '../cons/scv_cons_record.js',
    '../lib/scv_lib_cs.js',
    '../lib/scv_lib_cs_xls.js',
],

function(
    currentRecord, url, query,
    constSearch, constRecord,
    libCS,
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
    const CurScript = {
        ID: "customscript_scv_sl_material_demand_rpt",
        DEPLOY_UI: "customdeploy_scv_sl_material_demand_rpt",
        DEPLOY_DATA: "customdeploy_scv_sl_mat_demand_rpt_data",
    };

    function pageInit(scriptContext) {
        // let curRec = scriptContext.currentRecord;
        // loadFieldDataMfgPlan(curRec);
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

        if(!sublistId && fieldId === "custpage_subsidiary") {
            loadFieldDataMfgPlan(curRec);
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

    const loadFieldDataMfgPlan = (curRec) => {
        let arrResult = [];
        let subsidiaryId = curRec.getValue("custpage_subsidiary");
        if(!!subsidiaryId){

            let resultSearch = constSearch.createSearchWithFilter({
                type: "custompurchase_scv_mfg_plan",
                filters: [
                    ["subsidiary", "anyof", subsidiaryId],
                    "AND", ["mainline","is","T"],
                    "AND", ["taxline","is","F"]
                ],
                columns: [ "internalid", "tranid"]
            }, []);

            arrResult = constSearch.fetchResultSearchRunEach(resultSearch, function(_objTmpl, _column){
                let objRes = constSearch.getObjResultFromSearchByKey(_objTmpl, _column, [
                    "internalid", "tranid",
                ]);
                return objRes;
            });
        }

         constRecord.initQuickFindFieldSelect(curRec, "custpage_mfg_plan", {
            data: arrResult,
            valueExpr: "internalid",
            displayExpr: "tranid",
            reInsertOption: true
        }, false);
    }

    const onSearchResult = () => {
        window.onbeforeunload = null;
        const BASE_URL = url.resolveScript({
            scriptId: CurScript.ID,
            deploymentId: CurScript.DEPLOY_UI,
            returnExternalUrl: false
        });

        let currRecord = currentRecord.get();
        let objFieldMandatory = validateFieldsMandatory(currRecord, ["custpage_subsidiary", "custpage_mfg_plan"]);
        if(!objFieldMandatory.isValidate) {
            return alert(objFieldMandatory.notification);
        }

        let urlDC = BASE_URL + plusParam(currRecord) + "&isrun=T";
        window.location.replace(urlDC);
    }

    const onExport = async () => {
        window.onbeforeunload = null;
        let curRec = currentRecord.get();
        libCS.showLoadingDialog(true);

        let urlData = url.resolveScript({
            scriptId: CurScript.ID, deploymentId: CurScript.DEPLOY_DATA,
            returnExternalUrl: false
        });
        urlData += plusParam(curRec);

        let response = await fetchData(urlData);
        let objResult = response.data;
        let arrNCVT = objResult.arrNCVT;
        let arrCtDinhMuc = objResult.arrCtDinhMuc;

        let subsidiaryId = curRec.getValue("custpage_subsidiary");
        let mfg_plan_display = curRec.getText("custpage_mfg_plan");
        let objSubsidiary = getDataSubsidiary(subsidiaryId);

        // export excel
        let file_export = curRec.getValue("custpage_url_file_exp");
        let workbook = await libCsXLS.loadWorkbookFromUrl(file_export);
        let curSheet = workbook.worksheets[0];
        let nextSheet = workbook.worksheets[1];

        [curSheet, nextSheet].forEach(sheet => {
            libCsXLS.replaceKeyCellValue(sheet, "B2", "{pSubLegalname}", objSubsidiary.legalname);
            libCsXLS.replaceKeyCellValue(sheet, "B3", "{pSubAddress}", objSubsidiary.mainaddress_display);
            libCsXLS.replaceKeyCellValue(sheet, "B6", "{pSoKeHoach}", mfg_plan_display);
        });
        // current sheet
        let cellTotal = curSheet.getCell("F10");
        cellTotal.value = arrNCVT.reduce((a, b) => a + b.bom_qty, 0);

        let idxRow = 9;
        for(let i = 0; i < arrNCVT.length; i++) {
            let obj = arrNCVT[i];

            let rowData  = curSheet.getRow(idxRow);
            let idxCurRow = i + 1 + idxRow;

            let newRow = curSheet.insertRow(idxCurRow, [
                null, obj.stt, obj.component_code, obj.component_name, obj.component_unit, obj.bom_qty, 
                obj.group_lv1_display, obj.group_lv2_display, obj.group_lv3_display, obj.group_lv4_display,
            ]);

            newRow.height = newRow.height * 20 / newRow.width;
            rowData.eachCell((cell, colNumber) => {
                const newCell = newRow.getCell(colNumber);
                newCell.style = { ...cell.style };
            });
        }
        curSheet.spliceRows(idxRow, 1);
        libCsXLS.syncRangeMergeAfterInsertRow(curSheet, idxRow, arrNCVT.length - 1);
        // next sheet
        let idxNxtRow = 9;
        for(let i = 0; i < arrCtDinhMuc.length; i++) {
            let obj = arrCtDinhMuc[i];

            let rowData  = nextSheet.getRow(idxNxtRow);
            let idxCurRow = i + 1 + idxNxtRow;

            let newRow = nextSheet.insertRow(idxCurRow, [
                null, obj.stt, obj.item_nm, obj.unit, obj.plan_qty, obj.component_code, obj.component_name, obj.component_unit, 
                obj.bom_qty, obj.component_qty, obj.use_std_bom_qty, obj.revision_name, obj.bill_material_nm,
                obj.group_lv1_display, obj.group_lv2_display, obj.group_lv3_display, obj.group_lv4_display,
            ]);

            newRow.height = newRow.height * 20 / newRow.width;
            rowData.eachCell((cell, colNumber) => {
                const newCell = newRow.getCell(colNumber);
                newCell.style = { ...cell.style };
            });
        }
        nextSheet.spliceRows(idxNxtRow, 1);

        await libCsXLS.saveWorkbook(workbook, "Báo cáo nhu cầu vật tư theo kế hoạch sản xuất.xlsx");
        libCS.showLoadingDialog(false);
    }

    const getDataSubsidiary = (subsidiaryId) => {
        if(!subsidiaryId) return {};

        let resultSQL = query.runSuiteQL({
            query: `SELECT 
                id, legalname, BUILTIN.DF(mainaddress) AS mainaddress_display
            FROM subsidiary
            WHERE id = ${subsidiaryId}`
        });
        let resultQuery = resultSQL.asMappedResults();

        return resultQuery.length > 0 ? resultQuery[0] : {};
    }

    const validateFieldsMandatory = (currRecord, fields) => {
        let isValidate = true;
        let notification = "Vui lòng nhập fields: ";

        for(let fieldId of fields) {
            let value = currRecord.getValue(fieldId);
            if(!value) {
                isValidate = false;
                notification += currRecord.getField(fieldId).label + ", ";
            }
        }
        return {
            isValidate, 
            notification: !!isValidate ? "Success!" : (notification.slice(0, notification.length - 2) + ".")
        };
    }

    function plusParam(currRecord) {
        return '&custpage_subsidiary=' + currRecord.getValue('custpage_subsidiary')
            + '&custpage_mfg_plan=' + currRecord.getValue('custpage_mfg_plan');
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

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        // saveRecord: saveRecord,
        onSearchResult: onSearchResult,
        onExport: onExport,
    };
    
});
