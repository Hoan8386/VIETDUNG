/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record','../lib/scv_lib_amount_in_word.js' ],
    
    (record, libAmtInWord) => {
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
                if (scriptContext.type === scriptContext.UserEventType.DELETE) {
                        return; // Exit if the record is deleted
                }
                let newRecord = scriptContext.newRecord;
                let recSo = record.load({
                        type: newRecord.type,
                        id: newRecord.id,
                });
                let amount = recSo.getValue({fieldId : 'total', fireSlavingSync : true});
                let currency = recSo.getText('currency') || recSo.getValue('currencycode') || recSo.getValue('currencysymbol');
                recSo.setValue('custbody_scv_amount_in_word', libAmtInWord.DocTienBangChu(amount, currency));
                recSo.setValue('custbody_scv_amount_in_word_en', libAmtInWord.toAmountInWorld(amount, currency));
                recSo.save();
        }

        return {afterSubmit}

    });
