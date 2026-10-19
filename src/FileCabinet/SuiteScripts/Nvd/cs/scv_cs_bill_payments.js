/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['../cons/scv_cons_payreq', 'N/search', 'N/format'],
    function (ConsPayReq, search, format) {

        const setDataPaymentRequest = (id) => {
            window.DATA_PAYMENT = fetchDataBodyPaymentRequest(id);
        };

        const getDataPaymentRequest = () => {
            return window.DATA_PAYMENT;
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
            try {
                let objParams = getUrlVars();
                if (validCreatedFromPayReq(objParams)) {
                    initializeDataPayReq(scriptContext.currentRecord, objParams);
                }
            } catch (e) {
                console.log('pageInit:' + JSON.stringify(e));
            }

            let objParams = getUrlVars();

            setTimeout(function () {
                setDataBillPaymentFromPaymentRequest(currentRecord, objParams);
                appliedBillsToTrans(currentRecord, getDataPaymentRequest().custrecord_scv_payment_related);
            }, 2000);
        }

        const initializeDataPayReq = (curRec, objParams) => {
            setDataPaymentRequest(objParams.createFromId);
            const entity = curRec.getValue('entity');
            const subsidiary = curRec.getValue('subsidiary');
            const objBodyPayReq = getDataPaymentRequest();
            if(!entity) curRec.setValue('entity', objBodyPayReq.custrecord_scv_payment_entity);
            if(!subsidiary) curRec.setValue('subsidiary', objBodyPayReq.custrecord_scv_payment_subsidiary);
            curRec.setValue('currency', objBodyPayReq.custrecord_scv_payment_currency);
            curRec.setValue('exchangerate', objBodyPayReq.custrecord_scv_payment_exchangerate);
        }

        const parseDate = (date) => {
            if (!date) return;
            return format.parse({
                value: date,
                type: format.Type.DATE
            });
        };

        const setDataBillPaymentFromPaymentRequest = (curRec, objParams) => {
            let {createFromId, btnid} = objParams;
            if (btnid !== ConsPayReq.CustomButtonId.BILL_PAYMENT) return;
            const objBodyPayReq = getDataPaymentRequest();
            const paymentType = objBodyPayReq.custrecord_scv_payment_type;
            const objAccountIdByTypePayment = {
                [ConsPayReq.CustomPaymentTypeId.THANH_TOAN_CONG_NO]: ConsPayReq.CustomAccountId.ACCOUNT_33110001,
                [ConsPayReq.CustomPaymentTypeId.HOAN_UNG_NHAN_VIEN]: ConsPayReq.CustomAccountId.ACCOUNT_14120001
            };
            const accountId = objAccountIdByTypePayment[paymentType];
            setValueDataDiff(curRec, [
                'account',
                'trandate',
                'department',
                'custbody_scv_advanced_request',
                'memo',
                'custbody_scv_payment_number'
            ], [
                accountId,
                parseDate(objBodyPayReq.custrecord_scv_payment_date),
                objBodyPayReq.custrecord_scv_payment_department,
                objBodyPayReq.custrecord_scv_payment_advanced_reques,
                objBodyPayReq.custrecord_scv_payment_memo,
                [createFromId]
            ]);
        };

        const setValueDataDiff = (newRecord, newFields, data, ignore = true) => {
            let lFields = newFields.length;
            let value;
            for (let i = 0; i < lFields; i++) {
                if (newRecord.getValue(newFields[i]) !== undefined) {
                    value = data[i];
                    value = value === undefined || value === null ? '' : value;
                    newRecord.setValue(newFields[i], value, ignore);
                }
            }
        }

        const fetchDataBodyPaymentRequest = (idPayReq) => {
            let lkPayReq = search.lookupFields({
                type: ConsPayReq.CustomRecordType.PAYMENT_REQUEST,
                id: idPayReq,
                columns: [
                    'custrecord_scv_payment_entity',
                    'custrecord_scv_payment_subsidiary',
                    'custrecord_scv_payment_currency',
                    'custrecord_scv_payment_exchangerate',
                    'custrecord_scv_payment_memo',
                    'custrecord_scv_payr_project',
                    'custrecord_scv_payment_amount',
                    'custrecord_scv_payment_po',
                    'custrecord_scv_payment_department',
                    'custrecord_scv_payment_beneficiary',
                    'custrecord_scv_payment_nguoi_thu_huong',
                    'custrecord_scv_payment_bankaccount',
                    'custrecord_scv_payment_bankbranch',
                    'custrecord_scv_payment_bankname',
                    'custrecord_scv_payment_date',
                    'custrecord_scv_payment_advanced_reques',
                    'custrecord_scv_payment_type',
                    'custrecord_scv_payment_related'
                ]
            });
            return {
                custrecord_scv_payment_entity: lkPayReq.custrecord_scv_payment_entity?.[0]?.value,
                custrecord_scv_payment_subsidiary: lkPayReq.custrecord_scv_payment_subsidiary?.[0]?.value,
                custrecord_scv_payment_currency: lkPayReq.custrecord_scv_payment_currency?.[0]?.value,
                custrecord_scv_payment_exchangerate: lkPayReq.custrecord_scv_payment_exchangerate,
                custrecord_scv_payment_memo: lkPayReq.custrecord_scv_payment_memo,
                custrecord_scv_payr_project: lkPayReq.custrecord_scv_payr_project?.[0]?.value,
                custrecord_scv_payment_amount: lkPayReq.custrecord_scv_payment_amount,
                custrecord_scv_payment_po: lkPayReq.custrecord_scv_payment_po?.[0]?.value,
                custrecord_scv_payment_department: lkPayReq.custrecord_scv_payment_department?.[0]?.value,
                custrecord_scv_payment_beneficiary: lkPayReq.custrecord_scv_payment_beneficiary?.[0]?.value,
                custrecord_scv_payment_nguoi_thu_huong: lkPayReq.custrecord_scv_payment_nguoi_thu_huong,
                custrecord_scv_payment_bankaccount: lkPayReq.custrecord_scv_payment_bankaccount,
                custrecord_scv_payment_bankbranch: lkPayReq.custrecord_scv_payment_bankbranch,
                custrecord_scv_payment_bankname: lkPayReq.custrecord_scv_payment_bankname?.[0]?.value,
                custrecord_scv_payment_date: lkPayReq.custrecord_scv_payment_date,
                custrecord_scv_payment_advanced_reques: lkPayReq.custrecord_scv_payment_advanced_reques?.[0]?.value,
                custrecord_scv_payment_type: lkPayReq.custrecord_scv_payment_type,
                custrecord_scv_payment_related: lkPayReq.custrecord_scv_payment_related.map(o => o.value) || [],
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
        function postSourcing(scriptContext) {
            let objParams = getUrlVars();
            let {fieldId, currentRecord} = scriptContext;
            if (fieldId === 'entity' && validCreatedFromPayReq(objParams)) {
                setDataBillPaymentFromPaymentRequest(currentRecord, objParams);
                setTimeout(function () {
                    appliedBillsToTrans(currentRecord, getDataPaymentRequest().custrecord_scv_payment_related);
                }, 100);
            }
        }

        const appliedBillsToTrans = (curRec, arrTransId) => {
            let lc = curRec.getLineCount('apply');
            let [idx, sz] = [0, arrTransId.length];
            for (let i = 0; i < lc; i++) {
                if (idx === sz) return;
                let billId = curRec.getSublistValue('apply', 'internalid', i);
                if (arrTransId.includes(billId)) {
                    curRec.selectLine('apply', i);
                    let amount = nlapiGetLineItemValue('apply', 'due', i+1);
                    curRec.setCurrentSublistValue({
                        sublistId: 'apply',
                        fieldId: 'apply',
                        value: true,
                        ignoreFieldChange: true
                    });
                    curRec.setCurrentSublistValue({
                        sublistId: 'apply',
                        fieldId: 'amount',
                        value: amount,
                        ignoreFieldChange: true
                    });
                    curRec.commitLine('apply');
                    idx++;
                }
            }
        };

        const validCreatedFromPayReq = (objParams) => objParams.createFromType === ConsPayReq.CustomRecordType.PAYMENT_REQUEST;

        const getUrlVars = () => {
            let vars = {};
            window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
                vars[key] = value;
            });
            return vars;
        };

        return {
            pageInit: pageInit,
            // postSourcing: postSourcing
        };

    });
