/**
 * Nội dung:
 * =======================================================================================
 *  Date                Author                  Description
 *  ?                   ?                       ?
 * 25 Sep 2023          Huy Pham                Refactor script (lỗi timeout), from mr.Bính(https://app.clickup.com/t/865cttxv2)
 */
/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define([
        'N/format',
        'N/ui/serverWidget',
        'N/render',
        'N/search',
        'N/file',
        'N/runtime',
        'N/query',
        '../lib/scv_lib_common_html.js',
        '../common/scv_common_pdf',
        '../lib/scv_lib_report.js'],
    (
        format,
        serverWidget,
        render,
        search,
        file,
        runtime,
        query,
        libHtml,
        comPdf,
        libRep
    ) => {
        const SavedSearch = {
            SS01_NXT_BEG : 'customsearch_scv_nxt_beg_v2',
            SS02_NXT_TRANS : 'customsearch_scv_nxt_trans_v2',
        }

        const onRequest = (context) => {
            let request = context.request;
            let params = request.parameters;

            let curScript = runtime.getCurrentScript();

            if (curScript.deploymentId === "customdeploy_scv_sl_nxt_lot_v2_data") {
                let objResponse = {data: []};

                switch (params.action) {
                    case 'getDataBeginTotalPage':
                        objResponse.data = getDataBegin(params, true);
                        break;
                    case 'getDataBegin':
                        objResponse.data = getDataBegin(params, false);
                        break;
                    case 'getDataTrans':
                        objResponse.data = getDataTrans(params);
                        break;
                    case "getTemplateExcel":
                        objResponse.url = getExcelTemplateUrl();
                        break;
                    case "getPutawayNoBin":
                        objResponse.data = getPutawayNoBin(params);
                        break;
                }
                log.error('objResponse.data', objResponse.data);
                context.response.setHeader({name: 'Content-Type', value: 'application/json'});
                context.response.write(JSON.stringify(objResponse));
            } else {
                if (context.request.method === "GET") {
                    let MainForm = onCreateFormUI(params);
                    context.response.writePage(MainForm.form);
                }
            }
        }

        const onCreateFormUI = (_params) => {
            let mainForm = serverWidget.createForm({title: "Nhập Xuất Tồn theo số lô "});
            let mainGrp = addFieldGroup(mainForm, "fieldgrp_main", "Filter");
            mainForm.clientScriptModulePath = '../cssl/scv_cs_sl_nxt_lot_v2.js';

            mainForm.addButton({
                id: "custpage_btn_export",
                label: 'Refresh',
                functionName: "onRefreshForm()"
            });
            mainForm.addButton({
                id: "custpage_btn_search",
                label: "Search",
                functionName: "onSearchResult('F')"
            });
            mainForm.addButton({
                id: "custpage_btn_export",
                label: "Xuất Excel",
                functionName: "onExportResultOnForm()"
            });

            let subsidiary = _params.custpage_subsidiary || (runtime.getCurrentUser().subsidiary + '');

            let custpage_subsidiary = mainForm.addField({
                id: 'custpage_subsidiary',
                type: serverWidget.FieldType.SELECT,
                label: 'Công ty con',
                // source: "subsidiary",
                container: mainGrp.id
            });
            custpage_subsidiary.isMandatory = true;
            libRep.addSelectSubsidiary(custpage_subsidiary, _params.custpage_subsidiary);
            custpage_subsidiary.setHelpText({help: "Field custom: Subsidiary"});
            custpage_subsidiary.defaultValue  = subsidiary
            custpage_subsidiary.updateBreakType({breakType: 'STARTCOL'})

            let custpage_location = mainForm.addField({
                id: 'custpage_location',
                type: serverWidget.FieldType.MULTISELECT,
                label: 'Kho',
                container: mainGrp.id
            });

            custpage_location.setHelpText({help: "Field custom: Location"});
            let c = ['internalid', 'name'];
            let f = [['subsidiary', 'anyof', subsidiary]];
            libRep.addSelectionMulti(custpage_location, 'location', c, f, false, splitComa(_params.custpage_location));

            let custpage_item = mainForm.addField({
                id: 'custpage_item',
                type: serverWidget.FieldType.TEXT,
                label: 'Item',
                container: mainGrp.id
            });
            custpage_item.setHelpText({help: "Field custom: Item"});

            let custpage_lot_no = mainForm.addField({
                id: 'custpage_lot_no',
                type: serverWidget.FieldType.TEXT,
                label: 'Lot No',
                container: mainGrp.id
            });
            custpage_lot_no.setHelpText({help: "Field custom: Lot No"});
            custpage_lot_no.updateBreakType({breakType: 'STARTCOL'})

            let custpage_fromdate = mainForm.addField({
                id: 'custpage_fromdate',
                type: serverWidget.FieldType.DATE,
                label: 'Từ ngày',
                container: mainGrp.id
            }).updateLayoutType({layoutType: serverWidget.FieldLayoutType.STARTROW});
            custpage_fromdate.isMandatory = true;
            custpage_fromdate.setHelpText({help: "Field custom: From Date"});

            let custpage_todate = mainForm.addField({
                id: 'custpage_todate',
                type: serverWidget.FieldType.DATE,
                label: 'Đến ngày',
                container: mainGrp.id
            }).updateLayoutType({layoutType: serverWidget.FieldLayoutType.ENDROW});
            custpage_todate.isMandatory = true;
            custpage_todate.setHelpText({help: "Field custom: To Date"});

            let custpage_status = mainForm.addField({
                id: 'custpage_status',
                type: serverWidget.FieldType.MULTISELECT,
                source: 'inventorystatus',
                label: 'Trạng thái',
                container: mainGrp.id
            });
            custpage_status.defaultValue = _params.custpage_status;

            let nhomCap1F = mainForm.addField({
                id: 'custpage_nhom_cap_1',
                type: serverWidget.FieldType.MULTISELECT,
                label: 'Nhóm cấp 1',
                container: mainGrp.id
            }).updateBreakType({breakType: serverWidget.FieldBreakType.STARTCOL});

            let nhomCap2F = mainForm.addField({
                id: 'custpage_nhom_cap_2',
                type: serverWidget.FieldType.SELECT,
                label: 'Nhóm cấp 2',
                container: mainGrp.id
            }).updateBreakType({breakType: serverWidget.FieldLayoutType.STARTROW})
                .updateLayoutType({layoutType: serverWidget.FieldLayoutType.STARTROW});

            let nhomCap3F = mainForm.addField({
                id: 'custpage_nhom_cap_3',
                type: serverWidget.FieldType.SELECT,
                label: 'Nhóm cấp 3',
                container: mainGrp.id
            }).updateLayoutType({layoutType: serverWidget.FieldLayoutType.MIDROW});

            let nhomCap4F = mainForm.addField({
                id: 'custpage_nhom_cap_4',
                type: serverWidget.FieldType.SELECT,
                label: 'Nhóm cấp 4',
                container: mainGrp.id
            }).updateLayoutType({layoutType: serverWidget.FieldLayoutType.ENDROW});

            populateNhomCap1(mainForm, nhomCap1F, _params);
            if (_params.custpage_nhom_cap_1) {
                populateNhomCap2(mainForm, nhomCap2F, _params)
                populateNhomCap3(mainForm, nhomCap3F, _params)
                populateNhomCap4(mainForm, nhomCap4F, _params)
            }

            let checkBins = mainForm.addField({
                id : 'custpage_check_bins',
                type : serverWidget.FieldType.CHECKBOX,
                label : 'Tồn kho theo bin',
                container: mainGrp.id
            })
            checkBins.defaultValue = _params.custpage_check_bins || 'T'

            let optionGrid = onCreateDxGrid(_params);
            libHtml.renderDxGrid(mainForm, optionGrid, []);

            return {form: mainForm};
        }

        const getDataBegin = (params, isGetNumPage) => {
            let objSearch = search.load(SavedSearch.SS01_NXT_BEG);
            let myFilters = objSearch.filters;
            let myColumns = objSearch.columns;
            addToFiltersBegin(myFilters, params);

            // tính tổng số trang dữ liệu của ss Begin
            let  resultSearch = objSearch.runPaged({pageSize: 800});

            // trả lại tổng số trang để hiển thị màn hình tiến trình load trên UI
            if (isGetNumPage) {
                return resultSearch.pageRanges.length;
            }

            // nếu param có truyền số vị trí của trang dữ liệu cần lấy, lấy dữ liệu của đúng trang đó và gửi lên UI
            if (params.page >= 0 && params.page < resultSearch.pageRanges.length) {
                return getDataBeginOfPageIndex(objSearch, myColumns, params.page);
            }

            return [];
        }

        const addToFiltersBegin = (myFilters, params) => {
            if (!!params.custpage_nhom_cap_1) {
                myFilters.push(search.createFilter({
                    name: 'custitem_scv_group_lv1',
                    join: 'item',
                    operator: 'anyof',
                    values: params.custpage_nhom_cap_1.split(',')
                }));
            }

            if (!!params.custpage_nhom_cap_2) {
                myFilters.push(search.createFilter({
                    name: 'custitem_scv_group_lv2',
                    join: 'item',
                    operator: 'anyof',
                    values: params.custpage_nhom_cap_2
                }));
            }

            if (!!params.custpage_nhom_cap_3) {
                myFilters.push(search.createFilter({
                    name: 'custitem_scv_group_lv3',
                    join: 'item',
                    operator: 'anyof',
                    values: params.custpage_nhom_cap_3
                }));
            }

            if (!!params.custpage_nhom_cap_4) {
                myFilters.push(search.createFilter({
                    name: 'custitem_scv_group_lv4',
                    join: 'item',
                    operator: 'anyof',
                    values: params.custpage_nhom_cap_4
                }));
            }

            if (!!params.custpage_subsidiary) {
                myFilters.push(search.createFilter({
                    name: "subsidiary",
                    join: "transaction",
                    operator: 'anyof',
                    values: params.custpage_subsidiary
                }));
            }

            if (!!params.custpage_location) {
                myFilters.push(search.createFilter({
                    name: "location",
                    operator: search.Operator.ANYOF,
                    values: params.custpage_location.split(',')
                }));
            }

            if (!!params.custpage_item) {
                myFilters.push(search.createFilter({
                    name: "name",
                    join: 'item',
                    operator: search.Operator.CONTAINS,
                    values: params.custpage_item
                }));
            }

            if (!!params.custpage_lot_no) {
                myFilters.push(search.createFilter({
                    name: "inventorynumber",
                    join: "inventorynumber",
                    operator: search.Operator.CONTAINS,
                    values: params.custpage_lot_no
                }));
            }

            if (!!params.custpage_fromdate) {
                myFilters.push(search.createFilter({
                    name: 'trandate',
                    join: "transaction",
                    operator: search.Operator.BEFORE,
                    values: params.custpage_fromdate
                }));
            }

            if (!!params.custpage_status) {
                myFilters.push(search.createFilter({
                    name: 'status',
                    operator: search.Operator.ANYOF,
                    values: params.custpage_status.split(',')
                }));
            }
        }

        // lấy dữ liệu ss ở trang thứ ${pageIndex}
        const getDataBeginOfPageIndex = (objSearch, myColumns, pageIndex) => {
            let arrResult = [];

            // let arrDataCurrentPage = resultSearch.fetch({index: (pageIndex)}).data;
            let resultSet = objSearch.run();
            let start = pageIndex * 800;
            let end = start + 800 ;
            let arrDataCurrentPage = resultSet.getRange({ start: start, end: end }) || [];

            for (let idx = 0; idx < arrDataCurrentPage.length; idx++) {
                let objCurPage = arrDataCurrentPage[idx];
                let obj = {};
                obj.location = objCurPage.getValue(myColumns.find(col => col.label === 'location'));
                obj.location_display = objCurPage.getText(myColumns.find(col => col.label === 'location'));
                obj.item = objCurPage.getValue(myColumns.find(col => col.label === 'item'));
                obj.inventory_number = objCurPage.getValue(myColumns.find(col => col.label === 'inventory_number'));
                obj.inventory_number_display = objCurPage.getText(myColumns.find(col => col.label === 'inventory_number')).replace('- None -','');
                obj.inventory_number_display_link = generateLinkLot(obj.inventory_number, obj.inventory_number_display);
                obj.item_primary_stock_unit = objCurPage.getValue(myColumns.find(col => col.label === 'item_primary_stock_unit'));
                obj.item_primary_stock_unit_display = objCurPage.getText(myColumns.find(col => col.label === 'item_primary_stock_unit'));
                obj.item_count = objCurPage.getValue(myColumns.find(col => col.label === 'item_count'));

                obj.item_primary_sale_unit = objCurPage.getValue(myColumns.find(col => col.label === 'item_primary_sale_unit'));
                obj.expired_date = objCurPage.getValue(myColumns.find(col => col.label === 'expired_date'));
                obj.stock_unit_conversion = objCurPage.getValue(myColumns.find(col => col.label === 'stock_unit_conversion'));
                obj.status = objCurPage.getValue(myColumns.find(col => col.label === 'status'));
                obj.status_display = objCurPage.getText(myColumns.find(col => col.label === 'status'));
                obj.color_seri = objCurPage.getValue(myColumns.find(col => col.label === 'color_seri')).replace('- None -','');

                obj.trong_luong_loi = objCurPage.getValue(myColumns.find(col => col.label === 'trong_luong_loi'));
                obj.ngay_sx = objCurPage.getValue(myColumns.find(col => col.label === 'ngay_sx'));
                obj.ghi_chu = objCurPage.getValue(myColumns.find(col => col.label === 'ghi_chu')).replace('- None -','');
                obj.upc_code = convertRawName(objCurPage.getValue(myColumns.find(col => col.label === 'upc_code')));
                // obj.item_display_name = objCurPage.getValue(myColumns.find(col => col.label === 'item_display_name'));
                obj.item_display_name = convertRawName(objCurPage.getValue(myColumns.find(col => col.label === 'item_display_name')));

                obj.ma_cu = convertRawName(objCurPage.getValue(myColumns.find(col => col.label === 'ma_cu')).replace('- None -',''));
                obj.bin_number = objCurPage.getValue(myColumns.find(col => col.label === 'bin_number'));
                obj.bin_number_display = objCurPage.getText(myColumns.find(col => col.label === 'bin_number')).replace('- None -','');
                obj.luong_dieu_chuyen = objCurPage.getValue(myColumns.find(col => col.label === 'luong_dieu_chuyen')) || 0;

                arrResult.push(obj);
            }
            return arrResult;
        }

        const getDataTrans = (params) => {
            let objSearch = search.load(SavedSearch.SS02_NXT_TRANS);
            let myFilters = objSearch.filters;
            let myColumns = objSearch.columns;
            addToFiltersTrans(myFilters, params);

            let resultSearch = objSearch.runPaged({pageSize: 800});
            let resultSet = objSearch.run();
            let arrResult = [];

            // lấy tất cả dữ liệu các giao dịch trong kỳ
            for (let i = 0; i < resultSearch.pageRanges.length; i++) {
                // let currentPage = resultSearch.fetch({index: i}).data;

                let start = i * 800;
                let end = start + 800;
                let currentPage = resultSet.getRange({ start: start, end: end }) || [];

                for (let idx = 0; idx < currentPage.length; idx++) {
                    let objCurPage = currentPage[idx];
                    let obj = {};

                    obj.location = objCurPage.getValue(myColumns.find(col => col.label === 'location'));
                    obj.location_display = objCurPage.getText(myColumns.find(col => col.label === 'location'));
                    obj.item = objCurPage.getValue(myColumns.find(col => col.label === 'item'));
                    obj.inventory_number = objCurPage.getValue(myColumns.find(col => col.label === 'inventory_number'));
                    obj.inventory_number_display = objCurPage.getText(myColumns.find(col => col.label === 'inventory_number')).replace('- None -','');
                    obj.inventory_number_display_link = generateLinkLot(obj.inventory_number, obj.inventory_number_display);
                    obj.item_primary_stock_unit = objCurPage.getValue(myColumns.find(col => col.label === 'item_primary_stock_unit'));
                    obj.item_primary_stock_unit_display = objCurPage.getText(myColumns.find(col => col.label === 'item_primary_stock_unit'));
                    obj.qty_in = objCurPage.getValue(myColumns.find(col => col.label === 'qty_in'));
                    obj.qty_out = objCurPage.getValue(myColumns.find(col => col.label === 'qty_out'));

                    obj.item_primary_sale_unit = objCurPage.getValue(myColumns.find(col => col.label === 'item_primary_sale_unit'));
                    obj.expired_date = objCurPage.getValue(myColumns.find(col => col.label === 'expired_date'));
                    obj.stock_unit_conversion = objCurPage.getValue(myColumns.find(col => col.label === 'stock_unit_conversion'));
                    obj.upc_code = convertRawName(objCurPage.getValue(myColumns.find(col => col.label === 'upc_code')));
                    obj.item_display_name = convertRawName(objCurPage.getValue(myColumns.find(col => col.label === 'item_display_name')));

                    obj.ghi_chu = objCurPage.getValue(myColumns.find(col => col.label === 'ghi_chu')).replace('- None -','');
                    obj.status = objCurPage.getValue(myColumns.find(col => col.label === 'status'));
                    obj.status_display = objCurPage.getText(myColumns.find(col => col.label === 'status'));
                    obj.ma_cu = convertRawName(objCurPage.getValue(myColumns.find(col => col.label === 'ma_cu')).replace('- None -',''));
                    obj.bin_number = objCurPage.getValue(myColumns.find(col => col.label === 'bin_number'));
                    obj.bin_number_display = objCurPage.getText(myColumns.find(col => col.label === 'bin_number')).replace('- None -','');
                    obj.color_seri = objCurPage.getValue(myColumns.find(col => col.label === 'color_seri')).replace('- None -','');

                    obj.ngay_sx = objCurPage.getValue(myColumns.find(col => col.label === 'ngay_sx'));
                    obj.trong_luong_loi = objCurPage.getValue(myColumns.find(col => col.label === 'trong_luong_loi'));
                    obj.luong_xuat_ban = objCurPage.getValue(myColumns.find(col => col.label === 'luong_xuat_ban')) || 0;
                    obj.luong_dieu_chuyen = objCurPage.getValue(myColumns.find(col => col.label === 'luong_dieu_chuyen')) || 0;
                    obj.internal_id = objCurPage.getValue(myColumns.find(col => col.label === 'internal_id'));


                    arrResult.push(obj);
                }
            }
            return arrResult ;
        }

        const convertRawName = (rawName) => {
            return rawName.replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&');
        }

        const addToFiltersTrans = (myFilters, parameters) => {
            if (!!parameters.custpage_nhom_cap_1) {
                myFilters.push(search.createFilter({
                    name: 'custitem_scv_group_lv1',
                    join: 'item',
                    operator: 'anyof',
                    values: parameters.custpage_nhom_cap_1.split(',')
                }));
            }

            if (!!parameters.custpage_nhom_cap_2) {
                myFilters.push(search.createFilter({
                    name: 'custitem_scv_group_lv2',
                    join: 'item',
                    operator: 'anyof',
                    values: parameters.custpage_nhom_cap_2
                }));
            }

            if (!!parameters.custpage_nhom_cap_3) {
                myFilters.push(search.createFilter({
                    name: 'custitem_scv_group_lv3',
                    join: 'item',
                    operator: 'anyof',
                    values: parameters.custpage_nhom_cap_3
                }));
            }

            if (!!parameters.custpage_nhom_cap_4) {
                myFilters.push(search.createFilter({
                    name: 'custitem_scv_group_lv4',
                    join: 'item',
                    operator: 'anyof',
                    values: parameters.custpage_nhom_cap_4
                }));
            }

            if (!!parameters.custpage_subsidiary) {
                myFilters.push(search.createFilter({
                    name: "subsidiary",
                    join: "transaction",
                    operator: 'anyof',
                    values: parameters.custpage_subsidiary
                }));
            }

            if (!!parameters.custpage_location ) {
                myFilters.push(search.createFilter({
                    name: "location",
                    operator: search.Operator.ANYOF,
                    values: parameters.custpage_location.split(',')
                }));
            }

            if (!!parameters.custpage_item){
                myFilters.push(search.createFilter({
                    name: "name",
                    join: 'item',
                    operator: search.Operator.CONTAINS,
                    values: parameters.custpage_item
                }));
            }

            if (!!parameters.custpage_lot_no) {
                myFilters.push(search.createFilter({
                    name: "inventorynumber",
                    join: "inventorynumber",
                    operator: search.Operator.CONTAINS,
                    values: parameters.custpage_lot_no
                }));
            }

            if (!!parameters.custpage_fromdate) {
                myFilters.push(search.createFilter({
                    name: 'trandate',
                    join: "transaction",
                    operator: search.Operator.WITHIN,
                    values: [parameters.custpage_fromdate, parameters.custpage_todate]
                }));
            }

            if (!!parameters.custpage_status) {
                myFilters.push(search.createFilter({
                    name: 'status',
                    operator: search.Operator.ANYOF,
                    values: parameters.custpage_status.split(',')
                }));
            }
        }

        //Logic get bin putaway
        const getPutawayNoBin = (params) => {
            if (!params.custpage_fromdate || !params.custpage_todate) return [];

            const toIso = (s) => {
                let d = format.parse({ value: s, type: format.Type.DATE });
                let mm = ('0' + (d.getMonth() + 1)).slice(-2);
                let dd = ('0' + d.getDate()).slice(-2);
                return d.getFullYear() + '-' + mm + '-' + dd;
            };

            let fromIso = toIso(params.custpage_fromdate);
            let toIso2  = toIso(params.custpage_todate);

            // Mirror đúng scope của báo cáo (kho + trạng thái). Có thể bổ sung item/nhóm nếu cần.
            // Lưu ý: dù không lọc hết, dòng dư cũng vô hại vì chỉ ghép vào nhóm no-bin đang hiển thị.
            let conds = [];
            if (params.custpage_location)
                conds.push("tl.location IN (" + params.custpage_location.split(',').map(Number).filter(Boolean).join(',') + ")");
            if (params.custpage_status)
                conds.push("ia.inventoryStatus IN (" + params.custpage_status.split(',').map(Number).filter(Boolean).join(',') + ")");
            let extra = conds.length ? ("AND " + conds.join(" AND ")) : "";

            let sql =
                " SELECT " +
                "   tl.item            AS item, " +
                "   tl.location        AS location, " +
                "   ia.inventoryStatus AS status, " +
                "   ia.inventoryNumber AS inventory_number, " +
                "   SUM(CASE WHEN t.trandate <  TO_DATE('" + fromIso + "','YYYY-MM-DD') THEN ia.quantity ELSE 0 END) AS putaway_before, " +
                "   SUM(CASE WHEN t.trandate >= TO_DATE('" + fromIso + "','YYYY-MM-DD') THEN ia.quantity ELSE 0 END) AS putaway_in_period " +
                " FROM inventoryassignment ia " +
                " JOIN transaction      t  ON t.id = ia.transaction " +
                " JOIN transactionline  tl ON tl.transaction = ia.transaction AND tl.id = ia.transactionLine " +
                " WHERE t.type = 'BinWksht' " +
                "   AND ia.bin IS NOT NULL " +
                "   AND ia.quantity > 0 " +
                "   AND t.trandate < TO_DATE('" + toIso2 + "','YYYY-MM-DD') + 1 " +
                "   " + extra + " " +
                "   AND NOT EXISTS ( " +
                "         SELECT 1 FROM inventoryassignment ia2 " +
                "         WHERE ia2.transaction     = ia.transaction " +
                "           AND ia2.transactionLine = ia.transactionLine " +
                "           AND ia2.quantity < 0) " +
                " GROUP BY tl.item, tl.location, ia.inventoryStatus, ia.inventoryNumber ";

            return query.runSuiteQL({ query: sql }).asMappedResults();
        };

        const addFieldGroup = (_form, _id, _label) => {
            let _obj = {id: _id, label: _label}
            _form.addFieldGroup(_obj);
            return _obj;
        }

        // có thể tối ưu honw, sẽ đưa lên SB test sau
        const populateNhomCap1 = (form, nhomCap1F, parameters) => {
            let strQuery = `
                SELECT id, name
                FROM customrecord_scv_group_level
                WHERE parent IS NULL
                ORDER BY name ASC
            `;
            let result = query.runSuiteQL({query: strQuery}).asMappedResults();

            nhomCap1F.addSelectOption({value: '', text: '',});
            if (result && result.length > 0) {
                result.forEach(item => {
                    nhomCap1F.addSelectOption({value: item.id, text: `${item.name}`,});
                });
            }
            if (parameters.custpage_nhom_cap_1) nhomCap1F.defaultValue = parameters.custpage_nhom_cap_1.split(',');
        }

        const populateNhomCap2 = (form, nhomCap2F, parameters) => {
            let idNhomCap1 = parameters.custpage_nhom_cap_1.split(',').filter(Boolean).map(item => `'${item}'`).join(',');
            setSelectOptionToDefaults(nhomCap2F);
            if (idNhomCap1) {
                addSelectOptionByParent(idNhomCap1, nhomCap2F);
            }
            nhomCap2F.defaultValue = parameters.custpage_nhom_cap_2;
        }

        const populateNhomCap3 = (form, nhomCap3F, parameters) => {
            let idNhomCap2 = parameters.custpage_nhom_cap_2;
            setSelectOptionToDefaults(nhomCap3F);
            if (idNhomCap2) {
                addSelectOptionByParent(idNhomCap2, nhomCap3F);
            }
            nhomCap3F.defaultValue = parameters.custpage_nhom_cap_3;
        }

        const populateNhomCap4 = (form, nhomCap4F, parameters) => {
            let idNhomCap3 = parameters.custpage_nhom_cap_3;
            setSelectOptionToDefaults(nhomCap4F);
            if (idNhomCap3) {
                addSelectOptionByParent(idNhomCap3, nhomCap4F);
            }
            nhomCap4F.defaultValue = parameters.custpage_nhom_cap_4;
        }

        const setSelectOptionToDefaults = (field) => {
            field.getSelectOptions().forEach(option => {
                field.removeSelectOption({value: option.value});
            });
            field.addSelectOption({value: '', text: '', isSelected: true});
        }

        const addSelectOptionByParent = (idParent, fieldChild) => {
            let strQuery = `
                SELECT id, name
                FROM customrecord_scv_group_level
                WHERE parent IN (${idParent})
                ORDER BY name ASC
            `;
            let result = query.runSuiteQL({query: strQuery}).asMappedResults();
            if (result && result.length > 0) {
                result.forEach(item => {
                    fieldChild.addSelectOption({value: item.id, text: `${item.name}`,});
                });
            }
        }

        const onCreateDxGrid = (_params) => {
            let columnsGrid = [
                {dataField: 'item', caption: 'ID Item', dataType: "string"},
                {dataField: 'location_display', caption: 'Kho', dataType: "string"},
                {dataField: 'bin_number_display', caption: 'Bin', dataType: "string"},
                {dataField: 'upc_code', caption: 'Mã', dataType: "string", encodeHtml: false},
                {dataField: 'item_display_name', caption: 'Tên', dataType: "string", encodeHtml: false},

                {dataField: 'item_primary_stock_unit_display', caption: 'ĐVT (stock)', dataType: "string"},
                {   dataField: 'inventory_number_display_link',
                    caption: 'Số lô',
                    encodeHtml: false,
                }, // nơi hiển thị số lô
                {dataField: 'color_seri', caption: 'Seri màu', dataType: "string"},
                {dataField: 'item_count', caption: 'Đầu kỳ', dataType: "number", format: "###,###,##0.00"},
                {dataField: 'qty_in', caption: 'Nhập', dataType: "number", format: "###,###,##0.000"},

                {dataField: 'qty_out', caption: 'Xuất', dataType: "number", format: "###,###,##0.000"},
                {dataField: 'qty_end', caption: 'Cuối kỳ', dataType: "number", format: "###,###,##0.00"},
                {dataField: 'status_display', caption: 'Trạng thái', dataType: "string"},
                {dataField: 'ghi_chu', caption: 'Ghi chú', dataType: "string"},
                {dataField: 'ngay_sx', caption: 'Ngày nhập kho', dataType: "string"},

                {dataField: 'expired_date', caption: 'Ngày hết hạn', dataType: "string"},
                {dataField: 'trong_luong_loi', caption: 'Trọng lượng lõi', dataType: "string"},
                {dataField: 'ma_cu', caption: 'Mã cũ', dataType: "string", encodeHtml: false},
                {dataField: 'luong_dieu_chuyen', caption: 'Điều chuyển', dataType: "string"},
                {dataField: 'luong_xuat_ban', caption: 'Xuất bán', dataType: "string"},

            ];

            if( _params.custpage_check_bins !== 'T') {
              columnsGrid.splice(2, 1);
            }

            return {
                columns: columnsGrid,
                exportExcelEnable: true,
                excel: {name: "Nhập Xuất Tồn theo số Lô"},
                columnChooser: false,
                filterRowVisible: false,
                headerFilterVisible: false,
                rowAlternationEnabled: true,
                pageSize: 500,
                onRowPrepared: (e) => {
                    if (e.rowType === "data" && e.rowIndex === 0) {
                        e.rowElement.style.fontWeight = "bold";
                    }
                }
            };
        }

        const generateLinkLot = (idLot, lotNo) => {
            if (!idLot) return '';
            const linkLot = `/app/accounting/transactions/inventory/inventorynumberrecord.nl?id=${idLot}&id=${idLot}`;
            // return '<a href="' + linkLot + '"  target="_blank">' + lotNo + '</a>';
            return `
        <a href="${linkLot}" target="_blank"
           style="color:black; text-decoration:underline; font-weight:normal;">
           ${lotNo}
        </a>
    `;

        };

        const getExcelTemplateUrl = () => {
            return file.load({id: '../xls/scv_xlsx_nxt_lot_v2.xlsx'}).url;
        }

        const splitComa = (input) => {
            return input ? util.isArray(input) ? input : input.split('>>>>>>') : input;
        }

        return {
            onRequest: onRequest,
        };
    });
