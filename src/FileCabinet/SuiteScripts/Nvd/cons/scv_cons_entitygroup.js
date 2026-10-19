/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  17 Jan 2025         Huy Pham			    Init, create file
 */
define([
	'../cons/scv_cons_search.js'
],
function(
	constSearch
	) {
		
	const TYPE = "entitygroup";

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
			type: "entitygroup",
			filters:
			[
				["isinactive","is","F"]
			],
			columns:
			[
				"internalid",
				"groupname", "custentity_scv_sub"
			]
		}, _filters);
		
		let arrResult = constSearch.fetchResultSearchRunEach(resultSearch, function(_objTmpl, _column){
			let objResTmpl = constSearch.getObjResultFromSearchByKey(_objTmpl, _column, [
				"internalid",
				"groupname", "custentity_scv_sub"
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
