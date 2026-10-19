/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define([
        'N/format', 'N/runtime', 'N/search', 'N/ui/serverWidget',
        '../common/scv_common_info', '../lib/scv_lib_report', '../olib/alasql/alasql.min@1.7.3',
        '../lib/scv_lib_custom_form.js'
    ],
    (
        format, runtime, search, serverWidget,
        commonInfo, libRep, alasql, libCustomForm
    ) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        let CURRENCY_VND = 1;
        const MAX_INLINE_DATA_LENGTH = 99000;

        const onRequest = (scriptContext) => {
            let request = scriptContext.request;
            let parameters = request.parameters;
            let response = scriptContext.response;
            let action = parameters.action;
            let form = null;
            let master = getSublistColMaster();

            let OBJ_REPORT_TYPE = master.OBJ_REPORT_TYPE;
            let reportType = parameters.custpage_reportype;
            let subsidiary = parameters.custpage_subsidiary || (runtime.getCurrentUser().subsidiary + '');
            parameters.custpage_subsidiary = subsidiary;
            let entity = parameters.custpage_entity;
            parameters.custpage_entity = entity;
            let date_dauky = parameters.custpage_date_dauky;
            parameters.custpage_date_dauky = date_dauky;
            let date_cuoiky = parameters.custpage_date_cuoiky;
            parameters.custpage_date_cuoiky = date_cuoiky;
            let currencyvalue = parameters.custpage_currencyvalue;
            parameters.custpage_currencyvalue = currencyvalue;
            let currencytext = parameters.custpage_currencytext;
            let account = parameters.custpage_account;
            parameters.custpage_account = account;
            let account_parent = parameters.custpage_account_parent;
            parameters.custpage_account_parent = account_parent;
            let debitloanagreement = parameters.custpage_debitloanagreement;
            let acc_level = parameters.custpage_acc_level;
            let not_level = parameters.custpage_not_level;

            let isearch = parameters.isearch;
            let isgetdata = parameters.isgetdata;
            let excelFile = null;
            if (reportType === OBJ_REPORT_TYPE.CT_CN_NT) {
                excelFile = 'scv_rp_vas_ctcn_nt.xlsx'
            } else if (reportType !== OBJ_REPORT_TYPE.CT_CN_NT && !currencyvalue){
                excelFile = 'scv_rp_vas_nocurrency.xlsx'
            } else {
                excelFile = 'scv_rp_vas_currency.xlsx'
            }

            if (!!account) account = account.split(',');
            if (!!account_parent) account_parent = account_parent.split(',');
            if (debitloanagreement) debitloanagreement = debitloanagreement.split(',');
            isearch = (!date_dauky || !date_cuoiky || !parameters.custpage_subsidiary) ? 'F' : isearch;
            let objData = null;

            let {colId, colDetail, colTotal} = getColIdColDetailColTotal(master, reportType, currencyvalue);

            if (isearch === 'T') {
                if(!!account_parent && account_parent.length > 0) {
                    if(!account) {
                        account = [];
                    }
                    let list_acc_leaf = [], pageinfo = null, params_acc_leaf = [];//(currencyvalue || 1) and nvl(acc.currency, 1) = ?
                    let sql_acc_leaf = "select acc.id from account acc where acc.issummary = 'F' and ("; //and acc.acctnumber like '111%'
                    for(let iap in account_parent) {
                        if(iap > 0) {
                            sql_acc_leaf = sql_acc_leaf + " or ";
                        }
                        sql_acc_leaf = sql_acc_leaf + " acc.acctnumber like (select a.acctnumber from account a where a.id = " + account_parent[iap] + ") || '%' ";
                    }
                    sql_acc_leaf = sql_acc_leaf + ")";
                    let totalRecord = libRep.doSearchSql(list_acc_leaf, pageinfo, sql_acc_leaf, params_acc_leaf);
                    for(let iapl in list_acc_leaf) {
                        account.push(list_acc_leaf[iapl].id);
                    }
                }
                let filtersDetail = [], filtersTotal = [];
                let listTotal = [], listDetail = [];
                let list_acc = [], pageinfo = null, params_acc = [];

                if (reportType !== OBJ_REPORT_TYPE.CT_CN && reportType !== OBJ_REPORT_TYPE.CT_CN_NT) {
                    let sql_acc = "select acc.id, acc.acctnumber, acc.accountsearchdisplaynamecopy accountsearchdisplayname, acc.custrecord_scv_cct_acc_parent, acc.custrecord_scv_cct_acc_parent_name from account acc where acc.acctnumber is not null";
                    libRep.doSearchSql(list_acc, pageinfo, sql_acc, params_acc);
                }

                let ssTotal = '';
                if (reportType === OBJ_REPORT_TYPE.CT_CN) {
                    ssTotal = OBJ_REPORT_TYPE.CTCN_TOTAL
                } else if (reportType === OBJ_REPORT_TYPE.CT_CN_NT) {
                    ssTotal = OBJ_REPORT_TYPE.CTCN_NT_TOTAL;
                } else {
                    ssTotal = OBJ_REPORT_TYPE.CT_TOTAL
                }
                pushFiltersDetail(filtersDetail, parameters, subsidiary, entity, currencyvalue, account, debitloanagreement, date_dauky, date_cuoiky, currencytext)
                pushFiltersTotal(filtersTotal, parameters, subsidiary, entity, currencyvalue, account, debitloanagreement, date_dauky, currencytext);
                doSearchSSWithAnd(ssTotal, 1000, listTotal, filtersTotal, colTotal);
                doSearchSSWithAnd(reportType, 1000, listDetail, filtersDetail, colDetail);
                objData = buildData(colId, listTotal, listDetail, list_acc, currencyvalue, not_level, acc_level, true);
            }
            if (isgetdata === 'T') {
                response.setHeader({ name: 'Content-Type', value: 'application/json' });
                response.write(JSON.stringify({objData, col: master.col, reportType, currencyValue: parameters.custpage_currencyvalue} || {}));
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
                }));
            } else if (request.method === 'GET') {
                const objDataStr = objData ? JSON.stringify(objData) : '';
                const canEmbedData = objDataStr.length <= MAX_INLINE_DATA_LENGTH;

                form = createForm(parameters, subsidiary, master, account, account_parent);
                libCustomForm.addFieldIncludeDxGrid(form);
                libCustomForm.addFieldScriptData(form, {
                    isearch: isearch,
                    objData: canEmbedData ? objData : [],
                    date_dauky: date_dauky,
                    date_cuoiky: date_cuoiky,
                    reportType: reportType,
                    currencyValue: currencyvalue,
                    needsAjaxData: !canEmbedData
                });
                libCustomForm.addFieldDxGridResult(form, "scvTabsContainer");
                createFieldData(form, canEmbedData ? objDataStr : null);
                response.writePage(form);
            }
        }

        // Reimplements libRep.doSearchSS locally, using efficient runPaged()+fetch() pagination
        // instead of libRep.doSearchSSRange's run()+getRange() approach.
        const doSearchSSWithAnd = (idSearch, pgSize, results, arrFilter, arrCol) => {
            let s = search.load(idSearch);
            if (arrFilter && arrFilter.length > 0) {
                s.filters = s.filters.concat(arrFilter);
            }
            let c = s.columns;
            let r = s.runPaged({pageSize: pgSize});
            let numPage = r.pageRanges.length;
            for (let np = 0; np < numPage; np++) {
                let searchPage = r.fetch({index: np});
                let tempData = searchPage.data;
                if (tempData && tempData.length > 0) {
                    for (let i = 0; i < tempData.length; i++) {
                        let objTemp = {};
                        for (let lT = 0; lT < arrCol.length; lT++) {
                            let tempValue;
                            if (arrCol[lT][2] === 'sltext') {
                                tempValue = tempData[i].getText(c[arrCol[lT][1]]);
                                if (tempValue === null || tempValue === undefined || tempValue === '') {
                                    tempValue = tempData[i].getValue(c[arrCol[lT][1]]);
                                }
                            } else {
                                tempValue = tempData[i].getValue(c[arrCol[lT][1]]);
                            }
                            objTemp[arrCol[lT][0]] = tempValue;
                        }
                        results.push(objTemp);
                    }
                }
            }
        };

        const getColIdColDetailColTotal = (master, reportype, currencyvalue) => {
            const OBJ_REPORT_TYPE = master.OBJ_REPORT_TYPE;

            let colId = [];
            let colDetail = [];
            let colTotal = master.col_ss_cttotal;

            if(!foreignCurrency(currencyvalue)) {
                if (reportype === OBJ_REPORT_TYPE.CT_CDPS) {
                    colId = master.col_sl_ctcdps_nocurrency;
                    colDetail = master.col_ss_ctcdps;
                } else if(reportype === OBJ_REPORT_TYPE.CT_CN) {
                    colId = master.col_sl_ctcn_nocurrency;
                    colDetail = master.col_ss_ctcn;
                    colTotal = master.col_ss_ctcntotal;
                } else if(reportype === OBJ_REPORT_TYPE.CT_SQT) {
                    colId = master.col_sl_ctsqt_nocurrency;
                    colDetail = master.col_ss_ctsqt;
                } else if(reportype === OBJ_REPORT_TYPE.CT_CN_NT) {
                    colId = master.col_sl_ctcn_nt;
                    colDetail = master.col_ss_ctcn_nt;
                }
            } else {
                if (reportype === OBJ_REPORT_TYPE.CT_CDPS) {
                    colId = master.col_sl_ctcdps_nocurrency;
                    colDetail = master.col_ss_ctcdps;
                } else if(reportype === OBJ_REPORT_TYPE.CT_CN) {
                    colId = master.col_sl_ctcn;
                    colDetail = master.col_ss_ctcn;
                    colTotal = master.col_ss_ctcntotal;
                } else if(reportype === OBJ_REPORT_TYPE.CT_SQT) {
                    colId = master.col_sl_ctsqt;
                    colDetail = master.col_ss_ctsqt;
                } else if(reportype === OBJ_REPORT_TYPE.CT_CN_NT) {
                    colId = master.col_sl_ctcn_nt;
                    colDetail = master.col_ss_ctcn_nt;
                }
            }

            return { colId, colDetail, colTotal };
        };

        const createForm = (parameters, subsidiary, master, account, account_parent) => {
            let form = serverWidget.createForm({title: "Chi tiết công nợ"});
            form.clientScriptModulePath = '../cssl/scv_cs_sl_rp_vas_dt_v3.js';
            form.addButton({id: 'custpage_bt_search', label: 'Tìm kiếm', functionName: 'searchReport()'});
            form.addButton({id: 'custpage_bt_export', label: 'Xuất file', functionName: 'exportReport()'});
            let container = 'fieldgroup_dc_main';
            form.addFieldGroup({id: container, label: 'Điều kiện lọc'});
            handleAddField(form, parameters, subsidiary, master, container, account, account_parent);
            return form;
        }

        const formatSo = (val, isCurrency, precision) => {
            if (val === null || val === undefined || isNaN(val) || val === '') {
                return '';
            }

            const finalPrecision = isCurrency ? (precision !== undefined ? precision : 2) : 0;

            const fixedVal = Number(val).toFixed(finalPrecision);
            let [integerPart, decimalPart] = fixedVal.split('.');

            integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

            if (finalPrecision > 0 && decimalPart) {
                return `${integerPart},${decimalPart}`;
            }

            return integerPart;
        };

        const tinhSoDuCuoiKy = (daukyNo, daukyCo, phatsinhNo, phatsinhCo) => {
            const net = daukyNo - daukyCo + phatsinhNo - phatsinhCo;
            return {
                soduno: net > 0 ? net : 0,
                soduco: net < 0 ? Math.abs(net) : 0
            };
        };

        const pushDongTongHop = (groupedData, label, p_soduno, p_soduco, p_sodunovnd, p_soducovnd, isCurrency, precision) => {
            let soduno = p_soduno || 0;
            let soduco = p_soduco || 0;
            let sodunovnd = p_sodunovnd || 0;
            let soducovnd = p_soducovnd || 0;
            let rowData = {
                diengiai: `- ${label}`,
                typebold: '2',
            };

            if (label.includes('Số dư')) {
                const netBalanceRaw = soduno - soduco;
                const netBalance = parseFloat(netBalanceRaw.toFixed(precision || 2));
                soduno = netBalance > 0 ? netBalance : 0;
                soduco = netBalance < 0 ? Math.abs(netBalance) : 0;

                const netBalanceVNDRaw = sodunovnd - soducovnd;
                const netBalanceVND = parseFloat(netBalanceVNDRaw.toFixed(0));
                sodunovnd = netBalanceVND > 0 ? netBalanceVND : 0;
                soducovnd = netBalanceVND < 0 ? Math.abs(netBalanceVND) : 0;

                rowData.soduno = isCurrency ? soduno : '';
                rowData.soduco = isCurrency ? soduco : '';
                rowData.sodunovnd = sodunovnd;
                rowData.soducovnd = soducovnd;

            } else if (label.includes('Cộng số phát sinh')) {
                rowData.phatsinhno = isCurrency ? soduno : '';
                rowData.phatsinhco = isCurrency ? soduco : '';
                rowData.phatsinhnovnd = sodunovnd;
                rowData.phatsinhcovnd = soducovnd;
            }

            groupedData.push(rowData);
        };

        const buildData = (colids, list_total, list_detail, list_acc, currencyvalue, not_level, acc_level, reportType) => {
            const precision = 2;
            const groupedData = [];

            const mapTotal = new Map();
            list_total.forEach(item => mapTotal.set(String(item.account), item));

            const mapChiTiet = new Map();
            for (const txn of list_detail) {
                const key = String(txn.account);
                if (!mapChiTiet.has(key)) {
                    mapChiTiet.set(key, {
                        account_text: txn.account_text,
                        list: [],
                        psno: 0, psco: 0, psnovnd: 0, pscovnd: 0
                    });
                }
                const acc = mapChiTiet.get(key);
                acc.list.push(txn);
                acc.psno += +txn.phatsinhno || 0;
                acc.psco += +txn.phatsinhco || 0;
                acc.psnovnd += +txn.phatsinhnovnd || 0;
                acc.pscovnd += +txn.phatsinhcovnd || 0;
            }

            const allAccountKeys = new Set([
                ...Array.from(mapTotal.keys()),
                ...Array.from(mapChiTiet.keys())
            ]);

            for (const account of allAccountKeys) {
                const data = mapChiTiet.get(account);
                const accTotal = mapTotal.get(account) || {};

                const hasForeignTransactions = data ? data.list.some(txn => (txn.currency && txn.currency !== 'VND') || +txn.phatsinhno > 0 || +txn.phatsinhco > 0) : false;
                const hasForeignOpeningBalance = (+accTotal.soduno > 0 || +accTotal.soduco > 0);
                const accountIsForeign = hasForeignTransactions || hasForeignOpeningBalance;

                const daukyNo = +accTotal.soduno || 0;
                const daukyCo = +accTotal.soduco || 0;
                const daukyNovnd = +accTotal.sodunovnd || 0;
                const daukyCovnd = +accTotal.soducovnd || 0;

                const accParent = list_acc.find(e => String(e.id) === account);
                const accountName = data?.account_text || accTotal?.account_text || accTotal?.account || accParent?.accountsearchdisplayname || '.';
                groupedData.push({
                    diengiai: accountName,
                    typebold: '2',
                    isAccount: true
                });

                pushDongTongHop(groupedData, 'Số dư đầu kỳ', daukyNo, daukyCo, daukyNovnd, daukyCovnd, accountIsForeign, precision);

                if (data && data.list.length > 0) {
                    pushDongTongHop(groupedData, 'Số phát sinh trong kỳ');

                    let runningBalance = parseFloat(((daukyNo || 0) - (daukyCo || 0)).toFixed(precision));
                    let runningBalanceVND = parseFloat(((daukyNovnd || 0) - (daukyCovnd || 0)).toFixed(0));
                    for (const txn of data.list) {
                        const row = { ...txn };
                        colids.forEach(({ id }) => {
                            let val = txn[id];
                            if (val === null || val === undefined || val === '') {
                                row[id] = '';
                            } else if (id == 'soct') {
                                row[id] = `<a href='/app/accounting/transactions/transaction.nl?id=${txn.id}' target='_blank'>${String(val).substring(0, 300)}</a>`;
                                row['soctText'] = String(val).substring(0, 300);
                            } else if (!isNaN(val)) {
                                if (!id.endsWith('vnd') && !['phatsinhnovnd', 'phatsinhcovnd', 'tygia'].includes(id) && !accountIsForeign) {
                                    row[id] = '';
                                } else {
                                    row[id] = +val;
                                }
                            } else {
                                row[id] = id === 'diengiai' ? String(val) : String(val).substring(0, 300);
                            }
                        });

                        const netChange = (+txn.phatsinhno || 0) - (+txn.phatsinhco || 0);
                        const netChangeVND = (+txn.phatsinhnovnd || 0) - (+txn.phatsinhcovnd || 0);

                        runningBalance = parseFloat((runningBalance + netChange).toFixed(precision));
                        runningBalanceVND = parseFloat((runningBalanceVND + netChangeVND).toFixed(0));

                        row.soduno = accountIsForeign ? (runningBalance > 0 ? runningBalance : 0) : '';
                        row.soduco = accountIsForeign ? (runningBalance < 0 ? Math.abs(runningBalance) : 0) : '';
                        row.sodunovnd = runningBalanceVND > 0 ? runningBalanceVND : 0;
                        row.soducovnd = runningBalanceVND < 0 ? Math.abs(runningBalanceVND) : 0;

                        groupedData.push(row);
                    }
                    pushDongTongHop(groupedData, 'Cộng số phát sinh', data.psno, data.psco, data.psnovnd, data.pscovnd, accountIsForeign, precision);
                }

                const psno = data?.psno || 0;
                const psco = data?.psco || 0;
                const psnovnd = data?.psnovnd || 0;
                const pscovnd = data?.pscovnd || 0;

                const cuoiKyBalanceRaw = (daukyNo - daukyCo) + (psno - psco);
                const cuoiKyBalance = parseFloat(cuoiKyBalanceRaw.toFixed(precision));

                const cuoiKyBalanceVNDRaw = (daukyNovnd - daukyCovnd) + (psnovnd - pscovnd);
                const cuoiKyBalanceVND = parseFloat(cuoiKyBalanceVNDRaw.toFixed(0));

                const cuoiKyNo = cuoiKyBalance > 0 ? cuoiKyBalance : 0;
                const cuoiKyCo = cuoiKyBalance < 0 ? Math.abs(cuoiKyBalance) : 0;
                const cuoiKyNoVND = cuoiKyBalanceVND > 0 ? cuoiKyBalanceVND : 0;
                const cuoiKyCoVND = cuoiKyBalanceVND < 0 ? Math.abs(cuoiKyBalanceVND) : 0;

                pushDongTongHop(groupedData, 'Số dư cuối kỳ', cuoiKyNo, cuoiKyCo, cuoiKyNoVND, cuoiKyCoVND, accountIsForeign, precision);
            }

            return groupedData;
        };

        const handleAddField = (form, parameters, subsidiary, master, container, account, account_parent) => {
            let custpage_reportype = form.addField({
                id: 'custpage_reportype',
                type: serverWidget.FieldType.SELECT,
                label: 'Report Type',
                container: container
            });
            custpage_reportype.isMandatory = true;
            let OBJ_REPORT_TYPE = master?.OBJ_REPORT_TYPE;
            let listReport = [
                {value: OBJ_REPORT_TYPE.CT_CDPS, label: 'Chi tiết Cân đối phát sinh'},
                {value: OBJ_REPORT_TYPE.CT_CN, label: 'Chi tiết Công nợ'},
                {value: OBJ_REPORT_TYPE.CT_CN_NT, label: 'Chi tiết công nợ ngoại tệ'},
                {value: OBJ_REPORT_TYPE.CT_SQT, label: 'Sổ quỹ tiền'}
            ];
            libRep.addSelecttionFrList(custpage_reportype, parameters.custpage_reportype || OBJ_REPORT_TYPE.CT_CN, listReport, false);

            let custpage_subsidiary = form.addField({
                id: 'custpage_subsidiary',
                type: serverWidget.FieldType.MULTISELECT,
                label: 'Công ty',
                container: container
            });
            custpage_subsidiary.isMandatory = true;
            libRep.addSelectSubsidiary(custpage_subsidiary, subsidiary || runtime.getCurrentUser().subsidiary);

            let custpage_order_type = form.addField({
                id: 'custpage_order_type',
                type: serverWidget.FieldType.SELECT,
                label: 'Order Type',
                container: container,
                source: 'customrecord_scv_order_type'
            });
            custpage_order_type.defaultValue = parameters.custpage_order_type || '';

            let custpage_date_dauky = form.addField({
                id: 'custpage_date_dauky',
                type: serverWidget.FieldType.DATE,
                label: 'Từ ngày',
                container: container
            }).updateLayoutType({layoutType: serverWidget.FieldLayoutType.STARTROW});
            custpage_date_dauky.isMandatory = true;
            custpage_date_dauky.defaultValue = parameters.custpage_date_dauky || '';

            let custpage_date_cuoiky = form.addField({
                id: 'custpage_date_cuoiky',
                type: serverWidget.FieldType.DATE,
                label: 'Đến ngày',
                container: container
            }).updateLayoutType({layoutType: serverWidget.FieldLayoutType.ENDROW});
            custpage_date_cuoiky.isMandatory = true;
            custpage_date_cuoiky.defaultValue = parameters.custpage_date_cuoiky || '';

            custpage_date_dauky.defaultValue = getFromDate(parameters.custpage_date_dauky);
            custpage_date_cuoiky.defaultValue = getToDate(parameters.custpage_date_cuoiky);

            let c = ['internalid', {name: 'formulatext', formula: "{number} || ' ' || {name}", sort: 'ASC'}];
            let f = [['issummary', 'is', 'T'], 'and', ['custrecord_scv_acc_limit_rp', 'is', 'F']];
            let custpage_account_parent = form.addField({
                id: 'custpage_account_parent', type: serverWidget.FieldType.MULTISELECT,
                label: 'Account Summary', container: 'fieldgroup_dc_main'
            });
            libRep.addSelectionMulti(custpage_account_parent, 'account', c, f, true, account_parent);

            let f_acc = [['issummary', 'is', 'F'], 'and', ['custrecord_scv_acc_limit_rp', 'is', 'F']];
            let custpage_account = form.addField({
                id: 'custpage_account',
                type: serverWidget.FieldType.MULTISELECT,
                label: 'Account',
                container: container
            });
            libRep.addSelectionMulti(custpage_account, 'account', c, f_acc, true, account);

            let custpage_not_level= form.addField({
                id: 'custpage_not_level',
                type: serverWidget.FieldType.CHECKBOX,
                label: 'Not level',
                container: container
            }).updateLayoutType({layoutType: serverWidget.FieldLayoutType.STARTROW});
            custpage_not_level.defaultValue = parameters.custpage_not_level || 'F';

            let custpage_acc_level= form.addField({
                id: 'custpage_acc_level',
                type: serverWidget.FieldType.SELECT,
                label: 'Account level',
                container: container,
                source: 'customlist_scv_acc_level'
            }).updateLayoutType({layoutType: serverWidget.FieldLayoutType.ENDROW});
            custpage_acc_level.defaultValue = parameters.custpage_acc_level || '';

            let custpage_currencyvalue= form.addField({
                id: 'custpage_currencyvalue',
                type: serverWidget.FieldType.SELECT,
                label: 'Currency',
                container: container,
                source: 'currency',
            });
            custpage_currencyvalue.defaultValue = parameters.custpage_currencyvalue || '';

            let custpage_classification= form.addField({
                id: 'custpage_classification',
                type: serverWidget.FieldType.SELECT,
                label: 'Class',
                container: container,
                source: 'classification'
            });
            custpage_classification.defaultValue = parameters.custpage_classification || '';

            let custpage_location= form.addField({
                id: 'custpage_location',
                type: serverWidget.FieldType.SELECT,
                label: 'Location',
                container: container,
                source: 'location'
            });
            custpage_location.defaultValue = parameters.custpage_location || '';

            let custpage_department= form.addField({
                id: 'custpage_department',
                type: serverWidget.FieldType.SELECT,
                label: 'Department',
                container: container,
                source: 'department'
            });
            custpage_department.defaultValue = parameters.custpage_department || '';

            let custpage_kmcp= form.addField({
                id: 'custpage_kmcp',
                type: serverWidget.FieldType.SELECT,
                label: 'Mã phí',
                container: container,
                source: 'customrecord_cseg_scv_kmcp'
            });
            custpage_kmcp.defaultValue = parameters.custpage_kmcp || '';

            let custpage_debitloanagreement= form.addField({
                id: 'custpage_debitloanagreement',
                type: serverWidget.FieldType.MULTISELECT,
                label: 'DEBIT/LOAN AGREEMENT',
                container: container,
                source: 'customrecord_cseg_scv_loan'
            });
            custpage_debitloanagreement.defaultValue = parameters.custpage_debitloanagreement || [];

            let custpage_paymentcode= form.addField({
                id: 'custpage_paymentcode',
                type: serverWidget.FieldType.SELECT,
                label: 'Mã thanh toán',
                container: container,
                source: 'customrecord_scv_ma_tt_xnk'
            });
            custpage_paymentcode.defaultValue = parameters.custpage_paymentcode || [];

            let custpage_entity = form.addField({
                id: 'custpage_entity',
                type: serverWidget.FieldType.TEXT,
                label: 'Name',
                container: container
            });
            custpage_entity.defaultValue = parameters.custpage_entity;

            let custpage_category = form.addField({
                id: 'custpage_category',
                type: serverWidget.FieldType.MULTISELECT,
                label: 'Phân nhóm',
                container: container,
                source: 'customrecord_scv_entity_category'
            });
            if (parameters.custpage_category) {
                custpage_category.defaultValue = parameters.custpage_category.split(',');
            }
        }

        const pushFiltersTotal = (f, parameters, subsidiary, entity, currencyvalue, account, debitloanagreement, date_dauky, currencytext) => {
            f.push(search.createFilter({name: 'subsidiary', operator: search.Operator.ANYOF, values: subsidiary}));
            if (entity) {
                f.push(search.createFilter({
                    name: 'formulatext', operator: search.Operator.CONTAINS, values: entity,
                    formula: "case when {type} like 'Journal%' and {account} like '3311%' then {entity} else nvl(nvl(nvl(nvl(nvl({entity}, {customer.companyname}), {vendorline.companyname}),{vendor.entityid}),{name}),{custbody_scv_payee}) end"
                }));
            }
            if (currencyvalue) {
                if (currencyvalue === CURRENCY_VND) {
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
            if (!!debitloanagreement) {
                f.push(search.createFilter({
                    name: 'custbody_scv_loa',
                    operator: search.Operator.ANYOF,
                    values: debitloanagreement
                }));
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
            if (!!parameters.custpage_category) {
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
            if (!!parameters.custpage_paymentcode) {
                f.push(search.createFilter({
                    name: 'custbody_scv_matt_xnk',
                    operator: search.Operator.IS,
                    values: parameters.custpage_paymentcode
                }));
            }
        }

        const pushFiltersDetail = (f, parameters, subsidiary, entity, currencyvalue, account, debitloanagreement, date_dauky, date_cuoiky, currencytext) => {
            f.push(search.createFilter({name: 'subsidiary', operator: search.Operator.ANYOF, values: subsidiary}));
            f.push(search.createFilter({name: 'trandate', operator: search.Operator.ONORAFTER, values: date_dauky}));
            f.push(search.createFilter({name: 'trandate', operator: search.Operator.ONORBEFORE, values: date_cuoiky}));

            if(!!entity) {
                if(entity === '- None -') {
                    f.push(search.createFilter({name: 'formulatext', operator: search.Operator.ISEMPTY, values: '',
                        formula: "case when {type} like 'Journal%' and {account} like '3311%' then {entity} else nvl(nvl(nvl(nvl(nvl({entity}, {customer.companyname}), {vendorline.companyname}),{vendor.entityid}),{name}),{custbody_scv_payee}) end"}));
                } else {
                    f.push(search.createFilter({name: 'formulatext', operator: search.Operator.CONTAINS, values: entity,
                        formula: "case when {type} like 'Journal%' and {account} like '3311%' then {entity} else nvl(nvl(nvl(nvl(nvl({entity}, {customer.companyname}), {vendorline.companyname}),{vendor.entityid}),{name}),{custbody_scv_payee}) end"}));
                }
            }
            if (!!currencyvalue) {
                if (currencyvalue === CURRENCY_VND) {
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
            if (!!debitloanagreement) {
                f.push(search.createFilter({
                    name: 'custbody_scv_loa',
                    operator: search.Operator.ANYOF,
                    values: debitloanagreement
                }));
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
            if (!!parameters.custpage_paymentcode) {
                f.push(search.createFilter({
                    name: 'custbody_scv_matt_xnk',
                    operator: search.Operator.IS,
                    values: parameters.custpage_paymentcode
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
            if (!!parameters.custpage_category) {
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

        const createFieldData = (form, objData) => {
            let fieldData = form.addField({
                id: 'custpage_fielddata',
                type: serverWidget.FieldType.LONGTEXT,
                label: ' '
            });
            fieldData.updateDisplayType({displayType : serverWidget.FieldDisplayType.HIDDEN});

            let fieldDataStr = objData ? (typeof objData === 'object' ? JSON.stringify(objData) : objData) : '';

            if (fieldDataStr.length > MAX_INLINE_DATA_LENGTH) {
                fieldDataStr = fieldDataStr.substring(0, MAX_INLINE_DATA_LENGTH);
            }

            fieldData.defaultValue = fieldDataStr;
        }

        function getFromDate(_fromdt){
            if(libRep.isContainValue(_fromdt)){
                return _fromdt
            }
            let d = new Date();
            return new Date(d.getFullYear(),d.getMonth(),"01");
        }

        function getToDate(_todt){
            if(libRep.isContainValue(_todt)){
                return _todt
            }
            return new Date();
        }

        function getSublistColMaster() {
            let field_select = 'custpage_sl_select';
            let sl_ct = 'custpage_sl_ct';

            let col_sl_ctcdps = [
                {id: 'trandate', label: 'Date', type: 'date', display: serverWidget.FieldDisplayType.INLINE}
                //,{id: 'tranid', label: 'Số phiếu', type: 'text', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'ngayct', label: 'Ngày CT', type: 'date', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'soct', label: 'Số CT', type: 'text', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'ordertype_text', label: 'Order Type', type: 'text', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'diengiai', label: 'Diễn Giải', type: 'text', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'tygia', label: 'Tỷ giá', type: 'float', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'phatsinhno', label: 'Phát sinh: Nợ', type: 'float', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'phatsinhco', label: 'Phát sinh: Có', type: 'float', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'soduno', label: 'Số dư: Nợ', type: 'float', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'soduco', label: 'Số dư: Có', type: 'float', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'phatsinhnovnd', label: 'Phát sinh: Nợ (VND)', type: 'float', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'phatsinhcovnd', label: 'Phát sinh: Có (VND)', type: 'float', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'sodunovnd', label: 'Số dư: Nợ (VND)', type: 'float', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'soducovnd', label: 'Số dư: Có (VND)', type: 'float', display: serverWidget.FieldDisplayType.INLINE}
                //,{id: 'typebold', label: 'CP', type: 'text', display: serverWidget.FieldDisplayType.HIDDEN}
            ];

            let col_sl_ctcdps_nocurrency = [
                {id: 'trandate', label: 'Date', type: 'date', display: serverWidget.FieldDisplayType.INLINE}
                //,{id: 'tranid', label: 'Số phiếu', type: 'text', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'ngayct', label: 'Ngày CT', type: 'date', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'soct', label: 'Số CT', type: 'text', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'ordertype_text', label: 'Order Type', type: 'text', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'diengiai', label: 'Diễn Giải', type: 'text', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'phatsinhnovnd', label: 'Phát sinh: Nợ', type: 'float', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'phatsinhcovnd', label: 'Phát sinh: Có', type: 'float', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'sodunovnd', label: 'Số dư: Nợ', type: 'float', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'soducovnd', label: 'Số dư: Có', type: 'float', display: serverWidget.FieldDisplayType.INLINE}
            ];

            let col_ss_ctcdps = [['account', 0], ['account_text', 0, 'sltext'], ['trandate', 1], ['tranid', 2], ['ngayct', 3], ['soct', 4], ['diengiai', 5]
                , ['tygia', 6], ['phatsinhno', 7], ['phatsinhnovnd', 8], ['phatsinhco', 9], ['phatsinhcovnd', 10], ['id', 11], ['ordertype', 12], ['ordertype_text', 12, 'sltext']
            ];

            let col_sl_ctcn = [
                {id: 'trandate', label: 'Date', type: 'date', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'ngayct', label: 'Ngày CT', type: 'date', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'soct', label: 'Số CT', type: 'text', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'ordertype_text', label: 'Order Type', type: 'text', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'diengiai', label: 'Diễn Giải', type: 'text', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'tygia', label: 'Tỷ giá', type: 'float', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'phatsinhno', label: 'Phát sinh: Nợ', type: 'float', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'phatsinhco', label: 'Phát sinh: Có', type: 'float', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'soduno', label: 'Số dư: Nợ', type: 'float', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'soduco', label: 'Số dư: Có', type: 'float', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'phatsinhnovnd', label: 'Phát sinh: Nợ (VND)', type: 'float', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'phatsinhcovnd', label: 'Phát sinh: Có (VND)', type: 'float', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'sodunovnd', label: 'Số dư: Nợ (VND)', type: 'float', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'soducovnd', label: 'Số dư: Có (VND)', type: 'float', display: serverWidget.FieldDisplayType.INLINE}
            ];

            let col_sl_ctcn_nt = [
                {id: 'trandate', label: 'Date', type: 'date', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'ngayct', label: 'Ngày CT', type: 'date', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'soct', label: 'Số CT', type: 'text', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'ordertype_text', label: 'Order Type', type: 'text', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'diengiai', label: 'Diễn Giải', type: 'text', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'tygia', label: 'Tỷ giá', type: 'float', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'phatsinhno', label: 'Phát sinh: Nợ', type: 'float', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'phatsinhco', label: 'Phát sinh: Có', type: 'float', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'soduno', label: 'Số dư: Nợ', type: 'float', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'soduco', label: 'Số dư: Có', type: 'float', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'phatsinhnovnd', label: 'Phát sinh: Nợ (VND)', type: 'float', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'phatsinhcovnd', label: 'Phát sinh: Có (VND)', type: 'float', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'sodunovnd', label: 'Số dư: Nợ (VND)', type: 'float', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'soducovnd', label: 'Số dư: Có (VND)', type: 'float', display: serverWidget.FieldDisplayType.INLINE}
            ];

            let col_sl_ctcn_nocurrency = [
                {id: 'trandate', label: 'Date', type: 'date', display: serverWidget.FieldDisplayType.INLINE}
                //,{id: 'tranid', label: 'Số phiếu', type: 'text', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'ngayct', label: 'Ngày CT', type: 'date', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'soct', label: 'Số CT', type: 'text', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'ordertype_text', label: 'Order Type', type: 'text', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'diengiai', label: 'Diễn Giải', type: 'text', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'phatsinhnovnd', label: 'Phát sinh: Nợ', type: 'float', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'phatsinhcovnd', label: 'Phát sinh: Có', type: 'float', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'sodunovnd', label: 'Số dư: Nợ', type: 'float', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'soducovnd', label: 'Số dư: Có', type: 'float', display: serverWidget.FieldDisplayType.INLINE}
            ];

            let col_ss_ctcn = [['account', 0], ['account_text', 0], ['trandate', 1], ['tranid', 2], ['ngayct', 3], ['soct', 4], ['diengiai', 5]
                , ['tygia', 7], ['phatsinhno', 8], ['phatsinhnovnd', 9], ['phatsinhco', 10], ['phatsinhcovnd', 11], ['id', 12], ['ordertype', 13], ['ordertype_text', 13, 'sltext']
            ];
            let col_ss_ctcn_nt = [['account', 0], ['account_text', 0], ['trandate', 1], ['sophieu', 2], ['ngayct', 3], ['soct', 4], ['diengiai', 5], ['exdate', 6], ['tygia', 7],
                ['phatsinhno', 8], ['phatsinhnovnd', 9], ['phatsinhco', 10], ['phatsinhcovnd', 11], ['id', 12], ['ordertype', 13], ['ordertype_text', 13, 'sltext'], ['currency', 14, 'sltext']];

            let col_ss_cttotal = [['account', 0], ['account_text', 0, 'sltext'], ['soduno', 1], ['sodunovnd', 2], ['soduco', 3], ['soducovnd', 4]];

            let col_ss_ctcntotal = [['account', 0], ['account_text', 0], ['soduno', 1], ['sodunovnd', 2], ['soduco', 3], ['soducovnd', 4]];

            let OBJ_REPORT_TYPE = {
                CT_CDPS: "customsearch_scv_vas_cdpsdt_limit",
                CT_CN: "customsearch_scv_vas_ctcndt_limit",
                CT_CN_NT: "customsearch_scv_vas_ctcndt_limit_nt",
                CT_SQT: "customsearch_scv_vas_sqtdt_limit",
                CT_TOTAL: "customsearch_scv_vas_dt_total_limit",
                CTCN_TOTAL: 'customsearch_scv_vas_ctcndt_total_nt',
                CTCN_NT_TOTAL: "customsearch_scv_vas_ctcndt_total_nt",
            };

            let col_sl_ctsqt = [
                {id: 'trandate', label: 'Date', type: 'date', display: serverWidget.FieldDisplayType.INLINE}
                //,{id: 'tranid', label: 'Số phiếu', type: 'text', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'ngayct', label: 'Ngày CT', type: 'date', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'soct', label: 'Số CT', type: 'text', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'ordertype_text', label: 'Order Type', type: 'text', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'diengiai', label: 'Diễn Giải', type: 'text', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'doituong', label: 'Đối tượng', type: 'text', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'tygia', label: 'Tỷ giá', type: 'float', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'phatsinhno', label: 'Thu tiền', type: 'float', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'phatsinhco', label: 'Chi tiền', type: 'float', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'soduno', label: 'Số dư: Nợ', type: 'float', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'soduco', label: 'Số dư: Có', type: 'float', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'phatsinhnovnd', label: 'Thu tiền (VND)', type: 'float', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'phatsinhcovnd', label: 'Chi tiền (VND)', type: 'float', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'sodunovnd', label: 'Số dư: Nợ (VND)', type: 'float', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'soducovnd', label: 'Số dư: Có (VND)', type: 'float', display: serverWidget.FieldDisplayType.INLINE}
            ];

            let col_sl_ctsqt_nocurrency = [
                {id: 'trandate', label: 'Date', type: 'date', display: serverWidget.FieldDisplayType.INLINE}
                //,{id: 'tranid', label: 'Số phiếu', type: 'text', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'ngayct', label: 'Ngày CT', type: 'date', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'soct', label: 'Số CT', type: 'text', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'ordertype_text', label: 'Order Type', type: 'text', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'diengiai', label: 'Diễn Giải', type: 'text', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'doituong', label: 'Đối tượng', type: 'text', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'phatsinhnovnd', label: 'Thu tiền', type: 'float', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'phatsinhcovnd', label: 'Chi tiền', type: 'float', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'sodunovnd', label: 'Số dư: Nợ', type: 'float', display: serverWidget.FieldDisplayType.INLINE}
                ,{id: 'soducovnd', label: 'Số dư: Có', type: 'float', display: serverWidget.FieldDisplayType.INLINE}
            ];

            let col_ss_ctsqt = [['account', 0], ['account_text', 0, 'sltext'], ['trandate', 1], ['tranid', 2], ['ngayct', 3], ['soct', 4], ['diengiai', 5]
                , ['doituong', 6], ['tygia', 8], ['phatsinhno', 9], ['phatsinhnovnd', 10], ['phatsinhco', 11], ['phatsinhcovnd', 12], ['id', 13], ['ordertype', 14], ['ordertype_text', 14, 'sltext']
            ];

            return {field_select: field_select, sl_ct: sl_ct, col_sl_ctcdps: col_sl_ctcdps, col_sl_ctcdps_nocurrency: col_sl_ctcdps_nocurrency
                , col_ss_ctcdps: col_ss_ctcdps, col_sl_ctcn: col_sl_ctcn, col_sl_ctcn_nocurrency: col_sl_ctcn_nocurrency, col_ss_ctcn: col_ss_ctcn
                , col_ss_cttotal: col_ss_cttotal, col_ss_ctcntotal: col_ss_ctcntotal, OBJ_REPORT_TYPE: OBJ_REPORT_TYPE
                , col_sl_ctsqt: col_sl_ctsqt, col_sl_ctsqt_nocurrency: col_sl_ctsqt_nocurrency, col_ss_ctsqt: col_ss_ctsqt
                ,col_sl_ctcn_nt: col_sl_ctcn_nt, col_ss_ctcn_nt: col_ss_ctcn_nt}
        }

        const foreignCurrency = (value) => {
            return !!value && value !== CURRENCY_VND;
        }

        return {onRequest}

    });
