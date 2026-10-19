define(
    ['../lib/scv_lib_function', 'N/record', 'N/search', 'N/runtime', '../cons/scv_cons_payreq.js', 'N/cache', 'N/format', 'N/currency'],
    function (libFn, record, search, runtime, ConsPayReq, cache, format, currency) {
        const validInitializeData = (objParams) => {
            if (!libFn.isContainValue(objParams)) return null;
            let rectype = objParams.createFromType;
            let recid = objParams.createFromId;
            let btnid = objParams.btnid;
            if (!rectype || !recid || !btnid) return null;
            return true;
        };

        const initializeDataPaymentRequest = (curRec, objParams) => {
            initializeDataTaxCode();
            if (!validInitializeData(objParams)) return null;
            if (objParams.createFromType === record.Type.PURCHASE_ORDER) {
                setDataPaymentCreateFromPO(curRec, objParams);
            } else if (objParams.createFromType === ConsPayReq.CustomRecordType.PAYMENT_REQUEST) {
                setDataPaymentRequestCreateFromAnotherPayReq(curRec, objParams);
            } else if (objParams.createFromType === record.Type.INBOUND_SHIPMENT) {
                setDataPaymentRequestCreateFromInboundShipment(curRec, objParams);
            }
        };

        const setDataPaymentRequestCreateFromAnotherPayReq = (curRec, objParams) => {
            if (objParams.btnid === ConsPayReq.CustomButtonId.QUYET_TOAN) {
                setDataPaymentRequestQuyetToan(curRec, objParams);
            }
        };

        const setDataPaymentRequestQuyetToan = (curRec, objParams) => {
            let payReqId = objParams.createFromId;
            let objDataPayReq = fetchDataBodyPaymentRequest(payReqId);
            const requestorId = objDataPayReq.custrecord_scv_payment_ngycau;
            let depRequestor = '';
            if (requestorId) {
                depRequestor = search.lookupFields({
                    type: libFn.getEntityType(requestorId),
                    id: requestorId,
                    columns: ['department']
                }).department?.[0].value || '';
            }
            const empRemain = objDataPayReq.custrecord_scv_payment_emp_remain;
            const exchangeRate = objDataPayReq.custrecord_scv_payment_exchangerate;
            const amount = objDataPayReq.custrecord_scv_payment_amount;
            const empId = getEmployeeIDCreator();
            libFn.setValueData(curRec, [
                'custrecord_scv_payment_type',
                'custrecord_scv_payment_entity',
                'custrecord_scv_payment_subsidiary',
                'custrecord_scv_payment_currency',
                'custrecord_scv_payment_exchangerate',
                'custrecord_scv_payment_ngycau',
                'custrecord_scv_payment_date',
                'custrecord_scv_payment_department',
                'custrecord_scv_payment_advanced_reques',
                'custrecord_scv_payment_advanc'
            ], [
                ConsPayReq.CustomPaymentTypeId.HOAN_UNG_NHAN_VIEN,
                objDataPayReq.custrecord_scv_payment_entity,
                objDataPayReq.custrecord_scv_payment_subsidiary,
                objDataPayReq.custrecord_scv_payment_currency,
                objDataPayReq.custrecord_scv_payment_exchangerate,
                empId,
                new Date(),
                depRequestor,
                payReqId,
                empRemain
            ]);
            setDataSession(ConsPayReq.CustomKeySession.PAYMENT_REQUEST, {
                amount: amount,
                exchangeRate,
            });
        };

        const setDataPaymentCreateFromPO = (curRec, objParams) => {
            if (objParams.btnid === ConsPayReq.CustomButtonId.DNTT) {
                setDataPaymentCreateFromPODNTT(curRec, objParams);
            } else if (objParams.btnid === ConsPayReq.CustomButtonId.DNTU) {
                setDataPaymentCreateFromPODNTU(curRec, objParams);
            }
        };

        const setDataPaymentRequestCreateFromInboundShipment = (curRec, objParams) => {
            if (objParams.btnid === ConsPayReq.CustomButtonId.DNTT_FROM_IB) {
                setDataPaymentCreateFromInboundShipmentDNTT(curRec, objParams);
            }
        };

        const initializeDataTransCreateFromPaymentRequest = (curRec, objParams) => {
            if (!validInitializeData(objParams)) return null;
            if (objParams.createFromType !== ConsPayReq.CustomRecordType.PAYMENT_REQUEST) return;
            initializeDataTaxCode();
            switch (curRec.type) {
                case record.Type.VENDOR_PREPAYMENT:
                    setDataVendorPrepaymentFromPaymentRequest(curRec, objParams);
                    break;
                case record.Type.VENDOR_BILL:
                    setDataBillFromPaymentRequest(curRec, objParams);
                    // setDataBillFromPaymentRequestTransform(curRec, objParams);
                    break;
                case record.Type.EXPENSE_REPORT:
                    setDataExpenseReportFromPaymentRequest(curRec, objParams);
                    break;
                case ConsPayReq.CustomRecordType.LC_WRITE_CHECK:
                    setDataWriteCheckFromPaymentRequestTUNV(curRec, objParams);
                    setDataWriteCheckFromPaymentRequestChiKhac(curRec, objParams);
                    break;
                case record.Type.CREDIT_MEMO:
                    setDataCreditMemoFromPaymentRequest(curRec, objParams);
                    break;
                case record.Type.DEPOSIT:
                    setDataDepositFromPaymentRequest(curRec, objParams);
                    break;
                case record.Type.VENDOR_PAYMENT:
                    setDataBillPaymentFromPaymentRequest(curRec, objParams);
                    break;
                case record.Type.VENDOR_CREDIT:
                    setDataBillCreditFromPaymentRequest(curRec, objParams);
                    break;
                case record.Type.JOURNAL_ENTRY:
                    setDataJournalEntryFromPaymentRequest(curRec, objParams);
                    break;
                case record.Type.CUSTOMER_REFUND:
                    setDataCustomerRefundFromPaymentRequest(curRec, objParams);
                    break;
            }
        };

        //2.1 Tạo Payment Request từ PO (Tạm ứng NCC)
        const setDataPaymentCreateFromPODNTT = (curRec, objParams) => {
            let poId = objParams.createFromId;
            let objDataPO = fetchDataSourcePurOrd(poId);
            // bỏ chuyển đổi tiền theo tỉ giá - Hiệu
            const factorRound = objDataPO.currency === '1' || !objDataPO.currency ? 0 : 2;
            // const exchangeRate = objDataPO.exchangerate * 1 || 1;
            const exchangeRate = 1;
            const amountOrigin = objDataPO.total * 1;
            const amount = roundNumber(amountOrigin / exchangeRate, factorRound);
            const empId = objParams.empid;
            const depEmpId = getDepartmentInEmployee(empId);
            libFn.setValueData(curRec, [
                'custrecord_scv_payment_type',
                'custrecord_scv_payment_ngycau',
                'custrecord_scv_payment_department',
                'custrecord_scv_payment_entity',
                'custrecord_scv_payment_subsidiary',
                'custrecord_scv_payment_currency',
                'custrecord_scv_payment_exchangerate',
                'custrecord_scv_payment_memo',
                'custrecord_scv_payr_project',
                'custrecord_scv_payment_amount',
                'custrecord_scv_payment_po',
                'custrecord_scv_payr_po_amt',
                'custrecord_scv_createdfrom_pr',
                'custrecord_scv_payment_payee'
            ], [
                ConsPayReq.CustomPaymentTypeId.TAM_UNG_NCC,
                empId,
                depEmpId,
                objDataPO.entity,
                objDataPO.subsidiary,
                objDataPO.currency,
                exchangeRate,
                objDataPO.memo,
                objDataPO.cseg_scv_sg_proj,
                amount,
                poId,
                amount,
                poId,
                objDataPO.entity,
            ]);
            setDataSession(ConsPayReq.CustomKeySession.PAYMENT_REQUEST, {
                amount: amount,
                exchangeRate,
            });
            // curRec.setValue('custrecord_scv_payment_exchangerate', exchangeRate);
        };
        //2.2 Tạo Payment Request từ PO ( Tạm ứng NV)
        const setDataPaymentCreateFromPODNTU = (curRec, objParams) => {
            let poId = objParams.createFromId;
            let objDataPO = fetchDataSourcePurOrd(poId);
            const empId = objParams.empid;
            const creatorId = getEmployeeIDCreator();
            const depEmpId = getDepartmentInEmployee(empId);
            libFn.setValueData(curRec, [
                'custrecord_scv_payment_type',
                'custrecord_scv_payment_ngycau',
                'custrecord_scv_payment_department',
                'custrecord_scv_payment_entity',
                'custrecord_scv_payment_subsidiary',
                'custrecord_scv_payment_currency',
                'custrecord_scv_payment_exchangerate',
                'custrecord_scv_payment_memo',
                'custrecord_scv_payr_project',
                'custrecord_scv_payment_amount',
                'custrecord_scv_payment_po',
                'custrecord_scv_payr_po_amt',
                'custrecord_scv_createdfrom_pr',
                'custrecord_scv_payment_payee',
            ], [
                ConsPayReq.CustomPaymentTypeId.TAM_UNG_NV_DI_MUA_HANG,
                creatorId,
                depEmpId,
                creatorId,
                objDataPO.subsidiary,
                objDataPO.currency,
                objDataPO.exchangerate,
                objDataPO.memo,
                objDataPO.cseg_scv_sg_proj,
                objDataPO.custbody_scv_remaining_po,
                poId,
                objDataPO.total,
                poId,
                objDataPO.entity,
            ]);
        };
        //2.3 Tạo Payment Request từ Inbound ( Tạm ứng NCC Nhập khẩu) (PENDING_DO INBOUND TẠO TỪ NHIỀU PO)
        const setDataPaymentCreateFromInboundShipmentDNTT = (curRec, objParams) => {
            let inboundShipmentId = objParams.createFromId;
            let exchangeRate = 1;
            let currencyId = objParams.currencyid;
            if (currencyId) {
                let symbol = search.lookupFields({type: 'currency', id: currencyId, columns: ['symbol']}).symbol;
                exchangeRate = currency.exchangeRate({source: symbol, target: 'VND', date: new Date()});
            }
            libFn.setValueData(curRec, [
                'custrecord_scv_payment_type',
                'custrecord_scv_payment_entity',
                'custrecord_scv_payment_payee',
                'custrecord_scv_payment_currency',
                'custrecord_scv_payment_amount',
                'custrecord_scv_payr_inbound',
                'custrecord_scv_payment_exchangerate',
                'custrecord_scv_payment_payment_code',
                'custrecord_scv_payment_subsidiary'
            ], [
                ConsPayReq.CustomPaymentTypeId.TAM_UNG_NCC,
                objParams.vendorid,
                objParams.vendorid,
                currencyId,
                objParams.pay_amt,
                inboundShipmentId,
                exchangeRate,
                objParams.payment_code,
                objParams.idSub
            ]);
            setDataSession(ConsPayReq.CustomKeySession.PAYMENT_REQUEST, {
                exchangeRate,
            });
        };

        //2.4 Tạo Chứng từ Vendor prepayment từ Payment request
        const setDataVendorPrepaymentFromPaymentRequest = (curRec, objParams) => {
            let {createFromId, btnid} = objParams;
            if (btnid !== ConsPayReq.CustomButtonId.VENDOR_PREPAYMENT) return;
            const idPayReq = createFromId;
            const objPayReq = fetchDataBodyPaymentRequest(idPayReq);
            log.error('objPayReq', objPayReq);
            let subId = objPayReq.custrecord_scv_payment_subsidiary;
            let accountId = fetchAccountId({subsidiary: subId, typeBank: 'Bank'});
            const objDataSub = fetchDataSubsidiary(subId);
            const vendorPrepaymentAccountId = objDataSub.vendorprepaymentaccount || '';
            libFn.setValueData(curRec, [
                    'entity',
                    'subsidiary',
                    'account',
                    'currency',
                    'exchangerate',
                    'memo',
                    'cseg_scv_sg_proj',
                    'payment',
                    'purchaseorder',
                    'department',
                    'custbody_scv_payment_number',
                    'custbody_scv_beneficiary_bank',
                    'custbody_scv_beneficiary',
                    'custbody_scv_bankaccount',
                    'custbody_scv_bankbranch',
                    'custbody_scv_bankname',
                    'custbody_scv_payee',
                    'prepaymentaccount',
                    'custbody_scv_pr_amount_paid',
                    'custbody_scv_matt_xnk',
                     'custbody_scv_beneficiary_entity'
                ],
                [
                    objPayReq.custrecord_scv_payment_entity,
                    objPayReq.custrecord_scv_payment_subsidiary,
                    accountId,
                    objPayReq.custrecord_scv_payment_currency,
                    objPayReq.custrecord_scv_payment_exchangerate,
                    objPayReq.custrecord_scv_payment_memo,
                    objPayReq.custrecord_scv_payr_project,
                    objPayReq.custrecord_scv_payreq_remaining_amt,
                    objPayReq.custrecord_scv_payment_po,
                    objPayReq.custrecord_scv_payment_department,
                    [idPayReq],
                    objPayReq.custrecord_scv_payment_beneficiary,
                    objPayReq.custrecord_scv_payment_nguoi_thu_huong,
                    objPayReq.custrecord_scv_payment_bankaccount,
                    objPayReq.custrecord_scv_payment_bankbranch,
                    objPayReq.custrecord_scv_payment_bankname_display,
                    objPayReq.custrecord_scv_payment_entity,
                    vendorPrepaymentAccountId,
                    objPayReq.custrecord_scv_payreq_remaining_amt,
                    objPayReq.custrecord_scv_payment_payment_code,
                    objPayReq.custrecord_scv_payment_payee
                ]);
        }
        // 2.5 Tạo Chứng từ bill từ Payment request
        // 2.5.1. Transform PO
        const createMultiPaymentRequest = (objParams) => {
            let {createFromId} = objParams;
            let recPayReq = fetchRecordPaymentRequest(createFromId);
            let {dataBills, body} = getDataSourcePaymentRequestGroupByOrderOrItemReceipt(recPayReq);
            const paymentRequestDate = recPayReq.getValue('custrecord_scv_payment_date');
            let arrTransId = Object.keys(dataBills);
            let objFieldsBody = {
                current: ['entity', 'subsidiary', 'currency', 'exchangrate', 'duedate', 'department', 'location', 'cseg_scv_sg_proj', 'memo', 'custbody_scv_matt_xnk'],
                source: ['entityId', /* Custom prop */ 'custrecord_scv_payment_subsidiary', 'custrecord_scv_payment_currency', 'custrecord_scv_payment_exchangerate', 'custrecord_scv_payment_duedate', 'custrecord_scv_payment_department', 'custrecord_scv_payment_location', 'custrecord_scv_payr_project', 'custrecord_scv_payment_memo', 'custrecord_scv_payment_payment_code']
            };
            let objFieldsLine = {
                current: ['item', 'description', 'units', 'quantity', 'rate', 'amount', 'taxcode', 'taxrate1', 'tax1amt', 'grossamt', 'orderdoc', 'orderline', 'department', 'cseg_scv_sg_proj', 'custcol_scv_vendor', 'custcol_scv_invoice_entity', 'custcol_scv_invoice_taxreg', 'custcol_scv_invoice_pattern', 'custcol_scv_invoice_serial', 'custcol_scv_invoice_number', 'custcol_scv_invoice_date', 'cseg_scv_kmcp', 'custcol_scv_origin_line_num', 'custcolscv_bill_custom_no', 'custcol_scv_cost_category', 'custcol_scv_diachi', 'custcol_scv_po_properties', 'custcol_far_trn_relatedasset'],
                source: ['custrecord_scv_payment_item', 'custrecord_scv_pay_detail_des', 'custrecord_scv_pay_detail_unit', 'custrecord_scv_pay_detail_qty', 'custrecord_scv_pay_detail_rate', 'custrecord_scv_pay_detail_amt', 'custrecord_scv_pay_detail_taxcode', 'custrecord_scv_pay_detail_taxrate', 'custrecord_scv_pay_detail_taxamt', 'custrecord_scv_pay_detail_gr_amt', 'custrecord_scv_payment_purchase_order', 'custrecord_scv_pay_detail_ord_line', 'custrecord_scv_payment_department', 'custrecord_scv_payr_detail_project', 'custrecord_scv_pay_detail_entity', 'custrecord_scv_pay_detail_entityname', 'custrecord_scv_pay_detail_taxid', 'custrecord_scv_pay_detail_inv_pattern', 'custrecord_scv_pay_detail_inv_serial', 'custrecord_scv_pay_detail_inv_num', 'custrecord_scv_pay_detail_date', 'custrecord_scv_pay_detail_maphi', 'custrecord_scv_pay_detail_ori_lineid', 'custrecord_scv_payment_contact_no', 'custrecord_scv_payment_cost_cate', 'custrecord_scv_payment_det_address', 'custrecord_scv_pay_detail_specification', 'custrecordscv_pay_detail_asset']
            };
            const numsBodyFld = objFieldsBody.current.length;
            const numsLineFld = objFieldsLine.current.length;
            const numsBill = arrTransId.length;
            let arrDataBill = [];
            for (let i = 0; i < numsBill; i++) {
                let idBill;
                const idTrans = arrTransId[i];
                const lineData = dataBills[idTrans];
                let curRecBill = record.create({type: record.Type.VENDOR_BILL, isDynamic: true});
                for (let j = 0; j < numsBodyFld; j++) {
                    curRecBill.setValue(objFieldsBody.current[j], body[objFieldsBody.source[j]]);
                }
                const sourceLine = dataBills[idTrans][ConsPayReq.CustomProps.SOURCE_LINE_PAY_REQ];
                curRecBill.setValue('custbody_scv_payment_number', [createFromId]);
                idTrans ? curRecBill.setValue('custbody_scv_created_transaction', idTrans) : '';
                const sizeDataLine = lineData.length;
                for (let k = 0; k < sizeDataLine; k++) {
                    let poid = lineData[k]['custrecord_scv_payment_purchase_order'];
                    let itemReceiptId = lineData[k]['custrecord_scv_pay_so_key_code']
                    if (itemReceiptId) {
                        /*let itemReceiptRec = record.load({
                            type: 'itemreceipt',
                            id: itemReceiptId
                        });

                        let trandate = itemReceiptRec.getValue('trandate');
                        curRecBill.setValue('trandate', trandate);*/
                        let fieldValueOfIR = search.lookupFields({type: search.Type.ITEM_RECEIPT, id: itemReceiptId, columns: ['trandate']});
                        setBillTranDate(curRecBill, fieldValueOfIR.trandate, paymentRequestDate);

                    } else if (poid) {
                        /*let poRec = record.load({
                            type: 'purchaseorder',
                            id: poid
                        });

                        let trandate = poRec.getValue('trandate');
                        curRecBill.setValue('trandate', trandate);*/
                        let fieldValueOfPO = search.lookupFields({type: search.Type.PURCHASE_ORDER, id: poid, columns: ['trandate']});
                        setBillTranDate(curRecBill, fieldValueOfPO.trandate, paymentRequestDate);
                    }
                    curRecBill.setValue('duedate', body['custrecord_scv_payment_duedate']);
                    curRecBill.selectNewLine({sublistId: ConsPayReq.CustomSublistId.ITEM});
                    for (let j = 0; j < numsLineFld; j++) {
                        curRecBill.setCurrentSublistValue(ConsPayReq.CustomSublistId.ITEM, objFieldsLine.current[j], lineData[k][objFieldsLine.source[j]]);
                    }
                    // Match line created from Item Receipt line
                    if (idTrans && String(sourceLine) === ConsPayReq.CustomLine.LINE_CREATED_FROM_ITEM_RECEIPT) {
                        curRecBill.setCurrentSublistValue(ConsPayReq.CustomSublistId.ITEM, 'itemrcpt', idTrans);
                    }
                    curRecBill.setCurrentSublistValue(ConsPayReq.CustomSublistId.ITEM, 'location', body.custrecord_scv_payment_location);
                    curRecBill.commitLine({sublistId: ConsPayReq.CustomSublistId.ITEM});
                }
                try {
                    idBill = curRecBill.save({ignoreMandatoryFields: true});
                } catch (e) {
                    log.error('Error Create Bill_' + idTrans + '_PaymentRequest_' + createFromId, e);
                }
                if (idBill) arrDataBill.push(idBill);
            }
            return arrDataBill;
        }

        const setBillTranDate = (billRec, sourceDate, paymentRequestDate) => {
            const billDate = getBillTranDate(sourceDate, paymentRequestDate);
            if (!billDate) return;
            billRec.setValue({fieldId: 'trandate', value: billDate});
        };

        const getBillTranDate = (sourceDate, paymentRequestDate) => {
            const parsedSourceDate = parseTranDate(sourceDate);
            const parsedPaymentRequestDate = parseTranDate(paymentRequestDate);
            if (!parsedSourceDate) return parsedPaymentRequestDate;
            if (!parsedPaymentRequestDate) return parsedSourceDate;
            return getYearMonthValue(parsedSourceDate) < getYearMonthValue(parsedPaymentRequestDate)
                ? parsedPaymentRequestDate
                : parsedSourceDate;
        };

        const parseTranDate = (dateValue) => {
            if (!dateValue) return null;
            if (dateValue instanceof Date) return dateValue;
            return format.parse({
                value: dateValue,
                type: format.Type.DATE
            });
        };

        const getYearMonthValue = (dateValue) => dateValue.getFullYear() * 100 + dateValue.getMonth();

        const getDataSourcePaymentRequestGroupByOrderOrItemReceipt = (curRec) => {
            const paymentTypeId = curRec.getValue('custrecord_scv_payment_type');
            const createdFromPRId = curRec.getValue('custrecord_scv_createdfrom_pr');
            const locationId = curRec.getValue('custrecord_scv_payment_location') || '';
            const entityId = paymentTypeId === ConsPayReq.CustomPaymentTypeId.QUYET_TOAN_NV_DI_MUA_HANG ? fetchEntityIdOnTrans(createdFromPRId) : curRec.getValue('custrecord_scv_payment_entity');
            let arrFieldsBody = [
                'custrecord_scv_payment_subsidiary',
                'custrecord_scv_payment_currency',
                'custrecord_scv_payment_exchangerate',
                'custrecord_scv_payment_duedate',
                'custrecord_scv_payment_department',
                'custrecord_scv_payr_project',
                'custrecord_scv_payment_memo'
            ];
            let objBody = arrFieldsBody.reduce((obj, fldId) => {
                obj[fldId] = curRec.getValue(fldId);
                return obj;
            }, {});
            objBody['entityId'] = entityId;
            objBody['custrecord_scv_payment_location'] = locationId;
            let objLineData = {};
            let lc = curRec.getLineCount(ConsPayReq.CustomSublistId.PAYMENT_REQUEST);
            let arrDataSourceFields = [
                'custrecord_scv_payment_item',
                'custrecord_scv_pay_detail_des',
                'custrecord_scv_pay_detail_unit',
                'custrecord_scv_pay_detail_qty',
                'custrecord_scv_pay_detail_rate',
                'custrecord_scv_pay_detail_amt',
                'custrecord_scv_pay_detail_taxcode',
                'custrecord_scv_pay_detail_taxrate',
                'custrecord_scv_pay_detail_taxamt',
                'custrecord_scv_pay_detail_gr_amt',
                'custrecord_scv_payment_department',
                'custrecord_scv_payr_detail_project',
                'custrecord_scv_pay_detail_entity',
                'custrecord_scv_pay_detail_entityname',
                'custrecord_scv_pay_detail_taxid',
                'custrecord_scv_pay_detail_inv_pattern',
                'custrecord_scv_pay_detail_inv_serial',
                'custrecord_scv_pay_detail_inv_num',
                'custrecord_scv_pay_detail_date',
                'cseg_scv_kmcp',
                'custrecord_scv_pay_detail_ori_lineid',
                'custrecord_scv_payment_purchase_order',
                'custrecord_scv_pay_detail_ord_line',
                'custrecord_scv_payment_contact_no',
                'custrecord_scv_payment_cost_cate',
                'custrecord_scv_payment_det_address',
                'custrecord_scv_pay_so_key_code',
                'custrecord_scv_pay_detail_maphi',
                'custrecord_scv_pay_detail_specification'
            ];
            for (let i = 0; i < lc; i++) {
                const orderId = curRec.getSublistValue({
                    sublistId: ConsPayReq.CustomSublistId.PAYMENT_REQUEST,
                    fieldId: 'custrecord_scv_payment_purchase_order',
                    line: i
                }) || '';
                const lineId = curRec.getSublistValue({
                    sublistId: ConsPayReq.CustomSublistId.PAYMENT_REQUEST,
                    fieldId: 'custrecord_scv_pay_detail_ord_line',
                    line: i
                });
                let itemReceiptId = curRec.getSublistValue({
                    sublistId: ConsPayReq.CustomSublistId.PAYMENT_REQUEST,
                    fieldId: 'custrecord_scv_pay_so_key_code',
                    line: i
                }) || '';
                const isOrder = !!orderId && !!lineId;
                const isItemReceipt = !!itemReceiptId && isOrder;
                const isNotLink = !isOrder;
                const keyMatch = itemReceiptId || orderId || '';
                let objData = arrDataSourceFields.reduce((obj, field) => {
                    obj[field] = curRec.getSublistValue({
                        sublistId: ConsPayReq.CustomSublistId.PAYMENT_REQUEST,
                        fieldId: field,
                        line: i
                    });
                    return obj;
                }, {});
                objData[ConsPayReq.CustomProps.SOURCE_LINE_PAY_REQ] = getTypeLinePaymentRequest({
                    isItemReceipt: isItemReceipt,
                    isOrder: isOrder,
                    isNotLink: isNotLink
                });
                if (!objLineData.hasOwnProperty(keyMatch)) objLineData[keyMatch] = [];
                objLineData[keyMatch].push(objData);
            }
            return {
                body: objBody,
                dataBills: objLineData
            };
        }

        /**
         * Get Type Line Payment Request
         * @param options
         * @param options.isItemReceipt - Is Item Receipt
         * @param options.isOrder - Is Order
         * @param options.isNotLink - Is Not Link PO And Item Receipt
         * @returns {string}
         */
        const getTypeLinePaymentRequest = (options) => {
            if (options.isItemReceipt) return ConsPayReq.CustomLine.LINE_CREATED_FROM_ITEM_RECEIPT;
            if (options.isOrder) return ConsPayReq.CustomLine.LINE_CREATED_FROM_ORDER;
            return ConsPayReq.CustomLine.LINE_OTHER;
        }
        // 2.5.2. Không link PO
        const setDataBillFromPaymentRequest = (curRec, objParams) => {
            let {createFromId, btnid} = objParams;
            if (btnid !== ConsPayReq.CustomButtonId.BILL) return;
            const recPayReq = fetchRecordPaymentRequest(createFromId);
            const lcPayReq = recPayReq.getLineCount(ConsPayReq.CustomSublistId.PAYMENT_REQUEST);
            const locationId = recPayReq.getValue('custrecord_scv_payment_location');
            libFn.setValue(curRec, recPayReq, [
                'entity',
                'subsidiary',
                'currency',
                'exchangrate',
                'duedate',
                'department',
                'location',
                'cseg_scv_sg_proj',
                'memo',
                'custbody_scv_matt_xnk'
            ], [
                'custrecord_scv_payment_entity',
                'custrecord_scv_payment_subsidiary',
                'custrecord_scv_payment_currency',
                'custrecord_scv_payment_exchangerate',
                'custrecord_scv_payment_duedate',
                'custrecord_scv_payment_department',
                'custrecord_scv_payment_location',
                'custrecord_scv_payr_project',
                'custrecord_scv_payment_memo',
                'custrecord_scv_payment_payment_code'
            ]);
            let custrecord_scv_createdfrom_pr = recPayReq.getValue('custrecord_scv_createdfrom_pr');
            if ( custrecord_scv_createdfrom_pr ) {
                setEntityWithPo(curRec, recPayReq);
                let fieldValueOfPO = search.lookupFields({
                    type: search.Type.PURCHASE_ORDER,
                    id: custrecord_scv_createdfrom_pr,
                    columns: ['trandate']
                });
                setBillTranDate(curRec, fieldValueOfPO.trandate, recPayReq.getValue('custrecord_scv_payment_date'));
            }
            curRec.setValue('custbody_scv_payment_number', [createFromId]);
            let lineItem = 0, lineExpense = 0;
            for (let i = 0; i < lcPayReq; i++) {
                const itemId = recPayReq.getSublistValue({
                    sublistId: ConsPayReq.CustomSublistId.PAYMENT_REQUEST,
                    fieldId: 'custrecord_scv_payment_item',
                    line: i
                });
                // Sublist Item
                if (itemId) {
                    curRec.insertLine({sublistId: ConsPayReq.CustomSublistId.ITEM, line: lineItem});
                    libFn.setSublistValueDiff(curRec, recPayReq,
                        ConsPayReq.CustomSublistId.ITEM,
                        ConsPayReq.CustomSublistId.PAYMENT_REQUEST,
                        [
                            'item', 'description', 'units', 'quantity', 'rate', 'amount',
                            'taxcode', 'taxrate1', 'tax1amt', 'grossamt',
                            'department', 'cseg_scv_sg_proj', 'custcol_scv_vendor', 'custcol_scv_invoice_entity',
                            'custcol_scv_invoice_taxreg', 'custcol_scv_invoice_pattern', 'custcol_scv_invoice_serial',
                            'custcol_scv_invoice_number', 'custcol_scv_invoice_date', 'cseg_scv_kmcp',
                            'custcolscv_bill_custom_no', 'custcol_scv_cost_category',
                            'custcol_scv_diachi', 'custcol_scv_origin_line_num', 'custcol_scv_payr_detail',
                            'custcol_scv_po_properties', 'orderdoc', 'orderline','custcol_far_trn_relatedasset'
                        ],
                        [
                            'custrecord_scv_payment_item', 'custrecord_scv_pay_detail_des', 'custrecord_scv_pay_detail_unit', 'custrecord_scv_pay_detail_qty', 'custrecord_scv_pay_detail_rate', 'custrecord_scv_pay_detail_amt',
                            'custrecord_scv_pay_detail_taxcode', 'custrecord_scv_pay_detail_taxrate', 'custrecord_scv_pay_detail_taxamt', 'custrecord_scv_pay_detail_gr_amt',
                            'custrecord_scv_payment_department', 'custrecord_scv_payr_detail_project', 'custrecord_scv_pay_detail_entity',
                            'custrecord_scv_pay_detail_entityname', 'custrecord_scv_pay_detail_taxid', 'custrecord_scv_pay_detail_inv_pattern', 'custrecord_scv_pay_detail_inv_serial',
                            'custrecord_scv_pay_detail_inv_num', 'custrecord_scv_pay_detail_date', 'custrecord_scv_pay_detail_maphi',
                            'custrecord_scv_payment_contact_no', 'custrecord_scv_payment_cost_cate',
                            'custrecord_scv_payment_det_address', 'custrecord_scv_pay_detail_ori_lineid', 'id',
                            'custrecord_scv_pay_detail_specification', 'custrecord_scv_payment_purchase_order', 'custrecord_scv_pay_detail_ord_line','custrecordscv_pay_detail_asset'
                        ],
                        lineItem,
                        i
                    );
                    curRec.setSublistValue({
                        sublistId: ConsPayReq.CustomSublistId.ITEM,
                        fieldId: 'location',
                        value: locationId,
                        line: lineItem
                    });
                    lineItem++;
                } else {
                    // Sublist Expense
                    curRec.insertLine({sublistId: ConsPayReq.CustomSublistId.EXPENSE, line: lineExpense});
                    libFn.setSublistValueDiff(curRec, recPayReq, ConsPayReq.CustomSublistId.EXPENSE, ConsPayReq.CustomSublistId.PAYMENT_REQUEST, [
                        'category',
                        'account',
                        'memo',
                        'amount',
                        'taxcode',
                        'taxrate1',
                        'tax1amt',
                        'grossamt',
                        'department',
                        'cseg_scv_sg_proj',
                        'custcol_scv_vendor',
                        'custcol_scv_invoice_entity',
                        'custcol_scv_invoice_taxreg',
                        'custcol_scv_invoice_pattern',
                        'custcol_scv_invoice_serial',
                        'custcol_scv_invoice_number',
                        'custcol_scv_invoice_date',
                        'cseg_scv_kmcp',
                        'custcolscv_bill_custom_no',
                        'custcol_scv_cost_category',
                        'custcol_scv_diachi',
                        'custcol_scv_origin_line_num',
                        'custcol_scv_po_properties',
                        'custcol_scv_payr_detail',
                        'custcol_scv_lc_account_check',
                    ], [
                        'custrecord_scv_pay_detail_category',
                        'custrecord_scv_pay_detail_account',
                        'custrecord_scv_pay_detail_des',
                        'custrecord_scv_pay_detail_amt',
                        'custrecord_scv_pay_detail_taxcode',
                        'custrecord_scv_pay_detail_taxrate',
                        'custrecord_scv_pay_detail_taxamt',
                        'custrecord_scv_pay_detail_gr_amt',
                        'custrecord_scv_payment_department',
                        'custrecord_scv_payr_detail_project',
                        'custrecord_scv_pay_detail_entity',
                        'custrecord_scv_pay_detail_entityname',
                        'custrecord_scv_pay_detail_taxid',
                        'custrecord_scv_pay_detail_inv_pattern',
                        'custrecord_scv_pay_detail_inv_serial',
                        'custrecord_scv_pay_detail_inv_num',
                        'custrecord_scv_pay_detail_date',
                        'custrecord_scv_pay_detail_maphi',
                        'custrecord_scv_payment_contact_no',
                        'custrecord_scv_payment_cost_cate',
                        'custrecord_scv_payment_det_address',
                        'custrecord_scv_pay_detail_ori_lineid',
                        'custrecord_scv_pay_detail_specification',
                        'id'
                    ], lineExpense, i);
                    curRec.setSublistValue({
                        sublistId: ConsPayReq.CustomSublistId.EXPENSE,
                        fieldId: 'location',
                        value: locationId,
                        line: lineExpense
                    });
                    lineExpense++;
                }
            }
        };

        const setEntityWithPo = (curRec, recPayReq) => {
            const poId = recPayReq.getValue('custrecord_scv_createdfrom_pr');
            if (!poId) return;
            const lkFieldsPo = search.lookupFields({type: record.Type.PURCHASE_ORDER, id: poId, columns: ['entity']})
            const idEntity = lkFieldsPo.entity[0].value;
            curRec.setValue('entity', idEntity);
        }

        const setDataSession = (keyword, data) => {
            runtime.getCurrentSession().set(keyword, JSON.stringify(data));
        };

        // 2.6 Tạo chứng từ Expense report
        const setDataExpenseReportFromPaymentRequest = (curRec, objParams) => {
            let {createFromId, btnid} = objParams;
            if (btnid !== ConsPayReq.CustomButtonId.EXPENSE_REPORT) return;
            const recPayReq = fetchRecordPaymentRequest(createFromId);
            const lcPayReq = recPayReq.getLineCount(ConsPayReq.CustomSublistId.PAYMENT_REQUEST);
            libFn.setValue(curRec, recPayReq, [
                'entity',
                'subsidiary',
                'expensereportcurrency',
                'expensereportexchangerate',
                'memo',
                'location',
                'cseg_scv_sg_proj',
                'advance',
                'custbody_scv_advanced_request',
                'custbody_scv_matt_xnk'
            ], [
                'custrecord_scv_payment_entity',
                'custrecord_scv_payment_subsidiary',
                'custrecord_scv_payment_currency',
                'custrecord_scv_payment_exchangerate',
                'custrecord_scv_payment_memo',
                'custrecord_scv_payment_location',
                'custrecord_scv_payr_project',
                'custrecord_scv_payment_advance',
                'custrecord_scv_payment_advanced_reques',
                'custrecord_scv_payment_payment_code'
            ]);
            const paymentAdvance = recPayReq.getValue('custrecord_scv_payment_advance') * 1;
            setDataSession(ConsPayReq.CustomKeySession.PAYMENT_REQUEST, {
                paymentAdvance
            })
            const transDate = curRec.getValue('trandate');
            const exchangerate = curRec.getValue('expensereportexchangerate');
            const currencyId = recPayReq.getValue('custrecord_scv_payment_currency');
            curRec.setValue('custbody_scv_payment_number', [createFromId]);
            for (let i = 0; i < lcPayReq; i++) {
                curRec.insertLine({sublistId: ConsPayReq.CustomSublistId.EXPENSE, line: i});
                libFn.setSublistValue(curRec, recPayReq,
                    ConsPayReq.CustomSublistId.EXPENSE,
                    ConsPayReq.CustomSublistId.PAYMENT_REQUEST,
                    [
                        'expensecategory',
                        'expenseaccount',
                        'memo',
                        'amount',
                        'taxcode',
                        'taxrate1',
                        'tax1amt',
                        'grossamt',
                        'custcol_scv_vendor',
                        'custcol_scv_invoice_entity',
                        'custcol_scv_invoice_taxreg',
                        'custcol_scv_invoice_pattern',
                        'custcol_scv_invoice_serial',
                        'custcol_scv_invoice_number',
                        'custcol_scv_invoice_date',
                        'cseg_scv_kmcp',
                        'custcolscv_bill_custom_no',
                        'custcol_scv_cost_category',
                        'custcol_scv_diachi',
                        'custcol_far_trn_relatedasset',
                        'custcol_scv_lc_account_check'
                    ], [
                        'custrecord_scv_pay_detail_category',
                        'custrecord_scv_pay_detail_account',
                        'custrecord_scv_pay_detail_des',
                        'custrecord_scv_pay_detail_amt',
                        'custrecord_scv_pay_detail_taxcode',
                        'custrecord_scv_pay_detail_taxrate',
                        'custrecord_scv_pay_detail_taxamt',
                        'custrecord_scv_pay_detail_gr_amt',
                        'custrecord_scv_pay_detail_entity',
                        'custrecord_scv_pay_detail_entityname',
                        'custrecord_scv_pay_detail_taxid',
                        'custrecord_scv_pay_detail_inv_pattern',
                        'custrecord_scv_pay_detail_inv_serial',
                        'custrecord_scv_pay_detail_inv_num',
                        'custrecord_scv_pay_detail_date',
                        'custrecord_scv_pay_detail_maphi',
                        'custrecord_scv_payment_contact_no',
                        'custrecord_scv_payment_cost_cate',
                        'custrecord_scv_payment_det_address',
                        'custrecordscv_pay_detail_asset',
                    ], i);
                libFn.setSublistValueData(curRec, ConsPayReq.CustomSublistId.EXPENSE, [
                    'expensedate',
                    'currency',
                    'exchangerate'
                ], i, [
                    transDate,
                    currencyId,
                    exchangerate
                ]);
            }
        };
        // 2.7 Tạo chứng từ Lệnh chi - write check từ "Payment request" theo {custrecord_scv_payment_type} = 'Tạm ứng nhân viên'
        const setDataWriteCheckFromPaymentRequestTUNV = (curRec, objParams) => {
            let {createFromId, btnid} = objParams;
            if (btnid !== ConsPayReq.CustomButtonId.WRITE_CHECK_TUNV) return;
            const recPayReq = fetchRecordPaymentRequest(createFromId);
            const vendorId = recPayReq.getValue('custrecord_scv_payment_entity');
            const subsidiaryId = recPayReq.getValue('custrecord_scv_payment_subsidiary');
            const currencyId = recPayReq.getValue('custrecord_scv_payment_currency');
            const accountId = fetchAccountId({subsidiary: subsidiaryId, currency: currencyId, typeBank: 'Bank'});
            const advPayReq = recPayReq.getValue('custrecord_scv_payment_advanced_reques') || createFromId;
            libFn.setValueData(curRec, ['entity', 'subsidiary', 'account', 'custbody_scv_payee'], [vendorId, subsidiaryId, accountId, vendorId]);
            libFn.setValue(curRec, recPayReq, [
                'currency',
                'exchangerate',
                'duedate',
                'trandate',
                'department',
                'cseg_scv_sg_proj',
                'memo',
                'custbody_scv_created_transaction',
                'custbody_scv_beneficiary_bank',
                'custbody_scv_beneficiary',
                'custbody_scv_bankaccount',
                'custbody_scv_bankbranch',
                'custbody_scv_pr_amount_paid'
            ], [
                'custrecord_scv_payment_currency',
                'custrecord_scv_payment_exchangerate',
                'custrecord_scv_payment_duedate',
                'custrecord_scv_payment_date',
                'custrecord_scv_payment_department',
                'custrecord_scv_payr_project',
                'custrecord_scv_payment_memo',
                'custrecord_scv_createdfrom_pr',
                'custrecord_scv_payment_beneficiary',
                'custrecord_scv_payment_nguoi_thu_huong',
                'custrecord_scv_payment_bankaccount',
                'custrecord_scv_payment_bankbranch',
                'custrecord_scv_payreq_remaining_amt'
            ]);
            const bankAccountId = recPayReq.getValue('custrecord_scv_payment_bankname');
            const bakeAccountText = recPayReq.getText('custrecord_scv_payment_bankname');
            bankAccountId ? curRec.setValue('custbody_scv_bankname', bakeAccountText) : '';
            curRec.setValue('custbody_scv_payment_number', [createFromId]);
            curRec.setValue('custbody_scv_advanced_request', advPayReq);
            const payAmtRemain = String(recPayReq.getValue('custrecord_scv_payreq_remaining_amt')*1);
            const payMemo = recPayReq.getValue('custrecord_scv_payment_memo');
            curRec.insertLine({sublistId: ConsPayReq.CustomSublistId.EXPENSE, line: 0});
            libFn.setSublistValueData(curRec, ConsPayReq.CustomSublistId.EXPENSE, [
                'account',
                'amount',
                'custcol_scv_sumtrans_line_taxcode',
                'custcol_scv_sumtrans_line_taxrate',
                'custcol_scv_sumtrans_line_taxamt',
                'custcol_scv_sumtrans_line_grossamt',
                'memo',
                'custcol_scv_lc_account_check'
            ], 0, [
                ConsPayReq.CustomAccountId.ACCOUNT_14110001,
                payAmtRemain,
                ConsPayReq.CustomTaxCodeId.UNDEF_VN,
                0,
                0,
                payAmtRemain,
                payMemo,
                ConsPayReq.CustomAccountId.ACCOUNT_14110001,
            ]);
        };
        // 2.8 Tạo chứng từ Lệnh chi - write check từ "Payment request" theo {custrecord_scv_payment_type} = 'Chi khác'
        const setDataWriteCheckFromPaymentRequestChiKhac = (curRec, objParams) => {
            let {createFromId, btnid} = objParams;
            if (btnid !== ConsPayReq.CustomButtonId.WRITE_CHECK_CHI_KHAC) return;
            const recPayReq = fetchRecordPaymentRequest(createFromId);
            const lcPayReq = recPayReq.getLineCount(ConsPayReq.CustomSublistId.PAYMENT_REQUEST);
            const vendorId = recPayReq.getValue('custrecord_scv_payment_entity');
            const subsidiaryId = recPayReq.getValue('custrecord_scv_payment_subsidiary');
            const currencyId = recPayReq.getValue('custrecord_scv_payment_currency');
            const accountId = fetchAccountId({subsidiary: subsidiaryId, currency: currencyId, typeBank: 'Bank'});
            libFn.setValueData(curRec, ['entity', 'subsidiary', 'account', 'custbody_scv_payee'], [vendorId, subsidiaryId, accountId, vendorId]);
            libFn.setValue(curRec, recPayReq, [
                'currency',
                'exchangerate',
                'duedate',
                'trandate',
                'department',
                'cseg_scv_sg_proj',
                'memo',
                'custbody_scv_pr_amount_paid',
                'custbody_scv_beneficiary_bank',
                'custbody_scv_beneficiary',
                'custbody_scv_bankaccount',
                'custbody_scv_bankbranch',
                'custbody_scv_matt_xnk'
            ], [
                'custrecord_scv_payment_currency',
                'custrecord_scv_payment_exchangerate',
                'custrecord_scv_payment_duedate',
                'custrecord_scv_payment_date',
                'custrecord_scv_payment_department',
                'custrecord_scv_payr_project',
                'custrecord_scv_payment_memo',
                'custrecord_scv_payreq_remaining_amt',
                'custrecord_scv_payment_beneficiary',
                'custrecord_scv_payment_nguoi_thu_huong',
                'custrecord_scv_payment_bankaccount',
                'custrecord_scv_payment_bankbranch',
                'custrecord_scv_payment_payment_code'
            ]);
            const bankAccountId = recPayReq.getValue('custrecord_scv_payment_bankname');
            const bakeAccountText = recPayReq.getText('custrecord_scv_payment_bankname');
            bankAccountId ? curRec.setValue('custbody_scv_bankname', bakeAccountText) : '';
            curRec.setValue('custbody_scv_payment_number', [createFromId]);
            for (let i = 0; i < lcPayReq; i++) {
                let categoryId = recPayReq.getSublistValue({
                    sublistId: ConsPayReq.CustomSublistId.PAYMENT_REQUEST,
                    fieldId: 'custrecord_scv_pay_detail_category',
                    line: i
                });

                let accountPayIdcheck = recPayReq.getSublistValue({
                    sublistId: ConsPayReq.CustomSublistId.PAYMENT_REQUEST,
                    fieldId: 'custrecord_scv_pay_detail_account',
                    line: i
                });

                let accountPayId = categoryId ? accountPayIdcheck : 1228;//Account._3201.ID

                let amountDetail = recPayReq.getSublistValue({
                    sublistId: ConsPayReq.CustomSublistId.PAYMENT_REQUEST,
                    fieldId: 'custrecord_scv_pay_detail_amt',
                    line: i
                }) * 1;

                curRec.insertLine({
                    sublistId: ConsPayReq.CustomSublistId.EXPENSE,
                    line: i
                });
                libFn.setSublistValueData(curRec, ConsPayReq.CustomSublistId.EXPENSE, [
                    'category',
                    'custcol_scv_lc_account_check',
                    'amount',
                    'account'
                ], i, [
                    categoryId,
                    accountPayIdcheck,
                    amountDetail,
                    accountPayId,
                ]);
                libFn.setSublistValue(curRec, recPayReq,
                    ConsPayReq.CustomSublistId.EXPENSE,
                    ConsPayReq.CustomSublistId.PAYMENT_REQUEST,
                    [
                        'custcol_scv_sumtrans_line_taxcode',
                        'custcol_scv_sumtrans_line_taxrate',
                        'custcol_scv_sumtrans_line_taxamt',
                        'custcol_scv_sumtrans_line_grossamt',
                        'memo',
                        'department',
                        'cseg_scv_sg_proj',
                        'custcol_scv_vendor',
                        'custcol_scv_invoice_entity',
                        'custcol_scv_invoice_taxreg',
                        'custcol_scv_invoice_pattern',
                        'custcol_scv_invoice_serial',
                        'custcol_scv_invoice_number',
                        'custcol_scv_invoice_date',
                        'cseg_scv_kmcp',
                        'custcolscv_bill_custom_no',
                        'custcol_scv_cost_category',
                        'custcol_scv_diachi',
                        'custcol_scv_origin_line_num',
                        'custcol_scv_payr_detail',
                        'custcol_far_trn_relatedasset',
                    ], [
                        'custrecord_scv_pay_detail_taxcode',
                        'custrecord_scv_pay_detail_taxrate',
                        'custrecord_scv_pay_detail_taxamt',
                        'custrecord_scv_pay_detail_gr_amt',
                        'custrecord_scv_pay_detail_des',
                        'custrecord_scv_payment_department',
                        'custrecord_scv_payr_detail_project',
                        'custrecord_scv_pay_detail_entity',
                        'custrecord_scv_pay_detail_entityname',
                        'custrecord_scv_pay_detail_taxid',
                        'custrecord_scv_pay_detail_inv_pattern',
                        'custrecord_scv_pay_detail_inv_serial',
                        'custrecord_scv_pay_detail_inv_num',
                        'custrecord_scv_pay_detail_date',
                        'cseg_scv_kmcp',
                        'custrecord_scv_payment_contact_no',
                        'custrecord_scv_payment_cost_cate',
                        'custrecord_scv_payment_det_address',
                        'custrecord_scv_pay_detail_ori_lineid',
                        'id',
                        'custrecordscv_pay_detail_asset',
                    ], i);
            }
        };
        //2.9 Tạo chứng từ Credit Memo từ Payment Request
        const setDataCreditMemoFromPaymentRequest = (curRec, objParams) => {
            let {createFromId, btnid} = objParams;
            if (btnid !== ConsPayReq.CustomButtonId.CREDIT_MEMO) return;
            const accountId = getDataPreference().araccount;
            const recPayReq = fetchRecordPaymentRequest(createFromId);
            const lcPayReq = recPayReq.getLineCount(ConsPayReq.CustomSublistId.PAYMENT_REQUEST);
            const vendorId = recPayReq.getValue('custrecord_scv_payment_entity');
            const subsidiaryId = recPayReq.getValue('custrecord_scv_payment_subsidiary');
            libFn.setValueData(curRec, ['subsidiary', 'entity', 'account', 'custbody_scv_payment_number'], [subsidiaryId, vendorId, accountId,[recPayReq.id]]);
            libFn.setValue(curRec, recPayReq, [
                'currency',
                'exchangerate',
                'duedate',
                'trandate',
                'department',
                'cseg_scv_sg_proj',
                'memo',
                // 'custbody_scv_payment_number'
            ], [
                'custrecord_scv_payment_currency',
                'custrecord_scv_payment_exchangerate',
                'custrecord_scv_payment_duedate',
                'custrecord_scv_payment_date',
                'custrecord_scv_payment_department',
                'custrecord_scv_payr_project',
                'custrecord_scv_payment_memo',
                // 'id'
            ]);
            // curRec.setValue('custbody_scv_payment_number', [createFromId]);
            let sublistSessionData = [];
            for (let i = 0; i < lcPayReq; i++) {
                curRec.insertLine({sublistId: ConsPayReq.CustomSublistId.ITEM, line: i});

                libFn.setSublistValue(curRec, recPayReq,
                    ConsPayReq.CustomSublistId.ITEM,
                    ConsPayReq.CustomSublistId.PAYMENT_REQUEST,
                    [
                        'item',
                        'description',
                        'units',
                        'quantity',
                        'taxcode',
                        'rate',
                        'amount',

                        'taxrate1',
                        'tax1amt',
                        'grossamt',
                        'department',
                        'cseg_scv_sg_proj',
                    ], [
                        'custrecord_scv_payment_item',
                        'custrecord_scv_pay_detail_des',
                        'custrecord_scv_pay_detail_unit',
                        'custrecord_scv_pay_detail_qty',
                        'custrecord_scv_pay_detail_taxcode',
                        'custrecord_scv_pay_detail_rate',
                        'custrecord_scv_pay_detail_amt',

                        'custrecord_scv_pay_detail_taxrate',
                        'custrecord_scv_pay_detail_taxamt',
                        'custrecord_scv_pay_detail_gr_amt',
                        'custrecord_scv_payment_department',
                        'custrecord_scv_payr_detail_project'
                    ], i);
            }
            sublistSessionData =  libFn.getSublistValueLine(curRec,
                ConsPayReq.CustomSublistId.ITEM, ['item', 'taxcode', 'taxrate', 'rate']);
            runtime.getCurrentSession().set(`sublistSessionData`, JSON.stringify(sublistSessionData))
        };

        //2.11 Chức năng tạo "Deposit" từ Payment Request
        const setDataDepositFromPaymentRequest = (curRec, objParams) => {
            let {createFromId, btnid} = objParams;
            if (btnid !== ConsPayReq.CustomButtonId.DEPOSIT) return;
            const objBodyPayReq = fetchDataBodyPaymentRequest(createFromId);
            const vendorId = objBodyPayReq.custrecord_scv_payment_entity;
            const subsidiaryId = objBodyPayReq.custrecord_scv_payment_subsidiary;
            const currencyId = objBodyPayReq.custrecord_scv_payment_currency;
            const accountId = fetchAccountId({subsidiary: subsidiaryId, currency: currencyId, typeBank: 'Bank'});
            libFn.setValueData(curRec, [
                    'account', 'subsidiary', 'custbody_scv_payee',
                    'currency', 'exchangerate', 'trandate', 'department',
                    'memo', 'custbody_scv_advanced_request', 'custbody_scv_created_transaction'
                ],
                [
                    accountId, subsidiaryId, vendorId,
                    objBodyPayReq.custrecord_scv_payment_currency,
                    objBodyPayReq.custrecord_scv_payment_exchangerate,
                    parseDate(objBodyPayReq.custrecord_scv_payment_date),
                    objBodyPayReq.custrecord_scv_payment_department,
                    objBodyPayReq.custrecord_scv_payment_memo,
                    objBodyPayReq.custrecord_scv_payment_advanced_reques,
                    objBodyPayReq.custrecord_scv_createdfrom_pr
                ]);
            curRec.setValue('custbody_scv_payment_number', [createFromId]);
            curRec.insertLine({sublistId: ConsPayReq.CustomSublistId.OTHER, line: 0});
            libFn.setSublistValueData(curRec, ConsPayReq.CustomSublistId.OTHER, [
                'entity',
                'account',
                'memo',
                'department',
                'amount'
            ], 0, [
                vendorId,
                ConsPayReq.CustomAccountId.ACCOUNT_14110001,
                objBodyPayReq.custrecord_scv_payment_memo,
                objBodyPayReq.custrecord_scv_payment_department,
                Math.abs(objBodyPayReq.custrecord_scv_payment_amount * 1)
            ]);
        };

        //2.12 Chức năng tạo "Bill Payment" từ Payment Request
        const setDataBillPaymentFromPaymentRequest = (curRec, objParams) => {
            let {createFromId, btnid} = objParams;
            if (btnid !== ConsPayReq.CustomButtonId.BILL_PAYMENT) return;
            const objBodyPayReq = fetchDataBodyPaymentRequest(createFromId);
            log.error('objBodyPayReq', objBodyPayReq);
            const vendorId = objBodyPayReq.custrecord_scv_payment_entity;
            const subsidiaryId = objBodyPayReq.custrecord_scv_payment_subsidiary;
            const arrRelated = objBodyPayReq.custrecord_scv_payment_related;
            const currencyId = objBodyPayReq.custrecord_scv_payment_currency;
            const accountId = fetchAccountId({subsidiary: subsidiaryId, currency: currencyId, typeBank: 'Bank'});
            const apacctId = arrRelated.length > 0 ? fetchAccountIDOnBills(arrRelated) : '';
            libFn.setValueData(curRec, ['apacct', 'entity', 'custbody_scv_payee', 'account', 'subsidiary'], [apacctId, vendorId, vendorId, accountId, subsidiaryId]);
            libFn.setValueData(curRec, [
                'currency',
                'exchangerate',
                'trandate',
                'department',
                'memo',
                'custbody_scv_advanced_request',
                'custbody_scv_pr_amount_paid',
                'custbody_scv_beneficiary_entity',
                'custbody_scv_beneficiary_bank',
                'custbody_scv_beneficiary',
                'custbody_scv_bankaccount',
                'custbody_scv_bankbranch',
                'custbody_scv_bankname',
                'custbody_scv_matt_xnk'
            ], [
                objBodyPayReq.custrecord_scv_payment_currency,
                objBodyPayReq.custrecord_scv_payment_exchangerate,
                parseDate(objBodyPayReq.custrecord_scv_payment_date),
                objBodyPayReq.custrecord_scv_payment_department,
                objBodyPayReq.custrecord_scv_payment_memo,
                objBodyPayReq.custrecord_scv_payment_advanced_reques,
                objBodyPayReq.custrecord_scv_payreq_remaining_amt,
                objBodyPayReq.custrecord_scv_payment_payee,
                objBodyPayReq.custrecord_scv_payment_beneficiary,
                objBodyPayReq.custrecord_scv_payment_nguoi_thu_huong,
                objBodyPayReq.custrecord_scv_payment_bankaccount,
                objBodyPayReq.custrecord_scv_payment_bankbranch,
                objBodyPayReq.custrecord_scv_payment_bankname_display,
                objBodyPayReq.custrecord_scv_payment_payment_code,
            ]);
            curRec.setValue('custbody_scv_payment_number', [createFromId]);
        };

        //2.13 Tạo chứng từ Bill credit từ Payment Request
        const setDataBillCreditFromPaymentRequest = (curRec, objParams) => {
            let {createFromId, btnid} = objParams;
            if (btnid !== ConsPayReq.CustomButtonId.BILL_CREDIT) return;
            const recPayReq = fetchRecordPaymentRequest(createFromId);
            const createdFromPRId = recPayReq.getValue('custrecord_scv_createdfrom_pr');
            let vendorIdByCreatedFromPR = fetchEntityIdOnTrans(createdFromPRId);
            if (!vendorIdByCreatedFromPR) {
                vendorIdByCreatedFromPR = recPayReq.getValue('custrecord_scv_payment_entity');
            }
            const subsidiaryId = recPayReq.getValue('custrecord_scv_payment_subsidiary');
            const arrRelTranId = recPayReq.getValue('custrecord_scv_payment_related');
            const accountId = arrRelTranId.length ? fetchAccountIDOnBills(arrRelTranId) : '';
            libFn.setValueData(curRec, ['entity', 'account', 'subsidiary'], [vendorIdByCreatedFromPR, accountId, subsidiaryId]);
            libFn.setValue(curRec, recPayReq, [
                'currency',
                'exchangerate',
                'duedate',
                'trandate',
                'department',
                'custbody_scv_created_transaction'
            ], [
                'custrecord_scv_payment_currency',
                'custrecord_scv_payment_exchangerate',
                'custrecord_scv_payment_duedate',
                'custrecord_scv_payment_date',
                'custrecord_scv_payment_department',
                'custrecord_scv_createdfrom_pr'
            ]);
            curRec.setValue('custbody_scv_advanced_request', createFromId);
            curRec.setValue('custbody_scv_payment_number', [createFromId]);
            let payAmt = recPayReq.getValue('custrecord_scv_payr_discount_amt');
            curRec.insertLine({sublistId: ConsPayReq.CustomSublistId.EXPENSE, line: 0});

            libFn.setSublistValueData(curRec, ConsPayReq.CustomSublistId.EXPENSE,
                ['account', 'amount', 'taxcode', 'tax1amt', 'grossamt'],
                0,
                [ConsPayReq.CustomAccountId.ACCOUNT_71110001, payAmt, ConsPayReq.CustomTaxCodeId.UNDEF_VN, 0, payAmt]
            );
        };

        //2.16 Tạo phiếu kế toán (Journal) từ Payment request
        const setDataJournalEntryFromPaymentRequest = (curRec, objParams) => {
            let {createFromId, btnid} = objParams;
            if (btnid !== ConsPayReq.CustomButtonId.JOURNAL_ENTRY) return;
            const objBodyPayReq = fetchDataBodyPaymentRequest(createFromId);
            const subsidiaryId = objBodyPayReq.custrecord_scv_payment_subsidiary;
            const currencyId = objBodyPayReq.custrecord_scv_payment_currency;
            libFn.setValueData(curRec, [
                'subsidiary',
                'currency',
                'exchangerate',
                'duedate',
                'trandate',
                'department',
                'custbody_scv_created_transaction',
                'cseg_scv_sg_proj',
                'memo',
                'custbody_scv_advanced_request',
                'custbody_scv_matt_xnk'
            ], [
                subsidiaryId,
                currencyId,
                objBodyPayReq.custrecord_scv_payment_exchangerate,
                parseDate(objBodyPayReq.custrecord_scv_payment_duedate),
                new Date().toLocaleString("en-GB", {timeZone: "Asia/Ho_Chi_Minh"}),
                objBodyPayReq.custrecord_scv_payment_department,
                objBodyPayReq.custrecord_scv_createdfrom_pr,
                objBodyPayReq.custrecord_scv_payr_project,
                objBodyPayReq.custrecord_scv_payment_memo,
                objBodyPayReq.custrecord_scv_payment_advanced_reques,
                objBodyPayReq.custrecord_scv_payment_payment_code
            ]);
            curRec.setValue('custbody_scv_payment_number', [createFromId]);
        };

        //2.17 Tạo phiếu Customer refund từ Payment request (Bổ sung ngày 11/3/2025)
        const setDataCustomerRefundFromPaymentRequest = (curRec, objParams) => {
            let {createFromId, btnid} = objParams;
            if (btnid !== ConsPayReq.CustomButtonId.CUSTOMER_REFUND) return;
            const objBodyPayReq = fetchDataBodyPaymentRequest(createFromId);
            libFn.setValueData(curRec, [
                'customer',
                'subsidiary',
                'currency',
                'exchangerate',
                'memo',
                'trandate',
                'location',
                'custbody_scv_beneficiary_bank',
                'custbody_scv_beneficiary',
                'custbody_scv_bankaccount',
                'custbody_scv_bankbranch',
                'custbody_scv_bankname',
                'custbody_scv_pr_amount_paid'
            ], [
                objBodyPayReq.custrecord_scv_payment_entity,
                objBodyPayReq.custrecord_scv_payment_subsidiary,
                objBodyPayReq.custrecord_scv_payment_currency,
                objBodyPayReq.custrecord_scv_payment_exchangerate,
                objBodyPayReq.custrecord_scv_payment_memo,
                new Date(),
                objBodyPayReq.custrecord_scv_payment_location,
                objBodyPayReq.custrecord_scv_payment_beneficiary,
                objBodyPayReq.custrecord_scv_payment_nguoi_thu_huong,
                objBodyPayReq.custrecord_scv_payment_bankaccount,
                objBodyPayReq.custrecord_scv_payment_bankbranch,
                objBodyPayReq.custrecord_scv_payment_bankname_display,
                objBodyPayReq.custrecord_scv_payreq_remaining_amt
            ]);
            curRec.setValue('custbody_scv_payment_number', [createFromId]);
        };
        const fetchDataBodyPaymentRequest = (idPayReq) => {
            let lkPayReq = search.lookupFields({
                type: ConsPayReq.CustomRecordType.PAYMENT_REQUEST,
                id: idPayReq,
                columns: [
                    'custrecord_scv_payment_entity',
                    'custrecord_scv_payment_subsidiary',
                    'custrecord_scv_payment_currency',
                    'custrecord_scv_payment_exchangerate',
                    'custrecord_scv_payment_memo',
                    'custrecord_scv_payr_project',
                    'custrecord_scv_payment_amount',
                    'custrecord_scv_payment_po',
                    'custrecord_scv_payment_department',
                    'custrecord_scv_payment_beneficiary',
                    'custrecord_scv_payment_nguoi_thu_huong',
                    'custrecord_scv_payment_bankaccount',
                    'custrecord_scv_payment_bankbranch',
                    'custrecord_scv_payment_bankname',
                    'custrecord_scv_payment_date',
                    'custrecord_scv_payment_advanced_reques',
                    'custrecord_scv_payment_type',
                    'custrecord_scv_payment_related',
                    'custrecord_scv_createdfrom_pr',
                    'custrecord_scv_payment_emp_remain',
                    'custrecord_scv_payreq_remaining_amt',
                    'custrecord_scv_payment_duedate',
                    'custrecord_scv_payment_payee',
                    'custrecord_scv_payment_payment_code'
                ]
            });
            return {
                custrecord_scv_payment_entity: lkPayReq.custrecord_scv_payment_entity?.[0]?.value,
                custrecord_scv_payment_subsidiary: lkPayReq.custrecord_scv_payment_subsidiary?.[0]?.value,
                custrecord_scv_payment_currency: lkPayReq.custrecord_scv_payment_currency?.[0]?.value,
                custrecord_scv_payment_exchangerate: lkPayReq.custrecord_scv_payment_exchangerate,
                custrecord_scv_payment_memo: lkPayReq.custrecord_scv_payment_memo,
                custrecord_scv_payr_project: lkPayReq.custrecord_scv_payr_project?.[0]?.value,
                custrecord_scv_payment_amount: lkPayReq.custrecord_scv_payment_amount,
                custrecord_scv_payment_po: lkPayReq.custrecord_scv_payment_po?.[0]?.value,
                custrecord_scv_payment_department: lkPayReq.custrecord_scv_payment_department?.[0]?.value,
                custrecord_scv_payment_beneficiary: lkPayReq.custrecord_scv_payment_beneficiary?.[0]?.value,
                custrecord_scv_payment_nguoi_thu_huong: lkPayReq.custrecord_scv_payment_nguoi_thu_huong,
                custrecord_scv_payment_bankaccount: lkPayReq.custrecord_scv_payment_bankaccount,
                custrecord_scv_payment_bankbranch: lkPayReq.custrecord_scv_payment_bankbranch,
                custrecord_scv_payment_bankname: lkPayReq.custrecord_scv_payment_bankname?.[0]?.value,
                custrecord_scv_payment_bankname_display: lkPayReq.custrecord_scv_payment_bankname?.[0]?.text,
                custrecord_scv_payment_duedate: lkPayReq.custrecord_scv_payment_duedate,
                custrecord_scv_payment_date: lkPayReq.custrecord_scv_payment_date,
                custrecord_scv_payment_advanced_reques: lkPayReq.custrecord_scv_payment_advanced_reques?.[0]?.value,
                custrecord_scv_payment_type: lkPayReq.custrecord_scv_payment_type?.[0]?.value || '',
                custrecord_scv_payment_emp_remain: lkPayReq.custrecord_scv_payment_emp_remain,
                custrecord_scv_payreq_remaining_amt: lkPayReq.custrecord_scv_payreq_remaining_amt,
                custrecord_scv_createdfrom_pr: lkPayReq.custrecord_scv_createdfrom_pr?.[0]?.value,
                custrecord_scv_payment_payee: lkPayReq.custrecord_scv_payment_payee?.[0]?.value,
                custrecord_scv_payment_ngycau: lkPayReq.custrecord_scv_payment_ngycau?.[0]?.value,
                custrecord_scv_payment_related: lkPayReq.custrecord_scv_payment_related?.map(o => o.value) || [],
                custrecord_scv_payment_payment_code: lkPayReq.custrecord_scv_payment_payment_code?.[0]?.value
            };
        };

        const fetchAccountId = (options) => {
            const {
                subsidiary,
                currency,
                typeBank
            } = options;
            const isOne = !!subsidiary && !currency && !typeBank;
            const dataAccountBySub = fetchAccountIdWithSearchAPI(subsidiary, isOne);
            if (isOne) return dataAccountBySub;
            let vCondtionAccountType = !!typeBank ? ` accttype = '${typeBank}'` : ' 1 = 1 ';
            let vConditionCurrency = !!currency ? ` currency = '${currency}' ` : ' 1 = 1 ';
            const sqlQuery = 'SELECT id, currency, subsidiary FROM account WHERE id in (' + dataAccountBySub.join(',') + ') AND ROWNUM = 1 AND '.concat(vCondtionAccountType).concat(" AND ").concat(vConditionCurrency);
            const resultAccount = libFn.callQuery(sqlQuery, []);
            const dataAccount = resultAccount.isSuccess ? resultAccount.response : [];
            return dataAccount?.[0]?.id || '';
        };

        const fetchAccountIdWithSearchAPI = (subsidiaryId, isOne) => {
            let searchAccount = search.create({
                type: search.Type.ACCOUNT,
                filters: [
                    search.createFilter({name: 'isinactive', operator: 'is', values: false}),
                    search.createFilter({name: 'subsidiary', operator: 'anyof', values: subsidiaryId})
                ],
                columns: [
                    search.createColumn({name: 'internalid', label: 'Internal ID'}),
                    search.createColumn({name: 'subsidiary', label: 'Subsidiary'})
                ]
            });
            if (isOne) {
                return searchAccount.run().getRange(0, 1)?.[0]?.id || '';
            }
            let arrData = [];
            let pagedData = searchAccount.runPaged({pageSize: 1000});
            for (let page in pagedData.pageRanges) {
                let currentPage = pagedData.fetch(page);
                currentPage.data.forEach(function (data) {
                    arrData.push(data.id);
                });
            }
            return arrData;
        }

        const fetchDataSourcePurOrd = (poId) => {
            if (!poId) return;
            let lkPO = search.lookupFields({
                type: 'purchaseorder',
                id: poId,
                columns: [
                    // 'employee',
                    'entity',
                    'subsidiary',
                    'currency',
                    'exchangerate',
                    'memo',
                    'cseg_scv_sg_proj',
                    'custbody_scv_total_amt_bef_tolerance',
                    'custbody_scv_remaining_po'
                ]
            });
            return {
                employee: lkPO.employee?.[0]?.value,
                entity: lkPO.entity?.[0]?.value,
                subsidiary: lkPO.subsidiary?.[0]?.value,
                currency: lkPO.currency?.[0]?.value,
                exchangerate: lkPO.exchangerate,
                memo: lkPO.memo,
                cseg_scv_sg_proj: lkPO.cseg_scv_sg_proj?.[0]?.value,
                total: lkPO.custbody_scv_total_amt_bef_tolerance,
                custbody_scv_remaining_po: lkPO.custbody_scv_remaining_po
            };
        };

        const getDepartmentInEmployee = (empId) => {
            if (!empId) return;
            let lkEmp = search.lookupFields({
                type: libFn.getEntityType(empId),
                id: empId,
                columns: ['department']
            });
            return lkEmp.department?.[0]?.value;
        };

        const getDataPreference = () => {
            let userObj = runtime.getCurrentUser();
            const araccount = userObj.getPreference({name: 'ARACCOUNT'});
            return {
                araccount: araccount
            }
        };

        const fetchAccountIDOnBills = (arrTransId) => {
            let searchObj = search.load(ConsPayReq.CustomSavedSearchId.ACCOUNT_MAIN_BILLS);
            searchObj.filters.push(search.createFilter({
                name: 'internalid',
                operator: 'anyof',
                values: arrTransId
            }));
            let cols = searchObj.columns;
            let searchData = searchObj.run().getRange(0, 1);
            if (searchData.length === 0) return '';
            const indexOfAccount = 3;
            return searchData[0].getValue(cols[indexOfAccount]);
        };

        const afterSubmitTransCreateFromPaymentRequest = scriptContext => {
            setDataTransactionRelatedWithAdvanceRequest(scriptContext);
            let triggerType = scriptContext.type;
            if (triggerType === 'create' || triggerType === 'edit') {
                let newRecord = scriptContext.newRecord;
                let arrPayReqId = newRecord.getValue('custbody_scv_payment_number');
                if (!Array.isArray(arrPayReqId) || arrPayReqId.length === 0) return;
                arrPayReqId.forEach(payReqId => {
                    setRelTransToOriginPaymentRequest(payReqId, newRecord.id.toString());
                });
            } else if (triggerType === 'delete') {
                let oldRecord = scriptContext.oldRecord;
                const arrPayReqId = oldRecord.getValue('custbody_scv_payment_number');
                if (!Array.isArray(arrPayReqId) || arrPayReqId.length === 0) return;
                arrPayReqId.forEach(payReqId => {
                    setRelTransToOriginPaymentRequest(payReqId, null);
                });
            }

            // xét thêm trường hợp bỏ liên kết dntt trên giao dịch, thì update lại các giá trị trên màn hình dntt
            if (triggerType === 'edit') {
                let newRecord = scriptContext.newRecord;
                let oldRecord = scriptContext.oldRecord;
                let arrPayReqId = newRecord.getValue('custbody_scv_payment_number');
                let arrPayReqIdOld = oldRecord.getValue('custbody_scv_payment_number');
                if (!Array.isArray(arrPayReqId) || arrPayReqId.length === 0) return;
                let idsInOldNotInNew = arrPayReqIdOld.filter(id => !arrPayReqId.includes(id));
                if (idsInOldNotInNew.length === 0) return;
                idsInOldNotInNew.forEach(payReqId => {
                    setRelTransToOriginPaymentRequest(payReqId, newRecord.id.toString(), true);
                });
            }

        };

        const setDataTransactionRelatedWithAdvanceRequest = (scriptContext) => {
            try {
                const triggerType = scriptContext.type;
                let advPayReq, advPayReqOld;
                let newRecord = scriptContext.newRecord;
                let oldRecord = scriptContext.oldRecord;
                if (triggerType === 'create') {
                    advPayReq = newRecord.getValue('custbody_scv_advanced_request');
                } else if (triggerType === 'delete') {
                    advPayReqOld = oldRecord.getValue('custbody_scv_advanced_request');
                } else {
                    advPayReq = newRecord.getValue('custbody_scv_advanced_request');
                    advPayReqOld = oldRecord.getValue('custbody_scv_advanced_request');
                }
                if (!advPayReq && !advPayReqOld) return;
                if (advPayReqOld !== advPayReq) {
                    setDataPaymentRequestRelateWithTransaction(advPayReq);
                    setDataPaymentRequestRelateWithTransaction(advPayReqOld);
                } else {
                    setDataPaymentRequestRelateWithTransaction(advPayReq);
                }
            } catch (e) {
                log.error('Error setDataTransactionRelatedWithAdvanceRequest', e);
            }
        };

        const setDataPaymentRequestRelateWithTransaction = (payReqId) => {
            if (!payReqId) return;
            const objDataAmt = getObjDataAmountAdvRequest(payReqId);
            record.submitFields({
                type: ConsPayReq.CustomRecordType.PAYMENT_REQUEST,
                id: payReqId,
                values: {
                    custrecord_scv_payment_emp_check: objDataAmt.checkAmount,
                    custrecord_scv_payment_emp_deposit: objDataAmt.depositsAmount,
                    custrecord_scv_payment_emp_exreport: objDataAmt.exprepAmount,
                    custrecord_scv_payment_emp_billpay: objDataAmt.billPayAmount,
                    custrecord_scv_payment_emp_remain: objDataAmt.remaining
                },
                options: {ignoreMandatoryFields: true}
            });
        };

        const setRelTransToOriginPaymentRequest = (payReqId, transId, removeTransId = false) => {
            if (!payReqId) return;
            const lkPayReq = search.lookupFields({
                type: ConsPayReq.CustomRecordType.PAYMENT_REQUEST,
                id: payReqId,
                columns: ['custrecord_scv_payment_related']
            });
            const amountPaid = getAmountPayRequest(payReqId);
            let arrTransRelId = lkPayReq.custrecord_scv_payment_related?.map(o => o.value) || [];
            if (transId && removeTransId === false) {
                arrTransRelId = [...arrTransRelId, transId];
            } else if (transId && removeTransId === true) {
                arrTransRelId = arrTransRelId.filter(id => id !== transId);
            }
            let payAmt = search.lookupFields({
                type: 'customrecord_scv_payment',
                id: payReqId,
                columns: ['custrecord_scv_payment_amount']
            }).custrecord_scv_payment_amount * 1 || 0;
            let remainAmt = payAmt - amountPaid;
            record.submitFields({
                type: ConsPayReq.CustomRecordType.PAYMENT_REQUEST,
                id: payReqId,
                values: {
                    custrecord_scv_payment_related: arrTransRelId,
                    custrecord_scv_payr_paid_amt: amountPaid,
                    custrecord_scv_payreq_remaining_amt: remainAmt,
                },
                options: {ignoreMandatoryFields: true}
            });
        };

        const afterSubmitSetRelatedTransPaymentRequest = (context) => {
            if (context.type !== 'create') return;
            let newRec = context.newRecord;
            const idTrans = newRec.getValue('custrecord_scv_payment_po');
            if (!idTrans) return;
            const transType = libFn.getTranRecordType(idTrans);
            if (transType !== record.Type.PURCHASE_ORDER) return;
            setPaymentRequestRelatedTrans(idTrans, newRec.id, transType);
        };

        const setPaymentRequestRelatedTrans = (idTrans, payReqId, transType) => {
            const recordType = transType || libFn.getTranRecordType(idTrans);
            const lkPayReq = search.lookupFields({
                type: recordType,
                id: idTrans,
                columns: ['custbody_scv_payment_number']
            });
            let arrTransRelId = lkPayReq.custbody_scv_payment_number?.map(o => o.value) || [];
            record.submitFields({
                type: recordType,
                id: idTrans,
                values: {
                    'custbody_scv_payment_number': [...arrTransRelId, payReqId]
                },
                options: {
                    ignoreMandatoryFields: true
                }
            });
        };

        const getObjDataAmountAdvRequest = (advPayment) => {
            const colFil = 'custbody_scv_advanced_request';
            const objSavedSearchId = ConsPayReq.CustomSavedSearchId;
            const objIndexColsAmount = {
                [objSavedSearchId.EMP_CHECK]: 7,
                [objSavedSearchId.EMP_DEPOSIT]: 7,
                [objSavedSearchId.EMP_EXPENSE_REPORT]: 6,
                [objSavedSearchId.EMP_BILL_PAYMENT]: 6
            };
            const checkAmount = getAmount(objSavedSearchId.EMP_CHECK, objIndexColsAmount[objSavedSearchId.EMP_CHECK], advPayment, colFil);
            const depositsAmount = getAmount(objSavedSearchId.EMP_DEPOSIT, objIndexColsAmount[objSavedSearchId.EMP_DEPOSIT], advPayment, colFil);
            const exprepAmount = getAmount(objSavedSearchId.EMP_EXPENSE_REPORT, objIndexColsAmount[objSavedSearchId.EMP_EXPENSE_REPORT], advPayment, colFil);
            const billPayAmount = getAmount(objSavedSearchId.EMP_BILL_PAYMENT, objIndexColsAmount[objSavedSearchId.EMP_BILL_PAYMENT], advPayment, colFil)
            log.error('billPayAmount', billPayAmount);
            const remaining = checkAmount - depositsAmount - exprepAmount + billPayAmount;
            return {
                checkAmount: checkAmount,
                depositsAmount: depositsAmount,
                exprepAmount: exprepAmount,
                billPayAmount: billPayAmount,
                remaining: remaining
            }
        };

        const fetchEntityIdOnTrans = (id) => {
            if (!id) return '';
            const lkEntity = search.lookupFields({
                type: libFn.getTranRecordType(id),
                id: id,
                columns: ['entity']
            });
            return lkEntity.entity[0]?.value || '';
        };

        const getAmountPayRequest = (payReqId) => {
            let searchAmtPayReq = search.load({id: ConsPayReq.CustomSavedSearchId.PAY_REQ_PAID_AMOUNT});
            const colIndexAmount = 1;
            searchAmtPayReq.filters.push(search.createFilter({
                name: 'custbody_scv_payment_number',
                operator: search.Operator.ANYOF,
                values: payReqId
            }));
            let cols = searchAmtPayReq.columns;
            let searchData = searchAmtPayReq.run().getRange({start: 0, end: 1});
            // log.error('searchData', searchData);
            if (!searchData.length) return 0;
            return searchData[0].getValue(cols[colIndexAmount]) * 1;
        };

        const getAmount = (ssid, numCol, advPayment, colFil) => {
            log.error('ssid', ssid);
            log.error('numCol', numCol);
            log.error('advPayment', advPayment);
            log.error('colFil', colFil);
            let s = search.load({id: ssid});
            let c = s.columns;
            let f = s.filters;
            log.error('filters before', f);
            if (advPayment) f.push(search.createFilter({
                name: colFil,
                operator: search.Operator.ANYOF,
                values: advPayment
            }));
            log.error('filters', f);
            s.filters = f;
            let r = s.run().getRange({start: 0, end: 1000});
            let amount = 0;
            let l = r.length;
            for (let i = 0; i < l; i++) {
                amount = amount + (r[i].getValue(c[numCol]) * 1 || 0)
            }
            return amount;
        };

        const fetchDataSubsidiary = (id) => {
            const cacheDataSub = cache.getCache({
                name: ConsPayReq.CustomCacheData.SUBSIDIARY,
                scope: cache.Scope.PUBLIC
            });
            const dataSub = cacheDataSub.get({
                key: id,
                loader: () => {
                    return fetchDataSubsidiaryWithRecordAPI(id);
                }
            });
            if (!dataSub) return {};
            return JSON.parse(dataSub);
        };

        const fetchDataSubsidiaryWithRecordAPI = (id) => {
            const recSub = record.load({type: 'subsidiary', id: id});
            return {
                id: recSub.id,
                name: recSub.getValue('name'),
                vendorprepaymentaccount: recSub.getValue('VENDORPREPAYMENTACCOUNT')
            };
        };

        const fetchRecordPaymentRequest = (id) => record.load({type: ConsPayReq.CustomRecordType.PAYMENT_REQUEST, id});

        const parseDate = (date) => {
            if (!date) return;
            return format.parse({
                value: date,
                type: format.Type.DATE
            });
        };

        const roundNumber = (value, factor = 5) => {
            if (value === '' || value === null) return 0;
            return Number(value).toFixed(factor) * 1;
        };

        const getEmployeeIDCreator = () => {
            const userId = runtime.getCurrentUser().id;
            const entityType = libFn.getEntityType(userId);
            if (entityType === record.Type.EMPLOYEE) return userId;
            return search.lookupFields({
                type: entityType,
                id: userId,
                columns: [
                    'custentity_scv_partner_employee'
                ]
            }).custentity_scv_partner_employee?.[0]?.value || '';
        };

        const initializeDataTaxCode = () => {
            let dataTaxCode = [];
            try {
                dataTaxCode = fetchDataAllColsSavedSearch('customsearch_scv_taxcode_search')
            } catch (e) {
                log.error('initializeDataTaxCode', e);
            }
            setDataSession(ConsPayReq.CustomKeySession.DATA_TAX_CODE, dataTaxCode);
        };


        const fetchDataAllColsSavedSearch = (id, filters = []) => {
            let objSearch = search.load({id: id});
            let ss = [];
            filters.forEach(f => {
                objSearch.filters.push(f);
            });
            let columns = objSearch.columns;
            let transactionSearchPagedData = objSearch.runPaged({pageSize: 1000});
            for (let i = 0; i < transactionSearchPagedData.pageRanges.length; i++) {
                let transactionSearchPage = transactionSearchPagedData.fetch({index: i});
                transactionSearchPage.data.forEach(function (result) {
                    let obj = {};
                    columns.forEach(col => {
                        obj[col.label] = result.getValue(col);
                        try {
                            if (result.getValue(col) && result.getText(col) != null)
                                obj[col.label + '_text'] = result.getText(col);
                        } catch (e) {
                        }
                    })
                    ss.push(obj);
                });
            }
            return ss;
        };

        return {
            initializeDataPaymentRequest,
            initializeDataTransCreateFromPaymentRequest,
            afterSubmitSetRelatedTransPaymentRequest,
            afterSubmitTransCreateFromPaymentRequest,
            createMultiPaymentRequest: createMultiPaymentRequest
        }
    })
