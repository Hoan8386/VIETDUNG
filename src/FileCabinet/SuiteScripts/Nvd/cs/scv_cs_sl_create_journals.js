/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */

define(['N/currentRecord', 'N/url'], function (currentRecord, url) {
    const SCRIPT_ID_SL = "customscript_scv_sl_create_journals";
    const DEPLOY_ID_SL = "customdeploy_scv_sl_create_journals";
    const pageInit = () => {};

    const btnSearch = () => {
        window.onbeforeunload = null;
        let currRec = currentRecord.get();
        const options = {
            search_params: "1",
            subsidiary: currRec.getValue("custpage_scv_subsidiary"),
            fromDate: currRec.getText("custpage_scv_fromdate"),
            toDate: currRec.getText("custpage_scv_todate"),
        };
        const urlLink = url.resolveScript({scriptId: SCRIPT_ID_SL, deploymentId: DEPLOY_ID_SL, returnExternalUrl: false, params: options});
        const blValidateValue = options.subsidiary && options.fromDate && options.toDate;
        if (blValidateValue) {
            window.location.replace(urlLink)
        } else  {
            alert("Pleases enter values: Đơn vị, Từ ngày, Đến ngày");
        }
    };

    return {
        btnSearch,
        pageInit: pageInit
    }
})