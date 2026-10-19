/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define([
    'N/search', 'N/record', 'N/ui/serverWidget', 'N/runtime', 'N/query', 
    'N/url', 'N/redirect', 'N/ui/message', 'N/cache', 'N/task',
    '../lib/scv_lib_function.js',

    '../cons/scv_cons_color.js',
    '../cons/scv_cons_list_loc_type.js', 
    '../cons/scv_cons_approvalstatus.js',
    '../cons/scv_cons_ordertype.js',

    '../cons/scv_cons_search_source_ab_create_to.js',
    '../cons/scv_cons_search_ab_to_tracking_summary.js',
],
    (
        search, record, serverWidget, runtime, query, 
        url, redirect, message, cache, task,
        lbf,

        constColor,
        constListLocType, 
        constAprStatus, 
        constOrderType,

        searchSourceABCreateTO,
        searchABToTrackingSum,
    ) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const CurrentScript = {
            ID: "customscript_scv_sl_mass_create_to",
            DEPLOYMENT: "customdeploy_scv_sl_mass_create_to"
        };

        const MapReduceScript = {
            ID: "customscript_scv_mr_mass_create_to",
            DEPLOYMENT: "customdeploy_scv_mr_mass_create_to",
            INPUT_PARAM: "custscript_scv_inpt_mass_create_to"
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
                let MainForm = onCreateFormUI(params, myCache);
                if(params.isrun === "T") {
                    let searchResult = runFilerterSS(params);
                    onRenderData(MainForm.sublist, searchResult);
                }
                response.writePage(MainForm.form);
            } else {
                onRequestMethodPOST(request, params, myCache);
            }
        }

        const onRequestMethodPOST = (request, params, myCache) => {
            let arrSublist = hanldeDataSublist(request, params);
            let urlScript = getUrlRedirectToScript(params);
            
            if(arrSublist.length <= 3){
                let arrTO = [];
                for(let objSublist of arrSublist) {
                    let toId = createTransferOrder(objSublist);
                    arrTO.push(toId);
                }

                arrTO = arrTO.filter(id => !!id);
                redirect.redirect(urlScript + "&toId=" + arrTO.join(","));
            } else {
                // run map/ reduce
                let mrTask = task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: MapReduceScript.ID,
                    deploymentId: MapReduceScript.DEPLOYMENT
                });
                mrTask.params = {
                    [MapReduceScript.INPUT_PARAM]: JSON.stringify(arrSublist),
                };
                let mrTaskId = mrTask.submit();
                myCache.put({ key: 'mrTaskId', value: mrTaskId });
                redirect.redirect(urlScript);
            }
        }

        const createTransferOrder = (objSublist) => {
            try {
                let {arrSublist, ...objData} = objSublist;

                // create to
                let toRec = record.create({ type: "transferorder", isDynamic: true });
                for(let property in objData) {
                    toRec.setValue(property, objData[property]);
                }
                // insert line
                let sl = "item";
                for(let i = 0; i < arrSublist.length; i++) {
                    let arrInvNumber = arrSublist[i].arrInvNumber;
                    
                    toRec.selectNewLine(sl, i);
                    toRec.setCurrentSublistValue(sl, "item", arrSublist[i].item);
                    toRec.setCurrentSublistValue(sl, "units", arrSublist[i].units);
                    toRec.setCurrentSublistValue(sl, "quantity", arrSublist[i].quantity);
                    toRec.setCurrentSublistValue(sl, "custcol_scv_created_from", arrSublist[i].custcol_scv_created_from);
                    toRec.setCurrentSublistValue(sl, "custcol_scv_related_trans", arrSublist[i].custcol_scv_related_trans);
                    toRec.setCurrentSublistValue(sl, "custcol_scv_ab_to_line_key_inv_detail", arrSublist[i].custcol_scv_ab_to_line_key_inv_detail);

                    if(arrInvNumber.length > 0) {
                        insertInventoryDetail(toRec, arrInvNumber, sl);
                    }
                    toRec.commitLine(sl);
                }

                let toId = toRec.save({enableSourcing: false, ignoreMandatoryFields: true});
                return toId;
            } catch (err) {
                log.error("ERROR createTransferOrder ", err);
                return null;
            }
        }

        const getUrlRedirectToScript = (params) => {
            if(!!params.custpage_rectype) {
                return url.resolveScript({
                    scriptId: CurrentScript.ID,
                    deploymentId: CurrentScript.DEPLOYMENT,
                    params: {
                        rectype: params.custpage_rectype,
                        recid: params.custpage_build,
                    }
                });
            } else {
                return url.resolveScript({
                    scriptId: CurrentScript.ID,
                    deploymentId: CurrentScript.DEPLOYMENT,
                    params: {
                        custpage_subsidiary: params.custpage_subsidiary,
                        custpage_location: params.custpage_location,
                        custpage_shift: params.custpage_shift,
                        custpage_work_center: params.custpage_work_center,
                        custpage_item: params.custpage_item,
                        custpage_build: params.custpage_build,
                        custpage_fromdt: params.custpage_fromdt,
                        custpage_todt: params.custpage_todt
                    }
                });
            }
        }

        const insertInventoryDetail = (toRec, arrInvNumber, sublistId) => {
            let inventorydetailavail = toRec.getCurrentSublistValue({sublistId: sublistId, fieldId: 'inventorydetailavail'});
            let slIVD = 'inventoryassignment';
            if(inventorydetailavail == true || inventorydetailavail == 'T') {
                let invDetailRec = toRec.getCurrentSublistSubrecord({sublistId: sublistId, fieldId: 'inventorydetail'});
                for(let i = 0; i < arrInvNumber.length; i++) {
                    invDetailRec.selectNewLine({sublistId: slIVD});
                    invDetailRec.setCurrentSublistValue(slIVD, "issueinventorynumber", arrInvNumber[i].inv_number);
                    invDetailRec.setCurrentSublistValue(slIVD, "quantity", arrInvNumber[i].inv_quantity);
                    invDetailRec.commitLine({sublistId: slIVD});
                }
            }
        }

        const hanldeDataSublist = (request, params) => {
            let sl = "custpage_sl_result";
            let totalLine = request.getLineCount(sl);
            let arrResult = [];

            for(let i = 0; i < totalLine; i++) {
                let isSelect = request.getSublistValue(sl, "custpage_col_select", i);
                if(isSelect === true || isSelect === "T") {
                    let inv_detail = request.getSublistValue(sl, "custpage_col_inv_detail", i);
                    let json_data = request.getSublistValue(sl, "custpage_col_json_data", i);

                    let objData = {
                        transferlocation: request.getSublistValue(sl, "custpage_col_transferlocation", i),
                        tranid: request.getSublistValue(sl, "custpage_col_tranid", i),
                        trandate: request.getSublistValue(sl, "custpage_col_trandate", i),
                        quantity: request.getSublistValue(sl, "custpage_col_quantity", i) * 1,
                        qty_transfer: request.getSublistValue(sl, "custpage_col_qty_transfer", i) * 1,
                        qty_remain: request.getSublistValue(sl, "custpage_col_qty_remain", i) * 1,
                        qty_create: request.getSublistValue(sl, "custpage_col_qty_create", i) * 1,
                        mfg_date: request.getSublistValue(sl, "custpage_col_mfg_date", i),
                        tksx: request.getSublistValue(sl, "custpage_col_tksx", i),
                        line_key: request.getSublistValue(sl, "custpage_col_line_key", i),

                        ...JSON.parse(json_data)
                    };
                    objData.arrInvNumber = recalculateInvNumber(JSON.parse(inv_detail), objData.qty_create);
                    
                    arrResult.push(objData);
                }
            }

            let arrFinal = [];
            let userId = getCurrentUser(runtime.getCurrentUser().id);
            let arrGrpSublist = lbf.onGroupByArray(arrResult, ["transferlocation", "location"]);
            for(let objGroup of arrGrpSublist) {
                let arrFilterData = arrResult.filter(e => e.location == objGroup.location && e.transferlocation == objGroup.transferlocation);

                let arrSublist = [];
                for(let objFilter of arrFilterData) {
                    arrSublist.push({
                        item: objFilter.item,
                        units: objFilter.units,
                        quantity: objFilter.qty_create,
                        custcol_scv_created_from: objFilter.internalid,
                        custcol_scv_related_trans: objFilter.work_order,
                        custcol_scv_ab_to_line_key_inv_detail: objFilter.line_key,
                        arrInvNumber: objFilter.arrInvNumber,
                    });
                }

                let objFinal = {
                    custbody_scv_order_type: params.custpage_ordertype,
                    subsidiary: params.custpage_subsidiary,
                    location: objGroup.location,
                    transferlocation: objGroup.transferlocation,
                    custbody_scv_approval_status: constAprStatus.RECORDS.OPEN.ID,
                    custbody_scv_employee_ycxvt: userId,
                    arrSublist: arrSublist
                };
                arrFinal.push(objFinal);
            }
            return arrFinal;
        }

        function recalculateInvNumber(arrInvNumber, newQuantity) {
            let remainingQuantity = newQuantity;

            return arrInvNumber.reduce((result, item) => {
                if (remainingQuantity <= 0) {
                    return result;
                }

                const invQuantity = Number(item.inv_quantity);

                const quantity = Math.min(invQuantity, remainingQuantity);

                if (quantity > 0) {
                    result.push({
                        ...item,
                        inv_quantity: quantity
                    });

                    remainingQuantity -= quantity;
                }

                return result;
            }, []);
        }

        const getCurrentUser = (userId) => {
            let entityType = lbf.getEntityType(userId);
            if (entityType === record.Type.EMPLOYEE) return userId;

            let objEntity = getObjTableQueryByID(entityType, ['custentity_scv_partner_employee'], userId);
            return objEntity.custentity_scv_partner_employee || "";
        };

        const getObjTableQueryByID = (_table, _arrColumns, _id) => {
            if (_arrColumns.length === 0) _arrColumns.push("id")
            let resultSearch = query.runSuiteQL({
                query: `SELECT ` + _arrColumns.join(",") + ` 
                FROM ` + _table + `
                WHERE id = ` + _id
            });
            resultSearch = resultSearch.asMappedResults();

            return resultSearch.length > 0 ? resultSearch[0] : {};
        }

        const onRenderData = (sublist, data) => {
            for (let i = 0; i < data.length; i++) {
                let { arrInvNumber, ...obj } = data[i];

                setRowDataSublist(sublist, i, [
                    "custpage_col_tranid", "custpage_col_trandate", "custpage_col_assemblyitem", "custpage_col_units", 
                    "custpage_col_quantity", "custpage_col_location", "custpage_col_workcenter", "custpage_col_shift", 
                    "custpage_col_mfg_date", "custpage_col_tksx", "custpage_col_wo", "custpage_col_inv_detail", 
                    "custpage_col_json_data", "custpage_col_transferlocation", "custpage_col_inv_num", "custpage_col_inv_status",
                    "custpage_col_qty_transfer", "custpage_col_qty_remain", "custpage_col_qty_create", "custpage_col_line_key"
                ], [
                    obj.tranid, obj.trandate, obj.item_display, obj.units_display, obj.total_inv_qty,
                    obj.location_display, obj.workcenter_display, obj.shift_display, obj.mfg_date,
                    obj.thong_ke_sx, obj.work_order_display, JSON.stringify(arrInvNumber), obj.stringify, 
                    obj.transferlocation, obj.inv_number_display, obj.inv_status_display, obj.qty_transfer, 
                    obj.qty_remain, obj.qty_create, obj.line_key
                ]);
            }
        }

        const runFilerterSS = (params) => {
            let data = [];
            if(!!params.rectype && !!params.recid) {
                data = searchSourceABCreateTO.getDataSource(search.createFilter({
                    name: 'internalid', operator: 'anyof', 
                    values: params.recid
                }));
            } else {
                data = getDataSourceABWithFilters(params);
            }

            let arrItemId = groupDataByFieldId(data, "item");
            if(arrItemId.length === 0) return [];

            let arrABTracking = getDataABToTrackingSummary(params, arrItemId);
            let arrResult = [];
            let arrGroupData = lbf.onGroupByArray(data, ["internalid", "item", "inv_number", "inv_status", "line_key"]);

            for(let i = 0; i < arrGroupData.length; i++) {
                let arrFilterData = data.filter(e => {
                    return e.internalid == arrGroupData[i].internalid && e.item == arrGroupData[i].item
                        && e.inv_number == arrGroupData[i].inv_number && e.inv_status == arrGroupData[i].inv_status
                        && e.line_key == arrGroupData[i].line_key;
                });
                
                let arrInvNumber = arrFilterData.map(e => ({inv_number: e.inv_number, inv_quantity: e.inv_quantity}));
                let total_inv_qty = arrInvNumber.reduce((a, b) => a + b.inv_quantity, 0);

                const objABTrack = arrABTracking.find(e => e.line_key == arrGroupData[i].line_key);
                let qty_transfer = Number(objABTrack?.qty_transfer || 0);
                let qty_remain = Number(objABTrack?.qty_remain || 0);

                if(qty_remain > 0) {
                    let objRes = {
                        internalid: arrGroupData[i].internalid,
                        location_display: arrFilterData[0].location_display,
                        transferlocation: arrFilterData[0].transferlocation,
                        tranid: arrFilterData[0].tranid,
                        trandate: arrFilterData[0].trandate,
                        item_display: arrFilterData[0].item_display,
                        quantityuom: arrFilterData[0].quantityuom,
                        units_display: arrFilterData[0].units_display,
                        workcenter_display: arrFilterData[0].workcenter_display,
                        shift_display: arrFilterData[0].shift_display,
                        thong_ke_sx: arrFilterData[0].thong_ke_sx,
                        mfg_date: arrFilterData[0].mfg_date,
                        work_order_display: arrFilterData[0].work_order_display,
                        line_key: arrFilterData[0].line_key,
                        inv_number_display: arrFilterData[0].inv_number_display,
                        inv_status_display: arrFilterData[0].inv_status_display,
                        qty_transfer: qty_transfer,
                        qty_remain: qty_remain,
                        qty_create: qty_remain,

                        stringify: JSON.stringify({
                            internalid: arrGroupData[i].internalid,
                            inv_number: arrFilterData[0].inv_number,
                            inv_status: arrFilterData[0].inv_status,
                            location: arrFilterData[0].location,
                            item: arrFilterData[0].item,
                            workcenter: arrFilterData[0].workcenter,
                            units: arrFilterData[0].units,
                            shift: arrFilterData[0].shift,
                            work_order: arrFilterData[0].work_order,
                        }),

                        total_inv_qty: total_inv_qty,
                        arrInvNumber: arrInvNumber
                    };
                    arrResult.push(objRes);
                }
            }
            return arrResult;
        }

        const getDataSourceABWithFilters = (params) => {
            let myFilters = [];

            if(!!params.custpage_subsidiary) {
                myFilters.push(search.createFilter({
                    name: 'subsidiary', operator: 'anyof', 
                    values: params.custpage_subsidiary
                }));
            }

            if(!!params.custpage_location) {
                myFilters.push(search.createFilter({
                    name: 'location', operator: 'anyof', 
                    values: params.custpage_location
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
            if(!!params.custpage_shift) {
                myFilters.push(search.createFilter({
                    name: 'custbody_scv_shift', operator: 'anyof', 
                    values: params.custpage_shift
                }));
            }
            if(!!params.custpage_work_center) {
                myFilters.push(search.createFilter({
                    name: 'custbody_mfgmob_workcenter', operator: 'anyof', 
                    values: params.custpage_work_center
                }));
            }
            if(!!params.custpage_item) {
                myFilters.push(search.createFilter({
                    name: 'item', operator: 'anyof', 
                    values: params.custpage_item
                }));
            }
            if(!!params.custpage_build) {
                myFilters.push(search.createFilter({
                    name: 'internalid', operator: 'anyof', 
                    values: params.custpage_build
                }));
            }

            let data = searchSourceABCreateTO.getDataSource(myFilters);
            return data;
        }

        const getDataABToTrackingSummary = (params, arrItemId) => {
            let myFilters = [];

            myFilters.push(search.createFilter({
                name: 'item', operator: 'anyof', 
                values: arrItemId
            }));

            if(!!params.custpage_subsidiary) {
                myFilters.push(search.createFilter({
                    name: 'subsidiary', operator: 'anyof', 
                    values: params.custpage_subsidiary
                }));
            }

            if(!!params.custpage_location) {
                myFilters.push(search.createFilter({
                    name: 'location', operator: 'anyof', 
                    values: params.custpage_location
                }));
            }

            if(!!params.custpage_fromdt) {
                myFilters.push(search.createFilter({
                    name: 'formuladate',
                    formula: "decode({recordtype}, 'assemblybuild', {trandate}, {custcol_scv_created_from.trandate})",
                    operator: "onorafter",
                    values: params.custpage_fromdt
                }));
            }

            if(!!params.custpage_todt) {
                myFilters.push(search.createFilter({
                    name: 'formuladate',
                    formula: "decode({recordtype}, 'assemblybuild', {trandate}, {custcol_scv_created_from.trandate})",
                    operator: "onorbefore",
                    values: params.custpage_todt
                }));
            }

            let data = searchABToTrackingSum.getDataSource(myFilters);
            return data;
        }

        const onCreateFormUI = (params, myCache) => {
            let mainForm = serverWidget.createForm({title: "Tạo Yêu cầu điều chuyển thành phẩm từ Phiếu thống kê"});
            mainForm.clientScriptModulePath = '../cssl/scv_cs_sl_mass_create_to.js';
            let filterGrp = addFieldGroup(mainForm, "fieldgrp_main", "Filter");
            let defaultGrp = addFieldGroup(mainForm, "default_main", "Default Value");
            // add button
            mainForm.addSubmitButton({label : 'Submit'});
            if(!params.rectype) {
                mainForm.addButton({id: "custpage_btn_search", label: "Search", functionName: "onSearchResult()"});
                mainForm.addButton({id: "custpage_btn_refresh", label: "Refresh", functionName: "onRefresh()"});
            }

            if(!!params.toId) {
                let arrTO = params.toId.split(",");

                let arrTransaction = getDocumentNumberRecord(arrTO);
                let msgInfo = "Tạo thành công Transfer Order: ";

                let index = 0;
                for(let obj of arrTransaction) {
                    index++;
                    msgInfo += createTagLink("transferorder", obj.id, obj.tranid) + (index === arrTransaction.length ? "." : ", ");
                }

                mainForm.addPageInitMessage({
                    type: message.Type.INFORMATION,
                    message: msgInfo,
                    duration: -1,
                });
            }
            // update status
            let mrTaskId = params.mrTaskId;

            if (lbf.isContainValue(mrTaskId) == false) {
                mrTaskId = myCache.get({
                    key: 'mrTaskId',
                    loader: 'loader'
                });
            }
            if (lbf.isContainValue(mrTaskId)) {
                let taskStatus = task.checkStatus(mrTaskId);
                let messageInfo = 'Status of Create Transfer Order: ' + taskStatus.status;
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
            let custpage_location = mainForm.addField({
                id: "custpage_location",
                type: serverWidget.FieldType.SELECT,
                label: "Kho",
                container: filterGrp.id
            });

            let custpage_shift = mainForm.addField({
                id: "custpage_shift",
                type: serverWidget.FieldType.SELECT,
                label: "Ca",
                source: "customrecord_mfgmob_shift",
                container: filterGrp.id
            });

            let custpage_work_center = mainForm.addField({
                id: "custpage_work_center",
                type: serverWidget.FieldType.SELECT,
                label: "Máy",
                container: filterGrp.id
            });

            let custpage_item = mainForm.addField({
                id: "custpage_item",
                type: serverWidget.FieldType.SELECT,
                label: "Thành phẩm",
                source: "item",
                container: filterGrp.id
            });

            let custpage_build = mainForm.addField({
                id: "custpage_build",
                type: serverWidget.FieldType.SELECT,
                label: "Phiếu thống kê",
                source: "assemblybuild",
                container: filterGrp.id
            });

            if(!params.rectype) {
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

                custpage_fromdt.updateLayoutType({layoutType: 'STARTROW'});
                custpage_todt.updateLayoutType({layoutType: 'ENDROW'});

                custpage_fromdt.defaultValue = getFromDate(params.custpage_fromdt);
                custpage_todt.defaultValue = getToDate(params.custpage_todt);
            }

            let custpage_ordertype = mainForm.addField({
                id: "custpage_ordertype",
                type: serverWidget.FieldType.SELECT,
                label: "Loại điều chuyển",
                source: "customrecord_scv_order_type",
                container: defaultGrp.id
            });

            let custpage_rectype = mainForm.addField({
                id: "custpage_rectype",
                type: serverWidget.FieldType.TEXT,
                label: "RecType",
                container: filterGrp.id
            });
            

            custpage_subsidiary.isMandatory = true;
            custpage_location.isMandatory = true;
            custpage_ordertype.isMandatory = true;
            custpage_rectype.updateDisplayType({ displayType: "hidden" });

            custpage_ordertype.defaultValue = constOrderType.RECORDS.CHUYEN_KHO_SX_SANG_KHO_TP.ID;
            let objUser = runtime.getCurrentUser();
            let subsidiary = objUser.subsidiary;
            let location = null;
            if(!!params.rectype) {
                let abRec = record.load({ type: params.rectype, id: params.recid });
                subsidiary = abRec.getValue("subsidiary");
                location = abRec.getValue("location");

                custpage_rectype.defaultValue = abRec.type;
                custpage_subsidiary.updateDisplayType({ displayType: "disabled" });
                custpage_build.updateDisplayType({ displayType: "disabled" });
                custpage_location.updateDisplayType({ displayType: "disabled" });

                custpage_shift.updateDisplayType({ displayType: "hidden" });
                custpage_work_center.updateDisplayType({ displayType: "hidden" });
                custpage_item.updateDisplayType({ displayType: "hidden" });
            }
            location = params?.custpage_location || location;
            let arrLocation = getDataLocation(params.custpage_subsidiary, subsidiary);
            let arrEntGroup = getDataEntityGroup(params.custpage_location);

            onLoadSubsidiaryRole(custpage_subsidiary, subsidiary);
            onLoadLocation(custpage_location, arrLocation, location);
            onLoadWorkCenter(custpage_work_center, arrEntGroup);

            if(!!params.custpage_build) {
                custpage_build.defaultValue = params.custpage_build;
            } else {
                custpage_build.defaultValue = params?.recid || null;
            }
            let fields = [
                custpage_subsidiary, custpage_shift, custpage_work_center,
                custpage_location, custpage_item
            ];
            defaultValueFields(fields, params);
            // create sublist
            let sublist = mainForm.addSublist({
                id: "custpage_sl_result",
                type: serverWidget.SublistType.LIST,
                label: 'Kết quả',
            });

            sublist.addMarkAllButtons();
            onCreateSublistColumn(sublist, params, subsidiary);

            return {form: mainForm, sublist}
        }

        const defaultValueFields = (fields, params) => {
            for(let objField of fields) {
                objField.defaultValue = params[objField.id];
            }
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

        const onCreateSublistColumn = (sublist, params, subsidiary) => {
            let arrLocation = getDataLocationSublistResult(params.custpage_subsidiary, subsidiary);
            let required = `<span class="uir-required-icon">*</span>`;
            
            let arrColumn = [
                { id: "custpage_col_select", label: "Select", type: "checkbox", displayType: "entry" },
                { id: "custpage_col_transferlocation", label: "Kho nhập " + required, type: "select", displayType: "entry" },
                { id: "custpage_col_tranid", label: "Số phiếu", type: "text" },
                { id: "custpage_col_trandate", label: "Ngày", type: "text" },
                { id: "custpage_col_assemblyitem", label: "Thành phẩm", type: "text" },
                { id: "custpage_col_units", label: "Đơn vị tính", type: "text" },
                { id: "custpage_col_inv_num", label: "Lot Number", type: "text" },
                { id: "custpage_col_inv_status", label: "Status", type: "text" },
                { id: "custpage_col_quantity", label: "Số lượng hoàn thành", type: "float" },
                { id: "custpage_col_qty_transfer", label: "Số lượng đã điều chuyển", type: "float" },
                { id: "custpage_col_qty_remain", label: "Số lượng còn lại", type: "float", displayType: "entry" },
                { id: "custpage_col_qty_create", label: "Số lượng", type: "float", displayType: "entry" },
                { id: "custpage_col_location", label: "Kho", type: "text" },
                { id: "custpage_col_workcenter", label: "Máy", type: "text" },
                { id: "custpage_col_shift", label: "Ca", type: "text" },
                { id: "custpage_col_mfg_date", label: "Ngày sản xuất", type: "text" },
                { id: "custpage_col_tksx", label: "Số thống kê sản xuất", type: "text" },
                { id: "custpage_col_wo", label: "Lệnh sản xuất", type: "text" },
                { id: "custpage_col_line_key", label: "Line Key", type: "text", displayType: "hidden" },
                { id: "custpage_col_inv_detail", label: "Inventory Detail", type: "textarea", displayType: "hidden" },
                { id: "custpage_col_json_data", label: "JSON Data", type: "textarea", displayType: "hidden" },
            ];

            for(let i = 0; i < arrColumn.length; i++){
                let field = sublist.addField({
                    id: arrColumn[i].id,
                    type: arrColumn[i].type,
                    label: arrColumn[i].label,
                    // source: arrColumn[i].source || null,
                });
                field.updateDisplayType({ displayType: arrColumn[i].displayType || "inline"});
                
                if(arrColumn[i].id === "custpage_col_qty_remain") {
                    field.updateDisplayType({ displayType: "disabled"});
                }

                if(arrColumn[i].id === "custpage_col_transferlocation") {
                    onLoadLocation(field, arrLocation);
                }
            }
        }

        function onLoadSubsidiaryRole(_subsidiaryField, _subsidiaryId){
            let data = getDataSubsidiaryByRole(_subsidiaryId);
            for(let obj of data) {
                _subsidiaryField.addSelectOption({
                    value: obj.id, text: obj.name, isSelected: obj.id == _subsidiaryId
                });
            }
        }

        const getDataSubsidiaryByRole = (_subsidiaryId) => {
            let subSearch = search.create({
                type: "subsidiary",
                // filters: ["internalid", "anyof", _subsidiaryId],
                columns: ["namenohierarchy"]
            });
            subSearch = subSearch.run().getRange(0, 1000);

            let arrResult = [];
            for(let i in subSearch){
                arrResult.push({
                    id: subSearch[i].id,
                    name: subSearch[i].getValue('namenohierarchy'),
                });
            }
            return arrResult;
        }

        const onLoadLocation = (_locationField, _arrLocation, _locationId) => {
            _locationField.addSelectOption({value : "", text : ""});

            for(let i in _arrLocation) {
                _locationField.addSelectOption({
                    value: _arrLocation[i].id, 
                    text: _arrLocation[i].fullname,
                    isSelected: _arrLocation[i].id == _locationId
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

        const createTagLink = (type, internalid, tranid) => {
            let urlRec = url.resolveRecord({
                recordType: type,
                recordId: internalid,
            });
            let html = `<span><a href="${urlRec}" target="_blank" style="color: ${constColor.BLUE[600]}">${tranid}</a>`;
            html += `</span>`;
            return html;
        }

        const getDocumentNumberRecord = (arrTO) => {
            let resultSQL = query.runSuiteQL({
                query: `SELECT id, tranid FROM transaction
                WHERE id IN (${arrTO.join(",")})`
            });

            return resultSQL.asMappedResults();
        }

        const getDataLocationSublistResult = (_subParam, _subsidiaryId) => {
            let subsidiary = _subParam || _subsidiaryId;
            let resultSQL = query.runSuiteQL({
                query: `
                    SELECT id, fullname, subsidiary FROM location
                    WHERE isinactive = 'F'`
            });

            let resultQuery = resultSQL.asMappedResults();
            resultQuery = resultQuery.filter(e => e.subsidiary == subsidiary);
            return resultQuery;
        }

        const getDataLocation = (_subParam, _subsidiaryId) => {
            let subsidiary = _subParam || _subsidiaryId;
            let resultSQL = query.runSuiteQL({
                query: `
                    SELECT id, fullname, subsidiary FROM location
                    WHERE custrecord_scv_loc_type = ${constListLocType.RECORDS.KHO_SAN_XUAT.ID} AND isinactive = 'F'`
            });

            let resultQuery = resultSQL.asMappedResults();
            resultQuery = resultQuery.filter(e => e.subsidiary == subsidiary);
            return resultQuery;
        }

        const onLoadWorkCenter = (_workCenterField, arrEntGroup) => {
            _workCenterField.addSelectOption({value : "", text : ""});

            for(let i in arrEntGroup) {
                _workCenterField.addSelectOption({value: arrEntGroup[i].id, text: arrEntGroup[i].groupname});
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

        const getFromDate = (fromdt) => {
            if (lbf.isContainValue(fromdt)) {
                return fromdt;
            }
            let d = new Date();
            return new Date(d.getFullYear(), d.getMonth(), "01");
        }
        
        const getToDate = (todt) => {
            if (lbf.isContainValue(todt)) {
                return todt;
            }
            let d = new Date();
            return new Date(d.getFullYear(), d.getMonth() + 1, 0);
        }

        function addFieldGroup(_form, _id, _label){
            let _obj = {id: _id, label: _label}
            _form.addFieldGroup(_obj);
            return _obj;
        }

        return {onRequest, createTransferOrder}

    });
