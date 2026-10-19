/**
 * Nội dung:
 * =======================================================================================
 *  Date                Author                  Description
 *  04 Dec 2024			Phu Pham				Init. Create file
 */
define(['N/search'],
function(search) {
	const ID = "customsearch_scv_rate_phi";

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
				obj.internalid = currentPage[idx].getValue(myColumns[1]);
                obj.name = currentPage[idx].getValue(myColumns[0]);
				obj.phan_loai_id = currentPage[idx].getValue(myColumns[2]);
				obj.phan_loai_nm = currentPage[idx].getText(myColumns[2]);
				obj.chk_total_order = currentPage[idx].getValue(myColumns[4]);
				obj.subsidiary_id = currentPage[idx].getValue(myColumns[5]);
				obj.subsidiary_nm = currentPage[idx].getText(myColumns[5]);
				obj.start_date = currentPage[idx].getValue(myColumns[6]);
				obj.end_date = currentPage[idx].getValue(myColumns[7]);
				obj.category_id = currentPage[idx].getValue(myColumns[8]);
				obj.category_nm = currentPage[idx].getText(myColumns[8]);
				obj.from_qty = currentPage[idx].getValue(myColumns[10]);
				obj.to_qty = currentPage[idx].getValue(myColumns[11]);
				obj.phi_amt = currentPage[idx].getValue(myColumns[12]) * 1;
				obj.phi_percent = currentPage[idx].getValue(myColumns[13]) || 0;
				// obj.line_id = currentPage[idx].getValue(myColumns[14]);
				// obj.cach_tinh_id = currentPage[idx].getValue(myColumns[15]);
				// obj.cach_tinh_nm = currentPage[idx].getText(myColumns[15]);
				obj.gia_tri_nhom = currentPage[idx].getValue(myColumns[17]);
				obj.sum_line_field = currentPage[idx].getValue(myColumns[18]);
				obj.header_field = currentPage[idx].getValue(myColumns[19]);
				obj.line_field = currentPage[idx].getValue(myColumns[20]);
				obj.so_sanh = currentPage[idx].getValue(myColumns[21]);
				obj.gia_tri_so_sanh = currentPage[idx].getValue(myColumns[22]);
                arrResult.push(obj);
            }
        }
		return arrResult;
	}

    return {
		ID: ID,
		TYPE: "customrecord_scv_phi",
		getDataSource: getDataSource
    };
    
});
