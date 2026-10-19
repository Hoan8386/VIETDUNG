/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/url','N/file'],

    (url, file) => {
        const PhanLoaiKhieuNai = {
            KHIEU_NAI_DICH_VU: '13',
            KHIEU_NAI_SAN_PHAM: '14',
            SAN_PHAM_KHONG_PHU_HOP: '10',
            SU_KHONG_PHU_HOP: '17',
            XU_LY_TON_KHO_LAU_NGAY: '19',
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
            let record = scriptContext.newRecord;
            let loaiKhieuNai = record.getValue('custevent_scv_phan_loai_khieu_nai');

            if (loaiKhieuNai === PhanLoaiKhieuNai.KHIEU_NAI_DICH_VU ||
                loaiKhieuNai === PhanLoaiKhieuNai.KHIEU_NAI_SAN_PHAM) {
                let form = scriptContext.form;
                let exportToWordFile = file.load({id: '../html/scv_html_add_btn_icon.html'})
                let urlOfTemplate = url.resolveScript({
                    scriptId: 'customscript_scv_sl_print_phieukhieunai',
                    deploymentId: 'customdeploy_scv_sl_print_phieukhieunai',
                    params: {
                        recId: record.id,
                        recType: record.type,
                    }
                });

                form.addField({
                    id: 'custpage_inline_htmml',
                    type: 'inlinehtml',
                    label: 'inlinehtml',
                }).defaultValue = exportToWordFile.getContents();

                form.addButton({
                    id: 'custpage_scv_btn_print_pdf_phieu_khieu_nai',
                    label: 'Phiếu khiếu nại',
                    functionName: `window.open('${urlOfTemplate}','_blank' )`,
                });

            } else if (
                loaiKhieuNai === PhanLoaiKhieuNai.SAN_PHAM_KHONG_PHU_HOP ||
                loaiKhieuNai === PhanLoaiKhieuNai.SU_KHONG_PHU_HOP ||
                loaiKhieuNai === PhanLoaiKhieuNai.XU_LY_TON_KHO_LAU_NGAY ) {

                let form = scriptContext.form;
                let exportToWordFile = file.load({id: '../html/scv_html_add_btn_icon.html'})
                let urlOfTemplate = url.resolveScript({
                    scriptId: 'customscript_scv_sl_print_case_pkph',
                    deploymentId: 'customdeploy_scv_sl_print_case_pkph',
                    params: {
                        recId: record.id,
                        recType: record.type,
                    }
                });

                form.addField({
                    id: 'custpage_inline_htmml',
                    type: 'inlinehtml',
                    label: 'inlinehtml',
                }).defaultValue = exportToWordFile.getContents();

                form.addButton({
                    id: 'custpage_scv_btn_print_pdf_phieu_khong_phu_hop',
                    label: 'Phiếu không phù hợp',
                    functionName: `window.open('${urlOfTemplate}','_blank' )`,
                });


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
