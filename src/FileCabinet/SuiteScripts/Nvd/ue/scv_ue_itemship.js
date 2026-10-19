/**
 * Nội dung:
 * Key:
 * * =======================================================================================
 *  Date                Author                  Description
 *  19 Nov 2024         Huy Pham	    		Init & create file
 *  05 Sep 2025         Khanh Tran	    		Điền tên người duyệt LXH trên IF tạo từ SO from ms. Ngọc (https://app.clickup.com/t/86d07ekxx)
 *  24 Sep 2026         Phu Pham                Chức năng tính giá theo m2 trên SO (header) from ms. Ngọc (https://app.clickup.com/t/3773072/14yhnhmfdgm)
 */
/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define([
    '../common/scv_common_duyet_lxh.js',
    '../common/scv_common_so_m2_einvoice.js',
],
    (
        cmDuyetLsx,
        commonSOM2Einvoice,
    ) => {
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
            let newRec = scriptContext.newRecord;

            cmDuyetLsx.updateNguoiPheDuyetLsx(newRec);
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
            let newRec = scriptContext.newRecord;

            if(["create", "edit"].includes(scriptContext.type)) {
                commonSOM2Einvoice.afterSubmit_CalcM2EinvoiceAmt(newRec);
            }
        }

        return { beforeSubmit, afterSubmit }

    });
