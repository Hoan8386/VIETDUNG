/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/url', 'N/file','../common/scv_common_ui'],
    
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
                if(scriptContext.type === scriptContext.UserEventType.VIEW){
                    let form = scriptContext.form;

                    let newRecord = scriptContext.newRecord;

                    let urlPurchasePlanPrint = url.resolveScript({
                        scriptId: 'customscript_scv_sl_purchase_plan_print',
                        deploymentId: 'customdeploy_scv_sl_purchase_plan_print',
                        returnExternalUrl: false
                    });

                    urlPurchasePlanPrint += `&recid=${newRecord.id}&rectype=${newRecord.type}`;

                    scriptContext.form.addButton({
                        id: 'custpage_scv_btn_purchase_plan_print_pdf',
                        label: 'Kế hoạch mua hàng',
                        functionName: `xuatKeHoachMuaHangPdf()`//`window.open('${urlPurchasePlanPrint}', '_blank')`
                    });

                    scriptContext.form.addButton({
                        id: 'custpage_scv_btn_purchase_plan_print_excel',
                        label: 'Kế hoạch mua hàng',
                        functionName: `xuatKeHoachMuaHangExcel()`
                    });

                    comUI.addIconToButton(form);
                    comUI.addExcelJs(form);

                    form.clientScriptModulePath = '../cs/scv_cs_purchase_plan_print.js';
                    // scriptContext.form.addField({
                    //     id: 'custpage_field_html_purchase_plan_print',
                    //     type: 'inlinehtml',
                    //     label: 'htmll',
                    // }).defaultValue = file.load({id: '../html/scv_html_add_btn_icon.html'}).getContents();

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
