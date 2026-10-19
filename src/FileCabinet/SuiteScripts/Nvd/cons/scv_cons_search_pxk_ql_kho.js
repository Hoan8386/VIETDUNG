/**
 * Nội dung:
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  05 Sep 2025         Khanh Tran	    		Điền tên người duyệt LXH trên IF tạo từ SO from ms. Ngọc (https://app.clickup.com/t/86d07ekxx)
 */
define(['N/search',
	'../cons/scv_cons_search.js'
],
function(search,
	constSearch
) {
	const ID = "customsearch_scv_pxk_ql_kho";
	const TYPE = "salesorder";

	const RECORDS = {
		"type": ID,
		"title": "SCV update phê duyệt mẫu in LXH (do not edit)",
		"id": TYPE,
		"isPublic": true,
		"filters": [
			["type","anyof","SalesOrd"], 
			"AND", 
			["status","noneof","SalesOrd:H"]
		],
		"columns": [
			search.createColumn({
				name: "internalid",
				summary: "GROUP",
				label: "SO Internalid"
			}),
			search.createColumn({
				name: "tranid",
				summary: "GROUP",
				label: "SO"
			}),
			search.createColumn({
				name: "custrecord_scv_approve_group",
				join: "location",
				summary: "MAX",
				label: "Phân loại"
			}),
			search.createColumn({
				name: "formulatext",
				summary: "MAX",
				formula: "DECODE({location.custrecord_scv_approve_group.id},        1, 'Phạm Thị Hạnh',        2, 'Nguyễn Thị Hằng',        4, 'Đinh Chí Thọ',        NULL)",
				label: "Phê duyệt"
			})
		]
	}

	const getDataSource = (_filters) =>{
		let resultSearch = constSearch.loadSearchWithFilter(ID, _filters, RECORDS);
		
		resultSearch = resultSearch.runPaged({pageSize: 1000});

		let arrResult = constSearch.fetchResultSearchAllPage(resultSearch, function(_obj, _column){
			return getObjResultFromSearch(_obj, _column);
		});

		return arrResult;
	}

	const getDataSourceFetchPage = (_filters, _params) =>{
		
	}

	const getObjResultFromSearch = (_objSearch, _myColumns) =>{
		let objRes = constSearch.getObjResultFromSearchByKey(_objSearch, _myColumns,[
			"internalid",
			"tranid",
			"approve_group",
			"phe_duyet",
		]);
		
		return objRes;
	}

    return {
		ID,
		TYPE,
		RECORDS,
		getDataSource,
		getDataSourceFetchPage
    };
    
});
