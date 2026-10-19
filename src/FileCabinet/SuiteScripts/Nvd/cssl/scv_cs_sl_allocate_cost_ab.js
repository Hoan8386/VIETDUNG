/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  23 Sep 2025         Khanh Tran			    Init, create file. Phát triển chức năng phân bổ chi phí sản xuất gia công kỹ thuật, form mr.Phúc(https://app.clickup.com/t/86d0pypjy)
 */
/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */ 
define(['N/currentRecord', 'N/url',
],

function(currentRecord, url
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

    }

    const onSearchResult = () =>{
        window.onbeforeunload = null;
        
        if(!_scvForm.validateFieldMandatory([
            "custpage_subsidiary", "custpage_fromdt", "custpage_todt"
        ])) return;

        let objParams = getObjParams();
        let urlScript = url.resolveScript({
            scriptId: 'customscript_scv_sl_allocate_cost_ab',
            deploymentId: 'customdeploy_scv_sl_allocate_cost_ab',
            params: objParams
        });

        urlScript += "&isSearch=T";
        window.location.replace(urlScript);
    }

    const getObjParams = () => {
        let curRec = currentRecord.get();

        return {
            custpage_subsidiary: curRec.getValue("custpage_subsidiary"),
            custpage_phieuht: curRec.getValue("custpage_phieuht"),
            custpage_fromdt: curRec.getText("custpage_fromdt"),
            custpage_todt: curRec.getText("custpage_todt"),
        };
    }

    return {
        onSearchResult,
        pageInit,
        // fieldChanged,
        // onSearchResult,
    };
    
});
