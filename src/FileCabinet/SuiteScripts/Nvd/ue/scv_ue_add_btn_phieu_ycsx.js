/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/url','../common/scv_common_ui'],

    (url, comUI) => {
        const APPROVAL_STATUS = {
            approved: '3',
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
            let form = scriptContext.form;
            let newRec = scriptContext.newRecord;

            let approvalStatus = newRec.getValue('custbody_scv_approval_status');

            if (approvalStatus === APPROVAL_STATUS.approved) {
                let idRec = newRec.id;
                let recType = newRec.type;

                let urlToSuiteLet = url.resolveScript({
                    scriptId: 'customscript_scv_sl_print_phieu_ycsx',
                    deploymentId: 'customdeploy_scv_sl_print_phieu_ycsx',
                });

                let urlPhieuYCSX = `${urlToSuiteLet}&exportType=pdf&recId=${idRec}&recType=${recType}`;

                form.addButton({
                    id: 'custpage_scv_btn_print_phieu_ycsx_pdf',
                    label: 'Phiếu YCSX',
                    functionName: `window.open('${urlPhieuYCSX}', '_blank');`
                });

                comUI.addIconToButton(form);

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
