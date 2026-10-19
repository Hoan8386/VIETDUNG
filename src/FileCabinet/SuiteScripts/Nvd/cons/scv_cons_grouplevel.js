/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  11 Jul 2025          Huy Pham			    Init, create file
 */
define([
    '../cons/scv_cons_search.js',
],
    function(
        constSearch, 
    ) {
        const TYPE = "customrecord_scv_group_level";
        const FIELD = {
            ID: "id",
            INACTIVE: "isinactive",
            NAME: "name"
        }
    
        const SUBLIST = {
        }
    
        const RECORDS = {
        }

        const getDataSource = (_filters) => {
            let resultSearch =  constSearch.createSearchWithFilter({
                type: "customrecord_scv_group_level",
                filters:
                [
                    ["isinactive","is","F"]
                ],
                columns:
                [
                    "internalid",
                    "name", "parent", "custrecord_scv_item_group",
                    "custrecord_scv_item_name_group", "custrecord_scv_class"
                ]
            }, _filters);
            
            resultSearch = resultSearch.runPaged({pageSize: 1000});
            
            let arrResult = constSearch.fetchResultSearchAllPage(resultSearch, function(_objTmpl, _column){
                let objResTmpl = constSearch.getObjResultFromSearchByKey(_objTmpl, _column, [
                    "internalid",
                    "name", "parent", "custrecord_scv_item_group",
                    "custrecord_scv_item_name_group", "custrecord_scv_class"
                ]);

                return objResTmpl;
            });
            
            return arrResult;
        }

    
        return {
            TYPE,
            FIELD,
            SUBLIST,
            RECORDS,
            getDataSource
        };
        
    });
    