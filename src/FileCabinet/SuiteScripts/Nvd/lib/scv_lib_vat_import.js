/**
 * @NApiVersion 2.1
 */
define(['N/record', 'N/search', '../lib/scv_lib_report', '../lib/scv_lib_function'],
    
    (record, search, libRep, libFunc) => {
        
        const Sublist = {
            ITEM: 'item'
        }
        
        const createJournalFromITemReceipt = (readRecord) => {
            let related_transaction = readRecord.getValue('custbody_scv_related_transaction');
            let internalidJn = null;
            if (!related_transaction) {
                let recJournal = record.create({type: record.Type.JOURNAL_ENTRY, isDynamic: true});
                setDefaultFromItemReceiptToJournal(readRecord, recJournal, true);
                internalidJn = recJournal.save();
            }
            return internalidJn;
        }
        
        const setDefaultFromItemReceiptToJournal = (readRecord, newRecord, isDynamic) => {
            let newFields = ['subsidiary', 'location', 'department', 'class', 'memo', 'custbody_scv_itr_custom_no', 'custbody_scv_tb_entity_name'];
            let readFields = ['subsidiary', 'location', 'department', 'class', 'memo', 'custbody_scv_itr_custom_no', 'entity'];
            libFunc.setValue(newRecord, readRecord, newFields, readFields);
            libFunc.setValueData(newRecord, ['custbody_scv_created_transaction', 'currency', 'exchangerate'], [readRecord.id, 1, 1]);
            
            let listAccount = searchAccountFlNumber(['133101', '333102', '333301']);
            let account133101 = listAccount.find(o => o.number === '133101')?.internalid;
            let account333102 = listAccount.find(o => o.number === '333102')?.internalid;
            let account333301 = listAccount.find(o => o.number === '333301')?.internalid;
            let newSublist = 'line';
            let newSublistFieldsDb = ['account', 'debit', 'credit', 'tax1amt', 'grossamt', 'location'];
            let newSublistFieldsCrNoTax = ['account', 'credit', 'grossamt', 'location'];
            let newSublistFieldsDbNoTax = ['account', 'debit', 'grossamt', 'location'];
            
            let inb_tax_amount = Number(readRecord.getValue('custbody_scv_vat_import'));
            let sumImportAmount = getSumImportAmount(readRecord);
            let locationline = readRecord.getValue('location');
            let i = 0;
            if (inb_tax_amount) {
                let datalineDebit = [account133101, inb_tax_amount, 0, 0, inb_tax_amount, locationline];
                let datalineCreditNoTax = [account333102, inb_tax_amount, inb_tax_amount, locationline];
                if (isDynamic) {
                    i = selectNewLine(newRecord, newSublist, i, newSublistFieldsDb, datalineDebit);
                    i = selectNewLine(newRecord, newSublist, i, newSublistFieldsCrNoTax, datalineCreditNoTax);
                } else {
                    i = insertLine(newRecord, newSublist, i, newSublistFieldsDb, datalineDebit);
                    i = insertLine(newRecord, newSublist, i, newSublistFieldsCrNoTax, datalineCreditNoTax);
                }
            }
            
            if(sumImportAmount) {
                let lkCostCategory = search.lookupFields({
                    type: search.Type.COST_CATEGORY,
                    id: 2,
                    columns: ['account']
                });
                let account2LandedCost = lkCostCategory.account[0]?.value;//Chi phi thue nhap khau
                let datalineDebitNoTax2 = [account2LandedCost, sumImportAmount, sumImportAmount, locationline];
                let datalineCreditNoTax2 = [account333301, sumImportAmount, sumImportAmount, locationline];
                if (isDynamic) {
                    i = selectNewLine(newRecord, newSublist, i, newSublistFieldsDbNoTax, datalineDebitNoTax2);
                    selectNewLine(newRecord, newSublist, i, newSublistFieldsCrNoTax, datalineCreditNoTax2);
                } else {
                    i = insertLine(newRecord, newSublist, i, newSublistFieldsDbNoTax, datalineDebitNoTax2);
                    insertLine(newRecord, newSublist, i, newSublistFieldsCrNoTax, datalineCreditNoTax2);
                }
            }
        }
        
        const getSumImportAmount = (readRecord) => {
            let lcItem = readRecord.getLineCount(Sublist.ITEM);
            let sumImportAmount = 0;
            for (let i = 0; i < lcItem; i++) {
                let itemreceive = readRecord.getSublistValue({
                    sublistId: Sublist.ITEM,
                    fieldId: 'itemreceive',
                    line: i
                });
                let import_amount = readRecord.getSublistValue({
                    sublistId: Sublist.ITEM,
                    fieldId: 'custcol_scv_inb_importtax_amount',
                    line: i
                });
                if (import_amount && itemreceive === true) {
                    sumImportAmount += Number(import_amount);
                }
            }
            return sumImportAmount;
        }
        
        const selectNewLine = (newRecord, newSublist, i, newSublistFields, dataline) => {
            newRecord.selectNewLine({sublistId: newSublist, line: i});
            setCurrentSublistValueData(newRecord, newSublist, newSublistFields, dataline, true);
            newRecord.commitLine({sublistId: newSublist});
            i++;
            return i;
        }
        
        const insertLine = (newRecord, newSublist, i, newSublistFields, dataline) => {
            newRecord.insertLine({sublistId: newSublist, line: i});
            libFunc.setSublistValueData(newRecord, newSublist, newSublistFields, i, dataline);
            i++;
            return i;
        }
        
        
        const setCurrentSublistValueData = (newRecord, newSublist, newSublistFields, data, ignoreFieldChange) => {
            let lFields = newSublistFields.length;
            let value;
            for (let i = 0; i < lFields; i++) {
                value = newRecord.getCurrentSublistValue({sublistId: newSublist, fieldId: newSublistFields[i]});
                if (value !== undefined) {
                    value = data[i];
                    newRecord.setCurrentSublistValue({
                        sublistId: newSublist,
                        fieldId: newSublistFields[i],
                        value: value,
                        ignoreFieldChange: ignoreFieldChange
                    });
                }
            }
        }
        
        const searchAccountFlNumber = (arrAccNum) => {
            let listAccount = [];
            let columns = ['internalid', 'number'];
            let arrCol = ['internalid', 'number'];
            let arrFilter = [["formulatext: case when {number} in ('" + arrAccNum.join("','") + "') then '1' else '0' end", 'is', '1'], 'and', ['isinactive', 'is', false]];
            libRep.doSearch('account', listAccount, columns, arrCol, arrFilter);
            return listAccount;
        }
        
        const searchTaxcode = () => {
            let listAccount = [];
            let columns = ['internalid', 'name', 'rate'];
            let arrCol = ['internalid', 'name', 'rate'];
            let arrFilter = [['isinactive', 'is', false]];
            libRep.doSearch('salestaxitem', listAccount, columns, arrCol, arrFilter);
            return listAccount;
        }
        
        return {createJournalFromITemReceipt, setDefaultFromItemReceiptToJournal}
        
    });
