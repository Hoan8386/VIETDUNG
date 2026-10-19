/**
 * Nội dung:
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  28 Aug 2025         Khanh Tran			    Init, create file. Phát triển báo cáo kết quả mục tiêu sản xuất ACP, form mr.TMPhúc(https://app.clickup.com/t/86d04224z)
 */
define([
    '../lib/scv_lib_function.js',
    '../cons/scv_cons_format.js',
],
    (
        lbf,
        constFormat
    ) => {
        const _export = {
            params: {},
            arrMfgProdResultSS01: [],
            arrMfgScrapSS02: [],
            arrInspectionResultACPSummary: [],
            arrQcResultSS03: [],
            arrWorkbenchSS04: [],
            ReportType: {
                _01BeforeQcTarget:{
                    ID: 1,
                    NAME: "Mục tiêu sản xuất trước QC"
                },
                _02AfterQcTarget:{
                    ID: 2,
                    NAME: "Mục tiêu sản xuất sau QC"
                }
            }
        };

        _export.getDataReportType = function(){
            return [
                {value: this.ReportType._01BeforeQcTarget.ID, text: this.ReportType._01BeforeQcTarget.NAME},
                {value: this.ReportType._02AfterQcTarget.ID, text: this.ReportType._02AfterQcTarget.NAME}
            ];
        }
        
        _export.getColumns = function (_rptTypeId, _periodTypeId) {
            let maskFormatPre2 = '#,##0.00';
            let arrColumns = [
                { caption: 'Máy', dataField: 'may', dataType: 'string', width: 180 },
                { caption: 'Dòng sản phẩm', dataField: 'dong_san_pham', dataType: 'string', width: 150},
                {
                    caption: 'Thời gian',
                    alignment: 'center',
                    columns: [
                        {
                            caption: 'Thời gian chạy máy',
                            columns: [
                                { dataField: 'tg_chay_may', caption: '(Giờ)', dataType: 'number', format: maskFormatPre2, width: 120 }
                            ]
                            
                        },
                        {
                            caption: 'Thời gian gián đoạn',
                            columns: [
                                { dataField: 'tg_gian_doan', caption: '(Giờ)', dataType: 'number', format: maskFormatPre2, width: 120 }
                            ]
                            
                        },
                        {
                            caption: 'Tổng thời gian',
                            columns: [
                                { dataField: 'tong_tg', caption: '(Giờ)', dataType: 'number', format: maskFormatPre2, width: 120 }
                            ]
                            
                        }
                    ]
                },
                {
                    caption: 'Thành phẩm tấm',
                    columns: [
                        { dataField: 'thanh_pham_tam', caption: '(Tấm)', dataType: 'number', format: maskFormatPre2, width: 120 } 
                    ]
                },
                {
                    caption: 'Công suất máy',
                    columns: [
                        { 
                            caption: 'Mục tiêu', 
                            columns: [
                                { dataField: 'csm_muc_tieu',  caption: '(Tấm 3ly KC)', dataType: 'number', format: maskFormatPre2, width: 120 }
                            ] 
                        },
                        { 
                            caption: 'Thực tế',    
                            columns: [
                                { dataField: 'csm_thuc_te',  caption: '(Tấm 3ly KC)', dataType: 'number', format: maskFormatPre2, width: 120 }
                            ] 
                        },
                        { 
                            caption: 'Chênh lệch', 
                            columns: [
                                { dataField: 'csm_chenh_lech',  caption: '(Tấm 3ly KC)', dataType: 'number', format: maskFormatPre2, width: 120 }
                            ] 
                        }
                    ]
                },
                {
                    caption: 'Năng suất máy',
                    columns: [
                        { 
                            caption: 'Mục tiêu', 
                            columns: [
                                { dataField: 'nsm_muc_tieu',  caption: '(Tấm 3ly KC/giờ)', dataType: 'number', format: maskFormatPre2, width: 120 }
                            ] 
                        },
                        { 
                            caption: 'Thực tế',    
                            columns: [
                                { dataField: 'nsm_thuc_te',  caption: '(Tấm 3ly KC/giờ)', dataType: 'number', format: maskFormatPre2, width: 120 }
                            ] 
                        },
                        { 
                            caption: 'Chênh lệch', 
                            columns: [
                                { dataField: 'nsm_chenh_lech',  caption: '(Tấm 3ly KC/giờ)', dataType: 'number', format: maskFormatPre2, width: 120 }
                            ] 
                        }
                    ]
                },
                {
                    caption: 'Tấm B (Tấm 3ly KC)',
                    columns: [
                        { 
                            caption: 'Mục tiêu', 
                            columns: [
                                { dataField: 'tamb_muc_tieu',  caption: '(Tấm 3ly KC)', dataType: 'number', format: maskFormatPre2, width: 120 }
                            ] 
                        },
                        { 
                            caption: 'Thực tế',    
                            columns: [
                                { dataField: 'tamb_thuc_te',  caption: '(Tấm 3ly KC)', dataType: 'number', format: maskFormatPre2, width: 120 }
                            ] 
                        },
                        { 
                            caption: 'Chênh lệch', 
                            columns: [
                                { dataField: 'tamb_chenh_lech',  caption: '(Tấm 3ly KC)', dataType: 'number', format: maskFormatPre2, width: 120 }
                            ] 
                        }
                    ]
                },
                {
                    caption: 'Phế phẩm',
                    columns: [
                        { 
                            caption: 'KLPP', 
                            columns: [
                                { dataField: 'pp_klpp',  caption: '(Kg)', dataType: 'number', format: maskFormatPre2, width: 120 }
                            ] 
                        },
                        { 
                            caption: 'KLPP quy đổi',    
                            columns: [
                                { dataField: 'pp_tam_3ly_kc',  caption: '(Tấm 3ly KC)', dataType: 'number', format: maskFormatPre2, width: 120 }
                            ] 
                        },
                        { 
                            caption: 'Mục tiêu TLPP', 
                            columns: [
                                { dataField: 'pp_muc_tieu_tlpp',  caption: '%', dataType: 'number', format: maskFormatPre2, width: 120 }
                            ] 
                        },
                        { 
                            caption: 'Thực tế TLPP', 
                            columns: [
                                { dataField: 'pp_thuc_te_tlpp',  caption: '%', dataType: 'number', format: maskFormatPre2, width: 120 }
                            ] 
                        },
                        { 
                            caption: 'Chênh lệch TLPP', 
                            columns: [
                                { dataField: 'pp_chenh_lech_tlpp',  caption: '%', dataType: 'number', format: maskFormatPre2, width: 120 }
                            ] 
                        }
                    ]
                },
                {
                    caption: 'Nhựa tấm',
                    columns: [
                        { 
                            caption: 'Mục tiêu', 
                            columns: [
                                { dataField: 'nt_muc_tieu',  caption: 'Kg', dataType: 'number', format: maskFormatPre2, width: 120 }
                            ] 
                        },
                        { 
                            caption: 'Thực tế',    
                            columns: [
                                { dataField: 'nt_thuc_te',  caption: 'Kg', dataType: 'number', format: maskFormatPre2, width: 120 }
                            ] 
                        },
                        { 
                            caption: 'Chênh lệch', 
                            columns: [
                                { dataField: 'nt_chenh_lech',  caption: 'Kg', dataType: 'number', format: maskFormatPre2, width: 120 }
                            ] 
                        }
                    ]
                },
                {
                    caption: 'Nhôm vụn',
                    columns: [
                        { dataField: 'nhom_vun', caption: 'Kg', dataType: 'number', format: maskFormatPre2, width: 120 } 
                    ]
                }
            
            ];

            arrColumns.forEach(objCol => {
                objCol.headerStyle = {
                    "background-color": "#fffff0"
                }
                objCol?.columns?.forEach(objColChild => {
                    objColChild.headerStyle = {
                        "background-color": "#fffff0"
                    }

                    objColChild?.columns?.forEach(objColChild2 => {
                        objColChild2.headerStyle = {
                            "background-color": "#fffff0"
                        }
                    });
                });
            });

            return arrColumns;
        }

        _export.setDataInput = function ({
            params = {},
            arrMfgProdResultSS01 = [], 
            arrMfgScrapSS02 = [], 
            arrQcResultSS03 = [],
            arrWorkbenchSS04 = [],
        }) {
            this.params = params;
            this.arrMfgProdResultSS01 = arrMfgProdResultSS01;
            this.arrMfgScrapSS02 = arrMfgScrapSS02;
            this.arrQcResultSS03 = arrQcResultSS03;
            this.arrWorkbenchSS04 = arrWorkbenchSS04;
        }

        _export.getDataSourceResult = function() {
            let arrResult = [], arrSummary = [];
            
            if(this.params.custpage_rpttype == this.ReportType._01BeforeQcTarget.ID) {
                arrSummary = [this.arrMfgProdResultSS01, this.arrMfgScrapSS02].flat();
                arrResult = this.getDataResultMappedType1(arrSummary);
            }
            else if(this.params.custpage_rpttype == this.ReportType._02AfterQcTarget.ID) {
                arrSummary = [this.arrMfgProdResultSS01, this.arrMfgScrapSS02, this.arrQcResultSS03].flat();
                arrResult = this.getDataResultMappedType2(arrSummary);
            }
            
            return arrResult;
        }

        _export.getDataResultMappedType1 = function(arrSummary) {
            let arrSummary_grp = lbf.onGroupByArray(arrSummary, ['wo_center_display', 'nhom_ke_hoach_display']);
            let arrDT = [], arrDT_grp = [], arrResult = [];
            let arrColumnFlat = this.getColumnFlat();

            arrSummary_grp.sort((a, b) => {
                return (a.wo_center_display ?? '').localeCompare(b.wo_center_display ?? '', 'vi', { numeric: true, sensitivity: 'base' }) ||
                    (a.nhom_ke_hoach_display ?? '').localeCompare(b.nhom_ke_hoach_display ?? '', 'vi', { numeric: true, sensitivity: 'base' });
            });

            arrSummary_grp.forEach(objGrp => {
                let arrSummary_ft = arrSummary.filter(e => e.wo_center_display == objGrp.wo_center_display && e.nhom_ke_hoach_display == objGrp.nhom_ke_hoach_display);
                let objDT011 = {
                    idxRow: lbf.uuidv4(),
                    idxRowParent: -1,
                    lvl: 2,
                    may: objGrp.wo_center_display,
                    wo_center_display: objGrp.wo_center_display,
                    dong_san_pham: objGrp.nhom_ke_hoach_display,

                    std_rate_unit_hr: 0,
                    tam_b_3ly_kc_hr: 0,
                    pp_muc_tieu_tlpp: 0,
                    nhua_tam_kg_hr: 0,
                };
                
                arrSummary_ft.forEach(obj =>{
                    [
                        "thoi_gian_san_xuat", "thoi_gian_gian_doan",
                        "thanh_pham", "thanh_pham_3lyqc",
                        "loai_b_3lyqc", "phe_pham", "phe_pham_3lyqc",
                        "nhua_tam", "nhom_vun"
                    ].forEach(keyId =>{
                        objDT011[keyId] = (objDT011[keyId] || 0) + (obj[keyId] * 1 || 0);
                    });

                    let objSS4_f = this.arrWorkbenchSS04.find(e => e.wo_center == obj.wo_center && e.nhom_ke_hoach == obj.nhom_ke_hoach);

                    if(!objSS4_f) return;
                    
                    objDT011.std_rate_unit_hr = objSS4_f.std_rate_unit_hr * 1;
                    objDT011.tam_b_3ly_kc_hr = objSS4_f.tam_b_3ly_kc_hr * 1;
                    objDT011.pp_muc_tieu_tlpp = objSS4_f.ty_le_phe_pham * 1;
                    objDT011.nhua_tam_kg_hr = objSS4_f.nhua_tam_kg_hr * 1;
                });
                
                objDT011.tg_gian_doan = objDT011.thoi_gian_gian_doan;
                objDT011.tong_tg = objDT011.thoi_gian_san_xuat;
                objDT011.tg_chay_may = objDT011.tong_tg - objDT011.tg_gian_doan;
                objDT011.tg_chay_may = objDT011.tg_chay_may > 0 ? objDT011.tg_chay_may : 0;

                objDT011.thanh_pham_tam = objDT011.thanh_pham;

                objDT011.csm_muc_tieu = objDT011.tong_tg * objDT011.std_rate_unit_hr;
                objDT011.csm_thuc_te = objDT011.thanh_pham_3lyqc;
                objDT011.csm_chenh_lech = objDT011.csm_thuc_te - objDT011.csm_muc_tieu;

                objDT011.nsm_muc_tieu = objDT011.std_rate_unit_hr;
                objDT011.nsm_thuc_te = objDT011.tong_tg ? objDT011.csm_thuc_te / objDT011.tong_tg : 0;
                objDT011.nsm_chenh_lech = objDT011.nsm_thuc_te - objDT011.nsm_muc_tieu;

                objDT011.tamb_muc_tieu = objDT011.tong_tg * objDT011.tam_b_3ly_kc_hr;
                objDT011.tamb_thuc_te = objDT011.loai_b_3lyqc;
                objDT011.tamb_chenh_lech = objDT011.tamb_muc_tieu - objDT011.tamb_thuc_te;

                objDT011.pp_klpp = objDT011.phe_pham;
                objDT011.pp_tam_3ly_kc = objDT011.phe_pham_3lyqc;
                // objDT011.pp_muc_tieu_tlpp = ;
                objDT011.pp_thuc_te_tlpp = objDT011.csm_thuc_te ? ((objDT011.tamb_thuc_te + objDT011.pp_tam_3ly_kc) * 100) / objDT011.csm_thuc_te : 0;
                objDT011.pp_chenh_lech_tlpp =  objDT011.pp_muc_tieu_tlpp - objDT011.pp_thuc_te_tlpp;

                objDT011.nt_muc_tieu = objDT011.tong_tg * objDT011.nhua_tam_kg_hr;
                objDT011.nt_thuc_te = objDT011.nhua_tam;
                objDT011.nt_chenh_lech = objDT011.nt_muc_tieu - objDT011.nt_thuc_te;

                objDT011.nhom_vun = objDT011.nhom_vun;

                arrColumnFlat.forEach((objCol) => {
                    if(objCol.dataType == "number"){
                        let value = objDT011[objCol.dataField];

                        objDT011[objCol.dataField] = constFormat.roundNumber(value, 2);
                    }
                });

                arrDT.push(objDT011);
            });
            
            arrDT_grp = lbf.onGroupByArray(arrDT, ['wo_center_display']);

            let objTtl = {
                dong_san_pham: "Tổng cộng",
                idxRow: lbf.uuidv4(),  
                idxRowParent: -1,
                lvl: 1,
                rowPreparedData: {
                    style: {fontWeight: "bold"}
                },

                nsm_muc_tieu: 0,
                nsm_thuc_te: 0,
                nsm_chenh_lech: 0,
                pp_muc_tieu_tlpp: 0,
                pp_thuc_te_tlpp: 0,
                pp_chenh_lech_tlpp: 0,
            }

            arrDT_grp.forEach(objGrp => {
                let arrDT_ft = arrDT.filter(e => e.wo_center_display == objGrp.wo_center_display);
                let objRes = {
                    may: objGrp.wo_center_display,
                    dong_san_pham: "Tổng cộng",
                    idxRow: lbf.uuidv4(),  
                    idxRowParent: -1,
                    lvl: 1,
                    rowPreparedData: {
                        style: {fontWeight: "bold"}
                    },

                    nsm_muc_tieu: 0,
                    nsm_thuc_te: 0,
                    nsm_chenh_lech: 0,
                    pp_muc_tieu_tlpp: 0,
                    pp_thuc_te_tlpp: 0,
                    pp_chenh_lech_tlpp: 0,
                }

                arrDT_ft.forEach(objDT011 =>{
                    objDT011.dong_san_pham = objDT011.dong_san_pham? objDT011.dong_san_pham.replaceAll("&gt;", ">").replaceAll("&lt;", "<") : '';
                    objDT011.idxRowParent = objRes.idxRow;
                    arrResult.push(objDT011);

                    [
                        "tg_chay_may", "tg_gian_doan", "tong_tg",
                        "thanh_pham_tam",
                        "csm_muc_tieu", "csm_thuc_te", "csm_chenh_lech",
                        "tamb_muc_tieu", "tamb_thuc_te", "tamb_chenh_lech",
                        "pp_klpp", "pp_tam_3ly_kc",
                        "nt_muc_tieu", "nt_thuc_te", "nt_chenh_lech",
                        "nhom_vun"
                    ].forEach(keyId =>{
                        objRes[keyId] = (objRes[keyId] || 0) + (objDT011[keyId] * 1 || 0);
                    });

                    objRes.nsm_muc_tieu += (objDT011.nsm_muc_tieu * objDT011.tong_tg);
                    objRes.nsm_thuc_te += (objDT011.nsm_thuc_te * objDT011.tong_tg);
                    objRes.nsm_chenh_lech += (objDT011.nsm_chenh_lech * objDT011.tong_tg);

                    objRes.pp_muc_tieu_tlpp += (objDT011.pp_muc_tieu_tlpp * objDT011.tong_tg);
                });
                
                objRes.nsm_muc_tieu = objRes.tong_tg ? objRes.nsm_muc_tieu / objRes.tong_tg : 0;
                objRes.nsm_thuc_te = objRes.tong_tg ? objRes.nsm_thuc_te / objRes.tong_tg : 0;
                objRes.nsm_chenh_lech = objRes.nsm_thuc_te - objRes.nsm_muc_tieu;

                objRes.pp_muc_tieu_tlpp = objRes.tong_tg ? objRes.pp_muc_tieu_tlpp / objRes.tong_tg : 0;
                objRes.pp_thuc_te_tlpp = objRes.csm_thuc_te ? (objRes.tamb_thuc_te + objRes.pp_tam_3ly_kc) * 100 / objRes.csm_thuc_te : 0;
                objRes.pp_chenh_lech_tlpp = objRes.pp_muc_tieu_tlpp - objRes.pp_thuc_te_tlpp;

                arrColumnFlat.forEach((objCol) => {
                    if(objCol.dataType == "number"){
                        let value = objRes[objCol.dataField];

                        objRes[objCol.dataField] = constFormat.roundNumber(value, 2);
                    }
                });
                
                arrResult.push(objRes);

                [
                    "tg_chay_may", "tg_gian_doan", "tong_tg",
                    "thanh_pham_tam",
                    "csm_muc_tieu", "csm_thuc_te", "csm_chenh_lech",
                    "tamb_muc_tieu", "tamb_thuc_te", "tamb_chenh_lech",
                    "pp_klpp", "pp_tam_3ly_kc",
                    "nt_muc_tieu", "nt_thuc_te", "nt_chenh_lech",
                    "nhom_vun"
                ].forEach(keyId =>{
                    objTtl[keyId] = (objTtl[keyId] || 0) + (objRes[keyId] * 1 || 0);
                });

                objTtl.nsm_muc_tieu += (objRes.nsm_muc_tieu * objRes.tong_tg);
                objTtl.nsm_thuc_te += (objRes.nsm_thuc_te * objRes.tong_tg);
                objTtl.nsm_chenh_lech += (objRes.nsm_chenh_lech * objRes.tong_tg);

                objTtl.pp_muc_tieu_tlpp += (objRes.pp_muc_tieu_tlpp * objRes.tong_tg);
            });

            objTtl.nsm_muc_tieu = objTtl.tong_tg ? objTtl.nsm_muc_tieu / objTtl.tong_tg : 0;
            objTtl.nsm_thuc_te = objTtl.tong_tg ? objTtl.nsm_thuc_te / objTtl.tong_tg : 0;
            objTtl.nsm_chenh_lech = objTtl.nsm_thuc_te - objTtl.nsm_muc_tieu;

            objTtl.pp_muc_tieu_tlpp = objTtl.tong_tg ? objTtl.pp_muc_tieu_tlpp / objTtl.tong_tg : 0;
            objTtl.pp_thuc_te_tlpp = objTtl.csm_thuc_te ? (objTtl.tamb_thuc_te + objTtl.pp_tam_3ly_kc) * 100 / objTtl.csm_thuc_te : 0;
            objTtl.pp_chenh_lech_tlpp = objTtl.pp_muc_tieu_tlpp - objTtl.pp_thuc_te_tlpp;

            arrResult.push(objTtl);

            return arrResult;
        }

         _export.getDataResultMappedType2 = function(arrSummary) {
            let arrSummary_grp = lbf.onGroupByArray(arrSummary, ['wo_center_display', 'nhom_ke_hoach_display']);
            let arrDT = [], arrDT_grp = [], arrResult = [];
            let arrColumnFlat = this.getColumnFlat();

            arrSummary_grp.sort((a, b) => {
                return (a.wo_center_display ?? '').localeCompare(b.wo_center_display ?? '', 'vi', { numeric: true, sensitivity: 'base' }) ||
                    (a.nhom_ke_hoach_display ?? '').localeCompare(b.nhom_ke_hoach_display ?? '', 'vi', { numeric: true, sensitivity: 'base' });
            });

            arrSummary_grp.forEach(objGrp => {
                let arrSummary_ft = arrSummary.filter(e => e.wo_center_display == objGrp.wo_center_display && e.nhom_ke_hoach_display == objGrp.nhom_ke_hoach_display);
                let objDT021 = {
                    idxRow: lbf.uuidv4(),
                    idxRowParent: -1,
                    lvl: 2,
                    may: objGrp.wo_center_display,
                    wo_center_display: objGrp.wo_center_display,
                    dong_san_pham: objGrp.nhom_ke_hoach_display,

                    std_rate_unit_hr: 0,
                    tam_b_3ly_kc_hr: 0,
                    pp_muc_tieu_tlpp: 0,
                    nhua_tam_kg_hr: 0,
                };
                
                arrSummary_ft.forEach(obj =>{
                    [
                        "thoi_gian_san_xuat", "thoi_gian_gian_doan",
                        "thanh_pham", "thanh_pham_3lyqc",
                        "thanh_pham_dat_chat_luong", "thanh_pham_3lyqc_dat_chat_luong",
                        "loai_b_3lyqc", "phe_pham", "phe_pham_3lyqc",
                        "nhua_tam", "nhom_vun"
                    ].forEach(keyId =>{
                        objDT021[keyId] = (objDT021[keyId] || 0) + (obj[keyId] * 1 || 0);
                    });

                    let objSS4_f = this.arrWorkbenchSS04.find(e => e.wo_center == obj.wo_center && e.nhom_ke_hoach == obj.nhom_ke_hoach);

                    if(!objSS4_f) return;
                    
                    objDT021.std_rate_unit_hr = objSS4_f.std_rate_unit_hr * 1;
                    objDT021.tam_b_3ly_kc_hr = objSS4_f.tam_b_3ly_kc_hr * 1;
                    objDT021.pp_muc_tieu_tlpp = objSS4_f.ty_le_phe_pham * 1;
                    objDT021.nhua_tam_kg_hr = objSS4_f.nhua_tam_kg_hr * 1;
                });
                
                objDT021.tg_gian_doan = objDT021.thoi_gian_gian_doan;
                objDT021.tong_tg = objDT021.thoi_gian_san_xuat;
                objDT021.tg_chay_may = objDT021.tong_tg - objDT021.tg_gian_doan;
                objDT021.tg_chay_may = objDT021.tg_chay_may > 0 ? objDT021.tg_chay_may : 0;

                objDT021.thanh_pham_tam = objDT021.thanh_pham_dat_chat_luong;

                objDT021.csm_muc_tieu = objDT021.tong_tg * objDT021.std_rate_unit_hr;
                objDT021.csm_thuc_te = objDT021.thanh_pham_3lyqc_dat_chat_luong;
                objDT021.csm_chenh_lech = objDT021.csm_thuc_te - objDT021.csm_muc_tieu;

                objDT021.nsm_muc_tieu = objDT021.std_rate_unit_hr;
                objDT021.nsm_thuc_te = objDT021.tong_tg ? objDT021.csm_thuc_te / objDT021.tong_tg : 0;
                objDT021.nsm_chenh_lech = objDT021.nsm_thuc_te - objDT021.nsm_muc_tieu;

                objDT021.tamb_muc_tieu = objDT021.tong_tg * objDT021.tam_b_3ly_kc_hr;
                objDT021.tamb_thuc_te = objDT021.loai_b_3lyqc;
                objDT021.tamb_chenh_lech = objDT021.tamb_muc_tieu - objDT021.tamb_thuc_te;

                objDT021.pp_klpp = objDT021.phe_pham;
                objDT021.pp_tam_3ly_kc = objDT021.phe_pham_3lyqc;
                // objDT021.pp_muc_tieu_tlpp = ;
                objDT021.pp_thuc_te_tlpp = objDT021.csm_thuc_te ? ((objDT021.tamb_thuc_te + objDT021.pp_tam_3ly_kc) * 100) / objDT021.csm_thuc_te : 0;
                objDT021.pp_chenh_lech_tlpp =  objDT021.pp_muc_tieu_tlpp - objDT021.pp_thuc_te_tlpp;

                objDT021.nt_muc_tieu = objDT021.tong_tg * objDT021.nhua_tam_kg_hr;
                objDT021.nt_thuc_te = objDT021.nhua_tam;
                objDT021.nt_chenh_lech = objDT021.nt_muc_tieu - objDT021.nt_thuc_te;

                objDT021.nhom_vun = objDT021.nhom_vun;

                arrColumnFlat.forEach((objCol) => {
                    if(objCol.dataType == "number"){
                        let value = objDT021[objCol.dataField];

                        objDT021[objCol.dataField] = constFormat.roundNumber(value, 2);
                    }
                });

                arrDT.push(objDT021);
            });
            
            arrDT_grp = lbf.onGroupByArray(arrDT, ['wo_center_display']);

            let objTtl = {
                dong_san_pham: "Tổng cộng",
                idxRow: lbf.uuidv4(),  
                idxRowParent: -1,
                lvl: 1,
                rowPreparedData: {
                    style: {fontWeight: "bold"}
                },

                nsm_muc_tieu: 0,
                nsm_thuc_te: 0,
                nsm_chenh_lech: 0,
                pp_muc_tieu_tlpp: 0,
                pp_thuc_te_tlpp: 0,
                pp_chenh_lech_tlpp: 0,
            }

            arrDT_grp.forEach(objGrp => {
                let arrDT_ft = arrDT.filter(e => e.wo_center_display == objGrp.wo_center_display);
                let objRes = {
                    may: objGrp.wo_center_display,
                    dong_san_pham: "Tổng cộng",
                    idxRow: lbf.uuidv4(),  
                    idxRowParent: -1,
                    lvl: 1,
                    rowPreparedData: {
                        style: {fontWeight: "bold"}
                    },

                    nsm_muc_tieu: 0,
                    nsm_thuc_te: 0,
                    nsm_chenh_lech: 0,
                    pp_muc_tieu_tlpp: 0,
                    pp_thuc_te_tlpp: 0,
                    pp_chenh_lech_tlpp: 0,
                }

                arrDT_ft.forEach(objDT021 =>{
                    objDT021.dong_san_pham = objDT021.dong_san_pham? objDT021.dong_san_pham.replaceAll("&gt;", ">").replaceAll("&lt;", "<") : '';
                    objDT021.idxRowParent = objRes.idxRow;
                    arrResult.push(objDT021);

                    [
                        "tg_chay_may", "tg_gian_doan", "tong_tg",
                        "thanh_pham_tam",
                        "csm_muc_tieu", "csm_thuc_te", "csm_chenh_lech",
                        "tamb_muc_tieu", "tamb_thuc_te", "tamb_chenh_lech",
                        "pp_klpp", "pp_tam_3ly_kc",
                        "nt_muc_tieu", "nt_thuc_te", "nt_chenh_lech",
                        "nhom_vun"
                    ].forEach(keyId =>{
                        objRes[keyId] = (objRes[keyId] || 0) + (objDT021[keyId] * 1 || 0);
                    });

                    objRes.nsm_muc_tieu += (objDT021.nsm_muc_tieu * objDT021.tong_tg);
                    objRes.nsm_thuc_te += (objDT021.nsm_thuc_te * objDT021.tong_tg);
                    objRes.nsm_chenh_lech += (objDT021.nsm_chenh_lech * objDT021.tong_tg);

                    objRes.pp_muc_tieu_tlpp += (objDT021.pp_muc_tieu_tlpp * objDT021.tong_tg);
                });
                
                objRes.nsm_muc_tieu = objRes.tong_tg ? objRes.nsm_muc_tieu / objRes.tong_tg : 0;
                objRes.nsm_thuc_te = objRes.tong_tg ? objRes.nsm_thuc_te / objRes.tong_tg : 0;
                objRes.nsm_chenh_lech = objRes.nsm_thuc_te - objRes.nsm_muc_tieu;

                objRes.pp_muc_tieu_tlpp = objRes.tong_tg ? objRes.pp_muc_tieu_tlpp / objRes.tong_tg : 0;
                objRes.pp_thuc_te_tlpp = objRes.csm_thuc_te ? (objRes.tamb_thuc_te + objRes.pp_tam_3ly_kc) * 100 / objRes.csm_thuc_te : 0;
                objRes.pp_chenh_lech_tlpp = objRes.pp_muc_tieu_tlpp - objRes.pp_thuc_te_tlpp;

                arrColumnFlat.forEach((objCol) => {
                    if(objCol.dataType == "number"){
                        let value = objRes[objCol.dataField];

                        objRes[objCol.dataField] = constFormat.roundNumber(value, 2);
                    }
                });
                
                arrResult.push(objRes);

                [
                    "tg_chay_may", "tg_gian_doan", "tong_tg",
                    "thanh_pham_tam",
                    "csm_muc_tieu", "csm_thuc_te", "csm_chenh_lech",
                    "tamb_muc_tieu", "tamb_thuc_te", "tamb_chenh_lech",
                    "pp_klpp", "pp_tam_3ly_kc",
                    "nt_muc_tieu", "nt_thuc_te", "nt_chenh_lech",
                    "nhom_vun"
                ].forEach(keyId =>{
                    objTtl[keyId] = (objTtl[keyId] || 0) + (objRes[keyId] * 1 || 0);
                });

                objTtl.nsm_muc_tieu += (objRes.nsm_muc_tieu * objRes.tong_tg);
                objTtl.nsm_thuc_te += (objRes.nsm_thuc_te * objRes.tong_tg);
                objTtl.nsm_chenh_lech += (objRes.nsm_chenh_lech * objRes.tong_tg);

                objTtl.pp_muc_tieu_tlpp += (objRes.pp_muc_tieu_tlpp * objRes.tong_tg);
            });

            objTtl.nsm_muc_tieu = objTtl.tong_tg ? objTtl.nsm_muc_tieu / objTtl.tong_tg : 0;
            objTtl.nsm_thuc_te = objTtl.tong_tg ? objTtl.nsm_thuc_te / objTtl.tong_tg : 0;
            objTtl.nsm_chenh_lech = objTtl.nsm_thuc_te - objTtl.nsm_muc_tieu;

            objTtl.pp_muc_tieu_tlpp = objTtl.tong_tg ? objTtl.pp_muc_tieu_tlpp / objTtl.tong_tg : 0;
            objTtl.pp_thuc_te_tlpp = objTtl.csm_thuc_te ? (objTtl.tamb_thuc_te + objTtl.pp_tam_3ly_kc) * 100 / objTtl.csm_thuc_te : 0;
            objTtl.pp_chenh_lech_tlpp = objTtl.pp_muc_tieu_tlpp - objTtl.pp_thuc_te_tlpp;

            arrResult.push(objTtl);

            return arrResult;
        }

        _export.getColumnFlat = function(){
            let params = this.params;
            let arrColumnGrid = this.getColumns(params.custpage_rpttype);

            return _scvExcelJS.extendGridColumnFlat(arrColumnGrid);
        }

        return _export;
    });
