/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  06 Jan 2024         Huy Pham                Init & create file
 */
/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search','N/runtime', 'N/cache', 
    '../lib/scv_lib_inventorydetail.js',
    '../olib/alasql/alasql.min@1.7.3.js',

    '../cons/scv_cons_form.js',

    '../cons/scv_cons_location.js',
    '../cons/scv_cons_bin.js',
    '../cons/scv_cons_item.js',
    '../cons/scv_cons_inventorynumber.js',
],
    /**
     * @param{record} record
     * @param{search} search
     */
    function(record, search,runtime, cache,
        libInventoryDetail,
        alasql,

        constForm,

        constLocation,
        constBin,
        constItem,
        constInventoryNumber
        ) {
            
        /**
         * Definition of the Suitelet script trigger point.
         *
         * @param {Object} context
         * @param {ServerRequest} context.request - Encapsulation of the incoming request
         * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
         * @Since 2015.2
         */
        function onRequest(context) {
            constForm.setRequest(context.request);
            constForm.setResponse(context.response);
            constForm.setServiceScript(libInventoryDetail.CUR_SCRIPT.ID, libInventoryDetail.CUR_SCRIPT.SVC_DEPLOYMENTID);

            let request = context.request;
            let params = request.parameters;
            let curScript = runtime.getCurrentScript();
            
            if(curScript.deploymentId == libInventoryDetail.CUR_SCRIPT.SVC_DEPLOYMENTID){
                let objResponse = {data: []};
        
				switch(params.action){
                    case "setStoreInventoryDetail":
						objResponse.data = libInventoryDetail.setStoreInventoryDetail(cache, JSON.parse(params.dataStore));
						break;
                    case "getStoreInventoryDetail":
						objResponse.data = libInventoryDetail.getStoreInventoryDetail(cache, params.keyStore);
						break;
				}

                constForm.write(objResponse);
            }else{
                if(context.request.method == "GET"){
                    onCreateFormUI(params);
    
                    constForm.writePage();
                }
            }
            
        }

        const onCreateFormUI = (_params) => {
            constForm.createForm("Inventory Detail", '../cs/scv_cs_sl_popup_inventorydetail.js');

            constForm.addButton({
                id: "custpage_scv_submit", label: "OK", functionName: "onSubmitResult()"
            }, {
                styleSubmit: true
            });
            constForm.addButton({id: "custpage_scv_cancel", label: "Close", functionName: "onCancel()"});

            constForm.addField({
                id: 'custpage_item', label: 'Item',
                type: "select", source: "item"
            }, false, {
                displayType: "inline",
                defaultValue: _params.item??""
            });

            constForm.addField({
                id: 'custpage_description', label: 'Description',
                type: "text"
            }, false, {
                displayType: "inline",
                defaultValue: _params.description??""
            });

            constForm.addField({
                id: 'custpage_quantity', label: 'Quantity',
                type: "float"
            }, false, {
                displayType: "inline",
                defaultValue: _params.quantity||0
            });

            constForm.addField({
                id: 'custpage_units', label: 'Units',
                type: "text"
            }, false, {
                displayType: "inline",
                defaultValue: _params.unit_display??""
            });

            constForm.addField({
                id: 'custpage_location', label: 'Location',
                type: "select", source: "location",
            }, false, {
                displayType: "inline",
                defaultValue: _params.location??""
            });
            
            constForm.addSublist({
                id: 'custpage_sl_inventorydetail',
                type: "inlineeditor",
                label: 'Inventory Detail'
            });

            onCreateItemSublistColumn(_params);

            if(_params.isedit == "F"){
                constForm.removeButton('custpage_scv_submit');

                constForm.addField({
                    id: 'custpage_inlinehtml_css', label: 'CSS',
                    type: "inlinehtml"
                }, false, {
                    defaultValue: `<style>.uir-machine-button-row{display: none !important}</style>`
                });
            }
        }

        const onCreateItemSublistColumn = (_params) => {
            let arrColumn = [];

            let isUseBin = constLocation.isUseBins(_params.location);
            isUseBin = isUseBin ? constItem.isUseBins(_params.item) : false;

            let isLotNo = constItem.isLotItem(_params.item);

            if(_params.action_type == "receipt"){
                arrColumn = [
                    {id: 'custpage_inventorynumber', label: 'Serial/Lot Number', type: 'text', isMandatory: true, displayType: isLotNo ? "entry" : "hidden"},
                    {id: 'custpage_expirationdate', label: 'Expiration Date', type: 'date', displayType: "entry" },
                    {id: 'custpage_binnumber', label: 'Bins', type: 'select', displayType: isUseBin ? "entry" : "hidden"},
                    {id: 'custpage_inventorystatus', label: 'Status', type: 'select', source: "inventorystatus", displayType: "entry" },
                    {id: 'custpage_quantity', label: 'Quantity to be Received', type: 'float', isMandatory: true, displayType: "entry" },
                ]
            }
            else if(_params.action_type == "issue"){
                arrColumn = [
                    {id: 'custpage_issueinventorynumber', label: 'Serial/Lot Number', type: 'select', isMandatory: true, displayType: isLotNo ? "entry" : "hidden" },
                    {id: 'custpage_binnumber', label: 'Bins', type: 'select', displayType: isUseBin ? "entry" : "hidden"},
                    {id: 'custpage_inventorystatus', label: 'Status', type: 'select', source: "inventorystatus", displayType: "entry"},
                    {id: 'custpage_expirationdate', label: 'Expiration Date', type: 'date', displayType: "disabled"},
                    {id: 'custpage_lotquantityavailable', label: 'Quantity Available', type: 'float', displayType: "disabled"},
                    {id: 'custpage_quantity', label: 'Quantity', type: 'float', isMandatory: true, displayType: "entry" },
                ]
            }
            else if(["transferorder"].includes(_params.action_type)){
                arrColumn = [
                    {id: 'custpage_issueinventorynumber', label: 'Serial/Lot Number', type: 'select', isMandatory: true, displayType: isLotNo ? "entry" : "hidden" },
                    {id: 'custpage_expirationdate', label: 'Expiration Date', type: 'date', displayType: "entry" },
                    {id: 'custpage_lotquantityavailable', label: 'Quantity Available', type: 'float', displayType: "disabled"},
                    {id: 'custpage_quantity', label: 'Quantity', type: 'float', isMandatory: true, displayType: "entry" },
                ]
            }
            else{
                arrColumn = [
                    {id: 'custpage_inventorynumber', label: 'Supplier Lot Number', type: 'text', displayType: "entry" },
                ]
            }

            arrColumn.forEach(objCol => {
                if(isUseBin && objCol.id == "custpage_binnumber"){
                    objCol.lookup = {
                        displayExpr: "binnumber",
                        valueExpr: "internalid",
                        data: constBin.getDataSource(search.createFilter({
                            name: 'location', 
                            operator: "anyof", 
                            values: _params.location
                        }))
                    };
                }
                else if(objCol.id == "custpage_issueinventorynumber"){
                    objCol.lookup = {
                        displayExpr: "inventorynumber",
                        valueExpr: "internalid",
                        data: constInventoryNumber.getDataSource([
                            search.createFilter({name: 'quantityavailable', operator: "greaterthan", values: 0}),
                            search.createFilter({name: 'location', operator: "anyof", values: _params.location}),
                            search.createFilter({name: 'item', operator: "anyof", values: _params.item})
                        ])
                    };
                }
                else if(_params.action_type == "issue" && objCol.id == "custpage_inventorystatus" && !isLotNo){
                    let arrDetail = libInventoryDetail.getDataItemOnhand({
                        location: _params.location,
                        item: _params.item
                    });
                    let arrDataStatus = alasql(`SELECT DISTINCT status, status_display FROM ?`, [arrDetail]);

                    objCol.source = null;
                    objCol.lookup = {
                        displayExpr: "status_display",
                        valueExpr: "status",
                        data: arrDataStatus
                    };
                }
            });

            constForm.addFieldOfSublist("custpage_sl_inventorydetail", arrColumn);
        }

        return {
            onRequest: onRequest
        };

    });
