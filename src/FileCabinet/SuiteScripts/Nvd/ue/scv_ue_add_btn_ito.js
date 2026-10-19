/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record','N/url','../common/scv_common_ui'],
    
    (record, url, comUI) => {
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
            let newRec = scriptContext.newRecord;

            if(scriptContext.type === scriptContext.UserEventType.VIEW) {
                let orderType = newRec.getValue('custbody_scv_order_type');
                let isCto = newRec.getValue('icto');

                if (orderType === '53' && isCto === 'T') {
                    let form = scriptContext.form;
                    let urlLxh = getUrlLxh(newRec);
                    form.addButton({
                        id: 'custpage_scv_btn_ito_print_lenh_xuat_hang_pdf',
                        label: 'LXH',
                        functionName: `window.open('${urlLxh}','_blank')`
                    });
                    // comUI.addIconToButton(form);
                }
            }
        }

        const getUrlLxh = (newRec) => {
            return url.resolveScript({
                scriptId: 'customscript_scv_sl_lenhxuathang_print',
                deploymentId: 'customdeploy_scv_sl_lenhxuathang_print',
                returnExternalUrl: false,
                params: {
                    recid: newRec.id,
                    rectype: newRec.type
                }
            });
        }

        return {beforeLoad}

    });
