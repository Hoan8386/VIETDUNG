/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record',
        '../common/scv_common_pdf',
        'N/search',
        'N/render',
        '../olib/alasql/alasql.min@1.7.3.js',
        '../common/scv_common_theo_doi_phieu_in'
    ],

    (record, comPdf, search, render, alasql, comTheoDoiPhieuIn) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */

        const ItemGroupLvl1 = {
            NHOM_TAM : 1073
        }

        const ItemGroupLvl2 = {
            AG : 46
        }

        // ===== Gộp ô Yêu cầu đóng hàng (YCĐH) =====
        // KHÔNG đảo thứ tự dòng: giữ nguyên thứ tự và STT như trên record NetSuite.
        // Chỉ gộp các dòng LIỀN KỀ có cùng YCĐH.
        const GROUP_FIELD     = 'requestnote';   // field dùng để so sánh nhóm
        const ROWS_FIRST_PAGE = 20;              // sức chứa TRANG 1, tính theo DÒNG VĂN BẢN (trang 1 có khối header)
        const ROWS_PER_PAGE   = 26;              // sức chứa các trang sau, tính theo DÒNG VĂN BẢN
        const CHARS_PER_LINE  = 26;              // số ký tự lọt 1 dòng ở cột "TÊN HÀNG HÓA - QUY CÁCH"
        // Item tên dài bị wrap sẽ được tính là 2-3 dòng thay vì 1 -> ngắt trang bám sát chiều cao thật.
        // Nếu vẫn vỡ ở biên trang: hạ ROWS_* xuống, hoặc hạ CHARS_PER_LINE nếu chữ wrap sớm hơn dự tính.

        const onRequest = (scriptContext) => {
            let request = scriptContext.request;
            let parameters = request.parameters;
            let objRender = comPdf.initTemplateRender('CUSTTMPL_SCV_LENH_XUAT_HANG');
            let pdfFile = buildFilePdf(objRender, parameters);

            comTheoDoiPhieuIn.createPhieuTheoDoi(parameters.recid, 'CUSTTMPL_SCV_LENH_XUAT_HANG')
            scriptContext.response.writeFile(pdfFile, true);
        }

        const buildFilePdf = (objRender, parameters) => {
            let recMain = record.load({   // hiện tại chỉ còn trên itf
                type: parameters.rectype,
                id: parameters.recid,
            });
            objRender.addRecord('recMain', recMain);
            addItemsToRenderer(objRender, recMain);
            addEntityToRenderer(objRender, recMain, parameters);
            addCustomDataToRenderer(objRender, recMain);

            return objRender.renderAsPdf();
        }

        const addCustomDataToRenderer = (objRender, recFulfillmentReq) => {
            comPdf.addFontVietnamese(objRender);
            comPdf.addImage(objRender, 'Logo-removebg-preview.png');
            let xe = isValid(recFulfillmentReq.getValue('custbody_scv_xe_khach_hang')) ? recFulfillmentReq.getText('custbody_scv_xe_khach_hang') : recFulfillmentReq.getText('custbody_scv_xe');

            let {pheDuyet, nguoiLap} = getChanKy(recFulfillmentReq);
            objRender.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: 'customData',
                data: {
                    printDate: new Date().toLocaleString("en-US", {timeZone: "Asia/Ho_Chi_Minh"}),
                    xe: xe,
                    trandate: formatDate(recFulfillmentReq.getValue('trandate')),
                    custbody_scv_fr_time_delivery: recFulfillmentReq.getValue('custbody_scv_fr_time_delivery'),
                    pheDuyet: pheDuyet,
                    nguoiLap: nguoiLap

                }
            })
        }

        const getChanKy = (recFulfillmentReq) => {
            let lkFieldsChanKy = search.lookupFields({
                type: recFulfillmentReq.type,
                id: recFulfillmentReq.id,
                columns: ['custbody_scv_approver_1.custentity_scv_legal_name', 'custbody_scv_employee_ycxvt.custentity_scv_legal_name']
            });

            let idCreatedFrom = recFulfillmentReq.getValue('createdfrom');

            let lkFieldsCreatedFrom = {};
            if(idCreatedFrom) {
                lkFieldsCreatedFrom = search.lookupFields({
                    type: 'salesorder',
                    id: idCreatedFrom,
                    columns: ['custbody_scv_approver_3.custentity_scv_legal_name', 'custbody_scv_approver_date_3']
                    // columns: ['tranid']
                })

            }

            return {
                // pheDuyet: lkFieldsChanKy['custbody_scv_approver_1.custentity_scv_legal_name'],
                pheDuyet: `${lkFieldsCreatedFrom['custbody_scv_approver_3.custentity_scv_legal_name'] || ''} 
                                      <br/>
                                    ${lkFieldsCreatedFrom['custbody_scv_approver_date_3'] || ''}` ,
                nguoiLap: lkFieldsChanKy['custbody_scv_employee_ycxvt.custentity_scv_legal_name']
            }
        }

        const addItemsToRenderer = (objRender, recMain) => {
            let arrItemsRaw = getItemsMainRecord(recMain);
            let { sumTongSoLuong, arrItems} = processItemsSumAndCost(arrItemsRaw);

            // Giữ nguyên thứ tự dòng như trên record; chỉ tính cờ gộp ô / ngắt trang cho template
            applyPaging(arrItems);

            objRender.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: 'items',
                data: {
                    arrItem: arrItems,
                    sumTongSoLuong: sumTongSoLuong
                }
            });
        }

        /**
         * Chiều cao ước lượng của 1 dòng, tính theo số dòng văn bản mà tên hàng chiếm.
         */
        const getRowCost = (item) => {
            let desc = ((item.itemdescription || '') + '').trim();
            let lines = Math.ceil(desc.length / CHARS_PER_LINE);
            return lines < 1 ? 1 : lines;
        }

        /**
         * Tính showGroup / groupRowspan / pageBreak.
         * LƯU Ý: truyền sang FreeMarker dưới dạng CHUỖI ('Y' / ''), không dùng boolean.
         * Rowspan chỉ đếm trong cùng 1 trang -> ô gộp không vắt ngang trang.
         */
        const applyPaging = (arrItems) => {
            let total = arrItems.length;

            let page = 0;
            let used = 0;

            for (let i = 0; i < total; i++) {
                let item = arrItems[i];
                let cost = getRowCost(item);
                let cap  = (page === 0) ? ROWS_FIRST_PAGE : ROWS_PER_PAGE;

                if (i > 0 && (used + cost) > cap) {
                    page++;
                    used = 0;
                    item.pageBreak = 'Y';
                } else {
                    item.pageBreak = '';
                }

                used += cost;
                item._page = page;
                item._key  = ((item[GROUP_FIELD] || '') + '').trim();
            }

            for (let i = 0; i < total; i++) {
                let item = arrItems[i];

                // YCĐH rỗng: không gộp, mỗi dòng một ô riêng (tránh 1 ô trống cao suốt trang)
                if (item._key === '') {
                    item.showGroup    = 'Y';
                    item.groupRowspan = '1';
                    continue;
                }

                let prev = (i > 0) ? arrItems[i - 1] : null;
                let isNewGroup = (!prev) || prev._key !== item._key || prev._page !== item._page;

                if (!isNewGroup) {
                    item.showGroup    = '';
                    item.groupRowspan = '0';
                    continue;
                }

                item.showGroup = 'Y';

                let span = 1;
                for (let j = i + 1; j < total; j++) {
                    if (arrItems[j]._key === item._key && arrItems[j]._page === item._page) span++;
                    else break;
                }
                item.groupRowspan = span + '';
            }

            return arrItems;
        }

        const addEntityToRenderer = (objRender, recFulfillmentReq, parameters) => {
            let idEntity = recFulfillmentReq.getValue('entity');
            if (idEntity) {
                let entityType = getEntityType(idEntity);

                let lkFieldsEntity = search.lookupFields({
                    type: entityType.toLowerCase(),
                    id: idEntity,
                    columns: ['custentity_scv_legal_name', 'companyname']
                });

                objRender.addCustomDataSource({
                    format: render.DataSource.OBJECT,
                    alias: 'entity',
                    data: {
                        custentity_scv_legal_name: lkFieldsEntity.custentity_scv_legal_name,
                        companyname: lkFieldsEntity.companyname
                    }
                })
            }
        }

        const getItemsMainRecord = (recFulfillmentReq) => {
            let lineItems = recFulfillmentReq.getLineCount({sublistId: 'item'});
            let items = [];

            for (let i = 0; i < lineItems; i++) {
                let itemDescription = recFulfillmentReq.getSublistValue('item', 'description', i) ||
                    recFulfillmentReq.getSublistValue('item', 'displayname', i);

                let objItemLine = {
                    item: recFulfillmentReq.getSublistValue('item', 'item', i),
                    itemdescription: itemDescription,
                    unitsdisplay: recFulfillmentReq.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'unitsdisplay',
                        line: i
                    }),
                    requestnote: recFulfillmentReq.getSublistValue('item', 'custcol_scv_yeu_cau_dong_hang', i),
                    custcol_scv_memo: recFulfillmentReq.getSublistValue('item', 'custcol_scv_memo', i),
                };
                let objLv = getItemLvl(recFulfillmentReq, i);
                let isLvl1NhomTam = objLv.custitem_scv_group_lv1[0]?.value == ItemGroupLvl1.NHOM_TAM;
                let isLvl2Ag = objLv.custitem_scv_group_lv2[0]?.value == ItemGroupLvl2.AG;

                if (isLvl2Ag) {
                    objItemLine.isbold = 'class="bold"'
                }else{
                    objItemLine.isbold = ''
                }
                log.error('objLv', objLv)

                addLineIncludingInv(recFulfillmentReq, items, objItemLine, i, isLvl1NhomTam);
            }

            return items;
        }

        const addLineIncludingInv = (recFulfillmentReq, items, objItemLine, line, isLvl1NhomTam) => {
            let inventoryDetail = recFulfillmentReq.getSublistValue({
                sublistId: 'item',
                fieldId: 'inventorydetail',
                line: line
            });

            if (inventoryDetail) {
                 let subRecInvDetail = recFulfillmentReq.getSublistSubrecord({
                    sublistId: 'item',
                    fieldId: 'inventorydetail',
                    line: line
                 });
                 let lcInvDetail = subRecInvDetail.getLineCount({sublistId: 'inventoryassignment'});
                 for(let j = 0; j < lcInvDetail; j++) {
                    items.push({
                        ...objItemLine,
                        quantity: subRecInvDetail.getSublistValue({
                            sublistId: 'inventoryassignment',
                            fieldId: 'quantity',
                            line: j
                        }),
                        custcol_scv_color_seri:
                            isLvl1NhomTam ?
                                getColorSeri(subRecInvDetail, j) || subRecInvDetail.getSublistText({
                                    sublistId: 'inventoryassignment',
                                    fieldId: 'issueinventorynumber',
                                    line: j
                                }) :
                                subRecInvDetail.getSublistText({
                            sublistId: 'inventoryassignment',
                            fieldId: 'issueinventorynumber',
                            line: j
                        })
                    })
                 }
            } else {
                items.push({
                    ...objItemLine,
                    quantity: recFulfillmentReq.getSublistValue({sublistId: 'item', fieldId: 'quantity', line: line}),
                    custcol_scv_color_seri: ''
                })
            }
        }

        const getItemLvl = (recFulfillmentReq, line) => {
            let idItem =  recFulfillmentReq.getSublistValue('item', 'item', line);
            if(idItem) {
                return search.lookupFields({
                    type: 'item',
                    id: idItem,
                    columns: ['custitem_scv_group_lv1', 'custitem_scv_group_lv2']
                })

                // return lvl == ItemGroupLvl1.NHOM_TAM;
            }
        }

        const getColorSeri = (subRecInvDetail, line) => {
            let idInventory = subRecInvDetail.getSublistValue({
                sublistId: 'inventoryassignment',
                fieldId: 'issueinventorynumber',
                line: line
            });

            if (idInventory) {
                return search.lookupFields({
                    type: 'inventorynumber',
                    id: idInventory,
                    columns: ['custitemnumber_scv_item_num_color_seri']
                }).custitemnumber_scv_item_num_color_seri
            }

            return '';
        }

        const processItemsSumAndCost = (arrItems) => {
            let sumThanhTien = 0;
            let sumTongSoLuong = 0;

            sumTongSoLuong = parseFloat(arrItems.reduce((sum, item) => sum + item.quantity, 0).toFixed(10));

            return {
                // sumThanhTien: sumThanhTien,
                sumTongSoLuong: sumTongSoLuong,
                arrItems: arrItems
            };
        }

        const isValid = (value) => {
            return value !== null && value !== undefined && value !== '';
        }

        const formatDate = (date) => {
            return `Ngày ${date.getDate()} tháng ${(date.getMonth() + 1)} năm ${date.getFullYear()}`;
        }

        const formatTime = (date) => {
            if (!isValid(date) && !(date instanceof Date)   ) {
                return '';
            }
            return `${date.getHours()} giờ ${date.getMinutes()} phút, ngày ${date.getDate()} tháng ${(date.getMonth() + 1)} năm ${date.getFullYear()}`;
        }

        const formatDateTime = (date) => {
            return `${date.getDate()}/${(date.getMonth() + 1)}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
        }

        const getEntityType = (idEntity) => {
            //let entityId = recItemFulfillment.getValue('entity');
            return search.lookupFields({
                type: 'entity',
                id: idEntity,
                columns: ['type']
            }).type[0]?.text;
        }

        return {onRequest}

    });