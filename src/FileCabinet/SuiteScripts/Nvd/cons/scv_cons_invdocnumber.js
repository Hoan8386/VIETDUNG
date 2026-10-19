/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  01 Mar 2025         Huy Pham                Init, create file, Chuyển chức năng sinh số phiếu nhập, phiếu xuất kho từ LSS => Refactor, from mr.Việt(https://app.clickup.com/t/86cy4pj9u)
 *  30 Jun 2025         Huy Pham                Bổ sung prefix theo trandate, from mr.Việt(https://app.clickup.com/t/86cy4pj9u?comment=90160119091765)
 *  10 Jul 2025         Huy Pham                Bổ sung thêm sinh số tại màn hình Inventory Transfer, từ mr.Việt(https://app.clickup.com/t/86cy4pj9u?comment=90160120849225)
 */
define(['N/search', 'N/record',
    '../cons/scv_cons_search.js',
    '../cons/scv_cons_format.js',
    '../cons/scv_cons_item.js',
],
    function(search, record,
        constSearch,
        constFormat,
        constItem
    ) {
        const TYPE = "customrecord_scv_inv_doc_number";
        const FIELD = {
            ID: "id",
            INACTIVE: "isinactive",
            NAME: "name"
        }
    
        const SUBLIST = {
            
        }
    
        const RECORDS = {
        }

        const getDataSource = (_filters) => {
            let resultSearch =  constSearch.createSearchWithFilter({
                type: "customrecord_scv_inv_doc_number",
                filters:
                [
                    ["isinactive","is","F"]
                ],
                columns:
                [
                    "internalid",
                    "custrecord_scv_doc_subsidiary", "custrecord_scv_inv_doc_location",
                    "custrecord_scv_inv_receipt_num", "custrecord_scv_idn_receipt_counter",
                    "custrecord_scv_inv_doc_fullfill", "custrecord_scv_idn_fulfill_counter"
                ]
            }, _filters);
            
            let arrResult = constSearch.fetchResultSearchRunEach(resultSearch, function(_objTmpl, _column){
                let objResTmpl = constSearch.getObjResultFromSearchByKey(_objTmpl, _column, [
                    "internalid",
                    "custrecord_scv_doc_subsidiary", "custrecord_scv_inv_doc_location",
                    "custrecord_scv_inv_receipt_num", "custrecord_scv_idn_receipt_counter",
                    "custrecord_scv_inv_doc_fullfill", "custrecord_scv_idn_fulfill_counter"
                ]);

                objResTmpl.custrecord_scv_idn_receipt_counter = objResTmpl.custrecord_scv_idn_receipt_counter * 1;
                objResTmpl.custrecord_scv_idn_fulfill_counter = objResTmpl.custrecord_scv_idn_fulfill_counter * 1;

                return objResTmpl;
            });
            
            return arrResult;
        }

        
        const updateCounter = (_transRec) =>{
            let transType = _transRec.type;

            //TO-DO: Go-Live theo dõi
            try{
                if(["inventoryadjustment", "workordercompletion", "inventorytransfer"].includes(transType)){
                    updateCounterReceipt(_transRec);
                    updateCounterFulfill(_transRec);
                }
                else if(["itemfulfillment", "invoice"].includes(transType)){
                    updateCounterFulfill(_transRec);
                }
                else if(["itemreceipt", "vendorbill"].includes(transType)){
                    updateCounterReceipt(_transRec);
                }
            }
            catch(err){
                log.error("huy-Error: Try-Catch-updateCounter: " + _transRec.id, err)
            }
        }

        const updateCounterReceipt = (_transRec) =>{
            let objRes = {
                custbody_scv_ir_doc_number: _transRec.getValue('custbody_scv_ir_doc_number'),
                custrecord_scv_idn_receipt_counter: 0
            }
            if(!!objRes.custbody_scv_ir_doc_number && objRes.custbody_scv_ir_doc_number != "To Be Generated"){
                return objRes;
            }

            let isValid = false;
            let location = "";
            if(_transRec.type == "inventoryadjustment"){
                location = _transRec.getSublistValue("inventory", "location", 0);

                //Tạo số chứng từ cho field IR nếu Adjust Qty. By ở LINE ĐẦU TIÊN lớn hơn 0
                isValid = validateCounterReceipt_IA(_transRec);
            }
            else if(_transRec.type == "vendorbill"){
                location = _transRec.getValue("location");

                isValid = validateCounterReceipt_VendorBill(_transRec);
            }
            else if(_transRec.type == "itemreceipt"){
                location = _transRec.getSublistValue("item", "location", 0);

                isValid = true;
            }
            else if(_transRec.type == "workordercompletion"){
                location = _transRec.getValue("location");

                isValid = true;
            }
            else if(_transRec.type == "inventorytransfer"){
                location = _transRec.getValue("transferlocation");

                isValid = true;
            }

            if(!isValid) return objRes;
            
            
            let objInvDocNumber = getFirstInvDocNumber(location);
            if(!objInvDocNumber) return objRes;

            let trandate =  _transRec.getValue('trandate');
            let mmyy = constFormat.getMM(trandate) + constFormat.getYY(trandate);

            objRes.custrecord_scv_idn_receipt_counter = objInvDocNumber.custrecord_scv_idn_receipt_counter + 1;

            objRes.custbody_scv_ir_doc_number = objInvDocNumber.custrecord_scv_inv_receipt_num + "_" + objRes.custrecord_scv_idn_receipt_counter;

            _transRec.setValue('custbody_scv_ir_doc_number', objRes.custbody_scv_ir_doc_number);

            submitFields_ReceiptCounter(objInvDocNumber.internalid, objRes.custrecord_scv_idn_receipt_counter);

            return objRes;
        }

        const updateCounterFulfill = (_transRec) =>{
            let objRes = {
                custbody_scv_if_doc_number: _transRec.getValue('custbody_scv_if_doc_number'),
                custrecord_scv_idn_fulfill_counter: 0
            }
            if(!!objRes.custbody_scv_if_doc_number && objRes.custbody_scv_if_doc_number != "To Be Generated"){
                return objRes;
            }

            let isValid = false;
            let location = "";
            if(_transRec.type == "inventoryadjustment"){
                location = _transRec.getSublistValue("inventory", "location", 0);

                //Tạo số chứng từ cho field IF nếu Adjust Qty. By ở LINE ĐẦU TIÊN bé hơn 0
                isValid = validateCounterFulfill_IA(_transRec);
            }
            else if(_transRec.type == "itemfulfillment"){
                location = _transRec.getSublistValue("item", "location", 0);
                isValid = true;
            }
            else if(_transRec.type == "invoice"){
                location = _transRec.getValue("location");

                isValid = validateCounterFulfill_Invoice(_transRec);
            }
            else if(_transRec.type == "workordercompletion"){
                location = _transRec.getValue("location");

                isValid = true;
            }
            else if(_transRec.type == "inventorytransfer"){
                location = _transRec.getValue("location");

                isValid = true;
            }

            if(!isValid) return objRes;
            
            let objInvDocNumber = getFirstInvDocNumber(location);
            if(!objInvDocNumber) return objRes;

            let trandate =  _transRec.getValue('trandate');
            let mmyy = constFormat.getMM(trandate) + constFormat.getYY(trandate);

            objRes.custrecord_scv_idn_fulfill_counter = objInvDocNumber.custrecord_scv_idn_fulfill_counter + 1;

            objRes.custbody_scv_if_doc_number = objInvDocNumber.custrecord_scv_inv_doc_fullfill + "_" + objRes.custrecord_scv_idn_fulfill_counter;

            _transRec.setValue('custbody_scv_if_doc_number', objRes.custbody_scv_if_doc_number);

            submitFields_FulfillCounter(objInvDocNumber.internalid, objRes.custrecord_scv_idn_fulfill_counter);

            return objRes;
        }

        const getFirstInvDocNumber = (_location) =>{
            if(!_location) return null;

            let arrResult = getDataSource(search.createFilter({
                name: 'custrecord_scv_inv_doc_location', 
                operator: "anyof", 
                values: _location
            }));

            return arrResult.length > 0 ? arrResult[0] : null;
        }

        const validateCounterReceipt_IA = (_transRec) =>{
            let sizeLine = _transRec.getLineCount("inventory");

            let isAdjustQtyby = false;
            for (let i = 0; i < sizeLine; i++) {
                let adjustqtyby = _transRec.getSublistValue("inventory", "adjustqtyby", i);
                if (adjustqtyby > 0){
                    isAdjustQtyby = true;

                    break;
                }
            }

            return isAdjustQtyby;
        }

        const validateCounterFulfill_IA = (_transRec) =>{
            let sizeLine = _transRec.getLineCount("inventory");

            let isAdjustQtyby = false;
            for (let i = 0; i < sizeLine; i++) {
                let adjustqtyby = _transRec.getSublistValue("inventory", "adjustqtyby", i);
                if (adjustqtyby < 0){
                    isAdjustQtyby = true;

                    break;
                }
            }

            return isAdjustQtyby;
        }

        const validateCounterReceipt_VendorBill = (_transRec) =>{
            let sizeLine = _transRec.getLineCount("item");

            //1.Nếu Item.type là Assembly hoặc Inventory hoặc Lot Assembly hoặc Lot Inventory thì sẽ sinh số
            let arrItemId = [];
            for (let i = 0; i < sizeLine; i++) {
                let item = _transRec.getSublistValue("item", "item", i);

                arrItemId.push(item);
            }

            let arrItemValid = constItem.getDataQueryItems({item: arrItemId, itemtype: ["Assembly", "InvtPart"]});
            if(arrItemValid.length == 0) return false;

            //2.Chỉ có thêm điều kiện là nếu related PO có rồi, thì ko sinh chứng từ
            if(!!_transRec.id){
                let resultSearchApplied = constSearch.createSearchWithFilter({
                    type: "vendorbill",
                    filters:
                    [
                        ["type","anyof","VendBill"], 
                        "AND", 
                        ["mainline","is","F"], 
                        "AND", 
                        ["taxline","is","F"],
                        "AND", 
                        ["appliedtotransaction","noneof","@NONE@"],
                        "AND", 
                        ["internalid","anyof", _transRec.id],
                    ],
                    columns:
                    [
                        "internalid",
                    ]
                });
                let arrResCreatedFromPO = resultSearchApplied.run().getRange(0, 100);
                if(arrResCreatedFromPO.length > 0) return false;
            }

            return true;
        }

        const validateCounterFulfill_Invoice = (_transRec) =>{
            let relatedRecord = _transRec.getValue('createdfrom');
            if(!!relatedRecord) return false;

            let sizeLine = _transRec.getLineCount("item");

            let arrItemId = [];
            for (let i = 0; i < sizeLine; i++) {
                let item = _transRec.getSublistValue("item", "item", i);

                arrItemId.push(item);
            }

            let arrItemValid = constItem.getDataQueryItems({item: arrItemId, itemtype: ["Assembly", "InvtPart"]});
            if(arrItemValid.length == 0) return false;

            return true;
        }

        const submitFields_ReceiptCounter = (_id, _counter) =>{
            record.submitFields({
                type: 'customrecord_scv_inv_doc_number',
                id: _id,
                values: {
                    'custrecord_scv_idn_receipt_counter': _counter,
                },
                options: {
                    ignoreMandatoryFields: true
                }
            });
        }

        const submitFields_FulfillCounter = (_id, _counter) =>{
            record.submitFields({
                type: 'customrecord_scv_inv_doc_number',
                id: _id,
                values: {
                    'custrecord_scv_idn_fulfill_counter': _counter,
                },
                options: {
                    ignoreMandatoryFields: true
                }
            });
        }

        

        return {
            TYPE,
            FIELD,
            SUBLIST,
            RECORDS,
            getDataSource,
            updateCounter
        };
        
    });
    