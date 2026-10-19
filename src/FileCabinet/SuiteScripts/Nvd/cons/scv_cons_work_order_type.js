/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  05 Dec 2024         Phu Pham			    Init, create file
 */
define([
    '../cons/scv_cons_search.js',
],
    function(
        constSearch
    ) {
        const FIELD = {
            ID: "id",
            INACTIVE: "isinactive",
            NAME: "name"
        }
    
        const SUBLIST = {
            
        }
    
        const RECORDS = {
            SX_ACP: {
                ID: 2,
                NAME: "Sản xuất ACP"
            },
            SX_AC_LCN: {
                ID: 3,
                NAME: "Sản xuất AC và LCN"
            },
            SX_MAU_AC_LCN: {
                ID: 4,
                NAME: "Sản xuất mẫu AC và LCN"
            },
            GIA_CONG_CO_KHI: {
                ID: 6,
                NAME: "Gia công cơ khí"
            },
        }

        const getDataSource = (_filters) => {
            let resultSearch =  constSearch.createSearchWithFilter({
                type: "customrecord_scv_work_order_type",
                filters:
                [
                    ["isinactive","is","F"]
                ],
                columns:
                [
                    "internalid",
                    "name"
                ]
            }, _filters);
            
            let arrResult = constSearch.fetchResultSearchRunEach(resultSearch, function(_objTmpl, _column){
                let objResTmpl = constSearch.getObjResultFromSearchByKey(_objTmpl, _column, [
                    "internalid",
                    "name"
                ]);
    
                return objResTmpl;
            });
            
            return arrResult;
        }

        return {
            TYPE: "customrecord_scv_work_order_type",
            FIELD,
            RECORDS,
            getDataSource
        };
        
    });