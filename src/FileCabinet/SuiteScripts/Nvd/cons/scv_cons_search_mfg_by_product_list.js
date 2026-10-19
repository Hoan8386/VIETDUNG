/**
 * Nội dung:
 * =======================================================================================
 *  Date                Author                  Description
 *  05 Nov 2024			Phu Pham				Init. Create file
 */
define(['N/search'],
function(search) {
	const ID = "customsearch_scv_mfg_by_product_list";

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
                obj.internalid = currentPage[idx].getValue(myColumns[9]);
                obj.product_id = currentPage[idx].getValue(myColumns[0]);
                obj.product_nm = currentPage[idx].getText(myColumns[0]);
                obj.quantity = currentPage[idx].getValue(myColumns[1]) * 1;
                obj.rate = currentPage[idx].getValue(myColumns[2]) * 1;
                obj.work_order_id = currentPage[idx].getValue(myColumns[3]);
                obj.work_order_nm = currentPage[idx].getText(myColumns[3]);
                obj.work_order_comp_id = currentPage[idx].getValue(myColumns[4]);
                obj.work_order_comp_nm = currentPage[idx].getText(myColumns[4]);
                obj.subsidiary_id = currentPage[idx].getValue(myColumns[5]);
                obj.subsidiary_nm = currentPage[idx].getText(myColumns[5]);
                obj.work_center_id = currentPage[idx].getValue(myColumns[6]);
                obj.work_center_nm = currentPage[idx].getText(myColumns[6]);
                obj.shift_id = currentPage[idx].getValue(myColumns[7]);
                obj.shift_nm = currentPage[idx].getText(myColumns[7]);
                obj.lot_number = currentPage[idx].getValue(myColumns[8]);
                obj.product_date = currentPage[idx].getValue(myColumns[10]);
                obj.location_id = currentPage[idx].getValue(myColumns[11]);
                arrResult.push(obj);
            }
        }
		return arrResult;
	}

    return {
		ID: ID,
		TYPE: "customrecord_scv_by_product",
		getDataSource: getDataSource
    };
    
});
