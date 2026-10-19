/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/search'],

    function (search) {

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
            let curRecord = scriptContext.currentRecord;
            let fieldId = scriptContext.fieldId;
            if (fieldId === 'custrecord_scv_inb_final_pay' ) {
                let currencyprecision = curRecord.getSublistValue('items', 'currencyprecision', 0);
                setSoTienCuoi(curRecord, currencyprecision);
            } else if (
                scriptContext.fieldId === 'custrecord_scv_adjustment_amount'  ||
                scriptContext.fieldId === 'custrecord_scv_inbound_amt_from_case'
            ){
                let currencyprecision = curRecord.getSublistValue('items', 'currencyprecision', 0);
                setSoTienThucTe(curRecord, currencyprecision);
            }
            else if (
                scriptContext.fieldId === 'custrecord_scv_inbound_adv_amt' ||
                scriptContext.fieldId === 'custrecord_scv_inb_remaining_amt' ||
                scriptContext.fieldId === 'custrecord_scv_inb_pay_percent' ||
                scriptContext.fieldId === 'custrecord_scv_inb_actual_amt'
            ) {
                let currencyprecision = curRecord.getSublistValue('items', 'currencyprecision', 0);
                setSoTienCanThanhToan(curRecord, currencyprecision);
            } else if (scriptContext.fieldId === 'custrecord_scv_inb_mathanhtoan') {
                // let currencyprecision = curRecord.getSublistValue('items', 'currencyprecision', 0) || 2;
                let currencyprecision = 2
                setTongTienDaThanhToan(curRecord, currencyprecision);
            }
        }

        const setTongTienDaThanhToan = (curRecord, currencyprecision) => {
            const maThanhToan = curRecord.getValue('custrecord_scv_inb_mathanhtoan');
            let objSoTien = getSoTienBySS(maThanhToan);
            curRecord.setValue('custrecord_scv_inb_sum_amt_payed',
                (Number(objSoTien.tongTienDaTra) + Number(objSoTien.soTienTraTruoc)).toFixed(currencyprecision)
            );
        }

        const setSoTienCanThanhToan = (curRecord, currencyprecision) => {
            const soTienConLai = curRecord.getValue('custrecord_scv_inb_remaining_amt') * 1;
            const soTienTraTruoc = curRecord.getValue('custrecord_scv_inbound_adv_amt') * 1;
            const phanTramThanhToan = Number(curRecord.getValue('custrecord_scv_inb_pay_percent') );
            const soTienThucTe = curRecord.getValue('custrecord_scv_inb_actual_amt') * 1;
            curRecord.setValue('custrecord_scv_inbound_pay_amt',
                parseFloat( (soTienThucTe * phanTramThanhToan / 100 +
                soTienConLai -
                soTienTraTruoc).toFixed(currencyprecision)));
        }

        const setSoTienThucTe = (curRecord, currencyprecision) => {
            const soTienTuCase = curRecord.getValue('custrecord_scv_inbound_amt_from_case') * 1;
            const soTienDieuChinh = curRecord.getValue('custrecord_scv_adjustment_amount') * 1;
            const tongSoTien = curRecord.getValue('custrecord_scv_inbound_total_amt');
            const soTienThucTe = tongSoTien - soTienTuCase - soTienDieuChinh;
            curRecord.setValue('custrecord_scv_inb_actual_amt', soTienThucTe.toFixed(currencyprecision));
        }

        const setSoTienCuoi = (curRecord, currencyprecision) => {
            const phanTramThanhToan = curRecord.getValue('custrecord_scv_inb_pay_percent') * 1;
            const lanCuoi = curRecord.getValue('custrecord_scv_inb_final_pay');
            const maThanhToan = curRecord.getValue('custrecord_scv_inb_mathanhtoan');
            const soTienThucTe = curRecord.getValue('custrecord_scv_inb_actual_amt') * 1;

            if (lanCuoi == false) {
                curRecord.setValue('custrecord_scv_inb_remaining_amt', 0);
                curRecord.setValue('custrecord_scv_inbound_adv_amt', 0);
                // curRecord.setValue('custrecord_scv_inbound_pay_amt', soTienThucTe * phanTramThanhToan / 100);
            } else if (lanCuoi == true) {
                let objSoTien = getSoTienBySS(maThanhToan);
                curRecord.setValue('custrecord_scv_inb_remaining_amt', Number(objSoTien.soTienConLai).toFixed(currencyprecision));
                curRecord.setValue('custrecord_scv_inbound_adv_amt', Number(objSoTien.soTienTraTruoc).toFixed(currencyprecision)); // update 4/6/2024
                curRecord.setValue('custrecord_scv_inb_amount_pay', Number(objSoTien.tongTienDaTra).toFixed(currencyprecision)); // update 4/6/2024
                curRecord.setValue('custrecord_scv_inbound_pay_amt', parseFloat(Number((soTienThucTe * phanTramThanhToan / 100) + Number(objSoTien.soTienConLai) - Number(objSoTien.soTienTraTruoc))).toFixed(currencyprecision));
            }
        };

        const getSoTienBySS = (maThanhToan) => {
            let objSearch = search.load({id: 'customsearch_scv_pay_inb_code'});
            let filter = objSearch.filters;
            let column = objSearch.columns;
            let objResult = {
                soTienTraTruoc : 0,
                soTienConLai : 0,
                tongTienDaTra : 0 // update 4/6/2024
            }
            filter.push(search.createFilter({
                name: 'custrecord_scv_payment_payment_code',
                operator: search.Operator.IS,
                values: maThanhToan
            }));

            let resultSearch = objSearch.run().getRange(0, 100);
            for (let i = 0; i < resultSearch.length; i++) {
                objResult.soTienTraTruoc = resultSearch[i].getValue(column[2]);
                objResult.soTienConLai = resultSearch[i].getValue(column[7]);
                objResult.tongTienDaTra = resultSearch[i].getValue(column.find(col => col.label === 'Tổng tiền đã trả')); // update 4/6/2024
            }

            return objResult;
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
