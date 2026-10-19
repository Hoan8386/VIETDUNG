/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/url', 'N/file', '../common/scv_common_ui'],

    (url, file, comUI) => {
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

            if (scriptContext.type === scriptContext.UserEventType.VIEW) {
                if (newRecord.type === 'itemfulfillment') {
                    let createdFrom = newRecord.getText('createdfrom');
                    if (createdFrom.includes('Sales Order')) {
                        let urlInPhieuXuatHang = url.resolveScript({
                            scriptId: 'customscript_scv_sl_lenhxuathang_print',
                            deploymentId: 'customdeploy_scv_sl_lenhxuathang_print',
                            returnExternalUrl: false
                        });

                        urlInPhieuXuatHang += `&recid=${newRecord.id}&rectype=${newRecord.type}`;

                        form.addButton({
                            id: 'custpage_scv_btn_in_phieu_xuat_hang_pdf',
                            label: 'In phiếu xuất hàng',
                            functionName: `window.open("${urlInPhieuXuatHang}", "_blank")`
                        });
                    }
                } else if (newRecord.type === 'fulfillmentrequest') {
                    let urlInPhieuXuatHang = url.resolveScript({
                        scriptId: 'customscript_scv_sl_lenhxuathang_print',
                        deploymentId: 'customdeploy_scv_sl_lenhxuathang_print',
                        returnExternalUrl: false
                    });

                    urlInPhieuXuatHang += `&recid=${newRecord.id}&rectype=${newRecord.type}`;

                    form.addButton({
                        id: 'custpage_scv_btn_in_phieu_xuat_hang_pdf',
                        label: 'In phiếu xuất hàng',
                        functionName: `window.open("${urlInPhieuXuatHang}", "_blank")`
                    });
                }

                // form.addField({
                //     id: 'custpage_field_lenh_xuat_hang',
                //     type: 'inlinehtml',
                //     label: 'Inline Html',
                // }).defaultValue = file.load({id: '../html/scv_html_add_btn_icon.html'}).getContents();

                //comUI.addIconToButton(form);

            }
        }


        return {beforeLoad}

    });
