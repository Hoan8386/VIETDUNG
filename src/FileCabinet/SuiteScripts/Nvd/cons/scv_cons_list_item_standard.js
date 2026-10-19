/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  12 Dec 2024         Huy Pham			    Init, create file
 */
define([
	'../cons/scv_cons_search.js'
],
function(
	constSearch
	) {
		
	const TYPE = "customrecord_scv_list_item_standard";

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
			type: "customrecord_scv_list_item_standard",
			filters:
			[
				["isinactive","is","F"]
			],
			columns:
			[
				"internalid",
				"name", "custrecord_scv_list_item_standard_categ", "custrecord_scv_list_item_standard_sub",
				"custrecord_scv_list_item_standard_stadat",
				"custrecord_scv_list_item_standard_endate"
			]
		}, _filters);
		
		let arrResult = constSearch.fetchResultSearchRunEach(resultSearch, function(_objTmpl, _column){
			let objResTmpl = constSearch.getObjResultFromSearchByKey(_objTmpl, _column, [
				"internalid",
				"name", "custrecord_scv_list_item_standard_categ", "custrecord_scv_list_item_standard_sub",
				"custrecord_scv_list_item_standard_stadat",
				"custrecord_scv_list_item_standard_endate"
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
