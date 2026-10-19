/**
 * Shared calculation and aggregation logic for VAS TT v4.
 */
define(['N/url'],
    function (url) {
        const _export = {};

        const NUMERIC_KEYS = [
            'sodudauno', 'sodudauco', 'phatsinhno', 'phatsinhco', 'soducuoino', 'soducuoico',
            'sodudaunovnd', 'sodudaucovnd', 'phatsinhnovnd', 'phatsinhcovnd', 'soducuoinovnd', 'soducuoicovnd'
        ];

        // Regex compiled once, dùng lại nhiều lần thay vì tạo mới mỗi lần gọi safeParseFloat
        const COMMA_RE = /,/g;

        function safeParseFloat(value) {
            if (value === null || value === undefined || value === '') return 0;
            if (typeof value === 'number') return isNaN(value) ? 0 : value;
            const num = parseFloat(String(value).replace(COMMA_RE, ''));
            return isNaN(num) ? 0 : num;
        }

        _export.NUMERIC_KEYS = NUMERIC_KEYS;

        _export.isForeignCurrency = function (value) {
            return !!value && value !== '1';
        };

        _export.initObjTotal = function () {
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
        };

        _export.plusTotal = function (objTotal, objdetail) {
            objTotal.sodudauno += (objdetail.sodudauno || 0);
            objTotal.sodudauco += (objdetail.sodudauco || 0);
            objTotal.phatsinhno += Number(objdetail.phatsinhno || 0);
            objTotal.phatsinhco += Number(objdetail.phatsinhco || 0);
            objTotal.soducuoino += (objdetail.soducuoino || 0);
            objTotal.soducuoico += (objdetail.soducuoico || 0);
            objTotal.sodudaunovnd += (objdetail.sodudaunovnd || 0);
            objTotal.sodudaucovnd += (objdetail.sodudaucovnd || 0);
            objTotal.phatsinhnovnd += Number(objdetail.phatsinhnovnd || 0);
            objTotal.phatsinhcovnd += Number(objdetail.phatsinhcovnd || 0);
            objTotal.soducuoinovnd += (objdetail.soducuoinovnd || 0);
            objTotal.soducuoicovnd += (objdetail.soducuoicovnd || 0);
        };

        _export.reCalculationDauCuoi = function (objdetail, reportype, OBJ_REPORT_TYPE) {
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
        };

        _export.isContainValue = function (objdetail) {
            let iscontain = false;
            if (!!objdetail) {
                for (let i = 0; i < NUMERIC_KEYS.length; i++) {
                    if ((objdetail[NUMERIC_KEYS[i]] || 0) > 0) {
                        iscontain = true;
                        break;
                    }
                }
            }
            return iscontain;
        };

        _export.buildBaseDetailUrl = function (baseUrl, parameters, detailReportType) {
            let result = baseUrl;
            result += '&custpage_reportype=' + detailReportType;
            result += '&custpage_subsidiary=' + (parameters.custpage_subsidiary || '');
            result += '&custpage_date_dauky=' + (parameters.custpage_date_dauky || '');
            result += '&custpage_date_cuoiky=' + (parameters.custpage_date_cuoiky || '');
            result += '&custpage_account_parent=' + (parameters.custpage_account_parent || '');
            if (parameters.custpage_currencyvalue) {
                result += '&custpage_currencyvalue=' + parameters.custpage_currencyvalue;
            }
            return result;
        };

        _export.appendEntityParam = function (baseUrl, entity) {
            let result = baseUrl;
            if (entity) {
                result += '&custpage_entity=' + encodeURIComponent(entity);
            }
            return result;
        };

        _export.createDetailUrl = function (objdetail, reportype, OBJ_REPORT_TYPE, isparent, baseUrl) {
            if (!baseUrl) return '';
            let urlTemp = '';
            let linkText = '';
            if (reportype === OBJ_REPORT_TYPE.TT_CN && !isparent) {
                if (objdetail.doituong) {
                    linkText = objdetail.doituong;
                    urlTemp = _export.appendEntityParam(baseUrl, objdetail.doituong);
                }
            } else if (reportype === OBJ_REPORT_TYPE.TT_CDPS) {
                linkText = objdetail.accnumber;
                urlTemp = baseUrl + '&custpage_account=' + objdetail.account;
            }

            if (urlTemp && linkText) {
                return '<a href="' + urlTemp + '&isearch=T" target="_blank">' + linkText + '</a>';
            }
            return '';
        };

        _export.processCongNoReport = function (list_detail, list_acc, reportype, OBJ_REPORT_TYPE, OBJ_REPORT_TYPE_DETAIL, parameters, detailScriptCfg) {
            let objdata = [];
            let urlChitiet = '';
            let reportTypeNt = parameters.custpage_reportype;
            let scriptCfg = detailScriptCfg || {
                scriptId: 'customscript_scv_sl_rp_vas_dt_v3',
                deploymentId: 'customdeploy_scv_sl_rp_vas_dt_v3'
            };

            if (reportype === OBJ_REPORT_TYPE.TT_CN || reportype === OBJ_REPORT_TYPE.TT_CN_NT) {
                let baseUrl = url.resolveScript({
                    scriptId: scriptCfg.scriptId,
                    deploymentId: scriptCfg.deploymentId,
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
                urlChitiet = _export.buildBaseDetailUrl(baseUrl, parameters, detailReportType);
            }

            // Build Map một lần O(n) thay vì Array.find O(n) cho mỗi dòng
            const accMap = new Map();
            for (let i = 0; i < list_acc.length; i++) {
                accMap.set(String(list_acc[i].id), list_acc[i]);
            }

            let dataTree = {};

            for (let i = 0; i < list_detail.length; i++) {
                const detail = list_detail[i];
                if (!_export.isContainValue(detail)) continue;

                let currentDetail = {...detail};
                if (parameters.custpage_netnoco === 'T') {
                    _export.reCalculationDauCuoi(currentDetail, reportype, OBJ_REPORT_TYPE);
                }

                const phanloai = currentDetail.phanloai || 'Chưa phân loại';
                const doituong = currentDetail.doituong || 'Chưa có đối tượng';

                if (!dataTree[phanloai]) {
                    dataTree[phanloai] = {total: _export.initObjTotal(), doituong_map: {}};
                }
                if (!dataTree[phanloai].doituong_map[doituong]) {
                    dataTree[phanloai].doituong_map[doituong] = {total: _export.initObjTotal(), accounts: []};
                }

                // O(1) lookup
                let acc_parent = accMap.get(String(currentDetail.account));
                currentDetail.accnumber = acc_parent ? acc_parent.acctnumber : '';
                currentDetail.accname = acc_parent ? acc_parent.accountsearchdisplayname : '';
                currentDetail.url_chitiet = _export.createDetailUrl(currentDetail, reportype, OBJ_REPORT_TYPE, false, urlChitiet);

                dataTree[phanloai].doituong_map[doituong].accounts.push(currentDetail);
                _export.plusTotal(dataTree[phanloai].doituong_map[doituong].total, currentDetail);
            }

            let objTotalAll = _export.initObjTotal();
            objTotalAll.doituong = 'TỔNG CỘNG';
            objTotalAll.lineName = 'total';
            objTotalAll.typebold = '2';

            const sortedPhanLoaiKeys = Object.keys(dataTree).sort();
            // Cache sortedDoiTuongKeys tại đây, tránh sort lại ở pass render
            const sortedDoiTuongKeysCache = {};
            for (let i = 0; i < sortedPhanLoaiKeys.length; i++) {
                const plKey = sortedPhanLoaiKeys[i];
                const phanloaiNode = dataTree[plKey];
                phanloaiNode.total = _export.initObjTotal();

                const dtKeys = Object.keys(phanloaiNode.doituong_map).sort();
                sortedDoiTuongKeysCache[plKey] = dtKeys;

                for (let j = 0; j < dtKeys.length; j++) {
                    const doituongNode = phanloaiNode.doituong_map[dtKeys[j]];
                    if (parameters.custpage_netnoco === 'T') {
                        _export.reCalculationDauCuoi(doituongNode.total, reportype, OBJ_REPORT_TYPE);
                    }
                    _export.plusTotal(phanloaiNode.total, doituongNode.total);
                }

                _export.plusTotal(objTotalAll, phanloaiNode.total);
            }

            objdata.push(objTotalAll);

            for (let i = 0; i < sortedPhanLoaiKeys.length; i++) {
                const phanloaiKey = sortedPhanLoaiKeys[i];
                const phanloaiNode = dataTree[phanloaiKey];
                let phanloaiRow = phanloaiNode.total;
                phanloaiRow.doituong = phanloaiKey;
                phanloaiRow.typebold = '2';
                phanloaiRow.lineName = 'pl';
                phanloaiRow.url_chitiet = _export.createDetailUrl(phanloaiRow, reportype, OBJ_REPORT_TYPE, true, urlChitiet);
                objdata.push(phanloaiRow);

                // Dùng cache, không sort lại
                const dtKeys = sortedDoiTuongKeysCache[phanloaiKey];
                for (let j = 0; j < dtKeys.length; j++) {
                    const doituongKey = dtKeys[j];
                    const doituongNode = phanloaiNode.doituong_map[doituongKey];
                    let doituongRow = doituongNode.total;
                    const doituongUrlHtml = _export.createDetailUrl({doituong: doituongKey}, reportype, OBJ_REPORT_TYPE, false, urlChitiet);
                    doituongRow.doituong = doituongUrlHtml ? doituongUrlHtml : doituongKey;
                    doituongRow.typebold = '2';
                    objdata.push(doituongRow);

                    for (let k = 0; k < doituongNode.accounts.length; k++) {
                        const accountRow = doituongNode.accounts[k];
                        accountRow.typebold = '0';
                        accountRow.doituong = '';
                        objdata.push(accountRow);
                    }
                }
            }

            // Gán line index trực tiếp bằng for loop, bỏ forEach + filter dư
            for (let i = 0; i < objdata.length; i++) { objdata[i].line = i; }
            return objdata;
        };

        _export.setSublistValueLine = function (colids, list_detail, currencyvalue, fieldgroup, list_acc, not_level, acc_level, reportype, reportTypeNt, OBJ_REPORT_TYPE, OBJ_REPORT_TYPE_DETAIL, linestart, parameters, detailScriptCfg) {
            const isCongNoReport = reportype === OBJ_REPORT_TYPE.TT_CN || reportTypeNt === OBJ_REPORT_TYPE.TT_CN_NT;
            if (isCongNoReport) {
                return _export.processCongNoReport(list_detail, list_acc, reportype, OBJ_REPORT_TYPE, OBJ_REPORT_TYPE_DETAIL, parameters, detailScriptCfg);
            }

            let objdata = [];
            let line = 0;
            let list_total = {};
            let account_pre = '';
            let acc_parent_num_pre = '';
            let acc_parent, acc_parent_num = '', acc_parent_name = '', acc_lv, objTotal;

            let urlChitiet = '';
            if (reportype === OBJ_REPORT_TYPE.TT_CN || reportype === OBJ_REPORT_TYPE.TT_CN_NT || reportype === OBJ_REPORT_TYPE.TT_CDPS) {
                let scriptCfg = detailScriptCfg || {
                    scriptId: 'customscript_scv_sl_rp_vas_dt_v3',
                    deploymentId: 'customdeploy_scv_sl_rp_vas_dt_v3'
                };
                let baseUrl = url.resolveScript({
                    scriptId: scriptCfg.scriptId,
                    deploymentId: scriptCfg.deploymentId,
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
                urlChitiet = _export.buildBaseDetailUrl(baseUrl, parameters, detailReportType);
            }

            let objTotalAll = _export.initObjTotal();
            objTotalAll.accnumber = '';
            objTotalAll.accname = 'Total';
            objTotalAll.typebold = '2';
            objTotalAll.line = line;
            objdata[line] = objTotalAll;
            line++;

            let netnoco = parameters.custpage_netnoco;

            // Build Map một lần O(m) thay vì Array.find O(m) cho mỗi trong n dòng
            const accMapSub = new Map();
            for (let ai = 0; ai < list_acc.length; ai++) {
                accMapSub.set(String(list_acc[ai].id), list_acc[ai]);
            }

            for (let i = 0; i < list_detail.length; i++) {
                let objdetail = {...list_detail[i]};
                _export.reCalculationDauCuoi(objdetail, reportype, OBJ_REPORT_TYPE);
                _export.plusTotal(objTotalAll, objdetail);

                let account = objdetail[fieldgroup.account];
                acc_parent = accMapSub.get(String(objdetail.account));
                if (!acc_parent) {
                    if (_export.isContainValue(objdetail)) {
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
                            if (!!acc_level && acc_level < acc_lv) acc_lv = acc_level;
                            for (let iacc = 0; iacc < acc_lv; iacc++) {
                                let parent_acc_num = acc_parent_num_pre[iacc];
                                if (netnoco === 'T') _export.reCalculationDauCuoi(list_total[parent_acc_num], reportype, OBJ_REPORT_TYPE);
                                list_total[parent_acc_num].url_chitiet = _export.createDetailUrl(list_total[parent_acc_num], reportype, OBJ_REPORT_TYPE, true, urlChitiet);
                            }
                        }
                    }
                    acc_parent_num = '';
                    acc_parent_name = '';
                    acc_lv = -1;
                    if (!!acc_parent && !!acc_parent.custrecord_scv_cct_acc_parent) {
                        acc_parent_num = acc_parent.custrecord_scv_cct_acc_parent.split('//');
                        acc_parent_name = acc_parent.custrecord_scv_cct_acc_parent_name.split('//');
                        acc_lv = acc_parent_num.length;
                        if (!!acc_level && acc_level < acc_lv) acc_lv = acc_level;

                        for (let iacc = 0; iacc < acc_lv; iacc++) {
                            objTotal = list_total[acc_parent_num[iacc]];
                            if (!objTotal) {
                                objTotal = _export.initObjTotal();
                                objTotal.accnumber = acc_parent_num[iacc];
                                objTotal.accname = acc_parent_name[iacc];
                                objTotal.line = line;
                                objTotal.typebold = '2';
                                objdata[line] = objTotal;
                                list_total[acc_parent_num[iacc]] = objTotal;
                                line++;
                            }
                            _export.plusTotal(objTotal, objdetail);
                            if (netnoco === 'T') _export.reCalculationDauCuoi(objTotal, reportype, OBJ_REPORT_TYPE);
                        }
                    }

                    if (!acc_level || acc_level > acc_lv) {
                        objTotal = list_total[acc_parent.acctnumber];
                        if (!objTotal) {
                            objTotal = _export.initObjTotal();
                            objTotal.accnumber = acc_parent.acctnumber;
                            objTotal.accname = acc_parent.accountsearchdisplayname;
                            objTotal.line = line;
                            objdata[line] = objTotal;
                            list_total[acc_parent.acctnumber] = objTotal;
                            line++;
                        }
                        _export.plusTotal(objTotal, objdetail);
                        if (netnoco === 'T') _export.reCalculationDauCuoi(objTotal, reportype, OBJ_REPORT_TYPE);
                        objTotal.account = objdetail.account;
                        objTotal.url_chitiet = _export.createDetailUrl(objTotal, reportype, OBJ_REPORT_TYPE, false, urlChitiet);
                    }
                } else {
                    objdetail.line = line;
                    objdetail.url_chitiet = _export.createDetailUrl(objdetail, reportype, OBJ_REPORT_TYPE, false, urlChitiet);
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
                    if (netnoco === 'T') _export.reCalculationDauCuoi(list_total[parent_acc_num], reportype, OBJ_REPORT_TYPE);
                    list_total[parent_acc_num].url_chitiet = _export.createDetailUrl(list_total[parent_acc_num], reportype, OBJ_REPORT_TYPE, true, urlChitiet);
                }
            }

            return objdata.filter(function (item) { return item; });
        };

        // ─── Column definitions (SL + CS dùng chung — giống mfg_result.getColumns) ───

        _export.getColumns = function (reportType, currencyValue, isCdps, isVay) {
            const isCnNt = reportType === 'customsearch_scv_vas_cntt_limit_nt';
            if (isCnNt) {
                return [
                    ..._export.getBaseColumns(isCdps, isVay),
                    _export.getNestedAriseColumns(),
                    _export.getNestedBalanceColumns(),
                    _export.getNestedFinalColumns()
                ];
            } else if (currencyValue) {
                return _export.getCurrencyColumns(isCdps, isVay);
            } else {
                return _export.getDefaultColumns(isCdps, isVay);
            }
        };

        _export.getBaseColumns = function (isCdps, isVay) {
            let columns;
            if (!isCdps) {
                columns = [
                    { dataField: 'doituong',  caption: 'Đối tượng',     dataType: 'string', width: 300 },
                    { dataField: 'accnumber', caption: 'Mã tài khoản',  dataType: 'string', width: 100 },
                    { dataField: 'accname',   caption: 'Tên tài khoản', dataType: 'string', width: 300 },
                ];
            } else {
                columns = [
                    { dataField: 'url_chitiet', caption: 'Mã tài khoản',  dataType: 'string', width: 100 },
                    { dataField: 'accname',     caption: 'Tên tài khoản', dataType: 'string', width: 300 },
                ];
            }
            if (isVay) {
                columns.push({ dataField: 'kheuocvay_text', caption: 'Khế ước vay', dataType: 'string', width: 200 });
            }
            return columns;
        };

        _export.getNestedAriseColumns = function () {
            return {
                caption: 'Số dư đầu',
                columns: [
                    { dataField: 'sodudauno', caption: 'Nợ', dataType: 'number', format: '#,##0.00', formatXls: '#,##0.00', alignment: 'right' },
                    { dataField: 'sodudauco', caption: 'Có', dataType: 'number', format: '#,##0.00', formatXls: '#,##0.00', alignment: 'right' },
                ]
            };
        };

        _export.getNestedBalanceColumns = function () {
            return {
                caption: 'Số phát sinh',
                columns: [
                    { dataField: 'phatsinhno', caption: 'Nợ', dataType: 'number', format: '#,##0.00', formatXls: '#,##0.00', alignment: 'right' },
                    { dataField: 'phatsinhco', caption: 'Có', dataType: 'number', format: '#,##0.00', formatXls: '#,##0.00', alignment: 'right' },
                ]
            };
        };

        _export.getNestedFinalColumns = function () {
            return {
                caption: 'Số dư cuối',
                columns: [
                    { dataField: 'soducuoino', caption: 'Nợ', dataType: 'number', format: '#,##0.00', formatXls: '#,##0.00', alignment: 'right' },
                    { dataField: 'soducuoico', caption: 'Có', dataType: 'number', format: '#,##0.00', formatXls: '#,##0.00', alignment: 'right' },
                ]
            };
        };

        _export.getDefaultColumns = function (isCdps, isVay) {
            const columns = _export.getBaseColumns(isCdps, isVay);
            columns.push(
                { dataField: 'sodudaunovnd',  caption: 'Số dư đầu: Nợ',  dataType: 'number', format: '###,###,##0', formatXls: '#,##0', alignment: 'right' },
                { dataField: 'sodudaucovnd',  caption: 'Số dư đầu: Có',  dataType: 'number', format: '###,###,##0', formatXls: '#,##0', alignment: 'right' },
                { dataField: 'phatsinhnovnd', caption: 'Phát sinh: Nợ',  dataType: 'number', format: '###,###,##0', formatXls: '#,##0', alignment: 'right' },
                { dataField: 'phatsinhcovnd', caption: 'Phát sinh: Có',  dataType: 'number', format: '###,###,##0', formatXls: '#,##0', alignment: 'right' },
                { dataField: 'soducuoinovnd', caption: 'Số dư cuối: Nợ', dataType: 'number', format: '###,###,##0', formatXls: '#,##0', alignment: 'right' },
                { dataField: 'soducuoicovnd', caption: 'Số dư cuối: Có', dataType: 'number', format: '###,###,##0', formatXls: '#,##0', alignment: 'right' }
            );
            return columns;
        };

        _export.getCurrencyColumns = function (isCdps, isVay) {
            const columns = _export.getBaseColumns(isCdps, isVay);
            columns.push(
                { dataField: 'sodudauno',     caption: 'Số dư đầu: Nợ (NT)',    dataType: 'number', format: '#,##0.00',    formatXls: '#,##0.00', alignment: 'right' },
                { dataField: 'sodudauco',     caption: 'Số dư đầu: Có (NT)',    dataType: 'number', format: '#,##0.00',    formatXls: '#,##0.00', alignment: 'right' },
                { dataField: 'phatsinhno',    caption: 'Phát sinh: Nợ (NT)',    dataType: 'number', format: '#,##0.00',    formatXls: '#,##0.00', alignment: 'right' },
                { dataField: 'phatsinhco',    caption: 'Phát sinh: Có (NT)',    dataType: 'number', format: '#,##0.00',    formatXls: '#,##0.00', alignment: 'right' },
                { dataField: 'soducuoino',    caption: 'Số dư cuối: Nợ (NT)',  dataType: 'number', format: '#,##0.00',    formatXls: '#,##0.00', alignment: 'right' },
                { dataField: 'soducuoico',    caption: 'Số dư cuối: Có (NT)',  dataType: 'number', format: '#,##0.00',    formatXls: '#,##0.00', alignment: 'right' },
                { dataField: 'sodudaunovnd',  caption: 'Số dư đầu: Nợ (VNĐ)',  dataType: 'number', format: '###,###,##0', formatXls: '#,##0',    alignment: 'right' },
                { dataField: 'sodudaucovnd',  caption: 'Số dư đầu: Có (VNĐ)',  dataType: 'number', format: '###,###,##0', formatXls: '#,##0',    alignment: 'right' },
                { dataField: 'phatsinhnovnd', caption: 'Phát sinh: Nợ (VNĐ)',  dataType: 'number', format: '###,###,##0', formatXls: '#,##0',    alignment: 'right' },
                { dataField: 'phatsinhcovnd', caption: 'Phát sinh: Có (VNĐ)',  dataType: 'number', format: '###,###,##0', formatXls: '#,##0',    alignment: 'right' },
                { dataField: 'soducuoinovnd', caption: 'Số dư cuối: Nợ (VNĐ)', dataType: 'number', format: '###,###,##0', formatXls: '#,##0',    alignment: 'right' },
                { dataField: 'soducuoicovnd', caption: 'Số dư cuối: Có (VNĐ)', dataType: 'number', format: '###,###,##0', formatXls: '#,##0',    alignment: 'right' }
            );
            return columns;
        };

        /** Flatten nested columns — giống extendGridColumnFlat của mfg_result */
        _export.flattenColumns = function (columns) {
            const flat = [];
            (function traverse(cols) {
                for (let i = 0; i < cols.length; i++) {
                    if (cols[i].columns) traverse(cols[i].columns);
                    else flat.push(cols[i]);
                }
            })(columns);
            return flat;
        };

        // ─────────────────────────────────────────────────────────────────────────

        _export.handleData = function (objData) {
            if (!objData || objData.length === 0) {
                return [];
            }

            const n = objData.length;
            const NK = NUMERIC_KEYS;
            const nk = NK.length;
            const groupSums = {};

            // Pass 1: chuẩn hoá số + gom groupSums cùng lúc, không dùng nested forEach
            for (let i = 0; i < n; i++) {
                const item = objData[i];
                for (let ki = 0; ki < nk; ki++) {
                    const k = NK[ki];
                    if (k in item) item[k] = safeParseFloat(item[k]);
                }
                const gs = item.phanloai || (item.typebold === '2' ? item.doituong : null);
                if (gs && gs.includes(':')) {
                    const pg = gs.split(':')[0].trim();
                    if (!groupSums[pg]) groupSums[pg] = _export.initObjTotal();
                    if (item.typebold === '2') _export.plusTotal(groupSums[pg], item);
                }
            }

            // Pass 2: build finalData + zero-row filter inline
            const finalData = [];
            const groupsAdded = {};

            for (let i = 0; i < n; i++) {
                const item = objData[i];
                const gs = item.phanloai || (item.typebold === '2' ? item.doituong : null);

                if (gs && gs.includes(':')) {
                    const pg = gs.split(':')[0].trim();
                    if (!groupsAdded[pg]) {
                        const s = groupSums[pg];
                        if (s) {
                            finalData.push({
                                doituong: pg, typebold: '2',
                                color: 'black', background: '#cce57f',
                                accnumber: '', accname: '', ...s
                            });
                        }
                        groupsAdded[pg] = true;
                    }
                }

                // Filter zero-row inline, tránh pass filter() riêng
                if (item.lineName === 'total') { finalData.push(item); continue; }
                let hasVal = false;
                for (let ki = 0; ki < nk; ki++) {
                    if (Math.abs(item[NK[ki]] || 0) !== 0) { hasVal = true; break; }
                }
                if (hasVal) finalData.push(item);
            }

            return finalData;
        };

        return _export;
    });

