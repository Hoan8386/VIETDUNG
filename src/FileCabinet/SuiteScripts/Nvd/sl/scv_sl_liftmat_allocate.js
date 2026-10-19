/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  20 Nov 2024         Huy Pham			    Init, create file, Tính toán phân bổ trọng lượng nâng hạ trong sản xuất, from mr.Bính(https://app.clickup.com/t/86cx40ye7)
 *  19 Dec 2024         Huy Pham                Update chức năng tự mapping asb, from mr.Bính(https://app.clickup.com/t/86cx40ye7?comment=90160080579394)
 *  23 Dec 2024         Huy Pham                Thay đổi logic lưu history , from mr.Bính(https://app.clickup.com/t/86cx40ye7?comment=90160081199408)
 *  24 Dec 2024         Huy Pham                Bổ sung logic Group Lifting/Lowering, from mr.Bính(meeting)
 */
/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget','N/runtime', 'N/search', 'N/record', 'N/ui/message', 'N/file',
    '../lib/scv_lib_function.js', '../olib/alasql/alasql.min@1.7.3', '../lib/scv_lib_common_html.js',
    '../lib/scv_lib_report.js',

    '../cons/scv_cons_format.js',
    '../cons/scv_cons_record.js',
    '../cons/scv_cons_datastore.js',
    '../cons/scv_cons_cache.js',

    '../cons/scv_cons_lifttype.js',
    '../cons/scv_cons_assemblybuild.js',
    '../cons/scv_cons_queue_job.js',
    '../cons/scv_cons_location.js',
    '../cons/scv_cons_allocated_ab_lift_lower.js',
    '../cons/scv_cons_entitygroup.js',
    '../cons/scv_cons_subsidiary.js',
    '../cons/scv_cons_locationtype.js',
    '../cons/scv_cons_err_file.js',

    '../cons/scv_cons_search_lift_mat_hist_allocate.js',
    '../cons/scv_cons_search_asb_for_allocation_mat.js',
    '../cons/scv_cons_search_lift_lower_history_tans.js',
    '../cons/scv_cons_search_mfg_lot.js'
],
    
    (serverWidget,runtime, search, record, message, file,
        lbf, alasql, libHtml,
        libRpt,

        constFormat,
        constRecord,
        constDataStore,
        constCache,

        constLiftType,
        constAssemblyBuild,
        constQueueJob,
        constLocation,
        constAllocatedAbLiftLower,
        constEntityGroup,
        constSubsidiary,
        constLocationType,
        constErrFile,

        constSearchLiftMatHistAllocate,
        constSearchAbsForAllocationMat,
        constSearchLiftLowerHistoryTans,
        constSearchMfgLot
    ) => {
        const STEP_ACTION = {
            LOAD_DATA: {
                ID: 0,
                NAME: "Load Data"
            },
            MAPPING: {
                ID: 1,
                NAME: "Mapping"
            },
            PROCESSING: {
                ID: 2,
                NAME: "Processing"
            }
        }
        const CUR_SCRIPT = {
            ID: "customscript_scv_sl_liftmat_allocate",
            DEPLOYID_UI: "customdeploy_scv_sl_liftmat_allocate",
            DEPLOYID_DATA: "customdeploy_scv_sl_liftmat_allocate_dat"
        }
        
        const EXCUTTE_MAP_REDUCE = {
            ID: "customscript_scv_mr_liftmat_allocate",
            DEPLOYID: "customdeploy_scv_mr_liftmat_allocate",
            PARAMSID: "custscript_scv_mr_liftmat_allocate_param"
        }
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
            let curScript = runtime.getCurrentScript();
    
            if(curScript.deploymentId == CUR_SCRIPT.DEPLOYID_DATA){
                var objResponse = {data: []};
                
				switch(params.action){
                    case "writeCacheData":
						objResponse.data = writeCacheData(params);
						break;
                    case "readCacheData":
                        objResponse.data = readCacheData(params);
                        break;
                    case "updateAllocateMaterial":
                        objResponse.data = updateAllocateMaterial(JSON.parse(params.body));
                        break;
				}

				response.setHeader({
                    name: 'Content-Type',
                    value: 'application/json'
                });

                response.write(JSON.stringify(objResponse));
            }
            else{
                if(request.method == "GET"){
                    params.custpage_currentstep = params.custpage_currentstep||STEP_ACTION.LOAD_DATA.ID;
    
                    let form = onCreateFormUI(params);
    
                    if(params.custpage_currentstep == STEP_ACTION.LOAD_DATA.ID){
                        onCreateFormUI_LoadData(form, params);
                    }
                    else if(params.custpage_currentstep == STEP_ACTION.MAPPING.ID){
                        onCreateFormUI_Mapping(form, params);
                    }
                    else if(params.custpage_currentstep == STEP_ACTION.PROCESSING.ID){
                        onCreateFormUI_Processing(form, params);
                    }
    
                    response.writePage(form);
                }
            }
        }

        const onCreateFormUI = (_params) =>{
            let title = "Phân bổ trọng lượng nâng hạ: ";
            if(_params.custpage_currentstep == STEP_ACTION.LOAD_DATA.ID){
                title += STEP_ACTION.LOAD_DATA.NAME;
            }
            else if(_params.custpage_currentstep == STEP_ACTION.MAPPING.ID){
                title += STEP_ACTION.MAPPING.NAME;
            }
            else if(_params.custpage_currentstep == STEP_ACTION.PROCESSING.ID){
                title += STEP_ACTION.PROCESSING.NAME;
            }

            let form = serverWidget.createForm({title:title});
            form.clientScriptModulePath = '../cs/scv_cs_sl_liftmat_allocate.js';

            libRpt.addPageLinkForm(form, [
                constSearchLiftMatHistAllocate.ID, constSearchAbsForAllocationMat.ID,
                constSearchLiftLowerHistoryTans.ID, constSearchMfgLot.ID
            ]);
            lbf.pinHeaderSublist(form);

            let custpage_currentstep = form.addField({
                id: 'custpage_currentstep',
                type: "text",
                label: 'Current Step'
            }).updateDisplayType({
                displayType: "hidden"
            }).setHelpText("Current Step");
            custpage_currentstep.defaultValue = !!_params.custpage_currentstep ? _params.custpage_currentstep : STEP_ACTION.LOAD_DATA.ID;

            let custpage_externalid = form.addField({
                id: 'custpage_externalid',
                type: "text",
                label: 'Extnernal ID'
            }).updateDisplayType({
                displayType: "hidden"
            }).setHelpText("Extnernal ID");
            custpage_externalid.defaultValue = !!_params.custpage_externalid  ? _params.custpage_externalid : lbf.uuidv4();

            return form;
        }

        const onCreateFormUI_LoadData = (_form, _params) => {
            _form.addButton({id: "custpage_btn_search", label: "Search", functionName: "onSearchResult('F')"});
            _form.addButton({id: "custpage_btn_next", label: "Next >", functionName: "nextAction()"});

            libHtml.addClassBtnSubmit(_form, "custpage_btn_search");

            let curUser = runtime.getCurrentUser();

            if(!_params.custpage_subsidiary){
                _params.custpage_subsidiary = curUser.subsidiary;
            }

            let mainGrp = lbf.addFieldGroup(_form, "fieldgrp_main","Filter Parameters");

            let custpage_subsidiary = _form.addField({
                id: 'custpage_subsidiary',
                type: "select",
                label: 'Công ty/Chi nhánh',
                container: mainGrp.id
            }).setHelpText("Subsidiary");
            custpage_subsidiary.isMandatory = true;
            constSubsidiary.initLoadFieldSubsidiaryByUserRole(custpage_subsidiary);

            let custpage_location = _form.addField({
                id: 'custpage_location',
                type: "select",
                label: 'Kho',
                container: mainGrp.id
            }).setHelpText("Location");
            custpage_location.isMandatory = true;
            loadFieldDataLocation(custpage_location, _params.custpage_subsidiary);

            let custpage_workcenter = _form.addField({
                id: 'custpage_workcenter',
                type: "select",
                //source: "-8",
                label: 'Máy',
                container: mainGrp.id
            }).setHelpText("Work Center");
            loadFieldDataWorkCenter(custpage_workcenter, _params.custpage_location);

            let custpage_fromdt = _form.addField({
                id: 'custpage_fromdt',
                type: "date",
                label: 'Từ ngày',
                container: mainGrp.id
            }).updateLayoutType({
                layoutType: "startrow"
            }).setHelpText("From Date");
            custpage_fromdt.isMandatory = true;
            
            let custpage_todt = _form.addField({
                id: 'custpage_todt',
                type: "date",
                label: 'Đến ngày',
                container: mainGrp.id
            }).updateLayoutType({
                layoutType: "endrow"
            }).setHelpText("To Date");
            custpage_todt.isMandatory = true;

            let custpage_prod_lotno = _form.addField({
                id: 'custpage_prod_lotno',
                type: "multiselect",
                label: 'Số lô',
                container: mainGrp.id
            }).updateBreakType({
                breakType : "startcol"
            }).setHelpText("Prod Lot No");
            loadFieldDataProdLot(custpage_prod_lotno);

            let custpage_item = _form.addField({
                id: 'custpage_item',
                type: "multiselect",
                source: "item",
                label: 'Items',
                container: mainGrp.id
            }).setHelpText("Items");

            let custpage_mat_lotno = _form.addField({
                id: 'custpage_mat_lotno',
                type: "text",
                label: 'Số lô nguyên liệu',
                container: mainGrp.id
            }).updateBreakType({
                breakType : "startcol"
            }).setHelpText("Mat Lot No");

            let custpage_qc_serial = _form.addField({
                id: 'custpage_qc_serial',
                type: "text",
                label: 'Số QC Serial',
                container: mainGrp.id
            }).setHelpText("QC Serial");

            let custpage_group_liftlower = _form.addField({
                id: 'custpage_group_liftlower',
                type: "checkbox",
                label: 'Nhóm nâng hạ',
                container: mainGrp.id
            }).setHelpText("Group Lifting/Lowering");

            if(_params.isSearch != "T"){
                if(!_params.custpage_fromdt) _params.custpage_fromdt = constFormat.getBeginOfMonth(new Date());
                if(!_params.custpage_todt) _params.custpage_todt = constFormat.getEndOfMonth(new Date());
            }

            if(_params.isBack == "T"){
                let isGroupLiftLower = _params.custpage_group_liftlower;

                let objParamsLoadData = readCacheData(_params, "params");

                _params = {..._params, ...objParamsLoadData};
                _params.custpage_group_liftlower = isGroupLiftLower;
            }
            
            if(!!_params.custpage_subsidiary) custpage_subsidiary.defaultValue = _params.custpage_subsidiary;
            if(!!_params.custpage_fromdt) custpage_fromdt.defaultValue = _params.custpage_fromdt;
            if(!!_params.custpage_todt) custpage_todt.defaultValue = _params.custpage_todt;
            if(!!_params.custpage_prod_lotno) custpage_prod_lotno.defaultValue = _params.custpage_prod_lotno.split(",");
            if(!!_params.custpage_mat_lotno) custpage_mat_lotno.defaultValue = _params.custpage_mat_lotno;
            if(!!_params.custpage_item) custpage_item.defaultValue = _params.custpage_item.split(",");
            if(!!_params.custpage_qc_serial) custpage_qc_serial.defaultValue = _params.custpage_qc_serial;
            if(!!_params.custpage_location) custpage_location.defaultValue = _params.custpage_location;
            if(!!_params.custpage_workcenter) custpage_workcenter.defaultValue = _params.custpage_workcenter;
            if(!!_params.custpage_group_liftlower) custpage_group_liftlower.defaultValue = _params.custpage_group_liftlower;
            
            let liftLowerTab = addTab(_form, "tab_liftlower", "Lifting/Lowering");
            let assBuildTab = addTab(_form, "tab_assbuild", "Assembly Builds");

            let objResDataSource = getDataSource_LoadData(_params);

            let liftLowerSublist = _form.addSublist({
                id : "custpage_sl_liftlower",
                type : "list",
                label : 'Danh sách nâng hạ',
                tab: liftLowerTab.id
            });
            liftLowerSublist.addButton({
                id : 'custpage_scv_btn_markall',
                label : 'Chọn tất',
                functionName: `markAllOfSublist('custpage_sl_liftlower', 'T')`
            });
            liftLowerSublist.addButton({
                id : 'custpage_scv_btn_unmarkall',
                label : 'Bỏ chọn tất',
                functionName: `markAllOfSublist('custpage_sl_liftlower', 'F')`
            });
            onCreateSublistColumn("custpage_sl_liftlower", liftLowerSublist, _params);

            let assBuildSublist = _form.addSublist({
                id : "custpage_sl_assbuild",
                type : "LIST",
                label : 'Thành phẩm đã SX',
                tab: assBuildTab.id
            });
            onCreateSublistColumn("custpage_sl_assbuild", assBuildSublist, _params);

            onRenderDataSublist(liftLowerSublist, getColumnOfSublist("custpage_sl_liftlower"), objResDataSource.arrResultLiftLower)
            onRenderDataSublist(assBuildSublist, getColumnOfSublist("custpage_sl_assbuild"), objResDataSource.arrResultAssBuild)

            return {
                form: _form,
                custpage_sl_liftlower: liftLowerSublist,
                custpage_sl_assbuild: assBuildSublist
            };
        }

        const getDataSource_LoadData = (_params) =>{
            let arrResultLiftLower = [], arrResultAssBuild = [];

            if(_params.isSearch != "T"){
                return {
                    arrResultLiftLower,
                    arrResultAssBuild
                };
            }

            let arrResultLiftLowerCache = [], arrResultAssBuildCache = [];
            if(_params.isBack == "T"){
                //read cache
                let objParamsLoadData = readCacheData(_params, "params");
                _params = {..._params, ...objParamsLoadData}

                arrResultLiftLowerCache = readCacheData(_params, "custpage_sl_liftlower")||[];
                arrResultAssBuildCache = readCacheData(_params, "custpage_sl_assbuild")||[];
            }

            let arrLiftMatHist = getDataSSLiftMatHistAllocate(_params);
            let arrLiftLowerHistTans = getDataSSLiftLowerHistoryTans(_params);
            let arrAbsAllocationMat = getDataSSAbsForAllocationMat(_params, arrLiftMatHist);
            
            arrLiftMatHist = alasql(`SELECT * FROM ? ORDER BY custrecord_scv_lift_mat_date_yyyymmddhh24miss ASC`, [arrLiftMatHist])
            let arrLiftMatHist_Nang = arrLiftMatHist.filter(e => e.custrecord_scv_lift_mat_lift_type == constLiftType.RECORDS.NANG.ID);
            let arrLiftMatHist_Ha = arrLiftMatHist.filter(e => e.custrecord_scv_lift_mat_lift_type == constLiftType.RECORDS.HA.ID);
            
            let arrProcessing = [];

            for(let i = 0; i < arrLiftMatHist_Nang.length; i++){
                let objLifMatHist_Nang = arrLiftMatHist_Nang[i];

                let objResProcessing = {
                    id: objLifMatHist_Nang.internalid,
                    name: objLifMatHist_Nang.name
                };

                let objRes_Nang = {};

                objRes_Nang.custpage_col_idxprocess = objLifMatHist_Nang.internalid;//lbf.uuidv4();
                objRes_Nang.custpage_col_chk = "F";
                objRes_Nang.custpage_col_internalid = objLifMatHist_Nang.internalid;
                objRes_Nang.custpage_col_type = objLifMatHist_Nang.custrecord_scv_lift_mat_lift_type;
                objRes_Nang.custpage_col_date = objLifMatHist_Nang.custrecord_scv_lift_mat_date;
                objRes_Nang.custpage_col_material = objLifMatHist_Nang.custrecord_scv_lift_mat_item;
                objRes_Nang.custpage_col_matlot = objLifMatHist_Nang.custrecord_scv_lift_mat_lot_serial;
                objRes_Nang.custpage_col_matlot_display = objLifMatHist_Nang.custrecord_scv_lift_mat_lot_serial_display;
                objRes_Nang.custpage_col_qcserial = objLifMatHist_Nang.custrecord_scv_lift_mat_qc_material;
                objRes_Nang.custpage_col_matqty = objLifMatHist_Nang.custrecord_scv_lift_mat_weight;
                objRes_Nang.custpage_col_units = objLifMatHist_Nang.custrecord_scv_lift_mat_units_display;
                objRes_Nang.custpage_col_location = objLifMatHist_Nang.custrecord_scv_lift_mat_location;
                objRes_Nang.custpage_col_shift = objLifMatHist_Nang.custrecord_scv_lift_mat_shift;
                objRes_Nang.custpage_col_workcenter = objLifMatHist_Nang.custrecord_scv_lift_mat_woc;
                objRes_Nang.custpage_col_prodlot = objLifMatHist_Nang.custrecord_scv_lift_mat_prod_lot;
                objRes_Nang.custpage_col_subsidiary = objLifMatHist_Nang.custrecord_scv_lift_mat_subsidiary;
                objRes_Nang.custpage_col_name = objLifMatHist_Nang.name;

                objRes_Nang.custrecord_scv_lift_mat_date_yyyymmddhh24miss_from = objLifMatHist_Nang.custrecord_scv_lift_mat_date_yyyymmddhh24miss;
                objRes_Nang.custrecord_scv_lift_mat_date_yyyymmddhh24miss_to = "";

                let objResCache = arrResultLiftLowerCache.find(e => e.custpage_col_internalid == objRes_Nang.custpage_col_internalid);
                if(!!objResCache){
                    objRes_Nang.custpage_col_chk = "T";
                }

                arrResultLiftLower.push(objRes_Nang);

                let objLifMatHist_Ha = arrLiftMatHist_Ha.find(e => !e.isMapped 
                    && e.custrecord_scv_lift_mat_date_yyyymmddhh24miss >= objLifMatHist_Nang.custrecord_scv_lift_mat_date_yyyymmddhh24miss
                    && e.custrecord_scv_lift_mat_item == objLifMatHist_Nang.custrecord_scv_lift_mat_item
                    && e.custrecord_scv_lift_mat_lot_serial == objLifMatHist_Nang.custrecord_scv_lift_mat_lot_serial
                    && e.custrecord_scv_lift_mat_qc_material == objLifMatHist_Nang.custrecord_scv_lift_mat_qc_material
                    && e.custrecord_scv_lift_mat_units_display == objLifMatHist_Nang.custrecord_scv_lift_mat_units_display
                    && e.custrecord_scv_lift_mat_location == objLifMatHist_Nang.custrecord_scv_lift_mat_location
                    && (!e.custrecord_scv_lift_mat_woc || e.custrecord_scv_lift_mat_woc == objLifMatHist_Nang.custrecord_scv_lift_mat_woc)
                    && e.custrecord_scv_lift_mat_subsidiary == objLifMatHist_Nang.custrecord_scv_lift_mat_subsidiary
                );
                if(!!objLifMatHist_Ha){
                    objResProcessing.name += " ~ " + objLifMatHist_Ha.name;
                    arrProcessing.push(objResProcessing);

                    let objRes_Ha = {};

                    objRes_Ha.custpage_col_idxprocess = objRes_Nang.custpage_col_idxprocess;
                    objRes_Ha.custpage_col_chk = "F";
                    objRes_Ha.custpage_col_internalid = objLifMatHist_Ha.internalid;
                    objRes_Ha.custpage_col_type = objLifMatHist_Ha.custrecord_scv_lift_mat_lift_type;
                    objRes_Ha.custpage_col_date = objLifMatHist_Ha.custrecord_scv_lift_mat_date;
                    objRes_Ha.custpage_col_material = objLifMatHist_Ha.custrecord_scv_lift_mat_item;
                    objRes_Ha.custpage_col_matlot = objLifMatHist_Ha.custrecord_scv_lift_mat_lot_serial;
                    objRes_Ha.custpage_col_matlot_display = objLifMatHist_Ha.custrecord_scv_lift_mat_lot_serial_display;
                    objRes_Ha.custpage_col_qcserial = objLifMatHist_Ha.custrecord_scv_lift_mat_qc_material;
                    objRes_Ha.custpage_col_matqty = objLifMatHist_Ha.custrecord_scv_lift_mat_weight;
                    objRes_Ha.custpage_col_units = objLifMatHist_Ha.custrecord_scv_lift_mat_units_display;
                    objRes_Ha.custpage_col_location = objLifMatHist_Ha.custrecord_scv_lift_mat_location;
                    objRes_Ha.custpage_col_shift = objLifMatHist_Ha.custrecord_scv_lift_mat_shift;
                    objRes_Ha.custpage_col_workcenter = objLifMatHist_Ha.custrecord_scv_lift_mat_woc;
                    objRes_Ha.custpage_col_prodlot = objLifMatHist_Ha.custrecord_scv_lift_mat_prod_lot;
                    objRes_Ha.custpage_col_subsidiary = objLifMatHist_Ha.custrecord_scv_lift_mat_subsidiary;
                    objRes_Ha.custpage_col_name = objLifMatHist_Ha.name;

                    objRes_Ha.custrecord_scv_lift_mat_date_yyyymmddhh24miss_from = objRes_Nang.custrecord_scv_lift_mat_date_yyyymmddhh24miss_from;
                    objRes_Ha.custrecord_scv_lift_mat_date_yyyymmddhh24miss_to = objLifMatHist_Ha.custrecord_scv_lift_mat_date_yyyymmddhh24miss;

                    objRes_Nang.custrecord_scv_lift_mat_date_yyyymmddhh24miss_to = objLifMatHist_Ha.custrecord_scv_lift_mat_date_yyyymmddhh24miss;
    
                    let objResCache = arrResultLiftLowerCache.find(e => e.custpage_col_internalid == objRes_Ha.custpage_col_internalid);
                    if(!!objResCache){
                        objRes_Ha.custpage_col_chk = "T";
                    }
    
                    arrResultLiftLower.push(objRes_Ha);

                    objLifMatHist_Ha.isMapped = true;
                }
            }

            constDataStore.setDataStore("arrProcessing", arrProcessing);
            
            for(let i = 0; i < arrAbsAllocationMat.length; i++){
                let objAbsAllocationMat = arrAbsAllocationMat[i];

                let objRes = {};

                objRes.custpage_col_idxprocess = "";
                objRes.custpage_col_internalid = objAbsAllocationMat.internalid;
                objRes.custpage_col_date = objAbsAllocationMat.trandate;
                objRes.custpage_col_tranid = objAbsAllocationMat.tranid;
                objRes.custpage_col_item = objAbsAllocationMat.item;
                objRes.custpage_col_serial_lotno = objAbsAllocationMat.serialnumber;
                objRes.custpage_col_qcserial = objAbsAllocationMat.custitemnumber_scv_item_num_color_seri;
                objRes.custpage_col_serialnumberquantity = Math.abs(objAbsAllocationMat.serialnumberquantity * 1);
                objRes.custpage_col_quantity = Math.abs(objAbsAllocationMat.quantity);
                objRes.custpage_col_prodlotno = objAbsAllocationMat.custbody_scv_assembly_lot;
                objRes.custpage_col_workcenter = objAbsAllocationMat.custbody_mfgmob_workcenter;
                objRes.custpage_col_workbench = objAbsAllocationMat.custbody_scv_work_bench;
                objRes.custpage_col_shift = objAbsAllocationMat.custbody_scv_shift;
                objRes.custpage_col_subsidiary = objAbsAllocationMat.subsidiary;
                objRes.custpage_col_location = objAbsAllocationMat.location;
                objRes.custpage_col_createdfrom = objAbsAllocationMat.createdfrom;
                objRes.custpage_col_lineid = objAbsAllocationMat.line;
                objRes.custpage_col_units = objAbsAllocationMat.unitabbreviation;
                objRes.custpage_col_lineuniquekey = objAbsAllocationMat.lineuniquekey;
                objRes.custpage_col_manual_qty = 0;
                
                let objResCache = arrResultAssBuildCache.find(e => e.custpage_col_internalid == objRes.custpage_col_internalid
                    && e.custpage_col_lineid == objRes.custpage_col_lineid
                );
                if(!!objResCache){
                    objRes.custpage_col_idxprocess = objResCache.custpage_col_idxprocess;
                }

                if(!objRes.custpage_col_idxprocess){
                    let objLiftLowerhistTans_find = arrLiftLowerHistTans.find(e => e.custrecord_scv_ab_lift_lower_ab_doc_no == objAbsAllocationMat.internalid
                        && e.custrecord_scv_lift_mat_lift_type == constLiftType.RECORDS.NANG.ID
                        && e.custrecord_scv_lift_mat_item == objRes.custpage_col_item
                        && e.custrecord_scv_lift_mat_lot_serial_display == objAbsAllocationMat.serialnumber
                        && e.custrecord_scv_lift_mat_qc_material == objRes.custpage_col_qcserial
                        && (!e.custrecord_scv_lift_mat_woc || e.custrecord_scv_lift_mat_woc == objRes.custpage_col_workcenter)
                        && e.custrecord_scv_lift_mat_subsidiary == objRes.custpage_col_subsidiary
                    );
                    
                    if(!!objLiftLowerhistTans_find){
                        objRes.custpage_col_idxprocess = objLiftLowerhistTans_find.internalid;
                        objRes.custpage_col_manual_qty = objLiftLowerhistTans_find.custrecord_scv_ab_lift_lower_manual_qty;
                    }
                }
                
                if(!objRes.custpage_col_idxprocess){
                    let objResLiftLower_find = arrResultLiftLower.find(e => e.custrecord_scv_lift_mat_date_yyyymmddhh24miss_from <= objAbsAllocationMat.trandate_yyyymmddhh24miss
                        && e.custrecord_scv_lift_mat_date_yyyymmddhh24miss_to >= objAbsAllocationMat.trandate_yyyymmddhh24miss
                        && e.custpage_col_material == objRes.custpage_col_item
                        && e.custpage_col_matlot_display == objRes.custpage_col_serial_lotno
                        && e.custpage_col_qcserial == objRes.custpage_col_qcserial
                        && (!e.custpage_col_workcenter || e.custpage_col_workcenter == objRes.custpage_col_workcenter)
                        && e.custpage_col_subsidiary == objRes.custpage_col_subsidiary);
                    
                    if(!!objResLiftLower_find){
                        objRes.custpage_col_idxprocess = objResLiftLower_find.custpage_col_idxprocess;
                    }
                }
                
                //objRes.custpage_col_idxprocess = "";
                //if(!objRes.custpage_col_idxprocess) continue;
                
                arrResultAssBuild.push(objRes);
            }

            return {
                arrResultLiftLower,
                arrResultAssBuild
            }
        }

        const onRenderDataSublist = (_sublist, _arrColumn, _arrResult) =>{
            for(let i = 0; i < _arrResult.length; i++){
                let objRes = _arrResult[i];

                for(let j = 0; j < _arrColumn.length; j++){
                    let colId = _arrColumn[j].id;

                    let val_col = objRes[colId];

                    if(lbf.isContainValue(val_col)){
                        _sublist.setSublistValue({id: colId, line: i, value: val_col});
                    }
                }
            }
        }

        const onCreateFormUI_Mapping = (_form, _params) => {
            _form.addButton({id: "custpage_btn_next", label: "< Back", functionName: "backAction()"});
            _form.addButton({id: "custpage_btn_submit", label: "Submit", functionName: "submitFinish()"});

            libHtml.addClassBtnSubmit(_form, "custpage_btn_submit");

            let mainGrp = lbf.addFieldGroup(_form, "fieldgrp_main","Information");
            let mappingTab = addTab(_form, "tab_mapping", "Mapping Details");

            let custpage_group_liftlower = _form.addField({
                id: 'custpage_group_liftlower',
                type: "checkbox",
                label: 'Nhóm nâng hạ',
                container: mainGrp.id
            }).updateDisplayType({
                displayType : 'inline'
            }).setHelpText("Group Lifting/Lowering");

            if(!!_params.custpage_group_liftlower) custpage_group_liftlower.defaultValue = _params.custpage_group_liftlower;

            let mappingSublist = _form.addSublist({
                id : "custpage_sl_mapping",
                type : "LIST",
                label : 'Ghép chi tiết',
                tab: mappingTab.id
            });
            onCreateSublistColumn("custpage_sl_mapping", mappingSublist, _params);

            let objResDataSource = getDataSource_Mapping(_params);
            
            onRenderDataSublist(mappingSublist, getColumnOfSublist("custpage_sl_mapping"), objResDataSource.arrResultMapping)

            return {
                form: _form,
                custpage_sl_mapping: mappingSublist
            };
        }

        const getDataSource_Mapping = (_params) =>{
            let arrResultMapping = [];

            let arrResultLiftLower = readCacheData(_params, "custpage_sl_liftlower")||[];
            let arrResultAssBuild = readCacheData(_params, "custpage_sl_assbuild")||[];

            let arrResultLiftLower_Nang = [];
            let arrResultLiftLower_Ha = arrResultLiftLower.filter(e => e.custpage_col_type == constLiftType.RECORDS.HA.ID);

            let isGroupLiftLower = _params.custpage_group_liftlower == "T";

            if(isGroupLiftLower){
                let arrResultLiftLower_NangTemp = arrResultLiftLower.filter(e => e.custpage_col_type == constLiftType.RECORDS.NANG.ID);
                let arrResultLiftLower_HaTemp = arrResultLiftLower.filter(e => e.custpage_col_type == constLiftType.RECORDS.HA.ID);
                
                arrResultLiftLower_Nang = getDataGroupLiftLower(arrResultLiftLower_NangTemp);
                arrResultLiftLower_Ha = getDataGroupLiftLower(arrResultLiftLower_HaTemp);
                
            }
            else{
                arrResultLiftLower_Nang = arrResultLiftLower.filter(e => e.custpage_col_type == constLiftType.RECORDS.NANG.ID);
                arrResultLiftLower_Ha = arrResultLiftLower.filter(e => e.custpage_col_type == constLiftType.RECORDS.HA.ID);
            }

            for(let i = 0; i < arrResultLiftLower_Nang.length; i++){
                let objResLiftLower_Nang = arrResultLiftLower_Nang[i];

                let objRes_Nang = {
                    custpage_col_idxprocess: objResLiftLower_Nang.custpage_col_idxprocess,
                    custpage_col_isdetail: "F",
                    custpage_col_type_tranid: constLiftType.RECORDS.NANG.NAME + ": " + objResLiftLower_Nang.custpage_col_name,
                    custpage_col_date: objResLiftLower_Nang.custpage_col_date,
                    custpage_col_mat: objResLiftLower_Nang.custpage_col_material,
                    custpage_col_matlot: objResLiftLower_Nang.custpage_col_matlot,
                    custpage_col_qcserial: objResLiftLower_Nang.custpage_col_qcserial,
                    custpage_col_mat_qty: objResLiftLower_Nang.custpage_col_matqty,
                    custpage_col_units: objResLiftLower_Nang.custpage_col_units,
                    custpage_col_locatiton: objResLiftLower_Nang.custpage_col_location,
                    custpage_col_shift: objResLiftLower_Nang.custpage_col_shift,
                    custpage_col_workcenter: objResLiftLower_Nang.custpage_col_workcenter,
                    custpage_col_prodlot: objResLiftLower_Nang.custpage_col_prodlot,
                    custpage_col_subsidiary: objResLiftLower_Nang.custpage_col_subsidiary,
                    custpage_col_liftid: objResLiftLower_Nang.custpage_col_internalid,
                    custpage_col_lowerid: ""
                };

                arrResultMapping.push(objRes_Nang);

                let objRes_Ha = {};
                let objResLiftLower_Ha = arrResultLiftLower_Ha.find(e => e.custpage_col_idxprocess == objRes_Nang.custpage_col_idxprocess);
                if(!!objResLiftLower_Ha){
                    objRes_Ha.custpage_col_idxprocess = objResLiftLower_Ha.custpage_col_idxprocess,
                    objRes_Ha.custpage_col_isdetail = "F";
                    objRes_Ha.custpage_col_type_tranid = constLiftType.RECORDS.HA.NAME + ": " + objResLiftLower_Ha.custpage_col_name;
                    objRes_Ha.custpage_col_date = objResLiftLower_Ha.custpage_col_date;
                    objRes_Ha.custpage_col_mat = objResLiftLower_Ha.custpage_col_material;
                    objRes_Ha.custpage_col_matlot = objResLiftLower_Ha.custpage_col_matlot;
                    objRes_Ha.custpage_col_qcserial = objResLiftLower_Ha.custpage_col_qcserial;
                    objRes_Ha.custpage_col_mat_qty = objResLiftLower_Ha.custpage_col_matqty;
                    objRes_Ha.custpage_col_units = objResLiftLower_Ha.custpage_col_units;
                    objRes_Ha.custpage_col_locatiton = objResLiftLower_Ha.custpage_col_location;
                    objRes_Ha.custpage_col_shift = objResLiftLower_Ha.custpage_col_shift;
                    objRes_Ha.custpage_col_workcenter = objResLiftLower_Ha.custpage_col_workcenter;
                    objRes_Ha.custpage_col_prodlot = objResLiftLower_Ha.custpage_col_prodlot;
                    objRes_Ha.custpage_col_subsidiary = objResLiftLower_Ha.custpage_col_subsidiary;
                    objRes_Ha.custpage_col_liftid = objRes_Nang.custpage_col_liftid;
                    objRes_Ha.custpage_col_lowerid = objResLiftLower_Ha.custpage_col_internalid;

                    objRes_Nang.custpage_col_lowerid = objResLiftLower_Ha.custpage_col_internalid;
                }

                let totalMatQty = 0;
                let totalDiffQtyNangHa = objRes_Nang.custpage_col_mat_qty - (objRes_Ha.custpage_col_mat_qty||0)
                let arrResultDetail = [];

                let arrIdxProcessMapping = objRes_Nang.custpage_col_idxprocess.split(",");
                
                let arrResultAssBuild_Detail = arrResultAssBuild.filter(e => arrIdxProcessMapping.includes(e.custpage_col_idxprocess.toString()));
                for(let j = 0; j < arrResultAssBuild_Detail.length; j++){
                    let objResAssBuild = arrResultAssBuild_Detail[j];

                    let objResDetail = {};

                    objResDetail.custpage_col_idxprocess = objResLiftLower_Nang.custpage_col_idxprocess;
                    objResDetail.custpage_col_isdetail = "T";
                    objResDetail.custpage_col_type_tranid = objResAssBuild.custpage_col_tranid;
                    objResDetail.custpage_col_date = objResAssBuild.custpage_col_date;
                    objResDetail.custpage_col_mat = objResAssBuild.custpage_col_item;
                    objResDetail.custpage_col_matlot = objResLiftLower_Nang.custpage_col_matlot;
                    objResDetail.custpage_col_qcserial = objResAssBuild.custpage_col_qcserial;
                    objResDetail.custpage_col_mat_qty = objResAssBuild.custpage_col_serialnumberquantity * 1;
                    objResDetail.custpage_col_percentrate = 0;
                    objResDetail.custpage_col_mat_qty_allocate = 0;
                    objResDetail.custpage_col_manual_qty = objResAssBuild.custpage_col_manual_qty * 1;
                    objResDetail.custpage_col_units = objResAssBuild.custpage_col_units;
                    objResDetail.custpage_col_locatiton = objResAssBuild.custpage_col_location;
                    objResDetail.custpage_col_shift = objResAssBuild.custpage_col_shift;
                    objResDetail.custpage_col_workcenter = objResAssBuild.custpage_col_workcenter;
                    objResDetail.custpage_col_prodlot = objResAssBuild.custpage_col_prodlotno;
                    objResDetail.custpage_col_subsidiary = objResAssBuild.custpage_col_subsidiary;
                    objResDetail.custpage_col_ab_id = objResAssBuild.custpage_col_internalid;
                    objResDetail.custpage_col_ab_lineid = objResAssBuild.custpage_col_lineid;
                    objResDetail.custpage_col_lineuniquekey = objResAssBuild.custpage_col_lineuniquekey;
                    objResDetail.custpage_col_liftid = objRes_Nang.custpage_col_liftid;
                    objResDetail.custpage_col_lowerid = objRes_Ha.custpage_col_lowerid;

                    objResDetail.qtyToCalc = 0;
                    if(objResDetail.custpage_col_manual_qty > 0){
                        objResDetail.qtyToCalc = objResDetail.custpage_col_manual_qty * 1;
                    }
                    else{
                        objResDetail.qtyToCalc = objResDetail.custpage_col_mat_qty * 1;
                    }

                    arrResultDetail.push(objResDetail);

                    totalMatQty += objResDetail.qtyToCalc * 1;
                }

                allocateDetail_Mapping(arrResultDetail, totalMatQty, totalDiffQtyNangHa);

                arrResultMapping = arrResultMapping.concat(arrResultDetail);

                if(!!objRes_Ha.custpage_col_idxprocess){
                    arrResultMapping.push(objRes_Ha);
                }
            }
            
            return {
                arrResultMapping
            }
        }

        const getDataGroupLiftLower = (_arrDataRaw) => {
            let arrKeyGroupHeader = [
                "custpage_col_material", "custpage_col_matlot", "custpage_col_qcserial", 
                "custpage_col_units", "custpage_col_location", "custpage_col_workcenter",
                "custpage_col_subsidiary", "custpage_col_matlot_display", "custpage_col_type"
            ];
            let arrKeyDetail = [
                "custpage_col_date", "custpage_col_shift", "custpage_col_prodlot",
                "custpage_col_name", "custpage_col_internalid", "custpage_col_idxprocess"
            ]

            let arrGroupLiftLower = alasql(`SELECT ${arrKeyGroupHeader.join(", ")}, 
                SUM(custpage_col_matqty) as custpage_col_matqty
            FROM ? 
            GROUP BY ${arrKeyGroupHeader.join(", ")} `, [_arrDataRaw]);

            for(let i = 0; i < arrGroupLiftLower.length; i++){
                let objRes = arrGroupLiftLower[i];

                let arrLiftLowerDetail = _arrDataRaw.filter(e=>{
                    return arrKeyGroupHeader.every(k=>e[k] == objRes[k]);
                });
                
                arrLiftLowerDetail.forEach(objLiftLowerDetail => {
                    arrKeyDetail.forEach(_keyId =>{
                        if(!!objLiftLowerDetail[_keyId]){
                            objRes[_keyId] = (objRes[_keyId]||"") + (!!objRes[_keyId] ? "," : "");

                            objRes[_keyId] += objLiftLowerDetail[_keyId]||"";
                        }
                    })
                })
            }

            return arrGroupLiftLower;
        }

        const allocateDetail_Mapping = (_arrDetail, _totalMatQty, _totalDiffQtyNangHa) =>{
            let totalActualRate = 0, totalActualQty = 0;
            
            const PRECISION_ROUND_PERCENT = 4;
            const PRECISION_ROUND_QTY = 2;

            for(let i = 0; i < _arrDetail.length; i++){
                let objResDetail = _arrDetail[i];
                
                objResDetail.custpage_col_percentrate = _totalMatQty == 0 ? 0 : (objResDetail.qtyToCalc/_totalMatQty) * 100;
                objResDetail.custpage_col_percentrate = constFormat.roundNumber(objResDetail.custpage_col_percentrate, PRECISION_ROUND_PERCENT);

                objResDetail.custpage_col_mat_qty_allocate = _totalDiffQtyNangHa * objResDetail.custpage_col_percentrate / 100;
                objResDetail.custpage_col_mat_qty_allocate = constFormat.roundNumber(objResDetail.custpage_col_mat_qty_allocate, PRECISION_ROUND_QTY);

                totalActualRate += objResDetail.custpage_col_percentrate;
                totalActualQty += objResDetail.custpage_col_mat_qty_allocate;
            }
            constRecord.recalcSyncBalanaceAllocation(_arrDetail, 100, totalActualRate, ["custpage_col_percentrate"], PRECISION_ROUND_PERCENT);
            constRecord.recalcSyncBalanaceAllocation(_arrDetail, _totalDiffQtyNangHa, totalActualQty, ["custpage_col_mat_qty_allocate"], PRECISION_ROUND_QTY);
        }

        const onCreateFormUI_Processing = (_form, _params) => {
            _form.addButton({id: "custpage_btn_cancel", label: "Cancel", functionName: "cancelAction()"});
            _form.addButton({id: "custpage_btn_refresh", label: "Refresh", functionName: "refreshAction()"});

            libHtml.addClassBtnSubmit(_form, "custpage_btn_refresh");

            let queueJobTab = addTab(_form, "tab_mapping", "Queue Job");

            let queueSublist = _form.addSublist({
                id : "custpage_sl_queue",
                type : "LIST",
                label : 'Danh sách chờ',
                tab: queueJobTab.id
            });
            onCreateSublistColumn("custpage_sl_queue", queueSublist, _params);

            let objResponse = readCacheData(_params, "updateAllocateMaterial");
            if(!!objResponse.message){
                _form.addPageInitMessage({type: message.Type.CONFIRMATION, message: objResponse.message, duration: -1});
            }

            if(!!objResponse.queueId){
                let status_display = search.lookupFields({
                    type: constQueueJob.TYPE,
                    id: objResponse.queueId,
                    columns: "custrecord_scv_queue_job_status"
                }).custrecord_scv_queue_job_status[0].text;
                
                _form.addPageInitMessage({type: message.Type.CONFIRMATION, message: "Job js " + status_display, duration: -1});
            }

            let objResDataSource = getDataSource_Processing(_params);

            onRenderDataSublist(queueSublist, getColumnOfSublist("custpage_sl_queue"), objResDataSource.arrResultProcessing);

            return {
                form: _form,
                custpage_sl_queue: queueSublist
            };
        }

        const getDataSource_Processing = (_params) =>{
            let arrResultProcessing = [];
            
            let arrQueue = constQueueJob.getDataQueueJob({
                custrecord_scv_queue_job_scriptid: EXCUTTE_MAP_REDUCE.ID,
                custrecord_scv_queue_job_deployid: EXCUTTE_MAP_REDUCE.DEPLOYID,
            });

            for(let i = 0; i < arrQueue.length; i++){
                let objQueue = arrQueue[i];

                let objRes = {
                    custpage_col_status: objQueue.custrecord_scv_queue_job_status_display,
                    custpage_col_owner: objQueue.owner_display,
                    custpage_col_note: objQueue.custrecord_scv_queue_job_note||"",
                    custpage_col_crtdt: objQueue.created_date
                };

                if(objRes.custpage_col_note.length > 3000){
                    objRes.custpage_col_note = objQueue.custrecord_scv_queue_job_note.substring(0, 3000) + "(more...)";
                }

                arrResultProcessing.push(objRes);
            }

            return {
                arrResultProcessing
            }
        }

        const onCreateSublistColumn = (_sublistId, _sublist, _params) => {
            let arrColumn = getColumnOfSublist(_sublistId)

            for(let i = 0; i< arrColumn.length; i++){
                let objCol = arrColumn[i];
                let field = _sublist.addField({
                    id : objCol.id,
                    type : objCol.type,
                    source: objCol.source||null,
                    label : objCol.label
                }).updateDisplayType({displayType: objCol.displayType||"inline"});

                field.isMandatory = objCol.isMandatory ?? false;

                if(_sublistId == "custpage_sl_assbuild" && objCol.id == "custpage_col_idxprocess"){
                    constRecord.initLoadFieldServer(field, {
                        data: constDataStore.getDataStore("arrProcessing"), 
                        valueExpr: "id", 
                        displayExpr: "name"
                    }, true);
                }

                if(!!objCol.defaultValue){
                    field.defaultValue = objCol.defaultValue;
                }
            }
        }

        const getColumnOfSublist = (_sublistId) =>{
            let arrColumn = [];
            
            if(_sublistId == "custpage_sl_liftlower"){
                arrColumn.push(
                    {id: "custpage_col_chk", label: "Chọn", type: "checkbox", displayType: "entry"},
                    {id: "custpage_col_type", label: "Loại", type: "select", source: "customlist_scv_lift_type"},
                    {id: "custpage_col_date", label: "Ngày", type: "text"},
                    {id: "custpage_col_material", label: "Nguyên vật liệu", type: "select", source: "item"},
                    {id: "custpage_col_matlot", label: "Số lô", type: "select", source: "inventorynumber"},
                    {id: "custpage_col_qcserial", label: "Số QC Serial", type: "text"},
                    {id: "custpage_col_matqty", label: "Số lượng", type: "float"},
                    {id: "custpage_col_units", label: "ĐVT", type: "text"},
                    {id: "custpage_col_location", label: "Kho", type: "select", source: "location"},
                    {id: "custpage_col_shift", label: "Ca làm việc", type: "select", source: "customrecord_scv_shift"},
                    {id: "custpage_col_workcenter", label: "Máy", type: "select", source: "-8"},
                    {id: "custpage_col_prodlot", label: "Số lô TP", type: "text"},
                    {id: "custpage_col_name", label: "LL Doc. No.", type: "text", displayType: "hidden"},
                    {id: "custpage_col_internalid", label: "Số nâng hạ", type: "select", source: "customrecord_scv_lifting_mat_history", displayType: "disabled"},
                    {id: "custpage_col_subsidiary", label: "Công ty/Chi nhánh", type: "select", source: "subsidiary"},
                    {id: "custpage_col_idxprocess", label: "Index Process", type: "text", displayType: "hidden"},
                    {id: "custpage_col_matlot_display", label: "Mat. Lot Display", type: "text", displayType: "hidden"},
                );
            }
            else if(_sublistId == "custpage_sl_assbuild"){
                arrColumn.push(
                    {id: "custpage_col_internalid", label: "Internal ID", type: "text"},
                    {id: "custpage_col_idxprocess", label: "Cặp nâng hạ", type: "select", displayType: "entry"},
                    {id: "custpage_col_date", label: "Ngày", type: "text"},
                    {id: "custpage_col_tranid", label: "Số giao dịch", type: "text"},
                    {id: "custpage_col_item", label: "Item", type: "select", source: "item"},
                    {id: "custpage_col_serial_lotno", label: "Số lô", type: "text"},
                    {id: "custpage_col_qcserial", label: "Số QC Serial", type: "text"},
                    {id: "custpage_col_serialnumberquantity", label: "Lượng theo lô", type: "text"},
                    {id: "custpage_col_quantity", label: "Số lượng", type: "float"},
                    {id: "custpage_col_manual_qty", label: "Lượng tự nhập", type: "float"},
                    {id: "custpage_col_prodlotno", label: "Số lô thành phẩm", type: "text"},
                    {id: "custpage_col_workcenter", label: "Máy", type: "select", source: "-8"},
                    {id: "custpage_col_workbench", label: "Work Bench", type: "select", source: "customrecord_scv_mfg_work_bench_op"},
                    {id: "custpage_col_shift", label: "Ca làm việc", type: "select", source: "customrecord_scv_shift"},
                    {id: "custpage_col_subsidiary", label: "Công ty/Chi nhánh", type: "select", source: "subsidiary"},
                    {id: "custpage_col_location", label: "Kho", type: "select", source: "location"},
                    {id: "custpage_col_createdfrom", label: "Tạo từ", type: "select", source: "transaction"},
                    {id: "custpage_col_lineid", label: "Line ID", type: "text"},
                    {id: "custpage_col_units", label: "ĐVT", type: "text"},
                    {id: "custpage_col_lineuniquekey", label: "Line Unique Key", type: "text"}
                );
            }
            else if(_sublistId == "custpage_sl_mapping"){
                arrColumn.push(
                    {id: "custpage_col_type_tranid", label: "Type/Doc. No", type: "text"},
                    {id: "custpage_col_date", label: "Ngày", type: "textarea"},
                    {id: "custpage_col_mat", label: "Nguyên vật liệu", type: "select", source: "item"},
                    {id: "custpage_col_matlot", label: "Số lô NVL", type: "select", source: "inventorynumber"},
                    {id: "custpage_col_qcserial", label: "Số QC Serial", type: "text"},
                    {id: "custpage_col_mat_qty", label: "Lượng", type: "float"},
                    {id: "custpage_col_percentrate", label: "Tỷ lệ %", type: "percent"},
                    {id: "custpage_col_mat_qty_allocate", label: "Lượng phân bổ", type: "float", displayType: "entry"},
                    {id: "custpage_col_manual_qty", label: "Lượng tự nhập", type: "float", displayType: "entry"},
                    {id: "custpage_col_units", label: "ĐVT", type: "text"},
                    {id: "custpage_col_locatiton", label: "Kho", type: "select", source: "location"},
                    {id: "custpage_col_shift", label: "Ca làm việc", type: "select", source: "customrecord_scv_shift"},
                    {id: "custpage_col_workcenter", label: "Máy", type: "select", source: "-8"},
                    {id: "custpage_col_prodlot", label: "Số lô thành phẩm", type: "textarea"},
                    {id: "custpage_col_subsidiary", label: "Công ty/Chi nhánh", type: "select", source: "subsidiary"},
                    {id: "custpage_col_ab_id", label: "AB H ID", type: "text"},
                    {id: "custpage_col_ab_lineid", label: "AB L ID", type: "text"},
                    {id: "custpage_col_lineuniquekey", label: "Line Unique Key", type: "text"},
                    {id: "custpage_col_isdetail", label: "Is Detail", type: "checkbox", displayType: "hidden"},
                    {id: "custpage_col_idxprocess", label: "Index Process", type: "text", displayType: "hidden"},
                    {id: "custpage_col_liftid", label: "Lift ID", type: "text", displayType: "hidden"},
                    {id: "custpage_col_lowerid", label: "Lower ID", type: "text", displayType: "hidden"},
                    {id: "custpage_col_matlot_display", label: "Mat. Lot Display", type: "text", displayType: "hidden"},
                );
            }
            else if(_sublistId == "custpage_sl_queue"){
                arrColumn.push(
                    {id: "custpage_col_status", label: "Trạng thái", type: "text"},
                    {id: "custpage_col_owner", label: "Người tạo", type: "text"},
                    {id: "custpage_col_note", label: "Ghi chú", type: "textarea"},
                    {id: "custpage_col_crtdt", label: "Ngày tạo", type: "text"}
                );
            }

            return arrColumn;
        }

        const addTab = (_form, _id,_label) => {
            let _obj = {id: _id, label: _label}
            _form.addTab(_obj);
            return _obj;
        }

        const getDataSSLiftMatHistAllocate = (_params) => {
            let myFilters = [];

            if(!!_params.custpage_subsidiary){
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_lift_mat_subsidiary', 
                    operator: "anyof", 
                    values: _params.custpage_subsidiary
                }))
            }

            if(!!_params.custpage_location){
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_lift_mat_location', 
                    operator: "anyof", 
                    values: _params.custpage_location
                }))
            }

            if(!!_params.custpage_item){
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_lift_mat_item', 
                    operator: "anyof", 
                    values: _params.custpage_item.split(",")
                }))
            }

            if(!!_params.custpage_workcenter){
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_lift_mat_woc', 
                    operator: "anyof", 
                    values: _params.custpage_workcenter
                }))
            }

            if(!!_params.custpage_fromdt){
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_lift_mat_date',
                    operator: search.Operator.ONORAFTER,
                    values: _params.custpage_fromdt
                }));
            }

            if(!!_params.custpage_todt){
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_lift_mat_date',
                    operator: search.Operator.ONORBEFORE,
                    values: _params.custpage_todt
                }));
            }

            if(!!_params.custpage_prod_lotno){
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_lift_mat_prod_lot', 
                    operator: "anyof", 
                    values: _params.custpage_prod_lotno.split(",")
                }))
            }

            if(!!_params.custpage_qc_serial){
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_lift_mat_qc_material', 
                    operator: "contains", 
                    values: _params.custpage_qc_serial
                }))
            }

            if(!!_params.custpage_mat_lotno){
                myFilters.push(search.createFilter({
                    name: 'formulatext',
                    formula: "{custrecord_scv_lift_mat_lot_serial}", 
                    operator: "contains", 
                    values: _params.custpage_mat_lotno
                }))
            }

            
            let arrResult = constSearchLiftMatHistAllocate.getDataSource(myFilters);

            return arrResult;
        }
        
        const getDataSSLiftLowerHistoryTans = (_params) => {
            let myFilters = [];

            if(!!_params.custpage_subsidiary){
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_lift_mat_subsidiary', 
                    operator: "anyof", 
                    values: _params.custpage_subsidiary
                }))
            }

            if(!!_params.custpage_location){
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_lift_mat_location', 
                    operator: "anyof", 
                    values: _params.custpage_location
                }))
            }

            if(!!_params.custpage_item){
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_lift_mat_item', 
                    operator: "anyof", 
                    values: _params.custpage_item.split(",")
                }))
            }

            if(!!_params.custpage_workcenter){
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_lift_mat_woc', 
                    operator: "anyof", 
                    values: _params.custpage_workcenter
                }))
            }

            if(!!_params.custpage_fromdt){
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_lift_mat_date',
                    operator: search.Operator.ONORAFTER,
                    values: _params.custpage_fromdt
                }));
            }

            if(!!_params.custpage_todt){
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_lift_mat_date',
                    operator: search.Operator.ONORBEFORE,
                    values: _params.custpage_todt
                }));
            }

            if(!!_params.custpage_prod_lotno){
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_lift_mat_prod_lot', 
                    operator: "anyof", 
                    values: _params.custpage_prod_lotno.split(",")
                }))
            }

            if(!!_params.custpage_qc_serial){
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_lift_mat_qc_material', 
                    operator: "contains", 
                    values: _params.custpage_qc_serial
                }))
            }

            if(!!_params.custpage_mat_lotno){
                myFilters.push(search.createFilter({
                    name: 'formulatext',
                    formula: "{custrecord_scv_lift_mat_lot_serial}", 
                    operator: "contains", 
                    values: _params.custpage_mat_lotno
                }))
            }
            
            let arrResult = constSearchLiftLowerHistoryTans.getDataSource(myFilters);

            return arrResult;
        }
        
        const getDataSSAbsForAllocationMat = (_params, _arrLiftMatHist) => {
            let myFilters = [];

            let arrItem = _arrLiftMatHist.filter(e => !!e.custrecord_scv_lift_mat_item);
            arrItem = alasql(`SELECT DISTINCT custrecord_scv_lift_mat_item FROM ? `, [arrItem]);
            let arrItemId = arrItem.map(e => e.custrecord_scv_lift_mat_item);

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
            else if(arrItemId.length > 0){
                myFilters.push(search.createFilter({
                    name: 'item', 
                    operator: "anyof", 
                    values: arrItemId
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

            let arrResult = constSearchAbsForAllocationMat.getDataSource(myFilters);

            return arrResult;
        }
        
        const writeCacheData = (_params) => {
            let primaryKey = _params.custpage_externalid + "_" + _params.keyCache;

            constCache.putDataByUser(primaryKey, typeof(_params.data) == "string" ? JSON.parse(_params.data) :_params.data );

            return {
                primaryKey: primaryKey
            };
        }

        const readCacheData = (_params, _keyCache) => {
            let primaryKey = _params.custpage_externalid + "_" + _keyCache;

            let objRes = constCache.getDataByUser(primaryKey);
            
            return objRes.data;
        }

        const updateAllocateMaterial = (_params) => {
            let objResponse = {
                isSuccess: true,
                message: "",
                queueId: ""
            }

            let arrAsb = _params.arrAsb;
            
            if(arrAsb.length <= 5){
                let arrrLiftLowerGroup = alasql(`SELECT DISTINCT liftId, lowerId FROM ?`, [arrAsb]);
                for(let i = 0; i < arrrLiftLowerGroup.length; i++){
                    let objLiftLower = arrrLiftLowerGroup[i];

                    let arrAsbId = arrAsb.filter(e => e.liftId == objLiftLower.liftId
                        && e.lowerId == objLiftLower.lowerId
                    );
                    arrAsbId = alasql(`SELECT DISTINCT internalid FROM ? `, [arrAsbId]).map(e => e.internalid);

                    let arrLiftId = objLiftLower.liftId.split(",");
                    let arrLowerId = objLiftLower.lowerId.split(",");

                    for(let j = 0; j < arrLiftId.length; j++){
                        let liftId = arrLiftId[j];
                        let lowerId = arrLowerId[j]||"";

                        record.submitFields({
                            type: 'customrecord_scv_lifting_mat_history',
                            id: liftId, 
                            values: {
                                custrecord_scv_lift_mat_document_related: lowerId,
                                custrecord_scv_lift_mat_ab_related: arrAsbId
                            },
                            options: {
                                enableSourcing: false, ignoreMandatoryFields : true
                            } 
                        })
                    }

                    constAllocatedAbLiftLower.deleteByLiftLowerHeader(objLiftLower.liftId);
                }

                let arrMsg = [];
                for(let i = 0; i < arrAsb.length; i++){
                    let objAsb = arrAsb[i];

                    try{
                        constAssemblyBuild.allocateComponent(objAsb.internalid, objAsb.components);
                        arrMsg.push(objAsb.tranid + ": Completed.");

                        constAllocatedAbLiftLower.allocateComponent(objAsb.liftId, objAsb.components);
                    }
                    catch(err){
                        arrMsg.push(objAsb.tranid + ": Error - " + err.message);
                        log.error("Error: Try-Catch-updateAllocateMaterial", err)

                        constErrFile.createErrorFile(objAsb, err.message);
                    }
                }
                objResponse.message = arrMsg.join("<br/>");
            }
            else{
                let jsonFile = file.create({
                    name: lbf.uuidv4() + '.json',
                    fileType: "JSON",
                    contents: JSON.stringify({..._params}),
                    folder: 2298
                });
                let jsonFileId = jsonFile.save();

                let objParamsInput = {dataFileId: jsonFileId};

                objResponse.queueId = constQueueJob.createQueueJob("MAP_REDUCE", EXCUTTE_MAP_REDUCE.ID, EXCUTTE_MAP_REDUCE.DEPLOYID, EXCUTTE_MAP_REDUCE.PARAMSID, JSON.stringify(objParamsInput));
                constQueueJob.processQueueJob(EXCUTTE_MAP_REDUCE.ID, EXCUTTE_MAP_REDUCE.DEPLOYID);
            }

            writeCacheData({
                custpage_externalid: _params.custpage_externalid,
                keyCache: "updateAllocateMaterial",
                data: objResponse
            });

            constCache.removeDataByUser(_params.custpage_externalid + "_params");
            constCache.removeDataByUser(_params.custpage_externalid + "_custpage_sl_mapping");
            constCache.removeDataByUser(_params.custpage_externalid + "_custpage_sl_liftlower");
            constCache.removeDataByUser(_params.custpage_externalid + "_custpage_sl_assbuild");
            
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
