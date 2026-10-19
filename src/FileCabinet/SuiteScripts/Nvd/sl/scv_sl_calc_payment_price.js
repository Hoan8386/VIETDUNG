/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define([
    'N/redirect', 'N/record',
    '../cons/scv_cons_calc_payment_price.js'
],
    (
        redirect, record,
        calcPaymentPrice
    ) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            let params = scriptContext.request.parameters;
            // load record
            let soRec = record.load({ type: params.rectype, id: params.recid, isDynamic: true });
            // calculation
            calcPaymentPrice.handleCalcPaymentPrice(soRec);
            // to record
            redirect.toRecord({
                type: params.rectype, id: params.recid
            });
        }

        return {onRequest}

    });
