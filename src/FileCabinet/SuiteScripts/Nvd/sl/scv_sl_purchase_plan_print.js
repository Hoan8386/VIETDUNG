/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record','N/render' , '../common/scv_common_pdf','N/file'],

    (record, render, comPdf, file) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            let params = scriptContext.request.parameters;
            let recPurchasePlan = record.load({type: params.rectype, id: params.recid,});
            if(scriptContext.request.method === 'GET') {
                let pdfFile = buildFilePdf(recPurchasePlan);
                scriptContext.response.writeFile( pdfFile,  true);
            } else {
                let objResponse = getDataPurchasePlanForExcel(recPurchasePlan, params);
                scriptContext.response.setHeader("Content-Type", "text/plain;charset=UTF-8");
                scriptContext.response.write(JSON.stringify(objResponse));
            }
        }

        const colId = ['','no','item','custcol_scv_po_properties','unit','custcol_scv_plan_use_by_month',
                               'custcol_scv_qty_consump_by_month','custcol_scv_qty_processing','tong_di_duong','custcol_scv_total_qty',
                               'custcol_scv_qty_requisition','custcol_scv_plan_approve_qty','custcol_scv_memo']

        const getDataPurchasePlanForExcel = (recPurchasePlan, parameters) => {
            let urlToTemplate = file.load({id: '../xls/scv_xlsx_khmh.xlsx'}).url;
            let {tableData, arrTableFooter} = getTableDataExcelPP(recPurchasePlan);
            let mappedData = getMappedDataExcelPP( arrTableFooter, recPurchasePlan);
            let templateType = getTemplateType(parameters);
            return {
                templatetype: templateType,
                filename: 'Kế hoạch mua hàng.xlsx',
                url: urlToTemplate,
                mappedData: mappedData,
                arrData: tableData,
                colId: colId,
                idxSourceRow: 8,
                idxRowData: 9,
            }
        }


        const getMappedDataExcelPP = (arrTableFooter,recPurchasePlan) => {

            return {
                // 'B1': {trandate: String(recPurchasePlan.getValue('trandate').getMonth()).padStart(2,'0')},
                'B1': {trandate: recPurchasePlan.getValue('custbody_scv_plan_month')},
                'D2': {nhomdanhmuchh: recPurchasePlan.getText('custbody_scv_list_item_standard')},
                 D3 : {bpmuahang : recPurchasePlan.getText('department')},
                 L3 : {sokhmh : recPurchasePlan.getValue('tranid')},
                 D4 : {congty : recPurchasePlan.getText('subsidiary')},
                 L4 : {phanloaikh : recPurchasePlan.getText('custbody_scv_pur_plan_type')},
                'F9': {sumKeHoachSuDung: arrTableFooter.sumKeHoachSuDung},
                'G9': {sumTieuHaoTrungBinh: arrTableFooter.sumTieuHaoTrungBinh},
                'H9': {sumTonDen: arrTableFooter.sumTonDen},
                'I9': {sumTongDiDuong: arrTableFooter.sumTongDiDuong},
                'J9': {sumTongTon: arrTableFooter.sumTongTon},
                'K9': {sumSoLuongNhuCau: arrTableFooter.sumSoLuongNhuCau},
                'L9': {sumSoLuongDuyet: arrTableFooter.sumSoLuongDuyet},
                C11 : {memo: recPurchasePlan.getText('memo')}

            }
        }

        const getTableDataExcelPP = (recPurchasePlan) => {
            let itemLines = recPurchasePlan.getLineCount({sublistId: 'item'});

            let arrItems = [];
            for (let i = 0; i < itemLines; i++) {
                let item = {
                    no : i + 1 ,
                    // custcol_scv_upc_code: recPurchasePlan.getSublistValue('item', 'custcol_scv_upc_code', i),
                    item: recPurchasePlan.getSublistText('item', 'item', i),
                    custcol_scv_po_properties: recPurchasePlan.getSublistValue('item', 'custcol_scv_po_properties', i),
                    unit: recPurchasePlan.getSublistText('item', 'units', i),
                    custcol_scv_plan_use_by_month: formatCurrency(Number(recPurchasePlan.getSublistValue('item', 'custcol_scv_plan_use_by_month', i))),
                    custcol_scv_qty_consump_by_month: formatCurrency(Number(recPurchasePlan.getSublistValue('item', 'custcol_scv_qty_consump_by_month', i))),
                    custcol_scv_qty_processing: formatCurrency(Number(recPurchasePlan.getSublistValue('item', 'custcol_scv_qty_processing', i))),
                    tong_di_duong: formatCurrency(Number((recPurchasePlan.getSublistValue('item', 'custcol_scv_pur_plan_qty_po', i) || 0 + recPurchasePlan.getSublistValue('item', 'custcol_scv_pur_plan_qty_po_remain ', i))) || 0) || 0,
                    custcol_scv_total_qty: formatCurrency(Number(recPurchasePlan.getSublistValue('item', 'custcol_scv_total_qty', i))),
                    custcol_scv_qty_requisition: formatCurrency(Number(recPurchasePlan.getSublistValue('item', 'custcol_scv_qty_requisition', i))),
                    custcol_scv_plan_approve_qty: formatCurrency(Number(recPurchasePlan.getSublistValue('item', 'custcol_scv_plan_approve_qty', i))),
                    // custcol_scv_market_number: recPurchasePlan.getSublistValue('item', 'custcol_scv_market_number', i),
                    custcol_scv_memo: recPurchasePlan.getSublistValue('item', 'custcol_scv_memo', i),
                };
                arrItems.push(item);
            }
            let arrTableFooter = getTotalOfEachColumn(recPurchasePlan, arrItems);
            return {
                tableData: arrItems,
                arrTableFooter : arrTableFooter
            }
        }

        const buildFilePdf = (recPurchasePlan) => {
            let templateId = 'CUSTTMPL_SCV_PURCHASE_PLAN';
            let objRender = comPdf.initTemplateRender(templateId);
            comPdf.addFontVietnamese(objRender);
            addRecordPurchasePlanToRender(objRender, recPurchasePlan);
            addItemsToRender(objRender, recPurchasePlan);

            objRender.addRecord({
                templateName: 'recPurchasePlan', record: recPurchasePlan
            });
            return objRender.renderAsPdf();
        }

        const addRecordPurchasePlanToRender = (objRender, recPurchasePlan) => {
            objRender.addRecord({
                templateName: 'recPurchasePlan', record: recPurchasePlan
            });
        }

        const addItemsToRender = (objRender, recPurchasePlan) => {
            let itemLines = recPurchasePlan.getLineCount({sublistId: 'item'});

            let arrItems = [];
            for (let i = 0; i < itemLines; i++) {
                let item = {
                    custcol_scv_upc_code: recPurchasePlan.getSublistValue('item', 'custcol_scv_upc_code', i),
                    item: recPurchasePlan.getSublistValue('item', 'custcol_scv_displayname', i),
                    custcol_scv_po_properties: recPurchasePlan.getSublistText('item', 'custcol_scv_po_properties', i),
                    unit: recPurchasePlan.getSublistText('item', 'units', i),
                    custcol_scv_plan_use_by_month: recPurchasePlan.getSublistValue('item', 'custcol_scv_plan_use_by_month', i),
                    custcol_scv_qty_consump_by_month: recPurchasePlan.getSublistValue('item', 'custcol_scv_qty_consump_by_month', i),
                    custcol_scv_qty_processing: recPurchasePlan.getSublistValue('item', 'custcol_scv_qty_processing', i),
                    tong_di_duong: ((recPurchasePlan.getSublistValue('item', 'custcol_scv_pur_plan_qty_po', i) || 0 )
                        +
                    (recPurchasePlan.getSublistValue('item', 'custcol_scv_pur_plan_qty_po_remain ', i) || 0)) ,
                    custcol_scv_total_qty: recPurchasePlan.getSublistValue('item', 'custcol_scv_total_qty', i),
                    custcol_scv_qty_requisition: recPurchasePlan.getSublistValue('item', 'custcol_scv_qty_requisition', i),
                    custcol_scv_plan_approve_qty: recPurchasePlan.getSublistValue('item', 'custcol_scv_plan_approve_qty', i),
                    custcol_scv_market_number: recPurchasePlan.getSublistValue('item', 'custcol_scv_market_number', i),
                    custcol_scv_memo: recPurchasePlan.getSublistValue('item', 'custcol_scv_memo', i),
                };
                arrItems.push(item);
            }

            let arrTotalFooter = getTotalOfEachColumn(recPurchasePlan, arrItems);

            objRender.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: 'items',
                data: {
                    arrItems: arrItems,
                    arrTotalFooter: arrTotalFooter
                }
            });
        }

        const getTotalOfEachColumn = (recPurchasePlan, arrItems) => {
            let sumKeHoachSuDung = 0;
            let sumTieuHaoTrungBinh = 0;
            let sumTonDen = 0;
            let sumTongDiDuong = 0;
            let sumTongTon = 0;
            let sumSoLuongNhuCau = 0;
            let sumSoLuongDuyet = 0;
log.error('arrItems', arrItems)
            let itemLines = recPurchasePlan.getLineCount({sublistId: 'item'});
            for (let i = 0; i < itemLines; i++) {
                sumKeHoachSuDung += Number(recPurchasePlan.getSublistValue('item', 'custcol_scv_plan_use_by_month', i));
                sumTieuHaoTrungBinh += Number(recPurchasePlan.getSublistValue('item', 'custcol_scv_qty_consump_by_month', i));
                sumTonDen += Number(recPurchasePlan.getSublistValue('item', 'custcol_scv_qty_processing', i));
                sumTongDiDuong += Number((recPurchasePlan.getSublistValue('item', 'custcol_scv_pur_plan_qty_po_remain', i) || 0)
                    +
                    (recPurchasePlan.getSublistValue('item', 'custcol_scv_pur_plan_qty_remain ', i) || 0));
                sumTongDiDuong += Number(arrItems[i].tong_di_duong);
                sumTongTon += Number(recPurchasePlan.getSublistValue('item', 'custcol_scv_total_qty', i));
                sumSoLuongNhuCau += Number(recPurchasePlan.getSublistValue('item', 'custcol_scv_qty_requisition', i));
                sumSoLuongDuyet += Number(recPurchasePlan.getSublistValue('item', 'custcol_scv_plan_approve_qty', i));
            }

            return {
                sumKeHoachSuDung: formatCurrency(sumKeHoachSuDung),
                sumTieuHaoTrungBinh: formatCurrency(sumTieuHaoTrungBinh),
                sumTonDen: formatCurrency(sumTonDen),
                sumTongDiDuong: formatCurrency(sumTongDiDuong),
                sumTongTon: formatCurrency(sumTongTon),
                sumSoLuongNhuCau: formatCurrency(sumSoLuongNhuCau),
                sumSoLuongDuyet: formatCurrency(sumSoLuongDuyet),
            }
        }

        const getTemplateType = (parameters) => {
            return parameters.isExcel === 'T' ? 'excel' : 'word';
        }

        const formatCurrency = (number) => {
            return new Intl.NumberFormat('ja-JP', {
                style: 'currency',
                currency: 'JPY',
                currencyDisplay: "code"
            })
                .format(number)
                .replace("JPY", "")
                .trim();
        }

        return {onRequest}

    });
