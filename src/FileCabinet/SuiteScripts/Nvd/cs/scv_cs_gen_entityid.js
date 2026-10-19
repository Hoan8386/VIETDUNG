/**
 * Nội dung:
 * Key:
 * * =======================================================================================
 *  Date                Author                  Description
 *  ?                   ?                       ?
 *  03 Jul 2025         Thành Ngô               Create, init file cập nhật mã nhân viên theo task
 *
**/

/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search'],

function(record, search) {
    
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
            if( scriptContext.fieldId === 'firstname' ||
                scriptContext.fieldId === 'department' ) {
                let curRec = scriptContext.currentRecord;
                let options = getOptions(curRec);
                const oldDocNum = curRec.getValue(options.fieldNameId);
                // if ((oldDocNum === '' || oldDocNum === null || oldDocNum?.toUpperCase() === 'TO BE GENERATED')) {
                    const maxNumber = findMaxNumber(options);
                    const docNum = getDocNum({
                        maxNumber: maxNumber,
                        prefix: options.prefix,
                        delimiter: options.delimiter,
                        suffix: options.suffix,
                        recordType: options.recordType, //newRecord.type,
                        digit: options.digit
                    });
                    if (docNum === oldDocNum) return;
                    curRec.setValue(options.fieldNameId, docNum);
                // }
            }
    }

    const getDocNum = (options) => {
        const maxNumberStr = options.maxNumber.toString().padStart(options.digit, '0');
        switch (options.recordType) {
            case record.Type.EMPLOYEE:
                return options.prefix + options.delimiter + maxNumberStr + options.suffix;
            case CustomRecordTypeId.SALES_CONTRACT:
                return maxNumberStr + options.suffix;
            case CustomRecordTypeId.PAYMENT_REQUEST:
                return options.prefix + options.delimiter + maxNumberStr;
        }
    }

    const findMaxNumber = (options) => {
        let filters = [];
        if (!!options?.addFilter && Array.isArray(options.addFilter) && options.addFilter.length) {
            filters = filters.concat(options.addFilter);
        } else {
            filters = filters.concat([search.createFilter({
                name: 'formulatext',
                formula: `SUBSTR({${options.fieldNameId}}, 1, ${options.prefix.length + options.delimiter.length})`,
                operator: 'is',
                values: options.prefix + options.delimiter
            })]);
        }
        let c = [];
        if (Array.isArray(options.addColumn) && options.addColumn.length) {
            c = c.concat(options.addColumn);
        } else {
            c.push({
                name: 'formulanumeric',
                formula: `SUBSTR(SUBSTR({${options.fieldNameId}}, 1, INSTR({${options.fieldNameId}}, '_') -1 ), ${options.prefix.length + options.delimiter.length + 1})`,
                summary: 'MAX'
            });
        }
        // log.audit('filters', filters);
        let searchObj = search.create({type: options.recordType, filters: filters, columns: c});
        let searchResults = searchObj.run().getRange(0, 1);
        let maxNumber = 1;
        if (searchResults.length) maxNumber = (+searchResults[0].getValue(c[0]) || 0) + 1;
        return maxNumber;
    };

    const getOptions = (curRec) => {
        let options = {
            recordType: curRec.type,
            prefix: '',
            digit: 3,
            fieldNameId: '',
            prefixNumber: 0,
            delimiter: '',
            suffix: '',
            addFilter: []
        };
        switch (curRec.type) {
            case record.Type.EMPLOYEE:
                setDataConfigEmployee(curRec, options);
                break;
            // case CustomRecordTypeId.SALES_CONTRACT:
            //     setDataConfigSalesContract(curRec, options);
            //     break;
            // case CustomRecordTypeId.PAYMENT_REQUEST:
            //     setDataConfigPaymentRequest(curRec, options);
            //     break;
        }
        return options;
    };

    const setDataConfigEmployee = (curRec, options) => {
        let prefix = '', suffix = '';
        options.fieldNameId = 'entityid';
        const subId = curRec.getValue('subsidiary');
        const subCode = subId ? (search.lookupFields({
            type: 'subsidiary',
            id: subId,
            columns: ['custrecord_scv_sub_code']
        })?.custrecord_scv_sub_code || '') : '';
        if (subCode) prefix += subCode;
        const hireDate = curRec.getValue('hiredate');
        if (hireDate) prefix += hireDate.getFullYear().toString().substring(2, 4);
        const firstName = curRec.getValue('firstname');
        const departmentId = curRec.getValue('department');
        const codeDepartment = departmentId ? (search.lookupFields({
            type: 'department',
            id: departmentId,
            columns: ['custrecord_scv_dep_short_name']
        })?.custrecord_scv_dep_short_name || '') : '';
        suffix += '_' + codeDepartment;
        suffix += '_' + firstName;
        options.prefix = prefix;
        options.delimiter = '';
        options.suffix = suffix;
        options.addFilter = [
            search.createFilter({name: 'subsidiary', operator: 'anyof', values: subId}),
            search.createFilter({
                name: 'formulatext',
                formula: `SUBSTR({${options.fieldNameId}}, 1, ${options.prefix.length + options.delimiter.length})`,
                operator: 'is',
                values: options.prefix + options.delimiter
            })
        ];
    };
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

    }

    /**
     * Function to be executed after sublist is inserted, removed, or edited.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @since 2015.2
     */
    function sublistChanged(scriptContext) {

    }

    /**
     * Function to be executed after line is selected.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @since 2015.2
     */
    function lineInit(scriptContext) {

    }

    /**
     * Validation function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @returns {boolean} Return true if field is valid
     *
     * @since 2015.2
     */
    function validateField(scriptContext) {

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
     * Validation function to be executed when sublist line is inserted.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateInsert(scriptContext) {

    }

    /**
     * Validation function to be executed when record is deleted.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateDelete(scriptContext) {

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

    return {
        // pageInit: pageInit,
        fieldChanged: fieldChanged,
        // postSourcing: postSourcing,
        // sublistChanged: sublistChanged,
        // lineInit: lineInit,
        // validateField: validateField,
        // validateLine: validateLine,
        // validateInsert: validateInsert,
        // validateDelete: validateDelete,
        // saveRecord: saveRecord
    };
    
});
