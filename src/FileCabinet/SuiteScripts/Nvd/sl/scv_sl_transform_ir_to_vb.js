/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/redirect', '../common/scv_common_vendorbill.js'],
    
    (redirect, comVdb) => {
        /**
         * Definition of the Suitelet script trigger point.
         *
         * @param {Object} context
         * @param {ServerRequest} context.request - Encapsulation of the incoming request
         * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
         * @Since 2015.2
         */
        const onRequest = (context) => {
            let request = context.request;
            let parameters = request.parameters;
            let irid = parameters.irid;
            let ordertype = parameters.ordertype;
            let createdfrom = parameters.createdfrom;
            let status = parameters.status;
            if (request.method === 'GET') {
                if (ordertype === 'PurchOrd' && (status === 'pendingBilling' || status === 'partiallyReceived' || status === 'pendingBillPartReceived')) {
                    let vendorBillId = comVdb.doCreateVendorBill({irid, createdfrom});
                    redirect.toRecord({type: 'vendorbill', id: vendorBillId});
                } else {
                    redirect.toRecord({type: 'itemreceipt', id: irid});
                }
            } else if (parameters.listData) {
                let listData = JSON.parse(parameters.listData);
                if (listData.length < 20) {
                    for (let objData of listData) {
                        comVdb.doCreateVendorBill(objData);
                    }
                }
            }
        }
        
        return {
            onRequest
        };
        
    });
