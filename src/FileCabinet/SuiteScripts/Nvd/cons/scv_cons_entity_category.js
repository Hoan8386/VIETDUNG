/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  07 Nov 2024         Phu Pham			    Init, create file
 */
define(["N/search"],
    function(search) {
        const TYPE = "customrecord_scv_entity_category";
        const FIELD = {
            ID: "id",
            INACTIVE: "isinactive",
            NAME: "name"
        };
    
        const SUBLIST = {
            
        };
    
        const RECORDS = {

        };

        const getDataEntityCategoryWithType = (entityType) => {
            if(!entityType) return [];

            let arrResult = [];
            let entCategorySearch = search.create({
                type: TYPE, 
                filters: [
                    [FIELD.INACTIVE, "is", "F"],
                    "AND",
                    ["custrecord_scv_entity_category_type", "anyof", entityType]
                ], 
                columns: ["internalid", "name", "custrecord_scv_entity_category_code"]
            });
            entCategorySearch = entCategorySearch.run().getRange(0, 1000);
            for(let objSearch of entCategorySearch) {
                let objRes = {
                    internalid: objSearch.getValue("internalid"),
                    name: objSearch.getValue("name"),
                    ent_category_code: objSearch.getValue("custrecord_scv_entity_category_code"),
                };
                arrResult.push(objRes);
            }
            return arrResult;
        }

        return {
            TYPE: TYPE,
            FIELD: FIELD,
            SUBLIST: SUBLIST,
            RECORDS: RECORDS,
            getDataEntityCategoryWithType
        };
        
    });