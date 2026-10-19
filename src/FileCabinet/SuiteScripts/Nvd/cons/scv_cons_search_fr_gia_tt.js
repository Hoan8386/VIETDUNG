/**
 * Nội dung:
 * =======================================================================================
 *  Date                Author                  Description
 *  13 Mar 2024			Phu Pham				Init. Create file
 */
define(['N/search'],
function(search) {
	const ID = "customsearch_scv_fr_gia_thanh_toan";

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
				obj.internalid = currentPage[idx].getValue(myColumns[4]);
				obj.tranid = currentPage[idx].getValue(myColumns[0]);
				obj.ori_line_id = currentPage[idx].getValue(myColumns[1]);
				obj.item_id = currentPage[idx].getValue(myColumns[2]);
				obj.item_nm = currentPage[idx].getText(myColumns[2]);
				obj.gia_thanh_toan = currentPage[idx].getValue(myColumns[3]) * 1;
				obj.amount_vat = currentPage[idx].getValue(myColumns[5]) * 1;
                arrResult.push(obj);
            }
        }
		return arrResult;
	}

	const getDataSourceById = (_internalId) => {
		if(!_internalId) return [];

        let myFilters = [
            search.createFilter({
                name: "internalid", operator: "anyof", values: _internalId
            })
        ];
        return getDataSource(myFilters);
    }

    return {
		ID: ID,
		TYPE: "salesorder",
		getDataSource: getDataSource,
		getDataSourceById: getDataSourceById,
    };
    
});
