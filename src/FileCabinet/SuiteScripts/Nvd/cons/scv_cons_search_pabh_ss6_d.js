/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  19 Aug 2025         Huy Pham                Init & create file
 */
define([
	'../cons/scv_cons_search.js'
],
function(
	constSearch
) {
	const ID = "customsearch_scv_pabh_ss6_d";
	const TYPE = "customrecord_scv_st_d";

	const RECORDS = {
		"type": "customrecord_scv_st_d",
		"title": "SCV PABH SS6 Sales term detail (do not edit, for code)",
		"id": "customsearch_scv_pabh_ss6_d",
		"isPublic": true,
		"filters": [
			{
				"name": "isinactive",
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
				"name": "custrecord_scv_st_status",
				"join": "custrecord_scv_st_d_parent",
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
				"name": "isinactive",
				"join": "custrecord_scv_st_d_parent",
				"operator": "is",
				"values": [
					"F"
				],
				"isor": false,
				"isnot": false,
				"leftparens": 0,
				"rightparens": 0
			}
		],
		"columns": [
			{
				"name": "custrecord_scv_st_subsidiary",
				"join": "CUSTRECORD_SCV_ST_D_PARENT",
				"type": "select",
				"label": "1-Subsidiary"
			},
			{
				"name": "custrecord_scv_st_cus_category",
				"join": "CUSTRECORD_SCV_ST_D_PARENT",
				"type": "select",
				"label": "2-Customer Group"
			},
			{
				"name": "custrecord_scv_st_customer",
				"join": "CUSTRECORD_SCV_ST_D_PARENT",
				"type": "select",
				"label": "3-Customer",
				"sortdir": "ASC"
			},
			{
				"name": "formulatext",
				"formula": "{custrecord_scv_st_d_parent.custrecord_scv_st_customer.id}",
				"type": "text",
				"label": "4-Customer ID"
			},
			{
				"name": "custrecord_scv_st_start_date",
				"join": "CUSTRECORD_SCV_ST_D_PARENT",
				"type": "date",
				"label": "5-Start date"
			},
			{
				"name": "custrecord_scv_st_end_date",
				"join": "CUSTRECORD_SCV_ST_D_PARENT",
				"type": "date",
				"label": "6-End date"
			},
			{
				"name": "formulatext",
				"formula": "{custrecord_scv_st_d_group.internalid}",
				"type": "text",
				"label": "7-Item Group"
			},
			{
				"name": "custrecord_scv_st_d_ck_vat",
				"type": "percent",
				"label": "8-% Support"
			},
			{
				"name": "custrecord_scv_st_d_ck_no_vat",
				"type": "percent",
				"label": "Chiết khấu bán hàng (Không lấy VAT)"
			},
			{
				"name": "custrecord_scv_st_d_group_parent",
				"type": "select",
				"label": "9-Item Group Parent"
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
