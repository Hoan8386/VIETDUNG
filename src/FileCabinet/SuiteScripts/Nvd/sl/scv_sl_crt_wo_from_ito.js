/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  16 Jan 2025         Khanh Tran              Init & create file. Create WO from mr. Việt (https://app.clickup.com/t/86cxnyadd)             
 */
/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record', 'N/redirect', 'N/search',
    '../cons/scv_cons_ito.js'
],
    /**
 * @param{record} record
 * @param{redirect} redirect
 * @param{search} search
 */
    (record, redirect, search,
        constIto
    ) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            let request = scriptContext.request;
            let params = request.parameters;
            if(request.method == 'GET'){
                constIto.crtWO(params);
            }

            redirect.toRecord({type: params.recType, id: params.recId, parameters: {
                'icto':'T'
            }});
        }

        return {onRequest}

    });
