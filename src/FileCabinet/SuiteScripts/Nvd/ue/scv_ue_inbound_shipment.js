/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/search','N/url', '../cons/scv_cons_payreq'],
    (search, url, ConsPayReq) => {
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
            const triggerType = scriptContext.type;
            let form = scriptContext.form;
            let newRec = scriptContext.newRecord;
            let arrBtnPrint = [];
            let purchase_channel = newRec.getValue('custrecord_scv_inbound_purchase_channel');
            let inbound_dntt = newRec.getValue('custrecord_scv_inbound_dntt');
            if (triggerType === 'view') {
                if (purchase_channel === "2" && !inbound_dntt){
                    addBtnDNTT(scriptContext.form, scriptContext.newRecord);
                }
                addBtnPrintPdf(form, newRec, arrBtnPrint, "In Lệnh nhập hàng", "custpage_lenhnhaphang", "scv_lenhnhaphang")
            }
        }

        const addBtnDNTT = (form, newRec) => {
            const lc = newRec.getLineCount('items');
            const currencyId = lc ? newRec.getSublistValue({sublistId : 'items', line : 0, fieldId: 'pocurrency'}) : '';
            const idPurchaseOrder = lc ? newRec.getSublistValue({sublistId : 'items', line : 0, fieldId: 'purchaseorder'}) : '';
            let idSubsidiary
            if(idPurchaseOrder){
                idSubsidiary = search.lookupFields({
                    type: search.Type.PURCHASE_ORDER,
                    id: idPurchaseOrder,
                    columns: ['subsidiary']
                }).subsidiary[0]?.value || '';
            }
            const vendorId = newRec.getValue('custrecord_scv_inb_ship_vendor');
            const payAmt = newRec.getValue('custrecord_scv_inbound_pay_amt') * 1;
            const paymentCode = newRec.getValue('custrecord_scv_inb_mathanhtoan');
            let objParams = {
                createFromType : newRec.type,
                createFromId : newRec.id,
                btnid : ConsPayReq.CustomButtonId.DNTT_FROM_IB,
                vendorid : vendorId,
                currencyid : currencyId,
                pay_amt : payAmt,
                payment_code : paymentCode,
                idSub : idSubsidiary,
            };
            const urlPayReq = url.resolveRecord({
                recordType : 'customrecord_scv_payment',
                recordId : null,
                params : objParams
            });
            form.addButton({
                id: 'custpage_scv_btn_dntt',
                label: 'DNTT',
                functionName: `window.location.replace('${urlPayReq}')`
            });
        };

        const addBtnPrintPdf = (form, newRecord, arrBtnPrint, btnLabel, btnId, printfile) => {
            let recType = newRecord.type;
            let createPdfUrl = url.resolveScript({
                scriptId: 'customscript_scv_sl_addition_print_pdf',
                deploymentId: 'customdeploy_scv_sl_addition_print_pdf',
                returnExternalUrl: false
            });
            createPdfUrl += '&id=' + newRecord.id + '&type=' + recType + '&printfile=' + printfile;
            form.addButton({
                id: btnId,
                label: btnLabel,
                functionName: "window.open('" + createPdfUrl + "');"
            });

            arrBtnPrint.push({export_type: "PDF", id: btnId});
        }

        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (scriptContext) => {
            if (['create', 'edit'].includes(scriptContext.type)) {
                let newRecord = scriptContext.newRecord;
                setDataBodyInboundShipment(newRecord);
            }
        };

        const setDataBodyInboundShipment = (newRecord) => {
            const soTienTuCase = newRecord.getValue('custrecord_scv_inbound_amt_from_case') * 1;
            const soTienDieuChinh = newRecord.getValue('custrecord_scv_adjustment_amount') * 1;
            const lanCuoi =  newRecord.getValue('custrecord_scv_inb_final_pay');
            const currencyprecision = newRecord.getSublistValue('items', 'currencyprecision', 0);

            // tính tổng số tiền và số lượng
            const tongSoTien = setSumAmountAndQuantity(newRecord);

            // set số tiền thực tế
            const soTienThucTe = tongSoTien - soTienTuCase - soTienDieuChinh;
            newRecord.setValue('custrecord_scv_inb_actual_amt', soTienThucTe.toFixed(currencyprecision));

            if(lanCuoi == false){
                newRecord.setValue('custrecord_scv_inb_remaining_amt', 0);
                newRecord.setValue('custrecord_scv_inbound_adv_amt', 0);
                //newRecord.setValue('custrecord_scv_inbound_pay_amt', soTienThucTe * phanTramThanhToan / 100);
            }
            // else if(lanCuoi == true){
            //     let objSoTien = getSoTienBySS(maThanhToan);
            //     newRecord.setValue('custrecord_scv_inb_remaining_amt', objSoTien.soTienConLai);
            //     newRecord.setValue('custrecord_scv_inbound_adv_amt', objSoTien.soTienTraTruoc);
            //     newRecord.setValue('custrecord_scv_inbound_pay_amt', (soTienThucTe * phanTramThanhToan / 100) + Number(objSoTien.soTienConLai) - Number(objSoTien.soTienTraTruoc));
            // }
        };

        const setSumAmountAndQuantity = (curRec) => {
            const sublistId = 'items';
            const lc = curRec.getLineCount(sublistId);
            let tongSoTien = 0;
            let tongSoLuong = 0;
            for (let i = 0; i < lc; i++) {
                const qtyStockTracking = curRec.getSublistValue(sublistId, 'quantityexpected', i)*1;
                tongSoLuong += qtyStockTracking;
                // const porate = curRec.getSublistValue(sublistId, 'porate', i) * 1;
                const shipmentitemamount = curRec.getSublistValue({sublistId, fieldId: 'shipmentitemamount', line: i}) * 1;
                tongSoTien += shipmentitemamount || 0;
            }

            curRec.setValue('custrecord_scv_inbound_total_amt', tongSoTien);
            curRec.setValue('custrecord_scv_inbound_total_qty', tongSoLuong);

            return tongSoTien;
        };

        return {beforeLoad, beforeSubmit}

    });
