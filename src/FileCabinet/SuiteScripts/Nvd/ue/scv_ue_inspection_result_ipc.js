/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define([ 'N/url', 'N/record', 'N/search', '../lib/scv_lib_function.js', '../lib/scv_lib_qaqc.js'],
    function (url, record, search, lfunc, qaqc) {
        function beforeLoad(scriptContext) {
            const tgType = scriptContext.type;
            if (tgType === 'view') {
                let newRecord = scriptContext.newRecord;
                const objValidCreateInspec = getObjValidCreateInspection(newRecord);
                if (objValidCreateInspec.isShowButton) {
                    let form = scriptContext.form;
                    addButtonMFGIPC(form, newRecord.id, newRecord.type);
                    if (!objValidCreateInspec.isAutoIPCInbound) {
                        addButtonIPCInbound(form, newRecord.id, newRecord.type);
                    }
                }
            }
        }


        const addButtonIPCInbound = (form, internalId, type) => {
            let createPdfUrl = url.resolveScript({
                scriptId: 'customscript_scv_sl_crt_ins_result',
                deploymentId: 'customdeploy_scv_sl_crt_ins_result',
                returnExternalUrl: false
            });
            createPdfUrl += '&createdfromid=' + internalId + '&createdrectype=' + type
            form.addButton({
                id: 'custpage_bt_ipc_inspection',
                label: 'IPC inspection',
                functionName: "window.location.replace('" + createPdfUrl + "');"
            });
        }

        const addButtonMFGIPC = (form, internalId, type) => {
            let createPdfUrl = url.resolveScript({
                scriptId: 'customscript_scv_sl_mfg_inspection',
                deploymentId: 'customdeploy_scv_sl_mfg_inspection',
                returnExternalUrl: false
            });
            createPdfUrl += '&createdfromid=' + internalId + '&createdrectype=' + type
            form.addButton({
                id: 'custpage_bt_mfg_inspection',
                label: 'MFG Inspection',
                functionName: "window.location.replace('" + createPdfUrl + "');"
            });
        }

        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type
         * @Since 2015.2
         */
        function beforeSubmit(scriptContext) {

        }

        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type
         * @Since 2015.2
         */
        function afterSubmit(scriptContext) {
            createInboundInspectionResult(scriptContext);
        }

        const createInboundInspectionResult = (scriptContext) => {
            const triggerType = scriptContext.type;
            if (triggerType === 'delete') return;
            let newRecord = scriptContext.newRecord;
            const objValidCreateInspec = getObjValidCreateInspection(newRecord);
            const tranType = newRecord.type;
            const tranId = newRecord.id;
            if (objValidCreateInspec.isAutoIPCInbound) {
                qaqc.generateInspectionResultsOfTrans(tranType, tranId);
            }
        }

        const getObjValidCreateInspection = (newRecord) => {
            let objRes = {
                isShowButton: false,
                isAutoIPCInbound: false
            };
            let status = newRecord.getValue('status');
            //let approval_statusText = newRecord.getText('custbody_scv_approval_status').toString().toUpperCase();
            let approval_status = newRecord.getValue('custbody_scv_approval_status') * 1;
            let inspect_started = newRecord.getValue('custbody_scv_inspection_started');
            let inspection_plan = newRecord.getValue('custbody_scv_inspect_plan_assy');
            const arrStatusWO = ['Released', 'In Process', 'Closed', 'Built'];
            const showBtnInspection = ((qaqc.checked(inspect_started) && arrStatusWO.includes(status))) && (approval_status === 3);
            if (!showBtnInspection) return objRes;
            let item = newRecord.getValue('assemblyitem');
            let subsidiaryId = newRecord.getValue('subsidiary');
            let lkItem = search.lookupFields({
                type: 'item',
                id: item,
                columns: ['custitem_scv_inspection_plan']
            });
            let lkSub = search.lookupFields({
                type: 'subsidiary',
                id: subsidiaryId,
                columns: ['custrecord_scv_sub_auto_created_ib_qc']
            });
            if (!lfunc.isContainValue(inspection_plan)) inspection_plan = lkItem.custitem_scv_inspection_plan?.[0]?.value || '';
            if (!lfunc.isContainValue(inspection_plan)) return objRes;
            objRes.isShowButton = true;
            objRes.isAutoIPCInbound = lkSub.custrecord_scv_sub_auto_created_ib_qc;
            return objRes;
        }

        return {
            beforeLoad: beforeLoad,
            beforeSubmit: beforeSubmit,
            afterSubmit: afterSubmit
        };

    });
