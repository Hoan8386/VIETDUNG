/**
 * Nội dung:
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  03 Nov 2025         Khanh Tran			    Init, create file. Báo cáo tiêu hao sản xuất, form mr.Phúc(https://app.clickup.com/t/86d02hr1u)
 */
define(['N/search',
	'../cons/scv_cons_search.js'
],
function(search,
	constSearch
) {
	const ID = "customsearch_scv_cons_ab_nhua_cost_rpt";
	const TYPE = "transaction";

	const RECORDS = {
		"type": TYPE,
		"title": "SCV Cost Assembly Build Nhựa - BC tiêu hao (don't edit)",
		"id": ID,
		"isPublic": true,
		"filters": [
			["type","anyof","Build","Unbuild"],
			"AND",
			["custbody_scv_work_order_type","anyof","3","2","4","1","5"],
			"AND",
			["mainline","is","F"],
			"AND",
			["customgl","is","F"],
			"AND",
			["formulanumeric: case when {memo} like 'Cost of Sales Adjustment' then 1 else 0 end","equalto","0"], 
			"AND",
			["formulanumeric: case when {createdfrom.internalid} is null then 1 when {createdfrom.internalid} is not null and {createdfrom.mainline} = '*' then 1 else 0 end","equalto","1"], 
			"AND",
			["formulanumeric: case when {custbody_scv_orrginal_wo.internalid} is null then 1 when {custbody_scv_orrginal_wo.internalid} is not null and {custbody_scv_orrginal_wo.mainline} = '*' then 1 else 0 end","equalto","1"], 
			"AND",
			["item.type","anyof","Assembly","InvtPart"],
			"AND",
			["formulanumeric: case when ({item.custitem_scv_group_lv1} = 'NT:Nhựa trộn' or {item.custitem_scv_group_lv2} = 'NX:Nhựa xay') then 1 else 0 end","equalto","1"], 
			"AND",
			["quantity","notequalto","0"]
		],
		"columns": [
			search.createColumn({
				name: "formulatext",
				summary: "GROUP",
				formula: "nvl({createdfrom.item}, {custbody_scv_orrginal_wo.item})",
				label: "Assembly"
			}),
			search.createColumn({
				name: "formulatext",
				summary: "GROUP",
				formula: "nvl({createdfrom.number}, {custbody_scv_orrginal_wo.number})",
				label: "WO Number"
			}),
			search.createColumn({
				name: "formulatext",
				summary: "MAX",
				formula: "NS_CONCAT(distinct(decode({item.custitem_scv_group_lv1}, 'NT:Nhựa trộn', {item})))",
				label: "Item Name (Nhua tron)"
			}),
			search.createColumn({
				name: "formulatext",
				summary: "MAX",
				formula: "NS_CONCAT(distinct(decode({item.custitem_scv_group_lv2}, 'NX:Nhựa xay', {item})))",
				label: "Item Name (Nhua xay)"
			}),
			search.createColumn({
				name: "formulanumeric",
				summary: "SUM",
				formula: "abs(decode({item.custitem_scv_group_lv1}, 'NT:Nhựa trộn', {quantity}, 0))",
				label: "Total Quantity (Nhua tron)"
			}),
			search.createColumn({
				name: "formulanumeric",
				summary: "SUM",
				formula: "abs(decode({item.custitem_scv_group_lv2}, 'NX:Nhựa xay', {quantity}, 0))",
				label: "Total Quantity (Nhua xay)"
			}),
			search.createColumn({
				name: "name",
				join: "bomRevision",
				summary: "GROUP",
				label: "BOM Revision"
			}),
			search.createColumn({
				name: "formulatext",
				summary: "MAX",
				formula: "NS_CONCAT(distinct(decode({item.custitem_scv_group_lv1}, 'NT:Nhựa trộn', {item.internalid} || {bomrevision.internalid})))",
				label: "Key Mapping"
			}),
			search.createColumn({
				name: "formulatext",
				summary: "GROUP",
				formula: "nvl({createdfrom.item.id}, {custbody_scv_orrginal_wo.item.id}) || {bomrevision.internalid} ",
				label: "Key Mapping Total Cost"
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
			"wo_number",
			"item_name_nhua_tron",
			"item_name_nhua_xay",
			"total_quantity_nhua_tron",
			"total_quantity_nhua_xay",
			"bom_revision",
			"keymapping",
			"keymapping_total_cost",
			"has_consumption",
			"ab_internal_related",
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
