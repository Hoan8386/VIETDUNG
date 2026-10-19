/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/file', 'N/render', 'N/search', 'N/ui/serverWidget', 'N/xml',
        '../lib/scv_lib_function.js', '../lib/scv_lib_report.js'],
    (file, render, search, serverWidget, xml,
     libFunc, libRep) => {
        
        const SAVED_SEARCH = {
            BKCT: "customsearch_scv_bkct_6",
            CONTRA_DEPR_CREDIT: "customsearch_scv_contra_depr_cre",
            CONTRA_DEPR_DEBIT: "customsearch_scv_contra_depr_deb",
            CONTRA_ACC_AMO_CREDIT: "customsearch_scv_contra_acc_amo_cre",
            CONTRA_ACC_AMO_DEBIT: "customsearch_scv_contra_acc_amo_deb",
            CONTRA_CREDIT: "customsearch_scv_contra_acc_cre",
            CONTRA_DEBIT: "customsearch_scv_contra_acc_deb",
            CONTRA_WOD_CREDIT: "customsearch_scv_contra_acc_wod_cre",
            CONTRA_WOD_DEBIT: "customsearch_scv_contra_acc_wod_deb"
        };
        
        const TEXT_DEFAULT = {
            FIXED_ASSET_DEPRECIATION_ENTRY: "Fixed Asset Depreciation Entry",
            JOURNAL: "Tính lêch",
            AMORTIZATION: "Amortization",
            WOC: "Work Order Completion",
            WOI: "Work Order Issue",
        };
        
        const FLAG_RUN = 'T';
        
        const TRANS_TYPE = {
            FIXED_ASSET_DEPRECIATION_ENTRY: "Custom134",
            JOURNAL: "Journal"
        };
        
        const onRequest = (context) => {
            let request = context.request;
            let params = request.parameters;
            if (request.method === "GET") {
                if (params.isexport_excel === FLAG_RUN) {
                    onExportFile(context);
                    return;
                }
                let {form, sublist} = onCreateFormUI(params);
                if (params.isrun === FLAG_RUN) {
                    let searchResult = runFilterSS(params);
                    onRenderData(sublist, searchResult);
                }
                libFunc.addSavedSearchToForm(form, Object.values(SAVED_SEARCH).map(o => ({id: o, title: o})));
                context.response.writePage(form);
            }
        }
        
        const onCreateFormUI = (_params) => {
            let mainForm = serverWidget.createForm({title: "Bảng kê chứng từ kế toán"});
            let mainGrp = addFieldGroup(mainForm, "fieldgrp_main", "Main");
            mainForm.clientScriptModulePath = '../cs/scv_cs_sl_bkct.js';
            mainForm.addButton({id: "custpage_btn_search", label: "Search", functionName: "onSearchResult()"});
            mainForm.addButton({id: "custpage_btn_export", label: "Excel", functionName: "onExportExcel()"});
            mainForm.addButton({id: "custpage_btn_print", label: "PrintPdf", functionName: "onPrint()"});
            let custpage_subsidiary = mainForm.addField({
                id: 'custpage_subsidiary',
                type: serverWidget.FieldType.MULTISELECT,
                label: 'Subsidiary',
                source: 'subsidiary',
                container: mainGrp.id
            });
            custpage_subsidiary.isMandatory = true;
            let custpage_account = mainForm.addField({
                id: 'custpage_account',
                type: serverWidget.FieldType.TEXT,
                label: 'Tài khoản',
                container: mainGrp.id
            });
            let custpage_fromdt = mainForm.addField({
                id: 'custpage_fromdt',
                type: serverWidget.FieldType.DATE,
                label: "From Date",
                container: mainGrp.id
            }).updateLayoutType({layoutType: serverWidget.FieldLayoutType.STARTROW});
            custpage_fromdt.isMandatory = true;
            let custpage_todt = mainForm.addField({
                id: 'custpage_todt',
                type: serverWidget.FieldType.DATE,
                label: 'To Date',
                container: mainGrp.id
            }).updateLayoutType({layoutType: serverWidget.FieldLayoutType.ENDROW});
            custpage_todt.isMandatory = true;
            let custpage_contraaccount = mainForm.addField({
                id: 'custpage_contraaccount',
                type: serverWidget.FieldType.TEXT,
                label: 'Tài khoản Đối ứng',
                container: mainGrp.id
            });
            if (libFunc.isContainValue(_params.custpage_subsidiary)) custpage_subsidiary.defaultValue = _params.custpage_subsidiary.split(",");
            if (libFunc.isContainValue(_params.custpage_account)) custpage_account.defaultValue = _params.custpage_account;
            if (libFunc.isContainValue(_params.custpage_contraaccount)) custpage_contraaccount.defaultValue = _params.custpage_contraaccount;
            custpage_fromdt.defaultValue = getFromDate(_params.custpage_fromdt);
            custpage_todt.defaultValue = getToDate(_params.custpage_todt);
            let rsSL = mainForm.addSublist({
                id: "custpage_sl_result",
                type: serverWidget.SublistType.LIST,
                label: 'Result'
            });
            onCreateSublistColumn(rsSL, _params);
            return {form: mainForm, sublist: rsSL};
        }
        
        const onCreateSublistColumn = (_sublist, _params) => {
            let arrColumn = [
                {label: "STT", type: "text"},
                {label: "Loại chứng từ", type: "text"},
                {label: "Số chứng từ", type: "text"},
                {label: "Ngày chứng từ", type: "text"},
                {label: "Tài khoản", type: "text"},
                {label: "Tên TK", type: "text"},
                {label: "TK đối ứng", type: "textarea"},
                {label: "Đối tượng", type: "textarea"},
                {label: "Diễn giải", type: "textarea"},
                {label: "Nợ", type: "float"},
                {label: "Có", type: "float"}
            ];
            const lC = arrColumn.length;
            for (let i = 0; i < lC; i++) {
                addColFieldSublist(_sublist, i, arrColumn[i]);
            }
        }
        
        const runFilterSS = (_params) => {
            let arrBKCT = getDataBKCT(_params);
            let arrContraDeprCredit = getDataContraDeprCredit(_params);
            let arrContraDepDebit = getDataContraDeprDebit(_params);
            let arrContraAmoCredit = getDataContraAmoCredit(_params);
            let arrContraAmoDebit = getDataContraAmoDebit(_params);
            let arrContraWodCredit = getDataContraWodCredit(_params);
            let arrContraWodDebit = getDataContraWodDebit(_params);
            let arrContraCredit = getDataContraCredit(_params);
            let arrContraDebit = getDataContraDebit(_params);
            let arrResult = [];
            for (let i = 0; i < arrBKCT.length; i++) {
                let obj = {tk_doi_ung: ""};
                obj.type_nm = arrBKCT[i].type_nm;
                obj.doc_num = arrBKCT[i].doc_num;
                obj.date = arrBKCT[i].date;
                obj.account_code = arrBKCT[i].account_code;
                obj.account_nm = arrBKCT[i].account_nm;
                obj.entity_nm = arrBKCT[i].entity_nm;
                obj.memo = arrBKCT[i].memo;
                obj.debit_amt = arrBKCT[i].debit_amt;
                obj.credit_amt = arrBKCT[i].credit_amt;
                if (arrBKCT[i].type_nm === TEXT_DEFAULT.FIXED_ASSET_DEPRECIATION_ENTRY) {
                    if (libFunc.isContainValue(arrBKCT[i].debit_amt)) {
                        let objContraDeprCredit_find = arrContraDeprCredit.find(e => e.id === arrBKCT[i].id);
                        if (libFunc.isContainValue(objContraDeprCredit_find)) {
                            obj.tk_doi_ung = objContraDeprCredit_find.tk_doi_ung;
                        }
                    } else {
                        let objContraDeprDebit_find = arrContraDepDebit.find(e => e.id === arrBKCT[i].id && e.memo === arrBKCT[i].memo);
                        if (libFunc.isContainValue(objContraDeprDebit_find)) {
                            obj.tk_doi_ung = objContraDeprDebit_find.tk_doi_ung;
                        }
                    }
                } else if (arrBKCT[i].type_id === TRANS_TYPE.JOURNAL && (arrBKCT[i].memo).indexOf(TEXT_DEFAULT.AMORTIZATION) === 0) {
                    if (libFunc.isContainValue(arrBKCT[i].debit_amt)) {
                        let arrContraAmoCredit_filter = arrContraAmoCredit.filter(function (e) {
                            return e.field_compare === arrBKCT[i].field_compare
                        });
                        if (arrContraAmoCredit_filter.length === 1) {
                            obj.tk_doi_ung = arrContraAmoCredit_filter[0].tk_doi_ung;
                        } else {
                            let objContraAmoCredit_find = arrContraAmoCredit_filter.find(e => e.line_id >= (arrBKCT[i].line_id - 1)
                                && e.line_id <= (arrBKCT[i].line_id + 1));
                            if (libFunc.isContainValue(objContraAmoCredit_find)) {
                                obj.tk_doi_ung = objContraAmoCredit_find.tk_doi_ung;
                            }
                        }
                    } else {
                        let arrContraAmoDebit_filter = arrContraAmoDebit.filter(function (e) {
                            return e.field_compare === arrBKCT[i].field_compare
                        });
                        if (arrContraAmoDebit_filter.length === 1) {
                            obj.tk_doi_ung = arrContraAmoDebit_filter[0].tk_doi_ung;
                        } else {
                            let objContraAmoDebit_find = arrContraAmoDebit_filter.find(e => e.line_id >= (arrBKCT[i].line_id - 1)
                                && e.line_id <= (arrBKCT[i].line_id + 1));
                            if (libFunc.isContainValue(objContraAmoDebit_find)) obj.tk_doi_ung = objContraAmoDebit_find.tk_doi_ung;
                        }
                    }
                } else if (arrBKCT[i].type_nm === TEXT_DEFAULT.WOC || arrBKCT[i].type_nm === TEXT_DEFAULT.WOI) {
                    if (libFunc.isContainValue(arrBKCT[i].debit_amt)) {
                        let arrContraWodCredit_filter = arrContraWodCredit.filter(function (e) {
                            return e.field_compare === arrBKCT[i].field_compare
                        });
                        if (arrContraWodCredit_filter.length === 1) {
                            obj.tk_doi_ung = arrContraWodCredit_filter[0].tk_doi_ung;
                        } else {
                            let objContraWodCredit_find = arrContraWodCredit_filter.find(e => e.line_id >= (arrBKCT[i].line_id - 1)
                                && e.line_id <= (arrBKCT[i].line_id + 1));
                            if (libFunc.isContainValue(objContraWodCredit_find)) {
                                obj.tk_doi_ung = objContraWodCredit_find.tk_doi_ung;
                            }
                        }
                    } else {
                        let arrContraWodDebit_filter = arrContraWodDebit.filter(function (e) {
                            return e.field_compare === arrBKCT[i].field_compare
                        });
                        if (arrContraWodDebit_filter.length === 1) {
                            obj.tk_doi_ung = arrContraWodDebit_filter[0].tk_doi_ung;
                        } else {
                            let objContraWodDebit_find = arrContraWodDebit_filter.find(e => e.line_id >= (arrBKCT[i].line_id - 1)
                                && e.line_id <= (arrBKCT[i].line_id + 1));
                            if (libFunc.isContainValue(objContraWodDebit_find)) {
                                obj.tk_doi_ung = objContraWodDebit_find.tk_doi_ung;
                            }
                        }
                    }
                } else {
                    if (libFunc.isContainValue(arrBKCT[i].debit_amt)) {
                        let objContraCredit_find = arrContraCredit.find(e => e.id === arrBKCT[i].id);
                        if (libFunc.isContainValue(objContraCredit_find)) {
                            obj.tk_doi_ung = objContraCredit_find.tk_doi_ung;
                        }
                    } else {
                        let objContraDebit_find = arrContraDebit.find(e => e.id === arrBKCT[i].id);
                        if (libFunc.isContainValue(objContraDebit_find)) {
                            obj.tk_doi_ung = objContraDebit_find.tk_doi_ung;
                        }
                    }
                }
                
                if (libFunc.isContainValue(obj.tk_doi_ung)) {
                    arrResult.push(obj);
                }
            }
            return arrResult;
        }
        
        const onRenderData = (_sublist, _result) => {
            const lD = _result.length;
            for (let i = 0; i < lD; i++) {
                let debit_amt = libFunc.isContainValue(_result[i].debit_amt) ? Number(_result[i].debit_amt).toFixed(0) : "";
                let credit_amt = libFunc.isContainValue(_result[i].credit_amt) ? Number(_result[i].credit_amt).toFixed(0) : "";
                
                setRowDataSublist(_sublist, i, [
                    "custpage_col_0", "custpage_col_1", "custpage_col_2",
                    "custpage_col_3", "custpage_col_4", "custpage_col_5",
                    "custpage_col_6", "custpage_col_7", "custpage_col_8",
                    "custpage_col_9", "custpage_col_10"
                ], [
                    "" + (i + 1), _result[i].type_nm, _result[i].doc_num,
                    _result[i].date, _result[i].account_code, _result[i].account_nm,
                    _result[i].tk_doi_ung, _result[i].entity_nm, _result[i].memo,
                    debit_amt, credit_amt
                ]);
            }
        }
        
        const getDataBKCT = (_params) => {
            let arrResult = [];
            let resultSearch = search.load(SAVED_SEARCH.BKCT);
            let myColumns = resultSearch.columns;
            let myFilters = resultSearch.filters;
            if (libFunc.isContainValue(_params.custpage_subsidiary)) myFilters.push(search.createFilter({
                name: "subsidiary",
                operator: "anyof",
                values: _params.custpage_subsidiary.split(",")
            }));
            if (libFunc.isContainValue(_params.custpage_account)) myFilters.push(search.createFilter({
                name: "formulanumeric",
                formula: `case when {account.number} like '${_params.custpage_account}%' then '1' else '0' end`,
                operator: "equalto",
                values: "1"
            }));
            
            if (libFunc.isContainValue(_params.custpage_fromdt))
                myFilters.push(search.createFilter({
                    name: 'trandate',
                    operator: search.Operator.ONORAFTER,
                    values: _params.custpage_fromdt
                }));
            if (libFunc.isContainValue(_params.custpage_todt))
                myFilters.push(search.createFilter({
                    name: 'trandate',
                    operator: search.Operator.ONORBEFORE,
                    values: _params.custpage_todt
                }));
            
            resultSearch = resultSearch.runPaged({pageSize: 1000});
            for (let i = 0; i < resultSearch.pageRanges.length; i++) {
                let currentPage = resultSearch.fetch({index: i}).data;
                for (let idx in currentPage) {
                    let obj = {};
                    obj.id = currentPage[idx].id;
                    obj.type_id = currentPage[idx].getValue(myColumns[0]);
                    obj.type_nm = currentPage[idx].getText(myColumns[0]);
                    obj.doc_num = currentPage[idx].getValue(myColumns[1]);
                    obj.date = currentPage[idx].getValue(myColumns[2]);
                    obj.account_code = currentPage[idx].getValue(myColumns[3]);
                    obj.account_nm = currentPage[idx].getValue(myColumns[4]);
                    obj.memo = currentPage[idx].getValue(myColumns[5]);
                    obj.debit_amt = (currentPage[idx].getValue(myColumns[6]));
                    obj.credit_amt = (currentPage[idx].getValue(myColumns[7]));
                    obj.entity_id = (currentPage[idx].getValue(myColumns[8]));
                    obj.entity_nm = (currentPage[idx].getText(myColumns[8]));
                    obj.field_compare = (currentPage[idx].getValue(myColumns[9]));
                    obj.line_id = Number(currentPage[idx].getValue(myColumns[10]));
                    arrResult.push(obj);
                }
            }
            return arrResult;
        }
        
        const getDataContraDeprCredit = (_params) => {
            let arrResult = [];
            let resultSearch = search.load(SAVED_SEARCH.CONTRA_DEPR_CREDIT);
            let myColumns = resultSearch.columns;
            let myFilters = resultSearch.filters;
            if (libFunc.isContainValue(_params.custpage_subsidiary)) {
                myFilters.push(search.createFilter({
                    name: "subsidiary",
                    operator: "anyof",
                    values: _params.custpage_subsidiary.split(",")
                }));
            }
            if (libFunc.isContainValue(_params.custpage_contraaccount)) {
                myFilters.push(search.createFilter({
                    name: "formulanumeric",
                    formula: `case when {account.number} like '${_params.custpage_contraaccount}%' then '1' else '0' end`,
                    operator: "equalto",
                    values: "1"
                }));
            }
            
            if (libFunc.isContainValue(_params.custpage_fromdt)) {
                myFilters.push(search.createFilter({
                    name: 'trandate',
                    operator: search.Operator.ONORAFTER,
                    values: _params.custpage_fromdt
                }));
            }
            if (libFunc.isContainValue(_params.custpage_todt)) {
                myFilters.push(search.createFilter({
                    name: 'trandate',
                    operator: search.Operator.ONORBEFORE,
                    values: _params.custpage_todt
                }));
            }
            
            resultSearch = resultSearch.runPaged({pageSize: 1000});
            for (let i = 0; i < resultSearch.pageRanges.length; i++) {
                let currentPage = resultSearch.fetch({index: i}).data;
                for (let idx in currentPage) {
                    let obj = {};
                    obj.id = currentPage[idx].getValue(myColumns[0]);
                    obj.trans_num = currentPage[idx].getValue(myColumns[1]);
                    obj.memo = currentPage[idx].getValue(myColumns[2]);
                    obj.tk_doi_ung = currentPage[idx].getValue(myColumns[3]);
                    arrResult.push(obj);
                }
            }
            return arrResult;
        }
        
        const getDataContraDeprDebit = (_params) => {
            let arrResult = [];
            let resultSearch = search.load(SAVED_SEARCH.CONTRA_DEPR_DEBIT);
            let myColumns = resultSearch.columns;
            let myFilters = resultSearch.filters;
            if (libFunc.isContainValue(_params.custpage_subsidiary)) {
                myFilters.push(search.createFilter({
                    name: "subsidiary",
                    operator: "anyof",
                    values: _params.custpage_subsidiary.split(",")
                }));
            }
            
            if (libFunc.isContainValue(_params.custpage_contraaccount)) {
                myFilters.push(search.createFilter({
                    name: "formulanumeric",
                    formula: `case when {account.number} like '${_params.custpage_contraaccount}%' then '1' else '0' end`,
                    operator: "equalto",
                    values: "1"
                }));
            }
            if (libFunc.isContainValue(_params.custpage_fromdt)) {
                myFilters.push(search.createFilter({
                    name: 'trandate',
                    operator: search.Operator.ONORAFTER,
                    values: _params.custpage_fromdt
                }));
            }
            if (libFunc.isContainValue(_params.custpage_todt)) {
                myFilters.push(search.createFilter({
                    name: 'trandate',
                    operator: search.Operator.ONORBEFORE,
                    values: _params.custpage_todt
                }));
            }
            
            resultSearch = resultSearch.runPaged({pageSize: 1000});
            for (let i = 0; i < resultSearch.pageRanges.length; i++) {
                let currentPage = resultSearch.fetch({index: i}).data;
                for (let idx in currentPage) {
                    let obj = {};
                    obj.id = currentPage[idx].getValue(myColumns[0]);
                    obj.trans_num = currentPage[idx].getValue(myColumns[1]);
                    obj.memo = currentPage[idx].getValue(myColumns[2]);
                    obj.tk_doi_ung = currentPage[idx].getValue(myColumns[3]);
                    arrResult.push(obj);
                }
            }
            return arrResult;
        }
        
        const getDataContraAmoCredit = (_params) => {
            let arrResult = [];
            let resultSearch = search.load(SAVED_SEARCH.CONTRA_ACC_AMO_CREDIT);
            let myColumns = resultSearch.columns;
            let myFilters = resultSearch.filters;
            if (libFunc.isContainValue(_params.custpage_subsidiary)) {
                myFilters.push(search.createFilter({
                    name: "subsidiary",
                    operator: "anyof",
                    values: _params.custpage_subsidiary.split(",")
                }));
            }
            if (libFunc.isContainValue(_params.custpage_contraaccount)) {
                myFilters.push(search.createFilter({
                    name: "formulanumeric",
                    formula: `case when {account.number} like '${_params.custpage_contraaccount}%' then '1' else '0' end`,
                    operator: "equalto",
                    values: "1"
                }));
            }
            if (libFunc.isContainValue(_params.custpage_fromdt)) {
                myFilters.push(search.createFilter({
                    name: 'trandate',
                    operator: search.Operator.ONORAFTER,
                    values: _params.custpage_fromdt
                }));
            }
            if (libFunc.isContainValue(_params.custpage_todt)) {
                myFilters.push(search.createFilter({
                    name: 'trandate',
                    operator: search.Operator.ONORBEFORE,
                    values: _params.custpage_todt
                }));
            }
            
            resultSearch = resultSearch.runPaged({pageSize: 1000});
            for (let i = 0; i < resultSearch.pageRanges.length; i++) {
                let currentPage = resultSearch.fetch({index: i}).data;
                for (let idx in currentPage) {
                    let obj = {};
                    obj.id = currentPage[idx].id;
                    obj.doc_num = currentPage[idx].getValue(myColumns[0]);
                    obj.type_id = currentPage[idx].getValue(myColumns[1]);
                    obj.type_nm = currentPage[idx].getText(myColumns[1]);
                    obj.line_id = Number(currentPage[idx].getValue(myColumns[2]));
                    obj.field_compare = currentPage[idx].getValue(myColumns[3]);
                    obj.tk_doi_ung = currentPage[idx].getValue(myColumns[4]);
                    arrResult.push(obj);
                }
            }
            return arrResult;
        }
        
        const getDataContraAmoDebit = (_params) => {
            let arrResult = [];
            let resultSearch = search.load(SAVED_SEARCH.CONTRA_ACC_AMO_DEBIT);
            let myColumns = resultSearch.columns;
            let myFilters = resultSearch.filters;
            if (libFunc.isContainValue(_params.custpage_subsidiary)) {
                myFilters.push(search.createFilter({
                    name: "subsidiary",
                    operator: "anyof",
                    values: _params.custpage_subsidiary.split(",")
                }));
            }
            
            
            if (libFunc.isContainValue(_params.custpage_contraaccount)) {
                myFilters.push(search.createFilter({
                    name: "formulanumeric",
                    formula: `case when {account.number} like '${_params.custpage_contraaccount}%' then '1' else '0' end`,
                    operator: "equalto",
                    values: "1"
                }));
            }
            if (libFunc.isContainValue(_params.custpage_fromdt)) {
                myFilters.push(search.createFilter({
                    name: 'trandate',
                    operator: search.Operator.ONORAFTER,
                    values: _params.custpage_fromdt
                }));
            }
            if (libFunc.isContainValue(_params.custpage_todt)) {
                myFilters.push(search.createFilter({
                    name: 'trandate',
                    operator: search.Operator.ONORBEFORE,
                    values: _params.custpage_todt
                }));
            }
            
            resultSearch = resultSearch.runPaged({pageSize: 1000});
            for (let i = 0; i < resultSearch.pageRanges.length; i++) {
                let currentPage = resultSearch.fetch({index: i}).data;
                for (let idx in currentPage) {
                    let obj = {};
                    obj.id = currentPage[idx].id;
                    obj.doc_num = currentPage[idx].getValue(myColumns[0]);
                    obj.type_id = currentPage[idx].getValue(myColumns[1]);
                    obj.type_nm = currentPage[idx].getText(myColumns[1]);
                    obj.line_id = Number(currentPage[idx].getValue(myColumns[2]));
                    obj.field_compare = currentPage[idx].getValue(myColumns[3]);
                    obj.tk_doi_ung = currentPage[idx].getValue(myColumns[4]);
                    arrResult.push(obj);
                }
            }
            return arrResult;
        }
        
        const getDataContraCredit = (_params) => {
            let arrResult = [];
            let searchBkct = search.load(SAVED_SEARCH.CONTRA_CREDIT);
            let myColumns = searchBkct.columns;
            let myFilters = searchBkct.filters;
            if (libFunc.isContainValue(_params.custpage_subsidiary)) {
                myFilters.push(search.createFilter({
                    name: "subsidiary",
                    operator: "anyof",
                    values: _params.custpage_subsidiary.split(",")
                }));
            }
            
            if (libFunc.isContainValue(_params.custpage_contraaccount)) {
                myFilters.push(search.createFilter({
                    name: "formulanumeric",
                    formula: `case when {account.number} like '${_params.custpage_contraaccount}%' then '1' else '0' end`,
                    operator: "equalto",
                    values: "1"
                }));
            }
            
            if (libFunc.isContainValue(_params.custpage_contraaccount)) {
                myFilters.push(search.createFilter({
                    name: "formulanumeric",
                    formula: `case when {account.number} like '${_params.custpage_contraaccount}%' then '1' else '0' end`,
                    operator: "equalto",
                    values: "1"
                }));
            }
            // if(libFunc.isContainValue(_params.custpage_account)){
            //     myFilters.push(search.createFilter({
            //         name: "formulanumeric",
            //         formula: `case when {account.number} like '${_params.custpage_account}%' then '1' else '0' end`,
            //         operator: "equalto",
            //         values: "1"
            //     }));
            // }
            if (libFunc.isContainValue(_params.custpage_fromdt)) {
                myFilters.push(search.createFilter({
                    name: 'trandate',
                    operator: search.Operator.ONORAFTER,
                    values: _params.custpage_fromdt
                }));
            }
            if (libFunc.isContainValue(_params.custpage_todt)) {
                myFilters.push(search.createFilter({
                    name: 'trandate',
                    operator: search.Operator.ONORBEFORE,
                    values: _params.custpage_todt
                }));
            }
            
            let pgSize = 600;
            let rsBkct = searchBkct.runPaged({pageSize: pgSize});
            let numPage = rsBkct.pageRanges.length;
            rsBkct = searchBkct.run();
            for (let i = 0; i < numPage; i++) {
                let currentPage = rsBkct.getRange(i * pgSize, (i + 1) * pgSize);
                for (let idx = 0; idx < currentPage.length; idx++) {
                    let obj = {};
                    obj.id = currentPage[idx].getValue(myColumns[0]);
                    obj.type_id = currentPage[idx].getValue(myColumns[1]);
                    obj.type_nm = currentPage[idx].getText(myColumns[1]);
                    obj.doc_num = (currentPage[idx].getValue(myColumns[2]));
                    obj.tk_doi_ung = currentPage[idx].getValue(myColumns[3]);
                    arrResult.push(obj);
                }
            }
            return arrResult;
        }
        
        const getDataContraDebit = (_params) => {
            let arrResult = [];
            let searchBkct = search.load(SAVED_SEARCH.CONTRA_DEBIT);
            let myColumns = searchBkct.columns;
            let myFilters = searchBkct.filters;
            if (libFunc.isContainValue(_params.custpage_subsidiary)) {
                myFilters.push(search.createFilter({
                    name: "subsidiary",
                    operator: "anyof",
                    values: _params.custpage_subsidiary.split(",")
                }));
            }
            
            if (libFunc.isContainValue(_params.custpage_contraaccount)) {
                myFilters.push(search.createFilter({
                    name: "formulanumeric",
                    formula: `case when {account.number} like '${_params.custpage_contraaccount}%' then '1' else '0' end`,
                    operator: "equalto",
                    values: "1"
                }));
            }
            if (libFunc.isContainValue(_params.custpage_fromdt)) {
                myFilters.push(search.createFilter({
                    name: 'trandate',
                    operator: search.Operator.ONORAFTER,
                    values: _params.custpage_fromdt
                }));
            }
            if (libFunc.isContainValue(_params.custpage_todt)) {
                myFilters.push(search.createFilter({
                    name: 'trandate',
                    operator: search.Operator.ONORBEFORE,
                    values: _params.custpage_todt
                }));
            }
            
            let pgSize = 600;
            let rsBkct = searchBkct.runPaged({pageSize: pgSize});
            let numPage = rsBkct.pageRanges.length;
            rsBkct = searchBkct.run();
            for (let i = 0; i < numPage; i++) {
                let currentPage = rsBkct.getRange(i * pgSize, (i + 1) * pgSize);
                for (let idx = 0; idx < currentPage.length; idx++) {
                    let obj = {};
                    obj.id = currentPage[idx].getValue(myColumns[0]);
                    obj.type_id = currentPage[idx].getValue(myColumns[1]);
                    obj.type_nm = currentPage[idx].getText(myColumns[1]);
                    obj.doc_num = (currentPage[idx].getValue(myColumns[2]));
                    obj.tk_doi_ung = currentPage[idx].getValue(myColumns[3]);
                    arrResult.push(obj);
                }
            }
            return arrResult;
        }
        
        const getDataContraWodDebit = (_params) => {
            let arrResult = [];
            let resultSearch = search.load(SAVED_SEARCH.CONTRA_WOD_DEBIT);
            let myColumns = resultSearch.columns;
            let myFilters = resultSearch.filters;
            if (libFunc.isContainValue(_params.custpage_subsidiary)) {
                myFilters.push(search.createFilter({
                    name: "subsidiary",
                    operator: "anyof",
                    values: _params.custpage_subsidiary.split(",")
                }));
            }
            
            if (libFunc.isContainValue(_params.custpage_contraaccount)) {
                myFilters.push(search.createFilter({
                    name: "formulanumeric",
                    formula: `case when {account.number} like '${_params.custpage_contraaccount}%' then '1' else '0' end`,
                    operator: "equalto",
                    values: "1"
                }));
            }
            if (libFunc.isContainValue(_params.custpage_fromdt)) {
                myFilters.push(search.createFilter({
                    name: 'trandate',
                    operator: search.Operator.ONORAFTER,
                    values: _params.custpage_fromdt
                }));
            }
            if (libFunc.isContainValue(_params.custpage_todt)) {
                myFilters.push(search.createFilter({
                    name: 'trandate',
                    operator: search.Operator.ONORBEFORE,
                    values: _params.custpage_todt
                }));
            }
            
            resultSearch = resultSearch.runPaged({pageSize: 1000});
            for (let i = 0; i < resultSearch.pageRanges.length; i++) {
                let currentPage = resultSearch.fetch({index: i}).data;
                for (let idx in currentPage) {
                    let obj = {};
                    obj.id = currentPage[idx].id;
                    obj.doc_num = currentPage[idx].getValue(myColumns[0]);
                    obj.type_id = currentPage[idx].getValue(myColumns[1]);
                    obj.type_nm = currentPage[idx].getText(myColumns[1]);
                    obj.line_id = Number(currentPage[idx].getValue(myColumns[2]));
                    obj.field_compare = currentPage[idx].getValue(myColumns[3]);
                    obj.tk_doi_ung = currentPage[idx].getValue(myColumns[4]);
                    arrResult.push(obj);
                }
            }
            return arrResult;
        }
        
        const getDataContraWodCredit = (_params) => {
            let arrResult = [];
            let resultSearch = search.load(SAVED_SEARCH.CONTRA_WOD_CREDIT);
            let myColumns = resultSearch.columns;
            let myFilters = resultSearch.filters;
            if (libFunc.isContainValue(_params.custpage_subsidiary)) {
                myFilters.push(search.createFilter({
                    name: "subsidiary",
                    operator: "anyof",
                    values: _params.custpage_subsidiary.split(",")
                }));
            }
            
            if (libFunc.isContainValue(_params.custpage_contraaccount)) {
                myFilters.push(search.createFilter({
                    name: "formulanumeric",
                    formula: `case when {account.number} like '${_params.custpage_contraaccount}%' then '1' else '0' end`,
                    operator: "equalto",
                    values: "1"
                }));
            }
            if (libFunc.isContainValue(_params.custpage_fromdt)) {
                myFilters.push(search.createFilter({
                    name: 'trandate',
                    operator: search.Operator.ONORAFTER,
                    values: _params.custpage_fromdt
                }));
            }
            if (libFunc.isContainValue(_params.custpage_todt)) {
                myFilters.push(search.createFilter({
                    name: 'trandate',
                    operator: search.Operator.ONORBEFORE,
                    values: _params.custpage_todt
                }));
            }
            
            resultSearch = resultSearch.runPaged({pageSize: 1000});
            for (let i = 0; i < resultSearch.pageRanges.length; i++) {
                let currentPage = resultSearch.fetch({index: i}).data;
                for (let idx in currentPage) {
                    let obj = {};
                    obj.id = currentPage[idx].id;
                    obj.doc_num = currentPage[idx].getValue(myColumns[0]);
                    obj.type_id = currentPage[idx].getValue(myColumns[1]);
                    obj.type_nm = currentPage[idx].getText(myColumns[1]);
                    obj.line_id = Number(currentPage[idx].getValue(myColumns[2]));
                    obj.field_compare = currentPage[idx].getValue(myColumns[3]);
                    obj.tk_doi_ung = currentPage[idx].getValue(myColumns[4]);
                    arrResult.push(obj);
                }
            }
            return arrResult;
        }
        
        const onExportFile = (context) => {
            let request = context.request;
            let response = context.response;
            let params = request.parameters;
            let objSub = getObjectSubsidiary(params.custpage_subsidiary.split(",")[0]);
            let searchResult = runFilterSS(params);
            let f, isInline = false;
            if (params.hasOwnProperty("isPrint") && params.isPrint === FLAG_RUN) {
                f = onExportPdf(searchResult, objSub, params);
                isInline = true;
                response.writeFile(f, isInline);
            } else {
                onExportExcel(context, searchResult, objSub, params);
            }
        }
        
        
        const esXml = (str) => {
            return xml.escape(str);
        }
        
        const changeCurrency = (number, range = 0) => {
            if (libFunc.isContainValue(number)) {
                let parts = (+number).toFixed(range).split(".");
                parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                if (parts[1] !== '00') {
                    return parts.join(".");
                } else {
                    return parts[0];
                }
            }
            return 0;
        }
        
        const onExportPdf = (searchResult, objSub, params) => {
            let pRowData = "";
            let lengthResult = searchResult.length;
            for (let i = 0; i < lengthResult; i++) {
                const pData = searchResult[i];
                pRowData += `
                <tr>
                <td><p text-align = "center">${i + 1}</p></td>
                <td><p>${pData.type_nm}</p></td>
                <td><p>${pData.doc_num}</p></td>
                <td><p text-align = "center">${pData.date}</p></td>
                <td><p>${esXml(pData.account_code)}</p></td>
                <td><p>${pData.account_nm}</p></td>
                <td><p>${pData.tk_doi_ung.replace(/<br>/gi, ", ")}</p></td>
                <td><p>${esXml(pData.entity_nm)}</p></td>
                <td><p>${esXml(pData.memo)}</p></td>
                <td><p text-align = "right">${changeCurrency(pData.debit_amt)}</p></td>
                <td><p text-align = "right">${changeCurrency(pData.credit_amt)}</p></td>
                </tr>
                `;
            }
            let templatePath = '../xml/pdf/scv_render_rp_bkct_pdf.xml';
            // let namefile = 'Bảng kê chứng từ kế toán.pdf';
            let fileObject = file.load({id: templatePath});
            log.error({fileObject: fileObject});
            let content = fileObject.getContents();
            content = content.replace(/{pSubsidiary}/gi, objSub.sub_nm)
                .replace(/{pAddress}/gi, objSub.address)
                .replace(/{pFromDT}/gi, params.custpage_fromdt)
                .replace(/{pToDT}/gi, params.custpage_todt)
                .replace(/{pBodyTable}/gi, pRowData)
            
            
            return render.xmlToPdf({xmlString: content});
        }
        
        const onExportExcel = (context, searchResult, objSub, params) => {
            let pRowData = "";
            for (let i = 0; i < searchResult.length; i++) {
                pRowData += '<Row ss:AutoFitHeight="0">\n' +
                    '    <Cell ss:StyleID="s131"><Data ss:Type="Number">' + (i + 1) + '</Data></Cell>\n' +
                    '    <Cell ss:StyleID="s132"><Data ss:Type="String">' + searchResult[i].type_nm + '</Data></Cell>\n' +
                    '    <Cell ss:StyleID="s133"><Data ss:Type="String">' + searchResult[i].doc_num + '</Data></Cell>\n' +
                    '    <Cell ss:StyleID="s134"><Data ss:Type="String" x:Ticked="1">' + searchResult[i].date + '</Data></Cell>\n' +
                    '    <Cell ss:StyleID="s133"><Data ss:Type="String">' + searchResult[i].account_code + '</Data></Cell>\n' +
                    '    <Cell ss:StyleID="s133"><Data ss:Type="String">' + searchResult[i].account_nm + '</Data></Cell>\n' +
                    '    <Cell ss:StyleID="s133"><Data ss:Type="String">' + (searchResult[i].tk_doi_ung).replace(/<br>/gi, ", ") + '</Data></Cell>\n' +
                    '    <Cell ss:StyleID="s133"><Data ss:Type="String">' + searchResult[i].entity_nm + '</Data></Cell>\n' +
                    '    <Cell ss:StyleID="s133"><Data ss:Type="String">' + searchResult[i].memo + '</Data></Cell>\n' +
                    '    <Cell ss:StyleID="s135"><Data ss:Type="Number">' + (searchResult[i].debit_amt || 0) + '</Data></Cell>\n' +
                    '    <Cell ss:StyleID="s135"><Data ss:Type="Number">' + (searchResult[i].credit_amt || 0) + '</Data></Cell>\n' +
                    '   </Row>\n';
            }
            let templatePath = '../xml/bangke/scv_bkct.xml';
            let namefile = 'Bảng kê chứng từ kế toán.xls';
            let fileObject = file.load({id: templatePath});
            let content = fileObject.getContents();
            content = content.replace(/{pExpandRow}/gi, (8 + searchResult.length));
            content = content.replace(/{pSubsidiary}/gi, objSub.sub_nm);
            content = content.replace(/{pAddress}/gi, objSub.address);
            content = content.replace(/{pFromDT}/gi, params.custpage_fromdt);
            content = content.replace(/{pToDT}/gi, params.custpage_todt);
            content = content.replace(/{pRowData}/gi, pRowData);
            
            libRep.downloadFile(context, namefile, content);
            /*return file.create({
                name: namefile,
                fileType: file.Type.XMLDOC,
                contents: content,
                encoding: file.Encoding.UTF8,
            });*/
        }
        
        const getObjectSubsidiary = (_subID) => {
            let lkSub = search.lookupFields({
                type: search.Type.SUBSIDIARY,
                id: _subID,
                columns: ['legalname', 'address.address']
            });
            return {
                sub_nm: lkSub.legalname,
                address: lkSub['address.address']
            }
        }
        
        const getFromDate = (_fromdt) => {
            if (libFunc.isContainValue(_fromdt)) {
                return _fromdt
            }
            let d = new Date();
            return new Date(d.getFullYear(), d.getMonth(), "01");
        }
        
        const getToDate = (_todt) => {
            if (libFunc.isContainValue(_todt)) {
                return _todt
            }
            return new Date();
        }
        
        const setRowDataSublist = (_sublist, _line, _field, _data) => {
            for (let i = 0; i < _field.length; i++) {
                addValueColField(_sublist, _field[i], _line, _data[i]);
            }
        }
        
        const addValueColField = (sublist, id, line, value) => {
            if (libFunc.isContainValue(value)) {
                sublist.setSublistValue({
                    id: id,
                    line: line,
                    value: value
                });
            }
        }
        
        const addFieldGroup = (_form, _id, _label) => {
            let _obj = {id: _id, label: _label}
            _form.addFieldGroup(_obj);
            return _obj;
        }
        
        const addColFieldSublist = (_rsSL, _rownum, _objColumn) => {
            let col_field;
            if (libFunc.isContainValue(_objColumn.source)) {
                col_field = _rsSL.addField({
                    id: "custpage_col_" + _rownum,
                    type: _objColumn.type,
                    source: _objColumn.source,
                    label: _objColumn.label
                });
            } else {
                col_field = _rsSL.addField({
                    id: "custpage_col_" + _rownum,
                    type: _objColumn.type,
                    label: _objColumn.label
                });
            }
            col_field.updateDisplayType({displayType: _objColumn.displayType || "inline"});
            return col_field;
        }
        
        return {onRequest}
        
    });
