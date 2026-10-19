/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */

define(['N/format', 'N/file', 'N/render', 'N/runtime', 'N/search', 'N/ui/serverWidget', 'N/url', 'N/xml',
        '../lib/scv_lib_function.js', '../lib/scv_lib_report.js'],
    (format, file, render, runtime, search, serverWidget, url, xml, libFunc, libRep) => {
        
        const onRequest = (context) => {
            let request = context.request;
            let response = context.response;
            let parameters = request.parameters;
            let reportype = parameters.custpage_reportype;
            let subsidiary = parameters.custpage_subsidiary;
            let entity = parameters.custpage_entity;
            let date_dauky = parameters.custpage_date_dauky;
            let date_cuoiky = parameters.custpage_date_cuoiky;
            let currencyvalue = parameters.custpage_currencyvalue;
            let currencytext = parameters.custpage_currencytext;
            let account = parameters.custpage_account;
            let account_parent = parameters.custpage_account_parent;
            let acc_level = parameters.custpage_acc_level;
            let not_level = parameters.custpage_not_level;
            let namefile = parameters.namefile;
            let isPrint = parameters.isPrint;
            let master = getSublistColMaster();
            let isRun = true;
            if (!!subsidiary) {
                subsidiary = subsidiary.split(',');
            } else {
                let userObj = runtime.getCurrentUser();
                subsidiary = userObj.subsidiary;
                isRun = false;
            }
            if (!!account) {
                account = account.split(',');
            }
            if (!!account_parent) {
                account_parent = account_parent.split(',');
            }
            
            let OBJ_REPORT_TYPE = master.OBJ_REPORT_TYPE;
            let list_detail = [], col_detail = null;
            let colid = [];
            if (!foreignCurrency(currencyvalue)) {
                if (reportype === OBJ_REPORT_TYPE.TT_CDPS) {
                    colid = master.col_sl_cdps_nocurrency;
                    col_detail = master.col_ss_cdps;
                } else if (reportype === OBJ_REPORT_TYPE.TT_CN) {
                    colid = master.col_sl_cn_nocurrency;
                    col_detail = master.col_ss_cn;
                } else if (reportype === OBJ_REPORT_TYPE.TT_VAY) {
                    colid = master.col_sl_vay_nocurrency;
                    col_detail = master.col_ss_vay;
                } else {
                    isRun = false;
                }
            } else {
                if (reportype === OBJ_REPORT_TYPE.TT_CDPS) {
                    colid = master.col_sl_cdps;
                    col_detail = master.col_ss_cdps;
                } else if (reportype === OBJ_REPORT_TYPE.TT_CN) {
                    colid = master.col_sl_cn;
                    col_detail = master.col_ss_cn;
                } else if (reportype === OBJ_REPORT_TYPE.TT_VAY) {
                    colid = master.col_sl_vay;
                    col_detail = master.col_ss_vay;
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
                    let list_acc_leaf = [], pageinfo = null, params_acc_leaf = [];//(currencyvalue || 1) and nvl(acc.currency, 1) = ?
                    let sql_acc_leaf = "select acc.id from account acc where acc.issummary = 'F' and ("; //and acc.acctnumber like '111%'
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
                
                let datefrom = format.parse({value: date_dauky, type: format.Type.DATE});
                let datefromfm = datefrom.getFullYear() + '' + ((datefrom.getMonth() + 1) + '').padStart(2, '0') + (datefrom.getDate() + '').padStart(2, '0');
                
                let col1 = {
                    name: 'formulanumeric', summary: search.Summary.SUM, label: 'Số dư đầu Nợ Ngoại tệ', type: 'float',
                    formula: "case when TO_NUMBER(TO_CHAR({trandate},'YYYYMMDD')) < " + datefromfm + " then {debitfxamount} else 0 end"
                };
                let col2 = {
                    name: 'formulanumeric', summary: search.Summary.SUM, label: 'Số dư đầu Có Ngoại tệ', type: 'float',
                    formula: "case when TO_NUMBER(TO_CHAR({trandate},'YYYYMMDD')) < " + datefromfm + " then {creditfxamount} else 0 end"
                };
                let col3 = {
                    name: 'formulanumeric',
                    summary: search.Summary.SUM,
                    label: 'Số phát sinh Nợ Ngoại tệ',
                    type: 'float',
                    formula: "case when TO_NUMBER(TO_CHAR({trandate},'YYYYMMDD')) >= " + datefromfm + " then {debitfxamount} else 0 end"
                };
                let col4 = {
                    name: 'formulanumeric',
                    summary: search.Summary.SUM,
                    label: 'Số phát sinh Có Ngoại tệ',
                    type: 'float',
                    formula: "case when TO_NUMBER(TO_CHAR({trandate},'YYYYMMDD')) >= " + datefromfm + " then {creditfxamount} else 0 end"
                };
                let col5 = {
                    name: 'formulanumeric', summary: search.Summary.SUM, label: 'Số dư cuối Nợ Ngoại tệ', type: 'float',
                    formula: "{debitfxamount}"
                };
                let col6 = {
                    name: 'formulanumeric', summary: search.Summary.SUM, label: 'Số dư cuối Có Ngoại tệ', type: 'float',
                    formula: "{creditfxamount}"
                };
                
                let col7 = {
                    name: 'formulanumeric',
                    summary: search.Summary.SUM,
                    label: 'Số dư đầu Nợ Quy ra VND',
                    type: 'float',
                    formula: "case when TO_NUMBER(TO_CHAR({trandate},'YYYYMMDD')) < " + datefromfm + " then {debitamount} else 0 end"
                };
                let col8 = {
                    name: 'formulanumeric',
                    summary: search.Summary.SUM,
                    label: 'Số dư đầu Có Quy ra VND',
                    type: 'float',
                    formula: "case when TO_NUMBER(TO_CHAR({trandate},'YYYYMMDD')) < " + datefromfm + " then {creditamount} else 0 end"
                };
                let col9 = {
                    name: 'formulanumeric',
                    summary: search.Summary.SUM,
                    label: 'Số phát sinh Nợ Quy ra VND',
                    type: 'float',
                    formula: "case when TO_NUMBER(TO_CHAR({trandate},'YYYYMMDD')) >= " + datefromfm + " then {debitamount} else 0 end"
                };
                let col10 = {
                    name: 'formulanumeric',
                    summary: search.Summary.SUM,
                    label: 'Số phát sinh Có Quy ra VND',
                    type: 'float',
                    formula: "case when TO_NUMBER(TO_CHAR({trandate},'YYYYMMDD')) >= " + datefromfm + " then {creditamount} else 0 end"
                };
                let col11 = {
                    name: 'formulanumeric',
                    summary: search.Summary.SUM,
                    label: 'Số dư cuối Nợ Quy ra VND',
                    type: 'float',
                    formula: "{debitamount}"
                };
                let col12 = {
                    name: 'formulanumeric',
                    summary: search.Summary.SUM,
                    label: 'Số dư cuối Có Quy ra VND',
                    type: 'float',
                    formula: "{creditamount}"
                };
                
                let col_add = [col1, col2, col3, col4, col5, col6, col7, col8, col9, col10, col11, col12];
                libRep.doSearchSSMore(reportype, 1000, list_detail, filters_detail, col_detail, col_add, null);
                let list_acc = [], pageinfo = null, params_acc = [];
                
                let sql_acc = "select acc.id, acc.acctnumber, acc.accountsearchdisplaynamecopy accountsearchdisplayname, acc.custrecord_scv_cct_acc_parent, acc.custrecord_scv_cct_acc_parent_name, acc.custrecord_scv_acc_level from account acc where acc.acctnumber is not null";
                libRep.doSearchSql(list_acc, pageinfo, sql_acc, params_acc);
                let fieldgroup = {account: 'account', account_text: 'account_text'};
                
                let isexport = parameters.isexport;
                if (isexport !== "T") {
                    setSublistValueLine(sublist, colid, list_detail, currencyvalue, fieldgroup, list_acc, not_level, acc_level, reportype, OBJ_REPORT_TYPE, 0, parameters);
                } else if (isPrint === "T") {
                    let {pRow: rowPdf} = exportPdf(response, parameters, list_detail, currencyvalue, fieldgroup, list_acc, not_level, acc_level, reportype, OBJ_REPORT_TYPE, 0);
                    let isNoCurrency = !foreignCurrency(currencyvalue);
                    let namefilexml = reportype.substring(13, reportype.length);
                    let pTitle = getTitleReportPdf(reportype);
                    let pAddHeader = plusHeaderTitleReportPdf(reportype);
                    let pHeaderTable = getHeaderTablePdf(reportype, isNoCurrency);
                    let pFontSize = isNoCurrency ? "8.5pt" : "6pt";
                    
                    if (namefilexml) {
                        let fileObject = file.load({id: '../xml/pdf/scv_render_rp_vas_tt_pdf.xml'});
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
                        content = content.replace(/{pAddHeader}/gi, pAddHeader);
                        content = content.replace(/{pAccount}/gi, accounttext || 'Tổng hợp');
                        content = content.replace(/{pCurrency}/gi, currencytext || 'VND');
                        content = content.replace(/{pEntity}/gi, esXml(entity || 'Tổng hợp'));
                        content = content.replace(/{pFontSize}/gi, pFontSize);
                        content = content.replace(/{pHeaderTable}/gi, pHeaderTable);
                        content = content.replace(/{pBodyTable}/gi, rowPdf);
                        
                        namefile = namefile || namefilexml.substring(4, namefilexml.length) + '.pdf';
                        let f = render.xmlToPdf({xmlString: content});
                        f.name = namefile;
                        response.writeFile(f, true);
                    }
                    
                } else {
                    let objRow = exportExcel(response, parameters, list_detail, currencyvalue, fieldgroup, list_acc, not_level, acc_level, reportype, OBJ_REPORT_TYPE, 0);
                    let line = objRow.line;
                    let path = '../xml/vas/tt/';
                    let namefilexml = reportype.substring(13, reportype.length);
                    if (namefilexml) {
                        let namefileload = namefilexml;
                        if (!currencyvalue || currencyvalue === '1') {
                            namefileload = namefilexml + '_nocurrency';
                        }
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
                        content = content.replace(/{pTotalrow}/gi, line);
                        
                        if (reportype === OBJ_REPORT_TYPE.TT_CDPS) {
                            content = content.replace(/{pExpandedRowCount}/gi, 25 + line);
                        } else if (reportype === OBJ_REPORT_TYPE.TT_CN) {
                            content = content.replace(/{pExpandedRowCount}/gi, 25 + line);
                        } else if (reportype === OBJ_REPORT_TYPE.TT_VAY) {
                            content = content.replace(/{pExpandedRowCount}/gi, 25 + line);
                        }
                        
                        content = content.replace(/{pRow}/gi, objRow.pRow);
                        namefile = namefile || namefilexml.substring(4, namefilexml.length) + '.xls';
                        libRep.downloadFile(context, namefile, content);
                    }
                }
            }
            if (parameters.isexport !== "T") {
                response.writePage(form);
            }
        }
        
        const reCalculationDauCuoi = (objdetail, reportype, OBJ_REPORT_TYPE) => {
            if (reportype === OBJ_REPORT_TYPE.TT_CDPS || reportype === OBJ_REPORT_TYPE.TT_CN || reportype === OBJ_REPORT_TYPE.TT_VAY) {
                let sdd = (objdetail.sodudauno || 0) - (objdetail.sodudauco || 0);
                let sdc = (objdetail.soducuoino || 0) - (objdetail.soducuoico || 0);
                let sddvnd = (objdetail.sodudaunovnd || 0) - (objdetail.sodudaucovnd || 0);
                let sdcvnd = (objdetail.soducuoinovnd || 0) - (objdetail.soducuoicovnd || 0);
                if (sdd >= 0) {
                    objdetail.sodudauno = sdd;
                    objdetail.sodudauco = 0;
                } else {
                    objdetail.sodudauno = 0;
                    objdetail.sodudauco = Math.abs(sdd);
                }
                if (sdc >= 0) {
                    objdetail.soducuoino = sdc;
                    objdetail.soducuoico = 0;
                } else {
                    objdetail.soducuoino = 0;
                    objdetail.soducuoico = Math.abs(sdc);
                }
                if (sddvnd >= 0) {
                    objdetail.sodudaunovnd = sddvnd;
                    objdetail.sodudaucovnd = 0;
                } else {
                    objdetail.sodudaunovnd = 0;
                    objdetail.sodudaucovnd = Math.abs(sddvnd);
                }
                if (sdcvnd >= 0) {
                    objdetail.soducuoinovnd = sdcvnd;
                    objdetail.soducuoicovnd = 0;
                } else {
                    objdetail.soducuoinovnd = 0;
                    objdetail.soducuoicovnd = Math.abs(sdcvnd);
                }
            }
        }
        
        const plusTotal = (objTotal, objdetail) => {
            objTotal.sodudauno = objTotal.sodudauno + Number(objdetail.sodudauno || 0);
            objTotal.sodudauco = objTotal.sodudauco + Number(objdetail.sodudauco || 0);
            objTotal.phatsinhno = objTotal.phatsinhno + Number(objdetail.phatsinhno || 0);
            objTotal.phatsinhco = objTotal.phatsinhco + Number(objdetail.phatsinhco || 0);
            objTotal.soducuoino = objTotal.soducuoino + Number(objdetail.soducuoino || 0);
            objTotal.soducuoico = objTotal.soducuoico + Number(objdetail.soducuoico || 0);
            objTotal.sodudaunovnd = objTotal.sodudaunovnd + Number(objdetail.sodudaunovnd || 0);
            objTotal.sodudaucovnd = objTotal.sodudaucovnd + Number(objdetail.sodudaucovnd || 0);
            objTotal.phatsinhnovnd = objTotal.phatsinhnovnd + Number(objdetail.phatsinhnovnd || 0);
            objTotal.phatsinhcovnd = objTotal.phatsinhcovnd + Number(objdetail.phatsinhcovnd || 0);
            objTotal.soducuoinovnd = objTotal.soducuoinovnd + Number(objdetail.soducuoinovnd || 0);
            objTotal.soducuoicovnd = objTotal.soducuoicovnd + Number(objdetail.soducuoicovnd || 0);
        }
        
        const initObjTotal = () => {
            return {
                sodudauno: 0,
                sodudauco: 0,
                phatsinhno: 0,
                phatsinhco: 0,
                soducuoino: 0,
                soducuoico: 0,
                sodudaunovnd: 0,
                sodudaucovnd: 0,
                phatsinhnovnd: 0,
                phatsinhcovnd: 0,
                soducuoinovnd: 0,
                soducuoicovnd: 0
            };
        }
        
        const isContainValue = (objdetail) => {
            let iscontain = false;
            let listkey = ['sodudauno', 'sodudauco', 'phatsinhno', 'phatsinhco', 'soducuoino', 'soducuoico'
                , 'sodudaunovnd', 'sodudaucovnd', 'phatsinhnovnd', 'phatsinhcovnd', 'soducuoinovnd', 'soducuoicovnd'];
            if (!!objdetail) {
                for (let ilk in listkey) {
                    if (objdetail[listkey[ilk]] > 0) {
                        iscontain = true;
                    }
                }
            }
            return iscontain;
        }
        
        const addParam = (parameters, urlChitiet, reportype) => {
            urlChitiet = urlChitiet + '&p1=' + reportype + '&p2=' + parameters.custpage_subsidiary
                + '&p3=' + parameters.custpage_date_dauky + '&p4=' + parameters.custpage_date_cuoiky;
            if (!!parameters.custpage_currencyvalue) {
                urlChitiet = urlChitiet + '&p6=' + parameters.custpage_currencyvalue;
            }
            if (!!parameters.custpage_account) {
                urlChitiet = urlChitiet + '&p7=' + parameters.custpage_account;
            }
            if (!!parameters.custpage_account_parent) {
                urlChitiet = urlChitiet + '&p8=' + parameters.custpage_account_parent;
            }
            return urlChitiet;
        }
        
        const addParamAdd = (urlChitiet, account, account_parent) => {
            if (!!account) {
                urlChitiet = urlChitiet + '&p7=' + encodeURIComponent(account);
            }
            if (!!account_parent) {
                urlChitiet = urlChitiet + '&p8=' + encodeURIComponent(account_parent);
            }
            return urlChitiet;
        }
        
        const addParamDoituong = (urlChitiet, doituong) => {
            urlChitiet = urlChitiet + '&p5=' + encodeURIComponent(doituong);
            return urlChitiet;
        }
        
        const setLinkMTK = (sublist, objdetail, list_acc, reportype, OBJ_REPORT_TYPE, isparent, urlChitiet) => {
            if (reportype === OBJ_REPORT_TYPE.TT_CDPS) {
                let urlTemp = urlChitiet;
                if (isparent) {
                    let accf = list_acc.find(e => e.acctnumber === objdetail.accnumber);
                    if (!!accf) {
                        urlTemp = addParamAdd(urlChitiet, null, accf.id);
                    }
                } else if (!!objdetail.account) {
                    urlTemp = addParamAdd(urlChitiet, objdetail.account, null);
                } else {
                    let accf = list_acc.find(e => e.acctnumber === objdetail.accnumber);
                    if (!!accf) {
                        urlTemp = addParamAdd(urlChitiet, accf.id, null);
                    }
                }
                let tempvalue = '<a href=' + urlTemp + '>' + objdetail.accnumber + '</a>';
                sublist.setSublistValue({id: 'accnumber', line: objdetail.line, value: tempvalue});
            } else if (reportype === OBJ_REPORT_TYPE.TT_CN && !isparent) {
                if (!!objdetail.doituong) {
                    let valueLink = objdetail.doituong;
                    if (valueLink.length > 140) {
                        valueLink = valueLink.substr(0, 140)
                    }
                    let urlTemp = addParamDoituong(urlChitiet, valueLink.substr(0, 20));
                    urlTemp = urlTemp.substr(0, 146);
                    let tempvalue = '<a href=' + urlTemp + '>' + valueLink + '</a>';
                    sublist.setSublistValue({id: 'doituong', line: objdetail.line, value: tempvalue});
                }
            }
        }
        
        const setSublistValueLine = (sublist, colids, list_detail, currencyvalue, fieldgroup, list_acc, not_level, acc_level, reportype, OBJ_REPORT_TYPE, linestart, parameters) => {
            let precision = (!foreignCurrency(currencyvalue)) ? 0 : 2;
            let objdetail, line = linestart, list_total = {}, account_pre = '', objTotal = null;
            let acc_parent, acc_parent_num, acc_parent_name, acc_lv, acc_parent_num_pre = '';
            let urlChitiet = '';
            if (reportype === OBJ_REPORT_TYPE.TT_CN || reportype === OBJ_REPORT_TYPE.TT_CDPS) {
                urlChitiet = url.resolveScript({
                    scriptId: 'customscript_scv_sl_rp_vas_dt',
                    deploymentId: 'customdeploy_scv_sl_rp_vas_dt',
                    returnExternalUrl: false
                });
                let urlChitietArr = urlChitiet.split('&');
                urlChitiet = urlChitietArr[0] + '&' + urlChitietArr[1];
                if (reportype === OBJ_REPORT_TYPE.TT_CN) {
                    urlChitiet = addParam(parameters, urlChitiet, '1');
                } else if (reportype === OBJ_REPORT_TYPE.TT_CDPS) {
                    urlChitiet = addParam(parameters, urlChitiet, '2');
                }
            }
            
            let objTotalAll = initObjTotal();
            objTotalAll.accnumber = '';
            objTotalAll.accname = 'Total';
            objTotalAll.line = line;
            line++;
            setSublistValueLineObj(sublist, objTotalAll, colids, precision);
            let netnoco = parameters.custpage_netnoco;
            let account, account_text;
            for (let i in list_detail) {
                objdetail = list_detail[i];
                objdetail = list_detail[i];
                reCalculationDauCuoi(objdetail, reportype, OBJ_REPORT_TYPE);
                plusTotal(objTotalAll, objdetail);
                account = objdetail[fieldgroup.account];
                account_text = objdetail[fieldgroup.account_text];
                acc_parent = list_acc.find(e => String(e.id) === String(objdetail.account));
                if (!acc_parent) {
                    if (isContainValue(objdetail)) {
                        acc_parent = {acctnumber: '-None-', accountsearchdisplayname: '-None-'};
                    } else {
                        continue;
                    }
                }
                objdetail.accnumber = acc_parent.acctnumber;
                objdetail.accname = acc_parent.accountsearchdisplayname;
                
                if (not_level !== 'T') {
                    if (account !== account_pre && !!account_pre) {
                        acc_lv = -1;
                        if (!!acc_parent_num_pre) {
                            acc_lv = acc_parent_num_pre.length;
                            if (!!acc_level && acc_level < acc_lv) {
                                acc_lv = acc_level;
                            }
                            for (let iacc = 0; iacc < acc_lv; iacc++) {
                                if (netnoco === 'T') {
                                    reCalculationDauCuoi(list_total[acc_parent_num_pre[iacc]], reportype, OBJ_REPORT_TYPE);
                                }
                                setSublistValueLineObj(sublist, list_total[acc_parent_num_pre[iacc]], colids, precision);
                                setLinkMTK(sublist, list_total[acc_parent_num_pre[iacc]], list_acc, reportype, OBJ_REPORT_TYPE, true, urlChitiet);
                            }
                        }
                    }
                    
                    acc_parent_num = '';
                    acc_parent_name = '';
                    acc_lv = -1;
                    if (!!acc_parent) {
                        acc_parent_num = acc_parent.custrecord_scv_cct_acc_parent;
                        if (!!acc_parent_num) {
                            acc_parent_name = acc_parent.custrecord_scv_cct_acc_parent_name;
                            acc_parent_num = acc_parent_num.split('//');
                            acc_parent_name = acc_parent_name.split('//');
                            acc_lv = acc_parent_num.length;
                            if (!!acc_level && acc_level < acc_lv) {
                                acc_lv = acc_level;
                            }
                            for (let iacc = 0; iacc < acc_lv; iacc++) {
                                objTotal = list_total[acc_parent_num[iacc]];
                                if (!objTotal) {
                                    objTotal = initObjTotal();
                                    objTotal.accnumber = acc_parent_num[iacc];
                                    objTotal.accname = acc_parent_name[iacc];
                                    objTotal.line = line;
                                    line++;
                                }
                                plusTotal(objTotal, objdetail);
                                if (netnoco === 'T') {
                                    reCalculationDauCuoi(objTotal, reportype, OBJ_REPORT_TYPE);
                                }
                                list_total[acc_parent_num[iacc]] = objTotal;
                                setSublistValueLineObj(sublist, objTotal, colids, precision);
                            }
                        }
                    }
                    
                    if (!acc_level || acc_level > acc_lv) {
                        objTotal = list_total[acc_parent.acctnumber];
                        if (!objTotal) {
                            objTotal = initObjTotal();
                            objTotal.accnumber = acc_parent.acctnumber;
                            objTotal.accname = acc_parent.accountsearchdisplayname;
                            objTotal.line = line;
                            line++;
                            list_total[acc_parent.acctnumber] = objTotal;
                        }
                        plusTotal(objTotal, objdetail);
                        if (netnoco === 'T') {
                            reCalculationDauCuoi(objTotal, reportype, OBJ_REPORT_TYPE);
                        }
                        setSublistValueLineObj(sublist, objTotal, colids, precision);
                        objTotal.account = objdetail.account;
                        setLinkMTK(sublist, objTotal, list_acc, reportype, OBJ_REPORT_TYPE, false, urlChitiet);
                        /*if (!acc_level) {
                            objdetail.line = line;
                            setSublistValueLineObj(sublist, objdetail, colids, precision);
                            line++;
                            setLinkMTK(sublist, objdetail, list_acc, reportype, OBJ_REPORT_TYPE, false, urlChitiet);
                        }*/
                    }
                } else {
                    objdetail.line = line;
                    setSublistValueLineObj(sublist, objdetail, colids, precision);
                    line++;
                    setLinkMTK(sublist, objdetail, list_acc, reportype, OBJ_REPORT_TYPE, false, urlChitiet);
                }
                account_pre = account;
                acc_parent_num_pre = acc_parent_num;
            }
            acc_lv = -1;
            if (!!acc_parent_num_pre) {
                acc_lv = acc_parent_num_pre.length;
                if (!!acc_level && acc_level < acc_lv) {
                    acc_lv = acc_level;
                }
                for (let iacc = 0; iacc < acc_lv; iacc++) {
                    if (netnoco === 'T') {
                        reCalculationDauCuoi(list_total[acc_parent_num_pre[iacc]], reportype, OBJ_REPORT_TYPE);
                    }
                    setSublistValueLineObj(sublist, list_total[acc_parent_num_pre[iacc]], colids, precision);
                    setLinkMTK(sublist, list_total[acc_parent_num_pre[iacc]], list_acc, reportype, OBJ_REPORT_TYPE, true, urlChitiet);
                }
            }
            if (netnoco === 'T') {
                reCalculationDauCuoi(objTotalAll, reportype, OBJ_REPORT_TYPE);
            }
            setSublistValueLineObj(sublist, objTotalAll, colids, precision);
            
            return line;
        }
        
        const setSublistValueLineObj = (sublist, objdetail, colids, precision) => {
            let colid, tempvalue, tov;
            if (!!objdetail && objdetail.line !== undefined && objdetail.line !== null) {
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
                        
                        sublist.setSublistValue({id: colid, line: objdetail.line, value: tempvalue});
                    }
                }
            }
        }
        
        const makeRowHeader = (objdetail, currencyvalue, reportype, OBJ_REPORT_TYPE) => {
            let rowData = '';
            if (!foreignCurrency(currencyvalue)) {
                if (reportype === OBJ_REPORT_TYPE.TT_CDPS) {
                    rowData = '<Row ss:AutoFitHeight="0" ss:Height="36">' +
                        '<Cell ss:StyleID="s61"><Data ss:Type="String">' + (objdetail.accnumber || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s61"><Data ss:Type="String">' + (objdetail.accname || '') + '</Data></Cell>' +
                        //'<Cell ss:StyleID="s61"><Data ss:Type="String">' + (objdetail.subsidiarynohierarchy || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s94"><Data ss:Type="Number">' + (objdetail.sodudaunovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s94"><Data ss:Type="Number">' + (objdetail.sodudaucovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s94"><Data ss:Type="Number">' + (objdetail.phatsinhnovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s94"><Data ss:Type="Number">' + (objdetail.phatsinhcovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s94"><Data ss:Type="Number">' + (objdetail.soducuoinovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s94"><Data ss:Type="Number">' + (objdetail.soducuoicovnd || 0) + '</Data></Cell>' +
                        '</Row>';
                } else if (reportype === OBJ_REPORT_TYPE.TT_CN) {
                    rowData = '<Row ss:AutoFitHeight="0" ss:Height="36">' +
                        '<Cell ss:StyleID="m2839212055968"><Data ss:Type="String">' + (objdetail.accnumber || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="m2839212055968"><Data ss:Type="String">' + (objdetail.accname || '') + '</Data></Cell>' +
                        //'<Cell ss:StyleID="m2839212055968"><Data ss:Type="String">' + (objdetail.subsidiarynohierarchy || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="m2839212055968"><Data ss:Type="String">' + (objdetail.doituong || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s102"><Data ss:Type="Number">' + (objdetail.sodudaunovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s102"><Data ss:Type="Number">' + (objdetail.sodudaucovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s102"><Data ss:Type="Number">' + (objdetail.phatsinhnovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s102"><Data ss:Type="Number">' + (objdetail.phatsinhcovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s102"><Data ss:Type="Number">' + (objdetail.soducuoinovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s102"><Data ss:Type="Number">' + (objdetail.soducuoicovnd || 0) + '</Data></Cell>' +
                        '</Row>';
                } else if (reportype === OBJ_REPORT_TYPE.TT_VAY) {
                    rowData = '<Row ss:AutoFitHeight="0" ss:Height="36">' +
                        '<Cell ss:StyleID="m2841080032176"><Data ss:Type="String">' + (objdetail.accnumber || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="m2841080032176"><Data ss:Type="String">' + (objdetail.accname || '') + '</Data></Cell>' +
                        //'<Cell ss:StyleID="m2841080032176"><Data ss:Type="String">' + (objdetail.subsidiarynohierarchy || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="m2841080032176"><Data ss:Type="String">' + (objdetail.doituong || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="m2841080032176"><Data ss:Type="String">' + (objdetail.kheuocvay_text || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s109"><Data ss:Type="Number">' + (objdetail.sodudaunovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s109"><Data ss:Type="Number">' + (objdetail.sodudaucovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s109"><Data ss:Type="Number">' + (objdetail.phatsinhnovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s109"><Data ss:Type="Number">' + (objdetail.phatsinhcovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s109"><Data ss:Type="Number">' + (objdetail.soducuoinovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s109"><Data ss:Type="Number">' + (objdetail.soducuoicovnd || 0) + '</Data></Cell>' +
                        '</Row>';
                }
            } else {
                if (reportype === OBJ_REPORT_TYPE.TT_CDPS) {
                    rowData = '<Row ss:AutoFitHeight="0" ss:Height="36">' +
                        '<Cell ss:StyleID="s61"><Data ss:Type="String">' + (objdetail.accnumber || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s61"><Data ss:Type="String">' + (objdetail.accname || '') + '</Data></Cell>' +
                        //'<Cell ss:StyleID="s61"><Data ss:Type="String">' + (objdetail.subsidiarynohierarchy || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s103"><Data ss:Type="Number">' + (objdetail.sodudauno || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s103"><Data ss:Type="Number">' + (objdetail.sodudauco || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s103"><Data ss:Type="Number">' + (objdetail.phatsinhno || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s103"><Data ss:Type="Number">' + (objdetail.phatsinhco || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s103"><Data ss:Type="Number">' + (objdetail.soducuoino || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s103"><Data ss:Type="Number">' + (objdetail.soducuoico || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s94"><Data ss:Type="Number">' + (objdetail.sodudaunovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s94"><Data ss:Type="Number">' + (objdetail.sodudaucovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s94"><Data ss:Type="Number">' + (objdetail.phatsinhnovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s94"><Data ss:Type="Number">' + (objdetail.phatsinhcovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s94"><Data ss:Type="Number">' + (objdetail.soducuoinovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s94"><Data ss:Type="Number">' + (objdetail.soducuoicovnd || 0) + '</Data></Cell>' +
                        '</Row>';
                } else if (reportype === OBJ_REPORT_TYPE.TT_CN) {
                    rowData = '<Row ss:AutoFitHeight="0" ss:Height="36">' +
                        '<Cell ss:StyleID="m2249685510080"><Data ss:Type="String">' + (objdetail.accnumber || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="m2249685510080"><Data ss:Type="String">' + (objdetail.accname || '') + '</Data></Cell>' +
                        //'<Cell ss:StyleID="m2249685510080"><Data ss:Type="String">' + (objdetail.subsidiarynohierarchy || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="m2249685510080"><Data ss:Type="String">' + (objdetail.doituong || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s106"><Data ss:Type="Number">' + (objdetail.sodudauno || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s106"><Data ss:Type="Number">' + (objdetail.sodudauco || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s106"><Data ss:Type="Number">' + (objdetail.phatsinhno || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s106"><Data ss:Type="Number">' + (objdetail.phatsinhco || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s106"><Data ss:Type="Number">' + (objdetail.soducuoino || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s106"><Data ss:Type="Number">' + (objdetail.soducuoico || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s107"><Data ss:Type="Number">' + (objdetail.sodudaunovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s107"><Data ss:Type="Number">' + (objdetail.sodudaucovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s107"><Data ss:Type="Number">' + (objdetail.phatsinhnovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s107"><Data ss:Type="Number">' + (objdetail.phatsinhcovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s107"><Data ss:Type="Number">' + (objdetail.soducuoinovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s107"><Data ss:Type="Number">' + (objdetail.soducuoicovnd || 0) + '</Data></Cell>' +
                        '</Row>';
                } else if (reportype === OBJ_REPORT_TYPE.TT_VAY) {
                    rowData = '<Row ss:AutoFitHeight="0" ss:Height="36">' +
                        '<Cell ss:StyleID="s68"><Data ss:Type="String">' + (objdetail.accnumber || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s68"><Data ss:Type="String">' + (objdetail.accname || '') + '</Data></Cell>' +
                        //'<Cell ss:StyleID="s68"><Data ss:Type="String">' + (objdetail.subsidiarynohierarchy || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s68"><Data ss:Type="String">' + (objdetail.doituong || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s68"><Data ss:Type="String">' + (objdetail.kheuocvay_text || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s97"><Data ss:Type="Number">' + (objdetail.sodudauno || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s97"><Data ss:Type="Number">' + (objdetail.sodudauco || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s97"><Data ss:Type="Number">' + (objdetail.phatsinhno || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s97"><Data ss:Type="Number">' + (objdetail.phatsinhco || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s97"><Data ss:Type="Number">' + (objdetail.soducuoino || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s97"><Data ss:Type="Number">' + (objdetail.soducuoico || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s105"><Data ss:Type="Number">' + (objdetail.sodudaunovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s105"><Data ss:Type="Number">' + (objdetail.sodudaucovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s105"><Data ss:Type="Number">' + (objdetail.phatsinhnovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s105"><Data ss:Type="Number">' + (objdetail.phatsinhcovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s105"><Data ss:Type="Number">' + (objdetail.soducuoinovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s105"><Data ss:Type="Number">' + (objdetail.soducuoicovnd || 0) + '</Data></Cell>' +
                        '</Row>';
                }
            }
            return rowData;
        }
        
        const makeRowBody = (objdetail, currencyvalue, reportype, OBJ_REPORT_TYPE) => {
            let rowData = '';
            if (!foreignCurrency(currencyvalue)) {
                if (reportype === OBJ_REPORT_TYPE.TT_CDPS) {
                    rowData = '<Row ss:AutoFitHeight="0" ss:Height="36">' +
                        '<Cell ss:StyleID="s92"><Data ss:Type="String">' + (objdetail.accnumber || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s92"><Data ss:Type="String">' + (objdetail.accname || '') + '</Data></Cell>' +
                        //'<Cell ss:StyleID="s92"><Data ss:Type="String">' + (objdetail.subsidiarynohierarchy || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s95"><Data ss:Type="Number">' + (objdetail.sodudaunovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s95"><Data ss:Type="Number">' + (objdetail.sodudaucovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s95"><Data ss:Type="Number">' + (objdetail.phatsinhnovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s95"><Data ss:Type="Number">' + (objdetail.phatsinhcovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s95"><Data ss:Type="Number">' + (objdetail.soducuoinovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s95"><Data ss:Type="Number">' + (objdetail.soducuoicovnd || 0) + '</Data></Cell>' +
                        '</Row>';
                } else if (reportype === OBJ_REPORT_TYPE.TT_CN) {
                    rowData = '<Row ss:AutoFitHeight="0" ss:Height="36">' +
                        '<Cell ss:StyleID="s90"><Data ss:Type="String">' + (objdetail.accnumber || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s90"><Data ss:Type="String">' + (objdetail.accname || '') + '</Data></Cell>' +
                        //'<Cell ss:StyleID="s90"><Data ss:Type="String">' + (objdetail.subsidiarynohierarchy || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s90"><Data ss:Type="String">' + (objdetail.doituong || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s93"><Data ss:Type="Number">' + (objdetail.sodudaunovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s93"><Data ss:Type="Number">' + (objdetail.sodudaucovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s93"><Data ss:Type="Number">' + (objdetail.phatsinhnovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s93"><Data ss:Type="Number">' + (objdetail.phatsinhcovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s93"><Data ss:Type="Number">' + (objdetail.soducuoinovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s93"><Data ss:Type="Number">' + (objdetail.soducuoicovnd || 0) + '</Data></Cell>' +
                        '</Row>';
                } else if (reportype === OBJ_REPORT_TYPE.TT_VAY) {
                    rowData = '<Row ss:AutoFitHeight="0" ss:Height="36">' +
                        '<Cell ss:StyleID="s90"><Data ss:Type="String">' + (objdetail.accnumber || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s90"><Data ss:Type="String">' + (objdetail.accname || '') + '</Data></Cell>' +
                        //'<Cell ss:StyleID="s90"><Data ss:Type="String">' + (objdetail.subsidiarynohierarchy || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s90"><Data ss:Type="String">' + (objdetail.doituong || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s90"><Data ss:Type="String">' + (objdetail.kheuocvay_text || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s94"><Data ss:Type="Number">' + (objdetail.sodudaunovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s94"><Data ss:Type="Number">' + (objdetail.sodudaucovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s94"><Data ss:Type="Number">' + (objdetail.phatsinhnovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s94"><Data ss:Type="Number">' + (objdetail.phatsinhcovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s94"><Data ss:Type="Number">' + (objdetail.soducuoinovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s94"><Data ss:Type="Number">' + (objdetail.soducuoicovnd || 0) + '</Data></Cell>' +
                        '</Row>';
                }
            } else {
                if (reportype === OBJ_REPORT_TYPE.TT_CDPS) {
                    rowData = '<Row ss:AutoFitHeight="0" ss:Height="36">' +
                        '<Cell ss:StyleID="s92"><Data ss:Type="String">' + (objdetail.accnumber || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s92"><Data ss:Type="String">' + (objdetail.accname || '') + '</Data></Cell>' +
                        //'<Cell ss:StyleID="s92"><Data ss:Type="String">' + (objdetail.subsidiarynohierarchy || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s104"><Data ss:Type="Number">' + (objdetail.sodudauno || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s104"><Data ss:Type="Number">' + (objdetail.sodudauco || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s104"><Data ss:Type="Number">' + (objdetail.phatsinhno || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s104"><Data ss:Type="Number">' + (objdetail.phatsinhco || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s104"><Data ss:Type="Number">' + (objdetail.soducuoino || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s104"><Data ss:Type="Number">' + (objdetail.soducuoico || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s95"><Data ss:Type="Number">' + (objdetail.sodudaunovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s95"><Data ss:Type="Number">' + (objdetail.sodudaucovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s95"><Data ss:Type="Number">' + (objdetail.phatsinhnovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s95"><Data ss:Type="Number">' + (objdetail.phatsinhcovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s95"><Data ss:Type="Number">' + (objdetail.soducuoinovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s95"><Data ss:Type="Number">' + (objdetail.soducuoicovnd || 0) + '</Data></Cell>' +
                        '</Row>';
                } else if (reportype === OBJ_REPORT_TYPE.TT_CN) {
                    rowData = '<Row ss:AutoFitHeight="0" ss:Height="36">' +
                        '<Cell ss:StyleID="s94"><Data ss:Type="String">' + (objdetail.accnumber || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s94"><Data ss:Type="String">' + (objdetail.accname || '') + '</Data></Cell>' +
                        //'<Cell ss:StyleID="s94"><Data ss:Type="String">' + (objdetail.subsidiarynohierarchy || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s94"><Data ss:Type="String">' + (objdetail.doituong || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s97"><Data ss:Type="Number">' + (objdetail.sodudauno || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s97"><Data ss:Type="Number">' + (objdetail.sodudauco || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s97"><Data ss:Type="Number">' + (objdetail.phatsinhno || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s97"><Data ss:Type="Number">' + (objdetail.phatsinhco || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s97"><Data ss:Type="Number">' + (objdetail.soducuoino || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s97"><Data ss:Type="Number">' + (objdetail.soducuoico || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s98"><Data ss:Type="Number">' + (objdetail.sodudaunovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s98"><Data ss:Type="Number">' + (objdetail.sodudaucovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s98"><Data ss:Type="Number">' + (objdetail.phatsinhnovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s98"><Data ss:Type="Number">' + (objdetail.phatsinhcovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s98"><Data ss:Type="Number">' + (objdetail.soducuoinovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s98"><Data ss:Type="Number">' + (objdetail.soducuoicovnd || 0) + '</Data></Cell>' +
                        '</Row>';
                } else if (reportype === OBJ_REPORT_TYPE.TT_VAY) {
                    rowData = '<Row ss:AutoFitHeight="0" ss:Height="36">' +
                        '<Cell ss:StyleID="s91"><Data ss:Type="String">' + (objdetail.accnumber || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s91"><Data ss:Type="String">' + (objdetail.accname || '') + '</Data></Cell>' +
                        //'<Cell ss:StyleID="s91"><Data ss:Type="String">' + (objdetail.subsidiarynohierarchy || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s91"><Data ss:Type="String">' + (objdetail.doituong || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s91"><Data ss:Type="String">' + (objdetail.kheuocvay_text || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s93"><Data ss:Type="Number">' + (objdetail.sodudauno || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s93"><Data ss:Type="Number">' + (objdetail.sodudauco || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s93"><Data ss:Type="Number">' + (objdetail.phatsinhno || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s93"><Data ss:Type="Number">' + (objdetail.phatsinhco || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s93"><Data ss:Type="Number">' + (objdetail.soducuoino || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s93"><Data ss:Type="Number">' + (objdetail.soducuoico || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s94"><Data ss:Type="Number">' + (objdetail.sodudaunovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s94"><Data ss:Type="Number">' + (objdetail.sodudaucovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s94"><Data ss:Type="Number">' + (objdetail.phatsinhnovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s94"><Data ss:Type="Number">' + (objdetail.phatsinhcovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s94"><Data ss:Type="Number">' + (objdetail.soducuoinovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s94"><Data ss:Type="Number">' + (objdetail.soducuoicovnd || 0) + '</Data></Cell>' +
                        '</Row>';
                }
            }
            return rowData;
        }
        
        const exportExcel = (response, parameters, list_detail, currencyvalue, fieldgroup, list_acc, not_level, acc_level, reportype, OBJ_REPORT_TYPE, linestart) => {
            let pRow = '';
            let objdetail, line = linestart, list_total = {}, list_line = {}, account_pre = '',
                objTotal = null;
            let acc_parent, acc_parent_num, acc_parent_name, acc_lv, acc_parent_num_pre = '';
            let objTotalAll = initObjTotal();
            objTotalAll.accnumber = '';
            objTotalAll.accname = 'Total';
            objTotalAll.line = line;
            line++;
            let netnoco = parameters.custpage_netnoco;
            for (let i in list_detail) {
                objdetail = list_detail[i];
                objdetail = list_detail[i];
                
                reCalculationDauCuoi(objdetail, reportype, OBJ_REPORT_TYPE);
                plusTotal(objTotalAll, objdetail);
                
                let account = objdetail[fieldgroup.account];
                acc_parent = list_acc.find(e => String(e.id) === String(objdetail.account));
                if (!acc_parent) {
                    if (isContainValue(objdetail)) {
                        acc_parent = {acctnumber: '-None-', accountsearchdisplayname: '-None-'};
                    } else {
                        continue;
                    }
                }
                objdetail.accnumber = acc_parent.acctnumber;
                objdetail.accname = acc_parent.accountsearchdisplayname;
                if (not_level !== 'T') {
                    acc_parent_num = ''; acc_parent_name = ''; acc_lv = -1;
                    if (!!acc_parent) {
                        acc_parent_num = acc_parent.custrecord_scv_cct_acc_parent;
                        if (!!acc_parent_num) {
                            acc_parent_name = acc_parent.custrecord_scv_cct_acc_parent_name;
                            acc_parent_num = acc_parent_num.split('//');
                            acc_parent_name = acc_parent_name.split('//');
                            acc_lv = acc_parent_num.length;
                            if (!!acc_level && acc_level < acc_lv) {
                                acc_lv = acc_level;
                            }
                            for (let iacc = 0; iacc < acc_lv; iacc++) {
                                objTotal = list_total[acc_parent_num[iacc]];
                                if (!objTotal) {
                                    objTotal = initObjTotal();
                                    objTotal.accnumber = acc_parent_num[iacc];
                                    objTotal.accname = acc_parent_name[iacc];
                                    objTotal.line = line;
                                    line++;
                                }
                                plusTotal(objTotal, objdetail);
                                if (netnoco === 'T') {
                                    reCalculationDauCuoi(objTotal, reportype, OBJ_REPORT_TYPE);
                                }
                                list_total[acc_parent_num[iacc]] = objTotal;
                                list_line[objTotal.line + ''] = objTotal;
                            }
                        }
                    }
                    
                    if (!acc_level || acc_level > acc_lv) {
                        objTotal = list_total[acc_parent.acctnumber];
                        if (!objTotal) {
                            objTotal = initObjTotal();
                            objTotal.accnumber = acc_parent.acctnumber;
                            objTotal.accname = acc_parent.accountsearchdisplayname;
                            objTotal.line = line;
                            line++;
                            if (netnoco === 'T') {
                                reCalculationDauCuoi(objTotal, reportype, OBJ_REPORT_TYPE);
                            }
                            list_total[acc_parent.acctnumber] = objTotal;
                            list_line[objTotal.line + ''] = objTotal;
                        }
                        plusTotal(objTotal, objdetail);
                        /*if (!acc_level) {
                            objdetail.line = line;
                            objdetail.islast = true;
                            list_line[objdetail.line + ''] = objdetail;
                            line++;
                        }*/
                    }
                    
                    account_pre = account;
                    acc_parent_num_pre = acc_parent_num;
                } else {
                    pRow = pRow + makeRowBody(objdetail, currencyvalue, reportype, OBJ_REPORT_TYPE);
                    line++;
                }
            }
            
            for (let key in list_line) {
                objdetail = list_line[key];
                if (objdetail.islast === true) {
                    pRow = pRow + makeRowBody(objdetail, currencyvalue, reportype, OBJ_REPORT_TYPE);
                } else {
                    pRow = pRow + makeRowHeader(objdetail, currencyvalue, reportype, OBJ_REPORT_TYPE);
                }
            }
            if (netnoco === 'T') {
                reCalculationDauCuoi(objTotalAll, reportype, OBJ_REPORT_TYPE);
            }
            let pTotalAll = makeRowHeader(objTotalAll, currencyvalue, reportype, OBJ_REPORT_TYPE);
            pRow = pTotalAll + pRow;
            return {pRow: pRow, line: line};
        }
        
        const exportPdf = (response, parameters, list_detail, currencyvalue, fieldgroup, list_acc, not_level, acc_level, reportype, OBJ_REPORT_TYPE, linestart) => {
            let pRow = '';
            let objdetail, line = linestart, list_total = {}, list_line = {}, account_pre = '',
                objTotal = null;
            let acc_parent, acc_parent_num, acc_parent_name, acc_lv, acc_parent_num_pre = '';
            let objTotalAll = initObjTotal();
            objTotalAll.accnumber = '';
            objTotalAll.accname = 'Total';
            objTotalAll.line = line;
            line++;
            let netnoco = parameters.custpage_netnoco;
            for (let i in list_detail) {
                objdetail = list_detail[i];
                objdetail = list_detail[i];
                
                reCalculationDauCuoi(objdetail, reportype, OBJ_REPORT_TYPE);
                plusTotal(objTotalAll, objdetail);
                
                let account = objdetail[fieldgroup.account];
                acc_parent = list_acc.find(e => String(e.id) === String(objdetail.account));
                if (!acc_parent) {
                    if (isContainValue(objdetail)) {
                        acc_parent = {acctnumber: '-None-', accountsearchdisplayname: '-None-'};
                    } else {
                        continue;
                    }
                }
                objdetail.accnumber = acc_parent.acctnumber;
                objdetail.accname = acc_parent.accountsearchdisplayname;
                if (not_level !== 'T') {
                    acc_parent_num = ''; acc_parent_name = ''; acc_lv = -1;
                    if (!!acc_parent) {
                        acc_parent_num = acc_parent.custrecord_scv_cct_acc_parent;
                        if (!!acc_parent_num) {
                            acc_parent_name = acc_parent.custrecord_scv_cct_acc_parent_name;
                            acc_parent_num = acc_parent_num.split('//');
                            acc_parent_name = acc_parent_name.split('//');
                            acc_lv = acc_parent_num.length;
                            if (!!acc_level && acc_level < acc_lv) {
                                acc_lv = acc_level;
                            }
                            for (let iacc = 0; iacc < acc_lv; iacc++) {
                                objTotal = list_total[acc_parent_num[iacc]];
                                if (!objTotal) {
                                    objTotal = initObjTotal();
                                    objTotal.accnumber = acc_parent_num[iacc];
                                    objTotal.accname = acc_parent_name[iacc];
                                    objTotal.line = line;
                                    line++;
                                }
                                plusTotal(objTotal, objdetail);
                                if (netnoco === 'T') {
                                    reCalculationDauCuoi(objTotal, reportype, OBJ_REPORT_TYPE);
                                }
                                list_total[acc_parent_num[iacc]] = objTotal;
                                list_line[objTotal.line + ''] = objTotal;
                            }
                        }
                    }
                    
                    if (!acc_level || acc_level > acc_lv) {
                        objTotal = list_total[acc_parent.acctnumber];
                        if (!objTotal) {
                            objTotal = initObjTotal();
                            objTotal.accnumber = acc_parent.acctnumber;
                            objTotal.accname = acc_parent.accountsearchdisplayname;
                            objTotal.line = line;
                            line++;
                            if (netnoco === 'T') {
                                reCalculationDauCuoi(objTotal, reportype, OBJ_REPORT_TYPE);
                            }
                            list_total[acc_parent.acctnumber] = objTotal;
                            list_line[objTotal.line + ''] = objTotal;
                        }
                        plusTotal(objTotal, objdetail);
                        /*if (!acc_level) {
                            objdetail.line = line;
                            objdetail.islast = true;
                            list_line[objdetail.line + ''] = objdetail;
                            line++;
                        }*/
                    }
                    //}
                    account_pre = account;
                    acc_parent_num_pre = acc_parent_num;
                } else {
                    pRow = pRow + makeRowBodyPdf(objdetail, currencyvalue, reportype, OBJ_REPORT_TYPE);
                }
            }
            
            for (let key in list_line) {
                objdetail = list_line[key];
                if (objdetail.islast === true) {
                    pRow = pRow + makeRowBodyPdf(objdetail, currencyvalue, reportype, OBJ_REPORT_TYPE);
                } else {
                    pRow = pRow + makeRowHeaderPdf(objdetail, currencyvalue, reportype, OBJ_REPORT_TYPE);
                }
            }
            if (netnoco === 'T') {
                reCalculationDauCuoi(objTotalAll, reportype, OBJ_REPORT_TYPE);
            }
            let pTotalAll = makeRowHeaderPdf(objTotalAll, currencyvalue, reportype, OBJ_REPORT_TYPE);
            pRow = pTotalAll + pRow;
            return {pRow: pRow,};
        }
        
        // Escape xml special char
        const esXml = (str) => {
            if (!str) {
                return "";
            }
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
            container.customsearch_scv_vas_cdpstt = "Bảng cân đối số phát sinh";
            container.customsearch_scv_vas_cntt = "Tổng hợp công nợ";
            container.customsearch_scv_vas_vaytt = "Tổng hợp vay, cho vay, gửi tiết kiệm";
            return container[reportId]
        }
        
        const plusHeaderTitleReportPdf = (reportId) => {
            let container = {}
            container.customsearch_scv_vas_cdpstt = "";
            container.customsearch_scv_vas_cntt = "";
            container.customsearch_scv_vas_vaytt = "Khế ước vay: {pDebitloan}<br/>";
            return container[reportId]
        }
        
        const getHeaderTablePdf = (reportId, isNoCurrency) => {
            let container = {};
            // // Cân đối phát sinh <td rowspan = "2"><p>Công ty/chi nhánh</p></td> <td>C</td>
            container.customsearch_scv_vas_cdpstt = isNoCurrency ? `
					<tr>
						<td width = "10%" border = "none"/><td width = "26%" border = "none"/>
						<td width = "9%" border = "none"/><td width = "9%" border = "none"/>
						<td width = "9%" border = "none"/><td width = "9%" border = "none"/><td width = "9%" border = "none"/><td width = "9%" border = "none"/>
					</tr>
					<tr border-top = "1pt solid black"  font-weight="bold">
						<td rowspan = "2"><p>Mã tài khoản</p></td>
						<td rowspan = "2"><p>Tên tài khoản</p></td>
						
						<td colspan = "2"><p>Số dư đầu</p></td>
						<td colspan = "2"><p>Số phát sinh</p></td>
						<td colspan = "2"><p>Số dư cuối</p></td>
					</tr>
					<tr  font-weight="bold">
						<td><p>Nợ</p></td> <td><p>Có</p></td> <td><p>Nợ</p></td> <td><p>Có</p></td> <td><p>Nợ</p></td> <td><p>Có</p></td>
					</tr>
					<tr>
						<td>A</td><td>B</td>
						<td>1</td><td>2</td><td>3</td><td>4</td><td>5</td><td>6</td>
					</tr>
					`
                :
                `
					<tr>
						<td width = "6.25%" border = "none"/><td width = "12%" border = "none"/>
						<td width = "6.25%" border = "none"/><td width = "6.25%" border = "none"/><td width = "6.25%" border = "none"/><td width = "6.25%" border = "none"/><td width = "6.25%" border = "none"/><td width = "6.25%" border = "none"/>
						<td width = "6.25%" border = "none"/><td width = "6.25%" border = "none"/><td width = "6.25%" border = "none"/><td width = "6.25%" border = "none"/><td width = "6.25%" border = "none"/><td width = "6.25%" border = "none"/>
					</tr>
					<tr border-top = "1pt solid black"  font-weight="bold">
						<td rowspan = "2"><p>Mã tài khoản</p></td>
						<td rowspan = "2"><p>Tên tài khoản</p></td>
						
						<td colspan = "2"><p>Số dư đầu<br/>Ngoại tệ</p></td>
						<td colspan = "2"><p>Số phát sinh<br/>Ngoại tệ</p></td>
						<td colspan = "2"><p>Số dư cuối<br/>Ngoại tệ</p></td>
						<td colspan = "2"><p>Số dư đầu</p></td>
						<td colspan = "2"><p>Số phát sinh</p></td>
						<td colspan = "2"><p>Số dư cuối</p></td>
					</tr>
					<tr font-weight="bold">
						<td><p>Nợ</p></td> <td><p>Có</p></td> <td><p>Nợ</p></td> 
						<td><p>Có</p></td> <td><p>Nợ</p></td> <td><p>Có</p></td> 
						<td><p>Nợ</p></td> <td><p>Có</p></td> <td><p>Nợ</p></td> 
						<td><p>Có</p></td> <td><p>Nợ</p></td> <td><p>Có</p></td>
					</tr>
					<tr>
						<td>A</td><td>B</td>
						<td>1</td><td>2</td><td>3</td><td>4</td><td>5</td><td>6</td>
						<td>7</td><td>8</td><td>9</td><td>10</td><td>11</td><td>12</td>
					</tr>
					`;
            // Cong no
            container.customsearch_scv_vas_cntt = isNoCurrency ? `
					<tr>
						<td border='none' width='10%'/>
						<td border='none' width='16%'/>
						
						<td border='none' width='10%'/>
						<td border='none' width='9%'/>
						<td border='none' width='9%'/>
						<td border='none' width='9%'/>
						<td border='none' width='9%'/>
						<td border='none' width='9%'/>
						<td border='none' width='9%'/>
					</tr>
					<tr border-top = "1pt solid black"  font-weight="bold">
						<td rowspan = "2"><p>Mã tài khoản</p></td>
						<td rowspan = "2"><p>Tên tài khoản</p></td>
						
						<td rowspan = "2"><p>Dối tượng</p></td>
						<td colspan = "2"><p>Số dư đầu</p></td>
						<td colspan = "2"><p>Số phát sinh</p></td>
						<td colspan = "2"><p>Số dư cuối</p></td>
					</tr>
					<tr  font-weight="bold">
						<td><p>Nợ</p></td><td><p>Có</p></td> 
						<td><p>Nợ</p></td><td><p>Có</p></td> 
						<td><p>Nợ</p></td><td><p>Có</p></td>
					</tr>
					<tr>
						<td>A</td><td>B</td><td>C</td>
						<td>1</td><td>2</td><td>3</td><td>4</td><td>5</td><td>6</td>
					</tr>
					`
                :
                `
					<tr>
						<td border='none' width='7%'/> <td border='none' width='9%'/>
						<td border='none' width='6%'/> <td border='none' width='6%'/> <td border='none' width='6%'/>
						<td border='none' width='6%'/> <td border='none' width='6%'/> <td border='none' width='6%'/>
						<td border='none' width='6%'/> <td border='none' width='6%'/> <td border='none' width='6%'/>
						<td border='none' width='6%'/> <td border='none' width='6%'/> <td border='none' width='6%'/>
						<td border='none' width='6%'/>
					</tr>
					<tr border-top = "1pt solid black"  font-weight="bold">
						<td rowspan = "2"><p>Mã tài khoản</p></td>
						<td rowspan = "2"><p>Tên tài khoản</p></td>
						
						<td rowspan = "2"><p>Đối tượng</p></td>
						<td colspan = "2"><p>Số dư đầu<br/>Ngoại tệ</p></td>
						<td colspan = "2"><p>Số phát sinh<br/>Ngoại tệ</p></td>
						<td colspan = "2"><p>Số dư cuối<br/>Ngoại tệ</p></td>
						<td colspan = "2"><p>Số dư đầu</p></td>
						<td colspan = "2"><p>Số phát sinh</p></td>
						<td colspan = "2"><p>Số dư cuối</p></td>
					</tr>
					<tr font-weight="bold">
						<td><p>Nợ</p></td> <td><p>Có</p></td> <td><p>Nợ</p></td> 
						<td><p>Có</p></td> <td><p>Nợ</p></td> <td><p>Có</p></td> 
						<td><p>Nợ</p></td> <td><p>Có</p></td> <td><p>Nợ</p></td> 
						<td><p>Có</p></td> <td><p>Nợ</p></td> <td><p>Có</p></td>
					</tr>
					<tr>
						<td>A</td><td>B</td><td>C</td>
						<td>1</td><td>2</td><td>3</td><td>4</td><td>5</td><td>6</td>
						<td>7</td><td>8</td><td>9</td><td>10</td><td>11</td><td>12</td>
					</tr>
					`;
            // Vay, cho vay, gui tiet kiem
            container.customsearch_scv_vas_vaytt = isNoCurrency ? `
					<tr>
						<td border='none' width='8%'/>
						<td border='none' width='16%'/>
						
						<td border='none' width='10%'/>
						<td border='none' width='8%'/>
						<td border='none' width='8%'/>
						<td border='none' width='8%'/>
						<td border='none' width='8%'/>
						<td border='none' width='8%'/>
						<td border='none' width='8%'/>
						<td border='none' width='8%'/>
					</tr>
					<tr border-top = "1pt solid black"  font-weight="bold">
						<td rowspan = "2"><p>Mã tài khoản</p></td>
						<td rowspan = "2"><p>Tên tài khoản</p></td>
						
						<td rowspan = "2"><p>Dối tượng</p></td>
						<td rowspan = "2"><p>Khế ước vay</p></td>
						<td colspan = "2"><p>Số dư đầu</p></td>
						<td colspan = "2"><p>Số phát sinh</p></td>
						<td colspan = "2"><p>Số dư cuối</p></td>
					</tr>
					<tr  font-weight="bold">
						<td><p>Nợ</p></td><td><p>Có</p></td> 
						<td><p>Nợ</p></td><td><p>Có</p></td> 
						<td><p>Nợ</p></td><td><p>Có</p></td>
					</tr>
					<tr>
						<td>A</td><td>B</td><td>C</td><td>D</td>
						<td>1</td><td>2</td><td>3</td><td>4</td><td>5</td><td>6</td>
					</tr>
					`
                :
                `
					<tr>
						<td border='none' width='7%'/> <td border='none' width='9%'/>
						<td border='none' width='6%'/> <td border='none' width='6%'/> <td border='none' width='5.5%'/>
						<td border='none' width='5.5%'/> <td border='none' width='5.5%'/> <td border='none' width='5.5%'/>
						<td border='none' width='5.5%'/> <td border='none' width='5.5%'/> <td border='none' width='5.5%'/>
						<td border='none' width='5.5%'/> <td border='none' width='5.5%'/> <td border='none' width='5.5%'/>
						<td border='none' width='5.5%'/> <td border='none' width='5.5%'/>
					</tr>
					<tr border-top = "1pt solid black"  font-weight="bold">
						<td rowspan = "2"><p>Mã tài khoản</p></td>
						<td rowspan = "2"><p>Tên tài khoản</p></td>
						
						<td rowspan = "2"><p>Đối tượng</p></td>
						<td rowspan = "2"><p>Khế ước vay</p></td>
						<td colspan = "2"><p>Số dư đầu<br/>Ngoại tệ</p></td>
						<td colspan = "2"><p>Số phát sinh<br/>Ngoại tệ</p></td>
						<td colspan = "2"><p>Số dư cuối<br/>Ngoại tệ</p></td>
						<td colspan = "2"><p>Số dư đầu</p></td>
						<td colspan = "2"><p>Số phát sinh</p></td>
						<td colspan = "2"><p>Số dư cuối</p></td>
					</tr>
					<tr font-weight="bold">
						<td><p>Nợ</p></td> <td><p>Có</p></td> <td><p>Nợ</p></td> 
						<td><p>Có</p></td> <td><p>Nợ</p></td> <td><p>Có</p></td> 
						<td><p>Nợ</p></td> <td><p>Có</p></td> <td><p>Nợ</p></td> 
						<td><p>Có</p></td> <td><p>Nợ</p></td> <td><p>Có</p></td>
					</tr>
					<tr>
						<td>A</td><td>B</td><td>C</td><td>D</td>
						<td>1</td><td>2</td><td>3</td><td>4</td><td>5</td><td>6</td>
						<td>7</td><td>8</td><td>9</td><td>10</td><td>11</td><td>12</td>
					</tr>
					`;
            return container[reportId];
        }
        
        const makeRowHeaderPdf = (objdetail, currencyvalue, reportype, OBJ_REPORT_TYPE) => {
            let rowData = '';
            if (!foreignCurrency(currencyvalue)) {
                if (reportype === OBJ_REPORT_TYPE.TT_CDPS) {
                    rowData = `
				<tr font-weight = "bold">
					<td><p>${objdetail.accnumber || ''}</p></td>
					<td><p>${esXml(objdetail.accname) || ''}</p></td>
					
					<td><p text-align = "right">${changeCurrency(objdetail.sodudaunovnd)}</p></td>
					<td><p text-align = "right">${changeCurrency(objdetail.sodudaucovnd)}</p></td>
					<td><p text-align = "right">${changeCurrency(objdetail.phatsinhnovnd)}</p></td>
					<td><p text-align = "right">${changeCurrency(objdetail.phatsinhcovnd)}</p></td>
					<td><p text-align = "right">${changeCurrency(objdetail.soducuoinovnd)}</p></td>
					<td><p text-align = "right">${changeCurrency(objdetail.soducuoicovnd)}</p></td>
				</tr>
				`;//<td><p>${esXml(objdetail.subsidiarynohierarchy)}</p></td>
                } else if (reportype === OBJ_REPORT_TYPE.TT_CN) {
                    rowData = `
				<tr  font-weight = "bold">
					<td><p>${objdetail.accnumber || ''}</p></td>
					<td><p>${esXml(objdetail.accname) || ''}</p></td>
					
					<td><p>${esXml(objdetail.doituong) || ''}</p></td>
					<td><p text-align = "right">${changeCurrency(objdetail.sodudaunovnd || 0)}</p></td>
					<td><p text-align = "right">${changeCurrency(objdetail.sodudaucovnd || 0)}</p></td>
					<td><p text-align = "right">${changeCurrency(objdetail.phatsinhnovnd || 0)}</p></td>
					<td><p text-align = "right">${changeCurrency(objdetail.phatsinhcovnd || 0)}</p></td>
					<td><p text-align = "right">${changeCurrency(objdetail.soducuoinovnd || 0)}</p></td>
					<td><p text-align = "right">${changeCurrency(objdetail.soducuoicovnd || 0)}</p></td>
				</tr>
				`;
                } else if (reportype === OBJ_REPORT_TYPE.TT_VAY) {
                    rowData = rowData = `
				<tr>
					<td><p>${objdetail.accnumber || ''}</p></td>
					<td><p>${esXml(objdetail.accname) || ''}</p></td>
					
					<td><p>${esXml(objdetail.doituong) || ''}</p></td>
					<td><p>${esXml(objdetail.kheuocvay_text) || ''}</p></td>
					<td><p text-align = "right">${changeCurrency(objdetail.sodudaunovnd)}</p></td>
					<td><p text-align = "right">${changeCurrency(objdetail.sodudaucovnd)}</p></td>
					<td><p text-align = "right">${changeCurrency(objdetail.phatsinhnovnd)}</p></td>
					<td><p text-align = "right">${changeCurrency(objdetail.phatsinhcovnd)}</p></td>
					<td><p text-align = "right">${changeCurrency(objdetail.soducuoinovnd)}</p></td>
					<td><p text-align = "right">${changeCurrency(objdetail.soducuoicovnd)}</p></td>
				</tr>
				`;
                }
            } else {
                if (reportype === OBJ_REPORT_TYPE.TT_CDPS) {
                    rowData = `
					<tr  font-weight = "bold">
						<td><p>${objdetail.accnumber || ''}</p></td>
						<td><p>${esXml(objdetail.accname) || ''}</p></td>
						
						<td><p text-align = "right">${changeCurrency(objdetail.sodudauno || 0, 2)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.sodudauco || 0, 2)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.phatsinhno || 0, 2)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.phatsinhco || 0, 2)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.soducuoino || 0, 2)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.soducuoico || 0, 2)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.sodudaunovnd || 0)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.sodudaucovnd || 0)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.phatsinhnovnd || 0)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.phatsinhcovnd || 0)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.soducuoinovnd || 0)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.soducuoicovnd || 0)}</p></td>
					</tr>
				`;
                } else if (reportype === OBJ_REPORT_TYPE.TT_CN) {
                    rowData = `
					<tr  font-weight = "bold">
						<td><p>${objdetail.accnumber || ''}</p></td>
						<td><p>${objdetail.accname || ''}</p></td>
						
						<td><p>${objdetail.doituong || ''}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.sodudauno || 0, 2)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.sodudauco || 0, 2)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.phatsinhno || 0, 2)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.phatsinhco || 0, 2)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.soducuoino || 0, 2)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.soducuoico || 0, 2)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.sodudaunovnd || 0)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.sodudaucovnd || 0)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.phatsinhnovnd || 0)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.phatsinhcovnd || 0)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.soducuoinovnd || 0)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.soducuoicovnd || 0)}</p></td>
					</tr>
					`;
                } else if (reportype === OBJ_REPORT_TYPE.TT_VAY) {
                    rowData = `
					<tr  font-weight = "bold">
						<td><p>${objdetail.accnumber || ''}</p></td>
						<td><p>${esXml(objdetail.accname) || ''}</p></td>
						
						<td><p>${esXml(objdetail.doituong) || ''}</p></td>
						<td><p>${esXml(objdetail.kheuocvay_text) || ''}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.sodudauno || 0, 2)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.sodudauco || 0, 2)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.phatsinhno || 0, 2)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.phatsinhco || 0, 2)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.soducuoino || 0, 2)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.soducuoico || 0, 2)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.sodudaunovnd || 0)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.sodudaucovnd || 0)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.phatsinhnovnd || 0)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.phatsinhcovnd || 0)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.soducuoinovnd || 0)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.soducuoicovnd || 0)}</p></td>
					</tr>
					`;
                }
            }
            return rowData;
        }
        
        
        const foreignCurrency = (value) => {
            return !!value && value !== '1';
        }
        
        
        const makeRowBodyPdf = (objdetail, currencyvalue, reportype, OBJ_REPORT_TYPE) => {
            let rowData = '';
            if (!foreignCurrency(currencyvalue)) {
                if (reportype === OBJ_REPORT_TYPE.TT_CDPS) {
                    rowData = `
				<tr>
					<td><p>${objdetail.accnumber || ''}</p></td>
					<td><p>${esXml(objdetail.accname) || ''}</p></td>
					
					<td><p text-align = "right">${changeCurrency(objdetail.sodudaunovnd)}</p></td>
					<td><p text-align = "right">${changeCurrency(objdetail.sodudaucovnd)}</p></td>
					<td><p text-align = "right">${changeCurrency(objdetail.phatsinhnovnd)}</p></td>
					<td><p text-align = "right">${changeCurrency(objdetail.phatsinhcovnd)}</p></td>
					<td><p text-align = "right">${changeCurrency(objdetail.soducuoinovnd)}</p></td>
					<td><p text-align = "right">${changeCurrency(objdetail.soducuoicovnd)}</p></td>
				</tr>
				`;
                } else if (reportype === OBJ_REPORT_TYPE.TT_CN) {
                    rowData = `
				<tr>
					<td><p>${objdetail.accnumber || ''}</p></td>
					<td><p>${esXml(objdetail.accname) || ''}</p></td>
					
					<td><p>${esXml(objdetail.doituong) || ''}</p></td>
					<td><p text-align = "right">${changeCurrency(objdetail.sodudaunovnd || 0)}</p></td>
					<td><p text-align = "right">${changeCurrency(objdetail.sodudaucovnd || 0)}</p></td>
					<td><p text-align = "right">${changeCurrency(objdetail.phatsinhnovnd || 0)}</p></td>
					<td><p text-align = "right">${changeCurrency(objdetail.phatsinhcovnd || 0)}</p></td>
					<td><p text-align = "right">${changeCurrency(objdetail.soducuoinovnd || 0)}</p></td>
					<td><p text-align = "right">${changeCurrency(objdetail.soducuoicovnd || 0)}</p></td>
				</tr>
				`;
                } else if (reportype === OBJ_REPORT_TYPE.TT_VAY) {
                    rowData = rowData = `
				<tr>
					<td><p>${objdetail.accnumber || ''}</p></td>
					<td><p>${esXml(objdetail.accname)}</p></td>
					
					<td><p>${esXml(objdetail.doituong)}</p></td>
					<td><p>${esXml(objdetail.kheuocvay_text)}</p></td>
					<td><p text-align = "right">${changeCurrency(objdetail.sodudaunovnd)}</p></td>
					<td><p text-align = "right">${changeCurrency(objdetail.sodudaucovnd)}</p></td>
					<td><p text-align = "right">${changeCurrency(objdetail.phatsinhnovnd)}</p></td>
					<td><p text-align = "right">${changeCurrency(objdetail.phatsinhcovnd)}</p></td>
					<td><p text-align = "right">${changeCurrency(objdetail.soducuoinovnd)}</p></td>
					<td><p text-align = "right">${changeCurrency(objdetail.soducuoicovnd)}</p></td>
				</tr>
				`;
                }
            } else {
                if (reportype === OBJ_REPORT_TYPE.TT_CDPS) {
                    rowData = `
					<tr>
						<td><p>${objdetail.accnumber || ''}</p></td>
						<td><p>${esXml(objdetail.accname)}</p></td>
						
						<td><p text-align = "right">${changeCurrency(objdetail.sodudauno || 0, 2)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.sodudauco || 0, 2)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.phatsinhno || 0, 2)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.phatsinhco || 0, 2)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.soducuoino || 0, 2)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.soducuoico || 0, 2)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.sodudaunovnd || 0)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.sodudaucovnd || 0)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.phatsinhnovnd || 0)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.phatsinhcovnd || 0)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.soducuoinovnd || 0)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.soducuoicovnd || 0)}</p></td>
					</tr>
				`;
                } else if (reportype === OBJ_REPORT_TYPE.TT_CN) {
                    rowData = `
					<tr>
						<td><p>${objdetail.accnumber || ''}</p></td>
						<td><p>${esXml(objdetail.accname)}</p></td>
						
						<td><p>${esXml(objdetail.doituong)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.sodudauno || 0, 2)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.sodudauco || 0, 2)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.phatsinhno || 0, 2)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.phatsinhco || 0, 2)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.soducuoino || 0, 2)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.soducuoico || 0, 2)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.sodudaunovnd || 0)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.sodudaucovnd || 0)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.phatsinhnovnd || 0)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.phatsinhcovnd || 0)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.soducuoinovnd || 0)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.soducuoicovnd || 0)}</p></td>
					</tr>
					`;
                } else if (reportype === OBJ_REPORT_TYPE.TT_VAY) {
                    rowData = `
					<tr>
						<td><p>${objdetail.accnumber || ''}</p></td>
						<td><p>${esXml(objdetail.accname)}</p></td>
						
						<td><p>${esXml(objdetail.doituong)}</p></td>
						<td><p>${esXml(objdetail.kheuocvay_text)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.sodudauno || 0, 2)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.sodudauco || 0, 2)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.phatsinhno || 0, 2)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.phatsinhco || 0, 2)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.soducuoino || 0, 2)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.soducuoico || 0, 2)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.sodudaunovnd || 0)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.sodudaucovnd || 0)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.phatsinhnovnd || 0)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.phatsinhcovnd || 0)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.soducuoinovnd || 0)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.soducuoicovnd || 0)}</p></td>
					</tr>
					`;
                }
            }
            return rowData;
        }

        const createForm = (_params, master, subsidiary, account, account_parent) => {
            let form = serverWidget.createForm({title: "VAS Sổ tổng hợp"});
            form.clientScriptModulePath = '../cs/scv_cs_sl_rp_vas_tt.js';
            form.addButton({id: 'custpage_bt_search', label: 'Search', functionName: 'searchReport()'});
            form.addButton({id: 'custpage_bt_export', label: 'Export', functionName: 'exportReport()'});
            form.addButton({id: 'custpage_bt_printpdf', label: 'PrintPdf', functionName: 'onPrintPdf()'});
            //form.addButton({id: 'custpage_bt_export_detail', label: 'Export Detail', functionName: 'exportReportDetail()'});
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
                {value: OBJ_REPORT_TYPE.TT_CDPS, label: 'Cân đối phát sinh'},
                {value: OBJ_REPORT_TYPE.TT_CN, label: 'Công nợ'},
                {value: OBJ_REPORT_TYPE.TT_VAY, label: 'Vay, cho vay, gửi tiết kiệm'}
            ];
            libRep.addSelecttionFrList(fieldReportype, _params.custpage_reportype, listReport, false);
            
            let fieldSubsidiary = form.addField({
                id: 'custpage_subsidiary',
                type: serverWidget.FieldType.MULTISELECT,
                label: 'Subsidiary',
                container: container
            });
            fieldSubsidiary.isMandatory = true;
            libRep.addSelectSubsidiary(fieldSubsidiary, subsidiary, 'any');
            
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
            
            let fieldNetnoco = form.addField({
                id: 'custpage_netnoco',
                type: serverWidget.FieldType.CHECKBOX,
                label: 'Net Nợ, Có',
                container: container
            }).updateLayoutType({layoutType: serverWidget.FieldLayoutType.STARTROW});
            fieldNetnoco.defaultValue = _params.custpage_netnoco || 'F';
            
            let fieldNotLevel = form.addField({
                id: 'custpage_not_level',
                type: serverWidget.FieldType.CHECKBOX,
                label: 'Not Level',
                container: container
            }).updateLayoutType({layoutType: serverWidget.FieldLayoutType.MIDROW});
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
        
        const pushFiltersDetail = (f, parameters, subsidiary, entity, currencyvalue, account, date_dauky, date_cuoiky, currencytext) => {
            f.push(search.createFilter({name: 'subsidiary', operator: search.Operator.ANYOF, values: subsidiary}));
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
        
        const getSublistColMaster = () => {
            let field_select = 'custpage_sl_select';
            let sl_ct = 'custpage_sl_tt';
            let OBJ_REPORT_TYPE = {
                TT_CDPS: "customsearch_scv_vas_cdpstt",
                TT_CN: "customsearch_scv_vas_cntt",
                TT_VAY: "customsearch_scv_vas_vaytt"
            };
            
            let col_sl_cdps = [
                {id: 'accnumber', label: 'Mã tài khoản', type: 'text', display: serverWidget.FieldDisplayType.INLINE},
                {id: 'accname', label: 'Tên tài khoản', type: 'text', display: serverWidget.FieldDisplayType.INLINE},
                /*{
                    id: 'subsidiarynohierarchy',
                    label: 'Công ty/chi nhánh',
                    type: 'text',
                    display: serverWidget.FieldDisplayType.INLINE
                },*/
                {
                    id: 'sodudauno',
                    label: 'Số dư đầu: Nợ',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                },
                {
                    id: 'sodudauco',
                    label: 'Số dư đầu: Có',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                },
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
                {
                    id: 'soducuoino',
                    label: 'Số dư cuối: Nợ',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                },
                {
                    id: 'soducuoico',
                    label: 'Số dư cuối: Có',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                },
                {
                    id: 'sodudaunovnd',
                    label: 'Số dư: Nợ (VND)',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                },
                {
                    id: 'sodudaucovnd',
                    label: 'Số dư: Có (VND)',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                },
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
                    id: 'soducuoinovnd',
                    label: 'Số dư cuối: Nợ (VND)',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                },
                {
                    id: 'soducuoicovnd',
                    label: 'Số dư cuối: Có (VND)',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
            
            ];
            
            let col_sl_cdps_nocurrency = [
                {id: 'accnumber', label: 'Mã tài khoản', type: 'text', display: serverWidget.FieldDisplayType.INLINE},
                {id: 'accname', label: 'Tên tài khoản', type: 'text', display: serverWidget.FieldDisplayType.INLINE},
                /*{
                    id: 'subsidiarynohierarchy',
                    label: 'Công ty/chi nhánh',
                    type: 'text',
                    display: serverWidget.FieldDisplayType.INLINE
                },*/
                {
                    id: 'sodudaunovnd',
                    label: 'Số dư đầu: Nợ',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                },
                {
                    id: 'sodudaucovnd',
                    label: 'Số dư đầu: Có',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                },
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
                {
                    id: 'soducuoinovnd',
                    label: 'Số dư cuối: Nợ',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                },
                {
                    id: 'soducuoicovnd',
                    label: 'Số dư cuối: Có',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
            ];
            
            let col_ss_cdps = [['account', 0], ['account_text', 0, 'sltext'], ['subsidiarynohierarchy', 1], ['sodudauno', 2], ['sodudauco', 3], ['phatsinhno', 4], ['phatsinhco', 5],
                ['soducuoino', 6], ['soducuoico', 7], ['sodudaunovnd', 8], ['sodudaucovnd', 9], ['phatsinhnovnd', 10], ['phatsinhcovnd', 11], ['soducuoinovnd', 12], ['soducuoicovnd', 13]
            ];
            
            let col_sl_cn = [
                {id: 'accnumber', label: 'Mã tài khoản', type: 'text', display: serverWidget.FieldDisplayType.INLINE},
                {id: 'accname', label: 'Tên tài khoản', type: 'text', display: serverWidget.FieldDisplayType.INLINE},
                /*{
                    id: 'subsidiarynohierarchy',
                    label: 'Công ty/chi nhánh',
                    type: 'text',
                    display: serverWidget.FieldDisplayType.INLINE
                },*/
                {id: 'doituong', label: 'Đối tượng', type: 'text', display: serverWidget.FieldDisplayType.INLINE},
                {
                    id: 'sodudauno',
                    label: 'Số dư đầu: Nợ',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                },
                {
                    id: 'sodudauco',
                    label: 'Số dư đầu: Có',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                },
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
                {
                    id: 'soducuoino',
                    label: 'Số dư cuối: Nợ',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                },
                {
                    id: 'soducuoico',
                    label: 'Số dư cuối: Có',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                },
                {
                    id: 'sodudaunovnd',
                    label: 'Số dư: Nợ (VND)',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                },
                {
                    id: 'sodudaucovnd',
                    label: 'Số dư: Có (VND)',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                },
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
                    id: 'soducuoinovnd',
                    label: 'Số dư cuối: Nợ (VND)',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                },
                {
                    id: 'soducuoicovnd',
                    label: 'Số dư cuối: Có (VND)',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
            
            ];
            
            let col_sl_cn_nocurrency = [
                {id: 'accnumber', label: 'Mã tài khoản', type: 'text', display: serverWidget.FieldDisplayType.INLINE},
                {id: 'accname', label: 'Tên tài khoản', type: 'text', display: serverWidget.FieldDisplayType.INLINE},
                /*{
                    id: 'subsidiarynohierarchy',
                    label: 'Công ty/chi nhánh',
                    type: 'text',
                    display: serverWidget.FieldDisplayType.INLINE
                },*/
                {id: 'doituong', label: 'Đối tượng', type: 'text', display: serverWidget.FieldDisplayType.INLINE},
                {
                    id: 'sodudaunovnd',
                    label: 'Số dư đầu: Nợ',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                },
                {
                    id: 'sodudaucovnd',
                    label: 'Số dư đầu: Có',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                },
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
                {
                    id: 'soducuoinovnd',
                    label: 'Số dư cuối: Nợ',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                },
                {
                    id: 'soducuoicovnd',
                    label: 'Số dư cuối: Có',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
            ];
            
            let col_ss_cn = [['account', 0], ['account_text', 0, 'sltext'], ['subsidiarynohierarchy', 1], ['doituong', 2], ['sodudauno', 3], ['sodudauco', 4], ['phatsinhno', 5], ['phatsinhco', 6],
                ['soducuoino', 7], ['soducuoico', 8], ['sodudaunovnd', 9], ['sodudaucovnd', 10], ['phatsinhnovnd', 11], ['phatsinhcovnd', 12], ['soducuoinovnd', 13], ['soducuoicovnd', 14]
            ];
            
            let col_sl_vay = [
                {id: 'accnumber', label: 'Mã tài khoản', type: 'text', display: serverWidget.FieldDisplayType.INLINE},
                {id: 'accname', label: 'Tên tài khoản', type: 'text', display: serverWidget.FieldDisplayType.INLINE},
                /*{
                    id: 'subsidiarynohierarchy',
                    label: 'Công ty/chi nhánh',
                    type: 'text',
                    display: serverWidget.FieldDisplayType.INLINE
                },*/
                {id: 'doituong', label: 'Đối tượng', type: 'text', display: serverWidget.FieldDisplayType.INLINE},
                {
                    id: 'kheuocvay_text',
                    label: 'Khế ước vay',
                    type: 'text',
                    display: serverWidget.FieldDisplayType.INLINE
                },
                {
                    id: 'sodudauno',
                    label: 'Số dư đầu: Nợ',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                },
                {
                    id: 'sodudauco',
                    label: 'Số dư đầu: Có',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                },
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
                {
                    id: 'soducuoino',
                    label: 'Số dư cuối: Nợ',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                },
                {
                    id: 'soducuoico',
                    label: 'Số dư cuối: Có',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                },
                {
                    id: 'sodudaunovnd',
                    label: 'Số dư: Nợ (VND)',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                },
                {
                    id: 'sodudaucovnd',
                    label: 'Số dư: Có (VND)',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                },
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
                    id: 'soducuoinovnd',
                    label: 'Số dư cuối: Nợ (VND)',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                },
                {
                    id: 'soducuoicovnd',
                    label: 'Số dư cuối: Có (VND)',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
            
            ];
            
            let col_sl_vay_nocurrency = [
                {id: 'accnumber', label: 'Mã tài khoản', type: 'text', display: serverWidget.FieldDisplayType.INLINE},
                {id: 'accname', label: 'Tên tài khoản', type: 'text', display: serverWidget.FieldDisplayType.INLINE},
                /*{
                    id: 'subsidiarynohierarchy',
                    label: 'Công ty/chi nhánh',
                    type: 'text',
                    display: serverWidget.FieldDisplayType.INLINE
                },*/
                {id: 'doituong', label: 'Đối tượng', type: 'text', display: serverWidget.FieldDisplayType.INLINE},
                {
                    id: 'kheuocvay_text',
                    label: 'Khế ước vay',
                    type: 'text',
                    display: serverWidget.FieldDisplayType.INLINE
                },
                {
                    id: 'sodudaunovnd',
                    label: 'Số dư đầu: Nợ',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                },
                {
                    id: 'sodudaucovnd',
                    label: 'Số dư đầu: Có',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                },
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
                {
                    id: 'soducuoinovnd',
                    label: 'Số dư cuối: Nợ',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                },
                {
                    id: 'soducuoicovnd',
                    label: 'Số dư cuối: Có',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
            ];
            
            let col_ss_vay = [['account', 0], ['account_text', 0, 'sltext'], ['subsidiarynohierarchy', 1], ['doituong', 2], ['kheuocvay', 3], ['kheuocvay_text', 3, 'sltext'], ['sodudauno', 4], ['sodudauco', 5], ['phatsinhno', 6], ['phatsinhco', 7],
                ['soducuoino', 8], ['soducuoico', 9], ['sodudaunovnd', 10], ['sodudaucovnd', 11], ['phatsinhnovnd', 12], ['phatsinhcovnd', 13], ['soducuoinovnd', 14], ['soducuoicovnd', 15]
            ];
            
            return {
                field_select: field_select, sl_ct: sl_ct, OBJ_REPORT_TYPE: OBJ_REPORT_TYPE,
                col_sl_cdps: col_sl_cdps, col_sl_cdps_nocurrency: col_sl_cdps_nocurrency, col_ss_cdps: col_ss_cdps,
                col_sl_cn: col_sl_cn, col_sl_cn_nocurrency: col_sl_cn_nocurrency, col_ss_cn: col_ss_cn,
                col_sl_vay: col_sl_vay, col_sl_vay_nocurrency: col_sl_vay_nocurrency, col_ss_vay: col_ss_vay
            }
        }
        
        return {
            onRequest
        };
        
    });
