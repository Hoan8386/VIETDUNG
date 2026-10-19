/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  10 Dec 2024         Huy Pham			    Init, create file, Planning Materials, from mr.Hải(https://app.clickup.com/t/86cx7mw5a)
 */
/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */ 
define(['N/currentRecord', 'N/url', 'N/search',
    '../lib/scv_lib_cs.js',

    '../cons/scv_cons_record.js',

    '../cons/scv_cons_search_pur_plan_ind.js',
],

function(currentRecord, url, search,
    libCs,

    constRecord,

    constSearchPurPlanInd
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
        
        constRecord.initQuickFindFieldSelect(curRec, "custpage_subsidiary", {
            data: curRec.getField("custpage_subsidiary").getSelectOptions(),
            valueExpr: "value",
            displayExpr: "text",
            reInsertOption: false
        }, false);

        constRecord.initQuickFindFieldSelect(curRec, "custpage_purplan_params", {
            data: curRec.getField("custpage_purplan_params").getSelectOptions(),
            valueExpr: "value",
            displayExpr: "text",
            reInsertOption: false
        }, false);
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
                let custpage_purplan_params = curRec.getField("custpage_purplan_params");
                let subsidiaryId = curRec.getValue("custpage_subsidiary");

                setTimeout(() => loadFieldDataPurPlanInd(curRec, custpage_purplan_params, subsidiaryId), 0);
            break;
        }

    }

    const loadFieldDataPurPlanInd = (_curRec) => {
        let subsidiaryId = _curRec.getValue("custpage_subsidiary");

        let arrResult = [];

        if(!!subsidiaryId){
            arrResult = constSearchPurPlanInd.getDataSource(
                search.createFilter({
                    name: 'custrecord_scv_pur_plan_ind_subsidiary',
                    operator: "anyof",
                    values: subsidiaryId
                })
            );
        }

        constRecord.initQuickFindFieldSelect(_curRec, "custpage_purplan_params", {
            data: arrResult,
            valueExpr: "internalid",
            displayExpr: "name",
            reInsertOption: true
        }, false);
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
        return true;
    }
    
    const getObjParams = (_curRec) => {
        let params = {
            custpage_subsidiary: _curRec.getValue("custpage_subsidiary"),
            custpage_purplan_params: _curRec.getValue("custpage_purplan_params").toString()
        };

        return params;
    }

    const onSearchResult = () =>{
        window.onbeforeunload = null;

        let curRec = currentRecord.get();
        let isValid = libCs.validateFieldMandatory(curRec, [
            "custpage_subsidiary", "custpage_purplan_params"
        ]);
        if(!isValid) return;

        let params = getObjParams(curRec);

        let urlScript = url.resolveScript({
            scriptId: 'customscript_scv_sl_plan_mat',
            deploymentId: 'customdeploy_scv_sl_plan_mat',
            params: params
        });

        urlScript += "&isSearch=T";

        window.location.replace(urlScript);
    }

    const openStatusQueue = (_urlPopup, _width, _height, _title) =>{
        nlExtOpenWindow(_urlPopup, 'popupStatusQueue', _width, _height, this, true, _title);
    }

    return {
        pageInit,
        fieldChanged,
        //saveRecord,
        onSearchResult,
        openStatusQueue
    };
    
});
