/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  01 Mar 2025         Huy Pham			    Init, create file
 */
define([],
    function() {
        const FIELD = {
            ID: "id",
            INACTIVE: "isinactive",
            NAME: "name"
        }
    
        const SUBLIST = {
            
        }
    
        const RECORDS = {
            APPROVED: {
                ID: 109,
                NAME: "Đã duyệt"
            },
        }
        return {
            TYPE: "customlist_scv_cmms_status",
            FIELD,
            SUBLIST,
            RECORDS
        };
        
    });