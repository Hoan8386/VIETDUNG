/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  12 Jun 2025         Huy Pham                Init & create file, Phát triển chức năng CCCL từ SO (Chứng chỉ chất lượng), from mr.NĐHuy(https://app.clickup.com/t/86cz8ug1w)
 *  09 Feb 2026         Huy Pham                Bổ sung mapping Đại lý cấp 1, from mr.Phúc(https://app.clickup.com/t/86cz8ug1w?comment=90160163899974)
 */
/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search','N/runtime', 'N/url', 
    'N/redirect', 'N/cache', 'N/format',
    '../lib/scv_lib_function.js', '../olib/alasql/alasql.min@4.6.6.js',

    '../cons/scv_cons_format.js',
    '../cons/scv_cons_form.js',

    '../cons/scv_cons_location.js',
    '../cons/scv_cons_customer.js',
    '../cons/scv_cons_role.js',
    '../cons/scv_cons_inspection_plan_detail.js',
    '../cons/scv_cons_pass_or_failed.js',

    '../cons/scv_cons_search_so2cccl.js',
    '../cons/scv_cons_search_cccl_remove.js'
    ],
    /**
     * @param{record} record
     * @param{search} search
     */
    function(record, search,runtime, url, 
        redirect, cache, format,
        lbf, alasql,
        constFormat,
        constForm,

        constLocation,
        constCustomer,
        constRole,
        constInspectionPlanDetail,
        constPassOrFailed,

        constSearchSO2CCCL,
        constSearchCCCLRemove
        ) {
        /**
         * Definition of the Suitelet script trigger point.
         *
         * @param {Object} context
         * @param {ServerRequest} context.request - Encapsulation of the incoming request
         * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
         * @Since 2015.2
         */
        function onRequest(context) {
            constForm.setContext(context);

            let request = context.request;
            let params = request.parameters;
            let curScript = runtime.getCurrentScript();
            let myCache = cache.getCache({
                name: curScript.id,
                scope: cache.Scope.PUBLIC
            });

            if(!!params.custpage_externalid){
                constForm.setMainKeyInventoryDetail("INVENTORYDETAIL_" + params.custpage_externalid);
            }

            if(context.request.method == "GET"){
                onCreateFormUI(params);

                showMsgOnForm(myCache);
                
                constForm.writePage();
            }
            else{
                createChungChiChatLuong(request, myCache);

                redirect.toSuitelet({
					scriptId: curScript.id,
					deploymentId: curScript.deploymentId,
					parameters: {
                        custpage_subsidiary: params.custpage_subsidiary,
                        custpage_location: params.custpage_location,
                        custpage_item: params.custpage_item,
                        custpage_so: params.custpage_so,
                        custpage_customer: params.custpage_customer,
                        custpage_fromdt: params.custpage_fromdt,
                        custpage_todt: params.custpage_todt,
                        custpage_def_reqdt: params.custpage_def_reqdt,
                        custpage_def_delidt: params.custpage_def_delidt,
                    }
				});
            }
        }

        const onCreateFormUI = (_params) => {
            constForm.createForm("Tạo chứng chỉ chất lượng", '../cssl/scv_cs_sl_so2cccl.js');

            constForm.addPageLink([
                constSearchSO2CCCL.ID, constSearchCCCLRemove.ID
            ], true);

            let mainGrp = constForm.addFieldGroup({id: "fieldgrp_main", label: "Bộ lọc"});
            let defaultGrp = constForm.addFieldGroup({id: "fieldgrp_default", label: "Thông tin mặc định"});

            constForm.addSubmitButton("Tạo CCCL");
            constForm.addButton({id: "custpage_btn_search", label: "Search", functionName: "onSearchResult()"});

            let curUser = runtime.getCurrentUser();
            let today = new Date();

            if(curUser.role != constRole.RECORDS.ADMINISTRATOR.ID){
                _params.custpage_subsidiary = curUser.subsidiary;
            }
            else if(!_params.custpage_subsidiary){
                _params.custpage_subsidiary = curUser.subsidiary;
            }
            if(_params.isSearch != "T"){
                if(!_params.custpage_fromdt){
                    _params.custpage_fromdt = constFormat.getBeginOfMonth(today);
                }
                if(!_params.custpage_todt){
                    _params.custpage_todt = constFormat.getEndOfMonth(today);
                }
            }
            if(!_params.custpage_def_reqdt){
                _params.custpage_def_reqdt = today;
            }
            if(!_params.custpage_def_delidt){
                _params.custpage_def_delidt = today;
            }
            if(!_params.custpage_externalid){
                _params.custpage_externalid = lbf.uuidv4();
            }

            let arrResCustomer = getDataCustomer(_params.custpage_subsidiary);
            let arrResLocation = getDataLocation(_params.custpage_subsidiary);

            constForm.setMainKeyInventoryDetail("INVENTORYDETAIL_" + _params.custpage_externalid);

            constForm.addField({
                id: 'custpage_externalid',
                type: "text",
                label: 'Extnernal ID'
            }, false, {
                displayType: "hidden",
                defaultValue: _params.custpage_externalid
            });

            constForm.addField({
                id: "custpage_subsidiary", label: 'Đơn vị',
                type: "select", source: "subsidiary", container: mainGrp.id
            }, true, {
                displayType: curUser.role != constRole.RECORDS.ADMINISTRATOR.ID ? "inline" : "entry",
                defaultValue: _params.custpage_subsidiary
            });

            constForm.addField({
                id: 'custpage_customer', label: 'Khách hàng',
                type: "select", 
                container: mainGrp.id
            }, true, {
                lookup: {
                    data: arrResCustomer, displayExpr: "entityid", valueExpr: "internalid",
                },
                defaultValue: _params.custpage_customer
            });

            constForm.addField({
                id: 'custpage_fromdt', label: 'Từ ngày',
                type: "date", container: mainGrp.id
            }, true, {
                layoutType: "startrow",
                defaultValue: _params.custpage_fromdt
            })
            
            constForm.addField({
                id: 'custpage_todt', label: 'Đến ngày',
                type: "date", container: mainGrp.id
            }, true, {
                layoutType: "endrow",
                defaultValue: _params.custpage_todt
            });

            constForm.addField({
                id: "custpage_location", label: 'Kho',
                type: "multiselect", container: mainGrp.id
            }, false, {
                lookup: {
                    data: arrResLocation, displayExpr: "name", valueExpr: "internalid",
                },
                defaultValue: !!_params.custpage_location ? _params.custpage_location.split(",") : []
            });

            constForm.addField({
                id: "custpage_item", label: 'Mặt hàng',
                type: "multiselect", source: "item", container: mainGrp.id
            }, false, {
                defaultValue: !!_params.custpage_item ? _params.custpage_item.split(",") : []
            });

            constForm.addField({
                id: 'custpage_so', label: 'Số đơn hàng',
                type: "text", container: mainGrp.id
            }, false, {
                defaultValue: _params.custpage_so
            });

            constForm.addField({
                id: 'custpage_def_reqdt', label: 'Ngày yêu cầu',
                type: "date", container: defaultGrp.id
            }, false, {
                layoutType: 'startrow',
                defaultValue: _params.custpage_def_reqdt
            });

            constForm.addField({
                id: 'custpage_def_delidt', label: 'Ngày giao hàng',
                type: "date", container: defaultGrp.id
            }, false, {
                layoutType: 'endrow',
                defaultValue: _params.custpage_def_delidt
            });

            let itemSublist = constForm.addSublist({
                id : "custpage_sl_item",
                type : "LIST",
                label : 'Kết quả'
            });
            itemSublist.addMarkAllButtons();
            constForm.addFieldOfSublist("custpage_sl_item", getColumnOfSublist());

            constForm.addInventoryDetailOfSublist("custpage_sl_item", "custpage_col_inventorydetail",{
                type: "receipt_so2cccl", isEditable: true,
                item: "custpage_col_item",
                quantity: "custpage_col_quantity",
                description: "",
                unit: "custpage_col_unit",
                location: "custpage_col_location"
            });

            if(_params.isSearch == "T"){
                let arrResult = getDataSourceResult(_params);
                
                constForm.setDataOfSublist("custpage_sl_item", arrResult);
            }
        }

        const getColumnOfSublist = () =>{
            let arrColumn = [
                {id: "custpage_col_chk", label: "Chọn", type: "checkbox", displayType: "entry"},
                {id: "custpage_col_item", label: "Mặt hàng", type: "select", source: "item", isMandatory: true},
                {id: "custpage_col_so", label: "Số đơn hàng", type: "select", source: "salesorder", displayType: "disabled"},
                {id: "custpage_col_customer", label: "Khách hàng", type: "text"},
                {id: "custpage_col_delidt", label: "Ngày giao hàng", type: "date", displayType: "entry"},
                {id: "custpage_col_itemcode", label: "Mã sản phẩm", type: "text"},
                {id: "custpage_col_unit", label: "Đơn vị tính", type: "select", source: "-221"},
                {id: "custpage_col_quantityso", label: "Số lượng SO", type: "float"},
                {id: "custpage_col_quantitycreated", label: "Số lượng đã tạo", type: "float"},
                {id: "custpage_col_quantity", label: "Số lượng", type: "float", displayType: "entry"},
                {id: "custpage_col_inventorydetail", label: "Inv. Detail", type: "text"},
                {id: "custpage_col_location", label: "Kho", type: "select", source: "location"},
                
                {id: "custpage_col_insplan", label: "Bộ tiêu chí (*)", type: "select", source: "customrecord_scv_inspection_plans"},
                {id: "custpage_col_subsidiary", label: "Subsidiary ID", type: "text", displayType: "hidden"},
                {id: "custpage_col_itemclass", label: "Item Class ID", type: "text", displayType: "hidden"},
                {id: "custpage_col_certtmpl", label: "Certificate Template", type: "text", displayType: "hidden"},
                {id: "custpage_col_orilineid", label: "Ori Line ID", type: "text", displayType: "hidden"},
                {id: "custpage_col_customerid", label: "Khách hàng ID", type: "text", displayType: "hidden"},
            ];
            
            return arrColumn;
        }

        const getDataSourceResult = (_params) =>{
            let arrItemSO = getDataSS01_SO2CCCL(_params);
            
            let arrSOId = alasql(`SELECT DISTINCT so_internal_id FROM ? `, [arrItemSO.filter(e => !!e.so_internal_id)]);
            arrSOId = arrSOId.map(e => e.so_internal_id)

            let arrCCCLRemove = getDataSS02_CCCLRemove(_params, arrSOId);
            
            let arrResult = [];

            for(let i = 0; i < arrItemSO.length; i++){
                let objItemSO = arrItemSO[i];

                let objRes = {
                    custpage_col_chk: "F",
                    custpage_col_item: objItemSO.mat_hang,
                    custpage_col_so: objItemSO.so_internal_id,
                    custpage_col_customer: objItemSO.khach_hang,
                    custpage_col_delidt: objItemSO.ngay_tao,
                    custpage_col_itemcode: objItemSO.ma_hang,
                    custpage_col_unit: objItemSO.unit_id,
                    custpage_col_quantityso: objItemSO.so_luong * 1,
                    custpage_col_quantitycreated: 0,
                    custpage_col_quantity: 0,
                    custpage_col_insplan: objItemSO.bo_tieu_chi,
                    custpage_col_subsidiary: _params.custpage_subsidiary,
                    custpage_col_itemclass: objItemSO.item_class,
                    custpage_col_certtmpl: objItemSO.mau_in,
                    custpage_col_orilineid: objItemSO.ori_line_id,
                    custpage_col_location: objItemSO.kho,
                    custpage_col_customerid: objItemSO.customer_id,
                };

                let arrCCCLRemove_SO = arrCCCLRemove.filter(e => e.custrecord_scv_yccc_so_doc == objRes.custpage_col_so
                    && e.custrecord_scv_yccc_item == objRes.custpage_col_item
                    && e.custrecord_scv_yccc_ori_id == objRes.custpage_col_orilineid
                );
                arrCCCLRemove_SO.forEach(objCCCLRemove => {
                    objRes.custpage_col_quantitycreated += objCCCLRemove.custrecord_scv_yccc_qty * 1;
                });

                objRes.custpage_col_quantity = objRes.custpage_col_quantityso - objRes.custpage_col_quantitycreated;
                
                if(objRes.custpage_col_quantity == 0) continue;

                arrResult.push(objRes);
            }
            
            return arrResult;
        }

        const createChungChiChatLuong = (_request, _myCache) =>{
            let params = _request.parameters;

            let arrCreatedID = [], arrMsgErr = [];

            let arrLineSelect = getDataSublistDetail(_request);
            if(arrLineSelect.length == 0) return [];

            constForm.mappedResultsInventoryDetail(arrLineSelect, "custpage_col_inventorydetail");

            let arrInspectionPlanId = arrLineSelect.filter(e => !!e.custpage_col_insplan);
            arrInspectionPlanId = alasql(`SELECT DISTINCT custpage_col_insplan FROM ?`, [arrInspectionPlanId]);
            arrInspectionPlanId = arrInspectionPlanId.map(e => e.custpage_col_insplan);

            let arrInspectionPlanDetail = getDataInspectionPlanDetail({custrecord_scv_if_inspec_plan: arrInspectionPlanId});
            
            let req_date = format.parse({type: "date", value: params.custpage_def_reqdt});

            let arrHeaderGroup = alasql(`SELECT DISTINCT custpage_col_certtmpl FROM ?`, [arrLineSelect]);
            
            for(let idxGrp = 0; idxGrp < arrHeaderGroup.length; idxGrp++){
                let objHeaderGroup = arrHeaderGroup[idxGrp];

                let arrLineSelectOfGrp = arrLineSelect.filter(e => e.custpage_col_certtmpl == objHeaderGroup.custpage_col_certtmpl);

                try{
                
                    let objFirstLine = arrLineSelectOfGrp[0];
    
                    let ccclRec = record.create({type: "customrecord_scv_yc_cccl", isDynamic: true});
                    
                    lbf.setValueData(ccclRec, [
                        "custrecord_scv_yccc_customer", "custrecord_scv_yccc_request_date",
                        "custrecord_scv_yccc_sub", "custrecord_scv_yccc_template",
                        "custrecord_scv_yccc_distributor",
                    ], [
                        objFirstLine.custpage_col_customer, req_date,
                        objFirstLine.custpage_col_subsidiary, objFirstLine.custpage_col_certtmpl,
                        objFirstLine.custpage_col_customerid,
                    ]);
    
                    let detailSublistId = "recmachcustrecord_scv_yccc_line_so_phieu";
                    let resultSublistId = "recmachcustrecord_scv_cccl_result_no";
    
                    let sttLine = 1;
                    for(let i = 0; i < arrLineSelectOfGrp.length; i++){
                        let objLine = arrLineSelectOfGrp[i];
    
                        if(!!objLine.custpage_col_delidt){
                            objLine.custpage_col_delidt = format.parse({type: "date", value: objLine.custpage_col_delidt});
                        }
                        else if(!!params.custpage_def_delidt){
                            objLine.custpage_col_delidt = format.parse({type: "date", value: params.custpage_def_delidt});
                        }
    
                        let inventoryDetail = objLine?.inventorydetail || {};
                        let inventoryAssignment = inventoryDetail?.inventoryassignment || [];
                        if(inventoryAssignment.length == 0){
                            inventoryAssignment.push({
                                custpage_inventorynumber: "",
                                custpage_quantity: objLine.custpage_col_quantity,
                            });
                        }

                        for(let j = 0; j < inventoryAssignment.length; j++){
                            let objInvAss = inventoryAssignment[j];

                            //#region Sublist Custom/ Yêu cầu chi tiết
                            ccclRec.selectNewLine(detailSublistId);
                            
                            lbf.setCurrentSublistValueData(ccclRec, detailSublistId, [
                                "custrecord_scv_yccc_line_stt", "custrecord_scv_yccc_item",
                                "custrecord_scv_yccc_so_doc",
                                "custrecord_scv_yccc_itf_date", "custrecord_scv_yccc_category",
                                "custrecord_scv_yccc_item_name", "custrecord_scv_yccc_units",
                                "custrecord_scv_yccc_qty", "custrecord_scv_yccc_manual_lot",
                                "custrecord_scv_cccl_detail_inspect_plan", "custrecord_scv_yccc_ori_id"
                            ], [
                                sttLine++, objLine.custpage_col_item,
                                objLine.custpage_col_so,
                                objLine.custpage_col_delidt, objLine.custpage_col_itemclass,
                                objLine.custpage_col_itemcode, objLine.custpage_col_unit,
                                objInvAss.custpage_quantity, objInvAss.custpage_inventorynumber,
                                objLine.custpage_col_insplan, objLine.custpage_col_orilineid
                            ]);
        
                            ccclRec.commitLine(detailSublistId);
                            //#endregion

                            //#region Sublist Custom/ CCCL- Kết quả
                            let arrInspectionPlanDetail_filter = arrInspectionPlanDetail.filter(e => e.custrecord_scv_if_inspec_plan == objLine.custpage_col_insplan);
                            
                            for(let j = 0; j < arrInspectionPlanDetail_filter.length; j++){
                                let objInsPlanDetail = arrInspectionPlanDetail_filter[j];

                                let kq_text = objInsPlanDetail.custrecord_scv_if_target_value;
                                let kq_number = "";

                                let value_min = objInsPlanDetail.custrecord_scv_if_lower_ctrl_limit;
                                let value_max = objInsPlanDetail.custrecord_scv_if_upper_ctrl_limit;

                                if(lbf.isContainValue(value_min) && lbf.isContainValue(value_max)){
                                    kq_number = constFormat.randomNumberBetween(value_min, value_max);
                                }
        
                                ccclRec.selectNewLine(resultSublistId);
                                lbf.setCurrentSublistValueData(ccclRec, resultSublistId, [
                                    "custrecord_scv_cccl_result_item",
                                    "custrecord_scv_cccl_result_so",
                                    "custrecord_scv_cccl_result_shipped_date", "custrecord_scv_cccl_result_category",
                                    "custrecord_scv_cccl_result_unit",
                                    "custrecord_scv_cccl_result_qty", "custrecord_scv_cccl_result_m_lot",
                                    "custrecord_scv_cccl_result_inspect_plan", "custrecord_scv_cccl_tieu_chi",
                                    "custrecord_scv_cccl_result_kq_text", "custrecord_scv_cccl_result_kq_number",
                                    "custrecord_scv_cccl_result_pass_fail"
                                ], [
                                    objLine.custpage_col_item,
                                    objLine.custpage_col_so,
                                    objLine.custpage_col_delidt, objLine.custpage_col_itemclass,
                                    objLine.custpage_col_unit,
                                    objInvAss.custpage_quantity, objInvAss.custpage_inventorynumber,
                                    objLine.custpage_col_insplan, objInsPlanDetail.internalid,
                                    kq_text, kq_number,
                                    constPassOrFailed.RECORDS.DAT.ID
                                ]);
                                ccclRec.commitLine(resultSublistId);
                            }
                            //#endregion
                        }
                    }
    
                    let ccclRecId = ccclRec.save({enableSourcing: false, ignoreMandatoryFields: true});
    
                    arrCreatedID.push(ccclRecId);
                }
                catch(err){
                    arrMsgErr.push("Error: " + err.message);
                    log.error("ERROR: Try-Catch: createChungChiChatLuong", err);
                }
            }
            
            if(arrCreatedID.length > 0 || arrMsgErr.length > 0){
                let objResCache = {
                    arrCreatedID: arrCreatedID,
                    arrMsgErr: arrMsgErr
                }

                _myCache.put({key: "objResCache", value: JSON.stringify(objResCache), ttl: 300});
            }

            return arrCreatedID;
        }

        const getDataSublistDetail = (_request) => {
            let arrLines = [];

            let itemSublistId = "custpage_sl_item";
            let arrColumn = getColumnOfSublist()

            for (let i = 0; i < _request.getLineCount(itemSublistId); i++) {
                let objLine = {};

                let chk = _request.getSublistValue(itemSublistId, "custpage_col_chk", i);
                if(chk != "T") continue;

                for(let j = 0; j < arrColumn.length; j++){
                    let fieldId = arrColumn[j].id;

                    objLine[fieldId] = _request.getSublistValue(itemSublistId, fieldId, i);
                }

                objLine.custpage_col_inventorydetailstore = _request.getSublistValue(itemSublistId, "custpage_col_inventorydetailstore", i);

                arrLines.push(objLine);
            }
    
            return arrLines;
        }

        const showMsgOnForm = (_myCache)=>{
            let objResCache = _myCache.get({key: "objResCache", loader: "loader"});
            if(!objResCache) return;

            objResCache = JSON.parse(objResCache);

            let arrCreatedID = objResCache.arrCreatedID;
            let arrMsgErr = objResCache.arrMsgErr;

            if(arrCreatedID.length > 0){
                let arrMsgCreated = [];
                for(let i = 0; i < arrCreatedID.length; i++){

                    let tranid = search.lookupFields({type: "customrecord_scv_yc_cccl", id: arrCreatedID[i], columns: ['name']}).name;
                    let urlRc = url.resolveRecord({recordId: arrCreatedID[i], recordType: "customrecord_scv_yc_cccl"});

                    let msg_created = '<a href="' + urlRc + '" target="_blank">' + tranid + '</a>';

                    arrMsgCreated.push(msg_created);
                }
                constForm.addPageInitMessage("Quản lý cấp CCCL đã tạo: " + arrMsgCreated.join(", "));
            }
            if(arrMsgErr.length > 0){
                constForm.addPageInitMessage(arrMsgErr.join("<br/>"));
            }

            _myCache.remove({key: "objResCache"});
        }

        const getDataLocation = (_subsidiaryId) => {
            if(!_subsidiaryId) return [];

            return constLocation.getDataSource(
                search.createFilter({
                    name: 'subsidiary',
                    operator: "anyof",
                    values: _subsidiaryId
                })
            );
        }

        const getDataCustomer = (_subsidiaryId) => {
            if(!_subsidiaryId) return [];

            return constCustomer.getDataSourceSubsidiaryRelationship(
                search.createFilter({
                    name: 'subsidiary',
                    operator: "anyof",
                    values: _subsidiaryId
                })
            );
        }

        const getDataSS01_SO2CCCL = (_params) => {
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
                    values: _params.custpage_location.split(",")
                }))
            }

            if(!!_params.custpage_item){
                myFilters.push(search.createFilter({
                    name: 'item', 
                    operator: "anyof", 
                    values: _params.custpage_item.split(",")
                }))
            }

            if(!!_params.custpage_customer){
                myFilters.push(search.createFilter({
                    name: 'name', 
                    operator: "anyof", 
                    values: _params.custpage_customer
                }))
            }

            if(!!_params.custpage_so){
                myFilters.push(search.createFilter({
                    name: 'formulatext', 
                    formula: "{tranid}",
                    operator: "contains", 
                    values: _params.custpage_so
                }))
            }

            if(!!_params.custpage_fromdt){
                myFilters.push(search.createFilter({
                    name: 'trandate',
                    operator: "onorafter",
                    values: _params.custpage_fromdt
                }));
            }

            if(!!_params.custpage_todt){
                myFilters.push(search.createFilter({
                    name: 'trandate',
                    operator: "onorbefore",
                    values: _params.custpage_todt
                }));
            }
            
            let arrResult = constSearchSO2CCCL.getDataSource(myFilters);

            return arrResult;
        }

        const getDataSS02_CCCLRemove = (_params, _arrSOId) => {
            let myFilters = [];

            if(_arrSOId.length > 0){
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_yccc_so_doc', 
                    operator: "anyof", 
                    values: _arrSOId
                }))
            }
            else{
                return [];
            }

            let arrResult = constSearchCCCLRemove.getDataSource(myFilters);

            return arrResult;
        }
        
        const getDataInspectionPlanDetail = (_params) => {
            let myFilters = [];

            if(!!_params?.custrecord_scv_if_inspec_plan?.toString()){
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_if_inspec_plan', 
                    operator: "anyof", 
                    values: _params.custrecord_scv_if_inspec_plan.toString().split(",")
                }))
            }
            else{
                return [];
            }
            
            let arrResult = constInspectionPlanDetail.getDataSource(myFilters);

            return arrResult;
        }

        return {
            onRequest
        };
    });