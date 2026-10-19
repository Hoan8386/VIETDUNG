/**
 * Nội dung:
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  28 Aug 2025         Khanh Tran			    Init, create file. Phát triển báo cáo kết quả mục tiêu sản xuất ACP, form mr.TMPhúc(https://app.clickup.com/t/86d04224z)
 */
define(['N/search',
	'../cons/scv_cons_search.js'
],
function(search,
	constSearch
) {
	const ID = "customsearch_scv_mfg_workbench_acp_rpt";
	const TYPE = "customrecord_scv_mfg_work_bench_op";

	const RECORDS = {
		"type": TYPE,
		"title": "SCV MFG Workbench Operation - ACP Performance Rpt (Don't Update)",
		"id": ID,
		"isPublic": true,
		"filters": [
			
		],
		"columns": [
			search.createColumn({name: "custrecord_scv_work_bench_subsidiary", label: "Subsidiary"}),
			search.createColumn({name: "custrecord_scv_work_bench_work_center", label: "WO Center"}),
			search.createColumn({name: "custrecord_scv_work_bench_planning_cate", label: "Nhom ke hoach"}),
			search.createColumn({name: "custrecord_scv_work_bench_std_rate", label: "Std Rate (min/unit)"}),
			search.createColumn({name: "custrecord_scv_work_bench_std_rate_hr", label: "Std Rate (unit/hr)"}),
			search.createColumn({name: "custrecord_scv_work_bench_uom", label: "Unit Of Measure"}),
			search.createColumn({name: "custrecord_scv_work_bench_setup_time", label: "Setup Time (min)"}),
			search.createColumn({name: "custrecord_scv_work_bench_lag_value", label: "Lag Value"}),
			search.createColumn({name: "custrecord_scv_work_bench_b_type", label: "Tam B (3ly KC/ca)"}),
			search.createColumn({
				name: "formulanumeric",
				formula: "{custrecord_scv_work_bench_b_type} / 8",
				label: "Tam B (3ly KC/hr)"
			}),
			search.createColumn({name: "custrecord_scv_work_bench_scrapt_rate", label: "Ty le phe pham"}),
			search.createColumn({name: "custrecord_scv_work_bench_plastic_sheet", label: "Nhua tam (kg/ca)"}),
			search.createColumn({
				name: "formulanumeric",
				formula: "{custrecord_scv_work_bench_plastic_sheet} / 8",
				label: "Nhua tam (kg/hr)"
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
