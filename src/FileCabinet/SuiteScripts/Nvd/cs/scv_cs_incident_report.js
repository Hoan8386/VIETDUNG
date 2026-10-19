/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/currentRecord', 'N/url', 'N/log'], function (currentRecordModule, url, log) {

    function pageInit(scriptContext) {

    }



    function searchReport() {
        const currentRec = currentRecordModule.get();
        const params = getParams(currentRec);

        window.location.href = url.resolveScript({
            scriptId: 'customscript_scv_sl_incident_report', // cập nhật nếu cần
            deploymentId: 'customdeploy_scv_sl_incident_report', // cập nhật nếu cần
            returnExternalUrl: false,
            params: {
                ...params,
                issearch: 'T'
            }
        });
    }

    function refreshPage() {
        // Gán trực tiếp link Suitelet không có tham số (tức là trạng thái ban đầu)
        window.location.href = url.resolveScript({
            scriptId: 'customscript_scv_sl_incident_report', // cập nhật nếu cần
            deploymentId: 'customdeploy_scv_sl_incident_report', // cập nhật nếu cần
            returnExternalUrl: false
        });
    }

    function getParams(currentRec) {
        const fieldIds = [
            'date_from',
            'date_to',
            'CUSTPAGE_DEPT',
            'custpage_asset_code',
            'custpage_asset_name',
            'custpage_serial',
            'custpage_ccdc_code',
            'custpage_ccdc_name',
            'custpage_scbd',
            'custpage_pr',
            'custpage_po'
        ];

        const params = {};
        for (let id of fieldIds) {
            const value = currentRec.getValue({ fieldId: id });
            if (value && value.length > 0) {
                // Gộp nhiều lựa chọn thành chuỗi phân cách bởi dấu phẩy
                params[id.replace('custpage_', '')] = Array.isArray(value) ? value.join(',') : value;
            }
        }
        return params;
    }


    return {
        pageInit: pageInit,
        searchReport: searchReport,
        refreshPage: refreshPage
    };
});
