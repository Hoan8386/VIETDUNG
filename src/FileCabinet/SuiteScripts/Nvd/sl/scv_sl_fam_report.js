/**
 * Project : Hafimex
 * TODO: Date              Author               Description
 *       14 Apr 2023       Duy Nguyen           Update chức năng Render file PDF from ms. Phan Ky (https://app.clickup.com/t/865c36f18)
 */
/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */

define(['N/format', 'N/runtime', 'N/record', 'N/search', 'N/ui/serverWidget',
        '../lib/scv_lib_function.js', '../lib/scv_lib_report.js'],
    
    (format, runtime, record, search, serverWidget, libFunc, libRep) => {
        
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
            let reportype = parameters.custpage_reportype;
            let subsidiary = parameters.custpage_subsidiary;
            let date_dauky = parameters.custpage_date_dauky;
            let date_cuoiky = parameters.custpage_date_cuoiky;
            let asset = parameters.custpage_asset;
            let asset_category = parameters.custpage_asset_category;
            let asset_type = parameters.custpage_assettype;
            let manage_department = parameters.custpage_managedepartment;
            let asset_department = parameters.custpage_assetdepartment;
            
            let isRun = true;
            if (!reportype) {
                reportype = 'customsearch_scv_fa_detail';
            }
            if (!subsidiary) {
                let userObj = runtime.getCurrentUser();
                subsidiary = [userObj.subsidiary];
                isRun = false;
            } else {
                subsidiary = subsidiary.split(',');
            }
            if (asset_category) {
                asset_category = asset_category.split(',');
            }
            if (!date_dauky || !date_cuoiky) {
                isRun = false;
            }
            if (request.method === 'GET') {
                let title = 'FAM Report';
                let form = serverWidget.createForm({
                    title: title
                });
                form.clientScriptModulePath = '../cs/scv_cs_sl_fam_report.js';
                form.addButton({id: 'custpage_bt_search', label: 'Search', functionName: 'searchReport()'});
                form.addButton({id: 'custpage_bt_export', label: 'Export', functionName: 'exportReport()'});
                //form.addButton({id: 'custpage_bt_print', label: 'PrintPdf', functionName: 'onPrint()'});
                
                // Pin header sublist
                libFunc.pinHeaderSublist(form);
                
                addFieldSearch(form, reportype, subsidiary, date_dauky, date_cuoiky, asset, asset_category, asset_type, manage_department, asset_department);
                let pre = 'custpage_sl_rep';
                let sublistId = 'custpage_sl_result';
                let sublist = form.addSublist({
                    id: sublistId,
                    type: serverWidget.SublistType.LIST,
                    label: 'KẾT QUẢ'
                });
                
                if (isRun) {
                    let date1 = format.parse({value: date_dauky, type: format.Type.DATE});
                    let date_dauky_n = `${date1.getFullYear()}${String(date1.getMonth() + 1).padStart(2, '0')}${String(date1.getDate()).padStart(2, '0')}`;
                    let date_tk = date_dauky_n;
                    date_dauky_n = " {custrecord_deprhistdate} < TO_DATE('" + date_dauky_n + "',  'YYYYMMDD') ";
                    
                    let date_trongky = " {custrecord_deprhistdate} >= TO_DATE('" + date_tk + "',  'YYYYMMDD') ";
                    let vrNone = '- None -';
                    // done
                    if (reportype === 'customsearch_scv_fa_detail') {
                        let s = search.load(reportype);
                        let c = s.columns;
                        
                        let pgSize = 1000;
                        let f = s.filters;
                        f.push(search.createFilter({
                            name: 'custrecord_deprhistsubsidiary',
                            operator: search.Operator.ANYOF,
                            values: subsidiary
                        }));
                        f.push(search.createFilter({
                            name: 'custrecord_deprhistdate',
                            operator: search.Operator.ONORBEFORE,
                            values: date_cuoiky
                        }));
                        if (asset) {
                            f.push(search.createFilter({
                                name: 'custrecord_deprhistasset',
                                operator: search.Operator.ANYOF,
                                values: asset
                            }));
                        }
                        if (manage_department) {
                            f.push(search.createFilter({
                                name: 'custrecord_scv_managedepartment',
                                join: 'CUSTRECORD_DEPRHISTASSET',
                                operator: search.Operator.ANYOF,
                                values: manage_department
                            }));
                        }
                        if (asset_department) {
                            f.push(search.createFilter({
                                name: 'custrecord_assetdepartment',
                                join: 'CUSTRECORD_DEPRHISTASSET',
                                operator: search.Operator.ANYOF,
                                values: asset_department
                            }));
                        }
                        if (asset_category) {
                            f.push(search.createFilter({
                                name: 'custrecord_ncfar_assettype_scv_category',
                                join: 'custrecord_deprhistassettype',
                                operator: search.Operator.ANYOF,
                                values: asset_category
                            }));
                        }
                        if (asset_type) {
                            f.push(search.createFilter({
                                name: 'custrecord_deprhistassettype',
                                operator: search.Operator.ANYOF,
                                values: asset_type
                            }));
                        }
                        //
                        let ngtang = "(case when {custrecord_deprhisttype} = 'Acquisition' and " + date_dauky_n + " then {custrecord_deprhistamount} when {custrecord_deprhisttype} = 'Write-down' and {custrecord_deprhistamount} < 0 and " + date_dauky_n + " then - {custrecord_deprhistamount} else 0 end)";
                        let nggiam = "(case when ({custrecord_deprhisttype} = 'Disposal' or {custrecord_deprhisttype} = 'Sale'  or {custrecord_deprhisttype} = 'Transfer') and " + date_dauky_n + " then {custrecord_deprhistamount} when {custrecord_deprhisttype} = 'Write-down' and {custrecord_deprhistamount} > 0 and " + date_dauky_n + " then {custrecord_deprhistamount} else 0 end)";
                        let col1 = {
                            name: 'formulacurrency',
                            summary: search.Summary.SUM,
                            label: 'Nguyên giá đầu kỳ',
                            type: 'currency',
                            formula: ngtang + " - " + nggiam
                        };
                        let khtang = "case when ({custrecord_deprhisttype} = 'Depreciation' or {custrecord_deprhisttype} = 'Revaluation') and " + date_dauky_n + " then case when {custrecord_deprhistamount} > 0 and " + date_dauky_n + " then {custrecord_deprhistamount} else 0 end else 0 end";
                        let khgiam = "case when ({custrecord_deprhisttype} = 'Depreciation' or {custrecord_deprhisttype} = 'Revaluation') and " + date_dauky_n + " then case when {custrecord_deprhistamount} < 0 and " + date_dauky_n + " then -{custrecord_deprhistamount} else 0 end else 0 end";
                        let col2 = {
                            name: 'formulacurrency',
                            summary: search.Summary.SUM,
                            label: 'HMLK đầu kỳ',
                            type: 'currency',
                            formula: khtang + " - " + khgiam
                        };
                        let col3 = {
                            name: 'formulacurrency',
                            summary: search.Summary.SUM,
                            label: 'GTCL đầu kỳ',
                            type: 'currency',
                            formula: ngtang + " - " + nggiam + " - " + khtang + " + " + khgiam
                        };
                        
                        let ngtang_ck = "(case when {custrecord_deprhisttype} = 'Acquisition' then {custrecord_deprhistamount} when {custrecord_deprhisttype} = 'Write-down' and {custrecord_deprhistamount} < 0 then - {custrecord_deprhistamount} else 0 end)";
                        let nggiam_ck = "(case when ({custrecord_deprhisttype} = 'Disposal' or {custrecord_deprhisttype} = 'Sale'  or {custrecord_deprhisttype} = 'Transfer') then {custrecord_deprhistamount} when {custrecord_deprhisttype} = 'Write-down' and {custrecord_deprhistamount} > 0 then {custrecord_deprhistamount} else 0 end)";
                        let col4 = {
                            name: 'formulacurrency',
                            summary: search.Summary.SUM,
                            label: 'Nguyên giá cuối kỳ',
                            type: 'currency',
                            formula: ngtang_ck + " - " + nggiam_ck
                        };
                        let khtang_ck = "case when ({custrecord_deprhisttype} = 'Depreciation' or {custrecord_deprhisttype} = 'Revaluation') then case when {custrecord_deprhistamount} > 0 then {custrecord_deprhistamount} else 0 end else 0 end";
                        let khgiam_ck = "case when ({custrecord_deprhisttype} = 'Depreciation' or {custrecord_deprhisttype} = 'Revaluation') then case when {custrecord_deprhistamount} < 0 then -{custrecord_deprhistamount} else 0 end else 0 end";
                        let col5 = {
                            name: 'formulacurrency',
                            summary: search.Summary.SUM,
                            label: 'HMLK cuối kỳ',
                            type: 'currency',
                            formula: khtang_ck + " - " + khgiam_ck
                        };
                        let col6 = {
                            name: 'formulacurrency',
                            summary: search.Summary.SUM,
                            label: 'GTCL cuối kỳ',
                            type: 'currency',
                            formula: ngtang_ck + " - " + nggiam_ck + " - " + khtang_ck + " + " + khgiam_ck
                        };
                        
                        let ngtang_tk = "(case when {custrecord_deprhisttype} = 'Acquisition' and " + date_trongky + " then {custrecord_deprhistamount} when {custrecord_deprhisttype} = 'Write-down' and {custrecord_deprhistamount} < 0 and " + date_trongky + " then - {custrecord_deprhistamount} when ({custrecord_deprhistassettype.name} like '1531%' and  {custrecord_deprhisttype} = 'Transfer') and " + date_trongky + " then -{custrecord_deprhistamount} else 0 end)";
                        let nggiam_tk = "(case when ({custrecord_deprhisttype} = 'Disposal' or {custrecord_deprhisttype} = 'Sale'  or ({custrecord_deprhistassettype.name} not like '1531%' and {custrecord_deprhisttype} = 'Transfer')) and " + date_trongky + " then {custrecord_deprhistamount} when {custrecord_deprhisttype} = 'Write-down' and {custrecord_deprhistamount} > 0 and " + date_trongky + " then {custrecord_deprhistamount} else 0 end)";
                        let khtang_tk = "case when ({custrecord_deprhisttype} = 'Depreciation' or {custrecord_deprhisttype} = 'Revaluation') and " + date_trongky + " then case when {custrecord_deprhistamount} > 0 and " + date_trongky + " then {custrecord_deprhistamount} else 0 end else 0 end";
                        let khgiam_tk = "case when ({custrecord_deprhisttype} = 'Depreciation' or {custrecord_deprhisttype} = 'Revaluation') and " + date_trongky + " then case when {custrecord_deprhistamount} < 0 and " + date_trongky + " then -{custrecord_deprhistamount} else 0 end else 0 end";
                        let col7 = {
                            name: 'formulacurrency',
                            summary: search.Summary.SUM,
                            label: 'Nguyên giá tăng',
                            type: 'currency',
                            formula: ngtang_tk
                        };
                        let col8 = {
                            name: 'formulacurrency',
                            summary: search.Summary.SUM,
                            label: 'Nguyên giá giảm',
                            type: 'currency',
                            formula: nggiam_tk
                        };
                        let col9 = {
                            name: 'formulacurrency',
                            summary: search.Summary.SUM,
                            label: 'Khấu hao tăng',
                            type: 'currency',
                            formula: khtang_tk
                        };
                        let col10 = {
                            name: 'formulacurrency',
                            summary: search.Summary.SUM,
                            label: 'Khấu hao giảm',
                            type: 'currency',
                            formula: khgiam_tk
                        };
                        let pos_slice = 11;
                        c.splice(pos_slice);
                        libRep.addFieldSublist(sublist, c, pre);
                        
                        let lc = c.length;
                        let cadd = [col1, col2, col3, col7, col8, col9, col10, col4, col5, col6];
                        c = c.concat(cadd);
                        s.columns = c;
                        libRep.addFieldSublistAdd(sublist, cadd, pre, lc);
                        
                        s.filters = f;
                        lc = c.length;
                        //Xu ly
                        let r;
                        try {
                            r = s.runPaged({pageSize: pgSize});
                        } catch (e) {
                            log.error('exception', e);
                            log.error('value', 'reportype: ' + reportype + ', subsidiary: ' + subsidiary + ', asset: ' + asset + ', asset_category: ' + asset_category
                                + ', date_dauky: ' + date_dauky + ', date_cuoiky: ' + date_cuoiky);
                            r = s.runPaged({pageSize: pgSize});
                        }
                        let arrAccount = getAccountAsset();
                        let numPage = r.pageRanges.length;
                        let searchPage, tempData, numTemp, tampValue, line = 0, j = 0;
                        let col = JSON.parse(JSON.stringify(c));
                        let arrTotal = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                        
                        for (let np = 0; np < numPage; np++) {
                            searchPage = r.fetch({index: np});
                            tempData = searchPage.data;
                            if (tempData) {
                                numTemp = tempData.length;
                                for (let i = 0; i < numTemp; i++) {
                                    for (j = 0; j < lc; j++) {
                                        tampValue = libRep.getValueDisplay(tempData[i], col[j], c[j]);
                                        if (j === 5) {
                                            tampValue = arrAccount.find(o => o.id_assetmainacc === tempData[i].getValue(c[j]))?.number_assetmainacc;
                                        } else if (j === 6) {
                                            tampValue = arrAccount.find(o => o.id === tempData[i].getValue(c[j]))?.number;
                                        }
                                        if ((tampValue || tampValue === 0) && tampValue !== vrNone) {
                                            sublist.setSublistValue({id: pre + j, line: line, value: tampValue});
                                            if (j >= pos_slice) {
                                                arrTotal[j - pos_slice] = arrTotal[j - pos_slice] + tampValue * 1;
                                            }
                                        }
                                    }
                                    line++;
                                }
                            }
                        }
                        
                        for (j = 0; j < lc; j++) {
                            if (j === 0) {
                                sublist.setSublistValue({id: pre + j, line: line, value: 'Tổng cộng'});
                            } else if (j >= pos_slice) {
                                sublist.setSublistValue({id: pre + j, line: line, value: arrTotal[j - pos_slice]});
                            }
                        }
                    } else if (reportype === 'biendong_tscd_hh') {
                        let s = search.load('customsearch_scv_fam_summary_ng');
                        let c = s.columns;
                        libRep.addFieldSublist(sublist, c, pre);
                        let cadd = [{label: 'Tổng cộng', type: 'currency'}];
                        libRep.addFieldSublistAdd(sublist, cadd, pre, c.length);
                        let line = 0;
                        let arrTTDN_NG, arrTTTK_NG, arrTTDN_HM, arrTTTK_HM;
                        sublist.setSublistValue({id: pre + 0, line: line, value: 'Nguyên giá'});
                        line++;
                        let ng_dudn = setValueDuDauNam('customsearch_scv_fam_summary_ng_dudn', subsidiary, date_dauky, sublist, vrNone, pre, line);
                        line = ng_dudn.line;
                        arrTTDN_NG = ng_dudn.arrTotal;
                        let ng = setValueTrongky('customsearch_scv_fam_summary_ng', subsidiary, date_dauky, date_cuoiky, sublist, vrNone, pre, line);
                        line = ng.line;
                        arrTTTK_NG = ng.arrTotal;
                        sublist.setSublistValue({id: pre + 0, line: line, value: 'Số dư cuối năm'});
                        let lCol = arrTTDN_NG.length;
                        for (let j = 0; j < lCol; j++) {
                            sublist.setSublistValue({
                                id: pre + (j + 1),
                                line: line,
                                value: arrTTDN_NG[j] + arrTTTK_NG[j]
                            });
                        }
                        line++;
                        sublist.setSublistValue({id: pre + 0, line: line, value: 'Giá trị hao mòn lũy kế'});
                        line++;
                        let gthm_dudn = setValueDuDauNam('customsearch_scv_fam_summary_gthm_dudn', subsidiary, date_dauky, sublist, vrNone, pre, line);
                        line = gthm_dudn.line;
                        arrTTDN_HM = gthm_dudn.arrTotal;
                        let gthm = setValueTrongky('customsearch_scv_fam_summary_gthm', subsidiary, date_dauky, date_cuoiky, sublist, vrNone, pre, line);
                        line = gthm.line;
                        arrTTTK_HM = gthm.arrTotal;
                        sublist.setSublistValue({id: pre + 0, line: line, value: 'Số dư cuối năm'});
                        lCol = arrTTDN_HM.length;
                        for (let j = 0; j < lCol; j++) {
                            sublist.setSublistValue({
                                id: pre + (j + 1),
                                line: line,
                                value: arrTTDN_HM[j] + arrTTTK_HM[j]
                            });
                        }
                        line++;
                        sublist.setSublistValue({id: pre + 0, line: line, value: 'Giá trị còn lại'});
                        line++;
                        sublist.setSublistValue({id: pre + 0, line: line, value: 'Tại ngày này đầu năm'});
                        for (let j = 0; j < lCol; j++) {
                            sublist.setSublistValue({
                                id: pre + (j + 1),
                                line: line,
                                value: arrTTDN_NG[j] - arrTTDN_HM[j]
                            });
                        }
                        line++;
                        sublist.setSublistValue({id: pre + 0, line: line, value: 'Tại ngày này cuối năm'});
                        for (let j = 0; j < lCol; j++) {
                            sublist.setSublistValue({
                                id: pre + (j + 1),
                                line: line,
                                value: arrTTDN_NG[j] + arrTTTK_NG[j] - arrTTDN_HM[j] - arrTTTK_HM[j]
                            });
                        }
                        line++;
                    } else if (reportype === 'biendong_tscd_vh') {
                        let s = search.load('customsearch_scv_fam_summary_ng_vh');
                        let c = s.columns;
                        libRep.addFieldSublist(sublist, c, pre);
                        let cadd = [{label: 'Tổng cộng', type: 'currency'}];
                        libRep.addFieldSublistAdd(sublist, cadd, pre, c.length);
                        let line = 0;
                        let arrTTDN_NG, arrTTTK_NG, arrTTDN_HM, arrTTTK_HM;
                        sublist.setSublistValue({id: pre + 0, line: line, value: 'Nguyên giá'});
                        line++;
                        let ng_dudn = setValueDuDauNam('customsearch_scv_fam_summary_ng_dudn_vh', subsidiary, date_dauky, sublist, vrNone, pre, line);
                        line = ng_dudn.line;
                        arrTTDN_NG = ng_dudn.arrTotal;
                        let ng = setValueTrongky('customsearch_scv_fam_summary_ng_vh', subsidiary, date_dauky, date_cuoiky, sublist, vrNone, pre, line);
                        line = ng.line;
                        arrTTTK_NG = ng.arrTotal;
                        sublist.setSublistValue({id: pre + 0, line: line, value: 'Số dư cuối năm'});
                        let lCol = arrTTDN_NG.length;
                        for (let j = 0; j < lCol; j++) {
                            sublist.setSublistValue({
                                id: pre + (j + 1),
                                line: line,
                                value: arrTTDN_NG[j] + arrTTTK_NG[j]
                            });
                        }
                        line++;
                        sublist.setSublistValue({id: pre + 0, line: line, value: 'Giá trị hao mòn lũy kế'});
                        line++;
                        let gthm_dudn = setValueDuDauNam('customsearch_scv_fam_summary_gthm_dudn_v', subsidiary, date_dauky, sublist, vrNone, pre, line);
                        line = gthm_dudn.line;
                        arrTTDN_HM = gthm_dudn.arrTotal;
                        let gthm = setValueTrongky('customsearch_scv_fam_summary_gthm_vh', subsidiary, date_dauky, date_cuoiky, sublist, vrNone, pre, line);
                        line = gthm.line;
                        arrTTTK_HM = gthm.arrTotal;
                        sublist.setSublistValue({id: pre + 0, line: line, value: 'Số dư cuối năm'});
                        lCol = arrTTDN_HM.length;
                        for (let j = 0; j < lCol; j++) {
                            sublist.setSublistValue({
                                id: pre + (j + 1),
                                line: line,
                                value: arrTTDN_HM[j] + arrTTTK_HM[j]
                            });
                        }
                        line++;
                        sublist.setSublistValue({id: pre + 0, line: line, value: 'Giá trị còn lại'});
                        line++;
                        sublist.setSublistValue({id: pre + 0, line: line, value: 'Tại ngày này đầu năm'});
                        for (let j = 0; j < lCol; j++) {
                            sublist.setSublistValue({
                                id: pre + (j + 1),
                                line: line,
                                value: arrTTDN_NG[j] - arrTTDN_HM[j]
                            });
                        }
                        line++;
                        sublist.setSublistValue({id: pre + 0, line: line, value: 'Tại ngày này cuối năm'});
                        for (let j = 0; j < lCol; j++) {
                            sublist.setSublistValue({
                                id: pre + (j + 1),
                                line: line,
                                value: arrTTDN_NG[j] + arrTTTK_NG[j] - arrTTDN_HM[j] - arrTTTK_HM[j]
                            });
                        }
                        line++;
                    } else if (reportype === 'bangphanbo_cp_tra_truoc') {
                        let s = search.load('customsearch_scv_fa_detail_2');
                        let c = s.columns;
                        let pgSize = 1000;
                        let f = s.filters;
                        
                        f.push(search.createFilter({
                            name: 'custrecord_deprhistsubsidiary',
                            operator: search.Operator.ANYOF,
                            values: subsidiary
                        }));
                        f.push(search.createFilter({
                            name: 'custrecord_deprhistdate',
                            operator: search.Operator.ONORBEFORE,
                            values: date_cuoiky
                        }));
                        if (asset) {
                            f.push(search.createFilter({
                                name: 'custrecord_deprhistasset',
                                operator: search.Operator.ANYOF,
                                values: asset
                            }));
                        }
                        if (manage_department) {
                            f.push(search.createFilter({
                                name: 'custrecord_scv_managedepartment',
                                join: 'custrecord_deprhistasset',
                                operator: search.Operator.ANYOF,
                                values: manage_department
                            }));
                        }
                        if (asset_department) {
                            f.push(search.createFilter({
                                name: 'custrecord_assetdepartment',
                                join: 'CUSTRECORD_DEPRHISTASSET',
                                operator: search.Operator.ANYOF,
                                values: asset_department
                            }));
                        }
                        if (asset_category) {
                            f.push(search.createFilter({
                                name: 'custrecord_ncfar_assettype_scv_category',
                                join: 'custrecord_deprhistassettype',
                                operator: search.Operator.ANYOF,
                                values: asset_category
                            }));
                        }
                        if (asset_type) {
                            f.push(search.createFilter({
                                name: 'custrecord_deprhistassettype',
                                operator: search.Operator.ANYOF,
                                values: asset_type
                            }));
                        }
                        
                        let ngtang = "(case when {custrecord_deprhisttype} = 'Acquisition' and " + date_dauky_n + " then {custrecord_deprhistamount} when {custrecord_deprhisttype} = 'Write-down' and {custrecord_deprhistamount} < 0 and " + date_dauky_n + " then - {custrecord_deprhistamount} else 0 end)";
                        let nggiam = "(case when ({custrecord_deprhisttype} = 'Disposal' or {custrecord_deprhisttype} = 'Sale'  or {custrecord_deprhisttype} = 'Transfer') and " + date_dauky_n + " then {custrecord_deprhistamount} when {custrecord_deprhisttype} = 'Write-down' and {custrecord_deprhistamount} > 0 and " + date_dauky_n + " then {custrecord_deprhistamount} else 0 end)";
                        let col1 = {
                            name: 'custrecord_assetcurrentcost',
                            join: 'custrecord_deprhistasset',
                            summary: 'GROUP',
                            label: 'Nguyên giá',
                            type: 'currency',
                            formula: ngtang + " - " + nggiam
                        };
                        
                        let khtang = "case when ({custrecord_deprhisttype} = 'Depreciation' or {custrecord_deprhisttype} = 'Revaluation') and " + date_dauky_n + " then case when {custrecord_deprhistamount} > 0 and " + date_dauky_n + " then {custrecord_deprhistamount} else 0 end else 0 end";
                        let khgiam = "case when ({custrecord_deprhisttype} = 'Depreciation' or {custrecord_deprhisttype} = 'Revaluation') and " + date_dauky_n + " then case when {custrecord_deprhistamount} < 0 and " + date_dauky_n + " then -{custrecord_deprhistamount} else 0 end else 0 end";
                        let col2 = {
                            name: 'formulacurrency',
                            summary: search.Summary.SUM,
                            label: 'HMLK đầu kỳ',
                            type: 'currency',
                            formula: khtang + " - " + khgiam
                        };
                        let col3 = {
                            name: 'formulacurrency',
                            summary: search.Summary.SUM,
                            label: 'GTCL đầu kỳ',
                            type: 'currency',
                            formula: ngtang + " - " + nggiam + " - " + khtang + " + " + khgiam
                        };
                        
                        let ngtang_ck = "(case when {custrecord_deprhisttype} = 'Acquisition' then {custrecord_deprhistamount} when {custrecord_deprhisttype} = 'Write-down' and {custrecord_deprhistamount} < 0 then - {custrecord_deprhistamount} else 0 end)";
                        let nggiam_ck = "(case when ({custrecord_deprhisttype} = 'Disposal' or {custrecord_deprhisttype} = 'Sale'  or {custrecord_deprhisttype} = 'Transfer') then {custrecord_deprhistamount} when {custrecord_deprhisttype} = 'Write-down' and {custrecord_deprhistamount} > 0 then {custrecord_deprhistamount} else 0 end)";
                        
                        let khtang_ck = "case when ({custrecord_deprhisttype} = 'Depreciation' or {custrecord_deprhisttype} = 'Revaluation') then case when {custrecord_deprhistamount} > 0 then {custrecord_deprhistamount} else 0 end else 0 end";
                        let khgiam_ck = "case when ({custrecord_deprhisttype} = 'Depreciation' or {custrecord_deprhisttype} = 'Revaluation') then case when {custrecord_deprhistamount} < 0 then -{custrecord_deprhistamount} else 0 end else 0 end";
                        let col5 = {
                            name: 'formulacurrency',
                            summary: search.Summary.SUM,
                            label: 'HMLK cuối kỳ',
                            type: 'currency',
                            formula: khtang_ck + " - " + khgiam_ck
                        };
                        let col6 = {
                            name: 'formulacurrency',
                            summary: search.Summary.SUM,
                            label: 'GTCL cuối kỳ',
                            type: 'currency',
                            formula: ngtang_ck + " - " + nggiam_ck + " - " + khtang_ck + " + " + khgiam_ck
                        };
                        let khtang_tk = "case when ({custrecord_deprhisttype} = 'Depreciation' or {custrecord_deprhisttype} = 'Revaluation') and " + date_trongky + " then case when {custrecord_deprhistamount} > 0 and " + date_trongky + " then {custrecord_deprhistamount} else 0 end else 0 end";
                        let col9 = {
                            name: 'formulacurrency',
                            summary: search.Summary.SUM,
                            label: 'Khấu hao tăng',
                            type: 'currency',
                            formula: khtang_tk
                        };
                        
                        let pos_slice = 11;
                        c.splice(pos_slice);
                        // change name label
                        c[2].label = "Mã CCDC/CPTT";
                        c[3].label = "Tên CCDC/CCPTT";
                        c[6].label = "TK phân bổ";
                        col1.label = "Nguyên giá";
                        col2.label = "Giá trị đã phân bổ";
                        col3.label = "Giá trị còn lại đầu kỳ";
                        col9.label = "Giá trị phân bổ trong kỳ";
                        col5.label = "Tổng giá trị PB";
                        col6.label = "Giá trị còn lại";
                        /*==================================================*/
                        libRep.addFieldSublist(sublist, c, pre);
                        let lc = c.length;
                        let cadd = [col1, col2, col3, col9, col5, col6];
                        
                        c = c.concat(cadd);
                        s.columns = c;
                        libRep.addFieldSublistAdd(sublist, cadd, pre, lc);
                        
                        s.filters = f;
                        lc = c.length;
                        
                        //Xu ly
                        let r;
                        try {
                            r = s.runPaged({pageSize: pgSize});
                        } catch (e) {
                            log.error('exception', e);
                            log.error('value', 'reportype: ' + reportype + ', subsidiary: ' + subsidiary + ', asset: ' + asset + ', asset_category: ' + asset_category
                                + ', date_dauky: ' + date_dauky + ', date_cuoiky: ' + date_cuoiky);
                            r = s.runPaged({pageSize: pgSize});
                        }
                        let arrAccount = getAccountAsset();
                        let numPage = r.pageRanges.length;
                        let searchPage, tempData, numTemp, tampValue, line = 0, j = 0;
                        let col = JSON.parse(JSON.stringify(c));
                        let arrTotal = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                        
                        for (let np = 0; np < numPage; np++) {
                            searchPage = r.fetch({index: np});
                            tempData = searchPage.data;
                            if (tempData) {
                                numTemp = tempData.length;
                                for (let i = 0; i < numTemp; i++) {
                                    for (j = 0; j < lc; j++) {
                                        tampValue = libRep.getValueDisplay(tempData[i], col[j], c[j]);
                                        if (j === 5) {
                                            tampValue = arrAccount.find(o => o.id_assetmainacc === tempData[i].getValue(c[j]))?.number_assetmainacc;
                                        } else if (j === 6) {
                                            tampValue = arrAccount.find(o => o.id === tempData[i].getValue(c[j]))?.number;
                                        }
                                        if ((tampValue || tampValue === 0) && tampValue !== vrNone) {
                                            sublist.setSublistValue({id: pre + j, line: line, value: tampValue});
                                            if (j >= pos_slice && !isNaN(tampValue)) {
                                                arrTotal[j - pos_slice] = arrTotal[j - pos_slice] + tampValue * 1;
                                            }
                                        }
                                    }
                                    line++;
                                }
                            }
                        }
                        
                        for (j = 0; j < lc; j++) {
                            if (j === 0) {
                                sublist.setSublistValue({id: pre + j, line: line, value: 'Tổng cộng'});
                            } else if (j >= pos_slice) {
                                sublist.setSublistValue({id: pre + j, line: line, value: arrTotal[j - pos_slice]});
                            }
                        }
                    }
                    
                }
                response.writePage(form);
            }
        }
        
        const setValueDuDauNam = (reporttype, subsidiary, date_dauky, sublist, vrNone, pre, line) => {
            let s = search.load(reporttype);
            let c = s.columns;
            let lc = c.length;
            let f = s.filters;
            f.push(search.createFilter({name: 'subsidiary', operator: search.Operator.ANYOF, values: subsidiary}));
            f.push(search.createFilter({name: 'trandate', operator: search.Operator.BEFORE, values: date_dauky}));
            s.filters = f;
            let col = JSON.parse(JSON.stringify(c));
            let r;
            try {
                r = s.run().getRange({start: 0, end: 1000});
            } catch (e) {
                log.error('exception', e);
                log.error('value', 'reporttype: ' + reporttype + ', subsidiary: ' + subsidiary + ', date_dauky: ' + date_dauky);
                r = s.run().getRange({start: 0, end: 1000});
            }
            let lR = r.length;
            let j, arrTotal = [], totalLine = 0;
            for (j = 0; j < lc; j++) {
                arrTotal.push(0);
            }
            for (let i = 0; i < lR; i++) {
                totalLine = 0;
                for (j = 0; j < lc; j++) {
                    let tampValue = libRep.getValueDisplay(r[i], col[j], c[j]);
                    if (tampValue !== vrNone && tampValue) {
                        sublist.setSublistValue({id: pre + j, line: line, value: tampValue});
                        if (j > 0) {
                            totalLine = totalLine + tampValue * 1;
                            arrTotal[j - 1] = arrTotal[j - 1] + tampValue * 1;
                        }
                    }
                }
                sublist.setSublistValue({id: pre + lc, line: line, value: totalLine});
                arrTotal[lc - 1] = arrTotal[lc - 1] + totalLine;
                line++;
            }
            return {line: line, arrTotal: arrTotal};
        }
        
        const setValueTrongky = (reporttype, subsidiary, date_dauky, date_cuoiky, sublist, vrNone, pre, line) => {
            let s = search.load(reporttype);
            let c = s.columns;
            let lc = c.length;
            let f = s.filters;
            f.push(search.createFilter({name: 'subsidiary', operator: search.Operator.ANYOF, values: subsidiary}));
            f.push(search.createFilter({name: 'trandate', operator: search.Operator.ONORAFTER, values: date_dauky}));
            f.push(search.createFilter({name: 'trandate', operator: search.Operator.ONORBEFORE, values: date_cuoiky}));
            s.filters = f;
            let col = JSON.parse(JSON.stringify(c));
            let r;
            try {
                r = s.run().getRange({start: 0, end: 1000});
            } catch (e) {
                log.error('exception', e);
                log.error('value', 'reporttype: ' + reporttype + ', subsidiary: ' + subsidiary + ', date_dauky: ' + date_dauky + ', date_cuoiky: ' + date_cuoiky);
                r = s.run().getRange({start: 0, end: 1000});
            }
            let lR = r.length;
            let j, arrTotal = [], totalLine = 0;
            for (j = 0; j < lc; j++) {
                arrTotal.push(0);
            }
            for (let i = 0; i < lR; i++) {
                totalLine = 0;
                for (j = 0; j < lc; j++) {
                    let tampValue = libRep.getValueDisplay(r[i], col[j], c[j]);
                    if (tampValue !== vrNone && tampValue) {
                        sublist.setSublistValue({id: pre + j, line: line, value: tampValue});
                        if (j > 0) {
                            totalLine = totalLine + tampValue * 1;
                            arrTotal[j - 1] = arrTotal[j - 1] + tampValue * 1;
                        }
                    }
                }
                sublist.setSublistValue({id: pre + lc, line: line, value: totalLine});
                arrTotal[lc - 1] = arrTotal[lc - 1] + totalLine;
                line++;
            }
            return {line: line, arrTotal: arrTotal};
        }
        
        const addFieldSearch = (form, reportype, subsidiary, date_dauky, date_cuoiky, asset, asset_category, asset_type, manage_department, asset_department) => {
            form.addFieldGroup({
                id: 'fieldgroup_dc_main',
                label: 'Criteria'
            });
            
            let custpage_reportype = form.addField({
                id: 'custpage_reportype', type: serverWidget.FieldType.SELECT,
                label: 'Report Type', container: 'fieldgroup_dc_main'
            });
            let listReport = [{
                value: 'customsearch_scv_fa_detail',
                label: 'Bảng phân bổ khấu hao TSCĐ'
            }, {value: 'biendong_tscd_hh', label: 'Biến động TSCĐ HH'}, {
                value: 'biendong_tscd_vh',
                label: 'Biến động TSCĐ VH'
            },
                {value: 'bangphanbo_cp_tra_truoc', label: 'Bảng phân bổ CP trả trước'}];
            libRep.addSelectType(custpage_reportype, reportype, listReport);
            custpage_reportype.isMandatory = true;
            
            let custpage_subsidiary = form.addField({
                id: 'custpage_subsidiary', type: serverWidget.FieldType.MULTISELECT,
                label: 'Subsidiary', container: 'fieldgroup_dc_main' //source: 'subsidiary',
            });
            libRep.addSelectSubsidiary(custpage_subsidiary, subsidiary);
            custpage_subsidiary.isMandatory = true;
            
            if (reportype === 'customsearch_scv_fa_detail' || reportype === 'bangphanbo_cp_tra_truoc') {
                let custpage_asset_category = form.addField({
                    id: 'custpage_asset_category',
                    type: serverWidget.FieldType.MULTISELECT,
                    label: 'Asset Category',
                    container: 'fieldgroup_dc_main',
                    source: 'customrecord_ncfar_assettype_scv_categor'
                });
                custpage_asset_category.defaultValue = asset_category;
                
                let custpage_asset = form.addField({
                    id: 'custpage_asset', type: serverWidget.FieldType.SELECT,
                    label: 'Asset', container: 'fieldgroup_dc_main', source: 'customrecord_ncfar_asset'
                });
                custpage_asset.defaultValue = asset;
                
                let custpage_assettype = form.addField({
                    id: 'custpage_assettype', type: serverWidget.FieldType.SELECT,
                    label: 'Asset type', container: 'fieldgroup_dc_main', source: 'customrecord_ncfar_assettype'
                });
                custpage_assettype.defaultValue = asset_type;
            }
            
            let custpage_managedepartment = form.addField({
                id: 'custpage_managedepartment', type: serverWidget.FieldType.SELECT,
                label: 'Bộ phận quản lý', container: 'fieldgroup_dc_main', source: 'department'
            });
            custpage_managedepartment.defaultValue = manage_department || '';
            
            let custpage_assetdepartment = form.addField({
                id: 'custpage_assetdepartment', type: serverWidget.FieldType.SELECT,
                label: 'Bộ phận', container: 'fieldgroup_dc_main', source: 'department'
            })
            custpage_assetdepartment.defaultValue = asset_department || '';
            //
            let custpage_date_dauky = form.addField({
                id: 'custpage_date_dauky', type: serverWidget.FieldType.DATE,
                label: 'From Date', container: 'fieldgroup_dc_main'
            });
            custpage_date_dauky.defaultValue = date_dauky;
            custpage_date_dauky.isMandatory = true;
            
            let custpage_date_cuoiky = form.addField({
                id: 'custpage_date_cuoiky', type: serverWidget.FieldType.DATE,
                label: 'To Date', container: 'fieldgroup_dc_main'
            });
            custpage_date_cuoiky.defaultValue = date_cuoiky;
            custpage_date_cuoiky.isMandatory = true;
            
        }
        
        const getAccountAsset = () => {
            let columnsAsset = [
                search.createColumn({
                    name: "custrecord_assetdeprchargeacc",
                    summary: "GROUP",
                    label: "Depreciation Charge Account"
                }),
                search.createColumn({
                    name: "number",
                    join: "custrecord_assetdeprchargeacc",
                    summary: "GROUP",
                    sort: search.Sort.ASC,
                    label: "Number"
                }),
                search.createColumn({
                    name: "custrecord_assetmainacc",
                    summary: "GROUP",
                    label: "Tài khoản TS"
                }),
                search.createColumn({
                    name: "number",
                    join: "custrecord_assetmainacc",
                    summary: "GROUP",
                    label: "Number"
                }),
            ];
            let searchAsset = search.create({
                type: "customrecord_ncfar_asset",
                filters:
                    [
                        ["isinactive", "is", "F"]
                    ],
                columns: columnsAsset
            });
            let arrAcc = [];
            searchAsset = searchAsset.run().getRange(0, 1000);
            for (let i = 0; i < searchAsset.length; i++) {
                let obj = {
                    id: searchAsset[i].getValue(columnsAsset[0]),
                    number: searchAsset[i].getValue(columnsAsset[1]),
                    name: searchAsset[i].getText(columnsAsset[0]),
                    id_assetmainacc: searchAsset[i].getValue(columnsAsset[2]),
                    number_assetmainacc: searchAsset[i].getValue(columnsAsset[3]),
                    name_assetmainacc: searchAsset[i].getText(columnsAsset[2])
                };
                arrAcc.push(obj);
            }
            return arrAcc;
        }
        
        const getNumberAccount = (_arrAcc, _AccID) => {
            for (let i = 0; i < _arrAcc.length; i++) {
                if (_arrAcc[i].id === _AccID) {
                    return _arrAcc[i].number;
                }
            }
            return null;
        }
        
        return {
            onRequest
        };
        
    });
