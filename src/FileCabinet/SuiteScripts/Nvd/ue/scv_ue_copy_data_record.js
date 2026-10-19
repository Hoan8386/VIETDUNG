/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/url',
        '../lib/scv_lib_function', '../olib/alasql/alasql.min@1.7.3.js'],
    
    (record, url,
     libFunc, alasql) => {
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
            let trigType = scriptContext.type;
            if (trigType === 'view') {
                const urlLinkRecord = url.resolveRecord({
                    recordId: null,
                    recordType: scriptContext.newRecord.type,
                    isEditMode: true,
                    params: {}
                }) + `&whence=&e=T&memdoc=0&cp=T&id=${scriptContext.newRecord.id}&makecopy=T&originid=${scriptContext.newRecord.id}`;
                let form = scriptContext.form;
                form.addButton({
                    id: 'custpage_make_copy',
                    label: 'Make Copy',
                    functionName: `window.location.replace('${urlLinkRecord}')`
                });
            } else if (['create', 'copy'].indexOf(trigType) !== -1) {
                const params = scriptContext.request?.parameters || {};
                setDataRecordClone(scriptContext.newRecord, params);
            }
        }
        
        const setDataRecordClone = (newRecord, params) => {
            if (params.makecopy !== 'T') return;
            const objConfigDataCopy = getObjConfigMakeCopy(newRecord);
            if (!objConfigDataCopy.isSuccess) return;
            const originRecordId = params.originid;
            if (!originRecordId) return;
            const recOriginRecord = record.load({type: newRecord.type, id: originRecordId});
            const {objBodyFields, objLineFields} = objConfigDataCopy;
            const arrFieldsNotCopy = objBodyFields.arrFieldsNotCopy;
            const numFldsNotCopy = arrFieldsNotCopy.length;
            for (let i = 0; i < numFldsNotCopy; i++) newRecord.setValue({fieldId: arrFieldsNotCopy[i], value: ''});
            const arrSublistId = Object.keys(objLineFields);
            
            // log.error("res", {objBodyFields, objLineFields})
            const numSublist = arrSublistId.length;
            for (let i = 0; i < numSublist; i++) {
                const sublistId = arrSublistId[i];
                const numLine = recOriginRecord.getLineCount({sublistId: sublistId});
                if (!Array.isArray(objLineFields[sublistId]) || objLineFields[sublistId].length === 0) continue;
                const arrFieldsLine = objLineFields[sublistId];
                const numFieldsLine = arrFieldsLine.length;
                for (let j = 0; j < numLine; j++) {
                    newRecord.insertLine({sublistId: sublistId, line: j});
                    for (let k = 0; k < numFieldsLine; k++) {
                        let value = recOriginRecord.getSublistValue({
                            sublistId: sublistId,
                            fieldId: arrFieldsLine[k],
                            line: j
                        });
                        if (value || value === 0) {
                            newRecord.setSublistValue({
                                sublistId: sublistId,
                                fieldId: arrFieldsLine[k],
                                value: value,
                                line: j
                            });
                        }
                    }
                }
            }
        }
        
        
        const getObjConfigMakeCopy = (newRecord) => {
            const recordType = newRecord.type;
            const arrDataConfigRecord = getDataRecordConfigMakeCopy(recordType);
            if (arrDataConfigRecord.length === 0) return {isSuccess: false};
            const arrDataSublistId = alasql(`SELECT DISTINCT sl_id
                                             FROM ?`, [arrDataConfigRecord]);
            let objDataSublist = {};
            const arrFieldsHeader = arrDataConfigRecord[0].flds?.split("|") || [];
            const arrFieldsNotCopy = arrDataConfigRecord[0].flds_not_copy?.split("|") || [];
            const lenSublist = arrDataSublistId.length;
            for (let i = 0; i < lenSublist; i++) {
                const sublistId = arrDataSublistId[i].sl_id;
                const arrDataSublist = alasql(`SELECT sl_id, sl_flds, sl_flds_not_copy, field_id
                                               FROM ?
                                               WHERE sl_id = ?`, [arrDataConfigRecord, sublistId]);
                const arrFieldsDefault = arrDataSublist.map(o => o.field_id);
                const arrFieldsCopyLine = arrDataSublist?.[0]?.sl_flds?.split("|") || [];
                const arrFieldsNotCopyLine = arrDataSublist?.[0]?.sl_flds_not_copy?.split("|") || [];
                let arrFieldsCopy = arrFieldsCopyLine.length ? arrFieldsCopyLine : arrFieldsDefault;
                if(arrFieldsNotCopyLine.length > 0) {
                    arrFieldsCopy = arrFieldsCopy.filter(fld => arrFieldsNotCopyLine.indexOf(fld) === -1);
                }
                objDataSublist[sublistId] = arrFieldsCopy;
            }
            
            return {
                isSuccess: true,
                objLineFields: objDataSublist,
                objBodyFields: {
                    arrFieldsCopy: arrFieldsHeader,
                    arrFieldsNotCopy: arrFieldsNotCopy
                }
            };
        }
        
        const getDataRecordConfigMakeCopy = (recordType) => {
            const sqlQuery = `
                SELECT t1.id,
                    LOWER(t1.custrecord_scv_ccr_recordtype)    AS    rec_id,
                    t1.custrecord_scv_ccr_cp_flds              AS    flds,
                    t1.custrecord_scv_ccr_not_cp_fld           AS    flds_not_copy,
                    t2.custrecord_scv_ccr_d_sublistid          AS    sl_id,
                    LOWER(t2.custrecord_scv_ccr_d_sublisttype) AS    sl_rectype,
                    LOWER(t2.custrecord_scv_ccr_d_flds)        AS    sl_flds,
                    LOWER(t2.custrecord_scv_ccr_d_not_flds)    AS    sl_flds_not_copy,
                    LOWER(t3.scriptid)                         AS    rec_type,
                    t3.internalid                              AS    rec_type_id,
                    t4.fieldvaluetype                          AS    field_type,
                    LOWER(t4.scriptid)                         AS    field_id
                FROM customrecord_scv_config_copy_rec t1
                LEFT JOIN customrecord_scv_config_copy_rec_det t2 ON t1.id = t2.custrecord_scv_ccr_d_parent
                LEFT JOIN CustomRecordType t3 ON LOWER(t2.custrecord_scv_ccr_d_sublisttype) = LOWER(t3.scriptid)
                LEFT JOIN CustomField t4 ON t3.internalid = t4.recordtype
                WHERE (t4.isshowinlist = 'T' or t4.isshowinlist is null)
                    AND (t4.isstored = 'T' or t4.isstored  is null)
                    AND t1.custrecord_scv_ccr_recordtype = ?
            `;
            const resultData = libFunc.callQuery(sqlQuery, [recordType]);
            return resultData.isSuccess ? resultData.response : [];
        }
        
        return {beforeLoad}
        
    });
