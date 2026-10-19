/**
 * Nội dung:
 * =======================================================================================
 *  Date                Author                  Description
 *  24 Apr 2025			Khanh Tran				Init. Create file
 */
define(['N/search'],
function(search) {
	const ID = "customsearch_scv_bp_intercompany";
	const TYPE = "customrecord_scv_inter_bp";
	const getDataSource = async (filters) =>{
		let resultSearch = await search.load.promise(ID);
		let myFilters = resultSearch.filters;
		let myColumns = resultSearch.columns;
		if(util.isArray(filters)){
			filters.forEach(_objFilter => myFilters.push(_objFilter));
		}
		else if(util.isObject(filters) || typeof(filters) == "object"){
			myFilters.push(filters)
		}
		
		resultSearch = await resultSearch.runPaged.promise({pageSize: 1000});
		let arrResult = [];
        for(let i = 0; i < resultSearch.pageRanges.length; i++){
            let currentPage = await resultSearch.fetch.promise({ index: i });
            currentPage = currentPage.data;
            for(let idx = 0; idx < currentPage.length; idx++){
                let obj = {};  
                obj.ipb_id = currentPage[idx].getValue(myColumns[0]);   
                obj.nhom_hang_hoa = currentPage[idx].getValue(myColumns[1]);   
                obj.ck_gia_ban_nb = currentPage[idx].getValue(myColumns[2]);
                obj.he_so_mua_ban_nb= currentPage[idx].getValue(myColumns[3]) * 1;
                arrResult.push(obj);
            }
        }
		return arrResult;
	}

    return {
		ID: ID,
		TYPE: TYPE,
		getDataSource: getDataSource
    };
    
});
