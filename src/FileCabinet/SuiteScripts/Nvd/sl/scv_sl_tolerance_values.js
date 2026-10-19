/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  04 Jul 2025		    Khanh Tran			    Init, create file. Phát triển tính các giá trị trên PO, ITR, IB from Ms.Kỳ, Mr.Hải, Mr.Phúc(https://app.clickup.com/t/86cyknytj)
 */
/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record', 'N/redirect',
    '../cons/scv_cons_tolerance_values.js'
],
    /**
 * @param{record} record
 * @param{redirect} redirect
 */
    (record, redirect,
        constTolVal
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
            if(params.action === "calc_rate_itr"){
                let itrRec = record.load({ type: params.rectype, id: params.recid });
                constTolVal.updateRecordWithTolerance(itrRec);
                itrRec.save({enableSourcing: false, ignoreMandatoryFields: true})
                redirect.toRecord({
                    type: params.rectype, id: params.recid
                });
            }
        }

        return {onRequest}

    });
