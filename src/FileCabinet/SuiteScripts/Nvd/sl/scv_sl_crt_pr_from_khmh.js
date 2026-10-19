/**
 * Nội dung: Tạo PR From KHMH
 * keyword:
 * - PO: Kế hoạch mua hàng {custompurchase_scv_purchase_plan}
 * - PR: Purchase Request {custompurchase_scv_purchase_request}
 * =======================================================================================
 *  Date                Author                  Description
 *  13 Dec 2024		    Khanh Tran			    Init, create file. Tạo Purchase Request từ Kế hoạch mua hàng from mr.Hải(https://app.clickup.com/t/86cxa8316)
 */
/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record', 'N/runtime', 'N/search', 'N/ui/serverWidget', 'N/url', 'N/format', 
    '../lib/scv_lib_function.js', '../cons/scv_cons_ordertype.js',
    '../cons/scv_cons_search_list_pur_plan.js',
    '../cons/scv_cons_search_purplan_pr_remain.js',
    '../cons/scv_cons_record.js',
    '../cons/scv_cons_purchaseplan.js',
],
    /**
 * @param{record} record
 * @param{runtime} runtime
 * @param{search} search
 * @param{serverWidget} serverWidget
 * @param{url} url
 */
    (record, runtime, search, serverWidget, url, format, 
        lbf, constOrderType,
        constSearchListPurPlan, 
        constSearchPurPlanPRRemain, 
        constRecord,
        constPurchasePlan
    ) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const CUR_SCRIPT = {
            ID: 'customscript_scv_sl_crt_pr_fr_khmh',
            DEPLOYID_UI: 'customdeploy_scv_sl_crt_pr_fr_khmh',
            DEPLOYID_DATA: 'customdeploy_scv_sl_crt_pr_fr_khmh_data'
        }

        const onRequest = (scriptContext) => {
            let response = scriptContext.response;
            let request = scriptContext.request;
            let params = request.parameters;
            let curScript = runtime.getCurrentScript();
            if(curScript.deploymentId == CUR_SCRIPT.DEPLOYID_DATA){
                let objResponse = {data: [], isSuccess: true, msg: ''};
                try {
                    if(params.action == 'createRecord'){
                        objResponse = createRecord(params);
                    }
                    
                    response.setHeader({name: 'Content-Type', value: 'application/json'});
                    response.write(JSON.stringify(objResponse));
                } catch (error) {
                    log.error('error - post action: ' + params.action, error);
                    objResponse = {isSuccess: false, msg: `${error.message}`};
                    response.write(JSON.stringify(objResponse));
                }
                
            }else{
                if(scriptContext.request.method == 'GET'){
                    let mainForm = onCreateFormUI(params);
                    if(params.isSearch == 'T'){
                        mainForm.form.addSubmitButton("Create PR");
                        let results = getDataResultMapped(params);
                        renderDataSublist(mainForm.sublist, results);
                    }

                    response.writePage(mainForm.form);
                }
            }
        }

        const createRecord = (params) => {
            let objData = JSON.parse(params.objData);log.error('objData', objData)
            let {paramFilter, arrLine} = objData;
            let objHeader = arrLine[0];
            let curRec = record.create({type: 'custompurchase_scv_purchase_request', isDynamic: true});
            if(paramFilter.custpage_def_date){
                curRec.setValue('trandate', format.parse({value: paramFilter.custpage_def_date, type: 'date'}))
            }

            lbf.setValueData(curRec, [
                'entity',
                'subsidiary', 
                'custbody_scv_order_type',
                'department', 
                'custbody_scv_pur_plan_doc', 'memo',
            ], [
                146,
                objHeader.subsidiary, 
                constOrderType.RECORDS.MUA_HANG_THEO_KE_HOACH.ID,
                objHeader.department,
                objHeader.internalid, objHeader.memo, 
            ]);
            let sl = 'item';
            arrLine.forEach((obj, i) => {
                curRec.selectNewLine({sublistId: sl});
                let expectedreceiptdate = '';
                if(obj.ngay_can_hang){
                    expectedreceiptdate = format.parse({value: obj.ngay_can_hang, type: 'date'});
                }

                lbf.setCurrentSublistValueData(curRec, sl, [
                    'item', 'units', 'custcol_scv_plan_qty', 'quantity',
                    'department', 'custcol_scv_memo',
                    'custcol_scv_plan_approve_qty', 'custcol_scv_ori_lineid',
                    'custcol_scv_market_number', 'custcol_scv_po_properties'
                ], [
                    obj.item, obj.units, obj.qty * 1, 0,
                    obj.department, obj.memo_line, 
                    obj.sl_duyet_mua * 1, obj.oriLineId, 
                    obj.so_hieu_market, obj.mo_ta_chi_tiet_hh, 
                ]);
                curRec.commitLine({sublistId: sl});
            })

            let recId = curRec.save({enableSourcing: false, ignoreMandatoryFields: true});log.error('recId', recId)
            if(recId){
                let recName = search.lookupFields({ type: 'custompurchase_scv_purchase_request', id: recId, columns: ['tranid'] }).tranid;
                let urlRec = url.resolveRecord({ recordType: 'custompurchase_scv_purchase_request', recordId: recId });
                let msg = `<a href="${urlRec}" target="_blank">Create: ${recName}</a>`;
                return {data: recId, isSuccess: true, msg: msg};
            }
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

        const getDataResultMapped = (params) => {
            let arrPP = getDataSS_ListPurPlan(params);
            if(arrPP.length == 0) return [];

            let oriLineIds = arrPP.map(e => e.oriLineId);
            let arrReam = getDataSS_PurPlanPRRemain(oriLineIds);
            let results = [];
            arrPP.forEach(obj => {
                let objRes = obj;
                objRes.qty_remaining = 0;
                let objRemain = arrReam.find(e => e.oriLineId == obj.oriLineId);
                if(objRemain){
                    objRes.qty_remaining = objRemain.sl_khmh_con_lai;
                    objRes.qty = objRemain.sl_khmh;
                }
             
                if(objRes.qty_remaining <= 0) return;

                objRes.json_data = JSON.stringify(objRes);
                results.push(objRes);
            })
            return results
        }

        const getDataSS_PurPlanPRRemain = (oriLineIds) => {
            let myFilters = [];
            if(oriLineIds.length > 0){
                myFilters.push(
                    search.createFilter({name: 'formulanumeric', formula: `CASE WHEN {custcol_scv_ori_lineid} IN (${oriLineIds.map(id => `'${id}'`).join(",")}) THEN 1 ELSE 0 END`, operator: "equalto", values: 1})
                );
            }

            return constSearchPurPlanPRRemain.getDataSource(myFilters);
        }

        const getDataSS_ListPurPlan = (params) => {
            let myFilters = [];
            if(params.custpage_subsidiary){
                myFilters.push(
                    search.createFilter({name: 'subsidiary', operator: 'anyof', values: params.custpage_subsidiary.split(',')})
                );
            }
           
            if(params.custpage_khmh){
                myFilters.push(
                    search.createFilter({name: 'internalid', operator: 'anyof', values: params.custpage_khmh.split(',')})
                );
            } 
            
            if(params.custpage_fromdt){
                myFilters.push(search.createFilter({name: 'trandate', operator: 'onorafter', values: params.custpage_fromdt}));
            }

            if(params.custpage_todt){
                myFilters.push(search.createFilter({name: 'trandate', operator: 'onorbefore', values: params.custpage_todt}));
            }

            if(params.custpage_item){
                myFilters.push(
                    search.createFilter({name: 'item', operator: 'anyof', values: params.custpage_item.split(',')})
                );
            }

            if(params.custpage_list_item){
                myFilters.push(
                    search.createFilter({name: 'custbody_scv_list_item_standard', operator: 'anyof', values: params.custpage_list_item.split(',')})
                );
            }

            return constSearchListPurPlan.getDataSource(myFilters);
        }

        const onCreateFormUI = (params) => {
            let mainForm = serverWidget.createForm({title: 'Tạo Purchase Request từ Kế hoạch mua hàng'});
            lbf.pinHeaderSublist(mainForm);
            mainForm.clientScriptModulePath = '../cs/scv_cs_sl_crt_pr_from_khmh.js';
            mainForm.addButton({id: 'custpage_btn_search', label: 'Search', functionName: 'onSearchResult()'});
            let filterGrp = lbf.addFieldGroup(mainForm, 'fieldgrp_main', 'Filters');
            let defaultGrp = lbf.addFieldGroup(mainForm, 'default_main', 'Default Values');
            let resultGrp = lbf.addFieldGroup(mainForm, 'fieldgrp_result','Result');
            let custpage_subsidiary = mainForm.addField({
                id: 'custpage_subsidiary',
                type: serverWidget.FieldType.MULTISELECT,
                label: 'Công ty',
                source: 'subsidiary',
                container: filterGrp.id
            }).setHelpText('Công ty')
            custpage_subsidiary.isMandatory = true;

            let custpage_item = mainForm.addField({
                id: 'custpage_item',
                type: serverWidget.FieldType.MULTISELECT,
                label: 'Hàng hóa',
                source: 'item',
                container: filterGrp.id
            }).setHelpText('Hàng hóa')  
            .updateBreakType({breakType: 'STARTCOL'});

            let custpage_list_item = mainForm.addField({
                id: 'custpage_list_item',
                type: serverWidget.FieldType.MULTISELECT,
                label: 'Nhóm danh mục HH',
                source: 'customlist_scv_group_list_item_stan',
                container: filterGrp.id
            }).setHelpText('Nhóm danh mục HH')

            let custpage_khmh = mainForm.addField({
                id: 'custpage_khmh',
                type: serverWidget.FieldType.MULTISELECT,
                label: 'Số kế hoạch mua hàng',
                container: filterGrp.id
            }).setHelpText('Số kế hoạch mua hàng')  
            .updateBreakType({breakType: 'STARTCOL'});

            let custpage_fromdt = mainForm.addField({
                id: 'custpage_fromdt',
                type: serverWidget.FieldType.DATE,
                label: 'From date',
                container: filterGrp.id
            }).setHelpText('From date').updateLayoutType({layoutType: 'startrow'});

            let custpage_todt = mainForm.addField({
                id: 'custpage_todt',
                type: serverWidget.FieldType.DATE,
                label: 'To date',
                container: filterGrp.id
            }).setHelpText('To date').updateLayoutType({layoutType: 'endrow'});

            let custpage_def_date = mainForm.addField({
                id: 'custpage_def_date',
                type: serverWidget.FieldType.DATE,
                label: 'Date',
                container: defaultGrp.id
            }).setHelpText('Date').updateLayoutType({layoutType: 'startrow'});
        
            onLoadKHMH(custpage_khmh, params.custpage_subsidiary);
            if(params.custpage_subsidiary) custpage_subsidiary.defaultValue = params.custpage_subsidiary.split(',')
            if(params.custpage_khmh) custpage_khmh.defaultValue = params.custpage_khmh.split(',')
            if(params.custpage_item) custpage_item.defaultValue = params.custpage_item.split(',')
            if(params.custpage_list_item) custpage_list_item.defaultValue = params.custpage_list_item.split(',')

            custpage_fromdt.defaultValue = params.custpage_fromdt;
            custpage_todt.defaultValue = params.custpage_todt;
            custpage_def_date.defaultValue = params.custpage_def_date;
            let custpage_sl_result = mainForm.addSublist({id: 'custpage_sl_result', type: 'list', label: 'Result', tab: resultGrp.id});
            custpage_sl_result.addMarkAllButtons();
            onCreateSublistColumn(custpage_sl_result)
            return {form: mainForm, sublist: custpage_sl_result};
        }

        const onLoadKHMH = (field, custpage_subsidiary) => {
            let arrData = [];
            if(custpage_subsidiary){
                arrData = constPurchasePlan.getDataBySubsidiary(
                    search.createFilter({
                        name: 'subsidiary',
                        operator: "anyof",
                        values: custpage_subsidiary.split(',')
                    })
                );
            };

            constRecord.initLoadFieldServer(field, {
                displayExpr: "tranid", valueExpr: "internalid", data: arrData
            }, false)
        }

        const onCreateSublistColumn = (sl) => {
            let arrColumn = getColSl();
            for(let col of arrColumn){
                sl.addField({id: 'custpage_col_' + col.id, type: col.type, label: col.label, source: col.source || []}).updateDisplayType({displayType: col.displayType || 'inline'})
            }
        }

        const getColSl = () => {
            return [
                { id: 'check', label: 'Check', type: 'checkbox', displayType: 'entry'},
                { id: 'subsidiary_display', label: 'Công ty', type: 'text'},
                { id: 'ngay_khmh', label: 'Ngày kế hoạch mua hàng', type: 'text' },
                { id: 'so_khmh', label: 'Số kế hoạch mua hàng', type: 'text' },
                { id: 'item_display', label: 'Hàng hóa', type: 'text'},
                { id: 'units_display', label: 'Đơn vị tính', type: 'text'},
                { id: 'qty', label: 'Số lượng', type: 'float', displayType: 'entry'},
                { id: 'qty_remaining', label: 'Số lượng còn lại', type: 'float'},
                { id: 'json_data', label: 'JSON DATA', type: 'textarea', displayType: 'hidden'},
            ]
        }

        return {onRequest}

    });
