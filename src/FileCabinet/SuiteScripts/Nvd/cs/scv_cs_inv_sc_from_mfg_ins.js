/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([],

    function() {

        /**
         * Function to be executed after page is initialized.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
         *
         * @since 2015.2
         */
        function pageInit(scriptContext) {}

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
            let curRec = scriptContext.currentRecord;
            const slId = 'custpage_scv_sublist';
            const lc = curRec.getLineCount(slId);
            let arrData = [];
            for (let i = 0; i < lc; i++) {
                const mark = curRec.getSublistValue({sublistId : slId, fieldId : 'select', line: i});
                if (mark === 'T' || mark == true) {
                    const binNumberId  = curRec.getSublistValue({sublistId : slId, fieldId : 'c4_id', line: i});
                    arrData.push({line : i + 1, binNumberId : binNumberId});
                }
            }
            if (arrData.length === 0) {
                alert('Please select less than a line!');
                return false;
            }
            let objLineNotBin = arrData.find(item => !item.binNumberId);
            if (util.isObject(objLineNotBin) && Object.keys(objLineNotBin).length) {
                alert('Line ' + objLineNotBin.line + ' does not have bin number! Please check again!');
                return false;
            }
            return true;
        }

        return {
            pageInit: pageInit,
            saveRecord: saveRecord
        };

    });
