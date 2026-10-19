/**
 * Nội dung:
 * =======================================================================================
 *  Date                Author                  Description
 *  11 Jun 2025			Phu Pham				Init. Create file
 */
define(['N/search'],
function(search) {
	const ID = "customsearch_scv_so_nd_6";

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
				obj.subsidiary = currentPage[idx].getValue(myColumns[0]);
				obj.subsidiary_display = currentPage[idx].getText(myColumns[0]);
				obj.trandate = currentPage[idx].getValue(myColumns[1]);
				obj.tranid = currentPage[idx].getValue(myColumns[2]);
				obj.order_type = currentPage[idx].getValue(myColumns[3]);
				obj.order_type_display = currentPage[idx].getText(myColumns[3]);
				obj.entityid = currentPage[idx].getValue(myColumns[4]);
                arrResult.push(obj);
            }
        }
		return arrResult;
	}

	function convertNoneValue(text) {
		text = text?.replace("- None -", "") || "";
		return text;
	}

    return {
		ID: ID,
		TYPE: "salesorder",
		getDataSource: getDataSource
    };
    
});
