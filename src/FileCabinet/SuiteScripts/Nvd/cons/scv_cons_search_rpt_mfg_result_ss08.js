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
	const ID = "customsearch_scv_mfg_qc_result_detail";
	const TYPE = "customrecord_scv_insp_lot";

	const RECORDS = {
		"type": "customrecord_scv_insp_lot",
		"title": "SCV MFG Inspection Result - Detail Rpt (Don't Update)",
		"id": "customsearch_scv_mfg_qc_result_detail",
		"isPublic": true,
		"filters": [
			{
				"name": "type",
				"join": "custrecord_scv_inspl_createdfrom",
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
				"join": "custrecord_scv_inspl_createdfrom",
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
				"name": "custrecord_scv_inspl_total_status",
				"operator": "anyof",
				"values": [
					"3"
				],
				"isor": false,
				"isnot": false,
				"leftparens": 0,
				"rightparens": 0
			},
			{
				"name": "custbody_scv_work_order_type",
				"join": "custrecord_scv_inspl_createdfrom",
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
			}
		],
		"columns": [
			{
				"name": "custrecord_scv_inspl_sub",
				"summary": "GROUP",
				"type": "select",
				"label": "Subsidiary"
			},
			{
				"name": "custrecord_scv_inspl_loc",
				"summary": "GROUP",
				"type": "select",
				"label": "Location"
			},
			{
				"name": "custrecord_scv_inspl_manu_date",
				"summary": "GROUP",
				"type": "date",
				"label": "MFG Date"
			},
			{
				"name": "custrecord_scv_inspl_shift",
				"summary": "GROUP",
				"type": "select",
				"label": "Ca"
			},
			{
				"name": "custrecord_scv_inspl_may",
				"summary": "GROUP",
				"type": "select",
				"label": "WO Center"
			},
			{
				"name": "custrecord_scv_inspl_item",
				"summary": "GROUP",
				"type": "select",
				"label": "Item"
			},
			{
				"name": "custrecord_scv_inbound_qty_status_cur",
				"join": "CUSTRECORD_SCV_INSPQ_INSP_LOT",
				"summary": "GROUP",
				"type": "select",
				"label": "Previous Status"
			},
			{
				"name": "custrecord_scv_inbound_qty_status_new",
				"join": "CUSTRECORD_SCV_INSPQ_INSP_LOT",
				"summary": "GROUP",
				"type": "select",
				"label": "Revised Status"
			},
			{
				"name": "custrecord_scv_inbound_qty",
				"join": "CUSTRECORD_SCV_INSPQ_INSP_LOT",
				"summary": "SUM",
				"type": "float",
				"label": "Quantity"
			},
			{
				"name": "custrecord_scv_inbound_qty_error",
				"join": "CUSTRECORD_SCV_INSPQ_INSP_LOT",
				"summary": "GROUP",
				"type": "select",
				"label": "Ma loi"
			},
			{
				"name": "custitem_scv_planing_category",
				"join": "CUSTRECORD_SCV_INSPL_ITEM",
				"summary": "GROUP",
				"type": "select",
				"label": "Nhom ke hoach"
			},
			{
				"name": "custitem_scv_group_lv1",
				"join": "CUSTRECORD_SCV_INSPL_ITEM",
				"summary": "GROUP",
				"type": "select",
				"label": "Nhom cap 1"
			},
			{
				"name": "custitem_scv_group_lv2",
				"join": "CUSTRECORD_SCV_INSPL_ITEM",
				"summary": "GROUP",
				"type": "select",
				"label": "Nhom cap 2"
			},
			{
				"name": "formulatext",
				"summary": "GROUP",
				"formula": "{custrecord_scv_inspl_createdfrom.internalid} || {custrecord_scv_inspl_item.internalid} || {custrecord_scv_inspl_invno.internalid} || {custrecord_scv_inspl_invstatus.internalid}",
				"type": "text",
				"label": "Key Mapping (AB)"
			},
			{
				"name": "formulatext",
				"summary": "GROUP",
				"formula": "{custrecord_scv_inspl_createdfrom.internalid} || {custrecord_scv_inspl_item.internalid} || {custrecord_scv_inspl_invno.internalid} || {custrecord_scv_inspq_insp_lot.custrecord_scv_inbound_qty_status_new.id}",
				"type": "text",
				"label": "Key Mapping (INV)"
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
