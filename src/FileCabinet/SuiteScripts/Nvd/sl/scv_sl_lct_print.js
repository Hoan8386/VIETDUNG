/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record','N/search', 'N/file'],

    (record, search, file) => {

        const TemplateLenhChuyenTien = {
            MB: '139',
            SCB: '138',
            VCB: '140'
        }
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            let parameters = scriptContext.request.parameters;
            let response = scriptContext.response;

            let lkFieldsTemplate = search.lookupFields({
                type: parameters.rectype, id: parameters.recid, columns: ['account.custrecord_scv_acc_lct_template']
            });
            log.error('lkFieldsTemplate', lkFieldsTemplate);
            if (scriptContext.request.method === 'POST') {
                let objResponse = {};
                try {
                    switch (lkFieldsTemplate['account.custrecord_scv_acc_lct_template'][0]?.value) {
                        case TemplateLenhChuyenTien.MB:
                            objResponse = getDataLctMb(parameters);
                            break;
                        case TemplateLenhChuyenTien.SCB:
                            objResponse = getDataLctScb(parameters);
                            break;
                        case TemplateLenhChuyenTien.VCB:
                            objResponse = getDataLctVcb(parameters);
                            break;
                        default:
                            objResponse = {error: 'Template không hợp lệ'};
                            break;
                    }
                } catch (e) {
                    throw e;
                }

                response.write(JSON.stringify(objResponse));
            }else if(scriptContext.request.method === 'GET') {
                try{

                }catch(e){

                }
            }
        }

        const COLUMNSMB = [
            'currency', 'total', 'memo',
            'custbody_scv_amount_in_word',
            'account.custrecord_scv_acc_bank_account_name',
            'subsidiary.custrecord_scv_sub_legalname_eng','subsidiary.custrecord_scv_sub_representative',
            'subsidiary.custrecord_scv_sub_address_en',
            'account.custrecord_scv_acc_bank_acc',
            'custbody_scv_bankname',
            'custbody_scv_beneficiary_bank.custrecord_scv_beb_bank_swift',
            'custbody_scv_beneficiary_bank.custrecord_scv_beb_bank_address',
            'custbody_scv_beneficiary', 'custbody_scv_bankaccount', 'entity','custbody_scv_beneficiary_entity']

        const getDataLctMb = (parameters) => {
            let lkFieldsLct = search.lookupFields({
                type: parameters.rectype,
                id: parameters.recid,
                columns: COLUMNSMB
            });
            // thêm field add sau
            let recVendorPrepayment = record.load({
                type: parameters.rectype,
                id: parameters.recid,
            });
// -----
//             let address = getEntityAddress(lkFieldsLct);
            let address = getCustomEntityAddress(lkFieldsLct);

            return {
                filename: 'LCT MB.xlsx',
                templatetype : 'excel',
                url: file.load({id: '../xls/scv_xlsx_lct_mb.xlsx'}).url,
                mappeddata: {
                    J9: {'currency': lkFieldsLct.currency[0].text || ' '},
                    // R9: {'total': formatCurrency(lkFieldsLct.total) || recVendorPrepayment.getValue('payment')},
                    R9: {'total': formatCurrency( recVendorPrepayment.getValue('payment'))},
                    J10: {'custbody_scv_amount_in_word': lkFieldsLct['custbody_scv_amount_in_word'] || ' '},
                    J12: {'custrecord_scv_acc_bank_account_name': lkFieldsLct['subsidiary.custrecord_scv_sub_legalname_eng'] || ' '},
                    O13: {'custrecord_scv_sub_address_en': lkFieldsLct['subsidiary.custrecord_scv_sub_address_en'] || ' '},
                    J15: {'custrecord_scv_acc_bank_acc': lkFieldsLct['account.custrecord_scv_acc_bank_acc'] || ' '},
                    J18: {'custbody_scv_bankname': lkFieldsLct['custbody_scv_bankname'] || ' '},
                    AA18: {'custrecord_scv_beb_bank_swift': lkFieldsLct['custbody_scv_beneficiary_bank.custrecord_scv_beb_bank_swift'] || ' '},
                    J21: {'custrecord_scv_beb_bank_address': lkFieldsLct['custbody_scv_beneficiary_bank.custrecord_scv_beb_bank_address'] || ' '},
                    J22: {'custbody_scv_beneficiary': lkFieldsLct['custbody_scv_beneficiary'] || ' '},
                    AA22: {'custbody_scv_bankaccount': lkFieldsLct['custbody_scv_bankaccount'] || ' '},
                    J25: {'defaultaddress': address || ' '},
                    J27: {'memo': lkFieldsLct['memo'] || ' '},
                    J38: {'total': formatCurrency( recVendorPrepayment.getValue('payment'))},
                    J39: {'custbody_scv_amount_in_word': lkFieldsLct['custbody_scv_amount_in_word'] || ' '}
                }
            }
        }

        const COLUMNSSCB = [
            'subsidiary.custrecord_scv_sub_legalname_eng',
            'subsidiary.custrecord_scv_sub_address_en',
            'currency', 'total',
            'custbody_scv_amount_in_word_en',
            'custbody_scv_bankname',
            'custbody_scv_beneficiary_bank.custrecord_scv_beb_bank_swift',
            'custbody_scv_beneficiary_bank.custrecord_scv_beb_bank_address',
            'custbody_scv_beneficiary',
            'custbody_scv_bankaccount',
            'entity',
            'memo',
            'custbody_scv_beneficiary_entity'
        ]

        const getDataLctScb = (parameters) => {
            let lkFieldsLct = search.lookupFields({
                type: parameters.rectype,
                id: parameters.recid,
                columns: COLUMNSSCB
            });

            // thêm field add sau
            let recVendorPrepayment = record.load({
                type: parameters.rectype,
                id: parameters.recid,
            });
// -----
//             let address = getEntityAddress(lkFieldsLct);
            let address = getCustomEntityAddress(lkFieldsLct)


            return {
                filename: 'LCT SCB.xlsx',
                templatetype : 'excel',
                url: file.load({id: '../xls/scv_xlsx_lct_scb.xlsx'}).url,
                mappeddata: {
                    B6: {'custrecord_scv_sub_legalname_eng': lkFieldsLct['subsidiary.custrecord_scv_sub_legalname_eng'] || ' '},
                    B7: {'custrecord_scv_sub_address_en': lkFieldsLct['subsidiary.custrecord_scv_sub_address_en'] || ' '},
                    // G9: {'currency': lkFieldsLct.currency[0].text || ' ', 'total': formatCurrency(lkFieldsLct.total) || ' '},
                    G9: {'currency': lkFieldsLct.currency[0].text || ' ', 'total': formatCurrency(recVendorPrepayment.getValue('payment')) || ' '},
                    G11: {'custbody_scv_amount_in_word_en': lkFieldsLct['custbody_scv_amount_in_word_en'] || ' '},
                    E19: {'custbody_scv_bankname': lkFieldsLct['custbody_scv_bankname'] || ' '},
                    E22: {'custrecord_scv_beb_bank_swift': lkFieldsLct['custbody_scv_beneficiary_bank.custrecord_scv_beb_bank_swift'] || ' '},
                    E20: {'custrecord_scv_beb_bank_address': lkFieldsLct['custbody_scv_beneficiary_bank.custrecord_scv_beb_bank_address'] || ' '},
                    E24: {'custbody_scv_beneficiary': lkFieldsLct['custbody_scv_beneficiary'] || ' '},
                    E23: {'custbody_scv_bankaccount': lkFieldsLct['custbody_scv_bankaccount'] || ' '},
                    E25: {'defaultaddress': address || ' '},
                    B27: {'memo': lkFieldsLct['memo'] || ' '},
                    F37: {'total': formatCurrency(recVendorPrepayment.getValue('payment')) || ' '},
                }
            }
        }

        const getDataLctVcb = (parameters) => {
            let lkFieldsLct = search.lookupFields({
                type: parameters.rectype,
                id: parameters.recid,
                columns: COLUMNSMB
            });
            let rec = record.load({
                type: parameters.rectype,
                id: parameters.recid,
            });

            let recSub = getSub(rec);
            let idEmployee = recSub.getValue('custrecord_scv_sub_representative');
            let lkFieldEmp = {}
            if(idEmployee) {
                lkFieldEmp = search.lookupFields({
                   id: idEmployee,
                     type: search.Type.EMPLOYEE,
                    columns: ['custentity_scv_position_st']
                });
            }

            let {address, phone} = getEntityAddress(lkFieldsLct, true);
            return {
                filename : 'LCT VCB.docx',
                templatetype : 'docx',
                url: file.load({id: '../doc/scv_docx_lct_nuoc_ngoai.docx'}).url,
                mappeddata: {
                    'custrecord_scv_sub_legalname_eng': lkFieldsLct['subsidiary.custrecord_scv_sub_legalname_eng'] || ' ',
                    'currency': lkFieldsLct.currency[0].text || ' ',
                    'total': rec.getValue('total'),//lkFieldsLct.total || ' ',
                    'custbody_scv_amount_in_word_en': rec.getValue('custbody_scv_amount_in_word_en') || ' ',
                    'custrecord_scv_sub_address_en': lkFieldsLct['subsidiary.custrecord_scv_sub_address_en'] || ' ',
                    'custbody_scv_bankname': lkFieldsLct['custbody_scv_bankname'] || ' ',
                    'custrecord_scv_beb_bank_swift': lkFieldsLct['custbody_scv_beneficiary_bank.custrecord_scv_beb_bank_swift'] || ' ',
                    'custrecord_scv_beb_bank_address': lkFieldsLct['custbody_scv_beneficiary_bank.custrecord_scv_beb_bank_address'] || ' ',
                    'custbody_scv_beneficiary': lkFieldsLct['custbody_scv_beneficiary'] || ' ',
                    'custbody_scv_bankaccount': lkFieldsLct['custbody_scv_bankaccount'] || ' ',
                    'defaultaddress': address || ' ',
                    'phone' : phone || ' ',
                    'memo': lkFieldsLct['memo'] || ' ',
                    'sub_custrecord_scv_sub_representative': lkFieldsLct['subsidiary.custrecord_scv_sub_representative'][0]?.text.split("_")[2],
                    'subfederalid' : recSub.getValue('federalidnumber'),
                    'substate' : recSub.getText('state'),
                    'employee_position' : lkFieldEmp['custentity_scv_position_st']?.[0]?.text || ' ',
                    // 'custbody_scv_amount_in_word_en' : rec.getValue('custbody_scv_amount_in_word_en'),
                }
            }
        }

        const getSub = (rec) => {
            let idSub = rec.getValue('subsidiary');
            if(!idSub) return;
            return record.load({
                type: 'subsidiary',
                id: idSub,
            });
        }

        const formatCurrency = (number) => {
            return new Intl.NumberFormat('ja-JP', {
                style: 'currency',
                currency: 'JPY',
                currencyDisplay: "code",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })
                .format(number)
                .replace("JPY", "")
                .trim();
        }

        const getCustomEntityAddress = (lkFieldsLct) => {
            if(lkFieldsLct['custbody_scv_beneficiary_entity'].length > 0) {
                let entityType = search.lookupFields({
                    type: 'entity',
                    id: lkFieldsLct['custbody_scv_beneficiary_entity']?.[0]?.value,
                    columns: ['type']
                });

                let lkFieldsEmployee = search.lookupFields({
                    type: entityType.type[0].value.toLowerCase(),
                    id: lkFieldsLct['custbody_scv_beneficiary_entity']?.[0]?.value,
                    columns: ['address', 'phone']
                });

                return lkFieldsEmployee['address'];
            }
            return ''
        }

        const getEntityAddress = (lkFieldsLct, hasPhone = false) => {
            let entityType = search.lookupFields({
                type: 'entity', id: lkFieldsLct.entity[0].value, columns: ['type']
            });

            let lkFieldsEmployee = search.lookupFields({
                type: entityType.type[0].value.toLowerCase(), id: lkFieldsLct.entity[0].value, columns: ['address', 'phone']
            });

            if(hasPhone === true) {
                return {address: lkFieldsEmployee['address'], phone: lkFieldsEmployee['phone']};
            }

            return lkFieldsEmployee['address'];
        }

        return {onRequest}

    });
