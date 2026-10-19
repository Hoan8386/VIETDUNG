/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  08 Nov 2024         Khanh Tran              Init & create file. Create WO from mr. Bính (https://app.clickup.com/t/86cx0f856)             
 */
define(['N/url', 'N/record', '../lib/scv_lib_function.js',
	'../cons/scv_cons_approvalstatus.js'
],
function(url, record, lbf,
	constApprStatus
) {
	const TYPE = "custompurchase_scv_other_work_order";

	const FIELD = {
		ID: "id",
		INACTIVE: "isinactive",
		NAME: "name"
	}

	const addBtnCrtWO = (form, newRec) => {
        let isShowBtn = isCrtWO(newRec);
		if(isShowBtn){
			let urlScript = url.resolveScript({
				scriptId: 'customscript_scv_sl_crt_wo_from_owo',
				deploymentId: 'customdeploy_scv_sl_crt_wo_from_owo',
				params: { recType: newRec.type, recId: newRec.id }
			});
	
			form.addButton({
				id: "custpage_scv_btn_crt_wo",
				label: "Create WO",
				functionName: `window.location.replace('${urlScript}')`
			});
		}
	}

	const createMultiWO = (params) => {
		let curRec = record.load({type: params.recType, id: params. recId, isDynamic: true});
		let isValid = isCrtWO(curRec);
		if(!isValid) return;

		let objDataCrtWO = getDataCrtWO(curRec);
		let arrWO = createWorkOrders(objDataCrtWO);
		if(arrWO.length > 0) updateOriginalRecord(curRec, arrWO);
	}

	const updateOriginalRecord = (curRec, arrWO) => {
		let slItem = 'item';
		let isSave = false;
		for(let i = 0; i < curRec.getLineCount(slItem); i++){
			let tl_wo = curRec.getSublistValue({sublistId : slItem, fieldId : 'custcol_scv_tl_wo', line : i});
            if(tl_wo) continue;

			let assembly = curRec.getSublistValue({sublistId : slItem, fieldId : 'custcol_scv_owo_assembly', line : i});
			let line_id = curRec.getSublistValue({sublistId : slItem, fieldId : 'id', line : i});
			let objWO = arrWO.find(e => e.assembly == assembly && e.line_id == line_id);
			if(!objWO) continue;

			isSave = true;
			curRec.selectLine({sublistId: slItem, line: i});
			curRec.setCurrentSublistValue({sublistId: slItem, fieldId: 'custcol_scv_tl_wo', value: objWO.tl_wo});
			curRec.commitLine({sublistId: slItem});
		}

		if(isSave) curRec.save({enableSourcing: false, ignoreMandatoryFields: false});
	}

	const createWorkOrders = (params) => {
		let arrWO = [];
		let slItem = 'item';
		let arrItem = params.arrItem;
		arrItem.forEach(objItem => {
			let woRec = record.create({type: 'workorder', isDynamic: true});
			let fields = [
				'custbody_scv_created_transaction', 'custbody_scv_work_order_type', 'custbody_scv_order_type', 
				'trandate', 'custbody_scv_approval_status', 'memo',
				'subsidiary', 'assemblyitem', 
				'location', 'quantity', 'custbody_mfgmob_workcenter', 'custbody_scv_work_bench', 
				'billofmaterials', 'billofmaterialsrevision', 'custbody_scv_assembly_lot',
				'custbody_scv_so_thong_ke_sx', 'orderstatus',
				'custbody_scv_apprver_wo', 'custbody_scv_date_approve_wo',
			];
			let data = [
				params.transactionnumber, params.work_order_type, params.order_type, 
				params.trandate, params.approval_status, params.memo,
				params.subsidiary, objItem.assembly, 
				params.location, objItem.plan_qty, params.mfgmob_workcenter, params.work_bench, 
				objItem.bom, objItem.bom_revision, params.assembly_lot,
				params.so_thong_ke_sx, 'B',
				params.apprver_wo, params.date_approve_wo
			];
			lbf.setValueData(woRec, fields, data);
			woRec.selectNewLine({sublistId: slItem})
			woRec.setCurrentSublistValue({sublistId: slItem, fieldId: 'item', value: objItem.item});
			woRec.setCurrentSublistValue({sublistId: slItem, fieldId: 'quantity', value: objItem.comp_qty});
			woRec.setCurrentSublistValue({sublistId: slItem, fieldId: 'units', value: objItem.units});
			woRec.setCurrentSublistValue({sublistId: slItem, fieldId: 'custcol_scv_lot_serial_selected', value: objItem.lot_serial_selected});
			woRec.setCurrentSublistValue({sublistId: slItem, fieldId: 'custcol_scv_qc_serial_code', value: objItem.qc_serial_code});
			woRec.setCurrentSublistValue({sublistId: slItem, fieldId: 'custcol_scv_lot_serial_status', value: objItem.lot_serial_status});
			woRec.setCurrentSublistValue({sublistId: slItem, fieldId: 'custcol_scv_lot_serial_multi', value: objItem.lot_serial_multi});
			woRec.setCurrentSublistValue({sublistId: slItem, fieldId: 'custcol_scv_bom_std_qty', value: objItem.comp_qty});
			woRec.setCurrentSublistValue({sublistId: slItem, fieldId: 'custcol_scv_tc_wo_org_ite_qty', value: objItem.comp_qty});
			woRec.commitLine({sublistId: slItem});
			try {
				let woRecId = woRec.save({enableSourcing: false, ignoreMandatoryFields: true});
				arrWO.push({assembly: objItem.assembly, line_id: objItem.line_id, tl_wo: woRecId});
			} catch (error) {
				log.error('error', error)
			}
		});

		return arrWO;
	}

	const getDataCrtWO = (curRec) => {
		let arrItem = [];
		let slItem = 'item';
		let objHeader = {};
		objHeader.transactionnumber = curRec.id;
		objHeader.work_order_type = curRec.getValue('custbody_scv_work_order_type');
		objHeader.order_type = curRec.getValue('custbody_scv_order_type');
		objHeader.trandate = curRec.getValue('trandate');
		objHeader.approval_status = curRec.getValue('custbody_scv_approval_status');
		objHeader.memo = curRec.getValue('memo');
		objHeader.subsidiary = curRec.getValue('subsidiary');
		objHeader.location = curRec.getValue('location');
		objHeader.mfgmob_workcenter = curRec.getValue('custbody_mfgmob_workcenter');
		objHeader.work_bench = curRec.getValue('custbody_scv_work_bench');
		objHeader.assembly_lot = curRec.getValue('custbody_scv_assembly_lot');
		objHeader.so_thong_ke_sx = curRec.getValue('custbody_scv_so_thong_ke_sx');
		objHeader.apprver_wo = curRec.getValue('custbody_scv_apprver_wo');
		objHeader.date_approve_wo = curRec.getValue('custbody_scv_date_approve_wo');
        for(let i = 0; i < curRec.getLineCount(slItem); i++){
            let tl_wo = curRec.getSublistValue({sublistId: slItem, fieldId: 'custcol_scv_tl_wo', line: i});
            if(tl_wo) continue;

			let obj = {};
			obj.line_id = curRec.getSublistValue({sublistId: slItem, fieldId: 'id', line: i});
			obj.assembly = curRec.getSublistValue({sublistId: slItem, fieldId: 'custcol_scv_owo_assembly', line: i});
			obj.plan_qty = curRec.getSublistValue({sublistId: slItem, fieldId: 'custcol_scv_plan_qty', line: i}) * 1;
			obj.bom = curRec.getSublistValue({sublistId: slItem, fieldId: 'custcol_scv_owo_bom', line: i});
			obj.bom_revision = curRec.getSublistValue({sublistId: slItem, fieldId: 'custcol_scv_owo_bom_revision', line: i});
			obj.item = curRec.getSublistValue({sublistId: slItem, fieldId: 'item', line: i});
			obj.comp_qty = curRec.getSublistValue({sublistId: slItem, fieldId: 'custcol_scv_owo_comp_qty', line: i}) * 1;
			obj.units = curRec.getSublistValue({sublistId: slItem, fieldId: 'units', line: i});
			obj.lot_serial_selected = curRec.getSublistValue({sublistId: slItem, fieldId: 'custcol_scv_lot_serial_selected', line: i});
			obj.qc_serial_code = curRec.getSublistValue({sublistId: slItem, fieldId: 'custcol_scv_qc_serial_code', line: i});
			obj.lot_serial_status = curRec.getSublistValue({sublistId: slItem, fieldId: 'custcol_scv_lot_serial_status', line: i});
			obj.lot_serial_multi = curRec.getSublistValue({sublistId: slItem, fieldId: 'custcol_scv_lot_serial_multi', line: i});
			arrItem.push(obj);
        }

		return {
			arrItem: arrItem, ...objHeader
		};
	}

	const isCrtWO = (newRec) => {
		let isRun = false;
		let approval_status = newRec.getValue("custbody_scv_approval_status");
        if(approval_status != constApprStatus.RECORDS.APPROVED.ID) return isRun;

        let slItem = 'item';
        for(let i = 0; i < newRec.getLineCount(slItem); i++){
            let tl_wo = newRec.getSublistValue({sublistId: slItem, fieldId: 'custcol_scv_tl_wo', line: i});
            if(!tl_wo){
				isRun = true;
				break;
			}
        }

		return isRun;
	}

	const createMultiWOAfterApproval = (newRec, oldRec) => {
		let curRec = record.load({type: newRec.type, id: newRec.id, isDynamic: true});
		if(!curRec.getValue('custbody_scv_autogeneratechildwo')) return;
		if(!isCrtWO(curRec)) return; 
		if(oldRec && oldRec.getValue('custbody_scv_approval_status') == curRec.getValue('custbody_scv_approval_status')) return;
		let objDataCrtWO = getDataCrtWO(curRec);
		let arrWO = createWorkOrders(objDataCrtWO);
		if(arrWO.length > 0) updateOriginalRecord(curRec, arrWO);
	}

    return {
		TYPE,
		FIELD,
		addBtnCrtWO,
		createMultiWO,
		createMultiWOAfterApproval
    };
    
});
