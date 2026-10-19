/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/record', 'N/search', 'N/url'],

function(ccr, record, search, url) {

	function refresh() {
		window.location.reload();
	}

	function searchPOReq() {
		let currentRecord = ccr.get();
		let urlPOReq = url.resolveScript({
			scriptId: 'customscript_scv_sl_po_requisition',
		    deploymentId: 'customdeploy_scv_sl_po_requisition',
		    returnExternalUrl: false
		});
		urlPOReq = urlPOReq + '&custpage_subsidiary=' + currentRecord.getValue('custpage_subsidiary')
		+ '&custpage_vendor=' + currentRecord.getValue('custpage_vendor')
		+ '&custpage_location=' + currentRecord.getValue('custpage_location')
		+ '&custpage_ordertype=' + currentRecord.getValue('custpage_ordertype')
		+ '&custpage_req_date_ip_from=' + document.getElementById("custpage_req_date_ip_from").value
		+ '&custpage_req_date_ip_to=' + document.getElementById("custpage_req_date_ip_to").value
		+ '&custpage_req_duedate_from=' + document.getElementById("custpage_req_duedate_from").value
		+ '&custpage_req_duedate_to=' + document.getElementById("custpage_req_duedate_to").value
		+ '&custpage_doc_number=' + currentRecord.getValue('custpage_doc_number');
		window.location.replace(urlPOReq);
	}

	function fieldChanged(scriptContext){
		let fieldId = scriptContext.fieldId;
		if(fieldId === 'custpage_subsidiary') {

		} else if(fieldId === 'custpage_vendor') {

		}
	}

	function postSourcing(scriptContext) {


    }

	function saveRecord(scriptContext) {
		let isValid = false, isQuantity = true;
		let currentRecord = scriptContext.currentRecord;
		let sl = 'custpage_sl_req';
		let lc = currentRecord.getLineCount(sl);
		let vCheck, itemquantity, poquantity, item_po_quantity;
		for(let i = 0; i < lc; i++) {
			vCheck = currentRecord.getSublistValue({sublistId: sl, fieldId: 'custpage_select', line: i});
			if(vCheck === true || vCheck === 'T') {
				isValid = true;
				itemquantity = currentRecord.getSublistValue({sublistId: sl, fieldId: 'custrecord_scv_pr_itemquantity', line: i}) * 1;
				poquantity = currentRecord.getSublistValue({sublistId: sl, fieldId: 'custrecord_scv_pr_poquantity', line: i}) * 1;
				item_po_quantity = currentRecord.getSublistValue({sublistId: sl, fieldId: 'item_po_quantity', line: i}) * 1;
				if(item_po_quantity + poquantity > itemquantity) {
					isQuantity = false;
				}
			}
		}
		if(isValid === false) {
			alert('Hãy chọn ít nhất một Yêu cầu mua hàng!');
			return isValid;
		}
		if(isQuantity === false) {
			alert('Số lượng bị vượt quá so với yêu cầu!');
			return isValid;
		}
		return confirm('Bạn có muốn tạo PO không?');
	}

	function checkAll() {
		setValueSelect(true);
	}

	function unCheckAll() {
		setValueSelect(false);
	}

	function setValueSelect(value) {
		let currentRecord = ccr.get();
		let sl = 'custpage_sl_req';
		let sf_select = 'custpage_select';
		let lc = currentRecord.getLineCount(sl);
		for(let i = 0; i < lc; i++) {
			currentRecord.selectLine({sublistId: sl, line: i});
			currentRecord.setCurrentSublistValue({sublistId: sl, fieldId: sf_select, value: value});
			currentRecord.commitLine(sl);
		}
	}

	function pageInit() {
		removeElement('tbl_custpage_sl_req_insert');
		removeElement('tbl_custpage_sl_req_remove');
    }

	function removeElement(id) {
		let elm = document.getElementById(id);
		if(isContainValue(elm)) {
			elm.remove();
		}
	}

	function isContainValue(value) {
		let isContain = false;
		if(value !== undefined && value !== null && value !== '') {
			if(util.isArray(value)) {
				if(value.length > 0) {
					isContain = true;
				}
			} else {
				isContain = true;
			}
		}
		return isContain;
	}

    return {
    	refresh: refresh,
    	searchPOReq: searchPOReq,
    	fieldChanged: fieldChanged,
    	postSourcing: postSourcing,
    	saveRecord: saveRecord,
    	pageInit: pageInit,
    	checkAll: checkAll,
    	unCheckAll: unCheckAll
    };

});