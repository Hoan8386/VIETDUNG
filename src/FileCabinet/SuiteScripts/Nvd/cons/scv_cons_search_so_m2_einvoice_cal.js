/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  10 Sep 2026         Phu Pham                Init & create file
 */
define([
	'N/search',
	'../cons/scv_cons_search.js'
],
function(
	search,
	constSearch
) {

	const ID = "customsearch_scv_so_m2_einvoice_cal";
	const TYPE = "salesorder";
	const Records = {

	};

	const getDataSource = (_params) => {
		const filters = createFilters(_params);
		// log.error("filters", filters);
		return constSearch.getDataSource(ID, filters, [], Records);
	}

	const createFilters = (_params) => {
		const myFilters = [];

		if(!!_params.internalid) {
			myFilters.push(search.createFilter({
				name: 'internalid', 
				operator: "anyof", 
				values: _params.internalid
			}));
		}
		return myFilters;
	}

    return {
		ID,
		TYPE,
		Records,
		getDataSource,
    };
    
});
