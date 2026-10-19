/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  11 Jul 2025         Huy Pham			    Init, create file, Phát triển báo cáo tổng hợp và chi tiết kết quả sản xuất,from mr.Trương Minh Phúc(https://app.clickup.com/t/86czjzct2)
 */
define([
	'../cons/scv_cons_search.js'
],
function(
	constSearch
) {
	const ID = "customsearch_scv_mfg_scrap_ac_sum";
	const TYPE = "assemblycustomrecord_scv_by_productbuild";

	const RECORDS = {
		"type": "customrecord_scv_by_product",
		"title": "SCV MFG Phế/Phụ phẩm - AC Summary Rpt (Don't Update)",
		"id": "customsearch_scv_mfg_scrap_ac_sum",
		"isPublic": true,
		"filters": [
			{
				"name": "mainline",
				"join": "custrecord_scv_by_product_wo_completion",
				"operator": "is",
				"values": [
					"T"
				],
				"isor": false,
				"isnot": false,
				"leftparens": 0,
				"rightparens": 0
			},
			{
				"name": "custbody_scv_work_order_type",
				"join": "custrecord_scv_by_product_wo_completion",
				"operator": "anyof",
				"values": [
					"3",
					"4",
					"1"
				],
				"isor": false,
				"isnot": false,
				"leftparens": 0,
				"rightparens": 0
			},
			{
				"name": "custrecord_scv_by_product_4m_reason",
				"operator": "anyof",
				"values": [
					"5",
					"6",
					"7",
					"8"
				],
				"isor": false,
				"isnot": false,
				"leftparens": 0,
				"rightparens": 0
			}
		],
		"columns": [
			{
				"name": "custrecord_scv_by_product_sub",
				"summary": "GROUP",
				"type": "select",
				"label": "Subsidiary"
			},
			{
				"name": "custrecord_scv_by_product_location",
				"summary": "GROUP",
				"type": "select",
				"label": "Location"
			},
			{
				"name": "formulatext",
				"summary": "GROUP",
				"formula": "TO_CHAR({custrecord_scv_by_product_date},'yyyy')",
				"type": "text",
				"label": "Year"
			},
			{
				"name": "formulatext",
				"summary": "GROUP",
				"formula": "TO_CHAR({custrecord_scv_by_product_date},'MM')",
				"type": "text",
				"label": "Month"
			},
			{
				"name": "custrecord_scv_by_product_date",
				"summary": "GROUP",
				"type": "date",
				"label": "MFG Date"
			},
			{
				"name": "custrecord_scv_by_product_shift",
				"summary": "GROUP",
				"type": "select",
				"label": "Ca"
			},
			{
				"name": "custrecord_scv_by_product_work_center",
				"summary": "GROUP",
				"type": "select",
				"label": "WO Center"
			},
			{
				"name": "custrecord_scv_by_product_qty",
				"summary": "SUM",
				"type": "float",
				"label": "Phe pham"
			},
			{
				"name": "formulanumeric",
				"summary": "SUM",
				"formula": "case when {custrecord_scv_by_product_assembly_item.custitem_scv_planing_category.id} not in (42,43) then ROUND({custrecord_scv_by_product_qty}*{custrecord_scv_by_product_assembly_item.custitem_scv_hsqdm2}/{custrecord_scv_by_product_assembly_item.custitem_scv_kl_vtc},2) else {custrecord_scv_by_product_qty} end",
				"type": "float",
				"label": "Phe pham quy doi"
			},
			{
				"name": "formulatext",
				"summary": "GROUP",
				"formula": "case when {custrecord_scv_by_product_assembly_item.custitem_scv_planing_category.id} not in (42,43) then 'm2' else 'Kg' end",
				"type": "text",
				"label": "Units"
			},
			{
				"name": "custrecord_scv_by_product_4m_reason",
				"summary": "GROUP",
				"type": "select",
				"label": "Ma loi"
			},
			{
				"name": "custitem_scv_planing_category",
				"join": "CUSTRECORD_SCV_BY_PRODUCT_ASSEMBLY_ITEM",
				"summary": "GROUP",
				"type": "select",
				"label": "Nhom ke hoach"
			},
			{
				"name": "custitem_scv_group_lv1",
				"join": "CUSTRECORD_SCV_BY_PRODUCT_ASSEMBLY_ITEM",
				"summary": "GROUP",
				"type": "select",
				"label": "Nhom cap 1"
			},
			{
				"name": "custitem_scv_group_lv2",
				"join": "CUSTRECORD_SCV_BY_PRODUCT_ASSEMBLY_ITEM",
				"summary": "GROUP",
				"type": "select",
				"label": "Nhom cap 2"
			},
			{
				"name": "custitem_scv_color_code",
				"join": "CUSTRECORD_SCV_BY_PRODUCT_ASSEMBLY_ITEM",
				"summary": "GROUP",
				"type": "select",
				"label": "Ma mau chinh"
			},
			{
				"name": "custitem_scv_height",
				"join": "CUSTRECORD_SCV_BY_PRODUCT_ASSEMBLY_ITEM",
				"summary": "GROUP",
				"type": "float",
				"label": "Chieu cao"
			},
			{
				"name": "formulatext",
				"summary": "GROUP",
				"formula": "case when INSTR({custrecord_scv_by_product_assembly_item.custitem_scv_ddn}, 'm') > 0 then SUBSTR({custrecord_scv_by_product_assembly_item.custitem_scv_ddn}, INSTR({custrecord_scv_by_product_assembly_item.custitem_scv_ddn}, ':') + 1, INSTR({custrecord_scv_by_product_assembly_item.custitem_scv_ddn}, 'm') - INSTR({custrecord_scv_by_product_assembly_item.custitem_scv_ddn}, ':') - 1) else SUBSTR({custrecord_scv_by_product_assembly_item.custitem_scv_ddn}, INSTR({custrecord_scv_by_product_assembly_item.custitem_scv_ddn}, ':') + 1) end",
				"type": "text",
				"label": "Do day nhom"
			},
			{
				"name": "custitem_scv_width",
				"join": "CUSTRECORD_SCV_BY_PRODUCT_ASSEMBLY_ITEM",
				"summary": "GROUP",
				"type": "float",
				"label": "Chieu rong"
			},
			{
				"name": "custitem_scv_htd",
				"join": "CUSTRECORD_SCV_BY_PRODUCT_ASSEMBLY_ITEM",
				"summary": "GROUP",
				"type": "select",
				"label": "Hoa tiet dot"
			},
			{
				"name": "custitem_scv_kd",
				"join": "CUSTRECORD_SCV_BY_PRODUCT_ASSEMBLY_ITEM",
				"summary": "GROUP",
				"type": "select",
				"label": "Kieu dang"
			},
			{
				"name": "custitem_scv_step",
				"join": "CUSTRECORD_SCV_BY_PRODUCT_ASSEMBLY_ITEM",
				"summary": "GROUP",
				"type": "select",
				"label": "Buoc"
			}
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
