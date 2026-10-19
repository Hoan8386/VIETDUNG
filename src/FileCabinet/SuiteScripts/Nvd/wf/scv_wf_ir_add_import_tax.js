/**
 * @NApiVersion 2.1
 * @NScriptType workflowactionscript
 */
define(['N/search', '../lib/scv_lib_report.js'],
    
    (search, libRep) => {
        
        /**
         * Definition of the Suitelet script trigger point.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @Since 2016.1
         */
        const onAction = (scriptContext) => {
            let costid_tnk = getCostategory();
            if (!!costid_tnk) {
                let recUp = scriptContext.newRecord;
                let slIt = 'item', slLine = 'landedcostdata', tracklandedcost;
                let lcIt = recUp.getLineCount(slIt);
                let exchangerate = recUp.getValue('exchangerate') || 1;
                for (let j = 0; j < lcIt; j++) {
                    tracklandedcost = recUp.getSublistValue({sublistId: slIt, fieldId: 'tracklandedcost', line: j});//landedcostset
                    if (tracklandedcost === true || tracklandedcost === 'T') {
                        let import_tax_amt = recUp.getSublistValue({
                            sublistId: slIt,
                            fieldId: 'custcol_scv_inb_importtax_amount',
                            line: j
                        });
                        recUp.selectLine({sublistId: slIt, line: j});
                        let recLdc = recUp.getCurrentSublistSubrecord({sublistId: slIt, fieldId: 'landedcost'});
                        if (!!recLdc) {
                            let lcLine = recLdc.getLineCount(slLine);//log.error('slLine', slLine);
                            setLineLdc(recLdc, lcLine, slLine, costid_tnk, (import_tax_amt / exchangerate).toFixed(2) * 1);
                            recUp.commitLine({sublistId: slIt});
                        }
                    }
                }
            }
        }
        
        const setLineLdc = (recLdc, lcLine, slLine, costcategory, amount) => {
            let lineup = -1, costcategory_line;
            for (let n = 0; n < lcLine; n++) {
                costcategory_line = recLdc.getSublistValue({sublistId: slLine, fieldId: 'costcategory', line: n});
                if (costcategory === costcategory_line) {
                    lineup = n;
                }
            }
            if (amount !== 0) {
                if (lineup === -1) {
                    recLdc.selectNewLine({sublistId: slLine});
                    recLdc.setCurrentSublistValue({sublistId: slLine, fieldId: 'costcategory', value: costcategory});
                    lcLine = lcLine + 1;
                } else {
                    recLdc.selectLine({sublistId: slLine, line: lineup});
                }
                recLdc.setCurrentSublistValue({sublistId: slLine, fieldId: 'amount', value: amount});
                recLdc.commitLine({sublistId: slLine});
            } else if (lineup !== -1) {
                recLdc.removeLine({sublistId: slLine, line: lineup});
                lcLine = lcLine - 1;
            }
            return lcLine;
        }
        
        const getCostategory = () => {
            let list_cost = [];
            let columns_cost = ['internalid', 'name'];
            let fields_cost = ['internalid', 'name'];
            let filters_cost = [search.createFilter({name: 'isinactive', operator: 'is', values: false})];
            libRep.doSearch('costcategory', list_cost, columns_cost, fields_cost, filters_cost);
            let costid_mhqt = null, costid_mhtn = null, costid_tnk = null, temp;
            for (let i in list_cost) {
                temp = list_cost[i].name.substring(0, 2);
                if (temp === '01') {
                    costid_mhqt = list_cost[i].internalid;
                } else if (temp === '02') {
                    costid_mhtn = list_cost[i].internalid;
                } else if (temp === '03') {
                    costid_tnk = list_cost[i].internalid;
                }
            }
            return costid_tnk;
        }
        
        return {
            onAction
        };
        
    });
