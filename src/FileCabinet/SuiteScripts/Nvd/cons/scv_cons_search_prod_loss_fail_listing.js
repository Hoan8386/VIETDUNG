/**
 * Nội dung:
 * =======================================================================================
 *  Date                Author                  Description
 *  14 Nov 2024			Phu Pham				Init. Create file
 */
define(['N/search'],
function(search) {
	const ID = "customsearch_scv_prod_loss_fail_listing";

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
                obj.op_sequence = currentPage[idx].getValue(myColumns[0]) * 1;
                obj.op_name = currentPage[idx].getValue(myColumns[1]);
                obj.loss_reason_id = currentPage[idx].getValue(myColumns[2]);
                obj.loss_reason_nm = currentPage[idx].getText(myColumns[2]);
                obj.loss_category_id = currentPage[idx].getValue(myColumns[3]);
                obj.loss_category_nm = currentPage[idx].getText(myColumns[3]);
                obj.pl_4m_reason_id = currentPage[idx].getValue(myColumns[4]);
                obj.pl_4m_reason_nm = currentPage[idx].getText(myColumns[4]);
                obj.time_stop = currentPage[idx].getValue(myColumns[5]) * 1;
                obj.shift_id = currentPage[idx].getValue(myColumns[6]);
                obj.shift_nm = currentPage[idx].getText(myColumns[6]);
                obj.work_center_id = currentPage[idx].getValue(myColumns[7]);
                obj.work_center_nm = currentPage[idx].getText(myColumns[7]);
                obj.date_recorded = currentPage[idx].getValue(myColumns[8]);
                obj.employee_id = currentPage[idx].getValue(myColumns[9]);
                obj.employee_nm = currentPage[idx].getText(myColumns[9]);
                obj.assembly_id = currentPage[idx].getValue(myColumns[10]);
                obj.assembly_nm = currentPage[idx].getText(myColumns[10]);
                obj.location_id = currentPage[idx].getValue(myColumns[11]);
                obj.location_nm = currentPage[idx].getText(myColumns[11]);
                obj.subsidiary_id = currentPage[idx].getValue(myColumns[12]);
                obj.subsidiary_nm = currentPage[idx].getText(myColumns[12]);
                obj.work_order_id = currentPage[idx].getValue(myColumns[13]);
                obj.work_order_nm = currentPage[idx].getText(myColumns[13]);
                obj.wo_completion_id = currentPage[idx].getValue(myColumns[14]);
                obj.wo_completion_nm = currentPage[idx].getText(myColumns[14]);
                obj.lot_no = currentPage[idx].getValue(myColumns[15]);
                obj.serial = currentPage[idx].getValue(myColumns[16]);
                arrResult.push(obj);
            }
        }
		return arrResult;
	}

    return {
		ID: ID,
		TYPE: "customrecord_scv_production_loss",
		getDataSource: getDataSource
    };
    
});
