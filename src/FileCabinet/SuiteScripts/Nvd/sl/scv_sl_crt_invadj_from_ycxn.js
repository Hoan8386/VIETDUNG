/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/search', 'N/record', 'N/redirect', '../lib/scv_lib_function'],
    function (search, record, redirect, lbf) {

        const SavedSearchId = {IA_YCXK_RELATED_QTY: "customsearch_scv_ia_ycxk_related_qty"};
        const CustomTypeYCXN = {NHAP: '2', XUAT: '1'};

        const onRequest = (context) => {
            const request = context.request;
            let params = request.parameters;
            let idYCXVT = params.recid;
            let recYCXVT = record.load({type: 'customsale_scv_ot_yc_xvt', id: idYCXVT});
            let related_transaction = recYCXVT.getValue('custbody_scv_related_transaction') || [];
            const invAdjId = related_transaction.length === 0 ? createInventoryAdjustment(recYCXVT) : null;
            if (invAdjId) {
                submitDataFieldsYCXVT(idYCXVT, getObjDataUpdateYCXVT(recYCXVT, invAdjId, idYCXVT));
                redirect.toRecord({type: record.Type.INVENTORY_ADJUSTMENT, id: invAdjId});
            } else {
                redirect.toRecord({type: 'customsale_scv_ot_yc_xvt', id: params.recid});
            }

        }

        const getObjDataUpdateYCXVT = (recYCXVT, invAdjId, idYCXVT) => {
            const totalQtyYCVT = getTotalQuantityYCXVT(recYCXVT);
            const totalQtyIA = getTotalQuantityInventoryAjustment(idYCXVT);
            const arrRelTransId = recYCXVT.getValue('custbody_scv_related_transaction');
            let arrRelTransIdNew = [].concat(arrRelTransId).concat([invAdjId]);
            let objUpd = {
                custbody_scv_related_transaction: arrRelTransIdNew,
                custbody_scv_ia_total_related_qty: totalQtyIA
            };
            if (totalQtyIA === totalQtyYCVT) objUpd.transtatus = 'C';
            return objUpd;
        }

        const submitDataFieldsYCXVT = (id, objUpd) => {
            record.submitFields({
                type: 'customsale_scv_ot_yc_xvt',
                id: id,
                values: objUpd,
                options: {ignoreMandatoryFields: true}
            });
        };

        const createInventoryAdjustment = (recYCXVT) => {
            const ycxvtId = recYCXVT.id;
            let isSave = false;
            let curRec = record.create({type: 'inventoryadjustment', isDynamic: true});
            const arrFieldsBodyYCXN = ['department', 'class', 'custbody_scv_employee_ycxvt', 'custbody_scv_employee_ycxvt', 'custbody_scv_fixed_asset_code', 'memo'];
            const arrFieldsIA = ['department', 'class', 'custbody_scv_vpr_employee', 'custbody_scv_tb_entity_name', 'custbody_scv_fixed_asset_code', 'memo'];
            const subId = recYCXVT.getValue('subsidiary');
            const locIdHeader = recYCXVT.getValue('location');
            const orderTypeId = recYCXVT.getValue('custbody_scv_order_type');

            //thanhdev 21/5/2025
            const custbody_scv_shift = recYCXVT.getValue('custbody_scv_shift');
            const custbody_scv_wo_center = recYCXVT.getValue('custbody_scv_wo_center');
            //thanhdev end

            const objDataOrderType = fetchDataOrderType(orderTypeId);
            const accId = objDataOrderType.adjustAccountId;
            const typeYCXVT = objDataOrderType.transType;
            const slYCXN = 'item', slIA = 'inventory';
            const slIVD = 'inventoryassignment';
            lbf.setValueData(curRec, ['subsidiary'], [subId]);
            // thanhdev 21/05/2025
            lbf.setValueData(curRec, ['custbody_scv_shift', 'custbody_scv_wo_center'], [custbody_scv_shift, custbody_scv_wo_center]);
            // thanhdev end
            if (accId) curRec.setValue('account', accId);
            lbf.setValueData(curRec, ['custbody_scv_order_type', 'custbody_scv_created_transaction', 'trandate', 'adjlocation'], [orderTypeId, ycxvtId, lbf.getDateNow(), locIdHeader]);
            lbf.setValue(curRec, recYCXVT, arrFieldsIA, arrFieldsBodyYCXN);
            let arrDataItemIA = getArrayDataItemIA(ycxvtId);
            const lc = recYCXVT.getLineCount("item");
            for (let i = 0; i < lc; i++) {
                let isCommit = false;
                const item = recYCXVT.getSublistValue({sublistId: 'item', fieldId: 'item', line: i});
                let qtyOutbound = recYCXVT.getSublistValue({sublistId: 'item', fieldId: 'quantity', line: i}) * 1;
                let qtyInbound = recYCXVT.getSublistValue({sublistId: 'item', fieldId: 'custcol_scv_plan_qty', line: i}) * 1;
                const factor = getFactorQuantity({
                    typeYCXVT: typeYCXVT,
                    quantityInbound: qtyInbound,
                    quantityOutbound: qtyOutbound
                });
                qtyInbound = qtyInbound * factor;
                qtyOutbound = qtyOutbound * factor;
                const blReceipt = factor > 0;
                const units = recYCXVT.getSublistValue({sublistId: 'item', fieldId: 'units', line: i});
                const unitslist = recYCXVT.getSublistValue({sublistId: 'item', fieldId: 'unitslist', line: i});
                const exeDate = recYCXVT.getSublistValue({sublistId: 'item', fieldId: 'custcol_scv_exe_date', line: i});
                const empProcess1 = recYCXVT.getSublistValue({sublistId: 'item', fieldId: 'custcol_scv_emp_process1', line: i});
                const empProcess2 = recYCXVT.getSublistValue({sublistId: 'item', fieldId: 'custcol_scv_emp_process2', line: i});
                const empProcess3 = recYCXVT.getSublistValue({sublistId: 'item', fieldId: 'custcol_scv_emp_process3', line: i});
                const empProcess4 = recYCXVT.getSublistValue({sublistId: 'item', fieldId: 'custcol_scv_emp_process4', line: i});
                const memo = recYCXVT.getSublistValue({sublistId: 'item', fieldId: 'custcol_scv_memo', line: i});
                const oriLineId = recYCXVT.getSublistValue({sublistId: 'item', fieldId: 'custcol_scv_ori_lineid', line: i});
                const custcol_far_trn_relatedasset = recYCXVT.getSublistValue({sublistId: 'item', fieldId: 'custcol_far_trn_relatedasset', line: i});

                let objDataLine = {
                    item: item,
                    location: locIdHeader,
                    unitslist: unitslist,
                    units: units,
                    exeDate,
                    empProcess1,
                    empProcess2,
                    empProcess3,
                    empProcess4,
                    memo,
                    oriLineId,
                    custcol_far_trn_relatedasset
                };
                if (qtyOutbound === 0) {
                    // const qtyFullfill = recYCXVT.getSublistValue({
                    //     sublistId: 'item',
                    //     fieldId: 'fulfillmentstatusquantity',
                    //     line: i
                    // }) * factor;
                    const statusItem = recYCXVT.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_scv_item_status',
                        line: i
                    });
                    if (!statusItem) {
                        throw 'Please input value for Trạng thái Item for line ' + (i + 1).toString();
                    }
                    const lotSupplier = recYCXVT.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_supplier_lot',
                        line: i
                    });
                    const binNumberId = recYCXVT.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_scv_bin',
                        line: i
                    });
                    objDataLine.adjustqtyby = qtyInbound;
                    curRec.selectNewLine({sublistId: slIA});
                    setDataDefaultOnLine(curRec, slIA, objDataLine);
                    //curRec.setCurrentSublistValue({sublistId: slIA, fieldId: 'quantity', value: qtyFullfill});
                    setUnitCostOnLine(blReceipt, curRec, slIA);
                    insertInventoryDetailCurrent(curRec, slIA, ['binnumber', 'inventorystatus', 'quantity'], [binNumberId, statusItem, qtyInbound], '', lotSupplier);
                    if (blReceipt) lbf.setCurrentSublistValueData(curRec, slIA, ['custcol_scv_plan_qty', 'custcol_scv_item_status', 'custcol_supplier_lot', 'amount'], ['', '', '', 0]);
                    else lbf.setCurrentSublistValueData(curRec, slIA, ['quantity', 'amount'], [0, 0]);
                    isCommit = true;
                    isSave = true;
                } else {
                    const objItem = arrDataItemIA.find(d => d.item === item);
                    const qtyItem = objItem?.qty || 0;
                    let qtyRemain = qtyOutbound - qtyItem;
                    if (qtyRemain === 0) continue;
                    objDataLine.adjustqtyby = qtyRemain;
                    setDataDefaultOnLine(curRec, slIA, objDataLine);
                    setUnitCostOnLine(blReceipt, curRec, slIA);
                    const hasInvAvail = recYCXVT.getSublistValue({
                        sublistId: slYCXN,
                        fieldId: 'inventorydetailavail',
                        line: i
                    });
                    if (!hasMarked(hasInvAvail)) {
                        curRec.commitLine({sublistId: slIA});
                        continue;
                    }
                    let recSubInvDet = recYCXVT.getSublistSubrecord({
                        sublistId: slYCXN,
                        fieldId: 'inventorydetail',
                        line: i
                    });
                    const lcInvAvail = recSubInvDet.getLineCount(slIVD);
                    for (let j = 0; j < lcInvAvail; j++) {
                        const binNum = recSubInvDet.getSublistValue({sublistId: slIVD, fieldId: 'binnumber', line: j});
                        const inventorystatus = recSubInvDet.getSublistValue({
                            sublistId: slIVD,
                            fieldId: 'inventorystatus',
                            line: j
                        });
                        const qtySign = recSubInvDet.getSublistValue({
                            sublistId: slIVD,
                            fieldId: 'quantity',
                            line: j
                        }) * factor;
                        const rLineData = [binNum, qtySign, inventorystatus];
                        const issueInvNum = recSubInvDet.getSublistValue({
                            sublistId: slIVD,
                            fieldId: 'issueinventorynumber',
                            line: j
                        });
                        let receiptInvNum = recSubInvDet.getSublistValue({
                            sublistId: slIVD,
                            fieldId: 'receiptinventorynumber',
                            line: j
                        }) || recSubInvDet.getSublistText({
                            sublistId: slIVD,
                            fieldId: 'issueinventorynumber',
                            line: j
                        });
                        insertInventoryDetailCurrent(curRec, slIA, ['binnumber', 'quantity', 'inventorystatus'], rLineData, issueInvNum, receiptInvNum, j > 0);
                    }
                    isCommit = true;
                    isSave = true;
                }
                if (isCommit) curRec.commitLine({sublistId: slIA});
            }
            if (isSave) {
                return curRec.save({ignoreMandatoryFields: true});
            }
            return null;
        };

        /**
         * Des: To get factor and check type Inventory Adjustment
         * @param options {Object}
         * @param options.quantityInbound {Number} -  Quantity Inbound
         * @param options.quantityOutbound {Number} -  Quantity Outbound
         * @param options.typeYCNX {String} -  Type YCNX: Empty, Nhap(id-2), Xuat(id-1)
         */
        const getFactorQuantity = (options) => {
            if (!!options.typeYCNX) return options.typeYCNX === CustomTypeYCXN.NHAP ? 1 : -1;
            if (options.quantityInbound > 0) return 1;
            return -1;
        };

        const fetchDataOrderType = (id) => {
            if (!id) return null;
            const lkOrderType = search.lookupFields({
                type: 'customrecord_scv_order_type',
                id: id,
                columns: ['custrecord_scv_receipt_or_fulfill', 'custrecord_scv_adjust_account']
            });
            let objRes = {};
            objRes.transType = lkOrderType?.custrecord_scv_receipt_or_fulfill?.[0]?.value || '';
            objRes.adjustAccountId = lkOrderType?.custrecord_scv_adjust_account?.[0]?.value || '';
            return objRes;
        };

        const setDataDefaultOnLine = (curRec, sublistId, objData) => {
            lbf.setCurrentSublistValueData(curRec, sublistId, [
                'item',
                'location',
                'unitslist',
                'units',
                'adjustqtyby',
                'custcol_scv_exe_date',
                'custcol_scv_emp_process1',
                'custcol_scv_emp_process2',
                'custcol_scv_emp_process3',
                'custcol_scv_emp_process4',
                'memo',
                'custcol_scv_ori_lineid',
                'custcol_far_trn_relatedasset'

            ], [
                objData.item,
                objData.location,
                objData.unitslist,
                objData.units,
                objData.adjustqtyby,
                objData.exeDate,
                objData.empProcess1,
                objData.empProcess2,
                objData.empProcess3,
                objData.empProcess4,
                objData.memo,
                objData.oriLineId,
                objData.custcol_far_trn_relatedasset
            ]);
        }

        const setUnitCostOnLine = (isNhap, curRec, slIA) => {
            if (!isNhap) return;
            const avgCostUnit = curRec.getCurrentSublistValue({sublistId: slIA, fieldId: 'avgunitcost'});
            curRec.setCurrentSublistValue({sublistId: slIA, fieldId: 'unitcost', value: avgCostUnit});
        }

        const insertInventoryDetailCurrent = (newRecord, sublistId, nInvAssField, rLineData, issueinventorynumber, receiptinventorynumber, isNewLine) => {
            const hasSubDet = newRecord.getCurrentSublistValue({sublistId: sublistId, fieldId: 'inventorydetailavail'});
            const slIVD = 'inventoryassignment';
            if (!hasMarked(hasSubDet)) return;
            let recSubIVD = newRecord.getCurrentSublistSubrecord({sublistId: sublistId, fieldId: 'inventorydetail'});
            if ((recSubIVD.getValue('haslines') === 'F' && recSubIVD.getLineCount(sublistId) < 1) || isNewLine) {
                recSubIVD.selectNewLine({sublistId: slIVD});
            } else {
                recSubIVD.selectLine({sublistId: slIVD, line: 0});
            }
            if (lbf.isContainValue(issueinventorynumber)) lbf.setCurrentSublistValueData(recSubIVD, slIVD, ['issueinventorynumber'], [issueinventorynumber]);
            if (lbf.isContainValue(receiptinventorynumber)) lbf.setCurrentSublistValueData(recSubIVD, slIVD, ['receiptinventorynumber'], [receiptinventorynumber]);
            lbf.setCurrentSublistValueData(recSubIVD, slIVD, nInvAssField, rLineData);
            recSubIVD.commitLine(slIVD);
            return recSubIVD;
        }

        const getArrayDataItemIA = (id) => {
            const c = [{name: 'item', summary: 'GROUP'}, {name: 'quantityuom', summary: 'SUM'}];
            const f = [
                search.createFilter({name: 'mainline', operator: search.Operator.IS, values: false}),
                search.createFilter({name: 'taxline', operator: search.Operator.IS, values: false}),
                search.createFilter({name: 'cogs', operator: search.Operator.IS, values: false}),
                search.createFilter({
                    name: 'custbody_scv_created_transaction',
                    operator: search.Operator.ANYOF,
                    values: id
                })
            ];
            let s = search.create({type: search.Type.INVENTORY_ADJUSTMENT, filters: f, columns: c});
            const cols = s.columns;
            let res = s.run().getRange(0, 1000);
            if (res.length === 0) return [];
            return res.map(r => ({item: r.getValue(cols[0]), qty: r.getValue(cols[1]) * 1}))
        }

        const getTotalQuantityInventoryAjustment = (ycxnId) => {
            if (!lbf.isContainValue(ycxnId)) return 0;
            let searchObj = search.load(SavedSearchId.IA_YCXK_RELATED_QTY);
            const myColumns = searchObj.columns;
            searchObj.filters.push(search.createFilter({
                name: "custbody_scv_created_transaction",
                operator: "anyof",
                values: ycxnId
            }));
            let searchData = searchObj.runPaged({pageSize: 1000});
            let totalQuantity = 0;
            const lenPage = searchData.pageRanges.length;
            for (let i = 0; i < lenPage; i++) {
                let currentPage = searchData.fetch({index: i}).data;
                const lcPage = currentPage.length;
                for (let idx = 0; idx < lcPage; idx++) {
                    totalQuantity += currentPage[idx].getValue(myColumns[7]) * 1;
                }
            }
            return totalQuantity;
        };

        const getTotalQuantityYCXVT = (recYCVT) => {
            let totalQuantity = 0;
            const lc = recYCVT.getLineCount("item");
            for (let i = 0; i < lc; i++)
                totalQuantity += recYCVT.getSublistValue("item", 'quantity', i) * 1;
            return totalQuantity;
        };

        const hasMarked = (value) => {
            if (typeof value === 'boolean') return value;
            return value === 'true' || value === 'T';
        };


        return {
            onRequest: onRequest
        }
    })