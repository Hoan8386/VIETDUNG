/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/runtime', 'N/search',
        '../lib/scv_lib_function.js', '../lib/scv_lib_report.js', '../lib/scv_lib_vat_import.js'],
    
    (record, runtime, search, libFunc, libRep, libVatImp) => {
        const searchRelatedTran = (id, sType) => {
            let idRelatedTran = null;
            if (id) {
                let sTran = search.create({
                    type: sType,
                    filters: [['custbody_scv_emp_number', search.Operator.ANYOF, id]
                    ],
                    columns: ['custbody_scv_emp_number']
                });
                let rTran = sTran.run().getRange({start: 0, end: 1});
                if (rTran.length > 0) {
                    idRelatedTran = rTran[0].id;
                }
            }
            return idRelatedTran;
        }

        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type
         * @param {Form} scriptContext.form - Current form
         * @Since 2015.2
         */
        const beforeLoad = (scriptContext) => {
            let newRecord = scriptContext.newRecord;
            let type = scriptContext.type;
            let form = scriptContext.form;
            let recType = newRecord.type;
            if (type === 'view') {
                let relatedId = newRecord.getValue('custbody_scv_related_transaction');
                if (relatedId !== undefined && !relatedId) {
                    if (recType === record.Type.INVOICE || recType === record.Type.JOURNAL_ENTRY) {
                        let urlCheckReplace = "window.location.replace('/app/accounting/transactions/check.nl?createdfromid=" + newRecord.id + "&createdrectype=" + recType + "')";
                        if (recType === record.Type.INVOICE) {
                            form.addButton({id: 'custpage_bt_check', label: 'Check', functionName: urlCheckReplace});
                        }
                    } else if (recType === record.Type.VENDOR_BILL) {
                        let urlCheckReplace = "window.location.replace('/app/accounting/transactions/deposit.nl?createdfromid=" + newRecord.id + "&createdrectype=" + recType + "')";//&selectedtab=cmmnctntab
                        form.addButton({id: 'custpage_bt_deposit', label: 'Deposit', functionName: urlCheckReplace});
                    }
                }
                if (recType === 'customrecord_scv_emp') {
                    let roleInfo = runtime.getCurrentUser();
                    let roleCenter = roleInfo.roleCenter;//log.error('roleCenter', roleCenter);
                    let check_amount = newRecord.getValue('custrecord_scv_emp_check_amount');
                    let remaining_amount = newRecord.getValue('custrecord_scv_emp_remaining_amount');
                    let urlCheckReplace = "window.open('/app/accounting/transactions/check.nl?createdfromid=" + newRecord.id + "&createdrectype=" + recType + "')";
                    let emp_status = newRecord.getValue('custrecord_scv_emp_status');
                    if (emp_status === '3' && check_amount === 0) {
                        form.addButton({
                            id: 'custpage_bt_ep_check',
                            label: 'Check',
                            functionName: urlCheckReplace
                        });
                    }
                    if (remaining_amount > 0) {
                        urlCheckReplace = "window.location.replace('/app/accounting/transactions/exprept.nl?createdfromid=" + newRecord.id + "&createdrectype=" + recType + "')";
                        form.addButton({
                            id: 'custpage_bt_ep_expense_report',
                            label: 'Expense Report',
                            functionName: urlCheckReplace
                        });
                        urlCheckReplace = "window.location.replace('/app/accounting/transactions/deposit.nl?createdfromid=" + newRecord.id + "&createdrectype=" + recType + "')";
                        form.addButton({
                            id: 'custpage_bt_ep_deposit',
                            label: 'Deposit',
                            functionName: urlCheckReplace
                        });
                    }
                    if (remaining_amount !== 0) {
                        let urlJnReplace = "window.location.replace('/app/accounting/transactions/journal.nl?createdfromid=" + newRecord.id + "&createdrectype=" + recType + "')";
                        form.addButton({
                            id: 'custpage_bt_journal',
                            label: 'Journal',
                            functionName: urlJnReplace
                        });
                    }
                    //}
                    if (roleCenter === 'BASIC' || roleCenter === 'ACCOUNTCENTER' || roleCenter === 'SALESCENTER') {
                        let customer = newRecord.getValue('custrecord_scv_emp_customer');
                        if (customer) {
                            let readSublist = 'recmachcustrecord_scv_epl_prepayment';
                            let lCount = newRecord.getLineCount({sublistId: readSublist});
                            if (lCount === 0) {
                                newRecord = record.load({type: newRecord.type, id: newRecord.id});
                                lCount = newRecord.getLineCount({sublistId: readSublist});
                            }
                            let related_so = searchRelatedTran(newRecord.id, 'salesorder');
                            if (lCount > 0 && related_so == null) {
                                let urlSOReplace = "window.location.replace('/app/accounting/transactions/salesord.nl?createdfromid=" + newRecord.id + "&createdrectype=" + recType + "')";
                                form.addButton({
                                    id: 'custpage_bt_makeso',
                                    label: 'Make SO',
                                    functionName: urlSOReplace
                                });
                            }
                        }
                    }
                }
            } else if (type === 'copy') {
                libFunc.setValueData(newRecord, ['custbody_scv_created_transaction', 'custbody_scv_related_transaction', 'custbody_scv_doc_number'], ['', '', '', '']);//'custbody_scv_emp_number',
            } else if (type === 'create') {
                let request = scriptContext.request;
                if (!request) {
                    return;
                }
                let param = request.parameters;
                if (param) {
                    let createdfromid = param.createdfromid;
                    let createdrectype = param.createdrectype;
                    if (createdfromid && createdrectype && createdrectype !== 'customrecord_scv_emp' && createdrectype !== 'customrecord_scv_loa' && createdrectype !== 'inboundshipment') {
                        libFunc.setValueData(newRecord, ['custbody_scv_created_transaction', 'custbody_scv_related_transaction', 'custbody_scv_emp_number', 'custbody_scv_doc_number'], ['', '', '', '']);
                        if (recType === 'check') {
                            libFunc.setValueData(newRecord, ['custbody_scv_created_transaction'], [createdfromid]);
                        } else if (recType === record.Type.DEPOSIT) {
                            let readRecord = record.load({type: createdrectype, id: createdfromid});
                            let location = readRecord.getValue('location');
                            let newFields = ['subsidiary', 'location', 'department', 'class', 'currency', 'exchangerate', 'memo'];
                            let readFields = ['subsidiary', 'location', 'department', 'class', 'currency', 'exchangerate', 'memo'];
                            libFunc.setValue(newRecord, readRecord, newFields, readFields);
                            let newSublist = 'other';
                            let readSublist = 'expense';
                            let lCount = readRecord.getLineCount({sublistId: readSublist});
                            let newSublistFields = ['account', 'amount', 'memo', 'department', 'class'];
                            let readSublistFields = ['account', 'amount', 'memo', 'department', 'class'];
                            let entity = readRecord.getValue('entity');
                            let i;
                            for (i = 0; i < lCount; i++) {
                                newRecord.insertLine({sublistId: newSublist, line: i});
                                libFunc.setSublistValueData(newRecord, newSublist, ['entity', 'location'], i, [entity, location]);
                                libFunc.setSublistValue(newRecord, readRecord, newSublist, readSublist, newSublistFields, readSublistFields, i);
                            }
                            readSublist = 'item';
                            lCount = readRecord.getLineCount({sublistId: readSublist});
                            newSublistFields = ['amount', 'memo', 'department', 'class'];
                            readSublistFields = ['amount', 'memo', 'department', 'class'];
                            let item, lkF, expenseaccount, temp;
                            for (let j = 0; j < lCount; j++) {
                                expenseaccount = '';
                                item = readRecord.getSublistValue({sublistId: readSublist, fieldId: 'item', line: j});
                                lkF = search.lookupFields({type: 'item', id: item, columns: ['expenseaccount']});
                                temp = lkF.expenseaccount;
                                if (temp && temp.length > 0) {
                                    expenseaccount = temp[0].value;
                                }
                                newRecord.insertLine({sublistId: newSublist, line: i});
                                libFunc.setSublistValueData(newRecord, newSublist, ['entity', 'account', 'location'], i, [entity, expenseaccount, location]);
                                libFunc.setSublistValueDiff(newRecord, readRecord, newSublist, readSublist, newSublistFields, readSublistFields, i, j);
                                i++;
                            }

                            libFunc.setValueData(newRecord, ['custbody_scv_created_transaction'], [createdfromid]);
                        } else if (recType === record.Type.JOURNAL_ENTRY) {
                            let readRecord = record.load({type: createdrectype, id: createdfromid});
                            libVatImp.setDefaultFromItemReceiptToJournal(readRecord, newRecord, false);
                        } else if (recType === createdrectype) {
                            copyRecordFromId(newRecord, createdfromid, ['expense', 'item']);
                        }
                    } else if (recType === record.Type.VENDOR_PAYMENT) {
                        libFunc.setValueData(newRecord, ['custbody_scv_created_transaction', 'custbody_scv_related_transaction', 'custbody_scv_emp_number', 'custbody_scv_doc_number'], ['', '', '', '']);
                        let bill = param.bill;
                        let entity = param.entity;
                        if (bill && entity) {
                            let lkTran = search.lookupFields({
                                type: 'transaction',
                                id: bill,
                                columns: ['recordtype', 'custbody_scv_emp_number']
                            });
                            let emp_number = lkTran.custbody_scv_emp_number;
                            if (emp_number && emp_number.length > 0) {
                                emp_number = emp_number[0].value;
                            } else {
                                emp_number = '';
                            }
                            libFunc.setValueData(newRecord, ['custbody_scv_emp_number'], [emp_number]);
                        }
                    }

                    if (createdfromid && createdrectype === 'customrecord_scv_emp') {
                        let readRecord = record.load({type: createdrectype, id: createdfromid});
                        let emp = readRecord.getValue('custrecord_scv_emp_employee');
                        let emp_currency = readRecord.getValue('custrecord_scv_emp_currency');
                       
                        libFunc.addButtonBack(scriptContext.form, createdfromid, createdrectype);
                        let readEmp = record.load({type: record.Type.EMPLOYEE, id: emp});
                        let account = readEmp.getValue('custentity_scv_emp_prepayment_account');
                        if (!account) {
                            account = getAccountFlNumber('14110001');//tam ung tien
                        }
                        libFunc.setValueData(newRecord, ['custbody_scv_emp_number'], [createdfromid]);
                        if (recType === 'check') {
                            let newSublist = 'expense';//item
                            libFunc.setValueData(newRecord, ['entity', 'currency'], [emp, emp_currency]);
                            libFunc.setValue(newRecord, readRecord, ['duedate', 'memo', 'custbody_scv_beneficiary', 'usertotal'],
                                ['custrecord_scv_emp_due_date', 'custrecord_scv_emp_memo', 'custrecord_scv_emp_beb', 'custrecord_scv_emp_prepayment_amount']);
                            let slEmp = 'recmachcustrecord_scv_emp_line_amt_emp';
                            let line_fields = ['account', 'amount', 'memo', 'custcol_scv_invoice_amount'];
                            let line_fields_n = ['location', 'department', 'class', 'taxcode'];
                            let taxcode = '5', amount, linememo;//UNDEF
                            let lcEmp = readRecord.getLineCount(slEmp);
                            if(lcEmp > 0) {
                            	for(let i = 0; i < lcEmp; i++) {
                            		newRecord.insertLine({sublistId: newSublist, line: i});
    	                            amount = readRecord.getSublistValue({sublistId: slEmp, fieldId: 'custrecord_scv_emp_line_amt', line: i});
    	                            linememo = readRecord.getSublistValue({sublistId: slEmp, fieldId: 'custrecord_scv_emp_line_amt_des', line: i});
    	                            libFunc.setSublistValueData(newRecord, newSublist, line_fields, i, [account, amount, linememo, amount]);

    	                            libFunc.setSublistValueData(newRecord, newSublist, line_fields_n, i,
    	                                [readEmp.getValue('location'), readEmp.getValue('department'), readEmp.getValue('class'), taxcode]);
                            	}
                            } else {
	                            newRecord.insertLine({sublistId: newSublist, line: 0});
	                            let amount = readRecord.getValue('custrecord_scv_emp_prepayment_amount');
	                            libFunc.setSublistValueData(newRecord, newSublist, line_fields, 0, [account, amount, readRecord.getValue('custrecord_scv_emp_memo'), amount]);
	                            libFunc.setSublistValueData(newRecord, newSublist, line_fields_n, 0,
	                                [readEmp.getValue('location'), readEmp.getValue('department'), readEmp.getValue('class'), taxcode]);
                            }
                        } else if (recType === record.Type.DEPOSIT) {
                            let newSublist = 'other';
                            libFunc.setValue(newRecord, readRecord, ['duedate', 'memo'], ['custrecord_scv_emp_due_date', 'custrecord_scv_emp_memo']);
                            newRecord.insertLine({sublistId: newSublist, line: 0});
                            libFunc.setSublistValueData(newRecord, newSublist, ['entity', 'account', 'amount'], 0, [emp, account, readRecord.getValue('custrecord_scv_emp_remaining_amount')]);
                            libFunc.setSublistValueData(newRecord, newSublist, ['location', 'department', 'class'], 0, [readEmp.getValue('location'), readEmp.getValue('department'), readEmp.getValue('class')]);
                        } else if (recType === record.Type.EXPENSE_REPORT) {
                            let form = scriptContext.form;
                            libFunc.setDisableFields(form, ['entity']);
                            let recEmp = record.load({type: record.Type.EMPLOYEE, id: emp});
                            let currency = recEmp.getValue('currency');
                            libFunc.setValueData(newRecord, ['entity', 'expensereportcurrency', 'advanceaccount'], [emp, currency, account]);
                            libFunc.setValue(newRecord, readRecord, ['duedate', 'memo', 'advance'], ['custrecord_scv_emp_due_date', 'custrecord_scv_emp_memo', 'custrecord_scv_emp_remaining_amount']);
                        } else if (recType === record.Type.JOURNAL_ENTRY) {
                            libFunc.setValue(newRecord, readRecord, ['subsidiary', 'currency'], ['custrecord_scv_emp_subsidiary', 'custrecord_scv_emp_currency']);
                            libFunc.setValueData(newRecord, ['custbody_scv_emp_number'], [createdfromid]);
                        }
                    }
                    if (createdfromid && createdrectype === 'customrecord_scv_loa') {
                        let form = scriptContext.form;
                        let principal = param.principal;
                        let readLoa = record.load({type: createdrectype, id: createdfromid});
                        let newFields = ['entity', 'subsidiary', 'currency'];
                        let readFields = ['custrecord_scv_loa_entity', 'custrecord_scv_loa_subsidiary', 'custrecord_scv_loa_currency'];
                        libFunc.setValueData(newRecord, ['custbody_scv_loa'], [createdfromid]);
                        libFunc.setValue(newRecord, readLoa, newFields, readFields);
                        libFunc.setDisableFields(form, ['entity', 'subsidiary', 'custbody_scv_loa']);//'currency',
                        if (recType === record.Type.VENDOR_BILL) {
                            if (principal === true || principal === 'true') {
                                libFunc.setValue(newRecord, readLoa, ['trandate', 'duedate'], ['custrecord_scv_loa_start_date', 'custrecord_scv_loa_end_date']);
                                libFunc.setDisableFields(form, ['trandate', 'duedate']);
                            } else {
                                libFunc.setValueData(newRecord, ['account'], [getItemFlNumber('34190001')]);//34190001
                            }
                        } else if (recType === record.Type.INVOICE) {
                            if (principal === true || principal === 'true') {
                                libFunc.setValue(newRecord, readLoa, ['trandate', 'duedate'], ['custrecord_scv_loa_start_date', 'custrecord_scv_loa_end_date']);
                                libFunc.setDisableFields(form, ['trandate', 'duedate']);
                            } else {
                                libFunc.setValueData(newRecord, ['account'], [getItemFlNumber('13881101')]);//13881101
                            }
                        }
                    }
                }
            }
        }
        
        const getAccountFlNumber = (accNum) => {
            let s = search.create({
                type: 'account',
                columns: ['name'],
                filters: [['number', 'is', accNum]]
            });
            let r = s.run().getRange({start: 0, end: 1});
            let idAcc = '';
            if (r.length > 0) {
                idAcc = r[0].id;
            }
            return idAcc;
        }
        
        const getItemFlNumber = (accNum) => {
            let lacc = accNum.length;
            let s = search.create({
                type: 'item',
                columns: ['name'],
                filters: [["formulatext: substr({name}, 1, " + lacc + ")", 'is', accNum], 'and', ['isinactive', 'is', false]]
            });
            let r = s.run().getRange({start: 0, end: 1});
            let idAcc = '';
            if (r.length > 0) {
                idAcc = r[0].id;
            }
            return idAcc;
        }

        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type
         * @Since 2015.2
         */
        const afterSubmit = (scriptContext) =>{
            let tgType = scriptContext.type;
            if (tgType === 'create' || tgType === 'edit' || tgType === 'copy') {
                let newRecord = scriptContext.newRecord;
                let recType = newRecord.type;
                if (recType !== 'customrecord_scv_emp' && recType !== 'customrecord_scv_loa') {
                    let created_transaction = newRecord.getValue('custbody_scv_created_transaction');
                    if (tgType === 'create' && created_transaction) {
                        let fieldOfTransaction = search.lookupFields({
                            type: search.Type.TRANSACTION, id: created_transaction, columns: ['type', 'recordtype', 'custbody_scv_related_transaction']
                        });
                        let related_transaction = fieldOfTransaction.custbody_scv_related_transaction;
                        if (util.isArray(related_transaction)) {
                            related_transaction = related_transaction.map(o => o.value);
                        } else {
                            related_transaction = (related_transaction.value || '').split(',');
                        }

                        let listNewRelatedTransaction = [newRecord.id];
                        if(related_transaction.length > 0) {
                            related_transaction.forEach((tranid) => {
                                if (String(newRecord.id) !== String(tranid)) {
                                    listNewRelatedTransaction.push(tranid);
                                }
                            });
                        }

                        record.submitFields({
                            type: fieldOfTransaction.recordtype, id: created_transaction,
                            values: {custbody_scv_related_transaction: listNewRelatedTransaction},
                            options: {enableSourcing: false, ignoreMandatoryFields: true}
                        });
                    }
                }
                let empid = newRecord.getValue('entity');
                let emp_number = newRecord.getValue('custbody_scv_emp_number');
                if (recType === 'customrecord_scv_emp') {
                    emp_number = newRecord.id;
                    empid = newRecord.getValue('custrecord_scv_emp_employee');
                    if (tgType === 'edit') {
                        let oldRecord = scriptContext.oldRecord;
                        let o_empid = oldRecord.getValue('custrecord_scv_emp_employee');
                        if (empid !== o_empid) {
                            updateEmployee(emp_number, o_empid);
                        }
                    }
                }
                updateEmpNumber(emp_number);
                updateEmployee(emp_number, empid);

                let loa = newRecord.getValue('custbody_scv_loa');
                if (recType === 'customrecord_scv_loa') {
                    loa = newRecord.id;
                }

                updateLoa(loa);
                if (loa) {
                    let ikLoa = search.lookupFields({
                        type: "customrecord_scv_loa",
                        id: loa,
                        columns: ["custrecord_scv_loa_entity"]
                    });
                    let idVen = ikLoa.custrecord_scv_loa_entity[0].value;
                    updateVendor(idVen);
                }
                updateLoanLimit(loa, recType === 'customrecord_scv_loa' ? newRecord : null);

                if (tgType === 'edit' && recType !== 'customrecord_scv_emp' && recType !== 'customrecord_scv_loa') {
                    let oldRecord = scriptContext.oldRecord;
                    let o_emp_number = newRecord.getValue('custbody_scv_emp_number');
                    let o_loa = oldRecord.getValue('custbody_scv_loa');
                    let o_empid = oldRecord.getValue('entity');
                    if (o_emp_number !== emp_number) {
                        updateEmpNumber(o_emp_number);
                        updateEmployee(o_emp_number, empid);
                        if (empid !== o_empid) {
                            updateEmployee(o_emp_number, o_empid);
                        }
                    } else if (empid !== o_empid) {
                        updateEmployee(o_emp_number, o_empid);
                    }
                    if (o_loa !== loa) {
                        updateLoa(o_loa);
                        if (o_loa) {
                            // get id old Vendor
                            let ikLoa = search.lookupFields({type: "customrecord_scv_loa", id: o_loa, columns: ["custrecord_scv_loa_entity"]});
                            let idVen = ikLoa.custrecord_scv_loa_entity[0].value;
                            updateVendor(idVen);
                        }
                        updateLoanLimit(o_loa);
                    }
                }

            } else if (tgType === 'delete') {
                let oldRecord = scriptContext.oldRecord;
                let emp_number = oldRecord.getValue('custbody_scv_emp_number');
                let empid = oldRecord.getValue('entity');
                updateEmpNumber(emp_number);
                updateEmployee(emp_number, empid);
                let loa = oldRecord.getValue('custbody_scv_loa');
                updateLoa(loa);
                if (loa) {
                    // get id old Vendor
                    let ikLoa = search.lookupFields({type: "customrecord_scv_loa", id: loa, columns: ["custrecord_scv_loa_entity"]});
                    let idVen = ikLoa.custrecord_scv_loa_entity[0].value;
                    updateVendor(idVen);
                }
                updateLoanLimit(loa);
            }
        }
        
        const updateVendor = (idVen) => {
            if (idVen) {
                let recVen = record.load({type: record.Type.VENDOR, id: idVen});
                let slLoaEntityId = "recmachcustrecord_scv_loa_entity";
                let lCLEntity = recVen.getLineCount(slLoaEntityId);
                if (!lCLEntity) return;
                let sumLoaPriAmt = 0;
                let sumEntTotPri = 0;
                let arrLoaPriAmt = [];
                let arrEntTotPri = [];
                for (let i = 0; i < lCLEntity; i++) {
                    let loaPriAmt = Number(recVen.getSublistValue({
                        sublistId: slLoaEntityId,
                        fieldId: "custrecord_scv_loa_principal_amount",
                        line: i
                    }));
                    let entTotPri = Number(recVen.getSublistValue({
                        sublistId: slLoaEntityId,
                        fieldId: "custrecord_scv_loa_principal_paid_amount",
                        line: i
                    }));
                    arrLoaPriAmt.push(loaPriAmt);
                    arrEntTotPri.push(entTotPri);
                }
                arrLoaPriAmt.forEach(val => sumLoaPriAmt = val + sumLoaPriAmt);
                arrEntTotPri.forEach(val => sumEntTotPri = val + sumEntTotPri);
                let dCreLim = recVen.getValue("custentity_scv_creditlimit_2") || 0;
                let dHanMucConLai = Number(dCreLim) - (Number(sumLoaPriAmt) - Number(sumEntTotPri));
                recVen.setValue("custentity_scv_entity_amount_debitloan", sumLoaPriAmt);
                recVen.setValue("custentity_scv_entity_total_principal", sumEntTotPri);
                recVen.setValue("custentity_scv_entity_hanmucconlai", dHanMucConLai);
                recVen.save({enableSourcing: false, ignoreMandatoryFields: true});
            }
        }
        
        const updateEmployee = (emp_number, empid) => {
            if (emp_number) {
                if (!empid) {
                    let lkEmp = search.lookupFields({
                        type: 'customrecord_scv_emp',
                        id: emp_number,
                        columns: ['custrecord_scv_emp_employee']
                    });
                    empid = lkEmp.custrecord_scv_emp_employee;
                    empid = empid && empid.length > 0 ? empid[0].value : '';
                }
                let lkEmp = search.lookupFields({type: 'entity', id: empid, columns: ['recordtype']});
                let amount = getAmount('customsearch_scv_emp_remainingtotal', 0, empid, 'custrecord_scv_emp_employee');
                let recEmp = record.load({type: lkEmp.recordtype, id: empid});
                let creditAmount = recEmp.getValue('custentity_scv_creditlimit');
                recEmp.setValue('custentity_scv_remainingtotal', amount);
                recEmp.setValue('custentity_scv_emp_available', creditAmount - amount);
                recEmp.save({enableSourcing: false, ignoreMandatoryFields: true});
            }
        }
        
        const updateEmpNumber = (emp_number) => {
            if (emp_number) {
                let colFil = 'custbody_scv_emp_number';
                let checkAmount = getAmount('customsearch_scv_emp_precheck', 6, emp_number, colFil);
                let depositsAmount = getAmount('customsearch_scv_emp_deposits', 6, emp_number, colFil);
                let exprepAmount = getAmount('customsearch_scv_emp_exprep', 5, emp_number, colFil);
                let billPayAmount = getAmount('customsearch_scv_emp_billpayment', 6, emp_number, colFil);
                let remaining = checkAmount - depositsAmount - exprepAmount + billPayAmount;
                let recEmp = record.load({type: 'customrecord_scv_emp', id: emp_number});
                let fields = ['custrecord_scv_emp_check_amount', 'custrecord_scv_emp_deposit_amount', 'custrecord_scv_emp_exp',
                    'custrecord_scv_emp_billpayment', 'custrecord_scv_emp_remaining_amount'];
                libFunc.setValueData(recEmp, fields, [checkAmount, depositsAmount, exprepAmount, billPayAmount, remaining]);
                recEmp.save({enableSourcing: false, ignoreMandatoryFields: true});
            }
        }
        
        const updateLoa = (loa) => {
            if (loa) {
                let colFil = 'custbody_scv_loa';
                let principalAmount_fx = getAmount('customsearch_scv_principal', 7, loa, colFil); // custrecord_scv_loa_principal_usd
                let interestAmount_fx = getAmount('customsearch_scv_interest', 7, loa, colFil); // custrecord_scv_loa_interest_am_usd
                let principalPaidAmount_fx = getAmount('customsearch_scv_principal_paid', 7, loa, colFil); // custrecord_loa_principal_paid_amount_usd
                let interestPaidAmount_fx = getAmount('customsearch_scv_interest_paid', 7, loa, colFil); // custrecord_scv_interest_paid_usd
                let remainingAmount_fx = principalAmount_fx + interestAmount_fx - principalPaidAmount_fx - interestPaidAmount_fx; // custrecord_loa_remaining_amount_usd

                let principalAmount = getAmount('customsearch_scv_principal', 8, loa, colFil);
                let interestAmount = getAmount('customsearch_scv_interest', 8, loa, colFil);
                let addInterestPrincipalAmount = getAmount('customsearch_scv_add_interest', 9, loa, colFil);
                let principalPaidAmount = getAmount('customsearch_scv_principal_paid', 8, loa, colFil);
                let interestPaidAmount = getAmount('customsearch_scv_interest_paid', 8, loa, colFil);
                let paidAmount = principalPaidAmount + interestPaidAmount;
                let remainingAmount = principalAmount + interestAmount - paidAmount - addInterestPrincipalAmount;
                let recLoa = record.load({type: 'customrecord_scv_loa', id: loa});
                let fields = ['custrecord_scv_loa_principal_amount', 'custrecord_scv_loa_interest_amount', 'custrecord_scv_loa_payment_amount',
                    'custrecord_scv_loa_remaining_amount', 'custrecord_scv_loa_principal_paid_amount', 'custrecord_scv_loa_interest_paid_amount'
                    , 'custrecord_scv_loa_interest_to_principal', 'custrecord_scv_loa_principal_usd', 'custrecord_scv_loa_interest_am_usd', 'custrecord_loa_principal_paid_amount_usd'
                    ,'custrecord_scv_interest_paid_usd', 'custrecord_loa_remaining_amount_usd'];
                libFunc.setValueData(recLoa, fields, [principalAmount, interestAmount, paidAmount, remainingAmount, principalPaidAmount, interestPaidAmount, addInterestPrincipalAmount, principalAmount_fx, interestAmount_fx, principalPaidAmount_fx, interestPaidAmount_fx, remainingAmount_fx]);
                recLoa.save({enableSourcing: false, ignoreMandatoryFields: true});
            }
        }
        
        const getAmount = (ssid, numCol, empNum, colFil) => {
            let s = search.load({id: ssid});
            let c = s.columns;
            let f = s.filters;
            f.push(search.createFilter({name: colFil, operator: search.Operator.ANYOF, values: empNum}));
            s.filters = f;
            let r = s.run().getRange({start: 0, end: 1000});
            let amount = 0;
            let l = r.length;
            for (i = 0; i < l; i++) {
                amount = amount + (r[i].getValue(c[numCol]) * 1 || 0)//new Number(r[i].getValue(c[numCol]));
            }
            return amount;
        }
        
        const updateLoanLimit = (id, recLoa) => {
            if (!id) return;
            // get list id record Loan Limit use Debit Loan
            let listIdLoanLimit = getIdRecordLoanLimit(id, recLoa);
            // Update value field Loan Limit
            if ( listIdLoanLimit.length === 0 ) return;
            listIdLoanLimit.forEach( idLoanLimit => updateValueLoanLimit(idLoanLimit) );
        }
        
        const updateValueLoanLimit = (id) => {
            if ( !id ) return;
            let recLoaLimit = record.load({type: "customrecord_scv_loalimit", id: id});
            let entity = recLoaLimit.getValue("custrecord_scv_loalimit_entity") || "";
            let loanType = recLoaLimit.getValue("custrecord_scv_loalimit_type") || "";
            // Get data fields to fill filters in SS
            let objData = {
                custrecord_scv_loa_entity : entity,
                custrecord_scv_loa_loantype : loanType
            }
            // Information SS: id, columns and filters
            let SS_ID = "customsearch_scv_debit_loan";
            
            const filters = [], data = [];
            Object.entries(objData).forEach(([field, value]) => value ?  filters.push(search.createFilter({name: field, operator: "anyof", values: value})) : "")
            libRep.doSearchSSOrgPage(SS_ID, 1000, data, filters, null, null, '-None-', null, null);
            let objDataLoanLimit = {};
            // Default Value
            objDataLoanLimit.custrecord_scv_loalimit_principal = 0;
            objDataLoanLimit.custrecord_scv_loalimit_principal_paid = 0;
            objDataLoanLimit.custrecord_scv_loalimit_remaining = 0;

            data.forEach( obj =>  {
                objDataLoanLimit.custrecord_scv_loalimit_principal += Number(obj.custrecord_scv_loa_principal_amount);
                objDataLoanLimit.custrecord_scv_loalimit_principal_paid += Number(obj.custrecord_scv_loa_principal_paid_amount);
            });

            const pLoanlimit = +recLoaLimit.getValue("custrecord_scv_loalimit_limit")||0;
            objDataLoanLimit.custrecord_scv_loalimit_remaining = pLoanlimit - objDataLoanLimit.custrecord_scv_loalimit_principal + objDataLoanLimit.custrecord_scv_loalimit_principal_paid;
            // Update value
            Object.entries(objDataLoanLimit).forEach(([field, value]) => recLoaLimit.setValue(field, value));
            // Save record
            recLoaLimit.save({enableSourcing : false, ignoreMandatoryFields: true});
        }

        // Function get id loan limit use record Debit Loan
        const getIdRecordLoanLimit = (id, recLoa) => {
            if (!id) return;
            recLoa = recLoa || record.load({type: "customrecord_scv_loa", id: id});
            // Record Type Loan Limit
            let recType = "customrecord_scv_loalimit";
            let columns = [];
            let filters = [search.createFilter({ name: 'custrecord_scv_loalimit_entity', operator: "anyof", values: recLoa.getValue('custrecord_scv_loa_entity')}),
                search.createFilter({ name: 'custrecord_scv_loalimit_type', operator: "anyof", values: recLoa.getValue('custrecord_scv_loa_loantype')})];
            
            columns.push(search.createColumn({ name: "internalid"}));
            let arrIdRecord = [];
            let searchObj = search.create({
                type: recType,
                filters: filters,
                columns: columns
            }).run().getRange({start: 0, end: 1000});

            // Check Loan Limit has transaction
            if ( !searchObj ) return [];
            searchObj.forEach( o => arrIdRecord.push( o.getValue("internalid") ));
            return arrIdRecord;
        }
        
        const copyRecordFromId = (newRecord, readid, sublists) => {
            let readReadcord = record.load({type: newRecord.type, id: readid});
            copyRecord(newRecord, readReadcord, sublists);
        }
        
        const copyRecord = (newRecord, readReadcord, sublists) => {
            let fields = ['entity', 'subsidiary', 'custbody_scv_order_type', 'account', 'department', 'class', 'currency', 'exchangerate', 'location'
                , 'memo', 'custbody_scv_memo2', 'usertotal', 'taxtotal'//, 'trandate', 'postingperiod'
                , 'createdfrom', 'custbody_scv_loa', 'custbody_scv_po_contract_no', 'custbody_scv_einvoice_code'
                , 'custbody_scv_contact_person', 'custbody_scv_pay_method', 'custbody_scv_invoice_pattern', 'custbody_scv_einvoice_legalname'
                , 'billaddresslist', 'custbody_scv_nguoi_mua_hang', 'custbody_scv_invoice_entity', 'custbody_scv_invoice_entity_legalname'
                , 'custbody_scv_invoice_entity_taxid', 'custbody_scv_invoice_entity_address', 'custbody_scv_invoice_entity_beb'
                , 'salesrep', 'custbody_scv_inv_subcustomer', 'custbody_scv_amount_in_word', 'custbody_scv_amount_in_word_en', 'custbody_scv_pay_method'
                , 'custbody_scv_invoice_pattern'];
            libFunc.setValue(newRecord, readReadcord, fields, fields);
            for (let i in sublists) {
                copySetLine(newRecord, readReadcord, sublists[i]);
            }
        }
        
        const copySetLine = (newRecord, readRecord, sublist) => {
            let lcSl = readRecord.getLineCount(sublist);
            let lineFields = ['account', 'category', 'amount', 'taxcode', 'taxrate1', 'tax1amt', 'grossamt', 'memo', 'department', 'class'
                , 'location', 'custcol_scv_invoice_taxreg', 'custcolscv_bill_custom_no'];
            let lineFieldsIt = ['item', 'itemtype', 'vendorname', 'custcol_scv_tc_item_code', 'description', 'price', 'quantity', 'units', 'rate', 'amount', 'taxcode', 'taxrate1'
                , 'tax1amt', 'grossamt', 'memo', 'department', 'class'
                , 'location', 'custcol_scv_invoice_taxreg'
                , 'custcolscv_bill_custom_no', 'custcol_scv_tax_type', 'custcol_scv_memo2', 'description', 'custcol_scv_free_gift_promo'
            ];
            for (let j = 0; j < lcSl; j++) {
                newRecord.insertLine({sublistId: sublist, line: j});
                libFunc.setSublistValue(newRecord, readRecord, sublist, sublist, lineFields, lineFields, j);
                libFunc.setSublistValue(newRecord, readRecord, sublist, sublist, lineFieldsIt, lineFieldsIt, j);
            }
        }

        return {
            beforeLoad,
            // beforeSubmit,
            afterSubmit
        };

    });
