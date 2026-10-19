/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/redirect', '../lib/scv_lib_function', '../lib/scv_lib_qaqc'],
    function (record, search, redirect, lfunc, lqc) {
        const PRODUCTION_STAGE_PQC = '5';
        const createInspectionSheet = (parameters) => {
            const createdfromid = parameters.createdfromid;
            const rectype = parameters.createdrectype;
            let curRec = record.load({type: rectype, id: createdfromid});
            const productionStage = PRODUCTION_STAGE_PQC;
            let quantitySample = curRec.getValue('custbody_scv_inspect_sample_qty');
            if (quantitySample === '' || quantitySample === null || quantitySample * 1 < 0) {
                throw 'Error Quantity Tested! Please input value!';
            }
            quantitySample = +quantitySample;
            let inspectionSheetIdOld = curRec.getValue('custbody_scv_insp_sheet');
            if (!!inspectionSheetIdOld) {
                const isinactive = search.lookupFields({
                    type: 'customrecord_scv_inspection_sheet',
                    id: inspectionSheetIdOld,
                    columns: ['isinactive']
                }).isinactive;
                if (!isinactive) throw 'Assembly Build has created Inspection Sheet! Don\'t create another Inspection Sheet!';
            }
            let inspectStarted = curRec.getValue('custbody_scv_inspection_started');
            if (!lfunc.isTrue(inspectStarted)) {
                throw 'Please check Inspection Started!'
            }
            let inspectionPlanId = curRec.getValue('custbody_scv_inspect_plan_assy');
            const item = curRec.getValue('assemblyitem') || curRec.getValue('item');
            let lkItem = search.lookupFields({
                type: lfunc.getItemRecordType(item),
                id: item,
                columns: ['custitem_scv_inspection_plan',]
            });
            if (!lfunc.isContainValue(inspectionPlanId)) inspectionPlanId = lkItem.custitem_scv_inspection_plan?.[0]?.value || '';
            if (!inspectionPlanId) {
                throw 'Not found Inspection Plan!';
            }
            const arrDataInsFields = fetchDataInspectionFields(inspectionPlanId, productionStage);
            const {
                curMaxNum,
                arrDataMfgInspection,
                inspectionSheet,
                insNumId
            } = getDataSourceForPQC(curRec, arrDataInsFields, productionStage, quantitySample);
            let inspectionSheetId = lqc.createInspectionSheet(inspectionSheet);
            const mapInspectionLotId = lqc.getDataMapLineInventoryLot(inspectionSheetId);
            const szMFGIns = arrDataMfgInspection.length;
            for (let i = 0; i < szMFGIns; i++) {
                let inspectionPQCId = createMFGInspection({
                    ...arrDataMfgInspection[i],
                    inspectionSheetId,
                    inspectionLotId: mapInspectionLotId.get(arrDataMfgInspection[i].body.lineLot.toString())
                });
            }
            setDataStoreDocNumInspectionNumber({
                id: insNumId,
                curMaxNum: curMaxNum
            });
            if (inspectionSheetId) {
                record.submitFields({
                    type: rectype,
                    id: createdfromid,
                    values: {custbody_scv_insp_sheet: inspectionSheetId},
                    options: {enableSourcing: false, ignoreMandatoryFields: true}
                });
            }
            return inspectionSheetId;
        };

        const getDataSourceForPQC = (curRec, arrDataInsFields, productStage, quantitySample) => {
            let id = curRec.id;
            const inspectionPlanId = curRec.getValue('custbody_scv_inspect_plan_assy');
            const subsidiary = curRec.getValue('subsidiary');
            const unitId = curRec.getValue('units');
            const trandate = curRec.getValue('trandate');
            const mfgDate = curRec.getValue("custbody_scv_mfg_date");
            const shiftId = curRec.getValue('custbody_scv_shift');
            const workCenterId = curRec.getValue('custbody_mfgmob_workcenter');
            const location = curRec.getValue('location');
            const quantity = curRec.getValue('quantity');
            const createdfrom = curRec.getValue('createdfrom');
            const department = curRec.getValue('department');
            const item = curRec.getValue('assemblyitem') || curRec.getValue('item');
            const oriLineId = curRec.getValue("custbody_scv_oriline_id");

            const yearMonth = lfunc.makePrefix(trandate.getMonth() + 1, 2, '0') + trandate.getFullYear().toString().substring(2, 4);
            const resultInsNum = lqc.getMaxNumberMFGInspection(subsidiary, yearMonth);
            let curMaxNum = resultInsNum.maxNum;
            let arrDataMFGIns = getDataCreateMFGInspection(curRec, arrDataInsFields, inspectionPlanId, productStage);
            const objDataMFGInspectionsLine = lqc.getDataInspectionsBySampleQuantity({
                arrDataInspections: arrDataMFGIns,
                sampleQty: quantitySample,
                objDataInsNum: resultInsNum,
                curMaxNum: curMaxNum
            });
            curMaxNum = objDataMFGInspectionsLine.maxNum;
            const dataInspectionSheet = {
                body: {
                    subsidiary: subsidiary,
                    location: location,
                    createdFrom: createdfrom,
                    transId: id,
                    vendorId: '',
                    item: item,
                    unit: unitId,
                    quantity: quantity,
                    planId: inspectionPlanId,
                    oriLineId: oriLineId,
                    department: department,
                    tranDate : trandate,
                    mfgDate: mfgDate,
                    shiftId : shiftId,
                    workCenterId : workCenterId,
                }
                ,
                line: arrDataMFGIns.map(o => ({
                    invNo: o.body.lotNumber,
                    invStatus: o.body.statusId,
                    binId: o.body.binId,
                    qty: o.body.qty,
                    lineLot: o.body.lineLot,
                }))
            };
            return {
                insNumId: resultInsNum.insNumId,
                curMaxNum: curMaxNum,
                arrDataMfgInspection: objDataMFGInspectionsLine.data,
                inspectionSheet: dataInspectionSheet
            };
        };

        const getDataCreateMFGInspection = (curRec, arrDataInsFields, inspectionPlanId, productStage) => {
            const unitId = curRec.getValue('units');
            const subsidiary = curRec.getValue('subsidiary');
            const location = curRec.getValue('location');
            const quantity = curRec.getValue('quantity');
            const locationDisplay = curRec.getText('location');
            let lkSub = search.lookupFields({
                type: 'subsidiary',
                id: subsidiary,
                columns: ['custrecord_scv_sub_qc_insp_plan_line']
            });
            const isAddLineInspection = lkSub.custrecord_scv_sub_qc_insp_plan_line;
            const item = curRec.getValue('assemblyitem') || curRec.getValue('item');
            let tankName = curRec.getValue('custbody_scv_bin_of_mfg');
            let createdfrom = curRec.getValue('createdfrom');
            const szInsNum = arrDataInsFields.length;
            const objBodyStd = {
                transId: curRec.id.toString(),
                item,
                planId: inspectionPlanId,
                stageWOID: productStage,
                subId: subsidiary,
                createdFromId: createdfrom,
                tankName: tankName,
                unitId,
                quantityAB: quantity,
                locText: locationDisplay,
                locId: location,
                lineLot: 1,
                inspectionNum: 1
            };
            if (curRec.type === 'workorder') return [{body: objBodyStd, line: []}];
            let curInvDet = curRec.getSubrecord({fieldId: 'inventorydetail'});
            const slIdInvDet = 'inventoryassignment';
            let lc = curInvDet.getLineCount({sublistId: 'inventoryassignment'});
            let arrDataIns = [];
            for (let i = 0; i < lc; i++) {
                let objInspection = {body: {}, line: []};
                const lotNumber = curInvDet.getSublistValue({
                    sublistId: slIdInvDet,
                    fieldId: 'numberedrecordid',
                    line: i
                });
                const receiptinventorynumber = curInvDet.getSublistValue({
                    sublistId: slIdInvDet,
                    fieldId: 'receiptinventorynumber',
                    line: i
                });
                const issueinventorynumber = curInvDet.getSublistValue({
                    sublistId: slIdInvDet,
                    fieldId: 'issueinventorynumber',
                    line: i
                });
                const lotNumText = issueinventorynumber || receiptinventorynumber;
                const binnumber = curInvDet.getSublistValue({sublistId: slIdInvDet, fieldId: 'binnumber', line: i});
                const statusId = curInvDet.getSublistValue({
                    sublistId: slIdInvDet,
                    fieldId: 'inventorystatus',
                    line: i
                });
                if (lqc.CUSTOM_STATUS_LOT.PENDING_INSPECTION !== statusId) continue;
                const quantityLot = curInvDet.getSublistValue({sublistId: slIdInvDet, fieldId: 'quantity', line: i});
                objInspection.body = {
                    ...objBodyStd,
                    qty: quantityLot,
                    lotNumber: lotNumber,
                    binId: binnumber,
                    statusId: statusId,
                    lotNumText: lotNumText,
                    lineLot: i + 1,
                    // inspectionNum: 1
                };
                if (isAddLineInspection) {
                    for (let j = 0; j < szInsNum; j++) {
                        const objInsFields = arrDataInsFields[j];
                        objInspection.line.push({
                            insFldId: objInsFields.id,
                            insFldTestMethod: objInsFields.testMethod,
                            insFldDes: objInsFields.testDes,
                            insFldSequence: objInsFields.sequence,
                            insFldMethod: objInsFields.insMethod,
                            insFldType2: objInsFields.insTypeL2,
                            insFldTypeL3: objInsFields.insTypeL3
                        });
                    }
                }
                arrDataIns.push(objInspection);
            }
            return arrDataIns;
        };

        const createMFGInspection = (options) => {
            const {body, line, docNum, inspectionSheetId, inspectionLotId} = options;
            let recMFGInspection = record.create({type: 'customrecord_scv_inspection_reswo_tb', isDynamic: true});
            const sublistIdMFG = 'recmachcustrecord_scv_irw_irwt';
            const lineCols = [
                'custrecord_scv_mfg_insplot',
                'custrecord_scv_mfg_insp_sheet',
                'custrecord_scv_irw_workorder', 'custrecord_scv_irw_assembly', 'custrecord_scv_irw_qty_tested'
                , 'custrecord_scv_irw_inspection_plan', 'custrecord_scv_irw_inspection_field'
                , 'custrecord_scv_irw_test_methods', 'custrecord_scv_irw_test_desc', 'custrecord_scv_mfg_ird_subsidiary'
                , 'custrecord_scv_if_line_wo_inspct_number', 'custrecord_scv_irwt_sequences', 'custrecord_scv_irwt_isp_type'
                , 'custrecord_scv_irwt_isp_type2', 'custrecord_scv_irwt_isp_type3'
            ];
            const bodyFields = [
                'custrecord_scv_mfg_sample_no',
                'custrecord_scv_mfg_insp_lot',
                'custrecord_scv_irwt_insp_sheet',
                'custrecord_scv_irwt_workorder', 'custrecord_scv_irwt_assembly', 'custrecord_scv_irwt_inspection_plan',
                'custrecord_scv_production_stage', 'custrecord_scv_mfg_ir_subsidiary', 'custrecord_scv_if_wo_inspection_no',
                'custrecord_scv_irwt_quantity_test_h', 'custrecord_scv_irwt_tank_name', 'custrecord_scv_product_unit_mfg',
                'custrecord_scv_irwt_sampling_place', 'custrecord_scv_mfg_location', 'custrecord_scv_mfg_inspect_qty_abs_lot',
                'custrecord_scv_mfg_inspection_bin'
            ];
            lfunc.setValueData(recMFGInspection, bodyFields, [body.inspectionNum, inspectionLotId, inspectionSheetId, body.transId, body.item, body.planId, body.stageWOID, body.subId, docNum, body.qty, body.tankName, body.unitId, body.locText, body.locId, body.lotNumber, body.binId]);
            const lineCount = line.length;
            for (let i = 0; i < lineCount; i++) {
                const objLine = line[i];
                recMFGInspection.selectNewLine({sublistId: sublistIdMFG});
                lfunc.setCurrentSublistValueData(recMFGInspection, sublistIdMFG, lineCols, [
                    inspectionLotId,
                    inspectionSheetId,
                    body.transId,
                    body.item,
                    body.qty,
                    body.planId,
                    objLine.insFldId,
                    objLine.insFldTestMethod,
                    objLine.insFldDes,
                    body.subId,
                    docNum,
                    objLine.insFldSequence,
                    objLine.insFldMethod,
                    objLine.insFldType2,
                    objLine.insFldTypeL3
                ]);
                recMFGInspection.commitLine({sublistId: sublistIdMFG});
            }
            try {
                return recMFGInspection.save({ignoreMandatoryFields: true});
            } catch (e) {
                log.error('createMFGInspection ', e);
            }
            return null;
        };

        const fetchDataInspectionFields = (insPlan, productStage) => {
            if (!insPlan || !productStage) return [];
            let f = [['custrecord_scv_if_inspec_plan', 'anyof', insPlan], 'and', ['custrecord_scv_if_production_stage', 'anyof', productStage]];
            let c = [
                'custrecord_scv_if_test_description', 'custrecord_scv_if_test_method',
                {
                    name: 'custrecord_scv_ip_subsidiary',
                    join: 'custrecord_scv_if_inspec_plan'
                }, {name: 'custrecord_scv_if_sequence', sort: 'ASC'},
                'custrecord_scv_if_inspec_method', 'custrecord_scv_if_inspection_type_l2',
                'custrecord_scv_if_inspection_type_l3', 'internalid',
                'custrecord_scv_if_inspec_plan'
            ];
            let s = search.create({type: 'customrecord_scv_inspection_field', filters: f, columns: c});
            let r = s.run().getRange({start: 0, end: 1000});
            const cols = s.columns;
            if (r.length === 0) return [];
            const len = r.length;
            let arrData = [];
            for (let i = 0; i < len; i++) {
                arrData.push({
                    testDes: r[i].getValue(cols[0]),
                    testMethod: r[i].getValue(cols[1]),
                    subId: r[i].getValue(cols[2]),
                    sequence: r[i].getValue(cols[3]),
                    insMethod: r[i].getValue(cols[4]),
                    insTypeL2: r[i].getValue(cols[5]),
                    insTypeL3: r[i].getValue(cols[6]),
                    id: r[i].getValue(cols[7]),
                });
            }
            return arrData;
        };

        /**
         * Des: To Store Document Number
         * @param options {Object}
         * @param options.id {String} - Id Inspection Number
         * @param options.curMaxNum {Number} - Number Inspection!
         */
        const setDataStoreDocNumInspectionNumber = (options) => {
            record.submitFields({
                type: 'customrecord_scv_inspection_number',
                id: options.id,
                values: {custrecord_scv_in_wo_no: options.curMaxNum},
                options: {enableSourcing: false, ignoreMandatoryFields: true}
            });
        };

        const onRequest = (context) => {
            let request = context.request;
            let parameters = request.parameters;
            let inspectionSheetId = createInspectionSheet(parameters);
            redirect.toRecord({type: 'customrecord_scv_inspection_sheet', id: inspectionSheetId});
        };

        return {
            onRequest: onRequest
        };

    })
;