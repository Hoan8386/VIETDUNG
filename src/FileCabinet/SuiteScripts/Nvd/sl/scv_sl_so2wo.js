/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  24 Feb 2025         Huy Pham			    Init, create file, Tạo hàng loạt WO từ SO, from ms.Ngọc(https://app.clickup.com/t/86cy2jttc)
 *  17 Jul 2025         Huy Pham			    thay đổi ưu tiên mặc định value, from ms.Ngọc(https://app.clickup.com/t/86cy2jttc?comment=90160100881530&threadedComment=90160121730509)
 *  23 Jul 2025         Huy Pham			    Điều chỉnh mapping location, từ mr.Trương Minh Phúc(https://app.clickup.com/t/86cy2jttc?comment=90160123954028)
 */
/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/redirect', 'N/runtime', 'N/search', 'N/file',
    '../lib/scv_lib_function.js', '../olib/alasql/alasql.min@1.7.3.js', 

    '../cons/scv_cons_format.js',
    '../cons/scv_cons_cache.js',
    '../cons/scv_cons_datastore.js',
    '../cons/scv_cons_form.js',

    '../cons/scv_cons_subsidiary.js',
    '../cons/scv_cons_queue_job.js',
    '../cons/scv_cons_location.js',
    '../cons/scv_cons_locationtype.js',
    '../cons/scv_cons_ordertype.js',
    '../cons/scv_cons_work_order_type.js',
    '../cons/scv_cons_transaction.js',
    '../cons/scv_cons_saleschannel.js',
    '../cons/scv_cons_workorder.js',

    '../cons/scv_cons_search_create_nwo_from_nso.js',
    '../cons/scv_cons_search_create_nwo_bom.js',
    '../cons/scv_cons_search_create_nwo_bomrevision.js',
    '../cons/scv_cons_search_create_nwo_so.js',
    '../cons/scv_cons_search_create_nwo_item.js',
    '../cons/scv_cons_search_create_nwo_customer.js',
    '../cons/scv_cons_search_create_nwo_requestor.js'
],
    
    (redirect, runtime, search, file,
        lbf, alasql, 

        constFormat,
        constCache,
        constDataStore,
        constForm,

        constSubsidiary,
        constQueueJob,
        constLocation,
        constLocationType,
        constOrderType,
        constWorkOrderType,
        constTransaction,
        constSalesChannel,
        constWorkOrder,

        constSearchCreateNWOFromNSO_SS01,
        constSearchCreateNWOBom_SS02,
        constSearchCreateNWOBomRevision_SS03,
        constSearchCreateNWOSO_SS04,
        constSearchCreateNWOItem_SS05,
        constSearchCreateNWOCustomer_SS06,
        constSearchCreateNWORequestor_SS07
    ) => {
        const CUR_SCRIPT = {
            ID: "customscript_scv_sl_so2wo",
            DEPLOYID_UI: "customdeploy_scv_sl_so2wo",
            DEPLOYID_DATA: "customdeploy_scv_sl_so2wo_svc"
        }
        const JOB_SCRIPT = {
            TYPE: "MAP_REDUCE",
            ID: "customscript_scv_mr_so2wo",
            DEPLOYID: "customdeploy_scv_mr_so2wo",
            PARAMSID: "custscript_scv_mr_so2wo_param"
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

            constQueueJob.setInfoJobScript(JOB_SCRIPT.TYPE, JOB_SCRIPT.ID, JOB_SCRIPT.DEPLOYID, JOB_SCRIPT.PARAMSID);

            let request = scriptContext.request;
            let params = request.parameters;
    
            let curScript = runtime.getCurrentScript();

            if(curScript.deploymentId == CUR_SCRIPT.DEPLOYID_DATA){
                let objResponse = {data: []};
                
				switch(params.action){
                    case "getDataSource_SS02":
						objResponse.data = getDataSource_SS02(params);
						break;
                    case "getDataSource_SS03":
						objResponse.data = getDataSource_SS03(params);
						break;
                    case "getDataSource_SS04":
						objResponse.data = getDataSource_SS04(params);
						break;
                    case "getDataSource_SS05":
                        objResponse.data = getDataSource_SS05(params);
                        break;
                    case "getDataSource_SS06":
						objResponse.data = getDataSource_SS06(params);
						break;
                    case "getDataSource_SS07":
                        objResponse.data = getDataSource_SS07(params);
                        break;
                    case "getDataSourceLocation":
						objResponse.data = getDataSourceLocation(params);
						break;
				}

                constForm.write(objResponse);
            }
            else{
                if(request.method == "GET"){
                    onCreateFormUI(params);

                    let objResCacheMsg = constCache.getDataByUser("msg", true);
                    if(!!objResCacheMsg.data){
                        constForm.addPageInitMessage(objResCacheMsg.data);
                    }
                    if(!!params.queueId){
                        let status_display = search.lookupFields({
                            type: constQueueJob.TYPE,
                            id: params.queueId,
                            columns: "custrecord_scv_queue_job_status"
                        }).custrecord_scv_queue_job_status[0].text;

                        constForm.addPageInitMessage("Queue Job: " + status_display);
                    }
    
                    constForm.writePage();
                }
                else{
                    let objParams = {
                        custpage_subsidiary: params.custpage_subsidiary,
                        custpage_customer: !!params.custpage_customer ? params.custpage_customer.split("\u0005").toString() : "",
                        custpage_requestor: !!params.custpage_requestor ? params.custpage_requestor.split("\u0005").toString() : "",
                        custpage_tranid: !!params.custpage_tranid ? params.custpage_tranid.split("\u0005").toString() : "",
                        custpage_fromdt: params.custpage_fromdt,
                        custpage_todt: params.custpage_todt,
                        custpage_saleschannel: !!params.custpage_saleschannel ? params.custpage_saleschannel.split("\u0005").toString() : "",
                        custpage_item: !!params.custpage_item ? params.custpage_item.split("\u0005").toString() : "",
                        custpage_def_location: params.custpage_def_location,
                        custpage_def_crtdt: params.custpage_def_crtdt,
                        custpage_def_requestdt: params.custpage_def_requestdt,
                        custpage_def_ordertype: params.custpage_def_ordertype,
                    }

                    let arrLine = constForm.getDataOfSublist("custpage_sl_result", [
                        "custpage_col_chk", "custpage_col_transaction", "custpage_col_item_id",
                        "custpage_col_bom", "custpage_col_bomrevison", "custpage_col_location",
                        "custpage_col_workordertype", "custpage_col_requestdt", "custpage_col_note",
                        "custpage_col_ordertype", "custpage_col_crtdt", "custpage_col_orilineid",
                        "custpage_col_tranid", "custpage_col_subsidiary_id", "custpage_col_customer_id",
                        "custpage_col_serialcode", "custpage_col_quantity", "custpage_col_tolerance_min",
                        "custpage_col_tolerance_max"
                    ], ["custpage_col_chk", "T"]);

                    arrLine.forEach(objLine =>{
                        if(!!objParams.custpage_def_location){
                            objLine.custpage_col_location = objParams.custpage_def_location;
                        }
                        if(!!objParams.custpage_def_crtdt){
                            objLine.custpage_col_crtdt = objParams.custpage_def_crtdt;
                        }
                        if(!!objParams.custpage_def_requestdt){
                            objLine.custpage_col_requestdt = objParams.custpage_def_requestdt;
                        }
                        if(!!objParams.custpage_def_ordertype){
                            objLine.custpage_col_ordertype = objParams.custpage_def_ordertype;
                        }
                    });
                    
                    if(arrLine.length <= 10){
                        let arrMsg = [];
                        for(let i = 0; i < arrLine.length; i++){
                            try{
                                let woRecId = constWorkOrder.createWorkOrderBySO(arrLine[i]);

                                let tranid = search.lookupFields({type: "workorder", id: woRecId, columns: ['tranid']}).tranid;

                                let msg_created = arrLine[i].custpage_col_tranid +": Created Worder Order ";
                                msg_created += '<a href="/app/accounting/transactions/transaction.nl?id=' + woRecId + '" target="_blank">' + tranid + '</a>';

                                arrMsg.push(msg_created);
                            }
                            catch(err){
                                log.error("ERROR: Try-Catch: createWorkOrderBySO", err);
                                arrMsg.push("Error: " + err.message);
                            }
                        }
                        constCache.putDataByUser("msg", arrMsg.join("<br/>"));
                    }
                    else{
                        let curUser = runtime.getCurrentUser();

                        let jsonFile = file.create({
                            name: lbf.uuidv4() + "-" + curUser.email + '.json',
                            fileType: "JSON",
                            contents: JSON.stringify({
                                arrLine: arrLine
                            }),
                            folder: 2162
                        });
                        let jsonFileId = jsonFile.save();
        
                        let objParamsInput = {dataFileId: jsonFileId};
        
                        objParams.queueId = constQueueJob.createQueueJobScript(JSON.stringify(objParamsInput));
                        constQueueJob.processQueueJobScript();
                    }

                    redirect.toSuitelet({
                        scriptId: curScript.id,
                        deploymentId: curScript.deploymentId,
                        parameters: {
                            ...objParams
                        }
                    });
                }
            }
        }

        const onCreateFormUI = (_params) =>{
            constForm.createForm("Tạo lệnh sản xuất", '../cs/scv_cs_sl_so2wo.js');

            constForm.addPageLink([
                constSearchCreateNWOFromNSO_SS01.ID, constSearchCreateNWOBom_SS02.ID,
                constSearchCreateNWOBomRevision_SS03.ID, constSearchCreateNWOSO_SS04.ID,
                constSearchCreateNWOItem_SS05.ID, constSearchCreateNWOCustomer_SS06.ID,
                constSearchCreateNWORequestor_SS07.ID
            ], true);

            let objPopupQueue = constQueueJob.getPopupQueueJobStatus(JOB_SCRIPT.ID, JOB_SCRIPT.DEPLOYID);

            constForm.addSubmitButton({label: "Tạo lệnh SX"});
            constForm.addButton({id: "custpage_btn_search", label: "Tìm kiếm", functionName: "onSearchResult()"});
            constForm.addButton({
                id: "custpage_btn_queue", 
                label: "Queue Job", 
                functionName: `openStatusQueue('${objPopupQueue.url}', ${objPopupQueue.width}, ${objPopupQueue.height}, '${objPopupQueue.title}')`
            });

            let curUser = runtime.getCurrentUser();
            
            if(!_params.custpage_subsidiary) _params.custpage_subsidiary = curUser.subsidiary;
            if(!_params.custpage_fromdt){
                _params.custpage_fromdt = constFormat.getBeginOfMonth(new Date());
                _params.custpage_fromdt = constFormat.formatDate(_params.custpage_fromdt);
            }
            if(!_params.custpage_todt){
                _params.custpage_todt = constFormat.getEndOfMonth(new Date());
                _params.custpage_todt = constFormat.formatDate(_params.custpage_todt);
            }

            //#region Fields Header: Filters
            let mainGrp = constForm.addFieldGroup({id: "fieldgrp_main", label: "Bộ lọc"});

            let arrResultTranId = getDataSource_SS04(_params);
            let arrResultItem = getDataSource_SS05(_params);
            let arrResultCustomer = getDataSource_SS06(_params);
            let arrResultRequestor = getDataSource_SS07(_params);

            constDataStore.setDataStore("arrResultItem", arrResultItem);

            constForm.addField({
                id: 'custpage_subsidiary',
                type: "select",
                label: 'Công ty',
                container: mainGrp.id
            }, true, {
                lookup: {
                    data: constSubsidiary.getDataSubsidiaryByUserRole(),
                    valueExpr: "id",
                    displayExpr: "name"
                },
                defaultValue: _params?.custpage_subsidiary
            });

            constForm.addField({
                id: 'custpage_customer',
                type: "multiselect",
                label: 'Khách hàng',
                container: mainGrp.id
            }, false, {
                lookup: {
                    data: arrResultCustomer,
                    valueExpr: "customer_id",
                    displayExpr: "customer"
                },
                defaultValue: !!_params.custpage_customer ? _params.custpage_customer.split(",") : ""
            });

            constForm.addField({
                id: 'custpage_requestor',
                type: "multiselect",
                label: 'Nhân viên kinh doanh',
                container: mainGrp.id
            }, false, {
                lookup: {
                    data: arrResultRequestor,
                    valueExpr: "requestor_id",
                    displayExpr: "requestor_display"
                },
                defaultValue: !!_params.custpage_requestor ? _params.custpage_requestor.split(",") : ""
            });

            constForm.addField({
                id: 'custpage_tranid',
                type: "multiselect",
                label: 'Số đơn hàng',
                container: mainGrp.id
            }, false, {
                lookup: {
                    data: arrResultTranId,
                    valueExpr: "internalid",
                    displayExpr: "tranid"
                },
                defaultValue: !!_params.custpage_tranid ? _params.custpage_tranid.split(",") : ""
            });

            constForm.addField({
                id: 'custpage_fromdt',
                type: "date",
                label: 'Ngày đơn hàng: Từ',
                container: mainGrp.id
            }, true, {
                layoutType: "startrow",
                defaultValue: !!_params.custpage_fromdt ? _params.custpage_fromdt : ""
            });

            constForm.addField({
                id: 'custpage_todt',
                type: "date",
                label: 'Đến',
                container: mainGrp.id
            }, true, {
                helpText: "Ngày đơn hàng: Đến",
                layoutType: "endrow",
                defaultValue: !!_params.custpage_todt ? _params.custpage_todt : ""
            });

            constForm.addField({
                id: 'custpage_saleschannel',
                type: "multiselect",
                source: "customrecord_cseg_scv_sc",
                label: 'Kênh bán hàng',
                container: mainGrp.id
            }, false, {
                defaultValue: !!_params.custpage_saleschannel ? _params.custpage_saleschannel.split(",") : ""
            });

            constForm.addField({
                id: 'custpage_item',
                type: "multiselect",
                label: 'Sản phẩm',
                container: mainGrp.id
            }, false, {
                lookup: {
                    data: arrResultItem,
                    valueExpr: "item_id",
                    displayExpr: "item_display"
                },
                defaultValue: !!_params.custpage_item ? _params.custpage_item.split(",") : ""
            });

            //#endregion

            //#region  Fields Header: Default Value Create
            let defaultGrp = constForm.addFieldGroup({id: "fieldgrp_default", label: "Thông tin mặc định khi tạo Lệnh sản xuất"});

            let arrResultLocation = getDataSourceLocation(_params);
            let arrResultOrderType = getDataSourceOrderType(_params);
            let arrResultWorkOrderType = getDataSourceWorkOrderType(_params);

            constDataStore.setDataStore("arrResultLocation", arrResultLocation);
            constDataStore.setDataStore("arrResultOrderType", arrResultOrderType);
            constDataStore.setDataStore("arrResultWorkOrderType", arrResultWorkOrderType);

            constForm.addField({
                id: 'custpage_def_location',
                type: "select",
                label: 'Kho sản xuất',
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
                defaultValue: !!_params.custpage_def_crtdt ? _params.custpage_def_crtdt : ""
            });

            constForm.addField({
                id: 'custpage_def_requestdt',
                type: "date",
                label: 'Ngày cần hàng',
                container: defaultGrp.id
            }, false, {
                layoutType: "endrow",
                defaultValue: !!_params.custpage_def_requestdt ? _params.custpage_def_requestdt : ""
            });

            constForm.addField({
                id: 'custpage_def_ordertype',
                type: "select",
                label: 'Loại đơn',
                container: defaultGrp.id
            }, false, {
                lookup: {
                    data: arrResultOrderType,
                    valueExpr: "internalid",
                    displayExpr: "name"
                },
                defaultValue: _params?.custpage_def_ordertype
            });
            //#endregion

            let resultSublist = constForm.addSublist({
                id : "custpage_sl_result",
                type : "list",
                label : 'Result'
            });
            resultSublist.addMarkAllButtons();

            let arrResult = [];
            
            if(_params.isSearch == "T"){
                arrResult = getDataSource(_params);
            }

            onCreateSublistColumn("custpage_sl_result", resultSublist);
            
            constForm.setDataOfSublist("custpage_sl_result", arrResult);

        }

        const onCreateSublistColumn = (_sublistId, _sublist) => {
            let arrColumn = getColumnOfSublist();

            constForm.addFieldOfSublist(_sublistId, arrColumn);
        }

        const getColumnOfSublist = () =>{
            let arrResultLocation = constDataStore.getDataStore("arrResultLocation")||[];
            let arrResultOrderType = constDataStore.getDataStore("arrResultOrderType")||[];
            let arrResultWorkOrderType = constDataStore.getDataStore("arrResultWorkOrderType")||[];
            let arrResultBOM = constDataStore.getDataStore("arrResultBOM")||[];
            let arrResultBOMRevision = constDataStore.getDataStore("arrResultBOMRevision")||[];

            return [
                {id: "custpage_col_chk", label: "Chọn", type: "checkbox", displayType: "entry"},
                {id: "custpage_col_tranid", label: "Số đơn hàng", type: "text"},
                {id: "custpage_col_customer", label: "Khách hàng", type: "text"},
                {id: "custpage_col_item", label: "Sản phẩm", type: "text"},
                {id: "custpage_col_unit", label: "Đơn vị tính", type: "text"},
                {id: "custpage_col_serialcode", label: "Seri màu", type: "text"},
                {id: "custpage_col_quantity", label: "Số lượng sản xuất *", type: "float", displayType: "entry"},
                {
                    id: "custpage_col_bom", label: "BOM *", type: "select", displayType: "entry",
                    displaySize: {width: 200, height : 60},
                    lookup: {
                        data: arrResultBOM,
                        valueExpr: "internalid",
                        displayExpr: "name"
                    },
                },
                {
                    id: "custpage_col_bomrevison", label: "BOM Revision*", type: "select", displayType: "entry",
                    displaySize: {width: 200, height : 60},
                    lookup: {
                        data: arrResultBOMRevision,
                        valueExpr: "internalid",
                        displayExpr: "name"
                    },
                },
                {
                    id: "custpage_col_location", label: "Kho sản xuất *", type: "select", displayType: "entry",
                    displaySize: {width: 200, height : 60},
                    lookup: {
                        data: arrResultLocation,
                        valueExpr: "internalid",
                        displayExpr: "name"
                    },
                },
                {
                    id: "custpage_col_workordertype", label: "Loại lệnh sản xuất *", type: "select", displayType: "entry",
                    displaySize: {width: 200, height : 60},
                    lookup: {
                        data: arrResultWorkOrderType,
                        valueExpr: "internalid",
                        displayExpr: "name"
                    },
                },
                {id: "custpage_col_requestdt", label: "Ngày cần hàng", type: "date", displayType: "entry"},
                {id: "custpage_col_note", label: "Ghi chú lệnh SX", type: "text", displayType: "entry"},
                {id: "custpage_col_tolerance_min", label: "Dung sai(-%)", type: "percent", displayType: "entry"},
                {id: "custpage_col_tolerance_max", label: "Dung sai(+%)", type: "percent", displayType: "entry"},
                {
                    id: "custpage_col_ordertype", label: "Loại đơn", type: "select", displayType: "entry",
                    displaySize: {width: 200, height : 60},
                    lookup: {
                        data: arrResultOrderType,
                        valueExpr: "internalid",
                        displayExpr: "name"
                    },
                },
                {id: "custpage_col_crtdt", label: "Ngày tạo", type: "date", displayType: "entry"},
                {id: "custpage_col_orilineid", label: "Ori line ID", type: "text"},
                {id: "custpage_col_transaction", label: "Transaction ID", type: "text", displayType: "hidden"},
                {id: "custpage_col_bom_id", label: "BOM ID", type: "text", displayType: "hidden"},
                {id: "custpage_col_bomrevison_id", label: "BOM Revision ID", type: "text", displayType: "hidden"},
                {id: "custpage_col_item_id", label: "Item ID", type: "text", displayType: "hidden"},
                {id: "custpage_col_subsidiary_id", label: "Subsidiary ID", type: "text", displayType: "hidden"},
                {id: "custpage_col_customer_id", label: "Customer ID", type: "text", displayType: "hidden"},
            ];
        }

        const getDataSource = (_params) =>{
            let arrResTrans_SS01 = getDataSource_SS01(_params);

            let arrItemId = alasql(`SELECT DISTINCT item FROM ?`, [arrResTrans_SS01]).map(e => e.item);

            let arrResBOM_SS02 = getDataSource_SS02({
                ..._params,
                custpage_item: arrItemId.join(",")
            });
            let arrResBOMRevision_SS03 =  getDataSource_SS03(_params);

            let arrResult = [];

            let today = constFormat.getDateTimeWithCurrentGMT(new Date());

            for(let i = 0; i < arrResTrans_SS01.length; i++){
                let objResTrans = arrResTrans_SS01[i];

                let objRes = {
                    custpage_col_chk: "F",
                    custpage_col_tranid: objResTrans.tranid,
                    custpage_col_transaction: objResTrans.internalid,
                    custpage_col_customer: objResTrans.entityid,
                    custpage_col_item: objResTrans.item_display,
                    custpage_col_unit: objResTrans.unit,
                    custpage_col_serialcode: objResTrans.custcol_scv_color_seri,
                    custpage_col_quantity: objResTrans.quantity * 1,
                    custpage_col_bom: "",
                    custpage_col_bomrevison: "",
                    custpage_col_location: objResTrans.default_wo_location || "",
                    custpage_col_workordertype: objResTrans.custcol_scv_wo_type,
                    custpage_col_requestdt: objResTrans.requesteddate,
                    custpage_col_note: objResTrans.custcol_scv_memo_2,
                    custpage_col_tolerance_min: "",
                    custpage_col_tolerance_max: "",
                    custpage_col_ordertype: constOrderType.RECORDS.SX_HANG_KHACH_DAT_NOI_DIA.ID,
                    custpage_col_crtdt: constFormat.formatDate(today),
                    custpage_col_orilineid: objResTrans.custcol_scv_ori_lineid,
                    custpage_col_bom_id: "",
                    custpage_col_bomrevison_id: "",
                    custpage_col_item_id: objResTrans.item,
                    custpage_col_subsidiary_id: objResTrans.subsidiary,
                    custpage_col_customer_id: objResTrans.customer_internalid
                };

                if(objResTrans.cseg_scv_sc == constSalesChannel.RECORDS.XUAT_KHAU.ID){
                    objRes.custpage_col_ordertype = constOrderType.RECORDS.SX_HANG_KHACH_DAT_XUAT_KHAU.ID;
                }

                let arrBOM = arrResBOM_SS02.filter(e => e.assembly == objResTrans.item);
                
                if(arrBOM.length > 0){
                    let objBOMFirst = arrBOM[0];
                    
                    if(arrBOM.length > 1){
                        let objBOMDefault = arrBOM.find(e => e.default == true);
                        if(!!objBOMDefault){
                            objBOMFirst = objBOMDefault;
                        }
                    }

                    objRes.custpage_col_bom = objBOMFirst.internalid;
                    
                    if(!objRes.custpage_col_location){
                        objRes.custpage_col_location = getLocationIdByName(objBOMFirst.locations);
                    }
                }
                objRes.custpage_col_bom_id = objRes.custpage_col_bom;

                if(!!objRes.custpage_col_bom){
                    let objBomRevision = arrResBOMRevision_SS03.find(e => e.bom_internalid == objRes.custpage_col_bom);

                    if(!!objBomRevision){
                        objRes.custpage_col_bomrevison = objBomRevision.internalid;
                    }
                }
                objRes.custpage_col_bomrevison_id = objRes.custpage_col_bomrevison;
                
                arrResult.push(objRes);
            }
            
            return arrResult;
        }

        const getLocationIdByName = (_locationName) =>{
            if(!_locationName) return "";

            let arrResultLocation = constDataStore.getDataStore("arrResultLocation")||[];

            let lstLocationName = _locationName.split(",");

            let locationId = "";

            let objResLocation = arrResultLocation.find(e => e.namenohierarchy.indexOf(lstLocationName[0]) == 0);
            if(!!objResLocation){
                return objResLocation.internalid;
            }

            return locationId;
        }

        const getDataSource_SS01 = (_params) =>{
            let myFilters = [];

            if(!!_params.custpage_subsidiary){
                myFilters.push(search.createFilter({
                    name: 'subsidiary', operator: "anyof", values: _params.custpage_subsidiary
                }));
            }
            if(!!_params.custpage_customer){
                myFilters.push(search.createFilter({
                    name: 'internalid', join: "customer", operator: "anyof", values: _params.custpage_customer.split(",")
                }));
            }
            if(!!_params.custpage_requestor){
                myFilters.push(search.createFilter({
                    name: 'custbody_scv_employee_ycxvt', operator: "anyof", values: _params.custpage_requestor.split(",")
                }));
            }
            if(!!_params.custpage_tranid){
                myFilters.push(search.createFilter({
                    name: 'internalid', operator: "anyof", values: _params.custpage_tranid.split(",")
                }));
            }
            if(_params.custpage_fromdt){
                myFilters.push(search.createFilter({
                    name: 'trandate', operator: 'onorafter', values: _params.custpage_fromdt
                }));
            }
            if(_params.custpage_todt){
                myFilters.push(search.createFilter({
                    name: 'trandate', operator: 'onorbefore', values: _params.custpage_todt
                }));
            }
            if(!!_params.custpage_saleschannel){
                myFilters.push(search.createFilter({
                    name: 'cseg_scv_sc', operator: "anyof", values: _params.custpage_saleschannel.split(",")
                }));
            }
            if(!!_params.custpage_item){
                myFilters.push(search.createFilter({
                    name: 'item', operator: "anyof", values: _params.custpage_item.split(",")
                }));
            }
            
            let arrResult = constSearchCreateNWOFromNSO_SS01.getDataSource(myFilters);

            return arrResult;
        }

        const getDataSource_SS02 = (_params) =>{
            let myFilters = [];

            if(!!_params.custpage_subsidiary){
                myFilters.push(search.createFilter({
                    name: 'formulatext', 
                    formula: `CASE WHEN {subsidiary.id} = ${_params.custpage_subsidiary} OR ({subsidiary.id} = 1 AND {includechildren} = 'T') THEN 'T' ELSE 'F' END`,
                    operator: "is", values: "T"
                }));
            }

            let arrItemId = [];
            if(!!_params.custpage_item){
                arrItemId = _params.custpage_item.split(",");
            }
            else{
                let arrResultItem = constDataStore.getDataStore("arrResultItem")||[];
                if(arrResultItem.length == 0){
                    arrResultItem = getDataSource_SS05(_params);
                }

                arrItemId = arrResultItem.map(e => e.item_id);
            }

            if(arrItemId.length > 0){
                myFilters.push(search.createFilter({
                    name: 'assembly', join: "assemblyItem", operator: "anyof", values: arrItemId
                }));
            }
            
            let arrResult = constSearchCreateNWOBom_SS02.getDataSource(myFilters);

            let arrResultBOM = alasql(`SELECT DISTINCT internalid, name FROM ? ORDER BY name`, [arrResult]);
            constDataStore.setDataStore("arrResultBOM", arrResultBOM);

            return arrResult;
        }

        const getDataSource_SS03 = (_params) =>{
            let myFilters = [];

            let arrBomId = [];
            if(!!_params.bom_id){
                arrBomId = _params.bom_id.split(",");
            }
            else{
                let arrResultBOM = constDataStore.getDataStore("arrResultBOM")||[];
                if(arrResultBOM.length == 0){
                    arrResultBOM = getDataSource_SS02(_params);
                }

                arrBomId = arrResultBOM.map(e => e.internalid);
            }

            if(arrBomId.length > 0){
                myFilters.push(search.createFilter({
                    name: 'billofmaterials', operator: "anyof", values: arrBomId
                }));
            }

            let arrResult = constSearchCreateNWOBomRevision_SS03.getDataSource(myFilters);

            let arrResultBOMRevision = alasql(`SELECT DISTINCT internalid, name FROM ? ORDER BY name`, [arrResult]);
            constDataStore.setDataStore("arrResultBOMRevision", arrResultBOMRevision);

            return arrResult;
        }

        const getDataSource_SS04 = (_params) =>{
            let arrResult = [];

            if(!!_params.custpage_subsidiary){
                arrResult = constSearchCreateNWOSO_SS04.getDataSource(search.createFilter({
                    name: 'subsidiary', 
                    operator: "anyof", 
                    values: _params.custpage_subsidiary
                }));
            }

            return arrResult;
        }

        const getDataSource_SS05 = (_params) =>{
            let arrResult = [];

            if(!!_params.custpage_subsidiary){
                arrResult = constSearchCreateNWOItem_SS05.getDataSource(search.createFilter({
                    name: 'subsidiary', 
                    operator: "anyof", 
                    values: _params.custpage_subsidiary
                }));
            }

            return arrResult;
        }

        const getDataSource_SS06 = (_params) =>{
            let arrResult = [];

            if(!!_params.custpage_subsidiary){
                arrResult = constSearchCreateNWOCustomer_SS06.getDataSource(search.createFilter({
                    name: 'subsidiary', 
                    operator: "anyof", 
                    values: _params.custpage_subsidiary
                }));
            }

            return arrResult;
        }

        const getDataSource_SS07 = (_params) =>{
            let arrResult = [];

            if(!!_params.custpage_subsidiary){
                arrResult = constSearchCreateNWORequestor_SS07.getDataSource(search.createFilter({
                    name: 'subsidiary', 
                    operator: "anyof", 
                    values: _params.custpage_subsidiary
                }));
            }

            return arrResult;
        }

        const getDataSourceLocation = (_params) =>{
            let arrResult = [];

            if(!!_params.custpage_subsidiary){
                arrResult = constLocation.getDataSource([
                    search.createFilter({
                        name: 'subsidiary', 
                        operator: "anyof", 
                        values: _params.custpage_subsidiary
                    }),
                    search.createFilter({
                        name: 'custrecord_scv_loc_type',
                        operator: "anyof",
                        values: constLocationType.RECORDS.SANXUAT.ID
                    }),
                ]);
            }

            return arrResult;
        }

        const getDataSourceOrderType = (_params) =>{
            let arrResult = constOrderType.getDataSource([
                search.createFilter({
                    name: 'custrecord_scv_app_trans_type',
                    operator: "anyof",
                    values: [
                        constTransaction.RECORDS.WORK_ORDER.ID,
                        constTransaction.RECORDS.OTHER_WORK_OTHER.ID
                    ]
                }),
            ]);

            return arrResult;
        }

        const getDataSourceWorkOrderType = (_params) =>{
            let arrResult = [];

            if(!!_params.custpage_subsidiary){
                arrResult = constWorkOrderType.getDataSource([
                    search.createFilter({
                        name: 'custrecord_scv_wot_subsidiary', 
                        operator: "anyof", 
                        values: _params.custpage_subsidiary
                    })
                ]);
            }

            return arrResult;
        }
        
        return {
            onRequest
        }

    });
