/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define([
    'N/search', 'N/record', 'N/ui/serverWidget', 'N/runtime', 'N/query',
    'N/redirect',
    '../lib/scv_lib_function.js',
    '../cons/scv_cons_list_loc_type.js', 
    '../cons/scv_cons_approvalstatus.js',
    '../cons/scv_cons_ordertype.js'
],
    (
        search, record, serverWidget, runtime, query, redirect,
        lbf,
        constListLocType, constAprStatus, constOrderType
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
                let abRec = record.load({ type: params.rectype, id: params.recid });
                let mainForm = onCreateFormUI(abRec);
                response.writePage(mainForm);
            } else {
                onRequestMethodPOST(request, response);
            }
        }

        const onRequestMethodPOST = (request, response) => {
            let reqBody = JSON.parse(request.body);
            let objResponse = createTransferOrder(reqBody);

            response.setHeader({
                name: 'Content-Type',
                value: 'application/json'
            });
            response.write(JSON.stringify(objResponse));
        }

        const createTransferOrder = (reqBody) => {
            try {
                // load build
                let abRec = record.load({
                    type: reqBody.custpage_rectype,
                    id: reqBody.custpage_build
                });
                let createdfrom = abRec.getValue("createdfrom");
                let orrginal_wo = abRec.getValue("custbody_scv_orrginal_wo");
                let userId = getCurrentUser(runtime.getCurrentUser().id);
                let arrSublist = getDataSublistAB(abRec);
                // create to
                let toRec = record.create({
                    type: "transferorder",
                    isDynamic: true
                });
                let toFields = [
                    "subsidiary", "trandate", "location", "custbody_scv_shift", "custbody_scv_wo_center",
                    "custbody_scv_mfg_date", "custbody_scv_assembly_lot"
                ];
                let abFields = [
                    "subsidiary", "trandate", "location", "custbody_scv_shift", "custbody_scv_wo_center",
                    "custbody_scv_mfg_date", "custbody_scv_assembly_lot"
                ];
                lbf.setValue(toRec, abRec, toFields, abFields);
                lbf.setValueData(toRec, [
                    "custbody_scv_order_type", "transferlocation", "custbody_scv_work_order_no",
                    "custbody_scv_approval_status", "custbody_scv_employee_ycxvt", "custbody_scv_related_transaction"
                ], [
                    constOrderType.RECORDS.CHUYEN_KHO_SX_SANG_KHO_TP.ID, reqBody.custpage_location, (createdfrom || orrginal_wo), 
                    constAprStatus.RECORDS.APPROVED.ID, userId, reqBody.custpage_build
                ]);
                // insert line
                let sl = "item";
                for(let i = 0; i < arrSublist.length; i++) {
                    let arrInvNumber = arrSublist[i].arrInvNumber;
                    
                    toRec.selectNewLine(sl, i);
                    toRec.setCurrentSublistValue(sl, "item", arrSublist[i].item);
                    toRec.setCurrentSublistValue(sl, "units", arrSublist[i].units);
                    toRec.setCurrentSublistValue(sl, "quantity", arrSublist[i].quantity);

                    if(arrInvNumber.length > 0) {
                        insertInventoryDetail(toRec, arrInvNumber, sl);
                    }

                    toRec.commitLine(sl);
                }
                let toId = toRec.save({enableSourcing: false, ignoreMandatoryFields: true});
                return {
                    isSuccess: true, toId: toId, msg: "Success."
                };
            } catch(err) {
                return {
                    isSuccess: false, toId: null, msg: err.message,
                };
            }
        }

        const insertInventoryDetail = (toRec, arrInvNumber, sublistId) => {
            let inventorydetailavail = toRec.getCurrentSublistValue({sublistId: sublistId, fieldId: 'inventorydetailavail'});
            let slIVD = 'inventoryassignment';
            if(inventorydetailavail == true || inventorydetailavail == 'T') {
                let invDetailRec = toRec.getCurrentSublistSubrecord({sublistId: sublistId, fieldId: 'inventorydetail'});
                for(let i = 0; i < arrInvNumber.length; i++) {
                    invDetailRec.selectNewLine({sublistId: slIVD});
                    invDetailRec.setCurrentSublistValue(slIVD, "issueinventorynumber", arrInvNumber[i].lot_num_id);
                    invDetailRec.setCurrentSublistValue(slIVD, "quantity", arrInvNumber[i].quantity);

                    invDetailRec.commitLine({sublistId: slIVD});
                }
            }
        }

        const getDataSublistAB = (abRec) => {
            let slInvDetail = 'inventoryassignment';
            let arrResult = [];

            let item = abRec.getValue("item");
            let units = abRec.getValue("units");
            let quantity = abRec.getValue("quantity");

            let objRes = {
                item: item,
                units: units,
                quantity: quantity,
                arrInvNumber: []
            };

            let invdetailavail = abRec.getValue("inventorydetailavail");
            if (invdetailavail === true || invdetailavail === 'T') {
                let invDetailRec = abRec.getSubrecord('inventorydetail');
                let lcInvDetail = invDetailRec.getLineCount(slInvDetail);
                for (let j = 0; j < lcInvDetail; j++) {
                    objRes.arrInvNumber.push({
                        lot_num_id: invDetailRec.getSublistValue(slInvDetail, "numberedrecordid", j),
                        quantity: invDetailRec.getSublistValue(slInvDetail, "quantity", j),
                        inventorystatus: invDetailRec.getSublistValue(slInvDetail, "inventorystatus", j),
                    });
                }
            }

            arrResult.push(objRes);
            return arrResult;
        }

        const getCurrentUser = (userId) => {
            let entityType = lbf.getEntityType(userId);
            if (entityType === record.Type.EMPLOYEE) return userId;

            let objEntity = getObjTableQueryByID(entityType, ['custentity_scv_partner_employee'], userId);
            return objEntity.custentity_scv_partner_employee || "";
        };

        const getObjTableQueryByID = (_table, _arrColumns, _id) => {
            if (_arrColumns.length === 0) _arrColumns.push("id")
            let resultSearch = query.runSuiteQL({
                query: `SELECT ` + _arrColumns.join(",") + ` 
                FROM ` + _table + `
                WHERE id = ` + _id
            });
            resultSearch = resultSearch.asMappedResults();

            return resultSearch.length > 0 ? resultSearch[0] : {};
        }

        // const onCloseForm = () => {
        //     let mainForm = serverWidget.createForm({title: "Tạo Yêu cầu điều chuyển thành phẩm từ Phiếu thống kê"});
        //     // add field
        //     let custpage_inlinehtml = mainForm.addField({
		// 		id: 'custpage_inlinehtml',
		// 		type: "inlinehtml",
		// 		label: 'Inline Html'
		// 	});
        //     custpage_inlinehtml.defaultValue = `<script>window.parent.closePopup();</script>`;
        //     return mainForm;
        // }

        const onCreateFormUI = (abRec) => {
            let mainForm = serverWidget.createForm({title: "Tạo Yêu cầu điều chuyển thành phẩm từ Phiếu thống kê"});
            mainForm.clientScriptModulePath = '../cs/scv_cs_sl_crt_to_from_ab.js';
            let filterGrp = addFieldGroup(mainForm, "fieldgrp_main", "Main");
            // add button
            mainForm.addSubmitButton({label : 'Submit'});
            // add field
            let custpage_rectype = mainForm.addField({
                id: "custpage_rectype",
                type: serverWidget.FieldType.TEXT,
                label: "RecType",
                container: filterGrp.id
            });
            let custpage_location = mainForm.addField({
                id: "custpage_location",
                type: serverWidget.FieldType.SELECT,
                label: "Kho nhập",
                container: filterGrp.id
            });
            let custpage_subsidiary = mainForm.addField({
                id: "custpage_subsidiary",
                type: serverWidget.FieldType.SELECT,
                label: "Công ty/Chi nhánh",
                container: filterGrp.id
            });
            let custpage_build = mainForm.addField({
                id: "custpage_build",
                type: serverWidget.FieldType.SELECT,
                label: "Phiếu thống kê",
                source: "assemblybuild",
                container: filterGrp.id
            });

            custpage_location.isMandatory = true;
            custpage_rectype.updateDisplayType({ displayType: "hidden" });
            custpage_subsidiary.updateDisplayType({ displayType: "disabled" });
            custpage_build.updateDisplayType({ displayType: "disabled" });

            let subsidiary = abRec.getValue("subsidiary");
            custpage_rectype.defaultValue = abRec.type;
            custpage_build.defaultValue = abRec.id;

            onLoadSubsidiaryRole(custpage_subsidiary, subsidiary);
            onLoadLocation(custpage_location, subsidiary);
            return mainForm;
        }

        function onLoadSubsidiaryRole(_subsidiaryField, _subsidiaryId){
            let data = getDataSubsidiaryByRole(_subsidiaryId);
            _subsidiaryField.addSelectOption({
                value: data.id, text: data.name
            });
        }

        const getDataSubsidiaryByRole = (_subsidiaryId) => {
            let subSearch = search.create({
                type: "subsidiary",
                filters: ["internalid", "anyof", _subsidiaryId],
                columns: ["namenohierarchy"]
            });
            subSearch = subSearch.run().getRange(0, 1000);

            let arrResult = [];
            for(let i in subSearch){
                arrResult.push({
                    id: subSearch[i].id,
                    name: subSearch[i].getValue('namenohierarchy'),
                });
            }
            return arrResult.length > 0 ? arrResult[0] : {};
        }

        const onLoadLocation = (_locationField, _subsidiaryId) => {
            _locationField.addSelectOption({value : "", text : ""});
            // custrecord_scv_loc_type = ${constListLocType.RECORDS.KHO_SAN_XUAT.ID} AND
            let resultSQL = query.runSuiteQL({
                query: `
                    SELECT id, fullname, subsidiary FROM location
                    WHERE isinactive = 'F'`
            });

            let resultQuery = resultSQL.asMappedResults();
            resultQuery = resultQuery.filter(e => e.subsidiary == _subsidiaryId);

            for(let i in resultQuery) {
                _locationField.addSelectOption({value: resultQuery[i].id, text: resultQuery[i].fullname});
            }
        }

        function addFieldGroup(_form, _id, _label){
            let _obj = {id: _id, label: _label}
            _form.addFieldGroup(_obj);
            return _obj;
        }

        return {onRequest}

    });
