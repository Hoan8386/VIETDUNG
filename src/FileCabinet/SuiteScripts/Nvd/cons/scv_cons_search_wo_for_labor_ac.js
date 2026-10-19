/**
 * Nội dung:
 * =======================================================================================
 *  Date                Author                  Description
 *  14 Nov 2024			Phu Pham				Init. Create file
 */
define(['N/search', 'N/url', './scv_cons_color.js'],
function(search, url, constColor) {
	const ID = "customsearch_scv_wo_for_labor_ac";
    const TYPE = "workorder";

	const getDataSource = (params) =>{
		let resultSearch = search.load(ID);
		let myFilters = resultSearch.filters;
		let myColumns = resultSearch.columns;

        addFilter(myFilters, params);
		
		resultSearch = resultSearch.runPaged({pageSize: 1000});
		let arrResult = [];
        for(let i = 0; i < resultSearch.pageRanges.length; i++){
            let currentPage = resultSearch.fetch({index : i}).data;
            for(let idx = 0; idx < currentPage.length; idx++){
                let obj = {};
                obj.work_center_id = currentPage[idx].getValue(myColumns[0]);
                obj.work_center_nm = currentPage[idx].getText(myColumns[0]);
                obj.tranid = currentPage[idx].getValue(myColumns[1]);
                obj.item_id = currentPage[idx].getValue(myColumns[2]);
                obj.item_nm = currentPage[idx].getText(myColumns[2]);
                obj.lot_no = currentPage[idx].getValue(myColumns[3]);
                obj.thong_ke_sx = currentPage[idx].getValue(myColumns[4]);
                obj.qc_serial = currentPage[idx].getValue(myColumns[5]);
                obj.quantity = currentPage[idx].getValue(myColumns[6]) * 1;
                obj.trandate = currentPage[idx].getValue(myColumns[7]);
                obj.start_time = currentPage[idx].getValue(myColumns[8]);
                obj.end_time = currentPage[idx].getValue(myColumns[9]);
                obj.subsidiary_id = currentPage[idx].getValue(myColumns[10]);
                obj.subsidiary_nm = currentPage[idx].getText(myColumns[10]);
                obj.location_id = currentPage[idx].getValue(myColumns[11]);
                obj.location_nm = currentPage[idx].getText(myColumns[11]);
                obj.work_bench = currentPage[idx].getValue(myColumns[12]);
                obj.wo_completion = currentPage[idx].getValue(myColumns[13]);
                obj.internalid = currentPage[idx].getValue(myColumns[14]);

                obj.hyperlink = createTagLink(obj.internalid, obj.tranid);
                arrResult.push(obj);
            }
        }
		return arrResult;
	}

    const addFilter = (myFilters, params) => {
        if(!!params.custpage_subsidiary) {
            myFilters.push(search.createFilter({
                name: "subsidiary", 
                operator: "anyof", 
                values: params.custpage_subsidiary
            }));
        }

        if(!!params.custpage_shift) {
            myFilters.push(search.createFilter({
                name: "custrecord_scv_prd_labor_shift",
                join: "CUSTRECORD_SCV_PRD_LABOR_WO", 
                operator: "anyof", 
                values: params.custpage_shift
            }));
        }

        if(!!params.custpage_work_center) {
            myFilters.push(search.createFilter({
                name: "custbody_mfgmob_workcenter", 
                operator: "anyof", 
                values: params.custpage_work_center
            }));
        }

        if(!!params.custpage_location) {
            myFilters.push(search.createFilter({
                name: "location", 
                operator: "anyof", 
                values: params.custpage_location
            }));
        }

        if(!!params.custpage_sothongke) {
            let arrWoTKSX = params.custpage_sothongke.split(",");

            myFilters.push(search.createFilter({
                name: "formulatext", 
                formula: "case when {custbody_scv_so_thong_ke_sx} in ('"+ arrWoTKSX.join("','") +"') then 1 else 0 end",
                operator: "is", 
                values: "1"
            }));
        }

        if(!!params.custpage_fromdt) {
            myFilters.push(search.createFilter({
                name: "trandate",
                // join: "CUSTRECORD_SCV_PRD_LABOR_WO",
                operator: "onorafter",
                values: params.custpage_fromdt
            }));
        }

        if(!!params.custpage_todt) {
            myFilters.push(search.createFilter({
                name: "trandate",
                // join: "CUSTRECORD_SCV_PRD_LABOR_WO",
                operator: "onorbefore",
                values: params.custpage_todt
            }));
        }

        if(!!params.arrWoId) {
            myFilters.push(search.createFilter({
                name: "internalid",
                operator: "anyof",
                values: params.arrWoId.split(",")
            }));
        }

        if(!!params.arrLotNo) {
            let arrLotNo = params.arrLotNo.split(",");
            myFilters.push(search.createFilter({
                name: "formulatext",
                formula: "case when {custbody_scv_assembly_lot} in ('"+ arrLotNo.join("','") +"') or {custbody_scv_assembly_lot} is null then 1 else 0 end",
                operator: "is",
                values: "1"
            }));
        }
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
