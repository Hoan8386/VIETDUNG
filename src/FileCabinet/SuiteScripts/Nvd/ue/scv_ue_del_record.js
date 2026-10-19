/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/search', 'N/url'],

    (search, url) => {

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
            let triggerType = scriptContext.type;
            const newRec = scriptContext.newRecord;
            if (triggerType === 'view' && isDeleteAllRelatedRecord(newRec.type)) {
                addBtnDeleteAllRelatedWithRecord(scriptContext.form, newRec);
            }
        }

        const addBtnDeleteAllRelatedWithRecord = (form, newRec) => {
            let urlDelSL = url.resolveScript({
                scriptId : 'customscript_scv_sl_del_record',
                deploymentId :'customdeploy_scv_sl_del_record',
                params : {
                    recid : newRec.id,
                    rectype : newRec.type
                }
            });
            form.addButton({
                id : 'custpage_btn_del_rec',
                label: 'Delete record',
                functionName : `window.location.replace('${urlDelSL}')`
            })
        };

        const isDeleteAllRelatedRecord = (rectype) => {
            let searchObj = search.create({
                type: 'customrecord_scv_data_cf_rec_del',
                filters: [['custrecord_scv_data_cf_rec_del_rectype', 'is', rectype]],
                columns: ['internalid']
            });
            let count = searchObj.run().getRange(0, 1).length;
            return count > 0;
        };

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

        return {
            beforeLoad,
            // beforeSubmit, afterSubmit
        }

    });
