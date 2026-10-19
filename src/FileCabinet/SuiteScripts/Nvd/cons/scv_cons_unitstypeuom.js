/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  26 Aug 2025         Huy Pham			    Init, create file
 */
define(['N/query',
],
    function(query,
    ) {
        const FIELD = {
            ID: "id",
            INACTIVE: "isinactive",
            NAME: "name"
        }
    
        const SUBLIST = {
            
        }
    
        const RECORDS = {
            stores: {},
        }

        const getDataSource = (_filters) => {
            let query_condition = "";
            if(!!_filters?.unitstype){
                query_condition += ` AND unitstype = ${_filters.unitstype}`  
            }
            
            var resultSQL = query.runSuiteQL({
                query: `SELECT internalid, unitname, baseunit, unitstype, inuse
                FROM unitsTypeUom
                WHERE inuse IN ('T', 'F') ${query_condition}`
            });
            return resultSQL.asMappedResults();
        }

        return {
            TYPE: "-221",//"unitsTypeUom",
            FIELD,
            SUBLIST,
            RECORDS,
            getDataSource
        };
        
    });
    