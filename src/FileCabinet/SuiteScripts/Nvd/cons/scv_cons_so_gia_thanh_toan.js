/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  13 Mar 2025         Phu Pham			    Init, create file
 */
define([
    'N/runtime', './scv_cons_search_fr_gia_tt.js',
    '../lib/scv_lib_function.js'
],
    function(runtime, searchFrGiaTT, lbf) {

        const initLoadGiaThanhToanFromSO = (scriptContext) => {
            let newRecord = scriptContext.newRecord;
            let tgType = scriptContext.type;
            if(!['view', 'edit'].includes(tgType)) return;
            if(runtime.executionContext !== runtime.ContextType.USER_INTERFACE) return;

            let createdfrom_id = newRecord.getValue("createdfrom");
            let createdfrom_type = lbf.getTranRecordType(createdfrom_id);
            if(createdfrom_type !== "salesorder") return;

            let arrGiaTT = searchFrGiaTT.getDataSourceById(createdfrom_id);
            let sublistId = "item";
            let totalLine = newRecord.getLineCount(sublistId);

            // let form = scriptContext.form;
            // let sublist = form.getSublist({ id: sublistId });
            let totalFr = 0;
            for(let i = 0; i < totalLine; i++) {
                let item_id = newRecord.getSublistValue(sublistId, "item", i);
                let ori_line_id = newRecord.getSublistValue(sublistId, "custcol_scv_ori_lineid", i);
                let quantity = newRecord.getSublistValue(sublistId, "quantity", i);

                let obj_find_giatt = arrGiaTT.find(e => e.item_id == item_id && e.ori_line_id == ori_line_id);
                let gia_thanh_toan = obj_find_giatt?.amount_vat || 0;

                newRecord.setSublistValue({
                    sublistId: sublistId,
                    fieldId: "custcol_scv_so_gia_tt",
                    line: i, 
                    value: gia_thanh_toan
                });
                totalFr += gia_thanh_toan * quantity;
            }

            newRecord.setValue("custbody_scv_fr_total_amt", totalFr);
        }

        return {
            initLoadGiaThanhToanFromSO
        };
        
    });
    