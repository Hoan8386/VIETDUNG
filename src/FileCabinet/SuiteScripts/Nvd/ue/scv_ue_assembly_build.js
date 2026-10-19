/**
 * Nội dung:
 * Key:
 * * =======================================================================================
 *  Date                Author                  Description
 *  ?                   ?                       ?
 *  25 Nov 2024         Huy Pham                Chức năng load default Các item phụ phẩm, thu hồi, from mr.Bính(https://app.clickup.com/t/86cx4wmbg)
 *  */
/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/format', 'N/record', 'N/search',
        '../cons/scv_cons_byproduct.js'
    ],
    (format, record, search, constByProduct) => {
        
        const beforeLoad = (scriptContext) => {
            let form = scriptContext.form;
            let tgType = scriptContext.type;
            let newRecord = scriptContext.newRecord;
            form.clientScriptModulePath = '../cs/scv_cs_assembly_build.js';
            if (['create', 'edit', 'copy'].indexOf(tgType) !== -1) {
                form.addButton({id: 'custpage_bt_calscrap', label: 'Cal Scrap', functionName: "calscrap()"});
                // form.addButton({id: 'custpage_bt_calaveragerate', label: "Cal Average Rate", functionName: "calAverageRate()"})
            } else if (tgType === 'view') {
                addButtonCreateInspectionSheet(form, newRecord);
                if (!!newRecord.getValue('location') && checkNhapPhuPham(newRecord) && isCreateIAFromAB(newRecord)) {
                    form.addButton({
                        id: 'custpage_bt_nhapphupham',
                        label: 'Nhập phụ phẩm',
                        functionName: "nhapphepham()"
                    });
                }
            }
        }
        
        const addButtonCreateInspectionSheet = (form, newRecord) => {
            const inspectionStart = newRecord.getValue('custbody_scv_inspection_started');
            const idInspectionSheet = newRecord.getValue('custbody_scv_insp_sheet');
            if (inspectionStart === 'F' || inspectionStart === false) return;
            if (idInspectionSheet) {
                const isInactiveInspectionSheet = search.lookupFields({
                    type: 'customrecord_scv_inspection_sheet',
                    id: idInspectionSheet,
                    columns: ['isinactive']
                }).isinactive
                if (!isInactiveInspectionSheet) return;
            }
            form.addButton({
                id: 'custpage_bt_mfg_inspection',
                label: 'Create Inspection Sheet',
                functionName: `createMFGInspection();`
            });
        }
        
        
        const isCreateIAFromAB = (newRecord) => {
            let valid = true;
            const f = [search.createFilter({
                name: 'custbody_scv_created_transaction',
                operator: search.Operator.ANYOF,
                values: newRecord.id
            })];
            const c = [{name: 'internalid'}]
            let s = search.create({type: 'inventoryadjustment', filters: f, columns: c});
            let r = s.run().getRange(0, 1);
            if (r.length > 0) valid = false;
            return valid;
        }
        
        const checkNhapPhuPham = (newRecord) => {
            const prefixQty = 'custbody_scv_byproduct_qty';
            let blNhap = false;
            for (let i = 1; i < 24; i++) {
                if (newRecord.getValue(prefixQty + i)) {
                    blNhap = true;
                    break;
                }
            }
            return blNhap;
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
            let triggerType = scriptContext.type;
            let newRecord = scriptContext.newRecord;
            
            if (triggerType !== 'delete') {
                calCharge(newRecord);
            }
            
            if (["create", "edit"].includes(triggerType)) {
                constByProduct.addLineDefaultOfRecord(newRecord);
            }
        }
        
        const updateInventyoryNumber = (newRecord) => {
            let mfg_date = newRecord.getValue('custbody_scv_mfg_date');
            if (mfg_date) {
                mfg_date = format.format({value: mfg_date, type: format.Type.DATE});
            }
            let recSubIvd = newRecord.getSubrecord('inventorydetail');
            let slIva = 'inventoryassignment';
            let lcIva = recSubIvd.getLineCount(slIva);
            for (let i = 0; i < lcIva; i++) {
                let numberedrecordid = recSubIvd.getSublistValue({
                    sublistId: slIva,
                    fieldId: 'numberedrecordid',
                    line: i
                });
                if (numberedrecordid) {
                    record.submitFields({
                        type: record.Type.INVENTORY_NUMBER,
                        id: numberedrecordid,
                        values: {
                            custitemnumber_aln_manufactured_date: mfg_date
                        }
                    });
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
        const afterSubmit = (scriptContext) => {
            let triggerType = scriptContext.type;
            if (triggerType === 'create' || triggerType === 'edit') {
                let newRecord = scriptContext.newRecord;
                if (newRecord.getValue('inventorydetailavail') === 'T') {
                    if(triggerType === 'create') {
                        //Load Again to get numberredrecordid
                        newRecord = record.load({type: newRecord.type, id: newRecord.id});
                    }
                    updateInventyoryNumber(newRecord);
                }
            }
        }
        
        const calCharge = (newRecord) => {
            const productCost = newRecord.getValue('custbody_scv_byproduct_cost');
            const slComp = 'component';
            const lcComp = newRecord.getLineCount(slComp);
            const currencyVNDId = "69";
            for (let i = 0; i < lcComp; i++) {
                const itemId = newRecord.getSublistValue({sublistId: slComp, fieldId: 'item', line: i});
                const typeItem = search.lookupFields({
                    type: search.Type.ITEM,
                    id: itemId,
                    columns: ["type"]
                }).type[0].value;
                const unitsCostVND = newRecord.getValue("units");
                const blRound = typeItem === "OthCharge" || unitsCostVND === currencyVNDId;
                const unitCost = newRecord.getSublistValue({
                    sublistId: slComp,
                    fieldId: 'unitcost',
                    line: i
                }).toString();
                let qtyUpd = newRecord.getSublistValue({sublistId: slComp, fieldId: 'quantity', line: i});
                if (unitCost === '-1') {
                    newRecord.setSublistValue({sublistId: slComp, fieldId: 'quantity', line: i, value: productCost});
                    qtyUpd = productCost;
                }
                if (blRound) newRecord.setSublistValue({
                    sublistId: slComp,
                    fieldId: 'quantity',
                    line: i,
                    value: Number(qtyUpd).toFixed(0)
                });
            }
        }
        
        return {
            beforeLoad,
            beforeSubmit,
            afterSubmit
        };
        
    });
