/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/url','../common/scv_common_ui'],

    (url, comUI) => {
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
                let status = newRecord.getValue({
                    fieldId: 'custrecord_scv_asset_transfer_status'
                });

              if (parseInt(status) === 19) {
                let urlSlPrintPnk = url.resolveScript({
                        scriptId: 'customscript_scv_sl_dcts_print',
                        deploymentId: 'customdeploy_scv_sl_dcts_print',
                        returnExternalUrl: false,
                        params: {
                            recid: recid,
                            rectype: rectype,
                            templateid: 'CUSTTMPL_PHIEU_DIEU_CHUYEN_TAI_SAN'
                        }
                    }
                )
                let form = scriptContext.form;
                form.addButton({
                    id: 'custpage_scv_btn_transfer_print_pdf',
                    label: 'Phiếu điều chuyển tài sản',
                    functionName: "window.open('" + urlSlPrintPnk + "');"
                });
                const idIconBtn = 'custpage_scv_field_add_icons_to_buttons_2'
                comUI.addIconToButton(form, idIconBtn);
              }
            }
        }


        return {beforeLoad}

    });
