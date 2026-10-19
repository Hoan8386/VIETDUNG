/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/search'], function (search) {

    const onRequest = ({request, response}) => {
        let params = request.parameters;
        let method = request.method;
        let objRes = {isSuccess: true, msg: '', response: null};
        log.audit('post_getdata_lot', {params, method})
        try {
            objRes.response = [];
        } catch (e) {
            objRes.isSuccess = false;
            objRes.msg = e.message;
        }
        log.audit('result_response', objRes);
        response.write(JSON.stringify(objRes));
    };

    const getDataInventoryNumber = ({arrLotId, itemId, locationId}) => {
        let filters = [];
        if (Array.isArray(arrLotId) && arrLotId.length > 0) {
            filters.push(search.createFilter({
                name: 'internalid',
                operator: 'anyof',
                values: arrLotId
            }));
        } else {
            filters.push(search.createFilter({
                name: 'item',
                operator: 'anyof',
                values: itemId
            }));
            filters.push(search.createFilter({
                name: 'location',
                operator: 'anyof',
                values: locationId
            }));
            filters.push(search.createFilter({
                name: 'quantityavailable',
                operator: 'greaterthan',
                values: 0
            }));
        }
        log.audit('filters', filters);
        let searchObj = search.create({
            type: search.Type.INVENTORY_NUMBER,
            filters: filters,
            columns: ['inventorynumber', 'custitemnumber_scv_item_num_color_seri']
        });
        const cols = searchObj.columns;
        log.audit('searchObj', searchObj)
        let searchData = searchObj.run().getRange(0, 1000);
        const szData = searchData.length;
        let results = [];
        for (let i = 0; i < szData; i++) {
            results.push({
                id: searchData[i].id.toString(),
                name: searchData[i].getValue(cols[0]),
                colorSeri: searchData[i].getValue(cols[1])
            });
        }
        return results;
    };

    return {
        onRequest
    };
});