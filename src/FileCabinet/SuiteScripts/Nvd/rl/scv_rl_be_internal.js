/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 */
define(['../cons/scv_cons_flag', '../lib/scv_lib_check'],
    (ConsFlag, lCheck) => {
        /**
         * Defines the function that is executed when a GET request is sent to a RESTlet.
         * @param {Object} requestParams - Parameters from HTTP request URL; parameters passed as an Object (for all supported
         *     content types)
         * @returns {string | Object} HTTP response body; returns a string when request Content-Type is 'text/plain'; returns an
         *     Object when request Content-Type is 'application/json' or 'application/xml'
         * @since 2015.2
         */
        const get = (requestParams) => {
        }

        /**
         * Defines the function that is executed when a POST request is sent to a RESTlet.
         * @param {string | Object} requestBody - The HTTP request body; request body is passed as a string when request
         *     Content-Type is 'text/plain' or parsed into an Object when request Content-Type is 'application/json' (in which case
         *     the body must be a valid JSON)
         * @returns {string | Object} HTTP response body; returns a string when request Content-Type is 'text/plain'; returns an
         *     Object when request Content-Type is 'application/json' or 'application/xml'
         * @since 2015.2
         */
        const post = (requestBody) => {
            let returnPost = JSON.stringify('post Done!');
            let objBody = {};
            try {
                objBody = JSON.parse(requestBody);
                log.audit("Show call: ", "Client");
            } catch (e) {
                objBody = requestBody;
                log.error("Show call: ", "Server");
            }
            log.audit("objBody: ", objBody);
            switch (objBody.flag) {
                case ConsFlag.CREATE_CHECK_FROM_LECH_CHI :
                    returnPost = lCheck.createCheckFromLenhChi(objBody.body);
                    break;
            }
            log.audit("response_flag_"+ objBody?.flag, returnPost);
            return returnPost;
        };

        return {get, post}

    });
