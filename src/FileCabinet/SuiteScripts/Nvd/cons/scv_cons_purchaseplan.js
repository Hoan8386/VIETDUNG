/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  13 Dec 2024         Huy Pham                Init & create file, Nút Calculate tính toán trên màn hình Kế hoạch mua hàng, from mr.Hải(https://app.clickup.com/t/86cx9p7x4)
 *  23 Dec 2024         Huy Pham                Bổ sung Calculate cho Số Lượng Nhu Cầu Mua , from mr.Hải
 *  21 Jan 2025         Huy Pham                Bổ sung Calculate custcol_scv_varience_qty, from mr.Hải(https://app.clickup.com/t/86cx9p7x4?comment=90160086340143)
 *  26 Jun 2025         Huy Pham                Update điều kiện hiển thị nút Calculate, from mr.Lương Phúc(https://app.clickup.com/t/86cx9p7x4?comment=90160118583324)
 *  05 Aug 2025         Khanh Tran              Update công thức tính custbody_scv_avg_date_supply, from mr.Lương Phúc(https://app.clickup.com/t/86cx9p7x4?comment=90160118583324)
 */
define(['N/search', 'N/url', 'N/runtime',
    '../lib/scv_lib_function.js',

    '../cons/scv_cons_search.js',
    '../cons/scv_cons_format.js',

    '../cons/scv_cons_approvalstatus.js',
    '../cons/scv_cons_search_purplan_pr_remain.js',
],
    function(search, url, runtime,
        lbf,

        constSearch,
        constFormat,

        constApprovalStatus,
        constSearchPurPlanPRRemain,
    ) {
        const TYPE = "custompurchase_scv_purchase_plan";
        const FIELD = {
            ID: "id",
            INACTIVE: "isinactive",
            NAME: "name"
        }
    
        const SUBLIST = {
            ITEM: {
                ID: "item",
                TYPE : "transactionline",
                FIELD: {}
            }
        }
    
        const RECORDS = {
        }

        const getDataSource = (_filters) => {
            let resultSearch =  constSearch.createSearchWithFilter({
                type: "customrecord_scv_pur_plan_ind",
                filters:
                [
                    ["isinactive","is","F"]
                ],
                columns:
                [
                    "internalid", "tranid"
                ]
            }, _filters);
            
            let arrResult = constSearch.fetchResultSearchRunEach(resultSearch, function(_objTmpl, _column){
                let objResTmpl = constSearch.getObjResultFromSearchByKey(_objTmpl, _column, [
                    "internalid", "tranid"
                ]);
    
                return objResTmpl;
            });
            
            return arrResult;
        }

        const addBtnCalculate = (_form, _curRec) =>{
            let isShowBtn = validBtnCalculate(_curRec);
            
            if(!isShowBtn) return;

            let urlScript = url.resolveScript({
                scriptId: 'customscript_scv_sl_svc_calc_purplan',
                deploymentId: 'customdeploy_scv_sl_svc_calc_purplan',
                params:{
                    recid: _curRec.id
                }
            });

            _form.addButton({
                id: "custpage_scv_btn_crt_apr_detail",
                label: "Calculate",
                functionName: `window.location.replace("${urlScript}")`
            });
        }
        
        const validBtnCalculate = (_curRec) =>{
            let apr_status = _curRec.getValue("custbody_scv_approval_status");
            if(![constApprovalStatus.RECORDS.PENDING_KHTH_APPROVE.ID, constApprovalStatus.RECORDS.OPEN.ID].includes(Number(apr_status))
            ){
                return false;
            }
            
            let itemSublistId = SUBLIST.ITEM.ID;
            let sizeItemSublist = _curRec.getLineCount(itemSublistId);
            
            for(let i = 0; i < sizeItemSublist; i++){
                let approve_qty = _curRec.getSublistValue(itemSublistId, "custcol_scv_plan_approve_qty", i);
                let plan_qty = _curRec.getSublistValue(itemSublistId, "custcol_scv_plan_qty", i);

                if(!lbf.isContainValue(approve_qty) || !lbf.isContainValue(plan_qty)){
                    return false;
                }
            }

            return true;
        }

        const calculatePurchasePlan = (_curRec) =>{
            let itemSublistId = SUBLIST.ITEM.ID;
            let sizeItemSublist = _curRec.getLineCount(itemSublistId);

            let inv_count_dt = _curRec.getValue("custbody_scv_inv_count_date");
            let est_deli_dt = _curRec.getValue("custbody_scv_estimated_delivery_date");
            let prod_adjust_factor = _curRec.getValue("custbody_scv_production_adjust_factor") * 1;

            let numDays_invCountDt_estDeliDt = constFormat.calcNumberDays(inv_count_dt, est_deli_dt);
            
            let objTotalLine = {
                total_qty: 0,
                qty_plan: 0,
                predicted_consump_avg: 0,
                qty_approve: 0
            }
            
            for(let i = 0; i < sizeItemSublist; i++){
                _curRec.selectLine(itemSublistId, i);

                let predicted_consump_avg = _curRec.getCurrentSublistValue(itemSublistId, "custcol_scv_predicted_consump_avg") * 1;
                let plan_safety_days = _curRec.getCurrentSublistValue(itemSublistId, "custcol_scv_plan_safety_days") * 1;
                let qty_processing = _curRec.getCurrentSublistValue(itemSublistId, "custcol_scv_qty_processing") * 1;
                let onhand_item_pending = _curRec.getCurrentSublistValue(itemSublistId, "custcol_scv_on_hand_item_pending") * 1;
                let qty_po = _curRec.getCurrentSublistValue(itemSublistId, "custcol_scv_pur_plan_qty_po") * 1;
                let qty_po_remain = _curRec.getCurrentSublistValue(itemSublistId, "custcol_scv_pur_plan_qty_po_remain") * 1;
                let total_qty = _curRec.getCurrentSublistValue(itemSublistId, "custcol_scv_total_qty") * 1;
                let qty_plan = _curRec.getCurrentSublistValue(itemSublistId, "custcol_scv_plan_qty") * 1;
                let qty_approve = _curRec.getCurrentSublistValue(itemSublistId, "custcol_scv_plan_approve_qty") * 1;
                
                objTotalLine.total_qty += total_qty;
                objTotalLine.qty_plan += qty_plan;
                objTotalLine.qty_approve += qty_approve;
                objTotalLine.predicted_consump_avg += predicted_consump_avg;

                let predictedConsumpAvg_prodAdjustFactor = (predicted_consump_avg * prod_adjust_factor) / 30;

                let safety_lead_time1 = qty_processing + qty_po + qty_po_remain + qty_approve;
                safety_lead_time1 = predictedConsumpAvg_prodAdjustFactor == 0 ? 0 : (safety_lead_time1/predictedConsumpAvg_prodAdjustFactor);
                safety_lead_time1 = Math.round(safety_lead_time1);
                safety_lead_time1 = safety_lead_time1 - numDays_invCountDt_estDeliDt;

                let safety_lead_time2 = qty_processing + onhand_item_pending + qty_po + qty_po_remain + qty_approve;
                safety_lead_time2 = predictedConsumpAvg_prodAdjustFactor == 0 ? 0 : (safety_lead_time2/predictedConsumpAvg_prodAdjustFactor);
                safety_lead_time2 = Math.round(safety_lead_time2);
                safety_lead_time2 = safety_lead_time2 - numDays_invCountDt_estDeliDt;

                let qty_requisition = (numDays_invCountDt_estDeliDt + plan_safety_days) * predictedConsumpAvg_prodAdjustFactor - total_qty;
                
                let varience_qty = qty_plan - qty_approve;

                _curRec.setCurrentSublistValue(itemSublistId, "custcol_scv_qty_requisition", qty_requisition);
                _curRec.setCurrentSublistValue(itemSublistId, "custcol_scv_safety_lead_time1", safety_lead_time1);
                _curRec.setCurrentSublistValue(itemSublistId, "custcol_scv_safety_lead_time2", safety_lead_time2);
                _curRec.setCurrentSublistValue(itemSublistId, "custcol_scv_varience_qty", varience_qty);

                _curRec.commitLine(itemSublistId);
            }

            let totalQty_qtyPlan = objTotalLine.total_qty + objTotalLine.qty_approve;
            let predictedConsumpAvg_prodAdjustFactor = (objTotalLine.predicted_consump_avg * prod_adjust_factor) / 30;
            let avg_date_supply = predictedConsumpAvg_prodAdjustFactor == 0 ? 0 : ((totalQty_qtyPlan)/predictedConsumpAvg_prodAdjustFactor);
            avg_date_supply = Math.round(avg_date_supply);
            avg_date_supply = avg_date_supply - numDays_invCountDt_estDeliDt;

            _curRec.setValue("custbody_scv_avg_date_supply", avg_date_supply);

            _curRec.save({enableSourcing: false, ignoreMandatoryFields: true})
        }

        const getDataBySubsidiary = (_filters) => {
            let resultSearch =  constSearch.createSearchWithFilter({
                type: "transaction",
                filters:
                [
                    ["type","anyof","CuTrPrch113"], 
                    "AND",
                    ["mainline","is","T"], 
                ],
                columns: ["internalid", "tranid"]
            }, _filters);
            
            let arrResult = constSearch.fetchResultSearchRunEach(resultSearch, function(_objTmpl, _column){
                let objResTmpl = constSearch.getObjResultFromSearchByKey(_objTmpl, _column, [
                    "internalid", "tranid"
                ]);
    
                return objResTmpl;
            });
            
            return arrResult;
        }

        const viewQtyRemainFromPurReq = (scriptContext) => {
            if(!['edit', 'view'].includes(scriptContext.type)) return;
            if(runtime.executionContext !== runtime.ContextType.USER_INTERFACE) return;

            let curRec = scriptContext.newRecord;
            let sl = 'item';
            let subsidiaryId = curRec.getValue('subsidiary')
            let arrReam = getDataSS_PurPlanPRRemain(subsidiaryId);
            for(let i = 0; i < curRec.getLineCount(sl); i++){
                let qty_remaining = 0;
                let oriLineId = curRec.getSublistValue(sl, 'custcol_scv_ori_lineid', i);
                let objSS = arrReam.find(e => e.oriLineId == oriLineId);
                if(objSS){
                    qty_remaining = objSS.sl_khmh_con_lai;
                }
        
                curRec.setSublistValue({sublistId: sl, fieldId: 'custcol_scv_pur_plan_qty_remain', line: i, value: qty_remaining});
            };
        }

        const getDataSS_PurPlanPRRemain = (subsidiaryId) => {
            let myFilters = [];
            if(subsidiaryId){
                myFilters.push(
                    search.createFilter({name: 'subsidiary', operator: 'anyof', values: subsidiaryId})
                );
            }

            return constSearchPurPlanPRRemain.getDataSource(myFilters);
        }

        return {
            TYPE,
            FIELD,
            SUBLIST,
            RECORDS,
            getDataSource,
            addBtnCalculate,
            validBtnCalculate,
            calculatePurchasePlan,
            getDataBySubsidiary,
            viewQtyRemainFromPurReq,
        };
        
    });
    