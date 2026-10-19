/**
 * Nội dung:
 * =======================================================================================
 *  Date                Author                  Description
 *  13 Dec 2024			Khanh Tran				Init. Create file
 */
define(['N/search',
	'../cons/scv_cons_search.js'
],
function(search,
	constSearch,
) {
	const ID = "customsearch_scv_onhand_tro";
	const TYPE = "inventorybalance";
	
	const getDataSource = (filters) =>{
		let resultSearch = search.load({id: ID, type: TYPE});
		let myFilters = resultSearch.filters;
		if(util.isArray(filters)){
			filters.forEach(objFilter => myFilters.push(objFilter));
		}
		else if(util.isObject(filters) || typeof(filters) == "object"){
			myFilters.push(filters)
		}

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
			"item",
			"location",
			"inventory_number",
			"bin_number",
			"status",
			"on_hand",
			"stock_unit",
		]);

		objRes.internalid = _objSearch.id;
		return objRes;
	}

    return {
		ID: ID,
		TYPE: TYPE,
		getDataSource,
		getDataSourceFetchPage
    };
    
});
