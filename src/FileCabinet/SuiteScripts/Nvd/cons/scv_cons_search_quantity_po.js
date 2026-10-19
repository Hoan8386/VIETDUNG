/**
 * Nội dung:
 * =======================================================================================
 *  Date                Author                  Description
 *  10 Dec 2024			Phu Pham				Init. Create file
 */
define(['N/search'],
	function(search) {
		const ID = "customsearch_scv_quantity_po";
	
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
					// log.error("res", currentPage[idx]);
					obj.id = currentPage[idx].getValue(myColumns[26]);
					obj.vendor_id = currentPage[idx].getValue(myColumns[14]);
					obj.vendor_nm = currentPage[idx].getValue(myColumns[0]);
					obj.tranid = currentPage[idx].getValue(myColumns[1]);
					obj.trandate = currentPage[idx].getValue(myColumns[2]);
					obj.item_id = currentPage[idx].getValue(myColumns[3]);
					obj.item_nm = currentPage[idx].getText(myColumns[3]);
					obj.quantity = currentPage[idx].getValue(myColumns[4]) * 1;
					obj.qty_shiprecv = currentPage[idx].getValue(myColumns[5]) * 1;
					obj.qty_billded = currentPage[idx].getValue(myColumns[6]) * 1;
					obj.units_id = currentPage[idx].getValue(myColumns[15]);
					obj.units_nm = currentPage[idx].getText(myColumns[7]);
					obj.rate = currentPage[idx].getValue(myColumns[8]) * 1;
					obj.amount = currentPage[idx].getValue(myColumns[9]) * 1;
					obj.tax_amount = currentPage[idx].getValue(myColumns[10]) * 1;
					obj.gross_amount = currentPage[idx].getValue(myColumns[11]) * 1;
					obj.ori_line_id = currentPage[idx].getValue(myColumns[12]);
					obj.tax_item_id = currentPage[idx].getValue(myColumns[13]);
					obj.tax_item_nm = currentPage[idx].getText(myColumns[13]);
					obj.currency_id = currentPage[idx].getValue(myColumns[16]);
					obj.currency_nm = currentPage[idx].getText(myColumns[16]);
					obj.exchange_rate = currentPage[idx].getValue(myColumns[17]) * 1;
					obj.memo = currentPage[idx].getValue(myColumns[18]);
					obj.tax_rate = currentPage[idx].getValue(myColumns[19]);
					obj.line_id = currentPage[idx].getValue(myColumns[20]);
					obj.item_receipt_id = currentPage[idx].getValue(myColumns[23]);
					obj.item_receipt_nm = currentPage[idx].getValue(myColumns[22]);
					obj.sl_tra_hang = currentPage[idx].getValue(myColumns[24]) * 1;
					obj.inspect_started = currentPage[idx].getValue(myColumns[25]) === 'T' ? true : false;
					obj.ngay_nhap_kho = currentPage[idx].getValue(myColumns[27]);
					obj.po_properties = convertNoneValue(currentPage[idx].getValue(myColumns[28]));

					obj.dvt_mua_id = currentPage[idx].getValue(myColumns[29]);
					obj.dvt_mua_nm = convertNoneValue(currentPage[idx].getText(myColumns[29]));
					obj.dvt_qty = currentPage[idx].getValue(myColumns[30]) * 1;
					obj.dvt_rate = currentPage[idx].getValue(myColumns[31]) * 1;
					obj.dvt_amount = currentPage[idx].getValue(myColumns[32]) * 1;
					obj.trang_thai_phe_duyet = currentPage[idx].getValue(myColumns[33]);
					obj.related_asset_id = currentPage[idx].getValue(myColumns[34]);
					obj.related_asset_nm = convertNoneValue(currentPage[idx].getText(myColumns[34]));
					obj.emp_remaining_amt = currentPage[idx].getValue(myColumns[35]) * 1;
					obj.kmcp_id = currentPage[idx].getValue(myColumns[36]);
					obj.kmcp_nm = convertNoneValue(currentPage[idx].getText(myColumns[36]));
					obj.emp_prepayment = currentPage[idx].getValue(myColumns[37]);
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
			TYPE: "purchaseorder",
			getDataSource: getDataSource
		};
		
	});
	