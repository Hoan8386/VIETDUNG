/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  13 Dec 2024		    Khanh Tran			    Init, create file. Khi mở PR view remaining từ PO. from mr.Hải(https://app.clickup.com/t/86cx295gc) 
 *  13 Dec 2024		    Khanh Tran			    Khi save PR cập nhật remaining vào KHMH from mr.Hải(https://app.clickup.com/t/86cxa8316) 
 */
define(['N/search', 'N/runtime', 'N/record',
    '../cons/scv_cons_search_pr_remaining_po.js',
    '../cons/scv_cons_search.js',
],
    function(search, runtime, record,
        constSearchPRRPO,
        constSearch,
    ) {
        const TYPE = "custompurchase_scv_purchase_request";
        const FIELD = {
            ID: "id",
            INACTIVE: "isinactive",
            NAME: "name"
        }
    
        const RECORDS = {
        }

        const viewQtyRemainFromPO = (scriptContext) => {
            if(!['edit', 'view'].includes(scriptContext.type)) return;
            if(runtime.executionContext !== runtime.ContextType.USER_INTERFACE) return;

            let curRec = scriptContext.newRecord;
            let sl = 'item';
            let subsidiaryId = curRec.getValue('subsidiary')
            let arrSS_prRPO = getDataSS_prRPO(subsidiaryId);
            for(let i = 0; i < curRec.getLineCount(sl); i++){
                let ori_lineid = curRec.getSublistValue(sl, 'custcol_scv_ori_lineid', i);
                let objSS = arrSS_prRPO.find(e => e.ori_lineid == ori_lineid);
                if(!objSS) continue;

                let conversion_rate = curRec.getSublistValue(sl, 'custcol_scv_conversion_rate', i) * 1;
                let qty_remaining = objSS.qty_remaining/conversion_rate;
                curRec.setSublistValue({sublistId: sl, fieldId: 'custcol_scv_pr_qty_remaining', line: i, value: qty_remaining});
            };
        }

        const getDataSS_prRPO = (subsidiaryId) => {
            let myFilters = [];
            if(subsidiaryId){
                myFilters.push(
                    search.createFilter({name: 'subsidiary', operator: 'anyof', values: subsidiaryId})
                );
            }

            return constSearchPRRPO.getDataSource(myFilters);
        }

        const updateQtyRemainToKHMH = (scriptContext) => {
            let triggerType = scriptContext.type;
            if(!['create', 'edit', 'delete'].includes(triggerType)) return;

            let curRec = scriptContext.newRecord;
            let purPlanId = curRec.getValue('custbody_scv_pur_plan_doc');
            if(!purPlanId) return;

            let arrLineCur = [], arrLineOld = [], arrDataUpd = [];
            let sl = 'item';
            for(let i = 0; i < curRec.getLineCount(sl); i++){
                let oriLineId = curRec.getSublistValue(sl, 'custcol_scv_ori_lineid', i);
                let plan_qty = curRec.getSublistValue(sl, 'custcol_scv_plan_qty', i) * 1;
                arrLineCur.push({oriLineId, plan_qty});
            }

            if(triggerType == 'edit'){
                let oldRec = scriptContext.oldRecord;
                for(let i = 0; i < oldRec.getLineCount(sl); i++){
                    let oriLineId = oldRec.getSublistValue(sl, 'custcol_scv_ori_lineid', i);
                    let plan_qty = oldRec.getSublistValue(sl, 'custcol_scv_plan_qty', i) * 1;
                    arrLineOld.push({oriLineId, plan_qty});
                }
            }

            arrLineCur.forEach(obj => {
                let objOld = arrLineOld.find(e => e.oriLineId == obj.oriLineId);
                if(objOld){
                    if(objOld.plan_qty != obj.plan_qty) arrDataUpd.push(obj)
                }else{
                    arrDataUpd.push(obj)
                }
            })

            arrLineOld.forEach(obj => {
                let objCur = arrLineCur.find(e => e.oriLineId == obj.oriLineId);
                if(!objCur){
                    arrDataUpd.push(obj)
                }
            })

            if(arrDataUpd.length == 0) return;

            let purPlanRec = record.load({type: 'custompurchase_scv_purchase_plan', id: purPlanId});
            for(let i = 0; i < purPlanRec.getLineCount(sl); i++){
                let oriLineId = purPlanRec.getSublistValue(sl, 'custcol_scv_ori_lineid', i);
                let objData = arrDataUpd.find( e => e.oriLineId == oriLineId);
                if(!objData) continue;

                let plan_qty = purPlanRec.getSublistValue(sl, 'custcol_scv_plan_qty', i) * 1; 
                let pur_plan_qty_remain = plan_qty - objData.plan_qty;
                purPlanRec.setSublistValue({sublistId: sl, fieldId: 'custcol_scv_pur_plan_qty_remain',  line: i, value: pur_plan_qty_remain});
            }

            purPlanRec.save({enableSourcing: false, ignoreMandatoryFields: false});
        }

        const getDataBySubsidiary = (_filters) => {
            let resultSearch =  constSearch.createSearchWithFilter({
                type: "transaction",
                filters:
                [
                    ["type","anyof","CuTrPrch117"], 
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
    
        return {
            TYPE,
            FIELD,
            RECORDS,
            viewQtyRemainFromPO,
            updateQtyRemainToKHMH, 
            getDataBySubsidiary
        };
        
    });
    