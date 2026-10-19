/**
 * Nội dung: 
 * Key word: 
 * =======================================================================================
 *  Date                Author                  Description
 *  ?                   ?                       ?
 *  05 Nov 2024         Phu Pham                Init, create file
 *  05 Nov 2024         Phu Pham                Add button phân bổ nhà cung cấp from mr. Hải (https://app.clickup.com/t/86cwzb5he)
 *  08 Nov 2024         Khanh Tran              Add button 'Create WO' tại OWO from mr. Bính (https://app.clickup.com/t/86cx0f856)
 *  19 Nov 2024         Khanh Tran              Add button 'Tính giá cở sở' from ms. Ngọc (https://app.clickup.com/t/86cx3r94u)
 *  12 Dec 2024         Phu Pham                Add button Select Lot màn hình Lifting/Lowering Material History from mr. Việt (https://app.clickup.com/t/86cx6m7h0)
 *  13 Dec 2024         Huy Pham                Nút Calculate tính toán trên màn hình Kế hoạch mua hàng, from mr.Hải(https://app.clickup.com/t/86cx9p7x4)
 *  17 Dec 2024         Phu Pham                Add button Nâng/ Hạ cho line của màn hình WO from mr. Việt (https://app.clickup.com/t/86cxaktnw)
 *  10 Jan 2025         Khanh Tran              Add button "PAKT" và "Thông báo PAKT" tại Công việc ISO from Ms. Ngọc(https://app.clickup.com/t/86cxmgc75)
 *  16 Jan 2025         Khanh Tran              Add button 'Create WO' tại ITO from mr. Việt (https://app.clickup.com/t/86cxnyadd)        
 *  25 Feb 2025         Huy Pham                Nút "Tạo nhiều WO" trên SO, fromn ms.Ngọc(https://app.clickup.com/t/86cy2jttc)
 *  02 Mar 2025         Huy Pham                Nút "Print Label" trên Bin, move from CPC, fromn mr.Việt(https://app.clickup.com/t/86cy2e9ha)
 *  02 Mar 2025         Khanh Tran              Nút "Chuyển kho" trên Inventory Status Change, from mr.Huy(https://app.clickup.com/t/86cydnndh)
 *  09 Apr 2025         Khanh Tran              Add button 'Complete' tại Inbound Shipment from Ms.Hải(https://app.clickup.com/t/86cyg1m4k)
 *  14 May 2025         Huy Pham                Nút "Tạo đơn mua nội bộ" trên SO, from ms.Ngọc(https://app.clickup.com/t/86cyxbm9m)        
 *  04 Jul 2025         Khanh Tran              Nút Tính đơn giá" Trên màn hình Item receipt, from ms.Kỳ(https://app.clickup.com/t/86cyknytj)   
 */
/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define([
    'N/url', 'N/runtime', 'N/query', 'N/file', 'N/ui/message', 'N/record',
    '../lib/scv_lib_function.js', 
    '../lib/scv_lib_common_html.js',
    '../cons/scv_cons_approvalstatus.js',
    '../cons/scv_cons_ordertype.js',
    '../cons/scv_cons_other_work_order.js',
    '../cons/scv_cons_calc_base_price.js',
    '../cons/scv_cons_list_plan_type.js',
    '../cons/scv_cons_purchaseplan.js',
    '../cons/scv_cons_list_task_type.js',
    '../cons/scv_cons_ito.js',
    '../cons/scv_cons_workorder.js',
    '../cons/scv_cons_search_so_tinh_ck_khac.js',
    '../cons/scv_cons_work_order_type.js',
    '../cons/scv_cons_tolerance_values.js'
],
    
    (
        url, runtime, query, file, message, record,
        lbf, libHtml, constApprStatus, 
        constOrderType, constOWO,
        constCalcBasePrice, constListPlanType,
        constPurchasePlan, constListTaskType,
        constIto, constWorkOrder,
        constSoTinhCKKhac,
        constWorkOrderType,
        constTolVal,
    ) => {

        const customForm = {
            theoDoiPAKT: {
                ID: 620,
                NAME: "Theo dõi PAKT"
            }
        }

        const OrderStatus = {
            RELEASED: "B",
            PLANNED: "D",
            BUILT: "G"
        };

        const Role = {
            Administrator: {
                NAME: "Administrator",
                ID: 3
            }
        }

        /**
         * Defines the function definition that is executed before record is loaded.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @param {Form} scriptContext.form - Current form
         * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
         * @since 2015.2
         */
        const beforeLoad = (scriptContext) => {
            addButtonTypeView(scriptContext);
            addButtonTypeCreateEditCopy(scriptContext);
        }

        const addButtonTypeCreateEditCopy = (scriptContext) => {
            if(!["create", "edit", "copy"].includes(scriptContext.type)) return;

            let form = scriptContext.form;
            let newRec = scriptContext.newRecord;

            switch(newRec.type){
                case "salesorder":
                    // constCalcBasePrice.addButtonCalcBasePrice(form, newRec);
                    break;
                case "customrecord_scv_lifting_mat_history":
                    addButtonSelectLot(form, newRec);
                    break;
            }
        }

        const addButtonTypeView = (scriptContext) => {
            if(scriptContext.type != "view") return;

            let form = scriptContext.form;
            let newRec = scriptContext.newRecord;
            let request = scriptContext.request;
            let arrBtnPrint = [];

            switch (newRec.type){
                case "custompurchase_scv_purchase_request":
                    addButtonPhanBoNCC(form, newRec, request);
                    break;
                case "custompurchase_scv_other_work_order":
                    constOWO.addBtnCrtWO(form, newRec);
                    break;
                case "workorder":
                    addBtnIssueMROComponent(form, newRec);
                    addBtnNhapThuHoiGC(form, newRec);
                    addBtnLifting_LoweringOnSublist(form, newRec);
                    break;
                case "salesorder":
                    libHtml.addFieldFuncLoading(form);
                    addBtnCalcPaymentPrice(form, newRec);
                    addBtnTinhDGTT(form, newRec);
                    addBtnTinhLaiCK_Khac(form, newRec);

                    constWorkOrder.addBtnCreateWOHangLoat(form, newRec);
                    constIto.addBtnSO2InTO(form, newRec);
                    addBtnSO2PO(form, newRec);
                    break;
                case "custompurchase_scv_purchase_plan":
                    addBtnKeHoachDieuChinh(form, newRec);
                    
                    constPurchasePlan.addBtnCalculate(form, newRec);
                    break;
                case "task":
                    // addBtnPakt(form, newRec, arrBtnPrint)
                    break
                case "intercompanytransferorder":
                    constIto.addBtnCrtWO(form, newRec);
                    break
                case 'bin':
                    addBtnPrintLabel(form, newRec);
                    break;
                case 'inventorystatuschange':
                    addBtnChuyenKho(form, newRec);
                    break;
                case 'inboundshipment':
                    addBtnComplete(form, newRec);
                    break;
                case "assemblybuild":
                    addBtnCreateYCDCThanhPham(form, newRec);
                    break;
                case "itemreceipt":
                    constTolVal.addBtnCalcRate(form, newRec);
                    break;
                case "customrecord_nvd_cong_viec_iso":
                    addBtnPakt(form, newRec, arrBtnPrint);
                    break;
                
            }

            libHtml.addIconButtonExport(form, arrBtnPrint, "custpage_add_icon_prt");
        }

        const addBtnPrintPdf = (form, newRec, arrBtnPrint, btnLabel, btnId, printFile) => {
            let recType = newRec.type;
            let createPdfUrl = url.resolveScript({
                scriptId: 'customscript_scv_sl_addition_print',
                deploymentId: 'customdeploy_scv_sl_addition_print',
                returnExternalUrl: false
            });
            createPdfUrl += '&id=' + newRec.id + '&type=' + recType + '&printfile=' + printFile;
            form.addButton({
                id: btnId,
                label: btnLabel,
                functionName: "window.open('" + createPdfUrl + "');"
            });
            arrBtnPrint.push({export_type: "PDF", id: btnId});
        }

        const addBtnCreateYCDCThanhPham = (form, newRec) => {
            let lstRelated = newRec.getValue("custbody_scv_related_transaction") || [];
            if(lstRelated.length > 0) return;
            let trandate = newRec.getText("trandate");

            let urlScript = url.resolveScript({
                scriptId: 'customscript_scv_sl_mass_create_to',
                deploymentId: 'customdeploy_scv_sl_mass_create_to',
                params: {
                    rectype: newRec.type,
                    recid: newRec.id,
                    custpage_fromdt: trandate,
                    custpage_todt: trandate,
                    isrun: "T"
                }
            });
            
            form.addButton({
                id: 'custpage_scv_btn_crt_to',
                label: 'Tạo YCĐC thành phẩm',
                functionName: `window.location.replace('${urlScript}')`
                // functionName: `nlExtOpenWindow('${urlScript}', 'popupCrtTO', window.innerWidth - 300, window.innerHeight - 200, this, true, "Tạo Yêu cầu điều chuyển thành phẩm từ Phiếu thống kê");`
            });
        }

        const addBtnComplete = (form, newRec) => {
            if(newRec.type == "inboundshipment" && newRec.getValue("shipmentstatus") != 'closed') {
                let urlScript = url.resolveScript({
                    scriptId: 'customscript_scv_sl_complete_inbship',
                    deploymentId: 'customdeploy_scv_sl_complete_inbship',
                    params: {
                        rectype: newRec.type,
                        recid: newRec.id,
                        isSearch: 'T'
                    }
                });
                
                form.addButton({
                    id: 'custpage_scv_btn_complete',
                    label: 'Complete',
                    functionName: `window.location.replace('${urlScript}')`
                });
            } 
        }

        const addBtnPakt = (form, newRec, arrBtnPrint) => {
            let curRec = record.load({
                type: newRec.type, id: newRec.id
            });

            if(curRec.getValue('customform')*1 !== customForm.theoDoiPAKT.ID) return;
            addBtnPrintPdf(form, newRec, arrBtnPrint, "PAKT", "custpage_pakt", "scv_render_pakt_pdf");
            addBtnPrintPdf(form, newRec, arrBtnPrint, "Thông Báo PAKT", "custpage_tb_pakt", "scv_render_tb_pakt_pdf");
        }

        const expWord = async (params)  => {
            try {
                libWord.showLoadingDialog(true);
                let objResponse = await libWord.postRequestByAjax(params.urlData, {recId: params.recId, recType: params.recType, templateId: params.templateId});
                if (objResponse.isSuccess == false) {
                    alert(objResponse.msg);
                    libWord.showLoadingDialog(false);
                    return;
                }
        
                let objData = objResponse.data;
                let content = await libWord.loadFile(params.urlTemplate);
                let doc = libWord.createDoc(content);
                doc.render(objData);
                libWord.saveFile(doc, params.fileName);
                libWord.showLoadingDialog(false);
            } catch (err) {
                alert(err.toString());
                libWord.showLoadingDialog(false);
            }
        }

        const addBtnExpWord = (form, curRec, arrBtnPrint, btnId, btnLabel, params) => {
            form.addButton({
                id: btnId, label: btnLabel, functionName: `(${expWord})(JSON.parse('${params}'))`
            });
            arrBtnPrint.push(
                {export_type: "WORD", id: btnId},
            );

            if(!form.getField('custpage_scv_inlinehtml_word_libs')){
                let sqlQuery = `SELECT name, url 
                    FROM file
		            WHERE name in ('scv_js_export_word.js', 'docxtemplater.min.js', 'jquery.min.js', 'FileSaver.min.js', 'pizzip-utils.js', 'pizzip.js')`;
                let resultSearch = query.runSuiteQL({
                    query: sqlQuery,
                    pageSize: 1000
                });
		        resultSearch = resultSearch.asMappedResults();
                form.addField({
                    id: 'custpage_scv_inlinehtml_word_libs', label: 'inlinehtml', type: 'inlinehtml',
                }).defaultValue = resultSearch.map(file => 
                    `<script type="text/javascript" src="${file.url}"></script>`
                ).join("\n");
            }
        }

        const addButtonSelectLot = (form, newRec) => {
            let funcText = `require(['N/currentRecord', 'N/url'], (currentRecord, url) => {
                const curRec = currentRecord.get();
                let location = curRec.getValue("custrecord_scv_lift_mat_location");
                let item = curRec.getValue("custrecord_scv_lift_mat_item");
                let subsidiary = curRec.getValue("custrecord_scv_lift_mat_subsidiary");
                if(!item) {
                    return alert("Vui lòng nhập Item để thực hiện chức năng này!");
                }
                
                let urlScript = url.resolveScript({
                    scriptId: 'customscript_scv_sl_popup_inv_balance',
                    deploymentId: 'customdeploy_scv_sl_popup_inv_balance',
                    returnExternalUrl: false,
                    params: {
                        item, recType: curRec.type, subsidiary
                    }
                });
                nlExtOpenWindow(urlScript, 'popupInvBalance', window.innerWidth - 400, window.innerHeight - 300, this, true, "Inventory Balance");
            });`;
            
            form.addButton({
                id: "custpage_scv_btn_select_lot",
                label: "Select Lot",
                functionName: funcText
            });
        }

        const addBtnLifting_LoweringOnSublist = (form, newRec) => {
            let approval_status = newRec.getValue("custbody_scv_approval_status");

            if(approval_status == constApprStatus.RECORDS.APPROVED.ID) {
                let sublistId = "item";
                let totalLine = newRec.getLineCount(sublistId);
                let arrResult = [];

                for(let i = 0; i < totalLine; i++) {
                    let item = newRec.getSublistValue(sublistId, "item", i);
                    let lot_serial_selected = newRec.getSublistValue(sublistId, "custcol_scv_lot_serial_selected", i);
                    let qc_serial_code = newRec.getSublistValue(sublistId, "custcol_scv_qc_serial_code", i);
                    let units = newRec.getSublistValue(sublistId, "units", i);
    
                    arrResult.push({ 
                        line: i,
                        item, lot_serial_selected, 
                        qc_serial_code, units 
                    });
                }
                let arrItemId = groupDataByFieldId(arrResult, "item");
                let arrItem = getDataItemById(arrItemId);
                let arrGrpLv2Id = groupDataByFieldId(arrItem, "custitem_scv_group_lv2");
                let arrGroupLevel = getDataGroupLevelById(arrGrpLv2Id);
                // for list button nang/ ha
                let listBtnNangHa = hanldeDataShowButtonNangHaOnSublist(arrResult, arrItem, arrGroupLevel);
                let arrLiftingLowering = getDataLiftingLoweringMatHistory(newRec.id);
                // add field inline html
                let htmlFile = file.load({id: '../html/scv_html_btn_lifting_lowering.html'}).getContents();
                let inlinehtmlField = form.addField({
                    id: 'custpage_html_btn_lifting_lowering',
                    type: "inlinehtml",
                    label: 'HTML'
                });

                inlinehtmlField.defaultValue = 
                `<script>
                    let arrData = ${JSON.stringify(listBtnNangHa)};
                    let arrLiftingLowering = ${JSON.stringify(arrLiftingLowering)};
                </script>\n` + 
                htmlFile;
            }
        }

        const hanldeDataShowButtonNangHaOnSublist = (arrResult, arrItem, arrGroupLevel) => {
            let arr = [];
            for(let objRes of arrResult) {
                let objItem = arrItem.find(e => e.id == objRes.item);
                if(!!objItem?.custitem_scv_group_lv2) {
                    let objGrpLevel = arrGroupLevel.find(e => e.id == objItem.custitem_scv_group_lv2);
                    if(objGrpLevel?.custrecord_scv_lift_check === "T") {
                        arr.push(objRes);
                    }
                }
            }
            return arr;
        }

        const getDataGroupLevelById = (data) => {
            if(data.length === 0) return [];

            let columns = [
                'id', 'name', 'custrecord_scv_lift_check'
            ];

            let sqlQuery = `SELECT ${columns.join(', ')} FROM customrecord_scv_group_level
		        WHERE id IN ('${data.join("','")}') AND isinactive = 'F'`;
            
            let resultSearch = query.runSuiteQL({
                query: sqlQuery,
                params: [],
                pageSize: 1000
            });

		    resultSearch = resultSearch.asMappedResults();
            return resultSearch;
        }

        const getDataItemById = (arrItemId) => {
            if(arrItemId.length === 0) return [];
            
            let columns = [
                'id', 'itemid', 'custitem_scv_group_lv2'
            ];

            let sqlQuery = `SELECT ${columns.join(', ')} FROM item
		        WHERE id IN ('${arrItemId.join("','")}') AND isinactive = 'F'`;
            
            let resultSearch = query.runSuiteQL({
                query: sqlQuery,
                params: [],
                pageSize: 1000
            });

		    resultSearch = resultSearch.asMappedResults();
            return resultSearch;
        }

        const groupDataByFieldId = (data, field) => {
            let objGroup = {};
            for(let i = 0; i < data.length; i++) {
                let fieldValue = data[i][field];
                if(objGroup[fieldValue] === undefined && !!fieldValue) {
                    objGroup[fieldValue] = fieldValue;
                }
            }
            return Object.values(objGroup);
        }

        const getDataLiftingLoweringMatHistory = (internalId) => {
            let columns = [
                'id', 'name', 'custrecord_scv_lift_mat_lift_type', 'custrecord_scv_lift_mat_item',
                'custrecord_scv_lift_mat_lot_serial', 'custrecord_scv_lift_mat_qc_material'
            ];

            let sqlQuery = `SELECT ${columns.join(', ')} FROM customrecord_scv_lifting_mat_history
		        WHERE custrecord_scv_lift_mat_wo_related = ${internalId} AND isinactive = 'F'`;
            
            let resultSearch = query.runSuiteQL({
                query: sqlQuery,
                pageSize: 1000
            });
		    resultSearch = resultSearch.asMappedResults();
            
            let arrResult = [];
            for(let i = 0; i < resultSearch.length; i++) {
                let objRes = resultSearch[i];
                arrResult.push(formatValueWithObject(objRes));
            }
            return arrResult;
        }

        const formatValueWithObject = (_inputObj) => {
            for(let property in _inputObj) {
                if(_inputObj[property] == null || _inputObj[property] == undefined) {
                    _inputObj[property] = "";
                }
            }
            return _inputObj;
        }

        const addBtnKeHoachDieuChinh = (form, newRec) => {
            let approval_status = newRec.getValue("custbody_scv_approval_status");
            let plan_type = newRec.getValue("custbody_scv_pur_plan_type");
            let isCancelKHDC = checkAllKHDCLinesCancel(newRec);

            if(
                !isCancelKHDC && approval_status == constApprStatus.RECORDS.APPROVED.ID && 
                (plan_type == constListPlanType.RECORDS.KE_HOACH_BAN_DAU.ID || plan_type == constListPlanType.RECORDS.KE_HOACH_DIEU_CHINH.ID)
            ) {
                let urlScript = url.resolveScript({
                    scriptId: 'customscript_scv_sl_popup_crt_khdc',
                    deploymentId: 'customdeploy_scv_sl_popup_crt_khdc',
                    params: { rectype: newRec.type, recid: newRec.id }
                });
                form.addButton({
                    id: "custpage_scv_btn_khdc",
                    label: "Kế hoạch điều chỉnh",
                    functionName: `nlExtOpenWindow('${urlScript}', 'popupCrtKHDC', window.innerWidth - 300, window.innerHeight - 200, this, true, "Create KHDC");`
                });
            }
        }

        const checkAllKHDCLinesCancel = (newRec) => {
            let sublistId = "item";
            let totalLine = newRec.getLineCount(sublistId);
            for(let i = 0; i < totalLine; i++) {
                let cancel = newRec.getSublistValue(sublistId, "custcol_scv_cancel", i);
                if(cancel === false) return false;
            }
            return true;
        }

        const addBtnIssueMROComponent = (form, newRec) => {
            let work_order_type = newRec.getValue("custbody_scv_work_order_type");
            let orderstatus = newRec.getValue("orderstatus");

            if(
                work_order_type == constWorkOrderType.RECORDS.GIA_CONG_CO_KHI.ID
                && [OrderStatus.BUILT, OrderStatus.PLANNED, OrderStatus.RELEASED].includes(orderstatus)
            ) {
                let urlScript = url.resolveScript({
                    scriptId: 'customscript_scv_sl_issue_mro_components',
                    deploymentId: 'customdeploy_scv_sl_issue_mro_components',
                    params: { rectype: newRec.type, recid: newRec.id }
                });

                form.addButton({
                    id: "custpage_scv_btn_issue_mro_comp",
                    label: "Xuất vật tư GC",
                    // functionName: `window.location.replace('${urlScript}')`
                    functionName: `nlExtOpenWindow('${urlScript}', 'popupXuatVTGC', window.innerWidth - 200, window.innerHeight - 100, this, true, "Xuất vật tư tiêu hao gia công");`
                });
            }
        }

        const addBtnNhapThuHoiGC = (form, newRec) => {
            let work_order_type = newRec.getValue("custbody_scv_work_order_type");
            let orderstatus = newRec.getValue("orderstatus");

            if(
                work_order_type == constWorkOrderType.RECORDS.GIA_CONG_CO_KHI.ID
                && [OrderStatus.BUILT, OrderStatus.PLANNED, OrderStatus.RELEASED].includes(orderstatus)
            ) {
                let urlScript = url.resolveScript({
                    scriptId: 'customscript_scv_sl_nhap_thu_hoi_gc',
                    deploymentId: 'customdeploy_scv_sl_nhap_thu_hoi_gc',
                    params: { rectype: newRec.type, recid: newRec.id }
                });

                form.addButton({
                    id: "custpage_scv_btn_nhap_thu_hoi_gc",
                    label: "Nhập thu hồi GC",
                    functionName: `nlExtOpenWindow('${urlScript}', 'popupNhapTHGC', window.innerWidth - 200, window.innerHeight - 100, this, true, "Nhập vật tư thu hồi gia công");`
                });
            }
        }

        const addBtnCalcPaymentPrice = (form, newRec) => {
            // let order_type = newRec.getValue("custbody_scv_order_type");
            // let approval_status = newRec.getValue("custbody_scv_approval_status");
            let intercotransaction = newRec.getValue("intercotransaction");
            // let statusRef = newRec.getValue("statusRef");
            let orderStatus = newRec.getValue("orderstatus");
            let urlScript = url.resolveScript({
                scriptId: 'customscript_scv_sl_calc_payment_price',
                deploymentId: 'customdeploy_scv_sl_calc_payment_price',
                params: { rectype: newRec.type, recid: newRec.id }
            });

            let funcName = `require([], () => {
                scvShowLoadingUE(true);
                setTimeout((e) => {
                    window.location.replace('${urlScript}');
                }, 200); 
            })`;

            if(!intercotransaction && orderStatus !== "G") {
                form.addButton({
                    id: "custpage_scv_btn_calc_payment_price",
                    label: "Tính giá TT",
                    functionName: funcName
                });
            }
        }

        const addBtnTinhDGTT = (form, newRec) => {
            let intercotransaction = newRec.getValue("intercotransaction");
            // let statusRef = newRec.getValue("statusRef");
            let orderStatus = newRec.getValue("orderstatus");
            let urlScript = url.resolveScript({
                scriptId: 'customscript_scv_sl_calc_paymentprice_v2',
                deploymentId: 'customdeploy_scv_sl_calc_paymentprice_v2',
                params: { rectype: newRec.type, recid: newRec.id }
            });

            let funcName = `require([], () => {
                scvShowLoadingUE(true);
                setTimeout((e) => {
                    window.location.replace('${urlScript}');
                }, 200); 
            })`;

            let objUser = runtime.getCurrentUser();

            if(!intercotransaction && orderStatus !== "G" && objUser.role == Role.Administrator.ID) {
                form.addButton({
                    id: "custpage_scv_calc_payment_pricev2",
                    label: "Tính ĐGTT",
                    functionName: funcName
                });
            }
        }

        const addBtnTinhLaiCK_Khac = (form, newRec) => {
            let urlScript = url.resolveScript({
                scriptId: 'customscript_scv_sl_recalc_ck_khac',
                deploymentId: 'customdeploy_scv_sl_recalc_ck_khac',
                params: { rectype: newRec.type, recid: newRec.id }
            });

            let funcName = `require([], () => {
                scvShowLoadingUE(true);
                setTimeout((e) => {
                    window.location.replace('${urlScript}');
                }, 200); 
            })`;
            // dieu kien hien thi nut
            let data = constSoTinhCKKhac.getDataSourceWithId(newRec.id);
            if(data.length > 0) {
                form.addButton({
                    id: "custpage_scv_btn_recalc_ck_khac",
                    label: "Tính lại CK khác",
                    functionName: funcName
                });
            }
        }

        const addButtonPhanBoNCC = (form, newRec, request) => {
            let params = request?.parameters || {};
            let approval_status = newRec.getValue("custbody_scv_approval_status");
            if(approval_status == constApprStatus.RECORDS.OPEN.ID || approval_status == constApprStatus.RECORDS.REJECTED.ID) {
                let urlScript = url.resolveScript({
                    scriptId: 'customscript_scv_sl_allocate_entity',
                    deploymentId: 'customdeploy_scv_sl_allocate_entity',
                    params: { custpage_rectype: newRec.type, custpage_recid: newRec.id }
                });
    
                form.addButton({
                    id: "custpage_scv_btn_phanbo_ncc",
                    label: "Phân bổ NCC",
                    functionName: `window.location.replace('${urlScript}')`
                });
            }

            if(params.isAllocateVendor == "F") {
                form.addPageInitMessage({
                    type: message.Type.WARNING, 
                    message: "Tổng số lượng nhập của vendor không bằng plan quantity (item). Không thể thực hiện phân bổ NCC!",
                    duration: -1
                });
            } else if(params.isAllocateVendor == "T") {
                form.addPageInitMessage({
                    type: message.Type.CONFIRMATION, 
                    message: "Thực hiện phân bổ nhà cung cấp thành công!",
                    duration: -1
                });
            }
        }

        const addBtnPrintLabel = (form, newRec) =>{
            let urlScript = url.resolveScript({
                scriptId: 'customscript_scv_sl_print_label',
                deploymentId: 'customdeploy_scv_sl_print_label',
                params: {
                    rectype: newRec.type,
                    recid: newRec.id,
                    tmpl: "CUSTTMPL_SCV_BIN_LABEL"
                }
            });

            form.addButton({
                id: "custpage_btn_bin_printlabel",
                label: "Print Label",
                functionName: "window.open('" + urlScript + "');"
            });
        }

        const addBtnChuyenKho = (form, newRec) => {
            if(newRec.getValue('custbody_scv_check_transaction')) return;
            let approval_status = newRec.getValue('custbody_scv_approval_status');
            if(approval_status != constApprStatus.RECORDS.APPROVED.ID) return;
            let urlScript = url.resolveScript({
                scriptId: 'customscript_scv_sl_crt_to_from_isc',
                deploymentId: 'customdeploy_scv_sl_crt_to_from_isc',
                params: {
                    rectype: newRec.type,
                    recid: newRec.id,
                }
            });

            form.addButton({
                id: "custpage_btn_chuyen_kho",
                label: "Chuyển kho",
                functionName: "window.open('" + urlScript + "');"
            });
        }

        const addBtnSO2PO = (_form, _sourceRec) => {
            /* let order_type_id = _sourceRec.getValue("custbody_scv_order_type");
            if(order_type_id != constOrderType.RECORDS.MUA_BAN_NOI_BO.ID) return; */

            let orderstatus = _sourceRec.getValue("orderstatus");
            if(orderstatus != "B") return;

            let urlScript = url.resolveScript({
                scriptId: 'customscript_scv_sl_so2po',
                deploymentId: 'customdeploy_scv_sl_so2po',
                params: {
                    custpage_transaction: _sourceRec.id
                }
            });

            _form.addButton({
                id: "custpage_scv_btn_so2po",
                label: "Tạo đơn mua nội bộ",
                functionName: `nlExtOpenWindow('${urlScript}', 'popupSO2PO', window.innerWidth - 400, window.innerHeight - 300, this, true, "Tạo đơn mua nội bộ");`
            });
        }

        return { beforeLoad }

    });
