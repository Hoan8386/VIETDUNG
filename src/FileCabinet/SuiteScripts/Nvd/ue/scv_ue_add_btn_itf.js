/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/url', 'N/search', '../common/scv_common_pdf', '../common/scv_common_ui'],

    (url, search, comPdf, comUI) => {

        const TtPheDuyet = {
            Approved: '22',
        }
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
            if(scriptContext.type === scriptContext.UserEventType.VIEW) {
                let form = scriptContext.form;
                let newRecord = scriptContext.newRecord;
                let id = newRecord.id;
                let type = newRecord.type;

                let isFromSo = false;
                let createdFrom = newRecord.getText('createdfrom');
                log.error('createdFrom', createdFrom);

                // if (id) {
                //     let lkFieldsItf = search.lookupFields({
                //         type: type,
                //         id: id,
                //         columns: ['createdfrom']
                //     });
                //     isFromSo = (lkFieldsItf.createdfrom[0]?.text.split('#')[0] === 'Fulfillment Request ');
                // }

                // if (isFulfillmentReq === true) {
                    let urlPrintPXB = url.resolveScript({
                        scriptId: 'customscript_scv_sl_itf_pxb_print',
                        deploymentId: 'customdeploy_scv_sl_itf_pxb_print',
                        params: {
                            recid: id,
                            rectype: type
                        }
                    })
                    form.addButton({
                        id: 'custpage_scv_btn_print_itf_pdf',
                        label: 'Phiếu xuất bán',
                        functionName: `window.open('${urlPrintPXB}')`
                    });
                // }
            }
        }

        return {beforeLoad}

    });
