/**
 * @NApiVersion 2.1
 */
define(['N/search',
        '../lib/scv_lib_function.js'],
    
    (search,
     libFunc) => {
        
        const setCheckBomLineItems = (newRecord, sublistId, fieldIdItem) => {
            let arrDataItemId = getArrayItemId(newRecord, sublistId, fieldIdItem);
            if (arrDataItemId.length === 0) return;
            let arrItemId = arrDataItemId.map(o => o.itemId);
            setCheckBomItems(newRecord, arrItemId, arrDataItemId);
        };
        
        const setCheckBomItems = (newRecord, arrItemId, arrDataItemId) => {
            let szItemAssembly = arrItemId.length;
            const arrDataItemHaveBom = fetchDataItemInSavedSearchCheckBomMappingSQ(arrItemId);
            const arrItemIdHaveBom = arrDataItemHaveBom.map(o => o.itemId);
            const arrBomId = arrDataItemHaveBom.map(o => o.bomId);
            const arrBomIdInCheckBomForSQ = fetchDataBOMInSavedSearchCheckBomForSQ(arrBomId);
            for (let i = 0; i < szItemAssembly; i++) {
                const objItem = arrDataItemId[i];
                let isCheckBom = false;
                if (!arrItemIdHaveBom.includes(objItem.itemId)) {
                    isCheckBom = true;
                } else {
                    const arrBomIdOfItem = arrDataItemHaveBom.filter(o => o.itemId === objItem.itemId).map(o => o.bomId);
                    isCheckBom = !arrBomIdOfItem.some(bomId => arrBomIdInCheckBomForSQ.includes(bomId));
                }
                newRecord.setSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_scv_check_bom_item',
                    line: objItem.lineIndex,
                    value: isCheckBom
                });
            }
        }
        
        const fetchDataBOMInSavedSearchCheckBomForSQ = (arrBomId) => {
            if (arrBomId.length === 0) return [];
            let searchObj = search.load({id: 'customsearch_scv_ss_bom_for_sq'});
            let objCols = searchObj.columns;
            const COL_BOM_ID = 1;
            searchObj.filters.push(search.createFilter({
                name: 'internalid',
                join: "billOfMaterials",
                operator: 'anyof',
                values: arrBomId
            }));
            return libFunc.fetchDataSavedSearch(searchObj, function (data) {
                return data.getValue(objCols[COL_BOM_ID]);
            });
        };
        
        const fetchDataItemInSavedSearchCheckBomMappingSQ = (arrItemId) => {
            let searchObj = search.load({id: 'customsearch_scv_ss_item_bom_mapping_sq'});
            let objCols = searchObj.columns;
            const COL_ITEM_ID = 0;
            const COL_BOM_ID = 2;
            searchObj.filters.push(search.createFilter({name: 'internalid', operator: 'anyof', values: arrItemId}));
            return libFunc.fetchDataSavedSearch(searchObj, function (data) {
                return {
                    itemId: data.getValue(objCols[COL_ITEM_ID]),
                    bomId: data.getValue(objCols[COL_BOM_ID]),
                }
            });
        };
        
        const getArrayItemId = (newRecord, sublistId, fieldIdItem) => {
            const lc = newRecord.getLineCount(sublistId);
            let result = [];
            for (let i = 0; i < lc; i++) {
                const itemId = newRecord.getSublistValue({sublistId: sublistId, fieldId: fieldIdItem, line: i});
                const itemtype = newRecord.getSublistValue({sublistId: sublistId, fieldId: 'itemtype', line: i});
                if (itemtype !== 'Assembly' || !itemId) continue;
                result.push({
                    itemId,
                    lineIndex: i
                });
            }
            return result;
        };
        
        return {setCheckBomLineItems}
        
    });
