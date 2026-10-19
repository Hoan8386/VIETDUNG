/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/runtime', 'N/search', 'N/url',
        '../lib/scv_lib_cmms.js', '../lib/scv_lib_current_code.js'],
    (record, runtime, search, url, libCmms, libCc) => {
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
                if (recType === libCmms.CmmsRecordType.KE_HOACH_BAO_DUONG) {
                    let form = scriptContext.form;
                    let mp_status = newRecord.getValue('custrecord_scv_cmms_mp_status');
                    if (mp_status === libCmms.CmmsScbdStatus.HOAN_THANH) {
                        let mp_iscreatewo = newRecord.getValue('custrecord_scv_cmms_mp_iscreatewo');
                        if (mp_iscreatewo > 0) {
                            addButtonTaoGiaoViec(form, newRecord);
                        }
                    } else if (mp_status === libCmms.CmmsScbdStatus.DANG_THU_HIEN) {
                        addButtonChuyenKho(form, newRecord);
                    }
                    if ([libCmms.CmmsScbdStatus.DANG_THU_HIEN, libCmms.CmmsScbdStatus.PXCD_THUC_HIEN].includes(mp_status)) {
                        addButtonXuatVTThayThe(form, newRecord);
                        addButtonNhapVTTThuHoi(form, newRecord);
                        //libCmms.addListenerRedirectToRecord(form);
                    }
                }
            }
        }

        /*const isCreateTaoGiaoViec = (recMaintennancePlan) => {
            let lineCountKHBDChiTiet = recMaintennancePlan.getLineCount({sublistId: libCmms.CmmsSublistId.KHBD_CHI_TIET});
            let isCreateTaoGiaoViec = false;
            for(let i = 0; i < lineCountKHBDChiTiet; i++) {
                let workorder_l = recMaintennancePlan.getSublistValue({
                    sublistId: libCmms.CmmsSublistId.KHBD_CHI_TIET,
                    fieldId: 'custrecord_scv_cmms_mp_workorder_l',
                    line: i
                });
                if(!workorder_l) {
                    isCreateTaoGiaoViec = true; break;
                }
            }
            return isCreateTaoGiaoViec;
        }*/

        const addButtonTaoGiaoViec = (form, newRecord) => {
            let urlTaoGiaoViec = url.resolveScript({
                scriptId: 'customscript_scv_sl_cmms_taogiaoviec',
                deploymentId: 'customdeploy_scv_sl_cmms_taogiaoviec',
                returnExternalUrl: false,
                params: {
                    custpage_maintenanceplan: newRecord.id
                }
            });
            form.addButton({
                id: 'custpage_taogiaoviec',
                label: 'Cập nhật lý lịch thiết bị',
                functionName: `const offsetWidth = window.document.getElementById('main_form').children[0].offsetWidth + 200; nlExtOpenWindow('${urlTaoGiaoViec}', 'xuatvt_thaythe', offsetWidth / 2, 550, this, false, 'Cập nhật lý lịch thiết bị')`
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
                    khbd_id: newRecord.id,
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
                    custpage_khbd: newRecord.id
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
                    custpage_khbd: newRecord.id
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
                if (tgType !== scriptContext.UserEventType.EDIT) {
                    let currentUser = runtime.getCurrentUser();
                    let user = currentUser.id;
                    let roleCenter = currentUser.roleCenter;
                    if (roleCenter === 'PARTNERCENTER' || roleCenter === 'PARTNER') {
                        let lkParter = search.lookupFields({
                            type: search.Type.PARTNER,
                            id: user,
                            columns: ['custentity_scv_partner_employee']
                        });
                        user = lkParter.custentity_scv_partner_employee[0]?.value;
                    }
                    newRecord.setValue('custrecord_scv_cmms_mp_creater', user);
                }
                let name = newRecord.getValue('name');
                let mp_date = newRecord.getValue('custrecord_scv_cmms_mp_date')
                if ((!name || name === libCc.NAME_TOBE_GENERATED) && mp_date) {
                    let prefix = `KHBD${String(mp_date.getFullYear()).slice(-2)}${String(mp_date.getMonth() + 1).padStart(2, '0')}`;
                    let currentValueCode = libCc.generateCurrentValueCode(prefix, 0, 3);
                    newRecord.setValue('name', currentValueCode);
                }
            }
        }

        /**
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const afterSubmit = (scriptContext) => {

        }

        return {beforeLoad, beforeSubmit, afterSubmit}

    });
