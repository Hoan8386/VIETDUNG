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
	const ID = "customsearch_scv_cst_anlyt_detail_rpt";

	const RECORDS = {
		"type": "transaction",
		"title": "SCV Production Detail Cost - BC phân tích giá thành (Don't Update)",
		"id": "customsearch_scv_cst_anlyt_detail_rpt",
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
					"F"
				],
				"isor": false,
				"isnot": false,
				"leftparens": 0,
				"rightparens": 0
			},
			{
				"name": "customgl",
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
					"0"
				],
				"formula": "case when {memo} like 'Cost of Sales Adjustment' then 1 else 0 end",
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
				"formula": "case when {createdfrom.internalid} is null then 1 when {createdfrom.internalid} is not null and {createdfrom.line} = 0 then 1 else 0 end",
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
				"formula": "case when {custbody_scv_orrginal_wo.internalid} is null then 1 when {custbody_scv_orrginal_wo.internalid} is not null and {custbody_scv_orrginal_wo.line} = 0 then 1 else 0 end",
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
				"name": "formulatext",
				"summary": "GROUP",
				"label": "Assembly",
				"type": "text",
				"formula": "TRIM(regexp_substr(nvl({createdfrom.item}, {custbody_scv_orrginal_wo.item}),'[^:]*$'))",
				"sortdir": "NONE"
			},
			{
				"name": "item",
				"summary": "GROUP",
				"label": "Item",
				"type": "select",
				"sortdir": "NONE"
			},
			{
				"name": "unit",
				"summary": "GROUP",
				"label": "Units",
				"type": "text",
				"sortdir": "NONE"
			},
			{
				"name": "formulanumeric",
				"summary": "SUM",
				"label": "Total Quantity",
				"type": "float",
				"formula": "abs({quantity})",
				"sortdir": "NONE"
			},
			{
				"name": "formulanumeric",
				"summary": "SUM",
				"label": "Total Amount",
				"type": "float",
				"formula": "abs({amount})",
				"sortdir": "NONE"
			},
			{
				"name": "custitem_scv_group_lv1",
				"join": "item",
				"summary": "GROUP",
				"label": "Nhom cap 1",
				"type": "select",
				"sortdir": "NONE"
			},
			{
				"name": "custitem_scv_group_lv2",
				"join": "item",
				"summary": "GROUP",
				"label": "Nhom cap 2",
				"type": "select",
				"sortdir": "NONE"
			},
			{
				"name": "formulatext",
				"summary": "GROUP",
				"label": "Key Mapping",
				"type": "text",
				"formula": "nvl({createdfrom.item.id}, {custbody_scv_orrginal_wo.item.id}) || TO_CHAR({custbody_scv_mfg_date}, 'yyyyMM')",
				"sortdir": "NONE"
			},
			{
				"name": "formulatext",
				"summary": "GROUP",
				"label": "Key Mapping BOM",
				"type": "text",
				"formula": "nvl({createdfrom.item.id}, {custbody_scv_orrginal_wo.item.id}) || {item.internalid} || TO_CHAR({custbody_scv_mfg_date}, 'yyyyMM')",
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
