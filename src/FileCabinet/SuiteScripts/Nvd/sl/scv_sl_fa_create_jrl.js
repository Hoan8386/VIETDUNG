/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
//nvl({line.cseg_scv_sg_proj.custrecord_scv_project_acc_asset.id},{custrecord_scv_project_acc_asset.id})
define(
    [
        "N/ui/serverWidget",
        "N/search",
        "N/runtime",
        "N/record",
        'N/redirect',
        'N/task',
        'N/cache',
        'N/ui/message',
        '../lib/scv_lib_function',
        '../olib/alasql/alasql.min@1.7.3'
    ],
    function (ui, search, runtime, record, redirect, task, cache, message, libFn, alasql) {
        const CustomDataConfig = {
            TITLE: 'Tăng TSCD - CCDC',
            SS: {
                DOC_CREATE_ASSET: 'customsearch_scv_hinhthanhts_ccdc',
                DOC_RATE_FIX_ASSET: 'customsearch_scv_danhgia_tscd',
                RESULT_LIST_JRL : 'customsearch_scv_ss_fa_create_jrl',
            },
            SUBLIST: {
                ID: 'custpage_scv_sublist',
                NAME: 'Results'
            }
        };
        const MAX_LINE_SELECTED_CREATE_FROM_SUITELET = 25;
        const CustomCategory = {
            CREATE: {ID: '1', NAME: 'Tạo mới'},
            ADJUSTMENT: {ID: '2', NAME: 'Điều chỉnh'}
        };
        /*const CustomAccount = {
            TK_CHUNG_GIAN: '238'
        };*/

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
            let dataConfig = getDataConfig(objParams);
            if (objParams.isSearch === 'T') Object.assign(objData, handleData(objParams));
            const {form, sublist} = onCreateForm(objParams, dataConfig);
            showInformationMapReduce(form, getCache(), objParams);
            if (objParams.isSearch === 'T') buildSublist(sublist, objParams.pCategory, objData?.arrDataRows || []);
            form.clientScriptModulePath = "../cs/scv_cs_sl_fa_create_jrl.js";
            response.writePage(form);
        }

        const setObjectParamsInit = (objParams, params) => {
            let {
                pSubsidiary,
                pCategory,
                pProject,
                pFromDate,
                pToDate,
                pAsset,
                isSearch,
                isRun
            } = params;
            if (!pSubsidiary) pSubsidiary = runtime.getCurrentUser().subsidiary.toString();
            Object.assign(objParams, {
                pSubsidiary,
                pCategory,
                pProject,
                pFromDate,
                pToDate,
                pAsset,
                isRun,
                isSearch
            });
        }

        const buildSublist = (sublist, categoryId, arrDataRows) => {
            const colsSublist = getColsSublist(categoryId);
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
            let objParams = Object.create(null);
            setObjectParamsInit(objParams, {
                pSubsidiary: request.parameters.custpage_scv_subsidiary,
                pCategory: request.parameters.custpage_scv_category,
                pProject: request.parameters.custpage_scv_project,
                pFromDate: request.parameters.custpage_scv_fromdate,
                pToDate: request.parameters.custpage_scv_todate,
                pAsset: request.parameters.custpage_scv_asset
            });
            let dataSelected = getDataSelected(request, objParams.pCategory);
            let dataJRLs = getDataCreateJRL(dataSelected, objParams);
            let mrTaskId;
            const sizeDataSelected = dataSelected.length;
            let isCreateFromSL = 'F';
            if (sizeDataSelected <= MAX_LINE_SELECTED_CREATE_FROM_SUITELET) {
                isCreateFromSL = 'T';
                createMultiJournalEntry(dataJRLs);
            } else {
                mrTaskId = submitTask(dataJRLs);
            }
            redirect.toSuitelet({
                scriptId: runtime.getCurrentScript().id,
                deploymentId: runtime.getCurrentScript().deploymentId,
                parameters: {mrTaskId, ...objParams, isCreateFromSL : 'T'}
            });

        };

        const submitTask = (data) => {
            let myCache = getCache();
            let mrTask = task.create({
                taskType: task.TaskType.MAP_REDUCE,
                scriptId: "customscript_scv_mr_fa_create_jrl",
                deploymentId: "customdeploy_scv_mr_fa_create_jrl",
            });
            mrTask.params = {
                custscript_mr_adj_sales_cont_jsondata: ''
            };
            myCache.put({key: 'jsondata', value: JSON.stringify(data)});
            let mrTaskId = mrTask.submit();
            myCache.put({key: 'mrTaskId', value: mrTaskId});
            return mrTaskId;
        }

        const showInformationMapReduce = (form, myCache, params) => {
            let mrTaskId = params.mrTaskId;
            if (isValid(mrTaskId) === false) mrTaskId = myCache.get({key: 'mrTaskId', loader: 'loader'});
            let messageInfo = '';
            let iscomplete = false;
            if (isValid(mrTaskId)) {
                let taskStatus = task.checkStatus(mrTaskId);
                messageInfo = 'Creating Journal Entry ! '+ ' : ' + taskStatus.status;
                if (taskStatus.status === 'COMPLETE') {
                    myCache.remove({key: 'mrTaskId'});
                    iscomplete = true;
                } else {
                    iscomplete = false;
                }
            }
            if (iscomplete) {
                const urlSavedSearchResult = `/app/common/search/searchresults.nl?searchtype=Transaction&Transaction_CREATEDBY=${runtime.getCurrentUser().id}&style=NORMAL&report=&grid=&searchid=${CustomDataConfig.SS.RESULT_LIST_JRL}&whence=`;
                const htmlContentLink = `<a href="${urlSavedSearchResult}" target="_new">View!</a>`;
                messageInfo = "List Journal Entry " + ": " + htmlContentLink;
            }
            if (isValid(messageInfo)) {
                form.addPageInitMessage({type: message.Type.INFORMATION, message: messageInfo, duration: -1});
            }
        }

        const getCache = () => cache.getCache({name: 'createFixedAsset', scope: cache.Scope.PUBLIC});

        const getDataCreateJRL = (dataSelected, objParams) => {
            let categoryId = objParams.pCategory;
            let objDataGroupByProject = libFn.groupArrayData(dataSelected, ['projectId']);
            const arrProjectId = Object.keys(objDataGroupByProject);
            let arrDataAccountAssetId = categoryId === CustomCategory.CREATE.ID ? getAccountAssetOnProject(arrProjectId.filter(o => !!o)) : [];
            const numProjs = arrProjectId.length;
            let arrData = [];
            for (let i = 0; i < numProjs; i++) {
                const projId = arrProjectId[i];
                const dataJRL = objDataGroupByProject[projId];
                const arrTrans = alasql('SELECT transId, transType FROM ? GROUP BY transId, transType', [dataJRL]);
                const arrIdTrans = arrTrans.map(o => o.transId);
                const projectDisplay = dataJRL[0]?.projectDisplay || '';
                const projectCode = dataJRL[0]?.projectCode || '';
                let objBody = {
                    subsidiary: objParams.pSubsidiary,
                    memo: projectDisplay,
                    custbody_scv_fixed_asset_code: projectCode,
                    cseg_scv_sg_proj: projId,
                    custbody_scv_fam_document: arrIdTrans,
                };
                let arrDataLine = [];
                if ( categoryId === CustomCategory.CREATE.ID ) {
                    let amountTotal = alasql('SELECT SUM(amount*1) AS amount FROM ?', [dataJRL])?.[0]?.amount || 0;
                    let accountDebit = arrDataAccountAssetId.find(o => o.id == projId)?.acc_asset_id || '';
                    let arrDataAccountCredit = alasql('SELECT accountId, assetId, SUM(amount*1) AS amount FROM ? GROUP BY accountId, assetId', [dataJRL]);
                    arrDataLine.push({isDebit: 'T', account: accountDebit, amount: amountTotal, memo: projectDisplay});
                    let sizeData = arrDataAccountCredit.length;
                    for (let j = 0; j < sizeData; j++) {
                        arrDataLine.push({
                            isDebit: 'F',
                            isCredit: 'T',
                            account: arrDataAccountCredit[j].accountId,
                            amount: arrDataAccountCredit[j].amount,
                            memo: projectDisplay
                        });
                    }
                }
                else {
                    let objDataLineByAccountAndAsset = libFn.groupArrayData(dataSelected, ['accountId', 'assetId']);
                    let arrDataCoupleAccountAsset = Object.keys(objDataLineByAccountAndAsset);
                    const sizeDataLine = arrDataCoupleAccountAsset.length;
                    for (let j = 0; j < sizeDataLine; j++) {
                        let assetIdAndAccountId = arrDataCoupleAccountAsset[j];
                        let arrDataAccountCredit = objDataLineByAccountAndAsset[assetIdAndAccountId];
                        let amount = alasql('SELECT SUM(amount*1) AS amount FROM ?', [arrDataAccountCredit])?.[0]?.amount || 0;
                        let accountDebit = arrDataAccountCredit[0].writeDownAccountId;
                        arrDataLine.push({isDebit: 'T', account: accountDebit, amount: amount, memo: projectDisplay});
                        const sizeLineCredit = arrDataAccountCredit.length;
                        for (let k = 0; k < sizeLineCredit; k++) {
                            arrDataLine.push({
                                isDebit: 'F',
                                isCredit: 'T',
                                account: arrDataAccountCredit[j].accountId,
                                amount: arrDataAccountCredit[j].amount,
                                assetId: arrDataAccountCredit[j].assetId,
                                memo: projectDisplay
                            });
                        }
                    }
                }

                arrData.push({
                    arrTrans: arrTrans,
                    body: objBody,
                    line: arrDataLine
                });
            }
            return arrData;
        }

        const createMultiJournalEntry = data => {
            let sizeData = data.length;
            for (let i = 0; i < sizeData; i++) {
                let idJrl = createJournalEntry(data[i]);
                if (idJrl) {
                    setJRLCreateByTrans(data[i].arrTrans, idJrl);
                }
            }
        }

        const setJRLCreateByTrans = (arrTrans, idJRL) => {
            if (arrTrans.length === 0) return;
            let numTrans = arrTrans.length;
            for (let i = 0; i < numTrans; i++) {
                let o = arrTrans[i];
                record.submitFields({
                    type: o.transType,
                    id: o.transId,
                    values: {
                        custbody_scv_fam_document : [idJRL]
                    },
                    options: {
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    }
                });
            }
        }

        const createJournalEntry = (objData) => {
            let objBody = objData.body;
            let arrDataLine = objData.line;
            let curJRL = record.create({type: 'journalentry', isDynamic: true});
            libFn.setValueData(curJRL, [
                'subsidiary',
                'memo',
                'cseg_scv_sg_proj',
                'custbody_scv_fixed_asset_code',
                'custbody_scv_fam_document'
            ], [
                objBody.subsidiary,
                objBody.memo,
                objBody.cseg_scv_sg_proj,
                objBody.custbody_scv_fixed_asset_code,
                objBody.custbody_scv_fam_document
            ]);
            let lc = arrDataLine.length;
            for (let i = 0; i < lc; i++) {
                let objLine = arrDataLine[i];
                const fldIdAmount = objLine.isDebit === 'T' ? 'debit' : 'credit';
                insertLineJRL(curJRL, fldIdAmount, {
                    account: objLine.account,
                    amount: objLine.amount,
                    memo: objLine.memo,
                    assetId: objLine.assetId
                });
            }
            try {
                return curJRL.save({ignoreMandatoryFields: true});
            } catch (e) {
                log.error('Error createJournalEntry', e);
                log.error('Error_Data_JRL : ', objData);
                return null;
            }
        }


        const insertLineJRL = (curJrl, fldIdAmount, objData) => {
            curJrl.selectNewLine({sublistId: 'line'});
            curJrl.setCurrentSublistValue({sublistId: 'line', fieldId: 'account', value: objData.account});
            curJrl.setCurrentSublistValue({sublistId: 'line', fieldId: fldIdAmount, value: objData.amount});
            curJrl.setCurrentSublistValue({sublistId: 'line', fieldId: 'memo', value: objData.memo});
            if (objData?.assetId) curJrl.setCurrentSublistValue({sublistId: 'line', fieldId: 'custcol_far_trn_relatedasset', value: objData.assetId});
            // curJrl.setCurrentSublistValue({sublistId: 'line', fieldId: 'entity', value: entityId});
            curJrl.commitLine({sublistId: 'line'});
        }

        const getDataSelected = (request, categoryId) => {
            const idSL = CustomDataConfig.SUBLIST.ID;
            const lc = request.getLineCount({group: idSL});
            let arrCols = getColsSublist(categoryId);
            const numCols = arrCols.length;
            let arrData = [];
            for (let i = 0; i < lc; i++) {
                const mark = request.getSublistValue({group: idSL, line: i, name: 'select'});
                if (mark === 'T' || mark === true) {
                    let objData = {};
                    for (let j = 0; j < numCols; j++) {
                        objData[arrCols[j].col] = request.getSublistValue({group: idSL, name: arrCols[j].id, line: i});
                    }
                    arrData.push(objData)
                }
            }
            return arrData;
        }

        const onCreateForm = (objParams, dataConfig) => {
            const form = ui.createForm({title: CustomDataConfig.TITLE});
            libFn.addSavedSearchToForm(form, Object.values(CustomDataConfig.SS).map(o => ({id: o, title: o})));
            const container = "custpage_grp_filters";
            const viewContainer   = "custpage_grp_view";
            form.addFieldGroup({id: container, label: "Bộ lọc"});
            form.addFieldGroup({id: viewContainer, label: "View"});
            form.addButton({
                id: 'custpage_scv_search',
                label: 'Tìm kiếm',
                functionName: "onClickFC(\'&isSearch=T\')"
            });
            form.addButton({
                id: 'custpage_scv_calc_total_amount',
                label: 'Caclulate Total Amount',
                functionName: "calcTotalAmount"
            });
            form.addButton({
                id: 'custpage_scv_refresh',
                label: 'Refresh',
                functionName: "onClickFC(\'&isFieldChanged=T\')"
            });
            form.addSubmitButton({label: 'Tạo phiếu'});
            let fSub = form.addField({
                id: "custpage_scv_subsidiary",
                label: "Công ty",
                type: ui.FieldType.SELECT,
                source: "subsidiary",
                container: container
            });
            let fCategory = form.addField({
                id: "custpage_scv_category", label: "Phân loại", type: ui.FieldType.SELECT,
                container : container
            });
            let fProject = form.addField({
                id: "custpage_scv_project", label: "Project", type: ui.FieldType.SELECT,
                source: 'customrecord_cseg_scv_sg_proj',
                container : container
            });
            let fAsset = form.addField({
                id: "custpage_scv_asset", label: "Tài sản", type: ui.FieldType.SELECT,
                source: 'customrecord_ncfar_asset',
                container : container
            })
                .updateBreakType({
                    breakType: 'startcol'
                });
            let fFromDate = form.addField({id: "custpage_scv_fromdate", label: "From Date", type: ui.FieldType.DATE, container : container});
            let fToDate = form.addField({id: "custpage_scv_todate", label: "To Date", type: ui.FieldType.DATE, container : container});
            let fTotal = form.addField({id: "custpage_scv_total_amount", label: "Tổng", type: ui.FieldType.FLOAT, container : viewContainer});
            fTotal.updateDisplayType({
                displayType: 'DISABLED'
            });

            fSub.isMandatory = true;
            fCategory.isMandatory = true;
            fFromDate.isMandatory = true;
            fToDate.isMandatory = true;
            addSelectOptionsField(fCategory, dataConfig.arrDataCategory);
            setDefaultValue(fSub, objParams.pSubsidiary);
            setDefaultValue(fCategory, objParams.pCategory, CustomCategory.CREATE.ID);
            setDefaultValue(fProject, objParams.pProject);
            setDefaultValue(fFromDate, objParams.pFromDate);
            setDefaultValue(fToDate, objParams.pToDate);
            setDefaultValue(fAsset, objParams.pAsset);
            const sublist = form.addSublist({
                id: CustomDataConfig.SUBLIST.ID,
                label: CustomDataConfig.SUBLIST.NAME,
                type: ui.SublistType.LIST
            });
            return {form: form, sublist: sublist}
        }

        const handleData = objParams => {
            let fetchDataSource;
            if (objParams.pCategory === CustomCategory.CREATE.ID) {
                fetchDataSource = getDataDocCreateAsset;
            } else {
                fetchDataSource = getDataRateFixedAsset;
            }
            let result = fetchDataSource(objParams);
            let data = result.isSuccess ? result.response : [];
            return {
                arrDataRows: data
            };
        }

        const getDataConfig = () => {
            let arrDataCategory = Object.values(CustomCategory).map(o => ({value: o.ID, text: o.NAME}));
            return {
                arrDataCategory: arrDataCategory
            }
        }

        const getDataDocCreateAsset = (objParams) => {
            let result = {response: null, error: null, isSuccess: false};
            let searchObj = search.load({id: CustomDataConfig.SS.DOC_CREATE_ASSET});
            try {
                if (objParams.pProject) searchObj.filters.push(search.createFilter({
                    name: "formulanumeric",
                    operator: search.Operator.EQUALTO,
                    values: objParams.pProject,
                    formula: "nvl({line.cseg_scv_sg_proj.id},{cseg_scv_sg_proj.id})"
                }));
                if (objParams.pSubsidiary) searchObj.filters.push(search.createFilter({
                    name: "subsidiary",
                    operator: 'anyof',
                    values: objParams.pSubsidiary
                }));
                if (objParams.pAsset) searchObj.filters.push(search.createFilter({
                    name: "custcol_far_trn_relatedasset",
                    operator: 'anyof',
                    values: objParams.pAsset
                }));
                if (objParams.pFromDate && objParams.pToDate) searchObj.filters.push(search.createFilter({
                    name: "trandate",
                    operator: 'within',
                    values: [objParams.pFromDate, objParams.pToDate]
                }));
                let cols = searchObj.columns;
                let arrData = [];
                let pagedData = searchObj.runPaged({pageSize: 1000});
                for (let page in pagedData.pageRanges) {
                    let currentPage = pagedData.fetch(page);
                    currentPage.data.forEach(function (data) {
                        arrData.push({
                            transId: data.id.toString(),
                            docNum: data.getValue(cols[0]),
                            date: data.getValue(cols[1]),
                            memo: data.getValue(cols[2]),
                            amount: data.getValue(cols[3]) * 1,
                            projectId: data.getValue(cols[4]),
                            projectDisplay: data.getValue(cols[11]),
                            projectCode: data.getValue(cols[5]),
                            // assetId : data.getValue(cols[6]),
                            // assetDisplay : data.getText(cols[6]),
                            accountDisplay: data.getValue(cols[7]),
                            accountId: data.getValue(cols[9]),
                            transType: data.getValue(cols[10])
                        });
                    });
                }
                result.response = arrData;
                result.isSuccess = true;
            } catch (e) {
                log.error("Error getDataDocCreateAsset: ", e);
                result.error = 'Not found data';
            }
            return result;
        }


        const getDataRateFixedAsset = (objParams) => {
            let result = {response: null, error: null, isSuccess: false};
            let searchObj = search.load({id: CustomDataConfig.SS.DOC_RATE_FIX_ASSET});
            try {
                if (objParams.pProject) searchObj.filters.push(search.createFilter({
                    name: "formulanumeric",
                    operator: search.Operator.EQUALTO,
                    values: objParams.pProject,
                    formula: "nvl({line.cseg_scv_sg_proj.id},{cseg_scv_sg_proj.id})"
                }));
                if (objParams.pSubsidiary) searchObj.filters.push(search.createFilter({
                    name: "subsidiary",
                    operator: 'anyof',
                    values: objParams.pSubsidiary
                }));
                if (objParams.pAsset) searchObj.filters.push(search.createFilter({
                    name: "custcol_far_trn_relatedasset",
                    operator: 'anyof',
                    values: objParams.pAsset
                }));
                if (objParams.pFromDate && objParams.pToDate) searchObj.filters.push(search.createFilter({
                    name: "trandate",
                    operator: 'within',
                    values: [objParams.pFromDate, objParams.pToDate]
                }));
                let cols = searchObj.columns;
                let arrData = [];
                let pagedData = searchObj.runPaged({pageSize: 1000});
                for (let page in pagedData.pageRanges) {
                    let currentPage = pagedData.fetch(page);
                    currentPage.data.forEach(function (data) {
                        arrData.push({
                            transId: data.id.toString(),
                            docNum: data.getValue(cols[0]),
                            date: data.getValue(cols[1]),
                            memo: data.getValue(cols[2]),
                            amount: data.getValue(cols[3]) * 1,
                            projectId: data.getValue(cols[4]),
                            projectDisplay: data.getValue(cols[12]),
                            projectCode: data.getValue(cols[5]),
                            assetId: data.getValue(cols[6]),
                            assetDisplay: data.getText(cols[6]),
                            accountDisplay: data.getValue(cols[7]),
                            accountId: data.getValue(cols[9]),
                            transType: data.getValue(cols[10]),
                            writeDownAccountId: data.getValue(cols[11])
                        });
                    });
                }
                result.response = arrData;
                result.isSuccess = true;
            } catch (e) {
                log.error("Error getDataDocCreateAsset: ", e);
                result.error = 'Not found data';
            }
            return result;
        }

        const getAccountAssetOnProject = (arrProjectId) => {
            const vConditionProject = (arrProjectId.length) ? ' id in (' + arrProjectId.join("','") + ')' : ' 1 = 1 ';
            let result = libFn.callQuery('SELECT id, custrecord_scv_project_acc_asset as acc_asset_id FROM customrecord_cseg_scv_sg_proj WHERE '.concat(vConditionProject));
            return result.isSuccess ? result.response : [];
        }

        const getColsSublist = (categoryId) => {
            let arrCols;
            if (categoryId === CustomCategory.CREATE.ID) {
                arrCols = [
                    {id: "select", name: "Check", type: "CHECKBOX", col: "select", display: 'NORMAL'},
                    {id: "c4", name: "Dự án", type: "TEXT", col: "projectDisplay"},
                    {id: "c5", name: "Mã dự án", type: "TEXT", col: "projectCode"},
                    {id: "c6", name: "Tài sản", type: "TEXT", col: "assetDisplay"},
                    {id: "c0", name: "Số chứng từ", type: "TEXT", col: "docNum"},
                    {id: "c1", name: "Ngày hạch toán", type: "TEXT", col: "date"},
                    {id: "c2", name: "Diễn giải", type: "TEXT", col: "memo"},
                    {id: "c7", name: "Tài khoản", type: "TEXT", col: "accountDisplay"},
                    {id: "c3", name: "Số tiền", type: "FLOAT", col: "amount"},
                    {id: "c0_id", name: "Số chứng từ ID", type: "TEXT", col: "transId", display: 'HIDDEN'},
                    {id: "c4_id", name: "Dự án ID", type: "TEXT", col: "projectId", display: 'HIDDEN'},
                    {id: "c6_id", name: "Tài sản Id", type: "TEXT", col: "assetId", display: 'HIDDEN'},
                    {id: "c7_id", name: "Tài khoản ID", type: "TEXT", col: "accountId", display: 'HIDDEN'},
                    {id: "c8", name: "Trans Type", type: "TEXT", col: "transType", display: 'HIDDEN'},

                ];
            } else {
                arrCols = [
                    {id: "select", name: "Check", type: "CHECKBOX", col: "select", display: 'NORMAL'},
                    {id: "c4", name: "Dự án", type: "TEXT", col: "projectDisplay"},
                    {id: "c5", name: "Mã dự án", type: "TEXT", col: "projectCode"},
                    {id: "c6", name: "Tài sản", type: "TEXT", col: "assetDisplay"},
                    {id: "c0", name: "Số chứng từ", type: "TEXT", col: "docNum"},
                    {id: "c1", name: "Ngày hạch toán", type: "TEXT", col: "date"},
                    {id: "c2", name: "Diễn giải", type: "TEXT", col: "memo"},
                    {id: "c7", name: "Tài khoản", type: "TEXT", col: "accountDisplay"},
                    {id: "c3", name: "Số tiền", type: "FLOAT", col: "amount"},
                    {id: "c0_id", name: "Số chứng từ ID", type: "TEXT", col: "transId", display: 'HIDDEN'},
                    {id: "c4_id", name: "Dự án ID", type: "TEXT", col: "projectId", display: 'HIDDEN'},
                    {id: "c6_id", name: "Tài sản Id", type: "TEXT", col: "assetId", display: 'HIDDEN'},
                    {id: "c7_id", name: "Tài khoản ID", type: "TEXT", col: "accountId", display: 'HIDDEN'},
                    {id: "c8", name: "Trans Type", type: "TEXT", col: "transType", display: 'HIDDEN'},
                    {id: "c9_id", name: "Write Down Account ID", type: "TEXT", col: "writeDownAccountId", display: 'HIDDEN'},
                ];
            }
            return arrCols;
        };

        const addSelectOptionsField = (pField, data, isEmpty, nameEmpty) => {
            if (isEmpty) {
                let nameEmptyTemp = nameEmpty;
                if (typeof nameEmptyTemp === 'undefined') nameEmptyTemp = '-- Select --';
                pField.addSelectOption({name: nameEmptyTemp, value: ''});
            }
            const sizeData = data.length;
            for (let i = 0; i < sizeData; i++) {
                pField.addSelectOption({text: data[i].text, value: data[i].value});
            }
        }

        const setDefaultValue = (pField, val, tempVal) => {
            if (isValid(val)) {
                pField.defaultValue = val;
            } else if (isValid(tempVal)) {
                pField.defaultValue = tempVal;
            }
        };

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
            onRequest,
            createJournalEntry,
            getCache,
            setJRLCreateByTrans
        }
    }
);