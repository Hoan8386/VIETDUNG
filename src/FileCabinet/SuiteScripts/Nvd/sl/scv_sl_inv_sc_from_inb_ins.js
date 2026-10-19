/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(
    [
        "N/ui/serverWidget",
        "N/search",
        "N/runtime",
        "N/record",
        'N/format'
    ],
    function (
        ui, search, runtime,
        record, format
    ) {
        const CustomDataConfig = {
            TITLE: 'Tạo phiếu chuyển trạng thái',
            SS: {
                SS_DATA_CHECK_ONHAND_LOT: 'customsearch_scv_checkitem_onhand'
            },
            SUBLIST: {
                ID: 'custpage_scv_sublist',
                NAME: 'Results'
            },
            ID: {
                SUBLIST: "custpage_scv_sublist",
                SUBLIST_INV_STATUS_CHANGE: "custpage_sl_inv_sc",
            },
            TEXT: {NONE: '- None -'}
        };

        const onRequest = scriptContext => {
            const request = scriptContext.request;
            if (request.method === "GET") {
                doGetForm(scriptContext);
            } else {
                doPostForm(scriptContext);
            }
        }

        const doGetForm = (scriptContext) => {
            let objParams = Object.create(null);
            let objData = Object.create(null);
            const request = scriptContext.request;
            const response = scriptContext.response;
            const params = request.parameters;
            setObjectParamsInit(objParams, params);
            Object.assign(objData, handleData(objParams));
            const {form, sublist} = onCreateForm(objParams);
            buildSublist(sublist, objData.arrDataRows);
            form.clientScriptModulePath = "../cs/scv_cs_inv_sc_from_inb_ins.js";
            response.writePage(form);
        }

        const setObjectParamsInit = (objParams, params) => {
            let {
                inspectionId
            } = params;
            Object.assign(objParams, {
                inspectionId
            });
        }

        const getDataInspectionResult = (id) => {
            if (!id) return {};
            let recInspection = record.load({
                type: 'customrecord_scv_inspection_result_tb',
                id: id
            });
            let itemId = recInspection.getValue('custrecord_scv_irt_item');
            let itemDisplay = recInspection.getText('custrecord_scv_irt_item');
            let locationId = recInspection.getValue('custrecord_scv_irt_location');
            let locationDisplay = recInspection.getText('custrecord_scv_irt_location');
            let inventoryNumberId = recInspection.getValue('custrecord_scv_irt_inentory_number');
            let inventoryNumberDisplay = recInspection.getText('custrecord_scv_irt_inentory_number');
            let expirationDate = recInspection.getText('custrecord_scv_irt_expiration_date');
            let unitsId = recInspection.getValue('custrecord_scv_irt_lot_unit');
            let unitsDisplay = recInspection.getText('custrecord_scv_irt_lot_unit');
            let inventoryStatusDisplay = recInspection.getText('custrecord_scv_irt_lot_status_cur');
            let inventoryStatusId = recInspection.getValue('custrecord_scv_irt_lot_status_cur');
            let oriLineId = recInspection.getValue('custrecord_scv_irt_ori_id');
            let createdFromId = recInspection.getValue('custrecord_scv_irt_receipt_no');
            let relatedTransId = recInspection.getValue('custrecord_scv_irt_receipt_from');
            const slDetId = 'recmachcustrecord_scv_inbound_qty_doc_no';
            const sizeSublist = recInspection.getLineCount(slDetId);
            let arrDataLine = [];
            for (let i = 0; i < sizeSublist; i++) {
                const inbStatusChange = recInspection.getSublistValue({
                    sublistId: slDetId,
                    fieldId: 'custrecord_scv_inbound_qty_stachno',
                    line: i
                });
                if (!!inbStatusChange) continue;
                const id = recInspection.getSublistValue({sublistId: slDetId, fieldId: 'id', line: i});
                const quantity = recInspection.getSublistValue({
                    sublistId: slDetId,
                    fieldId: 'custrecord_scv_inbound_qty',
                    line: i
                }) * 1;
                const newStatusId = recInspection.getSublistValue({
                    sublistId: slDetId,
                    fieldId: 'custrecord_scv_inbound_qty_status_new',
                    line: i
                });
                const newStatusDisplay = recInspection.getSublistText({sublistId: slDetId, fieldId: 'custrecord_scv_inbound_qty_status_new', line: i});
                arrDataLine.push({quantity, newStatusId, newStatusDisplay, id});
            }
            return {
                body: {
                    itemId,
                    itemDisplay,
                    locationId,
                    locationDisplay,
                    inventoryNumberId,
                    inventoryNumberDisplay,
                    expirationDate,
                    inventoryStatusDisplay,
                    unitsId,
                    unitsDisplay,
                    inventoryStatusId,
                    oriLineId,
                    createdFromId,
                    relatedTransId
                },
                line: arrDataLine
            };
        }

        const buildSublist = (sublist, arrDataRows) => {
            const colsSublist = getColsSublist();
            sublist.addMarkAllButtons();
            addColumnToSublist(sublist, colsSublist);
            createLineSublist(sublist, arrDataRows, colsSublist);
        }

        const addColumnToSublist = (sublist, colsSublist) => {
            colsSublist.forEach(objSl => {
                const f = sublist.addField({
                    id: objSl.id,
                    label: objSl.name,
                    type: objSl.type,
                    source: objSl?.source || null
                });
                f.updateDisplayType({displayType: objSl?.display || "INLINE"});
            });
        }

        const createLineSublist = (sublist, arrDataRows, colsSublist) => {
            const lengthRows = arrDataRows.length;
            const lengthCols = colsSublist.length;
            for (let i = 0; i < lengthRows; i++) {
                const objRow = arrDataRows[i];
                for (let j = 0; j < lengthCols; j++) {
                    const objCol = colsSublist[j];
                    if (objRow.hasOwnProperty(objCol.col) && (isValid(objRow[objCol.col]) || objRow[objCol.col] === 0)) {
                        let value = objRow[objCol.col];
                        if (typeof value === 'string' && value?.length >= 297) value = value.slice(0, 297) + "...";
                        if (typeof objCol.fn !== 'undefined') value = objCol.fn(objRow);
                        sublist.setSublistValue({id: objCol.id, line: i, value: value});
                    }
                }
            }
        }

        const doPostForm = scriptContext => {
            let request = scriptContext.request;
            let response = scriptContext.response;
            const inspectionId = request.parameters.custpage_scv_inspection;
            const arrGroupDataSelected = getDataSelected(request);
            const objDataInspection  = getDataHeaderInboundInspectionPlan(inspectionId);
            const arrInvStatusChange = createMultiInventoryStatusChange(arrGroupDataSelected, objDataInspection);
            setInventoryStatusChangeOnLine(inspectionId, arrInvStatusChange);
            if (arrInvStatusChange.length) {
                response.writePage(buildListResultInventoryStatus(arrInvStatusChange));
            } else {
                throw 'Tạo Inventory Status Không thành công!';
            }
        };

        const getDataHeaderInboundInspectionPlan = (id) => {
            let lkInspection = search.lookupFields({
                type : 'customrecord_scv_inspection_result_tb',
                id : id,
                columns : [
                    'custrecord_scv_irt_ori_id',
                    'custrecord_scv_irt_receipt_no',
                    'custrecord_scv_irt_receipt_from'
                ]
            });
            return {
                originalLineId : lkInspection.custrecord_scv_irt_ori_id,
                createdFromId : lkInspection.custrecord_scv_irt_receipt_no?.[0]?.value || '',
                relatedTransId : lkInspection.custrecord_scv_irt_receipt_from?.[0]?.value || '',
            };
        }

        const setInventoryStatusChangeOnLine = (inspectionId, arrInvStatusChange) => {
            if (arrInvStatusChange.length === 0) return;
            let recInspection = record.load({type: 'customrecord_scv_inspection_result_tb', id: inspectionId});
            const slId = 'recmachcustrecord_scv_inbound_qty_doc_no';
            const lineCount = recInspection.getLineCount(slId);
            for (let i = 0; i < lineCount; i++) {
                const invStatusId = recInspection.getSublistValue({sublistId: slId, fieldId: 'custrecord_scv_inbound_qty_stachno', line: i});
                if (!!invStatusId) continue;
                const idInvDetLine = recInspection.getSublistValue({sublistId: slId, fieldId: 'id', line: i}).toString();
                const objInvStatusChange = arrInvStatusChange.find(obj => obj.arrIdInsDet.indexOf(idInvDetLine) !== -1);
                if (!isValid(objInvStatusChange)) continue;
                recInspection.setSublistValue({sublistId: slId, fieldId: 'custrecord_scv_inbound_qty_stachno', line: i, value: objInvStatusChange.id});
            }
            recInspection.save({ignoreMandatoryFields: true});
        }

        const buildListResultInventoryStatus = (arrInvStatusChange) => {
            let form = ui.createForm('Inventory Status Change');
            let sublist = form.addSublist({
                id: CustomDataConfig.ID.SUBLIST_INV_STATUS_CHANGE,
                label: 'List Inventory Status Change',
                type: ui.SublistType.LIST
            });
            const sizeInvStatusChange = arrInvStatusChange.length;
            sublist.addField({
                id: 'custpage_scv_inv_status',
                label: 'Inventory Status Change',
                type: 'select',
                source: 'inventorystatuschange'
            }).updateDisplayType({
                displayType: 'disabled'
            })
            for (let i = 0; i < sizeInvStatusChange; i++) {
                sublist.setSublistValue({
                    id: 'custpage_scv_inv_status',
                    line: i,
                    value: arrInvStatusChange[i].id
                });
            }
            return form;
        }

        const getDataSelected = request => {
            const idSL = CustomDataConfig.SUBLIST.ID;
            const lc = request.getLineCount({group: idSL});
            let objData = {};
            for (let i = 0; i < lc; i++) {
                const select = request.getSublistValue({group: idSL, line: i, name: 'select'});
                const isSelect = select === 'T' || select == true;
                if (isSelect) {
                    const inbInsId = request.getSublistValue({group: idSL, line: i, name: 'c0'});
                    const itemId = request.getSublistValue({group: idSL, line: i, name: 'c1_id'});
                    const binNumberId = request.getSublistValue({group: idSL, line: i, name: 'c4_id'});
                    const expirationDate = request.getSublistValue({group: idSL, line: i, name: 'c5'});
                    const quantity = request.getSublistValue({group: idSL, line: i, name: 'c7'}) * 1;
                    const newStatusId = request.getSublistValue({group: idSL, line: i, name: 'c10_id'});
                    const currentStatusId = request.getSublistValue({group: idSL, line: i, name: 'c9_id'});
                    const unitsId = request.getSublistValue({group: idSL, line: i, name: 'c8_id'});
                    const locationId = request.getSublistValue({group: idSL, line: i, name: 'c2_id'});
                    const inventoryNumberId = request.getSublistValue({group: idSL, line: i, name: 'c3_id'});
                    const inventoryNumberDisplay = request.getSublistValue({group: idSL, line: i, name: 'c3'});
                    const matchStr = [newStatusId, currentStatusId].join('|');
                    if (!objData.hasOwnProperty(matchStr)) {
                        objData[matchStr] = {
                            arrIdInsDet: [],
                            quantity: 0,
                            locationId,
                            itemId,
                            newStatusId,
                            currentStatusId,
                            unitsId,
                            expirationDate,
                            binNumberId,
                            inventoryNumberId,
                            inventoryNumberDisplay
                        };
                    }
                    objData[matchStr].quantity += quantity;
                    objData[matchStr].arrIdInsDet.push(inbInsId);
                }
            }
            return Object.values(objData);
        }

        const createMultiInventoryStatusChange = (arrData, objDataInspection) => {
            const sizeData = arrData.length;
            let arrInvStatusChange = [];
            for (let i = 0; i < sizeData; i++) {
                const idInvStatusChange = createInventoryStatusChange(arrData[i], objDataInspection);
                if (idInvStatusChange) arrInvStatusChange.push({id: idInvStatusChange, arrIdInsDet: arrData[i].arrIdInsDet});
            }
            return arrInvStatusChange;
        }

        const createInventoryStatusChange = (objData, objDataInspection) => {
            try {
                let curRec = record.create({type: 'inventorystatuschange', isDynamic: true});
                let expirationDate = '';
                if (objData.expirationDate) expirationDate = format.parse(objData.expirationDate, 'date');
                curRec.setValue('location', objData.locationId);
                curRec.setValue('previousstatus', objData.currentStatusId);
                curRec.setValue('revisedstatus', objData.newStatusId);
                curRec.setValue('custbody_scv_oriline_id', objDataInspection.originalLineId);
                curRec.setValue('custbody_scv_created_transaction', objDataInspection.createdFromId);
                curRec.setValue('custbody_scv_related_transaction', objDataInspection.relatedTransId);
                const sublistId = 'inventory', slDetInvNumId = 'inventoryassignment';
                curRec.selectNewLine({sublistId});
                curRec.setCurrentSublistValue({sublistId: sublistId, fieldId: 'item', value: objData.itemId});
                curRec.setCurrentSublistValue({sublistId: sublistId, fieldId: 'itemunits', value: objData.unitsId});
                curRec.setCurrentSublistValue({sublistId: sublistId, fieldId: 'quantity', value: objData.quantity});
                const binitem = curRec.getCurrentSublistValue({sublistId: sublistId, fieldId: 'binitem'});
                const locationusesbins = curRec.getCurrentSublistValue({sublistId: sublistId, fieldId: 'locationusesbins'});
                const blUsesBin = binitem === 'T' && locationusesbins === 'T';
                let curRecDet = curRec.getCurrentSublistSubrecord({sublistId: sublistId, fieldId: 'inventorydetail'});
                const hasSubDet = curRec.getCurrentSublistValue({sublistId: sublistId, fieldId: 'inventorydetailavail'});
                if (hasSubDet == true || hasSubDet === 'T') {
                    curRecDet.selectNewLine({sublistId: slDetInvNumId});
                    curRecDet.setCurrentSublistValue({sublistId: slDetInvNumId, fieldId: 'issueinventorynumber', value: objData.inventoryNumberId});
                    // curRecDet.setCurrentSublistValue({sublistId: slDetInvNumId, fieldId: 'receiptinventorynumber', value: objData.inventoryNumberId});
                    // curRecDet.setCurrentSublistValue({sublistId: slDetInvNumId, fieldId: 'inventorynumber', value: objData.inventoryNumberId});
                    if (blUsesBin && objData.binNumberId) curRecDet.setCurrentSublistValue({sublistId: slDetInvNumId, fieldId: 'binnumber', value: objData.binNumberId});
                    if (expirationDate) curRecDet.setCurrentSublistValue({sublistId: slDetInvNumId, fieldId: 'expirationdate', value: expirationDate});
                    curRecDet.setCurrentSublistValue({sublistId: slDetInvNumId, fieldId: 'quantity', value: objData.quantity});
                    curRecDet.commitLine({sublistId: slDetInvNumId});
                }
                curRec.commitLine({sublistId: sublistId});
                return curRec.save({ignoreMandatoryFields : true});
            } catch (e) {
                log.error('Error createInventoryStatusChange', e);
                log.error('Error createInventoryStatusChange_objData  ', objData);
            }
            return null;
        }

        const onCreateForm = (objParams) => {
            const form = ui.createForm({title: CustomDataConfig.TITLE});
            const container = "custpage_grp_filters";
            form.addFieldGroup({id: container, label: "Bộ lọc"});
            form.addFieldGroup({id: container, label: "Bộ lọc"});
            form.addSubmitButton({label: 'Saved'});
            const fInspection = form.addField({
                id: "custpage_scv_inspection",
                label: "Inspection Result",
                type: ui.FieldType.SELECT,
                source: "customrecord_scv_inspection_result_tb",
                container: container
            }).updateDisplayType({
                displayType: 'DISABLED'
            });
            setDefaultValue(fInspection, objParams.inspectionId, '');
            const sublist = form.addSublist({
                id: CustomDataConfig.SUBLIST.ID,
                label: CustomDataConfig.SUBLIST.NAME,
                type: ui.SublistType.LIST
            });
            return {form: form, sublist: sublist}
        }

        const handleData = objParams => {
            let objDataInspection = getDataInspectionResult(objParams.inspectionId);
            const resultDataOnHandLot = getDataDataOnHandLot({
                itemId: objDataInspection.body.itemId,
                locationId: objDataInspection.body.locationId,
                inventoryNumberId: objDataInspection.body.inventoryNumberId
            });
            const arrDataOnHandLot = resultDataOnHandLot.isSuccess ? resultDataOnHandLot.response : [];
            let objDataLot = arrDataOnHandLot?.[0] || {
                quantity : 0,
                binNumberId : '',
                binNumberDisplay : '',
            };
            let arrDataRows = [];
            let arrDataLine = objDataInspection.line;
            let objBodyInspection = objDataInspection.body;
            const sizeData = arrDataLine.length;
            for (let i = 0; i < sizeData; i++) {
                arrDataRows.push({
                    inspectionDetailId: arrDataLine[i].id,
                    itemDisplay: objBodyInspection.itemDisplay,
                    locationDisplay: objBodyInspection.locationDisplay,
                    locationId: objBodyInspection.locationId,
                    inventoryNumberDisplay: objBodyInspection.inventoryNumberDisplay,
                    inventoryNumberId: objBodyInspection.inventoryNumberId,
                    binNumberDisplay: objDataLot.binNumberDisplay,
                    binNumberId: objDataLot.binNumberId,
                    quantityOnHand: objDataLot.quantity,
                    quantityLot: arrDataLine[i].quantity,
                    unitsDisplay: objBodyInspection.unitsDisplay,
                    unitsId: objBodyInspection.unitsId,
                    inventoryStatusDisplay: objBodyInspection.inventoryStatusDisplay,
                    inventoryStatusId: objBodyInspection.inventoryStatusId,
                    newStatusDisplay: arrDataLine[i].newStatusDisplay,
                    newStatusId: arrDataLine[i].newStatusId,
                    expirationDate: objBodyInspection.expirationDate,
                    itemId: objBodyInspection.itemId,
                });
            }
            return {
                arrDataRows: arrDataRows,
            };
        }

        /**
         * Des: Get Array Data OnHand LotNumber
         * @param objParams
         * @returns {{response: null, error: null, isSuccess: boolean}}
         */
        const getDataDataOnHandLot = (objParams) => {
            let result = {response: null, error: null, isSuccess: false};
            try {
                let searchObj = search.load({id: CustomDataConfig.SS.SS_DATA_CHECK_ONHAND_LOT, type: search.Type.INVENTORY_BALANCE});
                if (objParams.itemId) {
                    searchObj.filters.push(search.createFilter({
                        name: 'item',
                        operator: 'is',
                        values: objParams.itemId
                    }));
                }
                if (objParams.locationId) {
                    searchObj.filters.push(search.createFilter({
                        name: 'location',
                        operator: 'is',
                        values: objParams.locationId
                    }));
                }
                if (objParams.inventoryNumberId) {
                    searchObj.filters.push(search.createFilter({
                        name: 'inventorynumber',
                        operator: 'is',
                        values: objParams.inventoryNumberId
                    }));
                }
                if (objParams.inventoryStatusId) {
                    searchObj.filters.push(search.createFilter({
                        name: 'status',
                        operator: 'is',
                        values: objParams.inventoryStatusId
                    }));
                }
                let cols = searchObj.columns;
                let arrData = [];
                let pagedData = searchObj.runPaged({pageSize: 1000});
                for (let page in pagedData.pageRanges) {
                    let currentPage = pagedData.fetch(page);
                    currentPage.data.forEach(function (data) {
                        arrData.push({
                            itemId: data.getValue(cols[0]),
                            itemDisplay: data.getText(cols[0]),
                            locationId: data.getValue(cols[1]),
                            locationDisplay: data.getText(cols[1]),
                            inventoryNumberId: data.getValue(cols[2]),
                            inventoryNumberDisplay: data.getText(cols[2]),
                            binNumberId: data.getValue(cols[3]),
                            binNumberDisplay: data.getText(cols[3]),
                            quantity: data.getValue(cols[4]),
                            stockUnitId: data.getValue(cols[5]),
                            stockUnitDisplay: data.getText(cols[5]),
                            inventoryStatusId: data.getValue(cols[6]),
                            inventoryStatusDisplay: data.getText(cols[6]),
                            expirationDate: data.getValue(cols[7])
                        });
                    });
                }
                result.response = arrData;
                result.isSuccess = true;
            } catch (e) {
                log.error("Error getDataDataOnHandLot: ", e);
                result.error = 'Not found data';
            }
            return result;
        }

        const getColsSublist = () => {
            return [
                {id: "select", name: "Mark", type: "CHECKBOX", col: "select", display: 'NORMAL'},
                {id: "c0", name: "Id", type: "TEXT", col: "inspectionDetailId", display: "HIDDEN"},
                {id: "c1", name: "Mặt hàng", type: "TEXT", col: "itemDisplay"},
                {id: "c1_id", name: "Mặt hàng", type: "TEXT", col: "itemId", display: 'hidden'},
                {id: "c2", name: "Kho", type: "TEXT", col: "locationDisplay"},
                {id: "c2_id", name: "Kho", type: "TEXT", col: "locationId", display: 'HIDDEN'},
                {id: "c3", name: "Số lô", type: "TEXT", col: "inventoryNumberDisplay"},
                {id: "c3_id", name: "Số lô", type: "TEXT", col: "inventoryNumberId", display: 'HIDDEN'},
                {id: "c4_id", name: "Bin", type: "TEXT", col: "binNumberId", display: 'HIDDEN'},
                {id: "c4", name: "Bin", type: "TEXT", col: "binNumberDisplay"},
                {id: "c5", name: "HSD", type: "TEXT", col: "expirationDate"},
                {id: "c6", name: "On Hand", type: "FLOAT", col: "quantityOnHand"},
                {id: "c7", name: "Số lượng", type: "FLOAT", col: "quantityLot"},
                {id: "c8", name: "ĐVT", type: "TEXT", col: "unitsDisplay"},
                {id: "c8_id", name: "ĐVT", type: "TEXT", col: "unitsId", display: 'HIDDEN'},
                {id: "c9", name: "Trạng thái hiện tại", type: "TEXT", col: "inventoryStatusDisplay"},
                {id: "c9_id", name: "Trạng thái hiện tại", type: "TEXT", col: "inventoryStatusId", display: "HIDDEN"},
                {id: "c10", name: "Trạng thái mới", type: "TEXT", col: "newStatusDisplay"},
                {id: "c10_id", name: "Trạng thái mới", type: "TEXT", col: "newStatusId", display: 'HIDDEN'}
            ];
        }

        const setDefaultValue = (pField, val, tempVal) => {
            if (isValid(val)) {
                pField.defaultValue = val;
            } else if (isValid(tempVal)) {
                pField.defaultValue = tempVal;
            }
        }

        const isValid = value => value !== "" && value !== null && value !== undefined
            ?
            typeof value === "object"
                ?
                Array.isArray(value)
                    ?
                    value.length > 0
                    :
                    (!isNaN(value) || Object.keys(value).length > 0)
                :
                true
            :
            false;

        return {
            onRequest
        }
    }
);