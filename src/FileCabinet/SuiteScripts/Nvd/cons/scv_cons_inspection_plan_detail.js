/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  10 Dec 2024         Huy Pham                Init & create file
 */
define(['N/search',
    '../cons/scv_cons_search.js'
],
    function(
        search,
        constSearch
    ) {
        const FIELD = {
            ID: "id",
            INACTIVE: "isinactive"
        }
    
        const SUBLIST = {
            
        }
    
        const RECORDS = {
        }

        const getDataSource = (_filters) => {
            let resultSearch =  constSearch.createSearchWithFilter({
                type: "customrecord_scv_inspection_field",
                filters:
                [
                    ["isinactive","is","F"]
                ],
                columns:
                [
                    "internalid", 
                    "custrecord_scv_if_inspec_plan", "name",
                    search.createColumn({
                        name: 'custrecord_scv_if_sequence',
                        sort: search.Sort.ASC
                    }),
                    "custrecord_scv_if_target_value", "custrecord_scv_if_lower_ctrl_limit",
                    "custrecord_scv_if_upper_ctrl_limit"
                ]
            }, _filters);
            
            let arrResult = constSearch.fetchResultSearchRunEach(resultSearch, function(_objTmpl, _column){
                let objResTmpl = constSearch.getObjResultFromSearchByKey(_objTmpl, _column, [
                    "internalid",
                    "custrecord_scv_if_inspec_plan", "name",
                    "custrecord_scv_if_sequence",
                    "custrecord_scv_if_target_value", "custrecord_scv_if_lower_ctrl_limit",
                    "custrecord_scv_if_upper_ctrl_limit"
                ]);
    
                return objResTmpl;
            });
            
            return arrResult;
        }

        return {
            TYPE: "customrecord_scv_inspection_field",
            FIELD,
            SUBLIST,
            RECORDS,
            getDataSource
        };
        
    });