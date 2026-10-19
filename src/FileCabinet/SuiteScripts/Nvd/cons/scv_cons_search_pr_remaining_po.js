/**
 * Nội dung:
 * =======================================================================================
 *  Date                Author                  Description
 *  26 Nov 2024			Khanh Tran				Init. Create file
 */
define(['N/search'],
function(search) {
	const ID = "customsearch_scv_pr_po_qty_remaining";

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
            let currentPage = resultSearch.fetch({index : i}).data;
            for(let idx = 0; idx < currentPage.length; idx++){
                let obj = {};  
                obj.item = currentPage[idx].getValue(myColumns[0]);
                obj.ori_lineid = currentPage[idx].getValue(myColumns[1]);
                obj.pr_qty = currentPage[idx].getValue(myColumns[2]) * 1;
                obj.po_qty = currentPage[idx].getValue(myColumns[3]) * 1;
                obj.qty_remaining = currentPage[idx].getValue(myColumns[4]) * 1;
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
