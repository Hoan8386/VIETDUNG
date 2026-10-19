/**
 * Nội dung:
 * =======================================================================================
 *  Date                Author                  Description
 *  23 Jul 2025 		Phu Pham 			    Init, create file.
 */
define(['N/search',
    '../cons/scv_cons_search.js',
],
function(search,
    constSearch
) {
	const ID = "customsearch_scv_bchc_search_info_wo";
    const TYPE = "workorder";

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
                "trandate", "actualproductionstartdate", "tranid", "item",
				"unit", "quantity", "built", "custbody_scv_total_qty_store", 
				"sub_legalname", "sub_address"
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
