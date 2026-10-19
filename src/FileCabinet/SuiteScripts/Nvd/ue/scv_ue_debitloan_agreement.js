/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/url'],

    (url) => {
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
            let form = scriptContext.form;
            let newRecord = scriptContext.newRecord;
            let payAmt = newRecord.getValue('custrecord_scv_loa_principal_amount');
            let paidAmt = newRecord.getValue('custrecord_scv_loa_interest_paid_amount');
            let lcTrans = newRecord.getValue('custrecord_scv_lc_po');
            let link = url.resolveScript({
                scriptId: 'customscript_scv_sl_debitloan_agreement',
                deploymentId: 'customdeploy_scv_sl_debitloan_agreement',
                params: {
                    recid: newRecord.id
                }
            });
            if (!lcTrans) {
                form.addButton({
                    id: 'custpage_deposit',
                    label: 'Deposit',
                    functionName: `window.open("${link}&buttontype=deposit")`
                });
            }
            if (payAmt - paidAmt > 0) {
                form.addButton({
                    id: 'custpage_payment',
                    label: 'Make Payment',
                    functionName: `window.open("${link}&buttontype=payment")`
                });
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

        }

        return {beforeLoad, beforeSubmit, afterSubmit}

    });
