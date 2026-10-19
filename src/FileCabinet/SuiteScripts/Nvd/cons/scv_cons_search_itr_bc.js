/**
 * Nội dung:
 * =======================================================================================
 *  Date                Author                  Description
 *  10 Dec 2024			Phu Pham				Init. Create file
 */
define(['N/search'],
	function(search) {
		const ID = "customsearch_scv_itr_bc";
	
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
					obj.subsidiary_id = currentPage[idx].getValue(myColumns[0]);
					obj.subsidiary_nm = currentPage[idx].getText(myColumns[0]);
					obj.created_trans_id = currentPage[idx].getValue(myColumns[6]);
					obj.created_trans_nm = currentPage[idx].getValue(myColumns[1]);
					obj.related_trans_id = currentPage[idx].getValue(myColumns[7]);
					obj.related_trans_nm = currentPage[idx].getValue(myColumns[2]);
					obj.item_id = currentPage[idx].getValue(myColumns[3]);
					obj.item_nm = currentPage[idx].getText(myColumns[3]);
					obj.ori_line_id = currentPage[idx].getValue(myColumns[4]);
					obj.quantity = currentPage[idx].getValue(myColumns[5]) * 1;
					// obj.lot_number_id = currentPage[idx].getValue(myColumns[6]);
					// obj.lot_number_nm = currentPage[idx].getText(myColumns[6]);
					// obj.bin_number_id = currentPage[idx].getValue(myColumns[7]);
					// obj.bin_number_nm = currentPage[idx].getText(myColumns[7]);
					obj.item_receipt_id = currentPage[idx].getValue(myColumns[6]);
					obj.po_id = currentPage[idx].getValue(myColumns[7]);
					arrResult.push(obj);
				}
			}
			return arrResult;
		}
	
		return {
			ID: ID,
			TYPE: "inventorystatuschange",
			getDataSource: getDataSource
		};
		
	});
	