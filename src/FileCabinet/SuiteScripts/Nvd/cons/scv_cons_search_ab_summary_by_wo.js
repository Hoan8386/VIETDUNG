/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  26 Jan 2026         Khanh Tran			    Init, create file. Phát triển chức năng phân bổ chi phí sản xuất gia công kỹ thuật, form mr.Phúc(https://app.clickup.com/t/86d0pypjy)
 */
define(['N/search',
	'../cons/scv_cons_search.js'
],
function(search,
	constSearch
) {
	const ID = "customsearch_scv_ab_summary_by_wo";
	const TYPE = "assemblybuild";

	const RECORDS = {
		"title": "SCV PBCPGC – Assembly Build Summary by WO (Don't Update)",
		"type": ID,
		"id": TYPE,
		"isPublic": true,
		"settings":[{"name":"consolidationtype","value":"ACCTTYPE"}],
		"filters":
		[
			["type","anyof","Build"], 
			"AND", 
			["account","anyof","1235"], 
			"AND", 
			["formulanumeric: case when {custbody_scv_work_order_no.internalid} is null then 1 when {custbody_scv_work_order_no.internalid} is not null and {custbody_scv_work_order_no.line} = 0 then 1 else 0 end","equalto","1"], 
			"AND", 
			["accountingperiod.closed","is","F"]
		],
		"columns":
		[
			search.createColumn({
				name: "account",
				summary: "GROUP",
				label: "Account"
			}),
			search.createColumn({
				name: "formulanumeric",
				summary: "GROUP",
				formula: "{item.custitem_scv_prod_cost_group.id}",
				label: "Cost Group Internalid"
			}),
			search.createColumn({
				name: "formulatext",
				summary: "GROUP",
				formula: "{item.custitem_scv_prod_cost_group}",
				label: "Cost Group Name"
			}),
			search.createColumn({
				name: "formulanumeric",
				summary: "SUM",
				formula: "abs({amount})",
				label: "AB Amount"
			}),
			search.createColumn({
				name: "trandate",
				join: "CUSTBODY_SCV_WORK_ORDER_NO",
				summary: "GROUP",
				label: "WO Date"
			}),
			search.createColumn({
				name: "tranid",
				join: "CUSTBODY_SCV_WORK_ORDER_NO",
				summary: "GROUP",
				label: "WO Number"
			}),
			search.createColumn({
				name: "formulatext",
				summary: "MAX",
				formula: "NS_CONCAT(distinct(decode({recordtype}, 'assemblybuild', {internalid})))",
				label: "AB Internalid"
			}),
			search.createColumn({
				name: "formulatext",
				summary: "MAX",
				formula: "NS_CONCAT(distinct(decode({recordtype}, 'assemblybuild', {number} || ' (' || {trandate} || ')')))",
				label: "AB Number"
			}),
			search.createColumn({
				name: "formulatext",
				summary: "MAX",
				formula: "NS_CONCAT(distinct(decode({recordtype}, 'assemblybuild', {item.internalid})))",
				label: "Item Internalid"
			}),
			search.createColumn({
				name: "formulatext",
				summary: "MAX",
				formula: "NS_CONCAT(distinct(decode({recordtype}, 'assemblybuild', {item})))",
				label: "Item Name"
			}),
			search.createColumn({
				name: "formulatext",
				summary: "GROUP",
				formula: "{item.custitem_scv_prod_cost_group.id} || {custbody_scv_work_order_no.internalid}",
				label: "Key Mapping"
			})
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
