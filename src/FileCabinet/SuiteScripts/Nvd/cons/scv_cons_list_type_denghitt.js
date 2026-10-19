/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  10 Dec 2024         Phu Pham			    Init, create file
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
		THANH_TOAN_CONG_NO: {
			ID: 2,
			NAME: "Thanh toán công nợ"
		},
		HOAN_UNG_NV_DI_MUA_HANG: {
			ID: 11,
			NAME: "Hoàn ứng NV đi mua hàng"
		}
	}
    return {
		TYPE: "customlist_scv_type_denghitt",
		FIELD: FIELD,
		RECORDS: RECORDS
    };
    
});
