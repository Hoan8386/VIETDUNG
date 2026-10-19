/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */

define(['N/file', 'N/search'],
    (file, search) => {
        const SEARCH_nxt_BEG = 'customsearch_scv_nxt_beg';
        const SEARCH_nxt_TRANS = 'customsearch_scv_nxt_trans';

        const onRequest = (context) => {
            let parameters = context.request.parameters;
            log.error('parameters', parameters);
            if (context.request.method === 'POST') {
                let objResponse = getExcelObjData(parameters);
                log.error('objResponse', objResponse);
                context.response.setHeader({name: 'Content-Type', value: 'application/json; charset=utf-8'});
                context.response.write(JSON.stringify(objResponse));
            }
        }

        const getExcelObjData = (parameters) => {
            let colId = [
                'itemid', 'kho', 'bin',  'upccode',  'displayname',  'stockunit', 'lotno', 'serimau',
                'begin_qty', 'in_qty', 'out_qty', 'end_qty',
                'status',  'memo',  'receiptdate', 'hsd', 'coreweigh', 'macu', 'dieuchuyen', 'xuatban' ];
            let templateUrl = file.load('../xls/scv_xlsx_nhapxuatton_lot.xlsx').url;
            let filename = 'Báo cáo nhập xuất tồn theo lô.xlsx';
            let {tableData, sumTonDau, sumNhap, sumXuat, sumCuoiKy} = getTableData(parameters);
            let mappedData = getMappedData(parameters, sumTonDau, sumNhap, sumXuat, sumCuoiKy);
            let arrHeaderNames = {
                line1: ['ID Item','Kho','Bin','Mã','Tên','ĐVT (Stock)','Số Lô', 'Seri Màu',
                           'Đầu kì','Nhập','Xuất','Cuối kì',
                          'Trạng thái', 'Ghi chú','Ngày nhập kho','Ngày hết hạn','Trọng lượng lõi',
                          'Mã cũ','Điều chuyển','Xuất bán'],

                line2: ['','','','',   '','','','',    'Đầu kỳ', 'Nhập', 'Xuất', 'Cuối kỳ',   '','','','',  '','','','',]
            }
            let headerRowFormat = getHeaderRowsFormat(arrHeaderNames);
            return {
                templatetype: 'excel',
                templateUrl,
                tableData,
                mappedData,
                colId,
                filename,
                idxSourceRow: 7,
                idxRowData: 8,
                headerRowFormat,
                sumTonDau,
                sumNhap,
                sumXuat,
                sumCuoiKy
            }
        }

        const getHeaderRowsFormat = (arrHeaderNames) => {
            let cells = {
                line1: [],
                line2: []
            };

            for (let line in arrHeaderNames) {
                arrHeaderNames[line].forEach((element) => {
                    cells[line].push({
                        value : element,
                        style : {
                            alignment: {
                                horizontal: 'center',
                                vertical: 'middle'
                            },
                            border: {
                                top: {style: 'thin'},
                                left: {style: 'thin'},
                                bottom: {style: 'thin'},
                                right: {style: 'thin'}
                            },
                            fill : {type: 'pattern', pattern: 'solid', fgColor: {argb: '9C6700'}},
                            font: {bold: true, name: 'Times New Roman', size : 11, color: {argb :  'FFFFFF'}},

                        },
                    })
                });
            }

            return {
                height: 20,
                cells: cells
            }
        }

        const getMappedData = (parameters, sumTonDau, sumNhap, sumXuat, sumCuoiKy) => {
            return {
                'A2': {tuNgaydenNgay: `${parameters.custpage_fromdate} - ${parameters.custpage_todate}`},
                'B3': {tenKho: parameters.custpage_loc_name},
                'I8': {sumDauKy: sumTonDau},
                'J8': {sumNhap: sumNhap},
                'K8': {sumXuat: sumXuat},
                'L8': {sumCuoiKy: sumCuoiKy},
            }
        }

        const getTableData = (parameters) => {
            let tableData = [];
            let sumTonDau = 0;
            let sumNhap = 0;
            let sumXuat = 0;
            let sumCuoiKy = 0;

            let retrieveSearch_nxt_BEG = runSearch_nxt_BEG(SEARCH_nxt_BEG, parameters);
            let retrieveSearch_nxt_TRANS = runSearch_nxt_TRANS(SEARCH_nxt_TRANS, parameters);
            let addResults_nxt_BEG = fetchSearchResult_nxt_BEG(retrieveSearch_nxt_BEG);
            let addResults_nxt_TRANS = fetchSearchResult_nxt_TRANS(retrieveSearch_nxt_TRANS);

            addResults_nxt_BEG = Array.from(
                new Map(
                    addResults_nxt_BEG.map((item) => [JSON.stringify(item), item])
                ).values()
            ); // khi lấy dự liệu ra thường xuyeen bị dup dữ liệu, khs

            for (let i = 0; i < addResults_nxt_BEG.length; i++) {
                let result_BEG = addResults_nxt_BEG[i];
                let hasCorrespondingTranLine = 0;

                if (Number(result_BEG.Begin_Qty) !== 0 ) {
                    let beginQuantity = Number(result_BEG.Begin_Qty);
                    let cuoiKy = 0;

                    for (let m = 0; m < addResults_nxt_TRANS.length; m++) {
                        let result_I_O = addResults_nxt_TRANS[m];

                        if (result_BEG.Location === result_I_O.Location &&
                            result_BEG.Item === result_I_O.Item &&
                            result_BEG.LotNo === result_I_O.LotNo &&
                            result_BEG.Status === result_I_O.Status &&
                            result_BEG.Bin === result_I_O.Bin
                        ) {
                            if (hasCorrespondingTranLine > 0) {
                                beginQuantity = 0;
                                cuoiKy = result_I_O.In_Qty - result_I_O.Out_Qty;
                            } else {
                                sumTonDau += beginQuantity;
                                cuoiKy = Number(beginQuantity) + Number(result_I_O.In_Qty/ result_I_O.convertStockUnit) - Number(result_I_O.Out_Qty/ result_I_O.convertStockUnit);
                            }

                            sumNhap += Number(result_I_O.In_Qty / result_I_O.convertStockUnit);
                            sumXuat += Number(result_I_O.Out_Qty / result_I_O.convertStockUnit);
                            sumCuoiKy += cuoiKy;

                            tableData.push({
                                upccode: result_BEG.UPCCode,
                                bin: result_BEG.Bin,
                                macu: result_BEG.FormerCode,
                                displayname: result_BEG.Displayname,
                                lotno: result_BEG.LotNo,
                                lotnoid: result_BEG.LotNoId,
                                serimau: result_BEG.Serimau,
                                hsd: result_BEG.Hsd,
                                receiptdate: result_BEG.ReceiptDate,
                                coreweigh: result_BEG.CoreWeigh,
                                status: result_BEG.Status,
                                memo: result_BEG.Memo,
                                stockunit: result_BEG.StockUnit,
                                begin_qty: Math.round((beginQuantity || 0) * 1000) / 1000,
                                in_qty: Math.round((Number(result_I_O.In_Qty) || 0) * 1000) / 1000,
                                out_qty: Math.round((Number(result_I_O.Out_Qty) || 0) * 1000) / 1000,
                                end_qty: Math.round((Number(cuoiKy) || 0) * 1000) / 1000,
                                dieuchuyen: result_I_O.DieuChuyen || 0,
                                xuatban: result_I_O.XuatBan || 0,
                                kho: result_I_O.Location,
                                itemid: result_I_O.ItemId
                            });
                            hasCorrespondingTranLine++;
                        }
                    }
                    if (hasCorrespondingTranLine === 0) {
                        tableData.push({
                            upccode: result_BEG.UPCCode,
                            bin: result_BEG.Bin,
                            macu: result_BEG.FormerCode,
                            displayname: result_BEG.Displayname,
                            lotno: result_BEG.LotNo,
                            lotnoid: result_BEG.LotNoId,
                            serimau: result_BEG.Serimau,
                            hsd: result_BEG.Hsd,
                            receiptdate: result_BEG.ReceiptDate,
                            coreweigh: result_BEG.CoreWeigh,
                            status: result_BEG.Status,
                            memo: result_BEG.Memo,
                            stockunit: result_BEG.StockUnit,
                            begin_qty: Math.round((beginQuantity || 0) * 100) / 100,
                            in_qty: 0,
                            out_qty: 0,
                            end_qty: Math.round((Number(beginQuantity) || 0) * 100) / 100,
                            dieuchuyen: Number(result_BEG.DieuChuyen) || 0,
                            xuatban: 0,
                            kho: result_BEG.Location,
                            itemid: result_BEG.ItemId
                        });
                        sumTonDau += beginQuantity;
                        sumCuoiKy += Number(beginQuantity);
                    }
                }
            }

            addResults_nxt_TRANS.forEach((result_I_O) => {
                let tranLineDaLay = 0;
                addResults_nxt_BEG.forEach((result_BEG) => {
                    if (result_BEG.Location === result_I_O.Location &&
                        result_BEG.Item === result_I_O.Item &&
                        result_BEG.LotNo === result_I_O.LotNo &&
                        result_BEG.Status === result_I_O.Status &&
                        result_BEG.Bin === result_I_O.Bin &&
                        (Number(result_BEG.Begin_Qty) > 0 || Number(result_BEG.Begin_Qty) < 0)
                    ) {
                        tranLineDaLay++;
                    }
                });

                if (tranLineDaLay === 0) {
                    tableData.push({
                        upccode: result_I_O.UPCCode,
                        bin: result_I_O.Bin,
                        macu: result_I_O.FormerCode,
                        displayname: result_I_O.Displayname,
                        lotno: result_I_O.LotNo,
                        lotnoid: result_I_O.LotNoId,
                        serimau: result_I_O.Serimau,
                        hsd: result_I_O.Hsd,
                        receiptdate: result_I_O.ReceiptDate,
                        coreweigh: result_I_O.CoreWeigh,
                        status: result_I_O.Status,
                        memo: result_I_O.Memo,
                        stockunit: result_I_O.StockUnit,
                        begin_qty:  0,
                        in_qty: Math.round(Number(result_I_O.In_Qty) * 100) / 100 || 0,
                        out_qty: Math.round(Number(result_I_O.Out_Qty) * 100) / 100 || 0,
                        end_qty: Math.round((Number(result_I_O.In_Qty / result_I_O.convertStockUnit) - Number(result_I_O.Out_Qty / result_I_O.convertStockUnit)) * 100) / 100 || 0,
                        dieuchuyen: result_I_O.DieuChuyen || 0,
                        xuatban: result_I_O.XuatBan || 0,
                        kho: result_I_O.Location,
                        itemid: result_I_O.ItemId
                    });

                    sumNhap += Number(result_I_O.In_Qty/ result_I_O.convertStockUnit);
                    sumXuat += Number(result_I_O.Out_Qty/ result_I_O.convertStockUnit);
                    sumCuoiKy += (Number(result_I_O.In_Qty/ result_I_O.convertStockUnit) - Number(result_I_O.Out_Qty/ result_I_O.convertStockUnit));
                }
            });

            sumTonDau = sumTonDau.toFixed(2);
            sumNhap = sumNhap.toFixed(2);
            sumXuat = sumXuat.toFixed(2);
            sumCuoiKy = sumCuoiKy.toFixed(2);

            return {tableData, sumTonDau, sumNhap, sumXuat, sumCuoiKy};
        }

        const runSearch_nxt_BEG = (searchId, parameters) => {
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

            if (checkNull(parameters.custpage_subsidiary)) {
                f.push(search.createFilter({
                    name: "subsidiary",
                    join: "transaction",
                    operator: 'anyof',
                    values: parameters.custpage_subsidiary
                }));
            }

            if (checkNull(parameters.custpage_location)) {
                f.push(search.createFilter({
                    name: "location",
                    operator: search.Operator.ANYOF,
                    values: parameters.custpage_location.split(',')
                }));
            }

            if (checkNull(parameters.custpage_item)) {
                f.push(search.createFilter({
                    name: "name",
                    join: 'item',
                    operator: search.Operator.CONTAINS,
                    values: parameters.custpage_item
                }));
            }

            if (checkNull(parameters.custpage_lot_no)) {
                f.push(search.createFilter({
                    name: "inventorynumber",
                    join: "inventorynumber",
                    operator: search.Operator.CONTAINS,
                    values: parameters.custpage_lot_no
                }));
            }

            if (checkNull(parameters.custpage_fromdate)) {
                f.push(search.createFilter({
                    name: 'trandate',
                    join: "transaction",
                    operator: search.Operator.BEFORE,
                    values: parameters.custpage_fromdate
                }));
            }

            if (checkNull(parameters.custpage_status)) {
                f.push(search.createFilter({
                    name: 'status',
                    operator: search.Operator.ANYOF,
                    values: parameters.custpage_status.split(',')
                }));
            }

            return searchObj;
        }

        const runSearch_nxt_TRANS = (searchId, parameters) => {
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

            if (checkNull(parameters.custpage_subsidiary)) {
                f.push(search.createFilter({
                    name: "subsidiary",
                    join: "transaction",
                    operator: 'anyof',
                    values: parameters.custpage_subsidiary
                }));
            }

            if (checkNull(parameters.custpage_location)) f.push(search.createFilter({
                name: "location",
                operator: search.Operator.ANYOF,
                values: parameters.custpage_location.split(',')
            }));
            if (checkNull(parameters.custpage_item)){
                f.push(search.createFilter({
                    name: "name",
                    join: 'item',
                    operator: search.Operator.CONTAINS,
                    values: parameters.custpage_item
                }));
            }
            if (checkNull(parameters.custpage_lot_no)) f.push(search.createFilter({
                name: "inventorynumber",
                join: "inventorynumber",
                operator: search.Operator.CONTAINS,
                values: parameters.custpage_lot_no
            }));

            if (checkNull(parameters.custpage_fromdate)) f.push(search.createFilter({
                name: 'trandate',
                join: "transaction",
                operator: search.Operator.WITHIN,
                values: [parameters.custpage_fromdate, parameters.custpage_todate]
            }));

            if (checkNull(parameters.custpage_status)) {
                f.push(search.createFilter({
                    name: 'status',
                    operator: search.Operator.ANYOF,
                    values: parameters.custpage_status.split(',')
                }));
            }

            return searchObj;
        }

        const fetchSearchResult_nxt_BEG = (ss) => {
            let results = [];
            let pagedData = ss.runPaged({pageSize: 800});
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
                    let ds_LotNoId = result.getValue(c[2]);
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

                    results.push({
                        "Location": ds_Location,
                        "Item": ds_Item,
                        "ItemId": ds_Item_Id,
                        "LotNo": ds_LotNo,
                        'LotNoId': ds_LotNoId,
                        "StockUnit": ds_StockUnit,
                        "Begin_Qty": ds_Begin_Qty,
                        "SaleUnit": ds_SaleUnit,
                        "ConvertRate": ds_ConvertRate,
                        "Hsd": ds_Hsd,
                        'convertStockUnit': convertStockUnit,
                        "UPCCode": ds_UPCCode,
                        "Displayname": ds_Displayname,
                        "Serimau": ds_Serimau,
                        "CoreWeigh": ds_CoreWeigh,
                        "ReceiptDate": ds_ReceiptDate,
                        'Status': ds_status,
                        'FormerCode': ds_former_code,
                        'Bin': bin,
                        'Memo': ds_Memo,
                        'DieuChuyen': ds_dieu_chuyen
                    });
                });
            }
            return results;
        }

        const fetchSearchResult_nxt_TRANS = (ss) => {
            let results = [];
            let pagedData = ss.runPaged({pageSize: 600});
            let ds_Location, ds_Item, ds_LotNo, ds_StockUnit, ds_In_Qty, ds_Out_Qty, ds_SaleUnit, ds_ConvertRate,
                ds_Hsd, ds_UPCCode, ds_Displayname, ds_status;
            const sizePage = pagedData.pageRanges.length;
            for (let i = 0; i < sizePage; i++) {
                let currentPage = pagedData.fetch(i);
                let c = pagedData.searchDefinition.columns;
                currentPage.data.forEach(function (result) {
                    ds_Location = result.getText(c[0]);
                    ds_Item = result.getText(c[1]);
                    let ds_Item_Id = result.getValue(c[1]);
                    let ds_LotNoId = result.getValue(c[2]);
                    ds_LotNo = result.getText(c[2]);
                    ds_StockUnit = result.getText(c[3]);
                    ds_In_Qty = result.getValue(c[4]);
                    ds_Out_Qty = result.getValue(c[5]);
                    ds_SaleUnit = result.getText(c[6]);
                    ds_ConvertRate = result.getValue(c[7]);
                    ds_Hsd = result.getValue(c[8]);

                    ds_UPCCode = result.getValue(c[10]);
                    ds_Displayname = result.getValue(c[11]);
                    let ds_memo = result.getValue(c[12]);
                    let convertStockUnit = Number(result.getValue(c[9]));
                    convertStockUnit = convertStockUnit === 0 ? 1 : convertStockUnit;
                    ds_status = result.getText(c[13]);
                    ds_former_code = result.getValue(c[14]);
                    let bin = result.getText(c[15]);
                    ds_Serimau = result.getValue(c[16]);
                    let ds_ngaynhaphang = result.getValue(c[17]);
                    let ds_CoreWeigh = result.getValue(c[18]);
                    let ds_xuat_ban = result.getValue(c[23]);
                    let ds_dieu_chuyen = result.getValue(c[24]);

                    results.push({
                        "Location": ds_Location,
                        "Item": ds_Item,
                        "ItemId": ds_Item_Id,
                        "LotNo": ds_LotNo,
                        'LotNoId': ds_LotNoId,
                        "StockUnit": ds_StockUnit,
                        "In_Qty": ds_In_Qty,
                        "Out_Qty": ds_Out_Qty,
                        "SaleUnit": ds_SaleUnit,
                        "ConvertRate": ds_ConvertRate,
                        "Hsd": ds_Hsd,
                        "UPCCode": ds_UPCCode,
                        "Displayname": ds_Displayname,
                        'convertStockUnit': convertStockUnit,
                        'Status': ds_status,
                        'FormerCode': ds_former_code,
                        'Bin': bin,
                        'Serimau': ds_Serimau,
                        'ReceiptDate': ds_ngaynhaphang,
                        'CoreWeigh': ds_CoreWeigh,
                        'Memo': ds_memo,
                        'DieuChuyen': ds_dieu_chuyen,
                        'XuatBan': ds_xuat_ban
                    });
                });
            }
            return results;
        }

        const checkNull = (value) => value !== null && value !== undefined && value !== "";

        return {
            onRequest: onRequest
        };
    });