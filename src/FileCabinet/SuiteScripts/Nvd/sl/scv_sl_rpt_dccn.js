/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  19 Jun 2025         Huy Pham			    Init, create file, báo cáo đối chiếu công nợ,from ms.Ngọc(https://app.clickup.com/t/86czaq0qp)
 */
/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/search', 'N/runtime', 'N/file', 'N/render', 'N/record',
    '../common/scv_common_pdf.js',
    '../common/scv_common_rpt_dccn.js',
    '../cons/scv_cons_form.js',
    '../cons/scv_cons_format.js',

    '../cons/scv_cons_subsidiary.js',
    '../cons/scv_cons_customer.js',
    '../cons/scv_cons_entity_category.js',
    '../cons/scv_cons_entity_category_type.js',

    '../cons/scv_cons_search_dccn_ss01.js',
    '../cons/scv_cons_search_dccn_ss02.js',
    '../cons/scv_cons_search_dccn_ss03.js',
],
    
    (search, runtime, file, render, record,
        commonPdf,
        commonRptDccn,
        constForm,
        constFormat,

        constSubsidiary,
        constCustomer,
        constEntCategory,
        constEntCatType,

        constSearchDCCNSS01,
        constSearchDCCNSS02,
        constSearchDCCNSS03,
    ) => {
        const CUR_SCRIPT = {
            ID: "customscript_scv_sl_rpt_dccn",
            DEPLOYID_UI: "customdeploy_scv_sl_rpt_dccn",
            DEPLOYID_DATA: "customdeploy_scv_sl_rpt_dccn_svc"
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
                    case "getDataCustomer":
						objResponse.data = getDataCustomer(params);
						break;
                    case "getDataSoDuSS01":
						objResponse.data = getDataSoDuSS01(params);
						break;
                    case "getDataXuatKhoSS02":
						objResponse.data = getDataXuatKhoSS02(params);
						break;
                    case "getDataThanhToanSS03":
						objResponse.data = getDataThanhToanSS03(params);
						break;
                    case "getTemplateExcel":
                        objResponse.data = getTemplateExcel(params);
                        break;
                    case "printPDF":

                    break;
                    case "getDataFilePDF":
                        objResponse.data = getDataFilePDF(params);
                    break;
				}

				constForm.write(objResponse);
            }else{
                if(params.exportPdf == "T"){
                    let pdfFile = exportResultPdf(params);

                    scriptContext.response.writeFile(pdfFile, true);
                }
                else{
                    onCreateFormUI(params);
    
                    constForm.writePage();
                }
            }
        }

        const onCreateFormUI = (_params) =>{
            constForm.createForm("BẢNG KÊ CHI TIẾT VÀ ĐỐI CHIẾU CÔNG NỢ", '../cssl/scv_cs_sl_rpt_dccn.js');

            constForm.addPageLink([
                constSearchDCCNSS01.ID, constSearchDCCNSS02.ID,
                constSearchDCCNSS03.ID
            ], true);

            constForm.addButton({id: "custpage_btn_search", label: "Search", functionName: "onSearchResult('F')"},{
                styleSubmit: true
            });
            constForm.addButton({id: "custpage_btn_export", label: "Export", functionName: "onSearchResult('T')"});

            let objMainGroup = constForm.addFieldGroup({id: "fieldgrp_main", label: "Thông tin tìm kiếm"});
            let objDefaultGroup = constForm.addFieldGroup({id: "fieldgrp_default", label: "Thông tin mặc định"});

            let curUser = runtime.getCurrentUser();
            let today = constFormat.getDateTimeWithCurrentGMT(new Date());

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
                id: "custpage_subsidiary", label: "Công ty", container: objMainGroup.id,
                type: "select", source: "subsidiary",
            }, true, {
                defaultValue: _params.custpage_subsidiary
            });

            constForm.addField({
                id: "custpage_entitycategory", label: "Nhóm khách hàng", container: objMainGroup.id,
                type: "select"
            }, false, {
                lookup: {
                    data: constEntCategory.getDataEntityCategoryWithType(constEntCatType.RECORDS.CUSTOMER.ID),
                    valueExpr: "internalid",
                    displayExpr: "name"
                },
                defaultValue: _params.custpage_entitycategory
            });

            constForm.addField({
                id: "custpage_customer", label: "Khách hàng", container: objMainGroup.id,
                type: "multiselect"
            }, false, {
                lookup: {
                    data: getDataCustomer(_params).arrResult,
                    valueExpr: "internalid",
                    displayExpr: "entityid",
                },
                defaultValue: !!_params.custpage_customer ? _params.custpage_customer.split(",") : []
            });

            constForm.addField({
                id: "custpage_fromdt", label: "Từ ngày", container: objMainGroup.id,
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
                id: "custpage_owner", label: "Đại diện", container: objDefaultGroup.id,
                type: "text"
            }, false, {
                defaultValue: _params.custpage_owner
            });

            constForm.addGridDx({
                id: "custpage_grid_result",
                type: "treegrid",
                label: "Result",
                columns: commonRptDccn.getColumns(),
            });
        }

        const getTemplateExcel = (_params) =>{
            let objRes = {
                name: "Bảng kê chi tiết và đối chiếu công nợ",
                url: file.load({id: '../xls/scv_rpt_dccn.xlsx'}).url,
                subsidiary: constSubsidiary.getInfoSubsidiaryById(_params.custpage_subsidiary),
                entity: !!_params.entity_id ? constCustomer.getDataSource(search.createFilter({
                    name: 'internalid', 
                    operator: "anyof", 
                    values: _params.entity_id.split(",")
                })) : []
            };

            return objRes;
        }

        const getDataCustomer = (_params, _isFullData = false) =>{
            let objRes = {
                arrResult: [], 
                info: {
                    page: 0, ttlPage: 1, rangePageFetch: 1
                }
            };

            let filters = [];

            if(!!_params.custpage_subsidiary){
                filters.push(search.createFilter({
                    name: 'subsidiary',
                    operator: "anyof",
                    values: _params.custpage_subsidiary
                }))
            }
            else{
                return objRes;
            }

            if(!!_params.custpage_entitycategory){
                filters.push(search.createFilter({
                    name: 'custentity_scv_entity_category',
                    join: 'customer',
                    operator: "anyof",
                    values: _params.custpage_entitycategory
                }))
            }

            if(!!_params.custpage_customer){
                filters.push(search.createFilter({
                    name: 'internalid',
                    join: "customer",
                    operator: "anyof",
                    values: _params.custpage_customer.split(",")
                }))
            }

            objRes.arrResult = constCustomer.getDataSourceSubsidiaryRelationship(filters);

            if(_isFullData){
                return objRes.arrResult;
            }

            return objRes;
        }

        const getDataSoDuSS01 = (_params, _isFullData = false) => {
            let filters = [];

            if(!!_params.custpage_subsidiary){
                filters.push(search.createFilter({
                    name: 'subsidiary',
                    operator: "anyof",
                    values: _params.custpage_subsidiary
                }))
            }

            if(!!_params.custpage_customer){
                filters.push(search.createFilter({
                    name: 'internalid',
                    join: "customer",
                    operator: "anyof",
                    values: _params.custpage_customer.split(",")
                }))
            }

            if(!!_params.custpage_entitycategory){
                filters.push(search.createFilter({
                    name: 'custentity_scv_entity_category',
                    join: "customer",
                    operator: "anyof",
                    values: _params.custpage_entitycategory.split(",")
                }))
            }

            if(!!_params.custpage_fromdt){
                filters.push(search.createFilter({
                    name: 'trandate',
                    operator: "before",
                    values: _params.custpage_fromdt
                }));
            }

            if(_isFullData){
                return constSearchDCCNSS01.getDataSource(filters);
            }

            return constSearchDCCNSS01.getDataSourceFetchPage(filters, _params);
        }

        const getDataXuatKhoSS02 = (_params, _isFullData = false) => {
            let filters = [];

            if(!!_params.custpage_subsidiary){
                filters.push(search.createFilter({
                    name: 'subsidiary',
                    operator: "anyof",
                    values: _params.custpage_subsidiary
                }))
            }

            if(!!_params.custpage_customer){
                filters.push(search.createFilter({
                    name: 'internalid',
                    join: "customer",
                    operator: "anyof",
                    values: _params.custpage_customer.split(",")
                }))
            }

            if(!!_params.custpage_entitycategory){
                filters.push(search.createFilter({
                    name: 'custentity_scv_entity_category',
                    join: "customer",
                    operator: "anyof",
                    values: _params.custpage_entitycategory.split(",")
                }))
            }

            if(!!_params.custpage_fromdt){
                filters.push(search.createFilter({
                    name: 'trandate',
                    operator: "onorafter",
                    values: _params.custpage_fromdt
                }));
            }

            if(!!_params.custpage_todt){
                filters.push(search.createFilter({
                    name: 'trandate',
                    operator: "onorbefore",
                    values: _params.custpage_todt
                }));
            }

            if(_isFullData){
                return constSearchDCCNSS02.getDataSource(filters);
            }

            return constSearchDCCNSS02.getDataSourceFetchPage(filters, _params);
        }

        const getDataThanhToanSS03 = (_params, _isFullData = false) => {
            let filters = [];

            if(!!_params.custpage_subsidiary){
                filters.push(search.createFilter({
                    name: 'subsidiary',
                    operator: "anyof",
                    values: _params.custpage_subsidiary
                }))
            }

            if(!!_params.custpage_customer){
                filters.push(search.createFilter({
                    name: 'internalid',
                    join: "customer",
                    operator: "anyof",
                    values: _params.custpage_customer.split(",")
                }))
            }

            if(!!_params.custpage_entitycategory){
                filters.push(search.createFilter({
                    name: 'custentity_scv_entity_category',
                    join: "customer",
                    operator: "anyof",
                    values: _params.custpage_entitycategory.split(",")
                }))
            }

            if(!!_params.custpage_fromdt){
                filters.push(search.createFilter({
                    name: 'trandate',
                    operator: "onorafter",
                    values: _params.custpage_fromdt
                }));
            }

            if(!!_params.custpage_todt){
                filters.push(search.createFilter({
                    name: 'trandate',
                    operator: "onorbefore",
                    values: _params.custpage_todt
                }));
            }

            if(_isFullData){
                return constSearchDCCNSS03.getDataSource(filters);
            }

            return constSearchDCCNSS03.getDataSourceFetchPage(filters, _params);
        }

        const exportResultPdf = (_params) =>{
            let arrCustomer = getDataCustomer(_params, true);
            let arrSoDu = getDataSoDuSS01(_params, true);
            let arrXuatKho = getDataXuatKhoSS02(_params, true);
            let arrThanhToan = getDataThanhToanSS03(_params, true);
            
            commonRptDccn.setDataInput({arrCustomer, arrSoDu, arrXuatKho, arrThanhToan, params: _params});
            
            let arrResult = commonRptDccn.getDataSourceResult();
            
            let pdfFile = printPDF(_params, arrResult);
            
            return pdfFile;
        }

        const printPDF = (_params, _arrResult) => {
            let objResFirst = _arrResult[0];

            let company = record.load({type: "subsidiary", id: constSubsidiary.RECORDS.COMPANY.ID});

            let objNumFmt = constFormat.getNumberFormatter();

            let objSubsidiary = constSubsidiary.getInfoSubsidiaryById(_params.custpage_subsidiary)[0];
            let arrEntity = !!_params.custpage_customer ? constCustomer.getDataSource(search.createFilter({
                    name: 'internalid', 
                    operator: "anyof", 
                    values: _params.custpage_customer
                })) : [];

            let objEntity = arrEntity.length > 0 ? arrEntity[0] : {};

            let entityName = (objEntity?.companyname || objResFirst.entity_name || "").toUpperCase();

            let objResult = {
                subsidiary_display: (objSubsidiary.legalname||"").toUpperCase(),
                subsidiaryAddress: objSubsidiary.mainaddress_display,
                subsidiaryIFAddress: objSubsidiary.custrecord_scv_o2c_if_add?.split("\n")||[],
                subsidiaryPhone: objSubsidiary.custrecord_scv_sub_phone,
                subsidiaryEmail: objSubsidiary.email,
                subsidiaryWebsite: objSubsidiary.custrecord_scv_website,
                from_date: _params.custpage_fromdt,
                to_date: _params.custpage_todt,
                entity_display: entityName,
                owner_name: _params.custpage_owner || "",
                items: []
            };

            let arrResDetail = _arrResult.filter(e => e.lvl != 2 && e.lvl != 1);

            for(let i = 0; i < arrResDetail.length; i++){
                let objResItem = {...arrResDetail[i]};

                objResItem.addClassRow = "";

                if(!!objResItem?.rowPreparedData?.style?.fontWeight){
                    objResItem.addClassRow += "font-weight-bold ";
                }

                objResItem = constFormat.formatNumberWithObject(objResItem, 0, objNumFmt);

                objResult.items.push(objResItem);
            }

            let tmplRender = render.create();
            tmplRender.templateContent = file.load(`../xml/pdf/scv_pdf_rpt_dccn.xml`).getContents();
            
            commonPdf.addFontVietnamese(tmplRender);

            tmplRender.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: "jsonData",
                data: objResult
            });

            tmplRender.addRecord('company', company);
            
            let filePrint = tmplRender.renderAsPdf();

            filePrint.name = "Bảng kê chi tiết và đối chiếu công nợ_" + entityName + ".pdf"

            return filePrint;
        }

        const getDataFilePDF = (_params) =>{
            let arrResult = JSON.parse(_params.data);

            let filePrint = printPDF(_params, arrResult);

            return {name: filePrint.name, contents_base64: filePrint.getContents()};
        }

        return {onRequest}

    });
