/**
 * =======================================================================================
 *  Date                Author                  Description
 *  03 Apr 2025		    Khanh Tran			    Init, create file. Tạo hàng loạt các lệnh chuyển kho Transfer Order nhóm theo từng kho mr.Huy(https://app.clickup.com/t/86cydnndh)
 */
/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/record', 'N/runtime', 'N/format',
    '../lib/scv_lib_function.js',
    '../cons/scv_cons_ordertype.js',
],
    (record, runtime, format,
        lbf,
        constOrderType
    ) => {
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
            let valueS = JSON.parse(currScript.getParameter({name: 'custscript_scv_mr_crt_to_from_isc'}));
            return valueS
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
                let objData = JSON.parse(mapContext.value);log.error('objData', objData);
                createTO(objData);
            } catch (error) {
                log.error('map', error)
            }
        }

        const createTO = (objData) => {
            let curRec = record.create({type: 'transferorder', isDynamic: true});
            let objItem = objData.arrItem[0];
            curRec.setValue('subsidiary', objItem.subsidiary);
            curRec.setValue('trandate', format.parse({value: objData.date, type: 'date'}));
            curRec.setValue('location', objData.kho_xuat);
            curRec.setValue('transferlocation', objData.kho_nhap);
            curRec.setValue('custbody_scv_order_type', constOrderType.RECORDS.CHUYEN_KHO_THANH_PHAM.ID);
            curRec.setValue('memo', objData.slParams.custpage_ghi_chu);
            let sl = 'item';
            let slInvDetail = 'inventoryassignment';
            let internalid = '';
            let iscIds = [];
            objData.arrItem.forEach((obj, i) => {
                internalid = obj.internalid;
                if(obj.internalid && iscIds.indexOf(obj.internalid) == -1) iscIds.push(obj.internalid);
                curRec.selectNewLine({sublistId: sl});
                lbf.setCurrentSublistValueData(curRec, sl, [
                    'item', 'units', 'quantity', 
                    'custcol_scv_created_from', 'custcol_scv_related_trans',
                ], [
                    obj.item, obj.unit, obj.quantity,
                    obj.crt_from, obj.rlt_tran,

                ]);

                let invDetAvailable = curRec.getCurrentSublistValue({ sublistId: sl, fieldId: 'inventorydetailavail'});
                if(invDetAvailable != 'F'){
                    let newInvDetail = curRec.getCurrentSublistSubrecord({ sublistId: sl, fieldId: 'inventorydetail'});
                    newInvDetail.selectNewLine({sublistId: slInvDetail});
                    newInvDetail.setCurrentSublistValue({sublistId: slInvDetail, fieldId: 'issueinventorynumber', value: obj.inventory_number});
                    newInvDetail.setCurrentSublistValue({sublistId: slInvDetail, fieldId: 'quantity', value: obj.quantity});
                    newInvDetail.commitLine({sublistId: slInvDetail});
                }

                curRec.commitLine({sublistId: sl});
            })

            let recId = curRec.save({enableSourcing: false, ignoreMandatoryFields: false}); 
            log.error('recId', recId)
            log.error('iscIds', iscIds)
            if(iscIds.length){
                iscIds.forEach((iscId, i) => {
                    // record.submitFields({
                    //     type: record.Type.INVENTORY_STATUS_CHANGE,
                    //     id: iscId,
                    //     values: {
                    //         custbody_scv_check_transaction: recId
                    //     },
                    //     options: {
                    //         enableSourcing: false, ignoreMandatoryFields : true
                    //     }
                    // });
                    //không hỗ trợ INVENTORY_STATUS_CHANGE
                    let iscRec = record.load({type: record.Type.INVENTORY_STATUS_CHANGE, id: iscId});
                    iscRec.setValue('custbody_scv_check_transaction', recId);
                    iscRec.save({enableSourcing: false, ignoreMandatoryFields: true});
                })
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

        return {
            getInputData, 
            map, 
            // reduce, 
            // summarize
        }

    });
