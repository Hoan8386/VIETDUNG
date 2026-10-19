/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define([
    'N/search', 'N/file', 'N/ui/serverWidget', 'N/runtime', 'N/query',
    '../lib/scv_lib_function.js',
    '../lib/scv_lib_report.js',
    '../lib/scv_lib_common_html.js',
    '../cons/scv_cons_color.js',
    '../cons/scv_cons_subsidiary.js',
    '../cons/scv_cons_search.js',
    '../cons/scv_cons_search_item_demand_mfg_trans.js',
    '../cons/scv_cons_search_item_demand_mfg_bom.js',
    '../cons/scv_cons_search_item_demand_mfg_bom_rev.js'
],
    (
        search, file, serverWidget, runtime, query,
        lbf, libRpt, libHtml,
        constColor,
        constSubsidiary,
        constSearch,
        searchItemDemandTrans,
        searchItemDemandBom,
        searchItemDemandBomRev,
    ) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const CurScript = {
            ID: "customscript_scv_sl_material_demand_rpt",
            DEPLOY_UI: "customdeploy_scv_sl_material_demand_rpt",
            DEPLOY_DATA: "customdeploy_scv_sl_mat_demand_rpt_data",
        };
        
        const onRequest = (scriptContext) => {
            let request = scriptContext.request;
            let response = scriptContext.response;

            let scriptId = runtime.getCurrentScript().deploymentId;
            if(scriptId === CurScript.DEPLOY_DATA) {
                onRequestDeploymentData(request, response);
            } else {
                onRequestDeploymentUI(request, response);
            }
        }

        const onRequestDeploymentData = (request, response) => {
            if(request.method == "GET") {       
                let params = request.parameters;        
                let objResponse = {
                    isSuccess: true, message: "Success!", 
                    data: runFilterSS(params)
                };

                response.setHeader({ name: 'Content-Type', value: 'application/json' });
                response.write(JSON.stringify(objResponse));
            }
        }

        const onRequestDeploymentUI = (request, response) => {
            if(request.method == "GET") {
                let params = request.parameters;
                let MainForm = onCreateFormUI(params);

                let arrCtDinhMuc = [], arrNCVT = [];
                if(params.isrun == "T"){
                    let objResult = runFilterSS(params);
                    arrNCVT = objResult.arrNCVT;
                    arrCtDinhMuc = objResult.arrCtDinhMuc;
                }
                
                onRenderData(MainForm.form, arrNCVT, arrCtDinhMuc);
                response.writePage(MainForm.form);
            }
        }

        const runFilterSS = (params) => {
            // get data
            // ss01
            let arrItemDemand = getDataSSItemDemandTrans(params);
            // ss02
            let arrItemId = groupDataByFieldId(arrItemDemand, "item_id");
            let arrBom = getDataSSItemDemandBom(arrItemId, params);

            for(let i = 0; i < arrItemDemand.length; i++) {
                let obj_find_bom = arrBom.find(e => e.item_id == arrItemDemand[i].item_id) || {};
                arrItemDemand[i].bom_id = obj_find_bom.internalid;
            }
            // ss03
            let arrBomId = groupDataByFieldId(arrItemDemand, "bom_id");
            let arrBomRevision = getDataSSItemDemandBomRev(arrBomId);
            // hanlde data chi tiet dinh muc
            let objResult = {};
            let arrCtDinhMuc = [], arrNCVT = [];
            
            // arrItemDemand = arrItemDemand.filter(e => e.item_id === "9136");
            for(let objItemDemand of arrItemDemand) {
                let arrFilterBomRev = arrBomRevision.filter(e => e.bom_id == objItemDemand.bom_id);
                for(let objBomRev of arrFilterBomRev) {
                    let objCTDM = {
                        level: 1,
                        item_id: objItemDemand.item_id,
                        item_nm: objItemDemand.item_nm,
                        unit: objItemDemand.unit,
                        plan_qty: objItemDemand.plan_qty,
                        component_item_id: objBomRev.component_item_id,
                        component_code: objBomRev.component_code,
                        component_name: objBomRev.component_name,
                        component_unit: objBomRev.component_unit,
                        component_qty: objBomRev.component_qty,
                        use_std_bom_qty: objBomRev.use_std_bom_qty ? "Yes" : "No",
                        revision_name: objBomRev.name,
                        bill_material_nm: objBomRev.bill_material_nm,
                        isParentComponent: objBomRev.item_type === "Assembly" && objBomRev.item_source_type === 1
                    };

                    objCTDM.bom_qty = objCTDM.plan_qty * objCTDM.component_qty;
                    arrCtDinhMuc.push(objCTDM);
                }
            }
            // TODO: update 20/05/2025
            arrCtDinhMuc = handleDataParentComponent(arrCtDinhMuc, params);
            // hanlde data nhu cau vat tu
            let arrGrpCTDM = lbf.onGroupByArray(arrCtDinhMuc, ["component_item_id"]);
            for(let i = 0; i < arrGrpCTDM.length; i++) {
                let arrFilterCTDM = arrCtDinhMuc.filter(e => e.component_item_id === arrGrpCTDM[i].component_item_id);
                let totalBomQty = arrFilterCTDM.reduce((a, b) => a + b.bom_qty, 0);
                let objNCVT = {
                    stt: i + 1,
                    component_item_id: arrGrpCTDM[i].component_item_id,
                    component_code: arrFilterCTDM[0].component_code,
                    component_name: arrFilterCTDM[0].component_name,
                    component_unit: arrFilterCTDM[0].component_unit,
                    group_lv1_display: arrFilterCTDM[0].group_lv1_display,
                    group_lv2_display: arrFilterCTDM[0].group_lv2_display,
                    group_lv3_display: arrFilterCTDM[0].group_lv3_display,
                    group_lv4_display: arrFilterCTDM[0].group_lv4_display,
                    bom_qty: totalBomQty
                };
                arrNCVT.push(objNCVT);
            }

            // return data
            objResult.arrNCVT = arrNCVT;
            objResult.arrCtDinhMuc = arrCtDinhMuc;
            return objResult;
        }

        const handleDataParentComponent = (arrCtDinhMuc, params) => {
            let arrParentComponent = arrCtDinhMuc.filter(e => e.isParentComponent);
            let arrItemId = groupDataByFieldId(arrParentComponent, "component_item_id");
            let arrBom = getDataSSItemDemandBom(arrItemId, params);

            let arrBomId = groupDataByFieldId(arrBom, "internalid");
            let arrBomRevision = getDataSSItemDemandBomRev(arrBomId);
            
            for(let i = 0; i < arrBomRevision.length; i++) {
                let obj_find_bom = arrBom.find(e => e.internalid == arrBomRevision[i].bom_id) || {};
                arrBomRevision[i].bom_item_id = obj_find_bom.item_id;
                arrBomRevision[i].bom_item_nm = obj_find_bom.item_nm;
            }

            let arrCompItemId = groupDataByFieldId(arrBomRevision, "component_item_id");
            let arrItemGroupLevel = getDataItemGroupLevel(arrItemId, arrCompItemId);
            // result
            let arrResult = [];
            let count = 0;
            arrCtDinhMuc.forEach(item => {
                count++;
                let objItemGrpLevel = arrItemGroupLevel.find(e => e.id == item.component_item_id) || {};
                arrResult.push({ 
                    ...item, stt: count,
                    group_lv1: objItemGrpLevel.custitem_scv_group_lv1 || "",
                    group_lv1_display: objItemGrpLevel.custitem_scv_group_lv1_display || "",
                    group_lv2: objItemGrpLevel.custitem_scv_group_lv2 || "",
                    group_lv2_display: objItemGrpLevel.custitem_scv_group_lv2_display || "",
                    group_lv3: objItemGrpLevel.custitem_scv_group_lv3 || "",
                    group_lv3_display: objItemGrpLevel.custitem_scv_group_lv3_display || "",
                    group_lv4: objItemGrpLevel.custitem_scv_group_lv4 || "",
                    group_lv4_display: objItemGrpLevel.custitem_scv_group_lv4_display || "",
                });
                if(item.isParentComponent) {
                    let arrFilterBomRev = arrBomRevision.filter(e => e.bom_item_id == item.component_item_id);
                    let arrChildren = [];

                    for(let objBomRev of arrFilterBomRev) {
                        count++;
                        let objItemGrpLevel = arrItemGroupLevel.find(e => e.id == objBomRev.component_item_id) || {};
                        let objChildren = {
                            stt: count,
                            level: "children",
                            item_id: objBomRev.bom_item_id,
                            item_nm: objBomRev.bom_item_nm,
                            unit: item.component_unit,
                            plan_qty: item.bom_qty,
                            component_item_id: objBomRev.component_item_id,
                            component_code: objBomRev.component_code,
                            component_name: objBomRev.component_name,
                            component_unit: objBomRev.component_unit,
                            component_qty: objBomRev.component_qty,
                            use_std_bom_qty: objBomRev.use_std_bom_qty ? "Yes" : "No",
                            revision_name: objBomRev.name,
                            bill_material_nm: objBomRev.bill_material_nm,
                            isParentComponent: false,
                            group_lv1: objItemGrpLevel.custitem_scv_group_lv1 || "",
                            group_lv1_display: objItemGrpLevel.custitem_scv_group_lv1_display || "",
                            group_lv2: objItemGrpLevel.custitem_scv_group_lv2 || "",
                            group_lv2_display: objItemGrpLevel.custitem_scv_group_lv2_display || "",
                            group_lv3: objItemGrpLevel.custitem_scv_group_lv3 || "",
                            group_lv3_display: objItemGrpLevel.custitem_scv_group_lv3_display || "",
                            group_lv4: objItemGrpLevel.custitem_scv_group_lv4 || "",
                            group_lv4_display: objItemGrpLevel.custitem_scv_group_lv4_display || "",
                        };
                        
                        objChildren.bom_qty = objChildren.plan_qty * objChildren.component_qty;
                        arrChildren.push(objChildren);
                    }
                    arrResult.push(...arrChildren);
                }
            });
            return arrResult;
        }

        const getDataItemGroupLevel = (arrItemId, arrCompItemId) => {
            let arrInternalId = [...arrItemId, ...arrCompItemId];
            if(arrInternalId.length === 0) return [];

            let resultQuery = query.runSuiteQL({
                query: `SELECT id, upccode, 
                    custitem_scv_group_lv1, 
                    custitem_scv_group_lv2, 
                    custitem_scv_group_lv3, 
                    custitem_scv_group_lv4,
                    BUILTIN.DF(custitem_scv_group_lv1) as custitem_scv_group_lv1_display,
                    BUILTIN.DF(custitem_scv_group_lv2) as custitem_scv_group_lv2_display,
                    BUILTIN.DF(custitem_scv_group_lv3) as custitem_scv_group_lv3_display,
                    BUILTIN.DF(custitem_scv_group_lv4) as custitem_scv_group_lv4_display,
                FROM item
                WHERE itemtype IN ('InvtPart', 'Assembly') AND isinactive = 'F'
                    AND id IN (${arrInternalId.join(", ")})`
            }).asMappedResults();

            return resultQuery;
        }

        const getDataSSItemDemandBomRev = (arrBomId) => {
            if(arrBomId.length === 0) return [];

            let objFilter = search.createFilter({
                name: "billofmaterials", operator: "anyof", values: arrBomId
            });

            let data = searchItemDemandBomRev.getDataSource(objFilter);
            return data;
        }
        
        const getDataSSItemDemandBom = (arrItemId, params) => {
            if(arrItemId.length === 0) return [];
            let myFilters = [
                search.createFilter({
                    name: "assembly", join: "assemblyItem",
                    operator: "anyof",
                    values: arrItemId
                })
            ];
            if(!!params.custpage_subsidiary) {
                myFilters.push(search.createFilter({
                    name: 'subsidiary',
                    operator: "anyof",
                    values: params.custpage_subsidiary
                }));
            }

            let data = searchItemDemandBom.getDataSource(myFilters);
            return data;
        }

        const getDataSSItemDemandTrans = (params) => {
            let myFilters = [];
            if(!!params.custpage_subsidiary) {
                myFilters.push(search.createFilter({
                    name: 'subsidiary',
                    operator: "anyof",
                    values: params.custpage_subsidiary
                }));
            }
            if(!!params.custpage_mfg_plan) {
                myFilters.push(search.createFilter({
                    name: 'internalid',
                    operator: "anyof",
                    values: params.custpage_mfg_plan
                }));
            }

            let data = searchItemDemandTrans.getDataSource(myFilters);
            return data;
        }

        const onRenderData = (form, arrNCVT, arrCtDinhMuc) => {
            let arrTab = onCreateDxGrid(arrNCVT, arrCtDinhMuc);
            libHtml.renderDxGridWithTab(form, arrTab);
        }
        const onCreateDxGrid = (arrNCVT, arrCtDinhMuc) => {
            let moreOption = {
                exportExcelEnable: false,
                columnChooser: false,
                pageSize: 1000
            };

            let optionGrid = {
                columns: [
                    { dataField: 'stt', caption: "STT", dataType: 'number'},
                    { dataField: 'component_code', caption: "Mã vật tư", dataType: 'string'},
                    { dataField: 'component_name', caption: "Tên vật tư", dataType: 'string'},
                    { dataField: 'component_unit', caption: "ĐVT", dataType: 'string'},
                    { dataField: 'bom_qty', caption: "Tổng lượng nhu cầu", dataType: 'number', format: "###,###,##0.##"},
                    { dataField: 'group_lv1_display', caption: "Nhóm cấp 1", dataType: 'string' },
                    { dataField: 'group_lv2_display', caption: "Nhóm cấp 2", dataType: 'string' },
                    { dataField: 'group_lv3_display', caption: "Nhóm cấp 3", dataType: 'string' },
                    { dataField: 'group_lv4_display', caption: "Nhóm cấp 4", dataType: 'string' },
                ],
                ...moreOption
            };
            let optionGrid2 = {
                columns: [
                    { dataField: 'stt', caption: "STT", dataType: 'number'},
                    { dataField: 'item_nm', caption: "Thành phẩm", dataType: 'string' },
                    { dataField: 'unit', caption: "ĐVT", dataType: 'string' },
                    { dataField: 'plan_qty', caption: "Số lượng KHSX", dataType: 'number', format: "###,###,##0.##"},
                    { dataField: 'component_code', caption: "Mã vật tư", dataType: 'string'},
                    { dataField: 'component_name', caption: "Tên vật tư", dataType: 'string'},
                    { dataField: 'component_unit', caption: "ĐVT", dataType: 'string' },
                    { dataField: 'bom_qty', caption: "Nhu cầu theo BOM", dataType: 'number', format: "###,###,##0.##"},
                    { 
                        dataField: 'component_qty', caption: "Định mức (BOM)", dataType: 'number',
                        format: { type: "fixedPoint", precision: 3 },
                    },
                    { dataField: 'use_std_bom_qty', caption: "Use Std B.O.M Qty", dataType: 'string' },
                    { dataField: 'revision_name', caption: "BOM", dataType: 'string' },
                    { dataField: 'bill_material_nm', caption: "Phiên bản BOM", dataType: 'string' },
                    { dataField: 'group_lv1_display', caption: "Nhóm cấp 1", dataType: 'string' },
                    { dataField: 'group_lv2_display', caption: "Nhóm cấp 2", dataType: 'string' },
                    { dataField: 'group_lv3_display', caption: "Nhóm cấp 3", dataType: 'string' },
                    { dataField: 'group_lv4_display', caption: "Nhóm cấp 4", dataType: 'string' },
                ],
                ...moreOption,
                highlightRow: {
                    // 1: { background: constColor.TEAL[400], fontWeight: "bold" },
                    "children": { background: constColor.TEAL[200] }
                }
            };
            let arrTab = [
                {
                    id: 0,
                    text: 'Tổng nhu cầu vật tư',
                    optionGrid: optionGrid,
                    data: arrNCVT
                },
                {
                    id: 1,
                    text: 'Chi tiết định mức',
                    optionGrid: optionGrid2,
                    data: arrCtDinhMuc
                },
            ];
            return arrTab;
        }

        const onCreateFormUI = (params) => {
            let mainForm = serverWidget.createForm({title: "Báo cáo nhu cầu vật tư theo kế hoạch sản xuất"});
            mainForm.clientScriptModulePath = '../cssl/scv_cs_sl_material_demand.js';
            let filterGrp = addFieldGroup(mainForm, "fieldgrp_main", "Filters");
            // add button
            mainForm.addButton({
                id: "custpage_btn_search",
                label: "Search",
                functionName: "onSearchResult()"
            });
             mainForm.addButton({
                id: "custpage_btn_export",
                label: "Export",
                functionName: "onExport()"
            });

            // add custom library
            lbf.pinHeaderSublist(mainForm);
            libRpt.addPageLinkForm(mainForm, [
                searchItemDemandTrans.ID,
                searchItemDemandBom.ID,
                searchItemDemandBomRev.ID,
            ]);
            // add field
            let custpage_subsidiary = mainForm.addField({
                id: "custpage_subsidiary",
                type: serverWidget.FieldType.SELECT,
                label: "Công ty",
                container: filterGrp.id
            });
            let custpage_mfg_plan = mainForm.addField({
                id: "custpage_mfg_plan",
                type: serverWidget.FieldType.SELECT,
                label: "Số kế hoạch",
                // source: "custompurchase_scv_mfg_plan",
                container: filterGrp.id
            });

            let custpage_url_file_exp = mainForm.addField({
                id: "custpage_url_file_exp",
                type: serverWidget.FieldType.TEXT,
                label: "File Export",
                container: filterGrp.id
            });
           
            // defaultGrp
            custpage_subsidiary.isMandatory = true;
            custpage_mfg_plan.isMandatory = true;
            custpage_subsidiary.setHelpText({ help: "Subsidiary" });
            custpage_url_file_exp.updateDisplayType({displayType: 'hidden'});

            custpage_url_file_exp.defaultValue = getUrlFile('../xls/scv_material_demand_rpt.xlsx');
            constSubsidiary.initLoadFieldSubsidiaryByUserRole(custpage_subsidiary);
            if(!!params.custpage_subsidiary) {
                custpage_subsidiary.defaultValue = params.custpage_subsidiary;
            }
            loadFieldDataMfgPlan(custpage_mfg_plan, custpage_subsidiary.defaultValue);
            if(!!params.custpage_mfg_plan) {
                custpage_mfg_plan.defaultValue = params.custpage_mfg_plan;
            }

            return { form: mainForm };
        }

        const getUrlFile = (_fileId) => {
            return file.load({id: _fileId}).url;
        }

        const loadFieldDataMfgPlan = (mfgPlanField, subsidiaryId) => {
            if(!subsidiaryId) return;
            let resultSearch = constSearch.createSearchWithFilter({
                type: "custompurchase_scv_mfg_plan",
                filters: [
                    ["subsidiary", "anyof", subsidiaryId],
                    "AND", ["mainline","is","T"],
                    "AND", ["taxline","is","F"]
                ],
                columns: [ "internalid", "tranid"]
            }, []);

            arrResult = constSearch.fetchResultSearchRunEach(resultSearch, function(_objTmpl, _column){
                let objRes = constSearch.getObjResultFromSearchByKey(_objTmpl, _column, [
                    "internalid", "tranid",
                ]);
                return objRes;
            });

            mfgPlanField.addSelectOption({ value: "", text: "" });
            for(let obj of arrResult) {
                mfgPlanField.addSelectOption({
                    value: obj.internalid, 
                    text: obj.tranid
                });
            }
        }

        const groupDataByFieldId = (data, field) => {
            let objGroup = {};
            for(let i = 0; i < data.length; i++) {
                let fieldValue = data[i][field];
                if(objGroup[fieldValue] === undefined && !!fieldValue) {
                    objGroup[fieldValue] = fieldValue;
                }
            }
            return Object.values(objGroup);
        }

        function addFieldGroup(_form, _id, _label){
            let _obj = {id: _id, label: _label}
            _form.addFieldGroup(_obj);
            return _obj;
        }

        return {onRequest}

    });
