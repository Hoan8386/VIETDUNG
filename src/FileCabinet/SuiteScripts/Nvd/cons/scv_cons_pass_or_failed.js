/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  16 Dec 2024         Huy Pham			    Init, create file
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
		CHO_KIEM: {
			ID: 1,
			NAME: "Chờ Kiểm"
		},
		DAT: {
			ID: 2,
			NAME: "Đạt"
		},
		KHONG_DAT: {
			ID: 3,
			NAME: "Không Đạt"
		},
	}
    return {
		TYPE: "customlist_scv_pass_or_failed",
		FIELD: FIELD,
		SUBLIST: SUBLIST,
		RECORDS: RECORDS
    };
    
});
