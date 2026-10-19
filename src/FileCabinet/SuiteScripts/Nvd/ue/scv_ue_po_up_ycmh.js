/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', '../lib/scv_lib_function.js'],
    
    (record, search, lbf) => {
        
        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type
         * @param {Form} scriptContext.form - Current form
         * @Since 2015.2
         */
        const beforeLoad = (scriptContext) => {
            let tgType = scriptContext.type;
            if (tgType === 'copy') {
                let sl = 'item';
                let newRecord = scriptContext.newRecord;
                let lc = newRecord.getLineCount(sl);
                let nLineField = ['custcol_scv_pur_requisition'], nLineData = ['']
                for (let i = 0; i < lc; i++) {
                    lbf.setSublistValueData(newRecord, sl, nLineField, i, nLineData);
                }
                
            }
        }
        
        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type
         * @Since 2015.2
         */
        const beforeSubmit = (scriptContext) => {
        
        }
        
        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type
         * @Since 2015.2
         */
        const afterSubmit = (scriptContext) => {
            // let tgType = scriptContext.type;
            // let oldRecord = scriptContext.oldRecord;
            // let sl = 'item';
            // let listObjPr = [];
            // if(tgType === 'delete' || tgType === 'edit') {
            // 	addQuantity(oldRecord, sl, listObjPr, 1);
            // }
            // for(let objPr of listObjPr) {
            // 	objPr.lineSelect = [];
            // }
            // if(tgType === 'edit') {
            // 	let newRecord = scriptContext.newRecord;
            // 	addQuantity(newRecord, sl, listObjPr, -1);
            // }
            // for(let objPr of listObjPr) {
            // 	objPr.recPR.save({enableSourcing: true, ignoreMandatoryFields : true});
            // }
        }
        
        const addQuantity = (oldRecord, sl, listOBJ, sign) => {
            let lc = oldRecord.getLineCount(sl);
            let pur_requisition, quantity, item, objTemp, recPR, pr_date, requisition_line;
            for (let i = 0; i < lc; i++) {
                pur_requisition = oldRecord.getSublistValue({
                    sublistId: sl,
                    fieldId: 'custcol_scv_pur_requisition',
                    line: i
                });
                requisition_line = oldRecord.getSublistValue({
                    sublistId: sl,
                    fieldId: 'custcol_scv_pur_requisition_line',
                    line: i
                });
                quantity = oldRecord.getSublistValue({sublistId: sl, fieldId: 'quantity', line: i}) * 1;
                item = oldRecord.getSublistValue({sublistId: sl, fieldId: 'item', line: i});
                pr_date = oldRecord.getSublistText({sublistId: sl, fieldId: 'custcol_scv_po_pr_date', line: i});
                if (lbf.isContainValue(pur_requisition)) {
                    objTemp = listOBJ.find(o => o.id === pur_requisition) || {};
                    if (objTemp.id === undefined) {
                        recPR = record.load({type: 'customrecord_scv_pur_requisition', id: pur_requisition});
                        objTemp.id = pur_requisition;
                        objTemp.recPR = recPR;
                        objTemp.lineSelect = [];
                        listOBJ.push(objTemp);
                    } else {
                        recPR = objTemp.recPR;
                    }
                    setPOQuantity(recPR, item, quantity * sign, pr_date, requisition_line, objTemp.lineSelect);
                }
            }
        }
        
        const setPOQuantity = (recPR, item, quantity, pr_date, requisition_line, lineSelect) => {
            let slPR = 'recmachcustrecord_scv_pur_req';
            let lcPR = recPR.getLineCount(slPR);
            for (let j = 0; j < lcPR; j++) {
                let lineid = recPR.getSublistValue({sublistId: slPR, fieldId: 'id', line: j});
                let poquantity = recPR.getSublistValue({
                    sublistId: slPR,
                    fieldId: 'custrecord_scv_pr_poquantity',
                    line: j
                }) * 1;
                let itemcode = recPR.getSublistValue({sublistId: slPR, fieldId: 'custrecord_scv_pr_itemcode', line: j});
                let need_date = recPR.getSublistText({
                    sublistId: slPR,
                    fieldId: 'custrecord_scv_req_need_date',
                    line: j
                });
                if (lineid === requisition_line || (itemcode === item && pr_date === need_date && lineSelect.indexOf(j) === -1)) {
                    lineSelect.push(j);
                    if (poquantity - quantity >= 0) {
                        recPR.setSublistValue({
                            sublistId: slPR,
                            fieldId: 'custrecord_scv_pr_poquantity',
                            line: j,
                            value: poquantity - quantity
                        });
                    } else {
                        recPR.setSublistValue({
                            sublistId: slPR,
                            fieldId: 'custrecord_scv_pr_poquantity',
                            line: j,
                            value: 0
                        });
                        quantity = quantity - poquantity;
                    }
                }
            }
        }
        
        return {
            beforeLoad,
            beforeSubmit,
            afterSubmit
        };
        
    });
