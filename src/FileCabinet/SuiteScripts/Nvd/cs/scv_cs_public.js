/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([
    "N/format",
    "N/query",
    "../olib/clib",
    "N/search",
    "../olib/lodash.min",
    "N/currentRecord",
    "N/url",
    "N/record",
    "N/ui/message"
],
 function (
    format,
    query,
    clib,
    search,
    _,
    currentRecord,
    url,
    record,
    message,
) {

    let objTemp = {};
    const ORDER_TYPE = {
        WATER: "33",
        LAND: "5",
        UTILITIES_CON_FEE: "22",
    };
    const ITEM = {
        HE_THONG_THOAT_NUOC: "518",
        DAU_CAP_NUOC_SACH: "524",
        THOAT_NUOC_THAI: "525",
        THUE_GTGT_DAU_RA: "999",
    };

    function pageInit(scriptContext) {
        try {
            switch (scriptContext.currentRecord.type) {
                case "customrecord_scv_emp":
                    pageInitEmp(scriptContext);
                    break;
                case record.Type.EXPENSE_REPORT:
                    pageInitExpenseReport(scriptContext);
                    break;
                case record.Type.DEPOSIT:
                    pageInitDeposit(scriptContext);
                    break;
                case record.Type.VENDOR_BILL:
                    pageInitBill(scriptContext);
                    break;
                case "customrecord_scv_pur_requisition":
                    pageInitPR(scriptContext);
                    break;
                default:
                    console.log(JSON.stringify(scriptContext));
                    break;
            }
            if (scriptContext.currentRecord.getValue("custpage_type")) {
                switch (scriptContext.currentRecord.getValue("custpage_type")) {
                    case "Generate Principal and Interest":pageInitGPI(scriptContext); break;
                    case "Revenues Summary": pageInitRevenuesSummary(scriptContext); break;
                    case "Tong Von Dau Tu": pageInitTVDT(scriptContext); break;
                    case "Budget History": pageInitBudgetHistory(scriptContext); break;
                    default:
                        break;
                }
            }
        } catch (e) {
            console.log("pageInit error:" + JSON.stringify(e));
        }
    }

    function pageInitTVDT(scriptContext) {
        let currentRecord = scriptContext.currentRecord;
        const numLines = currentRecord.getLineCount({sublistId: "search_sublist"});
        for (let i = 0; i < numLines; i++) {
            let stt = currentRecord.getSublistValue({sublistId: "search_sublist", fieldId: "stt", line: i,});
            if (clib.isEmpty(stt)) {
                let tdColor = "lightblue";
                let trDom = document.getElementById("search_sublistrow" + i);
                let trDomChild = trDom.children;
                const lTrDomeChild = trDomChild.length;
                for (let t = 0; t < lTrDomeChild; t ++) {
                    let tdDom = trDomChild[t];
                    tdDom.setAttribute("style", "background-color: " + tdColor + "!important;border-color: white " + tdColor + " " + tdColor + " " + tdColor + "!important;");
                }
            }
        }
    }

    function pageInitBudgetHistory(scriptContext) {
        let currentRecord = scriptContext.currentRecord;
        let numLines = currentRecord.getLineCount({
            sublistId: "search_sublist",
        });
        for (let i = 0; i < numLines; i++) {
            let level = currentRecord.getSublistValue({sublistId: "search_sublist", fieldId: "level", line: i,});
            if (level === "1") {
                let tdColor = "lightblue"; //(Light Green)
                let trDom = document.getElementById("search_sublistrow" + i);
                let trDomChild = trDom.children;
                for (let t = 0; t < trDomChild.length - 1; t += 1) {
                    let tdDom = trDomChild[t];
                    tdDom.setAttribute("style", "background-color: " + tdColor + "!important;border-color: white " + tdColor + " " + tdColor + " " + tdColor + "!important;");
                }
            }
            if (level === "2") {
                let tdColor = "LightCyan"; //(Light Green)
                let trDom = document.getElementById("search_sublistrow" + i);
                let trDomChild = trDom.children;
                for (let t = 0; t < trDomChild.length - 1; t += 1) {
                    let tdDom = trDomChild[t];
                    tdDom.setAttribute("style", "background-color: " + tdColor + "!important;border-color: white " + tdColor + " " + tdColor + " " + tdColor + "!important;");
                }
            }
        }
    }

    function pageInitRevenuesSummary(scriptContext) {
        let lineCnt = scriptContext.currentRecord.getLineCount({sublistId: "search_sublist",});
        for (let i = 0; i < lineCnt; i++) {
            let headerrow = scriptContext.currentRecord.getSublistValue({sublistId: "search_sublist", fieldId: "headerrow", line: i,});
            if (headerrow === "1") {
                let tdColor = "lightblue";
                let trDom = document.getElementById("search_sublistrow" + i);
                let trDomChild = trDom.children;
                for (let t = 0; t < trDomChild.length - 1; t += 1) {
                    let tdDom = trDomChild[t];
                    tdDom.setAttribute("style", "background-color: " + tdColor + "!important;border-color: white " + tdColor + " " + tdColor + " " + tdColor + "!important;");
                }
            }
        }
    }

    function pageInitGPI(scriptContext) {
        let currentRecord = scriptContext.currentRecord;
        let numLines = currentRecord.getLineCount({sublistId: "search_sublist",});
        for (let i = 0; i < numLines; i++) {
            let paytype = currentRecord.getSublistValue({sublistId: "search_sublist", fieldId: "c2", line: i,});
            if (paytype === "Principal") {
                let tdColor = "lightblue";
                let trDom = document.getElementById("search_sublistrow" + i);
                let trDomChild = trDom.children;
                for (let t = 0; t < trDomChild.length; t += 1) {
                    let tdDom = trDomChild[t];
                    tdDom.setAttribute("style", "background-color: " + tdColor + "!important;border-color: white " + tdColor + " " + tdColor + " " + tdColor + "!important;");
                }
            }
        }
    }

    function pageInitPR(scriptContext) {
        let newRecord = scriptContext.currentRecord;
        if (scriptContext.mode === "create" || scriptContext.mode === "copy")
            newRecord.setValue("name", "To Be Generated");
    }

    let poid;

    function pageInitYCNX(scriptContext) {
        try {
            poid = clib.getParameterFromURL("recpoid");
            let newRecord = scriptContext.currentRecord;
            console.log(poid);
            newRecord.setValue("memo", "created from po");
            /*if (poid != false && !clib.isEmpty(poid)) {
                    jQuery('#clearsplitsexpense').click();
                  }*/
            //clear all line in expense
            /*while (newRecord.getLineCount({sublistId: 'expense'}) > 0) {
                      newRecord.removeLine({sublistId: 'expense', line: 0});
                  }*/
        } catch (e) {
            console.log(JSON.stringify(e));
        }
    }

    function pageInitBill(scriptContext) {
        try {
            let rec = scriptContext.currentRecord;
            let lineCnt = rec.getLineCount({sublistId: "expense"});
            if (lineCnt > 0)
                //clear sublist item list
                jQuery("#clearsplitsitem").click();
        } catch (e) {
            console.log("pageInitBill error", JSON.stringify(e));
        }
    }

    function pageInitDeposit(scriptContext) {
        let recType = clib.getParameterFromURL("createdrectype"); //customrecord_scv_emp
        let empId = clib.getParameterFromURL("createdfromid");
        if (recType === "customrecord_scv_emp" && !clib.isEmpty(empId)) {
            let myMsg = message.create({title: "Form Init...", message: "", type: message.Type.INFORMATION,});
            myMsg.show();
            try {
                jQuery("#clearsplitsother").click();
                let rec = record.load.promise({
                    type: "customrecord_scv_emp",
                    id: empId,
                });
                rec.then(
                    function (objRecord) {
                        myMsg.hide();
                        let currentRec = scriptContext.currentRecord;
                        let employee = objRecord.getValue({
                            fieldId: "custrecord_scv_emp_employee",
                        });
                        let prepaymentAmount = objRecord.getValue({
                            fieldId: "custrecord_scv_emp_prepayment_amount",
                        });
                        let checkAmount = objRecord.getValue({
                            fieldId: "custrecord_scv_emp_check_amount",
                        });
                        let empRemaining = objRecord.getValue({
                            fieldId: "custrecord_scv_empprepayment",
                        });
                        // let memo = objRecord.getText({fieldId: 'custrecord_scv_emp_memo'});

                        currentRec.setValue({
                            fieldId: "custbody_scv_customerdeposit",
                            value: employee,
                        });
                        currentRec.setValue({fieldId: "memo", value: null});
                        currentRec.setValue({fieldId: "total", value: empRemaining});
                        currentRec.setValue({
                            fieldId: "custbody_scv_emp_number",
                            value: empId,
                        });

                        currentRec.selectNewLine({sublistId: "other"});
                        //account
                        currentRec.setCurrentSublistValue({
                            sublistId: "other",
                            fieldId: "entity",
                            value: employee,
                            ignoreFieldChange: false,
                        });
                        //account
                        /*currentRec.setCurrentSublistValue({
                                                        sublistId: 'other',
                                                        fieldId: 'account',
                                                        value: '3092', //14100200 Tạm ứng  nhân viên: Tạm ứng
                                                        ignoreFieldChange: false
                                                    });*/
                        //amount
                        currentRec.setCurrentSublistValue({
                            sublistId: "other",
                            fieldId: "amount",
                            value: empRemaining,
                            ignoreFieldChange: false,
                        });
                        // currentRec.commitLine({sublistId: 'other'});
                    },
                    function (e) {
                        log.error("error here", JSON.stringify(e));
                    }
                );
            } catch (e) {
                console.log("depositInit error", JSON.stringify(e));
            }
        }
    }

    function pageInitCheck(scriptContext) {
        let recType = clib.getParameterFromURL("createdrectype"); //customrecord_scv_emp
        let empId = clib.getParameterFromURL("createdfromid");

        if (recType === "customrecord_scv_emp" && !clib.isEmpty(empId)) {
            loadEmpPrepayment(scriptContext, empId);
        }
    }

    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */

    function pageInitExpenseReport(scriptContext) {
        try {
            let recType = clib.getParameterFromURL("createdrectype"); //customrecord_scv_emp
            let empId = clib.getParameterFromURL("createdfromid");
            if (recType === "customrecord_scv_emp" && !clib.isEmpty(empId)) {
                let currentRecord = scriptContext.currentRecord;
                let lkField = search.lookupFields({
                    type: "customrecord_scv_emp",
                    id: empId,
                    columns: [
                        "custrecord_scv_emp_employee",
                        "custrecord_scv_emp_due_date",
                        "custrecord_scv_emp_prepayment_amount",
                    ],
                });
                let emp = lkField.custrecord_scv_emp_employee[0].value;
                currentRecord.setValue({fieldId: "entity", value: emp});
                currentRecord.setValue({
                    fieldId: "custbody_scv_emp_number",
                    value: empId,
                });
                let dueDate = lkField.custrecord_scv_emp_due_date;
                if (!clib.isEmpty(dueDate)) {
                    currentRecord.setValue({
                        fieldId: "custbody_scv_ngay_de_nghi_hoan_ung",
                        value: format.parse({value: dueDate, type: format.Type.DATE}),
                        ignoreFieldChange: true,
                    });
                }
                currentRecord.setValue({
                    fieldId: "custbody_scv_exp_amount_of_emp",
                    value: lkField.custrecord_scv_emp_prepayment_amount,
                    ignoreFieldChange: true,
                });
            }
        } catch (e) {
            console.log("loadExpenseReport error", JSON.stringify(e));
        }
    }

    function loadEmpPrepayment(scriptContext, empId) {
        try {
            let rec = record.load.promise({
                type: "customrecord_scv_emp",
                id: empId,
            });
            rec.then(
                function (objRecord) {
                    let currentRec = scriptContext.currentRecord;
                    let prepaymentAmount = objRecord.getValue({
                        fieldId: "custrecord_scv_emp_prepayment_amount",
                    });
                    let checkAmount = objRecord.getValue({
                        fieldId: "custrecord_scv_emp_check_amount",
                    });
                    let memo = objRecord.getValue({fieldId: "custrecord_scv_emp_memo"});
                    let subsidiary = objRecord.getValue({
                        fieldId: "custrecord_scv_emp_subsidiary",
                    });
                    let employee = objRecord.getValue({
                        fieldId: "custrecord_scv_emp_employee",
                    });
                    currentRec.setValue({fieldId: "subsidiary", value: subsidiary});
                    currentRec.setValue({fieldId: "entity", value: employee});
                    // currentRec.setValue({fieldId: 'memo', value: memo});
                    currentRec.setValue({
                        fieldId: "custbody_scv_emp_number",
                        value: empId,
                    });
                    /*currentRec.selectLine({sublistId: 'expense', line: 0});
                                            //account
                                            /!*currentRec.setCurrentSublistValue({
                                                sublistId: 'expense',
                                                fieldId: 'account',
                                                value: '221', //14100200 Tạm ứng  nhân viên: Tạm ứng
                                                ignoreFieldChange: false,
                                                fireSlavingSync: true,
                                                forceSyncSourcing: true

                                            });*!/
                                            //amount
                                            currentRec.setCurrentSublistValue({
                                                sublistId: 'expense',
                                                fieldId: 'amount',
                                                value: prepaymentAmount - checkAmount,
                                                ignoreFieldChange: false,
                                                fireSlavingSync: true,
                                                forceSyncSourcing: true
                                            });
                                            //taxcode
                                            /!*currentRec.setCurrentSublistValue({
                                                sublistId: 'expense',
                                                fieldId: 'taxcode',
                                                value: '5',//anh ơi phần tạm ứng khi bấm nút Check trên màn hình Employee prepayment a đổi cho e cái tax code về UNDEF với ạ
                                                ignoreFieldChange: false,
                                                fireSlavingSync: true,
                                                forceSyncSourcing: true
                                            });*!/
                                            //memo
                                            if (memo != null)
                                                currentRec.setCurrentSublistValue({
                                                    sublistId: 'expense',
                                                    fieldId: 'memo',
                                                    value: memo,
                                                    ignoreFieldChange: false,
                                                    fireSlavingSync: true,
                                                    forceSyncSourcing: true
                                                });
                                            // currentRec.commitLine({sublistId: 'expense'});*/
                },
                function (e) {
                    log.error("error here", JSON.stringify(e));
                }
            );
        } catch (e) {
            console.log("loadEmpPrepayment error", JSON.stringify(e));
        }
    }

    function pageInitEmp(scriptContext) {
        let currentRec = scriptContext.currentRecord;
        if (scriptContext.mode === "create") {
            let code = getMaxEmp()[0].id + 1;
            code = "EMP" + code;
            currentRec.setValue({fieldId: "custrecord_scv_emp_code_id", value: code,});
            currentRec.setValue({fieldId: "name", value: code});
            currentRec.setValue({fieldId: "autoname", value: false, ignoreFieldChange: true,});
        }
    }

    let department;
    function fieldChangedEmp(scriptContext) {
        let currentRec = scriptContext.currentRecord;
        if (scriptContext.fieldId === "custrecord_scv_emp_memo") {
            let memo = currentRec.getValue({fieldId: "custrecord_scv_emp_memo"});
            let code = currentRec.getValue({fieldId: "custrecord_scv_emp_code_id"});
            currentRec.setValue({fieldId: "name", value: code + " - " + memo});
        } else if (scriptContext.fieldId === "custrecord_scv_emp_employee") {
            let employee = currentRec.getValue({fieldId: "custrecord_scv_emp_employee",});
            let departmentLK = search.lookupFields({type: "employee", id: employee, columns: ["department"],}).department;
            department = departmentLK?.[0]?.text || '';
        }
        let sublistId = "recmachcustrecord_scv_emp_number";
        let currency = currentRec.getValue("custrecord_scv_emp_currency");
        let roundNum = 0;
        if (currency !== "1") roundNum = 2;
        if (
            scriptContext.sublistId === sublistId &&
            _.includes(
                [
                    "custrecord_scv_quantity",
                    "custrecord_scv_emp_rate",
                    "custrecord_scv_tax_rate_line_fees",
                ],
                scriptContext.fieldId
            )
        ) {
            //tinh line amount_fees
            let quantity_fees = currentRec.getCurrentSublistValue({
                sublistId: sublistId,
                fieldId: "custrecord_scv_quantity",
            });
            let rate_fees = currentRec.getCurrentSublistValue({
                sublistId: sublistId,
                fieldId: "custrecord_scv_emp_rate",
            });
            let taxrate = currentRec.getCurrentSublistValue({
                sublistId: sublistId,
                fieldId: "custrecord_scv_tax_rate_line_fees",
            });

            let amount = clib.strip(quantity_fees * rate_fees);
            amount = _.round(amount, roundNum);
            currentRec.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: "custrecord_scv_amount_net_line_fees",
                value: amount,
            });
            let taxamount = clib.strip((amount * taxrate) / 100);
            taxamount = _.round(taxamount, roundNum);
            currentRec.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: "custrecord_scv_tax_amt_line_fees",
                value: taxamount,
            });
            currentRec.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: "custrecord_scv_amount",
                value: amount + taxamount,
            });

            //tinh summary
            let lineCnt = currentRec.getLineCount({sublistId: sublistId});
            let sumAmount = 0;
            for (let i = 0; i < lineCnt; i++) {
                currentRec.selectLine({sublistId: sublistId, line: i});
                let amount = currentRec.getCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: "custrecord_scv_amount",
                    // line: i
                });
                sumAmount += amount;
            }
            if (sumAmount > 0)
                currentRec.setValue("custrecord_scv_emp_prepayment_amount", sumAmount);
        }

        if (
            scriptContext.sublistId === sublistId &&
            scriptContext.fieldId === "custrecord_tax_code_line_fees"
        ) {
            let taxcode = currentRec.getCurrentSublistValue({
                sublistId: sublistId,
                fieldId: "custrecord_tax_code_line_fees",
            });
            // let rate = search.lookupFields({type: search.Type.SALES_TAX_ITEM, id: taxcode, columns: ['rate']}).rate;
            let searchTax = searchTaxrate(taxcode);
            let rate = _.head(searchTax).rate;
            rate = _.replace(rate, "%", "");
            currentRec.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: "custrecord_scv_tax_rate_line_fees",
                value: rate,
            });
        }
    }

    function searchTaxrate(taxcode) {
        let customrecord_scv_tax_codeSearchObj = search.create({
            type: "customrecord_scv_tax_code",
            filters: [["custrecord_scv_tax_code_self_service", "anyof", taxcode]],
            columns: [
                search.createColumn({
                    name: "custrecord_scv_tax_code_self_service",
                    label: "Tax code for Self Service",
                }),
                search.createColumn({
                    name: "custrecord_scv_tax_rate_self_service",
                    label: "Tax rate",
                }),
            ],
        });
        let col = customrecord_scv_tax_codeSearchObj.columns;
        let listTax = [];
        customrecord_scv_tax_codeSearchObj.run().each(function (result) {
            // .run().each has a limit of 4,000 results
            let obj = {};
            obj.rate = result.getValue(col[1]);
            listTax.push(obj);
            return true;
        });
        return listTax;
    }

    /**
     * Function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @since 2015.2
     */
    function fieldChanged(scriptContext) {
        try {
            // let recordType = currentRec.getValue({fieldId: 'baserecordtype'});
            switch (scriptContext.currentRecord.type) {
                //Empoyee Prepayment
                case "customrecord_scv_emp":
                    fieldChangedEmp(scriptContext);
                    break;
                case "custompurchase_scv_lenhchi": //Lenh chi - write check
                    fieldChangedLenhchi(scriptContext);
                    break;
                case "customrecord_scv_pur_requisition":
                    fieldChangedPurRequisition(scriptContext);
                    break;
                case "custompurchase_scv_ycnx":
                    // fieldChangedYCNX(scriptContext)
                    break;
                case "custompurchase_scv_tt_vdl_khmh": //Purchase plan
                case "custompurchase_scv_bpl": //Budget
                case "customsale_scv_tt_sale_plan": //Sales plan
                    fieldChangedPurchasePlan(scriptContext);
                    break;
                case record.Type.INVOICE:
                    fieldChangedInvoice(scriptContext);
                    break;
                case record.Type.SALES_ORDER:
                    fieldChangedSO(scriptContext);
                    break;
                case record.Type.VENDOR_BILL:
                    // fieldChangedBill(scriptContext);
                    break;

                default:
                    // console.log(JSON.stringify(scriptContext));
                    break;
            }
            //suitelet form handle
            switch (scriptContext.fieldId) {
                case "custpage_subsidiary":
                    fieldChangedCalculateLandCost(scriptContext);
                    break;
                case "custpage_item_fees":
                    fieldChangedCalsMan_ItemFees(scriptContext);
                    break;
                default:
                    break;
            }
            let formType = scriptContext.currentRecord.getValue("custpage_type");
            switch (formType) {
                case "Calc Management Fees":
                    fieldChangedCalcManaFees(scriptContext);
                    break;
                default:
                    break;
            }
        } catch (e) {
            console.log("fieldChange error:" + JSON.stringify(e));
        }
    }

    function fieldChangedCalcManaFees(scriptContext) {
        let currentRec = scriptContext.currentRecord;
        if (scriptContext.fieldId === "custpage_fromdate") {
            let fromdate = currentRec.getText("custpage_fromdate");
            currentRec.setText("custpage_scdate", fromdate);
        }
    }

    function fieldChangedBill(scriptContext) {
        if (scriptContext.sublistId === 'expense') {
            let currentRec = scriptContext.currentRecord;
            if (scriptContext.fieldId === "tax1amt") {
                let amt = currentRec.getCurrentSublistValue({
                    sublistId: "expense",
                    fieldId: "amount",
                });
                let taxamt = currentRec.getCurrentSublistValue({
                    sublistId: "expense",
                    fieldId: "tax1amt",
                });
                currentRec.setCurrentSublistValue({
                    sublistId: "expense",
                    fieldId: "grossamt",
                    value: amt + taxamt
                });
            }
        }
    }

    function fieldChangedSO(scriptContext) {
        if (scriptContext.sublistId === "item") {
            let currentRec = scriptContext.currentRecord;
            if (scriptContext.fieldId === "item") {
                let item = currentRec.getCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "item",
                });
                let lk = search.lookupFields({
                    type: search.Type.INVENTORY_ITEM,
                    id: item,
                    columns: ["custitem_scv_areaha", "custitem_scv_areasqm"],
                });
                let areaHA = lk.custitem_scv_areaha; //2
                let areaSQM = lk.custitem_scv_areasqm; //3
                if (!!areaHA) {
                    currentRec.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "custcol_scv_clolumn_areaha",
                        value: areaHA,
                        // ignoreFieldChange: true,
                    });
                }
                if (!!areaSQM) {
                    currentRec.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "custcol_scv_column_areasqm",
                        value: areaSQM,
                        // ignoreFieldChange: true,
                    });
                }
            }
            if (_.includes(['custcol_scv_sc_exchange_rate', 'custcol_scv_column_areasqm', 'custcol_scv_rate_foreign', 'taxrate1'], scriptContext.fieldId)) {
                //1
                let exchange_rate = currentRec.getCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "custcol_scv_sc_exchange_rate",
                });
                //3 area sqm
                let areasqm = currentRec.getCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "custcol_scv_column_areasqm",
                });
                //4 unit price
                let unitPrice = currentRec.getCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "custcol_scv_rate_foreign",
                });
                //6 tax rate
                let taxrate = currentRec.getCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "taxrate1",
                });
                taxrate = _.replace(taxrate, '%', '');
                taxrate = taxrate / 100;

                //7 amount (foreign)
                let amtForeign = _.round(clib.strip(areasqm * unitPrice), 2);
                currentRec.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "custcol_scv_amt_foreign",
                    value: amtForeign,
                    ignoreFieldChange: true,
                });
                //8 tax amt (foreign)
                let taxAmtForeign = clib.strip(amtForeign * taxrate);
                currentRec.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "custcol_scv_taxmt_foreign",
                    value: taxAmtForeign,
                    ignoreFieldChange: true,
                });
                //9 gross amt (foreign)
                currentRec.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "custcol_scv_gross_amt_foreign",
                    value: amtForeign + taxAmtForeign,
                    ignoreFieldChange: true,
                });
                //10 rate
                currentRec.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "rate",
                    value: clib.strip(exchange_rate * amtForeign),
                    ignoreFieldChange: true,
                });
                //11 amount
                let amount = clib.strip(exchange_rate * amtForeign);
                currentRec.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "amount",
                    value: amount,
                    ignoreFieldChange: true,
                });
                //12 tax amount
                let taxamout = clib.strip(exchange_rate * amtForeign * taxrate);
                currentRec.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "tax1amt",
                    value: taxamout,
                    ignoreFieldChange: true,
                });
                //13 gross amount
                currentRec.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "grossamt",
                    value: amount + taxamout,
                    ignoreFieldChange: true,
                });
            }
        }
    }

    function fieldChangedInvoice(scriptContext) {
        try {
            let currentRec = scriptContext.currentRecord;
            if (
                scriptContext.sublistId === "item" &&
                scriptContext.fieldId === "item"
            ) {
                let orderType = currentRec.getValue("custbody_scv_order_type");
                let startDate = currentRec.getText("startdate");
                let endDate = currentRec.getText("enddate");
                if (orderType === "33") {
                    //Water
                    let description =
                        "Nước máy từ ngày " + startDate + " đến ngày " + endDate;
                    currentRec.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "description",
                        value: description,
                        ignoreFieldChange: true,
                    });
                }
            }
        } catch (e) {
            console.log("fieldChangedInvoice error:" + e.message);
        }
    }

    function fieldChangedPurchasePlan(scriptContext) {
        try {
            if (scriptContext.sublistId === "item") {
                if (
                    scriptContext.fieldId === "custcol_scv_khmh_qty_plan" ||
                    scriptContext.fieldId === "custcol_scv_rate_pp"
                ) {
                    let currentRec = scriptContext.currentRecord;
                    let qtyplan = _.toNumber(
                        currentRec.getCurrentSublistValue({
                            sublistId: "item",
                            fieldId: "custcol_scv_khmh_qty_plan",
                        })
                    );
                    let rateplan = _.toNumber(
                        currentRec.getCurrentSublistValue({
                            sublistId: "item",
                            fieldId: "custcol_scv_rate_pp",
                        })
                    );
                    let amountPlan = clib.strip(qtyplan * rateplan);
                    currentRec.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "custcol_scv_amount_plan",
                        value: amountPlan,
                    });
                    currentRec.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "amount",
                        value: amountPlan,
                    });
                }
            }
        } catch (e) {
            console.log("fieldChangedPurchasePlan error", JSON.stringify(e));
        }
    }

    function fieldChangedYCNX(scriptContext) {
        let newRecord = scriptContext.currentRecord;
        if (scriptContext.fieldId === "memo") {
            // jQuery('#clearsplitsexpense').click();
            //clear all line in expense
            while (newRecord.getLineCount({sublistId: "expense"}) > 0) {
                newRecord.removeLine({sublistId: "expense", line: 0});
            }
            console.log("clearsplitexpense clicked");
        }
    }

    function fieldChangedPurRequisition(scriptContext) {
        let currentRec = scriptContext.currentRecord;
        let sublistId = "recmachcustrecord_scv_pur_req";
        let lineCnt = currentRec.getLineCount({sublistId: sublistId});
        if (scriptContext.fieldId === "custrecord_scv_req_date") {
            let reqDate = currentRec.getValue("custrecord_scv_req_date");
            for (let i = 0; i < lineCnt; i++) {
                currentRec.selectLine({sublistId: sublistId, line: i});
                currentRec.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: "custrecord_scv_req_need_date",
                    value: reqDate,
                    ignoreFieldChange: true,
                });
            }
        }
        if (scriptContext.fieldId === "custrecord_scv_req_subsidiary") {
            let sub = currentRec.getValue("custrecord_scv_req_subsidiary");
            for (let i = 0; i < lineCnt; i++) {
                currentRec.selectLine({sublistId: sublistId, line: i});
                currentRec.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: "custrecord_scv_fs_line",
                    value: sub,
                    ignoreFieldChange: true,
                });
            }
        }
        //sublist changed
        if (scriptContext.sublistId === "recmachcustrecord_scv_pur_req") {
            let currency = currentRec.getValue("custrecord_scv_pr_currency");
            let currencyRate = currentRec.getValue("custrecord_scv_pr_exchance_rate");
            let roundfix = 0;
            if (currency == "2")
                //USD
                roundfix = 2;
            //change on quantity rate → amount, grossamt
            if (
                _.includes(
                    ["custrecord_scv_pr_rate", "custrecord_scv_pr_itemquantity"],
                    scriptContext.fieldId
                )
            ) {
                let f = [
                    "custrecord_scv_pr_itemquantity",
                    "custrecord_scv_pr_rate",
                    "custrecord_scv_tax_rate",
                ];
                let obj = {};
                util.each(f, function (o) {
                    obj[o] = currentRec.getCurrentSublistValue({
                        sublistId: scriptContext.sublistId,
                        fieldId: o,
                    });
                });
                let amount = clib.strip(
                    obj.custrecord_scv_pr_itemquantity * obj.custrecord_scv_pr_rate
                );
                amount = _.round(amount, roundfix);
                let amountVND = clib.strip(amount * currencyRate);
                let taxamt = clib.strip((obj.custrecord_scv_tax_rate * amount) / 100);
                taxamt = _.round(taxamt);
                let obj2 = {
                    custrecord_scv_pr_amount: amount,
                    custrecord_scv_pr_taxamt: taxamt,
                    custrecord_scv_pr_grossamt: amount + taxamt,
                    custrecord_scv_pr_amount_vnd: amountVND,
                };
                util.each(_.keys(obj2), function (o) {
                    currentRec.setCurrentSublistValue({
                        sublistId: scriptContext.sublistId,
                        fieldId: o,
                        value: obj2[o],
                        ignoreFieldChange: true,
                    });
                });
            }
            //change on item → default set taxcode 10%
            /*if(scriptContext.fieldId == 'custrecord_scv_pr_itemcode'){
                                currentRec.setCurrentSublistValue({sublistId: scriptContext.sublistId, fieldId:'custrecord_scv_pr_tax_code', value:'9', ignoreFieldChange:true});
                                currentRec.setCurrentSublistValue({sublistId:scriptContext.sublistId, fieldId:'custrecord_scv_tax_rate', value:10, ignoreFieldChange:true});
                            }*/
            //change on taxcode
            if (scriptContext.fieldId === "custrecord_scv_pr_tax_code") {
                let taxcode = currentRec.getCurrentSublistValue({
                    sublistId: scriptContext.sublistId,
                    fieldId: "custrecord_scv_pr_tax_code",
                });
                // let taxRec = record.load({type: 'salestaxitem', id: taxcode});
                // let rate = taxRec.getValue('rate');
                let searchTax = searchTaxrate(taxcode);
                let rate = _.head(searchTax).rate;
                rate = _.toNumber(_.replace(rate, "%", ""));
                currentRec.setCurrentSublistValue({
                    sublistId: scriptContext.sublistId,
                    fieldId: "custrecord_scv_tax_rate",
                    value: rate,
                    ignoreFieldChange: true,
                });
                let amount = currentRec.getCurrentSublistValue({
                    sublistId: scriptContext.sublistId,
                    fieldId: "custrecord_scv_pr_amount",
                });
                let taxamt = clib.strip((rate * amount) / 100);
                taxamt = _.round(taxamt, roundfix);
                currentRec.setCurrentSublistValue({
                    sublistId: scriptContext.sublistId,
                    fieldId: "custrecord_scv_pr_taxamt",
                    value: taxamt,
                    ignoreFieldChange: true,
                });
                currentRec.setCurrentSublistValue({
                    sublistId: scriptContext.sublistId,
                    fieldId: "custrecord_scv_pr_grossamt",
                    value: amount + taxamt,
                    ignoreFieldChange: true,
                });
            }
            if (scriptContext.fieldId === "custrecord_scv_pr_taxamt") {
                let amount = currentRec.getCurrentSublistValue({
                    sublistId: scriptContext.sublistId,
                    fieldId: "custrecord_scv_pr_amount",
                });
                let taxamt = currentRec.getCurrentSublistValue({
                    sublistId: scriptContext.sublistId,
                    fieldId: "custrecord_scv_pr_taxamt",
                });
                currentRec.setCurrentSublistValue({
                    sublistId: scriptContext.sublistId,
                    fieldId: "custrecord_scv_pr_grossamt",
                    value: amount + taxamt,
                    ignoreFieldChange: true,
                });
            }
            if (scriptContext.fieldId === "custrecord_scv_pr_itemcode") {
                let item = currentRec.getCurrentSublistValue({
                    sublistId: scriptContext.sublistId,
                    fieldId: scriptContext.fieldId,
                });
                let salesdescription = search.lookupFields({
                    type: search.Type.INVENTORY_ITEM,
                    id: item,
                    columns: ["salesdescription"],
                }).salesdescription;
                currentRec.setCurrentSublistValue({
                    sublistId: scriptContext.sublistId,
                    fieldId: "custrecord_scv_pr_itemdes",
                    value: salesdescription,
                    ignoreFieldChange: true,
                });
            }
        }
    }

    function fieldChangedCalculateLandCost(scriptContext) {
        let currentRec = scriptContext.currentRecord;
        let subsidiary = currentRec.getValue(scriptContext.fieldId);
        let searchResults = [];
        search.load
            .promise({id: "customsearch_scv_landitems"})
            .then(function (objSearch) {
                objSearch.filters.push(
                    search.createFilter({
                        name: "subsidiary",
                        operator: search.Operator.ANYOF,
                        values: subsidiary,
                    })
                );
                let c = objSearch.columns;
                let transactionSearchPagedData = objSearch.runPaged({pageSize: 1000});
                for (let i = 0; i < transactionSearchPagedData.pageRanges.length; i++) {
                    let transactionSearchPage = transactionSearchPagedData.fetch({
                        index: i,
                    });
                    transactionSearchPage.data.forEach(function (result) {
                        let obj = {};
                        obj.projectid = result.getValue(c[8]);
                        obj.projectname = result.getText(c[8]);
                        obj.itemid = result.id;
                        obj.itemname = result.getValue(c[0]);
                        searchResults.push(obj);
                    });
                }
                // console.log(searchResults);
                let projectField = currentRec.getField("custpage_project_name");
                projectField.removeSelectOption({value: null});
                util.each(_.uniq(_.map(searchResults, "projectid")), function (o) {
                    let ssFind = _.find(searchResults, {projectid: o});
                    projectField.insertSelectOption({
                        value: o,
                        text: ssFind.projectname,
                    });
                });
                let itemField = currentRec.getField("custpage_leasable_area");
                itemField.removeSelectOption({value: null});
                util.each(searchResults, function (o) {
                    itemField.insertSelectOption({value: o.itemid, text: o.itemname});
                });
            })
            .catch(function onRejected(reason) {
                // do something on rejection
            });
    }

    function fieldChangedCalsMan_ItemFees(scriptContext) {
        let currentRec = scriptContext.currentRecord;
        let itemFees = currentRec.getValue(scriptContext.fieldId);
        let lk = search.lookupFields({
            type: search.Type.SERVICE_ITEM,
            id: itemFees,
            columns: ["custitem_scv_item_custom_pricing"],
        });
        currentRec.setValue(
            "custpage_custompricing",
            lk.custitem_scv_item_custom_pricing
        );
    }

    function fieldChangedLenhchi(scriptContext) {
        try {
            let currentRec = scriptContext.currentRecord;
            //taxcode change
            if (scriptContext.sublistId === "item") {
                if (scriptContext.fieldId === "custcol_scv_sumtrans_line_taxcode") {
                    console.log("sublistId:" + JSON.stringify(scriptContext.sublistId));
                    console.log("fieldId:" + JSON.stringify(scriptContext.fieldId));
                    let taxcode = currentRec.getCurrentSublistValue({
                        sublistId: scriptContext.sublistId,
                        fieldId: "custcol_scv_sumtrans_line_taxcode",
                    });
                    let amount = currentRec.getCurrentSublistValue({
                        sublistId: scriptContext.sublistId,
                        fieldId: "amount",
                    });
                    let taxrate = null;
                    if (!clib.isEmpty(taxcode)) {
                        taxrate = search.lookupFields({
                            type: "salestaxitem",
                            id: taxcode,
                            columns: ["rate"],
                        }).rate;
                        taxrate = _.toNumber(_.replace(taxrate, "%", ""));

                        currentRec.setCurrentSublistValue({
                            sublistId: scriptContext.sublistId,
                            fieldId: "custcol_scv_sumtrans_line_taxrate",
                            value: taxrate,
                            ignoreFieldChange: true,
                        });
                        currentRec.setCurrentSublistValue({
                            sublistId: scriptContext.sublistId,
                            fieldId: "custcol_scv_sumtrans_line_taxamt",
                            value: clib.strip((amount * taxrate) / 100),
                            ignoreFieldChange: true,
                        });
                        currentRec.setCurrentSublistValue({
                            sublistId: scriptContext.sublistId,
                            fieldId: "custcol_scv_sumtrans_line_grossamt",
                            value: amount + clib.strip((amount * taxrate) / 100),
                            ignoreFieldChange: true,
                        });
                    }
                }
                //amount change
                if (scriptContext.fieldId === "amount") {
                    console.log("sublistId:" + JSON.stringify(scriptContext.sublistId));
                    console.log("fieldId:" + JSON.stringify(scriptContext.fieldId));
                    currentRec.selectLine({
                        sublistId: scriptContext.sublistId,
                        line: scriptContext.line,
                    });
                    let taxcode = currentRec.getCurrentSublistValue({
                        sublistId: scriptContext.sublistId,
                        fieldId: "custcol_scv_sumtrans_line_taxcode",
                    });
                    let amount = currentRec.getCurrentSublistValue({
                        sublistId: scriptContext.sublistId,
                        fieldId: "amount",
                    });
                    let taxrate = null;
                    console.log("taxcode:" + taxcode);
                    if (!clib.isEmpty(taxcode)) {
                        taxcode = search.lookupFields({
                            type: "salestaxitem",
                            id: taxcode,
                            columns: ["rate"],
                        }).rate;
                        taxrate = _.toNumber(_.replace(taxrate, "%", ""));

                        currentRec.setCurrentSublistValue({
                            sublistId: scriptContext.sublistId,
                            fieldId: "custcol_scv_sumtrans_line_taxamt",
                            value: clib.strip((amount * taxrate) / 100),
                            ignoreFieldChange: true,
                        });
                        currentRec.setCurrentSublistValue({
                            sublistId: scriptContext.sublistId,
                            fieldId: "custcol_scv_sumtrans_line_grossamt",
                            value: amount + clib.strip((amount * taxrate) / 100),
                            ignoreFieldChange: true,
                        });
                    }
                }
                if (
                    scriptContext.fieldId === "rate" ||
                    scriptContext.fieldId === "quantity"
                ) {
                    currentRec.selectLine({
                        sublistId: scriptContext.sublistId,
                        line: scriptContext.line,
                    });
                    let rate = currentRec.getCurrentSublistValue({
                        sublistId: scriptContext.sublistId,
                        fieldId: "rate",
                    });
                    let quantity = currentRec.getCurrentSublistValue({
                        sublistId: scriptContext.sublistId,
                        fieldId: "quantity",
                    });
                    let amount = clib.strip(rate * quantity);
                    if (amount > 0)
                        currentRec.setCurrentSublistValue({
                            sublistId: scriptContext.sublistId,
                            fieldId: "amount",
                            value: amount,
                        });
                }
            } //
            //sublist expense
            if (scriptContext.sublistId === "expense") {
                if (scriptContext.fieldId === "custcol_scv_sumtrans_line_taxcode") {
                    currentRec.selectLine({
                        sublistId: scriptContext.sublistId,
                        line: scriptContext.line,
                    });
                    let taxcode = currentRec.getCurrentSublistValue({
                        sublistId: scriptContext.sublistId,
                        fieldId: "custcol_scv_sumtrans_line_taxcode",
                    });
                    let amount = currentRec.getCurrentSublistValue({
                        sublistId: scriptContext.sublistId,
                        fieldId: "amount",
                    });
                    let taxrate = null;
                    console.log("taxcode:" + taxcode);
                    if (!clib.isEmpty(taxcode)) {
                        taxrate = search.lookupFields({
                            type: "salestaxitem",
                            id: taxcode,
                            columns: ["rate"],
                        }).rate;
                        taxrate = _.toNumber(_.replace(taxrate, "%", ""));

                        currentRec.setCurrentSublistValue({
                            sublistId: scriptContext.sublistId,
                            fieldId: "custcol_scv_sumtrans_line_taxrate",
                            value: taxrate,
                        });
                        currentRec.setCurrentSublistValue({
                            sublistId: scriptContext.sublistId,
                            fieldId: "custcol_scv_sumtrans_line_taxamt",
                            value: clib.strip((amount * taxrate) / 100),
                        });
                        currentRec.setCurrentSublistValue({
                            sublistId: scriptContext.sublistId,
                            fieldId: "custcol_scv_sumtrans_line_grossamt",
                            value: amount + clib.strip((amount * taxrate) / 100),
                        });
                    }
                }

                if (scriptContext.fieldId === "amount") {
                    currentRec.selectLine({
                        sublistId: scriptContext.sublistId,
                        line: scriptContext.line,
                    });
                    let taxcode = currentRec.getCurrentSublistValue({
                        sublistId: scriptContext.sublistId,
                        fieldId: "custcol_scv_sumtrans_line_taxcode",
                    });
                    let amount = currentRec.getCurrentSublistValue({
                        sublistId: scriptContext.sublistId,
                        fieldId: "amount",
                    });
                    let taxrate = null;
                    console.log("taxcode:" + taxcode);
                    if (!clib.isEmpty(taxcode)) {
                        taxrate = search.lookupFields({
                            type: "salestaxitem",
                            id: taxcode,
                            columns: ["rate"],
                        }).rate;
                        taxrate = _.toNumber(_.replace(taxrate, "%", ""));

                        currentRec.setCurrentSublistValue({
                            sublistId: scriptContext.sublistId,
                            fieldId: "custcol_scv_sumtrans_line_taxamt",
                            value: clib.strip((amount * taxrate) / 100),
                        });
                        currentRec.setCurrentSublistValue({
                            sublistId: scriptContext.sublistId,
                            fieldId: "custcol_scv_sumtrans_line_grossamt",
                            value: amount + clib.strip((amount * taxrate) / 100),
                        });
                    }
                }

                if (scriptContext.fieldId == 'custcol_scv_sumtrans_line_taxamt') {
                    currentRec.selectLine({
                        sublistId: scriptContext.sublistId,
                        line: scriptContext.line,
                    });

                    let amount = currentRec.getCurrentSublistValue({
                        sublistId: scriptContext.sublistId,
                        fieldId: 'amount'
                    });
                    let taxamt = currentRec.getCurrentSublistValue({
                        sublistId: scriptContext.sublistId,
                        fieldId: 'custcol_scv_sumtrans_line_taxamt'
                    });
                    currentRec.setCurrentSublistValue({
                        sublistId: scriptContext.sublistId,
                        fieldId: 'custcol_scv_sumtrans_line_grossamt',
                        value: amount + taxamt
                    });
                }
            }
        } catch (e) {
            console.log("fieldChangedLenhchi error:" + JSON.stringify(e));
        }
    }

    /**
     * Function to be executed when field is slaved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     *
     * @since 2015.2
     */
    function postSourcing(scriptContext) {
        try {
            if (
                scriptContext.currentRecord.getValue("baserecordtype") ==
                "customrecord_scv_emp"
            ) {
                if (scriptContext.fieldId === "custrecord_scv_emp_employee") {
                    scriptContext.currentRecord.setValue(
                        "custrecord_scv_emp_bophan",
                        department
                    );
                }
            }
            switch (scriptContext.currentRecord.type) {
                case "custompurchase_scv_ycnx":
                    postSourcingYCNX(scriptContext);
                    break;
                case record.Type.INVOICE:
                case record.Type.SALES_ORDER:
                    postSourcingInvoice(scriptContext);
                    break;
                default:
                    break;
            }
        } catch (e) {
            console.log("postSourcing error");
        }
    }

    function postSourcingInvoice(scriptContext) {
        if (scriptContext.sublistId === "item" && scriptContext.fieldId === "item") {
            let currentRec = scriptContext.currentRecord;
            let recType = currentRec.type;
            let orderType = currentRec.getValue("custbody_scv_order_type");
            let startDate = currentRec.getText("startdate");
            let endDate = currentRec.getText("enddate");
            let itemid = currentRec.getCurrentSublistValue("item", "item");
            let description = "";
            /**/
            let scv_lo_dat = currentRec.getText("custbody_scv_lo_dat").join(", ");
            let project_name = currentRec.getValue("cseg_scv_sg_proj");
            let proj_des_vi = "",
                proj_des_en = "",
                date_vi = "",
                date_en = "",
                contract_no = "";
            if (!!project_name) {
                let projectLKF = search.lookupFields({
                    type: "customrecord_cseg_scv_sg_proj",
                    id: project_name,
                    columns: ["custrecord_scv_description", "custrecord_scv_descrip_eng"],
                });
                proj_des_vi = projectLKF.custrecord_scv_description;
                proj_des_en = projectLKF.custrecord_scv_descrip_eng;
            }
            let ser_contract_id = currentRec.getValue("custbody_scv_hdbh");
            if (!!ser_contract_id) {
                let serviceContractRec = record.load({
                    type: "customrecord_scv_hdbh",
                    id: ser_contract_id,
                });
                contract_no = serviceContractRec.getValue("custrecord_scv_sc_lsano");
                let ARR_MONTH = [
                    "Jan",
                    "Feb",
                    "Mar",
                    "Apr",
                    "May",
                    "Jun",
                    "Jul",
                    "Aug",
                    "Sep",
                    "Oct",
                    "Nov",
                    "Dec",
                ];
                let wha_lsa_date = serviceContractRec.getValue(
                    "custrecord_scv_sc_lsadate"
                );
                date_vi = format.format({value: wha_lsa_date, type: "date"});
                date_en =
                    wha_lsa_date.getDate() +
                    " " +
                    ARR_MONTH[wha_lsa_date.getMonth()] +
                    " " +
                    wha_lsa_date.getFullYear();
            }

            if (orderType == ORDER_TYPE.WATER) {
                //Water
                description = "Nước máy từ ngày " + startDate + " đến ngày " + endDate;
                currentRec.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "description",
                    value: description,
                    ignoreFieldChange: true,
                });
            } else if (
                orderType == ORDER_TYPE.UTILITIES_CON_FEE &&
                (itemid == ITEM.HE_THONG_THOAT_NUOC || itemid == ITEM.DAU_CAP_NUOC_SACH || itemid == ITEM.THOAT_NUOC_THAI)
            ) {
                let system_vi = "hệ thống thoát nước mưa";
                let system_en = "stormwater drainage system";
                if (itemid == ITEM.DAU_CAP_NUOC_SACH) {
                    system_vi = "hệ thống cấp nước sạch";
                    system_en = "treated water system";
                } else if (itemid == ITEM.THOAT_NUOC_THAI) {
                    system_vi = "hệ thống thu gom nước thải";
                    system_en = "the wastewaster collection";
                }
                description =
                    "Phí đấu nối tiện ích từ Lô đất " +
                    scv_lo_dat +
                    " tới " + system_vi + " trong " +
                    proj_des_vi +
                    " (Hợp đồng thuê lại đất số " +
                    contract_no +
                    " ngày " +
                    date_vi +
                    ") / The Utilities Connection Fee from Land Lot " +
                    scv_lo_dat +
                    " to the " + system_en + " in " +
                    proj_des_en +
                    "  (Land Sublease Agreement No. " +
                    contract_no +
                    " dated " +
                    date_en +
                    ")";
                currentRec.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "description",
                    value: description,
                    ignoreFieldChange: true,
                });
            } else if (
                orderType == ORDER_TYPE.LAND &&
                recType == record.Type.INVOICE &&
                itemid == ITEM.THUE_GTGT_DAU_RA
            ) {
                description =
                    "X% Phí phát triển lô đất " +
                    scv_lo_dat +
                    " trong " +
                    proj_des_vi +
                    " của Hợp đồng thuê lại đất số " +
                    contract_no +
                    " ngày " +
                    date_vi +
                    " / " +
                    "X% of the Development Fee of land lot No. " +
                    scv_lo_dat +
                    " in " +
                    proj_des_en +
                    " of Land Sublease Agreement No. " +
                    contract_no +
                    " dated " +
                    date_en;
                currentRec.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "description",
                    value: description,
                    ignoreFieldChange: true,
                });
            }
        }
    }

    function postSourcingYCNX(scriptContext) {
        if (scriptContext.fieldId === "subsidiary") {
            let newRecord = scriptContext.currentRecord;
            let recPO = record.load({type: record.Type.PURCHASE_ORDER, id: poid});
            //get PO data
            let arrPOBody = [
                // 'entity',
                // 'subsidiary',
                // 'location',
                "memo",
                "department",
                "class",
                "cseg_scv_sg_proj",
                "tranid",
            ];
            let objPOBody = {};
            _.map(arrPOBody, function (o) {
                objPOBody[o] = recPO.getValue(o);
            });

            objPOBody.createdfrom = poid;
            objPOBody.custbody_scv_created_transaction = poid;
            objPOBody.custbody_scv_ycxvt_type = "1";
            objPOBody.location = "1";
            // objPOBody.custbody_scv_com_name = objPOBody.entity;

            util.each(_.keys(objPOBody), function (o) {
                if (!clib.isEmpty(objPOBody[o])) {
                    newRecord.setValue({fieldId: o, value: objPOBody[o]});
                }
            });

            let arrLine = [
                "item",
                "description",
                "units",
                "quantity",
                "cseg_scv_cs_budcode",
                "amount",
                "rate",
            ];
            let lineCnt = recPO.getLineCount({sublistId: "item"});
            let sublist = [];
            for (let i = 0; i < lineCnt; i++) {
                let objLine = {};
                _.map(arrLine, function (o) {
                    objLine[o] = recPO.getSublistValue({
                        sublistId: "item",
                        fieldId: o,
                        line: i,
                    });
                });
                util.extend(objLine, {
                    location: "1",
                    custcol_scv_item_status: "1",
                });
                sublist.push(objLine);
            }
            //Set YCXN sublist
            util.each(sublist, function (o, i) {
                newRecord.selectNewLine({sublistId: "item"});
                _.map(_.keys(o), function (key) {
                    newRecord.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: key,
                        value: o[key],
                        // line: i,
                        fireSlavingSync: true,
                        forceSyncSourcing: true,
                    });
                });
                newRecord.commitLine({sublistId: "item"});
            });
        }
    }

    function saveRecord(scriptContext) {
        try {
            let ret = true;
            let type = scriptContext.currentRecord.getValue("custpage_type");
            switch (type) {
                case "Calculate Land Cost":
                    ret = saveRecordCalculateLandCost(scriptContext, "c0");
                    break;
                case "Generate Land":
                case "Calc Management Fees":
                case "Debit Note":
                    ret = saveRecordCalculateLandCost(scriptContext, "checkbox");
                    break;
                default:
                    break;
            }
            switch (scriptContext.currentRecord.type) {
                case record.Type.VENDOR_BILL:
                    ret = saveRecordBill(scriptContext);
                    break;
                case "customrecord_scv_dntt":
                    ret = saveRecordPaymentRequest(scriptContext);
                    break;
                default:
                    break;
            }

            return ret;
        } catch (e) {
            console.log("saveRecord error:" + JSON.stringify(e));
        }
    }

    function saveRecordPaymentRequest(scriptContext) {
        let currentRec = scriptContext.currentRecord;
        const checkPayment = ['custrecord_scv_dntt_pr', 'custrecord_scv_dntt_po', 'custrecord_scv_other'].some(fld => currentRec.getValue(fld));
        if (!checkPayment) {
            clib.alert({title: "Saving", message: "Chưa Check Payment Request"});
            return false;
        }
        else return true;
    }

    function saveRecordBill(scriptContext) {
        let ret = true;
        let recid = clib.getParameterFromURL("id");
        let memdoc = clib.getParameterFromURL("memdoc");
        if (recid == false || memdoc == 0) {
            //create new || make copy
            let currentRec = scriptContext.currentRecord;
            let f = [
                "subsidiary",
                "entity",
                "custbody_scv_invoice_number",
                "custbody_scv_invoice_pattern",
                "custbody_scv_invoice_serial",
            ];
            let options = {};
            util.each(f, function (o) {
                options[o] = currentRec.getValue(o);
            });
            if (
                clib.isEmpty(options.custbody_scv_invoice_number) ||
                clib.isEmpty(options.custbody_scv_invoice_pattern) ||
                clib.isEmpty(options.custbody_scv_invoice_number)
            ) {
                return ret;
            }
            let results = searchInvNumBill(options);
            if (results.length > 0) {
                // ret = false;
                clib.alert({
                    title: "Saving...",
                    message:
                        "Thông tin hóa đơn đã tồn tại trên hệ thống. Kiểm tra lại thông tin hóa đơn",
                });
            } else ret = true;
        }
        return ret;
    }

    function saveRecordCalculateLandCost(scriptContext, fieldCheckbox) {
        let ret = false;
        let currentRec = scriptContext.currentRecord;
        let sublistId = "search_sublist";
        let lineCnt = currentRec.getLineCount({sublistId: sublistId});
        for (let i = 0; i < lineCnt; i++) {
            currentRec.selectLine({sublistId: sublistId, line: i});
            let mark = currentRec.getCurrentSublistValue({
                sublistId: sublistId,
                fieldId: fieldCheckbox,
            });
            if (mark == "T" || mark == true) {
                ret = true;
            }
        }
        if (ret == false) {
            clib.alert({
                title: "Saving...",
                message: "Hãy tick chọn row trước khi save.",
            });
        }
        return ret;
    }

    function getMaxEmp() {
        try {
            // Query definition
            let objQuery = query.create({type: "customrecord_scv_emp"});
            // Columns
            objQuery.columns = [
                objQuery.createColumn({
                    alias: "id",
                    fieldId: "id",
                    aggregate: query.Aggregate.MAXIMUM,
                }),
            ];
            // Paged execution
            let objPagedData = objQuery.runPaged({pageSize: 1000});
            // Paging
            let arrResults = [];
            objPagedData.pageRanges.forEach(function (pageRange) {
                let objPage = objPagedData.fetch({index: pageRange.index}).data;

                // Map results to columns
                arrResults.push.apply(arrResults, objPage.asMappedResults());
            });
            return arrResults;
        } catch (e) {
            log.error("getMaxEmpName error", JSON.stringify(e));
        }
    }

    function searchCalcLandCost() {
        window.onbeforeunload = null;
        let currRecord = currentRecord.get();
        let options = {
            search: "1",
            subsidiary: currRecord.getValue("custpage_subsidiary"),
            project: currRecord.getValue("custpage_project_name"),
            item: currRecord.getValue("custpage_leasable_area").toString(),
            fromdate: currRecord.getText("custpage_from_date"),
            todate: currRecord.getText("custpage_to_date"),
            postdate: currRecord.getText("custpage_posting_date"),
            memomain: currRecord.getValue("custpage_memo_main"),
            memodiff: currRecord.getValue("custpage_memo_diff"),
        };
        let urlDC = url.resolveScript({scriptId: "customscript_scv_sl_calc_landcost", deploymentId: "customdeploy_scv_sl_calc_landcost", returnExternalUrl: false, params: options,});
        window.location.replace(urlDC);
    }

    function searchGeneratePrincipalInterest() {
        window.onbeforeunload = null;
        let currRecord = currentRecord.get();
        let options = {
            search: "1",
            subsidiary: currRecord.getValue("custpage_subsidiary"),
            debitloan: currRecord.getValue("custpage_debitloan").toString(),
        };
        let urlDC = url.resolveScript({scriptId: "customscript_scv_sl_calc_landcost", deploymentId: "customdeploy_scv_sl_generate_prin_intere", returnExternalUrl: false, params: options,});
        window.location.replace(urlDC);
    }

    function searchForGeneratePrincInter() {
        window.onbeforeunload = null;
        let currRecord = currentRecord.get();
        let options = {
            search: "1",
            subsidiary: currRecord.getValue("custpage_subsidiary"),
            debitloan: currRecord.getValue("custpage_debitloan").toString(),
            exchangerate: currRecord.getValue("custpage_exchangerate"),
            fromdate: currRecord.getText("custpage_fromdate"),
            todate: currRecord.getText("custpage_todate"),
            postingdate: currRecord.getText("custpage_postingdate"),
        };
        let urlDC = url.resolveScript({scriptId: "customscript_scv_sl_calc_landcost", deploymentId: "customdeploy_scv_sl_generate_princ_inter", returnExternalUrl: false, params: options,});
        window.location.replace(urlDC);
    }

    function searchSONuocMay() {
        window.onbeforeunload = null;
        let currRecord = currentRecord.get();
        let options = {
            search: "1",
            subsidiary: currRecord.getValue("custpage_subsidiary"),
            customer: currRecord.getValue("custpage_customer"),
            fromdate: currRecord.getText("custpage_fromdate"),
            todate: currRecord.getText("custpage_todate"),
        };
        let urlDC = url.resolveScript({scriptId: "customscript_scv_sl_calc_landcost", deploymentId: "customdeploy_scv_sl_create_so_nuoc_thai", returnExternalUrl: false, params: options,});
        window.location.replace(urlDC);
    }

    function btSearchRevenues() {
        window.onbeforeunload = null;
        let currRecord = currentRecord.get();
        let options = {
            search: "1",
            subsidiary: currRecord.getValue("custpage_subsidiary"),
            forsubsidiary: currRecord.getValue("custpage_forsubsidiary"),
            fromdate: currRecord.getText("custpage_fromdate"),
            todate: currRecord.getText("custpage_todate"),
            currency: currRecord.getValue("custpage_currency"),
        };
        let urlDC = url.resolveScript({scriptId: "customscript_scv_sl_calc_landcost", deploymentId: "customdeploy_scv_sl_revenues_summary", returnExternalUrl: false, params: options,});
        window.location.replace(urlDC);
    }

    function searchPLFSThailand() {
        window.onbeforeunload = null;
        let currRecord = currentRecord.get();
        let options = {
            search: "1",
            subsidiary: currRecord.getValue("custpage_subsidiary").toString(),
            fromdate: currRecord.getText("custpage_fromdate"),
            todate: currRecord.getText("custpage_todate"),
            currency: currRecord.getValue("custpage_currency"),
            rate: currRecord.getValue("custpage_rate"),
        };
        let urlDC = url.resolveScript({scriptId: "customscript_scv_sl_report", deploymentId: "customdeploy_scv_sl_pl_fs_thailand", returnExternalUrl: false, params: options,});
        window.location.replace(urlDC);
    }

    function searchPLBranchThailand() {
        window.onbeforeunload = null;
        let currRecord = currentRecord.get();
        let options = {
            search: "1",
            subsidiary: currRecord.getValue("custpage_subsidiary"),
            fromdateytd1: currRecord.getText("custpage_fromdateytd1"),
            todateytd1: currRecord.getText("custpage_todateytd1"),
            fromdate: currRecord.getText("custpage_fromdate"),
            todate: currRecord.getText("custpage_todate"),
            fromdateytd2: currRecord.getText("custpage_fromdateytd2"),
            todateytd2: currRecord.getText("custpage_todateytd2"),
            currency: currRecord.getValue("custpage_currency"),
            rate: currRecord.getValue("custpage_rate"),
        };
        let urlDC = url.resolveScript({scriptId: "customscript_scv_sl_report", deploymentId: "customdeploy_scv_sl_pl_branch_thailand", returnExternalUrl: false, params: options,});
        window.location.replace(urlDC);
    }

    // function btSearchBudgetHistory() {
    //     window.onbeforeunload = null;
    //     let currRecord = currentRecord.get();
    //     let options = {
    //         search: "1",
    //         subsidiary: currRecord.getValue("custpage_subsidiary"),
    //         budgetlavel: currRecord.getValue("custpage_budgetlavel"),
    //         department: currRecord.getValue("custpage_department"),
    //         fromdate: currRecord.getText("custpage_fromdate"),
    //         todate: currRecord.getText("custpage_todate"),
    //     };
    //     let urlDC = url.resolveScript({
    //         scriptId: "customscript_scv_sl_calc_landcost",
    //         deploymentId: "customdeploy_scv_sl_budgethistory",
    //         returnExternalUrl: false,
    //         params: options,
    //     });
    //     window.location.replace(urlDC);
    // }

    function btSearchDebitNote() {
        window.onbeforeunload = null;
        let currRecord = currentRecord.get();
        let options = {
            search: "1",
            subsidiary: currRecord.getValue("custpage_subsidiary"),
            customer: currRecord.getValue("custpage_customer"),
            servicecontract: currRecord.getValue("custpage_servicecontract"),
            fromdate: currRecord.getText("custpage_fromdate"),
            todate: currRecord.getText("custpage_todate"),
            debitNoteNo: currRecord.getValue("custpage_debit_note_no"),
            debitNoteDate: currRecord.getText("custpage_debit_note_date"),
            accountBank: currRecord.getValue("custpage_account_bank"),
            dueDate: currRecord.getText("custpage_due_date"),
            interestCalcDate: currRecord.getText("custpage_interest_calc_date"),
            totalOverdueDays: currRecord.getValue("custpage_total_overdue_days"),
            terminationDate: currRecord.getText("custpage_termination_date"),
            mouNo: currRecord.getValue("custpage_mou_no"),
            mouDate: currRecord.getText("custpage_mou_date"),
            lsaNo: currRecord.getValue("custpage_lsa_no"),
            lsaDate: currRecord.getText("custpage_lsa_date"),
        };
        let urlDC = url.resolveScript({scriptId: "customscript_scv_sl_calc_landcost", deploymentId: "customdeploy_scv_sl_gop_debit_not", returnExternalUrl: false, params: options,});
        window.location.replace(urlDC);
    }

    function btSearchCashflow() {
        window.onbeforeunload = null;
        let currRecord = currentRecord.get();
        let options = {
            search: "1",
            subsidiary: currRecord.getValue("custpage_subsidiary"),
            fromdate: currRecord.getText("custpage_fromdate"),
            todate: currRecord.getText("custpage_todate"),
            currency: currRecord.getValue("custpage_currency"),
        };
        let urlDC = url.resolveScript({
            scriptId: "customscript_scv_sl_calc_landcost",
            deploymentId: "customdeploy_scv_sl_cashflow",
            returnExternalUrl: false,
            params: options,
        });
        window.location.replace(urlDC);
    }

    function btSearchBudgetHistory() {
        window.onbeforeunload = null;
        let currRecord = currentRecord.get();
        let options = {
            search: "1",
            subsidiary: currRecord.getValue("custpage_subsidiary"),
            budgetcode1: currRecord.getValue("custpage_budgetlevel").toString(),
            department: currRecord.getValue("custpage_department").toString(),
            fromdate: currRecord.getText("custpage_fromdate"),
            todate: currRecord.getText("custpage_todate"),
        };
        let urlDC = url.resolveScript({scriptId: "customscript_scv_sl_calc_landcost", deploymentId: "customdeploy_scv_sl_budgethistory", returnExternalUrl: false, params: options,});
        window.location.replace(urlDC);
    }

    function btSearchTVDT() {
        window.onbeforeunload = null;
        let currRecord = currentRecord.get();
        let options = {
            search: "1",
            subsidiary: currRecord.getValue("custpage_subsidiary"),
            subsidiarytext: currRecord.getText("custpage_subsidiary"),
            currency: currRecord.getValue("custpage_currency"),
            currencytext: currRecord.getText("custpage_currency"),
            fromdate: currRecord.getText("custpage_fromdate"),
            todate: currRecord.getText("custpage_todate"),
            fromdateytd: currRecord.getText("custpage_fromdateytd"),
            todateytd: currRecord.getText("custpage_todateytd"),
        };
        let urlDC = url.resolveScript({scriptId: "customscript_scv_sl_calc_landcost", deploymentId: "customdeploy_scv_sl_tvdt", returnExternalUrl: false, params: options,});
        window.location.replace(urlDC);
    }

    function btExportCashflow() {
        window.onbeforeunload = null;
        let currRecord = currentRecord.get();
        let options = {
            search: "1",
            subsidiary: currRecord.getValue("custpage_subsidiary"),
            subsidiarytext: currRecord.getText("custpage_subsidiary"),
            fromdate: currRecord.getText("custpage_fromdate"),
            todate: currRecord.getText("custpage_todate"),
            currency: currRecord.getValue("custpage_currency"),
            currencytext: currRecord.getText("custpage_currency"),
            printtype: "excel",
            type: "cashflow",
        };
        let urlDC = url.resolveScript({scriptId: "customscript_scv_sl_wha_print", deploymentId: "customdeploy_scv_sl_wha_print", returnExternalUrl: false, params: options,});
        window.location.replace(urlDC);
    }

    function exportTVDT() {
        window.onbeforeunload = null;
        let currRecord = currentRecord.get();
        let options = {
            search: "1",
            subsidiary: currRecord.getValue("custpage_subsidiary"),
            subsidiarytext: currRecord.getText("custpage_subsidiary"),
            currency: currRecord.getValue("custpage_currency"),
            currencytext: currRecord.getText("custpage_currency"),
            fromdate: currRecord.getText("custpage_fromdate"),
            todate: currRecord.getText("custpage_todate"),
            fromdateytd: currRecord.getText("custpage_fromdateytd"),
            todateytd: currRecord.getText("custpage_todateytd"),
            printtype: "excel",
            type: "tvdt",
        };
        let urlDC = url.resolveScript({scriptId: "customscript_scv_sl_wha_print", deploymentId: "customdeploy_scv_sl_wha_print", returnExternalUrl: false, params: options,});
        window.open(urlDC);
    }

    function exportPLFSThailand() {
        window.onbeforeunload = null;
        let currRecord = currentRecord.get();
        let options = {
            search: "1",
            subsidiary: currRecord.getValue("custpage_subsidiary").toString(),
            currency: currRecord.getValue("custpage_currency"),
            currencytext: currRecord.getText("custpage_currency"),
            fromdate: currRecord.getText("custpage_fromdate"),
            todate: currRecord.getText("custpage_todate"),
            rate: currRecord.getValue("custpage_rate"),
            printtype: "excel",
            type: "plfsthailand",
        };
        let urlDC = url.resolveScript({scriptId: "customscript_scv_sl_wha_print", deploymentId: "customdeploy_scv_sl_wha_print", returnExternalUrl: false, params: options,});
        window.open(urlDC);
    }

    function exportPLBranchThailand() {
        window.onbeforeunload = null;
        let currRecord = currentRecord.get();
        let options = {
            search: "1",
            subsidiary: currRecord.getValue("custpage_subsidiary"),
            currency: currRecord.getValue("custpage_currency"),
            currencytext: currRecord.getText("custpage_currency"),
            fromdateytd1: currRecord.getText("custpage_fromdateytd1"),
            todateytd1: currRecord.getText("custpage_todateytd1"),
            fromdate: currRecord.getText("custpage_fromdate"),
            todate: currRecord.getText("custpage_todate"),
            fromdateytd2: currRecord.getText("custpage_fromdateytd2"),
            todateytd2: currRecord.getText("custpage_todateytd2"),
            rate: currRecord.getValue("custpage_rate"),
            printtype: "excel",
            type: "plbranchthailand",
        };
        let urlDC = url.resolveScript({
            scriptId: "customscript_scv_sl_wha_print",
            deploymentId: "customdeploy_scv_sl_wha_print",
            returnExternalUrl: false,
            params: options,
        });
        window.open(urlDC);
    }

    function exportBudgetHistory() {
        window.onbeforeunload = null;
        let currRecord = currentRecord.get();
        let options = {
            search: "1",
            subsidiary: currRecord.getValue("custpage_subsidiary"),
            subsidiarytext: currRecord.getText("custpage_subsidiary"),
            budgetcode1: currRecord.getValue("custpage_budgetlevel").toString(),
            department: currRecord.getValue("custpage_department").toString(),
            fromdate: currRecord.getText("custpage_fromdate"),
            todate: currRecord.getText("custpage_todate"),
            printtype: "excel",
            type: "budgethistory",
        };
        let urlDC = url.resolveScript({scriptId: "customscript_scv_sl_wha_print", deploymentId: "customdeploy_scv_sl_wha_print", returnExternalUrl: false, params: options,});
        window.open(urlDC);
    }

    function exportRevenuesSummary() {
        window.onbeforeunload = null;
        let currRecord = currentRecord.get();
        let options = {
            search: "1",
            subsidiary: currRecord.getValue("custpage_subsidiary"),
            forsubsidiary: currRecord.getValue("custpage_forsubsidiary"),
            fromdate: currRecord.getText("custpage_fromdate"),
            todate: currRecord.getText("custpage_todate"),
            currency: currRecord.getValue("custpage_currency"),
            currencytext: currRecord.getText("custpage_currency"),
            printtype: "excel",
            type: "revenuessummary",
        };
        let urlDC = url.resolveScript({scriptId: "customscript_scv_sl_wha_print", deploymentId: "customdeploy_scv_sl_wha_print", returnExternalUrl: false, params: options,});
        window.open(urlDC);
    }

    function btSearchCalcManagementFees() {
        window.onbeforeunload = null;
        let currRecord = currentRecord.get();
        let options = {
            search: "1",
            subsidiary: currRecord.getValue("custpage_subsidiary"),
            item: currRecord.getValue("custpage_item_fees"),
            custompricing: currRecord.getValue("custpage_custompricing"),
            customer: currRecord.getValue("custpage_customer").toString(),
            fromdate: currRecord.getText("custpage_fromdate"),
            todate: currRecord.getText("custpage_todate"),
            scdate: currRecord.getText("custpage_scdate"),
            memo: currRecord.getValue("custpage_memo"),
            term: currRecord.getValue("custpage_term"),
        };
        let urlDC = url.resolveScript({
            scriptId: "customscript_scv_sl_calc_landcost",
            deploymentId: "customdeploy_scv_sl_calc_management_fees",
            returnExternalUrl: false,
            params: options,
        });
        window.location.replace(urlDC);
    }

    function btSearchGenerateLand() {
        window.onbeforeunload = null;
        let currRecord = currentRecord.get();
        let options = {
            search: "1",
            subsidiary: currRecord.getValue("custpage_subsidiary"),
            customer: currRecord.getValue("custpage_customer"),
        };
        let urlDC = url.resolveScript({
            scriptId: "customscript_scv_sl_calc_landcost",
            deploymentId: "customdeploy_scv_sl_generateland",
            returnExternalUrl: false,
            params: options,
        });
        window.location.replace(urlDC);
    }

    /**
     *
     * @param options
     * @param options.subsidiary
     * @param options.vendor
     * @param options.custbody_scv_invoice_serial
     * @param options.custbody_scv_invoice_pattern
     * @param options.custbody_scv_invoice_number
     * @return {*[]}
     */

    function searchInvNumBill(options) {
        try {
            //WHA Check invoice number of bill (don't edit)
            let objSearch = search.load({
                id: "customsearch_scv_check_innumber_of_bill",
            });
            let ss = [];
            if (!clib.isEmpty(options.subsidiary))
                objSearch.filters.push(
                    search.createFilter({
                        name: "subsidiary",
                        operator: search.Operator.ANYOF,
                        values: [options.subsidiary],
                    })
                );
            if (!clib.isEmpty(options.vendor))
                objSearch.filters.push(
                    search.createFilter({
                        name: "entity",
                        operator: search.Operator.ANYOF,
                        values: [options.vendor],
                    })
                );
            if (!clib.isEmpty(options.custbody_scv_invoice_number))
                objSearch.filters.push(
                    search.createFilter({
                        name: "custbody_scv_invoice_number",
                        operator: search.Operator.IS,
                        values: [options.custbody_scv_invoice_number],
                    })
                );
            if (!clib.isEmpty(options.custbody_scv_invoice_pattern))
                objSearch.filters.push(
                    search.createFilter({
                        name: "custbody_scv_invoice_pattern",
                        operator: search.Operator.IS,
                        values: [options.custbody_scv_invoice_pattern],
                    })
                );
            if (!clib.isEmpty(options.custbody_scv_invoice_serial))
                objSearch.filters.push(
                    search.createFilter({
                        name: "custbody_scv_invoice_serial",
                        operator: search.Operator.IS,
                        values: [options.custbody_scv_invoice_serial],
                    })
                );

            let columns = objSearch.columns;
            let transactionSearchPagedData = objSearch.runPaged({pageSize: 1000});
            for (let i = 0; i < transactionSearchPagedData.pageRanges.length; i++) {
                let transactionSearchPage = transactionSearchPagedData.fetch({
                    index: i,
                });
                transactionSearchPage.data.forEach(function (result) {
                    let obj = {};
                    util.each(columns, function (col) {
                        let name = _.replace(_.toLower(col.label), /\s+/g, "");
                        obj[name] = result.getValue(col);
                    });
                    ss.push(obj);
                });
            }
            return ss;
        } catch (e) {
            log.error("searchInvNumBill", e);
        }
    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        postSourcing: postSourcing,
        saveRecord: saveRecord,
        searchCalcLandCost: searchCalcLandCost,
        searchGeneratePrincipalInterest: searchGeneratePrincipalInterest,
        searchForGeneratePrincInter: searchForGeneratePrincInter,
        searchSONuocMay: searchSONuocMay,
        btSearchGenerateLand: btSearchGenerateLand,
        btSearchCalcManagementFees: btSearchCalcManagementFees,
        btSearchDebitNote: btSearchDebitNote,
        btExportCashflow: btExportCashflow,
        exportTVDT: exportTVDT,
        exportBudgetHistory: exportBudgetHistory,
        btSearchRevenues: btSearchRevenues,
        exportRevenuesSummary: exportRevenuesSummary,
        btSearchBudgetHistory: btSearchBudgetHistory,
        btSearchTVDT: btSearchTVDT,
        searchPLFSThailand: searchPLFSThailand,
        searchPLBranchThailand: searchPLBranchThailand,
        exportPLFSThailand: exportPLFSThailand,
        exportPLBranchThailand: exportPLBranchThailand,
        btSearchCashflow: btSearchCashflow,
    };
});
