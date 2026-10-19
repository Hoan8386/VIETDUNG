/**
 * Nội dung:
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  28 Aug 2025         Khanh Tran			    Init, create file. Phát triển báo cáo kết quả mục tiêu sản xuất ACP, form mr.TMPhúc(https://app.clickup.com/t/86d04224z)
 */
/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/runtime', 'N/search', 'N/file',
    '../common/scv_common_rpt_prod_tgt_res.js',
    '../cons/scv_cons_form.js',
    '../cons/scv_cons_format.js',

    '../cons/scv_cons_subsidiary.js',
    '../cons/scv_cons_entitygroup.js',

    '../cons/scv_cons_search_rpt_prod_tgt_res_ss01.js',
    '../cons/scv_cons_search_rpt_prod_tgt_res_ss02.js',
    '../cons/scv_cons_search_rpt_prod_tgt_res_ss03.js',
    '../cons/scv_cons_search_rpt_prod_tgt_res_ss04.js',
],
    
    (runtime, search, file,
        commRptAcpProdTgtRes,
        constForm,
        constFormat,

        constSubsidiary,
        constEntityGroup,

        cSearchMfgProdResultSS01,
        cSearchMfgScrapSS02,
        cSearchQcResultSS03,
        cSearchWorkbenchSS04,
    ) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */

        const serviceScript = {
            ID: 'customscript_scv_sl_rpt_acp_prod_tgt_res',
            DEPLOYID_UI: 'customdeploy_scv_sl_rpt_prod_tgt_res',
            DEPLOYID_DATA: 'customdeploy_scv_sl_rpt_prod_tgt_res_svc'
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
                    case 'getDataMfgProdResultSS01':
                        objResponse.data = getDataMfgProdResultSS01(params);
                        break;
                    case 'getDataMfgScrapSS02':
                        objResponse.data = getDataMfgScrapSS02(params);
                        break;
                    case 'getDataQcResultSS03':
                        objResponse.data = getDataQcResultSS03(params);
                        break;
                    case 'getDataWorkbenchSS04':
                        objResponse.data = getDataWorkbenchSS04(params);
                        break;
                    case 'getTemplateExcel':
                        objResponse.data = getTemplateExcel(params);
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
            constForm.createForm('Báo cáo kết quả thực hiện mục tiêu sản xuất (ACP)', '../cssl/scv_cs_sl_rpt_prod_tgt_res.js');

            constForm.addPageLink([
                cSearchMfgProdResultSS01.ID, cSearchMfgScrapSS02.ID, cSearchQcResultSS03.ID, cSearchWorkbenchSS04.ID,
            ]);

            constForm.addButton({id: 'custpage_btn_search', label: 'Search', functionName: 'onSearchResult()'});
            constForm.addButton({id: 'custpage_btn_export', label: 'Export', functionName: 'onSearchResult("T")'});

            let mainGrp = constForm.addFieldGroup({id: 'fieldgrp_main', label: 'Thông tin tìm kiếm'});

            let curUser = runtime.getCurrentUser();

            if(!('custpage_subsidiary' in params)){
                params.custpage_subsidiary = curUser.subsidiary + '';
            }
            if(!('custpage_rpttype' in params)){
                params.custpage_rpttype = commRptAcpProdTgtRes.ReportType._01BeforeQcTarget.ID
            }
            
            constForm.addField({
                id: 'custpage_rpttype', label: 'Loại báo cáo', container: mainGrp.id,
                type: 'select'
            }, true, {
                lookup: {
                    data: commRptAcpProdTgtRes.getDataReportType(),
                    valueExpr: "value", displayExpr: "text",
                },
                defaultValue: params.custpage_rpttype
            });

            constForm.addField({
                id: 'custpage_subsidiary', label: 'Công ty', container: mainGrp.id,
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
                id: 'custpage_shift', label: 'Ca', container: mainGrp.id,
                type: 'multiselect', source: 'customrecord_mfgmob_shift'
            }, false, {
                defaultValue: params.custpage_shift
            });

            constForm.addField({
                id: 'custpage_work_center', label: 'Máy', container: mainGrp.id,
                type: 'multiselect',
            }, false, {
                lookup: {
                    data: constEntityGroup.getDataSource(
                            search.createFilter({
                                name: 'custentity_scv_sub',
                                operator: "anyof",
                                values: params.custpage_subsidiary
                            })
                        ),
                    displayExpr: 'groupname', valueExpr: 'internalid'
                },
                defaultValue: params.custpage_work_center
            });

            constForm.addField({
                id: 'custpage_planing_category', label: 'Nhóm kế hoạch', container: mainGrp.id,
                type: 'multiselect', source: 'customrecord_scv_planning_category'
            }, false, {
                defaultValue: params.custpage_planing_category
            });

            constForm.addField({
                id: 'custpage_trademark', label: 'Thương hiệu', container: mainGrp.id,
                type: 'multiselect', source: 'customlist_scv_thuong_hieu'
            }, false, {
                defaultValue: params.custpage_trademark
            });

            constForm.addGridDx({
                id: 'custpage_grid_result',
                type: 'treegrid',
                label: 'Kết quả',
                columns: commRptAcpProdTgtRes.getColumns(params.custpage_rpttype),
            });
        }

        const getDataMfgProdResultSS01 = (params) => {
            let myFilters = [];

            if(params.custpage_subsidiary){
                myFilters.push(search.createFilter({
                    name: 'subsidiary', 
                    operator: 'anyof', 
                    values: params.custpage_subsidiary
                }))
            }

            if(params.custpage_fromdt){
                myFilters.push(search.createFilter({
                    name: 'custbody_scv_mfg_date',
                    operator: 'onorafter', 
                    values: params.custpage_fromdt
                }))
            }

            if(params.custpage_todt){
                myFilters.push(search.createFilter({
                    name: 'custbody_scv_mfg_date',
                    operator: 'onorbefore', 
                    values: params.custpage_todt
                }))
            }

            if(params.custpage_shift){
                myFilters.push(search.createFilter({
                    name: 'custbody_scv_shift', 
                    operator: 'anyof', 
                    values: params.custpage_shift.split(',')
                }))
            }

            if(params.custpage_work_center){
                myFilters.push(search.createFilter({
                    name: 'custbody_scv_wo_center', 
                    operator: 'anyof', 
                    values: params.custpage_work_center.split(',')
                }))
            }

            if(params.custpage_planing_category){
                myFilters.push(search.createFilter({
                    name: 'custitem_scv_planing_category',
                    join: 'item',
                    operator: 'anyof', 
                    values: params.custpage_planing_category.split(',')
                }))
            }

            if(params.custpage_trademark){
                myFilters.push(search.createFilter({
                    name: 'custitem_scv_trademark',
                    join: 'item',
                    operator: 'anyof', 
                    values: params.custpage_trademark.split(',')
                }))
            }

            let arrResult = cSearchMfgProdResultSS01.getDataSourceFetchPage(myFilters, params);

            return arrResult;
        }

        const getDataMfgScrapSS02 = (params) => {
            let myFilters = [];

            if(params.custpage_subsidiary){
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_by_product_sub', 
                    operator: 'anyof', 
                    values: params.custpage_subsidiary
                }))
            }

            if(params.custpage_fromdt){
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_by_product_date', 
                    operator: 'onorafter', 
                    values: params.custpage_fromdt
                }))
            }

            if(params.custpage_todt){
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_by_product_date', 
                    operator: 'onorbefore', 
                    values: params.custpage_todt
                }))
            }

            if(params.custpage_shift){
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_by_product_shift', 
                    operator: 'anyof', 
                    values: params.custpage_shift.split(',')
                }))
            }

            if(params.custpage_work_center){
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_by_product_work_center', 
                    operator: 'anyof', 
                    values: params.custpage_work_center.split(',')
                }))
            }

            if(params.custpage_planing_category){
                myFilters.push(search.createFilter({
                    name: 'custitem_scv_planing_category',
                    join: 'custrecord_scv_by_product_assembly_item',
                    operator: 'anyof', 
                    values: params.custpage_planing_category.split(',')
                }))
            }

            if(params.custpage_trademark){
                myFilters.push(search.createFilter({
                    name: 'custitem_scv_trademark',
                    join: 'custrecord_scv_by_product_assembly_item',
                    operator: 'anyof', 
                    values: params.custpage_trademark.split(',')
                }))
            }

            let arrResult = cSearchMfgScrapSS02.getDataSourceFetchPage(myFilters, params);

            return arrResult;
        }

        const getDataQcResultSS03 = (params) => {
            let myFilters = [];

            if(params.custpage_subsidiary){
                myFilters.push(search.createFilter({
                    name: 'subsidiary', 
                    operator: 'anyof', 
                    values: params.custpage_subsidiary
                }))
            }

            if(params.custpage_fromdt){
                myFilters.push(search.createFilter({
                    name: 'custbody_scv_mfg_date', 
                    join: 'custbody_scv_created_transaction',
                    operator: 'onorafter', 
                    values: params.custpage_fromdt
                }))
            }

            if(params.custpage_todt){
                myFilters.push(search.createFilter({
                    name: 'custbody_scv_mfg_date', 
                    join: 'custbody_scv_created_transaction',
                    operator: 'onorbefore', 
                    values: params.custpage_todt
                }))
            }

            if(params.custpage_shift){
                myFilters.push(search.createFilter({
                    name: 'custbody_scv_shift',
                    join: 'custbody_scv_created_transaction',
                    operator: 'anyof', 
                    values: params.custpage_shift.split(',')
                }))
            }

            if(params.custpage_work_center){
                myFilters.push(search.createFilter({
                    name: 'custbody_scv_wo_center',
                    join: 'custbody_scv_created_transaction',
                    operator: 'anyof', 
                    values: params.custpage_work_center.split(',')
                }))
            }

            if(params.custpage_planing_category){
                myFilters.push(search.createFilter({
                    name: 'custitem_scv_planing_category',
                    join: 'item',
                    operator: 'anyof', 
                    values: params.custpage_planing_category.split(',')
                }))
            }

            if(params.custpage_trademark){
                myFilters.push(search.createFilter({
                    name: 'custitem_scv_trademark',
                    join: 'item',
                    operator: 'anyof', 
                    values: params.custpage_trademark.split(',')
                }))
            }

            let arrResult = cSearchQcResultSS03.getDataSourceFetchPage(myFilters, params);

            return arrResult;
        }

        const getDataWorkbenchSS04 = (params) => {
            let myFilters = [];

            if(params.custpage_subsidiary){
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_work_bench_subsidiary', 
                    operator: 'anyof', 
                    values: params.custpage_subsidiary
                }))
            }

            if(params.custpage_fromdt){
                let firstDay = new Date(constFormat.parseDate(params.custpage_fromdt).getFullYear(), 0, 1);
                
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_effective_from_date',
                    operator: 'onorafter', 
                    values: constFormat.formatDate(firstDay)
                }))
            }

            if(params.custpage_todt){
                let lastDay = new Date(constFormat.parseDate(params.custpage_todt).getFullYear(), 11, 31);
                
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_effective_from_date',
                    operator: 'onorbefore', 
                    values: constFormat.formatDate(lastDay)
                }))
            }

            if(params.custpage_work_center){
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_work_bench_work_center',
                    operator: 'anyof', 
                    values: params.custpage_work_center.split(',')
                }))
            }

            if(params.custpage_planing_category){
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_work_bench_planning_cate',
                    operator: 'anyof', 
                    values: params.custpage_planing_category.split(',')
                }))
            }

            let arrResult = cSearchWorkbenchSS04.getDataSourceFetchPage(myFilters, params);

            return arrResult;
        }

        const getTemplateExcel = (params) =>{
            let objRes = {
                name: "Báo cáo kết quả thực hiện mục tiêu sản xuất.xlsx",
                url: file.load({id: '../xls/scv_rpt_prod_tgt_res.xlsx'}).url,
                subsidiary: constSubsidiary.getInfoSubsidiaryById(params.custpage_subsidiary),
            };

            return objRes;
        }

        return {onRequest}

    });
