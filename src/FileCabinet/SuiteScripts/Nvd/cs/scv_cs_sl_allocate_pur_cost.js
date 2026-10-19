/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/url'],
    
    function (ccr, url) {
    
        const Sublist = {
            BILL: 'custpage_sl_bill',
            ITR: 'custpage_sl_itr'
        }
    
        const refresh = () => {
            window.location.reload();
        }
        
        const searchReport = () => {
            window.onbeforeunload = null;
            let currentRecord = ccr.get();
            let urlDC = url.resolveScript({
                scriptId: 'customscript_scv_sl_allocate_pur_cost',
                deploymentId: 'customdeploy_scv_sl_allocate_pur_cost',
                returnExternalUrl: false,
                params: {custpage_tokhaihaiquan: currentRecord.getValue('custpage_tokhaihaiquan')}
            });
            window.location.replace(urlDC);
        }
        
        const markAll = () => {
            setValueSelect('custpage_sl_bill', 'custpage_sl_select', true);
        }
        
        const unmarkAll = () => {
            setValueSelect('custpage_sl_bill', 'custpage_sl_select', false);
        }
        
        const markAllItr = () => {
            setValueSelect('custpage_sl_itr', 'custpage_sl_select', true, 1);
            allocate();
        }
        
        const unmarkAllItr = () => {
            setValueSelect('custpage_sl_itr', 'custpage_sl_select', false);
        }
        
        const setValueSelect = (sublistId, sf_select, value, numLineNotSelect = 0) => {
            let currentRecord = ccr.get();
            let lc = currentRecord.getLineCount(sublistId) - numLineNotSelect;
            for (let i = 0; i < lc; i++) {
                currentRecord.selectLine({sublistId: sublistId, line: i});
                currentRecord.setCurrentSublistValue({sublistId: sublistId, fieldId: sf_select, value: value});
                currentRecord.commitLine(sublistId);
            }
        }
        
        const recalHeader = () => {
            let currentRecord = ccr.get();
            let sublistId = 'custpage_sl_bill';
            let sf_select = 'custpage_sl_select';
            let lc = currentRecord.getLineCount(sublistId);
            let select, total_cpmh_trongnuoc = 0, total_cpmh_quocte = 0, costcateg_id, amount, costcateg;
            for (let i = 0; i < lc; i++) {
                select = currentRecord.getSublistValue({sublistId: sublistId, fieldId: sf_select, line: i});
                if (select === true) {
                    costcateg_id = currentRecord.getSublistValue({sublistId: sublistId, fieldId: 'costcateg_id', line: i});
                    costcateg = currentRecord.getSublistValue({sublistId: sublistId, fieldId: 'costcateg', line: i});
                    costcateg = costcateg.substring(0, 2);
                    amount = currentRecord.getSublistValue({sublistId: sublistId, fieldId: 'amount', line: i}) * 1;
                    if (costcateg === '01') {
                        total_cpmh_quocte = total_cpmh_quocte + amount;
                    } else if (costcateg === '02') {
                        total_cpmh_trongnuoc = total_cpmh_trongnuoc + amount;
                    }
                }
            }
            currentRecord.setValue('custpage_chiphimuahangquocte', total_cpmh_quocte);
            currentRecord.setValue('custpage_chiphimuahangtrongnuoc', total_cpmh_trongnuoc);
        }
        
        const allocate = () => {
            let currentRecord = ccr.get();
            let sublistId = 'custpage_sl_itr';
            let sf_select = 'custpage_sl_select';
            let lc = currentRecord.getLineCount(sublistId) - 1;
            let chiphimuahangquocte = currentRecord.getValue('custpage_chiphimuahangquocte');
            let chiphimuahangtrongnuoc = currentRecord.getValue('custpage_chiphimuahangtrongnuoc');
            let select, amount, total_amount = 0, exchangerate, currency_text, cpmh_quocte_line, cpmh_trongnuoc_line,
                cpmhqt_noex, cpmhtn_noex;
            let total_quocte_line = 0, total_trongnuoc_line = 0, amount_max = 0, line_max = 0, exchangerate_max = 0,
                cpmh_quocte_line_max = 0, cpmh_trongnuoc_line_max = 0;
            for (let i = 0; i < lc; i++) {
                select = currentRecord.getSublistValue({sublistId: sublistId, fieldId: sf_select, line: i});
                if (select === true) {
                    amount = currentRecord.getSublistValue({sublistId: sublistId, fieldId: 'amount', line: i}) * 1;
                    total_amount = total_amount + amount;
                }
            }
            let objLineTotal = getInitObjItrLineTotal();
            let list_ct = [], total_amount_ct_qt = 0, total_amount_ct_tn = 0;
            if (total_amount !== 0) {
                for (let i = 0; i < lc; i++) {
                    select = currentRecord.getSublistValue({sublistId: sublistId, fieldId: sf_select, line: i});
                    currentRecord.selectLine({sublistId: sublistId, line: i});
                    if (select === true) {
                        amount = currentRecord.getSublistValue({
                            sublistId: sublistId,
                            fieldId: 'amount_hidden',
                            line: i
                        }) * 1;
                        exchangerate = currentRecord.getSublistValue({
                            sublistId: sublistId,
                            fieldId: 'exchangerate_hidden',
                            line: i
                        });
                        
                        currency_text = currentRecord.getSublistValue({
                            sublistId: sublistId,
                            fieldId: 'currency_text',
                            line: i
                        });
                        if (currency_text === 'VND') {
                            exchangerate = 1;
                        }
                        cpmhqt_noex = Math.round(chiphimuahangquocte * amount / total_amount);
                        cpmhtn_noex = Math.round(chiphimuahangtrongnuoc * amount / total_amount);
                        cpmh_quocte_line = cpmhqt_noex / exchangerate;//console.log(cpmhqt_noex)
                        cpmh_trongnuoc_line = cpmhtn_noex / exchangerate;
                        if (currency_text === 'VND') {
                            cpmh_quocte_line = Math.round(cpmh_quocte_line);
                            cpmh_trongnuoc_line = Math.round(cpmh_trongnuoc_line);
                        } else {
                            cpmh_quocte_line = cpmh_quocte_line.toFixed(2) * 1;
                            cpmh_trongnuoc_line = cpmh_trongnuoc_line.toFixed(2) * 1;
                        }
                        total_quocte_line = total_quocte_line + cpmh_quocte_line;
                        total_trongnuoc_line = total_trongnuoc_line + cpmh_trongnuoc_line;
                        total_amount_ct_qt += cpmh_quocte_line * exchangerate;
                        total_amount_ct_tn += cpmh_trongnuoc_line * exchangerate;
                        if (amount >= amount_max) {
                            line_max = i;
                            exchangerate_max = exchangerate;
                            cpmh_quocte_line_max = cpmh_quocte_line;
                            cpmh_trongnuoc_line_max = cpmh_trongnuoc_line;
                        }
                        if (list_ct[0] !== currency_text) {
                            list_ct.push(currency_text);
                        }
                        
                        
                    } else {
                        cpmh_quocte_line = '';
                        cpmh_trongnuoc_line = '';
                        cpmhqt_noex = '';
                        cpmhtn_noex = '';
                    }
                    let objLine = {
                        'chiphi_muahang_quocte': cpmh_quocte_line,
                        'chiphi_muahang_trongnuoc': cpmh_trongnuoc_line,
                        'cpmhqt_noexvnd': cpmhqt_noex,
                        'cpmhtn_noexvnd': cpmhtn_noex
                    };
                    plushToTotal(objLineTotal, objLine);
                    setCurrentSublistValue(currentRecord, sublistId, objLine);
                    
                    currentRecord.commitLine({sublistId: sublistId});
                }
            }
            currentRecord.selectLine({sublistId: sublistId, line: lc});
            toFixTotal(objLineTotal);
            setCurrentSublistValue(currentRecord, sublistId, objLineTotal);
            currentRecord.commitLine({sublistId: sublistId});
        }
        
        const setCurrentSublistValue = (currentRecord, sublistId, objLine) => {
            fieldIds.forEach((fieldId) => {
                currentRecord.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: fieldId,
                    value: objLine[fieldId]
                });
            });
        }
        
        const toFixTotal = (objTotal) => {
            objTotal.chiphi_muahang_quocte = Number(objTotal.chiphi_muahang_quocte.toFixed(2));
            objTotal.chiphi_muahang_trongnuoc = Number(objTotal.chiphi_muahang_trongnuoc.toFixed(2));
            objTotal.cpmhqt_noexvnd = Math.round(objTotal.cpmhqt_noexvnd);
            objTotal.cpmhtn_noexvnd = Math.round(objTotal.cpmhtn_noexvnd);
            return objTotal;
        }
        
        const getCurrentLineValue = (currentRecord, sublistId, fieldIds) => {
            let objLine = {};
            fieldIds.forEach((fieldId) => {
                objLine[fieldId] = currentRecord.getCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: fieldId
                });
            });
            return objLine;
        }
        
        const recalTotalItr = () => {
            let currentRecord = ccr.get();
            let sublistId = 'custpage_sl_itr';
            setAndRecalTotalLine(currentRecord, sublistId);
        }
        
        const setAndRecalTotalLine = (currentRecord, sublistId) => {
            let lc = currentRecord.getLineCount(sublistId) - 1;
            let objLineTotal = getInitObjItrLineTotal();
            let sf_select = 'custpage_sl_select';
            for (let i = 0; i < lc; i++) {
                let select = currentRecord.getSublistValue({sublistId: sublistId, fieldId: sf_select, line: i});
                if(select === true) {
                    currentRecord.selectLine({sublistId: sublistId, line: i});
                    let objLine = getCurrentLineValue(currentRecord, sublistId, fieldIds);
                    plushToTotal(objLineTotal, objLine);
                }
            }
            currentRecord.selectLine({sublistId: sublistId, line: lc});
            setCurrentSublistValue(currentRecord, sublistId, objLineTotal);
        }
        
        const fieldIds = ['chiphi_muahang_quocte', 'chiphi_muahang_trongnuoc', 'cpmhqt_noexvnd', 'cpmhtn_noexvnd'];
        const plushToTotal = (objTotal, objLine) => {
            fieldIds.forEach((fieldId) => {
                objTotal[fieldId] += Number(objLine[fieldId] || 0);
            });
        }
        
        const getInitObjItrLineTotal = () => {
            return {
                chiphi_muahang_quocte: 0,
                chiphi_muahang_trongnuoc: 0,
                cpmhqt_noexvnd: 0,
                cpmhtn_noexvnd: 0
            };
        }
        
        function pageInit (scriptContext) {
            let currentRecord = scriptContext.currentRecord;
            let sublistId = Sublist.ITR;
            let lc = currentRecord.getLineCount(sublistId);
            if (lc > 1) {
                disableLineField(currentRecord, sublistId, lc - 1, 'custpage_sl_select');
                disableLineField(currentRecord, sublistId, lc - 1, 'chiphi_muahang_quocte');
                disableLineField(currentRecord, sublistId, lc - 1, 'chiphi_muahang_trongnuoc');
            }
        }
        
        const disableLineField = (currentRecord, sublistId, line, fieldId) => {
            let field = currentRecord.getSublistField({
                sublistId: sublistId,
                fieldId: fieldId,
                line: line
            });
            if (field) {
                field.isDisabled = true;
            }
        }
        
        function fieldChanged(scriptContext) {
            let sublistId = scriptContext.sublistId;
            let fieldId = scriptContext.fieldId;
            let currentRecord = scriptContext.currentRecord;
            if (sublistId === 'custpage_sl_itr' && fieldId === 'custpage_sl_select') {
                let select = currentRecord.getCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custpage_sl_select'
                });
                if (!(select === true)) {
                    currentRecord.setCurrentSublistValue({
                        sublistId: sublistId,
                        fieldId: 'chiphi_muahang_quocte',
                        value: ''
                    });
                    currentRecord.setCurrentSublistValue({
                        sublistId: sublistId,
                        fieldId: 'chiphi_muahang_trongnuoc',
                        value: ''
                    });
                } else {
                    //allocate();
                }
            } else if (fieldId === 'chiphi_muahang_quocte') {
                //caluclateCPMHVND(currentRecord, sublistId, fieldId, 'cpmhqt_noex');
                caluclateCPMHVND(currentRecord, sublistId, fieldId, 'cpmhqt_noexvnd');
            } else if (fieldId === 'chiphi_muahang_trongnuoc') {
                //caluclateCPMHVND(currentRecord, sublistId, fieldId, 'cpmhtn_noex');
                caluclateCPMHVND(currentRecord, sublistId, fieldId, 'cpmhtn_noexvnd');
            }
        }
        
        const caluclateCPMHVND = (currentRecord, sublistId, fieldGet, fieldSet) => {
            let exchangerate = currentRecord.getCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'exchangerate_hidden'
            });
            let currency_text = currentRecord.getCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'currency_text'
            });
            if (currency_text === 'VND') {
                exchangerate = 1;
            }
            let amount = currentRecord.getCurrentSublistValue({
                sublistId: sublistId,
                fieldId: fieldGet
            });
            currentRecord.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: fieldSet,
                value: Math.round(amount * exchangerate)
            });
        }
        
        function sublistChanged(scriptContext) {
            let sublistId = scriptContext.sublistId;
            if (sublistId === 'custpage_sl_bill') {
                recalHeader();
            }
        }
        
        function saveRecord(scriptContext) {
            let currentRecord = scriptContext.currentRecord;
            let sublistId = 'custpage_sl_itr';
            setAndRecalTotalLine(currentRecord, sublistId);
            
            let sf_select = 'custpage_sl_select';
            let lc = currentRecord.getLineCount(sublistId) - 1;
            let isselect = false, isvalid = true, islinequocte = true, islinetrongnuoc = true, chiphi_muahang_quocte,
                chiphi_muahang_trongnuoc;
            for (let i = 0; i < lc; i++) {
                let select = currentRecord.getSublistValue({sublistId: sublistId, fieldId: sf_select, line: i});
                if (select === true) {
                    isselect = true;
                    chiphi_muahang_quocte = currentRecord.getSublistValue({
                        sublistId: sublistId,
                        fieldId: 'chiphi_muahang_quocte',
                        line: i
                    });
                    chiphi_muahang_trongnuoc = currentRecord.getSublistValue({
                        sublistId: sublistId,
                        fieldId: 'chiphi_muahang_trongnuoc',
                        line: i
                    });
                    if (!chiphi_muahang_quocte && chiphi_muahang_quocte === '') {
                        islinequocte = false;
                    }
                    if (!chiphi_muahang_trongnuoc && chiphi_muahang_trongnuoc === '') {
                        islinetrongnuoc = false;
                    }
                }
            }
            
            if (islinequocte === false || islinetrongnuoc === false) {
                alert('chưa phân bổ hết cho chứng từ nhập kho được chọn!');
                isvalid = false;
            }
            
            if (isselect === false) {
                isvalid = false;
                alert('Bạn phải chọn ít nhất một chứng từ nhập kho!');
            }
            if (isvalid) {
                currentRecord.selectLine({sublistId: sublistId, line: lc});
                let objLineTotal = getCurrentLineValue(currentRecord, sublistId, fieldIds);
                let chiphimuahangquocte = currentRecord.getValue('custpage_chiphimuahangquocte');
                let chiphimuahangtrongnuoc = currentRecord.getValue('custpage_chiphimuahangtrongnuoc');
                if(objLineTotal.cpmhqt_noexvnd !== chiphimuahangquocte) {
                    return confirm('Tổng chi phí mua hàng quốc tế (VND) đang bị lệch!');
                } else if(objLineTotal.cpmhtn_noexvnd !== chiphimuahangtrongnuoc) {
                    return confirm('Tổng chi phí mua hàng trong nước (VND) đang bị lệch!');
                } else {
                    return confirm('Bạn có muốn phân bổ không?');
                }
            } else {
                return isvalid;
            }
        }
        
        return {
            refresh: refresh,
            searchReport: searchReport,
            markAll: markAll,
            unmarkAll: unmarkAll,
            markAllItr: markAllItr,
            unmarkAllItr: unmarkAllItr,
            allocate: allocate,
            recalTotalItr: recalTotalItr,
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            sublistChanged: sublistChanged,
            saveRecord: saveRecord
        };
        
    });
