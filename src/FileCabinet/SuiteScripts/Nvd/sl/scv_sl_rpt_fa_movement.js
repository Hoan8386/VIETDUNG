/**
 * Nội dung:
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  19 Sep 2025         Khanh Tran			    Init, create file. Phát triển báo cáo Tăng giảm TSCĐ, form mr.Kỳ(https://app.clickup.com/t/86d0butgj)
 */
/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/runtime', 'N/search', 'N/file',
    '../common/scv_common_rpt_fa_movement.js',

    '../cons/scv_cons_form.js',

    '../cons/scv_cons_subsidiary.js',

    '../cons/scv_cons_search_rpt_fa_mvmt_ss01.js',
    '../cons/scv_cons_search_rpt_fa_mvmt_ss02.js',
],
    
    (runtime, search, file,
        cmRptFaMvmt,

        constForm,

        constSubsidiary,

        cSearchFaMvmtSS01,
        cSearchFaMvmtSS02,
    ) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */

        const serviceScript = {
            ID: 'customscript_scv_sl_rpt_fa_movement',
            DEPLOYID_UI: 'customdeploy_scv_sl_rpt_fa_movement',
            DEPLOYID_DATA: 'customdeploy_scv_sl_rpt_fa_movement_svc'
        }

        const onRequest = (scriptContext) => {
            constForm.setContext(scriptContext);
            constForm.setServiceScript(serviceScript.ID, serviceScript.DEPLOYID_DATA);

            let request = scriptContext.request;
            let params = request.parameters;
            let curScript = runtime.getCurrentScript();

            if (curScript.deploymentId == serviceScript.DEPLOYID_DATA) {
                let objResponse = {data: []};

                switch(params.action){
                    case 'getDataFaMvmtSS01':
                        objResponse.data = getDataFaMvmtSS01(params);
                        break;
                    case 'getDataFaMvmtSS02':
                        objResponse.data = getDataFaMvmtSS02(params);
                        break;
                    case 'getTemplateExcel':
                        objResponse.data = getTemplateExcel(params);
                        break;
				}

                constForm.write(objResponse);
            }
            else {
                if (request.method == 'GET') {
                    onCreateFormUI(params);
                    constForm.writePage();
                }
            }
        }

        const onCreateFormUI = (params) => {
            constForm.createForm('Báo cáo tăng giảm tài sản', '../cssl/scv_cs_sl_rpt_fa_movement.js');

            constForm.addPageLink([
                cSearchFaMvmtSS01.ID, cSearchFaMvmtSS02.ID
            ]);

            constForm.addButton({id: 'custpage_btn_search', label: 'Search', functionName: 'onSearchResult()'});
            constForm.addButton({id: 'custpage_btn_export', label: 'Export', functionName: 'onSearchResult("T")'});

            let mainGrp = constForm.addFieldGroup({id: 'fieldgrp_main', label: 'Thông tin tìm kiếm'});

            let curUser = runtime.getCurrentUser();

            if(!('custpage_subsidiary' in params)){
                params.custpage_subsidiary = curUser.subsidiary + '';
            }
            
            constForm.addField({
                id: 'custpage_subsidiary', label: 'Công ty/Chi nhánh', container: mainGrp.id,
                type: 'multiselect'
            }, true, {
                lookup: {
                    data: constSubsidiary.getDataSubsidiaryByUserRole(),
                    displayExpr: 'name', valueExpr: 'id'
                },
                defaultValue: params.custpage_subsidiary.split(',')
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
                id: 'custpage_assettype', 
                label: 'Phân loại tài sản', 
                container: mainGrp.id,
                type: 'select', 
                source: 'customrecord_ncfar_assettype'
            }, false);

            constForm.addField({
                id: 'custpage_asset', 
                label: 'Tài sản', 
                container: mainGrp.id,
                type: 'select', 
                source: 'customrecord_ncfar_asset'
            }, false);

            constForm.addField({
                id: 'custpage_asset_category', 
                label: 'Phân nhóm tài sản', 
                container: mainGrp.id,
                type: 'multiselect', 
                source: 'customrecord_ncfar_assettype_scv_categor',
            }, false);
            
            constForm.addGridDx({
                id: 'custpage_grid_result',
                type: 'treegrid',
                label: 'Kết quả',
                columns: cmRptFaMvmt.getColumnGrid(),
            });
        }

        const getDataFaMvmtSS01 = (params) => {
            let myFilters = [];

            if (params.custpage_subsidiary) {
                myFilters.push(search.createFilter({
                    name: 'custrecord_deprhistsubsidiary', 
                    operator: 'anyof', 
                    values: params.custpage_subsidiary.split(',')
                }))
            }

            if (params.custpage_fromdt) {
                myFilters.push(search.createFilter({
                    name: 'custrecord_deprhistdate',
                    operator: 'onorafter', 
                    values: params.custpage_fromdt
                }))
            }

            if (params.custpage_todt) {
                myFilters.push(search.createFilter({
                    name: 'custrecord_deprhistdate',
                    operator: 'onorbefore', 
                    values: params.custpage_todt
                }))
            }

            if (params.custpage_asset_category) {
                myFilters.push(search.createFilter({
                    name: 'custrecord_ncfar_assettype_scv_category',
                    join: 'custrecord_deprhistassettype',
                    operator: 'anyof', 
                    values: params.custpage_asset_category.split(',')
                }))
            }

            if (params.custpage_assettype) {
                myFilters.push(search.createFilter({
                    name: 'custrecord_assettype',
                    join: 'custrecord_deprhistassettype',
                    operator: 'anyof', 
                    values: params.custpage_assettype
                }))
            }

            if (params.custpage_asset) {
                myFilters.push(search.createFilter({
                    name: 'custrecord_deprhistasset',
                    operator: 'anyof', 
                    values: params.custpage_asset
                }))
            }

            let arrResult = cSearchFaMvmtSS01.getDataSourceFetchPage(myFilters, params);

            return arrResult;
        }

        const getDataFaMvmtSS02 = (params) => {
            let myFilters = [];

            if (params.custpage_subsidiary) {
                myFilters.push(search.createFilter({
                    name: 'custrecord_deprhistsubsidiary', 
                    operator: 'anyof', 
                    values: params.custpage_subsidiary.split(',')
                }))
            }

            if (params.custpage_todt) {
                myFilters.push(search.createFilter({
                    name: 'custrecord_deprhistdate',
                    operator: 'onorbefore', 
                    values: params.custpage_todt
                }))
            }

            if (params.custpage_asset_category) {
                myFilters.push(search.createFilter({
                    name: 'custrecord_ncfar_assettype_scv_category',
                    join: 'custrecord_deprhistassettype',
                    operator: 'anyof', 
                    values: params.custpage_asset_category.split(',')
                }))
            }

            if (params.custpage_assettype) {
                myFilters.push(search.createFilter({
                    name: 'custrecord_assettype',
                    join: 'custrecord_deprhistassettype',
                    operator: 'anyof', 
                    values: params.custpage_assettype
                }))
            }

            if (params.custpage_asset) {
                myFilters.push(search.createFilter({
                    name: 'custrecord_deprhistasset',
                    operator: 'anyof', 
                    values: params.custpage_asset
                }))
            }

            let arrResult = cSearchFaMvmtSS02.getDataSourceFetchPage(myFilters, params);

            return arrResult;
        }

        const getTemplateExcel = (params) =>{
            let objRes = {
                name: "Báo cáo tăng giảm tài sản.xlsx",
                url: file.load({id: '../xls/scv_rpt_fa_movement.xlsx'}).url,
                subsidiary: constSubsidiary.getInfoSubsidiaryById(params.custpage_subsidiary),
            };

            return objRes;
        }

        return {onRequest}

    });
