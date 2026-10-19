/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  21 May 2025         Huy Pham			    Init, create file, báo cáo phương án bán hàng,from ms.Ngọc(https://app.clickup.com/t/86cyzcz1u)
 *  30 Jun 2025         Huy Pham			    Update default Split Result, CK hiện tại, từ ms.Ngọc(https://app.clickup.com/t/86cyzcz1u?comment=90160118821507)  
 *  19 Aug 2025         Huy Pham                Update report layout and logic, from ms.Ngọc(https://app.clickup.com/t/86cyzcz1u?comment=90160129230101) 
 *  11 Sep 2025         Huy Pham                Bổ sung filter Location, from ms.Ngọc(https://app.clickup.com/t/86cyzcz1u?comment=90160133652302)
 */
/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/search', 'N/runtime', 'N/file',
    '../common/scv_common_rpt_pabh.js',
    '../cons/scv_cons_form.js',
    '../cons/scv_cons_format.js',

    '../cons/scv_cons_subsidiary.js',
    '../cons/scv_cons_location.js',

    '../cons/scv_cons_search_pabh_ss1.js',
    '../cons/scv_cons_search_pabh_ss2.js',
    '../cons/scv_cons_search_pabh_ss3.js',
    '../cons/scv_cons_search_pabh_ss4.js',
    '../cons/scv_cons_search_pabh_ss5.js',
    //'../cons/scv_cons_search_pabh_ss6.js',
    '../cons/scv_cons_search_pabh_ss6_d.js'
],
    
    (search, runtime, file,
        commonRptPabh,
        constForm,
        constFormat,

        constSubsidiary,
        constLocation,

        constSearchPabhSS01,
        constSearchPabhSS02,
        constSearchPabhSS03,
        constSearchPabhSS04,
        constSearchPabhSS05,
        //constSearchPabhSS06,
        constSearchPabhSS06_D,
    ) => {
        const CUR_SCRIPT = {
            ID: "customscript_scv_sl_rpt_pabh",
            DEPLOYID_UI: "customdeploy_scv_sl_rpt_pabh",
            DEPLOYID_DATA: "customdeploy_scv_sl_rpt_pabh_svc"
        }
        const onRequest = (scriptContext) => {
            constForm.setContext(scriptContext);
            constForm.setServiceScript(CUR_SCRIPT.ID, CUR_SCRIPT.DEPLOYID_DATA);

            let request = scriptContext.request;
            let params = request.parameters;
    
            let curScript = runtime.getCurrentScript();
            if(curScript.deploymentId == CUR_SCRIPT.DEPLOYID_DATA){
                let objResponse = {data: []};
                
				switch(params.action){
                    case "getDataLocation":
						objResponse.data = getDataLocation(params);
						break;
                    case "getDataCustomerSS02":
						objResponse.data = getDataCustomerSS02(params);
						break;
                    case "getDataGroupLevel2SS04":
						objResponse.data = getDataGroupLevel2SS04(params);
						break;
                    case "getDataTransSalesSS05":
						objResponse.data = getDataTransSalesSS05(params);
						break;
                    case "getDataSalesTermSS06":
						objResponse.data = getDataSalesTermSS06(params);
						break;
                    case "getTemplateExportExcel":
                        objResponse.data = getTemplateExportExcel(params);
                        break;
				}

				constForm.write(objResponse);
            }else{
                onCreateFormUI(params);
    
                constForm.writePage();
            }
        }

        const onCreateFormUI = (_params) =>{
            constForm.createForm("PHƯƠNG ÁN BÁN HÀNG", '../cssl/scv_cs_sl_rpt_pabh.js');

            constForm.addPageLink([
                constSearchPabhSS01.ID, constSearchPabhSS02.ID, constSearchPabhSS03.ID,
                constSearchPabhSS04.ID, constSearchPabhSS05.ID, constSearchPabhSS06_D.ID
            ]);

            constForm.addButton({id: "custpage_btn_search", label: "Search", functionName: "onSearchResult()"},{
                styleSubmit: true
            });
            constForm.addButton({id: "custpage_btn_export", label: "Export", functionName: "onExportResult()"});

            let objMainGroup = constForm.addFieldGroup({id: "fieldgrp_main", label: "Thông tin tìm kiếm"});
            let objDefaultGroup = constForm.addFieldGroup({id: "fieldgrp_default", label: "Thông tin mặc định khi xuất file"});

            let curUser = runtime.getCurrentUser();

            if(!_params.custpage_subsidiary){
                _params.custpage_subsidiary = curUser.subsidiary + "";
            }
            if(!_params.custpage_date){
                _params.custpage_date = constFormat.formatDate(constFormat.getDateTimeWithCurrentGMT(new Date()));
            }
            if(!_params.custpage_def_note){
                _params.custpage_def_note = "Với các đại lý không có trong PA trên, áp dụng PABH gần nhất trước đó hoặc PABH riêng đang có hiệu lực";
            }
            if(!_params.custpage_def_note_change){
                _params.custpage_def_note_change = "Không thay đổi gì so với tháng trước";
            }

            constForm.addField({
                id: "custpage_subsidiary", label: "Công ty", container: objMainGroup.id,
                type: "select", source: "subsidiary",
            }, true, {
                defaultValue: _params.custpage_subsidiary
            });

            constForm.addField({
                id: "custpage_date", label: "Ngày", container: objMainGroup.id,
                type: "date"
            }, true, {
                layoutType: "startrow",
                defaultValue: _params.custpage_date
            });

            constForm.addField({
                id: "custpage_entitycategory", label: "Nhóm khách hàng", container: objMainGroup.id,
                type: "multiselect"
            }, true, {
                lookup: {
                    data: getDataEntityCategorySS01()
                },
                defaultValue: !!_params.custpage_entitycategory ? _params.custpage_entitycategory.split(",") : []
            });

            constForm.addField({
                id: "custpage_customer", label: "Khách hàng", container: objMainGroup.id,
                type: "multiselect"
            }, false, {
                lookup: {
                    data: getDataCustomerSS02(_params),
                    valueExpr: "internalid"
                },
                defaultValue: !!_params.custpage_customer ? _params.custpage_customer.split(",") : []
            });

            constForm.addField({
                id: "custpage_grouplevel1", label: "Nhóm hàng hóa cấp 1", container: objMainGroup.id,
                type: "select"
            }, true, {
                lookup: {
                    data: getDataGroupLevel1SS03(_params),
                    valueExpr: "internalid"
                },
                defaultValue: _params.custpage_grouplevel1
            });

            constForm.addField({
                id: "custpage_grouplevel2", label: "Nhóm hàng hóa cấp 2", container: objMainGroup.id,
                type: "multiselect"
            }, false, {
                lookup: {
                    data: getDataGroupLevel2SS04(_params),
                    valueExpr: "internalid"
                },
                defaultValue: !!_params.custpage_grouplevel2 ? _params.custpage_grouplevel2.split(",") : []
            });

            constForm.addField({
                id: "custpage_splitresult", label: "Tách kết quả theo từng Nhóm cấp 2", container: objMainGroup.id,
                type: "checkbox"
            }, false, {
                defaultValue: _params.custpage_splitresult ?? "F"
            });

            constForm.addField({
                id: "custpage_def_note", label: "Ghi chú PABH", container: objDefaultGroup.id,
                type: "textarea"
            }, false, {
                defaultValue: _params.custpage_def_note
            });

            constForm.addField({
                id: "custpage_def_note_change", label: "Ghi chú thay đổi", container: objDefaultGroup.id,
                type: "textarea"
            }, false, {
                defaultValue: _params.custpage_def_note_change
            });

            constForm.addField({
                id: "custpage_location", label: "Kho", container: objMainGroup.id,
                type: "multiselect"
            }, false, {
                lookup: {
                    data: getDataLocation(_params),
                    valueExpr: "internalid"
                },
                defaultValue: !!_params.custpage_location ? _params.custpage_location.split(",") : []
            });

            addInfoSublist(_params);
        }

        const addInfoSublist = (_params) =>{
            commonRptPabh.setDataInput({parameters: _params});

            constForm.addGridDx({
                id: "custpage_grid_result",
                type: "grid",
                label: "Result",
                columns: commonRptPabh.getColumns(),
                optionsDx: {
                    editing: {allowUpdating: true},
                    columnChooser: {enabled: true, mode: "select"},
                }
            });

            constForm.addMarkAllButtonsDx("custpage_grid_result", {
                dataField: "checked", markFilters: true
            });

            //#region HuyPQ(20250522): test pivot
            let maskFormatVND = constFormat.getMaskFormatNumber('VND');

            constForm.addGridDx({
                id : "dataPivotGrid",
                type : "pivotgrid",
                label : "Data Analysis",
                columns: [],
                fields: [
                    {
                        caption: 'Customer Name',
                        dataField: '10:customername',
                        area: 'row',
                    },
                    {
                        dataField: '3:year',
                        dataType: 'string',
                        area: 'column',
                    },
                    {
                        dataField: '4:month',
                        dataType: 'string',
                        area: 'column',
                    },
                    {
                        caption: 'Customer Group',
                        dataField: '6:customergroup_display',
                        area: 'column',
                    },
                    {
                        caption: 'Item Group 1',
                        dataField: '11:itemgroup1_display',
                        area: 'column',
                    },
                    {
                        caption: 'Item Group 2',
                        dataField: '12:itemgroup2_display',
                        area: 'column',
                    },
                    {
                        caption: 'Thành Tiền',
                        dataField: '13:amount',
                        dataType: 'number',
                        summaryType: 'sum',
                        area: 'data',
                        format: maskFormatVND
                    },
                ],
                optionsDx: {
                    export: {enabled: false}
                }
            });

            //#endregion
        }

        const getDataEntityCategorySS01 = (_params) =>{
            let arrFilter = [];

            return constSearchPabhSS01.getDataSource(arrFilter);
        }

        const getDataCustomerSS02 = (_params) =>{
            let arrFilter = [];

            if(!!_params.custpage_subsidiary){
                arrFilter.push(search.createFilter({
                    name: 'internalid', 
                    join: "msesubsidiary",
                    operator: "anyof", 
                    values: _params.custpage_subsidiary.split(",")
                }));
            }

            if(!!_params.custpage_entitycategory){
                arrFilter.push(search.createFilter({
                    name: 'custentity_scv_entity_category', 
                    operator: "anyof", 
                    values: _params.custpage_entitycategory.split(",")
                }));
            }

            return constSearchPabhSS02.getDataSource(arrFilter);
        }

        const getDataGroupLevel1SS03 = (_params) =>{
            let arrFilter = [];

            return constSearchPabhSS03.getDataSource(arrFilter);
        }

        const getDataGroupLevel2SS04 = (_params) =>{
            let arrFilter = [];

            if(!!_params.custpage_grouplevel1){
                arrFilter.push(search.createFilter({
                    name: 'parent', 
                    operator: "anyof", 
                    values: _params.custpage_grouplevel1.split(",")
                }));
            }

            return constSearchPabhSS04.getDataSource(arrFilter);
        }

        const getDataTransSalesSS05 = (_params) =>{
            let arrFilter = [];

            if(!!_params.custpage_subsidiary){
                arrFilter.push(search.createFilter({
                    name: 'subsidiary', 
                    operator: "anyof", 
                    values: _params.custpage_subsidiary.split(",")
                }));
            }

            if(!!_params.custpage_date){
                let fromdate = constFormat.getBeginOfMonth(constFormat.addMonth(_params.custpage_date, -2));

                arrFilter.push(search.createFilter({
                    name: 'trandate',
                    operator: "onorafter",
                    values: fromdate
                }));

                arrFilter.push(search.createFilter({
                    name: 'trandate',
                    operator: "onorbefore",
                    values: _params.custpage_date
                }));
            }

            if(!!_params.custpage_entitycategory){
                arrFilter.push(search.createFilter({
                    name: 'custentity_scv_entity_category', 
                    join: "customer",
                    operator: "anyof", 
                    values: _params.custpage_entitycategory.split(",")
                }));
            }

            if(!!_params.custpage_customer){
                arrFilter.push(search.createFilter({
                    name: 'name', 
                    operator: "anyof", 
                    values: _params.custpage_customer.split(",")
                }));
            }

            if(!!_params.custpage_grouplevel1){
                arrFilter.push(search.createFilter({
                    name: 'custitem_scv_group_lv1', 
                    join: "item",
                    operator: "anyof", 
                    values: _params.custpage_grouplevel1.split(",")
                }));
            }

            if(!!_params.custpage_grouplevel2){
                arrFilter.push(search.createFilter({
                    name: 'custitem_scv_group_lv2', 
                    join: "item",
                    operator: "anyof", 
                    values: _params.custpage_grouplevel2.split(",")
                }));
            }

            if(!!_params.custpage_location){
                arrFilter.push(search.createFilter({
                    name: 'location', 
                    operator: "anyof", 
                    values: _params.custpage_location.split(",")
                }));
            }
            
            return constSearchPabhSS05.getDataSourceFetchPage(arrFilter, _params);
        }

        const getDataSalesTermSS06 = (_params) =>{
            let arrFilter = [];

            if(!!_params.custpage_subsidiary){
                arrFilter.push(search.createFilter({
                    name: 'custrecord_scv_st_subsidiary', 
                    join: "CUSTRECORD_SCV_ST_D_PARENT",
                    operator: "anyof", 
                    values: _params.custpage_subsidiary.split(",")
                }));
            }

            if(!!_params.custpage_date){
                arrFilter.push(search.createFilter({
                    name: 'custrecord_scv_st_start_date',
                    join: "CUSTRECORD_SCV_ST_D_PARENT",
                    operator: "onorbefore",
                    values: _params.custpage_date
                }));

                arrFilter.push(search.createFilter({
                    name: 'custrecord_scv_st_end_date',
                    join: "CUSTRECORD_SCV_ST_D_PARENT",
                    operator: "onorafter",
                    values: _params.custpage_date
                }));
            }

            if(!!_params.custpage_entitycategory){
                arrFilter.push(search.createFilter({
                    name: 'custrecord_scv_st_cus_category', 
                    join: "CUSTRECORD_SCV_ST_D_PARENT",
                    operator: "anyof", 
                    values: _params.custpage_entitycategory.split(",")
                }));
            }

            if(!!_params.custpage_customer){
                arrFilter.push(search.createFilter({
                    name: 'custrecord_scv_st_customer', 
                    join: "CUSTRECORD_SCV_ST_D_PARENT",
                    operator: "anyof", 
                    values: _params.custpage_customer.split(",")
                }));
            }

            if(!!_params.custpage_grouplevel1){
                arrFilter.push(search.createFilter({
                    name: 'custrecord_scv_st_d_group_parent', 
                    operator: "anyof", 
                    values: _params.custpage_grouplevel1.split(",")
                }));
            }

            if(!!_params.custpage_grouplevel2){
                arrFilter.push(search.createFilter({
                    name: 'custrecord_scv_st_d_group', 
                    operator: "anyof", 
                    values: _params.custpage_grouplevel2.split(",")
                }));
            }

            return constSearchPabhSS06_D.getDataSource(arrFilter, _params);
        }

        const getDataLocation = (_params) =>{
            if(!_params.custpage_subsidiary) return [];

            return constLocation.getDataSource(
                search.createFilter({
                    name: 'subsidiary',
                    operator: "anyof",
                    values: _params.custpage_subsidiary
                })
            );
        }

        const getTemplateExportExcel = (_params) =>{
            let objRes = {
                name: "Báo Cáo Phương Án Bán Hàng",
                url: file.load({id: '../xls/scv_rpt_pabh.xlsx'}).url,
                subsidiary: constSubsidiary.getInfoSubsidiaryById(_params.custpage_subsidiary)[0]
            };

            return objRes;
        }

        return {onRequest}

    });
