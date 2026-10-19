define(['N/search', 'N/record', '../lib/scv_lib_function', 'N/runtime'], function (search, record, lfn, runtime) {

    const updateLocForLinesWO = (scriptContext) => {
        let triggerType = scriptContext.type; // create or edit
        let newRec = scriptContext.newRecord;
        if (!['create', 'edit'].includes(triggerType)) return;
        if (triggerType === 'edit') {
            let oldRec = scriptContext.oldRecord;
            if (newRec.getValue('location') == oldRec.getValue('location')) return;
        }
        updateLocForLines(newRec);
    };

    const updateLocForLines = (curRec) => {
        const locationId = curRec.getValue('location') * 1;
        const arrItemId = getArrayItemId(curRec);
        const dataLocForItems = getDataLocsForItems({
            arrItemId,
            locationId
        });
        if (dataLocForItems.length === 0) return;
        const slWOId = 'item';
        const lc = curRec.getLineCount(slWOId);
        for (let i = 0; i < lc; i++) {
            const itemId = curRec.getSublistValue({
                sublistId: slWOId,
                fieldId: 'item',
                line: i
            });
            const defLocId = curRec.getSublistValue({
                sublistId: slWOId,
                fieldId: 'custcol_scv_default_location',
                line: i
            });
            if (!!defLocId) continue;
            const objLoc = dataLocForItems.find(o => String(o.itemId) === itemId);
            if (objLoc === undefined) continue;
            curRec.setSublistValue({
                sublistId: slWOId,
                fieldId: 'custcol_scv_default_location',
                line: i,
                value: objLoc.locId
            });
        }
    };

    const updateLocForLinesWOChild = (id) => {
        const slWOId = 'item';
        let curRec = record.load({type: record.Type.WORK_ORDER, id: id});
        let lc = curRec.getLineCount(slWOId);
        for (let i = 0; i < lc; i++) {
            const woid = curRec.getSublistValue({
                sublistId: slWOId,
                fieldId: 'woid',
                line: i
            });
            if (woid) {
                let curRec = record.load({type: record.Type.WORK_ORDER, id: woid});
                updateLocForLines(curRec);
            }
        }
    }

    const getDataLocsForItems = ({arrItemId, locationId}) => {
        let dataItemAndLocs = getArrLocationGroupInItem(arrItemId);
        let arrLocationIdOfLvGroup = dataItemAndLocs.map(o => o.arr_loc_ids).flat(1);
        const arrDataDetailLocation = getDataDetailOfLocations([...arrLocationIdOfLvGroup, locationId]);
        let parentIdOfLocWO = arrDataDetailLocation.find(o => o.id === locationId)?.parent || '';
        let arrDataLocsIdSelected = arrDataDetailLocation.filter(o => o.parent === parentIdOfLocWO).map(o => o.id);
        return dataItemAndLocs
            .map(o => {
                let itemId = o.item_id;
                let arrLocsId = o.arr_loc_ids;
                let szLocsId = arrLocsId.length;
                let locId = '';
                for (let i = 0; i < szLocsId; i++) {
                    if (arrDataLocsIdSelected.includes(arrLocsId[i])) {
                        locId = arrLocsId[i];
                        break;
                    }
                }
                return {
                    itemId,
                    locId
                };
            });
    }

    const getDataDetailOfLocations = (arrLocsId) => {
        const sqlQuery = `SELECT id, parent
                          FROM LOCATION
                          WHERE id in (${arrLocsId.join(',')})`;
        const results = lfn.callQuery(sqlQuery);
        if (!results.isSuccess) return [];
        return results.response;
    };

    const getArrayItemId = (curRec) => {
        const slWO = 'item';
        const lc = curRec.getLineCount(slWO);
        let dataItemId = new Set();
        for (let i = 0; i < lc; i++) {
            const itemId = curRec.getSublistValue({sublistId: slWO, fieldId: 'item', line: i});
            if (dataItemId.has(itemId)) continue;
            dataItemId.add(itemId);
        }
        return [...dataItemId];
    };

    const getArrLocationGroupInItem = (arrItemId) => {
        if (arrItemId.length === 0) return [];
        const sqlQuery = `select i.id as item_id, g.id as lv_groupid, g.custrecord_scv_default_loc as loc_ids
                          from item as i
                                   left join customrecord_scv_group_level as g on g.id = i.custitem_scv_group_lv2
                          where g.custrecord_scv_default_loc is not null
                            and BUILTIN.DF(g.custrecord_scv_default_loc) != 'null' and i.custitem_scv_group_lv2 is not null and i.id in ('${arrItemId.join("', '")}')`;
        let result = lfn.callQuery(sqlQuery)
        if (!result.isSuccess) return [];
        return result.response.map(o => ({
            ...o,
            arr_loc_ids: o.loc_ids.split(',').map(id => Number(id))
        }));
    };

    return {
        getArrayItemId,
        getDataLocsForItems,
        updateLocForLines,
        updateLocForLinesWOChild,
        updateLocForLinesWO
    };
});