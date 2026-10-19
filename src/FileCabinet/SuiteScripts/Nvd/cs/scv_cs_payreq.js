/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/search', 'N/runtime',
        '../cons/scv_cons_payreq', '../olib/clib'],

    function (currentRecord, search, runtime,
              ConsPayReq, clib) {
        const KEY_WORD_TAX_CODE = 'scvTaxCode';

        const CustomBodyFields = {
            AMOUNT: 'custrecord_scv_payment_amt',
            TAX_AMOUNT: 'custrecord_scv_payment_amounttax',
            PAID_AMOUNT: 'custrecord_scv_payr_paid_amt', 
            PAYMENT_AMOUNT: 'custrecord_scv_payment_amount',
            REMAIN_AMOUNT: 'custrecord_scv_payreq_remaining_amt',
            CURRENCY: 'custrecord_scv_payment_currency',
            PO_AMOUNT: 'custrecord_scv_payr_po_amt',
            PAYMENT_TYPE: 'custrecord_scv_payment_type',
            EXCHANGE_RATE: 'custrecord_scv_payment_exchangerate',
            CREATE_FROM_PO: 'custrecord_scv_payment_po',
            EMP_REMAINING_AMOUNT: 'custrecord_scv_remaining',
            ADV_AMOUNT: 'custrecord_scv_payment_advance',
            CREATED_FROM: 'custrecord_scv_payment_po',
            ADV_REQUEST: 'custrecord_scv_payment_advanced_reques',
            DISCOUNT_AMOUNT: 'custrecord_scv_payr_discount_amt',
            DAT_COC: 'custrecord_scv_payment_datcoc',
            PAYMENT_VENDOR_PREPAYMENT: 'custrecord_scv_payment_vendor_prepayment',
        };

        const CustomLineFields = {
            TAX_CODE: 'custrecord_scv_pay_detail_taxcode',
            AMOUNT: 'custrecord_scv_pay_detail_amt',
            TAX_AMOUNT: 'custrecord_scv_pay_detail_taxamt',
            GROSS_AMOUNT: 'custrecord_scv_pay_detail_gr_amt',
            QUANTITY: 'custrecord_scv_pay_detail_qty',
            RATE: 'custrecord_scv_pay_detail_rate',
            TAX_RATE: 'custrecord_scv_pay_detail_taxrate',
            QUANTITY_QC_PASS: 'custrecord_scv_pay_detail_sl_dat',
            ITEM : 'custrecord_scv_payment_item'
        };
        
        let oldName = '';
        
        /**
         * Function to be executed after page is initialized.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
         *
         * @since 2015.2
         */
        const pageInit = (scriptContext) => {
            try {
                initializeDataTaxCode();
                initializeDataPurchaseOrder(scriptContext.currentRecord);
                initializeDataInboundShipment(scriptContext.currentRecord);
                oldName = scriptContext.currentRecord.getValue({fieldId: 'name'});
            } catch (e) {
                console.log('pageInit:' + JSON.stringify(e));
            }
        }

        const initializeDataPurchaseOrder = (curRec) => {
            let objParams = getUrlVars();
            if (objParams?.btnid && objParams.btnid === ConsPayReq.CustomButtonId.DNTT) {
                let objDataPayReq = runtime.getCurrentSession().get(ConsPayReq.CustomKeySession.PAYMENT_REQUEST);
                if (typeof objDataPayReq !== 'string') return;
                objDataPayReq = JSON.parse(objDataPayReq);
                curRec.setValue(CustomBodyFields.EXCHANGE_RATE, objDataPayReq.exchangeRate, true);
            }
        };

        const initializeDataInboundShipment = (curRec) => {
            let objParams = getUrlVars();
            if (objParams?.btnid && objParams.btnid === ConsPayReq.CustomButtonId.DNTT_FROM_IB) {
                let objDataPayReq = runtime.getCurrentSession().get(ConsPayReq.CustomKeySession.PAYMENT_REQUEST);
                if (typeof objDataPayReq !== 'string') return;
                objDataPayReq = JSON.parse(objDataPayReq);
                curRec.setValue(CustomBodyFields.EXCHANGE_RATE, objDataPayReq.exchangeRate, true);
            }
        }

        const initializeDataTaxCode = () => {
            if (window.localStorage.hasOwnProperty(KEY_WORD_TAX_CODE) && window.localStorage.getItem(KEY_WORD_TAX_CODE) !== 'undefined') return;
            let dataTaxCode;
            try {
                dataTaxCode = clib.searchData('customsearch_scv_taxcode_search', [], []);
            } catch (e) {
                dataTaxCode = JSON.parse(runtime.getCurrentSession().get(ConsPayReq.CustomKeySession.DATA_TAX_CODE));
            }
            window.localStorage.setItem(KEY_WORD_TAX_CODE, JSON.stringify(dataTaxCode));
        }

        const getLocalStoredTaxCode = () => {
            if (window.localStorage.hasOwnProperty(KEY_WORD_TAX_CODE)) {
                return JSON.parse(window.localStorage.getItem(KEY_WORD_TAX_CODE));
            }
            initializeDataTaxCode();
            return getLocalStoredTaxCode();
        }

        const fieldChanged = (scriptContext) => {
            let {currentRecord, sublistId, fieldId, line} = scriptContext;
            setCacheDataCurrency(currentRecord);
            if ([CustomBodyFields.AMOUNT,
                CustomBodyFields.DISCOUNT_AMOUNT,
                CustomBodyFields.EMP_REMAINING_AMOUNT,
                CustomBodyFields.PAYMENT_VENDOR_PREPAYMENT].includes(fieldId)) {
                setDataAmountPayment(currentRecord, fieldId);
            }
                // else if (fieldId === CustomBodyFields.DISCOUNT_AMOUNT) {
                //     setDataAmountPayment(currentRecord, fieldId);
                // } else if (fieldId === CustomBodyFields.EMP_REMAINING_AMOUNT) {
                //     setDataAmountPayment(currentRecord, fieldId);
            // }
            else if (fieldId === CustomBodyFields.DAT_COC) {
                setDataAmountPaymentDatCoc(currentRecord, fieldId);
            } else if ([CustomBodyFields.ADV_AMOUNT, CustomBodyFields.DISCOUNT_AMOUNT].includes(fieldId) ) {
                setRemainAmountEMP(currentRecord);
            } else if ([CustomBodyFields.PAYMENT_AMOUNT, CustomBodyFields.PAID_AMOUNT].includes(fieldId)) {
                debugger;
                fieldChangedBodyPayAmtOrPaidAmt(currentRecord);
            } else if('custrecord_scv_payment_date' === fieldId) {
                let paymentDate = currentRecord.getValue({fieldId: fieldId});
                if(paymentDate) {
                    let newNameYearMonth = `${paymentDate.getFullYear()}/${String(paymentDate.getMonth() + 1).padStart(2, '0')}`;
                    let newName = oldName.indexOf(newNameYearMonth) === -1  ? 'TO BE GENERATED' : oldName;
                    currentRecord.setValue({fieldId: 'name', value: newName});
                }
            } else if (validCalcDataLine(currentRecord, sublistId, fieldId)) {
                setDataOnLine(currentRecord, sublistId, fieldId, line);
            }
        };

        const validateField = (scriptContext) => {
            const {sublistId, fieldId, currentRecord} = scriptContext;
            if (!sublistId || sublistId !== ConsPayReq.CustomSublistId.PAYMENT_REQUEST) return true;
            return validateLineFields(currentRecord, sublistId, fieldId);
        };

        const validateLineFields = (curRec, sublistId, fieldId) => {
            if (fieldId !== CustomLineFields.QUANTITY) return true;
            let itemId = curRec.getCurrentSublistValue({sublistId: sublistId, fieldId: CustomLineFields.ITEM});
            if (!itemId) return true;
            let lkItem = search.lookupFields({type : 'item', id: itemId, columns: ['recordtype']});
            if (lkItem.recordtype !== 'serviceitem') return true;
            let qty = curRec.getCurrentSublistValue({sublistId: sublistId, fieldId: CustomLineFields.QUANTITY});
            let qtyQCPass = curRec.getCurrentSublistValue({
                sublistId: sublistId,
                fieldId: CustomLineFields.QUANTITY_QC_PASS
            });
            // if (qtyQCPass === null || qtyQCPass === '') return true;
            if (qtyQCPass === 0) return true;
            if (+qty <= +qtyQCPass) return true;
            alert('Số lượng ĐNTT lớn hơn số lượng QC đạt.');
            return false;
        };

        const setDataOnBody = (curRec, objParams, objUpd) => {
            const {
                sublistId,
                line
            } = objParams;
            const lc = curRec.getLineCount(sublistId);
            let taxAmtLine = objUpd[CustomLineFields.TAX_AMOUNT];
            let grossAmtLine = objUpd[CustomLineFields.GROSS_AMOUNT];
            let objTotal = {taxAmt: 0, grossAmt: 0};
            for (let i = 0; i < lc; i++) {
                let taxAmt = 0, grossAmt = 0;
                if (line !== i) {
                    taxAmt = curRec.getSublistValue(sublistId, CustomLineFields.TAX_AMOUNT, i) * 1;
                    grossAmt = curRec.getSublistValue(sublistId, CustomLineFields.GROSS_AMOUNT, i) * 1;
                } else {
                    taxAmt = taxAmtLine;
                    grossAmt = grossAmtLine;
                }
                objTotal.taxAmt += taxAmt;
                objTotal.grossAmt += grossAmt;
            }
            if (line === lc) {
                objTotal.taxAmt += taxAmtLine;
                objTotal.grossAmt += grossAmtLine;
            }
            curRec.setValue(CustomBodyFields.AMOUNT, roundValue(objTotal.grossAmt), true);
            curRec.setValue(CustomBodyFields.TAX_AMOUNT, roundValue(objTotal.taxAmt), true);
            setDataAmountPayment(curRec, CustomBodyFields.AMOUNT);
        };


        const roundValue = (value, factorDiv) => {
            let tempFactor = factorDiv;
            if (typeof tempFactor === 'undefined') tempFactor = getFactorDiv();
            if (value === '' || value === null || isNaN(value)) return '';
            return Math.round(value * tempFactor) / tempFactor;
        };

        const getFactorDiv = () => window.SCV.factorDiv;

        const setCacheDataCurrency = (curRec) => {
            const CURRENCY_VND = '1';
            window.SCV = window.SCV || {};
            const currencyId = curRec.getValue(CustomBodyFields.CURRENCY);
            window.SCV.factorDiv = (CURRENCY_VND === currencyId || !currencyId) ? 1 : 100;
        };

        const setRemainAmountEMP = (curRec, isrun = true) => {
            let paymentTypeId = curRec.getValue(CustomBodyFields.PAYMENT_TYPE);
            const amount = curRec.getValue(CustomBodyFields.AMOUNT) * 1;
            const advRequestId = curRec.getValue(CustomBodyFields.ADV_REQUEST);
            const advAmount = curRec.getValue(CustomBodyFields.ADV_AMOUNT) * 1;
            const discountAmount = curRec.getValue(CustomBodyFields.DISCOUNT_AMOUNT) * 1;
            let amountRemainEmp;
            if(![ConsPayReq.CustomPaymentTypeId.TAM_UNG_NV_DI_MUA_HANG,
                ConsPayReq.CustomPaymentTypeId.HOAN_UNG_NHAN_VIEN,
                ConsPayReq.CustomPaymentTypeId.QUYET_TOAN_NV_DI_MUA_HANG]
                .includes(paymentTypeId)) return;
            // if (advRequestId) {
                amountRemainEmp = amount - advAmount - discountAmount;
            // } else {
            //     // const createdFromPOId = curRec.getValue(CustomBodyFields.CREATED_FROM);
            //     // const empRemainingAmount = getRemainAmountPO(createdFromPOId).empRemainingAmount;
            //     // amountRemainEmp = amount - empRemainingAmount;
            //     amountRemainEmp = amount - advAmount - discountAmount
            // }
            isrun ? curRec.setValue(CustomBodyFields.EMP_REMAINING_AMOUNT, roundValue(amountRemainEmp), true) : '';
        };

        const setDataAmountPaymentDatCoc = (curRec) => {
            const amountPO = curRec.getValue(CustomBodyFields.PO_AMOUNT) * 1;
            const datCoc = +String(curRec.getValue(CustomBodyFields.DAT_COC)).replace('%', '') || 0;
            const paymentAmount = amountPO * datCoc / 100;
            curRec.setValue(CustomBodyFields.PAYMENT_AMOUNT, roundValue(paymentAmount), true);
            fieldChangedBodyPayAmtOrPaidAmt(curRec);
        };

        const setDataAmountPayment = (curRec, fieldId) => {
            const paymentType = curRec.getValue(CustomBodyFields.PAYMENT_TYPE);
            const amount = curRec.getValue(CustomBodyFields.AMOUNT) * 1;
            const remainAmount = curRec.getValue(CustomBodyFields.EMP_REMAINING_AMOUNT) * 1;
            const discountAmount = curRec.getValue(CustomBodyFields.DISCOUNT_AMOUNT) * 1;
            const paymentVendorPrepayment = curRec.getValue(CustomBodyFields.PAYMENT_VENDOR_PREPAYMENT) * 1;
            if ([CustomBodyFields.EMP_REMAINING_AMOUNT, CustomBodyFields.DISCOUNT_AMOUNT, CustomBodyFields.PAYMENT_VENDOR_PREPAYMENT].includes(fieldId)
                && [ConsPayReq.CustomPaymentTypeId.HOAN_UNG_NHAN_VIEN, ConsPayReq.CustomPaymentTypeId.QUYET_TOAN_NV_DI_MUA_HANG].includes(paymentType)) {
                // && [ConsPayReq.CustomPaymentTypeId.HOAN_UNG_NHAN_VIEN, ConsPayReq.CustomPaymentTypeId.HOAN_UNG_NV_DI_MUA_HANG].includes(paymentType)) {
                // đổi tên payment type ở file dùng chung, code map đúng id nhưng loại đang check trên hệ thống là Quyết toán nv và qt nhân viên đi mua hàng
                const amountPayment = remainAmount
                    // - discountAmount
                    // - paymentVendorPrepayment;
                curRec.setValue(CustomBodyFields.PAYMENT_AMOUNT, roundValue(amountPayment), true);
                fieldChangedBodyPayAmtOrPaidAmt(curRec);
            }
            else if (amount !== 0 && [CustomBodyFields.AMOUNT, CustomBodyFields.DISCOUNT_AMOUNT].includes(fieldId)) {
                const amountPayment = amount - discountAmount - paymentVendorPrepayment;
                curRec.setValue(CustomBodyFields.PAYMENT_AMOUNT, roundValue(amountPayment), true);
                fieldChangedBodyPayAmtOrPaidAmt(curRec);
            }
            // if (![CustomBodyFields.DISCOUNT_AMOUNT, CustomBodyFields.EMP_REMAINING_AMOUNT].includes(fieldId)) {
            if (![CustomBodyFields.EMP_REMAINING_AMOUNT].includes(fieldId)) {
                setRemainAmountEMP(curRec);
            }
        };

        const fieldChangedBodyPayAmtOrPaidAmt = (curRec) => {
            const payAmt = curRec.getValue(CustomBodyFields.PAYMENT_AMOUNT) * 1;
            const paidAmt = curRec.getValue(CustomBodyFields.PAID_AMOUNT) * 1;
            curRec.setValue(CustomBodyFields.REMAIN_AMOUNT, roundValue(payAmt - paidAmt), true);
        };

        const setDataOnLine = (currentRecord, sublistId, fieldId, line) => {
            if (sublistId !== ConsPayReq.CustomSublistId.PAYMENT_REQUEST) return;

            // thanhdev edit bug fix tax amount not correct 12/12/2025
            let qty = currentRecord.getCurrentSublistValue({sublistId: sublistId, fieldId: CustomLineFields.QUANTITY});
            let rate = currentRecord.getCurrentSublistValue({sublistId: sublistId, fieldId: CustomLineFields.RATE});
            let taxRate = parseFloat(currentRecord.getCurrentSublistValue({sublistId : sublistId, fieldId: CustomLineFields.TAX_RATE})) / 100;
            let amount = currentRecord.getCurrentSublistValue({sublistId: sublistId, fieldId: CustomLineFields.AMOUNT});
            let taxAmount = 0;
            if (qty) {
                taxAmount = qty * rate  * taxRate;
            }else {
                taxAmount = amount  * taxRate;
            }
            ////// thanhdev end edit

            if ([CustomLineFields.QUANTITY, CustomLineFields.RATE].includes(fieldId)) {
                fieldChangedQtyOrRate(currentRecord, sublistId, line, taxAmount);
            } else if ([
                CustomLineFields.TAX_CODE,
                CustomLineFields.AMOUNT
            ].includes(fieldId)) {
                fieldChangedTaxCodeAndAmount(currentRecord, sublistId, fieldId, line);
            } else if (fieldId === CustomLineFields.TAX_AMOUNT) {
                fieldChangedTaxAmount(currentRecord, sublistId, line);
            } else if (fieldId === CustomLineFields.TAX_RATE) {
                fieldChangedTaxRate(currentRecord, sublistId, line, taxAmount);
            }
        };

        const validCalcDataLine = (curRec, sublistId, fieldId) => {
            if (sublistId !== ConsPayReq.CustomSublistId.PAYMENT_REQUEST) return;
            return [
                CustomLineFields.AMOUNT,
                CustomLineFields.GROSS_AMOUNT,
                CustomLineFields.TAX_AMOUNT,
                CustomLineFields.TAX_CODE,
                CustomLineFields.QUANTITY,
                CustomLineFields.TAX_RATE,
                CustomLineFields.RATE
            ].includes(fieldId);
        }

        const fieldChangedQtyOrRate = (curRec, sublistId, line, taxAmount) => {
            const qty = curRec.getCurrentSublistValue({sublistId: sublistId, fieldId: CustomLineFields.QUANTITY});
            const rate = curRec.getCurrentSublistValue({sublistId: sublistId, fieldId: CustomLineFields.RATE});
            // let taxRate = parseFloat(curRec.getCurrentSublistValue({
            //     sublistId: sublistId,
            //     fieldId: CustomLineFields.TAX_RATE
            // }));
            // if (isNaN(taxRate)) taxRate = 0;
            let amount = qty * rate;
            // let taxAmount = amount * taxRate / 100;
            taxAmount = roundValue(taxAmount);
            amount = roundValue(amount);
            let grossAmount = amount + taxAmount;
            grossAmount = roundValue(grossAmount);
            curRec.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: CustomLineFields.AMOUNT,
                value: amount,
                ignoreFieldChange: true
            });
            curRec.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: CustomLineFields.TAX_AMOUNT,
                value: taxAmount,
                ignoreFieldChange: true
            });
            curRec.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: CustomLineFields.GROSS_AMOUNT,
                value: grossAmount,
                ignoreFieldChange: true
            });
            let objUpd = {};
            objUpd[CustomLineFields.GROSS_AMOUNT] = grossAmount;
            objUpd[CustomLineFields.TAX_AMOUNT] = taxAmount;
            setDataOnBody(curRec, {sublistId, line}, objUpd);
        }

        const fieldChangedTaxCodeAndAmount = (curRec, sublistId, fieldId, line) => {
            const taxCode = curRec.getCurrentSublistValue({sublistId: sublistId, fieldId: CustomLineFields.TAX_CODE});
            let taxRate = getTaxRate(taxCode);
            let amount = curRec.getCurrentSublistValue({sublistId: sublistId, fieldId: CustomLineFields.AMOUNT});
            const isChangedAmount = fieldId === CustomLineFields.AMOUNT;
            if (isChangedAmount) {
                taxRate = parseFloat(curRec.getCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: CustomLineFields.TAX_RATE
                }));
                isNaN(taxRate) ? taxRate = 0 : '';
            }
            let taxAmount = amount * taxRate / 100;
            let grossAmount = amount + taxAmount;
            if (!isChangedAmount) {
                curRec.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: CustomLineFields.TAX_RATE,
                    value: roundValue(taxRate),
                    ignoreFieldChange: true
                });
            }
            taxAmount = roundValue(taxAmount);
            grossAmount = roundValue(grossAmount);
            curRec.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: CustomLineFields.TAX_AMOUNT,
                value: taxAmount,
                ignoreFieldChange: true
            });
            curRec.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: CustomLineFields.GROSS_AMOUNT,
                value: grossAmount,
                ignoreFieldChange: true
            });
            let objUpd = {};
            objUpd[CustomLineFields.GROSS_AMOUNT] = grossAmount;
            objUpd[CustomLineFields.TAX_AMOUNT] = taxAmount;
            setDataOnBody(curRec, {sublistId, fieldId, line,}, objUpd);
        }

        const fieldChangedTaxAmount = (curRec, sublistId, line) => {
            const amount = curRec.getCurrentSublistValue({sublistId: sublistId, fieldId: CustomLineFields.AMOUNT}) * 1;
            let taxAmount = curRec.getCurrentSublistValue({
                sublistId: sublistId,
                fieldId: CustomLineFields.TAX_AMOUNT
            }) * 1;
            let grossAmount = roundValue(amount + taxAmount);
            curRec.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: CustomLineFields.GROSS_AMOUNT,
                value: grossAmount,
                ignoreFieldChange: true
            });
            let objUpd = {};
            objUpd[CustomLineFields.GROSS_AMOUNT] = grossAmount;
            objUpd[CustomLineFields.TAX_AMOUNT] = taxAmount;
            setDataOnBody(curRec, {sublistId, line,}, objUpd);
        }

        const fieldChangedTaxRate = (curRec, sublistId, line, taxAmount) => {
            const amount = curRec.getCurrentSublistValue({sublistId: sublistId, fieldId: CustomLineFields.AMOUNT}) * 1;
            // const taxRate = curRec.getCurrentSublistValue({sublistId: sublistId, fieldId: CustomLineFields.TAX_RATE});
            // let taxAmount = roundValue(amount * taxRate / 100);
            let grossAmount = roundValue(amount + taxAmount);
            curRec.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: CustomLineFields.TAX_AMOUNT,
                value: taxAmount,
                ignoreFieldChange: true
            });
            curRec.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: CustomLineFields.GROSS_AMOUNT,
                value: grossAmount,
                ignoreFieldChange: true
            });
            let objUpd = {};
            objUpd[CustomLineFields.GROSS_AMOUNT] = grossAmount;
            objUpd[CustomLineFields.TAX_AMOUNT] = taxAmount;
            setDataOnBody(curRec, {sublistId, line}, objUpd);
        };

        const getTaxRate = (taxCodeId) => {
            let f = getLocalStoredTaxCode().find(o => String(o['Internal ID']) === String(taxCodeId));
            let rate = f?.Rate || '0';
            return rate.replace('%', '');
        };

        const sublistChanged = (scriptContext) => {
            try {
                const operation = scriptContext.operation;
                const factor = operation === 'remove' ? -1 : 1;
                setDataTotalAmountSublistChanged(scriptContext, factor)
            } catch (e) {
                console.error(JSON.stringify(e));
            }
        };

        const setDataTotalAmountSublistChanged = (scriptContext, factor = 1) => {
            let curRecLine = scriptContext.currentRecord;
            let sublistId = scriptContext.sublistId;
            if (sublistId !== ConsPayReq.CustomSublistId.PAYMENT_REQUEST) return;
            let grossAmount = curRecLine.getCurrentSublistValue({
                sublistId: sublistId,
                fieldId: CustomLineFields.GROSS_AMOUNT
            });
            let taxAmt = curRecLine.getCurrentSublistValue({
                sublistId: sublistId,
                fieldId: CustomLineFields.TAX_AMOUNT
            });
            let lineId = curRecLine.getCurrentSublistValue({sublistId: sublistId, fieldId: 'line'});
            let curRec = currentRecord.get();
            let lineCount = curRec.getLineCount(sublistId);
            let totalAmount = 0, totalTaxAmt = 0;
            for (let i = 0; i < lineCount; i++) {
                let lineGrossAmount = curRec.getSublistValue({
                    sublistId: sublistId,
                    fieldId: CustomLineFields.GROSS_AMOUNT,
                    line: i
                }) * 1;
                let lineTaxAmt = curRec.getSublistValue({
                    sublistId: sublistId,
                    fieldId: CustomLineFields.TAX_AMOUNT,
                    line: i
                }) * 1;
                if (i === lineId) {
                    lineGrossAmount = grossAmount * factor;
                    lineTaxAmt = taxAmt * factor;
                }
                totalAmount += lineGrossAmount;
                totalTaxAmt += lineTaxAmt;
            }
            curRec.setValue(CustomBodyFields.AMOUNT, roundValue(totalAmount), true);
            curRec.setValue(CustomBodyFields.TAX_AMOUNT, roundValue(totalTaxAmt), true);
            setDataAmountPayment(curRec, CustomBodyFields.AMOUNT);
        };

        /**
         * Validation function to be executed when record is saved.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @returns {boolean} Return true if record is valid
         *
         * @since 2015.2
         */
        const saveRecord = (scriptContext) => {
            let objParams = getUrlVars();
            let {
                currentRecord
            } = scriptContext;
            const resultValidConfirm = getDataValidConfirmBeforeSaved(currentRecord, objParams?.id);
            if (resultValidConfirm.isValid) {
                confirm(resultValidConfirm.content);
                return false
            }
            return true;
        }

        const getDataValidConfirmBeforeSaved = (currentRecord, id) => {
            let objRes = {
                isValid: false,
                content: null
            };
            if (!!id) return objRes;
            const poId = currentRecord.getValue({fieldId: CustomBodyFields.CREATED_FROM});
            let remainAmt = getRemainAmountPO(poId).remainingAmount;
            const payTypeId = currentRecord.getValue({fieldId: CustomBodyFields.PAYMENT_TYPE});
            const arrPayTypeId = [ConsPayReq.CustomPaymentTypeId.TAM_UNG_NCC, ConsPayReq.CustomPaymentTypeId.TAM_UNG_NV_DI_MUA_HANG];
            const amount = currentRecord.getValue({fieldId: CustomBodyFields.PAYMENT_AMOUNT}) * 1;
            if (!arrPayTypeId.includes(payTypeId)) return objRes;
            if (payTypeId === ConsPayReq.CustomPaymentTypeId.TAM_UNG_NCC) {
                const poAmt = currentRecord.getValue({fieldId: CustomBodyFields.PO_AMOUNT});
                if (poAmt === '' || poAmt === null) return objRes;
            }
            if (payTypeId === ConsPayReq.CustomPaymentTypeId.TAM_UNG_NCC) {
                const amount = currentRecord.getValue({fieldId: CustomBodyFields.PAYMENT_AMOUNT}) * 1;
                const poAmt = currentRecord.getValue({fieldId: CustomBodyFields.PO_AMOUNT}) * 1;
                if (amount <= poAmt) return objRes;
            } else {
                if (amount <= remainAmt) return objRes;
            }

            if(payTypeId === ConsPayReq.CustomPaymentTypeId.TAM_UNG_NV_DI_MUA_HANG) {
               const oke = getPoTamUngData(currentRecord, amount);

               if(oke) return objRes;
            }

            objRes.isValid = true;
            objRes.content = 'Số tiền tạm ứng lớn hơn số tiền PO';
            return objRes;
        }

        const getPoTamUngData = (currentRecord, amount) => {
            let id_custrecord_scv_createdfrom_pr = currentRecord.getValue({fieldId: 'custrecord_scv_createdfrom_pr'});
            if (!id_custrecord_scv_createdfrom_pr) return false;

            const transType = getTransactionType(id_custrecord_scv_createdfrom_pr);
            if (transType !== 'purchaseorder') return 0;
            let lkPO = search.lookupFields({
                type: 'purchaseorder',
                id: id_custrecord_scv_createdfrom_pr,
                columns: ['total', 'custbody_scv_emp_refund_amt', 'custbody_scv_emp_remaining_amt']
            });
            log.error('lkPO', lkPO);
            return  amount <= (( lkPO.total * 1)  - ( lkPO.custbody_scv_emp_refund_amt * 1 ) - (lkPO.custbody_scv_emp_remaining_amt * 1) )
        }

        const getRemainAmountPO = (id) => {
            let result = {empRemainingAmount: 0, remainingAmount: 0};
            if (!id) return result;
            const transType = getTransactionType(id);
            if (transType !== 'purchaseorder') return 0;
            let lkPO = search.lookupFields({
                type: 'purchaseorder',
                id: id,
                columns: ['custbody_scv_emp_remaining_amt', 'custbody_scv_remaining_po']
            });
            return {
                empRemainingAmount: lkPO.custbody_scv_emp_remaining_amt * 1,
                remainingAmount: lkPO.custbody_scv_remaining_po * 1
            };
        };

        const getTransactionType = id => {
            let lkF = search.lookupFields({
                type: search.Type.TRANSACTION, id: id, columns: ['type', 'recordtype']
            });
            return lkF.recordtype;
        };

        const getUrlVars = () => {
            let vars = {};
            window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
                vars[key] = value;
            });
            return vars;
        };

        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            validateField: validateField,
            saveRecord: saveRecord,
            sublistChanged: sublistChanged,
        };

    });
