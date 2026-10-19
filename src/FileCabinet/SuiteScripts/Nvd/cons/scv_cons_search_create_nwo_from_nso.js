/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  24 Feb 2025         Huy Pham                Init & create file
 */
define([
	'../cons/scv_cons_search.js'
],
function(
	constSearch
) {
	const ID = "customsearch_scv_create_nwo_from_nso";
	const TYPE = "transaction";

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
			"custcol_scv_ori_lineid",
			"subsidiary",
			"trandate",
			"tranid",
			"entityid",
			"customer_internalid",
			"custbody_scv_employee_ycxvt",
			"cseg_scv_sc",
			"item",
			"quantity",
			"unit",
			"custcol_scv_wo_type",
			"custcol_scv_memo_2",
			"requesteddate",
			"custcol_scv_color_seri",
			"default_wo_location"
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
