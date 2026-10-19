/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  28 Nov 2024         Huy Pham                Init & create file
 */
define(['N/search', 'N/query',
    '../cons/scv_cons_record.js'
],
    function(search, query,
        constRecord
    ) {
        const TYPE = "customrecord_scv_import_inventorydetail";
        const FIELD = {
            ID: "id",
            INACTIVE: "isinactive",
            NAME: "name"
        }
    
        const SUBLIST = {
            
        }
    
        const RECORDS = {
        }

        return {
            TYPE,
            FIELD,
            SUBLIST,
            RECORDS
        };
        
    });
    