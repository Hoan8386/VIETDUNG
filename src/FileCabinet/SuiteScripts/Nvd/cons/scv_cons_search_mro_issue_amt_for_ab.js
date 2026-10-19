/**
 * Nội dung:
 * =======================================================================================
 *  Date                Author                  Description
 *  05 Dec 2024			Phu Pham				Init. Create file
 */
define(['N/search'],
function(search) {
	const ID = "customsearch_scv_mro_issue_amt_for_ab";

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
				obj.account_id = currentPage[idx].getValue(myColumns[0]);
				obj.account_nm = currentPage[idx].getText(myColumns[0]);
                obj.amount = currentPage[idx].getValue(myColumns[1]) * 1;
				obj.cost_group_id = currentPage[idx].getValue(myColumns[2]);
				obj.cost_group_nm = currentPage[idx].getValue(myColumns[3]);
                arrResult.push(obj);
            }
        }
		return arrResult;
	}

    return {
		ID: ID,
		TYPE: "transaction",
		getDataSource: getDataSource
    };
    
});
