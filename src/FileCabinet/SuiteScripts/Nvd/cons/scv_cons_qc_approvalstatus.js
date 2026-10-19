/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  16 Dec 2024         Phu Pham			    Init, create file
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
                ID: 5,
                NAME: "Approved"
            }
        }
        return {
            TYPE: "customrecord_scv_megram_appr_status",
            FIELD: FIELD,
            SUBLIST: SUBLIST,
            RECORDS: RECORDS
        };
        
    });