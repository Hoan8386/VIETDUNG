/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/file', 'N/url', 'N/record', 'N/render', 'N/runtime', '../common/scv_common_pdf', 'N/search',  '../lib/scv_lib_amount_in_word',],
    
    (file, url, record, render, runtime, comPdf, search, libAmount) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            let parameters = scriptContext.request.parameters;
            let recordId = parameters.recId;
            let exportType = parameters.exportType;

            if (scriptContext.request.method === "GET" && exportType === 'pdf') {
                let pdfFile = buildPdfFile(parameters);
                scriptContext.response.writeFile(pdfFile, true);
            } else if (scriptContext.request.method === "POST"  && exportType === 'word') {
                let {vObjBody} = getDatasSaleContract(parameters);
                scriptContext.response.write(JSON.stringify(vObjBody));
            }
        }


        const getDatasSaleContract = (parameters) => {
            let baseUrl;
            let urlTemplate;
            let rec;
            let lfSourceRecord = [];
            rec = record.load({
                type: parameters.recType,
                id: parameters.recId
            })
            if (parameters.exportType === 'word') {
                lfSourceRecord = [
                    'name', 'custrecord_scv_sc_date', 'custrecord_scv_sc_vp', 'custrecord_scv_sc_address', 'custrecord_scv_sc_dai_dien',
                    'custrecord_scv_sc_chuc_vu', 'custrecord_scv_sc_tknh', 'custrecord_scv_sc_sub', 'custrecord_scv_sc_sub_dd', 'custrecord_scv_sct_dieu1',
                    'custrecord_scv_sc_sub_cv', 'custrecord_scv_sc_tk', 'custrecord_scv_sc_mt', 'custrecord_scv_sc_start_date', 'custrecord_scv_sc_end_date',
                    'custrecord_scv_sc_cc'
                ]
                if (parameters.isDa === 'F') {
                    lfSourceRecord = [
                        ...lfSourceRecord,
                        'custrecord_scv_sct_dieu2',
                        'custrecord_scv_sct_dieu3',
                        'custrecord_scv_sct_dieu4',
                        'custrecord_scv_sct_dieu5',
                        'custrecord_scv_sct_dieu6',
                        'custrecord_scv_sct_dieu7',
                        'custrecord_scv_sct_dieu8',
                        'custrecord_scv_sc_footer'
                    ]
                } else {
                    lfSourceRecord = [
                        ...lfSourceRecord,
                        'custrecord_scv_sc_pay_method',
                        'custrecord_scv_sc_currency',
                        'custrecord_scv_sc_term_text',
                        'custrecord_scv_sc_ho_so_tt',
                        'custrecord_scv_scda_dieu3',
                        'custrecord_scv_sc_thoi_han_gh',
                        'custrecord_scv_sc_du_thgh',
                        'custrecord_scv_sc_ddgh',
                        'custrecord_scv_sc_term_ptvc',
                        'custrecord_scv_sc_term_da_ptvc',
                        'custrecord_scv_sc_dieu_1',
                        'custrecord_scv_scda_dieu5',
                        'custrecord_scv_scda_dieu6',
                        'custrecord_scv_scda_dieu7',
                        'custrecord_scv_scda_dieu8',
                        'custrecord_scv_sc_footer',
                        'custentity_scv_position_st',
                    ]
                }
                baseUrl = url.resolveDomain({hostType: url.HostType.APPLICATION, accountId: runtime.accountId});
                urlTemplate = getUrlTemplate(parameters.isDa);
            }
            let {value: vObjBody, text: textBody} = getBodyFieldsRecord(rec, lfSourceRecord);
            let customerInfo = getValueFromCustomer(rec);
            let subInfo = getValueFromSubsidiary(rec);

            //format datetime
            const scDate = vObjBody.custrecord_scv_sc_date;
            const startDate = vObjBody.custrecord_scv_sc_start_date;
            const endDate = vObjBody.custrecord_scv_sc_end_date;
            const scDateFormat = formatedDateTime(scDate);
            const startDateFormat = formatedDateTime(startDate);
            const endDateFormat = formatedDateTime(endDate);

            if (textBody.custrecord_scv_sc_currency === 'VND') {
                textBody.custrecord_scv_sc_currency = 'Việt Nam Đồng';
            }

            //Get items from line
            let {items, totalAmount} = getDataItems(rec);

            const amountWord = totalAmount ? libAmount.DocTienBangChu
            (totalAmount, 'VND') : ''

            vObjBody = {
                ...vObjBody,
                urlTemplate: `https://${baseUrl}${urlTemplate}`,
                custentity_scv_legal_name: customerInfo.legalName,
                custrecord_scv_sc_date: scDateFormat,
                custrecord_scv_sc_start_date: startDateFormat,
                custrecord_scv_sc_end_date: endDateFormat,
                custrecord_scv_sc_cc: textBody.custrecord_scv_sc_cc,
                phone: customerInfo.phone,
                custentity_scv_tax_number: customerInfo.taxNumber,
                mainaddress_text: subInfo.mainAdress,
                custrecord_scv_sub_phone: subInfo.subPhone,
                fax: subInfo.fax,
                federalidnumber: subInfo.federalidnumber,
                legalName: subInfo.legalName?.toUpperCase(),
                custrecord_scv_sc_sub: textBody.custrecord_scv_sc_sub?.toUpperCase(),
                custrecord_scv_sc_pay_method: textBody.custrecord_scv_sc_pay_method,
                custrecord_scv_sc_currency: textBody.custrecord_scv_sc_currency,
                custrecord_scv_sc_thoi_han_gh: textBody.custrecord_scv_sc_du_thgh,
                custrecord_scv_sc_term_ptvc: textBody.custrecord_scv_sc_term_da_ptvc,
                items: items,
                amountWord,
                tongTien: totalAmount.toLocaleString('en-US'),
            }
            return {
                rec,
                customerInfo,
                subInfo,
                vObjBody,
                items,
                amountWord,
                totalAmount: totalAmount.toLocaleString('en-US')
            }
        }


        const buildPdfFile = (parameters) => {
            const objRender = comPdf.initTemplateRender(parameters.templateid);
            const btnType = parameters.btnType;
            const {rec, customerInfo, subInfo, items, totalAmount, amountWord} = getDatasSaleContract(parameters);
            objRender.addRecord('record', rec);
            comPdf.addFontVietnamese(objRender);
            objRender.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: "dataJson",
                data: {
                    btnType,
                    customerInfo,
                    subInfo,
                    items,
                    totalAmount,
                    amountWord
                }
            });
            return objRender.renderAsPdf();
        }

        const getDataItems = (rec) => {
            const items = [];
            let totalAmount = 0;
            const lineName = 'recmachcustrecord_scv_sc_d_parent';
            const lineCount = rec.getLineCount(lineName);
            for (let i = 0; i < lineCount; i++) {
                const stt = i + 1;
                const custrecord_scv_sc_d_quy_cach = rec.getSublistValue(lineName, 'custrecord_scv_sc_d_quy_cach', i);
                const custrecord_scv_sc_d_unit = rec.getSublistValue(lineName, 'custrecord_scv_sc_d_unit', i);
                const custrecord_scv_sc_d_quantity = rec.getSublistValue(lineName, 'custrecord_scv_sc_d_quantity', i);
                const custrecord_scv_sc_d_rate = rec.getSublistValue(lineName, 'custrecord_scv_sc_d_rate', i);
                const custrecord_scv_sc_d_tax = rec.getSublistText(lineName, 'custrecord_scv_sc_d_tax', i);

                const amount = custrecord_scv_sc_d_quantity * Number(custrecord_scv_sc_d_rate);
                totalAmount += amount;

                items.push({
                    stt: stt,
                    quyCach: custrecord_scv_sc_d_quy_cach,
                    dvt: custrecord_scv_sc_d_unit,
                    soLuong: custrecord_scv_sc_d_quantity.toLocaleString('en-US'),
                    donGia: custrecord_scv_sc_d_rate.toLocaleString('en-US'),
                    custrecord_scv_sc_d_tax: custrecord_scv_sc_d_tax,
                    thanhTien: amount.toLocaleString('en-US'),
                });
            }
            return {items, totalAmount}
        }

        const getValueFromCustomer = (rec) => {
            let cusObj = {};
            const customerId = rec.getValue('custrecord_scv_sc_cus');
            const cusValue = search.lookupFields({
                type: search.Type.CUSTOMER,
                id: customerId,
                columns: ['custentity_scv_legal_name', 'phone', 'custentity_scv_tax_number']
            })
            cusObj = {
                legalName: cusValue.custentity_scv_legal_name.toUpperCase() || '',
                phone: cusValue.phone || '',
                taxNumber: cusValue.custentity_scv_tax_number || ''
            }

            return cusObj;
        }

        const getValueFromSubsidiary = (rec) => {
            let subObj = {};
            const subId = rec.getValue('custrecord_scv_sc_sub');
            const subValue = record.load({
                type: 'subsidiary',
                id: subId
            })
            subObj = {
                subPhone: subValue.getValue('custrecord_scv_sub_phone'),
                mainAdress: subValue.getValue('mainaddress_text'),
                fax: subValue.getValue('fax'),
                federalidnumber: subValue.getValue('federalidnumber'),
                legalName: subValue.getValue('legalname'),
            }
            return subObj;
        }

        const getBodyFieldsRecord = ( mainRecord, listBodyFields ) => listBodyFields.reduce( (list, field) => ({
                value : {
                    ...list.value,
                    [field] : reText(mainRecord.getValue(field))
                },
                text : {
                    ...list.text,
                    [field]: reText(mainRecord.getText(field))
                }
            })
            ,
            {value : {}, text : {}}
        )

        const reText =  (text, newText = "") => is(text) ? text : newText ;

        const is = value => value !== undefined && value !== null && value !== ''
            ?
            Array.isArray(value)
                ?
                (value.length > 0)
                : true
            :
            false;

        const getUrlTemplate = (type) => {
            return file.load(type === 'F' ? '../doc/scv_docx_sc_hdnt.docx' : '../doc/scv_docx_HDMB_DA.docx').url;
        }

        const formatedDateTime = (date) => {
            const dateObj = new Date(date);
            return dateObj.toLocaleDateString('vi-VN');
        }

        const toInteger = (str) => {
            if(!str) return;
            return Number(str.replace(/,/g, '').split('.')[0]);
        }

        return {onRequest}

    });
