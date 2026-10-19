/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  19 Nov 2024         Huy Pham                Init & create file, Sinh số lô tự động trong màn hình WO, from mr.Bính(https://app.clickup.com/t/86cx2y1j1)
 *  25 Nov 2024         Khanh Tran              Quản lý Hệ số quy đổi, from mr.Bính(https://app.clickup.com/t/86cx3r94u)
 *  25 Feb 2025         Huy Pham                Tạo hàng loạt WO từ SO, From ms.Ngọc(https://app.clickup.com/t/86cy2jttc)
 *  14 Mar 2025         Huy Pham                Updatde Sinh số lô tự động, from mr.Phúc(https://app.clickup.com/t/86cx2y1j1?comment=90160097650803)
 *  16 May 2025         Huy Pham                Update Logic Sinh số lô tự động, from ms.Ngọc(https://app.clickup.com/t/86cx2y1j1?comment=90160109839629)
 */
define(['N/search', 'N/record', 'N/url',
    '../lib/scv_lib_function.js',
    '../cons/scv_cons_format.js',
    '../cons/scv_cons_bom_rev_comp.js',
    '../cons/scv_cons_approvalstatus.js',
    '../cons/scv_cons_search.js',
    '../cons/scv_cons_search_wo_revison_qty.js',
    '../cons/scv_cons_search_create_nwo_from_nso.js',
    '../cons/scv_cons_ordertype.js',
    '../cons/scv_cons_work_order_type.js'
],
    function(search, record, url,
        lbf,
        constFormat,
        constBomRevComp,
        constApprovalStatus,
        constSearch, 
        constSearchWORevisonQty,
        constSearchCreateNWOFromNSO,
        constOrderType,
        constWorkOrderType
    ) {
        const TYPE = "workorder";
        const FIELD = {
            ID: "id",
            INACTIVE: "isinactive",
            NAME: "name"
        }
    
        const SUBLIST = {
            ITEM: {
                ID: "item",
                TYPE : "transactionline",
                FIELD: {}
            },
        }
    
        const RECORDS = {
        }

        const getDataSource = (_filters) => {
            let resultSearch =  constSearch.createSearchWithFilter({
                type: "workorder",
                filters:
                [
                    
                ],
                columns:
                [
                    "internalid",
                    "tranid", "subsidiary",
                    "location", "item", "custbody_scv_so_thong_ke_sx"
                ]
            }, _filters);
            
            let arrResult = constSearch.fetchResultSearchRunEach(resultSearch, function(_objTmpl, _column){
                let objResTmpl = constSearch.getObjResultFromSearchByKey(_objTmpl, _column, [
                    "internalid",
                    "tranid", "subsidiary",
                    "location", "item", "custbody_scv_so_thong_ke_sx"
                ]);

                return objResTmpl;
            });
            
            return arrResult;
        }

        const genQCSerialCode = (curRec) =>{
            let itemSublistId = SUBLIST.ITEM.ID;
            let sizeItemSublist = curRec.getLineCount(itemSublistId);

            let colQCSerialCode = "";

            for(let i = 0; i < sizeItemSublist; i++){
                colQCSerialCode = curRec.getSublistValue(itemSublistId, "custcol_scv_qc_serial_code", i);

                if(!!colQCSerialCode) break;
            }

            let bodyQCSerialCode_old = curRec.getValue("custbody_scv_qc_serial_code");
            let bodyQCSerialCode_new = !!colQCSerialCode ? colQCSerialCode.substring(0, 4).padStart(4, "0") : "";

            if(bodyQCSerialCode_old == bodyQCSerialCode_new) return null;

            curRec.setValue("custbody_scv_qc_serial_code", bodyQCSerialCode_new);

            let objRes = {
                custbody_scv_qc_serial_code: bodyQCSerialCode_new
            }

            return objRes;
        }

        const updateUseStdBomQtySlItem = (curRec) => {
            let bomRev = curRec.getValue('billofmaterialsrevision');
            if(!bomRev) return;

            let arrBomRevComp = constBomRevComp.getDataByBomRev(bomRev);
            if(arrBomRevComp.length == 0) return;

            let slItem = 'item';
            for(let i = 0; i < curRec.getLineCount(slItem); i++){
                let item = curRec.getSublistValue(slItem, 'item', i);
                let bomRevComp = curRec.getSublistValue(slItem, 'bomrevisioncomponent', i);
                let objBomRevComp = arrBomRevComp.find(e => e.item == item && e.id == bomRevComp);   
                if(!objBomRevComp) continue;
             
                let useStdBomQty = objBomRevComp.custrecord_scv_use_std_bom_qty == 'T' ? true : false;
                curRec.setSublistValue({sublistId: slItem, fieldId: 'custcol_scv_use_std_bom_qty', line: i, value: useStdBomQty});
            }
        }

        const updateQuantitySlItem = (curRec, oldRecord) => {
            let quantity = curRec.getValue('quantity') * 1;
            if(!quantity) return;
    
            let unit_conversion_rate = curRec.getValue('custbody_scv_unit_conversion_rate') * 1;
            if(!unit_conversion_rate) return;

            let billofmaterialsrevision = curRec.getValue('billofmaterialsrevision');
            if(!billofmaterialsrevision) return;

            if(oldRecord){
                if(
                    quantity !== oldRecord.getValue('quantity') || 
                    unit_conversion_rate !== oldRecord.getValue('custbody_scv_unit_conversion_rate') ||
                    billofmaterialsrevision !== oldRecord.getValue('billofmaterialsrevision') || 
                    curRec.getValue('billofmaterials') !== oldRecord.getValue('billofmaterials') ||
                    curRec.getValue('location') !== oldRecord.getValue('location')
                ){
                    
                }else{
                    return;
                }
            }
      
            let arrSS_woRevisonQty = getDataSS_woRevisonQty(billofmaterialsrevision);
            if(arrSS_woRevisonQty.length == 0) return;
    
            let lkBOM = search.lookupFields({type: 'bom', id: billofmaterialsrevision, columns: ['usecomponentyield']});         
            let fieldUpd = 'quantity';
            if(lkBOM.usecomponentyield) fieldUpd = 'bomquantity';
            
            let slItem = 'item';
            for(let i = 0; i < curRec.getLineCount(slItem); i++){
                let item = curRec.getSublistValue(slItem, 'item', i);
                let objSS_woRevisonQty = arrSS_woRevisonQty.find(e => e.key_mapping == billofmaterialsrevision + item);
                if(!objSS_woRevisonQty) continue;
                let qtyUpd = quantity * objSS_woRevisonQty.qty;
                if(!curRec.getSublistValue(slItem, 'custcol_scv_use_std_bom_qty', i)){
                    qtyUpd *=  unit_conversion_rate;
                }
    
                curRec.setSublistValue({sublistId: slItem, fieldId: fieldUpd, line: i, value: qtyUpd});
            }
        }
        
        const getDataSS_woRevisonQty = (billofmaterialsrevision) => {
            let myFilters = [];
            myFilters.push(
                search.createFilter({name: 'internalid', operator: 'anyof', values: billofmaterialsrevision})
            );
            return constSearchWORevisonQty.getDataSource(myFilters)
        }

        const loadDataFromSO = (scriptContext) => {
            if(!['create'].includes(scriptContext.type)) return;

            let params = scriptContext.request?.parameters || {}; 
            let soid = params.soid;
            let soline = params.soline;
            let assemblyitem = params.assemblyitem;
            if(!soid || !soline) return;

            let curRec = scriptContext.newRecord;
            let soRec = record.load({type: 'salesorder', id: soid});
            let slItem = 'item';
            for(let i = 0; i < soRec.getLineCount(slItem); i++){
                let line = soRec.getSublistValue(slItem, 'line', i);
                if(line != soline) continue;

                let item = soRec.getSublistValue(slItem, 'item', i);
                if(item != assemblyitem) continue;
    
                curRec.setValue('custbody_scv_oriline_id', soRec.getSublistValue(slItem, 'custcol_scv_ori_lineid', i));
                curRec.setValue('custbody_scv_memo_02', soRec.getSublistValue(slItem, 'custcol_scv_memo_2', i));
                curRec.setValue('custbody_scv_work_order_type', soRec.getSublistValue(slItem, 'custcol_scv_wo_type', i));
                curRec.setValue('location', soRec.getSublistValue(slItem, 'location', i));
                break;
            }
        }

        /**
         * Task: https://app.clickup.com/t/86cy2jttc
         * Script Used: 
         *  + scv_sl_so2wo.js
         *  + scv_mr_so2wo.js
         * */
        const createWorkOrderBySO = (_objResData) =>{
            let soLkf = search.lookupFields({
                type: "salesorder", id: _objResData.custpage_col_transaction,
                columns: [
                    "custbody_scv_order_type"
                ]
            });
            let objResSO = {};
            if(!!soLkf.custbody_scv_order_type && soLkf.custbody_scv_order_type.length > 0){
                objResSO.custbody_scv_order_type = soLkf.custbody_scv_order_type[0].value * 1;
            }

            let woRec = record.create({
                type: "workorder",
                isDynamic: true
            });
            woRec.setValue("subsidiary", _objResData.custpage_col_subsidiary_id);

            if(!!_objResData.custpage_col_tolerance_min){
                _objResData.custpage_col_tolerance_min = _objResData.custpage_col_tolerance_min.replace("%", "") * 1;
            }

            if(!!_objResData.custpage_col_tolerance_max){
                _objResData.custpage_col_tolerance_max = _objResData.custpage_col_tolerance_max.replace("%", "") * 1;
            }

            if(objResSO.custbody_scv_order_type != constOrderType.RECORDS.MUA_BAN_NOI_BO.ID){
                woRec.setValue("entity", _objResData.custpage_col_customer_id);
            }

            lbf.setValueData(woRec, [
                "custbody_scv_sales_order", "assemblyitem",
                "custbody_scv_qc_serial_code", "quantity",
                "location", "custbody_scv_work_order_type",
                "billofmaterials", "billofmaterialsrevision",
                "memo", "custbody_scv_order_type",
                "custbody_scv_approval_status", "custbody_scv_oriline_id",
                "custbody_scv_tolerance_min_percent", "custbody_scv_tolerance_max_percent"
            ], [
                _objResData.custpage_col_transaction, _objResData.custpage_col_item_id,
                _objResData.custpage_col_serialcode, _objResData.custpage_col_quantity,
                _objResData.custpage_col_location, _objResData.custpage_col_workordertype,
                _objResData.custpage_col_bom, _objResData.custpage_col_bomrevison,
                _objResData.custpage_col_note, _objResData.custpage_col_ordertype,
                constApprovalStatus.RECORDS.OPEN.ID, _objResData.custpage_col_orilineid,
                _objResData.custpage_col_tolerance_min, _objResData.custpage_col_tolerance_max
            ]);

            //=0 || null || undefine
            if(!_objResData.custpage_col_tolerance_min){
                woRec.setValue("custbody_scv_tolerance_qty", 0);
            }
            if(!_objResData.custpage_col_tolerance_max){
                woRec.setValue("custbody_scv_tolerance_qty_plus", 0);
            }

            if(!!_objResData.custpage_col_requestdt){
                _objResData.custpage_col_requestdt = constFormat.parseDate(_objResData.custpage_col_requestdt);

                woRec.setValue("requesteddate", _objResData.custpage_col_requestdt);
            }

            if(!!_objResData.custpage_col_crtdt){
                _objResData.custpage_col_crtdt = constFormat.parseDate(_objResData.custpage_col_crtdt);

                woRec.setValue("trandate", _objResData.custpage_col_crtdt);
            }
            let woRecId = woRec.save({enableSourcing: false, ignoreMandatoryFields: true});
            
            return woRecId;
        }

        const addBtnCreateWOHangLoat = (_form, _sourceRec) => {
            let myFilters = [];

            if(_sourceRec.type == 'salesorder'){
                myFilters.push(search.createFilter({
                    name: 'internalid', operator: "anyof", values: _sourceRec.id
                }));
            }
            if(myFilters.length == 0) return;

            let arrResult = constSearchCreateNWOFromNSO.getDataSource(myFilters);
            if(arrResult.length == 0) return;

            let urlScript = url.resolveScript({
                scriptId: 'customscript_scv_sl_so2wo',
                deploymentId: 'customdeploy_scv_sl_so2wo',
                params: {
                    custpage_subsidiary: _sourceRec.getValue("subsidiary"),
                    custpage_tranid: _sourceRec.id,
                    custpage_fromdt: _sourceRec.getText("trandate"),
                    custpage_todt: _sourceRec.getText("trandate"),
                    isSearch: "T"
                }
            });

            _form.addButton({
                id: "custpage_scv_btn_so2wo",
                label: "Tạo nhiều WO",
                functionName: "window.open('" + urlScript + "');"
            });
        }

        const genAssemblyLotNumber = (curRec, oldRec) =>{
            let assemblyLotNo = "";//curRec.getValue("custbody_scv_assembly_lot");

            let workOrderTypeId = curRec.getValue("custbody_scv_work_order_type");
            let orderTypeId = curRec.getValue("custbody_scv_order_type");

            let prefix_XXXX = curRec.getValue("custbody_scv_qc_serial_code") + "";
            prefix_XXXX = !!prefix_XXXX ? prefix_XXXX.padStart(4, "0") : "";

            let prefix_XXXX_old = !!oldRec ? (oldRec.getValue("custbody_scv_qc_serial_code") + "") : "";
            prefix_XXXX_old = !!prefix_XXXX_old ? prefix_XXXX_old.padStart(4, "0") : "";

            let prefix_YYY = curRec.getValue("custbody_scv_so_thong_ke_sx") + "";
            
            let prefix_YYY_old = !!oldRec ? (oldRec.getValue("custbody_scv_so_thong_ke_sx") + "") : "";

            if(prefix_XXXX == prefix_XXXX_old && prefix_YYY == prefix_YYY_old) return null;
            
            if(workOrderTypeId == constWorkOrderType.RECORDS.SX_ACP.ID
                && [
                    constOrderType.RECORDS.HANG_SX_THU_NGHIEM.ID,
                    constOrderType.RECORDS.HANG_SX_DANH_GIA.ID,
                    constOrderType.RECORDS.MUA_BAN_NOI_BO.ID,
                    constOrderType.RECORDS.SX_HANG_TON_KHO.ID,
                    constOrderType.RECORDS.SX_HANG_KHACH_DAT_NOI_DIA.ID,
                ].includes(orderTypeId * 1)
            ){
                //TH1
                assemblyLotNo = prefix_XXXX + (!!prefix_XXXX ? "." : "") + prefix_YYY;
            }
            else if(workOrderTypeId == constWorkOrderType.RECORDS.SX_ACP.ID 
                && orderTypeId == constOrderType.RECORDS.SX_HANG_KHACH_DAT_XUAT_KHAU.ID)
            {
                //TH2
                assemblyLotNo = prefix_YYY;
            }
            else if([
                    constWorkOrderType.RECORDS.SX_AC_LCN.ID
                    //constWorkOrderType.RECORDS.SX_MAU_AC_LCN.ID
                ].includes(workOrderTypeId * 1)
            )
            {
                //TH3
                assemblyLotNo = prefix_XXXX;
            }
            else{
                return null;
            }


            curRec.setValue("custbody_scv_assembly_lot", assemblyLotNo);

            return assemblyLotNo;
        }
        
        return {
            TYPE,
            FIELD,
            SUBLIST,
            RECORDS,
            getDataSource,
            genQCSerialCode,
            updateQuantitySlItem,
            loadDataFromSO,
            updateUseStdBomQtySlItem,
            createWorkOrderBySO,
            addBtnCreateWOHangLoat,
            genAssemblyLotNumber
        };
        
    });
    