/**
 * Nội dung:
 * =======================================================================================
 *  Date                Author                  Description
 *  14 Nov 2024			Phu Pham				Init. Create file
 */
define(['N/search', 'N/url', './scv_cons_color.js'],
function(search, url, constColor) {
	const ID = "customsearch_scv_production_labor";
    const TYPE = "customrecord_scv_prd_labor";

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
                obj.hyperlink = createTagLink(obj.internalid, obj.internalid);
                obj.date = currentPage[idx].getValue(myColumns[0]);
                obj.employee_id = currentPage[idx].getValue(myColumns[1]);
                obj.employee_nm = currentPage[idx].getText(myColumns[1]);
                obj.time_minutes = currentPage[idx].getValue(myColumns[2]) * 1;
                obj.job_title_id = currentPage[idx].getValue(myColumns[3]);
                obj.job_title_nm = currentPage[idx].getText(myColumns[3]);
                obj.shift_id = currentPage[idx].getValue(myColumns[4]);
                obj.shift_nm = currentPage[idx].getText(myColumns[4]);
                obj.work_center_id = currentPage[idx].getValue(myColumns[5]);
                obj.work_center_nm = currentPage[idx].getText(myColumns[5]);
                obj.op_sequence = currentPage[idx].getValue(myColumns[6]);
                obj.op_name = currentPage[idx].getValue(myColumns[7]);
                obj.start_time = currentPage[idx].getValue(myColumns[8]);
                obj.end_time = currentPage[idx].getValue(myColumns[9]);
                obj.location_id = currentPage[idx].getValue(myColumns[10]);
                obj.location_nm = currentPage[idx].getText(myColumns[10]);
                obj.subsidiary_id = currentPage[idx].getValue(myColumns[11]);
                obj.subsidiary_nm = currentPage[idx].getText(myColumns[11]);
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
