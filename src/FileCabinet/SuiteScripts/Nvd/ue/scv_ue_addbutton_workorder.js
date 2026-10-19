/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/url'],
    
    (url) => {
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
                let newRec = scriptContext.newRecord;
                let idRec = newRec.id;
                let recType = newRec.type;

                let urlToSuiteLet = url.resolveScript({
                        scriptId: 'customscript_scv_sl_workorder_print',
                        deploymentId: 'customdeploy_scv_sl_workorder_print',
                });

                let urlPhieuGiaoViec = `${urlToSuiteLet}&exportType=pdf&template=PGV&recId=${idRec}&recType=${recType}`;
                let urlYeuCauSanXuat = `${urlToSuiteLet}&exportType=pdf&template=YCSX&recId=${idRec}&recType=${recType}`;
                
                form.addButton({
                        id: 'custpage_btn_print_phieu_giao_viec',
                        label: 'Phiếu giao việc',
                        functionName: `window.open('${urlPhieuGiaoViec}', '_blank');`
                });

                form.addButton({
                        id: 'custpage_btn_print_ycsx',
                        label: 'Yêu cầu sản xuất',
                        functionName: `window.open('${urlYeuCauSanXuat}', '_blank');`
                });
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
