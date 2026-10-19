/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/file', 'N/record','N/search', '../common/scv_common_ui'],

    (file, record,search, comUI) => {
        /**
         * Defines the function definition that is executed before record is loaded.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @param {Form} scriptContext.form - Current form
         * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
         * @since 2015.2
         */
        const HOPDONGMUABAN = '542';
        const HOPDONGMUABAN_BL = '133';
        const HOPDONGMUABAN_DA = '587';
        const HOPDONGNGUYENTAC = '586';

        const beforeLoad = (scriptContext) => {
            if (scriptContext.type === scriptContext.UserEventType.VIEW) {
                let form = scriptContext.form;

                form.clientScriptModulePath = '../cs/scv_cs_salescontract_print.js';

                let curRec = //scriptContext.newRecord;
                    record.load({
                        type: 'customrecord_scv_sales_contract',
                        id: scriptContext.newRecord.id
                    });
                let recId = curRec.id;
                let recType = curRec.type;
                let customFormId = curRec.getValue('customform');

                if (!form.getField('custpage_scv_inlinehtml_export_word')) {
                    let exportToWordFile = file.load({id: '../html/scv_html_salescontract_print.html'})
                    form.addField({
                        id: 'custpage_scv_inlinehtml_export_word',
                        label: 'inlinehtml',
                        type: 'inlinehtml',
                    }).defaultValue = exportToWordFile.getContents();
                }

                if(customFormId !== HOPDONGMUABAN_BL){
                    form.addButton({
                        id: 'custpage_scv_xuat_file_excel',
                        label: 'Phiếu kiểm tra TTHĐ',
                        functionName: `xuatPhieuKiemTra('F')`,
                    });
                }

                if (customFormId === HOPDONGMUABAN) {
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

                if (customFormId === HOPDONGMUABAN_BL) {
                    form.addButton({
                        id: 'custpage_scv_xuat_file_word',
                        label: 'HDMB (BLTT)',
                        functionName: `xuatHopDongMuaBan(${JSON.stringify({
                            recId: recId,
                            exportType: 'word',
                            isBltt: 'T'
                        })})`,
                    });

                    form.addButton({
                        id: 'custpage_scv_xuat_file_excel',
                        label: 'Phiếu kiểm tra TTHĐ BL',
                        functionName: `xuatPhieuKiemTra('T')`,
                    });
                }

                if (customFormId === HOPDONGMUABAN_DA) {
                    form.addButton({
                        id: 'custpage_scv_hdmb_da_word',
                        label: 'HDMB DA',
                        functionName: `exportHdntWord(${JSON.stringify({
                            recId: recId,
                            recType: recType,
                            exportType: 'word',
                            isDa: 'T'
                        })})`,
                    });
                    // form.addButton({
                    //     id: 'custpage_scv_btn_hdmb_da_print_pdf',
                    //     label: 'HDMB DA',
                    //     functionName: `exportPdf(${JSON.stringify({
                    //         recId: recId,
                    //         recType: recType,
                    //         btnType: 'HDMB_DA',
                    //         exportType: 'pdf',
                    //     })})`,
                    // });
                }

                if (customFormId === HOPDONGNGUYENTAC) {
                    form.addButton({
                        id: 'custpage_scv_xuat_file_word',
                        label: 'HĐNT',
                        functionName: `exportHdntWord(${JSON.stringify({
                            recId: recId,
                            recType: recType,
                            exportType: 'word',
                            isDa: 'F'
                        })})`,
                    });

                    // form.addButton({
                    //     id: 'custpage_scv_btn_hdnt_print_pdf',
                    //     label: 'HĐNT',
                    //     functionName: `exportPdf(${JSON.stringify({
                    //         recId: recId,
                    //         recType: recType,
                    //         btnType: 'HDNT',
                    //         exportType: 'pdf',
                    //     })})`,
                    // });

                    comUI.addIconToButton(scriptContext.form);
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
