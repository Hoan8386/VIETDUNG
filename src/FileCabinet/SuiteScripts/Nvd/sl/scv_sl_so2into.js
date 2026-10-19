/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  27 Feb 2025         Huy Pham			    Init, create file, Nút Tạo Intercompany Transfer Order từ SO, from ms.Ngọc(https://app.clickup.com/t/86cy2vkkk)
 *  28 Feb 2025         Huy Pham			    Update mapping, from ms.Ngọc(https://app.clickup.com/t/86cy2vkkk?comment=90160095207222) 
 *  12 Mar 2025         Huy Pham			    Thay đổi Sub + location nhập, from ms.Ngọc(https://app.clickup.com/t/86cy2vkkk?comment=90160097408858)   
 */
/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/redirect', 'N/runtime', 'N/search', 'N/record',
    '../lib/scv_lib_function.js', 
    '../olib/alasql/alasql.min@1.7.3.js', 

    '../cons/scv_cons_format.js',
    '../cons/scv_cons_datastore.js',
    '../cons/scv_cons_form.js',

    '../cons/scv_cons_location.js',
    '../cons/scv_cons_ordertype.js',
    '../cons/scv_cons_approvalstatus.js',

    '../cons/scv_cons_search_create_nwo_from_nso.js',
],
    
    (redirect, runtime, search, record,
        lbf, 
        alasql,

        constFormat,
        constDataStore,
        constForm,

        constLocation,
        constOrderType,
        constApprStatus,

        constSearchCreateNWOFromNSO_SS01
    ) => {
        const CUR_SCRIPT = {
            ID: "customscript_scv_sl_so2into",
            DEPLOYID_UI: "customdeploy_scv_sl_so2into",
            DEPLOYID_DATA: "customdeploy_scv_sl_so2into_svc"
        }
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            constForm.setRequest(scriptContext.request);
            constForm.setResponse(scriptContext.response);
            constForm.setServiceScript(CUR_SCRIPT.ID, CUR_SCRIPT.DEPLOYID_DATA);

            let request = scriptContext.request;
            let params = request.parameters;
    
            let curScript = runtime.getCurrentScript();

            if(curScript.deploymentId == CUR_SCRIPT.DEPLOYID_DATA){
                let objResponse = {data: []};
                
				switch(params.action){
                    case "getDataSourceLocation":
						objResponse.data = getDataSourceLocation(params);
						break;
                    case "getDataSourceLocationIn":
						objResponse.data = getDataSourceLocationIn(params);
						break;
				}

                constForm.write(objResponse);
            }
            else{
                if(request.method == "GET"){
                    onCreateFormUI(params);
    
                    constForm.writePage();
                }
                else{
                    let objParams = {
                        custpage_transaction: params.custpage_transaction,
                        custpage_def_subsidiary: params.custpage_def_subsidiary,
                        custpage_def_location: params.custpage_def_location,
                        custpage_def_crtdt: params.custpage_def_crtdt,
                        custpage_def_subsidiaryin: params.custpage_def_subsidiaryin,
                        custpage_def_locationin: params.custpage_def_locationin,
                    }
    
                    createInTO(objParams);

                    redirect.toSuitelet({
                        scriptId: curScript.id,
                        deploymentId: curScript.deploymentId,
                        parameters: {
                            ...objParams,
                            isCompeleted: "T"
                        }
                    });
                }
            }
        }

        const onCreateFormUI = (_params) =>{
            constForm.createForm({title: "Tạo yêu cầu mua hàng nội bộ", hideNavBar: true}, '../cs/scv_cs_sl_so2into.js');
            if(_params.isCompeleted == "T") return;

            constForm.addPageLink([
                constSearchCreateNWOFromNSO_SS01.ID
            ], true);

            constForm.addSubmitButton({label: "Tạo YCĐCNB"});
            constForm.addButton({id: "custpage_btn_cancel", label: "Hủy", functionName: "cancelPopup()"});

            let arrResult = getDataSource(_params);

            if(arrResult.length > 0){
                _params.custpage_def_locationin = arrResult[0].custpage_col_locationin;

                if(!_params.custpage_def_subsidiaryin){
                    _params.custpage_def_subsidiaryin = arrResult[0].subsidiary;
                }
            }
            
            //#region Fields Header: Filters
            let mainGrp = constForm.addFieldGroup({id: "fieldgrp_main", label: "Bộ lọc"});

            constForm.addField({
                id: 'custpage_transaction',
                type: "select",
                source: "transaction",
                label: 'Transaction',
                container: mainGrp.id
            }, true, {
                displayType: "hidden",
                defaultValue: _params?.custpage_transaction
            });
            //#endregion

            //#region  Fields Header: Default Value Create
            let defaultGrp = constForm.addFieldGroup({id: "fieldgrp_default", label: "Thông tin mặc định khi tạo yêu cầu"});

            let arrResultLocation = getDataSourceLocation(_params);
            constDataStore.setDataStore("arrResultLocation", arrResultLocation);


            let arrResultLocationIn = getDataSourceLocationIn(_params);
            constDataStore.setDataStore("arrResultLocationIn", arrResultLocationIn);

            constForm.addField({
                id: 'custpage_def_subsidiary',
                type: "select",
                source: "subsidiary",
                label: 'Công ty xuất hàng',
                container: defaultGrp.id
            }, true, {
                defaultValue: _params?.custpage_def_subsidiary
            });

            constForm.addField({
                id: 'custpage_def_location',
                type: "select",
                label: 'Kho xuất',
                container: defaultGrp.id
            }, false, {
                lookup: {
                    data: arrResultLocation,
                    valueExpr: "internalid",
                    displayExpr: "name"
                },
                defaultValue: _params?.custpage_def_location
            });

            constForm.addField({
                id: 'custpage_def_crtdt',
                type: "date",
                label: 'Ngày tạo',
                container: defaultGrp.id
            }, false, {
                layoutType: "startrow",
                defaultValue: !!_params.custpage_def_crtdt ? _params.custpage_def_crtdt : new Date()
            });

            constForm.addField({
                id: 'custpage_def_subsidiaryin',
                type: "select",
                source: "subsidiary",
                label: 'Công ty nhập hàng',
                container: defaultGrp.id
            }, true, {
                defaultValue: _params?.custpage_def_subsidiaryin
            });

            constForm.addField({
                id: 'custpage_def_locationin',
                type: "select",
                label: 'Kho nhập',
                container: defaultGrp.id
            }, false, {
                lookup: {
                    data: arrResultLocationIn,
                    valueExpr: "internalid",
                    displayExpr: "name"
                },
                defaultValue: _params?.custpage_def_locationin
            });
            //#endregion

            let resultSublist = constForm.addSublist({
                id : "custpage_sl_result",
                type : "list",
                label : 'Result'
            });
            resultSublist.addMarkAllButtons();

            onCreateSublistColumn("custpage_sl_result", resultSublist);
            
            constForm.setDataOfSublist("custpage_sl_result", arrResult);

        }

        const onCreateSublistColumn = (_sublistId, _sublist) => {
            let arrColumn = getColumnOfSublist();

            constForm.addFieldOfSublist(_sublistId, arrColumn);
        }

        const getColumnOfSublist = () =>{
            let arrResultLocation = constDataStore.getDataStore("arrResultLocation")||[];
            let arrResultLocationIn = constDataStore.getDataStore("arrResultLocationIn")||[];

            return [
                {id: "custpage_col_chk", label: "Chọn", type: "checkbox", displayType: "entry"},
                {id: "custpage_col_item", label: "Sản phẩm", type: "select", source: "item"},
                {id: "custpage_col_unit", label: "Đơn vị tính", type: "text"},
                {id: "custpage_col_serialcode", label: "Seri màu", type: "text"},
                {id: "custpage_col_quantity", label: "Số lượng *", type: "float", displayType: "entry"},
                {
                    id: "custpage_col_location", label: "Kho xuất", type: "select", displayType: "entry",
                    displaySize: {width: 300, height : 60},
                    lookup: {
                        data: arrResultLocation,
                        valueExpr: "internalid",
                        displayExpr: "name"
                    },
                },
                {
                    id: "custpage_col_locationin", label: "Kho nhập", type: "select", displayType: "entry",
                    displaySize: {width: 300, height : 60},
                    lookup: {
                        data: arrResultLocationIn,
                        valueExpr: "internalid",
                        displayExpr: "name"
                    },
                },
                {id: "custpage_col_orilineid", label: "Ori line ID", type: "text"},
                {id: "custpage_col_transferlocation", label: "transfer Location ID", type: "text", displayType: "hidden"},
                {id: "custpage_col_expshipdt", label: "Expected Ship Date", type: "text", displayType: "hidden"},
                {id: "custpage_col_unit_id", label: "Unit ID", type: "text", displayType: "hidden"},
            ];
        }

        const getDataSource = (_params) =>{
            if(!_params.custpage_transaction) return [];

            let transRec = record.load({
                type: lbf.getTranRecordType(_params.custpage_transaction), 
                id: _params.custpage_transaction,
                isDynamic: true
            });
            
            let itemSublistId = "item";
            let sizeItemSublist = transRec.getLineCount(itemSublistId);

            let arrResult = [];
            for(let i = 0; i < sizeItemSublist; i++){
                let objRes = {
                    custpage_col_chk: "T",
                    custpage_col_item: transRec.getSublistValue(itemSublistId, "item", i),
                    custpage_col_unit: transRec.getSublistValue(itemSublistId, "units_display", i),
                    custpage_col_serialcode: transRec.getSublistValue(itemSublistId, "custcol_scv_qc_serial_code", i),
                    custpage_col_quantity: transRec.getSublistValue(itemSublistId, "quantity", i) * 1,
                    custpage_col_location: "",
                    custpage_col_orilineid: transRec.getSublistValue(itemSublistId, "custcol_scv_ori_lineid", i),
                    custpage_col_transferlocation: transRec.getSublistValue(itemSublistId, "location", i),
                    custpage_col_expshipdt: transRec.getSublistText(itemSublistId, "custcol_scv_so_expected_delivery", i)||"",
                    custpage_col_unit_id: transRec.getSublistValue(itemSublistId, "units", i),
                    custpage_col_locationin: transRec.getSublistValue(itemSublistId, "location", i),
                    subsidiary: transRec.getValue("subsidiary")
                };

                arrResult.push(objRes);
            }
            
            return arrResult;
        }

        const getDataSourceLocation = (_params) =>{
            let arrResult = [];

            if(!!_params.custpage_def_subsidiary){
                arrResult = constLocation.getDataSource([
                    search.createFilter({
                        name: 'subsidiary', 
                        operator: "anyof", 
                        values: _params.custpage_def_subsidiary
                    })
                ]);
            }

            return arrResult;
        }

        const getDataSourceLocationIn = (_params) =>{
            let arrResult = [];

            if(!!_params.custpage_def_subsidiaryin){
                arrResult = constLocation.getDataSource([
                    search.createFilter({
                        name: 'subsidiary', 
                        operator: "anyof", 
                        values: _params.custpage_def_subsidiaryin
                    })
                ]);
            }

            return arrResult;
        }

        const createInTO = (_params) =>{
            if(!_params.custpage_transaction) return [];

            let itemSublistId = "item";

            let transRec = record.load({
                type: lbf.getTranRecordType(_params.custpage_transaction), 
                id: _params.custpage_transaction,
                isDynamic: true
            });

            let relatedTransactionId = transRec.getValue("custbody_scv_related_transaction");
            relatedTransactionId = (relatedTransactionId||"").toString();
            let arrInTOIdCreated = !!relatedTransactionId ? relatedTransactionId.split(",") : [];

            let toSubsidiaryId = _params.custpage_def_subsidiaryin;

            let arrLine = constForm.getDataOfSublist("custpage_sl_result", [
                "custpage_col_item", "custpage_col_unit", "custpage_col_serialcode",
                "custpage_col_quantity", "custpage_col_location", "custpage_col_orilineid",
                "custpage_col_transferlocation", "custpage_col_expshipdt", "custpage_col_unit_id",
                "custpage_col_locationin"
            ], ["custpage_col_chk", "T"]);

            let arrResult = alasql(`SELECT DISTINCT custpage_col_location, custpage_col_locationin FROM ?`, [arrLine]);

            for(let i = 0; i < arrResult.length; i++){
                let objRes = arrResult[i];

                objRes.subsidiary = _params.custpage_def_subsidiary;
                objRes.tosubsidiary = transRec.getValue("subsidiary");
                objRes.trandate = _params.custpage_def_crtdt;
                objRes.custbody_scv_created_transaction = _params.custpage_transaction;
                objRes.cseg_scv_sg_proj = transRec.getValue("cseg_scv_sg_proj");
                objRes.location = objRes.custpage_col_location;
                objRes.transferlocation = objRes.custpage_col_locationin;
                if(!objRes.transferlocation){
                    objRes.transferlocation = objRes.custpage_def_locationin;
                }

                let inTORec = record.create({type: "intercompanytransferorder", isDynamic: true});

                inTORec.setValue('customform', 262);

                lbf.setValueData(inTORec, [
                    "custbody_scv_order_type", "subsidiary",
                    "tosubsidiary", "location",
                    "transferlocation", "custbody_scv_created_transaction",
                    "custbody_scv_approval_status"
                ], [
                    constOrderType.RECORDS.MUA_BAN_NOI_BO.ID, _params.custpage_def_subsidiary,
                    toSubsidiaryId, objRes.custpage_col_location,
                    objRes.transferlocation, _params.custpage_transaction,
                    constApprStatus.RECORDS.OPEN.ID
                ]);
                if(!!_params.custpage_def_crtdt){
                    let trandate = constFormat.parseDate(_params.custpage_def_crtdt);
                    inTORec.setValue("trandate", trandate);
                }

                lbf.setValue(inTORec, transRec, [
                    "custbody_scv_tb_entity_name", "custbody_scv_so_fr",
                    "cseg_scv_sg_proj"
                ], [
                    "entity", "shipaddress",
                    "cseg_scv_sg_proj"
                ])

                let arrItem = arrLine.filter(e => e.custpage_col_location == objRes.custpage_col_location
                    && e.custpage_col_locationin == objRes.custpage_col_locationin
                );
                for(let j = 0; j < arrItem.length; j++){
                    let objItem = arrItem[j];

                    inTORec.selectNewLine(itemSublistId);

                    lbf.setCurrentSublistValueData(inTORec, itemSublistId, [
                        "item", "unit",
                        "custcol_scv_qc_serial_code", "quantity",
                        "custcol_scv_ori_lineid"
                    ], [
                        objItem.custpage_col_item, objItem.custpage_col_unit_id,
                        objItem.custpage_col_serialcode||"", objItem.custpage_col_quantity * 1,
                        objItem.custpage_col_orilineid
                    ]);

                    if(!!objItem.custpage_col_expshipdt){
                        let expshipdt = constFormat.parseDate(objItem.custpage_col_expshipdt);
                        inTORec.setCurrentSublistValue(itemSublistId, "expectedshipdate", expshipdt);
                    }

                    inTORec.commitLine(itemSublistId);
                }

                let inTORecId = inTORec.save({enableSourcing: false, ignoreMandatoryFields: true});

                arrInTOIdCreated.push(inTORecId);
            }
            
            record.submitFields({
                type: transRec.type,
                id: transRec.id,
                values: {
                    custbody_scv_related_transaction: arrInTOIdCreated
                },
                options: {
                    enableSourcing: false, ignoreMandatoryFields : true
                }
            })

            return arrResult;
        }

        return {
            onRequest
        }

    });
