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
	const ID = "customsearch_scv_bom_revision_cost_rpt";
	const TYPE = "bomrevision";

	const RECORDS = {
		"type": TYPE,
		"title": "SCV Bill of Materials Revision - BC tính giá thành (Don't Update)",
		"id": ID,
		"isPublic": true,
		"filters":
		[
			["transaction.type","anyof","Build"], 
			"AND", 
			["transaction.mainline","is","T"], 
			"AND", 
			["formulanumeric: case when {transaction.createdfrom.id} is null and {transaction.class.id} not in (43) then 1 else 0 end","equalto","1"]
		],
		"columns":
		[
			search.createColumn({
				name: "custbody_scv_wo_assembly",
				join: "transaction",
				summary: "GROUP",
				label: "Assembly"
			}),
			search.createColumn({
				name: "item",
				join: "component",
				summary: "GROUP",
				label: "Item"
			}),
			search.createColumn({
				name: "formulanumeric",
				summary: "MAX",
				formula: "case when {component.custrecord_scv_use_std_bom_qty} = 'T' then {component.quantity} else {component.quantity}*{transaction.custbody_scv_unit_conversion_rate} end",
				label: "Original Item Qty BOM"
			}),
			search.createColumn({
				name: "formulatext",
				summary: "GROUP",
				formula: "{transaction.custbody_scv_wo_assembly.id} || {component.item.id}",
				label: "Key Mapping"
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
