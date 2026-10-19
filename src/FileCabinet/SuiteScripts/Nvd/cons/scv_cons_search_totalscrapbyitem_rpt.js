/**
 * Nội dung:
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  03 Nov 2025         Khanh Tran			    Init, create file. Báo cáo tiêu hao sản xuất, form mr.Phúc(https://app.clickup.com/t/86d02hr1u)
 */
define(['N/search',
	'../cons/scv_cons_search.js'
],
function(search,
	constSearch
) {
	const ID = "customsearch_scv_totalscrapbyitem_rpt";
	const TYPE = "transaction";

	const RECORDS = {
		"type": TYPE,
		"title": "SCV Total Phế phẩm by Item - BC tiêu hao (don't edit)",
		"id": ID,
		"isPublic": true,
		"filters": [
			[[["type","anyof","WorkOrd"],"AND",["custrecord_scv_by_product_wo.internalid","noneof","@NONE@"],"AND",["custrecord_scv_by_product_wo.custrecord_scv_by_product_wo_completion","anyof","@NONE@"],"AND",["formulanumeric: case when INSTR({custrecord_scv_by_product_wo.custrecord_scv_by_prod_item}, 'VTH.SX.NT') > 0 or INSTR({custrecord_scv_by_product_wo.custrecord_scv_by_prod_item}, 'VTH.SX.PP.TPP') > 0 then 1 else 0 end","equalto","1"]],"OR",[["type","anyof","Build"],"AND",["custrecord_scv_by_product_wo_completion.internalid","noneof","@NONE@"],"AND",["formulanumeric: case when INSTR({custrecord_scv_by_product_wo_completion.custrecord_scv_by_prod_item}, 'VTH.SX.NT') > 0 or INSTR({custrecord_scv_by_product_wo_completion.custrecord_scv_by_prod_item}, 'VTH.SX.PP.TPP') > 0 then 1 else 0 end","equalto","1"]]], 
			"AND", 
			["mainline","is","F"], 
			"AND", 
			["customgl","is","F"], 
			"AND", 
			["item.type","anyof","Assembly","InvtPart"], 
			"AND", 
			["item.custitem_scv_group_lv2","noneof","55"]
		],
		"columns": [
			search.createColumn({
				name: "item",
				summary: "GROUP",
				label: "Item Name"
			}),
			search.createColumn({
				name: "name",
				join: "bomRevision",
				summary: "GROUP",
				label: "BOM Revision"
			}),
			search.createColumn({
				name: "formulanumeric",
				summary: "SUM",
				formula: "case when INSTR({custrecord_scv_by_product_wo.custrecord_scv_by_prod_item}, 'VTH.SX.PP.TPP') > 0 then {custrecord_scv_by_product_wo.custrecord_scv_by_product_qty} when INSTR({custrecord_scv_by_product_wo_completion.custrecord_scv_by_prod_item}, 'VTH.SX.PP.TPP') > 0 then {custrecord_scv_by_product_wo_completion.custrecord_scv_by_product_qty} else 0 end",
				label: "Phe pham (Kg)"
			}),
			search.createColumn({
				name: "formulanumeric",
				summary: "SUM",
				formula: "ROUND((case when INSTR({custrecord_scv_by_product_wo.custrecord_scv_by_prod_item}, 'VTH.SX.PP.TPP') > 0 then {custrecord_scv_by_product_wo.custrecord_scv_by_product_qty} when INSTR({custrecord_scv_by_product_wo_completion.custrecord_scv_by_prod_item}, 'VTH.SX.PP.TPP') > 0 then {custrecord_scv_by_product_wo_completion.custrecord_scv_by_product_qty} else 0 end) / NULLIF({custbody_scv_wo_assembly.custitem_scv_kl_vtc}, 0), 4)",
				label: "Phe pham (Tam)"
			}),
			search.createColumn({
				name: "formulanumeric",
				summary: "SUM",
				formula: "ROUND(((case when INSTR({custrecord_scv_by_product_wo.custrecord_scv_by_prod_item}, 'VTH.SX.PP.TPP') > 0 then {custrecord_scv_by_product_wo.custrecord_scv_by_product_qty} when INSTR({custrecord_scv_by_product_wo_completion.custrecord_scv_by_prod_item}, 'VTH.SX.PP.TPP') > 0 then {custrecord_scv_by_product_wo_completion.custrecord_scv_by_product_qty} else 0 end) / NULLIF({custbody_scv_wo_assembly.custitem_scv_kl_vtc}, 0)) * {custbody_scv_unit_conversion_rate}, 4)",
				label: "Phe pham quy doi (Tam)"
			}),
			search.createColumn({
				name: "formulanumeric",
				summary: "SUM",
				formula: "case when INSTR({custrecord_scv_by_product_wo.custrecord_scv_by_prod_item}, 'VTH.SX.NT') > 0 then {custrecord_scv_by_product_wo.custrecord_scv_by_product_qty} when INSTR({custrecord_scv_by_product_wo_completion.custrecord_scv_by_prod_item}, 'VTH.SX.NT') > 0 then {custrecord_scv_by_product_wo_completion.custrecord_scv_by_product_qty} else 0 end",
				label: "Nhua tam (Kg)"
			}),
			search.createColumn({
				name: "formulatext",
				summary: "GROUP",
				formula: "{item.internalid} || {bomrevision.internalid}",
				label: "Key Mapping"
			})
		],
	}

	const getDataSource = (_filters) =>{
		let resultSearch = constSearch.loadSearchWithFilter(ID, _filters);
		
		resultSearch = resultSearch.runPaged({pageSize: 1000});

		let arrResult = constSearch.fetchResultSearchAllPage(resultSearch, function(_obj, _column){
			return getObjResultFromSearch(_obj, _column);
		});

		return arrResult;
	}

	const getDataSourceFetchPage = (_filters, _params) =>{
		let objRes = constSearch.getDataSourceFetchPage_Mixed(ID, _filters, _params, [], RECORDS, function(_obj, _column){
			return getObjResultFromSearch(_obj, _column);
		})

		return objRes;
	}

	const getObjResultFromSearch = (_objSearch, _myColumns) =>{
		let objRes = constSearch.getObjResultFromSearchByKey(_objSearch, _myColumns,[
			"item_name",
			"bom_revision",
			"phe_pham_kg",
			"phe_pham_tam",
			"phe_pham_quy_doi_tam",
			"nhua_tam_kg",
			"keymapping",
		]);
		
		return objRes;
	}

    return {
		ID,
		TYPE,
		RECORDS,
		getDataSource,
		getDataSourceFetchPage
    };
    
});
