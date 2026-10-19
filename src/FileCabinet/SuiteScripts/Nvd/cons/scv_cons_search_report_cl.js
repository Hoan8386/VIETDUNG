/**
 * Nội dung:
 * =======================================================================================
 *  Date                Author                  Description
 *  26 Jun 2025			Phu Pham				Init. Create file
 */
define(['N/search'],
function(search) {
	const ID = "customsearch_scv_report_cl";

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
				obj.subsidiary = currentPage[idx].getValue(myColumns[0]);
				obj.subsidiary_display = currentPage[idx].getText(myColumns[0]);
				obj.receipt_date = currentPage[idx].getValue(myColumns[1]);
				obj.item = currentPage[idx].getValue(myColumns[2]);
				obj.item_display = currentPage[idx].getValue(myColumns[4]);
				obj.item_upccode = currentPage[idx].getValue(myColumns[3]);
				obj.tsl_a = currentPage[idx].getValue(myColumns[5]) * 1;
				obj.qty_quy_doi = currentPage[idx].getValue(myColumns[6]) * 1;
				obj.employee = currentPage[idx].getValue(myColumns[7]);
				obj.employee_display = currentPage[idx].getText(myColumns[7])?.replace(",", ", ");
				obj.he_so = currentPage[idx].getValue(myColumns[8]) * 1;
				obj.has_error = currentPage[idx].getValue(myColumns[9]);
				obj.has_qty_a = currentPage[idx].getValue(myColumns[10]);
                arrResult.push(obj);
            }
        }
		return arrResult;
	}

    return {
		ID: ID,
		TYPE: "customrecord_scv_insp_lot",
		getDataSource: getDataSource
    };
    
});
