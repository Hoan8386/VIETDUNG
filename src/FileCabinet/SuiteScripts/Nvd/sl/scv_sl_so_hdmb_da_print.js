/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @description Suitelet for printing HDMB-DA from Sales Order screen
 */
define(['N/file', 'N/url', 'N/record', 'N/render', 'N/runtime', 'N/search', '../lib/scv_lib_amount_in_word'],

    (file, url, record, render, runtime, search, libAmount) => {

        const onRequest = (scriptContext) => {
            let parameters = scriptContext.request.parameters;

            if (scriptContext.request.method === 'POST' && parameters.exportType === 'word') {
                let objData = getDataHdmbDa(parameters);
                scriptContext.response.write(JSON.stringify(objData));
            }
        }

        const getDataHdmbDa = (parameters) => {
            let recSO = record.load({
                type: 'salesorder',
                id: parameters.recId
            });

            let salesContractId = recSO.getValue('custbody_scv_sales_contract');
            if (!salesContractId) throw new Error('Sales Order does not have a linked Sales Contract');

            let recSC = record.load({
                type: 'customrecord_scv_sales_contract',
                id: salesContractId
            });

            let contractData = getContractData(recSC);

            let customerInfo = getValueFromCustomer(recSC);

            let subInfo = getValueFromSubsidiary(recSC);

            let { items, totalAmount } = getDataItemsFromSO(recSO);

            let custbody_scv_amount_in_word = recSO.getValue('custbody_scv_amount_in_word');
            const amountWord = (custbody_scv_amount_in_word
                ? custbody_scv_amount_in_word.replace('./', '')
                : (totalAmount ? libAmount.DocTienBangChu(totalAmount, 'VND') : '')).replace(/\s+/g, ' ').trim();

            let baseUrl = url.resolveDomain({ hostType: url.HostType.APPLICATION, accountId: runtime.accountId });
            let urlTemplate = file.load('../doc/scv_docx_HDMB_DA.docx').url;

            const scDateFormat = formatedDateTime(contractData.custrecord_scv_sc_date);
            const startDateFormat = formatedDateTime(contractData.custrecord_scv_sc_start_date);
            const endDateFormat = formatedDateTime(contractData.custrecord_scv_sc_end_date);

            let currencyText = contractData.custrecord_scv_sc_currency_text;
            if (currencyText === 'VND') {
                currencyText = 'Việt Nam Đồng';
            }

            return {
                urlTemplate: `https://${baseUrl}${urlTemplate}`,
                // Contract info
                name: contractData.name,
                custrecord_scv_sc_date: scDateFormat,
                custrecord_scv_sc_start_date: startDateFormat,
                custrecord_scv_sc_end_date: endDateFormat,
                custrecord_scv_sc_vp: contractData.custrecord_scv_sc_vp,
                custrecord_scv_sc_cc: contractData.custrecord_scv_sc_cc_text,
                // Bên A - Customer info
                custentity_scv_legal_name: customerInfo.legalName,
                custrecord_scv_sc_address: contractData.custrecord_scv_sc_address,
                phone: customerInfo.phone,
                custentity_scv_tax_number: customerInfo.taxNumber,
                custrecord_scv_sc_dai_dien: contractData.custrecord_scv_sc_dai_dien,
                custrecord_scv_sc_chuc_vu: contractData.custrecord_scv_sc_chuc_vu,
                // Bên B - Subsidiary info
                legalName: subInfo.legalName?.toUpperCase(),
                custrecord_scv_sc_sub: contractData.custrecord_scv_sc_sub_text?.toUpperCase(),
                mainaddress_text: subInfo.mainAdress,
                custrecord_scv_sub_phone: subInfo.subPhone,
                fax: subInfo.fax,
                federalidnumber: subInfo.federalidnumber,
                custrecord_scv_sc_sub_dd: contractData.custrecord_scv_sc_sub_dd,
                custrecord_scv_sc_sub_cv: contractData.custrecord_scv_sc_sub_cv,
                custrecord_scv_sc_tk: contractData.custrecord_scv_sc_tk,
                custrecord_scv_sc_mt: contractData.custrecord_scv_sc_mt,
                // Điều 1 - Items
                custrecord_scv_sc_dieu_1: contractData.custrecord_scv_sc_dieu_1,
                items: items,
                tongTien: totalAmount.toLocaleString('en-US'),
                amountWord: amountWord,
                // Điều 2 - Thanh toán
                custrecord_scv_sc_pay_method: contractData.custrecord_scv_sc_pay_method_text,
                custrecord_scv_sc_currency: currencyText,
                custrecord_scv_sc_term_text: contractData.custrecord_scv_sc_term_text,
                custrecord_scv_sc_ho_so_tt: contractData.custrecord_scv_sc_ho_so_tt,
                // Điều 3
                custrecord_scv_scda_dieu3: contractData.custrecord_scv_scda_dieu3,
                // Điều 4 - Giao nhận hàng hóa
                custrecord_scv_sc_thoi_han_gh: contractData.custrecord_scv_sc_thoi_han_gh_text,
                custrecord_scv_sc_thoi_han_gh: contractData.custrecord_scv_sc_du_thgh,
                custrecord_scv_sc_ddgh: contractData.custrecord_scv_sc_ddgh,
                custrecord_scv_sc_term_ptvc: contractData.custrecord_scv_sc_term_ptvc,
                // Điều 5-8
                custrecord_scv_scda_dieu5: contractData.custrecord_scv_scda_dieu5,
                custrecord_scv_scda_dieu6: contractData.custrecord_scv_scda_dieu6,
                custrecord_scv_scda_dieu7: contractData.custrecord_scv_scda_dieu7,
                custrecord_scv_scda_dieu8: contractData.custrecord_scv_scda_dieu8,
                // Footer
                custrecord_scv_sc_footer: contractData.custrecord_scv_sc_footer,
            };
        }

        const getContractData = (recSC) => {
            return {
                name: reText(recSC.getValue('name')),
                custrecord_scv_sc_date: reText(recSC.getValue('custrecord_scv_sc_date')),
                custrecord_scv_sc_vp: reText(recSC.getValue('custrecord_scv_sc_vp')),
                custrecord_scv_sc_address: reText(recSC.getValue('custrecord_scv_sc_address')),
                custrecord_scv_sc_dai_dien: reText(recSC.getValue('custrecord_scv_sc_dai_dien')),
                custrecord_scv_sc_chuc_vu: reText(recSC.getValue('custrecord_scv_sc_chuc_vu')),
                custrecord_scv_sc_sub_text: reText(recSC.getText('custrecord_scv_sc_sub')),
                custrecord_scv_sc_sub_dd: reText(recSC.getValue('custrecord_scv_sc_sub_dd')),
                custrecord_scv_sc_sub_cv: reText(recSC.getValue('custrecord_scv_sc_sub_cv')),
                custrecord_scv_sc_tk: reText(recSC.getValue('custrecord_scv_sc_tk')),
                custrecord_scv_sc_mt: reText(recSC.getValue('custrecord_scv_sc_mt')),
                custrecord_scv_sc_start_date: reText(recSC.getValue('custrecord_scv_sc_start_date')),
                custrecord_scv_sc_end_date: reText(recSC.getValue('custrecord_scv_sc_end_date')),
                custrecord_scv_sc_cc_text: reText(recSC.getText('custrecord_scv_sc_cc')),
                // DA specific fields
                custrecord_scv_sc_pay_method_text: reText(recSC.getText('custrecord_scv_sc_pay_method')),
                custrecord_scv_sc_currency_text: reText(recSC.getText('custrecord_scv_sc_currency')),
                custrecord_scv_sc_term_text: reText(recSC.getValue('custrecord_scv_sc_term_text')),
                custrecord_scv_sc_ho_so_tt: reText(recSC.getValue('custrecord_scv_sc_ho_so_tt')),
                custrecord_scv_scda_dieu3: reText(recSC.getValue('custrecord_scv_scda_dieu3')),
                custrecord_scv_sc_thoi_han_gh: reText(recSC.getValue('custrecord_scv_sc_thoi_han_gh')),
                custrecord_scv_sc_thoi_han_gh_text: reText(recSC.getText('custrecord_scv_sc_thoi_han_gh')),
                custrecord_scv_sc_du_thgh: reText(recSC.getText('custrecord_scv_sc_du_thgh')),
                custrecord_scv_sc_ddgh: reText(recSC.getValue('custrecord_scv_sc_ddgh')),
                // custrecord_scv_sc_term_ptvc: reText(recSC.getValue('custrecord_scv_sc_term_ptvc')),
                custrecord_scv_sc_term_ptvc: reText(recSC.getValue('custrecord_scv_sc_term_da_ptvc')),
                custrecord_scv_sc_dieu_1: reText(recSC.getValue('custrecord_scv_sc_dieu_1')),
                custrecord_scv_scda_dieu5: reText(recSC.getValue('custrecord_scv_scda_dieu5')),
                custrecord_scv_scda_dieu6: reText(recSC.getValue('custrecord_scv_scda_dieu6')),
                custrecord_scv_scda_dieu7: reText(recSC.getValue('custrecord_scv_scda_dieu7')),
                custrecord_scv_scda_dieu8: reText(recSC.getValue('custrecord_scv_scda_dieu8')),
                custrecord_scv_sc_footer: reText(recSC.getValue('custrecord_scv_sc_footer')),
            };
        }

        const getValueFromCustomer = (recSC) => {
            let cusObj = {};
            const customerId = recSC.getValue('custrecord_scv_sc_cus');
            if (!customerId) return { legalName: '', phone: '', taxNumber: '' };

            const cusValue = search.lookupFields({
                type: search.Type.CUSTOMER,
                id: customerId,
                columns: ['custentity_scv_legal_name', 'phone', 'custentity_scv_tax_number']
            });

            cusObj = {
                legalName: (cusValue.custentity_scv_legal_name || '').toUpperCase(),
                phone: cusValue.phone || '',
                taxNumber: cusValue.custentity_scv_tax_number || ''
            };

            return cusObj;
        }

        const getValueFromSubsidiary = (recSC) => {
            let subObj = {};
            const subId = recSC.getValue('custrecord_scv_sc_sub');
            if (!subId) return { subPhone: '', mainAdress: '', fax: '', federalidnumber: '', legalName: '' };

            const subValue = record.load({
                type: 'subsidiary',
                id: subId
            });

            subObj = {
                subPhone: subValue.getValue('custrecord_scv_sub_phone'),
                mainAdress: subValue.getValue('mainaddress_text'),
                fax: subValue.getValue('fax'),
                federalidnumber: subValue.getValue('federalidnumber'),
                legalName: subValue.getValue('legalname'),
            };

            return subObj;
        }

        const getDataItemsFromSO = (recSO) => {
            const items = [];
            let totalAmount = 0;
            const lineCount = recSO.getLineCount('item');

            for (let i = 0; i < lineCount; i++) {
                const stt = i + 1;
                const description = recSO.getSublistValue({ sublistId: 'item', fieldId: 'description', line: i });
                const units = recSO.getSublistValue({ sublistId: 'item', fieldId: 'units_display', line: i });
                const quantity = recSO.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i });
                const grossamt = recSO.getSublistValue({ sublistId: 'item', fieldId: 'grossamt', line: i });

                const donGia = quantity ? (grossamt / quantity) : 0;
                totalAmount += parseFloat(grossamt) || 0;

                items.push({
                    stt: stt,
                    quyCach: description || '',
                    dvt: units || '',
                    soLuong: quantity ? Number(quantity).toLocaleString('en-US') : '',
                    donGia: donGia ? formatCurrency(donGia) : '',
                    thanhTien: grossamt ? formatCurrency(grossamt) : '',
                });
            }

            return { items, totalAmount };
        }

        const formatCurrency = (number) => {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                currencyDisplay: 'code',
                trailingZeroDisplay: 'stripIfInteger'
            })
                .format(number)
                .replace('USD', '')
                .trim();
        }

        const formatedDateTime = (date) => {
            if (!date) return '';
            const dateObj = new Date(date);
            return dateObj.toLocaleDateString('vi-VN');
        }

        const reText = (text, newText = '') => is(text) ? text : newText;

        const is = value => value !== undefined && value !== null && value !== ''
            ? Array.isArray(value) ? (value.length > 0) : true
            : false;

        return { onRequest }

    });
