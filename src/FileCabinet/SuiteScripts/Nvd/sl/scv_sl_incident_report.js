/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/search', 'N/log'], function (ui, search, log) {

    /**
     * @param {Object} context
     * @param {ServerRequest} context.request - The incoming request
     * @param {ServerResponse} context.response - The outgoing response
     */
    function onRequest(context) {
        const request = context.request;
        const response = context.response;
        const params = request.parameters;

        const form = ui.createForm({ title: 'BÁO CÁO THỐNG KÊ SỰ CỐ' });
        form.clientScriptModulePath = '../cs/scv_cs_incident_report.js';

        // --- Date Filter ---
        form.addField({
            id: 'custpage_date_filter_group',
            type: ui.FieldType.INLINEHTML,
            label: ' '
        }).defaultValue = `
        <div style="font-weight:bold;">
            <span">Date</span>
            <label>From: </label>
            <input type="date" id="custpage_date_from" name="date_from" value="${params.date_from || ''}" style="margin:0 10px;" />
            <label>To: </label>
            <input type="date" id="custpage_date_to" name="date_to" value="${params.date_to || ''}" style="margin-left:10px;" />
        </div>
    `;

        // --- Load saved search 1 ---
        const ss1 = search.load({ id: 'customsearch_scv_tke_su_co' });


        // --- Run search 1 with filters ---
        const results1 = ss1.run().getRange({ start: 0, end: 1000 });
        const ss2 = search.load({ id: 'customsearch_scv_sucoscbd' });
        const results2 = ss2.run().getRange({ start: 0, end: 1000 });

        // --- Add filter fields MULTISELECT ---
        const fields = [
            { id: 'dept', label: 'Bộ phận thực hiện', column: { name: 'custrecord_scv_cmms_wo_teamincharge' }, results: results1 },
            { id: 'asset_code', label: 'Mã tài sản', column: { name: 'name', join: 'CUSTRECORD_SCV_CMMS_WO_ASSET' }, results: results1 },
            { id: 'asset_name', label: 'Tên tài sản', column: { name: 'altname', join: 'CUSTRECORD_SCV_CMMS_WO_ASSET' }, results: results1 },
            { id: 'serial', label: 'Số lô/ Serial', column: { name: 'custrecord_scv_cmms_wo_lo_seri' }, results: results1 },
            { id: 'ccdc_code', label: 'Mã CCDC', column: { name: 'upccode', join: 'CUSTRECORD_SCV_CMMS_WO_ADMASSET' }, results: results1 },
            { id: 'ccdc_name', label: 'Tên CCDC', column: { name: 'displayname', join: 'CUSTRECORD_SCV_CMMS_WO_ADMASSET' }, results: results1 },
            { id: 'scbd', label: 'Số SCBD', column: { name: 'name' }, results: results1 },
            { id: 'custpage_pr', label: 'Số PR', column: { name: 'tranid', join: 'CUSTCOL_SCV_SUMTRANS_LINE_ORIGINNO' }, results: results2 },
            { id: 'custpage_po', label: 'Số PO', column: { name: 'tranid' }, results: results2 }
        ];

        fields.forEach(field => {
            const selectField = form.addField({
                id: `custpage_${field.id}`,
                type: ui.FieldType.MULTISELECT,
                label: field.label
            });

            const seenValues = new Set();

            field.results.forEach(result => {
                const value = result.getValue(field.column);
                let text = result.getText(field.column) || value;
                if (value && !seenValues.has(value)) {
                    seenValues.add(value);
                    selectField.addSelectOption({ value, text });
                }
            });

            const selected = params[`custpage_${field.id}`];
            if (selected) {
                selectField.defaultValue = Array.isArray(selected) ? selected : [selected];
            }
        });

        form.addSubmitButton({ label: 'Search' });

        form.addButton({
            id: 'custpage_btn_refresh',
            label: 'Refresh',
            functionName: 'refreshPage'
        });

        if (request.method === 'POST') {
            // --- Sublist and columns ---
            const sublist = form.addSublist({
                id: 'custpage_result_sublist',
                type: ui.SublistType.LIST,
                label: 'Kết quả'
            });

            const columns = [
                { id: 'so_scd', label: 'Số SC/SCD' },
                { id: 'ma_taisan', label: 'Mã tài sản' },
                { id: 'ten_taisan', label: 'Tên tài sản' },
                { id: 'ma_ccdc', label: 'Mã CCDC' },
                { id: 'ten_ccdc', label: 'Tên CCDC' },
                { id: 'ngay_sudung', label: 'Ngày thực hiện' },
                { id: 'tinh_trang', label: 'Tình trạng trước SCBD' },
                { id: 'noi_dung', label: 'Nội dung SCBD' },
                { id: 'ket_qua', label: 'Kết quả' },
                { id: 'phong_ban', label: 'Phòng ban' },
                { id: 'kho', label: 'Kho' },
                { id: 'bin', label: 'Bin' },
                { id: 'serial', label: 'Số Lô/serial' },
                { id: 'pr', label: 'Số PR' },
                { id: 'po', label: 'Số PO' },
                { id: 'display', label: 'Display Name' },
                { id: 'upc_code', label: 'UPC Code' },
                { id: 'so_luong_truoc', label: 'Số lượng trước dung sai' },
                { id: 'so_luong_sau', label: 'Số lượng sau dung sai' },
                { id: 'don_gia', label: 'Đơn giá' },
                { id: 'price', label: 'Đơn vị tiền tệ' },
                { id: 'thanh_tien_truoc', label: 'Thành tiền trước dung sai (trước thuế)' },
                { id: 'thanh_tien_sau', label: 'Thành tiền sau dung sai (trước thuế)' }
            ];

            columns.forEach(col => {
                sublist.addField({
                    id: col.id,
                    type: ui.FieldType.TEXT,
                    label: col.label
                });
            });

            // --- Load ss2 và map ---
            const prMap = {};

            // Kiểm tra các field lọc (ngoại trừ ngày)
            const hasAnyFilterField =
                params.custpage_dept ||
                params.custpage_asset_code ||
                params.custpage_asset_name ||
                params.custpage_serial ||
                params.custpage_ccdc_code ||
                params.custpage_ccdc_name ||
                params.custpage_scbd;


            let rows = [];
            if (params.custpage_custpage_pr || params.custpage_custpage_po && !hasAnyFilterField) {
                // --- Tạo prMap: key = SCBD internal ID ---
                ss1.run().each(result => {
                    const scbdId = result.id; // internal ID dùng để mapping

                    const row = {
                        so_scd: result.getValue({ name: 'name' }) || '',
                        ma_taisan: result.getValue({ name: 'name', join: 'CUSTRECORD_SCV_CMMS_WO_ASSET' }) || '',
                        ten_taisan: result.getValue({ name: 'altname', join: 'CUSTRECORD_SCV_CMMS_WO_ASSET' }) || '',
                        ma_ccdc: result.getValue({ name: 'upccode', join: 'CUSTRECORD_SCV_CMMS_WO_ADMASSET' }) || '',
                        ten_ccdc: result.getValue({ name: 'displayname', join: 'CUSTRECORD_SCV_CMMS_WO_ADMASSET' }) || '',
                        ngay_sudung: result.getValue({ name: 'custrecord_scv_cmms_wo_date' }) || '',
                        tinh_trang: result.getValue({ name: 'custrecord_scv_cmms_wo_beforecondition' }) || '',
                        noi_dung: result.getValue({ name: 'custrecord_scv_cmms_wo_repairnote' }) || '',
                        ket_qua: result.getText({ name: 'custrecord_scv_cmms_wo_status' }) || '',
                        phong_ban: result.getText({ name: 'custrecord_scv_cmms_wo_teamincharge' }) || '',
                        kho: result.getText({ name: 'custrecord_scv_cmms_wo_location' }) || '',
                        bin: result.getText({ name: 'custrecord_scv_cmms_wo_bin' }) || '',
                        serial: result.getText({ name: 'custrecord_scv_cmms_wo_lo_seri' }) || ''
                    };

                    if (!prMap[scbdId]) prMap[scbdId] = [];
                    prMap[scbdId].push(row);

                    return true;
                });

                let ssPurchasePlan = [];

                const pagedData = ss2.runPaged({ pageSize: 1000 });
                pagedData.pageRanges.forEach(pageRange => {
                    const currentPage = pagedData.fetch({ index: pageRange.index });

                    currentPage.data.forEach(result => {
                        const po = result.getValue({ name: 'tranid' });
                        const pr = result.getValue({ name: 'tranid', join: 'CUSTCOL_SCV_SUMTRANS_LINE_ORIGINNO' });

                        const scbdInternalId = result.getValue({
                            name: 'formulatext',
                            formula: '{custcol_scv_sumtrans_line_originno.custbody_scv_cmms_workorder.id}'
                        }) || '';

                        function parseMultiSelectParam(param) {
                            return param ? param.split('\u0005') : [];
                        }

                        function matchMulti(param, value) {
                            const arr = parseMultiSelectParam(param);
                            return arr.length === 0 || arr.includes(value);
                        }

                        if (
                            matchMulti(params.custpage_custpage_pr, pr) &&
                            matchMulti(params.custpage_custpage_po, po)
                            // Bạn có thể thêm điều kiện lọc ngày nếu cần
                        ) {
                            ssPurchasePlan.push({ result, scbdInternalId });
                        }
                    });
                });

                // --- Prepare rows ---
                rows = ssPurchasePlan.map(({ result, scbdInternalId }) => ({
                    scbd_id: scbdInternalId,
                    pr: result.getValue({ name: 'tranid', join: 'CUSTCOL_SCV_SUMTRANS_LINE_ORIGINNO' }) || '',
                    po: result.getValue({ name: 'tranid' }) || '',
                    display: result.getText({ name: 'displayname', join: 'item' }) || '',
                    upc_code: result.getValue({ name: 'upccode', join: 'item' }) || '',
                    so_luong_truoc: result.getValue({ name: 'formulanumeric', formula: '{custcol_scv_qty_before_tolerance}' }) || '',
                    so_luong_sau: result.getValue({ name: 'quantity' }) || '',
                    don_gia: result.getValue({ name: 'rate' }) || '',
                    price: result.getText({ name: 'currency' }) || '',
                    thanh_tien_truoc: result.getValue({ name: 'formulanumeric', formula: '{custcol_scv_amount_bef_tolerance}' }) || '',
                    thanh_tien_sau: result.getValue({ name: 'formulanumeric', formula: '{amount}' }) || '',
                }));

                // --- Merge rows with SCBD info from prMap ---
                let index = 0;

                rows.forEach(row => {
                    const scbdId = row.scbd_id;
                    if (prMap[scbdId]) {
                        prMap[scbdId].forEach(pr => {
                            const merged = { ...row, ...pr };
                            columns.forEach(col => {
                                let value = merged[col.id];
                                if (value) {
                                    value = value.toString().substring(0, 300); // Trim to 300 chars
                                    sublist.setSublistValue({
                                        id: col.id,
                                        line: index,
                                        value: value
                                    });
                                }
                            });
                            index++;
                        });
                    } else {
                        columns.forEach(col => {
                            let value = row[col.id];
                            if (value) {
                                value = value.toString().substring(0, 300);
                                sublist.setSublistValue({
                                    id: col.id,
                                    line: index,
                                    value: value
                                });
                            }
                        });
                        index++;
                    }
                });
            }
            else {
                ss2.run().each(result => {
                    const scbdId = result.getText({
                        name: 'custbody_scv_cmms_workorder',
                        join: 'CUSTCOL_SCV_SUMTRANS_LINE_ORIGINNO'
                    });

                    if (!scbdId) return true;

                    const row = {
                        pr: result.getValue({ name: 'tranid', join: 'CUSTCOL_SCV_SUMTRANS_LINE_ORIGINNO' }) || '',
                        po: result.getValue({ name: 'tranid' }) || '',
                        display: result.getText({ name: 'displayname', join: 'item' }) || '',
                        upc_code: result.getValue({ name: 'upccode', join: 'item' }) || '',
                        so_luong_truoc: result.getValue({ name: 'formulanumeric', formula: '{custcol_scv_qty_before_tolerance}' }) || '',
                        so_luong_sau: result.getValue({ name: 'quantity' }) || '',
                        don_gia: result.getValue({ name: 'rate' }) || '',
                        price: result.getText({ name: 'currency' }) || '',
                        thanh_tien_truoc: result.getValue({ name: 'formulanumeric', formula: '{custcol_scv_amount_bef_tolerance}' }) || '',
                        thanh_tien_sau: result.getValue({ name: 'formulanumeric', formula: '{amount}' }) || '',
                        phieu_scbd: scbdId || ''
                    };

                    if (!prMap[scbdId]) prMap[scbdId] = [];
                    prMap[scbdId].push(row);

                    return true;
                });
                let ssPurchasePlan = [];

                const pagedData = ss1.runPaged({ pageSize: 1000 });
                pagedData.pageRanges.forEach(pageRange => {
                    const currentPage = pagedData.fetch({ index: pageRange.index });

                    currentPage.data.forEach(result => {
                        const date = result.getValue({ name: 'custrecord_scv_cmms_wo_date' });
                        const dept = result.getValue({ name: 'custrecord_scv_cmms_wo_teamincharge' });
                        const asset_code = result.getValue({ name: 'name', join: 'CUSTRECORD_SCV_CMMS_WO_ASSET' }) || '';
                        const asset_name = result.getValue({ name: 'altname', join: 'CUSTRECORD_SCV_CMMS_WO_ASSET' }) || '';
                        const serial = result.getValue({ name: 'custrecord_scv_cmms_wo_lo_seri' });
                        const ccdc_code = result.getValue({ name: 'upccode', join: 'CUSTRECORD_SCV_CMMS_WO_ADMASSET' }) || '';
                        const ccdc_name = result.getValue({ name: 'displayname', join: 'CUSTRECORD_SCV_CMMS_WO_ADMASSET' }) || '';
                        const scbd = result.getValue({ name: 'name' });
                        const dateFromResult = new Date(date.split('/').reverse().join('-'));

                        const dateFromParams = new Date(params.date_from);
                        const dateToParams = new Date(params.date_to);


                        function parseMultiSelectParam(param) {
                            return param ? param.split('\u0005') : [];
                        }

                        function matchMulti(param, value) {
                            const arr = parseMultiSelectParam(param);
                            return arr.length === 0 || arr.includes(value);
                        }
                        if (
                            hasAnyFilterField &&
                            matchMulti(params.custpage_dept, dept) &&
                            matchMulti(params.custpage_asset_code, asset_code) &&
                            matchMulti(params.custpage_asset_name, asset_name) &&
                            matchMulti(params.custpage_serial, serial) &&
                            matchMulti(params.custpage_ccdc_code, ccdc_code) &&
                            matchMulti(params.custpage_ccdc_name, ccdc_name) &&
                            matchMulti(params.custpage_scbd, scbd) &&
                            (!params.custpage_date_from || dateFromResult >= new Date(params.custpage_date_from)) &&
                            (!params.custpage_date_to || dateFromResult <= new Date(params.custpage_date_to))
                        ) {
                            // Ưu tiên nếu có ít nhất một field lọc (không tính ngày)
                            ssPurchasePlan.push(result);
                            log.audit("ssPurchasePlan after push1111:", JSON.stringify(ssPurchasePlan, null, 2));
                        } else if (
                            dateFromResult >= dateFromParams &&
                            dateFromResult <= dateToParams &&
                            !hasAnyFilterField // Chỉ lọc ngày nếu không có field lọc khác
                        ) {
                            ssPurchasePlan.push(result);
                            log.audit("ssPurchasePlan after push222:", JSON.stringify(ssPurchasePlan, null, 2));
                        }

                    });
                });


                // --- Prepare rows ---
                let rows = ssPurchasePlan.map(result => {
                    let row = {
                        so_scd: result.getValue({ name: 'name' }) || '',
                        ma_taisan: result.getValue({ name: 'name', join: 'CUSTRECORD_SCV_CMMS_WO_ASSET' }) || '',
                        ten_taisan: result.getValue({ name: 'altname', join: 'CUSTRECORD_SCV_CMMS_WO_ASSET' }) || '',
                        ma_ccdc: result.getValue({ name: 'upccode', join: 'CUSTRECORD_SCV_CMMS_WO_ADMASSET' }) || '',
                        ten_ccdc: result.getValue({ name: 'displayname', join: 'CUSTRECORD_SCV_CMMS_WO_ADMASSET' }) || '',
                        ngay_sudung: result.getValue({ name: 'custrecord_scv_cmms_wo_date' }) || '',
                        tinh_trang: result.getValue({ name: 'custrecord_scv_cmms_wo_beforecondition' }) || '',
                        noi_dung: result.getValue({ name: 'custrecord_scv_cmms_wo_repairnote' }) || '',
                        ket_qua: result.getText({ name: 'custrecord_scv_cmms_wo_status' }) || '',
                        phong_ban: result.getText({ name: 'custrecord_scv_cmms_wo_teamincharge' }) || '',
                        kho: result.getText({ name: 'custrecord_scv_cmms_wo_location' }) || '',
                        bin: result.getText({ name: 'custrecord_scv_cmms_wo_bin' }) || '',
                        serial: result.getText({ name: 'custrecord_scv_cmms_wo_lo_seri' }) || ''
                    };

                    // Log each row for auditing purposes
                    // log.audit({
                    //     title: 'Row Data - Purchase Plan',
                    //     details: JSON.stringify(row)
                    // });

                    return row;
                });



                let index = 0;

                rows.forEach(row => {
                    const scbdId = row.so_scd;
                    if (prMap[scbdId]) {
                        prMap[scbdId].forEach(pr => {
                            const merged = { ...row, ...pr };
                            columns.forEach(col => {
                                let value = merged[col.id];
                                if (value) {
                                    value = value.toString();
                                    // Giới hạn độ dài chuỗi tối đa 300 ký tự
                                    if (value.length > 300) {
                                        value = value.substring(0, 300);
                                    }
                                    sublist.setSublistValue({
                                        id: col.id,
                                        line: index,
                                        value: value
                                    });
                                }
                            });
                            index++;
                        });
                    } else {
                        columns.forEach(col => {
                            let value = row[col.id];
                            if (value) {
                                value = value.toString();
                                // Giới hạn độ dài chuỗi tối đa 300 ký tự
                                if (value.length > 300) {
                                    value = value.substring(0, 300);
                                }
                                sublist.setSublistValue({
                                    id: col.id,
                                    line: index,
                                    value: value
                                });
                            }
                        });
                        index++;
                    }
                });



            }




        }

        response.writePage(form);
    }

    return {
        onRequest: onRequest
    };
});
