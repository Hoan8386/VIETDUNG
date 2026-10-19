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
	const ID = "customsearch_scv_dccn_ss3";
	const TYPE = "transaction";

	const RECORDS = {
		type: "transaction",
		title: "SCV Mẫu in ĐCCN - SS3 Thanh toán (do not edit, for code)",
		id: "customsearch_scv_dccn_ss3",
		isPublic: true,
		settings:[{"name":"consolidationtype","value":"ACCTTYPE"}],
		filters:
		[
			["type","anyof","CustPymt","CustCred","Deposit"], 
			"AND", 
			["trandate","within","thismonth"], 
			"AND", 
			["customer.internalid","noneof","@NONE@"], 
			"AND", 
			["mainline","is","F"], 
			"AND", 
			["posting","is","T"]
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
			search.createColumn({name: "tranid", label: "Hóa đơn"}),
			search.createColumn({
				name: "formulatext",
				formula: "nvl({memo},{memomain})",
				label: "Diễn giải"
			}),
			search.createColumn({name: "amount", label: "Thanh toán"})
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
