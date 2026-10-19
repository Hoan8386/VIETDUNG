/**
 * Nội dung: Chuc Nang Yeu Cau Van Chuyen
 * * =======================================================================================
 *  Date                Author                  Description
 *  27 Sep 2024         Duy Nguyen	    		Init, create file, move from ELMICH
 *                                              - Chuyển chức năng "Yêu cầu xuất kho" từ Elmich sang NVD, BA. Viet (https://app.clickup.com/t/86cwkzeb4)
 *  */
/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/redirect', 'N/runtime', 'N/record', 'N/search', 'N/ui/serverWidget', '../lib/scv_lib_function.js', 'N/format', '../lib/scv_lib_report.js'],

    function (redirect, runtime, record, search, serverWidget, lbf, format, lrp) {
        const objSavedSearch = {IA_YCXK_RELATED_QTY: "customsearch_scv_ia_ycxk_related_qty"};

        function onRequest(context) {
            let request = context.request;
            let response = context.response;
            let parameters = request.parameters;
            let trid = parameters.trid;
            let trtype = parameters.trtype;
            if (request.method === 'GET') {
                let form = serverWidget.createForm({title: 'Make Adjustment'});
                let readRecord = record.load({type: trtype, id: trid});
                const subId = readRecord.getValue('subsidiary');
                addFieldHiden(form, trid, trtype);
                let account = readRecord.getValue('account');
                if (trtype === 'customsale_scv_ot_yc_xvt') account = null;
                addField(readRecord, form, subId, account);
                form.addSubmitButton({label: 'Make Adjustment'});
                response.writePage(form);
            }
            else {
                trid = parameters.custpage_trid;
                trtype = parameters.custpage_trtype;
                const adj_account = parameters.custpage_adj_account;
                const brand = parameters.custpage_brand;
                const date = parameters.custpage_date ? format.parse({value: parameters.custpage_date, type: format.Type.DATE}) : '';
                const memo = parameters.custpage_memo;
                const department = parameters.custpage_department;
                const location_line = parameters.custpage_loc_line;
                let readRecord = record.load({type: trtype, id: trid});
                const order_type = readRecord.getValue("custbody_scv_order_type");
                const empYCVTId  = readRecord.getValue("custbody_scv_employee_ycxvt");
                const sl = 'item';
                const lc = readRecord.getLineCount(sl);
                const slN = 'inventory';
                const recTypeAdj = 'inventoryadjustment';
                let newRecord = record.create({type: recTypeAdj, isDynamic: true, defaultValues: {}});
                let objUser = runtime.getCurrentUser();
                const userId = objUser.id;
                const branchId = search.lookupFields({type : lbf.getEntityType(userId), id : userId, columns : ['custentity_scv_branch']})?.custentity_scv_branch?.[0]?.value || '';
                const nField = ['subsidiary', 'memo', 'department', 'custbody_scv_vpr_employee', 'adjlocation', 'cseg_scv_sg_proj'];
                const rField = ['subsidiary', 'memo', 'department', 'custbody_scv_employee_ycxvt', 'location', 'cseg_scv_sg_proj'];
                const nFieldLine = ['item', 'units', 'cseg_scv_sg_proj'];
                const rFieldLine = ['item', 'units', 'cseg_scv_sg_proj'];
                const ycxvtType = readRecord.getValue('custbody_scv_ycxvt_type').toString();
                const ycvcNhap = ycxvtType === '2';
                const sign =  trtype === 'customsale_scv_ot_yc_xvt' && ycvcNhap ? 1 : -1;
                lbf.setValue(newRecord, readRecord, nField, rField);
                lbf.setValueData(newRecord,
                    ['custbody_scv_created_transaction', 'trandate', 'memo', 'account', 'custbody_scv_order_type', 'department', 'cseg_scv_sg_brand', 'custbody_scv_tb_entity_name', 'cseg_scv_branch'],
                    [trid, date, memo, adj_account, order_type, department, brand, empYCVTId, branchId]
                );
                const nInvAssField = ['binnumber', 'quantity'];
                const slIVD = 'inventoryassignment';
                const arrDataItem = fnGetDataItem(trid);
                const arrItemSelected = getDataItemSelected(request);
                let isSave = false;
                for ( let i = 0; i < lc; i++ ) {
                    const idDet = readRecord.getSublistValue({sublistId: sl, fieldId: 'id', line: i}).toString();
                    let objItemSLMark = arrItemSelected.find(e => e.id.toString() === idDet);
                    if (!lbf.isContainValue(objItemSLMark)) continue;
                    let quantity = sign * readRecord.getSublistValue({sublistId: sl, fieldId: 'quantity', line: i});
                    const item = readRecord.getSublistValue({sublistId: sl, fieldId: 'item', line: i});
                    const qtyItem = arrDataItem.find(o => o.item === item)?.qty || 0;
                    quantity -= qtyItem;
                    if (quantity === 0) continue;
                    isSave = true;
                    newRecord.selectNewLine({sublistId: slN});
                    lbf.setCurrentSublistValue(newRecord, readRecord, slN, sl, nFieldLine, rFieldLine, i);
                    lbf.setCurrentSublistValueData(newRecord, slN, ['quantity', 'location'], [quantity, location_line]);
                    if (trtype === 'customsale_scv_ot_yc_xvt' && sign === 1) {
                        const avgCostUnit = newRecord.getCurrentSublistValue({sublistId: slN, fieldId: 'avgunitcost'});
                        lbf.setCurrentSublistValueData(newRecord, slN, ['unitcost'], [avgCostUnit]);
                    }
                    const hasInvAvail = readRecord.getSublistValue({sublistId: sl, fieldId: 'inventorydetailavail', line: i});
                    if (isTruthy(hasInvAvail)) {
                        let recSub = readRecord.getSublistSubrecord({sublistId: sl, fieldId: 'inventorydetail', line: i});
                        const lcInvAvail = recSub.getLineCount(slIVD);
                        for (let j = 0; j < lcInvAvail; j++) {
                            const binNum = recSub.getSublistValue({sublistId: slIVD, fieldId: 'binnumber', line: j});
                            const qtySign = recSub.getSublistValue({sublistId: slIVD, fieldId: 'quantity', line: j}) * sign;
                            const rLineData = [binNum, qtySign];
                            const issueInvNum = recSub.getSublistValue({sublistId: slIVD, fieldId: 'issueinventorynumber', line: j});
                            let receiptInvNum = recSub.getSublistValue({sublistId: slIVD, fieldId: 'receiptinventorynumber', line: j});
                            if (!lbf.isContainValue(receiptInvNum)) receiptInvNum = recSub.getSublistText({sublistId: slIVD, fieldId: 'issueinventorynumber', line: j});
                            insertInventoryDetailCurrent(newRecord, slN, nInvAssField, rLineData, issueInvNum, receiptInvNum);
                        }
                    }
                    newRecord.commitLine(slN);
                }
                if (isSave) {
                    const idAdj = newRecord.save({enableSourcing: true, ignoreMandatoryFields: true});
                    if (trtype === 'customsale_scv_ot_yc_xvt') {
                        const totalQtyIA = getTotalQtyIA(trid);
                        const totalQtyYCXVT = getTotalQtyYCXVT(readRecord);
                        readRecord.setValue('custbody_scv_ia_total_related_qty', totalQtyIA);
                        readRecord.setValue('custbody_scv_related_transaction', idAdj);
                        if (totalQtyIA === totalQtyYCXVT) readRecord.setValue('transtatus', 'C');
                        readRecord.save({enableSourcing: false, ignoreMandatoryFields: true});
                    }
                    redirect.toRecord({type: recTypeAdj, id: idAdj});
                } else {
                    redirect.toRecord({type: trtype, id: trid});
                }
            }
        }

        function getTotalQtyYCXVT(recYCVT) {
            let totalQty = 0;
            const lc = recYCVT.getLineCount("item");
            for (let i = 0; i < lc; i++)
                totalQty += recYCVT.getSublistValue("item", 'quantity', i) * 1;
            return totalQty;
        }

        function getTotalQtyIA(ycxnId) {
            if (!lbf.isContainValue(ycxnId)) return 0;
            let resultSearch = search.load(objSavedSearch.IA_YCXK_RELATED_QTY);
            const myColumns = resultSearch.columns;
            let myFilters = resultSearch.filters;
            myFilters.push(search.createFilter({name: "custbody_scv_created_transaction", operator: "anyof", values: ycxnId}))
            resultSearch = resultSearch.runPaged({pageSize: 1000});
            let sumQty = 0;
            const lenPage = resultSearch.pageRanges.length;
            for (let i = 0; i < lenPage; i++) {
                let currentPage = resultSearch.fetch({index: i}).data;
                const lcPage = currentPage.length;
                for (let idx = 0; idx < lcPage; idx++) {
                    const qty = currentPage[idx].getValue(myColumns[7]) * 1;
                    sumQty += qty;
                }
            }
            return sumQty;
        }


        function insertInventoryDetailCurrent(newRecord, sublistId, nInvAssField, rLineData, issueinventorynumber, receiptinventorynumber) {
            const hasSubDet = newRecord.getCurrentSublistValue({sublistId: sublistId, fieldId: 'inventorydetailavail'});
            const slIVD = 'inventoryassignment';
            if (isTruthy(hasSubDet)) {
                let recSubIVD = newRecord.getCurrentSublistSubrecord({
                    sublistId: sublistId,
                    fieldId: 'inventorydetail'
                });
                recSubIVD.selectNewLine({sublistId: slIVD});
                if (lbf.isContainValue(issueinventorynumber))
                    lbf.setCurrentSublistValueData(recSubIVD, slIVD, ['issueinventorynumber'], [issueinventorynumber]);
                if (lbf.isContainValue(receiptinventorynumber))
                    lbf.setCurrentSublistValueData(recSubIVD, slIVD, ['receiptinventorynumber'], [receiptinventorynumber]);
                lbf.setCurrentSublistValueData(recSubIVD, slIVD, nInvAssField, rLineData);
                recSubIVD.commitLine(slIVD);
            }
        }

        function addField(ycxkRec, form, subsidiary, account) {
            let date = ycxkRec.getValue("trandate");
            let location = ycxkRec.getValue("location");
            let memo = ycxkRec.getValue("memo");
            let department = ycxkRec.getValue("department");
            form.addFieldGroup({id: 'fieldgroup_dc_main', label: 'Main'});
            let objAddField = {
                id: 'custpage_adj_account',
                type: serverWidget.FieldType.SELECT,
                label: 'ADJUSTMENT ACCOUNT',
                container: 'fieldgroup_dc_main'/*, source: 'account'*/
            };
            if (lbf.isContainValue(account)) {
                objAddField.source = 'account';
            }
            let custpage_adj_account = form.addField(objAddField);
            if (lbf.isContainValue(account)) {
                custpage_adj_account.defaultValue = account;
                custpage_adj_account.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });
            } else {
                addAccount(subsidiary, custpage_adj_account)
            }
            custpage_adj_account.isMandatory = true;

            let custpage_date = form.addField({
                id: "custpage_date",
                type: serverWidget.FieldType.DATE,
                label: "Date",
                container: 'fieldgroup_dc_main'
            }).updateLayoutType({layoutType: serverWidget.FieldLayoutType.STARTROW});
            custpage_date.isMandatory = true;
            if (lbf.isContainValue(date)) custpage_date.defaultValue = date;
            let custpage_loc_line = form.addField({
                id: "custpage_loc_line",
                type: serverWidget.FieldType.SELECT,
                label: "Location Line",
                container: 'fieldgroup_dc_main'
            }).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
            custpage_loc_line.isMandatory = true;
            loadLocation(custpage_loc_line, subsidiary);
            if (lbf.isContainValue(location)) {
                custpage_loc_line.defaultValue = location;
            }

            let custpage_memo = form.addField({
                id: "custpage_memo",
                type: serverWidget.FieldType.TEXTAREA,
                label: "Memo",
                container: 'fieldgroup_dc_main'
            });
            if (lbf.isContainValue(memo)) {
                custpage_memo.defaultValue = memo;
            }

            let custpage_department = form.addField({
                id: "custpage_department",
                type: serverWidget.FieldType.SELECT,
                label: "Department",
                container: 'fieldgroup_dc_main'
            });
            loadDepartment(custpage_department, subsidiary);
            if (lbf.isContainValue(department)) {
                custpage_department.defaultValue = department;
            }

            let custpage_brand = form.addField({
                id: "custpage_brand",
                type: serverWidget.FieldType.SELECT,
                label: "Brand",
                container: 'fieldgroup_dc_main'
            });
            let c = ['internalid', 'name'];
            let f = [['isinactive', 'is', false]];
            if (lbf.isContainValue(subsidiary)) {
                f.push('and');
                f.push(['cseg_scv_sg_brand_filterby_subsidiary', 'anyOf', subsidiary]);
            }
            lrp.addSelection(custpage_brand, 'customrecord_cseg_scv_sg_brand', c, f, true, ycxkRec.getValue('cseg_scv_sg_brand'));

            let itemSublist = form.addSublist({
                id: "custpage_sl_item",
                type: serverWidget.SublistType.LIST,
                label: 'Item'
            });
            itemSublist.addMarkAllButtons();
            itemSublist.addField({
                    id: "custpage_col_select",
                    type: serverWidget.FieldType.CHECKBOX, label: 'Select'
                }
            );
            itemSublist.addField({
                    id: "custpage_col_id",
                    type: serverWidget.FieldType.TEXT, label: 'ID'
                }
            ).updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});
            itemSublist.addField({
                    id: "custpage_col_item",
                    type: serverWidget.FieldType.SELECT, source: "item",
                    label: 'Item'
                }
            ).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
            itemSublist.addField({
                    id: "custpage_col_description",
                    type: serverWidget.FieldType.TEXTAREA,
                    label: 'Description'
                }
            ).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
            itemSublist.addField({
                    id: "custpage_col_unit",
                    type: serverWidget.FieldType.TEXT, label: 'Units'
                }
            ).updateDisplayType({displayType: serverWidget.FieldDisplayType.DISABLED});
            itemSublist.addField({
                    id: "custpage_col_qty",
                    type: serverWidget.FieldType.FLOAT, label: 'Qty'
                }
            ).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});

            let arrItem = getDataItemToIA(ycxkRec);
            for (let i = 0; i < arrItem.length; i++) {
                setRowDataSublist(itemSublist, i, [
                    "custpage_col_item", "custpage_col_unit", "custpage_col_qty",
                    "custpage_col_id", "custpage_col_description", "custpage_col_select"
                ], [
                    arrItem[i].item, arrItem[i].unit, arrItem[i].qty,
                    arrItem[i].id, arrItem[i].description, "T"
                ]);
            }
        }

        function fnGetDataItem(trid) {
            const c = [{name: 'item', summary: 'GROUP'}, {name: 'quantityuom', summary: 'SUM'}];
            let f = [
                search.createFilter({name: 'mainline', operator: search.Operator.IS, values: false}),
                search.createFilter({name: 'taxline', operator: search.Operator.IS, values: false}),
                search.createFilter({name: 'cogs', operator: search.Operator.IS, values: false}),
                search.createFilter({name: 'custbody_scv_created_transaction', operator: search.Operator.ANYOF, values: trid})
            ];
            let s = search.create({type: 'inventoryadjustment', filters: f, columns: c});
            let cols = s.columns;
            let res =  s.run().getRange(0, 1000);
            if (res.length === 0) return [];
            return res.map(r => ({item : r.getValue(cols[0]), qty : r.getValue(cols[1])*1}));
        }

        function addAccount(subsidiary, custpage_adj_account) {
            let c = ['internalid', 'number', 'displayname'];//, 'and', ['type', 'noneof', 'Bank']
            let f = [['isinactive', 'is', false], 'and', ['subsidiary', 'anyof', subsidiary]];
            let s = search.create({
                type: 'account',
                filters: f,
                columns: c
            });
            //r[i].getValue(c[1]) + ' ' +
            let r = s.run().getRange(0, 1000);
            let lR = r.length;
            for (let i = 0; i < lR; i++) {
                custpage_adj_account.addSelectOption({value: r[i].id, text: r[i].getValue(c[2]), isSelected: false});
            }
        }

        function getDataItemToIA(_ycxkRec) {
            let arrObj = [];
            for (let i = 0; i < _ycxkRec.getLineCount("item"); i++) {
                let obj = {};
                obj.id = _ycxkRec.getSublistValue({sublistId: "item", fieldId: "id", line: i});
                obj.item = _ycxkRec.getSublistValue({sublistId: "item", fieldId: "item", line: i});
                obj.qty = _ycxkRec.getSublistValue({sublistId: "item", fieldId: "quantity", line: i});
                obj.unit = _ycxkRec.getSublistValue({sublistId: "item", fieldId: "units_display", line: i});
                obj.description = _ycxkRec.getSublistValue({sublistId: "item", fieldId: "description", line: i});
                arrObj.push(obj);
            }
            return arrObj;
        }

        function getDataItemSelected(_request) {
            let arrResult = [];
            const lc = _request.getLineCount("custpage_sl_item");
            for (let i = 0; i < lc; i++) {
                const mark = _request.getSublistValue("custpage_sl_item", "custpage_col_select", i);
                if (isTruthy(mark)) {
                    let obj = {};
                    obj.id = _request.getSublistValue("custpage_sl_item", "custpage_col_id", i);
                    obj.qty = _request.getSublistValue("custpage_sl_item", "custpage_col_qty", i);
                    arrResult.push(obj);
                }
            }
            return arrResult;
        }

        function addFieldHiden(form, trid, trtype) {
            let custpage_trid = form.addField({
                id: 'custpage_trid',
                type: serverWidget.FieldType.TEXT,
                label: 'TRID'
            });
            custpage_trid.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});
            custpage_trid.defaultValue = trid;

            let custpage_trtype = form.addField({
                id: 'custpage_trtype',
                type: serverWidget.FieldType.TEXT,
                label: 'TRType'
            });
            custpage_trtype.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});
            custpage_trtype.defaultValue = trtype;
        }

        function setRowDataSublist(_sublist, _line, _field, _data) {
            for (let i = 0; i < _field.length; i++) {
                addValueColField(_sublist, _field[i], _line, _data[i]);
            }
        }

        function addValueColField(sublist, id, line, value) {
            if (lbf.isContainValue(value)) {
                sublist.setSublistValue({
                    id: id,
                    line: line,
                    value: value
                });
            }
        }

        function loadLocation(_locField, _subidiary) {
            if (lbf.isContainValue(_subidiary)) {
                let locSearch = search.create({
                    type: "location",
                    filters: [
                        ['subsidiary', 'anyOf', _subidiary],
                        'and',
                        ['isinactive', 'is', false]
                    ],
                    columns: ["name"]
                });
                let locationRss = locSearch.run().getRange(0, 1000);

                for (let idx in locationRss) {
                    _locField.addSelectOption({
                        value: locationRss[idx].id,
                        text: locationRss[idx].getValue('name')
                    });
                }
            }
        }

        function loadDepartment(_depField, _subidiary) {
            if (lbf.isContainValue(_subidiary)) {
                let resultSearch = search.create({
                    type: "department",
                    filters: [
                        ['subsidiary', 'anyOf', _subidiary],
                        'and',
                        ['isinactive', 'is', false]
                    ],
                    columns: ["name"]
                });
                resultSearch = resultSearch.run().getRange(0, 1000);
                for (let idx in resultSearch) {
                    _depField.addSelectOption({value: resultSearch[idx].id, text: resultSearch[idx].getValue('name')});
                }
            }
        }

        function isTruthy(value) {
            if (typeof value === 'boolean') return value;
            return value === 'true' || value === 'T';
        }


        return {
            onRequest: onRequest
        };

    });
