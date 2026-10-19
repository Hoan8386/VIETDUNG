/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  12 Dec 2024         Phu Pham			    Init, create file
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
		KE_HOACH_BAN_DAU: {
			ID: 1,
			NAME: "Kế hoạch ban đầu"
		},
		KE_HOACH_DIEU_CHINH: {
			ID: 2,
			NAME: "Kế hoạch điều chỉnh"
		}
	}
    return {
		TYPE: "customlist_scv_plan_type",
		FIELD: FIELD,
		RECORDS: RECORDS
    };
    
});
