/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(
    ['N/file', 'N/render', 'N/runtime', 'N/search', 'N/ui/serverWidget', 'N/xml',
        '../lib/scv_lib_function.js', '../lib/scv_lib_report.js'],
    
    (file, render, runtime, search, serverWidget, xml, libFunc, libRep) => {
        
        const onRequest = (context) => {
            let request = context.request;
            let response = context.response;
            let parameters = request.parameters;
            let master = getSublistColMaster();
            let OBJ_REPORT_TYPE = master.OBJ_REPORT_TYPE;
            let reportype = (parameters.p1 === '1' ? OBJ_REPORT_TYPE.CT_CN : parameters.p1 === '2' ? OBJ_REPORT_TYPE.CT_CDPS : parameters.p1 === '3' ? OBJ_REPORT_TYPE.CT_SQT : '') || parameters.custpage_reportype;
            parameters.custpage_reportype = reportype;
            let subsidiary = (parameters.p2 === 'undefined' ? '' : parameters.p2) || parameters.custpage_subsidiary;
            parameters.custpage_subsidiary = subsidiary;
            let entity = (parameters.p5 === 'undefined' ? '' : parameters.p5) || parameters.custpage_entity;
            parameters.custpage_entity = entity;
            let date_dauky = (parameters.p3 === 'undefined' ? '' : parameters.p3) || parameters.custpage_date_dauky;
            parameters.custpage_date_dauky = date_dauky;
            let date_cuoiky = (parameters.p4 === 'undefined' ? '' : parameters.p4) || parameters.custpage_date_cuoiky;
            parameters.custpage_date_cuoiky = date_cuoiky;
            let currencyvalue = (parameters.p6 === 'undefined' ? '' : parameters.p6) || parameters.custpage_currencyvalue;
            parameters.custpage_currencyvalue = currencyvalue;
            let currencytext = parameters.custpage_currencytext;
            let account = (parameters.p7 === 'undefined' ? '' : parameters.p7) || parameters.custpage_account;
            parameters.custpage_account = account;
            let account_parent = (parameters.p8 === 'undefined' ? '' : parameters.p8) || parameters.custpage_account_parent;
            parameters.custpage_account_parent = account_parent;
            let acc_level = parameters.custpage_acc_level;
            let not_level = parameters.custpage_not_level;
            let namefile = parameters.namefile;
            let isPrint = parameters.isPrint;
            let isRun = true;
            if (!!subsidiary) {
                subsidiary = subsidiary.split(',');
            } else {
                subsidiary = runtime.getCurrentUser().subsidiary.toString();
                isRun = false;
            }
            if (!!account) account = account.split(',');
            if (!!account_parent) account_parent = account_parent.split(',');
            let list_total = [], filters_total = [], col_total = master.col_ss_cttotal;
            let list_detail = [], col_detail = null;
            let colid = [];
            if (!foreignCurrency(currencyvalue)) {
                if (reportype === OBJ_REPORT_TYPE.CT_CDPS) {
                    colid = master.col_sl_ctcdps_nocurrency;
                    col_detail = master.col_ss_ctcdps;
                } else if (reportype === OBJ_REPORT_TYPE.CT_CN) {
                    colid = master.col_sl_ctcn_nocurrency;
                    col_detail = master.col_ss_ctcn;
                    col_total = master.col_ss_ctcntotal;
                } else if (reportype === OBJ_REPORT_TYPE.CT_SQT) {
                    colid = master.col_sl_ctsqt_nocurrency;
                    col_detail = master.col_ss_ctsqt;
                } else if (reportype === OBJ_REPORT_TYPE.CT_SNKC) {
                    colid = master.col_sl_ctsnkc_nocurrency;
                    col_detail = master.col_ss_ctsnkc;
                } else {
                    isRun = false;
                }
            } else {
                if (reportype === OBJ_REPORT_TYPE.CT_CDPS) {
                    colid = master.col_sl_ctcdps;
                    col_detail = master.col_ss_ctcdps;
                } else if (reportype === OBJ_REPORT_TYPE.CT_CN) {
                    colid = master.col_sl_ctcn;
                    col_detail = master.col_ss_ctcn;
                    col_total = master.col_ss_ctcntotal;
                } else if (reportype === OBJ_REPORT_TYPE.CT_SQT) {
                    colid = master.col_sl_ctsqt;
                    col_detail = master.col_ss_ctsqt;
                } else if (reportype === OBJ_REPORT_TYPE.CT_SNKC) {
                    colid = master.col_sl_ctsnkc;
                    col_detail = master.col_ss_ctsnkc;
                } else {
                    isRun = false;
                }
            }
            let form, sublist;
            if (parameters.isexport !== "T") {
                let mainForm = createForm(parameters, master, subsidiary, account, account_parent);
                form = mainForm.form;
                sublist = mainForm.sublist;
                if (!!col_detail) {
                    libRep.addFieldLineColList(sublist, colid);
                }
            }
            if (!date_dauky || !date_cuoiky) {
                isRun = false;
            }
            if (isRun) {
                if (!!account_parent && account_parent.length > 0) {
                    if (!account) {
                        account = [];
                    }
                    let list_acc_leaf = [], pageinfo = null, params_acc_leaf = [];
                    let sql_acc_leaf = "select acc.id from account acc where acc.issummary = 'F' and (";
                    for (let iap in account_parent) {
                        if (iap > 0) {
                            sql_acc_leaf = sql_acc_leaf + " or ";
                        }
                        sql_acc_leaf = sql_acc_leaf + " acc.acctnumber like (select a.acctnumber from account a where a.id = " + account_parent[iap] + ") || '%' ";
                    }
                    sql_acc_leaf = sql_acc_leaf + ")";
                    libRep.doSearchSql(list_acc_leaf, pageinfo, sql_acc_leaf, params_acc_leaf);
                    for (let iapl in list_acc_leaf) {
                        account.push(list_acc_leaf[iapl].id);
                    }
                }
                let filters_detail = [];
                pushFiltersDetail(filters_detail, parameters, subsidiary, entity, currencyvalue, account, date_dauky, date_cuoiky, currencytext)
                pushFiltersTotal(filters_total, parameters, subsidiary, entity, currencyvalue, account, date_dauky, currencytext);
                libRep.doSearchSS(reportype === OBJ_REPORT_TYPE.CT_CN ? OBJ_REPORT_TYPE.CTCN_TOTAL : OBJ_REPORT_TYPE.CT_TOTAL, 1000, list_total, filters_total, col_total);
                libRep.doSearchSSRange(reportype, 1000, list_detail, filters_detail, col_detail);
                
                let list_acc = [], pageinfo = null, params_acc = [];
                if (reportype !== OBJ_REPORT_TYPE.CT_CN) {
                    let sql_acc = "select acc.id, acc.acctnumber, acc.accountsearchdisplaynamecopy accountsearchdisplayname, acc.custrecord_scv_cct_acc_parent, acc.custrecord_scv_cct_acc_parent_name, acc.custrecord_scv_acc_level from account acc where acc.acctnumber is not null";
                    libRep.doSearchSql(list_acc, pageinfo, sql_acc, params_acc);
                }
                let fieldgroup = {account: 'account', account_text: 'account_text'};
                let isexport = parameters.isexport;
                if (isexport !== "T") {
                    let linestart = setSublistValueLine(fieldgroup, sublist, colid, list_total, list_detail, list_acc, currencyvalue, not_level, acc_level, false, 0);
                    setSublistValueLine(fieldgroup, sublist, colid, [], list_total, list_acc, currencyvalue, not_level, acc_level, true, linestart);
                } else if (isPrint === "T") {
                    let {pRow: rowPdf} = exportPdf(response, parameters, fieldgroup, list_total, list_detail, list_acc, not_level, acc_level, currencyvalue, reportype, OBJ_REPORT_TYPE, false);
                    let {pRow: rowPdfOther} = exportPdf(response, parameters, fieldgroup, [], list_total, list_acc, not_level, acc_level, currencyvalue, reportype, OBJ_REPORT_TYPE, true);
                    let isNoCurrency = !foreignCurrency(currencyvalue);
                    let namefilexml = reportype.substring(13, reportype.length);
                    let pTitle = getTitleReportPdf(reportype);
                    let pHeaderTable = getHeaderTablePdf(reportype, isNoCurrency);
                    let pFontSize = isNoCurrency ? "9pt" : "6.5pt";
                    
                    if (namefilexml) {
                        let fileObject = file.load({id: '../xml/pdf/scv_render_rp_vas_detail_pdf.xml'});
                        let content = fileObject.getContents();
                        let subsidiary = parameters.custpage_subsidiary;
                        let accounttext = parameters.custpage_accounttext;
                        let date_dauky = parameters.custpage_date_dauky;
                        let date_cuoiky = parameters.custpage_date_cuoiky;
                        let currencytext = parameters.custpage_currencytext;
                        let entity = parameters.custpage_entity;
                        let lkSub = search.lookupFields({
                            type: 'subsidiary',
                            id: subsidiary,
                            columns: ['legalname', 'address.address']
                        });
                        content = content.replace(/{pSubsidiary}/gi, lkSub['legalname']);
                        content = content.replace(/{pSubsidiaryAddress}/gi, lkSub['address.address']);
                        content = content.replace(/{pDatefrom}/gi, date_dauky);
                        content = content.replace(/{pDateto}/gi, date_cuoiky);
                        content = content.replace(/{pTitle}/gi, pTitle);
                        content = content.replace(/{pAccount}/gi, accounttext || 'Tổng hợp');
                        content = content.replace(/{pCurrency}/gi, currencytext || 'VND');
                        content = content.replace(/{pEntity}/gi, esXml(entity || 'Tổng hợp'));
                        content = content.replace(/{pFontSize}/gi, pFontSize);
                        content = content.replace(/{pHeaderTable}/gi, pHeaderTable);
                        content = content.replace(/{pBodyTable}/gi, rowPdf + rowPdfOther);
                        
                        namefile = namefile || namefilexml.substring(4, namefilexml.length) + '.pdf';
                        try {
                            let f = render.xmlToPdf({xmlString: content});
                            f.name = namefile;
                            response.writeFile(f, true);
                        } catch (err) {
                            log.error("err: ", err)
                        }
                    }
                } else {
                    let objRow = exportExcel(response, parameters, fieldgroup, list_total, list_detail, list_acc, not_level, acc_level, currencyvalue, reportype, OBJ_REPORT_TYPE, false);
                    let objRow1 = exportExcel(response, parameters, fieldgroup, [], list_total, list_acc, not_level, acc_level, currencyvalue, reportype, OBJ_REPORT_TYPE, true);
                    let line = objRow.line + objRow1.line;
                    let path = '../xml/vas/dt/';
                    let namefilexml = reportype.substring(13, reportype.length);
                    if (namefilexml) {
                        let namefileload = namefilexml;
                        if (!foreignCurrency(currencyvalue)) namefileload = namefilexml + '_nocurrency';
                        let fileObject = file.load({id: path + namefileload + '.xml'});
                        let content = fileObject.getContents();
                        let subsidiary = parameters.custpage_subsidiary;
                        let accounttext = parameters.custpage_accounttext;
                        let date_dauky = parameters.custpage_date_dauky;
                        let date_cuoiky = parameters.custpage_date_cuoiky;
                        let currencytext = parameters.custpage_currencytext;
                        let entity = parameters.custpage_entity;
                        let lkSub = search.lookupFields({
                            type: 'subsidiary',
                            id: subsidiary,
                            columns: ['legalname', 'address.address']
                        });
                        content = content.replace(/{pSubsidiary}/gi, lkSub['legalname']);
                        content = content.replace(/{pSubsidiaryAddress}/gi, lkSub['address.address']);
                        content = content.replace(/{pDatefrom}/gi, date_dauky);
                        content = content.replace(/{pDateto}/gi, date_cuoiky);
                        content = content.replace(/{pAccount}/gi, accounttext || 'Tổng hợp');
                        content = content.replace(/{pCurrency}/gi, currencytext || 'VND');
                        content = content.replace(/{pEntity}/gi, entity || 'Tổng hợp');
                        
                        if (reportype === OBJ_REPORT_TYPE.CT_CN) {
                            content = content.replace(/{pExpandedRowCount}/gi, 20 + line);
                        } else if (reportype === OBJ_REPORT_TYPE.CT_CDPS) {
                            content = content.replace(/{pExpandedRowCount}/gi, 19 + line);
                        } else if (reportype === OBJ_REPORT_TYPE.CT_SQT) {
                            content = content.replace(/{pExpandedRowCount}/gi, 21 + line);
                        } else if (reportype === OBJ_REPORT_TYPE.CT_SNKC) {
                            content = content.replace(/{pExpandedRowCount}/gi, 20 + line);
                        }
                        
                        content = content.replace(/{pRowData}/gi, objRow.pRow + objRow1.pRow);
                        namefile = namefile || namefilexml.substring(4, namefilexml.length) + '.xls';
                        libRep.downloadFile(context, namefile, content);
                    }
                }
            }
            if (parameters.isexport !== "T") {
                response.writePage(form);
            }
        }
        
        const foreignCurrency = (value) => {
            return !!value && value !== '1';
        }
        
        const setSublistValueLine = (fieldgroup, sublist, colids, list_total, list_detail, list_acc, currencyvalue, not_level, acc_level, istotal, linestart) => {
            let precision = (!foreignCurrency(currencyvalue)) ? 0 : 2;
            let objdetail, colid, tempvalue, account, account_text, account_pre = '.', line = linestart, objtotal,
                sodunodauky = 0, sodunovnddauky = 0;
            let congsopsno = 0, congsopsco = 0, congsopsnovnd = 0, congsopscovnd = 0;
            let icuoiky = 0, tov, acc_parent, acc_parent_num, acc_parent_name, acc_ccc = {}, acc_lv;
            for (let i in list_detail) {
                objdetail = list_detail[i];
                account = objdetail[fieldgroup.account];
                account_text = objdetail[fieldgroup.account_text];
                if (!objdetail.isget && (!istotal || ((objdetail.sodunovnd || 0) - (objdetail.soducovnd || 0) !== 0))) {
                    if (account !== account_pre) {
                        if (icuoiky > 0) line = setCSPSVaCuoiky(currencyvalue, line, sublist, congsopsno, congsopsco, congsopsnovnd, congsopscovnd, sodunodauky, sodunovnddauky);
                        acc_parent = list_acc.find(e => String(e.id) === String(objdetail.account));
                        if (!!acc_parent && not_level !== 'T') {
                            acc_parent_num = acc_parent.custrecord_scv_cct_acc_parent;
                            acc_parent_name = acc_parent.custrecord_scv_cct_acc_parent_name;
                            if (!!acc_parent_num) {
                                acc_parent_num = acc_parent_num.split('//');
                                acc_parent_name = acc_parent_name.split('//');
                                acc_lv = acc_parent_num.length;
                                if (!!acc_level && acc_level < acc_lv) {
                                    acc_lv = acc_level;
                                }
                                for (let iacc = 0; iacc < acc_lv; iacc++) {
                                    if (!acc_ccc[acc_parent_num[iacc]]) {
                                        sublist.setSublistValue({
                                            id: 'diengiai',
                                            line: line,
                                            value: ((acc_parent_num[iacc] || '') + ' ' + (acc_parent_name[iacc] || '')) || '.'
                                        });
                                        sublist.setSublistValue({id: 'typebold', line: line, value: '1'});
                                        line++;
                                        acc_ccc[acc_parent_num[iacc]] = acc_parent_num[iacc];
                                    }
                                }
                                if (!acc_level || acc_level > acc_lv) {
                                    sublist.setSublistValue({
                                        id: 'diengiai',
                                        line: line,
                                        value: (acc_parent.accountsearchdisplayname) || '.'
                                    });
                                    sublist.setSublistValue({id: 'typebold', line: line, value: '1'});
                                    line++;
                                }
                            } else {
                                sublist.setSublistValue({
                                    id: 'diengiai',
                                    line: line,
                                    value: !!account_text ? account_text.substr(0, 299) : '.'
                                });
                                sublist.setSublistValue({id: 'typebold', line: line, value: '1'});
                                line++;
                            }
                        } else {
                            sublist.setSublistValue({
                                id: 'diengiai',
                                line: line,
                                value: !!account_text ? account_text.substr(0, 299) : '.'
                            });
                            sublist.setSublistValue({id: 'typebold', line: line, value: '1'});
                            line++;
                        }
                        sublist.setSublistValue({id: 'diengiai', line: line, value: '- Số dư đầu kỳ'});
                        sublist.setSublistValue({id: 'typebold', line: line, value: '2'});
                        sublist.setSublistValue({id: 'phatsinhnovnd', line: line, value: 0});
                        sublist.setSublistValue({id: 'phatsinhcovnd', line: line, value: 0});
                        if (!istotal) {
                            objtotal = list_total.find(o => String(o[fieldgroup.account]) === String(account)) || {};
                            objtotal.isget = true;
                        } else {
                            objtotal = objdetail;
                        }
                        sodunodauky = (objtotal.soduno || 0) - (objtotal.soduco || 0);
                        sodunovnddauky = (objtotal.sodunovnd || 0) - (objtotal.soducovnd || 0);
                        if (sodunovnddauky > 0) {
                            sublist.setSublistValue({id: 'sodunovnd', line: line, value: sodunovnddauky.toFixed(0)});
                            sublist.setSublistValue({id: 'soducovnd', line: line, value: 0});
                        } else {
                            sublist.setSublistValue({id: 'sodunovnd', line: line, value: 0});
                            sublist.setSublistValue({
                                id: 'soducovnd',
                                line: line,
                                value: Math.abs(sodunovnddauky).toFixed(0)
                            });
                        }
                        if (foreignCurrency(currencyvalue)) {
                            if (sodunodauky > 0) {
                                sublist.setSublistValue({id: 'soduno', line: line, value: sodunodauky.toFixed(2)});
                                sublist.setSublistValue({id: 'soduco', line: line, value: 0});
                            } else {
                                sublist.setSublistValue({id: 'soduno', line: line, value: 0});
                                sublist.setSublistValue({
                                    id: 'soduco',
                                    line: line,
                                    value: Math.abs(sodunodauky).toFixed(2)
                                });
                            }
                        }
                        congsopsno = 0; congsopsco = 0; congsopsnovnd = 0; congsopscovnd = 0;
                        line++;
                    }
                    if (!istotal) {
                        congsopsno = Number(objdetail.phatsinhno || 0) + congsopsno;
                        congsopsco = Number(objdetail.phatsinhco || 0) + congsopsco;
                        congsopsnovnd = Number(objdetail.phatsinhnovnd || 0) + congsopsnovnd;
                        congsopscovnd = Number(objdetail.phatsinhcovnd || 0) + congsopscovnd;
                        for (let n in colids) {
                            colid = colids[n].id;
                            tempvalue = objdetail[colid];
                            if (!!tempvalue || tempvalue === 0) {
                                tov = typeof tempvalue;
                                if (tov === 'number' || colid.endsWith('vnd')) {
                                    tempvalue = parseFloat(tempvalue);
                                    tempvalue = colid.endsWith('vnd') ? tempvalue.toFixed(0) : tempvalue.toFixed(precision);
                                } else if (tov === 'string') {
                                    tempvalue = tempvalue.substr(0, 300);
                                }
                                if (colid === 'soct') {
                                    tempvalue = '<a href=/app/accounting/transactions/transaction.nl?id=' + objdetail.id + ' target=_blank>' + tempvalue + '</a>';
                                }
                                
                                sublist.setSublistValue({id: colid, line: line, value: tempvalue});
                            }
                        }
                        tempvalue = (congsopsnovnd - congsopscovnd) + sodunovnddauky;
                        if (tempvalue > 0) {
                            sublist.setSublistValue({id: 'sodunovnd', line: line, value: tempvalue.toFixed(0)});
                            sublist.setSublistValue({id: 'soducovnd', line: line, value: 0});
                        } else {
                            sublist.setSublistValue({id: 'sodunovnd', line: line, value: 0});
                            sublist.setSublistValue({
                                id: 'soducovnd',
                                line: line,
                                value: Math.abs(tempvalue).toFixed(0)
                            });
                        }
                        
                        if (foreignCurrency(currencyvalue)) {
                            tempvalue = (congsopsno - congsopsco) + sodunodauky;
                            if (tempvalue > 0) {
                                sublist.setSublistValue({id: 'soduno', line: line, value: tempvalue.toFixed(2)});
                                sublist.setSublistValue({id: 'soduco', line: line, value: 0});
                            } else {
                                sublist.setSublistValue({id: 'soduno', line: line, value: 0});
                                sublist.setSublistValue({
                                    id: 'soduco',
                                    line: line,
                                    value: Math.abs(tempvalue).toFixed(2)
                                });
                            }
                        }
                        line++;
                    }
                    icuoiky++;
                }
                account_pre = account;
            }
            if (line > linestart) {
                line = setCSPSVaCuoiky(currencyvalue, line, sublist, congsopsno, congsopsco, congsopsnovnd, congsopscovnd, sodunodauky, sodunovnddauky);
            }
            return line;
        }
        
        const setCSPSVaCuoiky = (currencyvalue, lineip, sublist, congsopsno, congsopsco, congsopsnovnd, congsopscovnd, sodunodauky, sodunovnddauky) => {
            let line = lineip;
            sublist.setSublistValue({id: 'diengiai', line: line, value: '- Cộng số phát sinh'});
            sublist.setSublistValue({id: 'typebold', line: line, value: '2'});
            sublist.setSublistValue({id: 'phatsinhnovnd', line: line, value: congsopsnovnd.toFixed(0)});
            sublist.setSublistValue({id: 'phatsinhcovnd', line: line, value: congsopscovnd.toFixed(0)});
            sublist.setSublistValue({id: 'sodunovnd', line: line, value: 0});
            sublist.setSublistValue({id: 'soducovnd', line: line, value: 0});
            if (foreignCurrency(currencyvalue)) {
                sublist.setSublistValue({id: 'phatsinhno', line: line, value: congsopsno.toFixed(2)});
                sublist.setSublistValue({id: 'phatsinhco', line: line, value: congsopsco.toFixed(2)});
                sublist.setSublistValue({id: 'soduno', line: line, value: 0});
                sublist.setSublistValue({id: 'soduco', line: line, value: 0});
            }
            line++;
            sublist.setSublistValue({id: 'diengiai', line: line, value: '- Số dư cuối kỳ'});
            sublist.setSublistValue({id: 'typebold', line: line, value: '2'});
            sublist.setSublistValue({id: 'phatsinhnovnd', line: line, value: 0});
            sublist.setSublistValue({id: 'phatsinhcovnd', line: line, value: 0});
            if (foreignCurrency(currencyvalue)) {
                sublist.setSublistValue({id: 'phatsinhno', line: line, value: 0});
                sublist.setSublistValue({id: 'phatsinhco', line: line, value: 0});
            }
            let tempvalue = (congsopsnovnd - congsopscovnd) + sodunovnddauky;
            if (tempvalue > 0) {
                sublist.setSublistValue({id: 'sodunovnd', line: line, value: tempvalue.toFixed(0)});
                sublist.setSublistValue({id: 'soducovnd', line: line, value: 0});
            } else {
                sublist.setSublistValue({id: 'sodunovnd', line: line, value: 0});
                sublist.setSublistValue({id: 'soducovnd', line: line, value: Math.abs(tempvalue).toFixed(0)});
            }
            if (foreignCurrency(currencyvalue)) {
                let tempvalue = (congsopsno - congsopsco) + sodunodauky;
                if (tempvalue > 0) {
                    sublist.setSublistValue({id: 'soduno', line: line, value: tempvalue.toFixed(2)});
                    sublist.setSublistValue({id: 'soduco', line: line, value: 0});
                } else {
                    sublist.setSublistValue({id: 'soduno', line: line, value: 0});
                    sublist.setSublistValue({id: 'soduco', line: line, value: Math.abs(tempvalue).toFixed(2)});
                }
            }
            line++;
            return line;
        }
        
        const makeRowDiengiai = (diengiai, currencyvalue, reportype, OBJ_REPORT_TYPE) => {
            let rowData = '';
            diengiai = diengiai || '';
            if (!foreignCurrency(currencyvalue)) {
                if (reportype === OBJ_REPORT_TYPE.CT_CDPS) {
                    rowData = '<Row ss:AutoFitHeight="0" ss:Height="14.55">'
                        + '<Cell ss:MergeAcross="7" ss:StyleID="s79"><Data ss:Type="String">' + diengiai + '</Data></Cell>'
                        + '</Row>';
                } else if (reportype === OBJ_REPORT_TYPE.CT_CN) {
                    rowData = '<Row ss:AutoFitHeight="0" ss:Height="14.55">'
                        + '<Cell ss:MergeAcross="7" ss:StyleID="s79"><Data ss:Type="String">' + diengiai + '</Data></Cell>'
                        + '</Row>';
                } else if (reportype === OBJ_REPORT_TYPE.CT_SQT) {
                    rowData = '<Row ss:AutoFitHeight="0" ss:Height="14.55">'
                        + '<Cell ss:MergeAcross="8" ss:StyleID="s79"><Data ss:Type="String">' + diengiai + '</Data></Cell>'
                        + '</Row>';
                } else if (reportype === OBJ_REPORT_TYPE.CT_SNKC) {
                    rowData = '<Row ss:AutoFitHeight="0" ss:Height="14.55">'
                        + '<Cell ss:MergeAcross="7" ss:StyleID="s79"><Data ss:Type="String">' + diengiai + '</Data></Cell>'
                        + '</Row>';
                }
            } else {
                if (reportype === OBJ_REPORT_TYPE.CT_CDPS) {
                    rowData = '<Row ss:AutoFitHeight="0" ss:Height="14.55">'
                        + '<Cell ss:MergeAcross="12" ss:StyleID="s79"><Data ss:Type="String">' + diengiai + '</Data></Cell>'
                        + '</Row>';
                } else if (reportype === OBJ_REPORT_TYPE.CT_CN) {
                    rowData = '<Row ss:AutoFitHeight="0" ss:Height="14.55">'
                        + '<Cell ss:MergeAcross="12" ss:StyleID="s79"><Data ss:Type="String">' + diengiai + '</Data></Cell>'
                        + '</Row>';
                } else if (reportype === OBJ_REPORT_TYPE.CT_SQT) {
                    rowData = '<Row ss:AutoFitHeight="0" ss:Height="14.55">'
                        + '<Cell ss:MergeAcross="13" ss:StyleID="s79"><Data ss:Type="String">' + diengiai + '</Data></Cell>'
                        + '</Row>';
                } else if (reportype === OBJ_REPORT_TYPE.CT_SNKC) {
                    rowData = '<Row ss:AutoFitHeight="0" ss:Height="14.55">'
                        + '<Cell ss:MergeAcross="12" ss:StyleID="s79"><Data ss:Type="String">' + diengiai + '</Data></Cell>'
                        + '</Row>';
                }
            }
            return rowData;
        }
        
        const makeRowDauky = (sodunovnddauky, soducovnddauky, currencyvalue, reportype, OBJ_REPORT_TYPE, sodunodauky, soducodauky) => {
            let rowData = '';
            if (!foreignCurrency(currencyvalue)) {
                if (reportype === OBJ_REPORT_TYPE.CT_CDPS) {
                    rowData = '<Row ss:AutoFitHeight="0" ss:Height="14.55">' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s79"><Data ss:Type="String">- Số dư đầu kỳ</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">' + sodunovnddauky + '</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">' + soducovnddauky + '</Data></Cell>' +
                        '</Row>';
                } else if (reportype === OBJ_REPORT_TYPE.CT_CN) {
                    rowData = '<Row ss:AutoFitHeight="0" ss:Height="14.55">' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s79"><Data ss:Type="String">- Số dư đầu kỳ</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">' + sodunovnddauky + '</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">' + soducovnddauky + '</Data></Cell>' +
                        '</Row>';
                } else if (reportype === OBJ_REPORT_TYPE.CT_SQT) {
                    rowData = '<Row ss:AutoFitHeight="0" ss:Height="14.55">' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s79"><Data ss:Type="String">- Số dư đầu kỳ</Data></Cell>' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">' + sodunovnddauky + '</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">' + soducovnddauky + '</Data></Cell>' +
                        '</Row>';
                } else if (reportype === OBJ_REPORT_TYPE.CT_SNKC) {
                    rowData = '<Row ss:AutoFitHeight="0" ss:Height="14.55">' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s79"><Data ss:Type="String">- Số dư đầu kỳ</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">' + sodunovnddauky + '</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">' + soducovnddauky + '</Data></Cell>' +
                        '</Row>';
                }
            } else {
                if (reportype === OBJ_REPORT_TYPE.CT_CDPS) {
                    rowData = '<Row ss:AutoFitHeight="0" ss:Height="14.55">' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s79"><Data ss:Type="String">- Số dư đầu kỳ</Data></Cell>' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '<Cell ss:StyleID="s89"><Data ss:Type="Number">' + sodunodauky + '</Data></Cell>' +
                        '<Cell ss:StyleID="s89"><Data ss:Type="Number">' + soducodauky + '</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">' + sodunovnddauky + '</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">' + soducovnddauky + '</Data></Cell>' +
                        '</Row>';
                } else if (reportype === OBJ_REPORT_TYPE.CT_CN) {
                    rowData = '<Row ss:AutoFitHeight="0" ss:Height="14.55">' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s79"><Data ss:Type="String">- Số dư đầu kỳ</Data></Cell>' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '<Cell ss:StyleID="s89"><Data ss:Type="Number">' + sodunodauky + '</Data></Cell>' +
                        '<Cell ss:StyleID="s89"><Data ss:Type="Number">' + soducodauky + '</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">' + sodunovnddauky + '</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">' + soducovnddauky + '</Data></Cell>' +
                        '</Row>';
                } else if (reportype === OBJ_REPORT_TYPE.CT_SQT) {
                    rowData = '<Row ss:AutoFitHeight="0" ss:Height="14.55">' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s79"><Data ss:Type="String">- Số dư đầu kỳ</Data></Cell>' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '<Cell ss:StyleID="s89"><Data ss:Type="Number">' + sodunodauky + '</Data></Cell>' +
                        '<Cell ss:StyleID="s89"><Data ss:Type="Number">' + soducodauky + '</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">' + sodunovnddauky + '</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">' + soducovnddauky + '</Data></Cell>' +
                        '</Row>';
                } else if (reportype === OBJ_REPORT_TYPE.CT_SNKC) {
                    rowData = '<Row ss:AutoFitHeight="0" ss:Height="14.55">' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s79"><Data ss:Type="String">- Số dư đầu kỳ</Data></Cell>' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '<Cell ss:StyleID="s89"><Data ss:Type="Number">' + sodunodauky + '</Data></Cell>' +
                        '<Cell ss:StyleID="s89"><Data ss:Type="Number">' + soducodauky + '</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">' + sodunovnddauky + '</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">' + soducovnddauky + '</Data></Cell>' +
                        '</Row>';
                }
            }
            return rowData;
        }
        
        const makeRowPhatsinh = (objdetail, sodunovnddauky, soducovnddauky, currencyvalue, reportype, OBJ_REPORT_TYPE, sodunodauky, soducodauky) => {
            let rowData = '';
            if (!foreignCurrency(currencyvalue)) {
                if (reportype === OBJ_REPORT_TYPE.CT_CDPS) {
                    rowData = '<Row ss:AutoFitHeight="0" ss:Height="25">' +
                        '<Cell ss:StyleID="s68"><Data ss:Type="String">' + (objdetail.trandate || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s68"><Data ss:Type="String">' + (objdetail.ngayct || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s68"><Data ss:Type="String">' + (objdetail.soct || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s68"><Data ss:Type="String">' + (objdetail.diengiai || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s80"><Data ss:Type="Number">' + (objdetail.phatsinhnovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s80"><Data ss:Type="Number">' + (objdetail.phatsinhcovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s80"><Data ss:Type="Number">' + (sodunovnddauky) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s80"><Data ss:Type="Number">' + (soducovnddauky) + '</Data></Cell>' +
                        '</Row>';
                } else if (reportype === OBJ_REPORT_TYPE.CT_CN) {
                    rowData = '<Row ss:AutoFitHeight="0" ss:Height="25">' +
                        '<Cell ss:StyleID="s68"><Data ss:Type="String">' + (objdetail.trandate || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s68"><Data ss:Type="String">' + (objdetail.ngayct || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s68"><Data ss:Type="String">' + (objdetail.soct || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s68"><Data ss:Type="String">' + (objdetail.diengiai || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s80"><Data ss:Type="Number">' + (objdetail.phatsinhnovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s80"><Data ss:Type="Number">' + (objdetail.phatsinhcovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s80"><Data ss:Type="Number">' + (sodunovnddauky) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s80"><Data ss:Type="Number">' + (soducovnddauky) + '</Data></Cell>' +
                        '</Row>';
                } else if (reportype === OBJ_REPORT_TYPE.CT_SQT) {
                    rowData = '<Row ss:AutoFitHeight="0" ss:Height="25">' +
                        '<Cell ss:StyleID="s68"><Data ss:Type="String">' + (objdetail.trandate || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s68"><Data ss:Type="String">' + (objdetail.ngayct || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s68"><Data ss:Type="String">' + (objdetail.soct || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s68"><Data ss:Type="String">' + (objdetail.diengiai || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s68"><Data ss:Type="String">' + (objdetail.doituong || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s80"><Data ss:Type="Number">' + (objdetail.phatsinhnovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s80"><Data ss:Type="Number">' + (objdetail.phatsinhcovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s80"><Data ss:Type="Number">' + (sodunovnddauky) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s80"><Data ss:Type="Number">' + (soducovnddauky) + '</Data></Cell>' +
                        '</Row>';
                } else if (reportype === OBJ_REPORT_TYPE.CT_SNKC) {
                    rowData = '<Row ss:AutoFitHeight="0" ss:Height="25">' +
                        '<Cell ss:StyleID="s68"><Data ss:Type="String">' + (objdetail.trandate || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s68"><Data ss:Type="String">' + (objdetail.ngayct || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s68"><Data ss:Type="String">' + (objdetail.soct || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s68"><Data ss:Type="String">' + (objdetail.diengiai || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s80"><Data ss:Type="Number">' + (objdetail.phatsinhnovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s80"><Data ss:Type="Number">' + (objdetail.phatsinhcovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s80"><Data ss:Type="Number">' + (sodunovnddauky) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s80"><Data ss:Type="Number">' + (soducovnddauky) + '</Data></Cell>' +
                        '</Row>';
                }
            } else {
                if (reportype === OBJ_REPORT_TYPE.CT_CDPS) {
                    rowData = '<Row ss:AutoFitHeight="0" ss:Height="25">' +
                        '<Cell ss:StyleID="s68"><Data ss:Type="String">' + (objdetail.trandate || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s68"><Data ss:Type="String">' + (objdetail.ngayct || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s68"><Data ss:Type="String">' + (objdetail.soct || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s68"><Data ss:Type="String">' + (objdetail.diengiai || '') + '</Data></Cell>' +
                        '<Cell ' + (objdetail.tygia ? 'ss:StyleID="s80"><Data ss:Type="Number"' : 'ss:StyleID="s68"><Data ss:Type="String"') + '>' + (objdetail.tygia || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s90"><Data ss:Type="Number">' + (objdetail.phatsinhno || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s90"><Data ss:Type="Number">' + (objdetail.phatsinhco || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s90"><Data ss:Type="Number">' + (sodunodauky) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s90"><Data ss:Type="Number">' + (soducodauky) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s80"><Data ss:Type="Number">' + (objdetail.phatsinhnovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s80"><Data ss:Type="Number">' + (objdetail.phatsinhcovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s80"><Data ss:Type="Number">' + (sodunovnddauky) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s80"><Data ss:Type="Number">' + (soducovnddauky) + '</Data></Cell>' +
                        '</Row>';
                } else if (reportype === OBJ_REPORT_TYPE.CT_CN) {
                    rowData = '<Row ss:AutoFitHeight="0" ss:Height="25">' +
                        '<Cell ss:StyleID="s68"><Data ss:Type="String">' + (objdetail.trandate || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s68"><Data ss:Type="String">' + (objdetail.ngayct || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s68"><Data ss:Type="String">' + (objdetail.soct || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s68"><Data ss:Type="String">' + (objdetail.diengiai || '') + '</Data></Cell>' +
                        '<Cell ' + (objdetail.tygia ? 'ss:StyleID="s80"><Data ss:Type="Number"' : 'ss:StyleID="s68"><Data ss:Type="String"') + '>' + (objdetail.tygia || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s90"><Data ss:Type="Number">' + (objdetail.phatsinhno || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s90"><Data ss:Type="Number">' + (objdetail.phatsinhco || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s90"><Data ss:Type="Number">' + (sodunodauky) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s90"><Data ss:Type="Number">' + (soducodauky) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s80"><Data ss:Type="Number">' + (objdetail.phatsinhnovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s80"><Data ss:Type="Number">' + (objdetail.phatsinhcovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s80"><Data ss:Type="Number">' + (sodunovnddauky) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s80"><Data ss:Type="Number">' + (soducovnddauky) + '</Data></Cell>' +
                        '</Row>';
                } else if (reportype === OBJ_REPORT_TYPE.CT_SQT) {
                    rowData = '<Row ss:AutoFitHeight="0" ss:Height="25">' +
                        '<Cell ss:StyleID="s68"><Data ss:Type="String">' + (objdetail.trandate || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s68"><Data ss:Type="String">' + (objdetail.ngayct || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s68"><Data ss:Type="String">' + (objdetail.soct || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s68"><Data ss:Type="String">' + (objdetail.diengiai || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s68"><Data ss:Type="String">' + (objdetail.doituong || '') + '</Data></Cell>' +
                        '<Cell ' + (objdetail.tygia ? 'ss:StyleID="s80"><Data ss:Type="Number"' : 'ss:StyleID="s68"><Data ss:Type="String"') + '>' + (objdetail.tygia || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s90"><Data ss:Type="Number">' + (objdetail.phatsinhno || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s90"><Data ss:Type="Number">' + (objdetail.phatsinhco || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s90"><Data ss:Type="Number">' + (sodunodauky) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s90"><Data ss:Type="Number">' + (soducodauky) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s80"><Data ss:Type="Number">' + (objdetail.phatsinhnovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s80"><Data ss:Type="Number">' + (objdetail.phatsinhcovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s80"><Data ss:Type="Number">' + (sodunovnddauky) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s80"><Data ss:Type="Number">' + (soducovnddauky) + '</Data></Cell>' +
                        '</Row>';
                } else if (reportype === OBJ_REPORT_TYPE.CT_SNKC) {
                    rowData = '<Row ss:AutoFitHeight="0" ss:Height="25">' +
                        '<Cell ss:StyleID="s68"><Data ss:Type="String">' + (objdetail.trandate || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s68"><Data ss:Type="String">' + (objdetail.ngayct || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s68"><Data ss:Type="String">' + (objdetail.soct || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s68"><Data ss:Type="String">' + (objdetail.diengiai || '') + '</Data></Cell>' +
                        '<Cell ' + (objdetail.tygia ? 'ss:StyleID="s80"><Data ss:Type="Number"' : 'ss:StyleID="s68"><Data ss:Type="String"') + '>' + (objdetail.tygia || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s90"><Data ss:Type="Number">' + (objdetail.phatsinhno || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s90"><Data ss:Type="Number">' + (objdetail.phatsinhco || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s90"><Data ss:Type="Number">' + (sodunodauky) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s90"><Data ss:Type="Number">' + (soducodauky) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s80"><Data ss:Type="Number">' + (objdetail.phatsinhnovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s80"><Data ss:Type="Number">' + (objdetail.phatsinhcovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s80"><Data ss:Type="Number">' + (sodunovnddauky) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s80"><Data ss:Type="Number">' + (soducovnddauky) + '</Data></Cell>' +
                        '</Row>';
                }
            }
            return rowData;
        }
        
        const makeRowCongsoPhatsinh = (congsopsnovnd, congsopscovnd, currencyvalue, reportype, OBJ_REPORT_TYPE, congsopsno, congsopsco) => {
            let rowData = '';
            if (!foreignCurrency(currencyvalue)) {
                if (reportype === OBJ_REPORT_TYPE.CT_CDPS) {
                    rowData = '<Row ss:AutoFitHeight="0" ss:Height="14.55">' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s79"><Data ss:Type="String">- Cộng số phát sinh</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">' + congsopsnovnd + '</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">' + congsopscovnd + '</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '</Row>';
                } else if (reportype === OBJ_REPORT_TYPE.CT_CN) {
                    rowData = '<Row ss:AutoFitHeight="0" ss:Height="14.55">' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s79"><Data ss:Type="String">- Cộng số phát sinh</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">' + congsopsnovnd + '</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">' + congsopscovnd + '</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '</Row>';
                } else if (reportype === OBJ_REPORT_TYPE.CT_SQT) {
                    rowData = '<Row ss:AutoFitHeight="0" ss:Height="14.55">' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s79"><Data ss:Type="String">- Cộng số phát sinh</Data></Cell>' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">' + congsopsnovnd + '</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">' + congsopscovnd + '</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '</Row>';
                } else if (reportype === OBJ_REPORT_TYPE.CT_SNKC) {
                    rowData = '<Row ss:AutoFitHeight="0" ss:Height="14.55">' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s79"><Data ss:Type="String">- Cộng số phát sinh</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">' + congsopsnovnd + '</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">' + congsopscovnd + '</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '</Row>';
                }
            } else {
                if (reportype === OBJ_REPORT_TYPE.CT_CDPS) {
                    rowData = '<Row ss:AutoFitHeight="0" ss:Height="14.55">' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s79"><Data ss:Type="String">- Cộng số phát sinh</Data></Cell>' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s89"><Data ss:Type="Number">' + congsopsno + '</Data></Cell>' +
                        '<Cell ss:StyleID="s89"><Data ss:Type="Number">' + congsopsco + '</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">' + congsopsnovnd + '</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">' + congsopscovnd + '</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '</Row>';
                } else if (reportype === OBJ_REPORT_TYPE.CT_CN) {
                    rowData = '<Row ss:AutoFitHeight="0" ss:Height="14.55">' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s79"><Data ss:Type="String">- Cộng số phát sinh</Data></Cell>' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s89"><Data ss:Type="Number">' + congsopsno + '</Data></Cell>' +
                        '<Cell ss:StyleID="s89"><Data ss:Type="Number">' + congsopsco + '</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">' + congsopsnovnd + '</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">' + congsopscovnd + '</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '</Row>';
                } else if (reportype === OBJ_REPORT_TYPE.CT_SQT) {
                    rowData = '<Row ss:AutoFitHeight="0" ss:Height="14.55">' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s79"><Data ss:Type="String">- Cộng số phát sinh</Data></Cell>' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s89"><Data ss:Type="Number">' + congsopsno + '</Data></Cell>' +
                        '<Cell ss:StyleID="s89"><Data ss:Type="Number">' + congsopsco + '</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">' + congsopsnovnd + '</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">' + congsopscovnd + '</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '</Row>';
                } else if (reportype === OBJ_REPORT_TYPE.CT_SNKC) {
                    rowData = '<Row ss:AutoFitHeight="0" ss:Height="14.55">' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s79"><Data ss:Type="String">- Cộng số phát sinh</Data></Cell>' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s89"><Data ss:Type="Number">' + congsopsno + '</Data></Cell>' +
                        '<Cell ss:StyleID="s89"><Data ss:Type="Number">' + congsopsco + '</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">' + congsopsnovnd + '</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">' + congsopscovnd + '</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '</Row>';
                }
            }
            return rowData;
        }
        
        const makeRowCuoiky = (sodunovndcuoiky, soducovndcuoiky, currencyvalue, reportype, OBJ_REPORT_TYPE, sodunocuoiky, soducocuoiky) => {
            let rowData = '';
            if (!foreignCurrency(currencyvalue)) {
                if (reportype === OBJ_REPORT_TYPE.CT_CDPS) {
                    rowData = '<Row ss:AutoFitHeight="0" ss:Height="14.55">' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s79"><Data ss:Type="String">- Số dư cuối kỳ</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">' + sodunovndcuoiky + '</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">' + soducovndcuoiky + '</Data></Cell>' +
                        '</Row>';
                } else if (reportype === OBJ_REPORT_TYPE.CT_CN) {
                    rowData = '<Row ss:AutoFitHeight="0" ss:Height="14.55">' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s79"><Data ss:Type="String">- Số dư cuối kỳ</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">' + sodunovndcuoiky + '</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">' + soducovndcuoiky + '</Data></Cell>' +
                        '</Row>';
                } else if (reportype === OBJ_REPORT_TYPE.CT_SQT) {
                    rowData = '<Row ss:AutoFitHeight="0" ss:Height="14.55">' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s79"><Data ss:Type="String">- Số dư cuối kỳ</Data></Cell>' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">' + sodunovndcuoiky + '</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">' + soducovndcuoiky + '</Data></Cell>' +
                        '</Row>';
                } else if (reportype === OBJ_REPORT_TYPE.CT_SNCK) {
                    rowData = '<Row ss:AutoFitHeight="0" ss:Height="14.55">' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s79"><Data ss:Type="String">- Số dư cuối kỳ</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">' + sodunovndcuoiky + '</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">' + soducovndcuoiky + '</Data></Cell>' +
                        '</Row>';
                }
            } else {
                if (reportype === OBJ_REPORT_TYPE.CT_CDPS) {
                    rowData = '<Row ss:AutoFitHeight="0" ss:Height="14.55">' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s79"><Data ss:Type="String">- Số dư cuối kỳ</Data></Cell>' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '<Cell ss:StyleID="s89"><Data ss:Type="Number">' + sodunocuoiky + '</Data></Cell>' +
                        '<Cell ss:StyleID="s89"><Data ss:Type="Number">' + soducocuoiky + '</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">' + sodunovndcuoiky + '</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">' + soducovndcuoiky + '</Data></Cell>' +
                        '</Row>';
                } else if (reportype === OBJ_REPORT_TYPE.CT_CN) {
                    rowData = '<Row ss:AutoFitHeight="0" ss:Height="14.55">' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s79"><Data ss:Type="String">- Số dư cuối kỳ</Data></Cell>' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '<Cell ss:StyleID="s89"><Data ss:Type="Number">' + sodunocuoiky + '</Data></Cell>' +
                        '<Cell ss:StyleID="s89"><Data ss:Type="Number">' + soducocuoiky + '</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">' + sodunovndcuoiky + '</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">' + soducovndcuoiky + '</Data></Cell>' +
                        '</Row>';
                } else if (reportype === OBJ_REPORT_TYPE.CT_SQT) {
                    rowData = '<Row ss:AutoFitHeight="0" ss:Height="14.55">' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s79"><Data ss:Type="String">- Số dư cuối kỳ</Data></Cell>' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '<Cell ss:StyleID="s89"><Data ss:Type="Number">' + sodunocuoiky + '</Data></Cell>' +
                        '<Cell ss:StyleID="s89"><Data ss:Type="Number">' + soducocuoiky + '</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">' + sodunovndcuoiky + '</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">' + soducovndcuoiky + '</Data></Cell>' +
                        '</Row>';
                } else if (reportype === OBJ_REPORT_TYPE.CT_SNKC) {
                    rowData = '<Row ss:AutoFitHeight="0" ss:Height="14.55">' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s79"><Data ss:Type="String">- Số dư cuối kỳ</Data></Cell>' +
                        '<Cell ss:StyleID="s68"/>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '<Cell ss:StyleID="s89"><Data ss:Type="Number">' + sodunocuoiky + '</Data></Cell>' +
                        '<Cell ss:StyleID="s89"><Data ss:Type="Number">' + soducocuoiky + '</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">0</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">' + sodunovndcuoiky + '</Data></Cell>' +
                        '<Cell ss:StyleID="s88"><Data ss:Type="Number">' + soducovndcuoiky + '</Data></Cell>' +
                        '</Row>';
                }
            }
            return rowData;
        }
        
        const exportExcel = (response, parameters, fieldgroup, list_total, list_detail, list_acc, not_level, acc_level, currencyvalue, reportype, OBJ_REPORT_TYPE, istotal) => {
            let pRow = '', tempvalue, tempvalue1, tempvalue2, tempvalue3;
            let objdetail, account, account_text, account_pre = '', line = 0, objtotal, sodunodauky = 0,
                sodunovnddauky = 0;
            let congsopsno = 0, congsopsco = 0, congsopsnovnd = 0, congsopscovnd = 0;
            let icuoiky = 0, acc_parent, acc_parent_num, acc_parent_name, acc_ccc = {}, acc_lv;
            for (let i in list_detail) {
                objdetail = list_detail[i];
                account = objdetail[fieldgroup.account];
                account_text = objdetail[fieldgroup.account_text];
                if (!objdetail.isget && (!istotal || ((objdetail.sodunovnd || 0) - (objdetail.soducovnd || 0) !== 0))) {
                    if (account !== account_pre) {
                        if (icuoiky > 0) {
                            pRow = pRow + makeRowCongsoPhatsinh(congsopsnovnd, congsopscovnd, currencyvalue, reportype, OBJ_REPORT_TYPE, congsopsno, congsopsco);
                            line++;
                            tempvalue = (congsopsnovnd - congsopscovnd) + sodunovnddauky;
                            if (tempvalue >= 0) {
                                tempvalue1 = 0;
                            } else {
                                tempvalue1 = Math.abs(tempvalue);
                                tempvalue = 0;
                            }
                            tempvalue2 = (congsopsno - congsopsco) + sodunodauky;
                            if (tempvalue2 > 0) {
                                tempvalue3 = 0;
                            } else {
                                tempvalue3 = Math.abs(tempvalue2);
                                tempvalue2 = 0;
                            }
                            pRow = pRow + makeRowCuoiky(tempvalue, tempvalue1, currencyvalue, reportype, OBJ_REPORT_TYPE, tempvalue2, tempvalue3);
                            line++;
                        }
                        acc_parent = list_acc.find(e => String(e.id) === String(objdetail.account));
                        if (!!acc_parent && not_level !== 'T') {
                            acc_parent_num = acc_parent.custrecord_scv_cct_acc_parent;
                            acc_parent_name = acc_parent.custrecord_scv_cct_acc_parent_name;
                            if (!!acc_parent_num) {
                                acc_parent_num = acc_parent_num.split('//');
                                acc_parent_name = acc_parent_name.split('//');
                                acc_lv = acc_parent_num.length;
                                if (!!acc_level && acc_level < acc_lv) {
                                    acc_lv = acc_level;
                                }
                                for (let iacc = 0; iacc < acc_lv; iacc++) {
                                    if (!acc_ccc[acc_parent_num[iacc]]) {
                                        pRow = pRow + makeRowDiengiai(((acc_parent_num[iacc] || '') + ' ' + (acc_parent_name[iacc] || '')) || '.', currencyvalue, reportype, OBJ_REPORT_TYPE);
                                        line++;
                                        acc_ccc[acc_parent_num[iacc]] = acc_parent_num[iacc];
                                    }
                                }
                                if (!acc_level || acc_level > acc_lv) {
                                    pRow = pRow + makeRowDiengiai((acc_parent.accountsearchdisplayname) || '.', currencyvalue, reportype, OBJ_REPORT_TYPE);
                                    line++;
                                }
                            }
                        } else {
                            pRow = pRow + makeRowDiengiai(account_text, currencyvalue, reportype, OBJ_REPORT_TYPE);
                            line++;
                        }
                        
                        if (!istotal) {
                            objtotal = list_total.find(o => String(o[fieldgroup.account]) === String(account)) || {};
                            objtotal.isget = true;
                        } else {
                            objtotal = objdetail;
                        }
                        sodunodauky = (objtotal.soduno || 0) - (objtotal.soduco || 0);
                        sodunovnddauky = (objtotal.sodunovnd || 0) - (objtotal.soducovnd || 0);
                        if (sodunovnddauky >= 0) {
                            tempvalue = sodunovnddauky;
                            tempvalue1 = 0;
                        } else {
                            tempvalue = 0;
                            tempvalue1 = Math.abs(sodunovnddauky);
                        }
                        if (sodunodauky > 0) {
                            tempvalue2 = sodunodauky;
                            tempvalue3 = 0;
                        } else {
                            tempvalue2 = 0;
                            tempvalue3 = Math.abs(sodunodauky);
                        }
                        pRow = pRow + makeRowDauky(tempvalue, tempvalue1, currencyvalue, reportype, OBJ_REPORT_TYPE, tempvalue2, tempvalue3);
                        congsopsno = 0; congsopsco = 0; congsopsnovnd = 0; congsopscovnd = 0;
                        line++;
                    }
                    if (!istotal) {
                        congsopsno = Number(objdetail.phatsinhno || 0) + congsopsno;
                        congsopsco = Number(objdetail.phatsinhco || 0) + congsopsco;
                        congsopsnovnd = Number(objdetail.phatsinhnovnd || 0) + congsopsnovnd;
                        congsopscovnd = Number(objdetail.phatsinhcovnd || 0) + congsopscovnd;
                        
                        tempvalue = (congsopsnovnd - congsopscovnd) + sodunovnddauky;
                        if (tempvalue >= 0) {
                            tempvalue1 = 0;
                        } else {
                            tempvalue1 = Math.abs(tempvalue);
                            tempvalue = 0;
                        }
                        tempvalue2 = (congsopsno - congsopsco) + sodunodauky;
                        if (tempvalue2 >= 0) {
                            tempvalue3 = 0;
                        } else {
                            tempvalue3 = Math.abs(tempvalue2);
                            tempvalue2 = 0;
                        }
                        pRow = pRow + makeRowPhatsinh(objdetail, tempvalue, tempvalue1, currencyvalue, reportype, OBJ_REPORT_TYPE, tempvalue2, tempvalue3);
                        line++;
                    }
                    icuoiky++;
                }
                account_pre = account;
            }
            if (line > 0) {
                pRow = pRow + makeRowCongsoPhatsinh(congsopsnovnd, congsopscovnd, currencyvalue, reportype, OBJ_REPORT_TYPE, congsopsno, congsopsco);
                if (foreignCurrency(currencyvalue)) {
                
                }
                line++;
                tempvalue = (congsopsnovnd - congsopscovnd) + sodunovnddauky;
                if (tempvalue >= 0) {
                    tempvalue1 = 0;
                } else {
                    tempvalue1 = Math.abs(tempvalue);
                    tempvalue = 0;
                }
                tempvalue2 = (congsopsno - congsopsco) + sodunodauky;
                if (tempvalue2 > 0) {
                    tempvalue3 = 0;
                } else {
                    tempvalue3 = Math.abs(tempvalue2);
                    tempvalue2 = 0;
                }
                pRow = pRow + makeRowCuoiky(tempvalue, tempvalue1, currencyvalue, reportype, OBJ_REPORT_TYPE, tempvalue2, tempvalue3);
                line++;
            }
            return {pRow: pRow, line: line};
        }
        
        const exportPdf = (response, parameters, fieldgroup, list_total, list_detail, list_acc, not_level, acc_level, currencyvalue, reportype, OBJ_REPORT_TYPE, istotal) => {
            let pRow = '', tempvalue, tempvalue1, tempvalue2, tempvalue3;
            let objdetail, account, account_text, account_pre = '', line = 0, objtotal, sodunodauky = 0,
                sodunovnddauky = 0;
            let congsopsno = 0, congsopsco = 0, congsopsnovnd = 0, congsopscovnd = 0;
            let icuoiky = 0, acc_parent, acc_parent_num, acc_parent_name, acc_ccc = {}, acc_lv;
            for (let i in list_detail) {
                objdetail = list_detail[i];
                account = objdetail[fieldgroup.account];
                account_text = objdetail[fieldgroup.account_text];
                if (!objdetail.isget && (!istotal || ((objdetail.sodunovnd || 0) - (objdetail.soducovnd || 0) !== 0))) {
                    if (account !== account_pre) {
                        if (icuoiky > 0) {
                            pRow = pRow + makeRowCongsoPhatsinhPdf(congsopsnovnd, congsopscovnd, currencyvalue, reportype, OBJ_REPORT_TYPE, congsopsno, congsopsco);
                            line++;
                            tempvalue = (congsopsnovnd - congsopscovnd) + sodunovnddauky;
                            if (tempvalue >= 0) {
                                tempvalue1 = 0;
                            } else {
                                tempvalue1 = Math.abs(tempvalue);
                                tempvalue = 0;
                            }
                            tempvalue2 = (congsopsno - congsopsco) + sodunodauky;
                            if (tempvalue2 > 0) {
                                tempvalue3 = 0;
                            } else {
                                tempvalue3 = Math.abs(tempvalue2);
                                tempvalue2 = 0;
                            }
                            pRow = pRow + makeRowCuoikyPdf(tempvalue, tempvalue1, currencyvalue, reportype, OBJ_REPORT_TYPE, tempvalue2, tempvalue3);
                            line++;
                        }
                        acc_parent = list_acc.find(e => String(e.id) === String(objdetail.account));
                        if (!!acc_parent && not_level !== 'T') {
                            acc_parent_num = acc_parent.custrecord_scv_cct_acc_parent;
                            acc_parent_name = acc_parent.custrecord_scv_cct_acc_parent_name;
                            if (!!acc_parent_num) {
                                acc_parent_num = acc_parent_num.split('//');
                                acc_parent_name = acc_parent_name.split('//');
                                acc_lv = acc_parent_num.length;
                                if (!!acc_level && acc_level < acc_lv) {
                                    acc_lv = acc_level;
                                }
                                for (let iacc = 0; iacc < acc_lv; iacc++) {
                                    if (!acc_ccc[acc_parent_num[iacc]]) {
                                        pRow = pRow + makeRowDiengiaiPdf(((acc_parent_num[iacc] || '') + ' ' + (acc_parent_name[iacc] || '')) || '.', currencyvalue, reportype, OBJ_REPORT_TYPE);
                                        line++;
                                        acc_ccc[acc_parent_num[iacc]] = acc_parent_num[iacc];
                                    }
                                }
                                if (!acc_level || acc_level > acc_lv) {
                                    pRow = pRow + makeRowDiengiaiPdf((acc_parent.accountsearchdisplayname) || '.', currencyvalue, reportype, OBJ_REPORT_TYPE);
                                    line++;
                                }
                            }
                        } else {
                            pRow = pRow + makeRowDiengiaiPdf(account_text, currencyvalue, reportype, OBJ_REPORT_TYPE);
                            line++;
                        }
                        
                        if (!istotal) {
                            objtotal = list_total.find(o => String(o[fieldgroup.account]) === String(account)) || {};
                            objtotal.isget = true;
                        } else {
                            objtotal = objdetail;
                        }
                        sodunodauky = (objtotal.soduno || 0) - (objtotal.soduco || 0);
                        sodunovnddauky = (objtotal.sodunovnd || 0) - (objtotal.soducovnd || 0);
                        if (sodunovnddauky >= 0) {
                            tempvalue = sodunovnddauky;
                            tempvalue1 = 0;
                        } else {
                            tempvalue = 0;
                            tempvalue1 = Math.abs(sodunovnddauky);
                        }
                        if (sodunodauky > 0) {
                            tempvalue2 = sodunodauky;
                            tempvalue3 = 0;
                        } else {
                            tempvalue2 = 0;
                            tempvalue3 = Math.abs(sodunodauky);
                        }
                        pRow = pRow + makeRowDaukyPdf(tempvalue, tempvalue1, currencyvalue, reportype, OBJ_REPORT_TYPE, tempvalue2, tempvalue3);
                        congsopsno = 0; congsopsco = 0; congsopsnovnd = 0; congsopscovnd = 0;
                        line++;
                    }
                    if (!istotal) {
                        congsopsno = Number(objdetail.phatsinhno || 0) + congsopsno;
                        congsopsco = Number(objdetail.phatsinhco || 0) + congsopsco;
                        congsopsnovnd = Number(objdetail.phatsinhnovnd || 0) + congsopsnovnd;
                        congsopscovnd = Number(objdetail.phatsinhcovnd || 0) + congsopscovnd;
                        
                        tempvalue = (congsopsnovnd - congsopscovnd) + sodunovnddauky;
                        if (tempvalue >= 0) {
                            tempvalue1 = 0;
                        } else {
                            tempvalue1 = Math.abs(tempvalue);
                            tempvalue = 0;
                        }
                        tempvalue2 = (congsopsno - congsopsco) + sodunodauky;
                        if (tempvalue2 >= 0) {
                            tempvalue3 = 0;
                        } else {
                            tempvalue3 = Math.abs(tempvalue2);
                            tempvalue2 = 0;
                        }
                        pRow = pRow + makeRowPhatsinhPdf(objdetail, tempvalue, tempvalue1, currencyvalue, reportype, OBJ_REPORT_TYPE, tempvalue2, tempvalue3);
                        line++;
                    }
                    icuoiky++;
                }
                account_pre = account;
            }
            if (line > 0) {
                pRow = pRow + makeRowCongsoPhatsinhPdf(congsopsnovnd, congsopscovnd, currencyvalue, reportype, OBJ_REPORT_TYPE, congsopsno, congsopsco);
                if (foreignCurrency(currencyvalue)) {
                
                }
                line++;
                tempvalue = (congsopsnovnd - congsopscovnd) + sodunovnddauky;
                if (tempvalue >= 0) {
                    tempvalue1 = 0;
                } else {
                    tempvalue1 = Math.abs(tempvalue);
                    tempvalue = 0;
                }
                tempvalue2 = (congsopsno - congsopsco) + sodunodauky;
                if (tempvalue2 > 0) {
                    tempvalue3 = 0;
                } else {
                    tempvalue3 = Math.abs(tempvalue2);
                    tempvalue2 = 0;
                }
                pRow = pRow + makeRowCuoikyPdf(tempvalue, tempvalue1, currencyvalue, reportype, OBJ_REPORT_TYPE, tempvalue2, tempvalue3);
                line++;
            }
            return {pRow: pRow,};
        }
        
        // Escape xml special char
        const esXml = (str) => {
            return xml.escape(str);
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
        
        const getTitleReportPdf = (reportId) => {
            let container = {}
            // Chi tiết cân đối phát sinh
            container.customsearch_scv_vas_cdpsdt = "Sổ chi tiết";
            // Chi tiết công nợ
            container.customsearch_scv_vas_ctcndt = "Sổ chi tiết công nợ";
            // Sổ quỹ tiền
            container.customsearch_scv_vas_sqtdt = "Sổ quỹ tiền";
            return container[reportId]
        }
        
        const getHeaderTablePdf = (reportId, isNoCurrency) => {
            let container = {};
            // Chi tiết cân đối phát sinh
            container.customsearch_scv_vas_cdpsdt = isNoCurrency ? `
						<tr>
							<td width = "7%" border = "none"/> <td width = "7%" border = "none"/> <td width = "10%" border = "none"/> <td width = "20%" border = "none"/> <td width = "14%" border = "none"/> <td width = "14%" border = "none"/> <td width = "14%" border = "none"/> <td width = "14%" border = "none"/>
						</tr>
						<tr border-top = "1pt solid black">
							<td rowspan="2"><p>Ngày tháng</p></td><td rowspan="2"><p>Ngày CT</p></td><td rowspan="2"><p>Số CT</p></td><td rowspan="2"><p>Diễn giải</p></td><td colspan="2"><p>Số phát sinh</p></td><td colspan="2"><p>Số dư</p></td>
						</tr>
						<tr><td><p>Nợ</p></td><td><p>Có</p></td><td><p>Nợ</p></td><td><p>Có</p></td></tr>
						<tr>
							<td><b>A</b></td><td><b>B</b></td><td><b>C</b></td><td><b>D</b></td><td><b>1</b></td><td><b>2</b></td><td><b>3</b></td><td><b>4</b></td>
						</tr>
						`
                :
                `
						<tr><td width = "6%" border = "none"/><td width = "6%" border = "none"/><td width = "9%" border = "none"/><td width = "14%" border = "none"/><td width = "6%" border = "none"/><td width = "6%" border = "none"/><td width = "7%" border = "none"/><td width = "7%" border = "none"/><td width = "7%" border = "none"/><td width = "7%" border = "none"/><td width = "7%" border = "none"/><td width = "7%" border = "none"/><td width = "7%" border = "none"/></tr>
						<tr border-top = "1pt solid black">
							<td rowspan="2"><p>Ngày tháng</p></td><td rowspan="2"><p>Ngày CT</p></td><td rowspan="2"><p>Số CT</p></td><td rowspan="2"><p>Diễn giải</p></td><td rowspan="2"><p>Tỷ giá</p></td><td colspan="4"><p>Số phát sinh</p></td><td colspan="4"><p>Số dư</p></td>
						</tr>
						<tr>
							<td><p>Nợ</p></td> <td><p>Nợ VND</p></td> <td><p>Có</p></td> <td><p>Có VND</p></td> <td><p>Nợ</p></td> <td><p>Nợ VND</p></td> <td><p>Có</p></td> <td><p>Có VND</p></td>
						</tr>
						<tr>
							<td><b>A</b></td><td><b>B</b></td><td><b>C</b></td><td><b>D</b></td><td><b>E</b></td><td><b>1</b></td><td><b>2</b></td><td><b>3</b></td><td><b>4</b></td><td><b>5</b></td><td><b>6</b></td><td><b>7</b></td><td><b>8</b></td>
						</tr>
						`;
            // Chi tiết công nợ
            container.customsearch_scv_vas_ctcndt = isNoCurrency ? `
						<tr>
							<td width = "7%" border = "none"/> <td width = "7%" border = "none"/> <td width = "10%" border = "none"/> <td width = "20%" border = "none"/> <td width = "14%" border = "none"/> <td width = "14%" border = "none"/> <td width = "14%" border = "none"/> <td width = "14%" border = "none"/>
						</tr>
						<tr border-top = "1pt solid black">
							<td rowspan="2"><p>Ngày tháng</p></td><td colspan="2"><p>Chứng từ</p></td><td rowspan="2"><p>Diễn giải</p></td><td colspan="2"><p>Số phát sinh</p></td><td colspan="2"><p>Số dư</p></td>
						</tr>
						<tr><td><p>Ngày CT</p></td><td><p>Số CT</p></td><td><p>Nợ</p></td><td><p>Có</p></td><td><p>Nợ</p></td><td><p>Có</p></td></tr>
						<tr>
							<td><b>A</b></td><td><b>B</b></td><td><b>C</b></td><td><b>D</b></td><td><b>1</b></td><td><b>2</b></td><td><b>3</b></td><td><b>4</b></td>
						</tr>
						`
                :
                `
						<tr><td width = "6%" border = "none"/><td width = "6%" border = "none"/><td width = "9%" border = "none"/><td width = "14%" border = "none"/><td width = "6%" border = "none"/><td width = "6%" border = "none"/><td width = "7%" border = "none"/><td width = "7%" border = "none"/><td width = "7%" border = "none"/><td width = "7%" border = "none"/><td width = "7%" border = "none"/><td width = "7%" border = "none"/><td width = "7%" border = "none"/></tr>
						<tr border-top = "1pt solid black">
							<td rowspan="2"><p>Ngày tháng</p></td><td colspan="2"><p>Chứng từ</p></td><td rowspan="2"><p>Diễn giải</p></td><td rowspan="2"><p>Tỷ giá</p></td><td colspan="4"><p>Số phát sinh</p></td><td colspan="4"><p>Số dư</p></td>
						</tr>
						<tr>
							<td><p>Ngày CT</p></td><td><p>Số CT</p></td><td><p>Nợ</p></td> <td><p>Nợ VND</p></td> <td><p>Có</p></td> <td><p>Có VND</p></td> <td><p>Nợ</p></td> <td><p>Nợ VND</p></td> <td><p>Có</p></td> <td><p>Có VND</p></td>
						</tr>
						<tr>
							<td><b>A</b></td><td><b>B</b></td><td><b>C</b></td><td><b>D</b></td><td><b>E</b></td><td><b>1</b></td><td><b>2</b></td><td><b>3</b></td><td><b>4</b></td><td><b>5</b></td><td><b>6</b></td><td><b>7</b></td><td><b>8</b></td>
						</tr>
						`;
            // Sổ quỹ tiền
            container.customsearch_scv_vas_sqtdt = isNoCurrency ? `
						<tr>
							<td width = "7%" border = "none"/> <td width = "7%" border = "none"/> <td width = "8%" border = "none"/> <td width = "11%" border = "none"/> <td width = "11%" border = "none"/> <td width = "14%" border = "none"/> <td width = "14%" border = "none"/> <td width = "14%" border = "none"/> <td width = "14%" border = "none"/>
						</tr>
						<tr border-top = "1pt solid black">
							<td rowspan="2"><p>Ngày tháng</p></td><td colspan="2"><p>Chứng từ</p></td><td rowspan="2"><p>Diễn giải</p></td><td rowspan="2"><p>Đối tượng</p></td><td colspan="2"><p>Số phát sinh</p></td><td colspan="2"><p>Số dư</p></td>
						</tr>
						<tr><td><p>Ngày CT</p></td><td><p>Số CT</p></td><td><p>Nợ</p></td><td><p>Có</p></td><td><p>Nợ</p></td><td><p>Có</p></td></tr>
						<tr>
							<td><b>A</b></td><td><b>B</b></td><td><b>C</b></td><td><b>D</b></td><td><b>F</b></td><td><b>1</b></td><td><b>2</b></td><td><b>3</b></td><td><b>4</b></td>
						</tr>
						`
                :
                `
						<tr><td width = "6%" border = "none"/><td width = "6%" border = "none"/><td width = "9%" border = "none"/><td width = "14%" border = "none"/><td width = "6%" border = "none"/><td width = "6%" border = "none"/><td width = "7%" border = "none"/><td width = "7%" border = "none"/><td width = "7%" border = "none"/><td width = "7%" border = "none"/><td width = "7%" border = "none"/><td width = "7%" border = "none"/><td width = "7%" border = "none"/></tr>
						<tr border-top = "1pt solid black">
							<td rowspan="2"><p>Ngày tháng</p></td><td colspan="2"><p>Chứng từ</p></td><td rowspan="2"><p>Diễn giải</p></td><td rowspan="2"><p>Đối tượng</p></td><td rowspan="2"><p>Tỷ giá</p></td><td colspan="4"><p>Số phát sinh</p></td><td colspan="4"><p>Số dư</p></td>
						</tr>
						<tr>
							<td><p>Ngày CT</p></td><td><p>Số CT</p></td><td><p>Nợ</p></td> <td><p>Nợ VND</p></td> <td><p>Có</p></td> <td><p>Có VND</p></td> <td><p>Nợ</p></td> <td><p>Nợ VND</p></td> <td><p>Có</p></td> <td><p>Có VND</p></td>
						</tr>
						<tr>
							<td><b>A</b></td><td><b>B</b></td><td><b>C</b></td><td><b>D</b></td><td><b>E</b></td><td><b>F</b></td><td><b>1</b></td><td><b>2</b></td><td><b>3</b></td><td><b>4</b></td><td><b>5</b></td><td><b>6</b></td><td><b>7</b></td><td><b>8</b></td>
						</tr>
						`;
            return container[reportId];
        }
        
        const makeRowDiengiaiPdf = (diengiai, currencyvalue, reportype, OBJ_REPORT_TYPE) => {
            let rowData = '';
            diengiai = esXml(diengiai || '');
            if (!foreignCurrency(currencyvalue)) {
                if (reportype === OBJ_REPORT_TYPE.CT_CDPS) {
                    rowData = `<tr font-weight = "bold"><td colspan = "8"><p>${(diengiai)}</p></td></tr>`;
                } else if (reportype === OBJ_REPORT_TYPE.CT_CN) {
                    rowData = `<tr font-weight = "bold"><td colSpan="8"><p>${diengiai}</p></td></tr>`;
                } else if (reportype === OBJ_REPORT_TYPE.CT_SQT) {
                    rowData = `<tr font-weight = "bold"><td colSpan="9"><p>${diengiai}</p></td></tr>`;
                }
            } else {
                if (reportype === OBJ_REPORT_TYPE.CT_CDPS) {
                    rowData = `<tr font-weight = "bold"><td colSpan="13"><p>${diengiai}</p></td></tr>`;
                } else if (reportype === OBJ_REPORT_TYPE.CT_CN) {
                    rowData = `<tr font-weight = "bold"><td colSpan="13"><p>${diengiai}</p></td></tr>`;
                } else if (reportype === OBJ_REPORT_TYPE.CT_SQT) {
                    rowData = `<tr font-weight = "bold"><td colSpan="14"><p>${diengiai}</p></td></tr>`;
                }
            }
            return rowData;
        }
        
        const makeRowDaukyPdf = (sodunovnddauky, soducovnddauky, currencyvalue, reportype, OBJ_REPORT_TYPE, sodunodauky, soducodauky) => {
            let rowData = '';
            if (!foreignCurrency(currencyvalue)) {
                if (reportype === OBJ_REPORT_TYPE.CT_CDPS) {
                    rowData = `
					<tr font-weight = "bold">
						<td/><td/><td/>
						<td >- Số dư đầu kỳ</td>
						<td><p text-align = "right">0</p></td>
						<td><p text-align = "right">0</p></td>
						<td><p text-align = "right">${changeCurrency(sodunovnddauky)}</p></td>
						<td><p text-align = "right">${changeCurrency(soducovnddauky)}</p></td>
					</tr>
				`;
                } else if (reportype === OBJ_REPORT_TYPE.CT_CN) {
                    rowData = `
					<tr font-weight = "bold">
						<td/><td/><td/>
						<td>- Số dư đầu kỳ</td>
						<td><p text-align = "right">0</p></td>
						<td><p text-align = "right">0</p></td>
						<td><p text-align = "right">${changeCurrency(sodunovnddauky)}</p></td>
						<td><p text-align = "right">${changeCurrency(soducovnddauky)}</p></td>
					</tr>
				`;
                } else if (reportype === OBJ_REPORT_TYPE.CT_SQT) {
                    rowData = `
					<tr font-weight = "bold">
						<td/><td/><td/>
						<td>- Số dư đầu kỳ</td>
						<td/>
						<td><p text-align = "right">0</p></td>
						<td><p text-align = "right">0</p></td>
						<td><p text-align = "right">${changeCurrency(sodunovnddauky)}</p></td>
						<td><p text-align = "right">${changeCurrency(soducovnddauky)}</p></td>
					</tr>
				`;
                }
            } else {
                if (reportype === OBJ_REPORT_TYPE.CT_CDPS) {
                    rowData = `
					<tr font-weight = "bold">
						<td/><td/><td/>
						<td>- Số dư đầu kỳ</td>
						<td/>
						<td><p text-align = "right">0</p></td>
						<td><p text-align = "right">0</p></td>
						<td><p text-align = "right">0</p></td>
						<td><p text-align = "right">0</p></td>
						<td><p text-align = "right">${changeCurrency(sodunodauky, 2)}</p></td>
						<td><p text-align = "right">${changeCurrency(sodunovnddauky)}</p></td>
						<td><p text-align = "right">${changeCurrency(soducodauky, 2)}</p></td>
						<td><p text-align = "right">${changeCurrency(soducovnddauky)}</p></td>
					</tr>
				`;
                } else if (reportype === OBJ_REPORT_TYPE.CT_CN) {
                    rowData = `
					<tr font-weight = "bold">
						<td/><td/><td/>
						<td>- Số dư đầu kỳ</td>
						<td/>
						<td><p text-align = "right">0</p></td>
						<td><p text-align = "right">0</p></td>
						<td><p text-align = "right">0</p></td>
						<td><p text-align = "right">0</p></td>
						<td><p text-align = "right">${changeCurrency(sodunodauky, 2)}</p></td>
						<td><p text-align = "right">${changeCurrency(sodunovnddauky)}</p></td>
						<td><p text-align = "right">${changeCurrency(soducodauky, 2)}</p></td>
						<td><p text-align = "right">${changeCurrency(soducovnddauky)}</p></td>
					</tr>
				`;
                } else if (reportype === OBJ_REPORT_TYPE.CT_SQT) {
                    rowData = `
					<tr font-weight = "bold">
						<td/><td/><td/>
						<td>- Số dư đầu kỳ</td>
						<td/>
						<td/>
						<td><p text-align = "right">0</p></td>
						<td><p text-align = "right">0</p></td>
						<td><p text-align = "right">0</p></td>
						<td><p text-align = "right">0</p></td>
						<td><p text-align = "right">${changeCurrency(sodunodauky, 2)}</p></td>
						<td><p text-align = "right">${changeCurrency(sodunovnddauky)}</p></td>
						<td><p text-align = "right">${changeCurrency(soducodauky, 2)}</p></td>
						<td><p text-align = "right">${changeCurrency(soducovnddauky)}</p></td>
					</tr>
				`;
                }
            }
            return rowData;
        }
        
        const makeRowPhatsinhPdf = (objdetail, sodunovnddauky, soducovnddauky, currencyvalue, reportype, OBJ_REPORT_TYPE, sodunodauky, soducodauky) => {
            let rowData = '';
            if (!foreignCurrency(currencyvalue)) {
                if (reportype === OBJ_REPORT_TYPE.CT_CDPS) {
                    rowData = `
					<tr>
						<td><p text-align = "left">${objdetail.trandate || ''}</p></td>
						<td><p>${objdetail.ngayct || ''}</p></td>
						<td><p>${objdetail.soct || ''}</p></td>
						<td><p>${esXml(objdetail.diengiai)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.phatsinhnovnd || 0)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.phatsinhcovnd || 0)}</p></td>
						<td><p text-align = "right">${changeCurrency(sodunovnddauky)}</p></td>
						<td><p text-align = "right">${changeCurrency(soducovnddauky)}</p></td>
					</tr>
				`;
                } else if (reportype === OBJ_REPORT_TYPE.CT_CN) {
                    rowData = `
					<tr>
						<td><p text-align = "left">${objdetail.trandate || ''}</p></td>
						<td><p>${objdetail.ngayct || ''}</p></td>
						<td><p>${objdetail.soct || ''}</p></td>
						<td><p>${esXml(objdetail.diengiai)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.phatsinhnovnd || 0)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.phatsinhcovnd || 0)}</p></td>
						<td><p text-align = "right">${changeCurrency(sodunovnddauky)}</p></td>
						<td><p text-align = "right">${changeCurrency(soducovnddauky)}</p></td>
					</tr>
				`;
                } else if (reportype === OBJ_REPORT_TYPE.CT_SQT) {
                    rowData = `
					<tr>
						<td><p text-align = "left">${objdetail.trandate || ''}</p></td>
						<td><p>${objdetail.ngayct || ''}</p></td>
						<td><p>${objdetail.soct || ''}</p></td>
						<td><p>${esXml(objdetail.diengiai || '')}</p></td>
						<td><p>${esXml(objdetail.doituong || '')}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.phatsinhnovnd || 0)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.phatsinhcovnd || 0)}</p></td>
						<td><p text-align = "right">${changeCurrency(sodunovnddauky)}</p></td>
						<td><p text-align = "right">${changeCurrency(soducovnddauky)}</p></td>
					</tr>
				`;
                }
            } else {
                if (reportype === OBJ_REPORT_TYPE.CT_CDPS) {
                    rowData = `
					<tr>
						<td><p text-align = "left">${objdetail.trandate || ''}</p></td>
						<td><p>${objdetail.ngayct || ''}</p></td>
						<td><p>${objdetail.soct || ''}</p></td>
						<td><p>${esXml(objdetail.diengiai || '')}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.tygia) || ''}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.phatsinhno || 0, 2)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.phatsinhnovnd || 0)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.phatsinhco || 0, 2)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.phatsinhcovnd || 0)}</p></td>
						<td><p text-align = "right">${changeCurrency(sodunodauky, 2)}</p></td>
						<td><p text-align = "right">${changeCurrency(sodunovnddauky)}</p></td>
						<td><p text-align = "right">${changeCurrency(soducodauky, 2)}</p></td>
						<td><p text-align = "right">${changeCurrency(soducovnddauky)}</p></td>
					</tr>
				`;
                } else if (reportype === OBJ_REPORT_TYPE.CT_CN) {
                    rowData = `
					<tr>
						<td><p text-align = "left">${objdetail.trandate || ''}</p></td>
						<td><p>${objdetail.ngayct || ''}</p></td>
						<td><p>${objdetail.soct || ''}</p></td>
						<td><p>${esXml(objdetail.diengiai || '')}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.tygia) || ''}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.phatsinhno || 0, 2)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.phatsinhnovnd || 0)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.phatsinhco || 0, 2)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.phatsinhcovnd || 0)}</p></td>
						<td><p text-align = "right">${changeCurrency(sodunodauky, 2)}</p></td>
						<td><p text-align = "right">${changeCurrency(sodunovnddauky)}</p></td>
						<td><p text-align = "right">${changeCurrency(soducodauky, 2)}</p></td>
						<td><p text-align = "right">${changeCurrency(soducovnddauky)}</p></td>
					</tr>
				`;
                } else if (reportype === OBJ_REPORT_TYPE.CT_SQT) {
                    rowData = `
					<tr>
						<td><p text-align = "left">${objdetail.trandate || ''}</p></td>
						<td><p>${objdetail.ngayct || ''}</p></td>
						<td><p>${objdetail.soct || ''}</p></td>
						<td><p>${esXml(objdetail.diengiai || '')}</p></td>
						<td><p>${esXml(objdetail.doituong || '')}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.tygia) || ''}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.phatsinhno || 0, 2)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.phatsinhnovnd || 0)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.phatsinhco || 0, 2)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.phatsinhcovnd || 0)}</p></td>
						<td><p text-align = "right">${changeCurrency(sodunodauky, 2)}</p></td>
						<td><p text-align = "right">${changeCurrency(sodunovnddauky)}</p></td>
						<td><p text-align = "right">${changeCurrency(soducodauky, 2)}</p></td>
						<td><p text-align = "right">${changeCurrency(soducovnddauky)}</p></td>
					</tr>
				`;
                }
            }
            return rowData;
        }
        
        const makeRowCongsoPhatsinhPdf = (congsopsnovnd, congsopscovnd, currencyvalue, reportype, OBJ_REPORT_TYPE, congsopsno, congsopsco) => {
            let rowData = '';
            if (!foreignCurrency(currencyvalue)) {
                if (reportype === OBJ_REPORT_TYPE.CT_CDPS) {
                    rowData = `
					<tr font-weight = "bold" >
						<td/><td/><td/>
						<td>- Cộng số phát sinh</td>
						<td><p text-align = "right">${changeCurrency(congsopsnovnd)}</p></td>
						<td><p text-align = "right">${changeCurrency(congsopscovnd)}</p></td>
						<td><p text-align = "right">0</p></td>
						<td><p text-align = "right">0</p></td>
					</tr>
				`;
                } else if (reportype === OBJ_REPORT_TYPE.CT_CN) {
                    rowData = `
					<tr font-weight = "bold">
						<td/><td/><td/>
						<td>- Cộng số phát sinh</td>
						<td><p text-align="right">${changeCurrency(congsopsnovnd)}</p></td>
						<td><p text-align="right">${changeCurrency(congsopscovnd)}</p></td>
						<td><p text-align = "right">0</p></td>
						<td><p text-align = "right">0</p></td>
					</tr>
				`;
                } else if (reportype === OBJ_REPORT_TYPE.CT_SQT) {
                    rowData = `
					<tr font-weight = "bold">
						<td/><td/><td/>
						<td>- Cộng số phát sinh</td>
						<td/>
						<td><p text-align="right">${changeCurrency(congsopsnovnd)}</p></td>
						<td><p text-align="right">${changeCurrency(congsopscovnd)}</p></td>
						<td><p text-align = "right">0</p></td>
						<td><p text-align = "right">0</p></td>
					</tr>
				`;
                }
            } else {
                if (reportype === OBJ_REPORT_TYPE.CT_CDPS) {
                    rowData = `
					<tr font-weight = "bold">
						<td/><td/><td/>
						<td>- Cộng số phát sinh</td>
						<td/>
						<td/>
						<td><p text-align = "right">${changeCurrency(congsopsno, 2)}</p></td>
						<td><p text-align = "right">${changeCurrency(congsopsnovnd)}</p></td>
						<td><p text-align = "right">${changeCurrency(congsopsco, 2)}</p></td>
						<td><p text-align = "right">${changeCurrency(congsopscovnd)}</p></td>
						<td><p text-align = "right">0</p></td>
						<td><p text-align = "right">0</p></td>
						<td><p text-align = "right">0</p></td>
						<td><p text-align = "right">0</p></td>
					</tr>
				`;
                } else if (reportype === OBJ_REPORT_TYPE.CT_CN) {
                    rowData = `
					<tr font-weight = "bold">
						<td/><td/><td/>
						<td>- Cộng số phát sinh</td>
						<td/>
						<td><p text-align = "right">${changeCurrency(congsopsno, 2)}</p></td>
						<td><p text-align = "right">${changeCurrency(congsopsnovnd)}</p></td>
						<td><p text-align = "right">${changeCurrency(congsopsco, 2)}</p></td>
						<td><p text-align = "right">${changeCurrency(congsopscovnd)}</p></td>
						<td><p text-align = "right">0</p></td>
						<td><p text-align = "right">0</p></td>
						<td><p text-align = "right">0</p></td>
						<td><p text-align = "right">0</p></td>
					</tr>
				`;
                } else if (reportype === OBJ_REPORT_TYPE.CT_SQT) {
                    rowData = `
					<tr font-weight = "bold">
						<td/><td/><td/>
						<td>- Cộng số phát sinh</td>
						<td/>
						<td/>
						<td><p text-align = "right">${changeCurrency(congsopsno, 2)}</p></td>
						<td><p text-align = "right">${changeCurrency(congsopsnovnd)}</p></td>
						<td><p text-align = "right">${changeCurrency(congsopsco, 2)}</p></td>
						<td><p text-align = "right">${changeCurrency(congsopscovnd)}</p></td>
						<td><p text-align = "right">0</p></td>
						<td><p text-align = "right">0</p></td>
						<td><p text-align = "right">0</p></td>
						<td><p text-align = "right">0</p></td>
					</tr>
				`;
                }
            }
            return rowData;
        }
        
        const makeRowCuoikyPdf = (sodunovndcuoiky, soducovndcuoiky, currencyvalue, reportype, OBJ_REPORT_TYPE, sodunocuoiky, soducocuoiky) => {
            let rowData = '';
            if (!foreignCurrency(currencyvalue)) {
                if (reportype === OBJ_REPORT_TYPE.CT_CDPS) {
                    rowData = `
					<tr font-weight = "bold">
						<td/><td/><td/>
						<td>- Số dư cuối kỳ</td>
						<td><p text-align = "right">0</p></td>
						<td><p text-align = "right">0</p></td>
						<td><p text-align = "right">${changeCurrency(sodunovndcuoiky)}</p></td>
						<td><p text-align = "right">${changeCurrency(soducovndcuoiky)}</p></td>
					</tr>
				`;
                } else if (reportype === OBJ_REPORT_TYPE.CT_CN) {
                    rowData = `
					<tr  font-weight = "bold">
						<td/><td/><td/>
						<td>- Số dư cuối kỳ</td>
						<td><p text-align = "right">0</p></td>
						<td><p text-align = "right">0</p></td>
						<td><p text-align="right">${changeCurrency(sodunovndcuoiky)}</p></td>
						<td><p text-align="right">${changeCurrency(soducovndcuoiky)}</p></td>
					</tr>
				`;
                } else if (reportype === OBJ_REPORT_TYPE.CT_SQT) {
                    rowData = `
					<tr  font-weight = "bold">
						<td/><td/><td/>
						<td>- Số dư cuối kỳ</td>
						<td/>
						<td><p text-align = "right">0</p></td>
						<td><p text-align = "right">0</p></td>
						<td><p text-align="right">${changeCurrency(sodunovndcuoiky)}</p></td>
						<td><p text-align="right">${changeCurrency(soducovndcuoiky)}</p></td>
					</tr>
				`;
                }
            } else {
                if (reportype === OBJ_REPORT_TYPE.CT_CDPS) {
                    rowData = `
					<tr font-weight = "bold">
						<td/><td/><td/>
						<td>- Số dư cuối kỳ</td>
						<td/>
						<td><p text-align = "right">0</p></td>
						<td><p text-align = "right">0</p></td>
						<td><p text-align = "right">0</p></td>
						<td><p text-align = "right">0</p></td>
						<td><p text-align="right">${changeCurrency(sodunocuoiky, 2)}</p></td>
						<td><p text-align="right">${changeCurrency(sodunovndcuoiky)}</p></td>
						<td><p text-align="right">${changeCurrency(soducocuoiky, 2)}</p></td>
						<td><p text-align="right">${changeCurrency(soducovndcuoiky)}</p></td>
					</tr>
				`;
                } else if (reportype === OBJ_REPORT_TYPE.CT_CN) {
                    rowData = `
					<tr font-weight = "bold">
						<td/><td/><td/>
						<td>- Số dư cuối kỳ</td>
						<td/>
						<td/>
						<td><p text-align = "right">0</p></td>
						<td><p text-align = "right">0</p></td>
						<td><p text-align = "right">0</p></td>
						<td><p text-align = "right">0</p></td>
						<td><p text-align="right">${changeCurrency(sodunocuoiky, 2)}</p></td>
						<td><p text-align="right">${changeCurrency(sodunovndcuoiky)}</p></td>
						<td><p text-align="right">${changeCurrency(soducocuoiky, 2)}</p></td>
						<td><p text-align="right">${changeCurrency(soducovndcuoiky)}</p></td>
					</tr>
				`;
                } else if (reportype === OBJ_REPORT_TYPE.CT_SQT) {
                    rowData = `
					<tr font-weight = "bold">
						<td/><td/><td/>
						<td>- Số dư cuối kỳ</td>
						<td/>
						<td><p text-align = "right">0</p></td>
						<td><p text-align = "right">0</p></td>
						<td><p text-align = "right">0</p></td>
						<td><p text-align = "right">0</p></td>
						<td><p text-align="right">${changeCurrency(sodunocuoiky, 2)}</p></td>
						<td><p text-align="right">${changeCurrency(sodunovndcuoiky)}</p></td>
						<td><p text-align="right">${changeCurrency(soducocuoiky, 2)}</p></td>
						<td><p text-align="right">${changeCurrency(soducovndcuoiky)}</p></td>
					</tr>
				`;
                }
            }
            return rowData;
        }
        
        const createForm = (_params, master, subsidiary, account, account_parent) => {
            let form = serverWidget.createForm({title: "VAS Chi tiết CĐPS, CN, Sổ quỹ tiền"});
            form.clientScriptModulePath = '../cs/scv_cs_sl_rp_vas_dt.js';
            form.addButton({id: 'custpage_bt_search', label: 'Search', functionName: 'searchReport()'});
            form.addButton({id: 'custpage_bt_export', label: 'Export', functionName: 'exportReport()'});
            form.addButton({
                id: 'custpage_bt_export_detail',
                label: 'Export Detail',
                functionName: 'exportReportDetail()'
            });
            form.addButton({id: 'custpage_bt_printpdf', label: 'PrintPdf', functionName: 'onPrintPdf()'});
            let container = 'fieldgroup_dc_main';
            form.addFieldGroup({id: container, label: 'Criteria'});
            
            // Pin header sublist
            libFunc.pinHeaderSublist(form);
            
            let fieldReportype = form.addField({
                id: 'custpage_reportype',
                type: serverWidget.FieldType.SELECT,
                label: 'Report Type',
                container: container
            });
            fieldReportype.isMandatory = true;
            let OBJ_REPORT_TYPE = master.OBJ_REPORT_TYPE;
            let listReport = [
                {value: OBJ_REPORT_TYPE.CT_CDPS, label: 'Chi tiết Cân đối phát sinh'},
                {value: OBJ_REPORT_TYPE.CT_CN, label: 'Chi tiết Công nợ'},
                {value: OBJ_REPORT_TYPE.CT_SQT, label: 'Sổ quỹ tiền'}
                //{value: OBJ_REPORT_TYPE.CT_SNKC, label: 'Sổ nhật ký chung'}
            ];
            libRep.addSelecttionFrList(fieldReportype, _params.custpage_reportype, listReport, false);
            
            let fieldSubsidiary = form.addField({
                id: 'custpage_subsidiary',
                type: serverWidget.FieldType.MULTISELECT,
                label: 'Subsidiary',
                container: container
            });
            fieldSubsidiary.isMandatory = true;
            libRep.addSelectSubsidiary(fieldSubsidiary, subsidiary)
            
            let fieldOrderType = form.addField({
                id: 'custpage_order_type',
                type: serverWidget.FieldType.SELECT,
                label: 'Order Type',
                container: container,
                source: 'customrecord_scv_order_type'
            });
            fieldOrderType.defaultValue = _params.custpage_order_type;
            
            let fieldDateDauky = form.addField({
                id: 'custpage_date_dauky',
                type: serverWidget.FieldType.DATE,
                label: 'From Date',
                
                container: container
            }).updateLayoutType({layoutType: serverWidget.FieldLayoutType.STARTROW});
            fieldDateDauky.isMandatory = true;
            
            let fieldDateCuoiky = form.addField({
                id: 'custpage_date_cuoiky',
                type: serverWidget.FieldType.DATE,
                label: 'To Date',
                container: container
            }).updateLayoutType({layoutType: serverWidget.FieldLayoutType.ENDROW});
            fieldDateCuoiky.isMandatory = true;
            
            fieldDateDauky.defaultValue = getFromDate(_params.custpage_date_dauky);
            fieldDateCuoiky.defaultValue = getToDate(_params.custpage_date_cuoiky);
            
            let fieldExportbc = form.addField({
                id: 'custpage_exportbc', type: serverWidget.FieldType.SELECT,
                label: 'Export?', container: container
            });
            addExportBC(fieldExportbc, _params.custpage_exportbc);
            
            let c = ['internalid', {name: 'formulatext', formula: "{number} || ' ' || {name}", sort: 'ASC'}];
            let f = [['issummary', 'is', true]];
            let custpage_account_parent = form.addField({
                id: 'custpage_account_parent', type: serverWidget.FieldType.MULTISELECT,
                label: 'Account Summary', container: 'fieldgroup_dc_main'
            });
            libRep.addSelectionMulti(custpage_account_parent, 'account', c, f, true, account_parent);
            
            let fieldAccount = form.addField({
                id: 'custpage_account',
                type: serverWidget.FieldType.MULTISELECT,
                label: 'Account',
                container: container,
                source: 'account'
            });
            fieldAccount.defaultValue = account;
            
            let fieldNotLevel = form.addField({
                id: 'custpage_not_level',
                type: serverWidget.FieldType.CHECKBOX,
                label: 'Not Level',
                container: container
            }).updateLayoutType({layoutType: serverWidget.FieldLayoutType.STARTROW});
            fieldNotLevel.defaultValue = _params.custpage_not_level || 'F';
            
            let fieldAccLevel = form.addField({
                id: 'custpage_acc_level',
                type: serverWidget.FieldType.SELECT,
                label: 'Account Level',
                container: container,
                source: 'customlist_scv_acc_level'
            }).updateLayoutType({layoutType: serverWidget.FieldLayoutType.ENDROW});
            fieldAccLevel.defaultValue = _params.custpage_acc_level;
            
            let fieldCurrencyvalue = form.addField({
                id: 'custpage_currencyvalue',
                type: serverWidget.FieldType.SELECT,
                label: 'Currency',
                source: 'currency',
                container: container
            });
            fieldCurrencyvalue.defaultValue = _params.custpage_currencyvalue;
            
            let fieldClassification = form.addField({
                id: 'custpage_classification',
                type: serverWidget.FieldType.SELECT,
                label: 'Class',
                container: container,
                source: 'classification'
            });
            fieldClassification.defaultValue = _params.custpage_classification;
            
            let fieldLocation = form.addField({
                id: 'custpage_location',
                type: serverWidget.FieldType.SELECT,
                label: 'Location',
                container: container,
                source: 'location'
            });
            fieldLocation.defaultValue = _params.custpage_location;
            
            let fieldDepartment = form.addField({
                id: 'custpage_department',
                type: serverWidget.FieldType.SELECT,
                label: 'Department',
                container: container,
                source: 'department'
            });
            fieldDepartment.defaultValue = _params.custpage_department;
            
            let fieldKmcp = form.addField({
                id: 'custpage_kmcp',
                type: serverWidget.FieldType.SELECT,
                label: 'Mã phí',
                container: container,
                source: 'customrecord_cseg_scv_kmcp'
            });
            fieldKmcp.defaultValue = _params.custpage_kmcp;
            
            
            let fieldEntity = form.addField({
                id: 'custpage_entity',
                type: serverWidget.FieldType.TEXT,
                label: 'Name',
                container: container
            });
            fieldEntity.defaultValue = _params.custpage_entity;
            
            let sublist = form.addSublist({
                id: master.sl_ct,
                type: serverWidget.SublistType.LIST,
                label: 'KẾT QUẢ'
            });
            return {form: form, sublist: sublist};
        }
        
        const addExportBC = (custpage_exportbc, exportbc) => {
            custpage_exportbc.addSelectOption({value: '', text: ''});
            let listVl = [{value: 'T', text: 'Yes'}, {value: 'F', text: 'No'}];
            let isSelected = false;
            for (let j in listVl) {
                isSelected = exportbc === listVl[j].value.toString();
                custpage_exportbc.addSelectOption({
                    value: listVl[j].value,
                    text: listVl[j].text,
                    isSelected: isSelected
                });
            }
        }
        
        const getFromDate = (_fromdt) => {
            if (_fromdt) {
                return _fromdt
            }
            let d = new Date();
            return new Date(d.getFullYear(), d.getMonth(), "01");
        }
        
        const getToDate = (_todt) => {
            if (_todt) {
                return _todt
            }
            return new Date();
        }
        
        const pushFiltersTotal = (f, parameters, subsidiary, entity, currencyvalue, account, date_dauky, currencytext) => {
            f.push(search.createFilter({name: 'subsidiary', operator: search.Operator.ANYOF, values: subsidiary}));
            if (entity) {
                f.push(search.createFilter({
                    name: 'formulatext', operator: search.Operator.CONTAINS, values: entity,
                    formula: "case when {type} like 'Journal%' and {account} like '3311%' then {entity} else nvl(nvl(nvl(nvl(nvl({entity}, {customer.companyname}), {vendorline.companyname}),{vendor.entityid}),{name}),{custbody_scv_payee}) end"
                }));
            }
            if (currencyvalue) {
                if (currencyvalue === '1') {
                    f.push(search.createFilter({
                        name: 'currency',
                        operator: search.Operator.ANYOF,
                        values: currencyvalue
                    }));
                    f.push(search.createFilter({name: 'type', operator: search.Operator.NONEOF, values: 'FxReval'}));
                } else {
                    f.push(search.createFilter({
                        name: 'formulanumeric', operator: search.Operator.EQUALTO, values: '1',
                        formula: "case when {type} = 'Currency Revaluation' and {account} != '635%' and {account} != '515%' and {account} != '413%' then (case when {account.type} = 'Bank' and {account.custrecord_scv_acc_rpcurrency} = '" + currencytext + "' then '1' when {account.type} != 'Bank' and nvl({vendorline.custentity_scv_acc_rpcurrency},{customer.custentity_scv_acc_rpcurrency}) = '" + currencytext + "' then '1' else '0' end) when {currency} = '" + currencytext + "' then '1' else '0' end"
                    }));
                }
            }
            if (!!date_dauky) {
                f.push(search.createFilter({name: 'trandate', operator: search.Operator.BEFORE, values: date_dauky}));
            }
            if (!!account) {
                f.push(search.createFilter({name: 'account', operator: search.Operator.ANYOF, values: account}));
            }
            if (!!parameters.custpage_order_type) {
                f.push(search.createFilter({
                    name: 'custbody_scv_order_type',
                    operator: search.Operator.ANYOF,
                    values: parameters.custpage_order_type
                }));
            }
            if (!!parameters.custpage_classification) {
                f.push(search.createFilter({
                    name: 'class',
                    operator: search.Operator.ANYOF,
                    values: parameters.custpage_classification
                }));
            }
            if (!!parameters.custpage_location) {
                f.push(search.createFilter({
                    name: 'location',
                    operator: search.Operator.ANYOF,
                    values: parameters.custpage_location
                }));
            }
            if (!!parameters.custpage_department) {
                f.push(search.createFilter({
                    name: 'department',
                    operator: search.Operator.ANYOF,
                    values: parameters.custpage_department
                }));
            }
            if (!!parameters.custpage_kmcp) {
                f.push(search.createFilter({
                    name: 'formulatext',
                    formula: "nvl({line.cseg_scv_kmcp.id},{cseg_scv_kmcp.id})",
                    operator: search.Operator.IS,
                    values: parameters.custpage_kmcp
                }));
            }
            if (!!parameters.custpage_exportbc) {
                f.push(search.createFilter({
                    name: 'formulatext',
                    formula: "case when {custbody_scv_export} = 'T' then 'T' else 'F' end",
                    operator: search.Operator.IS,
                    values: parameters.custpage_exportbc
                }));
            }
        }
        
        const pushFiltersDetail = (f, parameters, subsidiary, entity, currencyvalue, account, date_dauky, date_cuoiky, currencytext) => {
            f.push(search.createFilter({name: 'subsidiary', operator: search.Operator.ANYOF, values: subsidiary}));
            f.push(search.createFilter({name: 'trandate', operator: search.Operator.ONORAFTER, values: date_dauky}));
            f.push(search.createFilter({name: 'trandate', operator: search.Operator.ONORBEFORE, values: date_cuoiky}));
            
            if (!!entity) {
                if (entity === '- None -') {
                    f.push(search.createFilter({
                        name: 'formulatext', operator: search.Operator.ISEMPTY, values: '',
                        formula: "case when {type} like 'Journal%' and {account} like '3311%' then {entity} else nvl(nvl(nvl(nvl(nvl({entity}, {customer.companyname}), {vendorline.companyname}),{vendor.entityid}),{name}),{custbody_scv_payee}) end"
                    }));
                } else {
                    f.push(search.createFilter({
                        name: 'formulatext', operator: search.Operator.CONTAINS, values: entity,
                        formula: "case when {type} like 'Journal%' and {account} like '3311%' then {entity} else nvl(nvl(nvl(nvl(nvl({entity}, {customer.companyname}), {vendorline.companyname}),{vendor.entityid}),{name}),{custbody_scv_payee}) end"
                    }));
                }
            }
            if (!!currencyvalue) {
                if (currencyvalue === '1') {
                    f.push(search.createFilter({
                        name: 'currency',
                        operator: search.Operator.ANYOF,
                        values: currencyvalue
                    }));
                    f.push(search.createFilter({name: 'type', operator: search.Operator.NONEOF, values: 'FxReval'}));
                } else {
                    f.push(search.createFilter({
                        name: 'formulanumeric', operator: search.Operator.EQUALTO, values: '1',
                        formula: "case when {type} = 'Currency Revaluation' and {account} != '635%' and {account} != '515%' and {account} != '413%' then (case when {account.type} = 'Bank' and {account.custrecord_scv_acc_rpcurrency} = '" + currencytext + "' then '1' when {account.type} != 'Bank' and nvl({vendorline.custentity_scv_acc_rpcurrency},{customer.custentity_scv_acc_rpcurrency}) = '" + currencytext + "' then '1' else '0' end) when {currency} = '" + currencytext + "' then '1' else '0' end"
                    }));
                }
            }
            if (!!account) {
                f.push(search.createFilter({name: 'account', operator: search.Operator.ANYOF, values: account}));
            }
            if (!!parameters.custpage_order_type) {
                f.push(search.createFilter({
                    name: 'custbody_scv_order_type',
                    operator: search.Operator.ANYOF,
                    values: parameters.custpage_order_type
                }));
            }
            if (!!parameters.custpage_classification) {
                f.push(search.createFilter({
                    name: 'class',
                    operator: search.Operator.ANYOF,
                    values: parameters.custpage_classification
                }));
            }
            if (!!parameters.custpage_location) {
                f.push(search.createFilter({
                    name: 'location',
                    operator: search.Operator.ANYOF,
                    values: parameters.custpage_location
                }));
            }
            if (!!parameters.custpage_department) {
                f.push(search.createFilter({
                    name: 'department',
                    operator: search.Operator.ANYOF,
                    values: parameters.custpage_department
                }));
            }
            if (!!parameters.custpage_kmcp) {
                f.push(search.createFilter({
                    name: 'cseg_scv_kmcp',
                    operator: search.Operator.ANYOF,
                    values: parameters.custpage_kmcp
                }));
            }
            if (!!parameters.custpage_exportbc) {
                f.push(search.createFilter({
                    name: 'formulatext',
                    formula: "case when {custbody_scv_export} = 'T' then 'T' else 'F' end",
                    operator: search.Operator.IS,
                    values: parameters.custpage_exportbc
                }));
            }
        }
        
        const getSublistColMaster = () => {
            let field_select = 'custpage_sl_select';
            let sl_ct = 'custpage_sl_ct';
            let col_sl_ctcdps = [
                {id: 'trandate', label: 'Date', type: 'date', display: serverWidget.FieldDisplayType.INLINE},
                //{id: 'tranid', label: 'Số phiếu', type: 'text', display: serverWidget.FieldDisplayType.INLINE},
                {id: 'ngayct', label: 'Ngày CT', type: 'date', display: serverWidget.FieldDisplayType.INLINE},
                {id: 'soct', label: 'Số CT', type: 'text', display: serverWidget.FieldDisplayType.INLINE},
                {
                    id: 'ordertype_text',
                    label: 'Order Type',
                    type: 'text',
                    display: serverWidget.FieldDisplayType.INLINE
                },
                {id: 'diengiai', label: 'Diễn Giải', type: 'text', display: serverWidget.FieldDisplayType.INLINE},
                {id: 'tygia', label: 'Tỷ giá', type: 'float', display: serverWidget.FieldDisplayType.INLINE},
                {
                    id: 'phatsinhno',
                    label: 'Phát sinh: Nợ',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                },
                {
                    id: 'phatsinhco',
                    label: 'Phát sinh: Có',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                },
                {id: 'soduno', label: 'Số dư: Nợ', type: 'float', display: serverWidget.FieldDisplayType.INLINE},
                {id: 'soduco', label: 'Số dư: Có', type: 'float', display: serverWidget.FieldDisplayType.INLINE},
                {
                    id: 'phatsinhnovnd',
                    label: 'Phát sinh: Nợ (VND)',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                },
                {
                    id: 'phatsinhcovnd',
                    label: 'Phát sinh: Có (VND)',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                },
                {
                    id: 'sodunovnd',
                    label: 'Số dư: Nợ (VND)',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                },
                {
                    id: 'soducovnd',
                    label: 'Số dư: Có (VND)',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                },
                //{id: 'typebold', label: 'CP', type: 'text', display: serverWidget.FieldDisplayType.HIDDEN}
            ];
            
            let col_sl_ctcdps_nocurrency = [
                {id: 'trandate', label: 'Date', type: 'date', display: serverWidget.FieldDisplayType.INLINE},
                //{id: 'tranid', label: 'Số phiếu', type: 'text', display: serverWidget.FieldDisplayType.INLINE},
                {id: 'ngayct', label: 'Ngày CT', type: 'date', display: serverWidget.FieldDisplayType.INLINE},
                {id: 'soct', label: 'Số CT', type: 'text', display: serverWidget.FieldDisplayType.INLINE},
                {
                    id: 'ordertype_text',
                    label: 'Order Type',
                    type: 'text',
                    display: serverWidget.FieldDisplayType.INLINE
                },
                {id: 'diengiai', label: 'Diễn Giải', type: 'text', display: serverWidget.FieldDisplayType.INLINE},
                {
                    id: 'phatsinhnovnd',
                    label: 'Phát sinh: Nợ',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                },
                {
                    id: 'phatsinhcovnd',
                    label: 'Phát sinh: Có',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                },
                {id: 'sodunovnd', label: 'Số dư: Nợ', type: 'float', display: serverWidget.FieldDisplayType.INLINE},
                {id: 'soducovnd', label: 'Số dư: Có', type: 'float', display: serverWidget.FieldDisplayType.INLINE}
            ];
            
            let col_ss_ctcdps = [['account', 0], ['account_text', 0, 'sltext'], ['trandate', 1], ['tranid', 2], ['ngayct', 3], ['soct', 4], ['diengiai', 5],
                ['tygia', 6], ['phatsinhno', 7], ['phatsinhnovnd', 8], ['phatsinhco', 9], ['phatsinhcovnd', 10], ['id', 11], ['ordertype', 12], ['ordertype_text', 12, 'sltext']
            ];
            
            let col_sl_ctcn = [
                {id: 'trandate', label: 'Date', type: 'date', display: serverWidget.FieldDisplayType.INLINE},
                //{id: 'tranid', label: 'Số phiếu', type: 'text', display: serverWidget.FieldDisplayType.INLINE},
                {id: 'ngayct', label: 'Ngày CT', type: 'date', display: serverWidget.FieldDisplayType.INLINE},
                {id: 'soct', label: 'Số CT', type: 'text', display: serverWidget.FieldDisplayType.INLINE},
                {
                    id: 'ordertype_text',
                    label: 'Order Type',
                    type: 'text',
                    display: serverWidget.FieldDisplayType.INLINE
                },
                {id: 'diengiai', label: 'Diễn Giải', type: 'text', display: serverWidget.FieldDisplayType.INLINE},
                {id: 'tygia', label: 'Tỷ giá', type: 'float', display: serverWidget.FieldDisplayType.INLINE},
                {
                    id: 'phatsinhno',
                    label: 'Phát sinh: Nợ',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                },
                {
                    id: 'phatsinhco',
                    label: 'Phát sinh: Có',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                },
                {id: 'soduno', label: 'Số dư: Nợ', type: 'float', display: serverWidget.FieldDisplayType.INLINE},
                {id: 'soduco', label: 'Số dư: Có', type: 'float', display: serverWidget.FieldDisplayType.INLINE},
                {
                    id: 'phatsinhnovnd',
                    label: 'Phát sinh: Nợ (VND)',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                },
                {
                    id: 'phatsinhcovnd',
                    label: 'Phát sinh: Có (VND)',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                },
                {
                    id: 'sodunovnd',
                    label: 'Số dư: Nợ (VND)',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                },
                {
                    id: 'soducovnd',
                    label: 'Số dư: Có (VND)',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
            ];
            
            let col_sl_ctcn_nocurrency = [
                {id: 'trandate', label: 'Date', type: 'date', display: serverWidget.FieldDisplayType.INLINE},
                //{id: 'tranid', label: 'Số phiếu', type: 'text', display: serverWidget.FieldDisplayType.INLINE},
                {id: 'ngayct', label: 'Ngày CT', type: 'date', display: serverWidget.FieldDisplayType.INLINE},
                {id: 'soct', label: 'Số CT', type: 'text', display: serverWidget.FieldDisplayType.INLINE},
                {
                    id: 'ordertype_text',
                    label: 'Order Type',
                    type: 'text',
                    display: serverWidget.FieldDisplayType.INLINE
                },
                {id: 'diengiai', label: 'Diễn Giải', type: 'text', display: serverWidget.FieldDisplayType.INLINE},
                {
                    id: 'phatsinhnovnd',
                    label: 'Phát sinh: Nợ',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                },
                {
                    id: 'phatsinhcovnd',
                    label: 'Phát sinh: Có',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                },
                {id: 'sodunovnd', label: 'Số dư: Nợ', type: 'float', display: serverWidget.FieldDisplayType.INLINE},
                {id: 'soducovnd', label: 'Số dư: Có', type: 'float', display: serverWidget.FieldDisplayType.INLINE}
            ];
            
            let col_ss_ctcn = [['account', 0], ['account_text', 0], ['trandate', 1], ['tranid', 2], ['ngayct', 3], ['soct', 4], ['diengiai', 5],
                ['tygia', 7], ['phatsinhno', 8], ['phatsinhnovnd', 9], ['phatsinhco', 10], ['phatsinhcovnd', 11], ['id', 12], ['ordertype', 13], ['ordertype_text', 13, 'sltext']
            ];
            
            let col_ss_cttotal = [['account', 0], ['account_text', 0, 'sltext'], ['soduno', 1], ['sodunovnd', 2], ['soduco', 3], ['soducovnd', 4]];
            let col_ss_ctcntotal = [['account', 0], ['account_text', 0], ['soduno', 1], ['sodunovnd', 2], ['soduco', 3], ['soducovnd', 4]];
            
            let OBJ_REPORT_TYPE = {
                CT_CDPS: "customsearch_scv_vas_cdpsdt",
                CT_CN: "customsearch_scv_vas_ctcndt",
                CT_SQT: "customsearch_scv_vas_sqtdt",
                CT_SNKC: "customsearch_scv_vas_snkcdt",
                CT_TOTAL: "customsearch_scv_vas_dt_total",
                CTCN_TOTAL: "customsearch_scv_vas_ctcndt_total"
            };
            
            let col_sl_ctsqt = [
                {id: 'trandate', label: 'Date', type: 'date', display: serverWidget.FieldDisplayType.INLINE},
                //{id: 'tranid', label: 'Số phiếu', type: 'text', display: serverWidget.FieldDisplayType.INLINE},
                {id: 'ngayct', label: 'Ngày CT', type: 'date', display: serverWidget.FieldDisplayType.INLINE},
                {id: 'soct', label: 'Số CT', type: 'text', display: serverWidget.FieldDisplayType.INLINE},
                {
                    id: 'ordertype_text',
                    label: 'Order Type',
                    type: 'text',
                    display: serverWidget.FieldDisplayType.INLINE
                },
                {id: 'diengiai', label: 'Diễn Giải', type: 'text', display: serverWidget.FieldDisplayType.INLINE},
                {id: 'doituong', label: 'Đối tượng', type: 'text', display: serverWidget.FieldDisplayType.INLINE},
                {id: 'tygia', label: 'Tỷ giá', type: 'float', display: serverWidget.FieldDisplayType.INLINE},
                {id: 'phatsinhno', label: 'Thu tiền', type: 'float', display: serverWidget.FieldDisplayType.INLINE},
                {id: 'phatsinhco', label: 'Chi tiền', type: 'float', display: serverWidget.FieldDisplayType.INLINE},
                {id: 'soduno', label: 'Số dư: Nợ', type: 'float', display: serverWidget.FieldDisplayType.INLINE},
                {id: 'soduco', label: 'Số dư: Có', type: 'float', display: serverWidget.FieldDisplayType.INLINE},
                {
                    id: 'phatsinhnovnd',
                    label: 'Thu tiền (VND)',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                },
                {
                    id: 'phatsinhcovnd',
                    label: 'Chi tiền (VND)',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                },
                {
                    id: 'sodunovnd',
                    label: 'Số dư: Nợ (VND)',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                },
                {
                    id: 'soducovnd',
                    label: 'Số dư: Có (VND)',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
            ];
            
            let col_sl_ctsqt_nocurrency = [
                {id: 'trandate', label: 'Date', type: 'date', display: serverWidget.FieldDisplayType.INLINE},
                //{id: 'tranid', label: 'Số phiếu', type: 'text', display: serverWidget.FieldDisplayType.INLINE},
                {id: 'ngayct', label: 'Ngày CT', type: 'date', display: serverWidget.FieldDisplayType.INLINE},
                {id: 'soct', label: 'Số CT', type: 'text', display: serverWidget.FieldDisplayType.INLINE},
                {
                    id: 'ordertype_text',
                    label: 'Order Type',
                    type: 'text',
                    display: serverWidget.FieldDisplayType.INLINE
                },
                {id: 'diengiai', label: 'Diễn Giải', type: 'text', display: serverWidget.FieldDisplayType.INLINE},
                {id: 'doituong', label: 'Đối tượng', type: 'text', display: serverWidget.FieldDisplayType.INLINE},
                {id: 'phatsinhnovnd', label: 'Thu tiền', type: 'float', display: serverWidget.FieldDisplayType.INLINE},
                {id: 'phatsinhcovnd', label: 'Chi tiền', type: 'float', display: serverWidget.FieldDisplayType.INLINE},
                {id: 'sodunovnd', label: 'Số dư: Nợ', type: 'float', display: serverWidget.FieldDisplayType.INLINE},
                {id: 'soducovnd', label: 'Số dư: Có', type: 'float', display: serverWidget.FieldDisplayType.INLINE}
            ];
            
            let col_ss_ctsqt = [['account', 0], ['account_text', 0, 'sltext'], ['trandate', 1], ['tranid', 2], ['ngayct', 3], ['soct', 4], ['diengiai', 5],
                ['doituong', 6], ['tygia', 8], ['phatsinhno', 9], ['phatsinhnovnd', 10], ['phatsinhco', 11], ['phatsinhcovnd', 12], ['id', 13], ['ordertype', 14], ['ordertype_text', 14, 'sltext']
            ];
            
            let col_sl_ctsnkc = [
                {id: 'trandate', label: 'Date', type: 'date', display: serverWidget.FieldDisplayType.INLINE},
                //{id: 'tranid', label: 'Số phiếu', type: 'text', display: serverWidget.FieldDisplayType.INLINE},
                {id: 'ngayct', label: 'Ngày CT', type: 'date', display: serverWidget.FieldDisplayType.INLINE},
                {id: 'soct', label: 'Số CT', type: 'text', display: serverWidget.FieldDisplayType.INLINE},
                {
                    id: 'ordertype_text',
                    label: 'Order Type',
                    type: 'text',
                    display: serverWidget.FieldDisplayType.INLINE
                },
                {id: 'diengiai', label: 'Diễn Giải', type: 'text', display: serverWidget.FieldDisplayType.INLINE},
                {id: 'tygia', label: 'Tỷ giá', type: 'float', display: serverWidget.FieldDisplayType.INLINE},
                {
                    id: 'phatsinhno',
                    label: 'Phát sinh: Nợ',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                },
                {
                    id: 'phatsinhco',
                    label: 'Phát sinh: Có',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                },
                {id: 'soduno', label: 'Số dư: Nợ', type: 'float', display: serverWidget.FieldDisplayType.INLINE},
                {id: 'soduco', label: 'Số dư: Có', type: 'float', display: serverWidget.FieldDisplayType.INLINE},
                {
                    id: 'phatsinhnovnd',
                    label: 'Phát sinh: Nợ (VND)',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                },
                {
                    id: 'phatsinhcovnd',
                    label: 'Phát sinh: Có (VND)',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                },
                {
                    id: 'sodunovnd',
                    label: 'Số dư: Nợ (VND)',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                },
                {
                    id: 'soducovnd',
                    label: 'Số dư: Có (VND)',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
            ];
            
            let col_sl_ctsnkc_nocurrency = [
                {id: 'trandate', label: 'Date', type: 'date', display: serverWidget.FieldDisplayType.INLINE},
                //{id: 'tranid', label: 'Số phiếu', type: 'text', display: serverWidget.FieldDisplayType.INLINE},
                {id: 'ngayct', label: 'Ngày CT', type: 'date', display: serverWidget.FieldDisplayType.INLINE},
                {id: 'soct', label: 'Số CT', type: 'text', display: serverWidget.FieldDisplayType.INLINE},
                {
                    id: 'ordertype_text',
                    label: 'Order Type',
                    type: 'text',
                    display: serverWidget.FieldDisplayType.INLINE
                },
                {id: 'diengiai', label: 'Diễn Giải', type: 'text', display: serverWidget.FieldDisplayType.INLINE},
                {
                    id: 'phatsinhnovnd',
                    label: 'Phát sinh: Nợ',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                },
                {
                    id: 'phatsinhcovnd',
                    label: 'Phát sinh: Có',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                },
                {id: 'sodunovnd', label: 'Số dư: Nợ', type: 'float', display: serverWidget.FieldDisplayType.INLINE},
                {id: 'soducovnd', label: 'Số dư: Có', type: 'float', display: serverWidget.FieldDisplayType.INLINE}
            ];
            
            let col_ss_ctsnkc = [['account', 0], ['account_text', 1, 'sltext'], ['trandate', 1], ['tranid', 2], ['ngayct', 3], ['soct', 4], ['diengiai', 5],
                ['tygia', 6], ['phatsinhno', 7], ['phatsinhnovnd', 8], ['phatsinhco', 9], ['phatsinhcovnd', 10], ['id', 11], ['ordertype', 12], ['ordertype_text', 12, 'sltext']
            ];
            return {
                field_select: field_select,
                sl_ct: sl_ct,
                col_sl_ctcdps: col_sl_ctcdps,
                col_sl_ctcdps_nocurrency: col_sl_ctcdps_nocurrency,
                col_ss_ctcdps: col_ss_ctcdps,
                col_sl_ctcn: col_sl_ctcn,
                col_sl_ctcn_nocurrency: col_sl_ctcn_nocurrency,
                col_ss_ctcn: col_ss_ctcn,
                col_ss_cttotal: col_ss_cttotal,
                col_ss_ctcntotal: col_ss_ctcntotal,
                OBJ_REPORT_TYPE: OBJ_REPORT_TYPE,
                col_sl_ctsqt: col_sl_ctsqt,
                col_sl_ctsqt_nocurrency: col_sl_ctsqt_nocurrency,
                col_ss_ctsqt: col_ss_ctsqt,
                col_sl_ctsnkc: col_sl_ctsnkc,
                col_sl_ctsnkc_nocurrency: col_sl_ctsnkc_nocurrency,
                col_ss_ctsnkc: col_ss_ctsnkc
            }
        }
        
        return {
            onRequest
        };
        
    });
