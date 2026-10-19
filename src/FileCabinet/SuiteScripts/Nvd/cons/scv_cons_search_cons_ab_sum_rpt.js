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
	const ID = "customsearch_scv_cons_ab_sum_rpt";
	const TYPE = "transaction";

	const RECORDS = {
		"type": TYPE,
		"title": "SCV sum assembly build - BC tiêu hao (don't edit)",
		"id": ID,
		"isPublic": true,
		"filters": [
			["type","anyof","Build","Unbuild"], 
			"AND", 
			["custbody_scv_work_order_type","anyof","3","2","4","1","5"], 
			"AND", 
			["mainline","is","T"]
		],
		"columns": [
			search.createColumn({
				name: "internalid",
				join: "item",
				summary: "GROUP",
				label: "AB internalid"
			}),
			search.createColumn({
				name: "item",
				summary: "GROUP",
				label: "Assembly"
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
				name: "unit",
				summary: "GROUP",
				label: "Unit"
			}),
			search.createColumn({
				name: "quantity",
				summary: "SUM",
				label: "Total Quantity"
			}),
			search.createColumn({
				name: "amount",
				summary: "SUM",
				label: "Total Amount"
			}),
			search.createColumn({
				name: "formulatext",
				summary: "GROUP",
				formula: "regexp_substr({item},'[^:]*$')",
				label: "Assembly Name"
			})
		],
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
			"assembly",
			"assembly_display",
			"upccode",
			"item_display",
			"unit",
			"total_qty",
			"total_amt",
			"assembly_name",
			"conversion_rate",
			"bom_revision",
			"keymapping_detail_cost",
			"wo_number",
			"ab_internal",
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
