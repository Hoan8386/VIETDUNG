/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([],

    () => {
        const fieldChanged = (scriptContext) => {
            if (!['companyname', 'custentity_scv_vendor_code'].includes(scriptContext.fieldId)) return;

            setEntityId(scriptContext.currentRecord);
        }

        const setEntityId = (curRec) => {
            const vendorCode = curRec.getValue({ fieldId: 'custentity_scv_vendor_code' }) || '';
            const companyName = curRec.getValue({ fieldId: 'companyname' }) || '';
            const entityId = vendorCode && companyName ? vendorCode + '_' + companyName : vendorCode || companyName;

            curRec.setValue({
                fieldId: 'entityid',
                value: entityId,
                ignoreFieldChange: true
            });
        }

        return {
            fieldChanged
        }
    });
