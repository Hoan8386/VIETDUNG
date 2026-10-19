/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['../common/scv_common_pdf', 'N/render',
        '../lib/scv_lib_function',
        'N/record', 'N/runtime',
        'N/search',
        '../lib/scv_lib_amount_in_word.js',
        '../common/scv_common_theo_doi_phieu_in'],

    (comPdf, render, lfunc,
     record, runtime, search,
     lamount,
     comPhieuIn) => {

        const TRANSACTIONS_FOR_SAVEDSEARCH_2 = [
            "customerrefund", "check", "itemfulfillment", "vendorbill", "creditmemo",
            "vendorcredit", "invoice", "expensereport", "vendorprepaymentapplication",
            "customerpayment", "vendorpayment", "customerdeposit", "salesorder",
            "vendorprepayment", "custompurchase_scv_lenhchochi", "deposit", "inventoryadjustment"];

        const TRANSACTIONS_FOR_SAVEDSEARCH_1 = ["journalentry", "customtransaction_scv_closing_entry"];

        const onRequest = (scriptContext) => {
            if (scriptContext.request.method === 'GET') {
                let parameters = scriptContext.request.parameters;
                let paramIdTemplate = parameters.TEMPLATE;
                let pdfFile = renderRecordToPdfWithTemplate(parameters.recid, parameters.rectype, paramIdTemplate, parameters);

                comPhieuIn.createPhieuTheoDoi(parameters.recid, paramIdTemplate);
                scriptContext.response.writeFile({
                    file: pdfFile,
                    isInline: true
                });
            }
        }

        const renderRecordToPdfWithTemplate = (idRec, type, templateId, _params) => {
            let rec = record.load({
                type: type,
                id: idRec,
                isDynamic: false
            });

            let renderer = render.create();
            comPdf.addFontVietnamese(renderer);
            renderer.setTemplateByScriptId(templateId);

            //addEntityRecordToRenderer(renderer, rec);
            addSubsidiaryToRenderer(renderer, type, rec);
            addGlImpactToRenderer(renderer, type, rec, idRec);

            renderer.addRecord('record', rec);

            return renderer.renderAsPdf();
        }

        const addGlImpactToRenderer = (renderer, type, rec, idRec) => {
            let {legalName, address} = getLegalNameAndAddress(type, rec);

            if (type.substring(0, 2) !== 'customrecord') {
                let idSSearch = getIdSSearchGlImpact(type);

                let colAcc = search.createColumn({
                    name: 'number',
                    join: 'account'
                });

                let {rGlImpact, cGlImpact} = getGlImpactSsResult(type, idRec, idSSearch, colAcc);

                let impacts = getImpacts(rec, type, rGlImpact, cGlImpact, colAcc);

                let amount = addAmountToRenderer(renderer, type, rec);

                let arr_grp_impact = getDataGlLineMemoBody(renderer, type, rec, impacts);

                try {
                    renderer.addCustomDataSource({
                        format: render.DataSource.OBJECT,
                        alias: "GL",
                        data: {
                            impacts: impacts,
                            groupImpacts: arr_grp_impact,
                            legal_name: legalName,
                            address: address,
                            amount: amount
                        }
                    });
                } catch (e) {
                    log.debug('gl impact', e);
                }
            }
        }

        const getLegalNameAndAddress = (type, rec) => {
            let legalName = '';
            let address = '';
            if (type === record.Type.DEPOSIT) {
                address = rec.getValue('custbody_scv_payee_address');
            }
            if (type === record.Type.CHECK || type === record.Type.CUSTOMER_REFUND
                || type === 'vendorprepayment' || type === record.Type.VENDOR_PAYMENT ||
                type === record.Type.CASH_REFUND || type === 'vendorbill'
                || type === "custompurchase_scv_lenhchochi") {
                legalName = rec.getValue('custbody_scv_check_pay_to');
                if (lfunc.isContainValue(legalName) === false) {
                    let entity = rec.getValue('entity');
                    if (type === record.Type.CUSTOMER_REFUND) {
                        entity = rec.getValue('customer');
                    }
                    let lkE = search.lookupFields({
                        type: 'entity',
                        id: entity,
                        columns: ['custentity_scv_legal_name', 'address']
                    });
                    legalName = lkE.custentity_scv_legal_name;
                    if (legalName === undefined || legalName === null) {
                        legalName = '';
                    }
                    address = lkE.address;
                    if (address === undefined || address === null) {
                        address = '';
                    }
                }
            }

            return {legalName, address};
        }

        const addSubsidiaryToRenderer = (renderer, type, rec) => {
            let subsidiaryId;
            if (type === 'customrecord_scv_emp') {
                subsidiaryId = rec.getValue('custrecord_scv_emp_subsidiary');
            } else if (type === 'customrecord_scv_package') {
                subsidiaryId = rec.getValue('custrecord_scv_package_sub');
            } else {
                subsidiaryId = rec.getValue('subsidiary');
            }

            if (checkValue(subsidiaryId)) {
                let subsidiaryRec = record.load({
                    type: record.Type.SUBSIDIARY,
                    id: subsidiaryId
                });
                renderer.addRecord('subsidiary', subsidiaryRec);
            }
        }

        const addEntityRecordToRenderer = (renderer, rec) => {
            let entityID = rec.getValue('entity');
            if (lfunc.isContainValue(entityID)) {
                let entityType = lfunc.getEntityType(entityID);
                let entityRec = record.load({
                    type: entityType,
                    id: entityID
                });
                renderer.addRecord('entityRec', entityRec);
            }
        }


        const addAmountToRenderer = (renderer, type, rec) => {
            let amount;
            if (type === record.Type.CUSTOMER_PAYMENT) {
                amount = rec.getValue('applied');
            } else if (type === record.Type.CUSTOMER_DEPOSIT) {
                amount = rec.getValue('payment');
            } else if (type === record.Type.DEPOSIT) {
                amount = rec.getValue('origtotal');
            } else if (type === 'vendorprepayment') {
                amount = rec.getValue('payment');
            } else if (type === 'check') {
                amount = rec.getValue('usertotal');
            } else {
                amount = rec.getValue('total');
            }

            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT, alias: "OBJREC", data:
                    {"amount_in_word": lamount.DocTienBangChu((amount), rec.getText('currency'))}
            });

            return amount;
        }

        const getDataGlLineMemoBody = (renderer, type, rec, impacts) => {
            if (TRANSACTIONS_FOR_SAVEDSEARCH_2.includes(type)) {

                let arr_grp_impact = lfunc.onGroupByArray(impacts, ["account_sub"]);
                for (let i = 0; i < arr_grp_impact.length; i++) {
                    let arr_filter_impacts = impacts.filter(function (item) {
                        return item.account_sub === arr_grp_impact[i].account_sub;
                    });
                    let debitamount = 0;
                    let creditamount = 0;
                    for (let j = 0; j < arr_filter_impacts.length; j++) {
                        if (j === 0) {
                            arr_grp_impact[i].entity = arr_filter_impacts[j].entity;
                            arr_grp_impact[i].account = arr_filter_impacts[j].account;
                            arr_grp_impact[i].memo = arr_filter_impacts[j].memo;
                        }
                        debitamount += Number(arr_filter_impacts[j].debitamount);
                        creditamount += Number(arr_filter_impacts[j].creditamount);
                    }
                    arr_grp_impact[i].debitamount = debitamount;
                    arr_grp_impact[i].creditamount = creditamount;
                }

                return arr_grp_impact;
            }

        }

        const getGlImpactSsResult = (type, idRec, idSsearch, colAcc) => {
            let sGlImpact = search.load({
                id: idSsearch
            });

            let cGlImpact = sGlImpact.columns;

            let fGlImpact = sGlImpact.filters;
            fGlImpact.push(search.createFilter({
                name: 'internalid',
                operator: search.Operator.ANYOF,
                values: idRec
            }));
            sGlImpact.filters = fGlImpact;
            if (type === record.Type.JOURNAL_ENTRY || type === "customtransaction_scv_closing_entry") {
                cGlImpact.push(colAcc);
                sGlImpact.columns = cGlImpact;
            }
            let rGlImpact = sGlImpact.run().getRange({
                start: 0,
                end: 1000
            });

            return {rGlImpact, cGlImpact};
        }

        const getIdSSearchGlImpact = (type) => {
            let idSSearch = "customsearch_gl_impact";
            if (type === record.Type.JOURNAL_ENTRY || type === "customtransaction_scv_closing_entry") {
                idSSearch = 'customsearchtransactionimpac';
            } else if (TRANSACTIONS_FOR_SAVEDSEARCH_2.includes(type)) {
                idSSearch = 'customsearch_gl_impact_2'
            }
            return idSSearch;
        }

        const getImpacts = (rec, type, rGlImpact, cGlImpact, colAcc) => {
            let impacts = [];
            let textAcc;

            for (let i = 0; i < rGlImpact.length; i++) {
                if (TRANSACTIONS_FOR_SAVEDSEARCH_1.includes(type)) {
                    textAcc = rGlImpact[i].getValue(colAcc);
                    impacts.push({
                        account: textAcc,
                        debitamount: rGlImpact[i].getValue('debitamount'),
                        creditamount: rGlImpact[i].getValue('creditamount'),
                        memo: rGlImpact[i].getValue('memo'),
                        entity: rGlImpact[i].getText('entity')
                    });

                } else if (TRANSACTIONS_FOR_SAVEDSEARCH_2.includes(type)) {

                    impacts.push({
                        account: rGlImpact[i].getValue(cGlImpact[0]),
                        account_sub: rGlImpact[i].getValue(cGlImpact[0]).substring(0, 4),
                        debitamount: rGlImpact[i].getValue(cGlImpact[1]),
                        creditamount: rGlImpact[i].getValue(cGlImpact[2]),
                        entity: rGlImpact[i].getText(cGlImpact[3]),
                        memo: rGlImpact[i].getValue(cGlImpact[4])

                    });
                } else {
                    for (let k = 0; k < rec.getLineCount('expense'); k++) {
                        let taxcode = rec.getSublistText('expense', 'taxcode', k);
                        let memo = "";
                        if (type === record.Type.CHECK) {
                            textA = rGlImpact[i].getValue(cGlImpact[0]);
                            memo2 = rGlImpact[i].getValue('memo');
                            memo = rGlImpact[i].getValue('memo');

                        } else {
                            memo = rGlImpact[i].getValue(cGlImpact[4]);
                        }
                        if (taxcode !== 'VAT_VN:UNDEF' || taxcode === 'VAT_VN:UNDEF' && textA !== 13311001) {

                            impacts.push({
                                account: rGlImpact[i].getValue(cGlImpact[0]),
                                debitamount: rGlImpact[i].getValue(cGlImpact[1]),
                                creditamount: rGlImpact[i].getValue(cGlImpact[2]),
                                memo: memo
                            });
                        }
                    }
                }
            }

            return impacts;
        }

        function checkValue(value) {
            return value !== null && true && value !== "";
        }


        return {onRequest}

    }
)
;
