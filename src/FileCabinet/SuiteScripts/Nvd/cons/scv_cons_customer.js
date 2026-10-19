/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  13 Nov 2024         Phu Pham			    Init, create file
 */
define(['N/search',
    '../cons/scv_cons_search.js'
],
    function(search,
        constSearch
    ) {
        const FIELD = {
            ID: "id",
            INACTIVE: "isinactive"
        }
    
        const SUBLIST = {
            
        }
    
        const RECORDS = {
            ENTITY_DEFAULT: {
                ID: 146,
                NAME: "Default"
            },
        }

        const getDataSource = (_filters) => {
            let resultSearch =  constSearch.createSearchWithFilter({
                type: "customer",
                filters:
                [
                    ["isinactive","is","F"]
                ],
                columns:
                [
                    "internalid",
                    "entityid", "custentity_scv_legal_name", "subsidiary",
                    "email", "phone",
                    "address", "companyname"
                ]
            }, _filters);

            resultSearch = resultSearch.runPaged({pageSize: 1000});
            
            let arrResult = constSearch.fetchResultSearchAllPage(resultSearch, function(_objTmpl, _column){
                let objResTmpl = constSearch.getObjResultFromSearchByKey(_objTmpl, _column, [
                    "internalid",
                    "entityid", "custentity_scv_legal_name", "subsidiary",
                    "email", "phone",
                    "address", "companyname"
                ]);
    
                return objResTmpl;
            });
            
            return arrResult;
        }

        const getDataSourceSubsidiaryRelationship = (_filters) => {
            let resultSearch =  constSearch.createSearchWithFilter({
                type: "customersubsidiaryrelationship",
                filters:
                [
                    ["customer.isinactive","is","F"], 
                    "AND", 
                    ["customer.internalidnumber","isnotempty",""]
                ],
                columns:
                [
                    search.createColumn({
                        name: "formulanumeric",
                        summary: "GROUP",
                        formula: "{customer.internalid}"
                    }),
                    search.createColumn({
                        name: "formulatext",
                        summary: "GROUP",
                        formula: "{customer.entityid}"
                    }),
                    search.createColumn({
                        name: "formulatext",
                        summary: "GROUP",
                        formula: "{customer.custentity_scv_entity_category}"
                    }),
                ]
            }, _filters);

            resultSearch = resultSearch.runPaged({pageSize: 1000});
            
            let arrResult = constSearch.fetchResultSearchAllPage(resultSearch, function(_objTmpl, _column){
                let objResTmpl = constSearch.getObjResultFromSearchByKey(_objTmpl, _column, [
                    "internalid",
                    "entityid",
                    "custentity_scv_entity_category_display"
                ]);
    
                return objResTmpl;
            });
            
            return arrResult;
        }

        return {
            TYPE: "customer",
            FIELD,
            SUBLIST,
            RECORDS,
            getDataSource,
            getDataSourceSubsidiaryRelationship
        };
        
    });