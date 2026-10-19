/**
 * Nội dung: sử dụng cho màn hình Kế hoạch mua hàng
 * Key word: 
 * =======================================================================================
 *  Date                Author                  Description
 *  ?                   ?                       ?
 *  13 Dec 2024         Phu Pham                Init, create file
 *  19 Dec 2024         Khanh Tran              View QtyRemain From PurReq from mr.Hải(https://app.clickup.com/t/86cxa8316)
 */
/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define([
    'N/record', 'N/file',
    '../cons/scv_cons_list_plan_type.js',
    '../lib/scv_lib_function.js',
    '../cons/scv_cons_purchaseplan.js'
],
    (
        record, file, constListPlanType, lbf,
        constPurchasePlan
    ) => {
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
            beforeLoad_KHDieuChinh(scriptContext);
            constPurchasePlan.viewQtyRemainFromPurReq(scriptContext);
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
            afterSubmit_UpdateKeHoachBanDau(scriptContext);
        }

        const afterSubmit_UpdateKeHoachBanDau = (scriptContext) => {
            let triggerType = scriptContext.type;
            let newRec = scriptContext.newRecord;
            if(triggerType !== "create") return;

            // delete file ke hoach dieu chinh
            let fileId = newRec.getValue("custpage_custom_fileid");
            if(!!fileId) {
                file.delete({ id: fileId });
            }
            // update ke hoach ban dau
            let khbdId = newRec.getValue("custbody_scv_ori_doc_num");
            let planTypeId = newRec.getValue("custbody_scv_pur_plan_type");
            if(!!khbdId && planTypeId == constListPlanType.RECORDS.KE_HOACH_DIEU_CHINH.ID) {
                let khbdRec = record.load({
                    type: "custompurchase_scv_purchase_plan",
                    id: khbdId, isDynamic: true
                });
                let sublistId = "item";
                let arrKHDC = getDataSublistKHDC(newRec, sublistId);
                let totalLine = khbdRec.getLineCount(sublistId);
                for(let i = 0; i < totalLine; i++) {
                    let item_id = khbdRec.getSublistValue(sublistId, "item", i);
                    let ori_lineid = khbdRec.getSublistValue(sublistId, "custcol_scv_ori_lineid", i);
                    
                    let obj_find_khdc = arrKHDC.find(e => e.item_id == item_id && e.ori_lineid == ori_lineid);
                    if(!!obj_find_khdc) {
                        khbdRec.selectLine(sublistId, i);
                        khbdRec.setCurrentSublistValue(sublistId, "custcol_scv_cancel", true);
                        khbdRec.commitLine(sublistId);
                    }
                }
                khbdRec.save({enableSourcing: false, ignoreMandatoryFields: true});
            }
        }

        const getDataSublistKHDC = (newRec, sublistId) => {
            let arrResult = [];
            let totalLine = newRec.getLineCount(sublistId);
            for(let i = 0; i < totalLine; i++) {
                let item_id = newRec.getSublistValue(sublistId, "item", i);
                let ori_lineid = newRec.getSublistValue(sublistId, "custcol_scv_ori_lineid", i);
                arrResult.push({item_id, ori_lineid});   
            }
            return arrResult;
        }

        const beforeLoad_KHDieuChinh = (scriptContext) => {
            let triggerType = scriptContext.type;
            if(triggerType !== "create") return;

            let form = scriptContext.form;
            let newRec = scriptContext.newRecord;
            let params = scriptContext.request?.parameters || {};

            let custpage_custom_fileid = form.addField({
                id: "custpage_custom_fileid",
                type: "text", label: "File Id",
            });
            custpage_custom_fileid.updateDisplayType({ displayType: "hidden" });

            if(!!params.fileId && params.rectype === "custompurchase_scv_purchase_plan" && !!params.recid) {
                custpage_custom_fileid.defaultValue = params.fileId;
                // load kh mua hang
                let purPlanRec = record.load({ type: params.rectype, id: params.recid });
                let arrPurPlanField = purPlanRec.getFields();
                arrPurPlanField = arrPurPlanField.filter(e => e.includes("custbody"));

                // set body fields
                let fields = ['subsidiary', 'department', 'trandate', 'memo', ...arrPurPlanField];
                lbf.setValue(newRec, purPlanRec, fields, fields);
                lbf.setValueData(newRec, ["custbody_scv_pur_plan_type", "custbody_scv_ori_doc_num"], [
                    constListPlanType.RECORDS.KE_HOACH_DIEU_CHINH.ID, params.recid
                ]);
                // set line fields
                let sublistId = "item";
                let arrSublist = handleDataSublistKHDieuchinh(purPlanRec, params.fileId, sublistId);
                for(let i = 0; i < arrSublist.length; i++) {
                    let obj = arrSublist[i];

                    newRec.insertLine(sublistId, i);
                    newRec.setSublistValue(sublistId, "quantity", i, 0);
                    newRec.setSublistValue(sublistId, "amount", i, 0);
                    for(let property in obj) {
                        newRec.setSublistValue(sublistId, property, i, obj[property]);
                    }
                    newRec.setSublistValue(sublistId, "custcol_scv_purchase_plan_ori_qty", i, obj.custcol_scv_plan_qty);
                }
            }
        }

        const handleDataSublistKHDieuchinh = (purPlanRec, fileId, sublistId) => {
            let sublistFields = [
                'item', 'vendorname', 'custcol_scv_upc_code', 'units', 'location', 'custcol_scv_plan_use_by_month',
                'custcol_scv_qty_consump_by_month', 'custcol_scv_predicted_consump_avg', 'custcol_scv_plan_safety_days',
                'custcol_scv_qty_processing', 'custcol_scv_on_hand_item_pending', 'custcol_scv_pur_plan_qty_po', 'custcol_scv_pur_plan_qty_po_remain',
                'custcol_scv_total_qty', 'custcol_scv_moq_eoq', 'custcol_scv_plan_qty', 'custcol_scv_plan_approve_qty',
                'custcol_scv_varience_qty', 'custcol_scv_memo', 'custcol_scv_conversion_rate', 'custcol_scv_ori_lineid'
            ];

            let fileObj = file.load({id: fileId});
            let jsonData = JSON.parse(fileObj.getContents());
            let arrData = jsonData.arrSublist;
            
            let arrResult = [];
            let totalLine = purPlanRec.getLineCount(sublistId);
            for(let i = 0; i < totalLine; i++) {
                let objRes = {};
                for(let fieldId of sublistFields) {
                    objRes[fieldId] = purPlanRec.getSublistValue(sublistId, fieldId, i);
                }

                let obj_find_data = arrData.find(e => e.item_id == objRes.item && e.ori_lineid == objRes.custcol_scv_ori_lineid);
                if(!!obj_find_data) {
                    arrResult.push(objRes);
                }
            }
            return arrResult;
        }

        return {beforeLoad, afterSubmit}

    });
