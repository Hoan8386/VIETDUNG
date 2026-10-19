/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  20 Nov 2024         Huy Pham                Init & create file
 */
define([
	'../cons/scv_cons_search.js',
	'../cons/scv_cons_format.js'
],
function(
	constSearch,
	constFormat
) {
	const ID = "customsearch_scv_asb_for_allocation_mat";
	const TYPE = "assemblybuild";

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
			"trandate",
			"tranid",
			"item",
			"serialnumber",
			"custitemnumber_scv_item_num_color_seri",
			"serialnumberquantity",
			"quantity",
			"custbody_scv_assembly_lot",
			"custbody_mfgmob_workcenter",
			"custbody_scv_work_bench",
			"custbody_scv_shift",
			"subsidiary",
			"location",
			"createdfrom",
			"line",
			"unitabbreviation",
			"lineuniquekey"
		]);

		objRes.trandate_yyyymmddhh24miss = constFormat.dateToChar(objRes.trandate, "YYYYMMDDHH24MISS");

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
