/**
 * Nội dung: Tạo PO From PR
 * keyword:
 * - PO: purchase Order {purchaseorder}
 * - PR: Purchase request {custompurchase_scv_purchase_request}
 * =======================================================================================
 *  Date                Author                  Description
 *  14 Nov 2024		    Khanh Tran			    Init, create file, Tạo PO From PR from mr.Hải(https://app.clickup.com/t/86cx295gc)
 */
/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record', 'N/runtime', 'N/search', 'N/ui/serverWidget', 'N/url', 'N/format', 'N/query',
    '../lib/scv_lib_function.js',
    '../cons/scv_cons_ordertype.js',
    '../cons/scv_cons_record.js',
    '../cons/scv_cons_purreq.js',

    '../cons/scv_cons_search_pr_create_po.js',
    '../cons/scv_cons_search_pr_remaining_po.js',
    '../cons/scv_cons_search_list_po.js',

],
    /**
 * @param{record} record
 * @param{runtime} runtime
 * @param{search} search
 * @param{serverWidget} serverWidget
 * @param{url} url
 */
    (record, runtime, search, serverWidget, url, format, query,
        lbf,
        constOrderType,
        constRecord,
        constPurReq,
        constSearchPRCrtPO,
        constSearchPRRPO, 
        constSearchListPO,
    ) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const CUR_SCRIPT = {
            ID: 'customscript_scv_sl_crt_po_from_pr',
            DEPLOYID_UI: 'customdeploy_scv_sl_crt_po_from_pr',
            DEPLOYID_DATA: 'customdeploy_scv_sl_crt_po_from_pr_data'
        }

        const onRequest = (scriptContext) => {
            let response = scriptContext.response;
            let request = scriptContext.request;
            let params = request.parameters;
            let curScript = runtime.getCurrentScript();
            if(curScript.deploymentId == CUR_SCRIPT.DEPLOYID_DATA){
                let objResponse = {data: [], isSuccess: true, msg: ''};
                try {
                    if(params.action == 'crtPO'){
                        objResponse = crtPO(params);
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
                        mainForm.form.addSubmitButton("Submit");
                        let results = getDataResultMapped(params);
                        renderDataSublist(mainForm.sublist, results);
                    }

                    response.writePage(mainForm.form);
                }
            }
        }

        const crtPO = (params) => {
            let objBody = JSON.parse(params.objBody);log.error('objBody', objBody)
            let {params: paramSl, arrLine, objGrp} = objBody;
            let objLine = arrLine[0];
            let customform = 102;
            let order_type = objLine.order_type || constOrderType.RECORDS.MUA_HANG_PHAT_SINH.ID;
            if(order_type == constOrderType.RECORDS.MUA_HANG_GIA_CONG.ID){
                customform = 114;
            }else if(objLine.phan_loai_nguon_cung == 2){
                customform = 263;
            }
           
            let poRec = record.create({type: 'purchaseorder', isDynamic: true, 
                defaultValues: { customform: customform }});

            lbf.setValueData(poRec, [
                'entity', 'subsidiary', 'custbody_scv_order_type', 'cseg_scv_pc'
            ], [
                objGrp.vendor, objGrp.subsidiary_id, order_type, objLine.phan_loai_nguon_cung
            ]);
            if(paramSl.custpage_def_date){
                poRec.setValue('trandate', format.parse({value: paramSl.custpage_def_date, type: 'date'}))
            }

            let sl = 'item';
            arrLine.forEach((obj) => {
                poRec.selectNewLine({sublistId: sl});
                obj.expectedreceiptdate = '';
                obj.location = paramSl.custpage_def_location || obj.location;
                if(obj.ngay_can_hang){
                    obj.expectedreceiptdate = format.parse({value: obj.ngay_can_hang, type: 'date'});
                }

                lbf.setCurrentSublistValueData(poRec, sl, [
                    'location', 'assembly',
                ], [
                    obj.location, obj.thanh_pham_gia_cong_id,
                ]);

                if(order_type == constOrderType.RECORDS.MUA_HANG_GIA_CONG.ID){
                    lbf.setCurrentSublistValueData(poRec, sl, [
                        'billofmaterials', 'billofmaterialsrevision',
                    ], [
                        obj.bom, obj.bom_rev,
                    ]);
                }

                lbf.setCurrentSublistValueData(poRec, sl, [
                    'item', 'units', 'quantity', 'rate', 'amount',
                    'cseg_scv_pdc', 'expectedreceiptdate', 'custcol_scv_sumtrans_line_originno',
                    'custcol_scv_memo', 'custcol_scv_ori_lineid', 'custcol_scv_acceptance_classification',
                    'custcol_scv_po_properties', 'custcol_scv_po_positive_tolerance', 'custcol_scv_market_number',
                    'custcol_far_trn_relatedasset', 'custcol_scv_qty_before_tolerance', 'custcol_scv_amount_bef_tolerance'
                ], [
                    obj.item_id, obj.units_id, obj.qty, obj.rate, obj.amt,
                    obj.nhom_hang_id, obj.expectedreceiptdate, obj.pr_id,
                    obj.ghi_chu, obj.ori_lineid, obj.phan_loai_nghiem_thu,
                    obj.mo_ta_chi_tiet_hh, 0, obj.so_hieu_market,
                    obj.related_asset, obj.qty, obj.rate * obj.qty
                ]);

                poRec.commitLine({sublistId: sl});
            })

            let recId = poRec.save({enableSourcing: false, ignoreMandatoryFields: true});log.error('recId', recId)
            if(recId){
                let recName = search.lookupFields({ type: 'purchaseorder', id: recId, columns: ['tranid'] }).tranid;
                let urlRec = url.resolveRecord({ recordType: 'purchaseorder', recordId: recId });
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
            let arrSS_prCrtPO = getDataSS_prCrtPO(params);
            if(arrSS_prCrtPO.length == 0) return [];

            let arrSS3 = getDataSSListPO(params);
            let arrSS2= getDataSS_prRPO(params);
            let results = [];
            arrSS_prCrtPO.forEach(obj => {
                let objRes = obj;
                let arrSS3_ft = arrSS3.filter(e => e.ori_lineid == obj.ori_lineid && e.pr_id == obj.pr_id);
                arrSS3_ft.forEach(objSS3 => {
                    objRes.qty -= objSS3.qty*1;
                })
                if(objRes.qty <= 0) return;

                objRes.qty_remaining = 0;
                if(objRes.unit_conversion_rate){
                    let objSS2_f = arrSS2.find(e => e.ori_lineid == objRes.ori_lineid);
                    if(objSS2_f){
                        objRes.qty_remaining = objSS2_f.qty_remaining/objRes.unit_conversion_rate;
                        if(objRes.qty_remaining <= 0) return;
                    }
                }

                if(obj.order_type != constOrderType.RECORDS.MUA_HANG_GIA_CONG.ID){
                    objRes.thanh_pham_gia_cong_id = '';
                    objRes.thanh_pham_gia_cong = '';
                }

                objRes.amt = obj.rate * obj.qty;
                objRes.json_data = JSON.stringify(objRes);
                results.push(objRes)
            })

            return results
        }

        const getDataSSListPO = (params) => {
            let myFilters = [];
            if(params.custpage_subsidiary){
                myFilters.push(
                    search.createFilter({name: 'subsidiary', operator: 'anyof', values: params.custpage_subsidiary.split(',')})
                )
            }

            if(params.custpage_item){
                myFilters.push(
                    search.createFilter({name: 'item', operator: 'anyof', values: params.custpage_item.split(',')})
                )
            }

            return constSearchListPO.getDataSource(myFilters);
        }

        const getDataSS_prRPO = (params) => {
            let myFilters = [];
            if(params.custpage_subsidiary){
                myFilters.push(
                    search.createFilter({name: 'subsidiary', operator: 'anyof', values: params.custpage_subsidiary.split(',')})
                )
            }

            return constSearchPRRPO.getDataSource(myFilters);
        }

        const getDataSS_prCrtPO = (params) => {
            let myFilters = [];
            if(params.custpage_subsidiary){
                myFilters.push(
                    search.createFilter({name: 'subsidiary', operator: 'anyof', values: params.custpage_subsidiary.split(',')})
                );
            }
           
            if(params.custpage_pr){
                myFilters.push(
                    search.createFilter({name: 'internalid', operator: 'anyof', values: params.custpage_pr.split(',')})
                );
            } 
            
            if(params.custpage_ncc){
                myFilters.push(
                    search.createFilter({name: 'custcol_scv_vendor', operator: 'anyof', values: params.custpage_ncc.split(',')})
                );
            }

            if(params.custpage_crtby){
                myFilters.push(
                    search.createFilter({name: 'createdby', operator: 'anyof', values: params.custpage_crtby})
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

            return constSearchPRCrtPO.getDataSource(myFilters, params);
        }

        const onCreateFormUI = (params) => {
            let mainForm = serverWidget.createForm({title: 'Create PO From PR'});
            lbf.pinHeaderSublist(mainForm);
            mainForm.clientScriptModulePath = '../cs/scv_cs_sl_crt_po_from_pr.js';
            mainForm.addButton({id: 'custpage_btn_search', label: 'Search', functionName: 'onSearchResult()'});
            let filterGrp = lbf.addFieldGroup(mainForm, 'fieldgrp_main', 'Filters');
            let defaultGrp = lbf.addFieldGroup(mainForm, 'default_main', 'Default Values');
            let resultGrp = lbf.addFieldGroup(mainForm, 'fieldgrp_result','Result');
            let custpage_subsidiary = mainForm.addField({
                id: 'custpage_subsidiary',
                type: serverWidget.FieldType.MULTISELECT,
                label: 'Đơn vị',
                source: 'subsidiary',
                container: filterGrp.id
            }).setHelpText('Subsidiary').updateBreakType({breakType: 'STARTCOL'})

            let custpage_pr = mainForm.addField({
                id: 'custpage_pr',
                type: serverWidget.FieldType.MULTISELECT,
                label: 'Số yêu cầu',
                // source: 'custompurchase_scv_purchase_request',
                container: filterGrp.id
            }).setHelpText('Số yêu cầu').updateBreakType({breakType: 'STARTCOL'})

            let custpage_ncc = mainForm.addField({
                id: 'custpage_ncc',
                type: serverWidget.FieldType.MULTISELECT,
                label: 'NCC',
                source: 'vendor',
                container: filterGrp.id
            }).setHelpText('Nhà cung cấp').updateBreakType({breakType: 'STARTCOL'})
            
            let custpage_crtby = mainForm.addField({
                id: 'custpage_crtby',
                type: serverWidget.FieldType.SELECT,
                label: 'Người yêu cầu',
                source: 'employee',
                container: filterGrp.id
            })

            let custpage_item = mainForm.addField({
                id: 'custpage_item',
                type: serverWidget.FieldType.MULTISELECT,
                label: 'Item',
                source: 'item',
                container: filterGrp.id
            }).setHelpText('Item').updateBreakType({breakType: 'STARTCOL'})

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
            }).setHelpText('Date').updateBreakType({breakType: 'STARTCOL'})

            let custpage_def_vendor = mainForm.addField({
                id: 'custpage_def_vendor',
                type: serverWidget.FieldType.SELECT,
                label: 'NCC',
                source: 'vendor',
                container: defaultGrp.id
            }).setHelpText('NCC').updateBreakType({breakType: 'STARTCOL'})

            let custpage_def_location = mainForm.addField({
                id: 'custpage_def_location',
                type: serverWidget.FieldType.SELECT,
                label: 'Kho',
                source: 'location',
                container: defaultGrp.id
            }).setHelpText('Kho').updateBreakType({breakType: 'STARTCOL'})
        
            loadFieldDataPR(custpage_pr, params);
            if(params.custpage_subsidiary) custpage_subsidiary.defaultValue = params.custpage_subsidiary.split(',')
            if(params.custpage_pr)custpage_pr.defaultValue = params.custpage_pr.split(',')
            if(params.custpage_ncc) custpage_ncc.defaultValue = params.custpage_ncc.split(',')
            if(params.custpage_item) custpage_item.defaultValue = params.custpage_item.split(',')

            custpage_crtby.defaultValue = params.custpage_crtby;
            custpage_fromdt.defaultValue = params.custpage_fromdt;
            custpage_todt.defaultValue = params.custpage_todt;
            custpage_def_date.defaultValue = params.custpage_def_date;
            custpage_def_vendor.defaultValue = params.custpage_def_vendor;
            custpage_def_location.defaultValue = params.custpage_def_location;


            let custpage_sl_result = mainForm.addSublist({id: 'custpage_sl_result', type: 'list', label: 'Result', tab: resultGrp.id});
            custpage_sl_result.addMarkAllButtons();
            onCreateSublistColumn(custpage_sl_result)
            return {form: mainForm, sublist: custpage_sl_result};
        }

        const loadFieldDataPR = (field, params) => {
            let arrData = [];
            if(params.custpage_subsidiary){
                arrData = constPurReq.getDataBySubsidiary(
                    search.createFilter({
                        name: 'subsidiary',
                        operator: "anyof",
                        values: params.custpage_subsidiary.split(',')
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
                if(['amt'].includes(col.id)){
                    sl.addField({id: 'custpage_col_' + col.id, type: col.type, label: col.label, source: col.source || []})
                    .updateDisplayType({displayType: col.displayType || 'inline'})
                    .updateDisplayType({ displayType: 'disabled' });
                }
                else{
                    sl.addField({id: 'custpage_col_' + col.id, type: col.type, label: col.label, source: col.source || []})
                    .updateDisplayType({displayType: col.displayType || 'inline'})
                }
            }
        }

        const getColSl = () => {
            return [
                { id: 'check', label: 'Check', type: 'checkbox', displayType: 'entry'},
                { id: 'subsidiary', label: 'Đơn vị', type: 'text'},
                { id: 'ngay_yeu_cau', label: 'Ngày yêu cầu', type: 'text' },
                { id: 'so_yeu_cau', label: 'Số yêu cầu', type: 'text' },
                { id: 'vendor', label: 'ncc', type: 'select', source: 'vendor', displayType: 'entry'},
                { id: 'item', label: 'Hàng hóa dịch vụ', type: 'text'},
                { id: 'units', label: 'ĐVT', type: 'text'},
                { id: 'qty', label: 'Số lượng', type: 'float', displayType: 'entry'},
                { id: 'qty_remaining', label: 'Số lượng còn lại', type: 'float'},
                { id: 'rate', label: 'Đơn giá', type: 'float', displayType: 'entry'},
                { id: 'amt', label: 'Thành tiền', type: 'float', displayType: 'entry'},
                { id: 'ngay_can_hang', label: 'Ngày cần hàng', type: 'text'},
                { id: 'nhom_hang', label: 'Nhóm hàng', type: 'text'},
                { id: 'location', label: 'Kho', type: 'select',  source: 'location', displayType: 'entry'},
                { id: 'ori_lineid', label: 'Original Line ID', type: 'text'},
                { id: 'thanh_pham_gia_cong', label: 'Thành phẩm gia công', type: 'text'},
                { id: 'phan_loai_nghiem_thu', label: 'Phân loại nghiệm thu', type: 'text', displayType: 'entry'},
                { id: 'json_data', label: 'JSON DATA', type: 'textarea', displayType: 'hidden'},
            ]
        }

        return {onRequest}

    });
