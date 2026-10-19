/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/url', '../lib/scv_lib_cs', '../lib/scv_lib_cs_xls', '../lib/scv_lib_custom_form.js', '../common/scv_common_rp_vas_tt_v4.js'],
    function (ccr, url, libCS, libCsXLS, libCustomForm, commonRpVasTt) {
        const SCRIPT_CFG = {
            SCRIPT_ID: 'customscript_scv_sl_rp_vas_tt_v4',
            DEPLOY_UI: 'customdeploy_scv_sl_rp_vas_tt_v4',
            DEPLOY_DATA: 'customdeploy_scv_sl_rp_vas_tt_v4_svc'
        };

        function getServiceUrl() {
            return url.resolveScript({
                scriptId: SCRIPT_CFG.SCRIPT_ID,
                deploymentId: SCRIPT_CFG.DEPLOY_DATA,
                returnExternalUrl: false
            });
        }

        // ── pageInit ──────────────────────────────────────────────────────────────
        function pageInit(scriptContext) {
            if (objProjectData.isearch === 'T') {
                libCustomForm.resizeGrid('scvTabsContainer');
                renderDxTabsWithDxGrid(objProjectData);
            }
        }

        // ── Grid ──────────────────────────────────────────────────────────────────
        let _cachedAllData = [];       // dữ liệu export (tích lũy nếu cần)
        let _isFullyLoaded = false;
        let _currentGridInstance = null;
        let _searchParams = null;      // params của lần search hiện tại
        let _totalRows = 0;            // tổng số dòng server trả về

        function renderDxTabsWithDxGrid(projData) {
            let {objData, isCnNt, isCdps, isVay, currencyValue, reportype} = projData;

            let columns = commonRpVasTt.getColumns(reportype, currencyValue, isCdps, isVay);
            columns = attachCellTemplates(columns, isCdps);

            // Server đã xử lý handleData → chỉ cần decode HTML
            let firstPageData = objData;
            firstPageData.forEach(item => {
                if (item.doituong) item.doituong = decodeHtmlEntities(item.doituong);
                if (item.accname) item.accname = decodeHtmlEntities(item.accname);
            });

            // Lưu page đầu vào cache client
            _cachedAllData = firstPageData;

            const serviceUrl = getServiceUrl();
            const serverPageSize = 500; // phải khớp DATA_PAGE_SIZE bên server

            // DevExtreme CustomStore — mỗi khi user chuyển page, gọi server lấy đúng page đó
            const customStore = new DevExpress.data.CustomStore({
                load: function (loadOptions) {
                    let skip = loadOptions.skip || 0;
                    let take = loadOptions.take || 100;

                    // Tính server pageIndex dựa trên vị trí dòng cần lấy
                    let serverPageStart = Math.floor(skip / serverPageSize);
                    let serverPageEnd = Math.floor((skip + take - 1) / serverPageSize);

                    // Nếu data đã có đủ trong cache client → trả ngay
                    if (_cachedAllData.length >= skip + take || _isFullyLoaded) {
                        let sliced = _cachedAllData.slice(skip, skip + take);
                        return Promise.resolve({data: sliced, totalCount: _totalRows});
                    }

                    // Cần load thêm server pages
                    return new Promise(function (resolve) {
                        let pagesToLoad = [];
                        for (let p = serverPageStart; p <= serverPageEnd; p++) {
                            // Kiểm tra page này đã có trong cache chưa
                            let pageDataStart = p * serverPageSize;
                            if (_cachedAllData.length <= pageDataStart && !_isFullyLoaded) {
                                pagesToLoad.push(p);
                            }
                        }

                        if (pagesToLoad.length === 0) {
                            let sliced = _cachedAllData.slice(skip, skip + take);
                            resolve({data: sliced, totalCount: _totalRows});
                            return;
                        }

                        // Load pages tuần tự
                        let idx = 0;
                        function loadNextPage() {
                            if (idx >= pagesToLoad.length) {
                                let sliced = _cachedAllData.slice(skip, skip + take);
                                resolve({data: sliced, totalCount: _totalRows});
                                return;
                            }
                            let pageParams = {..._searchParams, pageIndex: pagesToLoad[idx]};
                            jQuery.ajax({
                                type: 'post', url: serviceUrl, dataType: 'json', async: true, data: pageParams
                            }).done(function (resData) {
                                let pageData = resData.objData || [];
                                pageData.forEach(item => {
                                    if (item.doituong) item.doituong = decodeHtmlEntities(item.doituong);
                                    if (item.accname) item.accname = decodeHtmlEntities(item.accname);
                                });
                                // Append vào đúng vị trí
                                _cachedAllData = _cachedAllData.concat(pageData);

                                let info = resData.info || {};
                                if (info.totalRows) _totalRows = info.totalRows;

                                // Check nếu đã load hết
                                let ttlPage = info.ttlPage || 1;
                                if (pagesToLoad[idx] >= ttlPage - 1) _isFullyLoaded = true;

                                idx++;
                                loadNextPage();
                            }).fail(function () {
                                console.error('Failed to load page', pagesToLoad[idx]);
                                idx++;
                                loadNextPage();
                            });
                        }
                        loadNextPage();
                    });
                },
                key: 'line'
            });

            const items = [{
                title: 'Báo cáo chi tiết',
                template: function () {
                    let gridDiv = $('<div>');
                    gridDiv.dxDataGrid({
                        dataSource: {store: customStore, pageSize: 100},
                        remoteOperations: {paging: true},
                        columns: columns,
                        showBorders: true,
                        rowAlternationEnabled: true,
                        columnAutoWidth: true,
                        scrolling: {mode: 'standard'},
                        paging: {pageSize: 100, enabled: true},
                        pager: {showPageSizeSelector: true, allowedPageSizes: [20, 50, 100, 200], showInfo: true, visible: true},
                        searchPanel: {visible: true, width: 300, placeholder: 'Tìm kiếm...'},
                        loadPanel: {enabled: true, text: 'Đang tải...'},
                        onCellPrepared: function (e) {
                            e.cellElement.css('font-size', '12px');
                            if (e.rowType === 'data' && e.data.typebold === '2') e.cellElement.css('font-weight', 'bold');
                            if (e.rowType === 'data' && e.data.color) e.cellElement.css('color', e.data.color);
                            if (e.rowType === 'data' && e.data.background) e.cellElement.css('background', e.data.background);
                            if (e.rowType === 'data' && e.column.dataField === 'doituong') {
                                e.cellElement.css('white-space', 'normal');
                                e.cellElement.css('word-wrap', 'break-word');
                            }
                        },
                        onContentReady: function (e) {
                            _currentGridInstance = e.component;
                        }
                    });
                    _currentGridInstance = gridDiv.dxDataGrid('instance');
                    return gridDiv;
                }
            }];

            $('#scvTabsContainer').dxTabPanel({items});
        }

        /** Gắn cellTemplate cho cột link — chỉ cần ở client side */
        function attachCellTemplates(columns, isCdps) {
            return columns.map(function (col) {
                if (!col.columns) {
                    const df = col.dataField;
                    if (df === 'doituong' || df === 'url_chitiet') {
                        return Object.assign({}, col, {
                            cellTemplate: function (cellElement, cellInfo) {
                                getUrlCell(cellElement, cellInfo);
                            }
                        });
                    }
                    return col;
                }
                return col; // nested group: không cần template
            });
        }

        function handleData(objData) {
            return commonRpVasTt.handleData(objData);
        }

        // ── Link cell renderer ────────────────────────────────────────────────────
        function getUrlCell(cellElement, cellInfo) {
            const rawHtml = cellInfo.value;
            if (!rawHtml || typeof rawHtml !== 'string' || !rawHtml.includes('<a')) {
                cellElement.text(rawHtml || '');
                return;
            }
            try {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = rawHtml;
                const link = tempDiv.querySelector('a');
                if (link) {
                    $('<a>', {
                        href: link.getAttribute('href'),
                        text: link.textContent || link.innerText,
                        target: '_blank'
                    }).appendTo(cellElement);
                } else {
                    cellElement.text(rawHtml);
                }
            } catch (e) {
                cellElement.text(rawHtml);
            }
        }

        function decodeHtmlEntities(text) {
            if (typeof text !== 'string') return text;
            const ta = document.createElement('textarea');
            ta.innerHTML = text;
            return ta.value;
        }

        function getTextFromHtml(rawHtml) {
            if (!rawHtml || typeof rawHtml !== 'string' || !rawHtml.includes('<a')) return rawHtml;
            try {
                const d = document.createElement('div');
                d.innerHTML = rawHtml;
                return d.textContent || d.innerText;
            } catch (e) {
                return rawHtml;
            }
        }

        // ── Search / navigation ───────────────────────────────────────────────────
        function refresh() {
            window.location.reload();
        }

        function searchReport() {
            window.onbeforeunload = null;
            const currentRecord = ccr.get();
            if (!libCS.validateDate(currentRecord, 19)) return;

            const params = getParam(currentRecord);
            params.isearch = 'T';
            params.isgetdata = 'T';
            params.custpage_account = (currentRecord.getValue('custpage_account') || []).join(',');
            params.pageIndex = 0;

            // Reset state
            _cachedAllData = [];
            _isFullyLoaded = false;
            _currentGridInstance = null;
            _searchParams = {...params}; // lưu lại cho CustomStore dùng khi chuyển page
            _totalRows = 0;

            libCS.showLoadingDialog(true);

            const serviceUrl = getServiceUrl();

            jQuery.ajax({
                type: 'post', url: serviceUrl, dataType: 'json', async: true, data: {...params}
            }).done(function (resData) {
                try {
                    let objData = resData.objData || [];
                    let info = resData.info || {};

                    let reportype = params.custpage_reportype;
                    let currencyValue = resData.currencyValue || params.custpage_currencyvalue;
                    let isCdps = reportype === 'customsearch_scv_vas_cdpstt_limit';
                    let isVay = reportype === 'customsearch_scv_vas_vaytt_limit';

                    _totalRows = info.totalRows || objData.length;
                    let ttlPage = info.ttlPage || 1;
                    _isFullyLoaded = (ttlPage <= 1);

                    objProjectData.objData = objData;
                    objProjectData.isearch = 'T';
                    objProjectData.reportype = reportype;
                    objProjectData.currencyValue = currencyValue;
                    objProjectData.isCdps = isCdps;
                    objProjectData.isVay = isVay;

                    libCustomForm.resizeGrid('scvTabsContainer');
                    renderDxTabsWithDxGrid(objProjectData);
                } catch (e) {
                    console.error('searchReport error', e);
                    alert('Lỗi hiển thị dữ liệu: ' + (e.message || e));
                } finally {
                    libCS.showLoadingDialog(false);
                }
            }).fail(function (request, status, error) {
                console.error('searchReport AJAX error', status, error);
                alert('Lỗi khi tải dữ liệu: ' + (error || status));
                libCS.showLoadingDialog(false);
            });
        }

        function getUrlParam(currentRecord) {
            return url.resolveScript({
                scriptId: SCRIPT_CFG.SCRIPT_ID,
                deploymentId: SCRIPT_CFG.DEPLOY_UI,
                returnExternalUrl: false,
                params: getParam(currentRecord)
            });
        }

        function getParam(currentRecord) {
            return {
                custpage_entity: currentRecord.getValue('custpage_entity'),
                custpage_subsidiary: currentRecord.getValue('custpage_subsidiary').join(','),
                custpage_subsidiarytext: currentRecord.getText('custpage_subsidiary'),
                custpage_order_type: currentRecord.getValue('custpage_order_type'),
                custpage_classification: currentRecord.getValue('custpage_classification'),
                custpage_location: currentRecord.getValue('custpage_location'),
                custpage_department: currentRecord.getValue('custpage_department'),
                custpage_kmcp: currentRecord.getValue('custpage_kmcp'),
                custpage_netnoco: currentRecord.getValue('custpage_netnoco') ? 'T' : 'F',
                custpage_not_level: currentRecord.getValue('custpage_not_level') ? 'T' : 'F',
                custpage_acc_level: currentRecord.getValue('custpage_acc_level'),
                custpage_date_dauky: currentRecord.getText('custpage_date_dauky'),
                custpage_date_cuoiky: currentRecord.getText('custpage_date_cuoiky'),
                custpage_reportype: currentRecord.getValue('custpage_reportype'),
                custpage_currencyvalue: currentRecord.getValue('custpage_currencyvalue'),
                custpage_currencytext: currentRecord.getText('custpage_currencyvalue'),
                // custpage_debitloanagreement: field không tồn tại trên form
                custpage_matt: currentRecord.getValue('custpage_matt'),
                custpage_account_parent: currentRecord.getValue('custpage_account_parent').join(','),
                custpage_account_parent_text: currentRecord.getText('custpage_account_parent'),
                custpage_exportbc: currentRecord.getValue('custpage_exportbc'),
                custpage_category: currentRecord.getValue('custpage_category').join(','),
            };
        }

        function plusAccount(currentRecord) {
            const pt = getAccountText(currentRecord.getText('custpage_account_parent'), ' ');
            const at = getAccountText(currentRecord.getText('custpage_account'), ' ');
            const acc_t = (pt && at) ? (pt + ', ' + at) : (at || pt);
            return '&custpage_account=' + currentRecord.getValue('custpage_account') + '&custpage_accounttext=' + acc_t;
        }

        function getAccountText(account, space) {
            let txt = '';
            if (account && account.length > 0) {
                for (let i in account) {
                    const v = account[i];
                    if (v) txt += v.split(space)[0] + ',';
                }
            }
            return txt.length > 0 ? txt.slice(0, -1) : txt;
        }

        // ── Export ────────────────────────────────────────────────────────────────

        /**
         * Fetch ALL pages từ server, trả về Promise<Array> chứa toàn bộ objData.
         */
        function fetchAllPagesForExport(serviceUrl, params) {
            return new Promise(function (resolve, reject) {
                // Page 0: lấy data + info.ttlPage
                let firstParams = {...params, pageIndex: 0};
                jQuery.ajax({
                    type: 'post', url: serviceUrl, dataType: 'json', async: true, data: firstParams
                }).done(function (resData) {
                    let allData = resData.objData || [];
                    let info = resData.info || {};
                    let ttlPage = info.ttlPage || 1;

                    if (ttlPage <= 1) {
                        resolve(allData);
                        return;
                    }

                    // Load remaining pages tuần tự
                    let idx = 1;
                    function loadNextExport() {
                        if (idx >= ttlPage) {
                            resolve(allData);
                            return;
                        }
                        let pageParams = {...params, pageIndex: idx};
                        jQuery.ajax({
                            type: 'post', url: serviceUrl, dataType: 'json', async: true, data: pageParams
                        }).done(function (res) {
                            allData = allData.concat(res.objData || []);
                            idx++;
                            loadNextExport();
                        }).fail(function () {
                            console.error('Export: failed to load page', idx);
                            idx++;
                            loadNextExport();
                        });
                    }
                    loadNextExport();
                }).fail(function (req, status, error) {
                    reject(error || status);
                });
            });
        }

        function exportReport() {
            window.onbeforeunload = null;
            const currentRecord = ccr.get();
            if (!libCS.validateDate(currentRecord, 19)) return;

            const params = getParam(currentRecord);
            params.isearch = 'T';
            params.isgetdata = 'T';
            params.custpage_account = (currentRecord.getValue('custpage_account') || []).join(',');
            libCS.showLoadingDialog(true);

            const serviceUrl = getServiceUrl();

            // Nếu đã load đầy đủ data từ search trước → dùng luôn, không cần gọi server
            let dataPromise;
            if (_isFullyLoaded && _cachedAllData.length > 0) {
                dataPromise = Promise.resolve(_cachedAllData);
            } else {
                dataPromise = fetchAllPagesForExport(serviceUrl, params);
            }

            dataPromise.then(function (allObjData) {
                // Fetch template config
                libCsXLS.asyncPostDataByAjax(serviceUrl, {
                    action: 'getUrlTemplate',
                    custpage_subsidiary: currentRecord.getValue('custpage_subsidiary'),
                    date_dauky: currentRecord.getValue('custpage_date_dauky').toLocaleDateString('vi-VN'),
                    date_cuoiky: currentRecord.getValue('custpage_date_cuoiky').toLocaleDateString('vi-VN'),
                    custpage_reportype: params.custpage_reportype,
                    custpage_entity: params.custpage_entity,
                    custpage_currencytext: params.custpage_currencytext,
                    custpage_currencyvalue: params.custpage_currencyvalue,
                }, function (resConfig) {
                    // Wrap allObjData giống format cũ để exportExcel dùng được
                    let resData = {objData: allObjData};
                    exportExcel(params, resConfig, resData)
                        .catch(err => console.error('exportExcel error', err))
                        .finally(() => libCS.showLoadingDialog(false));
                });
            }).catch(function (err) {
                console.error('exportReport error', err);
                alert('Lỗi khi tải dữ liệu export: ' + err);
                libCS.showLoadingDialog(false);
            });
        }

        /**
         * exportExcel — giống onExportResultData của mfg_result:
         *  - getColumns() từ common
         *  - flattenColumns() từ common
         *  - renderHeaderExport() từ lib
         *  - loop data theo dataField (column-driven)
         *  - createBorderWithRange() từ lib
         */
        const exportExcel = async (params, resConfig, resData) => {
            const reportType = params.custpage_reportype;
            const currencyValue = params.custpage_currencyvalue;
            const isCdps = reportType === 'customsearch_scv_vas_cdpstt_limit';
            const isVay = reportType === 'customsearch_scv_vas_vaytt_limit';

            const objDataHeader = resConfig.objDataHeader || resConfig.data && resConfig.data.objDataHeader;
            const urlTemplate = resConfig.urlTemplate || resConfig.data && resConfig.data.urlTemplate;

            // ── Workbook ──
            const workbook = await libCsXLS.loadWorkbookFromUrl(urlTemplate);
            const ws = workbook.worksheets[0];
            ws.name = 'Tong hop Cong No';

            initDataHeaderSheet(ws, objDataHeader, params);
            mergeCellBodyParm(ws);

            // ── Columns từ common — một nguồn duy nhất (giống mfg: commonRptMfgResult.getColumns) ──
            const columns = commonRpVasTt.getColumns(reportType, currencyValue, isCdps, isVay);
            const flatCols = commonRpVasTt.flattenColumns(columns);

            // numFmt map: dataField → Excel format (dùng formatXls đã khai báo trong common)
            const numFmtMap = {};
            flatCols.forEach(function (col) {
                if (col.formatXls) numFmtMap[col.dataField] = col.formatXls;
            });

            // ── Render header động — giống mfg dùng renderHeaderExport ──
            const HEADER_ROW = 10;
            const headerInfo = libCsXLS.renderHeaderExport(ws, HEADER_ROW, columns, {
                font: {name: 'Times New Roman', size: 9},
                fill: {fgColor: {argb: 'DBE9F7'}}
            });

            // ── Data (server đã xử lý handleData) ──
            let objData = (resData.objData) || (resData.data && resData.data.objData) || [];
            objData.forEach(function (line) {
                if (line.doituong) line.doituong = decodeHtmlEntities(line.doituong);
                if (line.accname) line.accname = decodeHtmlEntities(line.accname);
            });

            // Clone template style 1 lần, dùng lại cho mọi dòng
            const DATA_START_ROW = HEADER_ROW + headerInfo.arrColHeader.length;
            const templateRow = ws.getRow(DATA_START_ROW);
            const clonedStyles = [];
            for (let ci = 0; ci < flatCols.length; ci++) {
                const tc = templateRow.getCell(ci + 1);
                clonedStyles.push(tc.style ? Object.assign({}, tc.style) : {});
            }

            let idxRow = DATA_START_ROW;

            for (let i = 0; i < objData.length; i++) {
                // insertRow chỉ từ dòng thứ 2 trở đi — fix bug gọi 2 lần trước đây
                if (i > 0) ws.insertRow(idxRow);
                const row = ws.getRow(idxRow);
                const line = objData[i];
                const isBold = line.typebold === '2';

                // Ghi giá trị + style column-driven (giống mfg loop arrColumnFlat)
                const rowValues = [null]; // ExcelJS: col bắt đầu từ 1
                for (let ci = 0; ci < flatCols.length; ci++) {
                    const col = flatCols[ci];
                    const df = col.dataField;
                    let val = line[df];

                    if (typeof val === 'string' && val.includes('<a')) val = getTextFromHtml(val);

                    const isNum = col.dataType === 'number';
                    const numVal = isNum ? (typeof val === 'number' ? val : parseVietnameseNumber(String(val != null ? val : ''))) : null;
                    rowValues.push(numVal !== null ? numVal : (val != null ? val : ''));

                    const cell = row.getCell(ci + 1);
                    cell.style = Object.assign({}, clonedStyles[ci]);
                    cell.font = {name: 'Times New Roman', size: 9, bold: isBold};
                    if (numFmtMap[df]) cell.numFmt = numFmtMap[df];
                    cell.alignment = {vertical: 'middle', horizontal: isNum ? 'right' : 'left', wrapText: true};
                }

                row.values = rowValues;
                if (line.accname) libCsXLS.updateRowHeight(ws, line.accname, 0, idxRow, 35);
                idxRow++;
            }

            // ── Border toàn bộ data (giống mfg createBorderWithRange) ──
            libCsXLS.createBorderWithRange(ws,
                {row: DATA_START_ROW, col: 1},
                {row: idxRow - 1, col: flatCols.length},
                'thin', {rowStyle: 'thin', colStyle: 'thin'}
            );

            // ── Tên file ──
            const reportNameMap = {
                'customsearch_scv_vas_cntt_limit': 'BÁO CÁO TỔNG HỢP CÔNG NỢ',
                'customsearch_scv_vas_cntt_limit_nt': 'BÁO CÁO TỔNG HỢP CÔNG NỢ',
                'customsearch_scv_vas_vaytt_limit': 'Vay, cho vay, gửi tiết kiệm',
                'customsearch_scv_vas_cdpstt_limit': 'CÂN ĐỐI PHÁT SINH',
            };
            await libCsXLS.saveWorkbook(workbook, (reportNameMap[reportType] || 'Báo cáo') + '.xlsx');
        };

        // ── Excel helpers ─────────────────────────────────────────────────────────
        function initDataHeaderSheet(ws, objDataHeader, params) {
            libCsXLS.updMultiValueToCell(ws, [
                {addressCell: 'A1', keys: '{pSubsidiary}', values: objDataHeader.strLegalNameSub},
                {addressCell: 'A1', keys: '{pCode}', values: objDataHeader.strFederalNumberSub},
                {addressCell: 'A2', keys: '{pAddress}', values: objDataHeader.strMainAddrSub},
                {addressCell: 'A5', keys: '{pFromDate}', values: params.custpage_date_dauky},
                {addressCell: 'A5', keys: '{pToDate}', values: params.custpage_date_cuoiky},
                {
                    addressCell: 'A6',
                    keys: '{pAccount}',
                    values: Array.isArray(params.custpage_account_parent_text) ? params.custpage_account_parent_text.join(', ') : params.custpage_account_parent_text
                },
                {addressCell: 'A7', keys: '{pEntity}', values: params.custpage_entity || 'Tổng hợp'},
                {addressCell: 'A8', keys: '{pCurrency}', values: params.custpage_currencytext || 'VNĐ'},
            ]);
        }

        function mergeCellBodyParm(ws) {
            libCsXLS.mergeCell(ws, 1, 1, 1, 5);
            libCsXLS.mergeCell(ws, 2, 1, 2, 5);
        }

        function parseVietnameseNumber(str) {
            if (!str) return null;
            const n = parseFloat(str.replace(/\./g, '').replace(',', '.'));
            return isNaN(n) ? null : n;
        }

        return {pageInit, refresh, searchReport, exportReport};
    });
