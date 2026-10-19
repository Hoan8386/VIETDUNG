/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  21 Nov 2024         Huy Pham			    Init, create file
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
		NANG: {
			ID: 1,
			NAME: "Nâng"
		},
		HA: {
			ID: 2,
			NAME: "Hạ"
		},
		
	}
    return {
		TYPE: "customlist_scv_lift_type",
		FIELD: FIELD,
		SUBLIST: SUBLIST,
		RECORDS: RECORDS
    };
    
});
