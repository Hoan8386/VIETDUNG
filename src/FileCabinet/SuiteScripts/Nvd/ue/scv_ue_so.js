/**
 * Nội dung:
 * Key:
 * * =======================================================================================
 *  Date                Author                  Description
 *  25 Nov 2024         Khanh Tran	    		Init & create file, Tính giá cơ sở của Item chuẩn và Item lệch chuẩn theo Conversion Rate, from ms.Ngọc(https://app.clickup.com/t/86cx3r94u)
 *  28 Feb 2024         Duy Nguyen              NVD - Chuyển chức năng Check Item Has Bom trên Sales Order từ Hamakyu sang NVD, Mr. Phuc (https://app.clickup.com/t/86cy2eaea)
 *  01 Mar 2025         Huy Pham                Tính tổng trọng lượng hàng hóa trên SO, from ms.Ngọc(https://app.clickup.com/t/86cy4j99n)
 *  03 June 2025        Khanh Tran              Tính các giá trị trên SO (theo dung sai), from ms.Ngọc(https://app.clickup.com/t/86cz4f1c2)
 *  24 Sep 2026         Phu Pham                Chức năng tính giá theo m2 trên SO (header) from ms. Ngọc (https://app.clickup.com/t/3773072/14yhnhmfdgm)
 *  */
/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define([
        'N/runtime',
        '../cons/scv_cons_salesorder.js',
        '../cons/scv_cons_calc_base_price.js',
        '../cons/scv_cons_tolerance_values.js',
        '../common/scv_common_check_bom_item.js',
        '../common/scv_common_so_m2_einvoice.js',
    ],
    (
        runtime,
        constSalesOrder,
        constCalcBasePrice,
        constTolVal,
        cmCheckBomItem,
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
            let triggerType = scriptContext.type;
            let newRec = scriptContext.newRecord;
            if (["create", "edit"].includes(triggerType)) {
                constCalcBasePrice.updateRecordWithBasePrices(scriptContext);
                
                constSalesOrder.sumWeightItem(scriptContext.newRecord);
            }
            if (triggerType === 'create') {
                //goi phan xu ly cap nhap field custcol_scv_check_bom_item
                cmCheckBomItem.setCheckBomLineItems(scriptContext.newRecord, 'item', 'item');
                
                if (runtime.executionContext !== runtime.ContextType.USER_INTERFACE) {
                    constTolVal.updateRecordWithTolerance(newRec);
                }
            }
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

        return {
            //beforeLoad, 
            beforeSubmit,
            afterSubmit
        }
        
    });
