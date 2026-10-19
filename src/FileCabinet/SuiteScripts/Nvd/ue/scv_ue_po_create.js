/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/search', 'N/runtime', 'N/record'],

    (search, runtime, record) => {
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
        }

        const getPreviousPrice = (recPo) => {
            let arrItemsId = getArrItemsId(recPo);
            return getPreviousPriceByItem(arrItemsId, recPo);
        }

        const getArrItemsId = (rec) => {
            let arrItemsId = [];
            let lineCount = rec.getLineCount({
                sublistId: 'item'
            });
            for (let i = 0; i < lineCount; i++) {
                let itemId = rec.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    line: i
                });
                arrItemsId.push(itemId);
            }
            return arrItemsId;
        }

        const getPreviousPriceByItem = (arrItemsId, rec) => {
            let arrPrices = [];
            let ssPreviousPrice = search.load({id: 'customsearch_scv_last_purchase_price'});
            let filters = ssPreviousPrice.filters;
            let columns = ssPreviousPrice.columns;
            let idSubsidiary = rec.getValue('subsidiary');
            let idVendor = rec.getValue('entity');

            filters.push(search.createFilter({
                name: 'internalid', join: 'item',
                operator: search.Operator.ANYOF,
                values: arrItemsId
            }));

            filters.push(search.createFilter({
                name: 'currency',
                operator: search.Operator.IS,
                values: rec.getValue('currency'),
            }));

            filters.push(search.createFilter({
                name: 'subsidiary',
                operator: search.Operator.ANYOF,
                values: idSubsidiary
            }));

            if (idVendor) {
                filters.push(search.createFilter({
                    name: 'internalid',
                    join: 'vendor',
                    operator: search.Operator.ANYOF,
                    values: idVendor
                }));
            }

            let searchResult = ssPreviousPrice.run().getRange(0, 1000);
            searchResult.forEach(result => {
                let itemId = result.getValue(columns[3]);
                let previousPrice = result.getValue(columns[5]);
                let currency = result.getValue(columns[6]);
                arrPrices.push({
                    item: itemId,
                    previous_price: previousPrice,
                    currency: currency
                });
            });
            return arrPrices;
        }

        const setPreviousPriceToRecord = (recPo, arrItemValues) => {
            if (arrItemValues && arrItemValues.length > 0) {
                let lcItems = recPo.getLineCount("item");
                for (let i = 0; i < lcItems; i++) {
                    let itemId = recPo.getSublistValue("item", "item", i);
                    let item = arrItemValues.find(item => item.item === itemId);
                    let previousPrice = item ? item.previous_price : null;

                    if (previousPrice) {
                        // recPo.setSublistValue("item", "custcol_scv_old_price", parseFloat(previousPrice), i);
                        try {
                            recPo.setSublistValue({
                                sublistId: "item",
                                fieldId: "custcol_scv_old_price",
                                value: parseFloat(previousPrice),
                                line: i
                            });
                        } catch (error) {
                            log.error('Error setting sublist value', error.message);
                        }
                    }
                }
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
            let triggerType = scriptContext.type;
            let newRec = scriptContext.newRecord;

            if (triggerType === 'create' && runtime.executionContext !== runtime.ContextType.USER_INTERFACE) {
                let loadedRec = record.load({
                    type: newRec.type,
                    id: newRec.id
                });
                let arrItemValues = getPreviousPrice(loadedRec);
                setPreviousPriceToRecord(loadedRec, arrItemValues);
                loadedRec.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });
            }
        }

        return {
            // beforeLoad,
            // beforeSubmit,
            afterSubmit
        }

    });
