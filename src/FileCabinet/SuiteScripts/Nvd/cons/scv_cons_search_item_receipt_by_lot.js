/**
 * Nội dung:
 * =======================================================================================
 *  Date                Author                  Description
 *  25 Nov 2024			Phu Pham				Init. Create file
 */
define(['N/search'],
function(search) {
	const ID = "customsearch_scv_item_receipt_by_lot";

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
				obj.trandate = currentPage[idx].getValue(myColumns[0]);
				obj.ir_header_id = currentPage[idx].getValue(myColumns[2]);
				obj.ir_line_id = currentPage[idx].getValue(myColumns[4]);
				obj.tranid = currentPage[idx].getValue(myColumns[5]);
				obj.item_id = currentPage[idx].getValue(myColumns[6]);
				obj.item_nm = currentPage[idx].getText(myColumns[6]);
				obj.location_id = currentPage[idx].getValue(myColumns[7]);
				obj.location_nm = currentPage[idx].getText(myColumns[7]);
				obj.binnumber = currentPage[idx].getValue(myColumns[16]);
				obj.item_num_id = currentPage[idx].getValue(myColumns[9]);
				obj.lot_num_qty = currentPage[idx].getValue(myColumns[10]) * 1;
				obj.lot_num = currentPage[idx].getValue(myColumns[11]);
				obj.wo_id = currentPage[idx].getValue(myColumns[12]);
				obj.wo_nm = currentPage[idx].getText(myColumns[12]);
				obj.work_center_id = currentPage[idx].getValue(myColumns[13]);
				obj.work_center_nm = currentPage[idx].getText(myColumns[13]);
				obj.mro_line_id = currentPage[idx].getValue(myColumns[15]);

				obj.inv_status_id = currentPage[idx].getValue(myColumns[17]);
				obj.inv_status_nm = currentPage[idx].getText(myColumns[17]);
				obj.inv_detail_num = currentPage[idx].getValue(myColumns[18]) * 1;
                arrResult.push(obj);
            }
        }
		return arrResult;
	}

	const getDataSourceByWorkOrder = (woId) => {
		if(!woId) return [];
		let myFilters = [
			search.createFilter({
                name: "custbody_scv_work_order_no", operator: "anyof", values: woId
            })
		];
		return getDataSource(myFilters);
	}

    return {
		ID: ID,
		TYPE: "itemreceipt",
		getDataSource: getDataSource,
		getDataSourceByWorkOrder: getDataSourceByWorkOrder
    };
    
});
