/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([],

    function () {

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
            if ([
                'custrecord_scv_cmms_tc_age_d',
                'custrecord_scv_cmms_tc_agecheck_d',
                'custrecord_scv_cmms_tc_origincost_d',
                'custrecord_scv_cmms_tc_residualstatus_d'
            ]
                .indexOf(scriptContext.fieldId) !== -1) {
                setDataEstAsset(scriptContext.currentRecord);
            }
        }

        const setDataEstAsset = (curRec) => {
            debugger;
            const tuoiThoQuyDinh = curRec.getValue('custrecord_scv_cmms_tc_age_d') * 1;
            const tuoiThoDanhGia = curRec.getValue('custrecord_scv_cmms_tc_agecheck_d') * 1;
            const tuoiThoConLai = tuoiThoQuyDinh - tuoiThoDanhGia;
            const giaTriCCDCBanDau = curRec.getValue('custrecord_scv_cmms_tc_origincost_d') * 1;
            const phanTramTinhTrangConLai = curRec.getValue('custrecord_scv_cmms_tc_residualstatus_d') * 1;
            let khauHaoConLai = tuoiThoQuyDinh !== 0 ? 100 * (tuoiThoConLai / tuoiThoQuyDinh) : 0;
            khauHaoConLai = Math.round(khauHaoConLai * 10000) / 10000;
            const giaTriKhauHaoCCDC = khauHaoConLai * giaTriCCDCBanDau/100;
            const giaTriConLaiCCDC = giaTriCCDCBanDau * phanTramTinhTrangConLai/100;
            const giaTriChenhLech = giaTriConLaiCCDC - giaTriKhauHaoCCDC;
            curRec.setValue('custrecord_scv_cmms_tc_remainage_d', tuoiThoConLai, true);
            curRec.setValue('custrecord_scv_cmms_tc_residualpercent_d', khauHaoConLai, true);
            curRec.setValue('custrecord_scv_cmms_tc_deprvalue_d', giaTriKhauHaoCCDC, true);
            curRec.setValue('custrecord_scv_cmms_tc_residualvalue_d', giaTriConLaiCCDC, true);
            curRec.setValue('custrecord_scv_cmms_tc_difference_d', giaTriChenhLech, true);
        }

        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
        };

    });
