/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record', 'N/search'],
    (record, search) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
           if(scriptContext.request.method === 'POST') {
                const recid = scriptContext.request.parameters.recid;
                const rectype = scriptContext.request.parameters.rectype;
                const arrItemPreviousPrice = getPreviousPrice(recid, rectype);
                scriptContext.response.write(JSON.stringify({arrItemPreviousPrice}));
            }
        }

        const getPreviousPrice = (recid, rectype) => {
            let rec = record.load({
                id: recid,
                type: rectype
            });
            let arrItemsId = getArrItemsId(rec);
            return getPreviousPriceByItem(arrItemsId, rec);
        }

        const getArrItemsId = (rec) => {
            let arrItemsId = [];
            let lineCount = rec.getLineCount({
                sublistId: 'item'
            });
            for(let i = 0; i < lineCount; i++) {
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
            let tranid = rec.getValue('tranid');
            let ssPreviousPrice = search.load({id: 'customsearch_scv_last_purchase_price'});
            let filters = ssPreviousPrice.filters;
            let columns = ssPreviousPrice.columns;
            // filters.push(search.createFilter({
            //     name: 'tranid',
            //     operator: search.Operator.IS,
            //     values: tranid
            // }));

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

        return {onRequest}

    });
