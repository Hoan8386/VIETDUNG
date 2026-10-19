/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define([
    "N/search",
    "N/url"
], function (
    search,
    url
) {
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
     * @Since 2015.2
     */
    function beforeLoad(scriptContext) {
        try {
            switch (scriptContext.newRecord.type) {
                case "customrecord_scv_prinandintersheet":
                    beforeLoadLoanPrincipalInterest(scriptContext);
                    break;
                case "customrecord_cseg_scv_loan":
                    beforeLoadDebitLoanAgreements(scriptContext);
                    break;
                default:
                    break;
            }
        } catch (e) {
            log.error("beforeLoad error", JSON.stringify(e));
        }
    }

    function beforeLoadDebitLoanAgreements(scriptContext) {
        if (scriptContext.type === "create") {
            let newRecord = scriptContext.newRecord;
            let pi = scriptContext.request.parameters?.pi || '';
            if (!!pi) {
                const lkLoan = search.lookupFields({
                    type : 'customrecord_cseg_scv_loan',
                    id : pi,
                    columns : ["custrecord_scv_loan_contract_subsidiary", "custrecordentity", "custrecord_scv_lc_currency"]
                });
                const objUpd = {
                    custrecord_scv_loa_entity: lkLoan.custrecordentity?.[0]?.value || '',
                    custrecord_scv_db_subsidiary: lkLoan.custrecord_scv_loan_contract_subsidiary?.[0]?.value || '',
                    custrecord_scv_loa_currency: lkLoan.custrecord_scv_lc_currency?.[0]?.value || ''
                };
                Object.keys(objUpd).forEach(fld => newRecord.setValue(fld, objUpd[fld]));
            }
        }
    }

    function beforeLoadLoanPrincipalInterest(scriptContext) {
        if (scriptContext.type === "view") {
            let form = scriptContext.form;
            let link1 = url.resolveScript({scriptId: "customscript_scv_sl_calc_landcost", deploymentId: "customdeploy_scv_sl_backend", params: {action: "principalpayment", loanid: scriptContext.newRecord.id,},});
            let link2 = url.resolveScript({scriptId: "customscript_scv_sl_calc_landcost", deploymentId: "customdeploy_scv_sl_backend", params: {action: "postpaidinterest", loanid: scriptContext.newRecord.id,},});
            let linkLenhChiWriteCheck = url.resolveRecord({recordType: "custompurchase_scv_lenhchi", isEditMode: true, params: {action: "prepaidinterest", loanid: scriptContext.newRecord.id,},});
            form.addButton({id: "custpage_principal_payment", label: "Principal Payment", functionName: `window.open("${link1}")`,});
            form.addButton({id: "custpage_postpaid_interest", label: "Postpaid Interest", functionName: `window.open("${link2}")`,});
            form.addButton({id: "custpage_prepaid_interest", label: "Prepaid Interest", functionName: `window.location.replace("${linkLenhChiWriteCheck}")`,});
        }
    }

    function beforeSubmit(scriptContext) {}

    function afterSubmit(scriptContext) {}

    return {
        beforeLoad: beforeLoad,
        // beforeSubmit: beforeSubmit,
        // afterSubmit: afterSubmit,
    };
});
