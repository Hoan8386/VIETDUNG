/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/runtime', 'N/search', 'N/url', '../lib/scv_lib_function.js', '../lib/scv_lib_qaqc'],
    function (record, runtime, search, url, lfn, lqc) {

        const beforeLoad = (scriptContext) => {
            let newRecord = scriptContext.newRecord;
            const recordType = newRecord.type;
            if (recordType === record.Type.ITEM_RECEIPT) {
                beforeLoadItemReceipt(scriptContext);
            } else if (recordType === record.Type.WORK_ORDER) {
                beforeLoadWorkOrder(scriptContext);
            }
        };

        const beforeLoadWorkOrder = scriptContext => {
            if (scriptContext.type === 'view') {
                const form = scriptContext.form;
                let newRecord = scriptContext.newRecord;
                if (validShowBtnCreateMFGInspection(newRecord)) {
                    addButtonMFGInspection(form, newRecord.id, newRecord.type);
                }
                if (!!newRecord.id && lqc.validInspectionLines(newRecord, lqc.fetchDataSourceInspectionInactive(newRecord.id), 'custcol_scv_inspection_plan')) {
                    addButtonIQCInspection(form, newRecord.id, newRecord.type);
                }
            }
        };

        const validShowBtnCreateMFGInspection = (newRecord) => {
            let status = newRecord.getValue('status');
            let approval_status = newRecord.getValue('custbody_scv_approval_status') * 1;
            let inspect_started = newRecord.getValue('custbody_scv_inspection_started');
            let inspection_plan = newRecord.getValue('custbody_scv_inspect_plan_assy');
            const arrStatusWO = ['Released', 'In Process', 'Closed', 'Built'];
            const showBtnInspection = ((lqc.checked(inspect_started) && arrStatusWO.includes(status))) && (approval_status === 3);
            if (!showBtnInspection) return false;
            let item = newRecord.getValue('assemblyitem');
            let lkItem = search.lookupFields({
                type: 'item',
                id: item,
                columns: ['custitem_scv_inspection_plan']
            });
            if (!lfn.isContainValue(inspection_plan)) inspection_plan = lkItem.custitem_scv_inspection_plan?.[0]?.value || '';
            return lfn.isContainValue(inspection_plan)
        };

        const addButtonMFGInspection = (form, internalId, type) => {
            let createPdfUrl = url.resolveScript({
                scriptId: 'customscript_scv_sl_mfg_inspection',
                deploymentId: 'customdeploy_scv_sl_mfg_inspection',
                returnExternalUrl: false
            });
            createPdfUrl += '&createdfromid=' + internalId + '&createdrectype=' + type
            form.addButton({
                id: 'custpage_bt_mfg_inspection',
                label: 'Create Inspection Sheet (PQC)',
                functionName: "window.location.replace('" + createPdfUrl + "');"
            });
        };

        const beforeLoadItemReceipt = (scriptContext) => {
            if (scriptContext.type === 'view') {
                const form = scriptContext.form;
                let newRecord = scriptContext.newRecord;
                if (lqc.validInspectionLines(newRecord, lqc.fetchDataSourceInspectionInactive(newRecord.id.toString()), 'custcol_scv_inspection_plan')) {
                    addButtonIQCInspection(form, newRecord.id, newRecord.type);
                }
                addButtonBinTransfer(form, newRecord);
                //addButtonCreateBill(form, newRecord);
            }
        };


        /*const addButtonCreateBill = (form, newRecord) => {
            const orderType = newRecord.getValue('ordertype');
            if (orderType !== 'PurchOrd') return;
            const createdFrom = newRecord.getValue('createdfrom');
            if (!createdFrom) return;
            const status = search.lookupFields({
                type: 'transaction',
                id: createdFrom,
                columns: ['status']
            }).status[0].value;
            if (['pendingBilling', 'partiallyReceived', 'pendingBillPartReceived'].indexOf(status) === -1) return;
            let searchResult = search.create({
                type: 'vendorbill',
                filters: [['custbody_scv_created_transaction', 'anyof', newRecord.id]],
                columns: ['internalid']
            })
                .run().getRange(0, 1);
            if (searchResult.length === 0) return;
            const internalId = newRecord.id;
            let createBillUrl = url.resolveScript({
                scriptId: 'customscript_scv_sl_transform_ir_to_vb',
                deploymentId: 'customdeploy_scv_sl_transform_ir_to_vb',
                returnExternalUrl: false
            });
            createBillUrl += `&irid=${internalId}&ordertype=${orderType}&createdfrom=${createdFrom}&status=${status}`;
            form.addButton({
                id: 'custpage_bt_ir_to_vb',
                label: 'Create Bill',
                functionName: `window.location.replace('${createBillUrl}');`
            });
        };*/

        const addButtonIQCInspection = (form, internalId, type) => {
            let createPdfUrl = url.resolveScript({
                scriptId: 'customscript_scv_sl_crt_ins_result',
                deploymentId: 'customdeploy_scv_sl_crt_ins_result',
                returnExternalUrl: false
            });
            createPdfUrl += '&createdfromid=' + internalId + '&createdrectype=' + type;
            form.addButton({
                id: 'custpage_bt_ipc_inspection',
                label: 'Create Inspection Sheet (IQC)',
                functionName: "window.location.replace('" + createPdfUrl + "');"
            });
        }

        const addButtonBinTransfer = (form, newRecord) => {
            const binTransferUrl = `/app/accounting/transactions/bintrnfr.nl?createdfromid=${newRecord.id}&createdrectype=${newRecord.type}`;
            form.addButton({
                id: 'custpage_bt_bin_transfer',
                label: 'Bin Transfer',
                functionName: `window.location.replace('${binTransferUrl}');`
            });
        }

        const beforeSubmit = (scriptContext) => {
        };

        const afterSubmitWorkOrder = (scriptContext) => {
            const triggerType = scriptContext.type;
            if (triggerType === 'delete') return;
            let newRecord = scriptContext.newRecord;
            lqc.generateInspectionResultsOfTrans(newRecord.type, newRecord.id);
        }

        const afterSubmitReturnAuthorization = (scriptContext) => {
            const triggerType = scriptContext.type;
            if (triggerType === 'delete') return;
            let newRecord = scriptContext.newRecord;
            lqc.generateInspectionResultsOfTrans(newRecord.type, newRecord.id);
        };

        const generateIQCInspection = (scriptContext) => {
            let newRecord = scriptContext.newRecord;
            lqc.generateInspectionResultsOfTrans(newRecord.type, newRecord.id);
        }

        const generateRMAInspection = (scriptContext) => {
            let newRecord = scriptContext.newRecord;
            if (!validCreateInspectionRMA(newRecord)) return;
            const qaCheck = newRecord.getValue('custbody_scv_qa_check');
            const createdFrom = newRecord.getValue('createdfrom');
            const subsidiary = newRecord.getValue('subsidiary');
            if (lfn.getTranRecordType(createdFrom) === record.Type.RETURN_AUTHORIZATION && !inspectionRmaExists(newRecord.id) && lqc.checked(qaCheck)) {
                createInspectionRMA(newRecord, createdFrom, subsidiary);
            }
        };

        const generateMFGInspection = (scriptContext) => {
            if (['edit', 'create'].indexOf(scriptContext.type) === -1) return;
            lqc.generateMFGInspectionOfTrans(scriptContext.newRecord.type, scriptContext.newRecord.id);
        };

        const afterSubmitItemReceipt = (scriptContext) => {
            if (scriptContext.type !== 'delete') {
                // Do đang set inspection sheet lên line cùng lúc với IR nên lỗi, tạm thời comment
                generateIQCInspection(scriptContext)
                generateMFGInspection(scriptContext);
                generateRMAInspection(scriptContext);
            }
        };

        const afterSubmit = (scriptContext) => {
            const recordType = scriptContext.newRecord.type;
            if (recordType === record.Type.ITEM_RECEIPT) {
                afterSubmitItemReceipt(scriptContext);
            } else if (recordType === record.Type.RETURN_AUTHORIZATION) {
                afterSubmitReturnAuthorization(scriptContext);
            } else if (recordType === record.Type.WORK_ORDER) {
                afterSubmitWorkOrder(scriptContext);
            }
        };

        const validCreateInspectionRMA = (newRecord) => {
            const isSuiteletContext = runtime.executionContext === runtime.ContextType.SUITELET;
            const isCustomNo = !!newRecord.getValue('custbody_scv_itr_custom_no');
            return !isSuiteletContext || !isCustomNo;
        };

        const inspectionRmaExists = (receiptId) => search.create({
            type: 'customrecord_scv_qa_inspection_rma',
            filters: [['custrecord_scv_qa_receipt_no', 'anyof', receiptId]],
            columns: ['custrecord_scv_qa_receipt_no']
        }).run().getRange({start: 0, end: 1}).length > 0;

        const createInspectionRMA = (newRecord, createdFrom, subsidiary) => {
            const docNumber = getRmaNumber(subsidiary, lqc.dateToMMYY(newRecord.getValue('trandate')));
            const recRma = record.create({type: 'customrecord_scv_qa_inspection_rma'});
            setHeaderRMA(recRma, docNumber, newRecord, createdFrom);
            insertLineItemsRMA(newRecord, recRma);
            recRma.save({enableSourcing: false, ignoreMandatoryFields: true});
        };

        const setHeaderRMA = (recRma, docNumber, newRecord, createdFrom) => {
            const data = [docNumber, newRecord.getValue('entity'), newRecord.id, createdFrom];
            const fields = ['name', 'custrecord_scv_qa_customer', 'custrecord_scv_qa_receipt_no', 'custrecord_scv_qa_receipt_from'];
            lfn.setValueData(recRma, fields, data);
        };

        const insertLineItemsRMA = (newRecord, recRma) => {
            const lineCount = newRecord.getLineCount('item');
            let isSave = false;
            let j = 0;
            for (let i = 0; i < lineCount; i++) {
                if (!lqc.checked(newRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'itemreceive',
                    line: i
                }))) continue;
                const slData = getRmaSublistData(newRecord, i);
                recRma.insertLine({sublistId: 'recmachcustrecord_scv_qad_parent_record', line: j});
                lfn.setSublistValueData(recRma, 'recmachcustrecord_scv_qad_parent_record', [
                    'custrecord_scv_qad_return_items',
                    'custrecord_scv_qad_item_lot_number',
                    'custrecord_scv_qad_expiration_date',
                    'custrecord_scv_qad_quantity',
                    'custrecord_scv_qad_units',
                    'custrecord_scv_qad_packaging'
                ], j, slData);
                isSave = true;
                j++;
            }
            return isSave;
        };

        const getRmaNumber = (subsidiary, year_month) => {
            let columns = ['custrecord_scv_in_subsidiary_prefix', 'custrecord_scv_rma_prefix', 'custrecord_scv_rma_no'];
            let sVN = lqc.searchInspectionNumber(subsidiary, columns, year_month);
            let doc_no = '';
            let doc_number = '';
            if (sVN === null) return ''
            doc_no = +sVN.getValue('custrecord_scv_rma_no') + 1;
            doc_number = sVN.getValue('custrecord_scv_in_subsidiary_prefix') + '.' + sVN.getValue('custrecord_scv_rma_prefix') + '.' + year_month;
            doc_number = doc_number + '.' + lfn.makePrefix(doc_no, 5, '0');
            record.submitFields({
                type: 'customrecord_scv_inspection_number', id: sVN.id, values: {custrecord_scv_rma_no: doc_no},
                options: {enableSourcing: false, ignoreMandatoryFields: true}
            });
            return doc_number;
        }


        const getRmaSublistData = (newRecord, lineIndex) => {
            const hasInvAvail = lqc.checked(newRecord.getSublistValue({
                sublistId: 'item',
                fieldId: 'inventorydetailavail',
                line: lineIndex
            }));
            let lotNum = '', expDate = '';
            if (hasInvAvail) {
                lotNum = getLotNumber(newRecord, lineIndex);
                expDate = getExpirationDate(newRecord, lineIndex);
            }
            return [
                newRecord.getSublistValue({sublistId: 'item', fieldId: 'item', line: lineIndex}),
                lotNum,
                expDate,
                newRecord.getSublistValue({sublistId: 'item', fieldId: 'quantity', line: lineIndex}),
                newRecord.getSublistValue({sublistId: 'item', fieldId: 'unitsdisplay', line: lineIndex}),
                newRecord.getSublistValue({sublistId: 'item', fieldId: 'custcol_scv_po_line_packging', line: lineIndex})
            ];
        }

        const getLotNumber = (newRecord, lineIndex) => {
            const inventoryDetail = newRecord.getSublistSubrecord({
                sublistId: 'item',
                fieldId: 'inventorydetail',
                line: lineIndex
            });
            const lotNumbers = [];
            const lineCount = inventoryDetail.getLineCount('inventoryassignment');
            for (let i = 0; i < lineCount; i++) {
                let lotNumber = inventoryDetail.getSublistValue({
                    sublistId: 'inventoryassignment',
                    fieldId: 'receiptinventorynumber',
                    line: i
                });
                if (lotNumber) lotNumbers.push(lotNumber);
            }
            return lotNumbers.join(', ');
        };

        const getExpirationDate = (newRecord, lineIndex) => {
            const inventoryDetail = newRecord.getSublistSubrecord({
                sublistId: 'item',
                fieldId: 'inventorydetail',
                line: lineIndex
            });
            const expirationDates = [];
            const lineCount = inventoryDetail.getLineCount('inventoryassignment');
            for (let i = 0; i < lineCount; i++) {
                let expirationDate = inventoryDetail.getSublistValue({
                    sublistId: 'inventoryassignment',
                    fieldId: 'expirationdate',
                    line: i
                });
                if (expirationDate) expirationDates.push(formatDate(expirationDate));
            }
            return expirationDates.join(', ');
        };

        const formatDate = (dateObj) => {
            const day = String(dateObj.getDate()).padStart(2, '0');
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const year = dateObj.getFullYear();
            return `${day}/${month}/${year}`;
        };

        return {
            beforeLoad,
            beforeSubmit,
            afterSubmit
        };

    });
