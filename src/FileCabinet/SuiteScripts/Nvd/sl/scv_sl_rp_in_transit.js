/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  28 May 2025         Khanh Tran			    Init, create file. Báo cáo hàng đi đường, form mr.Phúc(https://app.clickup.com/t/86cz2cxnu)
 */
/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/runtime', 'N/search',
    '../cons/scv_cons_form.js',
    '../cons/scv_cons_entity_category_type.js',
    '../cons/scv_cons_entity_category.js',

    '../cons/scv_cons_search_hdd_po_qty.js',
    '../cons/scv_cons_search_hdd_ir_qty.js',
    '../cons/scv_cons_search_hdd_vendor_list.js',
],
    
    (runtime, search,
        constForm,
        constEntCatType,
        constEntCategory,

        cSearchPoQty,
        cSearchIrQty,
        cSearchVendorList,
    ) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const cur_script = {
            ID: 'customscript_scv_sl_rp_in_transit',
            DEPLOYID_UI: 'customdeploy_scv_sl_rp_in_transit',
            DEPLOYID_DATA: 'customdeploy_scv_sl_rp_in_transit_data'
        }

        const onRequest = (scriptContext) => {
            constForm.setContext(scriptContext);
            constForm.setServiceScript(cur_script.ID, cur_script.DEPLOYID_DATA);
            let request = scriptContext.request;
            let params = request.parameters;
            let curScript = runtime.getCurrentScript();
            if(curScript.deploymentId == cur_script.DEPLOYID_DATA) {
                let objResponse = {data: []};

                switch(params.action){
                    case 'getDataPoQty':
                        objResponse.data = getDataPoQty(params);
                        break;
                    case 'getDataIrQty':
                        objResponse.data = getDataIrQty(params);
                        break;
				}

                constForm.write(objResponse);
            }
            else{
                if(request.method == "GET"){
                    onCreateFormUI(params);
                    constForm.writePage();
                }
            }
        }

        const getDataIrQty = (params) => {
            let myFilters = [];
            if(params.custpage_subsidiary){
                myFilters.push(
                    search.createFilter({name: 'subsidiary', operator: 'anyof', values: params.custpage_subsidiary})
                )
            }

            if(params.custpage_fromdt_nk){
                myFilters.push(
                    search.createFilter({name: 'trandate', operator: 'onorafter', values: params.custpage_fromdt_nk})
                )
            }

            if(params.custpage_todt_nk){
                myFilters.push(
                    search.createFilter({name: 'trandate', operator: 'onorbefore', values: params.custpage_todt_nk})
                )
            }

            return cSearchIrQty.getDataSourceFetchPage(myFilters, params);
        }

        const getDataPoQty = (params) => {
            let myFilters = [];
            if(params.custpage_subsidiary){
                myFilters.push(
                    search.createFilter({name: 'subsidiary', operator: 'anyof', values: params.custpage_subsidiary})
                )
            }

            if(params.custpage_fromdt_dh){
                myFilters.push(
                    search.createFilter({name: 'trandate', operator: 'onorafter', values: params.custpage_fromdt_dh})
                )
            }

            if(params.custpage_todt_dh){
                myFilters.push(
                    search.createFilter({name: 'trandate', operator: 'onorbefore', values: params.custpage_todt_dh})
                )
            }

            if(params.custpage_kenh_mua_hang){
                myFilters.push(
                    search.createFilter({name: 'cseg_scv_pc', operator: 'anyof', values: params.custpage_kenh_mua_hang})
                )
            }

            if(params.custpage_ncc){
                myFilters.push(
                    search.createFilter({name: 'entity', operator: 'anyof', values: params.custpage_ncc.split(',')})
                )
            }

            return cSearchPoQty.getDataSourceFetchPage(myFilters, params);
        }

        const onCreateFormUI = (params) => {
            defaultParams(params);
            constForm.createForm("BÁO CÁO HÀNG ĐI ĐƯỜNG", "../cssl/scv_cs_sl_rp_in_transit.js");
            constForm.addPageLink([cSearchPoQty.ID, cSearchIrQty.ID, cSearchVendorList.ID]);
            constForm.addButton({id: "custpage_btn_search", label: "Search", functionName: "onSearchResult()"});
            constForm.addButton({id: "custpage_btn_export", label: "Export", functionName: "onSearchResult('T')"});
            let mainGrp = constForm.addFieldGroup({id: "fieldgrp_main", label: "Thông tin tìm kiếm"});

            constForm.addField({
                id: 'custpage_subsidiary', label: 'Công ty', container: mainGrp.id,
                type: "select", source: "subsidiary"
            }, true, {
                defaultValue: params.custpage_subsidiary
            });
            
            constForm.addField({
                id: 'custpage_fromdt_dh', label: 'Đơn hàng từ ngày', type: "date", container: mainGrp.id
            }, true, {
                layoutType: "startrow",
                defaultValue: params.custpage_fromdt_dh
            });

            constForm.addField({
                id: 'custpage_todt_dh', label: 'Đơn hàng đến ngày', type: "date", container: mainGrp.id
            }, true, {
                layoutType: "endrow",
                defaultValue: params.custpage_todt_dh
            });

            constForm.addField({
                id: 'custpage_fromdt_nk', label: 'Nhập kho từ ngày', type: "date", container: mainGrp.id
            }, true, {
                layoutType: "startrow",
                defaultValue: params.custpage_fromdt_nk
            });

            constForm.addField({
                id: 'custpage_todt_nk', label: 'Nhập kho đến ngày', type: "date", container: mainGrp.id
            }, true, {
                layoutType: "endrow",
                defaultValue: params.custpage_todt_nk
            });
            
            constForm.addField({
                id: 'custpage_kenh_mua_hang', label: 'Kênh mua hàng', container: mainGrp.id,
                type: "select", source: "customrecord_cseg_scv_pc"
            });

            constForm.addField({
                id: 'custpage_phan_loai_ncc', label: 'Phân loại NCC', container: mainGrp.id,
                type: "select",
            }, false, {
                lookup: {
                    data: constEntCategory.getDataEntityCategoryWithType(constEntCatType.RECORDS.VENDOR.ID),
                    valueExpr: "internalid",
                    displayExpr: "name"
                }
            });
            
            constForm.addField({
                id: 'custpage_skip_transit_zero', label: 'Không tính hàng đi đường bằng 0', container: mainGrp.id,
                type: "checkbox"
            });
            
            constForm.addField({
                id: 'custpage_ncc', label: 'Nhà cung cấp', container: mainGrp.id,
                type: "multiselect", 
            }, false, {
                lookup: {
                    data: cSearchVendorList.getDataSource([]),
                    valueExpr: "vendor_id",
                    displayExpr: "name"
                }
            });

            constForm.addTab({
                id: 'tab_result',
                label: 'Kết quả'
            })
            constForm.addGridDx({
                id: "custpage_sl_result",
                type: "grid",
                tab: "tab_result",
                label: "Kết quả",
                columns: [
                    {dataField: "po_no", caption: "Số PO", dataType: "string", width: 150},
                    {dataField: "date", caption: "Ngày", dataType: "string", width: 100},
                    {dataField: "ma_hang", caption: "Mã hàng", dataType: "string", width: 100},
                    {dataField: "ten_hang", caption: "Tên hàng", dataType: "string", width: 200},
                    {dataField: "dvt_goc", caption: "Đơn vị tính gốc", dataType: "string", width: 100},
                    {dataField: "qty_mua", caption: "Số lượng mua", dataType: "number", format: "#,##0", width: 100},
                    {dataField: "qty_da_nhap_kho", caption: "Số lượng đã nhập kho", dataType: "number", format: "#,##0", width: 100},
                    {dataField: "qty_con_lai_po", caption: "Số lượng còn lại trên PO", dataType: "number", format: "#,##0", width: 100},
                    {dataField: "qty_hang_di_duong", caption: "Số lượng hàng đi đường", dataType: "number", format: "#,##0", width: 100},
                    {dataField: "dung_sai_am_cp", caption: "Dung sai âm cho phép (%)", dataType: "percent", format: "#0%", alignment: "right", width: 100},
                    {dataField: "qty_chenh_lech_cp", caption: "Số lượng chênh lệch cho phép", dataType: "number", format: "#,##0", width: 100},
                    {dataField: "ma_ncc", caption: "Mã NCC", dataType: "string", width: 150},
                    {dataField: "ten_ncc", caption: "Tên NCC", dataType: "string", width: 200},
                    {dataField: "ycmh_no", caption: "Số yêu cầu mua hàng", dataType: "string", width: 150},
                    {dataField: "ngay_ycmh", caption: "Ngày yêu cầu mua hàng", dataType: "string", width: 100},
                ],
            });
        }

        const defaultParams = (params) => {
            let curUser = runtime.getCurrentUser();
            let today = new Date();
            if(!('custpage_subsidiary' in params)) params.custpage_subsidiary = curUser.subsidiary.toString();
            if(!('custpage_fromdt_dh' in params)) params.custpage_fromdt_dh = new Date(today.getFullYear(), today.getMonth(), 1);
            if(!('custpage_todt_dh' in params)) params.custpage_todt_dh = today;
            if(!('custpage_fromdt_nk' in params)) params.custpage_fromdt_nk = new Date(today.getFullYear(), today.getMonth(), 1);
            if(!('custpage_todt_nk' in params)) params.custpage_todt_nk = today;
        } 

        return {onRequest}

    });
