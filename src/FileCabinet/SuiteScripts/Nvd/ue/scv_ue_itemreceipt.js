/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/url', '../lib/scv_lib_function.js', '../lib/scv_lib_invnumber'],

    function (record, search, url, lbf, libInvNum) {

        const CustomTypeReturn = {
            HANG_BAN_TRA_VE_CO_CHUNG_TU: '1',
            HANG_BAN_TRA_VE_KHONG_CHUNG_TU: '2'
        };
        const CustomOrderType = {
            TAM_NHAP_HANG_BAN_BI_TRA_LAI_KHONG_CHUNG_TU: '6',
            XUAT_HANG_NHAP_TAM: '5'
        };

        const beforeLoad = (scriptContext) => {
            addBtnYCNghiemThu(scriptContext);
        };

        const addBtnYCNghiemThu = (scriptContext) => {
            if (scriptContext.type !== 'view') return;
            let form = scriptContext.form;
            let newRecord = scriptContext.newRecord;
            const orderId = newRecord.getValue('custbody_scv_order_type');
            if (!orderId) return;
            const isNghiemThuKT = search.lookupFields({
                type: 'customrecord_scv_order_type',
                id: orderId,
                columns: ['custrecord_scv_order_type_ntkt_yn']
            }).custrecord_scv_order_type_ntkt_yn;
            if (!isNghiemThuKT) return;
            const urlCreatePNT = url.resolveScript({
                scriptId: 'customscript_scv_sl_create_pnt',
                deploymentId: 'customdeploy_scv_sl_create_pnt',
                params: {
                    recid: newRecord.id,
                    rectype: newRecord.type
                }
            });
            form.addButton({
                id: 'custpage_btn_ycnghiemthu',
                label: 'Yêu cầu nghiệm thu',
                functionName: `window.location.replace('${urlCreatePNT}');`
            });
        };

        const beforeSubmit = (scriptContext) => {
            let newRecord = scriptContext.newRecord;
            const triggerType = scriptContext.type;
            if (triggerType === 'delete') {
                deleteIAOutNoDocument(newRecord);
            }
        };

        const afterSubmit = (scriptContext) => {
            const trigType = scriptContext.type;
            if (['create', 'edit'].indexOf(trigType) === -1) return;
            let newRec = record.load({type: 'itemreceipt', id: scriptContext.newRecord.id});
            if (trigType === 'edit') {
                deleteIAOutNoDocument(newRec);
            }
            createIAOutNoDocument(newRec);
            libInvNum.setDataTransactionToInventoryNumber(scriptContext)
        };

        const deleteIAOutNoDocument = (recRetAuthor) => {
            let crtFromID = recRetAuthor.getValue("createdfrom");
            let tranType = lbf.getTranRecordType(crtFromID);
            if (tranType !== "returnauthorization") return;
            let recRA = record.load({type: "returnauthorization", id: crtFromID});
            let reaType = recRA.getValue("custbody_scv_rea_type").toString();
            if (reaType === CustomTypeReturn.HANG_BAN_TRA_VE_CO_CHUNG_TU) {
                let myResult = search.create({
                    type: "inventoryadjustment",
                    filters:
                        [
                            ["type", "anyof", "InvAdjst"],
                            "AND",
                            ["custbody_scv_order_type", "anyof", CustomOrderType.XUAT_HANG_NHAP_TAM],
                            "AND",
                            ["custbody_scv_created_transaction", "anyof", crtFromID],
                            "AND",
                            ["custbody_scv_related_transaction", "anyof", recRetAuthor.id],
                            "AND",
                            ["mainline", "is", "T"]
                        ],
                    columns:
                        [
                            search.createColumn({name: "internalid", label: "Internal ID"})
                        ]
                });
                myResult = myResult.run().getRange(0, 1);
                if (myResult.length === 0) return;
                record.delete({type: "inventoryadjustment", id: myResult[0].id});
            }
        };

        const createIAOutNoDocument = (recRetAuthor) => {
            const crtFromID = recRetAuthor.getValue("createdfrom");
            const tranType = lbf.getTranRecordType(crtFromID);
            if (tranType !== "returnauthorization") return;
            let recRA = record.load({type: "returnauthorization", id: crtFromID});
            const reaType = recRA.getValue("custbody_scv_rea_type").toString();
            if (reaType !== CustomTypeReturn.HANG_BAN_TRA_VE_CO_CHUNG_TU) return;
            const iaInboundId = getIDRecordIAInExists(crtFromID);
            if (iaInboundId === null) return;
            let recIA = record.load({type: "inventoryadjustment", id: iaInboundId});
            const location = recIA.getValue("adjlocation");
            const lotDefault = search.lookupFields({
                type: 'location',
                id: location,
                columns: ['custrecord_scv_loc_lo_md']
            })?.custrecord_scv_loc_lo_md || '';
            const newIARec = record.create({type: "inventoryadjustment", isDynamic: true, defaultValues: {}});
            newIARec.setValue("custbody_scv_order_type", CustomOrderType.XUAT_HANG_NHAP_TAM);
            lbf.setValue(newIARec, recIA, ['subsidiary', 'account', 'trandate'], ['subsidiary', 'account', 'trandate']);
            lbf.setValueData(newIARec, recIA, ['adjlocation', 'custbody_scv_created_transaction', 'custbody_scv_related_transaction'], [location, crtFromID, recRetAuthor.id]);
            const lcIRR = recRetAuthor.getLineCount("item");
            for (let i = 0; i < lcIRR; i++) {
                const markLine = recRetAuthor.getSublistValue({sublistId: "item", fieldId: "itemreceive", line: i});
                if (markLine === "F" || markLine == false) continue;
                const qty = recRetAuthor.getSublistValue({sublistId: "item", fieldId: "quantity", line: i});
                const item = recRetAuthor.getSublistValue({sublistId: "item", fieldId: "item", line: i});
                const unit = recRetAuthor.getSublistValue({sublistId: "item", fieldId: "units", line: i});
                const itemType = lbf.getItemRecordType(item);
                newIARec.selectNewLine("inventory");
                newIARec.setCurrentSublistValue({sublistId: 'inventory', fieldId: 'item', value: item});
                newIARec.setCurrentSublistValue({sublistId: 'inventory', fieldId: 'units', value: unit});
                newIARec.setCurrentSublistValue({sublistId: 'inventory', fieldId: 'adjustqtyby', value: qty * (-1)});
                newIARec.setCurrentSublistValue({sublistId: 'inventory', fieldId: 'location', value: location});
                if (itemType === "lotnumberedinventoryitem" || itemType === "lotnumberedassemblyitem") {
                    if (!lbf.isContainValue(lotDefault))
                        throw "REA No Document: Please check Lot No Default in location!";
                    let newInvDetail = newIARec.getCurrentSublistSubrecord({
                        sublistId: 'inventory',
                        fieldId: 'inventorydetail'
                    });
                    newInvDetail.selectNewLine({sublistId: 'inventoryassignment'});
                    newInvDetail.setCurrentSublistValue({
                        sublistId: 'inventoryassignment',
                        fieldId: 'receiptinventorynumber',
                        value: lot_default
                    });
                    newInvDetail.setCurrentSublistValue({
                        sublistId: 'inventoryassignment',
                        fieldId: 'quantity',
                        value: qty * (-1)
                    });
                    newInvDetail.commitLine({sublistId: 'inventoryassignment'});
                }
                newIARec.commitLine({sublistId: 'inventory'});
            }
            newIARec.save({enableSourcing: false, ignoreMandatoryFields: true});
        };

        const getIDRecordIAInExists = (idRA) => {
            let s = search.create({
                type: "inventoryadjustment",
                filters:
                    [
                        ["type", "anyof", "InvAdjst"],
                        "AND",
                        ["custbody_scv_order_type", "anyof", CustomOrderType.TAM_NHAP_HANG_BAN_BI_TRA_LAI_KHONG_CHUNG_TU],
                        "AND",
                        ["custbody_scv_created_transaction", "anyof", idRA],
                        "AND",
                        ["mainline", "is", "T"]
                    ],
                columns: [search.createColumn({name: "internalid", label: "Internal ID"})]
            });
            let r = s.run().getRange(0, 1);
            if (r.length > 0) return r[0].getValue("internalid");
            return null;
        };

        return {
            beforeLoad: beforeLoad,
            beforeSubmit: beforeSubmit,
            afterSubmit: afterSubmit
        };

    });
