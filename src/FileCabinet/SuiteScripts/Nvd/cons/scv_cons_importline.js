/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  08 Nov 2024         Huy Pham                Init & create file, move from Adv, from mr.Việt(https://app.clickup.com/t/86cx0fvqd)
 */
define(['N/query',
    '../cons/scv_cons_record.js'
],
    function(query,
        constRecord
    ) {
        const TYPE = "customrecord_scv_import_line";
        const FIELD = {
            ID: "id",
            INACTIVE: "isinactive",
            NAME: "name"
        }
    
        const SUBLIST = {
            
        }
    
        const RECORDS = {
        }

        const getDataSourceByCriteriaQuery = (_objDataFilter) => {
            let query_where = `WHERE isinactive = 'F' `;

            if(!!_objDataFilter.custrecord_scv_import_line_rectype?.toString()){
                query_where += ` AND custrecord_scv_import_line_rectype IN (${_objDataFilter.custrecord_scv_import_line_rectype.toString()}) `
            }
            if(!!_objDataFilter.id?.toString()){
                query_where += ` AND id IN (${_objDataFilter.id.toString()}) `
            }

            var resultQuery = query.runSuiteQL({
                query: `SELECT custrecord_scv_import_line_rectype, id, name, custrecord_scv_import_line_sublist
                FROM customrecord_scv_import_line
                ${query_where}`
            });
    
            let arrResult = resultQuery.asMappedResults();
            
            return arrResult;
        }

        const initLoadFieldByCriteriaQuery = (_field, _objDataFilter, _hasNull = true) =>{
            let arrResult = getDataSourceByCriteriaQuery(_objDataFilter);
    
            constRecord.initLoadField(_field, {data: arrResult}, _hasNull);
    
            return arrResult;
        }
    
        return {
            TYPE,
            FIELD,
            SUBLIST,
            RECORDS,
            getDataSourceByCriteriaQuery,
            initLoadFieldByCriteriaQuery
        };
        
    });
    