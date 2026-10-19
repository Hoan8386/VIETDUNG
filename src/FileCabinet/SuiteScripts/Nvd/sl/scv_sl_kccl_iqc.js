/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(["N/record", "N/render", 'N/file', 'N/search', 'N/ui/serverWidget', '../lib/scv_lib_common_html.js'],
    (record, render, file, search, serverWidget, libHtml, ) => {

        const SS_DMNCC = {// customsearch_scv_btkh
            MA_NCC: 0,
            TEN_NCC: 1,
            PHANLOAI: 2,
            PARENT: 3,
            GIAYPHEP_THANHLAP: 4,
            GIAYPHEP_CON: 5,
            GIAYPHEP: 6,
            NGAYCAP: 7,
            NGAY_HHL: 8,
            DIACHI: 9,
            PHAMVI_CHUNGNHAN: 10,
            DV_TRUNGGIAN: 11,
        }

        function onRequest(scriptContext) {
            try {
                let response = scriptContext.response;
                let request = scriptContext.request;
                let params = request.parameters;
                let result = [];
                let action = params.action;
                if (params.isSearch === "T" ) {
                    result = getSSDMNCC(params);
                }
                if (params.isgetdata === 'T') {
                    response.write(JSON.stringify({
                        result: result,
                    } || {}));
                } else if (action === 'getUrlTemplate') {
                    response.write(JSON.stringify({urlTemplate: getUrlFileTemplate()}));
                }
                if (scriptContext.request.method === "GET") {
                    let MainForm = onCreateFormUI(params, scriptContext);
                    let optionGrid = onCreateDxGrid(result);
                    libHtml.renderDxGrid(MainForm.form, optionGrid, result);

                    response.writePage(MainForm.form);
                }

            } catch (e) {
                log.error('onRequest error', e);
            }
        }

        const onCreateFormUI = (params, scriptContext) => {
            if (scriptContext.request.method === "GET") {
                let params = scriptContext.request.parameters;
                let mainForm = serverWidget.createForm({title: "BÁO CÁO DANH MỤC NHÀ CUNG CẤP"});
                mainForm.clientScriptModulePath = "../cs/scv_cs_rp_danhmuc_ncc.js";
                let mainGrp = addFieldGroup(mainForm, "fieldgrp_main", "Criteria");
                mainForm.addButton({id: "custpage_btn_search", label: "Search", functionName: "onSearchResult()"});
                mainForm.addButton({id: 'custpage_bt_export', label: 'Excel', functionName: 'exportReport()'});
                let custpage_subsidiary = mainForm.addField({
                    id: "custpage_subsidiary",
                    type: "select",
                    label: "Công ty/Chi nhánh",
                    container: mainGrp.id,
                    source: "customrecord_scv_entity_category"
                });
                let custpage_phieunhapkho = mainForm.addField({
                    id: "custpage_phieunhapkho",
                    type: "select",
                    label: "Số phiếu nhập kho/ Lệnh sản xuất",
                    container: mainGrp.id,
                    source: "customrecord_scv_entity_category"
                });
                let custpage_donmuahang = mainForm.addField({
                    id: "custpage_donmuahang",
                    type: "select",
                    label: "Số đơn mua hàng",
                    container: mainGrp.id,
                    source: "customrecord_scv_entity_category"
                });
                let custpage_phieukiemtra = mainForm.addField({
                    id: "custpage_phieukiemtra",
                    type: "select",
                    label: "Số phiếu kiểm tra",
                    container: mainGrp.id,
                    source: "customrecord_scv_entity_category"
                });
                // if (params.custpage_category) {
                //     custpage_category.defaultValue = params.custpage_category;
                // }
                let custpage_kho = mainForm.addField({
                    id: "custpage_kho",
                    type: "select",
                    label: "Kho",
                    container: mainGrp.id,
                    source: "customrecord_scv_entity_category"
                });
                let custpage_solo = mainForm.addField({
                    id: "custpage_solo",
                    type: "select",
                    label: "Số phiếu kiểm tra",
                    container: mainGrp.id,
                    source: "customrecord_scv_entity_category"
                });
                let custpage_mathang = mainForm.addField({
                    id: "custpage_mathang",
                    type: "text",
                    label: "Số phiếu kiểm tra",
                    container: mainGrp.id,
                });
                let custpage_mahang = mainForm.addField({
                    id: "custpage_mahang",
                    type: "text",
                    label: "Số phiếu kiểm tra",
                    container: mainGrp.id,
                });

                return {form: mainForm};
            }
        };
        const getUrlFileTemplate = () => {
            let pathFile = '../xls/scv_sl_xlsx_danhmuc_ncc.xlsx';
            let fileLoad = file.load({id: pathFile});
            return fileLoad.url;
        }

        const onCreateDxGrid = () => {
            let columnsGrid = getDataColumnGrid();
            return {
                columns: columnsGrid,
                exportExcelEnable: true,
                excel: {name: "Báo cáo danh mục nhà cung cấp.xlsx"},
                columnChooser: true,
                filterRowVisible: false,
                headerFilterVisible: true,
                rowAlternationEnabled: false,
                wordWrapEnabled: false,
                sortingMode: "multiple",
                groupPanel: false,
                pageSize: 500
            };
        }
        const getDataColumnGrid = () => {
            return [
                {caption: "STT", dataField: "stt", dataType: "number", format: "###,###,##0"},
                {caption: "Mã NCC", dataField: "ma_ncc", dataType: "string"},
                {caption: "Tên nhà cung cấp", dataField: "ten_ncc", dataType: "string"},
                {caption: "Địa chỉ nhà cung cấp", dataField: "diachi", dataType: "string"},
                {caption: "Phân loại", dataField: "phanloai", dataType: "string"},
                {caption: "Giấy phép thành lập", dataField: "giayphep_thanhlap", dataType: "string"},
                {caption: "Giấy phép con", dataField: "giayphep_con", dataType: "string"},
                {caption: "Giấy phép", dataField: "giayphep", dataType: "string"},
                {caption: "Ngày cấp GDP/ GMP", dataField: "ngaycap", dataType: "string"},
                {caption: "Ngày hết hiệu lực", dataField: "ngay_hhl", dataType: "string"},
                {caption: "Phạm vi chứng nhận", dataField: "phamvi_chungnhan", dataType: "string"},
                {caption: "Đơn vị tra cứu trung gian", dataField: "dv_trunggina", dataType: "string"},
            ];
        }

        function getSSDMNCC(_params) {
            let resultSearch = search.load("customsearch_scv_dm_ncc");
            const myColumns = resultSearch.columns;
            const myFilters = resultSearch.filters;
            if (_params.custpage_category) {
                myFilters.push(search.createFilter({
                    name: 'parent',
                    join: 'custentity_scv_vendor_cate',
                    operator: "anyof",
                    values: _params.custpage_category
                }));
            }
            if (_params.custpage_fromdt) {
                myFilters.push(search.createFilter({
                    name: 'trandate',
                    join: 'transaction',
                    operator: "onorafter",
                    values: _params.custpage_fromdt
                }));
            }
            if (_params.custpage_todt) {
                myFilters.push(search.createFilter({
                    name: 'trandate',
                    join: 'transaction',
                    operator: "onorbefore",
                    values: _params.custpage_todt
                }));
            }

            let searchPaged = resultSearch.runPaged({pageSize: 1000});
            let arrDataSSDMNCC = [];
            let counter = 1;
            for (let i = 0; i < searchPaged.pageRanges.length; i++) {
                let currentPage = searchPaged.fetch({index: i}).data;
                for (let idx = 0; idx < currentPage.length; idx++) {
                    arrDataSSDMNCC.push({
                        stt: counter,
                        ma_ncc: currentPage[idx].getValue(myColumns[SS_DMNCC.MA_NCC]),
                        ten_ncc: currentPage[idx].getValue(myColumns[SS_DMNCC.TEN_NCC]),
                        phanloai: currentPage[idx].getValue(myColumns[SS_DMNCC.PHANLOAI]),
                        parent: currentPage[idx].getValue(myColumns[SS_DMNCC.PARENT]),
                        giayphep_thanhlapc: currentPage[idx].getValue(myColumns[SS_DMNCC.GIAYPHEP_THANHLAP]),
                        giayphep_con: currentPage[idx].getValue(myColumns[SS_DMNCC.GIAYPHEP_CON]),
                        giayphep: currentPage[idx].getValue(myColumns[SS_DMNCC.GIAYPHEP]),
                        ngaycap: currentPage[idx].getValue(myColumns[SS_DMNCC.NGAYCAP]),
                        ngay_hhl: currentPage[idx].getValue(myColumns[SS_DMNCC.NGAY_HHL]),
                        diachi: currentPage[idx].getValue(myColumns[SS_DMNCC.DIACHI]),
                        phamvi_chungnhan: currentPage[idx].getValue(myColumns[SS_DMNCC.PHAMVI_CHUNGNHAN]) || '',
                        dv_trunggina: currentPage[idx].getValue(myColumns[SS_DMNCC.DV_TRUNGGIAN]) || '',
                    });
                    counter++;
                }
            }
            return arrDataSSDMNCC;
        }

        function addFieldGroup(_form, _id, _label) {
            var _obj = {id: _id, label: _label}
            _form.addFieldGroup(_obj);
            return _obj;
        }

        return {
            onRequest: onRequest
        };
    });
