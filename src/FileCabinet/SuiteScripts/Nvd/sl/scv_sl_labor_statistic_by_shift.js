/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define([
    'N/search', 'N/ui/serverWidget', 'N/query',
    'N/cache', 'N/ui/message', 'N/task', 'N/file',
    '../lib/scv_lib_function.js',
    '../lib/scv_lib_common_html.js',
    '../cons/scv_cons_list_loc_type.js',
    '../cons/scv_cons_subsidiary.js',
    
    '../cons/scv_cons_search_prod_loss_fail_listing.js',
    '../cons/scv_cons_search_prod_labor_search.js',
    '../cons/scv_cons_search_mfg_by_product_listing.js',
    '../cons/scv_cons_search_wo_for_labor.js',
    '../cons/scv_cons_search_mfg_lot.js',
],
    (
        search, serverWidget, query,
        cache, message, task, file,
        lbf, libHtml, 
        constListLocType,
        constSubsidiary,

        constLossFail, constProdLaborSearch, 
        constProductListing, constProdWoForLabor,
        constMfgLot,
    ) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */

        const ACTION_TYPE = {
            EMPTY: { ID: "", NAME: "" },
            UNCHANGED: { ID: 1, NAME: "Unchanged" },
            EDIT: { ID: 2, NAME: "Edit" },
            ADD: { ID: 3, NAME: "Add" },
        };

        const onRequest = (scriptContext) => {
            let request = scriptContext.request;
            let response = scriptContext.response;
            let params = request.parameters;

            let myCache = cache.getCache({
                name: 'cUpdateStt',
                scope: cache.Scope.PRIVATE
            });
            if(request.method == "GET"){
                onRequestMethodGET(response, params, myCache);
            } else {
                onRequestMethodPOST(request, response);
            }
        }

        const onRequestMethodPOST = (request, response) => {
            let arrSublist = JSON.parse(request.body);
            // log.error("res", arrSublist);
            arrSublist = arrSublist.map(e => ({
                script_id: "customscript_scv_sl_labor_stat_by_shift",
                action_id: e.custpage_col_action,
                prd_labor_sub: e.custpage_col_subsidiary,
                prd_labor_location: e.custpage_col_location,
                chk_wo_completion: e.custpage_wo_completion,
                prd_labor_date: e.custpage_col_date,
                prd_labor_shift: e.custpage_col_shift,
                prd_labor_wo_center: e.custpage_col_work_center,
                work_order_id: e.custpage_col_work_order,
                item_id: e.custpage_col_item,
                lot_number: e.custpage_col_lot_number,
                prd_labor_emp: e.custpage_col_employee,
                prd_labor_title: e.custpage_col_job_title,
                prod_labor_start_d_time: e.custpage_col_start_date,
                prd_labor_e_time: e.custpage_col_end_date,
                prd_labor_minutes: e.custpage_col_times,
                prd_op_sequences: e.custpage_col_op_sequence,
                qty_completed: e.custpage_col_qty_completed,
                memo: e.custpage_col_memo,
                quantity: e.custpage_col_qty_pgv,
                wo_date: e.custpage_col_wo_date,
                prod_labor_id: e.custpage_col_prod_labor,
                qc_serial: e.custpage_col_qc_serial,
                prd_labor_thongkesx: e.custpage_col_thongkesx,
                prd_labor_emp1: e.custpage_col_employee1,
                prd_labor_emp2: e.custpage_col_employee2,
                prd_labor_emp3: e.custpage_col_employee3,
                prd_labor_emp4: e.custpage_col_employee4,
            }));
            // run map/ reduce
            let mrTask = task.create({
                taskType: task.TaskType.MAP_REDUCE,
                scriptId: 'customscript_scv_mr_labor_stat_by_shift',
                deploymentId: 'customdeploy_scv_mr_labor_stat_by_shift'
            });
            mrTask.params = {
                custscript_scv_inpt_prodlabor_stat_shift: JSON.stringify(arrSublist),
            };
            let mrTaskId = mrTask.submit();

            let myCache = cache.getCache({
                name: 'cUpdateStt',
                scope: cache.Scope.PRIVATE
            });
            myCache.put({
                key: 'mrTaskId',
                value: mrTaskId
            });

            response.setHeader({ name: 'Content-Type', value: 'application/json' });
            response.write(JSON.stringify({ mrTaskId }));
        }

        const onRequestMethodGET = (response, params, myCache) => {
            let MainForm = null;

            if(params.ispopup == "T") {
                MainForm = onCreateFormProdLaborDetail(params);
            } else if(params.isemployee == "T") {
                MainForm = onCreateFormSelectEmployee(params);
            }else {
                MainForm = onCreateFormUI(params, myCache);
                if(params.isrun == "T") {
                    insertDataSublistProdLabor(MainForm.slProdLabor, params);
                    insertDataSublistProdLossFail(MainForm.slProdLossFail, params);
                    insertDataSublistProdAssembly(MainForm.slAssemblyBuild, params);
                    insertDataSublistProdByProduct(MainForm.slByProduct, params);
                }
            }
            response.writePage(MainForm.form);
        }

        const insertDataSublistProdLabor = (sublist, params) => {
            let searchResult = getDataProductionLabor(params);

            let fields = [
                "custpage_col_date", "custpage_col_shift", "custpage_col_work_center", "custpage_col_work_order", 
                "custpage_col_item", "custpage_col_lot_number", "custpage_col_employee", "custpage_col_job_title", 
                "custpage_col_start_date", "custpage_col_end_date", "custpage_col_times", "custpage_col_op_sequence", 
                "custpage_col_qty_completed", "custpage_col_memo", "custpage_col_qty_pgv", "custpage_col_wo_date", "custpage_col_subsidiary", 
                "custpage_col_location", "custpage_col_json_data", "custpage_col_thongkesx", "custpage_col_employee1",
                "custpage_col_employee2", "custpage_col_employee3", "custpage_col_employee4"
            ];
            for(let i = 0; i < searchResult.length; i++) {
                let obj = searchResult[i];
                let labor_emp_nm = obj.labor_emp_nm.replaceAll(",", ", ");
                let data = [
                    obj.prod_labor_date, obj.shift_nm, obj.work_center_nm, obj.hyperlink, obj.item_nm, obj.lot_no,
                    labor_emp_nm, obj.labor_title_nm, obj.start_time, obj.end_time, obj.time_minutes,
                    obj.op_name, obj.qty_completed, obj.labor_note, obj.quantity, obj.trandate, obj.subsidiary_nm,
                    obj.location_nm, JSON.stringify(obj), obj.thong_ke_sx, obj.labor_emp1_nm, obj.labor_emp2_nm, 
                    obj.labor_emp3_nm, obj.labor_emp4_nm
                ];
                setSublistValueInlineEditor(sublist, fields, i, data);
            }
        }

        const insertDataSublistLaborDetail = (sublist, params) => {
            let searchResult = getDataProductionLabor(params);

            let fields = [
                "custpage_wo_completion", "custpage_col_date", "custpage_col_shift", "custpage_col_work_center", "custpage_col_work_order", 
                "custpage_col_item", "custpage_col_lot_number", "custpage_col_employee", "custpage_col_job_title", 
                "custpage_col_start_date", "custpage_col_end_date", "custpage_col_times", "custpage_col_op_sequence", 
                "custpage_col_qty_completed", "custpage_col_memo", "custpage_col_qty_pgv", "custpage_col_wo_date", "custpage_col_subsidiary", 
                "custpage_col_location", "custpage_col_action", "custpage_col_employee_display", "custpage_col_prod_labor",
                "custpage_col_qc_serial", "custpage_col_thongkesx", "custpage_col_employee1", "custpage_col_employee2", "custpage_col_employee3",
                "custpage_col_employee4"
            ];
            for(let i = 0; i < searchResult.length; i++) {
                let obj = searchResult[i];
                let labor_emp_nm = obj.labor_emp_nm.replaceAll(",", ", ");
                let data = [
                    obj.wo_completion ? "T" : "F", obj.prod_labor_date, obj.shift_id, obj.work_center_id, obj.internalid, obj.item_id, obj.lot_no,
                    obj.labor_emp_id, obj.labor_title_id, obj.start_time, obj.end_time, obj.time_minutes,
                    obj.op_sequence, obj.qty_completed, obj.labor_note, obj.quantity, obj.trandate, obj.subsidiary_id,
                    obj.location_id, ACTION_TYPE.EDIT.ID, labor_emp_nm, obj.prod_labor_id, obj.qc_serial, obj.thong_ke_sx,
                    obj.labor_emp1_id, obj.labor_emp2_id, obj.labor_emp3_id, obj.labor_emp4_id, 
                ];
                setSublistValueInlineEditor(sublist, fields, i, data);
            }
        }

        const insertDataSublistProdLossFail = (sublist, params) => {
            let searchResult = getDataProdLossFail(params);

            for (let i = 0; i < searchResult.length; i++) {
                let obj = searchResult[i];
                setRowDataSublist(sublist, i, [
                    "custpage_col_0", "custpage_col_1", "custpage_col_2", "custpage_col_3", "custpage_col_4", 
                    "custpage_col_5", "custpage_col_6", "custpage_col_7", "custpage_col_8", "custpage_col_9", 
                    "custpage_col_10", "custpage_col_11", "custpage_col_12", "custpage_col_13", 
                    "custpage_col_14", "custpage_col_15", "custpage_col_16"
                ], [
                    obj.op_sequence, obj.op_name, obj.loss_reason_nm, obj.loss_category_nm, obj.pl_4m_reason_nm, 
                    obj.time_stop, obj.shift_nm, obj.work_center_nm, obj.date_recorded, obj.employee_nm, 
                    obj.assembly_nm, obj.location_nm, obj.subsidiary_nm, obj.work_order_nm, obj.wo_completion_nm, 
                    obj.lot_no, obj.serial
                ]);
            }
        }

        const insertDataSublistProdAssembly = (sublist, params) => {
            let searchResult = getDataProdAssembly(params);

            for (let i = 0; i < searchResult.length; i++) {
                let obj = searchResult[i];
                setRowDataSublist(sublist, i, [
                    "custpage_col_0", "custpage_col_1", "custpage_col_2", "custpage_col_3", "custpage_col_4", 
                    "custpage_col_5", "custpage_col_6", "custpage_col_7", "custpage_col_8", "custpage_col_9", 
                    "custpage_col_10", "custpage_col_11", "custpage_col_json_data"
                ], [
                    obj.id_link, obj.trandate, obj.hyperlink, obj.item_nm, obj.quantity, obj.lot_no,
                    obj.work_center_nm, obj.work_bench_nm, obj.shift_nm, obj.subsidiary_nm, obj.location_nm, 
                    obj.createdfrom_nm, JSON.stringify({
                        internalid: obj.internalid,
                        createdfrom_id: obj.createdfrom_id
                    })
                ]);
            }
        }

        const insertDataSublistProdByProduct = (sublist, params) => {
            let searchResult = getDataProdByProduct(params);

            for (let i = 0; i < searchResult.length; i++) {
                let obj = searchResult[i];
                setRowDataSublist(sublist, i, [
                    "custpage_col_0", "custpage_col_1", "custpage_col_2", "custpage_col_3", "custpage_col_4", 
                    "custpage_col_5", "custpage_col_6", "custpage_col_7", "custpage_col_8", "custpage_col_9", 
                    "custpage_col_10", "custpage_col_11", 
                ], [
                    obj.item_nm, obj.quantity, obj.rate, obj.work_order_nm, obj.wo_completion_nm,
                    obj.subsidiary_nm, obj.work_center_nm, obj.shift_nm, obj.lot_no, obj.hyperlink,
                    obj.date, obj.location_nm
                ]);
            }
        }

        const getDataProductionLabor = (params) => {
            let myFilters = [];

            if(!!params.custpage_subsidiary) {
                myFilters.push(search.createFilter({
                    name: "subsidiary", 
                    operator: "anyof", 
                    values: params.custpage_subsidiary
                }));
            }

            if(!!params.custpage_shift) {
                myFilters.push(search.createFilter({
                    name: "custrecord_scv_prd_labor_shift",
                    join: "CUSTRECORD_SCV_PRD_LABOR_WO", 
                    operator: "anyof", 
                    values: params.custpage_shift
                }));
            }

            if(!!params.custpage_work_center) {
                myFilters.push(search.createFilter({
                    name: "custbody_mfgmob_workcenter", 
                    operator: "anyof", 
                    values: params.custpage_work_center
                }));
            }

            if(!!params.custpage_location) {
                myFilters.push(search.createFilter({
                    name: "location", 
                    operator: "anyof", 
                    values: params.custpage_location
                }));
            }

            if(!!params.custpage_sothongke) {
                myFilters.push(search.createFilter({
                    name: "custbody_scv_so_thong_ke_sx", 
                    operator: "contains", 
                    values: params.custpage_sothongke
                }));
            }

            if(!!params.custpage_fromdt) {
                myFilters.push(search.createFilter({
                    name: "trandate",
                    // join: "CUSTRECORD_SCV_PRD_LABOR_WO",
                    operator: "onorafter",
                    values: params.custpage_fromdt
                }));
            }

            if(!!params.custpage_todt) {
                myFilters.push(search.createFilter({
                    name: "trandate",
                    // join: "CUSTRECORD_SCV_PRD_LABOR_WO",
                    operator: "onorbefore",
                    values: params.custpage_todt
                }));
            }

            if(!!params.arrWoId) {
                myFilters.push(search.createFilter({
                    name: "internalid",
                    operator: "anyof",
                    values: params.arrWoId.split(",")
                }));
            }

            if(!!params.arrLotNo) {
                let arrLotNo = params.arrLotNo.split(",");
                myFilters.push(search.createFilter({
                    name: "formulatext",
                    formula: "case when {custbody_scv_assembly_lot} in ('"+ arrLotNo.join("','") +"') or {custbody_scv_assembly_lot} is null then 1 else 0 end",
                    operator: "is",
                    values: "1"
                }));
            }
            
            return constProdWoForLabor.getDataSource(myFilters);
        }

        const getDataProdLossFail = (params) => {
            let myFilters = [];

            if(!!params.custpage_subsidiary) {
                myFilters.push(search.createFilter({
                    name: "custrecord_scv_pl_subsidiary", 
                    operator: "anyof", 
                    values: params.custpage_subsidiary
                }));
            }

            if(!!params.custpage_shift) {
                myFilters.push(search.createFilter({
                    name: "custrecord_scv_pl_shift", 
                    operator: "anyof", 
                    values: params.custpage_shift
                }));
            }

            if(!!params.custpage_work_center) {
                myFilters.push(search.createFilter({
                    name: "custrecord_scv_loss_fail_work_center", 
                    operator: "anyof", 
                    values: params.custpage_work_center
                }));
            }

            if(!!params.custpage_lot_no) {
                let arrLotNo = params.custpage_lot_no.split(",");

                myFilters.push(search.createFilter({
                    name: "formulatext", 
                    formula: "case when {custrecord_scv_pl_prod_lot_no} in ('"+ arrLotNo.join("','") +"') then 1 else 0 end",
                    operator: "is", 
                    values: "1"
                }));
            }

            if(!!params.custpage_location) {
                myFilters.push(search.createFilter({
                    name: "custrecord_scv_pl_location", 
                    operator: "anyof", 
                    values: params.custpage_location
                }));
            }

            if(!!params.custpage_fromdt) {
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_pl_date_recorded',
                    operator: "onorafter",
                    values: params.custpage_fromdt
                }));
            }

            if(!!params.custpage_todt) {
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_pl_date_recorded',
                    operator: "onorbefore",
                    values: params.custpage_todt
                }));
            }

            return constLossFail.getDataSource(myFilters);
        }

        const getDataProdAssembly = (params) => {
            let myFilters = [];

            if(!!params.custpage_subsidiary) {
                myFilters.push(search.createFilter({
                    name: "subsidiary", 
                    operator: "anyof", 
                    values: params.custpage_subsidiary
                }));
            }

            if(!!params.custpage_shift) {
                myFilters.push(search.createFilter({
                    name: "custbody_scv_shift", 
                    operator: "anyof", 
                    values: params.custpage_shift
                }));
            }

            if(!!params.custpage_work_center) {
                myFilters.push(search.createFilter({
                    name: "custbody_mfgmob_workcenter", 
                    operator: "anyof", 
                    values: params.custpage_work_center
                }));
            }

            if(!!params.custpage_lot_no) {
                let arrLotNo = params.custpage_lot_no.split(",");

                myFilters.push(search.createFilter({
                    name: "formulatext", 
                    formula: "case when {custbody_scv_assembly_lot} in ('"+ arrLotNo.join("','") +"') then 1 else 0 end",
                    operator: "is", 
                    values: "1"
                }));
            }

            if(!!params.custpage_location) {
                myFilters.push(search.createFilter({
                    name: "location", 
                    operator: "anyof", 
                    values: params.custpage_location
                }));
            }

            if(!!params.custpage_sothongke) {
                myFilters.push(search.createFilter({
                    name: "custbody_scv_so_thong_ke_sx", 
                    operator: "contains", 
                    values: params.custpage_sothongke
                }));
            }

            if(!!params.custpage_fromdt) {
                myFilters.push(search.createFilter({
                    name: 'trandate',
                    operator: "onorafter",
                    values: params.custpage_fromdt
                }));
            }

            if(!!params.custpage_todt) {
                myFilters.push(search.createFilter({
                    name: 'trandate',
                    operator: "onorbefore",
                    values: params.custpage_todt
                }));
            }

            return constProdLaborSearch.getDataSource(myFilters);
        }

        const getDataProdByProduct = (params) => {
             let myFilters = [];

            if(!!params.custpage_subsidiary) {
                myFilters.push(search.createFilter({
                    name: "custrecord_scv_by_product_sub", 
                    operator: "anyof", 
                    values: params.custpage_subsidiary
                }));
            }

            if(!!params.custpage_shift) {
                myFilters.push(search.createFilter({
                    name: "custrecord_scv_by_product_shift", 
                    operator: "anyof", 
                    values: params.custpage_shift
                }));
            }

            if(!!params.custpage_work_center) {
                myFilters.push(search.createFilter({
                    name: "custrecord_scv_by_product_work_center", 
                    operator: "anyof", 
                    values: params.custpage_work_center
                }));
            }

            if(!!params.custpage_lot_no) {
                let arrLotNo = params.custpage_lot_no.split(",");

                myFilters.push(search.createFilter({
                    name: "formulatext", 
                    formula: "case when {custrecord_scv_by_product_lot_no} in ('"+ arrLotNo.join("','") +"') then 1 else 0 end",
                    operator: "is", 
                    values: "1"
                }));
            }

            if(!!params.custpage_location) {
                myFilters.push(search.createFilter({
                    name: "custrecord_scv_by_product_location", 
                    operator: "anyof", 
                    values: params.custpage_location
                }));
            }

            if(!!params.custpage_sothongke) {
                myFilters.push(search.createFilter({
                    name: "custbody_scv_so_thong_ke_sx",
                    join: "CUSTRECORD_SCV_BY_PRODUCT_WO",
                    operator: "contains", 
                    values: params.custpage_sothongke
                }));
            }

            if(!!params.custpage_fromdt) {
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_by_product_date',
                    operator: "onorafter",
                    values: params.custpage_fromdt
                }));
            }

            if(!!params.custpage_todt) {
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_by_product_date',
                    operator: "onorbefore",
                    values: params.custpage_todt
                }));
            }

            return constProductListing.getDataSource(myFilters);
        }

        const onCreateFormUI = (params, myCache) => {
            let mainForm = serverWidget.createForm({title: "Thống kê thời gian nhân công theo ca - Tấm Trần, thanh trần"});
            mainForm.clientScriptModulePath = '../cs/scv_cs_sl_labor_statistic_by_shift.js';
            let filterGrp = addFieldGroup(mainForm, "fieldgrp_main", "Filters");
            lbf.pinHeaderSublist(mainForm);
            
            // add button
            mainForm.addButton({
                id: "custpage_btn_search",
                label: "Search",
                functionName: "onSearchResult()"
            });
            // update status task
            let mrTaskId = params.mrTaskId;

            if (lbf.isContainValue(mrTaskId) == false) {
                mrTaskId = myCache.get({
                    key: 'mrTaskId',
                    loader: 'loader'
                });
            }
            if (lbf.isContainValue(mrTaskId)) {
                let taskStatus = task.checkStatus(mrTaskId);
                let messageInfo = 'Status of Update Approve Status is: ' + taskStatus.status;
                mainForm.addPageInitMessage({
                    type: message.Type.INFORMATION,
                    message: messageInfo,
                    duration: -1
                });
                if(taskStatus.status == 'COMPLETE') {
                    myCache.remove({ key: 'mrTaskId' });
                }
            }
            // add field
            let custpage_subsidiary = mainForm.addField({
                id: "custpage_subsidiary",
                type: serverWidget.FieldType.SELECT,
                label: "Công ty/Chi nhánh",
                container: filterGrp.id
            });
            let custpage_shift = mainForm.addField({
                id: "custpage_shift",
                type: serverWidget.FieldType.SELECT,
                label: "Ca làm việc",
                source: "customrecord_mfgmob_shift",
                container: filterGrp.id
            });
            let custpage_fromdt = mainForm.addField({
                id: 'custpage_fromdt',
                type: serverWidget.FieldType.DATE,
                label: 'Từ ngày',
                container: filterGrp.id
            });
            let custpage_todt = mainForm.addField({
                id: 'custpage_todt',
                type: serverWidget.FieldType.DATE,
                label: 'Đến ngày',
                container: filterGrp.id
            });

            let custpage_location = mainForm.addField({
                id: "custpage_location",
                type: serverWidget.FieldType.SELECT,
                label: "Kho",
                container: filterGrp.id
            }).updateBreakType({breakType: serverWidget.FieldBreakType.STARTCOL});
            let custpage_work_center = mainForm.addField({
                id: "custpage_work_center",
                type: serverWidget.FieldType.SELECT,
                label: "Máy",
                container: filterGrp.id
            });

            let custpage_sothongke = mainForm.addField({
                id: "custpage_sothongke",
                type: serverWidget.FieldType.TEXT,
                label: "Số thống kê",
                container: filterGrp.id
            });

            let custpage_lot_no = mainForm.addField({
                id: "custpage_lot_no",
                type: serverWidget.FieldType.MULTISELECT,
                label: "Số lô",
                container: filterGrp.id
            }).updateBreakType({breakType: serverWidget.FieldBreakType.STARTCOL});


            constSubsidiary.initLoadFieldSubsidiaryByUserRole(custpage_subsidiary);
            let subsidiary_id = params.custpage_subsidiary || custpage_subsidiary.defaultValue;
            let arrLocation = getDataLocation(subsidiary_id);
            let arrEntGroup = getDataEntityGroup(params.custpage_location);
            let arrMfgLot = constMfgLot.getDataSource();

            addSelectOptionData(custpage_location, arrLocation, "id", "name");
            addSelectOptionData(custpage_work_center, arrEntGroup, "id", "groupname");
            addSelectOptionData(custpage_lot_no, arrMfgLot, "lot_number", "lot_number");

            custpage_subsidiary.isMandatory = true;
            custpage_location.isMandatory = true;
            custpage_fromdt.updateLayoutType({layoutType: 'STARTROW'});
            custpage_todt.updateLayoutType({layoutType: 'ENDROW'});

            let fields = [
                custpage_subsidiary, custpage_fromdt, custpage_todt, custpage_shift, 
                custpage_work_center, custpage_lot_no, custpage_location, custpage_sothongke
            ];
            applyCustomFieldSettings(fields, params, true);
            custpage_fromdt.defaultValue = getFromDate(params.custpage_fromdt);
            custpage_todt.defaultValue = getToDate(params.custpage_todt);

            // add tab
            let tabProdLabor = addTab(mainForm, "tab_prod_labor", "Nhân công SX");
            let tabProdLossFail = addTab(mainForm, "tab_prod_loss_fail", "Sản phẩm lỗi");
            let tabAssemblyBuild = addTab(mainForm, "tab_assembly_build", "Thành phẩm hoàn thành");
            let tabByProduct = addTab(mainForm, "tab_by_product", "Phế/Phụ phẩm");

            // add sublist
            let slProdLabor = mainForm.addSublist({
                id: "custpage_sl_prod_labor",
                type: serverWidget.SublistType.LIST,
                label: 'Kết quả',
                tab: tabProdLabor.id
            });
            slProdLabor.addMarkAllButtons();
            slProdLabor.addButton({
                id: "custpage_btn_upd_labor",
                label: "Update Labor",
                functionName: "onUpdateLabor()"
            });

            let slProdLossFail = mainForm.addSublist({
                id: "custpage_sl_prod_loss_fail",
                type: serverWidget.SublistType.LIST,
                label: 'Kết quả',
                tab: tabProdLossFail.id
            });

            let slAssemblyBuild = mainForm.addSublist({
                id: "custpage_sl_assembly_build",
                type: serverWidget.SublistType.LIST,
                label: 'Kết quả',
                tab: tabAssemblyBuild.id
            });

            let slByProduct = mainForm.addSublist({
                id: "custpage_sl_by_product",
                type: serverWidget.SublistType.LIST,
                label: 'Kết quả',
                tab: tabByProduct.id
            });
            
            onCrtSublistProductionLabor(slProdLabor);
            onCrtSublistProdLossFail(slProdLossFail);
            onCrtSublistAssemblyBuild(slAssemblyBuild);
            onCrtSublistByProduct(slByProduct);

            return { 
                form: mainForm, 
                slProdLabor, slProdLossFail,
                slAssemblyBuild, slByProduct
            };
        }
        
        const onCreateFormSelectEmployee = (params) => {
            let mainForm = serverWidget.createForm({title: "Thống kê thời gian nhân công theo ca - Tấm Trần, thanh trần"});
            mainForm.clientScriptModulePath = '../cs/scv_cs_sl_labor_statistic_by_shift.js';
            mainForm.addButton({
                id: "custpage_btn_submit_employee",
                label: "Submit",
                functionName: "onSubmitEmployee()"
            });
            libHtml.addClassBtnSubmit(mainForm, "custpage_btn_submit_employee");
            // add sublist customize
            let arrEmployee = getDataEmployee(params.department);
            let custpage_two_dxgrid = mainForm.addField({
				id: 'custpage_two_dxgrid',
				type: "inlinehtml",
				label: 'Two DxGrid'
			});

            custpage_two_dxgrid.defaultValue = `
                <script>
                    let arrEmployee = ${JSON.stringify(arrEmployee)};
                    let params = ${JSON.stringify({
                        line_number: params.linenumber,
                        employee_id: params.employeeid
                    })};
                </script>`
                + file.load('../html/scv_html_labor_statistic_by_shift.html').getContents();

            return { form: mainForm };
        }

        const onCreateFormProdLaborDetail = (params, myCache) => {
            let mainForm = serverWidget.createForm({title: "Thống kê thời gian nhân công theo ca - Tấm Trần, thanh trần"});
            mainForm.clientScriptModulePath = '../cs/scv_cs_sl_labor_statistic_by_shift.js';
            mainForm.addButton({
                id: "custpage_btn_update_labor",
                label: "Submit",
                functionName: "onSubmitProdLabor()"
            });
            mainForm.addButton({
                id: "custpage_btn_autofill",
                label: "Auto Fill",
                functionName: "onAutoFill()"
            });
            libHtml.addClassBtnSubmit(mainForm, "custpage_btn_update_labor");
            lbf.pinHeaderSublist(mainForm);
            // add field
            let custpage_ischange_shift = mainForm.addField({
                id: "custpage_ischange_shift",
                type: serverWidget.FieldType.CHECKBOX,
                label: "IsChange Shift",
            });
            custpage_ischange_shift.updateDisplayType({displayType: "hidden"});

            let arrEntGroup = getDataEntityGroup(params.custpage_location);
            let slLaborDetail = mainForm.addSublist({
                id: "custpage_sl_labor_detail",
                type: serverWidget.SublistType.INLINEEDITOR,
                label: 'Kết quả',
            });

            onCrtSublistLaborDetail(slLaborDetail, arrEntGroup);
            insertDataSublistLaborDetail(slLaborDetail, params);

            return { form: mainForm };
        }

        const includeHtmlCustomDxGrid = () =>{
            return `
                ${libHtml.includeLibaryExternalHtml()}
                ${libHtml.includeTagStyleHtml()}
            `;
        }

        const onCrtSublistLaborDetail = (sublist, arrEntGroup) => {
            let arrColumn = [
                {id: "custpage_wo_completion", label: "WO Completion", type: "checkbox"},
                {id: "custpage_col_date", label: "Ngày", type: "date"},
                {id: "custpage_col_shift", label: "Ca làm việc", type: "select", source: "customrecord_mfgmob_shift"},
                {id: "custpage_col_start_date", label: "Thời gian bắt đầu", type: "timeofday"},
                {id: "custpage_col_end_date", label: "Thời gian kết thúc", type: "timeofday"},
                {id: "custpage_col_times", label: "Thời gian (Phút)", type: "float", isMandatory: true},
                {id: "custpage_col_work_center", label: "Máy", type: "select"},
                {id: "custpage_col_work_order", label: "Lệnh SX", type: "select", source: "workorder" },
                {id: "custpage_col_prod_labor", label: "Prod Labor", type: "select", source: "customrecord_scv_prd_labor", displayType: "hidden" },
                {id: "custpage_col_item", label: "Thành phẩm", type: "select", source: "item" },
                {id: "custpage_col_lot_number", label: "Số lô", type: "text" },
                {id: "custpage_col_thongkesx", label: "Số thống kê SX", type: "text" },
                {id: "custpage_col_employee_display", label: "Nhân sự", type: "textarea", displayType: "disabled"},
                {id: "custpage_col_employee", label: "Nhân sự Id", type: "text", displayType: "hidden"},
                {id: "custpage_col_employee1", label: "Nhân sự 1", type: "select", source: "employee" },
                {id: "custpage_col_employee2", label: "Nhân sự 2", type: "select", source: "employee" },
                {id: "custpage_col_employee3", label: "Nhân sự 3", type: "select", source: "employee" },
                {id: "custpage_col_employee4", label: "Nhân sự 4", type: "select", source: "employee" },
                {id: "custpage_col_job_title", label: "Chức vụ", type: "select", source: "customlist_scv_operation_titble"},
                {id: "custpage_col_op_sequence", label: "Công đoạn", type: "select", source: "customrecord_scv_prod_operation"},
                {id: "custpage_col_qty_completed", label: "SL Hoàn thành", type: "float"},
                {id: "custpage_col_memo", label: "Ghi chú", type: "text" },
                {id: "custpage_col_qty_pgv", label: "SL PGV", type: "float"},
                {id: "custpage_col_wo_date", label: "WO Date", type: "date"},
                {id: "custpage_col_qc_serial", label: "QC Serial", type: "text"},
                {id: "custpage_col_subsidiary", label: "Công ty/Chi nhánh", type: "select", source: "subsidiary", displayType: "disabled", isMandatory: true},
                {id: "custpage_col_location", label: "Kho", type: "select", source: "location", displayType: "disabled", isMandatory: true},
                {id: "custpage_col_action", label: "Action", type: "select", displayType: "disabled"},
                // {id: "custpage_col_json_data", label: "JSON Data", type: "textarea", displayType: "hidden"},
            ];

            for(let i = 0; i< arrColumn.length; i++){
                let objCol = arrColumn[i];
                let field = sublist.addField({
                    id: objCol.id,
                    type : objCol.type,
                    source: objCol.source||null,
                    label : objCol.label
                }).updateDisplayType({displayType: objCol.displayType||"entry"});
                
                if(arrColumn[i].id === 'custpage_col_work_center') {
                    addSelectOptionData(field, arrEntGroup, "id", "groupname");
                }
                if(arrColumn[i].id === 'custpage_col_action') {
                    onLoadAction(field);
                }

                field.isMandatory = objCol.isMandatory ?? false;

                if(!!objCol.defaultValue){
                    field.defaultValue = objCol.defaultValue;
                }
            }
        }

        const onCrtSublistProductionLabor = (sublist) => {
            let arrColumn = [
                {id: "custpage_col_select", label: "Check", type: "checkbox", displayType: "entry"},
                {id: "custpage_col_date", label: "Ngày", type: "date"},
                {id: "custpage_col_shift", label: "Ca làm việc", type: "text"},
                {id: "custpage_col_work_center", label: "Máy", type: "text", displayType: "disabled"},
                {id: "custpage_col_work_order", label: "Lệnh SX", type: "text" },
                {id: "custpage_col_item", label: "Thành phẩm", type: "text" },
                {id: "custpage_col_lot_number", label: "Số lô", type: "text" },
                {id: "custpage_col_thongkesx", label: "Số thống kê SX", type: "text" },
                {id: "custpage_col_employee", label: "Nhân sự", type: "textarea"},
                {id: "custpage_col_employee1", label: "Nhân sự 1", type: "text"},
                {id: "custpage_col_employee2", label: "Nhân sự 2", type: "text"},
                {id: "custpage_col_employee3", label: "Nhân sự 3", type: "text"},
                {id: "custpage_col_employee4", label: "Nhân sự 4", type: "text"},
                {id: "custpage_col_job_title", label: "Chức vụ", type: "text"},
                {id: "custpage_col_start_date", label: "Thời gian bắt đầu", type: "timeofday"},
                {id: "custpage_col_end_date", label: "Thời gian kết thúc", type: "timeofday"},
                {id: "custpage_col_times", label: "Thời gian (Phút)", type: "float", isMandatory: true},
                {id: "custpage_col_op_sequence", label: "Công đoạn", type: "text"},
                {id: "custpage_col_qty_completed", label: "SL Hoàn thành", type: "float"},
                {id: "custpage_col_memo", label: "Ghi chú", type: "text" },
                {id: "custpage_col_qty_pgv", label: "SL PGV", type: "float"},
                {id: "custpage_col_wo_date", label: "WO Date", type: "date"},
                {id: "custpage_col_subsidiary", label: "Công ty/Chi nhánh", type: "text"},
                {id: "custpage_col_location", label: "Kho", type: "text"},
                {id: "custpage_col_json_data", label: "JSON Data", type: "textarea", displayType: "hidden"},
            ];

            for(let i = 0; i< arrColumn.length; i++){
                let objCol = arrColumn[i];
                let field = sublist.addField({
                    id: objCol.id,
                    type : objCol.type,
                    source: objCol.source||null,
                    label : objCol.label
                });
                
                // if(objCol.id === 'custpage_col_employee') {
                //     field.updateDisplaySize({
                //         width: 300,
                //         height: 50
                //     });
                // }

                field.updateDisplayType({displayType: objCol.displayType||"inline"});
            }
        }

        const onCrtSublistProdLossFail = (sublist) => {
            let arrColumn = [
                { label: "Bước", type: "float" },
                { label: "Tên bước", type: "text" },
                { label: "Nhóm lỗi", type: "text" },
                { label: "Chi tiết lỗi", type: "text" },
                { label: "(4M) Lý do", type: "text" },
                { label: "Thời gian ngừng (Phút)", type: "float" },
                { label: "Ca làm việc", type: "text" },
                { label: "Tổ đội", type: "text" },
                { label: "Ngày ghi nhận", type: "text" },
                { label: "Nhân sự", type: "text" },
                { label: "Thành phẩm", type: "text" },
                { label: "Kho", type: "text" },
                { label: "Công ty/Chi nhánh", type: "text" },
                { label: "Lệnh SX", type: "text" },
                { label: "Phiếu hoàn thành", type: "text" },
                { label: "Số lô", type: "text" },
                { label: "Số Serial", type: "text" },
            ];

            onCreateSublistColumn(arrColumn, sublist);
        }

        const onCrtSublistAssemblyBuild = (sublist) => {
            let arrColumn = [
                { label: "Internal ID", type: "text" },
                { label: "Ngày", type: "text" },
                { label: "Số giao dịch", type: "text" },
                { label: "Item", type: "text" },
                { label: "Lượng", type: "float" },
                { label: "Số lô", type: "text" },
                { label: "Tổ đội", type: "text" },
                { label: "Work Bench (Custom Body)", type: "text" },
                { label: "Ca làm việc", type: "text" },
                { label: "Công ty/Chi nhánh", type: "text" },
                { label: "Kho", type: "text" },
                { label: "Tạo từ", type: "text" },
                { id: "custpage_col_json_data", label: "JSON Data", type: "textarea", displayType: "hidden"},
            ];

            onCreateSublistColumn(arrColumn, sublist);
        }

        const onCrtSublistByProduct = (sublist) => {
            let arrColumn = [
                { label: "Phế/Phụ phẩm", type: "text" },
                { label: "Lượng", type: "float" },
                { label: "Đơn giá", type: "float" },
                { label: "Lệnh SX", type: "text" },
                { label: "Phiếu hoàn thành", type: "text" },
                { label: "Công ty/Chi nhánh", type: "text" },
                { label: "Tổ đội", type: "text" },
                { label: "Ca làm việc", type: "text" },
                { label: "Số lô", type: "text" },
                { label: "Internal ID", type: "text" },
                { label: "Ngày", type: "text" },
                { label: "Kho sản xuất", type: "text" },
            ];

            onCreateSublistColumn(arrColumn, sublist);
        }

        function onCreateSublistColumn(arrColumn, sublist){
            let index = 0;
            for(let i = 0; i< arrColumn.length; i++){
                let field = sublist.addField({
                    id: arrColumn[i].id || ("custpage_col_"+ index),
                    type: arrColumn[i].type,
                    label: arrColumn[i].label,
                    source: arrColumn[i].source || null,
                });
                field.updateDisplayType({ displayType: arrColumn[i].displayType || "inline"});

                if(!arrColumn[i].id) {
                    index++;
                }
            }
        }

        const applyCustomFieldSettings = (fields, params, isHelpText) => {
            for(let objField of fields) {
                objField.defaultValue = params[objField.id];

                if(objField.type === 'multiselect') {
                    objField.defaultValue = params[objField.id]?.split(",");
                }
                if(isHelpText) {
                    objField.setHelpText({ help: objField.label });
                }
            }
        }

        function onLoadAction(_actionField) {
            for(let property in ACTION_TYPE) {
                _actionField.addSelectOption({
                    value: ACTION_TYPE[property].ID, 
                    text: ACTION_TYPE[property].NAME 
                });
            }
        }

        function addSelectOptionData(_field, _data, _value, _text) {
            if(_field.type === 'select') {
                _field.addSelectOption({value : "", text : ""});
            }

            for(let i in _data) {
                _field.addSelectOption({value: _data[i][_value], text: _data[i][_text]});
            }
        }

        const getDataLocation = (subsidiary_id) => {
            let sqlQuery = `SELECT id, name, custrecord_scv_loc_type, subsidiary
                FROM location
                WHERE custrecord_scv_loc_type = ${constListLocType.RECORDS.KHO_SAN_XUAT.ID} AND isinactive = 'F'\n`;

            let resultSQL = query.runSuiteQL({
                query: sqlQuery
            });
            let resultQuery = resultSQL.asMappedResults();

            if(!!subsidiary_id) {
                resultQuery = resultQuery.filter(e => e.subsidiary == subsidiary_id);
            } 
            return resultQuery;
        }

        const getDataEmployee = (departmentId) => {
            let employeeSearchObj = search.create({
                type: "employee",
                filters: [
                   ["isinactive","is","F"]
                ],
                columns: ["entityid", "department"]
            });

            let myFilters = employeeSearchObj.filters;
            if(!!departmentId) {
                myFilters.push(search.createFilter({
                    name: 'department',
                    operator: "anyof",
                    values: departmentId
                }));
            }
            let myColumns = employeeSearchObj.columns;
            employeeSearchObj = employeeSearchObj.runPaged({pageSize:1000});

            let arrResult = [];
            for(let i = 0; i < employeeSearchObj.pageRanges.length; i++){
                let currentPage = employeeSearchObj.fetch({index : i}).data;

                for(let idx = 0; idx < currentPage.length; idx++){
                    let obj = {
                        name: currentPage[idx].getValue(myColumns[0]),
                        department: currentPage[idx].getText(myColumns[1]),
                        id: currentPage[idx].id,
                    };
                    arrResult.push(obj);
                }
            }
            return arrResult;
        }

        const getDataEntityGroup = (locationId) => {
            if(!locationId) return [];
            let resultSQL = query.runSuiteQL({
                query: `SELECT id, groupname FROM entitygroup
                    WHERE custentity_mfgmob_wclocation = ${locationId} AND isinactive = 'F'`
            });
            let resultQuery = resultSQL.asMappedResults();
            return resultQuery;
        }

        const setSublistValueInlineEditor = (sublist, fields, line, data) => {
            for(let i = 0; i < fields.length; i++) {
                let value = data[i];
                if(!!value) {
                    sublist.setSublistValue({
                        id: fields[i], line: line, value: value
                    });
                }
            }
        }

        function setRowDataSublist(_sublist, _line, _field, _data){
            for(let i = 0; i<_field.length; i++){
                addValueColField(_sublist, _field[i], _line, _data[i]);
            }
        }

        function addValueColField(sublist, id, line, value) {
            if(lbf.isContainValue(value)){
                sublist.setSublistValue({
                    id: id,
                    line: line,
                    value: value
                });
            }
        }

        function getFromDate(_fromdt) {
            if (lbf.isContainValue(_fromdt)) {
                return _fromdt
            }
            let d = new Date();
            return new Date(d.getFullYear(), d.getMonth(), "01");
        }

        function getToDate(_todt) {
            if (lbf.isContainValue(_todt)) {
                return _todt
            }
            return new Date();
        }

        function addTab(_form, _id,_label){
            let _obj = {id: _id, label: _label}
            _form.addTab(_obj);
            return _obj;
        }

        function addFieldGroup(_form, _id, _label){
            let _obj = {id: _id, label: _label}
            _form.addFieldGroup(_obj);
            return _obj;
        }

        return {onRequest}

    });
