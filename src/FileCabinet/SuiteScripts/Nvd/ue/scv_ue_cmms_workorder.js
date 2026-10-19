/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/runtime', 'N/search', 'N/url',
        '../lib/scv_lib_cmms.js', '../lib/scv_lib_report.js', '../lib/scv_lib_current_code.js'],
    
    (record, runtime, search, url, libCmms, libRep, libCc) => {
        /**
         * Defines the function definition that is executed before record is loaded.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @param {Form} scriptContext.form - Current form
         * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
         * @since 2015.2
         */
        const beforeLoad = (scriptContext) => {
            let tgType = scriptContext.type;
            let newRecord = scriptContext.newRecord;
            let recType = newRecord.type;
            if (tgType === scriptContext.UserEventType.VIEW) {
                if (recType === libCmms.CmmsRecordType.SUA_CHUA_BAO_DUONG) {
                    let form = scriptContext.form;
                    let wo_status = newRecord.getValue('custrecord_scv_cmms_wo_status');
                    if (wo_status === libCmms.CmmsScbdStatus.DANG_THU_HIEN) {
                        addButtonChuyenKho(form, newRecord);
                    } else if (wo_status === libCmms.CmmsScbdStatus.HOAN_THANH) {
                        addButtonDeNghiNghiemThu(form, newRecord);
                    } else if (wo_status === libCmms.CmmsScbdStatus.THUE_NGOAI) {
                        addButtonThueNgoai(form, newRecord);
                    }
                    
                    if([libCmms.CmmsScbdStatus.DANG_THU_HIEN, libCmms.CmmsScbdStatus.DA_DUYET, libCmms.CmmsScbdStatus.THUE_NGOAI].includes(wo_status)) {
                        addButtonXuatVTThayThe(form, newRecord);
                        addButtonNhapVTTThuHoi(form, newRecord);
                        //libCmms.addListenerRedirectToRecord(form);
                    }
                    addButtonDieuChuyenTS(form, newRecord);
                }
            }
            
            if(!runtime.getCurrentSession().get(libCmms.SessionId.LIST_TAXCODE)) {
                let listTaxcodeOnSession = [];
                libRep.doSearchSSOrgPage('customsearch_scv_taxcode_search', 1000, listTaxcodeOnSession);
                runtime.getCurrentSession().set(libCmms.SessionId.LIST_TAXCODE, JSON.stringify(listTaxcodeOnSession));
            }
        }
        
        /*const getCustomForm = (newRecordIp) => {
            let newRecord = newRecordIp;
            let customform = newRecord.getValue('customform');
            if(!customform) {
                newRecord = record.load({type: newRecord.type, id: newRecord.id});
                customform = newRecord.getValue('customform');
            }
            return {newRecord, customform}
        }*/
        
        const addButtonDieuChuyenTS = (form, newRecord) => {
            let urlTransferOrder = url.resolveRecord({
                recordType: libCmms.CmmsRecordType.DIEU_CHUYEN_TS,
                recordId: null,
                isEditMode: true,
                params: {
                    scbd_id: newRecord.id
                }
            });
            form.addButton({
                id: 'custpage_chuyenkho',
                label: 'Điều chuyển TS',
                functionName: `window.location.replace("${urlTransferOrder}")`
            });
        }
        
        const addButtonChuyenKho = (form, newRecord) => {
            let currentUser = runtime.getCurrentUser();
            let lkFieldsUser = search.lookupFields({
                type: search.Type.ENTITY, id: currentUser.id,
                columns: ['custentity_scv_cmms_materiallocation', 'custentity_scv_cmms_maintenancelocation']
            });
            let urlTransferOrder = url.resolveRecord({
                recordType: record.Type.TRANSFER_ORDER,
                recordId: null,
                isEditMode: true,
                params: {
                    cmms_wo_action: record.Type.TRANSFER_ORDER,
                    scbd_id: newRecord.id,
                    cmms_materiallocation: lkFieldsUser.custentity_scv_cmms_materiallocation[0]?.value,
                    cmms_maintenancelocation: lkFieldsUser.custentity_scv_cmms_maintenancelocation[0]?.value,
                }
            });
            form.addButton({
                id: 'custpage_chuyenkho',
                label: 'Chuyển kho',
                functionName: `window.location.replace("${urlTransferOrder}")`
            });
        }
        
        const addButtonXuatVTThayThe = (form, newRecord) => {
            let urlXuatVtThayThe = url.resolveScript({
                scriptId: 'customscript_scv_sl_cmms_xuatvt_thaythe',
                deploymentId: 'customdeploy_scv_sl_cmms_xuatvt_thaythe',
                returnExternalUrl: false,
                params: {
                    custpage_scbd: newRecord.id
                }
            });
            form.addButton({
                id: 'custpage_xuatvtthaythe',
                label: 'Xuất VT',
                functionName: `
                    const offsetWidth = window.document.getElementById('main_form').children[0].offsetWidth + 300;
                    nlExtOpenWindow('${urlXuatVtThayThe}', 'xuatvt_thaythe', offsetWidth / 2, 550, this, false, 'Xuất vật tư thay thế')
                `
            });
        }
        
        const addButtonNhapVTTThuHoi = (form, newRecord) => {
            let urlNhapVtThuHoi = url.resolveScript({
                scriptId: 'customscript_scv_sl_cmms_nhapvt_thuhoi',
                deploymentId: 'customdeploy_scv_sl_cmms_nhapvt_thuhoi',
                returnExternalUrl: false,
                params: {
                    custpage_scbd: newRecord.id
                }
            });
            form.addButton({
                id: 'custpage_nhapvtthuhoi',
                label: 'Nhập VT',
                functionName: `
                    const offsetWidth = window.document.getElementById('main_form').children[0].offsetWidth + 200;
                    nlExtOpenWindow('${urlNhapVtThuHoi}', 'nhapvt_thuhoi', offsetWidth / 2, 550, this, false, 'Nhập vật tư thu hồi')
                `
            });
        }
        
        const addButtonDeNghiNghiemThu = (form, newRecord) => {
            let urlDeNghiNghiemThu = url.resolveRecord({
                recordType: libCmms.CmmsRecordType.NGHIEM_THU_THIET_BI,
                recordId: null,
                isEditMode: true,
                params: {
                    cmms_wo_action: libCmms.CmmsRecordType.NGHIEM_THU_THIET_BI,
                    scbd_id: newRecord.id
                }
            });
            form.addButton({
                id: 'custpage_chuyenkho',
                label: 'Đề nghị nghiệm thu',
                functionName: `window.location.replace("${urlDeNghiNghiemThu}")`
            });
        }
        
        const addButtonThueNgoai = (form, newRecord) => {
            let urlThueNgoai = url.resolveScript({
                scriptId: 'customscript_scv_sl_cmms_scbd_tn',
                deploymentId: 'customdeploy_scv_sl_cmms_scbd_tn',
                returnExternalUrl: false,
                params: {
                    custpage_scbd: newRecord.id
                }
            });
            
            form.addButton({
                id: 'custpage_thuengoai',
                label: 'Mua ngoài',
                functionName: `const offsetWidth = window.document.getElementById('main_form').children[0].offsetWidth - 200; nlExtOpenWindow('${urlThueNgoai}', 'thuengoai', offsetWidth / 2, 350, this, false, 'Mua ngoài')`
            });
            
        }
        
        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (scriptContext) => {
            let tgType = scriptContext.type;
            if (tgType === scriptContext.UserEventType.CREATE || tgType === scriptContext.UserEventType.COPY || tgType === scriptContext.UserEventType.EDIT) {
                let newRecord = scriptContext.newRecord;
                setSublistValueAmount(newRecord);
                let wo_type = newRecord.getValue('custrecord_scv_cmms_wo_type');
                let wo_equipment = newRecord.getValue('custrecord_scv_cmms_wo_equipment');
                if (wo_equipment && wo_type === libCmms.CmmsScbdType.HANG_THANG) {
                    let lineCountDuToan = newRecord.getLineCount({sublistId: libCmms.CmmsSublistId.SCBD_DU_TOAN});
                    if (!lineCountDuToan) {
                        insertNewLineScbdDuToan(newRecord);
                    }
                }
                let name = newRecord.getValue('name');
                let wo_date = newRecord.getValue('custrecord_scv_cmms_wo_date')
                if ((!name || name === libCc.NAME_TOBE_GENERATED) && wo_date) {
                    let prefix = `SCBD${String(wo_date.getFullYear()).slice(-2)}${String(wo_date.getMonth() + 1).padStart(2, '0')}`;
                    let currentValueCode = libCc.generateCurrentValueCode(prefix, 0, 3);
                    newRecord.setValue('name', currentValueCode);
                }
            }
        }
        
        const setSublistValueAmount = (newRecord) => {
            let optionsDuToanEstimate = {
                sublistId: libCmms.CmmsSublistId.SCBD_DU_TOAN,
                fieldIdQuantity: 'custrecord_scv_cmms_bg_estimatequantity',
                fieldIdRate: 'custrecord_scv_cmms_bg_estimaterate',
                fieldIdAmount: 'custrecord_scv_cmms_bg_estimateamount',
                line: null
            };
            let optionsDuToanActual = {
                sublistId: libCmms.CmmsSublistId.SCBD_DU_TOAN,
                fieldIdQuantity: 'custrecord_scv_cmms_bg_actualquantity',
                fieldIdRate: 'custrecord_scv_cmms_bg_actualrate',
                fieldIdAmount: 'custrecord_scv_cmms_bg_actualamount',
                line: null
            };
            let lcDuToan = newRecord.getLineCount(optionsDuToanEstimate.sublistId);
            for (let i = 0; i < lcDuToan; i++) {
                optionsDuToanEstimate.line = i;
                libCmms.setSublistValueAmountLine(newRecord, optionsDuToanEstimate);
                optionsDuToanActual.line = i;
                libCmms.setSublistValueAmountLine(newRecord, optionsDuToanActual);
            }
            
            let optionsThueNgoai = {
                sublistId: libCmms.CmmsSublistId.SCBD_THUE_NGOAI,
                fieldIdQuantity: 'custrecord_scv_cmms_os_quantity',
                fieldIdRate: 'custrecord_scv_cmms_os_rate',
                fieldIdAmount: 'custrecord_scv_cmms_os_amount',
                fieldIdTax: 'custrecord_scv_cmms_os_vat',
                fieldIdGrossAmount: 'custrecord_scv_cmms_os_grossamount',
                line: null
            };
            libCmms.setSublistValueAmount(newRecord, optionsThueNgoai);
            libCmms.setSublistValueGrossAmount(runtime, newRecord, optionsThueNgoai);
            
            let optionsNhanCongPlan = {
                sublistId: libCmms.CmmsSublistId.SCBD_NHAN_CONG,
                fieldIdQuantity: 'custrecord_scv_cmms_lb_planquantity',
                fieldIdRate: 'custrecord_scv_cmms_lb_planrate',
                fieldIdAmount: 'custrecord_scv_cmms_lb_planamout',
                line: null
            };
            let optionsNhanCongActual = {
                sublistId: libCmms.CmmsSublistId.SCBD_NHAN_CONG,
                fieldIdQuantity: 'custrecord_scv_cmms_lb_actualquantity',
                fieldIdRate: 'custrecord_scv_cmms_lb_actualrate',
                fieldIdAmount: 'custrecord_scv_cmms_lb_actualamount',
                line: null
            };
            let lcNhanCong = newRecord.getLineCount(optionsNhanCongPlan.sublistId);
            for (let i = 0; i < lcNhanCong; i++) {
                optionsNhanCongPlan.line = i;
                libCmms.setSublistValueAmountLine(newRecord, optionsNhanCongPlan);
                optionsNhanCongActual.line = i;
                libCmms.setSublistValueAmountLine(newRecord, optionsNhanCongActual);
            }
        }
        
        const insertNewLineScbdDuToan = (newRecord) => {
            let wo_equipment = newRecord.getValue('custrecord_scv_cmms_wo_equipment');
            let recWoEquipment = record.load({type: libCmms.CmmsRecordType.CHI_TIET_MAY, id: wo_equipment});
            let linetCountCtmDinhMuc = recWoEquipment.getLineCount(libCmms.CmmsSublistId.CHI_TIET_MAY_DINH_MUC);
            for (let i = 0; i < linetCountCtmDinhMuc; i++) {
                newRecord.setSublistValue({
                    sublistId: libCmms.CmmsSublistId.SCBD_DU_TOAN,
                    fieldId: 'custrecord_scv_cmms_bg_asset',
                    line: i,
                    value: newRecord.getValue('custrecord_scv_cmms_wo_asset')
                });
                newRecord.setSublistValue({
                    sublistId: libCmms.CmmsSublistId.SCBD_DU_TOAN,
                    fieldId: 'custrecord_scv_cmms_bg_component',
                    line: i,
                    value: newRecord.getValue('custrecord_scv_cmms_wo_component')
                });
                newRecord.setSublistValue({
                    sublistId: libCmms.CmmsSublistId.SCBD_DU_TOAN,
                    fieldId: 'custrecord_scv_cmms_bg_equipment',
                    line: i,
                    value: newRecord.getValue('custrecord_scv_cmms_wo_equipment')
                });
                let bom_item = recWoEquipment.getSublistValue({
                    sublistId: libCmms.CmmsSublistId.CHI_TIET_MAY_DINH_MUC,
                    fieldId: 'custrecord_scv_cmms_bom_item',
                    line: i
                });
                newRecord.setSublistValue({
                    sublistId: libCmms.CmmsSublistId.SCBD_DU_TOAN,
                    fieldId: 'custrecord_scv_cmms_bg_item',
                    line: i,
                    value: bom_item
                });
                newRecord.setSublistValue({
                    sublistId: libCmms.CmmsSublistId.SCBD_DU_TOAN, fieldId: 'custrecord_scv_cmms_bg_unit', line: i,
                    value: recWoEquipment.getSublistValue({
                        sublistId: libCmms.CmmsSublistId.CHI_TIET_MAY_DINH_MUC,
                        fieldId: 'custrecord_cmms_bom_unit',
                        line: i
                    })
                });
                let bom_quantity = recWoEquipment.getSublistValue({
                    sublistId: libCmms.CmmsSublistId.CHI_TIET_MAY_DINH_MUC,
                    fieldId: 'custrecord_scv_cmms_bom_quantity',
                    line: i
                });
                let bom_rate = recWoEquipment.getSublistValue({
                    sublistId: libCmms.CmmsSublistId.CHI_TIET_MAY_DINH_MUC,
                    fieldId: 'custrecord_scv_cmms_bom_rate',
                    line: i
                });
                newRecord.setSublistValue({
                    sublistId: libCmms.CmmsSublistId.SCBD_DU_TOAN,
                    fieldId: 'custrecord_scv_cmms_bg_estimatequantity',
                    line: i,
                    value: bom_quantity
                });
                newRecord.setSublistValue({
                    sublistId: libCmms.CmmsSublistId.SCBD_DU_TOAN,
                    fieldId: 'custrecord_scv_cmms_bg_estimaterate',
                    line: i,
                    value: bom_rate
                });
                let amount = bom_quantity * bom_rate;
                newRecord.setSublistValue({
                    sublistId: libCmms.CmmsSublistId.SCBD_DU_TOAN,
                    fieldId: 'custrecord_scv_cmms_bg_estimateamount',
                    line: i,
                    value: amount
                });
                
                newRecord.setSublistValue({
                    sublistId: libCmms.CmmsSublistId.SCBD_DU_TOAN,
                    fieldId: 'custrecord_scv_cmms_bg_actualitem',
                    line: i,
                    value: bom_item
                });
                newRecord.setSublistValue({
                    sublistId: libCmms.CmmsSublistId.SCBD_DU_TOAN,
                    fieldId: 'custrecord_scv_cmms_bg_actualquantity',
                    line: i,
                    value: bom_quantity
                });
                newRecord.setSublistValue({
                    sublistId: libCmms.CmmsSublistId.SCBD_DU_TOAN,
                    fieldId: 'custrecord_scv_cmms_bg_actualrate',
                    line: i,
                    value: bom_rate
                });
                newRecord.setSublistValue({
                    sublistId: libCmms.CmmsSublistId.SCBD_DU_TOAN,
                    fieldId: 'custrecord_scv_cmms_bg_actualamount',
                    line: i,
                    value: amount
                });
            }
        }
        
        return {beforeLoad, beforeSubmit}
        
    });
