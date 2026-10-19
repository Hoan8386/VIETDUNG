/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

define([
    "N/format",
    "N/ui/serverWidget",
    "N/search",
    "N/record",
    "N/redirect",
    "N/ui/message",
    "N/runtime",
    "N/query",
    "N/url",
    "../olib/lodash.min",
    "../olib/moment",
    "../olib/slib",
    "N/cache",
    "N/xml",
    "../olib/plib",
    "N/task",
    "../olib/clib",
], (
    format,
    ui,
    search,
    record,
    redirect,
    message,
    runtime,
    query,
    url,
    _,
    moment,
    slib,
    cache,
    xml,
    plib,
    task,
    clib
) => {
    /**
     * Defines the Suitelet script trigger point.
     * @param {Object} scriptContext
     * @param {ServerRequest} scriptContext.request - Incoming request
     * @param {ServerResponse} scriptContext.response - Suitelet response
     * @since 2015.2
     */
    const onRequest = (scriptContext) => {
        try {
            var scriptDeploy = runtime.getCurrentScript().deploymentId;
            if (scriptContext.request.method === "GET") {
                switch (scriptDeploy) {
                    case "customdeploy_scv_sl_calc_landcost":
                        doGetCalcLandCost(scriptContext);
                        break;
                    case "customdeploy_scv_sl_generate_prin_intere":
                        doGetGeneratePrincipalInterest(scriptContext);
                        break;
                    case "customdeploy_scv_sl_generate_princ_inter":
                        doGetCapitalizedInterest(scriptContext);
                        break;
                    case "customdeploy_scv_sl_create_so_nuoc_thai":
                        doGetCreateSONuocThai(scriptContext);
                        break;
                    case "customdeploy_scv_sl_generateland":
                        doGetGenerateLand(scriptContext);
                        break;
                    case "customdeploy_scv_sl_calc_management_fees":
                        doGetCalcManagementFees(scriptContext);
                        break;
                    case "customdeploy_scv_sl_gop_debit_not":
                        doGetDebitNote(scriptContext);
                        break;
                    case "customdeploy_scv_sl_revenues_summary":
                        doGetRevenuesSummary(scriptContext);
                        break;
                    case "customdeploy_scv_sl_cashflow":
                        doGetCashflow(scriptContext);
                        break;
                    case "customdeploy_scv_sl_budgethistory":
                        doGetBudgetHistory(scriptContext);
                        break;
                    case "customdeploy_scv_sl_tvdt":
                        doGetTVDT(scriptContext);
                        break;
                    case "customdeploy_scv_sl_backend":
                        doGetBackend(scriptContext);
                        break;
                    default:
                        break;
                }
            } else if (scriptContext.request.method === "POST")
                switch (scriptDeploy) {
                    case "customdeploy_scv_sl_calc_landcost":
                        doPostCalcLandCost(scriptContext);
                        break;
                    case "customdeploy_scv_sl_generate_prin_intere":
                        doPostGeneratePrincipalandInterest(scriptContext);
                        break;
                    case "customdeploy_scv_sl_generate_princ_inter":
                        doPostCapitalizedInterest(scriptContext);
                        break;
                    case "customdeploy_scv_sl_create_so_nuoc_thai":
                        doPostCreateSONuocThai(scriptContext);
                        break;
                    case "customdeploy_scv_sl_generateland":
                        doPostGenerateLand(scriptContext);
                        break;
                    case "customdeploy_scv_sl_calc_management_fees":
                        doPostCalcManagementFees(scriptContext);
                        break;
                    case "customdeploy_scv_sl_gop_debit_not":
                        doPostSumDebitNote(scriptContext);
                        break;
                    default:
                        break;
                }
        } catch (e) {
            log.error("onRequest error", JSON.stringify(e));
            slib.writeErrorPage(scriptContext.response, e, scriptContext.request.parameters);
        }
    };

    function doGetRevenuesSummary(scriptContext) {
        var options = scriptContext.request.parameters;
        var form = ui.createForm({title: "Revenues Summary"});
        form.addButton({
            id: "custpage_search",
            label: "Search",
            functionName: "btSearchRevenues",
        });
        form.addFieldGroup({id: "maingroup", label: "Main"});
        //Add form header
        var f = form.addField({
            id: "custpage_subsidiary",
            label: "Subsidiary",
            type: ui.FieldType.SELECT,
            container: "maingroup",
            source: "subsidiary",
        });
        if (!clib.isEmpty(options.subsidiary)) f.defaultValue = options.subsidiary;
        else f.defaultValue = "5"; //WHA IZ
        f.isMandatory = true;
        var f = form.addField({
            id: "custpage_forsubsidiary",
            label: "For Subsidiary",
            type: ui.FieldType.SELECT,
            container: "maingroup",
            source: "subsidiary",
        });
        if (!clib.isEmpty(options.forsubsidiary))
            f.defaultValue = options.forsubsidiary;
        else f.defaultValue = "6"; //WWHA IMS
        f.isMandatory = true;
        var f = form.addField({
            id: "custpage_fromdate",
            label: "From date",
            type: ui.FieldType.DATE,
            container: "maingroup",
        });
        if (!clib.isEmpty(options.fromdate)) f.defaultValue = options.fromdate;
        f.updateBreakType({breakType: ui.FieldBreakType.STARTCOL});
        var f = form.addField({
            id: "custpage_todate",
            label: "to date",
            type: ui.FieldType.DATE,
            container: "maingroup",
        });
        if (!clib.isEmpty(options.todate)) f.defaultValue = options.todate;
        var f = form.addField({
            id: "custpage_currency",
            label: "Currency",
            type: ui.FieldType.SELECT,
            container: "maingroup",
            source: "currency",
        });
        if (!clib.isEmpty(options.currency)) f.defaultValue = options.currency;
        var f = form.addField({
            id: "custpage_type",
            label: "Type",
            type: ui.FieldType.TEXT,
        });
        f.defaultValue = "Revenues Summary";
        f.updateDisplayType({displayType: ui.FieldDisplayType.HIDDEN});

        if (options.search === "1") {
            var ss = searchRevenues(options);
            var formSublist = buildSublist2(form, ss.length, colRevenues, false);
            formSublist.addButton({
                id: "custpage_export",
                label: "Export",
                functionName: "exportRevenuesSummary",
            });
            bindingSublistRevenues(ss, formSublist);
        }

        form.clientScriptModulePath = "../cs/scv_cs_public.js";
        if (!clib.isEmpty(options.message))
            form.addPageInitMessage({
                type: message.Type.INFORMATION,
                message: options.message,
                duration: 10000,
            });
        scriptContext.response.writePage(form);
    }

    function doGetBackend(scriptContext) {
        try {
            var parameters = scriptContext.request.parameters;
            log.audit("parameter", parameters);
            switch (parameters.action) {
                case "principalpayment":
                    doPrincipalPayment(scriptContext, "principalpayment");
                    break;
                case "postpaidinterest":
                    doPostpaidInterest(scriptContext);
                    break;
                case "prepaidinterest":
                    doPrincipalPayment(scriptContext, "prepaidinterest");
                    break;
                case "paymentschedule":
                    doPaymentSchedule(scriptContext);
                    break;
                case "createdeposit":
                    doCreateDeposit(scriptContext);
                    break;
                case "createinvoice":
                    doCreateInvoice(scriptContext);
                    break;
                case "createcustomerdeposit":
                    doCreateCustomerDeposit(scriptContext);
                    break;
                case "prbudgetcheck":
                    doPRBudgetCheck(scriptContext);
                    break;
                case "empbudgetcheck":
                    doEMPBudgetCheck(scriptContext);
                    break;
                case "billbudgetcheck":
                    doBudgetCheckBill(scriptContext);
                    break;
                case "lenhchibudgetcheck":
                    doBudgetCheckLenhchi(scriptContext);
                    break;
                case "journalbudgetcheck":
                    doBudgetCheckJournal(scriptContext);
                    break;
                default:
                    break;
            }
        } catch (e) {
            log.error("doGetBackend error", e);
        }
    }

    function doPRBudgetCheck(scriptContext) {
        var prid = scriptContext.request.parameters.recid;
        var rec = record.load({
            type: "customrecord_scv_pur_requisition",
            id: prid,
        });
        var date = rec.getValue("custrecord_scv_req_enter_date");
        date = format.format({value: date, type: format.Type.DATE});
        date = moment(date, slib.userPreferences().dateformat).format("YYYY");
        var sub = rec.getValue("custrecord_scv_req_subsidiary");

        var sublistId = "recmachcustrecord_scv_pur_req";
        var lineCnt = rec.getLineCount({sublistId: sublistId});
        var listBudgetCode = [],
            listDepartment = [];
        for (var i = 0; i < lineCnt; i++) {
            var budgetCode = rec.getSublistValue({
                sublistId: sublistId,
                fieldId: "custrecord_scv_pr_budgetcode",
                line: i,
            });
            var department = rec.getSublistValue({
                sublistId: sublistId,
                fieldId: "custrecord_scv_req_dep",
                line: i,
            });
            if (!clib.isEmpty(budgetCode)) listBudgetCode.push(budgetCode);
            if (!clib.isEmpty(department)) listDepartment.push(department);
        }
        //ss to get remaining
        var ssRemaining = plib.searchExpenseBudgetActual({
            subsidiary: sub,
            year: date,
            department: listDepartment,
            budgetcode: listBudgetCode,
        });
        //pr budget
        var prBudget = plib.searchPurchaseRequiLineBudgetCheck({
            budgetcode: listBudgetCode,
            department: listDepartment,
            subsidiary: sub,
        });
        //emp budget
        var empBudget = plib.searchEMPBudgetCheck(
            sub,
            listBudgetCode,
            listDepartment
        );
        //get actual bill
        var actualBill = plib.searchActualBill({
            subsidiary: sub,
            budgetcode: listBudgetCode,
            department: listDepartment,
        });
        //get actual exp
        var actualEmp = plib.searchActualEMP({
            subsidiary: sub,
            budgetcode: listBudgetCode,
            department: listDepartment,
        });
        //get actual check
        var actualCheck = plib.searchActualLCCheck({
            subsidiary: sub,
            budgetcode: listBudgetCode,
            department: listDepartment,
        });

        for (var i = 0; i < lineCnt; i++) {
            var budgetCode = rec.getSublistValue({
                sublistId: sublistId,
                fieldId: "custrecord_scv_pr_budgetcode",
                line: i,
            });
            var department = rec.getSublistValue({
                sublistId: sublistId,
                fieldId: "custrecord_scv_req_dep",
                line: i,
            });
            var project = rec.getSublistValue({
                sublistId: sublistId,
                fieldId: "cseg_scv_sg_proj",
                line: i,
            });
            //remaining
            var listFilter = _.filter(ssRemaining, {
                budgetcode: budgetCode,
                department: department,
            });
            if (!clib.isEmpty(project)) {
                listFilter = _.filter(listFilter, {projectnames: project});
            }
            var remaining = _.sumBy(listFilter, function (o) {
                return _.toNumber(o.remainingbudget);
            });
            //pr amt
            var listFilter = _.filter(prBudget, {
                budgetcode: budgetCode,
                department: department,
            });
            if (!clib.isEmpty(project)) {
                listFilter = _.filter(listFilter, {projectnames: project});
            }
            var prAmt = _.sumBy(listFilter, function (o) {
                return _.toNumber(o.amount);
            });
            //emp amt
            var listFilter = _.filter(empBudget, {
                budgetcode: budgetCode,
                department: department,
            });
            if (!clib.isEmpty(project)) {
                listFilter = _.filter(listFilter, {projectnames: project});
            }
            var empAmt = _.sumBy(listFilter, function (o) {
                return _.toNumber(o.amounttocheck);
            });

            //sum actual bill
            var actualBillFilter = _.filter(actualBill, {
                department: department,
                budgetcode: budgetCode,
            });
            var actualBillAmt = _.sumBy(actualBillFilter, function (o) {
                return _.toNumber(o.amount);
            });
            //sum actual emp
            var actualEmpFilter = _.filter(actualEmp, {
                department: department,
                budgetcode: budgetCode,
            });
            var actualEmpAmt = _.sumBy(actualEmpFilter, function (o) {
                return _.toNumber(o.amount);
            });
            //sum actual check
            var actualCheckFilter = _.filter(actualCheck, {
                department: department,
                budgetcode: budgetCode,
            });
            var actualCheckAmt = _.sumBy(actualCheckFilter, function (o) {
                return _.toNumber(o.amount);
            });
            var amountSummary =
                remaining -
                prAmt -
                empAmt +
                actualBillAmt +
                actualEmpAmt +
                actualCheckAmt;
            if (amountSummary >= 0) {
                rec.setSublistValue({
                    sublistId: sublistId,
                    fieldId: "custrecord_scv_pr_budget_check_line",
                    value: "2",
                    line: i,
                });
            } else {
                rec.setSublistValue({
                    sublistId: sublistId,
                    fieldId: "custrecord_scv_pr_budget_check_line",
                    value: "3",
                    line: i,
                });
            }
        }
        //summary about line check
        var v = [];
        var messageInfo = "";
        for (var i = 0; i < lineCnt; i++) {
            var budgetLineCheck = rec.getSublistValue({
                sublistId: sublistId,
                fieldId: "custrecord_scv_pr_budget_check_line",
                line: i,
            });
            v.push(budgetLineCheck);
        }
        //check if all value on arr are equal
        var check = _.every(v, (val, i, arr) => val === arr[0]);
        if (check && _.head(v) == "2") {
            rec.setValue({
                fieldId: "custrecord_scv_pr_budget_check_result",
                value: "2",
            });
            messageInfo = "Budget Check Passed";
        } else if (check && _.head(v) == "3") {
            rec.setValue({
                fieldId: "custrecord_scv_pr_budget_check_result",
                value: "3",
            });
            messageInfo = "Over Budget";
        } else if (check && _.head(v) == "1") {
            rec.setValue({
                fieldId: "custrecord_scv_pr_budget_check_result",
                value: "1",
            });
            messageInfo = "Budget check not performed";
        } else {
            rec.setValue({
                fieldId: "custrecord_scv_pr_budget_check_result",
                value: "4",
            });
            messageInfo = "Budget check partially passed";
        }
        rec.save({enableSourcing: false, ignoreMandatoryFields: true});
        redirect.toRecord({
            type: "customrecord_scv_pur_requisition",
            id: prid,
            parameters: {messageinfo: messageInfo},
        });
    }

    function doEMPBudgetCheck(scriptContext) {
        var prid = scriptContext.request.parameters.recid;
        var rec = record.load({
            type: "customrecord_scv_emp",
            id: prid,
        });
        var date = rec.getValue("custrecord_scv_emp_date");
        date = format.format({value: date, type: format.Type.DATE});
        date = moment(date, slib.userPreferences().dateformat).format("YYYY");
        var sub = rec.getValue("custrecord_scv_emp_subsidiary");

        var sublistId = "recmachcustrecord_scv_emp_number";
        var lineCnt = rec.getLineCount({sublistId: sublistId});
        var listBudgetCode = [],
            listDepartment = [];
        for (var i = 0; i < lineCnt; i++) {
            var budgetCode = rec.getSublistValue({
                sublistId: sublistId,
                fieldId: "custrecord_scv_emp_budget",
                line: i,
            });
            var department = rec.getSublistValue({
                sublistId: sublistId,
                fieldId: "custrecord_scv_emp_department",
                line: i,
            });
            if (!clib.isEmpty(budgetCode)) listBudgetCode.push(budgetCode);
            if (!clib.isEmpty(department)) listDepartment.push(department);
        }
        //ss to get remaining
        var ssRemaining = plib.searchExpenseBudgetActual({
            subsidiary: sub,
            year: date,
            department: listDepartment,
            budgetcode: listBudgetCode,
        });
        //pr budget
        var prBudget = plib.searchPurchaseRequiLineBudgetCheck({
            budgetcode: listBudgetCode,
            department: listDepartment,
            subsidiary: sub,
        });
        //emp budget
        var empBudget = plib.searchEMPBudgetCheck(
            sub,
            listBudgetCode,
            listDepartment
        );
        //get actual bill
        var actualBill = plib.searchActualBill({
            subsidiary: sub,
            budgetcode: listBudgetCode,
            department: listDepartment,
        });
        //get actual exp
        var actualEmp = plib.searchActualEMP({
            subsidiary: sub,
            budgetcode: listBudgetCode,
            department: listDepartment,
        });
        //get actual check
        var actualCheck = plib.searchActualLCCheck({
            subsidiary: sub,
            budgetcode: listBudgetCode,
            department: listDepartment,
        });

        for (var i = 0; i < lineCnt; i++) {
            var budgetCode = rec.getSublistValue({
                sublistId: sublistId,
                fieldId: "custrecord_scv_emp_budget",
                line: i,
            });
            var department = rec.getSublistValue({
                sublistId: sublistId,
                fieldId: "custrecord_scv_emp_department",
                line: i,
            });
            var project = rec.getSublistValue({
                sublistId: sublistId,
                fieldId: "cseg_scv_sg_proj",
                line: i,
            });
            //remaining
            var listFilter = _.filter(ssRemaining, {
                budgetcode: budgetCode,
                department: department,
            });
            if (!clib.isEmpty(project)) {
                listFilter = _.filter(listFilter, {projectnames: project});
            }
            var remaining = _.sumBy(listFilter, function (o) {
                return _.toNumber(o.remainingbudget);
            });
            //pr amt
            var listFilter = _.filter(prBudget, {
                budgetcode: budgetCode,
                department: department,
            });
            if (!clib.isEmpty(project)) {
                listFilter = _.filter(listFilter, {projectnames: project});
            }
            var prAmt = _.sumBy(listFilter, function (o) {
                return _.toNumber(o.amount);
            });
            //emp amt
            var listFilter = _.filter(empBudget, {
                budgetcode: budgetCode,
                department: department,
            });
            if (!clib.isEmpty(project)) {
                listFilter = _.filter(listFilter, {projectnames: project});
            }
            var empAmt = _.sumBy(listFilter, function (o) {
                return _.toNumber(o.amounttocheck);
            });
            //sum actual bill
            var actualBillFilter = _.filter(actualBill, {
                department: department,
                budgetcode: budgetCode,
            });
            var actualBillAmt = _.sumBy(actualBillFilter, function (o) {
                return _.toNumber(o.amount);
            });
            //sum actual emp
            var actualEmpFilter = _.filter(actualEmp, {
                department: department,
                budgetcode: budgetCode,
            });
            var actualEmpAmt = _.sumBy(actualEmpFilter, function (o) {
                return _.toNumber(o.amount);
            });
            //sum actual check
            var actualCheckFilter = _.filter(actualCheck, {
                department: department,
                budgetcode: budgetCode,
            });
            var actualCheckAmt = _.sumBy(actualCheckFilter, function (o) {
                return _.toNumber(o.amount);
            });

            if (
                remaining -
                prAmt -
                empAmt +
                actualBillAmt +
                actualEmpAmt +
                actualCheckAmt >=
                0
            ) {
                rec.setSublistValue({
                    sublistId: sublistId,
                    fieldId: "custrecord_scv_emp_budget_check_line",
                    value: "2",
                    line: i,
                });
            } else if (
                remaining -
                prAmt -
                empAmt +
                actualBillAmt +
                actualEmpAmt +
                actualCheckAmt <
                0
            ) {
                rec.setSublistValue({
                    sublistId: sublistId,
                    fieldId: "custrecord_scv_emp_budget_check_line",
                    value: "3",
                    line: i,
                });
            }
        }
        //summary about line check
        var v = [];
        var messageInfo = "";
        for (var i = 0; i < lineCnt; i++) {
            var budgetLineCheck = rec.getSublistValue({
                sublistId: sublistId,
                fieldId: "custrecord_scv_emp_budget_check_line",
                line: i,
            });
            v.push(budgetLineCheck);
        }
        //check if all value on arr are equal
        var check = _.every(v, (val, i, arr) => val === arr[0]);
        if (check && _.head(v) == "2") {
            rec.setValue({
                fieldId: "custrecord_scv_emp_budget_check_result",
                value: "2",
            });
            messageInfo = "Budget Check Passed";
        } else if (check && _.head(v) == "3") {
            rec.setValue({
                fieldId: "custrecord_scv_emp_budget_check_result",
                value: "3",
            });
            messageInfo = "Over Budget";
        } else if (check && _.head(v) == "1") {
            rec.setValue({
                fieldId: "custrecord_scv_emp_budget_check_result",
                value: "1",
            });
            messageInfo = "Budget check not performed";
        } else {
            rec.setValue({
                fieldId: "custrecord_scv_emp_budget_check_result",
                value: "4",
            });
            messageInfo = "Budget check partially passed";
        }
        rec.save({enableSourcing: false, ignoreMandatoryFields: true});
        redirect.toRecord({
            type: "customrecord_scv_emp",
            id: prid,
            parameters: {messageinfo: messageInfo},
        });
    }

    function doBudgetCheckBill(scriptContext) {
        var recid = scriptContext.request.parameters.recid;
        var recordType = record.Type.VENDOR_BILL;
        var sublistId = "item";
        var rec = record.load({type: recordType, id: recid});
        var date = rec.getValue("trandate");
        date = format.format({value: date, type: format.Type.DATE});
        date = moment(date, slib.userPreferences().dateformat).format("YYYY");
        var sub = rec.getValue("subsidiary");
        var lineCnt = rec.getLineCount({sublistId: sublistId});
        if (lineCnt == 0) {
            sublistId = "expense";
            lineCnt = rec.getLineCount({sublistId: sublistId});
        }
        var listBudgetCode = [],
            listDepartment = [];
        for (var i = 0; i < lineCnt; i++) {
            var budgetCode = rec.getSublistValue({
                sublistId: sublistId,
                fieldId: "cseg_scv_cs_budcode",
                line: i,
            });
            var department = rec.getSublistValue({
                sublistId: sublistId,
                fieldId: "department",
                line: i,
            });
            if (!clib.isEmpty(budgetCode)) listBudgetCode.push(budgetCode);
            if (!clib.isEmpty(department)) listDepartment.push(department);
        }
        //ss to get remaining
        var ssRemaining = plib.searchExpenseBudgetActual({
            subsidiary: sub,
            year: date,
            department: listDepartment,
            budgetcode: listBudgetCode,
        });

        //pr budget
        var prBudget = plib.searchPurchaseRequiLineBudgetCheck({
            budgetcode: listBudgetCode,
            department: listDepartment,
            subsidiary: sub,
        });
        //emp budget
        var empBudget = plib.searchEMPBudgetCheck(
            sub,
            listBudgetCode,
            listDepartment
        );

        //get actual bill
        var actualBill = plib.searchActualBill({
            subsidiary: sub,
            budgetcode: listBudgetCode,
            department: listDepartment,
        });
        //get actual exp
        var actualEmp = plib.searchActualEMP({
            subsidiary: sub,
            budgetcode: listBudgetCode,
            department: listDepartment,
        });
        //get actual check
        var actualCheck = plib.searchActualLCCheck({
            subsidiary: sub,
            budgetcode: listBudgetCode,
            department: listDepartment,
        });

        for (var i = 0; i < lineCnt; i++) {
            var budgetCode = rec.getSublistValue({
                sublistId: sublistId,
                fieldId: "cseg_scv_cs_budcode",
                line: i,
            });
            var department = rec.getSublistValue({
                sublistId: sublistId,
                fieldId: "department",
                line: i,
            });
            var project = rec.getSublistValue({
                sublistId: sublistId,
                fieldId: "cseg_scv_sg_proj",
                line: i,
            });

            //remaining
            var listFilter = _.filter(ssRemaining, {
                budgetcode: budgetCode,
                department: department,
            });
            if (!clib.isEmpty(project)) {
                listFilter = _.filter(listFilter, {projectnames: project});
            }
            var remaining = _.sumBy(listFilter, function (o) {
                return _.toNumber(o.remainingbudget);
            });
            //pr amt
            var listFilter = _.filter(prBudget, {
                budgetcode: budgetCode,
                department: department,
            });
            if (!clib.isEmpty(project)) {
                listFilter = _.filter(listFilter, {projectnames: project});
            }
            var prAmt = _.sumBy(listFilter, function (o) {
                return _.toNumber(o.amount);
            });
            //emp amt
            var listFilter = _.filter(empBudget, {
                budgetcode: budgetCode,
                department: department,
            });
            if (!clib.isEmpty(project)) {
                listFilter = _.filter(listFilter, {projectnames: project});
            }
            var empAmt = _.sumBy(listFilter, function (o) {
                return _.toNumber(o.amounttocheck);
            });

            //sum actual bill
            var actualBillFilter = _.filter(actualBill, {
                department: department,
                budgetcode: budgetCode,
            });
            var actualBillAmt = _.sumBy(actualBillFilter, function (o) {
                return _.toNumber(o.amount);
            });
            //sum actual emp
            var actualEmpFilter = _.filter(actualEmp, {
                department: department,
                budgetcode: budgetCode,
            });
            var actualEmpAmt = _.sumBy(actualEmpFilter, function (o) {
                return _.toNumber(o.amount);
            });
            //sum actual check
            var actualCheckFilter = _.filter(actualCheck, {
                department: department,
                budgetcode: budgetCode,
            });
            var actualCheckAmt = _.sumBy(actualCheckFilter, function (o) {
                return _.toNumber(o.amount);
            });

            if (
                remaining -
                prAmt -
                empAmt +
                actualBillAmt +
                actualEmpAmt +
                actualCheckAmt >=
                0
            ) {
                rec.setSublistValue({
                    sublistId: sublistId,
                    fieldId: "custcol_scv_budget_check_line_result",
                    value: "2", //Budget Check Passed
                    line: i,
                });
            } else if (
                remaining -
                prAmt -
                empAmt +
                actualBillAmt +
                actualEmpAmt +
                actualCheckAmt <
                0
            ) {
                rec.setSublistValue({
                    sublistId: sublistId,
                    fieldId: "custcol_scv_budget_check_line_result",
                    value: "3", //Over Budget
                    line: i,
                });
            }
        }
        //summary about line check
        var v = [];
        var messageInfo = "";
        for (var i = 0; i < lineCnt; i++) {
            var budgetLineCheck = rec.getSublistValue({
                sublistId: sublistId,
                fieldId: "custcol_scv_budget_check_line_result",
                line: i,
            });
            v.push(budgetLineCheck);
        }
        //check if all value on arr are equal
        var check = _.every(v, (val, i, arr) => val === arr[0]);
        if (check && _.head(v) == "2") {
            rec.setValue({fieldId: "custbody_scv_budget_check_result", value: "2"});
            messageInfo = "Budget Check Passed";
        } else if (check && _.head(v) == "3") {
            rec.setValue({fieldId: "custbody_scv_budget_check_result", value: "3"});
            messageInfo = "Over Budget";
        } else if (check && (_.head(v) == "1" || clib.isEmpty(_.head(v)))) {
            rec.setValue({fieldId: "custbody_scv_budget_check_result", value: "1"});
            messageInfo = "Budget check not performed";
        } else {
            rec.setValue({fieldId: "custbody_scv_budget_check_result", value: "4"});
            messageInfo = "Budget check partially passed";
        }
        rec.save({enableSourcing: false, ignoreMandatoryFields: true});
        redirect.toRecord({
            type: recordType,
            id: recid,
            parameters: {messageinfo: messageInfo},
        });
    }

    function doBudgetCheckLenhchi(scriptContext) {
        var recid = scriptContext.request.parameters.recid;
        var recordType = "custompurchase_scv_lenhchi";
        var sublistId = "expense";
        var rec = record.load({type: recordType, id: recid});
        var date = rec.getValue("trandate");
        date = format.format({value: date, type: format.Type.DATE});
        date = moment(date, slib.userPreferences().dateformat).format("YYYY");
        var sub = rec.getValue("subsidiary");

        var lineCnt = rec.getLineCount({sublistId: sublistId});
        if (lineCnt == 0) sublistId = "item";
        var listBudgetCode = [],
            listDepartment = [];
        for (var i = 0; i < lineCnt; i++) {
            var budgetCode = rec.getSublistValue({
                sublistId: sublistId,
                fieldId: "cseg_scv_cs_budcode",
                line: i,
            });
            var department = rec.getSublistValue({
                sublistId: sublistId,
                fieldId: "department",
                line: i,
            });
            if (!clib.isEmpty(budgetCode)) listBudgetCode.push(budgetCode);
            if (!clib.isEmpty(department)) listDepartment.push(department);
        }

        //ss to get remaining
        var ssRemaining = plib.searchExpenseBudgetActual({
            subsidiary: sub,
            year: date,
            department: listDepartment,
            budgetcode: listBudgetCode,
        });
        //pr budget
        var prBudget = plib.searchPurchaseRequiLineBudgetCheck({
            budgetcode: listBudgetCode,
            department: listDepartment,
            subsidiary: sub,
        });
        //emp budget
        var empBudget = plib.searchEMPBudgetCheck(
            sub,
            listBudgetCode,
            listDepartment
        );
        //get actual bill
        var actualBill = plib.searchActualBill({
            subsidiary: sub,
            budgetcode: listBudgetCode,
            department: listDepartment,
        });
        //get actual exp
        var actualEmp = plib.searchActualEMP({
            subsidiary: sub,
            budgetcode: listBudgetCode,
            department: listDepartment,
        });
        //get actual check
        var actualCheck = plib.searchActualLCCheck({
            subsidiary: sub,
            budgetcode: listBudgetCode,
            department: listDepartment,
        });

        for (var i = 0; i < lineCnt; i++) {
            var budgetCode = rec.getSublistValue({
                sublistId: sublistId,
                fieldId: "cseg_scv_cs_budcode",
                line: i,
            });
            var department = rec.getSublistValue({
                sublistId: sublistId,
                fieldId: "department",
                line: i,
            });
            var project = rec.getSublistValue({
                sublistId: sublistId,
                fieldId: "cseg_scv_sg_proj",
                line: i,
            });
            //remaining
            var listFilter = _.filter(ssRemaining, {
                budgetcode: budgetCode,
                department: department,
            });
            if (!clib.isEmpty(project)) {
                listFilter = _.filter(listFilter, {projectnames: project});
            }
            var remaining = _.sumBy(listFilter, function (o) {
                return _.toNumber(o.remainingbudget);
            });
            //pr amt
            var listFilter = _.filter(prBudget, {
                budgetcode: budgetCode,
                department: department,
            });
            if (!clib.isEmpty(project)) {
                listFilter = _.filter(listFilter, {projectnames: project});
            }
            var prAmt = _.sumBy(listFilter, function (o) {
                return _.toNumber(o.amount);
            });
            //emp amt
            var listFilter = _.filter(empBudget, {
                budgetcode: budgetCode,
                department: department,
            });
            if (!clib.isEmpty(project)) {
                listFilter = _.filter(listFilter, {projectnames: project});
            }
            var empAmt = _.sumBy(listFilter, function (o) {
                return _.toNumber(o.amounttocheck);
            });

            //sum actual bill
            var actualBillFilter = _.filter(actualBill, {
                department: department,
                budgetcode: budgetCode,
            });
            var actualBillAmt = _.sumBy(actualBillFilter, function (o) {
                return _.toNumber(o.amount);
            });
            //sum actual emp
            var actualEmpFilter = _.filter(actualEmp, {
                department: department,
                budgetcode: budgetCode,
            });
            var actualEmpAmt = _.sumBy(actualEmpFilter, function (o) {
                return _.toNumber(o.amount);
            });
            //sum actual check
            var actualCheckFilter = _.filter(actualCheck, {
                department: department,
                budgetcode: budgetCode,
            });
            var actualCheckAmt = _.sumBy(actualCheckFilter, function (o) {
                return _.toNumber(o.amount);
            });

            if (
                remaining -
                prAmt -
                empAmt +
                actualBillAmt +
                actualEmpAmt +
                actualCheckAmt >=
                0
            ) {
                rec.setSublistValue({
                    sublistId: sublistId,
                    fieldId: "custcol_scv_budget_check_line_result",
                    value: "2", //Budget Check Passed
                    line: i,
                });
            } else if (
                remaining -
                prAmt -
                empAmt +
                actualBillAmt +
                actualEmpAmt +
                actualCheckAmt <
                0
            ) {
                rec.setSublistValue({
                    sublistId: sublistId,
                    fieldId: "custcol_scv_budget_check_line_result",
                    value: "3", //Over Budget
                    line: i,
                });
            }
        }
        //summary about line check
        var v = [];
        var messageInfo = "";
        for (var i = 0; i < lineCnt; i++) {
            var budgetLineCheck = rec.getSublistValue({
                sublistId: sublistId,
                fieldId: "custcol_scv_budget_check_line_result",
                line: i,
            });
            v.push(budgetLineCheck);
        }
        //check if all value on arr are equal
        var check = _.every(v, (val, i, arr) => val === arr[0]);
        if (check && _.head(v) == "2") {
            rec.setValue({fieldId: "custbody_scv_budget_check_result", value: "2"});
            messageInfo = "Budget Check Passed";
        } else if (check && _.head(v) == "3") {
            rec.setValue({fieldId: "custbody_scv_budget_check_result", value: "3"});
            messageInfo = "Over Budget";
        } else if (check && (_.head(v) == "1" || clib.isEmpty(_.head(v)))) {
            rec.setValue({fieldId: "custbody_scv_budget_check_result", value: "1"});
            messageInfo = "Budget check not performed";
        } else {
            rec.setValue({fieldId: "custbody_scv_budget_check_result", value: "4"});
            messageInfo = "Budget check partially passed";
        }
        rec.save({enableSourcing: false, ignoreMandatoryFields: true});
        redirect.toRecord({
            type: recordType,
            id: recid,
            parameters: {messageinfo: messageInfo},
        });
    }

    function doBudgetCheckJournal(scriptContext) {
        var recid = scriptContext.request.parameters.recid;
        var rec = record.load({type: record.Type.JOURNAL_ENTRY, id: recid});
        var date = rec.getValue("trandate");
        date = format.format({value: date, type: format.Type.DATE});
        date = moment(date, slib.userPreferences().dateformat).format("YYYY");
        var sub = rec.getValue("subsidiary");

        var sublistId = "line";
        var lineCnt = rec.getLineCount({sublistId: sublistId});
        var listBudgetCode = [],
            listDepartment = [];
        for (var i = 0; i < lineCnt; i++) {
            var budgetCode = rec.getSublistValue({
                sublistId: sublistId,
                fieldId: "cseg_scv_cs_budcode",
                line: i,
            });
            var department = rec.getSublistValue({
                sublistId: sublistId,
                fieldId: "department",
                line: i,
            });
            if (!clib.isEmpty(budgetCode)) listBudgetCode.push(budgetCode);
            if (!clib.isEmpty(department)) listDepartment.push(department);
        }
        //ss to get remaining
        var ssRemaining = plib.searchExpenseBudgetActual({
            subsidiary: sub,
            year: date,
            department: listDepartment,
            budgetcode: listBudgetCode,
        });
        //pr budget
        var prBudget = plib.searchPurchaseRequiLineBudgetCheck({
            budgetcode: listBudgetCode,
            department: listDepartment,
            subsidiary: sub,
        });
        //emp budget
        var empBudget = plib.searchEMPBudgetCheck(
            sub,
            listBudgetCode,
            listDepartment
        );
        //get actual bill
        var actualBill = plib.searchActualBill({
            subsidiary: sub,
            budgetcode: listBudgetCode,
            department: listDepartment,
        });
        //get actual exp
        var actualEmp = plib.searchActualEMP({
            subsidiary: sub,
            budgetcode: listBudgetCode,
            department: listDepartment,
        });
        //get actual check
        var actualCheck = plib.searchActualLCCheck({
            subsidiary: sub,
            budgetcode: listBudgetCode,
            department: listDepartment,
        });

        for (var i = 0; i < lineCnt; i++) {
            var budgetCode = rec.getSublistValue({
                sublistId: sublistId,
                fieldId: "cseg_scv_cs_budcode",
                line: i,
            });
            var department = rec.getSublistValue({
                sublistId: sublistId,
                fieldId: "department",
                line: i,
            });
            var project = rec.getSublistValue({
                sublistId: sublistId,
                fieldId: "cseg_scv_sg_proj",
                line: i,
            });

            //remaining
            var listFilter = _.filter(ssRemaining, {
                budgetcode: budgetCode,
                department: department,
            });
            if (!clib.isEmpty(project)) {
                listFilter = _.filter(listFilter, {projectnames: project});
            }
            var remaining = _.sumBy(listFilter, function (o) {
                return _.toNumber(o.remainingbudget);
            });
            //pr amt
            var listFilter = _.filter(prBudget, {
                budgetcode: budgetCode,
                department: department,
            });
            if (!clib.isEmpty(project)) {
                listFilter = _.filter(listFilter, {projectnames: project});
            }
            var prAmt = _.sumBy(listFilter, function (o) {
                return _.toNumber(o.amount);
            });
            //emp amt
            var listFilter = _.filter(empBudget, {
                budgetcode: budgetCode,
                department: department,
            });
            if (!clib.isEmpty(project)) {
                listFilter = _.filter(listFilter, {projectnames: project});
            }
            var empAmt = _.sumBy(listFilter, function (o) {
                return _.toNumber(o.amounttocheck);
            });

            //sum actual bill
            var actualBillFilter = _.filter(actualBill, {
                department: department,
                budgetcode: budgetCode,
            });
            var actualBillAmt = _.sumBy(actualBillFilter, function (o) {
                return _.toNumber(o.amount);
            });
            //sum actual emp
            var actualEmpFilter = _.filter(actualEmp, {
                department: department,
                budgetcode: budgetCode,
            });
            var actualEmpAmt = _.sumBy(actualEmpFilter, function (o) {
                return _.toNumber(o.amount);
            });
            //sum actual check
            var actualCheckFilter = _.filter(actualCheck, {
                department: department,
                budgetcode: budgetCode,
            });
            var actualCheckAmt = _.sumBy(actualCheckFilter, function (o) {
                return _.toNumber(o.amount);
            });

            if (
                remaining -
                prAmt -
                empAmt +
                actualBillAmt +
                actualEmpAmt +
                actualCheckAmt >=
                0
            ) {
                rec.setSublistValue({
                    sublistId: sublistId,
                    fieldId: "custcol_scv_budget_check_line_result",
                    value: "2", //Budget Check Passed
                    line: i,
                });
            } else if (
                remaining -
                prAmt -
                empAmt +
                actualBillAmt +
                actualEmpAmt +
                actualCheckAmt <
                0
            ) {
                rec.setSublistValue({
                    sublistId: sublistId,
                    fieldId: "custcol_scv_budget_check_line_result",
                    value: "3", //Over Budget
                    line: i,
                });
            }
            if (clib.isEmpty(budgetCode)) {
                rec.setSublistValue({
                    sublistId: sublistId,
                    fieldId: "custcol_scv_budget_check_line_result",
                    value: "1", //Budget check not performed
                    line: i,
                });
            }
        }
        //summary about line check
        var v = [];
        var messageInfo = "";
        for (var i = 0; i < lineCnt; i++) {
            var budgetCode = rec.getSublistValue({
                sublistId: sublistId,
                fieldId: "cseg_scv_cs_budcode",
                line: i,
            });
            var budgetLineCheck = rec.getSublistValue({
                sublistId: sublistId,
                fieldId: "custcol_scv_budget_check_line_result",
                line: i,
            });
            if (!clib.isEmpty(budgetCode)) v.push(budgetLineCheck);
        }
        //check if all value on arr are equal
        var check = _.every(v, (val, i, arr) => val === arr[0]);
        if (check && _.head(v) == "2") {
            rec.setValue({fieldId: "custbody_scv_budget_check_result", value: "2"});
            messageInfo = "Budget Check Passed";
        } else if (check && _.head(v) == "3") {
            rec.setValue({fieldId: "custbody_scv_budget_check_result", value: "3"});
            messageInfo = "Over Budget";
        } else if (check && (_.head(v) == "1" || clib.isEmpty(_.head(v)))) {
            rec.setValue({fieldId: "custbody_scv_budget_check_result", value: "1"});
            messageInfo = "Budget check not performed";
        } else {
            rec.setValue({fieldId: "custbody_scv_budget_check_result", value: "4"});
            messageInfo = "Budget check partially passed";
        }
        rec.save({enableSourcing: false, ignoreMandatoryFields: true});
        redirect.toRecord({
            type: record.Type.JOURNAL_ENTRY,
            id: recid,
            parameters: {messageinfo: messageInfo},
        });
    }

    function doCreateCustomerDeposit(scriptContext) {
        try {
            var payid = scriptContext.request.parameters.payid;
            var payField = [
                "custrecord_scv_scsub", //subsidiary
                "name",
                "custrecord_scv_scamount", //sc amount
                "custrecord_scv_sccurrency", //currency
                "custrecord_scv_customer", //customer name
                "custrecord_scv_bank",
                "custrecord_scv_sccontact",
            ];
            var payData = {};
            var payRec = record.load({
                type: "customrecord_scv_scpayschedule",
                id: payid,
            });
            util.each(payField, (o) => (payData[o] = payRec.getValue(o)));
            var sublistId = "";
            var options = {
                customer: payData.custrecord_scv_customer,
                subsidiary: payData.custrecord_scv_scsub,
                custbody_scv_apply_payment_schedule: payid,
                payment: payData.custrecord_scv_scamount,
                currency: payData.custrecord_scv_sccurrency,
                account: payData.custrecord_scv_bank,
                custbody_scv_contact: payData.custrecord_scv_sccontact,
            };
            var sublist = [];

            try {
                var recId = plib.createRecord(
                    record.Type.CUSTOMER_DEPOSIT,
                    sublistId,
                    options,
                    sublist
                );
                redirect.toRecord({
                    type: record.Type.CUSTOMER_DEPOSIT,
                    id: recId,
                    parameters: {},
                });
            } catch (e) {
                var form = ui.createForm({title: "Có lỗi phát sinh"});
                var f = form.addField({
                    id: "custpage_message",
                    label: "Message",
                    type: ui.FieldType.INLINEHTML,
                    //   source: string,
                    //   container: string
                });
                f.defaultValue = e.message;
                scriptContext.response.writePage(form);
            }
        } catch (e) {
            log.error("doCreateCustomerDeposit error", e);
        }
    }

    function doCreateDeposit(scriptContext) {
        try {
            var payid = scriptContext.request.parameters.payid;
            var payField = [
                "custrecord_scv_scsub", //subsidiary
                "name",
                "custrecord_scv_scamount", //sc amount
                "custrecord_scv_sccurrency", //currency
                "custrecord_scv_customer", //customer name
                "custrecord_scv_sccontact",
                "custrecord_scv_bank",
            ];
            var payData = {};
            var payRec = record.load({
                type: "customrecord_scv_scpayschedule",
                id: payid,
            });
            util.each(payField, (o) => (payData[o] = payRec.getValue(o)));
            var sublistId = "other";
            var options = {
                custbody_scv_apply_payment_schedule: payid,
                total: payData.custrecord_scv_scamount, //amount
                currency: payData.custrecord_scv_sccurrency,
                custbody_scv_customerdeposit: payData.custrecord_scv_customer, //payee
                account: payData.custrecord_scv_bank,
                custbody_scv_contact: payData.custrecord_scv_sccontact,
            };
            var sublist = [
                {
                    entity: payData.custrecord_scv_customer,
                    account: "1208",
                    amount: payData.custrecord_scv_scamount,
                },
            ];

            try {
                var recId = plib.createRecord(
                    record.Type.DEPOSIT,
                    sublistId,
                    options,
                    sublist
                );
                redirect.toRecord({
                    type: record.Type.DEPOSIT,
                    id: recId,
                    parameters: {},
                });
            } catch (e) {
                var form = ui.createForm({title: "Có lỗi phát sinh"});
                var f = form.addField({
                    id: "custpage_message",
                    label: "Message",
                    type: ui.FieldType.INLINEHTML,
                    //   source: string,
                    //   container: string
                });
                f.defaultValue = e.message;
                scriptContext.response.writePage(form);
            }
        } catch (e) {
            log.error("doCreateDeposit error", e);
        }
    }

    function doCreateInvoice(scriptContext) {
        try {
            var payid = scriptContext.request.parameters.payid;
            var payField = [
                "custrecord_scv_customer",
                "custrecord_scv_sccurrency",
                "custrecord_scv_sc_tax_amount",
                "custrecord_scv_nbn",
                "custrecord_scv_scdudate",
                "custrecord_scv_scmemo",
                "custrecord_scv_memo_eng",
            ];
            var payData = {};
            var payRec = record.load({type: "customrecord_scv_scpayschedule", id: payid,});
            util.each(payField, (o) => (payData[o] = payRec.getValue(o)));
            var sublistId = "item";
            var options = {
                entity: payData.custrecord_scv_customer,
                memo: `${payData.custrecord_scv_scmemo}/ ${payData.custrecord_scv_memo_eng}`,
                account: "1481",
                currency: payData.custrecord_scv_sccurrency,
                trandate: payData.custrecord_scv_nbn,
                duedate: payData.custrecord_scv_scdudate,
                custbody_scv_order_type: "5",
                custbody_scv_apply_payment_schedule: payid,
            };
            var sublist = [
                {
                    item: "999",
                    rate: "0",
                    amount: "0",
                    tax1amt: payData.custrecord_scv_sc_tax_amount,
                    location: "12",
                },
            ];

            try {
                var recId = plib.createRecord(
                    record.Type.INVOICE,
                    sublistId,
                    options,
                    sublist
                );
                redirect.toRecord({
                    type: record.Type.INVOICE,
                    id: recId,
                    parameters: {},
                });
            } catch (e) {
                var form = ui.createForm({title: "Có lỗi phát sinh"});
                var f = form.addField({
                    id: "custpage_message",
                    label: "Message",
                    type: ui.FieldType.INLINEHTML,
                    //   source: string,
                    //   container: string
                });
                f.defaultValue = e.message;
                scriptContext.response.writePage(form);
            }
        } catch (e) {
            log.error("doCreateDeposit error", e);
        }
    }

    function doPaymentSchedule(scriptContext) {
        try {
            var param = scriptContext.request.parameters;
            var rec = record.load({
                type: "customrecord_scv_scpayschedule",
                id: param.payid,
            });
            var ss = plib.searchApplyPaymentSchedule({
                custbody_scv_apply_payment_schedule: param.payid,
            });
            var sumAmount = _.sumBy(ss, "amount");
            var custrecord_scv_scamount = rec.getValue("custrecord_scv_scamount");
            rec.setValue({fieldId: "custrecord_scv_scpaid", value: sumAmount});
            rec.setValue({
                fieldId: "custrecord_scv_scremaining",
                value: custrecord_scv_scamount - sumAmount,
            });
            //Tinh lai qua han cho tung lan thanh toan
            var f = [
                "custrecord_scv_scdudate",
                "custrecord_scv_scremaining",
                "custrecord_scv_ps_overdue_interest",
                "custrecord_scv_ps_interest_schedule_date",
                "custrecord_scv_ps_penalty_rate",
            ];
            var obj = {};
            util.each(f, (o) => (obj[o] = rec.getValue(o)));
            if (!clib.isEmpty(obj.custrecord_scv_ps_interest_schedule_date)) {
                try {
                    var calcDate = format.format({
                        value: obj.custrecord_scv_ps_interest_schedule_date,
                        type: format.Type.DATE,
                    });

                    calcDate = moment(calcDate, slib.userPreferences().dateformat);
                    var dueDate = format.format({
                        value: obj.custrecord_scv_scdudate,
                        type: format.Type.DATE,
                    });
                    dueDate = moment(dueDate, slib.userPreferences().dateformat);
                    var diff = calcDate.diff(dueDate, "days");
                    var overdueInteAmount =
                        (obj.custrecord_scv_ps_overdue_interest / 36500) *
                        (diff + 1) *
                        obj.custrecord_scv_scremaining;
                    var obj2 = {
                        custrecord_scv_ps_penalty_amt: clib.strip(
                            (obj.custrecord_scv_ps_penalty_rate *
                                obj.custrecord_scv_scremaining) /
                            100
                        ),
                        custrecord_scv_ps_total_overdue_days: diff + 1,
                        custrecord_scv_ps_oversue_interest_amt: _.round(overdueInteAmount),
                    };
                    util.each(_.keys(obj2), (o) => rec.setValue(o, obj2[o]));
                } catch (e) {
                }
            }
            rec.save({enableSourcing: false, ignoreMandatoryFields: true});
            redirect.toRecord({
                type: "customrecord_scv_scpayschedule",
                id: param.payid,
                parameters: {},
            });
        } catch (e) {
            log.error("doPaymentSchedule error", e);
        }
    }

    function doPostpaidInterest(scriptContext) {
        try {
            var parameters = scriptContext.request.parameters;
            //Loan principal and interest Spreadsheet
            var loanPrinIntersetId = parameters.loanid;
            var fid = [
                "custrecord_scv_db_sheet", //debit/loan
                "name",
                "custrecord_scv_dbsheet_paymentdate", //payment date
                "custrecord_scv_sheet_amt",
            ];
            var rec = record.load({
                type: "customrecord_scv_prinandintersheet",
                id: loanPrinIntersetId,
            });
            var objLoanPrincipalInterest = {};
            util.each(fid, (o) => (objLoanPrincipalInterest[o] = rec.getValue(o)));

            //Debit/loan agreements
            rec = record.load({
                type: "customrecord_cseg_scv_loan",
                id: objLoanPrincipalInterest.custrecord_scv_db_sheet,
            });
            fid = [
                "custrecord_scv_loa_entity", //entity
                "custrecord_scv_db_subsidiary",
                "custrecord_scv_loa_currency",
            ];
            var objDebitLoan = {};
            util.each(fid, (o) => (objDebitLoan[o] = rec.getValue(o)));

            var options = {
                subsidiary: objDebitLoan.custrecord_scv_db_subsidiary,
                currency: objDebitLoan.custrecord_scv_loa_currency,
                trandate: objLoanPrincipalInterest.custrecord_scv_dbsheet_paymentdate,
                memo: objLoanPrincipalInterest.name,
            };
            //load Debit/Loan accounting setup
            var accountingSetupSS = getdbloanAccountingSetup(
                objLoanPrincipalInterest.custrecord_scv_db_sheet
            );
            var prepaidacc, postpaidacc;
            if (!_.isEmpty(accountingSetupSS)) {
                var accoutingSetup = _.head(accountingSetupSS);
                prepaidacc = accoutingSetup.custrecord_scv_dbacc_prepaidacc;
                postpaidacc = accoutingSetup.custrecord_scv_dbacc_postpaidacc;
            } else {
                var accoutingSetup = record.load({
                    type: "customrecord_scv_dbaccountingsetup",
                    id: "1",
                });
                prepaidacc = accoutingSetup.getValue("custrecord_scv_dbacc_prepaidacc");
                postpaidacc = accoutingSetup.getValue("custrecord_scv_dbacc_postpaidacc");
            }

            var sublist = [
                {
                    account: prepaidacc,
                    debit: objLoanPrincipalInterest.custrecord_scv_sheet_amt,
                    memo: objLoanPrincipalInterest.name,
                    cseg_scv_loan: objLoanPrincipalInterest.custrecord_scv_db_sheet,
                },
                {
                    account: postpaidacc,
                    credit: objLoanPrincipalInterest.custrecord_scv_sheet_amt,
                    memo: objLoanPrincipalInterest.name,
                    cseg_scv_loan: objLoanPrincipalInterest.custrecord_scv_db_sheet,
                },
            ];
            try {
                var id = plib.createRecord(
                    record.Type.JOURNAL_ENTRY,
                    "line",
                    options,
                    sublist
                );
                record.submitFields({
                    type: "customrecord_scv_prinandintersheet",
                    id: loanPrinIntersetId,
                    values: {custrecord_scv_sheet_status: "2"}, //posted
                });
                redirect.toRecord({type: record.Type.JOURNAL_ENTRY, id: id});
            } catch (e) {
                var form = ui.createForm({title: "Có lỗi phát sinh"});
                var f = form.addField({
                    id: "custpage_message",
                    label: "Message",
                    type: ui.FieldType.INLINEHTML,
                    //   source: string,
                    //   container: string
                });
                f.defaultValue = e.message;
                scriptContext.response.writePage(form);
            }
        } catch (e) {
            log.error("doPostpaidInterest error", e);
        }
    }

    function getdbloanAccountingSetup(debitLoan) {
        var customrecord_scv_dbaccountingsetupSearchObj = search.create({
            type: "customrecord_scv_dbaccountingsetup",
            filters: [["custrecord_scv_dbacc_debitloan", "anyof", debitLoan]],
            columns: [
                search.createColumn({
                    name: "custrecord_scv_debacc_prinacc",
                    label: "Principal account",
                }),
                search.createColumn({
                    name: "custrecord_scv_dbacc_prepaidacc",
                    label: "Prepaid loan interest account",
                }),
                search.createColumn({
                    name: "custrecord_scv_dbcc_procost",
                    label: "Project cost account",
                }),
                search.createColumn({
                    name: "custrecord_scv_dbacc_postpaidacc",
                    label: "Postpaid loan interest account",
                }),
            ],
        });
        var cols = customrecord_scv_dbaccountingsetupSearchObj.columns;
        var ret = [];
        customrecord_scv_dbaccountingsetupSearchObj.run().each(function (result) {
            // .run().each has a limit of 4,000 results
            ret.push({
                custrecord_scv_debacc_prinacc: result.getValue(cols[0]),
                custrecord_scv_dbacc_prepaidacc: result.getValue(cols[1]),
                custrecord_scv_dbcc_procost: result.getValue(cols[2]),
                custrecord_scv_dbacc_postpaidacc: result.getValue(cols[3]),
            });
            return true;
        });
        return ret;
    }

    function doPrincipalPayment(scriptContext, type) {
        try {
            var parameters = scriptContext.request.parameters;
            //Loan principal and interest Spreadsheet
            var loanPrinIntersetId = parameters.loanid;
            var fid = [
                "custrecord_scv_db_sheet", //debit/loan
                "name",
                "custrecord_scv_dbsheet_paymentdate", //payment date
                "custrecord_scv_sheet_amt",
            ];
            var rec = record.load({
                type: "customrecord_scv_prinandintersheet",
                id: loanPrinIntersetId,
            });
            var objLoanPrincipalInterest = {};
            util.each(fid, (o) => (objLoanPrincipalInterest[o] = rec.getValue(o)));
            //Debit/loan agreements
            rec = record.load({
                type: "customrecord_cseg_scv_loan",
                id: objLoanPrincipalInterest.custrecord_scv_db_sheet,
            });
            fid = [
                "custrecord_scv_loa_entity", //entity
                "custrecord_scv_db_subsidiary",
                "custrecord_scv_loa_currency",
            ];
            var objDebitLoan = {};
            util.each(fid, (o) => (objDebitLoan[o] = rec.getValue(o)));

            var options = {
                entity: objDebitLoan.custrecord_scv_loa_entity,
                subsidiary: objDebitLoan.custrecord_scv_db_subsidiary,
                cseg_scv_loan: objLoanPrincipalInterest.custrecord_scv_db_sheet,
                trandate: objLoanPrincipalInterest.custrecord_scv_dbsheet_paymentdate,
                memo: objLoanPrincipalInterest.name,
                currency: objDebitLoan.custrecord_scv_loa_currency,
            };
            var data = plib.searchDebitLoanAcountingSetup(
                objLoanPrincipalInterest.custrecord_scv_db_sheet
            );
            var account = data.custrecord_scv_debacc_prinacc;
            if (type == "prepaidinterest")
                account = data.custrecord_scv_dbacc_prepaidacc;
            var sublist = [
                {
                    account: account,
                    amount: objLoanPrincipalInterest.custrecord_scv_sheet_amt,
                    taxcode: "5",
                },
            ];
            try {
                var id = plib.createRecord(
                    record.Type.CHECK,
                    "expense",
                    options,
                    sublist
                );
                record.submitFields({
                    type: "customrecord_scv_prinandintersheet",
                    id: loanPrinIntersetId,
                    values: {custrecord_scv_sheet_status: "2"}, //posted
                });
                redirect.toRecord({type: record.Type.CHECK, id: id});
            } catch (e) {
                var form = ui.createForm({title: "Có lỗi phát sinh"});
                var f = form.addField({
                    id: "custpage_message",
                    label: "Message",
                    type: ui.FieldType.INLINEHTML,
                    //   source: string,
                    //   container: string
                });
                f.defaultValue = e.message;
                scriptContext.response.writePage(form);
            }
        } catch (e) {
            log.error("doPrincipalPayment error", e);
        }
    }

    function doGetGeneratePrincipalInterest(scriptContext) {
        try {
            //get parameter
            var parameters = scriptContext.request.parameters;
            var options = {
                subsidiary: parameters.subsidiary,
                debitloan: _.split(parameters.debitloan, ","),
                message: parameters.message,
                search: parameters.search,
            };
            var form = ui.createForm({title: "Generate Principal and Interest"});
            form.addSubmitButton("Save");
            form.addButton({
                id: "custpage_search_btn",
                label: "Search",
                functionName: "searchGeneratePrincipalInterest",
            });
            form.addFieldGroup({id: "maingroup", label: "Main"});
            //Add form header
            var fieldSub = form.addField({
                id: "custpage_subsidiary",
                label: "Subsidiary",
                type: ui.FieldType.SELECT,
                container: "maingroup",
                source: "subsidiary",
            });
            if (!clib.isEmpty(options.subsidiary))
                fieldSub.defaultValue = options.subsidiary;
            fieldSub.isMandatory = true;
            //Debit/Loan
            var debitLoanField = form.addField({
                id: "custpage_debitloan",
                label: "Debit/Loan",
                type: ui.FieldType.MULTISELECT,
                container: "maingroup",
                source: "customrecord_cseg_scv_loan",
            });
            if (!_.isEmpty(options.debitloan))
                debitLoanField.defaultValue = options.debitloan;
            var f = form.addField({
                id: "custpage_type",
                label: "Type",
                type: ui.FieldType.TEXT,
            });
            f.defaultValue = "Generate Principal and Interest";
            f.updateDisplayType({displayType: ui.FieldDisplayType.HIDDEN});
            if (options.search == "1") {
                var ss = buildGeneratePrincipalInterestSublistData(options);
                var sublist = buildGeneratePrincipalInterestSublist(form, ss.length);
                bindingGeneratePrincipalInterestSublist(ss, sublist);
            }

            form.clientScriptModulePath = "../cs/scv_cs_public.js";
            if (!clib.isEmpty(options.message))
                form.addPageInitMessage({
                    type: message.Type.INFORMATION,
                    message: options.message,
                    duration: 10000,
                });
            scriptContext.response.writePage(form);
        } catch (e) {
            log.error("doGetGeneratePrincipalInterest error", e);
        }
    }

    function doGetCapitalizedInterest(scriptContext) {
        try {
            //get parameter
            var parameters = scriptContext.request.parameters;
            var options = {
                subsidiary: parameters.subsidiary,
                debitloan: _.split(parameters.debitloan, ","),
                message: parameters.message,
                search: parameters.search,
                exchangerate: parameters.exchangerate,
                fromdate: parameters.fromdate,
                todate: parameters.todate,
                postingdate: parameters.postingdate,
            };
            var form = ui.createForm({title: "Capitalized interest"});
            form.addSubmitButton("Save");
            form.addButton({
                id: "custpage_search_btn",
                label: "Search",
                functionName: "searchForGeneratePrincInter",
            });
            form.addFieldGroup({id: "maingroup", label: "Main"});
            //Add form header
            var fieldSub = form.addField({
                id: "custpage_subsidiary",
                label: "Subsidiary",
                type: ui.FieldType.SELECT,
                container: "maingroup",
                source: "subsidiary",
            });
            if (!clib.isEmpty(options.subsidiary))
                fieldSub.defaultValue = options.subsidiary;
            fieldSub.isMandatory = true;
            //Debit/Loan
            var debitLoanField = form.addField({
                id: "custpage_debitloan",
                label: "Debit/Loan",
                type: ui.FieldType.MULTISELECT,
                container: "maingroup",
                source: "customrecord_cseg_scv_loan",
            });
            if (!_.isEmpty(options.debitloan))
                debitLoanField.defaultValue = options.debitloan;
            //Exchange rate
            var exchangeRateField = form.addField({
                id: "custpage_exchangerate",
                label: "Exchange Rate",
                type: ui.FieldType.TEXT,
                container: "maingroup",
            });
            if (!clib.isEmpty(options.exchangerate))
                exchangeRateField.defaultValue = options.exchangerate;
            //from date
            var fromDate = form.addField({
                id: "custpage_fromdate",
                label: "From Date",
                type: ui.FieldType.DATE,
                container: "maingroup",
            });
            if (!clib.isEmpty(options.fromdate))
                fromDate.defaultValue = options.fromdate;
            //to date
            var toDate = form.addField({
                id: "custpage_todate",
                label: "To Date",
                type: ui.FieldType.DATE,
                container: "maingroup",
            });
            if (!clib.isEmpty(options.todate)) toDate.defaultValue = options.todate;
            //posting date
            var postingDate = form.addField({
                id: "custpage_postingdate",
                label: "Posting Date",
                type: ui.FieldType.DATE,
                container: "maingroup",
            });
            postingDate.isMandatory = true;
            if (!clib.isEmpty(options.postingdate))
                postingDate.defaultValue = options.postingdate;

            if (options.search == "1") {
                var ss = searchDebitLoanForGenerate2(options);
                var labels = [
                    {id: "c0", label: "Name"},
                    {id: "c1", label: "Debit/Loan"},
                    {id: "c2", label: "Project Name"},
                    {id: "c3", label: "Project Amount", type: ui.FieldType.CURRENCY},
                    {id: "c4", label: "Exchange Rate", type: ui.FieldType.CURRENCY},
                    {id: "c5", label: "Principal Amount", type: ui.FieldType.CURRENCY},
                    {
                        id: "c6",
                        label: "Converted Principal Amount",
                        type: ui.FieldType.FLOAT,
                    },
                    {id: "c7", label: "Currency"},
                    {id: "c8", label: "Rate", type: ui.FieldType.PERCENT},
                    {id: "c9", label: "Interest Amount", type: ui.FieldType.FLOAT},
                    {
                        id: "c10",
                        label: "Conveted Loan Interest",
                        type: ui.FieldType.FLOAT,
                    },
                    {id: "month", label: "Months", type: ui.FieldType.FLOAT},
                    {
                        id: "c11",
                        label: "Capitalization Rate",
                        type: ui.FieldType.PERCENT,
                    },
                    {
                        id: "c12",
                        label: "Capitalized Interest Expense",
                        type: ui.FieldType.CURRENCY,
                    },
                    {
                        id: "c13",
                        label: "Capitalized Interest Project",
                        type: ui.FieldType.CURRENCY,
                    },
                    {id: "currency", displayType: ui.FieldDisplayType.HIDDEN},
                    {id: "projectid", displayType: ui.FieldDisplayType.HIDDEN},
                    {id: "debitloanid", displayType: ui.FieldDisplayType.HIDDEN},
                ];
                slib.createSublist(form, ss, labels, "", false);
                // var sublist = buildSublist(form, ss.length, colGenForPrincInter);
                // bindingGeneratePrincipalInterestSublist(ss, sublist);
            }

            form.clientScriptModulePath = "../cs/scv_cs_public.js";
            if (!clib.isEmpty(options.message))
                form.addPageInitMessage({
                    type: message.Type.INFORMATION,
                    message: options.message,
                    duration: -1,
                });
            scriptContext.response.writePage(form);
        } catch (e) {
            log.error("doGetGeneratePrincipalInterest error", e);
        }
    }

    function doGetCreateSONuocThai(scriptContext) {
        try {
            //get parameter
            var parameters = scriptContext.request.parameters;
            var options = {
                subsidiary: parameters.subsidiary,
                message: parameters.message,
                search: parameters.search,
                customer: parameters.customer,
                fromdate: parameters.fromdate,
                todate: parameters.todate,
            };
            var form = ui.createForm({title: "Create SO Nước Thải"});
            form.addSubmitButton("Create SO Nước Thải");
            form.addButton({
                id: "custpage_search_btn",
                label: "Search",
                functionName: "searchSONuocMay",
            });
            form.addFieldGroup({id: "maingroup", label: "Main"});
            //Add form header
            var fieldSub = form.addField({
                id: "custpage_subsidiary",
                label: "Subsidiary",
                type: ui.FieldType.SELECT,
                container: "maingroup",
                source: "subsidiary",
            });
            if (!clib.isEmpty(options.subsidiary))
                fieldSub.defaultValue = options.subsidiary;
            fieldSub.isMandatory = true;
            //Debit/Loan
            var f = form.addField({
                id: "custpage_customer",
                label: "Customer",
                type: ui.FieldType.SELECT,
                container: "maingroup",
                source: "customer",
            });
            if (!_.isEmpty(options.customer)) f.defaultValue = options.customer;
            //from date
            var fromDate = form.addField({
                id: "custpage_fromdate",
                label: "From Date",
                type: ui.FieldType.DATE,
                container: "maingroup",
            });
            if (!clib.isEmpty(options.fromdate))
                fromDate.defaultValue = options.fromdate;
            //to date
            var toDate = form.addField({
                id: "custpage_todate",
                label: "To Date",
                type: ui.FieldType.DATE,
                container: "maingroup",
            });
            if (!clib.isEmpty(options.todate)) toDate.defaultValue = options.todate;

            if (options.search == "1") {
                var ss = searchSONuocMay(options);
                var formSublist = buildSublist2(form, ss.length, colSONuocMay, true);
                bindingSublistNuocThai(ss, formSublist);
            }

            form.clientScriptModulePath = "../cs/scv_cs_public.js";
            if (!clib.isEmpty(options.message))
                form.addPageInitMessage({
                    type: message.Type.INFORMATION,
                    message: options.message,
                    duration: 10000,
                });
            scriptContext.response.writePage(form);
        } catch (e) {
            log.error("doGetCreateSONuocThai error", e);
        }
    }

    function doGetDebitNote(scriptContext) {
        try {
            //get parameter
            var parameters = scriptContext.request.parameters;
            var options = {
                search: parameters.search,
                message: parameters.message,
                subsidiary: parameters.subsidiary,
                customer: parameters.customer,
                servicecontract: parameters.servicecontract,
                fromdate: parameters.fromdate,
                todate: parameters.todate,
                debitNoteNo: parameters.debitNoteNo,
                debitNoteDate: parameters.debitNoteDate,
                accountBank: parameters.accountBank,
                dueDate: parameters.dueDate,
                interestCalcDate: parameters.interestCalcDate,
                totalOverdueDays: parameters.totalOverdueDays,
                terminationDate: parameters.terminationDate,
                mouNo: parameters.mouNo,
                mouDate: parameters.mouDate,
                lsaNo: parameters.lsaNo,
                lsaDate: parameters.lsaDate,
            };
            var form = ui.createForm({title: "Gộp Debit Note"});
            form.addSubmitButton("Save");
            form.addButton({
                id: "custpage_search_btn",
                label: "Search",
                functionName: "btSearchDebitNote",
            });
            form.addFieldGroup({id: "maingroup", label: "Main"});
            form.addFieldGroup({id: "infogroup", label: "Information"});
            //Add form header
            var fieldSub = form.addField({
                id: "custpage_subsidiary",
                label: "Subsidiary",
                type: ui.FieldType.SELECT,
                container: "maingroup",
                source: "subsidiary",
            });
            if (!clib.isEmpty(options.subsidiary))
                fieldSub.defaultValue = options.subsidiary;
            fieldSub.isMandatory = true;
            //Customer
            var f = form.addField({
                id: "custpage_customer",
                label: "Customer",
                type: ui.FieldType.SELECT,
                container: "maingroup",
                source: "customer",
            });
            if (!clib.isEmpty(options.customer)) f.defaultValue = options.customer;
            f.isMandatory = true;
            //Service Contract
            var f = form.addField({
                id: "custpage_servicecontract",
                label: "Service Contract",
                type: ui.FieldType.SELECT,
                container: "maingroup",
                source: "salesorder",
            });
            if (!clib.isEmpty(options.servicecontract))
                f.defaultValue = options.servicecontract;
            //from date
            var f = form.addField({
                id: "custpage_fromdate",
                label: "From Date",
                type: ui.FieldType.DATE,
                container: "maingroup",
            });
            if (!clib.isEmpty(options.fromdate)) f.defaultValue = options.fromdate;
            f.updateBreakType({breakType: ui.FieldBreakType.STARTCOL});
            //to date
            var f = form.addField({
                id: "custpage_todate",
                label: "To Date",
                type: ui.FieldType.DATE,
                container: "maingroup",
            });
            if (!clib.isEmpty(options.todate)) f.defaultValue = options.todate;
            //Information note
            var f = form.addField({
                id: "custpage_debitnoteno",
                label: "Debit Note No",
                type: ui.FieldType.TEXT,
                container: "infogroup",
            });
            if (!clib.isEmpty(options.debitNoteNo))
                f.defaultValue = options.debitNoteNo;
            var f = form.addField({
                id: "custpage_debitnotedate",
                label: "Debit Note Date",
                type: ui.FieldType.DATE,
                container: "infogroup",
            });
            if (!clib.isEmpty(options.debitNoteDate))
                f.defaultValue = options.debitNoteDate;
            var f = form.addField({
                id: "custpage_accountbank",
                label: "Account Bank",
                type: ui.FieldType.SELECT,
                container: "infogroup",
                source: "account",
            });
            if (!clib.isEmpty(options.accountBank))
                f.defaultValue = options.accountBank;
            var f = form.addField({
                id: "custpage_duedate",
                label: "Due Date",
                type: ui.FieldType.DATE,
                container: "infogroup",
            });
            if (!clib.isEmpty(options.dueDate)) f.defaultValue = options.dueDate;
            f.updateBreakType({breakType: ui.FieldBreakType.STARTCOL});
            var f = form.addField({
                id: "custpage_interestcalculationdate",
                label: "Interest Calculation Date",
                type: ui.FieldType.DATE,
                container: "infogroup",
            });
            if (!clib.isEmpty(options.interestCalcDate))
                f.defaultValue = options.interestCalcDate;
            var f = form.addField({
                id: "custpage_totaloverduedays",
                label: "Total Overdue Days",
                type: ui.FieldType.TEXT,
                container: "infogroup",
            });
            if (!clib.isEmpty(options.totalOverdueDays))
                f.defaultValue = options.totalOverdueDays;
            var f = form.addField({
                id: "custpage_terminationdate",
                label: "Termination Date",
                type: ui.FieldType.DATE,
                container: "infogroup",
            });
            if (!clib.isEmpty(options.terminationDate))
                f.defaultValue = options.terminationDate;
            var f = form.addField({
                id: "custpage_mouno",
                label: "MOU No.",
                type: ui.FieldType.TEXT,
                container: "infogroup",
            });
            if (!clib.isEmpty(options.mouNo)) f.defaultValue = options.mouNo;
            f.updateBreakType({breakType: ui.FieldBreakType.STARTCOL});
            var f = form.addField({
                id: "custpage_moudate",
                label: "MOU Date",
                type: ui.FieldType.DATE,
                container: "infogroup",
            });
            if (!clib.isEmpty(options.mouDate)) f.defaultValue = options.mouDate;
            var f = form.addField({
                id: "custpage_lsano",
                label: "LSA No.",
                type: ui.FieldType.TEXT,
                container: "infogroup",
            });
            if (!clib.isEmpty(options.lsaNo)) f.defaultValue = options.lsaNo;
            var f = form.addField({
                id: "custpage_lsadate",
                label: "LSA Date",
                type: ui.FieldType.DATE,
                container: "infogroup",
            });
            if (!clib.isEmpty(options.lsaDate)) f.defaultValue = options.lsaDate;
            var f = form.addField({
                id: "custpage_type",
                label: "Type",
                type: ui.FieldType.TEXT,
            });
            f.defaultValue = "Debit Note";
            f.updateDisplayType({displayType: ui.FieldDisplayType.HIDDEN});

            if (options.search == "1") {
                var ss = searchDebitNote(options);
                var formSublist = buildSublist2(form, ss.length, colDebitNote, true);
                bindingSublistDebitNote(ss, formSublist);
            }

            form.clientScriptModulePath = "../cs/scv_cs_public.js";
            if (!clib.isEmpty(options.message))
                form.addPageInitMessage({
                    type: message.Type.INFORMATION,
                    message: options.message,
                    duration: 10000,
                });
            scriptContext.response.writePage(form);
        } catch (e) {
            log.error("doGetDebitNote error", e);
        }
    }

    function doGetCashflow(scriptContext) {
        //get parameter
        var parameters = scriptContext.request.parameters;
        var options = {
            search: parameters.search,
            message: parameters.message,
            subsidiary: parameters.subsidiary,
            fromdate: parameters.fromdate,
            todate: parameters.todate,
            currency: parameters.currency,
        };
        var form = ui.createForm({title: "Cash flow"});
        form.addButton({
            id: "custpage_search_btn",
            label: "Search",
            functionName: "btSearchCashflow",
        });
        /*form.addButton({
            id: "custpage_export_btn",
            label: "Export",
            functionName: "btExportCashflow",
        });*/
        form.addFieldGroup({id: "maingroup", label: "Main"});
        //Add form header
        var fieldSub = form.addField({
            id: "custpage_subsidiary",
            label: "Subsidiary",
            type: ui.FieldType.SELECT,
            container: "maingroup",
            source: "subsidiary",
        });
        if (!clib.isEmpty(options.subsidiary))
            fieldSub.defaultValue = options.subsidiary;
        fieldSub.isMandatory = true;
        //Currency
        var f = form.addField({
            id: "custpage_currency",
            label: "Currency",
            type: ui.FieldType.SELECT,
            container: "maingroup",
            source: "currency",
        });
        if (!clib.isEmpty(options.currency)) f.defaultValue = options.currency;
        //fromdate
        var f = form.addField({
            id: "custpage_fromdate",
            label: "From Date",
            type: ui.FieldType.DATE,
            container: "maingroup",
        });
        if (!clib.isEmpty(options.fromdate)) f.defaultValue = options.fromdate;
        //todate
        var f = form.addField({
            id: "custpage_todate",
            label: "To Date",
            type: ui.FieldType.DATE,
            container: "maingroup",
        });
        if (!clib.isEmpty(options.todate)) f.defaultValue = options.todate;

        if (options.search == "1") {
            var ss = plib.cashFlowData(
                options.subsidiary,
                options.fromdate,
                options.todate
            );
            var formSublist = buildSublist2(form, ss.length, colCashflow, false);
            formSublist.addButton({
                id: "custpage_export",
                label: "Export",
                functionName: "btExportCashflow",
            });

            bindingSublistCashflow(ss, formSublist, options);
        }

        form.clientScriptModulePath = "../cs/scv_cs_public.js";
        if (!clib.isEmpty(options.message))
            form.addPageInitMessage({
                type: message.Type.INFORMATION,
                message: options.message,
                duration: 10000,
            });
        scriptContext.response.writePage(form);
    }

    function doGetBudgetHistory(scriptContext) {
        try {
            //get parameter
            var options = scriptContext.request.parameters;
            if (!clib.isEmpty(options.budgetcode1))
                options.budgetcode1 = _.split(options.budgetcode1, ",");
            if (!clib.isEmpty(options.department))
                options.department = _.split(options.department, ",");
            var form = ui.createForm({title: "Budget History"});
            form.addButton({
                id: "custpage_search_btn",
                label: "Search",
                functionName: "btSearchBudgetHistory",
            });
            form.addFieldGroup({id: "maingroup", label: "Main"});
            //Add form header
            var fieldSub = form.addField({
                id: "custpage_subsidiary",
                label: "Subsidiary",
                type: ui.FieldType.SELECT,
                container: "maingroup",
                source: "subsidiary",
            });
            if (!clib.isEmpty(options.subsidiary))
                fieldSub.defaultValue = options.subsidiary;
            fieldSub.isMandatory = true;
            //Budget level 1
            var f = form.addField({
                id: "custpage_budgetlevel",
                label: "Budget level",
                type: ui.FieldType.MULTISELECT,
                container: "maingroup",
            });
            if (!clib.isEmpty(options.budgetcode1))
                f.defaultValue = options.budgetcode1;
            var ssBudgetlevel1 = plib.searchBudgetlevel1({});
            util.each(ssBudgetlevel1, function (o) {
                f.addSelectOption({value: o.id, text: o.name});
            });

            //department
            var f = form.addField({
                id: "custpage_department",
                label: "Department",
                type: ui.FieldType.MULTISELECT,
                container: "maingroup",
                source: "department",
            });
            if (!clib.isEmpty(options.department))
                f.defaultValue = options.department;
            //fromdate
            var f = form.addField({
                id: "custpage_fromdate",
                label: "From Date",
                type: ui.FieldType.DATE,
                container: "maingroup",
            });
            if (!clib.isEmpty(options.fromdate)) f.defaultValue = options.fromdate;
            f.updateLayoutType({layoutType: ui.FieldLayoutType.STARTROW});
            //todate
            var f = form.addField({
                id: "custpage_todate",
                label: "To Date",
                type: ui.FieldType.DATE,
                container: "maingroup",
            });
            if (!clib.isEmpty(options.todate)) f.defaultValue = options.todate;
            f.updateLayoutType({layoutType: ui.FieldLayoutType.MIDROW});
            //type
            var f = form.addField({
                id: "custpage_type",
                label: "Type",
                type: ui.FieldType.TEXT,
            });
            f.defaultValue = "Budget History";
            f.updateDisplayType({displayType: ui.FieldDisplayType.HIDDEN});

            if (options.search == "1") {
                var ss = searchBudgetHistory(options);
                var formSublist = buildSublist2(
                    form,
                    ss.length,
                    colBudgetHistory,
                    false
                );
                formSublist.addButton({
                    id: "custpage_export",
                    label: "Export",
                    functionName: "exportBudgetHistory",
                });
                bindingSublistBudgetHistory(ss, formSublist);
            }

            form.clientScriptModulePath = "../cs/scv_cs_public.js";
            if (!clib.isEmpty(options.message))
                form.addPageInitMessage({
                    type: message.Type.INFORMATION,
                    message: options.message,
                    duration: 10000,
                });
            scriptContext.response.writePage(form);
        } catch (e) {
            log.error("doGetBudgetHistory error", e);
        }
    }

    function doGetTVDT(scriptContext) {
        //get parameter
        var options = scriptContext.request.parameters;
        var form = ui.createForm({title: "Tổng Vốn Đầu Tư"});
        form.addButton({
            id: "custpage_search_btn",
            label: "Search",
            functionName: "btSearchTVDT",
        });
        form.addFieldGroup({id: "maingroup", label: "Main"});
        //Add form header
        var fieldSub = form.addField({
            id: "custpage_subsidiary",
            label: "Subsidiary",
            type: ui.FieldType.SELECT,
            container: "maingroup",
            source: "subsidiary",
        });
        if (!clib.isEmpty(options.subsidiary))
            fieldSub.defaultValue = options.subsidiary;
        fieldSub.isMandatory = true;
        //Currency
        var f = form.addField({
            id: "custpage_currency",
            label: "Currency",
            type: ui.FieldType.SELECT,
            container: "maingroup",
            source: "currency",
        });
        if (!clib.isEmpty(options.currency)) f.defaultValue = options.currency;

        //fromdate
        var f = form.addField({
            id: "custpage_fromdate",
            label: "From Date Current",
            type: ui.FieldType.DATE,
            container: "maingroup",
        });
        if (!clib.isEmpty(options.fromdate)) f.defaultValue = options.fromdate;
        f.updateBreakType({breakType: ui.FieldBreakType.STARTCOL});
        //todate
        var f = form.addField({
            id: "custpage_todate",
            label: "To Date Current",
            type: ui.FieldType.DATE,
            container: "maingroup",
        });
        if (!clib.isEmpty(options.todate)) f.defaultValue = options.todate;
        //fromdate
        var f = form.addField({
            id: "custpage_fromdateytd",
            label: "From YTD",
            type: ui.FieldType.DATE,
            container: "maingroup",
        });
        if (!clib.isEmpty(options.fromdateytd))
            f.defaultValue = options.fromdateytd;
        f.updateBreakType({breakType: ui.FieldBreakType.STARTCOL});
        //todate
        var f = form.addField({
            id: "custpage_todateytd",
            label: "To YTD",
            type: ui.FieldType.DATE,
            container: "maingroup",
        });
        if (!clib.isEmpty(options.todateytd)) f.defaultValue = options.todateytd;
        var f = form.addField({
            id: "custpage_type",
            label: "Type",
            type: ui.FieldType.TEXT,
        });
        f.updateDisplayType({displayType: ui.FieldDisplayType.HIDDEN});
        f.defaultValue = "Tong Von Dau Tu";

        if (options.search == "1") {
            var ss = searchTVDT(options);
            log.audit("ss length", ss.length);
            var formSublist = buildSublist2(form, ss.length, colTVDT, false);
            formSublist.addButton({
                id: "custpage_export",
                label: "Export",
                functionName: "exportTVDT",
            });
            bindingSublistTVDT(ss, formSublist);
        }

        form.clientScriptModulePath = "../cs/scv_cs_public.js";
        if (!clib.isEmpty(options.message))
            form.addPageInitMessage({
                type: message.Type.INFORMATION,
                message: options.message,
                duration: 10000,
            });
        scriptContext.response.writePage(form);
    }

    function doGetCalcManagementFees(scriptContext) {
        try {
            //get parameter
            var parameters = scriptContext.request.parameters;
            var itemQuery = _.head(plib.queryItem(parameters.item));
            var options = {
                subsidiary: parameters.subsidiary,
                item: parameters.item,
                itemtext: itemQuery.fullname,
                unit: itemQuery.saleunit,
                unittext: itemQuery.saleunittext,
                price: itemQuery.price,
                custompricing: parameters.custompricing,
                customer: _.split(parameters.customer, ","),
                fromdate: parameters.fromdate,
                todate: parameters.todate,
                scdate: parameters.scdate,
                memo: parameters.memo,
                term: parameters.term,
                message: parameters.message,
                search: parameters.search,
            };
            var form = ui.createForm({title: "Calculate Management Fees"});
            form.addSubmitButton("Save");
            form.addButton({
                id: "custpage_search_btn",
                label: "Search",
                functionName: "btSearchCalcManagementFees",
            });
            form.addFieldGroup({id: "maingroup", label: "Main"});
            //Add form header
            var fieldSub = form.addField({
                id: "custpage_subsidiary",
                label: "Subsidiary",
                type: ui.FieldType.SELECT,
                container: "maingroup",
                source: "subsidiary",
            });
            if (!clib.isEmpty(options.subsidiary))
                fieldSub.defaultValue = options.subsidiary;
            fieldSub.isMandatory = true;

            var f = form.addField({
                id: "custpage_item_fees",
                label: "Item Fees",
                type: ui.FieldType.SELECT,
                container: "maingroup",
                source: "item",
            });
            if (!_.isEmpty(options.item)) f.defaultValue = options.item;
            if (options.search != "1") f.defaultValue = "2774";
            var f = form.addField({
                id: "custpage_custompricing",
                label: "Custom Pricing",
                type: ui.FieldType.TEXT,
                container: "maingroup",
            });
            if (!_.isEmpty(options.custompricing))
                f.defaultValue = options.custompricing;
            if (options.search != "1") f.defaultValue = "1513";
            var f = form.addField({
                id: "custpage_customer",
                label: "Customer",
                type: ui.FieldType.MULTISELECT,
                container: "maingroup",
            });
            var ss = plib.searchManangementFeesInfo({
                subsidiary: options.subsidiary,
            });
            var customer = _.uniq(_.map(ss, "customer"));
            var customertext = _.uniq(_.map(ss, "customertext"));
            f.addSelectOption({value: "", text: ""});
            util.each(customer, (o, i) => {
                f.addSelectOption({value: o, text: customertext[i]});
            });
            if (!_.isEmpty(options.customer)) f.defaultValue = options.customer;
            // f.isMandatory = true;
            //from date
            var fromDate = form.addField({
                id: "custpage_fromdate",
                label: "From Date",
                type: ui.FieldType.DATE,
                container: "maingroup",
            });
            if (!clib.isEmpty(options.fromdate))
                fromDate.defaultValue = options.fromdate;
            fromDate.updateLayoutType({layoutType: ui.FieldLayoutType.STARTROW});
            fromDate.isMandatory = true;
            //to date
            var toDate = form.addField({
                id: "custpage_todate",
                label: "To Date",
                type: ui.FieldType.DATE,
                container: "maingroup",
            });
            if (!clib.isEmpty(options.todate)) toDate.defaultValue = options.todate;
            toDate.updateLayoutType({layoutType: ui.FieldLayoutType.MIDROW});
            toDate.isMandatory = true;
            //sc date
            var scdate = form.addField({
                id: "custpage_scdate",
                label: "SC Date",
                type: ui.FieldType.DATE,
                container: "maingroup",
            });
            if (!clib.isEmpty(options.scdate)) scdate.defaultValue = options.scdate;
            scdate.isMandatory = true;
            //memo
            var memo = form.addField({
                id: "custpage_memo",
                label: "Memo",
                type: ui.FieldType.TEXT,
                container: "maingroup",
            });
            if (!clib.isEmpty(options.memo)) memo.defaultValue = options.memo;
            //term
            var term = form.addField({
                id: "custpage_term",
                label: "Term",
                type: ui.FieldType.SELECT,
                container: "maingroup",
                source: "term",
            });
            if (!clib.isEmpty(options.term)) term.defaultValue = options.term;
            //type
            var f = form.addField({
                id: "custpage_type",
                label: "Type",
                type: ui.FieldType.TEXT,
            });
            f.defaultValue = "Calc Management Fees";
            f.updateDisplayType({displayType: ui.FieldDisplayType.HIDDEN});

            if (options.search == "1") {
                var ss = searchCalcManagementFees(options);
                var formSublist = buildSublist2(
                    form,
                    ss.length,
                    colCalcManagementFees,
                    true
                );
                bindingSublistCalcManagementFees(ss, formSublist, options);
            }

            form.clientScriptModulePath = "../cs/scv_cs_public.js";
            if (!clib.isEmpty(options.message))
                form.addPageInitMessage({
                    type: message.Type.INFORMATION,
                    message: options.message,
                    duration: 10000,
                });
            scriptContext.response.writePage(form);
        } catch (e) {
            log.error("doGetCalcManagementFees error", e);
        }
    }

    function doGetGenerateLand(scriptContext) {
        try {
            //get parameter
            var parameters = scriptContext.request.parameters;
            var options = {
                subsidiary: parameters.subsidiary,
                message: parameters.message,
                search: parameters.search,
                customer: parameters.customer,
            };
            var form = ui.createForm({title: "Generate Land"});
            form.addSubmitButton("Save");
            form.addButton({
                id: "custpage_search_btn",
                label: "Search",
                functionName: "btSearchGenerateLand",
            });
            form.addFieldGroup({id: "maingroup", label: "Main"});
            //Add form header
            var fieldSub = form.addField({
                id: "custpage_subsidiary",
                label: "Subsidiary",
                type: ui.FieldType.SELECT,
                container: "maingroup",
                source: "subsidiary",
            });
            if (!clib.isEmpty(options.subsidiary))
                fieldSub.defaultValue = options.subsidiary;
            fieldSub.isMandatory = true;
            //Debit/Loan
            var f = form.addField({
                id: "custpage_customer",
                label: "Customer",
                type: ui.FieldType.SELECT,
                container: "maingroup",
                // source: "customer",
            });
            var ss = plib.searchGenerateLand({subsidiary: options.subsidiary});
            var customer = _.uniq(_.map(ss, "customer"));
            var customertext = _.uniq(_.map(ss, "customertext"));
            f.addSelectOption({value: "", text: ""});
            util.each(customer, (o, i) => {
                f.addSelectOption({value: o, text: customertext[i]});
            });
            if (!_.isEmpty(options.customer)) f.defaultValue = options.customer;

            var f = form.addField({
                id: "custpage_type",
                label: "Type",
                type: ui.FieldType.TEXT,
            });
            f.defaultValue = "Generate Land";
            f.updateDisplayType({displayType: ui.FieldDisplayType.HIDDEN});

            if (options.search == "1") {
                var ss = searchGenerateLand(options);
                var formSublist = buildSublist2(form, ss.length, colGenerateLand, true);
                bindingSublistGenerateLand(ss, formSublist);
            }

            form.clientScriptModulePath = "../cs/scv_cs_public.js";
            if (!clib.isEmpty(options.message))
                form.addPageInitMessage({
                    type: message.Type.INFORMATION,
                    message: options.message,
                    duration: 10000,
                });
            scriptContext.response.writePage(form);
        } catch (e) {
            log.error("doGetGenerateLand error", e);
        }
    }

    function getProjectName(ids, ssProject) {
        var results = "";
        util.each(ids, (o, i) => {
            var findObj = _.find(ssProject, {internalid: o});
            if (!_.isEmpty(findObj) && ids.length > 1) {
                results +=
                    "<p> <span><b>[" + (i + 1) + "]</b></span>" + findObj.name + "</p>";
            } else if (!_.isEmpty(findObj) && ids.length == 1) {
                results += findObj.name;
            }
        });
        return results;
    }

    function searchSONuocMay(options) {
        var results = [];
        var ss = plib.searchSONuocMay(options);

        // log.audit('ss',_.head(ss));
        return ss;
    }

    function searchDebitNote(options) {
        var results = [];
        var ss = plib.searchDebitNote(options);

        // log.audit('ss',_.head(ss));
        return ss;
    }

    function searchBudgetHistory(options) {
        var results = [];

        //Budget Remaining
        var date = moment().format("YYYY");
        if (!clib.isEmpty(options.fromdate))
            date = moment(options.fromdate, slib.userPreferences().dateformat).format(
                "YYYY"
            );
        var remaining = plib.searchExpenseBudgetActual2({
            subsidiary: options.subsidiary,
            year: date,
            department: options.department,
            fromdate: options.fromdate,
            todate: options.todate,
        });
        log.audit("remaining", remaining);
        var arrBudgetlevel1 = [],
            arrBudgetlevel2 = [],
            arrBudgetlevel3 = [],
            arrBudgetlevel4 = [];
        var ssNguon = plib.searchBudgetcodeslist(options);
        // ssNguon có dạng muitli department
        log.audit("ssNguon", ssNguon);
        //9 commitment budget
        var prBudgetCheck = plib.searchPurchaseRequiLineBudgetCheck({
            subsidiary: options.subsidiary,
            // budgetcode: allBudgetLevel,
            department: options.department,
        });
        log.audit("prBudgetCheck", prBudgetCheck);

        var empBudgetCheck = plib.searchEMPBudgetCheck(
            options.subsidiary,
            [],
            options.department
        );
        log.audit("empBudgetCheck", empBudgetCheck);

        //10 Actual commitment budget
        var actualBill = plib.searchActualBill({
            subsidiary: options.subsidiary,
            department: options.department,
            // budgetcode: allBudgetLevel
        });
        log.audit("actualBill", actualBill);

        var actualEMP = plib.searchActualEMP({
            subsidiary: options.subsidiary,
            department: options.department,
            // budgetcode: allBudgetLevel
        });
        log.audit("actualEMP", actualEMP);

        var actualCheck = plib.searchActualLCCheck({
            subsidiary: options.subsidiary,
            department: options.department,
            // budgetcode: allBudgetLevel
        });
        log.audit("actualCheck", actualCheck);

        //loop over selected multi department
        util.each(options.department, function (dep) {
            //group1
            var ss = _.filter(ssNguon, function (nguon) {
                return _.includes(_.split(nguon.department, ","), dep);
            });
            _(ss)
                .groupBy("budgetlevel1")
                .map(function (budget1, key1) {
                    var obj = {
                        dep: dep,
                        depcode: _.head(budget1).departmentcode,
                        budgetcode: key1,
                        budgetcodetext: _.head(budget1).budgetlevel1_text,
                        cumulativebudget: _(remaining)
                            .filter({budgetlevel1: key1, department: dep})
                            .sumBy(function (o) {
                                return _.toNumber(o.remainingbudget);
                            }),
                        level: "1",
                    };
                    arrBudgetlevel1.push(key1);
                    results.push(obj);
                    //group2
                    _(budget1)
                        .groupBy("budgetlevel2")
                        .map(function (budget2, key2) {
                            var obj = {
                                dep: dep,
                                depcode: _.head(budget1).departmentcode,
                                budgetcode: key2,
                                budgetcodetext: _.head(budget2).budgetlevel2_text,
                                cumulativebudget: _(remaining)
                                    .filter({
                                        budgetlevel1: key1,
                                        budgetlevel2: key2,
                                        department: dep,
                                    })
                                    .sumBy(function (o) {
                                        return _.toNumber(o.remainingbudget);
                                    }),
                                level: "2",
                            };
                            arrBudgetlevel2.push(key2);
                            results.push(obj);
                            //group3
                            _(budget2)
                                .groupBy("budgetlevel3")
                                .map(function (budget3, key3) {
                                    var obj = {
                                        dep: dep,
                                        depcode: _.head(budget1).departmentcode,
                                        budgetcode: key3,
                                        budgetcodetext: _.head(budget3).budgetlevel3_text,
                                        cumulativebudget: _(remaining)
                                            .filter({
                                                budgetlevel1: key1,
                                                budgetlevel2: key2,
                                                budgetlevel3: key3,
                                                department: dep,
                                            })
                                            .sumBy(function (o) {
                                                return _.toNumber(o.remainingbudget);
                                            }),
                                        level: "3",
                                    };
                                    arrBudgetlevel3.push(key3);
                                    results.push(obj);
                                    //group4
                                    //co the double row giong den budgetcode
                                    var remainingFilter = _.filter(remaining, {
                                        budgetlevel1: key1,
                                        budgetlevel2: key2,
                                        budgetlevel3: key3,
                                        department: dep,
                                    });
                                    _.map(remainingFilter, (o) =>
                                        _.assign(o, {
                                            keygroup: o.budgetlevel1.concat(
                                                o.budgetlevel2,
                                                o.budgetlevel3,
                                                o.budgetcode
                                            ),
                                        })
                                    );
                                    _(remainingFilter)
                                        .groupBy("keygroup")
                                        .map((keygroupvalues, key4) => {
                                            var obj = {
                                                dep: dep,
                                                depcode: _.head(budget1).departmentcode,
                                                budgetcode: _.head(keygroupvalues).budgetcode,
                                                budgetcodetext: _.head(keygroupvalues).budgetcode_text,
                                                cumulativebudget: _.sumBy(keygroupvalues, function (o) {
                                                    return _.toNumber(o.remainingbudget);
                                                }),
                                                level: "4",
                                            };
                                            results.push(obj);
                                        })
                                        .value();
                                })
                                .value();
                        })
                        .value();
                })
                .value();

            results = _.reject(results, function (o) {
                return clib.isEmpty(o.budgetcode);
            });
            // arrBudgetlevel1 = _(arrBudgetlevel1).uniq().value();
            // arrBudgetlevel2 = _(arrBudgetlevel2).uniq().value();
            // arrBudgetlevel3 = _(arrBudgetlevel3).uniq().value();
            // arrBudgetlevel4 = _(arrBudgetlevel4).uniq().value();
            // var allBudgetLevel = _(arrBudgetlevel1).concat(arrBudgetlevel2).concat(arrBudgetlevel3).value();

            _(results)
                .map(function (o) {
                    var commitmentbudget =
                        _(prBudgetCheck)
                            .filter({
                                budgetcode: o.budgetcode,
                                department: o.dep,
                            })
                            .sumBy(function (o) {
                                return _.toNumber(o.amount);
                            }) +
                        _(empBudgetCheck)
                            .filter({budgetcode: o.budgetcode, department: o.dep})
                            .sumBy(function (o) {
                                return _.toNumber(o.amounttocheck);
                            });
                    var actualcommitmentbudget =
                        _(actualBill)
                            .filter({
                                budgetcode: o.budgetcode,
                                department: o.dep,
                            })
                            .sumBy(function (o) {
                                return _.toNumber(o.amount);
                            }) +
                        _(actualEMP)
                            .filter({budgetcode: o.budgetcode, department: o.dep})
                            .sumBy(function (o) {
                                return _.toNumber(o.amount);
                            }) +
                        _(actualCheck)
                            .filter({budgetcode: o.budgetcode, department: o.dep})
                            .sumBy(function (o) {
                                return _.toNumber(o.amount);
                            });
                    //11 remaining budget to check
                    var remainingbudgettocheck =
                        o.cumulativebudget - commitmentbudget + actualcommitmentbudget;
                    _.assign(o, {
                        commitmentbudget: commitmentbudget,
                        actualcommitmentbudget: actualcommitmentbudget,
                        remainingbudgettocheck: remainingbudgettocheck,
                    });
                })
                .value();
        });
        log.audit("result", results);
        return results;
    }

    function searchTVDT(options) {
        try {
            var results = [];
            options.subsidiarytext = _(options.subsidiarytext).split(":").last();
            //currency
            var rate = 1;
            var currencyprecision = 0;
            if (!clib.isEmpty(options.currency) && options.currency != "1") {
                var recdata = slib.getRecordData(
                    record.Type.CURRENCY,
                    options.currency,
                    "",
                    ["isbasecurrency", "currencyprecision"],
                    []
                );
                if (
                    recdata.body.isbasecurrency == false ||
                    recdata.body.isbasecurrency == "F"
                ) {
                    var currencyData = plib.queryCurrency(options);
                    if (!_.isEmpty(currencyData)) {
                        rate = _.head(currencyData).rate;
                        currencyprecision = recdata.body.currencyprecision;
                    }
                }
            }
            var ssDTNN1 = plib.searchRP_DTNN({
                subsidiary: options.subsidiary,
                fromdate: options.fromdate,
                todate: options.todate,
            });
            var ssDTNN2 = plib.searchRP_DTNN({
                subsidiary: options.subsidiary,
                fromdate: options.fromdateytd,
                todate: options.todateytd,
            });
            // var ssDTNN = _.unionWith(ssDTNN1, ssDTNN2);

            var ssPLReport1 = plib.searchPL_Report({
                subsidiary: options.subsidiary,
                fromdate: options.fromdate,
                todate: options.todate,
            });
            var ssPLReport2 = plib.searchPL_Report({
                subsidiary: options.subsidiary,
                fromdate: options.fromdateytd,
                todate: options.todateytd,
            });
            // var ssPLReport = _.unionWith(ssPLReport1, ssPLReport2);

            //6
            var tongvondautuxdcb1 = 0;
            var chitieu11 = _.find(ssDTNN1, function (o) {
                return _.startsWith(o.chitieu_text, "11");
            });
            if (!_.isEmpty(chitieu11)) tongvondautuxdcb1 = chitieu11.amount / rate;
            //18
            var chitieu11_2 = _.find(ssDTNN2, function (o) {
                return _.startsWith(o.chitieu_text, "11");
            });
            var tongvondautuxdcb2 = 0;
            if (!_.isEmpty(chitieu11_2))
                tongvondautuxdcb2 = chitieu11_2.amount / rate;
            results.push({
                stt: "",
                chitieu: "<p><span><b>" + options.subsidiarytext + "</b></span></p>",
                thoigian: "",
                thuchien: "",
                sumgroup: "1",
                sumgroupthuchien: "1",
            });
            results.push({
                stt: "1",
                chitieu: "Tổng vốn đầu tư XDCB",
                thoigian: _.round(tongvondautuxdcb1, currencyprecision),
                thuchien: _.round(tongvondautuxdcb2, currencyprecision),
                group: "1",
                thuchiengroup: "1",
            });

            //7
            var tongtamungxdmb1 = 0;
            var chitieu12 = _.find(ssDTNN1, function (o) {
                return _.startsWith(o.chitieu_text, "12");
            });
            if (!_.isEmpty(chitieu12)) tongtamungxdmb1 = chitieu12.amount / rate;
            //19
            var chitieu12_2 = _.find(ssDTNN2, function (o) {
                return _.startsWith(o.chitieu_text, "12");
            });
            var tongtamunggpmb2 = 0;
            if (!_.isEmpty(chitieu12_2)) tongtamunggpmb2 = chitieu12_2.amount / rate;
            results.push({
                stt: "2",
                chitieu: "Tổng tạm ứng giải phóng mặt bằng",
                thoigian: _.round(tongtamungxdmb1, currencyprecision),
                thuchien: _.round(tongtamunggpmb2, currencyprecision),
                group: "1",
                thuchiengroup: "1",
            });

            //8
            var tongtaisancodinh1 = 0;
            var chitieu13 = _.find(ssDTNN1, function (o) {
                return _.startsWith(o.chitieu_text, "13");
            });
            if (!_.isEmpty(chitieu13)) tongtaisancodinh1 = chitieu13.amount / rate;
            //20
            var chitieu13_2 = _.find(ssDTNN2, function (o) {
                return _.startsWith(o.chitieu_text, "13");
            });
            var tongtaisancodinh2 = 0;
            if (!_.isEmpty(chitieu13_2))
                tongtaisancodinh2 = chitieu13_2.amount / rate;
            results.push({
                stt: "3",
                chitieu: "Tổng tài sản cố định",
                thoigian: _.round(tongtaisancodinh1, currencyprecision),
                thuchien: _.round(tongtaisancodinh2, currencyprecision),
                group: "1",
                thuchiengroup: "1",
            });

            //9
            var tongchiphiquanly1 = 0;
            var chitieu14 = _.find(ssDTNN1, function (o) {
                return _.startsWith(o.chitieu_text, "14");
            });
            if (!_.isEmpty(chitieu14)) tongchiphiquanly1 = chitieu14.amount / rate;
            //21
            var chitieu14_2 = _.find(ssDTNN2, function (o) {
                return _.startsWith(o.chitieu_text, "14");
            });
            var tongchiphiquanly2 = 0;
            if (!_.isEmpty(chitieu14_2))
                tongchiphiquanly2 = chitieu14_2.amount / rate;

            results.push({
                stt: "4",
                chitieu: "Tổng chi phí quản lý",
                thoigian: _.round(tongchiphiquanly1, currencyprecision),
                thuchien: _.round(tongchiphiquanly2, currencyprecision),
                group: "1",
                thuchiengroup: "1",
            });

            // Giá trị = "01.." - "02"  + "21.." + "31.."
            //11
            var tongdoanhthu1 = 0,
                tongdoanhthu2 = 0;
            var amt01 = 0,
                amt02 = 0,
                amt21 = 0,
                amt31 = 0;

            var f01 = _.find(ssPLReport1, function (o) {
                return _.startsWith(o.chitieu_text, "01");
            });
            if (!_.isEmpty(f01)) amt01 = f01.amount;
            var f02 = _.find(ssPLReport1, function (o) {
                return _.startsWith(o.chitieu_text, "02");
            });
            if (!_.isEmpty(f02)) amt02 = f02.amount;
            var f21 = _.find(ssPLReport1, function (o) {
                return _.startsWith(o.chitieu_text, "21");
            });
            if (!_.isEmpty(f21)) amt21 = f21.amount;
            var f31 = _.find(ssPLReport1, function (o) {
                return _.startsWith(o.chitieu_text, "31");
            });
            if (!_.isEmpty(f31)) amt31 = f31.amount;
            tongdoanhthu1 = amt01 - amt02 + amt21 + amt31;
            //23
            var amt01 = 0,
                amt02 = 0,
                amt21 = 0,
                amt31 = 0;
            var f01 = _.find(ssPLReport2, function (o) {
                return _.startsWith(o.chitieu_text, "01");
            });
            if (!_.isEmpty(f01)) amt01 = f01.amount;
            var f02 = _.find(ssPLReport2, function (o) {
                return _.startsWith(o.chitieu_text, "02");
            });
            if (!_.isEmpty(f02)) amt02 = f02.amount;
            var f21 = _.find(ssPLReport2, function (o) {
                return _.startsWith(o.chitieu_text, "21");
            });
            if (!_.isEmpty(f21)) amt21 = f21.amount;
            var f31 = _.find(ssPLReport2, function (o) {
                return _.startsWith(o.chitieu_text, "31");
            });
            if (!_.isEmpty(f31)) amt31 = f31.amount;
            tongdoanhthu2 = amt01 - amt02 + amt21 + amt31;

            results.push({
                stt: "",
                chitieu: "<p><span><b>" + options.subsidiarytext + "</b></span></p>",
                thoigian: "",
                thuchien: "",
                sumgroup: "2",
                sumgroupthuchien: "2",
            });
            results.push({
                stt: "1",
                chitieu: "Tổng Doanh thu",
                thoigian: _.round(tongdoanhthu1 / rate, currencyprecision),
                thuchien: _.round(tongdoanhthu2 / rate, currencyprecision),
                group: "2",
                thuchiengroup: "2",
            });

            //12 24
            var tongnhapkhau1 = 0,
                tongnhapkhau2 = 0;
            var f1 = _.find(ssDTNN1, function (o) {
                return _.startsWith(o.chitieu_text, "12");
            });
            if (!_.isEmpty(f1)) tongnhapkhau1 = f1.amount / rate;
            var f2 = _.find(ssDTNN2, function (o) {
                return _.startsWith(o.chitieu_text, "12");
            });
            if (!_.isEmpty(f2)) tongnhapkhau2 = f2.amount / rate;

            results.push({
                stt: "2",
                chitieu: "Tổng Nhập khẩu",
                thoigian: _.round(tongnhapkhau1, currencyprecision),
                thuchien: _.round(tongnhapkhau2, currencyprecision),
                group: "2",
                thuchiengroup: "2",
            });

            //13 25
            var tongnopngansach1 = 0,
                tongnopngansach2 = 0;
            var f1 = _.find(ssDTNN1, function (o) {
                return _.startsWith(o.chitieu_text, "23");
            });
            if (!_.isEmpty(f1)) tongnopngansach1 = f1.amount / rate;
            var f2 = _.find(ssDTNN2, function (o) {
                return _.startsWith(o.chitieu_text, "23");
            });
            if (!_.isEmpty(f2)) tongnopngansach2 = f2.amount / rate;

            results.push({
                stt: "3",
                chitieu: "Tổng Nộp ngân sách nhà nước",
                thoigian: _.round(tongnopngansach1, currencyprecision),
                thuchien: _.round(tongnopngansach2, currencyprecision),
                group: "2",
                thuchiengroup: "2",
            });

            //14 26
            //Giá trị = 01 - 02 - 11 + 21 - 23 - 25 - 26 + 31 - 32 - 51 - 52
            var tongloinhuan1 = 0,
                tongloinhuan2 = 0;
            var amt01 = 0,
                amt02 = 0,
                amt11 = 0,
                amt21 = 0,
                amt23 = 0,
                amt25 = 0,
                amt26 = 0,
                amt31 = 0,
                amt32 = 0,
                amt51 = 0,
                amt52 = 0;

            var f = _.find(ssPLReport1, function (o) {
                return _.startsWith(o.chitieu_text, "01");
            });
            if (!_.isEmpty(f)) amt01 = f.amount;

            var f = _.find(ssPLReport1, function (o) {
                return _.startsWith(o.chitieu_text, "02");
            });
            if (!_.isEmpty(f)) amt02 = f.amount;

            var f = _.find(ssPLReport1, function (o) {
                return _.startsWith(o.chitieu_text, "11");
            });
            if (!_.isEmpty(f)) amt11 = f.amount;
            var f = _.find(ssPLReport1, function (o) {
                return _.startsWith(o.chitieu_text, "21");
            });
            if (!_.isEmpty(f)) amt21 = f.amount;
            var f = _.find(ssPLReport1, function (o) {
                return _.startsWith(o.chitieu_text, "23");
            });
            if (!_.isEmpty(f)) amt23 = f.amount;
            var f = _.find(ssPLReport1, function (o) {
                return _.startsWith(o.chitieu_text, "25");
            });
            if (!_.isEmpty(f)) amt25 = f.amount;
            var f = _.find(ssPLReport1, function (o) {
                return _.startsWith(o.chitieu_text, "26");
            });
            if (!_.isEmpty(f)) amt26 = f.amount;
            var f = _.find(ssPLReport1, function (o) {
                return _.startsWith(o.chitieu_text, "31");
            });
            if (!_.isEmpty(f)) amt31 = f.amount;
            var f = _.find(ssPLReport1, function (o) {
                return _.startsWith(o.chitieu_text, "31");
            });
            if (!_.isEmpty(f)) amt31 = f.amount;
            var f = _.find(ssPLReport1, function (o) {
                return _.startsWith(o.chitieu_text, "32");
            });
            if (!_.isEmpty(f)) amt32 = f.amount;
            var f = _.find(ssPLReport1, function (o) {
                return _.startsWith(o.chitieu_text, "51");
            });
            if (!_.isEmpty(f)) amt51 = f.amount;
            var f = _.find(ssPLReport1, function (o) {
                return _.startsWith(o.chitieu_text, "52");
            });
            if (!_.isEmpty(f)) amt52 = f.amount;
            tongloinhuan1 =
                amt01 -
                amt02 -
                amt11 +
                amt21 -
                amt23 -
                amt25 -
                amt26 +
                amt31 -
                amt32 -
                amt51 -
                amt52;

            var f = _.find(ssPLReport2, function (o) {
                return _.startsWith(o.chitieu_text, "01");
            });
            if (!_.isEmpty(f)) amt01 = f.amount;

            var f = _.find(ssPLReport2, function (o) {
                return _.startsWith(o.chitieu_text, "02");
            });
            if (!_.isEmpty(f)) amt02 = f.amount;

            var f = _.find(ssPLReport2, function (o) {
                return _.startsWith(o.chitieu_text, "11");
            });
            if (!_.isEmpty(f)) amt11 = f.amount;
            var f = _.find(ssPLReport2, function (o) {
                return _.startsWith(o.chitieu_text, "21");
            });
            if (!_.isEmpty(f)) amt21 = f.amount;
            var f = _.find(ssPLReport2, function (o) {
                return _.startsWith(o.chitieu_text, "23");
            });
            if (!_.isEmpty(f)) amt23 = f.amount;
            var f = _.find(ssPLReport2, function (o) {
                return _.startsWith(o.chitieu_text, "25");
            });
            if (!_.isEmpty(f)) amt25 = f.amount;
            var f = _.find(ssPLReport2, function (o) {
                return _.startsWith(o.chitieu_text, "26");
            });
            if (!_.isEmpty(f)) amt26 = f.amount;
            var f = _.find(ssPLReport2, function (o) {
                return _.startsWith(o.chitieu_text, "31");
            });
            if (!_.isEmpty(f)) amt31 = f.amount;
            var f = _.find(ssPLReport2, function (o) {
                return _.startsWith(o.chitieu_text, "31");
            });
            if (!_.isEmpty(f)) amt31 = f.amount;
            var f = _.find(ssPLReport2, function (o) {
                return _.startsWith(o.chitieu_text, "32");
            });
            if (!_.isEmpty(f)) amt32 = f.amount;
            var f = _.find(ssPLReport2, function (o) {
                return _.startsWith(o.chitieu_text, "51");
            });
            if (!_.isEmpty(f)) amt51 = f.amount;
            var f = _.find(ssPLReport2, function (o) {
                return _.startsWith(o.chitieu_text, "52");
            });
            if (!_.isEmpty(f)) amt52 = f.amount;
            tongloinhuan2 =
                amt01 -
                amt02 -
                amt11 +
                amt21 -
                amt23 -
                amt25 -
                amt26 +
                amt31 -
                amt32 -
                amt51 -
                amt52;

            results.push({
                stt: "4",
                chitieu: "Tổng Lợi nhuận",
                thoigian: _.round(tongloinhuan1 / rate, currencyprecision),
                thuchien: _.round(tongloinhuan2 / rate, currencyprecision),
                group: "2",
                thuchiengroup: "2",
            });

            //summary
            var sum1 = _(results)
                .filter(function (o) {
                    return o.group == "1";
                })
                .sumBy(function (o) {
                    return _.toNumber(o.thoigian);
                });
            _(results).find(function (o) {
                return o.sumgroup == "1";
            }).thoigian = sum1;

            var sum2 = _(results)
                .filter(function (o) {
                    return o.group == "2";
                })
                .sumBy(function (o) {
                    return _.toNumber(o.thoigian);
                });
            _(results).find(function (o) {
                return o.sumgroup == "2";
            }).thoigian = sum2;

            var sum3 = _(results)
                .filter(function (o) {
                    return o.thuchiengroup == "1";
                })
                .sumBy(function (o) {
                    return _.toNumber(o.thuchien);
                });
            _(results).find(function (o) {
                return o.sumgroupthuchien == "1";
            }).thuchien = sum3;

            var sum4 = _(results)
                .filter(function (o) {
                    return o.thuchiengroup == "2";
                })
                .sumBy(function (o) {
                    return _.toNumber(o.thuchien);
                });
            _(results).find(function (o) {
                return o.sumgroupthuchien == "2";
            }).thuchien = sum4;

            results.push({
                stt: "",
                chitieu: "<p><span><b>Tổng vốn đầu tư thực hiện</b></span></p>",
                thoigian: sum1 + sum2,
                thuchien: sum3 + sum4,
            });

            return results;
        } catch (e) {
            log.error("searchTVDT error", e);
        }
    }

    function searchRevenues(options) {
        var results = [];
        //currency
        var rate = 1;
        var currencyprecision = 0;
        if (!clib.isEmpty(options.currency) && options.currency != "1") {
            var recdata = slib.getRecordData(
                record.Type.CURRENCY,
                options.currency,
                "",
                ["isbasecurrency", "currencyprecision"],
                []
            );
            if (
                recdata.body.isbasecurrency == false ||
                recdata.body.isbasecurrency == "F"
            ) {
                var currencyData = plib.queryCurrency(options);
                if (!_.isEmpty(currencyData)) {
                    rate = _.head(currencyData).rate;
                    currencyprecision = recdata.body.currencyprecision;
                }
            }
        }
        log.audit("rate", rate);
        //I. Doanh thu phi ha tang
        //header row
        results.push({
            tencongty:
                "<p><span><b>I, Doanh thu phí phát triển/ <i>Development Revenue</i></b></span></p>",
            landlottxt: "",
            areaha: "",
            profit: "",
            headerrow: "1",
            type: "1",
        });
        //detail row
        var ssDTHTbefore = plib.searchRSDoanhThuHaTang(options);
        //group customer contract and summary profit
        _.map(ssDTHTbefore, function (o) {
            _.assign(o, {
                key:
                    o.legalname +
                    "_" +
                    o.legalnameeng +
                    "_" +
                    o.servicecontractinternalid,
            });
        });
        ssDTHTbefore = _(ssDTHTbefore)
            .groupBy("key")
            .map(function (objs, key) {
                var parseKey = _.split(key, "_");
                return {
                    legalname: parseKey[0],
                    legalnameeng: parseKey[1],
                    servicecontractinternalid: parseKey[2],
                    profit: _.sumBy(objs, function (o) {
                        return _.toNumber(o.profit);
                    }),
                };
            })
            .value();
        //convert amount to currency
        var ssDTHT = [];
        util.each(ssDTHTbefore, function (o) {
            var obj = _.mapValues(o, function (value, key) {
                switch (key) {
                    case "profit":
                        return _.round(value / rate, currencyprecision);
                        break;
                    default:
                        return value;
                        break;
                }
            });
            ssDTHT.push(obj);
        });

        var ssRSLandSC = plib.searchRSLandSC(options);
        _.map(ssDTHT, function (o) {
            _.assign(
                o,
                _.find(ssRSLandSC, {
                    servicecontractinternalid: o.servicecontractinternalid,
                })
            );
            o.headerrow = "0";
            o.type = "1";
        });

        util.each(ssDTHT, function (o) {
            var obj = _.mapKeys(o, function (value, key) {
                switch (key) {
                    case "name":
                        return "landlottxt";
                        break;
                    default:
                        return key;
                        break;
                }
            });
            obj.tencongty = obj.legalname + "</br><i>" + obj.legalnameeng + "</i>";
            results.push(obj);
        });

        var filterlist = _.filter(results, {type: "1"});
        var sumProfit = _.sumBy(filterlist, function (o) {
            return _.toNumber(o.profit);
        });
        sumProfit = _.round(sumProfit, 2);
        //Sum row
        results.push({
            tencongty: "<p><span><b>Cộng/ <i>Total</i></b></span></p>",
            landlottxt: "",
            areaha: "",
            profit: sumProfit,
            headerrow: "0",
            type: "",
        });

        //II. Doanh thu phi quan ly
        results.push({
            tencongty:
                "<p><span><b>II, Doanh thu phí quản lý/ <i>Management Revenue</i></b></span></p>",
            landlottxt: "",
            areaha: "",
            profit: "",
            headerrow: "1",
            type: "",
        });
        var ssDTQLbefore = plib.searchRSDoanhThuQuanLy(options);
        //group customer contract and summary profit
        _.map(ssDTQLbefore, function (o) {
            _.assign(o, {
                key:
                    o.legalname +
                    "_" +
                    o.legalnameeng +
                    "_" +
                    o.servicecontractinternalid,
            });
        });
        ssDTQLbefore = _(ssDTQLbefore)
            .groupBy("key")
            .map(function (objs, key) {
                var parseKey = _.split(key, "_");
                return {
                    legalname: parseKey[0],
                    legalnameeng: parseKey[1],
                    servicecontractinternalid: parseKey[2],
                    profit: _.sumBy(objs, function (o) {
                        return _.toNumber(o.profit);
                    }),
                };
            })
            .value();
        var ssDTQL = [];
        //convert amount to currency
        util.each(ssDTQLbefore, function (o) {
            var obj = _.mapValues(o, function (value, key) {
                switch (key) {
                    case "profit":
                        return _.round(value / rate, currencyprecision);
                        break;
                    default:
                        return value;
                        break;
                }
            });
            ssDTQL.push(obj);
        });

        var ssRSLandSC = plib.searchRSLandSC(options);
        _.map(ssDTQL, function (o) {
            _.assign(
                o,
                _.find(ssRSLandSC, {
                    servicecontractinternalid: o.servicecontractinternalid,
                })
            );
            o.headerrow = "0";
            o.type = "2";
        });

        util.each(ssDTQL, function (o) {
            var obj = _.mapKeys(o, function (value, key) {
                switch (key) {
                    case "name":
                        return "landlottxt";
                        break;
                    default:
                        return key;
                        break;
                }
            });
            obj.tencongty = obj.legalname + "</br><i>" + obj.legalnameeng + "</i>";
            results.push(obj);
        });
        //sum row
        var filterlist = _.filter(results, {type: "2"});
        var sumProfit = _.sumBy(filterlist, function (o) {
            return _.toNumber(o.profit);
        });
        sumProfit = _.round(sumProfit, 2);
        //Sum row
        results.push({
            tencongty: "<p><span><b>Cộng/ <i>Total</i></b></span></p>",
            landlottxt: "",
            areaha: "",
            profit: sumProfit,
            headerrow: "0",
            type: "",
        });

        //III, Doanh thu cho thuê và bán bất động sản đầu tư/ Revenue from Property rental and property sale
        results.push({
            tencongty:
                "<p><span><b>III, Doanh thu cho thuê và bán bất động sản đầu tư/ <i>Revenue from Property rental and property sale</i></b></span></p>",
            landlottxt: "",
            areaha: "",
            profit: "",
            headerrow: "1",
            type: "",
        });
        var ssDTBDSbefore = plib.searchRSDoanhThuBDS(options);
        //group customer contract and summary profit
        _.map(ssDTBDSbefore, function (o) {
            _.assign(o, {
                key:
                    o.legalname +
                    "_" +
                    o.legalnameeng +
                    "_" +
                    o.servicecontractinternalid,
            });
        });
        ssDTBDSbefore = _(ssDTBDSbefore)
            .groupBy("key")
            .map(function (objs, key) {
                var parseKey = _.split(key, "_");
                return {
                    legalname: parseKey[0],
                    legalnameeng: parseKey[1],
                    servicecontractinternalid: parseKey[2],
                    profit: _.sumBy(objs, function (o) {
                        return _.toNumber(o.profit);
                    }),
                };
            })
            .value();
        var ssDTBDS = [];
        //convert amount to currency
        util.each(ssDTBDSbefore, function (o) {
            var obj = _.mapValues(o, function (value, key) {
                switch (key) {
                    case "profit":
                        return _.round(value / rate, currencyprecision);
                        break;
                    default:
                        return value;
                        break;
                }
            });
            ssDTBDS.push(obj);
        });

        var ssRSLandSC = plib.searchRSLandSC(options);
        _.map(ssDTBDS, function (o) {
            _.assign(
                o,
                _.find(ssRSLandSC, {
                    servicecontractinternalid: o.servicecontractinternalid,
                })
            );
            o.headerrow = "0";
            o.type = "3";
        });

        util.each(ssDTBDS, function (o) {
            var obj = _.mapKeys(o, function (value, key) {
                switch (key) {
                    case "name":
                        return "landlottxt";
                        break;
                    default:
                        return key;
                        break;
                }
            });
            obj.tencongty = obj.legalname + "</br><i>" + obj.legalnameeng + "</i>";
            results.push(obj);
        });
        var filterlist = _.filter(results, {type: "3"});
        var sumProfit = _.sumBy(filterlist, function (o) {
            return _.toNumber(o.profit);
        });
        sumProfit = _.round(sumProfit, 2);
        //Sum row
        results.push({
            tencongty: "<p><span><b>Cộng/ <i>Total</i></b></span></p>",
            landlottxt: "",
            areaha: "",
            profit: sumProfit,
            headerrow: "0",
            type: "",
        });

        return results;
    }

    function searchGenerateLand(options) {
        var results = [];
        var ss = plib.searchGenerateLand(options);
        var ssManaFees = plib.searchManangementFeesInfo(options);
        var customers = _.map(ssManaFees, "customer");
        ss = _.reject(ss, function (o) {
            return _.includes(customers, o.customer);
        });
        // log.audit('ss',_.head(ss));

        return ss;
    }

    function searchCalcManagementFees(options) {
        var results = [];
        var ss = plib.searchManangementFeesInfo(options);
        // log.audit('ss',_.head(ss));

        return ss;
    }

    function searchDebitLoanForGenerate2(options) {
        var results = [];
        var ssDebitLoan = plib.searchDebitLoan2(options);
        var ssProject = plib.searchProject({});
        var ssActualAmount = plib.searchProjectActualAmount2(options);
        // log.audit('ssActualAmount',ssActualAmount);
        var ssLoanAndInterestSheet = plib.searchLoanAndInterestSheet({
            custrecord_scv_db_sheet: options.debitloan,
            custrecord_scv_db_sheet_type: "2",
            fromdate: options.fromdate,
            todate: options.todate,
        });
        //Get Loan interest
        var loanInterest = plib.queryDebitLoanInterest(options.debitloan);
        var rate = getRateFromPaymentDate2(loanInterest, options.fromdate);
        //Tinh sum project amount
        var sumProjectAmount = 0;
        ssDebitLoan = util.each(ssDebitLoan, function (o) {
            var filterActualAmount = _.filter(ssActualAmount, function (o1) {
                return (
                    o.internalid == o1["line.cseg_scv_sg_proj"] &&
                    !clib.isEmpty(o1["line.cseg_scv_sg_proj"])
                );
            });
            var projectamount = _.sumBy(filterActualAmount, function (o1) {
                return _.toNumber(o1.formulacurrency);
            });
            sumProjectAmount += projectamount;
        });

        var dateFormat = slib.userPreferences().dateformat;
        var monthsDif =
            moment(options.todate, dateFormat).diff(
                moment(options.fromdate, dateFormat),
                "days"
            ) + 1;
        var months = (12 * monthsDif) / 365;

        //tinh toan build for sublist
        ssDebitLoan = _.map(ssDebitLoan, function (o) {
            var ids = _.split(o.custrecord_scv_db_projectname, ",");
            // var projectName = getProjectName(ids, ssProject);
            var projectName = getProjectName([o.internalid], ssProject);
            var filterActualAmount = _.filter(ssActualAmount, function (o1) {
                return (
                    o.internalid == o1["line.cseg_scv_sg_proj"] &&
                    !clib.isEmpty(o1["line.cseg_scv_sg_proj"])
                );
            });
            var projectamount = _.sumBy(filterActualAmount, function (o1) {
                return _.toNumber(o1.formulacurrency);
            });
            var filter = _.filter(ssLoanAndInterestSheet, {
                custrecord_scv_db_sheet: o.id,
                custrecord_scv_db_sheet_type: "2",
            });
            var find = _.maxBy(filter, "id");

            var spreedAmount = "";
            if (!_.isEmpty(find)) spreedAmount = find.custrecord_scv_sheet_amt;
            var convertedprincipalamount = clib.strip(
                o.custrecord_scv_loanamt * options.exchangerate
            ); //7
            var convertedloaninterest = clib.strip(
                options.exchangerate * spreedAmount
            ); //11

            var capitalrate =
                convertedloaninterest /
                (o.custrecord_scv_loanamt * options.exchangerate * months);
            var capitalinteresexpense = capitalrate * sumProjectAmount;
            var capitalizedinterestproject = 0;
            if (sumProjectAmount > 0)
                capitalizedinterestproject =
                    (capitalinteresexpense / sumProjectAmount) * projectamount;
            return _.assign(o, {
                projectids: ids,
                projectname: projectName,
                projectamount: projectamount,
                exchangerate: options.exchangerate,
                spreedamount: spreedAmount,
                convertedprincipalamount: convertedprincipalamount,
                convertedloaninterest: convertedloaninterest,
                capitalrate: capitalrate * 100, //%
                capitalinteresexpense: capitalinteresexpense,
                capitalizedinterestproject: capitalizedinterestproject,
            });
        });

        //bind to suitelet list
        util.each(ssDebitLoan, function (o) {
            var o1 = {
                c0: "Capitalized " + o.projectname,
                c1: o.name,
                c2: o.projectname,
                c3: o.projectamount,
                c4: o.exchangerate,
                c5: o.custrecord_scv_loanamt,
                c6: o.convertedprincipalamount.toFixed(0),
                c7: o.custrecord_scv_loa_currencyname,
                c8: rate,
                c9: o.spreedamount,
                c10: o.convertedloaninterest.toFixed(0),
                month: months,
                c11: o.capitalrate, //toFixed(2),
                c12: o.capitalinteresexpense.toFixed(0),
                c13: o.capitalizedinterestproject.toFixed(0),
                debitloanid: o.id,
                projectid: o.internalid,
                currency: o.custrecord_scv_loa_currency,
            };
            results.push(o1);
        });
        //add sum line
        var o1 = {
            c0: "",
            c1: "Total",
            c2: "",
            c3: sumProjectAmount,
            c4: "",
            c5: "",
            c6: "",
            c7: "",
            c8: "",
            c9: "",
            c10: "",
            month: "",
            c11: "",
            c12: "",
            c13: "",
            debitloanid: "",
            projectid: "",
            currency: "",
        };
        results.push(o1);
        return results;
    }

    function doPostCalcLandCost(scriptContext) {
        var parameters = scriptContext.request.parameters;
        var group = "search_sublist";
        var lineCnt = scriptContext.request.getLineCount({group: group});
        var options = {
            subsidiary: parameters.custpage_subsidiary,
            project: parameters.custpage_project_name,
            item: parameters.custpage_leasable_area,
            memomain: parameters.custpage_memo_main,
            memodiff: parameters.custpage_memo_diff,
            fromdate: parameters.custpage_from_date,
            todate: parameters.custpage_to_date,
        };
        var sublist = [];
        for (var i = 0; i < lineCnt; i++) {
            var obj = {};
            var checkmark = scriptContext.request.getSublistValue({
                group: group,
                name: "c0",
                line: i,
            });
            if (checkmark == true || checkmark == "T") {
                for (var j = 1; j < 15; j++) {
                    obj = _.assign(obj, {
                        [`c${j}`]: scriptContext.request.getSublistValue({
                            group: group,
                            name: `c${j}`,
                            line: i,
                        }),
                    });
                }
                sublist.push(obj);
            }
        }
        options.sublist = sublist;
        //submit map/reduce to create IA and Journal
        var myCache = cache.getCache({
            name: "WHACache",
            scope: cache.Scope.PUBLIC,
        });
        myCache.put({key: "options", value: options});

        try {
            var mrTask = task.create({
                taskType: task.TaskType.MAP_REDUCE,
                scriptId: "customscript_scv_mr_create_ia_journal",
                deploymentId: "customdeploy_scv_mr_create_ia_journal",
            });
            // mrTask.params = {custscript_scv_mr_fromdate: fromdate, custscript_scv_mr_todate: todate, custscript_scv_mr_ars_id: ars_id_run};
            var mrTaskId = mrTask.submit();
            // myCache.put({key: 'mrTaskId', value: mrTaskId});
        } catch (e) {
            log.debug("exception", e);
        }
        // log.audit('options', options);
        redirect.toSuitelet({
            scriptId: runtime.getCurrentScript().id,
            deploymentId: runtime.getCurrentScript().deploymentId,
            parameters: {
                subsidiary: options.subsidiary,
                project: options.project,
                message: "Đã tạo xong IA",
            },
        });
    }

    function doPostCreateSONuocThai(scriptContext) {
        var parameters = scriptContext.request.parameters;
        var group = "search_sublist";
        var lineCnt = scriptContext.request.getLineCount({group: group});
        var options = {
            subsidiary: parameters.custpage_subsidiary,
            customer: parameters.custpage_customer,
            fromdate: parameters.custpage_fromdate,
            todate: parameters.custpage_todate,
        };
        var postSublistData = [];
        for (var i = 0; i < lineCnt; i++) {
            var obj = {subsidiaryid: parameters.custpage_subsidiary};
            var checkmark = scriptContext.request.getSublistValue({
                group: group,
                name: "checkbox",
                line: i,
            });
            if (checkmark == true || checkmark == "T") {
                util.each(colSONuocMay, (o) => {
                    obj = _.assign(obj, {
                        [_.replace(o.label, " ", "")]:
                            scriptContext.request.getSublistValue({
                                group: group,
                                name: _.replace(o.label, " ", ""),
                                line: i,
                            }),
                    });
                });
                postSublistData.push(obj);
            }
        }
        options.sublist = postSublistData;
        var myCache = cache.getCache({
            name: "WHACache",
            scope: cache.Scope.PUBLIC,
        });
        myCache.put({
            key: "doPostCreateSONuocThai",
            value: JSON.stringify(options),
        });

        var message = "Đang tiến hành tạo phiếu";
        try {
            var mrTask = task.create({
                taskType: task.TaskType.MAP_REDUCE,
                scriptId: "customscript_scv_mr_create_so_nuocthai",
                deploymentId: "customdeploy_scv_mr_create_so_nuocthai",
            });
            // mrTask.params = {custscript_scv_mr_fromdate: fromdate, custscript_scv_mr_todate: todate, custscript_scv_mr_ars_id: ars_id_run};
            var mrTaskId = mrTask.submit();
            // myCache.put({key: 'mrTaskId', value: mrTaskId});
        } catch (e) {
            log.error("exception", e);
            message = e.message;
        }
        // log.audit('options', options);
        redirect.toSuitelet({
            scriptId: runtime.getCurrentScript().id,
            deploymentId: runtime.getCurrentScript().deploymentId,
            parameters: {
                subsidiary: options.subsidiary,
                customer: options.customer,
                fromdate: options.fromdate,
                todate: options.todate,
                message: message,
            },
        });
    }

    function doPostCalcManagementFees(scriptContext) {
        try {
            var parameters = scriptContext.request.parameters;
            var group = "search_sublist";
            var lineCnt = scriptContext.request.getLineCount({group: group});
            var options = {
                subsidiary: parameters.custpage_subsidiary,
                item: parameters.custpage_item_fees,
                custompricing: parameters.custpage_custompricing,
                customer: parameters.custpage_customer,
                fromdate: parameters.custpage_fromdate,
                todate: parameters.custpage_todate,
                scdate: parameters.custpage_scdate,
                memo: parameters.custpage_memo,
                term: parameters.custpage_term,
            };
            var postSublistData = [];
            for (var i = 0; i < lineCnt; i++) {
                var obj = {};
                var checkmark = scriptContext.request.getSublistValue({
                    group: group,
                    name: "checkbox",
                    line: i,
                });
                if (checkmark == true || checkmark == "T") {
                    /*obj.itemid = options.item;
                      obj.customer = customer;*/
                    obj.subsidiary = options.subsidiary;
                    obj.term = options.term;
                    // obj.trandate = options.scdate;
                    obj.trandate = options.todate;
                    obj.memo = options.memo;
                    util.each(colCalcManagementFees, (o) => {
                        obj = _.assign(obj, {
                            [_.replace(o.label, /\s+/g, "")]:
                                scriptContext.request.getSublistValue({
                                    group: group,
                                    name: _.replace(o.label, /\s+/g, ""),
                                    line: i,
                                }),
                        });
                    });
                    obj.key = obj.customerid + "" + obj.servicecontractid;
                    postSublistData.push(obj);
                }
            }
            options.postSublistData = postSublistData;

            /*var groupObj = _.groupBy(postSublistData, 'customerid');
              util.each(_.keys(groupObj), key => {
                  var sublist = [];
                  var sameCustomerList = groupObj[key];
                  var bodyData = {
                      customform: '153',//WHA SC Management fees
                      entity: key,
                      trandate: format.parse({value: options.scdate, type: format.Type.DATE}),
                      custbody_scv_order_type: '24', //Management Fees
                      memo: options.memo,
                      terms: options.term,
                  };

                  util.each(sameCustomerList, o => {
                      var item, unitPrice, rate, taxcode;
                      if (o.totalnumberofdayswithoutfullmonth > 0) {
                          item = '1145';//Management fees (days)
                          unitPrice = o.basepriceperdays;
                          rate = o.amountofwithoutfullmonths;
                          taxcode = plib.getTaxCode(item);

                          var obj = {
                              item: item,
                              // units:'',
                              rate: rate,
                              quantity: 1,
                              amount: rate,
                              taxcode: taxcode,//VAT_VN:VAT10
                              // grossamt:'',
                              // tax1amt:''
                              custcol_scv_clolumn_areaha: o.areaha,
                              custcol_scv_column_areasqm: o.areasqm,
                              custcol_scv_sc_unit_price_mf: unitPrice,
                              custcol_scv_scv_day_without_full_m: o.totalnumberofdayswithoutfullmonth,
                              // custcol_scv_sc_total_full_m: ''
                          };
                          sublist.push(obj);
                      }
                      if (o.totalfullmonth > 0) {
                          item = '1144';//Management fees (month)
                          unitPrice = o.basepricepermonth;
                          rate = o.basepricepermonth;
                          taxcode = plib.getTaxCode(item);

                          var obj = {
                              item: item,
                              // units:'',
                              rate: rate,
                              quantity: 1,
                              amount: rate,
                              taxcode: taxcode,//VAT_VN:VAT10
                              // grossamt:'',
                              // tax1amt:''
                              custcol_scv_clolumn_areaha: o.areaha,
                              custcol_scv_column_areasqm: o.areasqm,
                              custcol_scv_sc_unit_price_mf: unitPrice,
                              // custcol_scv_scv_day_without_full_m: '',
                              custcol_scv_sc_total_full_m: o.totalfullmonth
                          };
                          sublist.push(obj);
                      }
                  });
                  var id = plib.createRecord(record.Type.SALES_ORDER, 'item', bodyData, sublist);
                  log.audit('created id', id);
                  if (!clib.isEmpty(id)) {
                      //update tung item lo dat theo ngay sc date
                      util.each(sameCustomerList, o => {
                          var searchManagementFeeInfo = plib.searchRecManageFeesInfo(options.subsidiary, o.item);
                          var idFees = _.head(searchManagementFeeInfo).id;
                          var recManaFees = record.load({type: 'customrecord_scv_management_fees_info', id: idFees});
                          recManaFees.setValue({
                              fieldId: 'custrecord_scv_mff_lasted_day_fee',
                              value: format.parse({value: options.scdate, type: format.Type.DATE})
                          });
                          recManaFees.setValue('custrecord_scv_mf_area_ha', o.areaha);
                          recManaFees.setValue('custrecord_scv_mf_area_sqm', o.areasqm);
                          recManaFees.save({enableSourcing: false, ignoreMandatoryFields: true});
                      });
                      // redirect.toRecord({type: record.Type.SALES_ORDER, id: id});
                  }
              });*/
            /*redirect.toSuitelet({
                  scriptId: runtime.getCurrentScript().id,
                  deploymentId: runtime.getCurrentScript().deploymentId,
                  parameters: {
                      subsidiary: options.subsidiary,
                      item: options.item,
                      custompricing: options.custompricing,
                      customer: options.customer,
                      fromdate: options.fromdate,
                      todate: options.todate,
                      scdate: options.scdate,
                      memo: options.memo,
                      term: options.term,
                      message: 'Đang tiến hành tạo phiếu...',
                  },
              });*/

            //Neu can dung mutil customer
            var myCache = cache.getCache({
                name: "WHACache",
                scope: cache.Scope.PUBLIC,
            });
            myCache.put({
                key: "doPostCalcManagementFees",
                value: JSON.stringify(postSublistData),
            });
            var mrTask = task.create({
                taskType: task.TaskType.MAP_REDUCE,
                scriptId: "customscript_scv_mr_calc_mana_fees",
                deploymentId: "customdeploy_scv_mr_calc_mana_fees",
            });
            // mrTask.params = {custscript_scv_mr_fromdate: fromdate, custscript_scv_mr_todate: todate, custscript_scv_mr_ars_id: ars_id_run};
            var mrTaskId = mrTask.submit();
            // myCache.put({key: 'mrTaskId', value: mrTaskId});

            redirect.toSuitelet({
                scriptId: runtime.getCurrentScript().id,
                deploymentId: runtime.getCurrentScript().deploymentId,
                parameters: {
                    subsidiary: options.subsidiary,
                    item: options.item,
                    custompricing: options.custompricing,
                    customer: options.customer,
                    fromdate: options.fromdate,
                    todate: options.todate,
                    scdate: options.scdate,
                    memo: options.memo,
                    term: options.term,
                    message: "Đang tiến hành tạo phiếu...",
                },
            });
        } catch (e) {
            log.error("doPostCalcManagemenFees", e);
            redirect.toSuitelet({
                scriptId: runtime.getCurrentScript().id,
                deploymentId: runtime.getCurrentScript().deploymentId,
                parameters: {
                    subsidiary: options.subsidiary,
                    item: options.item,
                    custompricing: options.custompricing,
                    customer: options.customer,
                    fromdate: options.fromdate,
                    todate: options.todate,
                    scdate: options.scdate,
                    memo: options.memo,
                    term: options.term,
                    message: e.message,
                },
            });
        }
    }

    function doPostGenerateLand(scriptContext) {
        var parameters = scriptContext.request.parameters;
        var group = "search_sublist";
        var lineCnt = scriptContext.request.getLineCount({group: group});
        var options = {
            subsidiary: parameters.custpage_subsidiary,
            customer: parameters.custpage_customer,
        };
        var postSublistData = [];
        for (var i = 0; i < lineCnt; i++) {
            var obj = {};
            var checkmark = scriptContext.request.getSublistValue({
                group: group,
                name: "checkbox",
                line: i,
            });
            if (checkmark == true || checkmark == "T") {
                util.each(colGenerateLand, (o) => {
                    obj = _.assign(obj, {
                        [_.replace(o.label, " ", "")]:
                            scriptContext.request.getSublistValue({
                                group: group,
                                name: _.replace(o.label, " ", ""),
                                line: i,
                            }),
                    });
                });
                postSublistData.push(obj);
            }
        }
        options.sublist = postSublistData;
        var myCache = cache.getCache({
            name: "WHACache",
            scope: cache.Scope.PUBLIC,
        });
        myCache.put({key: "doPostGenerateLand", value: JSON.stringify(options)});

        var message = "Đang tiến hành tạo phiếu";
        try {
            var mrTask = task.create({
                taskType: task.TaskType.MAP_REDUCE,
                scriptId: "customscript_scv_mr_generate_land",
                deploymentId: "customdeploy_scv_mr_generate_land",
            });
            // mrTask.params = {custscript_scv_mr_fromdate: fromdate, custscript_scv_mr_todate: todate, custscript_scv_mr_ars_id: ars_id_run};
            var mrTaskId = mrTask.submit();
            // myCache.put({key: 'mrTaskId', value: mrTaskId});
        } catch (e) {
            log.error("exception", e);
            message = e.message;
        }
        // log.audit('options', options);
        redirect.toSuitelet({
            scriptId: runtime.getCurrentScript().id,
            deploymentId: runtime.getCurrentScript().deploymentId,
            parameters: {
                subsidiary: options.subsidiary,
                customer: options.customer,
                message: message,
            },
        });
    }

    function doPostSumDebitNote(scriptContext) {
        var parameters = scriptContext.request.parameters;
        var group = "search_sublist";
        var lineCnt = scriptContext.request.getLineCount({group: group});
        var options = {
            subsidiary: parameters.custpage_subsidiary,
            customer: parameters.custpage_customer,
            servicecontract: parameters.custpage_servicecontract,
            fromdate: parameters.custpage_fromdate,
            todate: parameters.custpage_todate,
            debitnoteno: parameters.custpage_debitnoteno,
            debitnotedate: parameters.custpage_debitnotedate,
            accountbank: parameters.custpage_accountbank,
            duedate: parameters.custpage_duedate,
            interestcalculationdate: parameters.custpage_interestcalculationdate,
            totaloverduedays: parameters.custpage_totaloverduedays,
            terminationdate: parameters.custpage_terminationdate,
            mouno: parameters.custpage_mouno,
            moudate: parameters.custpage_moudate,
            lsano: parameters.custpage_lsano,
            lsadate: parameters.custpage_lsadate,
        };
        var postSublistData = [];
        for (var i = 0; i < lineCnt; i++) {
            var obj = {};
            var checkmark = scriptContext.request.getSublistValue({
                group: group,
                name: "checkbox",
                line: i,
            });
            if (checkmark == true || checkmark == "T") {
                util.each(colDebitNote, (o) => {
                    obj = _.assign(obj, {
                        [_.replace(o.label, /\s+/g, "")]:
                            scriptContext.request.getSublistValue({
                                group: group,
                                name: _.replace(o.label, /\s+/g, ""),
                                line: i,
                            }),
                    });
                });
                postSublistData.push(obj);
            }
        }
        var recCustomer = record.load({
            type: record.Type.CUSTOMER,
            id: options.customer,
        });
        var contact = recCustomer.getSublistValue({
            sublistId: "contactroles",
            fieldId: "contact",
            line: 0,
        });
        var name = plib.generateSoPhieu({
            recordType: "customrecord_scv_sum_debitnote",
            type: "",
            lengthOfNumber: 3,
            formular: "TO_NUMBER(REGEXP_REPLACE(SUBSTR({name}, 4),'[^0-9]',''))",
            fieldId: "name",
            prefix: "GDN",
        });
        var body = {
            name: name,
            custrecord_scv_sum_cus: options.customer,
            custrecord_scv_sum_contact: contact,
            custrecord_scv_sum_dnn: options.debitnoteno,
            custrecord_scv_sum_dnd: clib.isEmpty(options.debitnotedate)
                ? ""
                : format.parse({
                    value: options.debitnotedate,
                    type: format.Type.DATE,
                }),
            custrecord_scv_sum_ab: options.accountbank,
            custrecord_scv_dndd: clib.isEmpty(options.duedate)
                ? ""
                : format.parse({
                    value: options.duedate,
                    type: format.Type.DATE,
                }),
            custrecord_scv_sum_icd: clib.isEmpty(options.interestcalculationdate)
                ? ""
                : format.parse({
                    value: options.interestcalculationdate,
                    type: format.Type.DATE,
                }),
            custrecord_scv_sum_tod: options.totaloverduedays,
            custrecord_scv_sum_ter: clib.isEmpty(options.terminationdate)
                ? ""
                : format.parse({
                    value: options.terminationdate,
                    type: format.Type.DATE,
                }),
            custrecord_scv_sum_mouno: options.mouno,
            custrecord_scv_moudate: clib.isEmpty(options.moudate)
                ? ""
                : format.parse({
                    value: options.moudate,
                    type: format.Type.DATE,
                }),
            custrecord_scv_sum_lsano: options.lsano,
            custrecord_scv_sum_lsad: clib.isEmpty(options.lsadate)
                ? ""
                : format.parse({
                    value: options.lsadate,
                    type: format.Type.DATE,
                }),
            custrecord_scv_sum_cur: _.head(postSublistData).currencyid,
        };
        var sublist = [];
        util.each(postSublistData, (o) => {
            obj = {
                custrecord_scv_sumline_memo: o.memo,
                custrecord_scv_sumline_memoeng: o.memoeng,
                // custrecord_scv_sc_amount_net: o.amountnet,
                custrecord_scv_sdl_amountnet: o.amountnet,
                // custrecord_scv_sc_tax_amount: o.taxamount,
                custrecord_scv_sdl_taxamount: o.taxamount,
                custrecord_scv_sumline_amount: o.amount,
                custrecord_scv_sumline_paidamount: o.paidamount,
                custrecord_scv_sumline_re: o.remainingamount,
                custrecord_scv_sumline_pr: _.replace(o.penaltyrate, "%", ""),
                custrecord_scv_sumline_pa: o.penaltyamount,
                custrecord_scv_sumline_oi: _.replace(o.overdueinterest, "%", ""),
                custrecord_scv_sumline_oa: o.overdueamount,
            };
            sublist.push(obj);
        });

        try {
            var id = plib.createRecord(
                "customrecord_scv_sum_debitnote",
                "recmachcustrecord_scv_sumline_dbid",
                body,
                sublist
            );
            if (!clib.isEmpty(id)) {
                redirect.toRecord({type: "customrecord_scv_sum_debitnote", id: id});
            }
        } catch (e) {
            redirect.toSuitelet({
                scriptId: runtime.getCurrentScript().id,
                deploymentId: runtime.getCurrentScript().deploymentId,
                parameters: {
                    search: "1",
                    message: e.message,
                    subsidiary: options.subsidiary,
                    customer: options.customer,
                    servicecontract: options.servicecontract,
                    fromdate: options.fromdate,
                    todate: options.todate,
                    debitNoteNo: options.debitnoteno,
                    debitNoteDate: options.debitnotedate,
                    accountBank: options.accountbank,
                    dueDate: options.duedate,
                    interestCalcDate: options.interestcalculationdate,
                    totalOverdueDays: options.totaloverduedays,
                    terminationDate: options.terminationdate,
                    mouNo: options.mouno,
                    mouDate: options.moudate,
                    lsaNo: options.lsano,
                    lsaDate: options.lsadate,
                },
            });
        }
    }

    function doPostCapitalizedInterest(scriptContext) {
        var parameters = scriptContext.request.parameters;
        var group = "search_sublist";
        var lineCnt = scriptContext.request.getLineCount({group: group});
        var param = {
            subsidiary: parameters.custpage_subsidiary,
            debitloan: parameters.custpage_debitloan,
            exchangerate: parameters.custpage_exchangerate,
            fromdate: parameters.custpage_fromdate,
            todate: parameters.custpage_todate,
            postingdate: parameters.custpage_postingdate,
        };
        var options = {
            subsidiary: param.subsidiary,
            trandate: format.parse({
                value: param.postingdate,
                type: format.Type.DATE,
            }),
            memo: "Chi phí vốn hoá lãi vay cho dự án",
        };
        var recordLoad = record.load({
            type: "customrecord_scv_dbaccountingsetup",
            id: "1",
        });
        var debitAccount = recordLoad.getValue("custrecord_scv_dbcc_procost");
        // debitAccount = '1807';
        var creditAccount = recordLoad.getValue("custrecord_scv_dbacc_postpaidacc");
        var ss = searchDebitLoanForGenerate2(param);
        ss = _.reject(ss, function (o) {
            return o.c0 == "";
        });
        var sublist = [];
        var credit = 0;
        util.each(ss, (o) => {
            try {
                if (runtime.getCurrentScript().getRemainingUsage() > 0) {
                    var debit = _.round(o.c13);
                    credit += debit;
                    var obj = {
                        account: debitAccount,
                        debit: debit,
                        memo: "Chi phí vốn hoá lãi vay dự án",
                        cseg_scv_sg_proj: o.projectid,
                        cseg_scv_loan: param.debitloan,
                    };
                    sublist.push(obj);
                    var optionForBody = {
                        name: o.c2,
                        custrecord_scv_ci_debitloan: o.debitloanid,
                        custrecord_scv_ci_projectname: o.projectid,
                        custrecord_scv_ci_projectamt: o.c3,
                        custrecord_scv_ct_principalamt: o.c5,
                        custrecord_scv_ci_currency: o.currency,
                        custrecord_scv_ci_rate: _.replace(o.c8, "%", ""),
                        custrecord_scv_ci_interestamt: o.c9,
                        custrecord_scv_ci_exchangerate: o.c4,
                        custrecord_scv_ci_convertedinterest: o.c10,
                        custrecord_scv_ci_captrate: _.replace(o.c11, "%", ""),
                        custrecord_scv_ci_capinterex: o.c12,
                        custrecord_scv_conprinamt: o.c6,
                        custrecord_scv_capinterestproj: debit,
                    };
                    var id = plib.createRecord(
                        "customrecord_scv_capitalinteret",
                        "",
                        optionForBody,
                        []
                    );
                } else {
                    var form = ui.createForm({
                        title: "Hết dung lượng bộ nhớ để thực thi.",
                    });
                    scriptContext.response.writePage(form);
                }
            } catch (e) {
                var form = ui.createForm({
                    title: "Hết dung lượng bộ nhớ để thực thi.",
                });
                scriptContext.response.writePage(form);
            }
        });
        sublist.push({
            account: creditAccount,
            credit: credit,
            memo: "Chi phí vốn hoá lãi vay dự án",
        });
        try {
            var id = plib.createRecord(
                record.Type.JOURNAL_ENTRY,
                "line",
                options,
                sublist
            );
            redirect.toRecord({
                type: record.Type.JOURNAL_ENTRY,
                id: id,
            });
        } catch (e) {
            var form = ui.createForm({title: "Có lỗi phát sinh"});
            var f = form.addField({
                id: "custpage_message",
                label: "Message",
                type: ui.FieldType.INLINEHTML,
                //   source: string,
                //   container: string
            });
            f.defaultValue = e.message;
            scriptContext.response.writePage(form);
        }
    }

    function doPostGeneratePrincipalandInterestBK(scriptContext) {
        var parameters = scriptContext.request.parameters;
        var param = {
            subsidiary: parameters.custpage_subsidiary,
            debitloan: parameters.custpage_debitloan,
        };
        var ss = buildGeneratePrincipalInterestSublistData(param);
        var listSheet = [];
        util.each(ss, (o) => {
            var options = {
                name: o.c0,
                custrecord_scv_db_sheet: o.debitloan,
                custrecord_scv_db_sheet_type: o.type,
                custrecord_scv_dbsheet_paymentdate: format.parse({
                    value: o.c3,
                    type: format.Type.DATE,
                }),
                custrecord_scv_sheet_rate: _.replace(o.c4, "%", ""),
                custrecord_scv_sheet_amt: o.c5,
                custrecord_scv_sheet_status: "1",
            };
            var id = plib.createRecord(
                "customrecord_scv_prinandintersheet",
                "",
                options,
                []
            );
            listSheet.push(id);
        });
        var outputLink =
            "https://6968408.app.netsuite.com/app/common/search/searchresults.nl?searchid=565&whence=";
        var link =
            "<a href='#' onClick=\"MyWindow=window.open('" +
            outputLink +
            "','','width=1400,height=700'); return false;\">" +
            listSheet.toString() +
            "</a>";

        redirect.toSuitelet({
            scriptId: runtime.getCurrentScript().id,
            deploymentId: runtime.getCurrentScript().deploymentId,
            parameters: {
                message: "Đã tạo xong Loan principal and interest Spreadsheet:" + link,
            },
        });
    }

    function doPostGeneratePrincipalandInterest(scriptContext) {
        try {
            var mrTask = task.create({
                taskType: task.TaskType.MAP_REDUCE,
                scriptId: "customscript_scv_mr_generate_prin_intere",
                deploymentId: "customdeploy_scv_mr_generate_prin_intere",
            });
            mrTask.params = {
                custscript_scv_param_loan:
                scriptContext.request.parameters.custpage_debitloan,
            };
            var mrTaskId = mrTask.submit();
            // myCache.put({key: 'mrTaskId', value: mrTaskId});
        } catch (e) {
            log.debug("exception", e);
        }

        redirect.toSuitelet({
            scriptId: runtime.getCurrentScript().id,
            deploymentId: runtime.getCurrentScript().deploymentId,
            parameters: {
                message: "Đang tiến hành tạo Loan Principal and Interest Spreadsheet:",
            },
        });
    }

    function doGetCalcLandCost(scriptContext) {
        //get parameter
        var parameters = scriptContext.request.parameters;
        var options = {
            subsidiary: parameters.subsidiary,
            project: parameters.project,
            item: _.split(parameters.item, ","),
            search: parameters.search,
            fromdate: parameters.fromdate,
            todate: parameters.todate,
            postdate: parameters.postdate,
            memomain: parameters.memomain,
            memodiff: parameters.memodiff,
            message: parameters.message,
        };
        //build form
        var form = ui.createForm({
            title: "Calculate Land Cost",
        });
        form.addSubmitButton("Save");
        form.addButton({
            id: "custpage_search_btn",
            label: "Search",
            functionName: "searchCalcLandCost",
        });
        form.addFieldGroup({id: "maingroup", label: "Main"});
        //Add form header
        var fieldType = form.addField({
            id: "custpage_type",
            label: "Type",
            type: ui.FieldType.TEXT,
        });
        fieldType.updateDisplayType({displayType: ui.FieldDisplayType.HIDDEN});
        fieldType.defaultValue = "Calculate Land Cost";
        var fieldSub = form.addField({
            id: "custpage_subsidiary",
            label: "Subsidiary",
            type: ui.FieldType.SELECT,
            container: "maingroup",
            source: "subsidiary",
        });
        if (!clib.isEmpty(options.subsidiary))
            fieldSub.defaultValue = options.subsidiary;
        fieldSub.isMandatory = true;
        var projectField = form.addField({
            id: "custpage_project_name",
            label: "Project Name",
            type: ui.FieldType.SELECT,
            container: "maingroup",
            // source: 'customrecord_cseg_scv_sg_proj'
        });
        projectField.isMandatory = true;
        var ss1 = plib.searchLandItemsWithSub({subsidiary: options.subsidiary});
        if (!clib.isEmpty(options.subsidiary)) {
            util.each(_.uniq(_.map(ss1, "projectid")), (o) => {
                var findObj = _.find(ss1, {projectid: o});
                var isSelected = false;
                if (options.project == o) isSelected = true;
                projectField.addSelectOption({
                    value: o,
                    text: findObj.projectname,
                    isSelected: isSelected,
                });
            });
        }
        if (!clib.isEmpty(options.project))
            projectField.defaultValue = options.project;
        var itemField = form.addField({
            id: "custpage_leasable_area",
            label: "Leasable area",
            type: ui.FieldType.MULTISELECT,
            container: "maingroup",
            // source:'item'
        });
        util.each(ss1, function (o) {
            var isSelected = false;
            if (_.includes(options.item, o.itemid)) isSelected = true;
            itemField.addSelectOption({
                value: o.itemid,
                text: o.itemname,
                isSelected: isSelected,
            });
        });
        itemField.defaultValue = options.item;
        var fromdateField = form.addField({
            id: "custpage_from_date",
            label: "From date",
            type: ui.FieldType.DATE,
            container: "maingroup",
        });
        if (!clib.isEmpty(options.fromdate))
            fromdateField.defaultValue = options.fromdate;
        fromdateField.updateBreakType({breakType: ui.FieldBreakType.STARTCOL});
        var todateField = form.addField({
            id: "custpage_to_date",
            label: "To date",
            type: ui.FieldType.DATE,
            container: "maingroup",
        });
        if (!clib.isEmpty(options.todate))
            todateField.defaultValue = options.todate;
        var postDateField = form.addField({
            id: "custpage_posting_date",
            label: "Posting date",
            type: ui.FieldType.DATE,
            container: "maingroup",
        });
        if (!clib.isEmpty(options.postdate))
            postDateField.defaultValue = options.postdate;
        postDateField.isMandatory = true;
        var memomainField = form.addField({
            id: "custpage_memo_main",
            label: "Memo main",
            type: ui.FieldType.TEXTAREA,
            container: "maingroup",
        });
        if (!clib.isEmpty(options.memomain))
            memomainField.defaultValue = options.memomain;
        memomainField.updateBreakType({breakType: ui.FieldBreakType.STARTCOL});
        var memoDifField = form.addField({
            id: "custpage_memo_diff",
            label: "Memo Diff",
            type: ui.FieldType.TEXTAREA,
            container: "maingroup",
        });
        if (!clib.isEmpty(options.memodiff))
            memoDifField.defaultValue = options.memodiff;

        if (options.search == "1") {
            var ss = buildCalcLandCostSublistData(options);
            var sublist = buildCalcLandCostSublist(form, ss.length);
            bindingSublist(ss, sublist);
        }
        form.clientScriptModulePath = "../cs/scv_cs_public.js";
        if (!clib.isEmpty(options.message))
            form.addPageInitMessage({
                type: message.Type.INFORMATION,
                message: options.message,
                duration: 10000,
            });
        scriptContext.response.writePage(form);
    }

    function bindingSublist(ss, sublist) {
        util.each(ss, function (o, i) {
            var options = {
                c1: o.name, //item display name
                c2: o.itemCategory,
                c3: o.projectName,
                c4: o.areaHa,
                c5: o.sellableArea,
                c6: o.rateBD,
                c7: o.budgetCostTotal,
                c8: o.rateActual,
                c9: o.actualWIP,
                c10: o.accruedLost,
                c11: o.postdate,
                c12: o.memomain,
                c13: o.memodiff,
                c14: o.id, //item internal id
            };
            addSublistRow(options, sublist, i);
        });
    }

    function bindingGeneratePrincipalInterestSublist(ss, sublist) {
        util.each(ss, function (o, i) {
            /*var options = {
                              c1: o.name,
                              c6: 'Open',
                          };*/
            addSublistRow(o, sublist, i);
        });
    }

    function bindingSublistNuocThai(ss, formSublist) {
        util.each(ss, function (o, i) {
            var options = {
                // checkbox: o.name,
                ordertype: o.ordertypetext,
                subsidiary: o.subsidiarytext,
                scnumber: o.documentnumber,
                date: o.date,
                customer: o.nametext,
                customerid: o.name,
                item: o.itemtext,
                itemid: o.item,
                units: o.units,
                quantity: o.quantity,
                startdate: o.startdate,
                enddate: o.enddate,
                memo: o.memo,
            };
            addSublistRow(options, formSublist, i);
        });
    }

    function bindingSublistBudgetHistory(ss, formSublist) {
        util.each(ss, function (o, i) {
            var options = {
                dep: o.depcode,
                budgetcode: o.budgetcodetext,
                cumulativebudget: o.cumulativebudget,
                commitmentbudget: o.commitmentbudget,
                actualcommitmentbudget: o.actualcommitmentbudget,
                remainingbudgettocheck: o.remainingbudgettocheck,
                level: o.level,
            };
            addSublistRow(options, formSublist, i);
        });
    }

    function bindingSublistTVDT(ss, formSublist) {
        util.each(ss, function (o, i) {
            var options = {
                stt: "",
                chitieu: "",
                thoigian: "",
                thuchien: "",
            };
            addSublistRow(o, formSublist, i);
        });
    }

    function bindingSublistDebitNote(ss, formSublist) {
        util.each(ss, function (o, i) {
            var options = {
                subsidiary: o.subText,
                subsidiaryid: o.sub,
                servicecontract: o.serviceContractText,
                servicecontractid: o.sc,
                name: o.name,
                customer: o.customerNameText,
                customerid: o.customername,
                contact: o.contactText,
                contactid: o.contact,
                memo: o.memo,
                memoeng: o.memoeng,
                term: o.termText,
                paymentnumber: o.paymentnumber,
                currency: o.currencyText,
                currencyid: o.currency,
                amountnet: o.amountnet,
                taxamount: o.taxamount,
                amount: o.amount,
                paidamount: o.paidamount,
                remainingamount: o.remainingamount,
                penaltyrate: o.penaltyrate,
                penaltyamount: o.penaltyamount,
                overdueinterest: o.overdueinterestrate,
                overdueamount: o.overdueinterestamount,
            };
            addSublistRow(options, formSublist, i);
        });
    }

    //ss:month,amount,chitieu,tenchitieu
    function bindingSublistCashflow(ss, formSublist, options) {
        //currency
        var rate = 1;
        var currencyprecision = 0;
        if (!clib.isEmpty(options.currency)) {
            var recdata = slib.getRecordData(
                record.Type.CURRENCY,
                options.currency,
                "",
                ["isbasecurrency", "currencyprecision"],
                []
            );
            if (
                recdata.body.isbasecurrency == false ||
                recdata.body.isbasecurrency == "F"
            ) {
                var currencyData = plib.queryCurrency(options);
                if (!_.isEmpty(currencyData)) {
                    rate = _.head(currencyData).rate;
                    currencyprecision = recdata.body.currencyprecision;
                }
            }
        }

        util.each(ss, function (o, i) {
            var options = {
                tenchitieu: o.tenchitieu,
                jan: "",
                feb: "",
                mar: "",
                apr: "",
                may: "",
                jun: "",
                jul: "",
                aug: "",
                sep: "",
                oct: "",
                nov: "",
                dec: "",
                // total: ''
            };
            util.each(o.listAmount, function (o2) {
                var v = o2.amount == "" ? "" : o2.amount.toFixed(currencyprecision);
                switch (o2.month) {
                    case "1":
                        options.jan = v;
                        break;
                    case "2":
                        options.feb = v;
                        break;
                    case "3":
                        options.mar = v;
                        break;
                    case "4":
                        options.apr = v;
                        break;
                    case "5":
                        options.may = v;
                        break;
                    case "6":
                        options.jun = v;
                        break;
                    case "7":
                        options.jul = v;
                        break;
                    case "8":
                        options.aug = v;
                        break;
                    case "9":
                        options.sep = v;
                        break;
                    case "10":
                        options.oct = v;
                        break;
                    case "11":
                        options.nov = v;
                        break;
                    case "12":
                        options.dec = v;
                        break;
                }
            });
            addSublistRow(options, formSublist, i);
        });
    }

    function bindingSublistRevenues(ss, formSublist) {
        util.each(ss, function (o, i) {
            var options = {
                customername: o.tencongty,
                landlot: o.landlottxt,
                area: o.areaha,
                revenue: o.profit,
                headerrow: o.headerrow,
            };
            addSublistRow(options, formSublist, i);
        });
    }

    function bindingSublistGenerateLand(ss, formSublist) {
        util.each(ss, function (o, i) {
            var options = {
                name:
                    "MF " +
                    _.defaultTo(o.customertext, "") +
                    " " +
                    _.defaultTo(o.item, ""),
                subsidiary: o.subsidiarytext,
                subsidiaryid: o.subsidiary,
                item: o.item,
                itemid: o.itemid,
                areaha: o.areaha,
                areasqm: o.areasqm,
                customer: o.customertext,
                customerid: o.customer,
                handoverdate: o.hodate,
            };
            addSublistRow(options, formSublist, i);
        });
    }

    function bindingSublistCalcManagementFees(ss, formSublist, param) {
        var dateFormat = slib.userPreferences().dateformat;
        var ss2 = plib.searchGenerateLand({subsidiary: param.subsidiary});
        var ssItemPricing = plib.searchItemPricing({
            subsidiary: param.subsidiary,
        });
        util.each(ss, function (o, i) {
            var findLeasableAreaItem = _.find(ss2, {itemid: o.item});
            if (_.isEmpty(findLeasableAreaItem)) {
                _.assign(o, {
                    projectname: "",
                    servicecontract: "",
                    descriptionvn: "",
                    descriptioneng: "",
                });
            } else {
                _.assign(o, {
                    projectnametext: findLeasableAreaItem.projectnametext,
                    servicecontracttext: findLeasableAreaItem.servicecontracttext,
                    servicecontract: findLeasableAreaItem.servicecontract,
                    descriptionvn: findLeasableAreaItem.descriptionvn,
                    descriptioneng: findLeasableAreaItem.descriptioneng,
                });
            }
            // bây h lại muốn đổi lại sử dụng giá đồng loạt trên màn hình chạy suitelet
            // var basepricebemonth = _.find(ssItemPricing, {
            //     id: o.customer,
            // }).unitprice;
            var basepricebemonth = param.custompricing;

            var basepriceperdays = _.round(basepricebemonth / 30, 2);
            var totalfullmonth =
                moment(param.todate, dateFormat).diff(
                    moment(param.fromdate, dateFormat),
                    "months"
                ) + 1;
            var amountofwithoutfullmonths = 0;
            var paymenttotal = 0;
            if (!clib.isEmpty(o.handoverdate)) {
                var enddateofmonth = moment(o.handoverdate, dateFormat).endOf("month");
                var enddateofmonthF = moment(o.handoverdate, dateFormat)
                    .endOf("month")
                    .format(dateFormat);
                var totalnumberofdayswithoutfullmonth =
                    enddateofmonth.diff(moment(o.handoverdate, dateFormat), "days") + 1;
                amountofwithoutfullmonths = clib.strip(
                    _.toNumber(o.areasqm) *
                    basepriceperdays *
                    totalnumberofdayswithoutfullmonth
                );

                if (!clib.isEmpty(o.lastedday)) totalnumberofdayswithoutfullmonth = 0;
                if (totalnumberofdayswithoutfullmonth > 0) totalfullmonth -= 1;
                var amountoffullmonth = clib.strip(
                    o.areasqm * basepricebemonth * totalfullmonth
                );
                paymenttotal = amountofwithoutfullmonths + amountoffullmonth;
            }
            var options = {
                sc: "SC " + o.customertext + " " + _.padStart(i + 1, 2, "0"),
                customer: o.customertext,
                customerid: o.customer,
                itemtext: o.itemtext,
                item: o.item,
                areaha: o.areaha,
                areasqm: o.areasqm,
                itemfees: param.itemtext,
                unit: param.unittext,
                basepricepermonth: basepricebemonth,
                basepriceperdays: basepriceperdays,
                handoverdate: o.handoverdate,
                enddateofmonth: enddateofmonthF,
                lastedday: o.lastedday,
                totalnumberofdayswithoutfullmonth: totalnumberofdayswithoutfullmonth,
                amountofwithoutfullmonths: amountofwithoutfullmonths.toFixed(0),
                totalfullmonth: totalfullmonth,
                amountoffullmonth: amountoffullmonth.toFixed(0),
                paymenttotal: paymenttotal.toFixed(0),
                memo: param.memo,
                projectname: o.projectnametext,
                servicecontract: o.servicecontracttext,
                servicecontractid: o.servicecontract,
                descriptionvn: o.descriptionvn,
                descriptioneng: o.descriptioneng,
            };
            addSublistRow(options, formSublist, i);
        });
    }

    function addSublistRow(options, sublist, i) {
        util.each(_.keys(options), function (o) {
            if (!clib.isEmpty(_.defaultTo(options[o], ""))) {
                try {
                    sublist.setSublistValue({
                        id: o,
                        line: i,
                        value: options[o],
                    });
                } catch (e) {
                    // log.error("can not set " + o, options[o]);
                }
            }
        });
    }

    var col = [
        {label: "apply", type: ui.FieldType.CHECKBOX},
        {label: "leasable area", type: ui.FieldType.TEXT},
        {label: "item category", type: ui.FieldType.TEXT},
        {label: "project name", type: ui.FieldType.TEXT},
        {label: "area (ha)", type: ui.FieldType.TEXT},
        {label: "sellable area (aqm)", type: ui.FieldType.FLOAT},
        {label: "rate (bd)", type: ui.FieldType.FLOAT},
        {label: "budget cost total", type: ui.FieldType.FLOAT},
        {label: "rate (actual)", type: ui.FieldType.FLOAT},
        {label: "actual wip cost total", type: ui.FieldType.FLOAT},
        {label: "accued lost/gain", type: ui.FieldType.FLOAT},
        {
            label: "posting date",
            type: ui.FieldType.DATE,
            displayType: ui.FieldDisplayType.ENTRY,
        },
        {label: "memo (main)", type: ui.FieldType.TEXT},
        {label: "memo (diff)", type: ui.FieldType.TEXT},
        {
            label: "item id",
            type: ui.FieldType.TEXT,
            displayType: ui.FieldDisplayType.HIDDEN,
        }, //14
    ];

    const colGeneratePrincipalInterest = [
        {label: "name", type: ui.FieldType.TEXT},
        {label: "debit/loan", type: ui.FieldType.TEXT},
        {label: "type", type: ui.FieldType.TEXT},
        {label: "payment date", type: ui.FieldType.DATE},
        {label: "rate", type: ui.FieldType.TEXT},
        {label: "amount", type: ui.FieldType.FLOAT},
        {label: "status", type: ui.FieldType.TEXT},
    ];
    const colGenForPrincInter = [
        {label: "name", type: ui.FieldType.TEXT},
        {label: "debit/loan", type: ui.FieldType.TEXT},
        {label: "project name", type: ui.FieldType.TEXT},
        {label: "project amount", type: ui.FieldType.FLOAT},
        {label: "exchange rate", type: ui.FieldType.TEXT},
        {label: "principal amount", type: ui.FieldType.FLOAT},
        {label: "converted principal amount", type: ui.FieldType.FLOAT},
        {label: "currency", type: ui.FieldType.TEXT},
        {label: "rate", type: ui.FieldType.TEXT},
        {label: "interest amount", type: ui.FieldType.FLOAT},
        {label: "converted loan interest", type: ui.FieldType.FLOAT},
        {label: "capitalization rate", type: ui.FieldType.TEXT},
        {label: "capitalized interest expense", type: ui.FieldType.FLOAT},
        {label: "capitalized interest project", type: ui.FieldType.FLOAT},
    ];

    const colSONuocMay = [
        {label: "checkbox", type: ui.FieldType.CHECKBOX},
        {label: "order type", type: ui.FieldType.TEXT},
        {label: "subsidiary", type: ui.FieldType.TEXT},
        {label: "sc number", type: ui.FieldType.TEXT},
        {
            label: "date",
            type: ui.FieldType.DATE,
            displayType: ui.FieldDisplayType.ENTRY,
        },
        {label: "customer", type: ui.FieldType.TEXT},
        {
            label: "customerid",
            type: ui.FieldType.TEXT,
            displayType: ui.FieldDisplayType.HIDDEN,
        },
        {label: "item", type: ui.FieldType.TEXT},
        {
            label: "itemid",
            type: ui.FieldType.TEXT,
            displayType: ui.FieldDisplayType.HIDDEN,
        },
        {label: "units", type: ui.FieldType.TEXT},
        {label: "quantity", type: ui.FieldType.FLOAT},
        {label: "start date", type: ui.FieldType.DATE},
        {label: "end date", type: ui.FieldType.DATE},
        {
            label: "memo",
            type: ui.FieldType.TEXT,
            displayType: ui.FieldDisplayType.ENTRY,
            size: 50,
        },
    ];

    const colCalcManagementFees = [
        {label: "checkbox", type: ui.FieldType.CHECKBOX},
        {label: "sc", type: ui.FieldType.TEXT},
        {label: "customer", type: ui.FieldType.TEXT},
        {
            label: "customerid",
            type: ui.FieldType.TEXT,
            displayType: ui.FieldDisplayType.HIDDEN,
        },
        {label: "itemtext", type: ui.FieldType.TEXT},
        {
            label: "item",
            type: ui.FieldType.TEXT,
            displayType: ui.FieldDisplayType.HIDDEN,
        },
        {label: "area ha", type: ui.FieldType.FLOAT},
        {label: "area sqm", type: ui.FieldType.FLOAT},
        {label: "item fees", type: ui.FieldType.TEXT},
        {label: "unit", type: ui.FieldType.TEXT},
        {label: "base price per month", type: ui.FieldType.FLOAT},
        {label: "base price per days", type: ui.FieldType.FLOAT},
        {label: "hand over date", type: ui.FieldType.DATE},
        {label: "end date of month", type: ui.FieldType.DATE},
        {label: "lasted day", type: ui.FieldType.DATE},
        {
            label: "total number of days without full month",
            type: ui.FieldType.INTEGER,
        },
        {label: "amount of without full months", type: ui.FieldType.FLOAT},
        {label: "total full month", type: ui.FieldType.INTEGER},
        {label: "amount of full month", type: ui.FieldType.FLOAT},
        {label: "payment total", type: ui.FieldType.FLOAT},
        {label: "memo", type: ui.FieldType.TEXT},
        {label: "project name", type: ui.FieldType.TEXT},
        {label: "service contract", type: ui.FieldType.TEXT},
        {
            label: "servicecontractid",
            type: ui.FieldType.TEXT,
            displayType: ui.FieldDisplayType.HIDDEN,
        },
        {label: "description vn", type: ui.FieldType.TEXT},
        {label: "description eng", type: ui.FieldType.TEXT},
    ];

    const colGenerateLand = [
        {label: "checkbox", type: ui.FieldType.CHECKBOX},
        {label: "name", type: ui.FieldType.TEXT},
        {label: "subsidiary", type: ui.FieldType.TEXT},
        {
            label: "subsidiaryid",
            type: ui.FieldType.TEXT,
            displayType: ui.FieldDisplayType.HIDDEN,
        },
        {label: "item", type: ui.FieldType.TEXT},
        {
            label: "itemid",
            type: ui.FieldType.TEXT,
            displayType: ui.FieldDisplayType.HIDDEN,
        },
        {label: "area ha", type: ui.FieldType.FLOAT},
        {label: "area sqm", type: ui.FieldType.FLOAT},
        {label: "customer", type: ui.FieldType.TEXT},
        {
            label: "customerid",
            type: ui.FieldType.TEXT,
            displayType: ui.FieldDisplayType.HIDDEN,
        },
        {label: "handover date", type: ui.FieldType.DATE},
    ];
    const colDebitNote = [
        {label: "checkbox", type: ui.FieldType.CHECKBOX},
        {label: "subsidiary", type: ui.FieldType.TEXT},
        {
            label: "subsidiaryid",
            type: ui.FieldType.TEXT,
            displayType: ui.FieldDisplayType.HIDDEN,
        },
        {label: "service contract", type: ui.FieldType.TEXT},
        {
            label: "servicecontractid",
            type: ui.FieldType.TEXT,
            displayType: ui.FieldDisplayType.HIDDEN,
        },
        {label: "name", type: ui.FieldType.TEXT},
        {label: "customer", type: ui.FieldType.TEXT},
        {
            label: "customerid",
            type: ui.FieldType.TEXT,
            displayType: ui.FieldDisplayType.HIDDEN,
        },
        {label: "contact", type: ui.FieldType.TEXT},
        {
            label: "contactid",
            type: ui.FieldType.TEXT,
            displayType: ui.FieldDisplayType.HIDDEN,
        },
        {label: "memo", type: ui.FieldType.TEXT},
        {label: "memo eng", type: ui.FieldType.TEXT},
        {label: "term", type: ui.FieldType.TEXT},
        {label: "payment number", type: ui.FieldType.TEXT},
        {label: "currency", type: ui.FieldType.TEXT},
        {
            label: "currencyid",
            type: ui.FieldType.TEXT,
            displayType: ui.FieldDisplayType.HIDDEN,
        },
        {label: "amount net", type: ui.FieldType.FLOAT},
        {label: "tax amount", type: ui.FieldType.FLOAT},
        {label: "amount", type: ui.FieldType.FLOAT},
        {label: "paid amount", type: ui.FieldType.FLOAT},
        {label: "remaining amount", type: ui.FieldType.FLOAT},
        {label: "penalty rate", type: ui.FieldType.TEXT},
        {label: "penalty amount", type: ui.FieldType.FLOAT},
        {label: "overdue interest", type: ui.FieldType.TEXT},
        {label: "overdue amount", type: ui.FieldType.FLOAT},
    ];
    const colCashflow = [
        {label: "tenchitieu", type: ui.FieldType.TEXT},
        {label: "jan", type: ui.FieldType.FLOAT},
        {label: "feb", type: ui.FieldType.FLOAT},
        {label: "mar", type: ui.FieldType.FLOAT},
        {label: "apr", type: ui.FieldType.FLOAT},
        {label: "may", type: ui.FieldType.FLOAT},
        {label: "jun", type: ui.FieldType.FLOAT},
        {label: "jul", type: ui.FieldType.FLOAT},
        {label: "aug", type: ui.FieldType.FLOAT},
        {label: "sep", type: ui.FieldType.FLOAT},
        {label: "oct", type: ui.FieldType.FLOAT},
        {label: "nov", type: ui.FieldType.FLOAT},
        {label: "dec", type: ui.FieldType.FLOAT},
        // {label: "total", type: ui.FieldType.FLOAT},
    ];

    const colRevenues = [
        {label: "customer name", type: ui.FieldType.TEXT},
        {label: "land lot", type: ui.FieldType.TEXT},
        {label: "area", type: ui.FieldType.FLOAT},
        {label: "revenue", type: ui.FieldType.FLOAT},
        {
            label: "headerrow",
            type: ui.FieldType.TEXT,
            displayType: ui.FieldDisplayType.HIDDEN,
        },
    ];

    const colBudgetHistory = [
        {label: "dep", type: ui.FieldType.TEXT},
        {label: "budget code", type: ui.FieldType.TEXT},
        {label: "cumulative budget", type: ui.FieldType.CURRENCY},
        {label: "commitment budget", type: ui.FieldType.CURRENCY},
        {label: "actual commitment budget", type: ui.FieldType.CURRENCY},
        {label: "remaining budget to check", type: ui.FieldType.CURRENCY},
        {
            label: "level",
            type: ui.FieldType.TEXT,
            displayType: ui.FieldDisplayType.HIDDEN,
        },
    ];
    const colTVDT = [
        {label: "stt", type: ui.FieldType.CURRENCY},
        {label: "chi tieu", type: ui.FieldType.TEXT},
        {label: "thoi gian", type: ui.FieldType.FLOAT},
        {label: "thuc hien", type: ui.FieldType.FLOAT},
    ];

    function buildCalcLandCostSublist(form, length) {
        var searchSubList = form.addSublist({
            id: "search_sublist",
            type: ui.SublistType.LIST,
            label: `Results(${length})`,
        });
        searchSubList.addMarkAllButtons();
        // searchSubList.addRefreshButton();
        util.each(col, function (o, i) {
            var sublistField = searchSubList.addField({
                id: `c${i}`,
                type: o.type,
                label: o.label,
            });
            if (_.get(o, "displayType", "") != "")
                sublistField.updateDisplayType({displayType: o.displayType});
        });
        return searchSubList;
    }

    function buildGeneratePrincipalInterestSublist(form, length) {
        var searchSubList = form.addSublist({
            id: "search_sublist",
            type: ui.SublistType.LIST,
            label: `Results(${length})`,
        });
        // searchSubList.addMarkAllButtons();
        // searchSubList.addRefreshButton();
        util.each(colGeneratePrincipalInterest, function (o, i) {
            var sublistField = searchSubList.addField({
                id: `c${i}`,
                type: o.type,
                label: o.label,
            });
            if (_.get(o, "displayType", "") != "")
                sublistField.updateDisplayType({displayType: o.displayType});
        });
        return searchSubList;
    }

    function buildSublist(form, length, master) {
        var searchSubList = form.addSublist({
            id: "search_sublist",
            type: ui.SublistType.LIST,
            label: `Results(${length})`,
        });
        // searchSubList.addMarkAllButtons();
        // searchSubList.addRefreshButton();
        util.each(master, function (o, i) {
            var sublistField = searchSubList.addField({
                id: `c${i}`,
                type: o.type,
                label: o.label,
            });
            if (_.get(o, "displayType", "") != "")
                sublistField.updateDisplayType({displayType: o.displayType});
        });
        return searchSubList;
    }

    function buildSublist2(form, length, master, addMark) {
        var searchSubList = form.addSublist({
            id: "search_sublist",
            type: ui.SublistType.LIST,
            label: `Results(${length})`,
        });
        if (addMark) searchSubList.addMarkAllButtons();
        // searchSubList.addButton({id: 'custpage_export', label: 'Export', functionName: 'btExportCashflow'});
        // searchSubList.addRefreshButton();
        util.each(master, function (o, i) {
            var sublistField = searchSubList.addField({
                id: o.label.replace(/\s+/g, ""),
                type: o.type,
                label: o.label,
            });
            if (_.get(o, "displayType", "") != "")
                sublistField.updateDisplayType({displayType: o.displayType});
            if (_.get(o, "size", "") != "")
                sublistField.updateDisplaySize({height: 25, width: o.size});
        });
        return searchSubList;
    }

    /**
     *
     * @param options
     * @param options.search
     * @param options.subsidiary
     * @param options.project
     * @param options.item
     * @param options.fromdate
     * @param options.todate
     * @param options.postdate
     * @param options.memomain
     * @param options.memodiff
     * @return {*}
     */
    function buildCalcLandCostSublistData(options) {
        var ss1 = plib.searchLandItems(options);
        var ssLandCostPosted = plib.searchLandCostPosted({
            subsidiary: options.subsidiary,
            project: options.project,
        });
        var ss1Clone = _.clone(ss1);
        util.each(ss1Clone, function (o) {
            var findObj = _.find(ssLandCostPosted, {
                subsidiary: o.subsidiary,
                project: o.projectId,
                item: o.id,
            });
            if (!_.isEmpty(findObj)) {
                //found
                ss1 = _.reject(ss1, {
                    subsidiary: o.subsidiary,
                    projectId: o.projectId,
                    id: o.id,
                });
            }
        });
        var obj = _.clone(options);
        obj.item = [""];
        var ss1NonItemFilter = plib.searchLandItems(obj);
        // var ss2 = plib.searchProjectBudgetTracking(options);
        var ss2NoneDate = plib.searchProjectBudgetTracking(options);
        var ss3 = plib.searchProjectActualAmount(options);
        // log.audit('ss2', ss2);
        //Tinh sum sellable area sqm
        var ssMap = _.map(ss1, function (o) {
            var sumSellableArea = _.sumBy(
                _.filter(ss1NonItemFilter, {projectId: o.projectId}),
                "sellableArea"
            );
            var sumAmtYear = _.sumBy(
                _.filter(ss2NoneDate, {projectId: o.projectId}),
                "amtYear"
            );
            var rateBD = _.round(sumAmtYear / sumSellableArea, 2);
            var budgetCostTotal = clib.strip(rateBD * o.sellableArea);
            var sumAmount = _.sumBy(
                _.filter(ss3, {projectId: o.projectId}),
                "amount"
            );
            var rateActual = _.round(sumAmount / sumSellableArea, 2);
            var actualWIP = clib.strip(rateActual * o.sellableArea);
            return _.assign(o, {
                sumSellableArea: sumSellableArea,
                //Tinh sum amt.year
                sumAmtYear: sumAmtYear,
                rateBD: rateBD,
                budgetCostTotal: budgetCostTotal,
                sumAmount: sumAmount,
                rateActual: rateActual,
                actualWIP: actualWIP,
                accruedLost: budgetCostTotal - actualWIP,
                postdate: options.postdate,
                //(12)	Memo (main)	Lấy theo memo (main) ở parameter + (2)
                memomain: `${_.defaultTo(options.memomain, "")} ${o.name}`,
                //(13)	Memo (Diff)	Lấy theo memo (diff) ở parameter + (2)
                memodiff: `${_.defaultTo(options.memodiff, "")} ${o.name}`,
            });
        });
        return ssMap;
    }

    function getRateFromPaymentDate(loanInterest, paymentDatein, dateFormat) {
        var paymentDate = moment(paymentDatein, dateFormat).add(-1, "d");
        var rate = "";
        util.each(loanInterest, (o) => {
            if (
                moment(o.startdate, dateFormat) <= paymentDate &&
                paymentDate <= moment(o.enddate, dateFormat)
            ) {
                rate = clib.strip(o.rate * 100) + "%";
            }
        });
        return rate;
    }

    function getRateFromPaymentDate2(loanInterest, paymentDatein) {
        var dateFormat = slib.userPreferences().dateformat;
        // var paymentDatein= moment(paymentDatein, dateFormat).add(-1, 'd');
        var paymentDatein = moment(paymentDatein, dateFormat);
        var rate = "";
        util.each(loanInterest, (o) => {
            if (
                moment(o.startdate, dateFormat) <= paymentDatein &&
                paymentDatein <= moment(o.enddate, dateFormat)
            ) {
                rate = clib.strip(o.rate * 100) + "%";
            }
        });
        return rate;
    }

    function buildGeneratePrincipalInterestSublistData(options) {
        // var ssMap = plib.searchDebitLoan(options);
        var debitLoan = options.debitloan;
        if (util.isArray(debitLoan)) {
            debitLoan = _.head(options.debitloan);
        }
        var recDebitLoan = record.load({
            type: "customrecord_cseg_scv_loan",
            id: debitLoan,
        });
        var loanInterest = plib.queryDebitLoanInterest(debitLoan);
        var arrDebitLoan = [
            "name",
            "custrecord_scv_dl_paymentterm",
            "custrecord_scv_dl_inpaymentperiod",
            "custrecord_scv_dl_prinpayperiod",
            "custrecord_scv_inspaymentdate",
            "custrecord_scv_dl_prinpaydate",
            "custrecord_scv_dl_inpaymentterm",
            "custrecord_scv_disbursementdate",
            "custrecord_scv_dl_ratetype", // rate type
            "custrecord_scv_loanamt",
            "custrecord_scv_db_formula", //365 ngay mot nam
            "custrecord_scv_loa_currency",
        ];
        var objDebitLoan = {};
        _.map(arrDebitLoan, (o) => (objDebitLoan[o] = recDebitLoan.getValue(o)));
        var dateformat = slib.userPreferences().dateformat;

        //lk currency
        // var recdata = slib.getRecordData(record.Type.CURRENCY, objDebitLoan.custrecord_scv_loa_currency, '', ['currencyprecision'], []);
        // var currencyprecision = _.toNumber(recdata.body.currencyprecision);
        var currencyprecision = 0;
        var results = [];
        switch (objDebitLoan.custrecord_scv_dl_paymentterm) {
            case "1": //Monthly
                if (objDebitLoan.custrecord_scv_dl_ratetype == "2") {
                    //Base on OutStanding principal
                    //binding principal
                    for (
                        var i = 0;
                        i < objDebitLoan.custrecord_scv_dl_prinpayperiod;
                        i++
                    ) {
                        var o = {};
                        var paymentDate = moment(
                            objDebitLoan.custrecord_scv_dl_prinpaydate,
                            dateformat
                        )
                            .add(1 * (i + 1), "M")
                            .format(dateformat);
                        var addM = moment(paymentDate, dateformat).format("MM");
                        var addY = moment(paymentDate, dateformat).format("YYYY");
                        o.c0 = `Principal ${objDebitLoan.name} - ${addM}.${addY}`;
                        o.c1 = objDebitLoan.name;
                        o.c2 = "Principal";
                        o.c3 = paymentDate;
                        o.c4 = "";
                        o.c5 = _.round(
                            objDebitLoan.custrecord_scv_loanamt /
                            objDebitLoan.custrecord_scv_dl_prinpayperiod,
                            currencyprecision
                        ).toFixed(currencyprecision);
                        o.c6 = "Open";
                        o.debitloan = debitLoan;
                        o.type = "1"; //principal
                        results.push(o);
                    }
                    //binding interest
                    var lastPaymentDate = objDebitLoan.custrecord_scv_inspaymentdate;
                    var lastPayment = objDebitLoan.custrecord_scv_loanamt;
                    var amountBalance =
                        objDebitLoan.custrecord_scv_loanamt /
                        objDebitLoan.custrecord_scv_dl_inpaymentperiod;
                    for (
                        var i = 1;
                        i <= objDebitLoan.custrecord_scv_dl_inpaymentperiod;
                        i++
                    ) {
                        var o = {};
                        var paymentDate = moment(lastPaymentDate, dateformat)
                            .add(1, "M")
                            .format(dateformat);
                        var addM = moment(paymentDate, dateformat).format("MM");
                        var addY = moment(paymentDate, dateformat).format("YYYY");
                        o.c0 = `Interest ${objDebitLoan.name} - ${addM}.${addY}`;
                        o.c1 = objDebitLoan.name;
                        o.c2 = "Interest";
                        o.c3 = paymentDate;
                        var rate = getRateFromPaymentDate(
                            loanInterest,
                            paymentDate,
                            dateformat
                        ); //rate
                        var rateNum =
                            _.chain(rate).replace("%", "").toNumber().value() / 100;
                        var dateDiff = moment(paymentDate, dateformat).diff(
                            moment(lastPaymentDate, dateformat),
                            "days"
                        );
                        o.c4 = rate;
                        o.c5 =
                            lastPayment *
                            (rateNum / objDebitLoan.custrecord_scv_db_formula) *
                            dateDiff; // amount = 1.000.000.000*(10%/365)*31ngay
                        o.c5 = _.round(o.c5).toFixed(0);
                        o.c6 = "Open";
                        o.debitloan = debitLoan;
                        o.type = "2"; //interest
                        results.push(o);
                        lastPayment = lastPayment - amountBalance;
                        lastPaymentDate = paymentDate;
                    }
                } else if (objDebitLoan.custrecord_scv_dl_ratetype == "1") {
                    //Base on Principal
                    //binding principal
                    for (
                        var i = 0;
                        i < objDebitLoan.custrecord_scv_dl_prinpayperiod;
                        i++
                    ) {
                        var o = {};
                        var paymentDate = moment(
                            objDebitLoan.custrecord_scv_dl_prinpaydate,
                            dateformat
                        )
                            .add(1 * (i + 1), "M")
                            .format(dateformat);
                        var addM = moment(paymentDate, dateformat).format("MM");
                        var addY = moment(paymentDate, dateformat).format("YYYY");
                        o.c0 = `Principal ${objDebitLoan.name} - ${addM}.${addY}`;
                        o.c1 = objDebitLoan.name;
                        o.c2 = "Principal";
                        o.c3 = paymentDate;
                        o.c4 = "";
                        o.c5 = _.round(
                            objDebitLoan.custrecord_scv_loanamt /
                            objDebitLoan.custrecord_scv_dl_prinpayperiod,
                            currencyprecision
                        ).toFixed(currencyprecision);
                        o.c6 = "Open";
                        o.debitloan = debitLoan;
                        o.type = "1";
                        results.push(o);
                    }
                    //binding interest
                    var lastPaymentDate = objDebitLoan.custrecord_scv_inspaymentdate;
                    // var lastPayment = objDebitLoan.custrecord_scv_loanamt;
                    var amountBalance =
                        objDebitLoan.custrecord_scv_loanamt /
                        objDebitLoan.custrecord_scv_dl_inpaymentperiod;
                    for (
                        var i = 1;
                        i <= objDebitLoan.custrecord_scv_dl_inpaymentperiod;
                        i++
                    ) {
                        var o = {};
                        // lastPayment = lastPayment - amountBalance;
                        var paymentDate = moment(lastPaymentDate, dateformat)
                            .add(1, "M")
                            .format(dateformat);
                        var addM = moment(paymentDate, dateformat).format("MM");
                        var addY = moment(paymentDate, dateformat).format("YYYY");
                        o.c0 = `Interest ${objDebitLoan.name} - ${addM}.${addY}`;
                        o.c1 = objDebitLoan.name;
                        o.c2 = "Interest";
                        o.c3 = paymentDate;
                        var rate = getRateFromPaymentDate(
                            loanInterest,
                            paymentDate,
                            dateformat
                        ); //rate
                        var rateNum =
                            _.chain(rate).replace("%", "").toNumber().value() / 100;
                        o.c4 = rate;
                        var dateDiff = moment(paymentDate, dateformat).diff(
                            moment(lastPaymentDate, dateformat),
                            "days"
                        );
                        o.c5 =
                            objDebitLoan.custrecord_scv_loanamt *
                            (rateNum / objDebitLoan.custrecord_scv_db_formula) *
                            dateDiff; // amount = 1.000.000.000*(10%/365)*31ngay
                        o.c5 = _.round(o.c5).toFixed(0);
                        o.c6 = "Open";
                        o.debitloan = debitLoan;
                        o.type = "2";
                        results.push(o);
                        lastPaymentDate = paymentDate;
                    }
                }
                break;
            case "2": //Quaterly
                //binding principal
                for (var i = 0; i < objDebitLoan.custrecord_scv_dl_prinpayperiod; i++) {
                    var o = {};
                    var paymentDate = moment(
                        objDebitLoan.custrecord_scv_dl_prinpaydate,
                        dateformat
                    )
                        .add(3 * i, "M")
                        .format(dateformat);
                    o.c0 = `Principal ${objDebitLoan.name}`;
                    o.c1 = objDebitLoan.name;
                    o.c2 = "Principal";
                    o.c3 = paymentDate;
                    o.c4 = "";
                    o.c6 = "Open";
                    results.push(o);
                }
                //binding interest
                for (
                    var i = 0;
                    i < objDebitLoan.custrecord_scv_dl_inpaymentperiod;
                    i++
                ) {
                    var o = {};
                    var paymentDate = moment(
                        objDebitLoan.custrecord_scv_inspaymentdate,
                        dateformat
                    )
                        .add(3 * i, "M")
                        .format(dateformat);
                    o.c0 = `Interest ${objDebitLoan.name}`;
                    o.c1 = objDebitLoan.name;
                    o.c2 = "Interest";
                    o.c3 = paymentDate;
                    o.c4 = "10%";
                    o.c6 = "Open";
                    results.push(o);
                }
                break;
            case "3": //Yearly
                //binding principal
                for (var i = 0; i < objDebitLoan.custrecord_scv_dl_prinpayperiod; i++) {
                    var o = {};
                    var paymentDate = moment(
                        objDebitLoan.custrecord_scv_dl_prinpaydate,
                        dateformat
                    )
                        .add(12 * i, "M")
                        .format(dateformat);
                    o.c0 = `Principal ${objDebitLoan.name}`;
                    o.c1 = objDebitLoan.name;
                    o.c2 = "Principal";
                    o.c3 = paymentDate;
                    o.c4 = "";
                    o.c6 = "Open";
                    results.push(o);
                }
                //binding interest
                for (
                    var i = 0;
                    i < objDebitLoan.custrecord_scv_dl_inpaymentperiod;
                    i++
                ) {
                    var o = {};
                    var paymentDate = moment(
                        objDebitLoan.custrecord_scv_inspaymentdate,
                        dateformat
                    )
                        .add(12 * i, "M")
                        .format(dateformat);
                    o.c0 = `Interest ${objDebitLoan.name}`;
                    o.c1 = objDebitLoan.name;
                    o.c2 = "Interest";
                    o.c3 = paymentDate;
                    o.c4 = "10%";
                    o.c6 = "Open";
                    results.push(o);
                }
                break;
            case "4": //Other
                if (objDebitLoan.custrecord_scv_dl_ratetype == "3") {
                    //Base on principal detail
                    //binding principal
                    for (
                        var i = 0;
                        i < objDebitLoan.custrecord_scv_dl_prinpayperiod;
                        i++
                    ) {
                        var o = {};
                        var paymentDate = moment(
                            objDebitLoan.custrecord_scv_dl_prinpaydate,
                            dateformat
                        )
                            .add(1 * (i + 1), "M")
                            .format(dateformat);
                        var addM = moment(paymentDate, dateformat).format("MM");
                        var addY = moment(paymentDate, dateformat).format("YYYY");
                        o.c0 = `Principal ${objDebitLoan.name} - ${addM}.${addY}`;
                        o.c1 = objDebitLoan.name;
                        o.c2 = "Principal";
                        o.c3 = paymentDate;
                        o.c4 = "";
                        o.c5 = _.round(
                            objDebitLoan.custrecord_scv_loanamt /
                            objDebitLoan.custrecord_scv_dl_prinpayperiod,
                            currencyprecision
                        ).toFixed(currencyprecision);
                        o.c6 = "Open";
                        o.debitloan = debitLoan;
                        o.type = "1";
                        results.push(o);
                    }
                    //binding interest
                    // var principalDetail = plib.searchPrincipalDetail({});
                    var principalDetail = plib.queryPrincipalDetail(debitLoan);
                    var lastPaymentDate = objDebitLoan.custrecord_scv_inspaymentdate;
                    var disbursementdate = objDebitLoan.custrecord_scv_disbursementdate;
                    var lastPayment = objDebitLoan.custrecord_scv_loanamt;
                    var loanAmt = objDebitLoan.custrecord_scv_loanamt;
                    for (
                        var i = 1;
                        i <= objDebitLoan.custrecord_scv_dl_inpaymentperiod;
                        i++
                    ) {
                        var o = {};
                        var paymentDate = moment(lastPaymentDate, dateformat)
                            .add(1, "M")
                            .format(dateformat);
                        //check if ngay khoi tao la ngay cuoi thang
                        if (
                            lastPaymentDate ==
                            moment(lastPaymentDate, dateformat)
                                .endOf("month")
                                .format(dateformat)
                        ) {
                            paymentDate = moment(paymentDate, dateformat)
                                .endOf("month")
                                .format(dateformat);
                        }
                        if (i == 1) {
                            paymentDate = moment(lastPaymentDate).format(dateformat);
                        }
                        var addM = moment(paymentDate, dateformat).format("MM");
                        var addY = moment(paymentDate, dateformat).format("YYYY");
                        o.c0 = `Interest ${objDebitLoan.name} - ${addM}.${addY}`;
                        o.c1 = objDebitLoan.name;
                        o.c2 = "Interest";
                        o.c3 = paymentDate;
                        var rate = getRateFromPaymentDate(
                            loanInterest,
                            paymentDate,
                            dateformat
                        ); //rate
                        var rateNum =
                            _.chain(rate).replace("%", "").toNumber().value() / 100;
                        o.c4 = rate;
                        var dateDiff = moment(paymentDate, dateformat).diff(
                            moment(lastPaymentDate, dateformat),
                            "days"
                        );
                        if (i == 1)
                            dateDiff =
                                moment(paymentDate, dateformat).diff(
                                    moment(disbursementdate, dateformat),
                                    "days"
                                ) + 1;
                        o.c5 =
                            loanAmt *
                            (rateNum / objDebitLoan.custrecord_scv_db_formula) *
                            dateDiff; // amount = 1.000.000.000*(10%/365)*31ngay
                        o.c5 = _.round(o.c5, currencyprecision).toFixed(currencyprecision);
                        o.c6 = "Open";
                        o.debitloan = debitLoan;
                        o.type = "2"; //interest
                        o.loanAmt = loanAmt;
                        results.push(o);
                        lastPaymentDate = paymentDate;
                    }
                    _.map(principalDetail, function (o) {
                        var addM = moment(o.paymentdate, dateformat).format("MM");
                        var addY = moment(o.paymentdate, dateformat).format("YYYY");
                        var rate = getRateFromPaymentDate(
                            loanInterest,
                            o.paymentdate,
                            dateformat
                        ); //rate
                        results.push({
                            c0: `Interest ${objDebitLoan.name} - ${addM}.${addY}`,
                            c1: objDebitLoan.name,
                            c2: "Interest",
                            c3: o.paymentdate,
                            c4: rate,
                            c5: "",
                            c6: "Open",
                            debitloan: debitLoan,
                            type: "2",
                            loanAmt: loanAmt,
                        });
                        results.push({
                            c0: `Principal ${objDebitLoan.name} - ${addM}.${addY}`,
                            c1: objDebitLoan.name,
                            c2: "Principal",
                            c3: o.paymentdate,
                            c4: "",
                            c5: o.amount,
                            c6: "Open",
                            debitloan: debitLoan,
                            type: "2",
                            loanAmt: loanAmt,
                        });
                    });
                    //sort
                    results = _.sortBy(results, function (o) {
                        return moment(o.c3, dateformat).format("YYYYMMDD");
                    });
                    //recalc principal loan
                    var loanAmtChange = loanAmt;
                    util.each(results, function (o) {
                        o.loanAmt = loanAmtChange;
                        var findPayment = _.find(principalDetail, {
                            paymentdate: o.c3,
                            amount: o.c5,
                        });
                        if (!_.isEmpty(findPayment)) loanAmtChange -= o.c5;
                    });
                    //recals amount
                    util.each(results, function (o, i) {
                        if (clib.isEmpty(o.c4)) return true;
                        var dateDiff = moment(o.c3, dateformat).diff(
                            moment(lastPaymentDate, dateformat),
                            "days"
                        );
                        if (i == 0)
                            dateDiff =
                                moment(o.c3, dateformat).diff(
                                    moment(disbursementdate, dateformat),
                                    "days"
                                ) + 1;
                        var rateNum =
                            _.chain(o.c4).replace("%", "").toNumber().value() / 100;
                        o.c5 =
                            o.loanAmt *
                            (rateNum / objDebitLoan.custrecord_scv_db_formula) *
                            dateDiff; // amount = 1.000.000.000*(10%/365)*31ngay
                        o.c5 = _.round(o.c5, currencyprecision).toFixed(currencyprecision);
                        lastPaymentDate = o.c3;
                    });
                }
                break;
        }
        return results;
    }

    return {onRequest};
});
