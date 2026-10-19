define(['../lib/scv_lib_function.js', 'N/query', 'N/record'],
    (libFunc, query, record) => {

        const CustomRecordType = {
            LENH_CHI: 'custompurchase_scv_lenhchi',
        };

        const createCheckFromLenhChi = (options) => {
            let result = {msg: null, response: null, isSuccess: true};
            let {lenhchi} = options;
            try {
                const checkId = createWriteCheck(lenhchi);
                if (checkId) {
                    record.submitFields({
                        type: CustomRecordType.LENH_CHI,
                        id: lenhchi,
                        values: {custbody_scv_check_transaction: checkId},
                        options: {ignoreMandatoryFields: true}
                    });
                }
                result.response = checkId;
            } catch (e) {
                result.msg = e.message;
                result.isSuccess = false;
                log.error('Error_createCheckFromLenhChi_' + lenhchi, e);
            }
            return result;
        };

        const findCheckByLenhChi = (lenhchi) => {
            let sql = `select t.id from transaction t where t.externalid = ?`;
            return query.runSuiteQL({query: sql, params: [lenhchi]}).asMappedResults()[0]?.id;
        }

        const createWriteCheck = (lenhchi) => {
            let recLC = record.load({type: CustomRecordType.LENH_CHI, id: lenhchi});
            const check_transaction = recLC.getValue('custbody_scv_check_transaction');
            if(check_transaction) {
                return;
            }
            let checkExternalId = `check_${lenhchi}`;
            let checkId = findCheckByLenhChi(checkExternalId);

            if(!checkId) {
                let recCheck = record.create({type: record.Type.CHECK, isDynamic: true});
                recCheck.setValue('externalid', checkExternalId);
                const lc = recLC.getLineCount('expense');
                libFunc.setValue(recCheck, recLC,
                    ['entity', 'custbody_scv_payee', 'subsidiary', 'account', 'currency', 'trandate', 'memo', 'department', 'cseg_scv_sg_proj', 'custbody_scv_created_transaction', 'custbody_scv_kemtheo',
                        'custbody_scv_emp_number', 'custbody_scv_dntt_link', 'custbody_scv_doc_number',
                        'custbody_scv_bank_stt', 'custbody_scv_amount_in_word', 'custbody_scv_amount_in_word_en', 'custbody_scv_related_transaction', 'cseg_scv_loan',
                        'custbody_scv_beneficiary_bank', 'custbody_scv_beneficiary', 'custbody_scv_bankname', 'custbody_scv_bankaccount', 'custbody_scv_bankbranch', 'custbody_scv_advanced_request'],
                    ['custbody_scv_payee', 'custbody_scv_payee', 'subsidiary', 'account', 'currency', 'trandate', 'memo', 'department', 'cseg_scv_sg_proj', 'custbody_scv_created_transaction', 'custbody_scv_kemtheo', 'custbody_scv_emp_number', 'custbody_scv_dntt_link', 'custbody_scv_doc_number', 'custbody_scv_bank_stt', 'custbody_scv_amount_in_word', 'custbody_scv_amount_in_word_en', 'custbody_scv_related_transaction', 'cseg_scv_loan', 'custbody_scv_beneficiary_bank', 'custbody_scv_beneficiary', 'custbody_scv_bankname', 'custbody_scv_bankaccount', 'custbody_scv_bankbranch', 'custbody_scv_advanced_request',]);
                for (let i = 0; i < lc; i++) {
                    recCheck.selectNewLine('expense');
                    libFunc.setCurrentSublistValue(recCheck, recLC, 'expense', 'expense', [
                        'account', 'amount', 'taxcode', 'tax1amt', 'grossamt', 'memo', 'location', 'department',
                        'cseg_scv_sg_proj', 'custcol_scv_invoice_date', 'custcol_scv_invoice_number', 'custcol_scv_invoice_pattern',
                        'custcol_scv_invoice_serial', 'custcol_scv_line_name', 'custcol_scv_vendor', 'cseg_scv_kmcp', 'custcol_far_trn_relatedasset',
                        'custcol_scv_invoice_taxreg', 'custcol_scv_diachi', 'custcolscv_bill_custom_no', 'custcol_scv_cost_category', 'customer',
                    ], [
                        'custcol_scv_lc_account_check', 'amount', 'custcol_scv_sumtrans_line_taxcode', 'custcol_scv_sumtrans_line_taxamt', 'custcol_scv_sumtrans_line_grossamt',
                        'memo', 'location', 'department', 'cseg_scv_sg_proj', 'custcol_scv_invoice_date', 'custcol_scv_invoice_number', 'custcol_scv_invoice_pattern',
                        'custcol_scv_invoice_serial', 'custcol_scv_line_name', 'custcol_scv_vendor', 'cseg_scv_kmcp', 'custcol_far_trn_relatedasset',
                        'custcol_scv_invoice_taxreg', 'custcol_scv_diachi', 'custcolscv_bill_custom_no', 'custcol_scv_cost_category', 'customer',
                    ], i);
                    recCheck.commitLine('expense');
                }
                checkId = recCheck.save({ignoreMandatoryFields: true});
            }
            return checkId;
        };

        return {
            createCheckFromLenhChi,
        };
    });