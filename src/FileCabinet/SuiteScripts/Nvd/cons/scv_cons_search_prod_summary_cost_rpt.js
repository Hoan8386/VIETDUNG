/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  08 Aug 2025         Khanh Tran			    Init, create file. Báo cáo bảng tính giá thành, form mr.TMPhúc(https://app.clickup.com/t/86czxcy1f)
 */
define(['N/search',
	'../cons/scv_cons_search.js'
],
function(search,
	constSearch
) {
	const ID = "customsearch_scv_prod_summary_cost_rpt";
	const TYPE = "transaction";

	const RECORDS = {
		"type": TYPE,
		"title": "SCV Production Summary Cost - BC tính giá thành (Don't Update)",
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
				name: "formulanumeric",
				summary: "SUM",
				formula: "ROUND(SUM({amount})/SUM({quantity}), 2)",
				label: "Cost Per Quantity"
			}),
			search.createColumn({
				name: "amount",
				summary: "SUM",
				label: "Total Amount"
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
			"item_code",
			"item_display",
			"unit",
			"ttl_qty",
			"cost_per_qty",
			"ttl_amt",
			"assembly_name",
			"do_day_tam",
			"do_day_nhom",
			"chieu_rong",
			"chieu_dai",
			"assembly_old_code",
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
