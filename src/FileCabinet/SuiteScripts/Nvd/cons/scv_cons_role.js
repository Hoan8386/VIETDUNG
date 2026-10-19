/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  10 Dec 2024         Huy Pham                Init & create file
 */
define([
    'N/query'
],
    function(
        query
    ) {
        const TYPE = "role";
        const FIELD = {
            ID: "id",
            NAME: "name"
        };
    
        const RECORDS = {
            ADMINISTRATOR: {
                ID: 3,
                NAME: "Administrator",
                CENTER_TYPE: "BASIC" 
            },
            PARTNER: {
                ID: 21,
                NAME: "Partner Center",
                CENTER_TYPE: "PARTNER" 
            },
            ADVANCE_PARTNER: {
                ID: 29,
                NAME: "Advanced Partner Center",
                CENTER_TYPE: "PARTNERCENTER" 
            },
            NVD_BP_KHO_VAN: {
                ID: 1622,
                NAME: "NVD BP Kho vận",
                CENTER_TYPE: "NVD_INVENTORY" 
            }
        };

        const getDataAllowViewGtriHCById = (_id) => {
            if(!_id) return false;

            let resultSQL = query.runSuiteQL({
                query: `SELECT 
                    id, name, custrecord_scv_allow_view_gtri_hoan_cong
                FROM role 
                WHERE id = ${_id}`
            }).asMappedResults();

            return resultSQL?.[0]?.custrecord_scv_allow_view_gtri_hoan_cong === "T";
        }

        return {
            TYPE,
            FIELD,
            RECORDS,

            getDataAllowViewGtriHCById
        };
        
    });
    