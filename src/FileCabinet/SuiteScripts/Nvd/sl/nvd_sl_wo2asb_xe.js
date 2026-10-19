/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  05 Feb 2025         Huy Pham			    Init, create file, Thống kê tiêu hao hàng loạt, from mr.Bính(https://app.clickup.com/t/86cxwt5k9)
 *  17 Feb 2025         Huy Pham                Bổ sung chức năng, from mr.Việt(https://app.clickup.com/t/86cxwt5k9?comment=90160092309501) 
 *  17 Mar 2025         Huy Pham                Bổ sung field mapping (user create + shift mobile), from mr.Việt(https://app.clickup.com/t/86cxwt5k9?comment=90160098112235)
 *  18 Mar 2025         Huy Pham                Thêm validate clear data cache
 *  23 Sep 2026         NVD (Duy)               Tách thành script riêng nvd_sl_wo2asb_xe.js (để chung folder Nvd/sl với bản SCV), script id customscript_nvd_sl_wo2asb_xe; không đụng bản SCV
 *  01 Oct 2026         NVD (Duy)               Nhóm xẻ: Issued Qty mặc định ở bước 3 = Σ Built Qty cuộn con của OWO (thay cho Built × custcol_scv_bom_std_qty bị ghi sai), NACP.2 = 0
 *  25 Sep 2026         NVD (Duy)               Đổi tiêu đề màn hình thành "Thống kê tiêu hao hàng loạt - Xẻ"
 *  08 Sep 2026         NVD (Duy)               WO xẻ (type 7): tách nhóm tiêu hao ở bước 3 theo OWO (custbody_scv_created_transaction; fallback Số thống kê SX + tháng) - 1 OWO = 1 lô cuộn mẹ -> mỗi cuộn con chỉ tiêu hao từ cuộn mẹ sinh ra nó
 *  07 Sep 2026         NVD (Duy)               WO loại "Xẻ nhôm, Xẻ tôn" (custbody_scv_work_order_type = 7): (1) cơ sở chia tiêu hao = kg cân thực (Built Qty) vì 1 kg con = 1 kg mẹ, dùng với BOM chung "BOM WO khác.HN"; (2) chia mỗi lô NVL về mọi WO theo tỷ lệ thay vì rót lần lượt
 */
/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/runtime', 'N/search', 'N/record', 'N/file',
    '../lib/scv_lib_function.js', '../olib/alasql/alasql.min@1.7.3',

    '../cons/scv_cons_format.js',
    '../cons/scv_cons_record.js',
    '../cons/scv_cons_datastore.js',
    '../cons/scv_cons_form.js',
    '../cons/scv_cons_user.js',
    '../cons/scv_cons_assemblybuild.js',
    '../cons/scv_cons_queue_job.js',
    '../cons/scv_cons_location.js',
    '../cons/scv_cons_subsidiary.js',
    '../cons/scv_cons_entitygroup.js',
    '../cons/scv_cons_locationtype.js',
    '../cons/scv_cons_err_file.js',

    '../cons/scv_cons_search_wo_for_completion_hdr.js',
    '../cons/scv_cons_search_wo_for_completion_det.js',
    '../cons/scv_cons_search_mfg_lot.js'
],
    
    (runtime, search, record, file,
        lbf, alasql,

        constFormat,
        constRecord,
        constDataStore,
        constForm,
        constUser,
        constAssemblyBuild,
        constQueueJob,
        constLocation,
        constSubsidiary,
        constEntityGroup,
        constLocationType,
        constErrFile,

        constSearchWOForCompletionHdr,
        constSearchWOForCompletionDet,
        constSearchMfgLot
    ) => {
        const STEP_ACTION = {
            LOAD_DATA: {
                ID: 0,
                NAME: "Lấy dữ liệu"
            },
            INPUT_WO: {
                ID: 1,
                NAME: "Thống kê thành phẩm"
            },
            INPUT_COMPONENT: {
                ID: 2,
                NAME: "Thống kê tiêu hao"
            },
            VIEW_RESULT: {
                ID: 3,
                NAME: "Hoàn thành"
            }
        }
        // NVD: script record + 2 deployment riêng, tách khỏi bản SCV (customscript_scv_sl_wo2asb)
        const CUR_SCRIPT = {
            ID: "customscript_nvd_sl_wo2asb_xe",
            DEPLOYID_UI: "customdeploy_nvd_sl_wo2asb_xe",
            DEPLOYID_DATA: "customdeploy_nvd_sl_wo2asb_xe_svc"
        }
        
        const JOB_SCRIPT = {
            TYPE: "MAP_REDUCE",
            ID: "customscript_scv_mr_wo2asb",
            DEPLOYID: "customdeploy_scv_mr_wo2asb",
            PARAMSID: "custscript_scv_mr_wo2asb_param"
        }

        // === XE CUON: WO type "Xẻ nhôm, Xẻ tôn" (customrecord_scv_work_order_type) ===
        const SLITTING_WO_TYPE_IDS = ["7"];
        // XE CUON: item danh nghĩa của BOM chung "BOM WO khác.HN" (NACP.2) -> Issued Qty mặc định 0
        const NOMINAL_BOM_ITEM_IDS = ["26511"];

        /**
         * Map WO internalid -> custbody_scv_work_order_type (1 search cho cả lượt submit)
         */
        const getWOTypeMap = (arrWOId) => {
            let objMap = {};
            let arrIds = [...new Set((arrWOId || []).filter(e => !!e).map(e => String(e)))];
            if (arrIds.length == 0) return objMap;

            search.create({
                type: search.Type.WORK_ORDER,
                filters: [
                    ["internalid", "anyof", arrIds],
                    "AND", ["mainline", "is", "T"]
                ],
                columns: ["internalid", "custbody_scv_work_order_type", "custbody_scv_created_transaction"]
            }).run().each(rs => {
                objMap[String(rs.getValue("internalid"))] = {
                    wotype: String(rs.getValue("custbody_scv_work_order_type") || ""),
                    owo: String(rs.getValue("custbody_scv_created_transaction") || "")
                };
                return true;
            });

            return objMap;
        };

        const getWOType = (objWOTypeMap, woId) => {
            let obj = objWOTypeMap[String(woId)];
            return obj ? String(obj.wotype || "") : "";
        };

        /**
         * XE CUON: khóa nhóm phụ cho WO xẻ = Số thống kê SX + ngày WO (1 OWO = 1 lô cuộn mẹ).
         * WO không phải type 7 -> "" (không tách nhóm, giữ nguyên hành vi cũ).
         */
        const getSlitGroupKey = (objWO, objWOTypeMap) => {
            if(!objWO) return "";
            let objInfo = objWOTypeMap[String(objWO.custpage_col_wo_id)] || {};
            if(SLITTING_WO_TYPE_IDS.indexOf(String(objInfo.wotype || "")) == -1) return "";
            // OWO id (custbody_scv_created_transaction) là khóa chính xác; thiếu thì dùng Số thống kê SX + tháng
            if(!!objInfo.owo) return "OWO" + objInfo.owo;
            return String(objWO.custpage_col_thongkesx || "") + "|" + getMonthKeyOfDate(objWO.custpage_col_date);
        };

        /**
         * XE CUON: Số thống kê SX lặp lại theo tháng -> khóa tháng "yyyy-mm" từ ngày WO (chuỗi dd/mm/yyyy hoặc mm/dd/yyyy theo format account).
         * Không tách được thì trả nguyên chuỗi ngày.
         */
        const getMonthKeyOfDate = (strDate) => {
            let str = String(strDate || "").trim();
            let arrPart = str.split(/[^0-9]+/).filter(e => !!e);
            if(arrPart.length == 3 && arrPart[2].length == 4){
                return arrPart[2] + "-" + arrPart[1].padStart(2, "0");
            }
            if(arrPart.length == 3 && arrPart[0].length == 4){
                return arrPart[0] + "-" + arrPart[1].padStart(2, "0");
            }
            return str;
        };

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

            constDataStore.initModulServer({file});

            constQueueJob.setInfoJobScript(JOB_SCRIPT.TYPE, JOB_SCRIPT.ID, JOB_SCRIPT.DEPLOYID, JOB_SCRIPT.PARAMSID);

            let request = scriptContext.request;
            let params = request.parameters;
            let curScript = runtime.getCurrentScript();
    
            if(!!params.custpage_externalid){
                constForm.setMainKeyInventoryDetail("INVENTORYDETAIL_" + params.custpage_externalid);
            }

            if(curScript.deploymentId == CUR_SCRIPT.DEPLOYID_DATA){
                let objResponse = {data: []};
                
				switch(params.action){
                    case "writeCacheData":
						objResponse.data = writeCacheData(params);
						break;
                    case "readCacheData":
                        objResponse.data = readCacheData(params);
                        break;
                    case "createAssemblyFromWO":
                        objResponse.data = createAssemblyFromWO(JSON.parse(params.body));
                        break;
				}

                constForm.write(objResponse);
            }
            else{
                if(request.method == "GET"){
                    params.custpage_currentstep = params.custpage_currentstep||STEP_ACTION.LOAD_DATA.ID;
    
                    onCreateFormUI(params);
    
                    if(params.custpage_currentstep == STEP_ACTION.LOAD_DATA.ID){
                        onCreateFormUI_LoadData(params);
                    }
                    else if(params.custpage_currentstep == STEP_ACTION.INPUT_WO.ID){
                        onCreateFormUI_InputWO(params);
                    }
                    else if(params.custpage_currentstep == STEP_ACTION.INPUT_COMPONENT.ID){
                        onCreateFormUI_InputComponent(params);
                    }
                    else if(params.custpage_currentstep == STEP_ACTION.VIEW_RESULT.ID){
                        onCreateFormUI_ViewResult(params);
                    }
    
                    constForm.writePage();
                }
            }
        }

        const onCreateFormUI = (_params) =>{
            let title = "Thống kê tiêu hao hàng loạt - Xẻ: ";
            let readOnly = true;
            if(_params.custpage_currentstep == STEP_ACTION.LOAD_DATA.ID){
                title += STEP_ACTION.LOAD_DATA.NAME + "(Step 1/3)";

                readOnly = false;

                if(_params.isSearch != "T"){
                    let today = constFormat.getDateTimeWithCurrentGMT(new Date());
                    if(!_params.custpage_fromdt) _params.custpage_fromdt = constFormat.getBeginOfMonth(today);
                    if(!_params.custpage_todt) _params.custpage_todt = constFormat.getEndOfMonth(today);
                }
            }
            else if(_params.custpage_currentstep == STEP_ACTION.INPUT_WO.ID){
                title += STEP_ACTION.INPUT_WO.NAME + "(Step 2/3)";
            }
            else if(_params.custpage_currentstep == STEP_ACTION.INPUT_COMPONENT.ID){
                title += STEP_ACTION.INPUT_COMPONENT.NAME + "(Step 3/3)";
            }
            else if(_params.custpage_currentstep == STEP_ACTION.VIEW_RESULT.ID){
                title += STEP_ACTION.VIEW_RESULT.NAME;
            }

            constForm.createForm(title, '../cs/scv_cs_sl_wo2asb.js');
            constForm.addPageLink([
                constSearchWOForCompletionHdr.ID, constSearchWOForCompletionDet.ID,
                constSearchMfgLot.ID
            ], true);

            let curUser = runtime.getCurrentUser();

            if(!_params.custpage_subsidiary){
                _params.custpage_subsidiary = curUser.subsidiary;
            }

            if(!!_params.custpage_externalid){
                let objParamsCache = readCacheData(_params, "params");
                if(!!objParamsCache){
                    _params.custpage_subsidiary = objParamsCache.custpage_subsidiary;
                    _params.custpage_location = objParamsCache.custpage_location;
                    _params.custpage_workcenter = objParamsCache.custpage_workcenter;
                    _params.custpage_fromdt = objParamsCache.custpage_fromdt;
                    _params.custpage_todt = objParamsCache.custpage_todt;
                    _params.custpage_prod_lotno = objParamsCache.custpage_prod_lotno;
                    _params.custpage_item = objParamsCache.custpage_item;
                    _params.custpage_qc_serial = objParamsCache.custpage_qc_serial;
                }
            }

            //#region Field Hidden
            constForm.addField({
                id: 'custpage_currentstep',
                type: "text",
                label: 'Current Step'
            }, false, {
                displayType: "hidden",
                defaultValue: !!_params.custpage_currentstep ? _params.custpage_currentstep : STEP_ACTION.LOAD_DATA.ID
            });

            constForm.addField({
                id: 'custpage_externalid',
                type: "text",
                label: 'Extnernal ID'
            }, false, {
                displayType: "hidden",
                defaultValue: !!_params.custpage_externalid  ? _params.custpage_externalid : lbf.uuidv4()
            });
            //#endregion

            let mainGrp = constForm.addFieldGroup({id: "fieldgrp_main", label: "Filter Parameters"});

            let custpage_subsidiary = constForm.addField({
                id: 'custpage_subsidiary',
                type: "select",
                label: 'Subsidiary',
                container: mainGrp.id
            }, true, {
                displayType: readOnly ? "inline" : "entry"
            });
            constSubsidiary.initLoadFieldSubsidiaryByUserRole(custpage_subsidiary);
            custpage_subsidiary.defaultValue = !!_params.custpage_subsidiary  ? _params.custpage_subsidiary : ""

            let custpage_location = constForm.addField({
                id: 'custpage_location',
                type: "select",
                label: 'Location',
                container: mainGrp.id
            }, true,{
                displayType: readOnly ? "inline" : "entry",
            });
            loadFieldDataLocation(custpage_location, _params.custpage_subsidiary);
            custpage_location.defaultValue =  !!_params.custpage_location ? _params.custpage_location : "";

            let custpage_workcenter = constForm.addField({
                id: 'custpage_workcenter',
                type: "select",
                //source: "-8",
                label: 'Work Center',
                container: mainGrp.id
            }, false, {
                displayType: readOnly ? "inline" : "entry"
            });
            loadFieldDataWorkCenter(custpage_workcenter, _params.custpage_location);
            custpage_workcenter.defaultValue =  !!_params.custpage_workcenter ? _params.custpage_workcenter : "";

            constForm.addField({
                id: 'custpage_fromdt',
                type: "date",
                label: 'From Date',
                container: mainGrp.id
            }, true, {
                layoutType: "startrow",
                displayType: readOnly ? "inline" : "entry",
                defaultValue: !!_params.custpage_fromdt ? _params.custpage_fromdt : ""
            });

            constForm.addField({
                id: 'custpage_todt',
                type: "date",
                label: 'To Date',
                container: mainGrp.id
            }, true, {
                layoutType: "endrow",
                displayType: readOnly ? "inline" : "entry",
                defaultValue: !!_params.custpage_todt ? _params.custpage_todt : ""
            });

            let custpage_prod_lotno = constForm.addField({
                id: 'custpage_prod_lotno',
                type: "multiselect",
                label: 'Prod Lot No',
                container: mainGrp.id
            }, false, {
                breakType : "startcol",
                displayType: readOnly ? "inline" : "entry"
            });
            loadFieldDataProdLot(custpage_prod_lotno);
            custpage_prod_lotno.defaultValue = !!_params.custpage_prod_lotno  ? _params.custpage_prod_lotno.split(",") : ""

            constForm.addField({
                id: 'custpage_qc_serial',
                type: "text",
                label: 'Số QC Serial',
                container: mainGrp.id
            }, false, {
                displayType: readOnly ? "inline" : "entry",
                defaultValue: !!_params.custpage_qc_serial  ? _params.custpage_qc_serial : ""
            });

            constForm.addField({
                id: 'custpage_item',
                type: "multiselect",
                source: "item",
                label: 'Items',
                container: mainGrp.id
            }, false, {
                breakType : "startcol",
                displayType: readOnly ? "inline" : "entry",
                defaultValue: !!_params.custpage_item ? _params.custpage_item.split(",") : ""
            });
        }

        const onCreateFormUI_LoadData = (_params) => {
            constForm.addButton({id: "custpage_btn_search", label: "Search", functionName: "onSearchResult('F')"},{
                styleSubmit: true
            });
            constForm.addButton({id: "custpage_btn_next", label: "Next >", functionName: "nextAction()"});
            constForm.addButton({id: "custpage_btn_cancel", label: "Cancel", functionName: "cancelAction()"});

            if(_params.isBack == "T"){
                let objParamsLoadData = readCacheData(_params, "params");

                _params = {..._params, ...objParamsLoadData};
            }

            let woTab = constForm.addTab({id: "tab_wo", label: "List Of Work Orders"});
            let componentTab = constForm.addTab({id: "tab_component", label: "Component Detail"});

            let objResDataSource = getDataSource_LoadData(_params);

            let woSublist = constForm.addSublist({
                id : "custpage_sl_wo",
                type : "list",
                label : 'Result',
                tab: woTab.id
            });
            woSublist.addButton({
                id : 'custpage_scv_btn_markall',
                label : 'Mark All',
                functionName: `markAllOfSublist('custpage_sl_wo', 'T')`
            });
            woSublist.addButton({
                id : 'custpage_scv_btn_unmarkall',
                label : 'Unmark All',
                functionName: `markAllOfSublist('custpage_sl_wo', 'F')`
            });
            onCreateSublistColumn("custpage_sl_wo", woSublist, _params);

            let componentSublist = constForm.addSublist({
                id : "custpage_sl_component",
                type : "LIST",
                label : 'Result',
                tab: componentTab.id
            });
            onCreateSublistColumn("custpage_sl_component", componentSublist, _params);

            constForm.setDataOfSublist("custpage_sl_wo", objResDataSource.arrResultWO);
            constForm.setDataOfSublist("custpage_sl_component", objResDataSource.arrResultComponent);

            return {
                custpage_sl_wo: woSublist,
                custpage_sl_component: componentSublist
            };
        }

        const getDataSource_LoadData = (_params) =>{
            let arrResultWO = [], arrResultComponent = [];

            if(_params.isSearch != "T"){
                return {
                    arrResultWO,
                    arrResultComponent
                };
            }

            let arrResultWOCache = [];
            if(_params.isBack == "T"){
                //read cache
                arrResultWOCache = readCacheData(_params, "custpage_sl_wo")||[];
            }
            
            let arrWOHdr = getDataWOForCompletionHDR(_params);
            let arrWODetail = getDataWOForCompletionDetail(_params);

            for(let i = 0; i < arrWOHdr.length; i++){
                let objWOHdr = arrWOHdr[i];

                let objRes = {
                    custpage_col_chk: "F",
                    custpage_col_date: objWOHdr.trandate,
                    custpage_col_shift: objWOHdr.custbody_scv_shift,
                    custpage_col_wo: objWOHdr.tranid,
                    custpage_col_wo_id: objWOHdr.internalid,
                    custpage_col_item: objWOHdr.item,
                    custpage_col_prodlot: objWOHdr.custbody_scv_assembly_lot,
                    custpage_col_qcserial: objWOHdr.custbody_scv_qc_serial_code,
                    custpage_col_wo_qty: objWOHdr.quantity * 1,
                    custpage_col_wo_remqty: objWOHdr.qty_remaining * 1,
                    custpage_col_location: objWOHdr.location,
                    custpage_col_thongkesx: objWOHdr.custbody_scv_so_thong_ke_sx,
                    custpage_col_prod_startdate: objWOHdr.custbody_scv_prod_start_date,
                    custpage_col_prod_enddate: objWOHdr.custbody_scv_prod_end_date,
                    custpage_col_workcenter: objWOHdr.custbody_mfgmob_workcenter,
                    custpage_col_subsidiary: objWOHdr.subsidiary,
                    custpage_col_wo_dinhmuc: objWOHdr.item_dinhmuc * 1,
                    custpage_col_islottitem: objWOHdr.islotitem,
                    custpage_col_itemtype: objWOHdr.itemtype,
                };

                let objResWOCache_find = arrResultWOCache.find(e => e.custpage_col_wo_id == objRes.custpage_col_wo_id);
                if(!!objResWOCache_find){
                    objRes.custpage_col_chk = "T";
                }

                arrResultWO.push(objRes);
            }

            for(let i = 0; i < arrWODetail.length; i++){
                let objWODetail = arrWODetail[i];

                let objRes = {
                    custpage_col_date: objWODetail.trandate,
                    custpage_col_workcenter: objWODetail.custbody_mfgmob_workcenter,
                    custpage_col_wo: objWODetail.tranid,
                    custpage_col_item: objWODetail.item,
                    custpage_col_prodlot: objWODetail.custbody_scv_assembly_lot,
                    custpage_col_qty: objWODetail.quantity * 1,
                    custpage_col_usestd_bomqty: objWODetail.custcol_scv_bom_std_qty * 1,
                    custpage_col_usein_build: objWODetail.quantityshiprecv * 1,
                    custpage_col_mat_remqty: objWODetail.qty_remaining * 1,
                    custpage_col_shift: objWODetail.custbody_scv_shift,
                    custpage_col_prod_startdate: objWODetail.custbody_scv_prod_start_date,
                    custpage_col_prod_enddate: objWODetail.custbody_scv_prod_end_date,
                    custpage_col_subsidiary: objWODetail.subsidiary,
                    custpage_col_location: objWODetail.location,
                    custpage_col_qcserial: objWODetail.custbody_scv_qc_serial_code,
                    custpage_col_mat_lot: objWODetail.serialnumber,
                    custpage_col_mat_lotqty: objWODetail.serialnumberquantity * 1,
                    custpage_col_wo_id: objWODetail.internalid,
                    custpage_col_islottitem: objWODetail.islotitem,
                    custpage_col_itemtype: objWODetail.itemtype,
                    custpage_col_line: objWODetail.line,
                    custpage_col_conversionrate: objWODetail.conversionrate * 1,
                };

                arrResultComponent.push(objRes);
            }
            
            return {
                arrResultWO,
                arrResultComponent
            }
        }

        const onCreateFormUI_InputWO = (_params) => {
            constForm.addButton({id: "custpage_btn_back", label: "< Back", functionName: "backAction()"});
            constForm.addButton({id: "custpage_btn_next", label: "Next >", functionName: "nextAction()"},{
                styleSubmit: true
            });
            constForm.addButton({id: "custpage_btn_cancel", label: "Cancel", functionName: "cancelAction()"});

            let woTab = constForm.addTab({id: "tab_wo", label: "List Of Work Orders"});
            let componentTab = constForm.addTab({id: "tab_component", label: "Component Detail"});

            let objResDataSource = getDataSource_InputWO(_params);

            let woSublist = constForm.addSublist({
                id : "custpage_sl_wo_1",
                type : "list",
                label : 'Result',
                tab: woTab.id
            });
            onCreateSublistColumn("custpage_sl_wo_1", woSublist, _params);

            constForm.addInventoryDetailOfSublist("custpage_sl_wo_1", "custpage_col_inventorydetail",{
                type: "receipt", isEditable: true,
                item: "custpage_col_item",
                quantity: "custpage_col_built_qty",
                description: "custpage_col_description",
                unit: "custpage_col_unit",
                location: "custpage_col_location"
            });

            let componentSublist = constForm.addSublist({
                id : "custpage_sl_component_1",
                type : "LIST",
                label : 'Result',
                tab: componentTab.id
            });
            onCreateSublistColumn("custpage_sl_component_1", componentSublist, _params);

            constForm.setDataOfSublist("custpage_sl_wo_1", objResDataSource.arrResultWO);
            constForm.setDataOfSublist("custpage_sl_component_1", objResDataSource.arrResultComponent);

            return {};
        }

        const getDataSource_InputWO = (_params) =>{
            let arrResultWO = [], arrResultComponent = [];

            let arrResultWOCache = [], arrResultComponentCache = [];
            let objResOfStore = readCacheData(_params)||{};
            if(_params.isNext == "T"){
                //read cache
                arrResultWOCache = objResOfStore.custpage_sl_wo||[];
                arrResultComponentCache = objResOfStore.custpage_sl_component||[];
            }
            else if(_params.isBack == "T"){
                //read cache
                arrResultWOCache = objResOfStore.custpage_sl_wo_1||[];
                arrResultComponentCache = objResOfStore.custpage_sl_component_1||[];
            }

            for(let i = 0; i < arrResultWOCache.length; i++){
                let objResWOCache = arrResultWOCache[i];

                let objRes = {...objResWOCache};

                if(!!objRes.custpage_col_trandt){
                    objRes.custpage_col_trandt = constFormat.parseDate(objRes.custpage_col_trandt);
                    objRes.custpage_col_trandt = constFormat.formatDate(objRes.custpage_col_trandt);
                }

                if(!!objRes.custpage_col_mfgdt){
                    objRes.custpage_col_mfgdt = constFormat.parseDate(objRes.custpage_col_mfgdt);
                    objRes.custpage_col_mfgdt = constFormat.formatDate(objRes.custpage_col_mfgdt);
                }

                objRes.custpage_col_built_qty = objRes.custpage_col_built_qty||0;
                objRes.custpage_col_tlg_total = objRes.custpage_col_tlg_total||0;
                objRes.custpage_col_tlg_pallet = objRes.custpage_col_tlg_pallet||0;
                objRes.custpage_col_tlg_khac = objRes.custpage_col_tlg_khac||0;
                objRes.custpage_col_tlg_hang = objRes.custpage_col_tlg_hang||0;
                objRes.custpage_col_tlg_dm = objRes.custpage_col_tlg_dm||0;
                objRes.custpage_col_percentdiff = objRes.custpage_col_percentdiff||0;

                arrResultWO.push(objRes);
            }

            for(let i = 0; i < arrResultComponentCache.length; i++){
                let objResComponentCache = arrResultComponentCache[i];

                let objRes = {...objResComponentCache};

                arrResultComponent.push(objRes);
            }


            return {
                arrResultWO,
                arrResultComponent
            }
        }

        const onCreateFormUI_InputComponent = (_params) => {
            constForm.addButton({id: "custpage_btn_submit", label: "Submit", functionName: "submitFinish()"},{
                styleSubmit: true
            });
            constForm.addButton({id: "custpage_btn_back", label: "< Back", functionName: "backAction()"});
            constForm.addButton({id: "custpage_btn_cancel", label: "Cancel", functionName: "cancelAction()"});

            let woTab = constForm.addTab({id: "tab_wo", label: "List Of Work Orders"});
            let componentTab = constForm.addTab({id: "tab_component", label: "Component Detail"});

            let objResDataSource = getDataSource_InputComponent(_params);

            let woSublist = constForm.addSublist({
                id : "custpage_sl_wo_2",
                type : "list",
                label : 'Result',
                tab: woTab.id
            });
            onCreateSublistColumn("custpage_sl_wo_2", woSublist, _params);

            constForm.addInventoryDetailOfSublist("custpage_sl_wo_2", "custpage_col_inventorydetail",{
                type: "receipt", isEditable: false,
                item: "custpage_col_item",
                quantity: "custpage_col_built_qty",
                description: "custpage_col_description",
                unit: "custpage_col_unit",
                location: "custpage_col_location"
            });

            let componentSublist = constForm.addSublist({
                id : "custpage_sl_component_2",
                type : "LIST",
                label : 'Result',
                tab: componentTab.id
            });
            componentSublist.addButton({id: "custpage_btn_filllot", label: "Fill Lot", functionName: "autoInvDetail('custpage_sl_component_2')"});
            onCreateSublistColumn("custpage_sl_component_2", componentSublist, _params);

            constForm.addInventoryDetailOfSublist("custpage_sl_component_2", "custpage_col_inventorydetail",{
                type: "issue", isEditable: true,
                item: "custpage_col_item",
                quantity: "custpage_col_issue_qty",
                description: "custpage_col_description",
                unit: "custpage_col_unit",
                location: "custpage_col_location"
            });

            constForm.setDataOfSublist("custpage_sl_wo_2", objResDataSource.arrResultWO);
            constForm.setDataOfSublist("custpage_sl_component_2", objResDataSource.arrResultComponent);

            return {};
        }

        const getDataSource_InputComponent = (_params) =>{
            let arrResultWO = [], arrResultComponent = [];

            let arrResultWOCache = [], arrResultComponentCache = [];
            let objResOfStore = readCacheData(_params)||{};
            if(_params.isNext == "T"){
                //read cache
                arrResultWOCache = objResOfStore.custpage_sl_wo_1||[];
                arrResultComponentCache = objResOfStore.custpage_sl_component_1||[];
            }
            else if(_params.isBack == "T"){
                //read cache
                arrResultWOCache = objResOfStore.custpage_sl_wo_2||[];
                arrResultComponentCache = objResOfStore.custpage_sl_component_2||[];
            }

            for(let i = 0; i < arrResultWOCache.length; i++){
                let objResWOCache = arrResultWOCache[i];

                let objRes = {...objResWOCache};

                if(!!objRes.custpage_col_trandt){
                    objRes.custpage_col_trandt = constFormat.parseDate(objRes.custpage_col_trandt);
                    objRes.custpage_col_trandt = constFormat.formatDate(objRes.custpage_col_trandt);
                }

                if(!!objRes.custpage_col_mfgdt){
                    objRes.custpage_col_mfgdt = constFormat.parseDate(objRes.custpage_col_mfgdt);
                    objRes.custpage_col_mfgdt = constFormat.formatDate(objRes.custpage_col_mfgdt);
                }
                arrResultWO.push(objRes);
            }
            constForm.mappedResultsInventoryDetail(arrResultWO, "custpage_col_inventorydetail");

            // XE CUON: gắn khóa nhóm phụ (Số thống kê SX) cho từng dòng component theo WO của nó
            let objWOTypeMap_step3 = getWOTypeMap(arrResultWOCache.map(e => e.custpage_col_wo_id));
            for(let i = 0; i < arrResultComponentCache.length; i++){
                let objComp = arrResultComponentCache[i];
                if(!objComp.custpage_col_wo_id) continue; // dòng đã gom (isBack) -> giữ khóa cũ
                let objWO = arrResultWOCache.find(e => e.custpage_col_wo_id == objComp.custpage_col_wo_id);
                objComp.custpage_col_slitgrp = getSlitGroupKey(objWO, objWOTypeMap_step3);
                objComp.custpage_col_thongkesx = !!objComp.custpage_col_slitgrp ? String(objWO.custpage_col_thongkesx || "") : "";
            }

            let arrComponentGroup = alasql(`SELECT custpage_col_item,
                custpage_col_location, custpage_col_subsidiary,
                custpage_col_workcenter, 
                custpage_col_islottitem,
                custpage_col_itemtype,
                custpage_col_slitgrp,
                custpage_col_thongkesx,
                SUM(custpage_col_qty) as custpage_col_qty,
                SUM(custpage_col_usein_build) as custpage_col_usein_build,
                SUM(custpage_col_mat_remqty) as custpage_col_mat_remqty,
                SUM(custpage_col_issue_qty) as custpage_col_issue_qty
            FROM ?
            GROUP BY custpage_col_item, custpage_col_location, custpage_col_subsidiary,
                custpage_col_workcenter, custpage_col_islottitem,
                custpage_col_itemtype, custpage_col_slitgrp, custpage_col_thongkesx`, [arrResultComponentCache]);

            for(let i = 0; i < arrComponentGroup.length; i++){
                let objResComponentGroupCache = arrComponentGroup[i];

                let objRes = {...objResComponentGroupCache};

                objRes.custpage_col_qty = constFormat.roundNumber(objRes.custpage_col_qty, 3);
                objRes.custpage_col_usein_build = constFormat.roundNumber(objRes.custpage_col_usein_build, 3);
                objRes.custpage_col_mat_remqty = constFormat.roundNumber(objRes.custpage_col_mat_remqty, 3);
                objRes.custpage_col_issue_qty = constFormat.roundNumber(objRes.custpage_col_issue_qty, 3);

                let objLineOld = arrResultComponentCache.find(e => e.custpage_col_item == objRes.custpage_col_item
                    && e.custpage_col_location == objRes.custpage_col_location
                    && e.custpage_col_subsidiary == objRes.custpage_col_subsidiary
                    && e.custpage_col_workcenter == objRes.custpage_col_workcenter
                    && (e.custpage_col_slitgrp || "") == (objRes.custpage_col_slitgrp || "")
                );
                if(!!objLineOld){
                    objRes.custpage_col_inventorydetailstore = objLineOld.custpage_col_inventorydetailstore;
                }

                // XE CUON: Issued Qty gợi ý cho nhóm xẻ = Σ Built Qty các cuộn con của OWO (1 kg con = 1 kg mẹ);
                // item danh nghĩa NACP.2 = 0. Chỉ áp khi đi tới (isNext), Back giữ số người dùng đã nhập.
                if(_params.isNext == "T" && !!objRes.custpage_col_slitgrp){
                    if(NOMINAL_BOM_ITEM_IDS.indexOf(String(objRes.custpage_col_item)) > -1){
                        objRes.custpage_col_issue_qty = 0;
                    }
                    else{
                        let sumBuilt = arrResultWOCache
                            .filter(e => getSlitGroupKey(e, objWOTypeMap_step3) == objRes.custpage_col_slitgrp)
                            .reduce((t, e) => t + (e.custpage_col_built_qty * 1 || 0), 0);
                        if(sumBuilt > 0){
                            objRes.custpage_col_issue_qty = constFormat.roundNumber(sumBuilt, 3);
                        }
                    }
                }

                arrResultComponent.push(objRes);
            }
            constForm.mappedResultsInventoryDetail(arrResultComponent, "custpage_col_inventorydetail");

            return {
                arrResultWO,
                arrResultComponent
            }
        }

        const onCreateFormUI_ViewResult = (_params) => {
            let objPopupQueue = constQueueJob.getPopupQueueJobStatusScript();

            constForm.addButton({id: "custpage_btn_cancel", label: "Cancel", functionName: "cancelAction()"});
            constForm.addButton({id: "custpage_btn_back", label: "< Back", functionName: "backAction()"});
            constForm.addButton({
                id: "custpage_btn_queue", 
                label: "Queue Job", 
                functionName: `openStatusQueue('${objPopupQueue.url}', ${objPopupQueue.width}, ${objPopupQueue.height}, '${objPopupQueue.title}')`
            });

            let objResOfStore = readCacheData(_params)||{};

            let arrAsbCreated = objResOfStore?.asbcreated || [];

            if(!_params.custpage_col_queueid){
                _params.custpage_col_queueid = objResOfStore?.queueid || "";
            }

            if(!!_params.custpage_col_queueid){
                let status_display = search.lookupFields({
                    type: constQueueJob.TYPE,
                    id: _params.custpage_col_queueid,
                    columns: "custrecord_scv_queue_job_status"
                }).custrecord_scv_queue_job_status[0].text;
                
                constForm.addPageInitMessage("Job js " + status_display);
            }

            if(arrAsbCreated.length > 0){
                let resultSublist = constForm.addSublist({
                    id : "custpage_sl_result",
                    type : "list",
                    label : 'Result',
                });
                onCreateSublistColumn("custpage_sl_result", resultSublist, _params);

                constForm.setDataOfSublist("custpage_sl_result", arrAsbCreated);
                
                let arrWOError = arrAsbCreated.filter(e => !e.custpage_col_asb_id);
                if(arrWOError.length == 0){
                    constForm.removeButton("custpage_btn_back");
                }
            }

            return {};
        }

        const getDataSource_ViewResult = (_params) =>{
            let arrResult = [];

            let arrResComponent_inputWO = [];
            let arrResWO_inputComponent = [], arrResComponent_inputComponent = [];
            if(_params.isSubmit == "T"){
                //read cache
                let objResOfStore = readCacheData(_params)||{};
                arrResComponent_inputWO = objResOfStore.custpage_sl_component_1 || [];
                arrResWO_inputComponent = objResOfStore.custpage_sl_wo_2 || [];
                arrResComponent_inputComponent = objResOfStore.custpage_sl_component_2 || [];

                constForm.mappedResultsInventoryDetail(arrResComponent_inputWO, "custpage_col_inventorydetail");
                constForm.mappedResultsInventoryDetail(arrResWO_inputComponent, "custpage_col_inventorydetail");
                constForm.mappedResultsInventoryDetail(arrResComponent_inputComponent, "custpage_col_inventorydetail");
            }

            let curUser = constUser.getCurrentUser();

            let empId = curUser.id;
            if(curUser.isPartner){
                empId = curUser.custentity_scv_partner_employee;
            }

            // XE CUON: map WO id -> loại lệnh sản xuất (1 search cho cả lượt) và khóa nhóm phụ theo WO
            let objWOTypeMap = getWOTypeMap(arrResWO_inputComponent.map(e => e.custpage_col_wo_id));
            let objWOKeyMap = {};
            arrResWO_inputComponent.forEach(e => {
                objWOKeyMap[String(e.custpage_col_wo_id)] = getSlitGroupKey(e, objWOTypeMap);
            });

            let arrResultLine = [];
            
            for(let i = 0; i < arrResComponent_inputComponent.length; i++){
                let objResComponent_inputComponent = arrResComponent_inputComponent[i];

                let arrComponentOfWO = arrResComponent_inputWO.filter(e => e.custpage_col_item == objResComponent_inputComponent.custpage_col_item
                    && e.custpage_col_location == objResComponent_inputComponent.custpage_col_location
                    && e.custpage_col_subsidiary == objResComponent_inputComponent.custpage_col_subsidiary
                    && e.custpage_col_workcenter == objResComponent_inputComponent.custpage_col_workcenter
                    && (objWOKeyMap[String(e.custpage_col_wo_id)] || "") == (objResComponent_inputComponent.custpage_col_slitgrp || "")
                );
                
                let totalQtyIssueAllocate = objResComponent_inputComponent.custpage_col_issue_qty;
                let totalQtyAllocate = objResComponent_inputComponent.custpage_col_qty;
                let totalQtyAllocateAcctual = 0;

                // XE CUON: nhóm toàn WO "Xẻ nhôm, Xẻ tôn"
                let isSlittingGroup = arrComponentOfWO.length > 0
                    && arrComponentOfWO.every(e => SLITTING_WO_TYPE_IDS.indexOf(getWOType(objWOTypeMap, e.custpage_col_wo_id)) > -1);

                // XE CUON: 1 kg cuộn con = 1 kg cuộn mẹ -> cơ sở chia = kg cân thực (Built Qty), không phụ thuộc số ước tính trên dòng WO (BOM WO khác.HN)
                const getQtyAllocateOfWO = (objComponentOfWO) => {
                    let qtyPlan = objComponentOfWO.custpage_col_qty * 1 || 0;
                    if(!isSlittingGroup) return qtyPlan;

                    let objWO = arrResWO_inputComponent.find(e => e.custpage_col_wo_id == objComponentOfWO.custpage_col_wo_id);
                    let builtQty = objWO ? (objWO.custpage_col_built_qty * 1 || 0) : 0;
                    if(builtQty <= 0) return qtyPlan;

                    return constFormat.roundNumber(builtQty, 5);
                };

                if(isSlittingGroup){
                    totalQtyAllocate = arrComponentOfWO.reduce((s, e) => s + getQtyAllocateOfWO(e), 0);
                }

                let arrResAllocate = [];
                for(let j = 0; j < arrComponentOfWO.length; j++){
                    let objComponentOfWO = arrComponentOfWO[j];

                    let qtyAllocate = getQtyAllocateOfWO(objComponentOfWO);

                    // XE CUON: không làm tròn tỷ lệ trước khi nhân (tránh lệch vài gram trên tổng ~2 tấn); nhóm khác giữ cách cũ
                    let rateAllocate = totalQtyAllocate == 0 ? 0
                        : (isSlittingGroup ? (qtyAllocate / totalQtyAllocate) : constFormat.roundNumber(qtyAllocate / totalQtyAllocate, 5));
                    let qtyIssueAllocate = constFormat.roundNumber(totalQtyIssueAllocate * rateAllocate, 5);

                    totalQtyAllocateAcctual += qtyIssueAllocate;
                    
                    let objRes = {
                        custpage_col_date: objComponentOfWO.custpage_col_date,
                        custpage_col_subsidiary: objComponentOfWO.custpage_col_subsidiary,
                        custpage_col_location: objComponentOfWO.custpage_col_location,
                        custpage_col_workcenter: objComponentOfWO.custpage_col_workcenter,
                        custpage_col_qcserial: objComponentOfWO.custpage_col_qcserial,
                        custpage_col_issue_qty: totalQtyIssueAllocate,
                        custpage_col_issue_qty_allocate: qtyIssueAllocate,
                        custpage_col_wo_id: objComponentOfWO.custpage_col_wo_id,
                        custpage_col_wo: objComponentOfWO.custpage_col_wo,
                        custpage_col_prodlot: objComponentOfWO.custpage_col_prodlot,
                        custpage_col_item: objComponentOfWO.custpage_col_item,
                        custpage_col_qty: objComponentOfWO.custpage_col_qty,
                        custpage_col_islottitem: objComponentOfWO.custpage_col_islottitem,
                        custpage_col_itemtype: objComponentOfWO.custpage_col_itemtype,
                        custpage_col_line: objComponentOfWO.custpage_col_line,
                        inventorydetail: []
                    };

                    arrResAllocate.push(objRes)
                }

                constRecord.recalcSyncBalanaceAllocation(arrResAllocate, totalQtyIssueAllocate, totalQtyAllocateAcctual, "custpage_col_issue_qty_allocate", 5);

                let arrLineOfInvDetail  = objResComponent_inputComponent?.inventorydetail?.inventoryassignment || [];

                // XE CUON: nhóm toàn WO "Xẻ nhôm, Xẻ tôn" -> chia đều mỗi lô theo tỷ lệ tiêu hao WO
                if(arrLineOfInvDetail.length > 0 && isSlittingGroup){
                    let totalIssueOfGroup = arrResAllocate.reduce((s, e) => s + (e.custpage_col_issue_qty_allocate * 1 || 0), 0);

                    for(let j = 0; j < arrResAllocate.length; j++){
                        let objResAllocate = arrResAllocate[j];

                        let qtyIssueAllocate = objResAllocate.custpage_col_issue_qty_allocate * 1 || 0;
                        let rateWO = totalIssueOfGroup == 0 ? 0 : qtyIssueAllocate / totalIssueOfGroup;

                        let sumLot = 0, idxMax = -1, maxQty = -1;

                        arrLineOfInvDetail.forEach(objLineInvDetail => {
                            let objLineInvDetailAllocate = {...objLineInvDetail};
                            objLineInvDetailAllocate.custpage_quantity = constFormat.roundNumber((objLineInvDetail.custpage_quantity * 1 || 0) * rateWO, 5);

                            if(objLineInvDetailAllocate.custpage_quantity <= 0) return;

                            sumLot += objLineInvDetailAllocate.custpage_quantity;
                            objResAllocate.inventorydetail.push(objLineInvDetailAllocate);

                            if(objLineInvDetailAllocate.custpage_quantity > maxQty){
                                maxQty = objLineInvDetailAllocate.custpage_quantity;
                                idxMax = objResAllocate.inventorydetail.length - 1;
                            }
                        });

                        // dồn sai số làm tròn vào lô lớn nhất để Σ lô = tiêu hao WO
                        if(idxMax > -1){
                            let diff = constFormat.roundNumber(qtyIssueAllocate - sumLot, 5);
                            if(diff != 0){
                                objResAllocate.inventorydetail[idxMax].custpage_quantity =
                                    constFormat.roundNumber(objResAllocate.inventorydetail[idxMax].custpage_quantity + diff, 5);
                            }
                        }
                    }
                }
                else if(arrLineOfInvDetail.length > 0){
                    // logic cũ: rót lần lượt theo thứ tự lô
                    for(let j = 0; j < arrResAllocate.length; j++){
                        let objResAllocate = arrResAllocate[j];
                        
                        let qtyIssueAllocate = objResAllocate.custpage_col_issue_qty_allocate;

                        arrLineOfInvDetail.forEach(objLineInvDetail => {
                            let objLineInvDetailAllocate = {...objLineInvDetail};
                            objLineInvDetailAllocate.custpage_quantity = 0;

                            if(objLineInvDetail.custpage_quantity > qtyIssueAllocate){
                                objLineInvDetailAllocate.custpage_quantity = qtyIssueAllocate;

                                objLineInvDetail.custpage_quantity = objLineInvDetail.custpage_quantity - objLineInvDetailAllocate.custpage_quantity;
                                objLineInvDetail.custpage_quantity = constFormat.roundNumber(objLineInvDetail.custpage_quantity, 5);
                            }
                            else if(objLineInvDetail.custpage_quantity <= qtyIssueAllocate){
                                objLineInvDetailAllocate.custpage_quantity = objLineInvDetail.custpage_quantity;

                                objLineInvDetail.custpage_quantity = 0;
                            }

                            if(objLineInvDetailAllocate.custpage_quantity == 0) return;

                            qtyIssueAllocate -= objLineInvDetailAllocate.custpage_quantity;
                            qtyIssueAllocate = constFormat.roundNumber(qtyIssueAllocate, 5);

                            objResAllocate.inventorydetail.push(objLineInvDetailAllocate);
                        });
                    }
                }

                arrResultLine = arrResultLine.concat(arrResAllocate);
            }
            
            for(let i = 0; i < arrResWO_inputComponent.length; i++){
                let objRes = {...arrResWO_inputComponent[i]};
                objRes.custbody_scv_employee_ycxvt = empId;
                objRes.custpage_col_slitgrp = objWOKeyMap[String(objRes.custpage_col_wo_id)] || "";
                
                objRes.inventorydetail = objRes?.inventorydetail?.inventoryassignment || [];

                objRes.lines =  arrResultLine.filter(e => e.custpage_col_wo_id == objRes.custpage_col_wo_id);

                arrResult.push(objRes);
            }
            
            return {
                arrResult
            }
        }
        
        const onCreateSublistColumn = (_sublistId, _sublist, _params) => {
            let arrColumn = getColumnOfSublist(_sublistId)

            constForm.addFieldOfSublist(_sublistId, arrColumn);
        }

        const getColumnOfSublist = (_sublistId) =>{
            let arrColumn = [];
            
            if(_sublistId == "custpage_sl_wo"){
                arrColumn.push(
                    {id: "custpage_col_chk", label: "Check Box", type: "checkbox", displayType: "entry"},
                    {id: "custpage_col_date", label: "Date", type: "text"},
                    {id: "custpage_col_shift", label: "Shift", type: "select", source: "customrecord_scv_shift"},
                    {id: "custpage_col_wo", label: "Work Order", type: "text"},
                    {id: "custpage_col_item", label: "Item", type: "select", source: "item"},
                    {id: "custpage_col_prodlot", label: "Prod. Lot No", type: "text"},
                    {id: "custpage_col_qcserial", label: "QC Serial", type: "text"},
                    {id: "custpage_col_wo_qty", label: "WO Qty.", type: "float"},
                    {id: "custpage_col_wo_remqty", label: "WO Rem. Qty.", type: "float"},
                    {id: "custpage_col_location", label: "Location", type: "select", source: "location"},
                    {id: "custpage_col_thongkesx", label: "Số thống kê sản xuất", type: "text"},
                    {id: "custpage_col_prod_startdate", label: "Prod. S.Date", type: "text"},
                    {id: "custpage_col_prod_enddate", label: "Prod. E.Date", type: "text"},
                    {id: "custpage_col_workcenter", label: "Work Center", type: "select", source: "-8"},
                    {id: "custpage_col_subsidiary", label: "Subsidiary", type: "select", source: "subsidiary"},
                    {id: "custpage_col_wo_id", label: "WO ID", type: "text", displayType: "hidden"},
                    {id: "custpage_col_wo_dinhmuc", label: "Định Mức", type: "float", displayType: "hidden"},
                    {id: "custpage_col_islottitem", label: "Is lot Item", type: "text", displayType: "hidden"},
                    {id: "custpage_col_itemtype", label: "Item Type", type: "text", displayType: "hidden"},
                );
            }
            else if(_sublistId == "custpage_sl_component"){
                arrColumn.push(
                    {id: "custpage_col_date", label: "Date", type: "text"},
                    {id: "custpage_col_workcenter", label: "Work Center", type: "select", source: "-8"},
                    {id: "custpage_col_wo", label: "Work Order", type: "text"},
                    {id: "custpage_col_item", label: "Item", type: "select", source: "item"},
                    {id: "custpage_col_prodlot", label: "Prod. Lot No", type: "text"},
                    {id: "custpage_col_qty", label: "Quantity", type: "float"},
                    {id: "custpage_col_usestd_bomqty", label: "Use Std B.O.M Qty", type: "float"},
                    {id: "custpage_col_usein_build", label: "Use In Built", type: "float"},
                    {id: "custpage_col_mat_remqty", label: "Rem. Mat. Qty", type: "float"},
                    {id: "custpage_col_shift", label: "Shift", type: "select", source: "customrecord_scv_shift"},
                    {id: "custpage_col_prod_startdate", label: "Prod. S.Date", type: "text"},
                    {id: "custpage_col_prod_enddate", label: "Prod. E.Date", type: "text"},
                    {id: "custpage_col_subsidiary", label: "Subsidiary", type: "select", source: "subsidiary"},
                    {id: "custpage_col_location", label: "Location", type: "select", source: "location"},
                    {id: "custpage_col_qcserial", label: "QC Serial", type: "text"},
                    {id: "custpage_col_mat_lot", label: "Mat. Lot", type: "text"},
                    {id: "custpage_col_mat_lotqty", label: "Mat. Lot Qty", type: "float"},
                    {id: "custpage_col_conversionrate", label: "Hệ số quy chuẩn", type: "float"},
                    {id: "custpage_col_wo_id", label: "WO ID", type: "text", displayType: "hidden"},
                    {id: "custpage_col_islottitem", label: "Is lot Item", type: "text", displayType: "hidden"},
                    {id: "custpage_col_line", label: "Line", type: "text", displayType: "hidden"},
                    {id: "custpage_col_itemtype", label: "Item Type", type: "text", displayType: "hidden"},
                );
            }
            else if(_sublistId == "custpage_sl_wo_1"){
                arrColumn.push(
                    {id: "custpage_col_date", label: "Date", type: "text"},
                    {id: "custpage_col_shift", label: "Shift", type: "select", source: "customrecord_scv_shift"},
                    {id: "custpage_col_wo", label: "Work Order", type: "text"},
                    {id: "custpage_col_item", label: "Item", type: "select", source: "item"},
                    {id: "custpage_col_prodlot", label: "Prod. Lot No", type: "text"},
                    {id: "custpage_col_wo_qty", label: "WO Qty.", type: "float"},
                    {id: "custpage_col_wo_remqty", label: "WO Rem. Qty.", type: "float"},
                    {id: "custpage_col_location", label: "Location", type: "select", source: "location"},
                    {id: "custpage_col_thongkesx", label: "Số thống kê sản xuất", type: "text"},
                    {id: "custpage_col_trandt", label: "Ngày thống kê", type: "date", displayType: "entry"},
                    {id: "custpage_col_mfgdt", label: "Ngày sản xuất", type: "date", displayType: "entry"},
                    {id: "custpage_col_mfgmob_shift", label: "Ca làm việc", type: "select", source: "customrecord_mfgmob_shift", displayType: "entry"},
                    {id: "custpage_col_actprodtime", label: "TGSX (Theo phút)", type: "integer", displayType: "entry"},
                    
                    {id: "custpage_col_built_qty", label: "Built Qty.", type: "float", displayType: "entry"},
                    {id: "custpage_col_inventorydetail", label: "Inv. Detail", type: "text"},
                    {id: "custpage_col_tlg_total", label: "TLg Tổng", type: "float", displayType: "entry"},
                    {id: "custpage_col_tlg_pallet", label: "TLg Pallet", type: "float", displayType: "entry"},
                    {id: "custpage_col_tlg_khac", label: "Tlg khác", type: "float", displayType: "entry"},
                    {id: "custpage_col_tlg_hang", label: "TLg hàng", type: "float", displayType: "entry"},
                    {id: "custpage_col_tlg_dm", label: "TL. ĐM", type: "float", displayType: "entry"},
                    {id: "custpage_col_percentdiff", label: "% Diff (Tlg Hang vsTlg.Đm)", type: "text", displayType: "entry"},
                    
                    {id: "custpage_col_workcenter", label: "Work Center", type: "select", source: "-8"},
                    {id: "custpage_col_subsidiary", label: "Subsidiary", type: "select", source: "subsidiary"},
                    {id: "custpage_col_qcserial", label: "QC Serial", type: "text"},
                    {id: "custpage_col_wo_id", label: "WO ID", type: "text", displayType: "hidden"},
                    {id: "custpage_col_wo_dinhmuc", label: "Định Mức", type: "float", displayType: "hidden"},
                    {id: "custpage_col_islottitem", label: "Is lot Item", type: "text", displayType: "hidden"},
                    {id: "custpage_col_itemtype", label: "Item Type", type: "text", displayType: "hidden"},
                );
            }
            else if(_sublistId == "custpage_sl_component_1"){
                arrColumn.push(
                    {id: "custpage_col_date", label: "Date", type: "text"},
                    {id: "custpage_col_workcenter", label: "Work Center", type: "select", source: "-8"},
                    {id: "custpage_col_wo", label: "Work Order", type: "text"},
                    {id: "custpage_col_item", label: "Item", type: "select", source: "item"},
                    {id: "custpage_col_prodlot", label: "Prod. Lot No", type: "text"},
                    {id: "custpage_col_qty", label: "Quantity", type: "float"},
                    {id: "custpage_col_usestd_bomqty", label: "Use Std B.O.M Qty", type: "float"},
                    {id: "custpage_col_usein_build", label: "Use In Built", type: "float"},
                    {id: "custpage_col_mat_remqty", label: "Rem. Mat. Qty", type: "float"},
                    {id: "custpage_col_shift", label: "Shift", type: "select", source: "customrecord_scv_shift"},
                    {id: "custpage_col_prod_startdate", label: "Prod. S.Date", type: "text"},
                    {id: "custpage_col_prod_enddate", label: "Prod. E.Date", type: "text"},
                    {id: "custpage_col_subsidiary", label: "Subsidiary", type: "select", source: "subsidiary"},
                    {id: "custpage_col_location", label: "Location", type: "select", source: "location"},
                    {id: "custpage_col_qcserial", label: "QC Serial", type: "text"},
                    {id: "custpage_col_mat_lot", label: "Mat. Lot", type: "text"},
                    {id: "custpage_col_mat_lotqty", label: "Mat. Lot Qty", type: "float"},
                    {id: "custpage_col_issue_qty", label: "Issued Qty", type: "float", displayType: "entry"},
                    {id: "custpage_col_conversionrate", label: "Hệ số quy chuẩn", type: "float"},
                    {id: "custpage_col_wo_id", label: "WO ID", type: "text", displayType: "hidden"},
                    {id: "custpage_col_islottitem", label: "Is lot Item", type: "text", displayType: "hidden"},
                    {id: "custpage_col_line", label: "Line", type: "text", displayType: "hidden"},
                    {id: "custpage_col_itemtype", label: "Item Type", type: "text", displayType: "hidden"},
                );
            }
            else if(_sublistId == "custpage_sl_wo_2"){
                arrColumn.push(
                    {id: "custpage_col_date", label: "Date", type: "text"},
                    {id: "custpage_col_shift", label: "Shift", type: "select", source: "customrecord_scv_shift"},
                    {id: "custpage_col_wo", label: "Work Order", type: "text"},
                    {id: "custpage_col_item", label: "Item", type: "select", source: "item"},
                    {id: "custpage_col_prodlot", label: "Prod. Lot No", type: "text"},
                    {id: "custpage_col_wo_qty", label: "WO Qty.", type: "float"},
                    {id: "custpage_col_wo_remqty", label: "WO Rem. Qty.", type: "float"},
                    {id: "custpage_col_location", label: "Location", type: "select", source: "location"},
                    {id: "custpage_col_thongkesx", label: "Số thống kê sản xuất", type: "text"},
                    {id: "custpage_col_trandt", label: "Ngày thống kê", type: "date"},
                    {id: "custpage_col_mfgdt", label: "Ngày sản xuất", type: "date"},
                    {id: "custpage_col_mfgmob_shift", label: "Ca làm việc", type: "select", source: "customrecord_mfgmob_shift"},
                    {id: "custpage_col_actprodtime", label: "TGSX (Theo phút)", type: "integer"},
                    
                    {id: "custpage_col_built_qty", label: "Built Qty.", type: "float"},
                    {id: "custpage_col_inventorydetail", label: "Inv. Detail", type: "text", isInventoryDetail: "T"},
                    {id: "custpage_col_tlg_total", label: "TLg Tổng", type: "float"},
                    {id: "custpage_col_tlg_pallet", label: "TLg Pallet", type: "float"},
                    {id: "custpage_col_tlg_khac", label: "Tlg khác", type: "float"},
                    {id: "custpage_col_tlg_hang", label: "TLg hàng", type: "float"},
                    {id: "custpage_col_tlg_dm", label: "TL. ĐM", type: "float"},
                    {id: "custpage_col_percentdiff", label: "% Diff (Tlg Hang vsTlg.Đm)", type: "text"},
                    
                    {id: "custpage_col_workcenter", label: "Work Center", type: "select", source: "-8"},
                    {id: "custpage_col_subsidiary", label: "Subsidiary", type: "select", source: "subsidiary"},
                    {id: "custpage_col_qcserial", label: "QC Serial", type: "text"},
                    {id: "custpage_col_wo_id", label: "WO ID", type: "text", displayType: "hidden"},
                    {id: "custpage_col_wo_dinhmuc", label: "Định Mức", type: "float", displayType: "hidden"},
                    {id: "custpage_col_islottitem", label: "Is lot Item", type: "text", displayType: "hidden"},
                    {id: "custpage_col_itemtype", label: "Item Type", type: "text", displayType: "hidden"},
                );
            }
            else if(_sublistId == "custpage_sl_component_2"){
                arrColumn.push(
                    {id: "custpage_col_item", label: "Item", type: "select", source: "item"},
                    {id: "custpage_col_thongkesx", label: "Số thống kê SX (xẻ)", type: "text"},
                    {id: "custpage_col_qty", label: "Quantity", type: "float"},
                    {id: "custpage_col_usein_build", label: "Use In Built", type: "float"},
                    {id: "custpage_col_mat_remqty", label: "Rem. Mat. Qty", type: "float"},
                    {id: "custpage_col_issue_qty", label: "Issued Qty", type: "float", displayType: "entry"},
                    {id: "custpage_col_inventorydetail", label: "Inv. Detail", type: "text", isInventoryDetail: "T"},
                    {id: "custpage_col_location", label: "Location", type: "select", source: "location"},
                    {id: "custpage_col_workcenter", label: "Work Center", type: "select", source: "-8"},
                    {id: "custpage_col_subsidiary", label: "Subsidiary", type: "select", source: "subsidiary"},
                    {id: "custpage_col_qcserial", label: "QC Serial", type: "text"},
                    {id: "custpage_col_conversionrate", label: "Hệ số quy chuẩn", type: "float"},
                    {id: "custpage_col_islottitem", label: "Is lot Item", type: "text", displayType: "hidden"},
                    {id: "custpage_col_itemtype", label: "Item Type", type: "text", displayType: "hidden"},
                    {id: "custpage_col_slitgrp", label: "Slit Group Key", type: "text", displayType: "hidden"},
                );
            }
            else if(_sublistId == "custpage_sl_result"){
                arrColumn.push(
                    {id: "custpage_col_wo_id", label: "Work Order", type: "select", source: "workorder", displayType: "disabled"},
                    {id: "custpage_col_asb_id", label: "Assembly Build", type: "select", source: "assemblybuild", displayType: "disabled"},
                    {id: "custpage_col_msg", label: "Message", type: "textarea"}
                );
            }

            return arrColumn;
        }
        
        const getDataWOForCompletionHDR = (_params) => {
            let myFilters = [];

            if(!!_params.custpage_subsidiary){
                myFilters.push(search.createFilter({
                    name: 'subsidiary', 
                    operator: "anyof", 
                    values: _params.custpage_subsidiary
                }))
            }

            if(!!_params.custpage_location){
                myFilters.push(search.createFilter({
                    name: 'location', 
                    operator: "anyof", 
                    values: _params.custpage_location
                }))
            }

            if(!!_params.custpage_item){
                myFilters.push(search.createFilter({
                    name: 'item', 
                    operator: "anyof", 
                    values: _params.custpage_item.split(",")
                }))
            }

            if(!!_params.custpage_workcenter){
                myFilters.push(search.createFilter({
                    name: 'custbody_mfgmob_workcenter', 
                    operator: "anyof", 
                    values: _params.custpage_workcenter
                }))
            }

            if(!!_params.custpage_fromdt){
                myFilters.push(search.createFilter({
                    name: 'trandate',
                    operator: search.Operator.ONORAFTER,
                    values: _params.custpage_fromdt
                }));
            }

            if(!!_params.custpage_todt){
                myFilters.push(search.createFilter({
                    name: 'trandate',
                    operator: search.Operator.ONORBEFORE,
                    values: _params.custpage_todt
                }));
            }

            if(!!_params.custpage_prod_lotno){
                myFilters.push(search.createFilter({
                    name: 'formulatext', 
                    formula: `CASE WHEN {custbody_scv_assembly_lot} IN ('${_params.custpage_prod_lotno.split(",").join("','")}') THEN 'T' ELSE 'F' END`,
                    operator: "is",
                    values: "T"
                }))
            }

            if(!!_params.custpage_qc_serial){
                myFilters.push(search.createFilter({
                    name: 'custbody_scv_qc_serial_code', 
                    operator: "contains", 
                    values: _params.custpage_qc_serial
                }))
            }
            
            let arrResult = constSearchWOForCompletionHdr.getDataSource(myFilters);

            return arrResult;
        }
        
        const getDataWOForCompletionDetail = (_params) => {
            let myFilters = [];

            if(!!_params.custpage_subsidiary){
                myFilters.push(search.createFilter({
                    name: 'subsidiary', 
                    operator: "anyof", 
                    values: _params.custpage_subsidiary
                }))
            }

            if(!!_params.custpage_location){
                myFilters.push(search.createFilter({
                    name: 'location', 
                    operator: "anyof", 
                    values: _params.custpage_location
                }))
            }

            if(!!_params.custpage_item){
                myFilters.push(search.createFilter({
                    name: 'item', 
                    operator: "anyof", 
                    values: _params.custpage_item.split(",")
                }))
            }

            if(!!_params.custpage_workcenter){
                myFilters.push(search.createFilter({
                    name: 'custbody_mfgmob_workcenter', 
                    operator: "anyof", 
                    values: _params.custpage_workcenter
                }))
            }

            if(!!_params.custpage_fromdt){
                myFilters.push(search.createFilter({
                    name: 'trandate',
                    operator: search.Operator.ONORAFTER,
                    values: _params.custpage_fromdt
                }));
            }
            
            if(!!_params.custpage_todt){
                myFilters.push(search.createFilter({
                    name: 'trandate',
                    operator: search.Operator.ONORBEFORE,
                    values: _params.custpage_todt
                }));
            }

            if(!!_params.custpage_prod_lotno){
                myFilters.push(search.createFilter({
                    name: 'formulatext', 
                    formula: `CASE WHEN {custbody_scv_assembly_lot} IN ('${_params.custpage_prod_lotno.split(",").join("','")}') THEN 'T' ELSE 'F' END`,
                    operator: "is",
                    values: "T"
                }))
            }

            if(!!_params.custpage_qc_serial){
                myFilters.push(search.createFilter({
                    name: 'custbody_scv_qc_serial_code', 
                    operator: "contains", 
                    values: _params.custpage_qc_serial
                }))
            }

            let arrResult = constSearchWOForCompletionDet.getDataSource(myFilters);

            return arrResult;
        }
        
        const writeCacheData = (_params) => {
            let primaryKey = _params.custpage_externalid + "_" + _params.keyCache;

            let objRes = {};

            let objDataStore = constDataStore.loadDataStoreFile({fileName: _params.custpage_externalid});
            if(!!objDataStore){
                objRes = {...objDataStore};
            }

            objRes[_params.keyCache] = typeof(_params.data) == "string" ? JSON.parse(_params.data) :_params.data;

            constDataStore.setDataStore(_params.custpage_externalid, objRes);

            constDataStore.saveDataStoreFile({
                key: _params.custpage_externalid,
                fileName: _params.custpage_externalid,
            });

            return {
                primaryKey: primaryKey
            };
        }

        const readCacheData = (_params, _keyCache) => {
            let objRes = {};
            
            let objDataStore = constDataStore.loadDataStoreFile({fileName: _params.custpage_externalid});
            if(!!objDataStore){
                objRes = {...objDataStore};
            }
            
            return !!_keyCache ? objRes[_keyCache] : objRes;
        }

        const createAssembly = (_params, _arrResult) => {
            let objResponse = {
                queueId: "",
                arrResultCreate: [],
            }

            let arrErrWO = [];

            if(_arrResult.length <= 5){
                for(let i = 0; i < _arrResult.length; i++){
                    let objResWO = _arrResult[i];

                    try{
                        log.error("huy-objResWO",objResWO)
                        let asbRecId = constAssemblyBuild.createAssemblyByWorkOrder(objResWO);
                        
                        objResponse.arrResultCreate.push({
                            custpage_col_wo_id: objResWO.custpage_col_wo_id,
                            custpage_col_asb_id: asbRecId,
                            custpage_col_msg: "Success"
                        });
                    }
                    catch(err){
                        log.error("Error: Try-Cache-createAssembly: " + objResWO.custpage_col_wo, err)
                        log.error("huy-err-params", {
                            custpage_externalid: _params?.custpage_externalid,
                            isNext: _params?.isNext,
                            custpage_currentstep: _params?.custpage_currentstep
                        })
                        objResponse.arrResultCreate.push({
                            custpage_col_wo_id: objResWO.custpage_col_wo_id,
                            custpage_col_asb_id: "",
                            custpage_col_msg: "Error:" + err?.message?.toString()
                        });

                        arrErrWO.push({
                            custpage_col_wo_id: objResWO.custpage_col_wo_id,
                            custpage_col_item: objResWO.custpage_col_item,
                            custpage_col_location: objResWO.custpage_col_location,
                            custpage_col_subsidiary: objResWO.custpage_col_subsidiary,
                            custpage_col_workcenter: objResWO.custpage_col_workcenter,
                            custpage_col_islottitem: objResWO.custpage_col_islottitem,
                            custpage_col_itemtype: objResWO.custpage_col_itemtype,
                            custpage_col_slitgrp: objResWO.custpage_col_slitgrp || "",
                        });

                        constErrFile.createErrorFile(objResWO, err.message);
                    }
                    
                }
            }
            else{
                let jsonFile = file.create({
                    name: lbf.uuidv4() + '.json',
                    fileType: "JSON",
                    contents: JSON.stringify(_arrResult),
                    folder: 2150
                });
                let jsonFileId = jsonFile.save();

                let objParamsInput = {dataFileId: jsonFileId};

                objResponse.queueId = constQueueJob.createQueueJobScript(JSON.stringify(objParamsInput));
                constQueueJob.processQueueJobScript();
            }
            
            //#region xử lý cache data
            if(arrErrWO.length > 0){
                let objResOfStore = readCacheData(_params)||{};

                let arrResWO_step01 = objResOfStore.custpage_sl_wo||[];
                let arrResComponent_step01 = objResOfStore.custpage_sl_component||[];

                let arrResWO_step01_new = [], arrResComponent_step01_new = [];

                let arrResWO_step02 = objResOfStore.custpage_sl_wo_1||[];
                let arrResComponent_step02 = objResOfStore.custpage_sl_component_1||[];

                let arrResWO_step02_new = [], arrResComponent_step02_new = [];

                let arrResWO_step03 = objResOfStore.custpage_sl_wo_2||[];
                let arrResComponent_step03 = objResOfStore.custpage_sl_component_2||[];

                let arrResWO_step03_new = [], arrResComponent_step03_new = [];

                for(let i = 0; i < arrErrWO.length; i++){
                    let objErrWO = arrErrWO[i];
                    let woId = objErrWO.custpage_col_wo_id;

                    let arrResWO_step01_err = arrResWO_step01.filter(e => e.custpage_col_wo_id == woId);
                    arrResWO_step01_new = arrResWO_step01_new.concat(arrResWO_step01_err);

                    let arrResComponent_step01_err = arrResComponent_step01.filter(e => e.custpage_col_wo_id == woId);
                    arrResComponent_step01_new = arrResComponent_step01_new.concat(arrResComponent_step01_err);

                    let arrResWO_step02_err = arrResWO_step02.filter(e => e.custpage_col_wo_id == woId);
                    arrResWO_step02_new = arrResWO_step02_new.concat(arrResWO_step02_err);

                    let arrResComponent_step02_err = arrResComponent_step02.filter(e => e.custpage_col_wo_id == woId);
                    arrResComponent_step02_new = arrResComponent_step02_new.concat(arrResComponent_step02_err);

                    let arrResWO_step03_err = arrResWO_step03.filter(e => e.custpage_col_wo_id == woId);
                    arrResWO_step03_new = arrResWO_step03_new.concat(arrResWO_step03_err);
                    
                    let arrResComponent_step03_err = arrResComponent_step03.filter(e => e.custpage_col_item == objErrWO.custpage_col_item
                        && e.custpage_col_location == objErrWO.custpage_col_location
                        && e.custpage_col_subsidiary == objErrWO.custpage_col_subsidiary
                        && e.custpage_col_workcenter == objErrWO.custpage_col_workcenter
                        && e.custpage_col_islottitem == objErrWO.custpage_col_islottitem
                        && e.custpage_col_itemtype == objErrWO.custpage_col_itemtype
                        && (e.custpage_col_slitgrp || "") == (objErrWO.custpage_col_slitgrp || "")
                    );
                    arrResComponent_step03_new = arrResComponent_step03_new.concat(arrResComponent_step03_err);
                }

                writeCacheData({
                    custpage_externalid: _params.custpage_externalid,
                    keyCache: "custpage_sl_wo",
                    data: arrResWO_step01_new
                });
                writeCacheData({
                    custpage_externalid: _params.custpage_externalid,
                    keyCache: "custpage_sl_component",
                    data: arrResComponent_step01_new
                });
                writeCacheData({
                    custpage_externalid: _params.custpage_externalid,
                    keyCache: "custpage_sl_wo_1",
                    data: arrResWO_step02_new
                });
                writeCacheData({
                    custpage_externalid: _params.custpage_externalid,
                    keyCache: "custpage_sl_component_1",
                    data: arrResComponent_step02_new
                });
                writeCacheData({
                    custpage_externalid: _params.custpage_externalid,
                    keyCache: "custpage_sl_wo_2",
                    data: arrResWO_step03_new
                });
                writeCacheData({
                    custpage_externalid: _params.custpage_externalid,
                    keyCache: "custpage_sl_component_2",
                    data: arrResComponent_step03_new
                });
            }
            else{
                /* constCache.removeData(_params.custpage_externalid + "_custpage_sl_wo");
                constCache.removeData(_params.custpage_externalid + "_custpage_sl_component");
                constCache.removeData(_params.custpage_externalid + "_custpage_sl_wo_1");
                constCache.removeData(_params.custpage_externalid + "_custpage_sl_component_1");
                constCache.removeData(_params.custpage_externalid + "_custpage_sl_wo_2");
                constCache.removeData(_params.custpage_externalid + "_custpage_sl_component_2"); */
            }
            //#endregion

            return objResponse;
        }

        const createAssemblyFromWO = (_params) =>{
            constForm.setMainKeyInventoryDetail("INVENTORYDETAIL_" + _params.custpage_externalid);

            let objResponse = {
                isSuccess: true,
                message: "",
                queueId: ""
            }

            let objResDataSource = getDataSource_ViewResult(_params);
            if(objResDataSource.arrResult.length > 0){
                let objResAsb = createAssembly(_params, objResDataSource.arrResult);
                if(objResAsb.arrResultCreate.length > 0){
                    writeCacheData({
                        custpage_externalid: _params.custpage_externalid,
                        keyCache: "asbcreated",
                        data: objResAsb.arrResultCreate
                    })
                }
                if(!!objResAsb.queueId){
                    objResponse.queueId = objResAsb.queueId;
                    writeCacheData({
                        custpage_externalid: _params.custpage_externalid,
                        keyCache: "queueid",
                        data: objResAsb.queueId
                    })
                }
            }

            return objResponse;
        }

        const loadFieldDataLocation = (_field, _subsidiaryId) => {
            if(!_subsidiaryId) return;

            let arrResult = constLocation.getDataSource([
                search.createFilter({
                    name: 'subsidiary',
                    operator: "anyof",
                    values: _subsidiaryId
                }),
                search.createFilter({
                    name: 'custrecord_scv_loc_type',
                    operator: "anyof",
                    values: constLocationType.RECORDS.SANXUAT.ID
                }),
            ]);

            constRecord.initLoadFieldServer(_field, {
                displayExpr: "name", valueExpr: "internalid", data: arrResult
            }, true)
        }

        const loadFieldDataWorkCenter = (_field, _locationId) => {
            if(!_locationId) return;

            let arrResult = constEntityGroup.getDataSource(
                search.createFilter({
                    name: 'custentity_mfgmob_wclocation',
                    operator: "anyof",
                    values: _locationId
                })
            );

            constRecord.initLoadFieldServer(_field, {
                displayExpr: "groupname", valueExpr: "internalid", data: arrResult
            }, true)
        }

        const loadFieldDataProdLot = (_field) => {
            let arrResult = constSearchMfgLot.getDataSource();
            
            constRecord.initLoadFieldServer(_field, {
                displayExpr: "lot_number", valueExpr: "lot_number", data: arrResult
            }, false)
        }
        
        return {onRequest}

    });