/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/runtime', 'N/search'],
    
    (runtime, search) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            let objParams = scriptContext.request.parameters;
            log.audit('objParams', objParams);
            let objUser = runtime.getCurrentUser();
            const isValid = checkDisabledFieldLot({
                ntype: objParams.ntype,
                role: objUser.role.toString(),
                location: objParams?.location,
                subsidiary: objParams.subsidiary,
            });
            scriptContext.response.write(JSON.stringify({isValid}));
        }
        
        const checkDisabledFieldLot = (objParams) => {
            if (objParams.role === '3') return false;
            let f = [];
            f.push(search.createFilter({
                name: 'isinactive',
                operator: 'is',
                values: false
            }));
            if (objParams.subsidiary) f.push(search.createFilter({
                name: 'custrecord_scv_cof_lot_subs',
                operator: 'anyof',
                values: objParams.subsidiary
            }));
            if (objParams.ntype) f.push(search.createFilter({
                name: 'custrecord_scv_cof_lot_app_trans',
                operator: 'anyof',
                values: objParams.ntype
            }));
            f.push(search.createFilter({
                name: 'custrecord_scv_cof_lot_roles',
                operator: 'anyof',
                values: objParams.role
            }));
            if (objParams.location) {
                f.push(search.createFilter({
                    name: 'custrecord_scv_cof_lot_locs',
                    operator: 'anyof',
                    values: objParams.location
                }));
            }
            let searchObj = search.create({
                type: 'customrecord_scv_config_dis_fld_lot',
                filters: f,
                columns: ['internalid']
            });
            return searchObj.run().getRange(0, 1).length > 0;
        };
        
        return {onRequest}
    });
