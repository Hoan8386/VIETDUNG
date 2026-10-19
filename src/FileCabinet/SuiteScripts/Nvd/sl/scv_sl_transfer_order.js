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
			let woRec = record.load({type: parameters.custpage_rectype, id: parameters.custpage_createdfromid});
			let arrMROComponents = getDataSublistMRO_Components(woRec);

			if(arrMROComponents.length > 0) {
				let transfer_ord_id = createTOWithMRO_Components(parameters, woRec, arrMROComponents);
				redirect.toRecord({ type: record.Type.TRANSFER_ORDER, id: transfer_ord_id });
			} 
			else {
				let newRecord = record.create({type: record.Type.TRANSFER_ORDER});
				let quantity = parameters.custpage_quantity;
				createTO(woRec, newRecord, parameters.custpage_createdfromid, parameters.custpage_location, parameters.custpage_class, parameters.custpage_operation, quantity, '');
				let id = newRecord.save({enableSourcing: false, ignoreMandatoryFields : true});
				redirect.toRecord({ type: record.Type.TRANSFER_ORDER, id: id });
			}
    	}
    }
	
	const createForm = (parameters) => {
		let createdfromid = parameters.createdfromid;
		let rectype = parameters.createdrectype;
		let subsidiary = parameters.subsidiary;
		let tlocation = parameters.location;
		let form = serverWidget.createForm({
			title : 'Pre Transfer Order'
		});
		
		addFieldHiden(form, 'custpage_createdfromid', 'TG ID', parameters.createdfromid);
		addFieldHiden(form, 'custpage_rectype', 'Rectype', parameters.createdrectype);
		
		let fLocation = form.addField({
			id : 'custpage_location',
			type : serverWidget.FieldType.SELECT,
			label : 'From Location'
		});
		
		addSelection(search.Type.LOCATION, subsidiary, fLocation, tlocation);
		fLocation.isMandatory = true;
		let fClass = form.addField({
			id : 'custpage_class',
			type : serverWidget.FieldType.MULTISELECT,
			label : 'Class'
		});
		
		let rec = record.load({type: rectype, id: createdfromid});
		addSelectionClass(rec, fClass);
		
		let fOperation = form.addField({
			id : 'custpage_operation',
			type : serverWidget.FieldType.MULTISELECT,
			label : 'Operation'
		});
		addSelectionOperation(rec, fOperation);
		
		let fQuantity = form.addField({
			id : 'custpage_quantity',
			type : serverWidget.FieldType.INTEGER,
			label : 'Quantity'
		});
		fQuantity.isMandatory = true;
		fQuantity.defaultValue = rec.getValue('quantity');

		// form.addField({
		// 	id: "custpage_mro_components",
		// 	type : serverWidget.FieldType.CHECKBOX,
		// 	label : 'MRO Components'
		// });
		
		form.addSubmitButton({label : 'Save'});
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
	
	const createTO = (fromRec, newRecord, fromId, fromLocation, classv, operation, quantity, comma) => {
    	if(lfunc.isContainValue(classv)) {
    		classv = classv.split(comma);
    	}
    	if(lfunc.isContainValue(operation)) {
    		operation = operation.split(comma);
    	}

		let newFields = ['subsidiary', 'department', 'class', 'custbody_scv_wo_qty',
		                 'transferlocation', 'cseg_scv_seg_sc', 'cseg_scv_sg_proj', 'custbody_scv_assembly_lot'
		                 , 'custbody_scv_expiration_date', 'custbody_scv_mfg_date', 'custbody_scv_to_wo_uom'
						 , 'custbody_scv_wo_center', 'custbody_scv_qc_serial_code'
						];
		let readFields = ['subsidiary', 'department', 'class', 'quantity',
		                  'location', 'cseg_scv_seg_sc', 'cseg_scv_sg_proj', 'custbody_scv_assembly_lot'
		                  , 'custbody_scv_expiration_date', 'custbody_scv_mfg_date', 'units'
						  , 'custbody_scv_wo_center', 'custbody_scv_qc_serial_code'
						];
		lfunc.setValue(newRecord, fromRec, newFields, readFields);
		let work_order_type = fromRec.getValue('custbody_scv_work_order_type');
		let fAdd = ['custbody_scv_assembly', 'location', 'custbody_scv_work_order_no', 'custbody_scv_tro_quantity'];
		let dAdd = [fromRec.getValue('assemblyitem'), fromLocation, fromId, quantity];
		if(lfunc.isContainValue(work_order_type)) {
			let lkWOT = search.lookupFields({type: 'customrecord_scv_work_order_type', id: work_order_type, columns: ['custrecord_scv_wot_order_type']});
			let order_type = lkWOT.custrecord_scv_wot_order_type;
			if(lfunc.isContainValue(order_type) && order_type.length > 0) {
				order_type = order_type[0].value;
			} else {
				order_type = '';
			}
			fAdd.push('custbody_scv_order_type');
			dAdd.push(order_type);
		} 
		lfunc.setValueData(newRecord, fAdd, dAdd);
		
		let slItem = 'item';
		let slInv = 'item';
		let lCFrom = fromRec.getLineCount(slItem);
		let newSublistFields = ['item', 'quantity', 'units', 'binitem', 'isserial', 'inventorydetailavail', 'isnumbered',
		                        'locationusesbins', 'tolocationusesbins', 'class', 'olditem', 'commitinventory', 'commitmentfirm',
		                        'description', 'custcol_scv_qty_content_per', 'custcol_scv_bom_qty', 'custcol_scv_batch_qty',
		                        'custcol_scv_requested_qty', 'custcol_scv_bom_lot_qty', 'custcol_scv_bom_std_qty', 'custcol_scv_bom_qty', 'custcol_scv_wo_batch_qty', 'custcol_scv_ori_lineid'];
		let readSublistFields = ['item', 'quantity', 'units', 'binitem', 'isserial', 'inventorydetailavail', 'isnumbered',
		                         'locationusesbins', 'locationusesbins', 'class', 'olditemid', 'commitinventory', 'commitmentfirm',
		                         'description', 'custcol_scv_qty_content_per', 'bomquantity', 'custcol_scv_batch_qty',
		                         'quantity', 'custcol_scv_bom_lot_qty', 'custcol_scv_bom_std_qty', 'quantity', 'custcol_scv_wo_batch_qty', 'custcol_scv_ori_lineid'];
		let j = 0;
		let classLine, operationLine, itemtype;
		let wo_quantity = fromRec.getValue('quantity');
		for(let i = 0; i < lCFrom; i++) {
			classLine = fromRec.getSublistValue({sublistId: slItem, fieldId: 'class', line: i});
			operationLine = fromRec.getSublistValue({sublistId: slItem, fieldId: 'operationsequencenumber', line: i});
			itemtype = fromRec.getSublistValue({sublistId: slItem, fieldId: 'itemtype', line: i});
			if((!classv || lfunc.isExists(classv, classLine)) && (itemtype === 'InvtPart' || itemtype === 'Assembly')) {
				if(!operation || lfunc.isExists(operation, operationLine)) {
					newRecord.insertLine({sublistId: slInv, line: j});
    				lfunc.setSublistValueDiff(newRecord, fromRec, slInv, slItem, newSublistFields, readSublistFields, j, i); //'department',
    				lfunc.setSublistValueData(newRecord, slInv, ['rate', 'amount', 'commitinventory', 'costingmethod'
    				      ,'custcol_scv_wo_to_if_ir_header_id', 'custcol_scv_wo_to_if_ir_line_id'], j, [0, 0, 1, 'AVG', fromId, i]);
    				if(lfunc.isContainValue(quantity)) {
    					let bom_std_qty = fromRec.getSublistValue({sublistId: slItem, fieldId: 'quantity', line: i})/wo_quantity;
    					newRecord.setSublistValue({sublistId: slInv, fieldId: 'quantity', line: j, value: bom_std_qty * quantity});
    				}
    				j++;
				}
			}
			
		}
    }

	const createTOWithMRO_Components = (params, woRec, arrMROComponents) => {
		let locationId = params.custpage_location;
		let quantity = params.custpage_quantity;

		let toRec = record.create({type: record.Type.TRANSFER_ORDER, isDynamic: true});
		let newFields = [
			'subsidiary', 'department', 'class', 'custbody_scv_wo_qty',
			'transferlocation', 'cseg_scv_seg_sc', 'cseg_scv_sg_proj', 'custbody_scv_assembly_lot', 
			'custbody_scv_expiration_date', 'custbody_scv_mfg_date', 'custbody_scv_to_wo_uom',
			'custbody_scv_wo_center', 'custbody_scv_qc_serial_code'
		];
		let readFields = [
			'subsidiary', 'department', 'class', 'quantity',
			'location', 'cseg_scv_seg_sc', 'cseg_scv_sg_proj', 'custbody_scv_assembly_lot',
			'custbody_scv_expiration_date', 'custbody_scv_mfg_date', 'units',
			'custbody_scv_wo_center', 'custbody_scv_qc_serial_code'
		];
		lfunc.setValue(toRec, woRec, newFields, readFields);
		
		let work_order_type = woRec.getValue('custbody_scv_work_order_type');
		let fAdd = ['custbody_scv_assembly', 'location', 'custbody_scv_work_order_no', 'custbody_scv_tro_quantity'];
		let dAdd = [woRec.getValue('assemblyitem'), locationId, params.custpage_createdfromid, quantity];
		if(lfunc.isContainValue(work_order_type)) {
			let lkWOT = search.lookupFields({type: 'customrecord_scv_work_order_type', id: work_order_type, columns: ['custrecord_scv_wot_order_type']});
			let order_type = lkWOT.custrecord_scv_wot_order_type;
			if(lfunc.isContainValue(order_type) && order_type.length > 0) {
				order_type = order_type[0].value;
			} else {
				order_type = '';
			}
			fAdd.push('custbody_scv_order_type');
			dAdd.push(order_type);
		}
		lfunc.setValueData(toRec, fAdd, dAdd);

		let slItem = "item";
		for(let i = 0; i < arrMROComponents.length; i++) {
			toRec.selectNewLine(slItem);
			toRec.setCurrentSublistValue(slItem, "item", arrMROComponents[i].component);
			toRec.setCurrentSublistValue(slItem, "quantity", arrMROComponents[i].quantity);
			toRec.setCurrentSublistValue(slItem, "units", arrMROComponents[i].units);
			toRec.setCurrentSublistValue(slItem, "custcol_scv_mro_line_related", arrMROComponents[i].id);
			toRec.commitLine(slItem);
		}
		return toRec.save({enableSourcing: false, ignoreMandatoryFields: true});
	}

	const getDataSublistMRO_Components = (woRec) => {
		let sl = "recmachcustrecord_scv_mro_usage_wo";
		let lc = woRec.getLineCount(sl);

		let arrResult = [];
		for(let i = 0; i < lc; i++) {
			let obj = {
				id: woRec.getSublistValue(sl, "id", i),
				component: woRec.getSublistValue(sl, "custrecord_scv_mro_usage_comp", i),
				quantity: woRec.getSublistValue(sl, "custrecord_scv_mro_usage_qty", i),
				units: woRec.getSublistValue(sl, "custrecord_scv_mro_usage_unit", i)
			}
			arrResult.push(obj);
		}
		return arrResult;
	}
	
	const createSearch = (type, subsidiary) => {
    	let s = search.create({
    		type: type,
    		filters: [['subsidiary', 'anyof', subsidiary]],
    		columns: ['name']
    	});
    	return s.run().getRange({start:0, end: 1000});
    }
	
	const addSelection = (type, subsidiary, fieldSelect, diffid) => {
    	let rL = createSearch(type, subsidiary);
    	let rLL = rL.length;
    	for(let i = 0; i < rLL; i++) {
    		if(rL[i].id !== diffid) {
    			fieldSelect.addSelectOption({value : rL[i].id, text : rL[i].getValue('name')});
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
