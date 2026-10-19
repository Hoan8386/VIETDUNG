/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search'],

    (record, search) => {
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
            const { type, newRecord } = scriptContext;
            if (!["create", "edit"].includes(type)) return;

            const defLocation = newRecord.getValue({ fieldId: 'custrecord_scv_mro_usage_def_location' });
            if (defLocation) return;

            const itemId = newRecord.getValue({ fieldId: 'custrecord_scv_mro_usage_comp' });
            const woId = newRecord.getValue({ fieldId: 'custrecord_scv_mro_usage_wo' });

            const parentLocWO = getParentLocationWO(woId);
            const matchingLocId = getMatchingItemLocation(itemId, parentLocWO);

            if (matchingLocId) {
                newRecord.setValue({
                    fieldId: 'custrecord_scv_mro_usage_def_location',
                    value: matchingLocId
                });
            }
        };

        const getParentLocationWO = (woId) => {
            const wo = record.load({ type: 'workorder', id: woId });
            const locId = wo.getValue({ fieldId: 'location' });
            if (!locId) return null;

            const loc = record.load({ type: 'location', id: locId });
            log.audit('Work Order WO Location', `Location WO ID: ${locId}`);
            return loc.getValue({ fieldId: 'parent' });
        };

        const getMatchingItemLocation = (itemId, parentLocWO) => {
            const itemFields = search.lookupFields({
                type: 'item',
                id: itemId,
                columns: ['custitem_scv_group_lv2']
            });

            const groupLv2Id = itemFields.custitem_scv_group_lv2?.[0]?.value;
            if (!groupLv2Id) return null;

            const groupLv2 = record.load({ type: 'customrecord_scv_group_level', id: groupLv2Id });
            const defaultLocs = groupLv2.getValue({ fieldId: 'custrecord_scv_default_loc' }) || [];

            for (const locId of defaultLocs) {
                const loc = record.load({ type: 'location', id: locId });
                const parent = loc.getValue({ fieldId: 'parent' });
                if (parent === parentLocWO) return locId;
            }

            return null;
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

        return {
            beforeLoad,
            beforeSubmit,
            afterSubmit
        }

    });
