/**
 /**
 * @NApiVersion 2.1
 * @NScriptType MassUpdateScript
 */
define(['../common/scv_common_inventory_number.js'],
    
    (cmInvNumber) => {
        /**
         * Defines the Mass Update trigger point.
         * @param {Object} params
         * @param {string} params.type - Record type of the record being processed
         * @param {number} params.id - ID of the record being processed
         * @since 2016.1
         */
        const each = (params) => {
            cmInvNumber.updateInventoryNumber(params.id);
        }
        
        return {each}
        
    });
