/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  08 Jan 2025         Khanh Tran		    	Init, create file
 */
define([],
function() {
	const FIELD = {
		ID: "id",
		INACTIVE: "isinactive",
		NAME: "name"
	}

	const RECORDS = {
		MM_DDN_DDT_PBV: {
			ID: 1,
			NAME: "MM-DDN-DDT-PBV"
		},
		MM_DDN_DDT_CR_CD: {
			ID: 2,
			NAME: "MM-DDN-DDT-CR-CD"
		},
		MM_DDN_DDT: {
			ID: 3,
			NAME: "MM-DDN-DDT"
		},
		DDN_CR_CD: {
			ID: 4,
			NAME: "DDN-CR-CD"
		},
		MM_DDN: {
			ID: 5,
			NAME: "MM-DDN"
		},
		MM_DDN_CR_CD: {
			ID: 6,
			NAME: "MM-DDN-CR-CD"
		},
		MM_DDN_CR: {
			ID: 7,
			NAME: "MM-DDN-CR"
		},
		MM_DDN_QCHT: {
			ID: 10,
			NAME: "MM-DDN-QCHT"
		},
		MM_DDN_CD_QCHT: {
			ID: 11,
			NAME: "MM-DDN-CD-QCHT"
		},
		DDN_DDT: {
			ID: 12,
			NAME: "DDN-DDT"
		},
		MM_DDN_CR_DDT: {
			ID: 13,
			NAME: "MM-DDN-CR-DDT"
		},
		MM_DDN_CD_B_DDT_CR: {
			ID: 14,
			NAME: "MM-DDN-CD-B-DDT-CR"
		}
	}
    return {
		TYPE: "customlist",
		ID: 'customlist_scv_scv_sales_price_ruless1',
		FIELD: FIELD,
		RECORDS: RECORDS
    };
    
});
