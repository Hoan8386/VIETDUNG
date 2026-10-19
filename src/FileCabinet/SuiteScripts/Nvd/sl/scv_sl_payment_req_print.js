/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record', 'N/render', 'N/search', '../common/scv_common_pdf','../lib/scv_lib_amount_in_word'],

    (record, render, search, comPdf, libAmount) => {
        let ITEM_ATTRIBUTES = [
            {label: 'Số CT', fieldId: 'custrecord_scv_pay_so_key_code'},
            {label: 'ĐVT', fieldId: 'custrecord_scv_pay_detail_unit_display'},
            {label: 'Số lượng', fieldId: 'custrecord_scv_pay_detail_qty'},
            {label: 'Đơn giá', fieldId: 'custrecord_scv_pay_detail_rate'}
        ];

        const TrangThaiPheDuyet = {
            TU_CHOI_DUYET : '4',
            MOI : '10',
            HUY : '13'
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
                let params = scriptContext.request.parameters;
                log.error('onRequest params', params);
                let templateType = params.templateType;
                let recId = params.recId;
                let rectype = params.rectype;
                let objFile;

                if(rectype === 'custompurchase_scv_purchase_request'){
                    let recPurReq = record.load({
                            type: 'custompurchase_scv_purchase_request',
                            id: recId,
                        });
                    objFile = printycmh('CUSTTMPL_SCV_PUR_REQ_YCMH', recPurReq, templateType);
                }else {
                    let recPayReq = record.load({
                        type: 'customrecord_scv_payment',
                        id: recId,
                    });
                    let custrecord_scv_payment_payment_code = recPayReq.getValue('custrecord_scv_payment_payment_code');

                    let itemFirstLine = recPayReq.getSublistValue('recmachcustrecord_scv_pay', 'custrecord_scv_payment_item', 0);
                    let availableAttributes = []

                    for (let i of ITEM_ATTRIBUTES) {
                        let currentItemValue = recPayReq.getSublistValue('recmachcustrecord_scv_pay', i.fieldId, 0);
                        if (currentItemValue) {
                            availableAttributes.push(i);
                        }
                    }

                    switch (templateType) {
                        case 'DNTT':
                            // if(availableAttributes.length === 0){
                            if (itemFirstLine === '' || itemFirstLine === null || itemFirstLine === undefined) {
                                if(custrecord_scv_payment_payment_code) {
                                    objFile = buildPdfFile(params.templateId, recPayReq, templateType);
                                }else {
                                    objFile = buildPdfFile('CUSTTMPL_SCV_PAY_REQ_DNTT_DV', recPayReq, templateType);
                                }
                            } else {
                                if(custrecord_scv_payment_payment_code) {
                                    objFile = buildPdfFile(params.templateId, recPayReq, templateType);
                                } else {
                                    objFile = buildPdfFile('CUSTTMPL_SCV_PAY_REQ_DNTT_VT', recPayReq, templateType, ITEM_ATTRIBUTES);
                                }
                            }
                            break;
                        case 'DNTƯ':
                            objFile = buildPdfFile('CUSTTMPL_SCV_PAY_REQ_DNTT_TW', recPayReq, templateType);
                            break;
                        case 'DNQT':
                            // if(availableAttributes.length === 0){
                            if (itemFirstLine === '' || itemFirstLine === null || itemFirstLine === undefined) {
                                objFile = buildPdfFile('CUSTTMPL_SCV_PAY_REQ_DNQT_DV', recPayReq, templateType);
                            } else {
                                objFile = buildPdfFile('CUSTTMPL_SCV_PAY_REQ_DNQT_VT', recPayReq, templateType, ITEM_ATTRIBUTES);
                            }
                            break;
                    }
                }

                scriptContext.response.writeFile({
                    file: objFile,
                    isInline: true,
                });
            }
        }

        const buildPdfFile = (templateId, rec, templateType, itemsAttributes = []) => {
            let objRender = render.create();

            objRender.setTemplateByScriptId(templateId);

            addPaymentPo(objRender, rec);
            let employeeId = rec.getValue('custrecord_scv_payment_ngycau')

            let lkFieldsEmployee = search.lookupFields({
                type: 'employee',
                id: employeeId,
                columns: ['firstname', 'lastname', 'middlename', 'custentity_scv_position_st']
            });

            let lkFieldsSubsidiary = search.lookupFields({
                type: 'subsidiary',
                id: rec.getValue('custrecord_scv_payment_subsidiary'),
                columns: ['custrecord_scv_sub_ktt', 'custrecord_scv_ten_giam_doc', 'legalname']
            });

            addNguoiNhan(objRender, rec);
            let items = getItemsData(rec, itemsAttributes);

            objRender.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: 'items',
                data: {
                    items: items
                }
            })

            let baoNoPhieuChi = getBaoNoPhieuChi(rec);
            let sum = getSumCostItems(rec);
            let date = formatDate(rec.getValue('custrecord_scv_payment_date'));
            let isTienMat = checkTienMat(rec);
            let isChuyenKhoan = checkChuyenKhoan(rec)
            let bankDataTvt = getBankData(rec) || '';
            let chiNhanh = rec.getValue('custrecord_scv_payment_bankbranch') ? ` - ${rec.getText('custrecord_scv_payment_bankbranch')}` : '';
            comPdf.addImage(objRender, 'Logo-removebg-preview.png');
            let entityCreatedFrom = getCreatedFrom(rec);
            let createdFromEntity = entityCreatedFrom.entity[0]?.text || '';
            let daKy = getDaKy(rec);
            let headerChanKyCotThu4 = getHeaderChanKyCotThu4(rec);
            let currency = rec.getText('custrecord_scv_payment_currency');
            let paymentMethod = rec.getValue('custrecord_scv_payment_type');
            let soTienDaTamUngDnqt = rec.getValue('custrecord_scv_payment_advance') ?
                rec.getValue('custrecord_scv_payment_advance') :
                entityCreatedFrom?.custbody_scv_emp_remaining_amt || 0
            ;
            let soTienDaTamUngDntu = entityCreatedFrom.custbody_scv_emp_check_amt ?
                entityCreatedFrom.custbody_scv_emp_check_amt : rec.getValue('custrecord_scv_payment_emp_check');
            let tongTien = (templateType === 'DNTƯ' || templateType === 'DNQT') ?
                (Number(sum) + rec.getValue('custrecord_scv_payment_amounttax') - rec.getValue('custrecord_scv_payr_discount_amt')) :
                (Number(sum) + Number(rec.getValue('custrecord_scv_payment_amounttax')));
            let conLaiDnqt = soTienDaTamUngDnqt - tongTien
                // + rec.getValue('custrecord_scv_payr_discount_amt')
            // ;
            let conLaiDntu = tongTien - soTienDaTamUngDntu;
            let soTienDaThanhToanDnttDv2 = calSoTienDaThanhToanDnttDv2(rec);

            objRender.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: 'additionalData',
                data: {
                    baoNoPhieuChi : baoNoPhieuChi,
                    employee: {
                        name: lkFieldsEmployee.firstname + ' ' + lkFieldsEmployee.lastname,
                        chucvu: lkFieldsEmployee.custentity_scv_position_st[0]?.text,
                    },
                    vat: formatCurrency(rec.getValue('custrecord_scv_payment_amounttax') ? rec.getValue('custrecord_scv_payment_amounttax') : 0, currency),
                    tongcong: formatCurrency(sum, currency) ,
                    tongtien: formatCurrency(tongTien, currency) ,
                    // bangchu : comPdf.convertAmountToWords(tongTien),
                    bangchu : libAmount.DocTienBangChu(tongTien, currency),
                    isTienMat: paymentMethod === '10' ? false : isTienMat,
                    isNotTienMat: paymentMethod === '10' ? false : !isTienMat,
                    isChuyenKhoan: isChuyenKhoan,
                    subsidiary: {
                        custrecord_scv_sub_ktt: lkFieldsSubsidiary.custrecord_scv_sub_ktt,
                        custrecord_scv_ten_giam_doc: headerChanKyCotThu4 === 'Phê duyệt' ? '' : lkFieldsSubsidiary.custrecord_scv_ten_giam_doc,
                        legalname: lkFieldsSubsidiary.legalname,
                    },
                    custrecord_scv_payment_po: rec.getValue('custrecord_scv_payment_po'),
                    custrecord_scv_createdfrom_pr: rec.getValue('custrecord_scv_createdfrom_pr'),
                    createdFromEntity: createdFromEntity,
                    payment_date: date,
                    itemsAttributes: itemsAttributes,
                    currency: currency,
                    bankTvt: `${bankDataTvt}${chiNhanh}`,
                    conLai: formatCurrency(tongTien - Number(rec.getValue('custrecord_scv_payment_vendor_prepayment')), currency) ,
                    conLaiDntt: formatCurrency(rec.getValue('custrecord_scv_payment_amount') - Number(rec.getValue('custrecord_scv_payment_vendor_prepayment')), currency) ,
                    conLaiDnqt : conLaiDnqt,
                    daKy: daKy,
                    soTienDaTamUng: soTienDaTamUngDnqt,
                    soTienDaTamUngDntu : soTienDaTamUngDntu,
                    headerChanKyCotThu4,
                    conLaiDntu,
                    soTienDaThanhToanDnttDv2,
                    conLaiDntt2 : formatCurrency(rec.getValue('custrecord_scv_payment_amount')
                                                                               - Number(rec.getValue('custrecord_scv_payment_vendor_prepayment')
                                                                                // + Number(soTienDaThanhToanDnttDv2)
                        ), currency) ,
                }
            })

            objRender.addRecord({
                templateName: 'record',
                record: rec,
            });

            comPdf.addFontVietnamese(objRender);

            return objRender.renderAsPdf();
        }

        const addPaymentPo = (objRender, rec) => {
            let idPo = rec.getValue('custrecord_scv_payment_po')
            let lkFieldsPaymentPo = {entity: ''};
            if(idPo) {
                let tranType = search.lookupFields({
                    type: 'transaction',
                    id: idPo,
                    columns: ['recordtype']
                });

                if(tranType?.recordtype) {
                    lkFieldsPaymentPo = search.lookupFields({
                        type: tranType.recordtype,
                        id: idPo,
                        columns: ['entity']
                    });
                }
            }

            objRender.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: 'paymentPo',
                data: {
                    poEntity: lkFieldsPaymentPo?.entity[0]?.text || '',
                }
            });
        }

        const calSoTienDaThanhToanDnttDv2 = (rec) => {
            let idInbound = rec.getValue('custrecord_scv_payr_inbound');
            if (idInbound) {
                let recInbound = record.load({
                    type: 'inboundshipment',
                    id: idInbound
                })
                let amtPayed = Number(recInbound.getValue('custrecord_scv_inb_sum_amt_payed')) || 0;
                // let amountPay = Number(recInbound.getValue('custrecord_scv_inb_amount_pay')) || 0;
                return amtPayed;
            } else {
                let prepayAmt = Number(rec.getValue('custrecord_scv_payment_amt_prepay')) || 0;
                let amountPay = Number(rec.getValue('custrecord_scv_payment_amount_pay')) || 0;
                return prepayAmt + amountPay;
            }
        }

        const printycmh = (templateId, rec, templateType, itemsAttributes = []) => {
            const sanitizeKey = (str) =>
                str
                    .toUpperCase()
                    .replace(/[^A-Z0-9]/g, '_') // chỉ dùng cho key
                    .replace(/^_+|_+$/g, '')
                    .replace(/_+/g, '_');

            let objRender = render.create();
            objRender.setTemplateByScriptId(templateId);

            let listitem = 'item';
            let groupedItems = {};
            let allVendorsSet = new Set();
            let vendorTotals = {};
            let grandTotal = 0;

            for (let i = 0; i < rec.getLineCount(listitem); i++) {
                let isCanceled = rec.getSublistValue({
                    sublistId: listitem,
                    fieldId: 'custcol_scv_cancel',
                    line: i
                });

                if (isCanceled === false) {

                    let maHang = rec.getSublistValue({
                        sublistId: listitem,
                        fieldId: 'custcol_scv_tc_item_code',
                        line: i
                    }) || '';

                    let mota = rec.getSublistText({
                            sublistId: listitem,
                            fieldId: 'custcol_scv_po_properties',
                            line: i
                        })

                    let itemId = rec.getSublistValue({sublistId: listitem, fieldId: 'item', line: i});
                    let itemLookup = search.lookupFields({
                        type: 'item',
                        id: itemId,
                        columns: ['displayname']
                    });

                    let displayName = itemLookup.displayname;

                    // Lấy thông tin vendor
                    let vendorId = rec.getSublistValue({
                        sublistId: listitem,
                        fieldId: 'custcol_scv_vendor',
                        line: i
                    });

                    let vendorQty = parseFloat(rec.getSublistValue({
                        sublistId: listitem,
                        fieldId: 'custcol_scv_plan_approve_qty',
                        line: i
                    })) || 0;

                    // 🔍 Tạo khóa để xác định xem có gộp hay không
                    let shouldGroup = vendorId && vendorQty > 0 && maHang.trim() !== '';
                    let uniqueKey = shouldGroup ? (`${maHang}_${mota}`) : `LINE_${i}`; // không gộp nếu không có vendor hoặc mã hàng

                    if (!groupedItems[uniqueKey]) {
                        groupedItems[uniqueKey] = {
                            item: rec.getSublistText({sublistId: listitem, fieldId: 'item', line: i}),
                            ma_hang: maHang,
                            uom: rec.getSublistValue({sublistId: listitem, fieldId: 'units_display', line: i}),
                            mo_ta: rec.getSublistText({
                                sublistId: listitem,
                                fieldId: 'custcol_scv_po_properties',
                                line: i
                            }),
                            class: rec.getSublistText({sublistId: listitem, fieldId: 'class_display', line: i}),
                            classification: rec.getSublistText({
                                sublistId: listitem,
                                fieldId: 'custcol_scv_acceptance_classification',
                                line: i
                            }),
                            market_number: rec.getSublistValue({
                                sublistId: listitem,
                                fieldId: 'custcol_scv_market_number',
                                line: i
                            }),
                            required_date: rec.getSublistText({
                                sublistId: listitem,
                                fieldId: 'custcol_scv_required_date',
                                line: i
                            }),
                            purpose: rec.getSublistValue({
                                sublistId: listitem,
                                fieldId: 'custcol_scv_pr_purpose',
                                line: i
                            }),
                            memo: rec.getSublistText({sublistId: listitem, fieldId: 'custcol_scv_memo', line: i}),
                            vendors: [],
                            totalQuantity: 0,
                            displayname: displayName,
                        };
                    }

                    // Nếu có vendor thì xử lý phân bổ theo nhà cung cấp
                    if (shouldGroup) {
                        let lkFieldsVendor = search.lookupFields({
                            type: 'vendor',
                            id: vendorId,
                            columns: ['custentity_scv_vendor_abbreviation', 'companyname']
                        })
                        // let vendorRecord = record.load({
                        //     type: record.Type.VENDOR,
                        //     id: vendorId
                        // });

                        // let vendorCode = vendorRecord.getText({ fieldId: 'custentity_scv_vendor_abbreviation' }) || vendorRecord.getText({ fieldId: 'companyname' });
                        let vendorCode = lkFieldsVendor.custentity_scv_vendor_abbreviation || lkFieldsVendor.companyname || '';

                        let safeVendorCode = sanitizeKey(vendorCode);

                        let existingVendor = groupedItems[uniqueKey].vendors.find(v => v.code === safeVendorCode);
                        if (existingVendor) {
                            existingVendor.quantity += vendorQty;
                        } else {
                            groupedItems[uniqueKey].vendors.push({
                                code: safeVendorCode,
                                display_name: vendorCode,
                                quantity: vendorQty
                            });
                        }

                        if (!vendorTotals[safeVendorCode]) {
                            vendorTotals[safeVendorCode] = 0;
                        }
                        vendorTotals[safeVendorCode] += vendorQty;

                        groupedItems[uniqueKey].totalQuantity += vendorQty;
                        allVendorsSet.add(safeVendorCode);
                    } else {
                        // Nếu không có vendor thì coi như không phân bổ, chỉ cộng số lượng vào dòng
                        groupedItems[uniqueKey].totalQuantity += vendorQty;
                    }
                }
            }


            itemsAttributes = Object.values(groupedItems);
            grandTotal = itemsAttributes.reduce((acc, item) => acc + item.totalQuantity, 0);
            const allVendors = Array.from(allVendorsSet);
            objRender.addRecord('record', rec);
            comPdf.addImage(objRender, 'Logo-removebg-preview.png');

            const jsonData = {
                itemsAttributes,
                allVendors,
                vendorTotals,
                grandTotal
            };

            // tự escape các ký tự đặc biệt trong XML (chủ yếu là dấu &)
            itemsAttributes.forEach(s => {
                s.item = escapeXML(s.item);
                s.mo_ta = escapeXML(s.mo_ta);
                s.class = escapeXML(s.class);
                s.classification = escapeXML(s.classification);
                s.purpose = escapeXML(s.purpose);
                s.memo = escapeXML(s.memo);
            })
            log.error('itemAttributes', JSON.stringify(itemsAttributes));
            log.error('allVendors', JSON.stringify(allVendors));
            log.error('vendorTotals', JSON.stringify(vendorTotals));
            log.error('grandTotal', JSON.stringify(grandTotal));

            objRender.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: "jsonData",
                data: {
                    itemsAttributes,
                    allVendors,
                    vendorTotals,
                    grandTotal
                }
            });
            comPdf.addFontVietnamese(objRender); // để hỗ trợ tiếng Việt đầy đủ
            return objRender.renderAsPdf();
        };



        const getBaoNoPhieuChi = (rec) => {
            let baoNoPhieuChi = rec.getText('custrecord_scv_payment_related');
            if (baoNoPhieuChi) {
                baoNoPhieuChi = baoNoPhieuChi.map( s => s.split('#')[1]).join('; ');
                return baoNoPhieuChi;
            }
            return '';
        }

        const getHeaderChanKyCotThu4 = (rec) => {
            return 'Phê duyệt';
            // logic cũ, để đây đề phòng thay đổi
            // let idSub = rec.getValue('custrecord_scv_payment_subsidiary');
            // if (idSub) {
            //     if (idSub === '2') {
            //         return 'Phê duyệt';
            //     } else {
            //         return 'TGĐ/TTGĐ';
            //     }
            // }
        }

        const addNguoiNhan = (objRender, rec) => {
            let idNguoiNhan = rec.getValue('custrecord_scv_paymen_payee') || rec.getValue('custrecord_scv_payment_entity');
            if (idNguoiNhan) {
                let entityType = getEntityType(idNguoiNhan).toLowerCase();
                let lkFieldsNguoiNhan = search.lookupFields({
                    type: entityType,
                    id: idNguoiNhan,
                    columns: entityType === 'employee' ? ['custentity_scv_legal_name', 'department'] : ['custentity_scv_legal_name']
                });
                objRender.addCustomDataSource({
                    format: render.DataSource.OBJECT,
                    alias: 'objNguoiNhan',
                    data: {
                        custentity_scv_legal_name: lkFieldsNguoiNhan.custentity_scv_legal_name,
                        department: lkFieldsNguoiNhan.department ? lkFieldsNguoiNhan.department[0]?.text : '',
                    }
                });
            }
        }

        const getDaKy = (rec) => {
            let daKyValue = rec.getValue('custrecord_scv_payment_status');

            if (daKyValue !== TrangThaiPheDuyet.MOI &&
                daKyValue !== TrangThaiPheDuyet.HUY &&
                daKyValue !== TrangThaiPheDuyet.TU_CHOI_DUYET) {
                return '(Đã ký)';
            } else {
                return '';
            }
        }

        const getBankData = (rec) => {
            let idBank = rec.getValue('custrecord_scv_payment_bankname');
            if (idBank) {
                return search.lookupFields({
                    type: 'customrecord_scv_beb_bank_name',
                    id: idBank,
                    columns: ['custrecord_scv_bank_tvt']
                }).custrecord_scv_bank_tvt;
            }
        }

        const getCreatedFrom = (rec) => {
            let idCreatedFrom = rec.getValue('custrecord_scv_createdfrom_pr');
            if (idCreatedFrom) {
                return search.lookupFields({
                    type: 'transaction',
                    id: idCreatedFrom,
                    columns: ['entity', 'custbody_scv_emp_remaining_amt', 'custbody_scv_emp_check_amt']
                });
            }else{
                return {
                    entity: [],
                }
            }
        }

        const getItemsData = (rec, itemsAttributes) => {
            let itemLines = rec.getLineCount('recmachcustrecord_scv_pay')
            let items = [];
            let currency = rec.getText('custrecord_scv_payment_currency');

            if (itemLines > 0) {
                for (let i = 0; i < itemLines; i++) {
                    let paymentItemLineId = rec.getSublistValue('recmachcustrecord_scv_pay', 'id', i);
                    if (paymentItemLineId) {
                        let itemLineData = {};

                        let itemId = rec.getSublistValue('recmachcustrecord_scv_pay', 'custrecord_scv_payment_item', i);
                        if (itemId) {
                            let lkFieldsItem = search.lookupFields({
                                type: 'item',
                                id: itemId,
                                columns: ['upccode', 'displayname']
                            });

                            itemLineData.upccode = lkFieldsItem.upccode;
                            itemLineData.displayname = lkFieldsItem.displayname;
                        }
                        itemLineData.custrecord_scv_pay_detail_des = rec.getSublistValue('recmachcustrecord_scv_pay', 'custrecord_scv_pay_detail_des', i) ?? rec.getValue('custrecord_scv_payment_memo');
                        itemLineData.custrecord_scv_pay_detail_specification = rec.getSublistValue('recmachcustrecord_scv_pay', 'custrecord_scv_pay_detail_specification', i);
                        itemLineData.custrecord_scv_pay_detail_amt = formatCurrency(rec.getSublistValue('recmachcustrecord_scv_pay', 'custrecord_scv_pay_detail_amt', i) ?? rec.getValue('custrecord_scv_payment_amount'), currency);

                        itemLineData.note = rec.getSublistValue('recmachcustrecord_scv_pay', 'custrecord_scv_pay_detail_note', i)
                            ? rec.getSublistValue('recmachcustrecord_scv_pay', 'custrecord_scv_pay_detail_note', i)
                            : rec.getSublistValue('recmachcustrecord_scv_pay', 'custrecord_scv_payment_note', i);

                        itemLines.note = itemLines.note ? itemLines.note : rec.getValue('custrecord_scv_payment_note');

                        if (itemsAttributes && itemsAttributes.length > 0) {
                            itemLineData.itemsAttributes = []
                            for (let j = 0; j < ITEM_ATTRIBUTES.length; j++) {
                                let attributeValue = rec.getSublistValue('recmachcustrecord_scv_pay', ITEM_ATTRIBUTES[j].fieldId, i)
                                let attrText = rec.getSublistText('recmachcustrecord_scv_pay', ITEM_ATTRIBUTES[j].fieldId, i);

                                if(ITEM_ATTRIBUTES[j].label === 'Số CT') {
                                    itemLineData.itemsAttributes.push({attr: attrText.split('#')[1], attrName : ITEM_ATTRIBUTES[j].label});
                                }else {
                                    itemLineData.itemsAttributes.push({attr: attributeValue, attrName : ITEM_ATTRIBUTES[j].label});
                                }
                            }
                        }
                        items.push(itemLineData);
                    }
                }
            } else {
                items.push({
                    custrecord_scv_pay_detail_des: rec.getValue('custrecord_scv_payment_memo'),
                    custrecord_scv_pay_detail_amt: formatCurrency(rec.getValue('custrecord_scv_payment_amount'), currency),
                    note: rec.getValue('custrecord_scv_payment_note')
                });
            }
            return items;
        }

        const checkTienMat = (rec) => {
            let paymentMethod = rec.getValue('custrecord_scv_payment_method');
            return paymentMethod === '8'; // tiền mặt
        }

        const checkChuyenKhoan = (rec) => {
            let paymentMethod = rec.getValue('custrecord_scv_payment_method');
            return paymentMethod === '1' || paymentMethod === '11' ; // chuyển khoản
        }

        const getSumCostItems = (rec) => {
            let lines = rec.getLineCount('recmachcustrecord_scv_pay');
            let sum = 0;
            if (lines > 0) {
                for (let i = 0; i < lines; i++) {
                    sum += Number(rec.getSublistValue('recmachcustrecord_scv_pay', 'custrecord_scv_pay_detail_amt', i)) || 0;
                }
            } else {
                sum = Number(rec.getValue('custrecord_scv_payment_amount')) || 0;
            }

            return sum;
        }

        const formatDate = (date) => {
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `Ngày ${day} tháng ${month} năm ${year}`;
        }

        const formatCurrency = (number, currency = 'VND') => {
            return new Intl.NumberFormat('ja-JP', {
                style: 'currency',
                currency: 'JPY',
                currencyDisplay: "code",
                maximumFractionDigits: currency === 'VND' ? 0 : 2
            })
                .format(number)
                .replace("JPY", "")
                .trim();
        }

        const getEntityType = (entityId) => {
            return search.lookupFields({
                type: 'entity',
                id: entityId,
                columns: ['type']
            }).type[0]?.text;
        }

        const escapeXML = (value) => {
            if (!value) return '';
            return value.replace(/&(?![a-zA-Z]+;|#\d+;)/g, '&amp;');
        }

        return {onRequest}

    });
