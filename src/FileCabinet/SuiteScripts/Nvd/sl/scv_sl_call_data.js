/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/search', 'N/record', 'N/query', 'N/file',
    '../lib/scv_lib_function.js',
    '../lib/scv_lib_amount_in_word.js',
    '../common/scv_common_theo_doi_phieu_in'
  ],
    function(search, record, query, file,
        lbf, libAmt, comPhieuIn) {
        var isExcel = 'F';

        function onRequest(context) {
            let request = context.request;
            let params = request.parameters;
            isExcel = params.isExcel || 'F';
            let objResponse = {data: {}, isSuccess: true, msg: '', url: ''};
            try {
                if(params.isExcel){
                    objResponse.url = getTemplateExportExcel(params.templateId);
                }
                switch (params.templateId) {
                    case 'scv_xlsx_sales_contract_vn':
                    case 'scv_xlsx_sales_contract_en':
                        objResponse.data = getDataExp_sc(params);
                        break;
                    case 'scv_xlsx_commercial_invoice':
                    case 'scv_xlsx_insurance':
                    case 'scv_xlsx_packing_list':
                    case 'scv_xlsx_detail_bl':
                        objResponse.data = getDataExp_sd(params);
                        break;
                }
                context.response.setHeader({
                    name: 'Content-Type',
                    value: 'application/json'
                });

                context.response.write(JSON.stringify(objResponse));
            } catch (error) {
                log.error('error try-cat', error)
                objResponse.isSuccess = false;
                objResponse.msg = `${error.toString()} - action ${params.templateId}`;
                context.response.write(JSON.stringify(objResponse));
            }
        }

        const getTemplateExportExcel = (templateId) =>{
            let objFile = file.load({id: `../xls/${templateId}.xlsx`});
            return objFile.url;
        }

        const getDataExp_sc = (params) => {
            let recSO = record.load({type: params.recType, id: params.recId});
            let sl = 'item', sc_name, sc_date;
            let sales_contract = recSO.getValue('custbody_scv_sales_contract');
            let subsidiary = recSO.getValue('subsidiary');
            let nguoi_dai_dien = recSO.getValue('custbody_scv_nguoi_dai_dien');
            let chuc_vu = recSO.getValue('custbody_scv_chuc_vu');
            let entity = recSO.getValue('entity');
            let so_name_of_goods = recSO.getValue('custbody_scv_so_name_of_goods');
            let dkhh_dkg = recSO.getValue('custbody_scv_so_dkhh_dkg');
            let dkhh_dssl = recSO.getValue('custbody_scv_so_dkhh_dssl');
            let dkhh_dg = recSO.getValue('custbody_scv_so_dkhh_dg');
            let dkhh_tccl = recSO.getValue('custbody_scv_so_dkhh_tccl');
            let shipdate = recSO.getText('shipdate');
            let dkgh_ghtp = recSO.getValue('custbody_scv_so_dkgh_ghtp');
            let dkgh_ptgh = recSO.getValue('custbody_scv_so_dkgh_ptgh');
            let dktt_pttt = recSO.getValue('custbody_scv_so_dktt_pttt');
            let currency = recSO.getText('currency');
            let dktt_tktt = recSO.getValue('custbody_scv_so_dktt_tktt');
            let dktt_trach_nhiem = recSO.getValue('custbody_scv_so_dktt_trach_nhiem');
            let dkcd_vn = recSO.getValue('custbody_scv_so_dkcd_vn');
            dkcd_vn = dkcd_vn.replace(/<p>|<\/p>|<strong>|<\/strong>|<br \/>/g, '');
            dkcd_vn = dkcd_vn.replace(/(?!^)ĐIỀU \d+/g, '\n\n$&');
            dkcd_vn = dkcd_vn.trimEnd() + '\n';
            let dkcd_en = recSO.getValue('custbody_scv_so_dkcd_en');
            dkcd_en = dkcd_en.replace(/<p>|<\/p>|<strong>|<\/strong>|<br \/>/g, '');
            dkcd_en = dkcd_en.replace(/(?!^)ARTICLE \d+/g, '\n\n$&');
            dkcd_en = dkcd_en.trimEnd() + '\n';
            let port_of_loading = recSO.getValue('custbody_scv_so_port_of_loading')
            let port_of_discharge = recSO.getValue('custbody_scv_so_port_of_discharge')
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
                obj.stt = stt++
                obj.description = recSO.getSublistValue(sl, 'description', i);
                obj.units = recSO.getSublistText(sl, 'units', i);
                obj.item_display = recSO.getSublistValue(sl, 'item_display', i);
                obj.memo_2 = recSO.getSublistValue(sl, 'custcol_scv_memo_2', i);
                let quantity = recSO.getSublistValue(sl, 'quantity', i) || 0;
                let grossamt = recSO.getSublistValue(sl, 'grossamt', i) || 0;
                let dongia = quantity !== 0 ? grossamt / quantity : 0;
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
            return {
                arrSL: arrSL,
                entityField: entityField,
                sc_name: sc_name,
                sc_date: sc_date,
                sub: sub,
                nguoi_dai_dien: nguoi_dai_dien,
                chuc_vu: chuc_vu,
                entity: entity,
                so_name_of_goods: so_name_of_goods,
                dkhh_dkg: dkhh_dkg,
                dkhh_dssl: dkhh_dssl,
                dkhh_dg: dkhh_dg,
                dkhh_tccl: dkhh_tccl,
                shipdate: shipdate,
                dkgh_ghtp: dkgh_ghtp,
                dkgh_ptgh: dkgh_ptgh,
                dktt_pttt: dktt_pttt,
                currency: currency,
                dktt_tktt: dktt_tktt,
                dktt_trach_nhiem: dktt_trach_nhiem,
                dkcd_vn: dkcd_vn,
                dkcd_en: dkcd_en,
                port_of_loading: port_of_loading,
                port_of_discharge: port_of_discharge,
                total_quantity: changeCurrency(total_quantity),
                total_thanhtien: changeCurrency(total_thanhtien),
                tongThanhTien_bangChu: tongThanhTien_bangChu,
                amountinword: amountinword,
            };
        }

        const getDataExp_sd = (params) => {
            let recSD = record.load({type: params.recType, id: params.recId});
            let sd_cus = recSD.getValue('custrecord_scv_sd_cus');
            let sd_contract_no = recSD.getValue('custrecord_scv_sd_contract_no');
            let sd_itf = recSD.getValue('custrecord_scv_sd_itf');
            let sd_so = recSD.getValue('custrecord_scv_sd_so');
            let sd_sub = recSD.getValue('custrecord_scv_sd_sub');
            let data = getDataHeader(recSD);
            let sd_requestor = recSD.getValue('custrecord_scv_sd_requestor');
            let sd_contract_date, cus_legal_name, cus_defaultaddress, cus_phone,
                cus_tax_number, requestor_name, sd_contract_name;
            if (sd_contract_no){
                let lkFSc = search.lookupFields({
                    type: 'customrecord_scv_sales_contract',
                    id: sd_contract_no,
                    columns: ['custrecord_scv_sc_date', 'name']
                });
                sd_contract_date = lkFSc.custrecord_scv_sc_date;
                sd_contract_name = lkFSc.name;
            }
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
            if (sd_requestor){
                let lkFSc = search.lookupFields({
                    type: 'employee',
                    id: sd_requestor,
                    columns: ['entityid']
                });
                requestor_name = lkFSc.entityid;
            }
            let sub = getFieldSub(sd_sub);
            log.error('sub', sub);
            let sdSO = getFieldSO(sd_so);
            let arrSO = sdSO.arrSO;
            let slITF = 'item', arrITR = [];
            let totalquantity = 0, totalamount = 0, totalweight = 0,
                totalweightGW = 0, weight, weightGW;
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
                        //    columns: ['custitem_scv_weight']
                            columns: ['custitem_scv_kl_vtc']
                        })
                        //weight = lkFItem.custitem_scv_weight;
                        weight = lkFItem.custitem_scv_kl_vtc;
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
                    line.unit_price = changeCurrency(unit_price);
                    line.amount = changeCurrency(amount);
                    line.quantity = changeCurrency(quantity);
                    line.weight = changeCurrency(weight);
                    line.weightGW = changeCurrency(weightGW);

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
                cus_defaultaddress: cus_defaultaddress,
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
                total_sthd: changeCurrency(total_sthd),
                data: data,
            };
        }

        function getFieldEnt(entity) {
            let position_st, phone, contact_name, ent_legal_name, defaultaddress;
            if (entity) {
                let recEnt = record.load({
                    type: lbf.getEntityType(entity),
                    id: entity,
                })
                // defaultaddress không lấy được ở lookupFields
                defaultaddress = recEnt.getValue('defaultaddress');
                position_st = recEnt.getText('custentity_scv_position_st');
                phone = recEnt.getValue('phone');
                contact_name = recEnt.getValue('custentity_scv_contact_name');
                ent_legal_name = recEnt.getValue('custentity_scv_legal_name');
            }
            return {position_st, phone, contact_name, ent_legal_name, defaultaddress}
        }

        function getFieldSub(subsidiary) {
            let mainaddress_text, phone_no, legalname, custrecord_scv_sub_legalname_eng, custrecord_scv_sub_address_en;
            if (subsidiary) {
                let recSub = record.load({
                    type: 'subsidiary',
                    id: subsidiary,
                })
                //  mainaddress_text không lấy được ở lookupFields
                mainaddress_text = recSub.getValue('mainaddress_text');
                phone_no = recSub.getValue('custrecord_scv_sub_phone');
                legalname = recSub.getValue('legalname');
                custrecord_scv_sub_legalname_eng = recSub.getValue('custrecord_scv_sub_legalname_eng');
                custrecord_scv_sub_address_en = recSub.getValue('custrecord_scv_sub_address_en');
            }
            return {mainaddress_text, phone_no, legalname, custrecord_scv_sub_legalname_eng, custrecord_scv_sub_address_en}
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
                sd_bl_no,
                sd_package_no,
                sd_description,
                sd_inv_no,
                sd_inv_date,
                sd_lc_no,
                sd_lc_date,
                sd_no_send_to,
                sd_due_date,
                sd_others,
                sd_clauses,
                sd_claim,
                port_of_discharge,
                sd_transhipment,
                port_of_loading,
                sd_start_date,
                sd_vessel,
                sd_transport,
                sd_loading,
                sd_packing,
                sd_container,
                sd_mark,
                sd_freight
            };
        }

        function changeCurrency(number) {
            let parts = parseFloat(number).toFixed(2).split(".");
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            return parts.join(".");
        }

        return {
            onRequest: onRequest
        };

    });
    