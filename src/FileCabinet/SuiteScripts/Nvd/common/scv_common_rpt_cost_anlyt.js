/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  03 Nov 2025         Huy Pham			    Init, create file, Phát triển báo cáo phân tích giá thành, from mr.Trương Minh phúc(https://app.clickup.com/t/86d0tym86)
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
            arrResValue01: [],
            arrResDetail02: [],
            arrResSummary03: [],
            arrResBomForWO04: [],
            ReportType: {
                _01GiaThanhTheoGiaTri:{
                    ID: 1,
                    NAME: "Giá thành theo giá trị"
                },
                _02GiaThanhTheoSoLuong:{
                    ID: 2,
                    NAME: "Giá thành theo số lượng"
                },
            },
        };

        _export.getDataReportType = function(){
            return [
                {value: this.ReportType._01GiaThanhTheoGiaTri.ID, text: this.ReportType._01GiaThanhTheoGiaTri.NAME},
                {value: this.ReportType._02GiaThanhTheoSoLuong.ID, text: this.ReportType._02GiaThanhTheoSoLuong.NAME},
            ];
        }

        _export.getColumns = function (_params) {
            let maskFormatPre2 = constFormat.getTemplateFormatNumber(2);
            let maskFormatPre2_percent = maskFormatPre2 + "%";
            let numFmtXlsPre2 = "###,##0.00";
            let numFmtXlsPerPre2_percent = "0.00%";

            let arrColumns = [];
            
            let arrPeriod = this.getYearMonthRange(_params);

            if(_params.custpage_rpttype == this.ReportType._01GiaThanhTheoGiaTri.ID) {
                arrColumns = [
                    {dataField: 'col_stt', caption: 'STT', dataType: "string", width: 120},
                    {dataField: 'col_item_code', caption: 'Mã vật tư, hàng hóa', dataType: "string", width: 210},
                    {dataField: 'col_item_display', caption: 'Tên vật tư, hàng hóa', dataType: "string", minWidth: 210},
                    {dataField: 'col_unit_display', caption: 'Đơn vị tính', dataType: "string", width: 100},
                ];

                arrPeriod.forEach((objMonth) => {
                    arrColumns.push(
                        {
                            caption: objMonth.name,
                            columns: [
                                {dataField: 'col_period_'+ objMonth.yyyymm + '_quantity', caption: 'Số lượng', dataType: "number", format: maskFormatPre2, formatXls: numFmtXlsPre2, width: 120},
                                {dataField: 'col_period_'+ objMonth.yyyymm + '_rate', caption: 'Đơn giá', dataType: "number", format: maskFormatPre2, formatXls: numFmtXlsPre2, width: 120},
                                {dataField: 'col_period_'+ objMonth.yyyymm + '_amount', caption: 'Giá trị', dataType: "number", format: maskFormatPre2, formatXls: numFmtXlsPre2, width: 180},
                            ]
                        }
                    );
                });
            }
            else if(_params.custpage_rpttype == this.ReportType._02GiaThanhTheoSoLuong.ID) {
                arrColumns = [
                    {dataField: 'col_stt', caption: 'STT', dataType: "string", width: 120},
                    {dataField: 'col_nhom_cap_2_display', caption: 'Phân loại NVL/CP', dataType: "string", width: 150},
                    {dataField: 'col_item_display', caption: 'NVL/CP tiêu hao', dataType: "string", minWidth: 210},
                    {dataField: 'col_unit_display', caption: 'Đơn vị tính', dataType: "string", width: 100},
                ];

                arrPeriod.forEach((objMonth) => {
                    arrColumns.push(
                        {
                            caption: objMonth.name,
                            columns: [
                                {
                                    caption: "Tiêu hao 1 sản phẩm",
                                    columns: [
                                        {dataField: 'col_period_' + objMonth.yyyymm + '_plan', caption: 'Định mức', dataType: "number", format: maskFormatPre2, formatXls: numFmtXlsPre2, width: 180},
                                        {dataField: 'col_period_' + objMonth.yyyymm + '_actual', caption: 'Thực tế', dataType: "number", format: maskFormatPre2, formatXls: numFmtXlsPre2, width: 180},
                                        {dataField: 'col_period_' + objMonth.yyyymm + '_percent', caption: 'Tỷ lệ tiêu hao (%)', dataType: "number", format: maskFormatPre2_percent, formatXls: numFmtXlsPerPre2_percent, width: 150},
                                    ]
                                },
                                {dataField: 'col_period_' + objMonth.yyyymm + '_cost', caption: 'Giá vốn đơn vị', dataType: "number", format: maskFormatPre2, formatXls: numFmtXlsPre2, width: 150},
                            ]
                        }
                    );
                });
            }

            arrColumns.forEach(objCol => {
                objCol.headerStyle = {
                    "background-color": "#FFFFF0"
                };
                objCol.columns?.forEach(objColChild => {
                    objColChild.headerStyle = {
                        "background-color": "#FFFFF0"
                    };

                    objColChild.columns?.forEach(objColChild_2 => {
                        objColChild_2.headerStyle = {
                            "background-color": "#FFFFF0"
                        }
                    });
                });
            });

            return arrColumns;
        }

        _export.getYearMonthRange = function(_params) {
            let arrResult = constFormat.getMonthRanges(_params.custpage_fromdt, _params.custpage_todt);

            arrResult.forEach((objMonth, idx) => {
                objMonth.yyyy = constFormat.getYYYY(objMonth.start);
                objMonth.mm = constFormat.getMM(objMonth.start);
                objMonth.yyyymm = objMonth.yyyy + objMonth.mm;
                objMonth.name = objMonth.mm + "/" + objMonth.yyyy;
            });

            return arrResult;
        };

        _export.setDataInput = function ({
            params = {},
            arrResValue01 = [],
            arrResDetail02 = [],
            arrResSummary03 = [],
            arrResBomForWO04 = [],
        }) {
            this.params = params;
            this.arrResValue01 = arrResValue01;
            this.arrResDetail02 = arrResDetail02;
            this.arrResSummary03 = arrResSummary03;
            this.arrResBomForWO04 = arrResBomForWO04;
        }

        _export.getDataSourceResult = function() {
            let arrResult = [];

            if(this.params.custpage_rpttype == this.ReportType._01GiaThanhTheoGiaTri.ID) {
                arrResult = this.getDataSourceResultType01(this.params);
            }
            else if(this.params.custpage_rpttype == this.ReportType._02GiaThanhTheoSoLuong.ID) {
                arrResult = this.getDataSourceResultType02(this.params);
            }

            return arrResult;
        }

        _export.getDataSourceResultType01 = function(params) {
            let arrPeriod = this.getYearMonthRange(params);

            let arrGroupItem = alasql(`SELECT DISTINCT item_code, item_name, 
                units, units_display
            FROM ?
            ORDER BY item_code ASC, item_name ASC`, [
                this.arrResValue01
            ]);
            let arrResult = [];

            let objResTotal = {
                idxRow: lbf.uuidv4(),
                idxRowParent: -1,
                lvl: 1,
                col_stt: "Tổng",
                rowPreparedData: {
                    style: {
                        fontWeight: "bold",
                        backgroundColor: "#FAFAD2",
                    }
                }
            }

            arrGroupItem.forEach((objGrpItem, idxGrpItem) => {
                let objRes = {
                    idxRow: lbf.uuidv4(),
                    idxRowParent: objResTotal.idxRow,
                    lvl: 0,
                    col_stt: (idxGrpItem + 1) + "",
                    col_item_code: objGrpItem.item_code,
                    col_item_display: objGrpItem.item_name,
                    col_unit_display: objGrpItem.units_display,
                    units: objGrpItem.units,
                };

                let arrResValue01_Item = this.arrResValue01.filter(e => e.item_code == objGrpItem.item_code
                    && e.units == objGrpItem.units
                );
                
                arrPeriod.forEach((objMonth) => {
                    let keyQuantity = 'col_period_' + objMonth.yyyymm + '_quantity';
                    let keyRate = 'col_period_' + objMonth.yyyymm + '_rate';
                    let keyAmount = 'col_period_' + objMonth.yyyymm + '_amount';

                    let objResValue01 = arrResValue01_Item.find(e => e.period == objMonth.name);
                    if(!!objResValue01){
                        objRes[keyQuantity] = objResValue01.total_quantity * 1;
                        objRes[keyRate] = objResValue01.unit_cost * 1;
                        objRes[keyAmount] = objResValue01.total_amount * 1;
                    }
                    else{
                        objRes[keyQuantity] = 0;
                        objRes[keyRate] = 0;
                        objRes[keyAmount] = 0;
                    }

                    objResTotal[keyQuantity] = (objResTotal[keyQuantity]||0) + objRes[keyQuantity];
                    objResTotal[keyRate] = (objResTotal[keyRate]||0) + objRes[keyRate];
                    objResTotal[keyAmount] = (objResTotal[keyAmount]||0) + objRes[keyAmount];

                });

                arrResult.push(objRes);
            });

            arrResult.push(objResTotal);

            return arrResult;
        }

        _export.getDataSourceResultType02 = function(params) {
            let arrDT01 = [];//DT01 và DT02 gộp chung
            let arrDT03 = [];

            //#region Tính toán dữ liệu DT01
            for(let i = 0; i < this.arrResDetail02.length; i++){
                let objResDetail02 = this.arrResDetail02[i];

                let objDT01 = {
                    period: objResDetail02.period,
                    assembly: objResDetail02.assembly,
                    item_display: objResDetail02.item_display,
                    units_display: objResDetail02.units_display,
                    total_quantity: objResDetail02.total_quantity * 1,
                    total_amount: objResDetail02.total_amount * 1,
                    nhom_cap_2: objResDetail02.nhom_cap_2,
                    nhom_cap_2_display: objResDetail02.nhom_cap_2_display,
                    quantity_build: 0,//SS03
                    key_mapping_bom: objResDetail02.key_mapping_bom,
                    key_mapping: objResDetail02.key_mapping,
                    original_item_qty_bom: 0,//SS04
                    tieuhao_dinhmuc: 0,
                };

                let objResSummary03 = this.arrResSummary03.find(e => e.key_mapping == objDT01.key_mapping);
                if(!!objResSummary03){
                    objDT01.quantity_build = objResSummary03.total_quantity * 1;
                }

                let objResBomForWO04 = this.arrResBomForWO04.find(e => e.key_mapping == objDT01.key_mapping_bom);
                if(!!objResBomForWO04){
                    objDT01.original_item_qty_bom = objResBomForWO04.original_item_qty_bom * 1;
                }

                objDT01.tieuhao_dinhmuc = objDT01.quantity_build * objDT01.original_item_qty_bom;

                arrDT01.push(objDT01);
            }
            //#endregion

            //#region Tính toán dữ liệu DT03
            arrDT03 = alasql(`SELECT period, item_display, units_display,
                nhom_cap_2_display,
                SUM(total_quantity) as total_quantity,
                SUM(total_amount) as total_amount,
                SUM(tieuhao_dinhmuc) as tieuhao_dinhmuc
            FROM ?
            GROUP BY period, item_display, units_display, nhom_cap_2_display`, [
                arrDT01
            ]);
            //#endregion

            let arrPeriod = this.getYearMonthRange(params);
            let arrGroupItem = alasql(`SELECT DISTINCT nhom_cap_2_display, item_display, units_display
            FROM ?
            ORDER BY nhom_cap_2_display ASC, item_display ASC`, [
                arrDT03
            ]);

            let arrResult = [];

            let objResTotal = {
                idxRow: lbf.uuidv4(),
                idxRowParent: -1,
                lvl: 1,
                col_stt: "Tổng",
                rowPreparedData: {
                    style: {
                        fontWeight: "bold",
                        backgroundColor: "#FAFAD2",
                    }
                }
            };

            arrGroupItem.forEach((objGrpItem, idxGrpItem) => {
                let objRes = {
                    idxRow: lbf.uuidv4(),
                    idxRowParent: objResTotal.idxRow,
                    lvl: 0,
                    col_stt: (idxGrpItem + 1) + "",
                    col_nhom_cap_2_display: objGrpItem.nhom_cap_2_display,
                    col_item_display: objGrpItem.item_display,
                    col_unit_display: objGrpItem.units_display,
                };

                let arrDT03_Item = arrDT03.filter(e => e.nhom_cap_2_display == objGrpItem.nhom_cap_2_display
                    && e.item_display == objGrpItem.item_display
                    && e.units == objGrpItem.units
                );

                arrPeriod.forEach((objMonth) => {
                    let keyPlan = 'col_period_' + objMonth.yyyymm + '_plan';
                    let keyActual = 'col_period_' + objMonth.yyyymm + '_actual';
                    let keyPercent = 'col_period_' + objMonth.yyyymm + '_percent';
                    let keyCost = 'col_period_' + objMonth.yyyymm + '_cost';

                    let objDT03 = arrDT03_Item.find(e => e.period == objMonth.name);
                    if(!!objDT03){
                        objRes[keyPlan] = objDT03.tieuhao_dinhmuc * 1;
                        objRes[keyActual] = objDT03.total_quantity * 1;
                        objRes[keyCost] = objDT03.total_quantity != 0 ? objDT03.total_amount / objDT03.total_quantity : 0;
                    }
                    else{
                        objRes[keyPlan] = 0;
                        objRes[keyActual] = 0;
                        objRes[keyCost] = 0;
                    }

                    objRes[keyPercent] = 0;
                    if(objRes[keyPlan] != 0){
                        objRes[keyPercent] = (objRes[keyActual] - objRes[keyPlan]) / objRes[keyPlan];
                    }

                    objResTotal[keyPlan] = (objResTotal[keyPlan]||0) + objRes[keyPlan];
                    objResTotal[keyActual] = (objResTotal[keyActual]||0) + objRes[keyActual];
                });

                arrResult.push(objRes);
            });

            arrResult.push(objResTotal);
            
            return arrResult;
        }

        return _export;
    });
