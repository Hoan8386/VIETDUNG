/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */

define(['N/format', 'N/file', 'N/runtime', 'N/search', 'N/ui/serverWidget', 'N/url', '../lib/scv_lib_function.js', '../common/scv_common_info', '../lib/scv_lib_report.js', 'N/xml', 'N/render', '../lib/scv_lib_custom_form.js'],
    function (format, file, runtime, search, serverWidget, url, lbf, commonInfo, lrp, xml, render, libCustomForm) {

        function onRequest(context) {
            let request = context.request;
            let response = context.response;
            let parameters = request.parameters;
            let action = parameters.action;
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
            let isCnNt = false;
            let isCdps = false;
            let isVaytt = false;
            let namefile = parameters.namefile;
            let isPrint = parameters.isPrint;
            let master = getSublistColMaster();
            let isearch = parameters.isearch;
            let isgetdata = parameters.isgetdata;
            // let isRun = true;
            let objData = [];
            let reportTypeNt = reportype;
            let OBJ_REPORT_TYPE = master.OBJ_REPORT_TYPE;
            let OBJ_REPORT_TYPE_DETAIL = master.OBJ_REPORT_TYPE_DETAIL;

            let excelFile = null;
            // let excelFile = getExcelFile(reportype, currencyvalue, OBJ_REPORT_TYPE);

            if (reportype === OBJ_REPORT_TYPE.TT_CN_NT) {
                excelFile = 'scv_rp_vas_thcn_nt.xlsx'
            } else if (reportype === OBJ_REPORT_TYPE.TT_CN && !currencyvalue){
                excelFile = 'scv_rp_vas_thcn_nocurrency.xlsx';
            } else if ((reportype === OBJ_REPORT_TYPE.TT_CN || reportype === OBJ_REPORT_TYPE.TT_VAY) && currencyvalue) {
                excelFile = 'scv_rp_vas_thcn_currency.xlsx'
            } else if (reportype === OBJ_REPORT_TYPE.TT_CDPS && !currencyvalue) {
                excelFile = 'scv_rp_vas_thcn_cdps_nocurrency.xlsx';
            } else if (reportype === OBJ_REPORT_TYPE.TT_CDPS && currencyvalue) {
                excelFile = 'scv_rp_vas_thcn_cdps_currency.xlsx';
            } else if (reportype === OBJ_REPORT_TYPE.TT_VAY && !currencyvalue) {
                excelFile = 'scv_rp_vas_thcn_vay_nocurrency.xlsx';
            }

            if (!!account) {
                account = account.split(',');
            }
            if (!!account_parent) {
                account_parent = account_parent.split(',');
            }

            let list_detail = [], col_detail = null;
            let colid = [];
            const isForeign = foreignCurrency(currencyvalue);
            isCnNt = reportype === OBJ_REPORT_TYPE.TT_CN_NT;

            switch (reportype) {
                case OBJ_REPORT_TYPE.TT_CDPS:
                    colid = isForeign ? master.col_sl_cdps : master.col_sl_cdps_nocurrency;
                    col_detail = master.col_ss_cdps;
                    isCdps = true;
                    break;

                case OBJ_REPORT_TYPE.TT_CN:
                    colid = isForeign ? master.col_sl_cn : master.col_sl_cn_nocurrency;
                    col_detail = master.col_ss_cn;
                    break;

                case OBJ_REPORT_TYPE.TT_CN_NT:
                    colid = master.col_sl_cn;
                    col_detail = master.col_ss_cn;
                    currencyvalue = currencyvalue ? currencyvalue : '';
                    reportype = OBJ_REPORT_TYPE.TT_CN;
                    break;

                case OBJ_REPORT_TYPE.TT_VAY:
                    colid = isForeign ? master.col_sl_vay : master.col_sl_vay_nocurrency;
                    col_detail = master.col_ss_vay;
                    isVaytt = true;
                    break;

                default:
                    colid = [];
                    col_detail = [];
                    break;
            }

            isearch = (!date_dauky || !date_cuoiky || !parameters.custpage_subsidiary) ? 'F' : isearch;
            let fieldgroup = {account: 'account', account_text: 'account_text'};
            let list_acc = [];

            if (isearch === "T") {
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
                    let totalRecord = lrp.doSearchSql(list_acc_leaf, pageinfo, sql_acc_leaf, params_acc_leaf);
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
                    formula: "CASE WHEN TO_NUMBER(TO_CHAR({trandate}, 'YYYYMMDD')) < " + datefromfm +
                        " THEN CASE WHEN {currency} != 'VND' THEN {debitfxamount} ELSE 0 END ELSE 0 END"
                };
                let col2 = {
                    name: 'formulanumeric', summary: search.Summary.SUM, label: 'Số dư đầu Có Ngoại tệ', type: 'float',
                    formula: "CASE WHEN TO_NUMBER(TO_CHAR({trandate}, 'YYYYMMDD')) < " + datefromfm +
                        " THEN CASE WHEN {currency} != 'VND' THEN {creditfxamount} ELSE 0 END ELSE 0 END"
                };
                let col3 = {
                    name: 'formulanumeric',
                    summary: search.Summary.SUM,
                    label: 'Số phát sinh Nợ Ngoại tệ',
                    type: 'float',
                    formula: "case when TO_NUMBER(TO_CHAR({trandate},'YYYYMMDD')) >= " + datefromfm + " then CASE WHEN {currency} != 'VND' THEN {debitfxamount} ELSE 0 END else 0 end"
                };
                let col4 = {
                    name: 'formulanumeric',
                    summary: search.Summary.SUM,
                    label: 'Số phát sinh Có Ngoại tệ',
                    type: 'float',
                    formula: "case when TO_NUMBER(TO_CHAR({trandate},'YYYYMMDD')) >= " + datefromfm + " then CASE WHEN {currency} != 'VND' THEN {creditfxamount} ELSE 0 END else 0 end"
                };
                let col5 = {
                    name: 'formulanumeric', summary: search.Summary.SUM, label: 'Số dư cuối Nợ Ngoại tệ', type: 'float',
                    formula: "CASE WHEN {currency} != 'VND' THEN {debitfxamount} ELSE 0 END"
                };
                let col6 = {
                    name: 'formulanumeric', summary: search.Summary.SUM, label: 'Số dư cuối Có Ngoại tệ', type: 'float',
                    formula: "CASE WHEN {currency} != 'VND' THEN {creditfxamount} ELSE 0 END"
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
                lrp.doSearchSSMore(reportype, 1000, list_detail, filters_detail, col_detail, col_add, null);
                let pageinfo = null, params_acc = [];

                let sql_acc = "select acc.id, acc.acctnumber, acc.accountsearchdisplaynamecopy accountsearchdisplayname, acc.custrecord_scv_cct_acc_parent, acc.custrecord_scv_cct_acc_parent_name, acc.custrecord_scv_acc_level from account acc where acc.acctnumber is not null";
                lrp.doSearchSql(list_acc, pageinfo, sql_acc, params_acc);
                objData = setSublistValueLine(colid, list_detail, currencyvalue, fieldgroup, list_acc, not_level, acc_level, reportype, reportTypeNt, OBJ_REPORT_TYPE, OBJ_REPORT_TYPE_DETAIL, 0, parameters);
            }

            if (isgetdata === 'T') {
                response.setHeader({ name: 'Content-Type', value: 'application/json' });
                response.write(JSON.stringify({objData, col: master.col, reportype, currencyValue: parameters.custpage_currencyvalue} || {}));
            } else if (action === 'getUrlTemplate') {
                let objDataHeader = commonInfo.getInforReport({subsidiary: subsidiary});
                objDataHeader = {
                    ...objDataHeader,
                    date_dauky: parameters.date_dauky,
                    date_cuoiky: parameters.date_cuoiky
                }
                response.write(JSON.stringify({
                    urlTemplate: commonInfo.getUrlFileTemplate('EXCEL', excelFile),
                    objDataHeader
                }))
            } else if (request.method === 'GET') {
                let form = onCreateFormUI(parameters, master, subsidiary, account, account_parent);
                libCustomForm.addFieldIncludeDxGrid(form);
                libCustomForm.addFieldScriptData(form, {
                    isearch: isearch,
                    objData: objData,
                    isCnNt: isCnNt,
                    isCdps: isCdps,
                    isVay: isVaytt,
                    date_dauky: date_dauky,
                    date_cuoiky: date_cuoiky,
                    currencyValue: currencyvalue
                });
                libCustomForm.addFieldDxGridResult(form, "scvTabsContainer");
                response.writePage(form);
            }
        }

        function reCalculationDauCuoi(objdetail, reportype, OBJ_REPORT_TYPE) {
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

        function plusTotal(objTotal, objdetail) {
            objTotal.sodudauno += (objdetail.sodudauno || 0) * 1;
            objTotal.sodudauco += (objdetail.sodudauco || 0) * 1;
            objTotal.phatsinhno += Number(objdetail.phatsinhno || 0);
            objTotal.phatsinhco += Number(objdetail.phatsinhco || 0);
            objTotal.soducuoino += (objdetail.soducuoino || 0) * 1;
            objTotal.soducuoico += (objdetail.soducuoico || 0) * 1;
            objTotal.sodudaunovnd += (objdetail.sodudaunovnd || 0) * 1;
            objTotal.sodudaucovnd += (objdetail.sodudaucovnd || 0) * 1;
            objTotal.phatsinhnovnd += Number(objdetail.phatsinhnovnd || 0);
            objTotal.phatsinhcovnd += Number(objdetail.phatsinhcovnd || 0);
            objTotal.soducuoinovnd += (objdetail.soducuoinovnd || 0) * 1;
            objTotal.soducuoicovnd += (objdetail.soducuoicovnd || 0) * 1;
        }

        function initObjTotal() {
            return {
                sodudauno: 0,
                sodudauco: 0,
                phatsinhno: 0,
                phatsinhco: 0,
                soducuoino: 0,
                soducuoico: 0
                ,
                sodudaunovnd: 0,
                sodudaucovnd: 0,
                phatsinhnovnd: 0,
                phatsinhcovnd: 0,
                soducuoinovnd: 0,
                soducuoicovnd: 0
            };
        }

        function isContainValue(objdetail) {
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

        function buildBaseDetailUrl(baseUrl, parameters, detailReportType) {
            let url = baseUrl;
            url += '&custpage_reportype=' + detailReportType;
            url += '&custpage_subsidiary=' + (parameters.custpage_subsidiary || '');
            url += '&custpage_date_dauky=' + (parameters.custpage_date_dauky || '');
            url += '&custpage_date_cuoiky=' + (parameters.custpage_date_cuoiky || '');
            url += '&custpage_account_parent=' + (parameters.custpage_account_parent || '');
            if (parameters.custpage_currencyvalue) {
                url += '&custpage_currencyvalue=' + parameters.custpage_currencyvalue;
            }
            return url;
        }

        function appendEntityParam(baseUrl, entity) {
            let url = baseUrl;
            if (entity) {
                url += '&custpage_entity=' + encodeURIComponent(entity);
            }
            return url;
        }

        function createDetailUrl(objdetail, list_acc, reportype, OBJ_REPORT_TYPE, isparent, base_url) {
            if (!base_url) return '';
            let urlTemp = '';
            let linkText = '';
            let finalHtml = '';
            if (reportype === OBJ_REPORT_TYPE.TT_CN && !isparent) {
                if (objdetail.doituong) {
                    linkText = objdetail.doituong;
                    let tempBaseUrl = base_url;
                    urlTemp = appendEntityParam(tempBaseUrl, objdetail.doituong);
                }
            } else if (reportype === OBJ_REPORT_TYPE.TT_CDPS) {
                linkText = objdetail.accnumber;
                urlTemp = base_url + '&custpage_account=' + objdetail.account;
            }

            if (urlTemp && linkText) {
                finalHtml = '<a href="' + urlTemp + '&isearch=T" target="_blank">' + linkText + '</a>';
            }

            return finalHtml;
        }

        function processCongNoReport(list_detail, list_acc, reportype, OBJ_REPORT_TYPE, OBJ_REPORT_TYPE_DETAIL, parameters) {
            let objdata = [];
            let urlChitiet = '';
            let reportTypeNt = parameters.custpage_reportype;

            if (reportype === OBJ_REPORT_TYPE.TT_CN || reportype === OBJ_REPORT_TYPE.TT_CN_NT) {
                let baseUrl = url.resolveScript({
                    scriptId: 'customscript_scv_sl_rp_vas_dt_v3',
                    deploymentId: 'customdeploy_scv_sl_rp_vas_dt_v3',
                    returnExternalUrl: false
                });
                let detailReportType = '';
                if (reportTypeNt === OBJ_REPORT_TYPE.TT_CN) {
                    detailReportType = OBJ_REPORT_TYPE_DETAIL.CT_CN;
                } else if (reportTypeNt === OBJ_REPORT_TYPE.TT_CN_NT) {
                    detailReportType = OBJ_REPORT_TYPE_DETAIL.CT_CN_NT;
                } else if (reportype === OBJ_REPORT_TYPE.TT_CDPS) {
                    detailReportType = OBJ_REPORT_TYPE_DETAIL.CT_CDPS;
                }
                urlChitiet = buildBaseDetailUrl(baseUrl, parameters, detailReportType);
            }

            let dataTree = {};

            for (const detail of list_detail) {
                if (!isContainValue(detail)) continue;

                let currentDetail = { ...detail };
                if (parameters.custpage_netnoco === 'T') {
                    reCalculationDauCuoi(currentDetail, reportype, OBJ_REPORT_TYPE);
                }

                const phanloai = currentDetail.phanloai || 'Chưa phân loại';
                const doituong = currentDetail.doituong || 'Chưa có đối tượng';

                if (!dataTree[phanloai]) {
                    dataTree[phanloai] = { total: initObjTotal(), doituong_map: {} };
                }
                if (!dataTree[phanloai].doituong_map[doituong]) {
                    dataTree[phanloai].doituong_map[doituong] = { total: initObjTotal(), accounts: [] };
                }

                let acc_parent = list_acc.find(e => e.id == currentDetail.account);
                currentDetail.accnumber = acc_parent ? acc_parent.acctnumber : '';
                currentDetail.accname = acc_parent ? acc_parent.accountsearchdisplayname : '';
                currentDetail.url_chitiet = createDetailUrl(currentDetail, list_acc, reportype, OBJ_REPORT_TYPE, false, urlChitiet);

                dataTree[phanloai].doituong_map[doituong].accounts.push(currentDetail);
                plusTotal(dataTree[phanloai].doituong_map[doituong].total, currentDetail);
            }

            let objTotalAll = initObjTotal();
            objTotalAll.doituong = 'TỔNG CỘNG';
            objTotalAll.lineName = 'total';
            objTotalAll.typebold = '2';

            const sortedPhanLoaiKeys = Object.keys(dataTree).sort();
            for (const phanloaiKey of sortedPhanLoaiKeys) {
                const phanloaiNode = dataTree[phanloaiKey];
                phanloaiNode.total = initObjTotal();

                const sortedDoiTuongKeys = Object.keys(phanloaiNode.doituong_map).sort();
                for (const doituongKey of sortedDoiTuongKeys) {
                    const doituongNode = phanloaiNode.doituong_map[doituongKey];

                    if (parameters.custpage_netnoco === 'T') {
                        reCalculationDauCuoi(doituongNode.total, reportype, OBJ_REPORT_TYPE);
                    }

                    plusTotal(phanloaiNode.total, doituongNode.total);
                }

                plusTotal(objTotalAll, phanloaiNode.total);
            }

            objdata.push(objTotalAll);

            for (const phanloaiKey of sortedPhanLoaiKeys) {
                const phanloaiNode = dataTree[phanloaiKey];
                let phanloaiRow = phanloaiNode.total;
                phanloaiRow.doituong = phanloaiKey;
                phanloaiRow.typebold = '2';
                phanloaiRow.lineName = 'pl';
                phanloaiRow.url_chitiet = createDetailUrl(phanloaiRow, list_acc, reportype, OBJ_REPORT_TYPE, true, urlChitiet);
                objdata.push(phanloaiRow);

                const sortedDoiTuongKeys = Object.keys(phanloaiNode.doituong_map).sort();
                for (const doituongKey of sortedDoiTuongKeys) {
                    const doituongNode = phanloaiNode.doituong_map[doituongKey];
                    let doituongRow = doituongNode.total;
                    const doituongUrlHtml = createDetailUrl({ doituong: doituongKey }, list_acc, reportype, OBJ_REPORT_TYPE, false, urlChitiet);
                    doituongRow.doituong = doituongUrlHtml ? doituongUrlHtml : doituongKey;
                    doituongRow.typebold = '2';
                    objdata.push(doituongRow);

                    for (const accountRow of doituongNode.accounts) {
                        accountRow.typebold = '0';
                        accountRow.doituong = '';
                        objdata.push(accountRow);
                    }
                }
            }

            objdata.forEach((row, index) => row.line = index);
            return objdata.filter(item => item);
        }

        function setSublistValueLine(colids, list_detail, currencyvalue, fieldgroup, list_acc, not_level, acc_level, reportype, reportTypeNt, OBJ_REPORT_TYPE, OBJ_REPORT_TYPE_DETAIL, linestart, parameters) {
            const isCongNoReport = reportype === OBJ_REPORT_TYPE.TT_CN || reportTypeNt === OBJ_REPORT_TYPE.TT_CN_NT;
            if (isCongNoReport) {
                return processCongNoReport(list_detail, list_acc, reportype, OBJ_REPORT_TYPE, OBJ_REPORT_TYPE_DETAIL, parameters);
            }

            let objdata = [];
            let line = 0;
            let list_total = {};
            let account_pre = '', acc_parent_num_pre = '';
            let acc_parent, acc_parent_num, acc_parent_name, acc_lv, objTotal;

            let urlChitiet = '';
            if (reportype === OBJ_REPORT_TYPE.TT_CN || reportype === OBJ_REPORT_TYPE.TT_CN_NT || reportype === OBJ_REPORT_TYPE.TT_CDPS) {
                let baseUrl = url.resolveScript({
                    scriptId: 'customscript_scv_sl_rp_vas_dt_v3',
                    deploymentId: 'customdeploy_scv_sl_rp_vas_dt_v3',
                    returnExternalUrl: false
                });
                let detailReportType = '';
                if (reportype === OBJ_REPORT_TYPE.TT_CN && reportTypeNt !== OBJ_REPORT_TYPE.TT_CN_NT) {
                    detailReportType = OBJ_REPORT_TYPE_DETAIL.CT_CN;
                } else if (reportype !== OBJ_REPORT_TYPE.TT_CN_NT && reportTypeNt === OBJ_REPORT_TYPE.TT_CN_NT) {
                    detailReportType = OBJ_REPORT_TYPE_DETAIL.CT_CN_NT;
                } else if (reportype === OBJ_REPORT_TYPE.TT_CDPS) {
                    detailReportType = OBJ_REPORT_TYPE_DETAIL.CT_CDPS;
                }
                urlChitiet = buildBaseDetailUrl(baseUrl, parameters, detailReportType);
            }

            let objTotalAll = initObjTotal();
            objTotalAll.accnumber = '';
            objTotalAll.accname = 'Total';
            objTotalAll.typebold = '2';
            objTotalAll.line = line;
            objdata[line] = objTotalAll;
            line++;

            let netnoco = parameters.custpage_netnoco;

            for (let i in list_detail) {
                let objdetail = { ...list_detail[i] };
                reCalculationDauCuoi(objdetail, reportype, OBJ_REPORT_TYPE);
                plusTotal(objTotalAll, objdetail);

                let account = objdetail[fieldgroup.account];
                acc_parent = list_acc.find(e => String(e.id) === String(objdetail.account));
                if (!acc_parent) {
                    if (isContainValue(objdetail)) {
                        acc_parent = { acctnumber: '-None-', accountsearchdisplayname: '-None-' };
                    } else {
                        continue;
                    }
                }
                objdetail.accnumber = acc_parent.acctnumber;
                objdetail.accname = acc_parent.accountsearchdisplayname;

                if (not_level !== 'T') {
                    if (account != account_pre && !!account_pre) {
                        acc_lv = -1;
                        if (!!acc_parent_num_pre) {
                            acc_lv = acc_parent_num_pre.length;
                            if (!!acc_level && acc_level < acc_lv) acc_lv = acc_level;
                            for (let iacc = 0; iacc < acc_lv; iacc++) {
                                let parent_acc_num = acc_parent_num_pre[iacc];
                                if (netnoco === 'T') reCalculationDauCuoi(list_total[parent_acc_num], reportype, OBJ_REPORT_TYPE);
                                list_total[parent_acc_num].url_chitiet = createDetailUrl(list_total[parent_acc_num], list_acc, reportype, OBJ_REPORT_TYPE, true, urlChitiet);
                            }
                        }
                    }
                    acc_parent_num = '', acc_parent_name = '', acc_lv = -1;
                    if (!!acc_parent && !!acc_parent.custrecord_scv_cct_acc_parent) {
                        acc_parent_num = acc_parent.custrecord_scv_cct_acc_parent.split('//');
                        acc_parent_name = acc_parent.custrecord_scv_cct_acc_parent_name.split('//');
                        acc_lv = acc_parent_num.length;
                        if (!!acc_level && acc_level < acc_lv) acc_lv = acc_level;

                        for (let iacc = 0; iacc < acc_lv; iacc++) {
                            objTotal = list_total[acc_parent_num[iacc]];
                            if (!objTotal) {
                                objTotal = initObjTotal();
                                objTotal.accnumber = acc_parent_num[iacc];
                                objTotal.accname = acc_parent_name[iacc];
                                objTotal.line = line;
                                objTotal.typebold = '2';
                                objdata[line] = objTotal;
                                list_total[acc_parent_num[iacc]] = objTotal;
                                line++;
                            }
                            plusTotal(objTotal, objdetail);
                            if (netnoco === 'T') reCalculationDauCuoi(objTotal, reportype, OBJ_REPORT_TYPE);
                        }
                    }

                    if (!acc_level || acc_level > acc_lv) {
                        const totalKey = reportype === OBJ_REPORT_TYPE.TT_VAY
                            ? acc_parent.acctnumber + '::' + (objdetail.kheuocvay || '')
                            : acc_parent.acctnumber;
                        objTotal = list_total[totalKey];
                        if (!objTotal) {
                            objTotal = initObjTotal();
                            objTotal.accnumber = acc_parent.acctnumber;
                            objTotal.accname = acc_parent.accountsearchdisplayname;
                            if (reportype === OBJ_REPORT_TYPE.TT_VAY) {
                                objTotal.kheuocvay = objdetail.kheuocvay;
                                objTotal.kheuocvay_text = objdetail.kheuocvay_text || objdetail.kheuocvay || '';
                            }
                            objTotal.line = line;
                            objdata[line] = objTotal;
                            list_total[totalKey] = objTotal;
                            line++;
                        }
                        plusTotal(objTotal, objdetail);
                        if (netnoco === 'T') reCalculationDauCuoi(objTotal, reportype, OBJ_REPORT_TYPE);
                        objTotal.account = objdetail.account;
                        objTotal.url_chitiet = createDetailUrl(objTotal, list_acc, reportype, OBJ_REPORT_TYPE, false, urlChitiet);

                        // if (!acc_level) {
                        //     objdetail.line = line;
                        //     objdetail.url_chitiet = createDetailUrl(objdetail, list_acc, reportype, OBJ_REPORT_TYPE, false, urlChitiet);
                        //     objdata[line] = objdetail;
                        //     line++;
                        // }
                    }
                } else {
                    objdetail.line = line;
                    objdetail.url_chitiet = createDetailUrl(objdetail, list_acc, reportype, OBJ_REPORT_TYPE, false, urlChitiet);
                    objdata[line] = objdetail;
                    line++;
                }
                account_pre = account;
                acc_parent_num_pre = acc_parent_num;
            }
            acc_lv = -1;
            if (!!acc_parent_num_pre) {
                acc_lv = acc_parent_num_pre.length;
                if (!!acc_level && acc_level < acc_lv) acc_lv = acc_level;
                for (let iacc = 0; iacc < acc_lv; iacc++) {
                    let parent_acc_num = acc_parent_num_pre[iacc];
                    if (netnoco === 'T') reCalculationDauCuoi(list_total[parent_acc_num], reportype, OBJ_REPORT_TYPE);
                    list_total[parent_acc_num].url_chitiet = createDetailUrl(list_total[parent_acc_num], list_acc, reportype, OBJ_REPORT_TYPE, true, urlChitiet);
                }
            }

            // if (netnoco === 'T') {
            //     reCalculationDauCuoi(objTotalAll, reportype, OBJ_REPORT_TYPE);
            // }

            return objdata.filter(item => item);
        }

        function foreignCurrency(value) {
            return !!value && value !== '1';
        }

        function onCreateFormUI(_params, master, subsidiary, account, account_parent) {
            let form = serverWidget.createForm({title: "Tổng hợp công nợ"});
            form.clientScriptModulePath = '../cs/scv_cs_sl_rp_vas_tt_v3.js';
            form.addButton({id: 'custpage_bt_search', label: 'Search', functionName: 'searchReport()'});
            form.addButton({id: 'custpage_bt_export', label: 'Export', functionName: 'exportReport()'});
            //form.addButton({id: 'custpage_bt_export_detail', label: 'Export Detail', functionName: 'exportReportDetail()'});
            let container = 'fieldgroup_dc_main';
            form.addFieldGroup({id: container, label: 'Criteria'});
            // Pin header sublist
            lbf.pinHeaderSublist(form);

            let custpage_reportype = form.addField({
                id: 'custpage_reportype',
                type: serverWidget.FieldType.SELECT,
                label: 'Report Type',
                container: container
            });
            custpage_reportype.isMandatory = true;
            let OBJ_REPORT_TYPE = master.OBJ_REPORT_TYPE;
            let listReport = [
                {value: OBJ_REPORT_TYPE.TT_CDPS, label: 'Cân đối phát sinh'},
                {value: OBJ_REPORT_TYPE.TT_CN, label: 'Công nợ'},
                {value: OBJ_REPORT_TYPE.TT_CN_NT, label: 'Công nợ ngoại tệ'},
                {value: OBJ_REPORT_TYPE.TT_VAY, label: 'Vay, cho vay, gửi tiết kiệm'}
            ];
            lrp.addSelecttionFrList(custpage_reportype, _params.custpage_reportype, listReport, false);

            let custpage_subsidiary = form.addField({
                id: 'custpage_subsidiary',
                type: serverWidget.FieldType.MULTISELECT,
                label: 'Subsidiary',
                container: container
            });
            custpage_subsidiary.isMandatory = true;
            lrp.addSelectSubsidiary(custpage_subsidiary, subsidiary)

            let custpage_order_type = form.addField({
                id: 'custpage_order_type',
                type: serverWidget.FieldType.SELECT,
                label: 'Order Type',
                container: container,
                source: 'customrecord_scv_order_type'
            });
            custpage_order_type.defaultValue = _params.custpage_order_type;

            let custpage_date_dauky = form.addField({
                id: 'custpage_date_dauky',
                type: serverWidget.FieldType.DATE,
                label: 'From Date',

                container: container
            }).updateLayoutType({layoutType: serverWidget.FieldLayoutType.STARTROW});
            custpage_date_dauky.isMandatory = true;

            let custpage_date_cuoiky = form.addField({
                id: 'custpage_date_cuoiky',
                type: serverWidget.FieldType.DATE,
                label: 'To Date',
                container: container
            }).updateLayoutType({layoutType: serverWidget.FieldLayoutType.ENDROW});
            custpage_date_cuoiky.isMandatory = true;

            custpage_date_dauky.defaultValue = getFromDate(_params.custpage_date_dauky);
            custpage_date_cuoiky.defaultValue = getToDate(_params.custpage_date_cuoiky);

            let custpage_exportbc = form.addField({
                id: 'custpage_exportbc', type: serverWidget.FieldType.SELECT,
                label: 'Export?', container: container
            });
            addExportBC(custpage_exportbc, _params.custpage_exportbc);

            let c = ['internalid', {name: 'formulatext', formula: "{number} || ' ' || {name}", sort: 'ASC'}];
            let f = [['issummary', 'is', 'T'], 'and', ['custrecord_scv_acc_limit_rp', 'is', 'F']];
            let custpage_account_parent = form.addField({
                id: 'custpage_account_parent', type: serverWidget.FieldType.MULTISELECT,
                label: 'Account Summary', container: 'fieldgroup_dc_main'
            });
            lrp.addSelectionMulti(custpage_account_parent, 'account', c, f, true, account_parent);

            let f_acc = [['issummary', 'is', 'F'], 'and', ['custrecord_scv_acc_limit_rp', 'is', 'F']];
            let custpage_account = form.addField({
                id: 'custpage_account',
                type: serverWidget.FieldType.MULTISELECT,
                label: 'Account',
                container: container
            });
            lrp.addSelectionMulti(custpage_account, 'account', c, f_acc, true, account);

            let custpage_netnoco = form.addField({
                id: 'custpage_netnoco',
                type: serverWidget.FieldType.CHECKBOX,
                label: 'Net Nợ, Có',
                container: container
            }).updateLayoutType({layoutType: serverWidget.FieldLayoutType.STARTROW});
            custpage_netnoco.defaultValue = _params.custpage_netnoco || 'F';

            let custpage_not_level = form.addField({
                id: 'custpage_not_level',
                type: serverWidget.FieldType.CHECKBOX,
                label: 'Not Level',
                container: container
            }).updateLayoutType({layoutType: serverWidget.FieldLayoutType.MIDROW});
            custpage_not_level.defaultValue = _params.custpage_not_level || 'F';

            let custpage_acc_level = form.addField({
                id: 'custpage_acc_level',
                type: serverWidget.FieldType.SELECT,
                label: 'Account Level',
                container: container,
                source: 'customlist_scv_acc_level'
            }).updateLayoutType({layoutType: serverWidget.FieldLayoutType.ENDROW});
            custpage_acc_level.defaultValue = _params.custpage_acc_level;

            let custpage_currencyvalue = form.addField({
                id: 'custpage_currencyvalue',
                type: serverWidget.FieldType.SELECT,
                label: 'Currency',
                source: 'currency',
                container: container
            });
            custpage_currencyvalue.defaultValue = _params.custpage_currencyvalue;

            let custpage_classification = form.addField({
                id: 'custpage_classification',
                type: serverWidget.FieldType.SELECT,
                label: 'Class',
                container: container,
                source: 'classification'
            });
            custpage_classification.defaultValue = _params.custpage_classification;

            let custpage_location = form.addField({
                id: 'custpage_location',
                type: serverWidget.FieldType.SELECT,
                label: 'Location',
                container: container,
                source: 'location'
            });
            custpage_location.defaultValue = _params.custpage_location;

            let custpage_department = form.addField({
                id: 'custpage_department',
                type: serverWidget.FieldType.SELECT,
                label: 'Department',
                container: container,
                source: 'department'
            });
            custpage_department.defaultValue = _params.custpage_department;

            let custpage_kmcp = form.addField({
                id: 'custpage_kmcp',
                type: serverWidget.FieldType.SELECT,
                label: 'Mã phí',
                container: container,
                source: 'customrecord_cseg_scv_kmcp'
            });
            custpage_kmcp.defaultValue = _params.custpage_kmcp;

            let custpage_matt = form.addField({
                id: 'custpage_matt',
                type: serverWidget.FieldType.SELECT,
                label: 'Mã thanh toán',
                container: container,
                source: 'customrecord_scv_ma_tt_xnk'
            });
            custpage_matt.defaultValue = _params.custpage_matt;

            let custpage_entity = form.addField({
                id: 'custpage_entity',
                type: serverWidget.FieldType.TEXT,
                label: 'Name',
                container: container
            });
            custpage_entity.defaultValue = _params.custpage_entity;//!!_params.custpage_entity ? encodeURIComponent(_params.custpage_entity) : ''

            let custpage_category = form.addField({
                id: 'custpage_category',
                type: serverWidget.FieldType.MULTISELECT,
                label: 'Phân nhóm',
                container: container,
                source: 'customrecord_scv_entity_category'
            });
            if (_params.custpage_category) {
                custpage_category.defaultValue = _params.custpage_category.split(',');
            }
            // lrp.addSelectionMulti(custpage_category, 'account', c, f_acc, true, account);

            // let sublist = form.addSublist({
            //     id: master.sl_ct,
            //     type: serverWidget.SublistType.LIST,
            //     label: 'KẾT QUẢ'
            // });
            let sublist = '';
            return form
        }

        function addExportBC(custpage_exportbc, exportbc) {
            custpage_exportbc.addSelectOption({value: '', text: ''});
            let listVl = [{value: 'T', text: 'Yes'}, {value: 'F', text: 'No'}];
            let isSelected = false;
            for (let j in listVl) {
                isSelected = false;
                if (exportbc == listVl[j].value.toString()) {
                    isSelected = true;
                }
                custpage_exportbc.addSelectOption({
                    value: listVl[j].value,
                    text: listVl[j].text,
                    isSelected: isSelected
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
            return new Date();
        }

        function pushFiltersDetail(f, parameters, subsidiary, entity, currencyvalue, account, date_dauky, date_cuoiky, currencytext) {
            f.push(search.createFilter({name: 'subsidiary', operator: search.Operator.ANYOF, values: subsidiary}));
            //f.push(search.createFilter({name: 'trandate', operator: search.Operator.ONORAFTER, values: date_dauky}));
            f.push(search.createFilter({name: 'trandate', operator: search.Operator.ONORBEFORE, values: date_cuoiky}));

            if (!!entity) {
                if (entity === '- None -') {
                    f.push(search.createFilter({
                        name: 'formulatext', operator: search.Operator.ISEMPTY, values: '',
                        formula: "case when {type} like 'Journal%' and {account} like '3311%' then {entity} else nvl(nvl(nvl(nvl(nvl({entity}, {customer.companyname}), {vendorline.companyname}),{vendor.entityid}),{name}),{custbody_scv_payee}) end"
                    }));
                } else {
                    //nvl(nvl({customer.entityid}, {vendorline.entityid}), {entity})
                    f.push(search.createFilter({
                        name: 'formulatext', operator: search.Operator.CONTAINS, values: entity,
                        formula: "case when {type} like 'Journal%' and {account} like '3311%' then {entity} else nvl(nvl(nvl(nvl(nvl({entity}, {customer.companyname}), {vendorline.companyname}),{vendor.entityid}),{name}),{custbody_scv_payee}) end"
                    }));
                }
            }
            if (!!currencyvalue) {
                if (currencyvalue == 1) {
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
            if (!!parameters.custpage_matt) {
                f.push(search.createFilter({
                    name: 'custbody_scv_matt_xnk',
                    operator: search.Operator.ANYOF,
                    values: parameters.custpage_matt
                }));
            }
            if (!!parameters.custpage_exportbc) {//log.error('here', parameters.custpage_exportbc);
                f.push(search.createFilter({
                    name: 'formulatext',
                    formula: "case when {custbody_scv_export} = 'T' then 'T' else 'F' end",
                    operator: search.Operator.IS,
                    values: parameters.custpage_exportbc
                }));
                //f.push(search.createFilter({name: 'custbody_scv_export', operator: search.Operator.IS, values: parameters.custpage_exportbc}));
            }
            // log.error('parameters.custpage_category', parameters.custpage_category.split(','))
            if (!!parameters.custpage_category) {
                //const categoryIds = parameters.custpage_category.split(',');
                const formula = ` case when (
                    case when {type} like 'Journal%' and {account} like '3311%' then {vendorline.custentity_scv_vendor_category.id}
                    else nvl(nvl(nvl({vendorline.custentity_scv_vendor_category.id},{vendor.custentity_scv_vendor_category.id}),{customermain.custentity_scv_entity_category.id}),{customer.custentity_scv_entity_category.id})
                    end) in (${parameters.custpage_category}) then '1' else '0' end
                `;
                f.push(search.createFilter({
                    name: 'formulatext',
                    formula: formula,
                    operator: search.Operator.IS,
                    values: '1'
                }));
            }
        }

        function getSublistColMaster() {
            let field_select = 'custpage_sl_select';
            let sl_ct = 'custpage_sl_tt';
            let OBJ_REPORT_TYPE = {
                TT_CDPS: "customsearch_scv_vas_cdpstt_limit",
                TT_CN: "customsearch_scv_vas_cntt_limit",
                TT_CN_NT: "customsearch_scv_vas_cntt_limit_nt", // Đuôi "_nt" chỉ là dấu hiệu phân biệt value của 2 ss, trên list không có đuôi "_nt"
                TT_VAY: "customsearch_scv_vas_vaytt_limit"
            };
            let OBJ_REPORT_TYPE_DETAIL = {
                CT_CN: "customsearch_scv_vas_ctcndt_limit",
                CT_CN_NT: "customsearch_scv_vas_ctcndt_limit_nt",
                CT_CDPS: "customsearch_scv_vas_cdpsdt_limit",
            };

            let col_sl_cdps = [
                {id: 'accnumber', label: 'Mã tài khoản', type: 'text', display: serverWidget.FieldDisplayType.INLINE}
                , {id: 'accname', label: 'Tên tài khoản', type: 'text', display: serverWidget.FieldDisplayType.INLINE}
                , {
                    id: 'subsidiarynohierarchy',
                    label: 'Công ty/chi nhánh',
                    type: 'text',
                    display: serverWidget.FieldDisplayType.INLINE
                }
                , {
                    id: 'sodudauno',
                    label: 'Số dư đầu: Nợ',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
                , {
                    id: 'sodudauco',
                    label: 'Số dư đầu: Có',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
                , {
                    id: 'phatsinhno',
                    label: 'Phát sinh: Nợ',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
                , {
                    id: 'phatsinhco',
                    label: 'Phát sinh: Có',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
                , {
                    id: 'soducuoino',
                    label: 'Số dư cuối: Nợ',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
                , {
                    id: 'soducuoico',
                    label: 'Số dư cuối: Có',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }

                , {
                    id: 'sodudaunovnd',
                    label: 'Số dư: Nợ (VND)',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
                , {
                    id: 'sodudaucovnd',
                    label: 'Số dư: Có (VND)',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
                , {
                    id: 'phatsinhnovnd',
                    label: 'Phát sinh: Nợ (VND)',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
                , {
                    id: 'phatsinhcovnd',
                    label: 'Phát sinh: Có (VND)',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
                , {
                    id: 'soducuoinovnd',
                    label: 'Số dư cuối: Nợ (VND)',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
                , {
                    id: 'soducuoicovnd',
                    label: 'Số dư cuối: Có (VND)',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }

            ];

            let col_sl_cdps_nocurrency = [
                {id: 'accnumber', label: 'Mã tài khoản', type: 'text', display: serverWidget.FieldDisplayType.INLINE}
                , {id: 'accname', label: 'Tên tài khoản', type: 'text', display: serverWidget.FieldDisplayType.INLINE}
                , {
                    id: 'subsidiarynohierarchy',
                    label: 'Công ty/chi nhánh',
                    type: 'text',
                    display: serverWidget.FieldDisplayType.INLINE
                }
                , {
                    id: 'sodudaunovnd',
                    label: 'Số dư đầu: Nợ',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
                , {
                    id: 'sodudaucovnd',
                    label: 'Số dư đầu: Có',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
                , {
                    id: 'phatsinhnovnd',
                    label: 'Phát sinh: Nợ',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
                , {
                    id: 'phatsinhcovnd',
                    label: 'Phát sinh: Có',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
                , {
                    id: 'soducuoinovnd',
                    label: 'Số dư cuối: Nợ',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
                , {
                    id: 'soducuoicovnd',
                    label: 'Số dư cuối: Có',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
            ];

            let col_ss_cdps = [['account', 0], ['account_text', 0, 'sltext'], ['subsidiarynohierarchy', 1], ['sodudauno', 2], ['sodudauco', 3], ['phatsinhno', 4], ['phatsinhco', 5]
                , ['soducuoino', 6], ['soducuoico', 7], ['sodudaunovnd', 8], ['sodudaucovnd', 9], ['phatsinhnovnd', 10], ['phatsinhcovnd', 11], ['soducuoinovnd', 12], ['soducuoicovnd', 13]
            ];

            let col_sl_cn = [
                {id: 'accnumber', label: 'Mã tài khoản', type: 'text', display: serverWidget.FieldDisplayType.INLINE}
                , {id: 'accname', label: 'Tên tài khoản', type: 'text', display: serverWidget.FieldDisplayType.INLINE}
                , {
                    id: 'subsidiarynohierarchy',
                    label: 'Công ty/chi nhánh',
                    type: 'text',
                    display: serverWidget.FieldDisplayType.INLINE
                }
                , {id: 'doituong', label: 'Đối tượng', type: 'text', display: serverWidget.FieldDisplayType.INLINE}
                , {
                    id: 'sodudauno',
                    label: 'Số dư đầu: Nợ',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
                , {
                    id: 'sodudauco',
                    label: 'Số dư đầu: Có',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
                , {
                    id: 'phatsinhno',
                    label: 'Phát sinh: Nợ',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
                , {
                    id: 'phatsinhco',
                    label: 'Phát sinh: Có',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
                , {
                    id: 'soducuoino',
                    label: 'Số dư cuối: Nợ',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
                , {
                    id: 'soducuoico',
                    label: 'Số dư cuối: Có',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }

                , {
                    id: 'sodudaunovnd',
                    label: 'Số dư: Nợ (VND)',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
                , {
                    id: 'sodudaucovnd',
                    label: 'Số dư: Có (VND)',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
                , {
                    id: 'phatsinhnovnd',
                    label: 'Phát sinh: Nợ (VND)',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
                , {
                    id: 'phatsinhcovnd',
                    label: 'Phát sinh: Có (VND)',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
                , {
                    id: 'soducuoinovnd',
                    label: 'Số dư cuối: Nợ (VND)',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
                , {
                    id: 'soducuoicovnd',
                    label: 'Số dư cuối: Có (VND)',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }

            ];

            let col_sl_cn_nocurrency = [
                {id: 'accnumber', label: 'Mã tài khoản', type: 'text', display: serverWidget.FieldDisplayType.INLINE}
                , {id: 'accname', label: 'Tên tài khoản', type: 'text', display: serverWidget.FieldDisplayType.INLINE}
                , {
                    id: 'subsidiarynohierarchy',
                    label: 'Công ty/chi nhánh',
                    type: 'text',
                    display: serverWidget.FieldDisplayType.INLINE
                }
                , {id: 'doituong', label: 'Đối tượng', type: 'text', display: serverWidget.FieldDisplayType.INLINE}
                , {
                    id: 'sodudaunovnd',
                    label: 'Số dư đầu: Nợ',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
                , {
                    id: 'sodudaucovnd',
                    label: 'Số dư đầu: Có',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
                , {
                    id: 'phatsinhnovnd',
                    label: 'Phát sinh: Nợ',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
                , {
                    id: 'phatsinhcovnd',
                    label: 'Phát sinh: Có',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
                , {
                    id: 'soducuoinovnd',
                    label: 'Số dư cuối: Nợ',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
                , {
                    id: 'soducuoicovnd',
                    label: 'Số dư cuối: Có',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
            ];

            let col_ss_cn = [
                ['account', 0],
                ['account_text', 0, 'sltext'],
                ['subsidiarynohierarchy', 1],
                ['doituong', 2],
                ['phanloai', 3],
                ['sodudauno', 4],
                ['sodudauco', 5],
                ['phatsinhno', 6],
                ['phatsinhco', 7],
                ['soducuoino', 8],
                ['soducuoico', 9],
                ['sodudaunovnd', 10],
                ['sodudaucovnd', 11],
                ['phatsinhnovnd', 12],
                ['phatsinhcovnd', 13],
                ['soducuoinovnd', 14],
                ['soducuoicovnd', 15]
            ];

            let col_sl_vay = [
                {id: 'accnumber', label: 'Mã tài khoản', type: 'text', display: serverWidget.FieldDisplayType.INLINE}
                , {id: 'accname', label: 'Tên tài khoản', type: 'text', display: serverWidget.FieldDisplayType.INLINE}
                , {
                    id: 'subsidiarynohierarchy',
                    label: 'Công ty/chi nhánh',
                    type: 'text',
                    display: serverWidget.FieldDisplayType.INLINE
                }
                , {id: 'doituong', label: 'Đối tượng', type: 'text', display: serverWidget.FieldDisplayType.INLINE}
                , {
                    id: 'kheuocvay_text',
                    label: 'Khế ước vay',
                    type: 'text',
                    display: serverWidget.FieldDisplayType.INLINE
                }
                , {
                    id: 'sodudauno',
                    label: 'Số dư đầu: Nợ',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
                , {
                    id: 'sodudauco',
                    label: 'Số dư đầu: Có',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
                , {
                    id: 'phatsinhno',
                    label: 'Phát sinh: Nợ',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
                , {
                    id: 'phatsinhco',
                    label: 'Phát sinh: Có',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
                , {
                    id: 'soducuoino',
                    label: 'Số dư cuối: Nợ',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
                , {
                    id: 'soducuoico',
                    label: 'Số dư cuối: Có',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }

                , {
                    id: 'sodudaunovnd',
                    label: 'Số dư: Nợ (VND)',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
                , {
                    id: 'sodudaucovnd',
                    label: 'Số dư: Có (VND)',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
                , {
                    id: 'phatsinhnovnd',
                    label: 'Phát sinh: Nợ (VND)',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
                , {
                    id: 'phatsinhcovnd',
                    label: 'Phát sinh: Có (VND)',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
                , {
                    id: 'soducuoinovnd',
                    label: 'Số dư cuối: Nợ (VND)',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
                , {
                    id: 'soducuoicovnd',
                    label: 'Số dư cuối: Có (VND)',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }

            ];

            let col_sl_vay_nocurrency = [
                {id: 'accnumber', label: 'Mã tài khoản', type: 'text', display: serverWidget.FieldDisplayType.INLINE}
                , {id: 'accname', label: 'Tên tài khoản', type: 'text', display: serverWidget.FieldDisplayType.INLINE}
                , {
                    id: 'subsidiarynohierarchy',
                    label: 'Công ty/chi nhánh',
                    type: 'text',
                    display: serverWidget.FieldDisplayType.INLINE
                }
                , {id: 'doituong', label: 'Đối tượng', type: 'text', display: serverWidget.FieldDisplayType.INLINE}
                , {
                    id: 'kheuocvay_text',
                    label: 'Khế ước vay',
                    type: 'text',
                    display: serverWidget.FieldDisplayType.INLINE
                }
                , {
                    id: 'sodudaunovnd',
                    label: 'Số dư đầu: Nợ',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
                , {
                    id: 'sodudaucovnd',
                    label: 'Số dư đầu: Có',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
                , {
                    id: 'phatsinhnovnd',
                    label: 'Phát sinh: Nợ',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
                , {
                    id: 'phatsinhcovnd',
                    label: 'Phát sinh: Có',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
                , {
                    id: 'soducuoinovnd',
                    label: 'Số dư cuối: Nợ',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
                , {
                    id: 'soducuoicovnd',
                    label: 'Số dư cuối: Có',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
            ];

            let col_ss_vay = [['account', 0], ['account_text', 0, 'sltext'], ['subsidiarynohierarchy', 1], ['doituong', 2], ['kheuocvay', 3], ['kheuocvay_text', 3, 'sltext'], ['sodudauno', 4], ['sodudauco', 5], ['phatsinhno', 6], ['phatsinhco', 7]
                , ['soducuoino', 8], ['soducuoico', 9], ['sodudaunovnd', 10], ['sodudaucovnd', 11], ['phatsinhnovnd', 12], ['phatsinhcovnd', 13], ['soducuoinovnd', 14], ['soducuoicovnd', 15]
            ];

            return {
                field_select: field_select, sl_ct: sl_ct, OBJ_REPORT_TYPE: OBJ_REPORT_TYPE
                , col_sl_cdps: col_sl_cdps, col_sl_cdps_nocurrency: col_sl_cdps_nocurrency, col_ss_cdps: col_ss_cdps
                , col_sl_cn: col_sl_cn, col_sl_cn_nocurrency: col_sl_cn_nocurrency, col_ss_cn: col_ss_cn
                , col_sl_vay: col_sl_vay, col_sl_vay_nocurrency: col_sl_vay_nocurrency, col_ss_vay: col_ss_vay
                , OBJ_REPORT_TYPE_DETAIL
            }
        }

        return {
            onRequest: onRequest
        };

    });
