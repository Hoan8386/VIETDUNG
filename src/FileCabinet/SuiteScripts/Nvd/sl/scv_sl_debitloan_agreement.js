/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['../olib/slib', 'N/record', 'N/redirect', 'N/search'],

    (slib, record, redirect, search) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            try {
                let params = scriptContext.request.parameters;
                let buttontype = params.buttontype;
                switch (buttontype) {
                    case 'acceptpaymentloan':
                        doAcceptPaymentLoan(scriptContext);
                        break;
                    case 'deposit':
                        doCreateDeposit(scriptContext);
                        break;
                    case 'payment':
                        doCreateBillPayment(scriptContext);
                        break;
                    case 'paymentvendor':
                        doCreatePaymentVendor(scriptContext);
                        break;
                }
            } catch (e) {
                log.error('onRequest error', e);
                slib.writeErrorPage(scriptContext.response, e.message, e.stack);
            }
        }

        function doAcceptPaymentLoan(scriptContext) {
            let params = scriptContext.request.parameters;
            let recid = params.recid;

            let body = ['custrecord_scv_loa_entity', 'custrecord_scv_loa_subsidiary', 'custrecord_scv_loa_currency', 'custrecord_scv_loa_exchange_rate',
                'custrecord_scv_loa_end_date', 'custrecord_scv_loa_date', 'custrecord_scv_foreign_amt', 'custrecord_scv_loa_memo', 'custrecord_scv_loa_account_debitloan',
                'custrecord_scv_loa_inter_account', 'custrecord_scv_loa_account_bank'];
            let loanRecord = record.load({type: 'customrecord_scv_loa', id: recid});
            let loanRecordData = slib.getRecordData(loanRecord, '', body, []);
            let location = '';
            //create bill
            let options = {
                entity: loanRecordData.body.custrecord_scv_loa_entity,
                subsidiary: loanRecordData.body.custrecord_scv_loa_subsidiary,
                custbody_scv_loa: recid,
                currency: loanRecordData.body.custrecord_scv_loa_currency,
                exchangerate: loanRecordData.body.custrecord_scv_loa_exchange_rate,
                duedate: loanRecordData.body.custrecord_scv_loa_end_date,
                trandate: loanRecordData.body.custrecord_scv_loa_date,
                memo: loanRecordData.body.custrecord_scv_loa_memo,
                account: loanRecordData.body.custrecord_scv_loa_account_debitloan,
                location: location
            };
            let sublist = [{
                account: loanRecordData.body.custrecord_scv_loa_inter_account,
                amount: loanRecordData.body.custrecord_scv_foreign_amt,
                taxcode: '5',
                location: location,
            }];
            let billId = slib.createRecord(record.Type.VENDOR_BILL, 'expense', options, sublist);
            
            //create deposit
            options = {
                subsidiary: loanRecordData.body.custrecord_scv_loa_subsidiary,
                account: loanRecordData.body.custrecord_scv_loa_account_bank,
                trandate: loanRecordData.body.custrecord_scv_loa_date,
                currency: loanRecordData.body.custrecord_scv_loa_currency,
                exchangerate: loanRecordData.body.custrecord_scv_loa_exchange_rate,
                custbody_scv_loa: recid,
                memo: loanRecordData.body.custrecord_scv_loa_memo
            };
            sublist = [{
                entity: loanRecordData.body.custrecord_scv_loa_entity,
                amount: loanRecordData.body.custrecord_scv_foreign_amt,
                account: loanRecordData.body.custrecord_scv_loa_inter_account,
                memo: loanRecordData.body.custrecord_scv_loa_memo
            }];
            let depositId = slib.createRecord(record.Type.DEPOSIT, 'other', options, sublist);
            log.audit('created deposit', depositId);
            //show result
            let column = ["internalid", "tranid"];
            let filter = [
                ["mainline", "is", "T"],
                "AND",
                ["internalid", "anyof", [billId, depositId]]
            ];
            let ourNewSearch = search.create({
                id: "customsearch_results",
                type: "transaction",
                title: "Created Bill & Deposit",
                columns: column,
                filters: filter,
            });
            redirect.toSearchResult({
                search: ourNewSearch,
            });
        }

        function doCreatePaymentVendor(scriptContext) {
            let params = scriptContext.request.parameters;
            let recid = params.recid;

            let body = ['custrecord_scv_loa_entity',
                'custrecord_scv_loa_subsidiary',
                'custrecord_scv_loa_currency',
                'custrecord_scv_loa_exchange_rate',
                'custrecord_scv_loa_end_date',
                'custrecord_scv_loa_date',
                'custrecord_scv_foreign_amt',
                'custrecord_scv_loa_memo',
                'custrecord_scv_loa_account_debitloan',
                'custrecord_scv_loa_inter_account',
                'custrecord_scv_loa_account_bank',
                'custrecord_scv_loa_account_debit',
                'custrecord_scv_loa_vendor'
            ];
            let loanRecord = record.load({type: 'customrecord_scv_loa', id: recid});
            let loanRecordData = slib.getRecordData(loanRecord, '', body, []);
            let location = '';
            //create bill
            let options = {
                entity: loanRecordData.body.custrecord_scv_loa_entity,
                subsidiary: loanRecordData.body.custrecord_scv_loa_subsidiary,
                custbody_scv_loa: recid,
                currency: loanRecordData.body.custrecord_scv_loa_currency,
                exchangerate: loanRecordData.body.custrecord_scv_loa_exchange_rate,
                duedate: loanRecordData.body.custrecord_scv_loa_end_date,
                trandate: loanRecordData.body.custrecord_scv_loa_date,
                memo: loanRecordData.body.custrecord_scv_loa_memo,
                account: loanRecordData.body.custrecord_scv_loa_account_debitloan,
                location: location
            };
            let sublist = [{
                account: loanRecordData.body.custrecord_scv_loa_inter_account,
                amount: loanRecordData.body.custrecord_scv_foreign_amt,
                taxcode: '5',
                location: location,
            }];
            let billId = slib.createRecord(record.Type.VENDOR_BILL, 'expense', options, sublist);
            //create deposit
            options = {
                subsidiary: loanRecordData.body.custrecord_scv_loa_subsidiary,
                account: loanRecordData.body.custrecord_scv_loa_account_debit,
                trandate: loanRecordData.body.custrecord_scv_loa_date,
                currency: loanRecordData.body.custrecord_scv_loa_currency,
                exchangerate: loanRecordData.body.custrecord_scv_loa_exchange_rate,
                custbody_scv_loa: recid,
                memo: loanRecordData.body.custrecord_scv_loa_memo,
            };
            sublist = [{
                entity: loanRecordData.body.custrecord_scv_loa_vendor,
                amount: loanRecordData.body.custrecord_scv_foreign_amt,
                account: loanRecordData.body.custrecord_scv_loa_inter_account,
                memo: loanRecordData.body.custrecord_scv_loa_memo,
                location: location
            }];
            let depositId = slib.createRecord(record.Type.DEPOSIT, 'other', options, sublist);
            
            //show result
            let column = ["internalid", "tranid"];
            let filter = [
                ["mainline", "is", "T"],
                "AND",
                ["internalid", "anyof", [billId, depositId]]
            ];
            let ourNewSearch = search.create({
                id: "customsearch_results",
                type: "transaction",
                title: "Created Bill & Deposit",
                columns: column,
                filters: filter,
            });
            redirect.toSearchResult({
                search: ourNewSearch,
            });
        }

        function doCreateDeposit(scriptContext) {
            let params = scriptContext.request.parameters;
            let recid = params.recid;

            let body = ['name', 'custrecord_scv_loa_entity', 'custrecord_scv_loa_subsidiary', 'custrecord_scv_loa_currency','custrecord_scv_loa_start_date',
                'custrecord_scv_loa_exchange_rate', 'custrecord_scv_loa_end_date', 'custrecord_scv_loa_date',
                'custrecord_scv_foreign_amt', 'custrecord_scv_loa_memo', 'custrecord_scv_loa_account_debitloan',
                'custrecord_scv_loa_inter_account', 'custrecord_scv_loa_account_bank', 'custrecord_scv_loa_amount'];
            let loanRecord = record.load({type: 'customrecord_scv_loa', id: recid});
            let loanRecordData = slib.getRecordData(loanRecord, '', body, []);
            
            //create deposit
            let options = {
                subsidiary: loanRecordData.body.custrecord_scv_loa_subsidiary,
                account: loanRecordData.body.custrecord_scv_loa_account_bank,
                trandate: loanRecordData.body.custrecord_scv_loa_start_date,
                currency: loanRecordData.body.custrecord_scv_loa_currency,
                exchangerate: loanRecordData.body.custrecord_scv_loa_exchange_rate,
                custbody_scv_loa: recid,
                memo: loanRecordData.body.custrecord_scv_loa_memo
            };
            let sublist = [{
                entity: loanRecordData.body.custrecord_scv_loa_entity,
                amount: loanRecordData.body.custrecord_scv_foreign_amt,
                account: loanRecordData.body.custrecord_scv_loa_account_debitloan,
                // memo: loanRecordData.body.custrecord_scv_loa_memo
            }];
            let depositId = slib.createRecord(record.Type.DEPOSIT, 'other', options, sublist);
            record.submitFields({type:'customrecord_scv_loa', values:{
                    custrecord_scv_lc_po:depositId
                }, id:recid});
            redirect.toRecord({type: record.Type.DEPOSIT, id: depositId});
        }

        function doCreateBillPayment(scriptContext) {
            let params = scriptContext.request.parameters;
            let recid = params.recid;
            redirect.toRecord({
                type: record.Type.VENDOR_PAYMENT,
                id: null,
                parameters: {recid: recid, rectype: 'customrecord_scv_loa'},
                isEditMode: true
            });
        }

        return {onRequest}

    });
