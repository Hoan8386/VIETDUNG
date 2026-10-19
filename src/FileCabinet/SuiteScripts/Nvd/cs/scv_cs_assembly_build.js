/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/search', 'N/url', 'N/query', '../olib/lodash.min'],
    function (ccr, search, url, query, _) {

        var items = [];
        var invAssemblyItems;

        function pageInit(scriptContext) {
            try {
                let curRec = scriptContext.currentRecord;
                setDataItemsAndAssembly(curRec);
                disabledFieldQty(curRec, items, invAssemblyItems);
            } catch (e) {
                alert(JSON.stringify(e));
                log.error('pageInit error', JSON.stringify(e));
            }
        }

        function setDataItemsAndAssembly(curRec) {
            const lineCnt = curRec.getLineCount({sublistId: 'component'});
            for (let i = 0; i < lineCnt; i++) {
                let obj = {};
                obj.item = curRec.getSublistValue({sublistId: 'component', fieldId: 'item', line: i});
                obj.line = i;
                items.push(obj);
            }
            invAssemblyItems = getInvAssemblyItems();
        }

        function disabledFieldQty(rec, items, invAssemblyItems) {
            util.each(items, function (o) {
                let findObj = _.find(invAssemblyItems, {'id': _.toInteger(o.item)});
                if (_.isEmpty(findObj)) {
                    let quantityField = rec.getSublistField({sublistId: 'component', fieldId: 'quantity', line: o.line});
                    quantityField.isDisabled = true;
                }
            });
        }

        function getInvAssemblyItems() {
            let objQuery = query.create({type: query.Type.ITEM});
            objQuery.columns = [objQuery.createColumn({alias: 'id', fieldId: 'id'}),];
            let conditionList = [];
            conditionList.push(objQuery.createCondition({"operator": query.Operator.ANY_OF, "values": ['InvtPart', 'Assembly'], "fieldId": "itemtype"}));
            objQuery.condition = objQuery.and(conditionList);
            let objPagedData = objQuery.runPaged({pageSize: 1000});
            let arrResults = [];
            objPagedData.pageRanges.forEach(function (pageRange) {
                let objPage = objPagedData.fetch({index: pageRange.index}).data;
                arrResults.push.apply(arrResults, objPage.asMappedResults());
            });
            return arrResults
        }

        function calcQtyLineComponent(curRec) {
            const qtyProduct = curRec.getValue({fieldId: 'custbody_scv_wc_product_qty'})*1
            if (qtyProduct <= 0) return;
            const slComp = 'component';
            const lineCnt = curRec.getLineCount({sublistId: slComp});
            for (let i = 0; i < lineCnt; i++) {
                curRec.selectLine({sublistId: slComp, line: i});
                const qtyPer = curRec.getSublistValue({sublistId: slComp, fieldId: 'quantityper', line: i});
                let hasSublistSubRecord = curRec.hasSublistSubrecord({sublistId: slComp, fieldId: 'componentinventorydetail', line: i});
                if (!hasSublistSubRecord) {
                    curRec.setCurrentSublistValue({sublistId: slComp, fieldId: 'quantity', value: _.round(calcStrip(qtyProduct * qtyPer), 5), ignoreFieldChange: true});
                }
            }
        }

        function fieldChanged(scriptContext) {
            try {
                let curRec = scriptContext.currentRecord;
                const fldId = scriptContext.fieldId;
                let prefix_qty = 'custbody_scv_byproduct_qty';
                for (let i = 1; i < 24; i++) {
                    if (fldId === prefix_qty.concat(i.toString())) {
                        calcTotalByProductCost(curRec);
                    }
                }
                // disabledFieldQty(rec, items, invAssemblyItems);
                if (fldId === 'custbody_scv_wc_product_qty') {
                    calcQtyLineComponent(curRec);
                }
            } catch (e) {
                console.log('fieldChanged error:' + JSON.stringify(e));
            }
        }

        function calAverageRate() {
            let currentRecord = ccr.get();
            const resultDataItem = getDataARLocOfItems(currentRecord);
            if (!resultDataItem.isSuccess) return;
            const dataItem = resultDataItem.response;
            let sumQuantity = 0 , averageSum = 0 ;
            let sumCostItem = 0;
            const slComp = 'component';
            const lcComp = currentRecord.getLineCount(slComp);
            for ( let i = 0; i < lcComp; i++ ) {
                // Chỉ chạy với 2 loại item sau
                //23: 103_Bán thành phẩm sản xuất
                //24: 105_Bán thành phẩm mua ngoài
                const itemId = currentRecord.getSublistValue({ sublistId: slComp, fieldId: 'item', line: i })
                const objItem = dataItem.find(item => item.itemId === itemId);
                const unitcost = currentRecord.getSublistValue({sublistId: slComp, fieldId: 'unitcost', line: i});
                if ( unitcost !== "-1" && !_.isEmpty(objItem)) {
                    const averageRate = _.toNumber(objItem.ARLoc);
                    const idLineQuantity = "#quantity".concat((i + 1).toString());
                    let lineQuantity = document.querySelector(idLineQuantity).attributes.value.value;
                    if (lineQuantity) {
                        sumQuantity += _.toNumber(lineQuantity)
                        sumCostItem += averageRate * lineQuantity;
                    }
                }
            }
            if (sumQuantity !== 0) averageSum = sumCostItem / sumQuantity;
            currentRecord.setValue("custbody_scv_wip_rate1", averageSum.toFixed(2));
        }

        function getDataARLocOfItems(curRec) {
            const slComp = 'component';
            const locId = curRec.getValue("location");
            const lcComp = curRec.getLineCount(slComp);
            const listItemId = [];
            for ( let i = 0; i < lcComp; i++ ) {
                const unitcost = curRec.getSublistValue({sublistId: slComp, fieldId: 'unitcost', line: i}).toString();
                const itemId = curRec.getSublistValue({ sublistId: slComp, fieldId: 'item', line: i })
                if (unitcost !== "-1" && listItemId.indexOf(itemId) === -1) listItemId.push(itemId);
            }
            let ss = search.load( {id: "customsearch_scv_ab_check_rate1"} );
            let columns = ss.columns;
            if (listItemId.length === 0) return [];
            ss.filters.push(search.createFilter({ name: "internalid", operator: "anyof", values: idItem}));
            if (locId) ss.filters.push(search.createFilter({ name: "internalid", join: "inventoryLocation", operator: "anyof", values: idLoc}));
            let results = ss.run().getRange({start: 0, end: 1000});
            if (results.length === 0) return {isSuccess: false, response: [], error : ''};
            const dataItem = results.map(o => ({
                    itemId : o.id.toString(),
                    ARLoc: o.getValue( columns[7]),
                }));
            return {isSuccess: true, response: dataItem, error : ''};
        }

        function calscrap() {
            calcTotalByProductCost(ccr.get());
        }

        function calcTotalByProductCost(curRec) {
            const prefix_rate = 'custbody_scv_wip_rate';
            const prefix_qty = 'custbody_scv_byproduct_qty';
            let productCost = 0;
            for ( let i = 1; i < 24; i++) {
                const fldRate = prefix_rate + i;
                const fldQty = prefix_qty + i;
                productCost = productCost + curRec.getValue(fldRate) * curRec.getValue(fldQty);
            }
            curRec.setValue('custbody_scv_byproduct_cost', productCost);
            calCharge(curRec);
        }

        function calCharge(curRec) {
            const productCost = curRec.getValue('custbody_scv_byproduct_cost');
            const slComp = 'component';
            const lcComp = curRec.getLineCount(slComp);
            for (let i = 0; i < lcComp; i++) {
                const unitcost = curRec.getSublistValue({sublistId: slComp, fieldId: 'unitcost', line: i}).toString();
                if (unitcost !== '-1') continue;
                curRec.selectLine({sublistId: slComp, line: i});
                curRec.setCurrentSublistValue({sublistId: slComp, fieldId: 'quantity', line: i, value: productCost});
                curRec.commitLine(slComp);
            }
        }

        function nhapphepham() {
            let currentRecord = ccr.get();
            let createPdfUrl = url.resolveScript({
                scriptId: 'customscript_scv_sl_assembly_build',
                deploymentId: 'customdeploy_scv_sl_assembly_build',
                returnExternalUrl: false
            });
            createPdfUrl += '&createdfromid=' + currentRecord.id + '&createdrectype=' + currentRecord.type;
            window.location.replace(createPdfUrl);
        }

        function calcStrip(number) {
            return (parseFloat(number.toPrecision(12)));
        }

        function createMFGInspection() {
            const rowElement = document.getElementById('tr_custpage_bt_mfg_inspection');
            const inputElement = document.getElementById('custpage_bt_mfg_inspection');
            
            rowElement.classList.add('pgBntGDis');
            rowElement.classList.remove('pgBntG');
            inputElement.disabled = true;

            let currentRecord = ccr.get();
            let internalId = currentRecord.id;
            let type = currentRecord.type;
            let createPdfUrl = url.resolveScript({scriptId: 'customscript_scv_sl_mfg_inspection', deploymentId: 'customdeploy_scv_sl_mfg_inspection', returnExternalUrl: false});
            createPdfUrl += '&createdfromid=' + internalId + '&createdrectype=' + type
            window.location.replace(createPdfUrl);
        }

        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            calscrap: calscrap,
            calAverageRate: calAverageRate,
            nhapphepham: nhapphepham,
            createMFGInspection : createMFGInspection
        };

    });
