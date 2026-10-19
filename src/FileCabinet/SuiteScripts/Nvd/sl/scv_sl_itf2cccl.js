/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  10 Dec 2024         Huy Pham                Init & create file, Phát triển chức năng CCCL (Chứng chỉ chất lượng),
 *                                                  luôn luôn tạo ra 1 phiếu, from mr.NĐHuy(https://app.clickup.com/t/86cx8bp6d)
 *  16 Dec 2024         Huy Pham                Bổ sung chức năng + có thể sinh ra nhiều phiếu, from mr.NĐHuy(https://app.clickup.com/t/86cx8bp6d?comment=90160079256350)
 *  02 Jul 2025         Huy Pham                Update logic search&create, from mr.NĐHuy(https://app.clickup.com/t/86cx8bp6d?comment=90160119494059)
 *  15 Jul 2025         Huy Pham                Bổ sung chức năng validate khi submit, from mr.NĐHuy(https://app.clickup.com/t/86cx8bp6d?comment=90160122054554)
 *  09 Feb 2026         Huy Pham                Bổ sung mapping Đại lý cấp 1, from mr.Phúc(https://app.clickup.com/t/86cx8bp6d?comment=90160163899824)
 */
/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search','N/ui/serverWidget','N/runtime', 'N/url', 
    'N/redirect', 'N/cache', 'N/ui/message', 'N/format',
    '../lib/scv_lib_function.js', '../lib/scv_lib_report.js', '../olib/alasql/alasql.min@1.7.3',

    '../cons/scv_cons_record.js',
    '../cons/scv_cons_format.js',

    '../cons/scv_cons_location.js',
    '../cons/scv_cons_customer.js',
    '../cons/scv_cons_role.js',
    '../cons/scv_cons_inspection_plan_detail.js',
    '../cons/scv_cons_pass_or_failed.js',

    '../cons/scv_cons_search_itf_cccl.js',
    '../cons/scv_cons_search_cccl_remove.js'
    ],
    /**
     * @param{record} record
     * @param{search} search
     */
    function(record, search,serverWidget,runtime, url, 
        redirect, cache, message, format,
        lbf, libRpt, alasql,
        constRecord,
        constFormat,

        constLocation,
        constCustomer,
        constRole,
        constInspectionPlanDetail,
        constPassOrFailed,

        constSearchItf2CCCL,
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
            let request = context.request;
            let params = request.parameters;
            let curScript = runtime.getCurrentScript();

            let myCache = cache.getCache({
                name: curScript.id,
                scope: cache.Scope.PUBLIC
            });

            if(context.request.method == "GET"){
                let mainForm = onCreateFormUI(params);

                showMsgOnForm(mainForm.form, myCache);

                if(params.isSearch == "T"){
                    let arrResult = getDataSourceResult(params);

                    onRenderData(mainForm.custpage_sl_item, arrResult, params);
                }
                
                context.response.writePage(mainForm.form);
            }
            else{
                createChungChiChatLuong(request, myCache);

                redirect.toSuitelet({
					scriptId: curScript.id,
					deploymentId: curScript.deploymentId,
					parameters: {
                        custpage_subsidiary: params.custpage_subsidiary,
                        custpage_location: params.custpage_location?.replaceAll('\u0005', ','),
                        custpage_item: params.custpage_item?.replaceAll('\u0005', ','),
                        custpage_itf: params.custpage_itf,
                        custpage_so: params.custpage_so,
                        custpage_customer: params.custpage_customer,
                        custpage_fromdt: params.custpage_fromdt,
                        custpage_todt: params.custpage_todt,
                        custpage_def_reqdt: params.custpage_def_reqdt,
                        isSearch: "T"
                    }
				});
            }
        }

        const onCreateFormUI = (_params) => {
            let mainForm = serverWidget.createForm({title: "Tạo chứng chỉ chất lượng"});
            mainForm.clientScriptModulePath = '../cs/scv_cs_sl_itf2cccl.js';

            let curUser = runtime.getCurrentUser();

            libRpt.addPageLinkForm(mainForm, [constSearchItf2CCCL.ID, constSearchCCCLRemove.ID]);
            lbf.pinHeaderSublist(mainForm);

            let mainGrp = lbf.addFieldGroup(mainForm, "fieldgrp_main","Bộ lọc");
            let defaultGrp = lbf.addFieldGroup(mainForm, "fieldgrp_default","Thông tin mặc định");

            mainForm.addSubmitButton("Tạo CCCL");
            mainForm.addButton({id: "custpage_btn_search", label: "Search", functionName: "onSearchResult()"});

            let custpage_subsidiary = mainForm.addField({
                id: "custpage_subsidiary",
                type: "select",
                source: "subsidiary",
                label: 'Công ty',
                container: mainGrp.id
            }).setHelpText("Công ty");
            custpage_subsidiary.isMandatory = true;

            let custpage_customer = mainForm.addField({
                id: 'custpage_customer',
                type: "select",
                label: 'Khách hàng',
                container: mainGrp.id
            }).setHelpText("Khách hàng");
            custpage_customer.isMandatory = true;

            let custpage_fromdt = mainForm.addField({
                id: 'custpage_fromdt',
                type: "date",
                label: 'Từ ngày',
                container: mainGrp.id
            }).updateLayoutType({
                layoutType: "startrow"
            }).setHelpText("Từ ngày");
            custpage_fromdt.isMandatory = true;
            
            let custpage_todt = mainForm.addField({
                id: 'custpage_todt',
                type: "date",
                label: 'Đến ngày',
                container: mainGrp.id
            }).updateLayoutType({
                layoutType: "endrow"
            }).setHelpText("Đến ngày");
            custpage_todt.isMandatory = true;

            let custpage_location = mainForm.addField({
                id: "custpage_location",
                type: "multiselect",
                label: 'Kho',
                container: mainGrp.id
            }).setHelpText("Kho");

            let custpage_item = mainForm.addField({
                id: "custpage_item",
                type: "multiselect",
                source: "item",
                label: 'Mặt hàng',
                container: mainGrp.id
            }).setHelpText("Mặt hàng");

            let custpage_itf = mainForm.addField({
                id: 'custpage_itf',
                type: "text",
                label: 'Số phiếu xuất',
                container: mainGrp.id
            }).setHelpText("Số phiếu xuất");

            let custpage_so = mainForm.addField({
                id: 'custpage_so',
                type: "text",
                label: 'Số đơn hàng',
                container: mainGrp.id
            }).setHelpText("Số đơn hàng");

            let custpage_def_reqdt = mainForm.addField({
                id: 'custpage_def_reqdt',
                type: "date",
                label: 'Ngày yêu cầu',
                container: defaultGrp.id
            }).updateLayoutType({
                layoutType: 'startrow'
            }).setHelpText("Ngày yêu cầu");
            custpage_def_reqdt.isMandatory = true;
            
            if(curUser.role != constRole.RECORDS.ADMINISTRATOR.ID){
                _params.custpage_subsidiary = curUser.subsidiary;
                custpage_subsidiary.updateDisplayType({displayType: "inline"});
            }
            else if(!_params.custpage_subsidiary){
                _params.custpage_subsidiary = curUser.subsidiary;
            }

            loadFieldDataLocation(custpage_location, _params.custpage_subsidiary);
            loadFieldDataCustomer(custpage_customer, _params.custpage_subsidiary);
            
            if(_params.isSearch != "T"){
                let today = new Date();

                if(!_params.custpage_fromdt){
                    _params.custpage_fromdt = constFormat.getBeginOfMonth(today);
                }
                if(!_params.custpage_todt){
                    _params.custpage_todt = constFormat.getEndOfMonth(today);
                }
            }

            if(!!_params.custpage_subsidiary) custpage_subsidiary.defaultValue = _params.custpage_subsidiary;
            if(!!_params.custpage_location) custpage_location.defaultValue = _params.custpage_location.split(",");
            if(!!_params.custpage_item) custpage_item.defaultValue = _params.custpage_item.split(",");
            if(!!_params.custpage_fromdt) custpage_fromdt.defaultValue = _params.custpage_fromdt;
            if(!!_params.custpage_todt) custpage_todt.defaultValue = _params.custpage_todt;
            if(!!_params.custpage_itf) custpage_itf.defaultValue = _params.custpage_itf;
            if(!!_params.custpage_so) custpage_so.defaultValue = _params.custpage_so;
            if(!!_params.custpage_customer) custpage_customer.defaultValue = _params.custpage_customer;

            if(!!_params.custpage_def_reqdt){
                custpage_def_reqdt.defaultValue = _params.custpage_def_reqdt;
            }
            else{
                custpage_def_reqdt.defaultValue = new Date();
            }

            let itemSublist = mainForm.addSublist({
                id : "custpage_sl_item",
                type : "LIST",
                label : 'Kết quả'
            });
            itemSublist.addMarkAllButtons();
            onCreateSublistColumn(itemSublist);

            return {
                form: mainForm, 
                custpage_sl_item: itemSublist
            };
        }

        const getColumnOfSublist = () =>{
            let arrColumn = [
                {id: "custpage_col_chk", label: "Chọn", type: "checkbox", displayType: "entry"},
                {id: "custpage_col_item", label: "Mặt hàng", type: "select", source: "item", isMandatory: true},
                {id: "custpage_col_itf", label: "Số phiếu xuất", type: "select", source: "itemfulfillment", displayType: "disabled"},
                {id: "custpage_col_so", label: "Số đơn hàng", type: "select", source: "salesorder", displayType: "disabled"},
                {id: "custpage_col_customer", label: "Khách hàng", type: "text"},
                {id: "custpage_col_delidt", label: "Ngày giao hàng", type: "text"},
                {id: "custpage_col_itemcode", label: "Mã sản phẩm", type: "text"},
                {id: "custpage_col_unit", label: "Đơn vị tính", type: "select", source: "-221"},
                {id: "custpage_col_quantity", label: "Số lượng", type: "float"},
                {id: "custpage_col_lotno", label: "Số lô", type: "select", source: "inventorynumber"},
                {id: "custpage_col_insplan", label: "Bộ tiêu chí (*)", type: "select", source: "customrecord_scv_inspection_plans", displayType: "entry"},
                {id: "custpage_col_subsidiary", label: "Subsidiary ID", type: "text", displayType: "hidden"},
                {id: "custpage_col_itemclass", label: "Item Class ID", type: "text", displayType: "hidden"},
                {id: "custpage_col_certtmpl", label: "Certificate Template", type: "text", displayType: "hidden"},
                {id: "custpage_col_orilineid", label: "Ori Line ID", type: "text", displayType: "hidden"},
                {id: "custpage_col_customerid", label: "Customer ID", type: "text", displayType: "hidden"},
            ];
            
            return arrColumn;
        }

        const onCreateSublistColumn = (_sublist) => {
            let arrColumn = getColumnOfSublist()

            for(let i = 0; i< arrColumn.length; i++){
                let objCol = arrColumn[i];
                _sublist.addField({
                    id : objCol.id,
                    type : objCol.type,
                    source: objCol.source||null,
                    label : objCol.label
                }).updateDisplayType({displayType: objCol.displayType||"inline"});
            }
        }

        const onRenderData = (_itemSublist, _arrResult, _params) => {
            let arrColumns = getColumnOfSublist();
            
            for (let i = 0; i < _arrResult.length; i++) {
                let objResItem = _arrResult[i];

                arrColumns.forEach(_field =>{
                    let fieldId = _field.id;
                    let value_field = objResItem[fieldId]

                    if(lbf.isContainValue(value_field)){
                        _itemSublist.setSublistValue({id: fieldId, line: i, value: value_field});
                    }
                });
            }

        }

        const getDataSourceResult = (_params) =>{
            let arrItemITF = getDataSS01_Itf2CCCL(_params);
            let arrItfId = alasql(`SELECT DISTINCT itf_id FROM ? `, [arrItemITF.filter(e => !!e.itf_id)]);
            arrItfId = arrItfId.map(e => e.itf_id)
            let arrCCCLRemove = getDataSS02_CCCLRemove(_params, arrItfId);
            let arrResult = [];

            for(let i = 0; i < arrItemITF.length; i++){
                let objItemItf = arrItemITF[i];

                let objRes = {
                    custpage_col_chk: "T",
                    custpage_col_item: objItemItf.item,
                    custpage_col_itf: objItemItf.itf_id,
                    custpage_col_so: objItemItf.createdfrom,
                    custpage_col_customer: objItemItf.entityid,
                    custpage_col_delidt: objItemItf.trandate,
                    custpage_col_itemcode: objItemItf.item_upccode,
                    custpage_col_unit: objItemItf.unitid,
                    custpage_col_quantity: objItemItf.quantity * 1,
                    custpage_col_lotno: objItemItf.inventorynumber,
                    custpage_col_insplan: objItemItf.item_insplan,
                    custpage_col_subsidiary: _params.custpage_subsidiary,
                    custpage_col_itemclass: objItemItf.item_class,
                    custpage_col_certtmpl: objItemItf.certificate_temp,
                    custpage_col_orilineid: objItemItf.custcol_scv_ori_lineid,
                    custpage_col_customerid: objItemItf.customer_id,
                };

                let objCCCLRemove = arrCCCLRemove.find(e => e.custrecord_scv_yccc_line_itf == objRes.custpage_col_itf
                    && e.custrecord_scv_yccc_item == objRes.custpage_col_item
                    && e.custrecord_scv_yccc_ori_id == objRes.custpage_col_orilineid
                    && e.custrecord_scv_yccc_lot_number == objRes.custpage_col_lotno
                );
                if(!!objCCCLRemove){
                    continue;
                }

                arrResult.push(objRes);
            }
            
            return arrResult;
        }

        const createChungChiChatLuong = (_request, _myCache) =>{
            let params = _request.parameters;

            let arrCreatedID = [], arrMsgErr = [];

            let arrLineSelect = getDataSublistDetail(_request);
            if(arrLineSelect.length == 0) return [];

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
                        "custrecord_scv_yccc_distributor"
                    ], [
                        objFirstLine.custpage_col_customer, req_date,
                        objFirstLine.custpage_col_subsidiary, objFirstLine.custpage_col_certtmpl,
                        objFirstLine.custpage_col_customerid
                    ]);
    
                    let detailSublistId = "recmachcustrecord_scv_yccc_line_so_phieu";
                    let resultSublistId = "recmachcustrecord_scv_cccl_result_no";
    
                    for(let i = 0; i < arrLineSelectOfGrp.length; i++){
                        let objLine = arrLineSelectOfGrp[i];
    
                        if(!!objLine.custpage_col_delidt){
                            objLine.custpage_col_delidt = format.parse({type: "date", value: objLine.custpage_col_delidt});
                        }
    
                        //#region Sublist Custom/ Yêu cầu chi tiết
                        ccclRec.selectNewLine(detailSublistId);
                        
                        lbf.setCurrentSublistValueData(ccclRec, detailSublistId, [
                            "custrecord_scv_yccc_line_stt", "custrecord_scv_yccc_item",
                            "custrecord_scv_yccc_line_itf", "custrecord_scv_yccc_so_doc",
                            "custrecord_scv_yccc_itf_date", "custrecord_scv_yccc_category",
                            "custrecord_scv_yccc_item_name", "custrecord_scv_yccc_units",
                            "custrecord_scv_yccc_qty", "custrecord_scv_yccc_lot_number",
                            "custrecord_scv_cccl_detail_inspect_plan", "custrecord_scv_yccc_ori_id"
                        ], [
                            i + 1, objLine.custpage_col_item,
                            objLine.custpage_col_itf, objLine.custpage_col_so,
                            objLine.custpage_col_delidt, objLine.custpage_col_itemclass,
                            objLine.custpage_col_itemcode, objLine.custpage_col_unit,
                            objLine.custpage_col_quantity, objLine.custpage_col_lotno,
                            objLine.custpage_col_insplan, objLine.custpage_col_orilineid
                        ]);
    
                        ccclRec.commitLine(detailSublistId);
                        //#endregion
    
                        //#region Sublist Custom/ CCCL- Kết quả
                        let arrInspectionPlanDetail_filter = arrInspectionPlanDetail.filter(e => e.custrecord_scv_if_inspec_plan == objLine.custpage_col_insplan);
                        
                        for(let j = 0; j < arrInspectionPlanDetail_filter.length; j++){
                            let objInsPlanDetail = arrInspectionPlanDetail_filter[j];

                            let kq_text = "", kq_number = "";

                            let value_min = objInsPlanDetail.custrecord_scv_if_lower_ctrl_limit;
                            let value_max = objInsPlanDetail.custrecord_scv_if_upper_ctrl_limit;

                            if(lbf.isContainValue(value_min) && lbf.isContainValue(value_max)){
                                kq_number = constFormat.randomNumberBetween(value_min, value_max);
                            }
                            else if(!lbf.isContainValue(value_min) && !lbf.isContainValue(value_max)){
                                kq_text = objInsPlanDetail.custrecord_scv_if_target_value;
                            }
    
                            ccclRec.selectNewLine(resultSublistId);
                            lbf.setCurrentSublistValueData(ccclRec, resultSublistId, [
                                "custrecord_scv_cccl_result_item",
                                "custrecord_scv_cccl_result_itf", "custrecord_scv_cccl_result_so",
                                "custrecord_scv_cccl_result_shipped_date", "custrecord_scv_cccl_result_category",
                                "custrecord_scv_cccl_result_unit",
                                "custrecord_scv_cccl_result_qty", "custrecord_scv_cccl_result_lot",
                                "custrecord_scv_cccl_result_inspect_plan", "custrecord_scv_cccl_tieu_chi",
                                "custrecord_scv_cccl_result_kq_text", "custrecord_scv_cccl_result_kq_number",
                                "custrecord_scv_cccl_result_pass_fail"
                            ], [
                                objLine.custpage_col_item,
                                objLine.custpage_col_itf, objLine.custpage_col_so,
                                objLine.custpage_col_delidt, objLine.custpage_col_itemclass,
                                objLine.custpage_col_unit,
                                objLine.custpage_col_quantity, objLine.custpage_col_lotno,
                                objLine.custpage_col_insplan, objInsPlanDetail.internalid,
                                kq_text, kq_number,
                                constPassOrFailed.RECORDS.DAT.ID
                            ]);
                            ccclRec.commitLine(resultSublistId);
                        }
                        //#endregion
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

                arrLines.push(objLine);
            }
    
            return arrLines;
        }

        const showMsgOnForm = (_form, _myCache)=>{
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
                _form.addPageInitMessage({type: message.Type.CONFIRMATION, message: "Quản lý cấp CCCL đã tạo: " + arrMsgCreated.join(", "), duration: -1});
            }
            if(arrMsgErr.length > 0){
                _form.addPageInitMessage({type: message.Type.ERROR, message: arrMsgErr.join("<br/>"), duration: -1});
            }

            _myCache.remove({key: "objResCache"});
        }

        const loadFieldDataLocation = (_field, _subsidiaryId) => {
            if(!_subsidiaryId) return;

            let arrResult = constLocation.getDataSource(
                search.createFilter({
                    name: 'subsidiary',
                    operator: "anyof",
                    values: _subsidiaryId
                })
            );

            constRecord.initLoadFieldServer(_field, {
                displayExpr: "name", valueExpr: "internalid", data: arrResult
            }, false)
        }

        const loadFieldDataCustomer = (_field, _subsidiaryId) => {
            if(!_subsidiaryId) return;

            let arrResult = constCustomer.getDataSourceSubsidiaryRelationship(
                search.createFilter({
                    name: 'subsidiary',
                    operator: "anyof",
                    values: _subsidiaryId
                })
            );

            constRecord.initLoadFieldServer(_field, {
                displayExpr: "entityid", valueExpr: "internalid", data: arrResult
            }, true)
        }

        const getDataSS01_Itf2CCCL = (_params) => {
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

            if(!!_params.custpage_itf){
                myFilters.push(search.createFilter({
                    name: 'numbertext', 
                    operator: "contains", 
                    values: _params.custpage_itf
                }))
            }

            if(!!_params.custpage_so){
                myFilters.push(search.createFilter({
                    name: 'formulatext', 
                    formula: "{createdfrom}",
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
            
            let arrResult = constSearchItf2CCCL.getDataSource(myFilters);

            return arrResult;
        }

        const getDataSS02_CCCLRemove = (_params, _arrItfId) => {
            let myFilters = [];

            if(_arrItfId.length > 0){
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_yccc_line_itf', 
                    operator: "anyof", 
                    values: _arrItfId
                }))
            }
            else{
                return [];
            }

            /* if(!!_params.custpage_subsidiary){
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_yccc_sub', 
                    join: "CUSTRECORD_SCV_YCCC_LINE_SO_PHIEU",
                    operator: "anyof", 
                    values: _params.custpage_subsidiary
                }))
            }

            if(!!_params.custpage_location){
                myFilters.push(search.createFilter({
                    name: 'location', 
                    join: "custrecord_scv_yccc_line_itf",
                    operator: "anyof", 
                    values: _params.custpage_location.split(",")
                }))
            }

            if(!!_params.custpage_item){
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_yccc_item', 
                    operator: "anyof", 
                    values: _params.custpage_item.split(",")
                }))
            }

            if(!!_params.custpage_customer){
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_yccc_customer', 
                    join: "CUSTRECORD_SCV_YCCC_LINE_SO_PHIEU",
                    operator: "anyof", 
                    values: _params.custpage_customer
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

            if(!!_params.custpage_itf){
                myFilters.push(search.createFilter({
                    name: 'formulatext', 
                    formula: "{custrecord_scv_yccc_line_itf}",
                    operator: "contains", 
                    values: _params.custpage_itf
                }))
            }

            if(!!_params.custpage_so){
                myFilters.push(search.createFilter({
                    name: 'formulatext', 
                    formula: "{custrecord_scv_yccc_so_doc}",
                    operator: "contains", 
                    values: _params.custpage_so
                }))
            } */
            
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
            onRequest: onRequest
        };

    });
