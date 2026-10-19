/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/runtime'],
    
    function (runtime) {
        
        /**
         * Function to be executed after page is initialized.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
         *
         * @since 2015.2
         */
        function pageInit(scriptContext) {
            let uRLSearchParams = new URLSearchParams(window.location.search);
            if(uRLSearchParams.get('scbd_id')) {
                recmachcustrecord_scv_asset_transfer_machine?.clearline(true);
            }
        }
        
        /**
         * Function to be executed after line is selected.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @since 2015.2
         */
        function lineInit(scriptContext) {
            let uRLSearchParams = new URLSearchParams(window.location.search);
            if(uRLSearchParams.get('scbd_id')) {
                let sublistId = scriptContext.sublistId;
                if(sublistId === 'recmachcustrecord_scv_asset_transfer') {
                    let currentRecord = scriptContext.currentRecord;
                    let transfer_ass = currentRecord.getCurrentSublistValue({sublistId: sublistId, fieldId: 'custrecord_scv_asset_transfer_ass'});
                    if(!transfer_ass) {
                        let transfer_ass = runtime.getCurrentSession().get('assetTransferScbdId');
                        if(transfer_ass) {
                            currentRecord.setCurrentSublistValue({sublistId: sublistId, fieldId: 'custrecord_scv_asset_transfer_ass', value: transfer_ass});
                        }
                    }
                }
            }
            
        }
        
        return {
            pageInit: pageInit,
            lineInit: lineInit
        };
        
    });
