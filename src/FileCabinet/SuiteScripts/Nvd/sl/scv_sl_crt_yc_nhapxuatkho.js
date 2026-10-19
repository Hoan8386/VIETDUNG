/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define([
    'N/search', 'N/record', 'N/ui/serverWidget', 'N/runtime', 'N/query', 'N/format',
    '../lib/scv_lib_function.js',
    '../cons/scv_cons_search_mfg_by_product_list.js',
    '../cons/scv_cons_customer.js',
    '../cons/scv_cons_approvalstatus.js',
    '../cons/scv_cons_search_mfg_lot.js',
    '../cons/scv_cons_ordertype.js',
    '../cons/scv_cons_list_loc_type.js',
    '../cons/scv_cons_subsidiary.js',
],
    (
        search, record, serverWidget, runtime, query,format,
        lbf, 
        searchProductList, 
        constCustomer, constApprStatus,
        constMfgLot, constOrderType,
        constListLocType,
        constSubsidiary
    ) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */

        const GroupBy = {
            GroupWoCenter: {
                ID: "1",
                NAME: "Theo ca, máy, ngày"
            },
            GroupNotWoCenter: {
                ID: "2",
                NAME: "Theo ca, ngày"
            },
        };

        const onRequest = (scriptContext) => {
            let request = scriptContext.request;
            let response = scriptContext.response;
            let params = request.parameters;

            if(request.method == "GET"){
                onRequestMethodGET(response, params);
            } else {
                onRequestMethodPOST(request, response, params);
            }
        }

        const onRequestMethodPOST = (request, response, params) => {
            let reqBody = JSON.parse(request.body);
            let objResponse = createYC_NhapXuatKho(reqBody);

            response.setHeader({
                name: 'Content-Type',
                value: 'application/json'
            });
            response.write(JSON.stringify(objResponse));
        }

        const createYC_NhapXuatKho = (reqBody) => {
            try {
                let arrSublist = reqBody.details || [];
                let arrGrpProduct = lbf.onGroupByArray(arrSublist, ['product_id']);
                // create record
                let ycNXKRec = record.create({
                    type: "customsale_scv_ot_yc_xvt",
                    isDynamic: true
                });
                // set header
                let defaultMemo = "Nhập phụ phẩm phế phẩm";
                lbf.setValueData(ycNXKRec, [
                    'custbody_scv_order_type', 'entity', 'custbody_scv_approval_status', 
                    'memo', 'subsidiary', 'location', 'custbody_scv_wo_center', 
                    'custbody_scv_shift'
                ], [
                    reqBody.order_type_id, constCustomer.RECORDS.ENTITY_DEFAULT.ID, constApprStatus.RECORDS.OPEN.ID,
                    defaultMemo, reqBody.subsidiary_id, reqBody.location_id, reqBody.work_center_id, reqBody.shift_id
                ]);

                let product_date = reqBody.product_date;
                if(!!product_date) {
                    product_date = format.parse({ value: product_date, type: "date" });
                    ycNXKRec.setValue("trandate", product_date);
                    ycNXKRec.setValue("custbody_scv_mfg_date", product_date);
                }

                // set line
                let newSublistFields = [
                    "item", "custcol_scv_plan_qty", "quantity", "amount",
                    "custcol_scv_link_by_product_id"
                ];

                for(let i = 0; i < arrGrpProduct.length; i++) {
                    let arrFilterProduct = arrSublist.filter(e => e.product_id == arrGrpProduct[i].product_id);
                    let plan_qty = arrFilterProduct.reduce((a, b) => a + b.quantity, 0);
                    let arrByProduct = arrFilterProduct.map(e => e.internalid);

                    ycNXKRec.selectNewLine("item");
                    lbf.setCurrentSublistValueData(ycNXKRec, "item", newSublistFields, [
                        arrGrpProduct[i].product_id, plan_qty, 0, 0, arrByProduct.join("; ")
                    ]);
                    ycNXKRec.commitLine("item");
                }

                let internalid = ycNXKRec.save();
                updateByProduct(arrSublist, internalid);

                return {
                    isSuccess: true,
                    internalid: internalid,
                    tranid: getTranIdRecord(internalid),
                    msg: "SUCCESS."
                }
            } catch (err) {
                log.error("res", err.message);
                let arrSublist = reqBody.details || [];
                let listProduct = arrSublist.map(e => e.internalid);
                return {
                    isSuccess: false,
                    msg: err.message,
                    listProduct: listProduct
                };
            }
        }

        const getTranIdRecord = (ycnxkId) => {
            let objRecord = search.lookupFields({
                type: "customsale_scv_ot_yc_xvt",
                id: ycnxkId,
                columns: ["tranid"]
            });
            return objRecord.tranid || "";
        }

        const updateByProduct = (arrSublist, ycnxkId) => {
            let arrProductList = arrSublist.map(e => e.internalid);
            
            arrProductList.forEach(productId => {
                record.submitFields.promise({
                    type: "customrecord_scv_by_product", id: productId,
                    values: {
                        custrecord_scv_by_product_related_trans: ycnxkId
                    },
                });
            });
        }

        const onRequestMethodGET = (response, params) => {
            let MainForm = onCreateFormUI(params);
            if(params.isrun == "T"){
                let searchResult = runFilterSS(params);
                onRenderData(MainForm.sublist, searchResult);
            }
            response.writePage(MainForm.form);
        }

        const onRenderData = (sublist, data) => {
            for (let i = 0; i < data.length; i++) {
                let obj = data[i];
                setRowDataSublist(sublist, i, [
                    "custpage_col_1", "custpage_col_2", "custpage_col_3", "custpage_col_4", 
                    "custpage_col_5", "custpage_col_6", "custpage_col_7", "custpage_col_8", 
                    "custpage_col_9", "custpage_col_10", "custpage_col_json_data",
                ], [
                    null, obj.product_nm, obj.quantity, obj.rate, obj.work_order_nm, 
                    obj.work_order_comp_nm, obj.subsidiary_nm, obj.work_center_nm, obj.lot_number,
                    obj.shift_nm, JSON.stringify(obj)
                ]);
            }
        }

        const runFilterSS = (params) => {
            let myFilters = [];

            if(!!params.listProduct) {
                myFilters.push(search.createFilter({
                    name: "internalid", 
                    operator: "anyof", 
                    values: params.listProduct.split(",")
                }));
            }
            
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

            if(!!params.custpage_locationf) {
                myFilters.push(search.createFilter({
                    name: "formulatext", 
                    formula: "nvl({custrecord_scv_by_product_wo.location.id},{custrecord_scv_by_product_wo_completion.location.id})",
                    operator: "is", 
                    values: params.custpage_locationf
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

            let arrProductList = searchProductList.getDataSource(myFilters);
            return arrProductList;
        }

        const onCreateFormUI = (params) => {
            let mainForm = serverWidget.createForm({title: "Tạo chứng từ đề nghị nhập xuất kho"});
            mainForm.clientScriptModulePath = '../cs/scv_cs_sl_crt_yc_nhapxuatkho.js';
            let filterGrp = addFieldGroup(mainForm, "fieldgrp_main", "Điều kiện lọc");
            let defaultGrp = addFieldGroup(mainForm, "default_main", "Giá trị mặc định");
            // add button
            mainForm.addSubmitButton({label : 'Submit'});
            mainForm.addButton({
                id: "custpage_btn_search",
                label: "Search",
                functionName: "onSearchResult()"
            });
            lbf.pinHeaderSublist(mainForm);
            // add field
            let custpage_subsidiary = mainForm.addField({
                id: "custpage_subsidiary",
                type: serverWidget.FieldType.SELECT,
                label: "Công ty/Chi nhánh",
                container: filterGrp.id
            });
            let custpage_locationf = mainForm.addField({
                id: "custpage_locationf",
                type: serverWidget.FieldType.SELECT,
                label: "Kho",
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
            
            let custpage_work_center = mainForm.addField({
                id: "custpage_work_center",
                type: serverWidget.FieldType.SELECT,
                label: "Máy",
                container: filterGrp.id
            });
            let custpage_lot_no = mainForm.addField({
                id: "custpage_lot_no",
                type: serverWidget.FieldType.MULTISELECT,
                label: "Số lô",
                container: filterGrp.id
            });

            let custpage_groupby = mainForm.addField({
                id: "custpage_groupby",
                type: serverWidget.FieldType.SELECT,
                label: "Group By",
                container: defaultGrp.id
            });
            let custpage_location = mainForm.addField({
                id: "custpage_location",
                type: serverWidget.FieldType.SELECT,
                label: "Kho",
                source: "location",
                container: defaultGrp.id
            });
            let custpage_order_type = mainForm.addField({
                id: "custpage_order_type",
                type: serverWidget.FieldType.SELECT,
                label: "Loại yêu cầu",
                source: "customrecord_scv_order_type",
                container: defaultGrp.id
            });
            let custpage_account = mainForm.addField({
                id: "custpage_account",
                type: serverWidget.FieldType.SELECT,
                label: "Tài khoản",
                source: "account",
                container: defaultGrp.id
            });

            constSubsidiary.initLoadFieldSubsidiaryByUserRole(custpage_subsidiary);
            
            onLoadLotNumber(custpage_lot_no);
            onLoadGroupBy(custpage_groupby);
            onLoadEntityGroup(custpage_work_center, custpage_subsidiary, params.custpage_subsidiary);
            onLoadLocation(custpage_locationf, custpage_subsidiary, params.custpage_subsidiary);
            custpage_fromdt.updateLayoutType({layoutType: 'STARTROW'});
            custpage_todt.updateLayoutType({layoutType: 'ENDROW'});

            let fields = [
                custpage_subsidiary, custpage_locationf, custpage_fromdt, custpage_todt, custpage_shift, custpage_work_center,
                custpage_lot_no, custpage_location, custpage_order_type, custpage_account
            ];
            applyCustomFieldSettings(fields, params, true);
            custpage_fromdt.defaultValue = getFromDate(params.custpage_fromdt);
            custpage_todt.defaultValue = getToDate(params.custpage_todt);
            custpage_order_type.defaultValue = constOrderType.RECORDS.NHAP_PHE_PHU_PHAM_THU_HOI.ID;

            // add sublist
            let rsSL = mainForm.addSublist({
                id: "custpage_sl_result",
                type: serverWidget.SublistType.LIST,
                label: 'Kết quả'
            });
            
            rsSL.addMarkAllButtons();
            onCreateSublistColumn(rsSL, params);

            return { form: mainForm, sublist: rsSL }
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

        function onCreateSublistColumn(sublist){
            let arrColumn = [
                { label: "Chọn", type: "checkbox", displayType: "entry" },
                { label: "Kho", type: "select", source: "location", displayType: "entry" },
                { label: "Phụ/Phế phẩm", type: "text" },
                { label: "Lượng", type: "float" },
                { label: "Đơn giá", type: "float" },
                { label: "Lệnh SX", type: "text" },
                { label: "Phiếu hoàn thành", type: "text" },
                { label: "Công ty/Chi nhánh", type: "text" },
                { label: "Máy", type: "text" },
                { label: "Lô sản xuất", type: "text" },
                { label: "Ca làm việc", type: "text" },
                { id: "custpage_col_json_data", label: "JSON Data", type: "textarea", displayType: "hidden" },
            ];
            let index = 0;
            for(let i = 0; i< arrColumn.length; i++){
                let field = sublist.addField({
                    id: arrColumn[i].id || ("custpage_col_"+ index),
                    type: arrColumn[i].type,
                    label: arrColumn[i].label,
                    source: arrColumn[i].source || null,
                });

                if(arrColumn[i].source === 'location') {
                    field.updateDisplaySize({
                        width: 200,
                        height: 'auto'
                    });
                }
                
                field.updateDisplayType({ displayType: arrColumn[i].displayType || "inline"});
                if(!arrColumn[i].id) {
                    index++;
                }
            }
        }

        function onLoadLocation(_locationField, _objSubsidiary, _subsidiaryId) {
            let subId = _subsidiaryId || _objSubsidiary.defaultValue;
            if(!subId) return;

            _locationField.addSelectOption({value : "", text : ""});
            let resultSQL = query.runSuiteQL({
                query: `
                    SELECT id, fullname, subsidiary FROM location
                    WHERE custrecord_scv_loc_type = ${constListLocType.RECORDS.KHO_SAN_XUAT.ID} AND isinactive = 'F'`
            });

            let resultQuery = resultSQL.asMappedResults();
            resultQuery = resultQuery.filter(e => e.subsidiary == subId);

            for(let i in resultQuery) {
                _locationField.addSelectOption({value: resultQuery[i].id, text: resultQuery[i].fullname});
            }
        }

        function onLoadEntityGroup(_workCenterField, _objSubsidiary, _subsidiaryId) {
            let subId = _subsidiaryId || _objSubsidiary.defaultValue;
            if(!subId) return;

            _workCenterField.addSelectOption({value : "", text : ""});
            let resultSQL = query.runSuiteQL({
                query: `SELECT id, groupname FROM entitygroup
                    WHERE isinactive = 'F'
                    AND custentity_scv_sub = ${subId}`
            });
            let resultQuery = resultSQL.asMappedResults();

            for(let i in resultQuery) {
                _workCenterField.addSelectOption({value: resultQuery[i].id, text: resultQuery[i].groupname});
            }
        }

        function onLoadGroupBy(_groupByField) {
            for(let property in GroupBy) {
                _groupByField.addSelectOption({ value: GroupBy[property].ID, text: GroupBy[property].NAME });
            }   
        }

        function onLoadLotNumber(_lotNoField) {
            let arrMfgLot = constMfgLot.getDataSource();
            // _lotNoField.addSelectOption({value : "", text : ""});
            for(let objMfg of arrMfgLot) {
                _lotNoField.addSelectOption({ value: objMfg.lot_number, text: objMfg.lot_number });
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

        function addFieldGroup(_form, _id, _label){
            let _obj = {id: _id, label: _label}
            _form.addFieldGroup(_obj);
            return _obj;
        }

        return {onRequest}

    });
