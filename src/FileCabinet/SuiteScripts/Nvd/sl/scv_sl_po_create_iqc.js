/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/redirect', 'N/search', 'N/url', '../lib/scv_lib_function.js', '../lib/scv_lib_qaqc.js'],

    function (record, redirect, search, url, lbf, qaqc) {

        const onRequest = (scriptContext) => {
            let request = scriptContext.request;
            let params = request.parameters;
            let poid = params.poid;
            let trtype = params.trtype;
            let PORec = record.load({type: record.Type.PURCHASE_ORDER, id: poid});
            let isSave = false;
            let trandate = PORec.getValue('trandate');
            let year_month = lbf.makePrefix(trandate.getMonth() + 1, 2, '0') + trandate.getFullYear().toString().substring(2, 4);
            let transSubsidiaryId = PORec.getValue('subsidiary');
            let lkSub = search.lookupFields({
                type: 'subsidiary',
                id: transSubsidiaryId,
                columns: [
                    'custrecord_scv_sub_qc_insp_plan_line',
                    'custrecord_scv_sub_auto_created_ib_qc',
                    'custrecord_scv_sub_create_ib_ir_to']
            });
            const arrInsPlanId = getArrInsPlanId(PORec);
            const arrDataInsPlan = getDataInspectPlan(arrInsPlanId);
            const lcItem = PORec.getLineCount("item");
            for (let i = 0; i < lcItem; i++) {
                let inspect_started = PORec.getSublistValue("item", "custcol_scv_inspect_started", i);
                let inspection_plan = PORec.getSublistValue("item", "custcol_scv_inspection_plan", i);
                let sample_qty = Number(PORec.getSublistValue("item", "custcol_scv_sample_qty", i));
                let inspect_num = PORec.getSublistValue("item", "custcol_scv_inspection_number", i);
                let quantity = PORec.getSublistValue({sublistId: "item", fieldId: 'quantity', line: i});
                let item = PORec.getSublistValue({sublistId: "item", fieldId: 'item', line: i});
                const blCrtIQC = isTruely(inspect_started) && lbf.isContainValue(inspection_plan) && sample_qty > 0 && !lbf.isContainValue(inspect_num);
                if (!blCrtIQC) continue;
                let slItem = 'item';
                let slIVD = 'inventoryassignment';
                let arrDataInsPlanLine = arrDataInsPlan.filter(o => o.insPlanId === inspection_plan);
                let lR = arrDataInsPlanLine.length;
                if (lR === 0) continue;
                let invavail = PORec.getSublistValue({sublistId: slItem, fieldId: 'inventorydetailavail', line: i});
                let manufacturer = PORec.getSublistText({
                    sublistId: slItem,
                    fieldId: 'custcol_scv_manufacture_item',
                    line: i
                });
                let fields = [
                    'custrecord_scv_ir_line_nr'
                    , 'custrecord_scv_ir_item_number', 'custrecord_scv_ir_inspect_plan', 'custrecord_scv_ir_inspect_tdesc'
                    , 'custrecord_scv_ir_qty_tested', 'custrecord_scv_ir_lot_number', 'custrecord_scv_ir_inspect_field'
                    , 'custrecord_scv_ir_test_methods', 'custrecord_scv_iird_subsidiary',
                    'custrecord_scv_ir_insp_document', 'custrecord_scv_ir_inspect_method', 'custrecord_scv_ir_test_type'
                    , 'custrecord_scv_irt_sequences'];
                let fields_cfrom = ['custrecord_scv_ir_receipt_no', 'custrecord_scv_ir_purchase_order'];
                let fields_head = ['custrecord_scv_irt_inspection_plan'
                    , 'custrecord_scv_irt_item', 'custrecord_scv_irt_lot_number', 'custrecord_scv_irt_subsidiary',
                    'custrecord_scv_irt_inspect_number', 'custrecord_scv_irt_receiptno_line_id', 'custrecord_scv_irt_receipt_qty'
                    , 'custrecord_scv_irt_packaging_qty', 'custrecord_scv_irt_supplier_lot', 'custrecord_scv_irt_supplier_mfg_date'
                    , 'custrecord_scv_irt_expiration_date', 'custrecord_scv_irt_inentory_number', 'custrecord_scv_irt_manufacturer'];
                let fields_head_cfrom = ['custrecord_scv_irt_receipt_from', 'custrecord_scv_irt_receipt_no'];
                let kitlineid = PORec.getSublistValue({sublistId: slItem, fieldId: 'kitlineid', line: i});
                let slIRT = 'recmachcustrecord_scv_ir_irt';
                if (isTruely(invavail)) {
                    let recSub = PORec.getSublistSubrecord({sublistId: slItem, fieldId: 'inventorydetail', line: i});
                    let lcIVD = recSub.getLineCount(slIVD);
                    for (let idxInvDet = 0; idxInvDet < lcIVD; idxInvDet++) {
                        let doc_number = getInspectionNumber(transSubsidiaryId, year_month);
                        let lot_number = recSub.getSublistValue({
                            sublistId: slIVD,
                            fieldId: 'receiptinventorynumber',
                            line: idxInvDet
                        });
                        let numberedrecordid = recSub.getSublistValue({
                            sublistId: slIVD,
                            fieldId: 'numberedrecordid',
                            line: idxInvDet
                        });
                        let expirationdate = recSub.getSublistValue({
                            sublistId: slIVD,
                            fieldId: 'expirationdate',
                            line: idxInvDet
                        });
                        let recIRT = record.create({type: 'customrecord_scv_inspection_result_tb'});
                        lbf.setValueData(recIRT, fields_head,
                            [inspection_plan, item, lot_number, transSubsidiaryId, doc_number, kitlineid, 0, quantity,
                                "", "", expirationdate, numberedrecordid, manufacturer]);
                        lbf.setValueData(recIRT, fields_head_cfrom, [poid, '']);
                        if (isTruely(lkSub.custrecord_scv_sub_qc_insp_plan_line)) {
                            for (let j = 0; j < lR; j++) {
                                const dataInsPlan = arrDataInsPlanLine[j];
                                const dataLine = [i, item, inspection_plan, dataInsPlan.testDes, sample_qty, lot_number,
                                    dataInsPlan.id, dataInsPlan.testMethod, transSubsidiaryId, doc_number, dataInsPlan.insMethod,
                                    dataInsPlan.testType, dataInsPlan.sequence
                                ];
                                recIRT.insertLine({sublistId: slIRT, line: j});
                                lbf.setSublistValueData(recIRT, slIRT, fields, j, dataLine);
                                lbf.setSublistValueData(recIRT, slIRT, fields_cfrom, j, ['', poid]);
                            }
                        }
                        let idIRT = recIRT.save({enableSourcing: false, ignoreMandatoryFields: true});
                        PORec.setSublistValue({
                            sublistId: slItem,
                            fieldId: 'custcol_scv_inbound_inspection_result',
                            line: i,
                            value: idIRT
                        });
                        PORec.setSublistValue({
                            sublistId: slItem,
                            fieldId: 'custcol_scv_inspection_number',
                            line: i,
                            value: doc_number
                        });
                        // PORec.setValue("custbody_scv_related_iqc", idIRT);
                        isSave = true;
                    }
                } else {
                    let recIRT = record.create({type: 'customrecord_scv_inspection_result_tb'});
                    let doc_number = getInspectionNumber(transSubsidiaryId, year_month);
                    lbf.setValueData(recIRT, fields_head,
                        [inspection_plan, item, '', transSubsidiaryId, doc_number, kitlineid, 0, quantity,
                            "", "", '', '', manufacturer]);
                    lbf.setValueData(recIRT, fields_head_cfrom, [poid, '']);
                    for (let j = 0; j < lR; j++) {
                        const dataInsPlan = arrDataInsPlanLine[j];
                        const dataLine = [i, item, inspection_plan, dataInsPlan.testDes, sample_qty, '',
                            dataInsPlan.id, dataInsPlan.testMethod, transSubsidiaryId, doc_number, dataInsPlan.insMethod,
                            dataInsPlan.testType, dataInsPlan.sequence
                        ];
                        recIRT.insertLine({sublistId: slIRT, line: j});
                        lbf.setSublistValueData(recIRT, slIRT, fields, j, dataLine);
                        lbf.setSublistValueData(recIRT, slIRT, fields_cfrom, j, ['', poid]);
                    }
                    let idIRT = recIRT.save({enableSourcing: false, ignoreMandatoryFields: true});
                    PORec.setSublistValue({
                        sublistId: slItem,
                        fieldId: 'custcol_scv_inbound_inspection_result',
                        line: i,
                        value: idIRT
                    });
                    PORec.setSublistValue({
                        sublistId: slItem,
                        fieldId: 'custcol_scv_inspection_number',
                        line: i,
                        value: doc_number
                    });
                    isSave = true;
                }
            }

            if (isSave) {
                PORec.save({enableSourcing: false, ignoreMandatoryFields: true});
            }
            redirect.toRecord({type: trtype, id: poid});
        }

        const getArrInsPlanId = (curRec) => {
            const lc = curRec.getLineCount('item');
            const arrInsPlanId = [];
            for (let i = 0; i < lc; i++) {
                const insPlanId = curRec.getSublistValue("item", "custcol_scv_inspection_plan", i);
                if (insPlanId && arrInsPlanId.indexOf(insPlanId) === -1) {
                    arrInsPlanId.push(insPlanId);
                }
            }
            return arrInsPlanId;
        }

        const getDataInspectPlan = (arrInsPlanId) => {
            if (arrInsPlanId.length === 0) return [];
            let f = [['custrecord_scv_if_inspec_plan', 'anyof', arrInsPlanId]];
            let c =
                [
                    'custrecord_scv_if_test_description',
                    'custrecord_scv_if_test_method',
                    {name: 'custrecord_scv_ip_subsidiary', join: 'custrecord_scv_if_inspec_plan'},
                    'custrecord_scv_if_inspec_method', 'custrecord_scv_if_test_type', {
                    name: 'custrecord_scv_if_sequence',
                    sort: 'ASC'
                },
                    'custrecord_scv_if_inspec_plan',
                    'internalid'
                ];
            let s = search.create({type: 'customrecord_scv_inspection_field', filters: f, columns: c});
            const cols = s.columns;
            let r = s.run().getRange({start: 0, end: 1000});
            if (r.length === 0) return [];
            return r.map(l => ({
                testDes: l.getValue(cols[0]),
                testMethod: l.getValue(cols[1]),
                subId: l.getValue(cols[2]),
                insMethod: l.getValue(cols[3]),
                testType: l.getValue(cols[4]),
                sequence: l.getValue(cols[5]),
                insPlanId: l.getValue(cols[6]),
                id: l.getValue(cols[7])
            }));
        }

        const getInspectionNumber = (subsidiary, year_month) => {
            let columns = ['custrecord_scv_in_subsidiary_prefix', 'custrecord_scv_in_input_prefix', 'custrecord_scv_in_input_no'];
            let sVN = qaqc.searchInspectionNumber(subsidiary, columns, year_month);
            let doc_no = '';
            let doc_number = '';
            if (sVN == null) return doc_number;
            doc_no = sVN.getValue('custrecord_scv_in_input_no') * 1 + 1;
            doc_number = sVN.getValue('custrecord_scv_in_subsidiary_prefix') + '.' + sVN.getValue('custrecord_scv_in_input_prefix') + '.' + year_month;
            doc_number = doc_number + '.' + lbf.makePrefix(doc_no, 5, '0');
            record.submitFields({
                type: 'customrecord_scv_inspection_number',
                id: sVN.id,
                values: {custrecord_scv_in_input_no: doc_no},
                options: {enableSourcing: false, ignoreMandatoryFields: true}
            });
            return doc_number;
        };

        const isTruely = (v) => {
            if (typeof v === 'boolean') return v;
            return v === 'T' || v === 'true';
        };

        return {
            onRequest: onRequest
        };

    });
