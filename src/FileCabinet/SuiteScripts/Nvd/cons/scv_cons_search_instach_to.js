/**
 * Nội dung:
 * =======================================================================================
 *  Date                Author                  Description
 *  13 Dec 2024			Khanh Tran				Init. Create file
 */
define(['../cons/scv_cons_search.js'
],
function(constSearch,
) {
	const ID = "customsearch_scv_instach_to";
	const TYPE = "inventorystatuschange";
	
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
			"date",
			"doc_num",
			"crt_from_display",
			"rlt_tran_display",
			"location",
			"item",
			"oriline_id",
			"inventory_number",
			"bin_number",
			"exp_date",
			"quantity",
			"status",
			"unit",
			"crt_from",
			"rlt_tran",
			"internalid"
		]);

		constSearch.replaceValueNoneByKey(objRes);
		
		return objRes;
	}

    return {
		ID: ID,
		TYPE: TYPE,
		getDataSource,
		getDataSourceFetchPage
    };
    
});
