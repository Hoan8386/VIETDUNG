/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/url', 'N/https',
        '../lib/scv_lib_cs.js', '../lib/scv_lib_cs_xls.js', '../lib/scv_lib_utils.js', '../lib/scv_lib_custom_form.js', 'N/search'],
    function (ccr, url, https, lcs, libCsXLS, libUtils, libCustomForm, search) {
        // ExcelJS được load qua scv_lib_cs_xls.js hoặc tag <script> trong page,
        // nên truy cập qua window.ExcelJS
        const ExcelJS = window.ExcelJS;

        /**
         * Function to be executed after page is initialized.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
         *
         * @since 2015.2
         */
        function pageInit(scriptContext) {
            updateFilterVisibility(scriptContext.currentRecord);
            if (objProjectData.isearch === "T") {
                let curRec = scriptContext.currentRecord;
                libCustomForm.resizeGrid("scvTabsContainer");
                renderDxTabsWithDxGrid(curRec, objProjectData);
            }
        }

        function renderDxTabsWithDxGrid(curRec, objProjectData) {
            let reportType = curRec.getValue('custpage_report_type');
            let objData = objProjectData.objData;
            let items = [];

            console.log(objData);
            if (reportType === 'thong_ke_nhan_cong') {
                getItemsTknc(curRec, objData, items);
            } else if (reportType === 'doi_chieu_thanh_pham') {
                getItemsDctp(objData, items);
            }
            $("#scvTabsContainer").dxTabPanel({items: items});
        }

        const getItemsTknc = (curRec , objData, items) => {
            let objItem = {
                title: 'Chi tiết nhân công',
                template: function () {
                    return $("<div>").dxDataGrid(getOptionGridCtnc( objData));
                }
            };
            items.push(objItem);

            objItem = {
                title: 'Tổng hợp ngày công',
                template: function () {
                    return $("<div>").dxDataGrid(getOptionGridThnc(curRec, objData));
                }
            };
            items.push(objItem);
        }

        const getItemsDctp = (objData, items) => {
            let optionGrid = getOptionGridDctp(objData);
            let objItem = {
                title: 'Đối chiếu thành phẩm',
                template: function () {
                    return $("<div>").dxDataGrid(optionGrid);
                }
            };
            items.push(objItem);
        }

        const getOptionGridCtnc = (objData) => {
            let optionGrid = {
                ...libCustomForm.getOptionGrid(),
                onCellPrepared: function (e) {
                    libCustomForm.createFontReport(e.cellElement);
                    if (e.rowType === "data" && e.column.allowEditing == true) {
                        if (e.row.data?.macot_display === " ") {
                            e.cellElement.css("font-weight", "bold");
                        } else if (e.row.data?.macot_display == 2 && e.columnIndex > 2) {
                            e.cellElement.append('%');
                        }
                    }
                },
                onRowPrepared: function (e) {
                    let {rowType, rowElement, rowIndex} = e;
                }
            };
            optionGrid.dataSource.store = objData.chiTietNhanCong;
            optionGrid.columns = getDataColumnGridCtnc();

            return optionGrid;
        }

        const getOptionGridThnc = (curRec , objData) => {
            let optionGrid = {
                ...libCustomForm.getOptionGrid(),
                onCellPrepared: function (e) {
                    libCustomForm.createFontReport(e.cellElement);
                    if (e.rowType === "data" && e.column.allowEditing == true) {
                        if (e.row.data?.macot_display === " ") {
                            e.cellElement.css("font-weight", "bold");
                        } else if (e.row.data?.macot_display == 2 && e.columnIndex > 2) {
                            e.cellElement.append('%');
                        }
                    }
                },
                onRowPrepared: function (e) {
                    let {rowType, rowElement, rowIndex} = e;
                }
            };
            optionGrid.dataSource.store = objData.tongHopNgayCong;
            optionGrid.columns = getDataColumnGridThnc(curRec, objData);

            return optionGrid;
        }

        const getOptionGridDctp = (objData) => {
            let optionGrid = {
                ...libCustomForm.getOptionGrid(),
                onCellPrepared: function (e) {
                    libCustomForm.createFontReport(e.cellElement);
                    if (e.rowType === "data" && e.column.allowEditing == true) {
                        if (e.row.data?.macot_display === " ") {
                            e.cellElement.css("font-weight", "bold");
                        } else if (e.row.data?.macot_display == 2 && e.columnIndex > 2) {
                            e.cellElement.append('%');
                        }
                    }
                },
                onRowPrepared: function (e) {
                    let {rowType, rowElement, rowIndex} = e;

                }
            };
            optionGrid.dataSource.store = objData.doiChieuThanhPhamNhapKho
            optionGrid.columns = objData.colsThanhPhamNhapKho //getDataColumnGridDctp();

            return optionGrid;
        }

        function getDataColumnGridCtnc() {
            return [
                {dataField: 'date', caption: 'Ngày', dataType: 'string'},
                {dataField: 'wo_number', caption: 'Số phiếu giao việc', dataType: 'string'},
                {dataField: 'shiftdisplay', caption: 'Ca', dataType: 'string'},
                {dataField: 'assembly_code', caption: 'Mã hàng', dataType: 'string'},
                {dataField: 'assembly_name', caption: 'Tên hàng', dataType: 'string'},
                {dataField: 'prod_operationdisplay', caption: 'Nội dung công việc', dataType: 'string'},
                {dataField: 'quantity_completed', caption: 'Số lượng', dataType: 'number'},
                {dataField: 'start_time', caption: 'Thời gian bắt đầu', dataType: 'datetime', format: 'HH:mm'},
                {dataField: 'end_time', caption: 'Thời gian kết thúc', dataType: 'datetime', format: 'HH:mm'},
                {
                    dataField: 'working_hours',
                    caption: 'Số giờ làm việc',
                    dataType: 'number',
                    format: {type: 'fixedPoint', precision: 2}
                },
                {dataField: 'emp_id', caption: 'Mã nhân viên', dataType: 'string'},
                {dataField: 'emp_name', caption: 'Tên nhân viên', dataType: 'string'},
                {dataField: 'emp_quan_doc', caption: 'Tên quản đốc/phó quản đốc', dataType: 'string'}
            ];

        }

        function getDataColumnGridThnc(curRec, objData) {
            const daysInMonth = getDaysInMonth(getDate(curRec).endDate);

            const dayColumns = Array.from({length: daysInMonth}, (_, i) => ({
                dataField: `d${i + 1}`,
                caption: `${i + 1}`,
                dataType: 'number',
                alignment: 'center'
            }));

            let arrColumn = [
                {
                    dataField: 'emp_id',
                    caption: 'Mã nhân viên',
                    fixed: true
                },
                {
                    dataField: 'emp_name',
                    caption: 'Tên nhân viên',
                    fixed: true
                },
                {
                    dataField: 'emp_job_title_display',
                    caption: 'Chức vụ',
                    fixed: true
                },
                {
                    caption: 'Số giờ làm việc/ngày',
                    columns: dayColumns
                },
                {
                    dataField: 'total_working_hours',
                    caption: 'Tổng số giờ/tháng',
                    dataType: 'number'
                },
                {
                    dataField: 'total_working_days',
                    caption: 'Ngày công',
                    dataType: 'number'
                }
            ]

            return arrColumn;
        }

        /**
         * Function to be executed when field is changed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
         * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
         *
         * @since 2015.2
         */
        function fieldChanged(scriptContext) {
            if (scriptContext.fieldId === 'custpage_report_type') {
                updateFilterVisibility(scriptContext.currentRecord);
            }
        }

        function searchReport() {
            window.onbeforeunload = null;
            let currentRecord = ccr.get();
            let fields = ['custpage_subsidiary', 'custpage_report_type', 'custpage_from_date', 'custpage_to_date'];
            if (!lcs.validateFieldMandatory(currentRecord, fields)) {
                return;
            }
            if (!validateReportDates(currentRecord)) {
                return;
            }
            let urlDC = getUrlParam(currentRecord) + '&isearch=T';
            window.location.replace(urlDC);
        }

        function getUrlParam(currentRecord) {
            return url.resolveScript({
                scriptId: 'customscript_scv_sl_rp_thnc_ac',
                deploymentId: 'customdeploy_scv_sl_rp_thnc_ac',
                returnExternalUrl: false,
                params: getParam(currentRecord)
            });
        }

        function getParam(currentRecord) {
            let employee = currentRecord.getValue('custpage_employee');
            employee = Array.isArray(employee) ? employee.join(',') : employee;
            return {
                custpage_subsidiary: currentRecord.getValue('custpage_subsidiary'),
                custpage_report_type: currentRecord.getValue('custpage_report_type'),
                custpage_from_date: currentRecord.getText('custpage_from_date'),
                custpage_to_date: currentRecord.getText('custpage_to_date'),
                custpage_operation: currentRecord.getValue('custpage_operation'),
                custpage_workorder: currentRecord.getValue('custpage_workorder'),
                custpage_employee: employee,
            }
        }

        const URL_RQ = '/app/site/hosting/scriptlet.nl?script=customscript_scv_sl_rp_thnc_ac&deploy=customdeploy_scv_sl_rp_thnc_ac';

        async function exportReport() {
            window.onbeforeunload = null;
            let currentRecord = ccr.get();
            let fields = ['custpage_subsidiary', 'custpage_report_type', 'custpage_from_date', 'custpage_to_date'];
            if (!lcs.validateFieldMandatory(currentRecord, fields)) {
                return;
            }
            if (!validateReportDates(currentRecord)) {
                return;
            }
            let params = getParam(currentRecord);
            params.isearch = 'T';
            params.isgetdata = 'T';
            lcs.showLoadingDialog(true);

            try {
                // N/https thay thế nlapiRequestURL (SuiteScript 1.0) để tránh strict mode error
                let resCallData = https.post({ url: URL_RQ, body: params });
                let objDataCol = JSON.parse(resCallData.body);

                let resConfig = https.post({
                    url: URL_RQ,
                    body: {
                        action: 'getUrlTemplate',
                        custpage_subsidiary: currentRecord.getValue('custpage_subsidiary'),
                        custpage_report_type: currentRecord.getValue('custpage_report_type'),
                    }
                });
                let objDataConfig = JSON.parse(resConfig.body);

                await exportExcel(params, currentRecord, objDataConfig, objDataCol);
            } catch (error) {
                console.log("error", error);
            } finally {
                lcs.showLoadingDialog(false);
            }
        }

        const exportExcel = async (params, currentRecord, objDataConfig, objDataCol) => {
            switch (params.custpage_report_type) {
                case 'thong_ke_nhan_cong':
                    await exportExcelTknc(params, currentRecord, objDataConfig, objDataCol);
                    break;
                case 'doi_chieu_thanh_pham':
                    await exportExcelDctp(params, currentRecord, objDataConfig, objDataCol);
                    break;

                default:
                    break;
            }
        }

        // ─── STYLE HELPERS ───────────────────────────────────────────────────────
        const STYLE = {
            FONT:           'Times New Roman',
            BG_HEADER:      'FFFFF0',   // vàng nhạt — đúng theo mẫu
            BG_GROUP:       'FDF5E6',   // linen — dòng nhóm ngày CTNC
            BG_TOTAL:       'FAFAD2',   // vàng chanh — dòng Tổng cộng THNC
            BG_TOTAL_HOURS: 'C0FFFF',   // cyan nhạt — cột Tổng giờ/tháng
        };

        const THIN_BORDER = {
            top:    { style: 'thin' },
            left:   { style: 'thin' },
            bottom: { style: 'thin' },
            right:  { style: 'thin' }
        };

        // sc = styleCell helper
        function sc(cell, opts = {}) {
            cell.font = { name: STYLE.FONT, bold: !!opts.bold, size: opts.size || 9 };
            cell.alignment = { horizontal: opts.hAlign || 'left', vertical: 'center', wrapText: !!opts.wrap };
            if (opts.bg) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + opts.bg } };
            if (opts.border !== false) cell.border = THIN_BORDER;
        }

        function mc(ws, r1, c1, r2, c2) {
            if (r1 === r2 && c1 === c2) return;
            ws.mergeCells(r1, c1, r2, c2);
        }

        // ─── HEADER CHUNG (row 1-5) ──────────────────────────────────────────────
        // Đúng theo mẫu:
        //   Row 1: Tên công ty — bold, sz 10, LEFT, KHÔNG merge
        //   Row 2: Địa chỉ    — bold, sz 10, LEFT, KHÔNG merge
        //   Row 3: Tiêu đề    — bold, sz 14, center, merge toàn chiều ngang
        //   Row 4: Kỳ báo cáo — bold, sz 10, center, merge toàn chiều ngang
        function buildReportHeader(ws, objDataHeader, titleText, { startDate, endDate }, totalCols) {
            mc(ws, 3, 1, 3, totalCols);
            mc(ws, 4, 1, 4, totalCols);

            const h1 = ws.getCell('A1');
            h1.value = objDataHeader.strLegalNameSub || '';
            sc(h1, { bold: true, size: 10, hAlign: 'left', border: false });

            const h2 = ws.getCell('A2');
            h2.value = objDataHeader.strMainAddrSub || '';
            sc(h2, { bold: true, size: 10, hAlign: 'left', border: false });

            const h3 = ws.getCell('A3');
            h3.value = titleText;
            sc(h3, { bold: true, size: 14, hAlign: 'center', border: false });

            const h4 = ws.getCell('A4');
            h4.value = `Từ ngày ${startDate} đến ngày ${endDate}`;
            sc(h4, { bold: true, size: 10, hAlign: 'center', border: false });

            ws.getRow(1).height = 14.25;
            ws.getRow(2).height = 14.25;
            ws.getRow(3).height = 15.75;
            ws.getRow(4).height = 15.75;
            ws.getRow(5).height = 14.25;
        }

        // ─── FOOTER SHEET CHI TIẾT NHÂN CÔNG ─────────────────────────────────────
        // Đúng theo mẫu (N=14 cols):
        //   +1: trống
        //   +2: C-D="Kế hoạch tháng .../20...:" | E="tấm 3ly QC"
        //   +3: C-D="Tỷ lệ hoàn thành:"         | E="%"
        //   +4: K-L="Ngày DD tháng MM năm YYYY"
        //   +5: A="Nơi nhận:" | E-F="Người lập" | K-L="TP. KHTH"
        //   +6: A="- GĐSX..." | E-F="(Ký, họ tên)" | K-L="(Ký, họ tên)"
        //   +7: A="- P. Hành chính"
        //   +8: A="- QĐ/PQĐ"
        //   +9: A="- Lưu P. KHTH"
        function buildFooterCtnc(ws, dataEndRow, { startDate }) {
            const r = dataEndRow + 1;
            const fs = { size: 10, border: false };
            const parts = (startDate || '').split('/');
            const dateStr = parts.length === 3 ? `Ngày ${parts[0]} tháng ${parts[1]} năm ${parts[2]}` : '';
            const set = (row, col, val, opts) => { const c = ws.getCell(row, col); c.value = val; sc(c, { ...fs, ...opts }); };

            mc(ws, r+2, 3, r+2, 4); mc(ws, r+3, 3, r+3, 4);
            mc(ws, r+4, 11, r+4, 12);
            mc(ws, r+5, 5, r+5, 6); mc(ws, r+5, 11, r+5, 12);
            mc(ws, r+6, 5, r+6, 6); mc(ws, r+6, 11, r+6, 12);

            set(r+2, 3,  'Kế hoạch tháng ..../20...:',     { bold: true, hAlign: 'right' });
            set(r+2, 5,  'tấm 3ly QC',                     { bold: true, hAlign: 'right' });
            set(r+3, 3,  'Tỷ lệ hoàn thành:',              { bold: true, hAlign: 'right' });
            set(r+3, 5,  '%',                               { bold: true, hAlign: 'right' });
            set(r+4, 11, dateStr,                           { hAlign: 'center' });
            set(r+5, 1,  'Nơi nhận:',                      { bold: true });
            set(r+5, 5,  'Người lập',                      { bold: true, hAlign: 'center' });
            set(r+5, 11, ' TP. KHTH',                      { bold: true, hAlign: 'center' });
            set(r+6, 1,  ' - GĐSX, P. GĐSX (để báo cáo)', { });
            set(r+6, 5,  '(Ký, họ tên)',                   { hAlign: 'center' });
            set(r+6, 11, '(Ký, họ tên)',                   { hAlign: 'center' });
            set(r+7, 1,  ' - P. Hành chính',               { });
            set(r+8, 1,  ' - QĐ/PQĐ',                     { });
            set(r+9, 1,  ' - Lưu P. KHTH',                 { });
        }

        // ─── FOOTER SHEET TỔNG HỢP NGÀY CÔNG ────────────────────────────────────
        // Đúng theo mẫu (col cuối = AI = 3+daysInMonth+2):
        //   +2: dateCol..lastCol = "Ngày DD tháng MM năm YYYY"
        //   +3: A-C="Người lập" | dateCol..lastCol="Kế toán trưởng"
        //   +4: A-C="(Ký, họ tên)" | dateCol..lastCol="(Ký, họ tên)"
        function buildFooterThnc(ws, dataEndRow, daysInMonth, { startDate }) {
            const r       = dataEndRow + 1;
            const lastCol = 3 + daysInMonth + 2;
            const dateCol = lastCol - 6;   // tương đương cột AB trong mẫu
            const fs      = { size: 10, border: false };
            const parts   = (startDate || '').split('/');
            const dateStr = parts.length === 3 ? `Ngày ${parts[0]} tháng ${parts[1]} năm ${parts[2]}` : '';
            const set = (row, col, val, opts) => { const c = ws.getCell(row, col); c.value = val; sc(c, { ...fs, ...opts }); };

            mc(ws, r+2, dateCol, r+2, lastCol);
            mc(ws, r+3, 1,       r+3, 3);  mc(ws, r+3, dateCol, r+3, lastCol);
            mc(ws, r+4, 1,       r+4, 3);  mc(ws, r+4, dateCol, r+4, lastCol);

            set(r+2, dateCol, dateStr,          { hAlign: 'center' });
            set(r+3, 1,       'Người lập',      { bold: true, hAlign: 'center' });
            set(r+3, dateCol, 'Kế toán trưởng', { bold: true, hAlign: 'center' });
            set(r+4, 1,       '(Ký, họ tên)',   { hAlign: 'center' });
            set(r+4, dateCol, '(Ký, họ tên)',   { hAlign: 'center' });
        }

        // DCTP: không có footer theo mẫu

        // ─── EXPORT TKNC ─────────────────────────────────────────────────────────
        const exportExcelTknc = async (params, currentRecord, objDataConfig, objDataCol) => {
            const reportName = 'Bao cao thong ke nhan cong';
            const objDataHeader = objDataConfig.objDataHeader;
            const objData = objDataCol.objData;
            const { startDate, endDate } = getDate(currentRecord);

            const workbook = new ExcelJS.Workbook();

            // ── Sheet 1: Chi tiết nhân công ──────────────────────────────────────
            const wsCtnc = workbook.addWorksheet('Chi tiết nhân công');
            const colsCtnc = getDataColumnGridCtnc();
            const numColsCtnc = colsCtnc.length;

            buildReportHeader(wsCtnc, objDataHeader,
                'BÁO CÁO KẾT QUẢ SẢN XUẤT AC - DỮ LIỆU TÍNH LƯƠNG TRẦN NHÔM',
                { startDate, endDate }, numColsCtnc);

            // Độ rộng cột cố định cho sheet ctnc
            const ctncWidths = [11.5, 13.25, 8.5, 16.5, 30.75, 16.5, 9.75, 8.0, 7.25, 13.0, 11.75, 17.5, 13.0, 18.0];
            colsCtnc.forEach((col, i) => {
                wsCtnc.getColumn(i + 1).width = ctncWidths[i] || 14;
            });

            // Header row 6
            const HEADER_ROW_CTNC = 6;
            const hrCtnc = wsCtnc.getRow(HEADER_ROW_CTNC);
            hrCtnc.height = 59.25;
            colsCtnc.forEach((col, i) => {
                const cell = hrCtnc.getCell(i + 1);
                cell.value = col.caption;
                sc(cell, { bold: true, hAlign: 'center', bg: STYLE.BG_HEADER, wrap: true });
            });

            // Data rows bắt đầu từ row 7
            let dataRowIdx = HEADER_ROW_CTNC + 1;
            (objData.chiTietNhanCong || []).forEach((row) => {
                const isGroup = row.macot_display === ' ';
                const exRow = wsCtnc.getRow(dataRowIdx);
                exRow.height = isGroup ? 20 : 18;
                colsCtnc.forEach((col, i) => {
                    const cell = exRow.getCell(i + 1);
                    cell.value = row[col.dataField] !== undefined ? row[col.dataField] : null;
                    sc(cell, {
                        bold: isGroup,
                        bg: isGroup ? STYLE.BG_GROUP : null,
                        hAlign: col.dataType === 'number' ? 'right' : 'left'
                    });
                });
                dataRowIdx++;
            });

            buildFooterCtnc(wsCtnc, dataRowIdx, { startDate });

            // ── Sheet 2: Tổng hợp ngày công ──────────────────────────────────────
            const wsThnc = workbook.addWorksheet('Tổng hợp ngày công');
            const daysInMonth = getDaysInMonth(endDate);
            const colsThnc = buildColsThnc(daysInMonth);
            const numColsThnc = 3 + daysInMonth + 2; // mã NV + tên + chức vụ + d1..dN + total + ngay cong

            buildReportHeader(wsThnc, objDataHeader,
                'BÁO CÁO NGÀY CÔNG',
                { startDate, endDate }, numColsThnc);

            // Set column widths
            wsThnc.getColumn(1).width = 8.5;
            wsThnc.getColumn(2).width = 19.13;
            wsThnc.getColumn(3).width = 10.5;
            for (let d = 1; d <= daysInMonth; d++) wsThnc.getColumn(3 + d).width = 4.38;
            wsThnc.getColumn(3 + daysInMonth + 1).width = 16;
            wsThnc.getColumn(3 + daysInMonth + 2).width = 12;

            // Header row 6: band "Số giờ làm việc/ngày" + merge
            const HEADER_ROW_THNC = 6;
            mc(wsThnc, HEADER_ROW_THNC, 1, HEADER_ROW_THNC + 1, 1); // Mã NV
            mc(wsThnc, HEADER_ROW_THNC, 2, HEADER_ROW_THNC + 1, 2); // Tên NV
            mc(wsThnc, HEADER_ROW_THNC, 3, HEADER_ROW_THNC + 1, 3); // Chức vụ
            mc(wsThnc, HEADER_ROW_THNC, 4, HEADER_ROW_THNC, 3 + daysInMonth); // band ngày
            mc(wsThnc, HEADER_ROW_THNC, 4 + daysInMonth, HEADER_ROW_THNC + 1, 4 + daysInMonth); // Tổng giờ
            mc(wsThnc, HEADER_ROW_THNC, 5 + daysInMonth, HEADER_ROW_THNC + 1, 5 + daysInMonth); // Ngày công

            wsThnc.getRow(HEADER_ROW_THNC).height = 15.75;
            wsThnc.getRow(HEADER_ROW_THNC + 1).height = 28.5;

            const setThncHeader = (r, c, v) => {
                const cell = wsThnc.getCell(r, c);
                cell.value = v;
                sc(cell, { bold: true, hAlign: 'center', bg: STYLE.BG_HEADER, wrap: true });
            };
            setThncHeader(HEADER_ROW_THNC,     1, 'Mã nhân viên');
            setThncHeader(HEADER_ROW_THNC,     2, 'Tên nhân viên');
            setThncHeader(HEADER_ROW_THNC,     3, 'Chức vụ');
            setThncHeader(HEADER_ROW_THNC,     4, 'Số giờ làm việc/ngày');
            setThncHeader(HEADER_ROW_THNC,     4 + daysInMonth, 'Tổng số giờ/tháng');
            setThncHeader(HEADER_ROW_THNC,     5 + daysInMonth, 'Ngày công');
            for (let d = 1; d <= daysInMonth; d++) {
                setThncHeader(HEADER_ROW_THNC + 1, 3 + d, d);
            }

            // Data rows từ row 8
            let thncDataRowIdx = HEADER_ROW_THNC + 2;
            (objData.tongHopNgayCong || []).forEach((row) => {
                const exRow = wsThnc.getRow(thncDataRowIdx);
                exRow.height = 18;

                const setCell = (c, v, opts) => {
                    const cell = exRow.getCell(c);
                    cell.value = v !== undefined && v !== null ? v : null;
                    sc(cell, opts || {});
                };
                setCell(1, row.emp_id,              { hAlign: 'center' });
                setCell(2, row.emp_name,             { hAlign: 'left' });
                setCell(3, row.emp_job_title_display || row.emp_job_title, { hAlign: 'left' });
                for (let d = 1; d <= daysInMonth; d++) {
                    const v = row[`d${d}`] || null;
                    setCell(3 + d, v, { hAlign: 'center' });
                }
                setCell(4 + daysInMonth, row.total_working_hours, { hAlign: 'right', bold: true, bg: STYLE.BG_TOTAL_HOURS });
                setCell(5 + daysInMonth, row.total_working_days,  { hAlign: 'right' });
                thncDataRowIdx++;
            });

            // Dòng Tổng cộng
            const totalRow = wsThnc.getRow(thncDataRowIdx);
            totalRow.height = 20;
            const tcCell = totalRow.getCell(1);
            tcCell.value = 'Tổng cộng:';
            sc(tcCell, { bold: true, bg: STYLE.BG_TOTAL });
            mc(wsThnc, thncDataRowIdx, 1, thncDataRowIdx, 3);
            for (let d = 1; d <= daysInMonth; d++) {
                const dataStart = HEADER_ROW_THNC + 2;
                const dataEnd   = thncDataRowIdx - 1;
                const col = 3 + d;
                const cell = totalRow.getCell(col);
                cell.value = { formula: `SUBTOTAL(9,${colLetter(col)}${dataStart}:${colLetter(col)}${dataEnd})` };
                sc(cell, { bold: true, bg: STYLE.BG_TOTAL, hAlign: 'center' });
            }
            const thCell = totalRow.getCell(4 + daysInMonth);
            thCell.value = { formula: `SUBTOTAL(9,${colLetter(4 + daysInMonth)}${HEADER_ROW_THNC + 2}:${colLetter(4 + daysInMonth)}${thncDataRowIdx - 1})` };
            sc(thCell, { bold: true, bg: STYLE.BG_TOTAL });
            const ncCell = totalRow.getCell(5 + daysInMonth);
            ncCell.value = { formula: `SUBTOTAL(9,${colLetter(5 + daysInMonth)}${HEADER_ROW_THNC + 2}:${colLetter(5 + daysInMonth)}${thncDataRowIdx - 1})` };
            sc(ncCell, { bold: true, bg: STYLE.BG_TOTAL });

            buildFooterThnc(wsThnc, thncDataRowIdx, daysInMonth, { startDate });

            await libCsXLS.saveWorkbook(workbook, reportName + '.xlsx');
        };

        // ─── EXPORT DCTP ─────────────────────────────────────────────────────────
        const exportExcelDctp = async (params, currentRecord, objDataConfig, objDataCol) => {
            const reportName = 'Bao cao doi chieu thanh pham';
            const objDataHeader = objDataConfig.objDataHeader;
            const objData = objDataCol.objData;
            const { startDate, endDate } = getDate(currentRecord);

            const workbook = new ExcelJS.Workbook();
            const ws = workbook.addWorksheet('Đối chiếu thành phẩm');

            // Flatten columns từ colsThanhPhamNhapKho (có band column)
            const colConfig = objData.colsThanhPhamNhapKho || [];
            const flatCols = [];
            colConfig.forEach((col) => {
                if (col.columns && col.columns.length) {
                    col.columns.forEach((sub) => flatCols.push({ ...sub, _band: col.caption }));
                } else {
                    flatCols.push({ ...col, _band: null });
                }
            });
            const totalCols = flatCols.length;

            buildReportHeader(ws, objDataHeader,
                'ĐỐI CHIẾU SỐ LƯỢNG THÀNH PHẨM NHẬP KHO VÀ THỐNG KÊ NHÂN CÔNG',
                { startDate, endDate }, totalCols);

            // Set column widths
            ws.getColumn(1).width = 24;
            ws.getColumn(2).width = 32;
            ws.getColumn(3).width = 14;
            for (let i = 4; i <= totalCols; i++) ws.getColumn(i).width = 14;

            // Header row 6-7: row 6 là band groups, row 7 là tên cột
            const HEADER_ROW = 6;
            ws.getRow(HEADER_ROW).height = 36;
            ws.getRow(HEADER_ROW + 1).height = 36;

            // Xác định span cho từng band
            let colIdx = 1;
            // Map band → [startCol, endCol]
            const bandMap = new Map();
            flatCols.forEach((col) => {
                const band = col._band;
                if (!bandMap.has(band)) bandMap.set(band, { start: colIdx, end: colIdx });
                else bandMap.get(band).end = colIdx;
                colIdx++;
            });

            // Merge và ghi band header (row 6)
            let ci = 1;
            flatCols.forEach((col) => {
                const band = col._band;
                const span = bandMap.get(band);
                if (band === null) {
                    // cột đứng độc lập: merge 2 hàng
                    mc(ws, HEADER_ROW, ci, HEADER_ROW + 1, ci);
                    const cell = ws.getCell(HEADER_ROW, ci);
                    cell.value = col.caption;
                    sc(cell, { bold: true, hAlign: 'center', bg: STYLE.BG_HEADER, wrap: true });
                } else {
                    // chỉ ghi band 1 lần
                    if (span.start === ci) {
                        mc(ws, HEADER_ROW, span.start, HEADER_ROW, span.end);
                        const cell = ws.getCell(HEADER_ROW, span.start);
                        cell.value = band;
                        sc(cell, { bold: true, hAlign: 'center', bg: STYLE.BG_HEADER, wrap: true });
                    }
                    // sub-col header row 7
                    const subCell = ws.getCell(HEADER_ROW + 1, ci);
                    subCell.value = col.caption;
                    sc(subCell, { bold: true, hAlign: 'center', bg: STYLE.BG_HEADER, wrap: true });
                }
                ci++;
            });

            // Data rows từ row 8
            let dataRowIdx = HEADER_ROW + 2;
            (objData.doiChieuThanhPhamNhapKho || []).forEach((row) => {
                const exRow = ws.getRow(dataRowIdx);
                exRow.height = 18;
                flatCols.forEach((col, i) => {
                    const cell = exRow.getCell(i + 1);
                    const v = row[col.dataField];
                    cell.value = v !== undefined && v !== null ? v : null;
                    const isNum = typeof v === 'number';
                    sc(cell, { hAlign: isNum ? 'right' : 'left' });
                });
                dataRowIdx++;
            });

            // DCTP không có footer theo mẫu
            await libCsXLS.saveWorkbook(workbook, reportName + '.xlsx');
        };

        // ─── HELPERS ─────────────────────────────────────────────────────────────
        function getDaysInMonth(dateStr) {
            // dateStr: DD/MM/YYYY
            const parts = (dateStr || '').split('/');
            if (parts.length < 3) return 31;
            const m = Number(parts[1]);
            const y = Number(parts[2]);
            return new Date(y, m, 0).getDate();
        }

        function buildColsThnc(daysInMonth) {
            const cols = [
                { dataField: 'emp_id',    caption: 'Mã nhân viên' },
                { dataField: 'emp_name',  caption: 'Tên nhân viên' },
                { dataField: 'emp_job_title_display', caption: 'Chức vụ' }
            ];
            for (let d = 1; d <= daysInMonth; d++) {
                cols.push({ dataField: `d${d}`, caption: String(d) });
            }
            cols.push({ dataField: 'total_working_hours', caption: 'Tổng số giờ/tháng' });
            cols.push({ dataField: 'total_working_days',  caption: 'Ngày công' });
            return cols;
        }

        // Chuyển số cột thành chữ cái (1=A, 26=Z, 27=AA, ...)
        function colLetter(n) {
            let s = '';
            while (n > 0) {
                const r = (n - 1) % 26;
                s = String.fromCharCode(65 + r) + s;
                n = Math.floor((n - 1) / 26);
            }
            return s;
        }

        function mergeCell(currentSheet, startRowIdx, startColumnIdx, endRowIdx, endColumnIdx) {
            currentSheet.mergeCells(startRowIdx, startColumnIdx, endRowIdx, endColumnIdx);
        }

        const getDate = (curRec) => {
            return {
                startDate: curRec.getText('custpage_from_date'),
                endDate: curRec.getText('custpage_to_date')
            };
        };

        function updateFilterVisibility(curRec) {
            const isLaborReport = curRec.getValue('custpage_report_type') === 'thong_ke_nhan_cong';
            ['custpage_operation', 'custpage_workorder', 'custpage_employee'].forEach((fieldId) => {
                const field = curRec.getField({ fieldId });
                if (field) field.isDisplay = isLaborReport;
            });
        }

        function validateReportDates(curRec) {
            const fromDate = curRec.getValue('custpage_from_date');
            const toDate = curRec.getValue('custpage_to_date');

            if (!(fromDate instanceof Date) || !(toDate instanceof Date)) {
                return false;
            }
            if (fromDate.getTime() > toDate.getTime()) {
                alert('Từ ngày không được lớn hơn Đến ngày.');
                return false;
            }
            if (curRec.getValue('custpage_report_type') === 'thong_ke_nhan_cong'
                && (fromDate.getFullYear() !== toDate.getFullYear()
                    || fromDate.getMonth() !== toDate.getMonth())) {
                alert('Từ ngày và Đến ngày phải nằm trong cùng một tháng. Vui lòng chọn lại tham số lọc.');
                return false;
            }
            return true;
        }

        const formatDate = (date) => {
            const dd = String(date.getDate()).padStart(2, '0');
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const yyyy = date.getFullYear();
            return `${dd}/${mm}/${yyyy}`;
        };

        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            searchReport: searchReport,
            exportReport: exportReport
        };

    });
