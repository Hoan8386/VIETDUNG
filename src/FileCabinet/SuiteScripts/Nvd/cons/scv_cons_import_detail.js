/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  08 Nov 2024         Huy Pham                Init & create file, move from Adv, from mr.Việt(https://app.clickup.com/t/86cx0fvqd)
 */
define(['N/query'
],
    function( query
    ) {
        const TYPE = "customrecord_scv_import_d";
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

            if(!!_objDataFilter?.custrecord_scv_import_d?.toString()){
                query_where += ` AND custrecord_scv_import_d IN (${_objDataFilter.custrecord_scv_import_d.toString()}) `
            }
            if(!!_objDataFilter?.custrecord_scv_import_line_d?.toString()){
                query_where += ` AND custrecord_scv_import_line_d IN (${_objDataFilter.custrecord_scv_import_line_d.toString()}) `
            }
            if(!!_objDataFilter?.custrecord_scv_import_d_invdetail?.toString()){
                query_where += ` AND custrecord_scv_import_d_invdetail IN (${_objDataFilter.custrecord_scv_import_d_invdetail.toString()}) `
            }

            var resultQuery = query.runSuiteQL({
                query: `SELECT id, custrecord_scv_import_d_seq, custrecord_scv_import_d_label, custrecord_scv_import_d_fieldid,
                    custrecord_scv_import_d_valuetype, custrecord_scv_import_line_d, custrecord_scv_import_d, custrecord_scv_import_d_note,
                    custrecord_scv_import_d_invdetail, custrecord_scv_import_d_subrec_invdetail
                FROM customrecord_scv_import_d
                ${query_where}
                ORDER BY custrecord_scv_import_d_seq ASC`
            });
    
            let arrResult = resultQuery.asMappedResults();
            
            return arrResult;
        }
    
        return {
            TYPE,
            FIELD,
            SUBLIST,
            RECORDS,
            getDataSourceByCriteriaQuery
        };
        
    });
    