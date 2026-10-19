/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record', 'N/search', '../common/scv_common_pdf', 'N/render', '../olib/alasql/alasql.min@1.7.3.js'],

    (record ,search, comPdf, render, alasql) => {
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
                let pdfFile = buildPdfFile(params);
                scriptContext.response.writeFile(pdfFile, true);
            }
        }

        const buildPdfFile = (params) => {
            let recPhieuKhieuNai = record.load({
                type: params.recType,
                id: params.recId,
            });

            let custevent_scv_dx_pa_ghi_chu = recPhieuKhieuNai.getValue('custevent_scv_dx_pa_ghi_chu');
            let custevent_nvd_ket_qua_xu_ly = recPhieuKhieuNai.getValue('custevent_nvd_ket_qua_xu_ly');

            recPhieuKhieuNai.setValue('custevent_nvd_ket_qua_xu_ly', custevent_nvd_ket_qua_xu_ly.normalize("NFC"));
            recPhieuKhieuNai.setValue('custevent_scv_dx_pa_ghi_chu', custevent_scv_dx_pa_ghi_chu.normalize("NFC"));

            let objRender = comPdf.initTemplateRender('CUSTTMPL_SCV_CASE_PHIEU_KHIEU_NAI');
            objRender.addRecord('recordPhieuKhieuNai', recPhieuKhieuNai);
            comPdf.addFontVietnamese(objRender);

            let dataSupportCase = getSupportCaseData(params);
            dataSupportCase.companylegalname = dataSupportCase['company.custentity_scv_legal_name'];
            let dataApprovers = getApproverData(params, dataSupportCase);
            let dataApprovalTexts = getDataApproverAndDate(dataSupportCase, dataApprovers, params);

            objRender.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: 'record',
                data: {
                    data: dataSupportCase,
                }
            });

            objRender.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: 'approvalData',
                data: {
                    data: dataApprovalTexts,
                }
            });

            return objRender.renderAsPdf();
        }

        const SUPPORT_CASE_FIELDS = [
            'custevent_scv_so_phieu',
            'custevent_scv_ngay_mo_phieu',
            'custevent_scv_phan_loai_khieu_nai',
            'quicknote',
            'title',
            'custevent_scv_khan_cap',
            'custevent_scv_nghiem_trong',
            'custevent_scv_tinh_chat',
            'custevent_scv_kt_hien_truong',
            'custevent_scv_so_hieu_vb',
            'custevent_scv_kq_dieu_tra',
            'custevent_scv_y_kien_bp_lq',
            'custevent_scv_dx_phuong_an',
            'custevent_scv_mong_muon',
            'custevent_scv_dx_pa_ghi_chu',
            'custevent_scv_crm_phuong_an',
            'custevent_scv_tong_thiet_hai_uoc_tinh_v',
            'custevent_scv_thoi_han_giai_quyet',
            'custevent_scv_crm_ttkn',

            'custevent_scv_y_kien_iso',
            'custevent_scv_phe_duyet_tgd',
            'custevent_scv_kq_thuc_hien',
            'custevent_scv_noi_dung_khieu_nai',
            'custevent_scv_approval_note5',
            'custevent_scv_phe_duyet_tgd_lan2',
            'custevent_scv_ngay_kt_kntt',
            'custevent_scv_danh_gia_khieu_nai',
            'custevent_scv_crm_danh_gia_kh',

            'custevent_scv_approval_note1',
            'custevent_scv_approval_note2',
            'custevent_scv_approval_note5',
            'custevent_scv_approval_note7',
            'custevent_scv_approval_note8',
            'custevent_scv_approval_note9',

            'custevent_scv_crm_approval_date1',
            'custevent_scv_crm_approval_date2',
            'custevent_scv_crm_approval_date3',
            'custevent_scv_crm_approval_date4',
            'custevent_scv_crm_approval_date5',
            'custevent_scv_crm_approval_date6',
            'custevent_scv_crm_approval_date7',
            'custevent_scv_crm_approval_date8',
            'custevent_scv_crm_approval_date9',

            'custevent_scv_crm_approval_approver1',
            'custevent_scv_crm_approval_approver2',
            'custevent_scv_crm_approval_approver3',
            'custevent_scv_crm_approval_approver4',
            'custevent_scv_crm_approval_approver5',
            'custevent_scv_crm_approval_approver6',
            'custevent_scv_crm_approval_approver7',
            'custevent_scv_crm_approval_approver8',
            'custevent_scv_crm_approval_approver9',

            'company.custentity_scv_legal_name'

        ]

        const getSupportCaseData = (params) => {
            return search.lookupFields({
                type: params.recType,
                id: params.recId,
                columns: SUPPORT_CASE_FIELDS
            });
        }

        const getApproverData = (params, fieldsSupportCase) => {
            let approvalData = {};
            for (let i = 1; i <= 9; i += 1) {
                let idEntity = fieldsSupportCase[`custevent_scv_crm_approval_approver${i}`][0]?.value;

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
                }
            }

            return approvalData;
        }

        const getDataApproverAndDate = (dataSupportCase, dataApprovers, params) => {
            let result = {};

            for (let i = 1; i <= 9; i += 1) {
                if (dataApprovers[`approver${i}`]) {
                    result[`approvalText${i}`] = dataApprovers[`approver${i}`] + ', ' + dataSupportCase[`custevent_scv_crm_approval_date${i}`] + ', ' + dataSupportCase[`custevent_scv_approval_note${i}`];
                }
            }
            if (dataApprovers[`approver3`]) {
                result.approvalText3 = dataApprovers.approver3 + ', ' + dataSupportCase.custevent_scv_crm_approval_date3 + ', ' + dataSupportCase.custevent_scv_y_kien_iso;
            }
            if (dataApprovers[`approver4`]) {
                result.approvalText4 = dataApprovers.approver4 + ', ' + dataSupportCase.custevent_scv_crm_approval_date4 + ', ' + dataSupportCase.custevent_scv_phe_duyet_tgd;
            }
            if (dataApprovers[`approver6`]) {
                result.approvalText6 = dataApprovers.approver6 + ', ' + dataSupportCase.custevent_scv_crm_approval_date6 + ', ' + dataSupportCase.custevent_scv_phe_duyet_tgd_lan2;
            }
            result.yKien = getYKienBoPhanLienQuan(params.recId);

            return result;
        }

        const getYKienBoPhanLienQuan = (idSupportCase) => {
            let dataYKien;
            let arrItems = [];
            let arrDoiChieu = [];
            let arrIdImages = [];

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
                    let objYKien = {};
                    objYKien.bophan = searchResult[i].getText({name: 'departmentnohierarchy', join: 'assigned'});
                    objYKien.nguoiPhanHoi = searchResult[i].getValue({
                        name: 'custentity_scv_legal_name',
                        join: 'assigned'
                    });
                    objYKien.chucVu = searchResult[i].getValue({name: 'title', join: 'assigned'});
                    objYKien.ngayThangNam = searchResult[i].getValue({name: 'custevent_scv_task_date_reply'}) ? `-${searchResult[i].getValue({name: 'custevent_scv_task_date_reply'})}` : '';
                    objYKien.noiDung = searchResult[i].getValue({name: 'custevent_scv_reply'}) ? `: ${searchResult[i].getValue({name: 'custevent_scv_reply'})}` : '';
                    objYKien.noiDungThem = searchResult[i].getValue({name: 'formulahtml'}) ? `<br/>${searchResult[i].getValue({name: 'formulahtml'})}` : '';

                    objYKien.idimages = searchResult[i].getValue({name: 'custevent_scv_task_image'});
                    arrIdImages.push(objYKien.idimages);

                    objYKien.textvanban = searchResult[i].getText({name: 'custevent_scv_task_vb'}) ? `<br/>Tài liệu đính kèm: ${searchResult[i].getText({name: 'custevent_scv_task_vb'})}` : '';
                    objYKien.imageurl = '';

                    //dataYKien = `<br/>${objYKien.bophan}-${objYKien.nguoiPhanHoi}-${objYKien.chucVu}${objYKien.ngayThangNam}${objYKien.noiDung}${objYKien.noiDungThem}`;

                    arrDoiChieu.push(objYKien);
                    //arrItems.push(dataYKien);
                }

            }

            let arrUrlImages = comPdf.getListUrlImagesByIds(arrIdImages);

            let resultYkien = joinAndGetUrlForImages(arrDoiChieu, arrUrlImages);

            for (let i = 0; i < resultYkien.length; i++) {
                resultYkien[i].imageurl = resultYkien[i].url //? `<br/><img src="${resultYkien[i].url}" style="width: 100px; height: 100px;"/>` : '';
                dataYKien = `${resultYkien[i].bophan}-${resultYkien[i].nguoiPhanHoi}-${resultYkien[i].chucVu}${resultYkien[i].ngayThangNam}${resultYkien[i].noiDung}${resultYkien[i].noiDungThem}${resultYkien[i].textvanban}`;
                arrItems.push({
                    dataYKien : dataYKien,
                    urlVanBan : resultYkien[i].imageurl
                });
            }

            return arrItems;
        }

        const joinAndGetUrlForImages = (arrDoiChieu, arrUrlImages) => {
            let joinQuery = `SELECT *
                             FROM ? AS a
                                      LEFT JOIN ? AS b ON a.idimages = b.id`;

            return alasql(joinQuery, [arrDoiChieu, arrUrlImages]);
        }

        return {onRequest}

    });
