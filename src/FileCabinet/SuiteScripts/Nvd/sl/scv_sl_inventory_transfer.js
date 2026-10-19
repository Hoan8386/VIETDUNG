/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/ui/serverWidget', 'N/redirect', '../lib/scv_lib_function.js'],

(record, search, serverWidget, redirect, lfunc) => {
   
    /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     * @Since 2015.2
     */
	const onRequest = (context) => {
    	let request = context.request;
    	let response = context.response;
    	let parameters = request.parameters;
    	if(request.method === 'GET') {
	    	response.writePage(createForm(parameters));
    	} else {
    		let createdfromid = parameters.custpage_createdfromid;
        	let rectype = parameters.custpage_rectype;
    		let location = parameters.custpage_location;
    		let classv = lfunc.makeStringWithComma(parameters.custpage_class, '', ';');
    		let operation = lfunc.makeStringWithComma(parameters.custpage_operation, '', ';');
    		let quantity = parameters.custpage_quantity;
    		
    		redirect.redirect({
    		    url: "/app/accounting/transactions/invtrnfr.nl?createdfromid=" + createdfromid + "&createdrectype=" + rectype + "&location=" + location 
    		    + "&classv=" + classv + "&operation=" + operation + "&quantity="+ quantity
    		});
    	}
    }
	
	const createForm = (parameters) => {
		let createdfromid = parameters.createdfromid;
		let rectype = parameters.createdrectype;
		let subsidiary = parameters.subsidiary;
		let tlocation = parameters.location;
		let frlocation = parameters.frlocation;
		let form = serverWidget.createForm({
			title : 'Pre Inventory Transfer'
		});
		
		addFieldHiden(form, 'custpage_createdfromid', 'TG ID', parameters.createdfromid);
		addFieldHiden(form, 'custpage_rectype', 'Rectype', parameters.createdrectype);
		
		let fLocation = form.addField({
			id : 'custpage_location',
			type : serverWidget.FieldType.SELECT,
			label : 'From Location'
		});
		addSelection(search.Type.LOCATION, subsidiary, fLocation, tlocation, frlocation);
		fLocation.isMandatory = true;
		let fClass = form.addField({
			id : 'custpage_class',
			type : serverWidget.FieldType.MULTISELECT,
			label : 'Class'
		});
		
		let rec = record.load({type: rectype, id: createdfromid});
		addSelectionClass(rec, fClass);
		
		if(rectype === record.Type.WORK_ORDER) {
			let fOperation = form.addField({
				id : 'custpage_operation',
				type : serverWidget.FieldType.MULTISELECT,
				label : 'Operation'
			});
			addSelectionOperation(rec, fOperation);
		}
		
		let fQuantity = form.addField({
			id : 'custpage_quantity',
			type : serverWidget.FieldType.INTEGER,
			label : 'Quantity'
		});
		fQuantity.isMandatory = true;
		fQuantity.defaultValue = rec.getValue('quantity');
		
		form.addSubmitButton({label : 'Inventory Transfer'});
		lfunc.addButtonBack(form, createdfromid, rectype);
		return form;
	}
	
	const addFieldHiden = (form, id, label, value) => {
		let fId = form.addField({
			id : id,
			type : serverWidget.FieldType.TEXT,
			label : label
		});
		fId.updateDisplayType({
			displayType : serverWidget.FieldDisplayType.HIDDEN
		});
		fId.defaultValue = value;
	}
	
	const createSearch = (type, subsidiary) => {
    	let s = search.create({
    		type: type,
    		filters: [['subsidiary', 'anyof', subsidiary]],
    		columns: ['name']
    	});
    	return s.run().getRange({start:0, end: 1000});
    }
	
	const addSelection = (type, subsidiary, fieldSelect, diffid, frlocation) => {
    	let rL = createSearch(type, subsidiary);
    	let rLL = rL.length;
    	let isSelected = false;
    	for(let i = 0; i < rLL; i++) {
    		isSelected = frlocation === rL[i].id;
    		if(rL[i].id !== diffid) {
    			fieldSelect.addSelectOption({value : rL[i].id, text : rL[i].getValue('name'), isSelected: isSelected});
    		}
    	}
    }
	
	const addSelectionClass = (rec, fieldSelect) => {
    	let slItem = 'item';
    	let lCFrom = rec.getLineCount(slItem);
    	let classValue, classText;
    	let arr = [];
    	for(let i = 0; i < lCFrom; i++) {
    		classValue = rec.getSublistValue({sublistId: slItem, fieldId: 'class', line: i});
    		if(lfunc.isContainValue(classValue) && lfunc.isExists(arr, classValue) === false) {
    			classText = rec.getSublistText({sublistId: slItem, fieldId: 'class', line: i});
    			fieldSelect.addSelectOption({value : classValue, text : classText});
    			arr.push(classValue);
    		}
    	}
    }
	
	const addSelectionOperation = (rec, fieldSelect) => {
    	let mfr = rec.getValue('manufacturingrouting');
    	if(lfunc.isContainValue(mfr)) {
	    	let recMGR = record.load({type: 'manufacturingrouting', id: mfr});
	    	let slRS = 'routingstep';
	    	let lCRS = recMGR.getLineCount(slRS);
	    	let slItem = 'item';
	    	let lCFrom = rec.getLineCount(slItem);
	    	let operation, operationMGR, operationName;
	    	let arr = [];
	    	for(let i = 0; i < lCFrom; i++) {
	    		operation = rec.getSublistValue({sublistId: slItem, fieldId: 'operationsequencenumber', line: i});
	    		if(lfunc.isContainValue(operation) && lfunc.isExists(arr, operation) === false) {
	    			operationName = '';
	    			for(let j = 0; j < lCRS; j++) {
	    				operationMGR = recMGR.getSublistValue({sublistId: slRS, fieldId: 'operationsequence', line: j});
	    				if(operationMGR === operation) {
	    					operationName = operation + ' - ' + recMGR.getSublistValue({sublistId: slRS, fieldId: 'operationname', line: j});
	    				}
	    			}
	    			fieldSelect.addSelectOption({value : operation, text : operationName});
	    			arr.push(operation);
	    		}
	    	}
    	}
    }
    
    return {
        onRequest
    };
    
});
