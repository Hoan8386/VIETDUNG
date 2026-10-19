/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/query'],

    function(query) {
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
            let curRec = scriptContext.currentRecord;
            let sublistId = scriptContext.sublistId;
            let fieldId = scriptContext.fieldId;
            let recType = curRec.type;

            fieldChanged_setDefaultMemo(curRec, sublistId, fieldId, recType);
            fieldChanged_Memo(curRec, sublistId, fieldId, recType);
            fieldChanged_Entity(curRec, sublistId, fieldId, recType);
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
            let curRec = scriptContext.currentRecord;
            let sublistId = scriptContext.sublistId;
            let fieldId = scriptContext.fieldId;
            // data
            let recType = curRec.type;
            switch (recType) {
                case "cashsale":
                case "cashrefund":
                case "invoice":
                case "creditmemo":
                case "vendorbill":
                case "vendorcredit":
                case "custompurchase_scv_lenhchi": {
                    if(sublistId === "item" && fieldId === "item") {
                        let itemId = curRec.getCurrentSublistValue(sublistId, fieldId);
                        if(!!itemId) {
                            defaultSublistField(true, sublistId, curRec, "description");
                        }
                        //item_machine?.clearline(true);//Comment lai dong nay do bi loi xoa mat line khi nhap du lieu moi
                    }
                    break;
                }
            }
        }
    
        /**
         * Validation function to be executed when sublist line is committed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @returns {boolean} Return true if sublist line is valid
         *
         * @since 2015.2
         */
        function validateLine(scriptContext) {
            
        }
    
        /**
         * Validation function to be executed when record is saved.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @returns {boolean} Return true if record is valid
         *
         * @since 2015.2
         */
        function saveRecord(scriptContext) {
    
        }

        const fieldChanged_setDefaultMemo = (curRec, sublistId, fieldId, recType) => {
            let isDefault = false;
            let uRLSearchParams = new URLSearchParams(window.location.search);
            switch(recType) {
                case "journalentry":
                    isDefault = sublistId == "line" && fieldId == "account";
                    defaultSublistField(isDefault, sublistId, curRec, "memo");
                    break;
                case "deposit":
                    isDefault = ["other", "cashback"].includes(sublistId) && fieldId == "account";
                    defaultSublistField(isDefault, sublistId, curRec, "memo");
                    break;
                case "custompurchase_scv_lenhchi":
                case "vendorcredit":
                    isDefault = sublistId == "expense" && fieldId == "account";
                    defaultSublistField(isDefault, sublistId, curRec, "memo");
                    break;
                case "check":
                case "vendorbill":
                    isDefault = sublistId == "expense" && fieldId == "account" && !uRLSearchParams.get('createFromId');
                    defaultSublistField(isDefault, sublistId, curRec, "memo");
                    break;
            }
        }

        const fieldChanged_Memo = (curRec, sublistId, fieldId, recType) => {
            let objParams = getUrlVars();
            let sublist = null;
            if(!sublistId && fieldId == "memo" && !!objParams.id && objParams.memdoc == "0") {
                switch(recType) {
                    case "cashsale":
                    case "cashrefund":
                    case "invoice":
                    case "creditmemo":
                    case "vendorcredit":
                        setSublistValueData(curRec, "item", "description");
                        break;
                    case "journalentry":
                        setSublistValueData(curRec, "line", "memo");
                        break;
                    case "deposit":
                        sublist = (curRec.getLineCount("cashback") > 0) ? "cashback" : "other";
                        setSublistValueData(curRec, sublist, "memo");
                        break;
                    case "custompurchase_scv_lenhchi":
                        sublist = (curRec.getLineCount("expense") > 0) ? "expense" : "item";
                        if(sublist === "expense") {
                            setSublistValueData(curRec, sublist, "memo");
                        } else {
                            setSublistValueData(curRec, sublist, "description");
                        }
                        break;
                    case "vendorbill":
                        sublist = (curRec.getLineCount("expense") > 0) ? "expense" : "item";
                        setSublistValueData(curRec, sublist, "memo");
                        break;
                    case "check":
                        setSublistValueData(curRec, "expense", "memo");
                        break;
                }
            }
        }

        const fieldChanged_Entity = (curRec, sublistId, fieldId, recType) => {
            switch(recType) {
                case "deposit":
                    if(fieldId == "entity" && sublistId == "other"){
                        let entity = curRec.getCurrentSublistValue(sublistId, fieldId);
                        curRec.setValue("custbody_scv_payee", entity);
                    }
                    break;
                case "journalentry":
                    if(fieldId == "entity" && sublistId == "line"){
                        let entity = curRec.getCurrentSublistValue(sublistId, fieldId);
                        curRec.setValue("custbody_scv_payee", entity);
                    }
                    break;
            }
        }
    
        const setSublistValueData = (curRec, sublistId, fieldId) => {
            let memo = curRec.getValue("memo");
            if(!memo) return;
            let lc = curRec.getLineCount(sublistId);
            for(let i = 0; i < lc; i++) {
                nlapiSetLineItemValue(sublistId, fieldId, (i + 1), memo);
            }
        }
    
        const defaultSublistField = (isDefault, sublistId, curRec, fieldDefault) => {
            if(!!isDefault) {
                let memo = curRec.getValue("memo");
                if(!memo) return;
                curRec.setCurrentSublistValue(sublistId, fieldDefault, memo);
            }
        }
    
        function getUrlVars() {
            var vars = {};
            var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
                vars[key] = value;
            });
            return vars;
        }
    
        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            postSourcing: postSourcing,
            // validateLine: validateLine
            // saveRecord: saveRecord
        };
        
    });
    