/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/search', 'N/url', '../lib/scv_lib_cs.js', '../lib/scv_lib_cmms.js'],
    
    function (ccr, search, url, libCs, libCmms) {
        
        const SUBLIST_RESULT = 'custpage_sl_result';
        const FIELDID_SELECT = 'chon';
        
        /**
         * Helper function to get location lookup fields
         * @param {string} location - Location ID
         * @param {Array} columns - Columns to retrieve (optional)
         * @returns {Object} Lookup fields result
         */
        const getLocationLookupFields = (location, columns) => {
            return search.lookupFields({
                type: search.Type.LOCATION,
                id: location,
                columns: columns || ['usesbins', 'custrecord_scv_loc_defaultreceiptstatus']
            });
        };

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
            let location = currentRecord.getValue('custpage_location');
            let locationUserBins = false;
            let fieldOfLocation = null;
            if (location) {
                fieldOfLocation = getLocationLookupFields(location);
                locationUserBins = fieldOfLocation.usesbins;
            }
            libCmms.toggleFieldUseBins(currentRecord, SUBLIST_RESULT, locationUserBins);
            let lineCountResult = currentRecord.getLineCount(SUBLIST_RESULT);
            initInventory(currentRecord, lineCountResult, fieldOfLocation);
        }
        
        const initInventory = (currentRecord, lineCountResult, fieldOfLocation) => {
            if (lineCountResult) {
                let location = currentRecord.getValue('custpage_location');
                if (location) {
                    // If fieldOfLocation is not provided, query it
                    if (!fieldOfLocation) {
                        fieldOfLocation = getLocationLookupFields(location);
                    }
                    let locationUserBins = fieldOfLocation.usesbins;
                    let defaultReceiptStatus = fieldOfLocation.custrecord_scv_loc_defaultreceiptstatus[0]?.value || libCmms.InventoryStatus.MOI_DAT_CHAT_LUONG;
                    if (locationUserBins === true) {
                        let listFieldBin = [];
                        for (let i = 0; i < lineCountResult; i++) {
                            let fieldBin = currentRecord.getSublistField({
                                sublistId: SUBLIST_RESULT,
                                fieldId: 'custpage_binnumber',
                                line: i
                            });
                            listFieldBin.push(fieldBin);
                            currentRecord.selectLine({sublistId: SUBLIST_RESULT, line: i});
                            currentRecord.setCurrentSublistValue({sublistId: SUBLIST_RESULT, fieldId: 'custpage_inventorystatus', value: defaultReceiptStatus});
                            currentRecord.commitLine({sublistId: SUBLIST_RESULT});
                        }
                        let cb = ['internalid', 'binnumber'];
                        let fb = [['inactive', 'is', false], 'and', ['location', 'anyof', location]];
                        libCs.insertSelection(listFieldBin, 'bin', cb, fb, true, null);
                    }
                    libCmms.toggleFieldUseBins(currentRecord, SUBLIST_RESULT, locationUserBins)
                } else {
                    libCmms.clearSelectBin(currentRecord, SUBLIST_RESULT, lineCountResult);
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
                initInventory(currentRecord, lineCountResult);
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
            let isValid = false;
            let currentRecord = scriptContext.currentRecord;
            
            let location = currentRecord.getValue('custpage_location');
            if (!location) {
                alert('Hãy nhập Kho!');
                return isValid;
            }
            let message = 'Hãy chọn ít nhất một line!';
            
            let fieldOfLocation = getLocationLookupFields(location, ['usesbins']);
            let lineCount = currentRecord.getLineCount(SUBLIST_RESULT);
            for (let i = 0; i < lineCount; i++) {
                let chon = currentRecord.getSublistValue({sublistId: SUBLIST_RESULT, fieldId: FIELDID_SELECT, line: i});
                let islotitem = currentRecord.getSublistValue({
                    sublistId: SUBLIST_RESULT,
                    fieldId: 'islotitem',
                    line: i
                });
                let receiptinventorynumber = currentRecord.getSublistValue({
                    sublistId: SUBLIST_RESULT,
                    fieldId: 'receiptinventorynumber',
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
                
                if (chon === true) {
                    isValid = true;
                    if (islotitem === 'true') {
                        if (!receiptinventorynumber) {
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
                    if ((fieldOfLocation.usesbins === true && usebins === 'true') && !binnumber) {
                        message = 'Hãy nhập BIN!';
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
                scriptId: 'customscript_scv_sl_cmms_nhapvt_thuhoi',
                deploymentId: 'customdeploy_scv_sl_cmms_nhapvt_thuhoi',
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
        
        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            saveRecord: saveRecord,
            searchReport: searchReport
        };
        
    });
