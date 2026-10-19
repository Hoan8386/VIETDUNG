/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/url', '../lib/scv_lib_function.js'],

     (record, search, url, lbf) => {
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
            let newRecord = scriptContext.newRecord;
            let recType = newRecord.type;
            let tgType = scriptContext.type;
            let form = scriptContext.form;
            if (tgType === 'view') {
                if (recType === record.Type.WORK_ORDER) {
                    let approval_status = newRecord.getValue('custbody_scv_approval_status').toString();
                    let status = newRecord.getValue('status');//(status == 'Released' || status == 'In Process') &&
                    if ((approval_status === '3')) {
                        addButtonIT(form, newRecord.id, recType, newRecord.getValue('subsidiary'), newRecord.getValue('location'));
                        addButtonTM(form, newRecord.id, recType, newRecord.getValue('subsidiary'), newRecord.getValue('location'), newRecord.getValue('transferlocation'));
                        if (status === 'Built' || status === 'In Process') {
                            addButtonCCD(form, newRecord.id, recType, newRecord.getValue('subsidiary'), newRecord.getValue('location'));
                        }
                    }
                    addButtonCreateChildWo(form, newRecord);
                } else if (recType === record.Type.ITEM_RECEIPT) {
                    addButtonIT(form, newRecord.id, recType, newRecord.getValue('subsidiary'), newRecord.getValue('transferlocation'), newRecord.getValue('location'));
                }
            } else if (tgType === 'create') {
                if (recType === record.Type.INVENTORY_TRANSFER) {
                    let request = scriptContext.request;
                    if (!lbf.isContainValue(request)) {
                        return;
                    }
                    let param = request.parameters;
                    if (lbf.isContainValue(param)) {
                        let fromId = param.createdfromid;
                        let fromType = param.createdrectype;
                        let fromLocation = param.location;
                        let fromClass = param.classv;
                        let fromOperation = param.operation;
                        let isbuilt = param.isbuilt;
                        let quantity = param.quantity;
                        if (lbf.isContainValue(fromId) && lbf.isContainValue(fromType) && lbf.isContainValue(fromLocation)) {
                            form.addButton({
                                id: 'custpage_bt_back',
                                label: 'Back',
                                functionName: 'window.history.back();'
                            });
                            let fromRec = record.load({type: fromType, id: fromId});
                            let newFields = ['subsidiary', 'class', 'custbody_scv_assembly_qty', 'transferlocation', 'cseg_scv_seg_sc', 'cseg_scv_sg_proj', 'custbody_scv_to_wo_uom'];
                            let readFields = ['subsidiary', 'class', 'quantity', 'location', 'cseg_scv_seg_sc', 'cseg_scv_sg_proj', 'units'];
                            if (fromType === record.Type.ITEM_RECEIPT) {
                                newFields = ['subsidiary', 'class', 'custbody_scv_assembly_qty', 'cseg_scv_seg_sc', 'cseg_scv_sg_proj', 'custbody_scv_to_wo_uom'];
                                readFields = ['subsidiary', 'class', 'quantity', 'cseg_scv_seg_sc', 'cseg_scv_sg_proj', 'units'];
                            }
                            lbf.setValueData(newRecord, ['custbody_scv_work_order_no'], [fromId]);
                            let slItem = 'item';
                            let slInv = 'inventory';
                            let newSublistFields = ['item', 'adjustqtyby', 'units', 'binitem', 'isserial', 'inventorydetailavail', 'isnumbered',
                                'locationusesbins', 'tolocationusesbins', 'custcol_scv_inventory_transfer_class', 'olditem',
                                'description', 'custcol_scv_qty_content_per', 'custcol_scv_bom_qty'];
                            if (!lbf.isContainValue(isbuilt)) {
                                lbf.setValue(newRecord, fromRec, newFields, readFields);
                                let lCFrom = fromRec.getLineCount(slItem);
                                let readSublistFields = ['item', 'quantity', 'units', 'binitem', 'isserial', 'inventorydetailavail', 'isnumbered',
                                    'locationusesbins', 'locationusesbins', 'class', 'olditemid',
                                    'description', 'custcol_scv_qty_content_per', 'bomquantity'];
                                let classv = '';
                                if (lbf.isContainValue(fromClass)) {
                                    classv = fromClass.split(';');
                                }
                                let operation = '';
                                if (lbf.isContainValue(fromOperation)) {
                                    operation = fromOperation.split(';');
                                }
                                let j = 0, itemreceive, inspect_status;
                                let temp, temp1, itemtype, bom_std_qty;
                                let wo_quantity = fromRec.getValue('quantity');
                                for (let i = 0; i < lCFrom; i++) {
                                    if (fromType === record.Type.ITEM_RECEIPT) {
                                        itemreceive = fromRec.getSublistValue({
                                            sublistId: slItem,
                                            fieldId: 'itemreceive',
                                            line: i
                                        });
                                        inspect_status = fromRec.getSublistValue({
                                            sublistId: slItem,
                                            fieldId: 'custcol_scv_inspect_status',
                                            line: i
                                        });
                                    } else {
                                        itemreceive = true;
                                        inspect_status = 5;
                                    }
                                    temp = fromRec.getSublistValue({sublistId: slItem, fieldId: 'class', line: i});
                                    temp1 = fromRec.getSublistValue({
                                        sublistId: slItem,
                                        fieldId: 'operationsequencenumber',
                                        line: i
                                    });
                                    itemtype = fromRec.getSublistValue({
                                        sublistId: slItem,
                                        fieldId: 'itemtype',
                                        line: i
                                    });
                                    if ((!lbf.isContainValue(fromClass) || lbf.isExists(classv, temp)) && (itemtype === 'InvtPart' || itemtype === 'Assembly')
                                        && (convertToValueBolean(itemreceive)) && inspect_status.toString() === '5') {
                                        if (!lbf.isContainValue(fromOperation)|| lbf.isExists(operation, temp1)) {
                                            newRecord.insertLine({sublistId: slInv, line: j});
                                            lbf.setSublistValueDiff(newRecord, fromRec, slInv, slItem, newSublistFields, readSublistFields, j, i);
                                            if (lbf.isContainValue(quantity)) {
                                                bom_std_qty = fromRec.getSublistValue({
                                                    sublistId: slItem,
                                                    fieldId: 'quantity',
                                                    line: i
                                                }) / wo_quantity;
                                                newRecord.setSublistValue({
                                                    sublistId: slInv,
                                                    fieldId: 'adjustqtyby',
                                                    line: j,
                                                    value: bom_std_qty * quantity
                                                });
                                            }
                                            j++;
                                        }
                                    }
                                }
                            } else {
                                let newSublistFields = ['item', 'units', 'adjustqtyby', 'custcol_scv_inventory_transfer_class', 'binitem'
                                    , 'inventorydetailavail', 'description', 'locationusesbins'];
                                newFields[3] = 'location';
                                lbf.setValue(newRecord, fromRec, newFields, readFields);
                                let slLink = 'links';
                                let lcLink = fromRec.getLineCount(slLink);
                                let quantity = 0, lkT, recT;
                                for (let i = 0; i < lcLink; i++) {
                                    if (fromRec.getSublistValue({
                                        sublistId: slLink,
                                        fieldId: 'linkurl',
                                        line: i
                                    }) === '/app/accounting/transactions/wocompl.nl?whence=') {
                                        lkT = search.lookupFields({
                                            type: 'transaction',
                                            id: fromRec.getSublistValue({sublistId: slLink, fieldId: 'id', line: i})
                                            ,
                                            columns: ['recordtype']
                                        });
                                        recT = record.load({
                                            type: lkT.recordtype,
                                            id: fromRec.getSublistValue({sublistId: slLink, fieldId: 'id', line: i})
                                        })
                                        quantity = quantity + recT.getValue('completedquantity') * 1;
                                    }
                                }
                                //newRecord.setValue('transferlocation', fromLocation);
                                newRecord.insertLine({sublistId: slInv, line: 0});
                                let assemblyitem = fromRec.getValue('assemblyitem');
                                //let recL = record.load({type: 'location', id: fromLocation});
                                let lkLc = search.lookupFields({
                                    type: 'location',
                                    id: fromLocation,
                                    columns: ['usesbins']
                                });
                                let lkIT = search.lookupFields({
                                    type: 'item',
                                    id: assemblyitem,
                                    columns: ['usebins', 'description']
                                });
                                let data = [assemblyitem, fromRec.getValue('units'), quantity, fromRec.getValue('class'), lkIT.usebins, false
                                    , lkIT.description, lkLc.usesbins];
                                lbf.setSublistValueData(newRecord, slInv, newSublistFields, 0, data);
                            }
                            if (fromType !== record.Type.ITEM_RECEIPT) {
                                lbf.setValueData(newRecord, ['custbody_scv_assembly', 'location'], [fromRec.getValue('assemblyitem'), fromLocation]);
                            } else {
                                lbf.setValueData(newRecord, ['location', 'memo'], [fromLocation, fromRec.getValue('tranid')]);
                            }
                        }
                    }
                } else if (recType === record.Type.WORK_ORDER) {
                    lbf.setValueData(newRecord, ['custbody_scv_sales_order'], [newRecord.getValue('createdfrom')]);
                }
            } if (tgType === 'copy') {
                let newFields = ['custbody_scv_sales_order', 'custbody_scv_orrginal_wo'];
                let data = ['', ''];
                lbf.setValueData(newRecord, newFields, data);
            }
        }
         
         
         const addButtonIT = (form, createdfromid, rectype, subsidiary, location, frlocation) => {
            let createPdfUrl = url.resolveScript({
                scriptId: 'customscript_scv_sl_inventory_transfer',
                deploymentId: 'customdeploy_scv_sl_inventory_transfer',
                returnExternalUrl: false
            });
            createPdfUrl += '&createdfromid=' + createdfromid + '&createdrectype=' + rectype + '&subsidiary=' + subsidiary + '&location=' + location + '&frlocation=' + frlocation;
            form.addButton({
                id: 'custpage_bt_it',
                label: 'Inventory Transfer',
                functionName: "window.location.replace('" + createPdfUrl + "');"
            });
        }
         
         const addButtonTM = (form, createdfromid, rectype, subsidiary, location) => {
            if (lbf.isContainValue(location)) {
                let createPdfUrl = url.resolveScript({
                    scriptId: 'customscript_scv_sl_transfer_order',
                    deploymentId: 'customdeploy_scv_sl_transfer_order',
                    returnExternalUrl: false
                });
                createPdfUrl += '&createdfromid=' + createdfromid + '&createdrectype=' + rectype + '&subsidiary=' + subsidiary + '&location=' + location;
                form.addButton({
                    id: 'custpage_bt_tm',
                    label: 'Transfer Order',
                    functionName: "window.location.replace('" + createPdfUrl + "');"
                });
            }
        }
         
         const addButtonCCD = (form, createdfromid, rectype, subsidiary, location) => {
            let createPdfUrl = '/app/accounting/transactions/invtrnfr.nl?';
            createPdfUrl += 'createdfromid=' + createdfromid + '&createdrectype=' + rectype + '&subsidiary=' + subsidiary + '&location=' + location + '&isbuilt=true';
            form.addButton({
                id: 'custpage_bt_ccd',
                label: 'Chuyển công đoạn',
                functionName: "window.location.replace('" + createPdfUrl + "');"
            });
        }
         
         const addButtonCreateChildWo = (form, readRecord) => {
            let trid = readRecord.id;
            let trtype = readRecord.type;
            let slIt = 'item';
            let lcIt = readRecord.getLineCount(slIt);
            let auto_create_wo1, child_wo, isCreate = false;
            for (let i = 0; i < lcIt; i++) {
                auto_create_wo1 = readRecord.getSublistValue({
                    sublistId: slIt,
                    fieldId: 'custcol_scv_auto_create_wo1',
                    line: i
                });
                const itemtype = readRecord.getSublistValue({sublistId: slIt, fieldId: 'itemtype', line: i});
                if (convertToValueBolean(auto_create_wo1 ) && itemtype === 'Assembly') {
                    child_wo = readRecord.getSublistValue({sublistId: slIt, fieldId: 'custcol_scv_child_wo', line: i});
                    if (!lbf.isContainValue(child_wo)) {
                        isCreate = true;
                    }
                }
            }
            if (isCreate) {
                let createPdfUrl = url.resolveScript({
                    scriptId: 'customscript_scv_sl_create_wo_routing',
                    deploymentId: 'customdeploy_scv_sl_create_wo_routing',
                    returnExternalUrl: false
                });
                createPdfUrl += '&trid=' + trid + '&trtype=' + trtype;
                form.addButton({
                    id: 'custpage_bt_ccwo',
                    label: 'Create Child WO',
                    functionName: "window.location.replace('" + createPdfUrl + "');"
                });
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
            let tgType = scriptContext.type;
            let newRecord = scriptContext.newRecord;
            if (newRecord.type === record.Type.WORK_ORDER) {
                if (tgType === 'create') {
                    let createdfrom = newRecord.getValue('createdfrom');
                    let sales_order = newRecord.getValue('custbody_scv_sales_order');
                    if (lbf.isContainValue(sales_order) && lbf.isContainValue(createdfrom)) {
                        lbf.setValueData(newRecord, ['custbody_scv_sales_order'], [newRecord.getValue('createdfrom')]);
                    }
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
            let tgType = scriptContext.type;
            let newRecord = scriptContext.newRecord;
            if (newRecord.type === record.Type.WORK_ORDER) {
                if (tgType === 'create') {
                    const orrginal_wo = newRecord.getValue('custbody_scv_orrginal_wo');
                    if (lbf.isContainValue(orrginal_wo)) {
                        record.submitFields({
                            type: record.Type.WORK_ORDER,
                            id: newRecord.id,
                            values: {custbody_scv_orrginal_wo: newRecord.id}
                        });
                    }
                }
            }
        }
         
         const convertToValueBolean = (v) => {
            if (typeof v === 'boolean') return v;
            return v === 'T' || v === 'true';
        }


        return {
            beforeLoad: beforeLoad,
            beforeSubmit: beforeSubmit,
            afterSubmit: afterSubmit
        };

    });