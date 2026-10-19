/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/format', 'N/record', 'N/runtime', 'N/search', '../olib/alasql/alasql.min@1.7.3'],
    (format, record, runtime, search, alasql) => {

        const SS = {
            PRINCIAL_INTEREST_SPREADSHEET: "customsearch_scv_loanandinterestsheet_v2",
            ACCOUNTING_SETUP: "customsearch_scv_ss_loa_accounting_setup",
        };
        const COL = {
            PRINCIAL_INTEREST_SPREADSHEET: {
                NAME_PRI_SS: 0,
                LOA: 1,
                DATE: 3,
                AMOUNT: 5,
                SUBSIDIARY: 8,
                CURRENCY: 9
            },
            ACCOUNTING_SETUP: {
                LOA: 2,
                ACCOUNT_DEBIT: 4,
                ACCOUNT_CREDIT: 6
            }
        };

        const STATUS = {
            OPEN: "1",
            POST: "2"
        };

        /**
         * Defines the function that is executed at the beginning of the map/reduce process and generates the input data.
         * @param {Object} inputContext
         * @param {boolean} inputContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {Object} inputContext.ObjectRef - Object that references the input data
         * @typedef {Object} ObjectRef
         * @property {string|number} ObjectRef.id - Internal ID of the record instance that contains the input data
         * @property {string} ObjectRef.type - Type of the record instance that contains the input data
         * @returns {Array|Object|Search|ObjectRef|File|Query} The input data to use in the map/reduce process
         * @since 2015.2
         */
        const getInputData = (inputContext) => {
            let currentScript = runtime.getCurrentScript();
            const options = {};
            options.subsidiary = currentScript.getParameter({name: "custscript_scv_mr_subsidiary"});
            options.fromDate = currentScript.getParameter({name: "custscript_scv_mr_fromdate"});
            options.toDate = currentScript.getParameter({name: "custscript_scv_mr_todate"});
            const dataPriSpreadSheet = onLoadDataPriSpreadSheet(options);
            if (dataPriSpreadSheet.length === 0) return [];
            const dataAccSetup = onLoadDataAccountSetup();
            return alasql("SELECT T1.*, T2.account_debit as account_debit,  T2.account_credit as account_credit  FROM ? AS T1 LEFT JOIN ? AS T2 ON T1.loa = T2.loa", [dataPriSpreadSheet, dataAccSetup]);
        }

        const onLoadDataAccountSetup = () => {
            const filters = [];
            const SS_ID = SS.ACCOUNTING_SETUP;
            const {pageData, columnsSS, lengthPage} = runLoadSS(SS_ID, filters);
            const results = [];
            const INDEX_COLUMN = COL.ACCOUNTING_SETUP;
            for (let i = 0; i < lengthPage; i++) {
                const theFetchData = pageData.fetch({index: i});
                const dataPage = theFetchData.data;
                const lengthDataInPage = dataPage.length;
                for (let j = 0; j < lengthDataInPage; j++) {
                    let objData = {};
                    objData.loa = dataPage[j].getValue(columnsSS[INDEX_COLUMN.LOA]);
                    objData.account_debit = dataPage[j].getValue(columnsSS[INDEX_COLUMN.ACCOUNT_DEBIT]);
                    objData.account_credit = dataPage[j].getValue(columnsSS[INDEX_COLUMN.ACCOUNT_CREDIT]);
                    results.push(objData);
                }
            }
            return results;
        }
        const onLoadDataPriSpreadSheet = (options) => {
            const filters = [];
            if (options.subsidiary) {
                filters.push(search.createFilter({name: "custrecord_scv_db_subsidiary", join: "custrecord_scv_db_sheet", operator: search.Operator.ANYOF, values: options.subsidiary}));
            }
            if (options.fromDate && options.toDate) {
                filters.push(search.createFilter({
                    name: "custrecord_scv_dbsheet_paymentdate",
                    operator: search.Operator.WITHIN,
                    values: [options.fromDate, options.toDate]
                }));
            }
            const SS_ID = SS.PRINCIAL_INTEREST_SPREADSHEET;
            const {pageData, columnsSS, lengthPage} = runLoadSS(SS_ID, filters);
            const results = [];
            const INDEX_COLUMN = COL.PRINCIAL_INTEREST_SPREADSHEET;
            for (let i = 0; i < lengthPage; i++) {
                const theFetchData = pageData.fetch({index: i});
                const dataPage = theFetchData.data;
                const lengthDataInPage = dataPage.length;
                for (let j = 0; j < lengthDataInPage; j++) {
                    let objData = {};
                    objData.id = dataPage[j].id;
                    objData.name = dataPage[j].getValue(columnsSS[INDEX_COLUMN.NAME_PRI_SS]);
                    objData.loa = dataPage[j].getValue(columnsSS[INDEX_COLUMN.LOA]);
                    objData.date = dataPage[j].getValue(columnsSS[INDEX_COLUMN.DATE]);
                    objData.amount = dataPage[j].getValue(columnsSS[INDEX_COLUMN.AMOUNT]) * 1;
                    objData.subsidiary = dataPage[j].getValue(columnsSS[INDEX_COLUMN.SUBSIDIARY]);
                    objData.currency = dataPage[j].getValue(columnsSS[INDEX_COLUMN.CURRENCY]);
                    results.push(objData);
                }
            }
            return results;
        }


        const runLoadSS = (savedSearchId, filters, searchType) => {
            const objSearch = {};
            objSearch.id = savedSearchId;
            if (searchType) objSearch.type = searchType;
            const searchObj = search.load(objSearch);
            filters.forEach(filter => searchObj.filters.push(filter));
            const pageData = searchObj.runPaged({pageSize: 1000});
            const pageRange = pageData.pageRanges;
            const lengthPage = pageRange.length;
            const columnsSS = pageData.searchDefinition.columns;
            return {
                pageData,
                columnsSS,
                lengthPage
            }
        }

        /**
         * Defines the function that is executed when the map entry point is triggered. This entry point is triggered automatically
         * when the associated getInputData stage is complete. This function is applied to each key-value pair in the provided
         * context.
         * @param {Object} mapContext - Data collection containing the key-value pairs to process in the map stage. This parameter
         *     is provided automatically based on the results of the getInputData stage.
         * @param {Iterator} mapContext.errors - Serialized errors that were thrown during previous attempts to execute the map
         *     function on the current key-value pair
         * @param {number} mapContext.executionNo - Number of times the map function has been executed on the current key-value
         *     pair
         * @param {boolean} mapContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {string} mapContext.key - Key to be processed during the map stage
         * @param {string} mapContext.value - Value to be processed during the map stage
         * @since 2015.2
         */

        const map = (mapContext) => {
            const objJrlStr = mapContext.value;
            const objJrl = JSON.parse(objJrlStr);
            const idJrl = createJournalEntry(objJrl);
            setPrintAndInterestSpreadSheet(objJrl.id, idJrl);
            if (idJrl) {
                mapContext.write({
                    key: 'success',
                    value: {idJournal: idJrl, namePriSS: objJrl.name, idPriSS: objJrl.id}
                });
            } else {
                mapContext.write({key: 'failed', value: {namePriSS: objJrl.name, idPriSS: objJrl.id}});
            }
        }


        const setPrintAndInterestSpreadSheet = (idPrintAndInterSheet, idJrl) => {
            if (!idJrl) return;
            const tranId = getTranIdJrl(idJrl);
            const objInterSheet = {
                custrecord_scv_sheet_status: STATUS.POST,
                custrecord_scv_sheet_documentnumber: tranId,
            };
            record.submitFields({
                type: "customrecord_scv_prinandintersheet",
                id: idPrintAndInterSheet,
                values: objInterSheet,
                options: {
                    ignoreMandatoryFields: true
                }
            });
        }

        const getTranIdJrl = (idJrl) => search.lookupFields({type: record.Type.JOURNAL_ENTRY, id: idJrl, columns: "tranid"}).tranid

        const createJournalEntry = (objJrl) => {
            const date = objJrl.date ? format.parse({value: objJrl.date, type: format.Type.DATE}) : '';
            let recordJrl = record.create({type: record.Type.JOURNAL_ENTRY, isDynamic: true});
            recordJrl.setValue("subsidiary", objJrl.subsidiary);
            recordJrl.setValue("trandate", date);
            recordJrl.setValue("currency", objJrl.currency);
            recordJrl.setValue("memo", objJrl.name);
            recordJrl.setValue("cseg_scv_loan", objJrl?.loa || '');
            recordJrl.selectNewLine({sublistId: "line"});
            recordJrl.setCurrentSublistValue({sublistId: "line", fieldId: "account", value: objJrl.account_debit})
            recordJrl.setCurrentSublistValue({sublistId: "line", fieldId: "debit", value: objJrl.amount})
            recordJrl.setCurrentSublistValue({sublistId: "line", fieldId: "cseg_scv_loan", value: objJrl?.loa || ''});
            recordJrl.commitLine({sublistId: "line"});
            recordJrl.selectNewLine({sublistId: "line"});
            recordJrl.setCurrentSublistValue({sublistId: "line", fieldId: "account", value: objJrl.account_credit})
            recordJrl.setCurrentSublistValue({sublistId: "line", fieldId: "credit", value: objJrl.amount})
            recordJrl.setCurrentSublistValue({sublistId: "line", fieldId: "cseg_scv_loan", value: objJrl?.loa || ''});
            recordJrl.commitLine({sublistId: "line"});
            return recordJrl.save({enableSourcing: false, ignoreMandatoryFields: true});
        }
        /**
         * Defines the function that is executed when the reduce entry point is triggered. This entry point is triggered
         * automatically when the associated map stage is complete. This function is applied to each group in the provided context.
         * @param {Object} reduceContext - Data collection containing the groups to process in the reduce stage. This parameter is
         *     provided automatically based on the results of the map stage.
         * @param {Iterator} reduceContext.errors - Serialized errors that were thrown during previous attempts to execute the
         *     reduce function on the current group
         * @param {number} reduceContext.executionNo - Number of times the reduce function has been executed on the current group
         * @param {boolean} reduceContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {string} reduceContext.key - Key to be processed during the reduce stage
         * @param {List<String>} reduceContext.values - All values associated with a unique key that was passed to the reduce stage
         *     for processing
         * @since 2015.2
         */
        const reduce = (reduceContext) => {
            log.debug("Show " + reduceContext.key, reduceContext.values);

        }


        /**
         * Defines the function that is executed when the summarize entry point is triggered. This entry point is triggered
         * automatically when the associated reduce stage is complete. This function is applied to the entire result set.
         * @param {Object} summaryContext - Statistics about the execution of a map/reduce script
         * @param {number} summaryContext.concurrency - Maximum concurrency number when executing parallel tasks for the map/reduce
         *     script
         * @param {Date} summaryContext.dateCreated - The date and time when the map/reduce script began running
         * @param {boolean} summaryContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {Iterator} summaryContext.output - Serialized keys and values that were saved as output during the reduce stage
         * @param {number} summaryContext.seconds - Total seconds elapsed when running the map/reduce script
         * @param {number} summaryContext.usage - Total number of governance usage units consumed when running the map/reduce
         *     script
         * @param {number} summaryContext.yields - Total number of yields when running the map/reduce script
         * @param {Object} summaryContext.inputSummary - Statistics about the input stage
         * @param {Object} summaryContext.mapSummary - Statistics about the map stage
         * @param {Object} summaryContext.reduceSummary - Statistics about the reduce stage
         * @since 2015.2
         */
        const summarize = (summaryContext) => {
        }

        return {
            getInputData,
            map,
            reduce,
            summarize
        }

    });
