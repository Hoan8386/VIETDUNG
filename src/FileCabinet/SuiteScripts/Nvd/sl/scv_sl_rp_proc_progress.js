/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  30 May 2025         Khanh Tran			    Init, create file. Báo cáo tiến độ thực hiện mua hàng theo NCC, form mr.Hải(https://app.clickup.com/t/86cz3p99e)
 */
/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/runtime', 'N/search',

   '../lib/scv_lib_common_html.js',

    '../cons/scv_cons_form.js',

    '../cons/scv_cons_search_pr_progress_by_ven.js',
    '../cons/scv_cons_search_po_progress_by_ven.js',
    '../cons/scv_cons_search_inb_progress_by_ven.js',
    '../cons/scv_cons_search_itr_progress_by_ven.js',
],
    
    (runtime, search,
        libHtml,

        constForm,
        
        cSearchPr,
        cSearchPo,
        cSearchInb,
        cSearchItr,
    ) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const cur_script = {
            ID: 'customscript_scv_sl_rp_proc_progress',
            DEPLOYID_UI: 'customdeploy_scv_sl_rp_proc_progress',
            DEPLOYID_DATA: 'customdeploy_scv_sl_rp_proc_progress_dt'
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
                    case 'getDataPr':
                        objResponse.data = getDataPr(params);
                        break;
                    case 'getDataPo':
                        objResponse.data = getDataPo(params);
                        break;
                    case 'getDataInb':
                        objResponse.data = getDataInb(params);
                        break;
                    case 'getDataItr':
                        objResponse.data = getDataItr(params);
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

        const getDataPr = (params) => {
            let myFilters = [];
            if(params.custpage_subsidiary){
                myFilters.push(
                    search.createFilter({name: 'subsidiary', operator: 'anyof', values: params.custpage_subsidiary})
                )
            }

            return cSearchPr.getDataSourceFetchPage(myFilters, params);
        }

        const getDataPo = (params) => {
            let myFilters = [];
            if(params.custpage_subsidiary){
                myFilters.push(
                    search.createFilter({name: 'subsidiary', operator: 'anyof', values: params.custpage_subsidiary})
                )
            }

            if(params.custpage_vendor){
                myFilters.push(
                    search.createFilter({name: 'entity', operator: 'anyof', values: params.custpage_vendor.split(',')})
                )
            }

            if(params.custpage_from){
                myFilters.push(
                    search.createFilter({name: 'trandate', operator: 'onorafter', values: params.custpage_from})
                )
            }

            if(params.custpage_todt){
                myFilters.push(
                    search.createFilter({name: 'trandate', operator: 'onorbefore', values: params.custpage_todt})
                )
            }

            return cSearchPo.getDataSourceFetchPage(myFilters, params);
        }

        const getDataInb = (params) => {
            let myFilters = [];
            if(params.custpage_subsidiary){
                myFilters.push(
                    search.createFilter({name: 'subsidiary',  join: "purchaseOrder", operator: 'anyof', values: params.custpage_subsidiary})
                )
            }

            if(params.custpage_vendor){
                myFilters.push(
                    search.createFilter({name: 'vendor', operator: 'anyof', values: params.custpage_vendor.split(',')})
                )
            }

            return cSearchInb.getDataSourceFetchPage(myFilters, params);
        }

        const getDataItr = (params) => {
            let myFilters = [];
            if(params.custpage_subsidiary){
                myFilters.push(
                    search.createFilter({name: 'subsidiary', operator: 'anyof', values: params.custpage_subsidiary})
                )
            }

            if(params.custpage_vendor){
                myFilters.push(
                    search.createFilter({name: 'entity', operator: 'anyof', values: params.custpage_vendor.split(',')})
                )
            }

            return cSearchItr.getDataSourceFetchPage(myFilters, params);
        }

        const onCreateFormUI = (params) => {
            constForm.createForm("BÁO CÁO TIẾN ĐỘ MUA HÀNG", "../cssl/scv_cs_sl_rp_proc_progress.js");
            constForm.addPageLink([cSearchPr.ID, cSearchPo.ID, cSearchInb.ID, cSearchItr.ID]);
            constForm.addButton({id: "custpage_btn_search", label: "Search", functionName: "onSearchResult()"});
            constForm.addButton({id: "custpage_btn_export", label: "Export", functionName: "onSearchResult('T')"});
            let mainGrp = constForm.addFieldGroup({id: "fieldgrp_main", label: "Thông tin tìm kiếm"});

            constForm.addField({
                id: 'custpage_subsidiary', label: 'Công ty', container: mainGrp.id,
                type: "select", source: "subsidiary"
            }, false, {
                // defaultValue: 5//params.custpage_subsidiary
            });
            
            constForm.addField({
                id: 'custpage_fromdt', label: 'Từ ngày', type: "date", container: mainGrp.id
            }, false, {
                layoutType: "startrow",
                defaultValue: params.custpage_fromdt
            });

            constForm.addField({
                id: 'custpage_todt', label: 'Đến ngày', type: "date", container: mainGrp.id
            }, false, {
                layoutType: "endrow",
                defaultValue: params.custpage_todt
            });

            constForm.addField({
                id: 'custpage_vendor', label: 'Nhà cung cấp', container: mainGrp.id,
                type: "multiselect", source: "vendor"
            }, false, {
                // defaultValue: 3276
            }); 

            let custpage_style_grid = constForm.addField({
                id: 'custpage_style_grid', label: 'Style grid', container: mainGrp.id,
                type: "inlinehtml", 
            }); 

            custpage_style_grid.defaultValue = `<style>
                .dx-treelist .dx-header-row > td {
                    vertical-align: middle !important;
                }
            </style>`;
            
            constForm.addTab({
                id: 'tab_result',
                label: 'Kết quả'
            })
            constForm.addGridDx({
                id: "custpage_sl_result",
                type: "treegrid",
                tab: "tab_result",
                label: "Kết quả",
                columns: [
                    {dataField: "pr_no", caption: "Số YCMH", dataType: "string", width: 200},
                    {dataField: "pr_date", caption: "Ngày YCMH", dataType: "string", width: 100},
                    {dataField: "so_don_hang", caption: "Số đơn hàng", dataType: "string", width: 150},
                    {dataField: "ngay_don_hang", caption: "Ngày đơn hàng", dataType: "string", width: 100},
                    {dataField: "upccode", caption: "Mã vật tư", dataType: "string", width: 150},
                    {dataField: "item_display", caption: "Tên hàng", dataType: "string", width: 200},
                    {dataField: "mtcthh", caption: "Mô tả chi tiết hàng hóa", dataType: "string", width: 150},
                    {
                        caption: "Theo đơn hàng",
                        columns: [
                            {dataField: "unit", caption: "Đơn vị tính", dataType: "string", width: 70},
                            {dataField: "qty_mua_hang", caption: "SL mua hàng", dataType: "number", format: "#,##0", width: 100},
                            {dataField: "dung_sai_pos", caption: "Dung sai cho phép (+%)", dataType: "percent", format: "#0%", alignment: "right", width: 100},
                            {dataField: "dung_sai_neg", caption: "Dung sai âm cho phép (-%)", dataType: "percent", format: "#0%", alignment: "right", width: 100},
                            {dataField: "rate", caption: "Đơn giá", dataType: "number", format: "#,##0", width: 100},
                            {dataField: "amt", caption: "Thành tiền", dataType: "number", format: "#,##0", width: 130},
                            {dataField: "ngay_giao_hang", caption: "Ngày giao hàng dự kiến", dataType: "string", width: 100},
                        ]
                    },
                    {
                        caption: "Thực tế giao hàng",
                        columns: [
                            {
                                caption: "Inbound Shipment",
                                columns: [
                                    {dataField: "inb_no", caption: "Số inbound", dataType: "string", width: 100},
                                    {dataField: "qty_inb", caption: "Số lượng inbound", dataType: "number", format: "#,##0", width: 100},
                                ]
                            },  {
                                caption: "Nhập kho",
                                columns: [
                                    {dataField: "itr_no", caption: "Số nhập kho", dataType: "string", width: 100},
                                    {dataField: "qty_itr", caption: "Số lượng nhập kho", dataType: "number", format: "#,##0", width: 100},
                                ]
                            }
                        ]
                    },
                    {dataField: "tsgtt", caption: "Tổng số lượng giao thực tế", dataType: "number", format: "#,##0", width: 100},
                    {dataField: "slclcg", caption: "SL còn lại chưa giao", dataType: "number", format: "#,##0", width: 100},
                    {dataField: "dung_sai_thuc_te", caption: "Dung sai thực tế", dataType: "percent", format: "#0%", alignment: "right", width: 100},
                    {dataField: "ngay_hang_ve", caption: "Ngày hàng về nhà máy", dataType: "string", width: 100},
                ],
            });
        }

        return {onRequest}

    });
