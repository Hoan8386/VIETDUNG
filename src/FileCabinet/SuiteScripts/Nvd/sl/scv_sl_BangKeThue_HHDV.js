/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/file', 'N/ui/serverWidget', 'N/search', 'N/render', '../lib/scv_lib_function', 'N/record', '../olib/alasql/alasql.min@1.7.3'], function (file, serverWidget, search, render, lfunc, record, alasql) {
    const FLAG_EXPORT = 'T';
    const VND_ID = '1';
    const TITLE_FORM = 'Bảng kê thuế đầu vào, đầu ra VAT';
    const objSavedSearch = {
        VAT_PURCHASE_FIRST: 'customsearch_scv_vat_purchase_bkhd',
        VAT_PURCHASE_SECOND: 'customsearch_scv_vat_purchase_bkhd_2',
        VAT_SUMMARY_FIRST: 'customsearch_scv_summary_vat_bkhd',
        VAT_SUMMARY_SECOND: 'customsearch_scv_summary_vat_bkhd_2'
    };
    const COL_MUA_VAO = {
        NgayChungTu: 1,
        SoChungTu: 3,
        NoiDung: 4,
        NgayHoaDon: 6,
        SoHoaDon: 7,
        MauSo: 8,
        Seri: 9,
        NguoiBan: 11,
        DiaChi: 12,
        MaSoThue: 13,
        TienHang: 14,
        TienThue: 16,
        ThueSuat: 15,
        ThanhTien: 17,
        TAX_TYPE: 20,
        TIEN_HANG_NT: 21,
        THUE_GTGT_NT: 22,
        THANH_TIEN_NT: 23,
        SO_NHAP_KHO: 26,
    };
    const COL_BAN_RA = {
        MauSo: 9,
        Seri: 10,
        SoHoaDon: 8,
        NgayHoaDon: 7,
        DESCRIPTION: 11,
        NguoiBan: 13,
        DiaChi: 14,
        MaSoThue: 15,
        NoiDung: 5,
        TienHang: 20,
        TienThue: 24,
        ThueSuat: 19,
        ThanhTien: 17,
        SoChungTu: 23,
        DTChuaThue: 28,
        TongThue: 29,
        TongTien: 30,
        NgayChungTu: 1,
        ChungTu: 3
    };
    const COL_MUA_VAO_CT = {
        TRANSACTION_NUMBER: 3,
        MAU_SO: 8,
        SERI: 9,
        SO_HOA_DON: 7,
        NGAY_HOA_DON: 6,
        NGUOI_BAN: 11,
        MST: 13,
        TEN_HH: 14,
        DVT: 15,
        SO_LUONG: 16,
        DON_GIA: 17,
        TIEN_HANG: 18,
        THUE: 19,
        TONG_THUE: 20,
        DON_GIA_NT: 25,
        TIEN_HANG_NT: 26,
        THUE_GTGT_NT: 27,
        THANH_TIEN_NT: 28,
    };
    const COL_BAN_RA_CT = {
        TRANSACTION_NUMBER: 3,
        MAU_SO: 9,
        SERI: 10,
        SO_HOA_DON: 8,
        NGAY_HOA_DON: 7,
        NGUOI_BAN: 13,
        MST: 15,
        TEN_HH: 16,
        DVT: 17,
        SO_LUONG: 18,
        DON_GIA: 19,
        TIEN_HANG: 20,
        THUE: 26,
        TONG_THUE: 21,
        DON_GIA_NT: 33,
        TIEN_HANG_NT: 34,
        THUE_GTGT_NT: 35,
        THANH_TIEN_NT: 36,
    };
    const TEAMPLATE_ID = {
        BKHD_MUA_VAO: "CUSTTMPL_SCV_BKHD_MUAVAO",
        BKHD_MUA_VAO_NGOAI_TE: "CUSTTMPL_SCV_BKHD_MUAVAO_NGOAI_TE",
        BKHD_BAN_RA: "CUSTTMPL_SCV_BKHD_BANRA",
        BKHD_BAN_RA_NGOAI_TE: "CUSTTMPL_SCV_BKHD_BANRA_NGOAI_TE",
        BKHD_CHITIET_MUA_VAO: "CUSTTMPL_SCV_BKHD_MUAVAO_CT",
        BKHD_CHITIET_BAN_RA: "CUSTTMPL_SCV_BKHD_BANRA_CT"
    };
    const TAX_TYPE = ["1. Hàng hóa, dịch vụ dùng riêng cho SXKD chịu thuế GTGT và sử dụng cho các hoạt động cung cấp hàng hóa, dịch vụ không kê khai, nộp thuế GTGT đủ điều kiện khấu trừ thuế", "2. Hàng hóa, dịch vụ dùng chung cho SXKD chịu thuế và không chịu thuế đủ điều kiện khấu trừ thuế", "3. Hàng hóa, dịch vụ dùng cho dự án đầu tư đủ điều kiện được khấu trừ thuế"];

    function onRequest(context) {
        let request = context.request;
        if (request.method === 'GET') {
            let parameters = request.parameters;
            if (parameters.isexport === FLAG_EXPORT) {
                onExportExcelBKHD(context);
                return;
            }
            if (parameters.ispdf === FLAG_EXPORT) {
                onExportPDF(context);
                return;
            }
            fnBuildForm(context);
        }
    }

    function fnBuildForm(context) {
        let parameters = context.request.parameters;
        let subsidiary_param = parameters.custpage_subsidiary;
        let loaibangke_param = parameters.custpage_loaibangke;
        let from_Date_param = parameters.custpage_fromdate;
        let to_Date_param = parameters.custpage_todate;
        let from_date_nhd = parameters.custpage_fromdate_nhd;
        let to_date_nhd = parameters.custpage_todate_nhd;
        let currency = parameters.custpage_currency;
        let chief_accountant = parameters.custpage_chief_accountant;
        /**/
        let form = serverWidget.createForm({title: TITLE_FORM, hideNavBar: false});
        lfunc.addSavedSearchToForm(form, Object.values(objSavedSearch).map(o => ({id: o, title: o})));
        let sublist = createGUI(form, subsidiary_param, from_Date_param, loaibangke_param, to_Date_param, from_date_nhd, to_date_nhd, currency, chief_accountant);
        if (lfunc.isContainValue(parameters.isRun)) {
            let Results = getValueSS(runSS(loaibangke_param, subsidiary_param, from_Date_param, to_Date_param, from_date_nhd, to_date_nhd, currency, chief_accountant), loaibangke_param);
            const lcDT = Results.length;
            for (let line = 0; line < lcDT; line++) insertLineSublist(sublist, line, Results[line], currency, loaibangke_param);
        }
        context.response.writePage(form);
    }

    function insertLineSublist(sublist, line, objLine, currency, loaiBangKe) {
        let arrDataLine = [];
        switch (loaiBangKe) {
            case objSavedSearch.VAT_PURCHASE_FIRST:
                arrDataLine = arrDataLine.concat([['col0', line + 1], ['col1', objLine.MauSo], ['col2', objLine.Seri], ['col3', objLine.SoHoaDon], ['col4', objLine.NgayHoaDon], ['col5', objLine.NguoiBan], ['col6', objLine.DiaChi], ['col7', objLine.MaSoThue], ['col8', objLine.NoiDung], ['col9', onRenderNumber(objLine.TienHang)], ['col10', onRenderNumber(objLine.TienThue)], ['col11', objLine.ThueSuat], ['col12', onRenderNumber(objLine.ThanhTien)], ['col13', objLine.SoChungTu], ['col14', objLine.SoNhapKho], ['col15', objLine.NgayChungTu], ['col16', onRenderNumber(objLine.TienHangNT, currency)], ['col17', onRenderNumber(objLine.ThueGtgtNT, currency)], ['col18', onRenderNumber(objLine.ThanhTienNT, currency)], ['col_level', objLine.Level]]);
                break;
            case objSavedSearch.VAT_SUMMARY_FIRST:
                arrDataLine = arrDataLine.concat([['col0', line + 1], ['col1', objLine.MauSo], ['col2', objLine.Seri], ['col3', objLine.SoHoaDon], ['col4', objLine.NgayHoaDon], ['col5', objLine.NguoiBan], ['col6', objLine.DiaChi], ['col7', objLine.MaSoThue], ['col8', objLine.NoiDung], ['col9', onRenderNumber(objLine.TienHang)], ['col10', onRenderNumber(objLine.TienThue)], ['col11', objLine.ThueSuat], ['col12', onRenderNumber(objLine.ThanhTien)], ['col13', objLine.SoChungTu], ['col14', objLine.NgayChungTu], ['col15', onRenderNumber(objLine.DTChuaThueNT, currency)], ['col16', onRenderNumber(objLine.TongThueNT, currency)], ['col17', onRenderNumber(objLine.TongTienNT, currency)], ['col_level', objLine.Level]]);
                break;
            default:
                arrDataLine = arrDataLine.concat([['col0', line + 1], ['col1', objLine.SoChungTu], ['col2', objLine.MauSo], ['col3', objLine.Seri], ['col4', objLine.SoHoaDon], ['col5', objLine.NgayHoaDon], ['col6', objLine.NguoiBan], ['col7', objLine.MaSoThue], ['col8', objLine.TenHangHoa], ['col9', objLine.Dvt], ['col10', changeCurrency(objLine.SoLuong)], ['col11', changeCurrency(objLine.DonGia)], ['col12', changeCurrency(objLine.TienHang)], ['col13', objLine.Thue_NM], ['col14', changeCurrency(objLine.TongThue)], ['col15', onRenderNumber(objLine.DonGiaNT, currency)], ['col16', onRenderNumber(objLine.TienHangNT, currency)], ['col17', onRenderNumber(objLine.ThueGtgtNT, currency)], ['col18', onRenderNumber(objLine.ThanhTienNT, currency)], ['col_level', objLine.Level]]);
                break;
        }
        arrDataLine.forEach(([colId, val], _) => addField(sublist, colId, line, val));
    }

    function onRenderNumber(number, currency) {
        let res = number;
        if (!!res) {
            if (currency === '1' || !currency) {
                res = changeCurrency(res.toFixed(0));
            } else {
                res = changeCurrency(res.toFixed(2));
            }
        }
        return res;
    }

    return {
        onRequest: onRequest
    };

    function onExportPDF(context) {
        let params = context.request.parameters;
        let printRender = render.create();
        let subsidiary_param = params.custpage_subsidiary;
        let fromdate = params.custpage_fromdate;
        let todate = params.custpage_todate;
        let objData;
        switch (params.custpage_loaibangke) {
            case objSavedSearch.VAT_PURCHASE_FIRST:
                objData = printBangkeHoaDonMuaVao(printRender, params, context);
                break;
            case objSavedSearch.VAT_SUMMARY_FIRST:
                objData = printBangkeHoaDonBanRa(printRender, params, context);
                break;
            case objSavedSearch.VAT_PURCHASE_SECOND:
            case objSavedSearch.VAT_SUMMARY_SECOND:
                objData = printBangkeHoaDonChiTiet(printRender, params, context);
                break;
        }
        ;
        const objDataPrint = fnGetDataPrintPdf(subsidiary_param, fromdate, todate);
        printRender.setTemplateByScriptId(objData.template);
        printRender.addRecord('subsidiary', objDataPrint.subRec);
        printRender.addCustomDataSource({
            format: render.DataSource.OBJECT, alias: "jsonData", data: {
                kyDeNghi: objDataPrint.kyDeNghi,
                tongTienHang: objData.total.tongTienHang,
                tongThue: objData.total.tongThue,
                bodyData: objData.data
            }
        });
        let printFile = printRender.renderAsPdf();
        context.response.writeFile(printFile, true);

    }

    function printBangkeHoaDonMuaVao(printRender, params, context) {
        let subsidiary_param = params.custpage_subsidiary;
        let loaibangke_param = params.custpage_loaibangke;
        let from_Date_param = params.custpage_fromdate;
        let to_Date_param = params.custpage_todate;
        let from_date_nhd = params.custpage_fromdate_nhd;
        let to_date_nhd = params.custpage_todate_nhd;
        let currency = params.custpage_currency;
        let chief_accountant = params.custpage_chief_accountant;
        let template = foreignCurrency(currency) ? TEAMPLATE_ID.BKHD_MUA_VAO_NGOAI_TE : TEAMPLATE_ID.BKHD_MUA_VAO;
        let arrResult = [];
        let searchResult = getValueSS(runSS(loaibangke_param, subsidiary_param, from_Date_param, to_Date_param, from_date_nhd, to_date_nhd, currency, chief_accountant), loaibangke_param);
        const objTotal = fnGetTotalAmountPrintPdf(searchResult);
        const lcDT = searchResult.length;
        for (let i = 0; i < lcDT; i++) {
            arrResult.push({
                MauSo: searchResult[i].MauSo,
                Seri: searchResult[i].Seri,
                SoHoaDon: searchResult[i].SoHoaDon,
                NgayHoaDon: searchResult[i].NgayHoaDon,
                NguoiBan: searchResult[i].NguoiBan,
                MaSoThue: searchResult[i].MaSoThue,
                NoiDung: searchResult[i].NoiDung,
                TienHang: changeCurrency(searchResult[i].TienHang),
                TienThue: changeCurrency(searchResult[i].TienThue),
                ThueSuat: searchResult[i].ThueSuat,
                SoNhapKho: searchResult[i].SoNhapKho,
                ThanhTien: changeCurrency(searchResult[i].ThanhTien),
                TienHangNT: changeCurrency(Math.round(searchResult[i].TienHangNT * 100) / 100),
                ThueGtgtNT: changeCurrency(Math.round(searchResult[i].ThueGtgtNT * 100) / 100),
                ThanhTienNT: changeCurrency(Math.round(searchResult[i].ThanhTienNT * 100) / 100),
            });
        }
        return {
            template,
            total: objTotal,
            data: arrResult
        };
    }

    function printBangkeHoaDonBanRa(printRender, params, context) {
        let subsidiary_param = params.custpage_subsidiary;
        let loaibangke_param = params.custpage_loaibangke;
        let from_Date_param = params.custpage_fromdate;
        let to_Date_param = params.custpage_todate;
        let from_date_nhd = params.custpage_fromdate_nhd;
        let to_date_nhd = params.custpage_todate_nhd;
        let currency = params.custpage_currency;
        let chief_accountant = params.custpage_chief_accountant;
        let template = foreignCurrency(currency) ? TEAMPLATE_ID.BKHD_BAN_RA_NGOAI_TE : TEAMPLATE_ID.BKHD_BAN_RA;
        let arrResult = [];
        let searchResult = getValueSS(runSS(loaibangke_param, subsidiary_param, from_Date_param, to_Date_param, from_date_nhd, to_date_nhd, currency, chief_accountant), loaibangke_param);
        const objTotal = fnGetTotalAmountPrintPdf(searchResult);
        const lc = searchResult.length;
        for (let i = 0; i < lc; i++) {
            arrResult.push({
                MauSo: searchResult[i].MauSo,
                Seri: searchResult[i].Seri,
                SoHoaDon: searchResult[i].SoHoaDon,
                NgayHoaDon: searchResult[i].NgayHoaDon,
                NguoiBan: searchResult[i].NguoiBan,
                MaSoThue: searchResult[i].MaSoThue,
                NoiDung: searchResult[i].NoiDung,
                TienHang: changeCurrency(searchResult[i].TienHang),
                TienThue: changeCurrency(searchResult[i].TienThue),
                ThueSuat: searchResult[i].ThueSuat,
                ThanhTien: changeCurrency(searchResult[i].ThanhTien),
                DTChuaThueNT: changeCurrency(Math.round(searchResult[i].DTChuaThueNT * 100) / 100),
                TongThueNT: changeCurrency(Math.round(searchResult[i].TongThueNT * 100) / 100),
                TongTienNT: changeCurrency(Math.round(searchResult[i].TongTienNT * 100) / 100),
            });
        }
        return {
            template: template,
            total: objTotal,
            data: arrResult
        }
    }

    function fnGetTotalAmountPrintPdf(searchResult) {
        let objTotal = searchResult.length ? alasql('select SUM(TienHang*1) AS TienHang, SUM(TongThue*1) AS TongThue from ?', [searchResult]) : []
        let tongTienHang = objTotal?.[0]?.TienHang || 0;
        let tongThue = objTotal?.[0]?.TongThue || 0;
        return {
            tongTienHang,
            tongThue
        };
    }

    function fnGetDataPrintPdf(subsidiaryId, fromdate, todate) {
        const subId = subsidiaryId?.split(",")?.[0] || '1';
        let subRec = record.load({type: record.Type.SUBSIDIARY, id: subId});
        let kyDeNghi = "";
        if (!!fromdate && !!todate) {
            const objFD = convertDateToObject(fromdate);
            const objTD = convertDateToObject(todate);
            kyDeNghi += "Từ kỳ tháng " + objFD.mm + " năm " + objFD.yyyy;
            kyDeNghi += " đến kỳ tháng " + objTD.mm + " năm " + objTD.yyyy;
        }
        return {
            subRec,
            kyDeNghi
        };
    }

    function printBangkeHoaDonChiTiet(printRender, params, context) {
        let subsidiary_param = params.custpage_subsidiary;
        let loaibangke_param = params.custpage_loaibangke;
        let from_Date_param = params.custpage_fromdate;
        let to_Date_param = params.custpage_todate;
        let from_date_nhd = params.custpage_fromdate_nhd;
        let to_date_nhd = params.custpage_todate_nhd;
        let currency = params.custpage_currency;
        let chief_accountant = params.custpage_chief_accountant;
        const template =
            params.custpage_loaibangke === objSavedSearch.VAT_PURCHASE_FIRST
                ? TEAMPLATE_ID.BKHD_CHITIET_MUA_VAO : TEAMPLATE_ID.BKHD_CHITIET_BAN_RA;
        let searchResult = getValueSS(runSS(loaibangke_param, subsidiary_param, from_Date_param, to_Date_param, from_date_nhd, to_date_nhd, currency, chief_accountant), loaibangke_param);
        const objTotal = fnGetTotalAmountPrintPdf(searchResult);
        return {
            template: template,
            total: objTotal,
            data: searchResult
        }
    }

    function onExportExcelBKHD(context) {
        let request = context.request;
        let response = context.response;
        let params = request.parameters;
        let subsidiary_param = params.custpage_subsidiary;
        let loaibangke_param = params.custpage_loaibangke;
        let from_Date_param = params.custpage_fromdate;
        let to_Date_param = params.custpage_todate;
        let from_date_nhd = params.custpage_fromdate_nhd;
        let to_date_nhd = params.custpage_todate_nhd;
        let currency = params.custpage_currency;
        let chief_accountant = params.custpage_chief_accountant;
        let pLegalname = "", pMainAddress = "", pContent = "", pExpandedRowCount = 20;
        if (!!subsidiary_param) {
            let subRec = record.load({type: record.Type.SUBSIDIARY, id: (subsidiary_param.split(",") || "1")});
            pLegalname = subRec.getValue("legalname");
            pMainAddress = subRec.getValue("mainaddress_text");
        }
        let searchResult = getValueSS(runSS(loaibangke_param, subsidiary_param, from_Date_param, to_Date_param, from_date_nhd, to_date_nhd, currency, chief_accountant), loaibangke_param);
        searchResult = searchResult.slice(0, searchResult.length - 1);
        let templatePath, namefile;
        if (loaibangke_param === objSavedSearch.VAT_PURCHASE_FIRST) {
            let mergeAcross = foreignCurrency(currency) ? 12 : 10;
            let arrTaxType = ["1", "2", "3"];
            let arrGrTaxType = lfunc.onGroupByArray(searchResult, ["TaxType"]);
            const lcTaxType = arrTaxType.length;
            for (let i = 0; i < lcTaxType; i++) {
                pExpandedRowCount++;
                let objFindTaxType = arrGrTaxType.find(e => e.TaxType.substring(0, 1) === arrTaxType[i]);
                if (!!objFindTaxType) {
                    pContent += '<Row ss:AutoFitHeight="0" ss:Height="39.75">\n' + '    <Cell ss:MergeAcross="' + mergeAcross + '" ss:StyleID="m413757452"><Data ss:Type="String">' + objFindTaxType.TaxType + '</Data></Cell>\n' + '   </Row>\n';
                    const arrTaxTypeFilter = searchResult.filter(function (e) {
                        return e.TaxType === objFindTaxType.TaxType;
                    });
                    let total_tien_hang = 0, total_tien_thue = 0, total_tien_hang_nt = 0, total_thue_gtgt_nt = 0;
                    const lcTaxTypeFilter = arrTaxTypeFilter.length;
                    for (let j = 0; j < lcTaxTypeFilter; j++) {
                        pExpandedRowCount++;
                        total_tien_hang += arrTaxTypeFilter[j].TienHang * 1;
                        total_tien_thue += arrTaxTypeFilter[j].TienThue * 1;
                        total_tien_hang_nt += arrTaxTypeFilter[j].TienHangNT * 1;
                        total_thue_gtgt_nt += arrTaxTypeFilter[j].ThueGtgtNT * 1;
                        pContent += '   <Row ss:Height="45">\n' + '    <Cell ss:StyleID="s29"><Data ss:Type="Number">' + (j + 1) + '</Data></Cell>\n' + '    <Cell ss:StyleID="s30"><Data ss:Type="String">' + arrTaxTypeFilter[j].MauSo + '</Data></Cell>\n' + '    <Cell ss:StyleID="s30"><Data ss:Type="String">' + arrTaxTypeFilter[j].Seri + '</Data></Cell>\n' + '    <Cell ss:StyleID="s30"><Data ss:Type="String">' + arrTaxTypeFilter[j].SoHoaDon + '</Data></Cell>\n' + '    <Cell ss:StyleID="s31"><Data ss:Type="String">' + arrTaxTypeFilter[j].NgayHoaDon + '</Data></Cell>\n' + '    <Cell ss:StyleID="s32"><Data ss:Type="String">' + arrTaxTypeFilter[j].NguoiBan + '</Data></Cell>\n' + '    <Cell ss:StyleID="s33"><Data ss:Type="String">' + arrTaxTypeFilter[j].MaSoThue + '</Data></Cell>\n' + '    <Cell ss:StyleID="s34"><Data ss:Type="Number">' + arrTaxTypeFilter[j].TienHang + '</Data></Cell>\n' + '    <Cell ss:StyleID="s34"><Data ss:Type="Number">' + arrTaxTypeFilter[j].TienThue + '</Data></Cell>\n' + '    <Cell ss:StyleID="s30"><Data ss:Type="String">' + arrTaxTypeFilter[j].SoNhapKho + '</Data></Cell>\n' + '    <Cell ss:StyleID="s33"/>\n';
                        if (foreignCurrency(currency)) {
                            pContent += '    <Cell ss:StyleID="s51"><Data ss:Type="Number">' + arrTaxTypeFilter[j].TienHangNT + '</Data></Cell>\n' + '    <Cell ss:StyleID="s51"><Data ss:Type="Number">' + arrTaxTypeFilter[j].ThueGtgtNT + '</Data></Cell>\n';
                        }
                        pContent += '   </Row>\n';
                    }
                    pExpandedRowCount++;
                    pContent += '   <Row ss:Height="15.75">\n' + '    <Cell ss:MergeAcross="6" ss:StyleID="s43"><Data ss:Type="String">Tổng cộng</Data></Cell>\n' + '    <Cell ss:StyleID="s37"><Data ss:Type="Number">' + total_tien_hang + '</Data></Cell>\n' + '    <Cell ss:StyleID="s37"><Data ss:Type="Number">' + total_tien_thue + '</Data></Cell>\n' + '    <Cell ss:StyleID="s38"/>\n' + '    <Cell ss:StyleID="s38"/>\n';
                    if (foreignCurrency(currency)) {
                        pContent += '    <Cell ss:StyleID="s52"><Data ss:Type="Number">' + total_tien_hang_nt + '</Data></Cell>\n' + '    <Cell ss:StyleID="s52"><Data ss:Type="Number">' + total_thue_gtgt_nt + '</Data></Cell>\n';
                    }
                    pContent += '   </Row>\n';
                } else {
                    pExpandedRowCount += 3;
                    pContent += '<Row ss:AutoFitHeight="0" ss:Height="39.75">\n' + '    <Cell ss:MergeAcross="' + mergeAcross + '" ss:StyleID="m413757452"><Data ss:Type="String">' + TAX_TYPE[i] + '</Data></Cell>\n' + '   </Row>\n' + '   <Row ss:Height="15.75">\n' + '    <Cell ss:StyleID="s29"><Data ss:Type="Number">1</Data></Cell>\n' + '    <Cell ss:StyleID="s30"><Data ss:Type="String"></Data></Cell>\n' + '    <Cell ss:StyleID="s30"><Data ss:Type="String"></Data></Cell>\n' + '    <Cell ss:StyleID="s30"><Data ss:Type="String"></Data></Cell>\n' + '    <Cell ss:StyleID="s31"><Data ss:Type="String"></Data></Cell>\n' + '    <Cell ss:StyleID="s32"><Data ss:Type="String"></Data></Cell>\n' + '    <Cell ss:StyleID="s33"><Data ss:Type="String"></Data></Cell>\n' + '    <Cell ss:StyleID="s34"><Data ss:Type="Number">0</Data></Cell>\n' + '    <Cell ss:StyleID="s34"><Data ss:Type="Number">0</Data></Cell>\n' + '    <Cell ss:StyleID="s30"><Data ss:Type="String"></Data></Cell>\n' + '    <Cell ss:StyleID="s33"/>\n';
                    if (foreignCurrency(currency)) {
                        pContent += '    <Cell ss:StyleID="s51"><Data ss:Type="Number">0</Data></Cell>\n' + '    <Cell ss:StyleID="s51"><Data ss:Type="Number">0</Data></Cell>\n';
                    }
                    pContent += '   </Row>\n' + '   <Row ss:Height="15.75">\n' + '    <Cell ss:MergeAcross="6" ss:StyleID="s43"><Data ss:Type="String">Tổng cộng</Data></Cell>\n' + '    <Cell ss:StyleID="s37"><Data ss:Type="Number">0</Data></Cell>\n' + '    <Cell ss:StyleID="s37"><Data ss:Type="Number">0</Data></Cell>\n' + '    <Cell ss:StyleID="s38"/>\n' + '    <Cell ss:StyleID="s38"/>\n';
                    if (foreignCurrency(currency)) {
                        pContent += '    <Cell ss:StyleID="s52"><Data ss:Type="Number">0</Data></Cell>\n' + '    <Cell ss:StyleID="s52"><Data ss:Type="Number">0</Data></Cell>\n';
                    }
                    pContent += '   </Row>\n';
                }
            }
            templatePath = '../xml/bangke/scv_bkhd_mua_vao.xml';
            namefile = 'Bảng kê hóa đơn mua vào.xls';
            if (foreignCurrency(currency)) {
                templatePath = '../xml/bangke/scv_bkhd_mua_vao_ngoai_te.xml';
                namefile = 'Bảng kê hóa đơn mua vào (Ngoại tệ).xls';
            }
        } else if (loaibangke_param === objSavedSearch.VAT_SUMMARY_FIRST) {
            let arr_grp_des = lfunc.onGroupByArray(searchResult, ["Description"]);
            let mergeAcross = foreignCurrency(currency) ? 11 : 9;
            for (let i = 0; i < arr_grp_des.length; i++) {
                pExpandedRowCount += 2;
                pContent += '<Row ss:AutoFitHeight="0" ss:Height="21.375">\n' + '    <Cell ss:MergeAcross="' + mergeAcross + '" ss:StyleID="m321658644"><Data ss:Type="String">' + arr_grp_des[i].Description + '</Data></Cell>\n' + '   </Row>\n';
                let arr_filter_des = searchResult.filter(function (e) {
                    return e.Description === arr_grp_des[i].Description;
                });
                let total_tien_hang = 0, total_tien_thue = 0;
                let total_dt_nt = 0, total_tien_thue_nt = 0;
                const lcDes = arr_filter_des.length;
                for (let j = 0; j < lcDes; j++) {
                    total_tien_hang += arr_filter_des[j].TienHang * 1;
                    total_tien_thue += arr_filter_des[j].TienThue * 1;
                    total_dt_nt += arr_filter_des[j].DTChuaThueNT * 1;
                    total_tien_thue_nt += arr_filter_des[j].TienThue * 1;
                    pExpandedRowCount++;
                    pContent += '   <Row ss:Height="45">\n' + '    <Cell ss:StyleID="s68"><Data ss:Type="String">' + (j + 1) + '</Data></Cell>\n' + '    <Cell ss:StyleID="s68"><Data ss:Type="String">' + arr_filter_des[j].MauSo + '</Data></Cell>\n' + '    <Cell ss:StyleID="s68"><Data ss:Type="String">' + arr_filter_des[j].Seri + '</Data></Cell>\n' + '    <Cell ss:StyleID="s68"><Data ss:Type="String">' + arr_filter_des[j].SoHoaDon + '</Data></Cell>\n' + '    <Cell ss:StyleID="s67"><Data ss:Type="String">' + arr_filter_des[j].NgayHoaDon + '</Data></Cell>\n' + '    <Cell ss:StyleID="s61"><Data ss:Type="String">' + arr_filter_des[j].NguoiBan + '</Data></Cell>\n' + '    <Cell ss:StyleID="s61"><Data ss:Type="String">' + arr_filter_des[j].MaSoThue + '</Data></Cell>\n' + '    <Cell ss:StyleID="s61"><Data ss:Type="String">' +  lfunc.reText(arr_filter_des[j].NoiDung) + '</Data></Cell>\n' + '    <Cell ss:StyleID="s62"><Data ss:Type="Number">' + arr_filter_des[j].TienHang + '</Data></Cell>\n' + '    <Cell ss:StyleID="s63"><Data ss:Type="Number">' + arr_filter_des[j].TienThue + '</Data></Cell>\n';
                    if (foreignCurrency(currency)) {
                        pContent += '    <Cell ss:StyleID="s79"><Data ss:Type="Number">' + arr_filter_des[j].DTChuaThueNT + '</Data></Cell>\n' + '    <Cell ss:StyleID="s79"><Data ss:Type="Number">' + arr_filter_des[j].TongThueNT + '</Data></Cell>\n';
                    }
                    pContent += '   </Row>\n';
                }
                pContent += '   <Row ss:AutoFitHeight="0" ss:Height="21.375">\n' + '    <Cell ss:MergeAcross="7" ss:StyleID="m321658584"><Data ss:Type="String">Tổng cộng</Data></Cell>\n' + '    <Cell ss:StyleID="s69"><Data ss:Type="Number">' + total_tien_hang + '</Data></Cell>\n' + '    <Cell ss:StyleID="s69"><Data ss:Type="Number">' + total_tien_thue + '</Data></Cell>\n';
                if (foreignCurrency(currency)) {
                    pContent += '    <Cell ss:StyleID="s80"><Data ss:Type="Number">' + total_dt_nt + '</Data></Cell>\n' + '    <Cell ss:StyleID="s80"><Data ss:Type="Number">' + total_tien_thue_nt + '</Data></Cell>\n';
                }
                pContent += '   </Row>\n';
            }

            if (foreignCurrency(currency)) {
                templatePath = '../xml/bangke/scv_bkhd_ban_ra_ngoai_te.xml';
                namefile = 'Bảng kê hóa đơn bán ra (Ngoại tệ).xls';
            } else {
                templatePath = '../xml/bangke/scv_bkhd_ban_ra.xml';
                namefile = 'Bảng kê hóa đơn bán ra.xls';
            }
        }
        let fileObject = file.load({id: templatePath});
        let content = fileObject.getContents();
        content = content.replace(/{pExpandedRowCount}/gi, pExpandedRowCount);
        content = content.replace(/{pContent}/gi, pContent);
        content = content.replace(/{pLegalname}/gi, pLegalname);
        content = content.replace(/{pMainAddress}/gi, pMainAddress);
        content = content.replace(/{pFromdt}/gi, from_Date_param);
        content = content.replace(/{pTodt}/gi, to_Date_param);
        let f = file.create({
            name: namefile, fileType: file.Type.XMLDOC, contents: content, encoding: file.Encoding.UTF8,
        });

        response.writeFile(f, false);
    }

    function addSelectionReportType(objFld) {
        [
            [objSavedSearch.VAT_PURCHASE_FIRST, 'Bảng kê hóa đơn mua vào'],
            [objSavedSearch.VAT_SUMMARY_FIRST, 'Bảng kê hóa đơn bán ra'],
            [objSavedSearch.VAT_PURCHASE_SECOND, 'Bảng kê hóa đơn mua vào chi tiết'],
            [objSavedSearch.VAT_SUMMARY_SECOND, 'Bảng kê hóa đơn mua vào chi tiết'],
        ].forEach(([value, text]) => objFld.addSelectOption({value: value, text: text}));

    }

    function createGUI(form, subsidiary_param, from_Date_param, loaibangke_param, to_Date_param, from_date_nhd, to_date_nhd, currency, chief_accountant) {
        lfunc.pinHeaderSublist(form);
        form.clientScriptModulePath = '../cs/scv_cs_sl_BangKeThue_HHDV_MuaVao.js';
        addButton(form, 'custpage_bt_search', 'Search', 'onSearch()');
        addButton(form, 'custpage_bt_export', 'Export', 'onExport()');
        if (!loaibangke_param || loaibangke_param === objSavedSearch.VAT_PURCHASE_FIRST || loaibangke_param === objSavedSearch.VAT_SUMMARY_FIRST) {
            addButton(form, 'custpage_bt_bkhd', 'BKHĐ', 'onBKHD()');
        }
        addButton(form, 'custpage_bt_export_pdf', 'Print Pdf', 'onExportPdf()');
        form.addFieldGroup({id: 'main_group', label: 'Main'});
        addGroupField(form, 'main_group', 'custpage_subsidiary', serverWidget.FieldType.MULTISELECT, 'Subsidiary', 'subsidiary').defaultValue = subsidiary_param ? subsidiary_param.split(",") : "";
        let objFldReportType = addGroupField(form, 'main_group', 'custpage_loaibangke', serverWidget.FieldType.SELECT, 'Loại bảng kê', null);
        addSelectionReportType(objFldReportType);
        objFldReportType.defaultValue = loaibangke_param;
        let label = '<b>' + '?' + '</b>';
        if (lfunc.isContainValue(loaibangke_param)) label = (loaibangke_param === objSavedSearch.VAT_PURCHASE_FIRST) ? 'NCC' : 'Khách hàng';
        let custpage_fromdate = addGroupField(form, 'main_group', 'custpage_fromdate', serverWidget.FieldType.DATE, 'From Period', null);
        let custpage_todate = addGroupField(form, 'main_group', 'custpage_todate', serverWidget.FieldType.DATE, 'To Period', null);
        let custpage_fromdate_nhd = addGroupField(form, 'main_group', 'custpage_fromdate_nhd', serverWidget.FieldType.DATE, 'Từ ngày HĐ', null);
        let custpage_todate_nhd = addGroupField(form, 'main_group', 'custpage_todate_nhd', serverWidget.FieldType.DATE, 'Đến ngày HĐ', null);
        custpage_fromdate.defaultValue = from_Date_param;
        custpage_fromdate.updateLayoutType({layoutType: 'startrow'});
        custpage_todate.defaultValue = to_Date_param;
        custpage_todate.updateLayoutType({layoutType: 'endrow'});
        custpage_fromdate_nhd.defaultValue = from_date_nhd;
        custpage_fromdate_nhd.updateLayoutType({layoutType: 'startrow'});
        custpage_todate_nhd.defaultValue = to_date_nhd;
        custpage_todate_nhd.updateLayoutType({layoutType: 'endrow'});
        let custpage_currency = addGroupField(form, 'main_group', 'custpage_currency', serverWidget.FieldType.SELECT, 'Currency', 'currency');
        custpage_currency.defaultValue = currency;
        addGroupField(form, 'main_group', 'custpage_chief_accountant', serverWidget.FieldType.SELECT, 'Kế toán KT', 'employee').defaultValue = chief_accountant;
        let sublist = addSublist(form, 'custpage_table', serverWidget.SublistType.LIST, 'Kết Quả');
        let arrLabel = getListArrColumn(loaibangke_param, label, custpage_currency.defaultValue);
        const lcL = arrLabel.length;
        for (let i = 0; i < lcL; i++) {
            let obj = {};
            switch (arrLabel[i]) {
                case 'level' :
                    Object.assign(obj, {id: 'col_level', type: 'text', display: 'hidden'});
                    break;
                case 'Nội dung' :
                    Object.assign(obj, {id: 'col'.concat(i.toString()), type: 'textarea'});
                    break;
                default:
                    Object.assign(obj, {id: 'col'.concat(i.toString()), type: 'text'});
                    break;
            }
            addSublistField(sublist, obj.id, arrLabel[i], obj.type, obj.display || 'inline');
        }
        return sublist;
    }

    function runSS(loaiBangKe, p_subsidiary, from_Date, to_Date, from_date_nhd, to_date_nhd, currency, chief_accountant) {
        let searchObj = search.load({id: loaiBangKe});
        let f = searchObj.filters;
        if (lfunc.isContainValue(p_subsidiary)) f.push(search.createFilter({                name: "subsidiary", operator: search.Operator.ANYOF, values: p_subsidiary.split(",")            }));
        if (lfunc.isContainValue(currency)) f.push(search.createFilter({name: "currency", operator: search.Operator.ANYOF, values: currency}));
        if (lfunc.isContainValue(chief_accountant)) f.push(search.createFilter({                name: "custbody_scv_ktvkt", operator: search.Operator.ANYOF, values: chief_accountant            }));
        if (lfunc.isContainValue(from_Date)) f.push(search.createFilter({name: 'trandate', operator: search.Operator.ONORAFTER, values: from_Date}));
        if (lfunc.isContainValue(to_Date)) f.push(search.createFilter({name: 'trandate', operator: search.Operator.ONORBEFORE, values: to_Date}));
        if (!!from_date_nhd && !!to_date_nhd) f.push(search.createFilter({                name: 'formuladate',                formula: 'NVL({custcol_scv_invoice_date},{custbody_scv_invoice_date})',                operator: search.Operator.WITHIN,                values: [from_date_nhd, to_date_nhd]            }));
        return searchObj;
    }


    function getTotalDataSS(loaiBangKe, data) {
        const arrCols = ({
            [objSavedSearch.VAT_PURCHASE_FIRST] : () => (['TienHang', 'TienThue', 'ThanhTien', 'TienHangNT', 'ThueGtgtNT', 'ThanhTienNT']),
            [objSavedSearch.VAT_PURCHASE_SECOND] : () => (['TienHang', 'TongThue', 'TienHangNT', 'ThueGtgtNT', 'ThanhTienNT']),
            [objSavedSearch.VAT_SUMMARY_FIRST] : () => (['TienHang', 'TienThue', 'ThanhTien', 'DTChuaThueNT', 'TongThueNT', 'TongTienNT']),
            [objSavedSearch.VAT_SUMMARY_SECOND] : () => (['TienHang', 'TongThue', 'TienHangNT', 'ThueGtgtNT', 'ThanhTienNT']),
        })[loaiBangKe];

        let sqlQuery = 'SELECT '.concat(arrCols().map(o => `SUM(${o}) AS ${o}`).join(', ').concat(' FROM ?'));
        let objInit = getObjTotal(loaiBangKe);
        let objTotal = alasql(sqlQuery, [data])?.[0] || objInit;
        objTotal = Object.assign(objInit, objTotal);
        return objTotal;
    }

    /**
     * @param loaiBangKe
     * @param c
     * @returns {function}
     */
    function fnGetDataLineSavedSearch(loaiBangKe, c) {
        return ({
            [objSavedSearch.VAT_PURCHASE_FIRST] : (curLine) => ({
                MauSo :  curLine.getValue(c[COL_MUA_VAO.MauSo]),
                Seri :  curLine.getValue(c[COL_MUA_VAO.Seri]),
                SoHoaDon :  curLine.getValue(c[COL_MUA_VAO.SoHoaDon]),
                NgayHoaDon :  curLine.getValue(c[COL_MUA_VAO.NgayHoaDon]),
                NguoiBan :  curLine.getValue(c[COL_MUA_VAO.NguoiBan]),
                DiaChi :  curLine.getValue(c[COL_MUA_VAO.DiaChi]),
                MaSoThue :  curLine.getValue(c[COL_MUA_VAO.MaSoThue]),
                NoiDung :  curLine.getValue(c[COL_MUA_VAO.NoiDung]),
                TienHang :  curLine.getValue(c[COL_MUA_VAO.TienHang]) * 1,
                TienThue :  curLine.getValue(c[COL_MUA_VAO.TienThue]) * 1,
                ThueSuat :  curLine.getValue(c[COL_MUA_VAO.ThueSuat]) * 1,
                ThanhTien :  curLine.getValue(c[COL_MUA_VAO.ThanhTien]) * 1,
                SoChungTu :  curLine.getValue(c[COL_MUA_VAO.SoChungTu]),
                NgayChungTu :  curLine.getValue(c[COL_MUA_VAO.NgayChungTu]),
                TaxType :  curLine.getValue(c[COL_MUA_VAO.TAX_TYPE]),
                TienHangNT :  curLine.getValue(c[COL_MUA_VAO.TIEN_HANG_NT]) * 1,
                ThueGtgtNT :  curLine.getValue(c[COL_MUA_VAO.THUE_GTGT_NT]) * 1,
                ThanhTienNT :  curLine.getValue(c[COL_MUA_VAO.THANH_TIEN_NT]) * 1,
                SoNhapKho :  curLine.getValue(c[COL_MUA_VAO.SO_NHAP_KHO]),
            }),
            [objSavedSearch.VAT_SUMMARY_FIRST] : (curLine) => ({
                MauSo : curLine.getValue(c[COL_BAN_RA.MauSo]),
                Seri : curLine.getValue(c[COL_BAN_RA.Seri]),
                SoHoaDon : curLine.getValue(c[COL_BAN_RA.SoHoaDon]),
                NgayHoaDon : curLine.getValue(c[COL_BAN_RA.NgayHoaDon]),
                NguoiBan : curLine.getValue(c[COL_BAN_RA.NguoiBan]),
                DiaChi : curLine.getValue(c[COL_BAN_RA.DiaChi]),
                MaSoThue : curLine.getValue(c[COL_BAN_RA.MaSoThue]),
                NoiDung : curLine.getValue(c[COL_BAN_RA.NoiDung]),
                TienHang : curLine.getValue(c[COL_BAN_RA.TienHang]) * 1,
                TienThue : curLine.getValue(c[COL_BAN_RA.TienThue]) * 1,
                ThueSuat : curLine.getValue(c[COL_BAN_RA.ThueSuat]) * 1,
                ThanhTien : curLine.getValue(c[COL_BAN_RA.ThanhTien]) * 1,
                SoChungTu : curLine.getValue(c[COL_BAN_RA.SoChungTu]),
                NgayChungTu : curLine.getValue(c[COL_BAN_RA.NgayChungTu]),
                ChungTu : curLine.getValue(c[COL_BAN_RA.ChungTu]),
                Description : curLine.getValue(c[COL_BAN_RA.DESCRIPTION]),
                DTChuaThueNT : curLine.getValue(c[COL_BAN_RA.DTChuaThue]) * 1,
                TongThueNT : curLine.getValue(c[COL_BAN_RA.TongThue]) * 1,
                TongTienNT : curLine.getValue(c[COL_BAN_RA.TongTien]) * 1,
            }),
            [objSavedSearch.VAT_PURCHASE_SECOND] : (curLine) => ({
                SoChungTu : curLine.getValue(c[COL_MUA_VAO_CT.TRANSACTION_NUMBER]),
                MauSo : curLine.getValue(c[COL_MUA_VAO_CT.MAU_SO]),
                Seri : curLine.getValue(c[COL_MUA_VAO_CT.SERI]),
                SoHoaDon : curLine.getValue(c[COL_MUA_VAO_CT.SO_HOA_DON]),
                NgayHoaDon : curLine.getValue(c[COL_MUA_VAO_CT.NGAY_HOA_DON]),
                NguoiBan : curLine.getValue(c[COL_MUA_VAO_CT.NGUOI_BAN]),
                MaSoThue : curLine.getValue(c[COL_MUA_VAO_CT.MST]),
                TenHangHoa : curLine.getValue(c[COL_MUA_VAO_CT.TEN_HH]),
                Dvt : curLine.getValue(c[COL_MUA_VAO_CT.DVT]),
                SoLuong : curLine.getValue(c[COL_MUA_VAO_CT.SO_LUONG]) * 1,
                DonGia : curLine.getValue(c[COL_MUA_VAO_CT.DON_GIA]) * 1,
                TienHang : curLine.getValue(c[COL_MUA_VAO_CT.TIEN_HANG]) * 1,
                Thue_ID : curLine.getValue(c[COL_MUA_VAO_CT.THUE]),
                Thue_NM : curLine.getValue(c[COL_MUA_VAO_CT.THUE]) * 1,
                TongThue : curLine.getValue(c[COL_MUA_VAO_CT.TONG_THUE]) * 1,
                DonGiaNT : curLine.getValue(c[COL_MUA_VAO_CT.DON_GIA_NT]) * 1,
                TienHangNT : curLine.getValue(c[COL_MUA_VAO_CT.TIEN_HANG_NT]) * 1,
                ThueGtgtNT : curLine.getValue(c[COL_MUA_VAO_CT.THUE_GTGT_NT]) * 1,
                ThanhTienNT : curLine.getValue(c[COL_MUA_VAO_CT.THANH_TIEN_NT]) * 1,
            }),
            [objSavedSearch.VAT_SUMMARY_SECOND] : (curLine) => ({
                SoChungTu : curLine.getValue(c[COL_BAN_RA_CT.TRANSACTION_NUMBER]),
                MauSo : curLine.getValue(c[COL_BAN_RA_CT.MAU_SO]),
                Seri : curLine.getValue(c[COL_BAN_RA_CT.SERI]),
                SoHoaDon : curLine.getValue(c[COL_BAN_RA_CT.SO_HOA_DON]),
                NgayHoaDon : curLine.getValue(c[COL_BAN_RA_CT.NGAY_HOA_DON]),
                NguoiBan : curLine.getValue(c[COL_BAN_RA_CT.NGUOI_BAN]),
                MaSoThue : curLine.getValue(c[COL_BAN_RA_CT.MST]),
                TenHangHoa : curLine.getValue(c[COL_BAN_RA_CT.TEN_HH]),
                Dvt : curLine.getValue(c[COL_BAN_RA_CT.DVT]),
                SoLuong : curLine.getValue(c[COL_BAN_RA_CT.SO_LUONG]) * 1,
                DonGia : curLine.getValue(c[COL_BAN_RA_CT.DON_GIA]) * 1,
                TienHang : curLine.getValue(c[COL_BAN_RA_CT.TIEN_HANG]) * 1,
                Thue_ID : curLine.getValue(c[COL_BAN_RA_CT.THUE]),
                Thue_NM : curLine.getValue(c[COL_BAN_RA_CT.THUE]) * 1,
                TongThue : curLine.getValue(c[COL_BAN_RA_CT.TONG_THUE]) * 1,
                DonGiaNT : curLine.getValue(c[COL_BAN_RA_CT.DON_GIA_NT]) * 1,
                TienHangNT : curLine.getValue(c[COL_BAN_RA_CT.TIEN_HANG_NT]) * 1,
                ThueGtgtNT : curLine.getValue(c[COL_BAN_RA_CT.THUE_GTGT_NT]) * 1,
                ThanhTienNT : curLine.getValue(c[COL_BAN_RA_CT.THANH_TIEN_NT]) * 1
            })
        })[loaiBangKe];
    }

    function getValueSS(searchObj, loaiBangKe) {
        let runSearch = searchObj.runPaged({pageSize: 1000});
        let data = [];
        let c = runSearch.searchDefinition.columns;
        let fnGetElement = fnGetDataLineSavedSearch(loaiBangKe, c);
        const lcNumPage = runSearch.pageRanges.length;
        for (let i = 0; i < lcNumPage; i++) {
            let currentPage = runSearch.fetch(i);
            currentPage = currentPage.data;
            const lcPage = currentPage.length;
            for (let j = 0; j < lcPage; j++) {
                data.push(fnGetElement(currentPage[j]));
            }
        }
        let objTotal = getTotalDataSS(loaiBangKe, data);
        sortArrayOfTypeDateString(data, "NgayHoaDon", "SoHoaDon");
        data.push(objTotal);
        return data;
    }

    function getObjTotal(loaiBangKe) {
        switch (loaiBangKe) {
            case objSavedSearch.VAT_PURCHASE_FIRST:
                return {
                    Level: "1",
                    NoiDung: "Tổng cộng",
                    TienHang: 0,
                    TienThue: 0,
                    ThanhTien: 0,
                    TienHangNT: 0,
                    ThueGtgtNT: 0,
                    ThanhTienNT: 0
                };
                break;
            case objSavedSearch.VAT_SUMMARY_FIRST:
                return {
                    Level: "1",
                    NoiDung: "Tổng cộng",
                    TienHang: 0,
                    TienThue: 0,
                    ThanhTien: 0,
                    DTChuaThueNT: 0,
                    TongThueNT: 0,
                    TongTienNT: 0
                };
                break;
            case objSavedSearch.VAT_PURCHASE_SECOND:
                return {
                    Level: "1",
                    TenHangHoa: "Tổng cộng",
                    TienHang: 0,
                    TongThue: 0,
                    TienHangNT: 0,
                    ThueGtgtNT: 0,
                    ThanhTienNT: 0
                };
                break;
            case objSavedSearch.VAT_SUMMARY_SECOND:
                return {
                    Level: "1",
                    TenHangHoa: "Tổng cộng",
                    TienHang: 0,
                    TongThue: 0,
                    TienHangNT: 0,
                    ThueGtgtNT: 0,
                    ThanhTienNT: 0
                };
                break;
        }
    }

    function addGroupField(form, container, id, type, label, source) {
        return form.addField({
            container: container, id: id, type: type, label: label, source: source
        });
    }

    function addButton(form, id, label, functionName) {
        form.addButton({
            id: id, label: label, functionName: functionName
        });
    }

    function addField(sublist, id, line, value) {
        if (!lfunc.isContainValue(value)) return;
        return sublist.setSublistValue({
            id: id, line: line, value: value
        });
    }

    function addSublist(form, id, type, label) {
        return form.addSublist({
            id: id, type: type, label: label
        });
    }

    function addSublistField(sublist, id, label, type, _displayType) {
        return sublist.addField({
            id: id, label: label, type: type
        }).updateDisplayType({
            displayType: _displayType || "inline"
        });
    }

    function changeCurrency(number) {
        if (!lfunc.isContainValue(number)) return '';
        let parts = number.toString().split(".");
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        if (parts[1] !== '00') return parts.join(",");
        return parts[0];
    }

    function getListArrColumn(loaiBangKe, label, currency) {
        let arrLabel = [];
        const isForeignCurrency = foreignCurrency(currency);
        switch (loaiBangKe) {
            case objSavedSearch.VAT_PURCHASE_FIRST:
                arrLabel = ['STT', 'Mẫu hóa đơn', 'Số seri', 'Số hóa đơn', 'Ngày Hóa Đơn', label, 'Địa chỉ', 'Mã số thuế', 'Nội dung', 'Tiền hàng', 'Tiền thuế', 'Thuế suất', 'Thành Tiền', 'Số chứng từ', 'Số nhập kho', 'Ngày chứng từ'];
                if (isForeignCurrency) arrLabel = arrLabel.concat(['Tiền hàng NT', 'Tiền thuế NT', 'Thành tiền NT']);
                break;
            case objSavedSearch.VAT_SUMMARY_FIRST:
                arrLabel = ['STT', 'Mẫu hóa đơn', 'Số seri', 'Số hóa đơn', 'Ngày Hóa Đơn', label, 'Địa chỉ', 'Mã số thuế', 'Nội dung', 'Tiền hàng', 'Tiền thuế', 'Thuế suất', 'Thành Tiền', 'Số chứng từ', 'Ngày chứng từ'];
                if (isForeignCurrency) arrLabel = arrLabel.concat(['Doanh thu chưa thuế (ngoại tệ)', 'Tổng thuế (ngoại tệ)', 'Tổng tiền (ngoại tệ)']);
                break;
            case objSavedSearch.VAT_PURCHASE_SECOND:
                arrLabel = ['STT', 'Số chứng từ', 'Mẫu số', 'Ký hiệu', 'Số hóa đơn', 'Ngày hóa đơn', 'Tên người bán', 'MST', 'Tên hàng hóa, dịch vụ', 'Đơn vị tính', 'Số lượng', 'Đơn giá', 'Giá trị HHDV mua vào chưa có thuế GTGT', 'Thuế suất (%)', 'Tiền thuế GTGT'];
                if (isForeignCurrency) arrLabel = arrLabel.concat(['Đơn giá NT', 'Tiền hàng NT', 'Tiền thuế NT', 'Thành tiền NT']);
                break;
            case objSavedSearch.VAT_SUMMARY_SECOND:
                arrLabel = ['STT', 'Số chứng từ', 'Mẫu số', 'Ký hiệu', 'Số hóa đơn', 'Ngày hóa đơn', 'Tên người bán', 'MST', 'Tên hàng hóa, dịch vụ', 'Đơn vị tính', 'Số lượng', 'Đơn giá', 'Giá trị HHDV mua vào chưa có thuế GTGT', 'Thuế suất (%)', 'Tiền thuế GTGT'];
                if (isForeignCurrency) arrLabel = arrLabel.concat(['Đơn giá (ngoại tệ)', 'Tiền hàng (ngoại tệ)', 'Thuế GTGT (ngoại tệ)', 'Tổng tiền (ngoại tệ)']);
                break;
        }
        arrLabel.push('Level');
        return arrLabel;
    }

    function sortArrayOfTypeDateString(arrayOfObjects, field, fieldCompare) {
        arrayOfObjects
            .sort(function (a, b) {
                let aDate = a[field] ? a[field].split("/") : [];
                let bDate = b[field] ? b[field].split("/") : [];
                if (aDate.length === 0) return 1;
                if (bDate.length === 0) return -1;
                if (aDate.length > 0 && bDate.length > 0) {
                    aDate = new Date(aDate[2], aDate[1] * 1 - 1, aDate[0]);
                    bDate = new Date(bDate[2], bDate[1] * 1 - 1, bDate[0]);
                    return aDate - bDate || a[fieldCompare].localeCompare(b[fieldCompare]);
                }
            });
    }

    function convertDateToObject(dateStr) {
        let dateStrArr = dateStr.split("/");
        return {
            mm: dateStrArr[1], yyyy: dateStrArr[2], dd: dateStrArr[0]
        }
    }

    function foreignCurrency(val) {
        return !!val && val !== VND_ID;
    }
});