/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/file', 'N/record'],

    (file, record) => {
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
            let curRec = scriptContext.newRecord;
            let recId = curRec.id;
            let salesContractId = curRec.getValue('custbody_scv_sales_contract');

            if (salesContractId) {
                let recSalesContract = record.load({
                    type: 'customrecord_scv_sales_contract',
                    id: salesContractId,
                });

                let customFormId = recSalesContract.getValue('customform');

                if (!form.getField('custpage_scv_inlinehtml_export_word')) {
                    let exportToWordFile = file.load({id: '../html/scv_html_salesorder_print.html'})
                    form.addField({
                        id: 'custpage_scv_inlinehtml_export_word',
                        label: 'inlinehtml',
                        type: 'inlinehtml',
                    }).defaultValue = exportToWordFile.getContents();
                }

                if (customFormId === '542') {
                    form.addButton({
                        id: 'custpage_scv_xuat_file_word',
                        label: 'HDMB',
                        functionName: `xuatHopDongMuaBan(${JSON.stringify({
                            recId: recId,
                            exportType: 'word',
                            isBltt: 'F'
                        })})`,
                    });
                }

                if (customFormId === '133') {
                    form.addButton({
                        id: 'custpage_scv_xuat_file_word',
                        label: 'HDMB (BLTT)',
                        functionName: `xuatHopDongMuaBan(${JSON.stringify({
                            recId: recId,
                            exportType: 'word',
                            isBltt: 'T'
                        })})`,
                    });
                }

                const scType = recSalesContract.getValue('custrecord_scv_sc_type');
                if (scType === '4') {
                    form.addButton({
                        id: 'custpage_scv_hdmb_da_word',
                        label: 'HĐMB-DA',
                        functionName: `exportHdmbDaWord(${JSON.stringify({
                            recId: recId,
                            exportType: 'word',
                        })})`,
                    });
                }
            }
        }

        // /**
        //  * Defines the function definition that is executed before record is submitted.
        //  * @param {Object} scriptContext
        //  * @param {Record} scriptContext.newRecord - New record
        //  * @param {Record} scriptContext.oldRecord - Old record
        //  * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
        //  * @since 2015.2
        //  */
        // const beforeSubmit = (scriptContext) => {
        //
        // }
        //
        // /**
        //  * Defines the function definition that is executed after record is submitted.
        //  * @param {Object} scriptContext
        //  * @param {Record} scriptContext.newRecord - New record
        //  * @param {Record} scriptContext.oldRecord - Old record
        //  * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
        //  * @since 2015.2
        //  */
        // const afterSubmit = (scriptContext) => {
        //
        // }

        return {beforeLoad}//, beforeSubmit, afterSubmit}

    });
