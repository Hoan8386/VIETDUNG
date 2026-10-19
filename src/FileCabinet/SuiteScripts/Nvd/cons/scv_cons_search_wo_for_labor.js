/**
 * Nội dung:
 * =======================================================================================
 *  Date                Author                  Description
 *  03 Feb 2025			Phu Pham				Init. Create file
 */
define(['N/search', 'N/url', './scv_cons_color.js'],
function(search, url, constColor) {
	const ID = "customsearch_scv_wo_for_labor_record";
    const TYPE = "workorder";

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
                let obj = { };

                obj.internalid = currentPage[idx].id;
                obj.prod_labor_date = currentPage[idx].getValue(myColumns[0]);
                obj.shift_id = currentPage[idx].getValue(myColumns[1]);
                obj.shift_nm = currentPage[idx].getText(myColumns[1]);
                obj.work_center_id = currentPage[idx].getValue(myColumns[2]);
                obj.work_center_nm = currentPage[idx].getText(myColumns[2]);
                obj.tranid = currentPage[idx].getValue(myColumns[3]);
                obj.item_id = currentPage[idx].getValue(myColumns[4]);
                obj.item_nm = currentPage[idx].getText(myColumns[4]);
                obj.lot_no = currentPage[idx].getValue(myColumns[5]);
                obj.labor_emp_id = currentPage[idx].getValue(myColumns[6]);
                obj.labor_emp_nm = currentPage[idx].getText(myColumns[6]);
                obj.labor_title_id = currentPage[idx].getValue(myColumns[7]);
                obj.labor_title_nm = currentPage[idx].getText(myColumns[7]);
                obj.start_time = currentPage[idx].getValue(myColumns[8]);
                obj.end_time = currentPage[idx].getValue(myColumns[9]);
                obj.time_minutes = currentPage[idx].getValue(myColumns[10]) * 1;
                obj.op_sequence = currentPage[idx].getValue(myColumns[11]);
                obj.op_name = currentPage[idx].getText(myColumns[11]);
                obj.qty_completed = currentPage[idx].getValue(myColumns[12]) * 1;
                obj.labor_note = currentPage[idx].getValue(myColumns[13]);
                obj.quantity = currentPage[idx].getValue(myColumns[14]) * 1;
                obj.trandate = currentPage[idx].getValue(myColumns[15]);
                obj.location_id = currentPage[idx].getValue(myColumns[20]);
                obj.location_nm = currentPage[idx].getText(myColumns[20]);
                obj.subsidiary_id = currentPage[idx].getValue(myColumns[19]);
                obj.subsidiary_nm = currentPage[idx].getText(myColumns[19]);
                obj.qc_serial = currentPage[idx].getValue(myColumns[24]);
                obj.wo_completion = currentPage[idx].getValue(myColumns[24]);
                obj.prod_labor_id = currentPage[idx].getValue(myColumns[25]);
                obj.hyperlink = createTagLink(obj.internalid, obj.tranid);
                obj.thong_ke_sx = currentPage[idx].getValue(myColumns[26]);
                obj.labor_emp1_id = currentPage[idx].getValue(myColumns[27]);
                obj.labor_emp1_nm = currentPage[idx].getText(myColumns[27]);
                obj.labor_emp2_id = currentPage[idx].getValue(myColumns[28]);
                obj.labor_emp2_nm = currentPage[idx].getText(myColumns[28]);
                obj.labor_emp3_id = currentPage[idx].getValue(myColumns[29]);
                obj.labor_emp3_nm = currentPage[idx].getText(myColumns[29]);
                obj.labor_emp4_id = currentPage[idx].getValue(myColumns[30]);
                obj.labor_emp4_nm = currentPage[idx].getText(myColumns[30]);

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
