/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  19 Jun 2025         Huy Pham			    Init, create file, báo cáo đối chiếu công nợ,from ms.Ngọc(https://app.clickup.com/t/86czaq0qp)
 */
define(['N/search',
	'../cons/scv_cons_search.js'
],
function(search,
	constSearch
) {
	const ID = "customsearch_scv_dccn_ss2";
	const TYPE = "transaction";

	const RECORDS = {
		type: "transaction",
		title: "SCV Mẫu in ĐCCN - SS2 PXK (do not edit, for code)",
		id: "customsearch_scv_dccn_ss2",
		isPublic: true,
		settings:[{"name":"consolidationtype","value":"ACCTTYPE"}],
		filters:
		[
			["type","anyof","CustInvc"], 
			"AND", 
			["mainline","is","F"], 
			"AND", 
			["taxline","is","F"], 
			"AND", 
			["subsidiary","anyof","@CURRENT@"], 
			"AND", 
			["custbody_scv_created_transaction.mainline","is","T"], 
			"AND", 
			["trandate","within","thismonth"]
		],
		columns:
		[
			search.createColumn({
				name: "internalid",
				join: "subsidiary",
				label: "Công ty ID"
			}),
			search.createColumn({
				name: "internalid",
				join: "customer",
				label: "Khách hàng ID"
			}),
			search.createColumn({name: "trandate", label: "Ngày"}),
			search.createColumn({
				name: "tranid",
				join: "CUSTBODY_SCV_CREATED_TRANSACTION",
				label: "Chứng từ"
			}),
			search.createColumn({name: "tranid", label: "Hóa đơn"}),
			search.createColumn({name: "memo", label: "Diễn giải"}),
			search.createColumn({name: "unit", label: "Đvt"}),
			search.createColumn({name: "quantity", label: "Số lượng"}),
			search.createColumn({
				name: "formulacurrency",
				formula: "{taxamount}+{netamount}",
				label: "Thành tiền"
			}),
			search.createColumn({name: "netamount", label: "Amount (Net)"}),
			search.createColumn({name: "taxamount", label: "Amount (Tax)"}),
			search.createColumn({
				name: "formulacurrency",
				formula: "({netamount}+{taxamount})/{quantity}",
				label: "Rate +VAT"
			}),
			search.createColumn({name: "rate", label: "Rate -VAT"}),
			search.createColumn({name: "item", label: "Item"})
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
