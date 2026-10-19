/**
 * Nội dung: Function QC
 * * =======================================================================================
 *  Date                Author                  Description
 *  25 Sep 2024         Duy Nguyen	    		Init, create file, move from ELMICH
 *  */
/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/redirect', 'N/record', 'N/runtime', 'N/search', '../lib/scv_lib_function.js'],

(redirect, record, runtime, search, lbf) => {
   
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
    	let parameters = request.parameters;
    	let trid = parameters.trid;
    	let trtype = parameters.trtype;
    	let list_childwo = parameters.list_childwo
    	let arrListWo, isRoot = true;
    	if(lbf.isContainValue(trid) && lbf.isContainValue(trtype)) {
	    	let nField = ['subsidiary', 'assemblyitem', 'trandate', 'quantity'
	    	              ,'custbody_scv_sales_order', 'orderstatus', 'firmed', 'custbody_scv_orrginal_wo', 'custbody_scv_work_order_type'
	    	              ,'schedulingmethod', 'enddate', 'custbody_scv_approval_status', 'memo'];
	    	let nField1 = ['billofmaterials', 'billofmaterialsrevision', 'location', 'iswip', 'manufacturingrouting'];
	    	let nFieldLineChild = ['custcol_scv_child_wo', 'custcol_scv_auto_create_wo1'];
	    	if(lbf.isContainValue(list_childwo)) {
	    		list_childwo = list_childwo.split(',');
	    		arrListWo = createWOChild(list_childwo[0], trtype, nField, nField1, nFieldLineChild);
	    		let lALW = arrListWo.length;
	    		if(lALW > 0) {
	    			if(list_childwo[0] === arrListWo[lALW - 1]) {
	    				arrListWo.pop(lALW - 1);
	    			} else {
	    				list_childwo.shift();
	    			}
	    			list_childwo = list_childwo.concat(arrListWo);
	    		} else {
	    			list_childwo.shift();
	    		}
	    		if(list_childwo.length > 0) {
	    			isRoot = false;
					redirectSL(trid, trtype, list_childwo.toString());
	    		}
	    	} else {
	    		arrListWo = createWOChild(trid, trtype, nField, nField1, nFieldLineChild);
	    		if(arrListWo.length > 0) {
	    			isRoot = false;
					redirectSL(trid, trtype, arrListWo.toString());
	    		}
	    	}
	    	
    	}
    	if(isRoot) {
    		redirect.toRecord({type: trtype, id: trid});
    	}
    }
	
	const redirectSL = (trid, trtype, list_childwo) => {
		redirect.toSuitelet({
		    scriptId: 'customscript_scv_sl_create_wo_routing' ,
		    deploymentId: 'customdeploy_scv_sl_create_wo_routing',
		    parameters: {'trid': trid, 'trtype': trtype, 'list_childwo': list_childwo}
		});
	}
	
	const createWOChild = (trid, trtype, nField, nField1, nFieldLineChild) => {
    	let readRecord = record.load({type: trtype, id: trid});
    	let slIt = 'item', idwo;
    	let lcIt = readRecord.getLineCount(slIt);
    	let recWo, arrListWo = [], isSave;
    	for(let i = 0; i < lcIt; i++) {
    		const child_wo = readRecord.getSublistValue({sublistId: slIt, fieldId: 'custcol_scv_child_wo', line: i});
			if(!lbf.isContainValue(child_wo) && !!child_wo) {
				const auto_create_wo1 = readRecord.getSublistValue({sublistId: slIt, fieldId: 'custcol_scv_auto_create_wo1', line: i});
				const itemtype = readRecord.getSublistValue({sublistId: slIt, fieldId: 'itemtype', line: i});
				let isCreate = false;
				if(!lbf.isContainValue(child_wo)&& !!child_wo) {
					if(auto_create_wo1 === 'T' || auto_create_wo1 === true) {
						if(itemtype === 'Assembly') {
							isCreate = true;
						}
					}
				}
				if(isCreate) {
    				recWo = record.create({type: trtype, isDynamic: true});
    				isSave = setDataWO(recWo, readRecord, nField, nField1, slIt, i);
    				if(isSave) {
	    				idwo = recWo.save({enableSourcing: true, ignoreMandatoryFields : true});
	    				arrListWo.push(idwo);
	    				lbf.setSublistValueData(readRecord, slIt, nFieldLineChild, i, [idwo, auto_create_wo1]);
	    				if(runtime.getCurrentScript().getRemainingUsage() < 100) {
	    					arrListWo.push(trid);
	    					break;
	    				}
    				}
				}
			}
    	}
    	let lLWo = arrListWo.length;
    	if(lLWo > 0) {
    		readRecord.save();
    	}
    	return arrListWo;
    }
	
	const setDataWO = (recWo, readRecord, nField, nField1, slIt, i) => {
    	let isSave = true;
    	let subsidiary = readRecord.getValue('subsidiary');
    	let item = readRecord.getSublistValue({sublistId: slIt, fieldId: 'item', line: i});
		let quantity = readRecord.getSublistValue({sublistId: slIt, fieldId: 'quantity', line: i});
		let unitconversionrate = readRecord.getSublistValue({sublistId: slIt, fieldId: 'unitconversionrate', line: i}) || 1;
		let trandate = readRecord.getValue('trandate');
		let sales_order = readRecord.getValue('custbody_scv_sales_order');
		let order_type = readRecord.getValue('custbody_scv_work_order_type');
		let enddate = readRecord.getValue('startdate');
		let orrginal_wo = readRecord.getValue('custbody_scv_orrginal_wo');
		let memo = readRecord.getValue('memo');
		if(!lbf.isContainValue(orrginal_wo)) orrginal_wo = readRecord.id;
		let approval_status = readRecord.getValue('custbody_scv_approval_status');
		let data = [subsidiary, item, trandate, quantity * unitconversionrate, sales_order, 'A', true,
		            orrginal_wo, order_type, 'BACKWARD', enddate, approval_status, memo];
		lbf.setValueData(recWo, nField, data);
		let billofmaterials = recWo.getValue('billofmaterials');
		let revision = recWo.getValue('billofmaterialsrevision');
		if(lbf.isContainValue(billofmaterials) && lbf.isContainValue(revision)) {
			let fieldLine = ['custcol_scv_bom_std_qty', 'custcol_scv_tc_wo_org_ite_qty', 'custcol_scv_tc_wo_org_ite_bom', 'custcol_scv_wo_expected_qty'];
			let routing = searchAndRouting(billofmaterials);
			let data1 = [billofmaterials, revision, routing.location, true, routing.manufacturingrouting];
			lbf.setValueData(recWo, nField1, data1);
			lbf.setValueData(recWo, ['quantity'], [quantity]);
			let lcItN = recWo.getLineCount(slIt);
			for(let j = 0; j < lcItN; j++) {
				const itemtype = recWo.getSublistValue({sublistId: slIt, fieldId: 'itemtype', line: j});
				recWo.selectLine({sublistId: slIt, line: j});
				const quantityline = recWo.getSublistValue({sublistId: slIt, fieldId: 'quantity', line: j});
				const itemline = recWo.getSublistValue({sublistId: slIt, fieldId: 'item', line: j});
				const itemline_text = recWo.getCurrentSublistText({sublistId: slIt, fieldId: 'item'});
				if(itemtype === 'Assembly') {
					const lkIt = search.lookupFields({type: 'item', id: itemline, columns: ['custitemcustrecord_scv_auto_create_wo', 'quantityonhand']});
					lbf.setCurrentSublistValueData(recWo, slIt, ['custcol_scv_auto_create_wo1', 'custcol_scv_wo_onhand'],
							[lkIt.custitemcustrecord_scv_auto_create_wo, lkIt.quantityonhand]);
				}
				else {
					lbf.setCurrentSublistValueData(recWo, slIt, ['custcol_scv_auto_create_wo1'], [false]);
				}
				lbf.setCurrentSublistValueData(recWo, slIt, fieldLine, [quantityline/quantity, quantityline/quantity, itemline_text, quantityline]);
				recWo.commitLine(slIt);
			}
		} else {
			isSave = false;
		}
		return isSave;
    }
	
	
	const searchAndRouting = (billofmaterials) => {
    	const f = [search.createFilter({name: 'billofmaterials', operator: 'anyof', values: billofmaterials})];
    	f.push(search.createFilter({name: 'isdefault', operator: 'is', values: true}));
    	f.push(search.createFilter({name: 'isinactive', operator: 'is', values: false}));
    	const c = ['location']
    	let s = search.create({
    		type: 'manufacturingrouting',
    		filters: f,
    		columns: c
    	});
    	let r = s.run().getRange(0,1);
    	let manufacturingrouting = null;
    	let location = null;
    	if (r.length > 0) {
    		manufacturingrouting = r[0].id;
    		location = r[0].getValue('location');
    	}
    	return {manufacturingrouting: manufacturingrouting, location: location};
    }
    
    return {
        onRequest
    };
    
});
