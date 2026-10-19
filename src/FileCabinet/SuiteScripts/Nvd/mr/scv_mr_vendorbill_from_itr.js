/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/runtime',
        '../lib/scv_lib_report.js', '../common/scv_common_vendorbill.js', '../olib/alasql/alasql.min@1.7.3.js'],
    
    (runtime, libRep, comVdb, alasql) => {
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
            let currScript = runtime.getCurrentScript();
            let arrData = JSON.parse(currScript.getParameter({name: 'custscript_scv_mr_bill_from_itr_value'}));
            if (arrData && arrData.length > 0) {
                if (arrData[0].type === comVdb.Type.NHIEU_PHIEU_NHAP) {
                    let {type, options, listDataCheck, listEntityPo} = arrData[0];
                    let dataTemp = comVdb.buildDataVendorBillFromItemReceipt(alasql, libRep, listDataCheck, listEntityPo);
                    dataTemp.options = options;
                    let dataTempId = comVdb.createDataTemp(JSON.stringify(dataTemp));
                    arrData = listEntityPo.map(o => {
                        o.type = type;
                        o.dataTempId = dataTempId;
                        return o;
                    });
                }
            }
            return arrData;
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
            log.error('mapContext.value', mapContext.value);
            let objData = JSON.parse(mapContext.value);
            try {
                if (objData.type === comVdb.Type.HANG_LOAT) {
                    comVdb.doCreateVendorBill(objData);
                } else if (objData.type === comVdb.Type.NHIEU_PHIEU_NHAP) {
                    let lkDataTemp = comVdb.lookupDataTemp(objData.dataTempId);
                    let {
                        listEntityItrIds,
                        listItemsInventoryDetail,
                        listPoItems,
                        options
                    } = JSON.parse(lkDataTemp.custrecord_scv_data_temp_content);
                    comVdb.doCreateVendorBillMultiItemReceipt(alasql, objData, listEntityItrIds.filter(o => o.entity === objData.entity), listItemsInventoryDetail, listPoItems, options);
                }
            } catch (e) {
                log.error('exception', e);
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
