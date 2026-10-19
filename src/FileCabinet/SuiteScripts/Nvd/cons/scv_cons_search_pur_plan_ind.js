/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  10 Dec 2024         Huy Pham                Init & create file
 */
define([
	'../cons/scv_cons_search.js'
],
function(
	constSearch
) {
	const ID = "customsearch_scv_pur_plan_ind";
	const TYPE = "customrecord_scv_pur_plan_ind";

	const RECORDS = {}

	const getDataSource = (_filters) =>{
		let resultSearch = constSearch.loadSearchWithFilter(ID, _filters);
		
		resultSearch = resultSearch.runPaged({pageSize: 1000});

		let arrResult = constSearch.fetchResultSearchAllPage(resultSearch, function(_obj, _column){
			return getObjResultFromSearch(_obj, _column);
		});

		return arrResult;
	}

	const getDataSourceFetchPage = (_filters, _params) =>{
		let resultSearch = constSearch.loadSearchWithFilter(ID, _filters);
		
		resultSearch = resultSearch.runPaged({pageSize: 1000});

		let objRes = constSearch.fetchResultSearchPage(resultSearch, _params, function(_obj, _column){
			return getObjResultFromSearch(_obj, _column);
		})

		return objRes;
	}

	const getObjResultFromSearch = (_objSearch, _myColumns) =>{
		let objRes = constSearch.getObjResultFromSearchByKey(_objSearch, _myColumns,[
			"internalid",
			"name",
			"custrecord_scv_pur_plan_ind_subsidiary",
			"custrecord_scv_pur_plan_ind_start_date",
			"custrecord_scv_pur_plan_ind_end_date",
			"custrecord_scv_pur_plan_ind_dkhv",
			"custrecord_scv_pur_plan_ind_receipt_date",
			"custrecord_scv_pur_plan_ind_hsdc",
			"custrecord_scv_pur_plan_date_used_from",
			"custrecord_scv_pur_plan_ind_date_used_to"
		]);

		return objRes;
	}

    return {
		ID,
		TYPE,
		RECORDS,
		getDataSource,
		getDataSourceFetchPage
    };
    
});
