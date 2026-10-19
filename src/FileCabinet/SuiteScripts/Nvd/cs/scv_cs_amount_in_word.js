/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([ 'N/currentRecord', '../lib/scv_lib_amount_in_word.js' ],
    function(currentRecord, libAmtInWord) {

        function isEmpty(val) {
            return val === undefined || val === null | val === '';
        }

        function checked(val) {
            if (typeof val === 'boolean') return val;
            return val === 'T' || val === 'true';
        }

        function saveRecord(scriptContext) {
            let recCurr = scriptContext.currentRecord;
            let amount = recCurr.getValue({fieldId : 'total', fireSlavingSync : true});
            if (isEmpty(amount)) amount = recCurr.getValue({fieldId : 'usertotal', fireSlavingSync : true});
            if (isEmpty(amount)) amount = recCurr.getValue({fieldId : 'payment', fireSlavingSync : true});
            if (isEmpty(amount)) amount = recCurr.getValue({fieldId : 'applied', fireSlavingSync : true});
            if (isEmpty(amount)) amount = Math.abs(recCurr.getValue({fieldId : 'estimatedtotalvalue', fireSlavingSync : true}));
            if (isEmpty(amount)) amount = Math.abs(recCurr.getValue({fieldId : 'estimatedtotalvalue', fireSlavingSync : true}));
            if (recCurr.type === 'custompurchase_scv_lenhchi') {amount = recCurr.getValue("custbody_scv_lc_amount_st");}
            else if (recCurr.type === 'itemreceipt') {
                amount = 0;
                let slItem = 'item';
                let lineCount = recCurr.getLineCount({sublistId : slItem});
                let quantity = 0;
                let price = 0;
                for (let i = 0; i < lineCount; i++) {
                    const itemreceive = recCurr.getSublistValue({sublistId : slItem, fieldId : 'itemreceive', line : i});
                    if(checked(itemreceive)) {
                        quantity = recCurr.getSublistValue({sublistId : slItem, fieldId : 'quantity', line : i});
                        price = recCurr.getSublistValue({sublistId : slItem, fieldId : 'rate', line : i});
                        amount += quantity * price;
                    }
                }
            }
            else if (recCurr.type === 'itemfulfillment') {
                amount = 0;
                let slItem = 'item';
                const lineCount = recCurr.getLineCount({sublistId : slItem});
                let quantity = 0;
                let price = 0, itemreceive;
                for (let i = 0; i < lineCount; i++) {
                    itemreceive = recCurr.getSublistValue({sublistId : slItem, fieldId : 'itemreceive', line : i});
                    if(checked(itemreceive)) {
                        quantity = recCurr.getSublistValue({sublistId : slItem, fieldId : 'quantity', line : i});
                        price = recCurr.getSublistValue({sublistId : slItem, fieldId : 'itemunitprice', line : i});
                        amount = amount + (quantity * price);
                    }
                }
            }
            else if (recCurr.type === 'journalentry') {
                amount = 0;
                const slLine = 'line';
                const lineCount = recCurr.getLineCount({sublistId : slLine});
                let debit = 0;
                for (let i = 0; i < lineCount; i++) {
                    debit = recCurr.getSublistValue({sublistId : slLine, fieldId : 'debit', line : i});
                    amount +=  debit * 1;
                    if (debit > 0) {
                        const taxamount = recCurr.getSublistValue({sublistId : slLine, fieldId : 'tax1amt', line : i});
                        if (!isEmpty(taxamount)) amount += taxamount * 1;
                    }
                }

            }
            let currency = recCurr.getText('currency') || recCurr.getValue('currencycode') || recCurr.getValue('currencysymbol');
            if (isEmpty(currency)) currency = 'VND';
            recCurr.setValue({fieldId : 'custbody_scv_amount_in_word', value : libAmtInWord.DocTienBangChu(amount, currency), fireSlavingSync : true});
            recCurr.setValue({fieldId : 'custbody_scv_amount_in_word_en', value : libAmtInWord.toAmountInWorld(amount, currency), fireSlavingSync : true});
            return true;
        }

        return {
            saveRecord : saveRecord,
        }
    });