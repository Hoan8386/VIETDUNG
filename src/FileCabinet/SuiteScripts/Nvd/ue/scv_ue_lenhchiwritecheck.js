/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/currency', 'N/format', 'N/query', 'N/search', '../lib/scv_lib_function', '../cons/scv_cons_flag'],
    (currencyModule, format, query, search, libFunc, ConsFlag) => {
        const CustomConfig = {
            Status: {
                DA_PHE_DUYET: '5'
            },
            RecordType: {
                PRIN_AND_INTERSHEET: 'customrecord_scv_prinandintersheet'
            }
        };

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
            try {
                setDefaultFromLoanPrinciple(scriptContext);
                
                let form = scriptContext.form;
                let sublist = form.getSublist({id: 'expense'});
                let fieldTaxcode = sublist.getField({id: 'taxcode'});
                let fieldTaxrate = sublist.getField({id: 'taxrate1'});
                let fieldTax1amt = sublist.getField({id: 'tax1amt'});
                let fieldGrossamt = sublist.getField({id: 'grossamt'});
                //fieldTaxcode.isMandatory = false;
                fieldTaxcode.isDisplay = false;
                //fieldTaxrate.isMandatory = false;
                fieldTaxrate.isDisplay = false;
                fieldTax1amt.isDisplay = false;
                fieldGrossamt.isDisplay = false;
            } catch (e) {
                log.error('exception beforeLoad', e);
            }
        }
        
        const getLookupFieldsPrinAndIntersheet = (loanid) => {
            return search.lookupFields({type: CustomConfig.RecordType.PRIN_AND_INTERSHEET, id: loanid, columns: [
                'name', 'custrecord_scv_db_sheet', 'custrecord_scv_db_sheet.custrecord_scv_loa_entity', 'custrecord_scv_db_sheet.custrecord_scv_db_subsidiary', 'custrecord_scv_db_sheet.custrecord_scv_loa_currency',
                    'custrecord_scv_dbsheet_paymentdate', 'custrecord_scv_sheet_amt'
                ]});
        }
        
        const setDefaultFromLoanPrinciple = (scriptContext) => {
            let request = scriptContext.request;
            if(!request || !request.parameters?.loanid) return;
            
            let parameters = request.parameters;
            if(parameters.action === 'prepaidinterest') {
                let newRecord =  scriptContext.newRecord;
                let lkFieldsPrinAndIntersheet = getLookupFieldsPrinAndIntersheet(parameters.loanid);
                let debitLoanId = lkFieldsPrinAndIntersheet['custrecord_scv_db_sheet'][0]?.value;
                let listDbAccountingSetup = getListDbAccountingSetup(debitLoanId);
                
                setHeaderPrinAndIntersheet(newRecord, lkFieldsPrinAndIntersheet, listDbAccountingSetup, parameters);
                setSublistValuePrinAndIntersheet(newRecord, lkFieldsPrinAndIntersheet, listDbAccountingSetup);
            }
        }
        
        const setHeaderPrinAndIntersheet = (newRecord, lkFieldsPrinAndIntersheet, listDbAccountingSetup, parameters) => {
            newRecord.setValue('custbody_scv_payee', lkFieldsPrinAndIntersheet['custrecord_scv_db_sheet.custrecord_scv_loa_entity'][0]?.value);
            newRecord.setValue('subsidiary', lkFieldsPrinAndIntersheet['custrecord_scv_db_sheet.custrecord_scv_db_subsidiary'][0]?.value);
            newRecord.setValue('currency', lkFieldsPrinAndIntersheet['custrecord_scv_db_sheet.custrecord_scv_loa_currency'][0]?.value);
            newRecord.setValue('account', listDbAccountingSetup[0]?.custrecord_scv_dbacc_bank_acc);
            let trandate = lkFieldsPrinAndIntersheet['custrecord_scv_dbsheet_paymentdate'];
            newRecord.setValue('trandate', trandate);
            setPostingPeriod(newRecord, trandate);
            setExchangerate(newRecord, lkFieldsPrinAndIntersheet, trandate);
            newRecord.setValue('cseg_scv_loan', lkFieldsPrinAndIntersheet['custrecord_scv_db_sheet'][0]?.value);
            newRecord.setValue('memo', lkFieldsPrinAndIntersheet.name);
            newRecord.setValue('custbody_scv_debit_loan_interest', parameters.loanid);
        }
        
        const setExchangerate = (newRecord, lkFieldsPrinAndIntersheet, trandate) => {
            const currencyTarget = 'VND';
            let objTrandate = format.parse({type: format.Type.DATE, value: trandate});
            let currencySource = lkFieldsPrinAndIntersheet['custrecord_scv_db_sheet.custrecord_scv_loa_currency'][0]?.text;
            if(currencySource !== currencyTarget) {
                newRecord.setValue('exchangerate', currencyModule.exchangeRate({date: objTrandate, source: currencySource, target: currencyTarget}));
            }
        }
        
        const setPostingPeriod = (newRecord, trandate) => {
            let objTrandate = format.parse({type: format.Type.DATE, value: trandate});
            let dateNow = libFunc.getDateGMTWithDate(new Date(), 7);
            if(dateNow.getMonth() !== objTrandate.getMonth()) {
                newRecord.setValue('postingperiod', libFunc.getPostingPeriod(trandate));
            }
        }
        
        const setSublistValuePrinAndIntersheet = (newRecord, lkFieldsPrinAndIntersheet, listDbAccountingSetup) => {
            const taxcodeUNDEF = '5', taxrateUNDEF = 0;
            let sublistIdExpense = 'expense', line = 0;
            newRecord.insertLine({sublistId: sublistIdExpense, line: line});
            newRecord.setSublistValue({sublistId: sublistIdExpense, fieldId: 'account', line: line, value: listDbAccountingSetup[0]?.custrecord_scv_dbacc_prepaidacc});
            let amount = lkFieldsPrinAndIntersheet.custrecord_scv_sheet_amt || amount;
            newRecord.setSublistValue({sublistId: sublistIdExpense, fieldId: 'amount', line: line, value: amount});
            newRecord.setSublistValue({sublistId: sublistIdExpense, fieldId: 'custcol_scv_sumtrans_line_taxcode', line: line, value: taxcodeUNDEF});
            newRecord.setSublistValue({sublistId: sublistIdExpense, fieldId: 'custcol_scv_sumtrans_line_taxrate', line: line, value: taxrateUNDEF});
            newRecord.setSublistValue({sublistId: sublistIdExpense, fieldId: 'custcol_scv_sumtrans_line_taxamt', line: line, value: taxrateUNDEF * amount});
            newRecord.setSublistValue({sublistId: sublistIdExpense, fieldId: 'custcol_scv_sumtrans_line_grossamt', line: line, value: amount});
            // newRecord.setSublistValue({sublistId: sublistIdExpense, fieldId: 'memo', line: line, value: ''});
            // newRecord.setSublistValue({sublistId: sublistIdExpense, fieldId: 'department', line: line, value: ''});
        }
        
        const getListDbAccountingSetup = (debitLoanId) => {
            let sqlDbAccountingSetup = `
                select ds.id, ds.custrecord_scv_dbacc_prepaidacc, ds.custrecord_scv_dbacc_bank_acc
                from customrecord_scv_dbaccountingsetup ds where ds.custrecord_scv_dbacc_debitloan = ?
            `;
            return query.runSuiteQL({query: sqlDbAccountingSetup,  params: [debitLoanId]}).asMappedResults();
        }
        
        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (scriptContext) => {
            updateGrossAmount(scriptContext);
        };

        const updateGrossAmount = (scriptContext) => {
            if (scriptContext.type === 'delete') return;
            let newRecord = scriptContext.newRecord;
            const lineCount = newRecord.getLineCount('expense');
            const blVND = newRecord.getValue('currency') === '1' || !newRecord.getValue('currency');
            let totalGrossAmount = 0;
            for (let i = 0; i < lineCount; i++) totalGrossAmount += newRecord.getSublistValue({sublistId: 'expense', fieldId: 'amount', line: i}) * 1;
            const factorNumber = blVND ? 1 : 100000;
            const grossAmt = Math.round(totalGrossAmount * factorNumber) / factorNumber;
            newRecord.setValue('custbody_scv_sum_trans_grossamount', grossAmt);
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
            if (scriptContext.type === 'delete') return;
            let oldRecord = scriptContext.oldRecord;
            let newRecord = scriptContext.newRecord;
            let oldStatus = oldRecord?.getValue("custbody_scv_tt_phe_duyet");
            let newStatus = newRecord.getValue("custbody_scv_tt_phe_duyet");
            const blCrtCheck = oldStatus !== newStatus && newStatus === CustomConfig.Status.DA_PHE_DUYET;
            const check_transaction = newRecord.getValue('custbody_scv_check_transaction');
            if (blCrtCheck && !check_transaction) {
                let objRes = libFunc.requestInternalRestlet(ConsFlag.CREATE_CHECK_FROM_LECH_CHI, {
                    lenhchi : newRecord.id
                });
                log.audit('objResCreateCheckFromLenhChi'+ newRecord.id, objRes);
            }
        }


        return {beforeLoad, beforeSubmit, afterSubmit}

    });
