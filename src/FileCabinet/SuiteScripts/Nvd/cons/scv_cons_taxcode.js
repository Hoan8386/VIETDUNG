/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  27 Jun 2025         Phu Pham			    Init, create file
 */
define([
    'N/query',
    '../cons/scv_cons_search.js',
],
    function(
        query,
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

        }

        const getDataSource = (_filters) => {
            let resultSearch =  constSearch.createSearchWithFilter({
                type: "salestaxitem",
                filters:
                [
                    ["isinactive","is","F"]
                ],
                columns:
                [
                    "name", "rate"
                ]
            }, _filters);

            resultSearch = resultSearch.runPaged({pageSize: 1000});
            
            let arrResult = constSearch.fetchResultSearchAllPage(resultSearch, function(_obj, _column){
                let objRes = constSearch.getObjResultFromSearchByKey(_obj, _column, [
                    "name", "rate"
                ]);
        
                objRes.id = _obj.id;
                objRes.rate = objRes.rate;

                return objRes;
            });
            
            return arrResult;
        }

        const queryDataSource = (_filters = {}) => {
            let sqlQuery = `SELECT id, itemid, fullname, rate
                FROM salestaxitem
                WHERE isinactive = 'F'`;

            sqlQuery += `\n ORDER BY id ASC`
            const resultSQL = query.runSuiteQL({
                query: sqlQuery
            });
            return resultSQL.asMappedResults();
        }

        const getDataInfoTaxCodeById = (_id) => {
            if(!_id) return {};

            let sqlQuery = `SELECT id, itemid, fullname, rate
                FROM salestaxitem
                WHERE isinactive = 'F' AND id = ?`;

            const resultSQL = query.runSuiteQL({
                query: sqlQuery,
                params: [_id]
            }).asMappedResults();
            
            return resultSQL[0] || {};
        }

        return {
            TYPE: "salestaxitem",
            FIELD: FIELD,
            SUBLIST: SUBLIST,
            RECORDS: RECORDS,
            getDataSource,
            queryDataSource,

            getDataInfoTaxCodeById
        };
        
    });
    