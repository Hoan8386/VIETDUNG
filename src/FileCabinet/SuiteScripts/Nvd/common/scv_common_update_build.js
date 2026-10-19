/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  ?                   ?                       ?
 *  30 Jul 2026         Phu Pham                Init, create file
 */
/**
 * @NApiVersion 2.1
 */
define([
    "N/query", "N/record",
],  (
        query, record
    ) => {

        const ScheduledScript = {
            ID: 'customscript_scv_ss_to_update_build',
            DEPLOYMENT: 'customdeploy_scv_ss_to_update_build',
            INPUT_PARAM: 'custscript_scv_inpt_to_update_build'
        };

        const getDataCreateFromAB = (curRec, sl, tl) => {
            // TODO: 260730 update TO về n Build và check điều kiện có line key (các luồng khác sẽ ko chạy chức năng này)
            const arrCreatedFrom = [];

            for(let i = 0; i < tl; i++) {
                let created_from = curRec.getSublistValue(sl, "custcol_scv_created_from", i);
                let line_key = curRec.getSublistValue(sl, "custcol_scv_ab_to_line_key_inv_detail", i);

                if(!arrCreatedFrom.includes(created_from) && !!line_key) {
                    arrCreatedFrom.push(created_from);
                }
            }

            if(arrCreatedFrom.length === 0) return [];

            const arrBuild = query.runSuiteQL({
                query: `SELECT id, recordtype, custbody_scv_related_transaction 
                    FROM transaction
                    WHERE id in ('${arrCreatedFrom.join("', '")}') AND recordtype = 'assemblybuild'
            `}).asMappedResults();

            return arrBuild.map(e => ({
                id: e.id,
                recordtype: e.recordtype,
                custbody_scv_related_transaction: e?.custbody_scv_related_transaction?.split(", ") || []
            }));
        }

        const updateRelatedTransBuild = (objBuild, recId) => {
            let lstBuildRelated = [...objBuild.custbody_scv_related_transaction, recId];
            
            record.submitFields({
                type: objBuild.recordtype,
                id: objBuild.id,
                values: {
                    "custbody_scv_related_transaction": lstBuildRelated
                },
                options: {
                    enableSourcing: false, ignoreMandatoryFields: true
                }
            });
        }

        return {
            ScheduledScript,
            getDataCreateFromAB,

            updateRelatedTransBuild,
        }
    });
