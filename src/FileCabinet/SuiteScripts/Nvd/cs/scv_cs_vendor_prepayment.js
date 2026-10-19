/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['../cons/scv_cons_payreq', 'N/search'],

    function (ConsPayReq, search) {

        /**
         * Function to be executed after page is initialized.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
         *
         * @since 2015.2
         */
        function pageInit(scriptContext) {
            try {
                let objParams = getUrlVars();
                if (objParams.createFromType === ConsPayReq.CustomRecordType.PAYMENT_REQUEST) {
                    initializePaymentAmt(scriptContext.currentRecord, objParams.createFromId);
                }
            } catch (e) {
                console.log('pageInit:' + JSON.stringify(e));
            }
        }

        const initializePaymentAmt = (curRec, payReqId) => {
            const payAmt = search.lookupFields({
                type: ConsPayReq.CustomRecordType.PAYMENT_REQUEST,
                id: payReqId,
                columns: [
                    'custrecord_scv_payment_amount'
                ]
            }).custrecord_scv_payment_amount;
            curRec.setValue('payment', payAmt, true);
        };

        const getUrlVars = () => {
            let vars = {};
            window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
                vars[key] = value;
            });
            return vars;
        };
        return {
            pageInit: pageInit
        };

    });
