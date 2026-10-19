/**
 * Nội dung:
 * =======================================================================================
 *  Date                Author                  Description
 *  16 Dec 2024			Phu Pham				Init. Create file
 */
define(['N/search'],
function(search) {
	const ID = "customsearch_scv_rate_pa";

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
				let class_id = currentPage[idx].getValue(myColumns[5]);
				// obj.internalid = currentPage[idx].id;
				obj.subsidiary_id = currentPage[idx].getValue(myColumns[0]);
				obj.subsidiary_nm = currentPage[idx].getText(myColumns[0]);
				obj.start_date = currentPage[idx].getValue(myColumns[1]);
				obj.end_date = currentPage[idx].getValue(myColumns[2]);
				obj.customer_id = currentPage[idx].getValue(myColumns[3]);
				obj.customer_nm = currentPage[idx].getText(myColumns[3]);
				obj.currency_id = currentPage[idx].getValue(myColumns[4]);
				obj.currency_nm = currentPage[idx].getText(myColumns[4]);
				obj.class_id = !!class_id ? class_id.split(",") : [];
				// obj.class_nm = currentPage[idx].getText(myColumns[5]);
				obj.chiet_khau_vat = (currentPage[idx].getValue(myColumns[6]) * 1);
				obj.chiet_khau_no_vat = (currentPage[idx].getValue(myColumns[7]) * 1);

				obj.color_code_id = currentPage[idx].getValue(myColumns[8]);
				obj.do_day_nhom = currentPage[idx].getValue(myColumns[9]);
				obj.do_day_tam = currentPage[idx].getValue(myColumns[10]);
				obj.phim_bao_ve = currentPage[idx].getValue(myColumns[11]);
				obj.chieu_rong = currentPage[idx].getValue(myColumns[12]);
				obj.chieu_dai = currentPage[idx].getValue(myColumns[13]);
				obj.buoc = currentPage[idx].getValue(myColumns[14]);
				obj.hoa_tiet_dot = currentPage[idx].getValue(myColumns[15]);
				obj.nhom_be_mat_son = currentPage[idx].getValue(myColumns[16]);
				obj.lop_son = currentPage[idx].getValue(myColumns[17]);
				obj.ghep_cuoi = convertNoneValue(currentPage[idx].getValue(myColumns[18]));
                arrResult.push(obj);
            }
        }
		return arrResult;
	}

	function convertNoneValue(text) {
		text = text?.replace("- None -", "") || "";
		return text;
	}

    return {
		ID: ID,
		TYPE: "customrecord_scv_st",
		getDataSource: getDataSource
    };
    
});
