/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

define([
    '../common/scv_common_line_no'
], function (
    comLineNo
) {

    const beforeSubmit = (scriptContext) => {
        let newRecord = scriptContext.newRecord;
        let triggerType = scriptContext.type;
        if (triggerType === "create" || triggerType === "edit") {
            switch (newRecord.type) {
                case  'custompurchase_scv_purchase_plan':
                case  'customsale_scv_ot_yc_xvt':
                case 'itemfulfillment':
                case 'salesorder':              
                case 'itemreceipt':
                case 'custompurchase_scv_purchase_request':
                case 'transferorder':
                    comLineNo.setLineNoCustomPurchase(newRecord, 'item');
                    break;
                case 'inventoryadjustment':
                    comLineNo.setLineNoCustomPurchase(newRecord, 'inventory');
                    break;
            }
        }
    };

    const afterSubmit = (scriptContext) => {
        let newRecord = scriptContext.newRecord;
        switch (newRecord.type) {
            case 'customrecord_scv_payment':
                comLineNo.setLineNoCustomRecord(newRecord, 'customrecord_scv_payment_detail','custrecord_scv_pay', 'custrecord_scv_pr_detail_line_no');
                break;
            case 'customrecord_scv_list_item_standard':
                comLineNo.setLineNoCustomRecord(newRecord, 'customrecord_scv_inp_item_stand', 'custrecordscv_inp_item_stand_list', 'custrecord_scv_no_line');
               break;
            case 'supportcase':
                comLineNo.setLineNoCustomRecord(newRecord, 'customrecord_scv_crm_related', 'custrecord_scv_crm_transaction', 'custrecord_scv_detail_line_no');
                break;
        }
    };

    return {
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    };
});



