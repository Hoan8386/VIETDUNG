/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record', 'N/runtime', '../common/scv_common_pdf', 'N/render', 'N/search',
        '../common/scv_common_theo_doi_phieu_in'],
    (record, runtime, comPdf, render, search, comPhieuIn) => {

        const TemplatePhieuGiaoViec = {
            workorder: 'CUSTTMPL_SCV_PGV_WORKORDER',
            custompurchase_scv_other_work_order: 'CUSTTMPL_SCV_PGV_OWO',
        }

        const ProductLossCategory = {
            'PHOI_MAU': '303',
        }

        const ProductLossReason = {
            'KHAC': '20',
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
            let objRender = comPdf.initTemplateRender(TemplatePhieuGiaoViec[parameters.recType])
            comPdf.addFontVietnamese(objRender);

            let rec = record.load({
                type: parameters.recType,
                id: parameters.recId,
            });

            switch (parameters.recType) {
                case 'workorder':
                    getDataWorkOrder(parameters, rec, objRender);
                    comPhieuIn.createPhieuTheoDoi(parameters.recId, TemplatePhieuGiaoViec.workorder)
                    return objRender.renderAsPdf();

                case 'custompurchase_scv_other_work_order':
                    getDataOtherWorkOrder(parameters, rec, objRender);
                    comPhieuIn.createPhieuTheoDoi(parameters.recId, TemplatePhieuGiaoViec.custompurchase_scv_other_work_order)
                    return objRender.renderAsPdf();
            }
        }

        const getDataWorkOrder = (params, recWorkOrder, objRenderWorkOrder) => {
            let ngayin = getDateTodate(new Date())
            let empName = getEmployeeName();
            let legalname = getSubsidiaryData(recWorkOrder).legalname;

            let itemLines = getItemLinesWo(recWorkOrder);
            let dataAfterFirstLine = getItemAfterFirstLine(recWorkOrder);
            log.error('dataAfterFirstLine', dataAfterFirstLine);

            let displayname = search.lookupFields({
                type: 'assemblyitem',
                id: recWorkOrder.getValue('assemblyitem'),
                columns: ['displayname']
            }).displayname;

            let memo = recWorkOrder.getValue('memo');
            let custbody_scv_memo_02 = recWorkOrder.getValue('custbody_scv_memo_02');

            if (memo && custbody_scv_memo_02) {
                memo = memo + '<br/>' + custbody_scv_memo_02;
            } else if (custbody_scv_memo_02) {
                memo = custbody_scv_memo_02;
            }

            let obj =
                {
                    priority: recWorkOrder.getValue('custbody_scv_priority'),
                    tran_date: recWorkOrder.getText('trandate'),
                    assembly_lot: recWorkOrder.getValue('custbody_scv_assembly_lot'),
                    //tksx : recWorkOrder.getText('custbody_scv_tksx'),
                    tranid: recWorkOrder.getValue('tranid'),
                    workcenter: recWorkOrder.getText('custbody_mfgmob_workcenter'),
                    work_order_type: recWorkOrder.getText('custbody_scv_work_order_type'),
                    order_type: recWorkOrder.getText('custbody_scv_order_type'),
                    assemblyitem: recWorkOrder.getText('assemblyitem'),
                    displayname: displayname,
                    units: recWorkOrder.getText('units'),
                    quantity: recWorkOrder.getValue('quantity'),
                    tolerance_min_percent: recWorkOrder.getValue('custbody_scv_tolerance_min_percent')
                        ? recWorkOrder.getValue('custbody_scv_tolerance_min_percent')
                        : recWorkOrder.getValue('custbody_scv_tolerance_qty'),
                    tolerance_max_percent: recWorkOrder.getValue('custbody_scv_tolerance_max_percent')
                        ? recWorkOrder.getValue('custbody_scv_tolerance_max_percent')
                        : recWorkOrder.getValue('custbody_scv_tolerance_qty_plus'),
                    giaohangdukien: getDateTodate(recWorkOrder.getValue('requesteddate')),
                    memo: memo,
                };

            objRenderWorkOrder.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: 'record',
                data: {
                    arrItem: itemLines,
                    obj: obj,
                    dataAfterFirstLine: dataAfterFirstLine,
                    dataAfterFirstLineLength: dataAfterFirstLine.length,
                    legalname: legalname,
                    ngayin: ngayin,
                    empName: empName,
                }
            });

        }

        const getItemAfterFirstLine = (recWorkOrder) => {
            let itemLines = recWorkOrder.getLineCount('recmachcustrecord_scv_by_product_wo');
            let arrItem = [];

            for (let i = 0; i < itemLines; i++) {

                let lossCategory = recWorkOrder.getSublistValue('recmachcustrecord_scv_by_product_wo', 'custrecord_scv_by_prod_loss_category', i);
                let lossReason = recWorkOrder.getSublistValue('recmachcustrecord_scv_by_product_wo', 'custrecord_scv_by_prod_loss_reason', i);

                if (lossCategory === ProductLossCategory.PHOI_MAU && lossReason === ProductLossReason.KHAC) {
                    let item = {
                        custrecord_scv_by_prod_item_display: recWorkOrder.getSublistValue('recmachcustrecord_scv_by_product_wo', 'custrecord_scv_by_prod_item_display', i)
                            .substring(recWorkOrder.getSublistValue('recmachcustrecord_scv_by_product_wo', 'custrecord_scv_by_prod_item_display', i).indexOf('_') + 1),
                        custrecord_scv_by_prod_loss_category_display: recWorkOrder.getSublistValue('recmachcustrecord_scv_by_product_wo', 'custrecord_scv_by_prod_loss_category_display', i),
                        custrecord_scv_by_product_qty: recWorkOrder.getSublistValue('recmachcustrecord_scv_by_product_wo', 'custrecord_scv_by_product_qty', i),
                        // trên view không lấy được trường unit => search.lookupFields
                        unit: search.lookupFields({
                            type: 'item',
                            id: recWorkOrder.getSublistValue('recmachcustrecord_scv_by_product_wo', 'custrecord_scv_by_prod_item', i),
                            columns: ['unitstype']
                        })['unitstype'][0]?.text,
                        unit2: recWorkOrder.getSublistText('recmachcustrecord_scv_by_product_wo', 'custrecord_scv_uom', i),
                    };

                    arrItem.push(item);
                }
            }

            return arrItem;
        }

        const getDataOtherWorkOrder = (params, recOtherWorkOrder, objRender) => {
            let ngayin = getDateTodate(new Date());
            let empName = getEmployeeName();
            let legalname = getSubsidiaryData(recOtherWorkOrder).legalname;
            let workcenter = recOtherWorkOrder.getText('custbody_mfgmob_workcenter');
            let work_order_type = recOtherWorkOrder.getText('custbody_scv_work_order_type');

            let itemLinesData = {
                items: [],
            };

            getItemLinesOwO(recOtherWorkOrder, itemLinesData);

            objRender.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: 'record',
                data: {
                    itemLines: itemLinesData,
                    arrayItemLength: itemLinesData.items.length,
                    legalname: legalname,
                    ngayin: ngayin,
                    empName: empName,
                    work_order_type: work_order_type,
                    workcenter: workcenter,
                }

            })
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

        const getEmployeeName = () => {
            let idEntity = runtime.getCurrentUser().id;

            if (idEntity) {
                let lkFieldsEntity = search.lookupFields({
                    type: 'entity',
                    id: idEntity,
                    columns: ['type']
                });

                if (lkFieldsEntity.type[0]?.value === 'Employee') {
                    let lkFieldsEmployee = search.lookupFields({
                        type: search.Type.EMPLOYEE,
                        id: idEntity,
                        columns: ['custentity_scv_legal_name']
                    });

                    return lkFieldsEmployee['custentity_scv_legal_name'];
                } else if (lkFieldsEntity.type[0]?.value === 'Partner') {
                    let lkFieldsPartner = search.lookupFields({
                        type: 'partner',
                        id: idEntity,
                        columns: ['custentity_scv_partner_employee.custentity_scv_legal_name']
                    });

                    return lkFieldsPartner['custentity_scv_partner_employee.custentity_scv_legal_name'];
                }
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

        const getItemLinesWo = (rec) => {
            let lines = rec.getLineCount('item');
            let arrItem = [];
            let stt = 1;
            for (let i = 0; i < lines; i++) {
                let item = rec.getSublistValue('item', 'item_display', i).substring(rec.getSublistValue('item', 'item_display', i).indexOf('_') + 1);
                let itemType = rec.getSublistValue('item', 'itemtype', i);
                if (itemType !== 'OthCharge') {
                    let custcol_scv_qc_serial_code = rec.getSublistValue('item', 'custcol_scv_qc_serial_code', i);
                    if (custcol_scv_qc_serial_code) {
                        arrItem.push(`${stt++}. ${item} - ${custcol_scv_qc_serial_code}`);
                    } else {
                        arrItem.push(`${stt++}. ${item}`);
                    }
                }
            }
            return arrItem.join('<br/> ')
            // return arrItem.join('<br/> ').replace(/&/g, '&amp;');
            // return arrItem.map(escapeXml).join('<br/>');
        }

        function escapeXml(str) {
            return str
                ?.replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&apos;') || '';
        }

        const getItemLinesOwO = (recOtherWorkOrder, itemLinesData) => {
            let itemLines = recOtherWorkOrder.getLineCount('item');

            if (itemLines > 0) {
                for (let i = 0; i < itemLines; i++) {
                    let lineData = {};
                    //lineData.custcol_scv_owo_assembly = recOtherWorkOrder.getSublistValue('item', 'custcol_scv_owo_assembly_display', i).split('_')[1];
                    lineData.custcol_scv_owo_assembly = recOtherWorkOrder.getSublistValue('item', 'custcol_scv_owo_assembly_display', i).substring(recOtherWorkOrder.getSublistValue('item', 'custcol_scv_owo_assembly_display', i).indexOf('_') + 1);
                    lineData.units = recOtherWorkOrder.getSublistValue('item', 'custcol_scv_owo_assy_units_display', i);
                    lineData.plan_quantity = recOtherWorkOrder.getSublistValue('item', 'custcol_scv_plan_qty', i);
                    lineData.transactionnumber = recOtherWorkOrder.getValue('transactionnumber');
                    lineData.order_type = recOtherWorkOrder.getText('custbody_scv_order_type');
                    lineData.tolerance_min_percent = recOtherWorkOrder.getValue('custbody_scv_tolerance_min_percent');
                    lineData.tolerance_max_percent = recOtherWorkOrder.getValue('custbody_scv_tolerance_max_percent');
                    lineData.giaohangdukien = getDateTodate(recOtherWorkOrder.getValue('custbody_scv_prod_end_date'));
                    lineData.memo = recOtherWorkOrder.getValue('memo');
                    lineData.item_display = recOtherWorkOrder.getSublistValue('item', 'item_display', i);
                    itemLinesData.items.push(lineData);
                }
            }
        }

        return {onRequest}

    });
