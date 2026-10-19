/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define([
    'N/format',
    'N/log',
    'N/runtime',
    'N/search',
    'N/ui/serverWidget',
    // '../common/scv_common_csrp_cfm',
    '../lib/scv_lib_report.js',
    '../lib/scv_lib_common_info.js',
    '../lib/scv_lib_custom_form.js',
    '../olib/alasql/alasql.min@1.7.3.js'
], (
    format,
    log,
    runtime,
    search,
    serverWidget,
    // commonCsrpCfm,
    libRep,
    libCommonInfo,
    libCustomForm,
    alasql
) => {
    /**
     * Defines the Suitelet script trigger point.
     * @param {Object} scriptContext
     * @param {ServerRequest} scriptContext.request - Incoming request
     * @param {ServerResponse} scriptContext.response - Suitelet response
     * @since 2015.2
     */

    const SavedSearch = {
        DTL_AC_LABOR: 'customsearch_scv_detail_ac_labor_rpt',
        SUM_PROD_AC_LABOR: 'customsearch_scv_sum_prod_ac_labor_rpt'
    };

    const onRequest = (scriptContext) => {
        const request = scriptContext.request;
        const parameters = request.parameters || {};
        const response = scriptContext.response;
        const action = parameters.action;

        const master = getMaster();
        const subsidiary = parameters.custpage_subsidiary || (runtime.getCurrentUser().subsidiary + '');
        let isearch = parameters.isearch;
        let isgetdata = parameters.isgetdata;
        isearch = (!parameters.custpage_subsidiary
            || !parameters.custpage_from_date
            || !parameters.custpage_to_date
            || !isDateRangeValid(parameters.custpage_from_date, parameters.custpage_to_date)) ? 'F' : isearch;
        if (isearch === 'T'
            && parameters.custpage_report_type === 'thong_ke_nhan_cong'
            && !isSameMonthAndYear(parameters.custpage_from_date, parameters.custpage_to_date)) {
            isearch = 'F';
        }

        let objData = null;

        if (isearch === 'T') {
            const filterDtlAcLabor = [];
            const filterSumAcLabor = [];
            const listDataDtlAcLabor = [];
            const listDataSumAcLabor = [];

            pushFilterDtl(filterDtlAcLabor, parameters);
            pushFilterSum(filterSumAcLabor, parameters);

            libRep.doSearchSSRangeLabelId(SavedSearch.DTL_AC_LABOR, 1000, listDataDtlAcLabor, filterDtlAcLabor);
            libRep.doSearchSSRangeLabelId(SavedSearch.SUM_PROD_AC_LABOR, 1000, listDataSumAcLabor, filterSumAcLabor);

            objData = buildData(listDataDtlAcLabor, listDataSumAcLabor, parameters);
            // trả về
            // {
            // chiTietNhanCong : chiTietNhanCong,
            // tongHopNgayCong : tongHopNgayCong,
            // doiChieuThanhPhamNhapKho : doiChieuThanhPhamNhapKho
            // }
        }

        if (isgetdata === 'T') {
            response.write(JSON.stringify({ objData, col: master.col } || {}));
        } else if (action === 'getUrlTemplate') {
            const objDataHeader = libCommonInfo.getInforReport({ subsidiary: subsidiary });
            response.write(JSON.stringify({
                urlTemplate: libCommonInfo.getUrlFileTemplate('EXCEL', 'scv_xlsx_thnc_ac.xlsx'),
                objDataHeader
            }));
        } else if (request.method === 'GET') {
            const form = createForm(parameters, subsidiary);

            libCustomForm.addFieldIncludeDxGrid(form);
            libCustomForm.addFieldScriptData(form, {
                isearch: isearch,
                objData: objData
            });
            libCustomForm.addFieldDxGridResult(form, 'scvTabsContainer');
            response.writePage(form);
        }
    };

    const buildData = (listDataDtlAcLabor, listDataSumAcLabor, parameters) => {
        const listDataDtl = normalizeArrayOfObjects(listDataDtlAcLabor);
        const listDataSum = normalizeArrayOfObjects(listDataSumAcLabor);

        // Bug fix 1: alasql v1.7.3 không hỗ trợ CAST(date AS DATE) trong ORDER BY.
        // Dùng JS sort thuần để sắp xếp an toàn.
        const sortedListDataDtl = listDataDtl.slice().sort((a, b) => {
            // date dạng DD/MM/YYYY -> sort theo YYYY/MM/DD
            const toSortable = (d) => {
                if (!d) return '';
                const parts = d.split('/');
                return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : d;
            };
            return toSortable(a.date).localeCompare(toSortable(b.date))
                || (a.wo_number || '').localeCompare(b.wo_number || '')
                || (a.shiftdisplay || '').localeCompare(b.shiftdisplay || '')
                || (a.assembly_code || '').localeCompare(b.assembly_code || '')
                || (a.assembly_name || '').localeCompare(b.assembly_name || '')
                || (a.prod_operationdisplay || '').localeCompare(b.prod_operationdisplay || '');
        });

        const expandedList = [];
        for (let i = 0; i < sortedListDataDtl.length; i += 1) {
            const row = sortedListDataDtl[i];
            row._labor_row_key = getLaborRowKey(row, i);
            expandedList.push(...splitEmpRows(row));
        }

        const group = ['date', 'wo_number', 'shiftdisplay', 'assembly_code', 'assembly_name'];
        let currentGrp = null;
        const displayedLaborQty = {};
        const chiTietNhanCong = [];

        for (let i = 0; i < expandedList.length; i += 1) {
            const item = expandedList[i];
            let isNewGroup = false;

            if (!currentGrp) {
                isNewGroup = true;
            } else {
                for (const k of group) {
                    if ((currentGrp[k] ?? '') !== (item[k] ?? '')) {
                        isNewGroup = true;
                        break;
                    }
                }
            }

            if (isNewGroup) {
                const groupRow = {
                    ...item,
                    emp_id: '',
                    emp_name: '',
                    emp_job_title: '',
                    prod_operationdisplay: '',
                    start_time: '',
                    end_time: '',
                    working_hours: '',
                    quantity_completed: '',
                    isGroupRow: true,
                    macot_display: ' '
                };
                chiTietNhanCong.push(groupRow);
                currentGrp = {};
                for (const k of group) {
                    currentGrp[k] = item[k];
                }
            }

            const dataRow = {
                ...item,
                isGroupRow: false,
                macot_display: ''
            };
            if (displayedLaborQty[dataRow._labor_row_key]) {
                dataRow.quantity_completed = '';
            } else {
                displayedLaborQty[dataRow._labor_row_key] = true;
            }
            chiTietNhanCong.push(dataRow);
        }

        // Bug fix 2: Không dùng alasql CASE WHEN trong aggregate vì alasql v1.7.3 không hỗ trợ.
        // Tính tongHopNgayCong bằng JS thuần.
        const dataForThnc = chiTietNhanCong
            .filter((r) => !r.isGroupRow && r.emp_id)
            .map((r) => {
                const parts = (r.date || '').split('/');
                const d = parts.length === 3 ? Number(parts[0]) : 0;
                const m = parts.length === 3 ? Number(parts[1]) : 0;
                const y = parts.length === 3 ? Number(parts[2]) : 0;
                return {
                    ...r,
                    day: d,
                    month: m,
                    year: y,
                    working_hours_num: Number(r.working_hours || 0)
                };
            });

        // Nhóm theo emp
        const empMap = new Map();
        for (const r of dataForThnc) {
            const key = r.emp_id;
            if (!empMap.has(key)) {
                empMap.set(key, {
                    emp_id: r.emp_id,
                    emp_name: r.emp_name,
                    emp_job_title: r.emp_job_title,
                    emp_job_title_display: r.emp_job_title_display,
                    total_working_hours: 0,
                    _dayMap: {}
                });
            }
            const emp = empMap.get(key);
            emp.total_working_hours += r.working_hours_num;
            emp._dayMap[r.day] = (emp._dayMap[r.day] || 0) + r.working_hours_num;
        }

        const tongHopNgayCong = [...empMap.values()].map((emp) => {
            const row = {
                emp_id: emp.emp_id,
                emp_name: emp.emp_name,
                emp_job_title: emp.emp_job_title,
                emp_job_title_display: emp.emp_job_title_display,
                total_working_hours: emp.total_working_hours,
                total_working_days: Math.round((emp.total_working_hours / 8) * 100) / 100
            };
            // gán d1..d31
            for (let d = 1; d <= 31; d++) {
                row[`d${d}`] = emp._dayMap[d] || 0;
            }
            return row;
        });

        // --- XỬ LÝ ĐỐI CHIẾU THÀNH PHẨM ---

        // Bug fix 3: SS1 field "Inventory Detail : Quantity" sau normalizeKey
        // ra "inventory_detail__quantity" chứ không phải "quantity".
        // Dùng JS thuần thay vì alasql để tránh nhầm key.
        const assemblyMap = new Map();
        for (const r of listDataSum) {
            const code = r.assembly_code;
            const name = r.assembly_name;
            // Tìm key chứa "quantity" (phòng trường hợp normalize ra tên khác)
            const qtyKey = Object.keys(r).find((k) => k.includes('quantity')) || 'quantity';
            const qty = Number(r[qtyKey] || 0);
            if (!assemblyMap.has(code)) {
                assemblyMap.set(code, { assembly_code: code, assembly_name: name, quantity: 0 });
            }
            assemblyMap.get(code).quantity += qty;
        }
        const baseAssembly = [...assemblyMap.values()];

        // Bug fix 4: prod_operation key trong listDataDtl sau normalizeKey.
        // SS2 label "Công đoạn" → normalize ra "cong_doan".
        // Dùng key "prod_operation" (custom label từ SS, đây là internal ID giữ nguyên qua normalizeKey).
        const pivotMap = new Map(); // Map<assembly_code, Map<prod_operation, total_qty>>
        for (const r of listDataDtl) {
            const code = r.assembly_code;
            const op = r.prod_operation;
            if (!code || !op) continue;
            const qty = Number(r.quantity_completed || 0);
            if (!pivotMap.has(code)) pivotMap.set(code, new Map());
            const opMap = pivotMap.get(code);
            opMap.set(op, (opMap.get(op) || 0) + qty);
        }

        const doiChieuThanhPhamNhapKho = baseAssembly.map((row) => {
            const result = { ...row };
            const opMap = pivotMap.get(row.assembly_code);
            if (opMap) {
                for (const [op, qty] of opMap.entries()) {
                    result[op] = qty;
                }
            }
            return result;
        });

        log.debug('doiChieuThanhPhamNhapKho', JSON.stringify(doiChieuThanhPhamNhapKho));

        return {
            chiTietNhanCong: chiTietNhanCong,
            tongHopNgayCong: tongHopNgayCong,
            doiChieuThanhPhamNhapKho: doiChieuThanhPhamNhapKho,
            colsThanhPhamNhapKho: getDataColumnGridDctp(listDataDtl, listDataSum)
        };
    };

    const pushFilterDtl = (filter, parameters) => {
        const { startDate, endDate } = getDate(parameters);

        filter.push(
            search.createFilter({
                name: 'custrecord_scv_prd_labor_sub',
                operator: search.Operator.ANYOF,
                values: parameters.custpage_subsidiary
            })
        );

        filter.push(
            search.createFilter({
                name: 'custrecord_scv_prd_labor_date',
                operator: search.Operator.ONORAFTER,
                values: startDate
            })
        );

        filter.push(
            search.createFilter({
                name: 'custrecord_scv_prd_labor_date',
                operator: search.Operator.ONORBEFORE,
                values: endDate
            })
        );

        if (parameters.custpage_report_type === 'thong_ke_nhan_cong' && parameters.custpage_operation) {
            filter.push(
                search.createFilter({
                    name: 'custrecord_scv_prd_op_sequences',
                    operator: search.Operator.ANYOF,
                    values: parameters.custpage_operation
                })
            );
        }

        if (parameters.custpage_report_type === 'thong_ke_nhan_cong' && parameters.custpage_workorder) {
            filter.push(
                search.createFilter({
                    name: 'formulatext',
                    formula: 'UPPER({custrecord_scv_prd_labor_wo})',
                    operator: search.Operator.CONTAINS,
                    values: String(parameters.custpage_workorder).toUpperCase()
                })
            );
        }

        if (parameters.custpage_report_type === 'thong_ke_nhan_cong' && parameters.custpage_employee) {
            const employeeIds = normalizeMultiSelectParam(parameters.custpage_employee);
            if (employeeIds.length > 0) {
                filter.push(
                    search.createFilter({
                        name: 'formulatext',
                        formula: getEmployeeFilterFormula(employeeIds),
                        operator: search.Operator.IS,
                        values: 'T'
                    })
                );
            }
        }
    };

    const pushFilterSum = (filter, parameters) => {
        const { startDate, endDate } = getDate(parameters);

        filter.push(
            search.createFilter({
                name: 'subsidiary',
                operator: search.Operator.ANYOF,
                values: parameters.custpage_subsidiary
            })
        );

        filter.push(
            search.createFilter({
                name: 'trandate',
                operator: search.Operator.ONORAFTER,
                values: startDate
            })
        );

        filter.push(
            search.createFilter({
                name: 'trandate',
                operator: search.Operator.ONORBEFORE,
                values: endDate
            })
        );
    };

    const createForm = (parameters, subsidiary) => {
        const form = serverWidget.createForm({ title: 'BÁO CÁO TỔNG HỢP NHÂN CÔNG AC' });
        form.clientScriptModulePath = '../cssl/scv_cs_sl_rp_thnc_ac.js';
        form.addButton({ id: 'custpage_bt_search', label: 'Tìm kiếm', functionName: 'searchReport()' });
        form.addButton({ id: 'custpage_bt_export', label: 'Xuất file', functionName: 'exportReport()' });

        const container = 'fieldgroup_dc_main';
        form.addFieldGroup({ id: container, label: 'Điều kiện lọc' });

        const fieldSubsidiary = form.addField({
            id: 'custpage_subsidiary',
            type: serverWidget.FieldType.SELECT,
            label: 'CÔNG TY',
            container: container
        });
        fieldSubsidiary.isMandatory = true;
        libRep.addSelectSubsidiary(fieldSubsidiary, subsidiary);

        const reportType = form
            .addField({
                id: 'custpage_report_type',
                type: serverWidget.FieldType.SELECT,
                label: 'LOẠI BÁO CÁO',
                container: container
            })
            .updateLayoutType({ layoutType: serverWidget.FieldLayoutType.STARTROW });

        reportType.addSelectOption({ value: 'thong_ke_nhan_cong', text: 'Thống kế nhân công', isSelected: true });
        reportType.addSelectOption({ value: 'doi_chieu_thanh_pham', text: 'Đối chiếu thành phẩm nhập kho' });
        reportType.isMandatory = true;
        reportType.defaultValue = parameters.custpage_report_type || 'thong_ke_nhan_cong';

        const defaultDates = getDefaultDateRange();
        const fieldFromDate = form.addField({
            id: 'custpage_from_date',
            type: serverWidget.FieldType.DATE,
            label: 'Từ ngày',
            container: container
        }).updateLayoutType({ layoutType: serverWidget.FieldLayoutType.STARTROW });
        fieldFromDate.isMandatory = true;
        fieldFromDate.defaultValue = parameters.custpage_from_date || defaultDates.startDate;

        const fieldToDate = form.addField({
            id: 'custpage_to_date',
            type: serverWidget.FieldType.DATE,
            label: 'Đến ngày',
            container: container
        }).updateLayoutType({ layoutType: serverWidget.FieldLayoutType.ENDROW });
        fieldToDate.isMandatory = true;
        fieldToDate.defaultValue = parameters.custpage_to_date || defaultDates.endDate;

        const fieldOperation = form
            .addField({
                id: 'custpage_operation',
                type: serverWidget.FieldType.SELECT,
                label: 'Công đoạn',
                source: 'customrecord_scv_prod_operation',
                container: container
            })
            .updateLayoutType({ layoutType: serverWidget.FieldLayoutType.STARTROW });
        fieldOperation.defaultValue = parameters.custpage_operation || '';

        const fieldWorkOrder = form.addField({
            id: 'custpage_workorder',
            type: serverWidget.FieldType.TEXT,
            label: 'Lệnh sản xuất',
            container: container
        });
        fieldWorkOrder.defaultValue = parameters.custpage_workorder || '';

        const fieldEmployee = form.addField({
            id: 'custpage_employee',
            type: serverWidget.FieldType.MULTISELECT,
            label: 'Nhân viên',
            source: 'employee',
            container: container
        });
        fieldEmployee.defaultValue = parameters.custpage_employee ? String(parameters.custpage_employee).split(',') : [];

        return form;
    };

    function getDataColumnGridDctp(listDataDtl, listDataSum) {
        listDataDtl = listDataDtl
            .filter((r) => r.wo_centerdisplay && r.prod_operation)
            .map((r) => ({
                assembly_code: r.assembly_code,
                assembly_name: r.assembly_name,
                wo_centerdisplay: r.wo_centerdisplay,
                prod_operationdisplay: r.prod_operationdisplay,
                prod_operation: r.prod_operation
            }));

        listDataSum = listDataSum.map((r) => ({
            assembly_code: r.assembly_code,
            assembly_name: r.assembly_name,
            quantity: r.quantity
        }));

        listDataDtl.sort((a, b) => {
            if (a.wo_centerdisplay !== b.wo_centerdisplay) {
                return a.wo_centerdisplay.localeCompare(b.wo_centerdisplay);
            }
            return a.prod_operationdisplay.localeCompare(b.prod_operationdisplay);
        });

        const mapDtl = new Map();

        for (const r of listDataDtl) {
            if (!mapDtl.has(r.wo_centerdisplay)) {
                mapDtl.set(r.wo_centerdisplay, new Map());
            }

            const opMap = mapDtl.get(r.wo_centerdisplay);

            if (!opMap.has(r.prod_operation)) {
                opMap.set(r.prod_operation, {
                    dataField: r.prod_operation,
                    caption: r.prod_operationdisplay,
                    alignment: 'center'
                });
            }
        }

        const columns = [...mapDtl.entries()].map(([caption, ops]) => ({
            caption,
            alignment: 'center',
            columns: [...ops.values()]
        }));

        const arrColumn = [
            {
                dataField: 'assembly_code',
                caption: 'Mã hàng',
                fixed: true
            },
            {
                dataField: 'assembly_name',
                caption: 'Tên hàng',
                fixed: true
            },
            {
                dataField: 'quantity',
                caption: 'Số lượng nhập kho',
                dataType: 'number',
                fixed: true
            },

            ...columns
        ];


        return arrColumn;
    }

    function splitEmpRows(row) {
        // Sau normalizeKey, các custom label của SS2 sẽ ra:
        // "Emp ID 1"         → "emp_id_1"
        // "Emp Name 1"       → "emp_name_1"
        // "Emp Job Title 1"  → "emp_job_title_1"
        // Đây khớp với tên biến hiện tại, không cần đổi.
        // Tuy nhiên cần kiểm tra trường hợp key có thể có khoảng trắng thừa.
        const empIndexes = [1, 2, 3, 4];
        const result = [];

        for (const i of empIndexes) {
            // Tìm key linh hoạt: ưu tiên chính xác, fallback tìm theo pattern
            const findKey = (prefix) => {
                const exact = `${prefix}_${i}`;
                if (row[exact] !== undefined) return exact;
                // fallback: tìm key kết thúc bằng `_${i}` và chứa prefix
                return Object.keys(row).find((k) => k.endsWith(`_${i}`) && k.startsWith(prefix)) || exact;
            };

            const empIdKey = findKey('emp_id');
            const empNameKey = findKey('emp_name');
            const empJobKey = findKey('emp_job_title');
            const empJobDisplayKey = findKey('emp_job_title') + 'display';

            const empId = row[empIdKey];
            const empName = row[empNameKey];
            const empJob = row[empJobKey];
            const empJobDisplay = row[empJobDisplayKey];

            if (!empId) continue;

            const newRow = {
                ...row,
                emp_id: empId,
                emp_name: empName,
                emp_job_title: empJob,
                emp_job_title_display: empJobDisplay
            };

            // xoá tất cả các key emp_*_1..4
            empIndexes.forEach((j) => {
                const prefixes = ['emp_id', 'emp_name', 'emp_job_title'];
                for (const p of prefixes) {
                    delete newRow[`${p}_${j}`];
                    delete newRow[`${p}_${j}display`];
                }
            });

            result.push(newRow);
        }

        return result;
    }

    function getLaborRowKey(row, rowIndex) {
        return row.id_labor || row.internal_id || row.internalid || row.id || `row_${rowIndex}`;
    }

    function normalizeMultiSelectParam(value) {
        if (!value) return [];
        const values = Array.isArray(value) ? value : String(value).split(',');
        return values
            .map((v) => String(v).trim())
            .filter((v) => /^\d+$/.test(v));
    }

    function getEmployeeFilterFormula(employeeIds) {
        const ids = employeeIds.join(',');
        return `CASE WHEN {custrecord_scv_prd_labor_emp_1.id} IN (${ids}) OR {custrecord_scv_prd_labor_emp_2.id} IN (${ids}) OR {custrecord_scv_prd_labor_emp_3.id} IN (${ids}) OR {custrecord_scv_prd_labor_emp_4.id} IN (${ids}) THEN 'T' ELSE 'F' END`;
    }

    function normalizeKey(key) {
        return key
            .normalize('NFD') // tách dấu
            .replace(/[\u0300-\u036f]/g, '') // bỏ dấu
            .replace(/[^a-zA-Z0-9 ]/g, '') // bỏ ký tự đặc biệt (., /)
            .trim()
            .replace(/\s+/g, '_') // space -> _
            .toLowerCase(); // viết thường
    }

    function normalizeArrayOfObjects(arr) {
        return arr.map((obj) => {
            const newObj = {};
            for (const key in obj) {
                newObj[normalizeKey(key)] = obj[key];
            }
            return newObj;
        });
    }

    const getDate = (parameters) => {
        return {
            startDate: parameters.custpage_from_date || getDefaultDateRange().startDate,
            endDate: parameters.custpage_to_date || getDefaultDateRange().endDate
        };
    };

    const getDefaultDateRange = () => {
        const today = new Date();
        return {
            startDate: format.format({
                value: new Date(today.getFullYear(), today.getMonth(), 1),
                type: format.Type.DATE
            }),
            endDate: format.format({
                value: new Date(today.getFullYear(), today.getMonth() + 1, 0),
                type: format.Type.DATE
            })
        };
    };

    const isSameMonthAndYear = (fromDate, toDate) => {
        if (!fromDate || !toDate) return false;
        try {
            const from = format.parse({ value: fromDate, type: format.Type.DATE });
            const to = format.parse({ value: toDate, type: format.Type.DATE });
            return from.getFullYear() === to.getFullYear()
                && from.getMonth() === to.getMonth();
        } catch (error) {
            return false;
        }
    };

    const isDateRangeValid = (fromDate, toDate) => {
        try {
            const from = format.parse({ value: fromDate, type: format.Type.DATE });
            const to = format.parse({ value: toDate, type: format.Type.DATE });
            return from.getTime() <= to.getTime();
        } catch (error) {
            return false;
        }
    };

    const getMaster = () => {
        const col = [
            { id: 'macot', label: 'STT', type: 'text', display: 'disabled' },
            { id: 'noidung', label: 'Năm', type: 'text', display: 'disabled' }
        ];
        // let colAdd = {name: 'formulatext', label: 'year', formula: "to_char({trandate}, 'YYYY')", summary: 'GROUP'}
        return { sublistId: 'custpage_sl_result', col };
    };

    const formatDate = (date) => {
        const dd = String(date.getDate()).padStart(2, '0');
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const yyyy = date.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
    };

    return { onRequest };
});
