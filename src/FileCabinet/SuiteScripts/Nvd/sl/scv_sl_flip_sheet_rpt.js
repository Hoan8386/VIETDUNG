/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define([
    'N/ui/serverWidget', 'N/runtime', 'N/search', 'N/file', 'N/format',
    '../lib/scv_lib_function.js',
    '../lib/scv_lib_report.js',
    '../cons/scv_cons_subsidiary.js',
    '../cons/scv_cons_search_report_cl.js',
    '../cons/scv_cons_search_report_lt.js'
],
    (
        serverWidget, runtime, search, file, format,
        lbf, libReport,
        constSubsidiary,
        searchReportCL, searchReportLT
    ) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const CurScript = {
            ID: 'customscript_scv_sl_flip_sheet_rpt',
            DEPLOYID_UI: 'customdeploy_scv_sl_flip_sheet_rpt',
            DEPLOYID_DATA: 'customdeploy_scv_sl_flip_sheet_data'
        };

        const ReportType = {
            Detail: {
                ID: "detail", NAME: "Chi tiết"
            },
            Summary: {
                ID: "summary", NAME: "Tổng hợp"
            },
        };

        const onRequest = (scriptContext) => {
            let request = scriptContext.request;
            let response = scriptContext.response;

            let scriptId = runtime.getCurrentScript().deploymentId;
            if(scriptId === CurScript.DEPLOYID_DATA) {
                onRequestDeploymentData(request, response);
            } else {
                onRequestDeploymentUI(request, response);
            }
        }

        const onRequestDeploymentData = (request, response) => {
            let params = request.parameters;
            if(request.method == "GET") {
                let objResponse = {
                    isSuccess: true, message: "Success!", 
                    data: runFilterSS(params)
                };

                response.setHeader({ name: 'Content-Type', value: 'application/json' });
                response.write(JSON.stringify(objResponse));
            }
        }

        const onRequestDeploymentUI = (request, response) => {
            if(request.method == "GET") {
                let params = request.parameters;
                let MainForm = onCreateFormUI(params);

                if(params.isrun == "T") {
                    let searchResult = runFilterSS(params);
                    onRenderData(MainForm.sublist, searchResult, params);
                }

                response.writePage(MainForm.form);
            }
        }

        const onRenderData = (sublist, data, params) => {
            switch(params.custpage_report_type) {
                case ReportType.Detail.ID:
                    onRenderDataReportDetail(sublist, data);
                    break;
                case ReportType.Summary.ID:
                    onRenderDataReportSummary(sublist, data);
                    break;
            }
        }

        const onRenderDataReportSummary = (sublist, data) => {
            for (let i = 0; i < data.length; i++) {
                let obj = data[i];
                setRowDataSublist(sublist, i, [
                    "custpage_col_0", "custpage_col_1", "custpage_col_2", "custpage_col_3", 
                    "custpage_col_4", "custpage_col_5", "custpage_col_6", "custpage_col_json_data",
                ], [
                    obj.stt, obj.employee_display, obj.tsl_a, obj.he_so, obj.qty_quy_doi, 
                    obj.single_error, obj.multi_error, JSON.stringify(obj)
                ]);
            }
        }

        const onRenderDataReportDetail = (sublist, data) => {
            for (let i = 0; i < data.length; i++) {
                let obj = data[i];
                setRowDataSublist(sublist, i, [
                    "custpage_col_0", "custpage_col_1", "custpage_col_2", "custpage_col_3", 
                    "custpage_col_4", "custpage_col_5", "custpage_col_6", "custpage_col_7", 
                    "custpage_col_8", "custpage_col_9", "custpage_col_10", "custpage_col_11",
                    "custpage_col_json_data",
                ], [
                    obj.stt, obj.receipt_date, obj.item_upccode, obj.item_display, obj.tsl_a,
                    obj.employee_display, obj.he_so, obj.qty_quy_doi, obj.single_error,
                    obj.multi_error, obj.error_description, obj.note,
                    JSON.stringify(obj)
                ]);
            }
        }

        const runFilterSS = (params) => {
            let arrResult = [];
            switch(params.custpage_report_type) {
                case ReportType.Detail.ID:
                    arrResult = getDataReportTypeDetail(params);
                    break;
                case ReportType.Summary.ID:
                    arrResult = getDataReportTypeSummary(params);
                    break;
            }
            return arrResult;
        }

        const getDataReportTypeDetail = (params) => {
            let isSummary = false;
            let arrChatLuong = getDataSSThongKeChatLuong(params, isSummary);
            let arrLatTam = getDataSSThongKeLatTam(params, isSummary);

            let arrResult = [];
            let objTotal = {
                level: 1, item_display: "Tổng",
                tsl_a: 0, qty_quy_doi: 0, single_error: 0, multi_error: 0
            };
            let index = 0;
            for(let objChatLuong of arrChatLuong) {
                index++;
                let objFindLatTam = arrLatTam.find(e => {
                    return e.subsidiary == objChatLuong.subsidiary && e.item == objChatLuong.item &&
                        e.employee == objChatLuong.employee && e.receipt_date == objChatLuong.receipt_date && 
                        objChatLuong.has_error === "Yes" && e.has_qty_a == objChatLuong.has_qty_a;
                });

                let objRes = { 
                    ...objChatLuong,
                    stt: index,
                    single_error: !!objFindLatTam ? objFindLatTam.single_error : null,
                    multi_error: !!objFindLatTam ? objFindLatTam.multi_error : null,
                    error_description: objFindLatTam?.error_description || "",
                    note: objFindLatTam?.note || "",
                };
                arrResult.push(objRes);
                // total
                objTotal.tsl_a += objRes.tsl_a;
                objTotal.qty_quy_doi += objRes.qty_quy_doi;
                objTotal.single_error += (objRes.single_error || 0);
                objTotal.multi_error += (objRes.multi_error || 0);
            }

            arrResult.sort((a, b) => {
                const dateA = a.receipt_date ? format.parse({ value: a.receipt_date, type: "date" }) : null;
                const dateB = b.receipt_date ? format.parse({ value: b.receipt_date, type: "date" }) : null;

                if (!dateA && !dateB) return 0;
                if (!dateA) return 1;
                if (!dateB) return -1;

                return dateA - dateB;
            });

            arrResult.push(objTotal);
            return arrResult;
        }

        const getDataReportTypeSummary = (params) => {
            let isSummary = true;
            let arrChatLuong = getDataSSThongKeChatLuong(params, isSummary);
            let arrLatTam = getDataSSThongKeLatTam(params, isSummary);

            let arrGrpData = lbf.onGroupByArray([...arrChatLuong, ...arrLatTam], ["subsidiary", "employee"]);
            let arrResult = [], index = 0;
            let objTotal = {
                level: 1, employee_display: "Tổng",
                tsl_a: 0, qty_quy_doi: 0, single_error: 0, multi_error: 0
            };

            for(let objGroup of arrGrpData) {
                let arrFilterChatLuong = arrChatLuong.filter(e => e.subsidiary == objGroup.subsidiary && e.employee == objGroup.employee);
                let arrFilterLatTam = arrLatTam.filter(e => e.subsidiary == objGroup.subsidiary && e.employee == objGroup.employee);
                index++;

                let objSumCL = arrFilterChatLuong.reduce((acc, cur) => {
                    acc.tsl_a += cur.tsl_a || 0;
                    acc.qty_quy_doi += cur.qty_quy_doi || 0;
                    return acc;
                }, { tsl_a: 0, qty_quy_doi: 0});

                let objSumLT = arrFilterLatTam.reduce((acc, cur) => {
                    acc.single_error += cur.single_error || 0;
                    acc.multi_error += cur.multi_error || 0;
                    return acc;
                }, { single_error: 0, multi_error: 0});

                let objRes = {
                    stt: index,
                    employee_display: arrFilterChatLuong[0]?.employee_display || arrFilterLatTam[0]?.employee_display,
                    he_so: arrFilterChatLuong[0]?.he_so || 0,
                    tsl_a: objSumCL.tsl_a,
                    qty_quy_doi: objSumCL.qty_quy_doi, 
                    single_error: objSumLT.single_error, 
                    multi_error: objSumLT.multi_error,
                }
                arrResult.push(objRes);
                 // total
                objTotal.tsl_a += objRes.tsl_a;
                objTotal.qty_quy_doi += objRes.qty_quy_doi;
                objTotal.single_error += objRes.single_error;
                objTotal.multi_error += objRes.multi_error;
            }

            arrResult.push(objTotal);
            return arrResult;
        }

        const getDataSSThongKeChatLuong = (params, isSummary) => {
            let myFilters = [];
            if(!!params.custpage_subsidiary) {
                myFilters.push(search.createFilter({
                    name: "custrecord_scv_inspl_sub", 
                    operator: "anyof", 
                    values: params.custpage_subsidiary
                }));
            }

            if(!!params.custpage_employee) {
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_inspl_team',
                    operator: "anyof",
                    values: params.custpage_employee.split(",")
                }));
            }

            if(!!params.custpage_item && isSummary === false) {
                myFilters.push(search.createFilter({
                    name: "custrecord_scv_inspl_item", 
                    operator: "anyof", 
                    values: params.custpage_item.split(",")
                }));
            }

            if(!!params.custpage_fromdt) {
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_inspl_kcs_receipt_date',
                    operator: "onorafter",
                    values: params.custpage_fromdt
                }));
            }

            if(!!params.custpage_todt) {
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_inspl_kcs_receipt_date',
                    operator: "onorbefore",
                    values: params.custpage_todt
                }));
            }
            
            let data = searchReportCL.getDataSource(myFilters);
            return data;
        }

        const getDataSSThongKeLatTam = (params, isSummary) => {
            let myFilters = [];
            if(!!params.custpage_subsidiary) {
                myFilters.push(search.createFilter({
                    name: "custrecord_scv_inspl_sub", 
                    operator: "anyof", 
                    values: params.custpage_subsidiary
                }));
            }

            if(!!params.custpage_employee) {
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_inspl_team',
                    operator: "anyof",
                    values: params.custpage_employee.split(",")
                }));
            }

            if(!!params.custpage_item && isSummary === false) {
                myFilters.push(search.createFilter({
                    name: "custrecord_scv_inspl_item", 
                    operator: "anyof", 
                    values: params.custpage_item.split(",")
                }));
            }

            if(!!params.custpage_fromdt) {
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_inspl_kcs_receipt_date',
                    operator: "onorafter",
                    values: params.custpage_fromdt
                }));
            }

            if(!!params.custpage_todt) {
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_inspl_kcs_receipt_date',
                    operator: "onorbefore",
                    values: params.custpage_todt
                }));
            }
            
            let data = searchReportLT.getDataSource(myFilters);
            return data;
        }

        const onCreateFormUI = (params) => {
            let mainForm = serverWidget.createForm({title: "BÁO CÁO LẬT TẤM"});
            mainForm.clientScriptModulePath = '../cssl/scv_cs_sl_flip_sheet_rpt.js';
            let filterGrp = addFieldGroup(mainForm, "fieldgrp_main", "Filters");
            libReport.addPageLinkForm(mainForm, ["customsearch_scv_report_cl", "customsearch_scv_report_lt"]);
            // add button
            mainForm.addButton({
                id: "custpage_btn_search",
                label: "Search",
                functionName: "onSearchResult()"
            });
             mainForm.addButton({
                id: "custpage_btn_export",
                label: "Export",
                functionName: "onExport()"
            });
            // add field
            let custpage_report_type = mainForm.addField({
                id: "custpage_report_type",
                type: serverWidget.FieldType.SELECT,
                label: "Loại",
                container: filterGrp.id
            });
            let custpage_subsidiary = mainForm.addField({
                id: "custpage_subsidiary",
                type: serverWidget.FieldType.SELECT,
                label: "'Công ty",
                container: filterGrp.id
            });
            let custpage_item = mainForm.addField({
                id: "custpage_item",
                type: serverWidget.FieldType.MULTISELECT,
                label: "Mặt hàng",
                source: "item",
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
            let custpage_employee = mainForm.addField({
                id: "custpage_employee",
                type: serverWidget.FieldType.MULTISELECT,
                label: "Tổ lật tấm",
                source: "employee",
                container: filterGrp.id
            });

            let custpage_url_file_detail = mainForm.addField({
                id: "custpage_url_file_detail",
                type: serverWidget.FieldType.TEXT,
                label: "File Detail",
                container: filterGrp.id
            });

            let custpage_url_file_summary = mainForm.addField({
                id: "custpage_url_file_summary",
                type: serverWidget.FieldType.TEXT,
                label: "File Summary",
                container: filterGrp.id
            });

            custpage_url_file_detail.updateDisplayType({displayType: 'hidden'});
            custpage_url_file_detail.defaultValue = getUrlFile('../xls/scv_flip_sheet_detail.xlsx');
            custpage_url_file_summary.updateDisplayType({displayType: 'hidden'});
            custpage_url_file_summary.defaultValue = getUrlFile('../xls/scv_flip_sheet_summary.xlsx');

            custpage_report_type.isMandatory = true;
            custpage_subsidiary.isMandatory = true;
            custpage_fromdt.isMandatory = true;
            custpage_todt.isMandatory = true;

            onLoadReportType(custpage_report_type);
            constSubsidiary.initLoadFieldSubsidiaryByUserRole(custpage_subsidiary);
            custpage_fromdt.updateLayoutType({layoutType: 'STARTROW'});
            custpage_todt.updateLayoutType({layoutType: 'ENDROW'});
            let fields = [
                custpage_report_type, custpage_subsidiary, custpage_fromdt, custpage_todt,
                custpage_item, custpage_employee
            ];
            applyCustomFieldSettings(fields, params, true);
            custpage_fromdt.defaultValue = getFromDate(params.custpage_fromdt);
            custpage_todt.defaultValue = getToDate(params.custpage_todt);

             // add sublist
            let rsSL = mainForm.addSublist({
                id: "custpage_sl_result",
                type: serverWidget.SublistType.LIST,
                label: 'Result'
            });
            onCreateSublistColumn(rsSL, params);

            return { form: mainForm, sublist: rsSL };
        }

        const getUrlFile = (_fileId) => {
            return file.load({id: _fileId}).url;
        }

        const onCreateSublistColumn = (sublist, params) => {
            
            let arrColumn = [
                { label: "STT", type: "integer" },
                { label: "Ngày kiểm tra", type: "text" },
                { label: "Mã hàng", type: "text" },
                { label: "Tên hàng", type: "textarea" },
                { label: "TSL A (Chưa quy chuẩn)", type: "float" },
                { label: "Tổ lật tấm", type: "text" },
                { label: "Hệ số", type: "float" },
                { label: "Số lượng quy đổi", type: "float" },
                { label: "Số lượng lỗi đơn lẻ", type: "float" },
                { label: "Số lượng lỗi hàng loạt", type: "float" },
                { label: "Nguyên nhân lỗi", type: "textarea" },
                { label: "Ghi chú", type: "text" },
                { id: "custpage_col_json_data", label: "JSON Data", type: "textarea", displayType: "hidden" },
            ];
            if(params.custpage_report_type == ReportType.Summary.ID) {
                arrColumn = [
                    { label: "STT", type: "integer" },
                    { label: "Tổ lật tấm", type: "text" },
                    { label: "TSL A (Chưa quy chuẩn)", type: "float" },
                    { label: "Hệ số", type: "float" },
                    { label: "Số lượng quy đổi", type: "float" },
                    { label: "Số lượng lỗi đơn lẻ", type: "float" },
                    { label: "Số lượng lỗi hàng loạt", type: "float" },
                    { id: "custpage_col_json_data", label: "JSON Data", type: "textarea", displayType: "hidden" },
                ];
            }
            let index = 0;
            for(let i = 0; i< arrColumn.length; i++){
                let field = sublist.addField({
                    id: arrColumn[i].id || ("custpage_col_"+ index),
                    type: arrColumn[i].type,
                    label: arrColumn[i].label,
                });
                
                field.updateDisplayType({ displayType: arrColumn[i].displayType || "inline"});
                if(!arrColumn[i].id) {
                    index++;
                }
            }
        }

        const onLoadReportType = (reportTypeField) => {
            for(let property in ReportType) {
                reportTypeField.addSelectOption({
                    value: ReportType[property].ID,
                    text: ReportType[property].NAME
                });
            }
        }

        const applyCustomFieldSettings = (fields, params, isHelpText) => {
            for(let objField of fields) {
                objField.defaultValue = params[objField.id];
                if(objField.type === "multiselect") {
                    objField.defaultValue = params[objField.id]?.split(",");
                }
                if(isHelpText) {
                    objField.setHelpText({ help: objField.label });
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
            let d = new Date();
            return d;
            // return new Date(d.getFullYear(), d.getMonth() + 1, 0);
        }

        function addFieldGroup(_form, _id, _label){
            let _obj = {id: _id, label: _label}
            _form.addFieldGroup(_obj);
            return _obj;
        }

        return {onRequest}

    });
