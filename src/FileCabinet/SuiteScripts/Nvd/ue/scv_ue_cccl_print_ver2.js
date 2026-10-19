/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['../common/scv_common_ui'],

    (comUI) => {
        const CcclAcp //= ['2', '4', '5'];
       = {
           ACP_ALRADO: '2',
           ACP_ALCOREST_THICK: '4',
           ACP_ALCOREST_THIN: '5',
       }

        const CcclAc //= ['1', '3'];
            = {
            AC_PHU_KIEN: '1',
            AC_LAM_CHAN_NANG: '3',
        };

        const SUITELETURL = '/app/site/hosting/scriptlet.nl?script=customscript_scv_sl_cccl_print&deploy=customdeploy_scv_sl_cccl_print';
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
            let form = scriptContext.form;
            let newRec = scriptContext.newRecord;
            let recId = newRec.id;
            let idLoaiMauIn = newRec.getValue('custrecord_scv_yccc_template');
            let suiteletUrl;

            if (idLoaiMauIn === CcclAcp.ACP_ALRADO ||
                idLoaiMauIn === CcclAcp.ACP_ALCOREST_THICK ||
                idLoaiMauIn === CcclAcp.ACP_ALCOREST_THIN) {
                suiteletUrl = SUITELETURL + `&recId=${recId}&templateType=ACP`;

                form.addButton({
                    id: 'custpage_scv_btn_cccl_apc_pdf',
                    label: 'In CCCL',
                    functionName: `window.open('${suiteletUrl}', '_blank')`,
                });
            }else if (idLoaiMauIn === CcclAc.AC_PHU_KIEN || idLoaiMauIn === CcclAc.AC_LAM_CHAN_NANG) {
                suiteletUrl = SUITELETURL + `&recId=${recId}&templateType=AC`;
                form.addButton({
                    id: 'custpage_scv_btn_cccl_ac_pdf',
                    label: 'In CCCL',
                    functionName: `window.open('${suiteletUrl}', '_blank')`//, //‘buttonFunction(‘ + var1 + ‘)’
                });
            }

            comUI.addIconToButton(form);
        }

        return {beforeLoad}

    });
