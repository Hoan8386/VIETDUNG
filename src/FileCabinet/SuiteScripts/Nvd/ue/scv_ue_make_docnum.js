/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/search', 'N/record', '../lib/scv_lib_dnacc.js'],

    (search, record, libDnAcc) => {
        const CustomRecordTypeId = {
            SALES_CONTRACT: 'customrecord_scv_sales_contract',
            PAYMENT_REQUEST: 'customrecord_scv_payment'
        };

        /**
         * Defines the function definition that is executed before record is loaded.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @param {Form} scriptContext.form - Current form
         * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
         * @since 2015.2
         */
        const beforeLoad = (scriptContext) => {
            switch (scriptContext.newRecord.type) {
                case record.Type.EMPLOYEE:
                    beforeLoadEmployee(scriptContext);
                    break;
                case CustomRecordTypeId.SALES_CONTRACT:
                    beforeLoadSalesContract(scriptContext);
                    break;
                case CustomRecordTypeId.PAYMENT_REQUEST:
                    beforeLoadPaymentRequest(scriptContext);
                    break;
            }
        }

        const beforeLoadPaymentRequest = (scriptContext) => {
            const trigType = scriptContext.type;
            let newRecord = scriptContext.newRecord;
            if (['create', 'copy', 'edit'].indexOf(trigType) !== -1) {
                let form = scriptContext.form;
                form.getField('name').updateDisplayType({displayType: 'disabled'});
                if (trigType !== 'edit') {
                    newRecord.setValue({fieldId: 'name', value: 'TO BE GENERATED'});
                }
            }
        }


        const beforeLoadSalesContract = (scriptContext) => {
            const trigType = scriptContext.type;
            let newRecord = scriptContext.newRecord;
            if (['create', 'copy', 'edit'].indexOf(trigType) !== -1) {
                let form = scriptContext.form;
                form.getField('name').updateDisplayType({displayType: 'disabled'});
                if (trigType !== 'edit') {
                    newRecord.setValue({fieldId: 'name', value: 'TO BE GENERATED'});
                }
            }
        }

        const beforeLoadEmployee = (scriptContext) => {
            const trigType = scriptContext.type;
            let newRecord = scriptContext.newRecord;
            if (['create', 'copy', 'edit'].indexOf(trigType) !== -1) {
                newRecord.setValue('autoname', false);
                let form = scriptContext.form;
                form.getField('autoname')?.updateDisplayType({displayType: 'hidden'});
                form.getField('entityid').updateDisplayType({displayType: 'disabled'});
                if (trigType !== 'edit') {
                    newRecord.setValue({fieldId: 'entityid', value: 'TO BE GENERATED'});
                }
            }
        }

        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (scriptContext) => {
            if (['edit', 'create'].includes(scriptContext.type)) {
                let newRecord = scriptContext.newRecord;
                let options = getOptions(newRecord);
                const oldDocNum = newRecord.getValue(options.fieldNameId);
                if ((oldDocNum === '' || oldDocNum === null || oldDocNum?.toUpperCase() === 'TO BE GENERATED')) {
                    // Use reservation + retry pattern to avoid duplicates when many records are created concurrently.
                    // Keep the original numbering logic (findMaxNumber + getDocNum) but attempt to reserve the generated
                    // number by creating a customrecord_scv_rcnumberunq with externalid/name = recordType + docNum.
                    // If reservation fails (someone else reserved same number), retry up to MAX_TRIES.
                    attemptSetDocNum(newRecord, options);
                }
            }
        }

        /**
         * Attempt to generate and reserve a document number. Retries when reservation fails due to concurrency.
         * Throws an Error if unable to reserve after MAX_TRIES.
         */
        const attemptSetDocNum = (newRecord, options) => {
            const MAX_TRIES = 5;
            let tries = 0;
            let lastDocNum = null;
            while (tries < MAX_TRIES) {
                tries++;
                const maxNumber = findMaxNumber(options);
                const docNum = getDocNum({
                    maxNumber: maxNumber,
                    prefix: options.prefix,
                    delimiter: options.delimiter,
                    suffix: options.suffix,
                    recordType: options.recordType,
                    digit: options.digit
                });
                try {
                    lastDocNum = docNum;
                    createRcNumberUnq(options.recordType + '_' + docNum); // reserve the doc number
                    newRecord.setValue(options.fieldNameId, docNum);
                    return;
                } catch (e) {
                    if(tries > 3) {
                        newRecord.setValue(options.fieldNameId, lastDocNum);
                    }
                    log.error('reserve-failed', `Attempt ${tries} failed to reserve ${docNum}: ${e.message || e}`);
                }
            }
            // let docNum = libDnAcc.getDocNumber(options.subsidiary, newRecord.type, '', options.prefix, '', '', 0, 3);
            // newRecord.setValue(options.fieldNameId, docNum);
            // if reached here, cannot reserve after retries
        }

        const createRcNumberUnq = (externalId) => {
            const recRcNumberUnq = record.create({type: 'customrecord_scv_rcnumberunq'});
            recRcNumberUnq.setValue({fieldId: 'name', value: externalId});
            recRcNumberUnq.setValue({fieldId: 'externalid', value: externalId});
            recRcNumberUnq.save();
        }

        const getDocNum = (options) => {
            const maxNumberStr = options.maxNumber.toString().padStart(options.digit, '0');
            switch (options.recordType) {
                case record.Type.EMPLOYEE:
                    return options.prefix + options.delimiter + maxNumberStr + options.suffix;
                case CustomRecordTypeId.SALES_CONTRACT:
                    return maxNumberStr + options.suffix;
                case CustomRecordTypeId.PAYMENT_REQUEST:
                    return options.prefix + options.delimiter + maxNumberStr;
            }
        }

        const findMaxNumber = (options) => {
            let filters = [];
            if (!!options?.addFilter && Array.isArray(options.addFilter) && options.addFilter.length) {
                filters = filters.concat(options.addFilter);
            } else {
                filters = filters.concat([search.createFilter({
                    name: 'formulatext',
                    formula: `SUBSTR({${options.fieldNameId}}, 1, ${options.prefix.length + options.delimiter.length})`,
                    operator: 'is',
                    values: options.prefix + options.delimiter
                })]);
            }
            let c = [];
            if (Array.isArray(options.addColumn) && options.addColumn.length) {
                c = c.concat(options.addColumn);
            } else {
                c.push({
                    name: 'formulanumeric',
                    formula: `SUBSTR(SUBSTR({${options.fieldNameId}}, 1, INSTR({${options.fieldNameId}}, '_') -1 ), ${options.prefix.length + options.delimiter.length + 1})`,
                    summary: 'MAX'
                });
            }
            // log.audit('filters', filters);
            let searchObj = search.create({type: options.recordType, filters: filters, columns: c});
            let searchResults = searchObj.run().getRange(0, 1);
            log.error('searchResults', searchResults);
            let maxNumber = 1;
            if (searchResults.length) maxNumber = (+searchResults[0].getValue(c[0]) || 0) + 1;
            return maxNumber;
        };

        const getOptions = (curRec) => {
            let options = {
                recordType: curRec.type,
                prefix: '',
                digit: 3,
                fieldNameId: '',
                prefixNumber: 0,
                delimiter: '',
                suffix: '',
                addFilter: []
            };
            switch (curRec.type) {
                case record.Type.EMPLOYEE:
                    setDataConfigEmployee(curRec, options);
                    break;
                case CustomRecordTypeId.SALES_CONTRACT:
                    setDataConfigSalesContract(curRec, options);
                    break;
                case CustomRecordTypeId.PAYMENT_REQUEST:
                    setDataConfigPaymentRequest(curRec, options);
                    break;
            }
            return options;
        };

        const setDataConfigPaymentRequest = (curRec, options) => {
            options.fieldNameId = 'name';
            let subsidiary = curRec.getValue('custrecord_scv_payment_subsidiary');
            options.subsidiary = subsidiary;
            let lkSubsidiary = search.lookupFields({
                type: search.Type.SUBSIDIARY,
                id: subsidiary,
                columns: ['tranprefix']
            });
            let paymentDate = curRec.getValue('custrecord_scv_payment_date');
            let [year, month] = ['', ''];
            if (paymentDate) {
                year = paymentDate.getFullYear().toString();
                month = String(paymentDate.getMonth() + 1).padStart(2, '0');
            }
            let prefix = lkSubsidiary.tranprefix + year + '/' + month;
            let lengthPrefix = prefix.length;
            options.prefix = prefix + '/';

            options.delimiter = '';
            options.suffix = '';
            options.addFilter = [
                search.createFilter({
                    name: 'formulatext',
                    formula: `TO_CHAR({custrecord_scv_payment_date}, 'YYYYMM')`,
                    operator: 'is',
                    values: year + month
                }),
                search.createFilter({
                    name: 'formulatext',
                    formula: `SUBSTR({${options.fieldNameId}}, 1, ${lengthPrefix})`,
                    operator: 'is',
                    values: prefix
                })
            ];
            options.addColumn = [
                {
                    name: 'formulanumeric',
                    formula: `SUBSTR({${options.fieldNameId}}, ${options.prefix.length + 1}, 18)`,
                    summary: 'MAX'
                }
            ];
        }

        const setDataConfigSalesContract = (curRec, options) => {
            options.fieldNameId = 'name';
            options.digit = 2;
            let dateSC = curRec.getValue('custrecord_scv_sc_date');
            let customerId = curRec.getValue('custrecord_scv_sc_cus');
            let subId = curRec.getValue('custrecord_scv_sc_sub');
            options.subsidiary = subId;
            let customForm = curRec.getValue('customform');
            let formHD = ''
            if (customForm === '586') {
                formHD = 'HĐNT'
            } else {
                formHD = 'HĐMB'
            }
            let year = '', codeCustomer = '', tranPrefix = '';
            if (subId) tranPrefix = getTranPrefix(subId);
            let stringStatic = `/VD${tranPrefix}-`;
            if (dateSC) year = dateSC.getFullYear().toString();
            if (customerId) {
                codeCustomer = search.lookupFields({
                    type: 'customer',
                    id: customerId,
                    columns: ['custentity_scv_short_code']
                })?.custentity_scv_short_code || '';
            }
            let suffix = stringStatic + codeCustomer + '/' + formHD + '/' + year;
            options.prefix = '';
            options.delimiter = '';
            options.suffix = suffix;
            options.addFilter = [
                search.createFilter({
                    name: 'formulatext',
                    formula: `TO_CHAR({custrecord_scv_sc_date}, 'YYYY')`,
                    operator: 'is',
                    values: year
                }),
                search.createFilter({
                    name: 'custrecord_scv_sc_sub',
                    operator: search.Operator.ANYOF,
                    values: subId
                })
            ];
            options.addColumn = [
                search.createColumn({
                    name: 'formulanumeric',
                    // formula: `SUBSTR({${options.fieldNameId}}, 1, INSTR({${options.fieldNameId}}, '/', 1) -1)`,
                    formula: `TO_NUMBER(REGEXP_SUBSTR({${options.fieldNameId}}, '^[0-9]+'))`,
                    summary: 'MAX'
                })
            ];
        }

        const setDataConfigEmployee = (curRec, options) => {
            let prefix = '', suffix = '';
            options.fieldNameId = 'entityid';
            const subId = curRec.getValue('subsidiary');
            options.subsidiary = subId;
            const subCode = subId ? (search.lookupFields({
                type: 'subsidiary',
                id: subId,
                columns: ['custrecord_scv_sub_code']
            })?.custrecord_scv_sub_code || '') : '';
            if (subCode) prefix += subCode;
            const hireDate = curRec.getValue('hiredate');
            if (hireDate) prefix += hireDate.getFullYear().toString().substring(2, 4);
            const firstName = curRec.getValue('firstname');
            const departmentId = curRec.getValue('department');
            const codeDepartment = departmentId ? (search.lookupFields({
                type: 'department',
                id: departmentId,
                columns: ['custrecord_scv_dep_short_name']
            })?.custrecord_scv_dep_short_name || '') : '';
            suffix += '_' + codeDepartment;
            suffix += '_' + firstName;
            options.prefix = prefix;
            options.delimiter = '';
            options.suffix = suffix;
            options.addFilter = [
                search.createFilter({name: 'subsidiary', operator: 'anyof', values: subId}),
                search.createFilter({
                    name: 'formulatext',
                    formula: `SUBSTR({${options.fieldNameId}}, 1, ${options.prefix.length + options.delimiter.length})`,
                    operator: 'is',
                    values: options.prefix + options.delimiter
                })
            ];
        };

        const afterSubmit = (scriptContext) => {
            const triggertype = scriptContext.type;
            const newRecord = scriptContext.newRecord;
            const recordType = newRecord.type;
            if (recordType === record.Type.SALES_ORDER) {
                setDocNumSO(newRecord, triggertype);
            }
        }

        const setDocNumSO = (newRecord, triggertype) => {
            if (triggertype === 'delete') return;
            const objDataSO = getDataSourceSO(newRecord);
            if (objDataSO === null) return;
            let arrStrDocNum = [
                objDataSO.yyDate,
                objDataSO.tranprefix,
                objDataSO.codeEntity,
                objDataSO.tranId,
                objDataSO.subsidiary
            ];
            if (objDataSO.strPhuLuc) {
                arrStrDocNum.push('-');
                arrStrDocNum.push(objDataSO.strPhuLuc);
            }
            const strDocNumXK = arrStrDocNum.join('');
            record.submitFields({
                type: 'salesorder',
                id: newRecord.id,
                values: {
                    custbody_scv_xk_hd: strDocNumXK
                },
                options: {
                    ignoreMandatoryFields: true
                }
            });
        }

        const getDataSourceSO = (newRecord) => {
            const channelSO = newRecord.getValue('cseg_scv_sc');
            const docXuatKhauSO = newRecord.getValue('custbody_scv_xk_hd');
            const CHANNEL_SO = {XUAT_KHAU: '2'};
            if (channelSO !== CHANNEL_SO.XUAT_KHAU || (docXuatKhauSO !== null && docXuatKhauSO !== '')) return null;
            const subsidiary = newRecord.getValue('subsidiary');
            const tranprefix = getTranPrefix(subsidiary);
            const entity = newRecord.getValue('entity');
            const tranId = search.lookupFields({
                type: search.Type.SALES_ORDER,
                id: newRecord.id,
                columns: ['tranid']
            }).tranid;
            const codeEntity = entity ? (search.lookupFields({
                type: getEntityType(entity),
                columns: ['custentity_scv_short_code'],
                id: entity
            })?.custentity_scv_short_code || '') : '';
            const dateSO = newRecord.getValue('trandate');
            const strPhuLuc = newRecord.getValue('custbody_scv_phu_luc');
            const yyDate = dateSO.getFullYear().toString().substr(2, 4);
            return {
                subsidiary: subsidiary,
                tranprefix: tranprefix,
                entity: entity,
                codeEntity: codeEntity,
                yyDate: yyDate,
                tranId: tranId,
                strPhuLuc: strPhuLuc
            }
        }

        const getTranPrefix = (subsidiaryId) => search.lookupFields({
            type: 'subsidiary',
            id: subsidiaryId,
            columns: ['tranprefix']
        })?.tranprefix || ''

        const getEntityType = (entity) => {
            let lkE = search.lookupFields({type: 'entity', id: entity, columns: ['recordtype']});
            return lkE.recordtype;
        }

        return {
            beforeLoad,    // set các ký tự thành TO BE GENERATED
            beforeSubmit,  // set ky tu cho entityid, so, sc
            afterSubmit    //  chỉ dùng để set cho SO
        }

    });
