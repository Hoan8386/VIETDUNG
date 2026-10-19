/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define([
        'N/render', 'N/search', 'N/record', 'N/query', 'N/config',
        '../lib/scv_lib_pdf.js', '../olib/lodash.min', '../lib/scv_lib_function',
        'N/runtime', '../lib/scv_lib_amount_in_word', '../common/scv_common_theo_doi_phieu_in'
    ],
    (
        render, search, record, query, config,
        libPdf, _, lfunc, runtime, libAmount, comPhieuIn
    ) => {
        // /**
        //  * Defines the Suitelet script trigger point.
        //  * @param {Object} scriptContext
        //  * @param {ServerRequest} scriptContext.request - Incoming request
        //  * @param {ServerResponse} scriptContext.response - Suitelet response
        //  * @since 2015.2
        //  */

        const renderRecordToPdfWithTemplate = (id, type, printfile) => {
            if (!printfile) throw "Chưa có setup file xml!";
            let renderer = libPdf.renderTemplateWithXml(printfile);
            let rec = addDefaultRecordRender(renderer, type, id);
            renderer.addRecord('record', rec);
            switch (printfile) {
                case 'scv_render_scts_hc_pdf' :
                    printSCBDTS(rec, renderer, id); // Phiếu sửa chữa bảo dưỡng tài sản
                    break;
                case "scv_render_ycbd_pdf":
                    printKHBD(rec, renderer, id); // Kế hoạch bảo dưỡng
                    break;
                case "scv_render_bbkt_pdf":
                    printPDGTS(rec, renderer, id); // Phiếu đánh giá tài sản
                    break;
                case "scv_render_scsc_pdf":
                    printPSCBD(rec, renderer, id); // Phiếu sửa chữa bảo dưỡng
                    break;
                case "scv_render_bbkd_pdf":
                    printBBKD(rec, renderer); // Hiệu chuẩn thiết bị đo
                    break;
                case "scv_render_bbbg_pdf":
                    printBBBG(rec, renderer); // Hiệu chuẩn thiết bị đo
                    break;
                case "scv_render_ycnxk_pdf":
                    printYCNXK(rec, renderer); // Yêu cầu nhập xuất kho
                    break;
                // 5/3/2025 ThanhDev add mẫu
                case "scv_render_ycnxn_pdf":
                    printYCNXN(rec, renderer); // Yêu cầu nhập xuất nhập
                    break;
                case "scv_render_ycnxx_pdf":
                    printYCNXX(rec, renderer); // Yêu cầu nhập xuất xuất
                    break;
                // 5/3/2025 ThanhDev end
                case "scv_render_pxk_pdf":
                    printPXK(rec, renderer, type); // Phiếu xuất kho
                    break;
                case "scv_render_pnk_pdf":
                case "scv_render_pnk_qc_pdf":
                    printPNK(rec, renderer, type, printfile); // Phiếu nhập kho
                    break;
                case "scv_render_ycdc_pdf":
                    printYCDC(rec, renderer); // Transfer Order
                    break;
                case "scv_render_pcvt_pdf":
                    printPCVT(rec, renderer); // Phiếu chuyển vị trí (Bin Transfer)
                    break;
                case "scv_render_tem_cuon_nhom":
                case "scv_render_nhom_acp":
                case "scv_render_nhom_tran":
                    printTemCuonNhom(rec, renderer, printfile); // Item Receipt
                    break;
                case "scv_lenhnhaphang":
                    printLNH(rec, renderer, id); // Phiếu đánh giá tài sản
                    break;
                case 'scv_render_pxk_co_gia_pdf':
                case 'scv_render_pxk_khong_gia_pdf':
                case 'scv_render_pxk_co_gia_pdf_v2':
                case 'scv_render_pxk_khong_gia_pdf_v2':
                    printPxkVer2(rec, renderer); // Phiếu xuất kho kiêm biên bản giao nhận hàng hóa chính là phiếu xuất bán bản mới
                    break;
                case 'scv_render_lct_mb_pdf':
                case 'scv_render_lct_scb_pdf':
                case 'scv_render_lct_vcb_pdf':
                    printLCT(rec, renderer);
                    break;
                case 'scv_render_bbnt_tbi_pdf':
                    printBBNT(rec, renderer);
                    break;
                case 'scv_render_bbnt_ban_giao_pdf':
                    printBBNTBG(rec, renderer);
                    break;
            }
            // log.error('type - id - template', `${type}-${id}-${printfile}`);
            if (!type.includes('customrecord') && !type.includes('inboundshipment')) {
                comPhieuIn.createPhieuTheoDoi(id, printfile);
            }
            return renderer.renderAsPdf();
        }

        const printBBNT = (rec, renderer) => {
                let lcChiTiet = rec.getLineCount({sublistId: 'recmachcustrecord_scv_accept_detail_no'});
                let arrItem = [];
                for(let i = 0; i < lcChiTiet; i++) {
                    arrItem.push({
                        ten_vat_tu: rec.getSublistValue({sublistId: 'recmachcustrecord_scv_accept_detail_no', fieldId: 'custrecord_scv_accept_detail_item', line: i}) || '',
                        tc_nghiem_thu: rec.getSublistValue({sublistId: 'recmachcustrecord_scv_accept_detail_no', fieldId: 'custrecord_scv_accept_detail_tdesc', line: i}) || '',
                        kq: rec.getSublistValue({sublistId: 'recmachcustrecord_scv_accept_detail_no', fieldId: 'custrecord_scv_accept_detail_result', line: i}) || '',
                        cotai: rec.getSublistValue({sublistId: 'recmachcustrecord_scv_accept_detail_no', fieldId: 'custrecord_scv_accept_detail_co_tai', line: i}) || '',
                        khongtai: rec.getSublistValue({sublistId: 'recmachcustrecord_scv_accept_detail_no', fieldId: 'custrecord_scv_accept_detail_ko_tai', line: i}) || '',
                    })
                }

                // Tính rowspan theo nhóm (Tên vật tư + Tiêu chuẩn nghiệm thu)
                let countByKey = {};
                arrItem.forEach((item) => {
                    const key = `${item.ten_vat_tu}`;
                    countByKey[key] = (countByKey[key] || 0) + 1;
                });

                let seenKey = {};
                arrItem.forEach((item) => {
                         const key = `${item.ten_vat_tu}`;
                         const span = countByKey[key] || 1;
                         item.rowspan = seenKey[key] ? 0 : span;
                         item.tc_rowspan = item.rowspan; // dùng chung để rowspan cột Tiêu chuẩn
                         seenKey[key] = true;

                         if(item.cotai === true) item.cotai = 'Đạt';
                         if(item.cotai === false) item.cotai = 'Không đạt';
                         if(item.khongtai === true) item.khongtai = 'Đạt';
                         if(item.khongtai === false) item.khongtai = 'Không đạt ';
                })

                renderer.addCustomDataSource({
                    format: render.DataSource.OBJECT,
                    alias: "items",
                    data: {
                        arrItem: arrItem
                    }
                })
        }

        const escapeXmlKeepBr = (str) => {
            return (str || '')
                .split('\n')
                .map(line => line
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                )
                .join('<br/>');
        }

        const printBBNTBG = (rec, renderer) => {
            let lcChiTiet = rec.getLineCount({sublistId: 'recmachcustrecord_scv_accept_detail_no'});
            let arrItem = [];
            for(let i = 0; i < lcChiTiet; i++) {
                arrItem.push({
                    ten_vat_tu: escapeXmlKeepBr(rec.getSublistValue({sublistId: 'recmachcustrecord_scv_accept_detail_no', fieldId: 'custrecord_scv_accept_detail_item', line: i})),
                    tc_nghiem_thu: rec.getSublistValue({sublistId: 'recmachcustrecord_scv_accept_detail_no', fieldId: 'custrecord_scv_accept_detail_tdesc', line: i}) || '',
                    kq: escapeXmlKeepBr(rec.getSublistValue({sublistId: 'recmachcustrecord_scv_accept_detail_no', fieldId: 'custrecord_scv_accept_detail_result', line: i})),
                    cotai: rec.getSublistValue({sublistId: 'recmachcustrecord_scv_accept_detail_no', fieldId: 'custrecord_scv_accept_detail_co_tai', line: i}) || '',
                    khongtai: rec.getSublistValue({sublistId: 'recmachcustrecord_scv_accept_detail_no', fieldId: 'custrecord_scv_accept_detail_ko_tai', line: i}) || '',
                })
            }

            let countByKey = {};
            arrItem.forEach((item) => {
                const key = `${item.ten_vat_tu}`;
                countByKey[key] = (countByKey[key] || 0) + 1;
            });

            let seenKey = {};
            arrItem.forEach((item) => {
                const key = `${item.ten_vat_tu}`;
                const span = countByKey[key] || 1;
                item.rowspan = seenKey[key] ? 0 : span;
                seenKey[key] = true;

                if(item.cotai === true) item.cotai = 'Đạt';
                if(item.cotai === false) item.cotai = 'Không đạt';
                if(item.khongtai === true) item.khongtai = 'Đạt';
                if(item.khongtai === false) item.khongtai = 'Không đạt ';
            })

            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: "items",
                data: {
                    arrItem: arrItem
                }
            })
        }

        const printLCT = (rec, renderer) => {
               let idEntity = rec.getValue('entity');
               let entityType = lfunc.getEntityType(idEntity);
               let lkFieldsEnt = search.lookupFields({
                     id: idEntity,
                     type: entityType,
                     columns: ['address','address.addressee','phone']
               });
               renderer.addCustomDataSource({
                        format: render.DataSource.OBJECT,
                        alias: "jsonData",
                        data: {
                            entityAddress: lkFieldsEnt?.address ,
                            entityPhone: lkFieldsEnt['phone'],
                        }
               });

               let idSubsidiary = rec.getValue('subsidiary');
               if(idSubsidiary) {
                    let subsidiary = record.load({
                        id: idSubsidiary,
                        type: 'subsidiary'
                    });
                    renderer.addRecord('subsidiary', subsidiary);

                    let lkFieldsEmployee = search.lookupFields({
                        id : idSubsidiary,
                        type : 'subsidiary',
                        columns: ['custrecord_scv_sub_representative.custentity_scv_position_st'],
                    });

                    renderer.addCustomDataSource({
                      alias: 'employee',
                        format: render.DataSource.OBJECT,
                        data: {
                            position: lkFieldsEmployee['custrecord_scv_sub_representative.custentity_scv_position_st'][0]?.text || ''
                        }
                    })
               }
        }

        const printPxkVer2 = (recItf, renderer) => {
            let arrItems = [];
            // let strQuery = `SELECT so.id AS transaction_id,
            //                        so.custbody_scv_order_type AS so_order_type,
            //                        transline.item,
            //                        transline.custcol_scv_gia_thanh_toan,
            //                        transline.custcol_scv_ori_lineid
            //                 FROM transaction so
            //                          JOIN transactionLine transline ON (so.id = transline.transaction)
            //                 WHERE so.recordtype = 'salesorder'
            //                   AND so.id = ${recItf.getValue('createdfrom')}
            //                   And transline.accountinglinetype is not null`

            // lấy dòng giá tiền thanh toán từ salesorder tương ứng với mỗi oriline_id trên các line của itemfulfillment
            // const arrTransactionLines = query.runSuiteQL({query: strQuery}).asMappedResults();
            const arrTransactionLines = getLinesFromSalesOrder(recItf.getValue('createdfrom'));
            const lineCount = recItf.getLineCount({sublistId: 'item'});
            for (let i = 0; i < lineCount; i++) {
                let objItemLine = {};
                objItemLine.item_display = recItf.getSublistText('item', 'description', i) || recItf.getSublistText('item', 'displayname', i);
                objItemLine.item_id = recItf.getSublistValue('item', 'item', i);
                objItemLine.unitdisplay = recItf.getSublistText('item', 'unitsdisplay', i);
                objItemLine.memo = recItf.getSublistValue('item', 'custcol_scv_memo', i);
                objItemLine.lineId = recItf.getSublistValue('item', 'custcol_scv_ori_lineid', i);

                if (arrTransactionLines[0].so_order_type == '8') {
                    objItemLine.dongia = arrTransactionLines.find(itemLine => {
                        return (itemLine.custcol_scv_ori_lineid == objItemLine.lineId)
                    })?.custcol_scv_gia_thanh_toan;
                } else {
                    objItemLine.dongia = arrTransactionLines.find(itemLine => {
                        return (itemLine.custcol_scv_ori_lineid == objItemLine.lineId)
                    })?.custcol_scv_gia_thanh_toan_xuat_khau;
                }
                // mỗi line có inventorydetail có thể add thành nhiều line với quantity tương ứng với lô
                addItemsIfLotToArrItems(recItf, arrItems, objItemLine, i);
            }
            const tongThanhTien = arrItems.reduce((sum, item) => sum + item.thanhtien, 0)
            const tongSoLuong = arrItems.reduce((sum, item) => sum + item.quantity, 0)
            const docThanhTien = tongThanhTien ? libAmount.DocTienBangChu(tongThanhTien, recItf.getValue('currencycode')) : ''
            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: "items",
                data: {
                    arrItems: arrItems,
                    tongThanhTien: tongThanhTien,
                    tongSoLuong: tongSoLuong,
                    docThanhTien
                }
            });

            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: "additionalData",
                data: {
                    ngayin: new Date().toLocaleString('vi-VN', {timeZone: 'Asia/Ho_Chi_Minh'})
                }
            });

            let idEntity = recItf.getValue('entity');
            if (idEntity) {
                let lkFieldsEntity = search.lookupFields({
                    type: 'entity',
                    id: idEntity,
                    columns: ['recordtype']
                });

                let lkFieldsEntityData = search.lookupFields({
                    type: lkFieldsEntity?.recordtype,
                    id: idEntity,
                    columns: ['companyname']
                });

                renderer.addCustomDataSource({
                    format: render.DataSource.OBJECT,
                    alias: "entityData",
                    data: {
                        companyname: lkFieldsEntityData.companyname || ''
                    }
                });
            }
        }

        const getLinesFromSalesOrder = (idSo) => {
            if (idSo) {
                let arrItemSo = [];
                let recSo = record.load({
                    id: idSo,
                    type: 'salesorder'
                });

                const lineCount = recSo.getLineCount({sublistId: 'item'});
                for (let i = 0; i < lineCount; i++) {
                    arrItemSo.push({
                        item: recSo.getSublistValue('item', 'item', i),
                        custcol_scv_gia_thanh_toan: recSo.getSublistValue('item', 'custcol_scv_gia_thanh_toan', i),
                        custcol_scv_ori_lineid: recSo.getSublistValue('item', 'custcol_scv_ori_lineid', i),
                        so_order_type: recSo.getValue('custbody_scv_order_type'),
                        custcol_scv_gia_thanh_toan_xuat_khau:
                            Number(recSo.getSublistValue('item', 'grossamt', i)) /
                            Number(recSo.getSublistValue('item', 'quantity', i))
                    });
                }
                return arrItemSo;
            }
        }

        const addItemsIfLotToArrItems = (recItemFulfillment, arrItems, objItemLine, line) => {
            const idInventoryDetail = recItemFulfillment.getSublistValue('item', 'inventorydetail', line);
            if (idInventoryDetail) {
                const idLocation = recItemFulfillment.getSublistValue('item', 'location', line);
                const subRecInvDtl = recItemFulfillment.getSublistSubrecord('item', 'inventorydetail', line);
                const lines = subRecInvDtl.getLineCount('inventoryassignment');
                for (let i = 0; i < lines; i++) {
                    let objToPush = {...objItemLine};
                    const idLotNumber = subRecInvDtl.getSublistValue('inventoryassignment', 'issueinventorynumber', i);
                    if (idLocation == 175|| idLocation == 417) {   // NM2 (56112) + NM3 (56113) -> ẩn lô
                        let lkFieldsInvNumber = search.lookupFields({
                            type: 'inventorynumber',
                            id: idLotNumber,
                            columns: ['custitemnumber_scv_item_num_color_seri']
                        });
                        objToPush.lo = lkFieldsInvNumber[0]?.custitemnumber_scv_item_num_color_seri || '';
                    } else {
                        objToPush.lo = subRecInvDtl.getSublistText('inventoryassignment', 'issueinventorynumber', i);
                    }
                    objToPush.quantity = subRecInvDtl.getSublistValue('inventoryassignment', 'quantity', i);
                    objToPush.thanhtien = parseFloat((objToPush.quantity * objToPush.dongia).toFixed(2));
                    arrItems.push(objToPush);
                }
            } else {
                objItemLine.quantity = recItemFulfillment.getSublistValue('item', 'quantity', line);
                objItemLine.thanhtien = objItemLine.quantity * objItemLine.dongia;
                arrItems.push(objItemLine);
            }
        }

        const printSCBDTS = (rec, renderer, id) => {
            let today = new Date().toLocaleDateString("en-GB", {timeZone: "Asia/Ho_Chi_Minh"});
            addNguoiTaoPhieuSCBDTS(rec, renderer);
            addNguoiThucHienSCBDTS(rec, renderer);
            addAdmAsset(rec, renderer);
            // addBgAsset(rec, renderer);
            addBgAssetVer2(rec, renderer);

            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: "additionalData",
                data: {
                    today: today
                }
            })
        }

        const addNguoiThucHienSCBDTS = (rec, renderer) => {
            let idEmployee = rec.getValue('custrecord_scv_cmms_wo_pic');
            let lkFieldsNguoiPheDuyet = {};
            if (idEmployee) {
                let employee = search.lookupFields({
                    type: search.Type.EMPLOYEE,
                    id: idEmployee,
                    columns: ['custentity_scv_legal_name', 'supervisor']
                });
                if(employee.supervisor) {
                    let entityType = lfunc.getEntityType(employee.supervisor[0]?.value);
                    lkFieldsNguoiPheDuyet = search.lookupFields({
                        type : entityType,
                        id: employee.supervisor[0]?.value,
                        columns : ['custentity_scv_legal_name']
                    });
                }

                renderer.addCustomDataSource({
                    format: render.DataSource.OBJECT,
                    alias: "nguoiThucHienData",
                    data: {
                        legalName: employee.custentity_scv_legal_name || '',
                        custentity_scv_legal_name: lkFieldsNguoiPheDuyet.custentity_scv_legal_name
                    }
                })
            }
        }

        const addBgAssetVer2 = (rec, renderer) => {
            let arrVatTuThayThe = [];
            let arrVatTuThuHoi = [];
            // search cần có id, mà không lấy được id của dự toán vì không phải sublist chuẩn
            let arrDuToan = [];
            // suwr dụng cả query và sublist vì không lấy được đơn vị tính trực tiếp từ sublist
            let objQuery =
                query.runSuiteQL({
                query: `SELECT budget.id,
                               budget.custrecord_scv_cmms_bg_recoveredqty,
                               budget.custrecord_scv_cmms_bg_replacementqty,
                               budget.custrecord_scv_cmms_bg_actualitem,
                               budget.custrecord_scv_cmms_bg_item_rep_status,
--                                budget.custrecord_scv_cmms_bg_memo,
                               u.unitname  AS dvt,
                               item.itemid AS tenvattu,
                               item.id as iditem,
                               item.displayname
                        FROM customrecord_scv_cmms_budget AS budget
                                 LEFT JOIN unitstypeUom AS u ON budget.custrecord_scv_cmms_bg_unit = u.internalid
                                 LEFT JOIN item As item ON budget.custrecord_scv_cmms_bg_actualitem = item.id
                        WHERE budget.custrecord_scv_cmms_bg_wo = '${rec.id}'`
            }).asMappedResults();


            let lcDuToan = rec.getLineCount({sublistId : 'recmachcustrecord_scv_cmms_bg_wo'});
            for(let i = 0; i < lcDuToan; i ++){
                let itemId = rec.getSublistValue('recmachcustrecord_scv_cmms_bg_wo', 'id', i);
                arrDuToan.push({
                   tenvattu: rec.getSublistValue('recmachcustrecord_scv_cmms_bg_wo', 'custrecord_scv_cmms_bg_actualitem_display', i),
                    dvt: objQuery.find(s => s.id == itemId)?.dvt
                        // rec.getSublistValue('recmachcustrecord_scv_cmms_bg_wo', 'custrecord_scv_cmms_bg_unit_display', i)
                        ,
                    custrecord_scv_cmms_bg_replacementqty: rec.getSublistValue('recmachcustrecord_scv_cmms_bg_wo', 'custrecord_scv_cmms_bg_replacementqty', i) || 0,
                    custrecord_scv_cmms_bg_recoveredqty: rec.getSublistValue('recmachcustrecord_scv_cmms_bg_wo', 'custrecord_scv_cmms_bg_recoveredqty', i) || 0,
                    custrecord_scv_cmms_bg_item_rep_status: rec.getSublistValue('recmachcustrecord_scv_cmms_bg_wo', 'custrecord_scv_cmms_bg_item_rep_status', i) || '',
                    custrecord_scv_cmms_bg_item_ret_status: rec.getSublistValue('recmachcustrecord_scv_cmms_bg_wo', 'custrecord_scv_cmms_bg_item_ret_status', i) || '',
                    custrecord_scv_cmms_bg_memo: rec.getSublistValue('recmachcustrecord_scv_cmms_bg_wo', 'custrecord_scv_cmms_bg_memo', i) || ''

                });
            }

            for (let i = 0; i < arrDuToan.length; i++) {
                if (arrDuToan[i].custrecord_scv_cmms_bg_replacementqty !== 0) {
                    arrVatTuThayThe.push({
                        tenvattu: arrDuToan[i].tenvattu,
                        dvt: arrDuToan[i].dvt || '',
                        custrecord_scv_cmms_bg_replacementqty: arrDuToan[i].custrecord_scv_cmms_bg_replacementqty,
                        custrecord_scv_cmms_bg_item_rep_status : arrDuToan[i].custrecord_scv_cmms_bg_item_rep_status,
                        custrecord_scv_cmms_bg_memo: arrDuToan[i].custrecord_scv_cmms_bg_memo
                    });
                }
                if (arrDuToan[i].custrecord_scv_cmms_bg_recoveredqty !== 0) {
                    arrVatTuThuHoi.push({
                        tenvattu: arrDuToan[i].tenvattu,
                        dvt: arrDuToan[i].dvt || '',
                        custrecord_scv_cmms_bg_recoveredqty: arrDuToan[i].custrecord_scv_cmms_bg_recoveredqty,
                        custrecord_scv_cmms_bg_item_ret_status : arrDuToan[i].custrecord_scv_cmms_bg_item_ret_status,
                        custrecord_scv_cmms_bg_memo: arrDuToan[i].custrecord_scv_cmms_bg_memo
                    });
                }
            }

            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: "duToan",
                data: {
                    arrVatTuThayThe: arrVatTuThayThe,
                    arrVatTuThuHoi: arrVatTuThuHoi
                }
            })
        }

        const addAdmAsset = (rec, renderer) => {
            let idAsset = rec.getValue('custrecord_scv_cmms_wo_admasset');
            if (idAsset) {
                let asset = search.lookupFields({
                    type: 'item',
                    id: idAsset,
                    columns: ['displayname', 'upccode']
                });

                renderer.addCustomDataSource({
                    format: render.DataSource.OBJECT,
                    alias: "assetData",
                    data: {
                        displayname: asset.displayname || '',
                        upccode: asset.upccode || '',
                    }
                })
            }
        }

        const addNguoiTaoPhieuSCBDTS = (rec, renderer) => {
            let idEmployee = rec.getValue('custrecord_scv_cmms_wo_creator');
            let lkFieldsNguoiQuanLy = {};
            if (idEmployee) {
                let employee = search.lookupFields({
                    type: search.Type.EMPLOYEE,
                    id: idEmployee,
                    columns: ['custentity_scv_legal_name', 'department', 'supervisor']
                });

                if(employee.supervisor) {
                    let entityType = lfunc.getEntityType(employee.supervisor[0]?.value);
                    lkFieldsNguoiQuanLy = search.lookupFields({
                        type : entityType,
                        id: employee.supervisor[0]?.value,
                        columns : ['custentity_scv_legal_name']
                    });
                }

                renderer.addCustomDataSource({
                    format: render.DataSource.OBJECT,
                    alias: "nguoiTaoPhieuData",
                    data: {
                        legalName: employee.custentity_scv_legal_name || '',
                        department: employee.department[0]?.text || '',
                        supervisor: employee.supervisor[0]?.text.split('_')[2] || '',
                        supervisorLegalName: lkFieldsNguoiQuanLy?.custentity_scv_legal_name || ''
                    }
                })
            }
        }

        const getEmployeeInfo = (arrEmpId, arrFields) => {
            let result = {};
            arrEmpId = [...new Set(arrEmpId)].filter(id => id);
            if(arrEmpId.length === 0) return result;

            if (!Array.isArray(arrFields)) arrFields = [arrFields];

            search.create({
                type: 'employee',
                filters: [['internalid', 'anyof', arrEmpId]],
                columns: arrFields
            }).run().each(e => {
                let obj = {};
                arrFields.forEach(field => {
                    let key = typeof field === 'string' ? field : field.name;
                    obj[key] = e.getValue(field);
                    let textVal = e.getText(field);
                    if(textVal) obj[key + '_text'] = textVal;
                });
                result[e.id] = obj;
                return true;
            });
            return result;
        }

        const printKHBD = (rec, renderer, id) => {
            // Optimization for retrieving employee fields
            let createrId = rec.getValue('custrecord_scv_cmms_mp_creater');
            let managerId = rec.getValue('custrecord_scv_cmms_mp_manager_accept');
            let finalAcceptId = rec.getValue('custrecord_scv_cmms_mp_finalaccept');

            const EMP_FIELDS = ['custentity_scv_legal_name'];
            let empInfo = getEmployeeInfo([createrId, managerId, finalAcceptId], EMP_FIELDS);

            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: "employeeInfo",
                data: {
                    creater: empInfo[createrId] || {},
                    manager: empInfo[managerId] || {},
                    finalaccept: empInfo[finalAcceptId] || {}
                }
            });

            let cmms_mp_date = rec.getValue('custrecord_scv_cmms_mp_date');

            let manageracceptdate = rec.getValue('custrecord_scv_cmms_mp_manageracceptdate');
            let managerAcceptDateStr = formatDateDDMMYYYY_VN(manageracceptdate);

            let sublistId = 'recmachcustrecord_scv_cmms_mp_plan_l';
            let mp_date = getTranDate(cmms_mp_date) || "Ngày ..... tháng ...... năm ......";
            let lineCnt = rec.getLineCount({sublistId: sublistId});
            let co_code, eq_code, asset_l_text;
            let rsPlanL = [];
            // let status_l = rec.getText('custrecord_scv_cmms_mp_status')
            for (let i = 0; i < lineCnt; i++) {
                let asset_l = rec.getSublistText({
                    sublistId: sublistId,
                    fieldId: 'custrecord_scv_cmms_mp_asset_l',
                    line: i
                })?.split(' ')[0];
                asset_l_text = rec.getSublistText({
                    sublistId: sublistId,
                    fieldId: 'custrecord_scv_cmms_mp_asset_l',
                    line: i
                })?.replace(asset_l, '')?.trim();
                let component_l = rec.getSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord_scv_cmms_mp_component_l',
                    line: i
                });
                let component_l_text = rec.getSublistText({
                    sublistId: sublistId,
                    fieldId: 'custrecord_scv_cmms_mp_component_l',
                    line: i
                });
                if (component_l) {
                    let componentlkF = search.lookupFields({
                        type: 'customrecord_scv_cmms_component',
                        id: component_l,
                        columns: ['name', 'custrecord_scv_cmms_co_code']
                    })
                    co_code = componentlkF.custrecord_scv_cmms_co_code;
                    component_l_text = component_l_text || componentlkF.name;
                }
                let equipment_l = rec.getSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord_scv_cmms_mp_equipment_l',
                    line: i
                });
                let equipment_l_text = rec.getSublistText({
                    sublistId: sublistId,
                    fieldId: 'custrecord_scv_cmms_mp_equipment_l',
                    line: i
                });
                if (equipment_l) {
                    let componentlkF = search.lookupFields({
                        type: 'customrecord_scv_cmms_equipment',
                        id: equipment_l,
                        columns: ['name', 'custrecord_scv_cmms_eq_code']
                    })
                    eq_code = componentlkF.custrecord_scv_cmms_eq_code;
                    equipment_l_text = equipment_l_text || componentlkF.name;
                }
                // let type_l = rec.getSublistValue({
                //     sublistId: sublistId,
                //     fieldId: 'custrecord_scv_cmms_mp_type_l',
                //     line: i
                // });
                let type_l = String(rec.getSublistText({
                    sublistId: sublistId,
                    fieldId: 'custrecord_scv_cmms_mp_workitem_l_display',
                    line: i
                })).split(':')[0];
                let description_l = rec.getSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord_scv_cmms_mp_description_l',
                    line: i
                });
                let status_l = rec.getSublistText({
                    sublistId: sublistId,
                    fieldId: 'custrecord_scv_cmms_mp_actual_workitem_l',
                    line: i
                })  || rec.getSublistText({
                    sublistId: sublistId,
                    fieldId: 'custrecord_scv_cmms_mp_workitem_l',
                    line: i
                })

                let memo = rec.getSublistValue({
                    sublistId: sublistId,
                   fieldId : 'custrecord_scv_cmms_mp_memo_l',
                    line: i
                })

                let slPlanL = {
                    asset_l_text: asset_l_text,
                    asset_l: asset_l,
                    component_l_text: component_l_text,
                    co_code: co_code,
                    equipment_l_text: equipment_l_text,
                    eq_code: eq_code,
                    type_l: type_l,
                    description_l: description_l,
                    status_l: status_l,
                    memo: memo
                };
                rsPlanL.push(slPlanL);
            }
            // let renderer = render.create();
            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: "jsonData",
                data: {
                    id: id,
                    cmms_mp_date: mp_date,
                    rsPlanL: rsPlanL,
                    asset_l_text: asset_l_text,
                    managerAcceptDate: managerAcceptDateStr

                }
            });
        }

        const printLNH = (curRec, renderer, id) => {
            let lineCnt = curRec.getLineCount({sublistId: "items"});
            let SubId = runtime.getCurrentUser().subsidiary
            let entityId = curRec.getValue('custrecord_scv_inb_employee');
            let employeeId = '';
            let entityType = lfunc.getEntityType(entityId);
            let idNguoiDuyet = curRec.getValue('custrecord_scv_inbound_emp_approve')
            addNguoiDuyet(renderer, idNguoiDuyet);

            if(entityType === 'partner'){
                employeeId = search.lookupFields({
                    type: 'partner',
                    id: entityId,
                    columns: ['custentity_scv_partner_employee']
                }).custentity_scv_partner_employee[0].value ;

            }else{
                employeeId = entityId;
            }

            let employeeRec = record.load({
                type: 'employee',
                id: employeeId
            });

            let subsidiaryRec = record.load({
                type: "subsidiary",
                id: SubId
            });
            renderer.addRecord('subsidiary', subsidiaryRec)
            renderer.addRecord('employee', employeeRec)
            let sublistId = 'items';
            let rsPlanL = [];
            let totalExpected = 0;
            let totalReceived = 0;
            let totalGrossWeight = 0;
            for (let i = 0; i < lineCnt; i++) {
                let obj = {};
                obj.po = curRec.getSublistText(sublistId, 'purchaseorder', i);
                obj.inb_properties = curRec.getSublistText(sublistId, 'custrecord_scv_inb_properties', i);
                obj.unit = curRec.getSublistText(sublistId, 'unit', i);
                obj.location = curRec.getSublistText(sublistId, 'receivinglocation', i);
                obj.vendor = curRec.getSublistText(sublistId, 'povendor', i);
                obj.upc_code = curRec.getSublistText(sublistId, 'custrecord_scv_inbound_upc_code', i);
                obj.item_display = curRec.getSublistText(sublistId, 'shipmentitem_display', i);
                obj.gross_weight = curRec.getSublistValue(sublistId, 'custrecord_scv_gross_weight', i);
                obj.note = curRec.getSublistText(sublistId, 'custrecord_scv_inb_note', i);
                // obj.quantityexpected = curRec.getSublistText(sublistId, 'quantityexpected', i);
                // obj.quantityreceived = curRec.getSublistText(sublistId, 'quantityreceived', i);
                obj.quantityexpected = curRec.getSublistValue(sublistId, 'quantityexpected', i) || 0;
                obj.quantityreceived = curRec.getSublistValue(sublistId, 'quantityreceived', i) || '';
                totalGrossWeight += parseFloat(obj.gross_weight) || 0;
                totalExpected += parseFloat(obj.quantityexpected);
                totalReceived += parseFloat(obj.quantityreceived);
                rsPlanL.push(obj);
            }

            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: "jsonData",
                data: {
                    rsPlanL: rsPlanL,
                    totalExpected,
                    totalReceived,
                    totalGrossWeight

                }
            });
        }

        const addNguoiDuyet = (renderer, idNguoiDuyet) => {
            if(!idNguoiDuyet) return;
            let typeNguoiDuyet = lfunc.getEntityType(idNguoiDuyet);

            if(typeNguoiDuyet === 'employee') {
                let lkFieldsNguoiDuyet = search.lookupFields({
                    type: typeNguoiDuyet,
                    id: idNguoiDuyet,
                    columns: ['custentity_scv_legal_name']
                });

                renderer.addCustomDataSource({
                    alias: 'nguoiDuyet',
                    format: render.DataSource.OBJECT,
                    data: {
                        custentity_scv_legal_name: lkFieldsNguoiDuyet.custentity_scv_legal_name || ''
                    }
                });
            }else if(typeNguoiDuyet === 'partner') {
                let lkFieldsNguoiDuyet = search.lookupFields({
                    type: typeNguoiDuyet,
                    id: idNguoiDuyet,
                    columns: ['custentity_scv_partner_employee']
                });

                if(lkFieldsNguoiDuyet.custentity_scv_partner_employee &&
                    lkFieldsNguoiDuyet.custentity_scv_partner_employee.length > 0) {
                    let idEmployee = lkFieldsNguoiDuyet.custentity_scv_partner_employee[0].value;
                    let employeeRec = record.load({
                        type: 'employee',
                        id: idEmployee
                    });
                    renderer.addRecord('nguoiDuyet', employeeRec);
                }
            }
        }

        const printPDGTS = (rec, renderer, id) => {
            let name = rec.getValue('name');
            let tc_date_d = rec.getText('custrecord_scv_cmms_tc_date_d') || "..../..../20.....";
            let tc_opinion_d = rec.getValue('custrecord_scv_cmms_tc_opinion_d');
            let configLogo = `<img src="https://9684031.app.netsuite.com/core/media/media.nl?id=1&amp;c=9684031&amp;h=mcJr2ucgJbrnayY6oV79rxY8yajRdmcccapTT_sc5To_sjtx&amp;fcts=20240808031643&amp;whence=" alt="view" style="width: 88px; height: 88px;" />`;
            let arrTC = [];
            let listitem = 'recmachcustrecord_scv_cmms_tc_header_d';
            let lineCount = rec.getLineCount(listitem);
            for (let i = 0; i < lineCount; i++) {
                let objTC = {};

                objTC.ten_ccdc = rec.getSublistText(listitem, 'custrecord_scv_cmms_tc_item_d', i) || rec.getSublistText(listitem, 'custrecord_scv_cmms_tc_asset_d', i);
                objTC.tc_unit_d = rec.getSublistText(listitem, 'custrecord_scv_cmms_tc_unit_d', i);
                objTC.tc_quantity_d = rec.getSublistValue(listitem, 'custrecord_scv_cmms_tc_quantity_d', i);
                objTC.tc_curstatus_d = rec.getSublistValue(listitem, 'custrecord_scv_cmms_tc_curstatus_d', i);
                objTC.tc_noofcheck_d = rec.getSublistValue(listitem, 'custrecord_scv_cmms_tc_noofcheck_d', i);
                objTC.tc_age_d = rec.getSublistValue(listitem, 'custrecord_scv_cmms_tc_age_d', i);
                objTC.tc_deliverydate_d = rec.getSublistText(listitem, 'custrecord_scv_cmms_tc_deliverydate_d', i);
                objTC.tc_agecheck_d = rec.getSublistValue(listitem, 'custrecord_scv_cmms_tc_agecheck_d', i);
                objTC.tc_remainage_d = rec.getSublistValue(listitem, 'custrecord_scv_cmms_tc_remainage_d', i);
                objTC.tc_origincost_d = rec.getSublistValue(listitem, 'custrecord_scv_cmms_tc_origincost_d', i);
                objTC.tc_residualpercent_d = rec.getSublistValue(listitem, 'custrecord_scv_cmms_tc_residualpercent_d', i);
                objTC.tc_residualstatus_d = rec.getSublistValue(listitem, 'custrecord_scv_cmms_tc_residualstatus_d', i);
                objTC.tc_deprvalue_d = rec.getSublistValue(listitem, 'custrecord_scv_cmms_tc_deprvalue_d', i);
                objTC.tc_residualvalue_d = rec.getSublistValue(listitem, 'custrecord_scv_cmms_tc_residualvalue_d', i);
                objTC.tc_difference_d = rec.getSublistValue(listitem, 'custrecord_scv_cmms_tc_difference_d', i);
                objTC.tc_rewardamt_d = rec.getSublistValue(listitem, 'custrecord_scv_cmms_tc_rewardamt_d', i);
                objTC.tc_punchamt_d = rec.getSublistValue(listitem, 'custrecord_scv_cmms_tc_punchamt_d', i);
                objTC.tc_reason_d = rec.getSublistValue(listitem, 'custrecord_scv_cmms_tc_reason_d', i);

                // Thêm đối tượng vào mảng arrTC
                arrTC.push(objTC);
            }


            let sublistId = 'recmachcustrecord_scv_cmms_tc_header_l';
            let lineCnt = rec.getLineCount({sublistId: sublistId});
            let rsHeader = [];
            for (let i = 0; i < lineCnt; i++) {
                let tc_employee_l = rec.getSublistText({
                    sublistId: sublistId,
                    fieldId: 'custrecord_scv_cmms_tc_employee_l',
                    line: i
                });
                let tc_position_l = rec.getSublistText({
                    sublistId: sublistId,
                    fieldId: 'custrecord_scv_cmms_tc_position_l',
                    line: i
                });
                let slHeader = {
                    tc_employee_l: tc_employee_l,
                    tc_position_l: tc_position_l,
                };
                rsHeader.push(slHeader);
            }
            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: "jsonData",
                data: {
                    id: id,
                    configLogo: configLogo,
                    rsHeader: rsHeader,
                    arrTC: arrTC,
                    name: name,
                    tc_date_d: tc_date_d,
                    tc_opinion_d: tc_opinion_d

                }
            });
        }

        const printPSCBD = (rec, renderer, id) => {
            let wo_asset = rec.getValue('custrecord_scv_cmms_wo_asset');
            let bg_unit, timeissue, mahieu_vitri, cassetdepartment, creator_department, pic_department, configLogo;
            if (wo_asset) {
                let lkFasset = search.lookupFields({
                    type: 'customrecord_ncfar_asset',
                    id: wo_asset,
                    columns: ['custrecord_assetlocation', 'name', 'custrecord_assetdepartment']
                });
                let location = (lkFasset.custrecord_assetlocation || [])[0]?.text || '';
                let department = (lkFasset.custrecord_assetdepartment || [])[0]?.text || '';
                let assetlocation = escapeXML(location);
                cassetdepartment = escapeXML(department);
                let assetname = lkFasset.name;
                mahieu_vitri = [assetname, assetlocation]
                    .filter(value => value)
                    .join(' / ');
            }

            let wo_creator = rec.getValue('custrecord_scv_cmms_wo_creator');
            let wo_pic = rec.getValue('custrecord_scv_cmms_wo_pic');
            if (wo_creator) {
                let lkFDep = search.lookupFields({
                    type: 'employee',
                    id: wo_creator,
                    columns: ['department']
                });

                let rawDepartment = (lkFDep.department || [])[0]?.text || '';
                creator_department = escapeXML(rawDepartment);
            }
            if (wo_pic) {
                let lkFDep = search.lookupFields({
                    type: 'employee',
                    id: wo_pic,
                    columns: ['department']
                });

                let rawDepartment = (lkFDep.department || [])[0]?.text || '';
                pic_department = escapeXML(rawDepartment);
            }
            let wo_timeissue = rec.getText('custrecord_scv_cmms_wo_timeissue');
            if (wo_timeissue) {
                let parts = wo_timeissue.split(' ');
                let date = parts[0];
                let time = parts[1].split(':');
                let hour = time[0];
                let minute = time[1];
                timeissue = date + ' ' + hour + ' giờ ' + minute + ' phút';
            }
            let wo_actualfromtime = rec.getText('custrecord_scv_cmms_wo_actualfromtime');
            let wo_actualtotime = rec.getText('custrecord_scv_cmms_wo_actualtotime');
            let time_dungmay = rec.getText('custrecord_scv_cmms_wo_totaldowntime')
            let actualtotime = formatTimeToVietnamese(wo_actualtotime);
            let actualfromtime = formatTimeToVietnamese(wo_actualfromtime);
            let timedungmay = formatTimeToVietnamese(time_dungmay);

            let wo_subsidiary = rec.getValue('custrecord_scv_cmms_wo_subsidiary');
            if (wo_subsidiary) {
                let recSub = record.load({
                    type: 'subsidiary',
                    id: wo_subsidiary,
                });
                let logo = recSub.getValue('logo') || recSub.getValue('pagelogo')
                if (logo) {
                    configLogo = libPdf.createImageBySubsidiary(logo, 88, 88)
                } else {
                    configLogo = `<img src="https://9684031.app.netsuite.com/core/media/media.nl?id=1&amp;c=9684031&amp;h=mcJr2ucgJbrnayY6oV79rxY8yajRdmcccapTT_sc5To_sjtx&amp;fcts=20240808031643&amp;whence=" alt="view" style="width: 88px; height: 88px;" />`;
                }
            }
            let sublistId = 'recmachcustrecord_scv_cmms_bg_wo';
            let lineCnt = rec.getLineCount({sublistId: sublistId});
            let rsBGWO = [];
            for (let i = 0; i < lineCnt; i++) {
                let bg_actualitem = rec.getSublistText({
                    sublistId: sublistId,
                    fieldId: 'custrecord_scv_cmms_bg_actualitem',
                    line: i
                });
                let id = rec.getSublistText({
                    sublistId: sublistId,
                    fieldId: 'id',
                    line: i
                });
                if (id) {
                    let lkFBudget = search.lookupFields({
                        type: 'customrecord_scv_cmms_budget',
                        id: id,
                        columns: ['custrecord_scv_cmms_bg_unit']
                    })
                    bg_unit = (lkFBudget.custrecord_scv_cmms_bg_unit || [])[0]?.text || '';
                }
                let bg_actualquantity = rec.getSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord_scv_cmms_bg_actualquantity',
                    line: i
                });
                let slBGWO = {
                    stt: i + 1,
                    bg_actualitem: bg_actualitem,
                    bg_unit: bg_unit,
                    bg_actualquantity: bg_actualquantity,
                };
                rsBGWO.push(slBGWO);
            }
            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: "jsonData",
                data: {
                    id: id,
                    rsBGWO: rsBGWO,
                    configLogo: configLogo,
                    creator_department: creator_department,
                    pic_department: pic_department,
                    cassetdepartment: cassetdepartment,
                    mahieu_vitri: mahieu_vitri,
                    actualfromtime: actualfromtime || ".....giờ.....phút",
                    actualtotime: actualtotime || ".....giờ.....phút",
                    timeissue: timeissue || ".....giờ.....phút",
                    timedungmay : timedungmay || ".....giờ.....phút",
                    wo_timeissue: wo_timeissue,
                }
            });
        }

        const printBBKD = (rec, renderer) => {
            let configLogo = `<img src="https://9684031.app.netsuite.com/core/media/media.nl?id=1&amp;c=9684031&amp;h=mcJr2ucgJbrnayY6oV79rxY8yajRdmcccapTT_sc5To_sjtx&amp;fcts=20240808031643&amp;whence=" alt="view" style="width: 88px; height: 88px;" />`;
            let sublistId = 'recmachcustrecord_scv_hctb_detail_parent';
            let lineCnt = rec.getLineCount({sublistId: sublistId});
            let rsBBKD = [];
            for (let i = 0; i < lineCnt; i++) {
                let detail_thiet_bi = rec.getSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord_scv_hctb_detail_thiet_bi',
                    line: i
                });
                let thietbi_text = rec.getSublistText({
                    sublistId: sublistId,
                    fieldId: 'custrecord_scv_hctb_detail_thiet_bi',
                    line: i
                });
                let detail_tb_it = rec.getSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord_scv_hctb_detail_tb_it',
                    line: i
                });
                let detail_des = rec.getSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord_scv_hctb_detail_des',
                    line: i
                });
                let detail_error = rec.getSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord_scv_hctb_detail_error',
                    line: i
                });
                let detail_legal_name = rec.getSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord_scv_hctb_detail_legal_name',
                    line: i
                });
                let detail_error_standar = rec.getSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord_scv_hctb_detail_error_standar',
                    line: i
                });
                let detail_unit = rec.getSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord_scv_hctb_detail_unit',
                    line: i
                });
                let targer = rec.getSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord_scv_hctb_targer',
                    line: i
                });
                let detail_kq_1st = rec.getSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord_scv_hctb_detail_kq_1st',
                    line: i
                });
                let detail_error_1st = rec.getSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord_scv_hctb_detail_error_1st',
                    line: i
                });
                let detail_kq_2nd = rec.getSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord_scv_hctb_detail_kq_2nd',
                    line: i
                });
                let error_2nd = rec.getSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord_scv_hctb_error_2nd',
                    line: i
                });
                let kq_3rd = rec.getSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord_scv_hctb_kq_3rd',
                    line: i
                });
                let hctb_error_rd = rec.getSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord_scv_hctb_error_rd',
                    line: i
                });

                let detail_modify_date = rec.getSublistText({
                    sublistId: sublistId,
                    fieldId: 'custrecord_scv_hctb_detail_modify_date',
                    line: i
                });
                let failedreason = rec.getSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord_scv_hctb_failedreason',
                    line: i
                });
                let nexttime = rec.getSublistText({
                    sublistId: sublistId,
                    fieldId: 'custrecord_scv_hctb_nexttime',
                    line: i
                });
                let detail_result = rec.getSublistText({
                    sublistId: sublistId,
                    fieldId: 'custrecord_scv_hctb_detail_result',
                    line: i
                });
                let next_time = rec.getSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord_scv_hctb_nexttime',
                    line: i
                });
                let next_time_ntn = getTranDate(next_time) || "Ngày ..... tháng ...... năm ......";
                let detail_modify_date2 = (formatDate(detail_modify_date)) || "Ngày ..... tháng ...... năm ......";

                let slBBKD = {
                    stt: i + 1,
                    detail_thiet_bi: detail_thiet_bi,
                    thietbi_text: thietbi_text,
                    detail_tb_it: detail_tb_it,
                    detail_des: detail_des,
                    detail_error: detail_error,
                    detail_legal_name: detail_legal_name,
                    detail_error_standar: detail_error_standar,
                    detail_unit: detail_unit,
                    targer: targer,
                    detail_kq_1st: detail_kq_1st,
                    detail_error_1st: detail_error_1st,
                    detail_kq_2nd: detail_kq_2nd,
                    error_2nd: error_2nd,
                    kq_3rd: kq_3rd,
                    hctb_error_rd: hctb_error_rd,
                    detail_modify_date: detail_modify_date || '....../....../..........',
                    detail_modify_date2: detail_modify_date2 || '....../....../..........',

                    failedreason: failedreason,
                    nexttime: nexttime || '....../....../..........',
                    detail_result: detail_result,
                    next_time_ntn: next_time_ntn,
                };

                rsBBKD.push(slBBKD);
            }

            let arrData = [], groupData;
            const uniquethietbi = [...new Set(rsBBKD.map(record => record.detail_thiet_bi))];
            for (const thietbiValue of uniquethietbi) {
                groupData = rsBBKD.filter(record => record.detail_thiet_bi === thietbiValue);

                let i = 0;
                for (let obj of groupData) {
                    obj.stt = i + 1;
                    // detail_result = obj.detail_result
                    i++;
                }
                arrData.push({
                    //detail_result: groupData[0].detail_result,
                    thietbi_text: groupData[0].thietbi_text,
                    detail_des: groupData[0].detail_des,
                    detail_tb_it: groupData[0].detail_tb_it,
                    detail_error: groupData[0].detail_error,
                    detail_legal_name: groupData[0].detail_legal_name,
                    detail_error_standar: groupData[0].detail_error_standar,
                    detail_unit: groupData[0].detail_unit,
                    detail_modify_date: groupData[0].detail_modify_date,
                    detail_modify_date2: groupData[0].detail_modify_date2,
                    nexttime: groupData[0].nexttime,
                    next_time_ntn: groupData[0].next_time_ntn,
                    groupData: groupData,
                })
            }

            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: "jsonData",
                data: {
                    arrData: arrData,
                    configLogo: configLogo,
                }
            });
        }

        const printBBBG = (rec, renderer) => {
            let configLogo = `<img src="https://9684031.app.netsuite.com/core/media/media.nl?id=1&amp;c=9684031&amp;h=mcJr2ucgJbrnayY6oV79rxY8yajRdmcccapTT_sc5To_sjtx&amp;fcts=20240808031643&amp;whence=" alt="view" style="width: 66px; height: 66px;" />`;
            let lc = rec.getLineCount({sublistId: 'recmachcustrecord_scv_hctb_detail_parent'});
            let arrData = [];
            let idSub = rec.getValue('custrecord_scv_hctb_sub');
            let recSub = record.load({
                id: idSub,
                type: 'subsidiary',
            });

            for(let i = 0; i < lc; i++) {
                let detail_thiet_bi = rec.getSublistValue({
                    sublistId: 'recmachcustrecord_scv_hctb_detail_parent',
                    fieldId: 'custrecord_scv_hctb_detail_thiet_bi',
                    line: i
                });
                if(detail_thiet_bi) {
                    arrData.push({
                        tenThietBi : rec.getSublistText('recmachcustrecord_scv_hctb_detail_parent', 'custrecord_scv_hctb_detail_thiet_bi', i),
                        maSo : rec.getSublistValue('recmachcustrecord_scv_hctb_detail_parent', 'custrecord_scv_hctb_detail_tb_it', i),
                        daiDo : rec.getSublistValue('recmachcustrecord_scv_hctb_detail_parent', 'custrecord_scv_hctb_detail_des', i),
                        ngayHieuChuan : rec.getSublistText('recmachcustrecord_scv_hctb_detail_parent', 'custrecord_scv_hctb_detail_modify_date', i),
                        hanHieuChuan : rec.getSublistText('recmachcustrecord_scv_hctb_detail_parent', 'custrecord_scv_hctb_nexttime', i),
                        tinhTrang : rec.getSublistText('recmachcustrecord_scv_hctb_detail_parent', 'custrecord_scv_hctbd_detail_status_after', i),
                        ketQuaHieuChuan : rec.getSublistText('recmachcustrecord_scv_hctb_detail_parent', 'custrecord_scv_hctb_detail_result', i),
                        nguoiSuDung : rec.getSublistValue('recmachcustrecord_scv_hctb_detail_parent', 'custrecord_scv_tbd_used_emp_display', i)?.split('_')[2]?.trim() || '',
                        ghiChu : rec.getSublistValue('recmachcustrecord_scv_hctb_detail_parent', 'custrecord_scv_hctb_detail_note', i),
                    })
                }
            }

            // arrData.filter(s => s.tenThietBi  is unique)
            arrData = arrData.filter((s, index, self) => self.findIndex(t => t.tenThietBi === s.tenThietBi) === index);

            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: "jsonData",
                data: {
                    arrData: arrData,
                    state: recSub.getValue('state'),
                    configLogo: configLogo,
                }
            });
        }

        const printYCNXK = (rec, renderer) => {
            let trandate = rec.getValue('trandate');
            let date = getTranDate(trandate)
            let subsidiary = rec.getValue('subsidiary');
            let location = rec.getValue('location');
            let related_transaction = rec.getValue('custbody_scv_related_transaction');
            let tranid = rec.getValue('tranid');
            let employee_ycxvt = rec.getValue('custbody_scv_employee_ycxvt');
            let emp_legal_name;
            if (employee_ycxvt) {
                let lkFEmp = search.lookupFields({
                    type: 'employee',
                    id: employee_ycxvt,
                    columns: ['custentity_scv_legal_name']
                });
                emp_legal_name = lkFEmp.custentity_scv_legal_name;
            }
            let memo = rec.getValue('memo');
            let department = rec.getText('department');
            let ycxvt_type = rec.getText('custbody_scv_ycxvt_type');
            let legalname, mainaddress_text, loc_name, total_nhapxuat = 0, total_yeucau = 0;
            if (subsidiary) {
                let lkFSc = search.lookupFields({
                    type: 'subsidiary',
                    id: subsidiary,
                    columns: ['legalname']
                });
                legalname = lkFSc.legalname;
            }
            if (location) {
                let recLoc = record.load({
                    type: 'location',
                    id: location,
                });
                mainaddress_text = recLoc.getValue('mainaddress_text');
                loc_name = recLoc.getValue('name');
            }
            let slInvDetail = "inventoryassignment";
            let arrIA = [];
            if (Array.isArray(related_transaction) && related_transaction.length > 0) {
                related_transaction.forEach((transactionId) => {
                    let recTrans = record.load({
                        type: 'inventoryadjustment',
                        id: transactionId,
                    });
                    let suiteletIA = 'inventory';
                    for (let k = 0; k < recTrans.getLineCount(suiteletIA); k++) {
                        let inventorydetailavail = recTrans.getSublistValue(suiteletIA, 'inventorydetailreq', k);
                        if (inventorydetailavail === true || inventorydetailavail === 'T') {
                            let InvDetailSubIA = recTrans.getSublistSubrecord(suiteletIA, 'inventorydetail', k);
                            let lcInvDetail = InvDetailSubIA.getLineCount(slInvDetail);
                            for (let j = 0; j < lcInvDetail; j++) {
                                let obj = {};
                                obj.adjustqtyby = recTrans.getSublistValue(suiteletIA, 'adjustqtyby', k);
                                obj.itemIA = recTrans.getSublistValue(suiteletIA, 'item', k);
                                obj.quanIA_InvDetail = InvDetailSubIA.getSublistValue(slInvDetail, 'quantity', j) || '';
                                obj.inventorynumberIA = InvDetailSubIA.getSublistText(slInvDetail, 'issueinventorynumber', j) || '';
                                obj.custcol_scv_ori_lineid = recTrans.getSublistValue(suiteletIA, 'custcol_scv_ori_lineid', k) || '';
                                arrIA.push(obj);
                            }
                        }
                    }
                })
            }
            let suiteletId = 'item', arrItem = [];
            let stt = 1;
            for (let i = 0; i < rec.getLineCount(suiteletId); i++) {
                let quan_xuat = rec.getSublistValue(suiteletId, 'quantity', i);
                let quan_nhap = rec.getSublistValue(suiteletId, 'custcol_scv_plan_qty', i);
                let inventorydetailavail = rec.getSublistValue(suiteletId, 'inventorydetailreq', i);
                if (inventorydetailavail === true || inventorydetailavail === 'T') {
                    let InvDetailSub = rec.getSublistSubrecord(suiteletId, 'inventorydetail', i);
                    let lcInvDetail = InvDetailSub.getLineCount('inventoryassignment');

                    for (let j = 0; j < lcInvDetail; j++) {
                        let line = {};
                        line.stt = stt++;
                        line.item = rec.getSublistValue(suiteletId, 'item', i);
                        let displayname, upccode;
                        if (line.item) {
                            let lkFItem = search.lookupFields({
                                type: lfunc.getItemRecordType(line.item),
                                id: line.item,
                                columns: ['upccode', 'displayname']
                            });
                            upccode = lkFItem.upccode;
                            displayname = lkFItem.displayname;
                        }
                        line.itemText = displayname;
                        line.ori_lineid = rec.getSublistValue(suiteletId, 'custcol_scv_ori_lineid', i);
                        line.description = rec.getSublistValue(suiteletId, 'description', i);
                        line.unit = rec.getSublistText(suiteletId, 'units', i);
                        line.item_code = rec.getSublistValue(suiteletId, 'custcol_scv_tc_item_code', i);
                        line.memo = rec.getSublistValue(suiteletId, 'custcol_scv_memo', i);

                        let inventorynumber = InvDetailSub.getSublistText('inventoryassignment', 'issueinventorynumber', j) || '';
                        // let color_seri = InvDetailSub.getSublistValue('inventoryassignment', 'custitemnumber_scv_item_num_color_seri', j) || '';
                        let inventoryid = InvDetailSub.getSublistValue(slInvDetail, 'issueinventorynumber', j) || InvDetailSub.getSublistValue(slInvDetail, 'numberedrecordid', j);
                        let color_seri;
                        if (inventoryid) {
                            let lkFInvDetail = search.lookupFields({
                                type: 'inventorynumber',
                                id: inventoryid,
                                columns: ['custitemnumber_scv_item_num_color_seri']
                            });
                            color_seri = lkFInvDetail.custitemnumber_scv_item_num_color_seri;
                        }
                        let quan_InvDetail = InvDetailSub.getSublistValue('inventoryassignment', 'quantity', j) || 0;
                        let matchedIA = arrIA.find((ia) =>
                            // ia.itemIA === rec.getSublistValue(suiteletId, 'item', i) && ia.inventorynumberIA === inventorynumber
                            ia.custcol_scv_ori_lineid === rec.getSublistValue(suiteletId, 'custcol_scv_ori_lineid', i)
                        );
                        // if (inventorynumber) {
                        //     matchedIA = arrIA.find((ia) =>
                        //         // ia.itemIA === rec.getSublistValue(suiteletId, 'item', i) && ia.inventorynumberIA === inventorynumber
                        //         ia.custcol_scv_ori_lineid === rec.getSublistValue(suiteletId, 'custcol_scv_ori_lineid', i)
                        //     );
                        // }
                        // else {
                        //     matchedIA = arrIA.find((ia) => ia.itemIA === rec.getSublistValue(suiteletId, 'item', i));
                        // }
                        line.color_seri = color_seri;
                        line.quan_InvDetail = quan_InvDetail;
                        if (quan_xuat) {
                            line.status = InvDetailSub.getSublistText(slInvDetail, 'inventorystatus', j) || '';
                            line.quantity = changeCurrency1(quan_InvDetail) || 0;
                            line.inventorynumber = inventorynumber;
                        } else {
                            line.status = rec.getSublistText(suiteletId, 'custcol_scv_item_status', i);
                            line.quantity = quan_nhap;
                            line.inventorynumber = rec.getSublistValue(suiteletId, 'custcol_supplier_lot', i);
                        }
                        let quanIA = matchedIA ? ((matchedIA.quanIA_InvDetail) || (matchedIA.adjustqtyby)) : 0;
                        quanIA = quanIA < 0 ? Math.abs(quanIA) : quanIA;
                        line.quanIA = changeCurrency1(quanIA, true);

                        arrItem.push(line);
                        total_nhapxuat += quanIA;
                        total_yeucau += quan_InvDetail;
                    }
                } else {
                    let line = {};
                    line.stt = stt++;
                    line.itemText = rec.getSublistText(suiteletId, 'item', i);
                    line.item = rec.getSublistValue(suiteletId, 'item', i);
                    line.ori_lineid = rec.getSublistValue(suiteletId, 'custcol_scv_ori_lineid', i);
                    line.description = rec.getSublistValue(suiteletId, 'description', i);
                    line.unit = rec.getSublistText(suiteletId, 'units', i);
                    line.item_code = rec.getSublistValue(suiteletId, 'custcol_scv_tc_item_code', i);
                    line.memo = rec.getSublistValue(suiteletId, 'custcol_scv_memo', i);
                    line.color_seri = '';
                    line.quantity = changeCurrency1(quan_nhap) || 0;
                    line.status = rec.getSublistText(suiteletId, 'custcol_scv_item_status', i);
                    line.inventorynumber = rec.getSublistValue(suiteletId, 'custcol_supplier_lot', i);
                    let matchedIA = arrIA.find((ia) =>
                        // ia.itemIA === rec.getSublistValue(suiteletId, 'item', i)
                        ia.custcol_scv_ori_lineid === rec.getSublistValue(suiteletId, 'custcol_scv_ori_lineid', i)
                    );
                    let quanIA = matchedIA ? ((matchedIA.adjustqtyby) || (matchedIA.quanIA_InvDetail)) : 0;
                    quanIA = quanIA < 0 ? Math.abs(quanIA) : quanIA;
                    line.quanIA = changeCurrency1(quanIA, true);

                    arrItem.push(line);
                    total_nhapxuat += quanIA;
                    total_yeucau += quan_nhap;
                }
            }
            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: "jsonData",
                data: {
                    arrItem: arrItem,
                    legalname: legalname,
                    emp_legal_name: emp_legal_name,
                    mainaddress_text: mainaddress_text,
                    loc_name: loc_name,
                    date: date,
                    tranid: tranid,
                    memo: memo,
                    department: department,
                    ycxvt_type: ycxvt_type,
                    employee_ycxvt: employee_ycxvt,
                    total_yeucau: changeCurrency1(total_yeucau) || 0,
                    total_nhapxuat: changeCurrency1(total_nhapxuat, true),
                }
            });
        }

        const printYCNXN = (rec, renderer) => {
            let trandate = rec.getValue('trandate');
            let date = getTranDate(trandate)
            let subsidiary = rec.getValue('subsidiary');
            let location = rec.getValue('location');
            let related_transaction = rec.getValue('custbody_scv_related_transaction');
            let tranid = rec.getValue('tranid');
            let employee_ycxvt = rec.getValue('custbody_scv_employee_ycxvt');
            let emp_legal_name;
            if (employee_ycxvt) {
                let lkFEmp = search.lookupFields({
                    type: 'employee',
                    id: employee_ycxvt,
                    columns: ['custentity_scv_legal_name']
                });
                emp_legal_name = lkFEmp.custentity_scv_legal_name;
            }
            let memo = rec.getValue('memo');
            let department = rec.getText('department');
            let ycxvt_type = rec.getText('custbody_scv_ycxvt_type');
            let legalname, mainaddress_text, loc_name, total_nhapxuat = 0, total_yeucau = 0;
            if (subsidiary) {
                let lkFSc = search.lookupFields({
                    type: 'subsidiary',
                    id: subsidiary,
                    columns: ['legalname']
                });
                legalname = lkFSc.legalname;
            }
            if (location) {
                let recLoc = record.load({
                    type: 'location',
                    id: location,
                });
                mainaddress_text = recLoc.getValue('mainaddress_text');
                loc_name = recLoc.getValue('name');
            }
            let slInvDetail = "inventoryassignment";
            let arrIA = [];
            if (Array.isArray(related_transaction) && related_transaction.length > 0) {
                related_transaction.forEach((transactionId) => {
                    let recTrans = record.load({
                        type: 'inventoryadjustment',
                        id: transactionId,
                    });
                    let sublistIA = 'inventory';
                    for (let k = 0; k < recTrans.getLineCount(sublistIA); k++) {
                        let inventorydetailavail = recTrans.getSublistValue(sublistIA, 'inventorydetailreq', k);
                        if (inventorydetailavail === true || inventorydetailavail === 'T') {
                            let InvDetailSubIA = recTrans.getSublistSubrecord(sublistIA, 'inventorydetail', k);
                            let lcInvDetail = InvDetailSubIA.getLineCount(slInvDetail);
                            for (let j = 0; j < lcInvDetail; j++) {
                                let obj = {};
                                obj.adjustqtyby = recTrans.getSublistValue(sublistIA, 'adjustqtyby', k);
                                obj.itemIA = recTrans.getSublistValue(sublistIA, 'item', k);
                                obj.quanIA_InvDetail = InvDetailSubIA.getSublistValue(slInvDetail, 'quantity', j) || '';
                                obj.inventorynumberIA = InvDetailSubIA.getSublistText(slInvDetail, 'issueinventorynumber', j) || '';
                                obj.custcol_scv_ori_lineid = recTrans.getSublistValue(sublistIA, 'custcol_scv_ori_lineid', k) ;
                                obj.line_no = recTrans.getSublistValue(sublistIA, 'custcol_scv_line_no', k) ;
                                arrIA.push(obj);
                            }
                        }
                    }
                })
            }
            let idSublist = 'item', arrItem = [];
            let stt = 1;
            for (let i = 0; i < rec.getLineCount(idSublist); i++) {
                //let quan_xuat = rec.getSublistValue(suiteletId, 'quantity', i);
                let quan_nhap = rec.getSublistValue(idSublist, 'custcol_scv_plan_qty', i);
                let inventorydetailavail = rec.getSublistValue(idSublist, 'inventorydetailreq', i);
                if (quan_nhap > 0) {
                    if (inventorydetailavail === true || inventorydetailavail === 'T') {
                        let InvDetailSub = rec.getSublistSubrecord(idSublist, 'inventorydetail', i);
                        let lcInvDetail = InvDetailSub.getLineCount('inventoryassignment');

                        for (let j = 0; j < lcInvDetail; j++) {
                            let line = {};
                            line.stt = stt++;
                            line.item = rec.getSublistValue(idSublist, 'item', i);
                            let displayname, upccode;
                            if (line.item) {
                                let lkFItem = search.lookupFields({
                                    type: lfunc.getItemRecordType(line.item),
                                    id: line.item,
                                    columns: ['upccode', 'displayname']
                                });
                                upccode = lkFItem.upccode;
                                displayname = lkFItem.displayname;
                            }
                            line.itemText = displayname;
                            line.ori_lineid = rec.getSublistValue(idSublist, 'custcol_scv_ori_lineid', i);
                            line.description = rec.getSublistValue(idSublist, 'description', i);
                            line.unit = rec.getSublistValue(idSublist, 'units_display', i);
                            line.item_code = rec.getSublistValue(idSublist, 'custcol_scv_tc_item_code', i);
                            line.memo = rec.getSublistValue(idSublist, 'custcol_scv_memo', i);

                            let bin = rec.getSublistValue(idSublist, 'custcol_scv_bin_display', i);
                            if( bin ){
                                line.memo = bin + ', ' + line.memo;
                            }
                            let inventorynumber = InvDetailSub.getSublistText('inventoryassignment', 'issueinventorynumber', j) || '';
                            // let color_seri = InvDetailSub.getSublistValue('inventoryassignment', 'custitemnumber_scv_item_num_color_seri', j) || '';
                            let inventoryid = InvDetailSub.getSublistValue(slInvDetail, 'issueinventorynumber', j) || InvDetailSub.getSublistValue(slInvDetail, 'numberedrecordid', j);
                            let color_seri;
                            if (inventoryid) {
                                let lkFInvDetail = search.lookupFields({
                                    type: 'inventorynumber',
                                    id: inventoryid,
                                    columns: ['custitemnumber_scv_item_num_color_seri']
                                });
                                color_seri = lkFInvDetail.custitemnumber_scv_item_num_color_seri;
                            }
                            let quan_InvDetail = InvDetailSub.getSublistValue('inventoryassignment', 'quantity', j) || 0;
                            // let matchedIA = arrIA.find((ia) =>
                            //      ia.custcol_scv_ori_lineid === rec.getSublistValue(idSublist,  'custcol_scv_ori_lineid', i)
                            //         &&
                            //      ia.inventorynumberIA === inventorynumber &&
                            //     ia.itemIA === rec.getSublistValue(idSublist, 'item', i)
                            // )|| arrIA.find((ia) =>
                            //     ia.itemIA === rec.getSublistValue(idSublist, 'item', i)
                            // );

                            let matchedIA = arrIA.find((ia) =>
                                ia.custcol_scv_ori_lineid === rec.getSublistValue(idSublist, 'custcol_scv_ori_lineid', i) &&
                                ia.inventorynumberIA === inventorynumber &&
                                ia.itemIA === rec.getSublistValue(idSublist, 'item', i) &&
                                ia.line_no === rec.getSublistValue(idSublist, 'custcol_scv_line_no', i) &&
                                Math.abs(Number(ia.quanIA_InvDetail)) === Math.abs(Number(quan_InvDetail))
                            ) || arrIA.find((ia) =>
                                ia.itemIA === rec.getSublistValue(idSublist, 'item', i) &&
                                ia.line_no === rec.getSublistValue(idSublist, 'custcol_scv_line_no', i)
                            );

                            // if (inventorynumber) {
                            //     matchedIA = arrIA.find((ia) =>
                            //         ia.itemIA === rec.getSublistValue(suiteletId, 'item', i)
                            //         && ia.inventorynumberIA === inventorynumber);
                            // } else {
                            //     matchedIA = arrIA.find((ia) => ia.itemIA === rec.getSublistValue(suiteletId, 'item', i));
                            // }
                            line.color_seri = color_seri;
                            line.quan_InvDetail = quan_InvDetail;
                            if (quan_xuat) {
                                line.status = InvDetailSub.getSublistText(slInvDetail, 'inventorystatus', j) || '';
                                line.quantity = changeCurrency1(quan_InvDetail) || 0;
                                line.inventorynumber = inventorynumber;
                            } else {
                                line.status = rec.getSublistText(idSublist, 'custcol_scv_item_status', i);
                                line.quantity = quan_nhap;
                                line.inventorynumber = rec.getSublistValue(idSublist, 'custcol_supplier_lot', i);
                            }
                            let quanIA = matchedIA ? ((matchedIA.quanIA_InvDetail) || (matchedIA.adjustqtyby)) : 0;
                            quanIA = quanIA < 0 ? Math.abs(quanIA) : quanIA;
                            line.quanIA = changeCurrency1(quanIA, true);

                            arrItem.push(line);
                            total_nhapxuat += quanIA;
                            total_yeucau += quan_InvDetail;
                        }
                    } else {
                        let line = {};
                        line.item = rec.getSublistValue(idSublist, 'item', i);
                        if (line.item) {
                            let lkFItem = search.lookupFields({
                                type: lfunc.getItemRecordType(line.item),
                                id: line.item,
                                columns: ['upccode', 'displayname']
                            });
                            // upccode = lkFItem.upccode;
                            line.itemText = lkFItem.displayname;
                        }
                        line.stt = stt++;
                        line.ori_lineid = rec.getSublistValue(idSublist, 'custcol_scv_ori_lineid', i);
                        line.description = rec.getSublistValue(idSublist, 'description', i);
                        line.unit = rec.getSublistValue(idSublist, 'units_display', i);
                        line.item_code = rec.getSublistValue(idSublist, 'custcol_scv_tc_item_code', i);
                        line.memo = rec.getSublistValue(idSublist, 'custcol_scv_memo', i);
                        let bin = rec.getSublistValue(idSublist, 'custcol_scv_bin_display', i);
                        if( bin ){
                            line.memo =  bin + ', ' + line.memo;
                        }
                        line.color_seri = '';
                        line.quantity = changeCurrency1(quan_nhap) || 0;
                        line.status = rec.getSublistText(idSublist, 'custcol_scv_item_status', i);
                        line.inventorynumber = rec.getSublistValue(idSublist, 'custcol_supplier_lot', i);
                        // let matchedIA = arrIA.find((ia) =>
                        //     ia.itemIA === rec.getSublistValue(idSublist, 'item', i) &&
                        //     ia.custcol_scv_ori_lineid === rec.getSublistValue(idSublist, 'custcol_scv_ori_lineid', i)
                        // ) || arrIA.find((ia) =>
                        //     ia.itemIA === rec.getSublistValue(idSublist, 'item', i)
                        // );

                        let matchedIA = arrIA.find((ia) =>
                            ia.custcol_scv_ori_lineid === rec.getSublistValue(idSublist, 'custcol_scv_ori_lineid', i) &&
                            ia.itemIA === rec.getSublistValue(idSublist, 'item', i) &&
                            ia.line_no === rec.getSublistValue(idSublist, 'custcol_scv_line_no', i)
                            // Math.abs(Number(ia.quanIA_InvDetail)) === Math.abs(Number(quan_nhap))
                        ) || arrIA.find((ia) =>
                            ia.itemIA === rec.getSublistValue(idSublist, 'item', i) &&
                            ia.line_no === rec.getSublistValue(idSublist, 'custcol_scv_line_no', i)
                        );
                        let quanIA = matchedIA ? ((matchedIA.adjustqtyby) || (matchedIA.quanIA_InvDetail)) : 0;
                        quanIA = quanIA < 0 ? Math.abs(quanIA) : quanIA;
                        line.quanIA = changeCurrency1(quanIA, true);

                        arrItem.push(line);
                        total_nhapxuat += quanIA;
                        total_yeucau += quan_nhap;

                    }
                }
            }
            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: "jsonData",
                data: {
                    arrItem: arrItem,
                    legalname: legalname,
                    emp_legal_name: emp_legal_name,
                    mainaddress_text: mainaddress_text,
                    loc_name: loc_name,
                    date: date,
                    tranid: tranid,
                    memo: memo,
                    department: department,
                    ycxvt_type: ycxvt_type,
                    employee_ycxvt: employee_ycxvt,
                    total_yeucau: changeCurrency1(total_yeucau) || 0,
                    total_nhapxuat: changeCurrency1(total_nhapxuat, true),
                }
            });
        }

        const printYCNXX = (rec, renderer) => {
            let trandate = rec.getValue('trandate');
            let date = getTranDate(trandate);
            let subsidiary = rec.getValue('subsidiary');
            let location = rec.getValue('location');
            let related_transaction = rec.getValue('custbody_scv_related_transaction');
            let tranid = rec.getValue('tranid');
            let employee_ycxvt = rec.getValue('custbody_scv_employee_ycxvt');
            let emp_legal_name;

            if (employee_ycxvt) {
                let lkFEmp = search.lookupFields({
                    type: 'employee',
                    id: employee_ycxvt,
                    columns: ['custentity_scv_legal_name']
                });
                emp_legal_name = lkFEmp.custentity_scv_legal_name;
            }

            let memo = rec.getValue('memo');
            let department = rec.getText('department');
            let ycxvt_type = rec.getText('custbody_scv_ycxvt_type');
            let legalname, mainaddress_text, loc_name, total_nhapxuat = 0, total_yeucau = 0;

            if (subsidiary) {
                let lkFSc = search.lookupFields({
                    type: 'subsidiary',
                    id: subsidiary,
                    columns: ['legalname']
                });
                legalname = lkFSc.legalname;
            }

            if (location) {
                let recLoc = record.load({
                    type: 'location',
                    id: location,
                });
                mainaddress_text = recLoc.getValue('mainaddress_text');
                loc_name = recLoc.getValue('name');
            }

            let slInvDetail = "inventoryassignment";
            let arrIA = [];
            if (Array.isArray(related_transaction) && related_transaction.length > 0) {
                related_transaction.forEach((transactionId) => {
                    let recTrans = record.load({
                        type: 'inventoryadjustment',
                        id: transactionId,
                    });
                    let sublistIA = 'inventory';
                    for (let k = 0; k < recTrans.getLineCount(sublistIA); k++) {
                        let inventorydetailavail = recTrans.getSublistValue(sublistIA, 'inventorydetailreq', k);
                        if (inventorydetailavail === true || inventorydetailavail === 'T') {
                            let InvDetailSubIA = recTrans.getSublistSubrecord(sublistIA, 'inventorydetail', k);
                            let lcInvDetail = InvDetailSubIA.getLineCount(slInvDetail);
                            for (let j = 0; j < lcInvDetail; j++) {
                                let obj = {};
                                obj.line_no = recTrans.getSublistValue(sublistIA, 'custcol_scv_line_no', k);
                                obj.adjustqtyby = recTrans.getSublistValue(sublistIA, 'adjustqtyby', k);
                                obj.itemIA = recTrans.getSublistValue(sublistIA, 'item', k);
                                obj.quanIA_InvDetail = InvDetailSubIA.getSublistValue(slInvDetail, 'quantity', j) || '';
                                obj.inventorynumberIA = InvDetailSubIA.getSublistText(slInvDetail, 'issueinventorynumber', j) || '';
                                obj.custcol_scv_ori_lineid = recTrans.getSublistValue(sublistIA, 'custcol_scv_ori_lineid', k);
                                arrIA.push(obj);
                            }
                        } else {
                            let obj = {};
                            obj.line_no = recTrans.getSublistValue(sublistIA, 'custcol_scv_line_no', k);
                            obj.adjustqtyby = recTrans.getSublistValue(sublistIA, 'adjustqtyby', k);
                            obj.itemIA = recTrans.getSublistValue(sublistIA, 'item', k);
                            obj.quanIA_InvDetail = recTrans.getSublistValue(sublistIA, 'adjustqtyby', k);
                            obj.inventorynumberIA = '';
                            obj.custcol_scv_ori_lineid = recTrans.getSublistValue(sublistIA, 'custcol_scv_ori_lineid', k);
                            arrIA.push(obj);
                        }
                    }
                })
            }

            let sublistId = 'item', arrItem = [];
            let stt = 1;

            for (let i = 0; i < rec.getLineCount(sublistId); i++) {
                let quan_xuat = rec.getSublistValue(sublistId, 'quantity', i);
                let quan_nhap = rec.getSublistValue(sublistId, 'custcol_scv_plan_qty', i);
                let inventorydetailavail = rec.getSublistValue(sublistId, 'inventorydetailreq', i);

                let itemVal = rec.getSublistValue(sublistId, 'item', i);
                let displayname, upccode, itemText;
                if (itemVal) {
                    let lkFItem = search.lookupFields({
                        type: lfunc.getItemRecordType(itemVal),
                        id: itemVal,
                        columns: ['upccode', 'displayname']
                    });
                    upccode = lkFItem.upccode;
                    displayname = lkFItem.displayname;
                    itemText = displayname;
                }

                let commonLineData = {
                    stt: 0,
                    item: itemVal,
                    itemText: itemText,
                    ori_lineid: rec.getSublistValue(sublistId, 'custcol_scv_ori_lineid', i),
                    description: rec.getSublistValue(sublistId, 'description', i),
                    unit: rec.getSublistValue(sublistId, 'units_display', i),
                    item_code: rec.getSublistValue(sublistId, 'custcol_scv_tc_item_code', i),
                    memo: rec.getSublistValue(sublistId, 'custcol_scv_memo', i),
                    status: rec.getSublistText(sublistId, 'custcol_scv_item_status', i),
                    inventorynumber: rec.getSublistValue(sublistId, 'custcol_supplier_lot', i)
                };

                let bin = rec.getSublistValue(sublistId, 'custcol_scv_bin_display', i);
                if(bin){
                    commonLineData.memo = bin + ', ' + commonLineData.memo;
                }


                if (quan_xuat > 0) {
                    if (inventorydetailavail === true || inventorydetailavail === 'T') {
                        let InvDetailSub = rec.getSublistSubrecord(sublistId, 'inventorydetail', i);
                        let lcInvDetail = InvDetailSub.getLineCount('inventoryassignment');

                        for (let j = 0; j < lcInvDetail; j++) {
                            let line = { ...commonLineData };
                            line.stt = stt++;

                            let inventorynumber = InvDetailSub.getSublistText('inventoryassignment', 'issueinventorynumber', j) || '';
                            let inventoryid = InvDetailSub.getSublistValue(slInvDetail, 'issueinventorynumber', j) || InvDetailSub.getSublistValue(slInvDetail, 'numberedrecordid', j);
                            let color_seri;
                            if (inventoryid) {
                                let lkFInvDetail = search.lookupFields({
                                    type: 'inventorynumber',
                                    id: inventoryid,
                                    columns: ['custitemnumber_scv_item_num_color_seri']
                                });
                                color_seri = lkFInvDetail.custitemnumber_scv_item_num_color_seri;
                            }

                            let quan_InvDetail = InvDetailSub.getSublistValue('inventoryassignment', 'quantity', j) || 0;

                            line.color_seri = color_seri;
                            line.quan_InvDetail = quan_InvDetail;
                            if (quan_xuat) {
                                line.status = InvDetailSub.getSublistText(slInvDetail, 'inventorystatus', j) || '';
                                line.quantity = changeCurrency1(quan_InvDetail) || 0;
                                line.inventorynumber = inventorynumber;
                            } else {
                                line.quantity = quan_nhap;
                            }

                            let idx = arrIA.findIndex((ia) =>
                                ia.custcol_scv_ori_lineid === line.ori_lineid &&
                                ia.itemIA === line.item &&
                                (inventorynumber ? ia.inventorynumberIA === inventorynumber : true) &&
                                Math.abs(Number(ia.quanIA_InvDetail || ia.adjustqtyby)) === Math.abs(Number(quan_InvDetail))
                            );

                            if (idx === -1) {
                                idx = arrIA.findIndex((ia) =>
                                    ia.custcol_scv_ori_lineid === line.ori_lineid &&
                                    ia.itemIA === line.item
                                );
                            }

                            let matchedIA = null;
                            if (idx > -1) {
                                matchedIA = arrIA[idx];
                                arrIA.splice(idx, 1);
                            }

                            let quanIA = matchedIA ? ((matchedIA.quanIA_InvDetail) || (matchedIA.adjustqtyby)) : 0;
                            quanIA = quanIA < 0 ? Math.abs(quanIA) : quanIA;
                            line.quanIA = changeCurrency1(quanIA, true);

                            arrItem.push(line);
                            total_nhapxuat += Number(quanIA);
                            total_yeucau += Number(quan_InvDetail);
                        }
                    }
                    else {
                        let line = { ...commonLineData };
                        line.stt = stt++;
                        line.color_seri = '';
                        line.quantity = changeCurrency1(quan_nhap) || 0;

                        let idx = arrIA.findIndex((ia) =>
                            ia.custcol_scv_ori_lineid === line.ori_lineid &&
                            ia.itemIA === line.item &&
                            Math.abs(Number(ia.quanIA_InvDetail || ia.adjustqtyby)) === Math.abs(Number(quan_nhap))
                        );

                        if (idx === -1) {
                            idx = arrIA.findIndex((ia) =>
                                ia.custcol_scv_ori_lineid === line.ori_lineid &&
                                ia.itemIA === line.item
                            );
                        }

                        let matchedIA = null;
                        if (idx > -1) {
                            matchedIA = arrIA[idx];
                            arrIA.splice(idx, 1);
                        }

                        let quanIA = matchedIA ? ((matchedIA.quanIA_InvDetail) || (matchedIA.adjustqtyby)) : 0;
                        quanIA = quanIA < 0 ? Math.abs(quanIA) : quanIA;
                        line.quanIA = changeCurrency1(quanIA, true);

                        arrItem.push(line);
                        total_nhapxuat += Number(quanIA);
                        total_yeucau += Number(quan_nhap);
                    }
                }
            }

            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: "jsonData",
                data: {
                    arrItem: arrItem,
                    legalname: legalname,
                    emp_legal_name: emp_legal_name,
                    mainaddress_text: mainaddress_text,
                    loc_name: loc_name,
                    date: date,
                    tranid: tranid,
                    memo: memo,
                    department: department,
                    ycxvt_type: ycxvt_type,
                    employee_ycxvt: employee_ycxvt,
                    total_yeucau: changeCurrency1(total_yeucau) || 0,
                    total_nhapxuat: changeCurrency1(total_nhapxuat, true),
                }
            });
        }

        const printPXK = (rec, renderer, recType) => {
            let date = getTranDate(rec.getValue('trandate'))
            let subsidiary = rec.getValue('subsidiary');
            let tranid = rec.getValue('tranid');
            let receiver = rec.getValue('custbody_scv_receiver');
            let memo = rec.getValue('memo');

            let legalname, mainaddress_text, loc_name, total_quantity = 0, department;
            if (subsidiary) {
                let lkFSc = search.lookupFields({
                    type: 'subsidiary',
                    id: subsidiary,
                    columns: ['legalname']
                });
                legalname = lkFSc.legalname;
            }
            let sublistId = 'item', slInvDetail = "inventoryassignment", arrLine = [], loc;

            if (recType === 'inventorytransfer') {
                sublistId = 'inventory';
            }
            let stt = 1;
            if (recType === 'inventoryadjustment') {
                department = rec.getText('department');
                loc = rec.getValue('adjlocation');

                sublistId = 'inventory';
                for (let i = 0; i < rec.getLineCount(sublistId); i++) {
                    let displayname, upccode;
                    let item = rec.getSublistValue(sublistId, 'item', i);
                    if (item) {
                        let lkFItem = search.lookupFields({
                            type: lfunc.getItemRecordType(item),
                            id: item,
                            columns: ['displayname', 'upccode']
                        });
                        upccode = lkFItem.upccode;
                        displayname = lkFItem.displayname;

                    }
                    let inventorydetailavail = rec.getSublistValue(sublistId, 'inventorydetailavail', i);
                    let quantityIALine = Number(rec.getSublistValue(sublistId, 'adjustqtyby', i));

                    if ((inventorydetailavail === true || inventorydetailavail === 'T') && quantityIALine < 0) {
                        let InvDetailSub = rec.getSublistSubrecord(sublistId, 'inventorydetail', i);
                        let lcInvDetail = InvDetailSub.getLineCount(slInvDetail);
                        // Thanh Dev add 8/4/2525
                        if (!loc_name) {
                            loc_name = rec.getSublistValue(sublistId, 'location_display', i);
                        }
                        // end add
                        for (let j = 0; j < lcInvDetail; j++) {
                            let inventorynumber = InvDetailSub.getSublistValue(slInvDetail, 'receiptinventorynumber', j) || InvDetailSub.getSublistText(slInvDetail, 'issueinventorynumber', j) || '';
                            let inventoryid = InvDetailSub.getSublistValue(slInvDetail, 'issueinventorynumber', j) || InvDetailSub.getSublistValue(slInvDetail, 'numberedrecordid', j);
                            let color_seri;
                            if (inventoryid) {
                                let lkFInvDetail = search.lookupFields({
                                    type: 'inventorynumber',
                                    id: inventoryid,
                                    columns: ['custitemnumber_scv_item_num_color_seri']
                                });
                                color_seri = lkFInvDetail.custitemnumber_scv_item_num_color_seri;
                            }
                            // let color_seri = InvDetailSub.getSublistValue(slInvDetail, 'custitemnumber_scv_item_num_color_seri', j) || '';
                            let status =
                                InvDetailSub.getSublistText(slInvDetail, 'inventorystatus', j) ||
                                InvDetailSub.getSublistValue(slInvDetail, 'inventorystatus_display', j) ||
                                '';
                            let quan_InvDetail = InvDetailSub.getSublistValue(slInvDetail, 'quantity', j) || '';
                            let binnumber = InvDetailSub.getSublistText('inventoryassignment', 'binnumber', j) || '';
                            quan_InvDetail = quan_InvDetail < 0 ? Math.abs(quan_InvDetail) : quan_InvDetail;
                            let line = {};
                            line.stt = stt++;
                            line.itemdescription = escapeXML(displayname);
                            line.item = rec.getSublistValue(sublistId, 'item', i);
                            line.quantity = quan_InvDetail;
                            line.description = rec.getSublistValue(sublistId, 'description', i);
                            line.unit = rec.getSublistValue(sublistId, 'units_display', i);
                            line.memo = rec.getSublistValue(sublistId, 'memo', i);
                            line.binnumber = binnumber ? `<br/>${binnumber}` : '';
                            line.item_code = upccode;
                            line.inventorynumbers = inventorynumber;
                            line.color_seris = color_seri;
                            line.status = status;
                            arrLine.push(line);
                            total_quantity += quan_InvDetail;
                        }
                    } else {
                        if (quantityIALine < 0) {
                            if (!loc_name) {
                                loc_name = rec.getSublistValue(sublistId, 'location_display', i);
                            }

                            let line = {};
                            line.stt = stt++;
                            line.itemdescription = escapeXML(displayname);
                            line.item = rec.getSublistValue(sublistId, 'item', i);
                            let quantity = rec.getSublistValue(sublistId, 'adjustqtyby', i);
                            quantity = quantity < 0 ? Math.abs(quantity) : quantity;
                            line.quantity = changeCurrency1(quantity);
                            line.description = rec.getSublistValue(sublistId, 'description', i);
                            line.unit = rec.getSublistValue(sublistId, 'units_display', i);
                            line.memo = rec.getSublistValue(sublistId, 'memo', i);
                            line.item_code = upccode;
                            line.inventorynumbers = '';
                            line.color_seris = '';
                            line.status = '';
                            arrLine.push(line);
                            total_quantity += quantity;
                        }
                    }
                }
            } else if (recType === 'itemfulfillment' || recType === 'inventorytransfer') {

                // let userId = runtime.getCurrentUser().id;
                // let entityType = lfunc.getEntityType(userId);

                // if(entityType) {
                //     let lkFUser = search.lookupFields({
                //         type: entityType,
                //         id: userId,
                //         columns: ['department']
                //     });
                //     department = lkFUser.department[0]?.text || '';
                // }

                let createdBy = rec.getValue('custbody_scv_created_by');
                if (createdBy) {
                    let lkFTrans = search.lookupFields({
                        type: 'employee', //lfunc.getTranRecordType(createdBy),
                        id: createdBy,
                        columns: ['department']
                    });
                    department = (lkFTrans.department || [])[0]?.text || '';
                }
                for (let i = 0; i < rec.getLineCount(sublistId); i++) {
                    let displayname, upccode;
                    let item = rec.getSublistValue(sublistId, 'item', i);
                    //displayname = rec.getSublistValue(sublistId, 'itemdescription', i);
                    if (item) {
                        let lkFItem = search.lookupFields({
                            type: lfunc.getItemRecordType(item),
                            id: item,
                            columns: ['displayname', 'upccode']
                        });
                        upccode = lkFItem.upccode;
                        if (!displayname) {
                            displayname = lkFItem.displayname;
                        }
                    }
                    let inventorydetailavail = rec.getSublistValue(sublistId, 'inventorydetailavail', i);

                    if (inventorydetailavail === true || inventorydetailavail === 'T') {
                        let InvDetailSub = rec.getSublistSubrecord(sublistId, 'inventorydetail', i);
                        let lcInvDetail = InvDetailSub.getLineCount(slInvDetail);
                        for (let j = 0; j < lcInvDetail; j++) {
                            let inventorynumber = InvDetailSub.getSublistValue(slInvDetail, 'receiptinventorynumber', j) || InvDetailSub.getSublistText(slInvDetail, 'issueinventorynumber', j) || '';
                            let inventoryid = InvDetailSub.getSublistValue(slInvDetail, 'issueinventorynumber', j) || InvDetailSub.getSublistValue(slInvDetail, 'numberedrecordid', j);
                            let color_seri;
                            if (inventoryid) {
                                let lkFInvDetail = search.lookupFields({
                                    type: 'inventorynumber',
                                    id: inventoryid,
                                    columns: ['custitemnumber_scv_item_num_color_seri']
                                });
                                color_seri = lkFInvDetail.custitemnumber_scv_item_num_color_seri;
                            }

                            let status =
                                InvDetailSub.getSublistText(slInvDetail, 'inventorystatus', j) ||
                                InvDetailSub.getSublistValue(slInvDetail, 'inventorystatus_display', j) ||
                                '';
                            let quan_InvDetail = InvDetailSub.getSublistValue(slInvDetail, 'quantity', j) || '';
                            let binnumber = InvDetailSub.getSublistText('inventoryassignment', 'binnumber', j) || '';
                            let line = {};
                            line.stt = stt++;
                            line.displayname = rec.getSublistText(sublistId, 'displayname', i);
                            line.itemdescription =escapeXML(displayname);
                            line.item = rec.getSublistValue(sublistId, 'item', i);
                            loc = rec.getSublistValue(sublistId, 'location', i);
                            line.quantity = quan_InvDetail;
                            line.description = rec.getSublistValue(sublistId, 'description', i);
                            line.unit = rec.getSublistValue(sublistId, 'unitsdisplay', i) || rec.getSublistValue(sublistId, 'units_display', i);
                            line.item_code = upccode;
                            line.memo = rec.getSublistValue(sublistId, 'custcol_scv_memo', i);
                            line.binnumber = binnumber ? line.memo ? `<br/>${binnumber}` : `${binnumber}` : '';
                            line.inventorynumbers = inventorynumber;
                            line.color_seris = color_seri;
                            line.status = status;
                            arrLine.push(line);
                            total_quantity += quan_InvDetail;
                        }
                    } else {
                        let line = {};
                        line.stt = stt++;
                        line.itemdescription = escapeXML(displayname);
                        line.item = rec.getSublistValue(sublistId, 'item', i);
                        let quantity = rec.getSublistValue(sublistId, 'quantity', i);
                        loc = rec.getSublistValue(sublistId, 'location', i);
                        line.quantity = quantity;
                        line.description = rec.getSublistValue(sublistId, 'description', i);
                        line.unit = rec.getSublistValue(sublistId, 'unitsdisplay', i) || rec.getSublistValue(sublistId, 'units_display', i);
                        line.item_code = upccode;
                        line.memo = rec.getSublistValue(sublistId, 'custcol_scv_memo', i);

                        line.inventorynumbers = '';
                        line.color_seris = '';
                        line.status = '';
                        arrLine.push(line);
                        total_quantity += quantity;
                    }
                }
            }
            if (!loc) {
                loc = rec.getValue('location');
            }
            if (loc) {
                let recLoc = record.load({
                    type: 'location',
                    id: loc,
                });
                mainaddress_text = recLoc.getValue('mainaddress_text');
                loc_name = loc_name ? loc_name : recLoc.getValue('name');
            }
            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: "jsonData",
                data: {
                    arrLine: arrLine,
                    legalname: legalname,
                    mainaddress_text: mainaddress_text,
                    loc_name: loc_name,
                    date: date,
                    tranid: tranid,
                    memo: memo,
                    department: department,
                    receiver: receiver,
                    loc: loc,
                    total_quantity: changeCurrency1(total_quantity),
                }
            });
        }

        const printPNK = (rec, renderer, recType, printFile) => {
            let trandate = rec.getValue('trandate');
            let date = getTranDate(trandate)
            let subsidiary = rec.getValue('subsidiary');
            let tranid = rec.getValue('tranid');
            let memo = rec.getValue('memo');
            let shipper = rec.getValue('custbody_scv_shipper');
            let department = rec.getText('department');
            let legalname, mainaddress_text, loc_name, total_quantity = 0, loc;

            if (subsidiary) {
                let lkFSc = search.lookupFields({
                    type: 'subsidiary',
                    id: subsidiary,
                    columns: ['legalname']
                });
                legalname = lkFSc.legalname;
            }

            // --- Bulk Fetch Optimization ---
            let itemIds = [];
            let inventoryIds = [];
            let assemblyBuildIds = [];
            let tempSublistId = (recType === 'inventoryadjustment' || recType === 'inventorytransfer') ? 'inventory' : 'item';
            let lineCount = rec.getLineCount(tempSublistId);
            for (let i = 0; i < lineCount; i++) {
                let item = rec.getSublistValue(tempSublistId, 'item', i);
                if (item) itemIds.push(item);

                if (recType === 'itemreceipt') {
                    let assemblyId = rec.getSublistValue(tempSublistId, 'assembly', i);
                    if (assemblyId) itemIds.push(assemblyId);

                    let assemblyBuildId = rec.getSublistValue(tempSublistId, 'linkedassemblybuild', i);
                    if (assemblyBuildId) assemblyBuildIds.push(assemblyBuildId);
                }

                let hasInvDetail = rec.getSublistValue(tempSublistId, 'inventorydetailavail', i) === 'T' ||
                    rec.getSublistValue(tempSublistId, 'inventorydetailavail', i) === true;
                if (hasInvDetail) {
                    try {
                        let invDetailSub = rec.getSublistSubrecord(tempSublistId, 'inventorydetail', i);
                        let lcInvDetail = invDetailSub.getLineCount('inventoryassignment');
                        for (let j = 0; j < lcInvDetail; j++) {
                            let invId = invDetailSub.getSublistValue('inventoryassignment', 'issueinventorynumber', j) ||
                                invDetailSub.getSublistValue('inventoryassignment', 'numberedrecordid', j);
                            if (invId) inventoryIds.push(invId);
                        }
                    } catch (e) { }
                }
            }

            let itemDataMap = {};
            if (itemIds.length > 0) {
                itemIds = [...new Set(itemIds)];
                search.create({
                    type: 'item',
                    filters: [['internalid', 'anyof', itemIds]],
                    columns: ['upccode', 'displayname', 'islotitem', 'unitstype']
                }).run().each(result => {
                    itemDataMap[result.id] = {
                        upccode: result.getValue('upccode'),
                        displayname: result.getValue('displayname'),
                        islotitem: result.getValue('islotitem') === 'T' || result.getValue('islotitem') === true,
                        // recordtype: result.getValue('type'),
                        unitstypeText: result.getText('unitstype')
                    };
                    return true;
                });
            }

            let invDataMap = {};
            if (inventoryIds.length > 0) {
                inventoryIds = [...new Set(inventoryIds)];
                search.create({
                    type: 'inventorynumber',
                    filters: [['internalid', 'anyof', inventoryIds]],
                    columns: [
                        'custitemnumber_scv_item_num_color_seri',
                        'custitemnumber_scv_phan_loai_loi_nhom'
                    ]
                }).run().each(result => {
                    invDataMap[result.id] = {
                        custitemnumber_scv_item_num_color_seri: result.getValue('custitemnumber_scv_item_num_color_seri'),
                        custitemnumber_scv_phan_loai_loi_nhom: result.getText('custitemnumber_scv_phan_loai_loi_nhom') ||
                            result.getValue('custitemnumber_scv_phan_loai_loi_nhom') || ''
                    };
                    return true;
                });
            }

            let assemblyBuildMap = {};
            if (assemblyBuildIds.length > 0) {
                assemblyBuildIds = [...new Set(assemblyBuildIds)];
                assemblyBuildIds.forEach(abId => {
                    const abRec = record.load({ type: 'assemblybuild', id: abId });
                    const invDetail = abRec.getSubrecord({ fieldId: 'inventorydetail' });
                    if (invDetail) {
                        assemblyBuildMap[abId] = {
                            status: invDetail.getSublistText({ sublistId: 'inventoryassignment', fieldId: 'inventorystatus', line: 0 }),
                            lot: invDetail.getSublistValue({ sublistId: 'inventoryassignment', fieldId: 'receiptinventorynumber', line: 0 })
                        };
                    }
                });
            }
            // --- End Bulk Fetch Optimization ---

            let sublistId = 'item', location, slInvDetail = "inventoryassignment", arrLine = [];
            let stt = 1;
            if (recType === 'inventoryadjustment') {
                location = rec.getValue('adjlocation');
                sublistId = 'inventory';
                for (let i = 0; i < rec.getLineCount(sublistId); i++) {
                    let item = rec.getSublistValue(sublistId, 'item', i);
                    let displayname, upccode;
                    if (item && itemDataMap[item]) {
                        upccode = itemDataMap[item].upccode;
                        displayname = itemDataMap[item].displayname;
                    }
                    let inventorydetailavail = rec.getSublistValue(sublistId, 'inventorydetailavail', i);
                    let quantityIALine = Number(rec.getSublistValue(sublistId, 'adjustqtyby', i));
                    if ((inventorydetailavail === true || inventorydetailavail === 'T') && quantityIALine > 0) {
                        let InvDetailSub = rec.getSublistSubrecord(sublistId, 'inventorydetail', i);
                        let lcInvDetail = InvDetailSub.getLineCount(slInvDetail);
                        //thanhdev 8/4/2025
                        if (!loc) {
                            loc = rec.getSublistValue(sublistId, 'location_display', i);
                        }
                        // ---
                        for (let j = 0; j < lcInvDetail; j++) {
                            let inventorynumber = InvDetailSub.getSublistValue(slInvDetail, 'receiptinventorynumber', j) || InvDetailSub.getSublistText(slInvDetail, 'issueinventorynumber', j) || '';
                            let inventoryid = InvDetailSub.getSublistValue(slInvDetail, 'issueinventorynumber', j) || InvDetailSub.getSublistValue(slInvDetail, 'numberedrecordid', j);
                            let color_seri;
                            if (inventoryid && invDataMap[inventoryid]) {
                                color_seri = invDataMap[inventoryid].custitemnumber_scv_item_num_color_seri;
                            }
                            let status = InvDetailSub.getSublistText(slInvDetail, 'inventorystatus', j) || '';
                            let quan_InvDetail = InvDetailSub.getSublistValue(slInvDetail, 'quantity', j) || '';
                            quan_InvDetail = quan_InvDetail < 0 ? Math.abs(quan_InvDetail) : quan_InvDetail;
                            let line = {};
                            line.stt = stt++;
                            line.displayname = displayname;
                            line.item = rec.getSublistValue(sublistId, 'item', i);
                            line.quantity = quan_InvDetail;
                            line.description = rec.getSublistValue(sublistId, 'description', i);
                            line.unit = rec.getSublistValue(sublistId, 'units_display', i);
                            line.memo = rec.getSublistValue(sublistId, 'memo', i);
                            line.itemupc = upccode;
                            line.inventorynumbers = inventorynumber;
                            line.color_seris = color_seri;
                            line.status = status;
                            arrLine.push(line);
                            total_quantity += Number(quan_InvDetail);
                        }
                    } else {
                        if (quantityIALine > 0) {
                            let line = {};
                            line.stt = stt++;
                            line.displayname = rec.getSublistText(sublistId, 'item_display', i);
                            line.item = rec.getSublistValue(sublistId, 'item', i);
                            let quantity = rec.getSublistValue(sublistId, 'adjustqtyby', i);
                            quantity = quantity < 0 ? Math.abs(quantity) : quantity;
                            line.quantity = quantity;
                            line.description = rec.getSublistValue(sublistId, 'description', i);
                            line.unit = rec.getSublistValue(sublistId, 'units_display', i);
                            line.memo = rec.getSublistValue(sublistId, 'memo', i);
                            line.itemupc = rec.getSublistValue(sublistId, 'custcol_scv_tc_item_code', i);
                            line.inventorynumbers = '';
                            line.color_seris = '';
                            line.status = '';
                            arrLine.push(line);
                            total_quantity += Number(quantity);
                        }
                    }
                }
                if (location) {
                    let recLoc = record.load({
                        type: 'location',
                        id: location,
                    });
                    mainaddress_text = recLoc.getValue('mainaddress_text');
                    //loc = recLoc.getValue('name');
                }
            } else if (recType === 'itemreceipt') {
                sublistId = 'item';
                let orderType = rec.getValue('custbody_scv_order_type');
                // let idSSInventoryStatusChange = 'customsearch_scv_rem_qc_done_2';
                let idSSInventoryStatusChange = 'customsearch_scv_rem_qc_done_3';
                let arrStatus2;
                let usedQcIds = new Set();
                if (printFile === 'scv_render_pnk_qc_pdf') {
                    arrStatus2 = getInventoryStatusChangev2(rec, 'customsearch_scv_rem_qc_done_3', null, null);
                }
                for (let i = 0; i < rec.getLineCount(sublistId); i++) {
                    let item = rec.getSublistValue(sublistId, 'item', i);
                    let oriLineId = rec.getSublistValue(sublistId, 'custcol_scv_ori_lineid', i);

                    let displayname, upccode, islotitem;
                    if (item && itemDataMap[item]) {
                        upccode = itemDataMap[item].upccode;
                        displayname = itemDataMap[item].displayname;
                        islotitem = itemDataMap[item].islotitem;
                    }
                    let isLot = islotitem === 'T' || islotitem === true

                    if (isLot) {
                        let invDetailSub = rec.getSublistSubrecord(sublistId, 'inventorydetail', i);

                        let lcInvDetail = invDetailSub.getLineCount(slInvDetail);
                        let leafNodes = printFile === 'scv_render_pnk_qc_pdf' ? getLeafNodesByInventory(arrStatus2) : null;
                        //
                        for (let j = 0; j < lcInvDetail; j++) {
                            let inventoryNumber = invDetailSub.getSublistValue(slInvDetail, 'receiptinventorynumber', j) || invDetailSub.getSublistText(slInvDetail, 'issueinventorynumber', j) || '';
                            let inventoryId = invDetailSub.getSublistValue(slInvDetail, 'issueinventorynumber', j) ||
                                invDetailSub.getSublistValue(slInvDetail, 'numberedrecordid', j);
                            let colorSeri;
                            let coreCategory = '';
                            if (inventoryId && invDataMap[inventoryId]) {
                                colorSeri = invDataMap[inventoryId].custitemnumber_scv_item_num_color_seri;
                                coreCategory = invDataMap[inventoryId].custitemnumber_scv_phan_loai_loi_nhom;
                            }
                            let status = invDetailSub.getSublistText(slInvDetail, 'inventorystatus', j) || '';
                            let quan_InvDetail = invDetailSub.getSublistValue(slInvDetail, 'quantity', j) || '';
                            quan_InvDetail = quan_InvDetail < 0 ? Math.abs(quan_InvDetail) : quan_InvDetail;

                            let line = {};
                            line.stt = stt++;
                            line.itemname = rec.getSublistText(sublistId, 'itemname', i);

                            line.unit = rec.getSublistValue(sublistId, 'unitsdisplay', i);
                            line.itemupc = upccode;
                            line.displayname = displayname; // if order_type = 47
                            if (orderType === '47') {
                                let assemblyId = rec.getSublistValue(sublistId, 'assembly', i);
                                line.itemupc = rec.getSublistValue(sublistId, 'assembly_display', i).split('_')[0];
                                line.displayname = rec.getSublistValue(sublistId, 'assembly_display', i).split('_')[1];
                                line.unit = getItemUnitDisplay(assemblyId, itemDataMap);
                            }
                            line.quantity = quan_InvDetail;
                            line.description = rec.getSublistValue(sublistId, 'description', i);
                            location = rec.getSublistValue(sublistId, 'location', i);
                            line.memo = rec.getSublistValue(sublistId, 'custcol_scv_memo', i);
                            // line.memo = line.memo || coreCategory ? `${line.memo || ''} - ${coreCategory}` : line.memo || coreCategory;
                            line.memo = line.memo && coreCategory ? `${line.memo || ''} - ${coreCategory}` : line.memo || coreCategory;
                            line.text2 = '';
                            line.inventorynumbers = inventoryNumber;
                            line.color_seris = colorSeri;
                            if (printFile === 'scv_render_pnk_pdf') {
                                line.status = status;
                            } else if (printFile === 'scv_render_pnk_qc_pdf') {

                                let resultStatus = inventoryId
                                    ? (leafNodes[`${inventoryId}`] || [])
                                    : Object.values(leafNodes).find(node => node.some(item => item.textinventorynumber === inventoryNumber)) || [];

                                let uniqueQcKey = (qcId) => qcId + '_' + (inventoryId || inventoryNumber);

                                resultStatus = resultStatus.filter(x => !usedQcIds.has(uniqueQcKey(x.idphieuqc)));
                                resultStatus = getLatestStatusRecords(resultStatus);
                                let result = []
                                if (resultStatus.length > 1) {
                                    result = resultStatus.filter(x =>
                                        x.orilineid == oriLineId
                                        && x.qcQuantity == quan_InvDetail
                                    )

                                    if (result.length === 0) {
                                        result = resultStatus.filter(x =>
                                            x.orilineid == oriLineId
                                        )
                                    }

                                    resultStatus = result;

                                    for (let k = 0; k < resultStatus.length; k++) {
                                        usedQcIds.add(uniqueQcKey(resultStatus[k].idphieuqc));
                                        let line1 = {...line};
                                        line1.status = resultStatus[k].revisedStatus;
                                        line1.quantity = resultStatus[k].qcQuantity;

                                        if (k < resultStatus.length - 1) {
                                            arrLine.push(line1);
                                            total_quantity += Number(resultStatus[k].qcQuantity);
                                        }
                                        line1.stt = stt++;
                                    }
                                    line.status = resultStatus[resultStatus.length - 1].revisedStatus;
                                    line.quantity = resultStatus[resultStatus.length - 1].qcQuantity || 0;

                                } else if (resultStatus.length === 1) {
                                    usedQcIds.add(uniqueQcKey(resultStatus[0].idphieuqc));
                                    line.status = resultStatus[0]?.revisedStatus|| '';
                                } else {
                                    continue;
                                }
                            }
                            arrLine.push(line);
                            total_quantity += Number(line.quantity || quan_InvDetail);
                        }
                    } else {
                        let invDetailSub = rec.getSublistSubrecord(sublistId, 'inventorydetail', i);
                        let lcInvDetail = invDetailSub.getLineCount(slInvDetail);

                        if(printFile === 'scv_render_pnk_qc_pdf') {
                            let inventoryNumber = invDetailSub.getSublistValue(slInvDetail, 'receiptinventorynumber', 0) ||
                                invDetailSub.getSublistValue(slInvDetail, 'issueinventorynumber', 0) || '';
                            let arrStatus ;
                            arrStatus = arrStatus2 || [];
                            if (arrStatus.length > 1) {
                                arrStatus = getLeafNodesByInventory(arrStatus)[''] || [];
                                arrStatus = getLatestStatusRecords(arrStatus);
                            }

                            arrStatus  = arrStatus.filter(s => s.orilineid == oriLineId )
                            let line = {}

                            for(let a = 0; a < arrStatus.length; a++) {
                                line = {};
                                line.stt = stt++;
                                line.itemname = rec.getSublistText(sublistId, 'itemname', i);
                                line.displayname = displayname;
                                line.unit = rec.getSublistValue(sublistId, 'unitsdisplay', i);
                                line.itemupc = upccode;
                                // line.inventorynumbers = '';

                                let abLot = '';
                                if (orderType === '47') {
                                    let assemblyId = rec.getSublistValue(sublistId, 'assembly', i);
                                    line.itemupc = rec.getSublistValue(sublistId, 'assembly_display', i).split('_')[0];
                                    line.displayname = rec.getSublistValue(sublistId, 'assembly_display', i).split('_')[1];
                                    line.unit = getItemUnitDisplay(assemblyId, itemDataMap);
                                    let {status, lot} = getStatusFromAssembly(rec, i, assemblyBuildMap);
                                    line.status = status;
                                    abLot = lot;
                                }
                                let quantity = arrStatus[a].qcQuantity;
                                line.quantity = quantity;
                                line.description = rec.getSublistValue(sublistId, 'description', i);
                                location = rec.getSublistValue(sublistId, 'location', i);
                                line.memo = rec.getSublistValue(sublistId, 'custcol_scv_memo', i);
                                line.text2 = '';
                                line.color_seris = arrStatus[a].color_seri;
                                line.status = arrStatus[a].revisedStatus;
                                line.inventorynumbers = inventoryNumber || abLot;

                                arrLine.push(line);
                                total_quantity += Number(quantity);
                            }

                        } else {
                            // serial không lưu lô, không lấy được id inventorynumber nên search theo text để lấy record serial lot number
                            let inventoryNumber = invDetailSub.getSublistValue(slInvDetail, 'receiptinventorynumber', 0) ||
                                invDetailSub.getSublistValue(slInvDetail, 'issueinventorynumber', 0) || '';
                            let color_seri;

                            if(lcInvDetail > 1) {
                                for(let k = 0; k < lcInvDetail; k++) {
                                    let line = {};
                                    line.status = invDetailSub.getSublistText(slInvDetail, 'inventorystatus', k) || '';
                                    let receiptInventoryNumber = invDetailSub.getSublistValue(slInvDetail, 'receiptinventorynumber', 0);
                                    if (receiptInventoryNumber) {
                                        let arrDataSerial = getInfoSerialNumberRec(receiptInventoryNumber)
                                        color_seri = arrDataSerial[0].custitemnumber_scv_item_num_color_seri;
                                    }

                                    line.stt = stt++;
                                    line.itemname = rec.getSublistText(sublistId, 'itemname', i);
                                    line.displayname = displayname;
                                    line.unit = rec.getSublistValue(sublistId, 'unitsdisplay', i);
                                    line.itemupc = upccode;
                                    line.inventorynumbers = inventoryNumber;

                                    if (orderType === '47') {
                                        let assemblyId = rec.getSublistValue(sublistId, 'assembly', i);
                                        line.itemupc = rec.getSublistValue(sublistId, 'assembly_display', i).split('_')[0];
                                        line.displayname = rec.getSublistValue(sublistId, 'assembly_display', i).split('_')[1];
                                        line.unit = getItemUnitDisplay(assemblyId, itemDataMap);
                                        let {status, lot} = getStatusFromAssembly(rec, i, assemblyBuildMap);
                                        line.status = status;
                                        line.inventorynumbers = lot;
                                    }
                                    let quantity = invDetailSub.getSublistValue(slInvDetail, 'quantity', k);
                                    line.quantity = quantity
                                    line.description = rec.getSublistValue(sublistId, 'description', i);
                                    location = rec.getSublistValue(sublistId, 'location', i);

                                    line.memo = rec.getSublistValue(sublistId, 'custcol_scv_memo', i);
                                    line.text2 = '';

                                    line.color_seris = color_seri || '';

                                    arrLine.push(line);
                                    total_quantity += Number(line.quantity);
                                }

                            } else {
                                let line = {};
                                let receiptInventoryNumber = invDetailSub.getSublistValue(slInvDetail, 'receiptinventorynumber', 0);
                                if (receiptInventoryNumber) {
                                    let arrDataSerial = getInfoSerialNumberRec(receiptInventoryNumber)
                                    color_seri = arrDataSerial[0].custitemnumber_scv_item_num_color_seri;
                                }
                                line.stt = stt++;
                                line.itemname = rec.getSublistText(sublistId, 'itemname', i);
                                line.displayname = displayname;
                                line.unit = rec.getSublistValue(sublistId, 'unitsdisplay', i);
                                line.itemupc = upccode;
                                line.inventorynumbers = inventoryNumber;

                                // thanhdev 11/11/2025
                                // lấy status từ lô trong bảng assembly trong trường hợp order type = 47, Mua hàng gia công
                                // sinh ra id, chưa sinh ra text, lấy Text status lỗi

                                if (orderType === '47') {
                                    let assemblyId = rec.getSublistValue(sublistId, 'assembly', i);
                                    line.itemupc = rec.getSublistValue(sublistId, 'assembly_display', i).split('_')[0];
                                    line.displayname = rec.getSublistValue(sublistId, 'assembly_display', i).split('_')[1];
                                    line.unit = getItemUnitDisplay(assemblyId, itemDataMap);
                                    let {status, lot} = getStatusFromAssembly(rec, i, assemblyBuildMap);
                                    line.status = status;
                                    line.inventorynumbers = lot;
                                }else {
                                    line.status = invDetailSub.getSublistText(slInvDetail, 'inventorystatus', 0) || '';
                                }

                                let quantity = rec.getSublistValue(sublistId, 'quantity', i);
                                line.quantity = quantity;
                                line.description = rec.getSublistValue(sublistId, 'description', i);
                                location = rec.getSublistValue(sublistId, 'location', i);

                                line.memo = rec.getSublistValue(sublistId, 'custcol_scv_memo', i);
                                line.text2 = '';

                                line.color_seris = color_seri || '';

                                arrLine.push(line);
                                total_quantity += Number(quantity);
                            }
                        }

                    }
                }
                if (location) {
                    let recLoc = record.load({
                        type: 'location',
                        id: location,
                    });
                    mainaddress_text = recLoc.getValue('mainaddress_text');
                    loc = recLoc.getValue('name');
                }
            }

            if(recType === 'inventorytransfer') {
                loc = rec.getText('transferlocation').split(':')[1];
                shipper = rec.getValue('custbody_scv_shipper');
                location = rec.getValue('location');
                if (location) {
                    let recLoc = record.load({
                        type: 'location',
                        id: location,
                    });
                    mainaddress_text = recLoc.getValue('mainaddress_text');
                    // loc = recLoc.getValue('name');
                }
                let idSublist = 'inventory'
                let lcItems = rec.getLineCount('inventory');
                for (let i = 0; i < lcItems; i++) {
                    let item = rec.getSublistValue('inventory', 'item', i);
                    let displayname, upccode;
                    if (item && itemDataMap[item]) {
                        upccode = itemDataMap[item].upccode;
                        displayname = itemDataMap[item].displayname;
                    }
                    let quantity = rec.getSublistValue('inventory', 'quantity', i);
                    let line = {};
                    line.stt = stt++;
                    line.displayname = displayname;
                    line.item = item;
                    line.quantity = quantity;
                    line.description = rec.getSublistValue('inventory', 'description', i);
                    line.unit = rec.getSublistValue('inventory', 'units_display', i);
                    line.memo = rec.getSublistValue('inventory', 'custcol_scv_memo', i);
                    line.itemupc = upccode;
                    line.inventorynumbers = '';
                    line.color_seris = '';
                    line.status = '';
                    total_quantity += addInvDetail(arrLine, rec , idSublist ,line, i, total_quantity, invDataMap);
                    // arrLine.push(line);
                }
            }

            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: "jsonData",
                data: {
                    arrLine: arrLine,
                    legalname: legalname,
                    mainaddress_text: mainaddress_text,
                    loc_name: loc_name,
                    date: date,
                    tranid: tranid,
                    memo: memo,
                    department: department,
                    shipper: shipper,
                    loc: loc,
                    total_quantity: (total_quantity) || 0,
                }
            });
        }

        const getInfoSerialNumberRec = (serialLotText) => {
                 let queryText = `select * from inventorynumber where inventorynumber = '${serialLotText}'`
            return query.runSuiteQL({query: queryText}).asMappedResults();
        }

        const addInvDetail = (arrLine, rec, idSublist ,objLine, lineNum, total_quantity_param, invDataMap) => {
            let idInvDtl = rec.getSublistValue(idSublist ,'inventorydetail', lineNum);
            let total_quantity = 0;
            if (idInvDtl) {
                let subRecInv = rec.getSublistSubrecord(idSublist, 'inventorydetail', lineNum);
                let lcInvDetail = subRecInv.getLineCount('inventoryassignment');
                for(let i = 0; i < lcInvDetail; i++) {
                    let inventoryNumber = subRecInv.getSublistValue('inventoryassignment', 'receiptinventorynumber', i) || subRecInv.getSublistText('inventoryassignment', 'issueinventorynumber', i) || '';
                    let inventoryId = subRecInv.getSublistValue('inventoryassignment', 'issueinventorynumber', i) || subRecInv.getSublistValue('inventoryassignment', 'numberedrecordid', i);
                    let colorSeri;
                    if (inventoryId && invDataMap[inventoryId]) {
                        colorSeri = invDataMap[inventoryId].custitemnumber_scv_item_num_color_seri;
                    }
                    let status = subRecInv.getSublistText('inventoryassignment', 'inventorystatus', i) || '';
                    // let quan_InvDetail = subRecInv.getSublistValue('inventoryassignment', 'quantity', i) || '';
                    // quan_InvDetail = quan_InvDetail < 0 ? Math.abs(quan_InvDetail) : quan_InvDetail;
                    objLine.inventorynumbers = inventoryNumber ;
                    objLine.color_seris = colorSeri;
                    objLine.status = status ;
                    objLine.quantity = subRecInv.getSublistValue('inventoryassignment', 'quantity', i)
                    total_quantity += objLine.quantity;
                    let linee = {...objLine}
                    arrLine.push(linee)
                }
            }else{
                objLine.quantity = rec.getSublistValue(idSublist, 'quantity', lineNum)
                total_quantity += objLine.quantity;
                arrLine.push(objLine);
            }
            return Number(total_quantity);
        }

        const getStatusFromAssembly = (recIR, i, assemblyBuildMap) => {
            let assemblyBuildId = recIR.getSublistValue('item', 'linkedassemblybuild', i);
            if (assemblyBuildId && assemblyBuildMap[assemblyBuildId]) {
                return assemblyBuildMap[assemblyBuildId];
            }
            return {status: '', lot: ''};
        }

        const getItemUnitDisplay = (idItem, itemDataMap) => {
            if (idItem && itemDataMap[idItem]) {
                return itemDataMap[idItem].unitstypeText;
            }
            return '';
        }

        const getInventoryStatusChange = (recItr, idSSInventoryStatusChange, invDetailSub, slInvDetail) => {
            let arrLotNumber = [];
            let idItr = recItr.id;

            if(invDetailSub) {
                let lines = invDetailSub.getLineCount(slInvDetail)
                for (let i = 0; i < lines; i++) {
                    let inventoryNumber = invDetailSub.getSublistValue(slInvDetail, 'issueinventorynumber', i) || invDetailSub.getSublistValue(slInvDetail, 'numberedrecordid', i);
                    if (inventoryNumber) {
                        arrLotNumber.push(inventoryNumber);
                    }
                }
            }

            let searchObj = search.load({
                id: idSSInventoryStatusChange
            });
            let f = searchObj.filters;

            let orderType = recItr.getValue('custbody_scv_order_type');
            if(orderType === '47') { // Đơn hàng sản xuất
                f.push(search.createFilter({
                    name: 'custbody_scv_itr_link',
                    operator: search.Operator.ANYOF,
                    values: idItr
                }));
            }else {
                f.push(search.createFilter({
                    name: 'custbody_scv_created_transaction',
                    operator: search.Operator.ANYOF,
                    values: idItr
                }));
            }

            if (arrLotNumber.length > 0) {
                f.push(search.createFilter({
                    name: 'inventorynumber',
                    join: 'inventorydetail',
                    operator: 'anyof',
                    values: arrLotNumber,
                }));
            }
            let arrResult = [];
            searchObj.run().each(function (result) {
                arrResult.push(result);
                return true;
            });
            return arrResult;
        }

        const getInventoryStatusChangev2 = (recItr, idSSInventoryStatusChange, invDetailSub, slInvDetail) => {
            let arrLotNumber = [];
            let idItr = recItr.id;

            if(invDetailSub) {
                let lines = invDetailSub.getLineCount(slInvDetail)
                for (let i = 0; i < lines; i++) {
                    let inventoryNumber = invDetailSub.getSublistValue(slInvDetail, 'issueinventorynumber', i) || invDetailSub.getSublistValue(slInvDetail, 'numberedrecordid', i);
                    if (inventoryNumber) {
                        arrLotNumber.push(inventoryNumber);
                    }
                }
            }

            let searchObj = search.load({
                id: idSSInventoryStatusChange
            });
            let f = searchObj.filters;

            let orderType = recItr.getValue('custbody_scv_order_type');
            if(orderType === '47') { // Đơn hàng sản xuất
                f.push(search.createFilter({
                    name: 'custbody_scv_itr_link',
                    operator: search.Operator.ANYOF,
                    values: idItr
                }));
            }else {
                f.push(search.createFilter({
                    name: 'custbody_scv_created_transaction',
                    operator: search.Operator.ANYOF,
                    values: idItr
                }));
            }

            if (arrLotNumber.length > 0) {
                f.push(search.createFilter({
                    name: 'inventorynumber',
                    join: 'inventorydetail',
                    operator: 'anyof',
                    values: arrLotNumber,
                }));
            }

            let arrStatus = []
            searchObj.run().each(function (result) {
                arrStatus.push({
                    idphieuqc: result.getValue({ name: 'internalid', summary: search.Summary.GROUP }),
                    textphieuqc: result.getValue({ name: 'tranid', summary: search.Summary.GROUP }),
                    idphieugoc: result.getValue({ name: 'custbody_scv_inv_stchange_ori', summary: search.Summary.MAX })?.replace('Inventory Status Change #', ''),
                    inventorynumber: result.getValue({ name: 'inventorynumber', join: 'inventorydetail', summary: search.Summary.GROUP }),
                    textinventorynumber: result.getText({ name: 'inventorynumber', join: 'inventorydetail', summary: search.Summary.GROUP }),
                    orilineid: result.getValue({ name: 'custbody_scv_oriline_id', summary: search.Summary.GROUP }),
                    qcQuantity: result.getValue({ name: 'quantity', join: 'inventorydetail', summary: search.Summary.GROUP }),
                    previousStatus: result.getText({ name: 'custbody_scv_pevious_status', summary: search.Summary.GROUP }),
                    revisedStatus: result.getText({ name: 'custbody_scv_revised_status', summary: search.Summary.GROUP }),
                    color_seri: result.getValue({ name: 'custitemnumber_scv_item_num_color_seri', join: 'itemnumber', summary: search.Summary.GROUP })?.replace('- None -', ' ') || '',
                });
                return true;
            });
            return arrStatus;
        }

        const getNormalizedQcRef = (value) => (value || '').toString().replace('Inventory Status Change #', '').trim();

        const getLeafNodesByInventory = (data) => {
            // gom nhóm theo inventory
            return data.reduce((acc, item) => {
                (acc[item.inventorynumber] ||= []).push(item);
                return acc;
            }, {});
        }

        const getLatestStatusRecords = (records) => {
            const childQtyByParent = records.reduce((acc, record) => {
                const parentRef = getNormalizedQcRef(record.idphieugoc);
                if (parentRef) {
                    acc[parentRef] = (acc[parentRef] || 0) + Math.abs(Number(record.qcQuantity) || 0);
                }
                return acc;
            }, {});

            return records.reduce((result, record) => {
                const currentQty = Math.abs(Number(record.qcQuantity) || 0);
                const childQty = childQtyByParent[getNormalizedQcRef(record.textphieuqc)] || 0;
                const remainingQty = currentQty - childQty;

                if (remainingQty > 0) {
                    result.push({
                        ...record,
                        qcQuantity: String(remainingQty)
                    });
                }

                return result;
            }, []);
        }

        const printYCDC = (rec, renderer) => {
            let trandate = rec.getValue('trandate');
            let date = getTranDate(trandate)
            let idSubsidiary = rec.getValue('subsidiary');
            let employee_ycxvt = rec.getValue('custbody_scv_employee_ycxvt');
            let emp_legal_name;
            if (employee_ycxvt) {
                let lkFEmp = search.lookupFields({
                    type: 'employee',
                    id: employee_ycxvt,
                    columns: ['custentity_scv_legal_name']
                });
                emp_legal_name = lkFEmp.custentity_scv_legal_name;
            }
            let idLocation = rec.getValue('location');
            let tranid = rec.getValue('tranid');
            let transferloc = rec.getValue('transferlocation');
            let memo = rec.getValue('memo');
            let department = rec.getText('department');
            let legalname, mainaddress_text, loc_name, transloc_name = '', total_xuatnhap = 0, total_yeucau = 0;
            if (idSubsidiary) {
                let lkFSc = search.lookupFields({
                    type: 'subsidiary',
                    id: idSubsidiary,
                    columns: ['legalname']
                });
                legalname = lkFSc.legalname;
            }
            if (idLocation) {
                let recLoc = record.load({
                    type: 'location',
                    id: idLocation,
                });
                mainaddress_text = recLoc.getValue('mainaddress_text');
                loc_name = recLoc.getValue('name');
            }
            if (transferloc) {
                let lkFLoc = search.lookupFields({
                    type: 'location',
                    id: transferloc,
                    columns: ['name']
                });
                transloc_name = lkFLoc.name;
            }
            let slInvDetail = "inventoryassignment";
            let idSublist = 'item', arrTO = [];
            let stt = 1;
            // lấy sẵn các item tuwf các ITF tương ứng với item trong YCDC
            let arrItf = getITFData(rec);

            let hasItf = arrItf.length > 0;


            for (let idxTo = 0; idxTo < rec.getLineCount(idSublist); idxTo++) {
                let quantityYc = rec.getSublistValue(idSublist, 'custcol_scv_approved_qty', idxTo) || rec.getSublistValue(idSublist, 'quantity', idxTo);
                let inventoryDetailAvail = rec.getSublistValue(idSublist, 'inventorydetailavail', idxTo);
                let ori_line_id = rec.getSublistValue(idSublist, 'custcol_scv_ori_lineid', idxTo);
                // có lô thì xét trường hợp có itf hoặc không
                if (inventoryDetailAvail === true || inventoryDetailAvail === 'T') {
                    if(hasItf) {
                        let arrItfLines = arrItf.filter(s => s.ori_line_id === ori_line_id); // mảng các line của itf tương ứng với orilineid
                        if(arrItfLines.length === 0){
                            arrTO.push({
                                item: rec.getSublistValue(idSublist, 'item', idxTo),
                                itemText: getItemData(rec.getSublistValue(idSublist, 'item', idxTo)).displayname,
                                quantity: quantityYc,
                                description: rec.getSublistValue(idSublist, 'description', idxTo),
                                unit: rec.getSublistValue(idSublist, 'unitsdisplay', idxTo) || rec.getSublistValue(idSublist, 'units_display', idxTo),
                                item_code: rec.getSublistValue(idSublist, 'custcol_scv_tc_item_code', idxTo),
                                inventorynumber:  rec.getSublistValue(idSublist, 'custcol_scv_lot_serial_multi', idxTo),
                                color_seri: rec.getSublistValue('item', 'custcol_scv_qc_serial_code', idxTo),
                                memo: rec.getSublistValue(idSublist, 'custcol_scv_memo', idxTo),
                                status:  '',
                                quanITF: '',
                                quantityrowspan: 1
                            });
                        }
                        let subRecInvDetail = rec.getSublistSubrecord(idSublist, 'inventorydetail', idxTo);
                        let lcInvDetailTo = subRecInvDetail.getLineCount(slInvDetail);
                        // let isGroup = (lcInvDetailTo - arrItfLines.length) !== 0; // nếu có nhiều line trong inventorydetail thì là group
                        let quantityRowSpan =
                            // isGroup ?
                            arrItfLines.length
                           // : 1;
                        // if(isGroup) {
                            for (let idxItf = 0; idxItf < arrItfLines.length; idxItf++) {
                                let inventoryLotId = arrItfLines[idxItf].inventorynumber;
                                arrTO.push({
                                    item: rec.getSublistValue(idSublist, 'item', idxTo),
                                    itemText: getItemData(rec.getSublistValue(idSublist, 'item', idxTo)).displayname,
                                    quantity: quantityYc,
                                    description: rec.getSublistValue(idSublist, 'description', idxTo),
                                    unit: rec.getSublistValue(idSublist, 'unitsdisplay', idxTo) || rec.getSublistValue(idSublist, 'units_display', idxTo),
                                    item_code: rec.getSublistValue(idSublist, 'custcol_scv_tc_item_code', idxTo),
                                    inventorynumber: arrItfLines[idxItf].inventorynumberText || rec.getSublistValue(idSublist, 'custcol_scv_lot_serial_multi', idxTo),
                                    color_seri: getInventoryData(inventoryLotId) || rec.getSublistValue('item', 'custcol_scv_qc_serial_code', idxTo),
                                    memo: rec.getSublistValue(idSublist, 'custcol_scv_memo', idxTo),
                                    status: arrItfLines[idxItf].status || '',
                                    quanITF: arrItfLines[idxItf].quantity,
                                    quantityrowspan: quantityRowSpan
                                });
                                if (quantityRowSpan !== 0 && quantityRowSpan !== 1) {
                                    quantityRowSpan = 0;
                                }
                                total_xuatnhap += arrItfLines[idxItf].quantity;
                            }
                            total_yeucau += quantityYc;

                        // }
                        // else if(!isGroup){
                        //     for (let idxItf = 0; idxItf < lcInvDetailTo; idxItf++) {
                        //         let inventoryLotId = arrItfLines[idxItf].inventorynumber;
                        //         arrTO.push({
                        //             item: rec.getSublistValue(idSublist, 'item', idxTo),
                        //             itemText: getItemData(rec.getSublistValue(idSublist, 'item', idxTo)).displayname,
                        //             quantity: quantityYc,//subRecInvDetail.getSublistValue(slInvDetail, 'quantity', idxItf),
                        //             description: rec.getSublistValue(idSublist, 'description', idxTo),
                        //             unit: rec.getSublistText(idSublist, 'units', idxTo),
                        //             item_code: rec.getSublistValue(idSublist, 'custcol_scv_tc_item_code', idxTo),
                        //             inventorynumber: arrItfLines[idxItf].inventorynumberText || rec.getSublistValue(idSublist, 'custcol_scv_lot_serial_multi', idxTo),
                        //             color_seri: getInventoryData(inventoryLotId) || rec.getSublistValue('item', 'custcol_scv_qc_serial_code', idxTo),
                        //             memo: rec.getSublistValue(idSublist, 'custcol_scv_memo', idxTo),
                        //             status: arrItfLines[idxItf].status || '',
                        //             quanITF: arrItfLines[idxItf].quantity,
                        //             quantityrowspan: quantityRowSpan
                        //         });
                        //         if (quantityRowSpan !== 0 && quantityRowSpan !== 1) {
                        //             quantityRowSpan = 0;
                        //         }
                        //         total_xuatnhap += arrItfLines[idxItf].quantity;
                        //         total_yeucau += quantityYc//subRecInvDetail.getSublistValue(slInvDetail, 'quantity', idxItf);
                        //     }
                        // }

                    } else if (!hasItf) {
                        let subRecInvDetail = rec.getSublistSubrecord(idSublist, 'inventorydetail', idxTo);
                        let lcInvDetailTo = subRecInvDetail.getLineCount(slInvDetail);
                        if(lcInvDetailTo > 0) {
                            for (let j = 0; j < lcInvDetailTo; j++) {
                                let quantityRowSpan = 1;
                                let inventoryId = subRecInvDetail.getSublistValue(slInvDetail, 'issueinventorynumber', j) ||
                                    subRecInvDetail.getSublistValue(slInvDetail, 'numberedrecordid', j);
                                let inventoryLotText = subRecInvDetail.getSublistText(slInvDetail, 'issueinventorynumber', j) ||
                                    subRecInvDetail.getSublistText(slInvDetail, 'receiptinventorynumber', j) || '';
                                arrTO.push({
                                    item: rec.getSublistValue(idSublist, 'item', idxTo),
                                    itemText: getItemData(rec.getSublistValue(idSublist, 'item', idxTo)).displayname,
                                    // quantity: quantityYc,,
                                    quantity: subRecInvDetail.getSublistValue(slInvDetail, 'quantity', j),
                                    description: rec.getSublistValue(idSublist, 'description', idxTo),
                                    unit: rec.getSublistValue(idSublist, 'unitsdisplay', idxTo) || rec.getSublistValue(idSublist, 'units_display', idxTo),
                                    item_code: rec.getSublistValue(idSublist, 'custcol_scv_tc_item_code', idxTo),
                                    inventorynumber: inventoryLotText || rec.getSublistValue(idSublist, 'custcol_scv_lot_serial_multi', idxTo),
                                    color_seri: getInventoryData(inventoryId) || rec.getSublistValue('item', 'custcol_scv_qc_serial_code', idxTo),
                                    memo: rec.getSublistValue(idSublist, 'custcol_scv_memo', idxTo),
                                    status: subRecInvDetail.getSublistText(slInvDetail, 'inventorystatus', j) ||
                                        subRecInvDetail.getSublistValue(slInvDetail, 'inventorystatus_display', j) ||
                                        subRecInvDetail.getSublistText(slInvDetail, 'status', j) || '' ,
                                    quanITF: '',
                                    quantityrowspan: quantityRowSpan
                                });

                                total_yeucau += subRecInvDetail.getSublistValue(slInvDetail, 'quantity', j);
                            }
                        }else {
                            let line = {};
                            line.stt = stt++;
                            line.item = rec.getSublistValue(idSublist, 'item', idxTo);
                            let displayName;
                            if (line.item) {
                                let lkFItem = search.lookupFields({
                                    type: lfunc.getItemRecordType(line.item),
                                    id: line.item,
                                    columns: ['displayname']
                                });
                                displayName = lkFItem.displayname;
                            }
                            line.itemText = displayName;

                            line.quantity = quantityYc;
                            line.description = rec.getSublistValue(idSublist, 'description', idxTo);
                            line.unit = rec.getSublistValue(idSublist, 'units_display', idxTo) || rec.getSublistValue(idSublist, 'unitsdisplay', idxTo);
                            line.item_code = rec.getSublistValue(idSublist, 'custcol_scv_tc_item_code', idxTo);
                            line.memo = rec.getSublistText(idSublist, 'custcol_scv_memo', idxTo);
                            line.status = '';
                            line.color_seri = rec.getSublistValue('item', 'custcol_scv_qc_serial_code', idxTo);
                            line.inventorynumber = rec.getSublistValue(idSublist, 'custcol_scv_lot_serial_multi', idxTo);
                            line.quanITF = '';
                            line.quantityrowspan = 1;
                            arrTO.push(line);
                            total_xuatnhap += Number(line.quanITF);
                            total_yeucau += quantityYc;
                        }
                    }

                // không có lô, lấy trực tiếp thông tin từ line và lô bên itf
                } else {
                    if(hasItf){
                        let arrItfLines = arrItf.filter(s => s.ori_line_id === ori_line_id); // mảng các line của itf tương ứng với orilineid
                        if(arrItfLines.length === 0){
                            arrTO.push({
                                item: rec.getSublistValue(idSublist, 'item', idxTo),
                                itemText: getItemData(rec.getSublistValue(idSublist, 'item', idxTo)).displayname,
                                quantity: quantityYc,
                                description: rec.getSublistValue(idSublist, 'description', idxTo),
                                unit: rec.getSublistValue(idSublist, 'unitsdisplay', idxTo) || rec.getSublistValue(idSublist, 'units_display', idxTo),
                                item_code: rec.getSublistValue(idSublist, 'custcol_scv_tc_item_code', idxTo),
                                inventorynumber:  rec.getSublistValue(idSublist, 'custcol_scv_lot_serial_multi', idxTo),
                                color_seri: rec.getSublistValue('item', 'custcol_scv_qc_serial_code', idxTo),
                                memo: rec.getSublistValue(idSublist, 'custcol_scv_memo', idxTo),
                                status:  '',
                                quanITF: '',
                                quantityrowspan: 1
                            });
                        }

                        let quantityRowSpan = arrItfLines.length
                        for (let idxItf = 0; idxItf < arrItfLines.length; idxItf++) {
                            arrTO.push({
                                item: rec.getSublistValue(idSublist, 'item', idxTo),
                                itemText: getItemData(rec.getSublistValue(idSublist, 'item', idxTo)).displayname,
                                quantity: quantityYc,
                                description: rec.getSublistValue(idSublist, 'description', idxTo),
                                unit: rec.getSublistValue(idSublist, 'unitsdisplay', idxTo) || rec.getSublistValue(idSublist, 'units_display', idxTo),
                                item_code: rec.getSublistValue(idSublist, 'custcol_scv_tc_item_code', idxTo),
                                inventorynumber:  rec.getSublistValue(idSublist, 'custcol_scv_lot_serial_multi', idxTo),
                                color_seri: rec.getSublistValue('item', 'custcol_scv_qc_serial_code', idxTo),
                                memo: rec.getSublistValue(idSublist, 'custcol_scv_memo', idxTo),
                                status: arrItfLines[idxItf].status || '',
                                quanITF: arrItfLines[idxItf].quantity,
                                quantityrowspan: quantityRowSpan
                            });
                            if (quantityRowSpan !== 0 && quantityRowSpan !== 1) {
                                quantityRowSpan = 0;
                            }
                            total_xuatnhap += arrItfLines[idxItf].quantity;
                        }
                        total_yeucau += quantityYc;

                    }else {
                        let line = {};
                        line.stt = stt++;
                        line.item = rec.getSublistValue(idSublist, 'item', idxTo);
                        let displayName;
                        if (line.item) {
                            let lkFItem = search.lookupFields({
                                type: lfunc.getItemRecordType(line.item),
                                id: line.item,
                                columns: ['displayname']
                            });
                            displayName = lkFItem.displayname;
                        }
                        line.itemText = displayName;

                        line.quantity = quantityYc;
                        line.description = rec.getSublistValue(idSublist, 'description', idxTo);
                        line.unit = rec.getSublistValue(idSublist, 'unitsdisplay', idxTo) || rec.getSublistValue(idSublist, 'units_display', idxTo);
                        line.item_code = rec.getSublistValue(idSublist, 'custcol_scv_tc_item_code', idxTo);
                        line.memo = rec.getSublistText(idSublist, 'custcol_scv_memo', idxTo);
                        line.status = arrItf.find(s => s.ori_line_id === ori_line_id)?.status;
                        line.color_seri = rec.getSublistValue('item', 'custcol_scv_qc_serial_code', idxTo);
                        line.inventorynumber = rec.getSublistValue(idSublist, 'custcol_scv_lot_serial_multi', idxTo);
                        line.quanITF = '';
                        line.quantityrowspan = 1;
                        arrTO.push(line);
                        total_xuatnhap += Number(line.quanITF);
                        total_yeucau += quantityYc;
                    }
                }
            }

            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: "jsonData",
                data: {
                    arrTO: arrTO,
                    legalname: legalname,
                    emp_legal_name: emp_legal_name,
                    employee_ycxvt: employee_ycxvt,
                    mainaddress_text: mainaddress_text,
                    loc_name: loc_name,
                    date: date,
                    tranid: tranid,
                    memo: memo,
                    department: department,
                    transloc_name: transloc_name,
                    total_yeucau: total_yeucau  || 0,
                    total_xuatnhap: total_xuatnhap || 0,

                }
            });
        }

        const printPCVT = (rec, renderer) => {
            let idSubsidiary = rec.getValue('subsidiary');
            let idLocation = rec.getValue('location');
            let legalname = '', mainaddress_text = '';
            if (idSubsidiary) {
                let lkFSub = search.lookupFields({
                    type: 'subsidiary',
                    id: idSubsidiary,
                    columns: ['legalname']
                });
                legalname = lkFSub.legalname || '';
            }
            if (idLocation) {
                let recLoc = record.load({
                    type: 'location',
                    id: idLocation,
                });
                // mainaddress_text không lấy được ở lookupFields
                mainaddress_text = recLoc.getValue('mainaddress_text') || '';
            }
            let locationText = rec.getText('location') || '';
            let tranid = rec.getValue('tranid');
            let memo = rec.getValue('memo') || '';
            let trandate = getTranDate(rec.getValue('trandate'));

            let idEmployee = rec.getValue('custbody_scv_employee_ycxvt');
            let emp_legal_name = '', nguoiLap = '';
            if (idEmployee) {
                let lkFEmp = search.lookupFields({
                    type: 'employee',
                    id: idEmployee,
                    columns: ['custentity_scv_legal_name']
                });
                emp_legal_name = lkFEmp.custentity_scv_legal_name || '';
            }
            nguoiLap = (rec.getText('custbody_scv_employee_ycxvt') || '').split('_')[2] || '';
            let createddate = formatDateTimeDDMMYYYY_VN(rec.getValue('createddate'));

            let idNguoiDuyet = rec.getValue('custbody_scv_nguoiduyetitf');
            let nguoiDuyet = '', thoigianDuyet = '';
            if (idNguoiDuyet) {
                nguoiDuyet = (rec.getText('custbody_scv_nguoiduyetitf') || '').split('_')[2] || '';
                thoigianDuyet = formatDateTimeDDMMYYYY_VN(rec.getValue('custbody_scv_time_ngduyetitf'));
            }

            let arrItems = [];
            let totalQuantity = 0;
            let stt = 0;
            let sublistId = 'inventory';
            let lcItem = rec.getLineCount(sublistId);
            for (let i = 0; i < lcItem; i++) {
                let idItem = rec.getSublistValue(sublistId, 'item', i);
                let upccode = '', displayname = '', unitstype = '';
                if (idItem) {
                    let lkFItem = search.lookupFields({
                        type: 'item',
                        id: idItem,
                        columns: ['upccode', 'displayname', 'unitstype']
                    });
                    upccode = lkFItem.upccode || '';
                    displayname = lkFItem.displayname || '';
                    unitstype = lkFItem.unitstype?.[0]?.text || '';
                }
                let thoigiandieuchuyen = rec.getText('custbody_scv_bin_tran_time_back') || '';

                let subRecInvDtl = rec.getSublistSubrecord(sublistId, 'inventorydetail', i);
                let lcInvDtl = subRecInvDtl ? subRecInvDtl.getLineCount('inventoryassignment') : 0;
                for (let j = 0; j < lcInvDtl; j++) {
                    let quantity = subRecInvDtl.getSublistValue('inventoryassignment', 'quantity', j) || 0;
                    totalQuantity += Number(quantity);
                    arrItems.push({
                        stt: ++stt,
                        upccode: upccode,
                        displayname: displayname,
                        unitstype: unitstype,
                        binnumber: subRecInvDtl.getSublistText('inventoryassignment', 'binnumber', j) || '',
                        tobinnumber: subRecInvDtl.getSublistText('inventoryassignment', 'tobinnumber', j) || '',
                        quantity: quantity,
                        thoigiandieuchuyen: thoigiandieuchuyen,
                    });
                }
            }

            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: "jsonData",
                data: {
                    legalname: legalname,
                    mainaddress_text: mainaddress_text,
                    locationText: locationText,
                    trandate: trandate,
                    tranid: tranid,
                    emp_legal_name: emp_legal_name,
                    memo: memo,
                    totalQuantity: totalQuantity,
                    nguoiLap: nguoiLap,
                    createddate: createddate,
                    nguoiDuyet: nguoiDuyet,
                    thoigianDuyet: thoigianDuyet,
                }
            });

            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: "items",
                data: {
                    arrItems: arrItems
                }
            });
        }

        const getItemData = (itemId) => {
            if (itemId) {
                return search.lookupFields({
                    type: lfunc.getItemRecordType(itemId),
                    id: itemId,
                    columns: ['displayname']
                })
            }
            return {displayname: ''}
        }

        const getInventoryData = (inventoryId) => {
            let color_seri = '';
            if (inventoryId) {
                let lkFInvDetail = search.lookupFields({
                    type: 'inventorynumber',
                    id: inventoryId,
                    columns: ['custitemnumber_scv_item_num_color_seri']
                });
                color_seri = lkFInvDetail.custitemnumber_scv_item_num_color_seri;
                // if (!color_seri) {
                //     color_seri = rec.getSublistValue('item', 'custcol_scv_qc_serial_code', line);
                // }
            }
            return color_seri
        }

        // lấy ra tất cả các itf và item trong chúng
        const getITFData = (rec) => {
            let linesSlLink = rec.getLineCount('links');
            let arrItfData = [];
            for (let i = 0; i < linesSlLink; i++) {
                let type = rec.getSublistValue('links', 'type', i);
                if (type === 'Item Fulfillment') {
                    let idItf = rec.getSublistValue('links', 'id', i);
                    let recItf = record.load({
                        id: idItf,
                        type: 'itemfulfillment'
                    });
                    addItemsToArray(recItf, arrItfData);
                }
            }
            return arrItfData;
        }

        // lấy ra các item trong mỗi ITF và đưa vào mảng arrItfData
        const addItemsToArray = (rec, arrItfData) => {
            for (let i = 0; i < rec.getLineCount('item'); i++) {
                let line = {};
                line.item = rec.getSublistValue('item', 'item', i);
                line.quantity = rec.getSublistValue('item', 'quantity', i);
                line.ori_line_id = rec.getSublistValue('item', 'custcol_scv_ori_lineid', i);
                let subRecInvDetail = rec.getSublistSubrecord('item', 'inventorydetail', i);
                if (subRecInvDetail) {
                    let lcInvDetail = subRecInvDetail.getLineCount('inventoryassignment');
                    for (let j = 0; j < lcInvDetail; j++) {
                        let tempLine = {...line}
                        tempLine.inventorynumber = subRecInvDetail.getSublistValue('inventoryassignment', 'issueinventorynumber', j);
                        tempLine.inventorynumberText = subRecInvDetail.getSublistText('inventoryassignment', 'issueinventorynumber', j) ;
                        tempLine.quantity = subRecInvDetail.getSublistValue('inventoryassignment', 'quantity', j);
                        tempLine.status = subRecInvDetail.getSublistText('inventoryassignment', 'inventorystatus', j) ||
                            subRecInvDetail.getSublistValue('inventoryassignment', 'inventorystatus_display', j) || '';
                        arrItfData.push(tempLine);
                    }
                } else {
                    arrItfData.push(line);
                }
            }
        }

        const printTemCuonNhom = (rec, renderer, printfile) => {
            let idSublist = 'item', slInvDetail = "inventoryassignment", arrIR = [];
            let custitem_scv_dd, custitem_scv_ddns;
            let emloyeeid = rec.getValue('custbody_scv_employee_ycxvt')
            let emloyeename = '';
            let supervisorname = '';
            let stt = 1;
            if (emloyeeid) {
                const emloyeeRec = record.load({type: "employee", id: emloyeeid});
                emloyeename = emloyeeRec.getValue('firstname');
                const supervisorid = emloyeeRec.getValue('supervisor');

                supervisorname = supervisorid
                    ? record.load({type: "employee", id: supervisorid}).getValue('firstname')
                    : null;
            }
            for (let i = 0; i < rec.getLineCount(idSublist); i++) {
                let line = {}, upccode, displayname, otherInfoItem;
                // line.displayname = rec.getSublistValue(suiteletId, 'displayname', i);
                let itemId = rec.getSublistValue(idSublist, 'item', i);
                let rectype = lfunc.getItemRecordType(itemId);
                let isTemCuonNhom = false, isNhomACP = false, isNhomTran = false;
                if (itemId && rectype === 'lotnumberedassemblyitem') {
                    let recItem = record.load({
                        type: rectype,
                        id: itemId,
                        isDynamic: false
                    });
                    upccode = recItem.getValue('upccode');
                    displayname = recItem.getValue('displayname');
                    otherInfoItem = recItem.getValue('custitem_scv_other_info_print_on_label');
                    // let customform = recItem.getValue('customform');
                    let group_lv1 = recItem.getValue('custitem_scv_group_lv1');
                    let group_lv2 = recItem.getValue('custitem_scv_group_lv2');
                    //thanh dev add 5/6/2025
                    custitem_scv_dd = getItemSizeByFormat(recItem, 'custitem_scv_dd');
                    custitem_scv_ddns = getItemSizeByFormat(recItem, 'custitem_scv_ddns');
                    //thanhdev end
                    if ( ((group_lv1 === '16' && (group_lv2 === '20' || group_lv2 === '23')) ||
                        (group_lv1 === '31' && group_lv2 === '5'))) {
                        isTemCuonNhom = true;
                    }
                    if (((group_lv1 === '16' && (group_lv2 === '20' || group_lv2 === '23')))) {
                        isNhomACP = true;
                    }
                    if ((group_lv1 === '31' && (group_lv2 === '5' || group_lv2 === '24'))) {
                        isNhomTran = true;
                    }
                }

                if (isTemCuonNhom && printfile === 'scv_render_tem_cuon_nhom') {
                    displayname = custitem_scv_ddns ? displayname.replace(custitem_scv_dd, custitem_scv_ddns) : displayname;
                    let inventorydetailavail = rec.getSublistValue(idSublist, 'inventorydetailavail', i);
                    if (inventorydetailavail === true || inventorydetailavail === 'T') {
                        let InvDetailSub = rec.getSublistSubrecord(idSublist, 'inventorydetail', i);
                        let lcInvDetail = InvDetailSub.getLineCount(slInvDetail);
                        for (let j = 0; j < lcInvDetail; j++) {
                            let inventorynumber = InvDetailSub.getSublistValue(slInvDetail, 'receiptinventorynumber', j) ||
                                InvDetailSub.getSublistText(slInvDetail, 'issueinventorynumber', j) || '';
                            let inventoryid = InvDetailSub.getSublistValue(slInvDetail, 'issueinventorynumber', j) ||
                                InvDetailSub.getSublistValue(slInvDetail, 'numberedrecordid', j);
                            let color_seri = '', core_weight = '';
                            let net_weight = InvDetailSub.getSublistText(slInvDetail, 'quantity', j) || '';

                            if (inventoryid) {
                                let lkFInvDetail = search.lookupFields({
                                    type: 'inventorynumber',
                                    id: inventoryid,
                                    columns: [
                                        'custitemnumber_scv_item_num_color_seri',
                                        'custitemnumber_scv_net_weight',
                                        'custitemnumber_scv_core_weight'
                                    ]
                                });

                                color_seri = lkFInvDetail.custitemnumber_scv_item_num_color_seri || '';
                                // net_weight = lkFInvDetail.custitemnumber_scv_net_weight || '';
                                core_weight = lkFInvDetail.custitemnumber_scv_core_weight || '';
                            }

                            arrIR.push({
                                displayname: displayname,
                                upccode: upccode,
                                inventorynumber: inventorynumber,
                                color_seri: color_seri,
                                net_weight: net_weight,
                                core_weight: core_weight,
                                otherInfoItem: otherInfoItem
                            });
                        }
                    }
                }

                if ((isNhomACP && printfile === 'scv_render_nhom_acp') || (isNhomTran && printfile === 'scv_render_nhom_tran')) {
                    let inventorydetailavail = rec.getSublistValue(idSublist, 'inventorydetailavail', i);
                    if (inventorydetailavail === true || inventorydetailavail === 'T') {
                        let InvDetailSub = rec.getSublistSubrecord(idSublist, 'inventorydetail', i);
                        let oriLineId = rec.getSublistValue(idSublist, 'custcol_scv_ori_lineid', i);
                        let arrStatus = getInventoryStatusChange(rec, 'customsearch_scv_rem_qc_done_2', InvDetailSub, slInvDetail);
                        let lcInvDetail = InvDetailSub.getLineCount(slInvDetail);
                        for (let j = 0; j < lcInvDetail; j++) {
                            let line = {};
                            let inventorynumber = InvDetailSub.getSublistValue(slInvDetail, 'receiptinventorynumber', j) ||
                                InvDetailSub.getSublistText(slInvDetail, 'issueinventorynumber', j) || '';
                            let inventoryId = InvDetailSub.getSublistValue(slInvDetail, 'issueinventorynumber', j) ||
                                InvDetailSub.getSublistValue(slInvDetail, 'numberedrecordid', j);
                            let quantity = InvDetailSub.getSublistValue(slInvDetail, 'quantity', j) || '';
                            let color_seri, core_weight;
                            let status = InvDetailSub.getSublistText(slInvDetail, 'inventorystatus', j) || '';
                            let net_weight = InvDetailSub.getSublistText(slInvDetail, 'quantity', j) || '';

                            if (inventoryId) {
                                let lkFInvDetail = search.lookupFields({
                                    type: 'inventorynumber',
                                    id: inventoryId,
                                    columns: ['custitemnumber_scv_item_num_color_seri', 'custitemnumber_scv_net_weight',
                                        'custitemnumber_scv_core_weight']
                                });
                                color_seri = lkFInvDetail.custitemnumber_scv_item_num_color_seri;
                                core_weight = lkFInvDetail.custitemnumber_scv_core_weight;
                                // net_weight = lkFInvDetail.custitemnumber_scv_net_weight;
                            }
                            line.location = rec.getSublistText(idSublist, 'location', i);
                            line.upccode = upccode;
                            // line.displayname = printfile === 'scv_render_nhom_acp' ? displayname.replace(custitem_scv_dd, custitem_scv_ddns) : displayname;
                            line.displayname = printfile === 'scv_render_nhom_acp' && custitem_scv_ddns ? displayname.replace(custitem_scv_dd, custitem_scv_ddns) : displayname;
                            line.otherInfo = printfile === 'scv_render_nhom_acp' ? otherInfoItem : '';
                            line.color_seri = color_seri;
                            line.core_weight = core_weight; // TL lõi
                            line.net_weight = net_weight;
                            line.inventorynumber = inventorynumber;
                            line.quantity = quantity; // TL tịnh ban đầu
                            line.tl_bu = 0;
                            line.tl_tong = Number(core_weight) + Number(quantity); // TL lõi + TL tịnh + TL bù
                            //line.status = status;
                            let resultStatus = arrStatus.filter(s => (s.getValue({
                                name: 'inventorynumber',
                                join: 'inventorydetail',
                                summary: search.Summary.GROUP
                            }) === inventoryId) && s.getValue({
                                name: 'custbody_scv_oriline_id',
                                summary: search.Summary.GROUP
                            }) === oriLineId);
                            if (resultStatus.length < 1) {
                                resultStatus = arrStatus.filter(s => s.getValue({
                                        name: 'custbody_scv_oriline_id',
                                        summary: search.Summary.GROUP
                                    })
                                    === oriLineId)
                            }
                            if (resultStatus.length > 1) {
                                for (let index = 0; index < resultStatus.length; index++) {
                                    let line1 = {...line};
                                    line1.status = resultStatus[index]?.getText({
                                        name: 'custbody_scv_revised_status',
                                        summary: search.Summary.GROUP
                                    }) || '';
                                    line1.quantity = resultStatus[index]?.getValue({
                                        name: 'quantity',
                                        join: 'inventorydetail',
                                        summary: search.Summary.SUM
                                    }) || 0;
                                    if (index < resultStatus.length - 1) {
                                        arrIR.push(line1);
                                    }
                                    line1.stt = stt++;
                                }
                                line.status = resultStatus[resultStatus.length - 1]?.getText({
                                    name: 'custbody_scv_revised_status',
                                    summary: search.Summary.GROUP
                                }) || '';
                                line.quantity = resultStatus[resultStatus.length - 1]?.getValue({
                                    name: 'quantity',
                                    join: 'inventorydetail',
                                    summary: search.Summary.SUM
                                }) || 0;
                            } else {
                                line.status = resultStatus[0]?.getText({
                                    name: 'custbody_scv_revised_status',
                                    summary: search.Summary.GROUP
                                }) || '';
                            }
                            // thanhdev
                            arrIR.push(line);
                        }
                    }

                    const grouped = Object.values(
                        arrIR.reduce((acc, item) => {
                            const inv = item.inventorynumber;
                            if (!acc[inv]) {
                                acc[inv] = { ...item, quantity: 0 };
                            }
                            acc[inv].quantity += Number(item.quantity); // force number
                            return acc;
                        }, {})
                    );

                    arrIR = grouped;
                }
            }

            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: "jsonData",
                data: {
                    arrIR: arrIR,
                    emloyeename: emloyeename,
                    supervisorname: supervisorname,
                }
            });
        }

        const getItemSizeByFormat = (recItem, field) => {
            let fieldValue = recItem.getText(field);
            if (!fieldValue) return '';
            let size = fieldValue.split(':')[1];
            if (!size) return '';
            size = size.replace('mm', '');
            return size;
            // return size.trim();
        }

        const formatTimeToVietnamese = (timeString) => {
            if (!timeString) return '';
            let arrTime = timeString.split(':');
            return `${arrTime[0]} giờ ${arrTime[1]} phút`;
        }

        const addDefaultRecordRender = (renderer, type, id) => {
            let rec = record.load({
                type: type,
                id: id,
                isDynamic: false
            });
            renderer.addRecord('record', rec);
            return rec;
        }

        const changeCurrency1 = (number, isDefaultToEmpty = false) => {
            if (number === 0 && isDefaultToEmpty) return ' ';
            if (number === 0) return 0;
            number = parseFloat(number).toFixed(2);
            let parts = number.toString().split(".");
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            return parts.join(".");
        }

        const getTranDate = (trandate) => {
            if (!(trandate instanceof Date) || isNaN(trandate.getTime())) {
                return 'Ngày ............tháng ............. năm.................';
            }
            let timezoneOffset = trandate.getTimezoneOffset() / 60;
            trandate.setHours(trandate.getHours() + timezoneOffset + 7);
            let dd_now = String(trandate.getDate()).padStart(2, '0');
            let mm_now = String(trandate.getMonth() + 1).padStart(2, '0');
            let yyyy_now = trandate.getFullYear();
            // let ngayin =  dd_now + ' / ' + mm_now + ' / ' + yyyy_now;
            return 'Ngày ' + dd_now + ' tháng ' + mm_now + ' năm ' + yyyy_now;
        }

        const formatDate = (date) => {
            return ` Ngày ${date.split('/')[0]} tháng ${date.split('/')[1]} năm ${date.split('/')[2]}`;
        }

        const formatDateDDMMYYYY_VN = (date) => {
             if (!(date instanceof Date) || isNaN(date.getTime())) return '';
             let timezoneOffset = date.getTimezoneOffset() / 60;
             let vnDate = new Date(date.getTime()); // Clone
             vnDate.setHours(vnDate.getHours() + timezoneOffset + 7);

             let dd = String(vnDate.getDate()).padStart(2, '0');
             let mm = String(vnDate.getMonth() + 1).padStart(2, '0');
             let yyyy = vnDate.getFullYear();
             return `${dd}/${mm}/${yyyy}`;
        }

        const formatDateTimeDDMMYYYY_VN = (date) => {
             if (!(date instanceof Date) || isNaN(date.getTime())) return '';
             let timezoneOffset = date.getTimezoneOffset() / 60;
             let vnDate = new Date(date.getTime()); // Clone
             vnDate.setHours(vnDate.getHours() + timezoneOffset + 7);

             let dd = String(vnDate.getDate()).padStart(2, '0');
             let mm = String(vnDate.getMonth() + 1).padStart(2, '0');
             let yyyy = vnDate.getFullYear();
             let hh = String(vnDate.getHours()).padStart(2, '0');
             let min = String(vnDate.getMinutes()).padStart(2, '0');
             return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
        }

        const escapeXML = (value) => {
            if (!value) return '';
            return value.replace(/&(?![a-zA-Z]+;|#\d+;)/g, '&amp;');
            // return value
            //     .replace(/&/g, '&amp;')
            //     .replace(/</g, '&lt;')
            //     .replace(/>/g, '&gt;')
            //     .replace(/'/g, '&apos;')
            //     .replace(/"/g, '&quot;')
            //     ;
        }

        const onRequest = (scriptContext) => {
            let request = scriptContext.request;
            let response = scriptContext.response;
            let params = request.parameters;

            let pdfFile = renderRecordToPdfWithTemplate(params.id, params.type, params.printfile);
            response.writeFile(pdfFile, true);

        }

        return {
            onRequest,
            renderRecordToPdfWithTemplate
        }

    }
)
;
