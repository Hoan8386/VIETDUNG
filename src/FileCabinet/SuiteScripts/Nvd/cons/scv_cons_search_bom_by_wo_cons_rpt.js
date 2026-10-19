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
	const ID = "customsearch_scv_bom_by_wo_cons_rpt";
	const TYPE = "workorder";

	const RECORDS = {
		"type": TYPE,
		"title": "SCV BOM by WO - BC Tiêu hao (Don't edit)",
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
				name: "upccode",
				join: "item",
				summary: "GROUP",
				label: "UPC code"
			}),
			search.createColumn({
				name: "displayname",
				join: "item",
				summary: "GROUP",
				label: "Display name"
			}),
			search.createColumn({
				name: "formulanumeric",
				summary: "MAX",
				formula: "case when {custcol_scv_not_include_in_bom} is null or {custcol_scv_not_include_in_bom} <> 'T' then {custcol_scv_tc_wo_org_ite_qty} end",
				label: "Original Item Qty BOM"
			}),
			search.createColumn({
				name: "custitem_scv_group_lv1",
				join: "item",
				summary: "GROUP",
				label: "Nhóm cấp 1"
			}),
			search.createColumn({
				name: "custitem_scv_group_lv2",
				join: "item",
				summary: "GROUP",
				label: "Nhóm cấp 2"
			}),
			search.createColumn({
				name: "internalid",
				join: "item",
				summary: "GROUP",
				label: "mapinternalid"
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
			"upccode",
			"item_display",
			"original_item_qty_bom",
			"group_lv1",
			"group_lv2",
			"keymapping",
			"bom_revesion",
			"nhua_tron",
			"wo_number",
			"number_of_item",
			"item_id",
			"assembly_class",
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
