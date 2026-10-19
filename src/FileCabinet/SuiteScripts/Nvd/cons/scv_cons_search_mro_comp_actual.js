/**
 * Nội dung:
 * =======================================================================================
 *  Date                Author                  Description
 *  27 Jun 2025			Phu Pham				Init. Create file
 */
define(['N/search'],
function(search) {
	const ID = "customsearch_scv_mro_comp_actual_consump";

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
				obj.mro_related = currentPage[idx].getValue(myColumns[0]);
				obj.mro_related_display = currentPage[idx].getText(myColumns[0]);
				obj.item = currentPage[idx].getValue(myColumns[1]);
				obj.item_display = currentPage[idx].getText(myColumns[1]);
				obj.units = currentPage[idx].getValue(myColumns[2]);
				obj.units_display = currentPage[idx].getText(myColumns[2]);
				obj.quantityuom = currentPage[idx].getValue(myColumns[3]) * 1;
				obj.wo_display = currentPage[idx].getValue(myColumns[4]);
                arrResult.push(obj);
            }
        }
		return arrResult;
	}

    return {
		ID: ID,
		TYPE: "inventoryadjustment",
		getDataSource: getDataSource
    };
    
});
