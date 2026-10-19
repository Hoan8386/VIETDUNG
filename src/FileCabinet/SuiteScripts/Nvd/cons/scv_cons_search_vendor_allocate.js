/**
 * Nội dung:
 * =======================================================================================
 *  Date                Author                  Description
 *  05 Nov 2024			Phu Pham				Init. Create file
 */
define(['N/search'],
function(search) {
	const ID = "customsearch_scv_vendor_allocation";

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
                obj.item_id = currentPage[idx].getValue(myColumns[1]);
                obj.item_nm = currentPage[idx].getText(myColumns[1]);
                obj.quantity = currentPage[idx].getValue(myColumns[2]) * 1;
                arrResult.push(obj);
            }
        }
		return arrResult;
	}

    const getDataSourceById = (_internalId) => {
        let myFilters = [
            search.createFilter({
                name: "internalid", operator: "anyof", values: _internalId
            })
        ];
        return getDataSource(myFilters);
    }

    return {
		ID: ID,
		TYPE: "transaction",
		getDataSource: getDataSource,
        getDataSourceById: getDataSourceById
    };
    
});
