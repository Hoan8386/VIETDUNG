/**
 * Nội dung:
 * =======================================================================================
 *  Date                Author                  Description
 *  17 Dec 2024			Phu Pham				Init. Create file
 */
define(['N/search'],
function(search) {
	const ID = "customsearch_scv_rate_htvc";

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
				obj.type = currentPage[idx].getValue(myColumns[0]);
				obj.chk_total_order = currentPage[idx].getValue(myColumns[1]);
				obj.subsidiary_id = currentPage[idx].getValue(myColumns[2]);
				obj.start_date = currentPage[idx].getValue(myColumns[3]);
				obj.end_date = currentPage[idx].getValue(myColumns[4]);
				obj.category_id = currentPage[idx].getValue(myColumns[5]);
				obj.category_nm = currentPage[idx].getText(myColumns[5]);
				obj.customer_id = currentPage[idx].getValue(myColumns[6]);
				obj.from_qty = currentPage[idx].getValue(myColumns[8]);
				obj.to_qty = currentPage[idx].getValue(myColumns[9]);
				obj.phi_amt = currentPage[idx].getValue(myColumns[10]) * 1;
				obj.phi_percent = currentPage[idx].getValue(myColumns[11]) || 0;
				// obj.line_id = currentPage[idx].getValue(myColumns[12]);
				obj.gia_tri_nhom = currentPage[idx].getValue(myColumns[13]);
				obj.sum_line_field = currentPage[idx].getValue(myColumns[14]);
				obj.header_field = currentPage[idx].getValue(myColumns[15]);
				obj.line_field = currentPage[idx].getValue(myColumns[16]);
				obj.so_sanh = currentPage[idx].getValue(myColumns[17]);
				obj.gia_tri_so_sanh = currentPage[idx].getValue(myColumns[18]);
				obj.vung_van_chuyen = currentPage[idx].getValue(myColumns[19]);
				obj.ship_method = currentPage[idx].getValue(myColumns[20]);
				obj.he_so_hotro = currentPage[idx].getValue(myColumns[21]) * 1;
				obj.chia_deu_gia_tri = currentPage[idx].getValue(myColumns[22]);
				obj.ht_he_so_quy_doi = currentPage[idx].getValue(myColumns[23]);
                arrResult.push(obj);
            }
        }
		return arrResult;
	}

    return {
		ID: ID,
		TYPE: "customrecord_scv_ht",
		getDataSource: getDataSource
    };
    
});
