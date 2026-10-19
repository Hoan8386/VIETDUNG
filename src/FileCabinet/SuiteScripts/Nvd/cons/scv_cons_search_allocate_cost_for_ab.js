/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  23 Sep 2025         Khanh Tran			    Init, create file. Phát triển chức năng phân bổ chi phí sản xuất gia công kỹ thuật, form mr.Phúc(https://app.clickup.com/t/86d0pypjy)
 */
define(['N/search',
	'../cons/scv_cons_search.js'
],
function(search,
	constSearch
) {
	const ID = "customsearch_scv_allocate_cost_for_ab";
	const TYPE = "transaction";

	const RECORDS = {
		"title": "SCV Allocate Cost for Assembly Build (Don't Update)",
		"type": ID,
		"id": TYPE,
		"isPublic": true,
		"filters": [
			[[["type","anyof","Journal"],"AND",["custcol_scv_tl_wo","noneof","@NONE@"]],"OR",[["type","anyof","Build"],"AND",["item.custitem_scv_prod_cost_group","anyof","1","2"]]], 
			"AND", 
			["account","anyof","1235"], 
			"AND", 
			["formulanumeric: case when {custcol_scv_tl_wo.internalid} is null then 1 when {custcol_scv_tl_wo.internalid} is not null and {custcol_scv_tl_wo.line} = 0 then 1 else 0 end","equalto","1"], 
			"AND", 
			["formulanumeric: case when {custbody_scv_work_order_no.internalid} is null then 1 when {custbody_scv_work_order_no.internalid} is not null and {custbody_scv_work_order_no.line} = 0 then 1 else 0 end","equalto","1"]
		],
		"columns": [
			search.createColumn({
				name: "account",
				summary: "GROUP",
				label: "Account"
			}),
			search.createColumn({
				name: "amount",
				summary: "SUM",
				label: "Amount"
			}),
			search.createColumn({
				name: "formulanumeric",
				summary: "GROUP",
				formula: "nvl({custcol_scv_prod_cost_group.id}, {item.custitem_scv_prod_cost_group.id})",
				label: "Cost Group Internalid"
			}),
			search.createColumn({
				name: "formulatext",
				summary: "GROUP",
				formula: "nvl({custcol_scv_prod_cost_group}, {item.custitem_scv_prod_cost_group})",
				label: "Cost Group Name"
			}),
			search.createColumn({
				name: "formuladate",
				summary: "GROUP",
				formula: "decode({recordtype}, 'journalentry', {custcol_scv_tl_wo.trandate}, {custbody_scv_work_order_no.trandate})",
				label: "WO Date"
			}),
			search.createColumn({
				name: "formulatext",
				summary: "GROUP",
				formula: "decode({recordtype}, 'journalentry', {custcol_scv_tl_wo.number}, {custbody_scv_work_order_no.number})",
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
				formula: "NS_CONCAT(distinct(decode({recordtype}, 'assemblybuild', {number})))",
				label: "AB Number"
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
