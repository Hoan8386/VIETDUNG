/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/query'],
    (query) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            let request = scriptContext.request;
            let response = scriptContext.response;
            let parameters = request.parameters;//log.error('parameters', parameters);
            //let item = parameters.item;
            let units = parameters.units;
            let onlyone = parameters.onlyone;
            let conversionrate = '';
            if(units) {
                let params = units.split(',');
                let sql = "select uom.internalid, uom.conversionrate from unitstypeuom uom where uom.internalid in (";
                for(let unit in params) {
                    sql = sql + "?,"
                }
                sql = sql.slice(0, -1) + ")";

                let resultSet = query.runSuiteQL({
                    query: sql,
                    params: params,
                    customScriptId: null
                });
                let listRes = resultSet.asMappedResults();
                let lLR = listRes.length;
                if(lLR > 0) {
                    if(onlyone === 'T') {
                        conversionrate = listRes[0].conversionrate;
                    } else {
                        conversionrate = listRes;
                    }
                }
            }

            response.write(JSON.stringify(conversionrate));
        }

        return {onRequest}

    });
