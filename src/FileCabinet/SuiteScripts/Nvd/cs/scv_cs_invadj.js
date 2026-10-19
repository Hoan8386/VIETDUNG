/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/runtime', 'N/search', '../lib/scv_lib_cs'],

    function (currentRecord, runtime, search, lcs) {
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
            commitDataLineMakeCopyIA(scriptContext);
            if (scriptContext.mode === 'create' || scriptContext.mode === 'copy') {
                disabledColumnByTypeYCNX(scriptContext.currentRecord, true);
            } else {
                disabledColumnByTypeYCNX(scriptContext.currentRecord, false);
            }
        }

        const getObjParams = (curRec) => {
            let strParams = curRec.getValue('entryformquerystring').split('&');
            let objParams = {};
            for (let i = 0; i < strParams.length; i++) {
                let arr = strParams[i].split('=');
                objParams[arr[0]] = arr[1];
            }
            return objParams;
        };

        const commitDataLineMakeCopyIA = (scriptContext) => {
            let mode = scriptContext.mode;
            if (['create', 'copy'].indexOf(mode) === -1) return;
            let curRec = currentRecord.get();
            let objParams = getObjParams(curRec);
            if (objParams.makecopy !== 'T') return;
            let slId = 'inventory';
            let lc = curRec.getLineCount(slId);
            for (let i = 0; i < lc; i++) {
                curRec.selectLine(slId, i);
                let avail = curRec.getCurrentSublistValue({sublistId: slId, fieldId: 'inventorydetailavail'});
                if (avail != 'T') {
                    curRec.commitLine(slId);
                    continue;
                }
                let invDetRec = curRec.getCurrentSublistSubrecord({sublistId: slId, fieldId: 'inventorydetail'});
                if (!invDetRec) {
                    curRec.commitLine(slId);
                    continue;
                }
                curRec.commitLine(slId);
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
        const fieldChanged = (scriptContext) => {
            if (scriptContext.fieldId === 'custbody_scv_order_type') {
                disabledColumnByTypeYCNX(scriptContext.currentRecord)
            }
        }

        const disabledColumnByTypeYCNX = (curRec, isUpdate = true) => {
            let orderTypeId = curRec.getValue('custbody_scv_order_type');
            if (!orderTypeId) return;
            const TYPE_YCNX_NHAP_ID = '2';
            let typeYCNX = getTypeYCNX(orderTypeId);
            if (!typeYCNX) return;
            lcs.showLoadingDialog(true);
            let arrFieldsXuat = ['quantity', 'amount'];
            let arrFieldsNhap = ['custcol_scv_plan_qty', 'custcol_scv_item_status', 'custcol_supplier_lot', 'amount'];
            if (typeYCNX === TYPE_YCNX_NHAP_ID) {
                disableFieldsSublist(curRec, arrFieldsNhap, true);
                disableFieldsSublist(curRec, arrFieldsXuat, false);
                isUpdate ? setDataLineInventory(curRec, arrFieldsNhap, ['', '', '', 0]) : '';
            } else {
                disableFieldsSublist(curRec, arrFieldsXuat, true);
                disableFieldsSublist(curRec, arrFieldsNhap, false);
                isUpdate ? setDataLineInventory(curRec, arrFieldsXuat, [0, 0]) : '';
            }
            lcs.showLoadingDialog(false);
        }

        const disableFieldsSublist = (curRec, arrFields, isDisabled) => {
            const slId = 'inventory';
            arrFields.forEach(field => {
                window.nlapiSetLineItemDisabled(slId, field, isDisabled)
            });
        }

        const setDataLineInventory = (curRec, arrFields, arrValues) => {
            let slId = 'inventory';
            let lc = curRec.getLineCount(slId);
            for (let i = 0; i < lc; i++) {
                curRec.selectLine(slId, i);
                for (let j = 0; j < arrFields.length; j++) {
                    curRec.setCurrentSublistValue({sublistId: slId, fieldId: arrFields[j], value: arrValues[j]});
                }
                curRec.commitLine(slId);
            }
        }

        const getTypeYCNX = (orderId) => {
            if (!orderId) return null;
            return search.lookupFields({
                type: 'customrecord_scv_order_type',
                id: orderId,
                columns: ['custrecord_scv_receipt_or_fulfill']
            }).custrecord_scv_receipt_or_fulfill?.[0]?.value || '';
        };

        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged
        };

    });
