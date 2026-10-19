/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/search'],

    (search) => {
        /**
         * Des: Tra ve inventory status mac dinh khi nhan hang cua location
         *      (dung cho client script khi khong lookup duoc truc tiep tu browser)
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            let objParams = scriptContext.request.parameters;
            log.audit('objParams', objParams);
            let objRes = {custrecord_scv_loc_defaultreceiptstatus: []};
            try {
                if (objParams.location) {
                    let fieldOfLocation = search.lookupFields({
                        type: search.Type.LOCATION,
                        id: objParams.location,
                        columns: ['custrecord_scv_loc_defaultreceiptstatus']
                    });
                    objRes.custrecord_scv_loc_defaultreceiptstatus = fieldOfLocation?.custrecord_scv_loc_defaultreceiptstatus || [];
                }
            } catch (e) {
                log.error('getDefaultReceiptStatus', e);
            }
            scriptContext.response.write(JSON.stringify(objRes));
        }

        return {onRequest}
    });