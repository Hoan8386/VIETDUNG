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
	const ID = "customsearch_scv_cst_anlyt_bomforwo_rpt";

	const RECORDS = {
		"type": "workorder",
		"title": "SCV Bill of Materials by Work Order - BC phân tích giá thành (Don't Update)",
		"id": "customsearch_scv_cst_anlyt_bomforwo_rpt",
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
					"WorkOrd"
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
					"F"
				],
				"isor": false,
				"isnot": false,
				"leftparens": 0,
				"rightparens": 0
			},
			{
				"name": "status",
				"operator": "noneof",
				"values": [
					"WorkOrd:H"
				],
				"isor": true,
				"isnot": false,
				"leftparens": 1,
				"rightparens": 0
			},
			{
				"name": "status",
				"operator": "anyof",
				"values": [
					"WorkOrd:H"
				],
				"isor": false,
				"isnot": false,
				"leftparens": 1,
				"rightparens": 0
			},
			{
				"name": "built",
				"operator": "greaterthan",
				"values": [
					"0"
				],
				"isor": false,
				"isnot": false,
				"leftparens": 0,
				"rightparens": 2
			},
			{
				"name": "applyingtransaction",
				"operator": "noneof",
				"values": [
					"@NONE@"
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
				"formula": "TO_CHAR({applyingtransaction.custbody_scv_mfg_date}, 'MM/yyyy')",
				"sortdir": "NONE"
			},
			{
				"name": "custbody_scv_wo_assembly",
				"summary": "GROUP",
				"label": "Assembly",
				"type": "select",
				"sortdir": "ASC"
			},
			{
				"name": "item",
				"summary": "GROUP",
				"label": "Item",
				"type": "select",
				"sortdir": "ASC"
			},
			{
				"name": "formulanumeric",
				"summary": "MAX",
				"label": "Original Item Qty BOM",
				"type": "float",
				"formula": "case when {custcol_scv_not_include_in_bom} is null or {custcol_scv_not_include_in_bom} <> 'T' then (case when {custcol_scv_use_std_bom_qty} = 'T' then {custcol_scv_tc_wo_org_ite_qty} else {custcol_scv_tc_wo_org_ite_qty}*{custbody_scv_unit_conversion_rate} end) end",
				"sortdir": "NONE",
				"whenorderedbyalias": "Transaction_DATECREATED"
			},
			{
				"name": "formulatext",
				"summary": "GROUP",
				"label": "Key Mapping",
				"type": "text",
				"formula": "{custbody_scv_wo_assembly.internalid} || {item.internalid} || TO_CHAR({applyingtransaction.custbody_scv_mfg_date}, 'yyyyMM')",
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
				join: 'applyingtransaction',
                operator: "onorafter",
                values: _params.custpage_fromdt
            }));
		}
            
        if (!!_params.custpage_todt){
			filters.push(search.createFilter({
                name: 'custbody_scv_mfg_date',
				join: 'applyingtransaction',
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

		if(!!_params.custpage_item){
            filters.push(search.createFilter({
                name: 'formulatext',
                formula: `{item}`,
                operator: "contains",
                values: _params.custpage_item
            }))
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
