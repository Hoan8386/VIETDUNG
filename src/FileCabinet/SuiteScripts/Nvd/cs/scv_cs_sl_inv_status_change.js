/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/currentRecord', 'N/url'],
    function (currentRecord, url) {
        const CustomScriptId = {
            SCRIPT_ID: 'customscript_scv_sl_inv_status_change',
            DEPLOYMENT_ID: {UI: 'customdeploy_scv_sl_inv_status_change'},
        };
        const CustomFieldId = {
            SUBSIDIARY: 'custpage_scv_subsidiary',
            INS_LOT: 'custpage_scv_ins_lot',
            FROM_DATE: 'custpage_scv_from_date',
            TO_DATE: 'custpage_scv_to_date',
            LOCATION: 'custpage_scv_location',
            ITEM: 'custpage_scv_item',
            RELATED_TRANS: 'custpage_scv_related_trans',
            DOC_NO: 'custpage_scv_docno',
            LOT_NO: 'custpage_scv_lot_no',
        };
        const SUBLIST_ID = 'custpage_scv_sublist';

        const pageInit = (scriptContext) => {
            let objParams = getUrlVars();
            if (objParams.isSearch === 'T') disabledFields(scriptContext.currentRecord);
        };

        const fieldChanged = (scriptContext) => {
            let {fieldId, currentRecord} = scriptContext;
            if (fieldId === CustomFieldId.SUBSIDIARY) {
                onClickBtn('&isFieldChanged=T');
            }
        };

        const disabledFields = (curRec) => Object.values(CustomFieldId).forEach(field => curRec.getField(field).isDisabled = true);

        const saveRecord = (scriptContext) => {
            let curRec = scriptContext.currentRecord;
            const numLineSelected = counterLineSelected(curRec, SUBLIST_ID, 'select');
            if (numLineSelected === 0) {
                alert('Please select less than one line');
                return false
            }
            return true;
        };

        const counterLineSelected = (curRec, sublistId, fldIdCheck) => {
            const lineCount = curRec.getLineCount({sublistId: sublistId});
            let count = 0;
            for (let i = 0; i < lineCount; i++) {
                let sl = curRec.getSublistValue({sublistId: sublistId, fieldId: fldIdCheck, line: i});
                if (sl === 'T' || sl === true) {
                    count++;
                }
            }
            return count;
        };

        const onClickBtn = (objParams) => {
            window.onbeforeunload = null;
            let curRec = currentRecord.get();
            let objTrans = {};
            let options = getOptions(curRec);
            let alertCt = getContentAlert(options);
            if (alertCt && objParams.indexOf("isFieldChanged") === -1) {
                alert(alertCt);
                return;
            }
            let urlLink = getUrl(curRec, objTrans);
            urlLink += addParams(options);
            if (typeof objParams === 'string') {
                urlLink += objParams;
            } else if (typeof objParams === 'object') {
                urlLink += addParams(objParams);
            }
            window.location.replace(urlLink);
        }

        const addParams = (options) => Object.entries(options).reduce((pre, [key, value]) => pre + `&${key}=${value}`, "");

        const getContentAlert = (options) => {
            if (!options.subsidiary) {
                return "Please choose Subsidiary!";
            }
            if (!options.fromDate) {
                return "Please choose From Date!";
            }
            if (!options.toDate) {
                return "Please choose To Date!";
            }
            return '';
        };

        const getOptions = (curRec) => ({
            subsidiary: curRec.getValue(CustomFieldId.SUBSIDIARY),
            fromDate: curRec.getText(CustomFieldId.FROM_DATE),
            toDate: curRec.getText(CustomFieldId.TO_DATE),
            location: curRec.getValue(CustomFieldId.LOCATION).toString(),
            inspectionLot: curRec.getValue(CustomFieldId.INS_LOT),
            inboundOrderNo: encodeURIComponent(curRec.getValue(CustomFieldId.DOC_NO)),
            item: curRec.getValue(CustomFieldId.ITEM).toString(),
            relatedTrans: encodeURIComponent(curRec.getValue(CustomFieldId.RELATED_TRANS)),
            lotNo: encodeURIComponent(curRec.getValue(CustomFieldId.LOT_NO)),
            isRun: "T",
        });

        const getUrl = (curRec, objTrans) => url.resolveScript({
            scriptId: CustomScriptId.SCRIPT_ID,
            deploymentId: CustomScriptId.DEPLOYMENT_ID.UI,
            params: objTrans
        });

        const getUrlVars = () => {
            let vars = {};
            window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
                vars[key] = value;
            });
            return vars;
        };

        return {
            pageInit: pageInit,
            onClickBtn: onClickBtn,
            saveRecord: saveRecord,
            fieldChanged: fieldChanged
        };
    });
