/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

define([
    'N/https',
        'N/runtime',
        'N/query',
        'N/url',
        'N/ui/serverWidget',
        'N/search',
        '../lib/scv_lib_function',
        '../common/scv_common_ui.js',
        '../lib/scv_lib_report.js'
    ],
    (
        https,
        runtime,
        query,
        url,
        serverWidget,
        search,
        lfn,
        comUI,
        lrp
    ) => {

        const PAGE_SIZE = 600;
        const SEARCH_NXT_BEG = 'customsearch_scv_nxt_beg';
        const SEARCH_NXT_TRANS = 'customsearch_scv_nxt_trans';

        const onRequest = (context) => {
            if (context.request.method === 'GET') {
                let request = context.request;
                let parameters = request.parameters;
                let location_param = parameters.custpage_location;
                let item_param = parameters.custpage_item;
                let lot_no_param = parameters.custpage_lot_no;
                let from_Date_param = parameters.custpage_fromdate;
                let to_Date_param = parameters.custpage_todate;
                let status_param = parameters.custpage_status;
                let subsidiary_param = parameters.custpage_subsidiary;
                let isSearch = parameters.isSearch;

                let globalDauKy = 0;
                let globalNhap = 0;
                let globalXuat = 0;
                let globalCuoiKy = 0;

                let form, sublist;
                if (isSearch === 'T') {
                    let searchResult = https.requestSuitelet({
                        scriptId: "customscript_scv_sl_ep_nhapxuatton_lot",
                        deploymentId: "customdeploy_scv_sl_ep_nhapxuatton_lot",
                        urlParams: {
                            ...parameters
                        },
                        method: https.Method.POST
                    })

                    let result = JSON.parse(searchResult.body);

                    log.error('searchResult', searchResult);
                    log.error('result', result);
                    log.error('tabledata', result.tableData);

                    // let retrieveSearch_NXT_BEG = runSearch_NXT_BEG(SEARCH_NXT_BEG, PAGE_SIZE, location_param, item_param, lot_no_param, from_Date_param, status_param, to_Date_param, subsidiary_param, parameters);
                    // let retrieveSearch_NXT_TRANS = runSearch_NXT_TRANS(SEARCH_NXT_TRANS, PAGE_SIZE, location_param, item_param, lot_no_param, from_Date_param, status_param, to_Date_param, subsidiary_param, parameters);
                    // let addResults_NXT_BEG = fetchSearchResult_NXT_BEG(retrieveSearch_NXT_BEG);
                    // let addResults_NXT_TRANS = fetchSearchResult_NXT_TRANS(retrieveSearch_NXT_TRANS);

                    ({form, sublist} = createForm(parameters));

                    let slLine = 0;

                    result.tableData.forEach(row => {
                       addField(sublist, 'col00', slLine, row.itemid);
                          addField(sublist, 'col01', slLine, row.kho);
                            addField(sublist, 'col02', slLine, row.bin);
                            addField(sublist, 'col15', slLine, row.upccode);
                            addField(sublist, 'col16', slLine, row.displayname);
                            addField(sublist, 'col04', slLine, row.stockunit);
                            // addField(sublist, 'col03', slLine, generateLinkLot(row.lotnoid, row.lotno));
                            addField(sublist, 'col17', slLine, row.serimau);
                            addFieldCurrency(sublist, 'col05', slLine, row.begin_qty);
                            addFieldCurrency(sublist, 'col06', slLine, row.in_qty);
                            addFieldCurrency(sublist, 'col07', slLine, row.out_qty);
                            addFieldCurrency(sublist, 'col08', slLine, row.end_qty);
                            addField(sublist, 'col09', slLine, row.status);
                            addField(sublist, 'col20', slLine, row.memo);
                            addField(sublist, 'col18', slLine, row.receiptdate);
                            addField(sublist, 'col014', slLine, row.hsd);
                            addField(sublist, 'col19', slLine, row.coreweigh);
                            addField(sublist, 'col21', slLine, row.macu);
                            addField(sublist, 'col22', slLine, row.dieuchuyen);
                            addField(sublist, 'col23', slLine, row.xuatban);

                            globalDauKy += Number(row.begin_qty);
                            globalNhap += Number(row.in_qty);
                            globalXuat += Number(row.out_qty);
                            globalCuoiKy += Number(row.end_qty);

                            slLine ++
                    })

                    // let hasTranLines = 0;
                    //
                    // for (let i = 0; i < addResults_NXT_BEG.length; i++) {
                    //     let result_BEG = addResults_NXT_BEG[i];
                    //     hasTranLines = 0;
                    //
                    //     if (Number(result_BEG.Begin_Qty) !== 0) {
                    //         addField(sublist, 'col00', slLine, result_BEG.Item_Id);
                    //         addField(sublist, 'col01', slLine, result_BEG.Location);
                    //         addField(sublist, 'col02', slLine, result_BEG.Bin);
                    //         addField(sublist, 'col15', slLine, result_BEG.UPCCode);
                    //         addField(sublist, 'col16', slLine, result_BEG.Displayname);
                    //         addField(sublist, 'col17', slLine, result_BEG.Serimau);
                    //         addField(sublist, 'col18', slLine, result_BEG.ReceiptDate);
                    //         addField(sublist, 'col19', slLine, result_BEG.CoreWeigh);
                    //         addField(sublist, 'col20', slLine, result_BEG.Memo);
                    //         addField(sublist, 'col03', slLine, generateLinkLot(result_BEG.LotNoId, result_BEG.LotNo));
                    //         addField(sublist, 'col04', slLine, result_BEG.StockUnit);
                    //         addFieldCurrency(sublist, 'col05', slLine, Number(result_BEG.Begin_Qty / result_BEG.convertStockUnit));
                    //         // add tổng đầu kỳ
                    //         globalDauKy = Number(globalDauKy) + Number(result_BEG.Begin_Qty);
                    //         addField(sublist, 'col09', slLine, result_BEG.Status);
                    //         addField(sublist, 'col014', slLine, result_BEG.Hsd);//
                    //         addField(sublist, 'col22', slLine, result_BEG.DieuChuyen)
                    //
                    //         let beginQuantity = Number(result_BEG.Begin_Qty);
                    //
                    //         let cuoiKy = 0;
                    //         let idxTranLine = 0;
                    //         for (let m = 0; m < addResults_NXT_TRANS.length; m++) {
                    //             let result_I_O = addResults_NXT_TRANS[m];
                    //             if (result_BEG.Location === result_I_O.Location &&
                    //                 result_BEG.Item === result_I_O.Item &&
                    //                 result_BEG.LotNo === result_I_O.LotNo &&
                    //                 result_BEG.Status === result_I_O.Status &&
                    //                 result_BEG.Bin === result_I_O.Bin
                    //             ) {
                    //                 addField(sublist, 'col00', slLine, result_I_O.Item_Id);
                    //                 addField(sublist, 'col01', slLine, result_I_O.Location);
                    //                 addField(sublist, 'col02', slLine, result_I_O.Bin);
                    //                 addField(sublist, 'col15', slLine, result_I_O.UPCCode);
                    //                 addField(sublist, 'col16', slLine, result_I_O.Displayname);
                    //                 addField(sublist, 'col04', slLine, result_I_O.StockUnit);
                    //                 addField(sublist, 'col03', slLine, generateLinkLot(result_I_O.LotNoId, result_I_O.LotNo));
                    //                 addField(sublist, 'col17', slLine, result_I_O.Serimau);
                    //
                    //                 if (idxTranLine > 0) {
                    //                     addFieldCurrency(sublist, 'col05', slLine, 0);
                    //                     beginQuantity = 0;
                    //                     cuoiKy = result_I_O.In_Qty - result_I_O.Out_Qty;
                    //                 } else {
                    //                     addFieldCurrency(sublist, 'col05', slLine, beginQuantity);
                    //                     cuoiKy = beginQuantity + result_I_O.In_Qty - result_I_O.Out_Qty;
                    //                 }
                    //                 addFieldCurrency(sublist, 'col06', slLine, result_I_O.In_Qty / result_I_O.convertStockUnit);
                    //                 addFieldCurrency(sublist, 'col07', slLine, result_I_O.Out_Qty / result_I_O.convertStockUnit);
                    //                 addFieldCurrency(sublist, 'col08', slLine, countDecimals(parseFloat(cuoiKy)) > 2 ? cuoiKy.toFixed(2) : cuoiKy);
                    //                 // addFieldCurrency(sublist, 'col08', slLine, cuoiKy);
                    //                 addField(sublist, 'col09', slLine, result_I_O.Status);
                    //                 addField(sublist, 'col014', slLine, result_I_O.Hsd);//
                    //                 addField(sublist, 'col18', slLine, result_I_O.ReceiptDate);
                    //                 addField(sublist, 'col19', slLine, result_I_O.CoreWeigh);
                    //                 addField(sublist, 'col20', slLine, result_I_O.Memo);
                    //
                    //                 addField(sublist, 'col21', slLine, result_I_O.FormerCode); // cột mới add
                    //                 addField(sublist, 'col22', slLine, result_I_O.DieuChuyen);
                    //                 addField(sublist, 'col23', slLine, result_I_O.XuatBan);
                    //                 // add tổng nhập, xuat, cuối kỳ
                    //                 globalNhap += result_I_O.In_Qty / result_I_O.convertStockUnit;
                    //                 globalXuat += result_I_O.Out_Qty / result_I_O.convertStockUnit;
                    //                 globalCuoiKy += cuoiKy;
                    //                 hasTranLines++;
                    //                 slLine++;
                    //                 idxTranLine++;
                    //             }
                    //         }
                    //         if (hasTranLines === 0) {
                    //             addFieldCurrency(sublist, 'col06', slLine, 0)
                    //             addFieldCurrency(sublist, 'col07', slLine, 0)
                    //             addFieldCurrency(sublist, 'col08', slLine, Number(result_BEG.Begin_Qty / result_BEG.convertStockUnit));
                    //             globalCuoiKy += Number(result_BEG.Begin_Qty / result_BEG.convertStockUnit);
                    //             slLine++;
                    //         }
                    //     }
                    // }
                    //
                    // addResults_NXT_TRANS.forEach((result_I_O) => {
                    //     hasTranLines = 0;
                    //     // check xem có dòng nào đã được add vào sublist chưa, nếu dòng chưa được add thì add sau
                    //     addResults_NXT_BEG.forEach((result_BEG) => {
                    //         if (result_BEG.Location === result_I_O.Location &&
                    //             result_BEG.Item === result_I_O.Item &&
                    //             result_BEG.LotNo === result_I_O.LotNo &&
                    //             result_BEG.Status === result_I_O.Status &&
                    //             result_BEG.Bin === result_I_O.Bin &&
                    //             (Number(result_BEG.Begin_Qty) > 0 || Number(result_BEG.Begin_Qty) < 0)) {
                    //             hasTranLines++;
                    //         }
                    //     });
                    //
                    //     if (hasTranLines === 0) {
                    //         addField(sublist, 'col00', slLine, result_I_O.Item_Id);
                    //         addField(sublist, 'col01', slLine, result_I_O.Location);
                    //         addField(sublist, 'col02', slLine, result_I_O.Bin);
                    //         addField(sublist, 'col15', slLine, result_I_O.UPCCode);
                    //         addField(sublist, 'col16', slLine, result_I_O.Displayname);
                    //         addField(sublist, 'col17', slLine, result_I_O.Serimau);
                    //         addField(sublist, 'col18', slLine, result_I_O.ReceiptDate);
                    //         addField(sublist, 'col19', slLine, result_I_O.CoreWeigh);
                    //         addField(sublist, 'col20', slLine, result_I_O.Memo);
                    //         addField(sublist, 'col03', slLine, generateLinkLot(result_I_O.LotNoId, result_I_O.LotNo));
                    //         addField(sublist, 'col04', slLine, result_I_O.StockUnit);
                    //
                    //         addFieldCurrency(sublist, 'col05', slLine, 0);
                    //         addFieldCurrency(sublist, 'col06', slLine, (result_I_O.In_Qty / result_I_O.convertStockUnit));
                    //         addFieldCurrency(sublist, 'col07', slLine, (result_I_O.Out_Qty / result_I_O.convertStockUnit));
                    //         addFieldCurrency(sublist, 'col08', slLine, (result_I_O.In_Qty / result_I_O.convertStockUnit) - (result_I_O.Out_Qty / result_I_O.convertStockUnit));
                    //         // add tổng nhập, xuat, cuối kỳ
                    //         globalNhap += (result_I_O.In_Qty / result_I_O.convertStockUnit);
                    //         globalXuat += (result_I_O.Out_Qty / result_I_O.convertStockUnit);
                    //         globalCuoiKy += result_I_O.In_Qty / result_I_O.convertStockUnit - result_I_O.Out_Qty / result_I_O.convertStockUnit;
                    //
                    //         addField(sublist, 'col09', slLine, result_I_O.Status);
                    //         addField(sublist, 'col014', slLine, result_I_O.Hsd);//
                    //         addField(sublist, 'col21', slLine, result_I_O.FormerCode); // cột mới add
                    //         addField(sublist, 'col22', slLine, result_I_O.DieuChuyen);
                    //         addField(sublist, 'col23', slLine, result_I_O.XuatBan);
                    //         slLine++;
                    //     }
                    // });
                    // add tổng đầu kỳ, nhập, xuất, cuối kỳ vào line cuối
                    addField(sublist, 'col15', slLine, 'Tổng');
                    addFieldCurrency(sublist, 'col05', slLine, globalDauKy.toFixed(2));
                    addFieldCurrency(sublist, 'col06', slLine, globalNhap.toFixed(2));
                    addFieldCurrency(sublist, 'col07', slLine, globalXuat.toFixed(2));
                    addFieldCurrency(sublist, 'col08', slLine, globalCuoiKy.toFixed(2));
                } else {
                    ({form, sublist} = createForm(parameters));
                }
                context.response.writePage(form);
            }
        }

        const createForm = (parameters) => {
            let userSub = runtime.getCurrentUser().subsidiary;

            let form = serverWidget.createForm({
                title: 'Nhập Xuất Tồn theo số Lô',
                hideNavBar: false
            });
            lfn.addSavedSearchToForm(form, [
                {id: SEARCH_NXT_BEG, title: 'SCV NXT theo Lô - begin (don\'t update)\n'},
                {id: SEARCH_NXT_TRANS, title: 'SCV NXT theo Lô - trans (don\'t update)\n'},
            ]);
            form.clientScriptModulePath = '../cssl/scv_cs_sl_thanh_test.js';
            addButton(form, 'custpage_bt_refresh', 'Refresh', 'refresh()');
            addButton(form, 'custpage_bt_search', 'Search', 'onSearch()');
            addButton(form, 'custpage_bt_export2', 'Xuất Excel', 'exportEx()');

            let subsidiaryF = form.addField({
                id: 'custpage_subsidiary',
                type: serverWidget.FieldType.SELECT,
                label: 'Công ty con',
            });
            subsidiaryF.isMandatory = true;
            lrp.addSelectSubsidiary(subsidiaryF, parameters.custpage_subsidiary);
            subsidiaryF.defaultValue = parameters.custpage_subsidiary || userSub;

            let locationF = form.addField({
                id: 'custpage_location',
                type: serverWidget.FieldType.MULTISELECT,
                label: 'Kho',
            });
            addLocationBySub(locationF, parameters.custpage_subsidiary || userSub)
            locationF.defaultValue = parameters.custpage_location || '';

            let itemF = form.addField({
                id: 'custpage_item',
                type: serverWidget.FieldType.TEXT,
                label: 'Item',
            });
            itemF.defaultValue = parameters.custpage_item;

            let lotnoF = form.addField({
                id: 'custpage_lot_no',
                type: serverWidget.FieldType.TEXT,
                label: 'Số Lô'
            });
            lotnoF.defaultValue = parameters.custpage_lot_no;

            let fromDateF = form.addField({
                id: 'custpage_fromdate',
                type: serverWidget.FieldType.DATE,
                label: 'Từ Ngày'
            }).updateLayoutType({layoutType: serverWidget.FieldLayoutType.STARTROW});
            fromDateF.isMandatory = true;
            fromDateF.defaultValue = parameters.custpage_fromdate;

            let toDateF = form.addField({
                id: 'custpage_todate',
                type: serverWidget.FieldType.DATE,
                label: 'Đến ngày'
            }).updateLayoutType({layoutType: serverWidget.FieldLayoutType.ENDROW});
            toDateF.isMandatory = true;
            toDateF.defaultValue = parameters.custpage_todate;

            let statusF = form.addField({
                id: 'custpage_status',
                type: serverWidget.FieldType.MULTISELECT,
                source: 'inventorystatus',
                label: 'Trạng thái'
            });
            statusF.defaultValue = parameters.custpage_status;

            let nhomCap1F = form.addField({
                id: 'custpage_nhom_cap_1',
                type: serverWidget.FieldType.MULTISELECT,
                label: 'Nhóm cấp 1',
            }).updateBreakType({breakType: serverWidget.FieldLayoutType.STARTROW});
            nhomCap1F.updateLayoutType({layoutType: serverWidget.FieldLayoutType.STARTROW});

            let nhomCap2F = form.addField({
                id: 'custpage_nhom_cap_2',
                type: serverWidget.FieldType.SELECT,
                label: 'Nhóm cấp 2',
            }).updateBreakType({breakType: serverWidget.FieldLayoutType.STARTROW})
                .updateLayoutType({layoutType: serverWidget.FieldLayoutType.STARTROW});

            let nhomCap3F = form.addField({
                id: 'custpage_nhom_cap_3',
                type: serverWidget.FieldType.SELECT,
                label: 'Nhóm cấp 3',
            }).updateLayoutType({layoutType: serverWidget.FieldLayoutType.MIDROW});

            let nhomCap4F = form.addField({
                id: 'custpage_nhom_cap_4',
                type: serverWidget.FieldType.SELECT,
                label: 'Nhóm cấp 4',
            }).updateLayoutType({layoutType: serverWidget.FieldLayoutType.ENDROW});

            comUI.addExcelJs(form);

            populateNhomCap1(form, nhomCap1F, parameters);
            if (checkNull(parameters.custpage_nhom_cap_1)) {
                populateNhomCap2(form, nhomCap2F, parameters)
                populateNhomCap3(form, nhomCap3F, parameters)
                populateNhomCap4(form, nhomCap4F, parameters)
            }

            let sublist = addSublist(form, 'custpage_table', serverWidget.SublistType.LIST, 'Kết Quả');
            addSublistField(sublist, 'col00', 'ID Item', serverWidget.FieldType.TEXT);
            addSublistField(sublist, 'col01', 'Kho', serverWidget.FieldType.TEXT);
            addSublistField(sublist, 'col02', 'Bin', serverWidget.FieldType.TEXT);
            addSublistField(sublist, 'col15', 'Mã', serverWidget.FieldType.TEXT);
            addSublistField(sublist, 'col16', 'Tên', serverWidget.FieldType.TEXTAREA);

            addSublistField(sublist, 'col04', 'ĐVT (Stock)', serverWidget.FieldType.TEXT);
            addSublistField(sublist, 'col03', 'Số Lô', serverWidget.FieldType.TEXT);
            addSublistField(sublist, 'col17', 'Seri Màu', serverWidget.FieldType.TEXT);
            addSublistField(sublist, 'col05', 'Đầu kì', serverWidget.FieldType.TEXT);
            addSublistField(sublist, 'col06', 'Nhập', serverWidget.FieldType.TEXT);

            addSublistField(sublist, 'col07', 'Xuất', serverWidget.FieldType.TEXT);
            addSublistField(sublist, 'col08', 'Cuối kì', serverWidget.FieldType.TEXT);
            addSublistField(sublist, 'col09', 'Trạng thái', serverWidget.FieldType.TEXT); // cột mới add
            addSublistField(sublist, 'col20', 'Ghi chú', serverWidget.FieldType.TEXTAREA);
            addSublistField(sublist, 'col18', 'Ngày nhập kho', serverWidget.FieldType.TEXT);

            addSublistField(sublist, 'col014', 'Ngày hết hạn', serverWidget.FieldType.TEXT);
            addSublistField(sublist, 'col19', 'Trọng lượng lõi', serverWidget.FieldType.TEXT);
            addSublistField(sublist, 'col21', 'Mã cũ', serverWidget.FieldType.TEXT); // cột mới add
            addSublistField(sublist, 'col22', 'Điều chuyển', serverWidget.FieldType.TEXT); // cột mới add
            addSublistField(sublist, 'col23', 'Xuất bán', serverWidget.FieldType.TEXT); // cột mới add

            return {form, sublist};
        }

        const addLocationBySub = (fieldLocation, subsidiary) => {
            let sql = `
                SELECT location.id, location.name, LocationSubsidiaryMap.subsidiary
                FROM location
                         JOIN LocationSubsidiaryMap
                              ON location.id = LocationSubsidiaryMap.location
                WHERE isinactive = 'F'`;
            if (subsidiary) sql += ` AND LocationSubsidiaryMap.subsidiary IN (${subsidiary})`;

            let resultSearch = query.runSuiteQL({query: sql});
            let arrLocationIds = resultSearch.asMappedResults();

            fieldLocation.addSelectOption({
                value: '',
                text: '--- Chọn Kho ---'
            })

            // return arrData;
            arrLocationIds.forEach(location => {
                fieldLocation.addSelectOption({
                    value: location.id,
                    text: location.name
                });
            });

        }

        const runSearch_NXT_BEG = (searchId, searchPageSize, p_location, p_item, p_lotno, from_Date, status_param, to_Date, subsidiary_param, parameters) => {
            let searchObj = search.load({id: searchId});
            let f = searchObj.filters;
            if (checkNull(parameters.custpage_nhom_cap_1)) {
                f.push(search.createFilter({
                    name: 'custitem_scv_group_lv1',
                    join: 'item',
                    // summary: search.Summary.GROUP,
                    operator: 'anyof',
                    values: parameters.custpage_nhom_cap_1.split(',')
                }));
            }

            if (checkNull(parameters.custpage_nhom_cap_2)) {
                f.push(search.createFilter({
                    name: 'custitem_scv_group_lv2',
                    join: 'item',
                    // summary: search.Summary.GROUP,
                    operator: 'anyof',
                    values: parameters.custpage_nhom_cap_2
                }));
            }

            if (checkNull(parameters.custpage_nhom_cap_3)) {
                f.push(search.createFilter({
                    name: 'custitem_scv_group_lv3',
                    join: 'item',
                    // summary: search.Summary.GROUP,
                    operator: 'anyof',
                    values: parameters.custpage_nhom_cap_3
                }));
            }

            if (checkNull(parameters.custpage_nhom_cap_4)) {
                f.push(search.createFilter({
                    name: 'custitem_scv_group_lv4',
                    join: 'item',
                    // summary: search.Summary.GROUP,
                    operator: 'anyof',
                    values: parameters.custpage_nhom_cap_4
                }));
            }

            if (checkNull(subsidiary_param)) {
                f.push(search.createFilter({
                    name: "subsidiary",
                    join: "transaction",
                    operator: 'anyof',
                    values: subsidiary_param
                }));
            }

            if (checkNull(p_location)) {
                f.push(search.createFilter({
                    name: "location",
                    operator: 'anyof',
                    values: p_location.split(',')
                }));
            }

            if (checkNull(p_item)) {
                f.push(search.createFilter({
                    name: "name",
                    join: 'item',
                    operator: search.Operator.CONTAINS,
                    values: p_item
                }));
            }

            if (checkNull(p_lotno)) {
                f.push(search.createFilter({
                    name: "inventorynumber",
                    join: "inventorynumber",
                    operator: search.Operator.CONTAINS,
                    values: p_lotno
                }));
            }

            if (checkNull(from_Date)) {
                f.push(search.createFilter({
                    name: 'trandate',
                    join: "transaction",
                    operator: search.Operator.BEFORE,
                    values: from_Date
                }));
            }

            if (checkNull(status_param)) {
                f.push(search.createFilter({
                    name: 'status',
                    operator: search.Operator.ANYOF,
                    values: status_param.split(',')
                }));
            }
            log.error('filters', f);
            return searchObj;
        }

        const runSearch_NXT_TRANS = (searchId, searchPageSize, p_location, p_item, p_lotno, from_Date, status_param, to_Date, subsidiary_param, parameters) => {
            let searchObj = search.load({
                id: searchId
            });
            let f = searchObj.filters;

            if (checkNull(parameters.custpage_nhom_cap_1)) {
                f.push(search.createFilter({
                    name: 'custitem_scv_group_lv1',
                    join: 'item',
                    // summary: search.Summary.GROUP,
                    operator: 'anyof',
                    values: parameters.custpage_nhom_cap_1.split(',')
                }));
            }

            if (checkNull(parameters.custpage_nhom_cap_2)) {
                f.push(search.createFilter({
                    name: 'custitem_scv_group_lv2',
                    join: 'item',
                    // summary: search.Summary.GROUP,
                    operator: 'anyof',
                    values: parameters.custpage_nhom_cap_2
                }));
            }

            if (checkNull(parameters.custpage_nhom_cap_3)) {
                f.push(search.createFilter({
                    name: 'custitem_scv_group_lv3',
                    join: 'item',
                    // summary: search.Summary.GROUP,
                    operator: 'anyof',
                    values: parameters.custpage_nhom_cap_3
                }));
            }

            if (checkNull(parameters.custpage_nhom_cap_4)) {
                f.push(search.createFilter({
                    name: 'custitem_scv_group_lv4',
                    join: 'item',
                    // summary: search.Summary.GROUP,
                    operator: 'anyof',
                    values: parameters.custpage_nhom_cap_4
                }));
            }

            if (checkNull(subsidiary_param)) {
                f.push(search.createFilter({
                    name: "subsidiary",
                    join: "transaction",
                    operator: 'anyof',
                    values: subsidiary_param
                }));
            }

            if (checkNull(p_location)) {
                f.push(search.createFilter({
                    name: "location",
                    operator: 'anyof',
                    values: p_location.split(',')
                }));
            }

            if (checkNull(p_item)) {
                f.push(search.createFilter({
                    name: "name",
                    join: 'item',
                    //join: "item",
                    operator: search.Operator.CONTAINS,
                    values: p_item
                }));
            }

            if (checkNull(p_lotno)) {
                f.push(search.createFilter({
                    name: "inventorynumber",
                    join: "inventorynumber",
                    operator: search.Operator.CONTAINS,
                    values: p_lotno
                }));
            }

            if (checkNull(from_Date)) {
                f.push(search.createFilter({
                    name: 'trandate',
                    join: "transaction",
                    operator: search.Operator.WITHIN,
                    values: [from_Date, to_Date]
                }));
            }

            if (checkNull(status_param)) {
                f.push(search.createFilter({
                    name: 'status',
                    operator: search.Operator.ANYOF,
                    values: status_param.split(',')
                }));
            }
            return searchObj;
        }

        const fetchSearchResult_NXT_BEG = (s) => {
            let results = [];
            let pagedData = s.runPaged({pageSize: 600});
            let ds_Location, ds_Item, ds_LotNo, ds_StockUnit, ds_Begin_Qty, ds_SaleUnit,
                ds_ConvertRate, ds_Hsd, ds_UPCCode, ds_Displayname, ds_Serimau, ds_CoreWeigh,
                ds_ReceiptDate, ds_Memo, ds_status;
            for (let i = 0; i < pagedData.pageRanges.length; i++) {
                let currentPage = pagedData.fetch(i);
                let c = pagedData.searchDefinition.columns;
                currentPage.data.forEach(function (result) {

                    ds_Location = result.getText(c[0]);
                    ds_Item = result.getText(c[1]);
                    let ds_Item_Id = result.getValue(c[1]);
                    ds_LotNo = result.getText(c[2]);
                    ds_StockUnit = result.getText(c[3]);
                    ds_Begin_Qty = result.getValue(c[4]);
                    ds_SaleUnit = result.getText(c[5]);
                    ds_ConvertRate = result.getValue(c[6]);
                    ds_Hsd = result.getValue(c[7]);
                    let convertStockUnit = Number(result.getValue(c[8]));
                    convertStockUnit = convertStockUnit === 0 ? 1 : convertStockUnit;
                    ds_status = result.getText(c[9]);
                    ds_UPCCode = result.getValue(c[14]);
                    ds_Displayname = result.getValue(c[15]);
                    ds_Serimau = result.getValue(c[10]);
                    ds_CoreWeigh = result.getValue(c[11]);
                    ds_ReceiptDate = result.getValue(c[12]);
                    ds_Memo = result.getValue(c[13]);
                    ds_former_code = result.getValue(c[16]);
                    let bin = result.getText(c[17]);
                    let ds_dieu_chuyen = result.getValue(c[22]);

                    results.push(
                        {
                            Location: ds_Location,
                            Item: ds_Item,
                            Item_Id: ds_Item_Id,
                            LotNo: ds_LotNo,
                            LotNoId: result.getValue(c[2]),
                            StockUnit: ds_StockUnit,
                            Begin_Qty: ds_Begin_Qty,
                            SaleUnit: ds_SaleUnit,
                            ConvertRate: ds_ConvertRate,
                            Hsd: ds_Hsd,
                            convertStockUnit: convertStockUnit,
                            Status: ds_status,
                            Serimau: ds_Serimau,
                            CoreWeigh: ds_CoreWeigh,
                            ReceiptDate: ds_ReceiptDate,
                            Memo: ds_Memo,
                            UPCCode: ds_UPCCode,
                            Displayname: ds_Displayname,
                            FormerCode: ds_former_code,
                            Bin: bin,
                            DieuChuyen: ds_dieu_chuyen
                        }
                    );
                });
            }
            return results;
        }

        const fetchSearchResult_NXT_TRANS = (s) => {
            let results = [];
            let pagedData = s.runPaged({
                pageSize: 600
            });
            let ds_Location, ds_Item, ds_LotNo, ds_LotNoId, ds_StockUnit, ds_In_Qty, ds_Out_Qty, ds_SaleUnit,
                ds_ConvertRate,
                ds_Hsd, ds_Memo, ds_UPCCode, ds_Displayname, ds_status, ds_former_code, ds_dieu_chuyen, ds_xuat_ban,
                convertStockUnit, ds_Serimau, ds_ngaynhaphang, ds_CoreWeigh, ds_bin
            ;
            for (let i = 0; i < pagedData.pageRanges.length; i++) {
                let currentPage = pagedData.fetch(i);
                let c = pagedData.searchDefinition.columns;
                currentPage.data.forEach(function (result) {
                    ds_Location = result.getText(c[0]);
                    ds_Item = result.getText(c[1]);
                    let ds_Item_Id = result.getValue(c[1]);
                    ds_UPCCode = result.getValue(c[10]);
                    ds_Displayname = result.getValue(c[11]);
                    ds_LotNo = result.getText(c[2]);
                    ds_LotNoId = result.getValue(c[2]);
                    ds_StockUnit = result.getText(c[3]);
                    ds_In_Qty = Number(result.getValue(c[4]));
                    ds_Out_Qty = Number(result.getValue(c[5]));
                    ds_SaleUnit = result.getText(c[6]);
                    ds_ConvertRate = result.getValue(c[7]);
                    ds_Hsd = result.getValue(c[8]);
                    ds_Memo = result.getValue(c[12]);
                    ds_status = result.getText(c[13]);
                    ds_former_code = result.getValue(c[14]);
                    ds_Serimau = result.getValue(c[16]);
                    ds_ngaynhaphang = result.getValue(c[17]);
                    ds_CoreWeigh = result.getValue(c[18]);
                    convertStockUnit = Number(result.getValue(c[9]));
                    ds_bin = result.getText(c[15]);
                    ds_xuat_ban = result.getValue(c[23]);
                    ds_dieu_chuyen = result.getValue(c[24]);

                    convertStockUnit = convertStockUnit === 0 ? 1 : convertStockUnit;
                    results.push({
                        "Location": ds_Location,
                        "Item": ds_Item,
                        "Item_Id": ds_Item_Id,
                        "UPCCode": ds_UPCCode,
                        "Displayname": ds_Displayname,
                        "LotNo": ds_LotNo,
                        "LotNoId": ds_LotNoId,
                        "StockUnit": ds_StockUnit,
                        "In_Qty": ds_In_Qty,
                        "Out_Qty": ds_Out_Qty,
                        "SaleUnit": ds_SaleUnit,
                        "ConvertRate": ds_ConvertRate,
                        "Hsd": ds_Hsd,
                        'Memo': ds_Memo,
                        'convertStockUnit': convertStockUnit,
                        'Status': ds_status,
                        'FormerCode': ds_former_code,
                        'Bin': ds_bin,
                        'Serimau': ds_Serimau,
                        'ReceiptDate': ds_ngaynhaphang,
                        'CoreWeigh': ds_CoreWeigh,
                        'DieuChuyen': ds_dieu_chuyen,
                        'XuatBan': ds_xuat_ban
                    });
                });
            }
            return results;
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

        const populateNhomCap3 = (form, nhomCap3F, parameters) => {
            let idNhomCap2 = parameters.custpage_nhom_cap_2;
            setSelectOptionToDefaults(nhomCap3F);
            if (idNhomCap2) {
                addSelectOptionByParent(idNhomCap2, nhomCap3F);
            }
            nhomCap3F.defaultValue = parameters.custpage_nhom_cap_3;
        }

        const populateNhomCap4 = (form, nhomCap4F, parameters) => {
            let idNhomCap3 = parameters.custpage_nhom_cap_3;
            setSelectOptionToDefaults(nhomCap4F);
            if (idNhomCap3) {
                addSelectOptionByParent(idNhomCap3, nhomCap4F);
            }
            nhomCap4F.defaultValue = parameters.custpage_nhom_cap_4;
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

        const checkValue = (value) => {
            if (value !== null && value !== undefined && value !== "") return value;
            return "-None-";
        };


        const generateLinkLot = (idLot, lotNo) => {
            if (!idLot) return '';
            const linkLot = `/app/accounting/transactions/inventory/inventorynumberrecord.nl?id=${idLot}&id=${idLot}`;
            return '<a href="' + linkLot + '" target="_blank">' + lotNo + '</a>';
        };

        const addButton = (form, id, label, functionName) => {
            form.addButton({
                id: id,
                label: label,
                functionName: functionName
            });
        }

        const addField = (sublist, id, line, value) => {
            return sublist.setSublistValue({
                id: id,
                line: line,
                value: checkValue(value)
            });
        };

        const addFieldCurrency = (sublist, id, line, value) => {
            return sublist.setSublistValue({
                id: id,
                line: line,
                value: checkValue(changeCurrency(value))
            });
        }

        const addSublist = (form, id, type, label) => {
            return form.addSublist({
                id: id,
                type: type,
                label: label
            });
        }

        const addSublistField = (sublist, id, label, type) => {
            return sublist.addField({
                id: id,
                label: label,
                type: type
            });
        };

        const changeCurrency = (number) => {
            if (!checkNull(number)) return;
            let parts = number.toString().split(".");
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            if (parts[1] !== '00') return parts.join(".");
            return parts[0];
        }

        function countDecimals(value) {
            if (Math.floor(value) === value) return 0; // No decimals
            return value.toString().split(".")[1].length || 0;
        }

        const checkNull = (value) => value !== null && value !== undefined && value !== "";

        return {
            onRequest: onRequest
        };
    });
