/**
 * Nội dung:
 * Key:
 * * =======================================================================================
 *  Date                Author                  Description
 *  ?                   ?                       ?
 *  04 Sep 2025         Thành Ngô               Create Suitelet So sánh kết quả tồn kho Min Max from Ms. Tâm (link Clickup : https://app.clickup.com/t/86d04rafd)
 *
 **/
/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define([
        'N/format',
        'N/query',
        'N/runtime',
        'N/search',
        'N/ui/serverWidget',
        'N/url',
        '../lib/scv_lib_report',
        '../lib/scv_lib_common_info',
        '../olib/alasql/alasql.min@1.7.3',
        '../lib/scv_lib_custom_form.js'
    ],
    (
        format,
        query,
        runtime,
        search,
        serverWidget,
        url,
        libRep,
        libCommonInfo,
        alasql,
        libCustomForm
    ) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */

        const SavedSearch = {
            TON_KHO_TOI_THIEU: 'customsearch_scv_rp_min_inventory',               // báo cáo tồn kho tối thiểu
            TON_KHO_THEO_NHA_MAY: 'customsearch_scv_item_loc_available',             // kiểm tra tồn kho theo nhà máy
        }

        const onRequest = (scriptContext) => {

            let request = scriptContext.request;
            let parameters = request.parameters;
            log.error('onRequest - parameters', parameters);
            let response = scriptContext.response;
            let action = parameters.action;

            let masterCols = getMaster(parameters); // lấy cấu trúc dữ liệu của bảng kết quả và cả phần thêm cho tạo savedsearch

            let isSearch = parameters.isearch;
            let isGetData = parameters.isgetdata;
            let toDate = parameters.custpage_todate;

            isSearch = (!toDate) ? 'F' : isSearch;
            let objResult = null
            if (isSearch === 'T') {

                let filterTktt = [], filterTktnm = [];
                let listDataTktt = [], listDataTktnm = [];

                pushFilterTktt(filterTktt, parameters);    // filter tồn kho tối thiểu
                pushFilterTktnm(filterTktnm, parameters); // filter tồn kho theo nhà máy

                libRep.doSearchSSRangeLabelId(SavedSearch.TON_KHO_TOI_THIEU, 1000, listDataTktt, filterTktt);
                libRep.doSearchSSRangeLabelId(SavedSearch.TON_KHO_THEO_NHA_MAY, 1000, listDataTktnm, filterTktnm);

                objResult = buildData(listDataTktt, listDataTktnm) || null;
            }

            if (isGetData === 'T') {
                response.write(JSON.stringify({
                    data: objResult,
                    col: masterCols.col,
                    excelIdCols: getExcelCols()
                } || {}));
            } else if (action === 'getUrlTemplate') {
                response.write(JSON.stringify({
                    urlTemplate: libCommonInfo.getUrlFileTemplate('EXCEL', 'scv_xlsx_cmms_ton_kho.xlsx'),
                    reportName: 'Báo cáo so sánh tồn kho Min-Max'
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

        const buildData = (listDataTktt, listDataTktnm) => {
            let result = alasql(`
                select a.*, b.*,
                       ROWNUM() as stt,
                       CAST(a.Min_NM1 AS NUMBER) + CAST(a.Min_NM2 AS NUMBER) as sum_min_nm,
                       CAST(a.Max_NM1 AS NUMBER) + CAST(a.Max_NM2 AS NUMBER) as sum_max_nm,
                       IFNULL(b.NM1_approved, 0) as NM1_approved,
                       IFNULL(b.NM1_pre_approved, 0) as NM1_pre_approved,
                       IFNULL(b.NM2_approved, 0) as NM2_approved,
                       IFNULL(b.NM2_pre_approved, 0) as NM2_pre_approved,
                       IFNULL(b.NM1_qty_used, 0) as NM1_qty_used,
                       IFNULL(b.NM2_qty_used, 0) as NM2_qty_used
                       
                       
                from ? as a
                         left join ? as b on a.item_id = b.item_id 
                                                 and a.Subsidiary = b.Subsidiary
                order by a.item_lv1 , a.item_lv2
            `, [listDataTktt, listDataTktnm]);

            let currentItemLvl1 = null;
            let currentItemLvl2 = null;
            let idxLv1 = 0;
            let idxLv2 = 0;
            const romans = ["I","II","III","IV","V","VI","VII","VIII","IX","X",
                "XI","XII","XIII","XIV","XV","XVI","XVII","XVIII","XIX","XX"];

            result.splice(0, 0, {stt : 0}); // thêm 1 dòng đầu để dễ insert dòng nhóm cấp 1, vì chưa tiìm được cách làm colspan sao cho ko b díu
            for (let idx = 0; idx < result.length; idx++) {
                let row = result[idx];

                // Nhóm cấp 1 changed
                if (currentItemLvl1 !== row.item_lv1 && idx != 0) {
                    const headerRow1 = { stt: `\n${String.fromCharCode(65 + idxLv1)}. Nhóm cấp 1 ${row.item_lv1_display}` };
                    idxLv1 ++;
                    idxLv2 = 0;
                    result.splice(idx, 0, headerRow1);
                    currentItemLvl1 = row.item_lv1;
                    idx++; // skip over inserted row
                }

                // Nhóm cấp 2 changed
                if (currentItemLvl2 !== row.item_lv2 && idx != 0) {
                    const headerRow2 = { stt: `\n${romans[idxLv2]}. Nhóm cấp 2 ${row.item_lv2_display}` };
                    idxLv2 ++;
                    result.splice(idx, 0, headerRow2);
                    currentItemLvl2 = row.item_lv2;
                    idx++; // skip over inserted row
                }
            }

            return result;
        }

        const pushFilterTktt = (filter, parameters) => {
            if(checkNull(parameters.custpage_subsidiary)) {
                filter.push(search.createFilter({
                    name: 'subsidiary',
                    operator: search.Operator.ANYOF,
                    values: parameters.custpage_subsidiary
                }));
            }
            if (checkNull(parameters.custpage_nhom_cap_1)) {
                filter.push(search.createFilter({
                    name: 'custitem_scv_group_lv1',
                    operator: search.Operator.ANYOF,
                    values: parameters.custpage_nhom_cap_1.split(',')
                }));
            }
            if (checkNull(parameters.custpage_nhom_cap_2)) {
                filter.push(search.createFilter({
                    name: 'custitem_scv_group_lv2',
                    operator: search.Operator.ANYOF,
                    values: parameters.custpage_nhom_cap_2.split(',')
                }));
            }
            if (checkNull(parameters.custpage_item)) {
                filter.push(search.createFilter({
                    name: 'internalid',
                    operator: search.Operator.ANYOF,
                    values: parameters.custpage_item.split(',')
                }));
            }
        }

        const pushFilterTktnm = (filter, parameters) => {
            if(checkNull(parameters.custpage_subsidiary)) {
                filter.push(search.createFilter({
                    name: 'subsidiary',
                    join: 'item',
                    operator: search.Operator.ANYOF,
                    values: parameters.custpage_subsidiary
                }));
            }
            if (checkNull(parameters.custpage_nhom_cap_1)) {
                filter.push(search.createFilter({
                    name: 'custitem_scv_group_lv1',
                    join: 'item',
                    operator: search.Operator.ANYOF,
                    values: parameters.custpage_nhom_cap_1.split(',')
                }));
            }
            log.error('parameters.custpage_nhom_cap_2', parameters.custpage_nhom_cap_2.split(',').filter(Boolean));
            if (checkNull(parameters.custpage_nhom_cap_2)) {
                filter.push(search.createFilter({
                    name: 'custitem_scv_group_lv2',
                    join: 'item',
                    operator: search.Operator.ANYOF,
                    values: parameters.custpage_nhom_cap_2.split(',').filter(Boolean)
                }));
            }
            if (checkNull(parameters.custpage_item)) {
                filter.push(search.createFilter({
                    name: 'item',
                    operator: search.Operator.ANYOF,
                    values: parameters.custpage_item.split(',')
                }));
            }
            if (checkNull(parameters.custpage_todate)) {
                filter.push(search.createFilter({
                    name: 'trandate',
                    operator: search.Operator.ONORBEFORE,
                    values: parameters.custpage_todate
                }));
            }
        }

        const createForm = (parameters) => {
            let form = serverWidget.createForm({title: "BÁO CÁO SO SÁNH TỒN KHO MIN-MAX"});
            form.clientScriptModulePath = '../cssl/scv_cs_sl_cmms_ton_kho.js';
            form.addButton({id: 'custpage_bt_search', label: 'Tìm kiếm', functionName: 'searchReport()'});
            form.addButton({id: 'custpage_bt_export', label: 'Xuất file', functionName: 'exportReport()'});
            let container = 'fieldgroup_dc_main';
            form.addFieldGroup({id: container, label: 'Bộ lọc'});

            let fieldSub = form.addField({
                id: 'custpage_subsidiary',
                type: serverWidget.FieldType.SELECT,
                label: 'Công ty',
                source: 'subsidiary',
                container: container
            });

            let fieldNhomCap1 = form.addField({
                id: 'custpage_nhom_cap_1',
                type: serverWidget.FieldType.MULTISELECT,
                label: 'Nhóm cấp 1',
                source: 'custitem_scv_group_lv1',
                container: container
            });


            let fieldNhomCap2 = form.addField({
                id: 'custpage_nhom_cap_2',
                type: serverWidget.FieldType.MULTISELECT,
                label: 'Nhóm cấp 2',
                container: container
            })
            fieldNhomCap2.defaultValue = parameters.custpage_nhom_cap_2;

            let fieldItem = form.addField({
                id: 'custpage_item',
                type: serverWidget.FieldType.MULTISELECT,
                label: 'Item',
                source: 'item',
                container: container
            });


            let fieldTodate = form.addField({
                id: 'custpage_todate',
                type: serverWidget.FieldType.DATE,
                label: 'To date',
                container: container
            });



            // autopopulate and set default values for filters
            populateNhomCap1(form, fieldNhomCap1, parameters);
            if (checkNull(parameters.custpage_nhom_cap_1)) {
                fieldNhomCap1.defaultValue = parameters.custpage_nhom_cap_1.split(',');
            }
            if (checkNull(parameters.custpage_nhom_cap_1)) {
                populateNhomCap2(form, fieldNhomCap2, parameters)
                fieldNhomCap2.defaultValue = parameters.custpage_nhom_cap_2.split(',');
            }
            if(checkNull(parameters.custpage_subsidiary)) {
                fieldSub.defaultValue = parameters.custpage_subsidiary;
            }
            if (checkNull(parameters.custpage_item)) {
                fieldItem.defaultValue = parameters.custpage_item.split(',');
            }
            if (checkNull(parameters.custpage_todate)) {
                fieldTodate.defaultValue = parameters.custpage_todate;
            } else {
                fieldTodate.defaultValue = format.format({
                    value: new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' })),
                    type: format.Type.DATE
                });
            }

            return form;
        }

        // có thể tối ưu honw, sẽ đưa lên SB test sau
        const populateNhomCap1 = (form, nhomCap1F, parameters) => {
            let strQuery = `
                SELECT id, name
                FROM customrecord_scv_group_level
                WHERE parent IS NULL
                ORDER BY name ASC
            `;
            let result = query.runSuiteQL({query: strQuery}).asMappedResults();

            nhomCap1F.addSelectOption({value: '', text: '',});
            if (result && result.length > 0) {
                result.forEach(item => {
                    nhomCap1F.addSelectOption({value: item.id, text: `${item.name}`,});
                });
            }
            if (checkNull(parameters.custpage_nhom_cap_1)) nhomCap1F.defaultValue = parameters.custpage_nhom_cap_1.split(',');
        }

        const populateNhomCap2 = (form, nhomCap2F, parameters) => {
            let idNhomCap1 = parameters.custpage_nhom_cap_1.split(',').filter(Boolean).map(item => `'${item}'`).join(',');
            setSelectOptionToDefaults(nhomCap2F);
            if (idNhomCap1) {
                addSelectOptionByParent(idNhomCap1, nhomCap2F);
            }
            nhomCap2F.defaultValue = parameters.custpage_nhom_cap_2;
        }

        const setSelectOptionToDefaults = (field) => {
            field.getSelectOptions().forEach(option => {
                field.removeSelectOption({value: option.value});
            });
            field.addSelectOption({value: '', text: '', isSelected: true});
        }

        const addSelectOptionByParent = (idParent, fieldChild) => {
            let strQuery = `
                SELECT id, name
                FROM customrecord_scv_group_level
                WHERE parent IN (${idParent})
                ORDER BY name ASC
            `;
            let result = query.runSuiteQL({query: strQuery}).asMappedResults();
            if (result && result.length > 0) {
                result.forEach(item => {
                    fieldChild.addSelectOption({value: item.id, text: `${item.name}`,});
                });
            }
        }

        const getExcelCols = () => {
            return [
                'stt', 'item_id', 'item_name', 'item', 'item_spec', 'item_loc_purpose', 'ĐVT_display',
                'Min_NM2', 'Max_NM2', 'Min_NM1', 'Max_NM1',
                'sum_min_nm', 'sum_max_nm',
                'NM2_approved', 'NM2_pre_approved', 'NM1_approved', 'NM1_pre_approved',
                'NM2_qty_used', 'NM1_qty_used'
            ]
        }

        const getMaster = (params) => {
            let col = [
                {dataField: 'stt', caption: 'Số thứ tự', datatype: 'text'},
                {dataField: 'item_id', caption: 'Mã vật tư', datatype: 'text'},
                {dataField: 'item_name', caption: 'Tên vật tư', datatype: 'text'},
                {dataField: 'item', caption: 'Mã_Tên vật tư', datatype: 'text'},
                {dataField: 'item_spec', caption: 'Thông số kỹ thuật', datatype: 'text'},
                {dataField: 'item_loc_purpose', caption: 'Vị trí, mục đích sử dụng', datatype: 'text'},
                {dataField: 'ĐVT_display', caption: 'Đơn vị tính', datatype: 'text'},
                {
                    caption: 'TỒN KHO CHO PHÉP',
                    columns: [
                        {dataField: 'Min_NM2', caption: 'Min NM2', datatype: 'text'},
                        {dataField: 'Max_NM2', caption: 'Max NM2', datatype: 'text'},
                        {dataField: 'Min_NM1', caption: 'Min NM3', datatype: 'text'},
                        {dataField: 'Max_NM1', caption: 'Max NM3', datatype: 'text'},
                    ]
                },
                {dataField: 'sum_min_nm', caption: 'ΣTK.Min NM2+NM3', datatype: 'text'},
                {dataField: 'sum_max_nm', caption: 'ΣTK.Max NM2+NM3', datatype: 'text'},
                {
                    caption: `TỒN KHO ĐẾN NGÀY ${params.custpage_todate}`,
                    columns: [
                        {
                            caption: "NM2",
                            columns: [
                                {caption: "Đạt chất lượng", dataField: "NM2_approved"},
                                {caption: "Cũ, đạt chất lượng", dataField: "NM2_pre_approved"}
                            ]
                        },
                        {
                            caption: "NM3",
                            columns: [
                                {caption: "Đạt chất lượng", dataField: "NM1_approved"},
                                {caption: "Cũ, đạt chất lượng", dataField: "NM1_pre_approved"}
                            ]
                        }
                    ]
                },
                {
                    caption: "Số lượng sử dụng từ ngày…. đến ngày….",
                    columns: [
                        {caption: "NM2", dataField: "NM2_qty_used"},
                        {caption: "NM3", dataField: "NM1_qty_used"}
                    ]
                }
            ];
            return {sublistId: 'custpage_sl_result', col};
        }

        const checkNull = (value) => value !== null && value !== undefined && value !== "";

        return {onRequest}

    });
