/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  08 Aug 2025         Khanh Tran			    Init, create file. Báo cáo bảng tính giá thành, form mr.TMPhúc(https://app.clickup.com/t/86czxcy1f)
 */
/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/runtime', 'N/search',
    '../cons/scv_cons_form.js',
    '../cons/scv_cons_subsidiary.js',

    '../cons/scv_cons_search_prod_summary_cost_rpt.js',
    '../cons/scv_cons_search_prod_detail_cost_rpt.js',
    '../cons/scv_cons_search_bom_by_wo_cost_rpt.js',
    '../cons/scv_cons_search_bom_revision_cost_rpt.js',
],
    
    (runtime, search,
        constForm,
        constSubsidiary,

        cSearchProdSummaryCostRpt,
        cSearchProdDetailCostRpt,
        cSearchBomByWoCostRpt,
        cSearchBomRevCostRpt,
    ) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */

        const serviceScript = {
            ID: 'customscript_scv_sl_rpt_costing_sheet',
            DEPLOYID_UI: 'customdeploy_scv_sl_rpt_costing_sheet',
            DEPLOYID_DATA: 'customdeploy_scv_sl_rpt_costing_sheet_dt'
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
                    case 'getDataSS01_SummaryCost':
                        objResponse.data = getDataSS01_SummaryCost(params);
                        break;
                    case 'getDataSS02_DetailCost':
                        objResponse.data = getDataSS02_DetailCost(params);
                        break;
                    case 'getDataSS03_BomByWoCost':
                        objResponse.data = getDataSS03_BomByWoCost(params);
                        break;
                    case 'getDataSS04_BomRevCost':
                        objResponse.data = getDataSS04_BomRevCost(params);
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
            constForm.createForm('Bảng tính giá thành', '../cssl/scv_cs_sl_rpt_costing_sheet.js');

            constForm.addPageLink([
                cSearchProdSummaryCostRpt.ID,
                cSearchProdDetailCostRpt.ID,
                cSearchBomByWoCostRpt.ID,
            ]);

            constForm.addButton({id: 'custpage_btn_search', label: 'Search', functionName: 'onSearchResult()'});
            constForm.addButton({id: 'custpage_btn_exp_costing_sheet_by_code', label: 'Bảng giá thành (Theo mã)', functionName: 'onSearchResult("T", "T")'});
            constForm.addButton({id: 'custpage_btn_exp_costing_sheet', label: 'Bảng giá thành', functionName: 'onSearchResult("T", "F")'});

            let mainGrp = constForm.addFieldGroup({id: 'fieldgrp_main', label: 'Thông tin tìm kiếm'});

            let curUser = runtime.getCurrentUser();

            if(!params.custpage_subsidiary){
                params.custpage_subsidiary = curUser.subsidiary + '';
            }

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
                id: 'custpage_item', label: 'Thành phẩm', container: mainGrp.id,
                type: 'text', 
            }, false, {
                defaultValue: params.custpage_item
            });

            constForm.addField({
                id: 'custpage_location', label: 'Kho', container: mainGrp.id,
                type: 'multiselect'
            }, false);

            constForm.addField({
                id: 'custpage_nvl', label: 'Nguyên vật liệu', container: mainGrp.id,
                type: 'multiselect', source: 'item'
            }, false);

            constForm.addField({
                id: 'custpage_pdsp', label: 'Phân đoạn sản phẩm', container: mainGrp.id,
                type: 'select', source: 'customrecord_scv_group_level'
            }, false);
            
            constForm.addTab({
                id: 'tab_result',
                label: 'Kết quả'
            })

            constForm.addGridDx({
                id: 'custpage_grid_result',
                type: 'grid',
                tab: 'tab_result',
                label: 'Kết quả',
                columns: [
                    {dataField: 'checked', caption: 'Chọn', dataType: 'boolean', allowEditing: true, width: 80},
                    {dataField: 'item_code', caption: 'Mã thành phẩm', dataType: 'string', width: 250},
                    {dataField: 'item_display', caption: 'Tên thành phẩm', dataType: 'string', width: 400},
                    {dataField: 'unit_display', caption: 'ĐVT', dataType: 'string', width: 150},
                    {dataField: 'ttl_qty', caption: 'Tổng số lượng', dataType: 'number', format: '#,##0', width: 150},
                    {dataField: 'cost_per_qty', caption: 'Giá thành/đơn vị TP', dataType: 'number', format: '#,##0', width: 200},
                    {dataField: 'ttl_amt', caption: 'Tổng giá thành', dataType: 'number', format: '#,##0', width: 200},
                    {dataField: 'jsondata', caption: 'jsondata', dataType: 'string', width: 50, visible: false },
                ],
                optionsDx: {
                    editing: {allowUpdating: true},
                }
            });

            constForm.addMarkAllButtonsDx('custpage_grid_result', {
                dataField: 'checked', markFilters: true
            });
        }

        const getDataSS04_BomRevCost = (params) => {
            let myFilters = [];

            if(params.custpage_subsidiary){
                myFilters.push(search.createFilter({
                    name: 'subsidiary',
                    join: 'transaction',
                    operator: 'anyof',
                    values: params.custpage_subsidiary
                }))
            }

            if(params.custpage_item){
                myFilters.push(search.createFilter({
                    name: 'formulatext',
                    formula: '{transaction.custbody_scv_wo_assembly}',
                    operator: 'contains',
                    values: params.custpage_item
                }))
            }

            let arrResult = cSearchBomRevCostRpt.getDataSourceFetchPage(myFilters, params);

            return arrResult;
        }

        const getDataSS03_BomByWoCost = (params) => {
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
                    name: 'trandate',
                    join: 'applyingtransaction',
                    operator: 'onorafter', 
                    values: params.custpage_fromdt
                }))
            }

            if(params.custpage_todt){
                myFilters.push(search.createFilter({
                    name: 'trandate',
                    join: 'applyingtransaction',
                    operator: 'onorbefore', 
                    values: params.custpage_todt
                }))
            }

            if(params.custpage_item){
                myFilters.push(search.createFilter({
                    name: 'formulatext',
                    formula: '{custbody_scv_wo_assembly}',
                    operator: 'contains', 
                    values: params.custpage_item
                }))
            }

            if(params.custpage_location.length){
                myFilters.push(search.createFilter({
                    name: 'location', 
                    operator: 'anyof', 
                    values: params.custpage_location.split(',')
                }))
            }

            if(params.custpage_nvl.length){
                myFilters.push(search.createFilter({
                    name: 'item',
                    operator: 'anyof', 
                    values: params.custpage_nvl.split(',')
                }))
            }

            if(params.custpage_pdsp){
                myFilters.push(search.createFilter({
                    join: 'custbody_scv_wo_assembly',
                    name: 'custitem_scv_group_lv1',
                    operator: 'anyof',
                    values: params.custpage_pdsp
                }))
            }

            let arrResult = cSearchBomByWoCostRpt.getDataSourceFetchPage(myFilters, params);

            return arrResult;
        }

        const getDataSS02_DetailCost = (params) => {
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
                    name: 'trandate', 
                    operator: 'onorafter', 
                    values: params.custpage_fromdt
                }))
            }

            if(params.custpage_todt){
                myFilters.push(search.createFilter({
                    name: 'trandate', 
                    operator: 'onorbefore', 
                    values: params.custpage_todt
                }))
            }

            if(params.custpage_item){
                myFilters.push(search.createFilter({
                    name: 'formulatext',
                    formula: '{custbody_scv_wo_assembly}',
                    operator: 'contains', 
                    values: params.custpage_item
                }))
            }

            if(params.custpage_location.length){
                myFilters.push(search.createFilter({
                    name: 'location', 
                    operator: 'anyof', 
                    values: params.custpage_location.split(',')
                }))
            }
            
            if(params.custpage_nvl.length){
                myFilters.push(search.createFilter({
                    name: 'item',
                    operator: 'anyof', 
                    values: params.custpage_nvl.split(',')
                }))
            }

            if(params.custpage_pdsp){
                myFilters.push(search.createFilter({
                    join: 'custbody_scv_wo_assembly',
                    name: 'custitem_scv_group_lv1',
                    operator: 'anyof',
                    values: params.custpage_pdsp
                }))
            }

            let arrResult = cSearchProdDetailCostRpt.getDataSourceFetchPage(myFilters, params);

            return arrResult;
        }

        const getDataSS01_SummaryCost = (params) => {
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
                    name: 'trandate', 
                    operator: 'onorafter', 
                    values: params.custpage_fromdt
                }))
            }

            if(params.custpage_todt){
                myFilters.push(search.createFilter({
                    name: 'trandate', 
                    operator: 'onorbefore', 
                    values: params.custpage_todt
                }))
            }

            if(params.custpage_item){
                myFilters.push(search.createFilter({
                    name: 'formulatext',
                    formula: '{item.name}',
                    operator: 'contains', 
                    values: params.custpage_item
                }))
            }

            if(params.custpage_location.length){
                myFilters.push(search.createFilter({
                    name: 'location', 
                    operator: 'anyof', 
                    values: params.custpage_location.split(',')
                }))
            }

            if(params.custpage_pdsp){
                myFilters.push(search.createFilter({
                    join: 'item',
                    name: 'custitem_scv_group_lv1',
                    operator: 'anyof', 
                    values: params.custpage_pdsp
                }))
            }

            let arrResult = cSearchProdSummaryCostRpt.getDataSourceFetchPage(myFilters, params);

            return arrResult;
        }

        return {onRequest}

    });
