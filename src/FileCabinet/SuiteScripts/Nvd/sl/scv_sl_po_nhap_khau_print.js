/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/file', 'N/search', 'N/record', '../common/scv_common_pdf', 'N/render','N/query'],

    (file, search, record, comPdf, render, query) => {

        const PO_COLUMNS = [
            'custbody_scv_po_quotation_date',
            'subsidiary.custrecord_scv_sub_legalname_eng',
            'subsidiary',
            'subsidiary.custrecord_scv_sub_phone',
            'tranid',
            'trandate',
            'tranid',
            'entity',
            'custbody_scv_po_contract_numb',
            'custbody_scv_po_contract_date',
            'custbody_scv_po_contract_numb',
            'custbody_scv_po_contract_date',

            'custbody_scv_po_pur_contract.custrecord_scv_pur_contract_no_contract',
            'custbody_scv_po_pur_contract.custrecord_scv_pur_contract_date_contrac',
            'custbody_scv_po_pur_contract.custrecord_scv_pur_contract_no_contract',
            'custbody_scv_po_pur_contract.custrecord_scv_pur_contract_date_contrac',

            'custbody_scv_po_name_of_goods_en',
            'custbody_scv_po_name_of_goods_vn',
            'custbody_scv_po_pur_contract.custrecord_scv_pur_contract_te_o_pri_en',
            'custbody_scv_po_pur_contract.custrecord_scv_pur_contract_qty_tole_en',
            'custbody_scv_po_pur_contract.custrecord_scv_pur_contract_deli_term_en',
            'custbody_scv_po_pur_contract.custrecord_scv_pur_contract_deli_time_en',
            'custbody_scv_po_pur_contract.custrecord_scv_pur_contract_load_port_en',
            'custbody_scv_po_pur_contract.custrecord_scv_pur_contract_des_port_en',
            'custbody_scv_po_pur_contract.custrecord_scv_pur_contract_part_ship_en',
            'custbody_scv_po_pur_contract.custrecord_scv_pur_contract_ship_term_en',
            'custbody_scv_po_pur_contract.custrecord_scv_pur_contract_pay_term_en',
            'custbody_scv_po_pur_contract.custrecord_scv_pur_contract_pack_en',
            'custbody_scv_po_pur_contract.custrecord_scv_pur_contract_oth_term_en',
            'currency',
            'custbody_scv_po_pur_contract.custrecord_scv_pur_contract_te_o_pri_vn',
            'custbody_scv_po_pur_contract.custrecord_scv_pur_contract_qty_tole_vn',
            'custbody_scv_po_pur_contract.custrecord_scv_pur_contract_deli_term_vn',
            'custbody_scv_po_pur_contract.custrecord_scv_pur_contract_deli_time_vn',
            'custbody_scv_po_pur_contract.custrecord_scv_pur_contract_load_port_vn',
            'custbody_scv_po_pur_contract.custrecord_scv_pur_contract_des_port_vn',
            'custbody_scv_po_pur_contract.custrecord_scv_pur_contract_part_ship_vn',
            'custbody_scv_po_pur_contract.custrecord_scv_pur_contract_ship_term_vn',
            'custbody_scv_po_pur_contract.custrecord_scv_pur_contract_pay_term_vn',
            'custbody_scv_po_pur_contract.custrecord_scv_pur_contract_pack_vn',
            'custbody_scv_po_pur_contract.custrecord_scv_pur_contract_oth_term_vn'
        ]

        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            let parameters = scriptContext.request.parameters;

            if (scriptContext.request.method === 'POST') {
                let dataPo = getDataPo(parameters);
                scriptContext.response.setHeader("Content-Type", "text/plain;charset=UTF-8");
                scriptContext.response.write(JSON.stringify(dataPo));
            } else {
                let pdfFile = buildPdfFile(parameters);
                scriptContext.response.writeFile(pdfFile, true);
            }
        }

        const buildPdfFile = (parameters) => {
            let recPo = record.load({
                type: parameters.rectype,
                id: parameters.recid
            });
            let has2Uom = recPo.getSublistValue({sublistId: 'item', fieldId: 'custcol_scv_converted_uom', line: 0});
            let idTemplate;
            // với PO có 2 uom (loại đơn vị tính) riêng dành cho nhập kho và mua thì chia 2 mẫu)
            if(has2Uom ) {
                idTemplate = 'CUSTTMPL_SCV_PO_NHAP_KHAU_2UOM';
            }else{
                idTemplate = 'CUSTTMPL_SCV_PO_NHAP_KHAU';
            }
            let objRender = comPdf.initTemplateRender(idTemplate);
            comPdf.addFontVietnamese(objRender);
            comPdf.addImage(objRender, 'Logo-removebg-preview.png');
            objRender.addRecord('record', recPo);
            addReplacementDataToRenderer(recPo, objRender, parameters);
            addItemDataToRenderer(recPo, objRender);
            addAdditionalData(recPo, objRender);
            return objRender.renderAsPdf();
        }

        const getStrYcmh = (recPo) => {
            let ycmhNo = '';
            let lcItems = recPo.getLineCount({sublistId: 'item'});
            for (let i = 0; i < lcItems; i++) {
                let custcol_scv_purchase_request_number = recPo.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_scv_purchase_request_number',
                    line: i
                });
                if (custcol_scv_purchase_request_number) {
                    if (ycmhNo && !ycmhNo.includes(custcol_scv_purchase_request_number)) {
                        ycmhNo += ', ' + custcol_scv_purchase_request_number;
                    } else if (!ycmhNo) {
                        ycmhNo = custcol_scv_purchase_request_number;
                    }
                }
            }

            return ycmhNo;
        }

        const addAdditionalData = (recPo, objRender) => {
            let ycmhNo = getStrYcmh(recPo);

            objRender.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: 'additionalData',
                data: {
                    ycmhNo: ycmhNo || ' ',
                }
            });
        }

        const addItemDataToRenderer = (recPo, objRender) => {
            let lineCount = recPo.getLineCount({sublistId: 'item'});
            let tableData = [];
            let sumAmount = 0;
            let sumQuantity2Uom = 0;
            let sumQuantity = 0;

            let has2Uom = recPo.getSublistValue({sublistId: 'item', fieldId: 'custcol_scv_converted_uom', line: 0});
            let arrPrTranlines = [];
            // if(has2Uom) {
            //     arrPrTranlines = getArrTranLines(recPo);
            // }

            if(has2Uom) {
                // set data cho mẫu 2 đơn vị tính
                // ========--------------nếu mẫu chỉ có 1 đơn vị tính thì không cần quan tâm đến các biến này
                for (let i = 0; i < lineCount; i++) {
                    tableData.push({
                        displayname: recPo.getSublistText({sublistId: 'item', fieldId: 'custcol_scv_item_eng_name', line: i}) ||
                            recPo.getSublistText({sublistId: 'item', fieldId: 'custcol_scv_item_display_name_en', line: i}) ||
                            recPo.getSublistText({sublistId: 'item', fieldId: 'displayname', line: i})
                        ,
                        specs1uom : getSpecsValue(recPo, i, ['custcol_scv_po_ddn']),
                        specs2uom : getSpecsValue(recPo, i, ['custcol_scv_so_kho_rong']),
                        // specs3uom : getSoHieuMarket(recPo, i, arrPrTranlines) || ' ',
                        specs3uom : getSpecsValue(recPo, i, ['custcol_scv_market_number']) || ' ',
                        quantityUom1 : recPo.getSublistValue({sublistId: 'item', fieldId: 'custcol_scv_qty_before_tolerance', line: i}),
                        quantityUom2 : recPo.getSublistValue({sublistId: 'item', fieldId: 'custcol_scv_po_qty_unit_m2', line: i}),
                        unit_price_uom : recPo.getSublistValue({sublistId: 'item', fieldId: 'custcol_scv_po_converted_unit_price', line: i}),
                        amount: Number(recPo.getSublistValue({ sublistId: 'item', fieldId: 'custcol_scv_amount_bef_tolerance', line: i})),
                        custcol_scv_memo: recPo.getSublistValue({sublistId: 'item', fieldId: 'custcol_scv_memo', line: i}) || ' ',
                    });
                    sumQuantity2Uom += Number(recPo.getSublistValue({sublistId: 'item', fieldId: 'custcol_scv_qty_before_tolerance', line: i}));
                    sumAmount += Number(recPo.getSublistValue({ sublistId: 'item', fieldId: 'custcol_scv_amount_bef_tolerance', line: i}))
                }
                sumQuantity = tableData.reduce((sum, item) => sum + item.quantityUom2, 0);
                // ===============-------------nếu có 2 đơn vị tính thì lấy các giá trị tương ứng
            }else{
                for (let i = 0; i < lineCount; i++) {
                    let specs1 = getSpecsValue(recPo, i, ['custcol_scv_po_ddn', 'custcol_scv_so_kho_rong', 'custcol_scv_so_chieu_dai']);
                    let specs2 = getSpecsValue(recPo, i, ['custcol_scv_po_ls']);
                    let specs3 = getSpecsValue(recPo, i, ['custcol_scv_po_alu_label','custcol_scv_po_hardness']);
                    let specs4 = getSpecsValue(recPo, i, ['custcol_scv_vendor_color_code', 'custcol_scv_po_properties']);

                    tableData.push({
                        'displayname': recPo.getSublistText({
                            sublistId: 'item',
                            fieldId: 'custcol_scv_item_eng_name',//'displayname',
                            line: i
                        }) || recPo.getSublistText({
                            sublistId: 'item',
                            fieldId: 'custcol_scv_item_display_name_en',
                            line: i
                        })|| recPo.getSublistText({
                            sublistId: 'item',
                            fieldId: 'displayname',
                            line: i
                        })
                        ,
                        'specs': recPo.getSublistText({
                            sublistId: 'item',
                            fieldId: 'custcol_scv_po_properties',
                            line: i
                        }) || ' ',
                        specs1: specs1,
                        specs2: specs2,
                        specs3: specs3,
                        specs4: specs4,
                        'unit': recPo.getSublistText({sublistId: 'item', fieldId: 'units', line: i}) || ' ',
                        //'quantity': recPo.getSublistValue({sublistId: 'item', fieldId: 'quantity', line: i}) || ' ',
                        // thay thử quantity thành field khác
                        'quantity': recPo.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_scv_qty_before_tolerance',
                            line: i
                        }) || ' ',
                        'unit_price': recPo.getSublistValue({sublistId: 'item', fieldId: 'rate', line: i}) || ' ',
                        'amount': Number(recPo.getSublistValue({ sublistId: 'item', fieldId: 'custcol_scv_amount_bef_tolerance', line: i}))
                            // Number(recPo.getSublistValue({
                            //     sublistId: 'item',
                            //     fieldId: 'custcol_scv_qty_before_tolerance',
                            //     line: i
                            // }))
                            // * Number(recPo.getSublistValue({sublistId: 'item', fieldId: 'rate', line: i}))
                            // || ' '
                        ,
                        'custcol_scv_memo': recPo.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_scv_memo',
                            line: i
                        }) || ' ',
                    });
                    sumQuantity2Uom += Number(recPo.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_scv_qty_before_tolerance',
                        line: i
                    }));
                    sumAmount +=  Number(recPo.getSublistValue({ sublistId: 'item', fieldId: 'custcol_scv_amount_bef_tolerance', line: i}))

                        // Number(recPo.getSublistValue({
                        //     sublistId: 'item',
                        //     fieldId: 'custcol_scv_qty_before_tolerance',
                        //     line: i
                        // }))
                        // * Number(recPo.getSublistValue({sublistId: 'item', fieldId: 'rate', line: i}))
                }
                sumQuantity = tableData.reduce((sum, item) => sum + item.quantity, 0);
            }

            objRender.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: 'recItems',
                data: {
                    items: tableData,
                    sumQuantity: sumQuantity,
                    sumAmount: sumAmount,
                    sumquantityUom1: sumQuantity2Uom,
                }
            });
        }

        const getSpecsValue = (recPo, i, arrField) => {
            let colValue = ''
            for (let j = 0; j < arrField.length; j++) {
                let fieldValue = recPo.getSublistValue({sublistId: 'item', fieldId: arrField[j], line: i});
                // nếu fieldValue có dấu : trong giá trị thì lấy phần sau của dấu :
                fieldValue = fieldValue && String(fieldValue).includes(':') ? String(fieldValue).split(':')[1].trim() : fieldValue;
                // let fieldLabel = recPo.getSublistField({sublistId: 'item', fieldId: arrField[j], line: i}).label;
                if (fieldValue) {
                    if (colValue) {
                        // colValue += ', ' + fieldLabel + ' ' + fieldValue;
                        colValue += ' x ' + fieldValue;
                    } else {
                        colValue =  fieldValue;
                    }
                }
            }
            return colValue;
        }

        const addReplacementDataToRenderer = (recPo, objRender, parameters) => {
            let lkFieldsPo = search.lookupFields({
                type: parameters.rectype,
                id: parameters.recid,
                columns: PO_COLUMNS
            });

            objRender.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: 'recMainPo',
                data: {
                    bodyfields: lkFieldsPo
                }
            });

            let employeeFields = getEmployeeFields(lkFieldsPo);
            objRender.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: 'recEmployee',
                data: {
                    bodyfields: employeeFields
                }
            })

            let subsidiaryFields = getSubsidiaryFields(lkFieldsPo['subsidiary'][0].value);
            objRender.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: 'recSubsidiary',
                data: {
                    bodyfields: subsidiaryFields
                }
            })

        }

        const colId = ['No', 'Name', 'Specs1', 'Specs2', 'Specs3', 'Specs4', 'Unit', 'Quantity', 'Unit Price', 'Amount', 'Note'];
        const colId2Uom = ['No', 'Name', 'Specs1', 'Specs2', 'Specs3', 'DvtNhap',
            'DvtMua', 'Unit Price', 'Amount', 'Note'];

        const getDataPo = (parameters) => {
            let recPo = record.load({type: parameters.rectype, id: parameters.recid});
            let has2Uom = recPo.getSublistValue({sublistId: 'item', fieldId: 'custcol_scv_converted_uom', line: 0});
            let urlToTemplate;
            // với PO có 2 uom (loại đơn vị tính) riêng dành cho nhập kho và mua thì chia 2 mẫu)
            if (has2Uom) {
                urlToTemplate = file.load({id: '../xls/scv_xlsx_po_nhap_khau_2uom.xlsx'}).url;
                let {tableData, sumQuantity, sumAmount, sumQuantity1} = getTableData2Uom(recPo);
                let mappedData = getMappedData2Uom(parameters, sumQuantity, sumAmount, recPo, sumQuantity1);
                let templateType = getTemplateType(parameters);
                return {
                    templatetype: templateType,
                    filename: 'Đơn mua nhập khẩu.xlsx',
                    url: urlToTemplate,
                    mappedData: mappedData,
                    arrData: tableData,
                    colId: colId2Uom,
                    idxSourceRow: 16,
                    idxRowData: 17,
                    sumQuantity: sumQuantity,
                    sumAmount: sumAmount,
                    sumQuantity1,
                    template: '2uom'
                }
            } else {
                urlToTemplate = file.load({id: '../xls/scv_xlsx_po_nhap_khau.xlsx'}).url;
                let {tableData, sumQuantity, sumAmount} = getTableData1Uom(recPo);
                let mappedData = getMappedData(parameters, sumQuantity, sumAmount, recPo);
                let templateType = getTemplateType(parameters);
                return {
                    templatetype: templateType,
                    filename: 'Đơn mua nhập khẩu.xlsx',
                    url: urlToTemplate,
                    mappedData: mappedData,
                    arrData: tableData,
                    colId: colId,
                    idxSourceRow: 16,
                    idxRowData: 17,
                    sumQuantity: sumQuantity,
                    sumAmount: sumAmount,
                    template: '1uom'
                }
            }
        }

        const getTableData2Uom = (recPo) => {
            let lineCount = recPo.getLineCount({sublistId: 'item'});
            let tableData = [];
            let sumQuantity = 0;
            let sumAmount = 0;
            let sumQuantity1 = 0;

            // query ra các transaction lines của các purrchase request tương ứng
            // id của các PR được lấy từ các line của PO
            // vì cần map tương ứng để lấy custcol_scv_sumtrans_line_originno.custcol_scv_market_number
            // (không thể load PR với mỗi dòng tranline Po tương ứng do tốn tài nguyên )
            // let arrPrTranlines = getArrTranLines(recPo);
            for (let i = 0; i < lineCount; i++) {
                let specs1 = getSpecsValue(recPo, i, ['custcol_scv_po_ddn']);
                let specs2 = getSpecsValue(recPo, i, ['custcol_scv_so_kho_rong']);
                // let specs3 = getSoHieuMarket(recPo, i, arrPrTranlines);
                let specs3 = getSpecsValue(recPo, i, ['custcol_scv_market_number']);
                tableData.push({
                    'No': i + 1,
                    'Name':
                        // recPo.getSublistText({sublistId: 'item', fieldId: 'displayname', line: i}) || ' ',
                        recPo.getSublistText({
                            sublistId: 'item',
                            fieldId: 'custcol_scv_item_eng_name',//'displayname',
                            line: i
                        }) || recPo.getSublistText({
                            sublistId: 'item',
                            fieldId: 'custcol_scv_item_display_name_en',
                            line: i
                        })|| recPo.getSublistText({
                            sublistId: 'item',
                            fieldId: 'displayname',
                            line: i
                        })
                    ,
                    'Specs1':specs1,
                    'Specs2': specs2,
                    'Specs3': specs3,
                    'DvtNhap': recPo.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_scv_qty_before_tolerance',
                        line: i
                    }) || ' ',
                    'DvtMua': recPo.getSublistValue({sublistId: 'item', fieldId: 'custcol_scv_po_qty_unit_m2', line: i}) || ' ',
                    'Unit Price': recPo.getSublistValue({sublistId: 'item', fieldId: 'custcol_scv_po_converted_unit_price', line: i}) || ' ',
                    'Amount': Number(recPo.getSublistValue({sublistId: 'item', fieldId: 'custcol_scv_amount_bef_tolerance', line: i}))
                        // Number(recPo.getSublistValue({sublistId: 'item', fieldId: 'custcol_scv_po_converted_unit_price', line: i}))
                        // * Number(recPo.getSublistValue({
                        //     sublistId: 'item',
                        //     fieldId: 'custcol_scv_po_qty_unit_m2',
                        //     line: i
                        // }))
                        // || ' '
                    ,
                    'Note': recPo.getSublistValue({sublistId: 'item', fieldId: 'description', line: i}) || ' ',
                });
            }
            sumQuantity = tableData.reduce((sum, item) => sum + Number(item.DvtMua), 0).toFixed(2);
            sumAmount = tableData.reduce((sum, item) => sum + Number(item.Amount), 0).toFixed(2);
            sumQuantity1 = tableData.reduce((sum, item) => sum + Number(item.DvtNhap), 0).toFixed(2);

            return {
                tableData: tableData,
                sumQuantity: sumQuantity,
                sumAmount: sumAmount,
                sumQuantity1
            };
        }

        const getMappedData2Uom = (parameters, sumQuantity, sumAmount, recPo, sumQuantity1) => {
            let lkFieldsPo = search.lookupFields({
                type: parameters.rectype,
                id: parameters.recid,
                columns: PO_COLUMNS
            });

            const dvt1 = recPo.getSublistText({
              sublistId: 'item',
                fieldId: 'units_display',
                line: 0
            });
            const dvt2 = recPo.getSublistText({
                sublistId: 'item',
                fieldId: 'custcol_scv_converted_uom_display',
                line: 0
            });
            let employeeFields = getEmployeeFields(lkFieldsPo);
            let subsidiaryFields = getSubsidiaryFields(lkFieldsPo['subsidiary'][0].value);

            return {
                F3: {'subsidiary_legalname': lkFieldsPo['subsidiary.custrecord_scv_sub_legalname_eng'] || ' '},
                F4: {'subsidiary_address': subsidiaryFields['custrecord_scv_sub_address_en'] || ' '},
                // F5: {'subsidiary_phone': lkFieldsPo['subsidiary.custrecord_scv_sub_phone'] || ' '},
                A3: {'entity_custentity_scv_legal_name': employeeFields['custentity_scv_legal_name'] || ' '},
                A4: {'entity_address': employeeFields['address'] || ' '},
                // A5: {'entity_phone': employeeFields['phone'] || ' '},
                B7: {'tranid': lkFieldsPo['tranid'] || ' '},
                D7: {'trandate': lkFieldsPo['trandate'] || ' '},
                G7: {'tranid': lkFieldsPo['tranid'] || ' '},
                I7: {'trandate': lkFieldsPo['trandate'] || ' '},
                A8: {'custbody_scv_po_contract_numb': lkFieldsPo['custbody_scv_po_pur_contract.custrecord_scv_pur_contract_no_contract'] || ' '},
                D8: {'custbody_scv_po_contract_date': lkFieldsPo['custbody_scv_po_pur_contract.custrecord_scv_pur_contract_date_contrac'] || ' '},
                F8: {'custbody_scv_po_contract_numb': lkFieldsPo['custbody_scv_po_pur_contract.custrecord_scv_pur_contract_no_contract'] || ' '},
                I8: {'custbody_scv_po_contract_date': lkFieldsPo['custbody_scv_po_pur_contract.custrecord_scv_pur_contract_date_contrac'] || ' '},
                F9: {'ycmhno': getStrYcmh(recPo)},
                A10: {'ngaybaogia' : lkFieldsPo['custbody_scv_po_quotation_date']},
                H10: {'ngaybaogia': lkFieldsPo['custbody_scv_po_quotation_date']},
                B12: {'custbody_scv_po_name_of_goods_en': lkFieldsPo['custbody_scv_po_name_of_goods_en'] || ' '},
                F12: {'custbody_scv_po_name_of_goods_vn': lkFieldsPo['custbody_scv_po_name_of_goods_vn'] || ' '},
                F15: {'dvt1': dvt1 || ' '},
                G15: {'dvt2': dvt2 || ' '},
                C18: {'currency': lkFieldsPo['currency'][0]?.text || ' '},
                G18: {'currency': lkFieldsPo['currency'][0]?.text || ' '},
                C19: {'custrecord_scv_pur_contract_te_o_pri_en': lkFieldsPo['custbody_scv_po_pur_contract.custrecord_scv_pur_contract_te_o_pri_en'] || ' '},
                B20: {'custrecord_scv_pur_contract_qty_tole_en': lkFieldsPo['custbody_scv_po_pur_contract.custrecord_scv_pur_contract_qty_tole_en'] || ' '},
                B21: {'custrecord_scv_pur_contract_deli_term_en': lkFieldsPo['custbody_scv_po_pur_contract.custrecord_scv_pur_contract_deli_term_en'] || ' '},
                B22: {'custrecord_scv_pur_contract_deli_time_en': lkFieldsPo['custbody_scv_po_pur_contract.custrecord_scv_pur_contract_deli_time_en'] || ' '},
                B23: {
                    'custrecord_scv_pur_contract_load_port_en': lkFieldsPo['custbody_scv_po_pur_contract.custrecord_scv_pur_contract_load_port_en'] || ' ',
                    'custrecord_scv_pur_contract_des_port_en': lkFieldsPo['custbody_scv_po_pur_contract.custrecord_scv_pur_contract_des_port_en'] || ' '
                },
                B24: {'custrecord_scv_pur_contract_part_ship_en': lkFieldsPo['custbody_scv_po_pur_contract.custrecord_scv_pur_contract_part_ship_en'] || ' '},
                C25: {'custrecord_scv_pur_contract_ship_term_en': lkFieldsPo['custbody_scv_po_pur_contract.custrecord_scv_pur_contract_ship_term_en'] || ' '},
                B26: {'custrecord_scv_pur_contract_pay_term_en': lkFieldsPo['custbody_scv_po_pur_contract.custrecord_scv_pur_contract_pay_term_en'] || ' '},
                B27: {'custrecord_scv_pur_contract_pack_en': lkFieldsPo['custbody_scv_po_pur_contract.custrecord_scv_pur_contract_pack_en'] || ' '},
                B28: {'custrecord_scv_pur_contract_oth_term_en': lkFieldsPo['custbody_scv_po_pur_contract.custrecord_scv_pur_contract_oth_term_en'] || ' '},

                F19: {'custrecord_scv_pur_contract_te_o_pri_vn': lkFieldsPo['custbody_scv_po_pur_contract.custrecord_scv_pur_contract_te_o_pri_vn'] || ' '},
                F20: {'custrecord_scv_pur_contract_qty_tole_vn': lkFieldsPo['custbody_scv_po_pur_contract.custrecord_scv_pur_contract_qty_tole_vn'] || ' '},
                F21: {'custrecord_scv_pur_contract_deli_term_vn': lkFieldsPo['custbody_scv_po_pur_contract.custrecord_scv_pur_contract_deli_term_vn'] || ' '},
                F22: {'custrecord_scv_pur_contract_deli_time_vn': lkFieldsPo['custbody_scv_po_pur_contract.custrecord_scv_pur_contract_deli_time_vn'] || ' '},
                F23: {
                    'custrecord_scv_pur_contract_load_port_vn': lkFieldsPo['custbody_scv_po_pur_contract.custrecord_scv_pur_contract_load_port_vn'] || ' ',
                    'custrecord_scv_pur_contract_des_port_vn': lkFieldsPo['custbody_scv_po_pur_contract.custrecord_scv_pur_contract_des_port_vn'] || ' '
                },
                F24: {'custrecord_scv_pur_contract_part_ship_vn': lkFieldsPo['custbody_scv_po_pur_contract.custrecord_scv_pur_contract_part_ship_vn'] || ' '},
                F25: {'custrecord_scv_pur_contract_ship_term_vn': lkFieldsPo['custbody_scv_po_pur_contract.custrecord_scv_pur_contract_ship_term_vn'] || ' '},
                F26: {'custrecord_scv_pur_contract_pay_term_vn': lkFieldsPo['custbody_scv_po_pur_contract.custrecord_scv_pur_contract_pay_term_vn'] || ' '},
                F27: {'custrecord_scv_pur_contract_pack_vn': lkFieldsPo['custbody_scv_po_pur_contract.custrecord_scv_pur_contract_pack_vn'] || ' '},
                F28: {'custrecord_scv_pur_contract_oth_term_vn': lkFieldsPo['custbody_scv_po_pur_contract.custrecord_scv_pur_contract_oth_term_vn'] || ' '},

                G17: {'sumQuantity': sumQuantity},
                I17: {'sumAmount': sumAmount},
                F17: {'sumQuantity1': sumQuantity1},
            }
        }

        const getSoHieuMarket = (recPo, i, arrPrTranlines) => {
            const item = recPo.getSublistValue({sublistId: 'item', fieldId: 'item', line: i});
            const idPurRequest = recPo.getSublistValue({sublistId: 'item', fieldId: 'custcol_scv_sumtrans_line_originno', line: i});
            const oriLineId = recPo.getSublistValue({sublistId: 'item', fieldId: 'custcol_scv_ori_lineid', line: i});
            return arrPrTranlines.find(tranLine =>
                tranLine.custcol_scv_ori_lineid == oriLineId &&
                tranLine.item == item &&
                tranLine.transaction == idPurRequest
            )?.custcol_scv_market_number;
        }

        const getArrTranLines = (recPo) => {
            let arrIdPr = getArrIdPrFromLines(recPo);
            arrIdPr = arrIdPr.join(',')
            let strQuery = `SELECT tl.item,
                                   tl.custcol_scv_ori_lineid,
                                   tl.custcol_scv_market_number,
                                   tl.transaction
                            FROM transactionLine tl
                                     JOIN
                                 transaction t ON t.id = tl.transaction
                            WHERE t.id in (${arrIdPr})
                              and tl.custcol_scv_ori_lineid is not null`;
            return query.runSuiteQL({query: strQuery}).asMappedResults();
        }

        const getArrIdPrFromLines = (recPo) => {
            let arrIdPr = [];
            const lcItems = recPo.getLineCount({sublistId: 'item'});
            for(let i = 0; i < lcItems; i++){
                let idLinePr = recPo.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_scv_sumtrans_line_originno',
                    line: i
                });
                if(idLinePr && !arrIdPr.includes(idLinePr)){
                    arrIdPr.push(idLinePr);
                }
            }

            return arrIdPr;
        }

        const getTemplateType = (parameters) => {
            return parameters.isExcel === 'T' ? 'excel' : 'word';
        }

        const getMappedData = (parameters, sumQuantity, sumAmount, recPo) => {
            let lkFieldsPo = search.lookupFields({
                type: parameters.rectype,
                id: parameters.recid,
                columns: PO_COLUMNS
            });

            let employeeFields = getEmployeeFields(lkFieldsPo);
            let subsidiaryFields = getSubsidiaryFields(lkFieldsPo['subsidiary'][0].value);

            return {
                F3: {'subsidiary_legalname': lkFieldsPo['subsidiary.custrecord_scv_sub_legalname_eng'] || ' '},
                F4: {'subsidiary_address': subsidiaryFields['custrecord_scv_sub_address_en'] || ' '},
                // F5: {'subsidiary_phone': lkFieldsPo['subsidiary.custrecord_scv_sub_phone'] || ' '},
                A3: {'entity_custentity_scv_legal_name': employeeFields['custentity_scv_legal_name'] || ' '},
                A4: {'entity_address': employeeFields['address'] || ' '},
                // A5: {'entity_phone': employeeFields['phone'] || ' '},
                B7: {'tranid': lkFieldsPo['tranid'] || ' '},
                D7: {'trandate': lkFieldsPo['trandate'] || ' '},
                F7: {'tranid': lkFieldsPo['tranid'] || ' '},
                I7: {'trandate': lkFieldsPo['trandate'] || ' '},
                A8: {'custbody_scv_po_contract_numb': lkFieldsPo['custbody_scv_po_pur_contract.custrecord_scv_pur_contract_no_contract'] || ' '},
                D8: {'custbody_scv_po_contract_date': lkFieldsPo['custbody_scv_po_pur_contract.custrecord_scv_pur_contract_date_contrac'] || ' '},
                F8: {'custbody_scv_po_contract_numb': lkFieldsPo['custbody_scv_po_pur_contract.custrecord_scv_pur_contract_no_contract'] || ' '},
                I8: {'custbody_scv_po_contract_date': lkFieldsPo['custbody_scv_po_pur_contract.custrecord_scv_pur_contract_date_contrac'] || ' '},
                F9: {'ycmhno': getStrYcmh(recPo)},
                A10: {'ngaybaogia' : lkFieldsPo['custbody_scv_po_quotation_date']},
                H10: {'ngaybaogia': lkFieldsPo['custbody_scv_po_quotation_date']},
                B12: {'custbody_scv_po_name_of_goods_en': lkFieldsPo['custbody_scv_po_name_of_goods_en'] || ' '},
                F12: {'custbody_scv_po_name_of_goods_vn': lkFieldsPo['custbody_scv_po_name_of_goods_vn'] || ' '},
                C18: {'currency': lkFieldsPo['currency'][0]?.text || ' '},
                G18: {'currency': lkFieldsPo['currency'][0]?.text || ' '},
                C19: {'custrecord_scv_pur_contract_te_o_pri_en': lkFieldsPo['custbody_scv_po_pur_contract.custrecord_scv_pur_contract_te_o_pri_en'] || ' '},
                B20: {'custrecord_scv_pur_contract_qty_tole_en': lkFieldsPo['custbody_scv_po_pur_contract.custrecord_scv_pur_contract_qty_tole_en'] || ' '},
                B21: {'custrecord_scv_pur_contract_deli_term_en': lkFieldsPo['custbody_scv_po_pur_contract.custrecord_scv_pur_contract_deli_term_en'] || ' '},
                B22: {'custrecord_scv_pur_contract_deli_time_en': lkFieldsPo['custbody_scv_po_pur_contract.custrecord_scv_pur_contract_deli_time_en'] || ' '},
                B23: {
                    'custrecord_scv_pur_contract_load_port_en': lkFieldsPo['custbody_scv_po_pur_contract.custrecord_scv_pur_contract_load_port_en'] || ' ',
                    'custrecord_scv_pur_contract_des_port_en': lkFieldsPo['custbody_scv_po_pur_contract.custrecord_scv_pur_contract_des_port_en'] || ' '
                },
                B24: {'custrecord_scv_pur_contract_part_ship_en': lkFieldsPo['custbody_scv_po_pur_contract.custrecord_scv_pur_contract_part_ship_en'] || ' '},
                C25: {'custrecord_scv_pur_contract_ship_term_en': lkFieldsPo['custbody_scv_po_pur_contract.custrecord_scv_pur_contract_ship_term_en'] || ' '},
                B26: {'custrecord_scv_pur_contract_pay_term_en': lkFieldsPo['custbody_scv_po_pur_contract.custrecord_scv_pur_contract_pay_term_en'] || ' '},
                B27: {'custrecord_scv_pur_contract_pack_en': lkFieldsPo['custbody_scv_po_pur_contract.custrecord_scv_pur_contract_pack_en'] || ' '},
                B28: {'custrecord_scv_pur_contract_oth_term_en': lkFieldsPo['custbody_scv_po_pur_contract.custrecord_scv_pur_contract_oth_term_en'] || ' '},

                F19: {'custrecord_scv_pur_contract_te_o_pri_vn': lkFieldsPo['custbody_scv_po_pur_contract.custrecord_scv_pur_contract_te_o_pri_vn'] || ' '},
                F20: {'custrecord_scv_pur_contract_qty_tole_vn': lkFieldsPo['custbody_scv_po_pur_contract.custrecord_scv_pur_contract_qty_tole_vn'] || ' '},
                F21: {'custrecord_scv_pur_contract_deli_term_vn': lkFieldsPo['custbody_scv_po_pur_contract.custrecord_scv_pur_contract_deli_term_vn'] || ' '},
                F22: {'custrecord_scv_pur_contract_deli_time_vn': lkFieldsPo['custbody_scv_po_pur_contract.custrecord_scv_pur_contract_deli_time_vn'] || ' '},
                F23: {
                    'custrecord_scv_pur_contract_load_port_vn': lkFieldsPo['custbody_scv_po_pur_contract.custrecord_scv_pur_contract_load_port_vn'] || ' ',
                    'custrecord_scv_pur_contract_des_port_vn': lkFieldsPo['custbody_scv_po_pur_contract.custrecord_scv_pur_contract_des_port_vn'] || ' '
                },
                F24: {'custrecord_scv_pur_contract_part_ship_vn': lkFieldsPo['custbody_scv_po_pur_contract.custrecord_scv_pur_contract_part_ship_vn'] || ' '},
                F25: {'custrecord_scv_pur_contract_ship_term_vn': lkFieldsPo['custbody_scv_po_pur_contract.custrecord_scv_pur_contract_ship_term_vn'] || ' '},
                F26: {'custrecord_scv_pur_contract_pay_term_vn': lkFieldsPo['custbody_scv_po_pur_contract.custrecord_scv_pur_contract_pay_term_vn'] || ' '},
                F27: {'custrecord_scv_pur_contract_pack_vn': lkFieldsPo['custbody_scv_po_pur_contract.custrecord_scv_pur_contract_pack_vn'] || ' '},
                F28: {'custrecord_scv_pur_contract_oth_term_vn': lkFieldsPo['custbody_scv_po_pur_contract.custrecord_scv_pur_contract_oth_term_vn'] || ' '},

                H17: {'sumQuantity': sumQuantity},
                J17: {'sumAmount': sumAmount},

            }
        }

        const getTableData1Uom = (recPo) => {
            let lineCount = recPo.getLineCount({sublistId: 'item'});
            let tableData = [];
            let sumQuantity = 0;
            let sumAmount = 0;

            for (let i = 0; i < lineCount; i++) {
                let specs1 = getSpecsValue(recPo, i, ['custcol_scv_po_ddn', 'custcol_scv_so_kho_rong', 'custcol_scv_so_chieu_dai']);
                let specs2 = getSpecsValue(recPo, i, ['custcol_scv_po_ls']);
                let specs3 = getSpecsValue(recPo, i, ['custcol_scv_po_alu_label','custcol_scv_po_hardness']);
                let specs4 = getSpecsValue(recPo, i, ['custcol_scv_vendor_color_code', 'custcol_scv_po_properties']);

                tableData.push({
                    'No': i + 1,
                    'Name':
                        recPo.getSublistText({
                            sublistId: 'item',
                            fieldId: 'custcol_scv_item_eng_name',
                            line: i
                        }) || recPo.getSublistText({
                            sublistId: 'item',
                            fieldId: 'custcol_scv_item_display_name_en',
                            line: i
                        })|| recPo.getSublistText({
                            sublistId: 'item',
                            fieldId: 'displayname',
                            line: i
                        })
                    ,
                        // recPo.getSublistText({sublistId: 'item', fieldId: 'displayname', line: i}) || ' ',
                    'Specs1':specs1,
                    'Specs2': specs2,
                    'Specs3': specs3,
                    'Specs4': specs4,
                    'Unit': recPo.getSublistText({sublistId: 'item', fieldId: 'units', line: i}) || ' ',
                    'Quantity': recPo.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_scv_qty_before_tolerance',
                        line: i
                    }) || ' ',
                    'Unit Price': recPo.getSublistValue({sublistId: 'item', fieldId: 'rate', line: i}) || ' ',
                    'Amount':  Number(recPo.getSublistValue({sublistId: 'item', fieldId: 'custcol_scv_amount_bef_tolerance', line: i}))
                        // Number(recPo.getSublistValue({sublistId: 'item', fieldId: 'rate', line: i}))
                        // * Number(recPo.getSublistValue({
                        //     sublistId: 'item',
                        //     fieldId: 'custcol_scv_qty_before_tolerance',
                        //     line: i
                        // }))
                        // // recPo.getSublistValue({sublistId: 'item', fieldId: 'amount', line: i})
                        // || ' '
                    ,
                    'Note': recPo.getSublistValue({sublistId: 'item', fieldId: 'description', line: i}) || ' ',
                });

            }
            sumQuantity = tableData.reduce((sum, item) => sum + item.Quantity, 0);
            sumAmount = tableData.reduce((sum, item) => sum + item.Amount, 0);


            return {
                tableData: tableData,
                sumQuantity: sumQuantity,
                sumAmount: sumAmount,
            };
        }

        const getEmployeeFields = (lkFieldsPo) => {
            let entityType = search.lookupFields({
                type: 'entity',
                id: lkFieldsPo['entity'][0].value,
                columns: ['type']
            });

            return search.lookupFields({
                type: entityType.type[0].value.toLowerCase(),
                id: lkFieldsPo['entity'][0].value,
                columns: ['address', 'phone', 'custentity_scv_legal_name']
            });
        }

        const getSubsidiaryFields = (idSubsidiary) => {
            return search.lookupFields({
                type: 'subsidiary',
                id: idSubsidiary,
                columns: ['custrecord_scv_sub_legalname_eng', 'custrecord_scv_sub_phone', 'address.address', 'custrecord_scv_sub_address_en']
            });
        }

        const formatCurrency = (number) => {
            return new Intl.NumberFormat('ja-JP', {
                style: 'currency',
                currency: 'JPY',
                currencyDisplay: "code",
                minimumFractionDigits: 0,
                //maximumFractionDigits: 2
            })
                .format(number)
                .replace("JPY", "")
                .trim();
        }

        const checkNull = (value) => {
            return value !== null && value !== undefined && value !== "";
        }

        return {onRequest}

    });
