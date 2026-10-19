/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  10 Jul 2025         Huy Pham			    Init, create file, Phát triển báo cáo tổng hợp và chi tiết kết quả sản xuất,from mr.Trương Minh Phúc(https://app.clickup.com/t/86czjzct2)
 *  16 Jul 2025         Huy Pham			    Update logic, from mr.TMPhúc(https://app.clickup.com/t/86czjzct2?comment=90160122733369)
 *  06 Aug 2025         Huy Pham			    Điều chỉnh #005->#008, from mr.TMPhúc(https://app.clickup.com/t/86czjzct2?comment=90160125571957)
 *  11 Aug 2025         Huy Pham			    Điều chỉnh & bổ sung type, from mr.TMPhúc(https://app.clickup.com/t/86czjzct2?comment=90160125571957&threadedComment=90160126831766)
 */
/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/search', 'N/runtime', 'N/file',
    '../common/scv_common_rpt_mfg_result.js',
    '../cons/scv_cons_form.js',
    '../cons/scv_cons_format.js',

    '../cons/scv_cons_subsidiary.js',
    '../cons/scv_cons_entitygroup.js',
    '../cons/scv_cons_grouplevel.js',

    '../cons/scv_cons_search_rpt_mfg_result_ss01.js',
    '../cons/scv_cons_search_rpt_mfg_result_ss02.js',
    '../cons/scv_cons_search_rpt_mfg_result_ss03.js',
    '../cons/scv_cons_search_rpt_mfg_result_ss04.js',
    '../cons/scv_cons_search_rpt_mfg_result_ss05.js',
    '../cons/scv_cons_search_rpt_mfg_result_ss06.js',
    '../cons/scv_cons_search_rpt_mfg_result_ss07.js',
    '../cons/scv_cons_search_rpt_mfg_result_ss08.js',
    '../cons/scv_cons_search_rpt_mfg_result_ss09.js',
    '../cons/scv_cons_search_rpt_mfg_result_ss10.js',
    '../cons/scv_cons_search_rpt_mfg_result_ss11.js',
    '../cons/scv_cons_search_rpt_mfg_result_ss12.js',
],
    
    (search, runtime, file,
        commonRptMfgResult,
        constForm,
        constFormat,

        constSubsidiary,
        constEntityGroup,
        constGroupLevel,

        constSearchMfgResultSS01,
        constSearchMfgResultSS02,
        constSearchMfgResultSS03,
        constSearchMfgResultSS04,
        constSearchMfgResultSS05,
        constSearchMfgResultSS06,
        constSearchMfgResultSS07,
        constSearchMfgResultSS08,
        constSearchMfgResultSS09,
        constSearchMfgResultSS10,
        constSearchMfgResultSS11,
        constSearchMfgResultSS12,
    ) => {
        const CurrentScript = {
            ID: "customscript_scv_sl_rpt_mfg_result",
            DEPLOYID_UI: "customdeploy_scv_sl_rpt_mfg_result",
            DEPLOYID_DATA: "customdeploy_scv_sl_rpt_mfg_result_svc"
        }
        const onRequest = (scriptContext) => {
            constForm.setContext(scriptContext);
            constForm.setServiceScript(CurrentScript.ID, CurrentScript.DEPLOYID_DATA);

            let request = scriptContext.request;
            let params = request.parameters;
    
            let curScript = runtime.getCurrentScript();
            if(curScript.deploymentId == CurrentScript.DEPLOYID_DATA){
                let objResponse = {data: []};
                
				switch(params.action){
                    case "getDataWorkCenter":
						objResponse.data = getDataWorkCenter(params);
						break;
                    case "getDataGroupLevel02":
						objResponse.data = getDataGroupLevel02(params);
						break;
                    case "getDataMfgProdResultACPSummarySS01":
						objResponse.data = getDataMfgProdResultACPSummarySS01(params);
						break;
                    case "getDataMfgPhePhuPhamtACPSummarySS02":
						objResponse.data = getDataMfgPhePhuPhamtACPSummarySS02(params);
						break;
                    case "getDataMfgInspectionResultACPSummarySS03":
						objResponse.data = getDataMfgInspectionResultACPSummarySS03(params);
						break;
                    case "getDataMfgProdResultACSummarySS04":
						objResponse.data = getDataMfgProdResultACSummarySS04(params);
						break;
                    case "getDataMfgPhePhuPhamACSummarySS05":
						objResponse.data = getDataMfgPhePhuPhamACSummarySS05(params);
						break;
                    case "getDataMfgProdResultDetailSS06":
						objResponse.data = getDataMfgProdResultDetailSS06(params);
						break;
                    case "getDataMfgPhePhuPhamDetailSS07":
						objResponse.data = getDataMfgPhePhuPhamDetailSS07(params);
						break;
                    case "getDataMfgInspectionResultDetailSS08":
						objResponse.data = getDataMfgInspectionResultDetailSS08(params);
						break;
                    case "getDataMfgInventoryReceivingSS09":
						objResponse.data = getDataMfgInventoryReceivingSS09(params);
						break;
                    case "getDataMfgTotalByTransDetailSS10":
						objResponse.data = getDataMfgTotalByTransDetailSS10(params);
						break;
                    case "getDataMfgNhanCongtACPSummarySS011":
						objResponse.data = getDataMfgNhanCongtACPSummarySS011(params);
						break;
                    case "getDataMfgInspectionResultACSummarySS12":
						objResponse.data = getDataMfgInspectionResultACSummarySS12(params);
						break;
                    case "getTemplateExcel":
                        objResponse.data = getTemplateExcel(params);
                        break;
				}

				constForm.write(objResponse);
            }else{
                onCreateFormUI(params);
    
                constForm.writePage();
            }
        }

        const onCreateFormUI = (_params) =>{
            constForm.createForm("Báo cáo kết quả sản xuất", '../cssl/scv_cs_sl_rpt_mfg_result.js');

            constForm.addPageLink([
                constSearchMfgResultSS01.ID, constSearchMfgResultSS02.ID, constSearchMfgResultSS03.ID,
                constSearchMfgResultSS04.ID, constSearchMfgResultSS05.ID, constSearchMfgResultSS06.ID,
                constSearchMfgResultSS07.ID, constSearchMfgResultSS08.ID, constSearchMfgResultSS09.ID,
                constSearchMfgResultSS10.ID, constSearchMfgResultSS11.ID, constSearchMfgResultSS12.ID
            ], true);

            constForm.addButton({id: "custpage_btn_search", label: "Search", functionName: "onSearchResult('F')"},{
                styleSubmit: true
            });
            constForm.addButton({id: "custpage_btn_export", label: "Export", functionName: "onSearchResult('T')"});

            let objMainGroup = constForm.addFieldGroup({id: "fieldgrp_main", label: "Filter"});

            let curUser = runtime.getCurrentUser();
            let today = constFormat.getDateTimeWithCurrentGMT(new Date());


            if(!_params.custpage_rpttype){
                _params.custpage_rpttype = commonRptMfgResult.ReportType._01SummaryACP.ID + "";
            }
            if(!_params.custpage_subsidiary){
                _params.custpage_subsidiary = curUser.subsidiary + "";
            }
            if(!_params.custpage_fromdt){
                _params.custpage_fromdt = constFormat.formatDate(constFormat.getBeginOfMonth(today));
            }
            if(!_params.custpage_todt){
                _params.custpage_todt = constFormat.formatDate(constFormat.getEndOfMonth(today));
            }
            if(!_params.custpage_periodtype){
                _params.custpage_periodtype = commonRptMfgResult.PeriodType._01Day.ID + "";
            }

            constForm.addField({
                id: "custpage_rpttype", label: "Loại báo cáo", container: objMainGroup.id,
                type: "select",
            }, true, {
                lookup: {
                    data: commonRptMfgResult.getDataReportType(),
                    valueExpr: "value", displayExpr: "text",
                },
                defaultValue: _params.custpage_rpttype
            });

            constForm.addField({
                id: "custpage_subsidiary", label: "Công ty/Chi nhánh", container: objMainGroup.id,
                type: "select", 
            }, true, {
                lookup: {
                    data: constSubsidiary.getDataSubsidiaryByUserRole(),
                    displayExpr: "name", valueExpr: "id"
                },
                defaultValue: _params.custpage_subsidiary
            });

            constForm.addField({
                id: "custpage_fromdt", label: "Sản xuất từ ngày", container: objMainGroup.id,
                type: "date"
            }, true, {
                layoutType: "startrow",
                defaultValue: _params.custpage_fromdt
            });

            constForm.addField({
                id: "custpage_todt", label: "Đến ngày", container: objMainGroup.id,
                type: "date"
            }, true, {
                layoutType: "endrow",
                defaultValue: _params.custpage_todt
            });

            constForm.addField({
                id: "custpage_shift", label: "Ca", container: objMainGroup.id,
                type: "multiselect", source: "customrecord_mfgmob_shift",
            }, false, {
                defaultValue: !!_params.custpage_shift ? _params.custpage_shift.split(",") : []
            });

            constForm.addField({
                id: "custpage_workcenter", label: "Máy", container: objMainGroup.id,
                type: "multiselect",
            }, false, {
                lookup: {
                    data: getDataWorkCenter(_params),
                    displayExpr: "groupname", valueExpr: "internalid"
                },
                defaultValue: !!_params.custpage_workcenter ? _params.custpage_workcenter.split(",") : []
            });

            constForm.addField({
                id: "custpage_item", label: "Mã/Tên hàng hóa", container: objMainGroup.id,
                type: "text", 
            }, false, {
                defaultValue: _params.custpage_item
            });

            constForm.addField({
                id: "custpage_plancategory", label: "Nhóm kế hoạch", container: objMainGroup.id,
                type: "multiselect", source: "customrecord_scv_planning_category",
            }, false, {
                defaultValue: !!_params.custpage_plancategory ? _params.custpage_plancategory.split(",") : []
            });

            constForm.addField({
                id: "custpage_grplvl_1", label: "Nhóm cấp 1", container: objMainGroup.id,
                type: "multiselect", 
            }, false, {
                lookup: {
                    data: getDataGroupLevel01(),
                    displayExpr: "name", valueExpr: "internalid"
                },
                defaultValue: !!_params.custpage_grplvl_1 ? _params.custpage_grplvl_1.split(",") : []
            });

            constForm.addField({
                id: "custpage_grplvl_2", label: "Nhóm cấp 2", container: objMainGroup.id,
                type: "multiselect", 
            }, false, {
                lookup: {
                    data: getDataGroupLevel02(_params),
                    displayExpr: "name", valueExpr: "internalid"
                },
                defaultValue: !!_params.custpage_grplvl_2 ? _params.custpage_grplvl_2.split(",") : []
            });

            constForm.addField({
                id: "custpage_brand", label: "Thương hiệu", container: objMainGroup.id,
                type: "multiselect", source: "customlist_scv_thuong_hieu",
            }, false, {
                defaultValue: !!_params.custpage_brand ? _params.custpage_brand.split(",") : []
            });

            constForm.addField({
                id: "custpage_dodaynhom", label: "Độ dày nhôm", container: objMainGroup.id,
                type: "multiselect", source: "customlist_scv_ddn_list",
            }, false, {
                defaultValue: !!_params.custpage_dodaynhom ? _params.custpage_dodaynhom.split(",") : []
            });

            constForm.addField({
                id: "custpage_periodtype", label: "Kỳ báo cáo", container: objMainGroup.id,
                type: "select",
            }, true, {
                lookup: {
                    data: commonRptMfgResult.getDataPeriodType(),
                    valueExpr: "value", displayExpr: "text",
                },
                defaultValue: _params.custpage_periodtype
            });

            constForm.addGridDx({
                id: "custpage_grid_result",
                type: "treegrid",
                label: "Result",
                columns: commonRptMfgResult.getColumns(_params.custpage_rpttype),
            });
        }

        const getTemplateExcel = (_params) =>{
            let objRes = {
                name: "Báo cáo kết quả sản xuất",
                url: file.load({id: '../xls/scv_rpt_mfg_result.xlsx'}).url,
                subsidiary: constSubsidiary.getInfoSubsidiaryById(_params.custpage_subsidiary),
            };

            return objRes;
        }
        
        const getDataMfgProdResultACPSummarySS01 = (_params) => {
            let filters = [];

            if(!!_params.custpage_subsidiary){
                filters.push(search.createFilter({
                    name: 'subsidiary',
                    operator: "anyof",
                    values: _params.custpage_subsidiary
                }))
            }

            if(!!_params.custpage_fromdt){
                filters.push(search.createFilter({
                    name: 'custbody_scv_mfg_date',
                    operator: "onorafter",
                    values: _params.custpage_fromdt
                }));
            }

            if(!!_params.custpage_todt){
                filters.push(search.createFilter({
                    name: 'custbody_scv_mfg_date',
                    operator: "onorbefore",
                    values: _params.custpage_todt
                }));
            }

            if(!!_params.custpage_shift){
                filters.push(search.createFilter({
                    name: 'custbody_scv_shift',
                    operator: "anyof",
                    values: _params.custpage_shift.split(",")
                }))
            }

            if(!!_params.custpage_workcenter){
                filters.push(search.createFilter({
                    name: 'custbody_scv_wo_center',
                    operator: "anyof",
                    values: _params.custpage_workcenter.split(",")
                }))
            }

            if(!!_params.custpage_plancategory){
                filters.push(search.createFilter({
                    name: 'custitem_scv_planing_category',
                    join: "item",
                    operator: "anyof",
                    values: _params.custpage_plancategory.split(",")
                }))
            }

            if(!!_params.custpage_grplvl_1){
                filters.push(search.createFilter({
                    name: 'custitem_scv_group_lv1',
                    join: "item",
                    operator: "anyof",
                    values: _params.custpage_grplvl_1.split(",")
                }))
            }

            if(!!_params.custpage_grplvl_2){
                filters.push(search.createFilter({
                    name: 'custitem_scv_group_lv2',
                    join: "item",
                    operator: "anyof",
                    values: _params.custpage_grplvl_2.split(",")
                }))
            }

            if(!!_params.custpage_brand){
                filters.push(search.createFilter({
                    name: 'custitem_scv_trademark',
                    join: "item",
                    operator: "anyof",
                    values: _params.custpage_brand.split(",")
                }))
            }

            if(!!_params.custpage_dodaynhom){
                filters.push(search.createFilter({
                    name: 'custitem_scv_ddn',
                    join: "item",
                    operator: "anyof",
                    values: _params.custpage_dodaynhom.split(",")
                }))
            }

            return constSearchMfgResultSS01.getDataSourceFetchPage(filters, _params);
        }

        const getDataMfgPhePhuPhamtACPSummarySS02 = (_params) => {
            let filters = [];

            if(!!_params.custpage_subsidiary){
                filters.push(search.createFilter({
                    name: 'custrecord_scv_by_product_sub',
                    operator: "anyof",
                    values: _params.custpage_subsidiary
                }))
            }

            if(!!_params.custpage_fromdt){
                filters.push(search.createFilter({
                    name: 'custrecord_scv_by_product_date',
                    operator: "onorafter",
                    values: _params.custpage_fromdt
                }));
            }

            if(!!_params.custpage_todt){
                filters.push(search.createFilter({
                    name: 'custrecord_scv_by_product_date',
                    operator: "onorbefore",
                    values: _params.custpage_todt
                }));
            }

            if(!!_params.custpage_shift){
                filters.push(search.createFilter({
                    name: 'custrecord_scv_by_product_shift',
                    operator: "anyof",
                    values: _params.custpage_shift.split(",")
                }))
            }

            if(!!_params.custpage_workcenter){
                filters.push(search.createFilter({
                    name: 'custrecord_scv_by_product_work_center',
                    operator: "anyof",
                    values: _params.custpage_workcenter.split(",")
                }))
            }

            if(!!_params.custpage_plancategory){
                filters.push(search.createFilter({
                    name: 'custitem_scv_planing_category',
                    join: "custrecord_scv_by_product_assembly_item",
                    operator: "anyof",
                    values: _params.custpage_plancategory.split(",")
                }))
            }

            if(!!_params.custpage_grplvl_1){
                filters.push(search.createFilter({
                    name: 'custitem_scv_group_lv1',
                    join: "custrecord_scv_by_product_assembly_item",
                    operator: "anyof",
                    values: _params.custpage_grplvl_1.split(",")
                }))
            }

            if(!!_params.custpage_grplvl_2){
                filters.push(search.createFilter({
                    name: 'custitem_scv_group_lv2',
                    join: "custrecord_scv_by_product_assembly_item",
                    operator: "anyof",
                    values: _params.custpage_grplvl_2.split(",")
                }))
            }

            if(!!_params.custpage_brand){
                filters.push(search.createFilter({
                    name: 'custitem_scv_trademark',
                    join: "custrecord_scv_by_product_assembly_item",
                    operator: "anyof",
                    values: _params.custpage_brand.split(",")
                }))
            }

            if(!!_params.custpage_dodaynhom){
                filters.push(search.createFilter({
                    name: 'custitem_scv_ddn',
                    join: "custrecord_scv_by_product_assembly_item",
                    operator: "anyof",
                    values: _params.custpage_dodaynhom.split(",")
                }))
            }

            return constSearchMfgResultSS02.getDataSourceFetchPage(filters, _params);
        }

        const getDataMfgInspectionResultACPSummarySS03 = (_params) => {
            let filters = [];

            if(!!_params.custpage_subsidiary){
                filters.push(search.createFilter({
                    name: 'subsidiary',
                    operator: "anyof",
                    values: _params.custpage_subsidiary
                }))
            }

            if(!!_params.custpage_fromdt){
                filters.push(search.createFilter({
                    name: 'custbody_scv_mfg_date',
                    join: 'custbody_scv_created_transaction',
                    operator: "onorafter",
                    values: _params.custpage_fromdt
                }));
            }

            if(!!_params.custpage_todt){
                filters.push(search.createFilter({
                    name: 'custbody_scv_mfg_date',
                    join: 'custbody_scv_created_transaction',
                    operator: "onorbefore",
                    values: _params.custpage_todt
                }));
            }

            if(!!_params.custpage_shift){
                filters.push(search.createFilter({
                    name: 'custbody_scv_shift',
                    join: "custbody_scv_created_transaction",
                    operator: "anyof",
                    values: _params.custpage_shift.split(",")
                }))
            }

            if(!!_params.custpage_workcenter){
                filters.push(search.createFilter({
                    name: 'custbody_scv_wo_center',
                    join: "custbody_scv_created_transaction",
                    operator: "anyof",
                    values: _params.custpage_workcenter.split(",")
                }))
            }

            if(!!_params.custpage_plancategory){
                filters.push(search.createFilter({
                    name: 'custitem_scv_planing_category',
                    join: "item",
                    operator: "anyof",
                    values: _params.custpage_plancategory.split(",")
                }))
            }

            if(!!_params.custpage_grplvl_1){
                filters.push(search.createFilter({
                    name: 'custitem_scv_group_lv1',
                    join: "item",
                    operator: "anyof",
                    values: _params.custpage_grplvl_1.split(",")
                }))
            }

            if(!!_params.custpage_grplvl_2){
                filters.push(search.createFilter({
                    name: 'custitem_scv_group_lv2',
                    join: "item",
                    operator: "anyof",
                    values: _params.custpage_grplvl_2.split(",")
                }))
            }

            if(!!_params.custpage_brand){
                filters.push(search.createFilter({
                    name: 'custitem_scv_trademark',
                    join: "item",
                    operator: "anyof",
                    values: _params.custpage_brand.split(",")
                }))
            }

            if(!!_params.custpage_dodaynhom){
                filters.push(search.createFilter({
                    name: 'custitem_scv_ddn',
                    join: "item",
                    operator: "anyof",
                    values: _params.custpage_dodaynhom.split(",")
                }))
            }

            return constSearchMfgResultSS03.getDataSourceFetchPage(filters, _params);
        }

        const getDataMfgProdResultACSummarySS04 = (_params) => {
            let filters = [];

            if(!!_params.custpage_subsidiary){
                filters.push(search.createFilter({
                    name: 'subsidiary',
                    operator: "anyof",
                    values: _params.custpage_subsidiary
                }))
            }

            if(!!_params.custpage_fromdt){
                filters.push(search.createFilter({
                    name: 'custbody_scv_mfg_date',
                    operator: "onorafter",
                    values: _params.custpage_fromdt
                }));
            }

            if(!!_params.custpage_todt){
                filters.push(search.createFilter({
                    name: 'custbody_scv_mfg_date',
                    operator: "onorbefore",
                    values: _params.custpage_todt
                }));
            }

            if(!!_params.custpage_shift){
                filters.push(search.createFilter({
                    name: 'custbody_scv_shift',
                    operator: "anyof",
                    values: _params.custpage_shift.split(",")
                }))
            }

            if(!!_params.custpage_workcenter){
                filters.push(search.createFilter({
                    name: 'custbody_scv_wo_center',
                    operator: "anyof",
                    values: _params.custpage_workcenter.split(",")
                }))
            }

            if(!!_params.custpage_plancategory){
                filters.push(search.createFilter({
                    name: 'custitem_scv_planing_category',
                    join: "item",
                    operator: "anyof",
                    values: _params.custpage_plancategory.split(",")
                }))
            }

            if(!!_params.custpage_grplvl_1){
                filters.push(search.createFilter({
                    name: 'custitem_scv_group_lv1',
                    join: "item",
                    operator: "anyof",
                    values: _params.custpage_grplvl_1.split(",")
                }))
            }

            if(!!_params.custpage_grplvl_2){
                filters.push(search.createFilter({
                    name: 'custitem_scv_group_lv2',
                    join: "item",
                    operator: "anyof",
                    values: _params.custpage_grplvl_2.split(",")
                }))
            }

            if(!!_params.custpage_brand){
                filters.push(search.createFilter({
                    name: 'custitem_scv_trademark',
                    join: "item",
                    operator: "anyof",
                    values: _params.custpage_brand.split(",")
                }))
            }

            if(!!_params.custpage_dodaynhom){
                filters.push(search.createFilter({
                    name: 'custitem_scv_ddn',
                    join: "item",
                    operator: "anyof",
                    values: _params.custpage_dodaynhom.split(",")
                }))
            }

            return constSearchMfgResultSS04.getDataSourceFetchPage(filters, _params);
        }

        const getDataMfgPhePhuPhamACSummarySS05 = (_params) => {
            let filters = [];

            if(!!_params.custpage_subsidiary){
                filters.push(search.createFilter({
                    name: 'custrecord_scv_by_product_sub',
                    operator: "anyof",
                    values: _params.custpage_subsidiary
                }))
            }

            if(!!_params.custpage_fromdt){
                filters.push(search.createFilter({
                    name: 'custrecord_scv_by_product_date',
                    operator: "onorafter",
                    values: _params.custpage_fromdt
                }));
            }

            if(!!_params.custpage_todt){
                filters.push(search.createFilter({
                    name: 'custrecord_scv_by_product_date',
                    operator: "onorbefore",
                    values: _params.custpage_todt
                }));
            }

            if(!!_params.custpage_shift){
                filters.push(search.createFilter({
                    name: 'custrecord_scv_by_product_shift',
                    operator: "anyof",
                    values: _params.custpage_shift.split(",")
                }))
            }

            if(!!_params.custpage_workcenter){
                filters.push(search.createFilter({
                    name: 'custrecord_scv_by_product_work_center',
                    operator: "anyof",
                    values: _params.custpage_workcenter.split(",")
                }))
            }

            if(!!_params.custpage_plancategory){
                filters.push(search.createFilter({
                    name: 'custitem_scv_planing_category',
                    join: "custrecord_scv_by_product_assembly_item",
                    operator: "anyof",
                    values: _params.custpage_plancategory.split(",")
                }))
            }

            if(!!_params.custpage_grplvl_1){
                filters.push(search.createFilter({
                    name: 'custitem_scv_group_lv1',
                    join: "custrecord_scv_by_product_assembly_item",
                    operator: "anyof",
                    values: _params.custpage_grplvl_1.split(",")
                }))
            }

            if(!!_params.custpage_grplvl_2){
                filters.push(search.createFilter({
                    name: 'custitem_scv_group_lv2',
                    join: "custrecord_scv_by_product_assembly_item",
                    operator: "anyof",
                    values: _params.custpage_grplvl_2.split(",")
                }))
            }

            if(!!_params.custpage_brand){
                filters.push(search.createFilter({
                    name: 'custitem_scv_trademark',
                    join: "custrecord_scv_by_product_assembly_item",
                    operator: "anyof",
                    values: _params.custpage_brand.split(",")
                }))
            }
            
            if(!!_params.custpage_dodaynhom){
                filters.push(search.createFilter({
                    name: 'custitem_scv_ddn',
                    join: "custrecord_scv_by_product_assembly_item",
                    operator: "anyof",
                    values: _params.custpage_dodaynhom.split(",")
                }))
            }

            return constSearchMfgResultSS05.getDataSourceFetchPage(filters, _params);
        }

        const getDataMfgProdResultDetailSS06 = (_params) => {
            let filters = [];

            if(!!_params.custpage_subsidiary){
                filters.push(search.createFilter({
                    name: 'subsidiary',
                    operator: "anyof",
                    values: _params.custpage_subsidiary
                }))
            }

            if(!!_params.custpage_fromdt){
                filters.push(search.createFilter({
                    name: 'custbody_scv_mfg_date',
                    operator: "onorafter",
                    values: _params.custpage_fromdt
                }));
            }

            if(!!_params.custpage_todt){
                filters.push(search.createFilter({
                    name: 'custbody_scv_mfg_date',
                    operator: "onorbefore",
                    values: _params.custpage_todt
                }));
            }

            if(!!_params.custpage_shift){
                filters.push(search.createFilter({
                    name: 'custbody_scv_shift',
                    operator: "anyof",
                    values: _params.custpage_shift.split(",")
                }))
            }

            if(!!_params.custpage_workcenter){
                filters.push(search.createFilter({
                    name: 'custbody_scv_wo_center',
                    operator: "anyof",
                    values: _params.custpage_workcenter.split(",")
                }))
            }

            if(!!_params.custpage_item){
                filters.push(search.createFilter({
                    name: 'formulatext',
                    formula: `{item}`,
                    operator: "contains",
                    values: _params.custpage_item
                }))
            }

            if(!!_params.custpage_plancategory){
                filters.push(search.createFilter({
                    name: 'custitem_scv_planing_category',
                    join: "item",
                    operator: "anyof",
                    values: _params.custpage_plancategory.split(",")
                }))
            }

            if(!!_params.custpage_grplvl_1){
                filters.push(search.createFilter({
                    name: 'custitem_scv_group_lv1',
                    join: "item",
                    operator: "anyof",
                    values: _params.custpage_grplvl_1.split(",")
                }))
            }

            if(!!_params.custpage_grplvl_2){
                filters.push(search.createFilter({
                    name: 'custitem_scv_group_lv2',
                    join: "item",
                    operator: "anyof",
                    values: _params.custpage_grplvl_2.split(",")
                }))
            }

            return constSearchMfgResultSS06.getDataSourceFetchPage(filters, _params);
        }

        const getDataMfgPhePhuPhamDetailSS07 = (_params) => {
            let filters = [];

            if(!!_params.custpage_subsidiary){
                filters.push(search.createFilter({
                    name: 'custrecord_scv_by_product_sub',
                    operator: "anyof",
                    values: _params.custpage_subsidiary
                }))
            }

            if(!!_params.custpage_fromdt){
                filters.push(search.createFilter({
                    name: 'custrecord_scv_by_product_date',
                    operator: "onorafter",
                    values: _params.custpage_fromdt
                }));
            }

            if(!!_params.custpage_todt){
                filters.push(search.createFilter({
                    name: 'custrecord_scv_by_product_date',
                    operator: "onorbefore",
                    values: _params.custpage_todt
                }));
            }

            if(!!_params.custpage_shift){
                filters.push(search.createFilter({
                    name: 'custrecord_scv_by_product_shift',
                    operator: "anyof",
                    values: _params.custpage_shift.split(",")
                }))
            }

            if(!!_params.custpage_workcenter){
                filters.push(search.createFilter({
                    name: 'custrecord_scv_by_product_work_center',
                    operator: "anyof",
                    values: _params.custpage_workcenter.split(",")
                }))
            }

            if(!!_params.custpage_item){
                filters.push(search.createFilter({
                    name: 'formulatext',
                    formula: `{custrecord_scv_by_prod_item}`,
                    operator: "contains",
                    values: _params.custpage_item
                }))
            }

            if(!!_params.custpage_plancategory){
                filters.push(search.createFilter({
                    name: 'custitem_scv_planing_category',
                    join: "custrecord_scv_by_product_assembly_item",
                    operator: "anyof",
                    values: _params.custpage_plancategory.split(",")
                }))
            }

            if(!!_params.custpage_grplvl_1){
                filters.push(search.createFilter({
                    name: 'custitem_scv_group_lv1',
                    join: "custrecord_scv_by_product_assembly_item",
                    operator: "anyof",
                    values: _params.custpage_grplvl_1.split(",")
                }))
            }

            if(!!_params.custpage_grplvl_2){
                filters.push(search.createFilter({
                    name: 'custitem_scv_group_lv2',
                    join: "custrecord_scv_by_product_assembly_item",
                    operator: "anyof",
                    values: _params.custpage_grplvl_2.split(",")
                }))
            }

            return constSearchMfgResultSS07.getDataSourceFetchPage(filters, _params);
        }

        const getDataMfgInspectionResultDetailSS08 = (_params) => {
            let filters = [];

            if(!!_params.custpage_subsidiary){
                filters.push(search.createFilter({
                    name: 'custrecord_scv_inspl_sub',
                    operator: "anyof",
                    values: _params.custpage_subsidiary
                }))
            }

            if(!!_params.custpage_fromdt){
                filters.push(search.createFilter({
                    name: 'custrecord_scv_inspl_manu_date',
                    operator: "onorafter",
                    values: _params.custpage_fromdt
                }));
            }

            if(!!_params.custpage_todt){
                filters.push(search.createFilter({
                    name: 'custrecord_scv_inspl_manu_date',
                    operator: "onorbefore",
                    values: _params.custpage_todt
                }));
            }

            if(!!_params.custpage_shift){
                filters.push(search.createFilter({
                    name: 'custrecord_scv_inspl_shift',
                    operator: "anyof",
                    values: _params.custpage_shift.split(",")
                }))
            }

            if(!!_params.custpage_workcenter){
                filters.push(search.createFilter({
                    name: 'custrecord_scv_inspl_may',
                    operator: "anyof",
                    values: _params.custpage_workcenter.split(",")
                }))
            }

            if(!!_params.custpage_item){
                filters.push(search.createFilter({
                    name: 'formulatext',
                    formula: `{custrecord_scv_inspl_item}`,
                    operator: "contains",
                    values: _params.custpage_item
                }))
            }

            if(!!_params.custpage_plancategory){
                filters.push(search.createFilter({
                    name: 'custitem_scv_planing_category',
                    join: "custrecord_scv_inspl_item",
                    operator: "anyof",
                    values: _params.custpage_plancategory.split(",")
                }))
            }

            if(!!_params.custpage_grplvl_1){
                filters.push(search.createFilter({
                    name: 'custitem_scv_group_lv1',
                    join: "custrecord_scv_inspl_item",
                    operator: "anyof",
                    values: _params.custpage_grplvl_1.split(",")
                }))
            }

            if(!!_params.custpage_grplvl_2){
                filters.push(search.createFilter({
                    name: 'custitem_scv_group_lv2',
                    join: "custrecord_scv_inspl_item",
                    operator: "anyof",
                    values: _params.custpage_grplvl_2.split(",")
                }))
            }

            return constSearchMfgResultSS08.getDataSourceFetchPage(filters, _params);
        }

        const getDataMfgInventoryReceivingSS09 = (_params) => {
            let filters = [];

            if(!!_params.custpage_subsidiary){
                filters.push(search.createFilter({
                    name: 'subsidiary',
                    operator: "anyof",
                    values: _params.custpage_subsidiary
                }))
            }

            if(!!_params.custpage_fromdt){
                filters.push(search.createFilter({
                    name: 'formuladate',
                    formula: `nvl({custbody_scv_related_transaction.custbody_scv_mfg_date}, {custcol_scv_created_from.custbody_scv_mfg_date})`,
                    operator: "onorafter",
                    values: _params.custpage_fromdt
                }));
            }

            if(!!_params.custpage_todt){
                filters.push(search.createFilter({
                    name: 'formuladate',
                    formula: `nvl({custbody_scv_related_transaction.custbody_scv_mfg_date}, {custcol_scv_created_from.custbody_scv_mfg_date})`,
                    operator: "onorbefore",
                    values: _params.custpage_todt
                }));
            }

            if(!!_params.custpage_shift){
                filters.push(search.createFilter({
                    name: 'formulatext',
                    formula: `CASE WHEN NVL({custbody_scv_related_transaction.custbody_scv_shift.id}, {custcol_scv_created_from.custbody_scv_shift.id}) IN (${_params.custpage_shift.toString()}) THEN 'T' ELSE 'F' END`,
                    operator: "is",
                    values: "T"
                }))
            }

            if(!!_params.custpage_workcenter){
                filters.push(search.createFilter({
                    name: 'formulatext',
                    formula: `CASE WHEN NVL({custbody_scv_related_transaction.custbody_scv_wo_center.id}, {custcol_scv_created_from.custbody_scv_wo_center.id}) IN (${_params.custpage_workcenter.toString()}) THEN 'T' ELSE 'F' END`,
                    operator: "is",
                    values: "T"
                }))
            }

            if(!!_params.custpage_item){
                filters.push(search.createFilter({
                    name: 'formulatext',
                    formula: `{item}`,
                    operator: "contains",
                    values: _params.custpage_item
                }))
            }

            if(!!_params.custpage_plancategory){
                filters.push(search.createFilter({
                    name: 'custitem_scv_planing_category',
                    join: "item",
                    operator: "anyof",
                    values: _params.custpage_plancategory.split(",")
                }))
            }

            if(!!_params.custpage_grplvl_1){
                filters.push(search.createFilter({
                    name: 'custitem_scv_group_lv1',
                    join: "item",
                    operator: "anyof",
                    values: _params.custpage_grplvl_1.split(",")
                }))
            }

            if(!!_params.custpage_grplvl_2){
                filters.push(search.createFilter({
                    name: 'custitem_scv_group_lv2',
                    join: "item",
                    operator: "anyof",
                    values: _params.custpage_grplvl_2.split(",")
                }))
            }

            return constSearchMfgResultSS09.getDataSourceFetchPage(filters, _params);
        }

        const getDataMfgTotalByTransDetailSS10 = (_params) => {
            let filters = [];

            if(!!_params.custpage_subsidiary){
                filters.push(search.createFilter({
                    name: 'subsidiary',
                    operator: "anyof",
                    values: _params.custpage_subsidiary
                }))
            }

            if(!!_params.custpage_item){
                filters.push(search.createFilter({
                    name: 'formulatext',
                    formula: `decode({recordtype}, 'workorder', {custrecord_scv_by_product_wo.custrecord_scv_by_prod_item}, 'assemblybuild', {custrecord_scv_by_product_wo_completion.custrecord_scv_by_prod_item}, {item})`,
                    operator: "contains",
                    values: _params.custpage_item
                }))
            }

            return constSearchMfgResultSS10.getDataSourceFetchPage(filters, _params);
        }

        const getDataMfgNhanCongtACPSummarySS011 = (_params) => {
            let filters = [];

            if(!!_params.custpage_subsidiary){
                filters.push(search.createFilter({
                    name: 'custrecord_scv_prd_labor_sub',
                    operator: "anyof",
                    values: _params.custpage_subsidiary
                }))
            }

            if(!!_params.custpage_fromdt){
                filters.push(search.createFilter({
                    name: 'custrecord_scv_prd_labor_date',
                    operator: "onorafter",
                    values: _params.custpage_fromdt
                }));
            }

            if(!!_params.custpage_todt){
                filters.push(search.createFilter({
                    name: 'custrecord_scv_prd_labor_date',
                    operator: "onorbefore",
                    values: _params.custpage_todt
                }));
            }

            if(!!_params.custpage_shift){
                filters.push(search.createFilter({
                    name: 'custrecord_scv_prd_labor_shift',
                    operator: "anyof",
                    values: _params.custpage_shift.split(",")
                }))
            }

            if(!!_params.custpage_workcenter){
                filters.push(search.createFilter({
                    name: 'custrecord_scv_prd_labor_wo_center',
                    operator: "anyof",
                    values: _params.custpage_workcenter.split(",")
                }))
            }

            return constSearchMfgResultSS11.getDataSourceFetchPage(filters, _params);
        }

        const getDataMfgInspectionResultACSummarySS12 = (_params) => {
            let filters = [];

            if(!!_params.custpage_subsidiary){
                filters.push(search.createFilter({
                    name: 'subsidiary',
                    operator: "anyof",
                    values: _params.custpage_subsidiary
                }))
            }

            if(!!_params.custpage_fromdt){
                filters.push(search.createFilter({
                    name: 'custbody_scv_mfg_date',
                    join: 'custbody_scv_created_transaction',
                    operator: "onorafter",
                    values: _params.custpage_fromdt
                }));
            }

            if(!!_params.custpage_todt){
                filters.push(search.createFilter({
                    name: 'custbody_scv_mfg_date',
                    join: 'custbody_scv_created_transaction',
                    operator: "onorbefore",
                    values: _params.custpage_todt
                }));
            }

            if(!!_params.custpage_shift){
                filters.push(search.createFilter({
                    name: 'custbody_scv_shift',
                    join: 'custbody_scv_created_transaction',
                    operator: "anyof",
                    values: _params.custpage_shift.split(",")
                }))
            }

            if(!!_params.custpage_workcenter){
                filters.push(search.createFilter({
                    name: 'custbody_scv_wo_center',
                    join: 'custbody_scv_created_transaction',
                    operator: "anyof",
                    values: _params.custpage_workcenter.split(",")
                }))
            }

            if(!!_params.custpage_plancategory){
                filters.push(search.createFilter({
                    name: 'custitem_scv_planing_category',
                    join: "item",
                    operator: "anyof",
                    values: _params.custpage_plancategory.split(",")
                }))
            }

            if(!!_params.custpage_grplvl_1){
                filters.push(search.createFilter({
                    name: 'custitem_scv_group_lv1',
                    join: "item",
                    operator: "anyof",
                    values: _params.custpage_grplvl_1.split(",")
                }))
            }

            if(!!_params.custpage_grplvl_2){
                filters.push(search.createFilter({
                    name: 'custitem_scv_group_lv2',
                    join: "item",
                    operator: "anyof",
                    values: _params.custpage_grplvl_2.split(",")
                }))
            }

            if(!!_params.custpage_brand){
                filters.push(search.createFilter({
                    name: 'custitem_scv_trademark',
                    join: "item",
                    operator: "anyof",
                    values: _params.custpage_brand.split(",")
                }))
            }

            if(!!_params.custpage_dodaynhom){
                filters.push(search.createFilter({
                    name: 'custitem_scv_ddn',
                    join: "item",
                    operator: "anyof",
                    values: _params.custpage_dodaynhom.split(",")
                }))
            }

            return constSearchMfgResultSS12.getDataSourceFetchPage(filters, _params);
        }

        const getDataWorkCenter = (_params) => {
            if(!_params.custpage_subsidiary) return [];

            return constEntityGroup.getDataSource(
                search.createFilter({
                    name: 'custentity_scv_sub',
                    operator: "anyof",
                    values: _params.custpage_subsidiary
                })
            );
        }

        const getDataGroupLevel01 = () =>{
            let filters = [
                search.createFilter({
                    name: 'parent',
                    operator: "anyof",
                    values: "@NONE@"
                })
            ];

            return constGroupLevel.getDataSource(filters);
        }

        const getDataGroupLevel02 = (_params) =>{
            let filters = [];

            if(!!_params.custpage_grplvl_1){
                filters.push(search.createFilter({
                    name: 'parent',
                    operator: "anyof",
                    values: _params.custpage_grplvl_1.split(",")
                }));
            }
            else{
                return [];
            }

            return constGroupLevel.getDataSource(filters);
        }

        return {onRequest}

    });
