/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  03 Nov 2025         Huy Pham			    Init, create file, Phát triển báo cáo phân tích giá thành, from mr.Trương Minh phúc(https://app.clickup.com/t/86d0tym86)
 */
define(['N/search',
	'../cons/scv_cons_search.js',
],
function(search,
	constSearch
) {
	const ID = "customsearch_scv_cst_anlyt_summary_rpt";

	const RECORDS = {
		"type": "transaction",
		"title": "SCV Production Summary Cost - BC phân tích giá thành (Don't Update)",
		"id": "customsearch_scv_cst_anlyt_summary_rpt",
		"isPublic": true,
		"settings": [
			{
				"name": "consolidationtype",
				"value": "ACCTTYPE"
			}
		],
		"filters": [
			{
				"name": "type",
				"operator": "anyof",
				"values": [
					"Build",
					"Unbuild"
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
					"1",
					"5"
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
			}
		],
		"columns": [
			{
				"name": "formulatext",
				"summary": "GROUP",
				"label": "Period",
				"type": "text",
				"formula": "TO_CHAR({custbody_scv_mfg_date}, 'MM/yyyy')",
				"sortdir": "NONE"
			},
			{
				"name": "item",
				"summary": "GROUP",
				"label": "Assembly",
				"type": "select",
				"sortdir": "ASC"
			},
			{
				"name": "unit",
				"summary": "GROUP",
				"label": "Unit",
				"type": "text",
				"sortdir": "NONE"
			},
			{
				"name": "quantity",
				"summary": "SUM",
				"label": "Total Quantity",
				"type": "float",
				"sortdir": "NONE"
			},
			{
				"name": "formulatext",
				"summary": "GROUP",
				"label": "Key Mapping",
				"type": "text",
				"formula": "{item.internalid} || TO_CHAR({custbody_scv_mfg_date}, 'yyyyMM')",
				"sortdir": "NONE"
			}
		]
	}

	const getDataSource = (_params) =>{
		let filters = addFilter(_params);
		return constSearch.getDataSource(ID, filters, [], RECORDS);
	}

	const getDataSourceFetchPage = (_params) =>{
		let filters = addFilter(_params);
		return constSearch.getDataSourceFetchPage(ID, filters, _params, [], RECORDS);
	}

	const addFilter = (_params) =>{
		let filters = [];

		if(!!_params.custpage_subsidiary){
			filters.push(search.createFilter({
                name: 'subsidiary',
                operator: "anyof",
                values: _params.custpage_subsidiary.toString().split(","),
            }));
		}

		if (!!_params.custpage_fromdt){
			filters.push(search.createFilter({
                name: 'custbody_scv_mfg_date',
                operator: "onorafter",
                values: _params.custpage_fromdt
            }));
		}
            
        if (!!_params.custpage_todt){
			filters.push(search.createFilter({
                name: 'custbody_scv_mfg_date',
                operator: "onorbefore",
                values: _params.custpage_todt
            }));
		}

		if(!!_params.custpage_location){
			filters.push(search.createFilter({
                name: 'location',
                operator: "anyof",
                values: _params.custpage_location.toString().split(","),
            }));
		}

		return filters;
	}

    return {
		ID,
		TYPE: "transaction",
		RECORDS,
		getDataSource,
		getDataSourceFetchPage
    };
    
});
