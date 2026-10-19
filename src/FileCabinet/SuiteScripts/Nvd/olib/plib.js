/**
 * @NApiVersion 2.1
 */
define([
  "N/cache", "N/format", "N/format/i18n", "N/query", "N/record", "N/runtime", "N/search", "./lodash.min", "./clib", "./slib", "./moment", "N/file",
  '../olib/enums'
], (
    cache, format, i18n, query, record, runtime, search, _, clib, slib, moment, file, enums
) => {
  function getTaxCode(item) {
    try {
      var lk = search.lookupFields({
        type: search.Type.SERVICE_ITEM,
        id: item,
        columns: ["taxschedule"],
      });
      var taxSchedule = lk.taxschedule[0].value;
      var rec = record.load({type: "taxschedule", id: taxSchedule});
      var saleTaxCode = rec.getSublistValue({
        sublistId: "nexuses",
        fieldId: "salestaxcode",
        line: 0,
      });
      return saleTaxCode;
    } catch (e) {
      log.error("getTaxCode", JSON.stringify(e));
    }
  }

  const queryClass = () => {
    // Query definition
    var objQuery = query.create({type: "classification"});
    // Columns
    objQuery.columns = [
      objQuery.createColumn({
        alias: "id",
        fieldId: "id",
      }),
      objQuery.createColumn({
        alias: "fullname",
        fieldId: "fullname",
      }),
    ];
    // Conditions
    var conditionList = [];
    conditionList.push(
        objQuery.createCondition({
          operator: query.Operator.IS,
          values: [false],
          fieldId: "isinactive",
        })
    );
    conditionList.push(
        objQuery.createCondition({
          operator: query.Operator.ANY_OF,
          values: [
            "132",
            "38",
            "41",
            "39",
            "37",
            "125",
            "31",
            "2",
            "163",
            "134",
            "20",
            "22",
            "19",
            "162",
            "165",
            "18",
            "9",
            "17",
            "16",
            "10",
            "25",
            "26",
            "24",
            "27",
            "157",
            "128",
            "181",
          ],
          fieldId: "id",
        })
    );

    objQuery.condition = objQuery.and(conditionList);
    // Paged execution
    var objPagedData = objQuery.runPaged({pageSize: 1000});
    // Paging
    var arrResults = [];
    objPagedData.pageRanges.forEach(function (pageRange) {
      var objPage = objPagedData.fetch({index: pageRange.index}).data;

      // Map results to columns
      arrResults.push.apply(arrResults, objPage.asMappedResults());
    });
    return arrResults;
  };

  /**
   *
   * @param options
   * @param options.item
   * @param options.department
   * @param options.project
   * @return {*[]}
   */
  function queryMappingItem(options) {
    try {
      var objQuery = query.create({type: "customrecord_scv_map_item_acc"});
      objQuery.columns = [
        objQuery.createColumn({
          alias: "item",
          fieldId: "custrecord_scv_map_item",
        }),
        objQuery.createColumn({
          alias: "department",
          fieldId: "custrecord_scv_depart_map",
        }),
        objQuery.createColumn({
          alias: "project",
          fieldId: "custrecord_scv_map_project_acc",
        }),
        objQuery.createColumn({
          alias: "departmentAcc",
          fieldId: "custrecord_scv_depart_acc",
        }),
        objQuery.createColumn({
          alias: "projectAcc",
          fieldId: "custrecord_scv_map_project_acc",
        }),
        objQuery.createColumn({
          alias: "departProjAcc",
          fieldId: "custrecord_scv_depart_project_acc",
        }),
      ];
      // Conditions
      var conditionList = [];
      if (!clib.isEmpty(options.item))
        conditionList.push(
            objQuery.createCondition({
              operator: query.Operator.ANY_OF,
              values: [options.item],
              fieldId: "custrecord_scv_map_item",
            })
        );
      if (!clib.isEmpty(options.project))
        conditionList.push(
            objQuery.createCondition({
              operator: query.Operator.ANY_OF,
              values: [options.project],
              fieldId: "custrecord_scv_map_project_acc",
            })
        );
      if (!clib.isEmpty(options.department)) {
        conditionList.push(
            objQuery.createCondition({
              operator: "MN_INCLUDE",
              values: options.department,
              fieldId: "custrecord_scv_depart_map",
            })
        );
      }
      objQuery.condition = objQuery.and(conditionList);
      // Paged execution
      var objPagedData = objQuery.runPaged({pageSize: 1000});
      // Paging
      var arrResults = [];
      objPagedData.pageRanges.forEach(function (pageRange) {
        var objPage = objPagedData.fetch({index: pageRange.index}).data;

        // Map results to columns
        arrResults.push.apply(arrResults, objPage.asMappedResults());
      });
      _.map(arrResults, (o) => {
        o.department = _.split(o.department, ", ");
      });
      return arrResults;
    } catch (e) {
      log.error("queryMappingItem error", e);
    }
  }

  const queryItem = (id) => {
    // Query definition
    var objQuery = query.create({type: query.Type.ITEM});
    // Columns
    objQuery.columns = [
      objQuery.createColumn({
        alias: "id",
        fieldId: "id",
      }),
      objQuery.createColumn({
        alias: "fullname",
        fieldId: "itemid",
      }),
      objQuery.createColumn({
        alias: "saleunit",
        fieldId: "saleunit",
      }),
      objQuery.createColumn({
        alias: "saleunittext",
        fieldId: "saleunit",
        context: query.FieldContext.DISPLAY,
      }),
      objQuery.createColumn({
        alias: "price",
        fieldId: "price.price",
      }),
    ];
    // Conditions
    var conditionList = [];
    if (!clib.isEmpty(id))
      conditionList.push(
          objQuery.createCondition({
            operator: query.Operator.EQUAL,
            values: id,
            fieldId: "id",
          })
      );
    /*        conditionList.push(
                    objQuery.createCondition({
                        operator: query.Operator.IS,
                        values: [false],
                        fieldId: "isinactive",
                    })
                );
                conditionList.push(
                    objQuery.createCondition({
                        operator: query.Operator.ANY_OF,
                        values: ["InvtPart", "Assembly"],
                        fieldId: "itemtype",
                    })
                );*/

    objQuery.condition = objQuery.and(conditionList);
    // Paged execution
    var objPagedData = objQuery.runPaged({pageSize: 1000});
    // Paging
    var arrResults = [];
    objPagedData.pageRanges.forEach(function (pageRange) {
      var objPage = objPagedData.fetch({index: pageRange.index}).data;

      // Map results to columns
      arrResults.push.apply(arrResults, objPage.asMappedResults());
    });
    return arrResults;
  };

  const querySubsidiary = () => {
    // Query definition
    var objQuery = query.create({type: query.Type.SUBSIDIARY});
    // Columns
    objQuery.columns = [
      objQuery.createColumn({
        alias: "id",
        fieldId: "id",
      }),
      objQuery.createColumn({
        alias: "fullname",
        fieldId: "fullname",
      }),
    ];
    // Conditions
    /*
                            var conditionList = [];
                            conditionList.push(objQuery.createCondition({
                                "operator": query.Operator.ANY_OF,
                                "values": accounts,
                                "fieldId": "id"
                            }));

                            objQuery.condition = objQuery.and(conditionList);
                */
    // Paged execution
    var objPagedData = objQuery.runPaged({pageSize: 1000});
    // Paging
    var arrResults = [];
    objPagedData.pageRanges.forEach(function (pageRange) {
      var objPage = objPagedData.fetch({index: pageRange.index}).data;

      // Map results to columns
      arrResults.push.apply(arrResults, objPage.asMappedResults());
    });
    return arrResults;
  };

  const queryAccount = (accounts) => {
    // Query definition
    var objQuery = query.create({type: query.Type.ACCOUNT});
    // Columns
    objQuery.columns = [
      objQuery.createColumn({
        alias: "id",
        fieldId: "id",
      }),
      objQuery.createColumn({
        alias: "description",
        fieldId: "description",
      }),
      objQuery.createColumn({
        alias: "accountshow",
        formula:
            "CONCAT(CONCAT({acctnumber}, ' '),{accountsearchdisplaynamecopy})",
        type: query.ReturnType.STRING,
      }),
    ];
    // Conditions
    var conditionList = [];
    conditionList.push(
        objQuery.createCondition({
          operator: query.Operator.ANY_OF,
          values: accounts,
          fieldId: "id",
        })
    );

    objQuery.condition = objQuery.and(conditionList);
    // Paged execution
    var objPagedData = objQuery.runPaged({pageSize: 1000});
    // Paging
    var arrResults = [];
    objPagedData.pageRanges.forEach(function (pageRange) {
      var objPage = objPagedData.fetch({index: pageRange.index}).data;

      // Map results to columns
      arrResults.push.apply(arrResults, objPage.asMappedResults());
    });
    return arrResults;
  };

  function getMaxEmp() {
    try {
      // Query definition
      var objQuery = query.create({type: "customrecord_scv_emp"});
      // Columns
      objQuery.columns = [
        objQuery.createColumn({
          alias: "id",
          fieldId: "id",
          aggregate: query.Aggregate.MAXIMUM,
        }),
      ];
      // Paged execution
      var objPagedData = objQuery.runPaged({pageSize: 1000});
      // Paging
      var arrResults = [];
      objPagedData.pageRanges.forEach(function (pageRange) {
        var objPage = objPagedData.fetch({index: pageRange.index}).data;

        // Map results to columns
        arrResults.push.apply(arrResults, objPage.asMappedResults());
      });
      return arrResults;
    } catch (e) {
      log.error("getMaxEmpName error", JSON.stringify(e));
    }
  }

  function createWriteCheck(lenhchi) {
    var lenhchiExpenseData = slib.getRecordData(
        "custompurchase_scv_lenhchi",
        lenhchi,
        "expense",
        [
          "custbody_scv_com_name",
          'subsidiary',
          "account",
          "currency",
          "custbody_scv_emp_number",
          "exchangerate",
          "trandate",
          "memo",
          "custbody_scv_doc_number",
          "department",
          "cseg_scv_sg_proj",
          "custbody_scv_vas_cf",
          "custbody_scv_enclose",
          "custbody_scv_nguoi_nhan_sec",
          "custbody_scv_nguoi_ky_1",
          "custbody_scv_pay_at_bank",
          'custbody_scv_phieuchi_inv',
          'custbody_scv_nop_ho_thue'
        ],
        [
          "account",
          "amount",
          "custcol_scv_sumtrans_line_taxcode",
          "memo",
          "location",
          "custcol_scv_cfsection",
          "custcol_scv_pr",
          "custcol_scv_entity_line",
          "custcol_scv_invoice_pattern",
          "custcol_scv_invoice_number",
          "custcol_scv_invoice_serial",
          "custcol_scv_invoice_date",
          'cseg_scv_cs_budcode',
          'custcol_scv_payment_request',
          'cseg_scv_sg_proj',
          'cseg_scv_loan',
          'custcol_scv_emp_number',
          'custcol_scv_cp_ko_hoply',
          'custcol_scv_machuong',
          'custcol_scv_ky_thue',
          'custcol_scv_matieumuc',
          'custcol_so_to_khai'
        ]
    );
    var options = {
      customform: "109",
      entity: lenhchiExpenseData.body.custbody_scv_com_name,
      subsidiary: lenhchiExpenseData.body.subsidiary,
      account: lenhchiExpenseData.body.account,
      currency: lenhchiExpenseData.body.currency,
      custbody_scv_emp_number: lenhchiExpenseData.body.custbody_scv_emp_number,
      exchangerate: lenhchiExpenseData.body.exchangerate,
      trandate: lenhchiExpenseData.body.trandate,
      memo: lenhchiExpenseData.body.memo,
      custbody_scv_doc_number: lenhchiExpenseData.body.custbody_scv_doc_number,
      custbody_scv_created_transaction: lenhchi,
      department: lenhchiExpenseData.body.department,
      cseg_scv_sg_proj: lenhchiExpenseData.body.cseg_scv_sg_proj,
      custbody_scv_vas_cf: lenhchiExpenseData.body.custbody_scv_vas_cf,
      custbody_scv_enclose: lenhchiExpenseData.body.custbody_scv_enclose,
      custbody_scv_nguoi_nhan_sec: lenhchiExpenseData.body.custbody_scv_nguoi_nhan_sec,
      custbody_scv_nguoi_ky_1: lenhchiExpenseData.body.custbody_scv_nguoi_ky_1,
      custbody_scv_com_name: lenhchiExpenseData.body.custbody_scv_com_name,
      custbody_scv_pay_at_bank: lenhchiExpenseData.body.custbody_scv_pay_at_bank,
      custbody_scv_phieuchi_inv: lenhchiExpenseData.body.custbody_scv_phieuchi_inv,
      custbody_scv_nop_ho_thue: lenhchiExpenseData.body.custbody_scv_nop_ho_thue,
    };
    var sublist = [];
    util.each(lenhchiExpenseData.sublist, function (o) {
      var obj = {
        account: o.account,
        amount: o.amount,
        taxcode: o.custcol_scv_sumtrans_line_taxcode,
        memo: o.memo,
        location: o.location,
        custcol_scv_cfsection: o.custcol_scv_cfsection,
        custcol_scv_pr: o.custcol_scv_pr,
        custcol_scv_entity_line: o.custcol_scv_entity_line,
        custcol_scv_invoice_pattern: o.custcol_scv_invoice_pattern,
        custcol_scv_invoice_number: o.custcol_scv_invoice_number,
        custcol_scv_invoice_serial: o.custcol_scv_invoice_serial,
        custcol_scv_invoice_date: o.custcol_scv_invoice_date,
        cseg_scv_cs_budcode: o.cseg_scv_cs_budcode,
        custcol_scv_payment_request: o.custcol_scv_payment_request,
        cseg_scv_sg_proj: o.cseg_scv_sg_proj,
        cseg_scv_loan: o.cseg_scv_loan,
        custcol_scv_emp_number: o.custcol_scv_emp_number,
        custcol_scv_cp_ko_hoply: o.custcol_scv_cp_ko_hoply,
        custcol_scv_machuong: o.custcol_scv_machuong,
        custcol_scv_ky_thue: o.custcol_scv_ky_thue,
        custcol_scv_matieumuc: o.custcol_scv_matieumuc,
        custcol_so_to_khai: o.custcol_so_to_khai
      };
      sublist.push(obj);
    });
    var checkRecordId = slib.createRecord(
        record.Type.CHECK,
        "expense",
        options,
        sublist
    );

    return checkRecordId;
  }

  /**
   *
   * @param options
   * @param options.subsidiary
   * @param options.orderType
   * @param options.adjustmentAccount
   * @param options.memo
   * @param options.date
   * @param options.nguoitaophieu
   * @param options.item
   * @param options.location
   * @param options.adjustQtyBy
   * @param options.unitCost
   * @param options.project
   */
  function createInventoryAdjustment(options) {
    var newRecord = record.create({
      type: record.Type.INVENTORY_ADJUSTMENT,
      isDynamic: true,
    });
    var setBodyField = [
      {fieldId: "subsidiary", value: options.subsidiary},
      {fieldId: "memo", value: options.memo},
      {fieldId: "custbody_scv_order_type", value: options.orderType},
      {fieldId: "account", value: options.adjustmentAccount}, //2880
      {
        fieldId: "trandate",
        value: format.parse({value: options.date, type: format.Type.DATE}),
      },
    ];
    util.each(setBodyField, function (o) {
      newRecord.setValue(o.fieldId, o.value);
    });
    //set sublist
    var setSublistValues = [
      {fieldId: "item", value: options.item},
      {fieldId: "location", value: options.location},
      {fieldId: "adjustqtyby", value: options.adjustQtyBy},
      {fieldId: "unitcost", value: options.unitCost},
      {fieldId: "cseg_scv_sg_proj", value: options.project},
    ];
    var sublistId = "inventory";
    newRecord.selectNewLine({sublistId: sublistId});
    util.each(setSublistValues, function (o) {
      if (!clib.isEmpty(o.value))
        newRecord.setCurrentSublistValue({
          sublistId: sublistId,
          fieldId: o.fieldId,
          value: o.value,
        });
    });
    newRecord.commitLine({sublistId: sublistId});

    //have lot number item
    /*if (!clib.isEmpty(o.lotReceipt)) {
                    var newInvDetail = newRecord.getCurrentSublistSubrecord({
                        sublistId: 'inventory',
                        fieldId: 'inventorydetail'
                    });
                    newInvDetail.selectNewLine({sublistId: 'inventoryassignment'});
                    newInvDetail.setCurrentSublistValue({
                        sublistId: 'inventoryassignment',
                        fieldId: 'receiptinventorynumber',
                        value: o.lotReceipt
                    });
                    newInvDetail.setCurrentSublistValue({
                        sublistId: 'inventoryassignment',
                        fieldId: 'quantity',
                        value: o.quantity
                    });
                    newInvDetail.commitLine({sublistId: 'inventoryassignment'});
                }*/

    var id = newRecord.save({
      enableSourcing: false,
      ignoreMandatoryFields: true,
    });
    return id;
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
   * @return {*[]}
   */
  function searchLandItems(options) {
    var results = [];
    //WHA Leasable area items
    var objSearch = search.load({id: "customsearch_scv_landitems"});
    var internalIdCol = search.createColumn({name: "internalid"});
    objSearch.columns.push(internalIdCol);
    if (!clib.isEmpty(options.subsidiary))
      objSearch.filters.push(
          search.createFilter({
            name: "subsidiary",
            operator: search.Operator.ANYOF,
            values: [options.subsidiary],
          })
      );
    if (!clib.isEmpty(options.project))
      objSearch.filters.push(
          search.createFilter({
            name: "cseg_scv_sg_proj",
            operator: search.Operator.ANYOF,
            values: [options.project],
          })
      );
    if (!clib.isEmpty(options.item[0]))
      objSearch.filters.push(
          search.createFilter({
            name: "internalid",
            operator: search.Operator.ANYOF,
            values: options.item,
          })
      );

    var c = objSearch.columns;
    const invoiceSearchPagedData = objSearch.runPaged({pageSize: 1000});
    for (let i = 0; i < invoiceSearchPagedData.pageRanges.length; i++) {
      const invoiceSearchPage = invoiceSearchPagedData.fetch({index: i});
      invoiceSearchPage.data.forEach(function (result) {
        var obj = {};
        obj.id = result.getValue(internalIdCol);
        obj.name = result.getValue(c[0]);
        obj.itemCategory = result.getText(c[7]);
        obj.projectId = result.getValue(c[8]);
        obj.projectName = result.getText(c[8]);
        obj.areaHa = result.getValue(c[5]);
        obj.sellableArea = _.toNumber(result.getValue(c[6]));
        obj.subsidiary = result.getValue(c[10]);
        results.push(obj);
      });
    }
    return results;
  }

  function searchPrincipalDetail(options) {
    var results = [];
    //Principal Detail
    const detailSearchColName = search.createColumn({
      name: "name",
      sort: search.Sort.ASC,
    });
    const detailSearchColAmount = search.createColumn({
      name: "custrecord_scv_db_pd_amount",
    });
    const detailSearchColPaymentDate = search.createColumn({
      name: "custrecord_scv_db_pd_start_date",
    });
    const detailSearchColNotes = search.createColumn({
      name: "custrecord_scv_db_pd_notes",
    });
    const detailSearch = search.create({
      type: "customrecord_scv_db_principal_detail",
      filters: [],
      columns: [
        detailSearchColName,
        detailSearchColAmount,
        detailSearchColPaymentDate,
        detailSearchColNotes,
      ],
    });
    const detailSearchPagedData = detailSearch.runPaged({pageSize: 1000});
    for (let i = 0; i < detailSearchPagedData.pageRanges.length; i++) {
      const detailSearchPage = detailSearchPagedData.fetch({index: i});
      detailSearchPage.data.forEach(function (result) {
        var o = {
          name: result.getValue(detailSearchColName),
          amount: result.getValue(detailSearchColAmount),
          paymentdate: result.getValue(detailSearchColPaymentDate),
        };
        results.push(o);
      });
    }
    return results;
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
   * @return {*[]}
   */
  function searchProjectBudgetTracking(options) {
    var results = [];
    //WHA Project budget tracking
    var objSearch = search.load({id: "customsearch_scv_sop_2_2"});
    var c = objSearch.columns;

    /*if (!clib.isEmpty(options.fromdate) && !clib.isEmpty(options.todate)) {
                    objSearch.filters.push(search.createFilter({
                        name: 'trandate',
                        operator: search.Operator.WITHIN,
                        values: [options.fromdate, options.todate]
                    }));
                }*/
    if (!clib.isEmpty(options.subsidiary))
      objSearch.filters.push(
          search.createFilter({
            name: "subsidiary",
            operator: search.Operator.ANYOF,
            values: [options.subsidiary],
          })
      );
    if (!clib.isEmpty(options.project))
      objSearch.filters.push(
          search.createFilter({
            name: "line.cseg_scv_sg_proj",
            operator: search.Operator.ANYOF,
            values: [options.project],
          })
      );

    const invoiceSearchPagedData = objSearch.runPaged({pageSize: 1000});
    for (let i = 0; i < invoiceSearchPagedData.pageRanges.length; i++) {
      const invoiceSearchPage = invoiceSearchPagedData.fetch({index: i});
      invoiceSearchPage.data.forEach(function (result) {
        var obj = {};
        obj.projectId = result.getValue(c[2]);
        obj.projectName = result.getText(c[2]);
        obj.amtYear = _.toNumber(result.getValue(c[8]));
        // obj.areaHa = result.getValue(c[5]);
        // obj.sellableArea = result.getValue(c[6]);
        results.push(obj);
      });
    }
    return results;
  }

  /**
   *
   * @param options
   * @param options.custbody_scv_apply_payment_schedule
   * @return {*[]}
   */
  function searchApplyPaymentSchedule(options) {
    var results = [];
    //WHA Payment apply payment schedule
    var objSearch = search.load({
      id: "customsearch_scv_apply_paymen_schedule",
    });
    var c = objSearch.columns;
    if (!clib.isEmpty(options.custbody_scv_apply_payment_schedule))
      objSearch.filters.push(
          search.createFilter({
            name: "custbody_scv_apply_payment_schedule",
            operator: search.Operator.ANYOF,
            values: [options.custbody_scv_apply_payment_schedule],
          })
      );

    const objSearchPagedData = objSearch.runPaged({pageSize: 1000});
    for (let i = 0; i < objSearchPagedData.pageRanges.length; i++) {
      const objSearchPage = objSearchPagedData.fetch({index: i});
      objSearchPage.data.forEach(function (result) {
        var obj = {};
        // obj.projectId = result.getValue(c[2]);
        obj.amount = _.toNumber(result.getValue(c[4]));
        results.push(obj);
      });
    }
    return results;
  }

  /**
   id:'7',
   name: "Khế ước vay ngày 1/1/2021",
   loa_type: "2",
   loa_entity: "99",
   loa_currency: "1",
   loa_start_date: "01/01/2021",
   loa_end_date: "31/12/2021",
   loa_interestrate: "10.0%",
   dl_ratetype: "1",
   dl_prinpaydate: "01/02/2021",
   dl_prinpayperiod: "12",
   inspaymentdate: "01/02/2021",
   dl_inpaymentperiod: "12",
   db_projectname: "1,2",
   id_rate: "10.0%",
   idstartdate: "01/01/2021",
   id_enddate: "30/06/2021",
   loanamt: "1000000000"
   internalid: "2" //internal id of project
   * @param options
   * @param options.subsidiary
   * @param options.debitloan
   * @return {*[]}
   */
  function searchDebitLoan(options) {
    var results = [];
    //WHA Debit/loan list: Results
    var objSearch = search.load({id: "customsearch_scv_list_debitloan"});
    /*objSearch.columns.push(search.createColumn({
                    name: "internalid",
                    join: "CUSTRECORD_SCV_DB_PROJECTNAME",
                    label: "Internal ID"
                }));
                objSearch.columns.push(search.createColumn({
                    name: "name",
                    join: "CUSTRECORD_SCV_DB_PROJECTNAME",
                    label: "Name"
                }));*/

    var c = objSearch.columns;

    if (!clib.isEmpty(options.subsidiary))
      objSearch.filters.push(
          search.createFilter({
            name: "custrecord_scv_db_subsidiary",
            operator: search.Operator.ANYOF,
            values: [options.subsidiary],
          })
      );
    if (!_.isEmpty(options.debitloan))
      objSearch.filters.push(
          search.createFilter({
            name: "internalid",
            operator: search.Operator.ANYOF,
            values: options.debitloan,
          })
      );

    const objSearchPagedData = objSearch.runPaged({pageSize: 1000});
    for (let i = 0; i < objSearchPagedData.pageRanges.length; i++) {
      const invoiceSearchPage = objSearchPagedData.fetch({index: i});
      invoiceSearchPage.data.forEach(function (result) {
        var obj = {id: result.id};
        util.each(c, (col) => {
          obj[col.name] = result.getValue(col);
          if (col.name == "custrecord_scv_loa_currency")
            obj[col.name + "name"] = result.getText(col);
        });
        results.push(obj);
      });
    }
    // results = _.reject(results, {custrecord_scv_id_rate: '12.0%'});
    return results;
  }

  function searchDebitLoan2(options) {
    var results = [];
    //WHA Debit/loan list: Results
    var objSearch = search.create({
      type: "customrecord_cseg_scv_loan",
      filters: [],
      columns: [
        search.createColumn({
          name: "name",
          sort: search.Sort.ASC,
          label: "Name",
        }),
        search.createColumn({
          name: "custrecord_scv_loa_type",
          label: "AGREEMENT TYPE",
        }),
        search.createColumn({
          name: "custrecord_scv_loa_entity",
          label: "Entity",
        }),
        search.createColumn({
          name: "custrecord_scv_loa_currency",
          label: "CURRENCY",
        }),
        search.createColumn({
          name: "custrecord_scv_loa_start_date",
          label: "START DATE",
        }),
        search.createColumn({
          name: "custrecord_scv_loa_end_date",
          label: "END DATE",
        }),
        search.createColumn({
          name: "custrecord_scv_loa_interestrate",
          label: "INTEREST RATE",
        }),
        search.createColumn({
          name: "custrecord_scv_dl_ratetype",
          label: "Rate type",
        }),
        search.createColumn({
          name: "custrecord_scv_dl_prinpaydate",
          label: "Principal payment date",
        }),
        search.createColumn({
          name: "custrecord_scv_dl_prinpayperiod",
          label: "Principal payment period",
        }),
        search.createColumn({
          name: "custrecord_scv_inspaymentdate",
          label: "Interest payment date",
        }),
        search.createColumn({
          name: "custrecord_scv_dl_inpaymentperiod",
          label: "Interest payment period",
        }),
        search.createColumn({
          name: "custrecord_scv_db_projectname",
          label: "Project name",
        }),
        /*search.createColumn({
                                    name: "custrecord_scv_id_rate",
                                    join: "CUSTRECORD_SCV_INTERPARENT",
                                    label: "%Rate"
                                }),
                                search.createColumn({
                                    name: "custrecord_scv_idstartdate",
                                    join: "CUSTRECORD_SCV_INTERPARENT",
                                    label: "Start date"
                                }),
                                search.createColumn({
                                    name: "custrecord_scv_id_enddate",
                                    join: "CUSTRECORD_SCV_INTERPARENT",
                                    label: "End date"
                                }),*/
        search.createColumn({
          name: "custrecord_scv_loanamt",
          label: "Loan amount",
        }),
        search.createColumn({
          name: "internalid",
          join: "CUSTRECORD_SCV_DB_PROJECTNAME",
          label: "Internal ID",
        }),
      ],
    });

    var c = objSearch.columns;

    if (!clib.isEmpty(options.subsidiary))
      objSearch.filters.push(
          search.createFilter({
            name: "custrecord_scv_db_subsidiary",
            operator: search.Operator.ANYOF,
            values: [options.subsidiary],
          })
      );
    if (!_.isEmpty(options.debitloan))
      objSearch.filters.push(
          search.createFilter({
            name: "internalid",
            operator: search.Operator.ANYOF,
            values: options.debitloan,
          })
      );

    const objSearchPagedData = objSearch.runPaged({pageSize: 1000});
    for (let i = 0; i < objSearchPagedData.pageRanges.length; i++) {
      const invoiceSearchPage = objSearchPagedData.fetch({index: i});
      invoiceSearchPage.data.forEach(function (result) {
        var obj = {id: result.id};
        util.each(c, (col) => {
          obj[col.name] = result.getValue(col);
          if (col.name == "custrecord_scv_loa_currency")
            obj[col.name + "name"] = result.getText(col);
        });
        results.push(obj);
      });
    }
    return results;
  }

  /**
   * WHA Loan principal and interest Spreadsheet
   * {
   name: "Lãi - Khế ước vay ngày 1/1/2021 ",
   custrecord_scv_db_sheet: "7",
   custrecord_scv_db_sheet_type: "2",
   custrecord_scv_dbsheet_paymentdate: "31/10/2021",
   custrecord_scv_sheet_rate: "10.0%",
   custrecord_scv_sheet_amt: "100000",
   custrecord_scv_sheet_status: "1",
   custrecord_scv_sheet_documentnumber: ""
   }
   * @param options
   * @param options.custrecord_scv_db_sheet
   * @param options.custrecord_scv_db_sheet_type
   * @param options.fromdate
   * @param options.todate
   * @param options.custrecord_scv_db_sheet_type
   * @return {*[]}
   */
  function searchLoanAndInterestSheet(options) {
    var results = [];
    var objSearch = search.load({
      id: "customsearch_scv_loanandinterestsheet",
    });
    var c = objSearch.columns;

    if (!clib.isEmpty(options.fromdate) && !clib.isEmpty(options.todate))
      objSearch.filters.push(
          search.createFilter({
            name: "custrecord_scv_dbsheet_paymentdate",
            operator: search.Operator.WITHIN,
            values: [options.fromdate, options.todate],
          })
      );
    if (!clib.isEmpty(options.custrecord_scv_db_sheet_type))
      objSearch.filters.push(
          search.createFilter({
            name: "custrecord_scv_db_sheet_type",
            operator: search.Operator.ANYOF,
            values: [options.custrecord_scv_db_sheet_type],
          })
      );
    if (!clib.isEmpty(options.custrecord_scv_db_sheet))
      objSearch.filters.push(
          search.createFilter({
            name: "custrecord_scv_db_sheet",
            operator: search.Operator.ANYOF,
            values: [options.custrecord_scv_db_sheet],
          })
      );

    const objSearchPagedData = objSearch.runPaged({pageSize: 1000});
    for (let i = 0; i < objSearchPagedData.pageRanges.length; i++) {
      const invoiceSearchPage = objSearchPagedData.fetch({index: i});
      invoiceSearchPage.data.forEach(function (result) {
        var obj = {};
        obj.id = result.id;
        util.each(c, (col) => {
          // var colname = _.replace(col.name, 'custrecord_scv_', '');
          obj[col.name] = result.getValue(col);
        });
        results.push(obj);
      });
    }
    return results;
  }

  /**
   *
   * @param options
   * @param {Array} options.id
   */
  function searchProject(options) {
    var projSearchObj = search.create({
      type: "customrecord_cseg_scv_sg_proj",
      columns: [
        search.createColumn({
          name: "name",
          sort: search.Sort.ASC,
          label: "Name",
        }),
        search.createColumn({name: "internalid", label: "Internal Id"}),
        // search.createColumn({name: "custrecord_scv_prj_type", label: "Project type"})
      ],
    });
    if (!_.isEmpty(options.id))
      projSearchObj.filters.push(
          search.createFilter({
            name: "internalid",
            operator: search.Operator.ANYOF,
            values: options.id,
          })
      );
    var col = projSearchObj.columns;
    var results = [];
    projSearchObj.run().each(function (result) {
      // .run().each has a limit of 4,000 results
      var o = {};
      util.each(
          col,
          (c) =>
              (o[_.replace(c.name, "custrecord_scv_", "")] = result.getValue(c))
      );
      results.push(o);
      return true;
    });
    return results;
  }

  function searchDebitLoanAcountingSetup(debitLoan) {
    try {
      var customrecord_scv_dbaccountingsetupSearchObj = search.create({
        type: "customrecord_scv_dbaccountingsetup",
        filters: [["custrecord_scv_dbacc_debitloan", "anyof", debitLoan]],
        columns: [
          search.createColumn({
            name: "name",
            sort: search.Sort.ASC,
            label: "Name",
          }),
          // search.createColumn({name: "custrecord_scv_dbacc_debitloan", label: "Debit/loan"}),
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
        ],
      });
      var o = {};
      customrecord_scv_dbaccountingsetupSearchObj.run().each(function (result) {
        // .run().each has a limit of 4,000 results
        o.custrecord_scv_debacc_prinacc = result.getValue({
          name: "custrecord_scv_debacc_prinacc",
        });
        o.custrecord_scv_dbacc_prepaidacc = result.getValue({
          name: "custrecord_scv_dbacc_prepaidacc",
        });
        return true;
      });
      return o;
    } catch (e) {
      log.error("searchDebitLoanAcoutingSetup error", e);
    }
  }

  /**
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
   * @return {*[]}
   */
  function searchProjectActualAmount(options) {
    var results = [];
    //WHA Project budget tracking
    var objSearch = search.load({id: "customsearch_scv_projectactualamt"});
    var c = objSearch.columns;

    if (!clib.isEmpty(options.fromdate) && !clib.isEmpty(options.todate)) {
      objSearch.filters.push(
          search.createFilter({
            name: "trandate",
            operator: search.Operator.WITHIN,
            values: [options.fromdate, options.todate],
          })
      );
    }
    if (!clib.isEmpty(options.subsidiary))
      objSearch.filters.push(
          search.createFilter({
            name: "subsidiary",
            operator: search.Operator.ANYOF,
            values: [options.subsidiary],
          })
      );
    if (!clib.isEmpty(options.project))
      objSearch.filters.push(
          search.createFilter({
            name: "line.cseg_scv_sg_proj",
            operator: search.Operator.ANYOF,
            values: [options.project],
          })
      );

    const invoiceSearchPagedData = objSearch.runPaged({pageSize: 1000});
    for (let i = 0; i < invoiceSearchPagedData.pageRanges.length; i++) {
      const invoiceSearchPage = invoiceSearchPagedData.fetch({index: i});
      invoiceSearchPage.data.forEach(function (result) {
        var obj = {};
        obj.projectId = result.getValue(c[0]);
        obj.projectName = result.getText(c[0]);
        obj.amount = _.toNumber(result.getValue(c[6]));
        results.push(obj);
      });
    }
    return results;
  }

  /**
   *          *{
   sg_proj: "",
   type: "VendBill",
   bd_level1: "5",
   bl_level2: "4",
   bl_level3: "7",
   cs_budcode: "20",
   amount: "960000.00"
   }
   * @param options
   * @param options.fromdate
   * @param options.todate
   * @param options.subsidiary
   * @param options.project
   * @return {*[]}
   */
  function searchProjectActualAmount2(options) {
    var results = [];
    //WHA Project budget tracking
    var objSearch = search.load({id: "customsearch_scv_projectactualamt"});
    var col = objSearch.columns;

    // if (!clib.isEmpty(options.fromdate) && !clib.isEmpty(options.todate)) {
    //     objSearch.filters.push(
    //         search.createFilter({
    //             name: "trandate",
    //             operator: search.Operator.WITHIN,
    //             values: [options.fromdate, options.todate],
    //         })
    //     );
    // }
    if (!clib.isEmpty(options.subsidiary))
      objSearch.filters.push(
          search.createFilter({
            name: "subsidiary",
            operator: search.Operator.ANYOF,
            values: [options.subsidiary],
          })
      );
    if (!clib.isEmpty(options.project))
      objSearch.filters.push(
          search.createFilter({
            name: "line.cseg_scv_sg_proj",
            operator: search.Operator.ANYOF,
            values: [options.project],
          })
      );
    if (!clib.isEmpty(options.debitloan))
      objSearch.filters.push(
          search.createFilter({
            name: "line.cseg_scv_loan",
            operator: search.Operator.ANYOF,
            values: [options.debitloan],
          })
      );

    const invoiceSearchPagedData = objSearch.runPaged({pageSize: 1000});
    for (let i = 0; i < invoiceSearchPagedData.pageRanges.length; i++) {
      const invoiceSearchPage = invoiceSearchPagedData.fetch({index: i});
      invoiceSearchPage.data.forEach(function (result) {
        var obj = {};
        util.each(col, (c) => {
          /*var colName = _.chain(c.name)
                                      .replace('formulacurrency', 'amount')
                                      .replace('line.cseg_scv_', '')
                                      .replace('line.cseg_scv_', '')
                                      .replace('custrecord_scv_', '')
                                      .value();*/
          obj[c.name] = result.getValue(c);
        });
        results.push(obj);
      });
    }
    return results;
  }

  /**
   *
   * @param options
   * @param options.subsidiary
   * @param options.project
   * @return {*[]}
   */
  function searchLandCostPosted(options) {
    var results = [];
    //WHA Project budget tracking
    var objSearch = search.load({id: "customsearch_scv_landcostposted"});
    if (!clib.isEmpty(options.subsidiary))
      objSearch.filters.push(
          search.createFilter({
            name: "subsidiary",
            operator: search.Operator.ANYOF,
            values: [options.subsidiary],
          })
      );
    if (!clib.isEmpty(options.project))
      objSearch.filters.push(
          search.createFilter({
            name: "line.cseg_scv_sg_proj",
            operator: search.Operator.ANYOF,
            values: [options.project],
          })
      );
    var c = objSearch.columns;

    const invoiceSearchPagedData = objSearch.runPaged({pageSize: 1000});
    for (let i = 0; i < invoiceSearchPagedData.pageRanges.length; i++) {
      const invoiceSearchPage = invoiceSearchPagedData.fetch({index: i});
      invoiceSearchPage.data.forEach(function (result) {
        var obj = {
          subsidiary: result.getValue(c[0]),
          project: result.getValue(c[1]),
          item: result.getValue(c[2]),
        };
        results.push(obj);
      });
    }
    return results;
  }

  /**
   *
   * @param options
   * @param options.subsidiary
   * @param options.year
   * @param{Array} options.department
   * @param{Array} options.budgetcode
   // * @param options.type
   * @return {*[]}
   */
  function searchExpenseBudgetActual(options) {
    //Expense budget actual vs budget by BD: Results
    var filters = [];
    if (!clib.isEmpty(options.subsidiary))
      filters.push(
          search.createFilter({
            name: "subsidiary",
            operator: search.Operator.ANYOF,
            values: [options.subsidiary],
          })
      );
    if (!_.isEmpty(options.budgetcode))
      filters.push(
          search.createFilter({
            name: "line.cseg_scv_cs_budcode",
            operator: search.Operator.ANYOF,
            values: options.budgetcode,
          })
      );
    if (!_.isEmpty(options.department))
      filters.push(
          search.createFilter({
            name: "department",
            operator: search.Operator.ANYOF,
            values: options.department,
          })
      );
    if (!clib.isEmpty(options.year))
      filters.push(
          search.createFilter({
            name: "formulatext",
            formula: "concat ('FY ',SUBSTR({accountingperiod.parent},4,4))",
            operator: search.Operator.CONTAINS,
            values: "FY " + options.year,
          })
      );
    var cols = ["budgetcode", "department", "remainingbudget", 'projectnames'];
    var results = slib.searchData(
        "customsearch_scv_bpl_tracking_2",
        filters,
        cols
    );
    return results;
  }

  /**
   * WHA Expense budget actual vs budget by BD (don't edit)
   * @param options
   * @param options.subsidiary
   * @param options.year
   * @param{Array} options.department
   * @param{Array} options.budgetcode
   * @param{Array} options.fromdate
   * @param{Array} options.todate
   // * @param options.type
   * @return {*[]}
   */
  function searchExpenseBudgetActual2(options) {
    var filters = [];
    if (!clib.isEmpty(options.subsidiary))
      filters.push(
          search.createFilter({
            name: "subsidiary",
            operator: search.Operator.ANYOF,
            values: [options.subsidiary],
          })
      );
    if (!_.isEmpty(options.budgetcode))
      filters.push(
          search.createFilter({
            name: "line.cseg_scv_cs_budcode",
            operator: search.Operator.ANYOF,
            values: options.budgetcode,
          })
      );
    if (!_.isEmpty(options.department))
      filters.push(
          search.createFilter({
            name: "department",
            operator: search.Operator.ANYOF,
            values: options.department,
          })
      );
    if (!clib.isEmpty(options.fromdate) && !clib.isEmpty(options.todate))
      filters.push(
          search.createFilter({
            name: "trandate",
            operator: search.Operator.WITHIN,
            values: [options.fromdate, options.todate],
          })
      );

    if (!clib.isEmpty(options.year))
      filters.push(
          search.createFilter({
            name: "formulatext",
            formula: "concat ('FY ',SUBSTR({accountingperiod.parent},4,4))",
            operator: search.Operator.CONTAINS,
            values: "FY " + options.year,
          })
      );
    var cols = ["budgetlevel1", "budgetlevel2", "budgetlevel3", 'budgetcode', 'budgetcode_text', 'remainingbudget', 'department'];
    var results = slib.searchData(
        "customsearch_scv_bpl_tracking_2",
        filters,
        cols
    );
    return results;
  }

  /**
   *
   * @param options
   * @param{Array} options.subsidiary
   * @param{Array} options.budgetcode
   * @param{Array} options.department
   * @return {*[]}
   */
  function searchPurchaseRequiLineBudgetCheck(options) {
    //WHA Purchase Requisition line Budget check
    var filters = [];
    var cols = ["amount", "budgetcode", "department", 'projectnames'];
    if (!clib.isEmpty(options.subsidiary))
      filters.push(
          search.createFilter({
            name: "custrecord_scv_req_subsidiary",
            join: "CUSTRECORD_SCV_PUR_REQ",
            operator: search.Operator.ANYOF,
            values: options.subsidiary,
          })
      );
    if (!_.isEmpty(options.budgetcode))
      filters.push(
          search.createFilter({
            name: "custrecord_scv_pr_budgetcode",
            operator: search.Operator.ANYOF,
            values: options.budgetcode,
          })
      );
    if (!_.isEmpty(options.department))
      filters.push(
          search.createFilter({
            name: "custrecord_scv_req_dep",
            // join: "CUSTRECORD_SCV_PUR_REQ",
            operator: search.Operator.ANYOF,
            values: options.department,
          })
      );
    var results = slib.searchData(
        "customsearch_scv_prline_budget_check",
        filters,
        cols
    );
    return results;
  }

  /**
   *{
   id: "54",
   CUSTRECORD_SCV_EMP_NUMBERcustrecord_scv_emp_subsidiary: "5",
   custrecord_scv_emp_number: "71",
   custrecord_scv_khoan_muc_phi: "4",
   custrecord_scv_emp_currency_fees: "2",
   custrecord_scv_quantity: "1",
   custrecord_scv_emp_rate: "1000000",
   custrecord_scv_amount: "1000000",
   custrecord_scv_emp_budget: "195",
   CUSTRECORD_SCV_EMP_NUMBERcustrecord_scv_emp_status: "20"
   }
   * @param sub
   * @param{Array} budgetcode
   * @param{Array} department
   * @return {*[]}
   */
  function searchEMPBudgetCheck(sub, budgetcode, department) {
    //EMP check budget code line (don't edit)
    var filters = [];
    if (!clib.isEmpty(sub))
      filters.push(
          search.createFilter({
            name: "custrecord_scv_emp_subsidiary",
            join: "CUSTRECORD_SCV_EMP_NUMBER",
            operator: search.Operator.ANYOF,
            values: sub,
          })
      );
    if (!_.isEmpty(department))
      filters.push(
          search.createFilter({
            name: "custrecord_scv_emp_bophan",
            join: "CUSTRECORD_SCV_EMP_NUMBER",
            operator: search.Operator.ANYOF,
            values: department,
          })
      );
    if (!_.isEmpty(budgetcode)) {
      filters.push(
          search.createFilter({
            name: "custrecord_scv_emp_budget",
            operator: search.Operator.ANYOF,
            values: budgetcode,
          })
      );
    }
    var cols = ["department", "budgetcode", "amounttocheck", 'projectnames'];
    var results = slib.searchData(
        "customsearch_scv_emp_detail_budget",
        filters,
        cols
    );
    return results;
  }

  /**
   * SCV Actual bill from PR approved (don't edit)
   * @param options
   * @param options.subsidiary
   * @param{Array} options.department
   * @param{Array} options.budgetcode
   * @return {[]}
   */
  function searchActualBill(options) {
    var filters = [];
    if (!clib.isEmpty(options.subsidiary)) {
      filters.push(
          search.createFilter({
            name: "subsidiary",
            operator: search.Operator.ANYOF,
            values: [options.subsidiary],
          })
      );
    }
    if (!_.isEmpty(options.department)) {
      filters.push(
          search.createFilter({
            name: "department",
            operator: search.Operator.ANYOF,
            values: options.department,
          })
      );
    }
    if (!_.isEmpty(options.budgetcode)) {
      filters.push(
          search.createFilter({
            name: "line.cseg_scv_cs_budcode",
            operator: search.Operator.ANYOF,
            values: options.budgetcode,
          })
      );
    }
    var cols = ["amount", "department", "budgetcode"];
    var results = slib.searchData(
        "customsearch_scv_actual_pr_emp_approve_2",
        filters,
        cols
    );
    return results;
  }

  /**
   * SCV PL.FS Report (Don't edit)
   * @param options
   * @param options.subsidiary
   * @param{Array} options.subsidiary
   * @param{string} options.fromdate
   * @param{string} options.todate
   * @return {[]}
   */
  function searchPLFSThailand(options) {
    var filters = [];
    if (!clib.isEmpty(options.subsidiary)) {
      filters.push(
          search.createFilter({
            name: "subsidiary",
            operator: search.Operator.ANYOF,
            values: [options.subsidiary],
          })
      );
    }
    if (!clib.isEmpty(options.fromdate) && !clib.isEmpty(options.todate)) {
      filters.push(
          search.createFilter({
            name: "trandate",
            operator: search.Operator.WITHIN,
            values: [options.fromdate, options.todate],
          })
      );
    }
    var cols = ["chitieu", 'chitieu_text', "amount"];
    var results = slib.searchData(
        "customsearch_scv_pl_tl",
        filters,
        cols
    );
    return results;
  }

  /**
   * SCV PL.Branch Report (Don't edit)
   * ["chitieu", 'chitieu_text', "amount",'accountpl']
   * @param options
   * @param{string} options.subsidiary
   * @param{string} options.fromdate
   * @param{string} options.todate
   * @return {[]}
   */
  function searchPLBranchThailand(options) {
    var filters = [];
    if (!clib.isEmpty(options.subsidiary)) {
      filters.push(
          search.createFilter({
            name: "subsidiary",
            operator: search.Operator.ANYOF,
            values: [options.subsidiary],
          })
      );
    }
    if (!clib.isEmpty(options.fromdate) && !clib.isEmpty(options.todate)) {
      filters.push(
          search.createFilter({
            name: "trandate",
            operator: search.Operator.WITHIN,
            values: [options.fromdate, options.todate],
          })
      );
    }
    var cols = ["chitieu", 'chitieu_text', "amount", 'accountpl'];
    var results = slib.searchData(
        "customsearch_scv_pl_tl_2",
        filters,
        cols
    );
    return results;
  }

  /**
   * SCV Actual EXP from EMP approved (don't edit)
   * @param options
   * @param options.subsidiary
   * @param{Array} options.department
   * @param{Array} options.budgetcode
   * @return {[]}
   */
  function searchActualEMP(options) {
    var filters = [];
    if (!clib.isEmpty(options.subsidiary)) {
      filters.push(
          search.createFilter({
            name: "subsidiary",
            operator: search.Operator.ANYOF,
            values: [options.subsidiary],
          })
      );
    }
    if (!_.isEmpty(options.budgetcode)) {
      filters.push(
          search.createFilter({
            name: "line.cseg_scv_cs_budcode",
            operator: search.Operator.ANYOF,
            values: options.budgetcode,
          })
      );
    }
    if (!_.isEmpty(options.department)) {
      filters.push(
          search.createFilter({
            name: "department",
            operator: search.Operator.ANYOF,
            values: options.department,
          })
      );
    }
    var cols = ["amount", "department", "budgetcode"];
    var results = slib.searchData(
        "customsearch_scv_actual_exp_remaining",
        filters,
        cols
    );
    return results;
  }

  /**
   * SCV Actual Check from PR approved (don't edit)
   * @param options
   * @param options.subsidiary
   * @param{Array} options.department
   * @param{Array} options.budgetcode
   * @return {[]}
   */
  function searchActualLCCheck(options) {
    var filters = [];
    if (!clib.isEmpty(options.subsidiary)) {
      filters.push(
          search.createFilter({
            name: "subsidiary",
            operator: search.Operator.ANYOF,
            values: [options.subsidiary],
          })
      );
    }
    if (!_.isEmpty(options.department)) {
      filters.push(
          search.createFilter({
            name: "department",
            operator: search.Operator.ANYOF,
            values: options.department,
          })
      );
    }
    if (!_.isEmpty(options.budgetcode)) {
      filters.push(
          search.createFilter({
            name: "line.cseg_scv_cs_budcode",
            operator: search.Operator.ANYOF,
            values: options.budgetcode,
          })
      );
    }
    var cols = ["amount", "department", "budgetcode"];
    var results = slib.searchData(
        "customsearch_scv_actual_check_from_pr",
        filters,
        cols
    );
    return results;
  }

  /**
   * WHA Budget codes list (don't edit)
   * @param options
   * @param options.subsidiary
   * @param{Array} options.department
   * @param{Array} options.budgetcode1
   * @return {[]}
   */
  function searchBudgetcodeslist(options) {
    var filters = [];
    if (!clib.isEmpty(options.subsidiary)) {
      filters.push(
          search.createFilter({
            name: "custrecord_scv_budget_code_sub",
            operator: search.Operator.ANYOF,
            values: [options.subsidiary],
          })
      );
    }
    if (!_.isEmpty(options.department)) {
      filters.push(
          search.createFilter({
            name: "custrecord_scv_budget_code_dept",
            operator: search.Operator.ANYOF,
            values: options.department,
          })
      );
    }
    if (!_.isEmpty(options.budgetcode1)) {
      filters.push(
          search.createFilter({
            name: "custrecord_scv_bd_level1",
            operator: search.Operator.ANYOF,
            values: options.budgetcode1,
          })
      );
    }
    var cols = ['budgetlevel1', 'budgetlevel1_text', 'budgetlevel2', 'budgetlevel2_text', 'budgetlevel3', 'budgetlevel3_text', 'department', 'departmentcode'];
    var results = slib.searchData(
        "customsearch_scv_budgetcodewiew",
        filters,
        cols
    );
    return results;
  }

  function searchBudgetlevel1(options) {
    var filters = [];
    var cols = ['id', 'name'];
    var results = slib.searchData('customsearch_scv_danh_sach_bd_level_1', filters, cols);
    return results;
  }

  /**
   * SCV Commit Actual Budget: Results
   * @param options
   * @param options.subsidiary
   * @param options.department
   * @param options.budgetcode
   * @return {[]}
   */
  function searchCommitActualBudget(options) {
    var filters = [];
    if (!clib.isEmpty(options.subsidiary)) {
      filters.push(
          search.createFilter({
            name: "subsidiary",
            operator: search.Operator.ANYOF,
            values: [options.subsidiary],
          })
      );
    }
    if (!_.isEmpty(options.department)) {
      filters.push(
          search.createFilter({
            name: "department",
            operator: search.Operator.ANYOF,
            values: options.department,
          })
      );
    }
    if (!_.isEmpty(options.budgetcode)) {
      filters.push(
          search.createFilter({
            name: "line.cseg_scv_cs_budcode",
            operator: search.Operator.ANYOF,
            values: options.budgetcode,
          })
      );
    }
    var cols = ["amount", "department", "budgetcode", 'projectnames'];
    var results = slib.searchData(
        "customsearch_scv_actual_budget",
        filters,
        cols
    );
    return results;
  }

  /**
   * SCV RP_DTNN (Don't edit)
   * @param options
   * @param options.subsidiary
   * @param options.fromdate
   * @param options.todate
   * @return {[]}
   */
  function searchRP_DTNN(options) {
    var filters = [];
    if (!clib.isEmpty(options.subsidiary)) {
      filters.push(
          search.createFilter({
            name: "subsidiary",
            operator: search.Operator.ANYOF,
            values: [options.subsidiary],
          })
      );
    }
    if (!clib.isEmpty(options.fromdate) && !clib.isEmpty(options.todate)) {
      filters.push(
          search.createFilter({
            name: "trandate",
            operator: search.Operator.WITHIN,
            values: [options.fromdate, options.todate],
          })
      );
    }

    var cols = ["chitieu", 'chitieu_text', "amount"];
    var results = slib.searchData(
        "customsearch_scv_rp_dtnn",
        filters,
        cols
    );
    return results;
  }

  /**
   * SCV PL Report (Don't update)
   * @param options
   * @param options.subsidiary
   * @param options.fromdate
   * @param options.todate
   * @return {[]}
   */
  function searchPL_Report(options) {
    var filters = [];
    if (!clib.isEmpty(options.subsidiary)) {
      filters.push(
          search.createFilter({
            name: "subsidiary",
            operator: search.Operator.ANYOF,
            values: [options.subsidiary],
          })
      );
    }
    if (!clib.isEmpty(options.fromdate) && !clib.isEmpty(options.todate)) {
      filters.push(
          search.createFilter({
            name: "trandate",
            operator: search.Operator.WITHIN,
            values: [options.fromdate, options.todate],
          })
      );
    }

    var cols = ["chitieu", 'chitieu_text', "amount"];
    var results = slib.searchData(
        "customsearch_scv_report_pl",
        filters,
        cols
    );
    return results;
  }

  /**
   *
   * @param options
   * @param options.orderType
   * @param options.subsidiary
   * @param options.memo
   * @param options.date
   * @param options.accountDebit
   * @param options.accountCredit
   * @param options.debit
   * @param options.credit
   * @param options.project
   */
  function createJournal(options) {
    var newRecord = record.create({
      type: record.Type.JOURNAL_ENTRY,
      isDynamic: true,
    });
    var setBodyValues = {
      subsidiary: options.subsidiary,
      custbody_scv_order_type: options.orderType,
      memo: options.memo,
      trandate: format.parse({value: options.date, type: format.Type.DATE}),
    };
    util.each(_.keys(setBodyValues), function (o) {
      newRecord.setValue(o, setBodyValues[o]);
    });
    var setSublistValuesDebit = {
      account: options.accountDebit,
      debit: options.debit,
      memo: options.memo,
      cseg_scv_sg_proj: options.project,
    };
    var setSublistValuesCredit = {
      account: options.accountCredit,
      credit: options.credit,
      memo: options.memo,
      cseg_scv_sg_proj: options.project,
    };
    var sublistId = "line";
    newRecord.selectNewLine({sublistId: sublistId});
    util.each(_.keys(setSublistValuesDebit), function (o) {
      if (!clib.isEmpty(setSublistValuesDebit[o]))
        newRecord.setCurrentSublistValue({
          sublistId: sublistId,
          fieldId: o,
          value: setSublistValuesDebit[o],
        });
    });
    newRecord.commitLine({sublistId: sublistId});
    newRecord.selectNewLine({sublistId: sublistId});
    util.each(_.keys(setSublistValuesCredit), function (o) {
      if (!clib.isEmpty(setSublistValuesCredit[o]))
        newRecord.setCurrentSublistValue({
          sublistId: sublistId,
          fieldId: o,
          value: setSublistValuesCredit[o],
        });
    });
    newRecord.commitLine({sublistId: sublistId});
    var id = newRecord.save({
      enableSourcing: false,
      ignoreMandatoryFields: true,
    });
    return id;
  }

  /**
   *
   * @param {Object} options
   * @param {Array} sublist
   */
  function createRecord(type, sublistId, options, sublist) {
    var rec = record.create({type: type, isDynamic: true});
    util.each(_.keys(options), (o) => rec.setValue(o, options[o]));
    util.each(sublist, function (o) {
      rec.selectNewLine({sublistId: sublistId});
      util.each(_.keys(o), (o1) =>
          rec.setCurrentSublistValue({
            sublistId: sublistId,
            fieldId: o1,
            value: o[o1],
          })
      );
      rec.commitLine({sublistId: sublistId});
    });
    var id = rec.save({enableSourcing: false, ignoreMandatoryFields: true});
    return id;
  }

  /**
   *
   * @param options
   * @param options.project
   */
  function searchProjectAccountingSetup(options) {
    var customrecord_scv_projectaccsetupSearchObj = search.create({
      type: "customrecord_scv_projectaccsetup",
      filters: [["custrecord_scv_pc_projectname", "anyof", options.project]],
      columns: [
        search.createColumn({
          name: "name",
          sort: search.Sort.ASC,
        }),
        "custrecord_scv_pc_projectname",
        "custrecord_scv_wipcostvalue",
        "custrecord_scv_accruedloss",
        "custrecord_scv_offsetlossgain",
        "custrecord_scv_proacc_adjacc",
      ],
    });
    var results = [];
    customrecord_scv_projectaccsetupSearchObj.run().each(function (result) {
      // .run().each has a limit of 4,000 results
      var obj = {};
      // obj.projectName = result.getValue({name:'custrecord_scv_pc_projectname'});
      // obj.wipCostValue = result.getValue({name:'custrecord_scv_wipcostvalue'});
      obj.accruedLost = result.getValue({name: "custrecord_scv_accruedloss"});
      obj.offsetLossAgain = result.getValue({
        name: "custrecord_scv_offsetlossgain",
      });
      obj.custrecord_scv_proacc_adjacc = result.getValue({
        name: "custrecord_scv_proacc_adjacc",
      });
      results.push(obj);
      return true;
    });
    return results;
  }

  /**
   *
   * @param options
   * @param options.subsidiary
   */
  function searchLandItemsWithSub(options) {
    var searchObj = search.load({id: "customsearch_scv_landitems"});
    if (clib.isEmpty(options.subsidiary)) return [];
    if (!clib.isEmpty(options.subsidiary))
      searchObj.filters.push(
          search.createFilter({
            name: "subsidiary",
            operator: search.Operator.ANYOF,
            values: [options.subsidiary],
          })
      );
    var searchResults = [];
    var c = searchObj.columns;
    searchObj.run().each(function (result) {
      // .run().each has a limit of 4,000 results
      var obj = {};
      obj.projectid = result.getValue(c[8]);
      obj.projectname = result.getText(c[8]);
      obj.itemid = result.id;
      obj.itemname = result.getValue(c[0]);
      searchResults.push(obj);
      return true;
    });
    return searchResults;
  }

  function queryTerms(term) {
    try {
      // Query definition
      var objQuery = query.create({type: "term"});
      // Columns
      objQuery.columns = [
        objQuery.createColumn({
          alias: "sott",
          fieldId: "percentages.installmentlinenum",
        }),
        objQuery.createColumn({
          alias: "percentage",
          fieldId: "percentages.percentage",
        }),
      ];
      objQuery.sort = [
        objQuery.createSort({
          column: objQuery.columns[0],
          ascending: true,
        }),
      ];

      // Conditions
      var conditionList = [];
      conditionList.push(
          objQuery.createCondition({
            operator: query.Operator.EQUAL,
            values: term,
            fieldId: "id",
          })
      );

      objQuery.condition = objQuery.and(conditionList);
      // Paged execution
      var objPagedData = objQuery.runPaged({pageSize: 1000});
      // Paging
      var arrResults = [];
      objPagedData.pageRanges.forEach(function (pageRange) {
        var objPage = objPagedData.fetch({index: pageRange.index}).data;

        // Map results to columns
        arrResults.push.apply(arrResults, objPage.asMappedResults());
      });
      return arrResults;
    } catch (e) {
      log.error("queryTerms error", e);
    }
  }

  function queryPrincipalDetail(loanId) {
    try {
      // Query definition
      var objQuery = query.create({type: "customrecord_cseg_scv_loan"});
      // Columns
      objQuery.columns = [
        objQuery.createColumn({
          alias: "paymentdate",
          fieldId:
              "custrecord_scv_db_pd_debit_loan<customrecord_scv_db_principal_detail.custrecord_scv_db_pd_start_date",
        }),
        objQuery.createColumn({
          alias: "amount",
          fieldId:
              "custrecord_scv_db_pd_debit_loan<customrecord_scv_db_principal_detail.custrecord_scv_db_pd_amount",
        }),
      ];
      /*objQuery.sort = [
                objQuery.createSort({
                    column: objQuery.columns[0],
                    ascending: true,
                }),
            ];*/

      // Conditions
      var conditionList = [];
      if (!clib.isEmpty(loanId))
        conditionList.push(
            objQuery.createCondition({
              operator: query.Operator.EQUAL,
              values: loanId,
              fieldId: "id",
            })
        );

      objQuery.condition = objQuery.and(conditionList);
      // Paged execution
      var objPagedData = objQuery.runPaged({pageSize: 1000});
      // Paging
      var arrResults = [];
      objPagedData.pageRanges.forEach(function (pageRange) {
        var objPage = objPagedData.fetch({index: pageRange.index}).data;

        // Map results to columns
        arrResults.push.apply(arrResults, objPage.asMappedResults());
      });
      return arrResults;
    } catch (e) {
      log.error("queryPrincipalDetail error", e);
    }
  }

  function queryDebitLoanInterest(loan) {
    try {
      // Query definition
      var objQuery = query.create({type: "customrecord_cseg_scv_loan"});
      // Columns
      objQuery.columns = [
        objQuery.createColumn({
          alias: "startdate",
          fieldId:
              "custrecord_scv_interparent<customrecord_scv_interrestdetail.custrecord_scv_idstartdate",
        }),
        objQuery.createColumn({
          alias: "enddate",
          fieldId:
              "custrecord_scv_interparent<customrecord_scv_interrestdetail.custrecord_scv_id_enddate",
        }),
        objQuery.createColumn({
          alias: "rate",
          fieldId:
              "custrecord_scv_interparent<customrecord_scv_interrestdetail.custrecord_scv_id_rate",
        }),
      ];
      /* objQuery.sort = [
                          objQuery.createSort({
                              column: objQuery.columns[0],
                              ascending: true
                          })
                      ]; */

      // Conditions
      var conditionList = [];
      conditionList.push(
          objQuery.createCondition({
            operator: query.Operator.EQUAL,
            values: loan,
            fieldId: "id",
          })
      );

      objQuery.condition = objQuery.and(conditionList);
      // Paged execution
      var objPagedData = objQuery.runPaged({pageSize: 1000});
      // Paging
      var arrResults = [];
      objPagedData.pageRanges.forEach(function (pageRange) {
        var objPage = objPagedData.fetch({index: pageRange.index}).data;

        // Map results to columns
        arrResults.push.apply(arrResults, objPage.asMappedResults());
      });
      return arrResults;
    } catch (e) {
      log.error("queryDebitLoanInterest error", e);
    }
  }

  /**
   *
   * @param options
   * @param options.currency
   * @param options.fromdate
   * @param options.todate
   */
  function queryCurrency(options) {
    var cols = [
      ['tocurrency', 'custrecord_scv_to_currency'],
      ['fromdate', 'custrecord13<customrecord_scv_detail_ex.custrecord_scv_start_date_ex'],
      ['todate', 'custrecord13<customrecord_scv_detail_ex.custrecord_scv_end_date_ex'],
      ['rate', 'custrecord13<customrecord_scv_detail_ex.custrecord_scv_ty_gia']
    ];
    var conditions = [];
    if (!clib.isEmpty(options.currency))
      conditions.push({
        operator: query.Operator.EQUAL,
        values: options.currency,
        fieldId: 'custrecord_scv_to_currency'
      });
    if (!clib.isEmpty(options.fromdate))
      conditions.push({
        operator: query.Operator.ON_OR_BEFORE,
        values: options.fromdate,
        fieldId: 'custrecord13<customrecord_scv_detail_ex.custrecord_scv_start_date_ex'
      });
    if (!clib.isEmpty(options.todate))
      conditions.push({
        operator: query.Operator.ON_OR_AFTER,
        values: options.todate,
        fieldId: 'custrecord13<customrecord_scv_detail_ex.custrecord_scv_end_date_ex'
      });
    var results = slib.queryData('customrecord_scv_ex_rate', cols, conditions);
    return results;
  }

  /**
   *
   * @param options
   * @param options.name
   * @param options.custrecord_scv_sercontract
   * @param options.custrecord_scv_term
   * @param options.custrecord_scv_scstatus
   * @param options.custrecord_scv_customer
   * @param options.custrecord_scv_scmemo
   * @param options.custrecord_scv_sccurrency
   * @param options.custrecord_scv_scamount
   * @param options.custrecord_scv_sctransactiontype
   * @param options.custrecord_scv_scdudate
   * @param options.custrecord_scv_scdocumentnumber
   * @param options.custrecord_scv_scpaymentnumber
   * @param options.custrecord_scv_scpercentage
   */
  function createSCPaymentSchedule(options) {
    try {
      var recSCPaySch = record.create({
        type: "customrecord_scv_scpayschedule",
        isDynamic: true,
      });
      util.each(_.keys(options), function (o) {
        recSCPaySch.setValue(o, options[o]);
      });
      var id = recSCPaySch.save({
        enableSourcing: false,
        ignoreMandatoryFields: true,
      });
      return id;
    } catch (e) {
      log.error("createSCPaymentSchedule error", e);
    }
  }

  /**
   * add this script to afterSubmit
   * @param {Object} options
   * @param {string} options.recordType - record type to be generate
   * @param {string} options.fieldId - sophieu
   * @param {string} options.prefix - prefix of so phieu to be fix
   * @param {string} options.lengthOfNumber - length of counter number
   * @return {[]}
   */
  function generateSoPhieuYCMH(options) {
    try {
      // Query definition
      var objQuery = query.create({type: options.recordType});
      // Columns
      objQuery.columns = [
        objQuery.createColumn({
          alias: "sophieu",
          // formula: "TO_NUMBER(SUBSTR({name},LENGTH({name})-2))",
          formula:
              "TO_NUMBER(SUBSTR({name}, LENGTH('" + options.prefix + "')+1))",
          type: query.ReturnType.FLOAT,
          aggregate: query.Aggregate.MAXIMUM,
        }),
      ];
      // Conditions
      var conditionList = [];
      /*conditionList.push(objQuery.createCondition({
                          "operator": query.Operator.ANY_OF,
                          "values": options.recordType,
                          "fieldId": 'type'
                      }));*/
      conditionList.push(
          objQuery.createCondition({
            operator: query.Operator.CONTAIN,
            values: [options.prefix],
            fieldId: options.fieldId,
          })
      );
      /*conditionList.push(objQuery.createCondition({
                          "operator": query.Operator.EQUAL,
                          "values": options.prefix.length + options.lengthOfNumber,
                          "formula": "LENGTH({custbody_scv_doc_number})",
                          "type": query.ReturnType.FLOAT
                      }));*/

      conditionList.push(
          objQuery.createCondition({
            operator: query.Operator.CONTAIN_NOT,
            values: ["NaN"],
            fieldId: options.fieldId,
          })
      );

      objQuery.condition = objQuery.and(conditionList);
      // Paged execution
      var objPagedData = objQuery.runPaged({pageSize: 1000});
      // Paging
      var arrResults = [];
      objPagedData.pageRanges.forEach(function (pageRange) {
        var objPage = objPagedData.fetch({index: pageRange.index}).data;

        // Map results to columns
        arrResults.push.apply(arrResults, objPage.asMappedResults());
      });

      var sophieuToSet = 0;
      if (arrResults.length > 0) sophieuToSet = arrResults[0].sophieu;
      return (
          options.prefix +
          _.padStart(sophieuToSet + 1, options.lengthOfNumber, "0")
      );
    } catch (e) {
      log.error("generateSoPhieu error", JSON.stringify(e));
    }
  }

  /**
   *
   * @param options
   * @param options.recordType
   * @param options.prefix
   * @param options.lengthofNumber
   * @return {*}
   */
  function generateVendor(options) {
    try {
      // Query definition
      var objQuery = query.create({type: options.recordType});
      // Columns
      objQuery.columns = [
        objQuery.createColumn({
          alias: "sophieu",
          // formula: "TO_NUMBER(SUBSTR({name},LENGTH({name})-2))",
          // formula: "TO_NUMBER(SUBSTR({entityid},3,4))",
          formula:
              "TO_NUMBER(REGEXP_REPLACE(SUBSTR({entityid},3,4),'[^0-9]',''))", // de get chinh xac va loai bo chuoi chi lay so
          type: query.ReturnType.FLOAT,
          aggregate: query.Aggregate.MAXIMUM,
        }),
      ];
      // Conditions
      var conditionList = [];
      /*conditionList.push(objQuery.createCondition({
                          "operator": query.Operator.ANY_OF,
                          "values": options.recordType,
                          "fieldId": 'type'
                      }));*/
      conditionList.push(
          objQuery.createCondition({
            operator: query.Operator.CONTAIN,
            values: [options.prefix],
            // "formula": "CONCAT(SUBSTR({entityid}, 0 , 2),SUBSTR({entityid},INSTR({entityid},'_')))",
            formula: "SUBSTR({entityid}, 0 , 2)",
            type: query.ReturnType.STRING,
          })
      );
      /*conditionList.push(objQuery.createCondition({
                          "operator": query.Operator.EQUAL,
                          "values": options.prefix.length + options.lengthOfNumber,
                          "formula": "LENGTH({custbody_scv_doc_number})",
                          "type": query.ReturnType.FLOAT
                      }));*/

      /*conditionList.push(objQuery.createCondition({
                          "operator": query.Operator.CONTAIN_NOT,
                          "values": ['NaN'],
                          "fieldId": options.fieldId
                      }));*/

      objQuery.condition = objQuery.and(conditionList);
      // Paged execution
      var objPagedData = objQuery.runPaged({pageSize: 1000});
      // Paging
      var arrResults = [];
      objPagedData.pageRanges.forEach(function (pageRange) {
        var objPage = objPagedData.fetch({index: pageRange.index}).data;

        // Map results to columns
        arrResults.push.apply(arrResults, objPage.asMappedResults());
      });

      var sophieuToSet = 0;
      if (arrResults.length > 0) sophieuToSet = arrResults[0].sophieu;
      return _.padStart(sophieuToSet + 1, options.lengthofNumber, "0");
    } catch (e) {
      log.error("generateVendor error", JSON.stringify(e));
    }
  }

  /**
   * add this script to afterSubmit
   * @param {Object} options
   * @param {string} options.recordType - record type to be generate
   * @param {string} options.fieldId - sophieu
   * @param {string} options.prefix - prefix of so phieu to be fix
   * @param {string} options.lengthOfNumber - length of counter number
   * @return {[]}
   */
  function generateSoPhieuPO(options) {
    try {
      // Query definition
      var objQuery = query.create({type: query.Type.TRANSACTION});
      // Columns
      objQuery.columns = [
        objQuery.createColumn({
          alias: "sophieu",
          // formula: "TO_NUMBER(SUBSTR({name},LENGTH({name})-2))",
          formula:
              "TO_NUMBER(SUBSTR({tranid}, LENGTH('" + options.prefix + "')+1))",
          type: query.ReturnType.FLOAT,
          aggregate: query.Aggregate.MAXIMUM,
        }),
      ];
      // Conditions
      var conditionList = [];
      conditionList.push(
          objQuery.createCondition({
            operator: query.Operator.ANY_OF,
            values: ["purchord"],
            fieldId: "type",
          })
      );
      conditionList.push(
          objQuery.createCondition({
            operator: query.Operator.CONTAIN,
            values: [options.prefix],
            fieldId: options.fieldId,
          })
      );
      /*conditionList.push(objQuery.createCondition({
                          "operator": query.Operator.EQUAL,
                          "values": options.prefix.length + options.lengthOfNumber,
                          "formula": "LENGTH({custbody_scv_doc_number})",
                          "type": query.ReturnType.FLOAT
                      }));*/

      conditionList.push(
          objQuery.createCondition({
            operator: query.Operator.CONTAIN_NOT,
            values: ["NaN"],
            fieldId: options.fieldId,
          })
      );

      objQuery.condition = objQuery.and(conditionList);
      // Paged execution
      var objPagedData = objQuery.runPaged({pageSize: 1000});
      // Paging
      var arrResults = [];
      objPagedData.pageRanges.forEach(function (pageRange) {
        var objPage = objPagedData.fetch({index: pageRange.index}).data;

        // Map results to columns
        arrResults.push.apply(arrResults, objPage.asMappedResults());
      });

      var sophieuToSet = 0;
      if (arrResults.length > 0) sophieuToSet = arrResults[0].sophieu;
      return (
          options.prefix +
          _.padStart(sophieuToSet + 1, options.lengthOfNumber, "0")
      );
    } catch (e) {
      log.error("generateSoPhieu error", JSON.stringify(e));
    }
  }

  /**
   * add this script to afterSubmit
   * @param {Object} options
   * @param {string} options.recordType - record type to be generate
   * @param {string} options.type - type of record if recordType is transaction
   * @param {string} options.fieldId - sophieu
   * @param {string} options.formular - formula to get number
   * @param {string} options.prefix - prefix of so phieu to be fix
   * @param {string} options.lengthOfNumber - length of counter number
   * @param {string} options.itemtype - for item
   * @return {[]}
   */
  function generateSoPhieu(options) {
    try {
      // Query definition
      var objQuery = query.create({type: options.recordType});
      // Columns
      objQuery.columns = [
        objQuery.createColumn({
          alias: "sophieu",
          // formula: "TO_NUMBER(SUBSTR({name},LENGTH({name})-2))",
          formula: options.formular,
          type: query.ReturnType.FLOAT,
          aggregate: query.Aggregate.MAXIMUM,
        }),
      ];
      // Conditions
      var conditionList = [];
      if (!_.isEmpty(options.type))
        conditionList.push(
            objQuery.createCondition({
              operator: query.Operator.ANY_OF,
              values: options.type,
              fieldId: "type",
            })
        );
      if (!_.isEmpty(options.itemtype))
        conditionList.push(
            objQuery.createCondition({
              operator: query.Operator.ANY_OF,
              values: options.itemtype,
              fieldId: "itemtype",
            })
        );
      conditionList.push(
          objQuery.createCondition({
            operator: query.Operator.CONTAIN,
            values: [options.prefix],
            fieldId: options.fieldId,
          })
      );

      objQuery.condition = objQuery.and(conditionList);
      // Paged execution
      var objPagedData = objQuery.runPaged({pageSize: 1000});
      // Paging
      var arrResults = [];
      objPagedData.pageRanges.forEach(function (pageRange) {
        var objPage = objPagedData.fetch({index: pageRange.index}).data;

        // Map results to columns
        arrResults.push.apply(arrResults, objPage.asMappedResults());
      });

      var sophieuToSet = 0;
      if (arrResults.length > 0) sophieuToSet = arrResults[0].sophieu;
      var sophieu =
          options.prefix +
          _.padStart(sophieuToSet + 1, options.lengthOfNumber, "0");
      return sophieu;
    } catch (e) {
      log.error("generateSoPhieu error", JSON.stringify(e));
    }
  }

  /**
   * add this script to afterSubmit
   * @param {Object} options
   * @param {string} options.recordType - record type to be generate
   * @param {string} options.type - type of record if recordType is transaction
   * @param {string} options.fieldId - sophieu
   * @param {string} options.formular - formula to get number
   * @param {string} options.prefix - prefix of so phieu to be fix
   * @param {string} options.lengthOfNumber - length of counter number
   * @param {string} options.itemtype - for item
   * @return {[]}
   */
  function generateSoPhieuInventory(options) {
    try {
      // Query definition
      var objQuery = query.create({type: options.recordType});
      // Columns
      objQuery.columns = [
        objQuery.createColumn({
          alias: "sophieu",
          // formula: "TO_NUMBER(SUBSTR({name},LENGTH({name})-2))",
          formula: options.formular,
          type: query.ReturnType.FLOAT,
          aggregate: query.Aggregate.MAXIMUM,
        }),
      ];
      // Conditions
      var conditionList = [];
      if (!_.isEmpty(options.type))
        conditionList.push(
            objQuery.createCondition({
              operator: query.Operator.ANY_OF,
              values: options.type,
              fieldId: "type",
            })
        );
      if (!_.isEmpty(options.itemtype))
        conditionList.push(
            objQuery.createCondition({
              operator: query.Operator.ANY_OF,
              values: options.itemtype,
              fieldId: "itemtype",
            })
        );
      conditionList.push(
          objQuery.createCondition({
            operator: query.Operator.START_WITH,
            values: [options.prefix],
            fieldId: options.fieldId,
          })
      );
      conditionList.push(
          objQuery.createCondition({
            formula: "LENGTH(SUBSTR({itemid}, 1 ,INSTR({itemid}, '_')-1))",
            values: 7.0,
            operator: query.Operator.EQUAL,
            type: query.ReturnType.FLOAT,
          })
      );

      objQuery.condition = objQuery.and(conditionList);
      // Paged execution
      var objPagedData = objQuery.runPaged({pageSize: 1000});
      // Paging
      var arrResults = [];
      objPagedData.pageRanges.forEach(function (pageRange) {
        var objPage = objPagedData.fetch({index: pageRange.index}).data;

        // Map results to columns
        arrResults.push.apply(arrResults, objPage.asMappedResults());
      });
      var sophieuToSet = 0;
      if (arrResults.length > 0) sophieuToSet = arrResults[0].sophieu;
      var sophieu =
          options.prefix +
          _.padStart(sophieuToSet + 1, options.lengthOfNumber, "0");
      return sophieu;
    } catch (e) {
      log.error("generateSoPhieu error", JSON.stringify(e));
    }
  }

  /**
   * add this script to afterSubmit
   * @param {Object} options
   * @param {string} options.recordType - record type to be generate
   * @param {string} options.type - type of record if recordType is transaction
   * @param {string} options.fieldId - sophieu
   * @param {string} options.formular - formula to get number
   * @param {string} options.prefix - prefix of so phieu to be fix
   * @param {string} options.lengthOfNumber - length of counter number
   * @param {string} options.ordertype
   * @return {[]}
   */
  function generateSoPhieuYCNX(options) {
    try {
      // Query definition
      var objQuery = query.create({type: options.recordType});
      // Columns
      objQuery.columns = [
        objQuery.createColumn({
          alias: "sophieu",
          // formula: "TO_NUMBER(SUBSTR({name},LENGTH({name})-2))",
          formula: options.formular,
          type: query.ReturnType.FLOAT,
          aggregate: query.Aggregate.MAXIMUM,
        }),
      ];
      // Conditions
      var conditionList = [];
      if (!_.isEmpty(options.type))
        conditionList.push(
            objQuery.createCondition({
              operator: query.Operator.ANY_OF,
              values: options.type,
              fieldId: "type",
            })
        );
      /*if (!_.isEmpty(options.ordertype))
                conditionList.push(
                    objQuery.createCondition({
                        operator: query.Operator.ANY_OF,
                        values: options.ordertype,
                        fieldId: "custbody_scv_ycxvt_type",
                    })
                );*/
      conditionList.push(
          objQuery.createCondition({
            operator: query.Operator.CONTAIN,
            values: [options.prefix],
            fieldId: options.fieldId,
          })
      );

      objQuery.condition = objQuery.and(conditionList);
      // Paged execution
      var objPagedData = objQuery.runPaged({pageSize: 1000});
      // Paging
      var arrResults = [];
      objPagedData.pageRanges.forEach(function (pageRange) {
        var objPage = objPagedData.fetch({index: pageRange.index}).data;

        // Map results to columns
        arrResults.push.apply(arrResults, objPage.asMappedResults());
      });

      var sophieuToSet = 0;
      if (arrResults.length > 0) sophieuToSet = arrResults[0].sophieu;
      var sophieu =
          options.prefix +
          _.padStart(sophieuToSet + 1, options.lengthOfNumber, "0");
      return sophieu;
    } catch (e) {
      log.error("generateSoPhieuYCNX error", JSON.stringify(e));
    }
  }

  /**
   *{
   subsidiary:5,
   subsidiarytext: "WHA IZ Nghe An",
   documentnumber: "SCIZNA192",
   date: "16/11/2021",
   name: "235",
   nametext: "18 Công ty TNHH Dược phẩm KOREA-GREENLIFE",
   item: "588",
   itemtext: "Treat Water 01",
   units: "m3",
   quantity: 238,
   startdate: "01/10/2021",
   enddate: "31/10/2021",
   memo: "Chỉ số nước tháng 10 của công ty korea",
   amount: "1428000.00",
   ordertype: "33",
   ordertypetext: "Water"
   }
   * @param options
   * @param options.subsidiary
   * @param options.customer
   * @return {*[]}
   */
  function searchSONuocMay(options) {
    try {
      //SC Nước máy
      var objSearch = search.load({id: "customsearch_scv_sc_nuoc_may"});
      var ss = [];
      if (!clib.isEmpty(options.subsidiary))
        objSearch.filters.push(
            search.createFilter({
              name: "subsidiary",
              operator: search.Operator.ANYOF,
              values: [options.subsidiary],
            })
        );
      if (!clib.isEmpty(options.customer))
        objSearch.filters.push(
            search.createFilter({
              name: "entity",
              operator: search.Operator.ANYOF,
              values: [options.customer],
            })
        );
      if (!clib.isEmpty(options.fromdate) && !clib.isEmpty(options.todate))
        objSearch.filters.push(
            search.createFilter({
              name: "trandate",
              operator: search.Operator.WITHIN,
              values: [options.fromdate, options.todate],
            })
        );

      var c = objSearch.columns;
      var transactionSearchPagedData = objSearch.runPaged({pageSize: 1000});
      for (var i = 0; i < transactionSearchPagedData.pageRanges.length; i++) {
        var transactionSearchPage = transactionSearchPagedData.fetch({
          index: i,
        });
        transactionSearchPage.data.forEach(function (result) {
          var obj = {};
          util.each(c, function (o, i) {
            var name = _.replace(_.toLower(o.label), " ", "");
            name = _.replace(name, "(no hierarchy)", "");
            name = _.replace(name, "(main)", "");
            // if(name == 'formulanumeric') name += i;
            // if(name == 'formulacurrency') name += i;
            obj[name] = result.getValue(o);
            if (name == "quantity") obj[name] = _.toNumber(obj[name]);
            if (name == "subsidiary") obj.subsidiarytext = result.getText(o);
            if (name == "name") obj.nametext = result.getText(o);
            if (name == "item") obj.itemtext = result.getText(o);
            if (name == "ordertype") obj.ordertypetext = result.getText(o);
          });
          ss.push(obj);
        });
      }
      return ss;
    } catch (e) {
      log.error("searchSONuocMay", e);
    }
  }

  function searchCBCheckLine(subsidiary, fromdate, todate) {
    try {
      //WHA CB Check line (don't edit)
      var filters = [];
      if (!clib.isEmpty(subsidiary))
        filters.push(
            search.createFilter({
              name: "subsidiary",
              operator: search.Operator.ANYOF,
              values: [subsidiary],
            })
        );
      if (!clib.isEmpty(fromdate) && !clib.isEmpty(todate))
        filters.push(
            search.createFilter({
              name: "trandate",
              operator: search.Operator.WITHIN,
              values: [fromdate, todate],
            })
        );
      var cols = ['chitieu', 'grossamount', 'date'];
      var ss = slib.searchData(enums.SaveSearchType.CBCheckLine, filters, cols);
      return ss;
    } catch (e) {
      log.error("searchCBCheckLine", e);
    }
  }

  /**
   * ['chitieu', 'amount', 'date']
   * @param subsidiary
   * @param fromdate
   * @param todate
   * @returns {[]}
   */
  function searchCBCurrencyRevaluationIn(subsidiary, fromdate, todate) {
    try {
      //SCV CB Currency revaluation - IN
      var filters = [];
      if (!clib.isEmpty(subsidiary))
        filters.push(
            search.createFilter({
              name: "subsidiary",
              operator: search.Operator.ANYOF,
              values: [subsidiary],
            })
        );
      if (!clib.isEmpty(fromdate) && !clib.isEmpty(todate))
        filters.push(
            search.createFilter({
              name: "trandate",
              operator: search.Operator.WITHIN,
              values: [fromdate, todate],
            })
        );
      var cols = ['chitieu', 'amount', 'date'];
      var ss = slib.searchData('customsearch_scv_currency_revaluation', filters, cols);
      return ss;
    } catch (e) {
      log.error("searchCBCurrencyRevaluation", e);
    }
  }

  /**
   * ['chitieu', 'amount', 'date']
   * @param subsidiary
   * @param fromdate
   * @param todate
   * @returns {[]}
   */
  function searchCBCurrencyRevaluationOut(subsidiary, fromdate, todate) {
    try {
      //SCV CB Currency revaluation - Out
      var filters = [];
      if (!clib.isEmpty(subsidiary))
        filters.push(
            search.createFilter({
              name: "subsidiary",
              operator: search.Operator.ANYOF,
              values: [subsidiary],
            })
        );
      if (!clib.isEmpty(fromdate) && !clib.isEmpty(todate))
        filters.push(
            search.createFilter({
              name: "trandate",
              operator: search.Operator.WITHIN,
              values: [fromdate, todate],
            })
        );
      var cols = ['chitieu', 'amount', 'date'];
      var ss = slib.searchData('customsearch_scv_currency_revaluation_2', filters, cols);
      return ss;
    } catch (e) {
      log.error("searchCBCurrencyRevaluationOut", e);
    }
  }

  /**
   var cols = ['transactionnumber', 'chitieu', 'date'];
   * @param subsidiary
   * @param fromdate
   * @param todate
   * @returns {[]}
   */
  function searchCBBillHeader(subsidiary, fromdate, todate) {
    try {
      // WHA CB Bill header (don't edit)
      var filters = [];
      if (!_.isEmpty(subsidiary))
        filters.push(
            search.createFilter({
              name: "subsidiary",
              operator: search.Operator.ANYOF,
              values: [subsidiary],
            })
        );
      if (!clib.isEmpty(fromdate) && !clib.isEmpty(todate))
        filters.push(
            search.createFilter({
              name: "trandate",
              operator: search.Operator.WITHIN,
              values: [fromdate, todate],
            })
        );
      var cols = ['transactionnumber', 'chitieu', 'date'];
      var ss = slib.searchData(enums.SaveSearchType.CBBillHeader, filters, cols);
      return ss;
    } catch (e) {
      log.error("searchCBBillHeader", e);
    }
  }

  function searchCBBillPaymentLine(subsidiary, fromdate, todate) {
    try {
      // WHA CB Bill payment line (dont edit): Results
      var filters = [];
      if (!clib.isEmpty(subsidiary))
        filters.push(
            search.createFilter({
              name: "subsidiary",
              operator: search.Operator.ANYOF,
              values: [subsidiary],
            })
        );
      if (!clib.isEmpty(fromdate) && !clib.isEmpty(todate))
        filters.push(
            search.createFilter({
              name: "trandate",
              operator: search.Operator.WITHIN,
              values: [fromdate, todate],
            })
        );
      var cols = ['transactionnumber', 'amount', 'chitieu', 'date'];

      var ss = slib.searchData(enums.SaveSearchType.CBBillPaymentLine, filters, cols);
      return ss;
    } catch (e) {
      log.error("searchCBBillPaymentLine", e);
    }
  }

  /**
   *             var cols = ['transactionnumber', 'amount','chitieu','date'];
   * @param subsidiary
   * @param fromdate
   * @param todate
   * @returns {[]}
   */
  function searchCBVendorPrepayment(subsidiary, fromdate, todate) {
    try {
      // WHA CB Vendor prepayment (don't edit)
      var filters = [];
      if (!clib.isEmpty(subsidiary))
        filters.push(
            search.createFilter({
              name: "subsidiary",
              operator: search.Operator.ANYOF,
              values: [subsidiary],
            })
        );
      if (!clib.isEmpty(fromdate) && !clib.isEmpty(todate))
        filters.push(
            search.createFilter({
              name: "trandate",
              operator: search.Operator.WITHIN,
              values: [fromdate, todate],
            })
        );
      var cols = ['transactionnumber', 'amount', 'chitieu', 'date'];
      var ss = slib.searchData(enums.SaveSearchType.CBVendorPrepayment, filters, cols);
      return ss;
    } catch (e) {
      log.error("searchCBVendorPrepayment", e);
    }
  }

  /**
   *
   * @param options
   * @param options.subsidiary
   * @param options.fromdate
   * @param options.todate
   * @return {*[]}
   */
  function searchCBVendorPrepaymentApplicationHeader(options) {
    try {
      // WHA CB Vendor prepayment application header (don't edit)
      var filters = [];
      if (!clib.isEmpty(options.subsidiary))
        filters.push(
            search.createFilter({
              name: "subsidiary",
              operator: search.Operator.ANYOF,
              values: [options.subsidiary],
            })
        );
      if (!clib.isEmpty(options.fromdate) && !clib.isEmpty(options.todate))
        filters.push(
            search.createFilter({
              name: "trandate",
              operator: search.Operator.WITHIN,
              values: [options.fromdate, options.todate],
            })
        );
      var cols = ['transactionnumber', 'transactionnumapplied'];
      var ss = slib.searchData('customsearch_scv_cb_payment_3_3', filters, cols);
      return ss;

    } catch (e) {
      log.error("searchCBVendorPrepaymentApplicationHeader", e);
    }
  }

  /**
   var cols = ['transactionnumber', 'transactionnumapplied','amountapplied','date'];
   * @param subsidiary
   * @param fromdate
   * @param todate
   * @returns {[]}
   */
  function searchCBVendorPrepaymentApplicationLine(subsidiary, fromdate, todate) {
    try {
      // WHA CB Vendor prepayment application line (don't edit)
      var filters = [];
      if (!clib.isEmpty(subsidiary))
        filters.push(
            search.createFilter({
              name: "subsidiary",
              operator: search.Operator.ANYOF,
              values: [subsidiary],
            })
        );
      if (!clib.isEmpty(fromdate) && !clib.isEmpty(todate))
        filters.push(
            search.createFilter({
              name: "trandate",
              operator: search.Operator.WITHIN,
              values: [fromdate, todate],
            })
        );

      var cols = ['transactionnumber', 'transactionnumapplied', 'amountapplied', 'date'];
      var ss = slib.searchData(enums.SaveSearchType.CBVendorPrepaymentApplicationLine, filters, cols);
      return ss;
    } catch (e) {
      log.error("searchCBVendorPrepaymentApplicationLine", e);
    }
  }

  function searchCashFlowSection(options) {
    try {
      const sectionSearchColName = search.createColumn({
        name: "name",
        sort: search.Sort.ASC,
      });
      const sectionSearchColCode = search.createColumn({
        name: "custrecord_scv_cf_section_code",
      });
      const sectionSearchColDisplayName = search.createColumn({
        name: "custrecord_scv_cf_section_name",
      });
      const sectionSearchColGroup = search.createColumn({
        name: "custrecord_scv_cf_section_group",
      });
      const sectionSearch = search.create({
        type: "customrecord_scv_cf_report_section",
        filters: [],
        columns: [
          sectionSearchColName,
          sectionSearchColCode,
          sectionSearchColDisplayName,
          sectionSearchColGroup,
        ],
      });

      var ss = [];
      const sectionSearchPagedData = sectionSearch.runPaged({pageSize: 1000});
      for (let i = 0; i < sectionSearchPagedData.pageRanges.length; i++) {
        const sectionSearchPage = sectionSearchPagedData.fetch({index: i});
        sectionSearchPage.data.forEach(function (result) {
          var o = {
            name: result.getValue(sectionSearchColName),
            code: result.getValue(sectionSearchColCode),
            displayname: result.getValue(sectionSearchColDisplayName),
            group: result.getValue(sectionSearchColGroup),
          };
          ss.push(o);
        });
      }

      return ss;
    } catch (e) {
      log.error("searchCashFlowSection", e);
    }
  }

  /**
   *
   * @param options
   * @param options.subsidiary
   * @param options.customer
   * @return {*[]}
   */
  function searchGenerateLand(options) {
    try {
      //WHA Leasable area items for calculate management fee (don't edit)
      var objSearch = search.load({id: "customsearch_scv_landitems_2"});
      var ss = [];
      if (!clib.isEmpty(options.subsidiary))
        objSearch.filters.push(
            search.createFilter({
              name: "subsidiary",
              operator: search.Operator.ANYOF,
              values: [options.subsidiary],
            })
        );
      if (!clib.isEmpty(options.customer))
        objSearch.filters.push(
            search.createFilter({
              name: "custitem_scv_item_customer",
              operator: search.Operator.ANYOF,
              values: [options.customer],
            })
        );

      objSearch.columns.push(
          search.createColumn({
            name: "entityid",
            join: "custitem_scv_item_customer",
            label: "Customer Name",
          })
      );
      objSearch.columns.push(
          search.createColumn({
            name: "custentity_scv_wha_ho_date",
            join: "custitem_scv_item_customer",
            label: "HO Date",
          })
      );
      var c = objSearch.columns;
      var transactionSearchPagedData = objSearch.runPaged({pageSize: 1000});
      for (var i = 0; i < transactionSearchPagedData.pageRanges.length; i++) {
        var transactionSearchPage = transactionSearchPagedData.fetch({
          index: i,
        });
        transactionSearchPage.data.forEach(function (result) {
          var obj = {
            subsidiary: result.getValue(_.find(c, {label: "Subsidiary"})),
            subsidiarytext: result.getText(_.find(c, {label: "Subsidiary"})),
            item: result.getValue(_.find(c, {label: "Name"})),
            itemid: result.id,
            areaha: result.getValue(_.find(c, {label: "Area (ha)"})),
            areasqm: result.getValue(
                _.find(c, {label: "Sellable area (sqm)"})
            ),
            customer: result.getValue(_.find(c, {label: "Customer"})),
            customertext: result.getValue(
                _.find(c, {label: "Customer Name"})
            ),
            hodate: result.getValue(_.find(c, {label: "Handover Date"})),
            projectname: result.getValue(_.find(c, {label: "Project names"})),
            projectnametext: result.getText(
                _.find(c, {label: "Project names"})
            ),
            servicecontract: result.getValue(
                _.find(c, {label: "Service Contract"})
            ),
            servicecontracttext: result.getText(
                _.find(c, {label: "Service Contract"})
            ),
            descriptionvn: result.getValue(
                _.find(c, {label: "Tên lấy lên Description Invoice VN"})
            ),
            descriptioneng: result.getValue(
                _.find(c, {label: "Tên lấy lên Description Invoice ENG"})
            ),
          };
          ss.push(obj);
        });
      }
      /*ss = _.reject(ss, function (o) {
                return clib.isEmpty(o.customer);
            });*/
      return ss;
    } catch (e) {
      log.error("searchGenerateLand", e);
    }
  }

  /**
   * WHA Management fees info (don't edit): Results
   * @param options
   * @param options.subsidiary
   * @param options.customer
   * @return {*[]}
   */
  function searchManangementFeesInfo(options) {
    try {
      //WHA Management fees info (don't edit): Results
      var objSearch = search.load({id: "customsearch_scv_managment_info"});
      var ss = [];
      if (!clib.isEmpty(options.subsidiary))
        objSearch.filters.push(
            search.createFilter({
              name: "custrecord_scv_mf_sub",
              operator: search.Operator.ANYOF,
              values: [options.subsidiary],
            })
        );
      if (!clib.isEmpty(_.head(options.customer)))
        objSearch.filters.push(
            search.createFilter({
              name: "custrecord_scv_mf_customer",
              operator: search.Operator.ANYOF,
              values: [options.customer],
            })
        );

      var c = objSearch.columns;
      var transactionSearchPagedData = objSearch.runPaged({pageSize: 1000});
      for (var i = 0; i < transactionSearchPagedData.pageRanges.length; i++) {
        var transactionSearchPage = transactionSearchPagedData.fetch({
          index: i,
        });
        transactionSearchPage.data.forEach(function (result) {
          var obj = {
            customer: result.getValue(_.find(c, {label: "Customer"})),
            customertext: result.getText(_.find(c, {label: "Customer"})),
            item: result.getValue(_.find(c, {label: "Item"})),
            itemtext: result.getText(_.find(c, {label: "Item"})),
            areaha: result.getValue(_.find(c, {label: "Area ha"})),
            areasqm: result.getValue(_.find(c, {label: "Area sqm"})),
            handoverdate: result.getValue(
                _.find(c, {label: "Hand over date"})
            ),
            lastedday: result.getValue(
                _.find(c, {label: "Lasted day of management fees"})
            ),
          };
          ss.push(obj);
        });
      }
      return ss;
    } catch (e) {
      log.error("searchManangementFeesInfo", e);
    }
  }

  /**
   *{
   1 sub: "5",
   subText: "WHA Group : WHA Vietnam : WHA IZ Nghe An",
   2 sC: "15212",
   serviceContractText: "Service Contract Detail #SCIZNA150",
   3 name: "SCIZNA1501ST",
   4 customername: "229",
   customerNameText: "12 Công ty cổ phần dược phẩm PQA",
   5 contact: "",
   6 memo: "",
   7 memoEng: "",
   8 term:11,
   termText:'term text here',
   9 paymentNumber: "1",
   10 amount: "50000000",
   11 paidAmount: "50000000",
   12 remainingAmount: "0",
   13 currecncy: "1",
   13 currecncyText: "VND",
   14 percentage: "10.0%",
   15 penaltyrate: "",
   16 penaltyamount: "0",
   17 overdueinterestrate: "",
   18 overdueinterestamount: "0",
   internalID: "58"
   }

   * @param options
   * @param options.subsidiary
   * @param options.customer
   * @param options.servicecontract
   * @param options.fromdate
   * @param options.todate
   * @return {*[]}
   */
  function searchDebitNote(options) {
    try {
      //WHA SC Payment schedule - Gộp Debit note (don't edit)
      var objSearch = search.load({id: "customsearch_scv_sswhapaychedule_6"});
      var ss = [];
      if (!clib.isEmpty(options.subsidiary))
        objSearch.filters.push(
            search.createFilter({
              name: "custrecord_scv_scsub",
              operator: search.Operator.ANYOF,
              values: [options.subsidiary],
            })
        );
      if (!clib.isEmpty(options.customer))
        objSearch.filters.push(
            search.createFilter({
              name: "custrecord_scv_customer",
              operator: search.Operator.ANYOF,
              values: [options.customer],
            })
        );
      if (!clib.isEmpty(options.servicecontract))
        objSearch.filters.push(
            search.createFilter({
              name: "custrecord_scv_sercontract",
              operator: search.Operator.ANYOF,
              values: [options.servicecontract],
            })
        );
      if (!clib.isEmpty(options.fromdate) && !clib.isEmpty(options.todate))
        objSearch.filters.push(
            search.createFilter({
              name: "custrecord_scv_scdudate",
              operator: search.Operator.WITHIN,
              values: [options.fromdate, options.todate],
            })
        );

      var c = objSearch.columns;
      var transactionSearchPagedData = objSearch.runPaged({pageSize: 1000});
      for (var i = 0; i < transactionSearchPagedData.pageRanges.length; i++) {
        var transactionSearchPage = transactionSearchPagedData.fetch({
          index: i,
        });
        transactionSearchPage.data.forEach(function (result) {
          var obj = {};
          util.each(c, (o) => {
            var name = _.replace(_.toLower(o.label), /\s+/g, "");
            obj[name] = result.getValue(o);
            if (name == "sub") obj.subText = result.getText(o);
            if (name == "sc") obj.serviceContractText = result.getText(o);
            if (name == "customername")
              obj.customerNameText = result.getText(o);
            if (name == "term") obj.termText = result.getText(o);
            if (name == "currency") obj.currencyText = result.getText(o);
            if (name == "contact") obj.contactText = result.getText(o);
          });
          ss.push(obj);
        });
      }
      return ss;
    } catch (e) {
      log.error("searchDebitNote", e);
    }
  }

  function searchRecManageFeesInfo(subsidiary, item) {
    var searchObj = search.create({
      type: "customrecord_scv_management_fees_info",
      filters: [
        ["custrecord_scv_mf_sub", "anyof", subsidiary],
        "AND",
        ["custrecord_scv_mf_item", "anyof", item],
      ],
      columns: [
        search.createColumn({
          name: "name",
          sort: search.Sort.ASC,
          label: "Name",
        }),
        search.createColumn({name: "scriptid", label: "Script ID"}),
        search.createColumn({
          name: "custrecord_scv_mf_sub",
          label: "Subsidiary",
        }),
        search.createColumn({name: "custrecord_scv_mf_item", label: "Item"}),
        search.createColumn({
          name: "custrecord_scv_mf_area_ha",
          label: "Area (ha)",
        }),
        search.createColumn({
          name: "custrecord_scv_mf_area_sqm",
          label: "Area (sqm)",
        }),
        search.createColumn({
          name: "custrecord_scv_mf_customer",
          label: "Customer",
        }),
        search.createColumn({
          name: "custrecord_scv_mff_handover_date",
          label: "Hand over date",
        }),
        search.createColumn({
          name: "custrecord_scv_mff_lasted_day_fee",
          label: "Lasted day of management fees",
        }),
      ],
    });
    var results = [];
    searchObj.run().each(function (result) {
      // .run().each has a limit of 4,000 results
      var o = {
        id: result.id,
      };
      results.push(o);
      return true;
    });
    return results;
  }

  /**
   *
   * @param options
   * @param options.subsidiary
   * @param options.customer
   */
  function searchItemPricing(options) {
    var filters = [];
    if (!clib.isEmpty(options.subsidiary))
      filters.push(
          search.createFilter({
            name: "internalid",
            join: "msesubsidiary",
            operator: search.Operator.ANYOF,
            values: [options.subsidiary],
          })
      );
    if (!clib.isEmpty(options.customer))
      filters.push(
          search.createFilter({
            name: "internalid",
            operator: search.Operator.ANYOF,
            values: [options.customer],
          })
      );
    var cols = ["id", "unitprice"];
    var ss = slib.searchData("customsearch_scv_mf_item_pricing", filters, cols);
    return ss;
  }

  /**
   * SCV RP_RS_DTHT (don't edit)
   * @param params
   * @param params.subsidiary
   * @param params.fromdate
   * @param params.todate
   * @return {[]}
   */
  function searchRSDoanhThuHaTang(params) {
    var filters = [];
    if (!clib.isEmpty(params.subsidiary))
      filters.push(
          search.createFilter({
            name: "subsidiary",
            operator: search.Operator.ANYOF,
            values: params.subsidiary,
          })
      );
    if (!clib.isEmpty(params.fromdate) && !clib.isEmpty(params.todate))
      filters.push(
          search.createFilter({
            name: "trandate",
            operator: search.Operator.WITHIN,
            values: [params.fromdate, params.todate],
          })
      );
    var cols = [
      "legalname",
      "legalnameeng",
      "profit",
      "servicecontractinternalid",
    ];
    var results = slib.searchData("customsearch_scv_dt_ht", filters, cols);
    return results;
  }

  /**
   * SCV RP_RS_Land cho SC (don't edit)
   * @param params
   * @param params.subsidiary
   * @return {[]}
   */
  function searchRSLandSC(params) {
    var filters = [];
    if (!clib.isEmpty(params.subsidiary))
      filters.push(
          search.createFilter({
            name: "subsidiary",
            operator: search.Operator.ANYOF,
            values: params.subsidiary,
          })
      );
    var cols = ["name", "areaha", "servicecontractinternalid"];
    var results = slib.searchData(
        "customsearch_scv_itemforsc_2",
        filters,
        cols
    );
    return results;
  }

  /**
   * SCV RP_RS_DTQL (don't edit)
   * @param params
   * @param params.subsidiary
   * @param params.fromdate
   * @param params.todate
   * @return {[]}
   */
  function searchRSDoanhThuQuanLy(params) {
    var filters = [];
    if (!clib.isEmpty(params.subsidiary))
      filters.push(
          search.createFilter({
            name: "subsidiary",
            operator: search.Operator.ANYOF,
            values: params.subsidiary,
          })
      );
    if (!clib.isEmpty(params.fromdate) && !clib.isEmpty(params.todate))
      filters.push(
          search.createFilter({
            name: "trandate",
            operator: search.Operator.WITHIN,
            values: [params.fromdate, params.todate],
          })
      );

    var cols = [
      "legalname",
      "legalnameeng",
      "profit",
      "servicecontractinternalid",
    ];
    var results = slib.searchData("customsearch_scv_dt_ql", filters, cols);
    return results;
  }

  /**
   * SCV RP_RS_DTBDS (don't edit)
   * @param params
   * @param params.subsidiary
   * @param params.fromdate
   * @param params.todate
   * @return {[]}
   */
  function searchRSDoanhThuBDS(params) {
    var filters = [];
    if (!clib.isEmpty(params.subsidiary))
      filters.push(
          search.createFilter({
            name: "subsidiary",
            operator: search.Operator.ANYOF,
            values: params.subsidiary,
          })
      );
    if (!clib.isEmpty(params.fromdate) && !clib.isEmpty(params.todate))
      filters.push(
          search.createFilter({
            name: "trandate",
            operator: search.Operator.WITHIN,
            values: [params.fromdate, params.todate],
          })
      );

    var cols = [
      "legalname",
      "legalnameeng",
      "profit",
      "servicecontractinternalid",
    ];
    var results = slib.searchData("customsearch_scv_dt_bds", filters, cols);
    return results;

  }

  /**
   * WHA Bank amount (don't edit)
   * @param params
   * @param params.subsidiary
   * @param params.fromdate
   * @param params.todate
   * @return {[]}
   */
  function searchBankAmount(subsidiary, date) {
    var filters = [];
    if (!clib.isEmpty(subsidiary))
      filters.push(
          search.createFilter({
            name: "subsidiary",
            operator: search.Operator.ANYOF,
            values: subsidiary,
          })
      );
    if (!clib.isEmpty(date))
      filters.push(
          search.createFilter({
            name: "trandate",
            operator: search.Operator.BEFORE,
            values: date,
          })
      );

    var cols = ["amount"];
    var results = slib.searchData("customsearch_scv_bank_amt", filters, cols);
    return results;

  }

  /**
   *
   * @param param
   * @param param.subsidiary
   * @param param.fromdate
   * @param param.todate
   * @param param.fromytddate
   * @param param.toytddate,
   * @param param.currency,
   * @return {*[]}
   */
  function dataPlBranchThailand(param) {
    var chitieu = [
      '04',
      '05',
      '06',
      '07',
      '08',
      '09',
      '10',
      '11',
      '12',
      '13',
      '14',
      '15',
      '16',
      '17',
      '18',
      '19',
      '20',
      '21',
      '22',
      '23',
      '24',
      '25',
      '26',
      '27',
      '28',
      '29',
      '30',
      '31',
      '32',
      '33',
      '34',
      '35',
      '36',
      '37',
      '38',
      '39',
      '40',
      '41',
      '42',
      '43',
      '44',
      '45',
      '46',
      '47',
      '48',
      '49',
      '50',
      '51',
      '52',
      '53',
      '54',
      '55',
      '56',
      '57',
      '58',
      '59',
      '60',
      '61',
      '62',
      '63',
      '64',
      '65',
      '66',
      '67',
      '68',
      '69',
      '70',
      '71',
      '72',
      '73',
      '74',
      '75',
      '76',
      '77',
      '78',
      '79',
    ];
    var tenchitieu = [
      '41100001-110 Sales of land',
      '111 Land',
      '41100001-130 Sales of pre-fabricated factor',
      '41100002-000 Sales of investment properties',
      '132 Building-Attached',
      '124 Office building',
      'Total Revenues from sales',
      '41200001-900 Services income - Management Services',
      'Total Revenues from services',
      '63200001 Gain (Loss) on saleof asset',
      '63200002 Gain (Loss) on sale investment',
      'Total Gain (Loss) on sale/Write off of a',
      '63300001 Gain (Loss) on exchange rate',
      '49100000 Interest income - Bank',
      '49110004 Interest income - Government bond',
      '49120001 Interest income - Loans to director and employee',
      '49120002 Interest income - Loans to associ',
      '49120003 Interest income - Loans to subsid',
      '49120004 Interest income - Loans to relate',
      '49120005 Interest income - Loans to other company',
      '49139909 Interest income - Others',
      'Total Interest income',
      '49200001 Manangement income',
      '49200002 Commission income',
      'Total Management income',
      '49300001 Dividend income',
      '49919999- 841 Fiber optic',
      '49919999- 842 Tonage',
      '49919999- 891 Insurance',
      '49919999- 892 Property tax',
      '49919999- 893 Renevate',
      '49919999- 894 Penalty',
      '49919999- Others income',
      'Total Others income',
      '71000001 Share of profit (loss) from inves',
      'TOTAL REVENUES',
      '51000001-111 Cost of land sales',
      '51000001-130 Cost of pre-fabricated factory',
      '51000002-000 Cost of investment properties s',
      'Total Cost of sales',
      '52700000-900  Cost of management - Other product',
      '59000000-900  Other Cost - Other product',
      'Total Cost of services',
      '61100000-61900000 Selling expenses',
      '62100000-62990000 General administrative expense',
      '61900001 Provision from guarantee of rental',
      '64000001 Director remuneration',
      '64000002 Other benefit expense',
      'Total Director remuneration',
      'Total Selling and General administrative exp',
      '62990002 Reserve for the legal dispute expen',
      '63100001 Loss from asset revaluation',
      '63100002 Loss from investment revaluation',
      'Total Allowance for impairment of asset',
      '71000001 Share of profit (loss) from investm',
      'TOTAL EXPENSES',
      'Profit before finance costs and income tax expenses',
      '65100001 Interest expense - Loan from direct',
      '65100002 Interest expense - Loan from financ',
      '65100003 Interest expense - Debenture',
      '65100004 Interest expense - Loan from associ',
      '65100005 Interest expense - Loan from subsid',
      '65100006 Interest expense - Loan from relate',
      '65100007 Interest expense - Oher company',
      '65100100 Debenture underwriting expense',
      '65199999 Interest expense - Ohers',
      'Total Finance costs',
      '72000001 Income tax expenses',
      '72000003 Gain from deferred income tax',
      '72000004 Loss from deferred income tax',
      'Total Income tax expenses',
      'Net Profit',
      'Beginning Retained earnings',
      '33200002 Dividend paid',
      'Ending Retained earnings',
      'Earnings per share',
    ];
    var dataCurr = dataCurrency(param);
    var objData = [];
    _.map(chitieu, function (o, i) {
      var obj = {
        chitieu: o,
        tenchitieu: tenchitieu[i]
      };
      objData.push(obj);
    });
    //luoc bo bot row tong
    objData = _.reject(objData, function (o) {
      return _.includes(['10', '12', '15', '25', '28', '37', '39', '43', '46', '52', '53', '57', '59', '60', '70', '74', '75', '78'], o.chitieu);
    });
    var ssDate = searchPLBranchThailand({
      subsidiary: param.subsidiary,
      fromdate: param.fromdate,
      todate: param.todate
    });
    _.map(ssDate, function (o) {
      _.assign(o, {machitieu: _(o.chitieu_text).split('.').head()})
    })
    var ssYTD = searchPLBranchThailand({
      subsidiary: param.subsidiary,
      fromdate: param.fromytddate,
      todate: param.toytddate
    });
    _.map(ssYTD, function (o) {
      _.assign(o, {machitieu: _(o.chitieu_text).split('.').head()})
    })
    _.map(objData, function (o) {
      var fdate = _.find(ssDate, {machitieu: o.chitieu});
      var fytd = _.find(ssYTD, {machitieu: o.chitieu});
      _.isEmpty(fdate) ? _.assign(o, {amt: ''}) : _.assign(o, {amt: _.round(fdate.amount / dataCurr.rate, dataCurr.currencyprecision)});
      _.isEmpty(fytd) ? _.assign(o, {amtytd: ''}) : _.assign(o, {amtytd: _.round(fytd.amount / dataCurr.rate, dataCurr.currencyprecision)});
    });

    return objData;
  }

  /**
   *
   * @param options
   * @param options.subsidiary
   * @param options.fromdateytd1
   * @param options.todateytd1
   * @param options.fromdate
   * @param options.todate
   * @param options.fromdateytd2
   * @param options.todateytd2
   * @returns {*}
   */
  function dataPlBranchThailand2(options) {
    var objData = {};
    // var dataCurr = dataCurrency(param);
    var ssChitieu = searchPLBranchThailand({
      subsidiary: options.subsidiary
    });
    // ssChitieu = _.uniqBy(ssChitieu, 'accountpl');

    _.map(ssChitieu, function (o) {
      _.assign(o, {ytd1: '', date: '', ytd2: ''});
    });

    var ssYTD1 = searchPLBranchThailand({
      subsidiary: options.subsidiary,
      fromdate: options.fromdateytd1,
      todate: options.todateytd1
    });
    var ss = searchPLBranchThailand({
      subsidiary: options.subsidiary,
      fromdate: options.fromdate,
      todate: options.todate
    });
    var ssYTD2 = searchPLBranchThailand({
      subsidiary: options.subsidiary,
      fromdate: options.fromdateytd2,
      todate: options.todateytd2
    });
    _.map(ssChitieu, function (o) {
      var f = _.find(ssYTD1, {chitieu: o.chitieu, accountpl: o.accountpl});
      var f1 = _.find(ss, {chitieu: o.chitieu, accountpl: o.accountpl});
      var f2 = _.find(ssYTD2, {chitieu: o.chitieu, accountpl: o.accountpl});
      if (!_.isEmpty(f)) o.ytd1 = f.amount;
      if (!_.isEmpty(f1)) o.date = f1.amount;
      if (!_.isEmpty(f2)) o.ytd2 = f2.amount;
    });

    /*
                //chỉ tiêu đấy không lọc thì nó trừ cho nhau nên về 0 ạ
                var listNotFount = [];
                _.map(ssYTD1, function (o) {
                    o.ytd1 = o.amount;
                    var f = _.find(ss, {chitieu: o.chitieu, accountpl: o.accountpl});
                    if (!_.isEmpty(f)) o.date = f.amount;
                    else listNotFount.push({chitieu: o.chitieu, accountpl: o.accountpl});
                    var f = _.find(ssYTD2, {chitieu: o.chitieu, accountpl: o.accountpl});
                    if (!_.isEmpty(f)) o.ytd2 = f.amount;
                    else listNotFount.push({chitieu: o.chitieu, accountpl: o.accountpl});

                });
                log.audit('listNotFount', listNotFount);
        */
    //Loai bo  nhung hang rong ket qua
    ssChitieu = _.reject(ssChitieu, {ytd1: '', date: '', ytd2: ''})
    return ssChitieu;
  }

  function dataPlBranchThailand3(options) {
    var objData = {};

    var ssYTD1 = searchPLBranchThailand({
      subsidiary: options.subsidiary,
      fromdate: options.fromdateytd1,
      todate: options.todateytd1
    });
    var accountpl1 = _.map(ssYTD1, 'accountpl');

    var ss = searchPLBranchThailand({
      subsidiary: options.subsidiary,
      fromdate: options.fromdate,
      todate: options.todate
    });
    var accountpl2 = _.map(ss, 'accountpl');

    var ssYTD2 = searchPLBranchThailand({
      subsidiary: options.subsidiary,
      fromdate: options.fromdateytd2,
      todate: options.todateytd2
    });
    var accountpl3 = _.map(ssYTD2, 'accountpl');

    var accountpl = _.concat(accountpl1, accountpl2, accountpl3);
    accountpl = _.uniq(accountpl);

    var ssChitieu = [];
    _.map(accountpl, function (acc) {
      var obj = {
        ytd1: '', date: '', ytd2: ''
      };
      var f = _.find(ssYTD1, {accountpl: acc});
      if (!_.isEmpty(f)) {
        obj.chitieu = f.chitieu;
        obj.chitieu_text = f.chitieu_text;
        obj.accountpl = f.accountpl;
        obj.ytd1 = f.amount;
      }
      var f = _.find(ss, {accountpl: acc});
      if (!_.isEmpty(f)) {
        obj.chitieu = f.chitieu;
        obj.chitieu_text = f.chitieu_text;
        obj.accountpl = f.accountpl;
        obj.date = f.amount;
      }
      var f = _.find(ssYTD2, {accountpl: acc});
      if (!_.isEmpty(f)) {
        obj.chitieu = f.chitieu;
        obj.chitieu_text = f.chitieu_text;
        obj.accountpl = f.accountpl;
        obj.ytd2 = f.amount;
      }
      //re-arrange object property
      var newObj = {
        chitieu: obj.chitieu,
        chitieu_text: obj.chitieu_text,
        accountpl: obj.accountpl,
        ytd1: obj.ytd1,
        date: obj.date,
        ytd2: obj.ytd2
      }
      //pust to list
      ssChitieu.push(newObj);
    });

    /*
                //chỉ tiêu đấy không lọc thì nó trừ cho nhau nên về 0 ạ
                var listNotFount = [];
                _.map(ssYTD1, function (o) {
                    o.ytd1 = o.amount;
                    var f = _.find(ss, {chitieu: o.chitieu, accountpl: o.accountpl});
                    if (!_.isEmpty(f)) o.date = f.amount;
                    else listNotFount.push({chitieu: o.chitieu, accountpl: o.accountpl});
                    var f = _.find(ssYTD2, {chitieu: o.chitieu, accountpl: o.accountpl});
                    if (!_.isEmpty(f)) o.ytd2 = f.amount;
                    else listNotFount.push({chitieu: o.chitieu, accountpl: o.accountpl});

                });
                log.audit('listNotFount', listNotFount);
        */
    //Loai bo  nhung hang rong ket qua
    ssChitieu = _.reject(ssChitieu, {ytd1: '', date: '', ytd2: ''})
    return ssChitieu;
  }

  function dataCurrency(param) {
    //currency
    var rate = 1;
    var currencyprecision = 0;
    if (!clib.isEmpty(param.currency)) {
      var recdata = slib.getRecordData(record.Type.CURRENCY, param.currency, '', ['isbasecurrency', 'currencyprecision'], []);
      if (recdata.body.isbasecurrency == false || recdata.body.isbasecurrency == 'F') {
        var currencyData = queryCurrency(param);
        if (!_.isEmpty(currencyData)) {
          rate = _.head(currencyData).rate;
          currencyprecision = recdata.body.currencyprecision;
        }
      }
    }
    if (!clib.isEmpty(param.rate))
      rate = param.rate;

    return {rate: rate, currencyprecision: currencyprecision};
  }

  /**
   *
   * @param options
   * @param options.subsidiary
   * @param options.fromdate
   * @param options.todate
   * @param options.currency
   * @return {*[]}
   */
  function searchCashflow(options) {
    var results = [];
    var tenchitieu = [
      //Inflow
      ['2', 'Operating Revenue (Rental/Selling)'],
      ['3', 'Operating Revenue Uncommitted'],
      ['4', 'Management Fee'],
      ['5', 'Proceed from Asset Divestment'],
      ['6', 'Other Operating Revenue'],
      ['7', 'Dividend from REIT'],
      ['8', 'Dividend from Subsidiary'],
      ['9', 'Dividend from JVs'],
      ['10', 'Capital Reduction'],
      ['11', 'Loan Repayment Received'],
      ['12', 'Others/ Interest Income'],
      ['13', 'PN Drawdown'],
      ['14', 'BE Issuance & Rollover'],
      ['15', 'Term Loan Drawdown'],
      ['16', 'Bond Issuance'],
      ['17', 'Loan From Subsidiary/ Shareholder'],
      //OutFlow
      ['18', 'Operating Expenses (Rental/Selling)'],
      ['19', 'Operating Expenses - Uncommitted'],
      ['20', 'SG&A'],
      ['21', 'Tax'],
      ['22', 'Other Expenses'],
      ['23', 'CAPEX - Committed - Tier 1'],
      ['24', 'CAPEX - Committed - Tier 2'],
      ['25', 'CAPEX - Uncommited'],
      ['26', 'REIT Reinvestment'],
      ['27', 'Loan to Subsidiary/ Shareholder'],
      ['28', 'PN Repayment'],
      ['29', 'BE Repayment'],
      ['30', 'Term Loan Repayment'],
      ['31', 'Bond Repayment'],
      ['32', 'Subsidiary/ SH Loan Repayment'],
      ['33', 'Interest Expenses'],
      ['34', 'Dividend Payment + W/T'],
      ['35', 'Other Financing Expenses']
    ];
    util.each(tenchitieu, function (o, i) {
      var obj = {
        chitieu: o[0],
        tenchitieu: o[1]
      };
      var listAmount = [];
      for (var i = 1; i < 13; i++) {
        listAmount.push({
          month: _.toString(i),
          amount: ''
        });
      }
      obj.listAmount = listAmount;
      results.push(obj);

    });
    //currency
    var rate = 1;
    var currencyprecision = 0;
    if (!clib.isEmpty(options.currency)) {
      var recdata = slib.getRecordData(record.Type.CURRENCY, options.currency, '', ['isbasecurrency', 'currencyprecision'], []);
      if (recdata.body.isbasecurrency == false || recdata.body.isbasecurrency == 'F') {
        var currencyData = queryCurrency(options);
        if (!_.isEmpty(currencyData)) {
          rate = _.head(currencyData).rate;
          currencyprecision = recdata.body.currencyprecision;
        }
      }
    }

    var dateFormat = slib.userPreferences().dateformat;

    var ssCheck = searchCBCheckLine(options);
    //add month for Check
    _.map(ssCheck, function (o) {
      if (!clib.isEmpty(o.date)) {
        _.assign(o, {month: moment(o.date, dateFormat).format('M')});
      }
    });
    //add amount and month for Bill
    var ssBill = searchCBBillHeader(options);
    var ssBillline = searchCBBillPaymentLine(options);
    _.map(ssBill, function (o) {
      if (!clib.isEmpty(o.date)) {
        _.assign(o, {month: moment(o.date, dateFormat).format('M')});
      }
      var f = _.find(ssBillline, {transactionnumber: o.transactionnumber})
      if (!_.isEmpty(f))
        _.assign(o, {amount: f.amount});
      else
        _.assign(o, {amount: 0});
    });

    //cals amount for Check
    _.map(results, function (o) {
      var f = _.filter(ssCheck, {chitieu: o.chitieu});
      var g = _.groupBy(f, 'month');
      util.each(_.keys(g), function (month) {
        var sameMonth = g[month];
        var sumAmt = _.sumBy(sameMonth, function (o1) {
          return _.toNumber(o1.amount);
        });
        var f = _.find(o.listAmount, {month: month});
        f.amount = _.toNumber(f.amount) + _.round(sumAmt / rate, currencyprecision);
      });
    });
    //cals amount for Bill
    _.map(results, function (o) {
      var f = _.filter(ssBill, {chitieu: o.chitieu});
      var g = _.groupBy(f, 'month');
      util.each(_.keys(g), function (month) {
        var sameMonth = g[month];
        var sumAmt = _.sumBy(sameMonth, function (o1) {
          return _.toNumber(o1.amount);
        });
        var f = _.find(o.listAmount, {month: month});
        f.amount = _.toNumber(f.amount) + _.round(sumAmt / rate, currencyprecision);
      });
    });

    //calc for Vendor prepayment
    /*Nếu type = Vendor prepayment thì lấy AMOUNT tại save search: WHA CB Vendor prepayment (don't edit): Results
        và lấy chỉ tiêu CHỈ TIÊU LCTT TT theo đường dẫn sau:
            WHA CB Vendor prepayment application header (don't edit): Results
        Lấy số TRANSACTION NUMBER
            => WHA CB Vendor prepayment application line (don't edit): Results
        Dựa vào số TRANSACTION NUMBER lấy
        TRANSACTION NUMBER APPLIED
            => WHA CB Bill header (don't edit)
        Dựạ vào số TRANSACTION NUMBER APPLIED ở SS trước, để lấy CHỈ TIÊU LCTT TT*/

    //WHA CB Vendor prepayment application header (don't edit) [transactionnumber,transactionnumapplied]
    var ssVPHeader = searchCBVendorPrepaymentApplicationHeader(options);
    //WHA CB Vendor prepayment application line (don't edit) [transactionnumber,transactionnumapplied]
    var ssVPLine = searchCBVendorPrepaymentApplicationLine(options);
    // WHA CB Vendor prepayment (don't edit) => amount [transactionnumber, amount]
    var ssVendorPre = searchCBVendorPrepayment(options);

    //WHA CB Bill header (don't edit) ssBill => chitieu  ['transactionnumber', 'chitieu', 'date',month]
    var ssBillHeader = searchCBBillHeader(options);
    _.map(ssBillHeader, function (o) {
      if (!clib.isEmpty(o.date)) {
        _.assign(o, {month: moment(o.date, dateFormat).format('M')});
      }
      var f = _.find(searchCBVendorPrepaymentApplicationHeader, {transactionnumber: o.transactionnumber});
      _.isEmpty(f) ? _.assign(o, {transactionnumapplied: ''}) : _.assign(o, {transactionnumapplied: f.transactionnumapplied});
    });
    _.map(ssBillHeader, function (o) {
      var f = _.find(searchCBVendorPrepaymentApplicationLine, {transactionnumber: o.transactionnumber});
      _.isEmpty(f) ? _.assign(o, {transactionnumapplied: ''}) : _.assign(o, {transactionnumapplied: f.transactionnumapplied});
    });
    _.map(ssBillHeader, function (o) {
      var f = _.find(searchCBVendorPrepayment, {transactionnumber: o.transactionnumapplied});
      _.isEmpty(f) ? _.assign(o, {amount: 0}) : _.assign(o, {amount: f.amount});
    });

    //cals amount for Bill
    _.map(results, function (o) {
      var f = _.filter(ssBillHeader, {chitieu: o.chitieu});
      var g = _.groupBy(f, 'month');
      util.each(_.keys(g), function (month) {
        var sameMonth = g[month];
        var sumAmt = _.sumBy(sameMonth, function (o1) {
          return _.toNumber(o1.amount);
        });
        var f = _.find(o.listAmount, {month: month});
        f.amount = _.toNumber(f.amount) + _.round(sumAmt / rate, currencyprecision);
      });
    });

    return results;
  }

  /**
   * ['amount', 'chitieu', 'date']
   * @param subsidiary
   * @param fromdate
   * @param todate
   * @returns {[]}
   */
  function searchCBDepositLine(subsidiary, fromdate, todate) {
    try {
      var filters = [];
      if (!_.isEmpty(subsidiary))
        filters.push(search.createFilter({
          name: 'subsidiary', operator: search.Operator.ANYOF, values: subsidiary
        }))
      if (!_.isEmpty(fromdate) && !_.isEmpty(todate))
        filters.push(search.createFilter({
          name: 'trandate', operator: search.Operator.WITHIN, values: [fromdate, todate]
        }))
      var cols = ['amount', 'chitieu', 'date'];
      var ss = slib.searchData(enums.SaveSearchType.CBDepositLine, filters, cols);
      return ss;
    } catch (e) {
      log.error('searchCBDepositLine error', e);
    }
  }

  function searchCustomerPaymentLine(subsidiary, fromdate, todate) {
    try {
      var filters = [];
      if (!_.isEmpty(subsidiary))
        filters.push(search.createFilter({
          name: 'subsidiary', operator: search.Operator.ANYOF, values: subsidiary
        }))
      if (!_.isEmpty(fromdate) && !_.isEmpty(todate))
        filters.push(search.createFilter({
          name: 'trandate', operator: search.Operator.WITHIN, values: [fromdate, todate]
        }))
      var cols = ['amount_applied', 'chitieu', 'transaction_numberapplied', 'date'];
      var ss = slib.searchData(enums.SaveSearchType.CustomerPaymentLine, filters, cols);
      return ss;
    } catch (e) {
      log.error('searchCustomerPaymentLine error', e);
    }
  }

  function searchCBInvoiceHeader(subsidiary) {
    try {
      var filters = [];
      if (!_.isEmpty(subsidiary)) {
        filters.push(search.createFilter({
          name: 'subsidiary', operator: search.Operator.ANYOF, values: subsidiary
        }));
      }
      var cols = ['transactionnumber', 'chitieu'];
      var ss = slib.searchData(enums.SaveSearchType.CBInvoiceHeader, filters, cols);
      return ss;
    } catch (e) {
      log.error('searchCBInvoiceHeader error', e);
    }
  }

  function searchCBCustomerDepositHeader(subsidiary, fromdate, todate) {
    try {
      var filters = [];
      if (!_.isEmpty(subsidiary))
        filters.push(search.createFilter({
          name: 'subsidiary', operator: search.Operator.ANYOF, values: subsidiary
        }))
      if (!_.isEmpty(fromdate) && !_.isEmpty(todate))
        filters.push(search.createFilter({
          name: 'trandate', operator: search.Operator.WITHIN, values: [fromdate, todate]
        }))
      var cols = ['chitieu', 'amount', 'transactionnumber', 'date'];
      var ss = slib.searchData(enums.SaveSearchType.CBCustomerDepositHeader, filters, cols);
      return ss;
    } catch (e) {
      log.error('searchCBCustomerDepositHeader error', e);
    }
  }

  function searchCBCustomerDepositLine(subsidiary, fromdate, todate) {
    try {
      var filters = [];
      if (!_.isEmpty(subsidiary))
        filters.push(search.createFilter({
          name: 'subsidiary', operator: search.Operator.ANYOF, values: subsidiary
        }))
      if (!_.isEmpty(fromdate) && !_.isEmpty(todate))
        filters.push(search.createFilter({
          name: 'trandate', operator: search.Operator.WITHIN, values: [fromdate, todate]
        }))
      var cols = ['appliedtotransactionamount', 'transactionnumber', 'appliedtotransaction', 'date'];
      var ss = slib.searchData(enums.SaveSearchType.CBCustomerDepositLine, filters, cols);
      return ss;
    } catch (e) {
      log.error('searchCBCustomerDepositLine error', e);
    }
  }

  function cashFlowData(subsidiary, fromdate, todate) {
    //Inflow
    var inflow = [
      ['2', 'Operating Revenue (Rental/Selling)'],
      ['3', 'Operating Revenue Uncommitted'],
      ['4', 'Management Fee'],
      ['5', 'Proceed from Asset Divestment'],
      ['6', 'Other Operating Revenue'],
      ['7', 'Dividend from REIT'],
      ['8', 'Dividend from Subsidiary'],
      ['9', 'Dividend from JVs'],
      ['10', 'Capital Reduction'],
      ['11', 'Loan Repayment Received'],
      ['12', 'Others/ Interest Income'],
      ['13', 'PN Drawdown'],
      ['14', 'BE Issuance & Rollover'],
      ['15', 'Term Loan Drawdown'],
      ['16', 'Bond Issuance'],
      ['17', 'Loan From Subsidiary/ Shareholder']
    ]
    //OutFlow
    var outflow = [
      ['18', 'Operating Expenses (Rental/Selling)'],
      ['19', 'Operating Expenses - Uncommitted'],
      ['20', 'SG&A'],
      ['21', 'Tax'],
      ['22', 'Other Expenses'],
      ['23', 'CAPEX - Committed - Tier 1'],
      ['24', 'CAPEX - Committed - Tier 2'],
      ['25', 'CAPEX - Uncommited'],
      ['26', 'REIT Reinvestment'],
      ['27', 'Loan to Subsidiary/ Shareholder'],
      ['28', 'PN Repayment'],
      ['29', 'BE Repayment'],
      ['30', 'Term Loan Repayment'],
      ['31', 'Bond Repayment'],
      ['32', 'Subsidiary/ SH Loan Repayment'],
      ['33', 'Interest Expenses'],
      ['34', 'Dividend Payment + W/T'],
      ['35', 'Other Financing Expenses']
    ];
    var inflowData = [];
    util.each(inflow, function (o, i) {
      var obj = {
        chitieu: o[0],
        tenchitieu: o[1]
      };
      var listAmount = [];
      for (var i = 1; i < 13; i++) {
        listAmount.push({
          month: _.toString(i),
          amount: ''
        });
      }
      obj.listAmount = listAmount;
      inflowData.push(obj);

    });
    var outflowData = [];
    util.each(outflow, function (o, i) {
      var obj = {
        chitieu: o[0],
        tenchitieu: o[1]
      };
      var listAmount = [];
      for (var i = 1; i < 13; i++) {
        listAmount.push({
          month: _.toString(i),
          amount: ''
        });
      }
      obj.listAmount = listAmount;
      outflowData.push(obj);

    });

    //currency
    var rate = 1;
    var currencyprecision = 0;
    /*if (!clib.isEmpty(options.currency)) {
            var recdata = slib.getRecordData(record.Type.CURRENCY, options.currency, '', ['isbasecurrency', 'currencyprecision'], []);
            if (recdata.body.isbasecurrency == false || recdata.body.isbasecurrency == 'F') {
                var currencyData = queryCurrency(options);
                if (!_.isEmpty(currencyData)) {
                    rate = _.head(currencyData).rate;
                    currencyprecision = recdata.body.currencyprecision;
                }
            }
        }*/

    var dateFormat = slib.userPreferences().dateformat;
    var resultsIn = [];
    var resultsOut = [];

    //Inflow data

    //1. Nếu type = Deposit thì lấy AMOUNT (NET)
    // theo chỉ tiêu tại field: CHI TIEU LCTT TT
    var ssCBDepositLine = searchCBDepositLine(subsidiary, fromdate, todate);
    util.each(ssCBDepositLine, function (o) {
      if (!_.isEmpty(o.chitieu)) {
        var obj = {
          chitieu: o.chitieu,
          amount: o.amount,
          month: moment(o.date, dateFormat).format('M')
        }
        resultsIn.push(obj);
      }
    });
    //2. Nếu type = Payment
    // Nếu trên save search: WHA Customer payment line (dont edit) có giá trị cột
    // CHỈ TIÊU LCTT TT thì ưu tiên lấy giá trị
    // AMOUNT_APPLIED, và CHỈ TIÊU LCTT TT
    var ssCustomerPaymentLine = searchCustomerPaymentLine(subsidiary, fromdate, todate);
    util.each(ssCustomerPaymentLine, function (o) {
      if (!_.isEmpty(o.chitieu)) {
        var obj = {
          chitieu: o.chitieu,
          amount: o.amount_applied,
          month: moment(o.date, dateFormat).format('M')
        }
        resultsIn.push(obj);
      }
    });
    /*Nếu trên save search: WHA Customer payment line (dont edit) không có giá trị cột thì làm theo các bước sau:
        - Căn cứ save seach: WHA Customer payment line (dont edit) lấy AMOUNT_APPLIED. Sau đó dựa trên TRANSACTION_NUMBER APPLIED để tìm tiếp chỉ tiêu LCTT trên save search:  WHA CB Invoice header (don't edit)
        - Căn cứ save search: WHA CB Invoice header (don't edit), căn cứ theo
        TRANSACTION NUMBER để lấy Chỉ tiêu LCTT tại CHI TIEU LCTT TT
        */
    var ssCBInvoiceHeader = searchCBInvoiceHeader(subsidiary);
    util.each(ssCustomerPaymentLine, function (o) {
      if (_.isEmpty(o.chitieu)) {
        var f = _.find(ssCBInvoiceHeader, {transactionnumber: o.transaction_numberapplied});
        if (!_.isEmpty(f)) {
          var obj = {
            chitieu: f.chitieu,
            amount: o.amount_applied,
            month: moment(o.date, dateFormat).format('M')
          };
          resultsIn.push(obj);
        }
      }
    });
    /*3. Nếu type = Customer deposit
        Nếu trên save search:  WHA CB Customer deposit header (don't edit) có giá trị cột CHỈ TIÊU LCTT TT thì ưu tiên lấy : AMOUNT và
        CHỈ TIÊU LCTT TT*/
    var ssCBCustomerDepositHeader = searchCBCustomerDepositHeader(subsidiary, fromdate, todate);
    util.each(ssCBCustomerDepositHeader, function (o) {
      if (!_.isEmpty(o.chitieu)) {
        var obj = {
          chitieu: o.chitieu,
          amount: o.amount,
          month: moment(o.date, dateFormat).format('M')
        };
        resultsIn.push(obj);
      }
    });
    /*Nếu trên save search:  WHA CB Customer deposit header (don't edit) không có giá trị cột CHỈ TIÊU LCTT TT thì làm theo các bước sau:
        - Căn cứ save search: WHA CB Customer deposit header (don't edit) lấy TRANSACTION NUMBER
        - Dựa trên số TRANSACTION NUMBER ở bước trên, vào save search: WHA CB Customer deposit line (don't edit) lấy APPLIED TO TRANSACTION : AMOUNT và căn cứ vào APPLIED TO TRANSACTION để lấy chỉ tiêu LCTTT
        - Dựa trên số APPLIED TO TRANSACTION ở bước trên, vào save search: WHA CB Invoice header (don't edit) lấy chi tiêu LCTT tại CHI TIEU LCTT TT*/
    var ssCBCustomerDepositLine = searchCBCustomerDepositLine(subsidiary, fromdate, todate);
    util.each(ssCBCustomerDepositHeader, function (o) {
      if (_.isEmpty(o.chitieu)) {
        var f = _.find(ssCBCustomerDepositLine, {transactionnumber: o.transactionnumber});
        if (!_.isEmpty(f)) {
          var amount = f.appliedtotransactionamount;
          var appliedtran = f.appliedtotransaction;
          var f2 = _.find(ssCBInvoiceHeader, {transactionnumber: appliedtran});
          if (!_.isEmpty(f2)) {
            var chitieu = f2.chitieu;
            var obj = {
              chitieu: chitieu,
              amount: amount,
              month: moment(o.date, dateFormat).format('M')
            };
            resultsIn.push(obj);
          }
        }
      }
    });
    /*4. Nếu type = Currency revaluation
- Lấy giá trị trên save search: SCV CB Currency revaluation - IN
- Lấy giá trị tại AMOUNT (DEBIT) và lấy chỉ tiêu CF SECTION 2*/
    //bỏ phần in giữ phần out, khu vực Currency revaluation
    var ss = searchCBCurrencyRevaluationIn(subsidiary, fromdate, todate);
    util.each(ss, function (o) {
      if (!_.isEmpty(o.chitieu)) {
        var obj = {
          chitieu: o.chitieu,
          amount: o.amount,
          month: moment(o.date, dateFormat).format('M')
        };
        resultsIn.push(obj);
      }
    });
    log.audit('searchCBCurrencyRevaluationIn', ss);

    //Outflow
    /*1. Nếu type = Write check thì lấy GROSS AMOUNT
        theo chỉ tiêu tại field: CHỈ TIÊU LCTT TT*/
    var ssCBCheckLine = searchCBCheckLine(subsidiary, fromdate, todate);
    util.each(ssCBCheckLine, function (o) {
      if (!_.isEmpty(o.chitieu)) {
        var obj = {
          chitieu: o.chitieu,
          amount: o.grossamount,
          month: moment(o.date, dateFormat).format('M')
        }
        resultsOut.push(obj);
      }
    });
    /*2. Nếu type = Bill payment
        Nếu trên save search: WHA CB Bill payment line (dont edit) , cột CHỈ TIÊU LCTT TT có giá trị
        thì ưu tiên lấy AMOUNT và CHỈ TIÊU LCTT TT*/
    var ssCBBillPaymentLine = searchCBBillPaymentLine(subsidiary, fromdate, todate);
    util.each(ssCBBillPaymentLine, function (o) {
      if (!_.isEmpty(o.chitieu)) {
        var obj = {
          chitieu: o.chitieu,
          amount: o.amount,
          month: moment(o.date, dateFormat).format('M')
        }
        resultsOut.push(obj);
      }
    });
    /*Nếu trên save search: WHA CB Bill payment line (dont edit) , cột CHỈ TIÊU LCTT TT ko có giá trị thì lấy theo
        các bước sau:
        lấy AMOUNT theo save search: WHA CB Bill payment line (dont edit): Results  và theo chỉ tiêu tại field: CHỈ TIÊU
        LCTT TT tại save search: WHA CB Bill header (don't edit): Results Key: Transaction number */
    var ssCBBillHeader = searchCBBillHeader(subsidiary, fromdate, todate);
    util.each(ssCBBillPaymentLine, function (o) {
      if (_.isEmpty(o.chitieu)) {
        var f = _.find(ssCBBillHeader, {transactionnumber: o.transactionnumber});
        if (!_.isEmpty(f)) {
          var obj = {
            chitieu: f.chitieu,
            amount: o.amount,
            month: moment(o.date, dateFormat).format('M')
          }
          resultsOut.push(obj);
        }
      }
    });
    /*3. Nếu type = Vendor prepayment thì Nếu save search WHA CB Vendor prepayment (don't edit),
        cột CHỈ TIÊU LCTT TT có giá trị thì ưu tiên lấy AMOUNT và CHỈ TIÊU LCTT TT*/
    var ssCBVendorPrepayment = searchCBVendorPrepayment(subsidiary, fromdate, todate);
    util.each(ssCBVendorPrepayment, function (o) {
      if (!_.isEmpty(o.chitieu)) {
        var obj = {
          chitieu: o.chitieu,
          amount: o.amount,
          month: moment(o.date, dateFormat).format('M')
        }
        resultsOut.push(obj);
      }
    });

    /*
        * Nếu save search WHA CB Vendor prepayment (don't edit), cột CHỈ TIÊU LCTT TT không có giá trị thì ưu tiên theo các bước sau:
        - Căn cứ save search: WHA CB Vendor prepayment (don't edit) để lấy DOCUMENT NUMBER
        - Dựa trên DOCUMENT NUMBER, căn cư save search: WHA CB Vendor prepayment application line (don't edit) để lấy AMOUNT APPLIED và lấy TRANSACTION NUM APPLIED
        - Dựa trên TRANSACTION NUM APPLIED lấy được chỉ tiêu LCTT  trên save search: WHA CB Bill header (don't edit)*/
    var ss = searchCBVendorPrepaymentApplicationLine(subsidiary, fromdate, todate);
    util.each(ssCBVendorPrepayment, function (o) {
      if (_.isEmpty(o.chitieu)) {
        var f = _.find(ss, {transactionnumber: o.transactionnumber});
        if (!_.isEmpty(f)) {
          var f1 = _.find(ssCBBillHeader, {transactionnumber: f.transactionnumapplied});
          if (!_.isEmpty(f1)) {
            var obj = {
              chitieu: f1.chitieu,
              amount: f.amountapplied,
              month: moment(f.date, dateFormat).format('M')
            }
            resultsOut.push(obj);
          }
        }
      }
    });
    /*4. Nếu type = Currency revaluation
- Lấy giá trị trên save search: SCV CB Currency revaluation - OUT
- Lấy giá trị tại AMOUNT (CREDIT) và lấy chỉ tiêu CF SECTION 2*/
    var ss = searchCBCurrencyRevaluationOut(subsidiary, fromdate, todate);
    util.each(ss, function (o) {
      if (!_.isEmpty(o.chitieu)) {
        var obj = {
          chitieu: o.chitieu,
          amount: o.amount,
          month: moment(o.date, dateFormat).format('M')
        };
        resultsOut.push(obj);
      }
    });
    //ghep data
    _.map(inflowData, function (o) {
      var f = _.filter(resultsIn, {chitieu: o.chitieu});
      var g = _.groupBy(f, 'month');
      util.each(_.keys(g), function (month) {
        var sameMonth = g[month];
        var sumAmt = _.sumBy(sameMonth, function (o1) {
          return _.toNumber(o1.amount);
        });
        var f1 = _.find(o.listAmount, {month: month});
        f1.amount = _.toNumber(f1.amount) + _.round(sumAmt / rate, currencyprecision);
      });
    });
    _.map(outflowData, function (o) {
      var f = _.filter(resultsOut, {chitieu: o.chitieu});
      var g = _.groupBy(f, 'month');
      util.each(_.keys(g), function (month) {
        var sameMonth = g[month];
        var sumAmt = _.sumBy(sameMonth, function (o1) {
          return _.toNumber(o1.amount);
        });
        var f1 = _.find(o.listAmount, {month: month});
        f1.amount = _.toNumber(f1.amount) + _.round(sumAmt / rate, currencyprecision);
      });
    });
    var data = _.concat(inflowData, outflowData);
    return data;
  }

  return {
    dataCurrency,
    searchCashflow,
    searchBankAmount,
    searchCBDepositLine,
    cashFlowData,
    getMaxEmp,
    searchBudgetcodeslist,
    searchBudgetlevel1,
    searchRP_DTNN,
    searchPL_Report,
    searchPLFSThailand,
    searchPLBranchThailand,
    searchEMPBudgetCheck,
    queryCurrency,
    dataPlBranchThailand,
    dataPlBranchThailand2,
    dataPlBranchThailand3,
    searchSONuocMay,
    searchGenerateLand,
    generateSoPhieu,
    queryPrincipalDetail,
    searchLoanAndInterestSheet,
    searchManangementFeesInfo,
    searchRSDoanhThuHaTang,
    queryDebitLoanInterest,
    getTaxCode,
    searchRecManageFeesInfo,
    searchDebitNote,
    queryClass,
    generateSoPhieuYCNX,
    searchPrincipalDetail,
    generateSoPhieuInventory,
    queryItem,
    searchCashFlowSection,
    searchCBBillHeader,
    searchCBBillPaymentLine,
    searchCBCheckLine,
    querySubsidiary,
    searchCBVendorPrepayment,
    searchCBVendorPrepaymentApplicationHeader,
    queryAccount,
    searchCBVendorPrepaymentApplicationLine,
    searchItemPricing,
    queryTerms,
    searchActualBill,
    searchActualEMP,
    searchActualLCCheck,
    queryMappingItem,
    searchRSLandSC,
    searchRSDoanhThuQuanLy,
    searchRSDoanhThuBDS,
    searchLandItems,
    searchCommitActualBudget,
    searchProjectBudgetTracking,
    searchProjectActualAmount,
    searchProjectAccountingSetup,
    createWriteCheck,
    createInventoryAdjustment,
    createJournal,
    createSCPaymentSchedule,
    generateSoPhieuYCMH,
    generateSoPhieuPO,
    searchDebitLoan,
    searchDebitLoan2,
    searchLandItemsWithSub,
    searchLandCostPosted,
    createRecord,
    searchDebitLoanAcountingSetup,
    searchApplyPaymentSchedule,
    searchExpenseBudgetActual,
    searchExpenseBudgetActual2,
    searchPurchaseRequiLineBudgetCheck,
    generateVendor,
    searchProject,
    searchProjectActualAmount2,
  };
});
