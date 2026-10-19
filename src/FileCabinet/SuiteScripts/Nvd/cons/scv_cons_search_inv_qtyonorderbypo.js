/**
 * Nội dung:
 * =======================================================================================
 *  Date                Author                  Description
 *  20 Nov 2025         Khanh Tran              Init & create file
 */
define(['N/search',
	'../cons/scv_cons_search.js'
],
function(search,
	constSearch
) {
	const ID = "customsearch_scv_inv_qtyonorderbypo_rpt";
	const TYPE = "purchaseorder";

	const getDataSource = (_filters) =>{
		let resultSearch = constSearch.loadSearchWithFilter(ID, _filters);
		
		resultSearch = resultSearch.runPaged({pageSize: 1000});

		let arrResult = constSearch.fetchResultSearchAllPage(resultSearch, function(_obj, _column){
			return getObjResultFromSearch(_obj, _column);
		});

		return arrResult;
	}

	const getDataSourceFetchPage = (_filters, _params) =>{
		return constSearch.getDataSourceFetchPage_Mixed(ID, _filters, _params, [], {}, function(_obj, _column) {
			return getObjResultFromSearch(_obj, _column);
		});
		// let resultSearch = constSearch.loadSearchWithFilter(ID, _filters);
		
		// resultSearch = resultSearch.runPaged({pageSize: 1000});

		// let objRes = constSearch.fetchResultSearchPage(resultSearch, _params, function(_obj, _column){
		// 	return getObjResultFromSearch(_obj, _column);
		// })

		// return objRes;
	}

	const getObjResultFromSearch = (_objSearch, _myColumns) =>{
		let objRes = constSearch.getObjResultFromSearchByKey(_objSearch, _myColumns,[
			"subsidiary",
			"po",
			"po_displayname",
			"item",
			"item_upccode",
			"item_displayname",
			"unit",
			"quantity",
			"allow_difference_quantity",
			"tolerance",
			"planing_category",
			"group_lv1",
			"group_lv2",
			"group_lv3",
			"group_lv4",
			"trademark",
			"color_code",
			"do_day_sp",
			"do_day_nhom",
			"item_width",
			"item_length",
			"lop_son",
			"hoa_tiet_dot",
			"kieu_dang",
			"item_step",
			"unit_conversion_rate",
			"item_parent",
			"parent_item_width",
			"parent_item_length",
			"parent_item_ddsp",
			"khoi_luong_vtc",
			"parent_item_hsqdm2"
		]);

		objRes.quantity = objRes.quantity * 1;
		objRes.item_width = objRes.item_width * 1;
		objRes.item_length = objRes.item_length * 1;
		objRes.unit_conversion_rate = objRes.unit_conversion_rate * 1;
		objRes.parent_item_width = objRes.parent_item_width * 1;
		objRes.parent_item_length = objRes.parent_item_length * 1;
		objRes.khoi_luong_vtc = objRes.khoi_luong_vtc * 1;
		
		return objRes;
	}

    return {
		ID,
		TYPE,
		getDataSource,
		getDataSourceFetchPage
    };
    
});
