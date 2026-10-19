/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/search'],

    (search) => {

        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = ({request, response}) => {
            let objParams = request.parameters;
            log.audit('objParams', objParams);
            const qtyOnHand = getQtyOnHandItemByLocation(objParams);
            response.write(JSON.stringify({
                item: objParams.item,
                location: objParams.location,
                qtyonhand: qtyOnHand,
            }));
        }

        const getQtyOnHandItemByLocation = (objParams) => {
            let searchObj = search.load({id: 'customsearch_scv_check_onhand', type: 'inventorybalance',});
            searchObj.filters.push(search.createFilter({
                name: 'item',
                operator: 'is',
                values: objParams.item
            }));
            searchObj.filters.push(search.createFilter({
                name: 'location',
                operator: 'is',
                values: objParams.location
            }));
            let searchData = searchObj.run().getRange(0, 1);
            let cols = searchObj.columns;
            if (searchData.length === 0) return 0;
            return searchData[0].getValue(cols[2]) * 1;
        };

        return {onRequest}
    });
