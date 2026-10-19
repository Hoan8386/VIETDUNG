/**
 * Nội dung:
 * =======================================================================================
 *  Date                Author                  Description
 *  25 Nov 2024			Phu Pham				Init. Create file
 */
define(['N/search'],
function(search) {
	const ID = "customsearch_scv_mro_comp_usage";

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
				obj.name = currentPage[idx].getValue(myColumns[6]);
                obj.component_id = currentPage[idx].getValue(myColumns[0]);
				obj.component_nm = currentPage[idx].getText(myColumns[0]);
				obj.quantity = currentPage[idx].getValue(myColumns[1]) * 1;
				obj.units_id = currentPage[idx].getValue(myColumns[2]);
				obj.units_nm = currentPage[idx].getText(myColumns[2]);
				obj.used_qty = currentPage[idx].getValue(myColumns[3]) * 1;
				obj.wo_id = currentPage[idx].getValue(myColumns[4]);
				obj.wo_nm = currentPage[idx].getText(myColumns[4]);
				obj.subsidiary_id = currentPage[idx].getValue(myColumns[5]);
				obj.subsidiary_nm = currentPage[idx].getText(myColumns[5]);
				obj.name = currentPage[idx].getValue(myColumns[6]);
				obj.mro_usage_type = currentPage[idx].getValue(myColumns[7]);
				obj.prod_cost_group = currentPage[idx].getValue(myColumns[8]);
                arrResult.push(obj);
            }
        }
		return arrResult;
	}

	const getDataSourceByWorkOrder = (woId) => {
		if(!woId) return [];
		let myFilters = [
			search.createFilter({
                name: "custrecord_scv_mro_usage_wo", operator: "anyof", values: woId
            })
		];
		return getDataSource(myFilters);
	}

    return {
		ID: ID,
		TYPE: "customrecord_scv_mro_component_usage",
		getDataSource: getDataSource,
		getDataSourceByWorkOrder: getDataSourceByWorkOrder
    };
    
});
