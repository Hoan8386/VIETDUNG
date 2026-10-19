/**
 * @NApiVersion 2.1
 * @NScriptType MassUpdateScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search'],
    
    (record, search) => {
        
        /**
         * Definition of Mass Update trigger point.
         *
         * @param {Object} params
         * @param {string} params.type - Record type of the record being processed by the mass update
         * @param {number} params.id - ID of the record being processed by the mass update
         *
         * @since 2016.1
         */
        const each = (params) => {
            eachProcess(params);
        }
        
        /**
         * @param {Object} params
         * @param {string} params.type - Record type of the record being processed by the mass update
         * @param {number} params.id - ID of the record being processed by the mass update
         */
        const eachProcess = (params) => {
            try {
                let newRecord = record.load({type: params.type, id: params.id});
                let slInvt = 'inventory';
                let lcInvt = newRecord.getLineCount(slInvt);
                let updateFlag = false;
                for (let i = 0; i < lcInvt; i++) {
                    let quantiy = newRecord.getSublistValue({sublistId: slInvt, fieldId: 'adjustqtyby', line: i}) * 1;
                    if (quantiy > 0) {
                        let item = newRecord.getSublistValue({sublistId: slInvt, fieldId: 'item', line: i});
                        let lkItem = search.lookupFields({
                            type: search.Type.ITEM,
                            id: item,
                            columns: ['custitem_scv_ia_return_price']
                        });
                        let unitcost = lkItem.custitem_scv_ia_return_price;
                        if (unitcost || unitcost === 0) {
                            newRecord.setSublistValue({
                                sublistId: slInvt,
                                fieldId: 'unitcost',
                                line: i,
                                value: unitcost
                            });
                            updateFlag = true;
                        }
                    }
                }
                
                if (updateFlag) {
                    newRecord.save({enableSourcing: false, ignoreMandatoryFields: true});
                }
            } catch (e) {
                log.error('eachProcess error', JSON.stringify(e));
            }
        }
        
        return {
            each
        };
        
    });
