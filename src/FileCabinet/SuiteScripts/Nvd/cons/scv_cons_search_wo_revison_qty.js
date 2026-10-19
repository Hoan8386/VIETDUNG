/**
 * Nội dung:
 * =======================================================================================
 *  Date                Author                  Description
 *  19 Nov 2024			Khanh Tran				Init. Create file
 */
define(['N/search'],
function(search) {
	const ID = "customsearch_scv_wo_revison_qty";

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
		
		resultSearch = resultSearch.runPaged({pageSize: 1000});
		let arrResult = [];
        for(let i = 0; i < resultSearch.pageRanges.length; i++){
            let currentPage = resultSearch.fetch({ index: i });
            currentPage = currentPage.data;
            for(let idx = 0; idx < currentPage.length; idx++){
                let obj = {};  
                obj.key_mapping = currentPage[idx].getValue(myColumns[0]);
                obj.qty = currentPage[idx].getValue(myColumns[1]) * 1;
                arrResult.push(obj);
            }
        }
		return arrResult;
	}

    return {
		ID: ID,
		TYPE: "bomrevision",
		getDataSource: getDataSource
    };
    
});
