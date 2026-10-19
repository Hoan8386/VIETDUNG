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
	const ID = "customsearch_scv_mfg_prod_result_detail";
	const TYPE = "assemblybuild";

	const RECORDS = {
		"type": "assemblybuild",
		"title": "SCV MFG Production Result - Detail Rpt (Don't Update)",
		"id": "customsearch_scv_mfg_prod_result_detail",
		"isPublic": true,
		"filters": [
			{
				"name": "type",
				"operator": "anyof",
				"values": [
					"Build"
				],
				"isor": false,
				"isnot": false,
				"leftparens": 0,
				"rightparens": 0
			},
			{
				"name": "mainline",
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
				"operator": "anyof",
				"values": [
					"3",
					"2",
					"4",
					"5",
					"1"
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
				"formula": "case when {custbody_scv_sales_order.internalid} is null then 1 when {custbody_scv_sales_order.internalid} is not null and {custbody_scv_sales_order.line} = 0 then 1 else 0 end",
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
				"formula": "case when {custbody_scv_work_order_no.internalid} is null then 1 when {custbody_scv_work_order_no.internalid} is not null and {custbody_scv_work_order_no.line} = 0 then 1 else 0 end",
				"isor": false,
				"isnot": false,
				"leftparens": 0,
				"rightparens": 0
			}
		],
		"columns": [
			{
				"name": "subsidiary",
				"summary": "GROUP",
				"type": "select",
				"label": "Subsidiary"
			},
			{
				"name": "location",
				"summary": "GROUP",
				"type": "select",
				"label": "Location"
			},
			{
				"name": "custbody_scv_mfg_date",
				"summary": "GROUP",
				"type": "date",
				"label": "MFG Date"
			},
			{
				"name": "custbody_scv_shift",
				"summary": "GROUP",
				"type": "select",
				"label": "Ca"
			},
			{
				"name": "custbody_scv_wo_center",
				"summary": "GROUP",
				"type": "select",
				"label": "WO Center"
			},
			{
				"name": "custbody_scv_so_thong_ke_sx",
				"summary": "GROUP",
				"type": "text",
				"label": "So thong ke"
			},
			{
				"name": "trandate",
				"summary": "GROUP",
				"type": "date",
				"label": "AB Date"
			},
			{
				"name": "tranid",
				"summary": "GROUP",
				"type": "text",
				"label": "AB Number"
			},
			{
				"name": "formulatext",
				"summary": "GROUP",
				"formula": "regexp_substr({item},'[^:]*$')",
				"type": "text",
				"label": "Item"
			},
			{
				"name": "unitabbreviation",
				"summary": "GROUP",
				"type": "text",
				"label": "Units"
			},
			{
				"name": "formulatext",
				"summary": "GROUP",
				"formula": "TO_CHAR({inventorydetail.inventorynumber.id})",
				"type": "text",
				"label": "Lot Number ID"
			},
			{
				"name": "inventorynumber",
				"join": "inventoryDetail",
				"summary": "GROUP",
				"type": "select",
				"label": "Lot Number"
			},
			{
				"name": "status",
				"join": "inventoryDetail",
				"summary": "GROUP",
				"type": "select",
				"label": "Status"
			},
			{
				"name": "quantity",
				"join": "inventoryDetail",
				"summary": "SUM",
				"type": "float",
				"label": "Quantity"
			},
			{
				"name": "custbody_scv_actual_prod_time",
				"summary": "GROUP",
				"type": "integer",
				"label": "Thoi gian san xuat"
			},
			{
				"name": "tranid",
				"join": "CUSTBODY_SCV_WORK_ORDER_NO",
				"summary": "GROUP",
				"type": "text",
				"label": "WO Number"
			},
			{
				"name": "tranid",
				"join": "CUSTBODY_SCV_SALES_ORDER",
				"summary": "GROUP",
				"type": "text",
				"label": "SO Number"
			},
			{
				"name": "custitem_scv_planing_category",
				"join": "item",
				"summary": "GROUP",
				"type": "select",
				"label": "Nhom ke hoach"
			},
			{
				"name": "custitem_scv_group_lv1",
				"join": "item",
				"summary": "GROUP",
				"type": "select",
				"label": "Nhom cap 1"
			},
			{
				"name": "custitem_scv_group_lv2",
				"join": "item",
				"summary": "GROUP",
				"type": "select",
				"label": "Nhom cap 2"
			},
			{
				"name": "formulatext",
				"summary": "GROUP",
				"formula": "case when {inventorydetail.status} in ('Chờ kiểm tra') and {custbody_scv_insp_sheet.internalid} is not null then 'yes' else 'no' end",
				"type": "text",
				"label": "QC Required"
			},
			{
				"name": "formulatext",
				"summary": "GROUP",
				"formula": "{internalid} || {item.internalid} || {inventorydetail.inventorynumber.id} || {inventorydetail.status.id}",
				"type": "text",
				"label": "Key Mapping"
			}
		],
		"settings": [
			{
				"name": "consolidationtype",
				"value": "ACCTTYPE"
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
