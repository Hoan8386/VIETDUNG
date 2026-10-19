/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  24 Feb 2025         Huy Pham                Init & create file
 */
define([
    'N/record'
],
    function(
        record
    ) {
        const TYPE = "workorder";
        const FIELD = {
            ID: "id",
            INACTIVE: "isinactive",
            NAME: "name"
        }
    
        const SUBLIST = {
            ITEM: {
                ID: "item",
                TYPE : "transactionline",
                FIELD: {}
            },
        }
    
        const RECORDS = {
            WORK_ORDER: {
                ID: 44,
                TYPE: record.Type.WORK_ORDER,
                NAME: "Work Order"
            },
            OTHER_WORK_OTHER: {
                ID: 120,
                TYPE: record.Type.OTHER_WORK_OTHER,
                NAME: "Other Work Order"
            },
        }

        return {
            TYPE,
            FIELD,
            SUBLIST,
            RECORDS
        };
        
    });
    