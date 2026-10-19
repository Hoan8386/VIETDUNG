/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  19 Dec 2024         Huy Pham                Init & create file
 */
define([
	'../cons/scv_cons_search.js'
],
function(
	constSearch
) {
	const ID = "customsearch_scv_lift_lower_history_tans";
	const TYPE = "customrecord_scv_lifting_mat_history";

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
			"name",
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
			//"custrecord_scv_lift_mat_ab_related",
			//"custrecord_scv_lift_mat_ab_related_internalid",
			"custrecord_scv_ab_lift_lower_ab_doc_no",
			"custrecord_scv_ab_lift_lower_line_id",
			"custrecord_scv_ab_lift_lower_manual_qty"
		]);
		objRes.internalid = _objSearch.id;
		objRes.custrecord_scv_ab_lift_lower_manual_qty = objRes.custrecord_scv_ab_lift_lower_manual_qty * 1;
		
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
