/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  03 Jun 2026         Phu Pham			    Init, create file
 */
define([],
function() {
	
	const Field = {
		ID: "id",
		INACTIVE: "isinactive",
		NAME: "name"
	};

	const Sublist = {
		
	};

	const Records = {
		NguyenLieuChinh: {
			ID: 3,
			NAME: "NGUYÊN LIỆU CHÍNH"
		}
	};

    return {
		TYPE: "customlist_scv_prod_cost_group",
		Field,
		Sublist,
		Records,
    };
    
});
