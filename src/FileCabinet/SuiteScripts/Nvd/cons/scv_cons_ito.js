/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  16 Jan 2025         Khanh Tran              Init & create file. Create WO from mr. Việt (https://app.clickup.com/t/86cxnyadd)   
 *  27 Feb 2025         Huy Pham			    Tạo Intercompany Transfer Order từ SO, from ms.Ngọc(https://app.clickup.com/t/86cy2vkkk)          
 */
define(['N/url', 'N/record', 'N/search', 
	'../lib/scv_lib_function.js',
	'../cons/scv_cons_approvalstatus.js',
	'../cons/scv_cons_ordertype.js',
	'../cons/scv_cons_search_ito_bom.js',

],
function(url, record, search,
	lbf,
	constApprStatus,
	constOrderType,
	constSearchItoBom
) {
	const TYPE = "intercompanytransferorder";

	const FIELD = {
		ID: "id",
		INACTIVE: "isinactive",
		NAME: "name"
	}

	const addBtnCrtWO = (form, curRec) => {
        let isShowBtn = isCrtWO(curRec);
		if(isShowBtn){
			let urlScript = url.resolveScript({
				scriptId: 'customscript_scv_sl_crt_wo_from_ito',
				deploymentId: 'customdeploy_scv_sl_crt_wo_from_ito',
				params: { recType: curRec.type, recId: curRec.id }
			});
	
			form.addButton({
				id: "custpage_scv_btn_crt_wo",
				label: "Tạo YCSX",
				functionName: `window.location.replace('${urlScript}')`
			});
		}
	}

	const crtWO = (params) => {
		let curRec = record.load({type: params.recType, id: params. recId, isDynamic: true});
		let isValid = isCrtWO(curRec);
		if(!isValid) return;

		let objDataCrtWO = getDataCrtWO(curRec);
		let arrWO = createWorkOrders(objDataCrtWO);
		updateOriginalRecord(curRec, arrWO);
	}

	const updateOriginalRecord = (curRec, arrWO) => {
		let slItem = 'item';
		for(let i = 0; i < curRec.getLineCount(slItem); i++){
			let isCrt = isLineNotCreatedWO(curRec, slItem, i);
			if(!isCrt) continue;

			let item = curRec.getSublistValue({sublistId : slItem, fieldId : 'item', line : i});
			let line_id = curRec.getSublistValue({sublistId : slItem, fieldId : 'id', line : i});
			let objWO = arrWO.find(e => e.item == item && e.line_id == line_id);
			if(!objWO) continue;

			curRec.selectLine({sublistId: slItem, line: i});
			curRec.setCurrentSublistValue({sublistId: slItem, fieldId: 'custcol_scv_tl_wo', value: objWO.tl_wo});
			curRec.commitLine({sublistId: slItem});
		}

		curRec.save({enableSourcing: false, ignoreMandatoryFields: false});
	}

	const createWorkOrders = (params) => {
		let arrWO = [];
		let arrItem = params.arrItem;
		arrItem.forEach(objItem => {
			let woRec = record.create({type: 'workorder', isDynamic: true});
			lbf.setValueData(woRec, [
				'custbody_scv_created_transaction', 'custbody_scv_order_type', 
				'trandate', 'custbody_scv_approval_status', 'memo',
				'subsidiary', 'assemblyitem', 'location', 'quantity',
				'billofmaterials', 'billofmaterialsrevision', 'custbody_scv_work_order_type', 
				'requesteddate'
			], [
				params.tranid, params.order_type, 
				params.trandate, constApprStatus.RECORDS.OPEN.ID, params.memo,
				params.subsidiary, objItem.item, objItem.location, objItem.quantity,
				objItem.bom_id, objItem.bom_revision_id, objItem.wo_type, 
				objItem.requesteddate
			]);
			
			try {
				let woRecId = woRec.save({enableSourcing: false, ignoreMandatoryFields: true});
				arrWO.push({item: objItem.item, line_id: objItem.line_id, tl_wo: woRecId});
			} catch (error) {
				log.error('error', error)
			}
		});

		return arrWO;
	}

	const getDataCrtWO = (curRec) => {
		let arrSS = constSearchItoBom.getDataSource([
			search.createFilter({
				formula: `CASE WHEN ({subsidiary} = '${curRec.getValue('subsidiary')}' OR ({includechildren} = 'true' AND {subsidiary} = '1')) THEN '1' ELSE '0' END`,
				name: 'formulanumeric', operator: 'is', values: '1'
			})
		]);

		let arrItem = [];
		let slItem = 'item';
		let objHeader = {};
		objHeader.tranid = curRec.id;
		objHeader.work_order_type = curRec.getValue('custbody_scv_work_order_type');
		objHeader.order_type = curRec.getValue('custbody_scv_order_type');
		objHeader.trandate = curRec.getValue('trandate');
		objHeader.approval_status = curRec.getValue('custbody_scv_approval_status');
		objHeader.memo = curRec.getValue('memo');
		objHeader.subsidiary = curRec.getValue('subsidiary');
		objHeader.location = curRec.getValue('location');
        for(let i = 0; i < curRec.getLineCount(slItem); i++){
			let isCrt = isLineNotCreatedWO(curRec, slItem, i);
			if(!isCrt) continue;
			
			let obj = {};
			obj.item = curRec.getSublistValue({sublistId: slItem, fieldId: 'item', line: i});
			let objSS = arrSS.find(e => e.item == obj.item);
			if(!objSS)continue;

			obj.quantity = curRec.getSublistValue({sublistId: slItem, fieldId: 'quantity', line: i}) * 1;
			obj.line_id = curRec.getSublistValue({sublistId: slItem, fieldId: 'id', line: i});
			obj.wo_type = curRec.getSublistValue({sublistId: slItem, fieldId: 'custcol_scv_wo_type', line: i});
			obj.location = curRec.getSublistValue({sublistId: slItem, fieldId: 'custcol_scv_default_location', line: i});
			obj.requesteddate = curRec.getSublistValue({sublistId: slItem, fieldId: 'requesteddate', line: i});
			obj.bom_id = objSS.bom_id;
			obj.bom_revision_id = objSS.bom_revision_id;
			arrItem.push(obj);
        }

		return {
			arrItem: arrItem, ...objHeader
		};
	}

	const isCrtWO = (curRec) => {
		let tosubsidiary = curRec.getValue('tosubsidiary');
		if(!tosubsidiary) return false;

		let approval_status = curRec.getValue("custbody_scv_approval_status");
        if(approval_status != constApprStatus.RECORDS.CHO_XAC_NHAN.ID) return false;

        let slItem = 'item';
        for(let i = 0; i < curRec.getLineCount(slItem); i++){
			let isCrt = isLineNotCreatedWO(curRec, slItem, i);
			if(isCrt) return true;
        }
	}

	const isLineNotCreatedWO = (curRec, slItem, line) => {
		let tl_wo = curRec.getSublistValue({sublistId: slItem, fieldId : 'custcol_scv_tl_wo', line : line});
		let auto_create_wo = curRec.getSublistValue({sublistId: slItem, fieldId : 'custcol_scv_auto_create_wo1', line : line});
		return !tl_wo && auto_create_wo;
	}

	const addBtnSO2InTO = (_form, _sourceRec) => {
		let order_type_id = _sourceRec.getValue("custbody_scv_order_type");
		if(order_type_id != constOrderType.RECORDS.MUA_BAN_NOI_BO.ID) return;

		let urlScript = url.resolveScript({
			scriptId: 'customscript_scv_sl_so2into',
			deploymentId: 'customdeploy_scv_sl_so2into',
			params: {
				custpage_transaction: _sourceRec.id
			}
		});

		_form.addButton({
			id: "custpage_scv_btn_so2into",
			label: "Tạo YC MHNB",
			functionName: `nlExtOpenWindow('${urlScript}', 'popupSO2InTO', window.innerWidth - 400, window.innerHeight - 300, this, true, "Tạo yêu cầu mua hàng nội bộ");`
		});
	}

    return {
		TYPE,
		FIELD,
		addBtnCrtWO,
		crtWO,
		addBtnSO2InTO
    };
    
});
