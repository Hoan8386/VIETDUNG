/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  04 Dec 2024         Huy Pham			    Init, create file
 */
define([
	'../cons/scv_cons_search.js'
],
function(
	constSearch
	) {
		
	const TYPE = "customrecord_scv_pur_plan_ind";

	const FIELD = {
		ID: "id",
		INACTIVE: "isinactive",
		NAME: "name"
	}

	const SUBLIST = {
		
	}

	const RECORDS = {
		
	}

	const getDataSource = (_filters) => {
		let resultSearch =  constSearch.createSearchWithFilter({
			type: "customrecord_scv_pur_plan_ind",
			filters:
			[
				["isinactive","is","F"]
			],
			columns:
			[
				"internalid",
				"name", "custrecord_scv_pur_plan_ind_subsidiary", "custrecord_scv_pur_plan_ind_dkhv",
				"custrecord_scv_pur_plan_ind_receipt_date", "custrecord_scv_pur_plan_ind_hsdc",
				"custrecord_scv_pur_plan_ind_start_date", "custrecord_scv_pur_plan_ind_end_date",
				"custrecord_scv_pur_plan_ind_ndm", "custrecord_scv_pur_plan_date_used_from",
				"custrecord_scv_pur_plan_ind_date_used_to"
			]
		}, _filters);
		
		let arrResult = constSearch.fetchResultSearchRunEach(resultSearch, function(_objTmpl, _column){
			let objResTmpl = constSearch.getObjResultFromSearchByKey(_objTmpl, _column, [
				"internalid",
				"name", "custrecord_scv_pur_plan_ind_subsidiary", "custrecord_scv_pur_plan_ind_dkhv",
				"custrecord_scv_pur_plan_ind_receipt_date", "custrecord_scv_pur_plan_ind_hsdc",
				"custrecord_scv_pur_plan_ind_start_date", "custrecord_scv_pur_plan_ind_end_date",
				"custrecord_scv_pur_plan_ind_ndm", "custrecord_scv_pur_plan_date_used_from",
				"custrecord_scv_pur_plan_ind_date_used_to"
			]);

			return objResTmpl;
		});
		
		return arrResult;
	}

    return {
		TYPE,
		FIELD,
		SUBLIST,
		RECORDS,
		getDataSource
    };
    
});
