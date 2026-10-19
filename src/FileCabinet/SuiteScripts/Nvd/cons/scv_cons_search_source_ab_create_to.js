/**
 * Nội dung:
 * =======================================================================================
 *  Date                Author                  Description
 *  07 Jul 2025			Phu Pham				Init. Create file
 */
define(['N/search'],
function(search) {
	const ID = "customsearch_scv_source_ab_to_create_to";
    const TYPE = "assemblybuild";

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
                obj.location = currentPage[idx].getValue(myColumns[1]);
                obj.location_display = currentPage[idx].getText(myColumns[1]);
                obj.tranid = currentPage[idx].getValue(myColumns[2]);
                obj.trandate = currentPage[idx].getValue(myColumns[3]);
                obj.item = currentPage[idx].getValue(myColumns[4]);
                obj.item_display = currentPage[idx].getText(myColumns[4]);
                obj.quantityuom = currentPage[idx].getValue(myColumns[5]) * 1;
                obj.units = currentPage[idx].getValue(myColumns[19]);
                obj.units_display = currentPage[idx].getValue(myColumns[6]);
                obj.inv_number = currentPage[idx].getValue(myColumns[7]);
                obj.inv_number_display = currentPage[idx].getText(myColumns[7]);
                obj.inv_status = currentPage[idx].getValue(myColumns[8]);
                obj.inv_status_display = currentPage[idx].getText(myColumns[8]);
                obj.inv_quantity = currentPage[idx].getValue(myColumns[9]) * 1;
                obj.inv_lineid = currentPage[idx].getValue(myColumns[10]);
                obj.thong_ke_sx = currentPage[idx].getValue(myColumns[11]);
                obj.work_order_type = currentPage[idx].getValue(myColumns[12]);
                obj.work_order_type_display = currentPage[idx].getText(myColumns[12]);
                obj.workcenter = currentPage[idx].getValue(myColumns[13]);
                obj.workcenter_display = currentPage[idx].getText(myColumns[13]);
                obj.shift = currentPage[idx].getValue(myColumns[14]);
                obj.shift_display = currentPage[idx].getText(myColumns[14]);
                obj.mfg_date = currentPage[idx].getValue(myColumns[15]);
                obj.work_order = currentPage[idx].getValue(myColumns[18]);
                obj.work_order_display = currentPage[idx].getValue(myColumns[16]);
                obj.transferlocation = currentPage[idx].getValue(myColumns[17]);
                obj.line_key = currentPage[idx].getValue(myColumns[20]);
                arrResult.push(obj);
            }
        }
		return arrResult;
	}

    return {
		ID: ID,
		TYPE: TYPE,
		getDataSource: getDataSource
    };
    
});
