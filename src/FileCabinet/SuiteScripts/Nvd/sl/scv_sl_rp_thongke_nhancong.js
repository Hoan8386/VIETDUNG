/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/file', 'N/search', 'N/ui/serverWidget',
        '../lib/scv_lib_common_html.js', '../lib/scv_lib_report', '../lib/scv_lib_common_info'],
    (file, search, serverWidget, libHtml, libRep, libCommonInfo) => {
        
        const SS_CMMS_LABOR_STATISTICAL = 'customsearch_cmms_labor_statistical';
        
        const onRequest = (scriptContext) => {
           
            let response = scriptContext.response;
            let request = scriptContext.request;
            let params = request.parameters;
            let filtersCMMS = [];
            let listDataCMMS = [];
            let action = params.action;
            if (params.isSearch === "T") {
                pushFilterCMMS(filtersCMMS, params);
                libRep.doSearchSSRangeLabelId(SS_CMMS_LABOR_STATISTICAL, 1000, listDataCMMS, filtersCMMS);
            }
            if (params.isgetdata === 'T') {
                response.write(JSON.stringify({
                    listDataCMMS: listDataCMMS,
                } || {}));
            } else if (action === 'getUrlTemplate') {
                response.write(JSON.stringify({urlTemplate: libCommonInfo.getUrlFileTemplate('EXCEL', 'scv_xlsx_bang_thongke_nhancong.xlsx')}));
            }
            if (scriptContext.request.method === "GET") {
                let lableResults = "Kết quả";
                let mainForm = onCreateFormUI(params);
                renderDxGrid(mainForm.form, optionGrid, listDataCMMS, lableResults);
                response.writePage(mainForm.form);
            }
            
        }
        
        const onCreateFormUI = (params) => {
            let mainForm = serverWidget.createForm({title: "Bảng thống kê nhân công"});
            mainForm.clientScriptModulePath = "../cs/scv_cs_rp_thongke_nhancong.js";
            let mainGrp = addFieldGroup(mainForm, "fieldgrp_main", "Bộ lọc");
            mainForm.addButton({id: "custpage_btn_search", label: "Tìm kiếm", functionName: "onSearchResult()"});
            mainForm.addButton({id: 'custpage_bt_export', label: 'Xuất', functionName: 'exportReport()'});
            
            let custpage_subsidiary = mainForm.addField({
                id: 'custpage_subsidiary',
                type: serverWidget.FieldType.SELECT,
                label: 'Công ty',
                container: mainGrp.id,
                source: 'subsidiary'
            });
            custpage_subsidiary.defaultValue = params.custpage_subsidiary;
            custpage_subsidiary.updateBreakType({breakType: 'STARTCOL'});
            
            let custpage_fromdt = mainForm.addField({
                id: 'custpage_fromdt',
                type: serverWidget.FieldType.DATE,
                label: 'Từ ngày',
                container: mainGrp.id,
            });
            custpage_fromdt.defaultValue = params.custpage_fromdt;
            
            let custpage_department = mainForm.addField({
                id: 'custpage_department',
                type: serverWidget.FieldType.SELECT,
                label: 'Bộ phận',
                container: mainGrp.id,
                source: 'department'
            });
            custpage_department.updateBreakType({breakType: 'STARTCOL'});
            custpage_department.defaultValue = params.custpage_department;
            
            let custpage_todt = mainForm.addField({
                id: 'custpage_todt',
                type: serverWidget.FieldType.DATE,
                label: 'Đến ngày',
                container: mainGrp.id
            });
            custpage_todt.defaultValue = params.custpage_todt;
            
            let custpage_employee = mainForm.addField({
                id: 'custpage_employee',
                type: serverWidget.FieldType.SELECT,
                label: 'Người thực hiện',
                container: mainGrp.id,
                source: 'employee'
            });
            custpage_employee.updateBreakType({breakType: 'STARTCOL'});
            custpage_employee.defaultValue = params.custpage_employee;
            
            let fieldWorkItem = mainForm.addField({
                id: 'custpage_workitem',
                type: serverWidget.FieldType.SELECT,
                label: 'Hạng mục công việc',
                container: mainGrp.id,
                source: 'customrecord_scv_cmms_workitem'
            });
            fieldWorkItem.defaultValue = params.custpage_workitem;
            
            return {form: mainForm};
        }
        
        const pushFilterCMMS = (f, params) => {
            if (params.custpage_fromdt) {
                f.push(search.createFilter({
                    name: 'formuladate',
                    operator: search.Operator.ONORAFTER,
                    values: params.custpage_fromdt,
                    formula: "NVL({custrecord_scv_cmms_lb_cmmswo.custrecord_scv_cmms_wo_date},{custrecord_scv_cmms_lb_date})"
                }));
            }
            if (params.custpage_todt) {
                f.push(search.createFilter({
                    name: 'formuladate',
                    operator: search.Operator.ONORBEFORE,
                    values: params.custpage_todt,
                    formula: "NVL({custrecord_scv_cmms_lb_cmmswo.custrecord_scv_cmms_wo_date},{custrecord_scv_cmms_lb_date})"
                }));
            }
            if (params.custpage_subsidiary) {
                f.push(search.createFilter({
                    name: 'formulatext',
                    operator: search.Operator.IS,
                    values: params.custpage_subsidiary,
                    formula: "NVL({custrecord_scv_cmms_lb_cmmswo.custrecord_scv_cmms_wo_subsidiary.id},{custrecord_scv_cmms_lb_subsidiaries.id})"
                }));
            }
            if (params.custpage_employee) {
                let lkFieldsEmp = search.lookupFields({
                    type: 'employee',
                    id: params.custpage_employee,
                    columns: ['custentity_scv_emp_code']
                });
                
                f.push(search.createFilter({
                    name: 'custentity_scv_emp_code',
                    join: 'custrecord_scv_cmms_lb_employee',
                    operator: search.Operator.IS,
                    values: lkFieldsEmp.custentity_scv_emp_code
                }));
            }
            if (params.custpage_department) {
                f.push(search.createFilter({
                    name: 'custrecord_scv_cmms_lb_department',
                    operator: search.Operator.ANYOF,
                    values: params.custpage_department
                }));
            }
            
            if (params.custpage_workitem) {
                f.push({
                    name: 'custrecord_scv_cmms_lb_jobcode',
                    operator: search.Operator.ANYOF,
                    values: params.custpage_workitem,
                    // formula: "NVL({custrecord_scv_cmms_lb_cmmswo.custrecord_scv_cmms_wo_workitemcode},{custrecord_scv_cmms_lb_jobcode.custrecord_scv_cmms_wi_code})"
                });
            }
        }
        
        const optionGrid = {
            columns: [
                {caption: "Ngày", dataField: "date", dataType: "string",},
                {caption: "Mã người thực hiện", dataField: "code", dataType: "string"},
                {caption: "Ngươi thực hiện", dataField: "name", dataType: "string"},
                {caption: "Bộ phận", dataField: "department_display", dataType: "string"},
                {caption: "Công ty", dataField: "sub_display", dataType: "string"},
                {caption: "Nội dung công việc", dataField: "work", dataType: "string"},
                {caption: "Thời gian", dataField: "hours", dataType: "number"},
                {caption: "Ghi chú", dataField: "memo", dataType: "number"},
            ],
        };
        
        const addFieldGroup = (_form, _id, _label) => {
            let _obj = {id: _id, label: _label}
            _form.addFieldGroup(_obj);
            return _obj;
        }
        
        const renderDxGrid = (_form, _optionGrid, _arrData, lableResults) => {
            let opGrid = _optionGrid || {};
            let _pathFile = '../html/tmpl/scv_html_tmpl_grd00001.html';
            opGrid.columns = opGrid.columns || [];
            opGrid.summaryTotalItems = opGrid.summaryTotalItems || [];
            opGrid.summaryGroupItems = opGrid.summaryGroupItems || [];
            let dataForGrid = _arrData && _arrData.length ? _arrData : [];
            let htmlFile = "<script>" +
                "let opGrid = " + JSON.stringify(opGrid) + ";" +
                "let arrData = " + JSON.stringify(dataForGrid) + ";" +
                "</script>";
            htmlFile += file.load({id: _pathFile}).getContents();
            htmlFile += '</tbody></table>';
            let fieldGroup_id = "fieldgrp_" + onGenCodeRandom();
            _form.addFieldGroup({id: fieldGroup_id, label: lableResults});
            let custpage_dxgrid = _form.addField({
                id: 'custpage_dxgrid',
                type: "inlinehtml",
                label: 'DxGrid',
                container: fieldGroup_id
            });
            custpage_dxgrid.defaultValue = htmlFile;
        }
        
        
        const onGenCodeRandom = () => {
            return "" + Math.round(Math.random() * 1000) + ("" + Date.now());
        }
        
        return {
            onRequest
        };
    });
