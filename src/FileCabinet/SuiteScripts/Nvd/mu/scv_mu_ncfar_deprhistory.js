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
            let rec = record.load({type: params.type, id: params.id});
            
            let deprhistjournal = rec.getValue('custrecord_deprhistjournal');
            let isUpdate = false;
            if (!deprhistjournal) {
                let deprhisttype = rec.getValue('custrecord_deprhisttype');
                if (deprhisttype === '1') {
                    let deprhistasset = rec.getValue('custrecord_deprhistasset');
                    if (deprhistasset) {
                        let recAsset = record.load({type: 'customrecord_ncfar_asset', id: deprhistasset});
                        deprhistjournal = recAsset.getValue('custrecord_assetsourcetrn');
                    }
                    isUpdate = true;
                } else if (deprhisttype === '2') {
                    let name = rec.getValue('name');
                    if (name) {
                        let s = search.create({
                            type: 'customrecord_bg_summaryrecord',
                            filters: [['name', 'is', name]],
                            columns: ['internalid', 'custrecord_summary_histjournal']
                        });
                        let r = s.run().getRange({start: 0, end: 10});
                        if (r.length > 0) {
                            deprhistjournal = r[0].getValue('custrecord_summary_histjournal');
                        }
                    }
                    isUpdate = true;
                }
            } else {
                isUpdate = true;
            }
            
            if (isUpdate) {
                rec.setValue('custrecord_scv_dep_jn', deprhistjournal);
                rec.save({enableSourcing: false, ignoreMandatoryFields: true});
            }
            
        }
        
        return {
            each: each
        };
        
    });
