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
	const ID = "customsearch_scv_mfg_prod_result_acp_sum";
	const TYPE = "assemblybuild";

	const RECORDS = {
		"type": "assemblybuild",
		"title": "SCV MFG Production Result - ACP Summary Rpt (Don't Update)",
		"id": "customsearch_scv_mfg_prod_result_acp_sum",
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
					"2",
					"5"
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
				"name": "formulatext",
				"summary": "GROUP",
				"formula": "TO_CHAR({custbody_scv_mfg_date},'yyyy')",
				"type": "text",
				"label": "Year"
			},
			{
				"name": "formulatext",
				"summary": "GROUP",
				"formula": "TO_CHAR({custbody_scv_mfg_date},'MM')",
				"type": "text",
				"label": "Month"
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
				"name": "formulanumeric",
				"summary": "SUM",
				"formula": "case when {inventorydetail.status} in ('Đạt chất lượng') then {inventorydetail.quantity} else 0 end",
				"type": "float",
				"label": "Thanh pham"
			},
			{
				"name": "formulanumeric",
				"summary": "SUM",
				"formula": "case when {inventorydetail.status} in ('Đạt chất lượng') then ROUND({inventorydetail.quantity}*(TO_NUMBER(SUBSTR({item.custitem_scv_ddsp}, 1, INSTR({item.custitem_scv_ddsp}, ':') - 1))/10)*{item.custitem_scv_length}*{item.custitem_scv_width}/(3*1220*2440),2) else 0 end",
				"type": "float",
				"label": "Thanh pham 3lyQC"
			},
			{
				"name": "formulanumeric",
				"summary": "SUM",
				"formula": "case when {inventorydetail.status} in ('Hàng B') then ROUND({inventorydetail.quantity}*(TO_NUMBER(SUBSTR({item.custitem_scv_ddsp}, 1, INSTR({item.custitem_scv_ddsp}, ':') - 1))/10)*{item.custitem_scv_length}*{item.custitem_scv_width}/(3*1220*2440),2) else 0 end",
				"type": "float",
				"label": "Loai B 3lyQC"
			},
			{
				"name": "formulanumeric",
				"summary": "SUM",
				"formula": "ROUND(case when {custbody_scv_actual_prod_time} is not null then {custbody_scv_actual_prod_time}/60/8 else 0 end,2)",
				"type": "float",
				"label": "So ca"
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
				"name": "custitem_scv_trademark",
				"join": "item",
				"summary": "GROUP",
				"type": "select",
				"label": "Thuong hieu"
			},
			{
				"name": "custitem_scv_color_code",
				"join": "item",
				"summary": "GROUP",
				"type": "select",
				"label": "Ma mau chinh"
			},
			{
				"name": "formulatext",
				"summary": "GROUP",
				"formula": "case when INSTR({item.custitem_scv_ddsp}, 'm') > 0 then SUBSTR({item.custitem_scv_ddsp}, INSTR({item.custitem_scv_ddsp}, ':') + 1, INSTR({item.custitem_scv_ddsp}, 'm') - INSTR({item.custitem_scv_ddsp}, ':') - 1) else SUBSTR({item.custitem_scv_ddsp}, INSTR({item.custitem_scv_ddsp}, ':') + 1) end",
				"type": "text",
				"label": "Do day tam"
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
				"name": "custitem_scv_ls",
				"join": "item",
				"summary": "GROUP",
				"type": "select",
				"label": "Lop son"
			},
			{
				"name": "tranid",
				"join": "CUSTBODY_SCV_SALES_ORDER",
				"summary": "GROUP",
				"type": "text",
				"label": "SO Number"
			},
			{
				"name": "internalid",
				"join": "CUSTBODY_SCV_SALES_ORDER",
				"summary": "GROUP",
				"type": "select",
				"label": "SO Internalid"
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
