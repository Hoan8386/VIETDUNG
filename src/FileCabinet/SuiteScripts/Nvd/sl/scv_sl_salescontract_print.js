/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/file', 'N/record', 'N/search', 'N/url', 'N/runtime', 'N/format/i18n'],

    (file, record, search, url, runtime, format) => {
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
                log.error('recordId, exportType', `${recordId}, ${exportType}`);
                let params = scriptContext.request.parameters;
                let objData;

                switch (exportType) {
                    case 'word':
                        objData = getDataHopDongMuaBan(recordId, params.isBltt);
                        scriptContext.response.write(JSON.stringify(objData));
                        break;

                    case 'excel':
                        objData = getDataPhieuKTTTHD(recordId, params.isBltt);
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
                'custrecord_scv_sc_tknh.custrecord_scv_beb_bank_banranch',
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
                'custrecord_scv_sc_ddgh'
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

        const getDataHopDongMuaBan = (idSalesContract, isBltt) => {
            let columnsSCSearch = (isBltt === 'T') ?
                ([...COLUMN_SALES_CONTRACT_IS_BLTT, ...COLUMNS_SALES_CONTRACT])
                :
                ([...COLUMN_SALES_CONTRACT_NOT_BLTT, ...COLUMNS_SALES_CONTRACT]);

            let lkFieldsSalesContract = search.lookupFields({
                type: 'customrecord_scv_sales_contract',
                id: idSalesContract,
                columns: columnsSCSearch//COLUMNS_SALES_CONTRACT
            });

            let recSalesContract = record.load({
                type: 'customrecord_scv_sales_contract',
                id: idSalesContract,
                isDynamic: false
            });

            let objDataSubsidiary = getDataSubsidiary(lkFieldsSalesContract.custrecord_scv_sc_sub[0]?.value);
            let dieuKhoan = getDataDieuKhoan(lkFieldsSalesContract, isBltt);


            //sửa : thêm baseUrl 9/1/2025 - Thành
            let baseUrl = url.resolveDomain({hostType: url.HostType.APPLICATION, accountId: runtime.accountId});
            //
            let tonggiatri = {tonggiatri: 0};
            let hasItems = {hasItems: false}
            let items = getDataItems(recSalesContract, tonggiatri, hasItems);
            let custrecord_scv_sc_total_amt = recSalesContract.getValue('custrecord_scv_sc_total_amt');
            let urlTemplate = getUrlTemplate(isBltt, hasItems.hasItems);
            let custbody_scv_amount_in_word = format.spellOut({
                number: Number( (tonggiatri.tonggiatri).toFixed(0) ),
                locale: "vi_VN"
            });
            let custrecord_scv_beb_bank_banranch = lkFieldsSalesContract['custrecord_scv_sc_tknh.custrecord_scv_beb_bank_banranch'] ?
                                                                                ` - ${lkFieldsSalesContract['custrecord_scv_sc_tknh.custrecord_scv_beb_bank_banranch']}` : ''

            let custrecord_scv_sc_currency =
                lkFieldsSalesContract['custrecord_scv_sc_currency'][0]?.text === 'VND'
                ? 'Việt Nam Đồng'
                : lkFieldsSalesContract['custrecord_scv_sc_currency'][0]?.text ;

            return {
                headerlegalname: objDataSubsidiary.legalname.toUpperCase().replace('TNHH', 'TNHH\n').replace('CP', 'CP\n'),
                name: lkFieldsSalesContract.name,
                custrecord_scv_sc_date: lkFieldsSalesContract.custrecord_scv_sc_date,
                legalname: objDataSubsidiary.legalname.toUpperCase(),
                custentity_scv_legal_name: String(lkFieldsSalesContract['custrecord_scv_sc_cus.custentity_scv_legal_name']).toUpperCase(),
                custrecord_scv_sc_address: lkFieldsSalesContract.custrecord_scv_sc_address.replace('Viet Nam', '').replace(/[\n\r]+/g, ' '),
                custrecord_scv_sc_vp: lkFieldsSalesContract.custrecord_scv_sc_vp,
                phone: lkFieldsSalesContract['custrecord_scv_sc_cus.phone'],
                custentity_scv_tax_number: lkFieldsSalesContract['custrecord_scv_sc_cus.custentity_scv_tax_number'],
                custrecord_scv_sc_dai_dien: lkFieldsSalesContract['custrecord_scv_sc_dai_dien'],
                custrecord_scv_sc_chuc_vu: lkFieldsSalesContract['custrecord_scv_sc_chuc_vu'],
                custrecord_scv_beb_bank_account: lkFieldsSalesContract['custrecord_scv_sc_tknh.custrecord_scv_beb_bank_account'],
                custrecord_scv_beb_bank_name: lkFieldsSalesContract['custrecord_scv_sc_tknh.custrecord_scv_beb_bank_name'][0]?.text,
                custrecord_scv_beb_bank_banranch: custrecord_scv_beb_bank_banranch,
                mainaddress_text: objDataSubsidiary.address,
                custrecord_scv_sub_phone: objDataSubsidiary.custrecord_scv_sub_phone,
                fax: objDataSubsidiary.fax,
                federalidnumber: objDataSubsidiary.federalidnumber,
                custrecord_scv_sc_sub_dd: lkFieldsSalesContract['custrecord_scv_sc_sub_dd'],
                custrecord_scv_sc_sub_cv: lkFieldsSalesContract['custrecord_scv_sc_sub_cv'],
                custrecord_scv_sc_tk: lkFieldsSalesContract['custrecord_scv_sc_tk'],
                custrecord_scv_sc_mt: lkFieldsSalesContract['custrecord_scv_sc_mt'],

                custrecord_scv_sc_dieu_1: (lkFieldsSalesContract['custrecord_scv_sc_dieu_1']),

                custrecord_scv_sc_pay_method: lkFieldsSalesContract['custrecord_scv_sc_pay_method'][0]?.text,
                custrecord_scv_sc_currency: custrecord_scv_sc_currency,//lkFieldsSalesContract['custrecord_scv_sc_currency'][0]?.text,
                custrecord_scv_sc_ho_so_tt: lkFieldsSalesContract['custrecord_scv_sc_ho_so_tt'],
                custrecord_scv_sc_tggh: lkFieldsSalesContract['custrecord_scv_sc_tggh'],
                custrecord_scv_sc_ddgh: lkFieldsSalesContract['custrecord_scv_sc_ddgh'],
                ...dieuKhoan,
                terms: lkFieldsSalesContract['custrecord_scv_sc_term_text'], //
                // ? '' : getDataPaymentTerm(lkFieldsSalesContract.custrecord_scv_sc_term[0]?.value),
                // sau sẽ điền {#terms}{data}{/terms} vào trong form word
                termText : lkFieldsSalesContract['custrecord_scv_sc_term_text'] || '',
                custrecord_scv_sc_term_ptvc : lkFieldsSalesContract['custrecord_scv_sc_term_ptvc'],
                dateFooter: recSalesContract.getValue('custrecord_scv_sc_footer')
                    // formatDateFooter(lkFieldsSalesContract.custrecord_scv_sc_date)
                ,
                urlTemplate: `https://${baseUrl}${urlTemplate}`,
                items: items,
                tonggiatri:
                // custrecord_scv_sc_total_amt,
                    formatCurrencyJapan(tonggiatri.tonggiatri),
                custbody_scv_amount_in_word: capitalize(`${custbody_scv_amount_in_word} đồng`)
            }
        }

        const getUrlTemplate = (isBltt, hasItems) => {
            return file.load({
                id: (isBltt === 'T')
                    ? ((hasItems === true) ? '../doc/scv_docx_salescontract_02.docx' : '../doc/scv_docx_salescontract_02_no_Items.docx')
                    : ((hasItems === true) ? '../doc/scv_docx_salescontract_01.docx' : '../doc/scv_docx_salescontract_01_no_Items.docx')
                ,
            }).url;
        }

        const getDataPaymentTerm = (idPaymentTerm) => {
            if (idPaymentTerm) {
                let recPayTerm = record.load({
                    type: 'customrecord_scv_cus_term',
                    id: idPaymentTerm,
                });

                let termLines = recPayTerm.getLineCount('recmachcustrecord_scv_dot_tt_parent');

                let terms = [];
                if (termLines > 0) {
                    for (let i = 0; i < termLines; i++) {
                        let line = {};
                        let custrecord_scv_dot_tt_stt = recPayTerm.getSublistValue('recmachcustrecord_scv_dot_tt_parent', 'custrecord_scv_dot_tt_stt', i);
                        let custrecord_scv_dot_tt_percent = recPayTerm.getSublistValue('recmachcustrecord_scv_dot_tt_parent', 'custrecord_scv_dot_tt_percent', i);
                        let custrecord_scv_dot_tt_amount = formatCurrencyJapan(recPayTerm.getSublistValue('recmachcustrecord_scv_dot_tt_parent', 'custrecord_scv_dot_tt_amount', i));
                        if (i === 0) {
                            line.data = `Theo các đợt cụ thể như sau: \nĐợt thanh toán ${custrecord_scv_dot_tt_stt}: ${custrecord_scv_dot_tt_percent}%, Số tiền: ${custrecord_scv_dot_tt_amount}`
                        } else {
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

        const getDataSubsidiary = (idSubsidiary) => {
            let subsidiary = {};
            if(idSubsidiary) {
                let recSubsidiary = record.load({ // federalidnumber không thể lấy từ search hay join search , address có thể lấy từ address.address
                    id: idSubsidiary,
                    type: 'subsidiary',
                });
                subsidiary.mainaddress_text = recSubsidiary.getValue('mainaddress_text').split('Việt Nam')[0]//replace('Viet Nam', '').replace(/[\r\n]+/g, ' ');
                subsidiary.federalidnumber = recSubsidiary.getValue('federalidnumber');
                subsidiary.legalname = recSubsidiary.getValue('legalname');
                subsidiary.fax = recSubsidiary.getValue('fax');
                subsidiary.custrecord_scv_sub_phone = recSubsidiary.getValue('custrecord_scv_sub_phone');

            }

            let lkfieldsSubsidiary = search.lookupFields({
                type: 'subsidiary',
                id: idSubsidiary,
                columns: ['address.address1']
            });
            subsidiary.address = lkfieldsSubsidiary['address.address1'];
            return subsidiary;
        }

        const formatCurrencyJapan = (number) => {
            return new Intl.NumberFormat('ja-JP', {
                style: 'currency',
                currency: 'JPY',
                currencyDisplay: "code"
            })
                .format(number)
                .replace("JPY", "")
                .trim();
        }

        const MONTH = {
            '01': 'Jan',
            '02': 'Feb',
            '03': 'Mar',
            '04': 'Apr',
            '05': 'May',
            '06': 'Jun',
            '07': 'Jul',
            '08': 'Aug',
            '09': 'Sep',
            '10': 'Oct',
            '11': 'Nov',
            '12': 'Dec'
        }

        const formatDateFooter = (date) => {
            let parts = date.split('/');
            let year = parts[parts.length - 1][2] + '' + parts[parts.length - 1][3];
            let month = MONTH[parts[1]];
            return `${parts[0]}-${month}-${year}`;
        }

        const getDataItems = (recSalesContract, tonggiatri, hasItems) => {
            let itemLines = recSalesContract.getLineCount('recmachcustrecord_scv_sc_d_parent');
            let items = []

            if (itemLines > 0) {
                hasItems.hasItems = true;
                for (let i = 0; i < itemLines; i++) {
                    let itemLine = {}
                    itemLine.stt = i + 1;
                    itemLine.description = getItemValue(recSalesContract, 'custrecord_scv_sc_d_quy_cach', i);
                    itemLine.unit = getItemValue(recSalesContract, 'custrecord_scv_sc_d_unit_display', i);
                    itemLine.kichthuoc = getKichThuoc(recSalesContract, i);
                    itemLine.quantity = getItemValue(recSalesContract, 'custrecord_scv_sc_d_quantity', i);
                    itemLine.dongia = getItemValue(recSalesContract, 'custrecord_scv_sc_d_rate', i);
                    itemLine.thanhtien = itemLine.quantity * itemLine.dongia;
                    tonggiatri.tonggiatri += parseFloat(itemLine.thanhtien);
                    itemLine.thanhtien = formatCurrencyJapan(itemLine.thanhtien);
                    itemLine.dongia = formatCurrencyJapan(itemLine.dongia);
                    items.push(itemLine);
                }
            }
            return items;
        }

        const getItemValue = (recSalesContract, field, line) => {
            return recSalesContract.getSublistValue({
                sublistId: 'recmachcustrecord_scv_sc_d_parent',
                fieldId: field,
                line: line,
            })
        }

        const getKichThuoc = (recSalesContract, line) => {
           let itemId = recSalesContract.getSublistValue('recmachcustrecord_scv_sc_d_parent', 'custrecord_scv_sc_d_item', line);

           if(itemId) {
               let sizeInfo = search.lookupFields({
                   type: 'item',
                   id: itemId,
                   columns: ['custitem_scv_width', 'custitem_scv_length'],
               });

               let chieudai = sizeInfo.custitem_scv_length;
               let chieurong = sizeInfo.custitem_scv_width;

               return chieurong ? (`${chieurong} x ${chieudai}`) : `${chieudai}`;
           }
        }


        //In phiếu kiểm tra TTHĐ Excel

        const COLUMNS_PHIEU_KT_TTHD = [
            'name',
            'custrecord_scv_sc_type',
            'custrecord_scv_sc_cus.custentity_scv_legal_name',
            'custrecord_scv_sc_dieu_1',
            'custrecord_scv_sc_ck',
            'custrecord_scv_sc_phi_cat',
            'custrecord_scv_sc_ht_khac',
            'custrecord_scv_sc_total_amt_vat',
            'custrecord_scv_sc_tam_ung',
            'custrecord_scv_sc_con_lai',
            'custrecord_scv_sc_so_lan_gh',
            'custrecord_scv_sc_ddgh',
            'custrecord_scv_sc_thoi_han_gh',
            'custrecord_scv_sc_font',
            'custrecord_scv_sc_format',

            'custrecord_scv_sc_so_pkt',
            'custrecord_scv_sc_dk_bo_sung_yc'
        ]

        const COLUMNS_PHIEU_KT_TTHD_BL = [
            'name',
            'custrecord_scv_sc_type',
            'custrecord_scv_sc_cus.custentity_scv_legal_name',
            'custrecord_scv_sc_dieu_1',
            'custrecord_scv_sc_ck',
            'custrecord_scv_sc_phi_cat',
            'custrecord_scv_sc_ht_khac',
            'custrecord_scv_sc_total_amt_vat',
            'custrecord_scv_sc_tam_ung',
            'custrecord_scv_sc_con_lai',

            'custrecord_scv_sc_so_pkt',

            // khác với columns của phiếu kiểm tra thông tin non BL
            'custrecord_scv_sc_bltt_tg', 'custrecord_scv_sc_bltt_gia_tri', 'custrecord_scv_sc_bltt_thoi_han',
            //
            'custrecord_scv_sc_so_lan_gh',
            'custrecord_scv_sc_ddgh',
            'custrecord_scv_sc_thoi_han_gh',
            'custrecord_scv_sc_font',
            'custrecord_scv_sc_format',
            'custrecord_scv_sc_dk_bo_sung_yc'
        ]


        const getDataPhieuKTTTHD = (idSalesContract, isBltt) => {
            let columnsSCSearch = (isBltt === 'T') ? COLUMNS_PHIEU_KT_TTHD_BL : COLUMNS_PHIEU_KT_TTHD;

            let lkFieldsSalesContract = search.lookupFields({
                type: 'customrecord_scv_sales_contract',
                id: idSalesContract,
                columns: columnsSCSearch
            });

            let urlPKTTTHD = getUrlTemplatePKTTTHD(isBltt === 'T');
            let mappedData = getMappedData(lkFieldsSalesContract, isBltt === 'T');
            return {
                mappedData: mappedData,
                filename: 'Phiếu kiểm tra thông tin hợp đồng.xlsx',
                url: urlPKTTTHD,
                exporttype : 'excel'
            };

        }

        const getUrlTemplatePKTTTHD = (isBltt) => {
            if (isBltt) {
                return file.load({id: '../xls/scv_xlsx_phieu_kiem_tra_tthd_bl.xlsx'}).url;
            }
            return file.load({id: '../xls/scv_xlsx_phieu_kiem_tra_tthd.xlsx'}).url;
        }

        const getMappedData = (lkFieldsSalesContract, isBltt) => {
            let mappedData = {}

            if (isBltt) {
                mappedData = {
                    E1: {'custrecord_scv_sc_so_pkt': lkFieldsSalesContract['custrecord_scv_sc_so_pkt']},
                    'C2': {'name': lkFieldsSalesContract['name']},
                    'C3': {'custrecord_scv_sc_type': lkFieldsSalesContract['custrecord_scv_sc_type'][0]?.text || ''},
                    'C4': {'custentity_scv_legal_name': lkFieldsSalesContract['custrecord_scv_sc_cus.custentity_scv_legal_name']},
                    'D6': {'custrecord_scv_sc_dieu_1': lkFieldsSalesContract['custrecord_scv_sc_dieu_1']},
                    'D7': {'custrecord_scv_sc_ck': lkFieldsSalesContract['custrecord_scv_sc_ck']},
                    'D8': {'custrecord_scv_sc_phi_cat': lkFieldsSalesContract['custrecord_scv_sc_phi_cat']},
                    'D9': {'custrecord_scv_sc_ht_khac': lkFieldsSalesContract['custrecord_scv_sc_ht_khac']},
                    'D10': {'custrecord_scv_sc_total_amt_vat': formatCurrency(Number(lkFieldsSalesContract['custrecord_scv_sc_total_amt_vat']))},
                    'D12': {'custrecord_scv_sc_tam_ung': formatCurrency(Number(lkFieldsSalesContract['custrecord_scv_sc_tam_ung']))},
                    'D13': {'custrecord_scv_sc_con_lai': formatCurrency(Number(lkFieldsSalesContract['custrecord_scv_sc_con_lai']))},
                    //khác so với non bltt
                    'D15': {'custrecord_scv_sc_bltt_tg': lkFieldsSalesContract['custrecord_scv_sc_bltt_tg'][0]?.text || ''},
                    'D16': {'custrecord_scv_sc_bltt_gia_tri': lkFieldsSalesContract['custrecord_scv_sc_bltt_gia_tri']},
                    'D17': {'custrecord_scv_sc_bltt_thoi_han': lkFieldsSalesContract['custrecord_scv_sc_bltt_thoi_han']},
                    //---------

                    'D19': {'custrecord_scv_sc_so_lan_gh': lkFieldsSalesContract['custrecord_scv_sc_so_lan_gh']},
                    'D20': {'custrecord_scv_sc_ddgh': lkFieldsSalesContract['custrecord_scv_sc_ddgh']},
                    'D21': {'custrecord_scv_sc_thoi_han_gh': lkFieldsSalesContract['custrecord_scv_sc_thoi_han_gh']},
                    A23 : {'custrecord_scv_sc_dk_bo_sung_yc': lkFieldsSalesContract['custrecord_scv_sc_dk_bo_sung_yc']},
                    'D25': {'custrecord_scv_sc_font': lkFieldsSalesContract['custrecord_scv_sc_font']},
                    'D26': {'custrecord_scv_sc_format': lkFieldsSalesContract['custrecord_scv_sc_format']},
                }
            } else {
                mappedData = {
                    E1: {'custrecord_scv_sc_so_pkt': lkFieldsSalesContract['custrecord_scv_sc_so_pkt']},
                    'C2': {'name': lkFieldsSalesContract['name']},
                    'C3': {'custrecord_scv_sc_type': lkFieldsSalesContract['custrecord_scv_sc_type'][0]?.text || ''},
                    'C4': {'custentity_scv_legal_name': lkFieldsSalesContract['custrecord_scv_sc_cus.custentity_scv_legal_name']},
                    'D6': {'custrecord_scv_sc_dieu_1': lkFieldsSalesContract['custrecord_scv_sc_dieu_1']},
                    'D7': {'custrecord_scv_sc_ck': lkFieldsSalesContract['custrecord_scv_sc_ck']},
                    'D8': {'custrecord_scv_sc_phi_cat': lkFieldsSalesContract['custrecord_scv_sc_phi_cat']},
                    'D9': {'custrecord_scv_sc_ht_khac': lkFieldsSalesContract['custrecord_scv_sc_ht_khac']},
                    'D10': {'custrecord_scv_sc_total_amt_vat': formatCurrency(Number(lkFieldsSalesContract['custrecord_scv_sc_total_amt_vat']))},
                    'D12': {'custrecord_scv_sc_tam_ung': formatCurrency(Number(lkFieldsSalesContract['custrecord_scv_sc_tam_ung']))},
                    'D13': {'custrecord_scv_sc_con_lai': (formatCurrency(Number(lkFieldsSalesContract['custrecord_scv_sc_con_lai'])))},

                    'D15': {'custrecord_scv_sc_so_lan_gh': lkFieldsSalesContract['custrecord_scv_sc_so_lan_gh']},
                    'D16': {'custrecord_scv_sc_ddgh': lkFieldsSalesContract['custrecord_scv_sc_ddgh']},
                    'D17': {'custrecord_scv_sc_thoi_han_gh': lkFieldsSalesContract['custrecord_scv_sc_thoi_han_gh']},
                    A19 : {'custrecord_scv_sc_dk_bo_sung_yc': lkFieldsSalesContract['custrecord_scv_sc_dk_bo_sung_yc']},
                    'D21': {'custrecord_scv_sc_font': lkFieldsSalesContract['custrecord_scv_sc_font']},
                    'D22': {'custrecord_scv_sc_format': lkFieldsSalesContract['custrecord_scv_sc_format']},
                }
            }
            log.error('mappedData', mappedData);
            return mappedData;
        }

        const capitalize = (s) => {
            return String(s[0]).toUpperCase() + String(s).slice(1);
        }

        const formatCurrency = (number) => {
            return new Intl.NumberFormat('ja-JP', {
                style: 'currency',
                currency: 'JPY',
                currencyDisplay: "code"
            })
                .format(number)
                .replace("JPY", "")
                .trim();
        }

        return {onRequest}

    });
