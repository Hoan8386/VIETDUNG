/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  24 Feb 2025         Khanh Tran			    Init, create file
 */
define([
	'../cons/scv_cons_search.js',
],
function(
	constSearch
) {
	const FIELD = {
		ID: "id",
		INACTIVE: "isinactive",
		NAME: "name"
	}

	const SUBLIST = {
		
	}

	const RECORDS = {
		XUAT_KHAU: {
			ID: 2,
			NAME: "Xuất khẩu"
		},
	}

	const getDataSource = (_filters) => {
		let resultSearch =  constSearch.createSearchWithFilter({
			type: "customrecord_cseg_scv_sc",
			filters:
			[
				["isinactive","is","F"]
			],
			columns:
			[
				"internalid",
				"name"
			]
		}, _filters);
		
		let arrResult = constSearch.fetchResultSearchRunEach(resultSearch, function(_objTmpl, _column){
			let objResTmpl = constSearch.getObjResultFromSearchByKey(_objTmpl, _column, [
				"internalid",
				"name"
			]);

			return objResTmpl;
		});
		
		return arrResult;
	}

    return {
		TYPE: "customrecord_cseg_scv_sc",
		FIELD,
		SUBLIST,
		RECORDS,
		getDataSource
    };
    
});
