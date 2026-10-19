/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define([
    'N/runtime', 'N/search', 'N/record', 'N/file',
    '../lib/scv_lib_function.js',
    '../olib/moment.js',
    '../cons/scv_cons_form.js',
    '../cons/scv_cons_role.js',
    '../cons/scv_cons_subsidiary.js',
    '../cons/scv_cons_search.js',
    '../cons/scv_cons_search_bchc_mro_comp_wo.js',
    '../cons/scv_cons_search_bchc_nhan_cong_wo.js',
    '../cons/scv_cons_search_bchc_actual_nhancong.js',
    '../cons/scv_cons_search_bchc_info_wo.js'
],
    (
        runtime, search, record, file,
        lbf,
        moment,
        constForm,
        constRole,
        constSubsidiary,
        constSearch,
        searchMroCompWO,
        searchNhanCongWO,
        searchActualNhanCong,
        searchInfoWO
    ) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */

        const ScriptRecord = {
            ID: "customscript_scv_sl_wo_completion_rpt",
            DEPLOYUI: "customdeploy_scv_sl_wo_completion_rpt",
            DEPLOYID_DATA: "customdeploy_scv_sl_wo_completion_data"
        };

        const WorkOrderType = {
            GiaCongCoKhi: {
                ID: 6, NAME: "Gia công cơ khí"
            },
            XayDungCoBan: {
                ID: 12, NAME: "Xây dựng cơ bản"
            }
        };

        const onRequest = (scriptContext) => {
            constForm.setContext(scriptContext);
            constForm.setServiceScript(ScriptRecord.ID, ScriptRecord.DEPLOYID_DATA);

            let request = scriptContext.request;
            let params = request.parameters;
            let curScript = runtime.getCurrentScript();

            if(curScript.deploymentId == ScriptRecord.DEPLOYID_DATA) {
                let objResponse = {
                    isSucess: true,
                    data: []
                };

                switch(params.action) {
                    case "getDataWOCompletion":
                        objResponse.data = runFilterSS(params);
                        break;
                    case "getDataWorkOrder":
                        objResponse.data = getDataWorkOrder(params);
                        break;
                    case "getDataSearchInfoWO":
                        objResponse.data = getDataSSInfoWOBCHoanCong(params);
                        break;
				}
                constForm.write(objResponse);
            } else {
                if(request.method == "GET"){
                    onCreateFormUI(params);
                    constForm.writePage();
                }
            }
        }

        const runFilterSS = (params) => {
            let objResult = {
                // objWorkOrder: getDataWorkOrderById(params.custpage_wo)
            };

            let canViewPrice = checkCurUserRoleCanViewPrice();
            objResult.canViewPrice = canViewPrice;

            let arrMroCompWO = getDataSSBCHCMroCompWO(params);
            arrMroCompWO.sort((a, b) => a.item_code.localeCompare(b.item_code));
            let arrNhanCongWO = getDataSSBCHCNhanCongWO(params);
            let arrActualNC = getDataSSActualNhanCong(arrNhanCongWO);

            objResult.arrMroCompWO = handleDataMroCompletionWO(arrMroCompWO, canViewPrice);
            objResult.arrNhanCongWO = handleDataNhanCongWO(arrNhanCongWO, arrActualNC, canViewPrice);
            return objResult;
        }

        const checkCurUserRoleCanViewPrice = () => {
            const objCurUser = runtime.getCurrentUser();
            const roleId = objCurUser.role;

            let canViewPrice = constRole.getDataAllowViewGtriHCById(roleId);
            if(roleId == constRole.RECORDS.ADMINISTRATOR.ID) {
                canViewPrice = true;
            }

            return canViewPrice;
        }

        const handleDataMroCompletionWO = (arrMroCompWO, canViewPrice) => {
            let arrResult = [];
            let objTotal = {
                level: 1, item_name: "Tổng cộng",
                mro_usage_qty: 0, mro_usage_amount: 0,
                in_qty_actual: 0, out_qty_actual: 0,
                actual_usage: 0, amount_difference: 0,
                gtri_hoan_cong: 0
            };

            let idx = 0;
            for(let obj of arrMroCompWO) {
                idx++;

                let objResult = {
                    ...obj,
                    stt: idx,
                    // mro_usage_qty: obj.mro_usage_qty * 1,
                    // mro_usage_rate: obj.mro_usage_rate * 1,
                    // mro_usage_amount: obj.mro_usage_amount * 1,
                    in_qty_actual: obj.in_qty_actual * 1,
                    out_qty_actual: obj.out_qty_actual * 1,
                    actual_usage: obj.actual_usage * 1,
                    amount_difference: obj.amount_difference * 1,
                    gtri_hoan_cong: canViewPrice ? (obj.gtri_hoan_cong * 1) : 0
                }; 
                arrResult.push(objResult);
                // total
                objTotal.mro_usage_qty += objResult.mro_usage_qty * 1;
                objTotal.mro_usage_amount += objResult.mro_usage_amount * 1;
                objTotal.in_qty_actual += objResult.in_qty_actual * 1;
                objTotal.out_qty_actual += objResult.out_qty_actual * 1;
                objTotal.actual_usage += objResult.actual_usage * 1;
                objTotal.amount_difference += objResult.amount_difference * 1;
                objTotal.gtri_hoan_cong += objResult.gtri_hoan_cong * 1;
            }

            arrResult.push(objTotal);
            return arrResult;
        }

        const handleDataNhanCongWO = (arrNhanCongWO, arrActualNC, canViewPrice) => {
            let arrResult = [];
            let objTotal = {
                level: 1, description: "Tổng cộng",
                planquantity: 0, planamount: 0,
                actualquantity: 0, actualamount: 0, 
                workday_difference: 0, amount_difference: 0
            };

            let idx = 0;
            for(let obj of arrNhanCongWO) {
                idx++;

                let objFindActual = arrActualNC.find(e => e.createdfrom == obj.workorder && e.description == obj.description);

                let objResult = {
                    ...obj,
                    stt: idx,
                    planquantity: obj.planquantity * 1,
                    planrate: obj.planrate * 1,
                    planamount: obj.planamount * 1,
                    actualquantity: obj.actualquantity * 1,
                    actualamount: canViewPrice ? ((objFindActual?.gtri_thucte || 0) * 1) : 0,
                    workday_difference: obj.workday_difference * 1,

                    actualrate: 0,
                    amount_difference: 0,
                };
                
                if(objResult.actualquantity > 0) {
                    objResult.actualrate = objResult.actualamount / objResult.actualquantity;
                }
                objResult.amount_difference = canViewPrice ? (objResult.actualamount - objResult.planamount) : 0;

                arrResult.push(objResult);
                // total
                objTotal.planquantity += objResult.planquantity;
                objTotal.planamount += objResult.planamount;
                objTotal.actualquantity += objResult.actualquantity;
                objTotal.actualamount += objResult.actualamount;
                objTotal.workday_difference += objResult.workday_difference;
                objTotal.amount_difference += (canViewPrice ? objResult.amount_difference : 0);
            }

            arrResult.push(objTotal);
            return arrResult;
        }

        const getDataSSInfoWOBCHoanCong = (params) => {
            if(!params.custpage_wo) return {};

            let data = searchInfoWO.getDataSource(search.createFilter({
                name: 'internalid', 
                operator: "anyof", 
                values: params.custpage_wo
            }));

            let objResult = data.length > 0 ? data[0] : {};
            
            let canViewPrice = checkCurUserRoleCanViewPrice();
            objResult.custbody_scv_total_qty_store = canViewPrice ? (objResult.custbody_scv_total_qty_store * 1) : 0
            return objResult;
        }

        const getDataWorkOrder = (params) => {
            if(!params.custpage_wo) return {};
            let woRec = record.load({ type: "workorder", id: params.custpage_wo });
            let actualproductionstartdate = woRec.getValue("actualproductionstartdate");
            let trandate = woRec.getValue("trandate");
            
            let fromMonth = "", toMonth = "";;
            if(!!trandate) {
                fromMonth = moment(trandate).format('MM/YYYY');
            }
            if(!!actualproductionstartdate) {
                toMonth = moment(actualproductionstartdate).format('MM/YYYY');
            }

            let objSubsidiary = {};
            if(!!params.custpage_subsidiary) {
                let arrSubsidiary = constSubsidiary.getInfoSubsidiaryById(params.custpage_subsidiary);
                objSubsidiary = arrSubsidiary.length > 0 ? arrSubsidiary[0] : {};
            }

            let objResult = {
                internalid: woRec.id,
                assemblyitem: woRec.getValue("assemblyitem"),
                assemblyitem_display: woRec.getText("assemblyitem"),
                tranid: woRec.getValue("tranid"),
                units: woRec.getValue("units"),
                units_display: woRec.getText("units"),
                quantity: woRec.getValue("quantity") * 1,
                custbody_scv_total_qty: woRec.getValue("custbody_scv_total_qty") * 1,
                built: 0,
                custbody_scv_wo_assembly_qty_built: woRec.getValue("custbody_scv_wo_assembly_qty_built") * 1,
                fromMonth: fromMonth,
                toMonth: toMonth ? toMonth : "......",
                objSubsidiary: objSubsidiary
            };
            return objResult;
        }

        const getDataSSBCHCMroCompWO = (params) => {
            let myFilters = [];
            if(!!params.custpage_subsidiary) {
                myFilters.push(search.createFilter({
                    name: 'subsidiary', 
                    operator: "anyof", 
                    values: params.custpage_subsidiary
                }));
            }
            if(!!params.custpage_wo) {
                myFilters.push(search.createFilter({
                    name: 'custbody_scv_work_order_no', 
                    operator: "anyof", 
                    values: params.custpage_wo
                }));
            }

            let data = searchMroCompWO.getDataSource(myFilters);
            return data;
        }

        const getDataSSBCHCNhanCongWO = (params) => {
            let myFilters = [];
            if(!!params.custpage_subsidiary) {
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_cmms_lb_subsidiaries', 
                    operator: "anyof", 
                    values: params.custpage_subsidiary
                }));
            }
            if(!!params.custpage_wo) {
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_cmms_lb_wo', 
                    operator: "anyof", 
                    values: params.custpage_wo
                }));
            }

            let data = searchNhanCongWO.getDataSource(myFilters);
            return data;
        }

        const getDataSSActualNhanCong = (arrNhanCongWO) => {
            let arrWoId = groupDataByFieldId(arrNhanCongWO, "workorder");
            if(arrWoId.length == 0) return [];

            let myFilters = search.createFilter({
                name: 'createdfrom', 
                operator: "anyof", 
                values: arrWoId
            });

            let data = searchActualNhanCong.getDataSource(myFilters);
            return data;
        }

        const onCreateFormUI = (params) => {
            constForm.createForm("Báo cáo hoàn công", "../cssl/scv_cs_sl_wo_completion_rpt.js");

            constForm.addPageLink([
                searchMroCompWO.ID, searchNhanCongWO.ID, 
                searchActualNhanCong.ID,
                searchInfoWO.ID
            ], true);

            constForm.addButton({id: "custpage_btn_search", label: "Search", functionName: "onSearchResult()"});
            constForm.addButton({id: "custpage_btn_export", label: "Export", functionName: "onExport()"});
            let mainGrp = constForm.addFieldGroup({id: "fieldgrp_main", label: "Filter"});

            // add fields
            let curUser = runtime.getCurrentUser();
            if(!params.custpage_subsidiary){
                params.custpage_subsidiary = curUser.subsidiary;
            }

            constForm.addField({
                id: 'custpage_subsidiary', label: 'Công ty/Chi nhánh', 
                container: mainGrp.id, type: "select",
            }, true, {
                lookup: {
                    data: constSubsidiary.getDataSubsidiaryByUserRole(),
                    valueExpr: "id", displayExpr: "namenohierarchy",
                },
                defaultValue: params?.custpage_subsidiary,
            });

            constForm.addField({
                id: 'custpage_wo', label: 'Lệnh gia công', 
                container: mainGrp.id, type: "select",
            }, true, {
                lookup: {
                    data: getDataWorkOrderWithFilter(params?.custpage_subsidiary),
                    valueExpr: "internalid", displayExpr: "wo_item_nm",
                },
                defaultValue: params?.custpage_wo
            });

            constForm.addField({
                id: 'custpage_url_file_exp', label: 'File Export', 
                container: mainGrp.id, type: "text",
            }, false,{
                defaultValue: getUrlFile('../xls/scv_wo_completion_rpt.xlsx'),
                displayType: "hidden"
            });

            let mroCompWoTab = constForm.addTab({ id: "tab_mro_comp_wo", label: "Tổng hợp vật tư" });
            let nhanCongWoTab = constForm.addTab({ id: "tab_nhan_cong", label: "Hoàn công nhân công" });

            constForm.addGridDx({
                id: "custpage_sl_mro_comp_wo",
                type: "grid",
                label: 'Result',
                tab: mroCompWoTab.id,
                columns: [
                    {dataField: "stt", caption: "STT", dataType: "number", width: 60},
                    {dataField: "item_code", caption: "Mã vật tư", dataType: "string", width: 140},
                    {dataField: "item_name", caption: "Tên vật tư", dataType: "string", width: 250},
                    {dataField: "unit", caption: "ĐVT", dataType: "string", width: 60},
                    {
                        caption: "Dự toán thiết kế", columns: [
                            {dataField: "mro_usage_qty", caption: "Số lượng", dataType: "number", format: "###,###,##0.##", width: 80},
                            {dataField: "mro_usage_rate", caption: "Đơn giá", dataType: "number", format: "###,###,##0.##", width: 120},
                            {dataField: "mro_usage_amount", caption: "Thành tiền", dataType: "number", format: "###,###,##0.##", width: 120},
                        ]
                    },
                    {
                        caption: "Thực tế", columns: [
                            {dataField: "inventoryadjust", caption: "Số phiếu", dataType: "string", width: 100},
                            {dataField: "out_qty_actual", caption: "SL xuất", dataType: "number", format: "###,###,##0.##", width: 80},
                            {dataField: "in_qty_actual", caption: "SL nhập", dataType: "number", format: "###,###,##0.##", width: 120},
                            {dataField: "actual_usage", caption: "Tiêu hao thực tế", dataType: "number", format: "###,###,##0.##", width: 120},
                        ]
                    },
                    {dataField: "amount_difference", caption: "Chênh lệch (TT-DT)", dataType: "number", format: "###,###,##0.##", width: 120},
                    {dataField: "gtri_hoan_cong", caption: "Giá trị hoàn công", dataType: "number", format: "###,###,##0.##", width: 120},
                ]
            });

            constForm.addGridDx({
                id: "custpage_sl_nhan_cong_wo",
                type: "grid",
                label: 'Result',
                tab: nhanCongWoTab.id,
                columns: [
                    {dataField: "stt", caption: "STT", dataType: "number", width: 60},
                    {dataField: "description", caption: "Nội dung", dataType: "string", width: 250},
                    {
                        caption: "Dự toán", columns: [
                            {dataField: "planquantity", caption: "Ngày công", dataType: "number", format: "###,###,##0.##", width: 100},
                            {dataField: "planrate", caption: "Đơn giá TB", dataType: "number", format: "###,###,##0.##", width: 140},
                            {dataField: "planamount", caption: "Thành tiền", dataType: "number", format: "###,###,##0.##", width: 140},
                        ]
                    },
                    {
                        caption: "Thực tế", columns: [
                            {dataField: "actualquantity", caption: "Ngày công", dataType: "number", format: "###,###,##0.##", width: 100},
                            {dataField: "actualrate", caption: "Đơn giá TB", dataType: "number", format: "###,###,##0.##", width: 140},
                            {dataField: "actualamount", caption: "Thành tiền", dataType: "number", format: "###,###,##0.##", width: 140},
                        ]
                    },
                    {
                        caption: "Chênh lệch (TT-DT)", columns: [
                            {dataField: "workday_difference", caption: "Ngày công", dataType: "number", format: "###,###,##0.##", width: 100},
                            {dataField: "amount_difference", caption: "Thành tiền", dataType: "number", format: "###,###,##0.##", width: 140},
                        ]
                    },
                ]
            });

            ["custpage_sl_mro_comp_wo", "custpage_sl_nhan_cong_wo"].forEach((sublistId) => {
                constForm.setOptionsDx(sublistId, {
                    onCellPrepared: (e) => {
                        if(e.rowType == "data" && e.column.allowEditing == true) {
                            if(e.row.data?.level == 1) {
                                e.cellElement.css("font-weight", "bold");
                            }
                        }
                    },
                    export: { enabled: false },
                });
            });
        }

        const getDataWorkOrderWithFilter = (subsidiary) => {
            if(!subsidiary) return [];
            let resultSearch =  constSearch.createSearchWithFilter({
                type: "workorder",
                filters:
                [
                    [
                        "custbody_scv_work_order_type", "anyof", 
                        [WorkOrderType.GiaCongCoKhi.ID, WorkOrderType.XayDungCoBan.ID]
                    ],
                    "AND",
                    ["subsidiary", "anyof", subsidiary],
                    "AND",
                    ["mainline","is","T"],
			        "AND",
			        ["taxline","is","F"], 
                ],
                columns:
                [
                    "internalid", "tranid", "custbody_scv_work_order_type", "item",
                    // search.createColumn({ name: 'upccode', join: 'item' })
                ]
            }, []);
            
            let arrResult = constSearch.fetchResultSearchRunEach(resultSearch, function(_objTmpl, _column){
                let objResTmpl = constSearch.getObjResultFromSearchByKey(_objTmpl, _column, [
                    "internalid", "tranid", "custbody_scv_work_order_type", "item",
                    // "item_code"
                ]);

                objResTmpl.wo_item_nm = objResTmpl.tranid + " | " + objResTmpl.item_display;
                return objResTmpl;
            });

            return arrResult;
        }

        const getUrlFile = (_fileId) => {
            return file.load({id: _fileId}).url;
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

        return {onRequest}

    });
