/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  27 Feb 2025         Phu Pham			    Init, create file
 */
define([],
    function() {
        const FIELD = {
            ID: "id",
            INACTIVE: "isinactive"
        }
    
        const SUBLIST = {
            
        }
    
        const RECORDS = {
            TU_DONG: {
                ID: 1,
                NAME: "Tự động"
            },
            KHONG_TINH: {
                ID: 2,
                NAME: "Không tính"
            },
            NHAP_THU_CONG: {
                ID: 3,
                NAME: "Nhập thủ công"
            },
        }

        return {
            TYPE: "customrecord_scv_so_qt",
            FIELD,
            SUBLIST,
            RECORDS,
        };
        
    });