/**
 * Nội dung:
 * =======================================================================================
 *  Date                Author                  Description
 *  15 May 2025			Phu Pham				Init. Create file
 */
define(['N/search'],
function(search) {
	const ID = "customsearch_scv_item_demand_mfg_bom_rev";

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
				obj.name = currentPage[idx].getValue(myColumns[0]);
				obj.component_code = currentPage[idx].getValue(myColumns[1]);
				obj.component_name = currentPage[idx].getValue(myColumns[2]);
				obj.component_unit = currentPage[idx].getValue(myColumns[3]);
				obj.component_qty = currentPage[idx].getValue(myColumns[4]) * 1;
				obj.use_std_bom_qty = currentPage[idx].getValue(myColumns[5]);
				obj.item_source = currentPage[idx].getValue(myColumns[6]);
				obj.bom_id = currentPage[idx].getValue(myColumns[7]);
				obj.component_item_id = currentPage[idx].getValue(myColumns[8]);
				obj.component_item_nm = currentPage[idx].getText(myColumns[8]);
				obj.bill_material_nm = currentPage[idx].getValue(myColumns[9]);
				obj.item_type = currentPage[idx].getValue(myColumns[10]);
				obj.item_source_type = currentPage[idx].getValue(myColumns[11]) * 1;
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
