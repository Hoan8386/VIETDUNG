/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['../cons/scv_cons_payreq', 'N/runtime'],

    function (ConsPayReq, runtime) {

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
                initializeDataPayReq(scriptContext.currentRecord, objParams);
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
        }

        const validCreatedFromPayReq = (objParams) => objParams.createFromType === ConsPayReq.CustomRecordType.PAYMENT_REQUEST;

        const initializeDataPayReq = (curRec, objParams) => {
            if (!validCreatedFromPayReq(objParams)) return;
            if (runtime.getCurrentUser().id.toString() !== ConsPayReq.CustomRoleId.ADMINISTRATOR) {
                let objDataPayReq = runtime.getCurrentSession().get(ConsPayReq.CustomKeySession.PAYMENT_REQUEST);
                if (!objDataPayReq) return;
                let dataPayReq = JSON.parse(objDataPayReq);
                curRec.setValue('advance', dataPayReq.paymentAdvance, true);
            }
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
