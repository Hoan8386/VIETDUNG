/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define([
    'N/search', 'N/record', 'N/ui/serverWidget', 'N/runtime', 'N/redirect', 'N/query', 'N/format',
    '../lib/scv_lib_function.js', 
     '../cons/scv_cons_list_type_denghitt.js',
    '../cons/scv_cons_subsidiary.js',
    '../cons/scv_cons_search_quantity_po.js',
    '../cons/scv_cons_search_itr_bc.js', 
    '../cons/scv_cons_search_payr_detail_code.js'
],
    (
        search, record, serverWidget, runtime, redirect, query, format,
        lbf, constListDenghiTT, constSubsidiary,
        constSearchQtyPO, constSearchItrBC,
        constSearchPayrDetail
    ) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */

        const TypeDeNghiTT = {
            ThanhToanCongNo: {
                ID: 2,
                NAME: "Thanh toán công nợ",
            },
            QuyetToanNVDiMuaHang: {
                ID: 11,
                NAME: "Quyết toán NV đi mua hàng"
            }
        };

        const onRequest = (scriptContext) => {
            let request = scriptContext.request;
            let response = scriptContext.response;
            let params = request.parameters;
            if(request.method == "GET"){
                let MainForm = onCreateFormUI(params);
                if(params.isrun == "T"){
                    let searchResult = runFilterSS(params);
                    // log.error("searchResult", searchResult);
                    onRenderData(MainForm.sublist, searchResult);
                }
                response.writePage(MainForm.form);
            } else {
                createPaymentRequest(request, params);
            }
        }

        const createPaymentRequest = (request, params) => {
            let userId = runtime.getCurrentUser().id;
            let ngycauId = getPaymentNgYeuCau(userId);

            let departmentId = getDepartmentFromCurUser(userId);
            let arrSublist = getDataSublistResult(request);
            let arrIRID = groupDataByFieldId(arrSublist, "item_receipt_id");

            let purReqRec = record.create({ type: "customrecord_scv_payment", isDynamic: true});
            lbf.setValueData(purReqRec, [
                "custrecord_scv_payment_entity", "custrecord_scv_payment_subsidiary", "custrecord_scv_payment_type", "custrecord_scv_creator_pr", "custrecord_scv_payment_ngycau",
                "custrecord_scv_payment_department", "custrecord_scv_payment_memo", "custrecord_scv_payment_currency", "custrecord_scv_payment_exchangerate", 
                "custrecord_scv_payment_po", "custrecord_scv_createdfrom_pr", "custrecord_scv_payment_method", "custrecord_scv_payr_itr", "custrecord_scv_payment_payee"
            ], [
                params.custpage_def_entity, params.custpage_subsidiary, params.custpage_type_denghitt, userId, ngycauId, departmentId,
                arrSublist[0].memo, arrSublist[0].currency_id, arrSublist[0].exchange_rate, arrSublist[0].id, arrSublist[0].id, 
                params.custpage_payment_method, arrIRID, params.custpage_def_entity
            ]);

            let sublistId = "recmachcustrecord_scv_pay";
            let total_amount = 0, total_tax_amount = 0, total_gross_amt = 0;
            let sublistFields = [
                'custrecord_scv_payment_item', 'custrecord_scv_pay_detail_des', 'custrecord_scv_pay_detail_qty', 'custrecord_scv_pay_detail_rate',
                'custrecord_scv_pay_detail_unit', 'custrecord_scv_pay_detail_amt', 'custrecord_scv_pay_detail_taxcode', 'custrecord_scv_pay_detail_taxrate',
                'custrecord_scv_pay_detail_taxamt', 'custrecord_scv_pay_detail_gr_amt', 'custrecord_scv_payment_purchase_order', 'custrecord_scv_pay_so_key_code',
                'custrecord_scv_pay_detail_ori_lineid', 'custrecord_scv_pay_detail_ord_line', 'custrecord_scv_pay_detail_sl_dat', 'custrecord_scv_pay_detail_specification',
                'custrecord_scv_pay_detail_dvtmua', 'custrecord_scv_pay_detail_sl_dvtmua', 'custrecord_scv_pay_detail_dg_dvtmua', 'custrecord_scv_pay_detail_tien_dvtmua',
                'custrecord_scv_pay_detail_date_receipt', 'custrecordscv_pay_detail_asset', 'custrecord_scv_pay_detail_maphi'
            ];
            for(let i = 0; i < arrSublist.length; i++) {
                purReqRec.selectNewLine(sublistId);
                let precistionCurrency = getPrecistion(arrSublist[i].currency_nm);
                let amount = arrSublist[i].qty_dntt * arrSublist[i].rate;
                amount = Number(amount.toFixed(precistionCurrency));
                let tax_amount = amount * parseFloat(arrSublist[i].tax_rate) / 100;
                tax_amount = Number(tax_amount.toFixed(precistionCurrency));
                let gross_amount = amount + tax_amount;
                gross_amount = Number(gross_amount.toFixed(precistionCurrency));
                
                let qty_qc_passed = arrSublist[i].qty_passed - arrSublist[i].qty_billded;

                let ngay_nhap_kho = null;
                if(!!arrSublist[i].ngay_nhap_kho) {
                    ngay_nhap_kho = format.parse({ value: arrSublist[i].ngay_nhap_kho, type: "date" });
                }

                lbf.setCurrentSublistValueData(purReqRec, sublistId, sublistFields, [
                    arrSublist[i].item_id, arrSublist[i].item_description, arrSublist[i].qty_dntt, arrSublist[i].rate, arrSublist[i].units_id,
                    amount, arrSublist[i].tax_item_id, parseFloat(arrSublist[i].tax_rate), tax_amount, gross_amount, arrSublist[i].id, 
                    arrSublist[i].created_trans_id, arrSublist[i].ori_line_id, arrSublist[i].line_id, qty_qc_passed, arrSublist[i].po_properties,
                    arrSublist[i].dvt_mua_id, arrSublist[i].dvt_qty, arrSublist[i].dvt_rate, arrSublist[i].dvt_amount, ngay_nhap_kho,
                    arrSublist[i].related_asset_id, arrSublist[i].kmcp_id
                ]);

                purReqRec.commitLine(sublistId);

                total_amount += amount;
                total_tax_amount += tax_amount;
                total_gross_amt += gross_amount;
            }

            lbf.setValueData(purReqRec, [
               "custrecord_scv_payment_amt", "custrecord_scv_payment_amounttax", "custrecord_scv_payment_amount"
            ], [
                total_gross_amt, total_tax_amount, total_gross_amt
            ]);

            let rectype = lbf.getTranRecordType(arrSublist[0].id);
            if(params.custpage_type_denghitt == constListDenghiTT.RECORDS.HOAN_UNG_NV_DI_MUA_HANG.ID && !!rectype) {
                let recordLKF = search.lookupFields({ 
                    type: rectype, id: arrSublist[0].id,
                    columns: ["custbody_scv_emp_remaining_amt"]
                });

                let remaining = total_gross_amt - parseFloat(recordLKF?.custbody_scv_emp_remaining_amt || 0);
                lbf.setValueData(purReqRec, ["custrecord_scv_payment_amount", "custrecord_scv_remaining"], [remaining, remaining]);
            }
            let purReqId = purReqRec.save({enableSourcing: false, ignoreMandatoryFields: true});

            redirect.toRecord({
                type: "customrecord_scv_payment",
                id: purReqId,
            });
        }
        
        const getPrecistion = (currencyName) => {
            return currencyName === 'VND' ? 0 : 2;
        }
        
        const getPaymentNgYeuCau = (userId) => {
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

        const getDataSublistResult = (request) => {
            let arrResult = [];
            let sublistId = "custpage_sl_result";
            let lc = request.getLineCount(sublistId);
            for(let i = 0; i < lc; i++) {
                let isSelected = request.getSublistValue(sublistId, "custpage_col_0", i);
                if(isSelected === true || isSelected === "T") {
                    let jsonData = request.getSublistValue(sublistId, "custpage_col_json_data", i);
                    
                    let objRes = JSON.parse(jsonData);
                    objRes.qty_dntt = request.getSublistValue(sublistId, "custpage_col_12", i) * 1;
                    arrResult.push(objRes);
                }
            }
            return arrResult;
        }

        const getDepartmentFromCurUser = (userId) => {
            let recType = lbf.getEntityType(userId);
            let resultSearch = query.runSuiteQL({
                query: `SELECT id, entityid, department FROM ${recType}
                    WHERE id = ${userId}`,
                pageSize: 1
            });
            resultSearch = resultSearch.asMappedResults();
            return resultSearch.length > 0 ? resultSearch[0].department : "";
        }

        const onRenderData = (sublist, data) => {
            for (let i = 0; i < data.length; i++) {
                let obj = data[i];
                setRowDataSublist(sublist, i, [
                    "custpage_col_1", "custpage_col_2", "custpage_col_3", "custpage_col_4", 
                    "custpage_col_5", "custpage_col_6", "custpage_col_7", "custpage_col_8", 
                    "custpage_col_9", "custpage_col_10", "custpage_col_11", "custpage_col_12",
                    "custpage_col_13", "custpage_col_14", "custpage_col_15", "custpage_col_16",
                    "custpage_col_17", "custpage_col_18", "custpage_col_19", "custpage_col_20",
                    "custpage_col_21", "custpage_col_22", "custpage_col_23", "custpage_col_24",
                    "custpage_col_25", "custpage_col_json_data",
                ], [
                    obj.tranid, obj.item_receipt_nm, obj.ngay_nhap_kho, obj.item_nm, obj.units_nm,
                    obj.quantity, obj.qty_shiprecv, obj.qty_billded, obj.qty_passed, obj.qty_not_passed, 
                    obj.sl_tra_hang, obj.qty_dntt, obj.rate, obj.tax_item_nm, obj.po_properties,
                    obj.currency_nm, obj.exchange_rate, obj.dvt_mua_nm, obj.dvt_qty, obj.dvt_rate, obj.dvt_amount,
                    obj.trang_thai_phe_duyet, obj.ori_line_id, obj.line_id, obj.inspect_started ? "Yes" : "No", 
                    JSON.stringify(obj)
                ]);
            }
        }

        const runFilterSS = (params) => {
            let arrResult = [];
            let arrQtyPO = getDataSSQuantityPO(params);

            let arrPoId = groupDataByFieldId(arrQtyPO, "id");
            let arrItemId = groupDataByFieldId(arrQtyPO, "item_id");

            let arrItem = getDataItem(arrItemId);
            let arrItrBC = getDataSSItrBC(arrPoId, params);
            let arrPayRDetail = getDataSSPaymentDetailCode(params);

            for(let i = 0; i < arrQtyPO.length; i++) {
                let objRes = { 
                    ...arrQtyPO[i],
                    qty_dntt: 0
                };
                // let obj_find_itr = arrItrBC.find(e => e.item_receipt_id == objRes.item_receipt_id && e.item_id == objRes.item_id && e.ori_line_id == objRes.ori_line_id);
                let obj_find_itr = arrItrBC.find(e => e.item_receipt_id == objRes.item_receipt_id && e.ori_line_id == objRes.ori_line_id);
                let obj_find_item = arrItem.find(e => e.id == objRes.item_id);

                let isRemove = shouldRemovePayRDetailRow(arrPayRDetail, objRes);
                if(!isRemove) {
                    objRes.qty_passed = obj_find_itr?.quantity || 0;
                    objRes.qty_not_passed = objRes.qty_shiprecv - objRes.qty_passed;

                    if(!!objRes.item_receipt_id) {
                        let objPayRDetail = arrPayRDetail.find(e => e.ori_line_id == objRes.ori_line_id && e.item_receipt_id == objRes.item_receipt_id);
                        if(objRes.inspect_started) {
                            objRes.qty_dntt = objRes.qty_passed - objRes.qty_billded - (objPayRDetail?.quantity || 0);
                        } else {
                            objRes.qty_dntt = objRes.qty_shiprecv - objRes.qty_billded - (objPayRDetail?.quantity || 0);
                        }
                    } else {
                        let objPayRDetail = arrPayRDetail.find(e => e.ori_line_id == objRes.ori_line_id && e.po_id == objRes.id);
                        objRes.qty_dntt = objRes.quantity - objRes.qty_billded - (objPayRDetail?.quantity || 0);
                    }

                    objRes.created_trans_id = obj_find_itr?.created_trans_id || "";
                    objRes.created_trans_nm = obj_find_itr?.created_trans_nm || "";
                    objRes.item_description = obj_find_item?.displayname || "";
                    objRes.itemtype = obj_find_item?.itemtype || "";

                    if(!(!!(objRes.qty_shiprecv) && (objRes.qty_shiprecv === objRes.sl_tra_hang))) {
                        arrResult.push(objRes);
                    }
                }
            }

            arrResult.sort((a, b) => Number(b.item_receipt_id) - Number(a.item_receipt_id));
            return arrResult;
        }

        const shouldRemovePayRDetailRow = (arrPayRDetail, objRes) => {
            let objPayRDetail = arrPayRDetail.find(e => {
                return (
                    (
                        e.ori_line_id == objRes.ori_line_id
                        && e.po_id == objRes.id
                        && !objRes.item_receipt_id 
                        && objRes.quantity <= e.quantity
                    ) || (
                        e.ori_line_id == objRes.ori_line_id
                        // && e.po_id == objRes.id
                        && !!objRes.item_receipt_id
                        && objRes.item_receipt_id == e.item_receipt_id
                        && objRes.qty_shiprecv <= e.quantity
                    )
                );
            });
            return !!objPayRDetail;
        }
        
        const getDataSSQuantityPO = (params) => {
            let myFilters = [];
            if(!!params.custpage_subsidiary) {
                myFilters.push(search.createFilter({
                    name: "subsidiary", 
                    operator: "anyof", 
                    values: params.custpage_subsidiary
                }));
            }
            if(!!params.custpage_entity) {
                myFilters.push(search.createFilter({
                    name: "entity", 
                    operator: "anyof", 
                    values: params.custpage_entity
                }));
            }
            if(!!params.custpage_location) {
                myFilters.push(search.createFilter({
                    name: "location", 
                    operator: "anyof", 
                    values: params.custpage_location
                }));
            }
            if(!!params.custpage_po) {
                myFilters.push(search.createFilter({
                    name: "internalid", 
                    operator: "anyof", 
                    values: params.custpage_po
                }));
            }
            if(!!params.custpage_item) {
                myFilters.push(search.createFilter({
                    name: "item", 
                    operator: "anyof", 
                    values: params.custpage_item
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
            if(!!params.custpage_currency) {
                myFilters.push(search.createFilter({
                    name: "currency", 
                    operator: "anyof", 
                    values: params.custpage_currency
                }));
            }
            if(!!params.custpage_ordertype) {
                myFilters.push(search.createFilter({
                    name: "custbody_scv_order_type", 
                    operator: "anyof", 
                    values: params.custpage_ordertype
                }));
            }
            if(!!params.custpage_from_ngaynk) {
                myFilters.push(search.createFilter({
                    name: 'formuladate',
                    formula: "case when {applyingtransaction.type} = 'Item Receipt' then {applyingtransaction.trandate} else null end",
                    operator: "onorafter",
                    values: params.custpage_from_ngaynk
                }));
            }
            if(!!params.custpage_to_ngaynk) {
                myFilters.push(search.createFilter({
                    name: 'formuladate',
                    formula: "case when {applyingtransaction.type} = 'Item Receipt' then {applyingtransaction.trandate} else null end",
                    operator: "onorbefore",
                    values: params.custpage_to_ngaynk
                }));
            }
            return constSearchQtyPO.getDataSource(myFilters);
        }

        const getDataSSPaymentDetailCode = (params) => {
            let myFilters = [];
            if(!!params.custpage_subsidiary) {
                myFilters.push(search.createFilter({
                    name: "subsidiary",
                    join: "CUSTRECORD_SCV_PAYMENT_PURCHASE_ORDER",
                    operator: "anyof", 
                    values: params.custpage_subsidiary
                }));
            }
            if(!!params.custpage_entity) {
                myFilters.push(search.createFilter({
                    name: "entity",
                    join: "CUSTRECORD_SCV_PAYMENT_PURCHASE_ORDER",
                    operator: "anyof", 
                    values: params.custpage_entity
                }));
            }
            return constSearchPayrDetail.getDataSource(myFilters);
        }

        const getDataSSItrBC = (arrInternalid, params) => {
            if(arrInternalid.length === 0) return [];

            let myFilters = [
                search.createFilter({
                    name: 'formulatext',
                    formula: `
                        CASE WHEN 
                            ({custbody_scv_related_transaction.type} = 'Work Order' AND TO_CHAR({custbody_scv_related_transaction.appliedtotransaction.id}) IN ('${arrInternalid.join("', '")}') ) 
                            OR 
                            ({custbody_scv_related_transaction.type} != 'Work Order' AND TO_CHAR({custbody_scv_related_transaction.internalid}) IN ('${arrInternalid.join("', '")}') ) 
                            THEN 'Yes' ELSE 'No' 
                        END`,
                    
                    operator: "is",
                    values: "Yes"
                }),
            ];

            if(!!params.custpage_subsidiary) {
                myFilters.push(search.createFilter({
                    name: "subsidiary", 
                    operator: "anyof", 
                    values: params.custpage_subsidiary
                }));
            }
            
            return constSearchItrBC.getDataSource(myFilters);
        }

        const getDataItem = (arrItemId) => {
            if(arrItemId.length === 0) return [];

            let sqlQuery = `SELECT id, displayname, itemtype FROM item
                WHERE id IN ('${arrItemId.join("','")}') AND isinactive = 'F'`;

            let resultSearch = query.runSuiteQL({
                query: sqlQuery,
                pageSize: 1000
            });

		    resultSearch = resultSearch.asMappedResults();
		    return resultSearch;
        }

        const onCreateFormUI = (params) => {
            let mainForm = serverWidget.createForm({title: "Màn hình lấy số lượng QC đạt"});
            mainForm.clientScriptModulePath = '../cs/scv_cs_sl_payment_req_qc_passed.js';
            let filterGrp = addFieldGroup(mainForm, "fieldgrp_main", "Filters");
            let defaultGrp = addFieldGroup(mainForm, "default_grp_main", "Defaults");
            // add button
            mainForm.addSubmitButton({label : 'Tạo ĐNTT'});
            mainForm.addButton({
                id: "custpage_btn_search",
                label: "Tìm kiếm",
                functionName: "onSearchResult()"
            });
            lbf.pinHeaderSublist(mainForm);
            // add field
            let custpage_subsidiary = mainForm.addField({
                id: "custpage_subsidiary",
                type: serverWidget.FieldType.SELECT,
                label: "Subsidairy",
                container: filterGrp.id
            });
            let custpage_entity = mainForm.addField({
                id: "custpage_entity",
                type: serverWidget.FieldType.SELECT,
                label: "Đối tượng",
                source: "vendor",
                container: filterGrp.id
            });
            let custpage_item = mainForm.addField({
                id: "custpage_item",
                type: serverWidget.FieldType.SELECT,
                label: "Hàng hóa",
                source: "item",
                container: filterGrp.id
            });
            let custpage_location = mainForm.addField({
                id: "custpage_location",
                type: serverWidget.FieldType.SELECT,
                label: "Kho",
                source: "location",
                container: filterGrp.id
            });
            let custpage_trandate_label = mainForm.addField({
                id: 'custpage_trandate_label',
                type: serverWidget.FieldType.LABEL,
                label: 'Ngày đơn hàng',
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
            let custpage_po = mainForm.addField({
                id: "custpage_po",
                type: serverWidget.FieldType.SELECT,
                label: "Số đơn hàng",
                source: "purchaseorder",
                container: filterGrp.id
            });
            let custpage_currency = mainForm.addField({
                id: "custpage_currency",
                type: serverWidget.FieldType.SELECT,
                label: "Loại tiền tệ",
                source: "currency",
                container: filterGrp.id
            });
            let custpage_ordertype = mainForm.addField({
                id: "custpage_ordertype",
                type: serverWidget.FieldType.SELECT,
                label: "Order Type",
                // source: "customrecord_scv_order_type",
                container: filterGrp.id
            });

            let custpage_ngaynk_label = mainForm.addField({
                id: 'custpage_ngaynk_label',
                type: serverWidget.FieldType.LABEL,
                label: 'Ngày nhập kho',
                container: filterGrp.id
            });
            let custpage_from_ngaynk = mainForm.addField({
                id: 'custpage_from_ngaynk',
                type: serverWidget.FieldType.DATE,
                label: 'Từ ngày',
                container: filterGrp.id
            });
            let custpage_to_ngaynk = mainForm.addField({
                id: 'custpage_to_ngaynk',
                type: serverWidget.FieldType.DATE,
                label: 'Đến ngày',
                container: filterGrp.id
            });

            // default values
            let custpage_type_denghitt = mainForm.addField({
                id: "custpage_type_denghitt",
                type: serverWidget.FieldType.SELECT,
                label: "Phân loại",
                // source: "customlist_scv_type_denghitt",
                container: defaultGrp.id
            });
            let custpage_def_entity = mainForm.addField({
                id: "custpage_def_entity",
                type: serverWidget.FieldType.SELECT,
                label: "Đối tượng ĐNTT",
                source: "-9",
                container: defaultGrp.id
            });
            let custpage_payment_method = mainForm.addField({
                id: "custpage_payment_method",
                type: serverWidget.FieldType.SELECT,
                label: "Hình thức thanh toán",
                source: "customlist_scv_htth",
                container: defaultGrp.id
            });

            // defaultGrp
            constSubsidiary.initLoadFieldSubsidiaryByUserRole(custpage_subsidiary);
            onLoadOrderType(custpage_ordertype);
            onLoadTypeDeNghiTT(custpage_type_denghitt);
            custpage_subsidiary.isMandatory = true;
            custpage_entity.isMandatory = true;
            custpage_type_denghitt.isMandatory = true;
            custpage_def_entity.isMandatory = true;
            custpage_payment_method.isMandatory = true;

            custpage_fromdt.updateLayoutType({layoutType: 'STARTROW'});
            custpage_todt.updateLayoutType({layoutType: 'ENDROW'});
            custpage_from_ngaynk.updateLayoutType({layoutType: 'STARTROW'});
            custpage_to_ngaynk.updateLayoutType({layoutType: 'ENDROW'});

            let fields = [
                custpage_subsidiary, custpage_entity, custpage_item, custpage_fromdt,
                custpage_todt, custpage_location, custpage_po, custpage_currency, custpage_ordertype
            ];
            applyCustomFieldSettings(fields, params, true);
            custpage_fromdt.defaultValue = getFromDate(params.custpage_fromdt);
            custpage_todt.defaultValue = getToDate(params.custpage_todt);
            custpage_from_ngaynk.defaultValue = getFromDate(params.custpage_from_ngaynk);
            custpage_to_ngaynk.defaultValue = getToDate(params.custpage_to_ngaynk);

            // add sublist
            let rsSL = mainForm.addSublist({
                id: "custpage_sl_result",
                type: serverWidget.SublistType.LIST,
                label: 'Result'
            });
            
            rsSL.addMarkAllButtons();
            onCreateSublistColumn(rsSL, params);

            return { form: mainForm, sublist: rsSL }
        }

        const applyCustomFieldSettings = (fields, params, isHelpText) => {
            for(let objField of fields) {
                objField.defaultValue = params[objField.id];
                if(isHelpText) {
                    objField.setHelpText({ help: objField.label });
                }
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

        function onLoadTypeDeNghiTT(_typeDNTTField) {
            let arrId = [TypeDeNghiTT.ThanhToanCongNo.ID, TypeDeNghiTT.QuyetToanNVDiMuaHang.ID];
            let resultSearch = query.runSuiteQL({
                query: `SELECT id, name 
                FROM customlist_scv_type_denghitt
                WHERE id IN (${arrId.join(", ")})
                ORDER BY id ASC`
            }).asMappedResults();

            _typeDNTTField.addSelectOption({value : "", text : ""});
            for(let obj of resultSearch) {
                _typeDNTTField.addSelectOption({value : obj.id, text : obj.name});
            }
        }

        function onLoadOrderType(_orderTypeField) {
            let arrOrderType = getDataOrderTypePO();

            _orderTypeField.addSelectOption({value : "", text : ""});
            for(let obj of arrOrderType) {
                _orderTypeField.addSelectOption({value : obj.id, text : obj.name});
            }
        }

        const getDataOrderTypePO = () => {
            let resultSearch = query.runSuiteQL({
                query: `
                    SELECT id, name, custrecord_scv_app_trans_type
                    FROM customrecord_scv_order_type
                    WHERE BUILTIN.MNFILTER(custrecord_scv_app_trans_type, 'MN_INCLUDE', '', 'FALSE', 'PurchOrd') = 'T'
                    ORDER BY id ASC
                `,
                pageSize: 1
            });

            resultSearch = resultSearch.asMappedResults();
            return resultSearch;
        }

        function onCreateSublistColumn(sublist){
            let arrColumn = [
                { label: "Select", type: "checkbox", displayType: "entry" },
                { label: "Số PO", type: "text" },
                { label: "Phiếu NK", type: "text" },
                { label: "Ngày NK", type: "text" },
                { label: "Hàng hóa", type: "text" },
                { label: "Đơn vị tính", type: "text" },
                { label: "Số lượng PO", type: "float" },
                { label: "Số lượng nhập kho", type: "float" },
                { label: "SL hoá đơn", type: "float" },
                { label: "Số lượng đạt", type: "float" },
                { label: "Số lượng không đạt", type: "float" },
                { label: "SL trả hàng", type: "float" },
                { label: "Số lượng ĐNTT", type: "float", displayType: "entry" },
                { label: "Đơn giá", type: "float" }, 
                { label: "Thuế suất", type: "text" },
                { label: "Đặc tính quy cách", type: "textarea" },
                { label: "Loại tiền tệ", type: "text" },
                { label: "Tỷ giá", type: "float" },
                { label: "ĐVT mua", type: "text" },
                { label: "SL ĐVT mua", type: "float" },
                { label: "Đơn giá ĐVT mua", type: "float" },
                { label: "Thành tiền ĐVT mua", type: "float" },
                { label: "Trạng thái NK", type: "text" },
                { label: "Ori line ID", type: "text" },
                { label: "Line ID", type: "text" },
                { label: "QC", type: "text" },
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
            // let d = new Date();
            // return new Date(d.getFullYear(), d.getMonth(), "01");
            return null;
        }

        function getToDate(_todt) {
            if (lbf.isContainValue(_todt)) {
                return _todt
            }
            // return new Date();
            return null;
        }

        function addFieldGroup(_form, _id, _label){
            let _obj = {id: _id, label: _label}
            _form.addFieldGroup(_obj);
            return _obj;
        }

        return {onRequest}

    });
