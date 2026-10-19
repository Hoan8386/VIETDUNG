/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/url', 'N/search', '../lib/scv_lib_function'],

    (url, search, libFn) => {
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
            if (scriptContext.type === 'view') {
                addBtnCreateInventoryStatusChange(scriptContext.form, scriptContext.newRecord);
            }
        }

        const addBtnCreateInventoryStatusChange = (form, curRec) => {
            if (!isShowBtnCreateInvStatusChange(curRec)) return;
            let urlPopup = url.resolveScript({scriptId: "customscript_scv_sl_inv_sc_from_inb_ins", deploymentId: "customdeploy_scv_sl_inv_sc_from_inb_ins", params: {inspectionId : curRec.id}});
            form.addButton({
                id : 'custpage_btn_inv_status_change',
                label : 'Chuyển trạng thái',
                functionName: `nlExtOpenWindow('${urlPopup}', 'childdrecord', window.innerWidth - 200, window.innerHeight - 200, this, true,'')`,
            })
        }

        const isShowBtnCreateInvStatusChange = (curRec) => {
            const STATUS_CHECK = '4';
            const statusId = curRec.getValue('custrecord_scv_irt_status_inspect_total');
            if (statusId !== STATUS_CHECK) return false;
            const createdFromId = curRec.getValue('custrecord_scv_irt_receipt_no');
            if (!createdFromId || libFn.getTranRecordType(createdFromId) !== 'itemreceipt') return false;
            let searchObj = search.create({type : 'customrecord_scv_inbound_inspection_qty'});
            searchObj.filters = [
                search.createFilter({
                    name : 'custrecord_scv_inbound_qty_doc_no',
                    operator : 'anyof',
                    values : curRec.id.toString()
                }),
                search.createFilter({
                    name : 'isinactive',
                    operator : 'anyof',
                    values : false
                }),
                search.createFilter({
                    name : 'custrecord_scv_inbound_qty_stachno',
                    operator : 'isempty',
                    values : ''
                })
            ];
            searchObj.columns = ['internalid'];
            let searchData = searchObj.run().getRange(0, 1);
            return searchData.length > 0;
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

        return {beforeLoad, beforeSubmit, afterSubmit}

    });
