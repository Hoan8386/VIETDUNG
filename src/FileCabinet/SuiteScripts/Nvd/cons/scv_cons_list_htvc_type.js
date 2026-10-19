/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  17 Dec 2024         Phu Pham			    Init, create file
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
		HTVC_CO_BAN: {
			ID: 1,
			NAME: "Hỗ trợ vận chuyển cơ bản"
		},
		HTVC_THEO_VUNG: {
			ID: 2,
			NAME: "Hỗ trợ vận chuyển theo vùng"
		}
	}
    return {
		TYPE: "customlist_scv_htvc_type",
		FIELD: FIELD,
		RECORDS: RECORDS
    };
    
});
