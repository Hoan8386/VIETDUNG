/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  12 Jun 2025         Huy Pham                Init & create file, Phát triển chức năng CCCL từ SO (Chứng chỉ chất lượng), from mr.NĐHuy(https://app.clickup.com/t/86cz8ug1w)
 */
/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */ 
define(['N/url', 'N/search',
    '../cons/scv_cons_record.js',

    '../cons/scv_cons_location.js',
    '../cons/scv_cons_customer.js',
],

function(url, search,
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
        
        constRecord.pageInitQuickFindFieldSelect(curRec, [
            "custpage_subsidiary", "custpage_location", "custpage_customer"
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
        let fieldId = scriptContext.fieldId;
        
        switch(fieldId){
            case "custpage_subsidiary":
                setTimeout(() => loadFieldDataLocation(curRec), 0);
                setTimeout(() => loadFieldDataCustomer(curRec), 0);
            break;
        }

        _scvInventoryDetail.validateField(scriptContext);
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

        let isValid = _scvForm.validateFieldMandatory([ "custpage_subsidiary", "custpage_customer",
            "custpage_fromdt", "custpage_todt"
        ]);
        if(!isValid) return;

        let objParams = _scvForm.getParameter();

        let urlScript = url.resolveScript({
            scriptId: _scvForm.currentScript.id,
            deploymentId: _scvForm.currentScript.deploymentId,
            params: objParams
        });

        urlScript += "&isSearch=T";

        window.location.replace(urlScript);
    }

    return {
        pageInit,
        fieldChanged,
        saveRecord,
        onSearchResult
    };
    
});
