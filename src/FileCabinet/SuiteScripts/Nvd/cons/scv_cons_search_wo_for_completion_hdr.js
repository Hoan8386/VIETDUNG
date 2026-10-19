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
	const ID = "customsearch_scv_wo_for_completion_hdr";
	const TYPE = "workorder";

	const RECORDS = {
		title: "SCV Work Order for completion HDR (Don't Edit)",
		id: ID,
		isPublic: true,
		type: "workorder",
		settings:[{"name":"consolidationtype","value":"ACCTTYPE"}],
		filters:
		[
			["type","anyof","WorkOrd"], 
			"AND", 
			["mainline","is","T"], 
			"AND", 
			["custbody_scv_wo_completion","is","F"]
		],
		columns:
		[
			search.createColumn({name: "trandate", label: "Date"}),
			search.createColumn({name: "custbody_mfgmob_workcenter", label: "Work Center"}),
			search.createColumn({name: "tranid", label: "Document Number"}),
			search.createColumn({name: "item", label: "Item"}),
			search.createColumn({name: "custbody_scv_assembly_lot", label: "Prod Lot Number"}),
			search.createColumn({name: "quantity", label: "Quantity"}),
			search.createColumn({name: "built", label: "Built"}),
			search.createColumn({
				name: "formulanumeric",
				formula: "{quantity}-nvl({built},0)",
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
			search.createColumn({
				name: "formulanumeric",
				formula: "nvl({item.custitem_scv_kl_vtc},1)*nvl({item.custitem_scv_unit_conversion_rate},1)",
				label: "Trọng lượng"
			}),
			search.createColumn({
				name: "islotitem",
				join: "item",
				label: "Is Lot Numbered Item"
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
			"built",
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
			"item_dinhmuc",
			"islotitem",
			"itemtype",
			"custbody_scv_so_thong_ke_sx"
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
