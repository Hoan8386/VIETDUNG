/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/search', 'N/ui/serverWidget', 'N/runtime'],
    
    (search, serverWidget, runtime) => {
        
        const config = {
            LABEL: {
                customdeploy_scv_sl_bs_rpt_v2: 'Báo cáo tình hình tài chính hợp nhất',
                customdeploy_scv_sl_bs_rpt: 'BS Report',
            }
        }
        
        /**
         * Definition of the Suitelet script trigger point.
         *
         * @param {Object} context
         * @param {ServerRequest} context.request - Encapsulation of the incoming request
         * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
         * @Since 2015.2
         */
        const onRequest = (context) => {
            let request = context.request;
            let params = request.parameters;
            let isrun = params.isrun;
            if (context.request.method === "GET") {
                let mainForm = onCreateFormUI(params);
                mainForm.form.clientScriptModulePath = '../cs/scv_cs_sl_bs_rpt.js';
                if (isrun === "1") {
                    let searchResult = runFilterSS(params);
                    onRenderData(params, mainForm.sublist, searchResult);
                }
                context.response.writePage(mainForm.form);
            }
        }
        
        const onCreateFormUI = (_params) => {
            let curUser = runtime.getCurrentUser();
            let mainForm = serverWidget.createForm({title: config.LABEL[runtime.getCurrentScript().deploymentId]});
            let mainGrp = addFieldGroup(mainForm, "fieldgrp_main", "Main");
            
            let custpage_subsidiary = mainForm.addField({
                id: 'custpage_subsidiary',
                type: serverWidget.FieldType.MULTISELECT,
                label: 'Subsidiary',
                source: "subsidiary",
                container: mainGrp.id
            });
            custpage_subsidiary.isMandatory = true;
            
            let custpage_curtodt = mainForm.addField({
                id: 'custpage_curtodt',
                type: serverWidget.FieldType.DATE,
                label: 'To Date Current',
                container: mainGrp.id
            }).updateLayoutType({layoutType: serverWidget.FieldLayoutType.STARTROW});
            
            let custpage_beftodt = mainForm.addField({
                id: 'custpage_beftodt',
                type: serverWidget.FieldType.DATE,
                label: 'To Date Last',
                container: mainGrp.id
            }).updateLayoutType({layoutType: serverWidget.FieldLayoutType.ENDROW});
            
            mainForm.addField({
                id: 'custpage_scv_deploymentid',
                type: serverWidget.FieldType.TEXT,
                label: 'deployment Id',
                container: mainGrp.id
            }).updateDisplayType({displayType: "HIDDEN"})
                .defaultValue = runtime.getCurrentScript().deploymentId;
            
            if (_params.custpage_subsidiary) {
                custpage_subsidiary.defaultValue = _params.custpage_subsidiary.split(",");
            } else {
                custpage_subsidiary.defaultValue = curUser.subsidiary;
            }
            custpage_curtodt.defaultValue = getToDate(_params.custpage_curtodt);
            custpage_beftodt.defaultValue = getToDate(_params.custpage_beftodt);
            
            let rsSL = mainForm.addSublist({
                id: "custpage_sl_result",
                type: serverWidget.SublistType.LIST,
                label: 'Result'
            });
            
            rsSL.addButton({
                id: "custpage_btn_search", label: "Search",
                functionName: "onSearchResult()"
            });
            rsSL.addButton({
                id: "custpage_btn_export", label: "Export",
                functionName: "onExport()"
            });
            
            rsSL.addField({
                    id: "custpage_col_taisan",
                    type: serverWidget.FieldType.TEXT, label: 'Tài sản'
                }
            ).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
            rsSL.addField({
                    id: "custpage_col_maso",
                    type: serverWidget.FieldType.TEXT, label: 'Mã số'
                }
            ).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
            rsSL.addField({
                    id: "custpage_col_thuyetminh",
                    type: serverWidget.FieldType.TEXT, label: 'Thuyết minh'
                }
            ).updateDisplayType({displayType: serverWidget.FieldDisplayType.DISABLED});
            rsSL.addField({
                    id: "custpage_col_curyear",
                    type: serverWidget.FieldType.FLOAT, label: 'Số cuối năm'
                }
            ).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
            rsSL.addField({
                    id: "custpage_col_lastyear",
                    type: serverWidget.FieldType.FLOAT, label: 'Số đầu năm'
                }
            ).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
            
            return {form: mainForm, sublist: rsSL};
        }
        
        const runFilterSS = (_params) => {
            let dataResult = [];
            let dataResultCur = getDataDetailCur(_params);
            let dataResultBef = getDataDetailBef(_params);
            let arrMaSo = getListMaSo();
            for (let i = 0; i < arrMaSo.length; i++) {
                let objData = {
                    index: i,
                    chitieu: arrMaSo[i].chitieu,
                    maso: arrMaSo[i].maso,
                    thuyetminh: "",
                    amtCur: 0,
                    amtBef: 0,
                    lv: arrMaSo[i].lv,
                    fomular: arrMaSo[i].fomular
                };
                let objCur = findByMaSo(dataResultCur, objData.maso);
                let objBef = findByMaSo(dataResultBef, objData.maso);
                if (objCur) {
                    objData.amtCur = Number(objCur.amt) * arrMaSo[i].factor;
                }
                if (objBef) {
                    objData.amtBef = Number(objBef.amt) * arrMaSo[i].factor;
                }
                dataResult.push(objData);
            }
            let arrLv_30 = dataResult.filter(e => String(e.lv) === '30');
            let arrLv_20 = dataResult.filter(e => String(e.lv) === '20');
            let arrLv_10 = dataResult.filter(e => String(e.lv) === '10');
            let arrLv_5 = dataResult.filter(e => String(e.lv) === '5');
            let myResult = dataResult.filter(e => String(e.lv) === '0');
            
            for (let i = 0; i < arrLv_30.length; i++) {
                let children = arrLv_30[i].fomular.split(",");
                let ttlAmtCur = 0, ttlAmtBef = 0;
                for (let j = 0; j < children.length; j++) {
                    let objChildren = findByMaSo(myResult, children[j]);
                    if (objChildren) {
                        ttlAmtCur += objChildren.amtCur;
                        ttlAmtBef += objChildren.amtBef;
                    }
                }
                arrLv_30[i].amtCur = ttlAmtCur;
                arrLv_30[i].amtBef = ttlAmtBef;
                myResult.push(arrLv_30[i]);
            }
            
            for (let i = 0; i < arrLv_20.length; i++) {
                let children = arrLv_20[i].fomular.split(",");
                let ttlAmtCur = 0, ttlAmtBef = 0;
                for (let j = 0; j < children.length; j++) {
                    let objChildren = findByMaSo(myResult, children[j]);
                    if (objChildren) {
                        ttlAmtCur += objChildren.amtCur;
                        ttlAmtBef += objChildren.amtBef;
                    }
                }
                arrLv_20[i].amtCur = ttlAmtCur;
                arrLv_20[i].amtBef = ttlAmtBef;
                myResult.push(arrLv_20[i]);
            }
            
            for (let i = 0; i < arrLv_10.length; i++) {
                let children = arrLv_10[i].fomular.split(",");
                let ttlAmtCur = 0, ttlAmtBef = 0;
                for (let j = 0; j < children.length; j++) {
                    let objChildren = findByMaSo(myResult, children[j]);
                    if (objChildren) {
                        ttlAmtCur += objChildren.amtCur;
                        ttlAmtBef += objChildren.amtBef;
                    }
                }
                arrLv_10[i].amtCur = ttlAmtCur;
                arrLv_10[i].amtBef = ttlAmtBef;
                myResult.push(arrLv_10[i]);
            }
            
            for (let i = 0; i < arrLv_5.length; i++) {
                let children = arrLv_5[i].fomular.split(",");
                let ttlAmtCur = 0, ttlAmtBef = 0;
                for (let j = 0; j < children.length; j++) {
                    let objChildren = findByMaSo(myResult, children[j]);
                    if (objChildren) {
                        ttlAmtCur += objChildren.amtCur;
                        ttlAmtBef += objChildren.amtBef;
                    }
                }
                arrLv_5[i].amtCur = ttlAmtCur;
                arrLv_5[i].amtBef = ttlAmtBef;
                myResult.push(arrLv_5[i]);
            }
            myResult = sortArrayObj(myResult, [{name: "index", sort: "ASC"}]);
            return myResult;
        }
        
        const getDataDetailCur = (_params) => {
            let resultSearch = search.load("customsearch_scv_report_bs");
            let myFilter = resultSearch.filters;
            let myColumns = resultSearch.columns;
            if (_params.custpage_subsidiary) {
                myFilter.push(search.createFilter({
                    name: 'subsidiary',
                    operator: search.Operator.ANYOF,
                    values: _params.custpage_subsidiary.split(","),
                }));
            }
            
            if (_params.custpage_curtodt) {
                myFilter.push(search.createFilter({
                    name: 'trandate',
                    operator: search.Operator.ONORBEFORE,
                    values: _params.custpage_curtodt
                }));
            }
            
            resultSearch = resultSearch.runPaged({pageSize: 1000});
            let myData = [];
            for (let i = 0; i < resultSearch.pageRanges.length; i++) {
                let dataPage = resultSearch.fetch(i).data;
                for (let idx in dataPage) {
                    let obj = {};
                    let chitieu = dataPage[idx].getValue(myColumns[0]);
                    obj.maso = chitieu.substring(0, chitieu.indexOf("-")).trim();
                    obj.amt = Number(dataPage[idx].getValue(myColumns[1]));
                    myData.push(obj);
                }
            }
            return myData;
        }
        
        const getDataDetailBef = (_params) => {
            let resultSearch = search.load("customsearch_scv_report_bs");
            let myFilter = resultSearch.filters;
            let myColumns = resultSearch.columns;
            if (_params.custpage_subsidiary) {
                myFilter.push(search.createFilter({
                    name: 'subsidiary',
                    operator: search.Operator.ANYOF,
                    values: _params.custpage_subsidiary.split(","),
                }));
            }
            if (_params.custpage_beftodt) {
                myFilter.push(search.createFilter({
                    name: 'trandate',
                    operator: search.Operator.ONORBEFORE,
                    values: _params.custpage_beftodt
                }));
            }
            
            resultSearch = resultSearch.runPaged({pageSize: 1000});
            let myData = [];
            for (let i = 0; i < resultSearch.pageRanges.length; i++) {
                let dataPage = resultSearch.fetch(i).data;
                for (let idx in dataPage) {
                    let obj = {};
                    let chitieu = dataPage[idx].getValue(myColumns[0]);
                    obj.maso = chitieu.substring(0, chitieu.indexOf("-")).trim();
                    obj.amt = Number(dataPage[idx].getValue(myColumns[1]));
                    myData.push(obj);
                }
            }
            return myData;
        }
        
        const onRenderData = (_params, _sublist, _result) => {
            for (let i = 0; i < _result.length; i++) {
                setRowDataSublist(_sublist, i, [
                    "custpage_col_taisan", "custpage_col_maso", "custpage_col_thuyetminh",
                    "custpage_col_curyear", "custpage_col_lastyear"
                ], [
                    _result[i].chitieu, _result[i].maso, _result[i].thuyetminh,
                    (_result[i].amtCur).toFixed(0), (_result[i].amtBef).toFixed(0),
                ]);
            }
        }
        
        const getToDate = (_todt) => {
            if (_todt) {
                return _todt
            }
            return new Date();
        }
        
        const setRowDataSublist = (_sublist, _line, _field, _data) => {
            for (let i = 0; i < _field.length; i++) {
                addValueColField(_sublist, _field[i], _line, _data[i]);
            }
        }
        
        const addFieldGroup = (_form, _id, _label) => {
            let _obj = {id: _id, label: _label}
            _form.addFieldGroup(_obj);
            return _obj;
        }
        
        const addValueColField = (sublist, id, line, value) => {
            if (value || value === 0) {
                sublist.setSublistValue({
                    id: id,
                    line: line,
                    value: value
                });
            }
        }
        
        const getListMaSo = () => {
            return [
                {maso: "100", factor: 1, lv: 10, fomular: "110,120,130,140,150", chitieu: "A - TÀI SẢN NGẮN HẠN"},
                {maso: "110", factor: 1, lv: 20, fomular: "111,112", chitieu: "I. Tiền và các khoản tương đương tiền"},
                {maso: "111", factor: -1, lv: 0, chitieu: "1. Tiền "},
                {maso: "112", factor: -1, lv: 0, chitieu: "2. Các khoản tương đương tiền"},
                {maso: "120", factor: 1, lv: 20, fomular: "121,122,123", chitieu: "II. Đầu tư tài chính ngắn hạn"},
                {maso: "121", factor: -1, lv: 0, chitieu: "1. Chứng khoán kinh doanh"},
                {maso: "122", factor: -1, lv: 0, chitieu: "2. Dự phòng giảm giá chứng khoán kinh doanh (*)"},
                {maso: "123", factor: -1, lv: 0, chitieu: "3. Đầu tư nắm giữ đến ngày đáo hạn"},
                {
                    maso: "130",
                    factor: 1,
                    lv: 20,
                    fomular: "131,132,133,134,135,136,137,139",
                    chitieu: "III. Các khoản phải thu ngắn hạn"
                },
                {maso: "131", factor: -1, lv: 0, chitieu: "1. Phải thu ngắn hạn của khách hàng "},
                {maso: "132", factor: -1, lv: 0, chitieu: "2. Trả trước cho người bán ngắn hạn"},
                {maso: "133", factor: -1, lv: 0, chitieu: "3. Phải thu nội bộ ngắn hạn"},
                {maso: "134", factor: -1, lv: 0, chitieu: "4. Phải thu theo tiến độ kế hoạch hợp đồng xây dựng"},
                {maso: "135", factor: -1, lv: 0, chitieu: "5. Phải thu về cho vay ngắn hạn"},
                {maso: "136", factor: -1, lv: 0, chitieu: "6. Phải thu ngắn hạn khác"},
                {maso: "137", factor: -1, lv: 0, chitieu: "7. Dự phòng phải thu ngắn hạn khó đòi (*)"},
                {maso: "139", factor: -1, lv: 0, chitieu: "8. Tài sản thiếu chờ xử lý"},
                {maso: "140", factor: 1, lv: 20, fomular: "141,149", chitieu: "IV. Hàng tồn kho"},
                {maso: "141", factor: -1, lv: 0, chitieu: "1. Hàng tồn kho"},
                {maso: "149", factor: -1, lv: 0, chitieu: "2. Dự phòng giảm giá hàng tồn kho (*)"},
                {maso: "150", factor: 1, lv: 20, fomular: "151,152,153,154,155", chitieu: "V. Tài sản ngắn hạn khác"},
                {maso: "151", factor: -1, lv: 0, chitieu: "1. Chi phí trả trước ngắn hạn "},
                {maso: "152", factor: -1, lv: 0, chitieu: "2. Thuế GTGT được khấu trừ"},
                {maso: "153", factor: -1, lv: 0, chitieu: "3. Thuế và các khoản khác phải thu Nhà nước"},
                {maso: "154", factor: -1, lv: 0, chitieu: "4. Giao dịch mua bán lại trái phiếu Chính phủ"},
                {maso: "155", factor: -1, lv: 0, chitieu: "5. Tài sản ngắn hạn khác"},
                {maso: "200", factor: 1, lv: 10, fomular: "210,220,230,240,250,260", chitieu: "B - TÀI SẢN DÀI HẠN"},
                {
                    maso: "210",
                    factor: 1,
                    lv: 20,
                    fomular: "211,212,213,214,215,216,219",
                    chitieu: "I. Các khoản phải thu dài hạn "
                },
                {maso: "211", factor: -1, lv: 0, chitieu: "1. Phải thu dài hạn của khách hàng"},
                {maso: "212", factor: -1, lv: 0, chitieu: "2. Trả trước cho người bán dài hạn"},
                {maso: "213", factor: -1, lv: 0, chitieu: "3. Vốn kinh doanh ở đơn vị trực thuộc"},
                {maso: "214", factor: -1, lv: 0, chitieu: "4. Phải thu nội bộ dài hạn"},
                {maso: "215", factor: -1, lv: 0, chitieu: "5. Phải thu về cho vay dài hạn"},
                {maso: "216", factor: -1, lv: 0, chitieu: "6. Phải thu dài hạn khác"},
                {maso: "219", factor: -1, lv: 0, chitieu: "7. Dự phòng phải thu dài hạn khó đòi (*)"},
                {maso: "220", factor: 1, lv: 20, fomular: "221,224,227", chitieu: "II. Tài sản cố định"},
                {maso: "221", factor: 1, lv: 30, fomular: "222,223", chitieu: "1. Tài sản cố định hữu hình"},
                {maso: "222", factor: -1, lv: 0, chitieu: "      - Nguyên giá"},
                {maso: "223", factor: -1, lv: 0, chitieu: "      - Giá trị hao mòn luỹ kế (*)"},
                {maso: "224", factor: 1, lv: 30, fomular: "225,226", chitieu: "2. Tài sản cố định thuê tài chính"},
                {maso: "225", factor: -1, lv: 0, chitieu: "      - Nguyên giá"},
                {maso: "226", factor: -1, lv: 0, chitieu: "      - Giá trị hao mòn luỹ kế (*)"},
                {maso: "227", factor: 1, lv: 30, fomular: "228,229", chitieu: "3. Tài sản cố định vô hình"},
                {maso: "228", factor: -1, lv: 0, chitieu: "      - Nguyên giá"},
                {maso: "229", factor: -1, lv: 0, chitieu: "      - Giá trị hao mòn luỹ kế (*)"},
                {maso: "230", factor: 1, lv: 20, fomular: "231,232", chitieu: "III. Bất động sản đầu tư"},
                {maso: "231", factor: -1, lv: 0, chitieu: "      - Nguyên giá"},
                {maso: "232", factor: -1, lv: 0, chitieu: "      - Giá trị hao mòn luỹ kế (*)"},
                {maso: "240", factor: 1, lv: 20, fomular: "241,242", chitieu: "IV. Tài sản dở dang dài hạn "},
                {maso: "241", factor: -1, lv: 0, chitieu: "1. Chi phí sản xuất, kinh doanh dở dang dài hạn "},
                {maso: "242", factor: -1, lv: 0, chitieu: "2. Chi phí xây dựng cơ bản dở dang"},
                {
                    maso: "250",
                    factor: 1,
                    lv: 20,
                    fomular: "251,252,253,254,255",
                    chitieu: "V. Đầu tư tài chính dài hạn"
                },
                {maso: "251", factor: -1, lv: 0, chitieu: "1. Đầu tư vào công ty con "},
                {maso: "252", factor: -1, lv: 0, chitieu: "2. Đầu tư vào công ty liên doanh, liên kết"},
                {maso: "253", factor: -1, lv: 0, chitieu: "3. Đầu tư góp vốn vào đơn vị khác"},
                {maso: "254", factor: -1, lv: 0, chitieu: "4. Dự phòng đầu tư tài chính dài hạn (*)"},
                {maso: "255", factor: -1, lv: 0, chitieu: "5. Đầu tư nắm giữ đến ngày đáo hạn"},
                {maso: "260", factor: 1, lv: 20, fomular: "261,262,263,268", chitieu: "VI. Tài sản dài hạn khác"},
                {maso: "261", factor: -1, lv: 0, chitieu: "1. Chi phí trả trước dài hạn"},
                {maso: "262", factor: -1, lv: 0, chitieu: "2. Tài sản thuế thu nhập hoãn lại"},
                {maso: "263", factor: -1, lv: 0, chitieu: "3. Thiết bị, vật tư, phụ tùng thay thế dài hạn"},
                {maso: "268", factor: -1, lv: 0, chitieu: "4. Tài sản dài hạn khác"},
                {maso: "270", factor: 1, lv: 5, fomular: "100,200", chitieu: "TỔNG CỘNG TÀI SẢN (270 = 100 + 200)"},
                {maso: "300", factor: 1, lv: 10, fomular: "310,330,", chitieu: "C - NỢ PHẢI TRẢ"},
                {
                    maso: "310",
                    factor: 1,
                    lv: 20,
                    fomular: "311,312,313,314,315,316,317,318,319,320,321,322,323,324",
                    chitieu: "I. Nợ ngắn hạn"
                },
                {maso: "311", factor: 1, lv: 0, chitieu: "1. Phải trả người bán ngắn hạn"},
                {maso: "312", factor: 1, lv: 0, chitieu: "2. Người mua trả tiền trước ngắn hạn"},
                {maso: "313", factor: 1, lv: 0, chitieu: "3. Thuế và các khoản phải nộp Nhà nước"},
                {maso: "314", factor: 1, lv: 0, chitieu: "4. Phải trả người lao động"},
                {maso: "315", factor: 1, lv: 0, chitieu: "5. Chi phí phải trả ngắn hạn"},
                {maso: "316", factor: 1, lv: 0, chitieu: "6. Phải trả nội bộ ngắn hạn"},
                {maso: "317", factor: 1, lv: 0, chitieu: "7. Phải trả theo tiến độ kế hoạch hợp đồng xây dựng"},
                {maso: "318", factor: 1, lv: 0, chitieu: "8. Doanh thu chưa thực hiện ngắn hạn "},
                {maso: "319", factor: 1, lv: 0, chitieu: "9. Phải trả ngắn hạn khác"},
                {maso: "320", factor: 1, lv: 0, chitieu: "10. Vay và nợ thuê tài chính ngắn hạn"},
                {maso: "321", factor: 1, lv: 0, chitieu: "11. Dự phòng phải trả ngắn hạn "},
                {maso: "322", factor: 1, lv: 0, chitieu: "12. Quỹ khen thưởng, phúc lợi "},
                {maso: "323", factor: 1, lv: 0, chitieu: "13. Quỹ bình ổn giá"},
                {maso: "324", factor: 1, lv: 0, chitieu: "14. Giao dịch mua bán lại trái phiếu Chính phủ"},
                {
                    maso: "330",
                    factor: 1,
                    lv: 20,
                    fomular: "331,332,333,334,335,336,337,338,339,340,341,342,343",
                    chitieu: "II. Nợ dài hạn"
                },
                {maso: "331", factor: 1, lv: 0, chitieu: "1. Phải trả người bán dài hạn"},
                {maso: "332", factor: 1, lv: 0, chitieu: "2. Người mua trả tiền trước dài hạn"},
                {maso: "333", factor: 1, lv: 0, chitieu: "3. Chi phí phải trả dài hạn"},
                {maso: "334", factor: 1, lv: 0, chitieu: "4. Phải trả nội bộ về vốn kinh doanh"},
                {maso: "335", factor: 1, lv: 0, chitieu: "5. Phải trả nội bộ dài hạn"},
                {maso: "336", factor: 1, lv: 0, chitieu: "6. Doanh thu chưa thực hiện dài hạn "},
                {maso: "337", factor: 1, lv: 0, chitieu: "7. Phải trả dài hạn khác"},
                {maso: "338", factor: 1, lv: 0, chitieu: "8. Vay và nợ thuê tài chính dài hạn "},
                {maso: "339", factor: 1, lv: 0, chitieu: "9. Trái phiếu chuyển đổi"},
                {maso: "340", factor: 1, lv: 0, chitieu: "10. Cổ phiếu ưu đãi"},
                {maso: "341", factor: 1, lv: 0, chitieu: "11. Thuế thu nhập hoãn lại phải trả "},
                {maso: "342", factor: 1, lv: 0, chitieu: "12. Dự phòng phải trả dài hạn "},
                {maso: "343", factor: 1, lv: 0, chitieu: "13. Quỹ phát triển khoa học và công nghệ"},
                {maso: "400", factor: 1, lv: 10, fomular: "410,430", chitieu: "D - VỐN CHỦ SỞ HỮU"},
                {
                    maso: "410",
                    factor: 1,
                    lv: 20,
                    fomular: "411,412,413,414,415,416,417,418,419,420,421,422",
                    chitieu: "I. Vốn chủ sở hữu"
                },
                {maso: "411", factor: 1, lv: 30, fomular: "411a,411b", chitieu: "1. Vốn góp của chủ sở hữu"},
                {maso: "411a", factor: 1, lv: 0, chitieu: "    - Cổ phiếu phổ thông có quyền biểu quyết"},
                {maso: "411b", factor: 1, lv: 0, chitieu: "    - Cổ phiếu ưu đãi"},
                {maso: "412", factor: 1, lv: 0, chitieu: "2. Thặng dư vốn cổ phần"},
                {maso: "413", factor: 1, lv: 0, chitieu: "3. Quyền chọn chuyển đổi trái phiếu"},
                {maso: "414", factor: 1, lv: 0, chitieu: "4. Vốn khác của chủ sở hữu "},
                {maso: "415", factor: 1, lv: 0, chitieu: "5. Cổ phiếu quỹ (*)"},
                {maso: "416", factor: 1, lv: 0, chitieu: "6. Chênh lệch đánh giá lại tài sản"},
                {maso: "417", factor: 1, lv: 0, chitieu: "7. Chênh lệch tỷ giá hối đoái"},
                {maso: "418", factor: 1, lv: 0, chitieu: "8. Quỹ đầu tư phát triển"},
                {maso: "419", factor: 1, lv: 0, chitieu: "9. Quỹ hỗ trợ sắp xếp doanh nghiệp"},
                {maso: "420", factor: 1, lv: 0, chitieu: "10. Quỹ khác thuộc vốn chủ sở hữu"},
                {
                    maso: "421",
                    factor: 1,
                    lv: 30,
                    fomular: "421a,421b",
                    chitieu: "11. Lợi nhuận sau thuế chưa phân phối"
                },
                {maso: "421a", factor: 1, lv: 0, chitieu: "     - LNST chưa phân phối lũy kế đến cuối kỳ trước"},
                {maso: "421b", factor: 1, lv: 0, chitieu: "     - LNST chưa phân phối kỳ này"},
                {maso: "422", factor: 1, lv: 0, chitieu: "12. Nguồn vốn đầu tư XDCB"},
                {maso: "430", factor: 1, lv: 20, fomular: "431,432", chitieu: "II. Nguồn kinh phí và quỹ khác"},
                {maso: "431", factor: 1, lv: 0, chitieu: "  1. Nguồn kinh phí "},
                {maso: "432", factor: 1, lv: 0, chitieu: "  2. Nguồn kinh phí đã hình thành TSCĐ"},
                {maso: "440", factor: 1, lv: 5, fomular: "300,400", chitieu: "TỔNG CỘNG NGUỒN VỐN (440 = 300 + 400)"}
            ];
        }
        
        const findByMaSo = (_arrFind, _maso) => {
            return _arrFind.find(o => o.maso === _maso);
        }
        
        const sortArrayObj = (_arrObj, _grp) => {
            return _arrObj.sort(
                function (row1, row2) {
                    for (let i = 0; i < _grp.length; i++) {
                        if (row1[_grp[i].name] > row2[_grp[i].name]) return (_grp[i].sort === "ASC") ? 1 : -1;
                        if (row1[_grp[i].name] < row2[_grp[i].name]) return (_grp[i].sort === "ASC") ? -1 : 1;
                    }
                }
            );
        }
        
        return {
            onRequest
        };
    });
