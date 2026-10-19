/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/redirect', 'N/url', '../lib/scv_lib_function.js'],

function(record, search, redirect, url, lbf) {
   
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     * @Since 2015.2
     */
    function beforeLoad(scriptContext) {
    	let type = scriptContext.type;
		let newRecord = scriptContext.newRecord;
		let recType = newRecord.type;

		if (recType === 'customrecord_scv_pur_requisition') {
			if (type === 'view') {
				// Create Button to
				let form = scriptContext.form;
				let urlCopy = url.resolveRecord({recordType: newRecord.type, params: {cloned_from: newRecord.id}});
				urlCopy = 'window.location.replace("' + urlCopy + '")';
				form.addButton({
					id : 'custpage_bt_make_copy',
					label : 'Make Copy',
					functionName : urlCopy
				});
			} else if (type === 'create') {
				let request = scriptContext.request;
				let param = request ? request.parameters : {};
				if (lbf.isContainValue(param) && param.cloned_from) {
					let fromId = param.cloned_from;
					let fromRec = record.load({type : recType,id : fromId});
					let toRec = record.create({type : recType,isDynamic : true});
					
					toRec.setValue('custrecord_scv_pur_requester',fromRec.getValue('custrecord_scv_pur_requester'));
					toRec.setValue('custrecord_scv_req_subsidiary',fromRec.getValue('custrecord_scv_req_subsidiary'));
					toRec.setValue('custrecord_scv_req_dept',fromRec.getValue('custrecord_scv_req_dept'));
					toRec.setValue('custrecord_scv_req_enter_date', lbf.getDateNow());
					toRec.setValue('custrecord_scv_req_date', lbf.getDateNow());
					toRec.setValue('custrecord_scv_req_status','1'); // Draft
					
					let newId = toRec.save({enableSourcing : false,ignoreMandatoryFields : true});
					
					let f = [["custrecord_scv_pur_req","is",fromRec.id]];
					let c = ['custrecord_scv_pr_itemcode','custrecord_scv_pr_itemunit','custrecord_scv_pr_itemquantity',
								'custrecord_scv_pr_itemdes'];
			    	let s = search.create({type: 'customrecord_scv_pr_details', filters: f, columns :c});
			    	
			    	let r = s.runPaged({pageSize: 1000});
			    	let numPage = r.pageRanges.length;
			    	let searchPage, tempData, numTemp;
			    	for(let np = 0; np < numPage; np++) {
						searchPage = r.fetch({index : np});
			    		tempData = searchPage.data;
			    		if(lbf.isContainValue(tempData)) {
			    			numTemp = tempData.length;
			    			for(let i = 0; i < numTemp; i++) {
			    				let linkRec = record.create({type: 'customrecord_scv_pr_details',isDynamic : true});
								linkRec.setValue({fieldId : 'custrecord_scv_pur_req',value : newId});
								linkRec.setValue({fieldId : 'custrecord_scv_pr_itemcode',value : tempData[i].getValue('custrecord_scv_pr_itemcode').toString()});
								linkRec.setValue({fieldId : 'custrecord_scv_pr_itemunit',value : tempData[i].getValue('custrecord_scv_pr_itemunit').toString()});
								linkRec.setValue({fieldId : 'custrecord_scv_pr_itemquantity',value : tempData[i].getValue('custrecord_scv_pr_itemquantity')});
								linkRec.setValue({fieldId : 'custrecord_scv_pr_itemdes',value : tempData[i].getValue('custrecord_scv_pr_itemdes').toString()});
								linkRec.save({enableSourcing : false,ignoreMandatoryFields : true});
				        	}
			    		}
					}
					
					redirect.toRecord({type : recType,id : newId});
				}
			}
		}
    }

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function beforeSubmit(scriptContext) {

    }

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function afterSubmit(scriptContext) {

    }

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    };
    
});
