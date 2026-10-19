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
	const ID = "customsearch_scv_dccn_ss1";
	const TYPE = "transaction";

	const RECORDS = {
		type: "transaction",
		title: "SCV Mẫu in ĐCCN - SS1 Dư đầu kỳ (do not edit, for code)",
		id: "customsearch_scv_dccn_ss1",
		isPublic: true,
		settings:[{"name":"consolidationtype","value":"ACCTTYPE"}],
		filters:
		[
			["account","anyof","119","246"], 
			"AND", 
			["type","noneof","CuTrSale114"], 
			"AND", 
			["posting","is","T"]
		],
		columns:
		[
			search.createColumn({
				name: "subsidiary",
				summary: "GROUP",
				label: "Subsidiary"
			}),
			search.createColumn({
				name: "internalid",
				join: "subsidiary",
				summary: "GROUP",
				label: "Subsidiary ID"
			}),
			search.createColumn({
				name: "internalid",
				join: "customer",
				summary: "GROUP",
				label: "Customer ID"
			}),
			search.createColumn({
				name: "companyname",
				join: "customer",
				summary: "GROUP",
				label: "Company Name"
			}),
			search.createColumn({
				name: "debitamount",
				summary: "SUM",
				label: "Amount (Debit)"
			}),
			search.createColumn({
				name: "creditamount",
				summary: "SUM",
				label: "Amount (Credit)"
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
