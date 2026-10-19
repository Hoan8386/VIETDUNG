/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/search'], function (search) {
    const onRequest = (ctx) => {
        let objParams = ctx.request.parameters;
        if (!objParams.inspLotId) throw 'Error not param Inspections Id';
        if (!objParams.itemId) throw 'Error not param Item Id';
        const objRes = getDataRecordDuplicate(objParams);
        ctx.response.write(JSON.stringify(objRes))
    };

    const getDataRecordDuplicate = ({inspLotId, colorSeri, itemId}) => {
        let searchObj = search.load('customsearch_scv_inslot_dup_seri');
        let filters = [];
        filters = filters.concat([
            search.createFilter({
                name: 'custrecord_scv_inspl_item',
                operator: 'anyof',
                values: itemId
            }),
            search.createFilter({
                name: 'internalid',
                operator: 'noneof',
                values: inspLotId
            })
        ]);
        filters = filters.concat([
            search.createFilter({
                name: 'formulatext',
                formula: 'LOWER({custrecord_scv_inspl_seri_color})',
                operator: 'is',
                values: colorSeri.toLowerCase()
            })
        ]);
        const objCols = searchObj.columns;
        searchObj.filters = searchObj.filters.concat(filters);
        let searchData = searchObj.run().getRange(0, 100);
        const sz = searchData.length;
        let result = [], msg = '';
        for (let i = 0; i < sz; i++) {
            const obj = {
                id: searchData[i].id,
                name: searchData[i].getValue(objCols[0]),
            };
            result.push(obj);
        }
        return {
            isValid: result.length > 0,
            response: result
        };
    };


    return {
        onRequest
    };
});