/**
 * Nội dung:
 * =======================================================================================
 *  Date                Author                  Description
 *  18 Nov 2024			Khanh Tran				Init. Create file
 */
define(['N/search'],
function(search) {
	const ID = "customsearch_scv_work_order_printing_d";

	const getDataSource = (filters) =>{
		let resultSearch = search.load(ID);
		let myFilters = resultSearch.filters;
		let myColumns = resultSearch.columns;

		if(util.isArray(filters)){
			filters.forEach(_objFilter => myFilters.push(_objFilter));
		}
		else if(util.isObject(filters) || typeof(filters) == "object"){
			myFilters.push(filters)
		}
		
		resultSearch = resultSearch.runPaged({pageSize: 1000});
		let arrResult = [];
        for(let i = 0; i < resultSearch.pageRanges.length; i++){
            let currentPage = resultSearch.fetch({index : i}).data;
            for(let idx = 0; idx < currentPage.length; idx++){
                let obj = {};
                obj.wo_id = currentPage[idx].id;
                obj.wo_name =  currentPage[idx].getValue(myColumns[3]);
                obj.so_source = currentPage[idx].getText(myColumns[4]);
                obj.item = currentPage[idx].getText(myColumns[5]);
                obj.prod_lot = currentPage[idx].getValue(myColumns[6]);
                obj.qc_serial = currentPage[idx].getValue(myColumns[7]);
                obj.work_center = currentPage[idx].getValue(myColumns[8]);
                obj.qty = currentPage[idx].getValue(myColumns[9]) * 1;
                obj.units = currentPage[idx].getValue(myColumns[10]);
                obj.wo_type = currentPage[idx].getText(myColumns[11]);
                obj.date = currentPage[idx].getValue(myColumns[13]);
                obj.status = currentPage[idx].getText(myColumns[16]);
                obj.subsidiary = currentPage[idx].getText(myColumns[18]);
                obj.displayname = currentPage[idx].getValue(myColumns[20]);
                obj.so_tksx = currentPage[idx].getValue(myColumns[22]);
                obj.lot = currentPage[idx].getValue(myColumns[23]);
                obj.thoi_gian_phe_duyet = currentPage[idx].getValue(myColumns[24]);
                obj.lot_status = currentPage[idx].getValue(myColumns[25]);
                arrResult.push(obj);
            }
        }
		return arrResult;
	}

    return {
		ID: ID,
		TYPE: "workorder",
		getDataSource: getDataSource
    };
    
});
