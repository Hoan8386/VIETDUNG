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
	const ID = "customsearch_scv_itf_cccl";
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
			"subsidiary",
			"trandate",
			"tranid",
			"createdfrom",
			"entityid",
			"location",
			"item",
			"item_upccode",
			"quantity",
			"unit",
			"inventorynumber",
			"binnumber",
			"inventorydetail_status",
			"custbody_scv_oriline_id",
			"item_insplan",
			"unitid",
			"itf_id",
			"customer_id",
			"item_class",
			"certificate_temp",
			"custcol_scv_ori_lineid"
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
