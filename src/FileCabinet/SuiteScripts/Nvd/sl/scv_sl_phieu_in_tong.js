/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/encode', 'N/record', 'N/search', 'N/ui/serverWidget', 'N/runtime', 'N/format', '../lib/scv_lib_function.js',
        'N/file', 'N/render', '../lib/scv_lib_amount_in_word', '../common/scv_common_ui', '../common/scv_common_pdf', '../lib/scv_lib_report.js', '../olib/alasql/alasql.min@1.7.3.js',],

    (encode, record, search, serverWidget, runtime, format, lbf, file,
     render, lamount, comUI, comPdf, libRep, alasql) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const IdSavedSearch = {
            // Phiếu xuất kho in tổng
            // SS_PXK_TONG: 'customsearch_scv_phieu_xuat_kho_tong',
            SS_PXK_TONG_CHI_TIET: 'customsearch_scv_phieu_xuat_kho_tong_2',
            SS_PXK_HEADER: 'customsearch_scv_group_print_2',

            // Phiếu xuất bán in tổng
            SS_PXB_TONG_CHI_TIET: 'customsearch_scv_phieu_xuat_ban_tong',
            SS_PXB_HEADER: 'customsearch_scv_phieu_xuat_ban_header',
            SS_PXB_INV_DTL: 'customsearch_scv_pxb_tong_inv_detail',

            // Phiếu nhập kho in tổng
            SS_PNK_TONG: 'customsearch_scv_phieu_nhap_kho_tong',
            SS_PNK_HEADER: 'customsearch_scv_pnk_group_header',

            // Phiếu ycdc in tổng
            SS_YCDC_TONG: 'customsearch_scv_phieu_ycdc_tong',
            SS_YCDC_HEADER: 'customsearch_scv_phieu_ycdc_header',

            // Phiếu in tổng lệnh xuất hàng
            SS_LXH_TONG: 'customsearch_scv_phieu_lxh_tong',
            SS_LXH_HEADER: 'customsearch_scv_phieu_lxh_header',

            //Phiếu in lxhmbnm
            SS_LXHMBNM_TONG: 'customsearch_scv_pit_lxh',

            //Phiếu in ACP
            SS_LABEL_ACP: 'customsearch_scv_label_tem_acp',
            SS_LOT_LABEL_ACP: 'customsearch_scv_lot_label_tem_acp',
        };

        const IdPdfTemplate = {
            LXH_MBNB: 'CUSTTMPL_SCV_LXH_MBNB_PDF',
            PXB_KHONG_GIA: 'CUSTTMPL_SCV_PXB_KHONG_GIA_PDF',
            LXH: 'CUSTTMPL_SCV_LXH_PDF',
            PXK: 'CUSTTMPL_SCV_PXK_PDF',
            PNK: 'CUSTTMPL_SCV_PNK_TONG',
            PXB_CO_GIA: 'CUSTTMPL_SCV_PXB_CO_GIA_TONG',
            YCDC: 'CUSTTMPL_SCV_YCDC_TONG',
            ACP_NO_LOT: 'CUSTTMPL_LABEL_ACP_NO_LOT',
            ACP_LOT: 'CUSTTMPL_LABEL_HAVE_LOT',
        };

        const IdExcelTemplate = {
            ACP_NO_LOT: '../xls/scv_label_acp_no_lot.xlsx',
            ACP_LOT: '../xls/scv_label_acp_have_lot.xlsx'
        }

        const onRequest = (scriptContext) => {
            let params = scriptContext.request.parameters;
            let mainForm = createForm(params);
            let ssResultHeader = [];
            switch (params.select_field) {
                case "custpage_field_pxk":
                    ssResultHeader = getDataHeaderPxk(params);
                    break;
                case 'custpage_field_pxb_khong_gia':
                case 'custpage_field_pxb_co_gia':
                    ssResultHeader = getDataHeaderPxb(params);
                    break;
                case "custpage_field_pnk":
                    ssResultHeader = getDataHeaderPnk(params);
                    break;
                case 'custpage_field_ycdc':
                    ssResultHeader = getDataHeaderYcdc(params);
                    break;
                case 'custpage_field_lxh':
                    ssResultHeader = getDataHeaderLxh(params);
                    break;
                case 'custpage_field_lxh_mbnb':
                    ssResultHeader = getDataHeaderLxhMbnb(params);
                    break;
                case 'custpage_field_acp':
                    ssResultHeader = getDataHeaderAcp(params);
                    break;

                default:
                    break;
            }

            if (scriptContext.request.method === "GET") {
                fillDataSublist(mainForm.sublist, ssResultHeader, params.select_field);
                scriptContext.response.writePage(mainForm.form);

            } else if (scriptContext.request.method === "POST") {
                let objData;
                if (params.isexport === "T") {
                    if (params.export_type.startsWith("EXCEL")) {
                        switch (params.select_field) {
                            case "custpage_field_pxk":
                                objData = getExportDataPxk(ssResultHeader, params);
                                break;
                            case 'custpage_field_pxb_khong_gia':
                            case 'custpage_field_pxb_co_gia':
                                objData = getExportDataPXB(ssResultHeader, params);
                                break;
                            case "custpage_field_pnk":
                                objData = getExportDataPNK(ssResultHeader, params);
                                break;
                            case 'custpage_field_ycdc':
                                objData = getExportDataYCDC(ssResultHeader, params);
                                break;
                            case 'custpage_field_lxh':
                                objData = getExportDataLxh(ssResultHeader, params);
                                break;
                            case 'custpage_field_lxh_mbnb':
                                objData = getExportDataLxhMbnb(ssResultHeader, params);
                                break;
                            case 'custpage_field_acp':
                                objData = getExportDataAcp(ssResultHeader, params);
                                break;
                        }
                        scriptContext.response.setHeader("Content-Type", "text/plain;charset=UTF-8");
                        scriptContext.response.write({output: JSON.stringify(objData || {})});

                    } else if (params.export_type.startsWith("PDF")) {
                        if (params.select_field === 'custpage_field_lxh_mbnb') {
                            exportLxhMbnbPdf(ssResultHeader, params, scriptContext.response);
                        } else if (params.select_field === 'custpage_field_pxb_khong_gia'  ||
                            params.select_field === 'custpage_field_pxb_co_gia' ) {
                            exportPxbPdf(ssResultHeader, params, scriptContext.response);
                        } else if (params.select_field === 'custpage_field_lxh') {
                            exportLxhPdf(ssResultHeader, params, scriptContext.response);
                        } else if (params.select_field === 'custpage_field_pxk' ){
                            exportPxkPdf(ssResultHeader, params, scriptContext.response);
                        } else if (params.select_field === 'custpage_field_pnk' ){
                            exportPnkPdf(ssResultHeader, params, scriptContext.response);
                        } else if (params.select_field === 'custpage_field_ycdc' ){
                            exportYcdcPdf(ssResultHeader, params, scriptContext.response);
                        } else if (params.select_field === 'custpage_field_acp' ){
                            exportAcpPdf(ssResultHeader, params, scriptContext.response);
                        }
                    }
                }
            }
        }

        const createForm = (params) => {
            let mainForm = serverWidget.createForm({title: "Phiếu in tổng"});
            mainForm.clientScriptModulePath = '../cs/scv_cs_sl_phieu_in_tong.js';
            addButtonsToForm(mainForm, params);
            let mainGrp = addFieldGroup(mainForm, "fieldgrp_main", "Main");
            let printGrp = addFieldGroup(mainForm, "fieldgrp_print", "Print");
            let filterFields = addFilterFieldsToForm(mainForm, mainGrp, printGrp, params);
            setDefaultFilterValues(filterFields, params);
            let sublist = addSublistToForm(mainForm, mainGrp, filterFields.select_field);
            comUI.addExcelJs(mainForm);
            return {
                form: mainForm,
                sublist: sublist
            };
        }

        const addButtonsToForm = (mainForm, params) => {
            mainForm.addButton({
                id: "custpage_btn_refresh",
                label: "Refresh",
                functionName: "refreshForm()"
            });
            mainForm.addButton({
                id: "custpage_btn_search",
                label: "Search",
                functionName: "searchData()"
            });
            if (params.select_field === 'custpage_field_acp') {
                mainForm.addButton({
                    id: "custpage_btn_excel_acp_no_lot",
                    label: "Excel Label",
                    functionName: "onExport('EXCEL_ACP_NO_LOT')"
                });
                mainForm.addButton({
                    id: "custpage_btn_excel_acp_have_lot",
                    label: "Excel Tem",
                    functionName: "onExport('EXCEL_ACP_HAVE_LOT')"
                });
                mainForm.addButton({
                    id: "custpage_btn_pdf_acp_no_lot",
                    label: "Label Print",
                    functionName: "onExport('PDF_ACP_NO_LOT')"
                });
                mainForm.addButton({
                    id: "custpage_btn_pdf_acp_have_lot",
                    label: "Tem Print",
                    functionName: "onExport('PDF_ACP_HAVE_LOT')"
                });
            } else {
                mainForm.addButton({
                    id: "custpage_btn_excel",
                    label: "Excel",
                    functionName: "onExport('EXCEL')"
                });

                if (params.select_field === "custpage_field_lxh_mbnb" ||
                    params.select_field === 'custpage_field_pxb_khong_gia'  ||
                    params.select_field === "custpage_field_lxh" ||
                    params.select_field === 'custpage_field_pxk' ||
                    params.select_field === 'custpage_field_pnk' ||
                    params.select_field === 'custpage_field_pxb_co_gia' ||
                    params.select_field === 'custpage_field_ycdc'
                ) {
                    mainForm.addButton({
                        id: "custpage_btn_pdf",
                        label: "Print PDF",
                        functionName: "onExport('PDF')"
                    });
                }
            }
        }

        const addFilterFieldsToForm = (mainForm, mainGrp, printGrp, params) => {
            let filterFields = {};
            setSelectField(filterFields, mainForm, mainGrp);
            filterFields.custpage_fromdate = mainForm.addField({
                id: 'custpage_fromdate',
                type: serverWidget.FieldType.DATE,
                label: 'From Date',
                container: mainGrp.id
            }).updateLayoutType({layoutType: serverWidget.FieldLayoutType.STARTROW});
            filterFields.custpage_fromdate.isMandatory = true;
            filterFields.custpage_todate = mainForm.addField({
                id: 'custpage_todate',
                type: serverWidget.FieldType.DATE,
                label: 'To Date',
                container: mainGrp.id
            }).updateLayoutType({layoutType: serverWidget.FieldLayoutType.ENDROW});
            filterFields.custpage_todate.isMandatory = true;

            filterFields.custpage_po = mainForm.addField({
                id: 'custpage_po',
                type: serverWidget.FieldType.MULTISELECT,
                label: 'Purchase Order',
                source: 'purchaseorder',
                container: mainGrp.id
            });
            filterFields.custpage_kho_xuat = mainForm.addField({
                id: 'custpage_kho_xuat',
                type: serverWidget.FieldType.MULTISELECT,
                label: 'Kho xuất',
                source: 'location',
                container: mainGrp.id
            });
            filterFields.custpage_kho_xuat.setHelpText('Chọn kho xuất hàng. Nếu không chọn thì sẽ lấy tất cả kho nhập hàng. Dùng cho phiếu xuất kho, xuất bán, yêu cầu điều chuyển.');

            filterFields.custpage_kho_nhap = mainForm.addField({
                id: 'custpage_kho_nhap',
                type: serverWidget.FieldType.MULTISELECT,
                label: 'Kho nhập',
                source: 'location',
                container: mainGrp.id
            });
            filterFields.custpage_kho_nhap.setHelpText('Chọn kho nhập hàng. Nếu không chọn thì sẽ lấy tất cả kho nhập hàng. Dùng cho phiếu nhập kho, yêu cầu điều chuyển.');

            // filterFields.custpage_itr = mainForm.addField({
            //     id: 'custpage_itr',
            //     type: serverWidget.FieldType.SELECT,
            //     label: 'Item Receipt',
            //     source: 'itemreceipt',
            //     container: mainGrp.id
            // });
            filterFields.custpage_so = mainForm.addField({
                id: 'custpage_so',
                type: serverWidget.FieldType.MULTISELECT,
                label: 'Sales Order',
                source: 'salesorder',
                container: mainGrp.id
            });
            filterFields.custpage_so.setHelpText('Nếu không chọn thì sẽ lấy tất cả SO. Dùng cho phiếu xuất bán, lệnh xuất hàng.');
            filterFields.custpage_to = mainForm.addField({
                id: 'custpage_to',
                type: serverWidget.FieldType.MULTISELECT,
                label: 'Transfer Order',
                source: 'transferorder',
                container: mainGrp.id
            });
            filterFields.custpage_to.setHelpText('Nếu không chọn thì sẽ lấy tất cả SO. Dùng cho phiếu xuất bán, lệnh xuất hàng.');
            // filterFields.custpage_itf = mainForm.addField({
            //     id: 'custpage_itf',
            //     type: serverWidget.FieldType.SELECT,
            //     label: 'Item Fulfillment',
            //     source: 'itemfulfillment',
            //     container: mainGrp.id
            // });
            // if (params.select_field === "custpage_field_pxk") {
            //     filterFields.custpage_dfdate = mainForm.addField({
            //         id: 'custpage_dfdate',
            //         type: serverWidget.FieldType.DATE,
            //         label: 'Date BBBG',
            //         container: printGrp.id
            //     });
            // }

            return filterFields;
        }

        const setSelectField = (filterFields, mainForm, mainGrp) => {
            filterFields.select_field = mainForm.addField({
                id: "select_field",
                type: serverWidget.FieldType.SELECT,
                label: "Type",
                container: mainGrp.id
            });

            filterFields.select_field.addSelectOption({
                value: 'custpage_field_pxk', text: 'Phiếu xuất kho in tổng'
            });

            const curUser = runtime.getCurrentUser();
            const currentRole = curUser.roleId;
            const currentRoleId = curUser.id;
            const userType = getEntityType(currentRoleId);
            if (userType === 'employee' || userType === 'partner') {
                let lkFieldsRole = search.lookupFields({
                    type: userType,
                    id: currentRoleId,
                    columns: ['custentity_scv_bbgn_co_gia']
                });
                let isRoleKiemTra = lkFieldsRole.custentity_scv_bbgn_co_gia || false;

                if (isRoleKiemTra == true || currentRole === 'administrator') {
                    filterFields.select_field.addSelectOption({
                        value: 'custpage_field_pxb_co_gia', text: 'Phiếu xuất bán có giá in tổng'
                    });
                }
            }
            filterFields.select_field.addSelectOption({
                value: 'custpage_field_pxb_khong_gia', text: 'Phiếu xuất bán không giá in tổng'
            });
            filterFields.select_field.addSelectOption({
                value: 'custpage_field_pnk', text: 'Phiếu nhập kho in tổng'
            });
            filterFields.select_field.addSelectOption({
                value: 'custpage_field_ycdc', text: 'Phiếu yêu cầu điều chuyển in tổng'
            });
            filterFields.select_field.addSelectOption({
                value: 'custpage_field_lxh', text: 'Phiếu lệnh xuất hàng in tổng'
            });
            filterFields.select_field.addSelectOption({
                value: 'custpage_field_lxh_mbnb', text: 'Phiếu LXH MBNB'
            });
            filterFields.select_field.addSelectOption({
                value: 'custpage_field_acp', text: 'Label Nhóm ACP in tổng'
            });
        }

        const setDefaultFilterValues = (filterFields, params) => {
            // set default values cho những filter tương ứng
            Object.keys(filterFields).forEach((key) => {
                if (lbf.isContainValue(params[key])) {
                    if (params[key].includes(',')) {
                        filterFields[key].defaultValue = params[key].split(',');
                    } else {
                        filterFields[key].defaultValue = params[key];
                    }
                }
            });
        }

        const addSublistToForm = (mainForm, mainGrp, selectField) => {
            let slResult = mainForm.addSublist({
                id: "custpage_sl_result",
                type: serverWidget.SublistType.LIST,
                label: 'Result',
                tab: mainGrp.id
            });
            if (selectField.defaultValue === "custpage_field_pxk") {
                createSublistPxk(slResult);
                slResult.addMarkAllButtons();
            } else if (selectField.defaultValue === "custpage_field_pnk") {
                createSublistPnk(slResult);
            } else if (selectField.defaultValue === "custpage_field_pxb_co_gia" ||
                selectField.defaultValue === "custpage_field_pxb_khong_gia") {
                createSublistPxb(slResult);
            } else if (selectField.defaultValue === "custpage_field_ycdc") {
                createSublistYcdc(slResult);
            } else if (selectField.defaultValue === "custpage_field_lxh") {
                createSublistLxh(slResult);
            } else if (selectField.defaultValue === "custpage_field_lxh_mbnb") {
                createSublistLxhMbnb(slResult);
                slResult.addMarkAllButtons();
            } else if (selectField.defaultValue === "custpage_field_acp") {
                createSublistAcp(slResult);
                slResult.addMarkAllButtons();
            }
            return slResult;
        }

        const createSublistPxk = (sublist) => {
            let arrColumn = [
                {label: 'ID', type: 'text', displayType: 'hidden'},
                {label: "Select", type: "checkbox", displayType: "entry"},
                {label: "Số phiếu", type: "text"},
                {label: 'Tạo từ', type: "text"},
                {label: "Ngày giao dịch", type: "text"},
                {label: "Entity", type: "text"},
                {label: 'Địa chỉ giao', type: "text"},
                {label: "Ghi chú", type: "text"},
                {label: "Kho xuất", type: "text"},
            ];
            addColumnsToSublist(sublist, arrColumn);
        }

        const createSublistPnk = (sublist) => {
            let arrColumn = [
                {label: 'ID', type: 'text', displayType: 'hidden'},
                {label: "Select", type: "checkbox", displayType: "entry"},
                {label: "Số phiếu", type: "text"},
                {label: "Tạo từ", type: "text"},
                {label: "Ngày giao hàng", type: "text"},
                {label: "Kho nhập", type: "text"},
                {label: "Lý do nhập", type: "text"},
            ];
            addColumnsToSublist(sublist, arrColumn);
        }

        const createSublistPxb = (sublist) => {
            let arrColumn = [
                {label: 'ID', type: 'text', displayType: 'hidden'},
                {label: "Select", type: "checkbox", displayType: "entry"},
                {label: "Công ty", type: "text"},
                {label: "Số phiếu", type: "text"},
                {label: "Số đơn hàng", type: "text"},
                {label: "Ngày giao hàng", type: "text"},
                {label: "Tên đơn vị mua hàng", type: "text"},
                {label: "Người nhận", type: "text"},
            ];
            addColumnsToSublist(sublist, arrColumn);
        }

        const createSublistYcdc = (sublist) => {
            let arrColumn = [
                {label: 'ID', type: 'text', displayType: 'hidden'},
                {label: "Select", type: "checkbox", displayType: "entry"},
                {label: "Chi nhánh", type: "text"},
                {label: "Kho xuất", type: "text"},
                {label: "Kho nhập", type: "text"},
                {label: "Tên người tạo", type: "text"},
                {label: "Số chứng từ", type: "text"},
                {label: "Ngày giao dịch", type: "text"},
                {label: "Loại điều chuyển", type: "text"},
            ];
            addColumnsToSublist(sublist, arrColumn);
        }

        const createSublistLxh = (sublist) => {
            let arrColumn = [
                {label: 'ID', type: 'text', displayType: 'hidden'},
                {label: "Select", type: "checkbox", displayType: "entry"},
                {label: "Số ITF", type: "text"},
                {label: "Căn cứ vào đơn số", type: "text"},
                {label: "Khách hàng", type: "text"},
                {label: "Ngày giao dịch", type: "text"},
                {label: "Địa chỉ giao hàng", type: "text"},
                {label: "Người nhận hàng", type: "text"},
                {label: "Điện thoại", type: "text"},
                {label: "Kế hoạch giao hàng", type: "text"},
                {label: "Lý do điều chuyển", type: "text"},
            ];
            addColumnsToSublist(sublist, arrColumn);
        }

        const createSublistLxhMbnb = (sublist) => {
            let arrColumn = [
                {label: 'ID', type: 'text', displayType: 'hidden'},
                {label: "Select", type: "checkbox", displayType: "entry"},
                {label: "Căn cứ vào đơn số", type: "text"},
                {label: "Ngày giao dịch", type: "text"},
                {label: "Tên hàng hoá", type: "text"},
                {label: "Số lượng", type: "text"},
                {label: "ĐVT", type: "text"},
                {label: "Kế hoạch giao hàng", type: "text"},
                {label: "Yêu cầu đóng hàng", type: "text"},
                {label: "Ghi chú", type: "text"},
                {label: "Khách hàng", type: "text"},
                {label: "Địa chỉ giao hàng", type: "text"},
            ];
            addColumnsToSublist(sublist, arrColumn);
        }

        const createSublistAcp = (sublist) => {
            let arrColumn = [
                {label: 'ID', type: 'text', displayType: 'hidden'},
                {label: "Select", type: "checkbox", displayType: "entry"},
                {label: "Mã", type: "text"},
                {label: "Ngày nhập", type: "text"},
                {label: "Mã nhóm", type: "text"},
                {label: "Tên gọi", type: "text"},
                {label: "Seri", type: "text"},
                {label: "Lô", type: "text"},
                {label: "TL Tịnh", type: "text"},
                {label: "TL Bù", type: "text"},
                {label: "TL Lõi", type: "text"},
                {label: "Tình trạng nhóm", type: "text"},
                {label: "Đpk/Thủ kho", type: "text"},
                {label: "TP Bộ phận", type: "text"},
                {label: "Người lập", type: "text"},
            ];
            addColumnsToSublist(sublist, arrColumn);
        }

        const addColumnsToSublist = (sublist, arrColumn) => {
            for (let i = 0; i < arrColumn.length; i++) {
                sublist.addField({
                    id: "custpage_col_" + i,
                    type: arrColumn[i].type,
                    label: arrColumn[i].label
                }).updateDisplayType({displayType: arrColumn[i].displayType || "inline"});
            }
        }

        const fillDataSublist = (sublist, ssResultHeader, select_field) => {
            switch (select_field) {
                case 'custpage_field_pxk':
                    for (let i = 0; i < ssResultHeader.length; i++) {
                        setRowDataSublist(sublist, i, [
                            'custpage_col_0', "custpage_col_2", "custpage_col_3", "custpage_col_4",
                            "custpage_col_5", "custpage_col_6", "custpage_col_7", "custpage_col_8",
                            "custpage_col_9", "custpage_col_10", "custpage_col_11"
                        ], [
                            ssResultHeader[i].internalid, ssResultHeader[i].doc_no_itf, ssResultHeader[i].created_from_nm, ssResultHeader[i].date,
                            ssResultHeader[i].entity_itf, ssResultHeader[i].shipping_address, ssResultHeader[i].memo,
                            ssResultHeader[i].location_nm, ssResultHeader[i].doc_no_so, ssResultHeader[i].entity_so,
                        ]);
                    }
                    break;
                case 'custpage_field_pnk':
                    for (let i = 0; i < ssResultHeader.length; i++) {
                        setRowDataSublist(sublist, i, [
                            'custpage_col_0', "custpage_col_2", "custpage_col_3",
                            "custpage_col_4", "custpage_col_5", "custpage_col_6",


                        ], [
                            ssResultHeader[i].internalid, ssResultHeader[i].doc_no_ir, ssResultHeader[i].created_from_nm,
                            ssResultHeader[i].date, ssResultHeader[i].location_nm, ssResultHeader[i].memo,

                        ]);
                    }
                    break;
                case 'custpage_field_pxb_khong_gia':
                case 'custpage_field_pxb_co_gia':
                    for (let i = 0; i < ssResultHeader.length; i++) {
                        setRowDataSublist(sublist, i, [
                            'custpage_col_0', "custpage_col_2", "custpage_col_3", "custpage_col_4",
                            "custpage_col_5", "custpage_col_6", "custpage_col_7"
                        ], [
                            ssResultHeader[i].internalId, ssResultHeader[i].subLegalName, ssResultHeader[i].soPhieu, ssResultHeader[i].soDonHang,
                            ssResultHeader[i].ngayGiaoHang, ssResultHeader[i].tenDonViMuaHang, ssResultHeader[i].nguoiNhan
                        ]);
                    }
                    break;

                case 'custpage_field_ycdc':
                    for (let i = 0; i < ssResultHeader.length; i++) {
                        setRowDataSublist(sublist, i, [
                            'custpage_col_0', "custpage_col_2", "custpage_col_3", "custpage_col_4", "custpage_col_5",
                            "custpage_col_6", 'custpage_col_7', "custpage_col_8"
                        ], [
                            ssResultHeader[i].internalid, ssResultHeader[i].subLegalName, ssResultHeader[i].textKhoXuat,
                            ssResultHeader[i].textKhoNhan, ssResultHeader[i].tenNguoiTao, ssResultHeader[i].transferOrderNumber,
                            ssResultHeader[i].trandate, ssResultHeader[i].loaiDieuChuyen
                        ]);
                    }
                    break;

                case 'custpage_field_lxh':
                    for (let i = 0; i < ssResultHeader.length; i++) {
                        setRowDataSublist(sublist, i, [
                            'custpage_col_0', "custpage_col_2", "custpage_col_3", "custpage_col_4",
                            "custpage_col_5", "custpage_col_6", "custpage_col_7", "custpage_col_8",
                            "custpage_col_9", "custpage_col_10",
                        ], [
                            ssResultHeader[i].internalid, ssResultHeader[i].soItf, ssResultHeader[i].canCuVaoDonSo,
                            ssResultHeader[i].tenKhachHang, ssResultHeader[i].trandate, ssResultHeader[i].diaChiGiaoHang,
                            ssResultHeader[i].nguoiNhanHang, ssResultHeader[i].dienThoai,
                            ssResultHeader[i].keHoachGiaoHang, ssResultHeader[i].lyDoDieuChuyen
                        ]);
                    }
                    break;
                case 'custpage_field_lxh_mbnb':
                    for (let i = 0; i < ssResultHeader.length; i++) {
                        setRowDataSublist(sublist, i, [
                            'custpage_col_0', "custpage_col_2", "custpage_col_3", "custpage_col_4",
                            "custpage_col_5", "custpage_col_6", "custpage_col_7", "custpage_col_8",
                            "custpage_col_9", "custpage_col_10", "custpage_col_11", "custpage_col_12"
                        ], [
                            ssResultHeader[i].internalId, ssResultHeader[i].docNumber || ssResultHeader[i].internalId,
                            ssResultHeader[i].date, ssResultHeader[i].item, ssResultHeader[i].quantity || null, ssResultHeader[i].unit,
                            ssResultHeader[i].plan, ssResultHeader[i].ycdh, ssResultHeader[i].memo,
                            ssResultHeader[i].customer, ssResultHeader[i].address
                        ]);
                    }
                    break;
                case 'custpage_field_acp':
                    for (let i = 0; i < ssResultHeader.length; i++) {
                        setRowDataSublist(sublist, i, [
                            'custpage_col_0',
                            'custpage_col_2',
                            'custpage_col_3',
                            'custpage_col_4',
                            'custpage_col_5',
                            'custpage_col_6',
                            'custpage_col_7',
                            'custpage_col_8',
                            'custpage_col_9',
                            'custpage_col_10',
                            'custpage_col_11',
                            'custpage_col_12',
                            'custpage_col_13',
                            'custpage_col_14',
                        ], [
                            ssResultHeader[i].internalid,
                            ssResultHeader[i].tranid,
                            ssResultHeader[i].trandate,
                            ssResultHeader[i].upccode,
                            ssResultHeader[i].displayname,
                            ssResultHeader[i].seri,
                            ssResultHeader[i].lotnumber_display,
                            ssResultHeader[i].tl_tinh,
                            ssResultHeader[i].tlBu,
                            ssResultHeader[i].tl_loi,
                            ssResultHeader[i].status,
                            ssResultHeader[i].dieu_phoi_kho,
                            ssResultHeader[i].supervisor_display,
                            ssResultHeader[i].createdby_display
                        ]);
                    }
                    break;
            }
        }

        const getExportDataPXB = (ssResultHeader, params) => {
            let isCoGia = params.select_field === 'custpage_field_pxb_co_gia';
            let arrInternalId = params.arrInternalId.split(",");
            let arrPxbHeader = ssResultHeader.filter(e => arrInternalId.includes(e.internalId));
            let {tableData, colId} = getTableDataPXB(arrInternalId, isCoGia);
            let mappedData = getMappedDataPXB(arrPxbHeader, tableData, params);
            let urlToTemplate = params.select_field === 'custpage_field_pxb_khong_gia' ?
                file.load({id: '../xls/scv_xlsx_pxb_in_tong_khong_gia.xlsx'}).url :
                file.load({id: '../xls/scv_xlsx_pxb_in_tong_co_gia.xlsx'}).url;
            let filename = 'Phiếu xuất bán in tổng.xlsx';
            return {
                templatetype: 'excel',
                mappedData: mappedData,
                arrData: tableData,
                colId: colId,
                filename,
                url: urlToTemplate,
                idxSourceRow: 12,
                idxRowData: 13
            }
        }

        const getMappedDataPXB = (arrPxbHeader, tableData, params) => {
            let tongSoLuong = tableData.reduce((sum, item) => sum + (Number(item.soLuong) || 0), 0)
            let tongThanhTien = tableData.reduce((sum, item) => sum + (Number(item.thanhTien) || 0), 0);

            let arrInternalId = params.arrInternalId.split(",");
            arrPxbHeader = arrPxbHeader.filter(s => arrInternalId.includes(s.internalId) );

            if (params.select_field === 'custpage_field_pxb_khong_gia') {
                return {
                    'B1': {subLegalName: arrPxbHeader[0].subLegalName},
                    'B2': {subsidiaryAddress: arrPxbHeader[0].subsidiaryAddress},
                    'E3': {soPhieu: convertObjArrayToString(arrPxbHeader, "soPhieu")},
                    'E4': {soDonHang: convertObjArrayToString(arrPxbHeader, "soDonHang")},
                    'F3': {bieuMau: convertObjArrayToString(arrPxbHeader, "bieuMau")},
                    'F4': {ngayGiaoHang: convertObjArrayToString(arrPxbHeader, "ngayGiaoHang")},
                    'A6': {tenDonViMuaHang: convertObjArrayToString(arrPxbHeader, "tenDonViMuaHang")},
                    'E6': {nguoiNhan: convertObjArrayToString(arrPxbHeader, "nguoiNhan")},
                    'F6': {sdt: convertObjArrayToString(arrPxbHeader, "sdt") || ''},
                    'A7': {diaChiDonViMuaHang: convertObjArrayToString(arrPxbHeader, "diaChiDonViMuaHang")},
                    'D7': {diaChiNhanHang: convertObjArrayToString(arrPxbHeader, "diaChiNhanHang")},
                    'E8': {hinhThucVanChuyen: convertObjArrayToString(arrPxbHeader, "hinhThucVanChuyen")},
                    'F8': {bienXeKhachHang: convertObjArrayToString(arrPxbHeader, "bienXeKhachHang")},
                    'A9': {congTyNoiDungBienBan: convertObjArrayToString(arrPxbHeader, "congTyNoiDungBienBan")},
                    'D13': {tongSoLuong: tongSoLuong},
                    'A19': {
                        ngayIn: new Date().toLocaleString('en-US', {
                            timeZone: 'Asia/Ho_Chi_Minh',
                            hour12: false
                        }).replace(/(AM|PM)/, '').trim()
                    },
                    A25 : {ktGiamDoc : convertObjArrayToString(arrPxbHeader, "ktGiamDoc").split(',')[0]},
                    D25 : {thuKho: convertObjArrayToString(arrPxbHeader, "thuKho").split(',')[0]},
                    E25 : {kiemSoat: convertObjArrayToString(arrPxbHeader, "kiemSoat").split(',')[0]},
                }
            }

            if (params.select_field === 'custpage_field_pxb_co_gia') {
                return {
                    'B1': {subLegalName: arrPxbHeader[0].subLegalName},
                    'B2': {subsidiaryAddress: arrPxbHeader[0].subsidiaryAddress},
                    'F3': {soPhieu: convertObjArrayToString(arrPxbHeader, "soPhieu")},
                    'F4': {soDonHang: convertObjArrayToString(arrPxbHeader, "soDonHang")},
                    'G3': {bieuMau: convertObjArrayToString(arrPxbHeader, "bieuMau")},
                    'G4': {ngayGiaoHang: convertObjArrayToString(arrPxbHeader, "ngayGiaoHang")},
                    'A6': {tenDonViMuaHang: convertObjArrayToString(arrPxbHeader, "tenDonViMuaHang")},
                    'F6': {nguoiNhan: convertObjArrayToString(arrPxbHeader, "nguoiNhan")},
                    'G6': {sdt: convertObjArrayToString(arrPxbHeader, "sdt") || ''},
                    'A7': {diaChiDonViMuaHang: convertObjArrayToString(arrPxbHeader, "diaChiDonViMuaHang")},
                    'E7': {diaChiNhanHang: convertObjArrayToString(arrPxbHeader, "diaChiNhanHang")},
                    'G8': {
                        hinhThucVanChuyen: convertObjArrayToString(arrPxbHeader, "hinhThucVanChuyen"),
                        bienXeKhachHang: convertObjArrayToString(arrPxbHeader, "bienXeKhachHang")
                    },
                    'A9': {congTyNoiDungBienBan: convertObjArrayToString(arrPxbHeader, "congTyNoiDungBienBan")},
                    'D13': {tongSoLuong: tongSoLuong},
                    'F13': {tongThanhTien: tongThanhTien},
                    'A20': {
                        ngayIn: new Date().toLocaleString('en-US', {
                            timeZone: 'Asia/Ho_Chi_Minh',
                            hour12: false
                        }).replace(/(AM|PM)/, '').trim()
                    },
                    A26 : {ktGiamDoc : convertObjArrayToString(arrPxbHeader, "ktGiamDoc").split(',')[0]},
                    D26 : {thuKho: convertObjArrayToString(arrPxbHeader, "thuKho").split(',')[0]},
                    F26 : {kiemSoat: convertObjArrayToString(arrPxbHeader, "kiemSoat").split(',')[0]},
                }
            }
        }

        const getTableDataPXB = (arrInternalId, isCoGia) => {
            let arrPxbChiTiet = getDataPxbChiTiet(arrInternalId);
            let tableData = [];
            for (let i = 0; i < arrPxbChiTiet.length; i++) {
                tableData.push({
                    stt: i + 1,
                    tenHangHoa: arrPxbChiTiet[i].tenHangHoa,
                    donViTinh: arrPxbChiTiet[i].donViTinh,
                    soLuong: arrPxbChiTiet[i].soLuong,
                    donGia: arrPxbChiTiet[i].donGia,
                    thanhTien: arrPxbChiTiet[i].donGia * arrPxbChiTiet[i].soLuong,
                    lo: arrPxbChiTiet[i].lo,
                    ghichu: arrPxbChiTiet[i].memo
                });
            }
            let colId = isCoGia ? ['stt', 'tenHangHoa', 'donViTinh', 'soLuong', 'donGia', 'thanhTien', 'lo', 'ghiChu'] :
                ['stt', 'tenHangHoa', 'donViTinh', 'soLuong', 'lo', 'ghiChu']
            ;
            return {tableData, colId};
        }

        const getDataPxbChiTiet = (arrInternalId) => {
            let dataPxbChiTiet = [];
            let objSearch = search.load({id: IdSavedSearch.SS_PXB_TONG_CHI_TIET});
            let columns = objSearch.columns;
            let filter = objSearch.filters;

            filter.push(search.createFilter({
                name: 'internalid',
                operator: search.Operator.ANYOF,
                values: arrInternalId
            }));

            let resultData = objSearch.run().getRange(0, 1000);
            for (let i = 0; i < resultData.length; i++) {
                dataPxbChiTiet.push({
                    tenHangHoa: resultData[i].getValue(columns.find(s => s.label === 'Tên hàng hóa')),
                    donViTinh: resultData[i].getValue(columns.find(s => s.label === 'Đơn vị tính')),
                    soLuong: resultData[i].getValue(columns.find(s => s.label === 'Số lượng')),
                    donGia: resultData[i].getValue(columns.find(s => s.label === 'Đơn giá')),
                    lo: resultData[i].getText(columns.find(s => s.label === 'Lô')),
                    ghiChu: resultData[i].getText(columns.find(s => s.label === 'Ghi chú')),
                });
            }
            return dataPxbChiTiet;
        }

        const getExportDataPNK = (ssResultHeader, params) => {
            let arrInternalId = params.arrInternalId.split(",");
            arrInternalId = arrInternalId.filter((e, index) => {
                return arrInternalId.indexOf(e) === index;
            });
            let arrPNKMuaHang = [];

            for (let i = 0; i < arrInternalId.length; i++) {
                let obj_findId = ssResultHeader.find(e => e.internalid === arrInternalId[i]);
                if (!!obj_findId) {
                    arrPNKMuaHang.push(obj_findId);
                }
            }

            let arrPnkChiTiet = getDataPNKDetail(arrInternalId);
            let colId = ['stt', 'mahanghoa', 'tenhanghoa', 'dvt', 'serimau', 'lo', 'soluong', 'trangthai', 'ghichu'];
            let tableData = getTableDataPnk(arrPnkChiTiet);
            let sumQuantity = tableData.reduce((sum, s) => sum + s.soluong, 0);
            let mappedData = getMappedDataPnk(arrPNKMuaHang, sumQuantity);
            let urlToTemplate = file.load({id: '../xls/scv_xlsx_pnk_tong.xlsx'}).url;
            let filename = 'Phiếu nhập kho in tổng.xlsx';

            return {
                templatetype: 'excel',
                mappedData: mappedData,
                filename,
                url: urlToTemplate,
                arrData: tableData,
                colId: colId,
                idxSourceRow: 13,
                idxRowData: 14,
            }
        }

        const getMappedDataPnk = (arrPNKMuaHang, sumQuantity, params) => {
            let headerDocNo = groupDocNoIf(arrPNKMuaHang, params );
            let pLegalname = "";
            let pMainAddress = "";
            let pVendorLegalname = "";
            if (arrPNKMuaHang) {
                pLegalname = arrPNKMuaHang[0]?.sub_legalname;
                pMainAddress = arrPNKMuaHang[0]?.sub_address;
                pMainAddress = arrPNKMuaHang[0]?.dia_chi_kho;
                // pVendorLegalname = arrPNKMuaHang[0]?.vendor_legalname;
                pVendorLegalname = arrPNKMuaHang[0]?.nguoi_giao_hang;
            }
            return {
                'A1': {sublegalname: pLegalname},
                'A2': {mainaddress: pMainAddress},
                'E5': {trandate: convertObjArrayToString(arrPNKMuaHang, "date")},
                'E6': {docno: headerDocNo},
                'A8': {vendorlegalname: pVendorLegalname},
                'A9': {memo: convertObjArrayToString(arrPNKMuaHang, "memo")},
                'A10': {nhapkho: convertObjArrayToString(arrPNKMuaHang, "ten_kho_hang")},
                'G14': {sumQuantity: sumQuantity}
            }
        }

        const getTableDataPnk = (arrPnkChiTiet) => {
            let tableData = [];
            for (let i = 0; i < arrPnkChiTiet.length; i++) {
                tableData.push({
                    stt: i + 1,
                    mahanghoa: arrPnkChiTiet[i].upccode,
                    tenhanghoa: arrPnkChiTiet[i].description,
                    dvt: arrPnkChiTiet[i].units,
                    serimau: arrPnkChiTiet[i].serimau,
                    lo: arrPnkChiTiet[i].lo,
                    soluong: arrPnkChiTiet[i].quantity,
                    trangthai: arrPnkChiTiet[i].status,
                    ghichu: arrPnkChiTiet[i].memo
                });
            }

            return tableData;
        }

        // const onExportBBBG = (scriptContext) => {
        //     let request = scriptContext.request;
        //     let params = request.parameters;
        //     let printRender = render.create();
        //     printRender.setTemplateByScriptId("CUSTTMPL_SCV_BBBG_PHIEU_IN_TONG");
        //
        //     let arrInternalId = params.arrInternalId.split(",");
        //     arrInternalId = arrInternalId.filter((e, index) => {
        //         return arrInternalId.indexOf(e) === index
        //     });
        //     let searchResult = getSsHeaderDataBySelectField(params);
        //     let arrPXKBanHang = [];
        //     for (let i = 0; i < arrInternalId.length; i++) {
        //         let obj_findId = searchResult.find(e => e.internalid === arrInternalId[i]);
        //         if (!!obj_findId) {
        //             arrPXKBanHang.push(obj_findId);
        //         }
        //     }
        //     if (arrPXKBanHang[0].subsidiary) {
        //         let subRec = record.load({
        //             type: record.Type.SUBSIDIARY,
        //             id: arrPXKBanHang[0].subsidiary
        //         });
        //         printRender.addRecord('subsidiary', subRec);
        //     }
        //     let arrPrintPXK = getDataPrintPXK(arrInternalId);
        //     let objHeader = {
        //         date: "Ngày....tháng....năm........"
        //     };
        //     if (params.dfdate) {
        //         let splitDate = params.dfdate.split("/");
        //         objHeader.date = "Ngày " + splitDate[0] + " tháng " + splitDate[1] + " năm " + splitDate[2];
        //     }
        //     objHeader.ben_nhan = arrPXKBanHang[0].ben_nhan;
        //     objHeader.ben_giao = arrPXKBanHang[0].ben_giao;
        //     objHeader.cv_ben_giao = arrPXKBanHang[0].cv_ben_giao;
        //     objHeader.customer = arrPXKBanHang[0].cus_legalname;
        //     printRender.addCustomDataSource({
        //         format: render.DataSource.OBJECT,
        //         alias: "jsonData",
        //         data: {
        //             dataTable: arrPrintPXK,
        //             objHeader: objHeader
        //         }
        //     });
        //     let printFile = printRender.renderAsPdf();
        //     scriptContext.response.writeFile(printFile, true);
        // }

        const getExportDataPxk = (ssResultHeader, params) => {
            let isPxb = params.select_field === 'custpage_field_pxb';
            let arrInternalId = params.arrInternalId.split(",");
            // lấy các internalid không trùng nhau
            arrInternalId = arrInternalId.filter((e, index) => {
                return arrInternalId.indexOf(e) === index
            });
            log.error('arrInternalId', arrInternalId);
            let arrHeaderPhieuXuat = [];
            // chỉ lấy các id phieeus xuất kho được lựa chọn
            for (let i = 0; i < arrInternalId.length; i++) {
                let objFindId = ssResultHeader.find(e => e.internalid === arrInternalId[i]);
                if (!!objFindId) {
                    arrHeaderPhieuXuat.push(objFindId);
                }
            }
            // lấy legalname, mainaddress theo data cột đầu tiên

            // lấy data phiếu xuất kho chi tiết từ các internalid được lựa chọn
            let arrPhieuXuatChiTiet = getDataPxkChiTiet(arrInternalId);
            let colId = ['stt', 'mahanghoa', 'tenhanghoa', 'dvt', 'serimau', 'lo', 'soluong', 'trangthai', 'ghichu'];
            let tableData = getTableDataPxk(arrPhieuXuatChiTiet);
            let sumQuantity = tableData.reduce((sum, s) => sum + s.soluong, 0);
            let sumAmount = tableData.reduce((sum, s) => sum + s.thanhtien, 0);
            let khoXuat = convertObjArrayToString(arrPhieuXuatChiTiet, "location");
            let mappedData = getMappedDataPxk(arrHeaderPhieuXuat, sumQuantity, sumAmount, khoXuat,params);
            let urlToTemplate = isPxb ?
                file.load({id: '../xls/scv_xlsx_pxb_tong.xlsx'}).url :
                file.load({id: '../xls/scv_xlsx_pxk_tong.xlsx'}).url;
            let filename = isPxb ? 'Phiếu xuất bán in tổng.xlsx' : 'Phiếu xuất kho in tổng.xlsx';
            let idxSourceRow = 13;
            let idxRowData = 14;

            return {
                templatetype: 'excel',
                filename,
                url: urlToTemplate,
                mappedData: mappedData,
                arrData: tableData,
                colId: colId,
                idxSourceRow: idxSourceRow,
                idxRowData: idxRowData,
            }
        }

        const getTableDataPxk = (arrPhieuXuatChiTiet) => {
            let tableData = [];
            for (let i = 0; i < arrPhieuXuatChiTiet.length; i++) {
                tableData.push({
                    stt: i + 1,
                    mahanghoa: arrPhieuXuatChiTiet[i].upccode,
                    tenhanghoa: arrPhieuXuatChiTiet[i].description,
                    dvt: arrPhieuXuatChiTiet[i].units,
                    serimau: arrPhieuXuatChiTiet[i].serimau,
                    lo: arrPhieuXuatChiTiet[i].lo,
                    soluong: arrPhieuXuatChiTiet[i].quantity,
                    trangthai: arrPhieuXuatChiTiet[i].status,
                    ghichu: arrPhieuXuatChiTiet[i].ghichu
                });
            }
            return tableData;
        }

        const getMappedDataPxk = (arrHeaderPhieuXuat, sumQuantity, khoXuat, params) => {
            let headerDocNo = groupDocNoIf(arrHeaderPhieuXuat, params );
            let tranDate = convertObjArrayToString(arrHeaderPhieuXuat, "date");
            let docItf = convertObjArrayToString(arrHeaderPhieuXuat, "doc_no_itf");
            let xuatKho = convertObjArrayToString(arrHeaderPhieuXuat, "location_nm");
            let memo = convertObjArrayToString(arrHeaderPhieuXuat, "memo");
            let hoTenNguoiNhan = convertObjArrayToString(arrHeaderPhieuXuat, "ho_ten_nguoi_nhan");

            return {
                'A1': {legalname: arrHeaderPhieuXuat[0].sub_legalname},
                'A2': {xuatkho: arrHeaderPhieuXuat[0].dia_chi_kho},
                'E5': {trandate: tranDate},
                // 'E6': {docno: docItf,  ifnumber : ifnumber},
                'E6': {docno: headerDocNo},
                'A8': {customerlegalname: hoTenNguoiNhan},
                'A9': {memo: memo},
                'A10': {xuatkho: khoXuat},
                'G14': {sumQuantity: sumQuantity},
                'A16': {
                    ngayGioIn: new Date().toLocaleString('en-US', {
                        timeZone: 'Asia/Ho_Chi_Minh',
                        hour12: false
                    }).replace(/(AM|PM)/, '').trim()
                },
            }
        }

        const groupDocNoIf = (arrHeaderPhieuXuat,params) => {
            let resultHeaderDocIdf = '';
            if(params.export_type === 'PDF') {
                arrHeaderPhieuXuat.forEach(s => {
                    // doc_no_itf hoặc doc_no_ir
                    resultHeaderDocIdf += (s.doc_no_itf || s.doc_no_ir )+ ' (' + s.if_number + ') <br/>'
                });
            } else {
                arrHeaderPhieuXuat.forEach(s => {
                    resultHeaderDocIdf += (s.doc_no_itf || s.doc_no_ir) + ' (' + s.if_number + ')\n'
                });
            }

            return resultHeaderDocIdf;
        }

        const getExportDataYCDC = (ssResultHeader, params) => {
            let arrInternalId = params.arrInternalId.split(",");
            let arrYcdcHeader = ssResultHeader.filter(e => arrInternalId.includes(e.internalid));
            let mappedData = getMappedDataYCDC(arrYcdcHeader);
            let {tableData, colId} = getTableDataYCDC(arrInternalId);
            let urlToTemplate = file.load({id: '../xls/scv_xlsx_ycdc_in_tong.xlsx'}).url;
            let filename = 'Phiếu yêu cầu điều chuyển in tổng.xlsx';
            return {
                templatetype: 'excel',
                mappedData: mappedData,
                arrData: tableData,
                colId: colId,
                filename,
                url: urlToTemplate,
                idxSourceRow: 14,
                idxRowData: 15
            }
        }

        const getMappedDataYCDC = (arrYcdcHeader) => {
            let khoXuat = convertObjArrayToString(arrYcdcHeader, "textKhoXuat");
            let khoNhan = convertObjArrayToString(arrYcdcHeader, "textKhoNhan");
            let tenNguoiTao = convertObjArrayToString(arrYcdcHeader, "tenNguoiTao");
            let tranid = convertObjArrayToString(arrYcdcHeader, "transferOrderNumber");
            let trandate = convertObjArrayToString(arrYcdcHeader, "trandate");
            let lyDoDieuChuyen = convertObjArrayToString(arrYcdcHeader, "lyDoDieuChuyen");

            return {
                'A1': {subLegalName: arrYcdcHeader[0].subLegalName},
                'A2': {subsidiaryAddress: arrYcdcHeader[0].subsidiaryAddress},
                'E6': {trandate: trandate},
                'E7': {tranid: tranid},
                'A9': {nguoiYeuCau: tenNguoiTao},
                'A10': {lyDoDieuChuyen: lyDoDieuChuyen},
                'A11': {khoXuat: khoXuat, khoNhan: khoNhan}
            }
        }

        const getTableDataYCDC = (arrInternalId) => {
            let tableData = [];
            let dataYcdcChiTiet = getDataYcdcChiTiet(arrInternalId);

            let colId = ['stt', 'mahanghoa', 'tenhanghoa', 'dvt', 'serimau', 'lo', 'soluongyeucau', 'soluonthucnhapxuat', 'trangthai', 'ghichu'];
            for (let i = 0; i < dataYcdcChiTiet.length; i++) {
                tableData.push({
                    stt: i + 1,
                    mahanghoa: dataYcdcChiTiet[i].mahanghoa,
                    tenhanghoa: dataYcdcChiTiet[i].tenhanghoa,
                    dvt: dataYcdcChiTiet[i].dvt,
                    serimau: dataYcdcChiTiet[i].serimau,
                    lo: dataYcdcChiTiet[i].lo,
                    soluongyeucau: dataYcdcChiTiet[i].soluongyeucau,
                    soluonthucnhapxuat: dataYcdcChiTiet[i].soluonthucnhapxuat,
                    trangthai: dataYcdcChiTiet[i].trangthai,
                    ghichu: dataYcdcChiTiet[i].ghichu
                })
            }
            return {tableData, colId};
        }

        const getDataYcdcChiTiet = (arrInternalId) => {
            let dataYcdcChiTiet = [];
            let objSearch = search.load({id: IdSavedSearch.SS_YCDC_TONG});
            let columns = objSearch.columns;
            let filter = objSearch.filters;

            filter.push(search.createFilter({
                name: 'internalid',
                operator: search.Operator.ANYOF,
                values: arrInternalId
            }));

            let resultData = objSearch.run().getRange(0, 1000);
            for (let i = 0; i < resultData.length; i++) {
                dataYcdcChiTiet.push({
                    mahanghoa: resultData[i].getValue(columns.find(s => s.label === '3.Item Code')),
                    tenhanghoa: resultData[i].getValue(columns.find(s => s.label === '4.Tên Hiển Thị Item')),
                    lo: resultData[i].getText(columns.find(s => s.label === '5.Số Lô')),
                    soluongyeucau: resultData[i].getValue(columns.find(s => s.label === 'Quantity')),
                    serimau: resultData[i].getValue(columns.find(s => s.label === '7. Seri Màu')),
                    ghichu: resultData[i].getText(columns.find(s => s.label === '11.Ghi chú')),
                    dvt: resultData[i].getText(columns.find(s => s.label === '12.Đơn vị tính')),
                    // trangthai: resultData[i].getText(columns.find(s => s.label === '13.Trạng thái')),
                });
            }
            return dataYcdcChiTiet;
        }

        const getExportDataLxh = (ssResultHeader, params) => {
            let arrInternalId = params.arrInternalId.split(",");
            let arrLxh = ssResultHeader.filter(e => arrInternalId.includes(e.internalid));
            let {tableData, colId} = getTableDataLxh(arrInternalId);
            let mappedData = getMappedDataLxh(arrLxh, tableData);
            let urlToTemplate = file.load({id: '../xls/scv_xlsx_lxh_in_tong.xlsx'}).url;
            let filename = 'Phiếu lệnh xuất hàng in tổng.xlsx';
            return {
                templatetype: 'excel',
                mappedData: mappedData,
                arrData: tableData,
                colId: colId,
                filename,
                url: urlToTemplate,
                idxSourceRow: 12,
                idxRowData: 13
            }
        }

        const getMappedDataLxh = (arrLxhHeader, tableData) => {
            let totalQuantity = tableData.reduce((sum, item) => sum + (Number(item.soLuong) || 0), 0)

            let tranid = convertObjArrayToString(arrLxhHeader, "soItf");
            let trandate = convertObjArrayToString(arrLxhHeader, "trandate");
            let tenKhachHang = convertObjArrayToString(arrLxhHeader, "tenKhachHang");
            let diaChiGiaoHang = convertObjArrayToString(arrLxhHeader, "diaChiGiaoHang");
            let nguoiNhanHang = convertObjArrayToString(arrLxhHeader, "nguoiNhanHang");
            let dienThoai = convertObjArrayToString(arrLxhHeader, "dienThoai");
            let keHoachGiaoHang = convertObjArrayToString(arrLxhHeader, "keHoachGiaoHang");
            let nguoiLap = convertObjArrayToString(arrLxhHeader, "nguoiLap").split(',')[0];
            let thuKho = convertObjArrayToString(arrLxhHeader, "thuKho").split(',')[0];
            let gioIn = new Date().toLocaleString('en-US', {timeZone: 'Asia/Ho_Chi_Minh'});

            return {
                'D4': {tranid: tranid},
                'A5': {canCuVaoDonSo: arrLxhHeader[0].canCuVaoDonSo},
                'D5': {trandate: trandate},
                'A6': {tenKhachHang: tenKhachHang},
                'A7': {diaChiGiaoHang: diaChiGiaoHang},
                'A8': {nguoiNhanHang: nguoiNhanHang},
                'D8': {dienThoai: dienThoai},
                'B15': {gioIn: gioIn},
                'A16': {keHoachGiaoHang: keHoachGiaoHang},
                'D13': {tongSoLuong: totalQuantity},
                C20: {nguoiLap: nguoiLap},
                E20 : {thuKho: thuKho}
            }
        }

        const getTableDataLxh = (arrInternalId) => {
            let tableData = [];
            let dataLxhChiTiet = getDataLxhChiTiet(arrInternalId);

            let colId = ['stt', 'tenHangHoa', 'donViTinh', 'soLuong', 'yeuCauDongHang', 'loKeHoach', 'LoThucTe', 'ghiChu'];
            for (let i = 0; i < dataLxhChiTiet.length; i++) {
                tableData.push({
                    stt: i + 1,
                    tenHangHoa: dataLxhChiTiet[i].tenHangHoa,
                    donViTinh: dataLxhChiTiet[i].donViTinh,
                    soLuong: dataLxhChiTiet[i].soLuong,
                    yeuCauDongHang: dataLxhChiTiet[i].yeuCauDongHang,
                    loKeHoach: dataLxhChiTiet[i].loKeHoach,
                    //LoThucTe: dataLxhChiTiet[i].LoThucTe,  để trống cho khách điền
                    ghiChu: dataLxhChiTiet[i].ghiChu,
                });
            }
            return {tableData, colId};
        }

        const getExportDataLxhMbnb = (ssResultHeader, params) => {
            let arrInternalId = params.arrInternalId.split(",");
            let arrSelectedTranLines = JSON.parse(decodeURIComponent(params.arrSelectedTranLines));
            let dataLxhMbnbDeail = [];
            arrSelectedTranLines.forEach(filterItem => {
                const matched = ssResultHeader.filter(e =>
                    e.internalId === filterItem.custpage_col_0 &&
                    e.docNumber === filterItem.custpage_col_2 &&
                    e.item === filterItem.custpage_col_4 &&
                    e.quantity === filterItem.custpage_col_5
                );
                dataLxhMbnbDeail.push(...matched);
            });
            let arrLxhMbnb = ssResultHeader.filter(e => arrInternalId.includes(e.internalId));
            let {tableData, colId} = getTableDataLxhMbnb(dataLxhMbnbDeail);
            let mappedData = getMappedDataLxhMbnb(arrLxhMbnb, tableData);
            let urlToTemplate = file.load({id: '../xls/scv_xlsx_lxh_mbnb.xlsx'}).url;
            let filename = 'Phiếu lệnh xuất hàng MBNB.xlsx';
            return {
                templatetype: 'excel',
                mappedData: mappedData,
                arrData: tableData,
                colId: colId,
                filename,
                url: urlToTemplate,
                idxSourceRow: 12,
                idxRowData: 13
            }
        };

        const getMappedDataLxhMbnb = (arrLxhHeader, tableData) => {
            let totalQuantity = tableData.reduce((sum, item) => sum + (Number(item.soLuong) || 0), 0);
            const docNumbers = [
                ...new Set(
                    arrLxhHeader
                        .map(h => h.docNumber || h.internalId) // lấy mã
                        .filter(Boolean)                       // bỏ null/undefined/""
                )
            ].join(", ");

            let date = convertObjArrayToString(arrLxhHeader, "date");
            let customer = convertObjArrayToString(arrLxhHeader, "customer");
            let address = convertObjArrayToString(arrLxhHeader, "address");
            let receiver = convertObjArrayToString(arrLxhHeader, "receiver");
            let phone = convertObjArrayToString(arrLxhHeader, "phone");
            let plan = convertObjArrayToString(arrLxhHeader, "plan");
            let soXe = convertObjArrayToString(arrLxhHeader, "soXe");
            let taiXe = convertObjArrayToString(arrLxhHeader, "taiXe");
            let phuXe = convertObjArrayToString(arrLxhHeader, "phuXe");
            let gioIn = new Date().toLocaleString('en-US', {timeZone: 'Asia/Ho_Chi_Minh'});

            return {
                'D2': {tranid: ''},
                'A4': {canCuVaoDonSo: docNumbers},
                'B5': {trandate: date},
                'A6': {tenKhachHang: customer},
                'A7': {diaChiGiaoHang: address},
                'A8': {nguoiNhanHang: receiver},
                'D8': {dienThoai: phone},
                'B15': {gioIn: gioIn},
                'A16': {keHoachGiaoHang: plan},
                'D13': {tongSoLuong: totalQuantity},
                'A18': {soXe: soXe},
                'B19': {taiXe: taiXe},
                'B20': {phuXe: phuXe},
            }
        }

        const getTableDataLxhMbnb = (dataLxhMbnbDetail) => {
            let tableData = [];
            let quantityTotal = 0;
            let colId = ['stt', 'tenHangHoa', 'donViTinh', 'soLuong', 'yeuCauDongHang', 'loKeHoach', 'LoThucTe', 'ghiChu'];
            for (let i = 0; i < dataLxhMbnbDetail.length; i++) {
                tableData.push({
                    stt: i + 1,
                    tenHangHoa: dataLxhMbnbDetail[i].item,
                    donViTinh: dataLxhMbnbDetail[i].unit,
                    soLuong: dataLxhMbnbDetail[i].quantity,
                    yeuCauDongHang: dataLxhMbnbDetail[i].ycdh,
                    // loKeHoach: dataLxhMbnbDeail[i].loKeHoach,
                    //LoThucTe: dataLxhChiTiet[i].LoThucTe,  để trống cho khách điền
                    ghiChu: dataLxhMbnbDetail[i].memo,
                });
                quantityTotal += Number(dataLxhMbnbDetail[i].quantity || 0);
            }
            return {tableData, colId, quantityTotal};
        };

        const getExportDataAcp = (ssResultHeader, params) => {
            let selectedLines = [];

            if (params.arrSelectedTranLines) {
                let arrSelectedLines = JSON.parse(decodeURIComponent(params.arrSelectedTranLines)).map(line => ({
                    id: line.custpage_col_0,
                    tranId: line.custpage_col_2,
                    upcCode: line.custpage_col_4,
                    displayName: line.custpage_col_5,
                    seri: line.custpage_col_6,
                    lot: line.custpage_col_7,
                }));
                const createKey = (obj) => {
                    const lotValue = obj.lot || '';
                    return [obj.id, obj.tranId, obj.upcCode, obj.displayName, obj.seri, lotValue].join('||');
                };
                const selectedKeys = new Set(arrSelectedLines.map(createKey));

                selectedLines = ssResultHeader.filter((item) => {
                    const itemKey = [
                        item.internalid,
                        item.tranid,
                        item.upccode,
                        item.displayname,
                        item.seri,
                        (item.lotnumber_display || '')
                    ].join('||');
                    return selectedKeys.has(itemKey);
                });

            } else {
                selectedLines = ssResultHeader;
            }
            let {tableData, colId} = getTableDataAcp(selectedLines);
            let urlToTemplate;
            if(params.export_type === 'EXCEL_ACP_NO_LOT') {
                urlToTemplate = file.load({id: IdExcelTemplate.ACP_NO_LOT}).url;
            } else {
                urlToTemplate = file.load({id: IdExcelTemplate.ACP_LOT}).url;
            }
            let filename = 'Label_Nhom_ACP.xlsx';

            const logoBase64 = getImageLogo();

            return {
                templatetype: 'excel',
                mappedData: [],
                arrData: tableData,
                colId: colId,
                filename: filename,
                url: urlToTemplate,
                type: 'ACP',
                logoBase64: logoBase64
            }
        }

        const getImageLogo = () => {
            const LOGO_FILE_ID = 1;

            try {
                const logoFile = file.load({
                    id: LOGO_FILE_ID
                });
                return logoFile.getContents();
            } catch (e) {
                log.error('Không thể tải file logo', 'File ID: ' + LOGO_FILE_ID + ' | Lỗi: ' + e.message);
            }
        }

        const getTableDataAcp = (data) => {
            let tableData = [];
            let colId = ['ngayNhap', 'maNhom', 'tenGoi', 'seri', 'lo', 'tlTinh', 'tlBu', 'tlLoi', 'tinhTrangNhom', 'dpkThuKho', 'tpBoPhan', 'nguoiLap'];
            for (let i = 0; i < data.length; i++) {
                tableData.push({
                    ngayNhap: data[i].trandate,
                    maNhom: data[i].upccode,
                    tenGoi: data[i].displayname,
                    seri: data[i].seri,
                    lo: data[i].lotnumber,
                    tlTinh: data[i].tl_tinh,
                    tlBu: data[i].tlBu,
                    tlLoi: data[i].tl_loi,
                    tinhTrangNhom: data[i].status,
                    dpkThuKho: data[i].dieu_phoi_kho,
                    tpBoPhan: data[i].supervisor_display,
                    nguoiLap: data[i].createdby_display
                });
            }
            return { tableData, colId };
        }

        const getDataLxhChiTiet = (arrInternalId) => {
            let dataLxhChiTiet = [];
            let objSearch = search.load({id: IdSavedSearch.SS_LXH_TONG});
            let columns = objSearch.columns;
            let filter = objSearch.filters;

            filter.push(search.createFilter({
                name: 'internalid',
                operator: search.Operator.ANYOF,
                values: arrInternalId
            }));

            let resultData = objSearch.run().getRange(0, 1000);
            for (let i = 0; i < resultData.length; i++) {
                let isItemLv2 = resultData[i].getValue(columns.find(s => s.label === '9.Nhóm cấp 2')) === '46';
                dataLxhChiTiet.push({
                    stt: i + 1,
                    soChungTu: resultData[i].getValue(columns.find(s => s.label === '1.Số chứng từ')),
                    ngayGiaodich: resultData[i].getValue(columns.find(s => s.label === '2.Ngày giao dịch')),
                    tenHangHoa: resultData[i].getValue(columns.find(s => s.label === '3.Tên hàng hóa')),
                    donViTinh: resultData[i].getText(columns.find(s => s.label === '4.Đơn vị tính')),
                    soLuong: resultData[i].getValue(columns.find(s => s.label === 'Số lượng')),
                    yeuCauDongHang: resultData[i].getText(columns.find(s => s.label === '6.Yêu cầu đóng hàng')),
                    loKeHoach: resultData[i].getText(columns.find(s => s.label === '7.Lô (kế hoạch)')),
                    ghiChu: resultData[i].getText(columns.find(s => s.label === '8.Ghi chú')),
                    isbold : isItemLv2 ? 'class="bold"' : ''
                });
            }
            log.error('dataLxhChiTiet', dataLxhChiTiet);
            return dataLxhChiTiet;
        }

        const getDataHeaderYcdc = (params) => {
            let resultSearch = search.load(IdSavedSearch.SS_YCDC_HEADER);
            let myFilter = resultSearch.filters;
            let columns = resultSearch.columns;

            if (lbf.isContainValue(params.custpage_fromdate)) {
                myFilter.push(search.createFilter({
                    name: 'trandate',
                    operator: search.Operator.ONORAFTER,
                    values: params.custpage_fromdate
                }));
            }
            if (lbf.isContainValue(params.custpage_todate)) {
                myFilter.push(search.createFilter({
                    name: 'trandate',
                    operator: search.Operator.ONORBEFORE,
                    values: params.custpage_todate
                }));
            }
            if (lbf.isContainValue(params.custpage_kho_xuat)) {
                myFilter.push(search.createFilter({
                    name: 'location',
                    operator: search.Operator.ANYOF,
                    values: params.custpage_kho_xuat.split(',')
                }));
            }
            if (lbf.isContainValue(params.custpage_kho_nhan)) {
                myFilter.push(search.createFilter({
                    name: 'location',
                    operator: search.Operator.ANYOF,
                    values: params.custpage_kho_nhan
                }));
            }
            resultSearch = resultSearch.run().getRange({start: 0, end: 1000});
            let arrResult = [];
            for (let i = 0; i < resultSearch.length; i++) {
                let obj = {};
                obj.subLegalName = resultSearch[i].getValue(columns.find(e => e.label === '1.Sub Legal Name'));
                obj.address = resultSearch[i].getValue(columns.find(e => e.label === '2.Address'));
                obj.trandate = resultSearch[i].getValue(columns.find(e => e.label === '3.Trandate'));
                obj.transferOrderNumber = resultSearch[i].getValue(columns.find(e => e.label === '4.Transfer Order Number'));
                obj.nguoiTao = resultSearch[i].getValue(columns.find(e => e.label === '5.Người tạo'));
                obj.idKhoXuat = resultSearch[i].getValue(columns.find(e => e.label === '6.Kho xuất'));
                obj.textKhoXuat = resultSearch[i].getText(columns.find(e => e.label === '6.Kho xuất'));
                obj.lyDoDieuChuyen = resultSearch[i].getValue(columns.find(e => e.label === '7.Lý do điều chuyển'));
                obj.idKhoNhan = resultSearch[i].getValue(columns.find(e => e.label === '8.Kho nhận'));
                obj.textKhoNhan = resultSearch[i].getText(columns.find(e => e.label === '8.Kho nhận'));
                obj.tenNguoiTao = resultSearch[i].getValue(columns.find(e => e.label === '9.Tên người tạo'));
                obj.internalid = resultSearch[i].getValue(columns.find(e => e.label === '10.Internal ID'));
                obj.subsidiaryAddress = resultSearch[i].getValue(columns.find(e => e.label === '11.Subsidiary Address'));
                obj.loaiDieuChuyen = resultSearch[i].getText(columns.find(e => e.label === '12.Loại điều chuyển'));

                arrResult.push(obj);
            }
            arrResult.sort((a, b) => {
                if (a.textKhoXuat < b.textKhoXuat) return -1;
                if (a.textKhoXuat > b.textKhoXuat) return 1;
                if (a.textKhoNhan < b.textKhoNhan) return -1;
                if (a.textKhoNhan > b.textKhoNhan) return 1;
                if (a.loaiDieuChuyen < b.loaiDieuChuyen) return -1;
                if (a.loaiDieuChuyen > b.loaiDieuChuyen) return 1;
                return 0;
            });

            return arrResult;
        }

        const getDataHeaderLxh = (params) => {
            let resultSearch = search.load(IdSavedSearch.SS_LXH_HEADER);
            let myFilter = resultSearch.filters;
            let columns = resultSearch.columns;

            if (lbf.isContainValue(params.custpage_fromdate)) {
                myFilter.push(search.createFilter({
                    name: 'trandate',
                    operator: search.Operator.ONORAFTER,
                    values: params.custpage_fromdate
                }));
            }
            if (lbf.isContainValue(params.custpage_todate)) {
                myFilter.push(search.createFilter({
                    name: 'trandate',
                    operator: search.Operator.ONORBEFORE,
                    values: params.custpage_todate
                }));
            }
            if (lbf.isContainValue(params.custpage_so)) {
                myFilter.push(search.createFilter({
                    name: 'createdfrom',
                    operator: search.Operator.ANYOF,
                    values: params.custpage_so.split(',')
                }));
            }

            resultSearch = resultSearch.run().getRange({start: 0, end: 1000});
            let arrResult = [];
            for (let i = 0; i < resultSearch.length; i++) {
                let obj = {};
                obj.soItf = resultSearch[i].getValue(columns.find(e => e.label === '1.Số ITF'));
                obj.canCuVaoDonSo = resultSearch[i].getValue(columns.find(e => e.label === '2.Căn cứ vào đơn số'));
                obj.tenKhachHang = resultSearch[i].getValue(columns.find(e => e.label === '3.Tên khách hàng'));
                obj.trandate = resultSearch[i].getValue(columns.find(e => e.label === '4.Trandate'));
                obj.diaChiGiaoHang = resultSearch[i].getValue(columns.find(e => e.label === '5.Địa chỉ giao hàng'));
                obj.nguoiNhanHang = resultSearch[i].getValue(columns.find(e => e.label === '8.Người nhận hàng'));
                obj.dienThoai = resultSearch[i].getValue(columns.find(e => e.label === '9.Điện thoại'));
                obj.keHoachGiaoHang = resultSearch[i].getValue(columns.find(e => e.label === '11.Kế hoạch giao hàng'));
                obj.lyDoDieuChuyen = resultSearch[i].getValue(columns.find(e => e.label === '12.Lý do điều chuyển'));
                obj.internalid = resultSearch[i].getValue(columns.find(e => e.label === '13.Internal ID'));
                obj.pheduyet = resultSearch[i].getValue(columns.find(e => e.label === '14.Phê duyệt'));
                obj.ngayduyet = resultSearch[i].getValue(columns.find(e => e.label === '15.Ngày duyệt'));
                obj.thuKho = resultSearch[i].getValue(columns.find(e => e.label === '16.Thủ kho'));
                obj.nguoiLap = resultSearch[i].getText(columns.find(e => e.label === '17. Người lập'));
                obj.ngayLap = resultSearch[i].getValue(columns.find(e => e.label === '18.Ngày lập'));
                arrResult.push(obj);
            }
            return arrResult;
        }

        const getDataHeaderLxhMbnb = (params) => {
            let resultSearch = search.load(IdSavedSearch.SS_LXHMBNM_TONG);
            let myFilter = resultSearch.filters;
            let columns = resultSearch.columns;

            if (lbf.isContainValue(params.custpage_fromdate)) {
                myFilter.push(search.createFilter({
                    name: 'trandate',
                    operator: search.Operator.ONORAFTER,
                    values: params.custpage_fromdate
                }));
            }
            if (lbf.isContainValue(params.custpage_todate)) {
                myFilter.push(search.createFilter({
                    name: 'trandate',
                    operator: search.Operator.ONORBEFORE,
                    values: params.custpage_todate
                }));
            }
            if (lbf.isContainValue(params.custpage_so)) {
                myFilter.unshift(search.createFilter({
                    name: 'internalid',
                    operator: search.Operator.ANYOF,
                    values: params.custpage_so.split(',')
                }));
            }
            resultSearch = resultSearch.run().getRange({start: 0, end: 1000});
            let arrResult = [];
            for (let i = 0; i < resultSearch.length; i++) {
                let obj = {};
                obj.date = resultSearch[i].getValue(columns.find(e => e.label === 'SS1: Date'));
                obj.docNumber = resultSearch[i].getValue(columns.find(e => e.label === 'SS1: Document number'));
                obj.internalId = resultSearch[i].getValue(columns.find(e => e.label === 'SS1: ID'));
                obj.customer = resultSearch[i].getValue(columns.find(e => e.label === 'SS1: Customer'));
                obj.customerId = resultSearch[i].getValue(columns.find(e => e.label === 'SS1: Customer ID'));
                obj.address = resultSearch[i].getValue(columns.find(e => e.label === 'SS1: Address'));
                obj.receiver = resultSearch[i].getValue(columns.find(e => e.label === 'SS1: Receiver'));
                obj.phone = resultSearch[i].getValue(columns.find(e => e.label === 'SS1: Phone'));
                obj.plan = resultSearch[i].getValue(columns.find(e => e.label === 'SS1: Plan'));
                obj.item = resultSearch[i].getValue(columns.find(e => e.label === 'SS1: Item'));
                obj.unit = resultSearch[i].getValue(columns.find(e => e.label === 'SS1: Unit'));
                obj.quantity = resultSearch[i].getValue(columns.find(e => e.label === 'SS1: Quantity'));
                obj.ycdh = resultSearch[i].getValue(columns.find(e => e.label === 'SS1: YCĐH'));
                obj.memo = resultSearch[i].getValue(columns.find(e => e.label === 'SS1: Memo'));
                obj.soXe = resultSearch[i].getValue(columns.find(e => e.label === 'SS1: Số xe Việt Dũng'));
                obj.taiXe = resultSearch[i].getValue(columns.find(e => e.label === 'SS1: Tài xế'));
                obj.phuXe = resultSearch[i].getValue(columns.find(e => e.label === 'SS1: Phụ xe'));
                arrResult.push(obj);
            }
            return arrResult;
        }

        const getDataHeaderAcp = (params) => {
            let arrResult = [];
            if (!params.custpage_fromdate || !params.custpage_todate) return arrResult;

            // SS1
            const dataLabelAcp = [];
            const labelAcpFitler = [];
            labelAcpFitler.push(search.createFilter({ name: 'trandate', operator: search.Operator.ONORAFTER, values: params.custpage_fromdate }));
            labelAcpFitler.push(search.createFilter({ name: 'trandate', operator: search.Operator.ONORBEFORE, values: params.custpage_todate }));
            if (lbf.isContainValue(params.custpage_kho_nhap)) {
                labelAcpFitler.push(search.createFilter({ name: 'location', operator: search.Operator.ANYOF, values: params.custpage_kho_nhap.split(',') }));
            }
            libRep.doSearchSSRangeLabelId(IdSavedSearch.SS_LABEL_ACP, 1000, dataLabelAcp, labelAcpFitler);
            if (dataLabelAcp.length === 0) return [];

            // SS2
            const dataLotLabelAcp = [];
            const lotLabelAcpFilter = [];
            if (lbf.isContainValue(params.custpage_kho_nhap)) {
                lotLabelAcpFilter.push(search.createFilter({ name: 'location', operator: search.Operator.ANYOF, values: params.custpage_kho_nhap.split(',') }));
            }
            libRep.doSearchSSRangeLabelId(IdSavedSearch.SS_LOT_LABEL_ACP, 1000, dataLotLabelAcp, lotLabelAcpFilter);
            log.error('dataLotLabelAcp', dataLotLabelAcp)

            const joined = alasql(`
                SELECT
                  s1.*,
                  s2.seri           AS seri2,
                  s2.tl_loi         AS tl_loi2,
                  s2.number         AS lotnumber2
                FROM ? AS s1
                LEFT JOIN ? AS s2
                  ON s1.upccode = s2.upccode
                 AND COALESCE(s1.lotnumber_display,'') = COALESCE(s2.number,'')
              `, [dataLabelAcp, dataLotLabelAcp]);

            log.error('joined', joined);
            arrResult = joined.map(r => ({
                internalid        : r.internalid,
                tranid            : r.tranid,
                trandate          : r.trandate,
                upccode           : r.upccode,
                displayname       : r.displayname,
                seri              : r.seri2,            // ưu tiên ss2
                lotnumber         : r.lotnumber,
                lotnumber_display : r.lotnumber_display,
                tl_tinh           : r.tl_tinh || '',
                tlBu              : r.tlBu || '',                       // chưa có từ ss2
                tl_loi            : r.tl_loi2,
                status            : r.status || '',
                dieu_phoi_kho     : r.dieu_phoi_kho || '',
                supervisor_display: r.supervisor_display || '',
                createdby_display : r.createdby_display || ''
            }));

            return arrResult;
        };

        // lấy data header của các phiếu xuất kho có chi tiết ( loại các phiếu xuất kho không có chi tiết )
        const getDataHeaderPxk = (params) => {
            let resultSearch = search.load(IdSavedSearch.SS_PXK_HEADER);
            let myColumns = resultSearch.columns;
            let myFilter = resultSearch.filters;

            if (lbf.isContainValue(params.custpage_fromdate)) {
                myFilter.push(search.createFilter({
                    name: 'trandate',
                    operator: search.Operator.ONORAFTER,
                    values: params.custpage_fromdate
                }));
            }
            if (lbf.isContainValue(params.custpage_todate)) {
                myFilter.push(search.createFilter({
                    name: 'trandate',
                    operator: search.Operator.ONORBEFORE,
                    values: params.custpage_todate
                }));
            }
            if (lbf.isContainValue(params.custpage_kho_xuat)) {
                myFilter.push(search.createFilter({
                    name: 'location',
                    operator: search.Operator.ANYOF,
                    values: params.custpage_kho_xuat.split(',')
                }));
            }

            if( lbf.isContainValue(params.custpage_to)) {
                myFilter.push(search.createFilter({
                    name: 'createdfrom',
                    operator: search.Operator.ANYOF,
                    values: params.custpage_to.split(',')
                }));
            }

            resultSearch = resultSearch.run().getRange({start: 0, end: 1000});
            let arrResult = [];
            for (let i = 0; i < resultSearch.length; i++) {
                let obj = {};
                obj.doc_no_itf = resultSearch[i].getValue(myColumns[0]);
                obj.created_from_id = resultSearch[i].getValue(myColumns[1]);
                obj.created_from_nm = resultSearch[i].getText(myColumns[1]);
                obj.date = resultSearch[i].getValue(myColumns[2]);
                obj.entity_itf = resultSearch[i].getText(myColumns[3]);
                obj.shipping_address = resultSearch[i].getValue(myColumns[4]);
                obj.memo = replaceNoneValue(resultSearch[i].getValue(myColumns[5]));
                obj.location_id = resultSearch[i].getValue(myColumns[6]);
                obj.location_nm = resultSearch[i].getText(myColumns[6]);
                obj.internalid = resultSearch[i].getValue(myColumns[7]);
                obj.doc_no_so = resultSearch[i].getValue(myColumns[8]);
                obj.entity_so = resultSearch[i].getText(myColumns[9]);
                obj.entity_so_id = resultSearch[i].getValue(myColumns[9]);
                obj.sub_legalname = resultSearch[i].getValue(myColumns[10]);
                obj.sub_address = resultSearch[i].getValue(myColumns[11]);
                obj.cus_legalname = resultSearch[i].getValue(myColumns[12]);
                obj.cus_address = resultSearch[i].getValue(myColumns[13]);
                obj.xuat_kho = replaceNoneValue(resultSearch[i].getValue(myColumns[16]));
                let po_no = resultSearch[i].getValue(myColumns[14]);
                obj.po_no = (!po_no || po_no === "- None -") ? "" : po_no;
                obj.po_date = resultSearch[i].getValue(myColumns[15]);
                obj.currency = resultSearch[i].getText(myColumns[19]);
                obj.subsidiary = resultSearch[i].getValue(myColumns[27]);
                obj.ben_nhan = resultSearch[i].getValue(myColumns[24]);
                obj.ben_giao = resultSearch[i].getValue(myColumns[25]);
                obj.cv_ben_giao = resultSearch[i].getValue(myColumns[26]);
                obj.ho_ten_nguoi_nhan = replaceNoneValue(resultSearch[i].getValue(myColumns[28]));
                obj.dia_chi_kho = resultSearch[i].getValue(myColumns.find(s=> s.label === 'Địa chỉ kho'));
                obj.if_number = resultSearch[i].getValue(myColumns.find(s=> s.label === 'IF Number'));
                arrResult.push(obj);
            }

            return arrResult;
        }

        const getDataHeaderPxb = (params) => {
            let resultSearch = search.load(IdSavedSearch.SS_PXB_HEADER);
            let myColumns = resultSearch.columns;
            let myFilter = resultSearch.filters;

            if (lbf.isContainValue(params.custpage_fromdate)) {
                myFilter.push(search.createFilter({
                    name: 'trandate',
                    operator: search.Operator.ONORAFTER,
                    values: params.custpage_fromdate
                }));
            }
            if (lbf.isContainValue(params.custpage_todate)) {
                myFilter.push(search.createFilter({
                    name: 'trandate',
                    operator: search.Operator.ONORBEFORE,
                    values: params.custpage_todate
                }));
            }
            if (lbf.isContainValue(params.custpage_kho_xuat)) {
                myFilter.push(search.createFilter({
                    name: 'location',
                    operator: search.Operator.ANYOF,
                    values: params.custpage_kho_xuat.split(',')
                }));
            }
            if (lbf.isContainValue(params.custpage_so)) {
                myFilter.push(search.createFilter({
                    name: 'createdfrom',
                    operator: search.Operator.ANYOF,
                    values: params.custpage_so.split(',')
                }));
            }

            resultSearch = resultSearch.run().getRange({start: 0, end: 1000});
            let arrResult = [];
            for (let i = 0; i < resultSearch.length; i++) {
                arrResult.push({
                    internalId: resultSearch[i].getValue(myColumns.find(e => e.label === 'Internal ID')),
                    subLegalName: resultSearch[i].getValue(myColumns.find(e => e.label === 'Sub Legal Name')),
                    subsidiaryAddress: resultSearch[i].getValue(myColumns.find(e => e.label === 'Subsidiary Address')).replace('NM2', '<br/>NM2'),
                    soPhieu: resultSearch[i].getValue(myColumns.find(e => e.label === 'Số phiếu')),
                    soDonHang: resultSearch[i].getValue(myColumns.find(e => e.label === 'Số đơn hàng')),
                    bieuMau: resultSearch[i].getValue(myColumns.find(e => e.label === 'Biểu mẫu')),
                    ngayGiaoHang: resultSearch[i].getValue(myColumns.find(e => e.label === 'Ngày giao hàng')),
                    tenDonViMuaHang: resultSearch[i].getValue(myColumns.find(e => e.label === 'Tên đơn vị mua hàng')),
                    diaChiDonViMuaHang: resultSearch[i].getValue(myColumns.find(e => e.label === 'Địa chỉ đơn vị mua hàng')),
                    lyDoXuatKho: resultSearch[i].getValue(myColumns.find(e => e.label === 'Lý do xuất kho')),
                    nguoiNhan: resultSearch[i].getValue(myColumns.find(e => e.label === 'Người nhận')),
                    sdtNguoiNhan: resultSearch[i].getValue(myColumns.find(e => e.label === 'SDT ng nhận')),
                    diaChiNhanHang: resultSearch[i].getValue(myColumns.find(e => e.label === 'Địa chỉ giao hàng')),
                    hinhThucVanChuyen: resultSearch[i].getText(myColumns.find(e => e.label === 'Hình thức vận chuyển')),
                    bienXeKhachHang: resultSearch[i].getValue(myColumns.find(e => e.label === 'BKS (Biển xe khách hàng)')),

                    // Thanh Dev edit 4/8/2025
                    ktGiamDoc: resultSearch[i].getValue(myColumns.find(e => e.label === 'KT. GIÁM ĐỐC')),
                    kiemSoat: resultSearch[i].getValue(myColumns.find(e => e.label === ' KIỂM SOÁT')),
                    thuKho: resultSearch[i].getValue(myColumns.find(e => e.label === 'THỦ KHO')),
                });
            }

            return arrResult;
        }

        const getDataHeaderPnk = (params) => {
            let arrResult = [];
            let arrHeaderPNK = getHeaderPNK(params);
            // let listInternalId = arrHeaderPNK.map(e => e.internalid);
            // let arrDetailPNK = getDataPNKDetail(listInternalId);
            // for (let i = 0; i < arrHeaderPNK.length; i++) {
            //     let arr_filter_detail = arrDetailPNK.filter(e => e.internalid === arrHeaderPNK[i].internalid);
            //     if (arr_filter_detail.length > 0) {
            //         arrResult.push(arrHeaderPNK[i]);
            //     }
            // }
            // return arrResult;

            return arrHeaderPNK
        }

        const getDataPNKDetail = (arrInternalId) => {
            let resultSearch = search.load(IdSavedSearch.SS_PNK_TONG);
            let myColumns = resultSearch.columns;
            let myFilter = resultSearch.filters;
            myFilter.push(search.createFilter({
                name: 'internalid',
                operator: search.Operator.ANYOF,
                values: arrInternalId
            }));
            resultSearch = resultSearch.run().getRange({start: 0, end: 1000});
            let arrResult = [];
            for (let i = 0; i < resultSearch.length; i++) {
                let obj = {};
                obj.internalid = resultSearch[i].getValue(myColumns[0]);
                obj.entity_id = resultSearch[i].getValue(myColumns[4]);
                obj.entity_nm = resultSearch[i].getText(myColumns[4]);
                obj.upccode = resultSearch[i].getValue(myColumns[5]);
                obj.item_id = resultSearch[i].getValue(myColumns[6]);
                obj.item_nm = resultSearch[i].getText(myColumns[6]);
                obj.location = resultSearch[i].getValue(myColumns[7]);
                obj.quantity = resultSearch[i].getValue(myColumns[9]) * 1;
                obj.units = resultSearch[i].getValue(myColumns[11]);
                obj.grossamt = resultSearch[i].getValue(myColumns[13]) * 1;
                obj.rate = (obj.quantity === 0) ? 0 : obj.grossamt / obj.quantity;
                obj.description = resultSearch[i].getValue(myColumns[14]);
                obj.serimau = resultSearch[i].getValue(myColumns[18]);
                obj.lo = resultSearch[i].getText(myColumns[19]);
                obj.status = resultSearch[i].getText(myColumns[20]);
                obj.memo = resultSearch[i].getValue(myColumns[21]);
                arrResult.push(obj);
            }
            //let arrGrpItem = lbf.onGroupByArray(arrResult, ["item_id", 'lo', 'status']);
            let arrGrpItem = alasql("select distinct s.item_id, s.lo, s.status from ? s", [arrResult]);
            let arrFinal = [];
            for (let idx = 0; idx < arrGrpItem.length; idx++) {
                let obj = {memo : ''};
                let arr_filter_item = arrResult.filter(e => e.item_id === arrGrpItem[idx].item_id && e.lo === arrGrpItem[idx].lo && e.status === arrGrpItem[idx].status);
                obj.internalid = arr_filter_item[0].internalid;
                obj.entity_id = arr_filter_item[0].entity_id;
                obj.entity_nm = arr_filter_item[0].entity_nm;
                obj.upccode = arr_filter_item[0].upccode;
                obj.item_id = arrGrpItem[idx].item_id;
                obj.item_nm = arr_filter_item[0].item_nm;
                obj.description = arr_filter_item[0].description;
                obj.location = arr_filter_item[0].location;
                obj.units = arr_filter_item[0].units;
                let quantity = 0, grossamt = 0;
                for (let line = 0; line < arr_filter_item.length; line++) {
                    quantity += arr_filter_item[line].quantity;
                    grossamt += arr_filter_item[line].grossamt;
                }
                obj.quantity = quantity;
                obj.grossamt = grossamt;
                obj.rate = (obj.quantity === 0) ? 0 : obj.grossamt / obj.quantity;
                obj.serimau = arr_filter_item[0].serimau;
                obj.lo = arr_filter_item[0].lo;
                obj.status = arr_filter_item[0].status;

                // if (arr_filter_item[idx].memo && !obj.memo.includes(arr_filter_item[idx].memo)) {
                //     obj.memo = obj.memo ? obj.memo + ', ' + arr_filter_item[idx].memo : arr_filter_item[idx].memo;
                // }
                let uniqueMemos = new Set();
                arr_filter_item.forEach(item => {
                    if (item.memo) {
                        uniqueMemos.add(item.memo);
                    }
                });
                obj.memo = Array.from(uniqueMemos).join(', ');
                // obj.memo = arr_filter_item[0].memo;
                arrFinal.push(obj);
            }
            return arrFinal;
        }

        const getHeaderPNK = (params) => {
            let resultSearch = search.load(IdSavedSearch.SS_PNK_HEADER);
            let myColumns = resultSearch.columns;
            let myFilter = resultSearch.filters;
            if (lbf.isContainValue(params.custpage_fromdate)) {
                myFilter.push(search.createFilter({
                    name: 'trandate',
                    operator: search.Operator.ONORAFTER,
                    values: params.custpage_fromdate
                }));
            }
            if (lbf.isContainValue(params.custpage_todate)) {
                myFilter.push(search.createFilter({
                    name: 'trandate',
                    operator: search.Operator.ONORBEFORE,
                    values: params.custpage_todate
                }));
            }
            if (lbf.isContainValue(params.custpage_kho_nhap)) {
                myFilter.push(search.createFilter({
                    name: 'location',
                    operator: search.Operator.ANYOF,
                    values: params.custpage_kho_nhap.split(',')
                }));
            }
            if (lbf.isContainValue(params.custpage_po)) {
                myFilter.push(search.createFilter({
                    name: 'createdfrom',
                    operator: search.Operator.ANYOF,
                    values: params.custpage_po.split(',')
                }));
            }
            resultSearch = resultSearch.run().getRange({start: 0, end: 1000});
            let arrResult = [];
            for (let i = 0; i < resultSearch.length; i++) {
                let obj = {};
                obj.doc_no_ir = resultSearch[i].getValue(myColumns[0]);
                obj.created_from_id = resultSearch[i].getValue(myColumns[1]);
                obj.created_from_nm = resultSearch[i].getText(myColumns[1]);
                obj.date = resultSearch[i].getValue(myColumns[2]);
                obj.entity_ir = resultSearch[i].getText(myColumns[3]);
                obj.shipping_address = resultSearch[i].getValue(myColumns[4]);
                obj.memo = resultSearch[i].getValue(myColumns[5]);
                obj.location_id = resultSearch[i].getValue(myColumns[6]);
                obj.location_nm = resultSearch[i].getText(myColumns[6]);
                obj.internalid = resultSearch[i].getValue(myColumns[7]);
                obj.doc_no_po = resultSearch[i].getValue(myColumns[8]);
                obj.entity_po = resultSearch[i].getText(myColumns[9]);
                obj.entity_po_id = resultSearch[i].getValue(myColumns[9]);
                obj.sub_legalname = resultSearch[i].getValue(myColumns[10]);
                obj.sub_address = resultSearch[i].getValue(myColumns[11]);
                obj.vendor_legalname = resultSearch[i].getValue(myColumns[12]);
                obj.vendor_address = resultSearch[i].getValue(myColumns[13]);
                obj.ten_kho_hang = replaceNoneValue(resultSearch[i].getValue(myColumns[14]));
                obj.currency = resultSearch[i].getText(myColumns[17]);
                obj.dia_chi_kho = resultSearch[i].getValue(myColumns.find(s=> s.label === 'Địa chỉ kho'));
                obj.if_number = resultSearch[i].getValue(myColumns.find(s=> s.label === 'IF Number'));
                obj.nguoi_giao_hang = resultSearch[i].getValue(myColumns.find(s=> s.label === 'Người giao hàng'));

                arrResult.push(obj);
            }
            return arrResult;
        }

        const exportLxhMbnbPdf = (ssResultHeader, params, response) => {
            try {
                const printRender = comPdf.initTemplateRender(IdPdfTemplate.LXH_MBNB);
                comPdf.addFontVietnamese(printRender);

                let arrSelectedTranLines;
                if (params.arrSelectedTranLines) {
                    try {
                        arrSelectedTranLines = JSON.parse(params.arrSelectedTranLines);
                    } catch (e) {
                        log.error('Failed to parse arrSelectedTranLines', e);
                    }
                }
                let dataLxhMbnbDetail = [];
                arrSelectedTranLines.forEach(filterItem => {
                    const matched = ssResultHeader.filter(e =>
                        e.internalId === filterItem.custpage_col_0 &&
                        e.docNumber === filterItem.custpage_col_2 &&
                        e.item === filterItem.custpage_col_4 &&
                        e.quantity === filterItem.custpage_col_5
                    );
                    dataLxhMbnbDetail.push(...matched);
                });

                const { tableData, quantityTotal } = getTableDataLxhMbnb(dataLxhMbnbDetail);
                const mappedData = getMappedDataLxhMbnb(dataLxhMbnbDetail, tableData);

                const pdfData = {
                    header: {
                        canCuVaoDonSo: mappedData.A4.canCuVaoDonSo,
                        trandate: mappedData.B5.trandate,
                        tenKhachHang: mappedData.A6.tenKhachHang,
                        diaChiGiaoHang: mappedData.A7.diaChiGiaoHang,
                        nguoiNhanHang: mappedData.A8.nguoiNhanHang,
                        dienThoai: mappedData.D8.dienThoai,
                        keHoachGiaoHang: mappedData.A16.keHoachGiaoHang,
                        soXe: mappedData.A18.soXe,
                        taiXe: mappedData.B19.taiXe,
                        phuXe: mappedData.B20.phuXe,
                        tongSoLuong: mappedData.D13.tongSoLuong.toString(),
                        quantityTotal,
                        ngayGioIn: new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false }).replace(/(AM|PM)/, '').trim()
                    },
                    lines: tableData
                };
                printRender.addCustomDataSource({
                    format: render.DataSource.OBJECT,
                    alias: "jsonData",
                    data: pdfData
                });

                const pdfFile = printRender.renderAsPdf();
                pdfFile.name = 'Phieu_Lenh_Xuat_Hang_MBNB.pdf';

                response.writeFile(pdfFile, true);

            } catch (e) {
                log.error('Error creating PDF for LXH MBNB', e);
                response.write('<h1>Lỗi khi tạo file PDF. Vui lòng thử lại.</h1><p>' + e.message + '</p>');
            }
        }

        const exportPxbPdf = (ssResultHeader, params, response) => {
            try {
                let printRender;
                if(params.select_field === 'custpage_field_pxb_co_gia') {
                    printRender = comPdf.initTemplateRender(IdPdfTemplate.PXB_CO_GIA);
                } else {
                    printRender = comPdf.initTemplateRender(IdPdfTemplate.PXB_KHONG_GIA);
                }
                comPdf.addFontVietnamese(printRender);
                let arrInternalId = params.arrInternalId.split(",");
                let arrPxbChiTiet = getDataPxbChiTiet(arrInternalId);
                let mappedData = getMappedDataPXB(ssResultHeader, arrPxbChiTiet, params);

                let pdfData = {}
                if(params.select_field === 'custpage_field_pxb_khong_gia') {
                    pdfData = {
                        header: {
                            subLegalName: mappedData.B1?.subLegalName,
                            subsidiaryAddress: mappedData.B2?.subsidiaryAddress,
                            soPhieu: mappedData.E3?.soPhieu,
                            soDonHang: mappedData.E4?.soDonHang,
                            bieuMau: mappedData.F3?.bieuMau,
                            ngayGiaoHang: mappedData.F4?.ngayGiaoHang,
                            tenDonViMuaHang: mappedData.A6?.tenDonViMuaHang,
                            nguoiNhan: mappedData.E6?.nguoiNhan,
                            sdt: mappedData.F6?.sdt,
                            diaChiDonViMuaHang: mappedData.A7?.diaChiDonViMuaHang,
                            diaChiNhanHang: mappedData.D7?.diaChiNhanHang,
                            hinhThucVanChuyen: mappedData.E8?.hinhThucVanChuyen,
                            bienXeKhachHang: mappedData.F8?.bienXeKhachHang,
                            congTyNoiDungBienBan: mappedData.A9?.congTyNoiDungBienBan,
                            tongSoLuong: mappedData.D13?.tongSoLuong,
                            ngayIn: mappedData.A19?.ngayIn,
                            ktGiamDoc: mappedData.A25?.ktGiamDoc,
                            thuKho: mappedData.D25?.thuKho,
                            kiemSoat: mappedData.E25?.kiemSoat,
                        },
                        lines: arrPxbChiTiet
                    };
                } else if(params.select_field === 'custpage_field_pxb_co_gia'){
                    pdfData = {
                        header: {
                            subLegalName: mappedData.B1?.subLegalName,
                            subsidiaryAddress: mappedData.B2?.subsidiaryAddress,
                            soPhieu: mappedData.F3?.soPhieu,
                            soDonHang: mappedData.F4?.soDonHang,
                            bieuMau: mappedData.G3?.bieuMau,
                            ngayGiaoHang: mappedData.G4?.ngayGiaoHang,
                            tenDonViMuaHang: mappedData.A6?.tenDonViMuaHang,
                            nguoiNhan: mappedData.F6?.nguoiNhan,
                            sdt: mappedData.G6?.sdt,
                            diaChiDonViMuaHang: mappedData.A7?.diaChiDonViMuaHang,
                            diaChiNhanHang: mappedData.E7?.diaChiNhanHang,
                            hinhThucVanChuyen: mappedData.G8?.hinhThucVanChuyen,
                            bienXeKhachHang: mappedData.G8?.bienXeKhachHang,
                            congTyNoiDungBienBan: mappedData.A9?.congTyNoiDungBienBan,
                            tongSoLuong: mappedData.D13?.tongSoLuong,
                            tongThanhTien: mappedData.F13?.tongThanhTien,
                            ngayIn: mappedData.A19?.ngayIn,
                            ktGiamDoc: mappedData.A26?.ktGiamDoc,
                            thuKho: mappedData.D26?.thuKho,
                            kiemSoat: mappedData.F26?.kiemSoat,
                        },
                        lines: arrPxbChiTiet
                    };
                }

                printRender.addCustomDataSource({
                    format: render.DataSource.OBJECT,
                    alias: "jsonData",
                    data: pdfData
                });
                const pdfFile = printRender.renderAsPdf();
                pdfFile.name = 'Phieu_Xuat_Ban.pdf';
                response.writeFile(pdfFile, true);
            } catch (e) {
                log.error('Error creating PDF for PXB', e);
                response.write('<h1>Lỗi khi tạo file PDF. Vui lòng thử lại.</h1><p>' + e.message + '</p>');
            }
        }

        const exportLxhPdf = (ssResultHeader, params, response) => {
            try {
                const printRender = comPdf.initTemplateRender(IdPdfTemplate.LXH);
                comPdf.addFontVietnamese(printRender);
                let arrInternalId = params.arrInternalId.split(",");
                let arrLxhChiTiet = getDataLxhChiTiet(arrInternalId);
                ssResultHeader = ssResultHeader.filter(s => arrInternalId.includes(s.internalid))
                let mappedData = getMappedDataLxh(ssResultHeader, arrLxhChiTiet, params);

                log.error('ssResultHeader', JSON.stringify(ssResultHeader));
                const pdfData = {
                    header: {
                        tranid: mappedData.D4?.tranid,
                        canCuVaoDonSo: mappedData.A5?.canCuVaoDonSo,
                        trandate: mappedData.D5?.trandate,
                        tenKhachHang: mappedData.A6?.tenKhachHang,
                        diaChiGiaoHang: mappedData.A7?.diaChiGiaoHang,
                        nguoiNhanHang: mappedData.A8?.nguoiNhanHang,
                        dienThoai: mappedData.D8?.dienThoai,
                        keHoachGiaoHang: mappedData.A16?.keHoachGiaoHang,
                        tongSoLuong: mappedData.D13?.tongSoLuong,
                        pheDuyet: `${ssResultHeader[0]?.pheduyet || ''}<br/>${ssResultHeader[0]?.ngayduyet}`,
                        nguoiLap: mappedData.C20?.nguoiLap,
                        thuKho: mappedData.E20?.thuKho,
                        ngayLap :  `${ssResultHeader[0]?.ngayLap}`
                    },
                    lines: arrLxhChiTiet
                };
                printRender.addCustomDataSource({
                    format: render.DataSource.OBJECT,
                    alias: "jsonData",
                    data: pdfData
                });
                const pdfFile = printRender.renderAsPdf();
                pdfFile.name = 'Lenh_xuat_hang.pdf';
                response.writeFile(pdfFile, true);
            } catch (e) {
                log.error('Error creating PDF for Lệnh xuất hàng', e);
                response.write('<h1>Lỗi khi tạo file PDF. Vui lòng thử lại.</h1><p>' + e.message + '</p>');
            }
        }

        const exportPnkPdf = (ssResultHeader, params, response) => {
            try {
                const printRender = comPdf.initTemplateRender(IdPdfTemplate.PNK);
                comPdf.addFontVietnamese(printRender);
                let arrInternalId = params.arrInternalId.split(",");
                let arrPnkChiTiet = getDataPNKDetail(arrInternalId);
                let sumQuantity = arrPnkChiTiet.reduce((sum, s) => sum+ s.quantity, 0)
                ssResultHeader = ssResultHeader.filter(s => arrInternalId.includes(s.internalid));
                let mappedData = getMappedDataPnk(ssResultHeader, sumQuantity, params);

                const pdfData = {
                    header: {
                        sublegalname: mappedData.A1?.sublegalname,
                        mainaddress: mappedData.A2?.mainaddress,
                        trandate: mappedData.E5?.trandate,
                        docno: mappedData.E6?.docno,
                        vendorlegalname: mappedData.A8?.vendorlegalname,
                        memo: mappedData.A9?.memo,
                        nhapkho: mappedData.A10?.nhapkho,
                        sumQuantity: mappedData.G14?.sumQuantity,
                    },
                    lines: arrPnkChiTiet
                };
                printRender.addCustomDataSource({
                    format: render.DataSource.OBJECT,
                    alias: "jsonData",
                    data: pdfData
                });

                const pdfFile = printRender.renderAsPdf();
                pdfFile.name = 'Phieu_nhap_kho.pdf';
                response.writeFile(pdfFile, true);
            } catch (e) {
                log.error('Error creating PDF for Phiếu nhập kho', e);
                response.write('<h1>Lỗi khi tạo file PDF. Vui lòng thử lại.</h1><p>' + e.message + '</p>');
            }
        }

        const exportYcdcPdf = (ssResultHeader, params, response) => {
            try {
                const printRender = comPdf.initTemplateRender(IdPdfTemplate.YCDC);
                comPdf.addFontVietnamese(printRender);
                let arrInternalId = params.arrInternalId.split(",");
                let arrLxhChiTiet = getDataYcdcChiTiet(arrInternalId);
                let sumQuantity = arrLxhChiTiet.reduce((sum, s) => s + s.soluongyeucau, 0);
                ssResultHeader = ssResultHeader.filter(s => arrInternalId.includes(s.internalid))
                let mappedData = getMappedDataYCDC(ssResultHeader);

                const pdfData = {
                    header: {
                        subLegalName: mappedData.A1?.subLegalName,
                        subsidiaryAddress: mappedData.A2?.subsidiaryAddress,
                        trandate: mappedData.E6?.trandate,
                        tranid: mappedData.E7?.tranid,
                        nguoiYeuCau: mappedData.A9?.nguoiYeuCau,
                        lyDoDieuChuyen: mappedData.A10?.lyDoDieuChuyen,
                        khoXuat: mappedData.A11?.khoXuat,
                        khoNhan: mappedData.A11?.khoNhan,
                        sumQuantity: sumQuantity,
                    },
                    lines: arrLxhChiTiet
                };
                printRender.addCustomDataSource({
                    format: render.DataSource.OBJECT,
                    alias: "jsonData",
                    data: pdfData
                });
                const pdfFile = printRender.renderAsPdf();
                pdfFile.name = 'Lenh_xuat_hang.pdf';
                response.writeFile(pdfFile, true);
            } catch (e) {
                log.error('Error creating PDF for Lệnh xuất hàng', e);
                response.write('<h1>Lỗi khi tạo file PDF. Vui lòng thử lại.</h1><p>' + e.message + '</p>');
            }
        }

        const exportAcpPdf = (ssResultHeader, params, response) => {
            try {
                let printRender = null;
                if(params.export_type === 'PDF_ACP_NO_LOT') {
                    printRender = comPdf.initTemplateRender(IdPdfTemplate.ACP_NO_LOT);
                } else {
                    printRender = comPdf.initTemplateRender(IdPdfTemplate.ACP_LOT);
                }
                comPdf.addFontVietnamese(printRender);
                let selectedLines = [];
                if (params.arrSelectedTranLines) {
                    let arrSelectedLines = JSON.parse(decodeURIComponent(params.arrSelectedTranLines)).map(line => ({
                        id: line.custpage_col_0,
                        tranId: line.custpage_col_2,
                        upcCode: line.custpage_col_4,
                        displayName: line.custpage_col_5,
                        seri: line.custpage_col_6,
                        lot: line.custpage_col_7,
                    }));
                    const createKey = (obj) => {
                        const lotValue = obj.lot || '';
                        return [obj.id, obj.tranId, obj.upcCode, obj.displayName, obj.seri, lotValue].join('||');
                    };
                    const selectedKeys = new Set(arrSelectedLines.map(createKey));

                    selectedLines = ssResultHeader.filter((item) => {
                        const itemKey = [
                            item.internalid,
                            item.tranid,
                            item.upccode,
                            item.displayname,
                            item.seri,
                            (item.lotnumber_display || '')
                        ].join('||');
                        return selectedKeys.has(itemKey);
                    });

                } else {
                    selectedLines = ssResultHeader;
                }
                log.error('selectedLines', selectedLines)

                const pdfData = {
                    dataInfos: selectedLines
                };
                printRender.addCustomDataSource({
                    format: render.DataSource.OBJECT,
                    alias: "jsonData",
                    data: pdfData
                });

                const pdfFile = printRender.renderAsPdf();
                pdfFile.name = 'Label_ACP.pdf';

                response.writeFile(pdfFile, true);

            } catch (e) {
                log.error('Error creating PDF for LXH MBNB', e);
                response.write('<h1>Lỗi khi tạo file PDF. Vui lòng thử lại.</h1><p>' + e.message + '</p>');
            }
        }

        const exportPxkPdf = (ssResultHeader, params, response) => {
            try {
                const printRender = comPdf.initTemplateRender(IdPdfTemplate.PXK);
                comPdf.addFontVietnamese(printRender);
                let arrInternalId = params.arrInternalId.split(",");
                let arrPxkChiTiet = getDataPxkChiTiet(arrInternalId);
                ssResultHeader = ssResultHeader.filter(s => arrInternalId.includes(s.internalid))
                // let mappedData = getMappedDataLxh(ssResultHeader, arrPxkChiTiet, params);

                let sumQuantity = arrPxkChiTiet.reduce((sum, s) => sum + s.quantity, 0);

                let khoXuat = convertObjArrayToString(arrPxkChiTiet, "location");
                // let khoXuat = convertObjArrayToString(ssResultHeader, "location_nm");
                let mappedData = getMappedDataPxk(ssResultHeader, sumQuantity, khoXuat, params);

                const pdfData = {
                    header: {
                        legalname: mappedData.A1?.legalname,
                        diachi: mappedData.A2?.xuatkho,
                        xuatkho: mappedData.A10?.xuatkho,
                        trandate: mappedData.E5?.trandate,
                        docno: mappedData.E6?.docno,
                        ifnumber: mappedData.E6?.ifnumber,
                        customerlegalname: mappedData.A8?.customerlegalname,
                        memo: mappedData.A9?.memo,
                        sumQuantity: mappedData.G14?.sumQuantity,
                    },
                    lines: arrPxkChiTiet
                };

                printRender.addCustomDataSource({
                    format: render.DataSource.OBJECT,
                    alias: "jsonData",
                    data: pdfData
                });
                const pdfFile = printRender.renderAsPdf();
                pdfFile.name = 'Phieu_xuat_kho.pdf';
                response.writeFile(pdfFile, true);
            } catch (e) {
                log.error('Error creating PDF for Phiếu xuất kho', e);
                response.write('<h1>Lỗi khi tạo file PDF. Vui lòng thử lại.</h1><p>' + e.message + '</p>');
            }
        }

        // xem xét vứt code
        // ------Start xem xét -----
        const getDataPrintPXK = (_arrInternalId) => {
            let resultSearch = search.load(IdSavedSearch.SS_PXK_TONG);
            let mycolumns = resultSearch.columns;
            let myFilter = resultSearch.filters;
            myFilter.push(search.createFilter({
                name: 'internalid',
                operator: search.Operator.ANYOF,
                values: _arrInternalId
            }));
            resultSearch = resultSearch.run().getRange({start: 0, end: 1000});
            let arrResult = [];
            for (let i = 0; i < resultSearch.length; i++) {
                let obj = {};
                obj.internalid = resultSearch[i].getValue(mycolumns[0]);
                obj.entity_id = resultSearch[i].getValue(mycolumns[4]);
                obj.entity_nm = resultSearch[i].getText(mycolumns[4]);
                obj.upccode = resultSearch[i].getValue(mycolumns[5]);
                obj.item_id = resultSearch[i].getValue(mycolumns[6]);
                obj.item_nm = resultSearch[i].getText(mycolumns[6]);
                obj.description = resultSearch[i].getValue(mycolumns[14]);
                obj.location = resultSearch[i].getValue(mycolumns[7]);
                obj.quantity = resultSearch[i].getValue(mycolumns[9]) * 1;
                obj.units = resultSearch[i].getValue(mycolumns[11]);
                obj.grossamt = resultSearch[i].getValue(mycolumns[13]) * 1;
                arrResult.push(obj);
            }

            let arr_grp_item = lbf.onGroupByArray(arrResult, ["item_id"]);
            let arrFinal = [];
            for (let idx = 0; idx < arr_grp_item.length; idx++) {
                let obj = {};
                let arr_filter_item = arrResult.filter(e => e.item_id === arr_grp_item[idx].item_id);
                obj.internalid = arr_filter_item[0].internalid;
                obj.entity_id = arr_filter_item[0].entity_id;
                obj.entity_nm = arr_filter_item[0].entity_nm;
                obj.upccode = arr_filter_item[0].upccode;
                obj.item_id = arr_grp_item[idx].item_id;
                obj.item_nm = arr_filter_item[0].item_nm;
                obj.description = arr_filter_item[0].description;
                obj.location = arr_filter_item[0].location;
                obj.units = arr_filter_item[0].units;
                let quantity = 0, grossamt = 0;
                for (let line = 0; line < arr_filter_item.length; line++) {
                    quantity += arr_filter_item[line].quantity;
                    grossamt += arr_filter_item[line].grossamt;
                }
                obj.quantity = quantity;
                obj.grossamt = grossamt;
                obj.rate = (obj.quantity === 0) ? 0 : obj.grossamt / obj.quantity;
                arrFinal.push(obj);
            }
            return arrFinal;
        }
        // ------End xem xét -----

        const getDataPxkChiTiet = (arrInternalId) => {
            let arrFinal = [];
            let sSearch = search.load(IdSavedSearch.SS_PXK_TONG_CHI_TIET);
            let myColumns = sSearch.columns;
            let myFilter = sSearch.filters;

            myFilter.push(search.createFilter({
                name: 'internalid',
                operator: search.Operator.ANYOF,
                values: arrInternalId
            }));

            let resultSearch = sSearch.run().getRange({start: 0, end: 1000});
            let arrResult = [];
            for (let i = 0; i < resultSearch.length; i++) {
                let obj = {};
                const itemId = resultSearch[i].getValue(myColumns[6]);
                if (itemId) {
                    obj.internalid = resultSearch[i].getValue(myColumns[0]);
                    obj.entity_id = resultSearch[i].getValue(myColumns[4]);
                    obj.item_id = resultSearch[i].getValue(myColumns[6]);
                    obj.entity_nm = resultSearch[i].getText(myColumns[4]);
                    obj.upccode = resultSearch[i].getValue(myColumns[5]);
                    obj.item_nm = resultSearch[i].getText(myColumns[6]);
                    obj.description = resultSearch[i].getValue(myColumns[7]);
                    obj.location = resultSearch[i].getValue(myColumns[8]);
                    obj.quantity = resultSearch[i].getValue(myColumns[10]) * 1;
                    obj.units = resultSearch[i].getValue(myColumns[11]);
                    obj.line_id = resultSearch[i].getValue(myColumns[14]);
                    obj.rate = resultSearch[i].getValue(myColumns[16]) * 1;
                    obj.lo = resultSearch[i].getText(myColumns[16]);
                    obj.serimau = resultSearch[i].getValue(myColumns[17]);
                    obj.ghichu = resultSearch[i].getValue(myColumns[18]);
                    obj.status = resultSearch[i].getText(myColumns.find(s=>s.label === 'Status'));
                    obj.grossamt = (+obj.quantity || 0) * obj.rate;
                    obj.groups =
                        // obj.internalid + "||" +
                        obj.item_id + '||' + obj.lo +'||' + obj.status + '||' + obj.location
                    //+ "||" + obj.line_id;
                    arrResult.push(obj);
                }
            }
            log.error('arrResult', arrResult)

            let arrGrpItem = lbf.onGroupByArray(arrResult, ["groups"]);
            for (let idx = 0; idx < arrGrpItem.length; idx++) {
                let obj = {};
                let arr_filter_item = arrResult.filter(e => e.groups === arrGrpItem[idx].groups);
                obj.internalid = arr_filter_item[0].internalid;
                obj.entity_id = arr_filter_item[0].entity_id;
                obj.entity_nm = arr_filter_item[0].entity_nm;
                obj.groups = arr_filter_item[0].groups;
                obj.upccode = arr_filter_item[0].upccode;
                obj.item_id = arrGrpItem[idx].item_id;
                obj.item_nm = arr_filter_item[0].item_nm;
                obj.location = arr_filter_item[0].location;
                obj.units = arr_filter_item[0].units;

                let quantity = 0, grossamt = 0;
                for (let line = 0; line < arr_filter_item.length; line++) {
                    quantity += arr_filter_item[line].quantity;
                    grossamt += arr_filter_item[line].grossamt;
                }
                obj.quantity = quantity;

                // obj.quantity = arr_filter_item[0].quantity;
                obj.rate = arr_filter_item[0].rate;
                obj.grossamt = arr_filter_item[0].grossamt;
                obj.description = arr_filter_item[0].description;
                obj.lo = arr_filter_item[0].lo;
                obj.serimau = arr_filter_item[0].serimau;

                let uniqueMemos = new Set();
                arr_filter_item.forEach(item => {
                    if (item.ghichu) {
                        uniqueMemos.add(item.ghichu);
                    }
                });
                obj.ghichu = Array.from(uniqueMemos).join(', ');
                // obj.ghichu = arr_filter_item[0].ghichu;
                obj.status = arr_filter_item[0].status;
                arrFinal.push(obj);
            }

            return arrFinal;
        }

        // xem xét vứt code sau && vứt luôn SS, cồng kềnh
        // -------------Xem xét vứt--------------
        const getDataInvDetail = (mapArrInventoryItem, mapArrInventoryLot) => {
            let savedSearch = search.load({id: IdSavedSearch.SS_PXB_INV_DTL});
            let filters = savedSearch.filters;
            let columns = savedSearch.columns;
            filters.push(search.createFilter({
                name: 'item',
                operator: search.Operator.ANYOF,
                values: mapArrInventoryItem
            }));

            filters.push(search.createFilter({
                name: 'inventorynumber',
                operator: search.Operator.ANYOF,
                values: mapArrInventoryLot
            }));

            let searchRun = savedSearch.run().getRange(0, 1000);
            let arrResult = [];

            for (let i = 0; i < searchRun.length; i++) {
                let obj = {};
                obj.item_id = searchRun[i].getValue(columns[0]);
                obj.locationId = searchRun[i].getValue(columns[1]);
                obj.lo = searchRun[i].getText(columns[6]);
                obj.seri = searchRun[i].getValue(columns[7]);
                arrResult.push(obj);
            }

            return arrResult;
        }
        // ---------------End xem xét------------

        const replaceNoneValue = (text) => {
            if (!text || text === '- None -') {
                return "";
            }
            return text;
        }

        const setRowDataSublist = (sublist, line, field, data) => {
            for (let i = 0; i < field.length; i++) {
                addValueColField(sublist, field[i], line, data[i]);
            }
        }

        const addValueColField = (sublist, id, line, value) => {
            if (lbf.isContainValue(value)) {
                sublist.setSublistValue({
                    id: id,
                    line: line,
                    value: value
                });
            }
        }

        const addFieldGroup = (form, id, label) => {
            let obj = {id: id, label: label}
            form.addFieldGroup(obj);
            return obj;
        }

        const convertObjArrayToString = (arrMain, eleObj) => {
            let arrResult = [];
            let arrMain_grp = lbf.onGroupByArray(arrMain, [eleObj]);
            for (let i = 0; i < arrMain_grp.length; i++) {
                let ele = arrMain_grp[i][eleObj];
                if (!!ele) {
                    arrResult.push(ele);
                }
            }
            return arrResult.join(", ");
        }

        const getEntityType = (entity) => {
            let lkE = search.lookupFields({type: 'entity', id: entity, columns: ['recordtype']});
            return lkE.recordtype;
        }

        return {onRequest}
    });
