/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  04 Dec 2024         Huy Pham                Init & create file
 */
define([
	'../cons/scv_cons_search.js',
	'../cons/scv_cons_format.js'
],
function(
	constSearch,
	constFormat
) {
	const ID = "customsearch_scv_list_item_stand_lq";
	const TYPE = "customrecord_scv_list_item_standard";

	const RECORDS = {}

	const getDataSource = (_filters) =>{
		let resultSearch = constSearch.loadSearchWithFilter(ID, _filters);
		
		resultSearch = resultSearch.runPaged({pageSize: 1000});

		let arrResult = constSearch.fetchResultSearchAllPage(resultSearch, function(_obj, _column){
			return getObjResultFromSearch(_obj, _column);
		});

		return arrResult;
	}

	const getDataSourceFetchPage = (_filters, _params) =>{
		let resultSearch = constSearch.loadSearchWithFilter(ID, _filters);
		
		resultSearch = resultSearch.runPaged({pageSize: 1000});

		let objRes = constSearch.fetchResultSearchPage(resultSearch, _params, function(_obj, _column){
			return getObjResultFromSearch(_obj, _column);
		})

		return objRes;
	}

	const getObjResultFromSearch = (_objSearch, _myColumns) =>{
		let objRes = constSearch.getObjResultFromSearchByKey(_objSearch, _myColumns,[
			"custrecord_scv_list_item_standard_sub",
			"name",
			"custrecord_scv_list_item_standard_stadat",
			"custrecord_scv_list_item_standard_endate",
			"custrecordscv_inp_item_stand_list_id",
			"custrecord_scv_list_item_standard_categ",
			"custrecord_scv_predicted_consump_avg",
			"custrecord_scv_plan_numb_days_on_hand",
			"custrecord_scv_list_item_standard_group",
			"custrecordscv_inp_item_stand_name",
			"internalid",
			"custrecord_scv_inp_item_stand_market",
			"custrecord_scv_inp_item_stand_use_no_bom",
			"custrecord_scv_no_line"
		]);

		objRes.custrecord_scv_list_item_standard_stadat_yyyymmdd = constFormat.dateToChar(objRes.custrecord_scv_list_item_standard_stadat, "YYYYMMDD");
		objRes.custrecord_scv_list_item_standard_endate_yyyymmdd = constFormat.dateToChar(objRes.custrecord_scv_list_item_standard_endate, "YYYYMMDD");

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
