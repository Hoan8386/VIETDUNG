/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  14 May 2025         Huy Pham			    Init, create file, tạo PO từ SO (nội bộ), from ms.Ngọc(https://app.clickup.com/t/86cyxbm9m)
 *  24 Jun 2025         Huy Pham			    Update, thêm trường yêu cầu đóng hàng, from ms.Ngọc(https://app.clickup.com/t/86cyxbm9m?comment=90160117990722)
 *  19 Mar 2026         Huy Pham			    Bổ sung field mapping, from ms.Ngọc(https://app.clickup.com/t/86cyxbm9m?comment=90160173527092)
 */
/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/redirect', 'N/runtime', 'N/search', 'N/record',
    '../lib/scv_lib_function.js', 

    '../cons/scv_cons_search.js',
    '../cons/scv_cons_format.js',
    '../cons/scv_cons_form.js',

    '../cons/scv_cons_purchasechannel.js',
    '../cons/scv_cons_location.js',
    '../cons/scv_cons_ordertype.js',

    '../cons/scv_cons_search_ponb_vendor.js',
],
    
    (redirect, runtime, search, record,
        lbf, 

        constSearch,
        constFormat,
        constForm,

        constPurChannel,
        constLocation,
        constOrderType,

        constSearchPONoiBo_SS01
    ) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            constForm.setContext(scriptContext);

            let request = scriptContext.request;
            let params = request.parameters;
    
            let curScript = runtime.getCurrentScript();

            if(request.method == "GET"){
                onCreateFormUI(params);
    
                constForm.writePage();
            }
            else{
                let objParams = {
                    custpage_transaction: params.custpage_transaction,
                    custpage_def_subsidiary: params.custpage_def_subsidiary,
                    custpage_def_vendor: params.custpage_def_vendor,
                    custpage_def_location: params.custpage_def_location,
                    custpage_def_crtdt: params.custpage_def_crtdt,
                    custpage_def_reqdt: params.custpage_def_reqdt,
                    custpage_def_memo: params.custpage_def_memo,
                }
    
                createPurchaseOrder(objParams);

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

        const onCreateFormUI = (_params) =>{
            constForm.createForm({title: "Tạo Đơn mua hàng nội bộ", hideNavBar: true}, '../cssl/scv_cs_sl_so2po.js');
            if(_params.isCompeleted == "T") return;

            constForm.addPageLink([constSearchPONoiBo_SS01.ID], true);

            constForm.addSubmitButton({label: "Tạo yêu cầu"});
            constForm.addButton({id: "custpage_btn_cancel", label: "Hủy", functionName: "cancelPopup()"});

            let arrResult = getDataSource(_params);

            if(arrResult.length > 0){
                _params.custpage_def_subsidiary = arrResult[0].subsidiary;
                _params.custpage_def_location = arrResult[0].custpage_col_location;
                _params.custpage_def_memo = arrResult[0].memo;
            }
            
            //#region Fields Header: Filters
            let mainGrp = constForm.addFieldGroup({id: "fieldgrp_main", label: "Bộ lọc"});

            constForm.addField({
                id: 'custpage_transaction', label: 'Transaction',
                type: "select", source: "transaction", container: mainGrp.id
            }, true, {
                displayType: "hidden",
                defaultValue: _params?.custpage_transaction
            });

            constForm.addField({
                id: 'custpage_def_subsidiary', label: 'Subsidiary',
                type: "select", source: "subsidiary", container: mainGrp.id
            }, true, {
                displayType: "hidden",
                defaultValue: _params?.custpage_def_subsidiary
            });
            //#endregion

            //#region  Fields Header: Default Value Create
            let defaultGrp = constForm.addFieldGroup({id: "fieldgrp_default", label: "Thông tin mặc định khi tạo yêu cầu"});

            let arrResultLocation = getDataSourceLocation(_params);
            let arrResVendor = getDataVendor(_params);
            let arrPONoiBoVendor = getDataSourcePONoiBoVendor(_params);

            if(!_params.custpage_def_vendor && arrPONoiBoVendor.length > 0){
                _params.custpage_def_vendor = arrPONoiBoVendor[0].vendorid;
            }

            constForm.addField({
                id: 'custpage_def_vendor', label: 'Nhà cung cấp',
                type: "select",
                container: defaultGrp.id
            }, true, {
                lookup: {
                    data: arrResVendor,
                    valueExpr: "internalid",
                    displayExpr: "companyname"
                },
                defaultValue: _params?.custpage_def_vendor
            });

            constForm.addField({
                id: 'custpage_def_location', label: 'Kho nhập',
                type: "select", container: defaultGrp.id
            }, true, {
                lookup: {
                    data: arrResultLocation,
                    valueExpr: "internalid",
                    displayExpr: "name"
                },
                defaultValue: _params?.custpage_def_location
            });

            constForm.addField({
                id: 'custpage_def_crtdt', label: 'Ngày tạo',
                type: "date", container: defaultGrp.id
            }, true, {
                layoutType: "startrow",
                defaultValue: !!_params.custpage_def_crtdt ? _params.custpage_def_crtdt : new Date()
            });

            constForm.addField({
                id: 'custpage_def_reqdt', label: 'Ngày yêu cầu giao hàng',
                type: "date", container: defaultGrp.id
            }, false, {
                layoutType: "endrow",
                defaultValue: _params?.custpage_def_reqdt
            });

            constForm.addField({
                id: 'custpage_def_memo', label: 'Ghi chú',
                type: "text", container: defaultGrp.id
            }, false, {
                defaultValue: _params?.custpage_def_memo
            });
            //#endregion

            let resultSublist = constForm.addSublist({
                id : "custpage_sl_result",
                type : "list",
                label : 'Result'
            });
            resultSublist.addMarkAllButtons();

            constForm.addFieldOfSublist("custpage_sl_result", getColumnOfSublist());
            
            constForm.setDataOfSublist("custpage_sl_result", arrResult);
        }

        const getColumnOfSublist = () =>{
            return [
                {id: "custpage_col_chk", label: "Chọn", type: "checkbox", displayType: "entry"},
                {id: "custpage_col_item", label: "Sản phẩm", type: "select", source: "item"},
                {id: "custpage_col_unit", label: "Đơn vị tính", type: "text"},
                {id: "custpage_col_quantity", label: "Số lượng *", type: "float", displayType: "entry"},
                {id: "custpage_col_orilineid", label: "Ori line ID", type: "text"},
                {id: "custpage_col_unit_id", label: "Unit ID", type: "text", displayType: "hidden"},
                {id: "custpage_col_yc_donghang", label: "Yêu cầu đóng hàng", type: "text", displayType: "hidden"},
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
                    custpage_col_unit_id: transRec.getSublistValue(itemSublistId, "units", i),
                    custpage_col_quantity: transRec.getSublistValue(itemSublistId, "quantity", i) * 1,
                    custpage_col_orilineid: transRec.getSublistValue(itemSublistId, "custcol_scv_ori_lineid", i),
                    custpage_col_location: transRec.getSublistValue(itemSublistId, "location", i),
                    custpage_col_yc_donghang: transRec.getSublistValue(itemSublistId, "custcol_scv_yeu_cau_dong_hang", i),
                    subsidiary: transRec.getValue("subsidiary"),
                    memo: transRec.getValue("memo"),
                };

                arrResult.push(objRes);
            }
            
            return arrResult;
        }

        const getDataSourceLocation = (_params) =>{
            if(!_params.custpage_def_subsidiary) return [];

            let arrResult = constLocation.getDataSource([
                search.createFilter({
                    name: 'subsidiary', 
                    operator: "anyof", 
                    values: _params.custpage_def_subsidiary
                })
            ]);

            return arrResult;
        }
        
        const getDataSourcePONoiBoVendor = (_params) =>{
            if(!_params.custpage_def_subsidiary) return [];

            let arrResult = constSearchPONoiBo_SS01.getDataSource([
                search.createFilter({
                    name: 'internalid', 
                    join: "mseSubsidiary",
                    operator: "anyof", 
                    values: _params.custpage_def_subsidiary
                })
            ]);

            return arrResult;
        }

        const getDataVendor = (_params) =>{
            if(!_params.custpage_def_subsidiary) return [];

            let resultSearch =  constSearch.createSearchWithFilter({
                type: "vendor",
                filters:
                [
                    ["mseSubsidiary.internalid", "anyof", _params.custpage_def_subsidiary],
                ],
                columns:
                [
                    "internalid", "companyname"
                ]
            });
            
            let arrResult = constSearch.fetchResultSearchRunEach(resultSearch, function(_objTmpl, _column){
                let objResTmpl = constSearch.getObjResultFromSearchByKey(_objTmpl, _column, [
                    "internalid", "companyname"
                ]);

                return objResTmpl;
            });

            return arrResult;
        }

        const createPurchaseOrder = (_params) =>{
            if(!_params.custpage_transaction) return [];

            let itemSublistId = "item";

            let transRec = record.load({
                type: lbf.getTranRecordType(_params.custpage_transaction), 
                id: _params.custpage_transaction,
                isDynamic: true
            });

            let arrLine = constForm.getDataOfSublist("custpage_sl_result", [
                "custpage_col_item", "custpage_col_unit", "custpage_col_unit_id",
                "custpage_col_quantity", "custpage_col_location", "custpage_col_orilineid",
                "custpage_col_yc_donghang",
            ], ["custpage_col_chk", "T"]);

            let poRec = record.create({type: "purchaseorder", isDynamic: true});

            poRec.setValue('customform', 265);
            
            lbf.setValueData(poRec, [
                "custbody_scv_order_type", "entity", "subsidiary",
                "cseg_scv_pc", "location",
                "memo", 
            ], [
                constOrderType.RECORDS.MUA_BAN_NOI_BO.ID, _params.custpage_def_vendor, _params.custpage_def_subsidiary,
                constPurChannel.RECORDS.NOI_DIA.ID, _params.custpage_def_location,
                _params.custpage_def_memo
            ]);

            lbf.setValue(poRec, transRec, [
                "cseg_scv_sg_proj", "custbody_scv_so_code",
                "custbody_scv_created_transaction", "custbody_scv_tb_entity_name",
            ], [
                "cseg_scv_sg_proj", "custbody_scv_so_code",
                "id", "entity",
            ]);

            if(!!_params.custpage_def_crtdt){
                let trandate = constFormat.parseDate(_params.custpage_def_crtdt);
                poRec.setValue("trandate", trandate);
            }
            if(!!_params.custpage_def_reqdt){
                let duedate = constFormat.parseDate(_params.custpage_def_reqdt);
                poRec.setValue("duedate", duedate);
            }

            for(let j = 0; j < arrLine.length; j++){
                let objItem = arrLine[j];

                poRec.selectNewLine(itemSublistId);

                lbf.setCurrentSublistValueData(poRec, itemSublistId, [
                    "item", "unit",
                    "quantity", "custcol_scv_ori_lineid",
                    "custcol_scv_yeu_cau_dong_hang", "custcol_scv_qty_before_tolerance"
                ], [
                    objItem.custpage_col_item, objItem.custpage_col_unit_id,
                    objItem.custpage_col_quantity * 1, objItem.custpage_col_orilineid,
                    objItem.custpage_col_yc_donghang, objItem.custpage_col_quantity * 1
                ]);

                poRec.commitLine(itemSublistId);
            }
            
            let poRecId = poRec.save({enableSourcing: false, ignoreMandatoryFields: true});

            let arrRelatedTrans = transRec.getValue("custbody_scv_related_transaction");
            if(util.isArray(arrRelatedTrans)){
                arrRelatedTrans.push(poRecId);
            }
            else{
                arrRelatedTrans = [poRecId];
            }

            record.submitFields({
                type: transRec.type,
                id: transRec.id,
                values: {
                    custbody_scv_related_transaction: arrRelatedTrans
                },
                options: {
                    enableSourcing: false, ignoreMandatoryFields : true
                }
            });

            return poRecId;
        }

        return {
            onRequest
        }

    });
