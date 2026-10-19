/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record', 'N/ui/serverWidget'],
    (record, serverWidget) => {
        
        const onRequest = (context) => {
            let objTran = {
                "appliedtotransaction": "144467"
            }
            let recVendorPayment = record.transform({
                type: record.Type.VENDOR_PAYMENT,
                isDynamic: true
            });
            recVendorPayment.setValue('entity', '4203');
            recVendorPayment.setValue('subsidiary', '5');
            
            let slApply = 'apply';
            let applyCount = recVendorPayment.getLineCount({sublistId: slApply});
            let isSave = false;
            for (let i = 0; i < applyCount; i++) {
                let appliedToTransaction = recVendorPayment.getSublistValue({
                    sublistId: slApply,
                    fieldId: 'doc',
                    line: i
                });
                let isApply = appliedToTransaction === objTran.appliedtotransaction || appliedToTransaction === '144468';
                if (isApply) {
                    recVendorPayment.selectLine({sublistId: slApply, line: i});
                    recVendorPayment.setCurrentSublistValue({
                        sublistId: slApply,
                        fieldId: 'apply',
                        line: i,
                        value: isApply
                    });
                    isSave = isApply;
                    recVendorPayment.commitLine({sublistId: slApply});
                }
            }
            if (isSave) {
                recVendorPayment.save({
                    ignoreMandatoryFields: true
                });
            }
        };
        
        return {onRequest};
    });