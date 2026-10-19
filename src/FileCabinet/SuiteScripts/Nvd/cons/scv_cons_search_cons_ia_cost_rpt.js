/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  25 Aug 2025         Khanh Tran			    Init, create file. Báo cáo tiêu hao sản xuất, form ms.Kỳ(https://app.clickup.com/t/86d02hr1u)
 */
define(['N/search',
	'../cons/scv_cons_search.js'
],
function(search,
	constSearch
) {
	const ID = "customsearch_scv_cons_ia_cost_rpt";
	const TYPE = "inventoryadjustment";

	const RECORDS = {
		"type": TYPE,
		"title": "SCV Tiêu hao chạy đánh giá SX - BC tiêu hao (don't edit): Results",
		"id": ID,
		"isPublic": true,
		"settings":[{"name":"consolidationtype","value":"ACCTTYPE"}],
		"filters":
		[
			["type","anyof","InvAdjst"], 
			"AND", 
			["custbody_scv_order_type","anyof","103","104"], 
			"AND", 
			["mainline","is","F"], 
			"AND", 
			["cogs","is","F"]
		],
		"columns":
		[
			search.createColumn({
				name: "subsidiarynohierarchy",
				summary: "GROUP",
				label: "Subsidiary"
			}),
			search.createColumn({
				name: "upccode",
				join: "item",
				summary: "GROUP",
				label: "UPC Code"
			}),
			search.createColumn({
				name: "displayname",
				join: "item",
				summary: "GROUP",
				label: "Display Name"
			}),
			search.createColumn({
				name: "item",
				summary: "GROUP",
				label: "Item"
			}),
			search.createColumn({
				name: "formulanumeric",
				summary: "SUM",
				formula: "abs({quantity})",
				label: "Quantity"
			}),
			search.createColumn({
				name: "internalid",
				join: "item",
				summary: "GROUP",
				label: "Item Internalid"
			})
		]
	}

	const getDataSource = (_filters) =>{
		let resultSearch = constSearch.loadSearchWithFilter(ID, _filters);
		
		resultSearch = resultSearch.runPaged({pageSize: 1000});

		let arrResult = constSearch.fetchResultSearchAllPage(resultSearch, function(_obj, _column){
			return getObjResultFromSearch(_obj, _column);
		});

		return arrResult;
	}

	const getDataSourceFetchPage = (_filters, _params) =>{
		let objRes = constSearch.getDataSourceFetchPage_Mixed(ID, _filters, _params, [], RECORDS, function(_obj, _column){
			return getObjResultFromSearch(_obj, _column);
		})

		return objRes;
	}

	const getObjResultFromSearch = (_objSearch, _myColumns) =>{
		let objRes = constSearch.getObjResultFromSearchByKey(_objSearch, _myColumns,[
			"subsidiary",
			"upccode",
			"display_name",
			"item",
			"quantity",
			"item_id"
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
