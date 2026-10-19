/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/query', 'N/record', 'N/runtime', 'N/search', '../lib/scv_lib_report.js'],
    
    (query, record, runtime, search, libRep) => {
        const RecordType = {
            PAYMENT_REQUEST: 'customrecord_scv_payment'
        }
        
        //const SAVED_SEARCH_ID_CHECK_TAM_UNG_MUA_HANG = 'customsearch_scv_emp_precheck_2';
        const SAVED_SEARCH_ID_TU_CHECK = 'customsearch_scv_tu_check';
        const SAVED_SEARCH_ID_HOAN_UNG_TAM_UNG_MUA_HANG = 'customsearch_scv_emp_exprep_4';
        const SAVED_SEARCH_ID_DEPOSIT_TAM_UNG_MUA_HANG = 'customsearch_scv_emp_deposits_2';
        
        const PAGE_SIZE = 1000;
        const KEY_LIST_APPLIED_TRANSACTION_JN = 'list_applied_transaction_jn';
        
        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (scriptContext) => {
            let tgType = scriptContext.type;
            let newRecord = scriptContext.newRecord;
            let recType = newRecord?.type;
            if (recType === record.Type.PURCHASE_ORDER) {
                if (tgType === scriptContext.UserEventType.CREATE || tgType === scriptContext.UserEventType.COPY) {
                    newRecord.setValue('custbody_scv_emp_check_amt', 0);
                    newRecord.setValue('custbody_scv_emp_refund_amt', 0);
                    newRecord.setValue('custbody_scv_emp_deposit_amt', 0);
                    newRecord.setValue('custbody_scv_emp_remaining_amt', 0);
                    newRecord.setValue('custbody_scv_remaining_po', newRecord.getValue('custbody_scv_total_amt_bef_tolerance'));
                } else if (tgType === scriptContext.UserEventType.EDIT) {
                    let createdTransaction = newRecord.id;
                    //let {check_amt} = getChekAmount(createdTransaction);
                    let {check_amt} = getTUAmount(createdTransaction);
                    let {refund_amt} = getRefundAmount(createdTransaction);
                    let {deposit_amt} = getDepositAmount(createdTransaction);
                    
                    let remainingAmount = calculateRemainingAmount(null, check_amt, refund_amt, deposit_amt, newRecord.getValue('custbody_scv_total_amt_bef_tolerance'));
                    newRecord.setValue('custbody_scv_emp_check_amt', check_amt);
                    newRecord.setValue('custbody_scv_emp_refund_amt', refund_amt);
                    newRecord.setValue('custbody_scv_emp_deposit_amt', deposit_amt);
                    newRecord.setValue('custbody_scv_emp_remaining_amt', remainingAmount.remaining_amt);
                    newRecord.setValue('custbody_scv_remaining_po', remainingAmount.remaining_po);
                }
            }
            
            beforeLoadJournalEntry(scriptContext);
        }
        
        const beforeLoadJournalEntry = (scriptContext) => {
            let tgType = scriptContext.type;
            let newRecord = scriptContext.newRecord;
            let recType = newRecord?.type;
            if (tgType === scriptContext.UserEventType.EDIT) {
                let not_apply = newRecord.getValue('custbody_scv_jrl_not_apply');
                if (recType === record.Type.JOURNAL_ENTRY && not_apply !== true) {
                    let listAppliedTransaction = getListAppliedTransaction(newRecord.id);
                    listAppliedTransaction = listAppliedTransaction.filter(o => o.appliedtotransaction);
                    runtime.getCurrentSession().set(`${KEY_LIST_APPLIED_TRANSACTION_JN}_${newRecord.id}`, JSON.stringify(listAppliedTransaction));
                }
            }
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
            let createdTransaction;
            let recType;
            let newRecord = scriptContext.newRecord;
            let oldRecord = scriptContext.oldRecord;
            recType = (newRecord && newRecord.type) ? newRecord.type : oldRecord.type;
            createdTransaction = recType === RecordType.PAYMENT_REQUEST ? newRecord.getValue('custrecord_scv_createdfrom_pr') : newRecord.getValue('custbody_scv_created_transaction');
            updatePurchaseOrder(createdTransaction, recType);
            if(oldRecord) {
                let oldCreatedTransaction = recType === RecordType.PAYMENT_REQUEST ? oldRecord.getValue('custrecord_scv_createdfrom_pr') : oldRecord.getValue('custbody_scv_created_transaction');
                if(oldCreatedTransaction !== createdTransaction) {
                    updatePurchaseOrder(oldCreatedTransaction, recType);
                }
            }
            
            try {
                afterLoadJournalEntry(scriptContext);
            } catch (e) {
                log.error('exception afterLoadJournalEntry', e);
            }
        }
        
        const updatePurchaseOrder = (createdTransaction, recType) => {
            if (createdTransaction) {
                let lkTransaction = search.lookupFields({
                    type: search.Type.TRANSACTION,
                    id: createdTransaction
                    ,
                    columns: ['recordtype', 'custbody_scv_emp_check_amt', 'custbody_scv_emp_refund_amt', 'custbody_scv_emp_deposit_amt', 'custbody_scv_emp_remaining_amt', 'custbody_scv_remaining_po', 'custbody_scv_total_amt_bef_tolerance']
                });
                if (lkTransaction.recordtype === record.Type.PURCHASE_ORDER) {
                    /*if(recType === record.Type.CHECK) {
                        let {check_amt} = getChekAmount(createdTransaction);
                        let remainingAmount = calculateRemainingAmount(lkTransaction, check_amt);
                        if(check_amt !== Number(lkTransaction.custbody_scv_emp_check_amt) || isDiffRemaining(remainingAmount, lkTransaction)) {
                            submitFieldsPurchaseOrder(createdTransaction, {custbody_scv_emp_check_amt: check_amt, custbody_scv_emp_remaining_amt: remainingAmount.remaining_amt,
                                custbody_scv_remaining_po: remainingAmount.remaining_po});
                        }
                    }*/
                    if (recType === RecordType.PAYMENT_REQUEST) {
                        let {check_amt} = getTUAmount(createdTransaction);
                        let remainingAmount = calculateRemainingAmount(lkTransaction, check_amt);
                        if (check_amt !== Number(lkTransaction.custbody_scv_emp_check_amt) || isDiffRemaining(remainingAmount, lkTransaction)) {
                            submitFieldsPurchaseOrder(createdTransaction, {
                                custbody_scv_emp_check_amt: check_amt,
                                custbody_scv_emp_remaining_amt: remainingAmount.remaining_amt,
                                custbody_scv_remaining_po: remainingAmount.remaining_po
                            });
                        }
                    } else if (recType === record.Type.EXPENSE_REPORT || recType === record.Type.JOURNAL_ENTRY || recType === record.Type.VENDOR_CREDIT) {
                        let {refund_amt} = getRefundAmount(createdTransaction);
                        let remainingAmount = calculateRemainingAmount(lkTransaction, null, refund_amt);
                        if (refund_amt !== Number(lkTransaction.custbody_scv_emp_refund_amt) || isDiffRemaining(remainingAmount, lkTransaction)) {
                            submitFieldsPurchaseOrder(createdTransaction, {
                                custbody_scv_emp_refund_amt: refund_amt,
                                custbody_scv_emp_remaining_amt: remainingAmount.remaining_amt,
                                custbody_scv_remaining_po: remainingAmount.remaining_po
                            });
                        }
                        
                    } else if (recType === record.Type.DEPOSIT) {
                        let {deposit_amt} = getDepositAmount(createdTransaction);
                        let remainingAmount = calculateRemainingAmount(lkTransaction, null, null, deposit_amt);
                        if (deposit_amt !== Number(lkTransaction.custbody_scv_emp_deposit_amt) || isDiffRemaining(remainingAmount, lkTransaction)) {
                            submitFieldsPurchaseOrder(createdTransaction, {
                                custbody_scv_emp_deposit_amt: deposit_amt,
                                custbody_scv_emp_remaining_amt: remainingAmount.remaining_amt,
                                custbody_scv_remaining_po: remainingAmount.remaining_po
                            });
                        }
                    }
                }
            }
        }
        
        const afterLoadJournalEntry = (scriptContext) => {
            let tgType = scriptContext.type;
            let newRecord = scriptContext.newRecord;
            let recType = newRecord?.type;
            if (recType === record.Type.JOURNAL_ENTRY) {
                let not_apply = newRecord.getValue('custbody_scv_jrl_not_apply');
                if (tgType === scriptContext.UserEventType.EDIT && not_apply !== true) {
                    let listAppliedTransaction = runtime.getCurrentSession().get(`${KEY_LIST_APPLIED_TRANSACTION_JN}_${newRecord.id}`);
                    if (listAppliedTransaction) {
                        runtime.getCurrentSession().set(`${KEY_LIST_APPLIED_TRANSACTION_JN}_${newRecord.id}`, '');
                        listAppliedTransaction = JSON.parse(listAppliedTransaction);
                        if (listAppliedTransaction.length > 0) {
                            let objTran = listAppliedTransaction[0];
                            let lkTransaction = search.lookupFields({
                                type: search.Type.TRANSACTION,
                                id: objTran.appliedtotransaction,
                                columns: ['recordtype', 'subsidiary']
                            });
                            if (lkTransaction.recordtype === record.Type.VENDOR_BILL) {
                                let recVendorPayment = record.transform({
                                    fromType: lkTransaction.recordtype,
                                    fromId: objTran.appliedtotransaction,
                                    toType: record.Type.VENDOR_PAYMENT,
                                    isDynamic: true
                                });
                                recVendorPayment.setValue('subsidiary', newRecord.getValue('subsidiary'));
                                let account = recVendorPayment.getValue('account');
                                if (!account) {
                                    account = getAccountDefault(newRecord.getValue('subsidiary'), newRecord.getValue('currency'));
                                    recVendorPayment.setValue('account', account);
                                }
                                
                                let slApply = 'apply';
                                let applyCount = recVendorPayment.getLineCount({sublistId: slApply});
                                let isSave = false;
                                let totalToAppliedJournal = listAppliedTransaction.reduce((sum, item) => sum + Number(item.appliedtolinkamount), 0);
                                
                                for (let i = 0; i < applyCount; i++) {
                                    let doc = recVendorPayment.getSublistValue({
                                        sublistId: slApply,
                                        fieldId: 'doc',
                                        line: i
                                    });
                                    objTran = listAppliedTransaction.find(o => o.appliedtotransaction === doc);
                                    let isApply = doc && (doc === objTran?.appliedtotransaction || doc === String(newRecord.id));
                                    if (isApply) {
                                        recVendorPayment.selectLine({sublistId: slApply, line: i});
                                        recVendorPayment.setCurrentSublistValue({
                                            sublistId: slApply,
                                            fieldId: 'apply',
                                            line: i,
                                            value: isApply
                                        });
                                        recVendorPayment.setCurrentSublistValue({
                                            sublistId: slApply,
                                            fieldId: 'amount',
                                            line: i,
                                            value: doc === String(newRecord.id) ? -totalToAppliedJournal : objTran?.appliedtolinkamount
                                        });
                                        
                                        isSave = true;
                                        recVendorPayment.commitLine({sublistId: slApply});
                                    }
                                }

                                if (isSave) {
                                    recVendorPayment.save({
                                        ignoreMandatoryFields: true
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }
        
        /*const getObjectTotal = (recVendorPayment, slApply, objTran, newRecord) => {
            let totalApplied = 0, totalJournal = 0;
            let applyCount = recVendorPayment.getLineCount({sublistId: slApply});
            for (let i = 0; i < applyCount; i++) {
                let appliedToTransaction = recVendorPayment.getSublistValue({
                    sublistId: slApply,
                    fieldId: 'doc',
                    line: i
                });
                let total = recVendorPayment.getSublistValue({
                    sublistId: slApply,
                    fieldId: 'total',
                    line: i
                });
                if (appliedToTransaction === objTran.appliedtotransaction) {
                    totalApplied += Number(total);
                } else if(appliedToTransaction === String(newRecord.id)) {
                    totalJournal += Number(total);
                }
            }
            return {totalApplied, totalJournal};
        }*/
        
        const getAccountDefault = (subsidiary, currency) => {
            let sqlAccount = `select id, subsidiary from account where accttype = 'Bank'  and isinactive = 'F' and issummary = 'F' and currency = ${currency} order by acctnumber`;
            let listAccount = query.runSuiteQL({sql: sqlAccount, params: []}).asMappedResults().filter(o => String(o.subsidiary) === String(subsidiary));
            return listAccount[0]?.id;
        }
        
        const doSearchAmountFromPayment = (createdTransaction, savedSearchId) => {
            let listDataAmount = [], filtersAmount = [];
            pushFiltersFromPayment(filtersAmount, createdTransaction);
            libRep.doSearchSSRangeLabelId(savedSearchId, PAGE_SIZE, listDataAmount, filtersAmount);
            return listDataAmount;
        }
        
        const getTUAmount = (createdTransaction) => {
            let listDataAmount = doSearchAmountFromPayment(createdTransaction, SAVED_SEARCH_ID_TU_CHECK);
            return {check_amt: calculateAmount(listDataAmount)};
        }
        
        const doSearchAmount = (createdTransaction, savedSearchId) => {
            let listDataAmount = [], filtersAmount = [];
            pushFilters(filtersAmount, createdTransaction);
            libRep.doSearchSSRangeLabelId(savedSearchId, PAGE_SIZE, listDataAmount, filtersAmount);
            return listDataAmount;
        }
        
        /*const getChekAmount = (createdTransaction) => {
            let listDataAmount = doSearchAmount(createdTransaction, SAVED_SEARCH_ID_CHECK_TAM_UNG_MUA_HANG);
            return {check_amt: calculateAmount(listDataAmount)};
        }*/
        
        const getRefundAmount = (createdTransaction) => {
            let listDataAmount = doSearchAmount(createdTransaction, SAVED_SEARCH_ID_HOAN_UNG_TAM_UNG_MUA_HANG);
            return {refund_amt: calculateAmount(listDataAmount)};
        }
        
        const getDepositAmount = (createdTransaction) => {
            let listDataAmount = doSearchAmount(createdTransaction, SAVED_SEARCH_ID_DEPOSIT_TAM_UNG_MUA_HANG);
            return {deposit_amt: calculateAmount(listDataAmount)};
        }
        
        const isDiffRemaining = (remainingAmount, lkTransaction) => {
            return remainingAmount.remaining_po !== Number(lkTransaction.custbody_scv_remaining_po) || remainingAmount.remaining_amt !== remainingAmount.old_remaining_amt;
        }
        
        const submitFieldsPurchaseOrder = (relatedTransaction, objValues) => {
            record.submitFields({
                type: record.Type.PURCHASE_ORDER, id: relatedTransaction,
                values: objValues, options: {ignoreMandatoryFields: true}
            });
        }
        
        const calculateAmount = (listDataAmount) => {
            let totalAmount = 0;
            for (let objAmount of listDataAmount) {
                totalAmount += Number(objAmount['Amount']);
            }
            return totalAmount;
        }
        
        const calculateRemainingAmount = (lkTransaction, check_amt, refund_amt, deposit_amt, total, old_remaining_amt) => {
            let remaining_amt = (check_amt ?? lkTransaction?.custbody_scv_emp_check_amt ?? 0) -
                (refund_amt ?? lkTransaction?.custbody_scv_emp_refund_amt ?? 0) - (deposit_amt ?? lkTransaction?.custbody_scv_emp_deposit_amt ?? 0);
            let remaining_po = (total ?? lkTransaction?.custbody_scv_total_amt_bef_tolerance) -
                (refund_amt ?? lkTransaction.custbody_scv_emp_refund_amt ?? 0) - remaining_amt;
            
            return {
                remaining_amt,
                remaining_po,
                old_remaining_amt: (old_remaining_amt ?? Number(lkTransaction?.custbody_scv_emp_remaining_amt ?? 0))
            }
        }
        
        const pushFilters = (filters, createdTransaction) => {
            filters.push(search.createFilter({
                name: 'custbody_scv_created_transaction',
                operator: search.Operator.ANYOF,
                values: createdTransaction
            }));
        }
        
        const pushFiltersFromPayment = (filters, createdTransaction) => {
            filters.push(search.createFilter({
                name: 'custrecord_scv_createdfrom_pr',
                operator: search.Operator.ANYOF,
                values: createdTransaction
            }));
        }
        
        const getListAppliedTransaction = (createdTransaction) => {
            let arrFilter = [['internalid', 'anyof', createdTransaction], 'AND', ['mainline', 'is', true]];
            let columns = ['appliedtotransaction', 'appliedtolinkamount'];
            let arrColIds = ['appliedtotransaction', 'appliedtolinkamount'];
            let listAppliedTransaction = [];
            libRep.doSearch('transaction', listAppliedTransaction, columns, arrColIds, arrFilter);
            return listAppliedTransaction;
        }
        
        return {beforeSubmit, afterSubmit}
        
    });
