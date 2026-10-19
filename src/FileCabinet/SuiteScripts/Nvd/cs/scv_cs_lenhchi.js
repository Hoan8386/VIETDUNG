/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['../olib/clib', '../olib/lodash.min', 'N/currentRecord'],

    function (clib, _, currentRecord) {
        const KEY_WORD_TAX_CODE = 'scvTaxCode';

        const Account = {
            _3201: {
                ID: 1222,
                NAME: "TKTG lệnh chi",
                NUMBER: "3201"
            }
        };

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
                let curRec = scriptContext.currentRecord;
                let lc = curRec.getLineCount('expense');
                if (lc > 0) {
                    curRec.selectLine('expense', 0);
                    let grossAmt = curRec.getCurrentSublistValue('expense', 'custcol_scv_sumtrans_line_grossamt');
                    curRec.setCurrentSublistValue('expense', 'custcol_scv_sumtrans_line_grossamt', grossAmt * 1, true);
                    curRec.commitLine('expense');
                }
                setTimeout(function () {
                    machines?.expense?.recalc();
                }, 500);
            } catch (e) {
                console.log('pageInit:' + JSON.stringify(e));
            }
        }

        const initializeDataTaxCode = () => {
            if (!window.localStorage.hasOwnProperty(KEY_WORD_TAX_CODE)) {
                window.localStorage.setItem(KEY_WORD_TAX_CODE, JSON.stringify(clib.searchData('customsearch_scv_taxcode_search', [], [])));
            }
        }

        const getLocalStoredTaxCode = () => {
            if (window.localStorage.hasOwnProperty(KEY_WORD_TAX_CODE)) {
                return JSON.parse(window.localStorage.getItem(KEY_WORD_TAX_CODE));
            }
            initializeDataTaxCode();
            return getLocalStoredTaxCode();
        }


        const fieldChanged = (scriptContext) => {
            try {
                updateDataInLineExpense(scriptContext);
                fieldChangeAccountCheck(scriptContext);
            } catch (e) {
                alert(e.toString());
            }
        }

        const updateDataInLineExpense = (scriptContext) => {
            let currentRecord = scriptContext.currentRecord;
            const sublistId = scriptContext.sublistId;
            if (sublistId !== 'expense') return;
            const fieldId = scriptContext.fieldId;
            let grossAmount = 0;
            if (fieldId === 'custcol_scv_sumtrans_line_taxcode') {
                let taxcode = currentRecord.getCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custcol_scv_sumtrans_line_taxcode'
                });
                let f = _.find(getLocalStoredTaxCode(), {'Internal ID': taxcode});
                let rate = f?.Rate || '0';
                currentRecord.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custcol_scv_sumtrans_line_taxrate',
                    value: _.replace(rate, '%', '')
                });
            }
            if (fieldId === 'custcol_scv_sumtrans_line_taxcode' || fieldId === 'amount') {
                const amount = currentRecord.getCurrentSublistValue({sublistId: sublistId, fieldId: 'amount'});
                let taxcode = currentRecord.getCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custcol_scv_sumtrans_line_taxcode'
                });
                let f = _.find(getLocalStoredTaxCode(), {'Internal ID': taxcode});
                let rate = _.replace(f?.Rate || '', '%', '');
                let taxamt = _.round(rate * amount / 100);
                currentRecord.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custcol_scv_sumtrans_line_taxamt',
                    value: taxamt
                });
                currentRecord.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custcol_scv_sumtrans_line_grossamt',
                    value: taxamt + amount
                });
                grossAmount = taxamt + amount;
            } else if (fieldId === 'custcol_scv_sumtrans_line_taxamt') {
                const amount = currentRecord.getCurrentSublistValue({sublistId: sublistId, fieldId: 'amount'});
                const taxamt = currentRecord.getCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custcol_scv_sumtrans_line_taxamt'
                });
                currentRecord.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custcol_scv_sumtrans_line_grossamt',
                    value: taxamt + amount
                });
                grossAmount = taxamt + amount;
            } else if (fieldId === 'custcol_scv_sumtrans_line_grossamt') {
                grossAmount = currentRecord.getCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custcol_scv_sumtrans_line_grossamt'
                }) * 1;
            }
            updateSumGrossAmount(scriptContext, grossAmount, scriptContext.line)

        }

        const updateSumGrossAmount = (scriptContext, grossAmount, lineId, factor = 1) => {
            let curRec = currentRecord.get();
            let fieldId = scriptContext.fieldId;
            let sublistId = scriptContext.sublistId;
            if (sublistId !== 'expense') return;
            if (['amount', 'quantity', 'rate', 'custcol_scv_sumtrans_line_taxamt', 'custcol_scv_sumtrans_line_taxcode', 'custcol_scv_sumtrans_line_grossamt'].indexOf(fieldId) === -1) return;
            let lineCount = curRec.getLineCount('expense');
            let totalAmount = 0;
            for (let i = 0; i < lineCount; i++) {
                let lineGrossAmount = curRec.getSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custcol_scv_sumtrans_line_grossamt',
                    line: i
                }) * 1;
                if (i === lineId) lineGrossAmount = grossAmount * factor;
                totalAmount += lineGrossAmount;
            }
            if (lineId === lineCount) totalAmount += grossAmount * factor;
            curRec.setValue('custbody_scv_lc_amount_st', totalAmount, true);
        }

        const lineInit = (scriptContext) => {
            // const curRec = scriptContext.currentRecord;
            const sublistId = scriptContext.sublistId;
            if(sublistId === "expense") {
                console.log(sublistId);
                nlapiSetCurrentLineItemValue("expense", "account", Account._3201.ID);
            }
        }

        const sublistChanged = (scriptContext) => {
            const operation = scriptContext.operation;
            const factor = operation === 'remove' ? -1 : 1;
            updateTotalAmountSublistChanged(scriptContext, factor)
        }

        const updateTotalAmountSublistChanged = (scriptContext, factor = 1) => {
            let curRecLine = scriptContext.currentRecord;
            let sublistId = scriptContext.sublistId;
            if (sublistId !== 'expense') return;
            let grossAmount = curRecLine.getCurrentSublistValue({
                sublistId: 'expense',
                fieldId: 'custcol_scv_sumtrans_line_grossamt'
            });
            let lineId = curRecLine.getCurrentSublistValue({sublistId: 'expense', fieldId: 'line'});
            let curRec = currentRecord.get();
            let lineCount = curRec.getLineCount('expense');
            let totalAmount = 0;
            for (let i = 0; i < lineCount; i++) {
                let lineGrossAmount = curRec.getSublistValue({
                    sublistId: 'expense',
                    fieldId: 'custcol_scv_sumtrans_line_grossamt',
                    line: i
                }) * 1;
                if (i === lineId) lineGrossAmount = grossAmount * factor;
                totalAmount += lineGrossAmount;
            }
            curRec.setValue('custbody_scv_lc_amount_st', totalAmount, true);
        };

        const getUrlVars = () => {
            let vars = {};
            window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
                vars[key] = value;
            });
            return vars;
        };

        const fieldChangeAccountCheck = (scriptContext) => {
            let curRec = scriptContext.currentRecord;
            let sublistId = scriptContext.sublistId;
            let fieldId = scriptContext.fieldId;

            if(sublistId === "expense" && fieldId === "custcol_scv_lc_account_check") {
                let category = curRec.getCurrentSublistValue(sublistId, "category");
                let account_check = curRec.getCurrentSublistValue(sublistId, fieldId);

                if(!category) {
                    curRec.setCurrentSublistValue(sublistId, "account", Account._3201.ID);
                }
            }
        }

        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            // lineInit: lineInit,
            sublistChanged: sublistChanged,
        };
    });
