/**
 * Nội dung:
 * =======================================================================================
 *  Date                Author                  Description
 *  15 May 2025			Phu Pham				Init. Create file
 */
define(['N/search'],
function(search) {
	const ID = "customsearch_scv_item_demand_mfg_trans";

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
				obj.internalid = currentPage[idx].id;
				obj.subsidiary_id = currentPage[idx].getValue(myColumns[0]);
				obj.subsidiary_nm = currentPage[idx].getText(myColumns[0]);
				obj.transaction_num = currentPage[idx].getValue(myColumns[1]);
				obj.period_plan_id = currentPage[idx].getValue(myColumns[2]);
				obj.period_plan_nm = currentPage[idx].getText(myColumns[2]);
				obj.trandate = currentPage[idx].getValue(myColumns[3]);
				obj.plan_type_id = currentPage[idx].getValue(myColumns[4]);
				obj.plan_type_nm = currentPage[idx].getText(myColumns[4]);
				obj.item_id = currentPage[idx].getValue(myColumns[5]);
				obj.item_nm = currentPage[idx].getText(myColumns[5]);
				obj.plan_qty = currentPage[idx].getValue(myColumns[6]) * 1;
				obj.unit = currentPage[idx].getValue(myColumns[7]);
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
