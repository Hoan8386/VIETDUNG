/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  25 Aug 2025         Khanh Tran			    Init, create file. Báo cáo tiêu hao sản xuất, form ms.Kỳ(https://app.clickup.com/t/86d02hr1u)
 */
/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/runtime', 'N/search', 'N/file',
    
    '../cons/scv_cons_form.js',
    '../cons/scv_cons_subsidiary.js',
    '../cons/scv_cons_grouplevel.js',
    
    '../cons/scv_cons_search_bom_by_wo_cons_rpt.js',
    '../cons/scv_cons_search_cons_ab_cost_rpt.js',
    '../cons/scv_cons_search_cons_ab_sum_rpt.js',
    '../cons/scv_cons_search_cons_ab_nhua_cost_rpt.js',
    '../cons/scv_cons_search_totalscrapbyitem_rpt.js',
    '../cons/scv_cons_search_cons_ab_nhua_sum_rpt.js',
    '../cons/scv_cons_search_cons_ia_cost_rpt.js',
],

    (runtime, search, file,

        constForm,
        constSubsidiary,
        constGroupLevel,

        cSearchBomByWoConsRpt,
        cSearchConsAbCostRpt,
        cSearchConsAbSumRpt,
        cSearchConsAbNhuaCostRpt,
        cSearchTotalScrapByItemRpt,
        cSearchConsAbNhuaSumRpt,
        cSearchConsIaCostRpt
    ) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */

        const serviceScript = {
            ID: 'customscript_scv_sl_rpt_mfg_consump',
            DEPLOYID_UI: 'customdeploy_scv_sl_rpt_mfg_consump',
            DEPLOYID_DATA: 'customdeploy_scv_sl_rpt_mfg_consump_svc'
        }

        const onRequest = (scriptContext) => {
            constForm.setContext(scriptContext);
            constForm.setServiceScript(serviceScript.ID, serviceScript.DEPLOYID_DATA);

            let request = scriptContext.request;
            let params = request.parameters;
            let curScript = runtime.getCurrentScript();

            if(curScript.deploymentId == serviceScript.DEPLOYID_DATA) {
                let objResponse = {data: []};

                switch(params.action){
                    case "getDataGroupLevel02":
						objResponse.data = getDataGroupLevel02(params);
						break;
                    case 'getDataSS01_BomByWoConsRpt':
                        objResponse.data = getDataSS01_BomByWoConsRpt(params);
                        break;
                    case 'getDataSS02_ConsAbCostRpt':
                        objResponse.data = getDataSS02_ConsAbCostRpt(params);
                        break;
                    case 'getDataSS03_ConsAbSumRpt':
                        objResponse.data = getDataSS03_ConsAbSumRpt(params);
                        break;
                    case 'getDataSS04_ConsAbNhuaCostRpt':
                        objResponse.data = getDataSS04_ConsAbNhuaCostRpt(params);
                        break;
                    case 'getDataSS05_TotalScrapByItemRpt':
                        objResponse.data = getDataSS05_TotalScrapByItemRpt(params);
                        break;
                    case 'getDataSS06_ConsAbNhuaSumRpt':
                        objResponse.data = getDataSS06_ConsAbNhuaSumRpt(params);
                        break;
                    case 'getDataSS07_ConsIaCostRpt':
                        objResponse.data = getDataSS07_ConsIaCostRpt(params);
                        break;
                    case "getTemplateExcel":
                        objResponse.data = getTemplateExcel(params);
                        break;
                    case "getTemplateExcelType2":
                        objResponse.data = getTemplateExcelType2(params);
                        break;
				}

                constForm.write(objResponse);
            }
            else{
                if(request.method == 'GET'){
                    onCreateFormUI(params);
                    constForm.writePage();
                }
            }

        }

        const onCreateFormUI = (params) => {
            constForm.createForm('Báo cáo tổng hợp tiêu hao sản xuất', '../cssl/scv_cs_sl_rpt_mfg_consump.js');

            constForm.addPageLink([
                cSearchBomByWoConsRpt.ID,
                cSearchConsAbCostRpt.ID,
                cSearchConsAbSumRpt.ID,
                cSearchConsAbNhuaCostRpt.ID,
                cSearchTotalScrapByItemRpt.ID,
                cSearchConsAbNhuaSumRpt.ID,
                cSearchConsIaCostRpt.ID
            ]);

            constForm.addButton({id: 'custpage_btn_search', label: 'Search', functionName: 'onSearchResult()'});
            constForm.addButton({id: 'custpage_btn_export', label: 'Export', functionName: 'onSearchResult("T")'});

            let mainGrp = constForm.addFieldGroup({id: 'fieldgrp_main', label: 'Thông tin tìm kiếm'});

            let curUser = runtime.getCurrentUser();

            if(!('custpage_subsidiary' in params)){
                params.custpage_subsidiary = curUser.subsidiary
            }

            constForm.addField({
                id: 'custpage_report_type', label: 'Loại báo cáo', container: mainGrp.id,
                type: 'select'
            }, true, {
                lookup: {
                    data: [
                        { name: 'Tiêu hao theo nhôm, keo, phim, tem', id: 'type1' },
                        { name: 'Tiêu hao theo nhựa', id: 'type2' },
                    ],
                    displayExpr: 'name', valueExpr: 'id'
                },
                defaultValue: params.custpage_report_type || 'type1'
            });

            constForm.addField({
                id: 'custpage_subsidiary', label: 'Công ty/Chi nhánh', container: mainGrp.id,
                type: 'select'
            }, true, {
                lookup: {
                    data: constSubsidiary.getDataSubsidiaryByUserRole(),
                    displayExpr: 'name', valueExpr: 'id'
                },
                defaultValue: params.custpage_subsidiary
            });
            
            constForm.addField({
                id: 'custpage_fromdt', label: 'Từ ngày', type: 'date', container: mainGrp.id
            }, true, {
                layoutType: 'startrow',
                defaultValue: params.custpage_fromdt
            });

            constForm.addField({
                id: 'custpage_todt', label: 'Đến ngày', type: 'date', container: mainGrp.id
            }, true, {
                layoutType: 'endrow',
                defaultValue: params.custpage_todt
            });
            
            constForm.addField({
                id: 'custpage_item', label: 'Nguyên vật liệu', container: mainGrp.id,
                type: 'text', 
            }, false, {
                defaultValue: params.custpage_item
            });

            constForm.addField({
                id: 'custpage_location', label: 'Kho', container: mainGrp.id,
                type: 'multiselect'
            }, false, {
                defaultValue: params.custpage_location
            });

            constForm.addField({
                id: 'custpage_grp_lv1', label: 'Nhóm cấp 1', container: mainGrp.id,
                type: 'select'
            }, false, {
                lookup: {
                    data: getDataGroupLevel01(),
                    displayExpr: 'name', valueExpr: 'internalid'
                },
                defaultValue: params.custpage_grp_lv1
            });

            constForm.addField({
                id: 'custpage_work_center', label: 'Máy', container: mainGrp.id,
                type: 'multiselect',
            }, false);

            constForm.addField({
                id: 'custpage_grp_lv2', label: 'Nhóm cấp 2', container: mainGrp.id,
                type: 'select'
            }, false, {
                defaultValue: params.custpage_grp_lv2
            });
            
            constForm.addTab({
                id: 'tab_result',
                label: 'Kết quả'
            })

            constForm.addGridDx({
                id: 'custpage_grid_result',
                type: 'grid',
                tab: 'tab_result',
                label: 'Kết quả',
                columns: []
            });
        }

        const getDataGroupLevel01 = () => {
            let filters = [
                search.createFilter({
                    name: 'parent',
                    operator: 'anyof',
                    values: '@NONE@'
                })
            ];

            return constGroupLevel.getDataSource(filters);
        }

        const getDataGroupLevel02 = (params) => {
            if(!params.custpage_grp_lv1) return [];

            let filters = [
                search.createFilter({
                    name: 'parent',
                    operator: 'anyof',
                    values: params.custpage_grp_lv1
                })
            ];

            return constGroupLevel.getDataSource(filters);
        }

        const getDataSS01_BomByWoConsRpt = (params) => {
            let filters = [];

            if(params.custpage_subsidiary){
                filters.push(search.createFilter({
                    name: 'subsidiary',
                    operator: 'anyof',
                    values: params.custpage_subsidiary.split(',')
                }))
            }

            if(params.custpage_fromdt){
                filters.push(search.createFilter({
                    name: 'trandate',
                    join: 'applyingtransaction',
                    operator: 'onorafter',
                    values: params.custpage_fromdt
                }))
            }

            if(params.custpage_todt){
                filters.push(search.createFilter({
                    name: 'trandate',
                    join: 'applyingtransaction',
                    operator: 'onorbefore',
                    values: params.custpage_todt
                }))
            }

            if(params.custpage_item){
                filters.push(search.createFilter({
                    name: 'formulatext',
                    formula: '{item}',
                    operator: 'contains', 
                    values: params.custpage_item
                }))
            }

            if(params.custpage_location.length){
                filters.push(search.createFilter({
                    name: 'location', 
                    operator: 'anyof', 
                    values: params.custpage_location.split(',')
                }))
            }

            if(params.custpage_grp_lv1){
                filters.push(search.createFilter({
                    name: 'custitem_scv_group_lv1',
                    join: 'item',
                    operator: 'anyof',
                    values: params.custpage_grp_lv1
                }))
            }

            if(params.custpage_grp_lv2){
                filters.push(search.createFilter({
                    name: 'custitem_scv_group_lv2',
                    join: 'item',
                    operator: 'anyof',
                    values: params.custpage_grp_lv2
                }))
            }

            if(params.custpage_work_center){
                filters.push(search.createFilter({
                    name: 'custbody_scv_wo_center',
                    operator: 'anyof',
                    values: params.custpage_work_center.split(',')
                }))
            }

            return cSearchBomByWoConsRpt.getDataSourceFetchPage(filters, params);
        }

        const getDataSS02_ConsAbCostRpt = (params) => {
            let filters = [];

            if(params.custpage_subsidiary){
                filters.push(search.createFilter({
                    name: 'subsidiary',
                    operator: 'anyof',
                    values: params.custpage_subsidiary.split(',')
                }))
            }

            if(params.custpage_fromdt){
                filters.push(search.createFilter({
                    name: 'trandate',
                    operator: 'onorafter',
                    values: params.custpage_fromdt
                }))
            }

            if(params.custpage_todt){
                filters.push(search.createFilter({
                    name: 'trandate',
                    operator: 'onorbefore',
                    values: params.custpage_todt
                }))
            }

            if(params.custpage_item){
                filters.push(search.createFilter({
                    name: 'formulatext',
                    formula: '{item}',
                    operator: 'contains', 
                    values: params.custpage_item
                }))
            }

            if(params.custpage_location.length){
                filters.push(search.createFilter({
                    name: 'location', 
                    operator: 'anyof', 
                    values: params.custpage_location.split(',')
                }))
            }

            if(params.custpage_grp_lv1){
                filters.push(search.createFilter({
                    name: 'custitem_scv_group_lv1',
                    join: 'item',
                    operator: 'anyof',
                    values: params.custpage_grp_lv1
                }))
            }

            if(params.custpage_grp_lv2){
                filters.push(search.createFilter({
                    name: 'custitem_scv_group_lv2',
                    join: 'item',
                    operator: 'anyof',
                    values: params.custpage_grp_lv2
                }))
            }

            if(params.custpage_work_center){
                filters.push(search.createFilter({
                    name: 'custbody_scv_wo_center',
                    operator: 'anyof',
                    values: params.custpage_work_center.split(',')
                }))
            }

            return cSearchConsAbCostRpt.getDataSourceFetchPage(filters, params);
        }

        const getDataSS03_ConsAbSumRpt = (params) => {
            let filters = [];

            if(params.custpage_subsidiary){
                filters.push(search.createFilter({
                    name: 'subsidiary',
                    operator: 'anyof',
                    values: params.custpage_subsidiary.split(',')
                }))
            }

            if(params.custpage_fromdt){
                filters.push(search.createFilter({
                    name: 'trandate',
                    operator: 'onorafter',
                    values: params.custpage_fromdt
                }))
            }

            if(params.custpage_todt){
                filters.push(search.createFilter({
                    name: 'trandate',
                    operator: 'onorbefore',
                    values: params.custpage_todt
                }))
            }

            if(params.custpage_location){
                filters.push(search.createFilter({
                    name: 'location', 
                    operator: 'anyof', 
                    values: params.custpage_location.split(',')
                }))
            }

            if(params.custpage_work_center){
                filters.push(search.createFilter({
                    name: 'custbody_scv_wo_center',
                    operator: 'anyof',
                    values: params.custpage_work_center.split(',')
                }))
            }

            return cSearchConsAbSumRpt.getDataSourceFetchPage(filters, params);
        }

        const getDataSS04_ConsAbNhuaCostRpt = (params) => {
            let filters = [];

            if(params.custpage_subsidiary){
                filters.push(search.createFilter({
                    name: 'subsidiary',
                    operator: 'anyof',
                    values: params.custpage_subsidiary.split(',')
                }))
            }

            if(params.custpage_fromdt){
                filters.push(search.createFilter({
                    name: 'trandate',
                    operator: 'onorafter',
                    values: params.custpage_fromdt
                }))
            }

            if(params.custpage_todt){
                filters.push(search.createFilter({
                    name: 'trandate',
                    operator: 'onorbefore',
                    values: params.custpage_todt
                }))
            }

            if(params.custpage_item){
                filters.push(search.createFilter({
                    name: 'formulatext',
                    formula: '{item}',
                    operator: 'contains', 
                    values: params.custpage_item
                }))
            }

            if(params.custpage_location){
                filters.push(search.createFilter({
                    name: 'location', 
                    operator: 'anyof', 
                    values: params.custpage_location.split(',')
                }))
            }

            if(params.custpage_work_center){
                filters.push(search.createFilter({
                    name: 'custbody_scv_wo_center',
                    operator: 'anyof',
                    values: params.custpage_work_center.split(',')
                }))
            }

            return cSearchConsAbNhuaCostRpt.getDataSourceFetchPage(filters, params);
        }

        const getDataSS05_TotalScrapByItemRpt = (params) => {
            let filters = [];

            if(params.custpage_subsidiary){
                filters.push(search.createFilter({
                    name: 'subsidiary',
                    operator: 'anyof',
                    values: params.custpage_subsidiary.split(',')
                }))
            }

            if(params.custpage_fromdt){
                filters.push(search.createFilter({
                    name: 'formuladate',
                    formula: "decode({recordtype}, 'assemblybuild', {trandate}, 'workorder', {custrecord_scv_by_product_wo.custrecord_scv_by_product_date})",
                    operator: 'onorafter',
                    values: params.custpage_fromdt
                }))
            }

            if(params.custpage_todt){
                filters.push(search.createFilter({
                    name: 'formuladate',
                    formula: "decode({recordtype}, 'assemblybuild', {trandate}, 'workorder', {custrecord_scv_by_product_wo.custrecord_scv_by_product_date})",
                    operator: 'onorbefore',
                    values: params.custpage_todt
                }))
            }

            if(params.custpage_item){
                filters.push(search.createFilter({
                    name: 'formulatext',
                    formula: '{item}',
                    operator: 'contains', 
                    values: params.custpage_item
                }))
            }

            if(params.custpage_location){
                filters.push(search.createFilter({
                    name: 'location', 
                    operator: 'anyof', 
                    values: params.custpage_location.split(',')
                }))
            }

            if(params.custpage_grp_lv1){
                filters.push(search.createFilter({
                    name: 'custitem_scv_group_lv1',
                    join: 'item',
                    operator: 'anyof',
                    values: params.custpage_grp_lv1
                }))
            }

            if(params.custpage_grp_lv2){
                filters.push(search.createFilter({
                    name: 'custitem_scv_group_lv2',
                    join: 'item',
                    operator: 'anyof',
                    values: params.custpage_grp_lv2
                }))
            }

            if(params.custpage_work_center){
                filters.push(search.createFilter({
                    name: 'custbody_scv_wo_center',
                    operator: 'anyof',
                    values: params.custpage_work_center.split(',')
                }))
            }

            return cSearchTotalScrapByItemRpt.getDataSourceFetchPage(filters, params);
        }

        const getDataSS06_ConsAbNhuaSumRpt = (params) => {
            let filters = [];

            if(params.custpage_subsidiary){
                filters.push(search.createFilter({
                    name: 'subsidiary',
                    operator: 'anyof',
                    values: params.custpage_subsidiary.split(',')
                }))
            }

            if(params.custpage_fromdt){
                filters.push(search.createFilter({
                    name: 'trandate',
                    operator: 'onorafter',
                    values: params.custpage_fromdt
                }))
            }

            if(params.custpage_todt){
                filters.push(search.createFilter({
                    name: 'trandate',
                    operator: 'onorbefore',
                    values: params.custpage_todt
                }))
            }

            if(params.custpage_item){
                filters.push(search.createFilter({
                    name: 'formulatext',
                    formula: '{item}',
                    operator: 'contains', 
                    values: params.custpage_item
                }))
            }

            if(params.custpage_location){
                filters.push(search.createFilter({
                    name: 'location',
                    operator: 'anyof',
                    values: params.custpage_location.split(',')
                }))
            }

            if(params.custpage_grp_lv1){
                filters.push(search.createFilter({
                    name: 'custitem_scv_group_lv1',
                    join: 'item',
                    operator: 'anyof',
                    values: params.custpage_grp_lv1
                }))
            }

            if(params.custpage_grp_lv2){
                filters.push(search.createFilter({
                    name: 'custitem_scv_group_lv2',
                    join: 'item',
                    operator: 'anyof',
                    values: params.custpage_grp_lv2
                }))
            }

            return cSearchConsAbNhuaSumRpt.getDataSourceFetchPage(filters, params);
        }

         const getDataSS07_ConsIaCostRpt = (params) => {
            let filters = [];

            if(params.custpage_subsidiary){
                filters.push(search.createFilter({
                    name: 'subsidiary',
                    operator: 'anyof',
                    values: params.custpage_subsidiary.split(',')
                }))
            }

            if(params.custpage_fromdt){
                filters.push(search.createFilter({
                    name: 'trandate',
                    operator: 'onorafter',
                    values: params.custpage_fromdt
                }))
            }

            if(params.custpage_todt){
                filters.push(search.createFilter({
                    name: 'trandate',
                    operator: 'onorbefore',
                    values: params.custpage_todt
                }))
            }

            if(params.custpage_location){
                filters.push(search.createFilter({
                    name: 'location',
                    operator: 'anyof',
                    values: params.custpage_location.split(',')
                }))
            }

            if(params.custpage_work_center){
                filters.push(search.createFilter({
                    name: 'custbody_scv_wo_center',
                    operator: 'anyof',
                    values: params.custpage_work_center.split(',')
                }))
            }

            return cSearchConsIaCostRpt.getDataSourceFetchPage(filters, params);
        }

        const getTemplateExcel = (params) =>{
            let curUser = runtime.getCurrentUser();
            let lkEntity = search.lookupFields({
                type: 'entity',
                id: curUser.id,
                columns: ['custentity_scv_legal_name', 'entityid']
            });
            let objRes = {
                name: "Báo cáo tiêu hao SX",
                url: file.load({id: '../xls/scv_rpt_mfg_consump.xlsx'}).url,
                subsidiary: constSubsidiary.getInfoSubsidiaryById(params.custpage_subsidiary),
                curUserInfo: lkEntity
            };

            return objRes;
        }

        const getTemplateExcelType2 = (params) =>{
            let objRes = {
                name: "Báo cáo tiêu hao nhựa",
                url: file.load({id: '../xls/scv_rpt_mfg_consump_type2.xlsx'}).url,
                subsidiary: constSubsidiary.getInfoSubsidiaryById(params.custpage_subsidiary),
            };

            return objRes;
        }

        return {onRequest}

    });
