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
	const ID = "customsearch_scv_mfg_inv_receipt_detail";
	const TYPE = "itemreceipt";

	const RECORDS = {
		"type": "itemreceipt",
		"title": "SCV MFG Inventory Receiving - Detail Rpt (Don't Update)",
		"id": "customsearch_scv_mfg_inv_receipt_detail",
		"isPublic": true,
		"filters": [
			{
				"name": "type",
				"operator": "anyof",
				"values": [
					"ItemRcpt"
				],
				"isor": false,
				"isnot": false,
				"leftparens": 0,
				"rightparens": 0
			},
			{
				"name": "custbody_scv_order_type",
				"operator": "anyof",
				"values": [
					"75",
					"68",
					"73",
					"41"
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
				"formula": "case when {quantity} > 0 then 1 else 0 end",
				"isor": false,
				"isnot": false,
				"leftparens": 0,
				"rightparens": 0
			},
			{
				"name": "mainline",
				"operator": "is",
				"values": [
					"F"
				],
				"isor": false,
				"isnot": false,
				"leftparens": 0,
				"rightparens": 0
			},
			{
				"name": "cogs",
				"operator": "is",
				"values": [
					"F"
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
				"formula": "case when {custbody_scv_related_transaction.internalid} is null then 1 when {custbody_scv_related_transaction.internalid} is not null and {custbody_scv_related_transaction.line} = 0 then 1 else 0 end",
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
				"formula": "case when {custcol_scv_created_from.internalid} is null then 1 when {custcol_scv_created_from.internalid} is not null and {custcol_scv_created_from.line} = 0 then 1 else 0 end",
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
				"name": "formuladate",
				"summary": "GROUP",
				"formula": "nvl({custbody_scv_related_transaction.custbody_scv_mfg_date}, {custcol_scv_created_from.custbody_scv_mfg_date})",
				"type": "date",
				"label": "MFG Date"
			},
			{
				"name": "formulatext",
				"summary": "GROUP",
				"formula": "nvl({custbody_scv_related_transaction.custbody_scv_shift}, {custcol_scv_created_from.custbody_scv_shift})",
				"type": "text",
				"label": "Ca"
			},
			{
				"name": "formulatext",
				"summary": "GROUP",
				"formula": "nvl({custbody_scv_related_transaction.custbody_scv_wo_center}, {custcol_scv_created_from.custbody_scv_wo_center})",
				"type": "text",
				"label": "WO Center"
			},
			{
				"name": "item",
				"summary": "GROUP",
				"type": "select",
				"label": "Item"
			},
			{
				"name": "unit",
				"summary": "GROUP",
				"type": "text",
				"label": "Units"
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
				"name": "formulanumeric",
				"summary": "SUM",
				"formula": "case when {item.custitem_scv_group_lv1.id} = 1 then ROUND({inventorydetail.quantity}*(TO_NUMBER(SUBSTR({item.custitem_scv_ddsp}, 1, INSTR({item.custitem_scv_ddsp}, ':') - 1))/10)*{item.custitem_scv_length}*{item.custitem_scv_width}/(3*1220*2440),2) else 0 end",
				"type": "float",
				"label": "ACP tam 3lyQC"
			},
			{
				"name": "formulanumeric",
				"summary": "SUM",
				"formula": "case when {item.custitem_scv_planing_category.id} not in (42,43) then {inventorydetail.quantity}*{item.custitem_scv_unit_conversion_rate}*{item.custitem_scv_hsqdm2} else 0 end",
				"type": "float",
				"label": "AC m2"
			},
			{
				"name": "formulanumeric",
				"summary": "SUM",
				"formula": "case when {item.custitem_scv_planing_category.id} in (42) then {inventorydetail.quantity}*{item.custitem_scv_length}*{item.custitem_scv_kl_vtc}/{custbody_scv_vat_tu_chuan.custitem_scv_length} when {item.custitem_scv_planing_category.id} in (43) then {inventorydetail.quantity}*{item.custitem_scv_kl_vtc} else 0 end",
				"type": "float",
				"label": "Phu kien AC kg"
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
				"formula": "case when {custbody_scv_related_transaction.internalid} is not null and {custcol_scv_created_from.internalid} is null then {custbody_scv_related_transaction.internalid} || {item.internalid} || {inventorydetail.inventorynumber.id} || {inventorydetail.status.id} when {custbody_scv_related_transaction.internalid} is null and {custcol_scv_created_from.internalid} is not null then {custcol_scv_created_from.internalid} || {item.internalid} || {inventorydetail.inventorynumber.id} || {inventorydetail.status.id} end",
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
