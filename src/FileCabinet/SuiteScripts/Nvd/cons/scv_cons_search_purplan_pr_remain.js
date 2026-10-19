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
	const ID = "customsearch_scv_purplan_pr_remain";

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
			"",
			"",
			"oriLineId",
			"sl_khmh",
			"sl_pr",
			"sl_khmh_con_lai",
		]);

		objRes.internalid = _objSearch.id;
		return objRes;
	}

    return {
		ID: ID,
		TYPE: "transaction",
		getDataSource,
		getDataSourceFetchPage
    };
    
});
