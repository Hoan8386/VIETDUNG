/**
 * Nội dung:
 * =======================================================================================
 *  Date                Author                  Description
 *  ?                   ?                       ?
 * 17 Oct 2023          Huy Pham                Refactor, from mr.Bính (https://app.clickup.com/t/865d7rc79)
 */
/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/ui/serverWidget', 'N/runtime', 'N/format', 'N/file',
        '../lib/scv_lib_function.js', '../lib/scv_lib_common_html.js', '../lib/scv_lib_report.js'],
    
    (record, search, serverWidget, runtime, format, file,
     libFunc, libHtml, libRp) => {
        const SAVED_SEARCH = {
            SS01_RPT_BS: "customsearch_scv_report_bs2",
            SS02_BS_CT2_PAY: "customsearch_scv_bs_ct2_pay",
            SS03_BS_CT2_REC: "customsearch_scv_bs_ct2_rec"
        }
        const CUR_SCRIPT = {
            ID: "customscript_scv_sl_bs2_rpt",
            DEPLOYID_UI: "customdeploy_scv_sl_bs2_rpt",
            DEPLOYID_DATA: "customdeploy_scv_sl_bs2_rpt_data"
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
            var request = context.request;
            var params = request.parameters;
            
            var curScript = runtime.getCurrentScript();
            
            if (curScript.deploymentId === CUR_SCRIPT.DEPLOYID_DATA) {
                var objResponse = {data: []};
                
                switch (params.action) {
                    case "getListMaSo":
                        objResponse.data = getListMaSo();
                        break;
                    case "getDataSubsidiary":
                        objResponse.data = getDataSubsidiary(params);
                        break;
                    case "getDataColumnGrid":
                        objResponse.data = getDataColumnGrid(params);
                        break;
                    case "getDataDetailCons":
                        objResponse.data = getDataDetailCons(params);
                        break;
                    case "getDataBSCT2Pay":
                        objResponse.data = getDataBSCT2Pay(params);
                        break;
                    case "getDataBSCT2Rec":
                        objResponse.data = getDataBSCT2Rec(params);
                        break;
                    case "getTemplateExcel":
                        objResponse.data = {
                            contents: file.load({id: '../xml/fs_report/scv_fs_bs2.xml'}).getContents(),
                            name: "BS Report"
                        }
                        break;
                }
                
                context.response.setHeader({
                    name: 'Content-Type',
                    value: 'application/json'
                });
                
                context.response.write(JSON.stringify(objResponse));
            } else {
                if (context.request.method === "GET") {
                    var MainForm = onCreateFormUI(params);
                    
                    context.response.writePage(MainForm.form);
                }
            }
        }
        
        const onCreateFormUI = (_params) => {
            var curUser = runtime.getCurrentUser();
            var mainForm = serverWidget.createForm({title: "BS Report"});
            mainForm.clientScriptModulePath = '../cssl/scv_cs_sl_bs2_rpt.js';
            
            var arrPageLinked = [
                {id: SAVED_SEARCH.SS01_RPT_BS}, {id: SAVED_SEARCH.SS02_BS_CT2_PAY}, {id: SAVED_SEARCH.SS03_BS_CT2_REC},
                {id: CUR_SCRIPT.DEPLOYID_DATA, name: "Script Log"}
            ];
            libRp.addPageLinkForm(mainForm, arrPageLinked);
            
            var mainGrp = addFieldGroup(mainForm, "fieldgrp_main", "Main");
            
            mainForm.addButton({id: "custpage_btn_search", label: "Search", functionName: "onSearchResult('F')"});
            mainForm.addButton({id: "custpage_btn_export", label: "Export", functionName: "onSearchResult('T')"});
            
            var fieldSubsidiary = mainForm.addField({
                id: 'custpage_subsidiary',
                type: serverWidget.FieldType.MULTISELECT,
                label: 'Subsidiary',
                source: "subsidiary",
                container: mainGrp.id
            });
            fieldSubsidiary.isMandatory = true;
            fieldSubsidiary.setHelpText("Đơn vị");
            
            var fieldCurtodt = mainForm.addField({
                id: 'custpage_curtodt',
                type: serverWidget.FieldType.DATE,
                label: 'To Date Current',
                container: mainGrp.id
            }).updateLayoutType({layoutType: serverWidget.FieldLayoutType.STARTROW});
            fieldCurtodt.setHelpText("To Date Current")
            
            var fieldBeftodt = mainForm.addField({
                id: 'custpage_beftodt',
                type: serverWidget.FieldType.DATE,
                label: 'To Date Last',
                container: mainGrp.id
            }).updateLayoutType({layoutType: serverWidget.FieldLayoutType.ENDROW});
            fieldBeftodt.setHelpText("To Date Last")
            
            if (libFunc.isContainValue(_params.custpage_subsidiary)) {
                fieldSubsidiary.defaultValue = _params.custpage_subsidiary.split(",");
            } else {
                fieldSubsidiary.defaultValue = curUser.subsidiary;
                _params.custpage_subsidiary = curUser.subsidiary;
            }
            fieldCurtodt.defaultValue = getToDate(_params.custpage_curtodt);
            fieldBeftodt.defaultValue = getToDate(_params.custpage_beftodt);
            
            var optionGrid = onCreateDxGrid(_params);
            libHtml.renderDxGrid(mainForm, optionGrid, []);
            return {form: mainForm};
        }
        
        const onCreateDxGrid = (_params) => {
            var arrColumns = getDataColumnGrid(_params);
            return {
                columns: arrColumns,
                exportExcelEnable: true,
                excel: {name: "BẢNG CÂN ĐỐI KẾ TOÁN "},
                columnChooser: true,
                filterRowVisible: false,
                headerFilterVisible: false,
                rowAlternationEnabled: true,
                wordWrapEnabled: false,
                sortingMode: "none",
                groupPanel: false,
                pageSize: 500
            };
        }
        
        const getDataColumnGrid = (_params) => {
            var curdate = !!_params.custpage_curtodt ? format.parse({
                value: _params.custpage_curtodt,
                type: "date"
            }) : getToDate();
            var lastdate = !!_params.custpage_beftodt ? format.parse({
                value: _params.custpage_beftodt,
                type: "date"
            }) : getToDate();
            
            curdate = format.format({value: curdate, type: "date"});
            lastdate = lastdate.addDays(1);
            lastdate = format.format({value: lastdate, type: "date"});
            
            return [
                {dataField: 'chitieu', caption: 'Tài sản', dataType: "string"},
                {dataField: 'maso', caption: 'Mã số', alignment: "center", dataType: "string"},
                {dataField: 'thuyetminh', caption: 'Thuyết Minh', dataType: "string"},
                {dataField: 'amt_cur', caption: curdate, dataType: 'number', format: "###,###,##0"},
                {dataField: 'amt_bef', caption: lastdate, dataType: 'number', format: "###,###,##0"}
            ];
        }
        
        const getDataSubsidiary = (_params) => {
            var arrSubByRole = getDataSubsidiaryByRole();
            
            var arrResult = [];
            if (!!_params.custpage_subsidiary) {
                var arrSubId = !!_params.custpage_subsidiary ? _params.custpage_subsidiary.split(",") : [];
                
                for (var i = 0; i < arrSubByRole.length; i++) {
                    let objSubByRole = arrSubByRole[i];
                    var idxSub_find = arrSubId.findIndex(_id => String(_id) === String(objSubByRole.id));
                    if (idxSub_find > -1) {
                        arrResult.push(objSubByRole);
                    }
                }
            } else {
                arrResult = arrSubByRole;
            }
            
            return arrResult;
        }
        
        const getDataSubsidiaryByRole = () => {
            var curUser = runtime.getCurrentUser()
            var roleRec = record.load({type: "role", id: curUser.role});
            var subsidiary_op = roleRec.getValue("subsidiaryoption");
            var myFilter = [];
            switch (subsidiary_op) {
                case 'ALL':
                    myFilter = [];
                    break;
                case 'ALLACTIVE':
                    myFilter = [['isinactive', 'is', false]];
                    break;
                case 'OWN':
                    //var empRec = record.load({type: lbf.getEntityType(crrUserRec.id), id: crrUserRec.id});
                    var entityLKF = search.lookupFields({type: "entity", id: curUser.id, columns: "subsidiary"});
                    var sub_id = "";
                    if (!!entityLKF.subsidiary) {
                        if (entityLKF.subsidiary.length > 0) {
                            sub_id = entityLKF.subsidiary[0].value;
                        }
                    }
                    
                    myFilter = ['internalid', "anyOf", sub_id];
                    break;
                case 'SELECTED':
                    var arrSubSel = roleRec.getValue("subsidiaryrestriction");
                    myFilter = ['internalid', "anyOf", arrSubSel]
                    break;
            }
            var subSearch = search.create({
                type: "subsidiary",
                filters: myFilter,
                columns: [
                    search.createColumn({name: "namenohierarchy", label: "namenohierarchy"}),
                    search.createColumn({name: "legalname", label: "legalname"}),
                    search.createColumn({
                        name: "address",
                        join: "address",
                        label: "Address"
                    })
                ]
            });
            var myColumns = subSearch.columns;
            
            subSearch = subSearch.run().getRange(0, 1000);
            
            var arrResult = [];
            for (var i in subSearch) {
                arrResult.push({
                    id: subSearch[i].id * 1,
                    name: subSearch[i].getValue(myColumns[0]),
                    legalname: subSearch[i].getValue(myColumns[1]),
                    address: subSearch[i].getValue(myColumns[2])
                })
            }
            
            return arrResult;
        }
        
        const getDataDetailCons = (_params) => {
            var resultSearch = search.load(SAVED_SEARCH.SS01_RPT_BS);
            var myFilter = resultSearch.filters;
            var myColumns = resultSearch.columns;
            
            if (!!_params.subsidiary_id) {
                myFilter.push(search.createFilter({
                    name: 'subsidiary',
                    operator: "anyof",
                    values: _params.subsidiary_id
                }));
            }
            
            if (!!_params.custpage_todt) {
                myFilter.push(search.createFilter({
                    name: 'trandate',
                    operator: "onorbefore",
                    values: _params.custpage_todt
                }));
            }
            
            var arrResult = [];
            
            resultSearch = resultSearch.run().getRange(0, 1000);
            for (var i = 0; i < resultSearch.length; i++) {
                var obj = {};
                var chitieu = resultSearch[i].getValue(myColumns[0]);
                obj.maso = chitieu.substr(0, chitieu.indexOf("-")).trim();
                obj.amt = Number(resultSearch[i].getValue(myColumns[1]));
                
                obj.subsidiary_id = _params.subsidiary_id;
                arrResult.push(obj);
            }
            
            return arrResult;
        }
        
        const getDataBSCT2Pay = (_params) => {
            var resultSearch = search.load(SAVED_SEARCH.SS02_BS_CT2_PAY);
            var myFilter = resultSearch.filters;
            var myColumns = resultSearch.columns;
            
            if (!!_params.subsidiary_id) {
                myFilter.push(search.createFilter({
                    name: 'subsidiary',
                    operator: "anyof",
                    values: _params.subsidiary_id
                }));
            }
            
            if (!!_params.custpage_todt) {
                myFilter.push(search.createFilter({
                    name: 'trandate',
                    operator: "onorbefore",
                    values: _params.custpage_todt
                }));
            }
            
            resultSearch = resultSearch.run().getRange(0, 1000);
            var arrResult = [];
            for (var i = 0; i < resultSearch.length; i++) {
                var obj = {};
                var chitieu = resultSearch[i].getValue(myColumns[0]);
                var chitieu2 = resultSearch[i].getValue(myColumns[2]);
                obj.maso = chitieu.substr(0, chitieu.indexOf("-")).trim();
                obj.amt = Number(resultSearch[i].getValue(myColumns[1]));
                obj.maso2 = chitieu2.substr(0, chitieu2.indexOf("-")).trim();
                obj.account = resultSearch[i].getText(myColumns[3]);
                
                obj.subsidiary_id = _params.subsidiary_id;
                arrResult.push(obj);
            }
            return arrResult;
        }
        
        const getDataBSCT2Rec = (_params) => {
            var resultSearch = search.load(SAVED_SEARCH.SS03_BS_CT2_REC);
            var myFilter = resultSearch.filters;
            var myColumns = resultSearch.columns;
            
            if (!!_params.subsidiary_id) {
                myFilter.push(search.createFilter({
                    name: 'subsidiary',
                    operator: "anyof",
                    values: _params.subsidiary_id
                }));
            }
            
            if (!!_params.custpage_todt) {
                myFilter.push(search.createFilter({
                    name: 'trandate',
                    operator: "onorbefore",
                    values: _params.custpage_todt
                }));
            }
            
            resultSearch = resultSearch.run().getRange(0, 1000);
            var arrResult = [];
            for (var i = 0; i < resultSearch.length; i++) {
                var obj = {};
                var chitieu = resultSearch[i].getValue(myColumns[0]);
                var chitieu2 = resultSearch[i].getValue(myColumns[2]);
                obj.maso = chitieu.substr(0, chitieu.indexOf("-")).trim();
                obj.amt = Number(resultSearch[i].getValue(myColumns[1]));
                obj.maso2 = chitieu2.substr(0, chitieu2.indexOf("-")).trim();
                obj.account = resultSearch[i].getText(myColumns[3]);
                
                obj.subsidiary_id = _params.subsidiary_id;
                
                arrResult.push(obj);
            }
            return arrResult;
        }
        
        const getToDate = (_todt) => {
            if (libFunc.isContainValue(_todt)) {
                return _todt
            }
            return new Date();
        }
        
        const addFieldGroup = (_form, _id, _label) => {
            var _obj = {id: _id, label: _label}
            _form.addFieldGroup(_obj);
            return _obj;
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
        
        Date.prototype.addDays = function (days) {
            var date = new Date(this.valueOf());
            date.setDate(date.getDate() + days);
            return date;
        }
        
        return {
            onRequest
        };
        
    });
