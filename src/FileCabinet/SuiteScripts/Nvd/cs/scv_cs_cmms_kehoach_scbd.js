/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/query', 'N/url', '../lib/scv_lib_cs'],
    
    function (ccr, query, url, libCs) {
        
        const SUBLISTID_RESULT = 'custpage_sl_result';
        
        const CmmsScbdType = {
            SU_CO_PHAT_SINH: '2',
            HANG_THANG: '4',
            BAO_DUONG_PHAT_SINH: '101',
        }
        
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
            let currentRecord = scriptContext.currentRecord;
            let lineCount = currentRecord.getLineCount(SUBLISTID_RESULT);
            let sublistFieldsResult = ['custrecord_scv_cmms_mp_type_l', 'department', 'custrecord_scv_cmms_eq_workitem', 'custrecord_scv_cmms_wi_description', 'custrecord_scv_cmms_mp_fromdate_l', 'custrecord_scv_cmms_mp_fromtime_l', 'custrecord_scv_cmms_mp_todate_l', 'custrecord_scv_cmms_mp_totime_l', 'custrecord_scv_cmms_mp_memo_l'];
            for (let i = 0; i < lineCount; i++) {
                let id = currentRecord.getSublistValue({sublistId: SUBLISTID_RESULT, fieldId: 'id', line: i});
                if (!id) {
                    disableLineFields(sublistFieldsResult, currentRecord, i, true);
                }
            }
            
        }
        
        const disableLineFields = (sublistFieldsResult, currentRecord, line, isDisabled) => {
            for (let fieldId of sublistFieldsResult) {
                disableField(fieldId, currentRecord, line, isDisabled);
            }
        }
        
        const disableField = (fieldId, currentRecord, line, isDisabled) => {
            let objField = currentRecord.getSublistField({
                sublistId: SUBLISTID_RESULT,
                fieldId: fieldId,
                line: line
            });
            if (objField) {
                objField.isDisabled = isDisabled;
            }
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
            let currentRecord = scriptContext.currentRecord;
            if (scriptContext.fieldId === 'custrecord_scv_cmms_mp_type_l') {
                let cmmsScbdType = currentRecord.getCurrentSublistValue({sublistId: scriptContext.sublistId, fieldId: 'custrecord_scv_cmms_mp_type_l'});
                let sublistLineFieldsDisabled = ['custrecord_scv_cmms_eq_workitem', 'custrecord_scv_cmms_wi_description'];
                let line = currentRecord.getCurrentSublistIndex(scriptContext.sublistId);
                if(cmmsScbdType === CmmsScbdType.HANG_THANG) {
                    let workitem_hidden = currentRecord.getCurrentSublistValue({sublistId: scriptContext.sublistId, fieldId: 'custrecord_scv_cmms_eq_workitem_hidden'}) || '';
                    let description_hidden = currentRecord.getCurrentSublistValue({sublistId: scriptContext.sublistId, fieldId: 'custrecord_scv_cmms_wi_description_hidden'}) || '';
                    currentRecord.setCurrentSublistValue({sublistId: scriptContext.sublistId, fieldId: 'custrecord_scv_cmms_eq_workitem', value: workitem_hidden});
                    currentRecord.setCurrentSublistValue({sublistId: scriptContext.sublistId, fieldId: 'custrecord_scv_cmms_wi_description', value: description_hidden});
                    disableLineFields(sublistLineFieldsDisabled, currentRecord, line, true);
                } else {
                    let workitem_default = currentRecord.getCurrentSublistValue({sublistId: scriptContext.sublistId, fieldId: 'custrecord_scv_cmms_eq_workitem_default'}) || '';
                    let description_default = currentRecord.getCurrentSublistValue({sublistId: scriptContext.sublistId, fieldId: 'custrecord_scv_cmms_wi_description_default'}) || '';
                    currentRecord.setCurrentSublistValue({sublistId: scriptContext.sublistId, fieldId: 'custrecord_scv_cmms_eq_workitem', value: workitem_default});
                    currentRecord.setCurrentSublistValue({sublistId: scriptContext.sublistId, fieldId: 'custrecord_scv_cmms_wi_description', value: description_default});
                    disableLineFields(sublistLineFieldsDisabled, currentRecord, line, false);
                }
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
            let currentRecord = scriptContext.currentRecord;
            let message = 'Hãy chọn ít nhất một line!';
            
            let lineCount = currentRecord.getLineCount(SUBLISTID_RESULT);
            let isValid = !!lineCount;
            if (!isValid) {
                alert(message);
            } else {
                isValid = false;
                for(let i = 0; i < lineCount; i++) {
                    let workitem = currentRecord.getSublistValue({
                        sublistId: SUBLISTID_RESULT,
                        fieldId: 'custrecord_scv_cmms_eq_workitem',
                        line: i
                    });
                    if(workitem) {
                        isValid = true;
                    }
                }
                if(!isValid) {
                    alert('Chưa có Công việc thực hiện!');
                } else {
                    const prefixNameKHBD = 'Kế hoạch bảo dưỡng';
                    const periodName = currentRecord.getText('custpage_period');
                    const dicAssetDisplay = getDicKeHoachBaoDuongLine(currentRecord);
                    let altnames = [];
                    for (let assetDisplay in dicAssetDisplay) {
                        altnames.push(`'${prefixNameKHBD} ${assetDisplay} ${periodName}'`);
                    }
                    let sqlKHBD = `select mpl.id, mpl.altname from customrecord_scv_cmms_maintenanceplan_h mpl where mpl.altname in (${altnames.join(',')})`;
                    let resultSet = query.runSuiteQL({
                        query: sqlKHBD,
                        params: []
                    });
                    let listRes = resultSet.asMappedResults();
                    if (listRes.length > 0) {
                        isValid = false;
                        message = 'Đã có kế hoạch cho ' + (listRes.map(o => o.altname).join(', '));
                        alert(message);
                    } else {
                        libCs.showPleaseWait();
                    }
                }
            }
            return isValid;
        }
        
        const getDicKeHoachBaoDuongLine = (currentRecord) => {
            let dicAssetDisplay = Object.create(null);
            let lineCountKHBDLine = currentRecord.getLineCount(SUBLISTID_RESULT);
            for (let line = 0; line < lineCountKHBDLine; line++) {
                let chiTietMayId = currentRecord.getSublistValue({
                    sublistId: SUBLISTID_RESULT,
                    fieldId: 'id',
                    line: line
                });
                if (chiTietMayId) {
                    dicAssetDisplay[currentRecord.getSublistValue({
                        sublistId: SUBLISTID_RESULT,
                        fieldId: 'custrecord_scv_cmms_eq_asset_display_hidden',
                        line: line
                    })] = currentRecord.getSublistValue({
                        sublistId: SUBLISTID_RESULT,
                        fieldId: 'custrecord_scv_cmms_eq_asset',
                        line: line
                    })
                }
            }
            return dicAssetDisplay;
        }
        
        function searchReport() {
            window.onbeforeunload = null;
            let currentRecord = ccr.get();
            let urlDC = getUrlParam(currentRecord) + '&issearch=T';
            window.location.replace(urlDC);
        }
        
        function getUrlParam(currentRecord) {
            return url.resolveScript({
                scriptId: 'customscript_scv_sl_cmms_kehoach_scbd',
                deploymentId: 'customdeploy_scv_sl_cmms_kehoach_scbd',
                returnExternalUrl: false,
                params: getParam(currentRecord)
            });
        }
        
        function getParam(currentRecord) {
            return {
                custpage_subsidiary: currentRecord.getValue('custpage_subsidiary'),
                custpage_period: currentRecord.getValue('custpage_period'),
                custpage_period_text: currentRecord.getText('custpage_period'),
                custpage_famasset: currentRecord.getValue('custpage_famasset'),
                custpage_department_use: currentRecord.getValue('custpage_department_use'),
                custpage_department_manage: currentRecord.getValue('custpage_department_manage'),
                custpage_department_default: currentRecord.getValue('custpage_department_default')
            }
        }
        
        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            saveRecord: saveRecord,
            searchReport: searchReport
        };
        
    });
