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
	const ID = "customsearch_scv_prod_detail_cost_rpt";
	const TYPE = "transaction";

	const RECORDS = {
		"type": TYPE,
		"title": "SCV Production Detail Cost - BC tính giá thành (Don't Update)",
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
			["formulanumeric: case when {custbody_scv_orrginal_wo.internalid} is null then 1 when {custbody_scv_orrginal_wo.internalid} is not null and {custbody_scv_orrginal_wo.mainline} = '*' then 1 else 0 end","equalto","1"]
		],
		"columns": [
			search.createColumn({
				name: "formulanumeric",
				summary: "GROUP",
				formula: "nvl({createdfrom.item.id}, {custbody_scv_orrginal_wo.item.id})",
				label: "Assembly Internalid"
			}),
			search.createColumn({
				name: "formulatext",
				summary: "GROUP",
				formula: "nvl({createdfrom.item}, {custbody_scv_orrginal_wo.item})",
				label: "Assembly"
			}),
			search.createColumn({
				name: "formulatext",
				summary: "GROUP",
				formula: "nvl({createdfrom.unit}, {custbody_scv_orrginal_wo.unit})",
				label: "Assembly Unit"
			}),
			search.createColumn({
				name: "item",
				summary: "GROUP",
				label: "Item"
			}),
			search.createColumn({
				name: "unit",
				summary: "GROUP",
				label: "Unit"
			}),
			search.createColumn({
				name: "formulanumeric",
				summary: "SUM",
				formula: "abs({quantity})",
				label: "Total Quantity"
			}),
			search.createColumn({
				name: "formulanumeric",
				summary: "SUM",
				formula: "abs({amount})",
				label: "Total Amount"
			}),
			search.createColumn({
				name: "custitem_scv_group_lv1",
				join: "item",
				summary: "GROUP",
				label: "Nhom cap 1"
			}),
			search.createColumn({
				name: "custitem_scv_group_lv2",
				join: "item",
				summary: "GROUP",
				label: "Nhom cap 2"
			}),
			search.createColumn({
				name: "formulatext",
				summary: "GROUP",
				formula: "case when {item.type} in ('Assembly', 'Inventory Item') then 'Nguyên vật liệu' else 'Chi phí sản xuất' end",
				label: "Item Type"
			}),
			search.createColumn({
				name: "formulatext",
				summary: "GROUP",
				formula: "nvl({createdfrom.item.id}, {custbody_scv_orrginal_wo.item.id}) || {item.internalid}",
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
			"assembly_id",
			"assembly",
			"assembly_unit",
			"item",
			"unit",
			"ttl_qty",
			"ttl_amt",
			"nhom_cap_1",
			"nhom_cap_2",
			"item_type",
			"key_mapping",
			"item_code",
			"item_name",
			"item_old_code",
			"unit_cost",
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
