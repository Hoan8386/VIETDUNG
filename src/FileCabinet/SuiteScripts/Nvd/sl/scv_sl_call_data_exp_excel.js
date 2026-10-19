/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/search', 'N/record', 'N/query', 'N/file', 'N/runtime',
        '../lib/scv_lib_function.js',
        '../lib/scv_lib_amount_in_word.js',
        '../common/scv_common_theo_doi_phieu_in.js',
         '../lib/scv_lib_function'
    ],
    function (search, record, query, file, runtime,
              lbf,
              libAmt,
              comPhieuIn,
              lfunc
    ) {
        var isExcel = 'F';

        function onRequest(context) {
            let request = context.request;
            let params = request.parameters;
            log.error('params', params);
            isExcel = params.isExcel || 'F';
            let recType = params.recType
            let objResponse = {data: {}, isSuccess: true, msg: '', url: ''};
            try {
                if (params.isExcel) {
                    objResponse.url = getTemplateExportExcel(params.templateId);
                    log.error('objResponse.url', objResponse.url);
                }
                let rec = record.load({type: params.recType, id: params.recId});
                switch (params.templateId) {
                    case 'scv_xlsx_sales_contract_vn':
                    case 'scv_xlsx_sales_contract_en':
                        objResponse.data = getDataExpSc(params);
                        break;
                    case 'scv_xlsx_commercial_invoice':
                    case 'scv_xlsx_insurance':
                    case 'scv_xlsx_packing_list':
                    case 'scv_xlsx_detail_bl':
                        objResponse.data = getDataExpSd(params);//Shipment Documents
                        break;
                    case 'scv_xlsx_ycnxk':
                        objResponse.data = getDataExpYcnxk(params, rec); //Yêu cầu nhập/xuất kho
                        break;
                    case 'scv_xlsx_ycdc':
                        objResponse.data = getDataExpYcdc(params, rec);//Transfer Order
                        break;
                    case 'scv_xlsx_pnk':
                        objResponse.data = getDataExpPnk(params, rec, recType);//Item receipt
                        break;
                    case 'scv_xlsx_pxk':
                        objResponse.data = getDataExpPxk(params, rec, recType);//Item Fulfillment
                        break;
                    case 'scv_xlsx_phieu_ycsx':
                    case 'scv_xlsx_pgv_wo':
                        objResponse.data = getDataExpWO(params, rec);//Work Order
                        break;
                    case 'scv_xlsx_phieu_ycsx_other_wo':
                    case 'scv_xlsx_pgv_owo':
                        objResponse.data = getDataExpOWO(params, rec);//Other Work Order
                        break;
                    case 'scv_xlsx_phieu_chuyen_vi_tri':
                        objResponse.data = getDataExpPcvt(params, rec);//Bin transfer phiếu chuyển vị trí
                        break;
                    case 'scv_xlsx_tem_cuon_nhom':
                    case 'scv_xlsx_nhom_acp':
                    case 'scv_xlsx_nhom_tran':
                        objResponse.data = getDataExpTem(params, rec); //Tem cuộn, Acp, nhôm trần
                        break;
                    case 'scv_xlsx_ycbd':
                        objResponse.data = getDataYcbd(params, rec); // Phiếu kế hoạch bảo dưỡng
                }
                context.response.setHeader({
                    name: 'Content-Type',
                    value: 'application/json'
                });

                if(params.recType !== 'customrecord_scv_sd' && !params.recType.includes('customrecord_scv')){
                    comPhieuIn.createPhieuTheoDoi(params.recId, params.templateId);
                }
                //else {
                    //     comPhieuIn.createPhieuTheoDoi(params.recId, params.templateId);
                    // }
                //

                context.response.write(JSON.stringify(objResponse));
            } catch (error) {
                log.error('error try-cat', error)
                objResponse.isSuccess = false;
                objResponse.msg = `${error.toString()} - action ${params.templateId}`;
                context.response.write(JSON.stringify(objResponse));
            }
        }

        const getTemplateExportExcel = (templateId) => {
            let objFile = file.load({id: `../xls/${templateId}.xlsx`});
            return objFile.url;
        }

        const getEmployeeInfo = (arrEmpId, arrFields) => {
            let result = {};
            arrEmpId = [...new Set(arrEmpId)].filter(id => id);
            if(arrEmpId.length === 0) return result;

            if (!Array.isArray(arrFields)) arrFields = [arrFields];

            search.create({
                type: 'employee',
                filters: [['internalid', 'anyof', arrEmpId]],
                columns: arrFields
            }).run().each(e => {
                let obj = {};
                arrFields.forEach(field => {
                    let key = typeof field === 'string' ? field : field.name;
                    obj[key] = e.getValue(field);
                    let textVal = e.getText(field);
                    if(textVal) obj[key + '_text'] = textVal;
                });
                result[e.id] = obj;
                return true;
            });
            return result;
        }

        const getDataYcbd = (params, rec) => {
            let cmms_mp_date = rec.getValue('custrecord_scv_cmms_mp_date');
            let name = rec.getValue('name');
            let altName = rec.getValue('altname');
            let mp_creater = rec.getValue('custrecord_scv_cmms_mp_creater');
            let manager_accept = rec.getValue('custrecord_scv_cmms_mp_manager_accept');
            let final_accept = rec.getValue('custrecord_scv_cmms_mp_finalaccept');
            let form_code = rec.getValue('custrecord_nvd_ycbd_bm');
            let form_date = rec.getValue('custrecord_nvd_ycbd_ngay_bh');

            const EMP_FIELDS = ['custentity_scv_legal_name'];
            let empInfo = getEmployeeInfo([mp_creater, manager_accept, final_accept], EMP_FIELDS);

            let manageracceptdate = rec.getText('custrecord_scv_cmms_mp_manageracceptdate');
            let sublistId = 'recmachcustrecord_scv_cmms_mp_plan_l';
            let mp_date = getTranDate(cmms_mp_date) || "Ngày ..... tháng ...... năm ......";
            let lineCnt = rec.getLineCount({sublistId: sublistId});
            let co_code, eq_code, asset_l_text;
            let rsPlanL = [];
            // let status_l = rec.getText('custrecord_scv_cmms_mp_status')
            for (let i = 0; i < lineCnt; i++) {
                let asset_l = rec.getSublistText({
                    sublistId: sublistId,
                    fieldId: 'custrecord_scv_cmms_mp_asset_l',
                    line: i
                })?.split(' ')[0];
                asset_l_text = rec.getSublistText({
                    sublistId: sublistId,
                    fieldId: 'custrecord_scv_cmms_mp_asset_l',
                    line: i
                })?.replace(asset_l, '')?.trim();
                let component_l = rec.getSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord_scv_cmms_mp_component_l',
                    line: i
                });
                let component_l_text = rec.getSublistText({
                    sublistId: sublistId,
                    fieldId: 'custrecord_scv_cmms_mp_component_l',
                    line: i
                });
                if (component_l) {
                    let componentlkF = search.lookupFields({
                        type: 'customrecord_scv_cmms_component',
                        id: component_l,
                        columns: ['custrecord_scv_cmms_co_code']
                    })
                    co_code = componentlkF.custrecord_scv_cmms_co_code;
                }
                let equipment_l = rec.getSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord_scv_cmms_mp_equipment_l',
                    line: i
                });
                let equipment_l_text = rec.getSublistText({
                    sublistId: sublistId,
                    fieldId: 'custrecord_scv_cmms_mp_equipment_l',
                    line: i
                });
                if (equipment_l) {
                    let componentlkF = search.lookupFields({
                        type: 'customrecord_scv_cmms_equipment',
                        id: equipment_l,
                        columns: ['custrecord_scv_cmms_eq_code']
                    })
                    eq_code = componentlkF.custrecord_scv_cmms_eq_code;
                }
                let type_l = String(rec.getSublistText({
                    sublistId: sublistId,
                    fieldId: 'custrecord_scv_cmms_mp_workitem_l_display',
                    line: i
                })).split(':')[0];
                let description_l = rec.getSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord_scv_cmms_mp_description_l',
                    line: i
                });
                let status_l = rec.getSublistText({
                    sublistId: sublistId,
                    fieldId: 'custrecord_scv_cmms_mp_actual_workitem_l',
                    line: i
                })  || rec.getSublistText({
                    sublistId: sublistId,
                    fieldId: 'custrecord_scv_cmms_mp_workitem_l',
                    line: i
                });

                let memo = rec.getSublistValue({
                    sublistId: sublistId,
                    fieldId : 'custrecord_scv_cmms_mp_memo_l',
                    line: i
                });

                let slPlanL = {
                    asset_l_text: asset_l_text,
                    asset_l: asset_l,
                    component_l_text: component_l_text,
                    co_code: co_code,
                    equipment_l_text: equipment_l_text,
                    eq_code: eq_code,
                    type_l: type_l,
                    description_l: description_l,
                    status_l: status_l,
                    memo: memo,
                };
                rsPlanL.push(slPlanL);
            }

             return {
                id: rec.id,
                cmms_mp_date: mp_date,
                rsPlanL: rsPlanL,
                asset_l_text: asset_l_text,
                mp_creater : empInfo[mp_creater]?.custentity_scv_legal_name || '',
                manager_accept : empInfo[manager_accept]?.custentity_scv_legal_name || '',
                 final_accept : empInfo[final_accept]?.custentity_scv_legal_name || '',
                manageracceptdate : manageracceptdate,
                name: name,
                altName: altName,
                form_code: form_code, form_date: form_date,
                imagebase64: file.load({id: 1}).getContents(),
                }
        }

        function getDataExpSc(params) {
            let recSO = record.load({type: params.recType, id: params.recId});
            let sl = 'item', sc_name, sc_date;
            let xk_hd = recSO.getValue('custbody_scv_xk_hd');
            let trandate = recSO.getText('custbody_scv_so_xnk_date');
            let sales_contract = recSO.getValue('custbody_scv_sales_contract');
            let subsidiary = recSO.getValue('subsidiary');
            let nguoi_dai_dien = recSO.getValue('custbody_scv_nguoi_dai_dien');
            let nguoi_dai_dien_en = recSO.getValue('custbody_scv_nguoi_dai_dien_en');
            let chuc_vu = recSO.getValue('custbody_scv_chuc_vu');
            let chuc_vu_en = recSO.getValue('custbody_scv_chuc_vu_en');
            let entity = recSO.getValue('entity');
            let so_name_of_goods = recSO.getValue('custbody_scv_so_name_of_goods');
            let dkhh_dkg = recSO.getValue('custbody_scv_so_dkhh_dkg');

            //Thành dev sửa field 11/03/2025 - 29/04/2025
            let dkhh_dssl = recSO.getValue('custbody_scv_so_dkhh_dssl');
            let dkhh_dssl_en = recSO.getValue('custbody_scv_so_dkhh_dssl_en');
            let arrExcelDieuKhoanVn = getArrExcelDieuKhoanSo(recSO, true);
            let arrExcelDieuKhoanEn = getArrExcelDieuKhoanSo(recSO, false);
            // thành dev sua
            let dkhh_dg = recSO.getValue('custbody_scv_so_dkhh_dg');
            // add hoặc không tiêu chuẩn chất lượng

            let dkhh_tccl = recSO.getValue('custbody_scv_so_dkhh_tccl');
            dkhh_tccl = dkhh_tccl ? { richText : [
                { text: 'Tiêu chuẩn chất lượng: ',
                    font: {
                    bold: true,
                        color: { argb: 'FF000000' }, // Black
                        name: 'Times New Roman',
                        size : 12
                    },

                },
                { text: `${dkhh_tccl}`, font: { color: { argb: 'FF000000' } ,  name: 'Times New Roman' , size : 12}  }
            ]} : '';

            let cangDongHang = recSO.getValue('custbody_scv_so_port_of_loading');
            let cangDoHang = recSO.getText('custbody_scv_so_port_of_discharge');
            let shipdate = recSO.getText('shipdate');
            let dkgh_ghtp = recSO.getValue('custbody_scv_so_dkgh_ghtp');
            let dkgh_ptgh = recSO.getValue('custbody_scv_so_dkgh_ptgh');
            let dktt_pttt = recSO.getValue('custbody_scv_so_dktt_pttt');
            let currency = recSO.getText('currency');
            let dktt_tktt = recSO.getValue('custbody_scv_so_dktt_tktt');
            let dktt_tktt_en = recSO.getValue('custbody_scv_so_dktt_tktt_en');
            let dktt_trach_nhiem = recSO.getValue('custbody_scv_so_dktt_trach_nhiem');
            let dkcd_vn = recSO.getValue('custbody_scv_so_dkcd_vn');
            dkcd_vn = dkcd_vn.replace(/<p>|<\/p>|<strong>|<\/strong>|<br \/>/g, '');
            // dkcd_vn = dkcd_vn.replace(/(?!^)ĐIỀU \d+/g, '\n\n$&');
            dkcd_vn = dkcd_vn.trimEnd() + '\n';
            let dkcd_en = recSO.getValue('custbody_scv_so_dkcd_en');
            dkcd_en = dkcd_en.replace(/<p>|<\/p>|<strong>|<\/strong>|<br \/>/g, '');
            // dkcd_en = dkcd_en.replace(/(?!^)ARTICLE \d+/g, '\n\n$&');
            dkcd_en = dkcd_en.trimEnd() + '\n';
            let port_of_loading = recSO.getValue('custbody_scv_so_port_of_loading')
            let port_of_discharge = recSO.getValue('custbody_scv_so_port_of_discharge')
            let so_name_of_goods_en = recSO.getValue('custbody_scv_so_name_of_goods_en');
            let dkhh_dg_en = recSO.getValue('custbody_scv_so_dkhh_dg_en');
            let dkgh_ghtp_en = recSO.getValue('custbody_scv_so_dkgh_ghtp_en');
            let dkgh_ptgh_en = recSO.getValue('custbody_scv_so_dkgh_ptgh_en');
            let dktt_pttt_en = recSO.getValue('custbody_scv_so_dktt_pttt_en');
            let dktt_trach_nhiem_en = recSO.getValue('custbody_scv_so_dktt_trach_nhiem_en');
            let port_of_loading_en = recSO.getValue('custbody_scv_so_port_of_loading_en')
            let port_of_discharge_en = recSO.getValue('custbody_scv_so_port_of_discharge_en')
            let entityField = getFieldEnt(entity);
            let sub = getFieldSub(subsidiary);
            if (sales_contract) {
                let lkFSc = search.lookupFields({
                    type: 'customrecord_scv_sales_contract',
                    id: sales_contract,
                    columns: ['custrecord_scv_sc_date', 'name']
                })
                sc_name = lkFSc.name;
                sc_date = lkFSc.custrecord_scv_sc_date;
            }
            let arrSL = [];
            let stt = 1, total_thanhtien = 0, total_quantity = 0;
            for (let i = 0; i < recSO.getLineCount(sl); i++) {
                let obj = {};
                obj.stt = stt++;
                obj.description = recSO.getSublistValue(sl, 'description', i);
                obj.units = recSO.getSublistText(sl, 'units', i);
                obj.item_display = recSO.getSublistValue(sl, 'item_display', i);
                obj.item_eng_name = recSO.getSublistValue(sl, 'custcol_scv_item_eng_name', i);
                let so_ddt = recSO.getSublistText(sl, 'custcol_scv_so_ddt', i);
                if (so_ddt) {
                    obj.so_ddt = so_ddt.split(':')[1].trim();
                }
                let so_dd_nt = recSO.getSublistText(sl, 'custcol_scv_so_dd_nt', i);
                if (so_dd_nt) {
                    obj.so_dd_nt = so_dd_nt.split(':')[1].trim();
                }
                obj.so_kho_rong = recSO.getSublistValue(sl, 'custcol_scv_so_kho_rong', i);
                obj.so_chieu_dai = recSO.getSublistValue(sl, 'custcol_scv_so_chieu_dai', i);
                obj.item_unit_en = recSO.getSublistValue(sl, 'custcol_scv_item_unit_en', i);
                obj.so_don_gia_m2 = recSO.getSublistValue(sl, 'custcol_scv_so_don_gia_m2', i);
                obj.rate = recSO.getSublistValue(sl, 'rate', i);
                obj.memo_2 = recSO.getSublistValue(sl, 'custcol_scv_memo_2', i);
                // let quantity = recSO.getSublistValue(sl, 'quantity', i) || 0;
                let quantity = recSO.getSublistValue(sl, 'custcol_scv_qty_before_tolerance', i) || 0;
                let grossamt = recSO.getSublistValue(sl, 'grossamt', i) || 0;
                // let dongia = quantity !== 0 ? grossamt / quantity : 0;
                let dongia = quantity !== 0 ?  recSO.getSublistValue(sl, 'rate', i) : 0;
                let thanhtien = dongia * quantity;
                obj.quantity = changeCurrency(quantity);
                obj.dongia = changeCurrency(dongia);
                obj.thanhtien = changeCurrency(thanhtien);
                arrSL.push(obj);
                total_quantity += quantity;
                total_thanhtien += thanhtien;
            }
            let tongThanhTien_bangChu = libAmt.DocTienBangChu(total_thanhtien, currency);
            let amountinword = libAmt.toAmountInWorld(total_thanhtien, currency);
            log.error('arrSl', arrSL)
            return {
                arrSL: arrSL,
                entityField: entityField,
                sc_name: sc_name,
                xk_hd: xk_hd,
                trandate: trandate,
                sc_date: sc_date,
                sub: sub,
                nguoi_dai_dien: nguoi_dai_dien,
                nguoi_dai_dien_en: nguoi_dai_dien_en,
                chuc_vu: chuc_vu,
                chuc_vu_en: chuc_vu_en,
                entity: entity,
                so_name_of_goods: so_name_of_goods,
                dkhh_dkg: dkhh_dkg,
                dkhh_dssl: dkhh_dssl,
                dkhh_dssl_en: dkhh_dssl_en,
                dkhh_dg: dkhh_dg,
                dkhh_tccl: dkhh_tccl,
                shipdate: shipdate,
                dkgh_ghtp: dkgh_ghtp,
                dkgh_ptgh: dkgh_ptgh,
                dktt_pttt: dktt_pttt,
                cangDoHang: cangDoHang,
                cangDongHang: cangDongHang,
                dktt_tktt_en: dktt_tktt_en,
                currency: currency,
                dktt_tktt: dktt_tktt,
                dktt_trach_nhiem: dktt_trach_nhiem,
                dkcd_vn: dkcd_vn,
                dkcd_en: dkcd_en,
                port_of_loading: port_of_loading,
                port_of_discharge: port_of_discharge,
                so_name_of_goods_en:so_name_of_goods_en,
                dkhh_dg_en: dkhh_dg_en,
                dkgh_ghtp_en: dkgh_ghtp_en,
                dkgh_ptgh_en: dkgh_ptgh_en,
                dktt_pttt_en: dktt_pttt_en,
                dktt_trach_nhiem_en: dktt_trach_nhiem_en,
                port_of_loading_en: port_of_loading_en,
                port_of_discharge_en: port_of_discharge_en,

                total_quantity: changeCurrency(total_quantity),
                total_thanhtien: changeCurrency(total_thanhtien),
                tongThanhTien_bangChu: tongThanhTien_bangChu,
                amountinword: amountinword,

                arrExcelDieuKhoanVn : arrExcelDieuKhoanVn,
                arrExcelDieuKhoanEn : arrExcelDieuKhoanEn,
            };
        }

        const getArrExcelDieuKhoanSo = (recSo, isVn) => {
            let rawArrDieuKhoan = [];
            let arrResultExcelDieuKhoan = [];
            if(isVn) {
                for (let i = 4; i <= 10; i++) {
                    let line = recSo.getValue(`custbody_scv_so_hdxk_dieu${i}`);
                    if (line) {
                        rawArrDieuKhoan.push(line);
                    }
                }
                // match "ĐIỀU ..." và in đậm dòng này, xuống dòng với các dòng khác
                rawArrDieuKhoan.forEach((rowData) => {
                    const lines = rowData.split('\n');
                    let formattedText = [];
                    lines.forEach(line => {
                        if (line.match(/ĐIỀU\s\d+/i)) {
                            formattedText.push({
                                text: line + '\n',
                                font: {name: 'Times New Roman', bold: true, size: 12}
                            });
                        } else {
                            formattedText.push({
                                text: line + '\n',
                                font: {name: 'Times New Roman', bold: false, size: 12}
                            });
                        }
                    });
                    arrResultExcelDieuKhoan.push(formattedText);
                });

            } else if (!isVn){
                for (let i = 4; i <= 10; i++) {
                    let line = recSo.getValue(`custbody_scv_so_hdxk_dieu${i}_en`);
                    if (line) {
                        rawArrDieuKhoan.push(line);
                    }
                }
                // match "ĐIỀU ..." và in đậm dòng này, xuống dòng với các dòng khác
                rawArrDieuKhoan.forEach((rowData) => {
                    const lines = rowData.split('\n');
                    let formattedText = [];
                    lines.forEach(line => {
                        if (line.match(/ARTICLE\s\d+/i)) {
                            formattedText.push({
                                text: line + '\n',
                                font: {name: 'Times New Roman', bold: true, size: 12}
                            });
                        } else {
                            formattedText.push({
                                text: line + '\n',
                                font: {name: 'Times New Roman', bold: false, size: 12}
                            });
                        }
                    });
                    arrResultExcelDieuKhoan.push(formattedText);
                });
            }
            return arrResultExcelDieuKhoan;
        }

        const getDataExpSd = (params) => {
            let recSD = record.load({type: params.recType, id: params.recId});
            let sd_cus = recSD.getValue('custrecord_scv_sd_cus');
            let sd_contract_name = recSD.getValue('custrecord_scv_sd_contract_no');
            let sd_contract_date = recSD.getText('custrecord_scv_sd_contract_date');
            let sd_itf = recSD.getValue('custrecord_scv_sd_itf');
            let sd_so = recSD.getValue('custrecord_scv_sd_so');
            let sd_sub = recSD.getValue('custrecord_scv_sd_sub');
            let data = getDataHeader(recSD);
            let sd_requestor = recSD.getValue('custrecord_scv_sd_requestor');
            let cus_legal_name, cus_defaultaddress, cus_phone,
                cus_tax_number, requestor_name;
            // if (sd_contract_no) {
            //     let lkFSc = search.lookupFields({
            //         type: 'customrecord_scv_sales_contract',
            //         id: sd_contract_no,
            //         columns: ['custrecord_scv_sc_date', 'name']
            //     });
            //     sd_contract_date = lkFSc.custrecord_scv_sc_date;
            //     sd_contract_name = lkFSc.name;
            // }
            if (sd_cus) {
                let recCus = record.load({
                    type: lbf.getEntityType(sd_cus),
                    id: sd_cus,
                });
                cus_legal_name = recCus.getValue('custentity_scv_legal_name');
                cus_defaultaddress = recCus.getValue('defaultaddress');
                cus_phone = recCus.getValue('phone');
                cus_tax_number = recCus.getValue('custentity_scv_tax_number');
            }
            if (sd_requestor) {
                let lkFSc = search.lookupFields({
                    type: 'employee',
                    id: sd_requestor,
                    columns: ['entityid']
                });
                requestor_name = lkFSc.entityid;
            }
            let sub = getFieldSub(sd_sub)
            let sdSO = getFieldSO(sd_so);
            let arrSO = sdSO.arrSO;
            let slITF = 'item', arrITR = [];
            let totalquantity = 0, totalamount = 0, totalweight = 0,
                totalweightGW = 0, weight = 0, weightGW , totalOfSumNW = 0, totalOfSumGW = 0;
            if (sd_itf) {
                let recITF = record.load({
                    type: 'itemfulfillment',
                    id: sd_itf,
                });
                let stt = 1;
                for (let i = 0; i < recITF.getLineCount(slITF); i++) {
                    let line = {};
                    line.stt = stt++;
                    line.item = recITF.getSublistValue(slITF, 'item', i);
                    if (line.item) {
                        let lkFItem = search.lookupFields({
                            type: lbf.getItemRecordType(line.item),
                            id: line.item,
                            // columns: ['custitem_scv_weight']
                            columns: ['custitem_scv_kl_vtc']
                        })
                        // weight = lkFItem.custitem_scv_weight || 0;
                        weight = lkFItem.custitem_scv_kl_vtc || 0;
                        weightGW = (weight * 101) / 100;
                    }
                    line.ori_lineid = recITF.getSublistValue(slITF, 'custcol_scv_ori_lineid', i);
                    line.description = recITF.getSublistValue(slITF, 'description', i);
                    line.text1 = '';
                    line.text2 = '';
                    line.text3 = '';
                    line.unit = recITF.getSublistValue(slITF, 'unitsdisplay', i);
                    let quantity = recITF.getSublistValue(slITF, 'quantity', i);
                    line.memo_2 = recITF.getSublistValue(slITF, 'custcol_scv_memo_2', i);
                    let soItem = arrSO.find(so => so.ori_lineid === line.ori_lineid);
                    line.grossamt = soItem ? soItem.grossamt : null;
                    let unit_price = quantity !== 0 ? line.grossamt / quantity : 0;
                    let amount = unit_price * quantity;
                    line.so_ddt = soItem ? soItem.so_ddt : '';
                    line.so_dd_nt = soItem ? soItem.so_dd_nt : '';
                    line.so_kho_rong = soItem ? soItem.so_kho_rong : '';
                    line.so_chieu_dai = soItem ? soItem.so_chieu_dai : '';
                    line.item_eng_name = soItem ? soItem.item_eng_name : '';
                    line.item_unit_en = soItem ? soItem.item_unit_en : '';
                    line.unit_price = changeCurrency(unit_price);
                    line.amount = changeCurrency(amount);
                    line.quantity = changeCurrency(quantity);
                    line.weight = changeCurrency(weight);
                    line.weightGW = changeCurrency(weightGW);
                    line.sumNW = quantity * weight;
                    line.sumGW = quantity * weightGW;
                    totalOfSumNW += Number(line.sumNW);
                    totalOfSumGW += Number(line.sumGW);
                    line.sumNW = changeCurrency(quantity * weight);
                    line.sumGW = changeCurrency(quantity * weightGW);

                    arrITR.push(line);
                    totalweight += Number(weight);
                    totalweightGW += Number(line.weightGW);
                    totalquantity += quantity;
                    totalamount += amount;

                }
            }

            // let gt_hoadon = data.sd_package_no * totalweight;
            let total_sthd = (totalamount * 110) / 100;
            return {
                cus_legal_name: cus_legal_name,
                cus_defaultaddress: cus_defaultaddress.replace('(Province of China)', ''),
                cus_phone: cus_phone,
                cus_tax_number: cus_tax_number,
                requestor_name: requestor_name,
                sd_contract_name: sd_contract_name,
                sd_contract_date: sd_contract_date,
                sub: sub,
                sdSO: sdSO,
                arrITR: arrITR,
                total_quantity: changeCurrency(totalquantity),
                total_amount: changeCurrency(totalamount),
                total_weight: changeCurrency(totalweight),
                total_weightGW: changeCurrency(totalweightGW),
                totalOfSumNW: changeCurrency(totalOfSumNW),
                totalOfSumGW: changeCurrency(totalOfSumGW),
                total_sthd: changeCurrency(total_sthd),
                data: data,
            };
        }

        const getDataExpYcnxk = (params, rec) => {
            let trandate = rec.getValue('trandate');
            let date = getTranDate(trandate)
            let subsidiary = rec.getValue('subsidiary');
            let location = rec.getValue('location');
            let related_transaction = rec.getValue('custbody_scv_related_transaction');
            let tranid = rec.getValue('tranid');
            let employee_ycxvt = rec.getText('custbody_scv_employee_ycxvt');
            let memo = rec.getValue('memo');
            let department = rec.getText('department');
            let ycxvt_type = rec.getText('custbody_scv_ycxvt_type');
            let legalname, mainaddress_text, loc_name, total_nhapxuat = 0, total_yeucau = 0;
            if (subsidiary) {
                let lkFSc = search.lookupFields({
                    type: 'subsidiary',
                    id: subsidiary,
                    columns: ['legalname']
                });
                legalname = lkFSc.legalname;
            }
            if (location) {
                let recLoc = record.load({
                    type: 'location',
                    id: location,
                });
                mainaddress_text = recLoc.getValue('mainaddress_text');
                loc_name = recLoc.getValue('name');
            }
            let slInvDetail = "inventoryassignment";
            let arrIA = [];
            if (Array.isArray(related_transaction) && related_transaction.length > 0) {
                related_transaction.forEach((transactionId) => {
                    let recTrans = record.load({
                        type: 'inventoryadjustment',
                        id: transactionId,
                    });
                    let suiteletIA = 'inventory';
                    for (let k = 0; k < recTrans.getLineCount(suiteletIA); k++) {
                        let obj = {};
                        obj.adjustqtyby = recTrans.getSublistValue(suiteletIA, 'adjustqtyby', k);
                        obj.itemIA = recTrans.getSublistValue(suiteletIA, 'item', k);
                        let inventorydetailavail = recTrans.getSublistValue(suiteletIA, 'inventorydetailavail', k);
                        if (inventorydetailavail === true || inventorydetailavail === 'T') {
                            let InvDetailSubIA = recTrans.getSublistSubrecord(suiteletIA, 'inventorydetail', k);
                            let lcInvDetail = InvDetailSubIA.getLineCount(slInvDetail);
                            for (let j = 0; j < lcInvDetail; j++) {
                                obj.quanIA_InvDetail = InvDetailSubIA.getSublistValue(slInvDetail, 'quantity', j) || '';
                            }
                        }
                        arrIA.push(obj);
                    }
                })
            }

            let suiteletId = 'item', arrItem = [];
            let stt = 1;
            for (let i = 0; i < rec.getLineCount(suiteletId); i++) {
                let line = {};
                line.stt = stt++;
                line.itemText = rec.getSublistText(suiteletId, 'item', i);
                line.item = rec.getSublistValue(suiteletId, 'item', i);
                line.ori_lineid = rec.getSublistValue(suiteletId, 'custcol_scv_ori_lineid', i);
                line.description = rec.getSublistValue(suiteletId, 'description', i);
                line.unit = rec.getSublistText(suiteletId, 'units', i);
                line.item_code = rec.getSublistValue(suiteletId, 'custcol_scv_tc_item_code', i);
                let quan_xuat = rec.getSublistValue(suiteletId, 'quantity', i);
                let quan_nhap = rec.getSublistValue(suiteletId, 'custcol_scv_plan_qty', i);
                // line.quantity = changeCurrency(quantity);
                line.memo = rec.getSublistValue(suiteletId, 'custcol_scv_memo', i);
                line.status = rec.getSublistText(suiteletId, 'custcol_scv_item_status', i);
                let inventorydetailavail = rec.getSublistValue(suiteletId, 'inventorydetailreq', i);
                if (inventorydetailavail === true || inventorydetailavail === 'T') {
                    let InvDetailSub = rec.getSublistSubrecord(suiteletId, 'inventorydetail', i);
                  let lcInvDetail = InvDetailSub.getLineCount(slInvDetail);
                    for (let k = 0; k < lcInvDetail; k++) {
                        line.inventorynumber = InvDetailSub.getSublistText(slInvDetail, 'issueinventorynumber', k) || '';
                        // line.inventorynumber = unReTextXML(inventorynumber)
                        line.color_seri = InvDetailSub.getSublistValue(slInvDetail, 'custitemnumber_scv_item_num_color_seri', k) || '';
                        let quan_InvDetail = InvDetailSub.getSublistValue(slInvDetail, 'quantity', k) || '';
                        line.quan_InvDetail = (quan_InvDetail);

                    }
                }
                let quanIA = 0, quantity = 0;
                if (quan_xuat) {
                    quantity = (line.quan_InvDetail);
                    line.quantity = changeCurrency1(quantity);
                } else {
                    line.quantity = (quan_nhap);
                }
                let matchedIA = arrIA.find((ia) => ia.itemIA === line.item);
                if (matchedIA) {
                    quanIA = (matchedIA.adjustqtyby) || (matchedIA.quanIA_InvDetail);
                    line.quanIA = changeCurrency1(quanIA) || 0;
                } else {
                    line.quanIA = 0;
                }
                arrItem.push(line);
                total_nhapxuat += quanIA;
                total_yeucau += line.quantity;
            }
            return {
                arrItem: arrItem,
                legalname: legalname,
                mainaddress_text: mainaddress_text,
                loc_name: loc_name,
                date: date,
                tranid: tranid,
                memo: memo,
                department: department,
                ycxvt_type: ycxvt_type,
                employee_ycxvt: employee_ycxvt,
                total_yeucau: changeCurrency1(total_yeucau),
                total_nhapxuat: changeCurrency1(total_nhapxuat),
            };

        }

        function getDataExpYcdc(params, rec) {
            let trandate = rec.getValue('trandate');
            let date = getTranDate(trandate)
            let subsidiary = rec.getValue('subsidiary');
            let location = rec.getValue('location');
            let tranid = rec.getValue('tranid');
            // let transferlocation = rec.getText('transferlocation');
            let transferloc = rec.getValue('transferlocation');
            let memo = rec.getValue('memo');
            let created_transaction = rec.getValue('custbody_scv_created_transaction');
            let department = rec.getText('department');
            let legalname, mainaddress_text, loc_name, transloc_name = '', total_xuatnhap = 0, total_yeucau = 0;
            if (subsidiary) {
                let lkFSc = search.lookupFields({
                    type: 'subsidiary',
                    id: subsidiary,
                    columns: ['legalname']
                });
                legalname = lkFSc.legalname;
            }
            if (location) {
                let recLoc = record.load({
                    type: 'location',
                    id: location,
                });
                mainaddress_text = recLoc.getValue('mainaddress_text');
                loc_name = recLoc.getValue('name');
            }
            if (transferloc) {
                let lkFLoc = search.lookupFields({
                    type: 'location',
                    id: transferloc,
                    columns: ['name']
                });
                transloc_name = lkFLoc.name;
            }
            let slInvDetail = "inventoryassignment";
            let arrITF = [];
            if (created_transaction) {
                let recITF = record.load({
                    type: 'itemfulfillment',
                    id: created_transaction,
                });
                let suiteletITF = 'inventory';
                for (let k = 0; k < recITF.getLineCount(suiteletITF); k++) {
                    let obj = {};
                    obj.quantityITF = recITF.getSublistValue(suiteletITF, 'quantity', k);
                    obj.itemITF = recITF.getSublistValue(suiteletITF, 'item', k);
                    let inventorydetailavail = recITF.getSublistValue(suiteletITF, 'inventorydetailavail', k);
                    if (inventorydetailavail === true || inventorydetailavail === 'T') {
                        let InvDetailSubITF = recITF.getSublistSubrecord(suiteletITF, 'inventorydetail', k);
                        let lcInvDetail = InvDetailSubITF.getLineCount(slInvDetail);
                        for (let j = 0; j < lcInvDetail; j++) {
                            obj.quanITF_InvDetail = InvDetailSubITF.getSublistValue(slInvDetail, 'quantity', j) || '';
                        }
                    }
                    arrITF.push(obj);
                }
            }

            let suiteletId = 'item', arrTO = [];
            let stt = 1;
            for (let i = 0; i < rec.getLineCount(suiteletId); i++) {
                let line = {};
                line.stt = stt++;
                line.itemText = rec.getSublistText(suiteletId, 'item', i);
                line.item = rec.getSublistValue(suiteletId, 'item', i);
                let quantity = rec.getSublistValue(suiteletId, 'quantity', i);
                line.quantity = changeCurrency1(quantity);
                line.description = rec.getSublistValue(suiteletId, 'description', i);
                line.unit = rec.getSublistText(suiteletId, 'units', i);
                line.item_code = rec.getSublistValue(suiteletId, 'custcol_scv_tc_item_code', i);

                line.memo = rec.getSublistValue(suiteletId, 'custcol_scv_memo', i);
                line.status = rec.getSublistText(suiteletId, 'custcol_scv_item_status', i);
                let inventorydetailavail = rec.getSublistValue(suiteletId, 'inventorydetailavail', i);
                if (inventorydetailavail === true || inventorydetailavail === 'T') {
                    let InvDetailSub = rec.getSublistSubrecord(suiteletId, 'inventorydetail', i);
                    let lcInvDetail = InvDetailSub.getLineCount(slInvDetail);

                  let inventoryNumbers = '', colorSeris = '', statuss = '';
                    for (let j = 0; j < lcInvDetail; j++) {
                        let inventorynumber = InvDetailSub.getSublistText(slInvDetail, 'issueinventorynumber', j) || '';
                        let color_seri = InvDetailSub.getSublistValue(slInvDetail, 'custitemnumber_scv_item_num_color_seri', j) || '';
                        let status = InvDetailSub.getSublistValue(slInvDetail, 'inventorystatus_display', j) || '';
                       if (inventorynumber) {
                        inventoryNumbers += (inventoryNumbers ? ', ' : '') + inventorynumber;
                    }
                    if (color_seri) {
                        colorSeris += (colorSeris ? ', ' : '') + color_seri;
                    }
                       if (status) {
                        statuss += (statuss ? ', ' : '') + status;
                    }
                       line.status = statuss;
                       line.color_seri = colorSeris;
                       line.inventorynumber = inventoryNumbers;
                    }
                }

                let matchedITF = arrITF.find((itf) => itf.itemITF === line.item);
                let quanITF = 0;
                if (matchedITF) {
                    quanITF = (matchedITF.quantityITF) || changeCurrency1(matchedITF.quanITF_InvDetail);
                    line.quanITF = changeCurrency1(quanITF) || 0;
                } else {
                    line.quanITF = 0;
                }
                arrTO.push(line);
                total_xuatnhap += quanITF;
                total_yeucau += quantity;
            }

            return {
                arrTO: arrTO,
                legalname: legalname,
                mainaddress_text: mainaddress_text,
                loc_name: loc_name,
                date: date,
                tranid: tranid,
                memo: memo,
                department: department,
                transloc_name: transloc_name,
                total_yeucau: changeCurrency1(total_yeucau),
                total_xuatnhap: changeCurrency1(total_xuatnhap),
            };
        }

        function getDataExpPnk(params, rec, recType) {
            let trandate = rec.getValue('trandate');
            let date = getTranDate(trandate)
            let subsidiary = rec.getValue('subsidiary');
            let location = rec.getValue('location');
            let tranid = rec.getValue('tranid');
            let memo = rec.getValue('memo');
            let shipper = rec.getValue('custbody_scv_shipper');
            let department = rec.getText('department');
            let legalname, mainaddress_text, loc_name, total_quantity = 0, loc;
            if (subsidiary) {
                let lkFSc = search.lookupFields({
                    type: 'subsidiary',
                    id: subsidiary,
                    columns: ['legalname']
                });
                legalname = lkFSc.legalname;
            }
            if (location) {
                let recLoc = record.load({
                    type: 'location',
                    id: location,
                });
                mainaddress_text = recLoc.getValue('mainaddress_text');
                loc_name = recLoc.getValue('name');
            }
            let sublistId = 'item', slInvDetail = "inventoryassignment", arrLine = [];
            let stt = 1;
            if (recType === 'inventoryadjustment') {
                loc = rec.getValue('adjlocation');
                sublistId = 'inventory';
                for (let i = 0; i < rec.getLineCount(sublistId); i++) {
                    let line = {};
                    line.stt = stt++;
                    line.itemname = rec.getSublistText(sublistId, 'item_display', i);
                    line.item = rec.getSublistValue(sublistId, 'item', i);
                    let quantity = rec.getSublistValue(sublistId, 'adjustqtyby', i);
                    line.quantity = changeCurrency1(quantity);
                    line.description = rec.getSublistValue(sublistId, 'description', i);
                    line.unit = rec.getSublistText(sublistId, 'units', i);
                    line.item_code = rec.getSublistValue(sublistId, 'custcol_scv_itemcode', i);
                    line.memo = rec.getSublistValue(sublistId, 'memo', i);
                    let inventorydetailavail = rec.getSublistValue(sublistId, 'inventorydetailavail', i);
                    let invDetail = getInventoryDetails(slInvDetail, inventorydetailavail, sublistId, rec, i)
                    line.inventorynumbers = invDetail.inventoryNumbers;
                    line.color_seris = invDetail.colorSeris;
                    line.status = invDetail.statuss;
                    arrLine.push(line);
                    total_quantity += quantity;
                }
            } else if (recType === 'itemreceipt') {
                sublistId = 'item';
                for (let i = 0; i < rec.getLineCount(sublistId); i++) {
                    let line = {};
                    line.stt = stt++;
                    line.itemname = rec.getSublistText(sublistId, 'itemname', i);
                    line.item = rec.getSublistValue(sublistId, 'item', i);
                    let quantity = rec.getSublistValue(sublistId, 'quantity', i);
                    line.quantity = changeCurrency1(quantity);
                    line.description = rec.getSublistValue(sublistId, 'description', i);
                    location = rec.getSublistValue(sublistId, 'location', i);
                    line.unit = rec.getSublistValue(sublistId, 'unitsdisplay', i);
                    line.item_code = rec.getSublistValue(sublistId, 'custcol_scv_tc_item_code', i);
                    line.memo = rec.getSublistValue(sublistId, 'memo', i);
                    line.text2 = '';
                    let inventorydetailavail = rec.getSublistValue(sublistId, 'inventorydetailavail', i);
                    let invDetail = getInventoryDetails(slInvDetail, inventorydetailavail, sublistId, rec, i)
                    line.inventorynumbers = invDetail.inventoryNumbers;
                    line.color_seris = invDetail.colorSeris;
                    line.status = invDetail.statuss;
                    arrLine.push(line);
                    total_quantity += quantity;
                }
                if (location){
                    let lkFLoc = search.lookupFields({
                        type: "location",
                        id: location,
                        columns: ['name']
                    })
                    loc = lkFLoc.name;
                }
            }
            return {
                arrLine: arrLine,
                legalname: legalname,
                mainaddress_text: mainaddress_text,
                loc_name: loc_name,
                date: date,
                tranid: tranid,
                memo: memo,
                department: department,
                shipper: shipper,
                loc: loc,
                total_quantity: changeCurrency1(total_quantity),
            };
        }

        function getInventoryDetails(slInvDetail, inventorydetailavail, sublistId, rec, i) {
            let inventoryNumbers = '';
            let colorSeris = '', statuss = '';
            if (inventorydetailavail === true || inventorydetailavail === 'T') {
                let InvDetailSub = rec.getSublistSubrecord(sublistId, 'inventorydetail', i);
                let lcInvDetail = InvDetailSub.getLineCount(slInvDetail);
                for (let j = 0; j < lcInvDetail; j++) {
                    let inventorynumber = InvDetailSub.getSublistValue(slInvDetail, 'receiptinventorynumber', j) || InvDetailSub.getSublistText(slInvDetail, 'issueinventorynumber', j) || '';
                    let color_seri = InvDetailSub.getSublistValue(slInvDetail, 'custitemnumber_scv_item_num_color_seri', j) || '';
                    let status = InvDetailSub.getSublistText(slInvDetail, 'inventorystatus', j) || '';
                    if (inventorynumber) {
                        inventoryNumbers += (inventoryNumbers ? ', ' : '') + inventorynumber;
                    }
                    if (color_seri) {
                        colorSeris += (colorSeris ? ', ' : '') + color_seri;
                    }
                     if (status) {
                        statuss += (statuss ? ', ' : '') + status;
                    }
                }
            }

            return {inventoryNumbers, colorSeris, statuss};
        }

        function getDataExpPxk(params, rec, recType) {
            let trandate = rec.getValue('trandate');
            let date = getTranDate(trandate)
            let subsidiary = rec.getValue('subsidiary');
            let tranid = rec.getValue('tranid');
            let receiver = rec.getValue('custbody_scv_receiver');
            let memo = rec.getValue('memo');
            // let created_transaction = rec.getValue('custbody_scv_created_transaction');
            let department = rec.getText('department');
            let legalname, mainaddress_text, loc_name, total_quantity = 0;
            if (subsidiary) {
                let lkFSc = search.lookupFields({
                    type: 'subsidiary',
                    id: subsidiary,
                    columns: ['legalname']
                });
                legalname = lkFSc.legalname;
            }
            let sublistId = 'item', slInvDetail = "inventoryassignment", arrLine = [], loc;
            let stt = 1;
            if (recType === 'inventoryadjustment') {
                loc = rec.getValue('adjlocation');
                sublistId = 'inventory';
                for (let i = 0; i < rec.getLineCount(sublistId); i++) {
                    let line = {};
                    line.stt = stt++;
                    line.itemname = rec.getSublistText(sublistId, 'item_display', i);
                    line.item = rec.getSublistValue(sublistId, 'item', i);
                    let quantity = rec.getSublistValue(sublistId, 'adjustqtyby', i);
                    line.quantity = changeCurrency1(quantity);
                    line.description = rec.getSublistValue(sublistId, 'description', i);
                    line.unit = rec.getSublistValue(sublistId, 'unitsdisplay', i);
                    line.memo = rec.getSublistValue(sublistId, 'memo', i);
                    line.item_code = rec.getSublistValue(sublistId, 'custcol_scv_itemcode', i);
                    let inventorydetailavail = rec.getSublistValue(sublistId, 'inventorydetailavail', i);
                    let invDetail = getInventoryDetails(slInvDetail, inventorydetailavail, sublistId, rec, i)
                    line.inventorynumbers = invDetail.inventoryNumbers;
                    line.color_seris = invDetail.colorSeris;
                    line.status = invDetail.statuss;
                    arrLine.push(line);
                    total_quantity += quantity;
                }
            } else if (recType === 'itemfulfillment') {
                for (let i = 0; i < rec.getLineCount(sublistId); i++) {
                    let line = {};
                    line.stt = stt++;
                    line.itemname = rec.getSublistText(sublistId, 'itemname', i);
                    line.item = rec.getSublistValue(sublistId, 'item', i);
                    let quantity = rec.getSublistValue(sublistId, 'quantity', i);
                    loc = rec.getSublistValue(sublistId, 'location', i);
                    line.quantity = changeCurrency1(quantity);
                    line.description = rec.getSublistValue(sublistId, 'description', i);
                    line.unit = rec.getSublistValue(sublistId, 'unitsdisplay', i);
                    line.item_code = rec.getSublistValue(sublistId, 'custcol_scv_tc_item_code', i);
                    line.memo = rec.getSublistValue(sublistId, 'memo', i);
                    let inventorydetailavail = rec.getSublistValue(sublistId, 'inventorydetailavail', i);
                    let invDetail = getInventoryDetails(slInvDetail, inventorydetailavail, sublistId, rec, i)
                    line.inventorynumbers = invDetail.inventoryNumbers;
                    line.color_seris = invDetail.colorSeris;
                    line.status = invDetail.statuss;
                    arrLine.push(line);
                    total_quantity += quantity;
                }
            }
            if (loc) {
                let recLoc = record.load({
                    type: 'location',
                    id: loc,
                });
                mainaddress_text = recLoc.getValue('mainaddress_text');
                loc_name = recLoc.getValue('name');
            }

            return {
                arrLine: arrLine,
                legalname: legalname,
                mainaddress_text: mainaddress_text,
                loc_name: loc_name,
                date: date,
                tranid: tranid,
                memo: memo,
                department: department,
                receiver: receiver,
                loc: loc,
                total_quantity: changeCurrency1(total_quantity),
            };
        }

        function getDataExpWO(params, rec) {
            let trandate = rec.getValue('trandate');
            let date = getTranDate(trandate);
            let today = new Date();
            let ngayin =getDateTodate(today)
            let empUser = runtime.getCurrentUser().id;
            let empName;
            if(empUser){
                let lkFEmp = search.lookupFields({
                    type: 'employee',
                    id: empUser,
                    columns: ['firstname']
                });
                empName =  lkFEmp.firstname;
            }
            let subsidiary = rec.getValue('subsidiary');
            let obj = {
                tran_date: rec.getText('trandate'),
                assembly_lot: rec.getValue('custbody_scv_assembly_lot'),
                approval_status: rec.getValue('custbody_scv_approval_status'),
                sales_order: rec.getValue('custbody_scv_sales_order'),
                tranid: rec.getValue('tranid'),
                work_order_type: rec.getText('custbody_scv_work_order_type'),
                order_type: rec.getText('custbody_scv_order_type'),
                mfgmob_workcenter: rec.getText('custbody_mfgmob_workcenter'),
                classWO: rec.getText('class'),
                mfg_itemcode: rec.getValue('custbody_scv_mfg_itemcode'),
                assemblyitem: rec.getText('assemblyitem'),
                units: rec.getText('units'),
                quantity: rec.getValue('quantity'),
                tolerance_min_percent: rec.getValue('custbody_scv_tolerance_min_percent'),
                tolerance_max_percent: rec.getValue('custbody_scv_tolerance_max_percent'),
                giaohangdukien: rec.getValue('custbody_scv_giaohangdukien'),
                memo: rec.getValue('memo'),
                estimate_deliverytime: rec.getText('custbody_scv_estimate_deliverytime'),
            };
            let legalname;
            if (subsidiary) {
                let lkFSc = search.lookupFields({
                    type: 'subsidiary',
                    id: subsidiary,
                    columns: ['legalname']
                });
                legalname = lkFSc.legalname;
            }
            let sublistId = 'item', arrItem = [];
            for (let i = 0; i < rec.getLineCount(sublistId); i++) {
                let item= rec.getSublistText(sublistId, 'item', i);
                arrItem.push(item);
            }
            let itemString = arrItem.join('\n');
            return {
                arrItem: itemString,
                obj: obj,
                legalname: legalname,
                approval_status: obj.approval_status,
                trandate: trandate,
                date: date,
                ngayin: ngayin,
                empName: empName,
            };
        }

        function getDataExpOWO(params, rec) {
            let trandate = rec.getValue('trandate');
            let date = getTranDate(trandate)
            let subsidiary = rec.getValue('subsidiary');
            let tran_date= rec.getText('trandate');
            let approval_status= rec.getText('custbody_scv_approval_status');
            let today = new Date();
            let ngayin =getDateTodate(today)
            let empUser = runtime.getCurrentUser().id;
            let empName;
            if(empUser){
                let lkFEmp = search.lookupFields({
                    type: 'employee',
                    id: empUser,
                    columns: ['firstname']
                });
                empName =  lkFEmp.firstname;
            }
            let obj = {
                tran_date: tran_date,
                approval_status: approval_status,
                sales_order: rec.getValue('custbody_scv_sales_order'),
                mfgmob_workcenter: rec.getText('custbody_mfgmob_workcenter'),
                id: rec.getValue('id'),
                transactionnumber: rec.getValue('transactionnumber'),
                work_order_type: rec.getText('custbody_scv_work_order_type'),
                order_type: rec.getText('custbody_scv_order_type'),
                classOWO: rec.getText('class'),
                tolerance_min_percent: rec.getValue('custbody_scv_tolerance_min_percent'),
                tolerance_max_percent: rec.getValue('custbody_scv_tolerance_max_percent'),
                estimate_deliverytime: rec.getText('custbody_scv_estimate_deliverytime'),
                giaohangdukien: rec.getValue('custbody_scv_giaohangdukien'),
                memo: rec.getValue('memo')
            };
            let legalname;
            if (subsidiary) {
                let lkFSc = search.lookupFields({
                    type: 'subsidiary',
                    id: subsidiary,
                    columns: ['legalname']
                });
                legalname = lkFSc.legalname;
            }

            let sublistId = 'item', arrLine = [], arrAssembly = [];
            let stt = 1;
            for (let i = 0; i < rec.getLineCount(sublistId); i++) {
                let owo_assembly= rec.getSublistText(sublistId, 'custcol_scv_owo_assembly', i);
                let line = {
                    stt,
                    item_code: rec.getSublistValue(sublistId, 'custcol_scv_tc_item_code', i),
                    item: rec.getSublistText(sublistId, 'item', i),
                    units: rec.getSublistText(sublistId, 'units', i),
                    plan_qty: rec.getSublistValue(sublistId, 'custcol_scv_plan_qty', i),
                    owo_assembly: owo_assembly,
                    ...obj
                };
                arrLine.push(line);
                arrAssembly.push(owo_assembly);
            }
            let assemblyString = arrAssembly.join('\n');
            arrLine = arrLine.map(line => ({
                ...line,
                assemblyString: assemblyString
            }));
            return {
                obj: obj,
                arrAssembly: assemblyString,
                legalname: legalname,
                approval_status: obj.approval_status,
                tran_date: tran_date,
                date: date,
                arrLine: arrLine,
                ngayin: ngayin,
                empName: empName,
            };
        }

        const getDataExpPcvt = (params, rec) => {
            const subLegalName = getFieldSub(rec.getValue('subsidiary')).legalname;
            const locationText = rec.getText('location');
            const locationAddress = getFieldLocation(rec.getValue('location')).mainaddress_text;
            const trandate = rec.getValue('trandate');
            const tranid = rec.getValue('tranid');
            const custbody_scv_requestor = rec.getText('custbody_scv_employee_ycxvt')?.split('_')[2] || '';
            const memo = rec.getValue('memo');
            let totalQuantity = {totalQuantity: 0};

            let arrItems = []
            const lcItem = rec.getLineCount('inventory');
            let stt = 0;
            for(let i = 0; i < lcItem; i++) {
                let item = {};
                let itemData = getItemAttributesBinTransfer(rec, i);
                item.upccode = itemData.upccode;
                item.displayname = itemData.displayname;
                item.unitstype = itemData.unitstype[0].text;
                stt = pushInventoryData(rec, arrItems, item, i, stt, totalQuantity);
            }
            // let totalQuantity = arrItems.reduce((sum, item) => sum + Number(item.quantity), 0);

            return {
                arrItems,
                subLegalName,
                locationText,
                locationAddress,
                trandate: getTranDate(trandate),
                tranid,
                custbody_scv_requestor,
                memo,
                totalQuantity: changeCurrency1(totalQuantity.totalQuantity),
            }
        }

        const pushInventoryData = (rec, arrItems, item,line, stt, totalQuantity) => {
            let subRecInvDtl = rec.getSublistSubrecord({
                sublistId: 'inventory',
                fieldId: 'inventorydetail',
                line: line
            });

            let lcInvDtl = subRecInvDtl.getLineCount('inventoryassignment');// binnumber tobinnumber quantity inventory status
            if( lcInvDtl > 0) {
                for (let j = 0; j < lcInvDtl; j++) {
                    let tobinnumber = subRecInvDtl.getSublistText({
                        sublistId: 'inventoryassignment',
                        fieldId: 'tobinnumber',
                        line: j
                    }) || '';
                    let binnumber = subRecInvDtl.getSublistText({
                        sublistId: 'inventoryassignment',
                        fieldId: 'binnumber',
                        line: j
                    }) || '';
                    let quantity = subRecInvDtl.getSublistValue({
                        sublistId: 'inventoryassignment',
                        fieldId: 'quantity',
                        line: j
                    }) || '';
                    let inventorystatus = subRecInvDtl.getSublistText({
                        sublistId: 'inventoryassignment',
                        fieldId: 'inventorystatus',
                        line: j
                    })
                    totalQuantity.totalQuantity += Number(quantity);
                    arrItems.push({
                        stt: ++stt,
                        upccode: item.upccode,
                        displayname: item.displayname,
                        unitstype: item.unitstype,
                        binnumber: binnumber,
                        tobinnumber: tobinnumber,
                        quantity: changeCurrency1(quantity),
                        thoigiandieuchuyen : rec.getText('custbody_scv_bin_tran_time_back'),
                        //inventorystatus: inventorystatus
                    });

                }
            }

            return stt;
        }

        const getItemAttributesBinTransfer = (rec, index) => {
            let idItem = rec.getSublistValue({
                sublistId: 'inventory',
                fieldId: 'item',
                line: index
            });

            if(idItem) {
            return search.lookupFields({
                type: 'item',
                id: idItem,
                columns: ['upccode', 'displayname', 'unitstype']
            });
            }
        }

        const getDataExpTem = (params, rec) => {
            let templateId = params.templateId ;
            let idSublist = 'item', slInvDetail = "inventoryassignment", arrIR = [];
            let custitem_scv_dd, custitem_scv_ddns;
            let emloyeeid = rec.getValue('custbody_scv_employee_ycxvt')
            let emloyeename = '';
            let supervisorname = '';
            let stt = 1;
            if (emloyeeid) {
                const emloyeeRec = record.load({type: "employee", id: emloyeeid});
                emloyeename = emloyeeRec.getValue('firstname');
                const supervisorid = emloyeeRec.getValue('supervisor');

                supervisorname = supervisorid
                    ? record.load({type: "employee", id: supervisorid}).getValue('firstname')
                    : null;
            }
            for (let i = 0; i < rec.getLineCount(idSublist); i++) {
                let itemId = rec.getSublistValue(idSublist, 'item', i);
                let rectype = lfunc.getItemRecordType(itemId);
                let isTemCuonNhom = false, isNhomACP = false, isNhomTran = false;
                if (itemId && rectype === 'lotnumberedassemblyitem') {
                    let recItem = record.load({
                        type: rectype,
                        id: itemId,
                        isDynamic: false
                    });
                    upccode = recItem.getValue('upccode');
                    displayname = recItem.getValue('displayname');
                    let group_lv1 = recItem.getValue('custitem_scv_group_lv1');
                    let group_lv2 = recItem.getValue('custitem_scv_group_lv2');
                    //thanh dev add 5/6/2025
                    custitem_scv_dd = getItemSizeByFormat(recItem, 'custitem_scv_dd');
                    custitem_scv_ddns = getItemSizeByFormat(recItem, 'custitem_scv_ddns');
                    //thanhdev end
                    if ( ((group_lv1 === '16' && (group_lv2 === '20' || group_lv2 === '23')) ||
                        (group_lv1 === '31' && group_lv2 === '5'))) {
                        isTemCuonNhom = true;
                    }
                    if (((group_lv1 === '16' && (group_lv2 === '20' || group_lv2 === '23')))) {
                        isNhomACP = true;
                    }
                    if ((group_lv1 === '31' && group_lv2 === '5')) {
                        isNhomTran = true;
                    }
                }

                if (isTemCuonNhom && templateId === 'scv_xlsx_tem_cuon_nhom') {
                    displayname = custitem_scv_ddns ? displayname.replace(custitem_scv_dd, custitem_scv_ddns) : displayname;
                    let inventorydetailavail = rec.getSublistValue(idSublist, 'inventorydetailavail', i);
                    if (inventorydetailavail === true || inventorydetailavail === 'T') {
                        let InvDetailSub = rec.getSublistSubrecord(idSublist, 'inventorydetail', i);
                        let lcInvDetail = InvDetailSub.getLineCount(slInvDetail);
                        for (let j = 0; j < lcInvDetail; j++) {
                            let inventorynumber = InvDetailSub.getSublistValue(slInvDetail, 'receiptinventorynumber', j) ||
                                InvDetailSub.getSublistText(slInvDetail, 'issueinventorynumber', j) || '';
                            let inventoryid = InvDetailSub.getSublistValue(slInvDetail, 'issueinventorynumber', j) ||
                                InvDetailSub.getSublistValue(slInvDetail, 'numberedrecordid', j);
                            let color_seri = '', core_weight = '';
                            let net_weight = InvDetailSub.getSublistText(slInvDetail, 'quantity', j) || '';

                            if (inventoryid) {
                                let lkFInvDetail = search.lookupFields({
                                    type: 'inventorynumber',
                                    id: inventoryid,
                                    columns: [
                                        'custitemnumber_scv_item_num_color_seri',
                                        'custitemnumber_scv_net_weight',
                                        'custitemnumber_scv_core_weight'
                                    ]
                                });
                                color_seri = lkFInvDetail.custitemnumber_scv_item_num_color_seri || '';
                                core_weight = lkFInvDetail.custitemnumber_scv_core_weight || '';
                            }

                            arrIR.push({
                                displayname: displayname,
                                upccode: upccode,
                                inventorynumber: inventorynumber,
                                color_seri: color_seri,
                                net_weight: net_weight,
                                core_weight: core_weight
                            });
                        }
                    }
                    log.error('arrIR', arrIR)
                }

                if ((isNhomACP && templateId === 'scv_xlsx_nhom_acp') || (isNhomTran && templateId === 'scv_xlsx_nhom_tran')) {
                    let inventorydetailavail = rec.getSublistValue(idSublist, 'inventorydetailavail', i);
                    if (inventorydetailavail === true || inventorydetailavail === 'T') {
                        let InvDetailSub = rec.getSublistSubrecord(idSublist, 'inventorydetail', i);
                        let oriLineId = rec.getSublistValue(idSublist, 'custcol_scv_ori_lineid', i);
                        let arrStatus = getInventoryStatusChange(rec, 'customsearch_scv_rem_qc_done_2', InvDetailSub, slInvDetail);
                        let lcInvDetail = InvDetailSub.getLineCount(slInvDetail);
                        for (let j = 0; j < lcInvDetail; j++) {
                            let line = {};
                            let inventorynumber = InvDetailSub.getSublistValue(slInvDetail, 'receiptinventorynumber', j) ||
                                InvDetailSub.getSublistText(slInvDetail, 'issueinventorynumber', j) || '';
                            let inventoryId = InvDetailSub.getSublistValue(slInvDetail, 'issueinventorynumber', j) ||
                                InvDetailSub.getSublistValue(slInvDetail, 'numberedrecordid', j);
                            let quantity = InvDetailSub.getSublistValue(slInvDetail, 'quantity', j) || '';
                            let color_seri, core_weight;
                            let status = InvDetailSub.getSublistText(slInvDetail, 'inventorystatus', j) || '';
                            let net_weight = InvDetailSub.getSublistText(slInvDetail, 'quantity', j) || '';

                            if (inventoryId) {
                                let lkFInvDetail = search.lookupFields({
                                    type: 'inventorynumber',
                                    id: inventoryId,
                                    columns: ['custitemnumber_scv_item_num_color_seri', 'custitemnumber_scv_net_weight',
                                        'custitemnumber_scv_core_weight']
                                });
                                color_seri = lkFInvDetail.custitemnumber_scv_item_num_color_seri;
                                core_weight = lkFInvDetail.custitemnumber_scv_core_weight;
                            }
                            line.location = rec.getSublistText(idSublist, 'location', i);
                            line.trandate = rec.getText('trandate');
                            line.upccode = upccode;
                            line.displayname = templateId === 'scv_xlsx_nhom_acp' && custitem_scv_ddns ? displayname.replace(custitem_scv_dd, custitem_scv_ddns) : displayname;

                            if(itemId === '14299') displayname += ' (sử dụng cho hàng xước)'
                            if(itemId === '14295') displayname += ' (sử dụng cho hàng vân gỗ)'

                            line.color_seri = color_seri;
                            line.core_weight = core_weight;
                            line.net_weight = net_weight;
                            line.inventorynumber = inventorynumber;
                            line.quantity = Number(quantity);
                            line.tl_bu = 0;
                            line.tl_tong = Number(core_weight) + Number(quantity); // TL lõi + TL tịnh + TL bù
                            //line.status = status;
                            let resultStatus = arrStatus.filter(s => (s.getValue({
                                name: 'inventorynumber',
                                join: 'inventorydetail',
                                summary: search.Summary.GROUP
                            }) === inventoryId) && s.getValue({
                                name: 'custbody_scv_oriline_id',
                                summary: search.Summary.GROUP
                            }) === oriLineId);
                            if (resultStatus.length < 1) {
                                resultStatus = arrStatus.filter(s => s.getValue({
                                        name: 'custbody_scv_oriline_id',
                                        summary: search.Summary.GROUP
                                    })
                                    === oriLineId)
                            }
                            if (resultStatus.length > 1) {
                                for (let index = 0; index < resultStatus.length; index++) {
                                    let line1 = {...line};
                                    line1.status = resultStatus[index]?.getText({
                                        name: 'custbody_scv_revised_status',
                                        summary: search.Summary.GROUP
                                    }) || '';
                                    line1.quantity = resultStatus[index]?.getValue({
                                        name: 'quantity',
                                        join: 'inventorydetail',
                                        summary: search.Summary.SUM
                                    }) || 0;
                                    if (index < resultStatus.length - 1) {
                                        arrIR.push(line1);
                                    }
                                    line1.stt = stt++;
                                }
                                line.status = resultStatus[resultStatus.length - 1]?.getText({
                                    name: 'custbody_scv_revised_status',
                                    summary: search.Summary.GROUP
                                }) || '';
                                line.quantity = resultStatus[resultStatus.length - 1]?.getValue({
                                    name: 'quantity',
                                    join: 'inventorydetail',
                                    summary: search.Summary.SUM
                                }) || 0;
                            } else {
                                line.status = resultStatus[0]?.getText({
                                    name: 'custbody_scv_revised_status',
                                    summary: search.Summary.GROUP
                                }) || '';
                            }
                            line.status = 'Đạt chất lượng' ? 'OK' : 'NG'
                            arrIR.push(line);
                        }
                    }
                }
            }

            log.error('arrIR', arrIR)
            return {
                arrIR,
                emloyeename,
                supervisorname,
                location : rec.getText('location') ,
                bieumau: rec.getValue('custbody_scv_bieu_mau') || '',
                trandate: rec.getValue('trandate') || '',
                imagebase64: file.load({id: 1}).getContents()
            }
        }

        const getItemSizeByFormat = (recItem, field) => {
            let fieldValue = recItem.getText(field);
            if (!fieldValue) return '';
            let size = fieldValue.split(':')[1];
            if (!size) return '';
            size = size.replace('mm', '');
            // return size.trim();
            return size;
        }

        const getInventoryStatusChange = (recItr, idSSInventoryStatusChange, invDetailSub, slInvDetail) => {
            let arrLotNumber = [];
            let idItr = recItr.id;

            let lines = invDetailSub.getLineCount(slInvDetail)
            for (let i = 0; i < lines; i++) {
                let inventoryNumber = invDetailSub.getSublistValue(slInvDetail, 'issueinventorynumber', i) || invDetailSub.getSublistValue(slInvDetail, 'numberedrecordid', i);
                if (inventoryNumber) {
                    arrLotNumber.push(inventoryNumber);
                }
            }
            let searchObj = search.load({
                id: idSSInventoryStatusChange
            });
            let f = searchObj.filters;

            f.push(search.createFilter({
                name: 'custbody_scv_created_transaction',
                operator: search.Operator.IS,
                values: idItr
            }));

            if (arrLotNumber.length > 0) {
                f.push(search.createFilter({
                    name: 'inventorynumber',
                    join: 'inventorydetail',
                    operator: 'anyof',
                    values: arrLotNumber,
                }));
            }

            return searchObj.run().getRange(0, 100);
        }

        const getFieldLocation = (idLocation) => {
            let mainaddress_text;
            if (idLocation) {
                let recEnt = record.load({
                    type: 'location',
                    id: idLocation,
                });
                // defaultaddress không lấy được ở lookupFields
                mainaddress_text = recEnt.getValue('mainaddress_text');

            }
            return {mainaddress_text}
        }

        function getFieldEnt(entity) {
            let position_st, position_en, phone, contact_name, ent_legal_name, defaultaddress;
            if (entity) {
                let recEnt = record.load({
                    type: lbf.getEntityType(entity),
                    id: entity,
                });
                // defaultaddress không lấy được ở lookupFields
                defaultaddress = recEnt.getValue('defaultaddress');
                position_st = recEnt.getText('custentity_scv_position_st');
                position_en = recEnt.getText('custentity_scv_position_en');
                phone = recEnt.getValue('phone');
                contact_name = recEnt.getValue('custentity_scv_contact_name');
                ent_legal_name = recEnt.getValue('custentity_scv_legal_name');
            }
            return {position_st, position_en, phone, contact_name, ent_legal_name, defaultaddress}
        }

        function getFieldSub(subsidiary) {
            let mainaddress_text, phone_no, legalname, sub_legalname_eng, sub_address_en;
            if (subsidiary) {
                let recSub = record.load({
                    type: 'subsidiary',
                    id: subsidiary,
                })
                // mainaddress_text không lấy được ở lookupFields
                mainaddress_text = recSub.getValue('mainaddress_text');
                if (mainaddress_text) {
                      mainaddress_text = mainaddress_text.split('\r\n')[0];
                }
                phone_no = recSub.getValue('custrecord_scv_sub_phone');
                legalname = recSub.getValue('legalname');
                sub_legalname_eng = recSub.getValue('custrecord_scv_sub_legalname_eng');
                sub_address_en = recSub.getValue('custrecord_scv_sub_address_en');

            }
            return {mainaddress_text, phone_no, legalname, sub_legalname_eng, sub_address_en}
        }

        function getFieldSO(sd_so) {
            let port_of_loading, port_of_discharge, dkhh_dkg, currency, slSO = 'item', arrSO = [], tranid;
            if (sd_so) {
                let recSO = record.load({
                    type: 'salesorder',
                    id: sd_so,
                })
                port_of_loading = recSO.getValue('custbody_scv_so_port_of_loading');
                port_of_discharge = recSO.getValue('custbody_scv_so_port_of_discharge');
                dkhh_dkg = recSO.getValue('custbody_scv_so_dkhh_dkg');
                tranid = recSO.getValue('tranid');
                currency = recSO.getText('currency');
                for (let i = 0; i < recSO.getLineCount(slSO); i++) {
                    let obj = {};
                    obj.ori_lineid = recSO.getSublistValue(slSO, 'custcol_scv_ori_lineid', i);
                    obj.grossamt = recSO.getSublistValue(slSO, 'grossamt', i);
                    let so_ddt = recSO.getSublistText(slSO, 'custcol_scv_so_ddt', i);
                    if (so_ddt) {
                        obj.so_ddt = so_ddt.split(':')[1].trim();
                    }
                    let so_dd_nt = recSO.getSublistText(slSO, 'custcol_scv_so_dd_nt', i);
                    if (so_dd_nt) {
                        obj.so_dd_nt = so_dd_nt.split(':')[1].trim();
                    }
                    obj.so_kho_rong = recSO.getSublistValue(slSO, 'custcol_scv_so_kho_rong', i);
                    obj.so_chieu_dai = recSO.getSublistValue(slSO, 'custcol_scv_so_chieu_dai', i);
                    obj.item_eng_name = recSO.getSublistValue(slSO, 'custcol_scv_item_eng_name', i);
                    obj.item_unit_en = recSO.getSublistValue(slSO, 'custcol_scv_item_unit_en', i);
                    arrSO.push(obj);
                }
            }
            return {port_of_loading, port_of_discharge, dkhh_dkg, currency, arrSO, tranid}
        }

        function getDataHeader(recSD) {
            let sd_bl_no = recSD.getValue('custrecord_scv_sd_bl_no');
            let sd_package_no = recSD.getValue('custrecord_scv_sd_package_no');
            let sd_description = recSD.getValue('custrecord_scv_sd_description');
            let sd_inv_no = recSD.getValue('custrecord_scv_sd_inv_no');
            let sd_inv_date = recSD.getText('custrecord_scv_sd_inv_date');
            let sd_lc_no = recSD.getValue('custrecord_scv_sd_lc_no');
            let sd_lc_date = recSD.getText('custrecord_scv_sd_lc_date');
            let sd_no_send_to = recSD.getValue('custrecord_scv_sd_no_send_to');
            let sd_due_date = recSD.getValue('custrecord_scv_sd_due_date');
            let sd_others = recSD.getValue('custrecord_scv_sd_others');
            let sd_clauses = recSD.getValue('custrecord_scv_sd_clauses');
            let sd_claim = recSD.getValue('custrecord_scv_sd_claim');
            let port_of_discharge = recSD.getValue('custrecord_scv_port_of_discharge');
            let sd_transhipment = recSD.getValue('custrecord_sd_transhipment');
            let port_of_loading = recSD.getValue('custrecord_scv_port_of_loading');
            let sd_start_date = recSD.getValue('custrecord_scv_sd_start_date');
            let sd_vessel = recSD.getValue('custrecord_scv_sd_vessel');
            let sd_transport = recSD.getValue('custrecord_scv_sd_transport');
            let sd_loading = recSD.getValue('custrecord_scv_sd_loading');
            let sd_packing = recSD.getValue('custrecord_scv_sd_packing');
            let sd_container = recSD.getValue('custrecord_scv_sd_container');
            let sd_mark = recSD.getValue('custrecord_scv_sd_mark');
            let sd_freight = recSD.getValue('custrecord_scv_sd_freight');

            return {
                sd_bl_no, sd_package_no, sd_description, sd_inv_no, sd_inv_date, sd_lc_no, sd_lc_date, sd_no_send_to,
                sd_due_date, sd_others, sd_clauses, sd_claim, port_of_discharge, sd_transhipment, port_of_loading,
                sd_start_date, sd_vessel, sd_transport, sd_loading, sd_packing, sd_container, sd_mark, sd_freight
            };
        }

        function getTranDate(trandate) {
            if (!(trandate instanceof Date) || isNaN(trandate.getTime())) {
                return 'Ngày ............tháng ............. năm...............';
            }
            let timezoneOffset = trandate.getTimezoneOffset() / 60;
            trandate.setHours(trandate.getHours() + timezoneOffset + 7);
            let dd_now = String(trandate.getDate()).padStart(2, '0');
            let mm_now = String(trandate.getMonth() + 1).padStart(2, '0');
            let yyyy_now = trandate.getFullYear();
            // let ngayin =  dd_now + ' / ' + mm_now + ' / ' + yyyy_now;
            let ngaythangnam = 'Ngày ' + dd_now + ' tháng ' + mm_now + ' năm ' + yyyy_now;
            return ngaythangnam;
        }

        function getDateTodate(trandate) {
            if (!(trandate instanceof Date) || isNaN(trandate.getTime())) {
                return '....../....../.............';
            }
            let timezoneOffset = trandate.getTimezoneOffset() / 60;
            trandate.setHours(trandate.getHours() + timezoneOffset + 7);
            let dd_now = String(trandate.getDate()).padStart(2, '0');
            let mm_now = String(trandate.getMonth() + 1).padStart(2, '0');
            let yyyy_now = trandate.getFullYear();

            let todate = dd_now + ' / ' + mm_now + ' / ' + yyyy_now;
            return todate;
        }

        // function unReTextXML(text) {
        //     let cus_name = text
        //     if (!!text && typeof text === "string") {
        //         cus_name = cus_name.replace(/&/gi, '&amp;');
        //         cus_name = cus_name.replace(/>/gi, "&gt;");
        //         cus_name = cus_name.replace(/</gi, "&lt;");
        //         cus_name = cus_name.replace(/'/g, "&apos;");
        //         cus_name = cus_name.replace(/"/g, "&quot;");
        //     }
        //     return cus_name;
        // }

        function changeCurrency(number) {
            let parts = parseFloat(number).toFixed(2).split(".");
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            return parts.join(".");
        }

        function changeCurrency1(number) {
            number = parseFloat(number).toFixed(2);
            let parts = number.toString().split(".");
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
            return parts.join(",");
        }


        return {
            onRequest: onRequest
        };

    });
    