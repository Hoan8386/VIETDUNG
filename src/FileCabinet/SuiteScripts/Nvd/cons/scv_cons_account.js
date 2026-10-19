/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  25 Nov 2024         Phu Pham			    Init, create file
 */
define([],
    function() {

        const FIELD = {
            ID: "id",
            INACTIVE: "isinactive",
            NAME: "name",
            NUMBER: "acctnumber"
        }
    
        const SUBLIST = {
            
        }
    
        const RECORDS = {
            _15410001: {
                ID: 222,
                NUMBER: "15410001",
                NAME: "Chi phí SXKD dở dang"
            },
            _154102: {
                ID: 1235,
                NUMBER: "154102",
                NAME: "Chi phí SXKD dở dang - Gia công kỹ thuật"  
            }
        }
        return {
            FIELD, 
            SUBLIST,
            RECORDS
        };
    });
    