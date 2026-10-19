/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  10 Jul 2025         Huy Pham			    Init, create file, Phát triển báo cáo tổng hợp và chi tiết kết quả sản xuất,from mr.Trương Minh Phúc(https://app.clickup.com/t/86czjzct2)
 *  16 Jul 2025         Huy Pham			    Update logic, from mr.TMPhúc(https://app.clickup.com/t/86czjzct2?comment=90160122733369)
 *  06 Aug 2025         Huy Pham			    Điều chỉnh #005->#008, from mr.TMPhúc(https://app.clickup.com/t/86czjzct2?comment=90160125571957)
 *  11 Aug 2025         Huy Pham			    Điều chỉnh & bổ sung type, from mr.TMPhúc(https://app.clickup.com/t/86czjzct2?comment=90160125571957&threadedComment=90160126831766)
 *  26 Aug 2025         Huy Pham                Điều chỉnh data mapping, from mr.Phúc(https://app.clickup.com/t/86czjzct2?comment=90160130604648)
 *  05 Sep 2025         Huy Pham                Type 01, Type 04, Type 05 cột PP, tấm 3ly QC bổ sung thêm lấy ở SS01, from mr.Phúc(https://app.clickup.com/t/86czjzct2?comment=90160131267809)
 *  03 Oct 2025         Huy Pham                Type 03, #017->#018, from mr.Phúc(https://app.clickup.com/t/86czjzct2?comment=90160137526808)
 *  10 Oct 2025         Huy Pham                Điều chỉnh, #018->#019, from mr.Phúc(https://app.clickup.com/t/86czjzct2?comment=90160139042550)
 *  22 Oct 2025         Huy Pham                Điều chỉnh, #021->#022, from mr.Phúc(https://app.clickup.com/t/86czjzct2?comment=90160141266439)
 *  07 Nov 2025         Huy Pham                Điều chỉnh, #023, from mr.Phúc(https://app.clickup.com/t/86czjzct2?comment=90160144700484)
 */
define([
    '../lib/scv_lib_function.js',
    '../olib/alasql/alasql.min@4.6.6.js',
    '../cons/scv_cons_format.js',
],
    (
        lbf,
        alasql,
        constFormat
    ) => {
        const _export = {
            params: {},
            arrProdResultACPSummary: [],
            arrPhePhuPhamACPSummary: [],
            arrInspectionResultACPSummary: [],
            arrProdResultACSummary: [],
            arrPhePhuPhamACSummary: [],
            arrProdResultDetail: [],
            arrPhePhuPhamDetail: [],
            arrInspectionResultDetail: [],
            arrInventoryReceiving: [],
            arrNhanCongtACPSummary: [],
            arrInspectionResultACSummary: [],
            arrTotalByTransDetail: [],
            arrMaLoi: [],
            ReportType: {
                _01SummaryACP:{
                    ID: 1,
                    NAME: "Tổng hợp kết quả sản xuất ACP"
                },
                _02SummaryAC:{
                    ID: 2,
                    NAME: "Tổng hợp kết quả sản xuất AC"
                },
                _03Detail:{
                    ID: 3,
                    NAME: "Chi tiết kết quả sản xuất"
                },
                _04TongHopKetQuaSXACP_TheoMayNhomKeHoach:{
                    ID: 4,
                    NAME: "Tổng hợp kết quả sản xuất ACP (Theo Máy, Nhóm kế hoạch)",
                },
                _05TongHopKetQuaSXACP_TheoMayNhomKeHoach:{
                    ID: 5,
                    NAME: "Tổng hợp kết quả SX ACP (Theo nhân sự, máy, nhóm kế hoạch)",
                },
                _06TongHopKetQuaSXAC_TheoNhomKeHoach:{
                    ID: 6,
                    NAME: "Tổng hợp kết quả sản xuất AC (Theo Nhóm kế hoạch)",
                },
            },
            PeriodType: {
                _01Day: {
                    ID: 1,
                    NAME: "Ngày"
                },
                _02Month: {
                    ID: 2,
                    NAME: "Tháng"
                }
            },
        };

        _export.getDataReportType = function(){
            return [
                {value: this.ReportType._01SummaryACP.ID, text: this.ReportType._01SummaryACP.NAME},
                {value: this.ReportType._02SummaryAC.ID, text: this.ReportType._02SummaryAC.NAME},
                {value: this.ReportType._03Detail.ID, text: this.ReportType._03Detail.NAME},
                {value: this.ReportType._04TongHopKetQuaSXACP_TheoMayNhomKeHoach.ID, text: this.ReportType._04TongHopKetQuaSXACP_TheoMayNhomKeHoach.NAME},
                {value: this.ReportType._05TongHopKetQuaSXACP_TheoMayNhomKeHoach.ID, text: this.ReportType._05TongHopKetQuaSXACP_TheoMayNhomKeHoach.NAME},
                {value: this.ReportType._06TongHopKetQuaSXAC_TheoNhomKeHoach.ID, text: this.ReportType._06TongHopKetQuaSXAC_TheoNhomKeHoach.NAME}
            ];
        }

        _export.getDataPeriodType = function(){
            return [
                {value: this.PeriodType._01Day.ID, text: this.PeriodType._01Day.NAME},
                {value: this.PeriodType._02Month.ID, text: this.PeriodType._02Month.NAME}
            ];
        }

        _export.getColumns = function (_rptTypeId, _periodTypeId) {
            let maskFormatPre2 = constFormat.getTemplateFormatNumber(2);
            let maskFormatPre2_percent = maskFormatPre2 + "%";
            let numFmtXlsPre2 = "###,##0.00";
            let numFmtXlsPerPre2_percent = "0.00%";

            let arrColumns = [];

            if(_rptTypeId == this.ReportType._01SummaryACP.ID) {
                arrColumns = [
                    {dataField: 'year', caption: 'Năm', dataType: "string", width: 120},
                    {dataField: 'month', caption: 'Tháng', dataType: "string", width: 120},
                    {dataField: 'mfg_date', caption: 'Ngày', dataType: "string", width: 120},
                    {dataField: 'ca_display', caption: 'Ca', dataType: "string", width: 120},
                    {dataField: 'wo_center_display', caption: 'Máy', dataType: "string", minWidth: 120},
                    {
                        caption: 'Quản lý ca',
                        columns: [
                            {dataField: 'ho_ten', caption: 'Họ tên', dataType: "string", width: 120},
                            {dataField: 'vi_tri', caption: 'Vị trí', dataType: "string", width: 120},
                        ]
                    },
                    {
                        caption: 'Thông tin, thuộc tính sản phẩm',
                        columns: [
                            {dataField: 'nhom_ke_hoach_display', caption: 'Nhóm kế hoạch', dataType: "string", width: 180},
                            {dataField: 'nhom_cap_1_display', caption: 'Nhóm cấp 1', dataType: "string", width: 120},
                            {dataField: 'nhom_cap_2_display', caption: 'Nhóm cấp 2', dataType: "string", width: 120},
                            {dataField: 'thuong_hieu_display', caption: 'Thương hiệu', dataType: "string", width: 120},
                            {dataField: 'ma_mau_chinh_display', caption: 'Mã màu chính', dataType: "string", width: 180},
                            {dataField: 'do_day_tam', caption: 'Độ dày tấm', dataType: "string", width: 120},
                            {dataField: 'do_day_nhom', caption: 'Độ dày nhôm', dataType: "string", width: 120},
                            {dataField: 'chieu_rong', caption: 'Khổ rộng', dataType: "string", width: 120},
                            {dataField: 'lop_son_display', caption: 'Lớp sơn', dataType: "string", width: 120},
                        ]
                    },
                    {dataField: 'so_number', caption: 'Số đơn hàng', dataType: "string", width: 120},
                    {
                        caption: 'Kết quả sản xuất',
                        columns: [
                            {dataField: 'thanh_pham', caption: 'Thành phẩm, tấm', dataType: "number", format: maskFormatPre2, formatXls: numFmtXlsPre2, width: 150},
                            {dataField: 'thanh_pham_3lyqc', caption: 'Thành phẩm, tấm 3lyQC', dataType: "number", format: maskFormatPre2, formatXls: numFmtXlsPre2, width: 210},
                            {dataField: 'loai_b_3lyqc', caption: 'Loại B, tấm 3lyQC', dataType: "number", format: maskFormatPre2, formatXls: numFmtXlsPre2, width: 210},
                            {dataField: 'phe_pham_3lyqc', caption: 'PP, tấm 3ly QC', dataType: "number", format: maskFormatPre2, formatXls: numFmtXlsPre2, width: 210},
                            {dataField: 'so_ca', caption: 'Số ca, ca', dataType: "number", format: maskFormatPre2, formatXls: numFmtXlsPre2, width: 180},
                            {dataField: 'tlpp_percent', caption: 'TLPP, %', dataType: "number", format: maskFormatPre2_percent, formatXls: numFmtXlsPerPre2_percent, width: 120},
                            {dataField: 'nstb_tam_3ly_qc_ca', caption: 'NSTB, tấm 3lyQC/ca', dataType: "number", format: maskFormatPre2, formatXls: numFmtXlsPre2, width: 210},
                        ]
                    },
                ];
                arrColumns.forEach(objCol => {
                    if(objCol.caption == "Kết quả sản xuất"){
                        objCol.headerStyle = {
                            "background-color": "#D9F2D0"
                        }

                        objCol.columns.forEach(objColChild => {
                            objColChild.headerStyle = {
                                "background-color": "#D9F2D0"
                            }
                        });
                    }
                    else{
                        objCol.headerStyle = {
                            "background-color": "#DBE9F7"
                        }
                        objCol?.columns?.forEach(objColChild => {
                            objColChild.headerStyle = {
                                "background-color": "#DBE9F7"
                            }
                        });
                    }
                });
            }
            else if(_rptTypeId == this.ReportType._02SummaryAC.ID) {
                let arrColumnPhePhamQuyDoi = [
                    {dataField: 'phe_pham_unit', caption: 'ĐVT', dataType: "string", width: 120},
                ];
                let arrColumnTLPPPercent = [];

                if(this.arrMaLoi.length > 0){
                    this.arrMaLoi.forEach(objMaLoi => {
                        arrColumnPhePhamQuyDoi.push({
                            dataField: 'phe_pham_ma_loi_' + objMaLoi.id, caption: objMaLoi.name, dataType: "number", format: maskFormatPre2, formatXls: numFmtXlsPre2, width: 150
                        });

                        arrColumnTLPPPercent.push({
                            dataField: 'tlpp_ma_loi_' + objMaLoi.id, caption: objMaLoi.name, dataType: "number", format: maskFormatPre2_percent, formatXls: numFmtXlsPerPre2_percent, width: 150
                        });
                    });
                }

                arrColumnPhePhamQuyDoi.push({dataField: 'phe_pham_total', caption: 'Tổng', dataType: "number", format: maskFormatPre2, formatXls: numFmtXlsPre2, width: 120});
                arrColumnTLPPPercent.push({dataField: 'tlpp_total', caption: 'Tổng', dataType: "number", format: maskFormatPre2_percent, formatXls: numFmtXlsPerPre2_percent, width: 120});

                arrColumns = [
                    {dataField: 'year', caption: 'Năm', dataType: "string", width: 180},
                    {dataField: 'month', caption: 'Tháng', dataType: "string", width: 120},
                    {dataField: 'mfg_date', caption: 'Ngày', dataType: "string", width: 120},
                    {dataField: 'ca_display', caption: 'Ca', dataType: "string", width: 120},
                    {dataField: 'wo_center_display', caption: 'Máy', dataType: "string", minWidth: 120},
                    {
                        caption: 'Thông tin, thuộc tính sản phẩm',
                        columns: [
                            {dataField: 'nhom_ke_hoach_display', caption: 'Nhóm kế hoạch', dataType: "string", width: 180},
                            {dataField: 'nhom_cap_1_display', caption: 'Nhóm cấp 1', dataType: "string", width: 120},
                            {dataField: 'nhom_cap_2_display', caption: 'Nhóm cấp 2', dataType: "string", width: 120},
                            {dataField: 'ma_mau_chinh_display', caption: 'Mã màu chính', dataType: "string", width: 180},
                            {dataField: 'chieu_cao', caption: 'Chiều cao', dataType: "string", width: 120},
                            {dataField: 'do_day_nhom', caption: 'Độ dày nhôm', dataType: "string", width: 120},
                            {dataField: 'chieu_rong', caption: 'Khổ rộng', dataType: "string", width: 120},
                            {dataField: 'hoa_tiet_dot_display', caption: 'Họa tiết', dataType: "string", width: 120},
                            {dataField: 'kieu_dang_display', caption: 'Kiểu dáng', dataType: "string", width: 120},
                            {dataField: 'buoc_display', caption: 'Bước', dataType: "string", width: 120},
                        ]
                    },
                    {dataField: 'so_number', caption: 'Số đơn hàng', dataType: "string", width: 120},
                    {
                        caption: 'Kết quả sản xuất',
                        columns: [
                            {dataField: 'thanh_pham', caption: 'Thành phẩm', dataType: "number", format: maskFormatPre2, formatXls: numFmtXlsPre2, width: 150},
                            {
                                caption: "Thành phẩm quy đổi<br/>(m2 đối với trần, lam; Kg đối với phụ kiện)",
                                columns: [
                                    {dataField: 'thanh_pham_unit', caption: 'ĐVT', dataType: "string", width: 120},
                                    {dataField: 'thanh_pham_quantity', caption: 'Số lượng', dataType: "number", format: maskFormatPre2, formatXls: numFmtXlsPre2, width: 120},
                                ]
                            },
                            {
                                caption: "Phế phẩm quy đổi<br/>(m2 đối với trần, lam; Kg đối với phụ kiện)",
                                columns: arrColumnPhePhamQuyDoi
                            },
                            {
                                caption: "TLPP, %",
                                columns: arrColumnTLPPPercent
                            },
                        ]
                    },
                ];

                arrColumns.forEach(objCol => {
                    if(objCol.caption == "Kết quả sản xuất"){
                        objCol.headerStyle = {
                            "background-color": "#D9F2D0"
                        }

                        objCol?.columns?.forEach(objColChild => {
                            objColChild.headerStyle = {
                                "background-color": "#D9F2D0"
                            }

                            objColChild?.columns?.forEach(objColChild2 => {
                                objColChild2.headerStyle = {
                                    "background-color": "#D9F2D0"
                                }
                            });
                        });
                    }
                    else{
                        objCol.headerStyle = {
                            "background-color": "#DBE9F7"
                        }
                        objCol?.columns?.forEach(objColChild => {
                            objColChild.headerStyle = {
                                "background-color": "#DBE9F7"
                            }
                        });
                    }
                });
            }
            else if(_rptTypeId == this.ReportType._03Detail.ID){
                arrColumns = [
                    {
                        caption: 'Thông tin phiếu AB',
                        columns: [
                            {dataField: 'mfg_date', caption: 'Ngày sản xuất', dataType: "string", width: 150},
                            {dataField: 'ab_date', caption: 'Ngày chứng từ', dataType: "string", width: 120},
                            {dataField: 'ca_display', caption: 'Ca', dataType: "string", width: 80},
                            {dataField: 'wo_center_display', caption: 'Máy', dataType: "string", width: 120},
                            {dataField: 'ab_number', caption: 'Số phiếu', dataType: "string", width: 120},
                            {dataField: 'so_thong_ke', caption: 'Số thống kê', dataType: "string", width: 100},
                            {dataField: 'lot_number_display', caption: 'Lô thành phẩm', dataType: "string", width: 120},
                            {dataField: 'item_display', caption: 'Tên sản phẩm', dataType: "string", minWidth: 210},
                            {dataField: 'units_display', caption: 'ĐVT', dataType: "string", width: 80},
                            {dataField: 'quantity', caption: 'Số lượng', dataType: "number", format: maskFormatPre2, formatXls: numFmtXlsPre2, width: 120},
                            {dataField: 'status_display', caption: 'Trạng thái', dataType: "string", width: 120},
                            {dataField: 'thoi_gian_san_xuat', caption: 'TG sản xuất (Phút)', dataType: "number", format: maskFormatPre2, formatXls: numFmtXlsPre2, width: 120},
                            {dataField: 'ma_loi_display', caption: 'Mã lỗi', dataType: "string", width: 120},
                        ]
                    },
                    {
                        caption: 'Chứng từ gốc',
                        columns: [
                            {dataField: 'assembly_code', caption: 'Mã Thành phẩm', dataType: "string", minWidth: 170},
                            {dataField: 'assembly_name', caption: 'Tên Thành phẩm', dataType: "string", minWidth: 200},
                            {dataField: 'wo_number', caption: 'Lệnh SX', dataType: "string", width: 120},
                            {dataField: 'so_number', caption: 'Số đơn hàng', dataType: "string", width: 120},
                        ]
                    },
                    {dataField: 'yeu_cau_nhap_xuat', caption: 'Yêu cầu nhập xuất', dataType: "string", width: 120},
                    {
                        caption: 'QC Phân loại',
                        columns: [
                            {dataField: 'qcpl_quantity', caption: 'Số lượng', dataType: "number", format: maskFormatPre2, formatXls: numFmtXlsPre2, width: 120},
                            {dataField: 'qcpl_status_display', caption: 'Trạng thái', dataType: "string", width: 120},
                            {dataField: 'qcpl_ma_loi_display', caption: 'Mã lỗi', dataType: "string", width: 120},
                        ]
                    },
                    /* {
                        caption: 'Nhập kho',
                        columns: [
                            {dataField: 'inv_quantity', caption: 'Số lượng', dataType: "number", format: maskFormatPre2, formatXls: numFmtXlsPre2, width: 120},
                            {dataField: 'inv_status_display', caption: 'Trạng thái', dataType: "string", width: 120},
                        ]
                    },
                    {
                        caption: 'Quy đổi sản lượng nhập kho',
                        columns: [
                            {dataField: 'acp_tam_3lyqc', caption: 'ACP, tấm 3lyQC', dataType: "number", format: maskFormatPre2, formatXls: numFmtXlsPre2, width: 120},
                            {dataField: 'ac_m2', caption: 'AC, m2', dataType: "number", format: maskFormatPre2, formatXls: numFmtXlsPre2, width: 120},
                            {dataField: 'phu_kien_ac_kg', caption: 'Phụ kiện AC, kg', dataType: "number", format: maskFormatPre2, formatXls: numFmtXlsPre2, width: 120},
                        ]
                    }, */
                    {
                        caption: 'Thông tin phế phẩm',
                        columns: [
                            {dataField: 'total_by_ab', caption: 'Tổng phế phẩm (AB)', dataType: "number", format: maskFormatPre2, formatXls: numFmtXlsPre2, width: 120},
                            {dataField: 'total_by_wo', caption: 'Tổng phế phẩm (WO)', dataType: "number", format: maskFormatPre2, formatXls: numFmtXlsPre2, width: 120},
                            {dataField: 'total_by_ycnx', caption: 'Tổng phế phẩm (YCNX)', dataType: "number", format: maskFormatPre2, formatXls: numFmtXlsPre2, width: 120},
                            {dataField: 'total_by_ia', caption: 'Tổng phế phẩm (IA)', dataType: "number", format: maskFormatPre2, formatXls: numFmtXlsPre2, width: 120},
                            {dataField: 'ia_related_ycnx', caption: 'Phiếu nhập thu hồi phế phẩm', dataType: "string", width: 120},
                        ]
                    },
                    {
                        caption: 'Thông tin, thuộc tính sản phẩm',
                        columns: [
                            {dataField: 'nhom_ke_hoach', caption: 'Nhóm kế hoạch', dataType: "string", width: 120},
                            {dataField: 'nhom_cap_1', caption: 'Nhóm cấp 1', dataType: "string", width: 120},
                            {dataField: 'nhom_cap_2', caption: 'Nhóm cấp 2', dataType: "string", width: 120},
                            {dataField: 'nhom_cap_3', caption: 'Nhóm cấp 3', dataType: "string", width: 120},
                            {dataField: 'nhom_cap_4', caption: 'Nhóm cấp 4', dataType: "string", width: 120},
                            {dataField: 'thuong_hieu', caption: 'Thương hiệu', dataType: "string", width: 120},
                            {dataField: 'ma_mau_chinh', caption: 'Mã màu chính', dataType: "string", width: 120},
                            {dataField: 'do_day_sp', caption: 'Độ dày/Chiều cao', dataType: "string", width: 120},
                            {dataField: 'do_day_nhom', caption: 'Độ dày nhôm', dataType: "string", width: 120},
                            {dataField: 'chieu_rong', caption: 'Khổ rộng', dataType: "number", format: maskFormatPre2, formatXls: numFmtXlsPre2, width: 120},
                            {dataField: 'chieu_dai', caption: 'Chiều dài', dataType: "number", format: maskFormatPre2, formatXls: numFmtXlsPre2, width: 120},
                            {dataField: 'lop_son', caption: 'Lớp sơn', dataType: "string", width: 120},
                            {dataField: 'hoa_tiet_dot', caption: 'Họa tiết đột', dataType: "string", width: 120},
                            {dataField: 'kieu_dang', caption: 'Kiểu dáng', dataType: "string", width: 120},
                            {dataField: 'buoc', caption: 'Bước', dataType: "string", width: 120},
                            {dataField: 'he_so_quy_doi', caption: 'Hệ số quy đổi h1', dataType: "number", format: maskFormatPre2, formatXls: numFmtXlsPre2, width: 120},
                        ]
                    },
                    {
                        caption: 'Vật tư chuẩn liên quan',
                        columns: [
                            {dataField: 'vat_tu_chuan', caption: 'VTC', dataType: "string", width: 120},
                            {dataField: 'chieu_rong_vtc', caption: 'Chiều rộng', dataType: "number", format: maskFormatPre2, formatXls: numFmtXlsPre2, width: 120},
                            {dataField: 'chieu_dai_vtc', caption: 'Chiều dài', dataType: "number", format: maskFormatPre2, formatXls: numFmtXlsPre2, width: 120},
                            {dataField: 'do_day_sp_vtc', caption: 'Độ dày/Chiều cao', dataType: "string", width: 120},
                            {dataField: 'khoi_luong_vtc', caption: 'Khối lượng VTC', dataType: "number", format: maskFormatPre2, formatXls: numFmtXlsPre2, width: 120},
                            {dataField: 'he_so_quy_doi_m2_vtc', caption: 'Hệ số quy đổi h2', dataType: "number", format: maskFormatPre2, formatXls: numFmtXlsPre2, width: 120},
                        ]
                    },
                ];

                arrColumns.forEach(objCol => {
                    if(["Nhập kho", "Quy đổi sản lượng nhập kho"].includes(objCol.caption)){
                        objCol.headerStyle = {
                            "background-color": "#D9F2D0"
                        }

                        objCol.columns.forEach(objColChild => {
                            objColChild.headerStyle = {
                                "background-color": "#D9F2D0"
                            }
                        });
                    }
                    else if(objCol.caption == "QC Phân loại"){
                        objCol.headerStyle = {
                            "background-color": "#F1A983"
                        }

                        objCol.columns.forEach(objColChild => {
                            objColChild.headerStyle = {
                                "background-color": "#F1A983"
                            }
                        });
                    }
                    else if(objCol.caption == "Thông tin phế phẩm"){
                        objCol.headerStyle = {
                            "background-color": "#DBDBDB"
                        }

                        objCol.columns.forEach(objColChild => {
                            objColChild.headerStyle = {
                                "background-color": "#DBDBDB"
                            }
                        });
                    }
                    else{
                        objCol.headerStyle = {
                            "background-color": "#DBE9F7"
                        }
                        objCol?.columns?.forEach(objColChild => {
                            objColChild.headerStyle = {
                                "background-color": "#DBE9F7"
                            }
                        });
                    }
                });
            }
            else if(_rptTypeId == this.ReportType._04TongHopKetQuaSXACP_TheoMayNhomKeHoach.ID) {
                arrColumns = [
                    {dataField: 'year', caption: 'Năm', dataType: "string", width: 150},
                    {dataField: 'month', caption: 'Tháng', dataType: "string", width: 120},
                    {dataField: 'mfg_date', caption: 'Ngày', dataType: "string", width: 120},
                    {dataField: 'wo_center_display', caption: 'Máy', dataType: "string", minWidth: 120},
                    {dataField: 'nhom_ke_hoach_display', caption: 'Nhóm kế hoạch', dataType: "string", width: 180},
                    {
                        caption: 'Kết quả sản xuất',
                        columns: [
                            {dataField: 'thanh_pham', caption: 'Thành phẩm, tấm', dataType: "number", format: maskFormatPre2, formatXls: numFmtXlsPre2, width: 150},
                            {dataField: 'thanh_pham_3lyqc', caption: 'Thành phẩm, tấm 3lyQC', dataType: "number", format: maskFormatPre2, formatXls: numFmtXlsPre2, width: 210},
                            {dataField: 'loai_b_3lyqc', caption: 'Loại B, tấm 3lyQC', dataType: "number", format: maskFormatPre2, formatXls: numFmtXlsPre2, width: 210},
                            {dataField: 'phe_pham_3lyqc', caption: 'PP, tấm 3ly QC', dataType: "number", format: maskFormatPre2, formatXls: numFmtXlsPre2, width: 210},
                            {dataField: 'so_ca', caption: 'Số ca, ca', dataType: "number", format: maskFormatPre2, formatXls: numFmtXlsPre2, width: 180},
                            {dataField: 'tlpp_percent', caption: 'TLPP, %', dataType: "number", format: maskFormatPre2_percent, formatXls: numFmtXlsPerPre2_percent, width: 120},
                            {dataField: 'nstb_tam_3ly_qc_ca', caption: 'NSTB, tấm 3lyQC/ca', dataType: "number", format: maskFormatPre2, formatXls: numFmtXlsPre2, width: 210},
                        ]
                    },
                ];
                arrColumns.forEach(objCol => {
                    if(objCol.caption == "Kết quả sản xuất"){
                        objCol.headerStyle = {
                            "background-color": "#D9F2D0"
                        }

                        objCol.columns.forEach(objColChild => {
                            objColChild.headerStyle = {
                                "background-color": "#D9F2D0"
                            }
                        });
                    }
                    else{
                        objCol.headerStyle = {
                            "background-color": "#DBE9F7"
                        }
                        objCol?.columns?.forEach(objColChild => {
                            objColChild.headerStyle = {
                                "background-color": "#DBE9F7"
                            }
                        });
                    }
                });
            }
            else if(_rptTypeId == this.ReportType._05TongHopKetQuaSXACP_TheoMayNhomKeHoach.ID) {
                arrColumns = [
                    {dataField: 'year', caption: 'Năm', dataType: "string", width: 150},
                    {dataField: 'month', caption: 'Tháng', dataType: "string", width: 80},
                    {dataField: 'mfg_date', caption: 'Ngày', dataType: "string", width: 120},
                    {dataField: 'wo_center_display', caption: 'Máy', dataType: "string", width: 150},
                    {
                        caption: 'Quản lý ca',
                        columns: [
                            {dataField: 'ho_ten', caption: 'Họ tên', dataType: "string", minWidth: 180},
                            {dataField: 'vi_tri', caption: 'Vị trí', dataType: "string", width: 120},
                        ]
                    },
                    {dataField: 'nhom_ke_hoach_display', caption: 'Nhóm kế hoạch', dataType: "string", width: 180},
                    {
                        caption: 'Kết quả sản xuất',
                        columns: [
                            {dataField: 'thanh_pham', caption: 'Thành phẩm, tấm', dataType: "number", format: maskFormatPre2, formatXls: numFmtXlsPre2, width: 150},
                            {dataField: 'thanh_pham_3lyqc', caption: 'Thành phẩm, tấm 3lyQC', dataType: "number", format: maskFormatPre2, formatXls: numFmtXlsPre2, width: 210},
                            {dataField: 'loai_b_3lyqc', caption: 'Loại B, tấm 3lyQC', dataType: "number", format: maskFormatPre2, formatXls: numFmtXlsPre2, width: 210},
                            {dataField: 'phe_pham_3lyqc', caption: 'PP, tấm 3ly QC', dataType: "number", format: maskFormatPre2, formatXls: numFmtXlsPre2, width: 210},
                            {dataField: 'so_ca', caption: 'Số ca, ca', dataType: "number", format: maskFormatPre2, formatXls: numFmtXlsPre2, width: 180},
                            {dataField: 'tlpp_percent', caption: 'TLPP, %', dataType: "number", format: maskFormatPre2_percent, formatXls: numFmtXlsPerPre2_percent, width: 120},
                            {dataField: 'nstb_tam_3ly_qc_ca', caption: 'NSTB, tấm 3lyQC/ca', dataType: "number", format: maskFormatPre2, formatXls: numFmtXlsPre2, width: 210},
                        ]
                    },
                ];
                arrColumns.forEach(objCol => {
                    if(objCol.caption == "Kết quả sản xuất"){
                        objCol.headerStyle = {
                            "background-color": "#D9F2D0"
                        }

                        objCol.columns.forEach(objColChild => {
                            objColChild.headerStyle = {
                                "background-color": "#D9F2D0"
                            }
                        });
                    }
                    else{
                        objCol.headerStyle = {
                            "background-color": "#DBE9F7"
                        }
                        objCol?.columns?.forEach(objColChild => {
                            objColChild.headerStyle = {
                                "background-color": "#DBE9F7"
                            }
                        });
                    }
                });
            }
            else if(_rptTypeId == this.ReportType._06TongHopKetQuaSXAC_TheoNhomKeHoach.ID) {
                let arrColumnPhePhamQuyDoi = [
                    {dataField: 'phe_pham_unit', caption: 'ĐVT', dataType: "string", width: 120},
                ];
                let arrColumnTLPPPercent = [];

                if(this.arrMaLoi.length > 0){
                    this.arrMaLoi.forEach(objMaLoi => {
                        arrColumnPhePhamQuyDoi.push({
                            dataField: 'phe_pham_ma_loi_' + objMaLoi.id, caption: objMaLoi.name, dataType: "number", format: maskFormatPre2, formatXls: numFmtXlsPre2, width: 150
                        });

                        arrColumnTLPPPercent.push({
                            dataField: 'tlpp_ma_loi_' + objMaLoi.id, caption: objMaLoi.name, dataType: "number", format: maskFormatPre2_percent, formatXls: numFmtXlsPerPre2_percent, width: 150
                        });
                    });
                }

                arrColumnPhePhamQuyDoi.push({dataField: 'phe_pham_total', caption: 'Tổng', dataType: "number", format: maskFormatPre2, formatXls: numFmtXlsPre2, width: 120});
                arrColumnTLPPPercent.push({dataField: 'tlpp_total', caption: 'Tổng', dataType: "number", format: maskFormatPre2_percent, formatXls: numFmtXlsPerPre2_percent, width: 120});

                arrColumns = [
                    {dataField: 'year', caption: 'Năm', dataType: "string", width: 180},
                    {dataField: 'month', caption: 'Tháng', dataType: "string", width: 80},
                    {dataField: 'mfg_date', caption: 'Ngày', dataType: "string", width: 120},
                    {dataField: 'nhom_ke_hoach_display', caption: 'Nhóm kế hoạch', dataType: "string", minWidth: 230},
                    {
                        caption: 'Kết quả sản xuất',
                        columns: [
                            {dataField: 'thanh_pham', caption: 'Thành phẩm', dataType: "number", format: maskFormatPre2, formatXls: numFmtXlsPre2, width: 150},
                            {
                                caption: "Thành phẩm quy đổi<br/>(m2 đối với trần, lam; Kg đối với phụ kiện)",
                                columns: [
                                    {dataField: 'thanh_pham_unit', caption: 'ĐVT', dataType: "string", width: 120},
                                    {dataField: 'thanh_pham_quantity', caption: 'Số lượng', dataType: "number", format: maskFormatPre2, formatXls: numFmtXlsPre2, width: 120},
                                ]
                            },
                            {
                                caption: "Phế phẩm quy đổi<br/>(m2 đối với trần, lam; Kg đối với phụ kiện)",
                                columns: arrColumnPhePhamQuyDoi
                            },
                            {
                                caption: "TLPP, %",
                                columns: arrColumnTLPPPercent
                            },
                        ]
                    },
                ];
                arrColumns.forEach(objCol => {
                    if(objCol.caption == "Kết quả sản xuất"){
                        objCol.headerStyle = {
                            "background-color": "#D9F2D0"
                        }

                        objCol?.columns?.forEach(objColChild => {
                            objColChild.headerStyle = {
                                "background-color": "#D9F2D0"
                            }

                            objColChild?.columns?.forEach(objColChild2 => {
                                objColChild2.headerStyle = {
                                    "background-color": "#D9F2D0"
                                }
                            });
                        });
                    }
                    else{
                        objCol.headerStyle = {
                            "background-color": "#DBE9F7"
                        }
                        objCol?.columns?.forEach(objColChild => {
                            objColChild.headerStyle = {
                                "background-color": "#DBE9F7"
                            }
                        });
                    }
                });
            }

            return arrColumns;
        }

        _export.setDataInput = function ({
            params = {},
            arrProdResultACPSummary = [], 
            arrPhePhuPhamACPSummary = [], 
            arrInspectionResultACPSummary = [], 
            arrProdResultACSummary = [],
            arrPhePhuPhamACSummary = [],
            arrProdResultDetail = [],
            arrPhePhuPhamDetail = [],
            arrInspectionResultDetail = [],
            arrInventoryReceiving = [],
            arrNhanCongtACPSummary = [],
            arrInspectionResultACSummary = [],
            arrTotalByTransDetail = [],
        }) {
            this.params = params;
            this.arrProdResultACPSummary = arrProdResultACPSummary;
            this.arrPhePhuPhamACPSummary = arrPhePhuPhamACPSummary;
            this.arrInspectionResultACPSummary = arrInspectionResultACPSummary;
            this.arrProdResultACSummary = arrProdResultACSummary;
            this.arrPhePhuPhamACSummary = arrPhePhuPhamACSummary;
            this.arrProdResultDetail = arrProdResultDetail;
            this.arrPhePhuPhamDetail = arrPhePhuPhamDetail;
            this.arrInspectionResultDetail = arrInspectionResultDetail;
            this.arrInventoryReceiving = arrInventoryReceiving;
            this.arrNhanCongtACPSummary = arrNhanCongtACPSummary;
            this.arrInspectionResultACSummary = arrInspectionResultACSummary;
            this.arrTotalByTransDetail = arrTotalByTransDetail;

            this.arrMaLoi = alasql(`SELECT DISTINCT ma_loi as id, ma_loi_display as name FROM ? `, [
                this.arrPhePhuPhamACSummary
            ]);
        }

        _export.getDataSourceResult = function() {
            let arrResult = [];

            if(this.params.custpage_rpttype == this.ReportType._01SummaryACP.ID) {
                arrResult = this.getDataSourceResultType01(this.params);
            }
            else if(this.params.custpage_rpttype == this.ReportType._02SummaryAC.ID) {
                arrResult = this.getDataSourceResultType02(this.params);
            }
            else if(this.params.custpage_rpttype == this.ReportType._03Detail.ID) {
                arrResult = this.getDataSourceResultType03(this.params);
            }
            else if(this.params.custpage_rpttype == this.ReportType._04TongHopKetQuaSXACP_TheoMayNhomKeHoach.ID) {
                arrResult = this.getDataSourceResultType04(this.params);
            }
            else if(this.params.custpage_rpttype == this.ReportType._05TongHopKetQuaSXACP_TheoMayNhomKeHoach.ID) {
                arrResult = this.getDataSourceResultType05(this.params);
            }
            else if(this.params.custpage_rpttype == this.ReportType._06TongHopKetQuaSXAC_TheoNhomKeHoach.ID) {
                arrResult = this.getDataSourceResultType06(this.params);
            }

            return arrResult;
        }

        _export.getDataSourceResultType01 = function(_params) {
            let arrGroupByPeriodType = ["year", "month", "mfg_date", "mfg_date_yyyymmdd", "wo_center_display", "ca_display"];
            if(_params.custpage_periodtype == this.PeriodType._02Month.ID) {
                arrGroupByPeriodType = ["year", "month", "wo_center_display"];
            }

            let arrResult = alasql(`
                SELECT ${arrGroupByPeriodType.join(", ")},
                    nhom_ke_hoach_display, nhom_cap_1_display, nhom_cap_2_display,
                    thuong_hieu_display, ma_mau_chinh_display, do_day_tam,
                    do_day_nhom, chieu_rong, lop_son_display,
                    '' as so_number,
                    so_internalid,
                    SUM(thanh_pham) as thanh_pham,
                    SUM(thanh_pham_3lyqc) as thanh_pham_3lyqc,
                    SUM(loai_b_3lyqc) as loai_b_3lyqc,
                    SUM(phe_pham_3lyqc) as phe_pham_3lyqc,
                    SUM(so_ca) as so_ca,
                    0 as tlpp_percent,
                    0 as nstb_tam_3ly_qc_ca
                FROM (
                    SELECT year, month, mfg_date, mfg_date_yyyymmdd, ca_display, wo_center_display,
                        nhom_ke_hoach_display, nhom_cap_1_display, nhom_cap_2_display,
                        thuong_hieu_display, ma_mau_chinh_display, do_day_tam,
                        do_day_nhom, chieu_rong, lop_son_display,
                        so_internalid,
                        thanh_pham::NUMBER as thanh_pham,
                        thanh_pham_3lyqc::NUMBER as thanh_pham_3lyqc,
                        loai_b_3lyqc::NUMBER as loai_b_3lyqc,
                        phe_pham_3lyqc::NUMBER as phe_pham_3lyqc,
                        so_ca::NUMBER as so_ca
                    FROM ?
                    UNION ALL
                    SELECT year, month, mfg_date, mfg_date_yyyymmdd, ca_display, wo_center_display,
                        nhom_ke_hoach_display, nhom_cap_1_display, nhom_cap_2_display,
                        thuong_hieu_display, ma_mau_chinh_display, do_day_tam,
                        do_day_nhom, chieu_rong, lop_son_display,
                        so_internalid,
                        0 as thanh_pham,
                        0 as thanh_pham_3lyqc,
                        0 as loai_b_3lyqc,
                        phe_pham_3lyqc::NUMBER as phe_pham_3lyqc,
                        0 as so_ca
                    FROM ?
                    UNION ALL
                    SELECT year, month, mfg_date, mfg_date_yyyymmdd, ca_display, wo_center_display,
                        nhom_ke_hoach_display, nhom_cap_1_display, nhom_cap_2_display,
                        thuong_hieu_display, ma_mau_chinh_display, do_day_tam,
                        do_day_nhom, chieu_rong, lop_son_display,
                        so_internalid,
                        thanh_pham::NUMBER as thanh_pham,
                        thanh_pham_3lyqc::NUMBER as thanh_pham_3lyqc,
                        loai_b_3lyqc::NUMBER as loai_b_3lyqc,
                        phe_pham_3lyqc::NUMBER as phe_pham_3lyqc,
                        0 as so_ca
                    FROM ?
                )
                GROUP BY ${arrGroupByPeriodType.join(", ")},
                        nhom_ke_hoach_display, nhom_cap_1_display, nhom_cap_2_display,
                        thuong_hieu_display, ma_mau_chinh_display, do_day_tam,
                        do_day_nhom, chieu_rong, lop_son_display, so_internalid
                ORDER BY ${arrGroupByPeriodType.join(", ")}`, [
                this.arrProdResultACPSummary,
                this.arrPhePhuPhamACPSummary,
                this.arrInspectionResultACPSummary,
            ]);

            let objResTotal = {
                idxRow: lbf.uuidv4(),
                idxRowParent: -1,
                lvl: 1,
                year: "Tổng cộng",
                rowPreparedData: {
                    style: {fontWeight: "bold"}
                }
            };
            let arrKeyTotal = [
                "thanh_pham", "thanh_pham_3lyqc", "loai_b_3lyqc",
                "phe_pham_3lyqc", "so_ca", "tlpp_percent",
                "nstb_tam_3ly_qc_ca"
            ]
            
            arrResult.forEach(objRes =>{
                objRes.idxRow = lbf.uuidv4();
                objRes.idxRowParent = objResTotal.idxRow;
                objRes.lvl = 0;

                objRes.mfg_date = objRes.mfg_date || "";
                objRes.mfg_date_yyyymmdd = objRes.mfg_date_yyyymmdd || "";

                if(!!objRes.so_internalid){
                    let objFirstProdResult = this.arrProdResultACPSummary.find(e => e.so_internalid == objRes.so_internalid);
                    if(!!objFirstProdResult){
                        objRes.so_number = objFirstProdResult.so_number;
                    }
                }

                calcTLPPPercent(objRes);
                calcNSTBTam3LyQC(objRes);

                decodeNhomKeHoach(objRes);
                
                lbf.calcTotalResult(objResTotal, objRes, arrKeyTotal);
            });

            calcTLPPPercent(objResTotal);
            calcNSTBTam3LyQC(objResTotal);
            roundNumberObjectByKey(objResTotal, arrKeyTotal, 4);

            arrResult.push(objResTotal);

            return arrResult;
        }

        _export.getDataSourceResultType02 = function(_params) {
            let arrGroupByPeriodType = ["year", "month", "mfg_date", "mfg_date_yyyymmdd", "wo_center_display", "ca_display"];
            if(_params.custpage_periodtype == this.PeriodType._02Month.ID) {
                arrGroupByPeriodType = ["year", "month", "wo_center_display"];
            }
            
            let arrColumnResMaLoi = [];
            let arrColumnResMaLoiSS05 = [], arrColumnResMaLoiSS04 = [], arrColumnResMaLoiSS12 = [];
            this.arrMaLoi.forEach(objMaLoi => {
                arrColumnResMaLoiSS12.push(`0 as phe_pham_ma_loi_${objMaLoi.id}`);
                arrColumnResMaLoiSS04.push(`0 as phe_pham_ma_loi_${objMaLoi.id}`);
                arrColumnResMaLoiSS05.push(` (CASE WHEN ma_loi_display = '${objMaLoi.name}' THEN phe_pham_quy_doi::NUMBER ELSE 0 END) as phe_pham_ma_loi_${objMaLoi.id}`);
                arrColumnResMaLoi.push(` SUM(phe_pham_ma_loi_${objMaLoi.id}::NUMBER) as phe_pham_ma_loi_${objMaLoi.id}`);
            });

            let arrResultTemp = alasql(`
                SELECT ${arrGroupByPeriodType.join(", ")},
                    nhom_ke_hoach_display, nhom_cap_1_display, nhom_cap_2_display,
                    ma_mau_chinh_display, chieu_cao, do_day_nhom,
                    chieu_rong, hoa_tiet_dot_display, kieu_dang_display,
                    buoc_display, units, 
                    '' as so_number,
                    so_internalid,
                    SUM(thanh_pham) as thanh_pham,
                    SUM(thanh_pham_quy_doi) as thanh_pham_quy_doi,
                    SUM(phe_pham_quy_doi) as phe_pham_total
                    ${arrColumnResMaLoi.length > 0 ? (', ' + arrColumnResMaLoi.join(', ')) : ''}
                FROM (
                    SELECT year, month, mfg_date, mfg_date_yyyymmdd, ca_display, wo_center_display,
                        nhom_ke_hoach_display, nhom_cap_1_display, nhom_cap_2_display,
                        ma_mau_chinh_display, chieu_cao, do_day_nhom,
                        chieu_rong, hoa_tiet_dot_display, kieu_dang_display,
                        buoc_display,
                        '' as so_number,
                        so_internalid,
                        thanh_pham::NUMBER as thanh_pham,
                        units,
                        thanh_pham_quy_doi::NUMBER as thanh_pham_quy_doi,
                        0 as phe_pham_quy_doi
                        ${arrColumnResMaLoiSS04.length > 0 ? (', ' + arrColumnResMaLoiSS04.join(', ')) : ''}
                    FROM ?
                    UNION ALL
                    SELECT year, month, mfg_date, mfg_date_yyyymmdd, ca_display, wo_center_display,
                        nhom_ke_hoach_display, nhom_cap_1_display, nhom_cap_2_display,
                        ma_mau_chinh_display, chieu_cao, do_day_nhom,
                        chieu_rong, hoa_tiet_dot_display, kieu_dang_display,
                        buoc_display,
                        '' as so_number,
                        so_internalid,
                        0 as thanh_pham,
                        units,
                        0 as thanh_pham_quy_doi,
                        phe_pham_quy_doi::NUMBER as phe_pham_quy_doi
                        ${arrColumnResMaLoiSS05.length > 0 ? (', ' + arrColumnResMaLoiSS05.join(', ')) : ''}
                    FROM ?
                    UNION ALL
                    SELECT year, month, mfg_date, mfg_date_yyyymmdd, ca_display, wo_center_display,
                        nhom_ke_hoach_display, nhom_cap_1_display, nhom_cap_2_display,
                        ma_mau_chinh_display, chieu_cao, do_day_nhom,
                        chieu_rong, hoa_tiet_dot_display, kieu_dang_display,
                        buoc_display,
                        '' as so_number,
                        so_internalid,
                        thanh_pham::NUMBER as thanh_pham,
                        units,
                        thanh_pham_quy_doi::NUMBER as thanh_pham_quy_doi,
                        0 as phe_pham_quy_doi
                        ${arrColumnResMaLoiSS12.length > 0 ? (', ' + arrColumnResMaLoiSS12.join(', ')) : ''}
                    FROM ?
                )
                GROUP BY ${arrGroupByPeriodType.join(", ")},
                    nhom_ke_hoach_display, nhom_cap_1_display, nhom_cap_2_display,
                    ma_mau_chinh_display, chieu_cao, do_day_nhom,
                    chieu_rong, hoa_tiet_dot_display, kieu_dang_display,
                    buoc_display, units, so_internalid
                ORDER BY ${arrGroupByPeriodType.join(", ")}
                `, [
                    this.arrProdResultACSummary,
                    this.arrPhePhuPhamACSummary,
                    this.arrInspectionResultACSummary,
                ]);

            let arrKeyTotal = [
                "thanh_pham", "thanh_pham_quantity", "phe_pham_total",
            ];
            
            this.arrMaLoi.forEach(objMaLoi => {
                arrKeyTotal.push("phe_pham_ma_loi_" + objMaLoi.id);
            });

            let arrDVTGroup = alasql(`SELECT DISTINCT units FROM ?`, [arrResultTemp]);
            let arrResult = [];
            arrDVTGroup.forEach(objDVT => {
                let objResDVT = {
                    idxRow: lbf.uuidv4(),
                    idxRowParent: -1,
                    lvl: 2,
                    year: "Tổng cộng: " + objDVT.units,
                    thanh_pham_unit: objDVT.units,
                    thanh_pham: 0,
                    thanh_pham_quantity: 0,
                    phe_pham_total: 0,
                    rowPreparedData: {
                        style: {fontWeight: "bold"}
                    }
                };

                let arrResultDetail = arrResultTemp.filter(e => e.units == objDVT.units);
                arrResultDetail.forEach(objResDetail => {
                    let objRes = {...objResDetail};
                    objRes.idxRow = lbf.uuidv4();
                    objRes.idxRowParent = objResDVT.idxRow;
                    objRes.lvl = 0;

                    objRes.mfg_date = objRes.mfg_date || "";
                    objRes.mfg_date_yyyymmdd = objRes.mfg_date_yyyymmdd || "";

                    objRes.thanh_pham_unit = objRes.units;
                    objRes.thanh_pham_quantity = objRes.thanh_pham_quy_doi;
                    objRes.phe_pham_unit = objRes.units;
                    objRes.tlpp_total = 0;

                    if(!!objRes.so_internalid){
                        let objFirstProdResult = this.arrProdResultACSummary.find(e => e.so_internalid == objRes.so_internalid);
                        if(!!objFirstProdResult){
                            objRes.so_number = objFirstProdResult.so_number;
                        }
                    }

                    decodeNhomKeHoach(objRes);

                    this.arrMaLoi.forEach(objMaLoi => {
                        objRes["phe_pham_ma_loi_" + objMaLoi.id] = objRes["phe_pham_ma_loi_" + objMaLoi.id] * 1;

                        objRes["tlpp_ma_loi_" + objMaLoi.id] = objRes.thanh_pham_quantity == 0 ? 0 : objRes["phe_pham_ma_loi_" + objMaLoi.id] / objRes.thanh_pham_quantity;

                        objRes["tlpp_ma_loi_" + objMaLoi.id] = constFormat.roundNumber(objRes["tlpp_ma_loi_" + objMaLoi.id], 4);
                    });

                    objRes.tlpp_total = objRes.thanh_pham_quantity == 0 ? 0 : objRes.phe_pham_total / objRes.thanh_pham_quantity;
                    objRes.tlpp_total = constFormat.roundNumber(objRes.tlpp_total, 4);

                    lbf.calcTotalResult(objResDVT, objRes, arrKeyTotal);

                    arrResult.push(objRes);
                });

                this.arrMaLoi.forEach(objMaLoi => {
                    objResDVT["tlpp_ma_loi_" + objMaLoi.id] = objResDVT.thanh_pham_quantity == 0 ? 0 : objResDVT["phe_pham_ma_loi_" + objMaLoi.id] / objResDVT.thanh_pham_quantity;

                    objResDVT["tlpp_ma_loi_" + objMaLoi.id] = constFormat.roundNumber(objResDVT["tlpp_ma_loi_" + objMaLoi.id], 4);
                });

                objResDVT.tlpp_total = objResDVT.thanh_pham_quantity == 0 ? 0 : objResDVT.phe_pham_total / objResDVT.thanh_pham_quantity;
                objResDVT.tlpp_total = constFormat.roundNumber(objResDVT.tlpp_total, 4);

                roundNumberObjectByKey(objResDVT, arrKeyTotal, 2);

                arrResult.push(objResDVT);
            });

            return arrResult;
        }

        _export.getDataSourceResultType03 = function(_params) {
            let arrResult = [];
            
            let objResTotal = {
                idxRow: lbf.uuidv4(),
                idxRowParent: -1,
                lvl: 1,
                mfg_date: "Tổng cộng",
                mfg_date_yyyymmdd: "99999999",
                rowPreparedData: {
                    style: {fontWeight: "bold"}
                }
            };
            
            let arrKeyTotal = [
                "quantity", "qcpl_quantity", "inv_quantity",
                "acp_tam_3lyqc", "ac_m2", "phu_kien_ac_kg",
                "total_by_ab", "total_by_wo", "total_by_ycnx", "total_by_ia",
                "khoi_luong_vtc"
            ]     

            for(let i = 0; i < this.arrProdResultDetail.length; i++){
                let objRes06 = this.arrProdResultDetail[i];

                let isPushed = false;
                
                let objRes = {
                    idxRow: lbf.uuidv4(),
                    idxRowParent: objResTotal.idxRow,
                    lvl: 0,
                    mfg_date: objRes06.mfg_date,
                    mfg_date_yyyymmdd: objRes06.mfg_date_yyyymmdd,
                    ab_date_created_yyyymmdd: constFormat.dateTimeToChar(nlapiStringToDate(objRes06.ab_date_created)),
                    shift_sequence: objRes06.shift_sequence * 1,

                    ab_date: objRes06.ab_date,
                    ca_display: objRes06.ca_display,
                    wo_center_display: objRes06.wo_center_display,
                    ab_number: objRes06.ab_number,
                    so_thong_ke: objRes06.so_thong_ke,
                    lot_number_display: objRes06.lot_number_display,
                    item_display: (objRes06.item||"").replaceAll("&gt;", ">").replaceAll("&lt;", "<"),
                    units_display: objRes06.units,
                    quantity: objRes06.quantity * 1,
                    status_display: objRes06.status_display,
                    thoi_gian_san_xuat: objRes06.thoi_gian_san_xuat * 1,
                    ma_loi_display: "",
                    wo_number: objRes06.wo_number,
                    so_number: objRes06.so_number,
                    yeu_cau_nhap_xuat: "",
                    assembly_code: objRes06.assembly_code,
                    assembly_name: objRes06.assembly_name,
                    inv_quantity: 0,
                    inv_status_display: "",
                    acp_tam_3lyqc: 0,
                    ac_m2: 0,
                    phu_kien_ac_kg: 0,

                    nhom_ke_hoach: objRes06.nhom_ke_hoach_display ?? objRes06.nhom_ke_hoach,
                    nhom_cap_1: objRes06.nhom_cap_1_display ?? objRes06.nhom_cap_1,
                    nhom_cap_2: objRes06.nhom_cap_2_display ?? objRes06.nhom_cap_2,
                    nhom_cap_3: objRes06.nhom_cap_3_display ?? objRes06.nhom_cap_3,
                    nhom_cap_4: objRes06.nhom_cap_4_display ?? objRes06.nhom_cap_4,
                    thuong_hieu: objRes06.thuong_hieu_display ?? objRes06.thuong_hieu,
                    ma_mau_chinh: objRes06.ma_mau_chinh_display ?? objRes06.ma_mau_chinh,
                    do_day_sp: objRes06.do_day_sp_display ?? objRes06.do_day_sp,
                    do_day_nhom: objRes06.do_day_nhom_display ?? objRes06.do_day_nhom,
                    chieu_rong: objRes06.chieu_rong * 1,
                    chieu_dai: objRes06.chieu_dai * 1,
                    lop_son: objRes06.lop_son_display ?? objRes06.lop_son,
                    hoa_tiet_dot: objRes06.hoa_tiet_dot_display ?? objRes06.hoa_tiet_dot,
                    kieu_dang: objRes06.kieu_dang_display ?? objRes06.kieu_dang,
                    buoc: objRes06.buoc_display ?? objRes06.buoc,
                    he_so_quy_doi: objRes06.he_so_quy_doi * 1,
                    vat_tu_chuan: objRes06.vat_tu_chuan_display ?? objRes06.vat_tu_chuan,
                    chieu_rong_vtc: objRes06.chieu_rong_vtc * 1,
                    chieu_dai_vtc: objRes06.chieu_dai_vtc * 1,
                    do_day_sp_vtc: objRes06.do_day_sp_vtc_display ?? objRes06.do_day_sp_vtc,
                    khoi_luong_vtc: objRes06.khoi_luong_vtc * 1,
                    he_so_quy_doi_m2_vtc: objRes06.he_so_quy_doi_m2_vtc * 1,
                };

                decodeNhomKeHoach(objRes);

                if(objRes06.qc_required == "yes"){
                    let arrResSS08 = this.arrInspectionResultDetail.filter(e => e.key_mapping_ab == objRes06.key_mapping)
                    for(let j = 0; j < arrResSS08.length; j++){
                        let objRes08 = arrResSS08[j];

                        let objResQC = {
                            ...objRes,
                            idxRow: lbf.uuidv4(),
                            qcpl_quantity: objRes08.quantity * 1,
                            qcpl_status_display: objRes08.revised_status_display,
                            qcpl_ma_loi_display: objRes08.ma_loi_display,
                        };

                        //Nhập Kho: TH2 - SS08 mapping với SS09
                        //Quy đổi sản lượng nhập kho: TH2 - SS08 mapping với SS09
                        let objRes09 = this.arrInventoryReceiving.find(e => e.key_mapping == objRes08.key_mapping_inv)
                        if(!!objRes09){
                            objResQC.inv_quantity = objRes09.quantity * 1;
                            objResQC.inv_status_display = objRes09.status_display;

                            objResQC.acp_tam_3lyqc = objRes09.acp_tam_3lyqc * 1;
                            objResQC.ac_m2 = objRes09.ac_m2 * 1;
                            objResQC.phu_kien_ac_kg = objRes09.phu_kien_ac_kg * 1;
                        }
                        
                        arrResult.push(objResQC);

                        lbf.calcTotalResult(objResTotal, objResQC, arrKeyTotal);

                        isPushed = true;
                    }
                }
                else{
                    //Nhập Kho: TH1 - SS06 mapping với SS09
                    //Quy đổi sản lượng nhập kho: TH1 - SS06 mapping với SS09
                    let objRes09 = this.arrInventoryReceiving.find(e => e.key_mapping == objRes06.key_mapping)
                    if(!!objRes09){
                        objRes.inv_quantity = objRes09.quantity * 1;
                        objRes.inv_status_display = objRes09.status_display;
                        
                        objRes.acp_tam_3lyqc = objRes09.acp_tam_3lyqc * 1;
                        objRes.ac_m2 = objRes09.ac_m2 * 1;
                        objRes.phu_kien_ac_kg = objRes09.phu_kien_ac_kg * 1;
                    }
                    lbf.calcTotalResult(objResTotal, objRes, arrKeyTotal);
                }

                if(!isPushed){
                    arrResult.push(objRes);
                }
            }

            this.arrPhePhuPhamDetail.forEach(objRes07 => {
                let objRes = {
                    idxRow: lbf.uuidv4(),
                    idxRowParent: objResTotal.idxRow,
                    lvl: 0,
                    mfg_date: objRes07.mfg_date,
                    mfg_date_yyyymmdd: objRes07.mfg_date_yyyymmdd,
                    ab_date_created_yyyymmdd: constFormat.dateTimeToChar(nlapiStringToDate(objRes07.ab_date_created)),
                    ab_date: objRes07.ab_date,
                    shift_sequence: objRes07.shift_sequence * 1,

                    ca_display: objRes07.ca_display,
                    wo_center_display: objRes07.wo_center_display,
                    ab_number: objRes07.ab_number,
                    so_thong_ke: objRes07.so_thong_ke,
                    lot_number_display: "",
                    item_display: (objRes07.item_display||"").replaceAll("&gt;", ">").replaceAll("&lt;", "<"),
                    units_display: objRes07.units_display,
                    quantity: objRes07.quantity * 1,
                    status_display: "",
                    thoi_gian_san_xuat: "",
                    ma_loi_display: objRes07.ma_loi_display,
                    wo_number: objRes07.wo_number,
                    so_number: objRes07.so_number,
                    yeu_cau_nhap_xuat: objRes07.yeu_cau_nhap_xuat,
                    assembly_code: objRes07.assembly_code,
                    assembly_name: objRes07.assembly_name,
                    total_by_ab: 0,
                    total_by_wo: 0,
                    total_by_ycnx: 0,
                    total_by_ia: 0,
                    ia_related_ycnx: objRes07.ia_related_ycnx,
                    nhom_ke_hoach: objRes07.nhom_ke_hoach_display ?? objRes07.nhom_ke_hoach,
                    nhom_cap_1: objRes07.nhom_cap_1_display ?? objRes07.nhom_cap_1,
                    nhom_cap_2: objRes07.nhom_cap_2_display ?? objRes07.nhom_cap_2,
                    nhom_cap_3: objRes07.nhom_cap_3_display ?? objRes07.nhom_cap_3,
                    nhom_cap_4: objRes07.nhom_cap_4_display ?? objRes07.nhom_cap_4,
                    thuong_hieu: objRes07.thuong_hieu_display ?? objRes07.thuong_hieu,
                    ma_mau_chinh: objRes07.ma_mau_chinh_display ?? objRes07.ma_mau_chinh,
                    do_day_sp: objRes07.do_day_sp_display ?? objRes07.do_day_sp,
                    do_day_nhom: objRes07.do_day_nhom_display ?? objRes07.do_day_nhom,
                    chieu_rong: objRes07.chieu_rong * 1,
                    chieu_dai: objRes07.chieu_dai * 1,
                    lop_son: objRes07.lop_son_display ?? objRes07.lop_son,
                    hoa_tiet_dot: objRes07.hoa_tiet_dot_display ?? objRes07.hoa_tiet_dot,
                    kieu_dang: objRes07.kieu_dang_display ?? objRes07.kieu_dang,
                    buoc: objRes07.buoc_display ?? objRes07.buoc,
                    he_so_quy_doi: objRes07.he_so_quy_doi * 1,
                    vat_tu_chuan: objRes07.vat_tu_chuan_display ?? objRes07.vat_tu_chuan,
                    chieu_rong_vtc: objRes07.chieu_rong_vtc * 1,
                    chieu_dai_vtc: objRes07.chieu_dai_vtc * 1,
                    do_day_sp_vtc: objRes07.do_day_sp_vtc_display ?? objRes07.do_day_sp_vtc,
                    khoi_luong_vtc: objRes07.khoi_luong_vtc * 1,
                    he_so_quy_doi_m2_vtc: objRes07.he_so_quy_doi_m2_vtc * 1,
                };

                let objRes10 = this.arrTotalByTransDetail.find(e => e.key_mapping == objRes07.key_mapping_ss_total_scrap);
                if(!!objRes10){
                    objRes.total_by_ab = objRes10.total_by_ab * 1;
                    objRes.total_by_wo = objRes10.total_by_wo * 1;
                    objRes.total_by_ycnx = objRes10.total_by_ycnx * 1;
                    objRes.total_by_ia = objRes10.total_by_ia * 1;
                }

                decodeNhomKeHoach(objRes);

                arrResult.push(objRes);

                lbf.calcTotalResult(objResTotal, objRes, arrKeyTotal);
            });
            
            arrResult = alasql(`
                SELECT * FROM ?
                ORDER BY mfg_date_yyyymmdd, wo_center_display, shift_sequence, ab_date_created_yyyymmdd`, [
                arrResult
            ]);

            roundNumberObjectByKey(objResTotal, arrKeyTotal, 2);

            arrResult.push(objResTotal);

            return arrResult;
        }

        _export.getDataSourceResultType04 = function(_params) {
            let arrGroupByPeriodType = ["year", "month", "mfg_date", "mfg_date_yyyymmdd"];
            if(_params.custpage_periodtype == this.PeriodType._02Month.ID) {
                arrGroupByPeriodType = ["year", "month"];
            }
            
            let arrResultRaw = alasql(`
                SELECT ${arrGroupByPeriodType.join(", ")}, 
                    wo_center_display,
                    nhom_ke_hoach_display, 
                    SUM(thanh_pham) as thanh_pham,
                    SUM(thanh_pham_3lyqc) as thanh_pham_3lyqc,
                    SUM(loai_b_3lyqc) as loai_b_3lyqc,
                    SUM(phe_pham_3lyqc) as phe_pham_3lyqc,
                    SUM(so_ca) as so_ca,
                    0 as tlpp_percent,
                    0 as nstb_tam_3ly_qc_ca
                FROM (
                    SELECT year, month, mfg_date, mfg_date_yyyymmdd, wo_center_display,
                        nhom_ke_hoach_display, 
                        thanh_pham::NUMBER as thanh_pham,
                        thanh_pham_3lyqc::NUMBER as thanh_pham_3lyqc,
                        loai_b_3lyqc::NUMBER as loai_b_3lyqc,
                        phe_pham_3lyqc::NUMBER as phe_pham_3lyqc,
                        so_ca::NUMBER as so_ca
                    FROM ?
                    UNION ALL
                    SELECT year, month, mfg_date, mfg_date_yyyymmdd, wo_center_display,
                        nhom_ke_hoach_display, 
                        0 as thanh_pham,
                        0 as thanh_pham_3lyqc,
                        0 as loai_b_3lyqc,
                        phe_pham_3lyqc::NUMBER as phe_pham_3lyqc,
                        0 as so_ca
                    FROM ?
                    UNION ALL
                    SELECT year, month, mfg_date, mfg_date_yyyymmdd, wo_center_display,
                        nhom_ke_hoach_display, 
                        thanh_pham::NUMBER as thanh_pham,
                        thanh_pham_3lyqc::NUMBER as thanh_pham_3lyqc,
                        loai_b_3lyqc::NUMBER as loai_b_3lyqc,
                        phe_pham_3lyqc::NUMBER as phe_pham_3lyqc,
                        0 as so_ca
                    FROM ?
                )
                GROUP BY ${arrGroupByPeriodType.join(", ")}, wo_center_display, nhom_ke_hoach_display
                ORDER BY ${arrGroupByPeriodType.join(", ")}, wo_center_display, nhom_ke_hoach_display`, [
                this.arrProdResultACPSummary,
                this.arrPhePhuPhamACPSummary,
                this.arrInspectionResultACPSummary,
            ]);

            let objResTotal = {
                idxRow: lbf.uuidv4(),
                idxRowParent: -1,
                lvl: 1,
                year: "Tổng cộng",
                rowPreparedData: {
                    style: {fontWeight: "bold"}
                }
            };
            let arrKeyTotal = [
                "thanh_pham", "thanh_pham_3lyqc", "loai_b_3lyqc",
                "phe_pham_3lyqc", "so_ca", "tlpp_percent",
                "nstb_tam_3ly_qc_ca"
            ];

            let arrResWOCenter = alasql(`SELECT DISTINCT wo_center_display FROM ?`, [
                arrResultRaw
            ]);

            let arrResult = [];

            for(let i = 0; i < arrResWOCenter.length; i++){
                let objResWOCenter = arrResWOCenter[i];

                let objResTotalWOCenter = {
                    idxRow: lbf.uuidv4(),
                    idxRowParent: objResTotal.idxRow,
                    lvl: 2,
                    year: "Tổng cộng",
                    wo_center_display: objResWOCenter.wo_center_display,
                    rowPreparedData: {
                        style: {fontWeight: "bold"}
                    }
                };

                let arrResultDetail = arrResultRaw.filter(e => e.wo_center_display === objResWOCenter.wo_center_display);
                for(let j = 0; j < arrResultDetail.length; j++){
                    let objRes = arrResultDetail[j];

                    objRes.idxRow = lbf.uuidv4();
                    objRes.idxRowParent = objResTotalWOCenter.idxRow;
                    objRes.lvl = 0;

                    objRes.mfg_date = objRes.mfg_date || "";
                    objRes.mfg_date_yyyymmdd = objRes.mfg_date_yyyymmdd || "";

                    calcTLPPPercent(objRes);
                    calcNSTBTam3LyQC(objRes);
                    decodeNhomKeHoach(objRes);

                    arrResult.push(objRes);

                    lbf.calcTotalResult(objResTotalWOCenter, objRes, arrKeyTotal);
                    lbf.calcTotalResult(objResTotal, objRes, arrKeyTotal);
                }

                calcTLPPPercent(objResTotalWOCenter);
                calcNSTBTam3LyQC(objResTotalWOCenter);

                roundNumberObjectByKey(objResTotalWOCenter, arrKeyTotal, 4);

                arrResult.push(objResTotalWOCenter);
            }

            calcTLPPPercent(objResTotal);
            calcNSTBTam3LyQC(objResTotal);
            roundNumberObjectByKey(objResTotal, arrKeyTotal, 4);

            arrResult.push(objResTotal);

            return arrResult;
        }

        _export.getDataSourceResultType05 = function(_params) {
            let arrResult_DT01 = alasql(`
                SELECT year, month, mfg_date, mfg_date_yyyymmdd, ca, 
                    wo_center, wo_center_display,
                    nhom_ke_hoach, nhom_ke_hoach_display, 
                    SUM(thanh_pham) as thanh_pham,
                    SUM(thanh_pham_3lyqc) as thanh_pham_3lyqc,
                    SUM(loai_b_3lyqc) as loai_b_3lyqc,
                    SUM(phe_pham_3lyqc) as phe_pham_3lyqc,
                    SUM(so_ca) as so_ca,
                    0 as tlpp_percent,
                    0 as nstb_tam_3ly_qc_ca
                FROM (
                    SELECT year, month, mfg_date, mfg_date_yyyymmdd, ca, 
                        wo_center, wo_center_display,
                        nhom_ke_hoach, nhom_ke_hoach_display, 
                        thanh_pham::NUMBER as thanh_pham,
                        thanh_pham_3lyqc::NUMBER as thanh_pham_3lyqc,
                        loai_b_3lyqc::NUMBER as loai_b_3lyqc,
                        phe_pham_3lyqc::NUMBER as phe_pham_3lyqc,
                        so_ca::NUMBER as so_ca
                    FROM ?
                    UNION ALL
                    SELECT year, month, mfg_date, mfg_date_yyyymmdd, ca, 
                        wo_center, wo_center_display,
                        nhom_ke_hoach, nhom_ke_hoach_display, 
                        0 as thanh_pham,
                        0 as thanh_pham_3lyqc,
                        0 as loai_b_3lyqc,
                        phe_pham_3lyqc::NUMBER as phe_pham_3lyqc,
                        0 as so_ca
                    FROM ?
                    UNION ALL
                    SELECT year, month, mfg_date, mfg_date_yyyymmdd, ca, 
                        wo_center, wo_center_display,
                        nhom_ke_hoach, nhom_ke_hoach_display, 
                        thanh_pham::NUMBER as thanh_pham,
                        thanh_pham_3lyqc::NUMBER as thanh_pham_3lyqc,
                        loai_b_3lyqc::NUMBER as loai_b_3lyqc,
                        phe_pham_3lyqc::NUMBER as phe_pham_3lyqc,
                        0 as so_ca
                    FROM ?
                )
                GROUP BY year, month, mfg_date, mfg_date_yyyymmdd, ca, 
                    wo_center, wo_center_display,
                    nhom_ke_hoach, nhom_ke_hoach_display
                ORDER BY year, month, mfg_date, mfg_date_yyyymmdd`, [
                this.arrProdResultACPSummary,
                this.arrPhePhuPhamACPSummary,
                this.arrInspectionResultACPSummary,
            ]);
            
            let arrResultSumOfCa = alasql(`SELECT mfg_date_yyyymmdd, ca, wo_center, 
                SUM(so_ca::NUMBER) as so_ca
                FROM ? GROUP BY mfg_date_yyyymmdd, ca, wo_center`, [
                this.arrProdResultACPSummary
            ]);

            let arrResult_DT02 = [];

            arrResult_DT01.forEach(objRes_DT01 =>{
                decodeNhomKeHoach(objRes_DT01);

                let total_tgsx_ca = 0;
                let objResSumOfCa = arrResultSumOfCa.find(e => e.mfg_date_yyyymmdd == objRes_DT01.mfg_date_yyyymmdd
                    && e.ca == objRes_DT01.ca && e.wo_center == objRes_DT01.wo_center
                );
                if(!!objResSumOfCa){
                    total_tgsx_ca = objResSumOfCa.so_ca * 60 * 8;
                }

                let arrRes11 = this.arrNhanCongtACPSummary.filter(e => e.mfg_date == objRes_DT01.mfg_date
                    && e.ca == objRes_DT01.ca && e.wo_center == objRes_DT01.wo_center
                );
                
                for(let i = 0; i < arrRes11.length; i++){
                    let objRes11 = arrRes11[i];

                    let objRes_DT02 = {
                        ...objRes_DT01,
                        ho_ten: objRes11.employee_display,
                        vi_tri: objRes11.position_display,
                        thanh_pham: 0,
                        thanh_pham_3lyqc: 0,
                        loai_b_3lyqc: 0,
                        phe_pham_3lyqc: 0,
                        so_ca: 0,
                    };

                    if(total_tgsx_ca != 0){
                        objRes_DT02.thanh_pham = objRes_DT01.thanh_pham * objRes11.thoi_gian_san_xuat / total_tgsx_ca;
                        objRes_DT02.thanh_pham_3lyqc = objRes_DT01.thanh_pham_3lyqc * objRes11.thoi_gian_san_xuat / total_tgsx_ca;
                        objRes_DT02.loai_b_3lyqc = objRes_DT01.loai_b_3lyqc * objRes11.thoi_gian_san_xuat / total_tgsx_ca;
                        objRes_DT02.phe_pham_3lyqc = objRes_DT01.phe_pham_3lyqc * objRes11.thoi_gian_san_xuat / total_tgsx_ca;
                        objRes_DT02.so_ca = objRes_DT01.so_ca * objRes11.thoi_gian_san_xuat / total_tgsx_ca;
                    }
                    
                    arrResult_DT02.push(objRes_DT02);
                }
            });

            let arrGroupByPeriodType = ["year", "month", "mfg_date", "mfg_date_yyyymmdd"];
            if(_params.custpage_periodtype == this.PeriodType._02Month.ID) {
                arrGroupByPeriodType = ["year", "month"];
            }

            let arrResult_DT03 = alasql(`SELECT ${arrGroupByPeriodType.join(", ")}, wo_center_display,
                    nhom_ke_hoach_display, ho_ten, vi_tri,
                    SUM(thanh_pham) as thanh_pham,
                    SUM(thanh_pham_3lyqc) as thanh_pham_3lyqc,
                    SUM(loai_b_3lyqc) as loai_b_3lyqc,
                    SUM(phe_pham_3lyqc) as phe_pham_3lyqc,
                    SUM(so_ca) as so_ca,
                    0 as tlpp_percent,
                    0 as nstb_tam_3ly_qc_ca
                FROM ? 
                GROUP BY ${arrGroupByPeriodType.join(", ")}, wo_center_display, nhom_ke_hoach_display, ho_ten, vi_tri
                ORDER BY ${arrGroupByPeriodType.join(", ")}, wo_center_display, ho_ten, nhom_ke_hoach_display`,[
                    arrResult_DT02
                ]);

            let arrResQuanLy = alasql(`SELECT DISTINCT ho_ten, vi_tri FROM ?`, [arrResult_DT03]);

            let objResTotal = {
                idxRow: lbf.uuidv4(),
                idxRowParent: -1,
                lvl: 1,
                year: "Tổng cộng",
                rowPreparedData: {
                    style: {fontWeight: "bold"}
                }
            };
            let arrKeyTotal = [
                "thanh_pham", "thanh_pham_3lyqc", "loai_b_3lyqc",
                "phe_pham_3lyqc", "so_ca", "tlpp_percent",
                "nstb_tam_3ly_qc_ca"
            ];

            let arrResult = [];

            arrResQuanLy.forEach(objResQuanLy => {
                let objResTotalQuanLy = {
                    idxRow: lbf.uuidv4(),
                    idxRowParent: objResTotal.idxRow,
                    lvl: 2,
                    year: "Tổng cộng",
                    ho_ten: objResQuanLy.ho_ten,
                    vi_tri: objResQuanLy.vi_tri,
                    rowPreparedData: {
                        style: {fontWeight: "bold"}
                    }
                };

                let arrResultDetail = arrResult_DT03.filter(e => e.ho_ten === objResQuanLy.ho_ten 
                    && e.vi_tri === objResQuanLy.vi_tri
                );
                for(let i = 0; i < arrResultDetail.length; i++){
                    let objRes = arrResultDetail[i];

                    objRes.idxRow = lbf.uuidv4();
                    objRes.idxRowParent = objResTotalQuanLy.idxRow;
                    objRes.lvl = 0;

                    objRes.mfg_date = objRes.mfg_date || "";
                    objRes.mfg_date_yyyymmdd = objRes.mfg_date_yyyymmdd || "";
                    
                    calcTLPPPercent(objRes);
                    calcNSTBTam3LyQC(objRes);

                    arrResult.push(objRes);

                    lbf.calcTotalResult(objResTotalQuanLy, objRes, arrKeyTotal);
                    lbf.calcTotalResult(objResTotal, objRes, arrKeyTotal);
                }

                calcTLPPPercent(objResTotalQuanLy);
                calcNSTBTam3LyQC(objResTotalQuanLy);
                roundNumberObjectByKey(objResTotalQuanLy, arrKeyTotal, 4);

                arrResult.push(objResTotalQuanLy);
            });

            calcTLPPPercent(objResTotal);
            calcNSTBTam3LyQC(objResTotal);
            roundNumberObjectByKey(objResTotal, arrKeyTotal, 4);

            arrResult.push(objResTotal);

            return arrResult;
        }

        _export.getDataSourceResultType06 = function(_params) {
            let arrGroupByPeriodType = ["year", "month", "mfg_date", "mfg_date_yyyymmdd"];
            if(_params.custpage_periodtype == this.PeriodType._02Month.ID) {
                arrGroupByPeriodType = ["year", "month"];
            }
            
            let arrColumnResMaLoi = [];
            let arrColumnResMaLoiSS05 = [], arrColumnResMaLoiSS04 = [], arrColumnResMaLoiSS12 = [];
            this.arrMaLoi.forEach(objMaLoi => {
                arrColumnResMaLoiSS12.push(`0 as phe_pham_ma_loi_${objMaLoi.id}`);
                arrColumnResMaLoiSS04.push(`0 as phe_pham_ma_loi_${objMaLoi.id}`);
                arrColumnResMaLoiSS05.push(` (CASE WHEN ma_loi_display = '${objMaLoi.name}' THEN phe_pham_quy_doi::NUMBER ELSE 0 END) as phe_pham_ma_loi_${objMaLoi.id}`);
                arrColumnResMaLoi.push(` SUM(phe_pham_ma_loi_${objMaLoi.id}::NUMBER) as phe_pham_ma_loi_${objMaLoi.id}`);
            });

            let arrResultTemp = alasql(`
                SELECT ${arrGroupByPeriodType.join(", ")}, 
                    nhom_ke_hoach_display, units,
                    SUM(thanh_pham) as thanh_pham,
                    SUM(thanh_pham_quy_doi) as thanh_pham_quy_doi,
                    SUM(phe_pham_quy_doi) as phe_pham_total
                    ${arrColumnResMaLoi.length > 0 ? (', ' + arrColumnResMaLoi.join(', ')) : ''}
                FROM (
                    SELECT year, month, mfg_date, mfg_date_yyyymmdd, 
                        nhom_ke_hoach_display, 
                        thanh_pham::NUMBER as thanh_pham,
                        units,
                        thanh_pham_quy_doi::NUMBER as thanh_pham_quy_doi,
                        0 as phe_pham_quy_doi
                        ${arrColumnResMaLoiSS04.length > 0 ? (', ' + arrColumnResMaLoiSS04.join(', ')) : ''}
                    FROM ?
                    UNION ALL
                    SELECT year, month, mfg_date, mfg_date_yyyymmdd, 
                        nhom_ke_hoach_display, 
                        0 as thanh_pham,
                        units,
                        0 as thanh_pham_quy_doi,
                        phe_pham_quy_doi::NUMBER as phe_pham_quy_doi
                        ${arrColumnResMaLoiSS05.length > 0 ? (', ' + arrColumnResMaLoiSS05.join(', ')) : ''}
                    FROM ?
                    UNION ALL
                    SELECT year, month, mfg_date, mfg_date_yyyymmdd, 
                        nhom_ke_hoach_display, 
                        thanh_pham::NUMBER as thanh_pham,
                        units,
                        thanh_pham_quy_doi::NUMBER as thanh_pham_quy_doi,
                        0 as phe_pham_quy_doi
                        ${arrColumnResMaLoiSS12.length > 0 ? (', ' + arrColumnResMaLoiSS12.join(', ')) : ''}
                    FROM ?
                )
                GROUP BY ${arrGroupByPeriodType.join(", ")}, nhom_ke_hoach_display, units
                ORDER BY ${arrGroupByPeriodType.join(", ")}, nhom_ke_hoach_display
                `, [
                    this.arrProdResultACSummary,
                    this.arrPhePhuPhamACSummary,
                    this.arrInspectionResultACSummary,
                ]);

            let arrKeyTotal = [
                "thanh_pham", "thanh_pham_quantity", "phe_pham_total",
            ];
            
            this.arrMaLoi.forEach(objMaLoi => {
                arrKeyTotal.push("phe_pham_ma_loi_" + objMaLoi.id);
            });
            
            let arrDVTGroup = alasql(`SELECT DISTINCT units FROM ?`, [arrResultTemp]);
            let arrResult = [];
            arrDVTGroup.forEach(objDVT => {
                let objResDVT = {
                    idxRow: lbf.uuidv4(),
                    idxRowParent: -1,
                    lvl: 2,
                    year: "Tổng cộng: " + objDVT.units,
                    thanh_pham_unit: objDVT.units,
                    thanh_pham: 0,
                    thanh_pham_quantity: 0,
                    phe_pham_total: 0,
                    rowPreparedData: {
                        style: {fontWeight: "bold"}
                    }
                };

                let arrResultDetail = arrResultTemp.filter(e => e.units == objDVT.units);
                arrResultDetail.forEach(objResDetail => {
                    let objRes = {...objResDetail};

                    objRes.idxRow = lbf.uuidv4();
                    objRes.idxRowParent = objResDVT.idxRow;
                    objRes.lvl = 0;

                    objRes.mfg_date = objRes.mfg_date || "";
                    objRes.mfg_date_yyyymmdd = objRes.mfg_date_yyyymmdd || "";

                    objRes.thanh_pham_unit = objRes.units;
                    objRes.thanh_pham_quantity = objRes.thanh_pham_quy_doi;
                    objRes.phe_pham_unit = objRes.units;
                    objRes.tlpp_total = 0;

                    decodeNhomKeHoach(objRes);

                    this.arrMaLoi.forEach(objMaLoi => {
                        objRes["phe_pham_ma_loi_" + objMaLoi.id] = objRes["phe_pham_ma_loi_" + objMaLoi.id] * 1;

                        objRes["tlpp_ma_loi_" + objMaLoi.id] = objRes.thanh_pham_quantity == 0 ? 0 : objRes["phe_pham_ma_loi_" + objMaLoi.id] / objRes.thanh_pham_quantity;

                        objRes["tlpp_ma_loi_" + objMaLoi.id] = constFormat.roundNumber(objRes["tlpp_ma_loi_" + objMaLoi.id], 4);
                    });

                    objRes.tlpp_total = objRes.thanh_pham_quantity == 0 ? 0 : objRes.phe_pham_total / objRes.thanh_pham_quantity;
                    objRes.tlpp_total = constFormat.roundNumber(objRes.tlpp_total, 4);

                    lbf.calcTotalResult(objResDVT, objRes, arrKeyTotal);

                    arrResult.push(objRes);
                });

                this.arrMaLoi.forEach(objMaLoi => {
                    objResDVT["tlpp_ma_loi_" + objMaLoi.id] = objResDVT.thanh_pham_quantity == 0 ? 0 : objResDVT["phe_pham_ma_loi_" + objMaLoi.id] / objResDVT.thanh_pham_quantity;

                    objResDVT["tlpp_ma_loi_" + objMaLoi.id] = constFormat.roundNumber(objResDVT["tlpp_ma_loi_" + objMaLoi.id], 4);
                });

                objResDVT.tlpp_total = objResDVT.thanh_pham_quantity == 0 ? 0 : objResDVT.phe_pham_total / objResDVT.thanh_pham_quantity;
                objResDVT.tlpp_total = constFormat.roundNumber(objResDVT.tlpp_total, 4);
                
                roundNumberObjectByKey(objResDVT, arrKeyTotal, 2);

                arrResult.push(objResDVT);
            });

            return arrResult;
        }

        const calcTLPPPercent = (_objRes) =>{
            if(_objRes.thanh_pham_3lyqc != 0){
                _objRes.tlpp_percent = (_objRes.loai_b_3lyqc + _objRes.phe_pham_3lyqc) / _objRes.thanh_pham_3lyqc;

                _objRes.tlpp_percent = constFormat.roundNumber(_objRes.tlpp_percent, 4);
            }
        };

        const calcNSTBTam3LyQC = (_objRes) =>{
            if(_objRes.so_ca != 0){
                _objRes.nstb_tam_3ly_qc_ca = _objRes.thanh_pham_3lyqc / _objRes.so_ca;

                _objRes.nstb_tam_3ly_qc_ca = constFormat.roundNumber(_objRes.nstb_tam_3ly_qc_ca, 2);
            }
        };

        const decodeNhomKeHoach = (_objRes) =>{
            if(!!_objRes.nhom_ke_hoach_display){
                _objRes.nhom_ke_hoach_display = _objRes.nhom_ke_hoach_display.replaceAll("&gt;", ">").replaceAll("&lt;", "<");
            }
            if(!!_objRes.nhom_ke_hoach){
                _objRes.nhom_ke_hoach = _objRes.nhom_ke_hoach.toString().replaceAll("&gt;", ">").replaceAll("&lt;", "<");
            }
            
        }

        const roundNumberObjectByKey = (_objRes, _arrKey, _precision = 4) =>{
            _arrKey.forEach(_keyId =>{
                _objRes[_keyId] = constFormat.roundNumber(_objRes[_keyId], _precision);
            });
        }

        return _export;
    });
