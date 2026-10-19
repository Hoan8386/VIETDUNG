/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/file', 'N/record', 'N/search'],

    (file, record, search) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            if (scriptContext.request.method === 'POST') {
                let recordId = scriptContext.request.parameters.recId;
                let exportType = scriptContext.request.parameters.exportType;
                let params = scriptContext.request.parameters;
                let recSalesOrd = record.load({
                    type: 'salesorder',
                    id: recordId,
                });
                let salesContractId = recSalesOrd.getValue('custbody_scv_sales_contract');

                switch (exportType) {
                    case 'word':
                        let objData = getDataHopDongMuaBan(recSalesOrd, salesContractId, params.isBltt);
                        scriptContext.response.write(JSON.stringify(objData));
                        break;

                    default:
                        throw new Error('Wrong or missing exportType parameter');
                }
            }
        }

        const COLUMNS_SALES_CONTRACT =
            [
                'name',
                'custrecord_scv_sc_date',
                'custrecord_scv_sc_cus.custentity_scv_legal_name',
                'custrecord_scv_sc_address',
                'custrecord_scv_sc_vp',
                'custrecord_scv_sc_cus.phone',
                'custrecord_scv_sc_cus.custentity_scv_tax_number',
                'custrecord_scv_sc_dai_dien',
                'custrecord_scv_sc_chuc_vu',
                'custrecord_scv_sc_tknh.custrecord_scv_beb_bank_account',
                'custrecord_scv_sc_tknh.custrecord_scv_beb_bank_name',
                'custrecord_scv_sc_sub',
                'custrecord_scv_sc_sub_dd',
                'custrecord_scv_sc_sub_cv',
                'custrecord_scv_sc_tk',
                'custrecord_scv_sc_mt',
                'custrecord_scv_sc_dieu_1',
                'custrecord_scv_sc_pay_method',
                'custrecord_scv_sc_currency',

                'custrecord_scv_sc_term',
                'custrecord_scv_sc_term_text',
                'custrecord_scv_sc_term_ptvc',

                'custrecord_scv_sc_tggh',
                'custrecord_scv_sc_ddgh',
                'custrecord_scv_sc_footer'
            ];

        const COLUMN_SALES_CONTRACT_NOT_BLTT = [
            'custrecord_scv_sc_ho_so_tt',
            'custrecord_scv_sc_dieu_4',
            'custrecord_scv_sc_dieu_4_b',
            'custrecord_scv_sc_dieu_5',
            'custrecord_scv_sc_dieu_6',
            'custrecord_scv_sc_dieu_7'
        ]

        const COLUMN_SALES_CONTRACT_IS_BLTT = [
            'custrecord_scv_sc_bao_lanh',
            'custrecord_scv_sc_bl_gn',
            'custrecord_scv_sc_dieu_5_bl',
            'custrecord_scv_sc_dieu_6_bl',
            'custrecord_scv_sc_dieu_7_bl',
            'custrecord_scv_sc_dieu_8_bl'
        ]

        const getDataHopDongMuaBan = (recSO, scId, isBltt) => {
            let dataContract = getDataContract(recSO, scId, isBltt);
            let custbody_scv_amount_in_word = normalizeText(
                (recSO.getValue('custbody_scv_amount_in_word') || '').replace('./','')
            );
            let tonggiatri = {tonggiatri: 0};
            let items = getDataItems(recSO, tonggiatri);

            return {
                ...dataContract,
                items: items,
                tonggiatri: formatCurrency( tonggiatri.tonggiatri),
                custbody_scv_amount_in_word: custbody_scv_amount_in_word
            }
        }

        const getDataContract = (recSO, scId, isBltt) => {
            let columnsSo = (isBltt === 'T') ?
                ([...COLUMNS_SALES_CONTRACT, ...COLUMN_SALES_CONTRACT_IS_BLTT])
                :
                ([...COLUMNS_SALES_CONTRACT, ...COLUMN_SALES_CONTRACT_NOT_BLTT]);

            let lkFieldsSalesContract = search.lookupFields({
                type: 'customrecord_scv_sales_contract',
                id: scId,
                columns: columnsSo
            });

            let recSubsidiary = getDataSubsidiary(lkFieldsSalesContract.custrecord_scv_sc_sub[0].value);
            let dieuKhoan = getDataDieuKhoan(lkFieldsSalesContract, isBltt);
            let urlTemplate = getUrlTemplate(isBltt);

            let custrecord_scv_sc_currency =
                lkFieldsSalesContract['custrecord_scv_sc_currency'][0]?.text === 'VND'
                    ? 'Việt Nam Đồng'
                    : lkFieldsSalesContract['custrecord_scv_sc_currency'][0]?.text ;

            return {
                headerlegalname : recSubsidiary.legalname.toUpperCase().replace('TNHH','TNHH\n').replace('CP','CP\n'),
                name: lkFieldsSalesContract.name,
                custrecord_scv_sc_date: lkFieldsSalesContract.custrecord_scv_sc_date,
                legalname: recSubsidiary.legalname.toUpperCase(),
                custentity_scv_legal_name: String(lkFieldsSalesContract['custrecord_scv_sc_cus.custentity_scv_legal_name']).toUpperCase(),
                custrecord_scv_sc_address: lkFieldsSalesContract.custrecord_scv_sc_address.replace('Viet Nam','').replace(/[\n\r]+/g,' '),
                custrecord_scv_sc_vp: lkFieldsSalesContract.custrecord_scv_sc_vp,
                phone: lkFieldsSalesContract['custrecord_scv_sc_cus.phone'],
                custentity_scv_tax_number: lkFieldsSalesContract['custrecord_scv_sc_cus.custentity_scv_tax_number'],
                custrecord_scv_sc_dai_dien: lkFieldsSalesContract['custrecord_scv_sc_dai_dien'],
                custrecord_scv_sc_chuc_vu: lkFieldsSalesContract['custrecord_scv_sc_chuc_vu'],
                custrecord_scv_beb_bank_account: lkFieldsSalesContract['custrecord_scv_sc_tknh.custrecord_scv_beb_bank_account'],
                custrecord_scv_beb_bank_name: lkFieldsSalesContract['custrecord_scv_sc_tknh.custrecord_scv_beb_bank_name'][0]?.text,
                mainaddress_text: recSubsidiary.address,
                custrecord_scv_sub_phone: recSubsidiary.custrecord_scv_sub_phone,
                fax: recSubsidiary.fax,
                federalidnumber: recSubsidiary.federalidnumber,
                custrecord_scv_sc_sub_dd: lkFieldsSalesContract['custrecord_scv_sc_sub_dd'],
                custrecord_scv_sc_sub_cv: lkFieldsSalesContract['custrecord_scv_sc_sub_cv'],
                custrecord_scv_sc_tk: lkFieldsSalesContract['custrecord_scv_sc_tk'],
                custrecord_scv_sc_mt: lkFieldsSalesContract['custrecord_scv_sc_mt'],
                custrecord_scv_sc_dieu_1: lkFieldsSalesContract['custrecord_scv_sc_dieu_1'],
                custrecord_scv_sc_pay_method: lkFieldsSalesContract['custrecord_scv_sc_pay_method'][0]?.text,
                custrecord_scv_sc_currency: custrecord_scv_sc_currency,
                custrecord_scv_sc_ho_so_tt: lkFieldsSalesContract['custrecord_scv_sc_ho_so_tt'],
                custrecord_scv_sc_tggh: lkFieldsSalesContract['custrecord_scv_sc_tggh'],
                custrecord_scv_sc_ddgh: lkFieldsSalesContract['custrecord_scv_sc_ddgh'],
               ...dieuKhoan,
                terms: lkFieldsSalesContract['custrecord_scv_sc_term_text'] ? '' : getDataPaymentTerm(lkFieldsSalesContract.custrecord_scv_sc_term[0]?.value),
                termText : lkFieldsSalesContract['custrecord_scv_sc_term_text'] || '',
                custrecord_scv_sc_term_ptvc : lkFieldsSalesContract['custrecord_scv_sc_term_ptvc'],
                dateFooter : lkFieldsSalesContract['custrecord_scv_sc_footer']

                    // formatDateFooter(lkFieldsSalesContract.custrecord_scv_sc_date)
                ,
                urlTemplate : urlTemplate
            }
        }

        const normalizeText = (value) => (value || '').replace(/\s+/g, ' ').trim();

        const getUrlTemplate = (isBltt) => {
            return file.load({
                id: (isBltt === 'T')
                    ? '../doc/scv_docx_salesorder_02.docx'
                    : '../doc/scv_docx_salesorder_01.docx',
            }).url;
        }

        const getDataPaymentTerm = (paymentTermId) => {
            if (paymentTermId) {
                let recPayTerm = record.load({
                    type: 'customrecord_scv_cus_term',
                    id: paymentTermId,
                });

                let termLines = recPayTerm.getLineCount('recmachcustrecord_scv_dot_tt_parent');

                let terms = [];
                if (termLines > 0) {
                    for (let i = 0; i < termLines; i++) {
                        let line = {};
                        let custrecord_scv_dot_tt_stt = recPayTerm.getSublistValue('recmachcustrecord_scv_dot_tt_parent', 'custrecord_scv_dot_tt_stt', i);
                        let custrecord_scv_dot_tt_percent = recPayTerm.getSublistValue('recmachcustrecord_scv_dot_tt_parent', 'custrecord_scv_dot_tt_percent', i);
                        let custrecord_scv_dot_tt_amount = formatCurrency(recPayTerm.getSublistValue('recmachcustrecord_scv_dot_tt_parent', 'custrecord_scv_dot_tt_amount', i));
                        if (i === 0) {
                            line.data = `Theo các đợt cụ thể như sau: \nĐợt thanh toán ${custrecord_scv_dot_tt_stt}: ${custrecord_scv_dot_tt_percent}%, Số tiền: ${custrecord_scv_dot_tt_amount}`
                        }else{
                            line.data = `\nĐợt thanh toán ${custrecord_scv_dot_tt_stt}: ${custrecord_scv_dot_tt_percent}%, Số tiền: ${custrecord_scv_dot_tt_amount}`
                        }

                        terms.push(line);
                    }

                } else {
                    terms.push({data: recPayTerm.getValue('custrecord_scv_term_nd')});
                }
                return terms;
            } else {
                return [];
            }
        }

        const getDataDieuKhoan = (lkFieldsSalesContract, isBltt) => {
            if (isBltt === 'T') {
                return {
                    custrecord_scv_sc_bao_lanh: lkFieldsSalesContract['custrecord_scv_sc_bao_lanh'],
                    custrecord_scv_sc_bl_gn: lkFieldsSalesContract['custrecord_scv_sc_bl_gn'],
                    custrecord_scv_sc_dieu_5_bl: lkFieldsSalesContract['custrecord_scv_sc_dieu_5_bl'],
                    custrecord_scv_sc_dieu_6_bl: lkFieldsSalesContract['custrecord_scv_sc_dieu_6_bl'],
                    custrecord_scv_sc_dieu_7_bl: lkFieldsSalesContract['custrecord_scv_sc_dieu_7_bl'],
                    custrecord_scv_sc_dieu_8_bl: lkFieldsSalesContract['custrecord_scv_sc_dieu_8_bl']
                }
            } else {
                return {
                    custrecord_scv_sc_ho_so_tt: lkFieldsSalesContract['custrecord_scv_sc_ho_so_tt'],
                    custrecord_scv_sc_dieu_4: lkFieldsSalesContract['custrecord_scv_sc_dieu_4'],
                    custrecord_scv_sc_dieu_4_b: lkFieldsSalesContract['custrecord_scv_sc_dieu_4_b'],
                    custrecord_scv_sc_dieu_5: lkFieldsSalesContract['custrecord_scv_sc_dieu_5'],
                    custrecord_scv_sc_dieu_6: lkFieldsSalesContract['custrecord_scv_sc_dieu_6'],
                    custrecord_scv_sc_dieu_7: lkFieldsSalesContract['custrecord_scv_sc_dieu_7'],
                }
            }
        }

        const getDataSubsidiary = (subsidiaryId) => {
            let subsidiary = {};
            if(subsidiaryId) {
                let recSubsidiary = record.load({ // federalidnumber không thể lấy từ search hay join search , address có thể lấy từ address.address
                    id: subsidiaryId,
                    type: 'subsidiary',
                });

                subsidiary.mainaddress_text = recSubsidiary.getValue('mainaddress_text').split('Việt Nam ')[0];
                subsidiary.federalidnumber = recSubsidiary.getValue('federalidnumber');
                subsidiary.legalname = recSubsidiary.getValue('legalname');
                subsidiary.fax = recSubsidiary.getValue('fax');
                subsidiary.custrecord_scv_sub_phone = recSubsidiary.getValue('custrecord_scv_sub_phone');
            }
            let lkfieldsSubsidiary = search.lookupFields({
                type: 'subsidiary',
                id: subsidiaryId,
                columns: ['address.address1']
            });
            subsidiary.address = lkfieldsSubsidiary['address.address1'];

            return subsidiary;
        }

        const getDataItems = (recSalesOrder, tonggiatri) => {
            let itemLines = recSalesOrder.getLineCount('item');
            let items = []
            for (let i = 0; i < itemLines; i++) {
                let itemLine = {}
                itemLine.stt = i + 1;
                itemLine.description = getItemValue(recSalesOrder, 'description', i);
                itemLine.unit = getItemValue(recSalesOrder, 'units_display', i);
                itemLine.kichthuoc = getKichThuoc(recSalesOrder, i);
                itemLine.quantity = getItemValue(recSalesOrder, 'quantity', i);
                itemLine.dongia = formatCurrency(getDonGia(recSalesOrder, i));
                itemLine.thanhtien =  getItemValue(recSalesOrder, 'grossamt', i);
                tonggiatri.tonggiatri += parseFloat(itemLine.thanhtien);
                itemLine.thanhtien = formatCurrency(getItemValue(recSalesOrder, 'grossamt', i) );
                items.push(itemLine);
            }

            return items;
        }

        const getItemValue = (rec, field, line) => {
            return rec.getSublistValue({
                sublistId: 'item',
                fieldId: field,
                line: line,
            })
        }

        const getKichThuoc = (recSalesOrder, line) => {
            let sizeInfo = search.lookupFields({
                type: 'item',
                id: getItemValue(recSalesOrder, 'item', line),
                columns : ['custitem_scv_width', 'custitem_scv_length' ],
            });

            let chieudai = sizeInfo.custitem_scv_length;
            let chieurong = sizeInfo.custitem_scv_width;
            let kichThuoc = [chieurong, chieudai].filter(Boolean);

            return kichThuoc.join(' x ');
        }

        const getDonGia = (recSalesOrder, line) => {
            let grossamt = getItemValue(recSalesOrder, 'grossamt', line);
            let quantity = getItemValue(recSalesOrder, 'quantity', line);

            return (grossamt / quantity).toFixed(2);
        }

        const formatCurrency = (number) => {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                currencyDisplay: "code",
                trailingZeroDisplay: 'stripIfInteger'
            })
                .format(number)
                .replace("USD", "")
                .trim();
        }

        const MONTH = {
            '01' : 'Jan',
            '02' : 'Feb',
            '03' : 'Mar',
            '04' : 'Apr',
            '05' : 'May',
            '06' : 'Jun',
            '07' : 'Jul',
            '08' : 'Aug',
            '09' : 'Sep',
            '10' : 'Oct',
            '11' : 'Nov',
            '12' : 'Dec'
        }

        const formatDateFooter = (date) => {
            let parts = date.split('/');
            let year = parts[parts.length - 1][2] + '' + parts[parts.length - 1][3];
            let month = MONTH[parts[1]];
            return `${parts[0]}-${month}-${year}`;
        }

        return {onRequest}

    });
