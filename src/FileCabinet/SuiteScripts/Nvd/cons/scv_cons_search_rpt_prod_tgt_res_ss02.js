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
	const ID = "customsearch_scv_mfg_scrap_acp_rpt";
	const TYPE = "customrecord_scv_by_product";

	const RECORDS = {
		"type": ID,
		"title": "SCV MFG Phế/Phụ phẩm - ACP Performance Rpt (Don't Update)",
		"id": TYPE,
		"isPublic": true,
		"filters": [
			[[["custrecord_scv_by_product_wo.custbody_scv_work_order_type","anyof","2","5"],"AND",["custrecord_scv_by_product_wo_completion","anyof","@NONE@"],"AND",["custrecord_scv_by_prod_loss_category","noneof","303"]],"OR",[["custrecord_scv_by_product_wo_completion.custbody_scv_work_order_type","anyof","2","5"],"OR",[["custrecord_scv_by_product_wo_completion.custbody_scv_work_order_type","anyof","9"],"AND",["custrecord_scv_by_product_assembly_item.custitem_scv_group_lv1","anyof","1","15"],"AND",["custrecord_scv_by_product_wo_completion.location","anyof","249","247","233"]]]], 
			"AND", 
			["custrecord_scv_by_prod_item.custitem_scv_group_lv1","anyof","43"], 
			"AND", 
			["custrecord_scv_by_prod_item.custitem_scv_group_lv2","anyof","1285"], 
			"AND", 
			["custrecord_scv_by_prod_item.custitem_scv_group_lv3","anyof","64"], 
			"AND", 
			["formulanumeric: case when {custrecord_scv_by_product_wo_completion.internalid} is null then 1 when {custrecord_scv_by_product_wo_completion.internalid} is not null and {custrecord_scv_by_product_wo_completion.line} = 0 then 1 else 0 end","equalto","1"], 
			"AND", 
			["formulanumeric: case when {custrecord_scv_by_product_wo.internalid} is null then 1 when {custrecord_scv_by_product_wo.internalid} is not null and {custrecord_scv_by_product_wo.line} = 0 then 1 else 0 end","equalto","1"]
		],
		"columns": [
		search.createColumn({
			name: "custrecord_scv_by_product_sub",
			summary: "GROUP",
			label: "Subsidiary"
		}),
		search.createColumn({
			name: "custrecord_scv_by_product_work_center",
			summary: "GROUP",
			label: "WO Center"
		}),
		search.createColumn({
			name: "custitem_scv_planing_category",
			join: "CUSTRECORD_SCV_BY_PRODUCT_ASSEMBLY_ITEM",
			summary: "GROUP",
			label: "Nhom ke hoach"
		}),
		search.createColumn({
			name: "custrecord_scv_by_product_qty",
			summary: "SUM",
			label: "Phe pham"
		}),
		search.createColumn({
			name: "formulanumeric",
			summary: "SUM",
			formula: "case when {custrecord_scv_by_product_assembly_item.parent} is not null then ROUND(({custrecord_scv_by_product_qty}/NULLIF({custrecord_scv_by_product_assembly_item.custitem_scv_kl_vtc},0))*TO_NUMBER(case when INSTR({custrecord_scv_by_product_assembly_item.custitem_scv_parent_item_ddsp}, 'm') > 0 then SUBSTR({custrecord_scv_by_product_assembly_item.custitem_scv_parent_item_ddsp}, INSTR({custrecord_scv_by_product_assembly_item.custitem_scv_parent_item_ddsp}, ':') + 1, INSTR({custrecord_scv_by_product_assembly_item.custitem_scv_parent_item_ddsp}, 'm') - INSTR({custrecord_scv_by_product_assembly_item.custitem_scv_parent_item_ddsp}, ':') - 1) else SUBSTR({custrecord_scv_by_product_assembly_item.custitem_scv_parent_item_ddsp}, INSTR({custrecord_scv_by_product_assembly_item.custitem_scv_parent_item_ddsp}, ':') + 1) end)*{custrecord_scv_by_product_assembly_item.custitem_scv_parent_item_length}*{custrecord_scv_by_product_assembly_item.custitem_scv_parent_item_width}/(3*1220*2440),2) else ROUND(({custrecord_scv_by_product_qty}/NULLIF({custrecord_scv_by_product_assembly_item.custitem_scv_kl_vtc},0))*TO_NUMBER(case when INSTR({custrecord_scv_by_product_assembly_item.custitem_scv_ddsp}, 'm') > 0 then SUBSTR({custrecord_scv_by_product_assembly_item.custitem_scv_ddsp}, INSTR({custrecord_scv_by_product_assembly_item.custitem_scv_ddsp}, ':') + 1, INSTR({custrecord_scv_by_product_assembly_item.custitem_scv_ddsp}, 'm') - INSTR({custrecord_scv_by_product_assembly_item.custitem_scv_ddsp}, ':') - 1) else SUBSTR({custrecord_scv_by_product_assembly_item.custitem_scv_ddsp}, INSTR({custrecord_scv_by_product_assembly_item.custitem_scv_ddsp}, ':') + 1) end)*{custrecord_scv_by_product_assembly_item.custitem_scv_length}*{custrecord_scv_by_product_assembly_item.custitem_scv_width}/(3*1220*2440),2) end",
			label: "Phe pham 3lyQC"
		}),
		search.createColumn({
			name: "formulanumeric",
			summary: "SUM",
			formula: "decode({custrecord_scv_by_prod_item.custitem_scv_group_lv3}, 'NT:Nhựa tấm thu hồi', {custrecord_scv_by_product_qty})",
			label: "Nhua tam"
		}),
		search.createColumn({
			name: "formulanumeric",
			summary: "SUM",
			formula: "decode({custrecord_scv_by_prod_item.custitem_scv_group_lv3}, 'NO:Nhôm thu hồi', {custrecord_scv_by_product_qty})",
			label: "Nhom vun"
		}),
		search.createColumn({
			name: "custrecord_scv_by_product_stop_time",
			summary: "SUM",
			label: "Thoi gian gian doan"
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
