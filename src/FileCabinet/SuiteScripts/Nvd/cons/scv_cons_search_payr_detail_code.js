/**
 * Nội dung:
 * =======================================================================================
 *  Date                Author                  Description
 *  20 May 2025			Phu Pham				Init. Create file
 */
define(['N/search'],
	function(search) {
		const ID = "customsearchscv_payr_detail_code";
	
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
					obj.item_id = currentPage[idx].getValue(myColumns[0]);
					obj.item_nm = currentPage[idx].getText(myColumns[0]);
					obj.quantity = currentPage[idx].getValue(myColumns[1]) * 1;
					obj.po_id = currentPage[idx].getValue(myColumns[2]);
					obj.item_receipt_id = currentPage[idx].getValue(myColumns[3]);
					obj.ori_line_id = currentPage[idx].getValue(myColumns[4]);
					obj.line_order = currentPage[idx].getValue(myColumns[5]);
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
			TYPE: "customrecord_scv_payment_detail",
			getDataSource: getDataSource
		};
		
	});
	