/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  10 Jan 2025         Khanh Tran   		    Init, create file
 */
define([],
function() {
	const FIELD = {
		ID: "id",
		INACTIVE: "isinactive",
		NAME: "name"
	}

	const RECORDS = {
		THEO_DOI_CONG_VIEC: {
			ID: 1,
			NAME: "Theo dõi công việc"
		},
		THEO_DOI_BOI_THUONG: {
			ID: 2,
			NAME: "Theo dõi bồi thường"
		},
		THEO_DOI_PAKT: {
			ID: 3,
			NAME: "Theo dõi phương án kỹ thuật"
		}
	}
    return {
		TYPE: "customlist",
		FIELD: "customlist_scv_task_type",
		RECORDS: RECORDS
    };
    
});
