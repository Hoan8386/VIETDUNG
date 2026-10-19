/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define([
        "N/format",
        "../olib/plib",
        "N/runtime",
        "N/record",
        "../olib/lodash.min",
        "../olib/moment",
        "../olib/slib",
        "../olib/clib"
    ]
    , (format, plib, runtime, record, _, moment, slib, clib) => {

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
            try {
                return buildGeneratePrincipalInterestData(runtime.getCurrentScript().getParameter({name: "custscript_scv_param_loan"}));
            } catch (e) {
                log.error("getInputData error", e);
            }
        };

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
            try {
                let o = JSON.parse(mapContext.value);
                if (o.principalLine === "yes") return;
                let options = {
                    name: o.c0,
                    custrecord_scv_db_sheet: o.debitloan,
                    custrecord_scv_db_sheet_type: o.type,
                    custrecord_scv_dbsheet_paymentdate: format.parse({value: o.c3, type: format.Type.DATE,}),
                    custrecord_scv_sheet_rate: _.replace(o.c4, "%", ""),
                    custrecord_scv_sheet_amt: o.c5,
                    custrecord_scv_sheet_status: "1"
                };
                let id = plib.createRecord("customrecord_scv_prinandintersheet", "", options, []);
            } catch (e) {
                log.error("map error", e);
            }
        };

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
        };

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
        };

        function buildGeneratePrincipalInterestData(debitLoan) {
            let recDebitLoan = record.load({type: "customrecord_cseg_scv_loan", id: debitLoan,});
            let loanInterest = plib.queryDebitLoanInterest(debitLoan);
            let arrDebitLoan = [
                "name",
                "custrecord_scv_dl_paymentterm",
                "custrecord_scv_dl_inpaymentperiod",
                "custrecord_scv_dl_prinpayperiod",
                "custrecord_scv_inspaymentdate",
                "custrecord_scv_dl_prinpaydate",
                "custrecord_scv_dl_inpaymentterm",
                "custrecord_scv_disbursementdate",
                "custrecord_scv_dl_ratetype",
                "custrecord_scv_loanamt",
                "custrecord_scv_db_formula",
                "custrecord_scv_loa_currency",
            ];
            let objDebitLoan = {};
            _.map(arrDebitLoan, (o) => (objDebitLoan[o] = recDebitLoan.getValue(o)));
            let dateformat = slib.userPreferences().dateformat;
            let currencyprecision = 0;
            let results = [];
            switch (objDebitLoan.custrecord_scv_dl_paymentterm) {
                case "1": //Monthly
                    if (objDebitLoan.custrecord_scv_dl_ratetype == "2") {
                        //Base on OutStanding principal
                        //binding principal
                        for (let i = 0; i < objDebitLoan.custrecord_scv_dl_prinpayperiod; i++) {
                            let o = {};
                            let paymentDate = moment(objDebitLoan.custrecord_scv_dl_prinpaydate, dateformat).add(1 * (i + 1), "M").format(dateformat);
                            let addM = moment(paymentDate, dateformat).format("MM");
                            let addY = moment(paymentDate, dateformat).format("YYYY");
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
                        let lastPaymentDate = objDebitLoan.custrecord_scv_inspaymentdate;
                        let lastPayment = objDebitLoan.custrecord_scv_loanamt;
                        let amountBalance =
                            objDebitLoan.custrecord_scv_loanamt /
                            objDebitLoan.custrecord_scv_dl_inpaymentperiod;
                        for (
                            let i = 1;
                            i <= objDebitLoan.custrecord_scv_dl_inpaymentperiod;
                            i++
                        ) {
                            let o = {};
                            let paymentDate = moment(lastPaymentDate, dateformat)
                                .add(1, "M")
                                .format(dateformat);
                            let addM = moment(paymentDate, dateformat).format("MM");
                            let addY = moment(paymentDate, dateformat).format("YYYY");
                            o.c0 = `Interest ${objDebitLoan.name} - ${addM}.${addY}`;
                            o.c1 = objDebitLoan.name;
                            o.c2 = "Interest";
                            o.c3 = paymentDate;
                            let rate = getRateFromPaymentDate(
                                loanInterest,
                                paymentDate,
                                dateformat
                            ); //rate
                            let rateNum =
                                _.chain(rate).replace("%", "").toNumber().value() / 100;
                            let dateDiff = moment(paymentDate, dateformat).diff(
                                moment(lastPaymentDate, dateformat),
                                "days"
                            );
                            o.c4 = rate;
                            "custrecord_scv_db_formula", //365 ngay mot nam
                                (o.c5 =
                                    lastPayment *
                                    (rateNum / objDebitLoan.custrecord_scv_db_formula) *
                                    dateDiff); // amount = 1.000.000.000*(10%/365)*31ngay
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
                            let i = 0;
                            i < objDebitLoan.custrecord_scv_dl_prinpayperiod;
                            i++
                        ) {
                            let o = {};
                            let paymentDate = moment(
                                objDebitLoan.custrecord_scv_dl_prinpaydate,
                                dateformat
                            )
                                .add(1 * (i + 1), "M")
                                .format(dateformat);
                            let addM = moment(paymentDate, dateformat).format("MM");
                            let addY = moment(paymentDate, dateformat).format("YYYY");
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
                        let lastPaymentDate = objDebitLoan.custrecord_scv_inspaymentdate;
                        // let lastPayment = objDebitLoan.custrecord_scv_loanamt;
                        let amountBalance =
                            objDebitLoan.custrecord_scv_loanamt /
                            objDebitLoan.custrecord_scv_dl_inpaymentperiod;
                        for (
                            let i = 1;
                            i <= objDebitLoan.custrecord_scv_dl_inpaymentperiod;
                            i++
                        ) {
                            let o = {};
                            // lastPayment = lastPayment - amountBalance;
                            let paymentDate = moment(lastPaymentDate, dateformat)
                                .add(1, "M")
                                .format(dateformat);
                            let addM = moment(paymentDate, dateformat).format("MM");
                            let addY = moment(paymentDate, dateformat).format("YYYY");
                            o.c0 = `Interest ${objDebitLoan.name} - ${addM}.${addY}`;
                            o.c1 = objDebitLoan.name;
                            o.c2 = "Interest";
                            o.c3 = paymentDate;
                            let rate = getRateFromPaymentDate(
                                loanInterest,
                                paymentDate,
                                dateformat
                            ); //rate
                            let rateNum =
                                _.chain(rate).replace("%", "").toNumber().value() / 100;
                            o.c4 = rate;
                            let dateDiff = moment(paymentDate, dateformat).diff(
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
                    for (let i = 0; i < objDebitLoan.custrecord_scv_dl_prinpayperiod; i++) {
                        let o = {};
                        let paymentDate = moment(
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
                        let i = 0;
                        i < objDebitLoan.custrecord_scv_dl_inpaymentperiod;
                        i++
                    ) {
                        let o = {};
                        let paymentDate = moment(
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
                    for (let i = 0; i < objDebitLoan.custrecord_scv_dl_prinpayperiod; i++) {
                        let o = {};
                        let paymentDate = moment(
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
                        let i = 0;
                        i < objDebitLoan.custrecord_scv_dl_inpaymentperiod;
                        i++
                    ) {
                        let o = {};
                        let paymentDate = moment(
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
                //Other
                case "4":
                    if (objDebitLoan.custrecord_scv_dl_ratetype == "3") {
                        //Base on principal detail
                        //binding principal
                        for (
                            let i = 0;
                            i < objDebitLoan.custrecord_scv_dl_prinpayperiod;
                            i++
                        ) {
                            let o = {};
                            let paymentDate = moment(
                                objDebitLoan.custrecord_scv_dl_prinpaydate,
                                dateformat
                            )
                                .add(1 * (i + 1), "M")
                                .format(dateformat);
                            let addM = moment(paymentDate, dateformat).format("MM");
                            let addY = moment(paymentDate, dateformat).format("YYYY");
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
                        // let principalDetail = plib.searchPrincipalDetail({});
                        let principalDetail = plib.queryPrincipalDetail(debitLoan);
                        let lastPaymentDate = objDebitLoan.custrecord_scv_inspaymentdate;
                        let disbursementdate = objDebitLoan.custrecord_scv_disbursementdate;
                        let lastPayment = objDebitLoan.custrecord_scv_loanamt;
                        let loanAmt = objDebitLoan.custrecord_scv_loanamt;
                        for (
                            let i = 1;
                            i <= objDebitLoan.custrecord_scv_dl_inpaymentperiod;
                            i++
                        ) {
                            let o = {};
                            let paymentDate = moment(lastPaymentDate, dateformat)
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
                            let addM = moment(paymentDate, dateformat).format("MM");
                            let addY = moment(paymentDate, dateformat).format("YYYY");
                            o.c0 = `Interest ${objDebitLoan.name} - ${addM}.${addY}`;
                            o.c1 = objDebitLoan.name;
                            o.c2 = "Interest";
                            o.c3 = paymentDate;
                            let rate = getRateFromPaymentDate(
                                loanInterest,
                                paymentDate,
                                dateformat
                            ); //rate
                            let rateNum =
                                _.chain(rate).replace("%", "").toNumber().value() / 100;
                            o.c4 = rate;
                            let dateDiff = moment(paymentDate, dateformat).diff(
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
                            o.principalLine = "no";
                            results.push(o);
                            lastPaymentDate = paymentDate;
                        }
                        _.map(principalDetail, function (o) {
                            let addM = moment(o.paymentdate, dateformat).format("MM");
                            let addY = moment(o.paymentdate, dateformat).format("YYYY");
                            let rate = getRateFromPaymentDate(
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
                                principalLine: "no",
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
                                type: "1",
                                loanAmt: loanAmt,
                                principalLine: "yes",
                            });
                        });
                        //sort
                        results = _.sortBy(results, function (o) {
                            return moment(o.c3, dateformat).format("YYYYMMDD");
                        });
                        //recalc principal loan
                        let loanAmtChange = loanAmt;
                        util.each(results, function (o) {
                            o.loanAmt = loanAmtChange;
                            let findPayment = _.find(principalDetail, {
                                paymentdate: o.c3,
                                amount: o.c5,
                            });
                            if (!_.isEmpty(findPayment)) loanAmtChange -= o.c5;
                        });
                        //recals amount
                        util.each(results, function (o, i) {
                            if (clib.isEmpty(o.c4)) return true;
                            let dateDiff = moment(o.c3, dateformat).diff(
                                moment(lastPaymentDate, dateformat),
                                "days"
                            );
                            if (i == 0)
                                dateDiff =
                                    moment(o.c3, dateformat).diff(
                                        moment(disbursementdate, dateformat),
                                        "days"
                                    ) + 1;
                            let rateNum =
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

        function getRateFromPaymentDate(loanInterest, paymentDatein, dateFormat) {
            let paymentDate = moment(paymentDatein, dateFormat).add(-1, "d");
            let rate = "";
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

        return {getInputData, map, reduce, summarize};
    });
