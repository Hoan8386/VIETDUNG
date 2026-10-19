/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/format', 'N/file', 'N/runtime', 'N/search', 'N/ui/serverWidget', 'N/url', '../lib/scv_lib_function.js'
        ,'../common/scv_common_info', '../lib/scv_lib_report.js', 'N/render', 'N/xml', '../lib/scv_lib_custom_form.js'],

    function (format, file, runtime, search, serverWidget, url, lbf, commonInfo,  lrp, render, xml, libCustomForm) {

        let isPrint = "", listPrint = {table: {header: "", body: ""}, type: ""};

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
            let objData = [];
            let colAdd = [];
            let isearch = parameters.isearch;
            let isgetdata = parameters.isgetdata;
            let isCnNt = false;
            let isSnkc = false;
            let namefile = parameters.namefile;
            isPrint = parameters.isPrint;
            let master = getSublistColMaster();
            let OBJ_REPORT_TYPE = master.OBJ_REPORT_TYPE;
            let OBJ_REPORT_TYPE_DETAIL = master.OBJ_REPORT_TYPE_DETAIL;

            let excelFile;
            if (reportype === OBJ_REPORT_TYPE.FT_CN_NT) {
                excelFile = 'scv_rp_vas_snk_cn_nt.xlsx'
            } else if (reportype === OBJ_REPORT_TYPE.FT_CN && currencyvalue){
                excelFile = 'scv_rp_vas_snk_cn_nt.xlsx'
            } else if (reportype === OBJ_REPORT_TYPE.FT_SNKC && currencyvalue) {
                excelFile = 'scv_rp_vas_snk_currency.xlsx'
            } else if (reportype === OBJ_REPORT_TYPE.FT_SNKC && !currencyvalue) {
                excelFile = 'scv_rp_vas_snk_nocurrency.xlsx'
            } else {
                excelFile = 'scv_rp_vas_snk_cn_nocurrency.xlsx'
            }

            if (!!account) {
                account = account.split(',');
            }
            if (!!account_parent) {
                account_parent = account_parent.split(',');
            }

            let list_detail = [], col_detail = null;
            let colid = [];
            if (!foreignCurrency(currencyvalue)) {
                if (reportype === OBJ_REPORT_TYPE.FT_CN) {
                    colid = master.col_sl_cn_nocurrency;
                    col_detail = master.col_ss_cn;
                } else if (reportype === OBJ_REPORT_TYPE.FT_SNKC) {
                    colid = master.col_sl_snkc_nocurrency;
                    col_detail = master.col_ss_snkc;
                } else if (reportype === OBJ_REPORT_TYPE.FT_CN_NT) {
                    colid = master.col_sl_cn;
                    col_detail = master.col_ss_cn;
                }
            } else {
                if (reportype === OBJ_REPORT_TYPE.FT_CN || reportype === OBJ_REPORT_TYPE.FT_CN_NT) {
                    colid = master.col_sl_cn;
                    col_detail = master.col_ss_cn;
                } else if (reportype === OBJ_REPORT_TYPE.FT_SNKC) {
                    colid = master.col_sl_snkc;
                    col_detail = master.col_ss_snkc;
                }
            }
            let reportTypeNt = reportype;
            if (reportype === OBJ_REPORT_TYPE.FT_CN_NT) {
                currencyvalue = currencyvalue ? currencyvalue : '';
                reportype = OBJ_REPORT_TYPE.FT_CN_NT.slice(0, -3);
                isCnNt = true;
            } else if (reportype === OBJ_REPORT_TYPE.FT_SNKC) {
                isSnkc = true;
            }

            isearch = (!date_dauky || !date_cuoiky || !parameters.custpage_subsidiary) ? 'F' : isearch;
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
                if (reportype === OBJ_REPORT_TYPE.FT_SNKC) {
                    lrp.doSearchSS(reportype, 1000, list_detail, filters_detail, col_detail);
                }
                else {
                    let datefrom = format.parse({value: date_dauky, type: format.Type.DATE});
                    let datefromfm = datefrom.getFullYear() + '' + ((datefrom.getMonth() + 1) + '').padStart(2, '0') + (datefrom.getDate() + '').padStart(2, '0');
                    let col1 = {
                        name: 'formulanumeric',
                        summary: search.Summary.SUM,
                        label: 'Số dư đầu Nợ Ngoại tệ',
                        type: 'float',
                        formula: "CASE WHEN TO_NUMBER(TO_CHAR({trandate}, 'YYYYMMDD')) < " + datefromfm +
                            " THEN CASE WHEN {currency} != 'VND' THEN {debitfxamount} ELSE 0 END ELSE 0 END"
                    };
                    let col2 = {
                        name: 'formulanumeric',
                        summary: search.Summary.SUM,
                        label: 'Số dư đầu Có Ngoại tệ',
                        type: 'float',
                        formula: "CASE WHEN TO_NUMBER(TO_CHAR({trandate}, 'YYYYMMDD')) < " + datefromfm +
                            " THEN CASE WHEN {currency} != 'VND' THEN {creditfxamount} ELSE 0 END ELSE 0 END"
                    };
                    let col3 = {
                        name: 'formulanumeric',
                        summary: search.Summary.SUM,
                        label: 'Số phát sinh Nợ Ngoại tệ',
                        type: 'float',
                        formula: "CASE WHEN TO_NUMBER(TO_CHAR({trandate}, 'YYYYMMDD')) >= " + datefromfm +
                            " THEN CASE WHEN {currency} != 'VND' THEN {debitfxamount} ELSE 0 END ELSE 0 END"
                    };
                    let col4 = {
                        name: 'formulanumeric',
                        summary: search.Summary.SUM,
                        label: 'Số phát sinh Có Ngoại tệ',
                        type: 'float',
                        formula: "CASE WHEN TO_NUMBER(TO_CHAR({trandate}, 'YYYYMMDD')) >= " + datefromfm +
                            " THEN CASE WHEN {currency} != 'VND' THEN {creditfxamount} ELSE 0 END ELSE 0 END"
                    };
                    let col5 = {
                        name: 'formulanumeric',
                        summary: search.Summary.SUM,
                        label: 'Số dư cuối Nợ Ngoại tệ',
                        type: 'float',
                        formula: "CASE WHEN {currency} != 'VND' THEN {debitfxamount} ELSE 0 END"
                    };
                    let col6 = {
                        name: 'formulanumeric',
                        summary: search.Summary.SUM,
                        label: 'Số dư cuối Có Ngoại tệ',
                        type: 'float',
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

                    colAdd = [col1, col2, col3, col4, col5, col6, col7, col8, col9, col10, col11, col12];
                    lrp.doSearchSSMore(reportype, 1000, list_detail, filters_detail, col_detail, colAdd, null);
                }
                log.error('list_detail: ', list_detail);
                objData = setSublistValueLine(colid, list_detail, currencyvalue, reportype, OBJ_REPORT_TYPE, OBJ_REPORT_TYPE_DETAIL, isCnNt, reportTypeNt, parameters);
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
                    isSnkc: isSnkc,
                    date_dauky: date_dauky,
                    date_cuoiky: date_cuoiky,
                    currencyValue: currencyvalue
                });
                libCustomForm.addFieldDxGridResult(form, "scvTabsContainer");
                response.writePage(form);
            }
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
            if(parameters.custpage_account){
                url += '&custpage_account=' + encodeURIComponent(parameters.custpage_account);
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

        function createDetailUrl(objdetail, reportype, OBJ_REPORT_TYPE, base_url) {
            if (!base_url) return '';
            let urlTemp = '';
            let linkText = '';
            let finalHtml = '';

            if (reportype === OBJ_REPORT_TYPE.FT_CN) {
                if (objdetail.doituong) {
                    linkText = objdetail.doituong;
                    urlTemp = appendEntityParam(base_url, objdetail.doituong);
                }
            }

            if (urlTemp && linkText) {
                finalHtml = '<a href="' + urlTemp + '&isearch=T" target="_blank">' + linkText + '</a>';
            }

            return finalHtml;
        }

        // Escape xml special char
        function esXml(str) {
            return xml.escape(str);
        }

        // Change currency
        function changeCurrency(number, range = 0) {
            if (!!number && number != 0) {
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

        function reCalculationDauCuoi(objdetail, reportype, OBJ_REPORT_TYPE) {
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

        function setSublistValueLine(colids, list_detail, currencyvalue, reportype, OBJ_REPORT_TYPE, OBJ_REPORT_TYPE_DETAIL, isCnNt, reportTypeNt, parameters) {
            let lineDataArray = []; // Mảng để chứa các đối tượng dòng
            let precision = (!foreignCurrency(currencyvalue)) ? 0 : 2;
            let objdetail, colid, tempvalue, tov;
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

            let urlChitiet = '';
            if (reportype === OBJ_REPORT_TYPE.FT_CN) {
                let baseUrl = url.resolveScript({
                    scriptId: 'customscript_scv_sl_rp_vas_dt_v2',
                    deploymentId: 'customdeploy_scv_sl_rp_vas_dt_v2',
                    returnExternalUrl: false
                });

                let detailReportType = '';
                if (reportype === OBJ_REPORT_TYPE.FT_CN && reportTypeNt !== OBJ_REPORT_TYPE.FT_CN_NT) {
                    detailReportType = OBJ_REPORT_TYPE_DETAIL.CT_CN;
                } else if (reportTypeNt === OBJ_REPORT_TYPE.FT_CN_NT) {
                    detailReportType = OBJ_REPORT_TYPE_DETAIL.CT_CN_NT;
                }
                urlChitiet = buildBaseDetailUrl(baseUrl, parameters, detailReportType);
            }


            let netnoco = parameters.custpage_netnoco;
            for (let i in list_detail) {
                let lineObject = {}; // Đối tượng để chứa dữ liệu của một dòng
                objdetail = list_detail[i];
                objdetail.doituong_text = objdetail.doituong
                if (netnoco === 'true') {
                    reCalculationDauCuoi(objdetail, reportype, OBJ_REPORT_TYPE);
                }

                // Tính tổng
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

                for (let n in colids) {
                    colid = colids[n].id;
                    tempvalue = objdetail[colid];

                    if (!!tempvalue || tempvalue === 0) {
                        tov = typeof tempvalue;
                        if (tov == 'number') {
                            tempvalue = parseFloat(tempvalue);
                            // tempvalue = colid.endsWith('vnd') ? tempvalue.toFixed(0) : tempvalue;
                        } else if (tov == 'string') {
                            tempvalue = tempvalue.substr(0, 300);
                        }
                        if (colid == 'soct') {
                            tempvalue = '<a href=/app/accounting/transactions/transaction.nl?id=' + objdetail.id + ' target=_blank>' + tempvalue + '</a>';
                        }
                        lineObject['soct_text'] = objdetail.soct || '';
                        lineObject[colid] = tempvalue;
                    }
                }

                if (reportype === OBJ_REPORT_TYPE.FT_CN && !!objdetail.doituong) {
                    const url_chitiet_html = createDetailUrl(objdetail, reportype, OBJ_REPORT_TYPE, urlChitiet);
                    if (url_chitiet_html) {
                        lineObject['doituong'] = url_chitiet_html;
                    } else {
                        lineObject['doituong'] = objdetail.doituong;
                    }
                    lineObject['doituong_text'] = objdetail.doituong || '';
                }

                lineDataArray.push(lineObject); // Thêm đối tượng dòng vào mảng
            }

            // Xử lý dòng tổng cộng
            let totalLineObject = {};
            for (let n in colids) {
                colid = colids[n].id;
                tempvalue = objTotal[colid];

                if (!!tempvalue) {
                    tov = typeof tempvalue;
                    if (tov == 'number') {
                        tempvalue = parseFloat(tempvalue);
                        // tempvalue = colid.endsWith('vnd') ? tempvalue.toFixed(0) : tempvalue;
                    }
                    totalLineObject[colid] = tempvalue;
                }

                if (colid == 'diengiai' || colid == 'doituong') {
                    totalLineObject[colid] = 'Tổng cộng';
                    totalLineObject.typebold = '2';
                }
            }
            lineDataArray.push(totalLineObject);

            return lineDataArray;
        }

        function onCreateFormUI(_params, master, subsidiary, account, account_parent) {
            let form = serverWidget.createForm({title: "VAS Sổ nhật ký chung, Tổng hợp CN không TK"});
            form.clientScriptModulePath = '../cs/scv_cs_sl_rp_vas_fl_v2.js';
            form.addButton({id: 'custpage_bt_search', label: 'Search', functionName: 'searchReport()'});
            form.addButton({id: 'custpage_bt_export', label: 'Export', functionName: 'exportReport()'});
            form.addButton({id: 'custpage_bt_print', label: 'Print', functionName: 'onPrint()'});
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
                {value: OBJ_REPORT_TYPE.FT_SNKC, label: 'Sổ nhật ký chung'},
                {value: OBJ_REPORT_TYPE.FT_CN, label: 'Tổng hợp CN (Không Tài khoản)'},
                {value: OBJ_REPORT_TYPE.FT_CN_NT, label: 'Tổng hợp CN Ngoại tệ'}
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
            let f = [['issummary', 'is', true]];
            let custpage_account_parent = form.addField({
                id: 'custpage_account_parent', type: serverWidget.FieldType.MULTISELECT,
                label: 'Account Summary', container: 'fieldgroup_dc_main'
            });
            lrp.addSelectionMulti(custpage_account_parent, 'account', c, f, true, account_parent);

            let custpage_account = form.addField({
                id: 'custpage_account',
                type: serverWidget.FieldType.MULTISELECT,
                label: 'Account',
                container: container,
                source: 'account'
            });
            custpage_account.defaultValue = _params.custpage_account || [];

            let custpage_netnoco = form.addField({
                id: 'custpage_netnoco',
                type: serverWidget.FieldType.CHECKBOX,
                label: 'Net Nợ, Có',
                container: container
            });
            custpage_netnoco.defaultValue = (_params.custpage_netnoco === 'true' || _params.custpage_netnoco === 'T') ? 'T' : 'F';

            /*let custpage_acc_level = form.addField({
                id: 'custpage_acc_level',
                type: serverWidget.FieldType.SELECT,
                label: 'Account Level',
                container: container,
                source: 'customlist_scv_acc_level'
            });
            custpage_acc_level.defaultValue = _params.custpage_acc_level;*/

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

            let custpage_entity = form.addField({
                id: 'custpage_entity',
                type: serverWidget.FieldType.TEXT,
                label: 'Name',
                container: container
            });
            custpage_entity.defaultValue = _params.custpage_entity;

            // let sublist = form.addSublist({
            //     id: master.sl_ct,
            //     type: serverWidget.SublistType.LIST,
            //     label: 'KẾT QUẢ'
            // });
            // return {form: form, sublist: sublist};
            return form;
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
            if (parameters.custpage_reportype == 'customsearch_scv_vas_snkcfl') {
                f.push(search.createFilter({
                    name: 'trandate',
                    operator: search.Operator.ONORAFTER,
                    values: date_dauky
                }));
            }
            f.push(search.createFilter({name: 'trandate', operator: search.Operator.ONORBEFORE, values: date_cuoiky}));

            if (!!entity) {
                if (entity == '- None -') {
                    f.push(search.createFilter({
                        name: 'formulatext', operator: search.Operator.ISEMPTY, values: '',
                        formula: "case when {type} like 'Journal%' and {account} like '3311%' then {entity} else nvl(nvl(nvl(nvl(nvl(nvl({entity}, {customer.companyname}), {vendorline.companyname}),{custbody_scv_payment_number.custrecord_scv_payment_entity}),{vendor.entityid}),{name}),{custbody_scv_payee}) end"
                    }));
                } else {
                    f.push(search.createFilter({
                        name: 'formulatext', operator: search.Operator.CONTAINS, values: entity,
                        formula: "case when {type} like 'Journal%' and {account} like '3311%' then {entity} else nvl(nvl(nvl(nvl(nvl(nvl({entity}, {customer.companyname}), {vendorline.companyname}),{custbody_scv_payment_number.custrecord_scv_payment_entity}),{vendor.entityid}),{name}),{custbody_scv_payee}) end"
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
            if (!!parameters.custpage_exportbc) {
                f.push(search.createFilter({
                    name: 'formulatext',
                    formula: "case when {custbody_scv_export} = 'T' then 'T' else 'F' end",
                    operator: search.Operator.IS,
                    values: parameters.custpage_exportbc
                }));
            }
        }

        function getSublistColMaster() {
            let field_select = 'custpage_sl_select';
            let sl_ct = 'custpage_sl_fl';
            let OBJ_REPORT_TYPE = {
                FT_CN: "customsearch_scv_vas_cnfl",
                FT_CN_NT: "customsearch_scv_vas_cnfl_nt",
                FT_SNKC: "customsearch_scv_vas_snkcfl"
            };

            let OBJ_REPORT_TYPE_DETAIL = {
                CT_CDPS: "customsearch_scv_vas_cdpsdt",
                CT_CN: "customsearch_scv_vas_ctcndt",
                CT_CN_NT: "customsearch_scv_vas_ctcndt_nt",
            };

            let col_sl_cn = [
                {
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
                {
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

            let col_ss_cn = [['subsidiarynohierarchy', 0], ['doituong', 1], ['sodudauno', 2], ['sodudauco', 3], ['phatsinhno', 4], ['phatsinhco', 5]
                , ['soducuoino', 6], ['soducuoico', 7], ['sodudaunovnd', 8], ['sodudaucovnd', 9], ['phatsinhnovnd', 10], ['phatsinhcovnd', 11], ['soducuoinovnd', 12], ['soducuoicovnd', 13]
            ];

            let col_sl_snkc = [
                {id: 'trandate', label: 'Date', type: 'date', display: serverWidget.FieldDisplayType.INLINE}
                , {id: 'tranid', label: 'Số phiếu', type: 'text', display: serverWidget.FieldDisplayType.INLINE}
                , {id: 'ngayct', label: 'Ngày CT', type: 'date', display: serverWidget.FieldDisplayType.INLINE}
                , {id: 'soct', label: 'Số CT', type: 'text', display: serverWidget.FieldDisplayType.INLINE}
                , {
                    id: 'ordertype_text',
                    label: 'Order Type',
                    type: 'text',
                    display: serverWidget.FieldDisplayType.INLINE
                }
                , {id: 'diengiai', label: 'Diễn Giải', type: 'text', display: serverWidget.FieldDisplayType.INLINE}
                , {id: 'accnumber', label: 'Mã tài khoản', type: 'text', display: serverWidget.FieldDisplayType.INLINE}
                , {id: 'tygia', label: 'Tỷ giá', type: 'float', display: serverWidget.FieldDisplayType.INLINE}
                , {id: 'phatsinhno', label: 'Số dư: Nợ', type: 'float', display: serverWidget.FieldDisplayType.INLINE}
                , {id: 'phatsinhco', label: 'Số dư: Có', type: 'float', display: serverWidget.FieldDisplayType.INLINE}
                , {
                    id: 'phatsinhnovnd',
                    label: 'Số dư: Nợ (VND)',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
                , {
                    id: 'phatsinhcovnd',
                    label: 'Số dư: Có (VND)',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
            ];

            let col_sl_snkc_nocurrency = [
                {id: 'trandate', label: 'Date', type: 'date', display: serverWidget.FieldDisplayType.INLINE}
                , {id: 'tranid', label: 'Số phiếu', type: 'text', display: serverWidget.FieldDisplayType.INLINE}
                , {id: 'ngayct', label: 'Ngày CT', type: 'date', display: serverWidget.FieldDisplayType.INLINE}
                , {id: 'soct', label: 'Số CT', type: 'text', display: serverWidget.FieldDisplayType.INLINE}
                , {
                    id: 'ordertype_text',
                    label: 'Order Type',
                    type: 'text',
                    display: serverWidget.FieldDisplayType.INLINE
                }
                , {id: 'diengiai', label: 'Diễn Giải', type: 'text', display: serverWidget.FieldDisplayType.INLINE}
                , {id: 'accnumber', label: 'Mã tài khoản', type: 'text', display: serverWidget.FieldDisplayType.INLINE}
                , {
                    id: 'phatsinhnovnd',
                    label: 'Số dư: Nợ',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
                , {
                    id: 'phatsinhcovnd',
                    label: 'Số dư: Có',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
            ];

            let col_ss_snkc = [['trandate', 0], ['tranid', 1], ['ngayct', 2], ['soct', 3], ['diengiai', 4], ['accnumber', 5]
                , ['tygia', 6], ['phatsinhno', 7], ['phatsinhnovnd', 8], ['phatsinhco', 9], ['phatsinhcovnd', 10], ['id', 11], ['ordertype', 12], ['ordertype_text', 12, 'sltext']
            ];
            return {
                field_select: field_select, sl_ct: sl_ct, OBJ_REPORT_TYPE: OBJ_REPORT_TYPE, OBJ_REPORT_TYPE_DETAIL: OBJ_REPORT_TYPE_DETAIL
                , col_sl_cn: col_sl_cn, col_sl_cn_nocurrency: col_sl_cn_nocurrency, col_ss_cn: col_ss_cn
                , col_sl_snkc: col_sl_snkc, col_sl_snkc_nocurrency: col_sl_snkc_nocurrency, col_ss_snkc: col_ss_snkc
            }
        }

        function foreignCurrency(value) {
            return !!value && value !== '1';
        }

        return {
            onRequest: onRequest
        };

    });