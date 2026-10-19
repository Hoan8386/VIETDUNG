/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/url'],

    (url) => {
        /**
         * Defines the function definition that is executed before record is loaded.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @param {Form} scriptContext.form - Current form
         * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
         * @since 2015.2
         */
        const beforeLoad = (scriptContext) => {
            let urlAssetSaleOrDisposal = url.resolveScript({
                scriptId: 'customscript_fam_disposal_su',
                deploymentId: 'customdeploy_fam_disposal_su',
                params : {
                    recid : scriptContext.newRecord.id,
                }
            });
            if (scriptContext.type === 'view') {
                scriptContext.form.addButton({
                    id: 'custpage_thanhly_hd',
                    label: 'Thanh lý',
                    functionName: 'window.open("' + urlAssetSaleOrDisposal + '")'
                });
            }
        }

        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (scriptContext) => {
            let triggerType = scriptContext.type;
            if (triggerType === 'create' || triggerType === 'edit') {
                setDataEstAsset(scriptContext.newRecord);
            }
        }

        function setDataEstAsset(curRec) {
            const tuoiThoQuyDinh = curRec.getValue('custrecord_scv_cmms_tc_age_h')*1;
            const tuoiThoDanhGia = curRec.getValue('custrecord_scv_cmms_tc_agecheck_h')*1;
            const tuoiThoConLai = tuoiThoQuyDinh - tuoiThoDanhGia;
            const giaTriCCDCBanDau =  curRec.getValue('custrecord_scv_cmms_tc_origincost_h')*1;
            const phanTramTinhTrangConLai =  curRec.getValue('custrecord_scv_cmms_tc_residualstatus_h')*1;
            let khauHaoConLai = tuoiThoQuyDinh !== 0 ? 100*(tuoiThoConLai/tuoiThoQuyDinh) : 0;
            khauHaoConLai = Math.round(khauHaoConLai * 10000) / 10000;
            const giaTriKhauHaoCCDC =  khauHaoConLai * giaTriCCDCBanDau/100;
            const giaTriConLaiCCDC =  giaTriCCDCBanDau * phanTramTinhTrangConLai/100;
            const giaTriChenhLech = giaTriConLaiCCDC - giaTriKhauHaoCCDC;
            curRec.setValue('custrecord_scv_cmms_tc_remainage_h', tuoiThoConLai);
            curRec.setValue('custrecord_scv_cmms_tc_residualpercent_h', khauHaoConLai || '');
            curRec.setValue('custrecord_scv_cmms_tc_deprvalue_h', giaTriKhauHaoCCDC);
            curRec.setValue('custrecord_scv_cmms_tc_residualvalue_h', giaTriConLaiCCDC);
            curRec.setValue('custrecord_scv_cmms_tc_difference_h', giaTriChenhLech);
        }


        /**
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */

        const afterSubmit = (scriptContext) => {

        }

        return {beforeLoad, beforeSubmit, afterSubmit}

    });
