/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  31 Dec 2024         Huy Pham                Init & create file
 */
define([
	'../cons/scv_cons_search.js'
],
function(
	constSearch
) {
	const ID = "customsearch_scv_workbench_capacity_calc";
	const TYPE = "customrecord_scv_mfg_work_bench_op";

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
			"custrecord_scv_work_bench_subsidiary",
			"custrecord_scv_wo_center_location",
			"custrecord_scv_work_bench_work_center",
			"name",
			"custrecord_scv_work_bench_planning_cate",
			"custrecord_scv_work_bench_setup_time",
			"custrecord_scv_wo_center_mon_hrs",
			"custrecord_scv_wo_center_tue_hrs",
			"custrecord_scv_wo_center_wed_hrs",
			"custrecord_scv_wo_center_thu_hrs",
			"custrecord_scv_wo_center_fri_hrs",
			"custrecord_scv_wo_center_sat_hrs",
			"custrecord_scv_wo_center_sun_hrs",
			"custrecord_scv_wo_center_mon_start",
			"custrecord_scv_wo_center_tue_start",
			"custrecord_scv_wo_center_wed_start",
			"custrecord_scv_wo_center_thu_start",
			"custrecord_scv_wo_center_fri_start",
			"custrecord_scv_wo_center_sat_start",
			"custrecord_scv_wo_center_sun_start",
			"custrecord_scv_wo_center_mon_end",
			"custrecord_scv_wo_center_tue_end",
			"custrecord_scv_wo_center_wed_end",
			"custrecord_scv_wo_center_thu_end",
			"custrecord_scv_wo_center_fri_end",
			"custrecord_scv_wo_center_sat_end",
			"custrecord_scv_wo_center_sun_end"
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
