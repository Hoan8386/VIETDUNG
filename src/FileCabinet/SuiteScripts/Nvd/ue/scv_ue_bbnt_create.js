/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

define(['N/url', 'N/runtime', 'N/search', 'N/ui/serverWidget', 'N/record', 'N/query', '../cons/scv_cons_format.js',],
    function (url, runtime, search, serverWidget, record, query, constFormat) {

        const beforeLoad = (scriptContext) => {
            const form = scriptContext.form;
            const currentRecord = scriptContext.newRecord;
            const recordType = currentRecord.type;

            if (scriptContext.type === scriptContext.UserEventType.VIEW && recordType === 'custompurchase_scv_purchase_request') {
                addAcceptanceButton(form, currentRecord, recordType);
            }
            if (scriptContext.type === 'create' && recordType === 'customrecord_scv_nghiem_thu') {
                let request = scriptContext.request;
                if (request && request.parameters && request.parameters.sourceRecordId) {
                    populateAcceptanceFieldsFromRequest(form, request, recordType, currentRecord);
                }
            }
        };

        const addAcceptanceButton = (form, purchaseRequestRecord, recordType) => {
            const approvalStatus = purchaseRequestRecord.getValue('custbody_scv_approval_status');
            const transactionId = purchaseRequestRecord.getValue('id');
            if (approvalStatus === '3') {
                const acceptanceRecordUrl = url.resolveRecord({
                    recordType: 'customrecord_scv_nghiem_thu',
                    isEditMode: true,
                    params: {
                        sourceRecordId: purchaseRequestRecord.id,
                        sourceRecordType: recordType,
                        sourceTransactionId: transactionId
                    }
                });

                form.addButton({
                    id: 'custpage_scv_add_btn_create_opp',
                    label: 'Phiếu nghiệm thu',
                    functionName: `window.open('${acceptanceRecordUrl}', '_blank')`
                });
            }
        };

        const populateAcceptanceFieldsFromRequest = (form, request, recordType, acceptanceRecord) => {
            let hiddenSourceIdField = form.addField({
                id: 'custpage_hidden_source_pr_id',
                label: 'RecID Hidden',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });
            hiddenSourceIdField.defaultValue = request.parameters.sourceRecordId;

            if (request && request.parameters) {
                const sourceRecordId = request.parameters.sourceRecordId;
                const sourceRecordType = request.parameters.sourceRecordType;
                const sourceTransactionId = request.parameters.sourceTransactionId;

                const currentUserId = runtime.getCurrentUser().id;
                const currentUserSub = runtime.getCurrentUser().subsidiary;
                const currentUserDept = runtime.getCurrentUser().department;
                const currentDate = constFormat.getDateTimeWithCurrentGMT(new Date());

                const defaultFieldValues = {
                    'custrecord_scv_accept_type': 1,
                    'custrecord_scv_accept_date': currentDate,
                    'custrecord_scv_accept_requester': currentUserId,
                    'custrecord_scv_accept_sub': currentUserSub,
                    'custrecord_scv_accept_request_dept': currentUserDept,
                    'custrecord_scv_accept_cmmsworkorder': sourceTransactionId,
                }

                Object.keys(defaultFieldValues).forEach(fieldId => {
                    acceptanceRecord.setValue({
                        fieldId: fieldId,
                        value: defaultFieldValues[fieldId]
                    });
                });


                const purchaseRequestRecord = record.load({
                    type: sourceRecordType,
                    id: sourceRecordId,
                    isDynamic: false
                });

                const prLineCount = purchaseRequestRecord.getLineCount({ sublistId: 'item' });
                let acceptanceLineIndex = 0;
                const validClassificationIds = [2, 3, 4, 5];

                const acceptanceSublistInternalId = 'recmachcustrecord_scv_accept_detail_no';

                for (let i = 0; i < prLineCount; i++) {
                    const itemClassificationId = purchaseRequestRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_scv_acceptance_classification',
                        line: i
                    });

                    if (validClassificationIds.includes(Number(itemClassificationId))) {
                        const purchaseRequestItem = purchaseRequestRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                        acceptanceRecord.setSublistValue({
                            sublistId: acceptanceSublistInternalId,
                            fieldId: 'custrecord_scv_accept_detail',
                            line: acceptanceLineIndex,
                            value: purchaseRequestItem
                        });
                    }
                    acceptanceLineIndex++;
                }
            }
        };

        const afterSubmit = (scriptContext) => {
            let acceptanceRecord = scriptContext.newRecord;
            const sourcePurchaseRequestId = acceptanceRecord.getValue('custpage_hidden_source_pr_id');
            const acceptanceRecordId = acceptanceRecord.getValue('id');

            if (sourcePurchaseRequestId) {
                try {
                    record.submitFields({
                        type: 'custompurchase_scv_purchase_request',
                        id: sourcePurchaseRequestId,
                        values: {
                            custbody_scv_nghiem_thu: acceptanceRecordId
                        },
                    });
                } catch (e) {
                    log.error('Failed to update status', e.message);
                }
            }
        };

        return {
            beforeLoad,
            afterSubmit
        };
    });