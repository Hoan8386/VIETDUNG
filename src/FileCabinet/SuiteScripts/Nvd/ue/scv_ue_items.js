/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['../lib/scv_lib_gen_upccode', '../lib/scv_lib_function', 'N/record', 'N/runtime'],

    (lgu, lfn, record, runtime) => {
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
            try {
                let newRecord = scriptContext.newRecord;
                let triggerType = scriptContext.type;
                if (triggerType === 'create' || triggerType === 'copy') {
                    newRecord.setValue('itemid', 'TO BE GENERATED');
                    newRecord.setValue('upccode', '');
                }
                if (triggerType !== 'view') {
                    scriptContext.form.getField('itemid')?.updateDisplayType({displayType: 'disabled'});
                }
            } catch (e) {
                log.error('beforeLoad', e);
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
            let newRecord = scriptContext.newRecord;
            let triggerType = scriptContext.type;
            if (triggerType === 'create') {
                addBOMFromItemParentForItem(newRecord);
            } else if (triggerType === 'edit') {
                const parentNew = newRecord.getValue('parent');
                const parentOld = scriptContext.oldRecord.getValue('parent');
                // log.debug('check : ', {
                //     parentNew,
                //     parentOld
                // });
                if (parentNew !== parentOld) {
                    removeBomItem(newRecord);
                    addBOMFromItemParentForItem(newRecord);
                }
            }
            generateDataItem(scriptContext);
        }
        const isExecuteMapReduce = () => {
            return runtime.executionContext === runtime.ContextType.MAP_REDUCE;
        };

        const generateDataItem = (scriptContext) => {
            if (isExecuteMapReduce()) return;
            let newRecord = scriptContext.newRecord;
            let triggerType = scriptContext.type;
            if (triggerType === 'delete') {
                lgu.deleteRelatedUPCCode(scriptContext.oldRecord.getValue('upccode'));
            } else if (triggerType === 'create' || triggerType === 'edit') {
                const customformId = newRecord.getValue('customform');
                if (lgu.validFormGenerateUPCCode(customformId) && (triggerType === 'create' || lgu.isChangeFieldsRelatedWithMakeUPCCode(scriptContext))) {
                    const objDataUPCCodeItems = lgu.getDataUPCCodeItems(newRecord);
                    if (!objDataUPCCodeItems.isSuccess) {
                        throw objDataUPCCodeItems.msg;
                    }
                    if (triggerType === 'edit' && !!objDataUPCCodeItems.upccode) lgu.deleteRelatedUPCCode(scriptContext.oldRecord.getValue('upccode'));
                    if (objDataUPCCodeItems.displayname) newRecord.setValue('displayname', objDataUPCCodeItems.displayname);
                    if (objDataUPCCodeItems.upccode) newRecord.setValue('upccode', objDataUPCCodeItems.upccode);
                    if (objDataUPCCodeItems.itemid) newRecord.setValue('itemid', objDataUPCCodeItems.itemid);
                } else if (triggerType === 'edit') {
                    let resultDisplayName = lgu.getNewDisplayName(newRecord, scriptContext.oldRecord);
                    if (resultDisplayName.isChanged) {
                        let upcCode = newRecord.getValue('upccode');
                        newRecord.setValue('displayname', resultDisplayName.displayName);
                        newRecord.setValue('itemid', upcCode + '_' + resultDisplayName.displayName);
                    }
                }
            }
        }

        const removeBomItem = (curRec) => {
            if (!isItemTypeAddBOM(curRec.type)) return;
            const SUBLIST_BOM = 'billofmaterials';
            while (curRec.getLineCount(SUBLIST_BOM) > 0) {
                curRec.removeLine({sublistId: 'billofmaterials', line: 0});
            }
        };

        const addBOMFromItemParentForItem = (newRec) => {
            const SUBLIST_BOM = 'billofmaterials';
            if (!isItemTypeAddBOM(newRec.type)) return;
            const parentItemId = newRec.getValue('parent');
            if (!parentItemId) return;
            let recParent = record.load({
                type : lfn.getItemRecordType(parentItemId),
                id : parentItemId
            });
            const lcBom = recParent.getLineCount(SUBLIST_BOM);
            const arrCols = ['billofmaterials', 'canbedefaultforlocation', 'canbemaster', 'currentrevision', 'masterdefault'];
            for (let i = 0; i < lcBom; i++) {
                newRec.insertLine({sublistId: SUBLIST_BOM, line: i});
                lfn.setSublistValue(newRec, recParent, SUBLIST_BOM, SUBLIST_BOM, arrCols, arrCols, i);
                let locId = recParent.getSublistValue({sublistId: SUBLIST_BOM, fieldId : 'defaultforlocation', line: i});
                locId.length ? newRec.setSublistValue({sublistId: SUBLIST_BOM, fieldId : 'defaultforlocation', line: i, value: locId}) : '';
            }
        };

        const isItemTypeAddBOM = (itemType) => {
            return [
                record.Type.ASSEMBLY_ITEM,
                record.Type.LOT_NUMBERED_ASSEMBLY_ITEM,
            ].indexOf(itemType) !== -1;
        };


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


        return {beforeLoad, beforeSubmit, afterSubmit}

    });
