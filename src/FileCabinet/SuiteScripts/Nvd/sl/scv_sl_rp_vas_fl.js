/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/format', 'N/file', 'N/render', 'N/runtime', 'N/search', 'N/ui/serverWidget', 'N/url', 'N/xml',
        '../lib/scv_lib_function.js', '../lib/scv_lib_report.js'],
    
    (format, file, render, runtime, search, serverWidget, url, xml, libFunc, libRep) => {
        
        let isPrint = "", listPrint = {table: {header: "", body: ""}, type: ""};
        
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
            let namefile = parameters.namefile;
            isPrint = parameters.isPrint;
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
                if (reportype === OBJ_REPORT_TYPE.FT_CN) {
                    colid = master.col_sl_cn_nocurrency;
                    col_detail = master.col_ss_cn;
                } else if (reportype === OBJ_REPORT_TYPE.FT_SNKC) {
                    colid = master.col_sl_snkc_nocurrency;
                    col_detail = master.col_ss_snkc;
                } else {
                    isRun = false;
                }
            } else {
                if (reportype === OBJ_REPORT_TYPE.FT_CN) {
                    colid = master.col_sl_cn;
                    col_detail = master.col_ss_cn;
                } else if (reportype === OBJ_REPORT_TYPE.FT_SNKC) {
                    colid = master.col_sl_snkc;
                    col_detail = master.col_ss_snkc;
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
                if (reportype === OBJ_REPORT_TYPE.FT_SNKC) {
                    libRep.doSearchSS(reportype, 1000, list_detail, filters_detail, col_detail);
                } else {
                    let datefrom = format.parse({value: date_dauky, type: format.Type.DATE});
                    let datefromfm = datefrom.getFullYear() + '' + ((datefrom.getMonth() + 1) + '').padStart(2, '0') + (datefrom.getDate() + '').padStart(2, '0');
                    let col1 = {
                        name: 'formulanumeric',
                        summary: search.Summary.SUM,
                        label: 'Số dư đầu Nợ Ngoại tệ',
                        type: 'float',
                        formula: "case when TO_NUMBER(TO_CHAR({trandate},'YYYYMMDD')) < " + datefromfm + " then {debitfxamount} else 0 end"
                    };
                    let col2 = {
                        name: 'formulanumeric',
                        summary: search.Summary.SUM,
                        label: 'Số dư đầu Có Ngoại tệ',
                        type: 'float',
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
                        name: 'formulanumeric',
                        summary: search.Summary.SUM,
                        label: 'Số dư cuối Nợ Ngoại tệ',
                        type: 'float',
                        formula: "{debitfxamount}"
                    };
                    let col6 = {
                        name: 'formulanumeric',
                        summary: search.Summary.SUM,
                        label: 'Số dư cuối Có Ngoại tệ',
                        type: 'float',
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
                    
                    col_add = [col1, col2, col3, col4, col5, col6, col7, col8, col9, col10, col11, col12];
                    libRep.doSearchSSMore(reportype, 1000, list_detail, filters_detail, col_detail, col_add, null);
                }
                
                let isexport = parameters.isexport;
                if (isexport !== "T") {
                    setSublistValueLine(sublist, colid, list_detail, currencyvalue, reportype, OBJ_REPORT_TYPE, 0, parameters);
                } else {
                    let objRow = exportExcel(response, parameters, list_detail, currencyvalue, reportype, OBJ_REPORT_TYPE, 0);
                    let line = objRow.line;
                    let path = '../xml/vas/fl/';
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
                        if (isPrint === "T") {
                            let objHeader = {
                                pSubsidiary: lkSub['legalname'],
                                pSubsidiaryAddress: lkSub['address.address'],
                                pDatefrom: date_dauky,
                                pDateto: date_cuoiky,
                                pAccount: accounttext || 'Tổng hợp',
                                pCurrency: currencytext || 'VND',
                                pEntity: entity || 'Tổng hợp',
                                pTitle: reportype === OBJ_REPORT_TYPE.FT_CN ? "Tổng hợp công nợ" : "Sổ nhật ký chung",
                                isHtmlEntity: reportype === OBJ_REPORT_TYPE.FT_CN,
                            }
                            let f = onRenderPdf(objHeader);
                            f.name = namefile || namefilexml.substring(4, namefilexml.length) + '.pdf';
                            response.writeFile(f, true);
                            return;
                        }
                        
                        content = content.replace(/{pSubsidiary}/gi, lkSub['legalname']);
                        content = content.replace(/{pSubsidiaryAddress}/gi, lkSub['address.address']);
                        content = content.replace(/{pDatefrom}/gi, date_dauky);
                        content = content.replace(/{pDateto}/gi, date_cuoiky);
                        content = content.replace(/{pAccount}/gi, accounttext || 'Tổng hợp');
                        content = content.replace(/{pCurrency}/gi, currencytext || 'VND');
                        content = content.replace(/{pEntity}/gi, entity || 'Tổng hợp');
                        content = content.replace(/{pTotalrow}/gi, line);
                        
                        if (reportype === OBJ_REPORT_TYPE.FT_CN) {
                            content = content.replace(/{pExpandedRowCount}/gi, 25 + line);
                        } else if (reportype === OBJ_REPORT_TYPE.FT_SNKC) {
                            content = content.replace(/{pExpandedRowCount}/gi, 20 + line);
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
        
        // Add data to output to Render pdf
        const addDataToRenderPdf = (objdetail, currencyvalue, reportype, OBJ_REPORT_TYPE) => {
            let type = reportype, header = "", body = "";
            let isPrintHeader = !listPrint.table.header;
            if (!foreignCurrency(currencyvalue)) {
                type += "_vnd";
                if (reportype === OBJ_REPORT_TYPE.FT_CN) {
                    isPrintHeader
                        ?
                        header = `
					<tr>
						<td width = "10%" border = "none"/><td width = "36%" border = "none"/>
						<td width = "9%" border = "none"/><td width = "9%" border = "none"/>
						<td width = "9%" border = "none"/><td width = "9%" border = "none"/><td width = "9%" border = "none"/><td width = "9%" border = "none"/>
					</tr>
					<tr border-top = "1pt solid black"  font-weight="bold">
						<td rowspan = "2"><p>Công ty/chi nhánh</p></td>
						<td rowspan = "2"><p>Đối tượng</p></td>
						<td colspan = "2"><p>Số dư đầu</p></td>
						<td colspan = "2"><p>Số phát sinh</p></td>
						<td colspan = "2"><p>Số dư cuối</p></td>
					</tr>
					<tr  font-weight="bold">
						<td><p>Nợ</p></td>
						<td><p>Có</p></td>
						<td><p>Nợ</p></td>
						<td><p>Có</p></td>
						<td><p>Nợ</p></td>
						<td><p>Có</p></td>
					</tr>
					<tr>
						<td>A</td><td>B</td><td>1</td><td>2</td><td>3</td><td>4</td><td>5</td><td>6</td>
					</tr>
					`
                        :
                        '';
                    body = `
					<tr>
						<td><p>${esXml(objdetail.subsidiarynohierarchy)}</p></td>
						<td><p>${esXml(objdetail.doituong)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.sodudaunovnd)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.sodudaucovnd)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.phatsinhnovnd)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.phatsinhcovnd)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.soducuoinovnd)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.soducuoicovnd)}</p></td>
					</tr>
				`;
                }
                
                if (reportype === OBJ_REPORT_TYPE.FT_SNKC) {
                    isPrintHeader
                        ?
                        header = `
					<tr>
						<td width = "9%" border = "none"/><td width = "9%" border = "none"/><td width = "9%" border = "none"/><td width = "9%" border = "none"/>
						<td width = "28%" border = "none"/><td width = "9%" border = "none"/><td width = "13%" border = "none"/><td width = "14%" border = "none"/>
					</tr>
					<tr border-top = "1pt solid black"  font-weight="bold">
						<td><p>Ngày tháng</p></td>
						<td><p>Số phiếu</p></td>
						<td><p>Ngày CT</p></td>
						<td><p>Số CT</p></td>
						<td><p>Diễn giải</p></td>
						<td><p>Mã tài khoản</p></td>
						<td><p>Nợ</p></td>
						<td><p>Có</p></td>
					</tr>
					<tr>
						<td>A</td><td>B</td><td>C</td><td>D</td><td>E</td>
						<td>F</td><td>1</td><td>2</td>
					</tr>
					`
                        :
                        '';
                    body = `
					<tr>
						<td><p text-align = "center">${objdetail.trandate}</p></td>
						<td><p>${objdetail.tranid}</p></td>
						<td><p text-align = "center">${objdetail.ngayct}</p></td>
						<td><p>${esXml(objdetail.soct)}</p></td>
						<td><p>${esXml(objdetail.diengiai)}</p></td>
						<td><p>${objdetail.accnumber}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.phatsinhnovnd)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.phatsinhcovnd)}</p></td>
					</tr>
				`;
                }
            } else {
                if (reportype === OBJ_REPORT_TYPE.FT_CN) {
                    isPrintHeader
                        ?
                        header = `
					<tr>
						<td width = "6.25%" border = "none"/><td width = "12.75%" border = "none"/>
						<td width = "6.75%" border = "none"/><td width = "6.75%" border = "none"/><td width = "6.75%" border = "none"/><td width = "6.75%" border = "none"/><td width = "6.75%" border = "none"/><td width = "6.75%" border = "none"/>
						<td width = "6.75%" border = "none"/><td width = "6.75%" border = "none"/><td width = "6.75%" border = "none"/><td width = "6.75%" border = "none"/><td width = "6.75%" border = "none"/><td width = "6.75%" border = "none"/>
					</tr>
					<tr border-top = "1pt solid black"  font-weight="bold">
						<td rowspan = "2"><p>Công ty/chi nhánh</p></td>
						<td rowspan = "2"><p>Đối tượng</p></td>
						<td colspan = "2"><p>Số dư đầu<br/>Ngoại tệ</p></td>
						<td colspan = "2"><p>Số phát sinh<br/>Ngoại tệ</p></td>
						<td colspan = "2"><p>Số dư cuối<br/>Ngoại tệ</p></td>
						<td colspan = "2"><p>Số dư đầu</p></td>
						<td colspan = "2"><p>Số phát sinh</p></td>
						<td colspan = "2"><p>Số dư cuối</p></td>
					</tr>
					<tr  font-weight="bold">
						<td><p>Nợ</p></td>
						<td><p>Có</p></td>
						<td><p>Nợ</p></td>
						<td><p>Có</p></td>
						<td><p>Nợ</p></td>
						<td><p>Có</p></td>
						<td><p>Nợ</p></td>
						<td><p>Có</p></td>
						<td><p>Nợ</p></td>
						<td><p>Có</p></td>
						<td><p>Nợ</p></td>
						<td><p>Có</p></td>
					</tr>
					<tr>
						<td>A</td><td>B</td>
						<td>1</td><td>2</td><td>3</td><td>4</td><td>5</td><td>6</td>
						<td>7</td><td>8</td><td>9</td><td>10</td><td>11</td><td>12</td>
					</tr>
					`
                        :
                        '';
                    body = `
					<tr>
						<td><p>${esXml(objdetail.subsidiarynohierarchy)}</p></td>
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
                }
                
                if (reportype === OBJ_REPORT_TYPE.FT_SNKC) {
                    isPrintHeader
                        ?
                        header = `
					<tr>
						<td width = "7%" border = "none"/><td width = "7%" border = "none"/><td width = "7%" border = "none"/><td width = "7%" border = "none"/>
						<td width = "22%" border = "none"/>
						<td width = "9%" border = "none"/><td width = "9%" border = "none"/><td width = "9%" border = "none"/>
						<td width = "9%" border = "none"/><td width = "9%" border = "none"/><td width = "9%" border = "none"/>
					</tr>
					<tr border-top = "1pt solid black" font-weight="bold">
						<td rowspan = "2"><p>Ngày tháng</p></td>
						<td rowspan = "2"><p>Số phiếu</p></td>
						<td rowspan = "2"><p>Ngày CT</p></td>
						<td rowspan = "2"><p>Số CT</p></td>
						<td rowspan = "2"><p>Diễn giải</p></td>
						<td rowspan = "2"><p>Mã tài khoản</p></td>
						<td rowspan = "2"><p>Tỷ giá</p></td>
						<td colspan="2" ><p>Ngoại tệ</p></td>
						<td colspan="2" ><p>Quy ra VND</p></td>
					</tr>
					<tr  font-weight="bold">
						<td><p>Nợ</p></td>
						<td><p>Có</p></td>
						<td><p>Nợ</p></td>
						<td><p>Có</p></td>
					</tr>
					<tr>
						<td>A</td><td>B</td><td>C</td><td>D</td><td>E</td>
						<td>F</td><td>1</td><td>2</td><td>3</td><td>4</td><td>5</td>
					</tr>
					`
                        :
                        '';
                    body = `
					<tr>
						<td><p text-align = "center">${objdetail.trandate}</p></td>
						<td><p>${objdetail.tranid}</p></td>
						<td><p text-align = "center">${objdetail.ngayct}</p></td>
						<td><p>${objdetail.soct}</p></td>
						<td><p>${esXml(objdetail.diengiai)}</p></td>
						<td><p>${objdetail.accnumber}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.tygia)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.phatsinhno, 2)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.phatsinhco, 2)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.phatsinhnovnd)}</p></td>
						<td><p text-align = "right">${changeCurrency(objdetail.phatsinhcovnd)}</p></td>
					</tr>
				`;
                }
            }
            listPrint.type = type;
            isPrintHeader ? listPrint.table.header = header : "";
            listPrint.table.body += body;
        }
        
        const addRowEndTable = (total, currencyvalue, reportype, OBJ_REPORT_TYPE) => {
            let endRow = "";
            if (!foreignCurrency(currencyvalue)) {
                if (reportype === OBJ_REPORT_TYPE.FT_CN) {
                    endRow = `
					<tr>
						<td colspan = "2"><p text-align = "center"><b>Tổng cộng:</b></p></td>
						<td><p text-align = "right"><b>${changeCurrency(total.sodudaunovnd)}</b></p></td>
						<td><p text-align = "right"><b>${changeCurrency(total.sodudaucovnd)}</b></p></td>
						<td><p text-align = "right"><b>${changeCurrency(total.phatsinhnovnd)}</b></p></td>
						<td><p text-align = "right"><b>${changeCurrency(total.phatsinhcovnd)}</b></p></td>
						<td><p text-align = "right"><b>${changeCurrency(total.soducuoinovnd)}</b></p></td>
						<td><p text-align = "right"><b>${changeCurrency(total.soducuoicovnd)}</b></p></td>
					</tr>
				`;
                }
                
                if (reportype === OBJ_REPORT_TYPE.FT_SNKC) {
                    endRow = `
					<tr>
						<td colspan="6"><p text-align = "center"><b>Tổng cộng: </b></p></td>
						<td><p text-align = "right"><b>${changeCurrency(total.phatsinhnovnd)}</b></p></td>
						<td><p text-align = "right"><b>${changeCurrency(total.phatsinhcovnd)}</b></p></td>
					</tr>
				`;
                }
            } else {
                if (reportype === OBJ_REPORT_TYPE.FT_CN) {
                    endRow = `
					<tr>
						<td colspan ="2"><p text-align = "center"><b>Tổng cộng: </b></p></td>
						<td><p text-align = "right" font-weight = "bold">${changeCurrency(total.sodudauno || 0, 2)}</p></td>
						<td><p text-align = "right" font-weight = "bold">${changeCurrency(total.sodudauco || 0, 2)}</p></td>
						<td><p text-align = "right" font-weight = "bold">${changeCurrency(total.phatsinhno || 0, 2)}</p></td>
						<td><p text-align = "right" font-weight = "bold">${changeCurrency(total.phatsinhco || 0, 2)}</p></td>
						<td><p text-align = "right" font-weight = "bold">${changeCurrency(total.soducuoino || 0, 2)}</p></td>
						<td><p text-align = "right" font-weight = "bold">${changeCurrency(total.soducuoico || 0, 2)}</p></td>
						<td><p text-align = "right" font-weight = "bold">${changeCurrency(total.sodudaunovnd || 0)}</p></td>
						<td><p text-align = "right" font-weight = "bold">${changeCurrency(total.sodudaucovnd || 0)}</p></td>
						<td><p text-align = "right" font-weight = "bold">${changeCurrency(total.phatsinhnovnd || 0)}</p></td>
						<td><p text-align = "right" font-weight = "bold">${changeCurrency(total.phatsinhcovnd || 0)}</p></td>
						<td><p text-align = "right" font-weight = "bold">${changeCurrency(total.soducuoinovnd || 0)}</p></td>
						<td><p text-align = "right" font-weight = "bold">${changeCurrency(total.soducuoicovnd || 0)}</p></td>
					</tr>
				`;
                }
                
                if (reportype === OBJ_REPORT_TYPE.FT_SNKC) {
                    endRow = `
					<tr>
						<td colspan="7"><p text-align = "center" font-weight = "bold">Tổng cộng: </p></td>
						<td><p text-align = "right" font-weight = "bold">${changeCurrency(total.phatsinhno, 2)}</p></td>
						<td><p text-align = "right" font-weight = "bold">${changeCurrency(total.phatsinhco, 2)}</p></td>
						<td><p text-align = "right" font-weight = "bold">${changeCurrency(total.phatsinhnovnd)}</p></td>
						<td><p text-align = "right" font-weight = "bold">${changeCurrency(total.phatsinhcovnd)}</p></td>
					</tr>
				`;
                }
            }
            listPrint.table.body += endRow;
        }
        
        
        // Escape xml special char
        const esXml = (str) => {
            return xml.escape(str);
        }
        
        // Change currency
        const changeCurrency = (number, range = 0) => {
            if (!!number && Number(number) !== 0) {
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
        
        // Render pdf
        const onRenderPdf = (objHeader) => {
            let content = file.load("../xml/pdf/scv_render_rp_snkc_thcn_th_pdf.xml").getContents();
            // Add para with case Tổng hợp công nợ
            let strEntity = objHeader.isHtmlEntity ? `<b>Đối tượng: {pEntity}</b><br/>` : "";
            content = content
                .replace(/{pTitle}/gi, objHeader.pTitle)
                .replace(/{pSubsidiary}/gi, esXml(objHeader.pSubsidiary))
                .replace(/{pSubsidiaryAddress}/gi, esXml(objHeader.pSubsidiaryAddress))
                .replace(/{pDatefrom}/gi, objHeader.pDatefrom)
                .replace(/{pDateto}/gi, objHeader.pDateto)
                .replace(/{pAccount}/gi, objHeader.pAccount)
                .replace(/{pCurrency}/gi, objHeader.pCurrency)
                .replace(/{pParaEntity}/gi, strEntity)
                .replace(/{pEntity}/gi, esXml(objHeader.pEntity))
                .replace(/{pDebitloan}/gi, objHeader.pDebitloan ? esXml(objHeader.pDebitloan) : '')
                .replace(/{pHeaderTable}/gi, listPrint.table.header)
                .replace(/{pBodyTable}/gi, listPrint.table.body);
            return render.xmlToPdf({xmlString: content});
        }
        
        const reCalculationDauCuoi = (objdetail, reportype, OBJ_REPORT_TYPE) => {
            if (reportype === OBJ_REPORT_TYPE.FT_CN) {
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
        
        const addParamAdd = (urlChitiet, doituong) => {
            urlChitiet = urlChitiet + '&p5=' + encodeURIComponent(doituong);
            return urlChitiet;
        }
        
        const setSublistValueLine = (sublist, colids, list_detail, currencyvalue, reportype, OBJ_REPORT_TYPE, linestart, parameters) => {
            let precision = (!foreignCurrency(currencyvalue)) ? 0 : 2;
            let objdetail, colid, tempvalue, line = linestart, tov;
            let objTotal = {
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
            let urlChitiet = '', urlTemp;
            if (reportype === OBJ_REPORT_TYPE.FT_CN) {
                urlChitiet = url.resolveScript({
                    scriptId: 'customscript_scv_sl_rp_vas_dt',
                    deploymentId: 'customdeploy_scv_sl_rp_vas_dt',
                    returnExternalUrl: false
                });
                let urlChitietArr = urlChitiet.split('&');
                urlChitiet = urlChitietArr[0] + '&' + urlChitietArr[1];// + '&' + urlChitietArr[2];
                urlChitiet = addParam(parameters, urlChitiet, '1');
            }
            let netnoco = parameters.custpage_netnoco;
            for (let i in list_detail) {
                objdetail = list_detail[i];
                if (netnoco === 'T') {
                    reCalculationDauCuoi(objdetail, reportype, OBJ_REPORT_TYPE);
                }
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
                
                for (let n in colids) {
                    colid = colids[n].id;
                    tempvalue = objdetail[colid];
                    if (!!tempvalue || tempvalue === 0) {
                        tov = typeof tempvalue;
                        if (tov === 'number') {
                            tempvalue = parseFloat(tempvalue);
                            tempvalue = colid.endsWith('vnd') ? tempvalue.toFixed(0) : tempvalue.toFixed(precision);
                        } else if (tov === 'string') {
                            tempvalue = tempvalue.substring(0, 300);
                        }
                        if (colid === 'soct') {
                            tempvalue = '<a href=/app/accounting/transactions/transaction.nl?id=' + objdetail.id + ' target=_blank>' + tempvalue + '</a>';
                        }
                        sublist.setSublistValue({id: colid, line: line, value: tempvalue});
                    }
                }
                if (reportype === OBJ_REPORT_TYPE.FT_CN && !!objdetail.doituong) {
                    let valueLink = objdetail.doituong;
                    if (valueLink.length > 140) {
                        valueLink = valueLink.substring(0, 140);
                    }
                    urlTemp = addParamAdd(urlChitiet, valueLink.substring(0, 20));
                    urlTemp = urlTemp.substring(0, 146);
                    tempvalue = '<a href=' + urlTemp + '>' + valueLink + '</a>';
                    sublist.setSublistValue({id: 'doituong', line: line, value: tempvalue});
                }
                line++;
            }
            for (let n in colids) {
                colid = colids[n].id;
                tempvalue = objTotal[colid];
                if (!!tempvalue) {
                    tov = typeof tempvalue;
                    if (tov === 'number') {
                        tempvalue = parseFloat(tempvalue);
                        tempvalue = colid.endsWith('vnd') ? tempvalue.toFixed(0) : tempvalue.toFixed(precision);
                    }
                    sublist.setSublistValue({id: colid, line: line, value: tempvalue});
                }
                if (colid === 'diengiai' || colid === 'doituong') {
                    tempvalue = 'Tổng cộng';
                    sublist.setSublistValue({id: colid, line: line, value: tempvalue});
                }
            }
            line++;
            
            return line;
        }
        
        const makeRowPhatsinh = (objdetail, currencyvalue, reportype, OBJ_REPORT_TYPE) => {
            let rowData = '';
            if (!foreignCurrency(currencyvalue)) {
                if (reportype === OBJ_REPORT_TYPE.FT_CN) {
                    rowData = '<Row ss:AutoFitHeight="0" ss:Height="36">' +
                        '<Cell ss:StyleID="s90"><Data ss:Type="String">' + (objdetail.subsidiarynohierarchy || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s90"><Data ss:Type="String">' + (objdetail.doituong || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s93"><Data ss:Type="Number">' + (objdetail.sodudaunovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s93"><Data ss:Type="Number">' + (objdetail.sodudaucovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s93"><Data ss:Type="Number">' + (objdetail.phatsinhnovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s93"><Data ss:Type="Number">' + (objdetail.phatsinhcovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s93"><Data ss:Type="Number">' + (objdetail.soducuoinovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s93"><Data ss:Type="Number">' + (objdetail.soducuoicovnd || 0) + '</Data></Cell>' +
                        '</Row>';
                } else if (reportype === OBJ_REPORT_TYPE.FT_SNKC) {
                    rowData = '<Row ss:AutoFitHeight="0" ss:Height="36">' +
                        '<Cell ss:StyleID="s97"><Data ss:Type="String">' + (objdetail.trandate || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s97"><Data ss:Type="String">' + (objdetail.tranid || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s97"><Data ss:Type="String">' + (objdetail.ngayct || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s97"><Data ss:Type="String">' + (objdetail.soct || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s97"><Data ss:Type="String">' + (objdetail.diengiai || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s97"><Data ss:Type="String">' + (objdetail.accnumber || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s100"><Data ss:Type="Number">' + (objdetail.phatsinhnovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s100"><Data ss:Type="Number">' + (objdetail.phatsinhcovnd || 0) + '</Data></Cell>' +
                        '</Row>';
                }
            } else {
                if (reportype === OBJ_REPORT_TYPE.FT_CN) {
                    rowData = '<Row ss:AutoFitHeight="0" ss:Height="36">' +
                        '<Cell ss:StyleID="s94"><Data ss:Type="String">' + (objdetail.subsidiarynohierarchy || '') + '</Data></Cell>' +
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
                } else if (reportype === OBJ_REPORT_TYPE.FT_SNKC) {
                    rowData = '<Row ss:AutoFitHeight="0" ss:Height="36">' +
                        '<Cell ss:StyleID="s105"><Data ss:Type="String">' + (objdetail.trandate || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s105"><Data ss:Type="String">' + (objdetail.tranid || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s105"><Data ss:Type="String">' + (objdetail.ngayct || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s105"><Data ss:Type="String">' + (objdetail.soct || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s105"><Data ss:Type="String">' + (objdetail.diengiai || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s105"><Data ss:Type="String">' + (objdetail.accnumber || '') + '</Data></Cell>' +
                        '<Cell ' + (objdetail.tygia ? 'ss:StyleID="s110"><Data ss:Type="Number"' : 'ss:StyleID="s105"><Data ss:Type="String"') + '>' + (objdetail.tygia || '') + '</Data></Cell>' +
                        '<Cell ss:StyleID="s111"><Data ss:Type="Number">' + (objdetail.phatsinhno || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s111"><Data ss:Type="Number">' + (objdetail.phatsinhco || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s112"><Data ss:Type="Number">' + (objdetail.phatsinhnovnd || 0) + '</Data></Cell>' +
                        '<Cell ss:StyleID="s112"><Data ss:Type="Number">' + (objdetail.phatsinhcovnd || 0) + '</Data></Cell>' +
                        '</Row>';
                }
            }
            return rowData;
        }
        
        const exportExcel = (response, parameters, list_detail, currencyvalue, reportype, OBJ_REPORT_TYPE, linestart) => {
            let pRow = '';
            let objdetail, line = linestart;
            let objTotal = {
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
            let netnoco = parameters.custpage_netnoco;
            for (let i in list_detail) {
                objdetail = list_detail[i];
                if (netnoco === 'T') {
                    reCalculationDauCuoi(objdetail, reportype, OBJ_REPORT_TYPE);
                }
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
                
                pRow = pRow + makeRowPhatsinh(objdetail, currencyvalue, reportype, OBJ_REPORT_TYPE);
                //Add data output to render pdf
                (isPrint === "T") && addDataToRenderPdf(objdetail, currencyvalue, reportype, OBJ_REPORT_TYPE)
                line++;
            }
            // Add value Total
            (isPrint === "T") && addRowEndTable(objTotal, currencyvalue, reportype, OBJ_REPORT_TYPE);
            
            return {pRow: pRow, line: line, objTotal: objTotal};
        }
        
        const createForm = (_params, master, subsidiary, account, account_parent) => {
            let form = serverWidget.createForm({title: "VAS Sổ nhật ký chung, Tổng hợp CN không TK"});
            form.clientScriptModulePath = '../cs/scv_cs_sl_rp_vas_fl.js';
            form.addButton({id: 'custpage_bt_search', label: 'Search', functionName: 'searchReport()'});
            form.addButton({id: 'custpage_bt_export', label: 'Export', functionName: 'exportReport()'});
            form.addButton({id: 'custpage_bt_print', label: 'Print', functionName: 'onPrint()'});
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
                {value: OBJ_REPORT_TYPE.FT_SNKC, label: 'Sổ nhật ký chung'},
                {value: OBJ_REPORT_TYPE.FT_CN, label: 'Tổng hợp CN (Không Tài khoản)'}
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
            
            let fieldNetnoco = form.addField({
                id: 'custpage_netnoco',
                type: serverWidget.FieldType.CHECKBOX,
                label: 'Net Nợ, Có',
                container: container
            });
            fieldNetnoco.defaultValue = _params.custpage_netnoco || 'F';
            
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
            if (parameters.custpage_reportype === 'customsearch_scv_vas_snkcfl') {
                f.push(search.createFilter({
                    name: 'trandate',
                    operator: search.Operator.ONORAFTER,
                    values: date_dauky
                }));
            }
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
            let sl_ct = 'custpage_sl_fl';
            let OBJ_REPORT_TYPE = {
                FT_CN: "customsearch_scv_vas_cnfl",
                FT_SNKC: "customsearch_scv_vas_snkcfl"
            };
            
            let col_sl_cn = [
                {
                    id: 'subsidiarynohierarchy',
                    label: 'Công ty/chi nhánh',
                    type: 'text',
                    display: serverWidget.FieldDisplayType.INLINE
                },
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
                {
                    id: 'subsidiarynohierarchy',
                    label: 'Công ty/chi nhánh',
                    type: 'text',
                    display: serverWidget.FieldDisplayType.INLINE
                },
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
            
            let col_ss_cn = [['subsidiarynohierarchy', 0], ['doituong', 1], ['sodudauno', 2], ['sodudauco', 3], ['phatsinhno', 4], ['phatsinhco', 5],
                ['soducuoino', 6], ['soducuoico', 7], ['sodudaunovnd', 8], ['sodudaucovnd', 9], ['phatsinhnovnd', 10], ['phatsinhcovnd', 11], ['soducuoinovnd', 12], ['soducuoicovnd', 13]
            ];
            
            let col_sl_snkc = [
                {id: 'trandate', label: 'Date', type: 'date', display: serverWidget.FieldDisplayType.INLINE},
                {id: 'tranid', label: 'Số phiếu', type: 'text', display: serverWidget.FieldDisplayType.INLINE},
                {id: 'ngayct', label: 'Ngày CT', type: 'date', display: serverWidget.FieldDisplayType.INLINE},
                {id: 'soct', label: 'Số CT', type: 'text', display: serverWidget.FieldDisplayType.INLINE},
                {
                    id: 'ordertype_text',
                    label: 'Order Type',
                    type: 'text',
                    display: serverWidget.FieldDisplayType.INLINE
                },
                {id: 'diengiai', label: 'Diễn Giải', type: 'text', display: serverWidget.FieldDisplayType.INLINE},
                {id: 'accnumber', label: 'Mã tài khoản', type: 'text', display: serverWidget.FieldDisplayType.INLINE},
                {id: 'tygia', label: 'Tỷ giá', type: 'float', display: serverWidget.FieldDisplayType.INLINE},
                {id: 'phatsinhno', label: 'Số dư: Nợ', type: 'float', display: serverWidget.FieldDisplayType.INLINE},
                {id: 'phatsinhco', label: 'Số dư: Có', type: 'float', display: serverWidget.FieldDisplayType.INLINE},
                {
                    id: 'phatsinhnovnd',
                    label: 'Số dư: Nợ (VND)',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                },
                {
                    id: 'phatsinhcovnd',
                    label: 'Số dư: Có (VND)',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
            ];
            
            let col_sl_snkc_nocurrency = [
                {id: 'trandate', label: 'Date', type: 'date', display: serverWidget.FieldDisplayType.INLINE},
                {id: 'tranid', label: 'Số phiếu', type: 'text', display: serverWidget.FieldDisplayType.INLINE},
                {id: 'ngayct', label: 'Ngày CT', type: 'date', display: serverWidget.FieldDisplayType.INLINE},
                {id: 'soct', label: 'Số CT', type: 'text', display: serverWidget.FieldDisplayType.INLINE},
                {
                    id: 'ordertype_text',
                    label: 'Order Type',
                    type: 'text',
                    display: serverWidget.FieldDisplayType.INLINE
                },
                {id: 'diengiai', label: 'Diễn Giải', type: 'text', display: serverWidget.FieldDisplayType.INLINE},
                {id: 'accnumber', label: 'Mã tài khoản', type: 'text', display: serverWidget.FieldDisplayType.INLINE},
                {
                    id: 'phatsinhnovnd',
                    label: 'Số dư: Nợ',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                },
                {
                    id: 'phatsinhcovnd',
                    label: 'Số dư: Có',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
            ];
            
            let col_ss_snkc = [['trandate', 0], ['tranid', 1], ['ngayct', 2], ['soct', 3], ['diengiai', 4], ['accnumber', 5],
                ['tygia', 6], ['phatsinhno', 7], ['phatsinhnovnd', 8], ['phatsinhco', 9], ['phatsinhcovnd', 10], ['id', 11], ['ordertype', 12], ['ordertype_text', 12, 'sltext']
            ];
            
            return {
                field_select: field_select, sl_ct: sl_ct, OBJ_REPORT_TYPE: OBJ_REPORT_TYPE,
                col_sl_cn: col_sl_cn, col_sl_cn_nocurrency: col_sl_cn_nocurrency, col_ss_cn: col_ss_cn,
                col_sl_snkc: col_sl_snkc, col_sl_snkc_nocurrency: col_sl_snkc_nocurrency, col_ss_snkc: col_ss_snkc
            }
        }
        
        const foreignCurrency = (value) => {
            return !!value && value !== '1';
        }
        
        return {
            onRequest
        };
        
    });
