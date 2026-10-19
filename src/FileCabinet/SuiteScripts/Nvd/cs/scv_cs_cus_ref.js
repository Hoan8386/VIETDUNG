/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['../cons/scv_cons_payreq'],

    function (ConsPayReq) {

        const pageInit = (scriptContext) => {
            try {
                let objParams = getUrlVars();
                if (validCreatedFromPayReq(objParams)) {
                    initializeDataPayReq(scriptContext.currentRecord);
                }
            } catch (e) {
                console.log('pageInit:' + JSON.stringify(e));
            }
        }

        const initializeDataPayReq = (curRec) => {
            curRec.setValue('subsidiary', curRec.getValue('subsidiary'))
            curRec.setValue('customer', curRec.getValue('customer'))
        };

        const validCreatedFromPayReq = (objParams) => objParams.createFromType === ConsPayReq.CustomRecordType.PAYMENT_REQUEST;

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
