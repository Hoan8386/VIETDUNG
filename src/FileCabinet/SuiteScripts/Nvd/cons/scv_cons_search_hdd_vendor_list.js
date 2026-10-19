/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  28 May 2025         Khanh Tran			    Init, create file.
 */
define([
	'../cons/scv_cons_search.js'
],
function(
	constSearch
) {
	const ID = "customsearch_scv_hdd_vendor_list";
	const TYPE = "vendor";

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
			"name",
			"vendor_category"
		]);

		objRes.vendor_id = _objSearch.id;
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
