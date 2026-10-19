/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define([
    'N/file', 'N/record', 'N/ui/serverWidget', 'N/redirect', 'N/search',
    '../lib/scv_lib_function.js',
],
    (
        file, record, serverWidget, redirect, search,
        lbf
    ) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const FOLDER = {
            KH_DIEU_CHINH: 1999
        };
        const onRequest = (scriptContext) => {
            let request = scriptContext.request;
            let params = request.parameters;
            let response = scriptContext.response;

            if(request.method === "GET") {
                // create form
                let MainForm = onCreateFormUI(params);
                if(!!params.fileId) {
                    redirectToKeHoachDieuChinh(MainForm.form, params);
                } else {
                    // load kh mua hang
                    let khmhRec = record.load({ type: params.rectype, id: params.recid });
                    let arrSublist = getDataSublistItem(khmhRec);
                    onRenderData(MainForm.sublist, arrSublist);
                }
                response.writePage(MainForm.form);
            } else {
                let fileId = createFileKHDieuChinh(request, params);

                redirect.toSuitelet({
                    scriptId: "customscript_scv_sl_popup_crt_khdc",
                    deploymentId: "customdeploy_scv_sl_popup_crt_khdc",
                    parameters: {
                        rectype: params.custpage_rectype,
                        recid: params.custpage_recid,
                        ifrmcntnr: "T",
                        fileId: fileId
                    }
                });
            }
        }

        const createFileKHDieuChinh = (request, params) => {
            let purPlanLKF = search.lookupFields({
                type: params.custpage_rectype,
                id: params.custpage_recid,
                columns: ["tranid"]
            });

            let arrSublist = getDataSublistResult(request);
            let objResult = {
                rectype: params.custpage_rectype,
                recid: params.custpage_recid,
                arrSublist: arrSublist
            };

            let fileName = (purPlanLKF.tranid || "") + "_[" + params.custpage_recid + "] - " + "<"+Math.round((new Date()).getTime()/1000)+">";
            let objFile = file.create({
                name: fileName + ".json",
                fileType: file.Type.JSON,
                contents: JSON.stringify(objResult),
                encoding: file.Encoding.UTF8,
                folder: FOLDER.KH_DIEU_CHINH
            });

            let fileKHDC = objFile.save();
            return fileKHDC;
        }

        const getDataSublistResult = (request) => {
            let sublistId = "custpage_sl_result";
            let lc = request.getLineCount(sublistId);

            let arrResult = [];
            for(let i = 0; i < lc; i++) {
                let isSelect = request.getSublistValue(sublistId, "custpage_col_0", i);
                let jsonData = request.getSublistValue(sublistId, "custpage_col_json_data", i);
                if(isSelect === true || isSelect === "T") {
                    let objRes = JSON.parse(jsonData);
                    arrResult.push(objRes);
                }
            }
            return arrResult;
        }

        const onRenderData = (sublist, data) => {
            for (let i = 0; i < data.length; i++) {
                let obj = data[i];
                setRowDataSublist(sublist, i, [
                    "custpage_col_1", "custpage_col_2", "custpage_col_3", "custpage_col_4", 
                    "custpage_col_5", "custpage_col_6", "custpage_col_7", "custpage_col_json_data",
                ], [
                    obj.item_display, obj.vendorname, obj.units_nm, obj.qty_consump_by_month,
                    obj.predicted_consump_avg, obj.plan_safety_days, obj.ori_lineid,
                    JSON.stringify(obj)
                ]);
            }
        }

        const getDataSublistItem = (khmhRec) => {
            let arrResult = [];
            let sublistId = "item";
            let totalLine = khmhRec.getLineCount(sublistId);
            for(let i = 0; i < totalLine; i++) {
                let cancel = khmhRec.getSublistValue(sublistId, "custcol_scv_cancel", i);
                let item_id = khmhRec.getSublistValue(sublistId, "item", i);
                let item_display = khmhRec.getSublistValue(sublistId, "item_display", i);
                let vendorname = khmhRec.getSublistValue(sublistId, "vendorname", i);
                let units_id = khmhRec.getSublistValue(sublistId, "units", i);
                let units_nm = khmhRec.getSublistText(sublistId, "units", i);
                let qty_consump_by_month = khmhRec.getSublistValue(sublistId, "custcol_scv_qty_consump_by_month", i) * 1;
                let predicted_consump_avg = khmhRec.getSublistValue(sublistId, "custcol_scv_predicted_consump_avg", i) * 1;
                let plan_safety_days = khmhRec.getSublistValue(sublistId, "custcol_scv_plan_safety_days", i) * 1;
                let ori_lineid = khmhRec.getSublistValue(sublistId, "custcol_scv_ori_lineid", i);
                
                if(cancel === false || cancel === "F") {
                    arrResult.push({
                        item_id, item_display, vendorname, units_id, units_nm, qty_consump_by_month, 
                        predicted_consump_avg, plan_safety_days, ori_lineid
                    });
                }
            }
            return arrResult;
        }

        const redirectToKeHoachDieuChinh = (form, params) => {
            let scriptContent = `<script>
                require(["N/url"], (url) => {
                    let urlCrtRec = "/app/accounting/transactions/cutrprch.nl?customtype=113";
                    urlCrtRec += "&rectype=" + '${params.rectype}' + "&recid=" + '${params.recid}';
                    urlCrtRec += "&fileId=" + '${params.fileId}';
                    
                    window.top.location.replace(urlCrtRec);
                    window.top.closePopup(true);
                });
            </script>`;
            form.addField({
                id: 'custpage_inline_html',
                type: 'inlinehtml',
                label: 'inlinehtml'
            }).defaultValue = scriptContent;
        }

        const onCreateFormUI = (params) => {
            let mainForm = serverWidget.createForm({title: "Create Kế hoạch điều chỉnh"});
            let filterGrp = addFieldGroup(mainForm, "fieldgrp_main", "Filters");
            // add button
            mainForm.addSubmitButton({label : 'Submit'});
            lbf.pinHeaderSublist(mainForm);
            // add field
            let custpage_rectype = mainForm.addField({
                id: "custpage_rectype",
                type: serverWidget.FieldType.TEXT,
                label: "RecType",
                container: filterGrp.id
            });
            let custpage_recid = mainForm.addField({
                id: "custpage_recid",
                type: serverWidget.FieldType.TEXT,
                label: "RecID",
                container: filterGrp.id
            });

            custpage_rectype.isMandatory = true;
            custpage_rectype.defaultValue = params.rectype;
            custpage_rectype.updateDisplayType({ displayType: "hidden" });
            
            custpage_recid.isMandatory = true;
            custpage_recid.defaultValue = params.recid;
            custpage_recid.updateDisplayType({ displayType: "hidden" });

            // add sublist
            let rsSL = mainForm.addSublist({
                id: "custpage_sl_result",
                type: serverWidget.SublistType.LIST,
                label: 'Result'
            });   
            rsSL.addMarkAllButtons();
            onCreateSublistColumn(rsSL, params);
            return { form: mainForm, sublist: rsSL };
        }

        function onCreateSublistColumn(sublist){
            let arrColumn = [
                { label: "Select", type: "checkbox", displayType: "entry" },
                { label: "Tên HHDV", type: "text" },
                { label: "Vendor Name", type: "text" },
                { label: "Đơn vị tính", type: "text" },
                { label: "Tiêu hao TB tháng", type: "float" },
                { label: "Dự báo tiêu hao trung bình", type: "float" },
                { label: "Số ngày dự phòng kế hoạch", type: "float" },
                { label: "Ori line ID", type: "text" },
                { id: "custpage_col_json_data", label: "JSON Data", type: "textarea", displayType: "hidden" },
            ];
            let index = 0;
            for(let i = 0; i< arrColumn.length; i++){
                let field = sublist.addField({
                    id: arrColumn[i].id || ("custpage_col_"+ index),
                    type: arrColumn[i].type,
                    label: arrColumn[i].label,
                    source: arrColumn[i].source || null,
                });

                if(arrColumn[i].source === 'location') {
                    field.updateDisplaySize({
                        width: 200,
                        height: 'auto'
                    });
                }
                
                field.updateDisplayType({ displayType: arrColumn[i].displayType || "inline"});
                if(!arrColumn[i].id) {
                    index++;
                }
            }
        }

        function setRowDataSublist(_sublist, _line, _field, _data){
            for(let i = 0; i<_field.length; i++){
                addValueColField(_sublist, _field[i], _line, _data[i]);
            }
        }

        function addValueColField(sublist, id, line, value) {
            if(lbf.isContainValue(value)){
                sublist.setSublistValue({
                    id: id,
                    line: line,
                    value: value
                });
            }
        }

        function addFieldGroup(_form, _id, _label){
            let _obj = {id: _id, label: _label}
            _form.addFieldGroup(_obj);
            return _obj;
        }

        return {onRequest}

    });
