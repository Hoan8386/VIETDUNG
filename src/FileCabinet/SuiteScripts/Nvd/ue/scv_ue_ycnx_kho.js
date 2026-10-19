/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/search', 'N/url',
        '../lib/scv_lib_function.js'],
    (search, url, libFunc) => {
        
        const beforeLoad = (scriptContext) => {
            addBtnMakeAdjustment(scriptContext);
        };
        
        const addBtnMakeAdjustment = (scriptContext) => {
            const triggerType = scriptContext.type;
            if (triggerType !== 'view') return;
            let newRecord = scriptContext.newRecord;
            const recType = newRecord.type;
            let form = scriptContext.form;
            if (!isCreateInventoryAdjust(newRecord)) return;
            const urlAdj = url.resolveScript({
                scriptId: 'customscript_scv_crt_inv_adj_from_ycxn',
                deploymentId: 'customdeploy_scv_crt_inv_adj_from_ycxn',
                returnExternalUrl: false,
                params: {
                    recid: newRecord.id,
                    rectype: recType
                }
            });
            let idButtonMakeAdjustment = 'custpage_bt_make_adjustment';
            libFunc.addCssPleaseWait(form);
            libFunc.addButtonReplace(form, idButtonMakeAdjustment, 'Make Adjustment', urlAdj);
        }
        
        const isCreateInventoryAdjust = (newRecord) => {
            const STATUS_APPROVED = '3';
            const statusId = newRecord.getValue('custbody_scv_approval_status');
            if (statusId !== STATUS_APPROVED) return false;
            const arrTransRelId = newRecord.getValue('custbody_scv_related_transaction');
            return arrTransRelId.length === 0;
        };
        
        return {
            beforeLoad
        };
        
    });
