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
	const ID = "customsearch_scv_bom_by_wo_cost_rpt";
	const TYPE = "workorder";

	const RECORDS = {
		"type": TYPE,
		"settings":[{"name":"consolidationtype","value":"ACCTTYPE"}],
		"title": "SCV Bill of Materials by Work Order - BC tính giá thành (Don't Update)",
		"id": ID,
		"isPublic": true,
		"filters": [
			["type","anyof","WorkOrd"], 
			"AND", 
			["custbody_scv_work_order_type","anyof","3","2","4","1","5"], 
			"AND", 
			["mainline","is","F"], 
			"AND", 
			[["status","noneof","WorkOrd:H"],"OR",[["status","anyof","WorkOrd:H"],"AND",["built","greaterthan","0"]]], 
			"AND", 
			["applyingtransaction","noneof","@NONE@"]
		],
		"columns": [
			search.createColumn({
				name: "custbody_scv_wo_assembly",
				summary: "GROUP",
				label: "Assembly"
			}),
			search.createColumn({
				name: "item",
				summary: "GROUP",
				label: "Item"
			}),
			search.createColumn({
				name: "formulanumeric",
				summary: "MAX",
				formula: "case when {custcol_scv_not_include_in_bom} is null or {custcol_scv_not_include_in_bom} <> 'T' then {custcol_scv_tc_wo_org_ite_qty} end",
				label: "Original Item Qty BOM"
			}),
			search.createColumn({
				name: "formulatext",
				summary: "GROUP",
				formula: "{custbody_scv_wo_assembly.internalid} || {item.internalid}",
				label: "Key Mapping"
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
			"item",
			"original_item_qty_bom",
			"key_mapping",
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
