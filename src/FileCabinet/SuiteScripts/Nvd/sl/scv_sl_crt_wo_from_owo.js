/**
 * Nội dung:
 * =======================================================================================
 * Date                 Author                  Description
 * 08 Nov 2024          Khanh Tran              Init, create file. Tạo WO từ lệnh xẻ băng from mr. Bính (https://app.clickup.com/t/86cx0f856)           
 */  
/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record', 'N/redirect', 'N/search',
    '../cons/scv_cons_other_work_order.js'
],
    /**
 * @param{record} record
 * @param{redirect} redirect
 * @param{search} search
 */
    (record, redirect, search,
        constOWO
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
                constOWO.createMultiWO(params);
            }

            redirect.toRecord({type: params.recType, id: params.recId});
        }

        return {onRequest}

    });
