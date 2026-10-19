/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['../cons/scv_cons_payreq.js'],
    
    function (ConsPayReq) {
        
        const Sublist = {
            ITEM: 'item',
            EXPENSE: 'expense'
        };
        
    
        /**
         * Function to be executed after page is initialized.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
         *
         * @since 2015.2
         */
        function pageInit(scriptContext) {
            try {
                let uRLSearchParams = new URLSearchParams(window.location.search);
                if (uRLSearchParams.get('createFromType') === ConsPayReq.CustomRecordType.PAYMENT_REQUEST) {
                    let objSublists = {};
                    let currentRecord = scriptContext.currentRecord;
                    if (scriptContext.mode === 'create') {
                        window.confirm = function () {
                            return true; // tự động click "OK"
                        };
                        
                        let listHeaderFieldIds = ['entity', 'subsidiary', 'memo'];
                        let objHeaderValue = getValue(currentRecord, listHeaderFieldIds);
                        let listLineItemFieldIds = ['taxcode', 'taxrate1', 'rate', 'amount', 'tax1amt'];
                        let listLineExpenseFieldIds = ['taxcode', 'taxrate1', 'amount', 'tax1amt'];
                        objSublists.item = getSublistValue(currentRecord, Sublist.ITEM, listLineItemFieldIds);
                        objSublists.expense = getSublistValue(currentRecord, Sublist.EXPENSE, listLineExpenseFieldIds);
                        
                        //set lai entity de field account sourcing lai
                        listHeaderFieldIds.forEach(fieldId => {
                            currentRecord.setValue({
                                fieldId: fieldId,
                                value: objHeaderValue[fieldId],
                                ignoreFieldChange: false,
                                forceSyncSourcing: true
                            });
                        });
                        
                        //Set lai value taxcode khi co set lai entity
                        setCurrentSublistValueLine(currentRecord, objSublists, listLineItemFieldIds, Sublist.ITEM);
                        setCurrentSublistValueLine(currentRecord, objSublists, listLineExpenseFieldIds, Sublist.EXPENSE);
                    }
                    setTimeout(() => {
                        setCurrentSublistValueLine(currentRecord, objSublists, ['rate', 'amount', 'tax1amt'], Sublist.ITEM);
                        setCurrentSublistValueLine(currentRecord, objSublists, ['amount', 'tax1amt'], Sublist.EXPENSE);
                        synctotal();
                    }, 6000);
                }
            } catch (e) {
                console.log('pageInit:' + JSON.stringify(e));
            }
        }
        
        const setCurrentSublistValueLine = (currentRecord, objSublists, listLineFieldIds, sublistId) => {
            let listFieldValue = objSublists[sublistId];
            for (let i = 0; i < listFieldValue.length; i++) {
                let objFieldValue = listFieldValue[i];
                let {line} = objFieldValue;
                currentRecord.selectLine({
                    sublistId: sublistId,
                    line: line
                });
                listLineFieldIds.forEach(fieldId => {
                    currentRecord.setCurrentSublistValue({
                        sublistId: sublistId,
                        fieldId: fieldId,
                        value: objFieldValue[fieldId],
                    });
                });
                currentRecord.commitLine({
                    sublistId: sublistId
                });
            }
        }
        
        const getValue = (currentRecord, listHeaderFieldIds) => {
            let objValue = {};
            listHeaderFieldIds.forEach(fieldId => {
                objValue[fieldId] = currentRecord.getValue(fieldId);
            });
            return objValue;
        }
        
        const getSublistValue = (currentRecord, sublistId, listLineFieldIds) => {
            let listFieldValue = [];
            let lcSublist = currentRecord.getLineCount(sublistId);
            for (let i = 0; i < lcSublist; i++) {
                let objFieldValue = {line: i};
                listLineFieldIds.forEach(fieldId => {
                    objFieldValue[fieldId] = currentRecord.getSublistValue({
                        sublistId: sublistId,
                        fieldId: fieldId,
                        line: i
                    });
                })
                listFieldValue.push(objFieldValue);
            }
            return listFieldValue;
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
            //console.log(scriptContext.sublistId, scriptContext.fieldId)
            if (['entity', 'subsidiary', 'memo'].includes(scriptContext.fieldId)) {
                item_machine?.clearline(true);
            }
        }
        
        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            postSourcing: postSourcing
        };
        
    });
