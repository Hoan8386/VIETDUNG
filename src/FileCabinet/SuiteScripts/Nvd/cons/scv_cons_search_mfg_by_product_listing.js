/**
 * Nội dung:
 * =======================================================================================
 *  Date                Author                  Description
 *  14 Nov 2024			Phu Pham				Init. Create file
 */
define(['N/search', 'N/url', './scv_cons_color.js'],
function(search, url, constColor) {
	const ID = "customsearch_scv_mfg_by_product_listing";
    const TYPE = "customrecord_scv_by_product";

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
                let internalid = currentPage[idx].getValue(myColumns[9]);
                let obj = {
                    internalid: internalid,
                    hyperlink: createTagLink(internalid, internalid)
                };
                obj.item_id = currentPage[idx].getValue(myColumns[0]);
                obj.item_nm = currentPage[idx].getText(myColumns[0]);
                obj.quantity = currentPage[idx].getValue(myColumns[1]) * 1;
                obj.rate = currentPage[idx].getValue(myColumns[2]) * 1;
                obj.work_order_id = currentPage[idx].getValue(myColumns[3]);
                obj.work_order_nm = currentPage[idx].getText(myColumns[3]);
                obj.wo_completion_id = currentPage[idx].getValue(myColumns[4]);
                obj.wo_completion_nm = currentPage[idx].getText(myColumns[4]);
                obj.subsidiary_id = currentPage[idx].getValue(myColumns[5]);
                obj.subsidiary_nm = currentPage[idx].getText(myColumns[5]);
                obj.work_center_id = currentPage[idx].getValue(myColumns[6]);
                obj.work_center_nm = currentPage[idx].getText(myColumns[6]);
                obj.shift_id = currentPage[idx].getValue(myColumns[7]);
                obj.shift_nm = currentPage[idx].getText(myColumns[7]);
                obj.lot_no = currentPage[idx].getValue(myColumns[8]);
                obj.date = currentPage[idx].getValue(myColumns[10]);
                obj.location_id = currentPage[idx].getValue(myColumns[11]);
                obj.location_nm = currentPage[idx].getText(myColumns[11]);
                obj.thong_ke_sx = currentPage[idx].getValue(myColumns[12]);
                arrResult.push(obj);
            }
        }
		return arrResult;
	}

    const createTagLink = (internalid, tranid) => {
        let urlRec = url.resolveRecord({
            recordType: TYPE,
            recordId: internalid,
        });
        let html = `<div><span><a href="${urlRec}" target="_blank" style="color: ${constColor.BLUE[600]}">${tranid}</a>`;
        html += `</span></div>`;
        return html;
    }

    return {
		ID: ID,
		TYPE: TYPE,
		getDataSource: getDataSource
    };
    
});
