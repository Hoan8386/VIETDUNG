/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define([
    'N/dataset', 'N/query', 'N/ui/serverWidget',
    '../cons/scv_cons_dataset.js'
],
    (
        dataset, query, serverWidget,
        constDataset
    ) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            let response = scriptContext.response;
            let request = scriptContext.request;
            let params = request.parameters;

            let searchResult = runFilterDataSet(params);
            let MainForm = onCreateFormUI(params);
            onRenderData(MainForm.sublist, searchResult);

            response.writePage(MainForm.form);
        }

        const onRenderData = (sublist, data) => {
            for (var i = 0; i < data.length; i++) {
                setRowDataSublist(sublist, i, [
                    "custpage_col_color", "custpage_col_lotnumber", "custpage_col_qty_available", "custpage_col_location",
                    "custpage_col_item", "custpage_col_import_date", "custpage_col_lotnumber_display", "custpage_col_invstatus",
                    "custpage_col_invstatus_display", "custpage_col_qty_intransit"
                ], [
                    data[i].color_seri, data[i].inventorynumber, data[i].quantityavailable, 
                    data[i].location, data[i].item, data[i].import_date, data[i].inventorynumber_display,
                    data[i].inventorystatus, data[i].inventorystatus_display, data[i].quantityintransit
                ]);
            }
        }

        const runFilterDataSet = (params) => {
            let arrInvBalance = getDatasetInvNumBalance(params);
            // let arrInvBalance = getDataSetInvBalance(params);

            arrInvBalance.sort((obj1, obj2) => {
                let date1 = parseDate(obj1.import_date);
                let date2 = parseDate(obj2.import_date);

                if (!date1) return 1;
                if (!date2) return -1;
                
                return date1 - date2;
            });
            return arrInvBalance;
        }

        const getDatasetInvNumBalance = (params) => {
            const DATASET_ID = "custdataset_scv_inventory_number_balance";
            // create condition
            let arrCondition = [];

            let itemColumn = dataset.createColumn({fieldId: "item"});
            let itemCondition = dataset.createCondition({column: itemColumn, operator: query.Operator.ANY_OF, values: [params.item]});
            arrCondition.push(itemCondition);
            
            if(!!params.location) {
                let locationColumn = dataset.createColumn({
                    fieldId: "location",
                    join: dataset.createJoin({ fieldId: "locations" })
                });
                let locationCondition = dataset.createCondition({column: locationColumn, operator: query.Operator.ANY_OF, values: params.location.split(",")});
                arrCondition.push(locationCondition);
            }

            if(!!params.subsidiary) {
                let subsidiaryColumn = dataset.createColumn({
                    fieldId: "subsidiary",
                    join: dataset.createJoin({ 
                        fieldId: "location",
                        join: dataset.createJoin({ fieldId: "locations" })
                    })
                });
                
                let subsidiaryCondition = dataset.createCondition({column: subsidiaryColumn, operator: query.Operator.ANY_OF, values: [params.subsidiary]});
                arrCondition.push(subsidiaryCondition);
            }

            let resultSearch = constDataset.loadDataSettWithCondition(DATASET_ID, arrCondition);
		
            resultSearch = resultSearch.runPaged({pageSize: 1000});

            let arrResult = constDataset.fetchResultDatasetAllPage(resultSearch, function(_obj, _column){
                let objRes = constDataset.getObjResultFromDatasetByKey(_obj, [
                    "item", "inventorynumber_display", "color_seri", "inv_balance_location", "inventorystatus",
                    "quantityonhand", "quantityavailable", "quantityintransit", "quantityonorder",
                    "location", "import_date", "subsidiary", "inventorynumber", "inventorystatus_display"
                ]);
                
                return objRes;
            });

            return arrResult;
        }

        const parseDate = (dateStr) => {
            if (!dateStr) return null;

            let [day, month, year] = dateStr.split("/");
            return new Date(`${year}-${month}-${day}`);
        }

        const getDataInventoryNumber = (arrInvBalance) => {
            let arrInvNumber = arrInvBalance.map(e => e.inventorynumber);
            arrInvNumber = arrInvNumber.filter((e, idx) => !!e && arrInvNumber.indexOf(e) === idx);

            let sqlQuery = `SELECT id,inventorynumber FROM inventorynumber
		        WHERE id IN ('${arrInvNumber.join("','")}')`;
            
            let resultSearch = query.runSuiteQL({
                query: sqlQuery,
                params: [],
                pageSize: 1000
            });

		    resultSearch = resultSearch.asMappedResults();
            return resultSearch;
        }

        const getDataSetInvBalance = (params) => {
            // load dataset
            let loadDataSet = dataset.load({
                id: 'custdataset_scv_inventory_balance_dataset'
            });
            
            // create condition
            let arrCondition = [];
            if(!!params.location) {
                let locationColumn = dataset.createColumn({fieldId: "location"});
                let locationCondition = dataset.createCondition({column: locationColumn, operator: query.Operator.ANY_OF, values: params.location.split(",")});
                arrCondition.push(locationCondition);
            }

            if(!!params.subsidiary) {
                let locationJoin = dataset.createJoin({
                    fieldId: 'location'
                });
                let subsidiaryColumn = dataset.createColumn({fieldId: "subsidiary", join: locationJoin});
                let subsidiaryCondition = dataset.createCondition({column: subsidiaryColumn, operator: 'MN_INCLUDE', values: [params.subsidiary]});
                arrCondition.push(subsidiaryCondition);
            }

            let itemColumn = dataset.createColumn({fieldId: "item"});
            let itemCondition = dataset.createCondition({column: itemColumn, operator: query.Operator.ANY_OF, values: [params.item]});
            arrCondition.push(itemCondition);
            
            // add condition
            loadDataSet.condition = dataset.createCondition({operator: 'AND', children: arrCondition});
            // run
            let results = loadDataSet.run().asMappedResults();
            return results;
        }

        const onCreateFormUI = (params) => {
            let mainForm = serverWidget.createForm({title: "Inventory Balance"});
            mainForm.clientScriptModulePath = '../cs/scv_cs_sl_popup_inv_balance.js';
            let defaultGrp = addFieldGroup(mainForm, "fieldgrp_main", "Default");
            // add button
            mainForm.addSubmitButton({label : 'Submit'});
            mainForm.addButton({
                id: "custpage_btn_search",
                label: "Search",
                functionName: "onSearchResult()"
            });
            mainForm.addButton({
                id: "custpage_btn_cancel",
                label: "Cancel",
                functionName: "onCancel()"
            });
            // add field
            let custpage_location = mainForm.addField({
                id: "custpage_location",
                type: serverWidget.FieldType.MULTISELECT,
                label: "Location",
                source: "location",
                container: defaultGrp.id
            });
            let custpage_item = mainForm.addField({
                id: "custpage_item",
                type: serverWidget.FieldType.SELECT,
                label: "Item",
                source: "item",
                container: defaultGrp.id
            });
            let custpage_line = mainForm.addField({
                id: "custpage_line",
                type: serverWidget.FieldType.INTEGER,
                label: "Line",
                container: defaultGrp.id
            });

            let custpage_rectype = mainForm.addField({
                id: "custpage_rectype",
                type: serverWidget.FieldType.TEXT,
                label: "Rec Type",
                container: defaultGrp.id
            });
            let custpage_sublistid = mainForm.addField({
                id: "custpage_sublistid",
                type: serverWidget.FieldType.TEXT,
                label: "Sublist ID",
                container: defaultGrp.id
            });
            // default value
            // custpage_location.updateDisplayType({displayType: 'disabled'});
            custpage_item.updateDisplayType({displayType: 'disabled'});
            custpage_line.updateDisplayType({displayType: 'hidden'});
            custpage_rectype.updateDisplayType({displayType: 'hidden'});
            custpage_sublistid.updateDisplayType({displayType: 'hidden'});
            if(!!params.location) {
                custpage_location.defaultValue = params.location.split(",");
            }
            custpage_item.defaultValue = params.item;
            custpage_line.defaultValue = params.line_number;
            custpage_sublistid.defaultValue = params.sublistId;
            custpage_rectype.defaultValue = params.recType;
            // add sublist
            let sublist = mainForm.addSublist({
                id: "custpage_sl_result",
                type: serverWidget.SublistType.LIST,
                label: 'Result',
            });
            onCreateSublistColumn(sublist, params.sublistId, params.recType);
            return {form: mainForm, sublist: sublist};
        }

        function onCreateSublistColumn(sublist, recSublistId, recType){
            let selectType = (recSublistId === "item" && recType === "workorder") ? "checkbox" : "radio";
            let arrColumn = [
                { id: "custpage_col_select", label: "Select", type: selectType, displayType: "entry" },
                { id: "custpage_col_color", label: "Seri màu", type: "text" },
                { id: "custpage_col_lotnumber", label: "Serial/Lot Number", type: "select", source: "inventorynumber" },
                { id: "custpage_col_qty_available", label: "Qty Serial Available", type: "float" },
                { id: "custpage_col_qty_intransit", label: "Qty In Transit", type: "float" },
                { id: "custpage_col_location", label: "Location", type: "select", source: "location" },
                { id: "custpage_col_item", label: "Item", type: "select", source: "item" },
                { id: "custpage_col_import_date", label: "Ngày nhập hàng", type: "text" },
                { id: "custpage_col_lotnumber_display", label: "Serial/Lot Number Display", type: "text", displayType: "hidden" },
                { id: "custpage_col_invstatus", label: "Trạng thái", type: "select", source: "inventorystatus" },
                { id: "custpage_col_invstatus_display", label: "Trạng thái", type: "text", displayType: "hidden" },
            ];
            let index = 0;
            for(let i = 0; i< arrColumn.length; i++){
                let field = sublist.addField({
                    id: arrColumn[i].id || ("custpage_col_"+ index),
                    type: arrColumn[i].type,
                    label: arrColumn[i].label,
                    source: arrColumn[i].source || null,
                });
                field.updateDisplayType({ displayType: arrColumn[i].displayType || "inline"});

                if(!arrColumn[i].id) {
                    index++;
                }
            }
        }

        function setRowDataSublist(_sublist, _line, _field, _data){
            for(var i = 0; i<_field.length; i++){
                addValueColField(_sublist, _field[i], _line, _data[i]);
            }
        }
        function addValueColField(sublist, id, line, value) {
            if(!!value){
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
