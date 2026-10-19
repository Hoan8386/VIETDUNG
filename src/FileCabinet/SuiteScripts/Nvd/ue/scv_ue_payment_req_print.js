/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/url', 'N/runtime', 'N/file','../common/scv_common_ui'],

    (url, runtime, file, comUI) => {
        const DNTT = ['1', '2', '3', '10', '12'];
        const DNTƯ = ['7', '8'];
        const DNQT = ['9', '11']

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
                let rec = scriptContext.newRecord;
                let paymentType = rec.getValue('custrecord_scv_payment_type');
                let custrecord_scv_payment_payment_code = rec.getValue('custrecord_scv_payment_payment_code');
                let templateType ;

                if (DNTT.some(item => paymentType === item)) {
                    templateType = 'DNTT';
                } else if (DNTƯ.some(item => paymentType === item)) {
                    templateType = 'DNTƯ';
                } else if (DNQT.some(item => paymentType === item)) {
                    templateType = 'DNQT';
                }

                if(rec.type === 'custompurchase_scv_purchase_request'){
                    const defaultUrl = url.resolveScript({
                        scriptId: 'customscript_scv_sl_payment_req_print',
                        deploymentId: 'customdeploy_scv_sl_payment_req_print',
                        params: {
                            recId: rec.id,
                            rectype: rec.type,
                            templateType: 'DEFAULT',
                        },
                        returnExternalUrl: false
                    });

                    form.addButton({
                        id: "custpage_scv_btn_payment_request_print_pdf_ycmh",
                        label: "Yêu Cầu Mua Hàng",
                        functionName: `window.open('${defaultUrl}')`
                    });

                    let user = runtime.getCurrentUser();
                    let userRole = user.role ;
                    if(userRole === 3 || userRole === 1624 || userRole === 1625 ) {
                        // if(checkQuantityLine(rec)) {
                            addBtnCloseLine(form, rec);
                            addBtnOpenLine(form, rec);
                        // }
                    }
                }

                if(templateType && !custrecord_scv_payment_payment_code) {
                    let slUrl = url.resolveScript({
                        scriptId: 'customscript_scv_sl_payment_req_print',
                        deploymentId: 'customdeploy_scv_sl_payment_req_print',
                        params: {
                            recId: rec.id,
                            templateType: templateType,
                        },
                        returnExternalUrl: false
                    });

                    form.addButton({
                        id: "custpage_scv_btn_payment_request_print_pdf",
                        label: templateType,
                        functionName: `window.open('${slUrl}')`,
                    });

                    comUI.addIconToButton(form);
                }


                if(custrecord_scv_payment_payment_code) {
                    let slUrl = url.resolveScript({
                        scriptId: 'customscript_scv_sl_payment_req_print',
                        deploymentId: 'customdeploy_scv_sl_payment_req_print',
                        params: {
                            recId: rec.id,
                            templateType: templateType,
                            templateId: 'CUSTTMPL_SCV_PAY_REQ_DNTT_DV_2'
                        },
                        returnExternalUrl: false
                    });

                    form.addButton({
                        id: "custpage_scv_btn_payment_request_print_pdf",
                        label: templateType,
                        functionName: `window.open('${slUrl}')`,
                    });
                    comUI.addIconToButton(form);
                }


            }
        }

        const addBtnCloseLine = (form, rec) => {
            let suiteletUrl = url.resolveScript({
                scriptId: 'customscriptsl_close_line_transaction',
                deploymentId: 'customdeploysl_close_line_ts',
                params: {
                    'recordId': rec.id,
                    'rectype': rec.type,
                }
            });

            form.addButton({
                id: 'custpage_scv_closed_line_transaction',
                label: 'Close Line',
                functionName: `window.open(
                '${suiteletUrl}',
                'popupWindow',
                'width=600,height=400,toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes'
            );`
            });
        }

        const addBtnOpenLine = (form, rec) => {
            let suiteletUrl = url.resolveScript({
                scriptId: 'customscript_sl_open_line_transaction',
                deploymentId: 'customdeploy_sl_open_line_ts',
                params: {
                    'recordId': rec.id,
                    'rectype': rec.type,
                }
            });
            form.addButton({
                id: 'custpage_scv_open_line_transaction',
                label: 'Open Line',
                functionName: `window.open(
                '${suiteletUrl}',
                'popupWindow',
                'width=600,height=400,toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes'
            );`
            });
        }

        const checkQuantityLine = (rec) => {
            let lcount = rec.getLineCount({sublistId: 'item'});
            log.error('lcount', lcount);
            for (let i = 0; i < lcount; i++) {
                let itemType = rec.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'itemtype',
                    line: i
                })
                log.error('itemType', itemType);
                let quantityBilled = rec.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'quantitybilled',
                    line: i
                });
                log.error('quantityBilled', quantityBilled);

                if( itemType === 'Service') {
                    if (!quantityBilled) {
                        return false;
                    }
                }else {
                    let quantityReceived = rec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantityreceived',
                        line: i
                    })
                    if (quantityBilled !== quantityReceived) {
                        return false;
                    }

                }
            }
            return true;
        }

        return {beforeLoad}
    });
