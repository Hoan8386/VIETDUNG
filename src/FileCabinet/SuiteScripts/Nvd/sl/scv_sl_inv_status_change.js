/**
 * =======================================================================================
 *  Date                Author                  Description
 *  23 Apr 2025		    Khanh Tran			    Màn hình phiếu giao việc và phiếu in liên quan from mr. Huy(https://app.clickup.com/t/86cx4gavg)
 */
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
        'N/format',
        '../lib/scv_lib_report',
        '../lib/scv_lib_function',
        '../olib/alasql/alasql.min@1.7.3',
        '../lib/scv_lib_common_html'
    ],
    function (
        ui, search, runtime,
        record, format,
        lrp,
        lfn,
        alasql,
        libHtml
    ) {
        const CustomDataConfig = {
            TITLE: 'Tạo phiếu chuyển trạng thái',
            SS: {
                INSPECTION_LOT: 'customsearch_scv_inspectionlot_stacha',
                ITEM_ONHAND: 'customsearch_scv_checkitem_onhand'
            },
            SUBLIST: {
                ID: 'custpage_scv_sublist',
                NAME: 'Kết quả'
            },
            ID: {
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
            setObjectParams(objParams, params);
            const dataConfig = getDataConfig({
                subsidiary: objParams.subsidiary
            });
            if (objParams.isSearch === 'T') {
                Object.assign(objData, doHandleData(objParams));
            }

            const {form, sublist} = onCreateForm(objParams, dataConfig);
            lfn.addSavedSearchToForm(form, [
                {
                    id: CustomDataConfig.SS.ITEM_ONHAND,
                    title: 'SavedSearch : Item OnHand'
                },
                {
                    id: CustomDataConfig.SS.INSPECTION_LOT,
                    title: 'SavedSearch : Inspection Lot'
                },
            ]);
            doBuildSublist(sublist, objData.arrDataRows || []);
            form.clientScriptModulePath = "../cs/scv_cs_sl_inv_status_change.js";
            response.writePage(form);
        }

        const setObjectParams = (objParams, params) => {
            let {
                subsidiary,
                fromDate,
                toDate,
                location,
                inspectionLot,
                inboundOrderNo,
                item,
                relatedTrans,
                lotNo,
                isRun,
                isSearch,
                source
            } = params;
            if (!subsidiary) subsidiary = runtime.getCurrentUser().subsidiary;
            if (!!source && source === 'inspection_lot') {
                let lkInsLot = search.lookupFields({
                    type: 'customrecord_scv_insp_lot',
                    id: inspectionLot,
                    columns: ['created', 'custrecord_scv_inspl_insp_sheet']
                });
                const insSheetId = lkInsLot.custrecord_scv_inspl_insp_sheet?.[0]?.value;
                const dateCreated = lkInsLot.created;
                fromDate = dateCreated.split(" ")[0];
                toDate = fromDate;
                if (insSheetId) {
                    let lkInsSheet = search.lookupFields({
                        type: 'customrecord_scv_inspection_sheet',
                        id: insSheetId,
                        columns: ['custrecord_scv_insps_sub', 'custrecord_scv_insps_loc', 'custrecord_scv_insps_item']
                    });
                    subsidiary = lkInsSheet.custrecord_scv_insps_sub?.[0]?.value;
                    location = lkInsSheet.custrecord_scv_insps_loc?.[0]?.value;
                    item = lkInsSheet.custrecord_scv_insps_item?.[0]?.value;
                }
            }
            Object.assign(objParams, {
                subsidiary,
                fromDate,
                toDate,
                location,
                inspectionLot,
                inboundOrderNo,
                item,
                relatedTrans,
                lotNo,
                isRun,
                isSearch
            });
        };

        const getDataConfig = (params) => {
            let {
                subsidiary
            } = params;
            let resultLocation = fetchDataLocationBySubsidiary(subsidiary);
            let arrDataLoc = resultLocation.isSuccess ? resultLocation.response : [];
            return {
                arrDataLoc
            };
        };

        const doBuildSublist = (sublist, arrDataRows) => {
            const colsSublist = getColsSublist();
            sublist.addMarkAllButtons();
            addColumnToSublist(sublist, colsSublist);
            createLineSublist(sublist, arrDataRows, colsSublist);
        };

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
        };

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
            const objDataInvStatusChange = getDataSelected(request);
            const arrInspectionLot = Object.keys(objDataInvStatusChange);
            const numsInspectionLot = arrInspectionLot.length;
            let arrIdInvStatusChange = [];
            for (let i = 0; i < numsInspectionLot; i++) {
                const idInsLot = arrInspectionLot[i];
                const arrInvStatusChangeIdLine = createMultiInventoryStatusChange(objDataInvStatusChange[idInsLot]);
                if (arrInvStatusChangeIdLine.length === 0) continue;
                setInventoryStatusChangeOnInspectionLot(idInsLot, arrInvStatusChangeIdLine);
                arrIdInvStatusChange = arrIdInvStatusChange.concat(arrInvStatusChangeIdLine.map(o => o.id));
            }
            if (arrIdInvStatusChange.length) {
                response.writePage(buildGridShowInventoryChangeStatusCreated(arrIdInvStatusChange));
                return;
            }
            throw 'Tạo Inventory Status Không thành công!';
        };

        const setInventoryStatusChangeOnInspectionLot = (idInspectionLot, arrDataInvStatusChange) => {
            let curRecInsLot = record.load({type: 'customrecord_scv_insp_lot', id: idInspectionLot});
            const sublistId = 'recmachcustrecord_scv_inspq_insp_lot';
            const lc = curRecInsLot.getLineCount(sublistId);
            for (let i = 0; i < lc; i++) {
                const idInsStatical = curRecInsLot.getSublistValue({
                    sublistId: sublistId,
                    line: i,
                    fieldId: 'id'
                }).toString();
                const objInvStatical = arrDataInvStatusChange.find(o => o.inspectionStaticalId === idInsStatical);
                if (typeof objInvStatical === 'undefined') continue;
                curRecInsLot.setSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord_scv_inbound_qty_stachno',
                    value: objInvStatical.id,
                    line: i
                });
            }
            curRecInsLot.save({ignoreMandatoryFields: true});
        };

        const buildGridShowInventoryChangeStatusCreated = (arrInvStatusChange) => {
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
                    value: arrInvStatusChange[i]
                });
            }
            return form;
        };

        const getDataSelected = request => {
            const idSL = CustomDataConfig.SUBLIST.ID;
            const lc = request.getLineCount({group: idSL});
            let cols = getColsSublist().filter(f => f.selected);
            let objData = {};
            for (let i = 0; i < lc; i++) {
                const select = request.getSublistValue({group: idSL, line: i, name: 'select'});
                const isSelect = select === 'T' || select == true;
                if (isSelect) {
                    const objLine = cols.reduce((acc, o) => {
                        acc[o.col] = request.getSublistValue({group: idSL, line: i, name: o.id}) || '';
                        return acc;
                    }, {});
                    if (!objData.hasOwnProperty(objLine.inspection_lot_id)) objData[objLine.inspection_lot_id] = [];
                    objData[objLine.inspection_lot_id].push(objLine);
                }
            }
            return objData;
        }

        const createMultiInventoryStatusChange = (arrData) => {
            const sizeData = arrData.length;
            let arrInvStatusChange = [];
            for (let i = 0; i < sizeData; i++) {
                const idInvStatusChange = createInventoryStatusChange(arrData[i]);
                if (!idInvStatusChange) continue;
                arrInvStatusChange.push({
                    id: idInvStatusChange,
                    inspectionStaticalId: arrData[i].inspection_statical_id
                });
            }
            return arrInvStatusChange;
        }

        const createInventoryStatusChange = (objData) => {
            try {
                let curRec = record.create({type: 'inventorystatuschange', isDynamic: true});
                lfn.setValueData(curRec, [
                    'location', 'previousstatus', 'revisedstatus', 'custbody_scv_oriline_id', 'custbody_scv_created_transaction', 'custbody_scv_related_transaction',
                    'custbody_scv_inspection_lot', 'custbody_scv_itr_link'
                ], [
                    objData.locationid, objData.statusid, objData.newstatusid, objData.orilineid, objData.createdfromid, [objData.sourcetransid],
                    objData.inspection_lot_id, objData.itrid,
                ]);

                if(objData.ngaykiem) curRec.setValue('trandate', format.parse(objData.ngaykiem, 'date'))
                let expirationDate = '';
                if (objData.expiration_date) expirationDate = format.parse(objData.expiration_date, 'date');
                const sublistId = 'inventory', slDetInvNumId = 'inventoryassignment';
                curRec.selectNewLine({sublistId});
                curRec.setCurrentSublistValue({sublistId: sublistId, fieldId: 'item', value: objData.itemid});
                curRec.setCurrentSublistValue({sublistId: sublistId, fieldId: 'itemunits', value: objData.unitsid});
                curRec.setCurrentSublistValue({sublistId: sublistId, fieldId: 'quantity', value: objData.quantity});
                const binitem = curRec.getCurrentSublistValue({sublistId: sublistId, fieldId: 'binitem'});
                const locationusesbins = curRec.getCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'locationusesbins'
                });
                const blUsesBin = binitem === 'T' && locationusesbins === 'T';
                // if (objData.lotid) {
                    const hasSubDet = curRec.getCurrentSublistValue({sublistId: sublistId, fieldId: 'inventorydetailavail'});
                    if (hasSubDet == true || hasSubDet === 'T') {
                        let curRecDet = curRec.getCurrentSublistSubrecord({sublistId: sublistId, fieldId: 'inventorydetail'});
                        curRecDet.selectNewLine({sublistId: slDetInvNumId});
                        curRecDet.setCurrentSublistValue({sublistId: slDetInvNumId, fieldId: 'issueinventorynumber', value: objData.lotid});
                        if (blUsesBin && objData.binid) curRecDet.setCurrentSublistValue({ sublistId: slDetInvNumId, fieldId: 'binnumber', value: objData.binid });
                        if (expirationDate) curRecDet.setCurrentSublistValue({ sublistId: slDetInvNumId, fieldId: 'expirationdate', value: expirationDate });
                        curRecDet.setCurrentSublistValue({ sublistId: slDetInvNumId, fieldId: 'quantity', value: objData.quantity });
                        curRecDet.commitLine({sublistId: slDetInvNumId});
                    }
                // }
                curRec.commitLine({sublistId: sublistId});
                return curRec.save({ignoreMandatoryFields: true});
            } catch (e) {
                log.error('Error createInventoryStatusChange', e);
            }
            return null;
        }

        const onCreateForm = (objParams, dataConfig) => {
            const form = ui.createForm({title: CustomDataConfig.TITLE});
            form.addSubmitButton('Tạo');
            form.addButton({id: 'custpage_scv_search', label: 'Tìm kiếm', functionName: `onClickBtn('&isSearch=T')`});
            form.addButton({
                id: 'custpage_scv_refresh',
                label: 'Refresh',
                functionName: `onClickBtn('&isFieldChanged=T')`
            });
            const container = "custpage_grp_filters";
            form.addFieldGroup({id: container, label: "Bộ lọc"});
            const objBreak = {breakType: 'STARTCOL'};
            const fSub = form.addField({
                id: "custpage_scv_subsidiary",
                label: "Công ty",
                type: ui.FieldType.SELECT,/* source: "subsidiary", */
                container: container
            }).updateBreakType(objBreak).setHelpText('Công ty');
            lrp.addSelectSubsidiary(fSub, objParams.subsidiary);
            const fInspectionLot = form.addField({
                id: "custpage_scv_ins_lot",
                label: "Inspection Lot",
                type: ui.FieldType.SELECT,
                source: 'customrecord_scv_insp_lot',
                container: container
            }).setHelpText('Inspection Lot');
            const fLotNo = form.addField({
                id: "custpage_scv_lot_no",
                label: "Số lô",
                type: ui.FieldType.TEXT,
                container: container
            }).setHelpText('Số lô');
            const fFromDate = form.addField({
                id: "custpage_scv_from_date",
                label: "Từ ngày",
                type: ui.FieldType.DATE,
                container: container
            }).updateBreakType(objBreak).setHelpText('Từ ngày');
            const fToDate = form.addField({
                id: "custpage_scv_to_date",
                label: "Đến ngày",
                type: ui.FieldType.DATE,
                container: container
            }).setHelpText('Đến ngày');
            const fDocNoOrderInbound = form.addField({
                id: "custpage_scv_docno",
                label: "Số đơn nhập/Lệnh SX",
                type: ui.FieldType.TEXT,
                container: container
            }).setHelpText('Số đơn nhập/Lệnh SX');
            const fLocation = form.addField({
                id: "custpage_scv_location",
                label: "Kho",
                type: ui.FieldType.MULTISELECT,
                // source: 'location',
                container: container
            }).updateBreakType(objBreak).setHelpText('Kho');
            if (objParams.isSearch !== 'T') {
                libHtml.fnAddPopupFieldMultiSelect(form, 'custpage_scv_location', dataConfig.arrDataLoc);
            }
            const fItem = form.addField({
                id: "custpage_scv_item",
                label: "Mặt hàng",
                type: ui.FieldType.MULTISELECT,
                source: 'item',
                container: container
            }).updateBreakType(objBreak).setHelpText('Mặt hàng');
            const fRelatedTrans = form.addField({
                id: "custpage_scv_related_trans",
                label: "Phiếu liên quan",
                type: ui.FieldType.TEXT,
                container: container
            }).setHelpText('Phiếu liên quan');
            const sublist = form.addSublist({
                id: CustomDataConfig.SUBLIST.ID,
                label: CustomDataConfig.SUBLIST.NAME,
                type: ui.SublistType.LIST
            });
            let now = new Date();
            let fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
            addSelectOptionsFields(fLocation, dataConfig.arrDataLoc);
            setMandatoryMultiFields([fSub, fFromDate, fToDate]);
            setDefaultValue(fSub, objParams.subsidiary);
            setDefaultValue(fFromDate, objParams.fromDate, fromDate);
            setDefaultValue(fItem, objParams.item?.split(','));
            setDefaultValue(fRelatedTrans, objParams.relatedTrans?.split(','));
            setDefaultValue(fToDate, objParams.toDate, now);
            setDefaultValue(fLocation, objParams.location);
            setDefaultValue(fInspectionLot, objParams.inspectionLot);
            setDefaultValue(fDocNoOrderInbound, objParams.inboundOrderNo);
            setDefaultValue(fLotNo, objParams.lotNo);
            return {form: form, sublist: sublist}
        };

        const doHandleData = objParams => {
            let resultInspectionLot = fetchDataInspectionLot(objParams);
            let resultOnHandLot = fetchDataOnHandLot(objParams);
            let arrDataInspectionLot = resultInspectionLot.isSuccess ? resultInspectionLot.response : [];
            let arrDataOnHandLot = resultOnHandLot.isSuccess ? resultOnHandLot.response : [];
            const arrCols = [
                'l.inspectionStaticalId as inspection_statical_id',
                'l.id as inspection_lot_id',
                'l.itemId as itemid',
                'l.itemDisplay as itemtext',
                'l.locationId as locationid',
                'l.locationDisplay as locationtext',
                'l.inventoryNumberId as lotid',
                'l.binNumberId as binid',
                'l.unitsId as unitsid',
                'l.unitsDisplay as unitstext',
                'l.inventoryNumberDisplay as lottext',
                'l.binNumberDisplay as bintext',
                'l.inventoryStatusId as statusid',
                'l.inventoryStatusDisplay as statustext',
                'l.newStatusDisplay as newstatustext',
                'l.newStatusId as newstatusid',
                'l.quantity as quantity',
                'l.createdFromId as createdfromid',
                'l.sourceTransId as sourcetransid',
                'l.oriLineId as orilineid',
                'l.ngayKiem as ngaykiem',
                'l.itrId as itrid',
                'r.quantity as qtyonhand',
                'r.expirationDate as expiration_date'
            ];                                          
            let data = alasql(`SELECT ${arrCols.join(', ')}
                               FROM ? AS l
                                        LEFT JOIN ? AS r ON l.locationId = r.locationId AND l.itemId = r.itemId AND
                                                            l.inventoryNumberId = r.inventoryNumberId AND
                                                            l.inventoryStatusId = r.inventoryStatusId AND
                                                            l.binNumberId = r.binNumberId`,
                [arrDataInspectionLot, arrDataOnHandLot]);
            return {
                arrDataRows: data
            };
        };


        const fetchDataLocationBySubsidiary = (subsidiary) => {
            let result = {response: null, error: null, isSuccess: false};
            try {
                let searchObj = search.create({
                    type: 'location',
                    columns: [
                        'name',
                        'subsidiary'
                    ],
                    filters: [
                        ['isinactive', 'is', 'F'],
                        'and',
                        ['subsidiary', 'is', subsidiary]
                    ]
                });
                const cols = searchObj.columns;
                result.response = lfn.fetchDataSavedSearch(searchObj, function (data) {
                    return {
                        id: data.id,
                        name: data.getValue(cols[0])
                    };
                });
                result.isSuccess = true;
            } catch (e) {
                result.error = e;
            }
            return result;
        }


        const fetchDataOnHandLot = (objParams) => {
            let result = {response: null, error: null, isSuccess: false};
            try {
                let searchObj = search.load({id: CustomDataConfig.SS.ITEM_ONHAND, type: search.Type.INVENTORY_BALANCE});
                if (objParams.item) {
                    searchObj.filters.push(search.createFilter({
                        name: 'item',
                        operator: 'anyof',
                        values: objParams.item.split(',')
                    }));
                }
                if (objParams.location) {
                    searchObj.filters.push(search.createFilter({
                        name: 'location',
                        operator: 'anyof',
                        values: objParams.location.split(',')
                    }));
                }
                let cols = searchObj.columns;
                result.response = lfn.fetchDataSavedSearch(searchObj, function (data) {
                    return {
                        itemId: data.getValue(cols[0]),
                        locationId: data.getValue(cols[1]),
                        inventoryNumberId: data.getValue(cols[2]),
                        binNumberId: data.getValue(cols[3]),
                        quantity: data.getValue(cols[4]),
                        inventoryStatusId: data.getValue(cols[6]),
                        expirationDate: data.getValue(cols[7])
                    }
                });
                result.isSuccess = true;
            } catch (e) {
                log.error("Error getDataDataOnHandLot: ", e);
                result.error = 'Not found data';
            }
            return result;
        }

        const fetchDataInspectionLot = (objParams) => {
            let result = {response: null, error: null, isSuccess: false};
            try {
                let searchObj = search.load({id: CustomDataConfig.SS.INSPECTION_LOT,});
                if (objParams.subsidiary) searchObj.filters.push(search.createFilter({
                    name: 'custrecord_scv_insps_sub',
                    join: 'custrecord_scv_inspl_insp_sheet',
                    operator: 'anyof',
                    values: objParams.subsidiary.split(',')
                }));
                if (objParams.item) searchObj.filters.push(search.createFilter({
                    name: 'custrecord_scv_insps_item',
                    join: 'custrecord_scv_inspl_insp_sheet',
                    operator: 'anyof',
                    values: objParams.item.split(',')
                }));
                if (objParams.location) searchObj.filters.push(search.createFilter({
                    name: 'custrecord_scv_insps_loc',
                    join: 'custrecord_scv_inspl_insp_sheet',
                    operator: 'anyof',
                    values: objParams.location.split(',')
                }));
                if (objParams.fromDate && objParams.toDate) searchObj.filters.push(search.createFilter({
                    name: 'created',
                    operator: 'within',
                    values: [objParams.fromDate, objParams.toDate]
                }));
                if (objParams.inspectionLot) searchObj.filters.push(search.createFilter({
                    name: 'internalid',
                    operator: 'is',
                    values: objParams.inspectionLot
                }));
                if (objParams.inboundOrderNo) searchObj.filters.push(search.createFilter({
                    name: 'formulatext',
                    formula: 'LOWER({custrecord_scv_inspl_createdfrom.tranid})',
                    operator: 'contains',
                    values: objParams.inboundOrderNo.toLowerCase()
                }));
                if (objParams.relatedTrans) searchObj.filters.push(search.createFilter({
                    name: 'formulatext',
                    formula: 'LOWER({custrecord_scv_inspl_source_trans.tranid})',
                    operator: 'contains',
                    values: objParams.relatedTrans.toLowerCase()
                }));
                let cols = searchObj.columns;
                result.response = lfn.fetchDataSavedSearch(searchObj, function (data) {
                    return {
                        id: data.id?.toString(),
                        i: data.getValue(cols[0]),
                        itemId: data.getValue(cols[3]),
                        itemDisplay: data.getText(cols[3]),
                        locationId: data.getValue(cols[2]),
                        locationDisplay: data.getText(cols[2]),
                        inventoryNumberDisplay: data.getText(cols[4]),
                        inventoryNumberId: data.getValue(cols[4]),
                        binNumberDisplay: data.getText(cols[5]),
                        binNumberId: data.getValue(cols[5]),
                        quantity: data.getValue(cols[6]),
                        unitsDisplay: data.getText(cols[7]),
                        unitsId: data.getValue(cols[7]),
                        inventoryStatusId: data.getValue(cols[8]),
                        inventoryStatusDisplay: data.getText(cols[8]),
                        newStatusDisplay: data.getText(cols[9]),
                        newStatusId: data.getValue(cols[9]),
                        createdFromId: data.getValue(cols[11]),
                        sourceTransId: data.getValue(cols[12]),
                        oriLineId: data.getValue(cols[13]),
                        inspectionStaticalId: data.getValue(cols[14]),
                        ngayKiem: data.getValue(cols[16]),
                        itrId: data.getValue(cols[18]),
                    };
                });
                result.isSuccess = true;
            } catch (e) {
                log.error("Error getDataDataOnHandLot: ", e);
                result.error = 'Not found data';
            }
            return result;
        };

        const getColsSublist = () => {
            return [
                {id: "select", name: "Chọn", type: "CHECKBOX", col: "select", display: 'NORMAL', selected: true},
                {id: "c0_id", name: "Inspection Lot Id", type: "text", col: "inspection_lot_id", selected: true, display: 'hidden'},
                {id: "c1", name: "Mặt hàng", type: "TEXTAREA", col: "itemtext"},
                {id: "c1_id", name: "Mặt hàng", type: "TEXT", col: "itemid", display: 'hidden', selected: true},
                {id: "c2", name: "Kho", type: "TEXTAREA", col: "locationtext"},
                {id: "c2_id", name: "Kho", type: "TEXT", col: "locationid", display: 'HIDDEN', selected: true},
                {id: "c3", name: "Số lô", type: "TEXT", col: "lottext"},
                {id: "c3_id", name: "Số lô", type: "TEXT", col: "lotid", display: 'HIDDEN', selected: true},
                {id: "c4_id", name: "Bin", type: "TEXT", col: "binid", display: 'HIDDEN', selected: true},
                {id: "c4", name: "Bin", type: "TEXT", col: "bintext"},
                {id: "c5", name: "HSD", type: "TEXT", col: "expiration_date", selected: true},
                {id: "c6", name: "Tồn kho", type: "FLOAT", col: "qtyonhand", selected: true},
                {id: "c7", name: "Số lượng", type: "FLOAT", col: "quantity", selected: true},
                {id: "c8", name: "ĐVT", type: "TEXT", col: "unitstext"},
                {id: "c8_id", name: "ĐVT", type: "TEXT", col: "unitsid", display: 'HIDDEN', selected: true},
                {id: "c9", name: "Trạng thái hiện tại", type: "TEXT", col: "statustext"},
                {id: "c9_id", name: "Trạng thái hiện tại", type: "TEXT", col: "statusid", display: "HIDDEN", selected: true},
                {id: "c10", name: "Trạng thái mới", type: "TEXT", col: "newstatustext"},
                {
                    id: "c10_id",
                    name: "Trạng thái mới",
                    type: "TEXT",
                    col: "newstatusid",
                    display: 'HIDDEN',
                    selected: true
                },
                {
                    id: "c11_id",
                    name: "Original Line ID",
                    type: "TEXT",
                    col: "orilineid",
                    display: 'HIDDEN',
                    selected: true
                },
                {
                    id: "c12_id",
                    name: "Created From",
                    type: "TEXT",
                    col: "createdfromid",
                    display: 'HIDDEN',
                    selected: true
                },
                {
                    id: "c13_id",
                    name: "Source From Trans",
                    type: "TEXT",
                    col: "sourcetransid",
                    display: 'HIDDEN',
                    selected: true
                },
                {
                    id: "c14_id",
                    name: "Inspection Statical ID",
                    type: "TEXT",
                    col: "inspection_statical_id",
                    display: 'HIDDEN',
                    selected: true
                },
                {id: "c15_id", name: "Ngày kiểm", type: "TEXT", col: "ngaykiem", display: "HIDDEN", selected: true},
                {id: "c16_id", name: "ITR", type: "TEXT", col: "itrid", display: "HIDDEN", selected: true},
            ];
        };

        const setDefaultValue = (pField, val, tempVal) => {
            if (isValid(val)) {
                pField.defaultValue = val;
            } else if (isValid(tempVal)) {
                pField.defaultValue = tempVal;
            }
        };

        const addSelectOptionsFields = (objFld, data, emptyName) => {
            if (typeof emptyName !== 'undefined') objFld.addSelectOption({value: '', text: emptyName});
            const sz = data.length;
            for (let i = 0; i < sz; i++) {
                objFld.addSelectOption({value: data[i].id, text: data[i].name});
            }
        };

        const setMandatoryMultiFields = (arrFlds) => arrFlds.forEach(fld => fld.isMandatory = true);

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
        };
    }
);