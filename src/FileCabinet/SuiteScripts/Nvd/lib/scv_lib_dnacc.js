define(['N/record', 'N/search'],
    
    (record, search) => {
        
        const ApproveStatus = {
            APPROVED: '3'
        }
        
        const BankAccNumber = {
            TIEN_MAT: '111',
            TAI_KHOAN: '112'
        }
        
        const makeDocNumber = (newRecord, oldRecord = {}) => {
            let doc_number = newRecord.getValue('custbody_scv_doc_number');
            let prefix = '';
            let recType = newRecord.type;
            let trandate = newRecord.getValue('trandate');
            if (!trandate) {
                return false;
            }
            let year_month = trandate.getFullYear().toString().substring(2, 4) + ((trandate.getMonth() + 1) + '').padStart(2, '0');
            let subsidiary = newRecord.getValue('subsidiary');
            let accountnumber = '';
            let account = newRecord.getValue('account');
            let postingperiod = newRecord.getValue('postingperiod');
            let approvalstatus = newRecord.getValue('approvalstatus');
            let approval_status = newRecord.getValue('custbody_scv_approval_status');

            if (doc_number !== undefined &&
                (!doc_number) &&
                (!!postingperiod || recType === record.Type.EXPENSE_REPORT)
                && (!approvalstatus || approvalstatus === '2')) {

                let isvalid = true, lkAcc;
                let memdoc = newRecord.getValue('memdoc');
                if (memdoc) {
                    if (newRecord.id) {
                        let lkT = search.lookupFields({type: newRecord.type, id: newRecord.id, columns: ['memorized']});
                        let memorized = lkT.memorized;
                        if (memorized === true || memorized === 'T') {
                            isvalid = false;
                        }
                    } else {
                        isvalid = false;
                    }
                }
                if (isvalid) {
                    if (((recType === 'vendorpayment' || recType === 'vendorprepayment') && approval_status === ApproveStatus.APPROVED) || recType === record.Type.CUSTOMER_REFUND || recType === record.Type.CHECK || recType === record.Type.CASH_REFUND) {
                        if (account !== undefined && isNaN(account) === false && !!account) {
                            lkAcc = search.lookupFields({type: search.Type.ACCOUNT, id: account, columns: ['number']});
                            accountnumber = lkAcc.number.substring(0, 3);
                            if (accountnumber === BankAccNumber.TIEN_MAT) {
                                prefix = 'PC';
                            } else if (accountnumber === BankAccNumber.TAI_KHOAN) {
                                prefix = 'BN';
                            }
                        }
                    } else if (recType === record.Type.DEPOSIT || recType === record.Type.CUSTOMER_DEPOSIT || recType === record.Type.CASH_SALE || recType === record.Type.CUSTOMER_PAYMENT) {
                        if (newRecord.getValue('undepfunds') === 'T') {
                            if (recType === record.Type.CUSTOMER_PAYMENT || recType === record.Type.CASH_SALE) {
                                account = undefined;
                            }
                            if (recType === record.Type.DEPOSIT || recType === record.Type.CUSTOMER_PAYMENT) {
                                prefix = 'GL';
                            }
                        }
                        if (account !== undefined && isNaN(account) === false && !!account) {
                            lkAcc = search.lookupFields({type: search.Type.ACCOUNT, id: account, columns: ['number']});
                            accountnumber = lkAcc.number.substring(0, 3);
                            if (accountnumber === BankAccNumber.TIEN_MAT) {
                                prefix = 'PT';
                            } else if (accountnumber === BankAccNumber.TAI_KHOAN) {
                                prefix = 'BC';
                            } else if (recType === record.Type.DEPOSIT || recType === record.Type.CUSTOMER_PAYMENT) {
                                prefix = 'GL';
                            }
                        }
                    } else if (recType === record.Type.VENDOR_BILL || recType === record.Type.EXPENSE_REPORT || recType === record.Type.VENDOR_CREDIT || recType === 'vendorprepaymentapplication') {
                        prefix = 'GL';
                    } else if (recType === record.Type.INVOICE || recType === record.Type.CREDIT_MEMO || recType === record.Type.DEPOSIT_APPLICATION) {
                        prefix = 'GL';
                    } else if (recType === record.Type.JOURNAL_ENTRY || recType === 'customtransaction_fam_depr_jrn' || recType === 'customtransaction_fam_disp_jrn'
                        || recType === 'customtransaction_fam_revaluation_jrn' || recType === 'customtransaction_fam_transfer_jrn') {
                        prefix = 'GL';
                    } else if (recType === record.Type.ITEM_RECEIPT) {
                        prefix = 'PN';
                    } else if (recType === record.Type.ITEM_FULFILLMENT) {
                        prefix = 'PX';
                    } else if (recType === record.Type.INVENTORY_TRANSFER) {
                        prefix = 'IT';
                    } else if (recType === record.Type.INVENTORY_ADJUSTMENT) {
                        prefix = 'IA';
                    } else if (recType === record.Type.PURCHASE_CONTRACT) {
                        prefix = 'PC';
                    } else if (recType === record.Type.PURCHASE_REQUISITION) {
                        prefix = 'PR';
                    }
                    
                    if (!!prefix) {
                        let prefix_sub = '';
                        if (!!subsidiary) {
                            let lkSub = search.lookupFields({
                                type: 'subsidiary',
                                id: subsidiary,
                                columns: ['tranprefix']
                            });
                            prefix_sub = lkSub.tranprefix;
                        }
                        let type = 'ACCOUNTINGVOUCHER';
                        doc_number = getDocNumber(subsidiary, type, accountnumber, prefix, prefix_sub, year_month, 0, 5);
                        newRecord.setValue('custbody_scv_doc_number', doc_number);
                    }
                }
            }
            return doc_number;
        }
        
        const getDocNumber = (subsidiary, type, accountnumber, prefix, prefix_sub, year_month, times, padStartNumber) => {
            let doc_number = '';
            if (times < 5) {
                let nextnumber = searchDocNumber(subsidiary, type, accountnumber, prefix, year_month);
                doc_number = prefix + prefix_sub + year_month + (nextnumber + '').padStart(padStartNumber, '0');
                
                let recGcUnq = record.create({type: 'customrecord_scv_rcnumberunq'});
                recGcUnq.setValue('name', type + doc_number);
                recGcUnq.setValue('externalid', type + doc_number);
                try {
                    recGcUnq.save();
                } catch (e) {
                    log.error('exception', e);
                    doc_number = getDocNumber(subsidiary, type, accountnumber, prefix, prefix_sub, year_month, times + 1, padStartNumber);
                }
            }
            return doc_number;
        }
        
        const searchDocNumber = (subsidiary, type, accountnumber, prefix, year_month) => {
            let nextnumber = 1;
            let filters = [];
            if (!!subsidiary) {
                filters.push(search.createFilter({
                    name: 'custrecord_scv_rcn_subsidiary',
                    operator: 'anyof',
                    values: subsidiary
                }));
            } else {
                filters.push(search.createFilter({
                    name: 'custrecord_scv_rcn_subsidiary',
                    operator: 'anyof',
                    values: '@NONE@'
                }));
            }
            if (!!type) {
                filters.push(search.createFilter({name: 'custrecord_scv_rcn_type', operator: 'is', values: type}));
            } else {
                filters.push(search.createFilter({
                    name: 'custrecord_scv_rcn_type',
                    operator: search.Operator.ISEMPTY,
                    values: ''
                }));
            }
            if (!!accountnumber) {
                filters.push(search.createFilter({
                    name: 'custrecord_scv_rcn_accountnumber',
                    operator: 'is',
                    values: accountnumber
                }));
            } else {
                filters.push(search.createFilter({
                    name: 'custrecord_scv_rcn_accountnumber',
                    operator: search.Operator.ISEMPTY,
                    values: ''
                }));
            }
            if (!!prefix) {
                filters.push(search.createFilter({name: 'custrecord_scv_rcn_prefix', operator: 'is', values: prefix}));
            } else {
                filters.push(search.createFilter({
                    name: 'custrecord_scv_rcn_prefix',
                    operator: search.Operator.ISEMPTY,
                    values: ''
                }));
            }
            if (!!year_month) {
                filters.push(search.createFilter({
                    name: 'custrecord_scv_rcn_yearmonth',
                    operator: 'is',
                    values: year_month
                }));
            } else {
                filters.push(search.createFilter({
                    name: 'custrecord_scv_rcn_yearmonth',
                    operator: search.Operator.ISEMPTY,
                    values: ''
                }));
            }
            let columns = ['custrecord_scv_rcn_currentnumber']
            let searchVN = search.create({
                type: 'customrecord_scv_rcnumber',
                filters: filters,
                columns: columns
            });
            let resultsVN = searchVN.run().getRange({start: 0, end: 1});
            let lengthVN = resultsVN.length;
            if (lengthVN > 0) {
                nextnumber = resultsVN[0].getValue('custrecord_scv_rcn_currentnumber') * 1 + 1;
                record.submitFields({
                    type: 'customrecord_scv_rcnumber', id: resultsVN[0].id
                    , values: {custrecord_scv_rcn_currentnumber: nextnumber}
                    , options: {enableSourcing: false, ignoreMandatoryFields: true}
                });
            } else {
                createDocNumber(subsidiary, type, accountnumber, prefix, year_month);
            }
            
            return nextnumber;
        }
        
        const createDocNumber = (subsidiary, type, accountnumber, prefix, year_month) => {
            let prefix_sub = '';
            if (!!subsidiary) {
                let lkSub = search.lookupFields({type: 'subsidiary', id: subsidiary, columns: ['tranprefix']});
                prefix_sub = lkSub.tranprefix;
            }
            let recDocNum = record.create({type: 'customrecord_scv_rcnumber'});
            recDocNum.setValue('name', type + prefix_sub + prefix + year_month);
            recDocNum.setValue('custrecord_scv_rcn_subsidiary', subsidiary);
            recDocNum.setValue('custrecord_scv_rcn_type', type);
            recDocNum.setValue('custrecord_scv_rcn_accountnumber', accountnumber);
            recDocNum.setValue('custrecord_scv_rcn_prefix', prefix);
            recDocNum.setValue('custrecord_scv_rcn_yearmonth', year_month);
            recDocNum.setValue('custrecord_scv_rcn_currentnumber', 1);
            recDocNum.save();
        }
        
        return {
            makeDocNumber,
            getDocNumber
        };
        
    });
