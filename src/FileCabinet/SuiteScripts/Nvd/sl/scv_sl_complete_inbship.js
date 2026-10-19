/**
 * * =======================================================================================
 *  Date                Author                  Description
 *  09 Apr 2025         Khanh Tran	    		Init, create file. Chức năng Cập nhật thông tin trên Inbound Shipment from Ms.Hải(https://app.clickup.com/t/86cyg1m4k)
 *  */
/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record', 'N/redirect', 'N/ui/serverWidget',
],
    (record, redirect, serverWidget,
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
            if(request.method == "GET"){
                let mainForm = onCreateFormUI(params);
                if(params.isSearch == 'T'){
                    let results = getDataRecord(params);
                    renderDataSublist(mainForm.sublist, results);
                }
               
                response.writePage(mainForm.form);
            }else{
                let paramsEntryForm = getObjParams(params.entryformquerystring);
                let arrSl = getDataOfSublist(request);
                let arrUpd = arrSl.filter(e => e.check == 'T');
                let curRec = record.load({
                    type: paramsEntryForm.rectype,
                    id: paramsEntryForm.recid,
                    isDynamic: true
                });
                
                let slItem = 'items';
                let isSave = false;
                let cnt = 0;
                for(let i = 0; i < curRec.getLineCount(slItem); i++){
                    let lineId = curRec.getSublistValue({ sublistId: slItem, fieldId: 'id', line: i});
                    let objUpd = arrUpd.find(item => item.id == lineId);
                    if(!objUpd) continue;
                    curRec.selectLine({ sublistId: slItem, line: i });
                    curRec.setCurrentSublistValue({ sublistId: slItem, fieldId: 'quantityexpected', value: objUpd.sl_da_nhap * 1});
                    curRec.commitLine({ sublistId: slItem });
                    isSave = true;
                    cnt += 1;
                }

                if(isSave){
                    curRec.save({enableSourcing: true, ignoreMandatoryFields: false});
                    if(arrSl.length == cnt){
                        record.submitFields({
                            type: paramsEntryForm.rectype,
                            id: paramsEntryForm.recid,
                            values: {
                                shipmentstatus: 'closed',
                            },
                            options: {
                                enableSourcing: false, ignoreMandatoryFields : true
                            }
                        });
                    }
                }

                redirect.toRecord({
                    type: paramsEntryForm.rectype,
                    id: paramsEntryForm.recid,
                })
            }
        }

        const getDataOfSublist = (request) => {
            let sl = 'custpage_sl_result';
            let arrSl = [];
            let arrColSl = getColSl();
            for(let i = 0; i < request.getLineCount(sl); i++){
                let obj = {};
                arrColSl.forEach(col => {
                    obj[col.id] = request.getSublistValue(sl, 'custpage_col_' + col.id, i)
                });
    
                arrSl.push(obj)
            }

            return arrSl
        } 

        const getObjParams = (entryformquerystring) => {
            let strParams = entryformquerystring.split('&');
            let objParams = {};
            for (let i = 0; i < strParams.length; i++) {
                let arr = strParams[i].split('=');
                objParams[arr[0]] = arr[1];
            }
            return objParams;
        }

        const getDataRecord = (params) => {
            if(!params.recid || !params.rectype) return;
            let curRec = record.load({
                type: params.rectype,
                id: params.recid,
                isDynamic: true
            });

            let slItem = 'items';
            let result = [];
            for(let i = 0; i < curRec.getLineCount(slItem); i++){
                let obj = {};
                obj.sl_can_nhap = curRec.getSublistValue({sublistId: slItem, fieldId: 'quantityexpected', line: i});
                obj.sl_da_nhap = curRec.getSublistValue({sublistId: slItem, fieldId: 'quantityreceived', line: i});
                obj.hhdv = curRec.getSublistText({sublistId: slItem, fieldId: 'shipmentitem', line: i});
                obj.unit = curRec.getSublistText({sublistId: slItem, fieldId: 'unit', line: i});
                obj.id = curRec.getSublistValue({sublistId: slItem, fieldId: 'id', line: i}).toString();
                if(obj.sl_can_nhap == obj.sl_da_nhap) continue;
                result.push(obj);
            }

            return result;
        }

        const getColSl = () => {
            return [
                {id: "check", label: "Check", type: "checkbox", displayType: "entry"},
                {id: "hhdv", label: "Tên HHDV"},
                {id: "unit", label: "Đơn vị tính"},
                {id: "sl_can_nhap", label: "Số lượng cần nhập kho (đã bao gồm dung sai)", type: "float"},
                {id: "sl_da_nhap", label: "Số lượng đã nhập kho", type: "float"},
                {id: "id", label: "ID"}
            ]
        }

        const renderDataSublist = (sl, arrData) => {
            let arrColSl = getColSl();
            arrData.forEach((objData, index) => {
                arrColSl.forEach(col => {
                    let val = objData[col.id];
                    if(val || val === 0) sl.setSublistValue({id: 'custpage_col_' + col.id, line: index, value: val});
                })
            }) 
        }

        const onCreateSublistColumn = (sl) => {
            let arrColumn = getColSl();
            for(let col of arrColumn){
                sl.addField({id: 'custpage_col_' + col.id, type: col.type || 'text', label: col.label, source: col.source || []}).updateDisplayType({displayType: col.displayType || 'inline'})
            }
        }

        const onCreateFormUI = (params) => {
            let mainForm = serverWidget.createForm({title: 'Complete Inbound Shipment'});
            mainForm.clientScriptModulePath = '../cs/scv_cs_sl_complete_inbship.js';
            mainForm.addSubmitButton();
            let custpage_sl_result = mainForm.addSublist({id: 'custpage_sl_result', type: 'list', label: 'Result'});
            custpage_sl_result.addMarkAllButtons();
            onCreateSublistColumn(custpage_sl_result);
            return {form: mainForm, sublist: custpage_sl_result};
        }

        return {onRequest}

    });
