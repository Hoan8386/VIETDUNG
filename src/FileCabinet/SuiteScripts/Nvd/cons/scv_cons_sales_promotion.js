/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  19 Aug 2025         Phu Pham			    Init, create file
 */
define([
    'N/record', 'N/query',
    '../lib/scv_lib_function.js',
],
    function(
        record, query,
        lbf,
    ) {

        const getDataSalesPromotion = (soId) => {
            const resultSQL = query.runSuiteQL({
                query: ` SELECT id, custrecord_scv_spt_so_ori_lineid, custrecord_scv_spt_so_detail, custrecord_scv_spt_so_item
                FROM customrecord_scv_spt_so
                WHERE custrecord_scv_spt_so_trans = ${soId} AND isinactive = 'F'`
            });
            return resultSQL.asMappedResults();
        }

        const updateSalesPromotionTermSO = (salesPromotionId, objData) => {
            let objRecord = record.load({ type: 'customrecord_scv_spt_so', id: salesPromotionId });

            let fields = [
                "custrecord_scv_spt_so_percent", "custrecord_scv_spt_so_amt"
            ];
            let data = [
                objData.percent, objData.amount
            ];
            lbf.setValueData(objRecord, fields, data);

            let recordId = objRecord.save({ enableSourcing: true, ignoreMandatoryFields: false });
            return recordId;
        }

        const createSalesPromotionTermSO = (soId, objData) => {
            let objRecord = record.create({ type: 'customrecord_scv_spt_so' });

            let fields = [
                "custrecord_scv_spt_so_parent", "custrecord_scv_spt_so_detail", "custrecord_scv_spt_so_trans", "custrecord_scv_spt_so_item",
                "custrecord_scv_spt_so_percent", "custrecord_scv_spt_so_amt", "custrecord_scv_spt_so_ori_lineid"
            ];
            let data = [
                objData.id, objData.detail_id, soId, objData.item, objData.percent, objData.amount,
                objData.custcol_scv_ori_lineid
            ];
            lbf.setValueData(objRecord, fields, data);

            let recordId = objRecord.save({ enableSourcing: true, ignoreMandatoryFields: false });
            return recordId;
        }

        return {
            getDataSalesPromotion,
            updateSalesPromotionTermSO,
            createSalesPromotionTermSO
        };
    });
    