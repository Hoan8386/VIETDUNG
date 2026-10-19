/**
 * Nội dung: 
 * Version: 1.25031.1
 * =======================================================================================
 *  Date                Author                  Description
 *  31 Mar 2025         Huy Pham                Init & create file
 */
define(['N/search',
	'../cons/scv_cons_search.js'
],
function(search,
	constSearch
) {
	const ID = "";
	const TYPE = "inventorybalance";

	const RECORDS = {
		type: "inventorybalance",
		filters:
		[
		],
		columns:
		[
			search.createColumn({name: "item", label: "Item"}),
			search.createColumn({name: "location", label: "Location"}),
			search.createColumn({name: "inventorynumber", label: "Inventory Number"}),
			search.createColumn({name: "binnumber", label: "Bin Number"}),
			search.createColumn({name: "available", label: "Available"}),
			search.createColumn({
				name: "stockunit",
				join: "item",
				label: "Primary Stock Unit"
			}),
			search.createColumn({name: "status", label: "Status"}),
			search.createColumn({
				name: "expirationdate",
				join: "inventoryNumber",
				label: "Expiration Date"
			})
		]
	}

	const getDataSource = (_filters) =>{
		let resultSearch = constSearch.createSearchWithFilter(RECORDS, _filters);
		
		resultSearch = resultSearch.runPaged({pageSize: 1000});

		let arrResult = constSearch.fetchResultSearchAllPage(resultSearch, function(_obj, _column){
			return getObjResultFromSearch(_obj, _column);
		});

		return arrResult;
	}

	const getDataSourceFetchPage = (_filters, _params) =>{
		let resultSearch = constSearch.createSearchWithFilter(RECORDS, _filters);
		
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
			"inventorynumber",
			"binnumber",
			"available",
			"stockunit",
			"status",
			"expirationdate"
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
