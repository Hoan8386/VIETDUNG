/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define([
    'N/search', 'N/runtime', 'N/cache', 'N/query', 'N/record',
    'N/ui/message', 'N/task', 'N/redirect', 'N/format',
    '../lib/scv_lib_function.js',
    '../cons/scv_cons_form.js',
    '../cons/scv_cons_list_loc_type.js',
    '../cons/scv_cons_customrecord.js',
    '../cons/scv_cons_subsidiary.js',
    '../cons/scv_cons_search_mfg_lot.js',

    '../cons/scv_cons_search_prod_labor_search.js',
    '../cons/scv_cons_search_mfg_by_product_listing.js',
    '../cons/scv_cons_search_wo_for_labor_ac.js',
    '../cons/scv_cons_search_list_wo_tksx.js',
],
    (
        search, runtime, cache, query, record,
        message, task, redirect, format,
        lbf, 
        constForm,
        constListLocType,
        constCustRec,
        constSubsidiary,
        constMfgLot,

        searchProdLaborSearch, 
        searchProductListing, 
        searchWoForLaborAC,
        searchListWoTKSX,
    ) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */

        const Suitelet = {
            ID: "customscript_scv_sl_labor_stat_shift",
            DEPLOYID_UI: "customdeploy_scv_sl_labor_stat_shift",
            DEPLOYID_DATA: "customdeploy_scv_sl_labor_stat_shift_svc",
        };

        const MapReduce = {
            ID: "customscript_scv_mr_labor_stat_shift",
            DEPLOYID: "customdeploy_scv_mr_labor_stat_shift",
            INPUT_PARAM: "custscript_scv_inpt_labor_stat_shift",
        };

        const ActionType = {
            Add: { ID: "1", NAME: "Add" },
            Edit: { ID: "2", NAME: "Edit" },
        };

        const onRequest = (scriptContext) => {
            constForm.setContext(scriptContext);
            constForm.setServiceScript(Suitelet.ID, Suitelet.DEPLOYID_DATA);

            let request = scriptContext.request;
            let params = request.parameters;
            let curScript = runtime.getCurrentScript();

            if(curScript.deploymentId === Suitelet.DEPLOYID_DATA) {
                let objResponse = {data: []};
                
				switch(params.action){
                    case "getDataLocation":
						objResponse.data = getDataLocation(params.custpage_subsidiary);
						break;
                    case "getDataEntityGroup":
						objResponse.data = getDataEntityGroup(params.custpage_location);
						break;
                    case "getDataWoTKSX":
                        objResponse.data = getDataWoTKSX(params);
                        break;
				}

                constForm.write(objResponse);
            } else {
                let myCache = cache.getCache({ name: 'cUpdateStt', scope: cache.Scope.PRIVATE });

                if(request.method == "GET"){
                    onRequestMethodGET(params, myCache);
                } else {
                    onRequestMethodPOST(params, myCache);
                }
            }
        }

        const onRequestMethodPOST = (params, myCache) => {
            let objParams = getObjParams(params);
            let arrSublist = getDataSublistProdLabor();
            
            let arrPrdLabor = [];
            if(arrSublist.length > 5) {
                let mrTask = task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: MapReduce.ID,
                    deploymentId: MapReduce.DEPLOYID
                });

                mrTask.params = {
                    [MapReduce.INPUT_PARAM]: JSON.stringify(arrSublist),
                };

                let mrTaskId = mrTask.submit();
                myCache.put({ key: 'mrTaskId', value: mrTaskId });
            } else {
                for(let obj of arrSublist) {
                    let prdLaborId = createProductLabor(obj);
                    arrPrdLabor.push(prdLaborId);
                }
            }

            // redirect to suitelet
            redirect.toSuitelet({
                scriptId: Suitelet.ID,
                deploymentId: Suitelet.DEPLOYID_UI,
                parameters: {
                    ...objParams,
                    product_labor: arrPrdLabor.join(",")
                }
            });
        }

        const createProductLabor = (data) => {
            let prodLaborRec = record.create({ type: "customrecord_scv_prd_labor" });

            let prod_labor_date = null;
            let prod_labor_starttime = null;
            let prod_labor_endtime = null;

            if(!!data.custpage_col_date) {
                prod_labor_date = format.parse({ type: "date", value: data.custpage_col_date });
            }

            if(!!data.custpage_col_start_date) {
                prod_labor_starttime = format.parse({value: data.custpage_col_start_date, type: "timeofday"});
            }

            if(!!data.custpage_col_end_date) {
                prod_labor_endtime = format.parse({value: data.custpage_col_end_date, type: "timeofday"});
            }

            lbf.setValueData(prodLaborRec, [
                'custrecord_scv_prd_labor_sub', 'custrecord_scv_prd_labor_wo', 'custrecord_scv_prd_labor_assy_item', 
                'custrecord_scv_prd_op_sequences', 'custrecord_scv_prd_labor_wo_center', 'custrecord_scv_prod_labor_start_d_time', 
                'custrecord_scv_prd_labor_e_time', 'custrecord_scv_prd_labor_minutes', 'custrecord_scv_prd_labor_qty_complete', 
                'custrecord_scv_prd_labor_shift', 'custrecord_scv_prd_labor_location', 'custrecord_scv_prd_labor_emp_1', 
                'custrecord_scv_prd_labor_emp_2', 'custrecord_scv_prd_labor_emp_3', 'custrecord_scv_prd_labor_emp_4', 
                'custrecord_scv_prd_labor_date', 'custrecord_scv_prd_labor_lot_no', 'custrecord_scv_prd_labor_serial', 
                'custrecord_scv_prd_labor_note'
            ], [
                data.custpage_col_subsidiary, data.custpage_col_wo_id, data.custpage_col_item,
                data.custpage_col_op_sequence, data.custpage_col_work_center, prod_labor_starttime, 
                prod_labor_endtime, data.custpage_col_times, (data.custpage_col_qty_completed || 0),
                data.custpage_col_shift, data.custpage_col_location, data.custpage_col_employee1,
                data.custpage_col_employee2, data.custpage_col_employee3, data.custpage_col_employee4,
                prod_labor_date, data.custpage_col_lot_number, data.custpage_col_qcserial, 
                data.custpage_col_memo
            ]);

            let prodLaborId = prodLaborRec.save();
            return prodLaborId;
        }

        const getDataSublistProdLabor = () => {
            let arrSublist = constForm.getDataOfSublist("custpage_sl_prod_labor", [
                "custpage_col_action", "custpage_col_wocompletion", "custpage_col_date",
                "custpage_col_shift", "custpage_col_start_date", "custpage_col_end_date",
                "custpage_col_times", "custpage_col_work_center", "custpage_col_wo_id",
                "custpage_col_wo_tranid", "custpage_col_item", "custpage_col_lot_number",
                "custpage_col_thongkesx", "custpage_col_employee1", "custpage_col_employee2",
                "custpage_col_employee3", "custpage_col_employee4", "custpage_col_op_sequence",
                "custpage_col_qty_completed", "custpage_col_memo", "custpage_col_qty_pgv",
                "custpage_col_wo_date", "custpage_col_qcserial", "custpage_col_subsidiary",
                "custpage_col_location"
            ], ['custpage_col_action', ActionType.Add.ID]);

            return arrSublist;
        }

        const getObjParams = (params) => {
            return {
                custpage_subsidiary: params.custpage_subsidiary,
                custpage_shift: params.custpage_shift,
                custpage_work_center: params.custpage_work_center,
                custpage_lot_no: params.custpage_lot_no,
                custpage_sothongke: params.custpage_sothongke,
                custpage_location: params.custpage_location,
                custpage_fromdt: params.custpage_fromdt,
                custpage_todt: params.custpage_todt
            };
        }

        const onRequestMethodGET = (params, myCache) => {
            onCreateFormUI(params);
            onShowMessage(params, myCache);
            if(params.isrun == "T") {
                let arrAB = getDataProdAssembly(params);
                let arrByProduct = getDataProdByProduct(params);

                let arrWoForLaborAC = searchWoForLaborAC.getDataSource(params);
                let arrProdLabor = handleDataWoForLaborACMapping(arrWoForLaborAC);
                
                constForm.setDataOfSublist('custpage_sl_prod_labor', arrProdLabor);
                constForm.setDataOfSublist('custpage_sl_assembly_build', arrAB);
                constForm.setDataOfSublist('custpage_sl_by_product', arrByProduct);
            }
            constForm.writePage();
        }

        const handleDataWoForLaborACMapping = (arrWoForLaborAC) => {
            const objMapFields = {
                "custpage_col_work_center": "work_center_id",
                "custpage_col_wo_tranid": "tranid",
                "custpage_col_wo_id": "internalid",
                "custpage_col_item": "item_id",
                "custpage_col_lot_number": "lot_no",
                "custpage_col_thongkesx": "thong_ke_sx",
                "custpage_col_qty_pgv": "quantity",
                "custpage_col_qty_completed": "quantity",
                "custpage_col_wo_date": "trandate",
                "custpage_col_qcserial": "qc_serial",
                "custpage_col_subsidiary": "subsidiary_id",
                "custpage_col_location": "location_id",
            };

            const arrResult = [];
            for(let obj of arrWoForLaborAC) {
                const objRes = {};

                for(let key in objMapFields) {
                    objRes[key] = obj[objMapFields[key]];
                }

                arrResult.push(objRes);
            }

            return arrResult;
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
                let arrWoTKSX = params.custpage_sothongke.split(",");

                myFilters.push(search.createFilter({
                    name: "formulatext", 
                    formula: "case when {custbody_scv_so_thong_ke_sx} in ('"+ arrWoTKSX.join("','") +"') then 1 else 0 end",
                    operator: "is", 
                    values: "1"
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

            return searchProdLaborSearch.getDataSource(myFilters);
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
                let arrWoTKSX = params.custpage_sothongke.split(",");

                myFilters.push(search.createFilter({
                    name: "formulatext", 
                    formula: "case when {custrecord_scv_by_product_wo.custbody_scv_so_thong_ke_sx} in ('"+ arrWoTKSX.join("','") +"') then 1 else 0 end",
                    operator: "is", 
                    values: "1"
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

            return searchProductListing.getDataSource(myFilters);
        }

        const onCreateFormUI = (params) =>{
            defaultParams(params);
            constForm.createForm({title: "Thống kê thời gian nhân công theo ca - Tấm Trần, thanh trần"}, "../cssl/scv_cs_sl_labor_stat_shift.js");

            constForm.addPageLink([
                searchProdLaborSearch.ID, searchProductListing.ID, searchWoForLaborAC.ID,
            ]);

            constForm.addSubmitButton("Submit");
            constForm.addButton({id: "custpage_btn_search", label: "Search", functionName: "onSearchResult('F')"});
            constForm.addButton({id: "custpage_btn_autofill", label: "Auto Fill", functionName: "onAutoFill()"});
            let mainGrp = constForm.addFieldGroup({id: "fieldgrp_main", label: "Filters"});

            // add fields
            const arrSubsidiary = constSubsidiary.getDataSubsidiaryByUserRole();
            let arrLocation = getDataLocation(params.custpage_subsidiary);
            let arrEntGroup = getDataEntityGroup(params.custpage_location);
            let arrWoTKSX = getDataWoTKSX(params);
            let arrMfgLot = constMfgLot.getDataSource();

            constForm.addField({
                id: 'custpage_subsidiary', label: 'Công ty', container: mainGrp.id,
                type: "select"
            }, true, {
                defaultValue: params.custpage_subsidiary,
                lookup: {
                    data: arrSubsidiary,
                    valueExpr: "id",
                    displayExpr: "namenohierarchy"
                }
            });

            constForm.addField({
                id: 'custpage_location', label: "Kho", container: mainGrp.id,
                type: "select",
            }, true, {
                defaultValue: params.custpage_location,
                lookup: {
                    data: arrLocation,
                }
            });

            constForm.addField({
                id: 'custpage_shift', label: "Ca làm việc", container: mainGrp.id,
                type: "select", source: "customrecord_mfgmob_shift"
            }, false, {
                defaultValue: params.custpage_shift
            });

            constForm.addField({
                id: 'custpage_fromdt', label: "Từ ngày", container: mainGrp.id,
                type: "date", 
            }, false, {
                defaultValue: params.custpage_fromdt,
                layoutType: "startrow"
            });

            constForm.addField({
                id: 'custpage_todt', label: "Đến ngày", container: mainGrp.id,
                type: "date", 
            }, false, {
                defaultValue: params.custpage_todt,
                layoutType: "endrow"
            });

            constForm.addField({
                id: 'custpage_work_center', label: 'Máy', container: mainGrp.id,
                type: "select"
            }, false, {
                defaultValue: params.custpage_work_center,
                breakType: "startcol",
                lookup: {
                    data: arrEntGroup,
                    valueExpr: "id",
                    displayExpr: "groupname"
                }
            });

            constForm.addField({
                id: 'custpage_sothongke', label: "Số thống kê", container: mainGrp.id,
                type: "multiselect"
            }, false, {
                defaultValue: params.custpage_sothongke?.split(","),
                lookup: {
                    data: arrWoTKSX,
                }
            });

            constForm.addField({
                id: 'custpage_lot_no', label: 'Số lô', container: mainGrp.id,
                type: "multiselect"
            }, false, {
                defaultValue: params.custpage_lot_no?.split(","),
                breakType: "startcol",
                lookup: {
                    data: arrMfgLot,
                    valueExpr: "lot_number",
                    displayExpr: "lot_number"
                }
            });

            constForm.addField({
                id: 'custpage_ischange_shift', label: "IsChange Shift", container: mainGrp.id,
                type: "checkbox"
            }, false, {
                displayType: "hidden",
                defaultValue: params.custpage_ischange_shift
            });

            let tabProdLabor = constForm.addTab({id: "tab_prod_labor", label: "Nhân công SX"});
            let tabAssemblyBuild = constForm.addTab({id: "tab_assembly_build", label: "Thành phẩm hoàn thành"});
            let tabByProduct = constForm.addTab({id: "tab_by_product", label: "Phế/Phụ phẩm"});

            constForm.addSublist({
                id: 'custpage_sl_prod_labor',
                type: 'inlineeditor',
                tab: tabProdLabor.id,
                label: 'Kết quả'
            });

            constForm.addSublist({
                id: 'custpage_sl_assembly_build',
                type: 'list',
                tab: tabAssemblyBuild.id,
                label: 'Kết quả'
            });

            constForm.addSublist({
                id: 'custpage_sl_by_product',
                type: 'list',
                tab: tabByProduct.id,
                label: 'Kết quả'
            });

            constForm.addFieldOfSublist('custpage_sl_prod_labor', getDataColumnProdLabor(arrEntGroup));
            constForm.addFieldOfSublist('custpage_sl_assembly_build', getDataColumnAB());
            constForm.addFieldOfSublist('custpage_sl_by_product', getDataColumnByProduct());
        }

        const onShowMessage = (params, myCache) => {
            if(!!params.product_labor) {
                let messageInfo = createMsgInfoByProdLabor(params.product_labor);
                constForm.addPageInitMessage({
                    type: message.Type.INFORMATION,
                    message: messageInfo,
                    duration: -1
                });
            } else {
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
                    constForm.addPageInitMessage({
                        type: message.Type.INFORMATION,
                        message: messageInfo,
                        duration: -1
                    });
                    if(taskStatus.status == 'COMPLETE') {
                        myCache.remove({ key: 'mrTaskId' });
                    }
                }
            }
        }

        const createMsgInfoByProdLabor = (product_labor) => {
            let arrProducLabor = product_labor.split(",");
            let urlRec = constCustRec.getCustRecPathByType("customrecord_scv_prd_labor");
            
            let html = `<div><span>Tạo thành công Thống kê nhân lực: </span>`
            for(let i = 0; i < arrProducLabor.length; i++) {
                let special_text = (i === arrProducLabor.length - 1) ? "." : ", ";
                html += `<span><a href="${urlRec + `&id=${arrProducLabor[i]}`}" target="_blank" style="color: #1e88e5;">${arrProducLabor[i]}</a></span>` + special_text;
            }

            html += `</div>`;
            return html;
        }

        const getDataColumnProdLabor = (arrEntGroup) => {
            const arrAction = getDataAction();
            const columns = [
                { 
                    id: "custpage_col_action", label: "Action", type: "select", displayType: "disabled",
                    lookup: { data: arrAction } 
                },
                { id: "custpage_col_wocompletion", label: "WO Completion", type: "checkbox"},
                { id: "custpage_col_date", label: "Ngày", type: "date", isMandatory: true},
                { id: "custpage_col_shift", label: "Ca làm việc", type: "select", source: "customrecord_mfgmob_shift", isMandatory: true},
                { id: "custpage_col_start_date", label: "Thời gian bắt đầu", type: "timeofday"},
                { id: "custpage_col_end_date", label: "Thời gian kết thúc", type: "timeofday"},
                { id: "custpage_col_times", label: "Thời gian (Phút)", type: "float", isMandatory: false, displayType: "disabled"},
                {
                    id: "custpage_col_work_center", label: "Máy", type: "select", displayType: "disabled",
                    lookup: { data: arrEntGroup, displayExpr: "groupname" } 
                },
                { id: "custpage_col_wo_id", label: "Lệnh SX", type: "text", displayType: "hidden" },
                { id: "custpage_col_wo_tranid", label: "Lệnh SX", type: "text", displayType: "disabled" },
                { id: "custpage_col_item", label: "Thành phẩm", type: "select", source: "item", displayType: "disabled"},
                { id: "custpage_col_lot_number", label: "Số lô", type: "text", displayType: "disabled"},
                { id: "custpage_col_thongkesx", label: "Số thống kê SX", type: "text" , displayType: "disabled"},
                { id: "custpage_col_employee1", label: "Nhân sự 1", type: "select", source: "employee"},
                { id: "custpage_col_employee2", label: "Nhân sự 2", type: "select", source: "employee"},
                { id: "custpage_col_employee3", label: "Nhân sự 3", type: "select", source: "employee"},
                { id: "custpage_col_employee4", label: "Nhân sự 4", type: "select", source: "employee"},
                { id: "custpage_col_op_sequence", label: "Công đoạn", type: "select", source: "customrecord_scv_prod_operation"},
                { id: "custpage_col_qty_completed", label: "SL Hoàn thành", type: "float"},
                { id: "custpage_col_memo", label: "Ghi chú", type: "text" },
                { id: "custpage_col_qty_pgv", label: "SL PGV", type: "float", displayType: "disabled"},
                { id: "custpage_col_wo_date", label: "WO Date", type: "date", displayType: "disabled"},
                { id: "custpage_col_qcserial", label: "QC Serial", type: "text", displayType: "disabled" },
                { id: "custpage_col_subsidiary", label: "Công ty/Chi nhánh", type: "select", source: "subsidiary", displayType: "disabled" },
                { id: "custpage_col_location", label: "Kho", type: "select", source: "location", displayType: "disabled" },
                // { id: "custpage_col_json_data", label: "JSON Data", type: "textarea", displayType: "hidden"},
            ];

            return columns.map(e => {
                const obj = {...e};
                if(!obj.displayType) {
                    obj.displayType = "entry";
                }
                return obj;
            });
        }

        const getDataAction = () => {
            const arrResult = [];

            for(let property in ActionType) {
                arrResult.push({
                    id: ActionType[property].ID,
                    name: ActionType[property].NAME,
                });
            }

            return arrResult;
        }

        const getDataColumnAB = () => {
            return [
                { id: "id_link", label: "Internal ID", type: "text" },
                { id: "trandate", label: "Ngày", type: "text" },
                { id: "hyperlink", label: "Số giao dịch", type: "text" },
                { id: "item_nm", label: "Item", type: "text" },
                { id: "quantity", label: "Lượng", type: "float" },
                { id: "lot_no", label: "Số lô", type: "text" },
                { id: "work_center_nm", label: "Tổ đội", type: "text" },
                { id: "work_bench_nm", label: "Work Bench (Custom Body)", type: "text" },
                { id: "shift_nm", label: "Ca làm việc", type: "text" },
                { id: "subsidiary_nm", label: "Công ty/Chi nhánh", type: "text" },
                { id: "location_nm", label: "Kho", type: "text" },
                { id: "createdfrom_nm", label: "Tạo từ", type: "text" },
            ];
        }

        const getDataColumnByProduct = () => {
            return [
                { id: "item_nm", label: "Phế/Phụ phẩm", type: "text" },
                { id: "quantity", label: "Lượng", type: "float" },
                { id: "rate", label: "Đơn giá", type: "float" },
                { id: "work_order_nm", label: "Lệnh SX", type: "text" },
                { id: "wo_completion_nm", label: "Phiếu hoàn thành", type: "text" },
                { id: "subsidiary_nm", label: "Công ty/Chi nhánh", type: "text" },
                { id: "work_center_nm", label: "Tổ đội", type: "text" },
                { id: "shift_nm", label: "Ca làm việc", type: "text" },
                { id: "lot_no", label: "Số lô", type: "text" },
                { id: "hyperlink", label: "Internal ID", type: "text" },
                { id: "date", label: "Ngày", type: "text" },
                { id: "location_nm", label: "Kho sản xuất", type: "text" },
            ];
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

        const getDataEntityGroup = (locationId) => {
            if(!locationId) return [];
            let resultSQL = query.runSuiteQL({
                query: `SELECT id, groupname FROM entitygroup
                    WHERE custentity_mfgmob_wclocation = ${locationId} AND isinactive = 'F'`
            });
            let resultQuery = resultSQL.asMappedResults();
            return resultQuery;
        }

        const getDataWoTKSX = (params) => {
            if(!params.custpage_subsidiary || !params.custpage_location) return [];

            return searchListWoTKSX.getDataSource(params);
        }

        const defaultParams = (params) => {
            let curUser = runtime.getCurrentUser();
            let today = new Date();
            if(!('custpage_subsidiary' in params)) params.custpage_subsidiary = curUser.subsidiary.toString();
            if(!('custpage_fromdt' in params)) params.custpage_fromdt = new Date(today.getFullYear(), today.getMonth(), 1);
            if(!('custpage_todt' in params)) params.custpage_todt = today;
        }

        return {
            onRequest,
            createProductLabor
        };
    });
