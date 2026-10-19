/**
 * Nội dung:
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  19 Sep 2025         Khanh Tran			    Init, create file. Phát triển báo cáo Tăng giảm TSCĐ, form mr.Kỳ(https://app.clickup.com/t/86d0butgj)
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
            arrFaMvmtSS01: [],
            arrFaMvmtSS02: []
        };
        
        _export.getColumnGrid = function () {
            let maskFormat = '#,##0';
            let arrColumns = [
                { dataField: 'asset_code', caption: 'Mã tài sản', dataType: 'string', width: 200 },
                { dataField: 'asset_name', caption: 'Tên tài sản', dataType: 'string', width: 300 },
                { dataField: 'units_display', caption: 'ĐVT', dataType: 'string', width: 100 },
                { dataField: 'movement_date', caption: 'Ngày tăng/giảm', dataType: 'string', width: 150 },
                { dataField: 'movement_code', caption: 'Mã tăng/giảm', dataType: 'string', width: 200 },
                { dataField: 'opening_cost', caption: 'Nguyên giá cũ', dataType: 'number', format: maskFormat, width: 150 },
                { dataField: 'cost_increase', caption: 'Nguyên giá tăng', dataType: 'number', format: maskFormat, width: 150 },
                { dataField: 'cost_decrease', caption: 'Nguyên giá giảm', dataType: 'number', format: maskFormat, width: 150 },
                { dataField: 'dep_increase', caption: 'Khấu hao tăng', dataType: 'number', format: maskFormat, width: 150 },
                { dataField: 'dep_decrease', caption: 'Khấu hao giảm', dataType: 'number', format: maskFormat, width: 150 },
            ];

            return arrColumns;
        }

        _export.setDataInput = function ({
            params = {},
            arrFaMvmtSS01 = [], 
            arrFaMvmtSS02 = []
        }) {
            this.params = params;
            this.arrFaMvmtSS01 = arrFaMvmtSS01;
            this.arrFaMvmtSS02 = arrFaMvmtSS02;
        }

        _export.getDataSourceResult = function() {
            let arrFaMvmtSS01 = this.arrFaMvmtSS01;
            let arrFaMvmtSS02 = this.arrFaMvmtSS02;
            let params = this.params;
            let arrResult = [], arrGrp = [], arrMapped = [];
            let fromdt_yyyymmdd = constFormat.getInfoDate(params.custpage_fromdt).yyyymmdd;

            arrFaMvmtSS02.forEach(obj => {
                obj.asset_date_yyyymmdd = constFormat.getInfoDate(obj.asset_date).yyyymmdd;
            })
            
            arrFaMvmtSS01.forEach(objSS01 => {
                let ss02ForAsset = arrFaMvmtSS02.filter(e => e.asset_id == objSS01.asset_id);
                let ss02BeforeFromDate = ss02ForAsset.filter(e => e.asset_date_yyyymmdd < fromdt_yyyymmdd);
                let ss02AafterOrEqualFromDate = ss02ForAsset.filter(e => e.asset_date_yyyymmdd >= fromdt_yyyymmdd);
                let opening_cost = 0, dep_increase = 0, dep_decrease = 0;
                let objRes = {};

                ss02BeforeFromDate.forEach(obj => {
                    opening_cost += (obj.cost_increase * 1) - (obj.cost_decrease * 1);
                })

                ss02AafterOrEqualFromDate.forEach(obj => {
                    dep_increase += (obj.dep_increase * 1);
                    dep_decrease += (obj.dep_decrease * 1);
                    
                })

                objRes.asset_code = objSS01.asset_code;
                objRes.asset_name = objSS01.asset_name;
                objRes.units_display = objSS01.units_display.replace("- None -", "");
                objRes.movement_date = objSS01.asset_date;
                objRes.movement_code = objSS01.movement_code;
                objRes.opening_cost = opening_cost;
                objRes.cost_increase = objSS01.cost_increase * 1;
                objRes.cost_decrease = objSS01.cost_decrease * 1;
                objRes.dep_increase = dep_increase;
                objRes.dep_decrease = dep_decrease;
                objRes.asset_category_display = objSS01.asset_category_display;
                
                arrMapped.push(objRes);
            })

            arrGrp = lbf.onGroupByArray(arrMapped, ['asset_category_display']);
            arrGrp.sort((a, b) => a.asset_category_display.localeCompare(b.asset_category_display));
            arrGrp.forEach(objGrp => {
                let objLv1 = {
                    rowPreparedData: {
                        style: {fontWeight: "bold", backgroundColor: "#fdf5e6"}
                    }, 
                    lvl: 1,
                    idxRow: lbf.uuidv4(),
                    idxRowParent: -1,
                    asset_name: objGrp.asset_category_display,
                    opening_cost: 0,
                    cost_increase: 0,
                    cost_decrease: 0,
                    dep_increase: 0,
                    dep_decrease: 0,
                };

                arrResult.push(objLv1);

                let arrLv2 = arrMapped.filter(e => e.asset_category_display == objGrp.asset_category_display);

                arrLv2.forEach(objLv2 => {
                    objLv2.idxRow = lbf.uuidv4();
                    objLv2.idxRowParent = objLv1.idxRow;

                    arrResult.push(objLv2);

                    ['opening_cost', 'cost_increase', 'cost_decrease', 'dep_increase', 'dep_decrease'].forEach(key => {
                        objLv1[key] += (objLv2[key]*1);
                    })
                })
            })

            return arrResult;
        }

        return _export;
    });
