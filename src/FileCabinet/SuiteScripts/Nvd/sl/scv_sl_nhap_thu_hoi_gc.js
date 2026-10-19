/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define([
    'N/ui/serverWidget', 'N/record', 'N/cache', 'N/search', 'N/format',
    '../lib/scv_lib_function.js',
    '../lib/scv_lib_inventorydetail.js',
    '../cons/scv_cons_list_prodcostgroup.js',
    '../cons/scv_cons_ordertype.js',
    '../cons/scv_cons_account.js',
    '../cons/scv_cons_approvalstatus.js',
    '../cons/scv_cons_subsidiary.js',
    '../cons/scv_cons_search_mro_comp_usage.js',
    '../cons/scv_cons_search_mro_comp_actual.js'
],
    /**
 * @param{serverWidget} serverWidget
 */
    (
        serverWidget, record, cache, search, format,
        lbf, libInventoryDetail,
        constProdCostGrp,
        constOrderType, 
        constAccount, constApprStatus,
        constSubsidiary,
        searchMROCompUsage,
        searchMROActual
    ) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            let request = scriptContext.request;
            let response = scriptContext.response;
            let params = request.parameters;

            if(request.method == "GET"){
                let MainForm = onCreateFormUI(params);
                response.writePage(MainForm.form);
            } else {
                let objResponse = { isSuccess: true, message: "Success!" };
                try {
                    let reqBody = JSON.parse(request.body);
                    let arrLineSelected = reqBody.arrSublist;

                    let woRec = record.load({ type: reqBody.rectype, id: reqBody.recid });
                    let iaRec = record.create({ type: "inventoryadjustment", isDynamic: true });
                    // set body fields	
                    let assemblyitem = woRec.getValue("assemblyitem");
                    let fields = ['subsidiary', 'memo', 'custbody_scv_assembly_lot'];
                    lbf.setValue(iaRec, woRec, fields, fields);
                    lbf.setValueData(iaRec, [
                        'custbody_scv_order_type', 'account', 'custbody_scv_approval_status',
                        'custbody_scv_assembly', 'custbody_scv_work_order_no', 'custbody_scv_created_transaction'
                    ], [
                        constOrderType.RECORDS.NHAP_THU_HOI_GC.ID, constAccount.RECORDS._154102.ID, constApprStatus.RECORDS.OPEN.ID,
                        assemblyitem, reqBody.recid, reqBody.recid
                    ]);

                    // set line fields
                    let sl = "inventory";
                    for(let i = 0; i < arrLineSelected.length; i++) {
                        let arrInvNumber = arrLineSelected[i].inventorydetail.lines;

                        let prod_cost_group = arrLineSelected[i].custcol_scv_prod_cost_group || constProdCostGrp.Records.NguyenLieuChinh.ID;
                        iaRec.selectNewLine(sl, i);
                        iaRec.setCurrentSublistValue(sl, "item", arrLineSelected[i].item);
                        iaRec.setCurrentSublistValue(sl, "location", arrLineSelected[i].location);
                        iaRec.setCurrentSublistValue(sl, "adjustqtyby", arrLineSelected[i].adjustqtyby);
                        iaRec.setCurrentSublistValue(sl, "custcol_scv_mro_line_related", arrLineSelected[i].custcol_scv_mro_line_related);
                        iaRec.setCurrentSublistValue(sl, "custcol_scv_prod_cost_group", prod_cost_group);

                        let inventorydetailavail = iaRec.getCurrentSublistValue(sl, 'inventorydetailavail');
                        // log.error("inv number", {
                        //     inventorydetailavail,
                        //     arrInvNumber,
                        //     data: arrLineSelected[i]
                        // })
                        if(arrInvNumber.length > 0 && (inventorydetailavail === "T" || inventorydetailavail === true)) {
                            insertInventoryDetail(iaRec, arrInvNumber, sl);
                        }

                        iaRec.commitLine(sl);
                    }

                    let internalid = iaRec.save();
                    objResponse.data = {internalid};
                }
                catch (err) {
                    log.error("Create Inventory Adjust Error!", err);
                    objResponse = { isSuccess: false, message: err.message };
                }
                // set response data
                response.setHeader({ name: 'Content-Type', value: 'application/json' });
                response.write(JSON.stringify(objResponse));
            }
        }

         const insertInventoryDetail = (iaRec, arrInvNumber, sublistId) => {
            let inventorydetailavail = iaRec.getCurrentSublistValue({sublistId: sublistId, fieldId: 'inventorydetailavail'});
            let slIVD = 'inventoryassignment';
            if(inventorydetailavail == true || inventorydetailavail == 'T') {
                let invDetailRec = iaRec.getCurrentSublistSubrecord({sublistId: sublistId, fieldId: 'inventorydetail'});
                
                let lc = invDetailRec.getLineCount({
                    sublistId: slIVD
                });
                for (let i = lc - 1; i >= 0; i--) {
                    invDetailRec.removeLine({
                        sublistId: 'inventoryassignment',
                        line: i
                    });
                }

                for(let i = 0; i < arrInvNumber.length; i++) {
                    invDetailRec.selectNewLine({sublistId: slIVD});
                    if(!!arrInvNumber[i].inventorynumber) {
                        invDetailRec.setCurrentSublistValue(slIVD, "receiptinventorynumber", arrInvNumber[i].inventorynumber);
                    }
                    invDetailRec.setCurrentSublistValue(slIVD, "inventorystatus", arrInvNumber[i].inventorystatus);

                    if(!!arrInvNumber[i].binnumber) {
                        invDetailRec.setCurrentSublistValue(slIVD, "binnumber", arrInvNumber[i].binnumber);
                    }
                    invDetailRec.setCurrentSublistValue(slIVD, "quantity", arrInvNumber[i].quantity);

                    if(arrInvNumber[i].expirationdate) {
                        let expirationdate = format.parse({ value: arrInvNumber[i].expirationdate, type: "date" });
                        invDetailRec.setCurrentSublistValue(slIVD, "expirationdate", expirationdate);
                    }
                    invDetailRec.commitLine({sublistId: slIVD});
                }
            }
        }

        const onCreateFormUI = (params) => {
            let mainForm = serverWidget.createForm({title: "Nhập vật tư thu hồi gia công"});
            mainForm.clientScriptModulePath = '../cssl/scv_cs_sl_nhap_thu_hoi_gc.js';
            let filterGrp = addFieldGroup(mainForm, "fieldgrp_main", "Main");
            let woRec = record.load({
                type: params.rectype, id: params.recid
            });
            // add button
            mainForm.addSubmitButton({label: 'Submit'});
            mainForm.addButton({
                id: "custpage_btn_cancel",
                label: "Cancel",
                functionName: "onCancel()"
            });
            lbf.pinHeaderSublist(mainForm);
            // add field
            let custpage_rectype = mainForm.addField({
                id: "custpage_rectype",
                type: serverWidget.FieldType.TEXT,
                label: "Rec Type",
                container: filterGrp.id
            });
            let custpage_recid = mainForm.addField({
                id: "custpage_recid",
                type: serverWidget.FieldType.TEXT,
                label: "Rec Id",
                container: filterGrp.id
            });
            let custpage_subsidiary = mainForm.addField({
                id: "custpage_subsidiary",
                type: serverWidget.FieldType.SELECT,
                label: "Công ty/Chi nhánh",
                container: filterGrp.id
            });
            let custpage_location = mainForm.addField({
                id: "custpage_location",
                type: serverWidget.FieldType.SELECT,
                label: "Kho",
                source: "location",
                container: filterGrp.id
            });
            let custpage_workord = mainForm.addField({
                id: "custpage_workord",
                type: serverWidget.FieldType.SELECT,
                label: "Lệnh sản xuất",
                source: "workorder",
                container: filterGrp.id
            });
            let custpage_item = mainForm.addField({
                id: "custpage_item",
                type: serverWidget.FieldType.SELECT,
                label: "Thành phẩm",
                source: "item",
                container: filterGrp.id
            });

            constSubsidiary.initLoadFieldSubsidiaryByUserRole(custpage_subsidiary);
            custpage_subsidiary.isMandatory = true;
            custpage_location.isMandatory = true;
            custpage_workord.isMandatory = true;
            custpage_item.isMandatory = true;

            custpage_rectype.defaultValue = params.rectype;
            custpage_recid.defaultValue = params.recid;
            custpage_subsidiary.defaultValue = woRec.getValue("subsidiary");
            custpage_location.defaultValue = woRec.getValue("location");
            custpage_workord.defaultValue = woRec.id;
            custpage_item.defaultValue = woRec.getValue("assemblyitem");

            custpage_subsidiary.updateDisplayType({displayType: "disabled"});
            custpage_location.updateDisplayType({displayType: "disabled"});
            custpage_workord.updateDisplayType({displayType: "disabled"});
            custpage_item.updateDisplayType({displayType: "disabled"});
            custpage_rectype.updateDisplayType({displayType: "hidden"});
            custpage_recid.updateDisplayType({displayType: "hidden"});

            // add sublist
            let rsSL = mainForm.addSublist({
                id: "custpage_sl_result",
                type: serverWidget.SublistType.LIST,
                label: 'Result'
            });
            
            rsSL.addMarkAllButtons();
            onCreateSublistColumn(rsSL, params);

            // render data sublist
            let searchResult = handleDataSavedSearch(woRec, params);
            for(let i = 0; i < searchResult.length; i++) {
                let {inventoryDetail, ...obj} = searchResult[i];

                let stringify = JSON.stringify({
                    mro_related_id: obj.mro_related_id,
                    component_id: obj.component_id,
                    location_id: obj.location_id,
                    adjustqtyby: obj.adjustqtyby,
                    qty_tieu_hao: obj.qty_tieu_hao,
                });

                setRowDataSublist(rsSL, i, [
                    "custpage_col_item", "custpage_col_item_display", "custpage_col_units",
                    "custpage_col_qty_tieu_hao", "custpage_col_quantity", "custpage_col_mro_related", 
                    "custpage_col_json_data"
                ], [
                    obj.component_id, obj.component_nm, obj.units_nm, obj.qty_tieu_hao, null,
                    obj.mro_related_nm, stringify
                ]);

                rsSL.setSublistValue({
                    id: libInventoryDetail.getStoreFieldId("custpage_col_inventorydetail"),
                    line: i,
                    value: libInventoryDetail.setStoreInventoryDetail(cache, inventoryDetail)//JSON.stringify(objRes.inventoryDetail)
                });

                let isNeeded = "T";
                if(inventoryDetail.lines.length > 0){
                    isNeeded = "T";
                }
                rsSL.setSublistValue({
                    id: libInventoryDetail.getNeededFieldId("custpage_col_inventorydetail"),
                    line: i,
                    value: isNeeded
                });
            }

            return { form: mainForm, sublist: rsSL };
        }

        const handleDataSavedSearch = (woRec, params) => {
            let arrMROCompUsage = searchMROCompUsage.getDataSourceByWorkOrder(params.recid);
            let arrMroRelated = groupDataByFieldId(arrMROCompUsage, "internalid");

            let arrMROActual = [];
            if(arrMroRelated.length > 0) {
                arrMROActual = searchMROActual.getDataSource(search.createFilter({
                    name: 'custcol_scv_mro_line_related', operator: 'anyof', values: arrMroRelated
                }));
            }
            let arrResult = [];
            for(let i = 0; i < arrMROCompUsage.length; i++) {
                let objFindMROActual = arrMROActual.find(e => e.mro_related == arrMROCompUsage[i].internalid && e.item == arrMROCompUsage[i].component_id) || {};

                let adjustqtyby = arrMROCompUsage[i].quantity;
                let objResult = {
                    mro_related_id: arrMROCompUsage[i].internalid,
                    mro_related_nm: arrMROCompUsage[i].name,
                    component_id: arrMROCompUsage[i].component_id,
                    component_nm: arrMROCompUsage[i].component_nm,
                    units_nm: arrMROCompUsage[i].units_nm,
                    location_id: woRec.getValue("location"),
                    // location_nm: woRec.getText("location"),
                    adjustqtyby: adjustqtyby * -1,
                    qty_tieu_hao: objFindMROActual.quantityuom || 0,
                };

                // objResult.quantity = objResult.adjustqtyby - objResult.qty_tieu_hao;

                objResult.inventoryDetail = libInventoryDetail.formatDataInventoryDetail({
                    item: arrMROCompUsage[i].component_id,
                    itemdescription: "",
                    unit: arrMROCompUsage[i].units_id,
                    unit_display: arrMROCompUsage[i].units_nm,
                    quantity: objResult.quantity,
                    location: objResult.location_id,
                    lines: []
                });
                arrResult.push(objResult);
            }
            return arrResult;
        }

        function onCreateSublistColumn(sublist){
            let arrColumn = [
                { id: "custpage_col_select", label: "Select", type: "checkbox", displayType: "entry" },
                { id: "custpage_col_item", label: "Vật tư", type: "text", displayType: "hidden" },
                { id: "custpage_col_item_display", label: "Vật tư", type: "textarea" },
                { id: "custpage_col_units", label: "ĐVT", type: "text" },
                { id: "custpage_col_qty_tieu_hao", label: "Số lượng đã tiêu hao", type: "float" },
                { id: "custpage_col_quantity", label: "Số lượng", type: "float", displayType: "entry", isMandatory: true },
                { id: "custpage_col_inventorydetail", label: "Chi tiết kho",isInventoryDetail: "T" },
                { id: "custpage_col_mro_related", label: "MRO Related", type: "text" },
                { id: "custpage_col_json_data", label: "JSON Data", type: "textarea", displayType: "hidden"  },
            ];

            for(let i = 0; i < arrColumn.length; i++){
                if(arrColumn[i].isInventoryDetail === "T"){
                    libInventoryDetail.addFieldInventoryDetailSublist(sublist, arrColumn[i].id);
                } else {
                    let field = sublist.addField({
                        id: arrColumn[i].id || ("custpage_col_"+ index),
                        type: arrColumn[i].type,
                        label: arrColumn[i].label,
                    });
                    
                    field.updateDisplayType({ displayType: arrColumn[i].displayType || "inline"});
                    field.isMandatory = arrColumn[i].isMandatory??false;
                }
            }
        }

        function setRowDataSublist(_sublist, _line, _field, _data){
            for(let i = 0; i<_field.length; i++){
                if(lbf.isContainValue(_data[i])){
                    _sublist.setSublistValue({
                        id: _field[i],
                        line: _line,
                        value: _data[i]??""
                    });
                }
            }
        }

        function addFieldGroup(_form, _id, _label){
            let _obj = {id: _id, label: _label}
            _form.addFieldGroup(_obj);
            return _obj;
        }

        const groupDataByFieldId = (data, field) => {
            let objGroup = {};
            for(let i = 0; i < data.length; i++) {
                let fieldValue = data[i][field];
                if(objGroup[fieldValue] === undefined && !!fieldValue) {
                    objGroup[fieldValue] = fieldValue;
                }
            }
            return Object.values(objGroup);
        }

        return {onRequest}

    });
