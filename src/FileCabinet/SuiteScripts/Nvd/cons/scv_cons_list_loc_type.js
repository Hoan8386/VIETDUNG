/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  17 Feb 2025         Phu Pham			    Init, create file
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
		KHO_SAN_XUAT: {
			ID: 1,
			NAME: "Kho sản xuất"
		},
		KHO_NVL_SAN_XUAT: {
			ID: 2,
			NAME: "Kho NVL sản xuất"
		}
	}
    return {
		TYPE: "customlist_scv_loc_type",
		FIELD: FIELD,
		RECORDS: RECORDS
    };
    
});
