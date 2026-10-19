/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  05 Feb 2025         Huy Pham                Init & create file
 */
define(['N/search',
	'../cons/scv_cons_search.js'
],
function(search,
	constSearch
) {
	const ID = "customsearch_scv_wo_for_completion_det";
	const TYPE = "workorder";

	const RECORDS = {
		title: "SCV Work Order for completion DET (Don't Edit)",
		id: ID,
		isPublic: true,
		type: "workorder",
		settings:[{"name":"consolidationtype","value":"ACCTTYPE"}],
		filters:
		[
			["type","anyof","WorkOrd"], 
			"AND", 
			["mainline","is","F"], 
			"AND", 
			["custbody_scv_wo_completion","is","F"], 
			"AND", 
			["status","noneof","WorkOrd:C","WorkOrd:H"]
		],
		columns:
		[
			search.createColumn({name: "trandate", label: "Date"}),
			search.createColumn({name: "custbody_mfgmob_workcenter", label: "Work Center"}),
			search.createColumn({name: "tranid", label: "Document Number"}),
			search.createColumn({name: "item", label: "Item"}),
			search.createColumn({name: "custbody_scv_assembly_lot", label: "Prod Lot Number"}),
			search.createColumn({name: "quantity", label: "Quantity"}),
			search.createColumn({name: "custcol_scv_bom_std_qty", label: "B.O.M Qty/Unit"}),
			search.createColumn({name: "quantityshiprecv", label: "Quantity Fulfilled/Received"}),
			search.createColumn({
				name: "formulanumeric",
				formula: "{quantity}-nvl({quantityshiprecv},0)",
				label: "Qty Remaining"
			}),
			search.createColumn({name: "custbody_scv_shift", label: "Shift"}),
			search.createColumn({name: "custbody_scv_prod_start_date", label: "Prod. Start Date"}),
			search.createColumn({name: "custbody_scv_prod_end_date", label: "Prod. End Date"}),
			search.createColumn({name: "subsidiary", label: "Subsidiary"}),
			search.createColumn({name: "location", label: "Location"}),
			search.createColumn({name: "custbody_scv_work_bench", label: "Work Bench"}),
			search.createColumn({name: "internalid", label: "Internal ID"}),
			search.createColumn({name: "custbody_scv_qc_serial_code", label: "QC Serial"}),
			search.createColumn({name: "custbody_scv_wo_completion", label: "Hoàn thành LSX"}),
			search.createColumn({name: "serialnumber", label: "Transaction Serial/Lot Number"}),
			search.createColumn({name: "serialnumberquantity", label: "Transaction Serial/Lot Number Quantity"}),
			search.createColumn({
				name: "islotitem",
				join: "item",
				label: "Is Lot Numbered Item"
			}),
			search.createColumn({name: "line", label: "Line ID"})
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
		let resultSearch = constSearch.loadSearchWithFilter(ID, _filters, RECORDS);
		
		resultSearch = resultSearch.runPaged({pageSize: 1000});

		let objRes = constSearch.fetchResultSearchPage(resultSearch, _params, function(_obj, _column){
			return getObjResultFromSearch(_obj, _column);
		})

		return objRes;
	}

	const getObjResultFromSearch = (_objSearch, _myColumns) =>{
		let objRes = constSearch.getObjResultFromSearchByKey(_objSearch, _myColumns,[
			"trandate",
			"custbody_mfgmob_workcenter",
			"tranid",
			"item",
			"custbody_scv_assembly_lot",
			"quantity",
			"custcol_scv_bom_std_qty",
			"quantityshiprecv",
			"qty_remaining",
			"custbody_scv_shift",
			"custbody_scv_prod_start_date",
			"custbody_scv_prod_end_date",
			"subsidiary",
			"location",
			"custbody_scv_work_bench",
			"internalid",
			"custbody_scv_qc_serial_code",
			"custbody_scv_wo_completion",
			"serialnumber",
			"serialnumberquantity",
			"islotitem",
			"line",
			"itemtype",
			"conversionrate"
		]);

		objRes.islotitem = objRes.islotitem ? "T" : "F";
		
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
