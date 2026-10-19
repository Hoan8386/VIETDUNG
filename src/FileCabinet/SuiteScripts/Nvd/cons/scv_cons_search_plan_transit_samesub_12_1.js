/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  20 Aug 2025         Huy Pham                Init & create file, from mr.Lương Phúc (https://app.clickup.com/t/86cx7mw5a?comment=90160129494878)
 */
define([
	'../cons/scv_cons_search.js'
],
function(
	constSearch
) {
	const ID = "customsearch_scv_plan_transit_samesub";
	const TYPE = "transaction";

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
