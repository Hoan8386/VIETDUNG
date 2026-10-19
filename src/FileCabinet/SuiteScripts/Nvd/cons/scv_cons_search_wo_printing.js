/**
 * Nội dung:
 * =======================================================================================
 *  Date                Author                  Description
 *  18 Nov 2024			Khanh Tran				Init. Create file
 */
define(['N/search'],
function(search) {
	const ID = "customsearch_scv_work_order_printing";

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
                obj.wo_id =  currentPage[idx].id;
                obj.wo_name =  currentPage[idx].getValue(myColumns[3]);
                obj.so_source = currentPage[idx].getText(myColumns[4]);
                obj.assembly = currentPage[idx].getText(myColumns[5]);
                obj.prod_lot = currentPage[idx].getValue(myColumns[6]);
                obj.qc_serial = currentPage[idx].getValue(myColumns[7]);
                obj.work_center = currentPage[idx].getText(myColumns[8]);
                obj.qty = currentPage[idx].getValue(myColumns[9]) * 1;
                obj.units = currentPage[idx].getValue(myColumns[10]);
                obj.wo_type = currentPage[idx].getText(myColumns[11]);
                obj.order_type = currentPage[idx].getText(myColumns[12]);
                obj.date = currentPage[idx].getValue(myColumns[13]);
                obj.status = currentPage[idx].getValue(myColumns[16]);
                obj.subsidiary = currentPage[idx].getText(myColumns[18]);
                obj.memo_one = currentPage[idx].getValue(myColumns[19]);
                obj.memo_two = currentPage[idx].getValue(myColumns[20]);
                obj.tolerance_min_percent = currentPage[idx].getValue(myColumns[22]) || 0;
                obj.tolerance_max_percent = currentPage[idx].getValue(myColumns[23]) || 0;
                obj.supply_date  = currentPage[idx].getValue(myColumns[24]);
                obj.priority = currentPage[idx].getValue(myColumns[25]);
                obj.tolerance_min_quantity = currentPage[idx].getValue(myColumns[26]) || 0;
                obj.tolerance_max_quantity = currentPage[idx].getValue(myColumns[27]) || 0;
                obj.displayname = currentPage[idx].getValue(myColumns[28]);
                obj.so_tksx = currentPage[idx].getValue(myColumns[30]);
                obj.qty_da_sx = currentPage[idx].getValue(myColumns[31]) * 1;
                obj.qty_reamin = currentPage[idx].getValue(myColumns[32]) * 1;
                obj.nguoi_duyet = currentPage[idx].getValue(myColumns[33]);
                obj.thong_tin_in = currentPage[idx].getValue(myColumns[34]);
                obj.thoi_gian_phe_duyet = currentPage[idx].getValue(myColumns[35]);
                // thanhdev 6/6/2025
                obj.nguoi_kiem_soat = currentPage[idx].getValue(myColumns[36]);
                obj.thoi_gian_kiem_soat = currentPage[idx].getValue(myColumns[37]);
                obj.chieu_dai = currentPage[idx].getValue(myColumns[38]);
                obj.last_modified = currentPage[idx].getValue(myColumns[39]);
                obj.so_hdxk = currentPage[idx].getValue(myColumns[40]);
                // thanhdev end

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
