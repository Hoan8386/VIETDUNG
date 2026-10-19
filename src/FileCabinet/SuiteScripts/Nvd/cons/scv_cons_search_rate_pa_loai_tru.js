/**
 * Nội dung:
 * =======================================================================================
 *  Date                Author                  Description
 *  28 May 2025			Phu Pham				Init. Create file
 */
define(['N/search'],
function(search) {
	const ID = "customsearch_scv_rate_pa_loai_tru";

	const getDataSource = (_filters) =>{
		let resultSearch = search.load(ID);
		let myFilters = resultSearch.filters;
		let myColumns = resultSearch.columns;

		if(util.isArray(_filters)){
			_filters.forEach(_objFilter => myFilters.push(_objFilter));
		}
		else if(util.isObject(_filters) || typeof(_filters) == "object"){
			myFilters.push(_filters)
		}
		
		resultSearch = resultSearch.runPaged({pageSize: 1000});
		let arrResult = [];
        for(let i = 0; i < resultSearch.pageRanges.length; i++){
            let currentPage = resultSearch.fetch({index : i}).data;
            for(let idx = 0; idx < currentPage.length; idx++){
                let obj = {};
				obj.subsidiary_id = currentPage[idx].getValue(myColumns[0]);
				obj.subsidiary_nm = currentPage[idx].getText(myColumns[0]);
				obj.start_date = currentPage[idx].getValue(myColumns[1]);
				obj.end_date = currentPage[idx].getValue(myColumns[2]);
				obj.item_id = currentPage[idx].getValue(myColumns[3]);
				obj.item_nm = currentPage[idx].getText(myColumns[3]);
                arrResult.push(obj);
            }
        }
		return arrResult;
	}

    return {
		ID: ID,
		TYPE: "customrecord_scv_loai_tru_pabh",
		getDataSource: getDataSource
    };
    
});
