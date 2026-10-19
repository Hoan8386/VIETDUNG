/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  16 Dec 2024         Huy Pham                Init & create file
 */
define([
	'../cons/scv_cons_search.js'
],
function(
	constSearch
) {
	const ID = "customsearch_scv_cccl_remove";
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
			"custrecord_scv_yccc_line_so_phieu",
			"custrecord_scv_yccc_customer",
			"custrecord_scv_yccc_cc_date",
			"custrecord_scv_yccc_project",
			"custrecord_scv_yccc_item",
			"custrecord_scv_yccc_line_itf",
			"custrecord_scv_yccc_so_doc",
			"custrecord_scv_yccc_itf_date",
			"custrecord_scv_yccc_category",
			"custrecord_scv_yccc_item_name",
			"custrecord_scv_yccc_units",
			"custrecord_scv_yccc_qty",
			"custrecord_scv_yccc_lot_number",
			"custrecord_scv_cccl_detail_inspect_plan",
			"custrecord_scv_yccc_ori_id"
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
