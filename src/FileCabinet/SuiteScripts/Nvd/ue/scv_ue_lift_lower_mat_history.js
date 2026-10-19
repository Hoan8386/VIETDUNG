/**
 * Nội dung: 
 * Key word: 
 * =======================================================================================
 *  Date                Author                  Description
 *  ?                   ?                       ?
 *  17 Dec 2024         Phu Pham                Transform data từ màn hình work order sang màn hình lifting/lowering mat history from mr. Việt (https://app.clickup.com/t/86cxaktnw)
 */
/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define([
    'N/record',
    '../lib/scv_lib_function.js',
    '../cons/scv_cons_lifttype.js'
],
    
    (
        record, lbf,
        constLiftType
    ) => {
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
            beforeLoad_transformDataFromWorkOrder(scriptContext);
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

        }

        const beforeLoad_transformDataFromWorkOrder = (scriptContext) => {
            let triggerType = scriptContext.type;
            if(triggerType !== 'create') return;

            let newRecord = scriptContext.newRecord;
            let params = scriptContext.request?.parameters || {};
            if(params.trantype !== 'workorder') return;

            let woRec = record.load({ type: params.trantype, id: params.tranid });
            let fields = [
                'custrecord_scv_lift_mat_lift_type', 'custrecord_scv_lift_mat_item', 'custrecord_scv_lift_mat_lot_serial', 
                'custrecord_scv_lift_mat_qc_material', 'custrecord_scv_lift_mat_units', 'custrecord_scv_lift_mat_wo_related',
            ];
            // TODO: for button Nâng from work order
            if(params.btntype === 'lifting') {
                lbf.setValueData(newRecord, fields, [
                    constLiftType.RECORDS.NANG.ID, params.item, params.lot_serial_selected, params.qc_serial_code, 
                    params.units, params.tranid

                ]);
                lbf.setValue(newRecord, woRec, [
                    'custrecord_scv_lift_mat_location', 'custrecord_scv_lift_mat_woc', 'custrecord_scv_lift_mat_subsidiary', 'custrecord_scv_lift_mat_prod_lot', 
                ], [
                    'location', 'custbody_mfgmob_workcenter', 'subsidiary', 'custbody_scv_assembly_lot'								
                ]);
            }
            // TODO: for button Hạ from work order
            else if(params.btntype === 'lowering') {
                lbf.setValueData(newRecord, fields, [
                    constLiftType.RECORDS.HA.ID, params.item, params.lot_serial_selected, params.qc_serial_code, 
                    params.units, params.tranid

                ]);
                lbf.setValue(newRecord, woRec, [
                    'custrecord_scv_lift_mat_location', 'custrecord_scv_lift_mat_woc', 'custrecord_scv_lift_mat_subsidiary', 'custrecord_scv_lift_mat_prod_lot', 
                ], [
                    'location', 'custbody_mfgmob_workcenter', 'subsidiary', 'custbody_scv_assembly_lot'								
                ]);
            }
        }

        return {beforeLoad}

    });
