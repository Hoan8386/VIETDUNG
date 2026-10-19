/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/runtime', 'N/search', 'N/url',
        '../lib/scv_lib_payreq.js', '../cons/scv_cons_payreq.js', '../lib/scv_lib_amount_in_word.js'
        ],
    
    (record, runtime, search, url,
        lpr, ConsPayReq, laiw) => {
        
        /**
         * Defines the function definition that is executed before record is loaded.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @param {Form} scriptContext.form - Current form
         * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
         * @since 2015.2
         */
        const beforeLoad = (scriptContext) => {
            const triggerType = scriptContext.type;
            if (triggerType === 'create') {
                let newRecord = scriptContext.newRecord;
                let params = scriptContext.request?.parameters || {};
                lpr.initializeDataPaymentRequest(newRecord, params);

            } else if (triggerType === 'view') {
                let form = scriptContext.form;
                let newRecord = scriptContext.newRecord;
                addBtnVendorPrepayment(form, newRecord);
                addBtnEnterBill(form, newRecord);
                addBtnExpenseReport(form, newRecord);
                addBtnLCWriteCheck(form, newRecord);
                addBtnCreditMemo(form, newRecord);
                addBtnDeposit(form, newRecord);
                addBtnBillPayment(form, newRecord);
                addBtnBillCredit(form, newRecord);
                addBtnQuyetToan(form, newRecord);
                addBtnJournalEntry(form, newRecord);
                addBtnCustomerRefund(form, newRecord);
            }
        }
        
        const checkStatusRelatedTrans = (arrRelTransId) => {
            let searchObj = search.load('customsearch_scv_transaction_bill');
            searchObj.filters.push(search.createFilter({
                name: 'internalid',
                operator: 'anyof',
                values: arrRelTransId
            }));
            return searchObj.run().getRange(0, 1).length > 0;
        };
        
        const isTransformItemReceipt = (idPayReq) => {
            return search.create({
                type: 'customrecord_scv_payment_detail',
                filters: [
                    ['custrecord_scv_pay', 'is', idPayReq], 'and',
                    ['isinactive', 'is', 'F'], 'and',
                    ['custrecord_scv_pay_so_key_code', 'noneof', '@NONE@']
                ],
                columns: [
                    'internalid'
                ]
            }).run().getRange(0, 1).length;
        };
        
        const addBtnBillPayment = (form, newRecord) => {
            const objData = getDataSourcePayReq(newRecord);
            if (![
                ConsPayReq.CustomStatusId.APPROVED,
                ConsPayReq.CustomStatusId.PENDING_ACC_APPROVAL,
                ConsPayReq.CustomStatusId.PENDING_CHIEF_ACC_APPROVAL,
                ConsPayReq.CustomStatusId.PENDING_DEPUTY_ACC_APPROVAL
            ].includes(objData.status)) return;
            const isPayTypeThanhToanCN = ConsPayReq.CustomPaymentTypeId.THANH_TOAN_CONG_NO === objData.paymentType;
            const isPayTypeHoanUngNV = ConsPayReq.CustomPaymentTypeId.HOAN_UNG_NHAN_VIEN === objData.paymentType && objData.paymentAmount > 0;
            if (!isPayTypeThanhToanCN && !isPayTypeHoanUngNV) return;
            if (objData.arrTransRelId.length === 0) return;
            if (objData.paymentAmount <= objData.paidAmount) return;
            //if (checkStatusRelatedTrans(objData.arrTransRelId)) return;
            let urlLink = url.resolveRecord({
                recordType: 'vendorpayment',
                recordId: null,
                params: {
                    createFromId: newRecord.id,
                    createFromType: newRecord.type,
                    btnid: ConsPayReq.CustomButtonId.BILL_PAYMENT
                }
            });
            form.addButton({
                id: 'custpage_btn_billpayment',
                label: 'Bill Payment',
                functionName: `window.location.replace('${urlLink}')`
            });
        };
        
        const isRoleAccess = () => {
            const roleID = runtime.getCurrentUser().role;
            let searchObj = search.load({
                id: 'customsearch_scv_role_dntt',
                type: 'role'
            });
            searchObj.filters.push(search.createFilter({
                name: 'internalid',
                operator: 'anyof',
                values: roleID
            }));
            return searchObj.run().getRange(0, 1).length > 0;
        };
        
        const addBtnQuyetToan = (form, newRecord) => {
            //thanhdev remove role criteria 4/4/2025
            //if (!isRoleAccess()) return;
            const empRemainAmt = newRecord.getValue('custrecord_scv_payment_emp_remain') * 1;
            if (empRemainAmt <= 0) return;
            let urlLink = url.resolveRecord({
                recordType: ConsPayReq.CustomRecordType.PAYMENT_REQUEST,
                recordId: null,
                params: {
                    createFromId: newRecord.id,
                    createFromType: newRecord.type,
                    btnid: ConsPayReq.CustomButtonId.QUYET_TOAN
                }
            });
            form.addButton({
                id: 'custpage_btn_quyettoan',
                label: 'Quyết toán',
                functionName: `window.location.replace('${urlLink}')`
            });
        };
        
        const addBtnBillCredit = (form, newRecord) => {
            const objData = getDataSourcePayReq(newRecord);
            if (objData.discountAmount <= 0) {
                if (ConsPayReq.CustomPaymentTypeId.QUYET_TOAN_NV_DI_MUA_HANG !== objData.paymentType) return;
                if (![
                    ConsPayReq.CustomStatusId.APPROVED,
                    ConsPayReq.CustomStatusId.PENDING_ACC_APPROVAL
                ].includes(objData.status)) return;
                if (objData.arrTransRelId.length === 0) return;
            }
            if (objData.amount === objData.paidAmount) return;
            let urlLink = url.resolveRecord({
                recordType: 'vendorcredit',
                recordId: null,
                params: {
                    createFromId: newRecord.id,
                    createFromType: newRecord.type,
                    btnid: ConsPayReq.CustomButtonId.BILL_CREDIT
                }
            });
            form.addButton({
                id: 'custpage_btn_billcredit',
                label: 'Tạo giảm trừ công nợ',//Tạo cấn trừ hoàn ứng
                functionName: `window.location.replace('${urlLink}')`
            });
        };
        
        const addBtnCustomerRefund = (form, newRecord) => {
            const objData = getDataSourcePayReq(newRecord);
            if (objData.remainAmt === 0 || objData.isPaymentDTT) return;
            if (![
                ConsPayReq.CustomStatusId.APPROVED,
                ConsPayReq.CustomStatusId.PENDING_ACC_APPROVAL,
                ConsPayReq.CustomStatusId.PENDING_CHIEF_ACC_APPROVAL,
                ConsPayReq.CustomStatusId.PENDING_DEPUTY_ACC_APPROVAL
            ].includes(objData.status)) return;
            if (![
                ConsPayReq.CustomPaymentTypeId.TRA_TIEN_KH
            ].includes(objData.paymentType)) return;
            let urlLink = url.resolveRecord({
                recordType: 'customerrefund',
                recordId: null,
                params: {
                    createFromId: newRecord.id,
                    createFromType: newRecord.type,
                    btnid: ConsPayReq.CustomButtonId.CUSTOMER_REFUND
                }
            });
            form.addButton({
                id: 'custpage_btn_tpkt',
                label: 'Hoàn tiền KH',
                functionName: `window.location.replace('${urlLink}')`
            });
        };
        
        const addBtnJournalEntry = (form, newRecord) => {
            if (!isRoleAccess()) return;
            const objData = getDataSourcePayReq(newRecord);
            if (![
                ConsPayReq.CustomStatusId.APPROVED,
                ConsPayReq.CustomStatusId.PENDING_ACC_APPROVAL,
                ConsPayReq.CustomStatusId.PENDING_CHIEF_ACC_APPROVAL,
                ConsPayReq.CustomStatusId.PENDING_DEPUTY_ACC_APPROVAL
            ].includes(objData.status)) return;
            if (![
                ConsPayReq.CustomPaymentTypeId.CHI_KHAC,
                ConsPayReq.CustomPaymentTypeId.HOAN_UNG_NHAN_VIEN,
                ConsPayReq.CustomPaymentTypeId.QUYET_TOAN_NV_DI_MUA_HANG
            ].includes(objData.paymentType)) return;
            
            let urlLink = url.resolveRecord({
                recordType: 'journalentry',
                recordId: null,
                params: {
                    createFromId: newRecord.id,
                    createFromType: newRecord.type,
                    btnid: ConsPayReq.CustomButtonId.JOURNAL_ENTRY
                }
            });
            form.addButton({
                id: 'custpage_btn_tao_phieu_kt',
                label: 'Tạo phiếu kế toán',
                functionName: `window.location.replace('${urlLink}')`
            });
        };
        
        const addBtnDeposit = (form, newRecord) => {
            const objData = getDataSourcePayReq(newRecord);
            if (objData.remainAmt === 0) return;
            if (![
                ConsPayReq.CustomRoleId.NVD_THU_QUY,
                ConsPayReq.CustomRoleId.ADMINISTRATOR
            ].includes(runtime.getCurrentUser().role.toString())) return;
            if (![
                ConsPayReq.CustomStatusId.APPROVED,
                ConsPayReq.CustomStatusId.PENDING_ACC_APPROVAL,
                ConsPayReq.CustomStatusId.PENDING_CHIEF_ACC_APPROVAL, ConsPayReq.CustomStatusId.PENDING_DEPUTY_ACC_APPROVAL
            ].includes(objData.status)) return;
            if (![
                ConsPayReq.CustomPaymentTypeId.HOAN_UNG_NHAN_VIEN,
                ConsPayReq.CustomPaymentTypeId.QUYET_TOAN_NV_DI_MUA_HANG
            ].includes(objData.paymentType)) return;
            if (objData.paymentAmount >= 0) return;
            let urlLink = url.resolveRecord({
                recordType: 'deposit',
                recordId: null,
                params: {
                    createFromId: newRecord.id,
                    createFromType: newRecord.type,
                    btnid: ConsPayReq.CustomButtonId.DEPOSIT
                }
            });
            form.addButton({
                id: 'custpage_btn_deposit',
                label: 'Thu Hoàn ứng',
                functionName: `window.location.replace('${urlLink}')`
            });
        };
        
        
        const addBtnCreditMemo = (form, newRecord) => {
            const objData = getDataSourcePayReq(newRecord);
            if (![
                ConsPayReq.CustomStatusId.APPROVED,
                ConsPayReq.CustomStatusId.PENDING_ACC_APPROVAL,
                ConsPayReq.CustomStatusId.PENDING_CHIEF_ACC_APPROVAL, ConsPayReq.CustomStatusId.PENDING_DEPUTY_ACC_APPROVAL
            ].includes(objData.status)) return;
            if (
                ConsPayReq.CustomPaymentTypeId.CAN_TRU_CONG_NO !== objData.paymentType &&
                ConsPayReq.CustomPaymentTypeId.TRA_TIEN_KH !== objData.paymentType
            ) return;
            let urlLink = url.resolveRecord({
                recordType: 'creditmemo',
                recordId: null,
                params: {
                    createFromId: newRecord.id,
                    createFromType: newRecord.type,
                    btnid: ConsPayReq.CustomButtonId.CREDIT_MEMO
                }
            });
            form.addButton({
                id: 'custpage_btn_creditmemo',
                label: 'Credit Memo',
                functionName: `window.location.replace('${urlLink}')`
            });
        }
        
        const addBtnLCWriteCheck = (form, newRecord) => {
            const objData = getDataSourcePayReq(newRecord);
            if (![
                ConsPayReq.CustomStatusId.APPROVED,
                ConsPayReq.CustomStatusId.PENDING_ACC_APPROVAL,
                ConsPayReq.CustomStatusId.PENDING_CHIEF_ACC_APPROVAL, ConsPayReq.CustomStatusId.PENDING_DEPUTY_ACC_APPROVAL
            ].includes(objData.status)) return;
            const isTUNV = [
                ConsPayReq.CustomPaymentTypeId.TAM_UNG_NHAN_VIEN,
                ConsPayReq.CustomPaymentTypeId.TAM_UNG_NV_DI_MUA_HANG,
                ConsPayReq.CustomPaymentTypeId.QUYET_TOAN_NV_DI_MUA_HANG
            ].includes((objData.paymentType));
            if (objData.paidAmount === objData.paymentAmount) return;
            const isQTNVDMH = ConsPayReq.CustomPaymentTypeId.QUYET_TOAN_NV_DI_MUA_HANG === objData.paymentType;
            if (isQTNVDMH && objData.paymentAmount < 0) return;
            const isChiKhac = [ConsPayReq.CustomPaymentTypeId.CHI_KHAC].includes((objData.paymentType));
            if (!isTUNV && !isChiKhac) return;
            const btnIdLC = isTUNV ? ConsPayReq.CustomButtonId.WRITE_CHECK_TUNV : ConsPayReq.CustomButtonId.WRITE_CHECK_CHI_KHAC;
            let urlLink = url.resolveRecord({
                recordType: ConsPayReq.CustomRecordType.LC_WRITE_CHECK,
                recordId: null,
                params: {createFromId: newRecord.id, createFromType: newRecord.type, btnid: btnIdLC}
            });
            form.addButton({
                id: 'custpage_btn_lc',
                label: 'Tạo Lệnh chi',
                functionName: `window.location.replace('${urlLink}')`
            });
        }
        
        const addBtnExpenseReport = (form, newRecord) => {
            const objData = getDataSourcePayReq(newRecord);
            const arrRelTransId = newRecord.getValue('custrecord_scv_payment_related');
            if (arrRelTransId.length > 0) {
                const objDataExp = getDataExpenseAmt(arrRelTransId);
                if (objDataExp.isValid && objDataExp.amount === objData.amount) return;
            }
            if (![
                ConsPayReq.CustomStatusId.APPROVED,
                ConsPayReq.CustomStatusId.PENDING_ACC_APPROVAL
            ].includes(objData.status)) return;
            if (ConsPayReq.CustomPaymentTypeId.HOAN_UNG_NHAN_VIEN !== objData.paymentType) return;
            let urlLink = url.resolveRecord({
                recordType: 'expensereport',
                recordId: null,
                params: {
                    createFromId: newRecord.id,
                    createFromType: newRecord.type,
                    btnid: ConsPayReq.CustomButtonId.EXPENSE_REPORT
                }
            });
            form.addButton({
                id: 'custpage_btn_expensereport',
                label: 'Enter Expense Report',
                functionName: `window.location.replace('${urlLink}')`
            });
        };
        
        const getDataExpenseAmt = (arrIdExpense) => {
            let searchObj = search.load({id: 'customsearch_scv_ss_expense_amt'});
            searchObj.filters.push(search.createFilter({
                name: 'internalid',
                operator: 'anyof',
                values: arrIdExpense
            }));
            let searchData = searchObj.run().getRange(0, 1000);
            const szData = searchData.length;
            let amount = 0;
            let cols = searchObj.columns;
            for (let i = 0; i < szData; i++) {
                amount += searchData[i].getValue(cols[0]) * 1;
            }
            return {
                isValid: szData > 0,
                amount: amount
            }
        };
        
        const addBtnEnterBill = (form, newRecord) => {
            const objData = getDataSourcePayReq(newRecord);
            if (![
                ConsPayReq.CustomStatusId.APPROVED, ConsPayReq.CustomStatusId.PENDING_ACC_APPROVAL,
                ConsPayReq.CustomStatusId.PENDING_CHIEF_ACC_APPROVAL, ConsPayReq.CustomStatusId.PENDING_DEPUTY_ACC_APPROVAL
            ].includes(objData.status)) return;
            if (![ConsPayReq.CustomPaymentTypeId.THANH_TOAN_CONG_NO, ConsPayReq.CustomPaymentTypeId.QUYET_TOAN_NV_DI_MUA_HANG].includes(objData.paymentType)) return;
            // if (objData.arrTransRelId.length > 0) return;

            if (objData.arrTransRelText.some(text => text.toLowerCase().includes('bill #')) && sumBillEqualAmount(objData)) return;

            let isTransformPO = isTransformItemReceipt(newRecord.id.toString());
            let btnId;
            let urlLink;
            if (isTransformPO) {
                btnId = ConsPayReq.CustomButtonId.BILL_TRANSFORM_PO;
                urlLink = url.resolveScript({
                    scriptId: ConsPayReq.CustomScriptId.SL_SCRIPT_CREATE_BILL_FROM_PAYMENT,
                    deploymentId: ConsPayReq.CustomScriptId.SL_DEPLOY_CREATE_BILL_FROM_PAYMENT,
                    params: {createFromId: newRecord.id, createFromType: newRecord.type, btnid: btnId}
                });
            } else {
                btnId = ConsPayReq.CustomButtonId.BILL;
                urlLink = url.resolveRecord({
                    recordType: 'vendorbill',
                    recordId: null,
                    params: {createFromId: newRecord.id, createFromType: newRecord.type, btnid: btnId}
                });
            }
            form.addButton({
                id: 'custpage_btn_enterbill',
                label: 'Tạo HĐ công nợ',
                functionName: `window.location.replace('${urlLink}')`
            });
        };

        const sumBillEqualAmount = (objData) => {
            const custrecord_scv_payment_amt = objData.amount;
            const mappedRelatedTransactions = objData.arrTransRelId.map((id, index) => ({
                id: id,
                text: objData.arrTransRelText[index]
            }));
            const arrBill = mappedRelatedTransactions.filter(item => item.text.toLowerCase().includes('bill #'));
            if(arrBill.length === 0) return false;

            const userTotals = arrBill.map(item => {
                const userTotal = record.load({
                    type: 'vendorbill',
                    id: item.id,
                });
                return {
                    id: item.id,
                    userTotal: userTotal.getValue('usertotal')
                };
            });
            const total = userTotals.reduce((sum, item) => sum + (item.userTotal ? parseFloat(item.userTotal) : 0), 0);
            return  custrecord_scv_payment_amt <= total ;
        };
        
        const addBtnVendorPrepayment = (form, newRecord) => {
            const objData = getDataSourcePayReq(newRecord);
            if (![
                ConsPayReq.CustomStatusId.APPROVED,
                ConsPayReq.CustomStatusId.PENDING_ACC_APPROVAL,
                ConsPayReq.CustomStatusId.PENDING_CHIEF_ACC_APPROVAL,
                ConsPayReq.CustomStatusId.PENDING_DEPUTY_ACC_APPROVAL
            ].includes(objData.status)) return;
            if (ConsPayReq.CustomPaymentTypeId.TAM_UNG_NCC !== objData.paymentType) return;
            if (objData.paidAmount === objData.paymentAmount) return;
            let urlLink = url.resolveRecord({
                recordType: 'vendorprepayment',
                recordId: null,
                params: {
                    createFromId: newRecord.id,
                    createFromType: newRecord.type,
                    btnid: ConsPayReq.CustomButtonId.VENDOR_PREPAYMENT
                }
            });
            form.addButton({
                id: 'custpage_btn_vendor_prepayment',
                label: 'Tạo phiếu chi',
                functionName: `window.location.replace('${urlLink}')`
            });
        };
        
        const getDataSourcePayReq = (curRec) => {
            const status = curRec.getValue('custrecord_scv_payment_status');
            const paymentType = curRec.getValue('custrecord_scv_payment_type');
            const paymentDTT = curRec.getValue('custrecord_scv_payment_dtt');
            const poId = curRec.getValue('custrecord_scv_payment_po');
            const arrTransRelId = curRec.getValue('custrecord_scv_payment_related');
            const arrTransRelText = curRec.getText('custrecord_scv_payment_related');
            const paymentAmount = curRec.getValue('custrecord_scv_payment_amount') * 1;
            const amount = curRec.getValue('custrecord_scv_payment_amt') * 1;
            const paidAmount = curRec.getValue('custrecord_scv_payr_paid_amt') * 1;
            const remainAmt = curRec.getValue('custrecord_scv_payreq_remaining_amt') * 1 || 0;
            const discountAmount = curRec.getValue('custrecord_scv_payr_discount_amt') * 1 || 0;
            return {
                poId,
                status,
                isPaymentDTT: paymentDTT === 'T' || paymentDTT === true,
                paymentType,
                paymentAmount,
                amount,
                paidAmount,
                arrTransRelId,
                arrTransRelText,
                discountAmount,
                remainAmt
            };
        };
        
        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (scriptContext) => {
            updateAmountInWord(scriptContext);
        }
        
        const updateAmountInWord = (scriptContext) => {
            let triggerType = scriptContext.type;
            if (!['create', 'edit'].includes(triggerType)) return;
            let newRecord = scriptContext.newRecord;
            const payAmt = newRecord.getValue('custrecord_scv_payment_amount') * 1;
            const paidAmt = newRecord.getValue('custrecord_scv_payr_paid_amt') * 1;
            newRecord.setValue('custrecord_scv_payreq_remaining_amt', payAmt - paidAmt);
            const currencyId = newRecord.getValue('custrecord_scv_payment_currency');
            const ruleRead = (currencyId === '1' || !currencyId) ? 'VND' : 'USD';
            const amount = newRecord.getValue('custrecord_scv_payment_amount') * 1;
            newRecord.setValue('custrecord_scv_payment_amount_in_word', laiw.DocTienBangChu(amount, ruleRead));
            newRecord.setValue('custrecord_scv_payment_amount_in_word_en', laiw.toAmountInWorld(amount, ruleRead));
        }
        
        /**
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const afterSubmit = (scriptContext) => {
            if (scriptContext.type === 'create') {
                lpr.afterSubmitSetRelatedTransPaymentRequest(scriptContext);
                let newRecord = scriptContext.newRecord;
                let inboundId = newRecord.getValue('custrecord_scv_payr_inbound');
                let recordId = newRecord.id
                if(inboundId){
                    let inboundShipment = record.load({
                        type: 'inboundshipment',
                        id: inboundId,
                        isDynamic: false,
                        suppressTriggers: true
                    });
                    inboundShipment.setValue({
                        fieldId: 'custrecord_scv_inbound_dntt',
                        value: recordId
                    });
                    inboundShipment.save();
                }


            }
        }
        
        return {beforeLoad, beforeSubmit, afterSubmit}
        
    });
