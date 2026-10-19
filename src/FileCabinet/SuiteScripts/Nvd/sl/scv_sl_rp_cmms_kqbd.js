/**
 * Nội dung:
 * Key:
 * * =======================================================================================
 *  Date                Author                  Description
 *  ?                   ?                       ?
 *  08 Aug 2025         Thành Ngô               Create Suitelet Kết quả bảo dưỡng by Ms. Tâm (link Clickup : https://app.clickup.com/t/86czx6vp2)
 *
 **/
/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define([
        'N/format', 'N/runtime', 'N/search', 'N/ui/serverWidget', 'N/url',
        '../lib/scv_lib_report', '../lib/scv_lib_common_info',
        '../olib/alasql/alasql.min@1.7.3', '../lib/scv_lib_custom_form.js'
    ],
    (
        format, runtime, search, serverWidget, url,
        libRep, libCommonInfo, alasql, libCustomForm
    ) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */

        const SavedSearch = {
            KHBD_CHI_TIET_MAY: 'customsearch_scv_maintance_plan',               // kế hoạch bảo dưỡng chi tiết máy
            KQBD_CHI_TIET_MAY: 'customsearch_scv_maintance_result',             // kết quả bảo dưỡng chi tiết máy
        }

        const onRequest = (scriptContext) => {

            let request = scriptContext.request;
            let parameters = request.parameters;
            let response = scriptContext.response;
            let action = parameters.action;

            let masterCols = getMaster(); // lấy cấu trúc dữ liệu của bảng kết quả và cả phần thêm cho tạo savedsearch

            let isSearch = parameters.isearch;
            let isGetData = parameters.isgetdata;
            let yearId = parameters.custpage_year;

            let dateRange = yearId ? getYearDateRange(yearId) : null;
            isSearch = (!dateRange) ? 'F' : isSearch;
            let objResult = null, fromMonth = null, toMonth = null;
            if (isSearch === 'T') {
                pushColumn(masterCols.col);

                let filterKhbd = [], filterKqbd = [];
                let listDataKhbd = [], listDataKqbd = [];

                pushFilterKhbd(filterKhbd, parameters);
                pushFilterKqbd(filterKqbd, parameters, dateRange);

                libRep.doSearchSSRangeLabelId(SavedSearch.KHBD_CHI_TIET_MAY, 1000, listDataKhbd, filterKhbd);
                libRep.doSearchSSRangeLabelId(SavedSearch.KQBD_CHI_TIET_MAY, 1000, listDataKqbd, filterKqbd);

                objResult = buildData(listDataKhbd, listDataKqbd) || null;
            }

            if (isGetData === 'T') {
                response.write(JSON.stringify({
                    data: objResult,
                    col: masterCols.col,
                    excelIdCols: getExcelCols()
                } || {}));
            } else if (action === 'getUrlTemplate') {
                response.write(JSON.stringify({
                    urlTemplate: libCommonInfo.getUrlFileTemplate('EXCEL', 'scv_xlsx_cmms_kqbd.xlsx'),
                    reportName: 'Báo cáo kết quả bảo dưỡng'
                }));
            } else if (request.method === 'GET') {
                let form = createForm(parameters);
                libCustomForm.addFieldIncludeDxGrid(form);
                libCustomForm.addFieldScriptData(form, {
                    isearch: isSearch,
                    data: objResult,
                    columns: masterCols.col
                });
                libCustomForm.addFieldDxGridResult(form, "scvTabsContainer");
                response.writePage(form);
            }
        }

        const buildData = (listDataKhbd, listDataKqbd) => {
            let result = alasql(`
                select a.*, b.*
                from ? as a
                         left join ? as b on a.ma_chi_tiet = b.ma_chi_tiet
            `, [listDataKhbd, listDataKqbd]);

            result = result.map(row => {
                let kh_sum = 0;
                let kq_sum = 0;

                // Loop over months 1..12
                for (let month = 1; month <= 12; month++) {
                    if (row[`kh_t${month}`] === "X") {
                        kh_sum++;
                    }
                    if (row[`kq_t${month}`] === "Y") {
                        kq_sum++;
                    }
                }

                return {
                    ...row,
                    kh_sum,
                    kq_sum
                };
            })
            return result;
        }

        const pushFilterKhbd = (filter, parameters) => {
            filter.push(search.createFilter({
                name: 'custrecord_scv_cmms_eq_asset',
                operator: search.Operator.ANYOF,
                values: parameters.custpage_taisan.split(',')
            }));
        }

        const pushFilterKqbd = (filter, parameters, dateRange) => {
            filter.push(search.createFilter({
                name: 'custrecord_scv_cmms_wo_asset',
                operator: search.Operator.ANYOF,
                values: parameters.custpage_taisan.split(',')
            }));
            filter.push(search.createFilter({
                name: 'custrecord_scv_cmms_wo_date',
                operator: search.Operator.ONORAFTER,
                values: dateRange.fromdate
            }));
            filter.push(search.createFilter({
                name: 'custrecord_scv_cmms_wo_date',
                operator: search.Operator.ONORBEFORE,
                values: dateRange.todate
            }));
        }

        const getYearDateRange = (yearId) => {
            let lkYear = search.lookupFields({
                type: search.Type.ACCOUNTING_PERIOD,
                id: yearId,
                columns: ['startdate', 'enddate']
            });
            return {fromdate: lkYear.startdate, todate: lkYear.enddate};
        }

        const getDefaultYearId = () => {
            let today = format.format({type: format.Type.DATE, value: new Date()});
            let listData = [];
            let sqlYear = `select id from accountingperiod where isyear = 'T' and isinactive = 'F' and startdate <= ? and enddate >= ?`;
            libRep.doSearchSqlAll(listData, sqlYear, [today, today]);
            return listData[0] ? listData[0].id : '';
        }

        const createForm = (parameters) => {
            let form = serverWidget.createForm({title: "Báo cáo kết quả bảo dưỡng"});
            form.clientScriptModulePath = '../cssl/scv_cs_sl_rp_cmms_kqbd.js';
            form.addButton({id: 'custpage_bt_search', label: 'Tìm kiếm', functionName: 'searchReport()'});
            form.addButton({id: 'custpage_bt_export', label: 'Xuất file', functionName: 'exportReport()'});
            let container = 'fieldgroup_dc_main';
            form.addFieldGroup({id: container, label: 'Bộ lọc'});

            let fieldTaiSan = form.addField({
                id: 'custpage_taisan',
                type: serverWidget.FieldType.SELECT,
                label: 'Tài sản',
                container: container
            })
            fieldTaiSan.updateBreakType({breakType: serverWidget.FieldBreakType.STARTCOL});
            fieldTaiSan.isMandatory = true;
            let sqlTaiSan = `select id value, (name || ' ' || altname) text from customrecord_ncfar_asset where isinactive = 'F' and custrecord_scv_managedepartment in (?, ?) order by name`;
            libRep.addSelectionViaSql(fieldTaiSan, sqlTaiSan, [10, 11], true, parameters.custpage_taisan); // 10: Phòng Kỹ thuật, 11: PX Cơ điện

            let fieldNam = form.addField({
                id: 'custpage_year',
                type: serverWidget.FieldType.SELECT,
                label: 'NĂM',
                container: container
            });
            fieldNam.isMandatory = true;
            let sqlNam = `select id value, periodname text from accountingperiod where isinactive = 'F' and isyear = 'T' order by startdate desc`;
            libRep.addSelectionViaSql(fieldNam, sqlNam, [], true, parameters.custpage_year || getDefaultYearId());

            return form;
        }

        const getExcelCols = () => {
            return [
                'ma_ts_display', 'ten_ts', 'cum_thiet_bi', 'mo_ta_cum_thiet_bi',
                'ma_chi_tiet', 'ten_chi_tiet',
                'ma_cong_viec', 'ten_cong_viec',
                'kh_t1', 'kq_t1', 'kh_t2', 'kq_t2', 'kh_t3', 'kq_t3',
                'kh_t4', 'kq_t4', 'kh_t5', 'kq_t5', 'kh_t6', 'kq_t6',
                'kh_t7', 'kq_t7', 'kh_t8', 'kq_t8', 'kh_t9', 'kq_t9',
                'kh_t10', 'kq_t10', 'kh_t11', 'kq_t11', 'kh_t12', 'kq_t12',
                'kh_sum', 'kq_sum', 'tan_suat_bao_duong_display'
            ]
        }

        const PREFIX_COL_KH = 'kh_t';
        const PREFIX_COL_KQ = 'kq_t';

        const pushColumn = (col) => {

            for (let i = 1; i <= 12; i++) {
                col.push(
                    {
                        caption: 'Tháng ' + i,
                        columns: [
                            {dataField: PREFIX_COL_KH + i, caption: 'KH', datatype: 'string'},
                            {dataField: PREFIX_COL_KQ + i, caption: 'KQ', datatype: 'string'},
                        ]
                    }
                );
            }
            col.push({
                caption: 'Tổng',
                columns: [
                    {dataField: 'kh_sum', caption: 'KH', datatype: 'string'},
                    {dataField: 'kq_sum', caption: 'KQ', datatype: 'string'},
                ]
            });
            col.push({
                dataField: 'tan_suat_bao_duong_display', caption: 'Tần suất', datatype: 'string'
            })
        }

        const getMaster = () => {
            let col = [
                {
                    caption: 'Dây chuyền (cấp 1)',
                    columns: [
                        {dataField: 'ma_ts_display', caption: 'Mã TS ', datatype: 'text'},
                        {dataField: 'ten_ts', caption: 'Tên TS ', datatype: 'text'}
                    ]
                },
                {
                    caption: 'Cụm thiết bị (cấp 2)',
                    columns: [
                        {dataField: 'cum_thiet_bi', caption: 'Mã', datatype: 'text'},
                        {dataField: 'mo_ta_cum_thiet_bi', caption: 'Tên cụm thiết bị', datatype: 'text'}
                    ]
                },
                {
                    caption: 'Chi tiết máy (cấp 3)',
                    columns: [
                        {dataField: 'ma_chi_tiet', caption: 'Mã', datatype: 'text'},
                        {dataField: 'ten_chi_tiet', caption: 'Tên chi tiết', datatype: 'text'}
                    ]
                },
                {
                    caption: 'Công việc thực hiện',
                    columns: [
                        {dataField: 'ma_cong_viec', caption: 'Mã', datatype: 'text'},
                        {dataField: 'ten_cong_viec', caption: 'Diễn giải nội dung công việc', datatype: 'text'}
                    ]
                },
            ];
            return {sublistId: 'custpage_sl_result', col};
        }

        return {onRequest}

    });
