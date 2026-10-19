/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  20 Nov 2024         Huy Pham                Init & create file
 */
define([
	'../cons/scv_cons_search.js',
	'../cons/scv_cons_format.js'
],
function(
	constSearch,
	constFormat
) {
	const ID = "customsearch_scv_lift_mat_hist_allocate";
	const TYPE = "customrecord_scv_lifting_mat_historys";

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
			"custrecord_scv_lift_mat_lift_type",
			"custrecord_scv_lift_mat_date",
			"custrecord_scv_lift_mat_operator",
			"custrecord_scv_lift_mat_item",
			"custrecord_scv_lift_mat_lot_serial",
			"custrecord_scv_lift_mat_qc_material",
			"custrecord_scv_lift_mat_weight",
			"custrecord_scv_lift_mat_units",
			"custrecord_scv_lift_mat_location",
			"custrecord_scv_lift_mat_shift",
			"custrecord_scv_lift_mat_woc",
			"custrecord_scv_lift_mat_document_related",
			"custrecord_scv_lift_mat_prod_lot",
			"custrecord_scv_lift_mat_subsidiary",
			"custrecord_scv_lift_mat_wo_related",
			"custrecord_scv_lift_mat_ab_related",
			"name"
		]);

		objRes.internalid = _objSearch.id;
		let lift_mat_date = constFormat.getDateTimeWithCurrentGMT(objRes.custrecord_scv_lift_mat_date);
		objRes.custrecord_scv_lift_mat_date_yyyymmddhh24miss = constFormat.dateTimeToChar(lift_mat_date);

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
