/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  14 Jul 2025         Huy Pham			    Init, create file, Phát triển báo cáo tổng hợp và chi tiết kết quả sản xuất,from mr.Trương Minh Phúc(https://app.clickup.com/t/86czjzct2)
 */
define([
	'../cons/scv_cons_search.js'
],
function(
	constSearch
) {
	const ID = "customsearch_scv_mfg_scrap_detail";
	const TYPE = "customrecord_scv_by_product";

	const RECORDS = {
		"type": "customrecord_scv_by_product",
		"title": "SCV MFG Phế/Phụ phẩm - Detail Rpt (Don't Update)",
		"id": "customsearch_scv_mfg_scrap_detail",
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
				"name": "mainline",
				"join": "custrecord_scv_by_product_wo",
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
				"name": "formulanumeric",
				"operator": "equalto",
				"values": [
					"1"
				],
				"formula": "case when {custrecord_scv_by_product_related_trans.internalid} is null then 1 when {custrecord_scv_by_product_related_trans.internalid} is not null and {custrecord_scv_by_product_related_trans.line} = 0 then 1 else 0 end",
				"isor": false,
				"isnot": false,
				"leftparens": 0,
				"rightparens": 0
			}
		],
		"columns": [
			{
				"name": "custrecord_scv_by_product_sub",
				"type": "select",
				"label": "Subsidiary"
			},
			{
				"name": "custrecord_scv_by_product_location",
				"type": "select",
				"label": "Location"
			},
			{
				"name": "custrecord_scv_by_product_date",
				"type": "date",
				"label": "MFG Date"
			},
			{
				"name": "custrecord_scv_by_product_shift",
				"type": "select",
				"label": "Ca"
			},
			{
				"name": "custrecord_scv_by_product_work_center",
				"type": "select",
				"label": "WO Center"
			},
			{
				"name": "custrecord_scv_by_prod_item",
				"type": "select",
				"label": "Item"
			},
			{
				"name": "custrecord_scv_uom",
				"type": "select",
				"label": "Units"
			},
			{
				"name": "custrecord_scv_by_product_qty",
				"type": "float",
				"label": "Quantity"
			},
			{
				"name": "custrecord_scv_by_product_4m_reason",
				"type": "select",
				"label": "Ma loi"
			},
			{
				"name": "custbody_scv_so_thong_ke_sx",
				"join": "CUSTRECORD_SCV_BY_PRODUCT_WO_COMPLETION",
				"type": "text",
				"label": "So thong ke"
			},
			{
				"name": "trandate",
				"join": "CUSTRECORD_SCV_BY_PRODUCT_WO_COMPLETION",
				"type": "date",
				"label": "AB Date"
			},
			{
				"name": "tranid",
				"join": "CUSTRECORD_SCV_BY_PRODUCT_WO_COMPLETION",
				"type": "text",
				"label": "AB Number"
			},
			{
				"name": "tranid",
				"join": "CUSTRECORD_SCV_BY_PRODUCT_WO",
				"type": "text",
				"label": "WO Number"
			},
			{
				"name": "formulatext",
				"formula": "SUBSTR({custrecord_scv_by_product_wo.custbody_scv_sales_order}, INSTR({custrecord_scv_by_product_wo.custbody_scv_sales_order}, '#') + 1)",
				"type": "text",
				"label": "SO Number"
			},
			{
				"name": "tranid",
				"join": "CUSTRECORD_SCV_BY_PRODUCT_RELATED_TRANS",
				"type": "text",
				"label": "Yeu cau nhap xuat"
			},
			{
				"name": "custitem_scv_planing_category",
				"join": "CUSTRECORD_SCV_BY_PRODUCT_ASSEMBLY_ITEM",
				"type": "select",
				"label": "Nhom ke hoach"
			},
			{
				"name": "custitem_scv_group_lv1",
				"join": "CUSTRECORD_SCV_BY_PRODUCT_ASSEMBLY_ITEM",
				"type": "select",
				"label": "Nhom cap 1"
			},
			{
				"name": "custitem_scv_group_lv2",
				"join": "CUSTRECORD_SCV_BY_PRODUCT_ASSEMBLY_ITEM",
				"type": "select",
				"label": "Nhom cap 2"
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
