/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record'],
    (record) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            if(scriptContext.request.method === 'GET') {
                scriptContext.response.write('hehe');
            }
        }

        return {onRequest}

    });
