/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  28 Oct 2024         Khanh Tran			    Init, create file
 */
define([],
function() {
	const TYPE = "customlist_scv_entity_category_type";
	const FIELD = {
		ID: "id",
		NAME: "name"
	}

	const RECORDS = {
		CUSTOMER: {
			ID: 1,
			NAME: "Customer"
		},
		VENDOR: {
			ID: 2,
			NAME: "Vendor"
		}
	}

    return {
		TYPE,
		FIELD,
		RECORDS
    };
    
});
