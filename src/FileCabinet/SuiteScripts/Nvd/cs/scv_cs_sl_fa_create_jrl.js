/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/currentRecord', 'N/url', 'N/ui/message', 'N/runtime', 'N/https'],
    function (currentRecord, url, message, runtime, https) {
        const objDataConfig = {
            ID: {SUBLIST: "custpage_scv_sublist",},
            SCRIPT_ID: 'customscript_scv_sl_fa_create_jrl',
            DEPLOYMENT_ID: {UI: 'customdeploy_scv_sl_fa_create_jrl'},
        };
        const MAX_LINE_SELECTED_CREATE_FROM_SUITELET = 25;

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
            let objParams = getUrlVars();
            if (objParams.isSearch === 'T') disabledFields(scriptContext.currentRecord);
            if (objParams?.isCreateFromSL === 'T') showResultJournalEntry();
        }

        const disabledFields = (curRec) => ['custpage_scv_subsidiary', 'custpage_scv_project', 'custpage_scv_category', 'custpage_scv_asset','custpage_scv_project', 'custpage_scv_todate', 'custpage_scv_fromdate'].forEach(field => curRec.getField(field).isDisabled = true);

        const showResultJournalEntry = ()  => {
            message.create({
                title: 'Success',
                message: '<div>List Journal Entry : <a href="' + '/app/common/search/searchresults.nl?searchtype=Transaction&Transaction_CREATEDBY='+runtime.getCurrentUser().id+'&style=NORMAL&report=&grid=&searchid=customsearch_scv_ss_fa_create_jrl&whence=' + '" target="_blank">View</a></div>',
                type: message.Type.INFORMATION
            }).show();
        }

        function saveRecord(scriptContext) {
            let curRec = scriptContext.currentRecord;
            const numLineSelected = counterLineSelected(curRec, objDataConfig.ID.SUBLIST, 'select');
            if (numLineSelected === 0) {
                alert('Please select less than one line');
                return false
            }
            if (numLineSelected > MAX_LINE_SELECTED_CREATE_FROM_SUITELET) {
                if (checkJobRunning('customdeploy_scv_mr_fa_create_jrl')) {
                    alert('Job has been running, please try again later.');
                    return;
                }
            }
            return true;
        }

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
        }

        const onClickFC = (objParams) => {
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
            if (!options.pSubsidiary) {
                return "Please choose Subsidiary";
            }
            if (!options.pCategory) {
                return "Please choose Category";
            }
            if (!options.pFromDate) {
                return "Please choose From Date";
            }
            if (!options.pToDate) {
                return "Please choose To Date";
            }
            return '';
        }

        const getOptions = (currRec) => ({
            pSubsidiary: currRec.getValue({fieldId: 'custpage_scv_subsidiary'}),
            pCategory: currRec.getValue({fieldId: 'custpage_scv_category'}),
            pProject: currRec.getValue({fieldId: 'custpage_scv_project'}),
            pFromDate: currRec.getText({fieldId: 'custpage_scv_fromdate'}),
            pToDate: currRec.getText({fieldId: 'custpage_scv_todate'}),
            pAsset: currRec.getValue({fieldId: 'custpage_scv_asset'}),
            isRun: "T",
        });

        const getUrl = (curRec, objTrans) => url.resolveScript({
            scriptId: objDataConfig.SCRIPT_ID,
            deploymentId: objDataConfig.DEPLOYMENT_ID.UI,
            params: objTrans
        });

        const getUrlVars = () => {
            let vars = {};
            window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
                vars[key] = value;
            });
            return vars;
        }

        const checkJobRunning = (deployId) => {
            let scriptletUrl = url.resolveScript({scriptId: 'customscript_scv_sl_calldata', deploymentId: 'customdeploy_scv_sl_calldata', params : {
                    mrId : deployId,
                    action: 'checkJob',
                }});
            let objRes = https.get({url: scriptletUrl});
            if (objRes.code === 200) {
                let objBody = JSON.parse(objRes.body);
                if (!objBody.isSuccess) {
                    alert(objBody.msg);
                    return false;
                }
                return objBody?.isJobRunning === 'T';
            }
            return false;
        };

        const calcTotalAmount = () => {
            let curRec = currentRecord.get();
            const idxAmt = 'c3';
            const idxSelectCols = 'select';
            let lc = curRec.getLineCount({sublistId: objDataConfig.ID.SUBLIST});
            let totalAmount = 0;
            for (let i = 0; i < lc; i++) {
                let mark = curRec.getSublistValue({sublistId: objDataConfig.ID.SUBLIST, fieldId: idxSelectCols, line: i});
                if (mark === 'F' || mark == false) continue;
                let amount = curRec.getSublistValue({sublistId: objDataConfig.ID.SUBLIST, fieldId: idxAmt, line: i})*1;
                totalAmount += amount;
            }
            curRec.setValue('custpage_scv_total_amount', totalAmount, true);
        };

        return {
            pageInit: pageInit,
            onClickFC: onClickFC,
            saveRecord: saveRecord,
            calcTotalAmount: calcTotalAmount
        };
    });
