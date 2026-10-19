/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  12 Jun 2025         Huy Pham                Init & create file, Phát triển chức năng CCCL từ SO (Chứng chỉ chất lượng), from mr.NĐHuy(https://app.clickup.com/t/86cz8ug1w)
 */
define([
	'../cons/scv_cons_search.js'
],
function(
	constSearch
) {
	const ID = "customsearch_scv_so_cccl";
	const TYPE = "salesorder";

	const RECORDS = {}

	const getDataSource = (_filters) =>{
		return constSearch.getDataSource(ID, _filters);
	}

	const getDataSourceFetchPage = (_filters, _params) =>{
		return constSearch.getDataSourceFetchPage(ID, _filters, _params);
	}

    return {
		ID,
		TYPE,
		RECORDS,
		getDataSource,
		getDataSourceFetchPage
    };
    
});
