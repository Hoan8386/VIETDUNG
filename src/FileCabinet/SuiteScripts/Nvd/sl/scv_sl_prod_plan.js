/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  31 Dec 2024         Huy Pham			    Init, create file, Production Planning, from mr.Bính(https://app.clickup.com/t/86cxfpxbb)
 *  13 Jan 2025         Huy Pham                Bổ sung sửa Priority, from mr.Bính(https://app.clickup.com/t/86cxfpxbb?comment=90160085271329)
 *  17 Jan 2025         Huy Pham                Bổ sung biểu đồ cho Schedule, from mr.Bính
 *  17 Feb 2025         Huy Pham                Bổ sung chức năng, from mr.Việt (https://app.clickup.com/t/86cxfpxbb?comment=90160092412974)
 *  28 May 2025         Huy Pham			    Điều chỉnh/bổ sung, from mr.Trương Phúc(https://app.clickup.com/t/86cxfpxbb?comment=90160112390437)
 */
/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/redirect', 'N/runtime', 'N/search', 'N/record', 'N/dataset',
    '../olib/alasql/alasql.min@1.7.3.js', 

    '../cons/scv_cons_form.js',
    '../cons/scv_cons_format.js',
    '../cons/scv_cons_cache.js',
    '../cons/scv_cons_jqwidgets.js',
    
    '../cons/scv_cons_queue_job.js',
    '../cons/scv_cons_location.js',
    '../cons/scv_cons_entitygroup.js',
    '../cons/scv_cons_subsidiary.js',
    '../cons/scv_cons_locationtype.js',

    '../cons/scv_cons_dataset_calc_comp_time_wo.js',
    '../cons/scv_cons_search_workbench_capacity_cacl.js',
    '../cons/scv_cons_search_wo_with_multi_date.js',
    '../cons/scv_cons_search_maintenance_plan_by_woc.js',
    '../cons/scv_cons_search_mfg_lot.js'
],
    
    (redirect, runtime, search, record, dataset,
        alasql, 

        constForm,
        constFormat,
        constCache,
        constJQX,

        constQueueJob,
        constLocation,
        constEntityGroup,
        constSubsidiary,
        constLocationType,

        constDatasetCalcCompTimeWO,
        constSearchWorkbenchCapacityCalc,
        constSearchWOWithMultiDate,
        constSearchMaintenancePlanByWOC,
        constSearchMfgLot
    ) => {
        const JOB_SCRIPT = {
            ID: "customscript_scv_mr_prod_plan",
            DEPLOYID: "customdeploy_scv_mr_prod_plan",
            PARAMSID: "custscript_scv_mr_prod_plan_param"
        }
        const CUR_SCRIPT = Object.freeze({
            ID: "customscript_scv_sl_prod_plan",
            DEPLOYID_UI: "customdeploy_scv_sl_prod_plan",
            DEPLOYID_DATA: "customdeploy_scv_sl_prod_plan_svc"
        })
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            constForm.setContext(scriptContext);
            constForm.setServiceScript(CUR_SCRIPT.ID, CUR_SCRIPT.DEPLOYID_DATA);

            let request = scriptContext.request;
            let params = request.parameters;
            let curScript = runtime.getCurrentScript();
    
            if(curScript.deploymentId == CUR_SCRIPT.DEPLOYID_DATA) {
                let objResponse = {data: []};

                switch(params.action){
                    case "calculateProductionShedule":
                        objResponse.data = calculateProductionShedule(JSON.parse(params.body));
                    break;
				}

                constForm.write(objResponse);
            }
            else{
                if(request.method == "GET"){
                    onCreateFormUI(params);
    
                    showPageMsg();
    
                    constForm.writePage();
                }
                else{
                    
                    let objParams = {
                        custpage_subsidiary: params.custpage_subsidiary,
                        custpage_location: params.custpage_location,
                        custpage_workcenter: params.custpage_workcenter,
                        custpage_prod_startdt: params.custpage_prod_startdt,
                    }
    
                    let arrResultWOSchedule = getDataSublistDetail(request, "custpage_sl_woschedule", getColumnOfSublist("custpage_sl_woschedule"));;
                    
                    if(arrResultWOSchedule.length <= 10){
                        let arrMsg = [];
                        for(let i = 0; i < arrResultWOSchedule.length; i++){
                            try{
                                updateProductionSchedule(arrResultWOSchedule[i]);

                                arrMsg.push(arrResultWOSchedule[i].custpage_col_wo +": Updated.");
                            }
                            catch(err){
                                log.error("ERROR: Try-Catch: updateProductionSchedule", err);
                                arrMsg.push("Error: " + err.message);
                            }
                        }
                        constCache.putDataByUser("msg", arrMsg.join("<br/>"));
                    }
                    else{
                        let objParamsInput = {};
                        objParamsInput.params = {...objParams};
                        objParamsInput.data = arrResultWOSchedule;

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
        }

        const onCreateFormUI = (_params) =>{
            let form = constForm.createForm("PRODUCTION SCHEDULE", "../cs/scv_cs_sl_prod_plan.js");

            constForm.addPageLink([
                constDatasetCalcCompTimeWO.ID, constSearchWorkbenchCapacityCalc.ID,
                constSearchWOWithMultiDate.ID, constSearchMaintenancePlanByWOC.ID,
                constSearchMfgLot.ID
            ], true);

            let objPopupQueue = constQueueJob.getPopupQueueJobStatus(JOB_SCRIPT.ID, JOB_SCRIPT.DEPLOYID);

            constForm.addSubmitButton({label: "Update"});
            constForm.addButton({id: "custpage_btn_search", label: "Search", functionName: "onSearchResult()"});
            constForm.addButton({id: "custpage_btn_export", label: "Export", functionName: "onExportResult()"});
            constForm.addButton({
                id: "custpage_btn_queue", 
                label: "Queue Job", 
                functionName: `openStatusQueue('${objPopupQueue.url}', ${objPopupQueue.width}, ${objPopupQueue.height}, '${objPopupQueue.title}')`
            });

            let curUser = runtime.getCurrentUser();

            if(!_params.custpage_subsidiary){
                _params.custpage_subsidiary = curUser.subsidiary;
            }

            let mainGrp = constForm.addFieldGroup({id: "fieldgrp_main", label: "Filter Parameters"});
            let defaultGrp = constForm.addFieldGroup({id: "fieldgrp_default", label: "Default First Running Lot"});

            constForm.addField({
                id: 'custpage_subsidiary', label: 'Công ty/Chi nhánh',
                type: "select", container: mainGrp.id
            }, true, {
                lookup: {
                    data: constSubsidiary.getDataSubsidiaryByUserRole(),
                    valueExpr: "id", displayExpr: "namenohierarchy",
                },
                defaultValue: !!_params.custpage_subsidiary ? _params.custpage_subsidiary : ""
            });

            constForm.addField({
                id: 'custpage_location', label: 'Kho',
                type: "select", container: mainGrp.id
            }, true, {
                lookup: {
                    data: getDataLocation(_params.custpage_subsidiary),
                    displayExpr: "name", valueExpr: "internalid"
                },
                defaultValue: !!_params.custpage_location ? _params.custpage_location : ""
            });
            
            constForm.addField({
                id: 'custpage_workcenter', label: 'Máy',
                type: "select", container: mainGrp.id
            }, true, {
                lookup: {
                    data: getDataWorkCenter(_params.custpage_location),
                    displayExpr: "groupname", valueExpr: "internalid"
                },
                defaultValue: !!_params.custpage_workcenter ? _params.custpage_workcenter : ""
            });
            
            constForm.addField({
                id: 'custpage_prod_startdt', label: 'Prod. Start Date',
                type: "datetimetz", container: defaultGrp.id
            }, false, {
                defaultValue: !!_params.custpage_prod_startdt ? _params.custpage_prod_startdt : ""
            });

            let woForScheduleTab = constForm.addTab({id: "tab_schedule", label: "WO for Scheduling"});
            let woForScheduleChartTab = constForm.addTab({id: "tab_schedulechart", label: "WO for Scheduling (Gantt)"});
            let latestWOProdDateTab = constForm.addTab({id: "tab_assbuild", label: "Latest WO Prod. Date"});
            let wocMantaintenanceTab = constForm.addTab({id: "tab_maintenance", label: "WOC Maintenance"});

            let scheduleSublist = constForm.addSublist({
                id : "custpage_sl_woschedule",
                type : "list",
                label : 'Result',
                tab: woForScheduleTab.id
            });
            scheduleSublist.addButton({
                id : 'custpage_scv_btn_markall',
                label : 'Mark All',
                functionName: `markAllOfSublist('custpage_sl_woschedule', 'T')`
            });
            scheduleSublist.addButton({
                id : 'custpage_scv_btn_unmarkall',
                label : 'Unmark All',
                functionName: `markAllOfSublist('custpage_sl_woschedule', 'F')`
            });
            scheduleSublist.addButton({id: "custpage_btn_calc", label: "Calculate", functionName: "onCalculate()"});
            scheduleSublist.addButton({id: "custpage_btn_updpriority", label: "Update Priority", functionName: "updatePriority()"});
            scheduleSublist.addButton({id: "custpage_btn_togantt", label: "Update To Gantt", functionName: "updateToGantt()"});
            scheduleSublist.addButton({id: "custpage_btn_fromgantt", label: "Update From Gantt", functionName: "updateFromGantt()"});
            constForm.addFieldOfSublist("custpage_sl_woschedule", getColumnOfSublist("custpage_sl_woschedule"));

            addGantt(form, woForScheduleChartTab.id);

            constForm.addSublist({
                id : "custpage_sl_wolatest",
                type : "LIST",
                label : 'Result',
                tab: latestWOProdDateTab.id
            });
            constForm.addFieldOfSublist("custpage_sl_wolatest", getColumnOfSublist("custpage_sl_wolatest"));

            constForm.addSublist({
                id : "custpage_sl_wocmaintenance",
                type : "LIST",
                label : 'Result',
                tab: wocMantaintenanceTab.id
            });
            constForm.addFieldOfSublist("custpage_sl_wocmaintenance", getColumnOfSublist("custpage_sl_wocmaintenance"));

            if(_params.isSearch == "T"){
                let objResDS = getDataSource(_params);
    
                constForm.setDataOfSublist("custpage_sl_woschedule", objResDS.arrResultWOSchedule);
                constForm.setDataOfSublist("custpage_sl_wolatest", objResDS.arrResultWOLatest);
                constForm.setDataOfSublist("custpage_sl_wocmaintenance", objResDS.arrResultWOCMaintenance);
            }
        }

        const getColumnOfSublist = (_sublistId) =>{
            let arrColumn = [];
            
            if(_sublistId == "custpage_sl_woschedule"){
                arrColumn.push(
                    {id: "custpage_col_chk", label: "Chọn", type: "checkbox", displayType: "entry"},
                    {id: "custpage_col_priority", label: "Ưu tiên", type: "float", displayType: "entry"},
                    {id: "custpage_col_tksx", label: "Số thống kê sản xuất", type: "text"},
                    {id: "custpage_col_assembly", label: "Thành phẩm", type: "select", source: "item"},
                    {id: "custpage_col_qty", label: "Số lượng", type: "float"},
                    {id: "custpage_col_qty_sx", label: "Số lượng đã sản xuất", type: "float"},
                    {id: "custpage_col_qtyrem", label: "Số lượng còn lại", type: "float"},
                    {id: "custpage_col_qtyrem_3ly", label: "Số lượng còn lại (3ly)", type: "float"},
                    {id: "custpage_col_estcomtime", label: "TG ước tính hoàn thành (Giờ)", type: "float"},
                    {id: "custpage_col_reqdt", label: "Ngày cần hàng", type: "text"},
                    {id: "custpage_col_prodstartdt", label: "Ngày dự kiến bắt đầu SX", type: "datetimetz", displayType: "entry", displaySize: {width: 25, height: 60}},
                    {id: "custpage_col_prodenddt", label: "Ngày dự kiến hoàn thành SX", type: "datetimetz", displayType: "entry", displaySize: {width: 25, height: 60}},
                    {id: "custpage_col_prodlotno", label: "Số lô", type: "text"},
                    {id: "custpage_col_memo", label: "Ghi chú", type: "textarea"},
                    {id: "custpage_col_wo", label: "Số lệnh SX", type: "text"},
                    {id: "custpage_col_workcenter", label: "Máy", type: "select", source: "-8"},
                    {id: "custpage_col_date", label: "Ngày", type: "text"},
                    {id: "custpage_col_location", label: "Kho", type: "select", source: "location"},
                    {id: "custpage_col_subsidiary", label: "Công ty/Chi nhánh", type: "select", source: "subsidiary",},
                    {id: "custpage_col_idxprocess", label: "Index Process", type: "text", displayType: "hidden"},
                    {id: "custpage_col_wo_id", label: "internalid", type: "text", displayType: "hidden"},
                    {id: "custpage_col_workcenter_display", label: "Work Center Display", type: "text", displayType: "hidden"},
                );
            }
            else if(_sublistId == "custpage_sl_wolatest"){
                arrColumn.push(
                    {id: "custpage_col_subsidiary", label: "Công ty/Chi nhánh", type: "select", source: "subsidiary"},
                    {id: "custpage_col_location", label: "Kho", type: "select", source: "location"},
                    {id: "custpage_col_workcenter", label: "Máy", type: "select", source: "-8"},
                    {id: "custpage_col_reqdt", label: "Ngày cần hàng", type: "text"},
                    {id: "custpage_col_prodenddt", label: "Ngày hoàn thành SX gần nhất", type: "text"},
                );
            }
            else if(_sublistId == "custpage_sl_wocmaintenance"){
                arrColumn.push(
                    {id: "custpage_col_subsidiary", label: "Công ty/Chi nhánh", type: "select", source: "subsidiary"},
                    {id: "custpage_col_location", label: "Kho", type: "select", source: "location"},
                    {id: "custpage_col_workcenter", label: "Máy", type: "select", source: "-8"},
                    {id: "custpage_col_planmaint_startdt", label: "Kế hoạch bảo dưỡng chi tiết : KHBD - Từ ngày", type: "text"},
                    {id: "custpage_col_planmaint_enddt", label: "Kế hoạch bảo dưỡng chi tiết : KHBD - Đến ngày", type: "text"},
                );
            }

            return arrColumn;
        }

        const getDataSource = (_params) =>{
            let arrEntityGroup = getDataEntityGroup(_params);

            let arrCalcCompTimeWO = getDataCalcCompletionTimeWO(_params);

            let arrWOWithMultiDate = getDataWOWithMultiDate(_params);

            let arrMaintenancePlan = getDataMaintenancePlanByWOC(_params);

            let arrResultWOSchedule = [], arrResultWOLatest = [], arrResultWOCMaintenance = [];

            let arrCalcCompTimeWOGroup = alasql(`SELECT DISTINCT subsidiary, location, 
                    custbody_mfgmob_workcenter
                FROM ?`, [arrCalcCompTimeWO]);

            for(let idxGroup = 0; idxGroup < arrCalcCompTimeWOGroup.length; idxGroup++){
                let objCalcCompTimeWOGroup = arrCalcCompTimeWOGroup[idxGroup];

                let idxProcess = idxGroup;

                let arrCalcCompTimeWODetail = arrCalcCompTimeWO.filter(e => e.subsidiary == objCalcCompTimeWOGroup.subsidiary
                    && e.location == objCalcCompTimeWOGroup.location
                    && e.custbody_mfgmob_workcenter == objCalcCompTimeWOGroup.custbody_mfgmob_workcenter
                );

                for(let i = 0; i < arrCalcCompTimeWODetail.length; i++){
                    let objCalcCommpTimeWO = arrCalcCompTimeWODetail[i];
    
                    let objRes = {};
    
                    objRes.line = i;
                    objRes.custpage_col_chk = "T";
                    objRes.custpage_col_idxprocess = idxProcess;
                    objRes.custpage_col_memo = objCalcCommpTimeWO.memo;
                    objRes.custpage_col_priority = objCalcCommpTimeWO.priority;
                    objRes.custpage_col_assembly = objCalcCommpTimeWO.item;
                    objRes.custpage_col_wo = objCalcCommpTimeWO.tranid;
                    objRes.custpage_col_qty = objCalcCommpTimeWO.quantity;
                    objRes.custpage_col_qtyrem = objCalcCommpTimeWO.quantity - objCalcCommpTimeWO.quantityshiprecv;
                    objRes.custpage_col_estcomtime = objCalcCommpTimeWO.totaltime_hour||0;
                    objRes.custpage_col_reqdt = objCalcCommpTimeWO.requesteddate;
                    objRes.custpage_col_prodstartdt = objCalcCommpTimeWO.custbody_scv_prod_start_date;
                    objRes.custpage_col_prodenddt = objCalcCommpTimeWO.custbody_scv_prod_end_date;
                    objRes.custpage_col_location = objCalcCommpTimeWO.location;
                    objRes.custpage_col_date = objCalcCommpTimeWO.trandate;
                    objRes.custpage_col_workcenter = objCalcCommpTimeWO.custbody_mfgmob_workcenter;
                    objRes.custpage_col_prodlotno = objCalcCommpTimeWO.custbody_scv_assembly_lot;
                    objRes.custpage_col_subsidiary = objCalcCommpTimeWO.subsidiary;
                    objRes.custpage_col_wo_id = objCalcCommpTimeWO.internalid;
                    objRes.custpage_col_tksx = objCalcCommpTimeWO.custbody_scv_so_thong_ke_sx;
                    objRes.custpage_col_qty_sx = objCalcCommpTimeWO.quantityshiprecv;
                    objRes.custpage_col_qtyrem_3ly = objCalcCommpTimeWO.quantity_remain_3ly;

                    objRes.custpage_col_workcenter_display = "";
                    let objEntityGroup = arrEntityGroup.find(e => e.internalid == objRes.custpage_col_workcenter);
                    if(!!objEntityGroup){
                        objRes.custpage_col_workcenter_display = objEntityGroup.groupname;
                    }
    
                    arrResultWOSchedule.push(objRes);
                }
            }

            for(let i = 0; i < arrWOWithMultiDate.length; i++){
                let objWOWithMultiDate = arrWOWithMultiDate[i];

                let objRes = {};
                
                objRes.custpage_col_subsidiary = objWOWithMultiDate.subsidiary;
                objRes.custpage_col_location = objWOWithMultiDate.location;
                objRes.custpage_col_workcenter = objWOWithMultiDate.custbody_mfgmob_workcenter;
                objRes.custpage_col_reqdt = objWOWithMultiDate.requesteddate;
                objRes.custpage_col_prodenddt = objWOWithMultiDate.max_prod_enddt;

                arrResultWOLatest.push(objRes);
            }
            
            for(let i = 0; i < arrMaintenancePlan.length; i++){
                let objMaintenancePlan = arrMaintenancePlan[i];

                let objRes = {};
                
                objRes.custpage_col_subsidiary = objMaintenancePlan.custrecord_scv_cmms_mp_subsidiary;
                objRes.custpage_col_location = objMaintenancePlan.custrecord_scv_cmms_mp_location;
                objRes.custpage_col_workcenter = objMaintenancePlan.custrecord_scv_cmms_mp_work_center;
                objRes.custpage_col_planmaint_startdt = objMaintenancePlan.custrecord_scv_cmms_mp_fromdate_l;
                objRes.custpage_col_planmaint_enddt = objMaintenancePlan.custrecord_scv_cmms_mp_todate_l;

                arrResultWOCMaintenance.push(objRes);
            }

            let objResCalc = calculateProductionShedule({
                params: _params,
                custpage_sl_woschedule: arrResultWOSchedule,
                custpage_sl_wolatest: arrResultWOLatest,
                custpage_sl_wocmaintenance: arrResultWOCMaintenance
            });

            arrResultWOSchedule = objResCalc.custpage_sl_woschedule;

            return {
                arrResultWOSchedule: arrResultWOSchedule,
                arrResultWOLatest: arrResultWOLatest,
                arrResultWOCMaintenance: arrResultWOCMaintenance
            };
        }

        const calculateProductionShedule = (_objDataCalc) =>{
            let params = _objDataCalc.params;

            let arrResultWOSchedule = _objDataCalc.custpage_sl_woschedule;
            let arrResultWOLatest = _objDataCalc.custpage_sl_wolatest;
            let arrResultWOCMaintenance = _objDataCalc.custpage_sl_wocmaintenance;
            
            let arrWOCMaintenanceDate = convertWOCMaintenanceDate(arrResultWOCMaintenance);

            let arrHoliday = getDataHoliDay();

            let arrWorkbenchCapacityCalc = getDataWorkbenchCapacitycalc(params);

            let prodStartDate = params.custpage_prod_startdt;

            let arrProcessGroup = alasql(`SELECT DISTINCT custpage_col_idxprocess
                FROM ?`, [arrResultWOSchedule]);
            for(let idxGroup = 0; idxGroup < arrProcessGroup.length; idxGroup++){
                let objProcessGroup = arrProcessGroup[idxGroup];

                let arrResultWOScheduleDetail = arrResultWOSchedule.filter(e => e.custpage_col_idxprocess == objProcessGroup.custpage_col_idxprocess);
                let objResDetailFirst = arrResultWOScheduleDetail[0];

                let objWorkbenchCapacityCalc = arrWorkbenchCapacityCalc.find(e => e.custrecord_scv_work_bench_subsidiary == objResDetailFirst.custpage_col_subsidiary
                    && e.custrecord_scv_wo_center_location == objResDetailFirst.custpage_col_location
                    && e.custrecord_scv_work_bench_work_center == objResDetailFirst.custpage_col_workcenter
                );
                
                let arrWorkOfWeek = !!objWorkbenchCapacityCalc ? convertWorkbenchCalendarToDayOfWeek(objWorkbenchCapacityCalc) : [];
                if(arrWorkOfWeek.length == 0) continue;

                let objWOCMaintenanceDate = arrWOCMaintenanceDate.find(e => e.custpage_col_subsidiary == objResDetailFirst.custpage_col_subsidiary
                    && e.custpage_col_location == objResDetailFirst.custpage_col_location
                    && e.custpage_col_workcenter == objResDetailFirst.custpage_col_workcenter
                );
                let arrMaintenanceDate = !!objWOCMaintenanceDate ? objWOCMaintenanceDate.maintenanceDate : [];

                if(!prodStartDate){
                    let objWOLatest = arrResultWOLatest.find(e => e.custpage_col_subsidiary == objResDetailFirst.custpage_col_subsidiary
                        && e.custpage_col_location == objResDetailFirst.custpage_col_location
                        && e.custpage_col_workcenter == objResDetailFirst.custpage_col_workcenter
                    );
                    
                    if(!!objWOLatest && !!objWOLatest.custpage_col_prodenddt){
                        let latestProdEndDate = constFormat.parseDateTime(objWOLatest.custpage_col_prodenddt);
                        prodStartDate = constFormat.formatDateTime(latestProdEndDate);
                    }
                }
                
                for(let i = 0; i < arrResultWOScheduleDetail.length; i++){
                    let objResDetail = arrResultWOScheduleDetail[i];

                    if(i == 0){
                        objResDetail.custpage_col_prodstartdt = prodStartDate;
                    }
                    else{
                        objResDetail.custpage_col_prodstartdt = arrResultWOScheduleDetail[i - 1].custpage_col_prodenddt;
                    }

                    let workHours = objResDetail.custpage_col_estcomtime||0;
                    let curStartDate = objResDetail.custpage_col_prodstartdt;

                    let curEndDate = getProductionEndDate(curStartDate, workHours, arrWorkOfWeek, arrMaintenanceDate, arrHoliday)

                    objResDetail.custpage_col_prodenddt = constFormat.formatDateTime(curEndDate);
                }
            }

            return {
                params: params,
                custpage_sl_woschedule: arrResultWOSchedule,
                custpage_sl_wolatest: arrResultWOLatest,
                custpage_sl_wocmaintenance: arrResultWOCMaintenance,
            };
        }
        
        const getProductionEndDate = (_runDateTime, _remainHours, _workOfWeek, _arrMaintenanceDate, _arrHoliday) =>{
            let remainMinute = _remainHours * 60;
            let diffHours = 15;
            let resDate = constFormat.parseDateTime(_runDateTime);
            resDate = constFormat.addHours(resDate, diffHours)
            
            let resDate_yyyymmdd = constFormat.dateTimeToChar(resDate, "YYYYMMDD");
            let resDate_hh24mi = constFormat.dateTimeToChar(resDate, "HH24MI");
            let resDate_minute = getMinuteOfDayByHH24MI(resDate_hh24mi);
            let minuteWorkOfDay = 0;

            let isHoliday = false, isMaintenance = false;
            if(_arrMaintenanceDate.length > 0){
                let idxMaintenanceDate = _arrMaintenanceDate.findIndex(e => e.start <= resDate_yyyymmdd && e.end >= resDate_yyyymmdd);
                if(idxMaintenanceDate > -1){
                    isMaintenance = true;
                }
            }
            if(_arrHoliday.length > 0){
                let idxMaintenanceDate = _arrHoliday.findIndex(date_yyyymmdd => date_yyyymmdd == resDate_yyyymmdd);
                if(idxMaintenanceDate > -1){
                    isHoliday = true;
                }
            }

            if(isHoliday || isMaintenance){
                resDate = new Date(resDate.getFullYear(), resDate.getMonth(), resDate.getDate() + 1, 0, 0);

                resDate = constFormat.formatDateTime(constFormat.addHours(resDate, diffHours * (-1)));

                resDate = getProductionEndDate(resDate, remainMinute / 60, _workOfWeek, _arrMaintenanceDate, _arrHoliday);
            }
            else{
                let dayOfWeek = resDate.getDay();
                let objWorkTimeOfDay = _workOfWeek.find(e => e.day == dayOfWeek);
                let arrWorkTime = objWorkTimeOfDay.workTime;
                for(let i = 0; i < arrWorkTime.length; i++){
                    let objWorkTime = arrWorkTime[i];

                    if(!objWorkTime.start || !objWorkTime.end) continue;
    
                    let startMinute = getMinuteOfDayByHH24MI(objWorkTime.start);
                    let endMinute = getMinuteOfDayByHH24MI(objWorkTime.end);
                    
                    if(resDate_minute < startMinute){
                        minuteWorkOfDay += startMinute - resDate_minute;
                        resDate_minute = startMinute;
                    }
                    
                    if(resDate_minute >= startMinute && resDate_minute <= endMinute){
                        let diffMinute = endMinute - resDate_minute;
    
                        if(remainMinute <= diffMinute){
                            resDate_minute += diffMinute;
                            minuteWorkOfDay += remainMinute;
                            remainMinute = 0;
                            break;
                        }
                        else{
                            remainMinute -= diffMinute;
                            resDate_minute = endMinute;
                            minuteWorkOfDay += diffMinute;
                            
                        }
                    }
                }
                
                resDate = constFormat.addMinutes(resDate, minuteWorkOfDay);
    
                if(remainMinute > 0){
                    resDate = new Date(resDate.getFullYear(), resDate.getMonth(), resDate.getDate() + 1, 0, 0);
    
                    resDate = constFormat.formatDateTime(constFormat.addHours(resDate, diffHours * (-1)));
    
                    resDate = getProductionEndDate(resDate, remainMinute / 60, _workOfWeek, _arrMaintenanceDate, _arrHoliday);
                }
                else{
                    resDate = constFormat.formatDateTime(constFormat.addHours(resDate, diffHours * (-1)));
                }
            }

            return resDate;
        }

        const getDataHoliDay = () =>{
            let arrHoliday = [];//["20241231", "20250101"];

            return arrHoliday;
        }

        const convertWOCMaintenanceDate = (_arrWOCMaintenance) =>{
            let arrResult = [];

            let arrGroup = alasql(`SELECT DISTINCT custpage_col_subsidiary, custpage_col_location,
                    custpage_col_workcenter
                FROM ?`, [_arrWOCMaintenance]);

            for(let i = 0; i < arrGroup.length; i++){
                let objGroup = arrGroup[i];

                let objRes = {...objGroup};
                objRes.maintenanceDate = [];

                let arrDetail = _arrWOCMaintenance.filter(e => e.custpage_col_subsidiary == objGroup.custpage_col_subsidiary
                    && e.custpage_col_location == objGroup.custpage_col_location
                    && e.custpage_col_workcenter == objGroup.custpage_col_workcenter
                );
                for(let j = 0; j < arrDetail.length; j++){
                    let objDetail = arrDetail[j];

                    let objMaintenance = {
                        start: constFormat.dateToChar(objDetail.custpage_col_planmaint_startdt), 
                        end: constFormat.dateToChar(objDetail.custpage_col_planmaint_enddt)
                    }

                    objRes.maintenanceDate.push(objMaintenance);
                }

                arrResult.push(objRes);
            }

            return arrResult;
        }

        const getMinuteOfDayByHH24MI = (_hh24mi) =>{
            return _hh24mi.substring(0,2) * 60 + (_hh24mi.substring(2,4) * 1);
        }

        const convertWorkbenchCalendarToDayOfWeek = (_workbenchCalendar) =>{
            return [
                {
                    day: 0, 
                    workTime: [
                        {
                            start: constFormat.timeOfDayToChar(_workbenchCalendar.custrecord_scv_wo_center_sun_start, "HH24MI"), 
                            end: constFormat.timeOfDayToChar(_workbenchCalendar.custrecord_scv_wo_center_sun_end, "HH24MI")
                        }
                    ]
                },
                {
                    day: 1, 
                    workTime: [
                        {
                            start: constFormat.timeOfDayToChar(_workbenchCalendar.custrecord_scv_wo_center_mon_start, "HH24MI"), 
                            end: constFormat.timeOfDayToChar(_workbenchCalendar.custrecord_scv_wo_center_mon_end, "HH24MI")
                        }
                    ]
                },
                {
                    day: 2, 
                    workTime: [
                        {
                            start: constFormat.timeOfDayToChar(_workbenchCalendar.custrecord_scv_wo_center_tue_start, "HH24MI"), 
                            end: constFormat.timeOfDayToChar(_workbenchCalendar.custrecord_scv_wo_center_tue_end, "HH24MI")
                        }
                    ]
                },
                {
                    day: 3, 
                    workTime: [
                        {
                            start: constFormat.timeOfDayToChar(_workbenchCalendar.custrecord_scv_wo_center_wed_start, "HH24MI"), 
                            end: constFormat.timeOfDayToChar(_workbenchCalendar.custrecord_scv_wo_center_wed_end, "HH24MI")
                        }
                    ]
                },
                {
                    day: 4, 
                    workTime: [
                        {
                            start: constFormat.timeOfDayToChar(_workbenchCalendar.custrecord_scv_wo_center_thu_start, "HH24MI"), 
                            end: constFormat.timeOfDayToChar(_workbenchCalendar.custrecord_scv_wo_center_thu_end, "HH24MI")
                        }
                    ]
                },
                {
                    day: 5, 
                    workTime: [
                        {
                            start: constFormat.timeOfDayToChar(_workbenchCalendar.custrecord_scv_wo_center_fri_start, "HH24MI"), 
                            end: constFormat.timeOfDayToChar(_workbenchCalendar.custrecord_scv_wo_center_fri_end, "HH24MI")
                        }
                    ]
                },
                {
                    day: 6,
                    workTime: [
                        {
                            start: constFormat.timeOfDayToChar(_workbenchCalendar.custrecord_scv_wo_center_sat_start, "HH24MI"), 
                            end: constFormat.timeOfDayToChar(_workbenchCalendar.custrecord_scv_wo_center_sat_end, "HH24MI")
                        }
                    ]
                }
            ]
        }

        const getDataEntityGroup = (_params) => {
            let myFilters = [];

            if(!!_params.custpage_workcenter){
                myFilters.push(search.createFilter({
                    name: 'internalid', 
                    operator: "anyof", 
                    values: _params.custpage_workcenter.split(",")
                }))
            }

            let arrResult = constEntityGroup.getDataSource(myFilters);

            return arrResult;
        }

        const getDataCalcCompletionTimeWO = (_params) =>{
            let arrCondition = [];

            if(!!_params.custpage_subsidiary){
                arrCondition.push(dataset.createCondition({
                    column: dataset.createColumn({
                        fieldId: "subsidiary",
                        join: dataset.createJoin({
                            fieldId: "transactionlines"
                        })
                    }), 
                    operator: "ANY_OF", 
                    values: [_params.custpage_subsidiary]
                }));
            }
            if(!!_params.custpage_location){
                arrCondition.push(dataset.createCondition({
                    column: dataset.createColumn({
                        fieldId: "location",
                        join: dataset.createJoin({
                            fieldId: "transactionlines"
                        })
                    }), 
                    operator: "ANY_OF", 
                    values: [_params.custpage_location]
                }));
            }
            if(!!_params.custpage_workcenter){
                arrCondition.push(dataset.createCondition({
                    column: dataset.createColumn({
                        fieldId: "custbody_mfgmob_workcenter"
                    }), 
                    operator: "ANY_OF", 
                    values: _params.custpage_workcenter.split(",")
                }));
            }
            /* if(!!_params.custpage_fromdt){
                arrCondition.push(dataset.createCondition({
                    column: dataset.createColumn({
                        fieldId: "requesteddate",
                        join: dataset.createJoin({
                            fieldId: "transactionlines"
                        })
                    }), 
                    operator: "ON_OR_AFTER", 
                    values: [_params.custpage_fromdt]
                }));
            }
            if(!!_params.custpage_todt){
                arrCondition.push(dataset.createCondition({
                    column: dataset.createColumn({
                        fieldId: "requesteddate",
                        join: dataset.createJoin({
                            fieldId: "transactionlines"
                        })
                    }), 
                    operator: "ON_OR_BEFORE", 
                    values: [_params.custpage_todt]
                }));
            } */

            let arrResult = constDatasetCalcCompTimeWO.getDataSource(arrCondition);

            arrResult = alasql(`SELECT *
                FROM ?
                ORDER BY custbody_mfgmob_workcenter ASC,
                        priority::NUMBER ASC,
                        custbody_scv_so_thong_ke_sx ASC,
                        custbody_scv_assembly_lot ASC
                `, [arrResult])

            //custbody_scv_prod_start_date_yyyymmddhh24miss ASC,
            //custbody_scv_prod_end_date_yyyymmddhh24miss ASC,
            return arrResult;
        }

        const getDataWorkbenchCapacitycalc = (_params) =>{
            let myFilters = [];

            if(!!_params.custpage_subsidiary){
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_work_bench_subsidiary', 
                    operator: "anyof", 
                    values: _params.custpage_subsidiary
                }))
            }
            if(!!_params.custpage_location){
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_wo_center_location', 
                    join: "custrecord_scv_work_bench_woc_setting",
                    operator: "anyof", 
                    values: _params.custpage_location
                }))
            }
            if(!!_params.custpage_workcenter){
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_work_bench_work_center', 
                    operator: "anyof", 
                    values: _params.custpage_workcenter.split(",")
                }))
            }

            let arrResult = constSearchWorkbenchCapacityCalc.getDataSource(myFilters);
            
            return arrResult;
        }

        const getDataWOWithMultiDate = (_params) =>{
            let myFilters = [];

            if(!!_params.custpage_subsidiary){
                myFilters.push(search.createFilter({
                    name: 'subsidiary', 
                    operator: "anyof", 
                    values: _params.custpage_subsidiary
                }))
            }
            if(!!_params.custpage_location){
                myFilters.push(search.createFilter({
                    name: 'location', 
                    operator: "anyof", 
                    values: _params.custpage_location
                }))
            }
            if(!!_params.custpage_workcenter){
                myFilters.push(search.createFilter({
                    name: 'custbody_mfgmob_workcenter', 
                    operator: "anyof", 
                    values: _params.custpage_workcenter.split(",")
                }))
            }

            let arrResult = constSearchWOWithMultiDate.getDataSource(myFilters);

            return arrResult;
        }

        const getDataMaintenancePlanByWOC = (_params) =>{
            let myFilters = [];

            if(!!_params.custpage_subsidiary){
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_cmms_mp_subsidiary', 
                    operator: "anyof", 
                    values: _params.custpage_subsidiary
                }))
            }
            if(!!_params.custpage_location){
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_cmms_mp_location', 
                    operator: "anyof", 
                    values: _params.custpage_location
                }))
            }
            if(!!_params.custpage_workcenter){
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_cmms_mp_work_center', 
                    operator: "anyof", 
                    values: _params.custpage_workcenter.split(",")
                }))
            }

            let arrResult = constSearchMaintenancePlanByWOC.getDataSource(myFilters);

            return arrResult;
        }
        
        const showPageMsg = () =>{
            let objResCacheMsg = constCache.getDataByUser("msg", true);
            if(!!objResCacheMsg.data){
                constForm.addPageInitMessage(objResCacheMsg.data);
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
        
        const getDataLocation = (_subsidiaryId) => {
            if(!_subsidiaryId) return [];

            return constLocation.getDataSource([
                search.createFilter({
                    name: 'subsidiary',
                    operator: "anyof",
                    values: _subsidiaryId
                }),
                search.createFilter({
                    name: 'custrecord_scv_loc_type',
                    operator: "anyof",
                    values: constLocationType.RECORDS.SANXUAT.ID
                }),
            ]);
        }

        const getDataWorkCenter = (_locationId) => {
            if(!_locationId) return [];

            return constEntityGroup.getDataSource(
                search.createFilter({
                    name: 'custentity_mfgmob_wclocation',
                    operator: "anyof",
                    values: _locationId
                })
            );
        }

        const getDataSublistDetail = (_request, _sublistId, _arrColumn) => {
            let arrLines = [];

            let arrFieldId = ["custpage_col_wo", "custpage_col_wo_id", "custpage_col_prodstartdt", "custpage_col_prodenddt", "custpage_col_priority"];

            for (let i = 0; i < _request.getLineCount(_sublistId); i++) {
                let objLine = {};

                let chk = _request.getSublistValue(_sublistId, "custpage_col_chk", i);
                if(chk != "T") continue;

                for(let j = 0; j < _arrColumn.length; j++){
                    let fieldId = _arrColumn[j].id;

                    if(!arrFieldId.includes(fieldId)) continue;

                    objLine[fieldId] = _request.getSublistValue(_sublistId, fieldId, i);
                }

                arrLines.push(objLine);
            }
    
            return arrLines;
        }

        const updateProductionSchedule = (objResInput) =>{
            log.error("huy-objResInput", objResInput)

            let prodStartDate = "";
            if(!!objResInput.custpage_col_prodstartdt){
                prodStartDate = constFormat.parseDateTime(objResInput.custpage_col_prodstartdt);
            }

            let prodEndDate = "";
            if(!!objResInput.custpage_col_prodenddt){
                prodEndDate = constFormat.parseDateTime(objResInput.custpage_col_prodenddt);
            }

            record.submitFields({
                type: "workorder", id: objResInput.custpage_col_wo_id,
                values: {
                    custbody_scv_prod_start_date: prodStartDate,
                    custbody_scv_prod_end_date: prodEndDate,
                    custbody_scv_priority: objResInput.custpage_col_priority
                },
                options: {
                    enableSourcing: false, ignoreMandatoryFields : true
                }
            });
        }
        
        const addGantt = (_form, _containerId) =>{
            let field = _form.addField({
                id: 'custpage_scv_jqx_gantt', label: 'JQX', type: "inlinehtml", container: _containerId
            });
    
            let libContents = constJQX.getLibaryIncludes([constJQX.RECORDS.MODULS.GANTT, constJQX.RECORDS.MODULS.SPLITTER, constJQX.RECORDS.MODULS.CHART]);
    
            field.defaultValue = `<html>
                <head>
                    ${libContents}
                    <script>
                        jQuery(document).ready(function () {
                        
                            let mainWidth = jQuery("#div__body").width() -20;

                            jQuery('#scvSplitter').jqxSplitter({width: mainWidth, height: 550, panels: [{ size: mainWidth/2, collapsible: true, showSplitBar: true}] });
                            resizeReponsive();
                        });
                        const resizeReponsive  = () => {
                            jQuery("#scvGantt").css("width",jQuery("#scvPanelGantt").width() + "px");
                            jQuery("#scvGantt").css("height","100%");

                            jQuery("#scvChart").css("width",jQuery("#scvPanelChart").width() + "px");
                            jQuery("#scvChart").css("height","100%");
    
                            setTimeout(function(){
                                resizeReponsive()
                            }, 10);
                        }
                    </script>
                </head>
                <body class='default'>
                    <div id="scvSplitter">
                        <div class="splitter-panel" id="scvPanelGantt">
                            <div id="scvGantt"></div>
                        </div>
                        <div class="splitter-panel" id="scvPanelChart">
                            <div id='scvChart'></div>
                        </div>
                    </div>
                    
                </body>
            </html>`;
        }
        return {
            onRequest,
            updateProductionSchedule
        }

    });
