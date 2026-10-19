/**
 * @NApiVersion 2.1
 * @NScriptType MassUpdateScript
 * @NModuleScope SameAccount
 */
define(['N/record'],
    
    (record) => {
        
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
                let amount = 0;
                for (let i = 0; i < lcInvt; i++) {
                    let quantiy = newRecord.getSublistValue({sublistId: slInvt, fieldId: 'adjustqtyby', line: i}) * 1;
                    if (quantiy < 0) {
                        // amount = amount + quantiy * (newRecord.getSublistValue({
                        //     sublistId: slInvt,
                        //     fieldId: 'unitcost',
                        //     line: i
                        // }) || 0);
                        amount = amount + Number(newRecord.getSublistValue({
                            sublistId: slInvt,
                            fieldId: 'invtdiffvalue',
                            line: i
                        }) || 0);//quantiy * (newRecord.getSublistValue({sublistId: slInvt, fieldId: 'unitcost', line: i}) || 0);
                    } else if (quantiy > 0) {
                        newRecord.setSublistValue({
                            sublistId: slInvt,
                            fieldId: 'unitcost',
                            line: i,
                            value: (amount / quantiy) * -1
                        });
                        updateFlag = true;
                        amount = 0;
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

