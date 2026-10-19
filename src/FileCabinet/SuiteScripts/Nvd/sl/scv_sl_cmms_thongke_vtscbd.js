/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/format', 'N/record', 'N/redirect', 'N/runtime', 'N/search', 'N/ui/serverWidget',
        '../lib/scv_lib_report.js', '../lib/scv_lib_cmms.js'],
    
    (format, record, redirect, runtime, search, serverWidget, libRep,  libCmms) => {
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
            
            let subsidiary = parameters.custpage_subsidiary || (runtime.getCurrentUser().subsidiary + '');
            let master = getMaster();
            
            if(request.method === 'GET') {
                let form = createForm(parameters, subsidiary);
                let sublist = createSublist(form, master.sublistId);
                libRep.addFieldHeaderColList(sublist, master.col);
                
                let listData = parameters.issearch === 'T' ? getListDataThongKeSuaChuaBaoDuong(parameters, subsidiary) : [];
                if(listData) {
                    setSublistValueLine(master, sublist, listData);
                }
                response.writePage(form);
            } else {
                let lineCountGroup = request.getLineCount({group: master.sublistId});
                let recTransaction, isSave;
                let typeToCreate = parameters.custpage_type;
                if(typeToCreate === record.Type.TRANSFER_ORDER) {
                    recTransaction = record.create({type: record.Type.TRANSFER_ORDER, isDynamic: true});
                    setHeaderFieldTransferOrder(recTransaction, subsidiary);
                    isSave = setCurrentSublistValueTransferOrder(recTransaction, master, request, lineCountGroup);
                } else {
                    recTransaction = record.create({type: libCmms.CmmsRecordType.PURCHASE_REQUEST, isDynamic: true});
                    setHeaderFieldPurchaseRequest(recTransaction, subsidiary);
                    isSave = setCurrentSublistValuePurchaseRequest(recTransaction, master, request, lineCountGroup);
                }
                
                if (isSave) {
                    let transactionId = recTransaction.save({ignoreMandatoryFields: true});
                    redirect.toRecord({type: recTransaction.type, id: transactionId});
                } else {
                    redirect.toSuitelet({
                        scriptId: 'customscript_scv_sl_cmms_thongke_vtscbd',
                        deploymentId: 'customdeploy_scv_sl_cmms_thongke_vtscbd',
                        isExternal: false,
                        parameters: copyParameters(parameters)
                    });
                }
            }
            
        }
        
        const copyParameters = (parameters) => {
            return {
                custpage_subsidiary: parameters.custpage_subsidiary,
                custpage_fromdate: parameters.custpage_fromdate,
                custpage_todate: parameters.custpage_todate
            }
        }
        
        const setHeaderFieldTransferOrder = (recTransferOrder, subsidiary) => {
            let currentUser = runtime.getCurrentUser();
            let lkFieldsEntity = search.lookupFields({type: search.Type.ENTITY, id: currentUser.id, columns: ['custentity_scv_cmms_materiallocation', 'custentity_scv_cmms_maintenancelocation']});
            
            recTransferOrder.setValue('subsidiary', subsidiary);
            recTransferOrder.setValue('location', lkFieldsEntity.custentity_scv_cmms_materiallocation[0]?.value);
            recTransferOrder.setValue('transferlocation', lkFieldsEntity.custentity_scv_cmms_maintenancelocation[0]?.value);
            
        }
        
        const setCurrentSublistValueTransferOrder = (recTransferOrder, master, request, lineCountGroup) => {
            let isSave = false;
            for(let i = 0; i < lineCountGroup; i++) {
                let chon = request.getSublistValue({group: master.sublistId, name: 'chon', line: i});
                if(chon === 'T') {
                    isSave = true;
                    setCurrentSublistValueTransferOrderLine(recTransferOrder, libCmms.CmmsSublistId.ITEM, master, request, i);
                }
            }
            return isSave;
        }
        
        const setCurrentSublistValueTransferOrderLine = (recTransferOrder, sublistId, master, request, line) => {
            recTransferOrder.setCurrentSublistValue({sublistId: sublistId, fieldId: 'item', value: request.getSublistValue({group: master.sublistId, name: 'custrecord_scv_cmms_bg_item', line: line})});
            recTransferOrder.setCurrentSublistValue({sublistId: sublistId, fieldId: 'quantity', value: request.getSublistValue({group: master.sublistId, name: 'custrecord_scv_cmms_bg_estimatequantity_hidden', line: line})});
            
            recTransferOrder.commitLine({sublistId: sublistId});
        }
        
        const setHeaderFieldPurchaseRequest = (recPurchaseRequest, subsidiary) => {
            recPurchaseRequest.setValue('entity', libCmms.Entity.DEFAULT_PURCHASE_REQUEST);
            recPurchaseRequest.setValue('subsidiary', subsidiary);
        }
        
        const setCurrentSublistValuePurchaseRequest = (recPurchaseRequest, master, request, lineCountGroup) => {
            let isSave = false;
            for(let i = 0; i < lineCountGroup; i++) {
                let chon = request.getSublistValue({group: master.sublistId, name: 'chon', line: i});
                if(chon === 'T') {
                    isSave = true;
                    setCurrentSublistValuePurchaseRequestLine(recPurchaseRequest, libCmms.CmmsSublistId.ITEM, master, request, i);
                }
            }
            return isSave;
        }
        
        const setCurrentSublistValuePurchaseRequestLine = (recPurchaseRequest, sublistId, master, request, line) => {
            recPurchaseRequest.setCurrentSublistValue({sublistId: sublistId, fieldId: 'item', value: request.getSublistValue({group: master.sublistId, name: 'custrecord_scv_cmms_bg_item', line: line})});
            recPurchaseRequest.setCurrentSublistValue({sublistId: sublistId, fieldId: 'custcol_scv_plan_qty', value: request.getSublistValue({group: master.sublistId, name: 'quantityrequest', line: line})});
            recPurchaseRequest.setCurrentSublistText({sublistId: sublistId, fieldId: 'custcol_scv_day_of_needs', text: request.getSublistValue({group: master.sublistId, name: 'ngaynhanhang', line: line})});
            recPurchaseRequest.setCurrentSublistValue({sublistId: sublistId, fieldId: 'department', value: request.getSublistValue({group: master.sublistId, name: 'department', line: line})});
            
            recPurchaseRequest.commitLine({sublistId: sublistId});
        }
        
        const setSublistValueLine = (master, sublist, listData) => {
            let currentStringDate = getCurrentStringDate();
            let line = 0;
            for(let objData of listData) {
                assignDataDefault(objData, currentStringDate);
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
            let form = serverWidget.createForm({title: "Vật tư sửa chữa bảo dưỡng"});
            form.clientScriptModulePath = '../cs/scv_cs_cmms_thongke_vtscbd.js';
            form.addButton({id: 'custpage_bt_transferorder', label: 'Chuyển kho', functionName: 'transferOrder()'});
            form.addButton({id: 'custpage_bt_search', label: 'Tìm kiếm', functionName: 'searchReport()'});
            let container = 'fieldgroup_dc_main';
            form.addFieldGroup({id: container, label: 'Filter'});
            
            let fieldSubsidiary = form.addField({
                id: 'custpage_subsidiary',
                type: serverWidget.FieldType.SELECT,
                label: 'CÔNG TY',
                container: container
            });
            fieldSubsidiary.isMandatory = true;
            fieldSubsidiary.updateDisplayType({displayType: serverWidget.FieldDisplayType.DISABLED});
            libRep.addSelectSubsidiary(fieldSubsidiary, subsidiary);
            
            let dateDefault = getDateDefault(parameters);
            let fieldFromdate = form.addField({
                id: 'custpage_fromdate',
                type: serverWidget.FieldType.DATE,
                label: 'Từ ngày',
                container: container
            }).updateLayoutType({layoutType: serverWidget.FieldLayoutType.STARTROW});
            fieldFromdate.defaultValue = dateDefault.fromDate;
            fieldFromdate.isMandatory = true;
            
            let fieldTodate = form.addField({
                id: 'custpage_todate',
                type: serverWidget.FieldType.DATE,
                label: 'Đến ngày',
                container: container
            }).updateLayoutType({layoutType: serverWidget.FieldLayoutType.ENDROW});
            fieldTodate.defaultValue = dateDefault.toDate;
            fieldTodate.isMandatory = true;
            
            let fieldAsset = form.addField({
                id: 'custpage_asset',
                type: serverWidget.FieldType.SELECT,
                label: 'Tài sản',
                container: container, source: 'customrecord_ncfar_asset'
            });
            fieldAsset.defaultValue = parameters.custpage_asset;
            
            libRep.addFieldHidden(form,'custpage_type');
            
            form.addSubmitButton({label: 'Tạo YCMH'});
            
            return form;
        }
        
        const getDateDefault = (parameters) => {
            let fromDate = parameters.custpage_fromdate;
            let toDate = parameters.custpage_todate;
            if(!fromDate && !toDate) {
                fromDate = format.format({type: format.Type.DATE, value: new Date()});
                toDate = fromDate;
            }
            return {fromDate, toDate}
        }
        
        const createSublist = (form, sublistId) => {
            let sublist = form.addSublist({
                id: sublistId,
                type: serverWidget.SublistType.LIST,
                label: 'Kết quả'
            });
            sublist.addMarkAllButtons();
            
            return sublist;
        }
        
        const getMaster = () => {
            let col = [
                {id: 'chon', label: 'Chọn', type: serverWidget.FieldType.CHECKBOX},
                {id: 'custrecord_scv_cmms_wo_plannumber', label: 'Số kế hoạch', type: 'text', display: 'disabled'},
                {id: 'custrecord_scv_cmms_bg_item', label: 'Vật tư/nhân công', type: 'text', display: 'hidden'},
                {id: 'custrecord_scv_cmms_bg_item_display', label: 'Vật tư/nhân công', type: 'text', display: 'disabled'},
                {id: 'custrecord_scv_cmms_bg_unit', label: 'Đơn vị tính', type: 'text', display: 'hidden'},
                {id: 'custrecord_scv_cmms_bg_unit_display', label: 'Đơn vị tính', type: 'text', display: 'disabled'},
                {id: 'quantityavailable', label: 'Tồn kho', type: 'float', display: 'disabled'},
                {id: 'custrecord_scv_cmms_bg_estimatequantity', label: 'Số lượng định mức', type: 'float', display: 'disabled'},
                {id: 'custrecord_scv_cmms_bg_estimatequantity_hidden', label: 'Số lượng định mức', type: 'float', display: 'hidden'},
                {id: 'quantityrequest', label: 'Số lượng yêu cầu', type: 'float', display: serverWidget.FieldDisplayType.ENTRY},
                {id: 'ngaynhanhang', label: 'Ngày nhận hàng', type: serverWidget.FieldType.DATE, display: serverWidget.FieldDisplayType.ENTRY},
                {id: 'loaiycmh', label: 'Loại YCMH', type: serverWidget.FieldType.SELECT, display: serverWidget.FieldDisplayType.ENTRY, source: 'customlist_scv_pr_type'},
                {id: 'department', label: 'Phòng ban phụ trách', type: serverWidget.FieldType.SELECT, display: serverWidget.FieldDisplayType.ENTRY, source: 'department'}
            ];
            return {sublistId: 'custpage_sl_result', col};
        }
        
        const getCurrentStringDate = () => {
            return format.format({type: format.Type.DATE, value: libCmms.getDateNow(7)});
        }
        
        const assignDataDefault = (objData, ngaynhanhang) => {
            objData.custrecord_scv_cmms_bg_estimatequantity_hidden = objData.custrecord_scv_cmms_bg_estimatequantity;
            objData.quantityrequest = objData.custrecord_scv_cmms_bg_estimatequantity;
            objData.loaiycmh = libCmms.CmmsPrType.NOI_DIA;
            objData.department = libCmms.Department.PHONG_XUAT_NHAP_KHAU;
            objData.ngaynhanhang = ngaynhanhang;
        }
        
        const getListDataThongKeSuaChuaBaoDuong = (parameters, subsidiary) => {
            let listData = [];
            const SSID_THONGKE_SCBD = 'customsearch_scv_cmms_thongke_scbd';
            let arrFilters = [];
            pushFilterThongKeSuaChuaBaoDuong(arrFilters, parameters, subsidiary);
            
            libRep.doSearchSSRangeLabelId(SSID_THONGKE_SCBD, 1000, listData, arrFilters);
            return listData;
        }
        
        const pushFilterThongKeSuaChuaBaoDuong = (arrFilters, parameters, subsidiary) => {
            arrFilters.push(search.createFilter({name: 'custrecord_scv_cmms_wo_subsidiary', join: 'custrecord_scv_cmms_bg_wo', operator: search.Operator.ANYOF, values: subsidiary}));
            arrFilters.push(search.createFilter({name: 'custrecord_scv_cmms_wo_planfromdate', join: 'custrecord_scv_cmms_bg_wo', operator: search.Operator.WITHIN, values: [parameters.custpage_fromdate, parameters.custpage_todate]}));
            if(parameters.custpage_asset) {
                arrFilters.push(search.createFilter({name: 'custrecord_scv_cmms_bg_asset', operator: search.Operator.ANYOF, values: parameters.custpage_asset}));
            }
        }
        
        return {onRequest}

    });
