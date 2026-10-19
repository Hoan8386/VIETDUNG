/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  14 May 2025          Huy Pham			    Init, create file
 */
define([
    '../cons/scv_cons_search.js',
],
    function(
        constSearch,
    ) {
        const TYPE = "customrecord_cseg_scv_pc";
        const FIELD = {
            ID: "id",
            INACTIVE: "isinactive",
            NAME: "name"
        }
    
        const SUBLIST = {
        }
    
        const RECORDS = {
            NOI_DIA: {
                ID: 1,
                NAME: "Nội địa"
            },
            NHAP_KHAU: {
                ID: 2,
                NAME: "Nhập khẩu"
            }
        }

        return {
            TYPE,
            FIELD,
            SUBLIST,
            RECORDS,
        };
        
    });
    