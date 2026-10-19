/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  07 Aug 2025         Phu Pham                Init & create file
 */
define(['N/search',
	'../cons/scv_cons_search.js'
],
function(search,
	constSearch
) {
	const ID = "customsearch_scv_inv_begin_balance_rpt";
	const TYPE = "transaction";

	const getDataSource = (_filters) =>{
		let resultSearch = constSearch.loadSearchWithFilter(ID, _filters);
		
		resultSearch = resultSearch.runPaged({pageSize: 1000});

		let arrResult = constSearch.fetchResultSearchAllPage(resultSearch, function(_obj, _column){
			return getObjResultFromSearch(_obj, _column);
		});

		return arrResult;
	}

	const getDataSourceFetchPage = (_filters, _params) =>{
		return constSearch.getDataSourceFetchPage_Mixed(ID, _filters, _params, [], {}, function(_obj, _column) {
			return getObjResultFromSearch(_obj, _column);
		});
		// let resultSearch = constSearch.loadSearchWithFilter(ID, _filters);
		
		// resultSearch = resultSearch.runPaged({pageSize: 1000});

		// let objRes = constSearch.fetchResultSearchPage(resultSearch, _params, function(_obj, _column){
		// 	return getObjResultFromSearch(_obj, _column);
		// })

		// return objRes;
	}

	const getObjResultFromSearch = (_objSearch, _myColumns) =>{
		let objRes = constSearch.getObjResultFromSearchByKey(_objSearch, _myColumns,[
			"subsidiary", 
			"item_upccode",
			"item_displayname",
			"unit",
			"quantity",
			"item"
		]);

		objRes.item_displayname = unReText(objRes.item_displayname);
		objRes.quantity = objRes.quantity * 1;
		
		return objRes;
	}

	const unReText = (text) => {
		let newText = text;
		if (!!text) {
			newText = newText.replace(/&amp;/gi, '&').replace(/&gt;/gi, ">").replace(/&lt;/gi, "<").replace(/&apos;/g, "'").replace(/&quot;/g, "\"").replace(//g, "");
		}
		return newText;
	}

    return {
		ID,
		TYPE,
		getDataSource,
		getDataSourceFetchPage
    };
    
});
