/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record', 'N/runtime', '../common/scv_common_pdf', 'N/render', 'N/search'],

    (record, runtime, comPdf, render, search) => {

        const TEMPLATE_YCSX = {
            workorder: 'CUSTTMPL_SCV_YCSX_WO',
            custompurchase_scv_other_work_order: 'CUSTTMPL_SCV_YCSX_OWO',
        }

        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            if (scriptContext.request.method === 'GET') {

                let parameters = scriptContext.request.parameters;

                let pdfFile = buildFilePdf(parameters);
                scriptContext.response.writeFile({
                    file: pdfFile,
                    isInline: true,
                });
            }
        }

        const buildFilePdf = (parameters) => {
            let objRender = comPdf.initTemplateRender(TEMPLATE_YCSX[parameters.recType])
            comPdf.addFontVietnamese(objRender);

            let rec = record.load({
                type: parameters.recType,
                id: parameters.recId,
            });
            objRender.addRecord('recMain', rec)

            switch (parameters.recType) {
                case 'workorder':
                    getDataWorkOrder(parameters, rec, objRender);
                    return objRender.renderAsPdf();

                case 'custompurchase_scv_other_work_order':
                    getDataOtherWorkOrder(parameters, rec, objRender);
                    return objRender.renderAsPdf();


            }
        }

        const getDataWorkOrder = (params, recWorkOrder, objRenderWorkOrder) => {
            let legalname = getSubsidiaryData(recWorkOrder).legalname;

            let itemLines = getItemLines(recWorkOrder);

            let obj =
                {
                    trandate: getDateTodate(recWorkOrder.getValue('trandate')),
                    approval_status: recWorkOrder.getText('custbody_scv_approval_status'),
                    tranid: recWorkOrder.getValue('tranid'),
                    idSalesOrder: recWorkOrder.getText('custbody_scv_sales_order'),
                    class: recWorkOrder.getText('class'),
                    work_order_type: recWorkOrder.getText('custbody_scv_work_order_type'),
                    order_type: recWorkOrder.getText('custbody_scv_order_type'),
                    assemblyitem: recWorkOrder.getText('assemblyitem'),
                    itemCode: recWorkOrder.getValue('custbody_scv_mfg_itemcode'),
                    units: recWorkOrder.getText('units'),
                    quantity: formatCurrencyUS(recWorkOrder.getValue('quantity')),
                    tolerance_min_percent: recWorkOrder.getText('custbody_scv_tolerance_min_percent')
                        ? recWorkOrder.getText('custbody_scv_tolerance_min_percent')
                        : recWorkOrder.getText('custbody_scv_tolerance_qty'),
                    tolerance_max_percent: recWorkOrder.getText('custbody_scv_tolerance_max_percent')
                        ? recWorkOrder.getText('custbody_scv_tolerance_max_percent')
                        : recWorkOrder.getText('custbody_scv_tolerance_qty_plus'),
                    giaohangdukien: getDateTodate(recWorkOrder.getValue('requesteddate')),
                    memo: recWorkOrder.getValue('memo'),
                };

            objRenderWorkOrder.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: 'record',
                data: {
                    arrItem: itemLines,
                    obj: obj,
                    legalname: legalname,
                }
            });

        }

        const getDataOtherWorkOrder = (params, recOtherWorkOrder, objRender) => {
            let legalname = getSubsidiaryData(recOtherWorkOrder).legalname;
            let workcenter = recOtherWorkOrder.getText('custbody_mfgmob_workcenter');
            let work_order_type = recOtherWorkOrder.getText('custbody_scv_work_order_type');
            let trandate = getDateTodate(recOtherWorkOrder.getValue('trandate'));
            let approval_status = recOtherWorkOrder.getText('custbody_scv_approval_status');
            let itemLinesData = {
                items: [],
            };

            getItemLinesOwO(recOtherWorkOrder, itemLinesData);

            objRender.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: 'record',
                data: {
                    trandate: trandate,
                    approval_status: approval_status,
                    itemLines: itemLinesData,
                    arrayItemLength: itemLinesData.items.length,
                    legalname: legalname,
                    work_order_type: work_order_type,
                    workcenter: workcenter,
                }

            });
        }

        const getDateTodate = (trandate) => {
            if (!(trandate instanceof Date) || isNaN(trandate.getTime())) {
                return '....../....../.............';
            }
            let timezoneOffset = trandate.getTimezoneOffset() / 60;
            trandate.setHours(trandate.getHours() + timezoneOffset + 7);
            let dd_now = String(trandate.getDate()).padStart(2, '0');
            let mm_now = String(trandate.getMonth() + 1).padStart(2, '0');
            let yyyy_now = trandate.getFullYear();

            return dd_now + '/' + mm_now + '/' + yyyy_now;
        }

        const formatCurrencyUS = (number) => {
            return new Intl.NumberFormat('en-DE', {
                style: 'currency',
                currency: 'EUR',
                currencyDisplay: "code"
            })
                .format(number)
                .replace("EUR", "")
                .trim();
        }

        const getEmployeeData = () => {
            let idUser = runtime.getCurrentUser().id;
            if (idUser) {
                return search.lookupFields({
                    type: 'employee',
                    id: idUser,
                    columns: ['custentity_scv_legal_name']
                });
            }
        }

        const getSubsidiaryData = (rec) => {
            let subsidiary = rec.getValue('subsidiary');
            if (subsidiary) {
                return search.lookupFields({
                    type: 'subsidiary',
                    id: subsidiary,
                    columns: ['legalname']
                });
            }
        }

        const getItemLines = (rec) => {
            let lines = rec.getLineCount('item');
            let arrItem = [];
            for (let i = 0; i < lines; i++) {
                let item = rec.getSublistValue('item', 'item_display', i);
                arrItem.push(item);
            }
            return arrItem.join('\n');
        }

        const getItemLinesOwO = (recOtherWorkOrder, itemLinesData) => {
            let itemLines = recOtherWorkOrder.getLineCount('item');

            if (itemLines > 0) {
                for (let i = 0; i < itemLines; i++) {
                    let lineData = {};
                    lineData.custcol_scv_owo_assembly = recOtherWorkOrder.getSublistValue('item', 'custcol_scv_owo_assembly_display', i);
                    lineData.itemCode = recOtherWorkOrder.getSublistValue('item', 'custcol_scv_tc_item_code', i);
                    lineData.units = recOtherWorkOrder.getSublistValue('item', 'custcol_scv_owo_assy_units_display', i);
                    lineData.class = recOtherWorkOrder.getText('class');
                    lineData.custbody_scv_work_order_type = recOtherWorkOrder.getText('custbody_scv_work_order_type');
                    lineData.custbody_scv_sales_order = recOtherWorkOrder.getText('custbody_scv_sales_order');
                    lineData.custcol_scv_plan_qty = recOtherWorkOrder.getSublistValue('item', 'custcol_scv_plan_qty', i);
                    lineData.transactionnumber = recOtherWorkOrder.getValue('transactionnumber');
                    lineData.order_type = recOtherWorkOrder.getText('custbody_scv_order_type');
                    lineData.tolerance_min_percent = recOtherWorkOrder.getText('custbody_scv_tolerance_min_percent');
                    lineData.tolerance_max_percent = recOtherWorkOrder.getText('custbody_scv_tolerance_max_percent');
                    lineData.giaohangdukien = recOtherWorkOrder.getValue('custbody_scv_prod_end_date');
                    lineData.memo = recOtherWorkOrder.getValue('memo');
                    lineData.item_display = recOtherWorkOrder.getSublistValue('item', 'item_display', i);
                    itemLinesData.items.push(lineData);
                }
            }
        }

        const getTranDate = (trandate) => {
            if (!(trandate instanceof Date) || isNaN(trandate.getTime())) {
                return 'Ngày ............tháng ............. năm...............';
            }
            let timezoneOffset = trandate.getTimezoneOffset() / 60;
            trandate.setHours(trandate.getHours() + timezoneOffset + 7);
            let dd_now = String(trandate.getDate()).padStart(2, '0');
            let mm_now = String(trandate.getMonth() + 1).padStart(2, '0');
            let yyyy_now = trandate.getFullYear();
            // let ngayin =  dd_now + ' / ' + mm_now + ' / ' + yyyy_now;
            return 'Ngày ' + dd_now + ' tháng ' + mm_now + ' năm ' + yyyy_now;
        }

        return {onRequest}

    });
