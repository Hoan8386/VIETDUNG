/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define([
    'N/runtime', 'N/query', 'N/search', 'N/format', 'N/file',
    '../olib/moment.js',
    '../cons/scv_cons_form.js',
    '../cons/scv_cons_subsidiary.js',
    '../cons/scv_cons_search_inv_balancebystatus.js',
    '../cons/scv_cons_search_inv_sales_comsump.js',
    '../cons/scv_cons_search_inv_orderandtransit.js',
    '../cons/scv_cons_search_inv_balancebyitem.js',
    '../cons/scv_cons_search_begin_balancebyitem.js',
    '../cons/scv_cons_search_inv_qtyonorderbypo.js',
    '../cons/scv_cons_search_inv_qtyonorderbyitr.js'
],
    (
        runtime, query, search, format, file,
        moment,
        constForm,
        constSubsidiary,
        searchInvBalanceStatus,
        searchInvSalesComsump,
        searchInvOrderAndTransit,
        searchInvBalanceItem,
        searchBeginBalanceItem,
        searchInvQtyOrderByPO,
        searchInvQtyOrderByITR
    ) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */

        const Suitelet = {
            ID: "customscript_scv_sl_inv_analysis_rpt",
            DEPLOYID_UI: "customdeploy_scv_sl_inv_analysis_rpt",
            DEPLOYID_DATA: "customdeploy_scv_sl_inv_analysis_data",
        };

        const ReportType = {
            InventoryAnalysis: {
                ID: "invanalysis",
                NAME: "Phân tích tồn kho"
            },
            InventoryHistory: {
                ID: "invhistory",
                NAME: "Lịch sử tồn kho"
            }
        }

        const onRequest = (scriptContext) => {
            constForm.setContext(scriptContext);
            constForm.setServiceScript(Suitelet.ID, Suitelet.DEPLOYID_DATA);

            let request = scriptContext.request;
            let params = request.parameters;
            let curScript = runtime.getCurrentScript();
    
            // TODO: deployment for data
            if(curScript.deploymentId == Suitelet.DEPLOYID_DATA) {
                defaultParams(params);
                let objResponse = {data: []};

                switch(params.action) {
                    // type 01:
                    case "getDataPeriod":
                        objResponse.data = getDataPeriod(params);
                        break;
                    case "getDataSSInvBalanceByStatus":
                        objResponse.data = getDataSSInvBalanceByStatus(params);
                        break;
                    case "getDataSSInvSalesComSump":
                        objResponse.data = getDataSSInvSalesComSump(params);
                        break;
                    case "getDataSSInvOrderAndTransit":
                        objResponse.data = getDataSSInvOrderAndTransit(params);
                        break;
                    case "getDataSSInvQtyOrderByPO":
                        objResponse.data = getDataSSInvQtyOrderByPO(params);
                        break;
                    case "getDataSSInvQtyOrderByITR":
                        objResponse.data = getDataSSInvQtyOrderByITR(params);
                        break;
                    // type 02
                    case "getDataSSInvBalanceByItem":
                        objResponse.period = params.period;
                        objResponse.data = getDataSSInvBalanceByItem(params);
                        break;
                    case "getDataSSBeginBalanceItem":
                        objResponse.data = getDataSSBeginBalanceItem(params);
                        break;
                }
                
                constForm.write(objResponse);
            } 
            // TODO: deployment for ui
            else{
                if(request.method == "GET"){
                    onCreateFormUI(params);
                    constForm.writePage();
                }
            }
        }

        const onCreateFormUI = (params) =>{
            defaultParams(params);
            constForm.createForm({title: "Báo cáo phân tích tồn kho"}, "../cssl/scv_cs_sl_inv_analysis_rpt.js");

            constForm.addPageLink([
                searchInvBalanceStatus.ID, searchInvSalesComsump.ID, searchInvOrderAndTransit.ID,
                searchInvBalanceItem.ID, searchBeginBalanceItem.ID,
                searchInvQtyOrderByPO.ID, searchInvQtyOrderByITR.ID
            ]);
            constForm.addButton({id: "custpage_btn_search", label: "Search", functionName: "onSearchResult('F')"});
            constForm.addButton({id: "custpage_btn_export", label: "Export", functionName: "onSearchResult('T')"});
            let mainGrp = constForm.addFieldGroup({id: "fieldgrp_main", label: "Thông tin tìm kiếm"});

            constForm.addField({
                id: 'custpage_report_type', label: 'Loại báo cáo', container: mainGrp.id,
                type: "select"
            }, true, {
                defaultValue: params.custpage_report_type,
                lookup: {
                    data: getDataReportType(),
                    valueExpr: "internalid",
                    displayExpr: "name"
                },
                // breakType: "startcol"
            });

            constForm.addField({
                id: 'custpage_subsidiary', label: 'Công ty', container: mainGrp.id,
                type: "select"
            }, true, {
                defaultValue: params.custpage_subsidiary,
                lookup: {
                    data: constSubsidiary.getDataSubsidiaryByUserRole(),
                    valueExpr: "id",
                    displayExpr: "namenohierarchy"
                }
            });

            constForm.addField({
                id: 'custpage_label_tonkho', label: 'Tồn kho', type: "label", container: mainGrp.id
            }, false);
            constForm.addField({
                id: 'custpage_fromdt', label: 'Từ ngày', type: "date", container: mainGrp.id
            }, false, {
                layoutType: "startrow",
                displayType: "disabled",
                defaultValue: params.custpage_fromdt
            });

            constForm.addField({
                id: 'custpage_todt', label: 'Đến ngày', type: "date", container: mainGrp.id
            }, true, {
                layoutType: "endrow",
                defaultValue: params.custpage_todt
            });

            constForm.addField({
                id: 'custpage_label_lsthxb', label: 'Lịch sử tiêu hao, xuất bán', type: "label", container: mainGrp.id
            }, false);
            constForm.addField({
                id: 'custpage_fromdt_lsthxb', label: 'Từ ngày', type: "date", container: mainGrp.id
            }, true, {
                layoutType: "startrow",
                defaultValue: params.custpage_fromdt_lsthxb
            });

            constForm.addField({
                id: 'custpage_todt_lsthxb', label: 'Đến ngày', type: "date", container: mainGrp.id
            }, true, {
                layoutType: "endrow",
                defaultValue: params.custpage_todt_lsthxb
            });

            constForm.addField({
                id: 'custpage_item', label: 'Mã/Tên hàng hóa', container: mainGrp.id,
                type: "text",
            }, false, {
                defaultValue: params.custpage_item,
            });

            constForm.addField({
                id: 'custpage_location', label: 'Kho', container: mainGrp.id,
                type: "multiselect"
            }, false, {
                defaultValue: params.custpage_location,
                lookup: {
                    data: getDataLocationBySub(params.custpage_subsidiary),
                    valueExpr: "id",
                    displayExpr: "name"
                }
            });

            constForm.addField({
                id: 'custpage_plan_category', label: 'Nhóm kế hoạch', container: mainGrp.id,
                type: "multiselect", source: "customrecord_scv_planning_category"
            }, false, {
                defaultValue: params.custpage_plan_category,
                // breakType: "startcol"
            });

            constForm.addField({
                id: 'custpage_group_lv1', label: 'Nhóm cấp 1', container: mainGrp.id,
                type: "multiselect"
            }, false, {
                defaultValue: params.custpage_group_lv1,
                lookup: {
                    data: getDataGroupLevelParent(),
                    valueExpr: "id",
                    displayExpr: "name"
                }
            });

            constForm.addField({
                id: 'custpage_group_lv2', label: 'Nhóm cấp 2', container: mainGrp.id,
                type: "multiselect"
            }, false, {
                defaultValue: params.custpage_group_lv2,
                lookup: {
                    data: getDataGroupLevelByParent(params.custpage_group_lv1),
                    valueExpr: "id",
                    displayExpr: "name"
                }
            });

            constForm.addField({
                id: 'custpage_group_lv3', label: 'Nhóm cấp 3', container: mainGrp.id,
                type: "multiselect"
            }, false, {
                defaultValue: params.custpage_group_lv3,
                lookup: {
                    data: getDataGroupLevelByParent(params.custpage_group_lv2),
                    valueExpr: "id",
                    displayExpr: "name"
                },
                // breakType: "startcol"
            });

            constForm.addField({
                id: 'custpage_group_lv4', label: 'Nhóm cấp 4', container: mainGrp.id,
                type: "multiselect"
            }, false, {
                defaultValue: params.custpage_group_lv4,
                lookup: {
                    data: getDataGroupLevelByParent(params.custpage_group_lv3),
                    valueExpr: "id",
                    displayExpr: "name"
                }
            });

            constForm.addField({
                id: 'custpage_chk_psgd', label: 'Loại mã hàng không phát sinh GD', container: mainGrp.id,
                type: "checkbox"
            }, false, {
                defaultValue: params.custpage_chk_psgd,
                // breakType: "startcol"
            });

            constForm.addField({
                id: 'custpage_chk_xbnb', label: 'Loại số lượng xuất bán nội bộ', container: mainGrp.id,
                type: "checkbox"
            }, false, {
                defaultValue: params.custpage_chk_xbnb,
            });

            constForm.addField({
                id: 'custpage_label_intransit', label: 'Đơn hàng đi đường', type: "label", container: mainGrp.id
            }, false);

            constForm.addField({
                id: 'custpage_fromdt_intransit', label: 'Từ ngày', type: "date", container: mainGrp.id
            }, true, {
                layoutType: "startrow",
                defaultValue: params.custpage_fromdt_intransit
            });
            
            constForm.addField({
                id: 'custpage_todt_intransit', label: 'Đến ngày', type: "date", container: mainGrp.id
            }, true, {
                layoutType: "endrow",
                defaultValue: params.custpage_todt_intransit
            });

            constForm.addField({
                id: 'custpage_label_nhapkho', label: 'Nhập kho', type: "label", container: mainGrp.id
            }, false);

            constForm.addField({
                id: 'custpage_fromdt_nhapkho', label: 'Từ ngày', type: "date", container: mainGrp.id
            }, true, {
                layoutType: "startrow",
                defaultValue: params.custpage_fromdt_nhapkho
            });
            
            constForm.addField({
                id: 'custpage_todt_nhapkho', label: 'Đến ngày', type: "date", container: mainGrp.id
            }, true, {
                layoutType: "endrow",
                defaultValue: params.custpage_todt_nhapkho
            });

            constForm.addField({
                id: 'custpage_file_exp_temp01', label: 'Temp Export 01', container: mainGrp.id,
                type: "text"
            }, false, {
                defaultValue: getUrlFile('../xls/scv_temp_inventory_analysis.xlsx'),
                displayType: "hidden"
            });

            constForm.addField({
                id: 'custpage_file_exp_temp02', label: 'Temp Export 02', container: mainGrp.id,
                type: "text"
            }, false, {
                defaultValue: getUrlFile('../xls/scv_temp_inventory_history.xlsx'),
                displayType: "hidden"
            });

            constForm.addGridDx({
                id: "custpage_sl_result",
                type: "grid",
                label: 'Result',
                data: [],
                columns: [],
                optionsDx: {
                    export: {enabled: false},
                    // searchPanel: {visible: false},
                    headerFilter: {visible: false},
                    editing: {allowUpdating: true},
                    columnChooser: {enabled: true, mode: "select"},
                }
            });
        }

        const getUrlFile = (_fileId) => {
            return file.load({id: _fileId}).url;
        }

        const getDataSSInvBalanceByStatus = (params) => {
            let myFilters = [];

            if(!!params.custpage_subsidiary) {
                myFilters.push(search.createFilter({
                    name: 'subsidiary', 
                    operator: 'anyof', 
                    values: params.custpage_subsidiary
                }));
            }

            if(!!params.custpage_fromdt) {
                myFilters.push(search.createFilter({
                    name: "trandate",
                    operator: "onorafter",
                    values: params.custpage_fromdt
                }));
            }

            if(!!params.custpage_todt) {
                myFilters.push(search.createFilter({
                    name: "trandate",
                    operator: "onorbefore",
                    values: params.custpage_todt
                }));
            }

            if(params.custpage_location.length > 0) {
                myFilters.push(search.createFilter({
                    name: 'location', 
                    operator: 'anyof', 
                    values: params.custpage_location
                }));
            }

            if(params.custpage_plan_category.length > 0) {
                myFilters.push(search.createFilter({
                    name: 'custitem_scv_planing_category',
                    join: 'item', 
                    operator: 'anyof', 
                    values: params.custpage_plan_category
                }));
            }

            if(params.custpage_group_lv1.length > 0) {
                myFilters.push(search.createFilter({
                    name: 'custitem_scv_group_lv1',
                    join: 'item', 
                    operator: 'anyof', 
                    values: params.custpage_group_lv1
                }));
            }

            if(params.custpage_group_lv2.length > 0) {
                myFilters.push(search.createFilter({
                    name: 'custitem_scv_group_lv2',
                    join: 'item', 
                    operator: 'anyof', 
                    values: params.custpage_group_lv2
                }));
            }

            if(params.custpage_group_lv3.length > 0) {
                myFilters.push(search.createFilter({
                    name: 'custitem_scv_group_lv3',
                    join: 'item', 
                    operator: 'anyof', 
                    values: params.custpage_group_lv3
                }));
            }

            if(params.custpage_group_lv4.length > 0) {
                myFilters.push(search.createFilter({
                    name: 'custitem_scv_group_lv4',
                    join: 'item', 
                    operator: 'anyof', 
                    values: params.custpage_group_lv4
                }));
            }

            if(!!params.custpage_item) {
                myFilters.push(search.createFilter({
                    name: 'formulatext', 
                    formula: '{item.itemid}', 
                    operator: 'contains', 
                    values: params.custpage_item
                }));
            }

            let objSearch = searchInvBalanceStatus.getDataSourceFetchPage(myFilters, params);
            return objSearch;
        }

        const getDataSSInvSalesComSump = (params) => {
            let myFilters = [];

            if(!!params.custpage_subsidiary) {
                myFilters.push(search.createFilter({
                    name: 'subsidiary', 
                    operator: 'anyof', 
                    values: params.custpage_subsidiary
                }));
            }

            if(!!params.custpage_fromdt_lsthxb) {
                myFilters.push(search.createFilter({
                    name: "trandate",
                    operator: "onorafter",
                    values: params.custpage_fromdt_lsthxb
                }));
            }

            if(!!params.custpage_todt_lsthxb) {
                myFilters.push(search.createFilter({
                    name: "trandate",
                    operator: "onorbefore",
                    values: params.custpage_todt_lsthxb
                }));
            }

            if(params.custpage_location.length > 0) {
                myFilters.push(search.createFilter({
                    name: 'location', 
                    operator: 'anyof', 
                    values: params.custpage_location
                }));
            }

            if(params.custpage_plan_category.length > 0) {
                myFilters.push(search.createFilter({
                    name: 'custitem_scv_planing_category',
                    join: 'item', 
                    operator: 'anyof', 
                    values: params.custpage_plan_category
                }));
            }

            if(params.custpage_group_lv1.length > 0) {
                myFilters.push(search.createFilter({
                    name: 'custitem_scv_group_lv1',
                    join: 'item', 
                    operator: 'anyof', 
                    values: params.custpage_group_lv1
                }));
            }

            if(params.custpage_group_lv2.length > 0) {
                myFilters.push(search.createFilter({
                    name: 'custitem_scv_group_lv2',
                    join: 'item', 
                    operator: 'anyof', 
                    values: params.custpage_group_lv2
                }));
            }

            if(params.custpage_group_lv3.length > 0) {
                myFilters.push(search.createFilter({
                    name: 'custitem_scv_group_lv3',
                    join: 'item', 
                    operator: 'anyof', 
                    values: params.custpage_group_lv3
                }));
            }

            if(params.custpage_group_lv4.length > 0) {
                myFilters.push(search.createFilter({
                    name: 'custitem_scv_group_lv4',
                    join: 'item', 
                    operator: 'anyof', 
                    values: params.custpage_group_lv4
                }));
            }

            if(!!params.custpage_item) {
                myFilters.push(search.createFilter({
                    name: 'formulatext', 
                    formula: '{item.itemid}', 
                    operator: 'contains', 
                    values: params.custpage_item
                }));
            }

            if(params.custpage_chk_xbnb === 'T') {
                myFilters.push(search.createFilter({
                    name: 'intercotransaction', 
                    join: 'createdfrom',
                    operator: 'anyof', 
                    values: ["@NONE@"]
                }));
            }

            let objSearch = searchInvSalesComsump.getDataSourceFetchPage(myFilters, params);
            return objSearch;
        }

        const getDataSSInvOrderAndTransit = (params) => {
            let myFilters = [];

            if(!!params.custpage_subsidiary) {
                myFilters.push(search.createFilter({
                    name: 'subsidiary', 
                    operator: 'anyof', 
                    values: params.custpage_subsidiary
                }));
            }

            if(!!params.custpage_fromdt) {
                myFilters.push(search.createFilter({
                    name: "trandate",
                    operator: "onorafter",
                    values: params.custpage_fromdt
                }));
            }

            if(!!params.custpage_todt) {
                myFilters.push(search.createFilter({
                    name: "trandate",
                    operator: "onorbefore",
                    values: params.custpage_todt
                }));
            }

            if(params.custpage_location.length > 0) {
                myFilters.push(search.createFilter({
                    name: 'location', 
                    operator: 'anyof', 
                    values: params.custpage_location
                }));
            }

            if(params.custpage_plan_category.length > 0) {
                myFilters.push(search.createFilter({
                    name: 'custitem_scv_planing_category',
                    join: 'item', 
                    operator: 'anyof', 
                    values: params.custpage_plan_category
                }));
            }

            if(params.custpage_group_lv1.length > 0) {
                myFilters.push(search.createFilter({
                    name: 'custitem_scv_group_lv1',
                    join: 'item', 
                    operator: 'anyof', 
                    values: params.custpage_group_lv1
                }));
            }

            if(params.custpage_group_lv2.length > 0) {
                myFilters.push(search.createFilter({
                    name: 'custitem_scv_group_lv2',
                    join: 'item', 
                    operator: 'anyof', 
                    values: params.custpage_group_lv2
                }));
            }

            if(params.custpage_group_lv3.length > 0) {
                myFilters.push(search.createFilter({
                    name: 'custitem_scv_group_lv3',
                    join: 'item', 
                    operator: 'anyof', 
                    values: params.custpage_group_lv3
                }));
            }

            if(params.custpage_group_lv4.length > 0) {
                myFilters.push(search.createFilter({
                    name: 'custitem_scv_group_lv4',
                    join: 'item', 
                    operator: 'anyof', 
                    values: params.custpage_group_lv4
                }));
            }

            if(!!params.custpage_item) {
                myFilters.push(search.createFilter({
                    name: 'formulatext', 
                    formula: '{item.itemid}', 
                    operator: 'contains', 
                    values: params.custpage_item
                }));
            }

            let objSearch = searchInvOrderAndTransit.getDataSourceFetchPage(myFilters, params);
            return objSearch;
        }

        const getDataSSInvBalanceByItem = (params) => {
            let myFilters = [];

            if(!!params.custpage_subsidiary) {
                myFilters.push(search.createFilter({
                    name: 'subsidiary', 
                    operator: 'anyof', 
                    values: params.custpage_subsidiary
                }));
            }

            if(!!params.custpage_fromdt) {
                myFilters.push(search.createFilter({
                    name: "trandate",
                    operator: "onorafter",
                    values: params.custpage_fromdt
                }));
            }

            if(!!params.custpage_todt) {
                myFilters.push(search.createFilter({
                    name: "trandate",
                    operator: "onorbefore",
                    values: params.custpage_todt
                }));
            }

            if(params.custpage_location.length > 0) {
                myFilters.push(search.createFilter({
                    name: 'location', 
                    operator: 'anyof', 
                    values: params.custpage_location
                }));
            }

            if(params.custpage_plan_category.length > 0) {
                myFilters.push(search.createFilter({
                    name: 'custitem_scv_planing_category',
                    join: 'item', 
                    operator: 'anyof', 
                    values: params.custpage_plan_category
                }));
            }

            if(params.custpage_group_lv1.length > 0) {
                myFilters.push(search.createFilter({
                    name: 'custitem_scv_group_lv1',
                    join: 'item', 
                    operator: 'anyof', 
                    values: params.custpage_group_lv1
                }));
            }

            if(params.custpage_group_lv2.length > 0) {
                myFilters.push(search.createFilter({
                    name: 'custitem_scv_group_lv2',
                    join: 'item', 
                    operator: 'anyof', 
                    values: params.custpage_group_lv2
                }));
            }

            if(params.custpage_group_lv3.length > 0) {
                myFilters.push(search.createFilter({
                    name: 'custitem_scv_group_lv3',
                    join: 'item', 
                    operator: 'anyof', 
                    values: params.custpage_group_lv3
                }));
            }

            if(params.custpage_group_lv4.length > 0) {
                myFilters.push(search.createFilter({
                    name: 'custitem_scv_group_lv4',
                    join: 'item', 
                    operator: 'anyof', 
                    values: params.custpage_group_lv4
                }));
            }

            if(!!params.custpage_item) {
                myFilters.push(search.createFilter({
                    name: 'formulatext', 
                    formula: '{item.itemid}', 
                    operator: 'contains', 
                    values: params.custpage_item
                }));
            }

            let objSearch = searchInvBalanceItem.getDataSourceFetchPage(myFilters, params);
            return objSearch;
        }

        const getDataSSBeginBalanceItem = (params) => {
            let myFilters = [];

            if(!!params.custpage_subsidiary) {
                myFilters.push(search.createFilter({
                    name: 'subsidiary', 
                    operator: 'anyof', 
                    values: params.custpage_subsidiary
                }));
            }

            if(!!params.custpage_fromdt) {
                myFilters.push(search.createFilter({
                    name: "trandate",
                    operator: "before",
                    values: params.custpage_fromdt
                }));
            }

            if(params.custpage_location.length > 0) {
                myFilters.push(search.createFilter({
                    name: 'location', 
                    operator: 'anyof', 
                    values: params.custpage_location
                }));
            }

            if(params.custpage_plan_category.length > 0) {
                myFilters.push(search.createFilter({
                    name: 'custitem_scv_planing_category',
                    join: 'item', 
                    operator: 'anyof', 
                    values: params.custpage_plan_category
                }));
            }

            if(params.custpage_group_lv1.length > 0) {
                myFilters.push(search.createFilter({
                    name: 'custitem_scv_group_lv1',
                    join: 'item', 
                    operator: 'anyof', 
                    values: params.custpage_group_lv1
                }));
            }

            if(params.custpage_group_lv2.length > 0) {
                myFilters.push(search.createFilter({
                    name: 'custitem_scv_group_lv2',
                    join: 'item', 
                    operator: 'anyof', 
                    values: params.custpage_group_lv2
                }));
            }

            if(params.custpage_group_lv3.length > 0) {
                myFilters.push(search.createFilter({
                    name: 'custitem_scv_group_lv3',
                    join: 'item', 
                    operator: 'anyof', 
                    values: params.custpage_group_lv3
                }));
            }

            if(params.custpage_group_lv4.length > 0) {
                myFilters.push(search.createFilter({
                    name: 'custitem_scv_group_lv4',
                    join: 'item', 
                    operator: 'anyof', 
                    values: params.custpage_group_lv4
                }));
            }

            if(!!params.custpage_item) {
                myFilters.push(search.createFilter({
                    name: 'formulatext', 
                    formula: '{item.itemid}', 
                    operator: 'contains', 
                    values: params.custpage_item
                }));
            }

            let objSearch = searchBeginBalanceItem.getDataSourceFetchPage(myFilters, params);
            return objSearch;
        }

        const getDataSSInvQtyOrderByPO = (params) => {
            let myFilters = [];

            if(!!params.custpage_subsidiary) {
                myFilters.push(search.createFilter({
                    name: 'subsidiary', 
                    operator: 'anyof', 
                    values: params.custpage_subsidiary
                }));
            }

            if(!!params.custpage_fromdt_intransit) {
                myFilters.push(search.createFilter({
                    name: "trandate",
                    operator: "onorafter",
                    values: params.custpage_fromdt_intransit
                }));
            }

            if(!!params.custpage_todt_intransit) {
                myFilters.push(search.createFilter({
                    name: "trandate",
                    operator: "onorbefore",
                    values: params.custpage_todt_intransit
                }));
            }

            if(!!params.custpage_item) {
                myFilters.push(search.createFilter({
                    name: 'formulatext', 
                    formula: '{item.itemid}', 
                    operator: 'contains', 
                    values: params.custpage_item
                }));
            }

            if(params.custpage_location.length > 0) {
                myFilters.push(search.createFilter({
                    name: 'location', 
                    operator: 'anyof', 
                    values: params.custpage_location
                }));
            }

            if(params.custpage_plan_category.length > 0) {
                myFilters.push(search.createFilter({
                    name: 'custitem_scv_planing_category',
                    join: 'item', 
                    operator: 'anyof', 
                    values: params.custpage_plan_category
                }));
            }

            if(params.custpage_group_lv1.length > 0) {
                myFilters.push(search.createFilter({
                    name: 'custitem_scv_group_lv1',
                    join: 'item', 
                    operator: 'anyof', 
                    values: params.custpage_group_lv1
                }));
            }

            if(params.custpage_group_lv2.length > 0) {
                myFilters.push(search.createFilter({
                    name: 'custitem_scv_group_lv2',
                    join: 'item', 
                    operator: 'anyof', 
                    values: params.custpage_group_lv2
                }));
            }

            if(params.custpage_group_lv3.length > 0) {
                myFilters.push(search.createFilter({
                    name: 'custitem_scv_group_lv3',
                    join: 'item', 
                    operator: 'anyof', 
                    values: params.custpage_group_lv3
                }));
            }

            if(params.custpage_group_lv4.length > 0) {
                myFilters.push(search.createFilter({
                    name: 'custitem_scv_group_lv4',
                    join: 'item', 
                    operator: 'anyof', 
                    values: params.custpage_group_lv4
                }));
            }

            let objSearch = searchInvQtyOrderByPO.getDataSourceFetchPage(myFilters, params);
            return objSearch;
        }

        const getDataSSInvQtyOrderByITR = (params) => {
            let myFilters = [];

            if(!!params.custpage_subsidiary) {
                myFilters.push(search.createFilter({
                    name: 'subsidiary', 
                    operator: 'anyof', 
                    values: params.custpage_subsidiary
                }));
            }

            if(!!params.custpage_fromdt_nhapkho) {
                myFilters.push(search.createFilter({
                    name: "trandate",
                    operator: "onorafter",
                    values: params.custpage_fromdt_nhapkho
                }));
            }

            if(!!params.custpage_todt_nhapkho) {
                myFilters.push(search.createFilter({
                    name: "trandate",
                    operator: "onorbefore",
                    values: params.custpage_todt_nhapkho
                }));
            }

            if(!!params.custpage_item) {
                myFilters.push(search.createFilter({
                    name: 'formulatext', 
                    formula: '{item.itemid}', 
                    operator: 'contains', 
                    values: params.custpage_item
                }));
            }

            if(params.custpage_location.length > 0) {
                myFilters.push(search.createFilter({
                    name: 'location', 
                    operator: 'anyof', 
                    values: params.custpage_location
                }));
            }

            if(params.custpage_plan_category.length > 0) {
                myFilters.push(search.createFilter({
                    name: 'custitem_scv_planing_category',
                    join: 'item', 
                    operator: 'anyof', 
                    values: params.custpage_plan_category
                }));
            }

            if(params.custpage_group_lv1.length > 0) {
                myFilters.push(search.createFilter({
                    name: 'custitem_scv_group_lv1',
                    join: 'item', 
                    operator: 'anyof', 
                    values: params.custpage_group_lv1
                }));
            }

            if(params.custpage_group_lv2.length > 0) {
                myFilters.push(search.createFilter({
                    name: 'custitem_scv_group_lv2',
                    join: 'item', 
                    operator: 'anyof', 
                    values: params.custpage_group_lv2
                }));
            }

            if(params.custpage_group_lv3.length > 0) {
                myFilters.push(search.createFilter({
                    name: 'custitem_scv_group_lv3',
                    join: 'item', 
                    operator: 'anyof', 
                    values: params.custpage_group_lv3
                }));
            }

            if(params.custpage_group_lv4.length > 0) {
                myFilters.push(search.createFilter({
                    name: 'custitem_scv_group_lv4',
                    join: 'item', 
                    operator: 'anyof', 
                    values: params.custpage_group_lv4
                }));
            }

            let objSearch = searchInvQtyOrderByITR.getDataSourceFetchPage(myFilters, params);
            return objSearch;
        }

        const getDataGroupLevelParent = () => {
            const resultSQL = query.runSuiteQL({
                query: `SELECT id, name, parent
                    FROM customrecord_scv_group_level
                    WHERE parent IS NULL AND isinactive = 'F'
                    ORDER BY name ASC`
            });
            const data = resultSQL.asMappedResults();
            return data;
        }

        const getDataGroupLevelByParent = (arrParent) => {
            const resultSQL = query.runSuiteQL({
                query: `SELECT id, name, parent
                    FROM customrecord_scv_group_level
                    WHERE parent in ('${arrParent.join("', '")}') AND isinactive = 'F'
                    ORDER BY name ASC`
            });
            const data = resultSQL.asMappedResults();
            return data;
        }

        const defaultParams = (params) => {
            let curUser = runtime.getCurrentUser();
            let today = new Date();
            
            if(!('custpage_report_type' in params)) params.custpage_report_type = ReportType.InventoryAnalysis.ID;
            if(!('custpage_subsidiary' in params)) params.custpage_subsidiary = curUser.subsidiary.toString();
            if(!('custpage_chk_psgd' in params)) params.custpage_chk_psgd = 'T';
            if(!('custpage_chk_xbnb' in params)) params.custpage_chk_xbnb = 'T';
            // if(!('custpage_fromdt' in params)) params.custpage_fromdt = new Date(today.getFullYear(), today.getMonth(), 1);
            // if(!('custpage_todt' in params)) params.custpage_todt = today;
            if(!('custpage_fromdt_lsthxb' in params)) params.custpage_fromdt_lsthxb = new Date(today.getFullYear(), today.getMonth(), 1);
            if(!('custpage_todt_lsthxb' in params)) params.custpage_todt_lsthxb = today;

            if(!('custpage_fromdt_intransit' in params)) params.custpage_fromdt_intransit = new Date(today.getFullYear(), today.getMonth(), 1);
            if(!('custpage_todt_intransit' in params)) params.custpage_todt_intransit = new Date(today.getFullYear(), today.getMonth() + 1, 0);

            if(!('custpage_fromdt_nhapkho' in params)) params.custpage_fromdt_nhapkho = new Date(today.getFullYear(), today.getMonth(), 1);
            if(!('custpage_todt_nhapkho' in params)) params.custpage_todt_nhapkho = new Date(today.getFullYear(), today.getMonth() + 1, 0);

            if(('custpage_location' in params)) {
                params.custpage_location = convertValueInputToArray(params.custpage_location);
            } else {
                params.custpage_location = [];
            }

            if(('custpage_plan_category' in params)) {
                params.custpage_plan_category = convertValueInputToArray(params.custpage_plan_category);
            } else {
                params.custpage_plan_category = [];
            }

            if(('custpage_group_lv1' in params)) {
                params.custpage_group_lv1 = convertValueInputToArray(params.custpage_group_lv1);
            } else {
                params.custpage_group_lv1 = [];
            }
            if(('custpage_group_lv2' in params)) {
                params.custpage_group_lv2 = convertValueInputToArray(params.custpage_group_lv2);
            } else {
                params.custpage_group_lv2 = [];
            }
            if(('custpage_group_lv3' in params)) {
                params.custpage_group_lv3 = convertValueInputToArray(params.custpage_group_lv3);
            } else {
                params.custpage_group_lv3 = [];
            }
            if(('custpage_group_lv4' in params)) {
                params.custpage_group_lv4 = convertValueInputToArray(params.custpage_group_lv4);
            } else {
                params.custpage_group_lv4 = [];
            }
        }

        const convertValueInputToArray = (value) => {
            let arr = value.split(",");
            arr = arr.filter(e => !!e);
            return arr;
        }

        const getDataPeriod = (params) => {
            let fromdt = params.custpage_fromdt_lsthxb;
            let todt = params.custpage_todt_lsthxb;

            let data = [];
            if(!!fromdt && !!todt) {
                let startDate = format.parse({ value: fromdt, type: "date" });
                let endDate = format.parse({ value: todt, type: "date" });

                const yearDiff = endDate.getFullYear() - startDate.getFullYear();
                const monthDiff = endDate.getMonth() - startDate.getMonth();

                let monthNum = yearDiff * 12 + monthDiff;

                for(let i = 0; i <= monthNum; i++) {
                    let newDate = new Date(startDate);
                    newDate.setMonth(newDate.getMonth() + i);

                    data.push({
                        id: moment(newDate).format('YYYYMM'),
                        format: moment(newDate).format('YYYY.MM'),
                        name: moment(newDate).format('MM/YYYY'),
                    });
                }
            }
            return data;
        }

        const getDataReportType = () => {
            let arr = [];
            for(let property in ReportType) {
                arr.push({
                    internalid: ReportType[property].ID,
                    name: ReportType[property].NAME
                });
            }
            return arr;
        }

        const getDataLocationBySub = (subsidiary) => {
            if(!subsidiary) return [];

            const resultSQL = query.runSuiteQL({
                query: `SELECT id, name, fullname, subsidiary
                FROM location
                WHERE makeinventoryavailable = 'T'`
            });
            const data = resultSQL.asMappedResults();

            return data.filter(e => e.subsidiary == subsidiary);
        }

        return {onRequest}
    });
