/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/runtime', '../cons/scv_cons_display_info.js', '../lib/scv_lib_cs.js'],
    
    function (runtime, ConsDisplayInfo, libCs) {
        
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
            initializeDataConfigDisplayField(scriptContext.mode);
            pageInitAssemblyBuild(scriptContext);
        };
        
        const initializeDataConfigDisplayField = (mode) => {
            window.SCV = window.SCV || {};
            window.SCV.isViewPlanCostByRole = checkPermissionViewPlanCost();
            window.SCV.modeRecord = mode;
        };
        
        const pageInitAssemblyBuild = ({currentRecord, mode}) => {
            if (currentRecord.type !== ConsDisplayInfo.RECORD_TYPE.ASSEMBLY_BUILD) return;
            if (mode !== 'copy') return;
            const slComponent = 'component';
            const lc = currentRecord.getLineCount(slComponent);
            for (let i = 0; i < lc; i++) {
                let qty = currentRecord.getSublistValue(slComponent, ConsDisplayInfo.FIELD_LINE_QUANTITY_ASSEMBLY_BUILD, i);
                nlapiSetLineItemValue(slComponent, ConsDisplayInfo.COLUMN_ID_QUANTITY, i + 1, qty);
            }
        };
        
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
        const fieldChanged = (scriptContext) => {
            fieldChangedCustomQuantity(scriptContext);
            fieldChangedWorkOrder(scriptContext);
            fieldChangedOfAssemblyBuild(scriptContext);
        };
        
        const fieldChangedWorkOrder = ({fieldId, sublistId, currentRecord}) => {
            if (window.SCV.isViewPlanCostByRole) return;
            if (!!sublistId) return;
            if (currentRecord.type !== ConsDisplayInfo.RECORD_TYPE.WORK_ORDER) return;
            if (![ConsDisplayInfo.FIELD_BODY_ASSEMBLY_ITEM, ConsDisplayInfo.FIELD_BODY_LOCATION, ConsDisplayInfo.FIELD_BODY_QUANTITY_WORK_ORDER].includes(fieldId)) return;
            window.SCV.countFieldChangedAssemblyItem = 0;
            libCs.showLoadingDialog(true);
            let timeId = setInterval(function () {
                window.SCV.countFieldChangedAssemblyItem++;
                if (typeof machines?.item?.currentRowNum === 'number' && machines.item.currentRowNum > 1) {
                    NS.jQuery('.scvMainLoader').remove();
                    const lc = window.nlapiGetLineItemCount('item');
                    for (let i = 0; i < lc; i++) {
                        let itemId = nlapiGetLineItemValue('item', 'item', i + 1);
                        let quantity = nlapiGetLineItemValue('item', 'quantity', i + 1);
                        if (checkItemOtherCharge(itemId)) quantity = '';
                        nlapiSetLineItemValue('item', ConsDisplayInfo.COLUMN_ID_QUANTITY, i + 1, quantity);
                    }
                    machines?.item?.clearline();
                    clearInterval(timeId);
                }
                if (window.SCV.countFieldChangedAssemblyItem > 3) {
                    NS.jQuery('.scvMainLoader').remove();
                    clearInterval(timeId);
                }
            }, 500);
        };
        
        const fieldChangedOfAssemblyBuild = ({fieldId, sublistId, currentRecord, line}) => {
            if (window.SCV.isViewPlanCostByRole) return;
            if (currentRecord.type !== ConsDisplayInfo.RECORD_TYPE.ASSEMBLY_BUILD) return;
            if ([ConsDisplayInfo.FIELD_LINE_QUANTITY_ASSEMBLY_BUILD].includes(fieldId) && (!!sublistId)) {
                const qty = currentRecord.getCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: ConsDisplayInfo.FIELD_LINE_QUANTITY_ASSEMBLY_BUILD
                });
                currentRecord.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: ConsDisplayInfo.COLUMN_ID_QUANTITY,
                    value: qty,
                    ignoreFieldChange: true
                });
                window.SCV.countFieldChangedAssemblyItem = 0;
                const itemId = currentRecord.getSublistValue({sublistId: sublistId, fieldId: 'item', line: line});
                if (!checkItemOtherCharge(itemId)) return;
                libCs.showLoadingDialog(true);
                let eleTagQty = NS.jQuery('#'.concat(ConsDisplayInfo.PREFIX_ELEMENT_ID).concat((line + 1).toString()).concat(ConsDisplayInfo.SUFFIX_ELEMENT_ID).concat('>input'))
                NS.jQuery([...eleTagQty][0]).attr('type', 'hidden');
                NS.jQuery('.scvMainLoader').remove();
            } else if ([ConsDisplayInfo.FIELD_BODY_QUANTITY_ASSEMBLY_BUILD].includes(fieldId)) {
                window.SCV.countFieldChangedAssemblyItem = 0;
                libCs.showLoadingDialog(true);
                let timeId = setInterval(function () {
                    window.SCV.countFieldChangedAssemblyItem++;
                    const lc = window.nlapiGetLineItemCount('component');
                    if (lc) {
                        NS.jQuery('.scvMainLoader').remove();
                        const lc = window.nlapiGetLineItemCount('component');
                        for (let i = 0; i < lc; i++) {
                            let itemId = nlapiGetLineItemValue('component', 'item', i + 1);
                            let quantity = nlapiGetLineItemValue('component', 'quantity', i + 1);
                            
                            if (checkItemOtherCharge(itemId)) quantity = '';
                            nlapiSetLineItemValue('component', ConsDisplayInfo.COLUMN_ID_QUANTITY, i + 1, quantity);
                        }
                        clearInterval(timeId);
                    }
                    if (window.SCV.countFieldChangedAssemblyItem > 3) {
                        NS.jQuery('.scvMainLoader').remove();
                        clearInterval(timeId);
                    }
                }, 500);
            }
            
        }
        
        
        const checkPermissionViewPlanCost = () => {
            let roleInternalId = runtime.getCurrentUser().role;
            if (roleInternalId === ConsDisplayInfo.ROLE_ADMIN_ID) return true;
            let objRes = callDataSuitelet({action: ConsDisplayInfo.CUSTOM_ACTION.CHECK_PERMISSION_VIEW_COST_OF_ROLE});
            if (objRes === null) return;
            return objRes.response;
        };
        
        const fieldChangedCustomQuantity = ({fieldId, currentRecord, sublistId}) => {
            if (window.SCV.isViewPlanCostByRole) return;
            if (!sublistId) return;
            const objDataConfig = getDataConfig(currentRecord.type);
            if (objDataConfig.sublistId !== sublistId) return;
            if (fieldId !== ConsDisplayInfo.COLUMN_ID_QUANTITY) return;
            let itemId = currentRecord.getCurrentSublistValue({sublistId: sublistId, fieldId: 'item'});
            let quantity = currentRecord.getCurrentSublistValue({
                sublistId: sublistId,
                fieldId: ConsDisplayInfo.COLUMN_ID_QUANTITY
            });
            if (checkItemOtherCharge(itemId)) {
                currentRecord.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: ConsDisplayInfo.COLUMN_ID_QUANTITY,
                    value: null,
                    ignoreFieldChange: true
                });
                alert(ConsDisplayInfo.MESSAGE.ALERT_NOT_EDIT_QUANTITY_LINE_ITEM_OTHER_CHARGE);
                return;
            }
            currentRecord.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: objDataConfig.fieldIdDisplay,
                value: quantity
            });
        };
        
        const updateValueQuantityCustom = ({fieldId, currentRecord, sublistId}) => {
            if (window.SCV.isViewPlanCostByRole) return;
            if (!sublistId) return;
            const objDataConfig = getDataConfig(currentRecord.type);
            if (objDataConfig.sublistId !== sublistId) return;
            let itemId = currentRecord.getCurrentSublistValue({sublistId: sublistId, fieldId: 'item'});
            if (!itemId) return;
            if (checkItemOtherCharge(itemId)) return;
            if (fieldId !== objDataConfig.fieldIdDisplay) return;
            let quantity = currentRecord.getCurrentSublistValue({
                sublistId: sublistId,
                fieldId: objDataConfig.fieldIdDisplay
            });
            currentRecord.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: ConsDisplayInfo.COLUMN_ID_QUANTITY,
                value: quantity,
                ignoreFieldChange: true
            });
        };
        
        const updateValueQuantityUsedCustom = ({fieldId, currentRecord, sublistId}) => {
            if (window.SCV.isViewPlanCostByRole) return;
            if (!sublistId) return;
            const objDataConfig = getDataConfig(currentRecord.type);
            if (objDataConfig.sublistId !== sublistId) return;
            let itemId = currentRecord.getCurrentSublistValue({sublistId: sublistId, fieldId: 'item'});
            if (!itemId) return;
            if (checkItemOtherCharge(itemId)) return;
            if (fieldId !== ConsDisplayInfo.COLUMN_ID_STD_QUANTITY_USED) return;
            let qtyUsed = currentRecord.getCurrentSublistValue({
                sublistId: sublistId,
                fieldId: ConsDisplayInfo.COLUMN_ID_STD_QUANTITY_USED
            });
            currentRecord.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: ConsDisplayInfo.COLUMN_ID_STD_QUANTITY_USED_CUSTOM,
                value: qtyUsed,
                ignoreFieldChange: true
            });
        };
        
        const getDataConfig = (recordType) => {
            let [sublistId, fieldIdDisplay, nexFieldId] = ['component', 'quantity', 'quantity'];
            if (recordType === ConsDisplayInfo.RECORD_TYPE.WORK_ORDER) {
                sublistId = 'item';
                fieldIdDisplay = 'quantity';
            } else if (recordType === ConsDisplayInfo.RECORD_TYPE.BOM_REVISION) {
                sublistId = 'component';
                fieldIdDisplay = 'bomquantity';
            }
            return {
                sublistId,
                fieldIdDisplay,
                nexFieldId
            };
        };
        
        /**
         * Function to be executed when field is slaved.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         *
         * @since 2015.2
         */
        const postSourcing = (scriptContext) => {
            updateValueQuantityCustom(scriptContext);
            updateValueQuantityUsedCustom(scriptContext);
        };
        
        const checkItemOtherCharge = (id) => {
            if (!id) return;
            let objResCheckTypeItem = callDataSuitelet({
                itemid: id,
                action: ConsDisplayInfo.CUSTOM_ACTION.CHECK_ITEM_TYPE_OTHER_CHARGE
            });
            if (objResCheckTypeItem === null) return;
            return objResCheckTypeItem.response;
        };
        
        const callDataSuitelet = (objParams) => {
            let resCall = window.nlapiRequestURL('/app/site/hosting/scriptlet.nl?script=customscript_scv_sl_display_info&deploy=customdeploy_scv_sl_display_info', {...objParams});
            if (resCall.code === 200) return JSON.parse(resCall.getBody());
            else {
                alert(resCall.error.toString())
            }
            return null;
        };
        
        
        
        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            postSourcing: postSourcing
        };
        
    });
