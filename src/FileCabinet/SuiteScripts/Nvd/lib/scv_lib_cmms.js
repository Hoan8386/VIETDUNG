/**
 * @NApiVersion 2.1
 */
define(['N/url'],
    
    (url) => {
        
        const CmmsScbdType = {
            SU_CO_PHAT_SINH: '2',
            HANG_THANG: '4',
            BAO_DUONG_PHAT_SINH: '101',
        }
        
        const CmmsScbdStatus = {
            DANG_THU_HIEN: '3',
            CHO_NGHIEM_THU: '4',
            THUE_NGOAI: '102',
            HOAN_THANH: '103',
            DA_DUYET: '109',
            PHC_THUC_HIEN: '113',
            PXCD_THUC_HIEN: '116'
        }
        
        const CmmsScbdForm = {
            TAI_SAN_KY_THUAT: '402',
            TAI_SAN_HANH_CHINH: '578'
        }
        
        const InventoryStatus = {
            MOI_CHO_KIEM_TRA: '1',
            MOI_DAT_CHAT_LUONG: '4',
            DA_HONG: '10'
        }
        
        const CmmsRecordType = {
            CHI_TIET_MAY: 'customrecord_scv_cmms_equipment',
            ORDER_TYPE: 'customrecord_scv_order_type',
            PURCHASE_REQUEST: 'custompurchase_scv_purchase_request',
            SUA_CHUA_BAO_DUONG: 'customrecord_scv_cmms_workorder',
            SCBD_DU_TOAN: 'customrecord_scv_cmms_budget',
            
            KE_HOACH_BAO_DUONG: 'customrecord_scv_cmms_maintenanceplan_h',
            KE_HOACH_BAO_DUONG_LINE: 'customrecord_scv_cmms_maintenanceplan_l',
            
            NGHIEM_THU_THIET_BI: 'customrecord_scv_nghiem_thu',
            DIEU_CHUYEN_TS: 'customrecord_scv_asset_transfer',
            
            YEU_CAU_NHAP_XUAT: 'customsale_scv_ot_yc_xvt'
        }
        
        const CmmsPrType = {
            NOI_DIA: '2'
        }
        
        const Department = {
            PHONG_XUAT_NHAP_KHAU: '8'
        }
        
        const Entity = {
            DEFAULT_PURCHASE_REQUEST: '146' //NCC_Default
        }
        
        const Item = {
            THUE_NGOAI_SUA_CHUA_MAY_MOC_THIET_BI: '83'
        }
        
        const CmmsOrderType = {
            VAT_TU_SUA_CHUA_BAO_DUONG: '39',
            XUAT_VAT_TU_SCBD_THAY_THE: '78'
        }
        
        const CmmsSublistId = {
            CHI_TIET_MAY_DINH_MUC: 'recmachcustrecord_scv_cmms_bom_equipment',
            
            ITEM: 'item',
            INVENTORY: 'inventory',
            INVENTORY_ASSIGNMENT: 'inventoryassignment',
            
            SCBD_DU_TOAN: 'recmachcustrecord_scv_cmms_bg_wo',
            SCBD_NHAN_CONG: 'recmachcustrecord_scv_cmms_lb_cmmswo',
            SCBD_THUE_NGOAI: 'recmachcustrecord_scv_cmms_os_wo',
            
            KHBD_CHI_TIET: 'recmachcustrecord_scv_cmms_mp_plan_l',
            KHBD_BG_PLAN: 'recmachcustrecord_scv_cmms_bg_plan',
            
            NGHIEM_THU_THIET_BI_CHI_TIET: 'recmachcustrecord_scv_accept_detail_no'
        }
        
        const CmmsCharToSplit = {
            SEMICOLON: ';'
        }
        
        const CmmsPassedFailed = {
            CHO_KIEM: '1',
            DAT: '2',
            KHONG_DAT: '3'
        }
        
        const CmmsFieldsAndFieldsHeader = {
            SCBD_DU_TOAN: [
                {
                    fieldId: 'custrecord_scv_cmms_bg_asset',
                    fieldIdHeader: 'custrecord_scv_cmms_wo_asset'
                },
                {
                    fieldId: 'custrecord_scv_cmms_bg_component',
                    fieldIdHeader: 'custrecord_scv_cmms_wo_component'
                },
                {
                    fieldId: 'custrecord_scv_cmms_bg_equipment',
                    fieldIdHeader: 'custrecord_scv_cmms_wo_equipment'
                }
            ]
        }
        
        const SessionId = {
            LIST_TAXCODE: 'listTaxcodeOnSession'
        }
        
        const FunctionJS = {
            REDIRECT: `
                window.addEventListener("message", function(event) {
                    let objectMessage = event.data;
                    if (objectMessage.type === 'redirectToRecord') {
                        window.location.href = objectMessage.redirectUrl;
                        window.close();
                    }
                }, false)
            `
        };
        
        const getDateNow = (gmt = 0) => {
            let now = new Date();
            let strDate = now.toString();
            let pSign = strDate.substring(28, 29);
            let pGmt = strDate.substring(29, 31);
            let hourToAdd = gmt;
            if (pSign === '-') {
                hourToAdd = hourToAdd + 1 * pGmt;
            } else {
                hourToAdd = hourToAdd - 1 * pGmt;
            }
            return new Date(now.getTime() + (hourToAdd * 3600000));
        }
        
        const clearSelectBin = (currentRecord, sublistIdResult, lineCountResult) => {
            for (let i = 0; i < lineCountResult; i++) {
                let fieldBin = currentRecord.getSublistField({
                    sublistId: sublistIdResult,
                    fieldId: 'custpage_binnumber',
                    line: i
                });
                fieldBin.removeSelectOption({value: null});
            }
        }
        
        const clearSelectFields = (currentRecord, sublistIdResult, lineCountResult, listFieldsId) => {
            for (let i = 0; i < lineCountResult; i++) {
                for (let fieldId of listFieldsId) {
                    let fieldSelect = currentRecord.getSublistField({
                        sublistId: sublistIdResult,
                        fieldId: fieldId,
                        line: i
                    });
                    fieldSelect.removeSelectOption({value: null});
                }
                currentRecord.selectLine({sublistId: sublistIdResult, line: i});
                currentRecord.setCurrentSublistValue({
                    sublistId: sublistIdResult,
                    fieldId: 'custpage_quantityavailable',
                    value: ''
                });
                currentRecord.commitLine({sublistId: sublistIdResult});
            }
        }
        
        const toggleFieldUseBins = (currentRecord, sublistIdResult, locationUserBins) => {
            let lineCountResult = currentRecord.getLineCount(sublistIdResult);
            for (let i = 0; i < lineCountResult; i++) {
                let fieldSearialLot = currentRecord.getSublistField({
                        sublistId: sublistIdResult,
                        fieldId: 'receiptinventorynumber',
                        line: i
                    })
                    || currentRecord.getSublistField({
                        sublistId: sublistIdResult,
                        fieldId: 'custpage_issueinventorynumber',
                        line: i
                    });
                let fieldBin = currentRecord.getSublistField({
                    sublistId: sublistIdResult,
                    fieldId: 'custpage_binnumber',
                    line: i
                });
                let islotitem = currentRecord.getSublistValue({
                    sublistId: sublistIdResult,
                    fieldId: 'islotitem',
                    line: i
                });
                let usebins = currentRecord.getSublistValue({sublistId: sublistIdResult, fieldId: 'usebins', line: i});
                fieldSearialLot.isDisabled = islotitem !== 'true';
                fieldBin.isDisabled = usebins !== 'true' || !locationUserBins;
            }
        }
        
        const getItemAvailable = (objParams, lrp) => {
            let listItemAvailable = [];
            if (objParams.location) {
                let params = [objParams.location, ...objParams.items];
                let inItems = objParams.items.map(() => '?').join(',');
                let sqlItemAvailable = `
                    select ib.item, ib.inventorystatus, BUILTIN.DF(ib.inventorystatus) inventorystatus_display, ib.inventorynumber , BUILTIN.DF(ib.inventorynumber) inventorynumber_display,
                        ib.quantityavailable, ib.binnumber, BUILTIN.DF(ib.binnumber) binnumber_display, ib.location
                    from inventorybalance ib
                    where ib.quantityavailable > 0 and ib.location = ? and ib.item in (${inItems})
                `;
                
                lrp.doSearchSqlAll(listItemAvailable, sqlItemAvailable, params);
                return listItemAvailable;
            }
            
        }
        
        const setCurrentSublistValueAmount = (scriptContext, options) => {
            let currentRecord = scriptContext.currentRecord;
            if (scriptContext.fieldId === options.fieldIdQuantity || scriptContext.fieldId === options.fieldIdRate) {
                let estimateamount = currentRecord.getCurrentSublistValue({
                        sublistId: scriptContext.sublistId,
                        fieldId: options.fieldIdQuantity
                    }) *
                    currentRecord.getCurrentSublistValue({
                        sublistId: scriptContext.sublistId,
                        fieldId: options.fieldIdRate
                    });
                currentRecord.setCurrentSublistValue({
                    sublistId: scriptContext.sublistId,
                    fieldId: options.fieldIdAmount,
                    value: estimateamount
                });
            }
        }
        
        const setSublistValueAmountLine = (newRecord, options) => {
            let bom_amount = newRecord.getSublistValue({
                    sublistId: options.sublistId,
                    fieldId: options.fieldIdQuantity,
                    line: options.line
                }) *
                newRecord.getSublistValue({
                    sublistId: options.sublistId,
                    fieldId: options.fieldIdRate,
                    line: options.line
                });
            newRecord.setSublistValue({
                sublistId: options.sublistId,
                fieldId: options.fieldIdAmount,
                value: bom_amount,
                line: options.line
            });
        }
        
        const setSublistValueAmount = (newRecord, options) => {
            let lcSublist = newRecord.getLineCount(options.sublistId);
            for (let i = 0; i < lcSublist; i++) {
                options.line = i;
                setSublistValueAmountLine(newRecord, options);
            }
        }
        
        const getTaxRate = (taxCode) => {
            let taxrate = 0;
            if(taxCode) {
                let context = nlapiGetContext();
                let listTaxcodeOnSession = JSON.parse(context.getSessionObject(SessionId.LIST_TAXCODE));
                let objTaxcode = listTaxcodeOnSession.find(o => o.internalid === taxCode);
                taxrate = objTaxcode ? Number(objTaxcode.rate.replace('%', '')) : 0
            }
            return taxrate;
        }
        
        const setCurrentSublistValueGrossAmount = (scriptContext, options) => {
            let currentRecord = scriptContext.currentRecord;
            if (scriptContext.fieldId === options.fieldIdAmount || scriptContext.fieldId === options.fieldIdTax) {
                let amount = currentRecord.getCurrentSublistValue({
                    sublistId: scriptContext.sublistId,
                    fieldId: options.fieldIdAmount
                });
                let taxCode = currentRecord.getCurrentSublistValue({
                    sublistId: scriptContext.sublistId,
                    fieldId: options.fieldIdTax
                });
                let taxrate = getTaxRate(taxCode);
                currentRecord.setCurrentSublistValue({
                    sublistId: scriptContext.sublistId,
                    fieldId: options.fieldIdGrossAmount,
                    value: amount * (1 + (taxrate / 100))
                });
            }
        }
        
        const setSublistValueGrossAmount = (runtime, newRecord, options) => {
            let lcSublist = newRecord.getLineCount(options.sublistId);
            for (let i = 0; i < lcSublist; i++) {
                options.line = i;
                setSublistValueGrossAmountLine(runtime, newRecord, options);
            }
        }
        
        const setSublistValueGrossAmountLine = (runtime, newRecord, options) => {
            let amount = newRecord.getSublistValue({
                sublistId: options.sublistId,
                fieldId: options.fieldIdAmount,
                line: options.line
            });
            let taxCode = newRecord.getSublistValue({
                sublistId: options.sublistId,
                fieldId: options.fieldIdTax,
                line: options.line
            });
            let taxrate = getTaxRateServer(runtime, taxCode);
            newRecord.getSublistValue({
                sublistId: options.sublistId,
                fieldId: options.fieldIdGrossAmount,
                value: amount * (1 + (taxrate / 100)),
                line: options.line
            });
        }
        
        const getTaxRateServer = (runtime, taxCode) => {
            let taxrate = 0;
            if(taxCode) {
                let listTaxcodeOnSession = JSON.parse(runtime.getCurrentSession().get('listTaxcodeOnSession'));
                let objTaxcode = listTaxcodeOnSession.find(o => o.internalid === taxCode);
                taxrate = objTaxcode ? Number(objTaxcode.rate.replace('%', '')) : 0
            }
            return taxrate;
        }
        
        const getScbdInfoBgPlan = (parameters) => {
            let recordTypeScbd = null, sublistIdBgPlan = null, scbdId = null, labelScbd = null, custpageScbd = null, fieldIdCreateby = null;
            if(parameters.custpage_scbd) {
                recordTypeScbd = CmmsRecordType.SUA_CHUA_BAO_DUONG;
                sublistIdBgPlan = CmmsSublistId.SCBD_DU_TOAN;
                scbdId = parameters.custpage_scbd;
                labelScbd = 'Phiếu SCBD';
                custpageScbd = 'custpage_scbd';
                fieldIdCreateby = 'custrecord_scv_cmms_wo_pic';
            } else if(parameters.custpage_khbd) {
                recordTypeScbd = CmmsRecordType.KE_HOACH_BAO_DUONG;
                sublistIdBgPlan = CmmsSublistId.KHBD_BG_PLAN;
                scbdId = parameters.custpage_khbd;
                labelScbd = 'Kế hoạch SCBD';
                custpageScbd = 'custpage_khbd';
                fieldIdCreateby = 'custrecord_scv_cmms_mp_creater';
            }
            return {recordTypeScbd, sublistIdBgPlan, scbdId, labelScbd, custpageScbd, fieldIdCreateby}
        }
        
        const isAPCCenter = (runtime) => {
            return runtime.getCurrentUser().roleCenter === 'PARTNERCENTER';
        }
        
        const writeRedirectToRecord = (response, recordId, recordType, isEditMode, params) => {
            let redirectUrl = url.resolveRecord({
                recordType: recordType,
                recordId: recordId,
                isEditMode: isEditMode,
                params: params
            }) + "&whence=";
            let objMessage = {
                type: 'redirectToRecord',
                redirectUrl
            }
            response.write(`
                <script>
                    if (window.parent) {
                        //window.parent.postMessage(${JSON.stringify(objMessage)}, window.location.origin);
                        window.parent.location.href = "${redirectUrl}";
                        window.parent.close();
                    } else {
                        window.location.href = "${redirectUrl}";
                    }
                </script>
            `);
        }
        
        const addListenerRedirectToRecord = (form) => {
            let inlineHtmlField = form.addField({
                id: 'custpage_postmessage_listener',
                label: 'PostMessage Handler',
                type: 'INLINEHTML'
            });
            inlineHtmlField.defaultValue = `<script>${FunctionJS.REDIRECT}</script>`;
        }
        
        return {
            CmmsScbdType,
            CmmsScbdStatus,
            CmmsScbdForm,
            InventoryStatus,
            CmmsRecordType,
            CmmsPrType,
            Department,
            Entity,
            Item,
            CmmsOrderType,
            CmmsSublistId,
            CmmsCharToSplit,
            CmmsPassedFailed,
            CmmsFieldsAndFieldsHeader,
            SessionId,
            FunctionJS,
            getDateNow,
            clearSelectBin,
            clearSelectFields,
            toggleFieldUseBins,
            getItemAvailable,
            setCurrentSublistValueAmount,
            setSublistValueAmountLine,
            setSublistValueAmount,
            setCurrentSublistValueGrossAmount,
            setSublistValueGrossAmount,
            setSublistValueGrossAmountLine,
            getScbdInfoBgPlan,
            isAPCCenter,
            writeRedirectToRecord,
            addListenerRedirectToRecord
        }
        
    });
