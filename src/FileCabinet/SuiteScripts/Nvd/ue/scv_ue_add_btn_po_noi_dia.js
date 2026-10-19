/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/file', 'N/url'],

    (file, url) => {
        const KenhMuaHang = {
            NOI_DIA: "1",
            NHAP_KHAU: "2"
        }

        const LoaiGiaoDich = {
            MUA_BAN_NOI_DIA: "53"
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
            let segment = scriptContext.newRecord.getValue({fieldId: 'cseg_scv_pc'});
            let orderType = scriptContext.newRecord.getValue({fieldId: 'custbody_scv_order_type'});

            if (segment === KenhMuaHang.NOI_DIA && orderType !== LoaiGiaoDich.MUA_BAN_NOI_DIA) {
                if (scriptContext.type === scriptContext.UserEventType.VIEW) {
                    let form = scriptContext.form;
                    let idRec = scriptContext.newRecord.id;
                    let typeRec = scriptContext.newRecord.type;

                    form.addButton({
                        id: 'custpage_scv_po_noi_dia_print_pdf',
                        label: 'Đơn Mua Nội Địa',
                        functionName: `printDonMuaNoiDia(${idRec}, '${typeRec}')`
                    });

                    form.addField({
                        id: 'custpage_add_icon_print',
                        type: 'inlinehtml',
                        label: 'inlinehtml1'
                    }).defaultValue = file.load({id: '../html/scv_html_external_libs.html'}).getContents();

                   form.clientScriptModulePath = '../cs/scv_cs_print_po_noi_dia';

                }
            }
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

        }

        return {beforeLoad, beforeSubmit, afterSubmit}

    });
