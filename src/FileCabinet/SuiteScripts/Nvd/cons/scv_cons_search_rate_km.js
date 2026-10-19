/**
 * Nội dung:
 * =======================================================================================
 *  Date                Author                  Description
 *  16 Dec 2024			Phu Pham				Init. Create file
 *  17 Dec 2024 		Phu Pham			    Đổi từ ss customsearch_scv_rate_km sang ss customsearch_scv_rate_promotion
 */
define(['N/search'],
function(search) {
	const ID = "customsearch_scv_rate_promotion";

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
				let item_id = currentPage[idx].getValue(myColumns[6]);
				let customer_group_id = currentPage[idx].getValue(myColumns[14]);

				obj.subsidiary_id = currentPage[idx].getValue(myColumns[0]);
				// obj.subsidiary_nm = currentPage[idx].getText(myColumns[0]);
				obj.start_date = currentPage[idx].getValue(myColumns[1]);
				obj.end_date = currentPage[idx].getValue(myColumns[2]);
				obj.customer_id = currentPage[idx].getValue(myColumns[3]);
				// obj.customer_nm = currentPage[idx].getText(myColumns[3]);
				obj.currency_id = currentPage[idx].getValue(myColumns[4]);
				// obj.currency_nm = currentPage[idx].getText(myColumns[4]);
				obj.class_id = currentPage[idx].getValue(myColumns[5]);
				obj.class_nm = currentPage[idx].getText(myColumns[5]);
				obj.item_id = !!item_id ? item_id.split(",") : [];
				obj.color_code_id = currentPage[idx].getValue(myColumns[7]);
				// obj.color_code_nm = currentPage[idx].getText(myColumns[7]);
				obj.do_day_nhom = currentPage[idx].getValue(myColumns[8]);
				obj.do_day_tam = currentPage[idx].getValue(myColumns[9]);
				obj.phim_bao_ve = currentPage[idx].getValue(myColumns[10]);
				obj.chieu_rong = currentPage[idx].getValue(myColumns[11]);
				obj.chieu_dai = currentPage[idx].getValue(myColumns[12]);
				obj.percent = (currentPage[idx].getValue(myColumns[13]) * 1);
				obj.customer_group_id = !!customer_group_id ? customer_group_id.split(",") : [];
				// obj.customer_group_nm = currentPage[idx].getText(myColumns[14]);
				obj.qc_he_tran = currentPage[idx].getValue(myColumns[15]);
				obj.buoc = currentPage[idx].getValue(myColumns[16]);
				obj.hoa_tiet_dot = currentPage[idx].getValue(myColumns[17]);
				obj.nhom_be_mat_son = currentPage[idx].getValue(myColumns[18]);
				obj.lop_son = currentPage[idx].getValue(myColumns[19]);
				obj.ghep_cuoi = currentPage[idx].getValue(myColumns[20]);
				obj.amount = currentPage[idx].getValue(myColumns[21]) * 1;
				obj.id = currentPage[idx].getValue(myColumns[22]);
				obj.detail_id = currentPage[idx].getValue(myColumns[23]);
				obj.han_muc = currentPage[idx].getValue(myColumns[24]) * 1;
				obj.check_gc = currentPage[idx].getValue(myColumns[25]);
				obj.chk_amt_x_heso = currentPage[idx].getValue(myColumns[26]);
                arrResult.push(obj);
            }
        }
		return arrResult;
	}

    return {
		ID: ID,
		TYPE: "customrecord_scv_spt",
		getDataSource: getDataSource
    };
    
});
