/**
 * Nội dung:
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  04 Sep 2026         Phu Pham			    Init, create file.
 */
define([
    "N/search",
    "../cons/scv_cons_search.js"
], function (
    search,
    constSearch
) {
    const TYPE = "workorder";
    const ID = "customsearch_scv_search_list_wo_tksx";

    const RECORDS = {};

    const getDataSource = (_params) => {
        let filters = createFiltersFromParams(_params);

        return constSearch.getDataSource_Mixed(ID, filters, [], RECORDS, (_objTmpl, _column) => {
            let objResTmpl = constSearch.getObjResultFromSearchByKey(_objTmpl, _column, [
                "name"
            ]);

            objResTmpl.id = objResTmpl.name;
            return objResTmpl;
        });
    };

    const createFiltersFromParams = (_params) => {
        const filters = [];

        if (!!_params.custpage_subsidiary) {
			filters.push(search.createFilter({
                name: 'subsidiary',
                operator: 'anyof',
                values: _params.custpage_subsidiary
            }))
		}

        if (!!_params.custpage_location) {
			filters.push(search.createFilter({
                name: 'location',
                operator: 'anyof',
                values: _params.custpage_location
            }))
		}

        return filters;
    }

    return {
        ID,
        TYPE,
        RECORDS,
        getDataSource,
    };
});
