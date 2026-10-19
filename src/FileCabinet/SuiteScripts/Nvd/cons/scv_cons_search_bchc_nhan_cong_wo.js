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
	const ID = "customsearch_scv_bchc_nhan_cong_for_wo";
    const TYPE = "customrecord_scv_cmms_labor";

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
                "description", "wo_tranid", "planquantity", "planrate", "planamount", 
				"actualquantity", "actualrate", "actualamount",
				"workday_difference", "amount_difference", "workorder"
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
