/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  06 Aug 2025         Huy Pham			    Init, create file, Phát triển báo cáo tổng hợp và chi tiết kết quả sản xuất,from mr.Trương Minh Phúc(https://app.clickup.com/t/86czjzct2)
 */
define([
	'../cons/scv_cons_search.js'
],
function(
	constSearch
) {
	const ID = "customsearch_scv_mfg_scrapbytrans_detail";
	const TYPE = "transaction";

	const RECORDS = {
		"type": "transaction",
		"title": "SCV MFG Total Phế/Phụ phẩm By Trans - Detail Rpt (Don't Update)",
		"id": "customsearch_scv_mfg_scrapbytrans_detail",
		"isPublic": true,
		"filters": [
			{
				"name": "type",
				"operator": "anyof",
				"values": [
					"WorkOrd"
				],
				"isor": false,
				"isnot": false,
				"leftparens": 2,
				"rightparens": 0
			},
			{
				"name": "mainline",
				"operator": "is",
				"values": [
					"T"
				],
				"isor": false,
				"isnot": false,
				"leftparens": 0,
				"rightparens": 0
			},
			{
				"name": "internalid",
				"join": "custrecord_scv_by_product_wo",
				"operator": "noneof",
				"values": [
					"@NONE@"
				],
				"isor": false,
				"isnot": false,
				"leftparens": 0,
				"rightparens": 0
			},
			{
				"name": "custrecord_scv_by_product_wo_completion",
				"join": "custrecord_scv_by_product_wo",
				"operator": "anyof",
				"values": [
					"@NONE@"
				],
				"isor": false,
				"isnot": false,
				"leftparens": 0,
				"rightparens": 0
			},
			{
				"name": "custrecord_scv_by_prod_loss_category",
				"join": "custrecord_scv_by_product_wo",
				"operator": "noneof",
				"values": [
					"303"
				],
				"isor": true,
				"isnot": false,
				"leftparens": 0,
				"rightparens": 1
			},
			{
				"name": "type",
				"operator": "anyof",
				"values": [
					"Build"
				],
				"isor": false,
				"isnot": false,
				"leftparens": 1,
				"rightparens": 0
			},
			{
				"name": "mainline",
				"operator": "is",
				"values": [
					"T"
				],
				"isor": false,
				"isnot": false,
				"leftparens": 0,
				"rightparens": 0
			},
			{
				"name": "internalid",
				"join": "custrecord_scv_by_product_wo_completion",
				"operator": "noneof",
				"values": [
					"@NONE@"
				],
				"isor": false,
				"isnot": false,
				"leftparens": 0,
				"rightparens": 0
			},
			{
				"name": "custrecord_scv_by_prod_item",
				"join": "custrecord_scv_by_product_wo_completion",
				"operator": "noneof",
				"values": [
					"26278"
				],
				"isor": true,
				"isnot": false,
				"leftparens": 0,
				"rightparens": 1
			},
			{
				"name": "type",
				"operator": "anyof",
				"values": [
					"CuTrSale114",
					"InvAdjst"
				],
				"isor": false,
				"isnot": false,
				"leftparens": 1,
				"rightparens": 0
			},
			{
				"name": "mainline",
				"operator": "is",
				"values": [
					"F"
				],
				"isor": false,
				"isnot": false,
				"leftparens": 0,
				"rightparens": 0
			},
			{
				"name": "class",
				"join": "item",
				"operator": "anyof",
				"values": [
					"26"
				],
				"isor": false,
				"isnot": false,
				"leftparens": 0,
				"rightparens": 0
			},
			{
				"name": "custbody_scv_order_type",
				"operator": "anyof",
				"values": [
					"22"
				],
				"isor": false,
				"isnot": false,
				"leftparens": 0,
				"rightparens": 2
			},
			{
				"name": "formulanumeric",
				"operator": "equalto",
				"values": [
					"1"
				],
				"formula": "case when {custbody_scv_created_transaction.internalid} is null then 1 when {custbody_scv_created_transaction.internalid} is not null and {custbody_scv_created_transaction.line} = 0 then 1 else 0 end",
				"isor": false,
				"isnot": false,
				"leftparens": 0,
				"rightparens": 0
			}
		],
		"columns": [
			{
				"name": "subsidiary",
				"summary": "GROUP",
				"type": "select",
				"label": "Subsidiary",
				"sortdir": "ASC"
			},
			{
				"name": "formuladate",
				"summary": "GROUP",
				"formula": "decode({recordtype}, 'workorder', {custrecord_scv_by_product_wo.custrecord_scv_by_product_date}, 'assemblybuild', {custrecord_scv_by_product_wo_completion.custrecord_scv_by_product_date}, 'customsale_scv_ot_yc_xvt', {trandate}, 'inventoryadjustment', {custbody_scv_created_transaction.trandate})",
				"type": "date",
				"label": "MFG Date"
			},
			{
				"name": "formulatext",
				"summary": "GROUP",
				"formula": "decode({recordtype}, 'workorder', {custrecord_scv_by_product_wo.custrecord_scv_by_product_shift}, 'assemblybuild', {custrecord_scv_by_product_wo_completion.custrecord_scv_by_product_shift}, 'customsale_scv_ot_yc_xvt', {custbody_scv_shift}, 'inventoryadjustment', {custbody_scv_created_transaction.custbody_scv_shift})",
				"type": "text",
				"label": "Ca"
			},
			{
				"name": "formulatext",
				"summary": "GROUP",
				"formula": "decode({recordtype}, 'workorder', {custrecord_scv_by_product_wo.custrecord_scv_by_product_work_center}, 'assemblybuild', {custrecord_scv_by_product_wo_completion.custrecord_scv_by_product_work_center}, 'customsale_scv_ot_yc_xvt', {custbody_scv_wo_center}, 'inventoryadjustment', {custbody_scv_created_transaction.custbody_scv_wo_center})",
				"type": "text",
				"label": "WO Center"
			},
			{
				"name": "formulatext",
				"summary": "GROUP",
				"formula": "TO_CHAR(decode({recordtype}, 'workorder', {custrecord_scv_by_product_wo.custrecord_scv_by_product_related_trans.id}, 'assemblybuild', {custrecord_scv_by_product_wo_completion.custrecord_scv_by_product_related_trans.id}, 'customsale_scv_ot_yc_xvt', {internalid}, 'inventoryadjustment', {custbody_scv_created_transaction.internalid}))",
				"type": "text",
				"label": "YCNX Internalid"
			},
			{
				"name": "formulatext",
				"summary": "MAX",
				"formula": "REPLACE(decode({recordtype}, 'workorder', {custrecord_scv_by_product_wo.custrecord_scv_by_product_related_trans}, 'assemblybuild', {custrecord_scv_by_product_wo_completion.custrecord_scv_by_product_related_trans}, 'customsale_scv_ot_yc_xvt', {number}, 'inventoryadjustment', {custbody_scv_created_transaction.number}), 'Yêu cầu nhập/xuất kho #', '')",
				"type": "text",
				"label": "YCNX"
			},
			{
				"name": "formulatext",
				"summary": "GROUP",
				"formula": "decode({recordtype}, 'workorder', {custrecord_scv_by_product_wo.custrecord_scv_by_prod_item}, 'assemblybuild', {custrecord_scv_by_product_wo_completion.custrecord_scv_by_prod_item}, {item})",
				"type": "text",
				"label": "Phe pham"
			},
			{
				"name": "formulanumeric",
				"summary": "SUM",
				"formula": "decode({recordtype}, 'assemblybuild', {custrecord_scv_by_product_wo_completion.custrecord_scv_by_product_qty})",
				"type": "float",
				"label": "Total by AB"
			},
			{
				"name": "formulanumeric",
				"summary": "SUM",
				"formula": "decode({recordtype}, 'workorder', {custrecord_scv_by_product_wo.custrecord_scv_by_product_qty})",
				"type": "float",
				"label": "Total by WO"
			},
			{
				"name": "formulanumeric",
				"summary": "SUM",
				"formula": "decode({recordtype}, 'customsale_scv_ot_yc_xvt', {custcol_scv_plan_qty})",
				"type": "float",
				"label": "Total by YCNX"
			},
			{
				"name": "formulanumeric",
				"summary": "SUM",
				"formula": "decode({recordtype}, 'inventoryadjustment', {quantityuom})",
				"type": "float",
				"label": "Total by IA"
			},
			{
				"name": "formulatext",
				"summary": "GROUP",
				"formula": "TO_CHAR(decode({recordtype}, 'workorder', {custrecord_scv_by_product_wo.custrecord_scv_by_product_date}, 'assemblybuild', {custrecord_scv_by_product_wo_completion.custrecord_scv_by_product_date}, 'customsale_scv_ot_yc_xvt', {trandate}, 'inventoryadjustment', {custbody_scv_created_transaction.trandate}), 'yyyyMMdd') || decode({recordtype}, 'workorder', {custrecord_scv_by_product_wo.custrecord_scv_by_product_shift.id}, 'assemblybuild', {custrecord_scv_by_product_wo_completion.custrecord_scv_by_product_shift.id}, 'customsale_scv_ot_yc_xvt', {custbody_scv_shift.internalid}, 'inventoryadjustment', {custbody_scv_created_transaction.custbody_scv_shift.id}) || decode({recordtype}, 'workorder', {custrecord_scv_by_product_wo.custrecord_scv_by_product_work_center.id}, 'assemblybuild', {custrecord_scv_by_product_wo_completion.custrecord_scv_by_product_work_center.id}, 'customsale_scv_ot_yc_xvt', {custbody_scv_wo_center.id}, 'inventoryadjustment', {custbody_scv_created_transaction.custbody_scv_wo_center.id}) || TO_CHAR(decode({recordtype}, 'workorder', {custrecord_scv_by_product_wo.custrecord_scv_by_product_related_trans.id}, 'assemblybuild', {custrecord_scv_by_product_wo_completion.custrecord_scv_by_product_related_trans.id}, 'customsale_scv_ot_yc_xvt', {internalid}, 'inventoryadjustment', {custbody_scv_created_transaction.internalid})) || decode({recordtype}, 'workorder', {custrecord_scv_by_product_wo.custrecord_scv_by_prod_item.id}, 'assemblybuild', {custrecord_scv_by_product_wo_completion.custrecord_scv_by_prod_item.id}, {item.internalid})",
				"type": "text",
				"label": "Key Mapping"
			}
		],
		"settings": [
			{
				"name": "consolidationtype",
				"value": "ACCTTYPE"
			}
		]
	}

	const getDataSource = (_filters) =>{
		let resultSearch = constSearch.getDataSource(ID, _filters, [], RECORDS);

		return resultSearch;
	}

	const getDataSourceFetchPage = (_filters, _params) =>{
		let resultSearch = constSearch.getDataSourceFetchPage(ID, _filters, _params, [], RECORDS);

		return resultSearch;
	}

    return {
		ID,
		TYPE,
		RECORDS,
		getDataSource,
		getDataSourceFetchPage
    };
    
});
