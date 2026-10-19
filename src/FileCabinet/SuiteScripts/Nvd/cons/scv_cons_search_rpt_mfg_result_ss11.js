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
	const ID = "customsearch_scv_mfg_prod_labor_acp_sum";
	const TYPE = "customrecord_scv_prd_labor";

	const RECORDS = {
		"type": "customrecord_scv_prd_labor",
		"title": "SCV MFG Nhân công - ACP Summary Rpt (Don't Update)",
		"id": "customsearch_scv_mfg_prod_labor_acp_sum",
		"isPublic": true,
		"filters": [
			{
				"name": "custrecord_scv_prd_labor_location",
				"operator": "anyof",
				"values": [
					"249",
					"247",
					"233"
				],
				"isor": false,
				"isnot": false,
				"leftparens": 0,
				"rightparens": 0
			}
		],
		"columns": [
			{
				"name": "custrecord_scv_prd_labor_sub",
				"summary": "GROUP",
				"type": "select",
				"label": "Subsidiary"
			},
			{
				"name": "custrecord_scv_prd_labor_location",
				"summary": "GROUP",
				"type": "select",
				"label": "Location"
			},
			{
				"name": "formulatext",
				"summary": "GROUP",
				"formula": "TO_CHAR({custrecord_scv_prd_labor_date},'yyyy')",
				"type": "text",
				"label": "Year"
			},
			{
				"name": "formulatext",
				"summary": "GROUP",
				"formula": "TO_CHAR({custrecord_scv_prd_labor_date},'MM')",
				"type": "text",
				"label": "Month"
			},
			{
				"name": "custrecord_scv_prd_labor_date",
				"summary": "GROUP",
				"type": "date",
				"label": "MFG Date"
			},
			{
				"name": "custrecord_scv_prd_labor_shift",
				"summary": "GROUP",
				"type": "select",
				"label": "Ca"
			},
			{
				"name": "custrecord_scv_prd_labor_wo_center",
				"summary": "GROUP",
				"type": "select",
				"label": "WO Center"
			},
			{
				"name": "custrecord_scv_prd_labor_emp",
				"summary": "GROUP",
				"type": "select",
				"label": "Employee"
			},
			{
				"name": "custrecord_scv_prd_labor_title",
				"summary": "GROUP",
				"type": "select",
				"label": "Position"
			},
			{
				"name": "custrecord_scv_prd_labor_minutes",
				"summary": "SUM",
				"type": "float",
				"label": "Thoi gian san xuat"
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
