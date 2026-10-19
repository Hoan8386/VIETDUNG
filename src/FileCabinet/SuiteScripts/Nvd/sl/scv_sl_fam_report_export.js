/**
 * Project : Hafimex
 * TODO: Date              Author               Description
 *       17 Apr 2023       Duy Nguyen           Update chức năng Render file PDF from ms. Phan Ky (https://app.clickup.com/t/865c36f18)
 */
/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/file', 'N/format', 'N/render', 'N/search',
        '../lib/scv_lib_function.js', '../lib/scv_lib_report.js'],
    
    (file, format, render, search, libFunc, libRep) => {
        
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
            let asset_text = parameters.custpage_asset_text;
            let asset_category_text = parameters.custpage_asset_category_text;
            let asset_type = parameters.custpage_assettype;
            let isPrint = parameters.isPrint;
            
            let isRun = true;
            if (subsidiary) {
                subsidiary = subsidiary.split(',');
            } else {
                isRun = false;
            }
            if (asset_category) {
                asset_category = asset_category.split(',');
            }
            if (!date_dauky || !date_cuoiky) {
                isRun = false;
            }
            
            if (isRun) {
                let date1 = format.parse({value: date_dauky, type: format.Type.DATE});
                let date_dauky_n = `${date1.getFullYear()}${String(date1.getMonth() + 1).padStart(2, '0')}${String(date1.getDate()).padStart(2, '0')}`;
                let date_tk = date_dauky_n;
                date_dauky_n = " {custrecord_deprhistdate} < TO_DATE('" + date_dauky_n + "',  'YYYYMMDD') ";
                let date_trongky = " {custrecord_deprhistdate} >= TO_DATE('" + date_tk + "',  'YYYYMMDD') ";
                
                let content = '';
                let namefile = 'temp.xls';
                // Export Pdf
                let pRowPdf = '';
                let startRowPdf = '<tr>', endRowPdf = '</tr>', startRowBoldPdf = '<tr font-weight = "bold">';
                let startCellPdf = '<td><p>';
                let endCellPdf = '</p></td>';
                let cellEndPdf = '<td/>'
                let startRightCellPdf = `<td><p width = "100%" text-align = "right">`
                let stCellCongEndPdf = `<td><p text-align = "center">Cộng</p></td>`;
                let pCellTongCongPdf = `<td font-weight= 'bold'>Tổng cộng</td>`;
                
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
                        name: 'formulacurrency',
                        summary: search.Summary.SUM,
                        label: 'Nguyên giá đầu kỳ',
                        type: 'currency',
                        formula: ngtang + " - " + nggiam
                    };
                    let khtang = "case when ({custrecord_deprhisttype} = 'Depreciation' or {custrecord_deprhisttype} = 'Revaluation') and " + date_dauky_n + " then case when {custrecord_deprhistamount} > 0 and " + date_dauky_n + " then {custrecord_deprhistamount} else 0 end else 0 end";
                    let khgiam = "case when ({custrecord_deprhisttype} = 'Depreciation' or {custrecord_deprhisttype} = 'Revaluation') and " + date_dauky_n + " then case when {custrecord_deprhistamount} < 0 and " + date_dauky_n + " then -{custrecord_deprhistamount} else 0 end else 0 end";
                    let col2 = {
                        name: 'formulacurrency', summary: search.Summary.SUM, label: 'HMLK đầu kỳ', type: 'currency',
                        formula: khtang + " - " + khgiam
                    };
                    let col3 = {
                        name: 'formulacurrency', summary: search.Summary.SUM, label: 'GTCL đầu kỳ', type: 'currency',
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
                        name: 'formulacurrency', summary: search.Summary.SUM, label: 'HMLK cuối kỳ', type: 'currency',
                        formula: khtang_ck + " - " + khgiam_ck
                    };
                    let col6 = {
                        name: 'formulacurrency', summary: search.Summary.SUM, label: 'GTCL cuối kỳ', type: 'currency',
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
                    let cadd = [col1, col2, col3, col7, col8, col9, col10, col4, col5, col6];
                    c = c.concat(cadd);
                    
                    s.columns = c;
                    s.filters = f;
                    let lcpush = c.length;
                    
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
                    let numPage = r.pageRanges.length;
                    let searchPage, tempData, numTemp, tampValue, line = 0, lineasset = 0;
                    let col = JSON.parse(JSON.stringify(c));
                    let vrNone = '- None -';
                    // Export Excel
                    let pRow = '', pColumnsTotal = '';
                    let startRow = '<Row ss:AutoFitHeight="0">', endRow = '</Row>';
                    let endCell = '</Data></Cell>';
                    let stCell71 = '<Cell ss:StyleID="s71"><Data ss:Type="String">';
                    let stCell73 = '<Cell ss:StyleID="s73"><Data ss:Type="String">';
                    let stCell83 = '<Cell ss:StyleID="s83"><Data ss:Type="Number">';
                    let stCell74 = '<Cell ss:StyleID="s74"><Data ss:Type="String">';
                    let stCell75End = '<Cell ss:StyleID="s75"/>';
                    let stCell69End = '<Cell ss:StyleID="s69"><Data ss:Type="String">Cộng</Data></Cell>';
                    let stCell89_fh = '<Cell ss:StyleID="s89" ss:Formula="=SUM(R[-';
                    let stCell89_sh = ']C:R[-1]C)"><Data ss:Type="Number">';
                    let stCell92 = '<Cell ss:StyleID="s92"><Data ss:Type="Number">';
                    
                    let arrAccount = getAccountAsset();
                    let vPre = '', vNext = '';
                    let arrTotal = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                    for (let np = 0; np < numPage; np++) {
                        searchPage = r.fetch({index: np});
                        tempData = searchPage.data;
                        if (tempData) {
                            numTemp = tempData.length;
                            let objDataTotal = {};
                            for (let i = 0; i < numTemp; i++) {
                                //Tong cong cho nhom
                                vNext = getValueDisplay(tempData[i], col[0], c[0]);
                                if (vNext !== vPre && line > 0) {
                                    pRow = pRow + startRow + stCell74 + vPre + endCell;
                                    pRowPdf = pRowPdf + startRowBoldPdf + startCellPdf + vPre + endCellPdf;
                                    for (let j = 0; j < pos_slice - 2; j++) {
                                        pRow = pRow + stCell75End;
                                        pRowPdf = pRowPdf + cellEndPdf;
                                    }
                                    pRow = pRow + stCell69End;
                                    pRowPdf = pRowPdf + stCellCongEndPdf;
                                    for (let j = 0; j < arrTotal.length; j++) {
                                        pRow = pRow + stCell89_fh + lineasset + stCell89_sh + endCell;
                                        pRowPdf = pRowPdf + startRightCellPdf + changeCurrency(objDataTotal[j]) + endCellPdf; // Calculator
                                    }
                                    pRow = pRow + endRow;
                                    pRowPdf = pRowPdf + endRowPdf;
                                    line++;
                                    lineasset = 0;
                                    objDataTotal = {};
                                }
                                vPre = vNext;
                                pRow = pRow + startRow;
                                pRowPdf = pRowPdf + startRowPdf;
                                for (let j = 0; j < lcpush; j++) {
                                    tampValue = getValueDisplay(tempData[i], col[j], c[j]);
                                    if (libFunc.isContainValue(tampValue) === false || tampValue === vrNone) {
                                        tampValue = '';
                                    }
                                    if (j === 0) {
                                        pRow = pRow + stCell71 + libFunc.reText(tampValue) + endCell;
                                        pRowPdf = pRowPdf + startCellPdf + libFunc.reText(tampValue) + endCellPdf;
                                    } else if (j < 7 || j === 8 || j === 9) {
                                        if (j === 5) {
                                            tampValue = arrAccount.find(o => o.id_assetmainacc === tempData[i].getValue(c[j]))?.number_assetmainacc;
                                        } else if (j === 6) {
                                            tampValue = arrAccount.find(o => o.id === tempData[i].getValue(c[j]))?.number;
                                        }
                                        pRow = pRow + stCell73 + libFunc.reText(tampValue) + endCell;
                                        pRowPdf = pRowPdf + startCellPdf + libFunc.reText(tampValue) + endCellPdf;
                                    } else if (j === 7) {
                                        pRow = pRow + stCell83 + tampValue + endCell;
                                        pRowPdf = pRowPdf + startCellPdf + tampValue + endCellPdf;
                                    } else {
                                        pRow = pRow + stCell83 + tampValue + endCell;
                                        pRowPdf = pRowPdf + startRightCellPdf + changeCurrency(tampValue) + endCellPdf;
                                    }
                                    if (j >= pos_slice) {
                                        let startColSum = j - pos_slice; // j - 10
                                        arrTotal[startColSum] = arrTotal[startColSum] + tampValue * 1;
                                        objDataTotal[startColSum] = (objDataTotal?.[startColSum] || 0) + (+tampValue || 0);
                                    }
                                }
                                pRow = pRow + endRow;
                                pRowPdf = pRowPdf + endRowPdf;
                                line++;
                                lineasset++;
                            }
                        }
                    }
                    
                    //Tong cong cho nhom cuoi
                    pRow = pRow + startRow + stCell74 + vPre + endCell;
                    pRowPdf = pRowPdf + startRowBoldPdf + startCellPdf + vPre + endCellPdf;
                    for (let j = 0; j < pos_slice - 2; j++) {
                        pRow = pRow + stCell75End;
                        pRowPdf = pRowPdf + cellEndPdf;
                    }
                    pRow = pRow + stCell69End;
                    pRowPdf = pRowPdf + stCellCongEndPdf;
                    for (let j = 0; j < arrTotal.length; j++) {
                        pRow = pRow + stCell89_fh + lineasset + stCell89_sh + endCell;
                        pRowPdf = pRowPdf + startRightCellPdf + lineasset + endCellPdf;
                    }
                    pRow = pRow + endRow;
                    pRowPdf = pRowPdf + endRowPdf;
                    line++;
                    
                    //Tong cong tat ca
                    pRowPdf = pRowPdf + startRowBoldPdf;
                    for (let j = 0; j < 9; j++) {
                        pRowPdf += cellEndPdf;
                    }
                    pRowPdf = pRowPdf + pCellTongCongPdf;
                    for (let j = 0; j < arrTotal.length; j++) {
                        pColumnsTotal = pColumnsTotal + stCell92 + arrTotal[j] + endCell;
                        pRowPdf = pRowPdf + startRightCellPdf + changeCurrency(arrTotal[j]) + endCellPdf;
                    }
                    pRowPdf = pRowPdf + endRowPdf;
                    
                    // Render pdf
                    try {
                        if (isPrint === "T") {
                            let subsidiarytext = parameters.custpage_subsidiarytext;
                            let objData = {
                                pSubsidiary: subsidiarytext,
                                pDatefrom: date_dauky,
                                pDateto: date_cuoiky,
                                pAssetCategory: asset_category_text,
                                pAsset: asset_text,
                                pBodyTable: pRowPdf,
                                reportype: reportype,
                            };
                            let f = onRenderPdf(objData);
                            response.writeFile(f, true);
                            return;
                        }
                    } catch (err) {
                        log.error('Err: ', err)
                    }
                    
                    // Render excel
                    let path = '../xml/fam_report/';
                    let namefilexml = 'SCV_PBKH_TSCD';
                    if (namefilexml) {
                        let fileObject = file.load({id: path + namefilexml + '.xml'});
                        content = fileObject.getContents();
                        let subsidiarytext = parameters.custpage_subsidiarytext;
                        content = content.replace(/{pSubsidiary}/gi, subsidiarytext);
                        content = content.replace(/{pDatefrom}/gi, date_dauky);
                        content = content.replace(/{pDateto}/gi, date_cuoiky);
                        content = content.replace(/{pAssetCategory}/gi, asset_category_text);
                        content = content.replace(/{pAsset}/gi, asset_text);
                        content = content.replace(/{pExpandedRowCount}/gi, 995 + line);
                        content = content.replace(/{pRow}/gi, pRow);
                        content = content.replace(/{pColumnsTotal}/gi, pColumnsTotal);
                        
                        namefile = namefilexml.substring(4, namefilexml.length) + '.xls';
                    }
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
                        name: 'formulacurrency', summary: search.Summary.SUM, label: 'HMLK đầu kỳ', type: 'currency',
                        formula: khtang + " - " + khgiam
                    };
                    let col3 = {
                        name: 'formulacurrency', summary: search.Summary.SUM, label: 'GTCL đầu kỳ', type: 'currency',
                        formula: ngtang + " - " + nggiam + " - " + khtang + " + " + khgiam
                    };
                    
                    let ngtang_ck = "(case when {custrecord_deprhisttype} = 'Acquisition' then {custrecord_deprhistamount} when {custrecord_deprhisttype} = 'Write-down' and {custrecord_deprhistamount} < 0 then - {custrecord_deprhistamount} else 0 end)";
                    let nggiam_ck = "(case when ({custrecord_deprhisttype} = 'Disposal' or {custrecord_deprhisttype} = 'Sale'  or {custrecord_deprhisttype} = 'Transfer') then {custrecord_deprhistamount} when {custrecord_deprhisttype} = 'Write-down' and {custrecord_deprhistamount} > 0 then {custrecord_deprhistamount} else 0 end)";
                    let khtang_ck = "case when ({custrecord_deprhisttype} = 'Depreciation' or {custrecord_deprhisttype} = 'Revaluation') then case when {custrecord_deprhistamount} > 0 then {custrecord_deprhistamount} else 0 end else 0 end";
                    let khgiam_ck = "case when ({custrecord_deprhisttype} = 'Depreciation' or {custrecord_deprhisttype} = 'Revaluation') then case when {custrecord_deprhistamount} < 0 then -{custrecord_deprhistamount} else 0 end else 0 end";
                    let col5 = {
                        name: 'formulacurrency', summary: search.Summary.SUM, label: 'HMLK cuối kỳ', type: 'currency',
                        formula: khtang_ck + " - " + khgiam_ck
                    };
                    let col6 = {
                        name: 'formulacurrency', summary: search.Summary.SUM, label: 'GTCL cuối kỳ', type: 'currency',
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
                    let cadd = [col1, col2, col3, col9, col5, col6];
                    c = c.concat(cadd);
                    
                    s.columns = c;
                    s.filters = f;
                    let lcpush = c.length;
                    
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
                    let numPage = r.pageRanges.length;
                    let searchPage, tempData, numTemp, tampValue, line = 0, lineasset = 0;
                    let col = JSON.parse(JSON.stringify(c));
                    let vrNone = '- None -';
                    let pRow = '', pColumnsTotal = '';
                    let startRow = '<Row ss:AutoFitHeight="0">', endRow = '</Row>';
                    let endCell = '</Data></Cell>';
                    let stCell71 = '<Cell ss:StyleID="s71"><Data ss:Type="String">';
                    let stCell73 = '<Cell ss:StyleID="s73"><Data ss:Type="String">';
                    let stCell83 = '<Cell ss:StyleID="s83"><Data ss:Type="Number">';
                    let stCell74 = '<Cell ss:StyleID="s74"><Data ss:Type="String">';
                    let stCell75End = '<Cell ss:StyleID="s75"/>';
                    let stCell69End = '<Cell ss:StyleID="s69"><Data ss:Type="String">Cộng</Data></Cell>';
                    let stCell89_fh = '<Cell ss:StyleID="s89" ss:Formula="=SUM(R[-';
                    let stCell89_sh = ']C:R[-1]C)"><Data ss:Type="Number">';
                    let stCell92 = '<Cell ss:StyleID="s92"><Data ss:Type="Number">';
                    
                    //Render Pdf
                    let pRowPdf = '';
                    let arrAccount = getAccountAsset();
                    let vPre = '', vNext = '';
                    let arrTotal = [0, 0, 0, 0, 0, 0], objDataTotal = {};
                    for (let np = 0; np < numPage; np++) {
                        searchPage = r.fetch({index: np});
                        tempData = searchPage.data;
                        if (tempData) {
                            numTemp = tempData.length;
                            for (let i = 0; i < numTemp; i++) {
                                //Tong cong cho nhom
                                vNext = getValueDisplay(tempData[i], col[0], c[0]);
                                if (vNext !== vPre && line > 0) {
                                    pRow = pRow + startRow + stCell74 + vPre + endCell;
                                    pRowPdf = pRowPdf + startRowBoldPdf + startCellPdf + vPre + endCellPdf;
                                    for (let j = 0; j < pos_slice - 2; j++) {
                                        pRow = pRow + stCell75End;
                                        pRowPdf = pRowPdf + cellEndPdf;
                                    }
                                    pRow = pRow + stCell69End;
                                    pRowPdf = pRowPdf + stCellCongEndPdf;
                                    for (let j = 0; j < 6; j++) {
                                        pRow = pRow + stCell89_fh + lineasset + stCell89_sh + endCell;
                                        pRowPdf = pRowPdf + startRightCellPdf + changeCurrency(objDataTotal[j]) + endCellPdf;
                                    }
                                    pRow = pRow + endRow;
                                    pRowPdf = pRowPdf + endRowPdf;
                                    line++;
                                    lineasset = 0;
                                    objDataTotal = {};
                                }
                                vPre = vNext;
                                pRow = pRow + startRow;
                                pRowPdf = pRowPdf + startRowPdf;
                                for (let j = 0; j < lcpush; j++) {
                                    tampValue = getValueDisplay(tempData[i], col[j], c[j]);
                                    if (libFunc.isContainValue(tampValue) === false || tampValue === vrNone) {
                                        tampValue = '';
                                    }
                                    if (j === 0) {
                                        pRow = pRow + stCell71 + libFunc.reText(tampValue) + endCell;
                                        pRowPdf = pRowPdf + startCellPdf + libFunc.reText(tampValue) + endCellPdf;
                                    } else if (j < 7 || j === 8 || j === 9) {
                                        if (j === 5) {
                                            tampValue = arrAccount.find(o => o.id_assetmainacc === tempData[i].getValue(c[j]))?.number_assetmainacc;
                                        } else if (j === 6) {
                                            tampValue = arrAccount.find(o => o.id === tempData[i].getValue(c[j]))?.number;
                                        }
                                        pRow = pRow + stCell73 + libFunc.reText(tampValue) + endCell;
                                        pRowPdf = pRowPdf + startCellPdf + libFunc.reText(tampValue) + endCellPdf;
                                    } else if (j === 7) {
                                        pRow = pRow + stCell83 + tampValue + endCell;
                                        pRowPdf = pRowPdf + startCellPdf + tampValue + endCellPdf;
                                    } else {
                                        pRow = pRow + stCell83 + tampValue + endCell;
                                        pRowPdf = pRowPdf + startRightCellPdf + changeCurrency(tampValue) + endCellPdf;
                                    }
                                    if (j >= pos_slice) {
                                        let startColSum = j - pos_slice;
                                        arrTotal[j - pos_slice] = arrTotal[j - pos_slice] + tampValue * 1;
                                        objDataTotal[startColSum] = (objDataTotal?.[startColSum] || 0) + (+tampValue || 0);
                                    }
                                    
                                }
                                pRow = pRow + endRow;
                                pRowPdf = pRowPdf + endRowPdf;
                                line++;
                                lineasset++;
                            }
                        }
                    }
                    
                    //Tong cong cho nhom cuoi
                    pRow = pRow + startRow + stCell74 + vPre + endCell;
                    pRowPdf = pRowPdf + startRowBoldPdf + startCellPdf + vPre + endCellPdf;
                    for (let j = 0; j < pos_slice - 2; j++) {
                        pRow = pRow + stCell75End;
                        pRowPdf = pRowPdf + cellEndPdf;
                    }
                    pRow = pRow + stCell69End;
                    pRowPdf = pRowPdf + stCellCongEndPdf;
                    for (let j = 0; j < 6; j++) {
                        pRow = pRow + stCell89_fh + lineasset + stCell89_sh + endCell;
                        pRowPdf = pRowPdf + startRightCellPdf + changeCurrency(objDataTotal[j]) + endCellPdf;
                    }
                    pRow = pRow + endRow;
                    pRowPdf = pRowPdf + endRowPdf;
                    line++;
                    
                    //Tong cong tat ca
                    pRowPdf = pRowPdf + startRowBoldPdf;
                    for (let j = 0; j < 9; j++) {
                        pRowPdf += cellEndPdf;
                    }
                    pRowPdf = pRowPdf + pCellTongCongPdf;
                    for (let j = 0; j < 6; j++) {
                        pColumnsTotal = pColumnsTotal + stCell92 + arrTotal[j] + endCell;
                        pRowPdf = pRowPdf + startRightCellPdf + changeCurrency(arrTotal[j]) + endCellPdf;
                    }
                    pRowPdf = pRowPdf + endRowPdf;
                    
                    // Render pdf
                    try {
                        if (isPrint === "T") {
                            let subsidiarytext = parameters.custpage_subsidiarytext;
                            let objData = {
                                pSubsidiary: subsidiarytext,
                                pDatefrom: date_dauky,
                                pDateto: date_cuoiky,
                                pAssetCategory: asset_category_text,
                                pAsset: asset_text,
                                pBodyTable: pRowPdf,
                                reportype: reportype,
                            };
                            let f = onRenderPdf(objData);
                            response.writeFile(f, true);
                            return;
                        }
                    } catch (err) {
                        log.error('Err: ', err)
                    }
                    
                    let path = '../xml/fam_report/';
                    let namefilexml = 'SCV_BPB_CPTT';
                    if (namefilexml) {
                        let fileObject = file.load({id: path + namefilexml + '.xml'});
                        content = fileObject.getContents();
                        let subsidiarytext = parameters.custpage_subsidiarytext;
                        content = content.replace(/{pSubsidiary}/gi, subsidiarytext);
                        content = content.replace(/{pDatefrom}/gi, date_dauky);
                        content = content.replace(/{pDateto}/gi, date_cuoiky);
                        content = content.replace(/{pAssetCategory}/gi, asset_category_text);
                        content = content.replace(/{pAsset}/gi, asset_text);
                        content = content.replace(/{pExpandedRowCount}/gi, 995 + line);
                        content = content.replace(/{pRow}/gi, pRow);
                        content = content.replace(/{pColumnsTotal}/gi, pColumnsTotal);
                        
                        namefile = namefilexml.substring(4, namefilexml.length) + '.xls';
                    }
                } else if (reportype === 'biendong_tscd_hh') {
                    let ng_dudn = getValueDuDauNam('customsearch_scv_fam_summary_ng_dudn', subsidiary, date_dauky);
                    let ng = getValueTrongky('customsearch_scv_fam_summary_ng', subsidiary, date_dauky, date_cuoiky);
                    let gthm_dudn = getValueDuDauNam('customsearch_scv_fam_summary_gthm_dudn', subsidiary, date_dauky);
                    let gthm = getValueTrongky('customsearch_scv_fam_summary_gthm', subsidiary, date_dauky, date_cuoiky);
                    let endCell = '</Data></Cell>';
                    let cell_DUDN = '<Cell ss:StyleID="s131"><Data ss:Type="Number">';
                    let cell = '<Cell ss:StyleID="s135"><Data ss:Type="Number">';
                    let cellS = '<Cell ss:StyleID="s73"><Data ss:Type="String">';
                    let vrNone = '- None -';
                    let lc = ng_dudn.c.length;
                    let colNG_DUDN = '', colHM_DUDN = '';
                    
                    //Render Pdf
                    let colNG_DUDNPdf = '', colHM_DUDNPdf = '';
                    let defaultCol = addCellPdf(0, 6);
                    let objDataTotal = {
                        NG: {}, // Calc column
                        GTHM: {}, // Calc column
                        GTCL: {DN: {total: 0}, CN: {total: 0}},
                        DUDN: {NG: {total: 0}, GTHM: {total: 0}},
                        DUCN: {NG: {total: 0}, GTHM: {total: 0}},
                    };
                    for (let j = 1; j < lc; j++) {
                        if (ng_dudn.r.length > 0) {
                            colNG_DUDN = colNG_DUDN + cell_DUDN + ng_dudn.r[0].getValue(ng_dudn.c[j]) + endCell;
                            let valNg_DUDN = +ng_dudn.r[0].getValue(ng_dudn.c[j]) || 0;
                            colNG_DUDNPdf = colNG_DUDNPdf + startRightCellPdf + changeCurrency(valNg_DUDN) + endCellPdf;
                            objDataTotal.DUDN.NG[j] = valNg_DUDN;
                            objDataTotal.DUDN.NG.total += valNg_DUDN;
                            objDataTotal.NG[j] = +objDataTotal.NG?.[j] || 0 + valNg_DUDN;
                        }
                        if (gthm_dudn.r.length > 0) {
                            colHM_DUDN = colHM_DUDN + cell_DUDN + gthm_dudn.r[0].getValue(gthm_dudn.c[j]) + endCell;
                            let valGTHM_DUDN = +gthm_dudn.r[0].getValue(gthm_dudn.c[j]) || 0;
                            colHM_DUDNPdf = colHM_DUDNPdf + startRightCellPdf + changeCurrency(valGTHM_DUDN) + endCellPdf;
                            objDataTotal.DUDN.GTHM[j] = valGTHM_DUDN;
                            objDataTotal.DUDN.GTHM.total += valGTHM_DUDN;
                            objDataTotal.GTHM[j] = +objDataTotal.GTHM?.[j] || 0 + valGTHM_DUDN;
                        }
                    }
                    let pRowNGPdf = '', pRowHMPdf = '';
                    let pRowNG = '', pRowHM = '',
                        pColumnsTotal = '<Cell ss:StyleID="s135" ss:Formula="=SUM(RC[-6]:RC[-1])"><Data ss:Type="Number"></Data></Cell>';
                    let startRow = '<Row ss:AutoFitHeight="0">', endRow = '</Row>';
                    
                    let lNG = ng.r.length;
                    let formulaSDCN_NG = '=SUM(R[-' + (1 + lNG) + ']C:R[-1]C)';
                    if (lNG > 0) {
                        for (let i = 0; i < lNG; i++) {
                            pRowNG = pRowNG + startRow + makeCellNofirst(ng.r[i], cell, endCell, ng.c, cellS, vrNone) + pColumnsTotal + endRow;
                            let cellVs = makeCellNofirstPdf(ng.r[i], startRightCellPdf, endCellPdf, ng.c, startCellPdf, vrNone);
                            pRowNGPdf = pRowNGPdf + startRowPdf + cellVs + endRowPdf;
                            calcTotalColsPdf(objDataTotal.NG, ng.r[i], ng.c);
                        }
                    }
                    let lHM = gthm.r.length;
                    let formulaSDCN_HM = '=SUM(R[-' + (1 + lHM) + ']C:R[-1]C)';
                    if (lHM > 0) {
                        for (let i = 0; i < lHM; i++) {
                            pRowHM = pRowHM + startRow + makeCellNofirst(gthm.r[i], cell, endCell, gthm.c, cellS, vrNone) + pColumnsTotal + endRow;
                            let cellVs = makeCellNofirstPdf(gthm.r[i], startRightCellPdf, endCellPdf, gthm.c, startCellPdf, vrNone);
                            pRowHMPdf = pRowHMPdf + startRowPdf + cellVs + endRowPdf;
                            calcTotalColsPdf(objDataTotal.GTHM, gthm.r[i], gthm.c);
                        }
                    }
                    
                    let colNG_DUCNPdf = "", colHM_DUCNPdf = "", colGTCL_DNPdf = "", colGTCL_CNPdf = "";
                    
                    for (let i = 1; i < lc; i++) {
                        objDataTotal.GTCL.DN[i] = (+objDataTotal.DUDN.NG[i] || 0) - (+objDataTotal.DUDN.GTHM[i] || 0);
                        objDataTotal.GTCL.CN[i] = (+objDataTotal.NG[i] || 0) - (+objDataTotal.GTHM[i] || 0);
                        objDataTotal.DUCN.NG[i] = (+objDataTotal.NG[i] || 0);
                        objDataTotal.DUCN.GTHM[i] = (+objDataTotal.GTHM[i] || 0);
                        //Calc total
                        objDataTotal.GTCL.DN.total += objDataTotal.GTCL.DN[i];
                        objDataTotal.GTCL.CN.total += objDataTotal.GTCL.CN[i];
                        objDataTotal.DUCN.NG.total += +objDataTotal.NG[i] || 0; // Tong du no cuoi nam Nguyen Gia
                        objDataTotal.DUCN.GTHM.total += +objDataTotal.GTHM[i] || 0; // Tong du no cuoi nam Gia tri hao mon luy ke
                        
                        // Plus columns
                        colNG_DUCNPdf += startRightCellPdf + changeCurrency(objDataTotal.DUCN.NG[i]) + endCellPdf;
                        colHM_DUCNPdf += startRightCellPdf + changeCurrency(objDataTotal.DUCN.GTHM[i]) + endCellPdf;
                        colGTCL_DNPdf += startRightCellPdf + changeCurrency(objDataTotal.GTCL.DN[i]) + endCellPdf;
                        colGTCL_CNPdf += startRightCellPdf + changeCurrency(objDataTotal.GTCL.CN[i]) + endCellPdf;
                    }
                    let formularTNDN = '=R[-' + (6 + lNG + lHM) + ']C - R[-' + (3 + lHM) + ']C';
                    let formularTNCN = '=R[-' + (6 + lHM) + ']C - R[-3]C';
                    let pExpandedRowCount = 1000 + lNG + lHM;
                    
                    // Render pdf
                    try {
                        if (isPrint === "T") {
                            let subsidiarytext = parameters.custpage_subsidiarytext;
                            let contents = file.load('../xml/pdf/scv_render_rp_fam_bdvh_pdf.xml').getContents();
                            contents = contents.replace(/{pSubsidiary}/gi, subsidiarytext)
                                .replace(/{pDatefrom}/gi, date_dauky)
                                .replace(/{pDateto}/gi, date_cuoiky)
                                .replace(/{pAssetCategory}/gi, '')
                                .replace(/{pAsset}/gi, '')
                                .replace(/{colNG_DUDN}/gi, colNG_DUDNPdf || defaultCol)
                                .replace(/{pNGTongSoDuDauNam}/gi, changeCurrency(objDataTotal.DUDN.NG.total))
                                .replace(/{pNGTongSoDuCuoiNam}/gi, changeCurrency(objDataTotal.DUCN.NG.total))
                                .replace(/{colHM_DUDN}/gi, colHM_DUDNPdf || defaultCol)
                                .replace(/{pRowNG}/gi, pRowNGPdf)
                                .replace(/{colNG_DUCN}/gi, colNG_DUCNPdf)
                                .replace(/{pRowHM}/gi, pRowHMPdf)
                                .replace(/{colHM_DUCN}/gi, colHM_DUCNPdf)
                                .replace(/{pHMTongSoDuDauNam}/gi, changeCurrency(objDataTotal.DUDN.GTHM.total))
                                .replace(/{pHMTongSoDuCuoiNam}/gi, changeCurrency(objDataTotal.DUCN.GTHM.total))
                                .replace(/{colGTCL_DNPdf}/gi, colGTCL_DNPdf)
                                .replace(/{colGTCL_CNPdf}/gi, colGTCL_CNPdf)
                                .replace(/{pGTCL_DauNamTong}/gi, changeCurrency(objDataTotal.GTCL.DN.total))
                                .replace(/{pGTCL_CuoiNamTong}/gi, changeCurrency(objDataTotal.GTCL.CN.total));
                            let f = render.xmlToPdf({xmlString: contents});
                            f.name = "Báo cáo biến động TSCĐ HH.pdf";
                            response.writeFile(f, true);
                            return;
                        }
                    } catch (err) {
                        log.error('Err: ', err)
                    }
                    
                    
                    let path = '../xml/fam_report/';
                    let namefilexml = 'SCV_BBTS_HH';
                    if (namefilexml) {
                        let fileObject = file.load({id: path + namefilexml + '.xml'});
                        content = fileObject.getContents();
                        let subsidiarytext = parameters.custpage_subsidiarytext;
                        content = content.replace(/{pSubsidiary}/gi, subsidiarytext);
                        content = content.replace(/{pDatefrom}/gi, date_dauky);
                        content = content.replace(/{pDateto}/gi, date_cuoiky);
                        content = content.replace(/{pAssetCategory}/gi, '');
                        content = content.replace(/{pAsset}/gi, '');
                        content = content.replace(/{colNG_DUDN}/gi, colNG_DUDN);
                        content = content.replace(/{colHM_DUDN}/gi, colHM_DUDN);
                        content = content.replace(/{pExpandedRowCount}/gi, pExpandedRowCount);
                        content = content.replace(/{pRowNG}/gi, pRowNG);
                        content = content.replace(/{formulaSDCN_NG}/gi, formulaSDCN_NG);
                        content = content.replace(/{pRowHM}/gi, pRowHM);
                        content = content.replace(/{formulaSDCN_HM}/gi, formulaSDCN_HM);
                        content = content.replace(/{formularTNDN}/gi, formularTNDN);
                        content = content.replace(/{formularTNCN}/gi, formularTNCN);
                        
                        namefile = namefilexml.substring(4, namefilexml.length) + '.xls';
                    }
                } else if (reportype === 'biendong_tscd_vh') {
                    let ng_dudn = getValueDuDauNam('customsearch_scv_fam_summary_ng_dudn_vh', subsidiary, date_dauky);
                    let ng = getValueTrongky('customsearch_scv_fam_summary_ng_vh', subsidiary, date_dauky, date_cuoiky);
                    let gthm_dudn = getValueDuDauNam('customsearch_scv_fam_summary_gthm_dudn_v', subsidiary, date_dauky);
                    let gthm = getValueTrongky('customsearch_scv_fam_summary_gthm_vh', subsidiary, date_dauky, date_cuoiky);
                    let endCell = '</Data></Cell>';
                    let cell_DUDN = '<Cell ss:StyleID="s75"><Data ss:Type="Number">';
                    let cell = '<Cell ss:StyleID="s77"><Data ss:Type="Number">';
                    let cellS = '<Cell ss:StyleID="s76"><Data ss:Type="String">';
                    let vrNone = '- None -';
                    let lc = ng_dudn.c.length;
                    let colNG_DUDN = '', colHM_DUDN = '';
                    
                    //Render Pdf
                    let colNG_DUDNPdf = '', colHM_DUDNPdf = '';
                    let defaultCol = addCellPdf(0, 7);
                    let objDataTotal = {
                        NG: {}, // Calc column
                        GTHM: {}, // Calc column
                        GTCL: {DN: {total: 0}, CN: {total: 0}},
                        DUDN: {NG: {total: 0}, GTHM: {total: 0}},
                        DUCN: {NG: {total: 0}, GTHM: {total: 0}},
                    };
                    for (let j = 1; j < lc; j++) {
                        if (ng_dudn.r.length > 0) {
                            colNG_DUDN = colNG_DUDN + cell_DUDN + ng_dudn.r[0].getValue(ng_dudn.c[j]) + endCell;
                            let valNg_DUDN = +ng_dudn.r[0].getValue(ng_dudn.c[j]) || 0;
                            colNG_DUDNPdf = colNG_DUDNPdf + startRightCellPdf + changeCurrency(valNg_DUDN) + endCellPdf;
                            objDataTotal.DUDN.NG[j] = valNg_DUDN;
                            objDataTotal.DUDN.NG.total += valNg_DUDN;
                            objDataTotal.NG[j] = +objDataTotal.NG?.[j] || 0 + valNg_DUDN;
                        }
                        if (gthm_dudn.r.length > 0) {
                            colHM_DUDN = colHM_DUDN + cell_DUDN + gthm_dudn.r[0].getValue(gthm_dudn.c[j]) + endCell;
                            let valGTHM_DUDN = +gthm_dudn.r[0].getValue(gthm_dudn.c[j]) || 0;
                            colHM_DUDNPdf = colHM_DUDNPdf + startRightCellPdf + changeCurrency(valGTHM_DUDN) + endCellPdf;
                            objDataTotal.DUDN.GTHM[j] = valGTHM_DUDN;
                            objDataTotal.DUDN.GTHM.total += valGTHM_DUDN;
                            objDataTotal.GTHM[j] = +objDataTotal.GTHM?.[j] || 0 + valGTHM_DUDN;
                        }
                    }
                    let pRowNGPdf = '', pRowHMPdf = '';
                    let pRowNG = '', pRowHM = '',
                        pColumnsTotal = '<Cell ss:StyleID="s77" ss:Formula="=SUM(RC[-7]:RC[-1])"><Data ss:Type="Number"></Data></Cell>';
                    let startRow = '<Row ss:AutoFitHeight="0">', endRow = '</Row>';
                    
                    let lNG = ng.r.length;
                    let formulaSDCN_NG = '=SUM(R[-' + (1 + lNG) + ']C:R[-1]C)';
                    if (lNG > 0) {
                        for (let i = 0; i < lNG; i++) {
                            pRowNG = pRowNG + startRow + makeCellNofirst(ng.r[i], cell, endCell, ng.c, cellS, vrNone) + pColumnsTotal + endRow;
                            let cellVs = makeCellNofirstPdf(ng.r[i], startRightCellPdf, endCellPdf, ng.c, startCellPdf, vrNone);
                            pRowNGPdf = pRowNGPdf + startRowPdf + cellVs + endRowPdf;
                            calcTotalColsPdf(objDataTotal.NG, ng.r[i], ng.c);
                        }
                    }
                    let lHM = gthm.r.length;
                    let formulaSDCN_HM = '=SUM(R[-' + (1 + lHM) + ']C:R[-1]C)';
                    if (lHM > 0) {
                        for (let i = 0; i < lHM; i++) {
                            pRowHM = pRowHM + startRow + makeCellNofirst(gthm.r[i], cell, endCell, gthm.c, cellS, vrNone) + pColumnsTotal + endRow;
                            let cellVs = makeCellNofirstPdf(gthm.r[i], startRightCellPdf, endCellPdf, gthm.c, startCellPdf, vrNone);
                            pRowHMPdf = pRowHMPdf + startRowPdf + cellVs + endRowPdf;
                            calcTotalColsPdf(objDataTotal.GTHM, gthm.r[i], gthm.c);
                        }
                    }
                    
                    let colNG_DUCNPdf = "", colHM_DUCNPdf = "", colGTCL_DNPdf = "", colGTCL_CNPdf = "";
                    for (let i = 1; i < lc; i++) {
                        objDataTotal.GTCL.DN[i] = (+objDataTotal.DUDN.NG[i] || 0) - (+objDataTotal.DUDN.GTHM[i] || 0);
                        objDataTotal.GTCL.CN[i] = (+objDataTotal.NG[i] || 0) - (+objDataTotal.GTHM[i] || 0);
                        objDataTotal.DUCN.NG[i] = (+objDataTotal.NG[i] || 0);
                        objDataTotal.DUCN.GTHM[i] = (+objDataTotal.GTHM[i] || 0);
                        //Calc total
                        objDataTotal.GTCL.DN.total += objDataTotal.GTCL.DN[i];
                        objDataTotal.GTCL.CN.total += objDataTotal.GTCL.CN[i];
                        objDataTotal.DUCN.NG.total += +objDataTotal.NG[i] || 0; // Tong du no cuoi nam Nguyen Gia
                        objDataTotal.DUCN.GTHM.total += +objDataTotal.GTHM[i] || 0; // Tong du no cuoi nam Gia tri hao mon luy ke
                        
                        // Plus columns
                        colNG_DUCNPdf += startRightCellPdf + changeCurrency(objDataTotal.DUCN.NG[i]) + endCellPdf;
                        colHM_DUCNPdf += startRightCellPdf + changeCurrency(objDataTotal.DUCN.GTHM[i]) + endCellPdf;
                        colGTCL_DNPdf += startRightCellPdf + changeCurrency(objDataTotal.GTCL.DN[i]) + endCellPdf;
                        colGTCL_CNPdf += startRightCellPdf + changeCurrency(objDataTotal.GTCL.CN[i]) + endCellPdf;
                    }
                    
                    let formularTNDN = '=R[-' + (6 + lNG + lHM) + ']C - R[-' + (3 + lHM) + ']C';
                    let formularTNCN = '=R[-' + (6 + lHM) + ']C - R[-3]C';
                    let pExpandedRowCount = 1000 + lNG + lHM;
                    
                    // Render pdf
                    try {
                        if (isPrint === "T") {
                            let subsidiarytext = parameters.custpage_subsidiarytext;
                            let contents = file.load('../xml/pdf/scv_render_rp_fam_bdvh_pdf.xml').getContents();
                            contents = contents.replace(/{pSubsidiary}/gi, subsidiarytext)
                                .replace(/{pDatefrom}/gi, date_dauky)
                                .replace(/{pDateto}/gi, date_cuoiky)
                                .replace(/{pAssetCategory}/gi, '')
                                .replace(/{pAsset}/gi, '')
                                .replace(/{colNG_DUDN}/gi, colNG_DUDNPdf || defaultCol)
                                .replace(/{pNGTongSoDuDauNam}/gi, changeCurrency(objDataTotal.DUDN.NG.total))
                                .replace(/{pNGTongSoDuCuoiNam}/gi, changeCurrency(objDataTotal.DUCN.NG.total))
                                .replace(/{colHM_DUDN}/gi, colHM_DUDNPdf || defaultCol)
                                .replace(/{pRowNG}/gi, pRowNGPdf)
                                .replace(/{colNG_DUCN}/gi, colNG_DUCNPdf)
                                .replace(/{pRowHM}/gi, pRowHMPdf)
                                .replace(/{colHM_DUCN}/gi, colHM_DUCNPdf)
                                .replace(/{pHMTongSoDuDauNam}/gi, changeCurrency(objDataTotal.DUDN.GTHM.total))
                                .replace(/{pHMTongSoDuCuoiNam}/gi, changeCurrency(objDataTotal.DUCN.GTHM.total))
                                .replace(/{colGTCL_DNPdf}/gi, colGTCL_DNPdf)
                                .replace(/{colGTCL_CNPdf}/gi, colGTCL_CNPdf)
                                .replace(/{pGTCL_DauNamTong}/gi, changeCurrency(objDataTotal.GTCL.DN.total))
                                .replace(/{pGTCL_CuoiNamTong}/gi, changeCurrency(objDataTotal.GTCL.CN.total));
                            let f = render.xmlToPdf({xmlString: contents});
                            f.name = "Báo cáo biến động TSCĐ HH.pdf";
                            response.writeFile(f, true);
                            return;
                        }
                    } catch (err) {
                        log.error('Err: ', err)
                    }
                    
                    let path = '../xml/fam_report/';
                    let namefilexml = 'SCV_BBTS_VH';
                    if (namefilexml) {
                        let fileObject = file.load({id: path + namefilexml + '.xml'});
                        content = fileObject.getContents();
                        let subsidiarytext = parameters.custpage_subsidiarytext;
                        content = content.replace(/{pSubsidiary}/gi, subsidiarytext);
                        content = content.replace(/{pDatefrom}/gi, date_dauky);
                        content = content.replace(/{pDateto}/gi, date_cuoiky);
                        content = content.replace(/{pAssetCategory}/gi, '');
                        content = content.replace(/{pAsset}/gi, '');
                        content = content.replace(/{colNG_DUDN}/gi, colNG_DUDN);
                        content = content.replace(/{colHM_DUDN}/gi, colHM_DUDN);
                        content = content.replace(/{pExpandedRowCount}/gi, pExpandedRowCount);
                        content = content.replace(/{pRowNG}/gi, pRowNG);
                        content = content.replace(/{formulaSDCN_NG}/gi, formulaSDCN_NG);
                        content = content.replace(/{pRowHM}/gi, pRowHM);
                        content = content.replace(/{formulaSDCN_HM}/gi, formulaSDCN_HM);
                        content = content.replace(/{formularTNDN}/gi, formularTNDN);
                        content = content.replace(/{formularTNCN}/gi, formularTNCN);
                        
                        namefile = namefilexml.substring(4, namefilexml.length) + '.xls';
                    }
                }
                let f = file.create({
                    name: namefile,
                    fileType: file.Type.XMLDOC,
                    contents: content,
                    encoding: file.Encoding.UTF8,
                });
                response.writeFile(f, false);
                
            }
        }
        
        const addCellPdf = (val, nVal) => {
            let newStr = '';
            for (let i = 0; i < nVal; i++) {
                newStr += `<td><p text-align = "right">${val}</p></td>`;
            }
            return newStr;
        }
        
        // Change currency
        const changeCurrency = (number, range = 0) => {
            if (!!number) {
                let parts = (+number).toFixed(range).split(".");
                parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                if (parts[1] !== '00') {
                    return parts.join(".");
                } else {
                    return parts[0];
                }
            }
            return number;
        }
        
        //Update function renderPdf
        const onRenderPdf = (objData) => {
            let pTitle = getTitleReportPdf(objData.reportype);
            let pHeaderTable = getHeaderTablePdf(objData.reportype);
            let pFontSize = "7pt";
            let content = file.load("../xml/pdf/scv_render_rp_fam_pdf.xml").getContents();
            content = content
                .replace(/{pSubsidiary}/gi, objData.pSubsidiary)
                .replace(/{pDatefrom}/gi, objData.pDatefrom)
                .replace(/{pDateto}/gi, objData.pDateto)
                .replace(/{pAssetCategory}/gi, objData.pAssetCategory)
                .replace(/{pAsset}/gi, objData.pAsset)
                .replace(/{pTitle}/gi, pTitle)
                .replace(/{pFontSize}/gi, pFontSize)
                .replace(/{pHeaderTable}/gi, pHeaderTable)
                .replace(/{pBodyTable}/gi, objData.pBodyTable);
            
            return render.xmlToPdf({xmlString: content});
        }
        
        const getTitleReportPdf = (reportId) => {
            let container = {}
            container.customsearch_scv_fa_detail = "Bảng phân bổ khấu hao TSSCĐ";
            container.bangphanbo_cp_tra_truoc = "Bảng phân bổ CP trả trước";
            container.biendong_tscd_hh = "Báo cáo biến động TSCĐ HH";
            container.biendong_tscd_vh = "Biến động TSCĐ VH";
            return container[reportId]
        }
        
        
        const getHeaderTablePdf = (reportId) => {
            let container = {};
            //"Bảng phân bổ khấu hao TSSCĐ"
            container.customsearch_scv_fa_detail = `
						<tr> <td width = "8%" border = "none"/> <td width = "4%" border = "none"/> <td width = "4%" border = "none"/> <td width = "4%" border = "none"/> <td width = "4%" border = "none"/> <td width = "4%" border = "none"/> <td width = "4%" border = "none"/> <td width = "4%" border = "none"/> <td width = "4%" border = "none"/> <td width = "4%" border = "none"/> <td width = "8%" border = "none"/> <td width = "4%" border = "none"/> <td width = "6%" border = "none"/> <td width = "6%" border = "none"/> <td width = "6%" border = "none"/> <td width = "6%" border = "none"/> <td width = "6%" border = "none"/> <td width = "6%" border = "none"/> <td width = "6%" border = "none"/> <td width = "6%" border = "none"/> </tr> 
						<tr border-top = "1pt solid black"> <td><p>Asset category</p></td> <td><p>Subsidiary</p></td> <td><p>Mã TSCĐ</p></td> <td><p>Tên TSCĐ</p></td> <td><p>Bộ phận sử dụng</p></td> <td><p>TK chi phí khấu hao</p></td> <td><p>Số lượng</p></td> <td><p>Đơn vị tính</p></td> <td><p>Ngày bắt đầu trích KH</p></td> <td><p>Thời gian sử dụng</p></td> <td><p>Nguyên giá đầu kỳ</p></td> <td><p>HMLK đầu kỳ</p></td> <td><p>GTCL đầu kỳ</p></td> <td><p>Nguyên giá tăng trong kỳ</p></td> <td><p>Nguyên giá giảm trong kỳ</p></td> <td><p>Khấu hao tăng trong kỳ</p></td> <td><p>Khấu hao giảm trong kỳ</p></td> <td><p>Nguyên giá cuối kỳ</p></td> <td><p>HMLK cuối kỳ</p></td> <td><p>GTCL cuối kỳ</p></td> </tr>
						<tr> <td>1</td> <td>2</td> <td>3</td> <td>4</td> <td>5</td> <td>6</td> <td>7</td> <td>8</td> <td>9</td> <td>10</td> <td>11</td> <td>12</td> <td>13</td> <td>14</td> <td>15</td> <td>16</td> <td>17</td> <td>18</td> <td>19</td> <td>20</td> </tr>`;
            container.biendong_tscd_hh = `
				<tr> <td width="16%" border="none"/> <td width="12%" border="none"/> <td width="12%" border="none"/> <td width="12%" border="none"/> <td width="12%" border="none"/> <td width="12%" border="none"/> <td width="12%" border="none"/> <td width="12%" border="none"/> </tr>
				<tr border-top ="1pt solid black"> <td><p>Khoản mục</p></td> <td><p>Nhà cửa; vật kiến trúc</p></td> <td><p>Máy móc thiết bị</p></td> <td><p>Phương tiện vận tải truyền dẫn</p></td> <td><p>Thiết bị dụng cụ quản lý</p></td> <td><p>Cây lâu năm; súc vật làm việc và cho sản phẩm</p></td> <td><p>TSCD khác</p></td> <td><p>Tổng cộng</p></td> </tr>
		`;
            container.biendong_tscd_vh = `
				<tr> <td width="13%" border="none"/> <td width="11%" border="none"/> <td width="11%" border="none"/> <td width="11%" border="none"/> <td width="11%" border="none"/> <td width="11%" border="none"/> <td width="11%" border="none"/> <td width="11%" border="none"/> <td width="11%" border="none"/> </tr> 
				<tr border-top ="1pt solid black"> <td><p>Khoản mục</p></td> <td><p>Quyền sử dụng đất</p></td> <td><p>Quyền phát hành</p></td> <td><p>Bản quyền; bằng sáng chế</p></td> <td><p>Nhãn hiệu; tên thương mại</p></td> <td><p>Chương trình phần mềm</p></td> <td><p>Giấy phép và giấy phép nhượng quyền</p></td> <td><p>TSCĐ vô hình khác</p></td> <td><p>Tổng cộng</p></td> </tr>
		`;
            container.bangphanbo_cp_tra_truoc = `
			<tr> <td width="10.0%" border = 'none'/> <td width="5.0%" border = 'none'/> <td width="5.0%" border = 'none'/> <td width="5.0%" border = 'none'/> <td width="5.0%" border = 'none'/> <td width="5.0%" border = 'none'/> <td width="5.0%" border = 'none'/> <td width="5.0%" border = 'none'/> <td width="5.0%" border = 'none'/> <td width="5.0%" border = 'none'/> <td width="7.5%" border = 'none'/> <td width="7.5%" border = 'none'/> <td width="7.5%" border = 'none'/> <td width="7.5%" border = 'none'/> <td width="7.5%" border = 'none'/> <td width="7.5%" border = 'none'/> </tr>
			<tr border-top = "1pt solid black"> <td><p>Asset category</p></td> <td><p>Subsidiary</p></td> <td><p>Mã CCDC/CPTT</p></td> <td><p>Tên CCDC/CCPTT</p></td> <td><p>Bộ phận sử dụng</p></td> <td><p>TK phân bổ</p></td> <td><p>Số lượng</p></td> <td><p>Đơn vị tính</p></td> <td><p>Ngày bắt đầu trích KH</p></td> <td><p>Thời gian sử dụng</p></td> <td><p>Nguyên giá</p></td> <td><p>Giá trị đã phân bổ</p></td> <td><p>Giá trị còn lại đầu kỳ</p></td> <td><p>Giá trị phân bổ trong kỳ</p></td> <td><p>Tổng giá trị PB</p></td> <td><p>Giá trị còn lại</p></td> </tr> 
			<tr> <td>1</td> <td>2</td> <td>3</td> <td>4</td> <td>5</td> <td>6</td> <td>7</td> <td>8</td> <td>9</td> <td>10</td> <td>11</td> <td>12</td> <td>13</td> <td>14</td> <td>15</td> <td>16</td> </tr> `;
            return container[reportId];
        }
        
        const getNumberAccount = (_arrAcc, _AccID) => {
            for (let i = 0; i < _arrAcc.length; i++) {
                if (_arrAcc[i].id === _AccID) {
                    return _arrAcc[i].number;
                }
            }
            return null;
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
        
        const makeCellNofirst = (row, cell, endCell, c, cellS, vrNone) => {
            let lc = c.length;
            let cellVs = '';
            let col = JSON.parse(JSON.stringify(c));
            let vTemp;
            for (let j = 0; j < lc; j++) {
                if (j === 0) {
                    vTemp = libRep.getValueDisplay(row, col[j], c[j]);
                    if (vTemp === vrNone) {
                        vTemp = '';
                    }
                    cellVs = cellVs + cellS + vTemp + endCell;
                } else {
                    cellVs = cellVs + cell + row.getValue(c[j]) + endCell;
                }
            }
            return cellVs;
        }
        
        // Add row
        const makeCellNofirstPdf = (row, cell, endCell, c, cellS, vrNone) => {
            let lc = c.length;
            let cellVs = '';
            let totalCell = 0;
            let col = JSON.parse(JSON.stringify(c));
            let vTemp;
            for (let j = 0; j < lc; j++) {
                if (j === 0) {
                    vTemp = libRep.getValueDisplay(row, col[j], c[j]);
                    if (vTemp === vrNone) {
                        vTemp = '';
                    }
                    cellVs = cellVs + cellS + vTemp + endCell;
                } else {
                    cellVs = cellVs + cell + changeCurrency(row.getValue(c[j])) + endCell;
                    totalCell += +row.getValue(c[j]) || 0;
                }
            }
            let cellTotal = cell + changeCurrency(totalCell) + endCell; // Cell total
            cellVs += cellTotal;
            return cellVs;
        }
        
        // Add Calc Total Column
        const calcTotalColsPdf = (objDataTotal, row, c) => {
            let lc = c.length;
            for (let j = 1; j < lc; j++) {
                objDataTotal[j] = (+objDataTotal?.[j] || 0) + (+row.getValue(c[j]) || 0);
            }
        }
        
        const getValueDuDauNam = (reporttype, subsidiary, date_dauky) => {
            let s = search.load(reporttype);
            let c = s.columns;
            let f = s.filters;
            f.push(search.createFilter({name: 'subsidiary', operator: search.Operator.ANYOF, values: subsidiary}));
            f.push(search.createFilter({name: 'trandate', operator: search.Operator.BEFORE, values: date_dauky}));
            s.filters = f;
            let r;
            try {
                r = s.run().getRange({start: 0, end: 1000});
            } catch (e) {
                log.error('exception', e);
                log.error('value', 'reporttype: ' + reporttype + ', subsidiary: ' + subsidiary + ', date_dauky: ' + date_dauky);
                r = s.run().getRange({start: 0, end: 1000});
            }
            return {r: r, c: c};
        }
        
        const getValueTrongky = (reporttype, subsidiary, date_dauky, date_cuoiky) => {
            let s = search.load(reporttype);
            let c = s.columns;
            let f = s.filters;
            f.push(search.createFilter({name: 'subsidiary', operator: search.Operator.ANYOF, values: subsidiary}));
            f.push(search.createFilter({name: 'trandate', operator: search.Operator.ONORAFTER, values: date_dauky}));
            f.push(search.createFilter({name: 'trandate', operator: search.Operator.ONORBEFORE, values: date_cuoiky}));
            s.filters = f;
            let r;
            try {
                r = s.run().getRange({start: 0, end: 1000});
            } catch (e) {
                log.error('exception', e);
                log.error('value', 'reporttype: ' + reporttype + ', subsidiary: ' + subsidiary + ', date_dauky: ' + date_dauky + ', date_cuoiky: ' + date_cuoiky);
                r = s.run().getRange({start: 0, end: 1000});
            }
            return {r: r, c: c};
        }
        
        const getValueDisplay = (row, col, cl) => {
            let tampValue;
            if (col.type === 'select' && col.name !== 'subsidiarynohierarchy') {
                tampValue = row.getText(cl);
            } else {
                tampValue = row.getValue(cl);
            }
            return tampValue;
        }
        
        return {
            onRequest
        };
        
    });
