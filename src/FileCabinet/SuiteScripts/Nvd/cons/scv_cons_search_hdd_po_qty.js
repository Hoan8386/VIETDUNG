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
	const ID = "customsearch_scv_hdd_po_qty";
	const TYPE = "purchaseorder";

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
			"cong_ty",
			"po_id",
			"po_no",
			"item_id",
			"ma_item",//5
			"item",
			"qty_po",
			"qty_chenh_lech_cp",
			"pr_no",
			"pr_date",//10
			"dvt_co_so",
			"dung_sai_am",
			"ma_ncc",
			"ten_ncc",
			"po_date",//15
			"oriline_id",
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
