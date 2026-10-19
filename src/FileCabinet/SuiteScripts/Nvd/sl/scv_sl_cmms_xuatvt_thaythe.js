/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/format', 'N/record', 'N/redirect', 'N/runtime', 'N/search', 'N/ui/serverWidget', 'N/url',
        '../lib/scv_lib_report.js', '../lib/scv_lib_cmms.js'],
    
    (format, record, redirect, runtime, search, serverWidget, url, libRep, libCmms) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            let request =  scriptContext.request;
            let parameters = request.parameters;
            let response = scriptContext.response;
            
            let currentUser = runtime.getCurrentUser();
            let subsidiary = currentUser.subsidiary;
            let master = getMaster();
            
            if(request.method === 'GET') {
                let {recordTypeScbd, sublistIdBgPlan, scbdId} = libCmms.getScbdInfoBgPlan(parameters);
                let recScbd = record.load({type: recordTypeScbd, id: scbdId});
                parameters.custpage_asset = recScbd.getValue('custrecord_scv_cmms_wo_asset') || recScbd.getValue('custrecord_scv_cmms_mp_asset');
                parameters.custpage_location = parameters.custpage_location ? parameters.custpage_location : search.lookupFields({
                    type: search.Type.ENTITY,
                    id: currentUser.id,
                    columns: ['custentity_scv_cmms_maintenancelocation']
                }).custentity_scv_cmms_maintenancelocation[0]?.value;
                
                let form = createForm(parameters, subsidiary);
                let sublist = createSublist(form, master.sublistId);
                libRep.addFieldHeaderColList(sublist, master.col);
                
                let listData = getListDataBudget(recScbd, sublistIdBgPlan);
                if(listData) {
                    setSublistValueLine(master, sublist, listData);
                }
                response.writePage(form);
            } else {
                if(parameters.isGetData === 'T') {
                    let listItemId = JSON.parse(parameters.items);
                    let listItemAvailable = libCmms.getItemAvailable({location: parameters.custpage_location, items: listItemId}, libRep);
                    //response.setHeader("Content-Type", "text/plain;charset=UTF-8");
                    response.write({output: JSON.stringify({listItemAvailable})});
                } else {
                    let lineCountGroup = request.getLineCount({group: master.sublistId});
                    let isSave = false;
                    let recPurchaseRequest = record.create({type: libCmms.CmmsRecordType.YEU_CAU_NHAP_XUAT, isDynamic: true});
                    setHeaderField(recPurchaseRequest, parameters, subsidiary);
                    let DictDuToan = {};
                    for(let i = 0; i < lineCountGroup; i++) {
                        let chon = request.getSublistValue({group: master.sublistId, name: 'chon', line: i});
                        if(chon === 'T') {
                            isSave = true;
                            setCurrentSublistValue(DictDuToan, recPurchaseRequest, libCmms.CmmsSublistId.ITEM, master, parameters, request, i);
                        }
                    }
                    if (isSave) {
                        let purchaseRequestId = recPurchaseRequest.save({ignoreMandatoryFields: true});
                        updateSCBDDuToan(DictDuToan, parameters);
                        libCmms.writeRedirectToRecord(response, purchaseRequestId, libCmms.CmmsRecordType.YEU_CAU_NHAP_XUAT, true);
                    } else {
                        redirect.toSuitelet({
                            scriptId: 'customscript_scv_sl_cmms_xuatvt_thaythe',
                            deploymentId: 'customdeploy_scv_sl_cmms_xuatvt_thaythe',
                            isExternal: false,
                            parameters: copyParameters(parameters)
                        });
                    }
                }
            }
        }
        
        const updateSCBDDuToan = (DictDuToan, parameters) => {
            let {recordTypeScbd, sublistIdBgPlan, scbdId} = libCmms.getScbdInfoBgPlan(parameters);
            let listKeyDuToan = Object.keys(DictDuToan);
            if(listKeyDuToan.length > 2) {
                let recScbd = record.load({type: recordTypeScbd, id: scbdId});
                let lcDuToan = recScbd.getLineCount({sublistId: sublistIdBgPlan});
                for(let i = 0; i < lcDuToan; i++) {
                    let dutoan_id = String(recScbd.getSublistValue({sublistId: sublistIdBgPlan, fieldId: 'id', line: i}));
                    let replacementqty = Number(recScbd.getSublistValue({sublistId: sublistIdBgPlan, fieldId: 'custrecord_scv_cmms_bg_replacementqty', line: i}) || 0);
                    if(DictDuToan[dutoan_id] !== undefined) {
                        recScbd.setSublistValue({
                            sublistId: sublistIdBgPlan,
                            fieldId: 'custrecord_scv_cmms_bg_replacementqty',
                            line: i,
                            value: DictDuToan[dutoan_id] + replacementqty
                        });
                    }
                }
                recScbd.save({ignoreMandatoryFields: true});
            } else {
                for(let keyDuToan of listKeyDuToan) {
                    let lkDuToan = search.lookupFields({type: libCmms.CmmsRecordType.SCBD_DU_TOAN, id: keyDuToan, columns: ['custrecord_scv_cmms_bg_replacementqty']});
                    let replacementqty = Number(lkDuToan.custrecord_scv_cmms_bg_replacementqty || 0);
                    record.submitFields({type: libCmms.CmmsRecordType.SCBD_DU_TOAN, id: keyDuToan, values: {custrecord_scv_cmms_bg_replacementqty: DictDuToan[keyDuToan] + replacementqty}});
                }
            }
        }
        
        const copyParameters = (parameters) => {
            return {
                custpage_subsidiary: parameters.custpage_subsidiary,
                custpage_asset: parameters.custpage_asset,
                custpage_location: parameters.custpage_location,
                custpage_trandate: parameters.custpage_trandate,
                custpage_scbd: parameters.custpage_scbd,
                custpage_khbd: parameters.custpage_khbd
            }
        }
        
        const setHeaderField = (recPurchaseRequest, parameters, subsidiary) => {
            let {recordTypeScbd, scbdId, fieldIdCreateby} = libCmms.getScbdInfoBgPlan(parameters);
            let createby = search.lookupFields({type: recordTypeScbd, id: scbdId, columns: [fieldIdCreateby]})[fieldIdCreateby][0]?.value;
            if(!createby) {
                let currentUser = runtime.getCurrentUser();
                if(libCmms.isAPCCenter(runtime)) {
                    let lkPartner = search.lookupFields({type: search.Type.PARTNER, id: currentUser.id, columns: ['custentity_scv_partner_employee']});
                    createby = lkPartner.custentity_scv_partner_employee[0]?.value
                } else {
                    createby = currentUser.id;
                }
            }
            
            recPurchaseRequest.setValue('custbody_scv_order_type', parameters.custpage_ordertype);
            recPurchaseRequest.setValue('entity', libCmms.Entity.DEFAULT_PURCHASE_REQUEST);
            recPurchaseRequest.setValue('subsidiary', subsidiary);
            recPurchaseRequest.setValue('location', parameters.custpage_location);
            recPurchaseRequest.setText('trandate', parameters.custpage_trandate);
            recPurchaseRequest.setValue('custbody_scv_employee_ycxvt', createby);
            recPurchaseRequest.setValue('department', runtime.getCurrentUser().department);
            
            //let lkOrderType = search.lookupFields({type: libCmms.CmmsRecordType.ORDER_TYPE, id: libCmms.CmmsOrderType.VAT_TU_SUA_CHUA_BAO_DUONG, columns: ['custrecord_scv_adjust_account']});
            //recPurchaseRequest.setValue('account', lkOrderType.custrecord_scv_adjust_account[0]?.value);
            
            recPurchaseRequest.setValue('custbody_scv_cmms_workorder', parameters.custpage_scbd || '');
            recPurchaseRequest.setValue('custbody_scv_cmms_plan', parameters.custpage_khbd || '');
        }
        
        const setCurrentSublistValue = (DictDuToan, recPurchaseRequest, sublistId, master, parameters, request, line) => {
            let issueinventorynumber = request.getSublistValue({group: master.sublistId, name: 'custpage_issueinventorynumber', line: line});
            let binnumber = request.getSublistValue({group: master.sublistId, name: 'custpage_binnumber', line: line});
            let inventorystatus = request.getSublistValue({group: master.sublistId, name: 'custpage_inventorystatus', line: line});
            let actualquantity = request.getSublistValue({group: master.sublistId, name: 'custrecord_scv_cmms_bg_actualquantity', line: line});
            let dutoan_id = request.getSublistValue({group: master.sublistId, name: 'dutoan_id', line: line});
            if(!DictDuToan[dutoan_id]) {
                DictDuToan[dutoan_id] = Number(actualquantity);
            } else {
                DictDuToan[dutoan_id] += Number(actualquantity);
            }
            //let quantity = actualquantity * -1;
            recPurchaseRequest.setCurrentSublistValue({sublistId: sublistId, fieldId: 'item', value: request.getSublistValue({group: master.sublistId, name: 'custrecord_scv_cmms_bg_actualitem', line: line})});
            recPurchaseRequest.setCurrentSublistValue({sublistId: sublistId, fieldId: 'location', value: parameters.custpage_location});
            recPurchaseRequest.setCurrentSublistValue({sublistId: sublistId, fieldId: 'units', value: request.getSublistValue({group: master.sublistId, name: 'custrecord_scv_cmms_bg_unit', line: line})});
            recPurchaseRequest.setCurrentSublistValue({sublistId: sublistId, fieldId: 'quantity', value: actualquantity});//Voi truong hop xuat can lam the nay thi cac phan lien quan den bin khi set detail se ko bi loi invalid
            recPurchaseRequest.setCurrentSublistValue({sublistId: sublistId, fieldId: 'custcol_far_trn_relatedasset', value: parameters.custpage_asset});
            recPurchaseRequest.setCurrentSublistValue({sublistId: sublistId, fieldId: 'amount', value: 0});
            let subrecordInventoryDetail = recPurchaseRequest.getCurrentSublistSubrecord({sublistId: sublistId, fieldId: 'inventorydetail'});
            
            setCurrentInventoryDetail(subrecordInventoryDetail, {issueinventorynumber, binnumber, quantity: actualquantity, inventorystatus});
            recPurchaseRequest.commitLine({sublistId: sublistId});
        }
        
        const setCurrentInventoryDetail = (subrecordInventoryDetail, objInventory) => {
            if(subrecordInventoryDetail) {
                let sublistIdIva = libCmms.CmmsSublistId.INVENTORY_ASSIGNMENT;
                let lineCountIvd = subrecordInventoryDetail.getLineCount(sublistIdIva);
                if(lineCountIvd) {
                    subrecordInventoryDetail.selectLine({sublistId: sublistIdIva, line: 0});
                }
                subrecordInventoryDetail.setCurrentSublistValue({sublistId: sublistIdIva, fieldId: 'issueinventorynumber', value: objInventory.issueinventorynumber});
                subrecordInventoryDetail.setCurrentSublistValue({sublistId: sublistIdIva, fieldId: 'binnumber', value: objInventory.binnumber});
                subrecordInventoryDetail.setCurrentSublistValue({sublistId: sublistIdIva, fieldId: 'inventorystatus', value: objInventory.inventorystatus});
                subrecordInventoryDetail.setCurrentSublistValue({sublistId: sublistIdIva, fieldId: 'quantity', value: objInventory.quantity});
                subrecordInventoryDetail.commitLine({sublistId: sublistIdIva});
            }
        }
        
        const setSublistValueLine = (master, sublist, listData) => {
            let line = 0;
            for(let objData of listData) {
                for(let objCol of master.col) {
                    let tempValue = objData[objCol.id];
                    if(tempValue) {
                        sublist.setSublistValue({id : objCol.id, line : line, value : tempValue});
                    }
                }
                line++;
            }
        }
        
        const createForm = (parameters, subsidiary) => {
            let form = serverWidget.createForm({title: "Xuất vật tư thay thế"});
            form.clientScriptModulePath = '../cs/scv_cs_cmms_xuatvt_thaythe.js';
            let container = 'fieldgroup_dc_main';
            form.addFieldGroup({id: container, label: ' '});
            
            libRep.addFieldHidden(form, 'custpage_subsidiary', subsidiary);
            //lrp.addFieldHidden(form, 'custpage_asset', parameters.custpage_asset);
            
            let fieldLocation = form.addField({
                id: 'custpage_location',
                type: serverWidget.FieldType.SELECT,
                label: 'Kho',
                container: container
            });
            fieldLocation.isMandatory = true;
            let filterLocation = [search.createFilter({name: 'isinactive', operator: search.Operator.IS, values: false}),
                search.createFilter({name: 'subsidiary', operator: search.Operator.ANYOF, values: subsidiary}),
                search.createFilter({name: 'custrecord_scv_cmms_location', operator: search.Operator.IS, values: true})
            ];
            libRep.addSelection(fieldLocation, 'location', ['internalid', 'name'], filterLocation, true, parameters.custpage_location);
            
            let dateDefault = getDateDefault(parameters);
            let fieldTrandate = form.addField({
                id: 'custpage_trandate',
                type: serverWidget.FieldType.DATE,
                label: 'Ngày',
                container: container
            });
            fieldTrandate.defaultValue = dateDefault.trandate;
            fieldTrandate.isMandatory = true;
            
            let fieldOrderType = form.addField({
                id: 'custpage_ordertype',
                type: serverWidget.FieldType.SELECT,
                label: 'Loại yêu cầu',
                container: container
            });
            fieldOrderType.isMandatory = true;
            let filterOrderType = [search.createFilter({name: 'isinactive', operator: search.Operator.IS, values: false}),
                search.createFilter({name: 'custrecord_scv_order_type_subsidiary', operator: search.Operator.ANYOF, values: subsidiary}),
                search.createFilter({name: 'custrecord_scv_app_trans_type', operator: search.Operator.ANYOF, values: '114'})
            ];//114 YCNX
            libRep.addSelection(fieldOrderType, 'customrecord_scv_order_type', ['internalid', 'name'], filterOrderType, true, parameters.custpage_ordertype);
            
            let {recordTypeScbd, scbdId, labelScbd, custpageScbd} = libCmms.getScbdInfoBgPlan(parameters);
            let fieldScbd = form.addField({
                id: custpageScbd,
                type: serverWidget.FieldType.SELECT,
                label: labelScbd, source: recordTypeScbd,
                container: container
            });
            fieldScbd.defaultValue = scbdId;
            fieldScbd.isMandatory = true;
            fieldScbd.updateDisplayType({displayType: serverWidget.FieldDisplayType.DISABLED});
            
            let fieldAsset = form.addField({
                id: 'custpage_asset',
                type: serverWidget.FieldType.SELECT,
                label: 'Tài sản', source: 'customrecord_ncfar_asset',
                container: container
            });
            fieldAsset.defaultValue = parameters.custpage_asset;
            //fieldAsset.isMandatory = true;
            fieldAsset.updateDisplayType({displayType: serverWidget.FieldDisplayType.DISABLED});
            
            form.addSubmitButton({label: 'Tạo'});
            
            return form;
        }
        
        const getDateDefault = (parameters) => {
            let trandate = parameters.custpage_trandate;
            if(!trandate) {
                trandate = format.format({type: format.Type.DATE, value: libCmms.getDateNow(7)});
            }
            return {trandate}
        }
        
        const createSublist = (form, sublistId) => {
            let sublist = form.addSublist({
                id: sublistId,
                type: serverWidget.SublistType.LIST,
                label: 'Kết quả'
            });
            //sublist.addMarkAllButtons();
            sublist.addButton({id: 'custpage_bt_markall',  label: 'Mark All', functionName: 'markAll'});
            sublist.addButton({id: 'custpage_bt_unmarkall',  label: 'Unmark All', functionName: 'unmarkAll'});
            
            return sublist;
        }
        
        const getMaster = () => {
            let col = [
                {id: 'chon', label: 'Chọn', type: serverWidget.FieldType.CHECKBOX},
                {id: 'dutoan_id', label: 'Du toan ID', type: 'text', display: 'hidden'},
                {id: 'custrecord_scv_cmms_bg_actualitem', label: 'Vật tư', type: 'text', display: 'hidden'},
                {id: 'custrecord_scv_cmms_bg_actualitem_display', label: 'Vật tư', type: 'text', display: 'disabled'},
                {id: 'custrecord_scv_cmms_bg_unit', label: 'Đơn vị tính', type: 'text', display: 'hidden'},
                {id: 'custrecord_scv_cmms_bg_unit_display', label: 'Đơn vị tính', type: 'text', display: 'disabled'},
                {id: 'custpage_issueinventorynumber', label: 'Searial/Lot Number', type: serverWidget.FieldType.SELECT, display: serverWidget.FieldDisplayType.ENTRY},
                {id: 'custpage_binnumber', label: 'Bin', type: serverWidget.FieldType.SELECT, display: serverWidget.FieldDisplayType.ENTRY},
                
                {id: 'custrecord_scv_cmms_bg_actualquantity', label: 'Số lượng', type: 'float', display: serverWidget.FieldDisplayType.ENTRY},
                {id: 'custpage_inventorystatus', label: 'Trạng thái', type: serverWidget.FieldType.SELECT, display: serverWidget.FieldDisplayType.ENTRY},//, source: 'inventorystatus'
                {id: 'custrecord_scv_cmms_bg_actualquantity_display', label: 'Số lượng', type: 'float', display: 'hidden'},
                {id: 'custpage_quantityavailable', label: 'SL khả dụng', type: 'float', display: serverWidget.FieldDisplayType.ENTRY},
                {id: 'islotitem', label: 'IS LOT', type: 'text', display: 'hidden'},
                {id: 'usebins', label: 'Use Bins', type: 'text', display: 'hidden'}
            ];
            return {sublistId: 'custpage_sl_result', col};
        }
        
        const getListDataBudget = (recScbd, sublistId) => {
            let listData = [];
            let lineCountDuToan = recScbd.getLineCount({sublistId: sublistId});
            for(let i = 0; i < lineCountDuToan; i++) {
                let actualquantity = recScbd.getSublistValue({sublistId: sublistId, fieldId: 'custrecord_scv_cmms_bg_actualquantity', line: i}) -
                    (recScbd.getSublistValue({sublistId: sublistId, fieldId: 'custrecord_scv_cmms_bg_replacementqty', line: i}) || 0);
                let actualitem = recScbd.getSublistValue({sublistId: sublistId, fieldId: 'custrecord_scv_cmms_bg_actualitem', line: i});
                if(actualitem && actualquantity > 0) {
                    let lkItem = search.lookupFields({type: search.Type.ITEM, id: actualitem, columns: ['stockunit', 'islotitem', 'usebins']});
                    let stockUnit = lkItem.stockunit[0];
                    
                    listData.push({
                        chon: 'T',
                        dutoan_id: recScbd.getSublistValue({sublistId: sublistId, fieldId: 'id', line: i}),
                        custrecord_scv_cmms_bg_actualitem: actualitem,
                        custrecord_scv_cmms_bg_actualitem_display: recScbd.getSublistText({sublistId: sublistId, fieldId: 'custrecord_scv_cmms_bg_actualitem', line: i}),
                        custrecord_scv_cmms_bg_unit: stockUnit?.value,
                        custrecord_scv_cmms_bg_unit_display: stockUnit?.text,
                        custrecord_scv_cmms_bg_actualquantity: actualquantity,
                        custrecord_scv_cmms_bg_actualquantity_display: actualquantity,
                        custpage_inventorystatus: libCmms.InventoryStatus.MOI_DAT_CHAT_LUONG,
                        islotitem: lkItem.islotitem,
                        usebins: lkItem.usebins
                    });
                }
                
            }
            return listData;
        }
        
        return {onRequest}

    });
