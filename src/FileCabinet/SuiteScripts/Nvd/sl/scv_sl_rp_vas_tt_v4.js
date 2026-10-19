/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */

define(['N/format', 'N/file', 'N/runtime', 'N/search', 'N/ui/serverWidget', 'N/url', '../lib/scv_lib_function.js', '../common/scv_common_info', '../common/scv_common_rp_vas_tt_v4.js', '../lib/scv_lib_report.js', 'N/xml', 'N/render', '../lib/scv_lib_custom_form.js'],
    function (format, file, runtime, search, serverWidget, url, lbf, commonInfo, commonRpVasTt, lrp, xml, render, libCustomForm) {

        const CUR_SCRIPT = {
            ID: 'customscript_scv_sl_rp_vas_tt_v4',
            DEPLOYID_UI: 'customdeploy_scv_sl_rp_vas_tt_v4',
            DEPLOYID_DATA: 'customdeploy_scv_sl_rp_vas_tt_v4_svc'
        };

        function onRequest(context) {
            let request = context.request;
            let response = context.response;
            let parameters = request.parameters || {};
            let master = getSublistColMaster();
            let action = resolveAction(parameters);
            let curScript = runtime.getCurrentScript();
            let isDataDeployment = curScript.deploymentId === CUR_SCRIPT.DEPLOYID_DATA;

            if (isDataDeployment || action) {
                return handleServiceRequest(response, parameters, master, action);
            }

            return handleUiRequest(response, parameters, master);
        }

        function resolveAction(parameters) {
            if (parameters.isgetdata === 'T') {
                return 'getData';
            }
            if (parameters.action === 'getUrlTemplate') {
                return 'getUrlTemplate';
            }
            return '';
        }

        function handleServiceRequest(response, parameters, master, action) {
            const actionMap = {
                getData: function () {
                    return getReportPayload(parameters, master);
                },
                getUrlTemplate: function () {
                    return getTemplatePayload(parameters, master);
                }
            };

            let handler = actionMap[action] || actionMap.getData;
            let payload = handler();
            response.setHeader({name: 'Content-Type', value: 'application/json'});
            response.write(JSON.stringify(payload || {}));
        }

        function handleUiRequest(response, parameters, master) {
            let reportPayload = getReportPayload(parameters, master);
            let form = onCreateFormUI(parameters, master, reportPayload.subsidiary, reportPayload.account, reportPayload.account_parent);
            libCustomForm.addFieldIncludeDxGrid(form);
            libCustomForm.addFieldScriptData(form, {
                isearch: reportPayload.isearch,
                objData: reportPayload.objData,
                reportype: parameters.custpage_reportype || reportPayload.reportype,
                isCnNt: reportPayload.isCnNt,
                isCdps: reportPayload.isCdps,
                isVay: reportPayload.isVaytt,
                date_dauky: reportPayload.date_dauky,
                date_cuoiky: reportPayload.date_cuoiky,
                currencyValue: reportPayload.currencyvalue
            });
            libCustomForm.addFieldDxGridResult(form, 'scvTabsContainer');
            response.writePage(form);
        }

        function getTemplatePayload(parameters, master) {
            let contextData = createReportContext(parameters, master);
            let objDataHeader = commonInfo.getInforReport({subsidiary: contextData.subsidiary});
            objDataHeader = {
                ...objDataHeader,
                date_dauky: parameters.date_dauky,
                date_cuoiky: parameters.date_cuoiky
            };
            return {
                urlTemplate: commonInfo.getUrlFileTemplate('EXCEL', contextData.excelFile),
                objDataHeader
            };
        }

        const DATA_PAGE_SIZE = 500;   // số dòng mỗi page trả về client
        const CACHE_FOLDER_PATH = '/SuiteScripts/Nvd/ss/'; // thư mục lưu file cache tạm
        const CACHE_FILE_TTL_MS = 5 * 60 * 1000; // 5 phút

        function getReportCacheKey(parameters) {
            let parts = [
                parameters.custpage_reportype || '',
                parameters.custpage_subsidiary || '',
                parameters.custpage_date_dauky || '',
                parameters.custpage_date_cuoiky || '',
                parameters.custpage_account || '',
                parameters.custpage_account_parent || '',
                parameters.custpage_currencyvalue || '',
                parameters.custpage_entity || '',
                parameters.custpage_netnoco || '',
                parameters.custpage_not_level || '',
                parameters.custpage_acc_level || '',
                parameters.custpage_order_type || '',
                parameters.custpage_classification || '',
                parameters.custpage_location || '',
                parameters.custpage_department || '',
                parameters.custpage_kmcp || '',
                parameters.custpage_matt || '',
                parameters.custpage_exportbc || '',
                parameters.custpage_category || '',
            ];
            let str = parts.join('|');
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
            }
            return 'vas_tt_cache_' + Math.abs(hash);
        }

        function readCacheFile(cacheKey) {
            try {
                let f = file.load({id: CACHE_FOLDER_PATH + cacheKey + '.json'});
                let content = JSON.parse(f.getContents());
                // Kiểm tra TTL
                if (content.ts && (Date.now() - content.ts) < CACHE_FILE_TTL_MS) {
                    return content;
                }
            } catch (e) {
                // file chưa tồn tại hoặc lỗi đọc
            }
            return null;
        }

        function writeCacheFile(cacheKey, allData, ttlPage) {
            try {
                let content = JSON.stringify({
                    ts: Date.now(),
                    ttlPage: ttlPage,
                    totalRows: allData.length,
                    data: allData
                });
                let cacheFile = file.create({
                    name: cacheKey + '.json',
                    fileType: file.Type.JSON,
                    contents: content,
                    folder: getFolderIdByPath(CACHE_FOLDER_PATH)
                });
                cacheFile.save();
            } catch (e) {
                log.debug('Cache write error', e.message);
            }
        }

        function getFolderIdByPath(path) {
            try {
                // Tìm folder theo path đầy đủ
                let folderSearch = search.create({
                    type: search.Type.FOLDER,
                    filters: [
                        ['name', 'is', 'ss'],
                        'AND',
                        ['parent.name', 'is', 'Nvd']
                    ],
                    columns: ['internalid']
                });
                let result = folderSearch.run().getRange({start: 0, end: 1});
                if (result && result.length > 0) return result[0].id;
            } catch (e) {
                log.debug('getFolderIdByPath error', e.message);
            }
            return null;
        }

        function getReportPayload(parameters, master) {
            let contextData = createReportContext(parameters, master);
            let pageIndex = parseInt(parameters.pageIndex) || 0;

            if (contextData.isearch !== 'T') {
                return {
                    objData: [],
                    info: {page: 0, ttlPage: 1, totalRows: 0},
                    col: master.col,
                    reportype: contextData.reportype,
                    currencyValue: parameters.custpage_currencyvalue,
                    isearch: contextData.isearch,
                    isCnNt: contextData.isCnNt,
                    isCdps: contextData.isCdps,
                    isVaytt: contextData.isVaytt,
                    date_dauky: contextData.date_dauky,
                    date_cuoiky: contextData.date_cuoiky,
                    currencyvalue: contextData.currencyvalue,
                    subsidiary: contextData.subsidiary,
                    account: contextData.account,
                    account_parent: contextData.account_parent
                };
            }

            let cacheKey = getReportCacheKey(parameters);
            let allData = null;
            let ttlPage = 1;

            // Thử đọc từ file cache (page > 0 hoặc muốn tái sử dụng)
            if (pageIndex > 0) {
                let cached = readCacheFile(cacheKey);
                if (cached) {
                    allData = cached.data;
                    ttlPage = cached.ttlPage;
                }
            }

            // Cache miss hoặc page 0 → full search + aggregate + handleData
            if (!allData) {
                allData = loadReportData(contextData, parameters);
                allData = commonRpVasTt.handleData(allData);
                for (let i = 0; i < allData.length; i++) { allData[i].line = i; }
                ttlPage = Math.max(1, Math.ceil(allData.length / DATA_PAGE_SIZE));
                // Lưu vào file cache để các page sau đọc
                writeCacheFile(cacheKey, allData, ttlPage);
            }

            let start = pageIndex * DATA_PAGE_SIZE;
            let end = Math.min(start + DATA_PAGE_SIZE, allData.length);
            let objData = allData.slice(start, end);

            return {
                objData: objData,
                info: {page: pageIndex, ttlPage: ttlPage, totalRows: allData.length},
                col: master.col,
                reportype: contextData.reportype,
                currencyValue: parameters.custpage_currencyvalue,
                isearch: contextData.isearch,
                isCnNt: contextData.isCnNt,
                isCdps: contextData.isCdps,
                isVaytt: contextData.isVaytt,
                date_dauky: contextData.date_dauky,
                date_cuoiky: contextData.date_cuoiky,
                currencyvalue: contextData.currencyvalue,
                subsidiary: contextData.subsidiary,
                account: contextData.account,
                account_parent: contextData.account_parent
            };
        }

        function createReportContext(parameters, master) {
            let reportype = parameters.custpage_reportype;
            let reportTypeNt = reportype;
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
            let isearch = parameters.isearch;
            let OBJ_REPORT_TYPE = master.OBJ_REPORT_TYPE;

            let excelFile = null;
            if (reportype === OBJ_REPORT_TYPE.TT_CN_NT) {
                excelFile = 'scv_rp_vas_thcn_nt.xlsx';
            } else if (reportype === OBJ_REPORT_TYPE.TT_CN && !currencyvalue) {
                excelFile = 'scv_rp_vas_thcn_nocurrency.xlsx';
            } else if ((reportype === OBJ_REPORT_TYPE.TT_CN || reportype === OBJ_REPORT_TYPE.TT_VAY) && currencyvalue) {
                excelFile = 'scv_rp_vas_thcn_currency.xlsx';
            } else if (reportype === OBJ_REPORT_TYPE.TT_CDPS && !currencyvalue) {
                excelFile = 'scv_rp_vas_thcn_cdps_nocurrency.xlsx';
            } else if (reportype === OBJ_REPORT_TYPE.TT_CDPS && currencyvalue) {
                excelFile = 'scv_rp_vas_thcn_cdps_currency.xlsx';
            } else if (reportype === OBJ_REPORT_TYPE.TT_VAY && !currencyvalue) {
                excelFile = 'scv_rp_vas_thcn_vay_nocurrency.xlsx';
            }

            if (!!subsidiary && typeof subsidiary === 'string') {
                subsidiary = subsidiary.split(',');
            }
            if (!!account) {
                account = typeof account === 'string' ? account.split(',') : account;
            }
            if (!!account_parent) {
                account_parent = typeof account_parent === 'string' ? account_parent.split(',') : account_parent;
            }

            let isCnNt = reportype === OBJ_REPORT_TYPE.TT_CN_NT;
            let isCdps = false;
            let isVaytt = false;
            let colid = [];
            let col_detail = null;
            const isForeign = commonRpVasTt.isForeignCurrency(currencyvalue);

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

            return {
                reportype,
                reportTypeNt,
                subsidiary,
                entity,
                date_dauky,
                date_cuoiky,
                currencyvalue,
                currencytext,
                account,
                account_parent,
                acc_level,
                not_level,
                isearch,
                isCnNt,
                isCdps,
                isVaytt,
                colid,
                col_detail,
                excelFile,
                OBJ_REPORT_TYPE,
                OBJ_REPORT_TYPE_DETAIL: master.OBJ_REPORT_TYPE_DETAIL
            };
        }

        function loadReportData(contextData, parameters) {
            let list_detail = [];
            let fieldgroup = {account: 'account', account_text: 'account_text'};
            let list_acc = [];
            let account = contextData.account;

            if (!!contextData.account_parent && contextData.account_parent.length > 0) {
                if (!account) {
                    account = [];
                }
                let list_acc_leaf = [], pageinfo = null, params_acc_leaf = [];
                let sql_acc_leaf = "select acc.id from account acc where acc.issummary = 'F' and (";
                for (let iap in contextData.account_parent) {
                    if (iap > 0) {
                        sql_acc_leaf = sql_acc_leaf + ' or ';
                    }
                    sql_acc_leaf = sql_acc_leaf + ' acc.acctnumber like (select a.acctnumber from account a where a.id = ' + contextData.account_parent[iap] + ") || '%' ";
                }
                sql_acc_leaf = sql_acc_leaf + ')';
                lrp.doSearchSql(list_acc_leaf, pageinfo, sql_acc_leaf, params_acc_leaf);
                for (let iapl in list_acc_leaf) {
                    account.push(list_acc_leaf[iapl].id);
                }
            }

            let filters_detail = [];
            pushFiltersDetail(filters_detail, parameters, contextData.subsidiary, contextData.entity, contextData.currencyvalue, account,
                contextData.date_dauky, contextData.date_cuoiky, contextData.currencytext);

            let datefrom = format.parse({value: contextData.date_dauky, type: format.Type.DATE});
            let datefromfm = datefrom.getFullYear() + '' + ((datefrom.getMonth() + 1) + '').padStart(2, '0') + (datefrom.getDate() + '').padStart(2, '0');
            let col_add = getFormulaColumns(datefromfm);

            lrp.doSearchSSMore(contextData.reportype, 1000, list_detail, filters_detail, contextData.col_detail, col_add, null);
            let pageinfo = null, params_acc = [];
            let sql_acc = 'select acc.id, acc.acctnumber, acc.accountsearchdisplaynamecopy accountsearchdisplayname, acc.custrecord_scv_cct_acc_parent, acc.custrecord_scv_cct_acc_parent_name, acc.custrecord_scv_acc_level from account acc where acc.acctnumber is not null';
            lrp.doSearchSql(list_acc, pageinfo, sql_acc, params_acc);

            return commonRpVasTt.setSublistValueLine(
                contextData.colid,
                list_detail,
                contextData.currencyvalue,
                fieldgroup,
                list_acc,
                contextData.not_level,
                contextData.acc_level,
                contextData.reportype,
                contextData.reportTypeNt,
                contextData.OBJ_REPORT_TYPE,
                contextData.OBJ_REPORT_TYPE_DETAIL,
                0,
                parameters,
                {
                    scriptId: 'customscript_scv_sl_rp_vas_dt_v3',
                    deploymentId: 'customdeploy_scv_sl_rp_vas_dt_v3'
                }
            );
        }

        function getFormulaColumns(datefromfm) {
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
                formula: '{debitamount}'
            };
            let col12 = {
                name: 'formulanumeric',
                summary: search.Summary.SUM,
                label: 'Số dư cuối Có Quy ra VND',
                type: 'float',
                formula: '{creditamount}'
            };

            return [col1, col2, col3, col4, col5, col6, col7, col8, col9, col10, col11, col12];
        }

        // Calculation and aggregation are centralized in commonRpVasTt.

        function onCreateFormUI(_params, master, subsidiary, account, account_parent) {
            let form = serverWidget.createForm({title: "Tổng hợp công nợ"});
            form.clientScriptModulePath = '../cs/scv_cs_sl_rp_vas_tt_v4.js';
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