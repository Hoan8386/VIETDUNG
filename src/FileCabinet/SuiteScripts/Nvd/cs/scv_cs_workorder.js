/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/runtime', 'N/url', '../lib/scv_lib_cs', '../cons/scv_cons_record'],
    
    function (ccr, runtime, url, libCs, constRecord) {
        
        const SUBLIST_ID_WORK_ORDER = 'custpage_sublist_workorders';
        
        const LocType = {
            KHO_SAN_XUAT: '1',
            KHO_NVL_SAN_XUAT: '2'
        }
        
        /**
         * Function to be executed after page is initialized.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
         *
         * @since 2015.2
         */
        function pageInit(scriptContext) {
            let currentRecord = scriptContext.currentRecord;
            constRecord.initQuickFindFieldSelect(currentRecord, 'custpage_wo_center', {
                data: currentRecord.getField("custpage_wo_center").getSelectOptions(),
                valueExpr: "value",
                displayExpr: "text",
                reInsertOption: false
            }, false);
            constRecord.initQuickFindFieldSelect(currentRecord, 'custpage_assembly_lot', {
                data: currentRecord.getField("custpage_assembly_lot").getSelectOptions(),
                valueExpr: "value",
                displayExpr: "text",
                reInsertOption: false
            }, false);
        }
        
        /**
         * Function to be executed when field is changed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
         * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
         *
         * @since 2015.2
         */
        function fieldChanged(scriptContext) {
            let currentRecord = scriptContext.currentRecord;
            if (scriptContext.fieldId === 'custpage_subsidiary') {
                let listLocation = runtime.getCurrentSession().get('listLocation');
                listLocation = listLocation ? JSON.parse(listLocation) : [];
                let fieldLocation = currentRecord.getField('custpage_location');
                libCs.insertSelectionFromListValue(fieldLocation, true, null, listLocation.filter(o => String(o.subsidiary) === currentRecord.getValue('custpage_subsidiary') && String(o.loc_type) === LocType.KHO_SAN_XUAT));
                
                let listValueTextLocation = listLocation.filter(o => String(o.subsidiary) === currentRecord.getValue('custpage_subsidiary') && String(o.loc_type) === LocType.KHO_NVL_SAN_XUAT);
                let lineCount = currentRecord.getLineCount(SUBLIST_ID_WORK_ORDER);
                for (let i = 0; i < lineCount; i++) {
                    let fieldLocationFromLine = currentRecord.getSublistField({
                        sublistId: SUBLIST_ID_WORK_ORDER,
                        fieldId: 'custpage_from_location_line',
                        line: i
                    });
                    libCs.insertSelectionFromListValue(fieldLocationFromLine, true, null, listValueTextLocation);
                }
                
                let listWoCenter = runtime.getCurrentSession().get('listWoCenter2Transfer');
                listWoCenter = listWoCenter ? JSON.parse(listWoCenter) : [];
                listWoCenter = listWoCenter.filter(o => String(o.subsidiary) === currentRecord.getValue('custpage_subsidiary'));
                libCs.insertSelectionFromListValue(currentRecord.getField('custpage_wo_center'), false, currentRecord.getValue('custpage_wo_center'), listWoCenter);
            }
        }
        
        /**
         * Validation function to be executed when record is saved.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @returns {boolean} Return true if record is valid
         *
         * @since 2015.2
         */
        function saveRecord(scriptContext) {
            let isValid = false, isValidLocation = true;
            let currentRecord = scriptContext.currentRecord;
            let from_location = currentRecord.getValue('custpage_from_location');
            let lineCount = currentRecord.getLineCount(SUBLIST_ID_WORK_ORDER);
            for (let i = 0; i < lineCount; i++) {
                let isSelect = currentRecord.getSublistValue({
                    sublistId: SUBLIST_ID_WORK_ORDER,
                    fieldId: 'custpage_select',
                    line: i
                });
                if (isSelect === true || isSelect === 'T') {
                    isValid = true;
                    let location_line = currentRecord.getSublistValue({
                        sublistId: SUBLIST_ID_WORK_ORDER,
                        fieldId: 'custpage_from_location_line',
                        line: i
                    }) || from_location;
                    if (!location_line) {
                        isValidLocation = false;
                        break;
                    }
                }
            }
            if (!isValid) {
                alert('Vui lòng chọn ít nhất một dòng!');
            }
            if (!isValidLocation) {
                isValid = false;
                alert('Vui lòng chọn Từ kho!');
            }
            return isValid;
        }
        
        function searchWorkOrders() {
            window.onbeforeunload = null;
            let currentRecord = ccr.get();
            let urlTOReq = url.resolveScript({
                scriptId: 'customscriptscv_sl_wo2transfer',
                deploymentId: 'customdeploy_scv_sl_wo2tranf',
                returnExternalUrl: false
            });
            if (!currentRecord.getValue('custpage_location') || !currentRecord.getValue('custpage_subsidiary')) return;//dk bat buoc
            
            urlTOReq = urlTOReq + '&custpage_subsidiary=' + currentRecord.getValue('custpage_subsidiary')
                + '&custpage_location=' + currentRecord.getValue('custpage_location')
                + '&custpage_req_item=' + currentRecord.getValue('custpage_req_item')
                + '&custpage_req_item_type=' + currentRecord.getValue('custpage_req_item_type')
                + '&custpage_req_status=' + currentRecord.getValue('custpage_req_status')
                + '&custpage_req_from_date=' + currentRecord.getText("custpage_req_from_date")
                + '&custpage_req_to_date=' + currentRecord.getText("custpage_req_to_date")
                + '&custpage_from_location=' + currentRecord.getValue("custpage_from_location")
                + '&isSearch=T'
                + '&custpage_assembly_lot=' + currentRecord.getValue('custpage_assembly_lot').join(',')
                + '&custpage_wo_center=' + currentRecord.getValue('custpage_wo_center').join(',')
                + '&custpage_wo_ordertype=' + currentRecord.getValue('custpage_wo_ordertype');
            window.location.replace(urlTOReq);
        }
        
        function searchSalesOrders() {
            window.onbeforeunload = null;
            let currentRecord = ccr.get();
            let urlReq = url.resolveScript({
                scriptId: 'customscript_scv_sl_so2wo',
                deploymentId: 'customdeploy_scv_sl_so2wo',
                returnExternalUrl: false
            });
            urlReq = urlReq + '&custpage_saleorder=' + currentRecord.getValue('custpage_saleorder')
                + '&custpage_customer=' + currentRecord.getValue('custpage_customer');
            window.location.replace(urlReq);
        }
        
        
        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            saveRecord: saveRecord,
            searchWorkOrders: searchWorkOrders,
            searchSalesOrders: searchSalesOrders
        };
        
    });
