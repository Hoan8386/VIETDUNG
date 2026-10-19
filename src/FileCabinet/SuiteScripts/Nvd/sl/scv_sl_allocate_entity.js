/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define([
    'N/ui/serverWidget', 'N/query', 'N/record', 'N/url',
    '../lib/scv_lib_function.js',
    '../cons/scv_cons_search_vendor_allocate.js',
    '../cons/scv_cons_color.js',
    '../cons/scv_cons_entity_category.js',
    '../cons/scv_cons_entity_category_type.js',
    '../cons/scv_cons_vendor.js'
],
    (
        serverWidget, query, record, url, lbf, searchVendorAllo, 
        constColor, constEntCategory, constEntCatType, constVendor
    ) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */

        const CUR_SCRIPT = {
            ID: "customscript_scv_sl_allocate_entity",
            DEPLOYID_UI: "customdeploy_scv_sl_allocate_entity" 
        };
        const STEP_ASSISTANT = {
            SELECT_VENDOR: {
                ID: "step_select_vendor",
                NAME: "Select Vendor"
            },
            ALLOCATION_VENDOR: {
                ID: "step_allocation_vendor",
                NAME: 'Phân bổ NCC'
            }
        }

        const onRequest = (scriptContext) => {
            let request = scriptContext.request;
            let response = scriptContext.response;
            let params = request.parameters;

            let mainAssistant = onCreateAssistantStep();
            if(request.method === "GET") {
                if(mainAssistant.isFinished()) return;

                if (mainAssistant.currentStep == null) {
                    mainAssistant.currentStep = mainAssistant.getStep({ id: STEP_ASSISTANT.SELECT_VENDOR.ID });
                }
                onCreateFormSelectVendor(mainAssistant, params);
                response.writePage(mainAssistant);
            }
            else {
                if(params.next === 'Finish'){
                    finishAssistant(mainAssistant, request, params);
                } else if(params.cancel === 'Cancel'){
                    cancelAssistant(mainAssistant, params);
                } else{
                    mainAssistant.currentStep = mainAssistant.getNextStep();
                    
                    if(mainAssistant.currentStep.id == STEP_ASSISTANT.SELECT_VENDOR.ID){
                        onCreateFormSelectVendor(mainAssistant, params);
                    }
                    else if(mainAssistant.currentStep.id == STEP_ASSISTANT.ALLOCATION_VENDOR.ID){
                        onCreateFormAllocateVendor(mainAssistant, params);
                    }
                }
            }
            response.writePage(mainAssistant);
        }

        const finishAssistant = (mainAssistant, request, params) => {
            let isAllocateVendor = onAllocateVendorPurRequest(mainAssistant, request, params);

            mainAssistant.finishedHtml =  "Success.";
            let urlRecord = url.resolveRecord({
                recordType: 'custompurchase_scv_purchase_request',
                recordId: params.custpage_recid,
                params: {
                    isAllocateVendor: isAllocateVendor ? "T" : "F"
                }
            });
            mainAssistant.finishedHtml += `<script>window.location.replace("${urlRecord}")</script>`;
        }

        const cancelAssistant = (mainAssistant, params) => {
            mainAssistant.finishedHtml =  "Cancel.";
            let urlRecord = url.resolveRecord({
                recordType: 'custompurchase_scv_purchase_request',
                recordId: params.custpage_recid
            });
            mainAssistant.finishedHtml += `<script>window.location.replace("${urlRecord}")</script>`;
        }

        const onAllocateVendorPurRequest = (mainAssistant, request, params) => {
            let stepSelectVendor = mainAssistant.getStep({ id: STEP_ASSISTANT.SELECT_VENDOR.ID });
            let stepAllocateVendor = mainAssistant.getStep({ id: STEP_ASSISTANT.ALLOCATION_VENDOR.ID });
            
            let vendorValue = stepSelectVendor.getValue("custpage_scv_vendor");
            let arrVendorId = vendorValue.split("\u0005");
            let arrData = getDataSublistResult(request, arrVendorId);

            // TODO: thuc hien phan bo ncc
            let purReqRec = record.load({
                type: "custompurchase_scv_purchase_request",
                id: params.custpage_recid,
                isDynamic: true,
            });

            let sublistId = "item";
            let objAlloEntity = hanldeDataAllocateEntity(purReqRec, arrData, sublistId);
            
            onRemoveLineItem(purReqRec, objAlloEntity.arrRemove, sublistId);
            onInserLineItem(purReqRec, objAlloEntity.arrInsert, sublistId);
            purReqRec.save();
            // log.error("save record!");
            return true;
        }

        const onInserLineItem = (rec, arrInsert, sublistId) => {
            for(let objInsert of arrInsert) {
                rec.selectNewLine({ sublistId: sublistId });
                for(let property in objInsert) {
                    rec.setCurrentSublistValue({
                        sublistId: sublistId,
                        fieldId: property,
                        value: objInsert[property]
                    });
                }
                rec.commitLine({ sublistId: sublistId }); 
            }
        }

        const onRemoveLineItem = (rec, arrRevLine, sublistId) => {
            for(let line of arrRevLine) {
                rec.removeLine({
                    sublistId: sublistId,
                    line: line
                });
            }
        }

        const hanldeDataAllocateEntity = (rec, result, sublistId) => {
            let arrRemove = [], arrInsert = [];
            let lc = rec.getLineCount(sublistId);

            let objCount = {};
            for(let i = 0; i < lc; i++) {
                let item = rec.getSublistValue(sublistId, "item", i);
                let vendor = rec.getSublistValue(sublistId, "custcol_scv_vendor", i);
                let plan_qty = rec.getSublistValue(sublistId, "custcol_scv_plan_qty", i) * 1;

                if(objCount[item] === undefined) {
                    objCount[item] = 0;
                }
                
                let obj_find_result = result.find(e => e.item_id == item);
                if(!!obj_find_result && !vendor && plan_qty > 0) {
                    objCount[item]++;
                    
                    if(objCount[item] === 1) {
                        let arrCopy = getDataLineItemCopy(rec, sublistId, obj_find_result.arrVendor, i);
                        arrInsert = [...arrInsert, ...arrCopy];
                    }
                    arrRemove.push(i);
                }
            }
            return { 
                arrRemove: arrRemove.reverse(), 
                arrInsert: arrInsert 
            };
        }

        const getDataLineItemCopy = (rec, sublistId, arrVendor, line) => {
            let arrResult = [];
            let arrFieldsCopy = [
                'item', 'vendorname', 'custcol_scv_tc_item_code', 'description', 'department', 
                'class', 'quantity', 'location'
            ];

            for(let objVendor of arrVendor) {
                let obj = {};
                for(let fieldId of arrFieldsCopy) {
                    obj[fieldId] = rec.getSublistValue(sublistId, fieldId, line);
                }
                obj.custcol_scv_vendor = objVendor.internalid;
                obj.custcol_scv_plan_qty = objVendor.quantity;
                arrResult.push(obj);
            }
            return arrResult;
        }

        const getDataSublistResult = (request, vendors) => {
            let arrResult = [];
            let sublistId = 'custpage_sl_item';
            let totalLine = request.getLineCount(sublistId);
            for(let i = 0; i < totalLine; i++) {
                let objRes = {
                    item_id: request.getSublistValue(sublistId, "custpage_col_item", i),
                    plan_qty: request.getSublistValue(sublistId, "custpage_col_plan_qty", i) * 1,
                    total_qty: 0,
                    arrVendor: []
                };
                // for details
                vendors.forEach(vendorId => {
                    let quantity = request.getSublistValue(sublistId, "custpage_col_vendor" + vendorId, i);
                    if(!!quantity) {
                        objRes.total_qty += quantity * 1;
                        let objDetail = { internalid: vendorId, quantity: quantity * 1 };
                        objRes.arrVendor.push(objDetail);
                    }
                });
                arrResult.push(objRes);
            }

            arrResult = arrResult.filter(e => e.total_qty > 0);
            return arrResult;
        }

        const getDataVendor = (arrVendorId) => {
            let sqlQuery = `SELECT id, entityid FROM entity 
                WHERE id IN ('${arrVendorId.join("','")}')`;

            let resultSearch = query.runSuiteQL({
                query: sqlQuery
            });
            resultSearch = resultSearch.asMappedResults();
            return resultSearch;
        }

        const onCreateFormAllocateVendor = (mainAssistant, params) => {
            let arrVendorId = params.custpage_scv_vendor.split("\u0005");
            let arrVendor = getDataVendor(arrVendorId);
            let arrAllocate = searchVendorAllo.getDataSourceById(params.custpage_recid);

            let custpage_vendor_list = mainAssistant.addField({
                id: 'custpage_vendor_list',
                type: "text",
                label: "Vendor List"
            });
            custpage_vendor_list.updateDisplayType({ displayType: "hidden" });
            custpage_vendor_list.defaultValue = arrVendorId.join(",");

            let custpage_html_note = mainAssistant.addField({
                id: 'custpage_html_note',
                type: "inlinehtml",
                label: 'HTML Note'
            });
            custpage_html_note.defaultValue = getDefaultHTML_Notes();

            let itemSublist = mainAssistant.addSublist({
                id: "custpage_sl_item",
                type: "INLINEEDITOR",
                label: 'Items'
            });
            itemSublist.helpText = "Items";

            let arrColumn = [
                {id: "custpage_col_item", label: "Item", type: "select", source: "item", displayType: "disabled", isMandatory: true},
                {id: "custpage_col_plan_qty", label: "Plan Qty", type: "float", displayType: "disabled", isMandatory: true},
            ];
            for(let objVendor of arrVendor) {
                arrColumn.push({
                    id: "custpage_col_vendor" + objVendor.id, 
                    label: objVendor.entityid, 
                    type: "float",
                    displayType: "entry"
                });
            }
            onCreateSublistColumn(itemSublist, arrColumn);
            for(let i = 0; i < arrAllocate.length; i++) {
                itemSublist.setSublistValue({id: 'custpage_col_item', line: i, value: arrAllocate[i].item_id});
                itemSublist.setSublistValue({id: 'custpage_col_plan_qty', line: i, value: arrAllocate[i].quantity});
            }

            mainAssistant.updateDefaultValues({
                custpage_recid: params.custpage_recid,
                custpage_scv_ent_cat: params.custpage_scv_ent_cat
            });
        }

        const onCreateFormSelectVendor = (mainAssistant, params) => {
            let stepSelectVendor = mainAssistant.getStep({ id: STEP_ASSISTANT.SELECT_VENDOR.ID });
            let arrEntCategory = constEntCategory.getDataEntityCategoryWithType(constEntCatType.RECORDS.VENDOR.ID);

            let entCatId = stepSelectVendor.getValue("custpage_scv_ent_cat");
            let custpage_scv_ent_cat = mainAssistant.addField({
                id: 'custpage_scv_ent_cat',
                type: serverWidget.FieldType.SELECT,
                label: 'Entity Category',
            });
            let custpage_scv_vendor = mainAssistant.addField({
                id: 'custpage_scv_vendor',
                type: serverWidget.FieldType.MULTISELECT,
                label: 'Vendor',
                //  source: "vendor"
            });
            custpage_scv_vendor.isMandatory = true;
            // update default values
            addSelectOptionEntCategory(arrEntCategory, custpage_scv_ent_cat);
            if(!!entCatId) {
                let arrVendor = constVendor.getDataVendorByEntCategory(entCatId);
                addSelectOptionVendor(arrVendor, custpage_scv_vendor);
            }

            mainAssistant.updateDefaultValues({
                custpage_recid: params.custpage_recid,
            });
        }

        const addSelectOptionVendor = (data, objField) => {
            objField.addSelectOption({ value: "", text: "" });
            for(let obj of data) {
                objField.addSelectOption({ value: obj.internalid, text: obj.entityid });
            }
        }

        const addSelectOptionEntCategory = (data, objField) => {
            objField.addSelectOption({ value: "", text: "" });
            for(let obj of data) {
                objField.addSelectOption({ value: obj.internalid, text: obj.name });
            }
        }

        const onCreateAssistantStep = () => {
            let mainAssistant = serverWidget.createAssistant({
                title: 'Allocation Vendor'
            });
            mainAssistant.clientScriptModulePath = '../cs/scv_cs_sl_allocate_entity.js';

            mainAssistant.addStep({
                id: STEP_ASSISTANT.SELECT_VENDOR.ID,
                label: STEP_ASSISTANT.SELECT_VENDOR.NAME,
            })
            mainAssistant.addStep({
                id: STEP_ASSISTANT.ALLOCATION_VENDOR.ID,
                label: STEP_ASSISTANT.ALLOCATION_VENDOR.NAME
            });

            let custpage_recid = mainAssistant.addField({
                id: 'custpage_recid',
                type: "select",
                source: "custompurchase_scv_purchase_request",
                label: 'Purchase Request'
            });
            custpage_recid.updateDisplayType({ displayType: "disabled" });

            return mainAssistant;
        }

        const onCreateSublistColumn = (_sublist, _arrColumn) => {
            for(let i = 0; i< _arrColumn.length; i++){
                let objCol = _arrColumn[i];
                let field = _sublist.addField({
                    id : objCol.id,
                    type : objCol.type,
                    source: objCol.source||null,
                    label : objCol.label
                }).updateDisplayType({displayType: objCol.displayType||"disabled"});

                field.isMandatory = objCol.isMandatory ?? false;

                if(!!objCol.defaultValue){
                    field.defaultValue = objCol.defaultValue;
                }
            }
        }

        const getDefaultHTML_Notes = () => {
            return `
                <div style="font-size: 14px; color: ${constColor.RED[800]};">
                    <span>* Lưu ý: Các dòng không nhập quantity cho vendor sẽ không được tách dòng!</span>
                </div>
                <script>
                    processItemLayer();
                    function processItemLayer() {
                        let itemLayer = document.querySelector('#custpage_sl_item_layer');
                        if (!itemLayer) {
                            setTimeout(() => processItemLayer(), 500);
                        } else {
                            let itemHelpText = itemLayer.querySelector(".uir-help-text");

                            itemHelpText.style.backgroundColor = '${constColor.BLUE[300]}';
                            itemHelpText.style.padding = '6px 8px';
                            itemHelpText.style.fontWeight = 'bold';
                            itemHelpText.style.fontSize = '14px';
                        }
                    }
                </script>
            `;
        }

        return {onRequest}

    });