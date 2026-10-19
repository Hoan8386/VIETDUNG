/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/redirect', 'N/runtime', 'N/search', 'N/ui/message', 'N/ui/serverWidget',
        '../lib/scv_lib_report.js'
    ],
    
    (record, redirect, runtime, search, message, serverWidget, libRep) => {
        
        /**
         * Definition of the Suitelet script trigger point.
         *
         * @param {Object} context
         * @param {ServerRequest} context.request - Encapsulation of the incoming request
         * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
         * @Since 2015.2
         */
        const onRequest = (context) => {
            let request = context.request;
            let response = context.response;
            let parameters = request.parameters;
            let subsidiary = parameters.custpage_subsidiary;
            let fromdate = parameters.custpage_fromdate;
            
            let isRun = true;
            if (!parameters.custpage_tokhaihaiquan) {
                isRun = false;
            }
            if (!subsidiary) {
                let userObj = runtime.getCurrentUser();
                subsidiary = userObj.subsidiary;
            } else if (typeof subsidiary === 'string') {
                subsidiary = subsidiary.split(',');
            }
            
            let mdata = getSublistColMaster();
            let sl_itr = mdata.sl_itr;
            let col_bill = mdata.col_bill;
            let col_itr = mdata.col_itr;
            
            if (request.method === 'GET') {
                let {form} = createForm(parameters);
                let {sublist_bill, sublist_itr} = crateSublistList(form, mdata);
                
                if (isRun) {
                    let ssid_bill = 'customsearch_scv_bill_landed_cost';
                    let ssid_itr = 'customsearch_scv_itr_landed_cost';
                    let list_bill = [], filters_bill = [];
                    let list_itr = [], filters_itr = [];
                    pushFilter(filters_bill, parameters);
                    pushFilter(filters_itr, parameters);
                    libRep.doSearchSS(ssid_bill, 1000, list_bill, filters_bill, mdata.col_bill_ss);
                    let line_itr = libRep.doSearchSS(ssid_itr, 1000, list_itr, filters_itr, mdata.col_itr_ss);
                    setSublistValue(sublist_bill, 0, col_bill, list_bill);
                    setSublistValue(sublist_itr, 0, col_itr, list_itr, true);
                    
                    if (line_itr > 0) {
                        form.addSubmitButton({label: 'Do Allocate'});
                    }
                }
                response.writePage(form);
            } else {
                let lc = request.getLineCount({group: sl_itr});
                let internalid, internalid_pre = '', select, line = 0, chiphi_muahang_trongnuoc, chiphi_muahang_quocte,
                    total_mhtn = 0, total_mhqt = 0;
                let exchangerate, currency_text;
                let recUp = null, slIt = 'item';
                let list_cost = [];
                let columns_cost = ['internalid', 'name'];
                let fields_cost = ['internalid', 'name'];
                let filters_cost = [search.createFilter({name: 'isinactive', operator: 'is', values: false})];
                libRep.doSearch('costcategory', list_cost, columns_cost, fields_cost, filters_cost);
                let costid_mhqt = null, costid_mhtn = null, temp, costid_tnk = null;
                for (let i in list_cost) {
                    temp = list_cost[i].name.substring(0, 2);
                    if (temp === '01') {
                        costid_mhqt = list_cost[i].internalid;
                    } else if (temp === '02') {
                        costid_mhtn = list_cost[i].internalid;
                    } /*else if (temp === '03') {
                        costid_tnk = list_cost[i].internalid;
                    }*/
                }
                
                for (let i = 0; i < lc; i++) {
                    internalid = request.getSublistValue({group: sl_itr, name: 'internalid', line: i});
                    select = request.getSublistValue({group: sl_itr, name: 'custpage_sl_select', line: i});
                    if (select === 'T') {
                        exchangerate = request.getSublistValue({group: sl_itr, name: 'exchangerate_hidden', line: i});
                        currency_text = request.getSublistValue({group: sl_itr, name: 'currency_text', line: i});
                        if (currency_text === 'VND') {
                            exchangerate = 1;
                        }
                        chiphi_muahang_trongnuoc = request.getSublistValue({
                            group: sl_itr,
                            name: 'cpmhtn_noexvnd',
                            line: i
                        }) * 1;
                        chiphi_muahang_quocte = request.getSublistValue({
                            group: sl_itr,
                            name: 'cpmhqt_noexvnd',
                            line: i
                        }) * 1;
                        if (internalid !== internalid_pre) {
                            if (recUp && line > 0) {
                                recUp.setValue('custbody_scv_itr_expense', total_mhtn);
                                recUp.setValue('custbody_scv_inb_before_declaration', total_mhqt);
                                recUp.save();//log.error('save last', 'save in');
                            }
                            recUp = record.load({type: 'itemreceipt', id: internalid, isDynamic: true});
                            line = 0;
                            total_mhtn = 0;
                            total_mhqt = 0;
                        }
                        total_mhtn = total_mhtn + chiphi_muahang_trongnuoc;
                        total_mhqt = total_mhqt + chiphi_muahang_quocte;
                        line = updateLine(request, recUp, slIt, line, sl_itr, i, chiphi_muahang_trongnuoc, chiphi_muahang_quocte, costid_mhqt, costid_mhtn, costid_tnk);
                        internalid_pre = internalid;
                    }
                }
                //log.error('recUp', recUp);log.error('line', line);
                if (recUp && line > 0) {
                    recUp.setValue('custbody_scv_itr_expense', total_mhtn);
                    recUp.setValue('custbody_scv_inb_before_declaration', total_mhqt);
                    recUp.save();
                }
                
                redirect.toSuitelet({
                    scriptId: 'customscript_scv_sl_allocate_pur_cost',
                    deploymentId: 'customdeploy_scv_sl_allocate_pur_cost',
                    parameters: {
                        custpage_subsidiary: subsidiary,
                        custpage_fromdate: fromdate,
                        custpage_tokhaihaiquan: parameters.custpage_tokhaihaiquan,
                        messageInfo: 'Do Allocate thành công!'
                    }
                });
            }
        }
        
        const setSublistValue = (sublist, lineStart, col, listData, isSetTotal = false) => {
            let line = lineStart;
            let objTotal = getInitObjItrLineTotal();
            for (let objData of listData) {
                plushToTotal(objTotal, objData);
                sublist.setSublistValue({id: 'stt', line: line, value: (line + 1).toFixed(0)});
                setSublistValueLine(sublist, line, col, objData);
                line++;
            }
            
            if (isSetTotal) {
                toFixTotal(objTotal);
                setSublistValueLine(sublist, line, col, objTotal);
            }
        }
        
        const setSublistValueLine = (sublist, line, col, objData) => {
            let lengthCol = col.length;
            for (let j = 0; j < lengthCol; j++) {
                let tempcol = col[j].id;
                let tempValue = objData[tempcol];
                if (tempValue || tempValue === 0) {
                    if (tempcol === 'exchangerate_hidden') {
                        tempValue = tempValue * 1;
                    }
                    sublist.setSublistValue({id: tempcol, line: line, value: tempValue});
                }
            }
        }
        
        const fieldIdTotals = ['quantity', 'fxamount', 'amount', 'amount_hidden', 'chiphi_muahang_quocte', 'chiphi_muahang_trongnuoc', 'cpmhqt_noexvnd', 'cpmhtn_noexvnd'];
        const plushToTotal = (objTotal, objLine) => {
            fieldIdTotals.forEach((fieldId) => {
                objTotal[fieldId] += Number(objLine[fieldId] || 0);
            });
        }
        
        const toFixTotal = (objTotal) => {
            objTotal.fxamount = objTotal.fxamount.toFixed(2);
            objTotal.amount = objTotal.amount.toFixed(2);
            objTotal.amount_hidden = objTotal.amount_hidden.toFixed(2);
            objTotal.chiphi_muahang_quocte = objTotal.chiphi_muahang_quocte.toFixed(2);
            objTotal.chiphi_muahang_trongnuoc = objTotal.chiphi_muahang_trongnuoc.toFixed(2);
            objTotal.cpmhqt_noexvnd = objTotal.cpmhqt_noexvnd.toFixed(0);
            objTotal.cpmhtn_noexvnd = objTotal.cpmhtn_noexvnd.toFixed(0);
            return objTotal;
        }
        
        const getInitObjItrLineTotal = () => {
            return {
                tokhaihaiquan: 'Tổng cộng',
                quantity: 0,
                fxamount: 0,
                amount: 0,
                amount_hidden: 0,
                chiphi_muahang_quocte: 0,
                chiphi_muahang_trongnuoc: 0,
                cpmhqt_noexvnd: 0,
                cpmhtn_noexvnd: 0
            };
        }
        
        const pushFilter = (filters, parameters) => {
            filters.push(search.createFilter({
                name: 'formulatext', operator: search.Operator.IS, values: parameters.custpage_tokhaihaiquan
                , formula: "nvl({custcolscv_bill_custom_no},{custbody_scv_itr_custom_no})"
            }));
        }
        
        const createForm = (parameters) => {
            let title = 'Allocate Purchasing Cost';
            let form = serverWidget.createForm({
                title: title
            });
            if (parameters.messageInfo) {
                form.addPageInitMessage({
                    type: message.Type.INFORMATION,
                    message: parameters.messageInfo,
                    duration: -1
                });
            }
            form.clientScriptModulePath = '../cs/scv_cs_sl_allocate_pur_cost.js';
            form.addButton({id: 'custpage_bt_search', label: 'Search', functionName: 'searchReport()'});
            form.addButton({id: 'custpage_bt_itr_allocate', label: 'Allocate', functionName: 'allocate()'});
            
            addFieldSearch(form, parameters.custpage_tokhaihaiquan);
            return {form}
        }
        
        const crateSublistList = (form, mdata) => {
            let sl_bill = mdata.sl_bill;
            let sl_itr = mdata.sl_itr;
            let col_bill = mdata.col_bill;
            let col_itr = mdata.col_itr;
            
            let sublist_bill = form.addSublist({
                id: sl_bill,
                type: serverWidget.SublistType.LIST,
                label: 'Chứng từ chi phí'
            });
            sublist_bill.addButton({
                id: 'custpage_bt_bill_markall',
                label: 'Mark All',
                functionName: 'markAll()'
            });
            sublist_bill.addButton({
                id: 'custpage_bt_bill_unmarkall',
                label: 'Unmark All',
                functionName: 'unmarkAll()'
            });
            libRep.addFieldLineColList(sublist_bill, col_bill);
            //sublist_bill.addMarkAllButtons();
            let sublist_itr = form.addSublist({
                id: sl_itr,
                type: serverWidget.SublistType.LIST,
                label: 'Chứng từ nhập kho'
            });
            libRep.addFieldLineColList(sublist_itr, col_itr);
            //sublist_itr.addMarkAllButtons();
            sublist_itr.addButton({
                id: 'custpage_bt_itr_markall',
                label: 'Mark All',
                functionName: 'markAllItr()'
            });
            sublist_itr.addButton({
                id: 'custpage_bt_itr_unmarkall',
                label: 'Unmark All',
                functionName: 'unmarkAllItr()'
            });
            sublist_itr.addButton({
                id: 'custpage_bt_itr_recaltotal',
                label: 'Recalculate Total',
                functionName: 'recalTotalItr()'
            });
            
            return {sublist_bill, sublist_itr};
        }
        
        const updateLine = (request, recUp, slIt, line, sl_itr, i, chiphi_muahang_trongnuoc, chiphi_muahang_quocte, costid_mhqt, costid_mhtn, costid_tnk) => {
            let lineid = request.getSublistValue({group: sl_itr, name: 'lineid', line: i});
            let taxrateinb = request.getSublistValue({group: sl_itr, name: 'taxrateinb', line: i}) || 0;
            if (!!taxrateinb) {
                taxrateinb = taxrateinb.replace('%', '');
            }
            let exchangerate = request.getSublistValue({group: sl_itr, name: 'exchangerate_hidden', line: i});
            let lcIt = recUp.getLineCount(slIt);
            let recLdc, lineit, tracklandedcost, quantity, importtax_code, inb_ttdb, inb_cbpg, inb_bvmt;
            let inb_amt_vnd, custom_amt, import_tax_amt, ttdb_amt, cbpg_amt, bvmt_amt, tax_amt;
            let slLine = 'landedcostdata';
            let custom_exchange_rate = recUp.getValue('custbody_scv_inb_cus_exr');
            if (isNaN(custom_exchange_rate)) {
                custom_exchange_rate = 1;
            }
            
            for (let j = 0; j < lcIt; j++) {
                lineit = recUp.getSublistValue({sublistId: slIt, fieldId: 'line', line: j});
                tracklandedcost = recUp.getSublistValue({sublistId: slIt, fieldId: 'tracklandedcost', line: j});//landedcostset
                if ((tracklandedcost === true || tracklandedcost === 'T') && lineid === lineit) {
                    recUp.selectLine({sublistId: slIt, line: j});
                    quantity = recUp.getCurrentSublistValue({sublistId: slIt, fieldId: 'quantity'});
                    importtax_code = recUp.getCurrentSublistValue({
                        sublistId: slIt,
                        fieldId: 'custcol_scv_inb_importtax_code'
                    }) || 0;
                    inb_ttdb = recUp.getCurrentSublistValue({sublistId: slIt, fieldId: 'custcol_scv_inb_ttdb'}) || 0;
                    inb_cbpg = recUp.getCurrentSublistValue({sublistId: slIt, fieldId: 'custcol_scv_inb_cbpg'}) || 0;
                    inb_bvmt = recUp.getCurrentSublistValue({sublistId: slIt, fieldId: 'custcol_scv_inb_bvmt'}) || 0;
                    
                    inb_amt_vnd = quantity * recUp.getCurrentSublistValue({
                        sublistId: slIt,
                        fieldId: 'rate'
                    }) * custom_exchange_rate;
                    //inb_amt_vnd = Math.round(inb_amt_vnd);
                    custom_amt = chiphi_muahang_quocte + inb_amt_vnd;
                    import_tax_amt = custom_amt * importtax_code / 100;
                    ttdb_amt = (custom_amt + import_tax_amt) * inb_ttdb / 100;
                    cbpg_amt = (custom_amt + import_tax_amt + ttdb_amt) * inb_cbpg / 100;
                    bvmt_amt = quantity * inb_bvmt;
                    tax_amt = (custom_amt + import_tax_amt + ttdb_amt + cbpg_amt + bvmt_amt) * taxrateinb / 100;
                    
                    recUp.setCurrentSublistValue({
                        sublistId: slIt,
                        fieldId: 'custcol_scv_itr_expense',
                        value: chiphi_muahang_trongnuoc
                    });
                    recUp.setCurrentSublistValue({
                        sublistId: slIt,
                        fieldId: 'custcol_scv_inb_expense',
                        value: chiphi_muahang_quocte
                    });
                    
                    recLdc = recUp.getCurrentSublistSubrecord({sublistId: slIt, fieldId: 'landedcost'});
                    if (recLdc) {
                        setLandedCost(request, recLdc, slLine, sl_itr, i, import_tax_amt / exchangerate, costid_mhqt, costid_mhtn, costid_tnk);
                    }
                    recUp.commitLine({sublistId: slIt});
                    line = lineid;
                }
            }
            
            return line;
        }
        
        const setLandedCost = (request, recLdc, slLine, sl_itr, i, import_tax_amt, costid_mhqt, costid_mhtn, costid_tnk) => {
            let chiphi_muahang_quocte = request.getSublistValue({
                group: sl_itr,
                name: 'chiphi_muahang_quocte',
                line: i
            });
            let chiphi_muahang_trongnuoc = request.getSublistValue({
                group: sl_itr,
                name: 'chiphi_muahang_trongnuoc',
                line: i
            });
            let lcLine = recLdc.getLineCount(slLine);
            lcLine = setLineLdc(recLdc, lcLine, slLine, costid_mhqt, chiphi_muahang_quocte);
            lcLine = setLineLdc(recLdc, lcLine, slLine, costid_mhtn, chiphi_muahang_trongnuoc);
            if (costid_tnk) {
                setLineLdc(recLdc, lcLine, slLine, costid_tnk, import_tax_amt); //Bo tinh thu nhap khau
            }
        }
        
        const setLineLdc = (recLdc, lcLine, slLine, costcategory, amount) => {
            let lineup = -1, costcategory_line;
            for (let n = 0; n < lcLine; n++) {
                costcategory_line = recLdc.getSublistValue({sublistId: slLine, fieldId: 'costcategory', line: n});
                if (costcategory === costcategory_line) {
                    lineup = n;
                }
            }
            if (Number(amount) !== 0) {
                if (lineup === -1) {
                    recLdc.selectNewLine({sublistId: slLine});
                    recLdc.setCurrentSublistValue({sublistId: slLine, fieldId: 'costcategory', value: costcategory});
                    lcLine = lcLine + 1;
                } else {
                    recLdc.selectLine({sublistId: slLine, line: lineup});
                }
                recLdc.setCurrentSublistValue({sublistId: slLine, fieldId: 'amount', value: amount});
                recLdc.commitLine({sublistId: slLine});
            } else if (lineup !== -1) {
                recLdc.removeLine({sublistId: slLine, line: lineup});
                lcLine = lcLine - 1;
            }
            return lcLine;
        }
        
        const addFieldSearch = (form, tokhaihaiquan) => {
            form.addFieldGroup({
                id: 'fieldgroup_dc_main',
                label: 'Criteria'
            });
            
            let custpage_tokhaihaiquan = form.addField({
                id: 'custpage_tokhaihaiquan', type: serverWidget.FieldType.TEXT,
                label: 'Tờ khai hải quan', container: 'fieldgroup_dc_main'
            });
            custpage_tokhaihaiquan.defaultValue = tokhaihaiquan;
            custpage_tokhaihaiquan.isMandatory = true;
            
            form.addFieldGroup({
                id: 'fieldgroup_ipvalues',
                label: 'Input Values'
            });
            
            form.addField({
                id: 'custpage_chiphimuahangquocte', type: serverWidget.FieldType.FLOAT,
                label: 'Chi phí mua hàng quốc tế (VND)', container: 'fieldgroup_ipvalues'
            });
            
            form.addField({
                id: 'custpage_chiphimuahangtrongnuoc', type: serverWidget.FieldType.FLOAT,
                label: 'Chi phí mua hàng trong nước (VND)', container: 'fieldgroup_ipvalues'
            });
        }
        
        const getSublistColMaster = () => {
            let sl_bill = 'custpage_sl_bill';
            let col_bill_ss = [['subsidiary_text', 0], ['tranid', 1], ['trandate', 2], ['currency_text', 3, 'sltext'],
                ['currency', 3], ['exchangerate', 4], ['fxamount', 5], ['amount', 6],
                ['costcateg', 7], ['tokhaihaiquan', 8], ['costcateg_id', 9], ['memo', 10]
            ];
            let col_bill = [
                {id: 'stt', label: 'STT', type: 'integer', display: 'disabled'},
                {id: 'custpage_sl_select', label: 'Select', type: 'checkbox'},
                {id: 'subsidiary_text', label: 'Subsidiary', type: 'text', display: 'disabled'},
                {id: 'subsidiary', label: 'Subsidiary', type: 'text', display: 'hidden'},
                {id: 'tranid', label: 'Document No', type: 'text', display: serverWidget.FieldDisplayType.INLINE},
                {id: 'trandate', label: 'Date', type: 'date', display: serverWidget.FieldDisplayType.INLINE},
                {id: 'currency_text', label: 'Currency', type: 'text', display: serverWidget.FieldDisplayType.INLINE},
                {id: 'currency', label: 'Currency', type: 'text', display: 'hidden'},
                {id: 'exchangerate', label: 'Exchange Rate', type: 'float', display: 'disabled'},
                {
                    id: 'fxamount',
                    label: 'Amount (Foreign)',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                },
                {id: 'amount', label: 'Amount', type: 'float', display: serverWidget.FieldDisplayType.INLINE},
                {id: 'costcateg', label: 'Cost Categ', type: 'text', display: serverWidget.FieldDisplayType.INLINE},
                {id: 'costcateg_id', label: 'Cost Categ ID', type: 'text', display: 'hidden'},
                {
                    id: 'tokhaihaiquan',
                    label: 'Số TK hải quan',
                    type: 'text',
                    display: serverWidget.FieldDisplayType.INLINE
                },
                {
                    id: 'memo',
                    label: 'Diễn giải',
                    type: 'text',
                    display: serverWidget.FieldDisplayType.INLINE
                }
            ];
            
            let sl_itr = 'custpage_sl_itr';
            let col_itr_ss = [['subsidiary_text', 0, 'sltext'], ['subsidiary', 0], ['tranid', 1], ['tokhaihaiquan', 2], ['currency_text', 3, 'sltext'],
                ['currency', 3], ['exchangerate', 4], ['exchangerate_hidden', 4], ['lineid', 5], ['item_text', 6, 'sltext'], ['item', 6], ['units', 7],
                ['quantity', 8], ['rate', 9], ['fxamount', 10], ['amount', 11], ['amount_hidden', 11], ['internalid', 12], ['taxrateinb', 13], ['trandate', 14]
            ];
            let col_itr = [
                {id: 'stt', label: 'STT', type: 'integer', display: 'disabled'},
                {id: 'custpage_sl_select', label: 'Select', type: 'checkbox'},
                {id: 'subsidiary_text', label: 'Subsidiary', type: 'text', display: 'disabled'},
                {id: 'subsidiary', label: 'Subsidiary', type: 'text', display: 'hidden'},
                {id: 'tranid', label: 'Document No', type: 'text', display: serverWidget.FieldDisplayType.INLINE},
                {id: 'trandate', label: 'Ngày NK', type: 'date', display: serverWidget.FieldDisplayType.INLINE},
                {
                    id: 'tokhaihaiquan',
                    label: 'Số TK hải quan',
                    type: 'text',
                    display: serverWidget.FieldDisplayType.INLINE
                },
                {id: 'currency_text', label: 'Currency', type: 'text', display: serverWidget.FieldDisplayType.INLINE},
                {id: 'currency', label: 'Currency', type: 'text', display: 'hidden'},
                {id: 'exchangerate', label: 'Exchange Rate', type: 'float', display: 'disabled'},
                {id: 'exchangerate_hidden', label: 'Exchange Rate', type: 'text', display: 'hidden'},
                {id: 'lineid', label: 'Line ID', type: 'text', display: serverWidget.FieldDisplayType.INLINE},
                {id: 'item_text', label: 'Item', type: 'text', display: serverWidget.FieldDisplayType.INLINE},
                {id: 'item', label: 'Item', type: 'text', display: 'hidden'},
                {id: 'units', label: 'UOM', type: 'text', display: serverWidget.FieldDisplayType.INLINE},
                {id: 'quantity', label: 'Quantity', type: 'float', display: serverWidget.FieldDisplayType.DISABLED},
                {id: 'rate', label: 'Rate', type: 'float', display: serverWidget.FieldDisplayType.DISABLED},
                {
                    id: 'fxamount',
                    label: 'Amount (Foreign)',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.DISABLED
                },
                {id: 'amount', label: 'Amount', type: 'float', display: serverWidget.FieldDisplayType.DISABLED},
                {id: 'amount_hidden', label: 'Amount', type: 'text', display: 'hidden'},
                {id: 'internalid', label: 'Internal ID', type: 'text', display: 'hidden'},
                {
                    id: 'chiphi_muahang_quocte',
                    label: 'CP MH quốc tế',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.ENTRY
                },
                {
                    id: 'chiphi_muahang_trongnuoc',
                    label: 'CP MH trong nước',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.ENTRY
                },
                {id: 'taxrateinb', label: 'Tax Rate Inb', type: 'text', display: 'hidden'},
                //{id: 'cpmhqt_noex', label: 'CP MH quốc tế', type: 'text', display: 'hidden'},
                //{id: 'cpmhtn_noex', label: 'CP MH trong nước', type: 'text', display: 'hidden'},
                {
                    id: 'cpmhqt_noexvnd',
                    label: 'CP MH quốc tế (VND)',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.DISABLED,
                    isEntry: true
                },
                {
                    id: 'cpmhtn_noexvnd',
                    label: 'CP MH trong nước (VND)',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.DISABLED,
                    isEntry: true
                }
            ];
            
            return {
                sl_bill: sl_bill,
                col_bill_ss: col_bill_ss,
                col_bill: col_bill,
                sl_itr: sl_itr,
                col_itr_ss: col_itr_ss,
                col_itr: col_itr
            }
        }
        
        return {
            onRequest
        };
        
    });
