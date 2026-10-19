/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  17 Feb 2025         Huy Pham			    Init, create file
 */
define(['N/query'],
function(query) {
	const FIELD = {
		ID: "id",
		INACTIVE: "isinactive",
		NAME: "name"
	}

	const SUBLIST = {
		
	}

	const RECORDS = {
		SANXUAT: {
			ID: 1,
			NAME: "Kho Sản Xuất"
		},
		NVL_SANXUAT: {
			ID: 2,
			NAME: "Kho NVL Sản Xuất"
		}
	}

    return {
		TYPE: "customlist_scv_loc_type",
		FIELD,
		SUBLIST,
		RECORDS
    };
    
});
