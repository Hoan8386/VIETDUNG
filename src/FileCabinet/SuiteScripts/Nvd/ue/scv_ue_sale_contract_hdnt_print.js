/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(["N/record","N/search", "N/url", '../common/scv_common_ui'],

    (record,search, url, comUI) => {
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
            if (scriptContext.type === scriptContext.UserEventType.VIEW) {
                let form = scriptContext.form;
                form.clientScriptModulePath = '../cs/scv_cs_salescontract_print.js';

                let newRecord = scriptContext.newRecord;
                let recid = newRecord.id;
                let rectype = newRecord.type;
                const type = newRecord.getValue('custrecord_scv_sc_type');
                
                if (type === '3') {
                    form.addButton({
                        id: 'custpage_scv_xuat_file_word',
                        label: 'HĐNT',
                        functionName: `exportHdntWord(${JSON.stringify({
                            recId: recid,
                            exportType: 'word',
                        })})`,
                    });

                    form.addButton({
                        id: 'custpage_scv_btn_hdnt_print_pdf',
                        label: 'HĐNT',
                        functionName: `exportHdntPdf(${JSON.stringify({
                            recId: recid,
                            recType: rectype,
                            exportType: 'pdf',
                        })})`,
                    });

                    comUI.addIconToButton(scriptContext.form);
                }
            }
        }

        return {beforeLoad}

    });
