/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define([
        'N/file',
        'N/record',
        'N/runtime',
        'N/url',
        '../common/scv_common_ui',

    ],
    (
        file,
        record,
        runtime,
        url,
        comUI,
    ) => {
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
            if (scriptContext.type === scriptContext.UserEventType.VIEW) {
                let segment = scriptContext.newRecord.getValue({fieldId: 'cseg_scv_pc'});
                let orderType = scriptContext.newRecord.getValue({fieldId: 'custbody_scv_order_type'});
                // add btn PO đơn mua nội địa
                let form = scriptContext.form;
                form.clientScriptModulePath = '../cs/scv_cs_print_po';
                addBtnPoPrint(form, segment, orderType);

                const isAddBtnCloseOpenLine = checkAddBtnCloseOpenLine(scriptContext.newRecord.id);
                if (isAddBtnCloseOpenLine) {
                    addBtnCloseLine(form);
                    addBtnOpenLine(form);
                }

            } else if (scriptContext.type === scriptContext.UserEventType.EDIT) {
                // let form = scriptContext.form;
                // let newRecord = scriptContext.newRecord;
                // addBtnUpdateGiaCu(form, newRecord);
            }
        }

        const checkAddBtnCloseOpenLine = (recId) => {
            let user = runtime.getCurrentUser();
            let userRole = user.role;
            // Kiểm tra nếu người dùng có vai trò là 3, 1624 hoặc 1625
            if (userRole !== 3 && userRole !== 1624 && userRole !== 1625) return false;
            if (!isValidAllLines(recId)) return false;
            return true
        }

        const isValidAllLines = (recId) => {
            let recPo = record.load({
                type: record.Type.PURCHASE_ORDER,
                id: recId,
            });
            for(let i = 0; i < recPo.getLineCount({sublistId: 'item'}); i++) {
                let itemType = recPo.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'itemtype',
                    line: i
                })
                let quantityreceived  = recPo.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'quantityreceived',
                    line: i
                });
                let quantitybilled   = recPo.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'quantitybilled',
                    line: i
                });

                if( itemType === 'Service') {
                    if (!quantitybilled) {
                        return false;
                    }
                }else {
                    if (quantitybilled !== quantityreceived) {
                        return false;
                    }

                }
                // if( quantityreceived !== quantitybilled) {
                //     return false; // Nếu có ít nhất một dòng chưa được đóng, trả về false
                // }
            }
            return true; // Nếu tất cả các dòng đều đã được đóng, trả về true
        }

        const addBtnCloseLine = (form) => {
            form.addButton({
                id: 'custpage_scv_closed_line_transaction',
                label: 'Close Line',
                functionName: 'redirectToSuitelet'
            });
        }

        const addBtnOpenLine = (form) => {
            form.addButton({
                id: 'custpage_scv_open_line_transaction',
                label: 'Open Line',
                functionName: 'openredirectToSuitelet'
            });
        }

        const addBtnPoPrint = (form, segment, orderType) => {
            comUI.addIconToButton(form);
            comUI.addExcelJs(form);
            if (segment === KenhMuaHang.NOI_DIA && orderType !== LoaiGiaoDich.MUA_BAN_NOI_DIA) {
                form.addButton({
                    id: 'custpage_scv_po_noi_dia_print_pdf',
                    label: 'Đơn Mua Nội Địa',
                    functionName: `printDonMuaNoiDiaPdf()`
                });
                form.addButton({
                    id: 'custpage_scv_po_noi_dia_print_excel',
                    label: 'Đơn Mua Nội Địa',
                    functionName: `printDonMuaNoiDiaExcel()`
                });
            } else if (segment === KenhMuaHang.NHAP_KHAU && orderType !== LoaiGiaoDich.MUA_BAN_NOI_DIA) {
                form.addButton({
                    id: 'custpage_scv_po_nhap_khau_print_excel',
                    label: 'Đơn Mua Nhập Khẩu',
                    functionName: `printDonMuaNhapKhau()`
                });

                form.addButton({
                    id: 'custpage_scv_po_nhap_khau_print_pdf',
                    label: 'Đơn Mua Nhập Khẩu',
                    functionName: `printDonMuaNhapKhauPdf()`
                });
            }
        }


        return {
            beforeLoad
        }

    });
