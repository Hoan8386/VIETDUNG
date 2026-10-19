/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record', '../common/scv_common_pdf', 'N/render', 'N/search',
        '../olib/alasql/alasql.min@1.7.3.js', '../lib/scv_lib_function',
        '../lib/scv_lib_amount_in_word'
    ],

    (record, comPdf, render, search, alasql,lfunc, lamount) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            let parameters = scriptContext.request.parameters;

            if (scriptContext.request.method === 'GET') {
                let pdfFile = buildPdfFile(parameters);
                scriptContext.response.writeFile(pdfFile, true);
            }
        }

        const buildPdfFile = (parameters) => {
            let recItemFulfillment = record.load({
                type: parameters.rectype,
                id: parameters.recid
            });

            let objRender = comPdf.initTemplateRender('CUSTTMPL_SCV_ITF_PXB');

            addMainRecordToRenderer(objRender, recItemFulfillment);
            addEmployeeToRenderer(objRender, recItemFulfillment);
            let arrItemSo = addSalesOrderDataToRenderer(objRender, recItemFulfillment);
            // cần nối với item của sales order và item của item fulfillment vì
            // ban đầu item fulfillment không có giá trị rate, giờ đã có, nhưng lười sửa vì code dài
            addItemsToRenderer(objRender, recItemFulfillment, arrItemSo);
            addCustomDataToRenderer(objRender, recItemFulfillment);
            addSubsidiaryDataToRenderer(objRender, recItemFulfillment);

            comPdf.addFontVietnamese(objRender);
            comPdf.addImage(objRender, 'Logo-removebg-preview.png');

            return objRender.renderAsPdf();
        }

        const addSalesOrderDataToRenderer = (objRender, recItemFulfillment) => {
            let salesOrderId = recItemFulfillment.getValue('createdfrom');
            if (salesOrderId) {
                let recSalesOrder = record.load({
                    type: 'salesorder',
                    id: salesOrderId,
                })

                let custbody_scv_htvc = recSalesOrder.getText('custbody_scv_htvc');
                let custbody_scv_xe_khach_hang = recSalesOrder.getValue('custbody_scv_xe_khach_hang');
                let shipaddress = recSalesOrder.getValue('shipaddress');
                let custbody_scv_fr_dt = recSalesOrder.getValue('custbody_scv_fr_dt');
                let custbody_scv_amount_in_word = recSalesOrder.getText('custbody_scv_amount_in_word');

                let diachi;
                if (!shipaddress) {
                    diachi = `${custbody_scv_htvc} ${custbody_scv_xe_khach_hang}`
                } else if (!custbody_scv_xe_khach_hang) {
                    diachi = `${custbody_scv_htvc} ${shipaddress}`
                }

                objRender.addCustomDataSource({
                    format: render.DataSource.OBJECT,
                    alias: 'salesorder',
                    data: {
                        custbody_scv_amount_in_word: custbody_scv_amount_in_word,
                        diachi: diachi,
                        custbody_scv_fr_dt: custbody_scv_fr_dt,
                    }
                });
                return getItemLinesSO(recSalesOrder);
            }
        }

        const addSubsidiaryDataToRenderer = (objRender, recItemFulfillment) => {
            let subsidiaryId = recItemFulfillment.getValue('subsidiary');

            if (subsidiaryId) {
                let lkFieldsSubsidiary = search.lookupFields({
                    type: 'subsidiary',
                    id: subsidiaryId,
                    columns: ['legalname']
                });

                objRender.addCustomDataSource({
                    format: render.DataSource.OBJECT,
                    alias: 'subsidiary',
                    data: {
                        legalname: lkFieldsSubsidiary['legalname'],
                    }
                });
            }
        }

        const addCustomDataToRenderer = (objRender, recItemFulfillment) => {
            let requestBy = recItemFulfillment.getValue('requestedby');

            let lkFieldsRequestByTran = ''
            if (requestBy) {
                lkFieldsRequestByTran = search.lookupFields({
                    type: 'fulfillmentrequest',
                    id: requestBy,
                    columns: ['tranid']
                });
            }

            objRender.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: 'customData',
                data: {
                    //date: formatDate(new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Ho_Chi_Minh"}))),
                    date: formatDate(recItemFulfillment.getValue('trandate')),
                    requestByTranId: lkFieldsRequestByTran['tranid'] || '',
                }
            });
        }

        const addMainRecordToRenderer = (objRender, recItemFulfillment) => {
            objRender.addRecord('recItf', recItemFulfillment);
        }

        const addEmployeeToRenderer = (objRender, recItemFulfillment) => {
            let entityType = getEntityType(recItemFulfillment);
            if (entityType) {
                let lkFieldsEntity = search.lookupFields({
                    type: entityType.toLowerCase(),
                    id: recItemFulfillment.getValue('entity'),
                    columns: ['address', 'phone', 'custentity_scv_legal_name']
                });
                objRender.addCustomDataSource({
                    format: render.DataSource.OBJECT,
                    alias: 'entity',
                    data: {
                        //custentity_scv_contact_name: lkFieldsEntity['custentity_scv_contact_name'],
                        custentity_scv_legal_name: lkFieldsEntity['custentity_scv_legal_name'],
                        address: lkFieldsEntity['address'],
                        phone: lkFieldsEntity['phone']
                    }
                });
            }
        }

        const getEntityType = (recItemFulfillment) => {
            let entityId = recItemFulfillment.getValue('entity');
            return search.lookupFields({
                type: 'entity',
                id: entityId,
                columns: ['type']
            }).type[0]?.text;
        }

        const getItemLinesSO = (recSalesOrder) => {
            let itemLines = [];
            let lineCount = recSalesOrder.getLineCount({sublistId: 'item'});
            for (let i = 0; i < lineCount; i++) {
                let subRecInvDtl = recSalesOrder.getSublistSubrecord('item', 'inventorydetail', i);
                let invDtlLines = subRecInvDtl.getLineCount('inventoryassignment');

                if (invDtlLines > 0) {
                    for (let j = 0; j < invDtlLines; j++) {
                        let itemLine = {
                            item: recSalesOrder.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'item',
                                line: i
                            }),
                            orilineid : recSalesOrder.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_scv_ori_lineid',
                                line: i
                            }),
                            rate: recSalesOrder.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'rate',
                                line: i
                            }),
                            taxrate1: recSalesOrder.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'taxrate1',
                                line: i
                            }),
                            quantity: subRecInvDtl.getSublistValue({
                                sublistId: 'inventoryassignment',
                                fieldId: 'quantity',
                                line: j
                            }),
                            issueinventorynumber: subRecInvDtl.getSublistValue({
                                sublistId: 'inventoryassignment',
                                fieldId: 'issueinventorynumber',
                                line: j
                            }),
                        }
                        itemLines.push(itemLine);
                    }
                }else{
                    let itemLine = {
                        item: recSalesOrder.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            line: i
                        }),
                        orilineid : recSalesOrder.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_scv_ori_lineid',
                            line: i
                        }),
                        rate: recSalesOrder.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'rate',
                            line: i
                        }),
                        taxrate1: recSalesOrder.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'taxrate1',
                            line: i
                        }),
                        quantity: recSalesOrder.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            line: i
                        }),
                    }
                    itemLines.push(itemLine);
                }
            }
            return itemLines;
        }

        const addItemsToRenderer = (objRender, recItemFulfillment, arrItemSo) => {
            let items = [];
            let lineCount = recItemFulfillment.getLineCount({sublistId: 'item'});
            for (let i = 0; i < lineCount; i++) {
                let idLocation = recItemFulfillment.getSublistValue('item', 'location', i);
                let subRecInvDtl = recItemFulfillment.getSublistSubrecord('item', 'inventorydetail', i);
                let invDtlLines = subRecInvDtl.getLineCount('inventoryassignment');
                let idOrderType = recItemFulfillment.getValue('custbody_scv_order_type');
                let displayName;
                let item = recItemFulfillment.getSublistValue('item', 'item', i);
                let isNoLot = String(recItemFulfillment.getSublistValue('item', 'displayname', i)).toLowerCase().includes('không theo dõi tồn kho');
                if(idOrderType === '10' || isNoLot){
                    displayName = recItemFulfillment.getSublistValue('item', 'custcol_scv_memo', i);
                    if(!displayName){
                        displayName = recItemFulfillment.getSublistValue('item', 'description', i);
                    }
                    if(!displayName){
                        if (item) {
                            let lkFItem = search.lookupFields({
                                type: lfunc.getItemRecordType(item),
                                id: item,
                                columns: ['displayname']
                            });
                            if(!displayName) {
                                displayName = lkFItem.displayname;
                            }
                        }
                    }
                }else{
                    if(!displayName){
                        displayName = recItemFulfillment.getSublistValue('item', 'description', i);
                    }
                    if(!displayName){
                        if (item) {
                            let lkFItem = search.lookupFields({
                                type: lfunc.getItemRecordType(item),
                                id: item,
                                columns: ['displayname']
                            });
                            if(!displayName) {
                                displayName = lkFItem.displayname;
                            }
                        }
                    }
                }
                if (invDtlLines > 0) {
                    for (let j = 0; j < invDtlLines; j++) {
                        let lo = '';
                        let idInventory = subRecInvDtl.getSublistValue({
                            sublistId: 'inventoryassignment',
                            fieldId:  'issueinventorynumber',
                            line: j
                        });

                        if(idInventory) {
                            if (idLocation === '175') {
                                let lkFInvDetail = search.lookupFields({
                                    type: 'inventorynumber',
                                    id: idInventory,
                                    columns: ['custitemnumber_scv_item_num_color_seri']
                                });
                                lo = lkFInvDetail.custitemnumber_scv_item_num_color_seri;
                            }else{
                                lo = subRecInvDtl.getSublistText({sublistId: 'inventoryassignment', fieldId: 'issueinventorynumber', line: j});
                            }
                        }

                        let item = {
                            item: recItemFulfillment.getSublistValue('item', 'item', i),
                            orilineid : recItemFulfillment.getSublistValue('item', 'custcol_scv_ori_lineid', i),
                            displayname: displayName,
                            unitsdisplay: recItemFulfillment.getSublistValue({sublistId: 'item', fieldId: 'unitsdisplay', line: i}),
                            quantity: subRecInvDtl.getSublistValue({sublistId: 'inventoryassignment', fieldId: 'quantity', line: j}),
                            issueinventorynumber: idInventory,
                            issueinventorynumberText: lo,
                        }
                        items.push(item);
                    }
                } else {
                    let item = {
                        item: recItemFulfillment.getSublistValue('item', 'item', i),
                        orilineid : recItemFulfillment.getSublistValue('item', 'custcol_scv_ori_lineid', i),
                        displayname: displayName,
                        unitsdisplay: recItemFulfillment.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'unitsdisplay',
                            line: i
                        }),
                        quantity: recItemFulfillment.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            line: i
                        }),
                    }
                    items.push(item);
                }
            }

            let {result, sumThanhTien, sumSoLuong} = getResultItems(items, arrItemSo);

            let currencyCode = recItemFulfillment.getValue('currencycode');

            objRender.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: 'arrItems',
                data: {
                    items: result,
                    sumThanhTien: sumThanhTien,
                    sumSoLuong: sumSoLuong,
                    docThanhTien : lamount.DocTienBangChu(Number(sumThanhTien.toFixed(0)), currencyCode)
                }
            });
        }

        const getResultItems = (items, arrItemSo) => {
            let result = [];
            let sumThanhTien = 0;
            let sumSoLuong = 0;

            result = alasql(`SELECT a.displayname  as displayname,
                                    a.unitsdisplay as unitsdisplay,
                                    a.quantity     as quantity,
                                    a.issueinventorynumberText as issueinventorynumber,
                                    b.rate         as rate,
                                    b.taxrate1    as taxrate1
                             FROM ? as a
                                      LEFT JOIN ? as b
                             ON a.item = b.item
                               AND a.orilineid = b.orilineid
            `, [items, arrItemSo]);

            result.forEach(item => {
                item.dongia = Number(item.rate * (1 + Number(item.taxrate1 / 100))) ;
            });

            result.forEach(item => {
                item.thanhtien = Number(item.quantity) * Number(item.rate * (1 + (item.taxrate1 / 100)));
            });

            sumThanhTien = result.reduce((acc, item) => {
                return acc + Number(Number(item.quantity) * Number(item.rate * (1 + (item.taxrate1 / 100))));
            }, 0);


            sumSoLuong = result.reduce((acc, item) => {
                return acc + Number(item.quantity);
            }, 0);
            return {result, sumThanhTien, sumSoLuong};
        }

        /**
         * Format date to Vietnamese format
         * @param {Date} date
         * @returns {string}
         */

        const formatDate = (date) => {
            let day = date.getDate();
            let month = date.getMonth() + 1;
            let year = date.getFullYear();
            return `ngày ${day} tháng ${month} năm ${year}`;
        }

        const formatCurrency = (number) => {
            return new Intl.NumberFormat('ja-JP', {
                style: 'currency',
                currency: 'JPY',
                currencyDisplay: "code",
                maximumFractionDigits: 0
            })
                .format(number)
                .replace("JPY", "")
                .trim();
        }

        return {onRequest}

    });
