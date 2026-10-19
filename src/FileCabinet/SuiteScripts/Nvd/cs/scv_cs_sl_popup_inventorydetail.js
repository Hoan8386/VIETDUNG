/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  8 Jun 2024         Huy Pham                Init & create file, Phát triển chức năng tạo Item Receipt, from mr.Phuc(https://app.clickup.com/t/86cvhqmf6)
 */
/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/format',
    '../lib/scv_lib_inventorydetail.js',
    '../cons/scv_cons_record.js',
    '../cons/scv_cons_datastore.js',
    '../cons/scv_cons_format.js'
],

    function(currentRecord, format,
        libInventoryDetail,
        constRecord,
        constDataStore,
        constFormat
    ) {
        const CUR_SCRIPT = Object.freeze({
            ID: "customscript_scv_sl_popup_inventorydetai"
        })
        let windowParent = window.getParent();
        /**
         * Function to be executed after page is initialized.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
         *
         * @since 2015.2
         */
        function pageInit(scriptContext) {
            let action_type = new URLSearchParams(window.location.search).get('action_type');

            switch(action_type){
                case "receipt":
                    pageInit_Receipt(scriptContext);
                break;
                case "issue":
                    pageInit_Issue(scriptContext);
                break;
                case "transferorder":
                    pageInit_TransferOrder(scriptContext);
                break;
            }
            

            try{
                windowParent._scvCallBackPageInit?.({
                    scriptContextPopup: scriptContext,
                    parentSublistId: new URLSearchParams(window.location.search).get('sublistid'),
                    parentFieldId: new URLSearchParams(window.location.search).get('fieldid'),
                    parentLine: new URLSearchParams(window.location.search).get('line'),
                    scriptid: CUR_SCRIPT.ID
                })
            }catch(err){
                console.log("error-popupinventorydetail-pageInit")
            }
        }

        const pageInit_Receipt = (scriptContext) =>{
            let curRec = scriptContext.currentRecord;
            let fieldId = scriptContext.fieldId;
            let sublistId = scriptContext.sublistId;

            let params = getObjParams(curRec);
            let parentLine = params.parentLine * 1 + 1;

            let keyStore =  windowParent.nlapiGetLineItemValue(params.parentSublistId, libInventoryDetail.getStoreFieldId(params.parentFieldId), parentLine);
            let inventoryDetailStore = libInventoryDetail.getDataStoreInventoryClientSide(keyStore);
            if(!inventoryDetailStore) return;

            let arrLine = inventoryDetailStore.lines;

            let detailSublistId = "custpage_sl_inventorydetail";

            for(let i = 0; i < arrLine.length; i++){
                let objLine = arrLine[i];
                
                curRec.selectNewLine(detailSublistId);
                curRec.setCurrentSublistValue(detailSublistId,"custpage_inventorynumber", objLine.inventorynumber)

                if(!!objLine.expirationdate){
                    curRec.setCurrentSublistValue(detailSublistId,"custpage_expirationdate", nlapiStringToDate(objLine.expirationdate))
                }
                if(!!objLine.binnumber){
                    curRec.setCurrentSublistValue(detailSublistId,"custpage_binnumber", objLine.binnumber)
                }
                if(!!objLine.inventorystatus){
                    curRec.setCurrentSublistValue(detailSublistId,"custpage_inventorystatus", objLine.inventorystatus)
                }
                curRec.setCurrentSublistValue(detailSublistId,"custpage_quantity", objLine.quantity);
                
                curRec.commitLine(detailSublistId);
            }
        }

        const pageInit_Issue = (scriptContext) =>{
            let curRec = scriptContext.currentRecord;
            let fieldId = scriptContext.fieldId;
            let sublistId = scriptContext.sublistId;

            let params = getObjParams(curRec);

            let arrDataOnhand = libInventoryDetail.getDataItemOnhand({
                location: params.custpage_location,
                item: params.custpage_item
            });
            constDataStore.setDataStore("arrInventoryStatus", arrDataOnhand);
            
            let parentLine = params.parentLine * 1 + 1;

            let keyStore =  windowParent.nlapiGetLineItemValue(params.parentSublistId, libInventoryDetail.getStoreFieldId(params.parentFieldId), parentLine);
            let inventoryDetailStore = libInventoryDetail.getDataStoreInventoryClientSide(keyStore);
            if(!inventoryDetailStore) return;

            let arrLine = inventoryDetailStore.lines;

            let detailSublistId = "custpage_sl_inventorydetail";
            for(let i = 0; i < arrLine.length; i++){
                let objLine = arrLine[i];
                let objDataOnhand = arrDataOnhand.find(e => e.inventorynumber == objLine.issueinventorynumber && e.status == objLine.inventorystatus);
                
                curRec.selectNewLine(detailSublistId);
                curRec.setCurrentSublistValue({
                    sublistId: detailSublistId, fieldId: "custpage_issueinventorynumber",
                    value: objLine.issueinventorynumber, ignoreFieldChange: true
                })

                if(!!objLine.expirationdate){
                    curRec.setCurrentSublistValue({
                        sublistId: detailSublistId, fieldId: "custpage_expirationdate",
                        value: nlapiStringToDate(objLine.expirationdate), ignoreFieldChange: true
                    })
                }
                if(!!objLine.binnumber){
                    curRec.setCurrentSublistValue({
                        sublistId: detailSublistId, fieldId: "custpage_binnumber",
                        value: objLine.binnumber, ignoreFieldChange: true
                    })
                }
                if(!!objLine.inventorystatus){
                    curRec.setCurrentSublistValue({
                        sublistId: detailSublistId, fieldId: "custpage_inventorystatus",
                        value: objLine.inventorystatus, ignoreFieldChange: true
                    })
                }

                if(!!objDataOnhand){
                    curRec.setCurrentSublistValue({
                        sublistId: detailSublistId, fieldId: "custpage_lotquantityavailable",
                        value: objDataOnhand.available, ignoreFieldChange: true
                    })
                }

                curRec.setCurrentSublistValue({
                    sublistId: detailSublistId, fieldId: "custpage_quantity",
                    value: objLine.quantity, ignoreFieldChange: true
                })
                
                curRec.commitLine(detailSublistId);
            }
        }

        const pageInit_TransferOrder = (scriptContext) =>{
            let curRec = scriptContext.currentRecord;
            let fieldId = scriptContext.fieldId;
            let sublistId = scriptContext.sublistId;

            let params = getObjParams(curRec);
            let parentLine = params.parentLine * 1 + 1;

            let keyStore =  windowParent.nlapiGetLineItemValue(params.parentSublistId, libInventoryDetail.getStoreFieldId(params.parentFieldId), parentLine);
            let inventoryDetailStore = libInventoryDetail.getDataStoreInventoryClientSide(keyStore);
            if(!inventoryDetailStore) return;

            let arrLine = inventoryDetailStore.lines;

            let detailSublistId = "custpage_sl_inventorydetail";

            for(let i = 0; i < arrLine.length; i++){
                let objLine = arrLine[i];
                
                curRec.selectNewLine(detailSublistId);
                curRec.setCurrentSublistValue(detailSublistId,"custpage_issueinventorynumber", objLine.issueinventorynumber)

                if(!!objLine.expirationdate){
                    curRec.setCurrentSublistValue(detailSublistId,"custpage_expirationdate", nlapiStringToDate(objLine.expirationdate))
                }
                curRec.setCurrentSublistValue(detailSublistId,"custpage_quantity", objLine.quantity);
                
                curRec.commitLine(detailSublistId);
            }
        }

        /**
         * Function to be executed when field is changed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
         * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
         *
         * @since 2015.2
         */
        function fieldChanged(scriptContext) {
            let action_type = new URLSearchParams(window.location.search).get('action_type');

            switch(action_type){
                case "issue":
                    fieldChanged_Issue(scriptContext);
                break;
                case "transferorder":
                    fieldChanged_TransferOrder(scriptContext);
                break;
            }

            try{

                windowParent._scvCallBackFieldChange?.({
                    scriptContextPopup: scriptContext,
                    parentSublistId: new URLSearchParams(window.location.search).get('sublistid'),
                    parentFieldId: new URLSearchParams(window.location.search).get('fieldid'),
                    parentLine: new URLSearchParams(window.location.search).get('line'),
                    scriptid: CUR_SCRIPT.ID
                })
            }catch(err){
                console.log("error-popupinventorydetail-fieldChanged")
            }
        }

        const fieldChanged_Issue = (scriptContext) =>{
            let curRec = scriptContext.currentRecord;
            let fieldId = scriptContext.fieldId;
            let sublistId = scriptContext.sublistId;

            let params = getObjParams(curRec);
            let conversionRate = (params.conversionRate||1) * 1;

            let expiredt = "", qtyavai = 0, qty = 0, inventorystatus = "";
            let lotNoId = "";

            let arrDetail = []

            switch(fieldId){
                case "custpage_issueinventorynumber":
                    lotNoId = curRec.getCurrentSublistValue(sublistId, fieldId);
                    if(!!lotNoId){
                        arrDetail = libInventoryDetail.getDataItemOnhand({
                            inventorynumber: lotNoId,
                            location: params.custpage_location,
                            item: params.custpage_item
                        });
                        if(arrDetail.length > 0){
                            expiredt = arrDetail[0].expirationdate;
                            qtyavai = arrDetail[0].available * 1;
                            inventorystatus = arrDetail[0].status;
                        }
                    }

                    qtyavai = qtyavai / conversionRate;

                    if(!!expiredt){
                        expiredt = format.parse({value: expiredt, type: "date"});
                    }

                    curRec.setCurrentSublistValue({sublistId: sublistId, fieldId: "custpage_inventorystatus", value: inventorystatus, ignoreFieldChange: true});
                    curRec.setCurrentSublistValue({sublistId: sublistId, fieldId: "custpage_expirationdate", value: expiredt, ignoreFieldChange: true});
                    curRec.setCurrentSublistValue({sublistId: sublistId, fieldId: "custpage_lotquantityavailable", value: qtyavai, ignoreFieldChange: true});
                    curRec.setCurrentSublistValue({sublistId: sublistId, fieldId: "custpage_quantity", value: qty, ignoreFieldChange: true});

                    quickFindInventoryStatu(curRec, sublistId);
                break;
                case "custpage_inventorystatus":
                    lotNoId = curRec.getCurrentSublistValue(sublistId, "custpage_issueinventorynumber");
                    inventorystatus = curRec.getCurrentSublistValue(sublistId, fieldId);
                    arrDetail = libInventoryDetail.getDataItemOnhand({
                        inventorynumber: lotNoId,
                        location: params.custpage_location,
                        item: params.custpage_item
                    });

                    let objInvStatus = arrDetail.find(e => e.status == inventorystatus && !!inventorystatus);
                    if(!!objInvStatus) {
                        expiredt = objInvStatus.expirationdate;
                        qtyavai = objInvStatus.available * 1;
                        inventorystatus = objInvStatus.status;
                    }
                    else if(arrDetail.length > 0){
                        expiredt = arrDetail[0].expirationdate;
                        qtyavai = arrDetail[0].available * 1;
                        inventorystatus = arrDetail[0].status;
                    }

                    qtyavai = qtyavai / conversionRate;

                    if(!!expiredt){
                        expiredt = format.parse({value: expiredt, type: "date"});
                    }

                    curRec.setCurrentSublistValue({sublistId: sublistId, fieldId: "custpage_expirationdate", value: expiredt, ignoreFieldChange: true});
                    curRec.setCurrentSublistValue({sublistId: sublistId, fieldId: "custpage_lotquantityavailable", value: qtyavai, ignoreFieldChange: true});
                    curRec.setCurrentSublistValue({sublistId: sublistId, fieldId: "custpage_quantity", value: qty, ignoreFieldChange: true});

                break;
                case "custpage_quantity":
                    qty = curRec.getCurrentSublistValue(sublistId, fieldId) * 1;
                    qtyavai = curRec.getCurrentSublistValue(sublistId, "custpage_lotquantityavailable") * 1;

                    if(qty > qtyavai){
                        alert("Quantity can not greater than Quantity Available.");
                        curRec.setCurrentSublistValue({sublistId: sublistId, fieldId: "custpage_quantity", value: qtyavai, ignoreFieldChange: true});

                        return;
                    }
                break;
            }
        }

        const fieldChanged_TransferOrder = (scriptContext) =>{
            let curRec = scriptContext.currentRecord;
            let fieldId = scriptContext.fieldId;
            let sublistId = scriptContext.sublistId;

            let params = getObjParams(curRec);
            let conversionRate = (params.conversionRate||1) * 1;

            let expiredt = "", qtyavai = 0, qty = 0, inventorystatus = "";
            let lotNoId = "";

            let arrDetail = []

            switch(fieldId){
                case "custpage_issueinventorynumber":
                    lotNoId = curRec.getCurrentSublistValue(sublistId, fieldId);
                    if(!!lotNoId){
                        arrDetail = libInventoryDetail.getDataInventoryDetail({
                            internalid: lotNoId,
                            location: params.custpage_location,
                            item: params.custpage_item
                        });
                        if(arrDetail.length > 0){
                            expiredt = arrDetail[0].expirationdate;
                            qtyavai = arrDetail[0].quantityavailable;
                        }
                    }

                    qtyavai = qtyavai / conversionRate;

                    if(!!expiredt){
                        expiredt = format.parse({value: expiredt, type: "date"});
                    }

                    curRec.setCurrentSublistValue({sublistId: sublistId, fieldId: "custpage_expirationdate", value: expiredt, ignoreFieldChange: true});
                    curRec.setCurrentSublistValue({sublistId: sublistId, fieldId: "custpage_lotquantityavailable", value: qtyavai, ignoreFieldChange: true});
                    curRec.setCurrentSublistValue({sublistId: sublistId, fieldId: "custpage_quantity", value: qty, ignoreFieldChange: true});
                break;
                case "custpage_inventorystatus":
                    lotNoId = curRec.getCurrentSublistValue(sublistId, "custpage_issueinventorynumber");
                    inventorystatus = curRec.getCurrentSublistValue(sublistId, fieldId);

                    arrDetail = libInventoryDetail.getDataItemOnhand({
                        inventorynumber: lotNoId,
                        location: params.custpage_location,
                        item: params.custpage_item,
                        status: inventorystatus
                    });
                    if(arrDetail.length > 0){
                        expiredt = arrDetail[0].expirationdate;
                        qtyavai = arrDetail[0].available * 1;
                    }

                    qtyavai = qtyavai / conversionRate;

                    if(!!expiredt){
                        expiredt = format.parse({value: expiredt, type: "date"});
                    }

                    curRec.setCurrentSublistValue({sublistId: sublistId, fieldId: "custpage_expirationdate", value: expiredt, ignoreFieldChange: true});
                    curRec.setCurrentSublistValue({sublistId: sublistId, fieldId: "custpage_lotquantityavailable", value: qtyavai, ignoreFieldChange: true});
                    curRec.setCurrentSublistValue({sublistId: sublistId, fieldId: "custpage_quantity", value: qty, ignoreFieldChange: true});

                break;
                case "custpage_quantity":
                    qty = curRec.getCurrentSublistValue(sublistId, fieldId) * 1;
                    qtyavai = curRec.getCurrentSublistValue(sublistId, "custpage_lotquantityavailable") * 1;

                    if(qty > qtyavai){
                        alert("Quantity can not greater than Quantity Available.");
                        curRec.setCurrentSublistValue({sublistId: sublistId, fieldId: "custpage_quantity", value: qtyavai, ignoreFieldChange: true});

                        return;
                    }
                break;
            }
        }

        function getObjParams(_curRec){
            let params = {
                custpage_item: _curRec.getValue("custpage_item"),
                custpage_description: _curRec.getValue("custpage_description"),
                custpage_units: _curRec.getValue("custpage_units"),
                custpage_quantity: _curRec.getValue("custpage_quantity"),
                custpage_location: _curRec.getValue("custpage_location"),
                action_type: new URLSearchParams(window.location.search).get('action_type'),
                parentSublistId: new URLSearchParams(window.location.search).get('sublistid'),
                parentFieldId: new URLSearchParams(window.location.search).get('fieldid'),
                parentLine: new URLSearchParams(window.location.search).get('line'),
                conversionRate: new URLSearchParams(window.location.search).get('conversionrate')||1
            };
            return params;
        }

        const onSubmitResult = () =>{
            window.onbeforeunload = null;
            let isValid = true;

            let curRec = currentRecord.get();
            let params = getObjParams(curRec);

            try{
                isValid = windowParent._scvCallBackSubmitResult?.({
                    currentRecord: currentRecord.get(),
                    parentSublistId: new URLSearchParams(window.location.search).get('sublistid'),
                    parentFieldId: new URLSearchParams(window.location.search).get('fieldid'),
                    parentLine: new URLSearchParams(window.location.search).get('line'),
                    scriptid: CUR_SCRIPT.ID
                })
                isValid = isValid??true;
            }catch(err){
                console.log("error-popupinventorydetail-onSubmitResult")
            }

            if(params.action_type == "receipt"){
                isValid = onSubmitResult_Receipt(curRec, params);
            }
            else if(params.action_type == "issue"){
                isValid = onSubmitResult_Issue(curRec, params);
            }
            else if(params.action_type == "transferorder"){
                isValid = onSubmitResult_TransferOrder(curRec, params);
            }

            onSubmitResult_Completed();

            if(isValid){
                closePopup(true);
            }
            
        }

        const onSubmitResult_Receipt = (_curRec, _params) =>{
            let sublistId = "custpage_sl_inventorydetail";
            let sizeSublist = _curRec.getLineCount(sublistId);
            
            let total_quantity = 0;
            let arrLines = [];

            for(let i = 0; i < sizeSublist; i++){
                _curRec.selectLine(sublistId, i);

                let qty = _curRec.getCurrentSublistValue(sublistId, "custpage_quantity") * 1;

                total_quantity += qty;

                let objLine = {};
                objLine.inventorynumber = _curRec.getCurrentSublistValue(sublistId,"custpage_inventorynumber");
                objLine.inventorynumber_display = _curRec.getCurrentSublistValue(sublistId,"custpage_inventorynumber");
                objLine.expirationdate = _curRec.getCurrentSublistText(sublistId,"custpage_expirationdate");
                objLine.binnumber = _curRec.getCurrentSublistValue(sublistId,"custpage_binnumber");
                objLine.inventorystatus = _curRec.getCurrentSublistValue(sublistId,"custpage_inventorystatus");
                objLine.quantity = _curRec.getCurrentSublistValue(sublistId,"custpage_quantity") * 1;

                arrLines.push(objLine);

                _curRec.commitLine(sublistId);
            }

            total_quantity = constFormat.roundNumber(total_quantity, 6);

            if(total_quantity != _params.custpage_quantity){
                alert("Phải nhập đủ số lượng " + _params.custpage_quantity);
                return false;
            }
            
            let inventoryDetailStore = {
                item: _params.custpage_item,
                itemdescription: _params.custpage_description,
                unit: "",
                unit_display: _params.custpage_units,
                quantity: _params.custpage_quantity,
                location: _params.custpage_location,
                lines: arrLines
            };

            let parentLine = _params.parentLine * 1 + 1;
            let keyStoreNew = libInventoryDetail.setDataStoreInventoryClientSide(inventoryDetailStore);
            windowParent.nlapiSetLineItemValue(_params.parentSublistId, libInventoryDetail.getStoreFieldId(_params.parentFieldId), parentLine , keyStoreNew);

            let isNeeded = arrLines.length == 0 ? true : false;
            windowParent.nlapiSetLineItemValue(_params.parentSublistId, libInventoryDetail.getNeededFieldId(_params.parentFieldId), parentLine, isNeeded);
            
            return true;
        }

        const onSubmitResult_Issue = (_curRec, _params) =>{
            let sublistId = "custpage_sl_inventorydetail";
            let sizeSublist = _curRec.getLineCount(sublistId);
            
            let total_quantity = 0;
            let arrLines = [];

            let arrLineValidate = [];
            for(let i = 0; i < sizeSublist; i++){
                _curRec.selectLine(sublistId, i);

                let qty = _curRec.getCurrentSublistValue(sublistId, "custpage_quantity") * 1;

                total_quantity += qty;

                let objLine = {};
                objLine.issueinventorynumber = _curRec.getCurrentSublistValue(sublistId,"custpage_issueinventorynumber");
                objLine.issueinventorynumber_display = _curRec.getCurrentSublistText(sublistId,"custpage_issueinventorynumber");
                objLine.expirationdate = _curRec.getCurrentSublistText(sublistId,"custpage_expirationdate");
                objLine.binnumber = _curRec.getCurrentSublistValue(sublistId,"custpage_binnumber");
                objLine.inventorystatus = _curRec.getCurrentSublistValue(sublistId,"custpage_inventorystatus");
                objLine.quantity = _curRec.getCurrentSublistValue(sublistId,"custpage_quantity") * 1;
                objLine.lotquantityavailable = _curRec.getCurrentSublistValue(sublistId,"custpage_lotquantityavailable") * 1;

                arrLines.push(objLine);

                // let objLineVaidate;
                // if(!!e.issueinventorynumber) {
                //     objLineVaidate = arrLineValidate.find(e => e.issueinventorynumber == objLine.issueinventorynumber);
                // } else {
                //     objLineVaidate = arrLineValidate.find(e => e.inventorystatus == objLine.inventorystatus);
                // }

                let objLineVaidate = arrLineValidate.find(e => e.issueinventorynumber == objLine.issueinventorynumber && e.inventorystatus == objLine.inventorystatus);

                if(!!objLineVaidate){
                    objLineVaidate.quantity += objLine.quantity;

                    objLineVaidate.quantity = constFormat.roundNumber(objLineVaidate.quantity, 6);
                    if(objLineVaidate.quantity > objLineVaidate.lotquantityavailable){
                        alert(`Total Quantity of Lot (${objLineVaidate.issueinventorynumber_display}) can not greater than Quantity Available (${objLineVaidate.lotquantityavailable}).`);
                        return false;
                    }
                }
                else{
                    arrLineValidate.push({...objLine});
                }

                _curRec.commitLine(sublistId);
            }

            total_quantity = constFormat.roundNumber(total_quantity, 6);

            if(total_quantity != _params.custpage_quantity){
                alert("Phải nhập đủ số lượng " + _params.custpage_quantity);
                return false;
            }
            
            let inventoryDetailStore = {
                item: _params.custpage_item,
                itemdescription: _params.custpage_description,
                unit: "",
                unit_display: _params.custpage_units,
                quantity: _params.custpage_quantity,
                location: _params.custpage_location,
                lines: arrLines
            };

            let parentLine = _params.parentLine * 1 + 1;
            let keyStoreNew = libInventoryDetail.setDataStoreInventoryClientSide(inventoryDetailStore);
            windowParent.nlapiSetLineItemValue(_params.parentSublistId, libInventoryDetail.getStoreFieldId(_params.parentFieldId), parentLine , keyStoreNew);

            let isNeeded = arrLines.length == 0 ? true : false;
            windowParent.nlapiSetLineItemValue(_params.parentSublistId, libInventoryDetail.getNeededFieldId(_params.parentFieldId), parentLine, isNeeded);
            
            return true;
        }

        const onSubmitResult_TransferOrder = (_curRec, _params) =>{
            let sublistId = "custpage_sl_inventorydetail";
            let sizeSublist = _curRec.getLineCount(sublistId);
            
            let total_quantity = 0;
            let arrLines = [];

            let arrLineValidate = [];
            for(let i = 0; i < sizeSublist; i++){
                _curRec.selectLine(sublistId, i);

                let qty = _curRec.getCurrentSublistValue(sublistId, "custpage_quantity") * 1;

                total_quantity += qty;

                let objLine = {};
                objLine.issueinventorynumber = _curRec.getCurrentSublistValue(sublistId,"custpage_issueinventorynumber");
                objLine.issueinventorynumber_display = _curRec.getCurrentSublistText(sublistId,"custpage_issueinventorynumber");
                objLine.expirationdate = _curRec.getCurrentSublistText(sublistId,"custpage_expirationdate");
                objLine.quantity = _curRec.getCurrentSublistValue(sublistId,"custpage_quantity") * 1;
                objLine.lotquantityavailable = _curRec.getCurrentSublistValue(sublistId,"custpage_lotquantityavailable") * 1;

                arrLines.push(objLine);

                let objLineVaidate = arrLineValidate.find(e => e.issueinventorynumber == objLine.issueinventorynumber);
                if(!!objLineVaidate){
                    objLineVaidate.quantity += objLine.quantity;

                    objLineVaidate.quantity = constFormat.roundNumber(objLineVaidate.quantity, 6);

                    if(objLineVaidate.quantity > objLineVaidate.lotquantityavailable){
                        alert(`Total Quantity of Lot (${objLineVaidate.issueinventorynumber_display}) can not greater than Quantity Available (${objLineVaidate.lotquantityavailable}).`);
                        return false;
                    }
                }
                else{
                    arrLineValidate.push({...objLine});
                }

                _curRec.commitLine(sublistId);
            }

            total_quantity = constFormat.roundNumber(total_quantity, 6);

            if(total_quantity != _params.custpage_quantity){
                alert("Phải nhập đủ số lượng " + _params.custpage_quantity);
                return false;
            }
            
            let inventoryDetailStore = {
                item: _params.custpage_item,
                itemdescription: _params.custpage_description,
                unit: "",
                unit_display: _params.custpage_units,
                quantity: _params.custpage_quantity,
                location: _params.custpage_location,
                lines: arrLines
            };

            let parentLine = _params.parentLine * 1 + 1;
            let keyStoreNew = libInventoryDetail.setDataStoreInventoryClientSide(inventoryDetailStore);
            windowParent.nlapiSetLineItemValue(_params.parentSublistId, libInventoryDetail.getStoreFieldId(_params.parentFieldId), parentLine , keyStoreNew);

            let isNeeded = arrLines.length == 0 ? true : false;
            windowParent.nlapiSetLineItemValue(_params.parentSublistId, libInventoryDetail.getNeededFieldId(_params.parentFieldId), parentLine, isNeeded);
            
            return true;
        }

        const onSubmitResult_Completed = () =>{
            try{
                windowParent._scvCallBackSubmitResult_Completed?.({
                    currentRecord: currentRecord.get(),
                    parentSublistId: new URLSearchParams(window.location.search).get('sublistid'),
                    parentFieldId: new URLSearchParams(window.location.search).get('fieldid'),
                    parentLine: new URLSearchParams(window.location.search).get('line'),
                    scriptid: CUR_SCRIPT.ID
                })
            }catch(err){
                console.log("error-popupinventorydetail-onSubmitResult_Completed")
            }
        }

        const onCancel = () =>{
            try{
                windowParent._scvCallBackCancel?.({
                    currentRecord: currentRecord.get(),
                    parentSublistId: new URLSearchParams(window.location.search).get('sublistid'),
                    parentFieldId: new URLSearchParams(window.location.search).get('fieldid'),
                    parentLine: new URLSearchParams(window.location.search).get('line'),
                    scriptid: CUR_SCRIPT.ID
                })
            }catch(err){
                console.log("error-popupinventorydetail-onCancel")
            }

            closePopup(true);
        }

        /**
         * Function to be executed after line is selected.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @since 2015.2
         */
        function lineInit(scriptContext) {
            let action_type = new URLSearchParams(window.location.search).get('action_type');

            switch(action_type){
                case "issue":
                    lineInit_Issue(scriptContext);
                break;
            }
            
        }

        const lineInit_Issue = (scriptContext) =>{
            let curRec = scriptContext.currentRecord;
            let sublistId = scriptContext.sublistId;
            
            quickFindInventoryStatu(curRec, sublistId);
        }

        const quickFindInventoryStatu = (curRec, sublistId) =>{
            let lotNoId = curRec.getCurrentSublistValue(sublistId, "custpage_issueinventorynumber");

            let arrInventoryStatus = constDataStore.getDataStore("arrInventoryStatus")||[];
            let arrInventoryStatusOfLot = arrInventoryStatus.filter(e => e.inventorynumber == lotNoId);
            
            constRecord.initQuickFindSublistFieldSelect(curRec, sublistId, "custpage_inventorystatus", -1, {
                data: arrInventoryStatusOfLot,
                displayExpr: "status_display",
                valueExpr: "status"
            });
        }
        
        return {
            pageInit,
            fieldChanged,
            lineInit,
            onSubmitResult,
            onCancel
        };

    });
