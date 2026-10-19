/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record', 'N/redirect', '../lib/scv_lib_function'],

    (record, redirect, libFn) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            let params = scriptContext.request.parameters;
            let rectype = params.rectype || record.Type.ITEM_RECEIPT;
            let recid = params.recid || '6285';
            if (!rectype || !recid) throw "Error not found";
            let curRecord = record.load({type: rectype, id: recid});
            let objData = getDataItemReceipt(curRecord);
            if (!objData.body.acceptDept) throw "Chưa có bộ phận nghiệm thu";
            if (objData.line.length === 0) throw "Đã tạo đủ phiếu nghiệm thu cho các line item!";
            let objArrPhieuNghiemThu = createMultiPhieuNghiemThu(objData);
            if (Object.keys(objArrPhieuNghiemThu).length > 0) {
                let arrLineIRR = Object.keys(objArrPhieuNghiemThu);
                const numberLine = arrLineIRR.length;
                for (let i = 0; i < numberLine; i++) {
                    const lineIndex = arrLineIRR[i];
                    const idPhieuNghiemThu = objArrPhieuNghiemThu[lineIndex];
                    if (idPhieuNghiemThu) curRecord.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_scv_accept_number',
                        line: lineIndex,
                        value: objArrPhieuNghiemThu[lineIndex]
                    });
                }
                curRecord.save({enableSourcing: false, ignoreMandatoryFields: true});
            }
            redirect.toRecord({type: rectype, id: recid});
        }

        const createMultiPhieuNghiemThu = (objData) => {
            let {
                body,
                line,
                id
            } = objData;
            const sublistId = 'recmachcustrecord_scv_accept_detail_no';
            const sizeLine = line.length;
            let objDataPhieuNghiemThu = [];
            for (let i = 0; i < sizeLine; i++) {
                const objLine = line[i];
                let curRec = record.create({type: 'customrecord_scv_nghiem_thu', isDynamic: true});
                libFn.setValueData(curRec, [
                    'custrecord_scv_accept_type',
                    'custrecord_scv_accept_sub',
                    'custrecord_scv_accept_todo_dept',
                    'custrecord_scv_accept_ma_tbi',
                    'custrecord_scv_accept_ten_tbi',
                    'custrecord_scv_accept_unit',
                    'custrecord_scv_accept_qty',
                    'custrecord_scv_accept_created_from',
                    'custrecord_scv_accept_original_trans'
                ], [
                    objLine.acceptanceClassification,
                    body.subsidiary,
                    body.acceptDept,
                    objLine.item,
                    objLine.description,
                    objLine.units,
                    objLine.quantity,
                    id,
                    body.createdFrom
                ]);
                curRec.selectNewLine({sublistId: sublistId});
                curRec.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord_scv_accept_detail',
                    value: objLine.item
                });
                curRec.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord_scv_accept_detail_item',
                    value: objLine.description
                });
                curRec.commitLine({sublistId: sublistId});
                objDataPhieuNghiemThu[objLine.lineIndex] = curRec.save({ignoreMandatoryFields: true});
            }
            return objDataPhieuNghiemThu;
        }

        const getDataItemReceipt = (newRecord) => {
            const lc = newRecord.getLineCount('item');
            let arrDataItem = [];
            for (let i = 0; i < lc; i++) {
                const itemreceipt = newRecord.getSublistValue({sublistId: 'item', fieldId: 'itemreceipt', line: i});
                if (itemreceipt === 'F' || itemreceipt == false) continue;
                const acceptNumberId = newRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_scv_accept_number',
                    line: i
                });
                if (!!acceptNumberId) continue;
                const item = newRecord.getSublistValue({sublistId: 'item', fieldId: 'item', line: i});
                const quantity = newRecord.getSublistValue({sublistId: 'item', fieldId: 'quantity', line: i}) * 1;
                const description = newRecord.getSublistValue({sublistId: 'item', fieldId: 'description', line: i});
                const units = newRecord.getSublistValue({sublistId: 'item', fieldId: 'units', line: i});
                const acceptanceClassification = newRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_scv_acceptance_classification',
                    line: i
                });
                arrDataItem.push({item, quantity, description, units, lineIndex: i, acceptanceClassification});
            }
            const createdFromId = newRecord.getValue({fieldId: 'createdfrom'});
            const subsidiaryId = newRecord.getValue({fieldId: 'subsidiary'});
            const acceptDeptId = newRecord.getValue({fieldId: 'custbody_scv_accept_dept'});
            return {
                id: newRecord.id,
                body: {
                    createdFrom: createdFromId,
                    subsidiary: subsidiaryId,
                    acceptDept: acceptDeptId,
                },
                line: arrDataItem
            }
        }

        return {onRequest}

    });