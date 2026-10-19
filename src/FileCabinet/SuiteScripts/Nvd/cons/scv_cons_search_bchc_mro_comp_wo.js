/**
 * Nội dung:
 * =======================================================================================
 *  Date                Author                  Description
 *  16 Jul 2025 		Phu Pham 			    Init, create file.
 */
define(['N/search',
    '../cons/scv_cons_search.js',
],
function(search,
    constSearch
) {
	const ID = "customsearch_scv_bchc_mro_comp_for_wo";
    const TYPE = "transaction";

	const getDataSource = (filters) =>{
		let resultSearch = search.load(ID);
		let myFilters = resultSearch.filters;
        let myColumns = resultSearch.columns;

		if(util.isArray(filters)){
			filters.forEach(_objFilter => myFilters.push(_objFilter));
		}
		else if(util.isObject(filters) || typeof(filters) == "object"){
			myFilters.push(filters)
		}
		
		let arrResult = constSearch.fetchResultSearchRunEach(resultSearch, function(_objTmpl, _column){
			let objResTmpl = constSearch.getObjResultFromSearchByKey(_objTmpl, _column, [
                "subsidiary", "tranid", "item", "item_code", "item_name", "unit",
				"mro_usage_qty", "mro_usage_rate", "mro_usage_amount",
				"inventoryadjust", "out_qty_actual", "in_qty_actual", 
				"actual_usage", "amount_difference", "mro_id", "mro_type",
				"gtri_hoan_cong"
			]);

            objResTmpl.internalid = _objTmpl.id;
			return objResTmpl;
		});

        return arrResult
	}

    return {
		ID: ID,
		TYPE: TYPE,
		getDataSource: getDataSource
    };
    
});
