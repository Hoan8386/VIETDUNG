/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/search', 'N/record', '../lib/scv_lib_function'],

    (search, record, libFn) => {
        const CustomJob = {SPLIT: 'split'};
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
            setFixedAssetCode(scriptContext);
        }

        const setFixedAssetCode = (scriptContext) => {
            let triggerType = scriptContext.type;
            if (triggerType !== 'create') return;
            let newRecord = scriptContext.newRecord;
            const transId = newRecord.getValue('custrecord_propsourceid');
            if (!transId) return;
            const strJobType = newRecord.getValue('custrecord_propcreatedfrom');
            if (strJobType !== CustomJob.SPLIT) return;
            let lkTrans = search.lookupFields({type: libFn.getTranRecordType(transId), id: transId, columns: ['custbody_scv_fixed_asset_code']});
            const fixedAssetCode = lkTrans.custbody_scv_fixed_asset_code;
            const nextMaxNumber = getNextMaxNumberByPrefix({prefix: fixedAssetCode,});
            const fixedAssetCodeSequence = generateFixedAssetCodeSequence({prefix: fixedAssetCode, digit: 1, befDelim: '_'}, nextMaxNumber);
            newRecord.setValue('custrecord_scv_proposal_asset_code', fixedAssetCodeSequence);
        }

        const generateFixedAssetCodeSequence = (objDataConfig, maxNumber, counter = 1) => {
            if (counter === 5) return objDataConfig.prefix + '_null';
            const fixedAssetCodeSequence = getFixAssetCodeSequence(objDataConfig, maxNumber);
            if (createRecordDataFixedAssetCode(fixedAssetCodeSequence, objDataConfig.prefix, maxNumber)) {
                return fixedAssetCodeSequence
            }
            else {
                return generateFixedAssetCodeSequence(objDataConfig, maxNumber + 1, counter + 1);
            }
        }

        const createRecordDataFixedAssetCode = (fixedAssetCodeSequence, prefix, maxNumber) => {
            try {
                let rec = record.create({type: 'customrecord_scv_data_fixed_asset_code'});
                rec.setValue({fieldId: 'externalid', value: fixedAssetCodeSequence});
                rec.setValue({fieldId: 'name', value: fixedAssetCodeSequence});
                rec.setValue({fieldId: 'custrecord_scv_d_fac_prefix', value: prefix});
                rec.setValue({fieldId: 'custrecord_scv_d_fac_number', value: maxNumber});
                return rec.save({ignoreMandatoryFields: true});
            } catch (e) {
                log.error('error '.concat(fixedAssetCodeSequence), e);
                return null;
            }
        }

        const getFixAssetCodeSequence = (objDataConfig, maxNumber) => {
            const prefix = objDataConfig.prefix;
            const digit = objDataConfig.digit;
            const befDelim = objDataConfig.befDelim;
            const maxNumberStr = maxNumber.toString().padStart(digit, '0');
            return prefix + befDelim + maxNumberStr;
        }

        const getNextMaxNumberByPrefix = (objPrams) => {
            const prefix = objPrams.prefix;
            let searchObj = search.create({
                type: 'customrecord_scv_data_fixed_asset_code',
                columns: [
                    search.createColumn({name: 'custrecord_scv_d_fac_number', summary: 'MAX'}),
                    search.createColumn({name: 'custrecord_scv_d_fac_prefix', summary: 'GROUP'})
                ],
                filters: [
                    search.createFilter({name: 'custrecord_scv_d_fac_prefix', operator: search.Operator.IS, values: prefix}),
                    search.createFilter({name: 'isinactive', operator: search.Operator.IS, values: false})
                ]
            });
            let cols = searchObj.columns;
            let searchData = searchObj.run().getRange(0, 1);
            if (searchData.length) {
                const maxNumber = searchData[0].getValue(cols[0]) * 1 || 0;
                return maxNumber + 1;
            }
            return 1;
        }


        /**
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const afterSubmit = (scriptContext) => {

        }

        return {
            beforeLoad, beforeSubmit,
            afterSubmit
        }

    });
