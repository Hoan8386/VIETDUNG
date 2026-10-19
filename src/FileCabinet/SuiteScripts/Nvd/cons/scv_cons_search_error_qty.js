/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  2 Mar 2025          Huy Pham			    Init, create file, Chức năng tính toán Số lượng lỗi lật tấm, from mr.NĐHuy(https://app.clickup.com/t/86cy51faq)
 */
define([
	'../cons/scv_cons_search.js'
],
function(
	constSearch
) {
	const ID = "customsearch_scv_error_qty";
	const TYPE = "customrecord_scv_detail_shift";

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
			"custrecord_scv_ds_date",
			"custrecord_scv_ds_to",
			"custrecord_scv_ds_error_des",
			"custrecord_scv_ds_error",
			"custrecord_scv_ds_single_error",
			"custrecord_scv_ds_multi_error",
			"custrecord_scv_ds_note",
			"custrecord_scv_inspl_item",
			"custrecord_scv_ds_inslot"
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
