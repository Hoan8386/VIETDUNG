/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/runtime', 'N/search',
        '../lib/scv_lib_cmms.js'],
    
    (runtime, search, libCmms) => {
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
                if (recType === libCmms.CmmsRecordType.NGHIEM_THU_THIET_BI) {
                    let request = scriptContext.request;
                    if (request && request.parameters && request.parameters.cmms_wo_action === libCmms.CmmsRecordType.NGHIEM_THU_THIET_BI) {
                        let lkFieldsSCBD = search.lookupFields({type: libCmms.CmmsRecordType.SUA_CHUA_BAO_DUONG, id: request.parameters.scbd_id,
                            columns: ['custrecord_scv_cmms_wo_asset.name', 'custrecord_scv_cmms_wo_asset.altname', 'custrecord_scv_cmms_wo_asset.custrecord_scv_asset_unit', 'custrecord_scv_cmms_wo_equipment']});
                        
                        newRecord.setValue('custrecord_scv_accept_cmmsworkorder', request.parameters.scbd_id);
                        setHeaderNghiemThuThietBiDetail(newRecord, lkFieldsSCBD);
                        setSublistValueNghiemThuThietBiDetail(newRecord, lkFieldsSCBD);
                    }
                }
            }
        }
        
        const setHeaderNghiemThuThietBiDetail = (newRecord, lkFieldsSCBD) => {
            newRecord.setValue('custrecord_scv_accept_todo_dept', runtime.getCurrentUser().department);
            newRecord.setValue('custrecord_scv_accept_ma_tbi', lkFieldsSCBD['custrecord_scv_cmms_wo_asset.name']);
            newRecord.setValue('custrecord_scv_accept_ten_tbi', lkFieldsSCBD['custrecord_scv_cmms_wo_asset.altname']);
            newRecord.setValue('custrecord_scv_accept_unit', lkFieldsSCBD['custrecord_scv_cmms_wo_asset.custrecord_scv_asset_unit'][0]?.value);
            newRecord.setValue('custrecord_scv_accept_qty', 1);
        }
        
        const setSublistValueNghiemThuThietBiDetail = (newRecord, lkFieldsSCBD) => {
            newRecord.setSublistValue({sublistId: libCmms.CmmsSublistId.NGHIEM_THU_THIET_BI_CHI_TIET, fieldId: 'custrecord_scv_accept_detail_tdesc', line: 0, value: lkFieldsSCBD.custrecord_scv_cmms_wo_equipment[0]?.text});
            newRecord.setSublistValue({sublistId: libCmms.CmmsSublistId.NGHIEM_THU_THIET_BI_CHI_TIET, fieldId: 'custrecord_scv_accept_pass_fail', line: 0, value: libCmms.CmmsPassedFailed.CHO_KIEM});
        }
        
        return {beforeLoad}
        
    });
