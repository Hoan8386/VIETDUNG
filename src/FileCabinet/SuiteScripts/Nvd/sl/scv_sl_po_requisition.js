/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/config', 'N/format', 'N/redirect', 'N/runtime', 'N/record', 'N/search', 'N/ui/serverWidget', '../lib/scv_lib_function.js'
        , '../lib/scv_lib_report.js'],

function(config, format, redirect, runtime, record, search, serverWidget, lbf, lrp) {
   
    /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     * @Since 2015.2
     */
    function onRequest(context) {
    	let request = context.request;
    	let response = context.response;
    	let parameters = request.parameters;
    	let subsidiary = parameters.custpage_subsidiary;
    	let vendor = parameters.custpage_vendor;
    	let location = parameters.custpage_location
    	let ordertype = parameters.custpage_ordertype
    	let req_date_ip_from = parameters.custpage_req_date_ip_from;
    	let req_date_ip_to = parameters.custpage_req_date_ip_to;
    	let req_duedate_from = parameters.custpage_req_duedate_from;
    	let req_duedate_to = parameters.custpage_req_duedate_to;
    	let doc_number = parameters.custpage_doc_number;
    	let mdata = getSublistColMaster();
		let sublistId = mdata.sl;
    	let colid = mdata.c;
    	let lc = colid.length;
    	if(request.method === 'GET') {
    		let form = serverWidget.createForm({
	    		title : 'Create PO'
	    	});
    		if(lbf.isContainValue(subsidiary) === false) {
    			let userObj = runtime.getCurrentUser();
    			subsidiary = userObj.subsidiary;
    		}
    		form.clientScriptModulePath = '../cs/scv_cs_sl_po_requisition.js';
    		form.addButton({id: 'custpage_bt_search', label: 'Search', functionName: 'searchPOReq()'});
    		addFieldSearch(form, subsidiary, vendor, req_date_ip_from, req_date_ip_to, req_duedate_from, req_duedate_to, doc_number, location, ordertype);
    		
    		let sublist = form.addSublist({
    		    id : sublistId,
    		    type : serverWidget.SublistType.INLINEEDITOR,
    		    label : 'Yêu cầu mua hàng'
    		});
    		//sublist.addMarkAllButtons();
    		lrp.addFieldSelect(sublist, mdata.sf_select);
    		lrp.addFieldSublistColId(sublist, colid);
    		
    		let columns = [], fields = [], f = [];
    		pushColumnsFields(columns, fields);
    		pushFilters(f, subsidiary, doc_number, req_date_ip_from, req_date_ip_to, req_duedate_from, req_duedate_to);
			let arrRes = [];
			let lar = lrp.doSearch('customrecord_scv_pr_details', arrRes, columns, fields, f);
			let tempValue;
    		for(let i = 0; i < lar; i++) {
				for(let j = 0; j < lc; j++) {
					if(colid[j].id === '') {
						//Todo
					} else {
						tempValue = arrRes[i][colid[j].id];
						if(lbf.isContainValue(tempValue)) {
							sublist.setSublistValue({id : colid[j].id, line : i, value : tempValue});
						}
					}
					
				}
			}
    		form.addSubmitButton({
    		    label : 'Create PO'
    		});
    		form.addButton({id: 'custpage_bt_checkall', label: 'Mark All', functionName: 'checkAll()'});
    		form.addButton({id: 'custpage_bt_uncheckall', label: 'Unmark All', functionName: 'unCheckAll()'});
    		response.writePage(form);
    	} else {
    		let configRecObj = config.load({type: config.Type.USER_PREFERENCES});
    		let timezone = configRecObj.getValue('TIMEZONE');
    		
    		let lc = request.getLineCount({group: sublistId});
    		let vCheck, vId, j = 0, poquantity, item_po_quantity;
    		let newRecord = record.create({type: record.Type.PURCHASE_ORDER, isDynamic: true});
    		let arrLine = [], memo, scm_si, itemquantity;
    		let newFields = ['entity', 'subsidiary', 'memo', 'location', 'custbody_scv_order_type'];
    		for(let i = 0; i < lc; i++) {
    			vCheck = request.getSublistValue({group: sublistId, name: 'custpage_select', line: i});
    			if(vCheck === true || vCheck === 'T') {
    				vId = request.getSublistValue({group: sublistId, name: 'internalid', line: i});
    				poquantity = request.getSublistValue({group: sublistId, name: 'custrecord_scv_pr_poquantity', line: i}) * 1;
    				item_po_quantity = request.getSublistValue({group: sublistId, name: 'item_po_quantity', line: i}) * 1;
    				scm_si = request.getSublistValue({group: sublistId, name: 'custrecord_scv_ct_ycmh_scm_si', line: i});
    				itemquantity = request.getSublistValue({group: sublistId, name: 'custrecord_scv_pr_itemquantity', line: i}) * 1;
    				if(j === 0) {
    					memo = request.getSublistValue({group: sublistId, name: 'custrecord_scv_pr_itemdes', line: i});
    					if(lbf.isContainValue(memo) === false) {
    						memo = request.getSublistValue({group: sublistId, name: 'custrecord_scv_req_note', line: i});
    						if(lbf.isContainValue(memo) === false) {
    							memo = '.';
    						}
    					}
    					
    					lbf.setValueData(newRecord, newFields, [vendor, subsidiary, memo, location, ordertype]);
    				}
    				insertLine(newRecord, request, i, sublistId, timezone);
    				arrLine.push({id: vId, poquantity: poquantity, item_po_quantity: item_po_quantity, scm_si: scm_si, itemquantity: itemquantity});
    				j++;
    			}
    		}
    		let lLine = arrLine.length;
    		let id = newRecord.save({enableSourcing: false, ignoreMandatoryFields : true});
    		for(let i = 0; i < lLine; i++) {
				record.submitFields({type: 'customrecord_scv_pr_details', id: arrLine[i].id,
					values: {custrecord_scv_pr_poquantity: arrLine[i].poquantity + arrLine[i].item_po_quantity}});
				if(lbf.isContainValue(arrLine[i].scm_si) === true) {
					try {
						record.submitFields({type: 'supplychainsnapshotsimulation', id: arrLine[i].scm_si,
							values: {quantity: arrLine[i].itemquantity - (arrLine[i].poquantity + arrLine[i].item_po_quantity)}});
					} catch (e) {
						log.error('e', e);
					}
				}
			}
    		redirect.toRecord({
                type: record.Type.PURCHASE_ORDER,
                id: id
            });
    	}
    }
    
    function getSublistColMaster() {
    	let sl = 'custpage_sl_req';
    	let slFields = 'custpage_slf_';
    	let c = [{id: 'internalid', label: 'Internal ID', type: 'text', display: 'hidden'}
    			,{id: 'custrecord_scv_pur_req', label: 'Số', type: 'select', display: 'hidden'}
				,{id: 'custrecord_scv_pur_req_text', label: 'Số', type: 'text', display: 'disabled'}
    	        ,{id: 'custrecord_scv_req_dept', label: 'Department', type: 'select', display: 'hidden'}
	    		,{id: 'custrecord_scv_req_dept_text', label: 'Department', type: 'text', display: 'disabled'}
	    		,{id: 'custrecord_scv_req_enter_date', label: 'Ngày nhập Yêu cầu', type: 'date', display: 'disabled'}
	    		//,{id: 'custrecord_scv_req_date', label: 'Ngày mong đợi nhận hàng', type: 'date', display: 'disabled'}
	    		,{id: 'custrecord_scv_req_need_date', label: 'Ngày cần', type: 'date', display: 'disabled'}
	    		,{id: 'custrecord_scv_pr_itemcode', label: 'Vật tư', type: 'text', display: 'hidden'}
	    		,{id: 'custrecord_scv_pr_itemcode_text', label: 'Vật tư', type: 'text', display: 'disabled'}
	    		,{id: 'custrecord_scv_pr_itemunit', label: 'Đơn vị tính', type: 'select', display: 'hidden'}
	    		,{id: 'custrecord_scv_pr_itemunit_text', label: 'Đơn vị tính', type: 'text', display: 'disabled'}
	    		,{id: 'custrecord_scv_pr_itemquantity', label: 'Số lượng yêu cầu', type: 'float', display: 'disabled'}
	    		,{id: 'custrecord_scv_pr_poquantity', label: 'Số lượng PO', type: 'float', display: 'disabled'}
	    		,{id: 'item_po_quantity', label: 'Số lượng', type: 'float', mandatory: true}
	    		,{id: 'custrecord_scv_pr_itemdes', label: 'Diễn giải', type: 'text', display: 'disabled'}	
	    		,{id: 'cost', label: 'Cost', type: 'float', display: 'hidden'}
	    		,{id: 'custrecord_scv_ct_ycmh_scm_si', label: 'SML', type: 'text', display: 'hidden'}
	    		,{id: 'custrecord_scv_req_note', label: 'Note', type: 'text', display: 'hidden'}
	    		,{id: 'custrecord_scv_ycmh_project', label: 'Project', type: 'text', display: 'hidden'}
	    	];
    	let sf_select = 'custpage_select';
    	return {sl: sl, slFields: slFields, c: c, sf_select: sf_select}
    }
    
    function pushFilters(f, subsidiary, doc_number, req_date_ip_from, req_date_ip_to, req_duedate_from, req_duedate_to) {
    	 f.push(search.createFilter({name: 'formulanumeric', operator: search.Operator.GREATERTHAN, values: 0
    		, formula: '{custrecord_scv_pr_itemquantity} - nvl({custrecord_scv_pr_poquantity},0)'}));
    	f.push(search.createFilter({name: 'custrecord_scv_req_subsidiary', join: 'custrecord_scv_pur_req', operator: search.Operator.ANYOF, values: subsidiary}));
    	f.push(search.createFilter({name: 'isinactive', join: 'custrecord_scv_pur_req', operator: search.Operator.IS, values: false}));
    	f.push(search.createFilter({name: 'custrecord_scv_req_status', join: 'custrecord_scv_pur_req', operator: search.Operator.ANYOF, values: 5}));
    	f.push(search.createFilter({name: 'custrecord_scv_pr_line_close', operator: search.Operator.IS, values: false}));
    	if(lbf.isContainValue(doc_number)) {
    		f.push(search.createFilter({name: 'formulatext', formula : '{custrecord_scv_pur_req.name}', operator: search.Operator.IS, values: doc_number}));
    	}
    	if(lbf.isContainValue(req_date_ip_from)) {
    		f.push(search.createFilter({name: 'custrecord_scv_req_enter_date', join: 'custrecord_scv_pur_req', operator: search.Operator.ONORAFTER, values: req_date_ip_from}));
    	}
    	if(lbf.isContainValue(req_date_ip_to)) {
    		f.push(search.createFilter({name: 'custrecord_scv_req_enter_date', join: 'custrecord_scv_pur_req', operator: search.Operator.ONORBEFORE, values: req_date_ip_to}));
    	}
    	if(lbf.isContainValue(req_duedate_from)) {
    		f.push(search.createFilter({name: 'custrecord_scv_req_need_date', operator: search.Operator.ONORAFTER, values: req_duedate_from}));
    	}
    	if(lbf.isContainValue(req_duedate_to)) {
    		f.push(search.createFilter({name: 'custrecord_scv_req_need_date', operator: search.Operator.ONORBEFORE, values: req_duedate_to}));
    	}
    	
    }
    
    function pushColumnsFields(columns, fields) {
    	columns.push({name: 'internalid', label: 'Internal Id'});
    	columns.push({name: 'custrecord_scv_pur_req', label: 'Số'});
    	columns.push({name: 'formulatext', label: 'Số', formula: '{custrecord_scv_pur_req}'});
    	columns.push({name: 'custrecord_scv_req_dept', label: 'Department', 'join': 'custrecord_scv_pur_req'});
    	columns.push({name: 'formulatext', label: 'Department', formula: '{custrecord_scv_pur_req.custrecord_scv_req_dept}'});
    	columns.push({name: 'custrecord_scv_req_enter_date', label: 'Ngày nhập Yêu cầu', 'join': 'custrecord_scv_pur_req'});
    	//columns.push({name: 'custrecord_scv_req_date', label: 'Ngày mong đợi nhận hàng', 'join': 'custrecord_scv_pur_req'});
    	columns.push({name: 'custrecord_scv_req_need_date', label: 'Ngày cần'});
    	columns.push({name: 'custrecord_scv_pr_itemcode', label: 'Vật tư'});
    	columns.push({name: 'formulatext', label: 'Vật tư', formula: '{custrecord_scv_pr_itemcode}'});
    	columns.push({name: 'custrecord_scv_pr_itemunit', label: 'Đơn vị tính'});
    	columns.push({name: 'formulatext', label: 'Đơn vị tính', formula: '{custrecord_scv_pr_itemunit}'});
    	columns.push({name: 'custrecord_scv_pr_itemquantity', label: 'Số lượng yêu cầu'});
    	columns.push({name: 'custrecord_scv_pr_poquantity', label: 'Số lượng PO'});
    	columns.push({name: 'formulanumeric', label: 'Số lượng', formula: '{custrecord_scv_pr_itemquantity} - nvl({custrecord_scv_pr_poquantity},0) - nvl({custrecordcustrecord_scv_cancel_qty},0)'});
    	columns.push({name: 'custrecord_scv_pr_itemdes', label: 'Diễn giải'});  
    	columns.push({name: 'cost', label: 'Cost', join: 'custrecord_scv_pr_itemcode'});
    	columns.push({name: 'custrecord_scv_ct_ycmh_scm_si', label: 'SML'});
    	columns.push({name: 'custrecord_scv_req_note', label: 'SML', join: 'custrecord_scv_pur_req'});
    	columns.push({name: 'custrecord_scv_ycmh_project', label: 'PRJ'});
    	
    	fields.push('internalid');
    	fields.push('custrecord_scv_pur_req');
    	fields.push('custrecord_scv_pur_req_text');
    	fields.push('custrecord_scv_req_dept');
    	fields.push('custrecord_scv_req_dept_text');
    	fields.push('custrecord_scv_req_enter_date');
    	//fields.push('custrecord_scv_req_date');
    	fields.push('custrecord_scv_req_need_date');
    	fields.push('custrecord_scv_pr_itemcode');
    	fields.push('custrecord_scv_pr_itemcode_text');
    	fields.push('custrecord_scv_pr_itemunit');
    	fields.push('custrecord_scv_pr_itemunit_text');
    	fields.push('custrecord_scv_pr_itemquantity');
    	fields.push('custrecord_scv_pr_poquantity');
    	fields.push('item_po_quantity');
    	fields.push('custrecord_scv_pr_itemdes');
    	fields.push('cost');
    	fields.push('custrecord_scv_ct_ycmh_scm_si');
    	fields.push('custrecord_scv_req_note');
    	fields.push('custrecord_scv_ycmh_project');
    }
    
    function insertLine(newRecord, request, line, sublistId, timezone) {
    	let newSublist = 'item', newSublistFieldsValue;
		let newSublistFields = ['item', 'department', 'units', 'quantity', 'custcol_scv_po_pr_date', 'custcol_scv_memo', 'rate', 'amount',
		    'custcol_scv_pur_requisition', 'custcol_scv_tc_sltd', 'custcol_scv_tc_sldx', 'cseg_scv_sg_proj', 'custcol_scv_pur_requisition_line'];
		let rate = request.getSublistValue({group: sublistId, name: 'cost', line: line});
		if(lbf.isContainValue(rate) === false) {
			rate = 0;
		}
		//let req_date = format.parse({value: request.getSublistValue({group: sublistId, name: 'custrecord_scv_req_date', line: line}), type: format.Type.DATE, timezone: timezone});
		let need_date = request.getSublistValue({group: sublistId, name: 'custrecord_scv_req_need_date', line: line});
		let req_date = '';
		if(lbf.isContainValue(need_date)) {
			req_date = format.parse({value: need_date, type: format.Type.DATE, timezone: timezone});
		}
		newSublistFieldsValue = [request.getSublistValue({group: sublistId, name: 'custrecord_scv_pr_itemcode', line: line})
			,request.getSublistValue({group: sublistId, name: 'custrecord_scv_req_dept', line: line})
			,request.getSublistValue({group: sublistId, name: 'custrecord_scv_pr_itemunit', line: line})
			,request.getSublistValue({group: sublistId, name: 'item_po_quantity', line: line})
			,req_date
			,request.getSublistValue({group: sublistId, name: 'custrecord_scv_pr_itemdes', line: line})
			,rate, rate * request.getSublistValue({group: sublistId, name: 'item_po_quantity', line: line})
			,request.getSublistValue({group: sublistId, name: 'custrecord_scv_pur_req', line: line})
			,request.getSublistValue({group: sublistId, name: 'item_po_quantity', line: line})
			,request.getSublistValue({group: sublistId, name: 'item_po_quantity', line: line})
			,request.getSublistValue({group: sublistId, name: 'custrecord_scv_ycmh_project', line: line}),
			request.getSublistValue({group: sublistId, name: 'internalid', line: line})
		];
		newRecord.selectNewLine({sublistId: newSublist});
		lbf.setCurrentSublistValueData(newRecord, newSublist, newSublistFields, newSublistFieldsValue);
		newRecord.commitLine({sublistId: newSublist});
    }
    
    function addFieldSearch(form, subsidiary, vendor, req_date_ip_from, req_date_ip_to, req_duedate_from, req_duedate_to, doc_number, location, ordertype) {
    	form.addFieldGroup({
    	    id : 'fieldgroup_req_main',
    	    label : 'Main'
    	});
    	let custpage_subsidiary = form.addField({
	        id: 'custpage_subsidiary', type: serverWidget.FieldType.SELECT,
	        label: 'Subsidiary', source: 'subsidiary', container: 'fieldgroup_req_main'
	    });
    	custpage_subsidiary.defaultValue = subsidiary;
    	custpage_subsidiary.isMandatory = true;
    	
    	let custpage_doc_number = form.addField({
	        id: 'custpage_doc_number', type: serverWidget.FieldType.TEXT,
	        label: 'Số', container: 'fieldgroup_req_main'
	    });
    	custpage_doc_number.defaultValue = doc_number;    	
    	
    	form.addFieldGroup({
    	    id : 'fieldgroup_req_date_ip',
    	    label : 'Ngày nhập yêu cầu:'
    	});
    	let custpage_req_date_ip_from = form.addField({
	        id: 'custpage_req_date_ip_from', type: serverWidget.FieldType.DATE,
	        label: 'From', container: 'fieldgroup_req_date_ip'
	    });
    	custpage_req_date_ip_from.defaultValue = req_date_ip_from;
    	
    	let custpage_req_date_ip_to = form.addField({
	        id: 'custpage_req_date_ip_to', type: serverWidget.FieldType.DATE,
	        label: 'To', container: 'fieldgroup_req_date_ip'
	    });
    	custpage_req_date_ip_to.defaultValue = req_date_ip_to;
    	
    	form.addFieldGroup({
    	    id : 'fieldgroup_req_duedate',
    	    label : 'Ngày yêu cầu dự kiến:'
    	});
    	let custpage_req_duedate_from = form.addField({
	        id: 'custpage_req_duedate_from', type: serverWidget.FieldType.DATE,
	        label: 'From', container: 'fieldgroup_req_duedate'
	    });
    	custpage_req_duedate_from.defaultValue = req_duedate_from;
    	
    	let custpage_req_duedate_to = form.addField({
	        id: 'custpage_req_duedate_to', type: serverWidget.FieldType.DATE,
	        label: 'To', container: 'fieldgroup_req_duedate'
	    });
    	custpage_req_duedate_to.defaultValue = req_duedate_to;
    	
    	form.addFieldGroup({
    	    id : 'fieldgroup_req_vendor',
    	    label : 'Value to Default in PO'
    	});
    	let custpage_vendor = form.addField({
	        id: 'custpage_vendor', type: serverWidget.FieldType.SELECT,
	        label: 'Vendor', container: 'fieldgroup_req_vendor'//, source: 'vendor'
	    });
    	addSelectionVendor(custpage_vendor, subsidiary, vendor);
    	//custpage_ordertype.defaultValue = vendor;
    	custpage_vendor.isMandatory = true;
    	
    	let custpage_location = form.addField({
	        id: 'custpage_location', type: serverWidget.FieldType.SELECT,
	        label: 'Location', container: 'fieldgroup_req_vendor'
	    });
    	addSelectionLocation(custpage_location, subsidiary, location) 
    	custpage_location.isMandatory = true;
    	
    	let custpage_ordertype = form.addField({
	        id: 'custpage_ordertype', type: serverWidget.FieldType.SELECT,
	        label: 'Order Type', container: 'fieldgroup_req_vendor'
	    });
    	addSelectionOrderType(custpage_ordertype, ordertype) 
    	//custpage_ordertype.defaultValue = ordertype;
    	custpage_ordertype.isMandatory = true;
    }
    
    function addSelectionVendor(custpage_vendor, subsidiary, vendor) {
    	let c = ['isprimarysub', 'entity', 'primarycurrency', 'basecurrency'];
    	let s = search.create({
    		type: search.Type.VENDOR_SUBSIDIARY_RELATIONSHIP,
    		filters: [['subsidiary', 'anyOf', subsidiary]],
    		columns: c
    	});
    	
    	let r = s.runPaged({pageSize: 1000});
		let numPage = r.pageRanges.length;
		let searchPage;
		let tempData;
		let numTemp;
		let temp, text, isSelected = false;
		custpage_vendor.addSelectOption({value : '', text : '', isSelected: false});
		for(let np = 0; np < numPage; np++) {
			searchPage = r.fetch({index : np });
    		tempData = searchPage.data;
    		if(tempData !== undefined && tempData !== null && tempData !== '') {
    			numTemp = tempData.length;
    			for(let i = 0; i < numTemp; i++) {
    				temp = tempData[i].getValue(c[1]);
        			text = tempData[i].getText(c[1]);
        			isSelected = temp === vendor;
        			custpage_vendor.addSelectOption({value : temp, text : text, isSelected: isSelected});
	        	}
    		}
		}    	
    }
    
    function addSelectionLocation(custpage_location, subsidiary, location) {
    	let c = ['name', 'namenohierarchy'];
    	let s = search.create({
    		type: search.Type.LOCATION,
    		filters: [['subsidiary', 'anyOf', subsidiary], 'and', ['isinactive', 'is', false]],
    		columns: c
    	});
    	let r = s.run().getRange({start: 0, end: 1000});
    	let rL = r.length;
    	let temp, text, isSelected = false;
    	if(rL > 0) {
    		custpage_location.addSelectOption({value : '', text : '', isSelected: false});
    		for(let i = 0; i < rL; i++) {
    			temp = r[i].id +'';
    			text = r[i].getValue(c[1]);
    			isSelected = temp === location;
    			custpage_location.addSelectOption({value : temp, text : text, isSelected: isSelected});
    		}
    	}
    }
    
    function addSelectionOrderType(custpage_ordertype, ordertype) {
    	let s = search.load('customsearch_scv_ordertyp_for_po');
    	let c = s.columns;
    	let r = s.run().getRange({start: 0, end: 1000});
    	let rL = r.length;
    	let temp, text, isSelected = false;
    	if(rL > 0) {
    		custpage_ordertype.addSelectOption({value : '', text : '', isSelected: false});
    		for(let i = 0; i < rL; i++) {
    			temp = r[i].id +'';
    			text = r[i].getValue(c[0]);
    			isSelected = temp === ordertype;
    			custpage_ordertype.addSelectOption({value : temp, text : text, isSelected: isSelected});
    		}
    	}
    }
    
    return {
        onRequest: onRequest
    };
    
});