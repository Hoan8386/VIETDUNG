/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/search', 'N/record', 'N/runtime', '../lib/scv_lib_function.js', 'N/format', 'N/cache'],
    
    (search, record, runtime, lfunc, format, cache) => {
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

        const ACTION_TYPE = {
            EMPTY: { ID: "", NAME: "" },
            UNCHANGED: { ID: 1, NAME: "Unchanged" },
            EDIT: { ID: 2, NAME: "Edit" },
            ADD: { ID: 3, NAME: "Add" },
        };

        const SCRIPT_ID = {
            PROD_LABOR_STATISTIC: "customscript_scv_sl_prod_labor_statistic",
            LABOR_STAT_BY_SHIFT: "customscript_scv_sl_labor_stat_by_shift"
        };

        const getInputData = (inputContext) => {
            let currentScript = runtime.getCurrentScript();
            let list_value = currentScript.getParameter({
                    name: 'custscript_scv_production_labor'
            });
            list_value = JSON.parse(list_value);
            return list_value;
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
            let objData = mapContext.value;
            objData = JSON.parse(objData);

            if(objData.script_id == SCRIPT_ID.PROD_LABOR_STATISTIC) {
                processProdLaborStatistic(objData);
            } else if(objData.script_id == SCRIPT_ID.LABOR_STAT_BY_SHIFT) {
                processLaborStatByShift(objData);
            }
        }

        const processLaborStatByShift = (objData) => {
            formatDateTimeProdLabor(objData);

            if(objData.action_id == ACTION_TYPE.ADD.ID) {
                createLaborStatisticByShift(objData);
            } else if(objData.action_id == ACTION_TYPE.EDIT.ID) {
                updateLaborStatisticByShift(objData);
            }
        }

        const createLaborStatisticByShift = (objData) => {
            try {
                let prodLaborRec = record.create({ type: "customrecord_scv_prd_labor" });
                lfunc.setValueData(prodLaborRec, [
                    "custrecord_scv_prd_labor_sub", "custrecord_scv_prd_labor_wo", "custrecord_scv_prd_labor_assy_item", "custrecord_scv_prd_op_sequences",
                    "custrecord_scv_prd_labor_wo_center", "custrecord_scv_prod_labor_start_d_time", "custrecord_scv_prd_labor_e_time", "custrecord_scv_prd_labor_minutes",
                    "custrecord_scv_prd_labor_qty_complete", "custrecord_scv_prd_labor_shift", "custrecord_scv_prd_labor_location", "custrecord_scv_prd_labor_emp",
                    "custrecord_scv_prd_labor_date", "custrecord_scv_prd_labor_lot_no", "custrecord_scv_prd_labor_serial", "custrecord_scv_prd_labor_title",
                    "custrecord_scv_prd_labor_note", "custrecord_scv_prd_labor_emp_1", "custrecord_scv_prd_labor_emp_2", "custrecord_scv_prd_labor_emp_3", "custrecord_scv_prd_labor_emp_4"
                ], [
                    objData.prd_labor_sub, objData.work_order_id, objData.item_id, objData.prd_op_sequences, 
                    objData.prd_labor_wo_center, objData.prod_labor_start_d_time, objData.prd_labor_e_time, objData.prd_labor_minutes, 
                    objData.qty_completed, objData.prd_labor_shift, objData.prd_labor_location, objData.prd_labor_emp.split(","),
                    objData.prd_labor_date, objData.lot_number, objData.qc_serial, objData.prd_labor_title, objData.memo,
                    objData.prd_labor_emp1, objData.prd_labor_emp2, objData.prd_labor_emp3, objData.prd_labor_emp4
                ]);

                let prodLaborId = prodLaborRec.save();

                updatedWoCompletion(objData);
            } catch (err) {
                log.error("CREATE ERROR!", err);
            }
        }

        const updateLaborStatisticByShift = (objData) => {
            try {
                if(objData.prod_labor_id) {
                    let prodLaborRec = record.load({ type: "customrecord_scv_prd_labor", id: objData.prod_labor_id });

                    lfunc.setValueData(prodLaborRec, [
                        "custrecord_scv_prd_labor_wo", "custrecord_scv_prd_labor_assy_item", "custrecord_scv_prd_op_sequences",
                        "custrecord_scv_prd_labor_wo_center", "custrecord_scv_prod_labor_start_d_time", "custrecord_scv_prd_labor_e_time", "custrecord_scv_prd_labor_minutes",
                        "custrecord_scv_prd_labor_qty_complete", "custrecord_scv_prd_labor_shift", "custrecord_scv_prd_labor_emp",
                        "custrecord_scv_prd_labor_date", "custrecord_scv_prd_labor_lot_no", "custrecord_scv_prd_labor_serial", "custrecord_scv_prd_labor_title",
                        "custrecord_scv_prd_labor_note", "custrecord_scv_prd_labor_emp_1", "custrecord_scv_prd_labor_emp_2", 
                        "custrecord_scv_prd_labor_emp_3", "custrecord_scv_prd_labor_emp_4"
                    ], [
                        objData.work_order_id, objData.item_id, objData.prd_op_sequences, 
                        objData.prd_labor_wo_center, objData.prod_labor_start_d_time, objData.prd_labor_e_time, objData.prd_labor_minutes, 
                        objData.qty_completed, objData.prd_labor_shift, objData.prd_labor_emp.split(","),
                        objData.prd_labor_date, objData.lot_number, objData.qc_serial, objData.prd_labor_title, objData.memo,
                        objData.prd_labor_emp1, objData.prd_labor_emp2, objData.prd_labor_emp3, objData.prd_labor_emp4
                    ]);

                    let prodLaborId = prodLaborRec.save();
                    updatedWoCompletion(objData);
                } else {
                    createLaborStatisticByShift(objData);
                }
            } catch (err) {
                log.error("UPDATE ERROR!", err);
            }
        }

        const processProdLaborStatistic = (objData) => {
            formatDateTimeProdLabor(objData);
            if(objData.action_id == ACTION_TYPE.ADD.ID) {
                createProductionLabor(objData);
            } else if(objData.action_id == ACTION_TYPE.EDIT.ID) {
                updateProductionLabor(objData);
            }
        }

        const formatDateTimeProdLabor = (objData) => {
            if(!!objData.prod_labor_start_d_time) {
                objData.prod_labor_start_d_time = format.parse({value: objData.prod_labor_start_d_time, type: "timeofday"});
            }
            if(!!objData.prd_labor_e_time) {
                objData.prd_labor_e_time = format.parse({value: objData.prd_labor_e_time, type: "timeofday"});
            }
            if(!!objData.prd_labor_date) {
                objData.prd_labor_date = format.parse({value: objData.prd_labor_date, type: "date"});
            }
            if(!!objData.wo_date) {
                objData.wo_date = format.parse({value: objData.wo_date, type: "date"});
            }
        }

        const updatedWoCompletion = (objData) => {
            if(objData.chk_wo_completion === true) {
                record.submitFields({
                    type: 'workorder',
                    id: objData.work_order_id, 
                    values: {
                        custbody_scv_wo_completion: true
                    },
                    options: {
                        enableSourcing: false, ignoreMandatoryFields : true
                    }
                });
            }
        }

        const updateProductionLabor = (objData) => {
            try {
                let prodLaborRec = record.load({ type: "customrecord_scv_prd_labor", id: objData.internalid });
                let objProdLabor = getDataRecordProdLabor(prodLaborRec);

                let isUpdateRec = isChangedFieldProdLabor(objData, objProdLabor);
                if(!!isUpdateRec) {
                    lfunc.setValueData(prodLaborRec, [
                        "custrecord_scv_prd_op_sequences", "custrecord_scv_prd_op_name", "custrecord_scv_prod_labor_start_d_time", "custrecord_scv_prd_labor_e_time", 
                        "custrecord_scv_prd_labor_minutes", "custrecord_scv_prd_labor_shift", "custrecord_scv_prd_labor_emp", "custrecord_scv_prd_labor_date",
                        "custrecord_scv_prd_labor_title",
                    ], [
                        objData.prd_op_sequences, objData.prd_op_name, 
                        objData.prod_labor_start_d_time, objData.prd_labor_e_time, objData.prd_labor_minutes, objData.prd_labor_shift,
                        objData.prd_labor_emp.split(","), objData.prd_labor_date, objData.prd_labor_title
                    ]);
                    let prodLaborId = prodLaborRec.save();
                }
            } catch (err) {
                log.error("UPDATE ERROR!", err);
            }
        }

        const isChangedFieldProdLabor = (objData, objProdLabor) => {
            if(
                objData.prd_labor_date?.getTime() == objProdLabor.prd_labor_date?.getTime() &&
                objData.prod_labor_start_d_time?.getTime() == objProdLabor.prod_labor_start_d_time?.getTime() &&
                objData.prd_labor_e_time?.getTime() == objProdLabor.prd_labor_e_time?.getTime() &&
                objData.prd_labor_emp == objProdLabor.prd_labor_emp &&
                objData.prd_labor_minutes == objProdLabor.prd_labor_minutes &&
                objData.prd_labor_title == objProdLabor.prd_labor_title &&
                objData.prd_labor_shift == objProdLabor.prd_labor_shift &&
                objData.prd_labor_wo_center == objProdLabor.prd_labor_wo_center &&
                objData.prd_op_sequences == objProdLabor.prd_op_sequences &&
                objData.prd_op_name == objProdLabor.prd_op_name
            ) {
                return false;
            }

            return true;
        }

        const getDataRecordProdLabor = (prodLaborRec) => {
            return {                
                prd_labor_date: prodLaborRec.getValue("custrecord_scv_prd_labor_date"),
                prd_labor_emp: prodLaborRec.getValue("custrecord_scv_prd_labor_emp"),
                prd_labor_minutes: prodLaborRec.getValue("custrecord_scv_prd_labor_minutes"),
                prd_labor_title: prodLaborRec.getValue("custrecord_scv_prd_labor_title"),
                prd_labor_shift: prodLaborRec.getValue("custrecord_scv_prd_labor_shift"),
                prd_labor_wo_center: prodLaborRec.getValue("custrecord_scv_prd_labor_wo_center"),
                prd_op_sequences: prodLaborRec.getValue("custrecord_scv_prd_op_sequences"),
                prd_op_name: prodLaborRec.getValue("custrecord_scv_prd_op_name"),
                prod_labor_start_d_time: prodLaborRec.getValue("custrecord_scv_prod_labor_start_d_time"),
                prd_labor_e_time: prodLaborRec.getValue("custrecord_scv_prd_labor_e_time")
            };
        }

        const createProductionLabor = (objData) => {
            try {
                let prodLaborRec = record.create({ type: "customrecord_scv_prd_labor" });
                lfunc.setValueData(prodLaborRec, [
                    "custrecord_scv_prd_labor_sub", "custrecord_scv_prd_labor_wo", "custrecord_scv_prd_op_sequences", "custrecord_scv_prd_op_name",
                    "custrecord_scv_prd_labor_wo_center", "custrecord_scv_prod_labor_start_d_time", "custrecord_scv_prd_labor_e_time", "custrecord_scv_prd_labor_minutes",
                    "custrecord_scv_prd_labor_shift", "custrecord_scv_prd_labor_location", "custrecord_scv_prd_labor_emp", "custrecord_scv_prd_labor_date",
                    "custrecord_scv_prd_labor_wo_completion", "custrecord_scv_prd_labor_title",
                ], [
                    objData.prd_labor_sub, objData.prd_labor_wo, objData.prd_op_sequences, objData.prd_op_name, objData.prd_labor_wo_center, 
                    objData.prod_labor_start_d_time, objData.prd_labor_e_time, objData.prd_labor_minutes, objData.prd_labor_shift,
                    objData.prd_labor_location, objData.prd_labor_emp.split(","), objData.prd_labor_date, objData.prd_labor_wo_completion,
                    objData.prd_labor_title
                ]);

                let prodLaborId = prodLaborRec.save();
            } catch (err) {
                log.error("CREATE ERROR!", err);
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

        return {getInputData, map}

    });
