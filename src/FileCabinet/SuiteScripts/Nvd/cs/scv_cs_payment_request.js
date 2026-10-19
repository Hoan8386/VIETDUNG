/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(['N/currentRecord', 'N/record', 'N/search'],
    function (currRec, record, search) {
        let isRun = 0;
        
        function pageInit(scriptContext) {
            try {
                const mode = scriptContext.mode;
                if (mode !== "create") return;
                const params = getUrlVars();
                const currRecord = scriptContext.currentRecord;
                const typeCreatedFrom = params["type_rec"];
                const idCreatedFrom = params["id_rec"];
                const checkType = [
                    "customrecord_scv_pur_requisition",
                    "purchaseorder",
                    "vendorbill"].includes(typeCreatedFrom);
                if (!check(idCreatedFrom) || !checkType) return;
                // Record: PO and Bill
                let exchangeRateField = "exchangerate";
                (typeCreatedFrom === "customrecord_scv_pur_requisition")
                    ?
                    exchangeRateField = "custrecord_scv_pr_exchangerate"
                    :
                    "";
                // Search Information CreatedRecord
                const searchInfo = search.lookupFields({
                    type: typeCreatedFrom,
                    id: idCreatedFrom,
                    columns: [exchangeRateField]
                });
                const exchangeRate = searchInfo[exchangeRateField];
                currRecord.setValue("custrecord_scv_payment_exchangerate", exchangeRate);
            } catch (err) {
                log.error(err)
            }
        }
        
        function fieldChanged(scriptContext) {
            try {
                let crr = scriptContext.currentRecord;
                let sublistId = scriptContext.sublistId;
                if (isRun !== 0) {
                    isRun--;
                } else {
                    let fieldId = scriptContext.fieldId;
                    if (sublistId !== "recmachcustrecord_scv_pay") return;
                    let currency = crr.getValue("custrecord_scv_payment_currency");
                    let isCurrencyVND = currency === "1";
                    let numberToFixed = isCurrencyVND ? 0 : 2;
                    let taxCodeId = crr.getCurrentSublistValue(sublistId, "custrecord_scv_pay_detail_taxcode")
                    let qty = crr.getCurrentSublistValue(sublistId, "custrecord_scv_pay_detail_qty")
                    let expenseRate = crr.getCurrentSublistValue(sublistId, "custrecord_scv_pay_detail_rate")
                    let taxrate1 = 0;
                    if (check(taxCodeId)) {
                        let ikTaxCode = search.lookupFields({
                            type: record.Type.SALES_TAX_ITEM,
                            id: taxCodeId,
                            columns: ["rate"]
                        });
                        taxrate1 = Number(ikTaxCode["rate"].replace("%", "")) || 0;
                    }
                    taxrate1 = reNumber(taxrate1) / 100;
                    // let amount = (qty || 0) * (expenseRate || 0);
                    let taxAmountF = crr.getCurrentSublistValue(sublistId, "custrecord_scv_pay_detail_taxamt");
                    let amountF = crr.getCurrentSublistValue(sublistId, "custrecord_scv_pay_detail_amt");
                    let grossAmountF = crr.getCurrentSublistValue(sublistId, "custrecord_scv_pay_detail_gr_amt");
                    let objData = {};
                    if (fieldId === "custrecord_scv_pay_detail_qty" || fieldId === "custrecord_scv_pay_detail_rate") {
                        let amount = (Number(qty) || 0) * (Number(expenseRate) || 0);
                        let grossamount = (amount * (1 + taxrate1));
                        let taxamount = amount * taxrate1;
                        objData["custrecord_scv_pay_detail_amt"] = amount.toFixed(numberToFixed);
                        objData["custrecord_scv_pay_detail_taxamt"] = taxamount.toFixed(numberToFixed);
                        objData["custrecord_scv_pay_detail_gr_amt"] = grossamount.toFixed(numberToFixed);
                        isRun = 3;
                    } else if (fieldId === "custrecord_scv_pay_detail_taxcode") {
                        let tax1amt = (amountF || 0) * taxrate1;
                        let grossamount = Number(amountF || 0) + Number(tax1amt);
                        objData["custrecord_scv_pay_detail_taxrate"] = (taxrate1 * 100);
                        objData["custrecord_scv_pay_detail_taxamt"] = tax1amt.toFixed(numberToFixed);
                        objData["custrecord_scv_pay_detail_gr_amt"] = grossamount.toFixed(numberToFixed);
                        isRun = 3;
                    } else if (fieldId === "custrecord_scv_pay_detail_taxamt") {
                        let grossamount = (Number(taxAmountF) || 0) + (Number(amountF) || 0);
                        objData["custrecord_scv_pay_detail_gr_amt"] = grossamount.toFixed(numberToFixed);
                        isRun = 1;
                    } else if (fieldId === "custrecord_scv_pay_detail_amt") {
                        let tax1amt = (Number(amountF) || 0) * taxrate1;
                        let grossamt = (Number(amountF) || 0) + (tax1amt || 0)
                        objData["custrecord_scv_pay_detail_taxamt"] = tax1amt.toFixed(numberToFixed);
                        objData["custrecord_scv_pay_detail_gr_amt"] = grossamt.toFixed(numberToFixed);
                        isRun = 2;
                    } else if (fieldId === "custrecord_scv_pay_detail_gr_amt") {
                        let amount = grossAmountF / (1 + (Number(taxrate1) || 0));
                        let tax1amt = amount * (Number(taxrate1) || 0);
                        objData = {
                            custrecord_scv_pay_detail_amt: amount.toFixed(numberToFixed),
                            custrecord_scv_pay_detail_taxamt: tax1amt.toFixed(numberToFixed),
                        };
                        isRun = 2;
                    }
                    let lfWriteValue = ["custrecord_scv_pay_detail_amt", "custrecord_scv_pay_detail_taxamt", "custrecord_scv_pay_detail_gr_amt", "custrecord_scv_pay_detail_taxrate"];
                    util.each(lfWriteValue, function (fieldId) {
                        crr.setCurrentSublistValue(sublistId, fieldId, (objData[fieldId]), true);
                    });
                    
                    let lineId = scriptContext.line;
                    let currGrossAmount = crr.getCurrentSublistValue(sublistId, "custrecord_scv_pay_detail_gr_amt");
                    let currAmount = crr.getCurrentSublistValue(sublistId, "custrecord_scv_pay_detail_amt");
                    let currTaxAmount = crr.getCurrentSublistValue(sublistId, "custrecord_scv_pay_detail_taxamt");
                    updateAmount(sublistId, crr, lineId, currTaxAmount, currAmount, currGrossAmount, numberToFixed);
                    
                    function updateAmount(sublistId, crr, lineId, currTaxAmount, currAmount, currGrossAmount, numberToFixed) {
                        let lc = crr.getLineCount(sublistId);
                        let lineAmount, lineTaxAmt, lineAmountGross, totalTaxAmount = 0, totalAmount = 0,
                            totalAmountGross = 0;
                        for (let i = 0; i < lc; i++) {
                            lineTaxAmt = crr.getSublistValue({
                                sublistId: sublistId,
                                fieldId: 'custrecord_scv_pay_detail_taxamt',
                                line: i
                            });
                            lineAmount = crr.getSublistValue({
                                sublistId: sublistId,
                                fieldId: 'custrecord_scv_pay_detail_amt',
                                line: i
                            });
                            lineAmountGross = crr.getSublistValue({
                                sublistId: sublistId,
                                fieldId: 'custrecord_scv_pay_detail_gr_amt',
                                line: i
                            });
                            if (i === lineId) {
                                lineAmountGross = currGrossAmount;
                                lineAmount = currAmount;
                                lineTaxAmt = currTaxAmount;
                            }
                            totalAmountGross = totalAmountGross + reNumber(lineAmountGross);
                            totalAmount = totalAmount + reNumber(lineAmount);
                            totalTaxAmount = totalTaxAmount + reNumber(lineTaxAmt);
                        }
                        
                        if (lineId >= lc) {
                            totalTaxAmount = totalTaxAmount + currTaxAmount;
                            totalAmount = totalAmount + currAmount;
                            totalAmountGross = totalAmountGross + currGrossAmount;
                        }
                        crr.setValue('custrecord_scv_payment_amounttax', totalTaxAmount.toFixed(numberToFixed), true);
                        crr.setValue('custrecord_scv_payment_amt', totalAmount.toFixed(numberToFixed), true);
                        crr.setValue('custrecord_scv_payment_amount', totalAmountGross.toFixed(numberToFixed), true);
                    }
                }
            } catch (err) {
                log.error(err)
            }
            
        }
        
        function sublistChanged(scriptContext) {
            const crr = scriptContext.currentRecord;
            const sublistId = scriptContext.sublistId;
            const operation = scriptContext.operation; // remove
            if (sublistId !== "recmachcustrecord_scv_pay" || operation !== "remove") return;
            const currency = crr.getValue("custrecord_scv_payment_currency");
            const isCurrencyVND = currency === "1";
            const numberToFixed = isCurrencyVND ? 0 : 2;
            const lineId = scriptContext.line;
            const currGrossAmount = crr.getCurrentSublistValue(sublistId, "custrecord_scv_pay_detail_gr_amt");
            const currAmount = crr.getCurrentSublistValue(sublistId, "custrecord_scv_pay_detail_amt");
            const currTaxAmount = crr.getCurrentSublistValue(sublistId, "custrecord_scv_pay_detail_taxamt");
            updateAmount(sublistId, crr, lineId, currTaxAmount, currAmount, currGrossAmount, numberToFixed);
            
            function updateAmount(sublistId, crr, lineId, currTaxAmount, currAmount, currGrossAmount, numberToFixed) {
                const lc = crr.getLineCount(sublistId);
                let lineAmount, lineTaxAmt, lineAmountGross, totalTaxAmount = 0, totalAmount = 0, totalAmountGross = 0;
                for (let i = 0; i < lc; i++) {
                    lineTaxAmt = crr.getSublistValue({
                        sublistId: sublistId,
                        fieldId: 'custrecord_scv_pay_detail_taxamt',
                        line: i
                    });
                    lineAmount = crr.getSublistValue({
                        sublistId: sublistId,
                        fieldId: 'custrecord_scv_pay_detail_amt',
                        line: i
                    });
                    lineAmountGross = crr.getSublistValue({
                        sublistId: sublistId,
                        fieldId: 'custrecord_scv_pay_detail_gr_amt',
                        line: i
                    });
                    if (i === lineId) {
                        lineAmountGross = -currGrossAmount;
                        lineAmount = -currAmount;
                        lineTaxAmt = -currTaxAmount;
                    }
                    totalAmountGross += reNumber(lineAmountGross);
                    totalAmount += reNumber(lineAmount);
                    totalTaxAmount += reNumber(lineTaxAmt);
                }
                
                if (lineId >= lc) {
                    totalTaxAmount -= currTaxAmount;
                    totalAmount -= currAmount;
                    totalAmountGross -= currGrossAmount;
                }
                crr.setValue('custrecord_scv_payment_amounttax', totalTaxAmount.toFixed(numberToFixed), true);
                crr.setValue('custrecord_scv_payment_amt', totalAmount.toFixed(numberToFixed), true);
                crr.setValue('custrecord_scv_payment_amount', totalAmountGross.toFixed(numberToFixed), true);
            }
        }
        
        function check(value) {
            return value !== null && value !== undefined && value !== "";
        }
        
        function getUrlVars() {
            let vars = {};
            window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
                vars[key] = value;
            });
            return vars;
        }
        
        function reNumber(value) {
            return value ? Number(value) : 0
        }
        
        function makeLineCopy() {
            let currentRec = currRec.get();
            let sublistId = 'recmachcustrecord_scv_pay';
            let sublistFields = ['custrecord_scv_payment_item', 'custrecord_scv_pay_detail_account', 'custrecord_scv_pay_detail_des', 'custrecord_scv_pay_detail_qty',
                'custrecord_scv_pay_detail_rate', 'custrecord_scv_pay_detail_unit', 'custrecord_scv_pay_detail_amt', 'custrecord_scv_pay_detail_taxcode',
                'custrecord_scv_pay_detail_taxrate', 'custrecord_scv_pay_detail_taxamt', 'custrecord_scv_pay_detail_gr_amt', 'custrecord_scv_pay_detail_entity',
                'custrecord_scv_pay_detail_entityname', 'custrecord_scv_pay_detail_taxid', 'custrecord_scv_pay_detail_inv_amount',
                'custrecord_scv_pay_detail_inv_num', 'custrecord_scv_pay_detail_date', 'custrecord_scv_pay_detail_inv_pattern',
                'custrecord_scv_pay_detail_inv_serial', 'custrecord_scv_payment_det_maphi', 'custrecord_scv_pay_detail_note', 'custrecord_scv_pay_detail_category', 'custrecord_scv_payment_cost_cate',
                'custrecord_scv_payment_contact_no', 'custrecord_scv_payment_purchase_order'
            ];
            let obj = {};
            util.each(sublistFields, function (fieldId) {
                obj[fieldId] = currentRec.getCurrentSublistValue(sublistId, fieldId);
            });
            currentRec.selectNewLine(sublistId);
            util.each(sublistFields, function (fieldId) {
                currentRec.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: fieldId,
                    value: obj[fieldId],
                    ignoreFieldChange: true
                });
            });
        }
        
        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            sublistChanged: sublistChanged,
            makeLineCopy: makeLineCopy
        }
    });



