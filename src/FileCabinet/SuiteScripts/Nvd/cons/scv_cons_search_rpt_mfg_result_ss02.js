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
	const ID = "customsearch_scv_mfg_scrap_acp_sum";
	const TYPE = "customrecord_scv_by_product";

	const RECORDS = {
		"type": "customrecord_scv_by_product",
		"title": "SCV MFG Phế/Phụ phẩm - ACP Summary Rpt (Don't Update)",
		"id": "customsearch_scv_mfg_scrap_acp_sum",
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
					"2",
					"5"
				],
				"isor": false,
				"isnot": false,
				"leftparens": 0,
				"rightparens": 0
			},
			{
				"name": "custitem_scv_group_lv1",
				"join": "custrecord_scv_by_prod_item",
				"operator": "anyof",
				"values": [
					"43"
				],
				"isor": false,
				"isnot": false,
				"leftparens": 0,
				"rightparens": 0
			},
			{
				"name": "custitem_scv_group_lv2",
				"join": "custrecord_scv_by_prod_item",
				"operator": "anyof",
				"values": [
					"1285"
				],
				"isor": false,
				"isnot": false,
				"leftparens": 0,
				"rightparens": 0
			},
			{
				"name": "custitem_scv_group_lv3",
				"join": "custrecord_scv_by_prod_item",
				"operator": "anyof",
				"values": [
					"64"
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
				"name": "formulanumeric",
				"summary": "SUM",
				"formula": "ROUND({custrecord_scv_by_product_qty}*(TO_NUMBER(SUBSTR({custrecord_scv_by_product_assembly_item.custitem_scv_ddsp}, 1, INSTR({custrecord_scv_by_product_assembly_item.custitem_scv_ddsp}, ':') - 1))/10)*{custrecord_scv_by_product_assembly_item.custitem_scv_length}*{custrecord_scv_by_product_assembly_item.custitem_scv_width}/(3*1220*2440),2)",
				"type": "float",
				"label": "Phe pham 3lyQC"
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
				"name": "custitem_scv_trademark",
				"join": "CUSTRECORD_SCV_BY_PRODUCT_ASSEMBLY_ITEM",
				"summary": "GROUP",
				"type": "select",
				"label": "Thuong hieu"
			},
			{
				"name": "custitem_scv_color_code",
				"join": "CUSTRECORD_SCV_BY_PRODUCT_ASSEMBLY_ITEM",
				"summary": "GROUP",
				"type": "select",
				"label": "Ma mau chinh"
			},
			{
				"name": "formulatext",
				"summary": "GROUP",
				"formula": "case when INSTR({custrecord_scv_by_product_assembly_item.custitem_scv_ddn}, 'm') > 0 then SUBSTR({custrecord_scv_by_product_assembly_item.custitem_scv_ddn}, INSTR({custrecord_scv_by_product_assembly_item.custitem_scv_ddn}, ':') + 1, INSTR({custrecord_scv_by_product_assembly_item.custitem_scv_ddn}, 'm') - INSTR({custrecord_scv_by_product_assembly_item.custitem_scv_ddn}, ':') - 1) else SUBSTR({custrecord_scv_by_product_assembly_item.custitem_scv_ddn}, INSTR({custrecord_scv_by_product_assembly_item.custitem_scv_ddn}, ':') + 1) end",
				"type": "text",
				"label": "Do day nhom"
			},
			{
				"name": "formulatext",
				"summary": "GROUP",
				"formula": "case when INSTR({custrecord_scv_by_product_assembly_item.custitem_scv_ddsp}, 'm') > 0 then SUBSTR({custrecord_scv_by_product_assembly_item.custitem_scv_ddsp}, INSTR({custrecord_scv_by_product_assembly_item.custitem_scv_ddsp}, ':') + 1, INSTR({custrecord_scv_by_product_assembly_item.custitem_scv_ddsp}, 'm') - INSTR({custrecord_scv_by_product_assembly_item.custitem_scv_ddsp}, ':') - 1) else SUBSTR({custrecord_scv_by_product_assembly_item.custitem_scv_ddsp}, INSTR({custrecord_scv_by_product_assembly_item.custitem_scv_ddsp}, ':') + 1) end",
				"type": "text",
				"label": "Do day tam"
			},
			{
				"name": "custitem_scv_width",
				"join": "CUSTRECORD_SCV_BY_PRODUCT_ASSEMBLY_ITEM",
				"summary": "GROUP",
				"type": "float",
				"label": "Chieu rong"
			},
			{
				"name": "custitem_scv_ls",
				"join": "CUSTRECORD_SCV_BY_PRODUCT_ASSEMBLY_ITEM",
				"summary": "GROUP",
				"type": "select",
				"label": "Lop son"
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
