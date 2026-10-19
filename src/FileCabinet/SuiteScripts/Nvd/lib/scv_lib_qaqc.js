define(['N/record', 'N/search', 'N/runtime', '../lib/scv_lib_function.js'],
    function (record, search, runtime, lfn) {
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

        /**
         * Des : Generate Inspection Sheet From Map Reduce
         * @param data {Object} - Object Data Generate Inspection Sheet
         * @param data.typeInspection {String} - Type Inspection, IQC, PQC
         * @param data.transId {String} - Transaction Id
         * @param data.transType {String} - Transaction Type
         * @returns {null}
         */
        const generateInspectionSheetMR = (data) => {
            try {
                if (data.typeInspection === CustomTypeInspection.IQC) {
                    generateInspectionResultsOfTrans(data.transType, data.transId, true);
                } else if (data.typeInspection === CustomTypeInspection.PQC) {
                    generateMFGInspectionOfTrans(data.transType, data.transId, true);
                }
            } catch (e) {
                log.error('Error generateInspectionSheetMR: ', e);
            }
        };

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

        /**
         * Des:  Create Inspection Sheet
         * @param objData {Object}
         * @param objData.body {Object} -  Body data
         * @param objData.line {Array} -  Line data
         * @returns {null}
         */
        const createInspectionSheet = (objData) => {
            let objBody = objData.body;
            // log.error("objBody");
            let arrDataInsLot = objData.line;
            let objUser = getDataObjCurrentUser();
            let curRec = record.create({type: CustomRecordType.INSPECTION_SHEET, isDynamic: true});
            lfn.setValueData(curRec, [
                'custrecord_scv_insps_sub',
                'custrecord_scv_insps_loc',
                'custrecord_scv_insps_createdfrom',
                'custrecord_scv_insps_sourcetrans',
                'custrecord_scv_insp_sheet_supplier',
                'custrecord_scv_insps_item',
                'custrecord_scv_insps_unit',
                'custrecord_scv_insps_qty',
                'custrecord_scv_insps_plan',
                'custrecord_scv_insps_orilineid'
            ], [
                objBody.subsidiary,
                objBody.location,
                objBody.transId,
                objBody.createdFrom,
                objBody.vendorId,
                objBody.item,
                objBody.unit,
                objBody.quantity,
                objBody.planId,
                objBody.oriLineId
            ]);
            const arrFieldsLine = [
                'custrecord_scv_inspl_sub',
                'custrecord_scv_inspl_loc',
                'custrecord_scv_inspl_line_lot',
                'custrecord_scv_inspl_invno',
                'custrecord_scv_inspl_invstatus',
                'custrecord_scv_inspl_bin',
                'custrecord_scv_inspl_qty',
                'custrecord_scv_inspl_expdate',
                'custrecord_scv_inspl_item',
                'custrecord_scv_inspl_manu_date',
                'custrecord_scv_inspl_shift',
                'custrecord_scv_inspl_may',
                'custrecord_scv_inspl_createdfrom',
                'custrecord_scv_inspl_source_trans',
                'custrecord_scv_inspl_createdby_e',
                'custrecord_scv_inspl_createdby'
            ];
            const sizeDataLot = arrDataInsLot.length;
            for (let i = 0; i < sizeDataLot; i++) {
                let objLine = arrDataInsLot[i];
                curRec.selectNewLine({sublistId: INSPECTION_LOT_SUBLIST_ID});
                lfn.setCurrentSublistValueData(curRec,
                    INSPECTION_LOT_SUBLIST_ID,
                    arrFieldsLine,
                    [
                        objBody.subsidiary,
                        objBody.location,
                        objLine.lineLot,
                        objLine.invNo,
                        objLine.invStatus,
                        objLine.binId,
                        objLine.qty,
                        objLine.expirationDate,
                        objBody.item,
                        objBody.mfgDate || objBody.tranDate,
                        objBody.shiftId,
                        objBody.workCenterId,
                        objBody.transId,
                        objBody.createdFrom,
                        objUser.id,
                        objUser.employee
                    ]);
                curRec.commitLine({sublistId: INSPECTION_LOT_SUBLIST_ID});
            }
            let idInspectionSheet;
            try {
                idInspectionSheet = curRec.save({ignoreMandatoryFields: true, enableSourcing: true});
            } catch (e) {
                log.error('Error createInspectionSheet_Transaction_' + objBody.transId, e);
                idInspectionSheet = null;
            }
            return idInspectionSheet;
        };

        const getDataObjCurrentUser = () => {
            let entityId = runtime.getCurrentUser().id;
            let employee = entityId;

            let entityType = lfn.getEntityType(entityId);
            if(entityType?.toLowerCase() === "partner") {
                let lkFieldsPartner = search.lookupFields({
                    type: 'partner',
                    id: entityId,
                    columns: ['custentity_scv_partner_employee']
                });
                employee = lkFieldsPartner.custentity_scv_partner_employee[0]?.value;
            }
            return { id: entityId, employee: employee };
        }

        const generateMFGInspectionOfTrans = (tranType, tranId, isAuto = true) => {
            let tranRec = record.load({type: tranType, id: tranId});
            if (isAuto && !isGenerateInspections(tranRec, false)) return;
            let arrIdInspectionSheetInactive = fetchDataSourceInspectionInactive(tranId);
            if (!validInspectionLines(tranRec, arrIdInspectionSheetInactive, 'custcol_scv_pqc_plan')) return;
            const arrItemId = getArrayItemId(tranRec);
            const arrDataItem = getDataItems(arrItemId);
            const objDataSource = getDataSourceForPQC(tranRec, arrIdInspectionSheetInactive, arrDataItem);
            const objDataMfgInspections = objDataSource.objDataMFGInspections;
            const arrLines = Object.keys(objDataMfgInspections);
            const numsLine = arrLines.length;
            if (numsLine === 0) return;
            let arrInspectionSheet = [];
            for (let i = 0; i < numsLine; i++) {
                const lineIndex = arrLines[i];
                let idInspectionSheet = createInspectionSheet(objDataSource.objDataInspectionSheet[lineIndex]);
                if (!idInspectionSheet) continue;
                tranRec.setSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_scv_insp_sheet',
                    line: lineIndex,
                    value: idInspectionSheet
                });
                const mapInspectionLotId = getDataMapLineInventoryLot(idInspectionSheet);
                objDataMfgInspections[lineIndex].forEach((o, index) => {
                    const idMfgInspection = createMFGInspection({
                        ...o, idInspectionSheet,
                        inspectionLotId: mapInspectionLotId.get(o.body.lineLot.toString())
                    });
                });
                arrInspectionSheet.push({
                    id: idInspectionSheet,
                    lineIndex: +lineIndex
                });
            }
            if (objDataSource.idInspectionNum) {
                record.submitFields({
                    type: 'customrecord_scv_inspection_number',
                    id: objDataSource.idInspectionNum,
                    values: {'custrecord_scv_in_wo_no': objDataSource.maxNum},
                    options: {ignoreMandatoryFields: true}
                });
            }
            updateInspectionSheetForLines({
                curRec: tranRec,
                type: tranType,
                id: tranId,
                arrInspectionSheetId: arrInspectionSheet,
                numRun: 1
            });
        };

        const isGenerateIQC = (tranRec, isGenerate = true) => {
            if (!isGenerate) {
                let lkOrder = search.lookupFields({
                    type: 'customrecord_scv_order_type',
                    id: orderTypeId,
                    columns: ['custrecord_scv_order_type_qc_tp']
                });
                if (!lkOrder?.custrecord_scv_order_type_qc_tp) return;
            }
            const isAutoGenQC = tranRec.getValue('custbody_scv_auto_gen_qc');
            return checked(isAutoGenQC);
        };

        const isGenerateInspections = (tranRec, isGenerateIQC = true) => {
            const orderTypeId = tranRec.getValue('custbody_scv_order_type');
            if (!orderTypeId) return;
            if (!isGenerateIQC) {
                let lkOrder = search.lookupFields({
                    type: 'customrecord_scv_order_type',
                    id: orderTypeId,
                    columns: ['custrecord_scv_order_type_qc_tp']
                });
                if (!lkOrder?.custrecord_scv_order_type_qc_tp) return;
            }
            const isAutoGenQC = tranRec.getValue('custbody_scv_auto_gen_qc');
            return checked(isAutoGenQC);
        };

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
            let curMaxNum = resultInsNum.maxNum;
            const lcItem = tranRec.getLineCount('item');
            const blCreateFromIRR = tranRec.type === record.Type.ITEM_RECEIPT;
            let objDataIQCInspections = {}, objDataInspectionSheet = {};
            for (let i = 0; i < lcItem; i++) {
                let curLine = new LoadCurrentLine(tranRec, 'item', i);
                const itemId = curLine.value('item');
                let isCheckBin = false;
                if (blCreateFromIRR) {
                    if (!checked(curLine.value('itemreceive'))) continue;
                    isCheckBin = checked(curLine.value('locationusesbins')) && arrItemUseBin.includes(itemId);
                }
                if (arrItemIdInactive.includes(itemId)) continue;
                const oriLineId = curLine.value('custcol_scv_ori_lineid');
                const inspectionPlanId = curLine.value('custcol_scv_inspection_plan');
                const blInsStarted = curLine.value('custcol_scv_inspect_started');
                const unitsId = curLine.value('units');
                const locationId = curLine.value('location');
                const quantity = curLine.value('quantity');
                const inspectionSheetId = curLine.value('custcol_scv_insp_sheet');
                if (!checked(blInsStarted) || !inspectionPlanId || (!!inspectionSheetId && !arrIdInspectionSheetInactive.includes(inspectionSheetId))) continue;
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
            const numsCustomRecord = curMaxNum - resultInsNum.maxNum + Object.keys(objDataInspectionSheet).length;
            return {
                objDataIQCInspections: objDataIQCInspections,
                idInspectionNum: resultInsNum.insNumId,
                maxNum: curMaxNum,
                numsCustomRecord: numsCustomRecord,
                objDataInspectionSheet: objDataInspectionSheet
            };
        };

        const getDataSourceForPQC = (tranRec, arrIdInspectionSheetInactive, arrDataItem) => {
            const arrItemIdInactive = arrDataItem.filter(o => o.isinactive).map(o => o.id);
            const arrItemUseBin = arrDataItem.filter(o => o.usebins).map(o => o.id);
            const createdFrom = tranRec.getValue('createdfrom');
            const subId = tranRec.getValue('subsidiary');
            const arrInsPlan = getArrPQCPlanOnLine(tranRec);
            const arrInsFields = getElementInsFields({
                arrInsPlan: arrInsPlan,
                productStage: CustomProductStageId.PQC,
                recordType: tranRec.type,
                createFromItemReceipt: 'T'
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
            let isTransItemReceipt = record.Type.ITEM_RECEIPT === tranRec.type;
            const yearMonth = dateToMMYY(tranDate);
            const resultInsNum = getMaxNumberMFGInspection(subId, yearMonth);
            let curMaxNum = resultInsNum.maxNum;
            const lcItem = tranRec.getLineCount('item');
            let objDataMFGInspections = {}, objDataInspectionSheet = {};
            for (let i = 0; i < lcItem; i++) {
                let curLine = new LoadCurrentLine(tranRec, 'item', i);
                const itemId = curLine.value('item');
                let isCheckBin = false;
                if (isTransItemReceipt) {
                    const itemreceipt = curLine.value('itemreceive');
                    if (!checked(itemreceipt)) continue;
                    const locationusesbins = curLine.value('locationusesbins');
                    isCheckBin = checked(locationusesbins) && arrItemUseBin.includes(itemId);
                }
                const pqcPlanId = curLine.value('custcol_scv_pqc_plan');
                if (arrItemIdInactive.includes(itemId)) continue;
                const unitsId = curLine.value('units');
                const locationId = curLine.value('location');
                const quantity = curLine.value('quantity');
                const blInsStarted = curLine.value('custcol_scv_inspect_started');
                const inspectionSheetId = curLine.value('custcol_scv_insp_sheet');
                const oriLineId = curLine.value('custcol_scv_ori_lineid');
                if (!checked(blInsStarted) || !pqcPlanId || (!!inspectionSheetId && !arrIdInspectionSheetInactive.includes(inspectionSheetId))) continue;
                let sampleQty = curLine.value('custcol_scv_sample_qty') * 1;
                if (sampleQty <= 0) sampleQty = 1;
                const arrDataLineInsFields = arrInsFields.filter(o => o.insPlan === pqcPlanId);
                if (tranRec.type === 'workorder') {
                    if (arrDataLineInsFields.length === 0) continue;
                }
                const arrDataMFGInsLine = getDataCreateMFGInspection({
                    newRecord: tranRec,
                    lineIndex: i,
                    createdFrom: createdFrom,
                    arrDataLineInsFields: arrDataLineInsFields,
                    objSub: objSub,
                    isCheckBin : isCheckBin
                });
                if (arrDataMFGInsLine.length === 0) continue;
                const objDataMFGInspectionsLine = getDataInspectionsBySampleQuantity({
                    arrDataInspections: arrDataMFGInsLine,
                    sampleQty: sampleQty,
                    objDataInsNum: resultInsNum,
                    curMaxNum: curMaxNum
                });
                curMaxNum = objDataMFGInspectionsLine.maxNum;
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
                        planId: pqcPlanId,
                        transId: tranRec.id,
                        oriLineId: oriLineId,
                        department: department
                    },
                    line: arrDataMFGInsLine.map(o => ({
                        invNo: o.body.invNumberId,
                        invStatus: o.body.statusId,
                        binId: o.body.binId,
                        qty: o.body.qty,
                        lineLot: o.body.lineLot,
                        expirationDate: o.body.expirationDate,
                    }))
                };
                objDataMFGInspections[i] = objDataMFGInspectionsLine.data;
            }
            const numsCustomRecord = curMaxNum - resultInsNum.maxNum + Object.keys(objDataInspectionSheet).length;
            return {
                objDataMFGInspections: objDataMFGInspections,
                idInspectionNum: resultInsNum.insNumId,
                maxNum: curMaxNum,
                numsCustomRecord: numsCustomRecord,
                objDataInspectionSheet: objDataInspectionSheet
            };
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

        const getMaxNumberMFGInspection = (subsidiary, monthYear) => {
            let result = {maxNum: null, insNumId: null, prefixDocNum: null};
            const columns = [
                'custrecord_scv_in_subsidiary_prefix',
                'custrecord_scv_in_wo_prefix',
                'custrecord_scv_in_wo_no',
            ];
            const sVN = searchInspectionNumber(subsidiary, columns, monthYear);
            if (sVN === null) return result;
            const prefixDocNum = sVN.getValue('custrecord_scv_in_subsidiary_prefix') + '.' + sVN.getValue('custrecord_scv_in_wo_prefix') + '.' + monthYear + '.';
            result.maxNum = +sVN.getValue('custrecord_scv_in_wo_no') || 0;
            result.prefixDocNum = prefixDocNum;
            result.insNumId = sVN.id;
            return result;
        };

        /**
         * Des: Create MFG Inspection
         * @param options
         * @param options.body {Object} -  Body
         * @param options.line {Array} -  Line
         * @param options.docNum {String} -  Doc Number
         * @param options.idInspectionSheet {String} -  Id Inspection Sheet
         * @returns {*}
         */
        const createMFGInspection = (options) => {
            const {
                body,
                line,
                docNum,
                idInspectionSheet,
                inspectionLotId
            } = options;
            let recMFGInspection = record.create({type: 'customrecord_scv_inspection_reswo_tb', isDynamic: true});
            const sublistIdMFG = 'recmachcustrecord_scv_irw_irwt';
            const lineCols = [
                'custrecord_scv_mfg_insplot',
                'custrecord_scv_mfg_insp_sheet',
                'custrecord_scv_irw_inv_no', 'custrecord_scv_irw_workorder', 'custrecord_scv_irw_assembly', 'custrecord_scv_irw_qty_tested',
                'custrecord_scv_irw_inspection_plan', 'custrecord_scv_irw_inspection_field', 'custrecord_scv_irw_test_methods',
                'custrecord_scv_irw_test_desc', 'custrecord_scv_mfg_ird_subsidiary', 'custrecord_scv_irwt_sequences', 'custrecord_scv_irwt_isp_type',
                'custrecord_scv_irwt_isp_type2', 'custrecord_scv_irwt_isp_type3'
            ];
            const bodyFields = [
                'custrecord_scv_mfg_sample_no',
                'custrecord_scv_mfg_insp_lot',
                'custrecord_scv_irwt_line_lot',
                'custrecord_scv_irwt_insp_sheet',
                'custrecord_scv_irwt_assembly',
                'custrecord_scv_assembly_disname',
                'custrecord_scv_product_unit_mfg', 'custrecord_scv_irwt_inspection_plan', 'custrecord_scv_mfg_ir_subsidiary',
                'custrecord_scv_mfg_location', 'custrecord_scv_irwt_sampling_place',
                'custrecord_scv_mqc_wo', 'custrecord_scv_irwt_workorder',
                'custrecord_scv_mfg_inspect_qty_abs_lot', 'custrecord_scv_passed_quantity', 'custrecord_scv_assembly_lot',
                'custrecord_scv_mfg_inspection_bin', 'custrecord_scv_if_wo_inspection_no'
            ];
            lfn.setValueData(recMFGInspection, bodyFields, [
                body.inspectionNum,
                inspectionLotId,
                body.lineLot,
                idInspectionSheet,
                body.item,
                body.description,
                body.units,
                body.pqcPlanId,
                body.subId,
                body.locId,
                body.locText,
                body.transId,
                body.createdFromId,
                body.invNumberId,
                body.qty,
                body.lotNumDisplay,
                body.binId,
                docNum
            ]);
            const lineCount = line.length;
            for (let i = 0; i < lineCount; i++) {
                const objLine = line[i];
                recMFGInspection.selectNewLine({sublistId: sublistIdMFG});
                lfn.setCurrentSublistValueData(recMFGInspection, sublistIdMFG, lineCols, [
                    inspectionLotId, idInspectionSheet,
                    body.invNumberId,
                    body.transId,
                    objLine.item, body.sampleQty, body.pqcPlanId, objLine.insFldId, objLine.insFldMethod, objLine.insFldDesc, body.subId, objLine.insFldSequence, objLine.insFldInsMethod, objLine.insFldInsTypeL2, objLine.insFldInsTypeL3, docNum]);
                recMFGInspection.commitLine({sublistId: sublistIdMFG});
            }
            try {
                return recMFGInspection.save({ignoreMandatoryFields: true});
            } catch (e) {
                log.error('createMFGInspection_' + idInspectionSheet, e);
            }
            return null;
        }

        const getDataCreateMFGInspection = (options) => {
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
            const lcInsFld = arrDataLineInsFields.length;
            const subId = newRecord.getValue('subsidiary');
            const item = curLine.value('item');
            const locText = curLine.text('location');
            const locId = curLine.value('location');
            const description = curLine.value('description');
            const quantityLine = curLine.value('quantity');
            const pqcPlanId = curLine.value('custcol_scv_pqc_plan');
            const lineUnitsId = curLine.value('units');
            const sampleQty = curLine.value('custcol_scv_sample_qty') * 1 || 0;
            const slIVD = 'inventoryassignment';
            let objBodyStd = {
                item,
                description,
                statusId: '',
                units: lineUnitsId,
                pqcPlanId, subId,
                locId,
                locText,
                createdFromId: createdFrom,
                transId: newRecord.id,
                invNumberId: '',
                lotNumDisplay: '',
                qty: quantityLine,
                binId: '',
                sampleQty: sampleQty,
                lineLot: 1 // Default Line Lot Index
            };
            if (!lineHasInvDetail(newRecord, 'item', lineIndex)) return [{body: objBodyStd, line: []}];
            let recSub = newRecord.getSublistSubrecord({
                sublistId: 'item',
                fieldId: 'inventorydetail',
                line: lineIndex
            });
            const lcIVD = recSub.getLineCount(slIVD);
            for (let idxDet = 0; idxDet < lcIVD; idxDet++) {
                let objInspection = {body: {}, line: []};
                let curLineInvDet = new LoadCurrentLine(recSub, slIVD, idxDet);
                const numberedRecordId = curLineInvDet.value('numberedrecordid');
                const receiptInventoryNumber = curLineInvDet.value('receiptinventorynumber');
                const issueInventoryNumber = curLineInvDet.value('issueinventorynumber');
                const lotNumDisplay = receiptInventoryNumber || issueInventoryNumber;
                const expirationDate = curLineInvDet.value('expirationdate');
                const quantityLot = curLineInvDet.value('quantity');
                const statusId = curLineInvDet.value('inventorystatus');
                if (statusId !== CustomStatusLot.PENDING_INSPECTION ) continue;
                const binnumber = curLineInvDet.value('binnumber') || '';
                if (isCheckBin && !binnumber) continue;
                objInspection.body = {
                    ...objBodyStd,
                    invNumberId: numberedRecordId,
                    lotNumDisplay: lotNumDisplay,
                    qty: quantityLot,
                    statusId: statusId,
                    expirationDate: expirationDate,
                    binId: binnumber,
                    lineLot: idxDet + 1
                };
                if (objSub.addInspectionPlanLine) {
                    for (let j = 0; j < lcInsFld; j++) {
                        const objInsFld = arrDataLineInsFields[j];
                        objInspection.line.push({
                            insFldId: objInsFld.id,
                            insFldMethod: objInsFld.method,
                            insFldDesc: objInsFld.description,
                            insFldSequence: objInsFld.sequence,
                            insFldInsMethod: objInsFld.insMethod,
                            insFldInsTypeL2: objInsFld.insTypeL2,
                            insFldInsTypeL3: objInsFld.insTypeL3
                        });
                    }
                }
                arrDataIns.push(objInspection);
            }
            return arrDataIns;
        };


        const validInspectionLines = (tranRec, arrIdInspectionSheetInactive, fldIdPlanTypeQC) => {
            const lc = tranRec.getLineCount('item');
            for (let i = 0; i < lc; i++) {
                const planTypeId = tranRec.getSublistValue({sublistId: 'item', fieldId: fldIdPlanTypeQC, line: i});
                const inspectionSheet = tranRec.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_scv_insp_sheet',
                    line: i
                });
                if (!!planTypeId && (!inspectionSheet || arrIdInspectionSheetInactive.includes(inspectionSheet))) return true;
            }
            return false;
        }

        const getArrPQCPlanOnLine = (tranRec) => {
            const arrInsPlan = [];
            let isItemReceipt = tranRec.type === record.Type.ITEM_RECEIPT;
            const lcItem = tranRec.getLineCount('item');
            for (let i = 0; i < lcItem; i++) {
                if (isItemReceipt) {
                    const itemreceive = tranRec.getSublistValue({sublistId: 'item', fieldId: 'itemreceive', line: i});
                    if (!checked(itemreceive)) continue;
                }
                const pqcPlanId = tranRec.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_scv_pqc_plan',
                    line: i
                });
                if (!!pqcPlanId && arrInsPlan.indexOf(pqcPlanId) === -1) arrInsPlan.push(pqcPlanId);
            }
            return arrInsPlan;
        };

        const generateInspectionResultsOfTrans = (tranType, tranId, isAuto = true) => {
            let tranRec = record.load({type: tranType, id: tranId});
            if (isAuto && !isGenerateIQC(tranRec)) return;
            let arrIdInspectionSheetInactive = fetchDataSourceInspectionInactive(tranId);
            if (!validInspectionLines(tranRec, arrIdInspectionSheetInactive, 'custcol_scv_inspection_plan')) return;
            const arrItemId = getArrayItemId(tranRec);
            const arrDataItem = getDataItems(arrItemId);
            const objDataSource = getDataSourceForIQC(tranRec, arrIdInspectionSheetInactive, arrDataItem);
            const objDataIQCInspections = objDataSource.objDataIQCInspections;
            const arrLines = Object.keys(objDataIQCInspections);
            const numsLine = arrLines.length;
            if (numsLine === 0) return;
            let arrInspectionSheet = [];
            for (let i = 0; i < numsLine; i++) {
                const lineIndex = arrLines[i];
                let idInspectionSheet = createInspectionSheet(objDataSource.objDataInspectionSheet[lineIndex]);
                if (!idInspectionSheet) continue;
                tranRec.setSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_scv_insp_sheet',
                    line: lineIndex,
                    value: idInspectionSheet
                });
                const mapInspectionLotId = getDataMapLineInventoryLot(idInspectionSheet);
                objDataIQCInspections[lineIndex].forEach((o, index) => {
                    const idIQCInspection = createIQCInspection({
                        ...o, idInspectionSheet,
                        inspectionLotId: mapInspectionLotId.get(o.body.lineLot.toString())
                    });
                });
                arrInspectionSheet.push({
                    id: idInspectionSheet,
                    lineIndex: +lineIndex
                });
            }

            if (objDataSource.idInspectionNum) {
                record.submitFields({
                    type: 'customrecord_scv_inspection_number',
                    id: objDataSource.idInspectionNum,
                    values: {'custrecord_scv_in_input_no': objDataSource.maxNum},
                    options: {ignoreMandatoryFields: true}
                });
            }

            updateInspectionSheetForLines({
                curRec: tranRec,
                type: tranType,
                id: tranId,
                arrInspectionSheetId: arrInspectionSheet,
                numRun: 1
            });
        };

        /**
         * Des: Update Inspection Sheet for Line Transaction
         * @param options {Object}
         * @param options.curRec {Record} - Transaction Record
         * @param options.type {String} - Transaction type
         * @param options.id {String} - Transaction id
         * @param options.numRun {Number} - Number run function
         * @param options.arrInspectionSheetId {Array} - Data Line Inspection Sheet
         */
        const updateInspectionSheetForLines = (options) => {
            if (options.numRun > 5) return;
            let curRec = options.curRec;
            const szInsSheet = options.arrInspectionSheetId;
            for (let i = 0; i < szInsSheet; i++) {
                const objData = options.arrInspectionSheetId[i];
                curRec.setSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_scv_insp_sheet',
                    line: objData.lineIndex,
                    value: objData.id
                });
            }
            try {
                curRec.save({ignoreMandatoryFields: true});
            } catch (e) {
                log.error(`Error Run updateInspectionSheetForLines_${options.type}_${options.id}`, options.numRun);
                log.audit('updateInspectionSheetForLines_' + options.numRun, {
                    run: options.numRun,
                    arrInspectionSheetId: options.arrInspectionSheetId
                });
                updateInspectionSheetForLines({
                    curRec: record.load({
                        type: options.type,
                        id: options.id
                    }),
                    type: options.type,
                    id: options.id,
                    arrInspectionSheetId: options.arrInspectionSheetId,
                    numRun: options.numRun + 1
                });
            }
        };


        const getIdProductStageFilter = (transType) => {
            if (transType === record.Type.WORK_ORDER) return CustomProductStageId.PQC;
            return CustomProductStageId.IQC;
        };

        const createIQCInspection = (options) => {
            const {
                body,
                line,
                docNum,
                idInspectionSheet,
                inspectionLotId
            } = options;
            let recIRT = record.create({type: 'customrecord_scv_inspection_result_tb', isDynamic: true});
            const slIRT = 'recmachcustrecord_scv_ir_irt';
            const lineCols = [
                'custrecord_scv_ir_insp_lot',
                'custrecord_scv_ir_insp_sheet',
                'custrecord_scv_irt_inv_no',
                'custrecord_scv_ir_line_nr', 'custrecord_scv_ir_item_number', 'custrecord_scv_ir_inspect_plan', 'custrecord_scv_ir_inspect_tdesc'
                , 'custrecord_scv_ir_qty_tested', 'custrecord_scv_ir_lot_number', 'custrecord_scv_ir_inspect_field', 'custrecord_scv_ir_test_methods',
                'custrecord_scv_iird_subsidiary', 'custrecord_scv_ir_inspect_method', 'custrecord_scv_ir_test_type', 'custrecord_scv_irt_sequences',
                'custrecord_scv_ir_receipt_no', 'custrecord_scv_ir_purchase_order',
                'custrecord_scv_ir_insp_document'
            ];
            const bodyFields = [
                'custrecord_scv_irt_sample_no',
                'custrecord_scv_irt_insp_lot',
                'custrecord_scv_irt_line_lot',
                'custrecord_scv_irt_insp_sheet',
                'custrecord_scv_irt_inspection_plan', 'custrecord_scv_irt_item', 'custrecord_scv_irt_lot_number', 'custrecord_scv_irt_subsidiary',
                'custrecord_scv_irt_receipt_qty', 'custrecord_scv_irt_inspect_require',
                'custrecord_scv_irt_packaging_qty', 'custrecord_scv_irt_supplier_lot', 'custrecord_scv_irt_supplier_mfg_date',
                'custrecord_scv_irt_expiration_date', 'custrecord_scv_irt_inentory_number', 'custrecord_scv_irt_manufacturer',
                'custrecord_scv_irt_receipt_from', 'custrecord_scv_irt_receipt_no',
                'custrecord_scv_irt_lot_unit', 'custrecord_scv_irt_receiptno_line_id', 'custrecord_scv_itr_bins', 'custrecord_scv_irt_ori_id',
                'custrecord_scv_irt_sampling_place', 'custrecord_scv_irt_location', 'custrecord_scv_irt_supplier', 'custrecord_scv_irt_inspect_number',
                'custrecord_scv_qc_quantity'
            ];
            lfn.setValueData(recIRT, bodyFields, [
                body.inspectionNum,
                inspectionLotId,
                body.lineLot, idInspectionSheet, body.planId,
                body.item, body.lotNumberDisplay, body.subId,
                body.kitLineId, body.qty, body.poLinePackaging,
                body.supplierLot, body.supplierMfgDate, body.expirationDate,
                body.invNumberId, body.manufacturer, body.tranId, body.createdFrom,
                body.units, body.lineNo, body.binId, body.oriLineId, body.locText,
                body.locId, body.entityId, docNum,
                body.qty
            ]);
            const lcLine = line.length;
            for (let i = 0; i < lcLine; i++) {
                const objLine = line[i];
                recIRT.selectNewLine({sublistId: slIRT});
                lfn.setCurrentSublistValueData(recIRT, slIRT, lineCols, [
                    inspectionLotId, idInspectionSheet, body.invNumberId, objLine.lineIndex, body.item, body.planId, objLine.insFldDesc, body.sampleQty, body.lotNumberDisplay, objLine.insFldId, objLine.insFldMethod, body.subId, objLine.insFldInsMethod, objLine.insFldTestType, objLine.insFldSequence, body.createdFrom, body.tranId, docNum]);
                recIRT.commitLine({sublistId: slIRT});
            }
            return recIRT.save({ignoreMandatoryFields: true});
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

        /**
         * Des : Get Element Inspection Fields
         * @param options
         * @param options.recordType {String} -  Record Type
         * @param options.arrInsPlan {Array} -  array of inspection plan
         * @param options.productStage {String} -  product stage id
         * @param options.createFromItemReceipt {String} -  Create From item receipt
         * @returns {{ sequence: *, method: *, insMethod: *, description: *, testType: *, insPlan: *, id: *, subsidiary: * }[]|*[]}
         */
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

        /**
         * Des : Get Data Map Line Inventory Lot
         * @param id
         * @returns {Map}
         */
        const getDataMapLineInventoryLot = (id) => {
            let curRec = record.load({type: CustomRecordType.INSPECTION_SHEET, id: id});
            let mapIdInspectionLot = new Map();
            let lc = curRec.getLineCount(INSPECTION_LOT_SUBLIST_ID);
            for (let i = 0; i < lc; i++) {
                const inspectionLotId = curRec.getSublistValue(INSPECTION_LOT_SUBLIST_ID, 'id', i);
                const lineLot = curRec.getSublistValue(INSPECTION_LOT_SUBLIST_ID, 'custrecord_scv_inspl_line_lot', i);
                mapIdInspectionLot.set(lineLot.toString(), inspectionLotId);
            }
            return mapIdInspectionLot;
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
            createInspectionNumber(subsidiary, monthYear);
            return searchInspectionNumber(subsidiary, columns, monthYear);
        };

        const createInspectionNumber = (subsidiary, monthYear) => {
            let lkSub = search.lookupFields({type: 'subsidiary', id: subsidiary, columns: ['name']});
            let recDocNum = record.create({type: 'customrecord_scv_inspection_number'});
            recDocNum.setValue('name', lkSub.name);
            recDocNum.setValue('custrecord_scv_in_year_month', monthYear);
            recDocNum.setValue('custrecord_scv_in_subsidiary', subsidiary);
            recDocNum.save({enableSourcing: false, ignoreMandatoryFields: true});
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

        const dateToMMYY = (date) => (date.getMonth() + 1).toString().padStart(2, '2') + date.getFullYear().toString().substring(2, 4)

        const checked = (value) => {
            if (typeof value === 'boolean') return value;
            return value === 'T' || value === 'true';
        };

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

        return {
            searchInspectionNumber: searchInspectionNumber,
            dateToMMYY: dateToMMYY,
            checked: checked,
            generateInspectionResultsOfTrans: generateInspectionResultsOfTrans,
            generateMFGInspectionOfTrans: generateMFGInspectionOfTrans,
            validInspectionLines: validInspectionLines,
            createInspectionSheet: createInspectionSheet,
            fetchDataSourceInspectionInactive: fetchDataSourceInspectionInactive,
            getDataMapLineInventoryLot: getDataMapLineInventoryLot,
            generateInspectionSheetMR: generateInspectionSheetMR,
            getMaxNumberMFGInspection: getMaxNumberMFGInspection,
            getDataInspectionsBySampleQuantity: getDataInspectionsBySampleQuantity,
            CUSTOM_STATUS_LOT : CustomStatusLot
        };

    });