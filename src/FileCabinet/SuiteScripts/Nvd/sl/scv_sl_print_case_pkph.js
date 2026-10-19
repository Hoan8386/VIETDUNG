/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/search', '../common/scv_common_pdf', 'N/render', 'N/record'],

    (search, comPdf, render, record) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            if (scriptContext.request.method === 'GET') {
                let params = scriptContext.request.parameters;
                let recSupportCase = record.load({
                    type: params.recType,
                    id: params.recId,
                });
                let pdfFile = buildPdfFile(recSupportCase, params);
                scriptContext.response.writeFile(pdfFile, true);
            }
        }

        const buildPdfFile = (recSupportCase, params) => {
            let objRender = comPdf.initTemplateRender('CUSTTMPL_SCV_CASE_PHIEU_KHONG_PHU_HOP');
            comPdf.addFontVietnamese(objRender);

            let dataApprovers = getApproverData(params, recSupportCase);
            let dataApprovalTexts = getDataApproverAndDate(recSupportCase, dataApprovers);
            let itemsData = getSupportCaseItems(recSupportCase);
            log.error('itemsData', itemsData);

            let boPhanLienQuan = recSupportCase.getText('custevent_scv_related_dept').toString();
            boPhanLienQuan = boPhanLienQuan.replace(/\n/g, ',\u00A0');
            objRender.addRecord('record', recSupportCase)

            objRender.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: 'items',
                data: {
                    itemsData: itemsData
                }
            })

            objRender.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: 'approvalData',
                data: {
                    data: dataApprovalTexts,
                    empMoPhieu: dataApprovers.empMoPhieu,
                    boPhanLienQuan: boPhanLienQuan
                }
            });

            return objRender.renderAsPdf();
        }

        const getApproverData = (params, recSupportCase) => {
            let approvalData = {};
            for (let i = 1; i <= 7; i += 1) {
                let idEntity = recSupportCase.getValue(`custevent_scv_crm_approval_approver${i}`);

                if (idEntity) {

                    let lkFieldsApprover = search.lookupFields({
                        type: search.Type.ENTITY,
                        id: idEntity,
                        columns: ['custentity_scv_legal_name']
                    });

                    if (lkFieldsApprover.custentity_scv_legal_name === "") { // legalname này trống, tức idEntity là của partner => lookup tên theo partner
                        lkFieldsApprover = search.lookupFields({
                            type: search.Type.ENTITY,
                            id: idEntity,
                            columns: ['custentity_scv_partner_employee.custentity_scv_legal_name']
                        });
                        approvalData[`approver${i}`] = lkFieldsApprover['custentity_scv_partner_employee.custentity_scv_legal_name'];
                    } else {
                        approvalData[`approver${i}`] = lkFieldsApprover.custentity_scv_legal_name;
                    }
                } else {
                    approvalData[`approver${i}`] = '';
                }
            }

            let idEmpCreated = recSupportCase.getValue(`custevent_scv_emp_created`);
            if (idEmpCreated) {
                let lkFieldsEmp = search.lookupFields({
                    type: search.Type.ENTITY,
                    id: idEmpCreated,
                    columns: ['custentity_scv_legal_name']
                });

                approvalData.empMoPhieu = lkFieldsEmp.custentity_scv_legal_name + ', ' + recSupportCase.getText(`custevent_scv_ngay_mo_phieu`);
            }

            return approvalData;
        }

        const getDataApproverAndDate = (recSupportCase, dataApprovers) => {
            let result = {};

            for (let i = 1; i <= 7; i += 1) {
                if(dataApprovers[`approver${i}`] ) {
                    result[`approvalText${i}`] = dataApprovers[`approver${i}`] + ', ' + recSupportCase.getText(`custevent_scv_crm_approval_date${i}`);

                    if (i === 2 || i === 3) {
                        result[`approvalText${i}`] = result[`approvalText${i}`] + ', ' + recSupportCase.getValue(`custevent_scv_approval_note${i}`);
                    }
                }
            }

            if(result['approvalText4']) {
                result.approvalText4 = `${result['approvalText4']}, ${recSupportCase.getValue('custevent_scv_y_kien_iso')}`;
            }
            if(result['approvalText5']) {
                result.approvalText5 = `${result['approvalText5']}, ${recSupportCase.getValue('custevent_scv_phe_duyet_tgd')}`;
            }
            result.yKien = getYKienBoPhanLienQuan(recSupportCase.id);

            return result;
        }

        const getSupportCaseItems = (recSupportCase) => {
            let items = []
            let itemLines = recSupportCase.getLineCount('recmachcustrecord_scv_crm_transaction');
            log.error('itemLines', itemLines);
            if (itemLines > 0) {

                for (let i = 0; i < itemLines; i += 1) {
                    let lineData = {};
                    let itemName = recSupportCase.getSublistText('recmachcustrecord_scv_crm_transaction', 'custrecord_scv_crm_item', i);
                    lineData.ma_vat_tu = itemName.split('_')[0];
                    lineData.quycach = itemName.split('_')[1];
                    // lineData.quycach = recSupportCase.getSublistValue('recmachcustrecord_scv_crm_transaction', 'custrecord_scv_crm_quy_cach', i);
                    lineData.quantity_mo_phieu = recSupportCase.getSublistValue('recmachcustrecord_scv_crm_transaction', 'custrecord_nvd_crm_quantity_create', i);
                    lineData.quantity = recSupportCase.getSublistValue('recmachcustrecord_scv_crm_transaction', 'custrecord_scv_crm_quantity', i);
                    lineData.unit = recSupportCase.getSublistText('recmachcustrecord_scv_crm_transaction', 'custrecord_scv_crm_unit', i);
                    lineData.seri = recSupportCase.getSublistValue('recmachcustrecord_scv_crm_transaction', 'custrecord_scv_crm_seri', i);
                    lineData.lot = recSupportCase.getSublistText('recmachcustrecord_scv_crm_transaction', 'custrecord_scv_crm_lot', i);
                    lineData.loi = recSupportCase.getSublistValue('recmachcustrecord_scv_crm_transaction', 'custrecord_scv_crm_loi', i);
                    lineData.ngay_sx = recSupportCase.getSublistText('recmachcustrecord_scv_crm_transaction', 'custrecord_scv_crm_ngay_sx', i);
                    lineData.ngay_nk = recSupportCase.getSublistText('recmachcustrecord_scv_crm_transaction', 'custrecord_scv_crm_ngay_nk', i);
                    lineData.ghichu = recSupportCase.getSublistValue('recmachcustrecord_scv_crm_transaction', 'custrecord_scv_crm_memo', i);
                    lineData.bp_khovan = recSupportCase.getSublistText('recmachcustrecord_scv_crm_transaction', 'custrecord_nvd_vdct_item_status', i);
                    lineData.bp_qlcl = recSupportCase.getSublistValue('recmachcustrecord_scv_crm_transaction', 'custrecord_scv_crm_bp_qlcl', i);
                    lineData.bp_kd = recSupportCase.getSublistValue('recmachcustrecord_scv_crm_transaction', 'custrecord_scv_crm_bp_kd', i);

                    items.push(lineData);
                }


            }
            return items;
        }

        const getYKienBoPhanLienQuan = (idSupportCase) => {
            let dataYKien;
            let arrItems = [];
            let searchResult = search.load({
                id: 'customsearch_crm_kph_y_kien_bplq'
            }).run().getRange({
                start: 0,
                end: 100
            });

            for (let i = 0; i < searchResult.length; i++) {
                let idSSSupportCase = searchResult[i].getValue(
                    {name: 'internalid', join: 'case'}
                );
                if (idSSSupportCase.toString() === idSupportCase.toString()) {
                    let textYKien = {};
                    textYKien.bophan = searchResult[i].getText({name: 'departmentnohierarchy', join: 'assigned'});
                    textYKien.nguoiPhanHoi = searchResult[i].getValue({
                        name: 'custentity_scv_legal_name',
                        join: 'assigned'
                    });
                    textYKien.chucVu = searchResult[i].getValue({name: 'title', join: 'assigned'});
                    textYKien.ngayThangNam = searchResult[i].getValue({name: 'custevent_scv_task_date_reply'});
                    textYKien.noiDung = searchResult[i].getValue({name: 'custevent_scv_reply'});

                    dataYKien = `${textYKien.bophan}-${textYKien.nguoiPhanHoi}-${textYKien.chucVu}-${textYKien.ngayThangNam}: ${textYKien.noiDung}`;
                    arrItems.push(dataYKien);
                }
            }

            return arrItems;
        }

        return {onRequest}

    });
