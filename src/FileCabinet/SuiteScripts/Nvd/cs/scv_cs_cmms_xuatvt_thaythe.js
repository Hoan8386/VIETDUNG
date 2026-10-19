/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/search', 'N/url', '../lib/scv_lib_cs', '../lib/scv_lib_cmms'],
    
    function (ccr, search, url, libCs, libCmms) {
        
        const SUBLIST_RESULT = 'custpage_sl_result';
        const FIELDID_SELECT = 'chon';
        
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
            let lineCountResult = currentRecord.getLineCount(SUBLIST_RESULT);
            for (let i = 0; i < lineCountResult; i++) {
                let fieldQuantityAvaiable = currentRecord.getSublistField({
                    sublistId: SUBLIST_RESULT,
                    fieldId: 'custpage_quantityavailable',
                    line: i
                });
                fieldQuantityAvaiable.isDisabled = true;
            }
            initInventory(currentRecord, lineCountResult);
        }
        
        const URL_RQ = '/app/site/hosting/scriptlet.nl?script=customscript_scv_sl_cmms_xuatvt_thaythe&deploy=customdeploy_scv_sl_cmms_xuatvt_thaythe';
        
        const getListItem = (currentRecord, lineCountResult) => {
            let listItemLine = [];
            for (let i = 0; i < lineCountResult; i++) {
                let item = currentRecord.getSublistValue({
                    sublistId: SUBLIST_RESULT,
                    fieldId: 'custrecord_scv_cmms_bg_actualitem',
                    line: i
                });
                let fieldBin = currentRecord.getSublistField({
                    sublistId: SUBLIST_RESULT,
                    fieldId: 'custpage_binnumber',
                    line: i
                });
                let fieldSerialLot = currentRecord.getSublistField({
                    sublistId: SUBLIST_RESULT,
                    fieldId: 'custpage_issueinventorynumber',
                    line: i
                });
                let fieldInventoryStatus = currentRecord.getSublistField({
                    sublistId: SUBLIST_RESULT,
                    fieldId: 'custpage_inventorystatus',
                    line: i
                });
                listItemLine.push({item, fieldBin, fieldSerialLot, fieldInventoryStatus, line: i});
            }
            return listItemLine;
        }
        
        const initInventory = (currentRecord, lineCountResult) => {
            let location = currentRecord.getValue('custpage_location');
            if (lineCountResult && location) {
                let listItemLine = getListItem(currentRecord, lineCountResult);
                let items = listItemLine.map(o => o.item);
                
                let params = {
                    custpage_location: location, items: JSON.stringify(items), isGetData: 'T'
                };
                let resCallData = nlapiRequestURL(URL_RQ, params);
                let {listItemAvailable} = JSON.parse(libCs.parseBodyDatax3C(resCallData.getBody()));
                sessionStorage.setItem('listItemAvailable', JSON.stringify(listItemAvailable));
                
                for (let objItem of listItemLine) {
                    let listItemAvailableSerialLot = listItemAvailable.filter(o => String(o.item) === objItem.item && o.inventorynumber).map(o => {
                        return {value: o.inventorynumber, text: o.inventorynumber_display}
                    });
                    libCs.insertSelectionFlowListValue([objItem.fieldSerialLot], true, null, listItemAvailableSerialLot);
                    addSelectionBinnumber({
                        listItemAvailable,
                        fieldBin: objItem.fieldBin,
                        item: objItem.item,
                        inventorynumber: ''
                    });
                    let {listItemAvailableStatus} = addSelectionInventoryStatus({
                        listItemAvailable,
                        fieldInventoryStatus: objItem.fieldInventoryStatus,
                        item: objItem.item,
                        inventorynumber: '',
                        binnumber: '',
                        inventorystatus: libCmms.InventoryStatus.MOI_DAT_CHAT_LUONG
                    });
                    currentRecord.selectLine({sublistId: SUBLIST_RESULT, line: objItem.line});
                    setCurrentSublistValueDefaultInventoryStatus(currentRecord, listItemAvailableStatus);
                    currentRecord.commitLine({sublistId: SUBLIST_RESULT});
                }
            }
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
            if (scriptContext.fieldId === 'custpage_location') {
                let lineCountResult = currentRecord.getLineCount(SUBLIST_RESULT);
                libCmms.clearSelectFields(currentRecord, SUBLIST_RESULT, lineCountResult, ['custpage_issueinventorynumber', 'custpage_binnumber', 'custpage_inventorystatus']);
                initInventory(currentRecord, lineCountResult);
            } else if (scriptContext.fieldId === 'custpage_issueinventorynumber') {
                let inventorynumber = currentRecord.getCurrentSublistValue({
                    sublistId: scriptContext.sublistId,
                    fieldId: 'custpage_issueinventorynumber'
                });
                let fieldBin = currentRecord.getCurrentSublistField({
                    sublistId: scriptContext.sublistId,
                    fieldId: 'custpage_binnumber'
                });
                let fieldInventoryStatus = currentRecord.getCurrentSublistField({
                    sublistId: SUBLIST_RESULT,
                    fieldId: 'custpage_inventorystatus'
                });
                if (inventorynumber) {
                    let item = currentRecord.getCurrentSublistValue({
                        sublistId: scriptContext.sublistId,
                        fieldId: 'custrecord_scv_cmms_bg_actualitem'
                    });
                    let listItemAvailable = JSON.parse(sessionStorage.getItem('listItemAvailable'));
                    addSelectionBinnumber({listItemAvailable, fieldBin, item, inventorynumber});
                    let {listItemAvailableStatus} = addSelectionInventoryStatus({
                        listItemAvailable,
                        fieldInventoryStatus,
                        item,
                        inventorynumber,
                        binnumber: '',
                        inventorystatus: libCmms.InventoryStatus.MOI_DAT_CHAT_LUONG
                    });
                    setCurrentSublistValueDefaultInventoryStatus(currentRecord, listItemAvailableStatus);
                } else {
                    fieldBin.removeSelectOption({value: null});
                    fieldInventoryStatus.removeSelectOption({value: null});
                }
            } else if (scriptContext.fieldId === 'custpage_binnumber') {
                let fieldInventoryStatus = currentRecord.getCurrentSublistField({
                    sublistId: SUBLIST_RESULT,
                    fieldId: 'custpage_inventorystatus'
                });
                let binnumber = currentRecord.getCurrentSublistValue({
                    sublistId: scriptContext.sublistId,
                    fieldId: 'custpage_binnumber'
                });
                if (binnumber) {
                    let item = currentRecord.getCurrentSublistValue({
                        sublistId: scriptContext.sublistId,
                        fieldId: 'custrecord_scv_cmms_bg_actualitem'
                    });
                    let inventorynumber = currentRecord.getCurrentSublistValue({
                        sublistId: scriptContext.sublistId,
                        fieldId: 'custpage_issueinventorynumber'
                    });
                    let listItemAvailable = JSON.parse(sessionStorage.getItem('listItemAvailable'));
                    let {listItemAvailableStatus} = addSelectionInventoryStatus({
                        listItemAvailable,
                        fieldInventoryStatus,
                        item,
                        inventorynumber,
                        binnumber,
                        inventorystatus: libCmms.InventoryStatus.MOI_DAT_CHAT_LUONG
                    });
                    setCurrentSublistValueDefaultInventoryStatus(currentRecord, listItemAvailableStatus);
                } else {
                    fieldInventoryStatus.removeSelectOption({value: null});
                }
            } else if (scriptContext.fieldId === 'custpage_inventorystatus') {
                let binnumber = currentRecord.getCurrentSublistValue({
                    sublistId: scriptContext.sublistId,
                    fieldId: 'custpage_binnumber'
                });
                let item = currentRecord.getCurrentSublistValue({
                    sublistId: scriptContext.sublistId,
                    fieldId: 'custrecord_scv_cmms_bg_actualitem'
                });
                let inventorynumber = currentRecord.getCurrentSublistValue({
                    sublistId: scriptContext.sublistId,
                    fieldId: 'custpage_issueinventorynumber'
                });
                let inventorystatus = currentRecord.getCurrentSublistValue({
                    sublistId: scriptContext.sublistId,
                    fieldId: 'custpage_inventorystatus'
                });
                if (inventorystatus) {
                    let listItemAvailable = JSON.parse(sessionStorage.getItem('listItemAvailable'));
                    let listItemAvailableStatus = listItemAvailable.filter(o => String(o.item) === item && (!o.inventorynumber || String(o.inventorynumber) === inventorynumber) && (!o.binnumber || String(o.binnumber) === binnumber) && String(o.inventorystatus) === inventorystatus);
                    currentRecord.setCurrentSublistValue({
                        sublistId: SUBLIST_RESULT,
                        fieldId: 'custpage_quantityavailable',
                        value: listItemAvailableStatus[0]?.quantityavailable ?? ''
                    });
                } else {
                    currentRecord.setCurrentSublistValue({
                        sublistId: SUBLIST_RESULT,
                        fieldId: 'custpage_quantityavailable',
                        value: ''
                    });
                }
            }
        }
        
        const addSelectionBinnumber = (options) => {
            let {listItemAvailable, fieldBin, item, inventorynumber, binnumber} = options;
            let listItemAvailableBin = listItemAvailable.filter(o => String(o.item) === item && (!o.inventorynumber || String(o.inventorynumber) === inventorynumber) && o.binnumber).map(o => {
                return {value: o.binnumber, text: o.binnumber_display}
            });
            libCs.insertSelectionFlowListValue([fieldBin], true, binnumber, listItemAvailableBin);
        }
        
        const addSelectionInventoryStatus = (options) => {
            let {listItemAvailable, fieldInventoryStatus, item, inventorynumber, binnumber, inventorystatus} = options;
            let listItemAvailableStatus = listItemAvailable.filter(o => String(o.item) === item && (!o.inventorynumber || String(o.inventorynumber) === inventorynumber) && (!o.binnumber || String(o.binnumber) === binnumber) && o.inventorystatus).map(o => {
                return {value: o.inventorystatus, text: o.inventorystatus_display, quantityavailable: o.quantityavailable}
            });
            libCs.insertSelectionFlowListValue([fieldInventoryStatus], true, inventorystatus, listItemAvailableStatus);
            return {listItemAvailableStatus}
        }
        
        const setCurrentSublistValueDefaultInventoryStatus = (currentRecord, listItemAvailableStatus) => {
            let objItemAvailableStatusDefault = listItemAvailableStatus.find(o => String(o.value) === libCmms.InventoryStatus.MOI_DAT_CHAT_LUONG);
            let quantityavailable = '';
            if (objItemAvailableStatusDefault) {
                currentRecord.setCurrentSublistValue({
                    sublistId: SUBLIST_RESULT,
                    fieldId: 'custpage_inventorystatus',
                    value: objItemAvailableStatusDefault.value
                });
                quantityavailable = objItemAvailableStatusDefault.quantityavailable || '';
            }
            currentRecord.setCurrentSublistValue({
                sublistId: SUBLIST_RESULT,
                fieldId: 'custpage_quantityavailable',
                value: quantityavailable
            });
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
            let isValid = false;
            let currentRecord = scriptContext.currentRecord;
            
            let location = currentRecord.getValue('custpage_location');
            if (!location) {
                alert('Hãy nhập Kho!');
                return isValid;
            }
            let message = 'Hãy chọn ít nhất một line!';
            
            let lookupFieldsBin = search.lookupFields({
                type: search.Type.LOCATION,
                id: location,
                columns: ['usesbins']
            });
            let lineCount = currentRecord.getLineCount(SUBLIST_RESULT);
            
            for (let i = 0; i < lineCount; i++) {
                let chon = currentRecord.getSublistValue({sublistId: SUBLIST_RESULT, fieldId: FIELDID_SELECT, line: i});
                let islotitem = currentRecord.getSublistValue({
                    sublistId: SUBLIST_RESULT,
                    fieldId: 'islotitem',
                    line: i
                });
                let issueinventorynumber = currentRecord.getSublistValue({
                    sublistId: SUBLIST_RESULT,
                    fieldId: 'custpage_issueinventorynumber',
                    line: i
                });
                let binnumber = currentRecord.getSublistValue({
                    sublistId: SUBLIST_RESULT,
                    fieldId: 'custpage_binnumber',
                    line: i
                });
                let inventorystatus = currentRecord.getSublistValue({
                    sublistId: SUBLIST_RESULT,
                    fieldId: 'custpage_inventorystatus',
                    line: i
                });
                let usebins = currentRecord.getSublistValue({sublistId: SUBLIST_RESULT, fieldId: 'usebins', line: i});
                let actualquantity = currentRecord.getSublistValue({sublistId: SUBLIST_RESULT, fieldId: 'custrecord_scv_cmms_bg_actualquantity', line: i});
                let quantityavailable = currentRecord.getSublistValue({sublistId: SUBLIST_RESULT, fieldId: 'custpage_quantityavailable', line: i});
                if (chon === true) {
                    isValid = true;
                    if (islotitem === 'true') {
                        if (!issueinventorynumber) {
                            message = 'Hãy nhập Searial/Lot Number!';
                            isValid = false;
                            break;
                        }
                        if (!inventorystatus) {
                            message = 'Hãy nhập Trạng thái!';
                            isValid = false;
                            break;
                        }
                    }
                    if ((lookupFieldsBin.usesbins === true && usebins === 'true') && !binnumber) {
                        message = 'Hãy nhập BIN!';
                        isValid = false;
                        break;
                    }
                    if(actualquantity > quantityavailable) {
                        let itemDisplay = currentRecord.getSublistValue({sublistId: SUBLIST_RESULT, fieldId: 'custrecord_scv_cmms_bg_actualitem_display', line: i});
                        message = `Tồn kho cho ${itemDisplay} không đủ số lượng để xuất!`;
                        isValid = false;
                        break;
                    }
                }
            }
            if (!isValid) {
                alert(message);
            } else if(currentRecord.getValue('custpage_ordertype')) {
                libCs.showPleaseWait();
            }
            return isValid;
        }
        
        function searchReport() {
            window.onbeforeunload = null;
            let currentRecord = ccr.get();
            let urlDC = getUrlParam(currentRecord) + '&issearch=T';
            window.location.replace(urlDC);
        }
        
        function getUrlParam(currentRecord) {
            return url.resolveScript({
                scriptId: 'customscript_scv_sl_cmms_xuatvt_thaythe',
                deploymentId: 'customdeploy_scv_sl_cmms_xuatvt_thaythe',
                returnExternalUrl: false,
                params: getParam(currentRecord)
            });
        }
        
        function getParam(currentRecord) {
            return {
                custpage_subsidiary: currentRecord.getValue('custpage_subsidiary'),
                custpage_asset: currentRecord.getValue('custpage_asset'),
                custpage_location: currentRecord.getValue('custpage_location'),
                custpage_trandate: currentRecord.getText('custpage_trandate'),
                custpage_scbd: currentRecord.getText('custpage_scbd')
            }
        }
        
        function markAll() {
            setValueSelect(SUBLIST_RESULT, FIELDID_SELECT, true);
        }
        
        function unmarkAll() {
            setValueSelect(SUBLIST_RESULT, FIELDID_SELECT, false);
        }
        
        function setValueSelect(sl, sf_select, value) {
            let currentRecord = ccr.get();
            let lc = currentRecord.getLineCount(sl);
            for (let i = 0; i < lc; i++) {
                currentRecord.selectLine({sublistId: sl, line: i});
                currentRecord.setCurrentSublistValue({sublistId: sl, fieldId: sf_select, value: value});
                currentRecord.commitLine(sl);
            }
        }
        
        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            saveRecord: saveRecord,
            searchReport: searchReport,
            markAll: markAll,
            unmarkAll: unmarkAll
        };
        
    });
