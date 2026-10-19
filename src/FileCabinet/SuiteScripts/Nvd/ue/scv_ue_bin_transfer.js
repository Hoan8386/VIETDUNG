/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/ui/serverWidget', 'N/search'],

    (serverWidget, search) => {
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
            let triggerType = scriptContext.type;
            if ([
                'edit', 'create'
            ].includes(triggerType)) {
                let cacheDataItem = triggerType === 'edit' ? getQtyOnHandItemByLocation(scriptContext.newRecord) : new Map();
                initializeForm(scriptContext.form, cacheDataItem);
            }
        };

        const getArrItemId = (curRec) => {
            let arrItemId = [];
            let lc = curRec.getLineCount({sublistId: 'inventory'});
            for (let i = 0; i < lc; i++) {
                arrItemId.push(curRec.getSublistValue({
                    sublistId: 'inventory',
                    fieldId: 'item',
                    line: i
                }));
            }
            return arrItemId;
        };

        const getQtyOnHandItemByLocation = (curRec) => {
            let arrItemId = getArrItemId(curRec);
            if (arrItemId.length === 0) return new Map();
            let location = curRec.getValue('location');
            let searchObj = search.load({id: 'customsearch_scv_check_onhand', type: 'inventorybalance',});
            searchObj.filters.push(search.createFilter({name: 'item', operator: 'anyof', values: arrItemId}));
            searchObj.filters.push(search.createFilter({name: 'location', operator: 'is', values: location}));
            let searchData = searchObj.run().getRange(0, 1000);
            let cols = searchObj.columns;
            let sz = searchData.length;
            let results = new Map();
            for (let i = 0; i < sz; i++) {
                results.set(searchData[i].getValue(cols[0]), searchData[i].getValue(cols[2]));
            }
            return results;
        };

        const initializeForm = (form, cacheDataItem) => {
            let sublist = form.getSublist({id: 'inventory'});
            let idFldQtyOnhand = 'custpage_scv_qtyonhand';
            sublist.addField({
                id: idFldQtyOnhand,
                type: serverWidget.FieldType.TEXT,
                label: 'Quantity Onhand'
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });
            initializeSublist(sublist, cacheDataItem, idFldQtyOnhand);
            form.addField({
                id: 'custpage_scv_inlinehtml',
                type: serverWidget.FieldType.INLINEHTML,
                label: 'Inline HTML'
            }).defaultValue = getContentScript();
        };

        const initializeSublist = (sublist, cacheDataItem, idFldQtyOnhand) => {
            let szItem = cacheDataItem.size;
            if (szItem === 0) return;
            for (let i = 0; i < szItem; i++) {
                let item = sublist.getSublistValue({id: 'item', line: i});
                if (item === '' || item === null || item === undefined) continue;
                if (!cacheDataItem.has(item)) continue;
                let qtyOnHand = cacheDataItem.get(item);4
                sublist.setSublistValue({
                    id: idFldQtyOnhand,
                    line: i,
                    value: qtyOnHand
                });
            }
        }

        const getContentScript = () => {
            return `<script type="text/javascript">
window.SCV = window.SCV || {};
window.SCV.cacheItem = {};
window.SCV.prefixItem = null;
(function () {
    function getQtyOnhand(itemId) {
        if (itemId === '' || itemId === null || itemId === undefined) return null;
        let urlCall = '/app/site/hosting/scriptlet.nl?script=customscript_scv_sl_get_qty_onhand&deploy=customdeploy_scv_sl_get_qty_onhand';
        let location = window.nlapiGetFieldValue('location');
        let objParams = { item : itemId, location : location };
        let resCall = window.nlapiRequestURL(urlCall, objParams);
        console.log(resCall)
        if (resCall.code !== 200) return null;
        let objRes = JSON.parse(resCall.getBody());
        return objRes.qtyonhand
    }
    
    function setLineOnHandItem(qty) {
        window.nlapiSetCurrentLineItemValue('inventory', 'custpage_scv_qtyonhand', qty);   
    }
   
    function handleRowFocusChange($row, isFocused) {
        const $input = $row.find('input[id^="hddn_item"]');
        if (isFocused) {
            let item = $input.val();
            if (item === window.SCV.prefixItem) return;
            let qtyOnHand = null;
            if (item === '' || item === null || item === undefined) {
                qtyOnHand = '';
                return;
            } else if (window.SCV.cacheItem.hasOwnProperty(item)) {
                qtyOnHand = window.SCV.cacheItem[item];
            } else {
                qtyOnHand = getQtyOnhand(item); 
                window.SCV.cacheItem[item] = qtyOnHand;
            }
            setLineOnHandItem(qtyOnHand);
            window.SCV.prefixItem = item;
        } else {
            $input.off('change'); 
        }
    }
    function scanAndAttach() {
        NS.jQuery('tr.uir-machine-row-focused').each(function () {
            handleRowFocusChange(NS.jQuery(this), true);
        });
    }

    const observer = new MutationObserver((mutationsList) => {
        mutationsList.forEach((mutation) => {
            NS.jQuery(mutation.target)
                .find('tr')
                .each(function () {
                    const $row = NS.jQuery(this);
                    if ($row.hasClass('uir-machine-row-focused')) {
                        handleRowFocusChange($row, true);
                    } else {
                        handleRowFocusChange($row, false);
                    }
                });
        });
    });

    const targetNode = document.body;
    observer.observe(targetNode, {
        attributes: true, // Observe attribute changes
        childList: true,  // Observe added or removed nodes
        subtree: true,    // Observe all descendants
        attributeFilter: ['class'], // Focus only on class changes
    });
    NS.jQuery(document).ready(scanAndAttach);
})();

            </script>`;
        }

        return {
            beforeLoad,
        }

    });
