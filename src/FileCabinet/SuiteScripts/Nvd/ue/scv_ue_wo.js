/**
 * Nội dung:
 * Key:
 * * =======================================================================================
 *  Date                Author                  Description
 *  19 Nov 2024         Huy Pham	    		Init & create file, Sinh số lô tự động trong màn hình WO, from mr.Bính(https://app.clickup.com/t/86cx2y1j1)
 *  25 Nov 2024         Huy Pham                Chức năng load default Các item phụ phẩm, thu hồi, from mr.Bính(https://app.clickup.com/t/86cx4wmbg)
 *  25 Nov 2024         Khanh Tran              Quản lý Hệ số quy đổi, from mr.Bính(https://app.clickup.com/t/86cx3r94u)
 *  20 Dec 2024         Khanh Tran              Kế thừa thông tin SO , from ms.Ngọc(https://app.clickup.com/t/86cxczua3)
 *  20 Feb 2025         Duy Nguyen              NVD-MFG - Mặc định kho theo line trên lệnh sản xuất , from mr.Viet(https://app.clickup.com/t/86cy1mjww)
 *  14 Mar 2025         Huy Pham                Updatde Sinh số lô tự động, from mr.Phúc(https://app.clickup.com/t/86cx2y1j1?comment=90160097650803)
 *  10 Jun 2025         Huy Pham                Tắt chức năng sinh số thống kê sản xuất, from mr.Phúc(https://app.clickup.com/t/86cx2y1j1?comment=90160115147205)
 *  */
/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/search',
        '../cons/scv_cons_seqnumber.js',
        '../cons/scv_cons_workorder.js',
        '../cons/scv_cons_byproduct.js',
        '../lib/scv_lib_location_line_wo.js'
    ],

    (search,
        constSeqNumber,
        constWorkOrder,
        constByProduct,
        libLocLineWO
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
            constWorkOrder.loadDataFromSO(scriptContext);
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
            if (["create", "edit"].includes(triggerType)) {
                let newRec = scriptContext.newRecord;
                constWorkOrder.genQCSerialCode(newRec);
                //constSeqNumber.genSoThongKeSX(newRec);
                constWorkOrder.genAssemblyLotNumber(newRec, scriptContext.oldRecord);

                constByProduct.addLineDefaultOfRecord(newRec);
                libLocLineWO.updateLocForLinesWO(scriptContext);
                constWorkOrder.updateUseStdBomQtySlItem(newRec, scriptContext.oldRecord);
                constWorkOrder.updateQuantitySlItem(newRec, scriptContext.oldRecord);
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
        }

        return {
            beforeLoad,
            beforeSubmit,
            afterSubmit
        }

    });
