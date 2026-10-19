/**
 * Nội dung:
 * =======================================================================================
 *  Date                Author                  Description
 *  28 Feb 2025			Phu Pham				Init. Create file
 */
define(['N/search'],
function(search) {
	const ID = "customsearch_scv_so_tinh_ck_khac";

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
				obj.tranid = currentPage[idx].getValue(myColumns[1]);
				obj.ori_line_id = currentPage[idx].getValue(myColumns[2]);
				obj.item_id = currentPage[idx].getValue(myColumns[3]);
                arrResult.push(obj);
            }
        }
		return arrResult;
	}

	const getDataSourceWithId = (_internalid) =>{
		if(!_internalid) return [];

		let objFilters = search.createFilter({
			name: 'internalid', operator: 'anyof', 
			values: _internalid
		});

		let data = getDataSource(objFilters);
		return data;
	}

    return {
		ID: ID,
		TYPE: "salesorder",
		getDataSource: getDataSource,
		getDataSourceWithId: getDataSourceWithId
    };
    
});
