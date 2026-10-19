/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/redirect', 'N/record', 'N/search', '../lib/scv_lib_function.js'],
    function (redirect, record, search, lbf) {
        const objOrderType = {NHAP_PHE_PHAM: 24};

        /**
         * Definition of the Suitelet script trigger point.
         *
         * @param {Object} context
         * @param {ServerRequest} context.request - Encapsulation of the incoming request
         * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
         * @Since 2015.2
         */
        function onRequest(context) {
            let request = context.request;
            let parameters = request.parameters;
            const crtFromId = parameters.createdfromid;
            const crtRecType = parameters.createdrectype;
            let curRec = record.load({type: crtRecType, id: crtFromId});
            const lotNo = curRec.getText("custbody_scv_assembly_lot");
            const arrDataProduct = fnGetListProduct(curRec);
            const expenseAccountId = fnGetExpenseAcc(curRec);
            const iaId = crtInvAdj(curRec, arrDataProduct, expenseAccountId, crtFromId, lotNo);
            let objRedirect = {};
            if (!!iaId) {
                Object.assign(objRedirect, {type: 'inventoryadjustment', id: iaId});
            } else {
                Object.assign(objRedirect, {type: crtRecType, id: crtFromId});
            }
            redirect.toRecord(objRedirect);
        }

        function crtInvAdj(curRec, arrDataProduct, expenseAccount, crtFromId, lotNo) {
            if (!lbf.isContainValue(expenseAccount)) return null;
            const slInventoryId = 'inventory';
            const slDetInv = 'inventoryassignment';
            let nFieldIa = ['trandate', 'subsidiary'];
            let nFieldIaData = ['account', 'custbody_scv_created_transaction'];
            let rFieldWo = ['trandate', 'subsidiary'];
            let nLineFieldData = ['location', 'item', 'adjustqtyby', 'unitcost'];
            let recIA = record.create({type: 'inventoryadjustment', isDynamic: true});
            recIA.setValue("custbody_scv_order_type", objOrderType.NHAP_PHE_PHAM);
            lbf.setValue(recIA, curRec, nFieldIa, rFieldWo);
            lbf.setValueData(recIA, nFieldIaData, [expenseAccount, crtFromId]);
            const locId = curRec.getValue('location');
            for (let i in arrDataProduct) {
                recIA.selectNewLine({sublistId: slInventoryId});
                lbf.setCurrentSublistValueData(recIA, slInventoryId, nLineFieldData, [locId, arrDataProduct[i].product, arrDataProduct[i].qty, arrDataProduct[i].rate]);
                let itemType = lbf.getItemRecordType(arrDataProduct[i].product);
                if ((itemType === "lotnumberedinventoryitem" || itemType === "lotnumberedassemblyitem") && arrDataProduct[i].qty > 0) {
                    if (!lbf.isContainValue(lotNo)) throw "Please check again value Lot No for Inventory Detail!";
                    let newInvDetail = recIA.getCurrentSublistSubrecord({sublistId: 'inventory', fieldId: 'inventorydetail'});
                    newInvDetail.selectNewLine(slDetInv);
                    newInvDetail.setCurrentSublistValue({sublistId: slDetInv, fieldId: 'receiptinventorynumber', value: lotNo});
                    newInvDetail.setCurrentSublistValue({sublistId: slDetInv, fieldId: 'quantity', value: arrDataProduct[i].qty});
                    newInvDetail.commitLine(slDetInv);
                }
                recIA.commitLine(slInventoryId);
            }
            return recIA.save({enableSourcing: true, ignoreMandatoryFields: true});
        }

        function fnGetExpenseAcc(curRec) {
            const slComp = 'component';
            const lcComp = curRec.getLineCount(slComp);
            let expenseAccount = '';
            for (let i = 0; i < lcComp; i++) {
                const unitCost = curRec.getSublistValue({sublistId: slComp, fieldId: 'unitcost', line: i}).toString();
                if (unitCost !== '-1') continue;
                const item = curRec.getSublistValue({sublistId: slComp, fieldId: 'item', line: i});
                expenseAccount = search.lookupFields({type: 'item', id: item, columns: ['expenseaccount']})?.expenseaccount?.[0]?.value || '';
                if (expenseAccount !== '') break;
            }
            return expenseAccount;
        }

        function fnGetListProduct(curRec) {
            let prefix_rate = 'custbody_scv_wip_rate';
            let prefix_qty = 'custbody_scv_byproduct_qty';
            let prefix_product = 'custbody_scv_wip_byproduct';
            let results = [];
            for (let i = 1; i < 24; i++) {
                const fldRate = prefix_rate + i;
                const fldQty = prefix_qty + i;
                const fldProduct = prefix_product + i;
                const rate = curRec.getValue(fldRate);
                const qty = curRec.getValue(fldQty);
                const product = curRec.getValue(fldProduct);
                if (lbf.isContainValue(rate) && lbf.isContainValue(qty) && lbf.isContainValue(product))
                    results.push({rate: rate, qty: qty, product: product});
            }
            return results;
        }

        return {
            onRequest: onRequest
        };

    });
