/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  03 Nov 2025         Huy Pham			    Init, create file, Phát triển báo cáo phân tích giá thành, from mr.Trương Minh phúc(https://app.clickup.com/t/86d0tym86)
 */
/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/runtime', 'N/search', 'N/file',

    '../common/scv_common_rpt_cost_anlyt.js',

    '../cons/scv_cons_format.js',
    '../cons/scv_cons_form.js',

    '../cons/scv_cons_subsidiary.js',
    '../cons/scv_cons_location.js',

    '../cons/scv_cons_search_rpt_cost_anlyt_01.js', //customsearch_scv_cst_anlyt_value_rpt
    '../cons/scv_cons_search_rpt_cost_anlyt_02.js', //customsearch_scv_cst_anlyt_detail_rpt
    '../cons/scv_cons_search_rpt_cost_anlyt_03.js', //customsearch_scv_cst_anlyt_summary_rpt
    '../cons/scv_cons_search_rpt_cost_anlyt_04.js', //customsearch_scv_cst_anlyt_bomforwo_rpt
],
    
    (runtime, search, file,

        commonRptCostAnlyt,

        constFormat,
        constForm,

        constSubsidiary,
        constLocation,

        constSearchRptCostAnlyt01,
        constSearchRptCostAnlyt02,
        constSearchRptCostAnlyt03,
        constSearchRptCostAnlyt04,
    ) => {

        const CurrentScript = {
            ID: "customscript_scv_sl_rpt_cost_anlyt",
            DEPLOYID_UI: "customdeploy_scv_sl_rpt_cost_anlyt",
            DEPLOYID_DATA: "customdeploy_scv_sl_rpt_cost_anlyt_svc"
        }
        const onRequest = (context) => {
            constForm.setContext(context);
            constForm.setServiceScript(CurrentScript.ID, CurrentScript.DEPLOYID_DATA);

            let request = context.request;
            let params = request.parameters;
            let curScript = runtime.getCurrentScript();
    
            if(curScript.deploymentId == CurrentScript.DEPLOYID_DATA){
                let objResponse = {data: []};
                
				switch(params.action){
                    case "getDataLocation":
                        objResponse.data = getDataLocation(params);
                        break;
                    case "scv_cons_search_rpt_cost_anlyt_01":
                        objResponse.data = constSearchRptCostAnlyt01.getDataSourceFetchPage(params);
                        break;
                    case "scv_cons_search_rpt_cost_anlyt_02":
                        objResponse.data = constSearchRptCostAnlyt02.getDataSourceFetchPage(params);
                        break;
                    case "scv_cons_search_rpt_cost_anlyt_03":
                        objResponse.data = constSearchRptCostAnlyt03.getDataSourceFetchPage(params);
                        break;
                    case "scv_cons_search_rpt_cost_anlyt_04":
                        objResponse.data = constSearchRptCostAnlyt04.getDataSourceFetchPage(params);
                        break;
                    case "getTemplateExcel":
                        objResponse.data = getTemplateExcel(params);
                        break;
				}

				constForm.write(objResponse);
            }else{
                if(context.request.method == "GET"){
                    onCreateFormUI(params);

                    constForm.writePage();
                }
            }
        }

        const onCreateFormUI = (_params) =>{
            constForm.createForm("Báo cáo phân tích giá thành", '../cssl/scv_cs_sl_rpt_cost_anlyt.js');

            constForm.addPageLink([
                constSearchRptCostAnlyt01.ID, constSearchRptCostAnlyt02.ID,
                constSearchRptCostAnlyt03.ID, constSearchRptCostAnlyt04.ID
            ], true);

            constForm.addButton({id: "custpage_btn_search", label: "Search", functionName: "searchResult('F')"},{
                styleSubmit: true
            });
            constForm.addButton({id: "custpage_btn_export", label: "Export", functionName: "searchResult('T')"});

            let objMainGroup = constForm.addFieldGroup({id: "fieldgrp_main", label: "Filter"});

            let curUser = runtime.getCurrentUser();
            let today = constFormat.getDateTimeWithCurrentGMT(new Date());

            if(!_params.custpage_rpttype){
                _params.custpage_rpttype = commonRptCostAnlyt.ReportType._01GiaThanhTheoGiaTri.ID + "";
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

            constForm.addField({
                id: "custpage_rpttype", label: "Loại báo cáo", container: objMainGroup.id,
                type: "select",
            }, true, {
                lookup: {
                    data: commonRptCostAnlyt.getDataReportType(),
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
                id: "custpage_location", label: "Kho", container: objMainGroup.id,
                type: "multiselect",
            }, false, {
                lookup: {
                    data: getDataLocation(_params),
                    valueExpr: "internalid",
                    displayExpr: "name"
                },
                defaultValue: !!_params.custpage_location ? _params.custpage_location.split(",") : []
            });

            constForm.addField({
                id: "custpage_item", label: "Mã/Tên hàng hóa", container: objMainGroup.id,
                type: "text", 
            }, false, {
                defaultValue: _params.custpage_item
            });

            constForm.addGridDx({
                id: "custpage_grid_result",
                type: "treegrid",
                label: "Result",
                columns: commonRptCostAnlyt.getColumns(_params),
            });
        }

        const getTemplateExcel = (_params) =>{
            let objRes = {
                name: "Báo cáo phân tích giá thành",
                url: file.load({id: '../xls/scv_rpt_cost_anlyt.xlsx'}).url,
                subsidiary: constSubsidiary.getInfoSubsidiaryById(_params.custpage_subsidiary),
            };

            return objRes;
        }

        const getDataLocation = (_params) => {
            if(!_params.custpage_subsidiary) return [];

            let arrResult = constLocation.getDataSource(
                [
                    search.createFilter({
                        name: 'subsidiary',
                        operator: "anyof",
                        values: _params.custpage_subsidiary
                    }),
                    search.createFilter({
                        name: 'makeinventoryavailable',
                        operator: "is",
                        values: "T"
                    })
                ]
            );

            return arrResult;
        }

        return {
            onRequest,
        }

    });
