/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/search', '../lib/scv_lib_cs.js'],
    function (search, libCs) {

        const TYPE_YCNX_NHAP_ID = '2';
        const TYPE_YCNX_XUAT_ID = '1';

        const setDefEntity = (scriptContext) => {
            if (scriptContext.mode === 'create') {
                let newRecord = scriptContext.currentRecord;
                const entityDefaultId = 146;
                if (newRecord.getValue('entity')) return;
                newRecord.setValue('entity', entityDefaultId);
            }
        };

        const pageInit = (scriptContext) => {
            setDefEntity(scriptContext);
            const isUpd = scriptContext.mode === 'create' || scriptContext.mode === 'copy';
            disabledColumnByTypeYCNX(scriptContext.currentRecord, isUpd);
            machines?.item?.clearline();
        };

        const lineInit = (scriptContext) => {
            disabledColumnByTypeYCNX(scriptContext.currentRecord, false);
        };

        const setDefaultAmountOnLine = (curRec, sublistId) => {
            curRec.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'amount',
                value: 1,
                ignoreFieldChange: true,
                forceSyncSourcing: false
            });
        };

        const fieldChanged = (scriptContext) => {
            let currentRecord = scriptContext.currentRecord;
            let fieldId = scriptContext.fieldId;
            let sublistId = scriptContext.sublistId;
            if (sublistId === 'item') {
                fieldChangedLineCols(currentRecord, sublistId, fieldId);
            } else if (fieldId === 'custbody_scv_order_type') {
                disabledColumnByTypeYCNX(currentRecord);
                machines?.item?.clearline();
            }
        };

        const fieldChangedLineCols = (currentRecord, sublistId, fieldId) => {
            if (fieldId === 'description') {
                setDefaultAmountOnLine(currentRecord, sublistId);
                defaultValueLine(currentRecord, fieldId);
                disabledColumnByTypeYCNX(currentRecord, false);
            } else if (fieldId === 'custcol_scv_plan_qty') {
                const qtyPlan = currentRecord.getCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custcol_scv_plan_qty'
                }) * 1;
                if (qtyPlan !== 0) {
                    currentRecord.setCurrentSublistValue({
                        sublistId: sublistId,
                        fieldId: 'amount',
                        value: 0,
                        ignoreFieldChange: true,
                        forceSyncSourcing: false
                    });
                    currentRecord.setCurrentSublistValue({sublistId: sublistId, fieldId: 'quantity', value: 0});
                }
            } else if (fieldId === 'quantity') {
                const quantity = currentRecord.getCurrentSublistValue({sublistId: sublistId, fieldId: 'quantity'}) * 1;
                if (quantity !== 0) {
                    currentRecord.setCurrentSublistValue({
                        sublistId: sublistId,
                        fieldId: 'custcol_scv_plan_qty',
                        value: 0,
                        ignoreFieldChange: true,
                        forceSyncSourcing: false
                    });
                }
                currentRecord.setCurrentSublistValue({sublistId: sublistId, fieldId: 'amount', value: 0});
            }
        }

        const postSourcing = (scriptContext) => {
            const fieldId = scriptContext.fieldId;
            const currentRecord = scriptContext.currentRecord;
            const sublistId = scriptContext.sublistId;
            if (fieldId === 'item' && sublistId === 'item') {
                disabledColumnByTypeYCNX(currentRecord, true, false);
            }
        };

        const validateLine = (scriptContext) => {
            let fieldId = scriptContext.fieldId;
            let currentRecord = scriptContext.currentRecord;
            let sublistId = scriptContext.sublistId;
            if (!!sublistId && sublistId === 'item' && fieldId === 'quantity') {
                let orderTypeId = currentRecord.getValue('custbody_scv_order_type');
                if (!orderTypeId) return true;
                const quantity = currentRecord.getCurrentSublistValue({sublistId: sublistId, fieldId: fieldId}) * 1;
                let typeYCNX = getTypeYCNX(orderTypeId);
                if (typeYCNX === TYPE_YCNX_NHAP_ID && quantity !== 0) {
                    alert('Loại điều chỉnh là nhập! Giá trị lượng xuất phải bằng 0!')
                    return false;
                }
            }
            return true;
        };

        const saveRecord = (scriptContext) => {
            if (!validItemStatus(scriptContext.currentRecord)) {
                alert('Please input value for Trạng thái Item!');
                return false;
            }
            let currentRecord = scriptContext.currentRecord;
            let sublistId = 'item';
            let sublistIdIass = 'inventoryassignment';
            let lineCountItem = currentRecord.getLineCount({sublistId: sublistId});
            for( let i = 0; i < lineCountItem; i++) {
                currentRecord.selectLine({sublistId: sublistId, line: i});
                if(currentRecord.getCurrentSublistValue({sublistId: sublistId, fieldId: 'inventorydetailavail'}) === 'T' && currentRecord.getCurrentSublistValue({sublistId: sublistId, fieldId: 'quantity'}) > 0) {
                    let subRecIvd = currentRecord.getCurrentSublistSubrecord({sublistId: sublistId, fieldId: 'inventorydetail'});
                    let lineCountIass = subRecIvd.getLineCount({sublistId: sublistIdIass});
                    if(lineCountIass <= 0) {
                        alert(`Vui lòng nhập thông tin chi tiết kho cho item: ${currentRecord.getCurrentSublistText({sublistId: sublistId, fieldId: 'item'})} dòng ${i + 1}` );
                        return false;
                    }
                }
            }
            
            return true;
        };

        const validItemStatus = (curRec) => {
            let orderTypeId = curRec.getValue('custbody_scv_order_type');
            if (!orderTypeId) return true;
            let typeYCNX = getTypeYCNX(orderTypeId);
            if (typeYCNX !== TYPE_YCNX_NHAP_ID && !!typeYCNX) return true;
            const lc = curRec.getLineCount('item');
            for (let i = 0; i < lc; i++) {
                if (!curRec.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_scv_item_status',
                    line: i
                })) return false;
            }
            return true;

        };

        const defaultValueLine = (currentRecord, fieldId) => {
            let orderTypeId = currentRecord.getValue('custbody_scv_order_type');
            if (!orderTypeId) return;
            let typeYCNX = getTypeYCNX(orderTypeId);
            if (typeYCNX === TYPE_YCNX_NHAP_ID) {
                currentRecord.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'quantity',
                    value: 0,
                    ignoreFieldChange: true,
                    forceSyncSourcing: false
                });
            }
            currentRecord.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'amount',
                value: 0,
                ignoreFieldChange: true,
                forceSyncSourcing: false
            });
        }

        const disabledColumnByTypeYCNX = (curRec, isUpdate = true, isCommitAll = true) => {
            try {
                let orderTypeId = curRec.getValue('custbody_scv_order_type');
                if (!orderTypeId) return;
                let typeYCNX = getTypeYCNX(orderTypeId);
                let arrFieldsNhap = ['quantity', 'amount'];
                let arrFieldsXuat = ['custcol_scv_plan_qty', 'custcol_scv_item_status', 'custcol_supplier_lot', 'amount'];
                if (!typeYCNX) {
                    disableFieldsSublist(curRec, arrFieldsNhap, false);
                    disableFieldsSublist(curRec, arrFieldsXuat, false);
                    return;
                }
                libCs.showLoadingDialog(true);
                if (typeYCNX === TYPE_YCNX_NHAP_ID) {
                    disableFieldsSublist(curRec, arrFieldsNhap, true);
                    disableFieldsSublist(curRec, arrFieldsXuat, false);
                } else if (typeYCNX === TYPE_YCNX_XUAT_ID) {
                    disableFieldsSublist(curRec, arrFieldsXuat, true);
                    disableFieldsSublist(curRec, arrFieldsNhap, false);
                }
                if (!isUpdate) {
                    libCs.showLoadingDialog(false);
                    return;
                }
                if (typeYCNX === TYPE_YCNX_NHAP_ID) {
                    isCommitAll ? setDataLineItem(curRec, arrFieldsNhap, [0, 0], true) : setCurrentLineItem(curRec, arrFieldsNhap, [0, 0]);
                } else if (typeYCNX === TYPE_YCNX_XUAT_ID) {
                    isCommitAll ? setDataLineItem(curRec, arrFieldsXuat, [0, '', '', 0]) : setCurrentLineItem(curRec, arrFieldsXuat, [0, '', '', 0]);
                }
                libCs.showLoadingDialog(false);
            } catch (e) {
                console.log({error: e});
                libCs.showLoadingDialog(false);

            }
        }

        const disableFieldsSublist = (curRec, arrFields, isDisabled) => {
            const slId = 'item';
            arrFields.forEach(field => {
                window.nlapiSetLineItemDisabled(slId, field, isDisabled);
            });
        }

        const setDataLineItem = (curRec, arrFields, arrValues, removeLot = false) => {
            let slId = 'item';
            let lc = curRec.getLineCount(slId);
            for (let i = 0; i < lc; i++) {
                curRec.selectLine(slId, i);
                if (removeLot) {
                    const hasInvDet = curRec.getCurrentSublistValue({sublistId: slId, fieldId: 'inventorydetailavail'});
                    if ((hasInvDet === 'T' || hasInvDet === true))
                        window.nlapiRemoveCurrentLineItemSubrecord('item', 'inventorydetail')
                }
                for (let j = 0; j < arrFields.length; j++) {
                    curRec.setCurrentSublistValue({sublistId: slId, fieldId: arrFields[j], value: arrValues[j]});
                }
                curRec.commitLine(slId);
            }
        };

        const setCurrentLineItem = (curRec, arrFields, arrValues) => {
            let slId = 'item';
            arrFields.forEach((fldId, index) => {
                curRec.setCurrentSublistValue({
                    sublistId: slId,
                    fieldId: fldId,
                    value: arrValues[index],
                    ignoreFieldChange: true,
                    forceSyncSourcing: false
                });
            });
        };
        
        const listOrderType = [];
        const getTypeYCNX = (orderId) => {
            if (!orderId) return null;
            let objOrderType = listOrderType.find(o => o.orderId === orderId);
            if (!objOrderType) {
                let custrecord_scv_receipt_or_fulfill = search.lookupFields({
                    type: 'customrecord_scv_order_type',
                    id: orderId,
                    columns: ['custrecord_scv_receipt_or_fulfill']
                }).custrecord_scv_receipt_or_fulfill?.[0]?.value || '';
                objOrderType = {orderId, custrecord_scv_receipt_or_fulfill};
                listOrderType.push(objOrderType);
            }
            return objOrderType.custrecord_scv_receipt_or_fulfill;
        };

        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            lineInit: lineInit,
            validateLine: validateLine,
            postSourcing: postSourcing,
            saveRecord: saveRecord
        };

    });
