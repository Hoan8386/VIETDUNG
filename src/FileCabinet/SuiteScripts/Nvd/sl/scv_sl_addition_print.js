/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(
    [
        "N/query",
        "../lib/scv_lib_pdf.js",
        "N/record",
        "N/render",
        "../olib/lodash.min",
        "N/search",
        "N/file",
        "N/url",
        "N/xml",
        "../lib/scv_lib_amount_in_word.js",
        "N/runtime",
        '../lib/scv_lib_function',
    ],
    function (query, libPdf, record, render, _, search, file, url, xml, libAmt, _runtime, lfunc) {
        var entityId = "", subsidiaryId = "", departmentId = "";
        var isImpact = false;

        const onRequest = scriptContext => {
            const params = scriptContext.request.parameters;
            const request = scriptContext.request;
            const response = scriptContext.response;
            const renderType = params.rendertype;
            let isBoolean = true;
            let objResult = {};
            if (request.method === "GET") {
                try {
                    if (renderType === "pdf") {
                        objResult = renderPdfWithTmpl(scriptContext);
                    } else {
                        objResult.file = renderRecordToPdfWithTemplate(params.id, params.type, params.printfile);
                    }
                    response.writeFile(objResult.file, isBoolean)
                } catch (err) {
                    log.error("Error onRequest: ", err)
                }
            }
        }

        const renderRecordToPdfWithTemplate = (id, type, printfile) => {
            if(!printfile) throw "Chưa có setup file xml!";
            let renderer = libPdf.renderTemplateWithXml(printfile);
            let rec = addDefaultRecordRender(renderer, type, id);
            let objSubsidiary = addDefaultSubsidiaryInfo(rec, renderer);

            switch (printfile) {
                case "scv_render_pakt_pdf":
                case "scv_render_tb_pakt_pdf":
                    printPAKT(rec, renderer);
                    break;
            }
            let pdfFile = renderer.renderAsPdf();
            
            return pdfFile;
        }

        const addDefaultSubsidiaryInfo = (rec, renderer) => {
            let recType = rec.type;
            let subsidiary_id = rec.getValue("subsidiary");
            if(recType === 'customrecord_nvd_cong_viec_iso') {
                subsidiary_id = rec.getValue("custrecord_nvd_cong_ty");
            }
            if(!subsidiary_id) return {};

            let subRec = record.load({ type: "subsidiary", id: subsidiary_id });
            renderer.addRecord('subsidiary', subRec);

            let addressRec = subRec.getSubrecord({
                fieldId: 'mainaddress'
            });
            let objAddress = {
                addr1: addressRec.getValue("addr1"),
                addressee: addressRec.getValue("addressee"),
                country: addressRec.getValue("country"),
                addrphone: addressRec.getValue("addrphone"),
            };
            
            return {
                subRec,
                ...objAddress
            };
        }

        const printPAKT = (rec, renderer) => {
            let custrecord_nvd_noi_nhan = rec.getText('custrecord_nvd_noi_nhan');
            let custrecord_nvd_thanh_phan_tham_gia = rec.getText('custrecord_nvd_thanh_phan_tham_gia');

            custrecord_nvd_noi_nhan = libPdf.formatDataXML(custrecord_nvd_noi_nhan.join(','));
            custrecord_nvd_noi_nhan = custrecord_nvd_noi_nhan.replaceAll(',', '<br/>');

            custrecord_nvd_thanh_phan_tham_gia = libPdf.formatDataXML(custrecord_nvd_thanh_phan_tham_gia.join(','));
            custrecord_nvd_thanh_phan_tham_gia = custrecord_nvd_thanh_phan_tham_gia.replaceAll(',', '<br/>');
            
            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT, 
                alias: 'jsonData', 
                data: {
                    custrecord_nvd_noi_nhan,
                    custrecord_nvd_thanh_phan_tham_gia
                }
            });
        }

        const addDefaultRecordRender = (renderer, type, id) => {
            let rec = record.load({
                type: type,
                id: id,
                isDynamic: false
            });
            renderer.addRecord('record', rec);
            return rec;
        }


        const renderPdfWithTmpl = scriptContext => {
            const params = scriptContext.request.parameters;
            const recType = params.rectype;
            const recId = params.recid;
            const tmplId = params.tmpl;
            let mainRecord = {};
            if (recType === "customrecord_scv_dntt") {
                mainRecord.id = recId;
                mainRecord.recType = recType;
            } else {
                mainRecord = record.load({type: recType, id: recId});
            }
            let objData = {};
            const renderer = libPdf.initTemplateRender(tmplId);
            let objParams = {mainRecord, objData, renderer, tmplId};
            // Case 01: Default print UNC(FIRST ID: CUSTTMPL_SCV_PHIEU_UNC)
            // Case 02: Print Other Template
            if (tmplId.includes("CUSTTMPL_SCV_PHIEU_UNC")) {
                const accountid = mainRecord.getValue("account");
                const recAccount = search.lookupFields({
                    type: search.Type.ACCOUNT,
                    id: accountid,
                    columns: ["custrecord_scv_pdf_template"]
                });
                subsidiaryId = mainRecord.getValue("subsidiary")
                addCustomDataSubsidiary(renderer, subsidiaryId);
                try {
                    const templateid = recAccount["custrecord_scv_pdf_template"][0].value;
                    addCustomDataUNC(mainRecord, renderer, recType);
                    renderer.addRecord("record", mainRecord);
                    renderer.setTemplateById(templateid);
                } catch (e) {
                    log.error("Show error: ", e);
                    renderer.setTemplateByScriptId('CUSTTMPL_SCV_ERROR_TEMPLATE');
                }
            } else {
                isImpact = [
                    record.Type.ITEM_RECEIPT,
                    record.Type.DEPOSIT,
                    record.Type.CUSTOMER_DEPOSIT,
                    record.Type.CUSTOMER_PAYMENT,
                    record.Type.CHECK,
                    record.Type.VENDOR_PAYMENT,
                    record.Type.VENDOR_PREPAYMENT,
                    record.Type.JOURNAL_ENTRY,
                    record.Type.VENDOR_BILL,
                    record.Type.VENDOR,
                    record.Type.VENDOR_CREDIT,
                    record.Type.INVOICE,
                    record.Type.CREDIT_MEMO,
                    record.Type.INVENTORY_ADJUSTMENT,
                    record.Type.EXPENSE_REPORT,
                    'custompurchase_scv_lenhchi'
                ].indexOf(recType) !== -1;

                switch (recType) {
                    case "itemreceipt":
                        doPrintItemReceipt(objParams);
                        break;
                    case record.Type.DEPOSIT :
                        doPrintDeposit(objParams)
                        break;
                    case record.Type.CUSTOMER_DEPOSIT :
                        doPrintCustomerDeposit(objParams)
                        break;
                    case record.Type.CUSTOMER_PAYMENT :
                        doPrintCustomerPayment(objParams)
                        break;
                    case record.Type.CHECK:
                        doPrintCheck(objParams);
                        break;
                    case record.Type.VENDOR_PAYMENT:
                        doPrintVendorPayment(objParams);
                        break;
                    case record.Type.VENDOR_PREPAYMENT:
                        doPrintVendorPrepayment(objParams)
                        break;
                    case record.Type.JOURNAL_ENTRY:
                        doPrintJournalEntry(objParams);
                        break;
                    case record.Type.VENDOR_BILL:
                        doPrintVendorBill(objParams);
                        break;
                    case record.Type.VENDOR:
                        doPrintVendor(objParams);
                        break;
                    case record.Type.VENDOR_CREDIT:
                        doPrintVendorCredit(objParams);
                        break;
                    case record.Type.INVOICE:
                        doPrintInvoice(objParams);
                        break;
                    case record.Type.CREDIT_MEMO:
                        doPrintCreditMemo(objParams);
                        break;
                    case record.Type.INVENTORY_ADJUSTMENT:
                        doPrintInventoryAdjustment(objParams);
                        break;
                    case record.Type.EXPENSE_REPORT:
                        doPrintExpenseReport(objParams);
                        break;
                    case "customrecord_scv_emp":
                        doPrintEmployeePrepayment(objParams);
                        break;
                    case "custompurchase_scv_lenhchi":
                        doPrintLenhChi(objParams);
                        break;
                    case "customrecord_ncfar_asset":
                        doPrintFAMAsset(objParams);
                        break;
                    case "customrecord_scv_dntt":
                        doPrintDNTT(objParams);
                        break;
                    default:
                        break;
                }
                addGLImpact(renderer, recType, recId)
                if (isImpact) {
                    objData["objImpacts"] = getDataGlImpact(renderer, recId)
                }
                if (objData?.objImpacts?.impacts.length > 0) {
                    objData.resultImpacts = objData.objImpacts.impacts.map(obj => {
                        return {
                            impactName: obj.creditamount == "0" ? "Nợ" : "Có",
                            impactAccount: obj.account_num,
                            impactAmount: obj.creditamount == "0" ? obj.debitamount : obj.creditamount
                        }
                    });
                }
                const user_id = runtime.getCurrentUser().id;
                const objEmployee = getDataEmployee(user_id);
                addCustomDataEntity(renderer, entityId);
                addCustomDataSubsidiary(renderer, subsidiaryId);
                renderer.addCustomDataSource({format: render.DataSource.OBJECT, alias: 'employee', data: objEmployee});
                renderer.addCustomDataSource({format: render.DataSource.OBJECT, alias: 'jsonData', data: objData});
                renderer.setTemplateByScriptId(tmplId);
            }

            const fileObj = renderer.renderAsPdf();

            return {file: fileObj};
        }

        /*------------------------------------------------------------------------------------------------------*/

        const doPrintCheck = ({mainRecord, objData, renderer, tmplId}) => {
            entityId = mainRecord.getValue("entity");
            subsidiaryId = mainRecord.getValue("subsidiary");
        }

        const doPrintVendorPrepayment = ({mainRecord, objData, renderer, tmplId}) => {
            entityId = mainRecord.getValue("entity");
            subsidiaryId = mainRecord.getValue("subsidiary");
        }

        const doPrintVendorPayment = ({mainRecord, objData, renderer, tmplId}) => {
            entityId = mainRecord.getValue("entity");
            subsidiaryId = mainRecord.getValue("subsidiary");

        }

        const doPrintDeposit = ({mainRecord, objData, renderer, tmplId}) => {
            entityId = mainRecord.getValue("custbody_scv_payee");
            _.isEmpty(entityId) ? entityId = mainRecord.getSublistValue('other', 'entity', 0) : "";
            subsidiaryId = mainRecord.getValue("subsidiary");
        }

        const doPrintCustomerDeposit = ({mainRecord, objData, renderer, tmplId}) => {
            entityId = mainRecord.getValue("customer");
            subsidiaryId = mainRecord.getValue("subsidiary");

        }

        const doPrintCustomerPayment = ({mainRecord, objData, renderer, tmplId}) => {
            entityId = mainRecord.getValue("customer");
            subsidiaryId = mainRecord.getValue("subsidiary");
        }

        const doPrintJournalEntry = ({mainRecord, objData, renderer, tmplId}) => {
            entityId = mainRecord.getValue("customer");
            subsidiaryId = mainRecord.getValue("subsidiary");
        }

        const doPrintVendorBill = ({mainRecord, objData, renderer, tmplId}) => {
            entityId = mainRecord.getValue("entity");
            subsidiaryId = mainRecord.getValue("subsidiary");
        }
        const doPrintLenhChi = ({mainRecord, objData, renderer, tmplId}) => {
            entityId = mainRecord.getValue("custbody_scv_com_name");
            subsidiaryId = mainRecord.getValue("subsidiary");
        }
        const doPrintVendor = ({mainRecord, objData, renderer, tmplId}) => {
            entityId = mainRecord.getValue("entity");
            subsidiaryId = mainRecord.getValue("subsidiary");
        }

        const doPrintVendorCredit = ({mainRecord, objData, renderer, tmplId}) => {
            entityId = mainRecord.getValue("entity");
            subsidiaryId = mainRecord.getValue("subsidiary");
        }

        const doPrintInvoice = ({mainRecord, objData, renderer, tmplId}) => {
            entityId = mainRecord.getValue("entity");
            subsidiaryId = mainRecord.getValue("subsidiary");
        }

        const doPrintCreditMemo = ({mainRecord, objData, renderer, tmplId}) => {
            entityId = mainRecord.getValue("entity");
            subsidiaryId = mainRecord.getValue("subsidiary");
        };
        const getEntityType = (entityId) => search.lookupFields({
            type: "entity",
            id: entityId,
            columns: ["recordtype"]
        }).recordtype;
        const doPrintInventoryAdjustment = ({mainRecord, objData, renderer, tmplId}) => {
            switch (tmplId) {
                case "CUSTTMPL_SCV_PHIEU_XUAT_KHO":
                    break;
            }
        }

        const doPrintExpenseReport = ({mainRecord, objData, renderer, tmplId}) => {
            entityId = mainRecord.getValue("entity");
            subsidiaryId = mainRecord.getValue("subsidiary");
            const empNumber = mainRecord.getValue("custbody_scv_emp_number");
            objData["pSoTienNopTra"] = 0;
            objData["pSoTienBoSung"] = 0;
            if (empNumber) {
                const ikEmp = search.lookupFields({
                    type: "customrecord_scv_emp",
                    id: empNumber,
                    columns: ["custrecord_scv_emp_remaining_amount"]
                });
                const empRemainingAmount = _.toNumber(ikEmp["custrecord_scv_emp_remaining_amount"]);
                empRemainingAmount > 0
                    ?
                    objData["pSoTienNopTra"] = changeCurrency(empRemainingAmount)
                    :
                    objData["pSoTienBoSung"] = changeCurrency(Math.abs(empRemainingAmount))
            }

            const ssEmpCheckId = "customsearch_scv_emp_precheck";
            const ssEmpExpenseReportId = "customsearch_scv_emp_exprep";
            const filters = {};
            filters.ssEmpCheck = [];
            filters.ssEmpExpenseReport = [];
            empNumber ? filters.ssEmpCheck.push(search.createFilter({
                name: "custbody_scv_emp_number",
                operator: "anyof",
                values: empNumber
            })) : "";
            empNumber ? filters.ssEmpExpenseReport.push(search.createFilter({
                name: "custbody_scv_emp_number",
                operator: "anyof",
                values: empNumber
            })) : "";
            objData.ssEmpCheck = getDataSSEmpCheck(ssEmpCheckId, filters.ssEmpCheck);
            objData.ssEmpExpenseReport = getDataSSEmpExpenseReport(ssEmpExpenseReportId, filters.ssEmpExpenseReport);
        }
        const getObjTableQuery = (_table, _arrColumns, _condition) => {
            let sql = `SELECT ` + _arrColumns.join(",") + ` 
        FROM ` + _table + `
        WHERE ` + _condition;
            let resultSearch = query.runSuiteQL({
                query: sql
            });
            resultSearch = resultSearch.asMappedResults();
            return resultSearch.length > 0 ? resultSearch : [];
        }
        const lkfRec = (_recType, _recId, _columns) => search.lookupFields({
            type: _recType,
            id: _recId,
            columns: _columns
        });
        const getObjTableQueryByID = (_table, _arrColumns, _id) => {
            if (_arrColumns.length === 0) _arrColumns.push("id")
            let resultSearch = query.runSuiteQL({
                query: `SELECT ` + _arrColumns.join(",") + ` 
        FROM ` + _table + `
        WHERE id = ` + _id
            });
            resultSearch = resultSearch.asMappedResults();

            return resultSearch.length > 0 ? resultSearch[0] : {};
        }
        const printPNK = (_rec, _renderer, _objData) => {
            const subsidiary = {};
            const subsidiaryId = _rec.getValue("subsidiary");
            const arrItemId = [], arrSlItem = [];
            let location = _rec.getText("location");
            const parts = location.split(":");
            location = parts[1] ? parts[1].trim() : location;
            let tongThanhTien = 0;
            const currentUser = runtime.getCurrentUser();
            const objCurUser = getObjTableQueryByID(getEntityType(currentUser.id), ["custentity_scv_legal_name"], currentUser.id);
            objCurUser.custentity_scv_legal_name = objCurUser.custentity_scv_legal_name?.toUpperCase();
            if (subsidiaryId) {
                const objSub = getObjTableQueryByID("subsidiary", ["custrecord_scv_sub_ktt", "custrecord_scv_ten_giam_doc", "BUILTIN.DF(mainaddress) as mainaddress_text", "legalname"], subsidiaryId);
                subsidiary.legalname = objSub.legalname?.toUpperCase() || "";
                subsidiary.custrecord_scv_sub_ktt = objSub.custrecord_scv_sub_ktt?.toUpperCase() || "";
                subsidiary.custrecord_scv_ten_giam_doc = objSub.custrecord_scv_ten_giam_doc?.toUpperCase() || "";
                subsidiary.mainaddress_text = objSub.mainaddress_text || "";
            }
            const sublist = "item";
            for (let i = 0; i < _rec.getLineCount(sublist); i++) {
                const description = _rec.getSublistValue(sublist, "description", i);
                const units = _rec.getSublistValue(sublist, "unitsdisplay", i);
                const quantity = _rec.getSublistValue(sublist, "quantity", i) * 1;
                const rate = _rec.getSublistValue(sublist, "rate", i) * 1;
                const thanhTien = quantity * rate;
                const itemId = _rec.getSublistValue(sublist, "item", i);
                tongThanhTien += thanhTien;
                arrItemId.push(itemId);
                arrSlItem.push({
                    stt: i + 1,
                    quantity: changeCurrency(quantity),
                    rate: changeCurrency(rate),
                    thanhTien: changeCurrency(thanhTien),
                    description, units, itemId,
                })
            }
            const arrFields = ["id", "upccode"];
            const arrInforItem = arrItemId.length > 0 ? getObjTableQuery(query.Type.ITEM, arrFields, "id in (" + arrItemId.join(",") + ")") : [];
            arrSlItem.map(obj => {
                const objItem = arrInforItem.find(e => e.id == obj.itemId)
                if (objItem) {
                    obj.upccode = objItem.upccode || "";
                }
                return obj
            })
            _objData.objCurUser = objCurUser;
            _objData.custbody_scv_ho_ten_nguoi_giao_hang = _rec.getValue("custbody_scv_ho_ten_nguoi_giao_hang")?.toUpperCase()
            _objData.subsidiary = subsidiary;
            _objData.location = location;
            _objData.tongThanhTien = changeCurrency(tongThanhTien);
            _objData.arrSlItem = arrSlItem;
            _objData.tongThanhTien_bangChu = libAmt.DocTienBangChu(tongThanhTien, "VND");
        }
        const printBBGN = (_rec, _renderer, _objData) => {
            const subsidiary = {}, entity = {}
            const subsidiaryId = _rec.getValue("subsidiary");
            const entityId = _rec.getValue("entity");
            const arrSlItem = [];
            let location = _rec.getText("location");
            if (subsidiaryId) {
                const objSub = getObjTableQueryByID("subsidiary", ["fax", "BUILTIN.DF(mainaddress) as mainaddress_text", "legalname"], subsidiaryId);
                subsidiary.legalname = objSub.legalname?.toUpperCase() || "";
                subsidiary.mainaddress_text = objSub.mainaddress_text || "";
                subsidiary.fax = objSub.fax || "";
            }
            if (entityId) {
                const objEmp = getObjTableQueryByID("vendor", ["fax", "phone", "BUILTIN.DF(defaultbillingaddress) as defaultaddress", "custentity_scv_legal_name"], entityId);
                entity.custentity_scv_legal_name = objEmp.custentity_scv_legal_name?.toUpperCase() || "";
                entity.defaultaddress = objEmp.defaultaddress || "";
                entity.phone = objEmp.phone || "";
                entity.fax = objEmp.fax || "";
            }
            const sublist = "item";
            for (let i = 0; i < _rec.getLineCount(sublist); i++) {
                if (!location) location = _rec.getSublistText(sublist, "location", 0);
                const unitsdisplay = _rec.getSublistValue(sublist, "unitsdisplay", i);
                const quyCach = _rec.getSublistValue(sublist, "custcol_scv_quy_cach_dong_goi", i);
                const quantity = _rec.getSublistValue(sublist, "quantity", i) * 1;
                const itemName = _rec.getSublistValue(sublist, "itemname", i);
                arrSlItem.push({
                    stt: i + 1,
                    quantity: changeCurrency(quantity),
                    unitsdisplay, itemName, quyCach
                })
            }
            if (location) {
                const parts = location.split(":");
                location = parts[1] ? parts[1].trim() : location;
            }
            _objData.subsidiary = subsidiary;
            _objData.entity = entity;
            _objData.arrSlItem = arrSlItem;
            _objData.location = location;
        }
        const doPrintItemReceipt = ({mainRecord, objData, renderer, tmplId}) => {

        }
        const printDNTU = (_rec, _renderer, _objData) => {
            const currentUser = runtime.getCurrentUser();
            const custrecord_scv_emp_subsidiary = {}, subsidiary_curUser = {}, custrecord_scv_emp_employee = {};
            const subsidiaryId = _rec.getValue("custrecord_scv_emp_subsidiary");
            if (subsidiaryId) {
                const objSub = getObjTableQueryByID("subsidiary", ["custrecord_scv_sub_ktt", "custrecord_scv_ten_giam_doc"], subsidiaryId);
                Object.keys(objSub).forEach(key => {
                    custrecord_scv_emp_subsidiary[key] = objSub[key]?.toUpperCase() || "";
                });
            }
            const objSubCur = getObjTableQueryByID("subsidiary", ["BUILTIN.DF(mainaddress) as mainaddress_text", "legalname"], currentUser.subsidiary);
            subsidiary_curUser.legalname = objSubCur.legalname?.toUpperCase() || "";
            subsidiary_curUser.mainaddress_text = objSubCur.mainaddress_text || "";

            const prepaymentAmount = _rec.getValue("custrecord_scv_emp_prepayment_amount") * 1;
            const custrecord_scv_emp_employee_id = _rec.getValue("custrecord_scv_emp_employee");
            if (custrecord_scv_emp_employee_id) {
                const objEmp = getObjTableQueryByID("employee", ["custentity_scv_legal_name", "BUILTIN.DF(department) as department"], custrecord_scv_emp_employee_id);
                custrecord_scv_emp_employee.custentity_scv_legal_name = objEmp.custentity_scv_legal_name?.toUpperCase() || "";
                custrecord_scv_emp_employee.department = objEmp.department || "";
            }
            _objData.custrecord_scv_emp_subsidiary = custrecord_scv_emp_subsidiary;
            _objData.subsidiary_curUser = subsidiary_curUser;
            _objData.custrecord_scv_emp_employee = custrecord_scv_emp_employee;
            _objData.custrecord_scv_emp_memo = _rec.getValue("custrecord_scv_emp_memo");
            _objData.custrecord_scv_emp_prepayment_amount = changeCurrency(prepaymentAmount);
            _objData.custrecord_scv_emp_prepayment_amount_bangChu = libAmt.DocTienBangChu(prepaymentAmount, "VND");
            _objData.custrecord_scv_emp_payment_method = _rec.getText("custrecord_scv_emp_payment_method");
            _objData.custrecord_scv_emp_beb_bank_account = _rec.getValue("custrecord_scv_emp_beb_bank_account");
            _objData.custrecord_scv_emp_beb_bank_name = _rec.getValue("custrecord_scv_emp_beb_bank_name");
            _objData.custrecord_scv_emp_beb_beneficiary = _rec.getValue("custrecord_scv_emp_beb_beneficiary");
        }
        const printGiayTT_TienTU = (_rec, _renderer, _objRes) => {
            let subsidiaryid = _rec.getValue("subsidiary");
            let objSubsidiary = getObjTableQueryByID("subsidiary", ["BUILTIN.DF(mainaddress) as mainaddress_text", "legalname"], subsidiaryid);
            let objData = getDataBangThanhToanTienTU(_rec);
            _objRes.objSubsidiary = objSubsidiary;
            _objRes.amt_in_word = libAmt.DocTienBangChu(objData.amt_in_word, "VND");
            _objRes.arrData = objData.data;
        }
        const doPrintEmployeePrepayment = ({mainRecord, objData, renderer, tmplId}) => {
            switch (tmplId) {
                case "CUSTTMPL_SCV_DNTU":
                    printDNTU(mainRecord, renderer, objData);
                    break;
                default:
                    entityId = mainRecord.getValue("custrecord_scv_emp_employee");
                    subsidiaryId = mainRecord.getValue("custrecord_scv_emp_subsidiary");
                    departmentId = mainRecord.getValue("custrecord_scv_emp_dep");

                    const amountPrepay = mainRecord.getValue("custrecord_scv_emp_prepayment_amount");
                    const currencyText = mainRecord.getText("custrecord_scv_emp_currency");
                    objData.AmountPrepaymentWord = libAmt.DocTienBangChu(amountPrepay, currencyText);
                    const empRemainingAmount = _.toNumber(mainRecord.getValue("custrecord_scv_emp_remaining_amount"));
                    objData["pSoTienNopTra"] = 0;
                    objData["pSoTienBoSung"] = 0;
                    empRemainingAmount > 0
                        ?
                        objData["pSoTienNopTra"] = changeCurrency(empRemainingAmount)
                        :
                        objData["pSoTienBoSung"] = changeCurrency(Math.abs(empRemainingAmount));
                    const empId = mainRecord.id;
                    const ssEmpCheckId = "customsearch_scv_emp_precheck";
                    const ssEmpExpenseReportId = "customsearch_scv_emp_exprep";
                    let filters = {};
                    filters.ssEmpCheck = [];
                    filters.ssEmpExpenseReport = [];
                    filters.ssEmpCheck.push(search.createFilter({
                        name: "custbody_scv_emp_number",
                        operator: "anyof",
                        values: empId
                    }));
                    filters.ssEmpExpenseReport.push(search.createFilter({
                        name: "custbody_scv_emp_number",
                        operator: "anyof",
                        values: empId
                    }));

                    objData.ssEmpCheck = getDataSSEmpCheck(ssEmpCheckId, filters.ssEmpCheck);
                    objData.ssEmpExpenseReport = getDataSSEmpExpenseReport(ssEmpExpenseReportId, filters.ssEmpExpenseReport);
                    break;
            }
        }
        const printDNTT = (_rec, _renderer, _objData) => {
            const arrField = [
                "UPPER(BUILTIN.DF(custrecord_scv_dntt_trinhduyet)) as custrecord_scv_dntt_trinhduyet",
                "UPPER(BUILTIN.DF(custrecord_scv_dntt_ktt)) as custrecord_scv_dntt_ktt",
                "UPPER(BUILTIN.DF(custrecord_scv_dntt_ptp)) as custrecord_scv_dntt_ptp",
                "UPPER(BUILTIN.DF(custrecord_scv_depart)) as custrecord_scv_depart",
                "UPPER(BUILTIN.DF(custrecord_scv_dntt_beb_beneficiary)) as custrecord_scv_dntt_beb_beneficiary",
                "custrecord_scv_dntt_beb_bank_name", "custrecord_scv_dntt_beb_bank_account", "BUILTIN.DF(custrecord_scv_dntt_httt) as custrecord_scv_dntt_httt",
                "custrecord_scv_remark", "custrecord_scv_pay_amt_net", "custrecord_scv_vendor as entityid", "custrecord_scv_dntt_subsidiary as subsidiaryId"];
            const objDNTT = getObjTableQuery("customrecord_scv_dntt", arrField, `id = ${_rec.id}`)[0];
            const {custrecord_scv_pay_amt_net, entityid, subsidiaryid} = objDNTT;
            const currentUser = runtime.getCurrentUser();
            const custrecord_scv_dntt_subsidiary = {}, custrecord_scv_vendor = {};
            if (subsidiaryid) {
                const objSub = getObjTableQueryByID("subsidiary", ["BUILTIN.DF(mainaddress) as mainaddress_text", "UPPER(legalname) as legalname"], subsidiaryid);
                Object.keys(objSub).forEach(key => {
                    custrecord_scv_dntt_subsidiary[key] = objSub[key] || "";
                });
            }
            if (entityid) {
                const entityType = getEntityType(entityid);
                if (entityType === "employee") {
                    const objEmp = getObjTableQueryByID(getEntityType(entityid), ["BUILTIN.DF(department) as department", "UPPER(custentity_scv_legal_name) as custentity_scv_legal_name"], entityid);
                    Object.keys(objEmp).forEach(key => {
                        custrecord_scv_vendor[key] = objEmp[key] || "";
                    });
                } else {
                    const objEmp = getObjTableQueryByID(getEntityType(entityid), ["UPPER(custentity_scv_legal_name) as custentity_scv_legal_name"], entityid);
                    Object.keys(objEmp).forEach(key => {
                        custrecord_scv_vendor[key] = objEmp[key] || "";
                    });
                }
            }
            const objCurUser = getObjTableQueryByID("employee", ["UPPER(custentity_scv_legal_name) as custentity_scv_legal_name"], currentUser.id);
            Object.keys(objDNTT).forEach(key => {
                _objData[key] = objDNTT[key] || "";
            });
            _objData.nguoiLapPhieu = objCurUser.custentity_scv_legal_name;
            _objData.custrecord_scv_dntt_subsidiary = custrecord_scv_dntt_subsidiary;
            _objData.custrecord_scv_vendor = custrecord_scv_vendor;
            _objData.custrecord_scv_pay_amt_net = changeCurrency(custrecord_scv_pay_amt_net);
            _objData.custrecord_scv_pay_amt_net_bangChu = libAmt.DocTienBangChu(custrecord_scv_pay_amt_net, "VND");
        }
        const doPrintDNTT = ({mainRecord, objData, renderer, tmplId}) => {
            switch (tmplId) {
                case "CUSTTMPL_SCV_DNTT":
                    printDNTT(mainRecord, renderer, objData);
                    break;
                default:
                    entityId = mainRecord.getValue("custrecord_scv_vendor");
                    subsidiaryId = mainRecord.getValue("custrecord_scv_dntt_subsidiary");
                    departmentId = mainRecord.getValue("custrecord_scv_depart");

                    let arr = [], totalGrossAmount = 0, arrDNHU = [];
                    //add render entity
                    const vRemark = mainRecord.getValue('custrecord_scv_remark');
                    const user_id = runtime.getCurrentUser().id;
                    const user_rec = record.load({
                        type: record.Type.EMPLOYEE,
                        id: user_id
                    });
                    let nameSupCreatedBy = '';
                    const createdById = mainRecord.getValue('custrecord_scv_createdby');
                    if (createdById) {
                        const empCreatedBy = record.load({id: createdById, type: record.Type.EMPLOYEE});
                        const supervisorOfCreatedId = empCreatedBy.getValue('supervisor');
                        nameSupCreatedBy = getLegalNameEntity(supervisorOfCreatedId)
                    }
                    const supervisorOfUserId = user_rec.getValue('supervisor');
                    const legalNameSupervisorUser = getLegalNameEntity(supervisorOfUserId)
                    const slCt = "recmachcustrecord_scv_dntt_ct";
                    const lc = mainRecord.getLineCount(slCt);
                    for (let i = 0; i < lc; i++) {
                        const hld_inv = mainRecord.getSublistValue(slCt, "custrecord_scv_hld_inv", i);
                        const grossamount = mainRecord.getSublistValue(slCt, "custrecord_scv_hld_grossamount", i) * 1;
                        totalGrossAmount += grossamount;
                        arr.push({
                            stt: (i + 1),
                            hld_inv: hld_inv,
                            grossamount: changeCurrency(Math.round(grossamount))
                        });
                    }
                    let total = 0, slDNHU = 'recmachcustrecord_scv_ct_dnhu_dntt';
                    const lcDNHU = mainRecord.getLineCount(slDNHU);
                    for (let j = 0; j < lcDNHU; j++) {
                        const memo = mainRecord.getSublistValue(slDNHU, "custrecord_scv_ct_dnhu_ndhoan", j);
                        const gross_amt = mainRecord.getSublistValue(slDNHU, "custrecord_scv_st_dnhu_sotien_hoan", j) * 1;
                        arrDNHU.push({
                            stt: j + 1,
                            memo: memo,
                            gross_amt: changeCurrency(Math.round(gross_amt))
                        });
                        total += gross_amt;
                    }

                    // add object
                    const objResult = {
                        body_data: arr,
                        totalGrossAmount: changeCurrency(Math.round(totalGrossAmount)),
                        amountInWord: libAmt.DocTienBangChu(totalGrossAmount, "VND"),
                        legalNameSupervisor: legalNameSupervisorUser,
                        nameSupCreatedBy: nameSupCreatedBy,
                        memoTrans: arrDNHU.find(o => !!o.memo)?.memo || vRemark,
                    }
                    Object.assign(objData, objResult);
                    break;
            }
        }

        const doPrintFAMAsset = ({mainRecord, objData, renderer, tmplId}) => {
            subsidiaryId = mainRecord.getValue("custrecord_assetsubsidiary");
            departmentId = mainRecord.getValue("custrecord_assetdepartment");
            entityId = mainRecord.getValue("custrecord_assetcaretaker");

            objData.arrDataSubAsset = getInfoSubAsset(mainRecord.id);
            objData.arrDataDeprHistory = JSON.stringify(getInfoDepreciationHistoryList(mainRecord.id));
        }


        /*------------------------------------------------------------------------------------------------------*/
        const getDataSSEmpCheck = (savedSearchId, filters) => {
            if (filters.length === 0) return [];
            const searchObj = search.load(savedSearchId);
            const COLS = searchObj.columns;
            filters.forEach(filter => searchObj.filters.push(filter));
            return searchObj
                .run()
                .getRange(0, 1000)
                .reduce((data, result) =>
                    [
                        ...data,
                        {
                            empNumber: result.getText(COLS[0]),
                            sochungtu: result.getValue(COLS[1]),
                            ngaychi: result.getValue(COLS[2]),
                            sotien: changeCurrency(_.toNumber(result.getValue(COLS[6]))),
                        }
                    ], []);
        }

        const getDataSSEmpExpenseReport = (savedSearchId, filters) => {
            if (filters.length === 0) return [];
            const searchObj = search.load(savedSearchId);
            const COLS = searchObj.columns;
            filters.forEach(filter => searchObj.filters.push(filter));
            return searchObj
                .run()
                .getRange(0, 1000)
                .reduce((data, result) =>
                    [
                        ...data,
                        {
                            empNumber: result.getText(COLS[0]),
                            sochungtu: result.getValue(COLS[1]),
                            ngaychi: result.getValue(COLS[2]),
                            sotien: changeCurrency(_.toNumber(result.getValue(COLS[5]))),
                        }
                    ], []);
        }

        const getDataBangThanhToanTienTU = (_rec) => {
            let arrResult = [];
            let empId = _rec.getValue("custbody_scv_emp_number");
            let arrEmpCheck = getDataSSEmpCheckV2(empId);
            let arrExpense = getDataSublistExpense(_rec);
            let total_empcheck = arrEmpCheck.reduce((a, b) => a + b.total, 0);
            let total_empexr = arrExpense.reduce((a, b) => a + b.total, 0);
            // Mục I
            let objTienTU = {
                memo: 'Số tiền tạm ứng', class: "b", stt: "I", total: total_empcheck
            };
            arrResult.push(objTienTU);
            arrResult = [...arrResult, ...arrEmpCheck];
            // Mục II
            let objTienHU = {
                memo: 'Số tiền đã chi', class: "b", stt: "II", total: total_empexr
            };
            arrResult.push(objTienHU);
            arrResult = [...arrResult, ...arrExpense];
            // Mục III
            let total_muc_iii = total_empcheck - total_empexr;
            let arrChenhLech = [
                {memo: 'Chênh lệch', class: "b", stt: "III"},
                {
                    memo: "Tạm ứng chưa chi hết (I - II)",
                    class: "i",
                    stt: "1",
                    total: total_muc_iii < 0 ? '' : total_muc_iii
                },
                {
                    memo: "Chi vượt tạm ứng (II - I)",
                    class: "i",
                    stt: "2",
                    total: total_muc_iii < 0 ? Math.abs(total_muc_iii) : ''
                },
            ];
            arrResult = [...arrResult, ...arrChenhLech];
            arrResult = formatNumberWithArray(arrResult, ["amount", "amount_vat", "total"]);
            return {data: arrResult, amt_in_word: Math.abs(total_muc_iii)};
        }

        const formatNumberWithArray = (_array, _fields) => {
            let arrResult = _array.map(objEle => {
                _fields.forEach(num => {
                    if (objEle[num]) {
                        objEle[num] = changeCurrency(objEle[num]);
                    }
                });
                return objEle;
            });
            return arrResult;
        }

        const getDataSublistExpense = (_rec) => {
            let arrResult = [];
            let sl = "expense";
            let lc = _rec.getLineCount(sl);
            for (let i = 0; i < lc; i++) {
                let memo = _rec.getSublistValue(sl, "memo", i);
                let amount = _rec.getSublistValue(sl, "amount", i) * 1;
                let tax1amt = _rec.getSublistValue(sl, "tax1amt", i) * 1;
                arrResult.push({
                    memo: memo, amount: amount, amount_vat: tax1amt,
                    total: amount + tax1amt,
                });
            }
            return arrResult;
        }

        const getDataSSEmpCheckV2 = (_internalid) => {
            if (!_internalid) return [];
            let resultSearch = search.load("customsearch_scv_emp_precheck");
            let mycolumns = resultSearch.columns;
            let myFilter = resultSearch.filters;
            myFilter.push(search.createFilter({
                name: 'custbody_scv_emp_number',
                operator: "anyof",
                values: _internalid
            }));
            resultSearch = resultSearch.runPaged({pageSize: 1000});
            let arrResult = [], stt = 0;
            for (let i = 0; i < resultSearch.pageRanges.length; i++) {
                let currentPage = resultSearch.fetch({index: i}).data;
                for (let idx = 0; idx < currentPage.length; idx++) {
                    stt++;
                    let obj = {};
                    obj.class = "i";
                    obj.stt = stt;
                    obj.memo = "Phiếu chi " + currentPage[idx].getText(mycolumns[0]) + " ngày " + currentPage[idx].getValue(mycolumns[2]);
                    obj.total = currentPage[idx].getValue(mycolumns[6]) * 1;
                    arrResult.push(obj);
                }
            }
            return arrResult;
        }

        const getInfoDepreciationHistoryList = (idParentAsset) => {
            try {
                const transAmounts = getAmountDeprHistory(idParentAsset);
                return Object.keys(transAmounts)
                    .reduce((acc, year) => {
                            acc[year] = {
                                currentAmount: changeCurrency(transAmounts[year]),
                                totalAmount: changeCurrency(getTotalAllAmount(transAmounts, year))
                            };
                            return acc;
                        }, {}
                    )
            } catch (err) {
                log.error("Error getInfoDepreciationHistoryList: ", err);
                return {};
            }
        }

        const getTotalAllAmount = (transAmounts, year) => {
            let total = 0;
            let minYear = Math.min(...Object.keys(transAmounts));
            let iYear = year;
            while (iYear >= minYear) {
                total += transAmounts[iYear];
                iYear--;
            }
            return total;
        }

        const getAmountDeprHistory = (idParentAsset) => {
            try {
                const columns = [
                    search.createColumn({name: 'custrecord_deprhistamount', label: "Transaction amount"}),
                    search.createColumn({name: 'custrecord_deprhistdate', sort: search.Sort.DESC, label: "Date"}),
                ];
                const arrDataTransAmtYear = search.create({
                    type: "customrecord_ncfar_deprhistory",
                    filters: [
                        ["custrecord_deprhistasset", "anyof", idParentAsset], "AND",
                        ["custrecord_deprhisttype", "anyof", "2"],
                    ],
                    columns: columns
                })
                    .run()
                    .getRange(0, 1000).reduce((acc, result) => {
                            const transAmt = +result.getValue(columns[0]) || 0;
                            const year = result.getValue(columns[1]).split("/")[2];
                            if (!acc.hasOwnProperty(year)) {
                                acc[year] = 0;
                            }
                            acc[year] += transAmt;
                            return acc;
                        },
                        {}
                    );
                return arrDataTransAmtYear;
            } catch (err) {
                log.error("Error getAmountDeprHistory: ", err);
            }
        }
        const getInfoSubAsset = idParentAsset => {
            try {
                const columnsAsset = [
                    search.createColumn({name: 'altname', label: 'Name'}),
                    search.createColumn({name: "custrecord_scv_asset_unit", label: 'Units'}),
                    search.createColumn({name: "custrecord_ncfar_quantity", label: 'Quantity'}),
                    search.createColumn({name: "custrecord_assetcost", label: 'Asset Original Cost'}),
                ];
                const searchObjAsset = search.create({
                    type: "customrecord_ncfar_asset",
                    filters: ["custrecord_assetparent", "anyof", idParentAsset],
                    columns: columnsAsset
                })
                    .run()
                    .getRange(0, 1000);

                const arrDataChildAsset = [];
                const numberChildAsset = searchObjAsset.length;
                for (let i = 0; i < numberChildAsset; i++) {
                    arrDataChildAsset.push({
                        name: searchObjAsset[i].getValue(columnsAsset[0]),
                        units: searchObjAsset[i].getValue(columnsAsset[1]),
                        quantity: changeCurrency(+searchObjAsset[i].getValue(columnsAsset[2]) || 0),
                        assetOriginalCost: changeCurrency(+searchObjAsset[i].getValue(columnsAsset[3]) || 0),
                    })
                }
                return arrDataChildAsset;
            } catch (err) {
                log.error("Error getInfoSubAsset: ", err);
                return [];
            }
        }

        const getDataGlImpact = (renderer, id) => {
            const idSearch = "customsearch_scv_gl_impact";
            const sGlImpact = search.load({id: idSearch});
            const cGlImpact = sGlImpact.columns;
            const fGlImpact = sGlImpact.filters;
            fGlImpact.push(search.createFilter({
                name: 'internalid',
                operator: search.Operator.ANYOF,
                values: id
            }));
            const rGlImpact = sGlImpact.run().getRange({start: 0, end: 1000});
            const impacts = [];
            const GLImpactLength = rGlImpact.length;
            let totaldebit = 0, totalcredit = 0;
            for (let i = 0; i < GLImpactLength; i++) {
                totaldebit += Number(rGlImpact[i].getValue(cGlImpact[1]));
                totalcredit += Number(rGlImpact[i].getValue(cGlImpact[2]));
                const memo = rGlImpact[i].getValue(cGlImpact[4]);
                const cost_code = rGlImpact[i].getText(cGlImpact[5]);
                const entity = rGlImpact[i].getText(cGlImpact[3]);
                const account = rGlImpact[i].getValue(cGlImpact[0]);
                // let memo_main = rGlImpact[i].getValue(cGlImpact[5]);
                impacts.push({
                    account: account,
                    account_num: account.toString().includes("None") ? "" : account.slice(0, 4),
                    account_sub: account.slice(0, 4),
                    debit_arrange: _.toNumber(rGlImpact[i].getValue(cGlImpact[1])),
                    debitamount: changeCurrency(rGlImpact[i].getValue(cGlImpact[1]) * 1),
                    creditamount: changeCurrency(rGlImpact[i].getValue(cGlImpact[2]) * 1),
                    entity: entity.toString().includes("None") ? "" : entity,
                    memo: memo.toString().includes("None") ? "" : memo,
                    cost_code: cost_code.toString().includes("None") ? "" : cost_code,
                });
            }

            const newImpacts = _.orderBy(impacts, ["debit_arrange"], ["desc"])

            return {
                impacts: newImpacts,
                totaldebit: changeCurrency(totaldebit),
                totalcredit: changeCurrency(totalcredit),
                amtInword: libAmt.DocTienBangChu(totaldebit, "VND")
            };
        }

        const addGLImpact = (renderer, recType, recId) => {
            if (recType.slice(0, 2) === 'customrecord') return;
            const idSearch = "customsearch_scv_gl_impact";
            const sGlImpact = search.load({id: idSearch})
            const cGlImpact = sGlImpact.columns;
            const fGlImpact = sGlImpact.filters;
            fGlImpact.push(search.createFilter({
                name: 'internalid',
                operator: search.Operator.ANYOF,
                values: recId
            }))
            sGlImpact.filters = fGlImpact;

            const rGlImpact = sGlImpact.run().getRange({start: 0, end: 1000});
            const impacts = [];
            let totalAmount = 0;
            for (let i = 0; i < rGlImpact.length; i++) {
                totalAmount += Number(rGlImpact[i].getValue(cGlImpact[1]));
                impacts.push({
                    account: rGlImpact[i].getValue(cGlImpact[0]),
                    account_sub: rGlImpact[i].getValue(cGlImpact[0]).slice(0, 4),
                    debitamount: rGlImpact[i].getValue(cGlImpact[1]),
                    creditamount: rGlImpact[i].getValue(cGlImpact[2]),
                    entity: rGlImpact[i].getValue(cGlImpact[3]).replace("- None -", ""),
                    memo: rGlImpact[i].getValue(cGlImpact[4]),
                })
            }
            const arr_grp_impact = lfunc.onGroupByArray(impacts, ["account"]);
            let account_debit = "", account_credit = "", account_debit_amount = [], account_credit_amount = [];
            const lengthGL = arr_grp_impact.length;
            for (let i = 0; i < lengthGL; i++) {
                const arr_filter_impacts = impacts.filter(item => item.account === arr_grp_impact[i].account)
                const filterImpactsLength = arr_filter_impacts.length;
                let debitamount = 0;
                let creditamount = 0;
                for (let j = 0; j < filterImpactsLength; j++) {
                    if (j === 0) {
                        arr_grp_impact[i].entity = arr_filter_impacts[j].entity;
                        arr_grp_impact[i].account_sub = arr_filter_impacts[j].account_sub;
                        arr_grp_impact[i].memo = arr_filter_impacts[j].memo;
                    }
                    debitamount += Number(arr_filter_impacts[j].debitamount);
                    creditamount += Number(arr_filter_impacts[j].creditamount);
                }
                if (debitamount > 0) {
                    account_debit += arr_grp_impact[i].account_sub + ", ";
                    account_debit_amount.push({
                        account: arr_grp_impact[i].account_sub,
                        amount: changeCurrency(debitamount)
                    })
                } else if (creditamount > 0) {
                    account_credit += arr_grp_impact[i].account_sub + ", ";
                    account_credit_amount.push({
                        account: arr_grp_impact[i].account_sub,
                        amount: changeCurrency(creditamount)
                    });
                }
                arr_grp_impact[i].debitamountStr = changeCurrency(debitamount);
                arr_grp_impact[i].creditamountStr = changeCurrency(creditamount);
                arr_grp_impact[i].debitamount = debitamount;
                arr_grp_impact[i].creditamount = creditamount;
                arr_grp_impact[i].isDebit = (debitamount > 0 ? "T" : "F")
            }
            let newImpacts = impacts.map(o => {
                const obj = {...o};
                obj.debitamount = Number(o.debitamount);
                obj.creditamount = Number(o.creditamount);
                obj.debitamountStr = changeCurrency(obj.debitamount);
                obj.creditamountStr = changeCurrency(obj.creditamount);
                obj.isDebit = (obj.debitamount > 0 ? "T" : "F");
                return obj;
            });
            newImpacts = funcSortGLImpact(newImpacts);
            const objDataGL = {
                impacts: newImpacts,
                accountDebit: account_debit.slice(0, -2),
                accountCredit: account_credit.slice(0, -2),
                accountDebitAmount: account_debit_amount,
                accountCreditAmount: account_credit_amount,
                amountInWord: libAmt.DocTienBangChu(totalAmount, "VND")
            }
            try {
                renderer.addCustomDataSource({format: render.DataSource.OBJECT, alias: "GL", data: objDataGL})
            } catch (e) {
                log.debug('GL impact', JSON.stringify(e))
            }
        }

        const funcSortGLImpact = (arrData) => {
            return fnSortDebitCredit(arrData).sort((a, b) => a.memo.localeCompare(b.memo));
        }

        function fnSortDebitCredit(impacts) {
            return impacts.sort(function (objA, objB) {
                if (objA?.debitamount > objB?.debitamount) return -1;
                if (objA?.debitamount === objB?.debitamount) return 0;
                if (objA?.debitamount < objB?.debitamount) return 1;
            })
        }

        const addCustomDataUNC = (rec, renderer, type) => {
            const accountid = rec.getValue("account");
            const exchangerate = rec.getValue("exchangerate");
            const fieldEntity = getFieldEntityTrans(type);
            const entity = rec.getValue(fieldEntity);
            if (entity) {
                const entityRec = record.load({type: lfunc.getEntityType(entity), id: entity});
                renderer.addRecord('entity', entityRec);
            }
            let total = getTotalAmount(type, rec);
            const beneficiaryid = rec.getValue("custbody_scv_beneficiary_bank");
            const objAccount = {}, objBody = {}, objBeneficiary = {};
            try {
                const accountLKF = search.lookupFields({
                    type: search.Type.ACCOUNT,
                    id: accountid,
                    columns: [
                        "custrecord_scv_acc_bank_acc", "custrecord_scv_acc_bank_account_name",
                        "custrecord_scv_acc_bank_address", "custrecord_scv_acc_bank_name",
                        "custrecord_scv_acc_bank_branchname"
                    ]
                });

                objAccount.custrecord_scv_acc_bank_acc = accountLKF.custrecord_scv_acc_bank_acc;
                objAccount.custrecord_scv_bank_account_name = accountLKF.custrecord_scv_acc_bank_account_name;
                objAccount.custrecord_scv_bank_address = accountLKF.custrecord_scv_acc_bank_address;
                objAccount.custrecord_scv_acc_bank_branchname = accountLKF.custrecord_scv_acc_bank_branchname;
                objAccount.custrecord_scv_bank_name = accountLKF.custrecord_scv_acc_bank_name
            } catch (err) {
                log.error("Error Load data in account:  ", err);
            }

            if (beneficiaryid) {
                const beneficiaryLKF = search.lookupFields({
                    type: "customrecord_scv_beb",
                    id: beneficiaryid,
                    columns: [
                        "custrecord_scv_beb_bank_address",
                        "custrecord_scv_beb_beneficiary",
                        'custrecord_scv_beb_bank_account',
                        'custrecord_scv_beb_bank_name',
                        'custrecord_scv_beb_bank_banranch'
                    ]
                });
                objBeneficiary.custrecord_scv_beb_bank_address = beneficiaryLKF.custrecord_scv_beb_bank_address;
                objBeneficiary.custrecord_scv_beb_beneficiary = beneficiaryLKF.custrecord_scv_beb_beneficiary;
                objBeneficiary.custrecord_scv_beb_bank_banranch = beneficiaryLKF.custrecord_scv_beb_bank_banranch;
                objBeneficiary.custrecord_scv_beb_bank_name = beneficiaryLKF.custrecord_scv_beb_bank_name;
                objBeneficiary.custrecord_scv_beb_bank_account = beneficiaryLKF.custrecord_scv_beb_bank_account;
            }
            objBody.total = changeCurrency(total);
            objBody.exchangerate = changeCurrency(exchangerate);
            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: "jsonUNC",
                data: {
                    body: objBody,
                    total: changeCurrency(total),
                    account: objAccount,
                    beneficiary: objBeneficiary,
                    amountInWord: libAmt.DocTienBangChu(total, "VND")
                }
            });
        }

        const getFieldEntityTrans = (type) => {
            let entityField = '';
            switch (type) {
                case 'custompurchase_scv_lenhchi':
                    entityField = 'custbody_scv_com_name';
                    break;
                default:
                    entityField = 'entity';
                    break;
            }
            return entityField;
        }

        const getTotalAmount = (type, rec) => {
            let total;
            switch (type) {
                case record.Type.VENDOR_PREPAYMENT:
                    total = rec.getValue("payment");
                    break;
                case record.Type.CHECK:
                    total = rec.getValue("usertotal");
                    break;
                case 'custompurchase_scv_lenhchi':
                    total = rec.getValue("custbody_scv_lc_amount_st");
                    break;
                case record.Type.VENDOR_BILL:
                case record.Type.VENDOR_PAYMENT:
                    total = rec.getValue("total");
                    break
                default:
                    total = rec?.getValue("usertotal");
                    break;
            }
            return total * 1;
        }

        const addCustomDataEntity = (renderer, id) => {
            if (_.isEmpty(id)) return;
            const entityType = lfunc.getEntityType(id);
            const entityRec = record.load({type: entityType, id: id,})
            renderer.addRecord('entity', entityRec);
        }

        const addCustomDataSubsidiary = (renderer, id) => {
            if (_.isEmpty(id)) return;
            const subRecord = record.load({type: record.Type.SUBSIDIARY, id: id});
            renderer.addRecord({templateName: "subsidiary", record: subRecord});
            const subsidiarySubAddress = subRecord.getSubrecord({fieldId: 'mainaddress'});
            const objSub = {
                name: subsidiarySubAddress.getValue('name'),
                addr1: subsidiarySubAddress.getValue('addr1'),
                addr2: subsidiarySubAddress.getValue('addr2'),
                city: subsidiarySubAddress.getValue('city'),
                addressee: subsidiarySubAddress.getValue('addressee'),
                addrphone: subsidiarySubAddress.getValue('addrphone'),
                custrecord_scv_sub_ktt: subRecord.getValue('custrecord_scv_sub_ktt'),
                custrecord_scv_ten_giam_doc: subRecord.getValue('custrecord_scv_ten_giam_doc')
            }
            renderer.addCustomDataSource({format: render.DataSource.OBJECT, alias: "subAdd", data: objSub,});
        }

        const getDataEmployee = id => {
            const resultSearch = search.create({
                type: "employee",
                filters: [
                    ["internalid", "anyof", id]
                ],
                columns: [
                    search.createColumn({name: "custentity_scv_legal_name", label: "Legalname"}),
                    search.createColumn({name: "title", label: "Job Title"}),
                    search.createColumn({name: "email", label: "Email"}),
                    search.createColumn({name: "phone", label: "Phone"}),
                    search.createColumn({name: "subsidiary", label: "Subsidiary"}),
                    search.createColumn({name: "department", label: "Department"}),
                ]
            });
            const myColumns = resultSearch.columns;
            const myResult = resultSearch.run().getRange({start: 0, end: 1});
            let objEmployee = {};
            if (myResult.length !== 0) {
                objEmployee = {
                    custentity_scv_legal_name: myResult[0].getValue(myColumns[0]),
                    title: myResult[0].getValue(myColumns[1]),
                    email: myResult[0].getValue(myColumns[2]),
                    phone: myResult[0].getValue(myColumns[3]),
                    subsidiary: myResult[0].getValue(myColumns[4]),
                    department: myResult[0].getValue(myColumns[5]),
                };
            }
            return objEmployee;
        }

        function getLegalNameEntity(id) {
            if (!id) return '';
            return search.lookupFields({
                type: lfunc.getEntityType(id),
                id: id,
                columns: ['custentity_scv_legal_name']
            })?.custentity_scv_legal_name || '';
        }


        const changeCurrency = number => {
            const parts = number.toString().split(".");
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            return parts.join(".");
        }

        return {
            onRequest
        }
    }
);