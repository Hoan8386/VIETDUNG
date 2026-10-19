/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */

define(['N/redirect', '../lib/scv_lib_qaqc.js'],
    function ( redirect,  lqc) {
        const  onRequest = (scriptContext) => {
            let request = scriptContext.request;
            let params = request.parameters;
            let tranId = params.createdfromid;
            let tranType = params.createdrectype;
            log.audit('check : ', params);
            lqc.generateInspectionResultsOfTrans(tranType, tranId, false);
            redirect.toRecord({type: tranType, id: tranId});
        }
        return {
            onRequest: onRequest
        };
    });
