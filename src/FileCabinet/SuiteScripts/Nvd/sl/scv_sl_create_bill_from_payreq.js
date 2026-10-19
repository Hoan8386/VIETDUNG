/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['../lib/scv_lib_payreq.js', 'N/redirect', 'N/search'], function (lpr, redirect, search) {

        const onRequest = (context) => {
            let {request} = context;
            let params = request.parameters;
            let {createFromId, createFromType, btnid} = params;
            let arrIdBill = lpr.createMultiPaymentRequest({createFromId: createFromId, createFromType: createFromType});
            let numsBill = arrIdBill.length;
            if (numsBill) {
                if (numsBill === 1) {
                    redirect.toRecord({type: 'vendorbill', id: arrIdBill[0], isEditMode: false});
                    return;
                }
                let column = ["internalid", "tranid"];
                let filter = [["mainline", "is", "T"], "AND", ["internalid", "anyof", arrIdBill]];
                let ourNewSearch = search.create({
                    id: "customsearch_results",
                    type: "transaction",
                    title: "List Bills Create From Payment Request",
                    columns: column,
                    filters: filter,
                });
                redirect.toSearchResult({search: ourNewSearch,});
            } else {
                throw 'Not create Bills! Please check Payment Request!'
            }
        }

        return {
            onRequest: onRequest
        }
    }
)