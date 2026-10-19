/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/record', 'N/runtime', '../lib/scv_lib_cmms.js'],
    
    (record, runtime, libCmms) => {
        /**
         * Defines the function that is executed at the beginning of the map/reduce process and generates the input data.
         * @param {Object} inputContext
         * @param {boolean} inputContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {Object} inputContext.ObjectRef - Object that references the input data
         * @typedef {Object} ObjectRef
         * @property {string|number} ObjectRef.id - Internal ID of the record instance that contains the input data
         * @property {string} ObjectRef.type - Type of the record instance that contains the input data
         * @returns {Array|Object|Search|ObjectRef|File|Query} The input data to use in the map/reduce process
         * @since 2015.2
         */

        const getInputData = (inputContext) => {
            let maintenancePlan = runtime.getCurrentScript().getParameter('custscript_scv_mr_cmms_maintenanceplan');
            let listChiTiet = [];
            if(maintenancePlan) {
                maintenancePlan = JSON.parse(maintenancePlan);
                
                let recMaintennancePlan = record.load({type: libCmms.CmmsRecordType.KE_HOACH_BAO_DUONG, id: maintenancePlan.maintenanceplan_id});
                pushListData(recMaintennancePlan, listChiTiet, maintenancePlan);
            }
            return listChiTiet;
        }
        
        let pushListData = (recMaintennancePlan, listChiTiet, maintenanceplan) => {
            let lineCountKHBDChiTiet = recMaintennancePlan.getLineCount({sublistId: libCmms.CmmsSublistId.KHBD_CHI_TIET});
            for(let i = 0; i < lineCountKHBDChiTiet; i++) {
                let workorder_l = recMaintennancePlan.getSublistValue({
                    sublistId: libCmms.CmmsSublistId.KHBD_CHI_TIET,
                    fieldId: 'custrecord_scv_cmms_mp_workorder_l',
                    line: i
                });
                if(workorder_l) continue;//khong add vao list khi da tao roi
                
                let equipment_l_text = recMaintennancePlan.getSublistText({
                    sublistId: libCmms.CmmsSublistId.KHBD_CHI_TIET,
                    fieldId: 'custrecord_scv_cmms_mp_asset_l',
                    line: i
                });
                let fromdate_l = recMaintennancePlan.getSublistValue({
                    sublistId: libCmms.CmmsSublistId.KHBD_CHI_TIET,
                    fieldId: 'custrecord_scv_cmms_mp_fromdate_l',
                    line: i
                });
                fromdate_l = fromdate_l ? (String(fromdate_l.getMonth() + 1) + '/' + String(fromdate_l.getFullYear())) : '';
                let actual_workitem_l = recMaintennancePlan.getSublistValue({
                    sublistId: libCmms.CmmsSublistId.KHBD_CHI_TIET,
                    fieldId: 'custrecord_scv_cmms_mp_actual_workitem_l',
                    line: i
                });
                let workitem_l = recMaintennancePlan.getSublistValue({
                    sublistId: libCmms.CmmsSublistId.KHBD_CHI_TIET,
                    fieldId: 'custrecord_scv_cmms_mp_workitem_l',
                    line: i
                });
                
                listChiTiet.push({
                    altname: `Bảo dưỡng ${equipment_l_text} tháng ${fromdate_l}`,
                    custrecord_scv_cmms_wo_subsidiary: maintenanceplan.subsidiary,
                    custrecord_scv_cmms_wo_asset: recMaintennancePlan.getSublistValue({
                        sublistId: libCmms.CmmsSublistId.KHBD_CHI_TIET,
                        fieldId: 'custrecord_scv_cmms_mp_asset_l',
                        line: i
                    }),
                    custrecord_scv_cmms_wo_component: recMaintennancePlan.getSublistValue({
                        sublistId: libCmms.CmmsSublistId.KHBD_CHI_TIET,
                        fieldId: 'custrecord_scv_cmms_mp_component_l',
                        line: i
                    }),
                    custrecord_scv_cmms_wo_equipment: recMaintennancePlan.getSublistValue({
                        sublistId: libCmms.CmmsSublistId.KHBD_CHI_TIET,
                        fieldId: 'custrecord_scv_cmms_mp_equipment_l',
                        line: i
                    }),
                    custrecord_scv_cmms_wo_teamincharge: recMaintennancePlan.getSublistValue({
                        sublistId: libCmms.CmmsSublistId.KHBD_CHI_TIET,
                        fieldId: 'custrecord_scv_cmms_mp_department_l',
                        line: i
                    }),
                    custrecord_scv_cmms_wo_type: recMaintennancePlan.getSublistValue({
                        sublistId: libCmms.CmmsSublistId.KHBD_CHI_TIET,
                        fieldId: 'custrecord_scv_cmms_mp_type_l',
                        line: i
                    }),
                    custrecord_scv_cmms_wo_workitem: actual_workitem_l || workitem_l,
                    customrecord_scv_cmms_maintenanceplan_l_id: recMaintennancePlan.getSublistValue({
                        sublistId: libCmms.CmmsSublistId.KHBD_CHI_TIET,
                        fieldId: 'id',
                        line: i
                    }),
                    custrecord_scv_cmms_wo_plannumber: recMaintennancePlan.getValue('name'),
                    custrecord_scv_cmms_wo_workitename: recMaintennancePlan.getSublistValue({
                        sublistId: libCmms.CmmsSublistId.KHBD_CHI_TIET,
                        fieldId: 'custrecord_scv_cmms_mp_description_l',
                        line: i
                    }),
                    custrecord_scv_cmms_wo_planfromdate: recMaintennancePlan.getSublistText({
                        sublistId: libCmms.CmmsSublistId.KHBD_CHI_TIET,
                        fieldId: 'custrecord_scv_cmms_mp_actual_fromdate_l',
                        line: i
                    }),
                    custrecord_scv_cmms_wo_planfromtime: recMaintennancePlan.getSublistText({
                        sublistId: libCmms.CmmsSublistId.KHBD_CHI_TIET,
                        fieldId: 'custrecord_scv_cmms_mp_fromtime_l',
                        line: i
                    }),
                    custrecord_scv_cmms_wo_plantodate: recMaintennancePlan.getSublistText({
                        sublistId: libCmms.CmmsSublistId.KHBD_CHI_TIET,
                        fieldId: 'custrecord_scv_cmms_mp_actual_todate_l',
                        line: i
                    }),
                    custrecord_scv_cmms_wo_plantotime: recMaintennancePlan.getSublistText({
                        sublistId: libCmms.CmmsSublistId.KHBD_CHI_TIET,
                        fieldId: 'custrecord_scv_cmms_mp_totime_l',
                        line: i
                    }),
                    custrecord_scv_cmms_wo_description: recMaintennancePlan.getSublistValue({
                        sublistId: libCmms.CmmsSublistId.KHBD_CHI_TIET,
                        fieldId: 'custrecord_scv_cmms_mp_memo_l',
                        line: i
                    }),
                    custrecord_scv_cmms_wo_repairnote: workitem_l,
                    custrecord_scv_cmms_wo_actual_repair: actual_workitem_l || workitem_l
                });
            }
        }
        
        /**
         * Defines the function that is executed when the map entry point is triggered. This entry point is triggered automatically
         * when the associated getInputData stage is complete. This function is applied to each key-value pair in the provided
         * context.
         * @param {Object} mapContext - Data collection containing the key-value pairs to process in the map stage. This parameter
         *     is provided automatically based on the results of the getInputData stage.
         * @param {Iterator} mapContext.errors - Serialized errors that were thrown during previous attempts to execute the map
         *     function on the current key-value pair
         * @param {number} mapContext.executionNo - Number of times the map function has been executed on the current key-value
         *     pair
         * @param {boolean} mapContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {string} mapContext.key - Key to be processed during the map stage
         * @param {string} mapContext.value - Value to be processed during the map stage
         * @since 2015.2
         */

        const map = (mapContext) => {
            try {
                let objWorkOrder = JSON.parse(mapContext.value);
                let recWorkOrder = record.create({type: libCmms.CmmsRecordType.SUA_CHUA_BAO_DUONG, isDynamic: true});
                recWorkOrder.setValue('altname', objWorkOrder.altname);
                recWorkOrder.setValue('custrecord_scv_cmms_wo_subsidiary', objWorkOrder.custrecord_scv_cmms_wo_subsidiary);
                recWorkOrder.setValue('custrecord_scv_cmms_wo_asset', objWorkOrder.custrecord_scv_cmms_wo_asset);
                recWorkOrder.setValue('custrecord_scv_cmms_wo_component', objWorkOrder.custrecord_scv_cmms_wo_component);
                recWorkOrder.setValue('custrecord_scv_cmms_wo_equipment', objWorkOrder.custrecord_scv_cmms_wo_equipment);
                recWorkOrder.setValue('custrecord_scv_cmms_wo_teamincharge', objWorkOrder.custrecord_scv_cmms_wo_teamincharge);
                recWorkOrder.setValue('custrecord_scv_cmms_wo_type', objWorkOrder.custrecord_scv_cmms_wo_type);
                recWorkOrder.setValue('custrecord_scv_cmms_wo_workitem', objWorkOrder.custrecord_scv_cmms_wo_workitem);
                recWorkOrder.setValue('custrecord_scv_cmms_wo_plannumber', objWorkOrder.custrecord_scv_cmms_wo_plannumber);
                recWorkOrder.setValue('custrecord_scv_cmms_wo_description', objWorkOrder.custrecord_scv_cmms_wo_description);
                
                recWorkOrder.setText('custrecord_scv_cmms_wo_planfromdate', objWorkOrder.custrecord_scv_cmms_wo_planfromdate);
                //recWorkOrder.setText('custrecord_scv_cmms_wo_planfromtime', objWorkOrder.custrecord_scv_cmms_wo_planfromtime);
                recWorkOrder.setText('custrecord_scv_cmms_wo_plantodate', objWorkOrder.custrecord_scv_cmms_wo_plantodate);
                //recWorkOrder.setText('custrecord_scv_cmms_wo_plantotime', objWorkOrder.custrecord_scv_cmms_wo_plantotime);
                recWorkOrder.setValue('custrecord_scv_cmms_wo_status', libCmms.CmmsScbdStatus.HOAN_THANH);
                recWorkOrder.setValue('custrecord_scv_cmms_wo_repairnote', objWorkOrder.custrecord_scv_cmms_wo_repairnote);
                recWorkOrder.setValue('custrecord_scv_cmms_wo_actual_repair', objWorkOrder.custrecord_scv_cmms_wo_actual_repair);
                
                let workOrderId = recWorkOrder.save({ignoreMandatoryFields: true});
                
                record.submitFields({type: libCmms.CmmsRecordType.KE_HOACH_BAO_DUONG_LINE, id: objWorkOrder.customrecord_scv_cmms_maintenanceplan_l_id,
                    values: {custrecord_scv_cmms_mp_workorder_l: workOrderId},
                    options: {ignoreMandatoryFields: true}
                });
                log.error('workOrderId', workOrderId);
            } catch (e) {
                log.error('exception when create Work Order', e);
            }
        }

        /**
         * Defines the function that is executed when the reduce entry point is triggered. This entry point is triggered
         * automatically when the associated map stage is complete. This function is applied to each group in the provided context.
         * @param {Object} reduceContext - Data collection containing the groups to process in the reduce stage. This parameter is
         *     provided automatically based on the results of the map stage.
         * @param {Iterator} reduceContext.errors - Serialized errors that were thrown during previous attempts to execute the
         *     reduce function on the current group
         * @param {number} reduceContext.executionNo - Number of times the reduce function has been executed on the current group
         * @param {boolean} reduceContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {string} reduceContext.key - Key to be processed during the reduce stage
         * @param {List<String>} reduceContext.values - All values associated with a unique key that was passed to the reduce stage
         *     for processing
         * @since 2015.2
         */
        const reduce = (reduceContext) => {

        }


        /**
         * Defines the function that is executed when the summarize entry point is triggered. This entry point is triggered
         * automatically when the associated reduce stage is complete. This function is applied to the entire result set.
         * @param {Object} summaryContext - Statistics about the execution of a map/reduce script
         * @param {number} summaryContext.concurrency - Maximum concurrency number when executing parallel tasks for the map/reduce
         *     script
         * @param {Date} summaryContext.dateCreated - The date and time when the map/reduce script began running
         * @param {boolean} summaryContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {Iterator} summaryContext.output - Serialized keys and values that were saved as output during the reduce stage
         * @param {number} summaryContext.seconds - Total seconds elapsed when running the map/reduce script
         * @param {number} summaryContext.usage - Total number of governance usage units consumed when running the map/reduce
         *     script
         * @param {number} summaryContext.yields - Total number of yields when running the map/reduce script
         * @param {Object} summaryContext.inputSummary - Statistics about the input stage
         * @param {Object} summaryContext.mapSummary - Statistics about the map stage
         * @param {Object} summaryContext.reduceSummary - Statistics about the reduce stage
         * @since 2015.2
         */
        const summarize = (summaryContext) => {

        }

        return {getInputData, map, reduce, summarize}

    });
