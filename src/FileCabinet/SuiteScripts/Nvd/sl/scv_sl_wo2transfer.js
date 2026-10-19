/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(
    ['N/record', 'N/search', 'N/ui/serverWidget', 'N/redirect', 'N/runtime'
        , '../lib/scv_lib_report.js', '../olib/lodash.min'],
    
    (record, search, serverWidget, redirect, runtime, libRep, lodash) => {
        
        const SUBLIST_ID_WORKORDERS = 'custpage_sublist_workorders';
        const SUBLIST_ID_ITEM = 'item';
        
        const CustomApproveStatus = {
            DA_DUYET: '3'
        }
        
        const LocType = {
            KHO_SAN_XUAT: '1',
            KHO_NVL_SAN_XUAT: '2'
        }
        
        const CustomOrderType = {
            'DIEU_CHUYEN_VATTU_CHOSX': '54'
        }
        
        const copyOptions = (parameters, subsidiary) => {
            return {
                'subsidiary': subsidiary,
                'location': parameters.custpage_location,
                'from_date': parameters.custpage_req_from_date,
                'to_date': parameters.custpage_req_to_date,
                'item': parameters.custpage_req_item,
                'item_type': parameters.custpage_req_item_type,
                'status': parameters.custpage_req_status,
                'from_location': parameters.custpage_from_location,
                'isSearch': parameters.isSearch,
                'assembly_lot': parameters.custpage_assembly_lot || '',
                'wo_center': parameters.custpage_wo_center,
                'wo_ordertype': parameters.custpage_wo_ordertype
            }
        }
        
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
            let subsidiary = parameters.custpage_subsidiary || runtime.getCurrentUser().subsidiary;
            let options = copyOptions(parameters, subsidiary);
            
            if (request.method === 'GET') {
                // SEARCH WORK ORDER DETAILS
                let form = serverWidget.createForm({
                    title: 'Tạo YC chuyển kho từ lệnh sản xuất'
                });
                
                form.clientScriptModulePath = '../cs/scv_cs_workorder.js';
                form.addButton({
                    id: 'custpage_bt_search',
                    label: 'Tìm',
                    functionName: 'searchWorkOrders()'
                });
                initForm(form, options);
                response.writePage(form);
            } else {
                let listDataSelect = getListDataSelect(request, options);
                let groupDataSelect = lodash.groupBy(listDataSelect, o => o.location + (o.custbody_scv_wo_center ? '>>' + o.custbody_scv_wo_center : ''));
                let listTransferOrderIds = [];
                for (let key in groupDataSelect) {
                    let listDataChildren = groupDataSelect[key];
                    let toId = createAndSaveTransferOrder(listDataChildren, options);
                    listTransferOrderIds.push({toId, listDataChildren});
                }
                updateTransferOrderToWorkOrder(listTransferOrderIds);
                
                redirect.toRecord({
                    type: record.Type.TRANSFER_ORDER,
                    id: listTransferOrderIds[0].toId
                });
            }
        }
        
        const updateTransferOrderToWorkOrder = (listTransferOrderIds) => {
            let listWoMapTo = [];
            for (let objToMapWo of listTransferOrderIds) {
                for (let objDataChilren of objToMapWo.listDataChildren) {
                    if (objDataChilren.custcol_scv_wo_to_if_ir_line_id && objDataChilren.isnot_mro === 'T') {
                        listWoMapTo.push({
                            woId: objDataChilren.custcol_scv_tl_wo,
                            toId: objToMapWo.toId,
                            line: objDataChilren.custcol_scv_wo_to_if_ir_line_id
                        });
                    }
                }
            }
            let groupWo = lodash.groupBy(listWoMapTo, o => o.woId);
            for (let woId in groupWo) {
                let listDataWoMapToLine = groupWo[woId];
                let recWorkOrder = record.load({type: record.Type.WORK_ORDER, id: woId});
                let lcItem = recWorkOrder.getLineCount(SUBLIST_ID_ITEM);
                let isSave = false;
                for (let i = 0; i < lcItem; i++) {
                    let line = recWorkOrder.getSublistValue({sublistId: SUBLIST_ID_ITEM, fieldId: 'line', line: i});
                    let objLine = listDataWoMapToLine.find(o => String(o.line) === String(line));
                    if (objLine) {
                        isSave = true;
                        recWorkOrder.setSublistValue({
                            sublistId: SUBLIST_ID_ITEM,
                            fieldId: 'custcol_scv_tl_wo_to',
                            line: i,
                            value: objLine.toId
                        });
                    }
                }
                
                if (isSave) {
                    recWorkOrder.save({ignoreMandatoryFields: true});
                }
            }
        }
        
        const createAndSaveTransferOrder = (listDataSelect, options) => {
            let recTransferOrder = record.create({type: record.Type.TRANSFER_ORDER, isDynamic: true});
            let objDataSelectZero = listDataSelect[0];
            
            recTransferOrder.setValue('custbody_scv_order_type', CustomOrderType.DIEU_CHUYEN_VATTU_CHOSX);
            recTransferOrder.setValue('subsidiary', options.subsidiary);
            recTransferOrder.setValue('location', objDataSelectZero.location);
            recTransferOrder.setValue('transferlocation', options.location);
            recTransferOrder.setValue('firmed', true);
            recTransferOrder.setValue('useitemcostastransfercost', true);
            recTransferOrder.setValue('custbody_scv_wo_center', objDataSelectZero.custbody_scv_wo_center);
            let i = 0;
            let groupDataItem = lodash.groupBy(listDataSelect, o => String(o.item) + String(o.units) + String(o.custcol_scv_lot_serial_selected));
            for (let key in groupDataItem) {
                let listDataItemChildren = groupDataItem[key];
                let objDataSelect = listDataItemChildren[0];
                let headerDataItem = makeHeaderDataItemChildren(listDataItemChildren);
                if (i === 0) {
                    recTransferOrder.setValue('memo', headerDataItem.memo.substring(0, 300));
                    i++;
                }
                if(objDataSelect.isnot_mro === 'F') {
                    recTransferOrder.setValue('memo', (objDataSelect.memo || ''));
                    recTransferOrder.setValue('custcol_scv_mro_line_related', objDataSelect.line_number);
                }
                recTransferOrder.setCurrentSublistValue({
                    sublistId: SUBLIST_ID_ITEM,
                    fieldId: 'item',
                    value: objDataSelect.item
                });
                recTransferOrder.setCurrentSublistValue({
                    sublistId: SUBLIST_ID_ITEM,
                    fieldId: 'custcol_scv_tc_item_code',
                    value: objDataSelect.custcol_scv_tc_item_code
                });
                recTransferOrder.setCurrentSublistValue({
                    sublistId: SUBLIST_ID_ITEM,
                    fieldId: 'units',
                    value: objDataSelect.units
                });
                recTransferOrder.setCurrentSublistValue({
                    sublistId: SUBLIST_ID_ITEM,
                    fieldId: 'quantity',
                    value: headerDataItem.quantity
                });
                // recTransferOrder.setCurrentSublistValue({
                //     sublistId: SUBLIST_ID_ITEM,
                //     fieldId: 'custcol_scv_tl_wo',
                //     value: objDataSelect.custcol_scv_tl_wo
                // });
                // recTransferOrder.setCurrentSublistValue({
                //     sublistId: SUBLIST_ID_ITEM,
                //     fieldId: 'custcol_scv_wo_to_if_ir_line_id',
                //     value: objDataSelect.custcol_scv_wo_to_if_ir_line_id
                // });
                recTransferOrder.setCurrentSublistValue({
                    sublistId: SUBLIST_ID_ITEM,
                    fieldId: 'custcol_scv_wo_to_line_id',
                    value: headerDataItem.wo_to_line_id
                });
                recTransferOrder.setCurrentSublistValue({
                    sublistId: SUBLIST_ID_ITEM,
                    fieldId: 'custcol_scv_lot_serial_selected',
                    value: objDataSelect.custcol_scv_lot_serial_selected
                });
                recTransferOrder.setCurrentSublistValue({
                    sublistId: SUBLIST_ID_ITEM,
                    fieldId: 'custcol_scv_qc_serial_code',
                    value: objDataSelect.custcol_scv_qc_serial_code
                });
                recTransferOrder.setCurrentSublistValue({
                    sublistId: SUBLIST_ID_ITEM,
                    fieldId: 'custcol_scv_memo',
                    value: headerDataItem.memo.substring(0, 300)
                });
                recTransferOrder.setCurrentSublistValue({
                    sublistId: SUBLIST_ID_ITEM,
                    fieldId: 'custcol_scv_lot_serial_multi',
                    value: headerDataItem.custcol_scv_lot_serial_multi.substring(0, 300)
                });
                recTransferOrder.setCurrentSublistValue({
                    sublistId: SUBLIST_ID_ITEM,
                    fieldId: 'custcol_scv_qc_serial_code_multi',
                    value: headerDataItem.custcol_scv_qc_serial_code_multi.substring(0, 300)
                });
                recTransferOrder.commitLine({sublistId: SUBLIST_ID_ITEM});
            }
            
            return recTransferOrder.save({enableSourcing: false, ignoreMandatoryFields: true});
        }
        
        const makeHeaderDataItemChildren = (listDataItemChildren) => {
            let quantity = 0, wo_to_line_id = '', memo = '', custcol_scv_lot_serial_multi = [], custcol_scv_qc_serial_code_multi = [];
            for (let objDataItem of listDataItemChildren) {
                quantity += Number(objDataItem.quantity);
                if (memo.length > 0) {
                    memo += ',';
                }
                memo += (objDataItem.assembly_lot || '') + (objDataItem.custbody_scv_wo_center_text ? `-${objDataItem.custbody_scv_wo_center_text}` : '');
                if(objDataItem.custcol_scv_lot_serial_multi) {
                    custcol_scv_lot_serial_multi.push(objDataItem.custcol_scv_lot_serial_multi);
                }
                if(objDataItem.custcol_scv_qc_serial_code_multi) {
                    custcol_scv_qc_serial_code_multi.push(objDataItem.custcol_scv_qc_serial_code_multi);
                }
            }
            let groupDataWoLine = lodash.groupBy(listDataItemChildren, o => String(o.custcol_scv_tl_wo));
            for (let key in groupDataWoLine) {
                if (wo_to_line_id.length > 0) {
                    wo_to_line_id += ';';
                }
                let listDataWoLineChildren = groupDataWoLine[key];
                wo_to_line_id += listDataWoLineChildren[0].custcol_scv_tl_wo + ':' + (listDataWoLineChildren.map(o => o.custcol_scv_wo_to_if_ir_line_id).join(','));
            }
            return {quantity, wo_to_line_id, memo, custcol_scv_lot_serial_multi: custcol_scv_lot_serial_multi.join(','), custcol_scv_qc_serial_code_multi: custcol_scv_qc_serial_code_multi.join(',')};
        }
        
        const getListDataSelect = (request, options) => {
            let vCheck = false;
            let lineCount = request.getLineCount(SUBLIST_ID_WORKORDERS);
            let listDataSelect = [];
            for (let i = 0; i < lineCount; i++) {
                vCheck = request.getSublistValue({group: SUBLIST_ID_WORKORDERS, name: 'custpage_select', line: i});
                if (vCheck === true || vCheck === 'T') {
                    listDataSelect.push({
                        assembly_lot: request.getSublistValue({
                            group: SUBLIST_ID_WORKORDERS,
                            name: 'custpage_assembly_lot',
                            line: i
                        }),
                        custbody_scv_wo_center: request.getSublistValue({
                            group: SUBLIST_ID_WORKORDERS,
                            name: 'custpage_wo_center',
                            line: i
                        }),
                        custbody_scv_wo_center_text: request.getSublistValue({
                            group: SUBLIST_ID_WORKORDERS,
                            name: 'custpage_wo_center_text',
                            line: i
                        }),
                        location: request.getSublistValue({
                            group: SUBLIST_ID_WORKORDERS,
                            name: 'custpage_from_location_line',
                            line: i
                        }) || options.from_location,
                        item: request.getSublistValue({
                            group: SUBLIST_ID_WORKORDERS,
                            name: 'custpage_item_id',
                            line: i
                        }),
                        custcol_scv_tc_item_code: request.getSublistValue({
                            group: SUBLIST_ID_WORKORDERS,
                            name: 'custpage_item_code',
                            line: i
                        }),
                        units: request.getSublistValue({
                            group: SUBLIST_ID_WORKORDERS,
                            name: 'custpage_unitid',
                            line: i
                        }),
                        quantity: request.getSublistValue({
                            group: SUBLIST_ID_WORKORDERS,
                            name: 'custpage_quantityuom_transfer',
                            line: i
                        }),
                        custcol_scv_tl_wo: request.getSublistValue({
                            group: SUBLIST_ID_WORKORDERS,
                            name: 'custpage_workorder_id',
                            line: i
                        }),
                        custcol_scv_wo_to_if_ir_line_id: request.getSublistValue({
                            group: SUBLIST_ID_WORKORDERS,
                            name: 'custpage_line_number',
                            line: i
                        }),
                        custcol_scv_lot_serial_selected: request.getSublistValue({
                            group: SUBLIST_ID_WORKORDERS,
                            name: 'custcol_scv_lot_serial_selected',
                            line: i
                        }),
                        custcol_scv_qc_serial_code: request.getSublistValue({
                            group: SUBLIST_ID_WORKORDERS,
                            name: 'custcol_scv_qc_serial_code',
                            line: i
                        }),
                        custcol_scv_lot_serial_multi: request.getSublistValue({
                            group: SUBLIST_ID_WORKORDERS,
                            name: 'custcol_scv_lot_serial_multi',
                            line: i
                        }),
                        custcol_scv_qc_serial_code_multi: request.getSublistValue({
                            group: SUBLIST_ID_WORKORDERS,
                            name: 'custcol_scv_qc_serial_code_multi',
                            line: i
                        }),
                        isnot_mro: request.getSublistValue({
                            group: SUBLIST_ID_WORKORDERS,
                            name: 'custpage_isnot_mro',
                            line: i
                        }),
                        line_number: request.getSublistValue({
                            group: SUBLIST_ID_WORKORDERS,
                            name: 'custpage_line_number',
                            line: i
                        }),
                        memo: request.getSublistValue({
                            group: SUBLIST_ID_WORKORDERS,
                            name: 'custpage_memo',
                            line: i
                        })
                    })
                }
            }
            return listDataSelect;
        }
        
        const initForm = (form, options) => {
            options = options || {};
            initHederField(form, options);
            
            let sublist = form.addSublist({
                id: SUBLIST_ID_WORKORDERS,
                type: serverWidget.SublistType.LIST,
                label: 'Lệnh SX'
            });
            sublist.addMarkAllButtons();
            initSublist(sublist);
            assignSelectOptionLine(form, sublist);
            
            let resultSet = options.isSearch === 'T' ? searchWorkorder(options) : [];
            
            for (let i = 0; i < resultSet.length; i++) {
                let objLineResult = resultSet[i];
                if (objLineResult) {
                    for (let objCol of COLS_ON_SUBLIST) {
                        let tempValue = objLineResult[objCol.fieldIdOfSS]
                        if (tempValue) {
                            sublist.setSublistValue({id: objCol.id, line: i, value: tempValue});
                        }
                    }
                }
            }
            form.addSubmitButton({label: 'Tạo YC chuyển kho'});
        }
        
        const assignSelectOptionLine = (form, sublist) => {
            const fieldFromLocation = form.getField('custpage_from_location');
            const fieldFromLocaitonLine = sublist.getField('custpage_from_location_line');
            libRep.addSelectionFromField(fieldFromLocaitonLine, fieldFromLocation, true, null);
        }
        
        const initHederField = (form, options) => {
            // GROUP SEARCH FILTER
            let containerMainId = 'fieldgroup_req_main';
            form.addFieldGroup({
                id: containerMainId,
                label: 'Filters:'
            });
            let fieldSubsidiary = form.addField({
                id: 'custpage_subsidiary',
                type: serverWidget.FieldType.SELECT,
                label: 'Công ty/Chi nhánh',
                container: containerMainId
            });
            let listSelectedSubsidiary = libRep.addSelectSubsidiary(fieldSubsidiary, options.subsidiary);
            fieldSubsidiary.isMandatory = true;
            let optionsSubsidiary = options.subsidiary;
            optionsSubsidiary = listSelectedSubsidiary.includes(optionsSubsidiary) ? optionsSubsidiary : listSelectedSubsidiary[0];
            
            let fieldLocation = form.addField({
                id: 'custpage_location',
                type: serverWidget.FieldType.SELECT,
                label: 'Kho',
                container: containerMainId
            });
            fieldLocation.isMandatory = true;
            let sqlLocation = `select to_char(l.id) value, l.name text, l.subsidiary, to_char(l.custrecord_scv_loc_type) loc_type from location l where l.isinactive = 'F'`;
            let listLocation = libRep.getListData('listLocation', sqlLocation);
            libRep.addSelectType(fieldLocation, options.location, listLocation.filter(o => String(o.subsidiary) === String(optionsSubsidiary) && String(o.loc_type) === LocType.KHO_SAN_XUAT), true);
            
            let fieldReqFromDate = form.addField({
                id: 'custpage_req_from_date',
                type: serverWidget.FieldType.DATE,
                label: 'Từ ngày',
                container: containerMainId
            });
            fieldReqFromDate.defaultValue = options.from_date;
            
            let fieldReqToDate = form.addField({
                id: 'custpage_req_to_date',
                type: serverWidget.FieldType.DATE,
                label: 'Đến ngày',
                container: containerMainId
            });
            fieldReqToDate.defaultValue = options.to_date;
            
            let fieldWoOrderType = form.addField({
                id: 'custpage_wo_ordertype',
                type: serverWidget.FieldType.SELECT,
                label: 'Loại lệnh sản xuất',
                container: containerMainId, source: 'customrecord_scv_work_order_type'
            });
            fieldWoOrderType.defaultValue = options.wo_ordertype
            
            let fieldReqItem = form.addField({
                id: 'custpage_req_item',
                type: serverWidget.FieldType.SELECT,
                label: 'Item',
                source: 'item',
                container: containerMainId
            });
            fieldReqItem.defaultValue = options.item;
            
            let fieldWoCenter = form.addField({
                id: 'custpage_wo_center',
                type: serverWidget.FieldType.MULTISELECT,
                label: 'Máy',
                container: containerMainId
            });
            let sqlWoCenter = `select to_char(eg.id) value, eg.groupname text, eg.custentity_scv_sub subsidiary from entitygroup eg where eg.isinactive = 'F'`;
            let listWoCenter = libRep.getListData('listWoCenter2Transfer', sqlWoCenter);
            libRep.addMultiSelectType(fieldWoCenter, (options.wo_center || '').split(','), listWoCenter.filter(o => String(o.subsidiary) === String(optionsSubsidiary)));
            
            let fieldReqItemType = form.addField({
                id: 'custpage_req_item_type',
                type: serverWidget.FieldType.MULTISELECT,
                label: 'Loại Item',
                container: containerMainId
            });
            fieldReqItemType.addSelectOption({
                value: 'InvtPart',
                text: 'Inventory Item',
                isSelected: options.item_type && options.item_type.toString().indexOf('InvtPart') !== -1
            });
            fieldReqItemType.addSelectOption({
                value: 'Assembly',
                text: 'Assembly',
                isSelected: options.item_type && options.item_type.toString().indexOf('Assembly') !== -1
            });
            
            let fieldReqStatus = form.addField({
                id: 'custpage_req_status',
                type: serverWidget.FieldType.MULTISELECT,
                label: 'Trạng thái lệnh',
                container: containerMainId
            });
            fieldReqStatus.addSelectOption({
                value: 'WorkOrd:A',
                text: 'Planned',
                isSelected: options.status && options.status.toString().indexOf('WorkOrd:A') !== -1
            });
            fieldReqStatus.addSelectOption({
                value: 'WorkOrd:B',
                text: 'Released',
                isSelected: options.status && options.status.toString().indexOf('WorkOrd:B') !== -1
            });
            fieldReqStatus.addSelectOption({
                value: 'WorkOrd:D',
                text: 'In Process',
                isSelected: options.status && options.status.toString().indexOf('WorkOrd:D') !== -1
            });
            
            let fieldAssemblyLot = form.addField({
                id: 'custpage_assembly_lot',
                type: serverWidget.FieldType.MULTISELECT,
                label: 'Số lô',
                container: containerMainId
            });
            let listAssemblyLot = [];
            let arrColAssemblyLot = [['value', 0], ['label', 0]];
            libRep.doSearchSSRange('customsearch_scv_mfg_lot', 1000, listAssemblyLot, null, arrColAssemblyLot);
            libRep.addMultiSelectType(fieldAssemblyLot, options.assembly_lot.split(','), listAssemblyLot);
            
            let fieldFromLocation = form.addField({
                id: 'custpage_from_location',
                type: serverWidget.FieldType.SELECT,
                label: 'Từ kho'
            });
            fieldFromLocation.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});
            libRep.addSelectType(fieldFromLocation, options.from_location, listLocation.filter(o => String(o.subsidiary) === String(optionsSubsidiary) && String(o.loc_type) === LocType.KHO_NVL_SAN_XUAT), false);
            
        }
        
        const COLS_ON_SUBLIST = [
            {
                id: 'custpage_workorder_id',
                label: 'ID lệnh SX',
                type: 'text',
                display: 'hidden',
                fieldIdOfSS: 'workorder_id'
            },
            {
                id: 'custpage_workorder_number',
                label: 'Lệnh SX',
                type: 'text',
                display: 'disabled',
                fieldIdOfSS: 'workorder_number'
            },
            {
                id: 'custpage_from_location_line',
                label: 'Từ kho',
                type: serverWidget.FieldType.SELECT,
                display: 'entry',
                fieldIdOfSS: 'custcol_scv_default_location'
            },
            {
                id: 'custpage_line_number',
                label: 'Item Line',
                type: 'text',
                display: 'hidden',
                fieldIdOfSS: 'line_number'
            },
            {
                id: 'custpage_assembly_lot',
                label: 'Số lô',
                type: 'text',
                display: 'disabled',
                fieldIdOfSS: 'assembly_lot'
            },
            {id: 'custpage_wo_center', label: 'Máy', type: 'text', display: 'hidden', fieldIdOfSS: 'wo_center'},
            {
                id: 'custpage_wo_center_text',
                label: 'Máy',
                type: 'text',
                display: 'disabled',
                fieldIdOfSS: 'wo_center_text'
            },
            {
                id: 'custpage_mfg_itemcode',
                label: 'Thành phẩm',
                type: 'text',
                display: 'disabled',
                fieldIdOfSS: 'mfg_itemcode'
            },
            {
                id: 'custpage_workorder_status',
                label: 'Trạng thái',
                type: 'text',
                display: 'disabled',
                fieldIdOfSS: 'workorder_status'
            },
            {id: 'custpage_item_id', label: 'Item ID', type: 'text', display: 'hidden', fieldIdOfSS: 'item_id'},
            {id: 'custpage_item_code', label: 'Mã Item', type: 'text', display: 'disabled', fieldIdOfSS: 'item_code'},
            {id: 'custpage_item_name', label: 'Item', type: 'text', display: 'disabled', fieldIdOfSS: 'item_name'},
            {
                id: 'custpage_startdate',
                label: 'Ngày bắt đầu',
                type: 'text',
                display: 'disabled',
                fieldIdOfSS: 'startdate'
            },
            {id: 'custpage_enddate', label: 'Ngày kết thúc', type: 'text', display: 'disabled', fieldIdOfSS: 'enddate'},
            {id: 'custpage_unit', label: 'ĐVT', type: 'text', display: 'disabled', fieldIdOfSS: 'unit'},
            {
                id: 'custcol_scv_lot_serial_selected',
                label: 'Lot/Serial',
                type: 'text',
                display: 'hidden',
                fieldIdOfSS: 'custcol_scv_lot_serial_selected'
            },
            {
                id: 'custcol_scv_lot_serial_selected_text',
                label: 'Lot/Serial',
                type: 'text',
                display: 'disabled',
                fieldIdOfSS: 'custcol_scv_lot_serial_selected_text'
            },
            {
                id: 'custcol_scv_qc_serial_code',
                label: 'QC Serial',
                type: 'text',
                display: 'disabled',
                fieldIdOfSS: 'custcol_scv_qc_serial_code'
            },
            {
                id: 'custpage_quantityuom',
                label: 'Số lượng',
                type: 'float',
                display: 'disabled',
                fieldIdOfSS: 'quantityuom'
            },
            {
                id: 'custpage_quantityuom_transfer',
                label: 'Số lượng chuyển',
                type: 'float',
                display: 'disabled',
                fieldIdOfSS: 'quantityuom'
            },
            {
                id: 'custcol_scv_lot_serial_multi',
                label: 'Lot/Serial (Multi)',
                type: 'text',
                display: 'disabled',
                fieldIdOfSS: 'custcol_scv_lot_serial_multi'
            },
            {
                id: 'custcol_scv_qc_serial_code_multi',
                label: 'QC Serial (Multi)',
                type: 'text',
                display: 'disabled',
                fieldIdOfSS: 'custcol_scv_qc_serial_code_multi'
            },
            {
                id: 'custpage_memo',
                label: 'Memo',
                type: 'text',
                display: 'disabled',
                fieldIdOfSS: 'memo'
            },
            {id: 'custpage_unitid', label: 'Mã ĐVT', type: 'text', display: 'hidden', fieldIdOfSS: 'unitid'},
            {id: 'custpage_isnot_mro', label: 'IS NOT MRO', type: 'text', display: 'hidden', fieldIdOfSS: 'isnot_mro'}
        ];
        
        const initSublist = (sublist) => {
            libRep.addFieldSelect(sublist, 'custpage_select');
            libRep.addFieldSublistColId(sublist, COLS_ON_SUBLIST);
        }
        
        const searchListMROComponent = (options) => {
            let filterMROComponent = createSearchFilterMROComponent(options);
            let listMROComponent = [];
            let columnsMROComponent = [{name: 'tranid', join: 'custrecord_scv_mro_usage_wo'}, {
                name: 'formulatext',
                formula: '{custrecord_scv_mro_usage_wo.status}'
            }, {name: 'internalid'},
                'custrecord_scv_mro_usage_comp', {
                    name: 'upccode',
                    join: 'custrecord_scv_mro_usage_comp'
                }, {name: 'itemid', join: 'custrecord_scv_mro_usage_comp'},
                'custrecord_scv_mro_usage_wo', {
                    name: 'formuladate',
                    formula: 'nvl({custrecord_scv_mro_usage_wo.startdate},{custrecord_scv_mro_usage_wo.custbody_scv_prod_start_date})'
                }, {
                    name: 'formuladate',
                    formula: 'nvl({custrecord_scv_mro_usage_wo.enddate},{custrecord_scv_mro_usage_wo.custbody_scv_prod_end_date})'
                },
                'custrecord_scv_mro_usage_qty', {
                    name: 'formulatext',
                    formula: '{custrecord_scv_mro_usage_unit}'
                }, 'custrecord_scv_mro_usage_unit',
                {name: 'custbody_scv_mfg_itemcode', join: 'custrecord_scv_mro_usage_wo'},
                {
                    name: 'custbody_scv_assembly_lot',
                    join: 'custrecord_scv_mro_usage_wo'
                }, {name: 'custbody_scv_wo_center', join: 'custrecord_scv_mro_usage_wo'}, {
                    name: 'formulatext',
                    formula: '{custrecord_scv_mro_usage_wo.custbody_scv_wo_center}'
                }, 'custrecord_scv_mro_usage_memo'
            ];
            let arrColMROComponent = ['workorder_number', 'workorder_status', 'line_number',
                'item_id', 'item_code', 'item_name', 'workorder_id', 'startdate', 'enddate', 'quantityuom', 'unit', 'unitid', 'mfg_itemcode',
                'assembly_lot', 'wo_center', 'wo_center_text', 'memo'
            ];
            libRep.doSearch('customrecord_scv_mro_component_usage', listMROComponent, columnsMROComponent, arrColMROComponent, filterMROComponent);
            return listMROComponent;
        }
        
        const searchWorkorder = (options) => {
            let filterComponent = createSearchFilterComponent(options);
            let searchWo = search.create({
                type: "workorder",
                filters: filterComponent,
                columns: [
                    search.createColumn({name: "tranid"}),
                    search.createColumn({name: "status"}),
                    search.createColumn({name: "line"}),
                    search.createColumn({name: "internalid", join: "item"}),
                    search.createColumn({name: "upccode", join: "item"}),
                    search.createColumn({name: "itemid", join: "item"}),
                    search.createColumn({name: "internalid"}),
                    search.createColumn({name: "startdate"}),
                    search.createColumn({name: "enddate"}),
                    search.createColumn({name: "quantityuom"}),
                    search.createColumn({name: "unit"}),
                    search.createColumn({name: "custbody_scv_mfg_itemcode"}),
                    search.createColumn({name: "unitid"}),
                    search.createColumn({name: "custbody_scv_prod_start_date"}),
                    search.createColumn({name: "custbody_scv_prod_end_date"}),
                    search.createColumn({name: "custbody_scv_assembly_lot"}),
                    search.createColumn({name: "custbody_scv_wo_center"}),
                    search.createColumn({name: "custcol_scv_lot_serial_selected"}),
                    search.createColumn({name: "custcol_scv_qc_serial_code"}),
                    search.createColumn({name: "custcol_scv_default_location"}),
                    search.createColumn({name: "custcol_scv_lot_serial_multi"}),
                    search.createColumn({name: "custcol_scv_qc_serial_code_multi"})
                ]
            });
            let resultSet = [];
            let mapObj = getAllReadyMapping();
            let listMROComponent = searchListMROComponent(options);
            for (let objMROComponent of listMROComponent) {
                let checkMapping = isAlreadyMapping(objMROComponent.workorder_id, objMROComponent.line_number, mapObj);
                if (checkMapping) {
                    objMROComponent.isnot_mro = 'F';
                    objMROComponent.custcol_scv_lot_serial_selected = '';
                    resultSet.push(objMROComponent);
                }
            }
            
            let sR = searchWo.run().getRange({start: 0, end: 1000});
            for (let i = 0; i < sR.length; i++) {
                let result = sR[i];
                let wo_id = result.getValue({name: 'internalid'});
                let line_number = result.getValue({name: 'line'});
                
                let checkMapping = isAlreadyMapping(wo_id, line_number, mapObj);
                let objMROComponent = listMROComponent.find(o => o.workorder_id === result.getValue({name: 'internalid'}));
                if (checkMapping && !objMROComponent) {
                    resultSet.push({
                        'line_number': line_number,
                        'item_id': result.getValue(result.columns[3]),
                        'item_name': result.getValue(result.columns[5]),
                        'item_code': result.getValue(result.columns[4]) || result.getValue(result.columns[5]),
                        'quantityuom': result.getValue({name: 'quantityuom'}),
                        'unit': result.getValue({name: 'unit'}),
                        'unitid': result.getValue({name: 'unitid'}),
                        'workorder_id': result.getValue({name: 'internalid'}),
                        'workorder_number': result.getValue({name: 'tranid'}),
                        'workorder_status': result.getText({name: 'status'}),
                        'startdate': result.getValue({name: 'startdate'}) || result.getValue({name: 'custbody_scv_prod_start_date'}),
                        'enddate': result.getValue({name: 'enddate'}) || result.getValue({name: 'custbody_scv_prod_end_date'}),
                        'mfg_itemcode': result.getValue({name: 'custbody_scv_mfg_itemcode'}),
                        'assembly_lot': result.getValue({name: 'custbody_scv_assembly_lot'}),
                        'wo_center': result.getValue({name: 'custbody_scv_wo_center'}),
                        'wo_center_text': result.getText({name: 'custbody_scv_wo_center'}),
                        'custcol_scv_lot_serial_selected': result.getValue({name: 'custcol_scv_lot_serial_selected'}),
                        'custcol_scv_lot_serial_selected_text': result.getText({name: 'custcol_scv_lot_serial_selected'}),
                        'custcol_scv_qc_serial_code': result.getValue({name: 'custcol_scv_qc_serial_code'}),
                        'custcol_scv_default_location': result.getValue({name: 'custcol_scv_default_location'}),
                        'custcol_scv_lot_serial_multi': result.getValue({name: 'custcol_scv_lot_serial_multi'}),
                        'custcol_scv_qc_serial_code_multi': result.getValue({name: 'custcol_scv_qc_serial_code_multi'}),
                        'isnot_mro': 'T',
                        'memo': ''
                    });
                }
            }
            return resultSet;
        }
        
        const createSearchFilterMROComponent = (options) => {
            let filterMROComponent = [];
            filterMROComponent.push(search.createFilter({
                name: 'mainline',
                operator: search.Operator.IS, join: 'custrecord_scv_mro_usage_wo',
                values: 'T'
            }));
            filterMROComponent.push(search.createFilter({
                name: 'status',
                operator: search.Operator.ANYOF, join: 'custrecord_scv_mro_usage_wo',
                values: ["WorkOrd:A", "WorkOrd:B", "WorkOrd:D"]
            }));
            filterMROComponent.push(search.createFilter({
                name: 'type',
                join: 'custrecord_scv_mro_usage_comp',
                operator: search.Operator.ANYOF,
                values: ["InvtPart", "Assembly"]
            }));
            filterMROComponent.push(search.createFilter({
                name: 'isinactive',
                join: 'custrecord_scv_mro_usage_comp',
                operator: search.Operator.IS,
                values: ["F"]
            }));
            filterMROComponent.push(search.createFilter({
                name: 'custrecord_scv_mro_usage_qty',
                operator: search.Operator.GREATERTHAN,
                values: 0
            }));
            
            if (options.subsidiary) {
                filterMROComponent.push(search.createFilter({
                    name: 'custrecord_scv_mro_usage_sub',
                    operator: search.Operator.IS,
                    values: options.subsidiary
                }));
            }
            if (options.location) {
                filterMROComponent.push(search.createFilter({
                    name: 'location',
                    operator: search.Operator.IS, join: 'custrecord_scv_mro_usage_wo',
                    values: options.location
                }));
            }
            if (options.item) {
                filterMROComponent.push(search.createFilter({
                    name: 'internalid',
                    join: 'custrecord_scv_mro_usage_comp',
                    operator: search.Operator.IS,
                    values: options.item
                }));
            }
            if (options.status) {
                filterMROComponent.push(search.createFilter({
                    name: 'status',
                    operator: search.Operator.ANYOF, join: 'custrecord_scv_mro_usage_wo',
                    values: options.status.split(',')
                }));
            }
            /*if (options.item_type) {
                filterMROComponent.push(search.createFilter({
                    name : 'itemtype',
                    operator : search.Operator.ANYOF, join: 'custrecord_scv_mro_usage_comp',
                    values : options.item_type.split(',')
                }));
            }*/
            if (options.from_date) {
                filterMROComponent.push(search.createFilter({
                    name: 'formuladate',
                    operator: search.Operator.ONORAFTER,
                    values: options.from_date,
                    formula: "nvl({custrecord_scv_mro_usage_wo.startdate},{custrecord_scv_mro_usage_wo.custbody_scv_prod_start_date})"
                }));
            }
            if (options.to_date) {
                filterMROComponent.push(search.createFilter({
                    name: 'formuladate',
                    operator: search.Operator.ONORBEFORE,
                    values: options.to_date,
                    formula: "nvl({custrecord_scv_mro_usage_wo.enddate},{custrecord_scv_mro_usage_wo.custbody_scv_prod_end_date})"
                }));
            }
            filterMROComponent.push(search.createFilter({
                name: 'custbody_scv_approval_status',
                operator: search.Operator.ANYOF, join: 'custrecord_scv_mro_usage_wo',
                values: CustomApproveStatus.DA_DUYET
            }));
            if (options.assembly_lot) {
                let assembly_lots = options.assembly_lot.split(',');
                if (assembly_lots.length === 1) {
                    filterMROComponent.push(search.createFilter({
                        name: 'custbody_scv_assembly_lot',
                        operator: search.Operator.IS, join: 'custrecord_scv_mro_usage_wo',
                        values: options.assembly_lot
                    }));
                } else {
                    filterMROComponent.push(search.createFilter({
                        name: 'formulatext',
                        operator: search.Operator.IS,
                        values: '1',
                        formula: `case when {custrecord_scv_mro_usage_wo.custbody_scv_assembly_lot} in('${assembly_lots.join("','")}') then '1' else '0' end`
                    }));
                }
            }
            if (options.wo_center) {
                filterMROComponent.push(search.createFilter({
                    name: 'custbody_scv_wo_center',
                    operator: search.Operator.ANYOF, join: 'custrecord_scv_mro_usage_wo',
                    values: options.wo_center.split(',')
                }));
            }
            if (options.wo_ordertype) {
                filterMROComponent.push(search.createFilter({
                    name: 'custbody_scv_work_order_type',
                    operator: search.Operator.ANYOF, join: 'custrecord_scv_mro_usage_wo',
                    values: options.wo_ordertype
                }));
            }
            return filterMROComponent;
        }
        
        const createSearchFilterComponent = (options) => {
            let filterWorkOrder = [];
            filterWorkOrder.push(search.createFilter({
                name: 'mainline',
                operator: search.Operator.IS,
                values: 'F'
            }));
            filterWorkOrder.push(search.createFilter({
                name: 'status',
                operator: search.Operator.ANYOF,
                values: ["WorkOrd:A", "WorkOrd:B", "WorkOrd:D"]
            }));
            filterWorkOrder.push(search.createFilter({
                name: 'itemsource',
                operator: search.Operator.NONEOF,
                values: ["WORK_ORDER"]
            }));
            filterWorkOrder.push(search.createFilter({
                name: 'type',
                join: 'item',
                operator: search.Operator.ANYOF,
                values: ["InvtPart", "Assembly"]
            }));
            filterWorkOrder.push(search.createFilter({
                name: 'isinactive',
                join: 'item',
                operator: search.Operator.IS,
                values: ["F"]
            }));
            filterWorkOrder.push(search.createFilter({
                name: 'custcol_scv_tl_wo_to',
                operator: search.Operator.ANYOF,
                values: '@NONE@'
            }));
            
            filterWorkOrder.push(search.createFilter({
                name: 'quantity',
                operator: search.Operator.GREATERTHAN,
                values: 0
            }));
            
            filterWorkOrder.push(search.createFilter({
                name: 'custcol_scv_isshow_create_to_from_wo',
                operator: search.Operator.IS,
                values: false
            }));
            
            if (options.subsidiary) {
                filterWorkOrder.push(search.createFilter({
                    name: 'subsidiary',
                    operator: search.Operator.IS,
                    values: options.subsidiary
                }));
            }
            if (options.location) {
                filterWorkOrder.push(search.createFilter({
                    name: 'location',
                    operator: search.Operator.IS,
                    values: options.location
                }));
            }
            if (options.item) {
                filterWorkOrder.push(search.createFilter({
                    name: 'internalid',
                    join: 'item',
                    operator: search.Operator.IS,
                    values: options.item
                }));
            }
            if (options.status) {
                filterWorkOrder.push(search.createFilter({
                    name: 'status',
                    operator: search.Operator.ANYOF,
                    values: options.status.split(',')
                }));
            }
            if (options.item_type) {
                filterWorkOrder.push(search.createFilter({
                    name: 'itemtype',
                    operator: search.Operator.IS,
                    values: options.item_type.split(',')
                }));
            }
            if (options.from_date) {
                filterWorkOrder.push(search.createFilter({
                    name: 'formuladate',
                    operator: search.Operator.ONORAFTER,
                    values: options.from_date,
                    formula: "nvl({startdate},{custbody_scv_prod_start_date})"
                }));
            }
            if (options.to_date) {
                filterWorkOrder.push(search.createFilter({
                    name: 'formuladate',
                    operator: search.Operator.ONORBEFORE,
                    values: options.to_date,
                    formula: "nvl({enddate},{custbody_scv_prod_end_date})"
                }));
            }
            filterWorkOrder.push(search.createFilter({
                name: 'custbody_scv_approval_status',
                operator: search.Operator.ANYOF,
                values: CustomApproveStatus.DA_DUYET
            }));
            if (options.assembly_lot) {
                let assembly_lots = options.assembly_lot.split(',');
                if (assembly_lots.length === 1) {
                    filterWorkOrder.push(search.createFilter({
                        name: 'custbody_scv_assembly_lot',
                        operator: search.Operator.IS,
                        values: options.assembly_lot
                    }));
                } else {
                    filterWorkOrder.push(search.createFilter({
                        name: 'formulatext',
                        operator: search.Operator.IS,
                        values: '1',
                        formula: `case when {custbody_scv_assembly_lot} in('${assembly_lots.join("','")}') then '1' else '0' end`
                    }));
                }
            }
            if (options.wo_center) {
                filterWorkOrder.push(search.createFilter({
                    name: 'custbody_scv_wo_center',
                    operator: search.Operator.ANYOF,
                    values: options.wo_center.split(',')
                }));
            }
            if (options.wo_ordertype) {
                filterWorkOrder.push(search.createFilter({
                    name: 'custbody_scv_work_order_type',
                    operator: search.Operator.ANYOF,
                    values: options.wo_ordertype
                }));
            }
            return filterWorkOrder;
        }
        
        const getAllReadyMapping = () => {
            let mapp = {};
            let f = [
                ["type", "anyof", "TrnfrOrd"], "AND",
                ["mainline", "is", "F"], "AND",
                //["custcol_scv_tl_wo", "noneof", "@NONE@"], "AND",
                //["custcol_scv_tl_wo.mainline", "is", "T"], "AND",
                //["custcol_scv_tl_wo.status", "anyof", "WorkOrd:A", "WorkOrd:B", "WorkOrd:D"]
                ['custcol_scv_wo_to_line_id', search.Operator.ISNOTEMPTY, '']
            ];
            let c = ['internalid', 'custcol_scv_tl_wo', 'custcol_scv_wo_to_line_id'];
            let s = search.create({type: 'transferorder', filters: f, columns: c});
            
            let r = s.runPaged({pageSize: 1000});
            let numPage = r.pageRanges.length;
            let searchPage, tempData, numTemp;
            for (let np = 0; np < numPage; np++) {
                searchPage = r.fetch({index: np});
                tempData = searchPage.data;
                if (tempData) {
                    numTemp = tempData.length;
                    for (let i = 0; i < numTemp; i++) {
                        let wo_to_line_id = String(tempData[i].getValue('custcol_scv_wo_to_line_id')).split(';');
                        for (let wo_line_id of wo_to_line_id) {
                            let wo_line_ids = wo_line_id.split(':');
                            let wo_id = wo_line_ids[0];
                            let wo_line_numbers = wo_line_ids[1].split(',');
                            for (let wo_line_number of wo_line_numbers) {
                                mapp[wo_id.toString() + '_' + wo_line_number] = true;
                            }
                        }
                    }
                }
            }
            
            return mapp;
        }
        
        const isAlreadyMapping = (wo_id, line_number, dictObj) => {
            let key = wo_id.toString() + '_' + line_number.toString();
            return !(key in dictObj);
        }
        
        return {
            onRequest
        };
        
        
    });