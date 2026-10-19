/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/runtime', 'N/search', '../lib/scv_lib_cmms.js'],
    
    (record, runtime, search, libCmms) => {
        /**
         * Defines the function definition that is executed before record is loaded.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @param {Form} scriptContext.form - Current form
         * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
         * @since 2015.2
         */
        const beforeLoad = (scriptContext) => {
            let tgType = scriptContext.type;
            let newRecord = scriptContext.newRecord;
            let recType = newRecord.type;
            if (tgType === scriptContext.UserEventType.CREATE) {
                if (recType === libCmms.CmmsRecordType.DIEU_CHUYEN_TS) {
                    let request = scriptContext.request;
                    if (request && request.parameters && request.parameters.scbd_id) {
                        let scbd_id = request.parameters.scbd_id;
                        let lkScbd = search.lookupFields({
                            type: libCmms.CmmsRecordType.SUA_CHUA_BAO_DUONG, id: scbd_id,
                            columns: ['custrecord_scv_cmms_wo_subsidiary', 'custrecord_scv_cmms_wo_date', 'custrecord_scv_cmms_wo_creator', 'custrecord_scv_cmms_wo_asset']
                        });
                        newRecord.setValue('custrecord_scv_asset_transfer_scbd', scbd_id);
                        newRecord.setValue('custrecord_scv_asset_transfer_sub', lkScbd.custrecord_scv_cmms_wo_subsidiary[0]?.value);
                        newRecord.setValue('custrecord_scv_asset_transfer_date', lkScbd.custrecord_scv_cmms_wo_date);
                        newRecord.setValue('custrecord_scv_asset_transfer_creator', lkScbd.custrecord_scv_cmms_wo_creator[0]?.value);
                        //newRecord.setValue('custrecord_scv_asset_transfer_ass', lkScbd.custrecord_scv_cmms_wo_asset[0]?.value);
                        runtime.getCurrentSession().set('assetTransferScbdId', String(lkScbd.custrecord_scv_cmms_wo_asset[0]?.value || ''));
                    }
                }
            }
        }
        
        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (scriptContext) => {
        
        }
        
        /**
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const afterSubmit = (scriptContext) => {
            let tgType = scriptContext.type;
            let newRecord = scriptContext.newRecord;
            let recType = newRecord.type;
            if (tgType === scriptContext.UserEventType.CREATE) {
                if (recType === libCmms.CmmsRecordType.DIEU_CHUYEN_TS) {
                    let scbd = newRecord.getValue('custrecord_scv_asset_transfer_scbd');
                    if (scbd) {
                        let lkScbd = search.lookupFields({
                            type: libCmms.CmmsRecordType.SUA_CHUA_BAO_DUONG, id: scbd,
                            columns: ['custrecord_scv_cmms_wo_asset_transfer']
                        });
                        let asset_transfer = lkScbd.custrecord_scv_cmms_wo_asset_transfer;
                        if(typeof asset_transfer === 'string') {
                            asset_transfer = asset_transfer.split(',');
                            asset_transfer.push(newRecord.id);
                            asset_transfer = asset_transfer.join(',');
                        } else if(util.isArray(asset_transfer)) {
                            asset_transfer = asset_transfer.map(item => item.value);
                            asset_transfer.push(newRecord.id);
                        } else {
                            asset_transfer = newRecord.id;
                        }
                        
                        record.submitFields({
                            type: libCmms.CmmsRecordType.SUA_CHUA_BAO_DUONG,
                            id: scbd,
                            values: {custrecord_scv_cmms_wo_asset_transfer: asset_transfer}
                        });
                    }
                }
            }
        }
        
        return {beforeLoad, beforeSubmit, afterSubmit}
        
    });
