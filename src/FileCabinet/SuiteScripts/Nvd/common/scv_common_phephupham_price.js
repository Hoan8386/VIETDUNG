/**
 * @NApiVersion 2.1
 */
define(['N/record'],
    
    (record) => {
        
        const Sublist = {
            INVENTORY: 'inventory'
        }
        
        const updatePhephuphamPrice = (listItemOfIA) => {
            let recInventoryAjustment = record.load({
                type: record.Type.INVENTORY_ADJUSTMENT,
                id: listItemOfIA[0].internalid
            });
            let lcInvt = recInventoryAjustment.getLineCount({sublistId: Sublist.INVENTORY});
            let isSave = false;
            for (let i = 0; i < lcInvt; i++) {
                let itemId = recInventoryAjustment.getSublistValue({
                    sublistId: Sublist.INVENTORY,
                    fieldId: 'item',
                    line: i
                });
                let matchedItem = listItemOfIA.find(e => e.item === itemId);
                if (matchedItem) {
                    isSave = true;
                    recInventoryAjustment.setSublistValue({
                        sublistId: Sublist.INVENTORY,
                        fieldId: 'unitcost',
                        line: i,
                        value: matchedItem.item_giathuhoi
                    });
                }
            }
            if (isSave) {
               recInventoryAjustment.save({enableSourcing: false, ignoreMandatoryFields: true});
            }
        }
        
        return {updatePhephuphamPrice}
        
    });
