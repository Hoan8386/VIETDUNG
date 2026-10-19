/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define([
    'N/record', 'N/search', 'N/query',
    '../lib/scv_lib_function.js'
],
    (
        record, search, query,
        lfn
    ) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */

        const CustomRecordType = {
            INSPECTION_SHEET: 'customrecord_scv_inspection_sheet'
        };
        const INSPECTION_LOT_SUBLIST_ID = 'recmachcustrecord_scv_inspl_insp_sheet';
        const CustomProductStageId = {IPC: '11', PQC: '5', IQC: '4'};
        const DIGIT_MAX_NUMBER = 5;
        const CustomTypeInspection = {
            IQC: 'IQC',
            PQC: 'PQC',
        };

        const CustomStatusLot = {
            PENDING_INSPECTION: '1',
        };

        const onRequest = (scriptContext) => {
            let tranId = "649625";
            let tranRec = record.load({ type: "itemreceipt", id: tranId });

            let recSub = tranRec.getSublistSubrecord({
                sublistId: 'item',
                fieldId: 'inventorydetail',
                line: 0
            });
            log.error("recSub", recSub);

            // let arrIdInspectionSheetInactive = fetchDataSourceInspectionInactive(tranId);
            // const arrItemId = getArrayItemId(tranRec);
            // const arrDataItem = getDataItems(arrItemId);

            // let test = getDataSourceForIQC(tranRec, arrIdInspectionSheetInactive, arrDataItem);
            // // log.error("test", test);
        }

        const fetchDataSourceInspectionInactive = (transId) => {
            let strTransId = transId.toString();
            const sqlQuery = `select tl.transaction, tl.custcol_scv_insp_sheet as insp_sheet
                              from transactionline as tl
                                       left join customrecord_scv_inspection_sheet as tb_insp_sheet
                                                 on tb_insp_sheet.id = tl.custcol_scv_insp_sheet
                              where tl.transaction = ${strTransId}
                                and tb_insp_sheet.isinactive = 'T'`;
            let result = lfn.callQuery(sqlQuery);
            let arrDataInspectionSheet = result.isSuccess ? result.response : [];
            return arrDataInspectionSheet.map(o => o.insp_sheet.toString());
        };

        const getArrayItemId = (curRec) => {
            let arrIdItem = [];
            const lc = curRec.getLineCount('item');
            for (let i = 0; i < lc; i++) {
                arrIdItem.push(curRec.getSublistValue({sublistId: 'item', fieldId: 'item', line: i}));
            }
            return arrIdItem;
        };

        const getDataItems = (arrIdItem) => {
            if (arrIdItem.length === 0) return [];
            let searchObj = search.create({
                type: 'item',
                filters: [
                    search.createFilter({
                        name: 'internalid',
                        operator: 'anyof',
                        values: arrIdItem
                    })
                ],
                columns: ['internalid', 'usebins', 'isinactive']
            });
            let searchData = searchObj.run().getRange(0, 1000);
            let szData = searchData.length;
            let result = [];
            let cols = searchObj.columns;
            for (let i = 0; i < szData; i++) {
                result.push({
                    id: searchData[i].getValue(cols[0]),
                    usebins: searchData[i].getValue(cols[1]),
                    isinactive: searchData[i].getValue(cols[2])
                });
            }
            return result;
        };

        const getDataSourceForIQC = (tranRec, arrIdInspectionSheetInactive, arrDataItem) => {
            const arrItemIdInactive = arrDataItem.filter(o => o.isinactive).map(o => o.id);
            const arrItemUseBin = arrDataItem.filter(o => o.usebins).map(o => o.id);
            const createdFrom = tranRec.getValue('createdfrom') || tranRec.getValue('custbody_scv_created_transaction');
            const subId = tranRec.getValue('subsidiary');
            const arrInsPlan = getInsPlanAllLine(tranRec);
            const productStage = getIdProductStageFilter(tranRec.type);
            const arrInsFields = getElementInsFields({
                arrInsPlan: arrInsPlan,
                productStage: productStage,
                recordType: tranRec.type,
            });

            const objSub = getConfigQAQCInSubsidiary(subId)[0];
            const tranDate = tranRec.getValue('trandate');
            const mfgDate = tranRec.getValue("custbody_scv_mfg_date");
            const shiftId = tranRec.getValue('custbody_scv_shift');
            let workCenterId = tranRec.getValue('custbody_mfgmob_workcenter');
            if(tranRec.type === "itemreceipt") {
                workCenterId = tranRec.getValue('custbody_scv_wo_center');
            }
            const vendorId = tranRec.getValue('entity');
            const department = tranRec.getValue('department');
            const yearMonth = dateToMMYY(tranDate);
            const resultInsNum = getMaxNumberInspection(subId, yearMonth);
            // log.error("resultInsNum", resultInsNum);
            let curMaxNum = resultInsNum.maxNum;
            const lcItem = tranRec.getLineCount('item');
            const blCreateFromIRR = tranRec.type === record.Type.ITEM_RECEIPT;
            let objDataIQCInspections = {}, objDataInspectionSheet = {};

            for (let i = 0; i < lcItem; i++) {
                let curLine = new LoadCurrentLine(tranRec, 'item', i);
                const itemId = curLine.value('item');
                let isCheckBin = false;
                // if (blCreateFromIRR) {
                //     if (!checked(curLine.value('itemreceive'))) continue;
                //     isCheckBin = checked(curLine.value('locationusesbins')) && arrItemUseBin.includes(itemId);
                // }
                // if (arrItemIdInactive.includes(itemId)) continue;
                const oriLineId = curLine.value('custcol_scv_ori_lineid');
                const inspectionPlanId = curLine.value('custcol_scv_inspection_plan');
                const blInsStarted = curLine.value('custcol_scv_inspect_started');
                const unitsId = curLine.value('units');
                const locationId = curLine.value('location');
                const quantity = curLine.value('quantity');
                const inspectionSheetId = curLine.value('custcol_scv_insp_sheet');
                // if (!checked(blInsStarted) || !inspectionPlanId || (!!inspectionSheetId && !arrIdInspectionSheetInactive.includes(inspectionSheetId))) continue;
                let sampleQty = curLine.value('custcol_scv_sample_qty') * 1;
                if (sampleQty <= 0) sampleQty = 1;
                const arrDataLineInsFields = arrInsFields.filter(o => o.insPlan === inspectionPlanId);
                if (tranRec.type === 'workorder') {
                    if (arrDataLineInsFields.length === 0) continue;
                }
                const arrDataCreateIQCInspection = getDataCreateIQCInspection({
                    newRecord: tranRec,
                    lineIndex: i,
                    createdFrom: createdFrom,
                    arrDataLineInsFields: arrDataLineInsFields,
                    objSub: objSub,
                    isCheckBin : isCheckBin
                });
                // log.error("ruen", arrDataCreateIQCInspection);
                if (arrDataCreateIQCInspection.length === 0) continue;
                // Data IQC Inspections

                const objDataIQCInspectionsLine = getDataInspectionsBySampleQuantity({
                    arrDataInspections: arrDataCreateIQCInspection,
                    sampleQty: sampleQty,
                    objDataInsNum: resultInsNum,
                    curMaxNum: curMaxNum
                });
                curMaxNum = objDataIQCInspectionsLine.maxNum;
                // Data Inspection Sheet
                objDataInspectionSheet[i] = {
                    body: {
                        tranDate : tranDate,
                        mfgDate: mfgDate,
                        shiftId : shiftId,
                        workCenterId : workCenterId,
                        item: itemId,
                        unit: unitsId,
                        location: locationId,
                        quantity: quantity,
                        subsidiary: subId,
                        createdFrom: createdFrom,
                        vendorId: vendorId,
                        planId: inspectionPlanId,
                        transId: tranRec.id,
                        oriLineId: oriLineId,
                        department: department
                    },
                    line: arrDataCreateIQCInspection.map(o => ({
                        invNo: o.body.invNumberId,
                        invStatus: o.body.statusId,
                        binId: o.body.binId,
                        qty: o.body.qty,
                        lineLot: o.body.lineLot,
                        expirationDate: o.body.expirationDate
                    }))
                };
                objDataIQCInspections[i] = objDataIQCInspectionsLine.data;
            }

            // ! return data
            const numsCustomRecord = curMaxNum - resultInsNum.maxNum + Object.keys(objDataInspectionSheet).length;
            return {
                objDataIQCInspections: objDataIQCInspections,
                idInspectionNum: resultInsNum.insNumId,
                maxNum: curMaxNum,
                numsCustomRecord: numsCustomRecord,
                objDataInspectionSheet: objDataInspectionSheet
            };
        };

        const getMaxNumberInspection = (subsidiary, monthYear) => {
            let result = {maxNum: null, insNumId: null, prefixDocNum: null};
            const columns = [
                'custrecord_scv_in_subsidiary_prefix',
                'custrecord_scv_in_input_prefix',
                'custrecord_scv_in_input_no',
            ];
            const sVN = searchInspectionNumber(subsidiary, columns, monthYear);
            if (sVN === null) return result;
            const prefixDocNum = sVN.getValue('custrecord_scv_in_subsidiary_prefix') + '.' + sVN.getValue('custrecord_scv_in_input_prefix') + '.' + monthYear + '.';
            result.maxNum = +sVN.getValue('custrecord_scv_in_input_no') || 0;
            result.prefixDocNum = prefixDocNum;
            result.insNumId = sVN.id;
            return result;
        };

        const searchInspectionNumber = (subsidiary, columns, monthYear) => {
            let searchVN = search.create({
                type: 'customrecord_scv_inspection_number',
                filters: [['custrecord_scv_in_subsidiary', search.Operator.ANYOF, subsidiary]
                    , 'and', ['custrecord_scv_in_year_month', 'is', monthYear]
                    , 'and', ['isinactive', 'is', false]
                ],
                columns: columns
            });
            let resultsVN = searchVN.run().getRange({start: 0, end: 1});
            const lengthVN = resultsVN.length;
            if (lengthVN > 0) return resultsVN[0];

            return {};
            // createInspectionNumber(subsidiary, monthYear);
            // return searchInspectionNumber(subsidiary, columns, monthYear);
        };

        const getDataInspectionsBySampleQuantity = (objData) => {
            let {
                arrDataInspections,
                sampleQty,
                objDataInsNum,
                curMaxNum
            } = objData;
            let data = [];
            let maxNumber = curMaxNum;
            const sizeDataInspection = arrDataInspections.length;
            for (let k = 0; k < sizeDataInspection; k++) {
                for (let j = 0; j < sampleQty; j++) {
                    let docNum = '';
                    if (objDataInsNum.insNumId) {
                        maxNumber++;
                        docNum = objDataInsNum.prefixDocNum + maxNumber.toString().padStart(DIGIT_MAX_NUMBER, '0');
                    }
                    data.push({
                        body: {...arrDataInspections[k].body, inspectionNum: j + 1},
                        line: arrDataInspections[k].line,
                        docNum: docNum
                    });
                }
            }
            return {
                data: data,
                maxNum: maxNumber
            };
        };

        const getDataCreateIQCInspection = (options) => {
            const {
                newRecord,
                createdFrom,
                arrDataLineInsFields,
                objSub,
                lineIndex,
                isCheckBin
            } = options;
            let arrDataIns = [];
            let curLine = new LoadCurrentLine(newRecord, 'item', lineIndex);
            const inspectionPlan = curLine.value('custcol_scv_inspection_plan');
            const lcInsFld = arrDataLineInsFields.length;
            const subId = newRecord.getValue('subsidiary');
            const entityId = newRecord.getValue('entity') || '';
            const item = curLine.value('item');
            const quantity = curLine.value('quantity');
            const lineUnitsId = curLine.value('units');
            const lineNo = curLine.value('line');
            const oriLineId = curLine.value('custcol_scv_ori_lineid');
            const lotNum = curLine.value('custcol_scv_lot_serial_selected') || '';
            const lotNumText = curLine.text('custcol_scv_lot_serial_selected') || '';
            const sampleQty = curLine.value('custcol_scv_sample_qty') * 1 || 0;
            const poLinePackaging = curLine.value('custcol_scv_po_line_packging');
            const supplierLot = curLine.value('custcol_supplier_lot');
            const supplierMfgDate = curLine.value('custcol_scv_supplier_mfg_date');
            const manufacturer = curLine.text('custcol_scv_manufacture_item');
            const kitLineId = curLine.value('kitlineid');
            const locationId = curLine.value('location');
            const locationDisplay = curLine.text('location');
            let objBodyStd = {
                item: item,
                locId: locationId,
                locText: locationDisplay,
                units: lineUnitsId,
                planId: inspectionPlan,
                lotNumberDisplay: lotNumText,
                invNumberId: lotNum,
                qty: quantity,
                binId: '',
                sampleQty,
                subId,
                poLinePackaging,
                supplierLot,
                supplierMfgDate,
                expirationDate: '',
                manufacturer,
                createdFrom,
                tranId: newRecord.id,
                entityId: entityId,
                oriLineId: oriLineId,
                lineNo: lineNo,
                kitLineId: kitLineId,
                lineLot: 1,
            };
            const slIVD = 'inventoryassignment';
            if (!lineHasInvDetail(newRecord, 'item', lineIndex)) {
                if (!lotNum) return [{body: objBodyStd, line: []}];
                let arrDataLine = [];
                if (objSub.addInspectionPlanLine) {
                    for (let j = 0; j < lcInsFld; j++) {
                        const objInsFld = arrDataLineInsFields[j];
                        arrDataLine.push({
                            lineIndex: lineIndex,
                            insFldDesc: objInsFld.description,
                            insFldId: objInsFld.id,
                            insFldMethod: objInsFld.method,
                            insFldInsMethod: objInsFld.insMethod,
                            insFldTestType: objInsFld.testType,
                            insFldSequence: objInsFld.sequence,
                        });
                    }
                }
                return [{body: objBodyStd, line: arrDataLine}];
            }

            let recSub = newRecord.getSublistSubrecord({
                sublistId: 'item',
                fieldId: 'inventorydetail',
                line: lineIndex
            });
            log.error("recSub", recSub);
            const lcIVD = recSub.getLineCount(slIVD);
            for (let idxDet = 0; idxDet < lcIVD; idxDet++) {
                let objInspection = {body: [], line: []};
                let curLineInvDet = new LoadCurrentLine(recSub, slIVD, idxDet);
                const receiptinventorynumber = curLineInvDet.value('receiptinventorynumber');
                const issueinventorynumber = curLineInvDet.value('issueinventorynumber');
                const lotNumber = receiptinventorynumber || issueinventorynumber;
                const numberedRecordId = curLineInvDet.value('numberedrecordid');
                const expirationDate = curLineInvDet.value('expirationdate');
                const quantityLot = curLineInvDet.value('quantity');
                const statusId = curLineInvDet.value('inventorystatus');

                log.error("res", {
                    lotNumber,
                    numberedRecordId,
                    expirationDate,
                    quantityLot,
                    statusId
                })
                if (statusId !== CustomStatusLot.PENDING_INSPECTION) continue;
                const binnumber = curLineInvDet.value('binnumber') || '';
                if (isCheckBin && !binnumber) continue;
                objInspection.body = {
                    ...objBodyStd,
                    lotNumberDisplay: lotNumber,
                    invNumberId: numberedRecordId,
                    qty: quantityLot,
                    binId: binnumber,
                    statusId: statusId,
                    expirationDate: expirationDate,
                    lineLot: idxDet + 1
                };
                if (objSub.addInspectionPlanLine) {
                    for (let j = 0; j < lcInsFld; j++) {
                        const objInsFld = arrDataLineInsFields[j];
                        objInspection.line.push({
                            lineIndex: lineIndex,
                            insFldDesc: objInsFld.description,
                            insFldId: objInsFld.id,
                            insFldMethod: objInsFld.method,
                            insFldInsMethod: objInsFld.insMethod,
                            insFldTestType: objInsFld.testType,
                            insFldSequence: objInsFld.sequence,
                        });
                    }
                }
                arrDataIns.push(objInspection);
            }

            return arrDataIns;
        }

        const lineHasInvDetail = (curRec, sublistId, lineIndex) => {
            const fldInvDet = 'inventorydetail';
            const fldInvDetAvail = 'inventorydetailavail';
            const sublistInvDet = 'inventoryassignment';
            const hasInvDet = checked(curRec.getSublistValue(sublistId, fldInvDetAvail, lineIndex));
            if (!hasInvDet) return false;
            return curRec.getSublistSubrecord(sublistId, fldInvDet, lineIndex).getLineCount(sublistInvDet) > 0;
        };

        function LoadCurrentLine(curRec, sublistId, lineIndex) {
            return {
                value: f => curRec.getSublistValue(sublistId, f, lineIndex),
                text: f => curRec.getSublistText(sublistId, f, lineIndex),
                set: (f, v) => curRec.setSublistValue(sublistId, f, lineIndex, v)
            }
        }

        const dateToMMYY = (date) => (date.getMonth() + 1).toString().padStart(2, '2') + date.getFullYear().toString().substring(2, 4)

        const getConfigQAQCInSubsidiary = (subsidiary) => {
            if (!lfn.isContainValue(subsidiary)) return;
            let arrConfig = [];
            if (Array.isArray(subsidiary)) {
                const sqlQuery = `SELECT id,
                                         custrecord_scv_sub_auto_created_ib_qc,
                                         custrecord_scv_sub_create_ib_ir_to,
                                         custrecord_scv_sub_qc_insp_plan_line
                                  FROM SUBSIDIARY
                                  WHERE id = ('${subsidiary.join("','")}')`;
                const dataSubs = lfn.callQuery(sqlQuery).map(o => ({
                    id: o.id,
                    autoCrtInboundQC: checked(o.custrecord_scv_sub_auto_created_ib_qc),
                    crtInboundQCForIROrTO: checked(o.custrecord_scv_sub_create_ib_ir_to),
                    addInspectionPlanLine: checked(o.custrecord_scv_sub_qc_insp_plan_line)
                }));
                arrConfig = arrConfig.concat(dataSubs);
            } else {
                let lkSub = search.lookupFields({
                    type: 'subsidiary',
                    id: subsidiary,
                    columns: [
                        'custrecord_scv_sub_qc_insp_plan_line',
                        'custrecord_scv_sub_auto_created_ib_qc',
                        'custrecord_scv_sub_create_ib_ir_to'
                    ]
                });
                arrConfig.push({
                    id: subsidiary,
                    autoCrtInboundQC: lkSub.custrecord_scv_sub_auto_created_ib_qc,
                    crtInboundQCForIROrTO: lkSub.custrecord_scv_sub_create_ib_ir_to,
                    addInspectionPlanLine: lkSub.custrecord_scv_sub_qc_insp_plan_line
                });
            }
            return arrConfig;
        };

        const getInsPlanAllLine = (tranRec) => {
            const arrInsPlan = [];
            const lcItem = tranRec.getLineCount('item');
            let isItemReceipt = tranRec.type === record.Type.ITEM_RECEIPT;
            for (let i = 0; i < lcItem; i++) {
                if (isItemReceipt) {
                    const itemreceive = tranRec.getSublistValue({sublistId: 'item', fieldId: 'itemreceive', line: i});
                    if (!checked(itemreceive)) continue;
                }
                const insPlanId = tranRec.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_scv_inspection_plan',
                    line: i
                });
                if (!!insPlanId && arrInsPlan.indexOf(insPlanId) === -1) arrInsPlan.push(insPlanId);
            }
            return arrInsPlan;
        };

        const checked = (value) => {
            if (typeof value === 'boolean') return value;
            return value === 'T' || value === 'true';
        };

        const getIdProductStageFilter = (transType) => {
            if (transType === record.Type.WORK_ORDER) return CustomProductStageId.PQC;
            return CustomProductStageId.IQC;
        };

         const getElementInsFields = (options) => {
            if (options.arrInsPlan.length === 0) return [];
            let f = [];
            f.push(search.createFilter({name: 'isinactive', operator: 'is', values: false}));
            if (lfn.isContainValue(options.arrInsPlan)) {
                f.push(search.createFilter({
                    name: 'custrecord_scv_if_inspec_plan',
                    operator: 'anyof',
                    values: options.arrInsPlan
                }));
            }
            if (options.productStage) {
                f.push(search.createFilter({
                    name: 'custrecord_scv_if_sequence',
                    operator: 'anyof',
                    values: options.productStage
                }));
            }
            if (options?.createFromItemReceipt === 'T') {
                f.push(search.createFilter({
                    name: 'custrecord_scv_pqc_yn',
                    join: 'custrecord_scv_if_production_stage',
                    operator: 'is',
                    values: true
                }))
            } else {
                f.push(search.createFilter({
                    name: 'custrecord_scv_pqc_yn',
                    join: 'custrecord_scv_if_production_stage',
                    operator: 'is',
                    values: options.recordType === record.Type.WORK_ORDER
                }))
            }
            let c =
                [
                    'custrecord_scv_if_test_description', 'custrecord_scv_if_test_method',
                    {name: 'custrecord_scv_ip_subsidiary', join: 'custrecord_scv_if_inspec_plan'},
                    'custrecord_scv_if_inspec_method', 'custrecord_scv_if_test_type',
                    {name: 'custrecord_scv_if_sequence', sort: 'ASC'},
                    'custrecord_scv_if_inspec_plan', 'internalid',
                    'custrecord_scv_if_inspection_type_l2', 'custrecord_scv_if_inspection_type_l3'
                ];
            let s = search.create({type: 'customrecord_scv_inspection_field', filters: f, columns: c});
            let cols = s.columns;
            let r = s.run().getRange({start: 0, end: 1000});
            const npData = r.length;
            let arrResult = [];
            for (let i = 0; i < npData; i++) {
                arrResult.push({
                    description: r[i].getValue(cols[0]),
                    method: r[i].getValue(cols[1]),
                    subsidiary: r[i].getValue(cols[2]),
                    insMethod: r[i].getValue(cols[3]),
                    testType: r[i].getValue(cols[4]),
                    sequence: r[i].getValue(cols[5]),
                    insPlan: r[i].getValue(cols[6]),
                    id: r[i].getValue(cols[7]),
                    insTypeL2: r[i].getValue(cols[8]),
                    insTypeL3: r[i].getValue(cols[9])
                });
            }
            return arrResult;
        }

        return {onRequest}

    });
