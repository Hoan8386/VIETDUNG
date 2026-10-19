/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['../lib/scv_lib_location_line_wo.js'], function (libLocLineWO) {
    const onRequest = (ctx) => {
        let objParams = ctx.request.parameters;
        if (!objParams.locationid) throw 'Error not param Location Id';
        if (!objParams.itemid) throw 'Error not param Item Id';
        let data = libLocLineWO.getDataLocsForItems({
            arrItemId: [objParams.itemid],
            locationId: +objParams.locationid,
        });
        ctx.response.write(JSON.stringify({
            isSuccess: true,
            response: data?.[0]?.locId || '',
            msg: ''
        }));
    };

    return {
        onRequest
    };
});