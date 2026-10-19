/**
 * Nội dung:
 * =======================================================================================
 *  Date                Author                  Description
 *  19 Nov 2024			Khanh Tran				Init. Create file
 */
define(['N/search'],
function(search) {
	const ID = "customsearch_scv_bp_items";

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
                obj.item = currentPage[idx].getValue(myColumns[1]);   
                obj.ma_mau = currentPage[idx].getValue(myColumns[4]);
                obj.key_mapping = currentPage[idx].getValue(myColumns[5]);
                obj.nhom_hang = currentPage[idx].getValue(myColumns[11]);
                obj.item_type = currentPage[idx].getText(myColumns[12]);
                obj.quy_tac_ss = currentPage[idx].getValue(myColumns[13]);
				obj.MM_DDN_DDT_PBV = currentPage[idx].getValue(myColumns[14]);
				obj.MM_DDN_DDT_CR_CD = currentPage[idx].getValue(myColumns[15]);
				obj.MM_DDN_DDT = currentPage[idx].getValue(myColumns[16]);
				obj.DDN_CR_CD = currentPage[idx].getValue(myColumns[17]);
				obj.MM_DDN = currentPage[idx].getValue(myColumns[18]);
				obj.MM_DDN_CR_CD = currentPage[idx].getValue(myColumns[19]);
				obj.MM_DDN_CR = currentPage[idx].getValue(myColumns[20]);
				obj.MM_DDN_QCHT = currentPage[idx].getValue(myColumns[21]);
				obj.MM_DDN_CD_QCHT = currentPage[idx].getValue(myColumns[22]);
				obj.MM_DDN_CD_B_DDT_CR = currentPage[idx].getValue(myColumns[23]);
				obj.MM_DDN_CR_HTD = currentPage[idx].getValue(myColumns[24]);
				obj.MM_DDN_CR_DDT = currentPage[idx].getValue(myColumns[25]);
				obj.MM_DDN_CD = currentPage[idx].getValue(myColumns[26]);
				obj.MM_DDN_HTD = currentPage[idx].getValue(myColumns[27]);
                arrResult.push(obj);
            }
        }
		return arrResult;
	}

    return {
		ID: ID,
		TYPE: "item",
		getDataSource: getDataSource
    };
    
});
