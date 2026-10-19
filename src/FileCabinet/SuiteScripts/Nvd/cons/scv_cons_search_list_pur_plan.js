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
	const ID = "customsearch_scv_list_pur_plan";

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
			"ngay_khmh",
			"so_khmh",
			"item",
			"units_display",
			"sl_khm",
			"memo",
			"plkh",
			"department",
			"units",
			"memo_line",
			"sl_con_lai",
			"oriLineId",
			"unit_conversion_rate",
			"department_line",
			"sl_duyet_mua",
			"nhom_hang_hoa",
			"so_hieu_market",
			"mo_ta_chi_tiet_hh",
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
