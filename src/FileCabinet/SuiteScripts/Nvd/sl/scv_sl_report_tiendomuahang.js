/**
 * Nội dung:
 * =======================================================================================
 *  Date                Author                  Description
 *  ?                   ?                       ?
 * 27/05/2025          Thanh Ngo                Create Suitelet báo cáo Tiến độ mua hàng, from mr.Hải(https://app.clickup.com/t/86cz0vqj1)
 * 08/04/2025         Thanh Ngo               Chỉnh sửa format, tính dữ liệu phần trăm cho trường hợp trùng item
 */
/**
 /**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/search', 'N/ui/serverWidget', 'N/file', '../olib/alasql/alasql.min@1.7.3.js', '../lib/scv_lib_common_html.js'],
    (search, serverWidget, file, alasql, libHtml) => {

        const IdSavedSearch = {
            SS01_PR_PROGRESS: 'customsearch_scv_report_pr_progress_mo',
            SS02_PO_PROGRESS: 'customsearch_scv_report_po_progress_mo',
            SS03_INB_SHIP_PROGRESS: 'customsearch_scv_report_inb_progress_mo',
            SS04_ITR_PROGRESS: 'customsearch_scv_report_itr_progress_mo',
        }

        const onRequest = (scriptContext) => {
            let request = scriptContext.request;
            let params = request.parameters;
            if (scriptContext.request.method === "POST") {
                let objResponse = {data: []};
                switch (params.action) {
                    case 'getData':
                        objResponse.data = getDataYcmh(params);
                        break;
                    case 'getTemplateExcel':
                        objResponse.url = getExcelTemplateUrl();
                        break;
                }
                scriptContext.response.setHeader({
                    name: 'Content-Type',
                    value: 'application/json'
                });
                scriptContext.response.write(JSON.stringify(objResponse));
            } else if (scriptContext.request.method === "GET") {
                let MainForm = onCreateFormUI(params);
                scriptContext.response.writePage(MainForm.form);
            }
        }

        const onCreateFormUI = (params) => {
            let mainForm = serverWidget.createForm({title: "Báo cáo tiến độ thực hiện mua hàng"});
            let mainGrp = addFieldGroup(mainForm, "fieldgrp_main", "Filter");
            mainForm.clientScriptModulePath = '../cssl/scv_cs_sl_tien_do_mua_hang.js';
            addBtnsToForm(mainForm);
            addFiltersToForm(mainForm, mainGrp, params)
            let optionGrid = onCreateDxGrid();
            libHtml.renderDxGrid(mainForm, optionGrid, []);
            return {form: mainForm};
        }

        const addFiltersToForm = (mainForm, mainGrp, params) => {
            const subsidiaryField = mainForm.addField({
                id: 'custpage_subsidiary',
                type: serverWidget.FieldType.SELECT,
                label: 'Công Ty',
                source: "subsidiary",
                container: mainGrp.id
            });
            subsidiaryField.setHelpText({help: 'Công ty theo đơn vị kinh doanh'});
            subsidiaryField.isMandatory = true;
            subsidiaryField.defaultValue = params.custpage_subsidiary || '';

            const ycmhFromDateField = mainForm.addField({
                id: 'custpage_ycmh_fromdt',
                type: serverWidget.FieldType.DATE,
                label: 'YCMH From Date',
                container: mainGrp.id
            }).updateLayoutType({layoutType: serverWidget.FieldLayoutType.STARTROW})
                .setHelpText({help: 'Chọn yêu cầu mua hàng lọc theo ngày bắt đầu'});
            ycmhFromDateField.defaultValue = params.custpage_ycmh_fromdt || '';

            const ycmhToDateField = mainForm.addField({
                id: 'custpage_ycmh_todt',
                type: serverWidget.FieldType.DATE,
                label: 'YCMH To Date',
                container: mainGrp.id
            }).updateLayoutType({layoutType: serverWidget.FieldLayoutType.ENDROW})
                .setHelpText({help: 'Chọn yêu cầu mua hàng lọc theo ngày kết thúc'});
            ycmhToDateField.defaultValue = params.custpage_ycmh_todt || '';

            const poFromDateField = mainForm.addField({
                id: 'custpage_po_fromdt',
                type: serverWidget.FieldType.DATE,
                label: 'PO From Date',
                container: mainGrp.id
            }).updateLayoutType({layoutType: serverWidget.FieldLayoutType.STARTROW})
                .setHelpText({help: 'Chọn PO lọc theo ngày bắt đâù'});
            poFromDateField.defaultValue = params.custpage_po_fromdt || '';

            const poToDateField = mainForm.addField({
                id: 'custpage_po_todt',
                type: serverWidget.FieldType.DATE,
                label: 'PO To Date',
                container: mainGrp.id
            }).updateLayoutType({layoutType: serverWidget.FieldLayoutType.ENDROW})
                .setHelpText({help: "Chọn PO lọc theo ngày kết thúc"});
            poToDateField.defaultValue = params.custpage_po_todt || '';

            const customSegmentField = mainForm.addField({
                id: 'custpage_customsegment',
                type: serverWidget.FieldType.SELECT,
                label: 'Kênh mua hàng',
                source: "customrecord_cseg_scv_pc",
                container: mainGrp.id
            }).setHelpText({help: 'Kênh mua hàng'});
            customSegmentField.defaultValue = params.custpage_customsegment || '';

            const purchaseDepartmentField = mainForm.addField({
                id: 'custpage_bophan_muahang',
                type: serverWidget.FieldType.SELECT,
                label: 'Bộ phận phụ trách mua hàng',
                source: 'department',
                container: mainGrp.id
            }).updateBreakType({breakType: serverWidget.FieldBreakType.STARTCOL})
                .setHelpText({help: 'Bộ phận phụ trách mua hàng' });
            purchaseDepartmentField.defaultValue = params.custpage_bophan_muahang || '';

            const orderTypeField = mainForm.addField({
                id: 'custpage_phanloai_ycmh',
                type: serverWidget.FieldType.SELECT,
                label: 'Phân loại YCMH',
                source: 'customrecord_scv_order_type',
                container: mainGrp.id
            }).setHelpText({help: 'Phân loại YCMH'});
            orderTypeField.defaultValue = params.custpage_phanloai_ycmh || '';

            const itemClassField = mainForm.addField({
                id: 'custpage_phanloai_hanghoa',
                type: serverWidget.FieldType.MULTISELECT,
                label: 'Phân loại hàng hóa',
                source: 'classification',
                container: mainGrp.id
            }).setHelpText({help: 'Phân loại hàng hóa'});
            itemClassField.defaultValue = params.custpage_phanloai_hanghoa
                ? String(params.custpage_phanloai_hanghoa).split(',')
                : [];

            const requestorField = mainForm.addField({
                id: 'custpage_requestor',
                type: serverWidget.FieldType.SELECT,
                label: 'Người yêu cầu',
                source: 'employee',
                container: mainGrp.id
            }).setHelpText({help: 'Người yêu cầu'});
            requestorField.defaultValue = params.custpage_requestor || '';

        }

        const addBtnsToForm = (mainForm) => {
            mainForm.addButton({
                id: "custpage_btn_refresh",
                label: "Refresh",
                functionName: "onRefreshForm()"
            });

            mainForm.addButton({
                id: "custpage_btn_search",
                label: "Search",
                functionName: "onSearchResult('F')"
            });
            mainForm.addButton({
                id: "custpage_btn_export",
                label: "Export",
                functionName: "onSearchResult('T')"
            });
        }

        const onCreateDxGrid = () => {
            let columnsGrid = [
                {
                    caption: 'Yêu cầu mua hàng',
                    columns: [
                        {dataField: 'so_ycmh', caption: 'Số YCMH', dataType: 'string'},
                        {dataField: 'ngay_duyet_ycmh', caption: 'Ngày duyệt YCMH', dataType: 'date'},
                        {dataField: 'upcode', caption: 'Mã hàng', dataType: 'string'},
                        {dataField: 'item_text', caption: 'Tên hàng', dataType: 'string'},
                        {dataField: 'mo_ta_chi_tiet', caption: 'Mô tả chi tiết', dataType: 'string'},
                        {dataField: 'don_vi_tinh', caption: 'ĐVT', dataType: 'string'},
                        {dataField: 'sl_duyet_mua', caption: 'SL Duyệt mua', dataType: 'number', format: "###,###,##0"},
                        {dataField: 'thoi_gian_can', caption: 'Thời gian cần', dataType: 'date'},
                    ]
                },
                {
                    caption: 'Đơn đặt hàng',
                    columns: [
                        {dataField: 'so_po', caption: 'Số Po', dataType: "string"},
                        {dataField: 'ngay_po', caption: 'Ngày đặt hàng', dataType: "date"},
                        {dataField: 'so_luong_po', caption: 'SL đặt hàng', dataType: "number", format: "###,###,##0"},
                        {
                            dataField: 'sl_con_lai_co_the_tao_po',
                            caption: 'SL còn lại',
                            dataType: "number",
                            format: "###,###,##0"
                        },
                    ]
                },
                {
                    caption: 'Lệnh nhập hàng',
                    columns: [
                        {dataField: 'ngay_inbound', caption: 'Ngày nhập', dataType: "date"},
                        {
                            dataField: 'so_luong_inb',
                            caption: 'Số lượng nhập',
                            dataType: "number",
                            format: "###,###,##0"
                        },
                    ]
                },
                {
                    caption: 'Nhập kho ',
                    columns: [
                        {dataField: 'ngay_itr', caption: 'Ngày nhập', dataType: "date"},
                        {dataField: 'so_luong_itr', caption: 'Sl nhập', dataType: "number", format: "###,###,##0"},
                        {
                            dataField: 'sl_con_lai_co_the_nhap_kho',
                            caption: 'Sl còn lại',
                            dataType: "number",
                            format: "###,###,##0"
                        },
                    ]
                },
                {
                    dataField: 'complete_percentage',
                    caption: 'Hoàn thành (%)',
                    dataType: "number",
                    format: "###,###,##0.00"
                }
            ];
            return {
                columns: columnsGrid,
                exportExcelEnable: true,
                excel: {name: "Báo cáo tiến độ thực hiện mua hàng"},
                columnChooser: false,
                filterRowVisible: false,
                headerFilterVisible: false,
                rowAlternationEnabled: true,
                pageSize: 500
            };
        }

        const getDataYcmh = (params) => {
            let searchResultPrProgress = getResultSsPrProgress(params);
            // lấy arrItems từ kết quả searchResultPrProgress để lọc trong trường hợp chỉ điền subsidiary, dữ liệu lên lons
            let arrItems = searchResultPrProgress.map((e) => e.item);
            let searchResultPoProgress = getResultSsPoProgress(params, arrItems)
            log.error('searchResultPrProgress', searchResultPrProgress)
            log.error('searchResultPoProgress', searchResultPoProgress)
            let resultJoinPrPo = alasql(
                `SELECT pr.subsidiary,
                        pr.so_ycmh,
                        pr.ngay_duyet_ycmh,
                        pr.upcode,
                        pr.item,
                        pr.item_text,
                        pr.mo_ta_chi_tiet,
                        pr.don_vi_tinh,
                        pr.sl_duyet_mua,
                        pr.thoi_gian_can,
                        pr.ori_line_id,
                        po.so_po,
                        po.ngay_po,
                        po.so_luong_po,
                        po.ori_line_id,
                        po.internal_id as po_id
                 FROM ? AS pr
                         LEFT JOIN ? AS po
                               ON pr.subsidiary = po.subsidiary
                                   AND pr.item = po.item
                                   AND pr.ori_line_id = po.ori_line_id
                `,
                [searchResultPrProgress, searchResultPoProgress]);

            arrItems = resultJoinPrPo.map((e) => e.item);
            let searchResultInbShipProgress = getResultSsInbShipProgress(params, arrItems);
            let searchResultItrProgress = getResultSsItrProgress(params, arrItems);

            let resultJoinInbShipItr = alasql(
                `SELECT inb.subsidiary,
                        inb.item,
                        inb.ori_line_id,
                        inb.ngay_inbound,
                        inb.so_luong_inb,
                        itr.ngay_itr,
                        itr.so_luong_itr,
                        itr.purchase_order

                 FROM ? AS inb
                          JOIN ? AS itr
                               ON inb.subsidiary = itr.subsidiary
                                   AND inb.item = itr.item
                                   AND inb.ori_line_id = itr.ori_line_id
                                   AND inb.so_itr = itr.so_itr`,
                [searchResultInbShipProgress, searchResultItrProgress]
            );

            let dataResult = alasql(
                `SELECT prpo.subsidiary,
                        prpo.so_ycmh,
                        prpo.ngay_duyet_ycmh,
                        prpo.upcode,
                        prpo.item,
                        prpo.item_text,
                        prpo.mo_ta_chi_tiet,
                        prpo.don_vi_tinh,
                        prpo.sl_duyet_mua,
                        prpo.thoi_gian_can,
                        prpo.ori_line_id,
                        prpo.so_po,
                        prpo.ngay_po,
                        prpo.so_luong_po,
                        prpo.ori_line_id,
                        inbitr.ngay_inbound,
                        inbitr.so_luong_inb,
                        inbitr.ngay_itr,
                        inbitr.so_luong_itr,
                        inbitr.purchase_order

                 FROM ? AS prpo
                          LEFT JOIN ? AS inbitr
                               ON prpo.subsidiary = inbitr.subsidiary
                                   AND prpo.item = inbitr.item
                                   AND prpo.ori_line_id = inbitr.ori_line_id 
                                   AND prpo.po_id = inbitr.purchase_order
                 ORDER BY prpo.so_ycmh,
--                           inbitr.purchase_order ASC,
                          prpo.so_po ASC,
                          inbitr.item,
                          inbitr.ngay_itr ASC,
                          inbitr.ngay_inbound ASC
                `,
                [resultJoinPrPo, resultJoinInbShipItr]
            );

            // dataResult.forEach((row) => {
            //     row.sl_con_lai_co_the_tao_po = row.sl_duyet_mua - (row.so_luong_po || 0);
            //     row.sl_con_lai_co_the_nhap_kho = row.so_luong_inb - (row.so_luong_itr || 0);
            // });

            calculateCompletePercentage(dataResult);
            return dataResult;
        }

        const calculateCompletePercentage = (dataResult) => {
            let curPo = '';
            let curItem = ''
            let curYcmh = '';
            let curPercentage = 0;
            let curOriLineId = '';
            for (let i = 0; i < dataResult.length; i++) {
                dataResult[i].sl_con_lai_co_the_tao_po = dataResult[i].sl_duyet_mua - (dataResult[i].so_luong_po || 0);
                dataResult[i].sl_con_lai_co_the_nhap_kho = dataResult[i].so_luong_inb - (dataResult[i].so_luong_itr || 0);

                if (curYcmh !== dataResult[i].so_ycmh) {

                    curYcmh = dataResult[i].so_ycmh;
                    curPo = dataResult[i].purchase_order;
                    curItem = dataResult[i].item;
                    curOriLineId = dataResult[i].ori_line_id;
                    curPercentage = Number(dataResult[i].so_luong_itr) / dataResult[i].so_luong_po * 100;
                    dataResult[i].complete_percentage = curPercentage;

                } else {
                   if (curPo !== dataResult[i].purchase_order) {
                        curItem = dataResult[i].item;
                        curOriLineId = dataResult[i].ori_line_id;
                        curPo = dataResult[i].purchase_order;
                        curPercentage =  Number(dataResult[i].so_luong_itr) / dataResult[i].so_luong_po * 100;
                        dataResult[i].complete_percentage = curPercentage;

                    }

                   else if (curPo === dataResult[i].purchase_order
                        && curItem !== dataResult[i].item) {

                        curItem = dataResult[i].item;
                        curOriLineId = dataResult[i].ori_line_id;
                        curPercentage = Number(dataResult[i].so_luong_itr) / dataResult[i].so_luong_po * 100;
                        dataResult[i].complete_percentage = curPercentage;

                    } else if (
                        curPo === dataResult[i].purchase_order &&
                        curItem === dataResult[i].item &&
                        curOriLineId !== dataResult[i].ori_line_id) {

                        curOriLineId = dataResult[i].ori_line_id;
                        curPercentage = Number(dataResult[i].so_luong_itr) / dataResult[i].so_luong_po * 100;
                        dataResult[i].complete_percentage = curPercentage;

                    } else if (
                        curPo === dataResult[i].purchase_order &&
                        curItem === dataResult[i].item &&
                        curOriLineId === dataResult[i].ori_line_id) {

                        curPercentage = Number(curPercentage) + (Number(dataResult[i].so_luong_itr) / dataResult[i].so_luong_po * 100);
                        dataResult[i].complete_percentage = curPercentage;

                    }
                }
            }
        }

        const getResultSsPrProgress = (params) => {
            let objSearch = search.load({id: IdSavedSearch.SS01_PR_PROGRESS});
            let filters = objSearch.filters;
            let columns = objSearch.columns;

            if (params.custpage_subsidiary) {
                filters.push(search.createFilter({
                    name: 'subsidiary',
                    operator: search.Operator.IS,
                    values: params.custpage_subsidiary
                }));
            }

            if (params.custpage_customsegment) {
                filters.push(search.createFilter({
                    name: 'cseg_scv_pc',
                    operator: search.Operator.IS,
                    values: params.custpage_customsegment
                }));
            }

            if (params.custpage_ycmh_fromdt) {
                filters.push(search.createFilter({
                    name: 'custbody_scv_date_approved',
                    operator: search.Operator.ONORAFTER,
                    values: params.custpage_ycmh_fromdt
                }));
            }

            if (params.custpage_ycmh_todt) {
                filters.push(search.createFilter({
                    name: 'custbody_scv_date_approved',
                    operator: search.Operator.ONORBEFORE,
                    values: params.custpage_ycmh_todt
                }));
            }

            if (params.custpage_bophan_muahang) {
                filters.push(search.createFilter({
                    name: 'custbody_scv_pur_depart',
                    operator : search.Operator.ANYOF,
                    values: params.custpage_bophan_muahang
                }))
            }

            if (params.custpage_phanloai_ycmh) {
                filters.push(search.createFilter({
                    name: 'custbody_scv_order_type',
                    operator : search.Operator.ANYOF,
                    values: params.custpage_phanloai_ycmh
                }))
            }

            if (params.custpage_phanloai_hanghoa) {
                filters.push(search.createFilter({
                    name: 'class',
                    operator : search.Operator.ANYOF,
                    values: params.custpage_phanloai_hanghoa.split(',')
                }))
            }

            if (params.custpage_requestor) {
                filters.push(search.createFilter({
                    name: 'custbody_scv_requestor',
                    operator: search.Operator.ANYOF,
                    values: params.custpage_requestor
                }));
            }

            let resultSearch = [];
            let pagedSearch = objSearch.runPaged({pageSize: 1000});

            pagedSearch.pageRanges.forEach(pageRange => {
                let page = pagedSearch.fetch({index: pageRange.index});
                page.data.forEach(e => {
                    resultSearch.push({
                        subsidiary: e.getValue(columns.find(col => col.label === '1.Subsidiary')),
                        so_ycmh: e.getValue(columns.find(col => col.label === '2.Số YCMH')),
                        ngay_duyet_ycmh: e.getValue(columns.find(col => col.label === '3.Ngày duyệt YCMH')),
                        upcode: e.getValue(columns.find(col => col.label === '4.UPC Code')),
                        item: e.getValue(columns.find(col => col.label === '5.Item')),
                        item_text: e.getText(columns.find(col => col.label === '5.Item')),
                        mo_ta_chi_tiet: e.getValue(columns.find(col => col.label === '6.Mô tả chi tiết')),
                        don_vi_tinh: e.getValue(columns.find(col => col.label === '7.Đơn vị tính')),
                        sl_duyet_mua: e.getValue(columns.find(col => col.label === '8.SL duyệt mua')),
                        thoi_gian_can: e.getValue(columns.find(col => col.label === '9.Thời gian cần')),
                        ori_line_id: e.getValue(columns.find(col => col.label === '10.Original Line ID')),
                        customsegment: e.getValue(columns.find(col => col.label === '11.Kênh mua hàng')),
                    });
                });
            });

            return resultSearch;
        }

        const getResultSsPoProgress = (params, arrItems) => {
            let objSearch = search.load({id: IdSavedSearch.SS02_PO_PROGRESS});
            let filters = objSearch.filters;
            let columns = objSearch.columns;

            if (params.custpage_subsidiary) {
                filters.push(search.createFilter({
                    name: 'subsidiary',
                    operator: search.Operator.IS,
                    values: params.custpage_subsidiary
                }));
            }
            if (params.custpage_customsegment) {
                filters.push(search.createFilter({
                    name: 'cseg_scv_pc',
                    operator: search.Operator.IS,
                    values: params.custpage_customsegment
                }));
            }

            if (params.custpage_po_fromdt) {
                filters.push(search.createFilter({
                    name: 'trandate',
                    operator: search.Operator.ONORAFTER,
                    values: params.custpage_po_fromdt
                }));
            }

            if (params.custpage_po_todt) {
                filters.push(search.createFilter({
                    name: 'trandate',
                    operator: search.Operator.ONORBEFORE,
                    values: params.custpage_po_todt
                }));
            }

            if (arrItems && arrItems.length > 0) {
                filters.push(search.createFilter({
                    name: 'item',
                    operator: search.Operator.ANYOF,
                    values: arrItems
                }));
            }

            let resultSearch = [];
            let pagedSearch = objSearch.runPaged({pageSize: 1000});

            pagedSearch.pageRanges.forEach(pageRange => {
                let page = pagedSearch.fetch({index: pageRange.index});
                page.data.forEach(e => {
                    resultSearch.push({
                        subsidiary: e.getValue(columns.find(col => col.label === '1.Subsidiary')),
                        so_po: e.getValue(columns.find(col => col.label === '2.Số PO')),
                        ngay_po: e.getValue(columns.find(col => col.label === '3.Ngày PO')),
                        item: e.getValue(columns.find(col => col.label === '4.Item')),
                        item_text: e.getText(columns.find(col => col.label === '4.Item')),
                        don_vi_tinh: e.getValue(columns.find(col => col.label === '5.Đơn vị tính')),
                        so_luong_po: e.getValue(columns.find(col => col.label === '6.Số lượng PO')),
                        ori_line_id: e.getValue(columns.find(col => col.label === '7.Original Line ID')),
                        customsegment: e.getValue(columns.find(col => col.label === '8.Kênh mua hàng')),
                        internal_id : e.getValue(columns.find(col => col.label === 'internalId')),
                    });
                });
            });

            return resultSearch;
        }

        const getResultSsInbShipProgress = (params, arrItems) => {
            let objSearch = search.load({id: IdSavedSearch.SS03_INB_SHIP_PROGRESS});
            let filters = objSearch.filters;
            let columns = objSearch.columns;

            if (params.custpage_subsidiary) {
                filters.push(search.createFilter({
                    name: 'subsidiary',
                    join: 'purchaseorder',
                    operator: search.Operator.IS,
                    values: params.custpage_subsidiary
                }));
            }

            if (arrItems && arrItems.length > 0) {
                filters.push(search.createFilter({
                    name: 'item',
                    operator: search.Operator.ANYOF,
                    values: arrItems
                }));
            }

            let resultSearch = [];
            let pagedSearch = objSearch.runPaged({pageSize: 1000});

            pagedSearch.pageRanges.forEach(pageRange => {
                let page = pagedSearch.fetch({index: pageRange.index});
                page.data.forEach(e => {
                    resultSearch.push({
                        subsidiary: e.getValue(columns.find(col => col.label === '1.Subsidiary')),
                        ngay_inbound: e.getValue(columns.find(col => col.label === '2.Ngày Inbound')),
                        item: e.getValue(columns.find(col => col.label === '3.Item')),
                        item_text: e.getText(columns.find(col => col.label === '3.Item')),
                        don_vi_tinh: e.getValue(columns.find(col => col.label === '4.Đơn vị tính')),
                        so_luong_inb: e.getValue(columns.find(col => col.label === '5.Số lượng INB')),
                        ori_line_id: e.getValue(columns.find(col => col.label === '6.Original Line ID')),
                        so_itr: e.getValue(columns.find(col => col.label === '7.Số ITR')),
                    });
                });
            });

            return resultSearch;
        }

        const getResultSsItrProgress = (params, arrItems) => {
            let objSearch = search.load({id: IdSavedSearch.SS04_ITR_PROGRESS});
            let filters = objSearch.filters;
            let columns = objSearch.columns;
            if (params.custpage_subsidiary) {
                filters.push(search.createFilter({
                    name: 'subsidiary',
                    operator: search.Operator.IS,
                    values: params.custpage_subsidiary
                }));
            }

            if (arrItems && arrItems.length > 0) {
                filters.push(search.createFilter({
                    name: 'item',
                    operator: search.Operator.ANYOF,
                    values: arrItems
                }));
            }

            let resultSearch = [];
            let pagedSearch = objSearch.runPaged({pageSize: 1000});
            pagedSearch.pageRanges.forEach(pageRange => {
                let page = pagedSearch.fetch({index: pageRange.index});
                page.data.forEach(e => {
                    resultSearch.push({
                        subsidiary: e.getValue(columns.find(col => col.label === '1.Subsidiary')),
                        ngay_itr: e.getValue(columns.find(col => col.label === '2.Ngày ITR')),
                        item: e.getValue(columns.find(col => col.label === '3.Item')),
                        item_text: e.getText(columns.find(col => col.label === '3.Item')),
                        don_vi_tinh: e.getValue(columns.find(col => col.label === '4.Đơn vị tính')),
                        so_luong_itr: e.getValue(columns.find(col => col.label === '5.Số lượng ITR')),
                        ori_line_id: e.getValue(columns.find(col => col.label === '6.Original line ID')),
                        purchase_order: e.getValue(columns.find(col => col.label === '7.Purchase Order')),
                        so_itr: e.getValue(columns.find(col => col.label === '8.Số ITR')),
                    });
                });
            });
            return resultSearch;
        }

        const addFieldGroup = (form, id, label) => {
            let obj = {id: id, label: label}
            form.addFieldGroup(obj);
            return obj;
        }

        const getExcelTemplateUrl = () => {
            // nên sử dụng query
            return file.load({id: '../xls/scv_xlsx_tien_do_mua_hang.xlsx'}).url;
        }

        return {onRequest}

    });
