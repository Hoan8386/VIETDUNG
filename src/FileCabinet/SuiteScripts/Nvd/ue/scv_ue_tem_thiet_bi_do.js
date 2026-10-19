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
                let newRecord = scriptContext.newRecord;
                let recid = newRecord.id;
                let rectype = newRecord.type;

                let urlSlPrintPnk = url.resolveScript({
                        scriptId: 'customscript_scv_sl_tem_tbd',
                        deploymentId: 'customdeploy_scv_sl_tem_tbd',
                        returnExternalUrl: false,
                        params: {
                            recid: recid,
                            rectype: rectype,
                            templateid: 'CUSTTMPL_SCV_TEM_TBD'
                        }
                    }
                )
                let form = scriptContext.form;
                form.addButton({
                    id: 'custpage_scv_btn_tem_tbd_pdf',
                    label: 'In tem',
                    functionName: "window.open('" + urlSlPrintPnk + "');"
                });
                // comUI.addIconToButton(scriptContext.form);
            }
        }

        return {beforeLoad}

    });
