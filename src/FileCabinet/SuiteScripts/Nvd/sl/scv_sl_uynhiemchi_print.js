/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record',
        'N/render',
        'N/search',
        '../common/scv_common_pdf',
        '../olib/lodash.min',
        '../common/scv_common_theo_doi_phieu_in'],

    (record, render, search, comPdf, _, comPhieuIn) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            const params = scriptContext.request.parameters;
            const request = scriptContext.request;
            const response = scriptContext.response;
            const renderType = params.rendertype;

            if (request.method === "GET") {
                try {
                    if (renderType === "pdf") {
                        let {pdfFile, isTransaction} = renderPdfWithTmpl(scriptContext);

                        if (isTransaction) {
                            comPhieuIn.createPhieuTheoDoi(params.recid, params.TEMPLATE);
                        }
                        response.writeFile(pdfFile, true);
                    }
                } catch (err) {
                    throw new Error(`Error in Suitelet: ${err.message}`);
                }
            }
        }

        const renderPdfWithTmpl = scriptContext => {
            const params = scriptContext.request.parameters;
            const recType = params.rectype;
            const recId = params.recid;
            let objRender = render.create();

            comPdf.addFontVietnamese(objRender);
            let recMain = record.load({type: recType, id: recId});
            objRender.addRecord('record', recMain);

            let subsidiaryId = recMain.getValue("subsidiary");
            if (_.isEmpty(subsidiaryId) === false) {
                comPdf.addCustomSubsidiary(objRender, subsidiaryId);
            }

            addAccountData(objRender, recMain);

            addBankData(objRender, recMain);

            return {
                pdfFile: objRender.renderAsPdf(),
                isTransaction: isTransaction(recMain)
            };

        }

        const isTransaction = (recMain) => {
            if (recMain.getValue('dbstrantype')) {
                return true;
            }
        }

        const addBankData = (objRender, recMain) => {
            let beneficiaryBankId = recMain.getValue("custbody_scv_beneficiary_bank");
            let tenVietTatBank;

            if (beneficiaryBankId) {
                let lkFieldsBebBank = search.lookupFields({
                    type: 'customrecord_scv_beb',
                    id: beneficiaryBankId,
                    columns: [
                        'custrecord_scv_beb_cccd_hc_no',
                        'custrecord_scv_beb_noi_cap_cccd',
                        'custrecord_scv_beb_address_cccd',
                        'custrecord_scv_beb_date_issue',
                        'custrecord_scv_beb_bank_address',
                        'custrecord_scv_beb_bank_name'
                    ],
                });

                if (lkFieldsBebBank.custrecord_scv_beb_bank_name) {
                    let lkFieldsBank = search.lookupFields({
                        type: 'customrecord_scv_beb_bank_name',
                        id: lkFieldsBebBank.custrecord_scv_beb_bank_name[0]?.value,
                        columns: ['custrecord_scv_bank_tvt']
                    });

                    tenVietTatBank = lkFieldsBank.custrecord_scv_bank_tvt;
                }


                objRender.addCustomDataSource({
                    format: render.DataSource.OBJECT,
                    alias: 'beneficiary',
                    data: {
                        ...lkFieldsBebBank,
                        custrecord_scv_bank_tvt: tenVietTatBank
                    }
                });
            }
        }

        const addAccountData = (objRender, recMain) => {
            const accountId = recMain.getValue("account");
            let tenVietTatBank;

            let lkFieldsAccount = search.lookupFields({
                type: search.Type.ACCOUNT,
                id: accountId,
                columns: [
                    'custrecord_scv_acc_bank_name',
                    'custrecord_scv_acc_bank_address',
                    'custrecord_scv_acc_bank_acc',
                    'custrecord_scv_acc_bank_account_name',
                    'custrecord_scv_acc_bank_branchname',
                    'custrecord_scv_pdf_template'
                ]
            });


            if (lkFieldsAccount.custrecord_scv_acc_bank_name.length > 0) {
                let lkFieldsBank = search.lookupFields({
                    type: 'customrecord_scv_beb_bank_name',
                    id: lkFieldsAccount.custrecord_scv_acc_bank_name[0]?.value,
                    columns: ['custrecord_scv_bank_tvt']
                });

                tenVietTatBank = lkFieldsBank.custrecord_scv_bank_tvt;
            }

            objRender.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: 'account',
                data: {
                    ...lkFieldsAccount,
                    custrecord_scv_bank_tvt: tenVietTatBank,
                    date: formatDate(recMain.getValue("trandate")),
                }
            });

            //setTemplate in this function to optimize performance : no need to get account.custrecord_scv_pdf_template in a separate function
            let templateId = lkFieldsAccount["custrecord_scv_pdf_template"][0]?.value;
            log.error("Template Id", templateId);
            if (templateId) {
                objRender.setTemplateById(templateId);
            } else {
                throw new Error("Vui lòng điền template Ủy nhiệm chi tương ứng trong tài khoản ngân hàng");
            }
        }

        const formatDate = (date) => {
            return 'Ngày ' + date.getDate() + ' Tháng ' + (date.getMonth() + 1) + ' Năm ' + date.getFullYear();
        }

        return {onRequest}

    });
