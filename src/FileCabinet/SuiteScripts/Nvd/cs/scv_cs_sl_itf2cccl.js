/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  10 Dec 2024         Huy Pham                Init & create file, Phát triển chức năng CCCL (Chứng chỉ chất lượng), from mr.NĐHuy(https://app.clickup.com/t/86cx8bp6d)
 *  16 Dec 2024         Huy Pham                Bổ sung chức năng + có thể sinh ra nhiều phiếu, from mr.NĐHuy(https://app.clickup.com/t/86cx8bp6d?comment=90160079256350)
 *  20 Feb 2025         Huy Pham                Bổ sung validate khi submit, from mr.Huy(https://app.clickup.com/t/86cx8bp6d?comment=90160093390289)
 */
/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */ 
define(['N/currentRecord', 'N/url', 'N/search',
    '../lib/scv_lib_cs.js',

    '../cons/scv_cons_record.js',

    '../cons/scv_cons_location.js',
    '../cons/scv_cons_customer.js',
],

function(currentRecord, url, search,
    libCs,

    constRecord,

    constLocation,
    constCustomer
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

        constRecord.initQuickFindFieldSelect(curRec, "custpage_location", {
            data: curRec.getField("custpage_location").getSelectOptions(),
            valueExpr: "value",
            displayExpr: "text",
            reInsertOption: false
        }, false);

        constRecord.initQuickFindFieldSelect(curRec, "custpage_customer", {
            data: curRec.getField("custpage_customer").getSelectOptions(),
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
        let fieldId = scriptContext.fieldId;
        
        switch(fieldId){
            case "custpage_subsidiary":
                setTimeout(() => loadFieldDataLocation(curRec), 0);
                setTimeout(() => loadFieldDataCustomer(curRec), 0);
            break;
        }
    }

    const loadFieldDataLocation = (_curRec) => {
        let arrResult = [];

        let subsidiaryId = _curRec.getValue("custpage_subsidiary").toString();
        if(!!subsidiaryId){
            arrResult = constLocation.getDataSource(
                search.createFilter({
                    name: 'subsidiary',
                    operator: "anyof",
                    values: subsidiaryId
                })
            );
        }

        constRecord.initQuickFindFieldSelect(_curRec, "custpage_location", {
            data: arrResult,
            valueExpr: "internalid",
            displayExpr: "name",
            reInsertOption: true
        }, false);
    }

    const loadFieldDataCustomer = (_curRec) =>{
        let arrResult = [];

        let subsidiaryId = _curRec.getValue("custpage_subsidiary").toString();
        if(!!subsidiaryId){
            arrResult = constCustomer.getDataSourceSubsidiaryRelationship(
                search.createFilter({
                    name: 'subsidiary',
                    operator: "anyof",
                    values: subsidiaryId
                })
            );
        }
        arrResult.unshift({internalid: "", entityid: ""});

        constRecord.initQuickFindFieldSelect(_curRec, "custpage_customer", {
            data: arrResult,
            valueExpr: "internalid",
            displayExpr: "entityid",
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
        let curRec = scriptContext.currentRecord;
        let itemSublistId = "custpage_sl_item";
        let sizeItem = curRec.getLineCount(itemSublistId);
        let isValid = false;

        for(let i = 0; i < sizeItem; i++){
            let isChk = curRec.getSublistValue(itemSublistId, "custpage_col_chk", i);
            if(isChk){
                isValid = true;

                let insPlanId = curRec.getSublistValue(itemSublistId, "custpage_col_insplan", i);
                if(!insPlanId){
                    alert("Chọn Insurance Plan cho line " + (i + 1));
                    return false;
                }
            }
        }

        if(!isValid){
            alert("Chọn ít nhất 1 line để tạo CCCL.");
        }

        return isValid;
    }

    const onSearchResult = () =>{
        window.onbeforeunload = null;

        let curRec = currentRecord.get();
        let isValid = libCs.validateFieldMandatory(curRec, [ "custpage_subsidiary", "custpage_customer",
            "custpage_fromdt", "custpage_todt"
        ]);
        if(!isValid) return;

        let objParams = getObjParams(curRec);

        let urlScript = url.resolveScript({
            scriptId: 'customscript_scv_sl_itf2cccl',
            deploymentId: 'customdeploy_scv_sl_itf2cccl',
            params: objParams
        });

        urlScript += "&isSearch=T";

        window.location.replace(urlScript);
    }

    const getObjParams = (_curRec) => {
        return {
            custpage_subsidiary: _curRec.getValue("custpage_subsidiary").toString(),
            custpage_location: _curRec.getValue("custpage_location").toString(),
            custpage_item: _curRec.getValue("custpage_item").toString(),
            custpage_itf: _curRec.getValue("custpage_itf"),
            custpage_so: _curRec.getValue("custpage_so"),
            custpage_customer: _curRec.getValue("custpage_customer"),
            custpage_fromdt: _curRec.getText("custpage_fromdt"),
            custpage_todt: _curRec.getText("custpage_todt"),
            custpage_def_reqdt: _curRec.getText("custpage_def_reqdt")
        };
    }

    return {
        pageInit,
        fieldChanged,
        saveRecord,
        onSearchResult
    };
    
});
