define([
        'N/record', 'N/search', '../lib/scv_lib_function',
        'N/task'
    ],
    function (record, search, lfn,
              task
    ) {
        'use strict';

        const CustomRecordStatus = {
            APPROVED: '5',
        };
        const CustomRecordType = {
            INBOUND_INSPECTION_RESULT: 'customrecord_scv_inspection_result_tb',
            MFG_INSPECTION_RESULTS: 'customrecord_scv_inspection_reswo_tb',
            INSPECTION_LOT: 'customrecord_scv_insp_lot',
            INSPECTION_SHEET: 'customrecord_scv_inspection_sheet'
        };

        const setDataLotNumberRecordFromOriginRecord = (recordType, id) => {
            let curRec = record.load({type: recordType, id: id});
            if (!validateRunProcessUpdateLotNumber(curRec)) return;
            const objFieldsConfig = getObjFields(recordType);
            if (objFieldsConfig === undefined) return;
            const objDataRecord = getDataConfigRecord(curRec, objFieldsConfig);
            if (!lfn.isContainValue(objDataRecord.body?.[objFieldsConfig.fieldIdLotNum])) return;
            const objDataUpd = getDataLotNumberRecord(objDataRecord);
            record.submitFields({
                type: record.Type.INVENTORY_NUMBER,
                id: objDataRecord.body[objFieldsConfig.fieldIdLotNum],
                values: objDataUpd,
                options: {
                    ignoreMandatoryFields: true
                }
            });
        };

        const validateRunProcessUpdateLotNumber = (curRec) => {
            const recordType = curRec.type;
            if (recordType !== CustomRecordType.INSPECTION_LOT) return;
            const inspSheetId = curRec.getValue('custrecord_scv_inspl_insp_sheet');
            if (!inspSheetId) return null;
            const statusId = curRec.getValue('custrecord_scv_inspl_qa_approve_status');
            let lkInsSheet = search.lookupFields({
                type: CustomRecordType.INSPECTION_SHEET,
                id: inspSheetId,
                columns: ['isinactive']
            });
            const lotNumId = curRec.getValue('custrecord_scv_inspl_invno');
            if (!lotNumId) return null;
            const isInactiveInspectionSheet = lkInsSheet.isinactive;
            return statusId === CustomRecordStatus.APPROVED &&
                !isInactiveInspectionSheet
        };

        const getObjDataLotNum = (id) => {
            if (!id) return;
            let lkLotNum = search.lookupFields({
                type: search.Type.INVENTORY_NUMBER,
                id: id,
                columns: [
                    'custitemnumber_scv_inspection_number',
                    'custitemnumber_scv_qc_manual_number',
                    'custitemnumber_scv_item_num_color_seri'
                ]
            });
            return {
                custitemnumber_scv_inspection_number: lkLotNum?.custitemnumber_scv_inspection_number || '',
                custitemnumber_scv_qc_manual_number: lkLotNum?.custitemnumber_scv_qc_manual_number || '',
                custitemnumber_scv_item_num_color_seri: lkLotNum?.custitemnumber_scv_item_num_color_seri || ''
            };
        };

        const getObjFields = (recType) => {
            const objFields = {
                [CustomRecordType.INSPECTION_LOT]: {
                    fieldIdLotNum: 'custrecord_scv_inspl_invno',
                    body: [
                        'custrecord_scv_inspl_invno',
                        'custrecord_scv_inspl_seri_color',
                        'custrecord_scv_inspl_qc_no',
                        'name'
                    ]
                }
            }
            return objFields[recType];
        };

        const getDataLotNumberRecord = (objData) => {
            const {
                body,
                recordType
            } = objData;
            let objDataUpd = {};
            switch (recordType) {
                case CustomRecordType.INSPECTION_LOT:
                    Object.assign(objDataUpd, {
                        custitemnumber_scv_item_num_color_seri: body.custrecord_scv_inspl_seri_color,
                        custitemnumber_scv_qc_manual_number: body.custrecord_scv_inspl_qc_no,
                        custitemnumber_scv_inspection_number: body.name,
                    });
                    break;
            }
            return objDataUpd;
        };

        const getDataConfigRecord = (curRec, objFieldsConfig) => {
            const {body} = objFieldsConfig;
            const objDataBody = getDataFieldsHeaderRecord(curRec, body);
            return {
                recordType: curRec.type,
                body: objDataBody
            };
        };

        const getDataFieldsHeaderRecord = (curRec, arrFields) => {
            const sizeFields = arrFields.length;
            let objData = {};
            for (let i = 0; i < sizeFields; i++) {
                objData[arrFields[i]] = curRec.getValue(arrFields[i]) || '';
            }
            return objData;
        };

        /**
         * Des: Post from Transaction
         * @param options
         * @returns {{msg: string, response: null, error: null, isSuccess: boolean}}
         */
        const setDataMultiLotNumber = (options) => {
            let results = {isSuccess: true, response: null, error: null, msg: ''};
            try {
                const recordid = options.recordid;
                const dataInvNumUpd = getDataInventoryNumberFromTrans(recordid);
                updateDataInventoryNumber(dataInvNumUpd);
            } catch (e) {
                results.error = e.name + ' : ' + e.message;
                results.isSuccess = false;
                log.error('Error setDataMultiLotNumber: ', e);
            }
            return results;
        };

        const getDataInventoryNumberFromTrans = (transId) => {
            const transType = lfn.getTranRecordType(transId);
            if (!validRecordUpdateInventoryNumber(transType)) return;
            let curRec = record.load({type: transType, id: transId});
            const objConfigFields = getFieldsConfig(transType);
            return getDataInvNumsUpd({curRec: curRec, objConfigFields: objConfigFields,});
        };

        const validRecordUpdateInventoryNumber = (recordType) => {
            return [
                record.Type.ITEM_RECEIPT,
                record.Type.INVENTORY_ADJUSTMENT
            ].includes(recordType);
        }

        /**
         * Des : Get fields config
         * @param recType
         * @returns {{FIELD_LINE: *[], FIELD_HEADER_CHANGE: *[], FIELD_HEADER: *[], FIELD_LINE_CHANGE: *[], isrun: string}}
         */
        const getFieldsConfig = (recType) => {
            let result = {
                FIELD_HEADER: [],
                FIELD_HEADER_CHANGE: [],
                FIELD_LINE: [],
                FIELD_LINE_CHANGE: [],
            };
            switch (recType) {
                case record.Type.ITEM_RECEIPT:
                    result.FIELD_HEADER = ['trandate'];
                    result.FIELD_HEADER_CHANGE = ['trandate'];
                    result.FIELD_LINE = ['item'];
                    result.FIELD_LINE_CHANGE = [];
                    break;
                case record.Type.INVENTORY_ADJUSTMENT:
                    result.FIELD_HEADER = [];
                    result.FIELD_HEADER_CHANGE = [];
                    result.FIELD_LINE = ['item', 'custcol_scv_required_date', 'custcol_scv_color_seri', 'memo','custcol_scv_core_weight'];
                    result.FIELD_LINE_CHANGE = ['item', 'custcol_scv_required_date', 'custcol_scv_color_seri', 'memo','custcol_scv_core_weight'];
                    break;
                default:
                    break;
            }
            return result;
        };

        const setDataTransactionToInventoryNumber = (scriptContext) => {
            const triggerType = scriptContext.type;
            if (triggerType !== 'create' && triggerType !== 'edit') return;
            let curRec = scriptContext.newRecord;
            const recType = curRec.type;
            if (!validRecordUpdateInventoryNumber(recType)) return;
            let newRecord = record.load({type: recType, id: curRec.id});
            if (recType === record.Type.ITEM_RECEIPT) {
                if (!isCheckCreatedFromTrans(newRecord, [record.Type.PURCHASE_ORDER])) return;
            }
            const objConfigFields = getFieldsConfig(recType);
            if (triggerType === 'edit' && !isUpdateDataWhenAddNewOrRemoveLineInvDetail({
                newRecord: newRecord,
                oldRecord: scriptContext.oldRecord
            })) {
                if (!isFieldChangedDataToUpdWhenEdit({
                    newRecord: newRecord,
                    oldRecord: scriptContext.oldRecord,
                    listFieldsHeader: objConfigFields.FIELD_HEADER_CHANGE,
                    listFieldsLine: objConfigFields.FIELD_LINE_CHANGE
                })) return;
            }
            const dataInvNums = getDataInvNumsUpd({
                curRec: newRecord,
                objConfigFields: objConfigFields,
            });
            // log.audit('dataInvNums', dataInvNums)
            if (!lfn.isContainValue(dataInvNums)) return;
            if (Object.keys(dataInvNums).length > 40) {
                let taskId = doSubmitTask(dataInvNums);
                log.audit('Run Task Update Data Lot ', taskId);
            } else {
                updateDataInventoryNumber(dataInvNums);
        }
        };

        const doSubmitTask = (dataInvNums) => {
            let mrTaskCreateUpdate = task.create({
                taskType: task.TaskType.MAP_REDUCE,
                scriptId: 'customscript_scv_mr_upd_lot_from_trans',
                deploymentId: null
            });
            mrTaskCreateUpdate.params = {custscript_scv_mr_data_lot_update: JSON.stringify(dataInvNums)};
            return mrTaskCreateUpdate.submit();
        };

        const getDataInvNumsUpd = (options) => {
            const curRec = options.curRec;
            const objConfigFields = options.objConfigFields;
            const recType = curRec.type;
            const arrayDataLine = getElementDataSublistHaveInvDetail(curRec, objConfigFields.FIELD_LINE);
            if (arrayDataLine.length < 1) return;
            //const listItemId = arrayDataLine.map(o => o.item);
            // const objDataInItem = getElementDataInItem(listItemId, []);
            const objDataHeader = getDataHeader(curRec, objConfigFields.FIELD_HEADER);
            const listIdInvNumber = arrayDataLine.length;
            let objInventoryNumberUpd = {};
            for (let i = 0; i < listIdInvNumber; i++) {
                const objDataLine = arrayDataLine[i];
                const invNumberId = objDataLine.invNumId;
                if (objInventoryNumberUpd.hasOwnProperty(invNumberId)) continue;
                const objUpd = {};
                if (recType === record.Type.ITEM_RECEIPT) {
                    Object.assign(objUpd, {
                        custitemnumber_scv_import_date: objDataHeader.trandate || ''
                    });
                } else if (recType === record.Type.INVENTORY_ADJUSTMENT) {
                    Object.assign(objUpd, {
                        custitemnumber_scv_import_date: objDataLine.custcol_scv_required_date || '',
                        custitemnumber_scv_item_num_color_seri: objDataLine.custcol_scv_color_seri || '',
                        custitemnumber_scv_core_weight: objDataLine.custcol_scv_core_weight||'',
                        memo: objDataLine.memo || '',
            });
        }
                if (Object.keys(objUpd).length) objInventoryNumberUpd[invNumberId] = objUpd;
            }
            return objInventoryNumberUpd;
        };

        const updateDataInventoryNumber = (dataInventoryNumbersUpd) => {
            if (!lfn.isContainValue(dataInventoryNumbersUpd)) return;
            const arrInventoryNumberId = Object.keys(dataInventoryNumbersUpd);
            log.audit('arrInventoryNumberId', arrInventoryNumberId);
            arrInventoryNumberId.forEach(invNumberId => {
                let objUpd = dataInventoryNumbersUpd[invNumberId];
                record.submitFields({
                    type: record.Type.INVENTORY_NUMBER,
                    id: invNumberId,
                    values: objUpd,
                    options: {
                        ignoreMandatoryFields: true,
                        enablesourcing: false
                    }
                })
            });
        };

        const convertStrDateInObj = (objUpd) => {
            let fields = ['custitemnumber_scv_import_date'];
            const numFld = fields.length;
            for (let i = 0; i < numFld; i++) {
                if (lfn.isContainValue(objUpd?.[fields[i]])) objUpd[fields[i]] = new Date(objUpd[fields[i]]);
            }
        };

        const isCheckCreatedFromTrans = (curRec, listCreatedFromTrans) => {
            const createdFromTransId = curRec.getValue('createdfrom');
            if (!createdFromTransId) return false;
            const recordType = search.lookupFields({
                type: 'transaction',
                id: createdFromTransId,
                columns: ['recordtype']
            })?.recordtype || '';
            return listCreatedFromTrans.indexOf(recordType) !== -1;
        }

        const isUpdateDataWhenAddNewOrRemoveLineInvDetail = (options) => {
            const triggerType = options.triggerType;
            if (triggerType !== 'edit') return true;
            const newRecord = options.newRecord || {};
            const oldRecord = options.oldRecord || {};
            const arrayInvNumberNew = getElementDataSublistHaveInvDetail(newRecord, ['item']).map(o => o.invNumId);
            const arrayInvNumberIdOld = getElementDataSublistHaveInvDetail(oldRecord, ['item']).map(o => o.invNumId);
            const isLineEqual = arrayInvNumberNew.length === arrayInvNumberIdOld.length;
            const isNotCtrNewInvNumber = arrayInvNumberNew.every(id => arrayInvNumberIdOld.indexOf(id) !== -1);
            return !isLineEqual || !isNotCtrNewInvNumber;
        }

        const isFieldChangedDataToUpdWhenEdit = (options) => {
            const newRecord = options.newRecord || {};
            const oldRecord = options.oldRecord || {};
            if (isCheckChangeDataFieldHeader({
                newRecord: newRecord,
                oldRecord: oldRecord,
                fieldHeaders: options.listFieldsHeader
            })) return true;
            else if (isCheckChangeDataFieldLine({
                newRecord: newRecord,
                oldRecord: oldRecord,
                fieldLines: options.listFieldsLine

            })) return true;
            return false;
        }

        /**
         * Check if the data in the header has been change
         * @param options
         * @param {object} options.newRecord - The new record object.
         * @param {object} options.oldRecord - The old record object.
         * @param {array} options.fieldHeaders - The array of field headers.
         * @returns {boolean}
         * */
        const isCheckChangeDataFieldHeader = (options) => {
            const newRecord = options.newRecord;
            const oldRecord = options.oldRecord;
            const fieldHeaders = options.fieldHeaders;
            let isUpd = false;
            const lengthFieldHeader = fieldHeaders.length;
            for (let i = 0; i < lengthFieldHeader; i++) {
                const fieldName = fieldHeaders[i];
                const valueOld = oldRecord.getValue(fieldName);
                const valueNew = newRecord.getValue(fieldName);
                if (valueOld !== valueNew) {
                    isUpd = true;
                    break;
                }
            }
            return isUpd;
        }

        /**
         * Check if the data in the Sublist has been change
         * @param options
         * @param {object} options.newRecord - The new record object.
         * @param {object} options.oldRecord - The old record object.
         * @param {string} options.sublistID - The sublist ID.
         * @param {array} options.fieldLines - The array of field lines.
         * @returns {boolean}
         * */
        const isCheckChangeDataFieldLine = (options) => {
            const newRecord = options.newRecord;
            const fieldLines = options.fieldLines
            const oldRecord = options.oldRecord;
            const sublistID = options.sublistID;
            let isUpd = false;
            const lengthFieldLine = fieldLines.length;
            const lineCount = newRecord.getLineCount({sublistId: sublistID});
            for (let line = 0; line < lineCount; line++) {
                for (let i = 0; i < lengthFieldLine; i++) {
                    const sublistFieldName = fieldLines[i];
                    const valueOld = oldRecord.getSublistValue({
                        sublistId: sublistID,
                        fieldId: sublistFieldName,
                        line: line
                    });
                    const valueNew = newRecord.getSublistValue({
                        sublistId: sublistID,
                        fieldId: sublistFieldName,
                        line: line
                    });
                    if (valueOld !== valueNew) {
                        isUpd = true;
                        break;
                    }
                }
            }
            return isUpd;
        };

        const getDataHeader = (curRec, arrayFields) => {
            const results = {internalid: curRec.id};
            if (arrayFields.length === 0) return results;
            const lengthFields = arrayFields.length;
            for (let i = 0; i < lengthFields; i++) {
                const objField = curRec.getField(arrayFields[i]);
                if (typeof objField === 'undefined') continue;
                results[arrayFields[i]] = curRec.getValue(arrayFields[i]);
                if (objField.type === 'date') results[arrayFields[i] + '_text'] = (!!results[arrayFields[i]]) ? curRec.getText(arrayFields[i]) : '';
            }
            return results;
        }

        const getElementDataInItem = (arrayItemId, arrayColumns) => {
            if (arrayColumns.length === 0) return {};
            const arrayColumnsTemp = JSON.parse(JSON.stringify(arrayColumns));
            const filterSS = [["internalid", "anyof", arrayItemId]]
            let searchObj = search.create({type: search.Type.ITEM, filters: filterSS, columns: arrayColumns});
            let searchResult = searchObj.run().getRange({start: 0, end: 1000});
            const lengthResult = searchResult.length;
            const resultsObjItem = {};
            const lengthColumn = arrayColumns.length;
            for (let i = 0; i < lengthResult; i++) {
                let obj = {};
                const itemId = searchResult[i].id;
                for (let j = 0; j < lengthColumn; j++) {
                    obj[arrayColumnsTemp[j]] = searchResult[i].getValue(arrayColumns[j]);
                }
                resultsObjItem[itemId] = obj;
            }
            return resultsObjItem;
        }

        const getElementDataSublistHaveInvDetail = (curRec, arrayField) => {
            if (arrayField.length === 0) return [];
            const results = [];
            const sublistId = getSublistId(curRec.type);
            const lineCount = curRec.getLineCount({sublistId: sublistId});
            for (let i = 0; i < lineCount; i++) {
                if (!haveInvDetail(curRec, sublistId, i)) continue;
                if (!isUseCaseUpdLotNumOnInvAss(curRec, sublistId, i)) continue;
                const objLineItem = getDataValueLine(curRec, sublistId, arrayField, i);
                const resultDataInvAssignment = getInventoryAssignment(curRec, sublistId, objLineItem.item, i);
                const arrayData = resultDataInvAssignment.map(obj => ({...obj, ...objLineItem}))
                results.push(...arrayData);
            }
            return results;
        }

        const getInventoryAssignment = (curRec, sublistId, itemId, line) => {
            const slDetId = 'inventoryassignment'
            const invDetSubRecord = curRec.getSublistSubrecord({
                sublistId: sublistId,
                fieldId: 'inventorydetail',
                line: line
            });
            const resultsDataInvAssignment = [];
            const lineCountInvAss = invDetSubRecord.getLineCount({sublistId: slDetId});
            for (let j = 0; j < lineCountInvAss; j++) {
                const invNumId = invDetSubRecord.getSublistValue({
                    sublistId: slDetId,
                    fieldId: 'numberedrecordid',
                    line: j
                });
                if (!invNumId) continue;
                const issueinventorynumber = invDetSubRecord.getSublistValue({
                    sublistId: slDetId,
                    fieldId: 'issueinventorynumber',
                    line: j
                });
                const receiptinventorynumber = invDetSubRecord.getSublistValue({
                    sublistId: slDetId,
                    fieldId: 'receiptinventorynumber',
                    line: j
                });
                resultsDataInvAssignment.push({
                    invNumId: invNumId,
                    itemId: itemId,
                    issueinventorynumber: issueinventorynumber,
                    receiptinventorynumber: receiptinventorynumber
                });
            }
            return resultsDataInvAssignment;
        };

        const getDataValueLine = (curRec, sublistId, arrayField, line) => {
            return arrayField.reduce((obj, fieldId) => {
                const objField = curRec.getSublistField({sublistId: sublistId, fieldId: fieldId, line: line});
                if (typeof objField !== "undefined") {
                    obj[fieldId] = curRec.getSublistValue({sublistId: sublistId, fieldId: fieldId, line: line});
                }
                return obj
            }, {});
        };

        const haveInvDetail = (curRec, sublistId, line) => {
            return !!curRec.getSublistValue({sublistId: sublistId, fieldId: 'inventorydetail', line: line});
        };

        const isUseCaseUpdLotNumOnInvAss = (curRec, sublistId, line) => {
            const recType = curRec.type;
            if (recType !== record.Type.INVENTORY_ADJUSTMENT) return true;
            let qty = curRec.getSublistValue({sublistId: sublistId, fieldId: 'adjustqtyby', line: line,}) * 1;
            return qty > 0;
        }

        const getSublistId = (recType) => {
            if (recType === record.Type.ITEM_RECEIPT) {
                return 'item';
            } else if (recType === record.Type.INVENTORY_ADJUSTMENT) {
                return 'inventory';
            }
            throw 'Not Config Sublist!';
        }

        return {
            setDataTransactionToInventoryNumber,
            setDataMultiLotNumber,
            setDataLotNumberRecordFromOriginRecord,
            getDataInventoryNumberFromTrans,
            convertStrDateInObj
        };
    });
