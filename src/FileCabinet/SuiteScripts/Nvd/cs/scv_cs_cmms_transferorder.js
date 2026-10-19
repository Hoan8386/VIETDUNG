/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([],

function() {
    
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
        if(scriptContext.mode === 'create') {
            const queryString = window.location.search;
            const urlParams = new URLSearchParams(queryString);
            if(isCreateFromScbdWithParam(urlParams)) {
                item_machine.clearline();
                const currentRecord = scriptContext.currentRecord;
                currentRecord.setValue('location', urlParams.get('cmms_materiallocation'));
                currentRecord.setValue('transferlocation', urlParams.get('cmms_maintenancelocation'));
            }
        }
    }
    
    const isCreateFromScbdWithParam = (urlParams) => {
        const cmms_wo_action = urlParams.get('cmms_wo_action');
        const scbd_id = urlParams.get('scbd_id');
        const khbd_id = urlParams.get('khbd_id');
        return !!(cmms_wo_action === 'transferorder' && (scbd_id || khbd_id));
    }

    return {
        pageInit: pageInit
    };
    
});
