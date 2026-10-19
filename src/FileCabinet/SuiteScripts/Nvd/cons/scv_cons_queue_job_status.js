/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  08 Nov 2024         Huy Pham                Init & create file, move from Adv, from mr.Việt(https://app.clickup.com/t/86cx0fvqd)
 */
define([
	
],
function(
) {
	const TYPE = "customlist_scv_queue_job_status";
    const FIELD = {
        ID: "id",
        INACTIVE: "isinactive",
        NAME: "name"
    }

    const SUBLIST = {
        
    }

    const RECORDS = {
		PENDING: {
			ID: 1,
			NAME: "Pending"
		},
		PROCESSING: {
			ID: 2,
			NAME: "Processing"
		},
		COMPLETED: {
			ID: 3,
			NAME: "Completed"
		},
		CANCEL: {
			ID: 4,
			NAME: "Cancel"
		}
    }


    return {
		TYPE,
        FIELD,
        SUBLIST,
        RECORDS
    };
    
});
