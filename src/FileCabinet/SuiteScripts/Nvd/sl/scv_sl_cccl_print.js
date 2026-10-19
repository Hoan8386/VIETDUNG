/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record', 'N/render', '../common/scv_common_pdf.js', 'N/search', '../olib/alasql/alasql.min@1.7.3.js'],

    (record, render, libPdf, search, alasql) => {
        const TemplateCccl = {
            AC_PHU_KIEN: '1',
            ACP_ALRADO: '2',
            AC_LAM_CHAN_NANG: '3',
            ACP_ALCOREST_THICK: '4',
            ACP_ALCOREST_THIN: '5',
        }

        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            if (scriptContext.request.method === 'GET') {
                let parameters = scriptContext.request.parameters;
                let templateTypeId = parameters.templateTypeId;
                let pdfFile;
                let rec_cccl = record.load({type: 'customrecord_scv_yc_cccl', id: parameters.recId,});
                let templateRenderer = render.create();
                templateRenderer.addRecord({templateName: 'record', record: rec_cccl});

                switch (templateTypeId){
                    case TemplateCccl.ACP_ALCOREST_THICK:
                        pdfFile = buildPdfFileAcp('CUSTTMPL_SCV_QUANLYCAP_CCCL_ACP_THICK',rec_cccl, templateRenderer, true);
                        break;
                    case TemplateCccl.ACP_ALRADO:
                    case TemplateCccl.ACP_ALCOREST_THIN:
                        pdfFile = buildPdfFileAcp('CUSTTMPL_SCV_QUANLYCAP_CCCL_ACP',rec_cccl, templateRenderer, false);
                        break;
                    case TemplateCccl.AC_LAM_CHAN_NANG:
                    case TemplateCccl.AC_PHU_KIEN:
                        pdfFile = buildPdfFileAc('CUSTTMPL_SCV_QUANLYCAP_CCCL_AC', rec_cccl, templateRenderer);
                        break;
                }

                scriptContext.response.writeFile(pdfFile,true);
            }
        }

        const buildPdfFileAcp = (template, rec_cccl, renderer, isThick) => {
            renderer.setTemplateByScriptId(template);
            putDataTemplateAcp(renderer, rec_cccl, isThick);
            return renderer.renderAsPdf();
        }

        const buildPdfFileAc = (template, rec_cccl, renderer) => {
            renderer.setTemplateByScriptId(template);
            putDataTemplateAc(renderer, rec_cccl);
            return renderer.renderAsPdf();
        }

        // start lấy dữ liệu Ac phụ kiện / lam chắn nắng
        const putDataTemplateAc = (templateRenderer, rec_cccl) => {
            libPdf.addFontVietnamese(templateRenderer);
            let result = getDataTemplAc(rec_cccl);
            templateRenderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: 'items',
                data: {
                    result
                }
            })
        }

        const getDataTemplAc = (rec) => {
            let dataKetQua = getItemsKqAc(rec);
            let dataYCChiTiet = getItemsYCCTAc(rec);

            if (dataYCChiTiet.length === 0) {
                throw ('Kiểm tra điền CCCL-Detail');
            }

            let joinQuery =
                `SELECT a.stt,
--                         a.custrecord_scv_yccc_itf_date,
                        b.custrecord_scv_cccl_result_shipped_date as custrecord_scv_yccc_itf_date,
                        a.custrecord_scv_yccc_category,
                        a.displayname,
                        a.custrecord_scv_yccc_units_display,
                        a.custrecord_scv_yccc_qty,
                        a.itemLot,
                        a.custrecord_scv_yccc_category,
                        b.custrecord_scv_cccl_result_kq_text,
                        b.custrecord_scv_cccl_result_pass_fail,
                        b.tieuChi
                 FROM ? a
                          LEFT JOIN ? b
                               ON a.itemId = b.itemId 
                                      AND a.itemLot = b.itemLot 
                                      AND a.so = b.so 
                                     AND a.itf = b.itf
                                      AND a.custrecord_scv_yccc_qty = b.custrecord_scv_cccl_result_qty
                 ORDER BY a.stt ASC, a.itemLot ASC
                `
            dataYCChiTiet.forEach( s => {
                let kq = dataKetQua.find(k =>
                    k.itemId === s.itemId &&
                    k.itemLot === s.itemLot &&
                    k.so === s.so &&
                    k.itf === s.itf &&
                    Number(k.custrecord_scv_cccl_result_qty) === Number(s.custrecord_scv_yccc_qty));
                s.custrecord_scv_cccl_result_kq_text = kq ? kq.custrecord_scv_cccl_result_kq_text : '';
                s.custrecord_scv_cccl_result_pass_fail = kq ? kq.custrecord_scv_cccl_result_pass_fail : '';
                s.tieuChi = kq ? kq.tieuChi : '';
            })

            return dataYCChiTiet;
            return alasql(joinQuery, [dataYCChiTiet, dataKetQua]);
        }

        const getItemsKqAc = (rec) => {
            let lineNum = rec.getLineCount('recmachcustrecord_scv_cccl_result_no');
            let dataKQ = [];

            for (let i = 0; i < lineNum; i++) {
                let lineData = {};
                lineData.itemId = rec.getSublistValue('recmachcustrecord_scv_cccl_result_no', 'custrecord_scv_cccl_result_item', i); // custrecord_scv_cccl_result_item
                lineData.itemLot = rec.getSublistValue('recmachcustrecord_scv_cccl_result_no', 'custrecord_scv_cccl_result_lot', i) || rec.getSublistText('recmachcustrecord_scv_cccl_result_no', 'custrecord_scv_cccl_result_m_lot', i); // custrecord_scv_cccl_result_lot
                lineData.custrecord_scv_cccl_result_kq_text = rec.getSublistValue('recmachcustrecord_scv_cccl_result_no', 'custrecord_scv_cccl_result_kq_text', i);
                lineData.custrecord_scv_cccl_result_pass_fail = rec.getSublistValue('recmachcustrecord_scv_cccl_result_no', 'custrecord_scv_cccl_result_pass_fail', i) === "2" ? "Đạt" : "Không đạt";
                lineData.tieuChi = rec.getSublistValue('recmachcustrecord_scv_cccl_result_no', 'custrecord_scv_cccl_result_kq_text', i);
                // lineData.itf = rec.getSublistValue('recmachcustrecord_scv_cccl_result_no', 'custrecord_scv_cccl_result_itf', i);
                lineData.custrecord_scv_cccl_result_qty = rec.getSublistValue('recmachcustrecord_scv_cccl_result_no', 'custrecord_scv_cccl_result_qty', i);
                lineData.so = rec.getSublistValue('recmachcustrecord_scv_cccl_result_no', 'custrecord_scv_cccl_result_so', i);
                lineData.custrecord_scv_cccl_result_shipped_date = formatDateToDDMMYYYY(rec.getSublistValue('recmachcustrecord_scv_cccl_result_no', 'custrecord_scv_cccl_result_shipped_date', i));
                lineData.itf = rec.getSublistValue('recmachcustrecord_scv_cccl_result_no', 'custrecord_scv_cccl_result_itf', i);
                dataKQ.push(lineData);
            }
            return dataKQ;
        }

        const getItemsYCCTAc = (rec) => {
            let lineNum = rec.getLineCount('recmachcustrecord_scv_yccc_line_so_phieu');
            let dataYeuCauChiTieu = [];
            for (let i = 0; i < lineNum; i++) {
                let lineItem = {};
                getDataLotNumItemAc(rec, lineItem, i);
                dataYeuCauChiTieu.push(lineItem);
            }

            return dataYeuCauChiTieu;
        }

        const getDataLotNumItemAc = (rec, lineItem, line) => {
            let itemId = rec.getSublistValue('recmachcustrecord_scv_yccc_line_so_phieu', 'custrecord_scv_yccc_item', line);
            let lkFieldsLotNumItem = search.lookupFields({
                type: 'item',//'lotnumberedassemblyitem',
                id: itemId,
                columns: ['displayname', 'custitem_scv_ls', 'custitem_scv_width', 'custitem_scv_length']
            });
            lineItem.stt = line + 1;
            lineItem.itemId = itemId;
            lineItem.custrecord_scv_yccc_itf_date = formatDateToDDMMYYYY(rec.getSublistValue('recmachcustrecord_scv_yccc_line_so_phieu', 'custrecord_scv_yccc_itf_date', line));
            lineItem.displayname = lkFieldsLotNumItem.displayname;
            lineItem.custrecord_scv_yccc_category = rec.getSublistValue('recmachcustrecord_scv_yccc_line_so_phieu', 'custrecord_scv_yccc_category_display', line);
            lineItem.itemLot = rec.getSublistValue('recmachcustrecord_scv_yccc_line_so_phieu', 'custrecord_scv_yccc_lot_number', line) || rec.getSublistValue('recmachcustrecord_scv_yccc_line_so_phieu', 'custrecord_scv_yccc_manual_lot', line) ;
            lineItem.custrecord_scv_yccc_units_display = rec.getSublistValue('recmachcustrecord_scv_yccc_line_so_phieu', 'custrecord_scv_yccc_units_display', line);
            lineItem.custrecord_scv_yccc_qty = rec.getSublistValue('recmachcustrecord_scv_yccc_line_so_phieu', 'custrecord_scv_yccc_qty', line);
            // lineItem.itf = rec.getSublistValue('recmachcustrecord_scv_yccc_line_so_phieu', 'custrecord_scv_yccc_line_itf', line);
            lineItem.so = rec.getSublistValue('recmachcustrecord_scv_yccc_line_so_phieu', 'custrecord_scv_yccc_so_doc', line); // so
            lineItem.itf = rec.getSublistValue('recmachcustrecord_scv_yccc_line_so_phieu', 'custrecord_scv_yccc_line_itf', line); // so
        }

        // start lấy dữ liệu ACP thick
        const putDataTemplateAcp = (renderer, rec_cccl, isThick) => {
            libPdf.addFontVietnamese(renderer);
            let result = getItemsDataTemplAcp(rec_cccl, isThick);
            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: 'items',
                data: {
                    result,
                }
            })
        }

        const getItemsDataTemplAcp = (rec_cccl, isThick) => {
            let dataKetQua = getItemsKqAcp(rec_cccl);
            let dataYCChiTiet = getItemsYCCTAcp(rec_cccl);

            // Bước 1: Nhóm dữ liệu kết quả QC vào một "kho" (groupedKq) theo bộ khóa định danh
            let groupedKq = {};
            dataKetQua.forEach(kq => {
                let key = `${kq.itemId}_${kq.itemLot}_${kq.so}_${kq.itf}_${kq.custrecord_scv_cccl_result_shipped_date}_${Number(kq.custrecord_scv_cccl_result_qty)}`;
                if (!groupedKq[key]) groupedKq[key] = [];
                groupedKq[key].push(kq);
            });

            let result = [];

            // Bước 2: Duyệt qua từng dòng yêu cầu chi tiết (YCCT) để khớp nối kết quả
            dataYCChiTiet.forEach(yc => {
                let key = `${yc.itemId}_${yc.itemLot}_${yc.so}_${yc.itf}_${yc.custrecord_scv_yccc_itf_date}_${Number(yc.custrecord_scv_yccc_qty)}`;
                let pool = groupedKq[key];

                if (pool && pool.length > 0) {
                    // Nhóm pool theo idTieuChi để bốc đúng 1 record/tiêu chí cho mỗi dòng YCCT
                    let tieuChiGroups = {};
                    pool.forEach(kq => {
                        if (!tieuChiGroups[kq.idTieuChi]) tieuChiGroups[kq.idTieuChi] = [];
                        tieuChiGroups[kq.idTieuChi].push(kq);
                    });

                    // Lấy ra đúng 1 record cho mỗi idTieuChi hiện có trong pool và "tiêu thụ" nó
                    let myKqLines = Object.keys(tieuChiGroups)
                        .sort((a, b) => Number(a) - Number(b)) // Đảm bảo thứ tự tiêu chí
                        .map(id => tieuChiGroups[id].splice(0, 1)[0]) // Lấy 1 bản ghi ra khỏi kho
                        .filter(Boolean);

                    // Cập nhật lại pool sau khi đã bị splice trong các group nhỏ
                    groupedKq[key] = Object.values(tieuChiGroups).flat();

                    result.push({
                        ...yc,
                        listTieuChi: myKqLines.map(kq => ({
                            tieuChi: kq.tieuChi.toUpperCase(),
                            kqTieuChi: kq.kqNumber
                        }))
                    });
                } else {
                    result.push({ ...yc, listTieuChi: [] });
                }
            });

            return isThick ? result : dataKetQua;
        }

        const getItemsYCCTAcp = (rec) => {
            let lineNum = rec.getLineCount('recmachcustrecord_scv_yccc_line_so_phieu');
            let dataYeuCauChiTieu = [];
            for (let i = 0; i < lineNum; i++) {
                let lineItem = {};
                getDataLotNumItemAcp(rec, lineItem, i);
                dataYeuCauChiTieu.push(lineItem);
            }
            return dataYeuCauChiTieu;
        }

        const getDataLotNumItemAcp = (rec, lineItem, line) => {
            let itemId = rec.getSublistValue('recmachcustrecord_scv_yccc_line_so_phieu', 'custrecord_scv_yccc_item', line);
            let lkFieldsLotNumItem = search.lookupFields({
                type: 'lotnumberedassemblyitem',
                id: itemId,
                columns: ['displayname', 'custitem_scv_ls', 'custitem_scv_width', 'custitem_scv_length']
            });
            lineItem.stt = line + 1;
            lineItem.itemId = itemId;
            lineItem.custrecord_scv_yccc_itf_date = formatDateToDDMMYYYY(rec.getSublistValue('recmachcustrecord_scv_yccc_line_so_phieu', 'custrecord_scv_yccc_itf_date', line));
            lineItem.displayname = lkFieldsLotNumItem.displayname;
            lineItem.custitem_scv_ls = lkFieldsLotNumItem.custitem_scv_ls[0]?.text.split(':')[1].split(' ')[0];
            lineItem.kichThuoc = lkFieldsLotNumItem.custitem_scv_width ? `${lkFieldsLotNumItem.custitem_scv_width}x${lkFieldsLotNumItem.custitem_scv_length}` : '';
            lineItem.itemLot = rec.getSublistValue('recmachcustrecord_scv_yccc_line_so_phieu', 'custrecord_scv_yccc_lot_number_display', line) || rec.getSublistValue('recmachcustrecord_scv_yccc_line_so_phieu', 'custrecord_scv_yccc_manual_lot', line)  ;
            lineItem.custrecord_scv_yccc_units_display = rec.getSublistValue('recmachcustrecord_scv_yccc_line_so_phieu', 'custrecord_scv_yccc_units_display', line);
            lineItem.custrecord_scv_yccc_qty = rec.getSublistValue('recmachcustrecord_scv_yccc_line_so_phieu', 'custrecord_scv_yccc_qty', line);
            // lineItem.itf = rec.getSublistValue('recmachcustrecord_scv_yccc_line_so_phieu', 'custrecord_scv_yccc_line_itf', line);
            lineItem.ori_line_id = rec.getSublistValue('recmachcustrecord_scv_yccc_line_so_phieu', 'custrecord_scv_yccc_ori_id', line); // ori_line_id
            lineItem.so = rec.getSublistValue('recmachcustrecord_scv_yccc_line_so_phieu', 'custrecord_scv_yccc_so_doc', line); // so
            lineItem.itf = rec.getSublistValue('recmachcustrecord_scv_yccc_line_so_phieu', 'custrecord_scv_yccc_line_itf', line); // so

            lineItem.custrecord_scv_yccc_line_stt = rec.getSublistValue('recmachcustrecord_scv_yccc_line_so_phieu', 'custrecord_scv_yccc_line_stt', line); // custrecord_scv_yccc_line_stt
        }

        const getItemsKqAcp = (rec) => {
            let lineNum = rec.getLineCount('recmachcustrecord_scv_cccl_result_no');
            let dataKQ = [];

            for (let i = 0; i < lineNum; i++) {
                let lineData = {};
                lineData.itemId = rec.getSublistValue('recmachcustrecord_scv_cccl_result_no', 'custrecord_scv_cccl_result_item', i); // custrecord_scv_cccl_result_item

                let lkFieldsLotNumItem = search.lookupFields({
                    type: 'lotnumberedassemblyitem',
                    id: lineData.itemId,
                    columns: ['displayname', 'custitem_scv_ls', 'custitem_scv_width', 'custitem_scv_length']
                });

                lineData.displayname = lkFieldsLotNumItem.displayname;
                lineData.custitem_scv_ls = lkFieldsLotNumItem.custitem_scv_ls[0]?.text.split(':')[1].split(' ')[0];
                lineData.kichThuoc = lkFieldsLotNumItem.custitem_scv_width ? `${lkFieldsLotNumItem.custitem_scv_width}x${lkFieldsLotNumItem.custitem_scv_length}` : '';
                lineData.itemLot = rec.getSublistText('recmachcustrecord_scv_cccl_result_no', 'custrecord_scv_cccl_result_lot', i) || rec.getSublistText('recmachcustrecord_scv_cccl_result_no', 'custrecord_scv_cccl_result_m_lot', i) ; // custrecord_scv_cccl_result_lot
                let arrTieuChi = rec.getSublistValue('recmachcustrecord_scv_cccl_result_no', 'custrecord_scv_cccl_tieu_chi_display', i).split('_');
                lineData.tieuChi = arrTieuChi[arrTieuChi.length - 1];
                lineData.custrecord_scv_cccl_result_kq_text = rec.getSublistValue('recmachcustrecord_scv_cccl_result_no', 'custrecord_scv_cccl_result_kq_text', i);
                lineData.tieuChi = rec.getSublistValue('recmachcustrecord_scv_cccl_result_no', 'custrecord_scv_cccl_result_kq_text', i);
                lineData.custrecord_scv_cccl_result_pass_fail = rec.getSublistValue('recmachcustrecord_scv_cccl_result_no', 'custrecord_scv_cccl_result_pass_fail', i) === "2" ? "Đạt" : "Không đạt";
                lineData.kqNumber = rec.getSublistValue('recmachcustrecord_scv_cccl_result_no', 'custrecord_scv_cccl_result_kq_number', i);
                // lineData.itf = rec.getSublistValue('recmachcustrecord_scv_cccl_result_no', 'custrecord_scv_cccl_result_itf', i);
                lineData.idTieuChi = Number(rec.getSublistValue('recmachcustrecord_scv_cccl_result_no', 'custrecord_scv_cccl_tieu_chi', i)); // id tiêu chí
                lineData.so  = rec.getSublistValue('recmachcustrecord_scv_cccl_result_no', 'custrecord_scv_cccl_result_so', i);
                lineData.itf = rec.getSublistValue('recmachcustrecord_scv_cccl_result_no', 'custrecord_scv_cccl_result_itf', i);
                lineData.custrecord_scv_yccc_qty = rec.getSublistValue('recmachcustrecord_scv_cccl_result_no', 'custrecord_scv_cccl_result_qty', i);
                lineData.custrecord_scv_cccl_result_qty = rec.getSublistValue('recmachcustrecord_scv_cccl_result_no', 'custrecord_scv_cccl_result_qty', i);
                lineData.custrecord_scv_cccl_result_shipped_date = rec.getSublistText('recmachcustrecord_scv_cccl_result_no', 'custrecord_scv_cccl_result_shipped_date', i);
                lineData.custrecord_scv_yccc_itf_date = rec.getSublistText('recmachcustrecord_scv_cccl_result_no', 'custrecord_scv_cccl_result_shipped_date', i);
                lineData.custrecord_scv_cccl_result_unit_display = rec.getSublistValue('recmachcustrecord_scv_cccl_result_no', 'custrecord_scv_cccl_result_unit_display', i);
                dataKQ.push(lineData);
            }
            return dataKQ;
        }

        const formatDateToDDMMYYYY = (date) => {
            if (util.isDate(date)) {
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                return `${day}/${month}/${year}`;
            }
        }

        return {onRequest}

    });
