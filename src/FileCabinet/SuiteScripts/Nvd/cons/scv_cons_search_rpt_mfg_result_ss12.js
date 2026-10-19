/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  06 Aug 2025         Huy Pham			    Init, create file, Phát triển báo cáo tổng hợp và chi tiết kết quả sản xuất,from mr.Trương Minh Phúc(https://app.clickup.com/t/86czjzct2)
 */
define([
	'../cons/scv_cons_search.js'
],
function(
	constSearch
) {
	const ID = "customsearch_scv_mfg_qc_result_ac_sum";
	const TYPE = "inventorystatuschange";

	const RECORDS = {
		"type": "inventorystatuschange",
		"title": "SCV MFG Inspection Result - AC Summary Rpt (Don't Update)",
		"id": "customsearch_scv_mfg_qc_result_ac_sum",
		"isPublic": true,
		"filters": [
			{
				"name": "type",
				"operator": "anyof",
				"values": [
					"StatChng"
				],
				"isor": false,
				"isnot": false,
				"leftparens": 0,
				"rightparens": 0
			},
			{
				"name": "type",
				"join": "custbody_scv_created_transaction",
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
				"join": "custbody_scv_created_transaction",
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
				"formula": "case when {quantity} > 0 then 1 end",
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
				"name": "custbody_scv_work_order_type",
				"join": "custbody_scv_created_transaction",
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
				"name": "formulatext",
				"summary": "GROUP",
				"formula": "TO_CHAR({custbody_scv_created_transaction.custbody_scv_mfg_date},'yyyy')",
				"type": "text",
				"label": "Year"
			},
			{
				"name": "formulatext",
				"summary": "GROUP",
				"formula": "TO_CHAR({custbody_scv_created_transaction.custbody_scv_mfg_date},'MM')",
				"type": "text",
				"label": "Month"
			},
			{
				"name": "custbody_scv_mfg_date",
				"join": "CUSTBODY_SCV_CREATED_TRANSACTION",
				"summary": "GROUP",
				"type": "date",
				"label": "MFG Date"
			},
			{
				"name": "custbody_scv_shift",
				"join": "CUSTBODY_SCV_CREATED_TRANSACTION",
				"summary": "GROUP",
				"type": "select",
				"label": "Ca"
			},
			{
				"name": "custbody_scv_wo_center",
				"join": "CUSTBODY_SCV_CREATED_TRANSACTION",
				"summary": "GROUP",
				"type": "select",
				"label": "WO Center"
			},
			{
				"name": "formulanumeric",
				"summary": "SUM",
				"formula": "{inventorydetail.quantity}",
				"type": "float",
				"label": "Thanh pham"
			},
			{
				"name": "formulanumeric",
				"summary": "SUM",
				"formula": "ROUND(case when {item.custitem_scv_planing_category} not in ('Phụ kiện dạng thanh','Phụ kiện móc treo, nối') then {inventorydetail.quantity}*{item.custitem_scv_unit_conversion_rate}*{item.custitem_scv_hsqdm2} when {item.custitem_scv_planing_category} in ('Phụ kiện dạng thanh') then {inventorydetail.quantity}*{item.custitem_scv_length}*{item.custitem_scv_kl_vtc}/NULLIF(nvl({custbody_scv_vat_tu_chuan.custitem_scv_length},{item.custitem_scv_length}),0) when {item.custitem_scv_planing_category} in ('Phụ kiện móc treo, nối') then {inventorydetail.quantity}*{item.custitem_scv_kl_vtc} else 0 end, 2)",
				"type": "float",
				"label": "Thanh pham quy doi"
			},
			{
				"name": "formulatext",
				"summary": "GROUP",
				"formula": "case when {item.custitem_scv_planing_category.id} not in (42,43) then 'm2' else 'Kg' end",
				"type": "text",
				"label": "Units"
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
				"name": "custitem_scv_color_code",
				"join": "item",
				"summary": "GROUP",
				"type": "select",
				"label": "Ma mau chinh"
			},
			{
				"name": "custitem_scv_height",
				"join": "item",
				"summary": "GROUP",
				"type": "float",
				"label": "Chieu cao"
			},
			{
				"name": "formulatext",
				"summary": "GROUP",
				"formula": "case when INSTR({item.custitem_scv_ddn}, 'm') > 0 then SUBSTR({item.custitem_scv_ddn}, INSTR({item.custitem_scv_ddn}, ':') + 1, INSTR({item.custitem_scv_ddn}, 'm') - INSTR({item.custitem_scv_ddn}, ':') - 1) else SUBSTR({item.custitem_scv_ddn}, INSTR({item.custitem_scv_ddn}, ':') + 1) end",
				"type": "text",
				"label": "Do day nhom"
			},
			{
				"name": "custitem_scv_width",
				"join": "item",
				"summary": "GROUP",
				"type": "float",
				"label": "Chieu rong"
			},
			{
				"name": "custitem_scv_htd",
				"join": "item",
				"summary": "GROUP",
				"type": "select",
				"label": "Hoa tiet dot"
			},
			{
				"name": "custitem_scv_kd",
				"join": "item",
				"summary": "GROUP",
				"type": "select",
				"label": "Kieu dang"
			},
			{
				"name": "custitem_scv_step",
				"join": "item",
				"summary": "GROUP",
				"type": "select",
				"label": "Buoc"
			},
			{
				"name": "formulanumeric",
				"summary": "GROUP",
				"formula": "{custbody_scv_created_transaction.custbody_scv_sales_order.id}",
				"type": "float",
				"label": "SO Internalid"
			},
			{
				"name": "formulatext",
				"summary": "GROUP",
				"formula": "TO_CHAR({custbody_scv_created_transaction.custbody_scv_mfg_date},'YYYYMMDD')",
				"type": "text",
				"label": "MFG Date YYYYMMDD"
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
