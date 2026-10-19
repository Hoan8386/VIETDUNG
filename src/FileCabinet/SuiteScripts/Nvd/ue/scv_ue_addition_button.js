/**
 * Nội dung:
 * =======================================================================================
 *  Date                Author                  Description
 *  ?                   ?                       ?
 * 29/05/2025          Thanh Ngo                Add Btn Lenh Xuat Hang from Ms.Ngoc(https://app.clickup.com/t/86cxyer84)
 *  12 Aug 2026         Huy Pham                Phiếu xuất kho gộp (luồng bán hàng), from ms.Ngọc(https://app.clickup.com/t/3773072/86d40bypv)
 *  09 Sep 2026         Huy Pham                Phiếu xuất kho bảng kê (luồng bán hàng), from ms.Ngọc(https://app.clickup.com/t/3773072/86d40bypv?comment=1300230000016108)
 *  19 Otc 2026        Thanh Hoan               Thêm Btn "Bảng kê không giá" và "Bảng kê có giá" from ms.Ngọc(https://app.clickup.com/t/3773072/14yhnhmgyad)
 */
/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

define(['N/query', "N/record", 'N/runtime', "N/search", "N/url", '../lib/scv_lib_common_html.js', 'N/file', '../lib/scv_lib_function',
    '../cons/scv_cons_file.js',
    '../cons/scv_cons_role.js',
],
    function (query, record, runtime, search, url, libHtml, file, lfunc,
        constFile,
        constRole
    ) {

        let arrBtnPrint = [];
        let _currentRecord = null;
        const objTemplateId = {
            PHIEU_THU: "CUSTTMPL_SCV_PHIEU_THU",
            PHIEU_CHI: "CUSTTMPL_SCV_PHIEU_CHI",
            PHIEU_KE_TOAN: "CUSTTMPL_SCV_PHIEU_KE_TOAN",
            PHIEU_UNC: "CUSTTMPL_SCV_PHIEU_UNC",
        };

        const TemplateLenhChuyenTien = {
            '138' : "scv_render_lct_scb_pdf", // mẫu Sacombank
            '139' : "scv_render_lct_mb_pdf", // mẫu MB bank
            '140' : "scv_render_lct_vcb_pdf",  // mẫu nước ngoài
            // MB: '139',
            // SCB: '138',
            // NUOC_NGOAI: '140'
        }

        const objSuffixNameScript = {
            PRINT: "scv_sl_addition_print",
            WORD: "scv_sl_render_word",
            WORD_1: "scv_sl_print_word"
        };
        const ORDERTYPE = {
            NHAP_PHE_PHU_PHAM_THU_HOI: "22",
            NHAP_DIEU_CHINH_KIEM_KE: "31",
            XUAT_CHUYEN_MA_VAT_TU: "29",
            XUAT_CP_CHUNG_TAI_NM: "25",
            XUAT_VAT_TU_PHU_VAO_SAN_XUAT: "7",
            XUAT_DIEU_CHINH_KIEM_KE: "16",
            XUAT_TIEU_HAO_GIA_CONG_CO_KHI: "42",
            MUA_HANG_GIA_CONG: '47'
        };
        const STATUS = {
            DA_PHE_DUYET: "3",
            CONFIRMED: "19",
            CHO_XAC_NHAN_DE_XUAT_HOA_DON: "63",
        };
        const PHE_DUYET = {
            DA_XAC_THUC: "22",
        };

        const beforeLoad = scriptContext => {
            try {
                let triggerType = scriptContext.type;
                if (triggerType !== "view") return;
                let newRecord = scriptContext.newRecord;
                let form = scriptContext.form;
                let recType = newRecord.type;
                let objPrint = {};
                let isUNC = false, isPhieuThu = false, isPhieuChi = false, isPhieuKeToan = false,
                    isDeNghiTamUngThanhToan = false;
                switch (recType) {
                    case 'customerrefund':
                        isUNC = true;
                        isPhieuChi = true;
                        break;
                    case record.Type.DEPOSIT:
                        isPhieuThu = true;
                        isPhieuKeToan = true;
                        break;
                    case record.Type.CUSTOMER_PAYMENT:
                        isPhieuThu = true;
                        isPhieuKeToan = true;
                        break;
                    case record.Type.CUSTOMER_DEPOSIT:
                        isPhieuThu = true;
                        isPhieuKeToan = true;
                        break;
                    case record.Type.CHECK:
                        isUNC = true;
                        isPhieuChi = true;
                        isPhieuKeToan = true;
                        // objPrint.btn_lct = addBtnPrintPDF(form, newRecord, 'LCT', 'custpage_lct_pdf', 'scv_render_lct_pdf');
                        // arrBtnPrint.push(...Object.values(objPrint));
                        objPrint.btn_lct = addBtnPrintPDF(form, newRecord, 'LCT', 'custpage_lct_pdf', getIdLctTemplate(newRecord));
                        arrBtnPrint.push(...Object.values(objPrint));
                        arrBtnPrint.push({export_type: "EXCEL", id: 'custpage_scv_btn_lct_print_excel'});
                        break;
                    case record.Type.VENDOR_PAYMENT:
                        isPhieuChi = true;
                        isPhieuKeToan = true;
                        isUNC = true;
                        let idTemplateLct = getIdLctTemplate(newRecord);
                        objPrint.btn_lct = addBtnPrintPDF(form, newRecord, 'LCT', 'custpage_lct_pdf', idTemplateLct);
                        arrBtnPrint.push(...Object.values(objPrint));
                        arrBtnPrint.push({export_type: "EXCEL", id: 'custpage_scv_btn_lct_print_excel'});
                        break;
                    case record.Type.VENDOR_PREPAYMENT:
                        isUNC = true;
                        isPhieuChi = true;
                        isPhieuKeToan = true;
                        // objPrint.btn_lct = addBtnPrintPDF(form, newRecord, 'LCT', 'custpage_lct_pdf', 'scv_render_lct_pdf');
                        // arrBtnPrint.push(...Object.values(objPrint));
                        objPrint.btn_lct = addBtnPrintPDF(form, newRecord, 'LCT', 'custpage_lct_pdf', getIdLctTemplate(newRecord));
                        arrBtnPrint.push(...Object.values(objPrint));
                        arrBtnPrint.push({export_type: "EXCEL", id: 'custpage_scv_btn_lct_print_excel'});
                        break;
                    case record.Type.JOURNAL_ENTRY:
                        isPhieuKeToan = true;
                        break;
                    case record.Type.VENDOR_BILL:
                        // isUNC = true;
                        isPhieuKeToan = true;
                        break;
                    case record.Type.VENDOR_CREDIT:
                        isPhieuKeToan = true;
                        break;
                    case record.Type.INVOICE:
                        isPhieuKeToan = true;
                        break;
                    case record.Type.CREDIT_MEMO:
                        isPhieuKeToan = true;
                        break;
                    case 'custompurchase_scv_lenhchi':
                        isUNC = true;
                        isPhieuChi = true;
                        isPhieuKeToan = true;
                        // objPrint.btn_lct = addBtnPrintPDF(form, newRecord, 'LCT', 'custpage_lct_pdf', 'scv_render_lct_pdf');
                        // arrBtnPrint.push(...Object.values(objPrint));
                        objPrint.btn_lct = addBtnPrintPDF(form, newRecord, 'LCT', 'custpage_lct_pdf', getIdLctTemplate(newRecord));
                        arrBtnPrint.push(...Object.values(objPrint));
                        arrBtnPrint.push({export_type: "EXCEL", id: 'custpage_scv_btn_lct_print_excel'});
                        break;
                    case record.Type.INVENTORY_ADJUSTMENT:
                        isPhieuKeToan = true;
                        let order_type = newRecord.getValue('custbody_scv_order_type');
                        if (order_type === '66') { // lĩnh vật tư gia công
                            objPrint.btn_pnk = addBtnPrintPDF(form, newRecord, 'Phiếu nhập kho', 'custpage_pnk_pdf', 'scv_render_pnk_pdf');
                            objPrint.btn_pxk = addBtnPrintPDF(form, newRecord, 'Phiếu xuất kho', 'custpage_pxk_pdf', 'scv_render_pxk_pdf');
                        } else {
                            let lkFieldsIA = search.lookupFields({
                                type: 'inventoryadjustment',
                                id: newRecord.id,
                                columns: ['custbody_scv_order_type.custrecord_scv_receipt_or_fulfill']
                            });

                            if (lkFieldsIA['custbody_scv_order_type.custrecord_scv_receipt_or_fulfill'][0]?.value === '2' || !lkFieldsIA['custbody_scv_order_type.custrecord_scv_receipt_or_fulfill'][0]?.value) {
                                objPrint.btn_pnk = addBtnPrintPDF(form, newRecord, 'Phiếu nhập kho', 'custpage_pnk_pdf', 'scv_render_pnk_pdf');
                            }
                            if (lkFieldsIA['custbody_scv_order_type.custrecord_scv_receipt_or_fulfill'][0]?.value === '1' || !lkFieldsIA['custbody_scv_order_type.custrecord_scv_receipt_or_fulfill'][0]?.value) {
                                objPrint.btn_pxk = addBtnPrintPDF(form, newRecord, 'Phiếu xuất kho', 'custpage_pxk_pdf', 'scv_render_pxk_pdf');
                            }
                        }
                        arrBtnPrint.push(...Object.values(objPrint));
                        break;
                    case record.Type.EXPENSE_REPORT:
                        isPhieuKeToan = true;
                        isDeNghiTamUngThanhToan = true;
                        break;
                    case "customrecord_scv_emp":
                        isDeNghiTamUngThanhToan = true;
                        break;
                    case 'salesorder':
                        let cseg_scv_sc = newRecord.getValue('cseg_scv_sc');
                        if (cseg_scv_sc === '2') {
                            addBtnPrintSC_EXCEL(form, newRecord, objPrint);
                            arrBtnPrint.push(...Object.values(objPrint));
                        }
                        break;
                    case 'customrecord_scv_sd':
                        addBtnPrintSD_EXCEL(form, newRecord, objPrint);
                        arrBtnPrint.push(...Object.values(objPrint));
                        break;
                    case 'customrecord_scv_cmms_maintenanceplan_h':
                        objPrint.btn_ke_hoach = addBtnPrintPDF(form, newRecord, 'Kế hoạch', 'custpage_ycbd', 'scv_render_ycbd_pdf');
                        objPrint.btn_kh_excel = addBtnPrintExcel(form, newRecord, {btnName : 'Kế hoạch', btnId : 'custpage_ycbd_excel', templateId : 'scv_xlsx_ycbd'});
                        arrBtnPrint.push(...Object.values(objPrint));
                        break;
                    case 'customrecord_scv_cmms_toolscheck_h':
                        objPrint = addBtnPrintPDF(form, newRecord, 'BBKT', 'custpage_bbkt', 'scv_render_bbkt_pdf');
                        arrBtnPrint.push(...Object.values(objPrint));
                        break;
                    case 'customrecord_scv_cmms_workorder':
                        objPrint.btn_scsc = addBtnPrintPDF(form, newRecord, 'Phiếu SCSC', 'custpage_scsc_pdf', 'scv_render_scsc_pdf');
                        objPrint.btn_scts_hc = addBtnPrintPDF(form, newRecord, 'Phiếu SCTS HC', 'custpage_scts_hc_pdf', 'scv_render_scts_hc_pdf');
                        arrBtnPrint.push(...Object.values(objPrint));
                        break;
                    case 'customrecord_scv_hieu_chinh_tb_do':
                        objPrint.bbkd = addBtnPrintPDF(form, newRecord, 'BBKD', 'custpage_bbkd', 'scv_render_bbkd_pdf');
                        objPrint.bbkk = addBtnPrintPDF(form, newRecord, 'BBBG', 'custpage_bbbg', 'scv_render_bbbg_pdf');
                        arrBtnPrint.push(...Object.values(objPrint));
                        arrBtnPrint.push({export_type: "EXCEL", id: 'custpage_scv_btn_tem_tbd_pdf'});
                        break;
                    case 'customsale_scv_ot_yc_xvt':
                        // let approval_status = newRecord.getValue('custbody_scv_approval_status');
                        // if (approval_status === STATUS.DA_PHE_DUYET || approval_status === '35') {
                            let custrecord_scv_receipt_or_fulfill = search.lookupFields({
                                type: 'customsale_scv_ot_yc_xvt',
                                id: newRecord.id,
                                columns: ['custbody_scv_order_type.custrecord_scv_receipt_or_fulfill']
                            })['custbody_scv_order_type.custrecord_scv_receipt_or_fulfill'][0]?.text;

                            if (!custrecord_scv_receipt_or_fulfill) {
                                objPrint.btn_ycnxn = addBtnPrintPDF(form, newRecord, 'YCNXN', 'custpage_ycnxn', 'scv_render_ycnxn_pdf');
                                objPrint.btn_ycnxx = addBtnPrintPDF(form, newRecord, 'YCNXX', 'custpage_ycnxx', 'scv_render_ycnxx_pdf');
                            }
                            else if(custrecord_scv_receipt_or_fulfill.includes('Nhập')){
                                objPrint.btn_ycnxn = addBtnPrintPDF(form, newRecord, 'YCNXN', 'custpage_ycnxn', 'scv_render_ycnxn_pdf');
                            }else if(custrecord_scv_receipt_or_fulfill.includes('Xuất')){
                                objPrint.btn_ycnxx = addBtnPrintPDF(form, newRecord, 'YCNXX', 'custpage_ycnxx', 'scv_render_ycnxx_pdf');
                            }

                        // }
                        // if (approval_status === "35" || approval_status === "3") {
                        //     objPrint.btn_ycnxk = addBtnPrintPDF(form, newRecord, 'YCNXK', 'custpage_ycnxk', 'scv_render_ycnxk_pdf');
                        // }
                        arrBtnPrint.push(...Object.values(objPrint));
                        break;
                    case 'transferorder':
                        // const orderTypeTo = newRecord.getValue('custbody_scv_order_type');
                        // let isCto = newRecord.getValue('icto');
                        // if (orderTypeTo === '53' && isCto === 'T') {
                        //      arrBtnPrint.btn_lxh = addBtnLenhXuatHang(form, newRecord);
                        // }
                        // let status = newRecord.getValue('custbody_scv_approval_status');
                        // if (status === STATUS.DA_PHE_DUYET || status === "35") {
                            objPrint.btn_ycdc = addBtnPrintPDF(form, newRecord, 'YCDC', 'custpage_ycdc', 'scv_render_ycdc_pdf');
                        // }
                        arrBtnPrint.push(...Object.values(objPrint));
                        break;
                    case 'itemreceipt':
                        let tt_phe_duyet = newRecord.getValue('custbody_scv_tt_phe_duyet');
                        let sublistId = 'item';
                        let arrLine = [], arrNhomACP = [], arrNhomTran = [];
                        let showTemCuonNhomBtn = false;
                        let showLabelNhomAcpBtn = false;
                        let inboundshipment = newRecord.getValue('inboundshipment')

                        for (let i = 0; i < newRecord.getLineCount(sublistId); i++) {
                            let itemId = newRecord.getSublistValue(sublistId, 'item', i);
                            if (itemId) {
                                let rectype = lfunc.getItemRecordType(itemId);
                                if (rectype === 'lotnumberedassemblyitem' && inboundshipment) {
                                    let recItem = record.load({
                                        type: rectype,
                                        id: itemId,
                                    });
                                    let customform = recItem.getValue('customform');
                                    let group_lv1 = recItem.getValue('custitem_scv_group_lv1');
                                    let group_lv2 = recItem.getValue('custitem_scv_group_lv2');
                                    let isTemCuonNhom = false, isNhomACP = false, isNhomTran = false;
                                    if ((group_lv1 === '16' && (group_lv2 === '20' || group_lv2 === '23')) ||
                                        (group_lv1 === '31' && group_lv2 === '5')) {
                                        isTemCuonNhom = true;
                                    }
                                    if (group_lv1 === '16' && (group_lv2 === '20' || group_lv2 === '23')) {
                                        isNhomACP = true;
                                    }
                                    if (group_lv1 === '31' && ( group_lv2 === '5' || group_lv2 === '24') ) {
                                        isNhomTran = true;
                                    }
                                    arrLine.push(isTemCuonNhom);
                                    arrNhomACP.push(isNhomACP);
                                    arrNhomTran.push(isNhomTran);

                                    if ((group_lv1 === '16' && (group_lv2 === '20' || group_lv2 === '23')) ||
                                        (group_lv1 === '31' && group_lv2 === '5')) {
                                        showTemCuonNhomBtn = true;
                                    }

                                    if((group_lv1 === '16' && (group_lv2 === '20' || group_lv2 === '23'))) {
                                        showLabelNhomAcpBtn = true;
                                    }

                                }
                            }
                        }
                        if (showTemCuonNhomBtn) {
                            objPrint.btn_tem = addBtnPrintPDF(form, newRecord, 'Tem cuộn nhôm', 'custpage_tem_cuon_nhom_pdf', 'scv_render_tem_cuon_nhom');
                            objPrint.btn_tem_excel = addBtnPrintExcel(form, newRecord, {
                                btnId: 'custpage_tem_cuon_nhom_excel',
                                btnName: 'Tem cuộn nhôm',
                                templateId: 'scv_xlsx_tem_cuon_nhom'
                            });
                        }
                        // if (arrNhomACP.includes(true)) {
                        if (showLabelNhomAcpBtn) {
                            objPrint.btn_nhom_acp = addBtnPrintPDF(form, newRecord, 'Label Nhôm ACP', 'custpage_nhom_acp_pdf', 'scv_render_nhom_acp');
                            objPrint.btn_nhom_acp_excel = addBtnPrintExcel(form, newRecord, {
                                btnId: 'custpage_nhom_acp_excel',
                                btnName: 'Label Nhôm ACP',
                                templateId: 'scv_xlsx_nhom_acp'
                            });
                        }
                        // if (arrNhomTran.includes(true) && tt_phe_duyet === PHE_DUYET.DA_XAC_THUC) {
                        if (arrNhomTran.includes(true) ) {
                            objPrint.btn_nhom_tran = addBtnPrintPDF(form, newRecord, 'Label NT và TC', 'custpage_nhom_tran_pdf', 'scv_render_nhom_tran');
                            objPrint.btn_nhom_tran_excel = addBtnPrintExcel(form, newRecord, {
                                btnId: 'custpage_nhom_tran_excel',
                                btnName: 'Label NT và TC',
                                templateId: 'scv_xlsx_nhom_tran'
                            });
                        }

                        objPrint.btn_pnk = addBtnPrintPDF(form, newRecord, 'Phiếu nhập kho', 'custpage_pnk_pdf', 'scv_render_pnk_pdf');

                        //thanhdev 14/4/2025
                        let ordType = newRecord.getValue('custbody_scv_order_type');
                        let idSSAfterQc = 'customsearch_scv_rem_qc_done';
                        let searchSSAfterQc = search.load({
                            id: idSSAfterQc
                        });

                        // với loại mua hàng gia công, phiếu được tạo qua asembly build nên field cần so sẽ ko nằm trực tiếp trên created_transaction mà nằm trên itr_link
                        if(ordType !== ORDERTYPE.MUA_HANG_GIA_CONG) {
                            searchSSAfterQc.filters.push(search.createFilter({
                                name: 'custbody_scv_created_transaction',
                                operator: search.Operator.ANYOF,
                                values: newRecord.id
                            }));
                        }else {
                            searchSSAfterQc.filters.push(search.createFilter({
                                name: 'custbody_scv_itr_link',
                                operator: search.Operator.ANYOF,
                                values: newRecord.id
                            }));
                        }
                        let resultSearch = searchSSAfterQc.run().getRange(0, 10);

                        let hasLines = resultSearch.length > 0;
                        if (hasLines > 0 ) {
                            objPrint.btn_pnk2 = addBtnPrintPDF(form, newRecord, 'Phiếu nhập kho sau QC', 'custpage_pnk_qc_pdf', 'scv_render_pnk_qc_pdf');
                        }
                        //-----
                        arrBtnPrint.push(...Object.values(objPrint));
                        break;
                    case 'itemfulfillment':
                        // thanh dev add 22/05/2025
                        const createdFrom = newRecord.getText('createdfrom');
                        const curUser = runtime.getCurrentUser();
                        const currentRole = curUser.roleId;
                        const currentRoleId = curUser.id;
                        const userType = lfunc.getEntityType(currentRoleId);
                        const orderType = newRecord.getValue('custbody_scv_order_type');
                        const scegVal = newRecord.getValue('cseg_scv_sc');
                        const subsidiary = newRecord.getText('subsidiary');
                        const idApprovalStatus = newRecord.getValue('custbody_scv_approval_status');

                        let isRoleKiemTra = false;
                        if (userType == 'employee' || userType == 'partner') {
                            let lkFieldsRole = search.lookupFields({
                                type: userType,
                                id: currentRoleId,
                                columns: ['custentity_scv_bbgn_co_gia']
                            });
                            isRoleKiemTra = lkFieldsRole.custentity_scv_bbgn_co_gia || false;
                        }

                        if (createdFrom.includes('Sales Order')) {
                            objPrint.btn_lxh = addBtnLenhXuatHang(form, newRecord);
                            if(subsidiary === 'Công ty TNHH Việt Dũng Sài Gòn'
                                && (idApprovalStatus === STATUS.CHO_XAC_NHAN_DE_XUAT_HOA_DON || idApprovalStatus === STATUS.DA_PHE_DUYET)){
                                objPrint.btn_pxk_khong_gia = addBtnPrintPDF(form, newRecord, 'PXK không giá (BBGN)', 'custpage_pxk_khong_gia_pdf', 'scv_render_pxk_khong_gia_pdf');
                                if (scegVal === '5' || isRoleKiemTra == true || currentRole === 'administrator') {
                                    objPrint.btn_pxk_co_gia = addBtnPrintPDF(form, newRecord, 'PXK có giá (BBGN)', 'custpage_pxk_co_gia_pdf', 'scv_render_pxk_co_gia_pdf');
                                }
                            }
                            if(subsidiary === 'Công ty Cổ phần Nhôm Việt Dũng'){
                                objPrint.btn_pxk_khong_gia = addBtnPrintPDF(form, newRecord, 'PXK không giá (BBGN)', 'custpage_pxk_khong_gia_pdf', 'scv_render_pxk_khong_gia_pdf');
                                if (scegVal === '5' || isRoleKiemTra == true || currentRole === 'administrator') {
                                    objPrint.btn_pxk_co_gia = addBtnPrintPDF(form, newRecord, 'PXK có giá (BBGN)', 'custpage_pxk_co_gia_pdf', 'scv_render_pxk_co_gia_pdf');
                                }
                            }
                        } else {
                            objPrint.btn_pxk = addBtnPrintPDF(form, newRecord, 'Phiếu xuất kho', 'custpage_pxk_pdf', 'scv_render_pxk_pdf');
                        }
                        // thanhdev end
                        arrBtnPrint.push(...Object.values(objPrint));

                        if (createdFrom.includes('Sales Order') && curUser.role == constRole.RECORDS.ADMINISTRATOR.ID) {
                            log.error("hoan createdFrom" , createdFrom);
                            objPrint.btn_pxk_co_gia_v2 = addBtnPrintPDF(form, newRecord, 'Bảng kê không giá', 'custpage_pxk_co_gia_v2_pdf', 'scv_render_pxk_co_gia_pdf_v2');
                            objPrint.btn_pxk_khong_gia_v2 = addBtnPrintPDF(form, newRecord, 'Bảng kê có giá', 'custpage_pxk_khong_gia_v2_pdf', 'scv_render_pxk_khong_gia_pdf_v2');
                        } 

                        addBtnPrint(scriptContext, 'scv_print_pxk_invoice');
                        addBtnPrint(scriptContext, 'scv_print_pxk_bangke');
                        break;
                    case 'inventorytransfer':
                        objPrint.btn_pxk = addBtnPrintPDF(form, newRecord, 'Phiếu xuất kho', 'custpage_pxk_pdf', 'scv_render_pxk_pdf');
                        objPrint.btn_pnk = addBtnPrintPDF(form, newRecord, 'Phiếu nhập kho', 'custpage_pnk_pdf', 'scv_render_pnk_pdf');
                        arrBtnPrint.push(...Object.values(objPrint));
                        break;
                    case 'fulfillmentrequest':
                        // objPrint.btn_lxh = addBtnLenhXuatHang(form, newRecord);
                        // arrBtnPrint.push(...Object.values(objPrint));
                        break;
                    case 'bintransfer':
                        objPrint.btn_pcvt_pdf = addBtnPrintPDF(form, newRecord, 'Phiếu chuyển vị trí', 'custpage_btn_pcvt_pdf', 'scv_render_pcvt_pdf');
                        objPrint.btn_pcvt = addBtnPrintExcel(form, newRecord, {
                            btnId: 'custpage_btn_pcvt_excel',
                            btnName: 'Phiếu chuyển vị trí',
                            templateId: 'scv_xlsx_phieu_chuyen_vi_tri'
                        }); // phiếu chuyển vị trí
                        arrBtnPrint.push(...Object.values(objPrint));
                        break;
                    case 'customrecord_scv_nghiem_thu':
                        let rec = record.load({
                            type: 'customrecord_scv_nghiem_thu',
                            id: newRecord.id,
                        });
                        if (rec.getValue('customform') === '405') { // nghiệm thu thiết bị
                            objPrint.btn_bbnt = addBtnPrintPDF(form, newRecord, 'BBNT', 'custpage_bbnt_thiet_bi_pdf', 'scv_render_bbnt_tbi_pdf');
                            arrBtnPrint.push(...Object.values(objPrint));
                        }

                        if( rec.getValue('customform') === '636') { // nghiệm thu thành phẩm cơ khí
                            objPrint.btn_bbnt_ct = addBtnPrintPDF(form, newRecord, 'BB nghiệm thu & bàn giao (TPCK)', 'custpage_bbnt_ban_giao_pdf', 'scv_render_bbnt_ban_giao_pdf');
                            arrBtnPrint.push(...Object.values(objPrint));
                        }
                        break;

                    // case 'workorder':
                    //     objPrint.btn_ycsx = addBtnPrintExcel(form, newRecord, {
                    //         btnId: 'custpage_btn_phieu_ycsx_excel',
                    //         btnName: 'Yêu cầu sản xuất',
                    //         templateId: 'scv_xlsx_phieu_ycsx'
                    //     });
                    //     objPrint.btn_pgv_wo = addBtnPrintExcel(form, newRecord, {
                    //         btnId: 'custpage_btn_pgv_wo_excel',
                    //         btnName: 'Phiếu giao việc',
                    //         templateId: 'scv_xlsx_pgv_wo'
                    //     });
                    //     arrBtnPrint.push(...Object.values(objPrint));
                    //     break;
                    // case 'custompurchase_scv_other_work_order':
                    //     objPrint.btn_ycsx_other_wo = addBtnPrintExcel(form, newRecord, {
                    //         btnId: 'custpage_btn_phieu_ycsx_excel_other_wo',
                    //         btnName: 'Yêu cầu sản xuất',
                    //         templateId: 'scv_xlsx_phieu_ycsx_other_wo'
                    //     });
                    //     objPrint.btn_pgv_owo = addBtnPrintExcel(form, newRecord, {
                    //         btnId: 'custpage_btn_pgv_owo_excel',
                    //         btnName: 'Phiếu giao việc',
                    //         templateId: 'scv_xlsx_pgv_owo'
                    //     });
                    //     arrBtnPrint.push(...Object.values(objPrint));
                    //     break;
                    default:
                        break;
                }
                //isUNC ? addButtonPrint(scriptContext, "UNC", "phieu_unc", "pdf", objSuffixNameScript.PRINT, objTemplateId.PHIEU_UNC) : ""; đưa suitelet xử lý formr a ngoài
                isUNC ? objPrint.btn_phieu_unc = addButtonPrint(scriptContext, "UNC", "phieu_unc", "pdf", 'scv_sl_uynhiemchi_print', objTemplateId.PHIEU_UNC) : "";
                isPhieuChi ? objPrint.btn_phieu_chi = addButtonPrint(scriptContext, "Phiếu chi", "phieu_chi", "pdf", 'scv_sl_phieu_chi_print', objTemplateId.PHIEU_CHI) : "";
                isPhieuThu ? objPrint.btn_phieu_thu = addButtonPrint(scriptContext, "Phiếu thu", "phieu_thu", "pdf", 'scv_sl_phieu_thu_print', objTemplateId.PHIEU_THU) : "";
                isPhieuKeToan ? objPrint.btn_phieu_ke_toan = addButtonPrint(scriptContext, "Phiếu kế toán", "phieu_ke_toan", "pdf", 'scv_sl_phieu_ke_toan_print', objTemplateId.PHIEU_KE_TOAN) : "";

                arrBtnPrint.push(...Object.values(objPrint));
                libHtml.addIconButtonExport(form, arrBtnPrint, "custpage_add_icon_prt");

            } catch (err) {
                log.error("Error BeforeLoad : ", err);
            }
        }

        const addBtnLenhXuatHang = (form, newRecord) => {
            let urlInPhieuXuatHang = url.resolveScript({
                scriptId: 'customscript_scv_sl_lenhxuathang_print',
                deploymentId: 'customdeploy_scv_sl_lenhxuathang_print',
                returnExternalUrl: false
            });

            urlInPhieuXuatHang += `&recid=${newRecord.id}&rectype=${newRecord.type}`;

            form.addButton({
                id: 'custpage_scv_btn_in_phieu_xuat_hang_pdf',
                label: 'Lệnh xuất hàng',
                functionName: `window.open("${urlInPhieuXuatHang}", "_blank")`
            });

            return {export_type: "PDF", id: 'custpage_scv_btn_in_phieu_xuat_hang_pdf'}
        }

        const addBtnPrintPDF = (_form, _newRecord, _label, _id, _printfile) => {
            let recType = _newRecord.type;
            let createPdfUrl = url.resolveScript({
                scriptId: 'customscript_scv_sl_addition_print_pdf',
                deploymentId: 'customdeploy_scv_sl_addition_print_pdf',
                returnExternalUrl: false
            });
            createPdfUrl += '&id=' + _newRecord.id + '&type=' + recType + '&printfile=' + _printfile;
            _form.addButton({
                id: _id,
                label: _label,
                functionName: "window.open('" + createPdfUrl + "');"
            });

            return {export_type: "PDF", id: _id};
        }

        const addButtonPrint = (scriptContext, labelButton, idBtn, typePrint, dir, templateId) => {
            const urlLink = url.resolveScript({
                scriptId: `customscript_${dir}`,
                deploymentId: `customdeploy_${dir}`,
                returnExternalUrl: false,
                params: {}
            });
            let newUrlLink = `${urlLink}&recid=${scriptContext.newRecord.id}&rectype=${scriptContext.newRecord.type}&idbtn=${idBtn}&rendertype=${typePrint}&TEMPLATE=${templateId}`;
            scriptContext.form.addButton({
                id: `custpage_scv_${idBtn}_${typePrint}`,
                label: labelButton,
                functionName: `window.open("${newUrlLink}")`
            });

            return {export_type: "PDF", id: `custpage_scv_${idBtn}_${typePrint}`};
        }

        const addBtnPrintSC_EXCEL = (form, newRecord, objPrint) => {
            objPrint.btn_sc_vn = addBtnPrintExcel(form, newRecord, {
                btnId: 'custpage_btn_sc_vn_excel',
                btnName: 'SC (VN)',
                templateId: 'scv_xlsx_sales_contract_vn'
            });
            objPrint.btn_sc_en = addBtnPrintExcel(form, newRecord, {
                btnId: 'custpage_btn_sc_en_excel',
                btnName: 'SC (EN)',
                templateId: 'scv_xlsx_sales_contract_en'
            });
        }
        const addBtnPrintSD_EXCEL = (form, newRecord, objPrint) => {
            objPrint.btn_cl_excel = addBtnPrintExcel(form, newRecord, {
                btnId: 'custpage_btn_cl_excel',
                btnName: 'CL',
                templateId: 'scv_xlsx_commercial_invoice'
            });
            objPrint.btn_ic_excel = addBtnPrintExcel(form, newRecord, {
                btnId: 'custpage_btn_ic_excel',
                btnName: 'IC',
                templateId: 'scv_xlsx_insurance'
            });
            objPrint.btn_pl_excel = addBtnPrintExcel(form, newRecord, {
                btnId: 'custpage_btn_pl_excel',
                btnName: 'P\\L',
                templateId: 'scv_xlsx_packing_list'
            });
            objPrint.btn_bl_excel = addBtnPrintExcel(form, newRecord, {
                btnId: 'custpage_btn_bl_excel',
                btnName: 'B\\L',
                templateId: 'scv_xlsx_detail_bl'
            });
        }

        const addBtnPrintExcel = (form, newRec, params) => {
            try {
                let templateId = params.templateId;
                if (!form.getField('custpage_inline_html_exp_exceljs')) {
                    let htmlFile = file.load({id: '../html/scv_html_exp_exceljs.html'})
                    let htmlContent = htmlFile.getContents();
                    form.addField({
                        id: 'custpage_inline_html_exp_exceljs',
                        type: 'inlinehtml',
                        label: 'inlinehtml'
                    }).defaultValue = htmlContent;
                }
                form.addButton({
                    id: params.btnId,
                    label: params.btnName,
                    functionName: `onExport(${JSON.stringify({
                        recId: newRec.id,
                        recType: newRec.type,
                        templateId
                    })})`
                });
                return {export_type: "EXCEL", id: params.btnId};
            } catch (error) {
                log.error('error - addButtonPrintExcel', error)
            }
        }

        const getIdLctTemplate = (newRecord) => {
            let lkFieldsTemplate = search.lookupFields({
                type: newRecord.type, id: newRecord.id, columns: ['account.custrecord_scv_acc_lct_template']
            });
            
            return TemplateLenhChuyenTien[lkFieldsTemplate['account.custrecord_scv_acc_lct_template'][0]?.value]
        }

        const addBtnPrint = (scriptContext, _printFile, _entryPointFunc = 'addBtnPrint') => {
            if (!_printFile) return;
            
            let curRec = getCurrentRecord(scriptContext);

            let pathScriptPrint = constFile.getCurrentRootFolder() + `/print/${_printFile}.js`;

            require([pathScriptPrint], function (modulePrint) {
                let buttonsAdded = modulePrint[_entryPointFunc](scriptContext, curRec);
                if (util.isArray(buttonsAdded)) {
                    arrBtnPrint = arrBtnPrint.concat(buttonsAdded);
                } else if (util.isObject(buttonsAdded)) {
                    arrBtnPrint.push(buttonsAdded);
                }
            });
        };

        const getCurrentRecord = (scriptContext) => {
            let newRec = scriptContext.newRecord;
            let curRec = _currentRecord;

            if (!curRec && newRec.id) {
                _currentRecord = record.load({
                    type: newRec.type,
                    id: newRec.id,
                });

                curRec = _currentRecord;
            } else {
                curRec = newRec;
            }

            return curRec;
        };

        return {
            beforeLoad
        }
    });