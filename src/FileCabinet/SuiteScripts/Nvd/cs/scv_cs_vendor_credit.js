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
                initializeAccountPayReq(scriptContext.currentRecord, objParams);
            } catch (e) {
                console.log('pageInit:' + JSON.stringify(e));
            }
        }

        /**
         * Function to be executed when field is slaved.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         *
         * @since 2015.2
         */
        function postSourcing(scriptContext) {
            let objParams = getUrlVars();
            let {fieldId, currentRecord} = scriptContext;
            if (fieldId === 'account' && validCreatedFromPayReq(objParams)) {
                appliedBillsToTrans(currentRecord, getArrRelatedTransId(objParams.createFromId));
            }
        }

        const getArrRelatedTransId = id => {
            if (!id) return [];
            const lkPayReq = search.lookupFields({
                type: ConsPayReq.CustomRecordType.PAYMENT_REQUEST,
                id: id,
                columns: ['custrecord_scv_payment_related']
            });
            return lkPayReq.custrecord_scv_payment_related.map(o => o.value) || [];
        };

        const appliedBillsToTrans = (curRec, arrTransId) => {
            let lc = curRec.getLineCount('apply');
            let [idx, sz] = [0, arrTransId.length];
            for (let i = 0; i < lc; i++) {
                if (idx === sz) return;
                let applied = curRec.getSublistValue('apply', 'apply', i);
                let billId = curRec.getSublistValue('apply', 'internalid', i);
                if (arrTransId.includes(billId)) {
                    curRec.selectLine('apply', i);
                    curRec.setCurrentSublistValue({sublistId: 'apply', fieldId: 'apply', value: true, ignoreFieldChange: true});
                    let amount = nlapiGetLineItemValue('apply', 'due', i+1);
                    curRec.setCurrentSublistValue({sublistId: 'apply', fieldId: 'amount', value: amount, ignoreFieldChange: true});
                    curRec.commitLine('apply');
                    idx++;
                }
            }
        };

        const validCreatedFromPayReq = (objParams) => objParams.createFromType === ConsPayReq.CustomRecordType.PAYMENT_REQUEST;

        const initializeAccountPayReq = (curRec, objParams) => {
            if (!validCreatedFromPayReq(objParams)) return;
            let accountId = curRec.getValue('account');
            curRec.setValue('account', null, true);
            curRec.setValue('account', accountId);
        };

        const getUrlVars = () => {
            let vars = {};
            window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
                vars[key] = value;
            });
            return vars;
        };
        return {
            pageInit: pageInit,
            postSourcing: postSourcing
        };

    });
