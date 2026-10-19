/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/record', 'N/search', 'N/url'],

function(ccr, record, search, url) {
    
	function refresh() {
		window.location.reload();
	}
	
	function searchReport() {
		window.onbeforeunload = null;
		var currentRecord = ccr.get();
		var urlDC = url.resolveScript({
			scriptId: 'customscript_scv_sl_closing_entry',
		    deploymentId: 'customdeploy_scv_sl_closing_entry',
		    returnExternalUrl: false
		});
		urlDC = urlDC + plusParam(currentRecord);
		window.location.replace(urlDC);
	}
	
	function plusParam(currentRecord) {
		return '&custpage_subsidiary=' + currentRecord.getValue('custpage_subsidiary')
		+ '&custpage_date_to=' + currentRecord.getText("custpage_date_to")
		+ '&custpage_reportype=' + currentRecord.getValue('custpage_reportype')
		;
	}
	
	function fieldChanged(scriptContext){
	
	}
	
	function postSourcing(scriptContext) {		
		
    }
	
	function saveRecord(scriptContext) {
		var isValid = true, allocationaccount;
		var currentRecord = scriptContext.currentRecord;
		var reportypes = currentRecord.getValue('custpage_reportype');
		var message = 'Không có dữ liệu để thực hiện!';
		for(let reportype of reportypes) {
			var sl = 'custpage_sl_result' + reportype;
			var lc = currentRecord.getLineCount(sl);
			if(lc < 1) {
				isValid = false;
			} else {
				if(reportype === '2') {
					for(var i = 0; i < lc; i++) {
						allocationaccount = currentRecord.getSublistValue({sublistId: sl, fieldId: 'allocationaccount', line: i});
						if(!allocationaccount) {
							isValid = false;
							message = 'Có một hoặc nhiều line không có tài khoản kết chuyển. Vui lòng kiểm tra lại!';
							break;
						}
					}
				}
			}
		}
		
		if(isValid === false) {
			alert(message);
		} 
		return isValid;
	}
	
    return {
    	refresh: refresh,    	
    	searchReport: searchReport,
    	fieldChanged: fieldChanged,
    	postSourcing: postSourcing,
    	saveRecord: saveRecord
    };
    
});
