/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

define(['N/url', 'N/ui/serverWidget', "N/search", "N/redirect", "N/cache", "N/ui/message", "N/task"], function (url, ui, search, redirect, cache, message, task) {

    const objSavedSearch = {
        PRINCIAL_INTEREST_SPREADSHEET: "customsearch_scv_loanandinterestsheet_v2",
        ACCOUNTING_SETUP: "customsearch_scv_ss_loa_accounting_setup",
    };
    const FLAG_SEARCH = "1";
    const NAME_CACHE = "createJournalEntry";

    const onRequest = scriptContext => {
        try {
            if (scriptContext.request.method === "GET") {
                doGetForm(scriptContext);
            } else if (scriptContext.request.method === "POST") {
                doPostForm(scriptContext);
            }
        } catch (err) {
            log.error("Error on Request", err);
        }
    }

    const doGetForm = scriptContext => {
        let {
            search_params,
            subsidiary,
            fromDate,
            toDate,
            mrTaskId
        } = scriptContext.request.parameters;

        let myCache = cache.getCache({name: NAME_CACHE, scope: cache.Scope.PUBLIC});
        if (!validValue(mrTaskId)) mrTaskId = myCache.get({key: "mrTaskId", loader: 'loader'});
        let isComplete = true;
        let messageInfo = "";
        if (validValue(mrTaskId)) {
            const taskStatus = task.checkStatus(mrTaskId);
            const status = taskStatus.status;
            messageInfo = `TaskId ${mrTaskId} for Create Journal Entry is: ${status}`;
            if (status === 'COMPLETE' || status === 'FAILED') {
                myCache.remove({key: 'mrTaskId'});
            }
        }
        const arrColsSublist = getArrColsSublist();
        let form = ui.createForm("GHI NHẬN BÚT TOÁN TRÍCH LÃI");
        form.clientScriptModulePath = "../cs/scv_cs_sl_create_journals.js";
        if (validValue(messageInfo)) form.addPageInitMessage({
            type: message.Type.INFORMATION,
            message: messageInfo,
            duration: -1
        });
        form.addButton({
            id: "custpage_scv_btnsearch",
            label: isComplete ? "Search" : "Refresh",
            functionName: "btnSearch"
        });
        form.addSubmitButton({label: "Create"});
        form.addFieldGroup({id: "custpage_main", label: "Main"});
        form.addField({
            id: "custpage_scv_subsidiary",
            label: "Đơn vị",
            type: "Select",
            container: "custpage_main",
            source: "subsidiary"
        });
        form.addField({
            id: "custpage_scv_fromdate",
            label: "Từ ngày",
            type: "Date",
            container: "custpage_main",
        }).updateLayoutType({layoutType: "STARTROW"});
        form.addField({
            id: "custpage_scv_todate",
            label: "Đến ngày",
            type: "Date",
            container: "custpage_main",
        }).updateLayoutType({layoutType: "ENDROW"});
        form.getField("custpage_scv_subsidiary").isMandatory = true;
        form.getField("custpage_scv_fromdate").isMandatory = true;
        form.getField("custpage_scv_todate").isMandatory = true;

        let filters = [];
        if (validValue(subsidiary)) {
            filters.push(search.createFilter({
                name: "custrecord_scv_db_subsidiary",
                join: "custrecord_scv_db_sheet",
                operator: search.Operator.ANYOF,
                values: subsidiary
            }));
            form.getField("custpage_scv_subsidiary").defaultValue = subsidiary;
        }

        if (validValue(fromDate) && validValue(toDate)) {
            filters.push(search.createFilter({name: "custrecord_scv_dbsheet_paymentdate", operator: search.Operator.WITHIN, values: [fromDate, toDate]}));
            form.getField("custpage_scv_fromdate").defaultValue = fromDate;
            form.getField("custpage_scv_todate").defaultValue = toDate;
        }

        let sublist = form.addSublist({id: "custpage_scv_sublist", type: "LIST", label: "Result"});
        arrColsSublist.forEach(o => {
            let fieldObj = {id: o.id, type: o.type, label: o.label};
            (o.hasOwnProperty("source")) ? fieldObj.source = o.source : "";
            let f = sublist.addField(fieldObj);
            (o.hasOwnProperty("display")) ? f.updateDisplayType({displayType: o.display}) : "";
        });
        if (search_params === FLAG_SEARCH) {
            const arrData = getDataSavedSearchPrincipalInterestSpreadsheet(filters);
            const lenCols = arrColsSublist.length;
            const len = arrData.length;
            for (let i = 0; i < len; i++) {
                const obj = arrData[i];
                for (let j = 0; j < lenCols; j++) {
                    const objCol = arrColsSublist[j];
                    if (!validValue(obj[objCol.col])) continue;
                    sublist.setSublistValue({id: objCol.id, line: i, value: obj[objCol.col]});
                }
            }
        }
        scriptContext.response.writePage(form);
    };
    const doPostForm = scriptContext => {
        const {custpage_scv_subsidiary, custpage_scv_fromdate, custpage_scv_todate} = scriptContext.request.parameters;
        let myCache = cache.getCache({name: NAME_CACHE, scope: cache.Scope.PUBLIC});
        let mrTaskId;
        let mrTask = task.create({
            taskType: task.TaskType.MAP_REDUCE,
            scriptId: "customscript_scv_mr_create_journals",
            deploymentId: "customdeploy_scv_mr_create_journals",
        });
        mrTask.params = {
            custscript_scv_mr_subsidiary: custpage_scv_subsidiary,
            custscript_scv_mr_fromdate: custpage_scv_fromdate,
            custscript_scv_mr_todate: custpage_scv_todate,
        };
        mrTaskId = mrTask.submit();
        myCache.put({key: 'mrTaskId', value: mrTaskId});
        redirect.toSuitelet({
            scriptId: "customscript_scv_sl_create_journals",
            deploymentId: "customdeploy_scv_sl_create_journals",
            parameters: {
                mrTaskId: mrTaskId,
                subsidiary: custpage_scv_subsidiary,
                fromDate: custpage_scv_fromdate,
                toDate: custpage_scv_todate
            }
        });
    };
    const getDataSavedSearchPrincipalInterestSpreadsheet = (filters) => {
        const objSearch = search.load({id: objSavedSearch.PRINCIAL_INTEREST_SPREADSHEET});
        filters.forEach(filter => objSearch.filters.push(filter));
        const pageData = objSearch.runPaged({pageSize: 1000});
        const pageRange = pageData.pageRanges;
        const lengthPage = pageRange.length;
        const columnsSS = pageData.searchDefinition.columns;
        let results = [];
        for (let i = 0; i < lengthPage; i++) {
            let theFetchData = pageData.fetch({index: i});
            theFetchData.data.forEach((result, _) => {
                results.push({
                    id: result.id,
                    name: result.getValue(columnsSS[0]),
                    loa: result.getValue(columnsSS[1]),
                    type: result.getValue(columnsSS[2]),
                    date: result.getValue(columnsSS[3]),
                    rate: result.getValue(columnsSS[4])*1,
                    amount: result.getValue(columnsSS[5])*1,
                    status: result.getValue(columnsSS[6]),
                    documentNumber: result.getValue(columnsSS[7]),
                    subsidiary: result.getValue(columnsSS[8]),
                    currency: result.getValue(columnsSS[9])
                });
            })
        }
        return results;
    };

    const getArrColsSublist = () => {
        return [
            {id: "col_id", label: "Internal", type: "TEXT", col: "id", display: "Hidden"},
            {id: "col_name", label: "Tên", type: "TEXT", col: "name"},
            {
                id: "col_loa",
                label: "Hợp đồng/Khế ước",
                type: "SELECT",
                source: "customrecord_cseg_scv_loan",
                col: "loa",
                display: "Inline"
            },
            {
                id: "col_type",
                label: "Loại",
                type: "SELECT",
                source: "customlist_scv_dc_sheet_type",
                col: "type",
                display: "Inline"
            },
            {id: "col_date", label: "Ngày", type: "DATE", col: "date"},
            {id: "col_interest", label: "Lãi suất", type: "TEXT", col: "rate"},
            {id: "col_amount", label: "Số tiền", type: "FLOAT", col: "amount"},
            {
                id: "col_status",
                label: "Trạng thái",
                type: "SELECT",
                source: "customlist_scv_sheet_status",
                col: "status",
                display: "Inline"
            },
            {
                id: "col_subsidiary",
                label: "Subsidiary",
                type: "SELECT",
                source: "subsidiary",
                col: "subsidiary",
                display: "Hidden"
            },
            {
                id: "col_currency",
                label: "Currency",
                type: "SELECT",
                source: "currency",
                col: "currency",
                display: "Hidden"
            }
        ];
    }
    const validValue = value => value !== undefined && value !== null && value !== '';


    return {
        onRequest
    }
});