/**
 * Nội dung:
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  28 Aug 2025         Khanh Tran			    Init, create file. Phát triển báo cáo kết quả mục tiêu sản xuất ACP, form mr.TMPhúc(https://app.clickup.com/t/86d04224z)
 */
define(['N/search',
	'../cons/scv_cons_search.js'
],
function(search,
	constSearch
) {
	const ID = "customsearch_scv_mfg_prod_result_acp_rpt";
	const TYPE = "assemblybuild";

	const RECORDS = {
		"type": ID,
		"title": "SCV MFG Production Result - ACP Performance Rpt (Don't Update)",
		"id": TYPE,
		"isPublic": true,
		"filters": [
			["type","anyof","Build"], 
			"AND", 
			["mainline","is","T"], 
			"AND", 
			[["custbody_scv_work_order_type","anyof","2","5"],"OR",[["custbody_scv_work_order_type","anyof","9"],"AND",["item.custitem_scv_group_lv1","anyof","1","15"],"AND",["location","anyof","249","247","233"]]], 
			"AND", 
			["formulanumeric: case when {custbody_scv_sales_order.internalid} is null then 1 when {custbody_scv_sales_order.internalid} is not null and {custbody_scv_sales_order.line} = 0 then 1 else 0 end","equalto","1"], 
			"AND", 
			["formulanumeric: case when {custbody_scv_work_order_no.internalid} is null then 1 when {custbody_scv_work_order_no.internalid} is not null and {custbody_scv_work_order_no.line} = 0 then 1 else 0 end","equalto","1"]
		],
		"columns": [
			search.createColumn({
				name: "subsidiary",
				summary: "GROUP",
				label: "Subsidiary"
			}),
			search.createColumn({
				name: "custbody_scv_wo_center",
				summary: "GROUP",
				label: "WO Center"
			}),
			search.createColumn({
				name: "custitem_scv_planing_category",
				join: "item",
				summary: "GROUP",
				label: "Nhom ke hoach"
			}),
			search.createColumn({
				name: "formulanumeric",
				summary: "SUM",
				formula: "{inventorydetail.quantity}",
				label: "Thanh pham"
			}),
			search.createColumn({
				name: "formulanumeric",
				summary: "SUM",
				formula: "{inventorydetail.quantity}*(TO_NUMBER(SUBSTR({item.custitem_scv_ddsp}, 1, INSTR({item.custitem_scv_ddsp}, ':') - 1))/10)*{item.custitem_scv_length}*{item.custitem_scv_width}/(3*1220*2440)",
				label: "Thanh pham 3lyQC"
			}),
			search.createColumn({
				name: "formulanumeric",
				summary: "SUM",
				formula: "case when {inventorydetail.status} in ('Đạt chất lượng') then {inventorydetail.quantity} else 0 end",
				label: "Thanh pham (Dat chat luong)"
			}),
			search.createColumn({
				name: "formulanumeric",
				summary: "SUM",
				formula: "case when {inventorydetail.status} in ('Đạt chất lượng') then {inventorydetail.quantity}*(TO_NUMBER(SUBSTR({item.custitem_scv_ddsp}, 1, INSTR({item.custitem_scv_ddsp}, ':') - 1))/10)*{item.custitem_scv_length}*{item.custitem_scv_width}/(3*1220*2440) else 0 end",
				label: "Thanh pham 3lyQC (Dat chat luong)"
			}),
			search.createColumn({
				name: "formulanumeric",
				summary: "SUM",
				formula: "case when {inventorydetail.status} in ('Hàng B') then {inventorydetail.quantity}*(TO_NUMBER(SUBSTR({item.custitem_scv_ddsp}, 1, INSTR({item.custitem_scv_ddsp}, ':') - 1))/10)*{item.custitem_scv_length}*{item.custitem_scv_width}/(3*1220*2440) else 0 end",
				label: "Loai B 3lyQC"
			}),
			search.createColumn({
				name: "formulanumeric",
				summary: "SUM",
				formula: "case when {inventorydetail.status} in ('Chuyển phế phẩm') then {inventorydetail.quantity}*(TO_NUMBER(SUBSTR({item.custitem_scv_ddsp}, 1, INSTR({item.custitem_scv_ddsp}, ':') - 1))/10)*{item.custitem_scv_length}*{item.custitem_scv_width}*{item.custitem_scv_kl_vtc}/(3*1220*2440) else 0 end",
				label: "Phe pham"
			}),
			search.createColumn({
				name: "formulanumeric",
				summary: "SUM",
				formula: "case when {inventorydetail.status} in ('Chuyển phế phẩm') then {inventorydetail.quantity}*(TO_NUMBER(SUBSTR({item.custitem_scv_ddsp}, 1, INSTR({item.custitem_scv_ddsp}, ':') - 1))/10)*{item.custitem_scv_length}*{item.custitem_scv_width}/(3*1220*2440) else 0 end",
				label: "Phe pham 3lyQC"
			}),
			search.createColumn({
				name: "formulanumeric",
				summary: "SUM",
				formula: "ROUND(ROUND(SUM(case when {custbody_scv_actual_prod_time} is not null then ({custbody_scv_actual_prod_time}*{inventorydetail.quantity}/{quantity}) else 0 end))/60, 2)",
				label: "Thoi gian san xuat"
			})
		]
	}

	const getDataSource = (_filters) =>{
		let resultSearch = constSearch.getDataSource(ID, _filters, [], RECORDS);

		return resultSearch;
	}

	const getDataSourceFetchPage = (_filters, _params) =>{
		let resultSearch = constSearch.getDataSourceFetchPage(ID, _filters, _params, [], RECORDS);

		return resultSearch;
	}

    return {
		ID,
		TYPE,
		RECORDS,
		getDataSource,
		getDataSourceFetchPage
    };
    
});
