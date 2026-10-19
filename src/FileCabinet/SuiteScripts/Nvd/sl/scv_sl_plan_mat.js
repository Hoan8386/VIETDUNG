/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  10 Dec 2024         Huy Pham			    Init, create file, Planning Materials, from mr.Hải(https://app.clickup.com/t/86cx7mw5a)
 *  23 Dec 2024         Huy Pham                Thay đổi công thức tính {custcol_scv_total_qty}, thêm {custcol_scv_market_number}, from mr.Hải(https://app.clickup.com/t/86cx7mw5a?comment=90160081305017)
 *  28 Feb 2025         Huy Pham                Update logic quy trình, mapping,... from mr.Hải(https://app.clickup.com/t/86cx7mw5a?comment=90160093744760)
 *  17 Mar 2025         Huy Pham                Đổi ss5 -> ss5.1, ss6 ->ss6.1, from mr.Hải(https://app.clickup.com/t/86cx7mw5a?comment=90160098109123)
 *  11 Apr 2025         Huy Pham                Bổ sung logic, from mr.Hải(https://app.clickup.com/t/86cx7mw5a?comment=90160103314145)
 *  21 May 2025         Huy Pham                Thay đổi cách tính No.16, from mr.Phúc(https://app.clickup.com/t/86cx7mw5a?comment=90160110996307)
 *  08 Aug 2025         Huy Pham                Thay đổi logic (31/7/2025), from mr.Lương Phúc (https://app.clickup.com/t/86cx7mw5a?comment=90160125712875)
 */
/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/redirect', 'N/runtime', 'N/search', 'N/record',
    '../lib/scv_lib_function.js', '../olib/alasql/alasql.min@1.7.3.js', 

    '../cons/scv_cons_format.js',
    '../cons/scv_cons_cache.js',
    '../cons/scv_cons_datastore.js',
    '../cons/scv_cons_form.js',

    '../cons/scv_cons_purplan_ind.js',
    '../cons/scv_cons_list_item_standard.js',
    '../cons/scv_cons_queue_job.js',
    '../cons/scv_cons_list_plan_type.js',

    '../cons/scv_cons_search_pur_plan_ind.js',
    '../cons/scv_cons_search_mfg_plan.js',
    '../cons/scv_cons_search_item_map_bom.js',
    '../cons/scv_cons_search_plan_search_bom.js',
    '../cons/scv_cons_search_bom_revise_list.js',
    '../cons/scv_cons_search_list_item_stand_lq.js',
    '../cons/scv_cons_search_list_item_related_stand.js',
    '../cons/scv_cons_search_inv_onhand.js',
    '../cons/scv_cons_search_inv_onhand_pending.js',
    '../cons/scv_cons_search_plan_qty_remain.js',
    '../cons/scv_cons_search_asb_item_inv_used.js',
    '../cons/scv_cons_search_itf_item_used.js',
    '../cons/scv_cons_search_ia_item_used.js',
    '../cons/scv_cons_search_qty_po_planning.js',
    '../cons/scv_cons_search_inv_onhand_nopend.js',
    '../cons/scv_cons_search_inv_onhand_pend.js',
    '../cons/scv_cons_search_qty_itr_by_inb.js',
    '../cons/scv_cons_search_plan_transit_samesub_12_1.js',
    '../cons/scv_cons_search_plan_transit_interco_12_2.js',
],
    
    (redirect, runtime, search, record, 
        lbf, alasql, 

        constFormat,
        constCache,
        constDataStore,
        constForm,

        constPurPlanInd,
        constListItemStandard,
        constQueueJob,
        constPlanType,
        constSearchPurPlanInd,
        constSearchMfgPlan,
        constSearchItemMapBom,
        constSearchAssemblyBOM_SS02_1,
        constSearchBomReviseList,
        constSearchListItemStandLQ,
        constSearchhListItemRelated,
        constSearchInvOnhand,
        constSearchInvOnhandPending,
        constSearchPlanQtyRemain,
        constSearchAsbItemInvUsed,
        constSearchITFItemUsed_SS09,
        constSearchIAItemUsed_SS10,
        constSearchQtyPOPlanning_SS07_2,
        constSearchInvOnhandNoPend_SS05_1,
        constSearchInvOnhandPend_SS06_1,
        constSearchQtyITRByInb_SS11,
        constSearchPlanTransitSameSub_SS12_1,
        constSearchPlanTransitInterco_SS12_2
    ) => {
        const JOB_SCRIPT = {
            ID: "customscript_scv_mr_plan_mat",
            DEPLOYID: "customdeploy_scv_mr_plan_mat",
            PARAMSID: "custscript_scv_mr_plan_mat_param"
        }

        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            constForm.setContext(scriptContext);
            let request = scriptContext.request;
            let response = scriptContext.response;
            let params = request.parameters;
            let curScript = runtime.getCurrentScript();
    
            if(request.method == "GET"){
                let mainForm = onCreateFormUI(params);

                showPageMsg();

                constForm.writePage();
            }
            else{
                
                let objParams = {
                    custpage_subsidiary: params.custpage_subsidiary,
                    custpage_purplan_params: !!params.custpage_purplan_params ? params.custpage_purplan_params.split("\u0005").toString() : ""
                }
                
                let arrParamsExcute = getDataParamsPurPlanExcute(objParams);

                let isExcuteJob = false;

                if(arrParamsExcute.length == 1){
                    isExcuteJob = false;
                    let arrDataSource = getDataSource(arrParamsExcute[0]);

                    if(arrDataSource.length <= 5){
                        let arrMsg = [];
                        for(let i = 0; i < arrDataSource.length; i++){
                            try{
                                let purPlanRecId = createPurchasePlan(arrDataSource[i]);

                                let doc_num = "";
                                let purPlanLKF = search.lookupFields({
                                    type: "custompurchase_scv_purchase_plan", id: purPlanRecId,
                                    columns: ["tranid", "transactionnumber"]
                                });
                                if(!!purPlanLKF.tranid){
                                    doc_num = purPlanLKF.tranid;
                                }
                                else if(!!purPlanLKF.transactionnumber){
                                    doc_num = purPlanLKF.transactionnumber;
                                }
                                else{
                                    doc_num = purPlanRecId + " (internal ID)";
                                }

                                arrMsg.push(doc_num +": Created.");
                            }
                            catch(err){
                                log.error("ERROR: Try-Catch: createPurchasePlan", err);
                                arrMsg.push("Error: " + err.message);
                            }
                        }
                        constCache.putDataByUser("msg", arrMsg.join("<br/>"));
                    }
                    else{
                        isExcuteJob = true;
                    }
                }
                else if(arrParamsExcute.length > 1){
                    isExcuteJob = true;
                }

                if(isExcuteJob){
                    let objParamsInput = {...objParams};
                    let queueId = constQueueJob.createQueueJob("MAP_REDUCE", JOB_SCRIPT.ID, JOB_SCRIPT.DEPLOYID, JOB_SCRIPT.PARAMSID, JSON.stringify(objParamsInput));
                    constQueueJob.processQueueJob(JOB_SCRIPT.ID, JOB_SCRIPT.DEPLOYID);

                    constCache.putDataByUser("queueId", queueId);
                }
                

                redirect.toSuitelet({
					scriptId: curScript.id,
					deploymentId: curScript.deploymentId,
					parameters: {
                        ...objParams,
                        isSearch: "T"
                    }
				});
            }
        }

        const onCreateFormUI = (_params) =>{
            constForm.createForm("Planning Materials", '../cs/scv_cs_sl_plan_mat.js');

            constForm.addPageLink([
                constSearchPurPlanInd.ID, constSearchMfgPlan.ID, constSearchItemMapBom.ID,
                constSearchAssemblyBOM_SS02_1.ID,
                constSearchBomReviseList.ID, constSearchListItemStandLQ.ID, constSearchhListItemRelated.ID,
                constSearchInvOnhand.ID, constSearchInvOnhandNoPend_SS05_1.ID, constSearchInvOnhandPending.ID,
                constSearchInvOnhandPend_SS06_1.ID, constSearchPlanQtyRemain.ID, constSearchQtyPOPlanning_SS07_2.ID,
                constSearchAsbItemInvUsed.ID, constSearchITFItemUsed_SS09.ID, constSearchIAItemUsed_SS10.ID,
                constSearchQtyITRByInb_SS11.ID, constSearchPlanTransitSameSub_SS12_1.ID, constSearchPlanTransitInterco_SS12_2.ID
            ]);

            let objPopupQueue = constQueueJob.getPopupQueueJobStatus(JOB_SCRIPT.ID, JOB_SCRIPT.DEPLOYID);

            constForm.addSubmitButton({label: "Tạo KHMH"});
            constForm.addButton({id: "custpage_btn_search", label: "Search", functionName: "onSearchResult()"});
            constForm.addButton({
                id: "custpage_btn_queue", 
                label: "Queue Job", 
                functionName: `openStatusQueue('${objPopupQueue.url}', ${objPopupQueue.width}, ${objPopupQueue.height}, '${objPopupQueue.title}')`
            });

            let mainGrp = constForm.addFieldGroup({id: "fieldgrp_main", label: "Criteria"});

            constForm.addField({
                id: 'custpage_subsidiary', label: 'Công ty',
                type: "select", source: "subsidiary",
                container: mainGrp.id
            }, true,{
                defaultValue: _params.custpage_subsidiary
            });

            constForm.addField({
                id: 'custpage_purplan_params', label: 'Tham số',
                type: "multiselect",
                container: mainGrp.id
            }, true, {
                lookup: {
                    data: !!_params.custpage_subsidiary ? constSearchPurPlanInd.getDataSource(
                        search.createFilter({
                            name: 'custrecord_scv_pur_plan_ind_subsidiary',
                            operator: "anyof",
                            values: _params.custpage_subsidiary
                        })
                    ) : [],
                    displayExpr: "name",
                    valueExpr: "internalid"
                },
                defaultValue: !!_params.custpage_purplan_params ? _params.custpage_purplan_params.split(",") : ""
            });

            let paramsTab = constForm.addTab({id: "tab_params", label: "Tham Số"});

            constForm.addGridDx({
                id: "custpage_sl_params",
                type: "grid",
                label: 'Result Tham Số',
                tab: paramsTab.id,
                columns: [
                    {dataField: "custpage_purplan_params_display", caption: "Tên thamn sô", dataType: "string", /* source: "customrecord_scv_pur_plan_ind" */},
                    {dataField: "custrecord_scv_pur_plan_ind_start_date", caption: "Ngày bắt đầu", dataType: "string"},
                    {dataField: "custrecord_scv_pur_plan_ind_end_date", caption: "Ngày kết thúc", dataType: "string"},
                    {dataField: "custrecord_scv_pur_plan_ind_dkhv", caption: "Ngày dự kiến hàng về của KHMH tháng sau", dataType: "string"},
                    {dataField: "custrecord_scv_pur_plan_ind_receipt_date", caption: "Ngày lấy tồn kho", dataType: "string"},
                    {dataField: "custrecord_scv_pur_plan_ind_hsdc", caption: "Hệ số điều chỉnh SL sản xuất", type: "float"},
                    {dataField: "custrecord_scv_pur_plan_date_used_from", caption: "Thời gian tiêu hao từ", dataType: "string"},
                    {dataField: "custrecord_scv_pur_plan_ind_date_used_to", caption: "Thời gian tiêu hao đến", dataType: "string"},
                    {dataField: "custrecord_scv_pur_plan_ind_ndm_display", caption: "Danh mục vật tư chuẩn", dataType: "string", /* source: "customrecord_scv_list_item_standard" */},
                    {dataField: "custrecord_scv_list_item_standard_categ", caption: "Nhóm danh mục HH", dataType: "string", /* source: "customlist_scv_group_list_item_stan" */},
                    {dataField: "custrecord_scv_list_item_standard_stadat", caption: "Ngày bắt đầu hiệu lực", dataType: "string"},
                    {dataField: "custrecord_scv_list_item_standard_endate", caption: "Ngày kết thúc hiệu lực", dataType: "string"},
                ]
            });

            let arrParamsExcute = _params.isSearch == "T" ? getDataParamsPurPlanExcute(_params) : [];

            constForm.setDataDx("custpage_sl_params", arrParamsExcute);

            testingSupportData(arrParamsExcute);
        }

        const getDataSource = (_params) =>{
            let arrItemStandard = getDataSS0401_ListItemStandLQ(_params);
            let arrComponentId = [];

            for(let i = 0; i < arrItemStandard.length; i++){
                let objItemStandard = arrItemStandard[i];

                let idxComponentIdExist = arrComponentId.findIndex(_id => _id == objItemStandard.custrecordscv_inp_item_stand_name);
                if(idxComponentIdExist == -1){
                    arrComponentId.push(objItemStandard.custrecordscv_inp_item_stand_name);
                }
            }

            let arrInpItemStandardListId = alasql(`SELECT DISTINCT custrecordscv_inp_item_stand_list_id FROM ?`, [arrItemStandard]);
            arrInpItemStandardListId = arrInpItemStandardListId.map(e => e.custrecordscv_inp_item_stand_list_id);
            
            let arrInpItemST = getDataSS0402_ListItemRelated(_params, arrInpItemStandardListId);
            
            for(let i = 0; i < arrInpItemST.length; i++){
                let objInpItemST = arrInpItemST[i];

                let idxComponentIdExist = arrComponentId.findIndex(_id => _id == objInpItemST.custrecord_scv_item_lq_kho_item);
                if(idxComponentIdExist == -1){
                    arrComponentId.push(objInpItemST.custrecord_scv_item_lq_kho_item);
                }

                idxComponentIdExist = arrComponentId.findIndex(_id => _id == objInpItemST.custrecord_scv_item_lq_th_item);
                if(idxComponentIdExist == -1){
                    arrComponentId.push(objInpItemST.custrecord_scv_item_lq_th_item);
                }
            }

            let arrMfgPlan = getDataSS01_MfgPlan(_params);

            let arrItemId = alasql(`SELECT DISTINCT item_id FROM ?`,[arrMfgPlan]).map(e => e.item_id);

            let objResultBom = getDataSourceOfBOM(_params, arrItemId);
            
            let arrItemMapBom = objResultBom.arrItemMapBom;

            let arrBomRevise = objResultBom.arrBomRevise;

            let arrComponentOfAssembly = getDataSourceComponentOfAssembly(arrMfgPlan, arrItemMapBom, arrBomRevise);
            //let arrComponentId = alasql(`SELECT DISTINCT component_item FROM ?`,[arrBomRevise]).map(e => e.component_item);
            arrComponentOfAssembly.forEach(objAsb =>{
                let arrComponent = objAsb.component;

                arrComponent.forEach(objComponent =>{
                    let idxComponentIdExist = arrComponentId.findIndex(_id => _id == objComponent.component_id);
                    if(idxComponentIdExist == -1){
                        arrComponentId.push(objComponent.component_id);
                    }
                });
            })
            constDataStore.setDataStore("arrComponentOfAssembly", arrComponentOfAssembly);

            //let arrInvOnhand = getDataSS05_InvOnhand(_params, arrComponentId);
            let arrInvOnhandNoPend = getDataSS0501_InvOnhandNoPend(_params, arrComponentId);
            constDataStore.setDataStore("arrInvOnhandNoPend", arrInvOnhandNoPend);

            //let arrInvOnhandPending = getDataSS06_InvOnhandPending(_params, arrComponentId);
            let arrInvOnhandPend = getDataSS0601_InvOnhandPend(_params, arrComponentId);
            constDataStore.setDataStore("arrInvOnhandPend", arrInvOnhandPend);

            let arrPlanQtyRemain = getDataSS07_PlanQtyRemain(_params, arrComponentId);
            constDataStore.setDataStore("arrPlanQtyRemain", arrPlanQtyRemain);

            let arrQtyPORemain = getDataSS0702_QtyPORemainning(_params, arrComponentId);
            let arrQtyITRByInb = getDataSS11_QtyITRByInb(_params, arrComponentId);
            constDataStore.setDataStore("arrQtyITRByInb", arrQtyITRByInb);

            //let arrPlanMarIntransitQty = getDataSS12_PlanMarIntransitQty(_params, arrComponentId);
            //constDataStore.setDataStore("arrPlanMarIntransitQty", arrPlanMarIntransitQty);

            let arrPlanTransitSameSub = getDataSS1201_PlanTransitSameSub(_params, arrComponentId);
            constDataStore.setDataStore("arrPlanTransitSameSub", arrPlanTransitSameSub);

            let arrPlanTransitInterco = getDataSS1202_PlanTransitInterco(_params, arrComponentId);
            constDataStore.setDataStore("arrPlanTransitInterco", arrPlanTransitInterco);

            let arrAsbItemInvUsed = getDataSS08_AsbItemInvUsed(_params, arrComponentId);

            let arrITFItemUsed = getDataSS09_ITFItemUsed(_params, arrComponentId);

            let arrIAItemUsed = getDataSS10_IAItemUsed(_params, arrComponentId);
            
            let arrResult_Temp = [];
            for(let i = 0; i < arrItemStandard.length; i++){
                let objItemStandard = arrItemStandard[i];

                let objRes = {};
                
                objRes.item_standard_startdt = objItemStandard.custrecord_scv_list_item_standard_stadat;
                objRes.item_standard_enddate = objItemStandard.custrecord_scv_list_item_standard_endate;
                objRes.subsidiary = objItemStandard.custrecord_scv_list_item_standard_sub,
                objRes.estimated_delivery_date = _params.custrecord_scv_pur_plan_ind_dkhv;
                objRes.inv_count_date = _params.custrecord_scv_pur_plan_ind_receipt_date;
                objRes.production_adjust_factor = _params.custrecord_scv_pur_plan_ind_hsdc * 1;
                objRes.date_consump_from = _params.custrecord_scv_pur_plan_date_used_from;
                objRes.date_consump_to = _params.custrecord_scv_pur_plan_ind_date_used_to;
                objRes.pur_plan_para_apply = _params.custpage_purplan_params;
                objRes.list_item_standard = _params.custrecord_scv_list_item_standard_categ;
                objRes.component_id = objItemStandard.custrecordscv_inp_item_stand_name;
                objRes.predicted_consump_avg = objItemStandard.custrecord_scv_predicted_consump_avg * 1;
                objRes.plan_safety_days = objItemStandard.custrecord_scv_plan_numb_days_on_hand * 1;
                objRes.qty_processing = 0;
                objRes.onhand_pending = 0;
                objRes.qty_po = 0;
                objRes.qty_po_remain = 0;
                objRes.total_qty = 0;
                objRes.qty_requistion = 0; 
                objRes.market_number = objItemStandard.custrecord_scv_inp_item_stand_market;
                objRes.line_no = objItemStandard.custrecord_scv_no_line;
                
                let countDiffDays = constFormat.calcNumberDays(objRes.estimated_delivery_date, objRes.inv_count_date);
                
                objRes.component_qty = 0;
                arrComponentOfAssembly.forEach(objComponentOfAsb =>{
                    let arrComponent = objComponentOfAsb.component;
                    for(let j = 0; j < arrComponent.length; j++){
                        let objComponent = arrComponent[j];
                        
                        if(objComponent.component_id == objRes.component_id){
                            objRes.component_qty += objComponent.component_qty * 1;
                        }
                    }
                });
                if(objRes.component_qty == 0){
                    objRes.component_qty = objItemStandard.custrecord_scv_inp_item_stand_use_no_bom * 1;
                }

                objRes.component_qty = Math.round(objRes.component_qty);

                let arrItemIdOfStandard = [objRes.component_id * 1];
                let arrItemIdOfStandard_QtyInvUsed = [];
                let arrInpItemST_filter = arrInpItemST.filter(e => e.custrecordscv_inp_item_stand_list_id == objItemStandard.custrecordscv_inp_item_stand_list_id);

                for(let z = 0; z < arrInpItemST_filter.length; z++){
                    let objInpItemST = arrInpItemST_filter[z];
                    
                    let idxItemKho = arrItemIdOfStandard.findIndex(_id => _id == objInpItemST.custrecord_scv_item_lq_kho_item * 1);
                    if(idxItemKho == -1){
                        arrItemIdOfStandard.push(objInpItemST.custrecord_scv_item_lq_kho_item * 1);
                    }

                    /* let idxItemTTieuHao = arrItemIdOfStandard.findIndex(_id => _id == objInpItemST.custrecord_scv_item_lq_th_item * 1);
                    if(idxItemTTieuHao == -1){
                        arrItemIdOfStandard.push(objInpItemST.custrecord_scv_item_lq_th_item * 1);
                    } */

                    /* let idxItemKho_QtyInvUsed = arrItemIdOfStandard_QtyInvUsed.findIndex(_id => _id == objInpItemST.custrecord_scv_item_lq_kho_item * 1);
                    if(idxItemKho_QtyInvUsed == -1){
                        arrItemIdOfStandard_QtyInvUsed.push(objInpItemST.custrecord_scv_item_lq_kho_item * 1);
                    } */

                    let idxItemTTieuHao_QtyInvUsed = arrItemIdOfStandard_QtyInvUsed.findIndex(_id => _id == objInpItemST.custrecord_scv_item_lq_th_item * 1);
                    if(idxItemTTieuHao_QtyInvUsed == -1){
                        arrItemIdOfStandard_QtyInvUsed.push(objInpItemST.custrecord_scv_item_lq_th_item * 1);
                    }
                }

                objRes.qty_inv_used = 0;

                let arrAsbItemInvUsedComponent = arrAsbItemInvUsed.filter(e => e.subsidiary == objRes.subsidiary
                    && arrItemIdOfStandard_QtyInvUsed.includes(Number(e.item_id))
                );
                arrAsbItemInvUsedComponent.forEach(objItemInvUsed =>{
                    objRes.qty_inv_used += objItemInvUsed.quantity * 1;
                });

                let arrITFItemUsedComponent = arrITFItemUsed.filter(e => arrItemIdOfStandard_QtyInvUsed.includes(Number(e.item_id)));
                arrITFItemUsedComponent.forEach(objItemITFUsed =>{
                    objRes.qty_inv_used += objItemITFUsed.quantity * 1;
                });

                let arrIAItemUsedComponent = arrIAItemUsed.filter(e => arrItemIdOfStandard_QtyInvUsed.includes(Number(e.item_id)));
                arrIAItemUsedComponent.forEach(objItemIAUsed =>{
                    objRes.qty_inv_used += objItemIAUsed.quantity * 1;
                });

                objRes.qty_inv_used = _params.so_thang_tieu_hao == 0 ? 0 : objRes.qty_inv_used / _params.so_thang_tieu_hao;
                objRes.qty_inv_used = constFormat.roundNumber(objRes.qty_inv_used);

                let arrInvOnhandNoPendComponent = arrInvOnhandNoPend.filter(e => arrItemIdOfStandard.includes(Number(e.item_id)));
                arrInvOnhandNoPendComponent.forEach(_objInvOnhandNoPend =>{
                    objRes.qty_processing += _objInvOnhandNoPend.qty_available * 1;
                });

                let arrPlanTransitSameSubComponent = arrPlanTransitSameSub.filter(e => arrItemIdOfStandard.includes(Number(e._1_item_id)));
                arrPlanTransitSameSubComponent.forEach(_objPlanTransitSameSub =>{
                    objRes.qty_processing += _objPlanTransitSameSub._4_in_transit * 1;
                });

                let arrPlanTransitIntercoComponent = arrPlanTransitInterco.filter(e => arrItemIdOfStandard.includes(Number(e._1_item_id)));
                arrPlanTransitIntercoComponent.forEach(_objPlanTransitInterco =>{
                    objRes.qty_processing += _objPlanTransitInterco._4_in_transit * 1;
                });
                
                let arrInvOnhandPendComponent = arrInvOnhandPend.filter(e => 
                    arrItemIdOfStandard.includes(Number(e.item_id))
                );
                arrInvOnhandPendComponent.forEach(_objInvOnhandPend =>{
                    objRes.onhand_pending += _objInvOnhandPend.qty_available * 1;
                });

                let arrPlanQtyRemainComponent = arrPlanQtyRemain.filter(e =>
                    arrItemIdOfStandard.includes(Number(e.item_id))
                );
                arrPlanQtyRemainComponent.forEach(objPlanQtyRemain =>{
                    objRes.qty_po_remain += objPlanQtyRemain.qty_remain * 1;
                });
                
                let arrQtyPORemainComponent = arrQtyPORemain.filter(e =>
                    arrItemIdOfStandard.includes(Number(e.item_id))
                );
                arrQtyPORemainComponent.forEach(objQtyPORemain =>{
                    let qty_ss7_1 = objQtyPORemain.quantity * 1;
                    let qty_dif_ss7_1 = objQtyPORemain.quantity_diff * 1;
                    let qty_ss11 = 0;

                    let objQtyITRByInb = arrQtyITRByInb.find(e => e.item_id == objQtyPORemain.item_id
                        && e.po_id == objQtyPORemain.po_id
                        && e.ori_line_id == objQtyPORemain.ori_line_id
                    );
                    if(!!objQtyITRByInb){
                        qty_ss11 = objQtyITRByInb.quantity * 1;
                    }

                    if((qty_ss7_1 - qty_ss11) > qty_dif_ss7_1){
                        objRes.qty_po += qty_ss7_1 - qty_ss11;//TO-DO
                    }
                });
                
                objRes.total_qty = objRes.qty_processing + objRes.qty_po + objRes.qty_po_remain;
                    
                let countDiffDays_safetyDays = countDiffDays + objRes.plan_safety_days;
                let predictedConsumpAvg_adjustFactor = (objRes.predicted_consump_avg / 30) * objRes.production_adjust_factor;

                objRes.qty_requistion = countDiffDays_safetyDays * predictedConsumpAvg_adjustFactor - objRes.total_qty;
                objRes.qty_requistion = Math.round(objRes.qty_requistion);

                arrResult_Temp.push(objRes);
            }
            
            let arrKeyHeader = [
                "subsidiary", "estimated_delivery_date", "inv_count_date", 
                "production_adjust_factor", "date_consump_from", "date_consump_to",
                "pur_plan_para_apply", "list_item_standard",
                "item_standard_startdt", "item_standard_enddate"
            ]
            let arrResult = alasql(`SELECT DISTINCT ${arrKeyHeader.join(",")} FROM ?`, [arrResult_Temp]);
            for(let i = 0; i < arrResult.length; i++){
                let objRes = arrResult[i];

                objRes.component = arrResult_Temp.filter(e=>{
                    let isExist = true;
                    for(let j = 0; j < arrKeyHeader.length; j++){
                        if(objRes[arrKeyHeader[j]] != e[arrKeyHeader[j]]){
                            isExist = false;
                            break;
                        }
                    }
                    return isExist;
                });
            }
            
            /**
             * Header:
             * subsidiary: subsidiary
             * custbody_scv_estimated_delivery_date: estimated_delivery_date
             * custbody_scv_inv_count_date: inv_count_date
             * custbody_scv_production_adjust_factor: production_adjust_factor
             * custbody_scv_date_consump_from: date_consump_from
             * custbody_scv_date_consump_to: date_consump_to
             * custbody_scv_pur_plan_para_apply: pur_plan_para_apply
             * custbody_scv_list_item_standard: list_item_standard
             * 
             * Line {item}:
             * item: component_id
             * custcol_scv_plan_use_by_month: component_qty
             * custcol_scv_qty_consump_by_month: qty_inv_used
             * custcol_scv_predicted_consump_avg: predicted_consump_avg
             * custcol_scv_plan_safety_days: plan_safety_days
             * custcol_scv_qty_processing: qty_processing
             * custcol_scv_on_hand_item_pending: onhand_pending
             * custcol_scv_pur_plan_qty_po: qty_po
             * custcol_scv_pur_plan_qty_po_remain: qty_po_remain
             * custcol_scv_total_qty: total_qty
             * custcol_scv_qty_requisition: qty_requistion
             * custcol_scv_market_number: market_number
             * custcol_scv_line_no: line_no
             */
            return arrResult;
        }

        //Hiện tại Nvd chỉ tối đa 3 cấp, nên khả năng thực hiện đệ quy call vẫn chấp nhận
        const getDataSourceOfBOM = (_params, _arrItemId) =>{
            //let arrItemMapBom = getDataSS02_ItemMapBom(_params, _arrItemId);
            let arrItemMapBom = getDataSS0201_AssemblyBom(_params, _arrItemId);
            let arrBomId = alasql(`SELECT DISTINCT bom_id FROM ?`,[arrItemMapBom]).map(e => e.bom_id);

            let arrBomRevise = getDataSS03_BomReviseList(_params, arrBomId);
            let arrBomRevise_Assembly = arrBomRevise.filter(e => e.itemtype == "Assembly" && e.custrecord_scv_bom_calculate_assembly);
            let arrBomRevise_AssemblyInvalid = arrBomRevise.filter(e => e.itemtype == "Assembly" && !e.custrecord_scv_bom_calculate_assembly);
            arrBomRevise_AssemblyInvalid.forEach(e => {
                e.itemtype = "_" + e.itemtype; //Đánh dấu là không sử dụng
            });

            if(arrBomRevise_Assembly.length > 0){
                let arrComponentId = alasql(`SELECT DISTINCT component_item FROM ?`,[arrBomRevise_Assembly]).map(e => e.component_item);

                let objResultRecursive = getDataSourceOfBOM(_params, arrComponentId);

                arrItemMapBom = arrItemMapBom.concat(objResultRecursive.arrItemMapBom);
                arrBomRevise = arrBomRevise.concat(objResultRecursive.arrBomRevise);
            }

            return {
                arrItemMapBom,
                arrBomRevise
            }
        }

        const getDataSourceComponentOfAssembly = (arrMfgPlan, arrItemMapBom, arrBomRevise) =>{
            let arrBomOfAssembly = [];
            for(let i = 0; i < arrMfgPlan.length; i++){
                let objMfgPlan = arrMfgPlan[i];

                let objBomOfAssembly = {
                    mfg_plan_id: objMfgPlan.mfg_plan_id,
                    assembly_id: objMfgPlan.item_id,
                    location: objMfgPlan.location,
                    plan_qty: objMfgPlan.custcol_scv_plan_qty * 1,
                    subsidiary: objMfgPlan.subsidiary,
                    transactionnumber: objMfgPlan.transactionnumber,
                    trandate: objMfgPlan.trandate,
                    unit: objMfgPlan.unit,
                    component: []
                };

                objBomOfAssembly.component = getDataComponentByAssembly(objBomOfAssembly.assembly_id, objBomOfAssembly.plan_qty, arrItemMapBom, arrBomRevise);
                
                if(objBomOfAssembly.component.length == 0) continue;

                arrBomOfAssembly.push(objBomOfAssembly);
            }

            return arrBomOfAssembly;
        }

        const getDataComponentByAssembly = (_assemblyId, _assemblyQty, _arrItemMapBom, arrBomRevise) =>{
            let arrResult = [];
            
            let objItemMapBom = _arrItemMapBom.find(e => e.assembly_id == _assemblyId);
            
            if(!!objItemMapBom){
                arrResult = arrBomRevise.filter(e => e.bom_id == objItemMapBom.bom_id
                    && e.itemtype != "Assembly"
                ).map(e => {
                    return {
                        bom_id: e.bom_id,
                        component_id: e.component_item,
                        component_qty: e.component_bom_quantity * _assemblyQty,
                        component_qty_rate: e.component_bom_quantity * 1,
                        component_units: e.units,
                        component_itemtype: e.itemtype,
                        effectivestartdate: e.effectivestartdate,
                        effectiveenddate: e.effectiveenddate
                    }
                });
                
                let arrBomReviseAssembly = arrBomRevise.filter(e => e.bom_id == objItemMapBom.bom_id
                    && e.itemtype == "Assembly"
                );
                
                for(let i = 0; i < arrBomReviseAssembly.length; i++){
                    let objAssembly = arrBomReviseAssembly[i];

                    let componentAssemblyId = objAssembly.component_item;
                    let componenttAssemblyQty = objAssembly.component_bom_quantity * _assemblyQty;
                    
                    let arrResultRecursive = getDataComponentByAssembly(componentAssemblyId, componenttAssemblyQty , _arrItemMapBom, arrBomRevise);
                    
                    if(arrResultRecursive.length == 0){
                        arrResultRecursive.push({
                            bom_id: objAssembly.bom_id,
                            component_id: componentAssemblyId,
                            component_qty: componenttAssemblyQty,
                            component_qty_rate: objAssembly.component_bom_quantity * 1,
                            component_units: objAssembly.units,
                            component_itemtype: "_" + objAssembly.itemtype,
                            effectivestartdate: objAssembly.effectivestartdate,
                            effectiveenddate: objAssembly.effectiveenddate
                        });
                    }

                    arrResult = arrResult.concat(arrResultRecursive);
                }
            }

            return arrResult;
        }

        //#region Get Data Saved Search
        const getDataSS01_MfgPlan = (_params) => {
            let myFilters = [];

            if(!!_params.custpage_subsidiary){
                myFilters.push(search.createFilter({
                    name: 'subsidiary', 
                    operator: "anyof", 
                    values: _params.custpage_subsidiary
                }))
            }

            if(!!_params.custrecord_scv_pur_plan_ind_start_date){
                myFilters.push(search.createFilter({
                    name: 'trandate', 
                    operator: "onorafter", 
                    values: _params.custrecord_scv_pur_plan_ind_start_date
                }))
            }
            if(!!_params.custrecord_scv_pur_plan_ind_end_date){
                myFilters.push(search.createFilter({
                    name: 'trandate', 
                    operator: "onorbefore", 
                    values: _params.custrecord_scv_pur_plan_ind_end_date
                }))
            }
            
            let arrResult = constSearchMfgPlan.getDataSource(myFilters);

            return arrResult;
        }

        const getDataSS02_ItemMapBom = (_params, _arrItemId) => {
            let myFilters = [];
            
            if(!!_params.custpage_subsidiary){
                myFilters.push(search.createFilter({
                    name: 'subsidiary', 
                    operator: "anyof", 
                    values: _params.custpage_subsidiary
                }))
            }
            if(_arrItemId.length > 0){
                myFilters.push(search.createFilter({
                    name: 'internalid', 
                    operator: "anyof", 
                    values: _arrItemId
                }))
            }
            else{
                return [];
            }

            let arrResult = constSearchItemMapBom.getDataSource(myFilters);

            return arrResult;
        }
        
        const getDataSS0201_AssemblyBom = (_params, _arrItemId) => {
            let myFilters = [];
            
            if(!!_params.custpage_subsidiary){
                myFilters.push(search.createFilter({
                    name: 'subsidiary', 
                    operator: "anyof", 
                    values: _params.custpage_subsidiary
                }))
            }
            if(_arrItemId.length > 0){
                myFilters.push(search.createFilter({
                    name: 'assembly', 
                    join: "assemblyitem",
                    operator: "anyof", 
                    values: _arrItemId
                }))
            }
            else{
                return [];
            }

            let arrResult = constSearchAssemblyBOM_SS02_1.getDataSource(myFilters);

            return arrResult;
        }

        const getDataSS03_BomReviseList = (_params, _arrBomId) => {
            let myFilters = [];
            
            if(!!_params.custpage_subsidiary){
                myFilters.push(search.createFilter({
                    name: 'subsidiary', 
                    join: "billOfMaterials",
                    operator: "anyof", 
                    values: _params.custpage_subsidiary
                }))
            }
            if(_arrBomId.length > 0){
                myFilters.push(search.createFilter({
                    name: 'billOfMaterials', 
                    operator: "anyof", 
                    values: _arrBomId
                }))
            }
            else{
                return [];
            }

            let arrResult = constSearchBomReviseList.getDataSource(myFilters);

            return arrResult;
        }

        const getDataSS0401_ListItemStandLQ = (_params) => {
            let myFilters = [];

            if(!!_params.custpage_subsidiary){
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_list_item_standard_sub', 
                    operator: "anyof", 
                    values: _params.custpage_subsidiary
                }))
            }
            if(!!_params.custrecord_scv_pur_plan_ind_ndm){
                myFilters.push(search.createFilter({
                    name: 'internalid', 
                    operator: "anyof", 
                    values: _params.custrecord_scv_pur_plan_ind_ndm
                }))
            }
            myFilters.push(search.createFilter({
                name: 'custrecord_scv_list_item_standard_stadat', 
                operator: "within", 
                values: [_params.custrecord_scv_pur_plan_ind_start_date, _params.custrecord_scv_pur_plan_ind_end_date]
            }))
            myFilters.push(search.createFilter({
                name: 'custrecord_scv_list_item_standard_endate', 
                operator: "within", 
                values: [_params.custrecord_scv_pur_plan_ind_start_date, _params.custrecord_scv_pur_plan_ind_end_date]
            }))

            let arrResult = constSearchListItemStandLQ.getDataSource(myFilters);

            return arrResult;
        }

        const getDataSS0402_ListItemRelated = (_params, _arrInternalId) => {
            let myFilters = [];
            
            if(_arrInternalId.length > 0){
                myFilters.push(search.createFilter({
                    name: 'internalid', 
                    operator: "anyof", 
                    values: _arrInternalId
                }))
            }
            else{
                return [];
            }

            let arrResult = constSearchhListItemRelated.getDataSource(myFilters);

            return arrResult;
        }

        const getDataSS05_InvOnhand = (_params, _arrItemId) => {
            let myFilters = [];

            if(!!_params.custpage_subsidiary){
                myFilters.push(search.createFilter({
                    name: 'subsidiary',
                    join: "location", 
                    operator: "anyof", 
                    values: _params.custpage_subsidiary
                }))
            }

            if(_arrItemId.length > 0){
                myFilters.push(search.createFilter({
                    name: 'item', 
                    operator: "anyof", 
                    values: _arrItemId
                }))
            }
            else{
                return [];
            }
            
            let arrResult = constSearchInvOnhand.getDataSource(myFilters);

            return arrResult;
        }

        const getDataSS0501_InvOnhandNoPend = (_params, _arrItemId) => {
            let myFilters = [];

            if(!!_params.custpage_subsidiary){
                myFilters.push(search.createFilter({
                    name: 'subsidiary',
                    operator: "anyof", 
                    values: _params.custpage_subsidiary
                }))
            }

            if(_arrItemId.length > 0){
                myFilters.push(search.createFilter({
                    name: 'item', 
                    operator: "anyof", 
                    values: _arrItemId
                }))
            }
            else{
                return [];
            }
            
            if(!!_params.custrecord_scv_pur_plan_ind_receipt_date){
                myFilters.push(search.createFilter({
                    name: 'trandate', 
                    operator: "onorbefore", 
                    values: _params.custrecord_scv_pur_plan_ind_receipt_date
                }))
            }
            
            let arrResult = constSearchInvOnhandNoPend_SS05_1.getDataSource(myFilters);

            return arrResult;
        }

        const getDataSS06_InvOnhandPending = (_params, _arrItemId) => {
            let myFilters = [];
            
            if(!!_params.custpage_subsidiary){
                myFilters.push(search.createFilter({
                    name: 'subsidiary',
                    join: "location", 
                    operator: "anyof", 
                    values: _params.custpage_subsidiary
                }))
            }

            if(_arrItemId.length > 0){
                myFilters.push(search.createFilter({
                    name: 'item', 
                    operator: "anyof", 
                    values: _arrItemId
                }))
            }
            else{
                return [];
            }

            let arrResult = constSearchInvOnhandPending.getDataSource(myFilters);

            return arrResult;
        }

        const getDataSS0601_InvOnhandPend = (_params, _arrItemId) => {
            let myFilters = [];
            
            if(!!_params.custpage_subsidiary){
                myFilters.push(search.createFilter({
                    name: 'subsidiary',
                    operator: "anyof", 
                    values: _params.custpage_subsidiary
                }))
            }

            if(_arrItemId.length > 0){
                myFilters.push(search.createFilter({
                    name: 'item', 
                    operator: "anyof", 
                    values: _arrItemId
                }))
            }
            else{
                return [];
            }

            if(!!_params.custrecord_scv_pur_plan_ind_receipt_date){
                myFilters.push(search.createFilter({
                    name: 'trandate', 
                    operator: "onorbefore", 
                    values: _params.custrecord_scv_pur_plan_ind_receipt_date
                }))
            }

            let arrResult = constSearchInvOnhandPend_SS06_1.getDataSource(myFilters);

            return arrResult;
        }

        const getDataSS07_PlanQtyRemain = (_params, _arrItemId) => {
            let myFilters = [];
            
            if(!!_params.custpage_subsidiary){
                myFilters.push(search.createFilter({
                    name: 'subsidiary',
                    operator: "anyof", 
                    values: _params.custpage_subsidiary
                }))
            }
            if(!!_params.custrecord_scv_pur_plan_ind_receipt_date){
                myFilters.push(search.createFilter({
                    name: 'trandate', 
                    operator: "onorbefore", 
                    values: _params.custrecord_scv_pur_plan_ind_receipt_date
                }))
            }

            if(_arrItemId.length > 0){
                myFilters.push(search.createFilter({
                    name: 'item', 
                    operator: "anyof", 
                    values: _arrItemId
                }))
            }
            else{
                return [];
            }
            
            let arrResult = constSearchPlanQtyRemain.getDataSource(myFilters);

            return arrResult;
        }

        const getDataSS0702_QtyPORemainning = (_params, _arrItemId) => {
            let myFilters = [];

            if(!!_params.custpage_subsidiary){
                myFilters.push(search.createFilter({
                    name: 'subsidiary',
                    operator: "anyof", 
                    values: _params.custpage_subsidiary
                }))
            }

            if(_arrItemId.length > 0){
                myFilters.push(search.createFilter({
                    name: 'item', 
                    operator: "anyof", 
                    values: _arrItemId
                }))
            }
            else{
                return [];
            }
            
            if(!!_params.custrecord_scv_pur_plan_ind_receipt_date){
                myFilters.push(search.createFilter({
                    name: 'trandate', 
                    operator: "onorbefore", 
                    values: _params.custrecord_scv_pur_plan_ind_receipt_date
                }))
            }
            
            let arrResult = constSearchQtyPOPlanning_SS07_2.getDataSource(myFilters);

            return arrResult;
        }

        const getDataSS08_AsbItemInvUsed = (_params, _arrItemId) => {
            let myFilters = [];

            if(!!_params.custpage_subsidiary){
                myFilters.push(search.createFilter({
                    name: 'subsidiary', 
                    operator: "anyof", 
                    values: _params.custpage_subsidiary
                }))
            }

            if(_arrItemId.length > 0){
                myFilters.push(search.createFilter({
                    name: 'item', 
                    operator: "anyof", 
                    values: _arrItemId
                }))
            }
            else{
                return [];
            }

            if(!!_params.custrecord_scv_pur_plan_date_used_from){
                myFilters.push(search.createFilter({
                    name: 'trandate', 
                    operator: "onorafter", 
                    values: _params.custrecord_scv_pur_plan_date_used_from
                }))
            }
            if(!!_params.custrecord_scv_pur_plan_ind_date_used_to){
                myFilters.push(search.createFilter({
                    name: 'trandate', 
                    operator: "onorbefore", 
                    values: _params.custrecord_scv_pur_plan_ind_date_used_to
                }))
            }
            
            let arrResult = constSearchAsbItemInvUsed.getDataSource(myFilters);

            return arrResult;
        }
        
        const getDataSS09_ITFItemUsed = (_params, _arrItemId) => {
            let myFilters = [];

            if(!!_params.custpage_subsidiary){
                myFilters.push(search.createFilter({
                    name: 'subsidiary', 
                    operator: "anyof", 
                    values: _params.custpage_subsidiary
                }))
            }

            if(_arrItemId.length > 0){
                myFilters.push(search.createFilter({
                    name: 'item', 
                    operator: "anyof", 
                    values: _arrItemId
                }))
            }
            else{
                return [];
            }

            if(!!_params.custrecord_scv_pur_plan_date_used_from){
                myFilters.push(search.createFilter({
                    name: 'trandate', 
                    operator: "onorafter", 
                    values: _params.custrecord_scv_pur_plan_date_used_from
                }))
            }
            if(!!_params.custrecord_scv_pur_plan_ind_date_used_to){
                myFilters.push(search.createFilter({
                    name: 'trandate', 
                    operator: "onorbefore", 
                    values: _params.custrecord_scv_pur_plan_ind_date_used_to
                }))
            }
            
            let arrResult = constSearchITFItemUsed_SS09.getDataSource(myFilters);

            return arrResult;
        }

        const getDataSS10_IAItemUsed = (_params, _arrItemId) => {
            let myFilters = [];

            if(!!_params.custpage_subsidiary){
                myFilters.push(search.createFilter({
                    name: 'subsidiary', 
                    operator: "anyof", 
                    values: _params.custpage_subsidiary
                }))
            }

            if(_arrItemId.length > 0){
                myFilters.push(search.createFilter({
                    name: 'item', 
                    operator: "anyof", 
                    values: _arrItemId
                }))
            }
            else{
                return [];
            }

            if(!!_params.custrecord_scv_pur_plan_date_used_from){
                myFilters.push(search.createFilter({
                    name: 'trandate', 
                    operator: "onorafter", 
                    values: _params.custrecord_scv_pur_plan_date_used_from
                }))
            }
            if(!!_params.custrecord_scv_pur_plan_ind_date_used_to){
                myFilters.push(search.createFilter({
                    name: 'trandate', 
                    operator: "onorbefore", 
                    values: _params.custrecord_scv_pur_plan_ind_date_used_to
                }))
            }
            
            let arrResult = constSearchIAItemUsed_SS10.getDataSource(myFilters);

            return arrResult;
        }

        const getDataSS11_QtyITRByInb = (_params, _arrItemId) => {
            let myFilters = [];

            if(!!_params.custpage_subsidiary){
                myFilters.push(search.createFilter({
                    name: 'subsidiary',
                    operator: "anyof", 
                    values: _params.custpage_subsidiary
                }))
            }

            if(_arrItemId.length > 0){
                myFilters.push(search.createFilter({
                    name: 'item', 
                    operator: "anyof", 
                    values: _arrItemId
                }))
            }
            else{
                return [];
            }
            
            if(!!_params.custrecord_scv_pur_plan_ind_receipt_date){
                myFilters.push(search.createFilter({
                    name: 'trandate', 
                    operator: "onorbefore", 
                    values: _params.custrecord_scv_pur_plan_ind_receipt_date
                }))
            }
            
            let arrResult = constSearchQtyITRByInb_SS11.getDataSource(myFilters);

            return arrResult;
        }

        const getDataSS1201_PlanTransitSameSub = (_params, _arrItemId) => {
            let myFilters = [];

            if(!!_params.custpage_subsidiary){
                myFilters.push(search.createFilter({
                    name: 'subsidiary',
                    operator: "anyof", 
                    values: _params.custpage_subsidiary
                }))
            }

            if(_arrItemId.length > 0){
                myFilters.push(search.createFilter({
                    name: 'item', 
                    operator: "anyof", 
                    values: _arrItemId
                }))
            }
            else{
                return [];
            }
            
            if(!!_params.custrecord_scv_pur_plan_ind_receipt_date){
                myFilters.push(search.createFilter({
                    name: 'trandate', 
                    operator: "onorbefore", 
                    values: _params.custrecord_scv_pur_plan_ind_receipt_date
                }))
            }
            
            let arrResult = constSearchPlanTransitSameSub_SS12_1.getDataSource(myFilters);

            return arrResult;
        }

        const getDataSS1202_PlanTransitInterco = (_params, _arrItemId) => {
            let myFilters = [];

            if(!!_params.custpage_subsidiary){
                myFilters.push(search.createFilter({
                    name: 'subsidiary',
                    join: 'createdfrom',
                    operator: "noneof", 
                    values: _params.custpage_subsidiary
                }))
            }

            if(_arrItemId.length > 0){
                myFilters.push(search.createFilter({
                    name: 'item', 
                    operator: "anyof", 
                    values: _arrItemId
                }))
            }
            else{
                return [];
            }
            
            if(!!_params.custrecord_scv_pur_plan_ind_receipt_date){
                myFilters.push(search.createFilter({
                    name: 'trandate', 
                    operator: "onorbefore", 
                    values: _params.custrecord_scv_pur_plan_ind_receipt_date
                }))
            }
            
            let arrResult = constSearchPlanTransitInterco_SS12_2.getDataSource(myFilters);

            return arrResult;
        }
        //#endregion

        const getDataParamsPurPlanExcute = (_params) =>{
            if(!_params.custpage_purplan_params) return [];

            let arrPurPlanInd = constPurPlanInd.getDataSource(search.createFilter({
                name: 'internalid', 
                operator: "anyof", 
                values: _params.custpage_purplan_params.split(",")
            }));

            let arrResult = [];

            for(let i = 0; i < arrPurPlanInd.length; i++){
                let objPurPlanInd = arrPurPlanInd[i];

                if(!objPurPlanInd.custrecord_scv_pur_plan_ind_ndm) continue;

                let arrItemStandardId = objPurPlanInd.custrecord_scv_pur_plan_ind_ndm.split(",");

                for(let j = 0; j < arrItemStandardId.length; j++){
                    let itemStandardId = arrItemStandardId[j];

                    let objRes = {..._params};
                    objRes.custpage_purplan_params = objPurPlanInd.internalid;
                    objRes.custpage_purplan_params_display = objPurPlanInd.name;
                    objRes.custrecord_scv_pur_plan_ind_dkhv = objPurPlanInd.custrecord_scv_pur_plan_ind_dkhv;
                    objRes.custrecord_scv_pur_plan_ind_receipt_date = objPurPlanInd.custrecord_scv_pur_plan_ind_receipt_date;
                    objRes.custrecord_scv_pur_plan_ind_hsdc = objPurPlanInd.custrecord_scv_pur_plan_ind_hsdc;
                    objRes.custrecord_scv_pur_plan_ind_start_date = objPurPlanInd.custrecord_scv_pur_plan_ind_start_date;
                    objRes.custrecord_scv_pur_plan_ind_end_date = objPurPlanInd.custrecord_scv_pur_plan_ind_end_date;
                    objRes.custrecord_scv_pur_plan_date_used_from = objPurPlanInd.custrecord_scv_pur_plan_date_used_from;
                    objRes.custrecord_scv_pur_plan_ind_date_used_to = objPurPlanInd.custrecord_scv_pur_plan_ind_date_used_to;
                    objRes.custrecord_scv_pur_plan_ind_ndm = itemStandardId;

                    objRes.so_thang_tieu_hao = 1 + constFormat.calcNumberMonths(objRes.custrecord_scv_pur_plan_date_used_from, objRes.custrecord_scv_pur_plan_ind_date_used_to);
                    
                    arrResult.push(objRes);
                }
            }

            let arrItemStandardId = arrResult.filter(e => !!e.custrecord_scv_pur_plan_ind_ndm)
            arrItemStandardId = alasql(`SELECT DISTINCT custrecord_scv_pur_plan_ind_ndm FROM ?`, [arrItemStandardId]);
            arrItemStandardId = arrItemStandardId.map(e => e.custrecord_scv_pur_plan_ind_ndm);

            let arrItemStandard = constListItemStandard.getDataSource(search.createFilter({
                name: 'internalid', 
                operator: "anyof", 
                values: arrItemStandardId
            }));

            arrResult.forEach(objRes => {
                let objItemStandard = arrItemStandard.find(e => e.internalid == objRes.custrecord_scv_pur_plan_ind_ndm);
                if(!objItemStandard) return;

                objRes.custrecord_scv_pur_plan_ind_ndm_display = objItemStandard.name;
                objRes.custrecord_scv_list_item_standard_categ = objItemStandard.custrecord_scv_list_item_standard_categ;
                objRes.custrecord_scv_list_item_standard_stadat = objItemStandard.custrecord_scv_list_item_standard_stadat;
                objRes.custrecord_scv_list_item_standard_endate = objItemStandard.custrecord_scv_list_item_standard_endate;
            });

            return arrResult;
        }

        const createPurchasePlan = (objResInput) =>{
            if(!!objResInput.estimated_delivery_date){
                objResInput.estimated_delivery_date = constFormat.parseDate(objResInput.estimated_delivery_date);
            }
            if(!!objResInput.inv_count_date){
                objResInput.inv_count_date = constFormat.parseDate(objResInput.inv_count_date);
            }
            if(!!objResInput.date_consump_from){
                objResInput.date_consump_from = constFormat.parseDate(objResInput.date_consump_from);
            }
            if(!!objResInput.date_consump_to){
                objResInput.date_consump_to = constFormat.parseDate(objResInput.date_consump_to);
            }

            let purPlanRec = record.create({type: "custompurchase_scv_purchase_plan", isDynamic: true});
            let itemSublistId = "item";

            lbf.setValueData(purPlanRec, [
                "subsidiary", "custbody_scv_estimated_delivery_date",
                "custbody_scv_inv_count_date", "custbody_scv_production_adjust_factor",
                "custbody_scv_date_consump_from", "custbody_scv_date_consump_to",
                "custbody_scv_pur_plan_para_apply", "custbody_scv_list_item_standard",
                "custbody_scv_pur_plan_type"
            ], [
                objResInput.subsidiary, objResInput.estimated_delivery_date,
                objResInput.inv_count_date, objResInput.production_adjust_factor,
                objResInput.date_consump_from, objResInput.date_consump_to,
                objResInput.pur_plan_para_apply, objResInput.list_item_standard,
                constPlanType.RECORDS.KE_HOACH_BAN_DAU.ID
            ]);

            let arrComponent = objResInput.component;
            for(let i = 0; i < arrComponent.length; i++){
                let objComponent = arrComponent[i];

                purPlanRec.selectNewLine(itemSublistId);

                lbf.setCurrentSublistValueData(purPlanRec, itemSublistId, [
                    "item", "custcol_scv_plan_use_by_month",
                    "custcol_scv_qty_consump_by_month", "custcol_scv_predicted_consump_avg",
                    "custcol_scv_plan_safety_days", "custcol_scv_qty_processing",
                    "custcol_scv_on_hand_item_pending", "custcol_scv_pur_plan_qty_po",
                    "custcol_scv_pur_plan_qty_po_remain", "custcol_scv_total_qty",
                    "custcol_scv_qty_requisition", "custcol_scv_mfg_plan_doc",
                    "quantity", "custcol_scv_market_number", "custcol_scv_line_no"
                ], [
                    objComponent.component_id, objComponent.component_qty,
                    objComponent.qty_inv_used, objComponent.predicted_consump_avg,
                    objComponent.plan_safety_days, objComponent.qty_processing,
                    objComponent.onhand_pending, objComponent.qty_po,
                    objComponent.qty_po_remain, objComponent.total_qty,
                    objComponent.qty_requistion, objComponent.mfg_plan_id,
                    0, objComponent.market_number, objComponent.line_no
                ])

                purPlanRec.commitLine(itemSublistId);
            }

            let purPlanRecId = purPlanRec.save({enableSourcing: false, ignoreMandatoryFields: true});

            return purPlanRecId;
        }

        const showPageMsg = () =>{
            let objResCacheMsg = constCache.getDataByUser("msg", true);
            if(!!objResCacheMsg.data){
                constForm.addPageInitMessage(objResCacheMsg.data)
            }

            let objResCacheQueue = constCache.getDataByUser("queueId");
            if(!!objResCacheQueue.data){
                let status_display = search.lookupFields({
                    type: constQueueJob.TYPE,
                    id: objResCacheQueue.data,
                    columns: "custrecord_scv_queue_job_status"
                }).custrecord_scv_queue_job_status[0].text;
                
                constForm.addPageInitMessage("Job js " + status_display);

                if(["Completed", "Cancel"].includes(status_display)){
                    constCache.removeDataByUser("queueId");
                }
            }
        }

        const testingSupportData = (arrParamsExcute) =>{
            let curUser = runtime.getCurrentUser();

            if(!curUser.email.includes("@suitecloud")) return;

            for(let i = 0; i < arrParamsExcute.length; i++){
                let objRes = arrParamsExcute[i];
                
                let detailTab = constForm.addTab({
                    id: "tab_detail_" + objRes.custpage_purplan_params,
                    label: "Result: " + objRes.custpage_purplan_params_display
                });

                addGridDxResultDetail(objRes.custpage_purplan_params, detailTab.id);

                let arrResPurPlan = getDataSource(objRes);

                arrResPurPlan.forEach((objResPurPlan, idx) => {
                    objResPurPlan.component.forEach(objResComponent => {
                        objResComponent.no_purplan = idx + 1;

                        constForm.setDataDx("custpage_sl_result_" + objRes.custpage_purplan_params, [
                            {
                                ...objResPurPlan,
                                ...objResComponent
                            }
                        ]);
                    });
                });

                let arrComponentOfAssembly = constDataStore.getDataStore("arrComponentOfAssembly");
                arrComponentOfAssembly.forEach((objComponentOfAssembly, idx) => {
                    objComponentOfAssembly.component.forEach(objResComponent => {
                        constForm.setDataDx("custpage_sl_comasb_" + objRes.custpage_purplan_params, [
                            {
                                ...objComponentOfAssembly,
                                ...objResComponent
                            }
                        ]);
                    });
                });
                
                let arrInvOnhandNoPend = constDataStore.getDataStore("arrInvOnhandNoPend");
                constForm.setDataDx("custpage_sl_ss0501_" + objRes.custpage_purplan_params, arrInvOnhandNoPend);

                let arrInvOnhandPend = constDataStore.getDataStore("arrInvOnhandPend");
                constForm.setDataDx("custpage_sl_ss0601_" + objRes.custpage_purplan_params, arrInvOnhandPend);

                let arrPlanQtyRemain = constDataStore.getDataStore("arrPlanQtyRemain");
                constForm.setDataDx("custpage_sl_ss07_" + objRes.custpage_purplan_params, arrPlanQtyRemain);

                let arrQtyITRByInb = constDataStore.getDataStore("arrQtyITRByInb");
                constForm.setDataDx("custpage_sl_ss11_" + objRes.custpage_purplan_params, arrQtyITRByInb);

                let arrPlanTransitSameSub = constDataStore.getDataStore("arrPlanTransitSameSub");
                constForm.setDataDx("custpage_sl_ss12_1_" + objRes.custpage_purplan_params, arrPlanTransitSameSub);

                let arrPlanTransitInterco = constDataStore.getDataStore("arrPlanTransitInterco");
                constForm.setDataDx("custpage_sl_ss12_2_" + objRes.custpage_purplan_params, arrPlanTransitInterco);
            }
        }

        const addGridDxResultDetail = (_paramsPurPlanId, _tabId) =>{
            constForm.addGridDx({
                id: "custpage_sl_result_" + _paramsPurPlanId,
                type: "grid",
                label: 'Purchase Plan/Component',
                tab: _tabId,
                columns: [
                    {dataField: "no_purplan", caption: "No. (Purchase Plan)", dataType: "string"},
                    {
                        caption: "Header",
                        columns:[
                            {dataField: "subsidiary", caption: "subsidiary", dataType: "string"},
                            {dataField: "estimated_delivery_date", caption: "estimated_delivery_date", dataType: "string"},
                            {dataField: "inv_count_date", caption: "inv_count_date", dataType: "string"},
                            {dataField: "production_adjust_factor", caption: "production_adjust_factor", dataType: "string"},
                            {dataField: "date_consump_from", caption: "date_consump_from", type: "string"},
                            {dataField: "date_consump_to", caption: "date_consump_to", type: "string"},
                            {dataField: "pur_plan_para_apply", caption: "pur_plan_para_apply", type: "string"},
                            {dataField: "list_item_standard", caption: "list_item_standard", type: "string"},
                            {dataField: "item_standard_startdt", caption: "item_standard_startdt", type: "string"},
                            {dataField: "item_standard_enddate", caption: "item_standard_enddate", type: "string"},
                        ]
                    },
                    {
                        caption: "Component",
                        columns:[
                            {dataField: "line_no", caption: "Line No Component", dataType: "string"},
                            {dataField: "component_id", caption: "Component ID", dataType: "string"},
                            {dataField: "custrecord_scv_pur_plan_ind_receipt_date", caption: "Ngày lấy tồn kho", dataType: "string"},
                            {dataField: "component_qty", caption: "component_qty", type: "number"},
                            {dataField: "qty_inv_used", caption: "qty_inv_used", type: "number"},
                            {dataField: "predicted_consump_avg", caption: "predicted_consump_avg", type: "number"},
                            {dataField: "plan_safety_days", caption: "plan_safety_days", type: "number"},
                            {dataField: "qty_processing", caption: "qty_processing", type: "number"},
                            {dataField: "onhand_pending", caption: "onhand_pending", type: "number"},
                            {dataField: "qty_po", caption: "qty_po", type: "number"},
                            {dataField: "qty_po_remain", caption: "qty_po_remain", type: "number"},
                            {dataField: "total_qty", caption: "total_qty", type: "number"},
                            {dataField: "qty_requistion", caption: "qty_requistion", type: "number"},
                            {dataField: "market_number", caption: "market_number", dataType: "string"},
                        ]
                    },
                ],
                optionsDx: {
                    columnMinWidth: 120
                }
            });

            constForm.addGridDx({
                id: "custpage_sl_comasb_" + _paramsPurPlanId,
                type: "grid",
                label: 'Component Of Assembly',
                tab: _tabId,
                columns: [
                    {
                        caption: "Header",
                        columns:[
                            {dataField: "mfg_plan_id", caption: "mfg_plan_id", dataType: "string"},
                            {dataField: "assembly_id", caption: "assembly_id", dataType: "string"},
                            {dataField: "transactionnumber", caption: "transactionnumber", dataType: "string"},
                            {dataField: "trandate", caption: "trandate", dataType: "string"},
                            {dataField: "unit", caption: "unit", dataType: "string"},
                            {dataField: "plan_qty", caption: "Plan Qty", type: "number"},
                        ]
                    },
                    {
                        caption: "Component",
                        columns:[
                            {dataField: "bom_id", caption: "bom_id", dataType: "string"},
                            {dataField: "component_id", caption: "component_id", dataType: "string"},
                            {dataField: "component_units", caption: "component_units", dataType: "string"},
                            {dataField: "component_itemtype", caption: "component_itemtype", dataType: "string"},
                            {dataField: "component_qty_rate", caption: "component_qty_rate", type: "number"},
                            {dataField: "component_qty", caption: "component_qty", type: "number"},
                        ]
                    }
                ]
            });

            constForm.addGridDx({
                id: "custpage_sl_ss0501_" + _paramsPurPlanId,
                type: "grid",
                label: 'Result SS05.1 (Inventory Onhand No Pending)',
                tab: _tabId,
                columns: [
                    {dataField: "item_id", caption: "item_id", dataType: "string"},
                    {dataField: "item", caption: "item", dataType: "string"},
                    {dataField: "subsidiary_display", caption: "subsidiary_display", dataType: "string"},
                    {dataField: "qty_available", caption: "qty_available", type: "number"},
                ]
            });

            constForm.addGridDx({
                id: "custpage_sl_ss0601_" + _paramsPurPlanId,
                type: "grid",
                label: 'Result SS06.1 (Inventory Onhand Pending)',
                tab: _tabId,
                columns: [
                    {dataField: "item_id", caption: "item_id", dataType: "string"},
                    {dataField: "item", caption: "item", dataType: "string"},
                    {dataField: "subsidiary_display", caption: "subsidiary_display", dataType: "string"},
                    {dataField: "qty_available", caption: "qty_available", type: "number"},
                ]
            });
            

            constForm.addGridDx({
                id: "custpage_sl_ss07_" + _paramsPurPlanId,
                type: "grid",
                label: 'Result SS07 (Plan Qty Remain)',
                tab: _tabId,
                columns: [
                    {dataField: "item_id", caption: "item_id", dataType: "string"},
                    {dataField: "item_display", caption: "item_display", dataType: "string"},
                    {dataField: "subsidiary_display", caption: "subsidiary_display", dataType: "string"},
                    {dataField: "custcol_scv_plan_qty", caption: "custcol_scv_plan_qty", type: "number"},
                    {dataField: "quantity", caption: "quantity", type: "number"},
                    {dataField: "qty_remain", caption: "qty_remain", type: "number"},
                ]
            });

            constForm.addGridDx({
                id: "custpage_sl_ss11_" + _paramsPurPlanId,
                type: "grid",
                label: 'Result SS11 (Nhập kho từ IR)',
                tab: _tabId,
                columns: [
                    {dataField: "item_id", caption: "item_id", dataType: "string"},
                    {dataField: "item", caption: "item", dataType: "string"},
                    {dataField: "subsidiary_display", caption: "subsidiary_display", dataType: "string"},
                    {dataField: "quantity", caption: "quantity", type: "number"},
                    {dataField: "ori_line_id", caption: "Ori Line ID", dataType: "string"},
                ]
            });

            constForm.addGridDx({
                id: "custpage_sl_ss12_1_" + _paramsPurPlanId,
                type: "grid",
                label: 'Result SS12.1',
                tab: _tabId,
                columns: [
                    {dataField: "_1_item_id", dataType: "string"},
                    {dataField: "_2_item_upc", dataType: "string"},
                    {dataField: "_3_item_name", dataType: "string"},
                    {dataField: "_4_in_transit", dataType: "number"},
                ]
            });

            constForm.addGridDx({
                id: "custpage_sl_ss12_2_" + _paramsPurPlanId,
                type: "grid",
                label: 'Result SS12.2',
                tab: _tabId,
                columns: [
                    {dataField: "_1_item_id", dataType: "string"},
                    {dataField: "_2_ma_vat_tu_hang_hoa", dataType: "string"},
                    {dataField: "_3_vat_tu_hang_hoa", dataType: "string"},
                    {dataField: "_4_in_transit", dataType: "number"},
                ]
            });
        }

        return {
            onRequest,
            getDataParamsPurPlanExcute,
            getDataSource,
            createPurchasePlan
        }

    });
