/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define([
        'N/search',
        '../cons/scv_cons_entity_category_type.js'
    ],

    (
        search,
        constECT
    ) => {
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
            try {
                genCustomerCode(scriptContext);
            } catch (error) {
                log.error('beforeSubmit - error', error)
            }

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


        const genCustomerCode = (scriptContext) => {
            let triggerType = scriptContext.type;
            if (!['create', 'edit'].includes(triggerType)) return;
            let newRec = scriptContext.newRecord;
            let oldRec = scriptContext.oldRecord;
            if (triggerType === 'edit') {
                let newEntityCategory = newRec.getValue('custentity_scv_entity_category');
                let oldEntityCategory = oldRec.getValue('custentity_scv_entity_category');
                let newCompanyName = newRec.getValue('companyname');
                let oldCompanyName = oldRec.getValue('companyname');
                let blChangedVendorCategory = isChangedValue(newEntityCategory, oldEntityCategory);
                let blChangedCompanyName = isChangedValue(newCompanyName, oldCompanyName);
                if (!blChangedCompanyName && !blChangedVendorCategory) return;
                else if (blChangedCompanyName && !blChangedVendorCategory) {
                    setNameId(newRec);
                    return;
                }
            }
            let entityCategory = newRec.getValue('custentity_scv_entity_category');
            let objEntCat = getDataEntityCategory(entityCategory);
            let entityCategoryCode = objEntCat.entityCategoryCode;
            if (!entityCategoryCode) return;
            let sequence = searchSequenceCustomerCode(entityCategoryCode);
            sequence = sequence.toString().padStart(4, '0');
            const vendorCode = entityCategoryCode + sequence;
            newRec.setValue('custentity_scv_vendor_code', vendorCode);
            setNameId(newRec);
        }

        const getDataEntityCategory = (id) => {
            if (!id) return {};
            let lkEntityCategory = search.lookupFields({
                type: 'customrecord_scv_entity_category', id: id,
                columns: ['custrecord_scv_entity_category_type', 'custrecord_scv_entity_category_code']
            });
            let categoryType = lkEntityCategory.custrecord_scv_entity_category_type?.[0]?.value;
            if (categoryType != constECT.RECORDS.CUSTOMER.ID) return {};
            return {
                entityCategoryCode: lkEntityCategory.custrecord_scv_entity_category_code || ''
            }
        }

        const searchSequenceCustomerCode = (code) => {
            let filters = [], columns = [];
            filters.push(search.createFilter({
                name: 'formulatext',
                formula: `SUBSTR({custentity_scv_vendor_code}, 1, ${code.length})`,
                operator: 'is',
                values: code
            }));
            columns.push({
                name: 'formulanumeric',
                formula: `TO_NUMBER(SUBSTR({custentity_scv_vendor_code}, ${code.length + 1}))`,
                summary: 'MAX'
            })
            let searchObj = search.create({
                type: 'customer',
                filters: filters,
                columns: columns
            });
            let searchResults = searchObj.run().getRange(0, 1);
            let result = 0;
            if (searchResults.length) {
                result = searchResults[0].getValue(columns[0]) * 1;
            }
            return result + 1;
        }

        const setNameId = (curRec) => {
            let vendorCode = curRec.getValue('custentity_scv_vendor_code');
            let companyname = curRec.getValue('companyname');
            curRec.setValue('entityid', vendorCode + '_' + companyname);
        }

        const isChangedValue = (val1, val2) => val1 !== val2;

        return {
            beforeLoad,
            beforeSubmit,
            // afterSubmit
        }

    });
