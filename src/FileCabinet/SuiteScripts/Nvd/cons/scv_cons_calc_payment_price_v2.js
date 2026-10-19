/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  04 Dec 2024         Phu Pham			    Init, create file
 *  16 Sep 2026         Phu Pham			    Bổ sung chức năng phân bổ phí vận chuyển vào đơn giá from ms. Ngọc (https://app.clickup.com/t/3773072/86cx7m32m)
 */
define([
    'N/query', 'N/search', 'N/format',
    '../lib/scv_lib_function.js',
    './scv_cons_list_type_phi.js',
    './scv_cons_item.js',
    './scv_cons_list_htvc_type.js',
    './scv_cons_search_rate_phi.js',
    './scv_cons_search_rate_pa.js',
    './scv_cons_search_rate_km.js',
    './scv_cons_search_rate_htvc.js',
    './scv_cons_format.js',
    './scv_cons_so_quytac.js',
    './scv_cons_search_so_tinh_ck_khac.js',
    './scv_cons_search_rate_pa_loai_tru.js',
    './scv_cons_search_rate_km_so.js',
    './scv_cons_queue_job.js',
    './scv_cons_subsidiary.js',
    './scv_cons_taxcode.js',
    './scv_cons_sales_promotion.js'
],
    function(
        query, search, format,
        lbf, constTypePhi, 
        constItem, constHTVCType,
        constSearchRatePhi,
        constSearchRatePA,
        constSearchRateKM,
        constSearchRateHTVC,
        constFormat,
        constSOQuytac,
        searchSOTinhCK_Khac,
        searchLoaiTruPABH,
        searchRateKM_SO,
        constQueueJob,
        constSubsidiary,
        constTaxCode,
        constSalesPromotion
    ) {
        const CHARACTER = {
            DOT: ".",
            PIPE: "|",
            MULTIPLICATION: "*",
            IS: "is",
            ANYOF: "anyof",
            HASH: "#",
            EQUAL: "=",
            GREATER_THAN: ">",
            LESS_THAN: "<",
            GREATER_THAN_OR_EQUAL: ">=",
            LESS_THAN_OR_EQUAL: "<=",
            SQUARE_BRACKETS: {
                OPEN: "[",
                CLOSE: "]"
            },
            ROUND_BRACKETS: {
                OPEN: "(",
                CLOSE: ")"
            },
        };

        const THROW_ERROR = {
            "001": "Vui lòng setup công thức tính cho giá trị nhóm!"
        };

        const ITEM_LAST_SYMBOL = {
            B: "B",
            CD: "CD",
            LH: "LH",
            KBH: "KBH",
            BPA: "BPA"
        };

        const ScheduledScript = {
            ID: 'customscript_scv_ss_sales_promotion_term',
            DEPLOYMENT: 'customdeploy_scv_ss_sales_promotion_term',
            INPUT_PARAM: 'custscript_scv_ss_input_sales_promotion'
        };

        const handleCalcPaymentPrice = (soRec) => {
            // get data saved search
            let entity_id = soRec.getValue("entity");
            let objEntity = getDataEntityById(entity_id);
            let phi_vc_phan_bo = soRec.getValue("custbody_scv_so_phi_vc_phan_bo") * 1 || 0;
            let objFiltes = {
                id: soRec.id,
                entity_id: entity_id, 
                entity_category: objEntity.custentity_scv_entity_category,
                subsidiary_id: soRec.getValue("subsidiary"),
                currency_id: soRec.getValue("currency"), 
                trandate: soRec.getValue("trandate"),
                created_time: soRec.getText("custbody_scv_so_created_time"),
                phi_vc_phan_bo: phi_vc_phan_bo
            };
            // TODO: load data
            let arrRatePhi = getDataSSRatePhi(objFiltes);
            let arrRatePA = getDataSSRatePABH(objFiltes);
            let arrRateHTVC = getDataSSRateHTVC(objFiltes);
            let arrSmartOrder = getDataSearchSmartOrder(objFiltes);
            // handle data phi cat
            let arrPhiCat = arrRatePhi.filter(e => e.phan_loai_id == constTypePhi.RECORDS.PHI_CAT.ID && e.chk_total_order === false);
            let arrPhiCatDB = arrRatePhi.filter(e => e.phan_loai_id == constTypePhi.RECORDS.PHI_CAT.ID && e.chk_total_order === true);
            let objCondition = getDataConditionPhiCatDB(arrPhiCatDB);
            let arrCondPhiCatDB = objCondition.arrResult;
            // handle data phi mog
            let arrPhiMoq = arrRatePhi.filter(e => e.phan_loai_id == constTypePhi.RECORDS.PHI_MOQ.ID && e.chk_total_order === false);
            let arrPhiMoqDB = arrRatePhi.filter(e => e.phan_loai_id == constTypePhi.RECORDS.PHI_MOQ.ID && e.chk_total_order === true);
            let objCondPhiMoq = getDataConditionPhiCatDB(arrPhiMoqDB);
            let arrCondPhiMoqDB = objCondPhiMoq.arrResult;
            // handle data phi van chuyen co ban
            let arrHTVC = arrRateHTVC.filter(e => e.type == constHTVCType.RECORDS.HTVC_CO_BAN.ID);
            let arrVCTV = arrRateHTVC.filter(e => e.type == constHTVCType.RECORDS.HTVC_THEO_VUNG.ID);
            let objCondHTVC = getDataConditionPhiCatDB(arrHTVC);
            let objCondVCTV = getDataConditionVCTV(arrVCTV);
            // handle data sublist item (sales order)
            let sublistId = "item";
            let objFields = getDataFieldOnRecord(objCondition, objCondPhiMoq, objCondHTVC, objCondVCTV);
            let arrData = handleDataSublistItem(soRec, sublistId, objFields, objFiltes);
            // TODO: Buoc 1: tinh phi cat, tinh phi mog, rate sau phi
            let arrUpdPhiCat = handleCalculationPhiCat(soRec, arrPhiCat, arrCondPhiCatDB, arrData);
            let arrUpdPhiMoq = handleCalculationPhiMoq(soRec, arrPhiMoq, arrCondPhiMoqDB, arrData);
            // TODO: Buoc 2: tinh pabh
            let arrPABH = handleDataPABH(arrRatePA, arrData, objFiltes);
            // TODO: Buoc 3: tinh chiet khau ho tro van chuyen
            let arrCondHTVC = objCondHTVC.arrResult;
            let arrCondVCTV = objCondVCTV.arrResult;
            let arrChietKhauHTVC = handleDataHoTroVanChuyen(soRec, arrCondHTVC, arrData, arrCondVCTV);
            // TODO: bổ sung tính smart order
            let arrUpdSmartOrder = handleDataSmartOrder(arrData, arrSmartOrder);

            // TODO: tinh toan va cong thuc
            let arrPayment = handleDataPaymentPrice(arrData, arrUpdPhiCat, arrUpdPhiMoq, arrPABH, arrChietKhauHTVC, arrUpdSmartOrder);
            // TODO: điều chỉnh logic tính PAKM (2025-05-29)
            arrPayment = handleDataPAKM(arrPayment, arrData, objFiltes);
            // log.error("new arrPayment", arrPayment);
            updateSublistItem(soRec, arrPayment);
            let soId = soRec.save({enableSourcing: false, ignoreMandatoryFields: true});
        }

        const updateSublistItem = (soRec, arrPayment) => {
            let sublistId = "item";
            let totalLine = soRec.getLineCount(sublistId);
            let sublistFields = [
                "custcol_scv_phi_cat", "custcol_scv_phi_moq", "custcol_scv_pabh", "custcol_scv_pakm", "custcol_scv_pakm_tien",
                "custcol_scv_hotro_vc", "custcol_scv_rate_sau_phi", "custcol_scv_ck_tong", "custcol_scv_gia_thanh_toan", 
                "rate", "custcol_scv_ck_smart", "custcol_scv_ck_som", "custcol_scv_phi_cat_percent", 
                "custcol_scv_tien_ck_khac", "custcol_scv_tong_tien_km", "custcol_scv_so_phi_vc_phan_bo"
            ];

            for(let i = 0; i < totalLine; i++) {
                let item = soRec.getSublistValue(sublistId, "item", i);
                let ori_lineid = soRec.getSublistValue(sublistId, "custcol_scv_ori_lineid", i);
                
                let objPayment = arrPayment.find(e => e.item == item && e.custcol_scv_ori_lineid == ori_lineid);
                if(!!objPayment) {
                    soRec.selectLine(sublistId, i);
                    lbf.setCurrentSublistValueData(soRec, sublistId, sublistFields, [
                        objPayment.custcol_scv_phi_cat, objPayment.custcol_scv_phi_moq, objPayment.custcol_scv_pabh,
                        objPayment.custcol_scv_pakm, objPayment.custcol_scv_pakm_tien, objPayment.custcol_scv_hotro_vc, objPayment.custcol_scv_rate_sau_phi,
                        objPayment.custcol_scv_ck_tong, objPayment.custcol_scv_gia_thanh_toan, objPayment.rate,
                        objPayment.custcol_scv_ck_smart, objPayment.custcol_scv_ck_som, objPayment.custcol_scv_phi_cat_percent,
                        objPayment.custcol_scv_tien_ck_khac, objPayment.custcol_scv_tong_tien_km, objPayment.custcol_scv_so_phi_vc_phan_bo || 0
                    ]);
                    soRec.commitLine(sublistId);
                }
            }
        }

        const handleDataPABH = (arrRatePA, arrData, objFiltes) => {
            // TODO: bổ sung logic cho PABH (ss06)
            let arrItemId = groupDataByFieldId(arrData, "item");
            let arrExcludePABH = getDataSSLoaiTruPABH(objFiltes, arrItemId);

            let arrResult = [];
            for(let i = 0; i < arrData.length; i++) {
                let objRes = {
                    linenumber: arrData[i].linenumber,
                    item: arrData[i].item,
                    custcol_scv_ori_lineid: arrData[i].custcol_scv_ori_lineid,
                    custcol_scv_pabh: 0
                };

                if(!["OthCharge", "Service"].includes(arrData[i].itemtype)) {
                    objRes.custcol_scv_pabh = getDataPercentPABH(arrData[i], arrExcludePABH, arrRatePA);   
                }
                arrResult.push(objRes);
            }
            return arrResult;
        }

        const handleAllocationShippingFee = (arrPayment, arrData, objFiltes) => {
            let totalShippingFee = objFiltes.phi_vc_phan_bo || 0;
            let eligibleLines = [];
            for (let i = 0; i < arrPayment.length; i++) {
                let findItem = arrData.find(e => e.item == arrPayment[i].item && e.custcol_scv_ori_lineid == arrPayment[i].custcol_scv_ori_lineid);
                let isAllocated = findItem?.custcol_scv_so_phi_vc_tinh === true || findItem?.custcol_scv_so_phi_vc_tinh === "T";
                if (isAllocated) {
                    eligibleLines.push({
                        item: arrPayment[i].item,
                        custcol_scv_ori_lineid: arrPayment[i].custcol_scv_ori_lineid,
                        custcol_scv_rate_sau_phi: arrPayment[i].custcol_scv_rate_sau_phi * 1 || 0,
                        quantity: findItem?.quantity * 1 || 1,
                        taxrate1: findItem?.taxrate1 * 1 || 0
                    });
                }
            }

            let allocShippingFeeMap = {};
            // TH2: If custbody_scv_so_phi_vc_phan_bo has value and there is at least one line checked
            if (totalShippingFee > 0 && eligibleLines.length > 0) {
                // Step 1: Calculate total custcol_scv_rate_sau_phi across all eligible lines (A1)
                let totalRateAfterFee = eligibleLines.reduce((sum, line) => sum + line.custcol_scv_rate_sau_phi, 0);
                let accumulatedRatio = 0;

                for (let idx = 0; idx < eligibleLines.length; idx++) {
                    let line = eligibleLines[idx];
                    let lineRateAfterFee = line.custcol_scv_rate_sau_phi;
                    let allocationRatio = 0;

                    if (idx === eligibleLines.length - 1) {
                        // Last line: 1 - accumulated ratio of previous lines to ensure total ratio equals exactly 1.000
                        allocationRatio = constFormat.roundNumber(1 - accumulatedRatio, 3);
                    } else {
                        allocationRatio = totalRateAfterFee > 0 ? constFormat.roundNumber(lineRateAfterFee / totalRateAfterFee, 3) : 0;
                    }
                    accumulatedRatio = constFormat.roundNumber(accumulatedRatio + allocationRatio, 3);

                    // Step 2: Calculate allocated shipping fee before tax per unit: ({totalShippingFee} * allocationRatio / {quantity}) / (1 + {taxrate})
                    let taxFactor = 1 + (line.taxrate1 / 100);
                    let quantity = line.quantity || 1;
                    let allocatedShippingFee = ((totalShippingFee * allocationRatio) / quantity) / taxFactor;

                    allocShippingFeeMap[line.custcol_scv_ori_lineid] = allocatedShippingFee;
                }
            }

            return allocShippingFeeMap;
        };

        const handleDataPAKM = (arrPayment, arrData, objFiltes) => {
            // phuong an khuyen mai
            let arrGrpLvl2 = groupDataByFieldId(arrData, "custitem_scv_group_lv2");
            let arrRateKM = getDataSSRatePAKM(objFiltes, arrGrpLvl2);
            let arrKMDetail = getDataPAKMSalesOrder(arrRateKM);

            // TODO: Bổ sung chức năng phân bổ phí vận chuyển vào đơn giá (V2)
            let allocShippingFeeMap = handleAllocationShippingFee(arrPayment, arrData, objFiltes);

            let arrResult = [], arrPAKM = [], arrTemp = [];
            for(let i = 0; i < arrPayment.length; i++) {
                let objRes = {
                    ...arrPayment[i],
                    custcol_scv_pakm: 0,
                    custcol_scv_pakm_tien: 0
                };
                let objFindData = arrData.find(e => e.item == arrPayment[i].item && e.custcol_scv_ori_lineid == arrPayment[i].custcol_scv_ori_lineid);

                let objPAKM = getDataNewPAKMV2(objFindData, arrRateKM, arrKMDetail, objFiltes, arrTemp);

                if(!["OthCharge", "Service"].includes(objFindData.itemtype)) {
                    objRes.custcol_scv_pakm = objPAKM.percent || 0;
                    objRes.custcol_scv_pakm_tien = objPAKM.amount || 0;
                }

                objRes.custcol_scv_tong_tien_km = ((objRes.custcol_scv_pakm / 100) * (objRes.custcol_scv_rate_sau_phi / (1 + (objFindData.bp_tax_rate / 100)))) + objRes.custcol_scv_pakm_tien;
                // objRes.custcol_scv_ck_tong = ((objRes.custcol_scv_pabh / 100) * (objRes.custcol_scv_rate_sau_phi / (1 + (objFindData.taxrate1 / 100)))) + objRes.custcol_scv_tong_tien_km + objRes.custcol_scv_tien_ck_khac;
                objRes.custcol_scv_ck_tong = ((objRes.custcol_scv_pabh / 100) * (objRes.custcol_scv_rate_sau_phi / (1 + (objFindData.bp_tax_rate / 100)))) + objRes.custcol_scv_tong_tien_km + objRes.custcol_scv_tien_ck_khac;
                objRes.custcol_scv_phi_cat_percent = !!objFindData.custcol_scv_bp_rate ? (objRes.custcol_scv_phi_cat / objFindData.custcol_scv_bp_rate * 100) : 0;

                // TODO: Bổ sung custcol_scv_so_phi_vc_phan_bo vào tính custcol_scv_gia_thanh_toan (Bước 3)
                objRes.custcol_scv_so_phi_vc_phan_bo = allocShippingFeeMap[objRes.custcol_scv_ori_lineid] || 0;

                const rateBeforeTax = getRateBeforeTax(objRes, objFindData);
                const taxRate = 1 + (objFindData.taxrate1 / 100);

                let rate = roundAmountVND((rateBeforeTax * taxRate), 100);
                let gia_thanh_toan = roundAmountVND((rateBeforeTax * taxRate), 10);

                if (objFindData.custcol_scv_bp_vat === true) {
                    rate = roundAmountVND(rateBeforeTax, 100);
                    gia_thanh_toan = roundAmountVND((rate * taxRate), 10);
                }

                objRes.rate = rate;
                objRes.custcol_scv_gia_thanh_toan = gia_thanh_toan;

                arrResult.push(objRes);

                if(!["OthCharge", "Service"].includes(objFindData.itemtype)) {
                    let arrDataPAKM = handleDataPAKMCreateSalesPromotion(objRes, objPAKM.details);
                    arrPAKM = [...arrPAKM, ...arrDataPAKM];
                }
            }
            processSalesPromotion(arrPAKM, objFiltes.id);
            return arrResult;
        }

        function roundAmountVND(amount, unit) {
            let amountVND = Math.round(amount / unit) * unit;

            return constFormat.roundNumber(amountVND, 0);
        }

        function getRateBeforeTax(objRes, objFindData) {
            return (objRes.custcol_scv_rate_sau_phi / (1 + (objFindData.bp_tax_rate / 100)))
                - objRes.custcol_scv_ck_tong
                - objRes.custcol_scv_hotro_vc
                + objRes.custcol_scv_so_phi_vc_phan_bo;
        }

        const getDataNewPAKMV2 = (objData, arrRateKM, arrKMDetail, objFiltes, arrTemp) => {
            // if(objData.custcol_scv_ori_lineid === "1758680053858-31327_1") {
            //     log.error("arrRateKM", arrRateKM);
            //     log.error("last_symbol", objData.custitem_scv_last_symbol);
            // }
            // let arrFilterRateKM = arrRateKM.filter((e) => {
            //     return (!!objData.custitem_scv_last_symbol && e.check_gc === true) ||
            //         (e.check_gc === false);
            // });

            // TODO: Lọc các dòng kết quả SS3 có cột SS3:13-Mã hàng = SO Item
            let arr_filter_item = arrRateKM.filter(e => e.item_id.includes(objData.item));
            if(arr_filter_item.length >= 1) {
                return getObjPAKMWithSOKM(arr_filter_item, objData, arrKMDetail, arrTemp);
            }

            // TODO: Kết quả SS3 không có Mã hàng = Item SO, thì lấy dòng SS3:13-Mã hàng = Null
            let color_code_id = numberToString(objData.custitem_scv_color_code);
            let do_day_nhom = numberToString(objData.custitem_scv_ddn_id);
            let do_day_tam = numberToString(objData.custitem_scv_ddsp_id);
            let phim_bao_ve = numberToString(objData.custitem_scv_pbv);
            let buoc = numberToString(objData.custitem_scv_step);
            let hoa_tiet_dot = numberToString(objData.custitem_scv_htd);
            let nhom_be_mat_son = numberToString(objData.custitem_scv_bmlsht);
            let lop_son = numberToString(objData.custitem_scv_ls);
            let class_group_lv2 = numberToString(objData.custitem_scv_group_lv2);

            let arr_filter_iteminfo = arrRateKM.filter(e => {
                let arrNhomHH = e.class_id.split(",") || [];
                let arrColorCode = !!e.color_code_id ? e.color_code_id.split(",") : [];
                let arrDoDayNhom = !!e.do_day_nhom ? e.do_day_nhom.split(",") : [];
                let arrDoDayTam = !!e.do_day_tam ? e.do_day_tam.split(",") : [];
                let arrPhimBV = !!e.phim_bao_ve ? e.phim_bao_ve.split(",") : [];
                let arrBuoc = !!e.buoc ? e.buoc.split(",") : [];
                let arrHoaTiet = !!e.hoa_tiet_dot ? e.hoa_tiet_dot.split(",") : [];
                let arrNhomSon = !!e.nhom_be_mat_son ? e.nhom_be_mat_son.split(",") : [];
                let arrLopSon = !!e.lop_son ? e.lop_son.split(",") : [];
                

                return e.item_id.length === 0 &&
                    arrNhomHH.includes(class_group_lv2) && (
                    // TODO: dieu kien 1
                    ((
                        !!e.color_code_id || !!e.do_day_nhom || !!e.do_day_tam || !!e.phim_bao_ve || 
                        !!e.chieu_rong || !!e.chieu_dai || !!e.buoc || !!e.hoa_tiet_dot || 
                        !!e.nhom_be_mat_son || !!e.lop_son 
                        // || (e.check_gc === true)
                    ) && (
                        (!e.color_code_id || (!!e.color_code_id && arrColorCode.includes(color_code_id)))
                        && (!e.do_day_nhom || (!!e.do_day_nhom && arrDoDayNhom.includes(do_day_nhom)))
                        && (!e.do_day_tam || (!!e.do_day_tam && arrDoDayTam.includes(do_day_tam)))
                        && (!e.phim_bao_ve || (!!e.phim_bao_ve && arrPhimBV.includes(phim_bao_ve)))
                        && (!e.buoc || (!!e.buoc && arrBuoc.includes(buoc)))
                        && (!e.hoa_tiet_dot || (!!e.hoa_tiet_dot && arrHoaTiet.includes(hoa_tiet_dot)))
                        && (!e.nhom_be_mat_son || (!!e.nhom_be_mat_son && arrNhomSon.includes(nhom_be_mat_son)))
                        && (!e.lop_son || (!!e.lop_son && arrLopSon.includes(lop_son)))
                        && (!e.chieu_rong || (!!e.chieu_rong && objData.custitem_scv_width == e.chieu_rong))
                        && (!e.chieu_dai || (!!e.chieu_dai && objData.custitem_scv_length == e.chieu_dai))
                        && (
                            (e.check_gc === false) ||
                            (e.check_gc === true && objData.custitem_scv_last_symbol == e.ghep_cuoi)
                        )
                    )) || 
                    // TODO: dieu kien 2
                    ((
                        !e.color_code_id && !e.do_day_nhom && !e.do_day_tam && !e.phim_bao_ve &&
                        !e.chieu_rong && !e.chieu_dai && !e.buoc && !e.hoa_tiet_dot && 
                        !e.nhom_be_mat_son && !e.lop_son 
                        // && (e.check_gc === false)
                        && (
                            (e.check_gc === false) ||
                            (e.check_gc === true && objData.custitem_scv_last_symbol == e.ghep_cuoi)
                        )
                    ) && (  
                        (objFiltes.entity_id == e.customer_id) || (e.customer_group_id.includes(objFiltes.entity_category)) || !e.customer_id || (e.customer_group_id.length === 0)
                    ))
                );
            });

            return getObjPAKMWithSOKM(arr_filter_iteminfo, objData, arrKMDetail, arrTemp);
        }

        const getObjPAKMWithSOKM = (data, objData, arrKMDetail, arrTemp) => {
            let percent = 0, amount = 0;

            let details = [];
            for(let i = 0; i < data.length; i++) {

                let objDetail = { ...data[i] };
                if(!data[i].han_muc) {
                    percent += data[i].percent;
                    amount += calcAmountPAKM(data[i], objData);
                } else {
                    let objHanMucSD = arrKMDetail.find(e => e.key_mapping == data[i].detail_id);
                    let objHMRemain = arrTemp.find(e => e.detail_id == data[i].detail_id);

                    let han_muc_sd = (objHanMucSD?.han_muc_su_dung || 0);
                    let hm_remaining = (objHMRemain?.remaining || 0);

                    let value = data[i].han_muc - han_muc_sd - (data[i].amount * objData.quantity) - hm_remaining;
                    // push han muc con lai
                    if(!!objHMRemain) {
                        objHMRemain.remaining += (data[i].amount * objData.quantity);
                    } else {
                        arrTemp.push({
                            detail_id: data[i].detail_id,
                            remaining: (data[i].amount * objData.quantity)
                        });
                    }

                    if(value >= 0) {
                        percent += data[i].percent;
                        amount += calcAmountPAKM(data[i], objData);
                    } else {
                        objDetail.amount = 0;
                    }
                }

                details.push(objDetail);
            }				

            return { percent: percent, amount: amount, details: details };
        }

        const calcAmountPAKM = (objRateKM, objItem) => {
            if(objRateKM.chk_amt_x_heso === true) {
                return objRateKM.amount * objItem.custcol_scv_unit_conversion_rate;
            }
            return objRateKM.amount;
        }

        const processSalesPromotion = (arrPAKM, internalid) => {
            try {
                if(arrPAKM.length === 0) return;
                const data = { internalid, details: arrPAKM };

                if(arrPAKM.length > 15) {
                    let queueJobId = constQueueJob.createQueueJob("SCHEDULED_SCRIPT", ScheduledScript.ID, ScheduledScript.DEPLOYMENT, ScheduledScript.INPUT_PARAM, JSON.stringify(data));
                    let processingQueueJobId = constQueueJob.processQueueJob(ScheduledScript.ID, ScheduledScript.DEPLOYMENT);
                } else {
                    const arrSalesPromotion = constSalesPromotion.getDataSalesPromotion(internalid);

                    for(let i = 0; i < arrPAKM.length; i++) {
                        let obj_find_sales_promotion = arrSalesPromotion.find(e => {
                            return e.custrecord_scv_spt_so_item == arrPAKM[i].item && 
                                e.custrecord_scv_spt_so_ori_lineid == arrPAKM[i].custcol_scv_ori_lineid &&
                                e.custrecord_scv_spt_so_detail == arrPAKM[i].detail_id;
                        });

                        let salesPromotionId = null;
                        if(!!obj_find_sales_promotion) {
                            salesPromotionId = constSalesPromotion.updateSalesPromotionTermSO(obj_find_sales_promotion.id, arrPAKM[i]);
                        } else {
                            salesPromotionId = constSalesPromotion.createSalesPromotionTermSO(internalid, arrPAKM[i]);
                        }
                    }
                }
            } catch (err) {
                log.error("ERR-QueueJobs", err);
            }
        }

        const handleDataPAKMCreateSalesPromotion = (objSublist, details) => {
            let arrResult = [];
            for(let i = 0; i < details.length; i++) {
                let objRes = {
                    ...details[i],
                    item: objSublist.item,
                    custcol_scv_ori_lineid: objSublist.custcol_scv_ori_lineid,
                };
                arrResult.push(objRes);
            }
            return arrResult;
        }

        const getDataPercentPABH = (objData, arrExcludePABH, arrRatePA) => {
            let idxExclude = arrExcludePABH.findIndex(e => e.item_id == objData.item);
            if(
                (objData.custitem_scv_last_symbol?.toUpperCase() == ITEM_LAST_SYMBOL.B) || 
                (objData.custitem_scv_last_symbol?.toUpperCase() == ITEM_LAST_SYMBOL.CD) || 
                (objData.custitem_scv_last_symbol?.toUpperCase() == ITEM_LAST_SYMBOL.LH) || 
                (objData.custitem_scv_last_symbol?.toUpperCase() == ITEM_LAST_SYMBOL.BPA) || 
                (objData.custitem_scv_last_symbol?.toUpperCase() == ITEM_LAST_SYMBOL.KBH) || 
                (idxExclude !== - 1)
            ) {
                return 0;
            }
            let class_id = numberToString(objData.class_group_id);
            // so sánh 2: so sánh theo class
            let arr_filter_class = arrRatePA.filter(e => e.class_id.includes(class_id));
            if(arr_filter_class.length === 1) {
                return getPercentBangKeVAT(arr_filter_class[0], objData.custcol_scv_so_pabh_tax);
            }
            // so sánh 3: so sánh theo thông tin của item
            arr_filter_class = arr_filter_class.length > 0 ? arr_filter_class : arrRatePA;
            let color_code_id = numberToString(objData.custitem_scv_color_code);
            let do_day_nhom = numberToString(objData.custitem_scv_ddn_id);
            let do_day_tam = numberToString(objData.custitem_scv_ddsp_id);
            let phim_bao_ve = numberToString(objData.custitem_scv_pbv);
            let buoc = numberToString(objData.custitem_scv_step);
            let hoa_tiet_dot = numberToString(objData.custitem_scv_htd);
            let nhom_be_mat_son = numberToString(objData.custitem_scv_bmlsht);
            let lop_son = numberToString(objData.custitem_scv_ls);

            let obj_info_item = arr_filter_class.find(e => {
                let arrColorCode = !!e.color_code_id ? e.color_code_id.split(",") : [];
                let arrDoDayNhom = !!e.do_day_nhom ? e.do_day_nhom.split(",") : [];
                let arrDoDayTam = !!e.do_day_tam ? e.do_day_tam.split(",") : [];
                let arrPhimBV = !!e.phim_bao_ve ? e.phim_bao_ve.split(",") : [];
                let arrBuoc = !!e.buoc ? e.buoc.split(",") : [];
                let arrHoaTiet = !!e.hoa_tiet_dot ? e.hoa_tiet_dot.split(",") : [];
                let arrNhomSon = !!e.nhom_be_mat_son ? e.nhom_be_mat_son.split(",") : [];
                let arrLopSon = !!e.lop_son ? e.lop_son.split(",") : [];

                return (
                    !!e.color_code_id || !!e.do_day_nhom || !!e.do_day_tam || !!e.phim_bao_ve || 
                    !!e.chieu_rong || !!e.chieu_dai || !!e.buoc || !!e.hoa_tiet_dot || 
                    !!e.nhom_be_mat_son || !!e.lop_son || !!e.ghep_cuoi
                ) && (
                    (!e.color_code_id || (!!e.color_code_id && arrColorCode.includes(color_code_id))) && 
                    (!e.do_day_nhom || (!!e.do_day_nhom && arrDoDayNhom.includes(do_day_nhom))) && 
                    (!e.do_day_tam || (!!e.do_day_tam && arrDoDayTam.includes(do_day_tam))) && 
                    (!e.phim_bao_ve || (!!e.phim_bao_ve && arrPhimBV.includes(phim_bao_ve))) && 
                    (!e.buoc || (!!e.buoc && arrBuoc.includes(buoc))) && 
                    (!e.hoa_tiet_dot || (!!e.hoa_tiet_dot && arrHoaTiet.includes(hoa_tiet_dot))) && 
                    (!e.nhom_be_mat_son || (!!e.nhom_be_mat_son && arrNhomSon.includes(nhom_be_mat_son))) && 
                    (!e.lop_son || (!!e.lop_son && arrLopSon.includes(lop_son))) && 
                    (!e.chieu_rong || (!!e.chieu_rong && objData.custitem_scv_width == e.chieu_rong)) && 
                    (!e.chieu_dai || (!!e.chieu_dai && objData.custitem_scv_length == e.chieu_dai)) && 
                    (!e.ghep_cuoi || (!!e.ghep_cuoi && objData.custitem_scv_last_symbol == e.ghep_cuoi))
                )
            });

            if(!obj_info_item) {
                obj_info_item =  arr_filter_class.find(e => {
                    return (
                        !e.color_code_id && !e.do_day_nhom && !e.do_day_tam && !e.phim_bao_ve &&
                        !e.chieu_rong && !e.chieu_dai && !e.buoc && !e.hoa_tiet_dot && 
                        !e.nhom_be_mat_son && !e.lop_son && !e.ghep_cuoi
                    ) && (
                        e.class_id.includes(class_id)
                    );
                });
            }
            return getPercentBangKeVAT(obj_info_item, objData.custcol_scv_so_pabh_tax);
        }

        const getPercentBangKeVAT = (objPABH, isBangKeVAT) => {
            if(!objPABH) return 0;
            if(isBangKeVAT === true) {
                return objPABH?.chiet_khau_vat || 0;
            } else {
                return objPABH?.chiet_khau_no_vat || 0;
            }
        }

        const handleDataPaymentPrice = (arrData, arrUpdPhiCat, arrUpdPhiMoq, arrPABH, arrHTVC, arrSmartOrder) => {
            let arrResult = [];
            for(let i = 0; i < arrData.length; i++) {
                let objRes = {
                    linenumber: arrData[i].linenumber,
                    item: arrData[i].item,
                    custcol_scv_ori_lineid: arrData[i].custcol_scv_ori_lineid,
                    custcol_scv_ck_som: arrData[i].custcol_scv_ck_som,
                    custcol_scv_so_phi_vc_phan_bo: 0,
                };

                let objPhiCat = arrUpdPhiCat.find(e => e.linenumber == objRes.linenumber && e.item == objRes.item);
                let objPhiMoq = arrUpdPhiMoq.find(e => e.linenumber == objRes.linenumber && e.item == objRes.item);
                let objPABH = arrPABH.find(e => e.linenumber == objRes.linenumber && e.item == objRes.item);
                let objHTVC = arrHTVC.find(e => e.linenumber == objRes.linenumber && e.item == objRes.item);
                let objSmartOrd = arrSmartOrder.find(e => e.linenumber == objRes.linenumber && e.item == objRes.item);

                objRes.custcol_scv_phi_cat = objPhiCat?.custcol_scv_phi_cat || 0;
                objRes.custcol_scv_phi_moq = objPhiMoq?.custcol_scv_phi_moq || 0;
                objRes.custcol_scv_pabh = objPABH?.custcol_scv_pabh || 0;

                objRes.custcol_scv_hotro_vc = objHTVC?.custcol_scv_hotro_vc || 0;
                objRes.custcol_scv_ck_smart = objSmartOrd?.custcol_scv_ck_smart || 0;

                objRes.custcol_scv_rate_sau_phi = arrData[i].custcol_scv_bp_rate + objRes.custcol_scv_phi_cat + 
                    (!!arrData[i].quantity ? (objRes.custcol_scv_phi_moq / arrData[i].quantity) : 0) +
                    ((arrData[i].custcol_scv_phi_cat_dc / 100) * arrData[i].custcol_scv_bp_rate);

                // objRes.custcol_scv_tien_ck_khac = objRes.custcol_scv_rate_sau_phi * (((arrData[i].custcol_scv_ck_khac * 1) + objRes.custcol_scv_ck_som + objRes.custcol_scv_ck_smart) / 100);
                objRes.custcol_scv_tien_ck_khac = (objRes.custcol_scv_rate_sau_phi / (1 + (arrData[i].bp_tax_rate / 100))) * (((arrData[i].custcol_scv_ck_khac * 1) + objRes.custcol_scv_ck_som + objRes.custcol_scv_ck_smart) / 100);
                arrResult.push(objRes);
            }
            return arrResult;
        }

        const handleCalculationPhiMoq = (soRec, arrPhiMoq, arrCondPhiMoqDB, arrData) => {
            let arrResult = [];
            let arrCopy = JSON.parse(JSON.stringify(arrData));
            // ko tinh phi voi truong hop = khong tinh va nhap thu cong
            let arrKhongTinh = arrCopy.filter(e => {
                return e.custcol_scv_tinh_phi_moq == constSOQuytac.RECORDS.KHONG_TINH.ID
                    || e.custcol_scv_tinh_phi_moq == constSOQuytac.RECORDS.NHAP_THU_CONG.ID;
            });
            for (let idx = arrCopy.length - 1; idx >= 0; idx--) {
                let obj_find_khongtinh = arrKhongTinh.find(e => e.linenumber == arrCopy[idx].linenumber && e.item == arrCopy[idx].item); 
                if(!!obj_find_khongtinh) {
                    arrResult.push({
                        item: arrCopy[idx].item,
                        linenumber: arrCopy[idx].linenumber,
                        custcol_scv_phi_moq: arrCopy[idx].custcol_scv_phi_moq * 1
                    });
                    arrCopy.splice(idx, 1);
                }
            }
            // tinh phi moq dac biet
            arrCondPhiMoqDB.forEach(cond => {
                processConditionPhiDB(cond, arrCopy, arrResult, soRec, "custcol_scv_phi_moq");
            });
            // tinh phi moq binh thuong
            let arrGrpItem = lbf.onGroupByArray(arrCopy, ["item"]);
            let arrTinhPhiMoq = arrData.filter(e => e.custcol_scv_tinh_phi_moq == constSOQuytac.RECORDS.TU_DONG.ID || !e.custcol_scv_tinh_phi_moq);
            for(let i = 0; i < arrGrpItem.length; i++) {
                let arr_filter_item = arrTinhPhiMoq.filter(e => e.item == arrGrpItem[i].item);
                let total_qty = arr_filter_item.reduce((a, b) => a + (b.quantity * 1), 0);
                
                if(!arr_filter_item[0].class_group_id) continue;
                let objPhiMoq = checkTotalQtyWithinRangePhiCat(total_qty, arrPhiMoq, arr_filter_item[0].class_group_id);
                if(objPhiMoq.internalid) {
                    for(let obj of arr_filter_item) {
                        let phi_moq_db = (obj.custcol_scv_bp_rate * parseFloat(objPhiMoq.phi_percent) / 100) + objPhiMoq.phi_amt;
                        arrResult.push({
                            item: obj.item,
                            linenumber: obj.linenumber,
                            custcol_scv_phi_moq: phi_moq_db
                        });
                    }
                }
            }
            return arrResult;
        }

        const handleDataHoTroVanChuyen = (soRec, arrCondition, arrData, arrVCTV) => {
            let subsidiary_id = soRec.getValue("subsidiary");
            // TODO: logic lấy data để so sánh: Nếu item có parent thì lấy thông tin của parent. Ngược lại thì lấy thông tin của item
            let arrCopy = [], arrResult = [];
            for(let line = 0; line < arrData.length; line++) {
                let {objParent, ...rest} = arrData[line];
                if(arrData[line].parent) {
                    let { id, parent, ...objRestParent } = objParent;
                    rest = {...rest, ...objRestParent};
                }
                arrCopy.push(rest);
            }
            let arrGroupLvl2 = getDataItemGroupLevel2(arrCopy);
            // ko tinh phi voi truong hop = khong tinh va nhap thu cong
            let arrKhongTinh = arrCopy.filter(e => {
                return e.custcol_scv_tinh_htvc == constSOQuytac.RECORDS.KHONG_TINH.ID
                    || e.custcol_scv_tinh_htvc == constSOQuytac.RECORDS.NHAP_THU_CONG.ID;
            });
            for (let idx = arrCopy.length - 1; idx >= 0; idx--) {
                let obj_find_khongtinh = arrKhongTinh.find(e => e.linenumber == arrCopy[idx].linenumber && e.item == arrCopy[idx].item); 
                if(!!obj_find_khongtinh) {
                    let objRes = {
                        item: arrCopy[idx].item,
                        linenumber: arrCopy[idx].linenumber,
                        custcol_scv_hotro_vc: arrCopy[idx].custcol_scv_hotro_vc * 1
                    };
                    // TODO: 12/04/2025 add logic find item group level 2
                    let obj_find_itemgroup = arrGroupLvl2.find(e =>{
                        return e.id == arrCopy[idx].custitem_scv_group_lv2 && e.custrecord_scv_htvc_quy_doi === "T"
                        && arrCopy[idx].custcol_scv_tinh_htvc == constSOQuytac.RECORDS.NHAP_THU_CONG.ID;
                    });
                    if(!!obj_find_itemgroup && subsidiary_id != constSubsidiary.RECORDS.CONG_TY_CP_NHOM_VD.ID) {
                        objRes.custcol_scv_hotro_vc = objRes.custcol_scv_hotro_vc * arrCopy[idx].custcol_scv_unit_conversion_rate;
                    }
                    arrResult.push(objRes);
                    arrCopy.splice(idx, 1);
                }
            }
            // TODO: add 05/05/2025 (ko tinh cho cac item type ben duoi)
            for (let idx = arrCopy.length - 1; idx >= 0; idx--) {
                if(["OthCharge", "Service"].includes(arrCopy[idx].itemtype)) {
                    arrResult.push({
                        item: arrCopy[idx].item,
                        linenumber: arrCopy[idx].linenumber,
                        custcol_scv_hotro_vc: 0
                    });
                    arrCopy.splice(idx, 1);
                }
            }

            let options = {
                entity_id: soRec.getValue("entity"),
                vung_van_chuyen: soRec.getValue("custbody_scv_vung_van_chuyen"),
                ship_method: soRec.getValue("custbody_scv_htvc"),
                arrVCTV: arrVCTV,
                soRec: soRec
            };

            let arrNewVCTV = [];
            arrCondition.filter(cond => cond.chk_total_order).forEach(cond => {
                processConditionPhiHTVC(cond, arrCopy, arrNewVCTV, options);
            });
            arrCondition.filter(cond => !cond.chk_total_order).forEach(cond => {
                processConditionPhiHTVC(cond, arrCopy, arrNewVCTV, options);
            });

            let arr_grp_vctc = lbf.onGroupByArray(arrNewVCTV, ["ht_id", "chia_deu_gia_tri"]);
            for(let objGrp of arr_grp_vctc) {
                let arr_filter_vctc = arrNewVCTV.filter(e => e.ht_id == objGrp.ht_id && e.chia_deu_gia_tri == objGrp.chia_deu_gia_tri);
                if(objGrp.chia_deu_gia_tri === true) {
                    let total_qty = arr_filter_vctc.reduce((a, b) => a + b.quantity, 0);
                    for(let objFilter of arr_filter_vctc) {
                        let isUpdate = isUpdateGiaHoTroVC(arrGroupLvl2, objFilter, subsidiary_id);
                        let ho_tro_vc = total_qty ? (objFilter.custcol_scv_hotro_vc / total_qty) : 0;
                        ho_tro_vc = isUpdate ? (ho_tro_vc * objFilter.custcol_scv_unit_conversion_rate) : ho_tro_vc;
                        arrResult.push({
                            item: objFilter.item,
                            linenumber: objFilter.linenumber,
                            custcol_scv_hotro_vc: ho_tro_vc
                        });
                    }
                } else {
                    for(let objFilter of arr_filter_vctc) {
                        let isUpdate = isUpdateGiaHoTroVC(arrGroupLvl2, objFilter, subsidiary_id);
                        let ho_tro_vc = isUpdate ? (objFilter.custcol_scv_hotro_vc * objFilter.custcol_scv_unit_conversion_rate) : objFilter.custcol_scv_hotro_vc;
                        arrResult.push({
                            item: objFilter.item,
                            linenumber: objFilter.linenumber,
                            custcol_scv_hotro_vc: ho_tro_vc
                        });
                    }
                }
            }
            return arrResult;
        }

        let isUpdateGiaHoTroVC = (arrGroupLvl2, data, subsidiary_id) => {
            if(subsidiary_id == constSubsidiary.RECORDS.CONG_TY_CP_NHOM_VD.ID) {
                return false;
            }
            let isUpdate = arrGroupLvl2.some(e => e.id == data.custitem_scv_group_lv2 && e.custrecord_scv_htvc_quy_doi === "T");
            return isUpdate;
        }

        const getDataItemGroupLevel2 = (arrCopy) => {
            let arrGroupLvlId = arrCopy.map(e => e.custitem_scv_group_lv2);
            arrGroupLvlId = arrGroupLvlId.filter((e, idx) => arrGroupLvlId.indexOf(e) === idx && !!e);
            if(arrGroupLvlId.length === 0) return [];
            
            let sqlQuery = `SELECT id, name, custrecord_scv_htvc_quy_doi, custrecord_scv_phi_ktc 
                FROM customrecord_scv_group_level
                WHERE isinactive = 'F' AND id IN (${arrGroupLvlId.join(", ")})`;
            
            let resultSearch = query.runSuiteQL({
                query: sqlQuery,
                params: [],
                pageSize: 1000
            });

		    resultSearch = resultSearch.asMappedResults();
            return resultSearch;
        }

        const handleDataSmartOrder = (arrData, arrSmartOrder) => {
            let arrCopy = JSON.parse(JSON.stringify(arrData));

            let arrResult = [];
            for(let objCopy of arrCopy) {
                let obj_find_smart_order = arrSmartOrder.find(e => createFindSmartOrder(e, objCopy));
                if(!!obj_find_smart_order) {
                    let objRes = {
                        item: objCopy.item,
                        linenumber: objCopy.linenumber,
                        custcol_scv_ck_smart: obj_find_smart_order.ck_smart || 0
                    };
                    arrResult.push(objRes);
                }
            }
            return arrResult;
        }

        const createFindSmartOrder = (objSmartOrd, objCopy) => {
            let arrCategory = objSmartOrd.category_id ? objSmartOrd.category_id.split(",") : [];
            let arrColorCode = objSmartOrd.ma_mau ? objSmartOrd.ma_mau.split(",") : [];
            let arrDoDayNhom = objSmartOrd.do_day_nhom ? objSmartOrd.do_day_nhom.split(",") : [];
            let arrDoDaySP = objSmartOrd.do_day_tam ? objSmartOrd.do_day_tam.split(",") : [];

            let isMatchesCategory = arrCategory.includes(numberToString(objCopy.class_group_id));
            let isMatchesColorCode = arrColorCode.includes(numberToString(objCopy.custitem_scv_color_code));
            let isMatchesDDN = arrDoDayNhom.includes(numberToString(objCopy.custitem_scv_ddn_id));
            let isMatchesDDSP = arrDoDaySP.includes(numberToString(objCopy.custitem_scv_ddsp_id));

            let arrCondition = [
                (objSmartOrd.standard_item == objCopy.custitem_scv_stadard_item),
                (arrCategory.length <= 0 || isMatchesCategory),
                (arrColorCode.length <= 0 || isMatchesColorCode),
                (arrDoDayNhom.length <= 0 || isMatchesDDN),
                (arrDoDaySP.length <= 0 || isMatchesDDSP),
                (!objSmartOrd.so_seri || objSmartOrd.so_seri == objCopy.custcol_scv_color_seri),
                (objCopy.quantity >= objSmartOrd.order_chuan_moq),
                (objCopy.quantity % objSmartOrd.order_chan === 0)
            ];

            return arrCondition.every(condition => condition);
        }

        const processConditionPhiHTVC = (objCondition, arrCopy, arrResult, options) => {
            let soRec = options.soRec;
            let arrVCTV = options.arrVCTV;
            if (arrCopy.length === 0) return;

            let arrCategory = objCondition.arrCategory || [];
            if (objCondition.arrItemGroup.length > 0 && objCondition.arrSumFormula.length > 0) {
                let arrGrpData = lbf.onGroupByArray(arrCopy, [...objCondition.arrItemGroup]);
                let arrItem = getListItemPhiDBWithSumFormula(objCondition, arrGrpData, arrCopy);
    
                for (let i = arrCopy.length - 1; i >= 0; i--) {
                    if (
                        arrItem.includes(arrCopy[i].item)
                        && arrCategory.includes(numberToString(arrCopy[i].class_group_id))
                    ) {
                        let obj = getDataObjPhiHoTroVanChuyen(arrCopy[i], objCondition, options, arrVCTV);
                        arrResult.push(obj);
                        arrCopy.splice(i, 1);
                    }
                }
            } else if (objCondition.arrCompare.length > 0) {
                let arrHeader = objCondition.arrCompare.filter(e => !e.join);
                let arrLineItem = objCondition.arrCompare.filter(e => e.join);
                if (compareHeaderPhiDB(soRec, arrHeader)) {
                    let arrItem = getListItemCalcPhiDacBiet(objCondition, arrLineItem, arrCopy);
    
                    for (let i = arrCopy.length - 1; i >= 0; i--) {
                        if (
                            arrItem.includes(arrCopy[i].item)
                            && arrCategory.includes(numberToString(arrCopy[i].class_group_id))
                        ) {
                            let obj = getDataObjPhiHoTroVanChuyen(arrCopy[i], objCondition, options, arrVCTV);
                            arrResult.push(obj);
                            arrCopy.splice(i, 1);
                        }
                    }
                }
            } else {
                for (let i = arrCopy.length - 1; i >= 0; i--) {
                    if (
                        arrCategory.includes(numberToString(arrCopy[i].class_group_id))
                    ) {
                        let obj = getDataObjPhiHoTroVanChuyen(arrCopy[i], objCondition, options, arrVCTV);
                        arrResult.push(obj);
                        arrCopy.splice(i, 1);
                    }
                }
            }
        }

        const getDataObjPhiHoTroVanChuyen = (objItem, objCond, options, arrVCTV) => {
            let obj = {
                item: objItem.item,
                linenumber: objItem.linenumber,
                quantity: objItem.quantity,
                custitem_scv_group_lv2: objItem.custitem_scv_group_lv2,
                custcol_scv_unit_conversion_rate: objItem.custcol_scv_unit_conversion_rate
            };
            let class_id = numberToString(objItem.class_group_id);
            // calc van chuyen co ban
            let amount = calculatePhiHTVC(objItem, objCond.phi_percent, objCond.phi_amt);
            // van chuyen theo vung
            let arr_filter_vctv = arrVCTV.filter(e => {
                return e.arrCategory.includes(class_id) &&
                    e.arrVungVC.includes(options.vung_van_chuyen) && 
                    e.ship_method == options.ship_method;
            });
            let objVCTV = arr_filter_vctv[0] || {};
            if(arr_filter_vctv.length > 1) {
                objVCTV = arr_filter_vctv.find(e => e.customer_id == options.entity_id) || {};
                if(!objVCTV.internalid) {
                    for(let i = 0; i < arr_filter_vctv.length; i++) {
                        let isCompare = comparePhiCatDacBiet(arr_filter_vctv[i].arrCompare, objItem);
                        objVCTV = arr_filter_vctv[i];
                        if(isCompare) break;
                    }
                }
            }

            obj.custcol_scv_hotro_vc = (amount * (objVCTV?.he_so_hotro || 0)) + (objVCTV?.phi_amt || 0);
            obj.he_so_hotro = objVCTV?.he_so_hotro || 0;
            obj.ht_id = objVCTV?.internalid || "";
            obj.chia_deu_gia_tri = objVCTV?.chia_deu_gia_tri || false;
            return obj;
        }

        const processConditionPhiDB = (objCondition, arrCopy, arrResult, soRec, amountField) => {
            if (arrCopy.length === 0) return;

            let arrCategory = objCondition.arrCategory || [];
            if (objCondition.arrItemGroup.length > 0 && objCondition.arrSumFormula.length > 0) {
                let arrGrpData = lbf.onGroupByArray(arrCopy, [...objCondition.arrItemGroup]);
                let arrItem = getListItemPhiDBWithSumFormula(objCondition, arrGrpData, arrCopy);
    
                for (let i = arrCopy.length - 1; i >= 0; i--) {
                    if (
                        arrItem.includes(arrCopy[i].item) 
                        && arrCategory.includes(numberToString(arrCopy[i].class_group_id))
                    ) {
                        arrResult.push({
                            item: arrCopy[i].item,
                            linenumber: arrCopy[i].linenumber,
                            [amountField]: calculatePhiDB(arrCopy[i], objCondition.phi_percent, objCondition.phi_amt),
                        });
                        arrCopy.splice(i, 1);
                    }
                }
            } else if (objCondition.arrCompare.length > 0) {
                let arrHeader = objCondition.arrCompare.filter(e => !e.join);
                let arrLineItem = objCondition.arrCompare.filter(e => e.join);
                if (compareHeaderPhiDB(soRec, arrHeader)) {
                    let arrItem = getListItemCalcPhiDacBiet(objCondition, arrLineItem, arrCopy);
                    for (let i = arrCopy.length - 1; i >= 0; i--) {
                        if (
                            arrItem.includes(arrCopy[i].item)
                            && arrCategory.includes(numberToString(arrCopy[i].class_group_id))
                        ) {
                            arrResult.push({
                                item: arrCopy[i].item,
                                linenumber: arrCopy[i].linenumber,
                                [amountField]: calculatePhiDB(arrCopy[i], objCondition.phi_percent, objCondition.phi_amt),
                            });
                            arrCopy.splice(i, 1);
                        }
                    }
                }
            }
        };

        const calculatePhiDB = (item, phiPercent, phiAmt) => {
            return (item.custcol_scv_bp_rate * parseFloat(phiPercent) / 100) + phiAmt;
        };

        const calculatePhiHTVC = (item, phiPercent, phiAmt) => {
            return ((item.custcol_scv_bp_rate / (1 + (item.bp_tax_rate / 100))) * (parseFloat(phiPercent) / 100)) + phiAmt;
        };

        const handleCalculationPhiCat = (soRec, arrPhiCat, arrCondPhiCatDB, arrData) => {
            let arrResult = [];
            let arrCopy = JSON.parse(JSON.stringify(arrData));
            let arrGroupLvl2 = getDataItemGroupLevel2(arrCopy);
            // ko tinh phi voi truong hop = khong tinh va nhap thu cong
            let arrKhongTinh = arrCopy.filter(e => {
                return e.custcol_scv_tinh_phi_cat == constSOQuytac.RECORDS.KHONG_TINH.ID
                    || e.custcol_scv_tinh_phi_cat == constSOQuytac.RECORDS.NHAP_THU_CONG.ID;
            });
            for (let idx = arrCopy.length - 1; idx >= 0; idx--) {
                let obj_find_khongtinh = arrKhongTinh.find(e => e.linenumber == arrCopy[idx].linenumber && e.item == arrCopy[idx].item); 
                if(!!obj_find_khongtinh) {
                    arrResult.push({
                        item: arrCopy[idx].item,
                        linenumber: arrCopy[idx].linenumber,
                        custcol_scv_phi_cat: arrCopy[idx].custcol_scv_phi_cat * 1
                    });
                    arrCopy.splice(idx, 1);
                }
            }
            // tinh phi cat voi conversion_rate = null or = 1
            let arrFilterConvRate = arrCopy.filter(e => !e.custcol_scv_unit_conversion_rate || e.custcol_scv_unit_conversion_rate == 1);
            for (let i = arrCopy.length - 1; i >= 0; i--) {
                let obj_find_convrate = arrFilterConvRate.find(e => e.linenumber == arrCopy[i].linenumber && e.item == arrCopy[i].item); 
                let obj_find_itemgroup = arrGroupLvl2.find(e => e.id == arrCopy[i].custitem_scv_group_lv2);

                // log.error("obj_find_itemgroup", obj_find_itemgroup);
                if(!!obj_find_convrate && obj_find_itemgroup?.custrecord_scv_phi_ktc !== "T") {
                    arrResult.push({
                        item: arrCopy[i].item,
                        linenumber: arrCopy[i].linenumber,
                        custcol_scv_phi_cat: 0
                    });
                    arrCopy.splice(i, 1);
                }
            }
            // tinh phi cat dac biet
            arrCondPhiCatDB.forEach(cond => {
                processConditionPhiDB(cond, arrCopy, arrResult, soRec, "custcol_scv_phi_cat");
            });
            // tinh phi cat binh thuong
            let arrTinhPhiCat = arrData.filter(e => e.custcol_scv_tinh_phi_cat == constSOQuytac.RECORDS.TU_DONG.ID || !e.custcol_scv_tinh_phi_cat);
            let arrGrpItem = lbf.onGroupByArray(arrCopy, ["item"]);
            for(let i = 0; i < arrGrpItem.length; i++) {
                let arr_filter_item = arrTinhPhiCat.filter(e => e.item == arrGrpItem[i].item);
                let total_qty = arr_filter_item.reduce((a, b) => a + (b.quantity * 1), 0);
                
                if(!arr_filter_item[0].class_group_id) continue;
                let objPhiCat = checkTotalQtyWithinRangePhiCat(total_qty, arrPhiCat, arr_filter_item[0].class_group_id);
                if(objPhiCat.internalid) {
                    for(let obj of arr_filter_item) {
                        let phi_cat_db = (obj.custcol_scv_bp_rate * parseFloat(objPhiCat.phi_percent) / 100) + objPhiCat.phi_amt;
                        arrResult.push({
                            item: obj.item,
                            linenumber: obj.linenumber,
                            custcol_scv_phi_cat: phi_cat_db
                        });
                    }
                }
            }
            return arrResult;
        }

        const getListItemPhiDBWithSumFormula = (objCondPhiCatDB, arrGrpData, arrData) => {
            let arrItem = [];
            let fields = objCondPhiCatDB.arrSumFormula.map(e => e.field);
            for(let i = 0; i < arrGrpData.length; i++) {
                let arr_filter_item = arrData.filter(e => {
                    return objCondPhiCatDB.arrItemGroup.every(fieldId => e[fieldId] == arrGrpData[i][fieldId]);
                });
                let total_formula = 0;

                for(let j = 0; j < arr_filter_item.length; j++) {
                    total_formula += fields.reduce((a, b) => {
                        return a * (arr_filter_item[j][b] || 0);
                    }, 1);
                }

                let objData = {
                    [objCondPhiCatDB.objOperator.field]: total_formula
                };

                let isCompare = compareData(objCondPhiCatDB.objOperator, objData);
                if(!isCompare) continue;

                let arrItemId = arr_filter_item.map(e => e.item);
                arrItem = [...arrItem, ...arrItemId];
            }
            return arrItem;
        }

        const getListItemCalcPhiDacBiet = (objCondPhiCatDB, arrLineItem, arrData) => {
            let arrGrpItem = lbf.onGroupByArray(arrData, ["item"]);
            let arrItem = [];
            for(let i = 0; i < arrGrpItem.length; i++) {
                let arr_filter_item = arrData.filter(e => e.item == arrGrpItem[i].item);
                let total_qty = arr_filter_item.reduce((a, b) => a + (b.quantity * 1), 0);

                let isInRange = checkWithinRangeQty(total_qty, objCondPhiCatDB.from_qty, objCondPhiCatDB.to_qty);
                if(!isInRange) continue;
                
                let isValid = comparePhiCatDacBiet(arrLineItem, arr_filter_item[0]);
                if(!isValid) continue;

                arrItem.push(arrGrpItem[i].item);
            }
            return arrItem;
        }

        const comparePhiCatDacBiet = (arrLineItem, objItem) => {
            for(let objSetup of arrLineItem) {
                let isCompare = compareData(objSetup, objItem);
                if(!isCompare) return false;
            }
            return true;
        }

        const compareHeaderPhiDB = (soRec, arrHeader) => {
            let objData = {};
            for(let objHeader of arrHeader) {
                objData[objHeader.field] = soRec.getValue(objHeader.field);

                let isCompare = compareData(objHeader, objData);
                if(!isCompare) return false;
            }
            return true;
        }

        const checkWithinRangeQty = (total_qty, from_qty, to_qty) => {
            if(!from_qty && !to_qty) return true;
            let isInRange = false;

            let from_qty_num = parseInt(from_qty.replace(/[[(]/, ''));
            let to_qty_num = parseInt(to_qty.replace(/[\])]/, ''));
            let isFromInclusive = from_qty.includes(CHARACTER.SQUARE_BRACKETS.OPEN);
            let isToInclusive = to_qty.includes(CHARACTER.SQUARE_BRACKETS.CLOSE);

            if(!!from_qty && !!to_qty) {
                isInRange = (isFromInclusive ? total_qty >= from_qty_num : total_qty > from_qty_num) &&
                    (isToInclusive ? total_qty <= to_qty_num : total_qty < to_qty_num);
            } else if(!!from_qty) {
                isInRange = (isFromInclusive ? total_qty >= from_qty_num : total_qty > from_qty_num);
            } else if(!!to_qty) {
                isInRange = (isToInclusive ? total_qty <= to_qty_num : total_qty < to_qty_num);
            }
            return isInRange;
        }

        const checkTotalQtyWithinRangePhiCat = (total_qty, arrPhiCat, class_group_id) => {
            let objPhiCat = {};
            for(let i = 0; i < arrPhiCat.length; i++) {
                let isInRange = checkWithinRangeQty(total_qty, arrPhiCat[i].from_qty, arrPhiCat[i].to_qty);
                let arrCategory = arrPhiCat[i].category_id?.split(",") || [];

                if(isInRange === true && arrCategory.includes(numberToString(class_group_id))){
                    objPhiCat = arrPhiCat[i];
                    break;
                }
            }
            return objPhiCat;
        }

        const compareData = (objSetup, objData) => {
            let isCompare = false;
            switch (objSetup.operator) {
                case CHARACTER.IS:
                case CHARACTER.ANYOF:
                    var arrValue = objSetup.value.split(CHARACTER.PIPE);
                    if(typeof objData[objSetup.field] === 'number') {
                        objData[objSetup.field] = objData[objSetup.field]?.toString();
                    }
                    isCompare = arrValue.includes(objData[objSetup.field]);
                    break;
                case CHARACTER.EQUAL:
                    var arrValue = objSetup.value.split(CHARACTER.PIPE);
                    arrValue = arrValue.map(number => number * 1);

                    isCompare = arrValue.includes(objData[objSetup.field] * 1);
                    break;
                case CHARACTER.HASH:
                    var arrValue = objSetup.value.split(CHARACTER.PIPE);
                    arrValue = arrValue.map(number => number * 1);

                    isCompare = !arrValue.includes(objData[objSetup.field] * 1);
                    break;
                case CHARACTER.GREATER_THAN: 
                case "&gt;":
                    isCompare = Number(objData[objSetup.field]) > Number(objSetup.value);
                    break;
                case CHARACTER.LESS_THAN:
                case "&lt;":
                    isCompare = Number(objData[objSetup.field]) < Number(objSetup.value);
                    break;
                case CHARACTER.GREATER_THAN_OR_EQUAL: 
                case "&gt;=":
                    isCompare = Number(objData[objSetup.field]) >= Number(objSetup.value);
                    break;
                case CHARACTER.LESS_THAN_OR_EQUAL:
                case "&lt;=":
                    isCompare = Number(objData[objSetup.field]) <= Number(objSetup.value);
                    break;
            }
            return isCompare;
        }

        const getDataFieldOnRecord = (objPhiCat, objPhiMoq, objCondHTVC, objCondVCTV) => {
            let itemFields = [
                ...objPhiCat.itemFields, ...objPhiMoq.itemFields, 
                ...objCondHTVC.itemFields, ...objCondVCTV.itemFields
            ];
            let sublistFields = [
                ...objPhiCat.sublistFields, ...objPhiMoq.sublistFields, 
                ...objCondHTVC.sublistFields, ...objCondVCTV.sublistFields
            ];

            itemFields = [...new Set(itemFields)];
            sublistFields = [...new Set(sublistFields)];
            return {
                item: itemFields,
                sublist: sublistFields
            }
        }

        const getDataConditionPhiCatDB = (arrPhiCatDB) => {
            /**
             * TODO: rules condition
             * ? giá trị nhóm: chỉ group theo thông tin bên trong item
             * ? sum line field: chỉ tính công thức theo field dưới line item và field trong màn hình item (chỉ phép nhân)
             * ? header id: field id trên header của so (không được phép lấy 2 cấp)
             * ? line id: chỉ lấy field trong màn hình item (sublist item)
             * ? so sánh: so sánh giá trị trên so và màn hình setup
             * ? giá trị so sánh: giá trị đc setup sẵn
             * --- logic xử lý---
             * ? nếu có nhiều record setup phí đặc biệt thì thêm điều kiện hoặc
             * ? lấy danh sách field cần sử dụng cho màn hình item từ record setup
             * ? trường hợp giá trị nhóm có data thì chỉ có duy nhất 1 dòng
             * ? nếu [from quantity, to quantity] trên màn hình được nhập phải so sánh với quantity (sublist item)
             */

            let arrResult = [];
            let itemFields = [], sublistFields = [];
            let arrGrpPhiCat = groupDataByFieldId(arrPhiCatDB, "internalid");
            for(let phiCatId of arrGrpPhiCat) {
                let arrFilterPhiCat = arrPhiCatDB.filter(e => e.internalid == phiCatId);
                
                let objRes = {
                    internalid: phiCatId,
                    chk_total_order: arrFilterPhiCat[0].chk_total_order,
                    name: arrFilterPhiCat[0].name,
                    from_qty: arrFilterPhiCat[0].from_qty,
                    to_qty: arrFilterPhiCat[0].to_qty,
                    phi_amt: arrFilterPhiCat[0].phi_amt,
                    phi_percent: arrFilterPhiCat[0].phi_percent,
                    arrCategory: arrFilterPhiCat[0].category_id.split(","),
                    arrItemGroup: [], arrSumFormula: [],
                    arrCompare: []
                };

                for(let objFilter of arrFilterPhiCat) {
                    if(!!objFilter.gia_tri_nhom?.trim()) {
                        let arrGTN = objFilter.gia_tri_nhom.split(CHARACTER.PIPE);
                        arrGTN.forEach(e => {
                            let fieldId = getFieldOnItem(e);
                            if(!!fieldId) {
                                itemFields.push(fieldId);
                                objRes.arrItemGroup.push(fieldId);
                            }
                        });
                        // sum công thức
                        objRes.objOperator = {
                            field: "sumformula",
                            operator: objFilter.so_sanh,
                            value: objFilter.gia_tri_so_sanh
                        };
                        objRes.arrSumFormula = getDataSumFormula(objFilter.sum_line_field, itemFields, sublistFields);
                    }
                    else if(!!objFilter.header_field) {
                        objRes.arrCompare.push({
                            field: objFilter.header_field,
                            operator: objFilter.so_sanh,
                            value: objFilter.gia_tri_so_sanh
                        });
                    } 
                    else if(!!objFilter.line_field) {
                        let parts = objFilter.line_field.split(CHARACTER.DOT);
                        if(parts[0] === "item") {
                            itemFields.push(parts[1]);
                            objRes.arrCompare.push({
                                field: parts[1],
                                join: parts[0],
                                operator: objFilter.so_sanh,
                                value: objFilter.gia_tri_so_sanh
                            });
                        }
                    }
                }
                arrResult.push(objRes);
            }

            itemFields = [...new Set(itemFields)];
            return {arrResult, itemFields, sublistFields};
        }

        const getDataConditionVCTV = (arrVCTV) => {
            let arrResult = [];
            let itemFields = [], sublistFields = [];
            let arrGrpVCTV = groupDataByFieldId(arrVCTV, "internalid");

            for(let id of arrGrpVCTV) {
                let arrFilterVCTV = arrVCTV.filter(e => e.internalid == id);

                let objRes = {
                    internalid: id,
                    arrCategory: arrFilterVCTV[0].category_id.split(","),
                    arrVungVC: arrFilterVCTV[0].vung_van_chuyen.split(","),
                    ship_method: arrFilterVCTV[0].ship_method,
                    customer_id: arrFilterVCTV[0].customer_id,
                    he_so_hotro: arrFilterVCTV[0].he_so_hotro,
                    phi_amt: arrFilterVCTV[0].phi_amt,
                    chia_deu_gia_tri: arrFilterVCTV[0].chia_deu_gia_tri || false,
                    arrCompare: []
                };

                for(let objFilter of arrFilterVCTV) {
                    if(!!objFilter.line_field) {
                        let parts = objFilter.line_field.split(CHARACTER.DOT);
                        if(parts[0] === "item") {
                            itemFields.push(parts[1]);
                            objRes.arrCompare.push({
                                field: parts[1],
                                join: parts[0],
                                operator: objFilter.so_sanh,
                                value: objFilter.gia_tri_so_sanh
                            });
                        }
                    }
                }
                arrResult.push(objRes);
            }

            itemFields = [...new Set(itemFields)];
            return {arrResult, itemFields, sublistFields};   
        }

        const getDataSumFormula = (cong_thuc, itemFields, sublistFields) => {
            if(!cong_thuc) throw THROW_ERROR["001"];

            let arrResult = [];
            let arrCongThuc = cong_thuc.split(CHARACTER.MULTIPLICATION);
            arrCongThuc.forEach(value => {
                let parts = value.split(CHARACTER.DOT);
                if(parts.length === 1) {
                    arrResult.push({
                        field: parts[0]
                    });
                    sublistFields.push(parts[0]);
                } else if(parts.length === 2) {
                    arrResult.push({
                        field: parts[1],
                        join: parts[0]
                    });
                    itemFields.push(parts[1]);
                }
            });
            return arrResult;
        }

        const getFieldOnItem = (value) => {
            let parts = value.split(CHARACTER.DOT);
            if(parts[0] === "item") {
                return parts[1];
            }
            return null;
        }

        const getDataSSRateHTVC = (objFiltes) => {
            // filters
            let myFilters = [];
            
            myFilters.push(search.createFilter({
                name: 'custrecord_scv_ht_type', operator: 'anyof', 
                values: [constHTVCType.RECORDS.HTVC_CO_BAN.ID, constHTVCType.RECORDS.HTVC_THEO_VUNG.ID]
            }));
            if(!!objFiltes.subsidiary_id) {
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_ht_sub', operator: 'anyof', 
                    values: objFiltes.subsidiary_id
                }));
            }
            if(!!objFiltes.currency_id) {
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_ht_currency', operator: 'anyof', 
                    values: objFiltes.currency_id
                }));
            }
            if(!!objFiltes.trandate) {
                let trandate = format.format({ value: objFiltes.trandate, type: "date" });

                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_ht_start_date', operator: 'onorbefore', 
                    values: trandate
                }));
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_ht_end_date', operator: 'onorafter', 
                    values: trandate
                }));
            }
            let arrResult = constSearchRateHTVC.getDataSource(myFilters);
            return arrResult;
        }

        const getDataEarlyBirdSpecials = (objFiltes) => {
            let myFilters = [
                ["isinactive", "is", "F"],
            ];

            if(!!objFiltes.subsidiary_id) {
                myFilters.push("AND");
				myFilters.push(["custrecord_scv_ck_som_sub", "anyof", objFiltes.subsidiary_id]);
            }
            if(!!objFiltes.trandate) {
                let trandate = format.format({ value: objFiltes.trandate, type: "date" });

                myFilters.push("AND");
				myFilters.push(["custrecord_scv_ck_som_start_date", "onorbefore", trandate]);

                myFilters.push("AND");
				myFilters.push(["custrecord_scv_ck_som_end_date", "onorafter", trandate]);
            }
            if(!!objFiltes.created_time) {
                myFilters.push("AND");
				myFilters.push(["custrecord_scv_ck_som_start_time", "lessthanorequalto", objFiltes.created_time]);

                myFilters.push("AND");
				myFilters.push(["custrecord_scv_ck_som_end_time", "greaterthanorequalto", objFiltes.created_time]);
            }

            let resultSearch = search.create({
				type: 'customrecord_scv_ck_som',
				filters: myFilters,
				columns: ['internalid', 'custrecord_scv_ck_som_sub', 'custrecord_scv_ck_som_ck']
			});

            resultSearch = resultSearch.run().getRange(0, 1);
            let chiet_khau_som = resultSearch.length > 0 ? resultSearch[0].getValue('custrecord_scv_ck_som_ck') : 0;
            return parseFloat(chiet_khau_som);
        }

        const getDataSearchSmartOrder = (objFiltes) => {
            let myFilters = [
                ["isinactive", "is", "F"],
            ];

            if(!!objFiltes.subsidiary_id) {
                myFilters.push("AND");
				myFilters.push(["custrecord_scv_smart_order_subsidiary", "anyof", objFiltes.subsidiary_id]);
            }
            if(!!objFiltes.trandate) {
                let trandate = format.format({ value: objFiltes.trandate, type: "date" });

                myFilters.push("AND");
				myFilters.push(["custrecord_scv_smart_order_start_date", "onorbefore", trandate]);

                myFilters.push("AND");
				myFilters.push(["custrecord_scv_smart_order_end_date", "onorafter", trandate]);
            }
            if(!!objFiltes.created_time) {
                // myFilters.push("AND");
				// myFilters.push(["custrecord_scv_smart_order_so_time", "lessthanorequalto", objFiltes.created_time]);

                myFilters.push("AND");
				myFilters.push(["custrecord_scv_smart_order_so_time", "greaterthanorequalto", objFiltes.created_time]);
            }

            let resultSearch = search.create({
				type: 'customrecord_scv_smart_order',
				filters: myFilters,
				columns: [
                    'custrecord_scv_smart_order_vtc', 'custrecordscv_smart_order_nhom', 'custrecord_scv_smart_order_mm',
                    'custrecord_scv_smart_order_chan', 'custrecord_scv_smart_order_chuan_moq', 'custrecord_scv_smart_order_ddn',
                    'custrecord_scv_smart_order_ddt', 'custrecord_scv_smart_order_seri', 'custrecord_scv_smart_order_ck_smart',
                    'custrecord_scv_smart_order_subsidiary'
                ]
			});
            resultSearch = resultSearch.run().getRange(0, 100);

            let arrResult = [];
            for(let objSearh of resultSearch) {
                let ck_smart = objSearh.getValue('custrecord_scv_smart_order_ck_smart') || 0;

                let obj = {
                    internalid: objSearh.id,
                    standard_item: objSearh.getValue('custrecord_scv_smart_order_vtc') ? "T" : "F",
                    category_id: objSearh.getValue('custrecordscv_smart_order_nhom'),
                    category_nm: objSearh.getText('custrecordscv_smart_order_nhom'),
                    order_chan: objSearh.getValue('custrecord_scv_smart_order_chan') * 1,
                    order_chuan_moq: objSearh.getValue('custrecord_scv_smart_order_chuan_moq') * 1,
                    ma_mau: objSearh.getValue('custrecord_scv_smart_order_mm'),
                    do_day_nhom: objSearh.getValue('custrecord_scv_smart_order_ddn'),
                    do_day_tam: objSearh.getValue('custrecord_scv_smart_order_ddt'),
                    so_seri: objSearh.getValue('custrecord_scv_smart_order_seri'),
                    ck_smart: parseFloat(ck_smart),
                    subsidiary_id: objSearh.getValue('custrecord_scv_smart_order_subsidiary'),
                    subsidiary_nm: objSearh.getText('custrecord_scv_smart_order_subsidiary'),
                };
                arrResult.push(obj);
            }

            return arrResult;
        }

        const getDataSSRatePAKM = (objFiltes, arrGrpLvl2) => {
            // filters
            let myFilters = [];

            if(arrGrpLvl2.length > 0) {
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_spt_group', operator: 'anyof', 
                    values: arrGrpLvl2
                }));
            }

            if(!!objFiltes.subsidiary_id) {
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_spt_subsidiary', operator: 'anyof', 
                    values: objFiltes.subsidiary_id
                }));
            }
            if(!!objFiltes.entity_id) {
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_spt_d_do_cus',
                    join: 'custrecord_scv_spt_d_parent',
                    operator: 'anyof', 
                    values: [objFiltes.entity_id, "@NONE@"]
                }));
            }
            if(!!objFiltes.entity_category) {
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_spt_customer_group', operator: 'anyof', 
                    values: [objFiltes.entity_category, "@NONE@"]
                }));
            }
            if(!!objFiltes.currency_id) {
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_spt_currency', operator: 'anyof', 
                    values: objFiltes.currency_id
                }));
            }
            if(!!objFiltes.trandate) {
                let trandate = format.format({ value: objFiltes.trandate, type: "date" });

                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_spt_start_date', operator: 'onorbefore', 
                    values: trandate
                }));
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_spt_end_date', operator: 'onorafter', 
                    values: trandate
                }));
            }
            let arrResult = constSearchRateKM.getDataSource(myFilters);
            return arrResult;
        }

        const getDataSSRatePABH = (objFiltes) => {
            // filters 
            let myFilters = [];
            if(!!objFiltes.entity_id) {
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_st_customer', operator: 'anyof', 
                    values: objFiltes.entity_id
                }));
            }
            if(!!objFiltes.subsidiary_id) {
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_st_subsidiary', operator: 'anyof', 
                    values: objFiltes.subsidiary_id
                }));
            }
            if(!!objFiltes.currency_id) {
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_st_currency', operator: 'anyof', 
                    values: objFiltes.currency_id
                }));
            }
            if(!!objFiltes.trandate) {
                let trandate = format.format({ value: objFiltes.trandate, type: "date" });

                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_st_start_date', operator: 'onorbefore', 
                    values: trandate
                }));
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_st_end_date', operator: 'onorafter', 
                    values: trandate
                }));
            }

            let arrResult = constSearchRatePA.getDataSource(myFilters);
            return arrResult;
        }

        const getDataPAKMSalesOrder = (arrRateKM) => {
            let arrDetailId = groupDataByFieldId(arrRateKM, "detail_id");
            if(arrDetailId.length === 0) return;

            let myFilters = [];
            myFilters.push(search.createFilter({
                name: "internalid",
                join: "CUSTRECORD_SCV_SPT_SO_DETAIL",
                operator: 'anyof', 
                values: arrDetailId
            }));

            let arrResult = searchRateKM_SO.getDataSource(myFilters);
            return arrResult;
        }

        const getDataSSLoaiTruPABH = (objFiltes, arrItemId) => {
            if(arrItemId.length === 0) return [];

            let myFilters = [];
            myFilters.push(search.createFilter({
                name: 'custrecord_scv_loai_tru_pabh_item', operator: 'anyof', 
                values: arrItemId
            }));

            if(!!objFiltes.subsidiary_id) {
                myFilters.push(search.createFilter({
                    name: "custrecord_scv_spt_subsidiary",
                    join: "CUSTRECORD_SCV_LOAI_TRU_PABH_PARENT",
                    operator: 'anyof', 
                    values: objFiltes.subsidiary_id
                }));
            }

            if(!!objFiltes.trandate) {
                let trandate = format.format({ value: objFiltes.trandate, type: "date" });

                myFilters.push(search.createFilter({
                    name: "custrecord_scv_spt_start_date",
                    join: "CUSTRECORD_SCV_LOAI_TRU_PABH_PARENT",
                    operator: 'onorbefore', 
                    values: trandate
                }));
                myFilters.push(search.createFilter({
                    name: "custrecord_scv_spt_end_date",
                    join: "CUSTRECORD_SCV_LOAI_TRU_PABH_PARENT",
                    operator: 'onorafter', 
                    values: trandate
                }));
            }

            let arrResult = searchLoaiTruPABH.getDataSource(myFilters);
            return arrResult;
        }

        const getDataSSRatePhi = (objFiltes) => {
            // filters 
            let myFilters = [];
            myFilters.push(search.createFilter({
                name: 'custrecord_scv_phi_type', operator: 'anyof', 
                values: [constTypePhi.RECORDS.PHI_CAT.ID, constTypePhi.RECORDS.PHI_MOQ.ID, constTypePhi.RECORDS.KHONG_TINH_PHI_MOQ.ID]
            }));
            // myFilters.push(search.createFilter({
            //     name: 'custrecord_scv_phi_sum_order', operator: 'is', 
            //     values: 'F'
            // }));

            if(!!objFiltes.subsidiary_id) {
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_phi_subsidiary', operator: 'anyof', 
                    values: objFiltes.subsidiary_id
                }));
            }
            
            if(!!objFiltes.trandate) {
                let trandate = format.format({ value: objFiltes.trandate, type: "date" });

                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_phi_start_date', operator: 'onorbefore', 
                    values: trandate
                }));
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_phi_end_date', operator: 'onorafter', 
                    values: trandate
                }));
            }

            let arrResult = constSearchRatePhi.getDataSource(myFilters);
            return arrResult;
        }

        const handleDataSublistItem = (soRec, sublistId, objFields, objFiltes) => {
            let itemFields = objFields.item;
            let sublistFields = objFields.sublist;

            let earlyBird = getDataEarlyBirdSpecials(objFiltes);
            let arrSublist = getDataSublistItem(soRec, sublistId, sublistFields);

            let arrItemId = groupDataByFieldId(arrSublist, "item");
            let arrBpRateTax = groupDataByFieldId(arrSublist, "custcol_scv_bp_rate_tax");
            let arrBpTaxCode = [];
            if(arrBpRateTax.length > 0) {
                arrBpTaxCode = constTaxCode.getDataSource(search.createFilter({
                    name: 'internalid', operator: 'anyof', 
                    values: arrBpRateTax
                }));
            }
            
            let arrItem = getDataItem(arrItemId, itemFields);
            let arrParentId = groupDataByFieldId(arrItem, "parent");
            let arrParentItem = getDataItem(arrParentId, itemFields);

            let arrResult = [];
            for(let i = 0; i < arrSublist.length; i++) {
                let obj_find_item = arrItem.find(e => e.id == arrSublist[i].item) || {};
                let obj_find_parent = arrParentItem.find(e => e.id == obj_find_item.parent) || {};
                let { id, ...objData } = obj_find_item;

                if(
                    arrSublist[i].item != constItem.RECORDS.SUB_TOTAL.ID &&
                    arrSublist[i].item != constItem.RECORDS.DESCRIPTION.ID &&
                    obj_find_item.itemtype != "Discount"
                ) {
                    let obj_find_rate_tax = arrBpTaxCode.find(e => e.id == arrSublist[i].custcol_scv_bp_rate_tax) || {};

                    let objRes = formatValueWithObject({
                        ...arrSublist[i],
                        ...objData,
                        custcol_scv_ck_som: earlyBird,
                        bp_tax_rate: parseFloat(obj_find_rate_tax.rate || 0),
                        objParent: formatValueWithObject(obj_find_parent)
                    });
                    arrResult.push(objRes);
                }
            }
            return arrResult;
        }

        const getDataItem = (arrItemId, arrItemField) => {
            if(arrItemId.length === 0) return [];

            arrItemField = arrItemField.filter(e => e != "custitem_scv_ddn" && e != "custitem_scv_ddsp");
            
            let columns = [
                'id', 'parent', 'itemtype', 'custitem_scv_color_code', 'custitem_scv_width', 'custitem_scv_length', 'class', 
                'custitem_scv_group_lv4', 'custitem_scv_group_lv3', 'custitem_scv_group_lv2', 'custitem_scv_group_lv1', 
                'custitem_scv_pbv', 'custitem_scv_he_tran', 'custitem_scv_stadard_item', ...arrItemField,
                'BUILTIN.DF(custitem_scv_ddn) as custitem_scv_ddn_display',
                'BUILTIN.DF(custitem_scv_ddsp) as custitem_scv_ddsp_display',
                'custitem_scv_ddn as custitem_scv_ddn_id', 'custitem_scv_ddsp as custitem_scv_ddsp_id', 
                'custitem_scv_step', 'custitem_scv_htd', 'custitem_scv_bmlsht', 'custitem_scv_ls', 'custitem_scv_last_symbol'
            ];
            columns = [...new Set(columns)];

            let sqlQuery = `SELECT ${columns.join(', ')} FROM item
		        WHERE id IN ('${arrItemId.join("','")}') AND isinactive = 'F'`;
            
            let resultSearch = query.runSuiteQL({
                query: sqlQuery,
                params: [],
                pageSize: 1000
            });

		    resultSearch = resultSearch.asMappedResults();
            let arrResult = resultSearch.map(e => {
                e.custitem_scv_ddn = getValueMilimet(e.custitem_scv_ddn_display);
                e.custitem_scv_ddsp = getValueMilimet(e.custitem_scv_ddsp_display);
                e.class_group_id = e.custitem_scv_group_lv4 || e.custitem_scv_group_lv3 || e.custitem_scv_group_lv2 || e.custitem_scv_group_lv1;
                return e;
            });
		    return arrResult;
        }

        const getValueMilimet = (value) => {
            if(!value) return 0;

            let parts = value.split(":");
            let match = parts[1].match(/[\d.]+/);
            
            return match ? parseFloat(match[0]) : 0;
        }

        const numberToString = (_number) => {
            if(typeof _number === 'number') {
                return _number.toString();
            }
            return _number;
        }

        const getDataSublistItem = (soRec, sublistId, sublistFields) => {
            let arrResult = [];
            let lc = soRec.getLineCount(sublistId);
            let fields = [
                "item", "custcol_scv_bp_vat", "custcol_scv_so_pabh_tax", "item_display", "custcol_scv_ori_lineid", "custcol_scv_unit_conversion_rate", 
                "custcol_scv_ck_khac", "custcol_scv_gia_thanh_toan", "taxrate1", "quantity", "custcol_scv_color_seri",
                "custcol_scv_tinh_htvc", "custcol_scv_hotro_vc", "custcol_scv_tinh_phi_moq", "custcol_scv_phi_moq", "custcol_scv_tinh_phi_cat",
                "custcol_scv_phi_cat", "custcol_scv_phi_cat_dc", "custcol_scv_bp_rate_tax", 
                "custcol_scv_so_phi_vc_tinh", "custcol_scv_so_phi_vc_phan_bo", ...sublistFields
            ];
            fields = [...new Set(fields)];

            for(let i = 0; i < lc; i++) {
                let base_price = soRec.getSublistValue(sublistId, "custcol_scv_bp_rate", i) * 1;
                // if(!!base_price) {
                    let obj = {
                        linenumber: i,
                        custcol_scv_bp_rate: base_price
                    };
                    for(let fieldId of fields) {
                        obj[fieldId] = soRec.getSublistValue(sublistId, fieldId, i);
                    }
                    arrResult.push(obj);
                // }
            }
            return arrResult;
        }

        const getDataEntityById = (internalid) => {
            if(!internalid) return {};

            let entityLKF = search.lookupFields({
                type: "customer", // luôn là customer
                id: internalid,
                columns: ["custentity_scv_entity_category"]
            });
            
            let obj = {
                custentity_scv_entity_category: entityLKF?.custentity_scv_entity_category?.[0]?.value || ""
            };
            return obj;
        }

        const formatValueWithObject = (_inputObj) => {
            for(let property in _inputObj) {
                if(_inputObj[property] == null || _inputObj[property] == undefined) {
                    _inputObj[property] = "";
                }
            }
            return _inputObj;
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

        const reCalcChietKhauKhac = (soRec, internalid) => {
            let data = searchSOTinhCK_Khac.getDataSourceWithId(internalid);
            let sl = "item";
            let lc = soRec.getLineCount(sl);

            let arrBpTaxCode = getDataBpTaxCodeSublistItem(soRec, sl, lc);

            for(let i = 0; i < lc; i++) {
                let item_id = soRec.getSublistValue(sl, "item", i);
                let bp_rate_tax = soRec.getSublistValue(sl, "custcol_scv_bp_rate_tax", i);
                let ori_line_id = soRec.getSublistValue(sl, "custcol_scv_ori_lineid", i);
                let obj_find_data = data.find(e => e.item_id == item_id && e.ori_line_id == ori_line_id);
                if(obj_find_data) {
                    let obj_find_rate_tax = arrBpTaxCode.find(e => e.id == bp_rate_tax) || {};
                    let bp_tax_rate = parseFloat(obj_find_rate_tax.rate || 0);

                    let custcol_scv_bp_vat = soRec.getSublistValue(sl, "custcol_scv_bp_vat", i);
                    let custcol_scv_rate_sau_phi = soRec.getSublistValue(sl, "custcol_scv_rate_sau_phi", i) * 1;
                    let custcol_scv_gia_thanh_toan = soRec.getSublistValue(sl, "custcol_scv_gia_thanh_toan", i) * 1;
                    let custcol_scv_hotro_vc =  soRec.getSublistValue(sl, "custcol_scv_hotro_vc", i) * 1;

                    let custcol_scv_pabh = soRec.getSublistValue(sl, "custcol_scv_pabh", i) * 1;
                    let custcol_scv_ck_som = soRec.getSublistValue(sl, "custcol_scv_ck_som", i) * 1;
                    let custcol_scv_ck_smart = soRec.getSublistValue(sl, "custcol_scv_ck_smart", i) * 1;
                    let custcol_scv_tong_tien_km = soRec.getSublistValue(sl, "custcol_scv_tong_tien_km", i) * 1;
                    let taxrate1 = soRec.getSublistValue(sl, "taxrate1", i);
                    // cong thuc
                    let custcol_scv_ck_tong = (custcol_scv_rate_sau_phi / (1 + (bp_tax_rate / 100))) - (custcol_scv_gia_thanh_toan / (1 + (taxrate1 / 100))) - custcol_scv_hotro_vc;
                    let custcol_scv_tien_ck_khac = custcol_scv_ck_tong - (((custcol_scv_pabh / 100) * (custcol_scv_rate_sau_phi / (1 + (bp_tax_rate / 100)))) + custcol_scv_tong_tien_km);
                    let custcol_scv_ck_khac = ((custcol_scv_tien_ck_khac / (custcol_scv_rate_sau_phi / (1 + (bp_tax_rate / 100)))) * 100) - (custcol_scv_ck_som + custcol_scv_ck_smart);

                    let rate = custcol_scv_gia_thanh_toan;
                    if(custcol_scv_bp_vat === true) {
                        rate = custcol_scv_gia_thanh_toan / (1 + (taxrate1 / 100));
                    }

                    soRec.selectLine(sl, i);
                    lbf.setCurrentSublistValueData(soRec, sl, [
                        "custcol_scv_ck_tong", "custcol_scv_tien_ck_khac", "custcol_scv_ck_khac", "rate"
                    ], [
                        custcol_scv_ck_tong, custcol_scv_tien_ck_khac, custcol_scv_ck_khac, rate
                    ]);
                    soRec.commitLine(sl);
                }
            }
            let soId = soRec.save({enableSourcing: false, ignoreMandatoryFields: true});
        }

        const getDataBpTaxCodeSublistItem = (soRec, sl, lc) => {
            let arrBpRateTax = [];
            for(let i = 0; i < lc; i++) {
                let bp_rate_tax = soRec.getSublistValue(sl, "custcol_scv_bp_rate_tax", i);
                if(!arrBpRateTax.includes(bp_rate_tax)) {
                    arrBpRateTax.push(bp_rate_tax);
                }
            }
            if(arrBpRateTax.length === 0) return [];


            let arrBpTaxCode = constTaxCode.getDataSource(search.createFilter({
                name: 'internalid', operator: 'anyof', 
                values: arrBpRateTax
            }));
            return arrBpTaxCode;
        }

        return {
            handleCalcPaymentPrice,
            reCalcChietKhauKhac,
        };
        
    });
    