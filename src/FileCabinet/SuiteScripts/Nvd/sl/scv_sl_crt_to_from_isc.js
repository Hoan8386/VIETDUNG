/**
 * Nội dung:
 * keyword:
 * - TO: Transfer Order {transferorder}
 * - ISC: Inventory Status Change {inventorystatuschange}
 * =======================================================================================
 *  Date                Author                  Description
 *  01 Apr 2025		    Khanh Tran			    Init, create file, Tạo hàng loạt các lệnh chuyển kho Transfer Order nhóm theo từng kho mr.Huy(https://app.clickup.com/t/86cydnndh)
 */
/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record', 'N/runtime', 'N/search', 'N/ui/serverWidget', 'N/url', 'N/task', 'N/cache', 'N/ui/message', 'N/redirect', 'N/format',
    '../lib/scv_lib_function.js',
    '../cons/scv_cons_record.js',
    '../cons/scv_cons_location.js',
    '../cons/scv_cons_subsidiary.js',
    '../cons/scv_cons_search_instach_to.js',
    '../cons/scv_cons_search_onhand_tro.js',
],
    /**
     * @param{record} record
     * @param{runtime} runtime
     * @param{search} search
     * @param{serverWidget} serverWidget
     * @param{url} url
     */
    (record, runtime, search, serverWidget, url, task, cache, message, redirect, format,
        lbf, 
        constRecord,
        constLocation,
        constSubsidiary,
        cSearchIscTO,
        cSearchOnhandTro,
    ) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */

        const CUR_SCRIPT = {
            ID: 'customscript_scv_sl_crt_to_from_isc',
            DEPLOYID_UI: 'customdeploy_scv_sl_crt_to_from_isc',
            DEPLOYID_DATA: 'customdeploy_scv_sl_crt_to_from_isc_data'
        }
    
        const onRequest = (scriptContext) => {
            let response = scriptContext.response;
            let request = scriptContext.request;
            let params = request.parameters;
            let myCache = cache.getCache({
                name: 'crunMrCrtTO',
                scope: cache.Scope.PUBLIC
            });

            let mrTaskId = params.mrTaskId;
            if(!mrTaskId) mrTaskId = myCache.get({key: 'mrTaskId', loader: 'loader'});
            let messageInfo = '', iscomplete = true;
            if(mrTaskId){
                let taskStatus = task.checkStatus(mrTaskId);
                messageInfo = 'Create Transfer Order is: ' + taskStatus.status;
                if(taskStatus.status === 'COMPLETE' || taskStatus.status === 'FAILED'){
                    myCache.remove({key: 'mrTaskId'});
                }else{
                    iscomplete = false;
                }
            }

            if(request.method == 'GET'){
                let mainForm = onCreateFormUI(params);
                if(messageInfo) mainForm.form.addPageInitMessage({type: message.Type.INFORMATION, message: messageInfo, duration: -1});
                if(params.isSearch == 'T'){
                    let results = getDataResultMapped(params);
                    if(results.length > 0) mainForm.form.addSubmitButton("Submit");
                    renderDataSublist(mainForm.sublist, results);
                }

                response.writePage(mainForm.form);
            }else{
                let parametersToRedirect = copyParameters(params);
                let arrResult = getDataCreateTO(request, parametersToRedirect);
                let mrTask = task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: 'customscript_scv_mr_crt_to_from_isc',
                    deploymentId: 'customdeploy_scv_mr_crt_to_from_isc'
                });

                mrTask.params = {custscript_scv_mr_crt_to_from_isc: JSON.stringify(arrResult)};
                let mrTaskId = mrTask.submit();
                myCache.put({key: 'mrTaskId', value: mrTaskId});
                parametersToRedirect.mrTaskId = mrTaskId;
                redirect.toSuitelet({
                    scriptId: CUR_SCRIPT.ID,
                    deploymentId: CUR_SCRIPT.DEPLOYID_UI,
                    parameters: parametersToRedirect
                });
            }
        }

        const getDataCreateTO = (request, params) => {
            let sublistId = 'custpage_sl_result';
            let arrResult = [], arrSl = [];
            for(let i = 0; i < request.getLineCount(sublistId); i++){
                let checkbox = request.getSublistValue(sublistId, 'custpage_col_check', i);
                let kho_nhap = request.getSublistValue(sublistId, 'custpage_col_kho_nhap', i);
                let json_data = request.getSublistValue(sublistId, 'custpage_col_json_data', i);
                let obj = {...JSON.parse(json_data)};
                if(!kho_nhap) kho_nhap = params.custpage_kho_nhap;
                if(checkbox == 'T' && (obj.quantity * 1 <= obj.on_hand * 1)){
                    let json_data = request.getSublistValue(sublistId, 'custpage_col_json_data', i);
                    let obj = {...JSON.parse(json_data)};
                    obj.kho_xuat = obj.location;
                    obj.kho_nhap = kho_nhap;
                    arrSl.push(obj)
                }
            }

            arrResult = lbf.onGroupByArray(arrSl, ['kho_nhap', 'kho_xuat', 'date']);
            arrResult.forEach(obj => {
                let arrItem = arrSl.filter(e => e.kho_nhap == obj.kho_nhap && e.kho_xuat == obj.kho_xuat && e.date == obj.date);
                obj.arrItem = arrItem;
                obj.slParams = params;
            })
            
            return arrResult;
        }

        const copyParameters = (params) => {
            return {
                custpage_cong_ty: params.custpage_cong_ty.replaceAll('\u0005', ','),
                custpage_phieu_ctt: params.custpage_phieu_ctt,
                custpage_fromdt: params.custpage_fromdt,
                custpage_todt: params.custpage_todt,
                custpage_kho_xuat: params.custpage_kho_xuat,
                custpage_gd_goc: params.custpage_gd_goc,
                custpage_mat_hang: params.custpage_mat_hang.replaceAll('\u0005', ','),
                custpage_gd_lien_quan: params.custpage_gd_lien_quan,
                custpage_so_lo: params.custpage_so_lo,
                custpage_kho_nhap: params.custpage_kho_nhap,
                custpage_ghi_chu: params.custpage_ghi_chu,
            }
        }

        const getDataResultMapped = (params) => {
            let results = [];
            let arrIscTO = getDataSSIscTO(params);
            let arrOnhand = getDataSSOnhandTro(params);
            arrIscTO.forEach(obj => {
                obj.kho_xuat_display = obj.location_display;
                let objFd = arrOnhand.find(e => e.item == obj.item && e.inventory_number == obj.inventory_number && 
                    e.location == obj.location && e.bin_number == obj.bin_number && e.status == obj.status) || {};
                obj.on_hand = objFd.on_hand || 0;
                obj.json_data = JSON.stringify(obj);
                results.push(obj);
            })

            return results
        }

        const getDataSSOnhandTro = (params) => {
            let myFilters = [];

            if(params.custpage_kho_xuat){
                myFilters.push(
                    search.createFilter({name: 'location', operator: 'anyof', values: params.custpage_kho_xuat})
                )
            }

            if(params.custpage_mat_hang){
                myFilters.push(
                    search.createFilter({ name: 'item', operator: 'anyof', values: params.custpage_mat_hang.split(',') })
                )
            }

            if(params.custpage_so_lo){
                myFilters.push(search.createFilter({name: 'formulatext', formula: '{inventorynumber}', operator: 'is', values: params.custpage_so_lo}));
            }

            return cSearchOnhandTro.getDataSource(myFilters);
        }

        const getDataSSIscTO = (params) => {
            let myFilters = [];
            if(params.custpage_cong_ty){
                myFilters.push(search.createFilter({name: 'subsidiary', operator: 'anyof', values: params.custpage_cong_ty.split(',')}))
            }

            if(params.custpage_phieu_ctt){
                myFilters.push(search.createFilter({name: 'numbertext', operator: 'is', values: params.custpage_phieu_ctt}))
            }

            if(params.custpage_fromdt){
                myFilters.push(search.createFilter({name: 'trandate', operator: 'onorafter', values: params.custpage_fromdt}));
            }

            if(params.custpage_todt){
                myFilters.push(search.createFilter({name: 'trandate', operator: 'onorbefore', values: params.custpage_todt}));
            }

            if(params.custpage_kho_xuat){
                myFilters.push(
                    search.createFilter({name: 'location', operator: 'anyof', values: params.custpage_kho_xuat})
                )
            }

            if(params.custpage_mat_hang){
                myFilters.push(
                    search.createFilter({name: 'item', operator: 'anyof', values: params.custpage_mat_hang.split(',')})
                )
            }

            if(params.custpage_gd_goc){
                myFilters.push(search.createFilter({name: 'tranid', join: 'custbody_scv_created_transaction', operator: 'contains', values: params.custpage_gd_goc}));
            }

            if(params.custpage_gd_lien_quan){
                myFilters.push(search.createFilter({name: 'tranid', join: 'custbody_scv_related_transaction', operator: 'contains', values: params.custpage_gd_lien_quan}));
            }

            if(params.custpage_so_lo){
                myFilters.push(search.createFilter({name: 'formulatext', formula: '{inventorydetail.inventorynumber}',  operator: 'is', values: params.custpage_so_lo}));
            }

            return cSearchIscTO.getDataSource(myFilters);
        }

        const onCreateFormUI = (params) => {
            defaultParams(params);
            let mainForm = serverWidget.createForm({title: 'Chuyển kho thành phẩm'});
            lbf.addSavedSearchToForm(mainForm, [
                {id: cSearchIscTO.ID, title: cSearchIscTO.ID},
                {id: cSearchOnhandTro.ID, title: cSearchOnhandTro.ID},
            ]);
            mainForm.clientScriptModulePath = '../cs/scv_cs_sl_crt_to_from_isc.js';
            mainForm.addButton({id: 'custpage_btn_search', label: 'Search', functionName: 'onSearchResult()'});

            let filterGrp = lbf.addFieldGroup(mainForm, 'fieldgrp_main', 'Filters');
            let defaultGrp = lbf.addFieldGroup(mainForm, 'default_main', 'Default Values');
            let resultGrp = lbf.addFieldGroup(mainForm, 'fieldgrp_result','Result');

            let custpage_cong_ty = mainForm.addField({id: 'custpage_cong_ty', type: 'multiselect', label: 'Công ty', container: filterGrp.id})
            custpage_cong_ty.setHelpText('Công ty');
            custpage_cong_ty.isMandatory = true;
            constSubsidiary.initLoadFieldSubsidiaryByUserRole(custpage_cong_ty);

            let custpage_phieu_ctt = mainForm.addField({id: 'custpage_phieu_ctt', type: 'text', label: 'Phiếu chuyển trạng thái #', container: filterGrp.id})
            custpage_phieu_ctt.setHelpText('Phiếu chuyển trạng thái #');

            let custpage_fromdt = mainForm.addField({id: 'custpage_fromdt', type: 'date', label: 'From date', container: filterGrp.id})
            custpage_fromdt.setHelpText('From date')
            custpage_fromdt.isMandatory = true;
            custpage_fromdt.updateLayoutType({layoutType: 'startrow'});

            let custpage_todt = mainForm.addField({id: 'custpage_todt', type: serverWidget.FieldType.DATE, label: 'To date', container: filterGrp.id})
            custpage_todt.setHelpText('To date')
            custpage_todt.isMandatory = true;
            custpage_todt.updateLayoutType({layoutType: 'endrow'})

            let custpage_kho_xuat = mainForm.addField({id: 'custpage_kho_xuat', type: 'select', label: 'Kho xuất', container: filterGrp.id})
            custpage_kho_xuat.setHelpText('Kho xuất');
            loadFieldDataLocation(custpage_kho_xuat, params.custpage_cong_ty);

            let custpage_gd_goc = mainForm.addField({id: 'custpage_gd_goc', type: 'text', label: 'Giao dịch gốc', container: filterGrp.id})
            custpage_gd_goc.setHelpText('Giao dịch gốc');
            
            let custpage_mat_hang = mainForm.addField({id: 'custpage_mat_hang', type: 'multiselect', label: 'Mặt hàng', source: 'item', container: filterGrp.id})
            custpage_mat_hang.setHelpText('Mặt hàng');

            let custpage_gd_lien_quan = mainForm.addField({id: 'custpage_gd_lien_quan', type: 'text', label: 'Giao dịch liên quan', container: filterGrp.id})
            custpage_gd_lien_quan.setHelpText('Giao dịch liên quan');

            let custpage_so_lo = mainForm.addField({id: 'custpage_so_lo', type: 'text', label: 'Số Lô', container: filterGrp.id})
            custpage_so_lo.setHelpText('Số Lô');
            
            let custpage_kho_nhap = mainForm.addField({id: 'custpage_kho_nhap', type: 'select', label: 'Kho nhập', container: defaultGrp.id})
            custpage_kho_nhap.setHelpText('Kho nhập');
            loadFieldDataLocation(custpage_kho_nhap, params.custpage_cong_ty);

            let custpage_ghi_chu = mainForm.addField({id: 'custpage_ghi_chu', type: 'text', label: 'Ghi chú', container: defaultGrp.id})
            custpage_ghi_chu.setHelpText('Ghi chú');
            custpage_ghi_chu.isMandatory = true;

            let custpage_sl_result = mainForm.addSublist({id: 'custpage_sl_result', type: 'list', label: 'Result', tab: resultGrp.id});
            custpage_sl_result.addMarkAllButtons();
            onCreateSublistColumn(custpage_sl_result);

            lbf.defaultField(params, mainForm);
            return {form: mainForm, sublist: custpage_sl_result};
        }

        const defaultParams = (params) => {
            if(params.recid && params.rectype && params.rectype == 'inventorystatuschange'){
                let curRec = record.load({id: params.recid, type: params.rectype});
                params.custpage_cong_ty = curRec.getValue('subsidiary');
                params.custpage_phieu_ctt = curRec.getValue('tranid');
                params.custpage_fromdt = curRec.getText('trandate');
                params.custpage_todt = curRec.getText('trandate');
            }

            let today = new Date();
            let curUser = runtime.getCurrentUser();
            if(!('custpage_fromdt' in params)) params.custpage_fromdt = new Date(today.getFullYear(), today.getMonth(), 1);
            if(!('custpage_todt' in params)) params.custpage_todt = today;
            if(!('custpage_cong_ty' in params)) params.custpage_cong_ty = curUser.subsidiary;
            if(!('custpage_ghi_chu' in params)) params.custpage_ghi_chu = 'Chuyển kho thành phẩm sau kiểm tra';
        }

        const loadFieldDataLocation = (field, subsidiaryId) => {
            if(!subsidiaryId || !subsidiaryId.length) return;
            let arrResult = constLocation.getDataSource([
                search.createFilter({
                    name: 'subsidiary',
                    operator: "anyof",
                    values: subsidiaryId.split(',')
                })
            ]);

            constRecord.initLoadFieldServer(field, {
                displayExpr: "name", valueExpr: "internalid", data: arrResult
            }, true)
        }

        const getColSl = () => {
            return [
                { id: 'check', label: 'Chọn', type: 'checkbox', displayType: 'entry'},
                { id: 'doc_num', label: 'Phiếu #', type: 'text'},
                { id: 'date', label: 'Ngày', type: 'text'},
                { id: 'item_display', label: 'Mặt hàng', type: 'text' },
                { id: 'inventory_number_display', label: 'Số lô', type: 'text' },
                { id: 'bin_number_display', label: 'Bin', type: 'text'},
                { id: 'exp_date', label: 'HSD', type: 'text'},
                { id: 'on_hand', label: 'Tồn kho', type: 'float'},
                { id: 'quantity', label: 'Số lượng', type: 'float'},
                { id: 'unit_display', label: 'ĐVT', type: 'text'},
                { id: 'status_display', label: 'Trạng thái', type: 'text'},
                { id: 'kho_xuat_display', label: 'Kho xuất', type: 'text'},
                { id: 'kho_nhap', label: 'Kho nhập', type: 'select', displayType: 'entry'},
                { id: 'crt_from_display', label: 'Giao dịch gốc', type: 'text'},
                { id: 'rlt_tran_display', label: 'Giao dịch liên quan', type: 'text'},
                { id: 'json_data', label: 'JSON DATA', type: 'textarea', displayType: 'hidden'},
            ]
        }

        const onCreateSublistColumn = (sl) => {
            let arrColumn = getColSl();
            for(let col of arrColumn){
                if(['amt', 'tax_amt', 'gross_amt'].includes(col.id)){
                    sl.addField({id: 'custpage_col_' + col.id, type: col.type, label: col.label, source: col.source || []})
                    .updateDisplayType({displayType: 'entry'})
                    .updateDisplayType({ displayType: 'disabled' });
                }else{
                    sl.addField({id: 'custpage_col_' + col.id, type: col.type, label: col.label, source: col.source || []})
                    .updateDisplayType({displayType: col.displayType || 'inline'})
                }
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

        return {onRequest}

    });
