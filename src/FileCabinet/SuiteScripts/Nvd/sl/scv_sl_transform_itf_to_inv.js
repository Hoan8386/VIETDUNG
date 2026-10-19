/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/redirect',
        '../common/scv_common_invoice.js'],
    
    (record, redirect, comInv) => {
        
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
            if (request.method === 'GET') {
                let itfid = parameters.itfid;
                let ordertype = parameters.ordertype;
                let createdfrom = parameters.createdfrom;
                let status = parameters.status;
                if (ordertype === 'SalesOrd' && (status === 'pendingBilling' || status === 'pendingBillingPartFulfilled' || status === 'pendingFulfillment')) {
                    let invoiceId = comInv.doCreateInvoice({itfid, createdfrom});
                    record.submitFields.promise({
                        type: 'itemfulfillment',
                        id: itfid,
                        values: {custbody_scv_related_transaction: invoiceId}
                    });
                    redirect.toRecord({type: 'invoice', id: invoiceId});
                } else {
                    redirect.toRecord({type: 'itemfulfillment', id: itfid});
                }
            } else if (parameters.listData) {
                let listData = JSON.parse(parameters.listData);
                if (listData.length < 20) {
                    for (let objData of listData) {
                        let invoiceId = comInv.doCreateInvoice(objData);
                        record.submitFields.promise({
                            type: 'itemfulfillment',
                            id: objData.itfid,
                            values: {custbody_scv_related_transaction: invoiceId}
                        });
                    }
                }
            }
        }
        
        return {
            onRequest
        };
        
    });
