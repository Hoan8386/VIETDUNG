/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([],
    
    function () {
        const SUBLIST_ID = 'custpage_sublist';
        const CustomColId = {
            MARK: 'select',
            INV_NUMBER_ID: 'custpage_col_invnum_id',
            INV_NUMBER: 'custpage_col_invnum_display',
            BIN_NUMBER: 'custpage_col_binnumber_id',
            BIN_NUMBER_DISPLAY: 'custpage_col_binnumber_display',
            INVENTORY_STATUS: 'custpage_col_inventorystatus_id',
            INVENTORY_STATUS_DISPLAY: 'custpage_col_inventorystatus_display',
            AVAILABLE: 'custpage_col_available',
            COLOR_SERI: 'custpage_col_color_seri',
            MFG_DATE: 'custpage_col_mfg_date',
            IMPORT_DATE: 'custpage_col_import_date'
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
        const pageInit = (scriptContext) => {
            window.SCV = window.SCV || {};
            window.SCV.objDataLineSelect = {};
            removeAllBtnSublist();
            initializeDataPopup(scriptContext.currentRecord);
        };
        
        const initializeDataPopup = (curRec) => {
            window.parent.SCV = window.parent.SCV || {};
            let dataInventoryNumber = window.parent.SCV.dataInventoryNumber;
            if (!Array.isArray(dataInventoryNumber) || dataInventoryNumber.length === 0) return;
            const szData = dataInventoryNumber.length;
            window.SCV = window.SCV || {};
            window.SCV.lineIndexMax = szData;
            let invNumId = window.parent.nlapiGetCurrentLineItemValue('inventoryassignment', 'issueinventorynumber');
            let binnumberId = window.parent.nlapiGetCurrentLineItemValue('inventoryassignment', 'binnumber');
            let inventorystatusId = window.parent.nlapiGetCurrentLineItemValue('inventoryassignment', 'inventorystatus');
            for (let i = 0; i < szData; i++) {
                curRec.selectNewLine(SUBLIST_ID, i);
                if (String(dataInventoryNumber[i].inventorynumber) === invNumId && (!binnumberId || String(dataInventoryNumber[i].binnumber) === binnumberId) && (!inventorystatusId || String(dataInventoryNumber[i].inventorystatus) === inventorystatusId)) {
                    curRec.setCurrentSublistValue({
                        sublistId: SUBLIST_ID,
                        fieldId: CustomColId.MARK,
                        value: true,
                        ignoreFieldChange: true
                    });
                    addDataLineSelect(i, invNumId, dataInventoryNumber[i].binnumber, dataInventoryNumber[i].inventorystatus, dataInventoryNumber[i].inventorynumber_display);
                }
                curRec.setCurrentSublistValue({
                    sublistId: SUBLIST_ID,
                    fieldId: CustomColId.INV_NUMBER_ID,
                    value: dataInventoryNumber[i].inventorynumber || '',
                    ignoreFieldChange: true
                });
                curRec.setCurrentSublistValue({
                    sublistId: SUBLIST_ID,
                    fieldId: CustomColId.INV_NUMBER,
                    value: dataInventoryNumber[i].inventorynumber_display || '',
                    ignoreFieldChange: true
                });
                curRec.setCurrentSublistValue({
                    sublistId: SUBLIST_ID,
                    fieldId: CustomColId.BIN_NUMBER,
                    value: dataInventoryNumber[i].binnumber || '',
                    ignoreFieldChange: true
                });
                curRec.setCurrentSublistValue({
                    sublistId: SUBLIST_ID,
                    fieldId: CustomColId.BIN_NUMBER_DISPLAY,
                    value: dataInventoryNumber[i].binnumber_display || '',
                    ignoreFieldChange: true
                });
                curRec.setCurrentSublistValue({
                    sublistId: SUBLIST_ID,
                    fieldId: CustomColId.INVENTORY_STATUS,
                    value: dataInventoryNumber[i].inventorystatus || '',
                    ignoreFieldChange: true
                });
                curRec.setCurrentSublistValue({
                    sublistId: SUBLIST_ID,
                    fieldId: CustomColId.INVENTORY_STATUS_DISPLAY,
                    value: dataInventoryNumber[i].inventorystatus_display || '',
                    ignoreFieldChange: true
                });
                curRec.setCurrentSublistValue({
                    sublistId: SUBLIST_ID,
                    fieldId: CustomColId.AVAILABLE,
                    value: dataInventoryNumber[i].available || '',
                    ignoreFieldChange: true
                });
                curRec.setCurrentSublistValue({
                    sublistId: SUBLIST_ID,
                    fieldId: CustomColId.COLOR_SERI,
                    value: dataInventoryNumber[i].color_seri || '',
                    ignoreFieldChange: true
                });
                curRec.setCurrentSublistValue({
                    sublistId: SUBLIST_ID,
                    fieldId: CustomColId.MFG_DATE,
                    value: dataInventoryNumber[i].mfg_date || '',
                    ignoreFieldChange: true
                });
                curRec.setCurrentSublistValue({
                    sublistId: SUBLIST_ID,
                    fieldId: CustomColId.IMPORT_DATE,
                    value: dataInventoryNumber[i].import_date || '',
                    ignoreFieldChange: true
                });
                curRec.commitLine(SUBLIST_ID);
            }
        };
        
        const removeAllBtnSublist = () => {
            document.getElementById('custpage_sublist_buttons').innerHTML = ' ';
        };
        
        const updateLine = () => {
            const  dataLineSelect = getDataLineSelect();
            const {lineIndex, invNumberId} = dataLineSelect;
            if (typeof lineIndex !== 'number') {
                closePopup(true);
                return;
            }
            window.parent.ScvObjDataLineSelect = dataLineSelect;
            window.parent.nlapiSetCurrentLineItemValue('inventoryassignment', 'issueinventorynumber', invNumberId);
            closePopup(true);
        };
        
        const validateLine = (scriptContext) => {
            const {currentRecord} = scriptContext;
            return !!currentRecord.getCurrentSublistValue({sublistId: SUBLIST_ID, fieldId: CustomColId.INV_NUMBER_ID});
        };
        
        const fieldChanged = (scriptContext) => {
            let {fieldId, currentRecord, line} = scriptContext;
            if (fieldId !== CustomColId.MARK) return;
            if (line >= window.SCV.lineIndexMax) {
                currentRecord.setCurrentSublistValue({
                    sublistId: SUBLIST_ID,
                    fieldId: CustomColId.MARK,
                    value: false,
                    ignoreFieldChange: true
                });
                alert('Vui lọc chọn line trên danh sách! Bạn không thể thêm line mới!');
                return;
            }
            let select = currentRecord.getCurrentSublistValue({sublistId: SUBLIST_ID, fieldId: CustomColId.MARK});
            let isMark = (select === true || select === 'T');
            if (isMark) {
                let invNumberId = currentRecord.getCurrentSublistValue({
                    sublistId: SUBLIST_ID,
                    fieldId: CustomColId.INV_NUMBER_ID
                });
                let binNumberId = currentRecord.getCurrentSublistValue({
                    sublistId: SUBLIST_ID,
                    fieldId: CustomColId.BIN_NUMBER
                });
                let inventoryStatusId = currentRecord.getCurrentSublistValue({
                    sublistId: SUBLIST_ID,
                    fieldId: CustomColId.INVENTORY_STATUS
                });
                let inventoryStatusDisplay = currentRecord.getCurrentSublistValue({
                    sublistId: SUBLIST_ID,
                    fieldId: CustomColId.INVENTORY_STATUS_DISPLAY
                });
                const {lineIndex} = getDataLineSelect();
                if (typeof lineIndex === 'number') {
                    currentRecord.selectLine({sublistId: SUBLIST_ID, line: lineIndex});
                    currentRecord.setCurrentSublistValue({
                        sublistId: SUBLIST_ID,
                        fieldId: CustomColId.MARK,
                        value: false,
                        ignoreFieldChange: true
                    });
                    currentRecord.commitLine({sublistId: SUBLIST_ID, line: lineIndex});
                    currentRecord.selectLine({sublistId: SUBLIST_ID, line: line});
                    currentRecord.setCurrentSublistValue({
                        sublistId: SUBLIST_ID,
                        fieldId: CustomColId.MARK,
                        line: line,
                        value: true,
                        ignoreFieldChange: true
                    });
                }
                addDataLineSelect(line, invNumberId, binNumberId, inventoryStatusId, inventoryStatusDisplay);
            } else {
                removeLineSelect();
            }
        }
        
        const getDataLineSelect = () => window.SCV.objDataLineSelect;
        
        const addDataLineSelect = (lineIndex, invNumberId, binNumberId, inventoryStatusId, inventoryStatusDisplay) => {
            window.SCV.objDataLineSelect = {lineIndex, invNumberId, binNumberId, inventoryStatusId, inventoryStatusDisplay};
        };
        
        const removeLineSelect = () => {
            window.SCV.objDataLineSelect = {
                invNumberId: null,
                lineIndex: null
            };
        };
        
        
        return {
            pageInit: pageInit,
            updateLine: updateLine,
            fieldChanged: fieldChanged,
            validateLine: validateLine
        };
        
    });
