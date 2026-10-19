/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  24 Feb 2025         Khánh Trần              Init & create file.
 */
define(['N/query'
],
    function(query
    ) {
        const TYPE = "BomRevisionComponent";
        const FIELD = {
            ID: "id",
        }

        const getDataByBomRev = (bomrevision) => {
            let sql = `SELECT
                id,
                item,
                lineId,
                custrecord_scv_use_std_bom_qty
            FROM
                BomRevisionComponent
            WHERE bomrevision = ${bomrevision}
            `
            let resultSearch = query.runSuiteQL({query: sql});
            return resultSearch.asMappedResults();
        }

        return {
            TYPE,
            FIELD,
            getDataByBomRev,
        };
        
    });
    