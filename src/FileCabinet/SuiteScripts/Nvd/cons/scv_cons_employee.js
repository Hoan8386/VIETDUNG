/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  2 Mar 2025          Huy Pham			    Init, create file, Chọn được nhiều employee dưới line, from mr.Việt(https://app.clickup.com/t/86cy51581)
 */
define([
    '../cons/scv_cons_search.js',
],
    function(
        constSearch, 
    ) {
        const TYPE = "employee";
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
                type: "employee",
                filters:
                [
                    ["isinactive","is","F"]
                ],
                columns:
                [
                    "internalid",
                    "entityid", "email", "department"
                ]
            }, _filters);
            
            let arrResult = constSearch.fetchResultSearchRunEach(resultSearch, function(_objTmpl, _column){
                let objResTmpl = constSearch.getObjResultFromSearchByKey(_objTmpl, _column, [
                    "internalid",
                    "entityid", "email", "department"
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
    