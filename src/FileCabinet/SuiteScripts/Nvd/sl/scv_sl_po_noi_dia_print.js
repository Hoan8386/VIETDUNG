/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/file', 'N/record', 'N/render', 'N/search', '../common/scv_common_pdf', '../common/scv_common_theo_doi_phieu_in'],

    (file, record, render, search, comPdf, comPhieuTheoDoi) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            let parameters = scriptContext.request.parameters;
            if (scriptContext.request.method === 'GET') {
                let pdfFile = getPoPdfFile(parameters);
                comPhieuTheoDoi.createPhieuTheoDoi(parameters.recid, 'CUSTTMPL_SCV_PO_NOI_DIA');
                scriptContext.response.writeFile(pdfFile, true);
            } else {
                if (scriptContext.request.parameters.isExcel === 'T') {
                    let dataPo = getDataPoExcel(parameters);
                    comPhieuTheoDoi.createPhieuTheoDoi(parameters.recid, 'SCV_XLSX_SCV_PO_NOI_DIA');
                    scriptContext.response.setHeader("Content-Type", "text/plain;charset=UTF-8");
                    scriptContext.response.write(JSON.stringify(dataPo));
                }
            }
        }

        const colId = ['No', 'Name', 'Property', 'Unit', 'Quantity', 'Unit Price', 'Tax', 'TaxAmount', 'Amount', 'Note'];

        const getDataPoExcel = (parameters) => {
            let recPo = record.load({
                type: parameters.rectype,
                id: parameters.recid
            })
            let urlToTemplate = file.load({id: '../xls/scv_xlsx_po_noi_dia.xlsx'}).url;
            let {tableData} = getTableDataExcelPo(parameters);
            let sumTaxAmount = tableData.reduce((sum, item) => sum + item.TaxAmount, 0);
            let sumAmount = parseFloat(tableData.reduce((sum, item) => sum + Number(item.Amount), 0).toFixed(2)) || 0;
            let mappedData = getMappedDataExcelPo(parameters, sumAmount, sumTaxAmount, recPo);
            let templateType = getTemplateType(parameters);
            return {
                templatetype: templateType,
                filename: 'Đơn mua nội địa.xlsx',
                url: urlToTemplate,
                mappedData: mappedData,
                arrData: tableData,
                colId: colId,
                idxSourceRow: 7,
                idxRowData: 8,
                sumTaxAmount: sumTaxAmount,
                sumAmount: sumAmount,
            }
        }

        const getTableDataExcelPo = (parameters) => {
            let recPo = record.load({
                type: parameters.rectype,
                id: parameters.recid
            });

            let lineCount = recPo.getLineCount({sublistId: 'item'});
            let tableData = [];

            for (let i = 0; i < lineCount; i++) {
                let itemType = recPo.getSublistValue({sublistId: 'item', fieldId: 'itemtype', line: i});
                let numTaxRate = Number(recPo.getSublistText({
                    sublistId: 'item',
                    fieldId: 'taxrate1',
                    line: i
                }).replace('%', '')) / 100;
                // let itemDisplay = ( itemType === 'Assembly' || itemType === 'Inventory' )
                //     ? recPo.getSublistText({sublistId: 'item', fieldId: 'displayname', line: i})
                //     : recPo.getSublistText({sublistId: 'item', fieldId: 'custcol_scv_po_properties', line: i})
                tableData.push({
                    'No': i + 1,
                    'Name': recPo.getSublistValue({sublistId: 'item', fieldId: 'displayname', line: i}) || ' ',
                    'Property': recPo.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_scv_po_properties',
                        line: i
                    }) || ' ',
                    'Unit':
                        recPo.getSublistText({sublistId: 'item', fieldId: 'custcol_scv_converted_uom', line: i}) ||
                        recPo.getSublistValue({sublistId: 'item', fieldId: 'units_display', line: i}) ||
                        ' ',
                    'Quantity':
                        recPo.getSublistValue({sublistId: 'item', fieldId: 'custcol_scv_po_qty_unit_m2', line: i}) ||
                        recPo.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_scv_qty_before_tolerance',
                            line: i
                        }) ||
                        ' ',
                    'Tax': recPo.getSublistValue({sublistId: 'item', fieldId: 'taxrate1', line: i}) || ' ',
                    'TaxAmount': Number(recPo.getSublistValue({sublistId: 'item', fieldId: 'custcol_scv_amt_tax_bef_tolerance', line: i})) || 0

                        // Number(recPo.getSublistValue({sublistId: 'item', fieldId: 'rate', line: i}))
                        // * Number(recPo.getSublistValue({
                        //     sublistId: 'item',
                        //     fieldId: 'custcol_scv_qty_before_tolerance',
                        //     line: i
                        // }))
                        // * numTaxRate
                        // || ' '
                    ,
                    'Unit Price': parseFloat(
                        recPo.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_scv_po_converted_unit_price',
                            line: i
                        }) ||
                        recPo.getSublistValue({sublistId: 'item', fieldId: 'rate', line: i}) ||
                        ' '),
                    'Amount': parseFloat((
                            Number(recPo.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_scv_qty_before_tolerance',
                                line: i
                            }))
                            * Number(recPo.getSublistValue({sublistId: 'item', fieldId: 'rate', line: i}))
                            + (Number(recPo.getSublistValue({sublistId: 'item', fieldId: 'rate', line: i}))
                                * Number(recPo.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_scv_qty_before_tolerance',
                                    line: i
                                }))
                                * numTaxRate)).toFixed(0))
                        || ' ',
                    'Note': recPo.getSublistValue({sublistId: 'item', fieldId: 'custcol_scv_memo', line: i}) || ' ',
                });
            }

            return {
                tableData: tableData,
                // sumTaxAmount: sumTaxAmount,
                // sumAmount: sumAmount,
            };
        }

        const getMappedDataExcelPo = (parameters, sumAmount, sumTaxAmount, recPo) => {
            let objEmployee = getObjEmployee(recPo);
            let recSubsidiary = getRecSubsidiary(recPo.getValue('subsidiary'));
            let bangChu = comPdf.convertAmountToWords(sumAmount);
            let idDieuKhoan = recPo.getValue('custbody_scv_cus_term');
            let searchDieuKhoan = search.lookupFields({
                type: 'customrecord_scv_cus_term',
                id: idDieuKhoan,
                columns: ['custrecord_scv_term_nd']
            })

            return {
                'C1': {
                    legalname: recSubsidiary.getValue('legalname').toUpperCase(),
                    mainaddress_text: recSubsidiary.getValue('mainaddress_text').replace(/\r\n/g, ' ').replace('Viet Nam', ''),
                    federalidnumber: recSubsidiary.getValue('federalidnumber'),
                },
                'A3': {tranid: recPo.getValue('tranid')},
                'A4': {entity: recPo.getText('entity').includes('_') ? recPo.getText('entity').split("_")[1] : recPo.getText('entity')},
                'H8': {sumTaxAmount: sumTaxAmount},
                'I8': {sumAmount: sumAmount},
                'C9': {bangChu: bangChu},
                'A10': {custbody_scv_po_request_quality: recPo.getValue('custbody_scv_po_request_quality')},
                'A11': {custbody_scv_po_delivery_date: formatDate2(recPo.getValue('custbody_scv_po_delivery_date'))},
                'A12': {custbody_scv_po_shipping_address: recPo.getValue('custbody_scv_po_shipping_address')},
                'A13': {custbody_scv_so_pay_method: searchDieuKhoan?.custrecord_scv_term_nd}, // điều khoản thanh toán
                'A14': {custbody_scv_po_other_term: recPo.getText('custbody_scv_po_other_term')},
                'A16': {custbody_scv_po_case_of_late_delivery: recPo.getText('custbody_scv_po_case_of_late_delivery')},
                'A17': {custbody_scv_po_non_compli_delivery: recPo.getText('custbody_scv_po_non_compli_delivery')},
                'A19': {legalname: objEmployee.custentity_scv_legal_name},
                'G19': {custentity_scv_position_st: objEmployee.custentity_scv_position_st[0]?.text},
                'A20': {phone: objEmployee.phone},
                'G20': {email: objEmployee.email},
                'F23': {trandate: formatDate(recPo.getValue('trandate'))},
                'F24': {subname: recPo.getText('subsidiary').toUpperCase()},
            }
        }

        const getRecSubsidiary = (idSubsidiary) => {
            if (isValid(idSubsidiary)) {
                return record.load({
                    type: search.Type.SUBSIDIARY,
                    id: idSubsidiary,
                });
            }
        }

        const getPoPdfFile = (parameters) => {
            let objRender = comPdf.initTemplateRender('CUSTTMPL_SCV_PO_NOI_DIA');
            let recPo = record.load({
                type: parameters.rectype,
                id: parameters.recid
            });
            addMainRecordToRenderer(objRender, recPo);
            addSubsidiaryToRenderer(objRender, recPo.getValue('subsidiary'));
            addEmployeeToRenderer(objRender, recPo.getValue('employee'));
            addItemsToRenderer(objRender, recPo);
            addCustomDataToRenderer(objRender);
            return objRender.renderAsPdf();
        }

        const addMainRecordToRenderer = (objRender, recPo) => {
            let idDieuKhoan = recPo.getValue('custbody_scv_cus_term');
            let searchDieuKhoan = {}
            if (idDieuKhoan) {
                searchDieuKhoan = search.lookupFields({
                    type: 'customrecord_scv_cus_term',
                    id: idDieuKhoan,
                    columns: ['custrecord_scv_term_nd']
                });
            }

            objRender.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: 'recpo',
                data: {
                    tranid: recPo.getValue('tranid'),
                    trandate: formatDate(recPo.getValue('trandate')),
                    entity: recPo.getText('entity'),
                    custbody_scv_po_request_quality: recPo.getValue('custbody_scv_po_request_quality'),
                    custbody_scv_po_delivery_date: formatDate2(recPo.getValue('custbody_scv_po_delivery_date')),
                    custbody_scv_po_shipping_addre: recPo.getValue('custbody_scv_po_shipping_address'),
                    // custbody_scv_so_pay_method: recPo.getText('custbody_scv_so_pay_method'),
                    custbody_scv_so_pay_method: searchDieuKhoan?.custrecord_scv_term_nd,
                    custbody_scv_po_case_of_late_delivery: recPo.getText('custbody_scv_po_case_of_late_delivery'),
                    custbody_scv_po_non_compli_delivery: recPo.getText('custbody_scv_po_non_compli_delivery'),
                    custbody_scv_po_other_term: recPo.getText('custbody_scv_po_other_term')
                }
            });

        }

        const formatDate2 = (date) => {
            if (util.isDate(date)) {
                return `${date.getDate()}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
            } else {
                return date
            }
        }

        const addSubsidiaryToRenderer = (objRender, idSubsidiary) => {
            if (isValid(idSubsidiary)) {
                // federalidnumber không search được
                let recSubsidiary = record.load({
                    type: record.Type.SUBSIDIARY,
                    id: idSubsidiary
                });

                objRender.addCustomDataSource({
                    format: render.DataSource.OBJECT,
                    alias: 'recsubsidiary',
                    data: {
                        name: recSubsidiary.getValue('name'),
                        legalname: recSubsidiary.getValue('legalname'),
                        mainaddress_text: JSON.parse(JSON.stringify(recSubsidiary.getValue('mainaddress_text')
                            .replace('Viet Nam', ''))
                            .replace(' \\r\\n', '')
                            .replace('\\r\\nHà Nội', ''))
                            .replace('Việt Nam', '')
                        ,
                        custrecord_scv_sub_phone: recSubsidiary.getValue('custrecord_scv_sub_phone'),
                        federalidnumber: recSubsidiary.getValue('federalidnumber'),
                    }
                });
            }
        }

        const addEmployeeToRenderer = (objRender, idEmployee) => {
            if (isValid(idEmployee)) {
                let lkFieldsEmployee = search.lookupFields({
                    type: search.Type.EMPLOYEE,
                    id: idEmployee,
                    columns: [
                        'custentity_scv_legal_name',
                        'phone',
                        'email',
                        'custentity_scv_position_st',
                    ]
                });

                objRender.addCustomDataSource({
                    format: render.DataSource.OBJECT,
                    alias: 'recemployee',
                    data: {
                        phone: lkFieldsEmployee['phone'],
                        email: lkFieldsEmployee['email'],
                        position: lkFieldsEmployee['custentity_scv_position_st'][0]?.text,
                        legalname: lkFieldsEmployee['custentity_scv_legal_name'],
                    }
                });

            }
        }

        const addItemsToRenderer = (objRender, recPo) => {
            let arrItems = getItems(recPo);
            log.error('arrItems', arrItems);
            let tongThue = arrItems.reduce((sum, item) => sum + Number(item.tax1amt.toFixed(0)), 0);
            log.error('tongThue', tongThue);
            let tongThanhTien = parseFloat(arrItems.reduce((sum, item) => sum + Number(item.grossamt), 0).toFixed(2)) ;
            let bangChu = comPdf.convertAmountToWords(tongThanhTien);
            objRender.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: 'items',
                data: {
                    arrItem: arrItems,
                    tongThue: tongThue,
                    tongThanhTien: tongThanhTien,
                    bangChu: bangChu
                }
            });
        }

        const getPropertyLines = (properties) => {
            return String(properties || '')
                .replace(/&amp;lt;br\s*\/?&amp;gt;/gi, '\n')
                .replace(/&lt;br\s*\/?&gt;/gi, '\n')
                .replace(/<br\s*\/?>/gi, '\n')
                .split(/\r?\n/);
        }

        const getItems = (recPo) => {
            let lineCount = recPo.getLineCount({sublistId: 'item'});
            let arrItems = [];
            for (let i = 0; i < lineCount; i++) {
                let numTaxRate = Number(recPo.getSublistText({
                    sublistId: 'item',
                    fieldId: 'taxrate1',
                    line: i
                }).replace('%', '')) / 100;
                let properties = recPo.getSublistText({
                    sublistId: 'item',
                    fieldId: 'custcol_scv_po_properties',
                    line: i
                });
                let item = {
                    displayname: recPo.getSublistValue({sublistId: 'item', fieldId: 'displayname', line: i}),
                    properties: properties,
                    propertyLines: getPropertyLines(properties),
                    unit:
                        recPo.getSublistText({sublistId: 'item', fieldId: 'custcol_scv_converted_uom', line: i}) ||
                        recPo.getSublistValue({sublistId: 'item', fieldId: 'units_display', line: i}),
                    quantity:
                        recPo.getSublistValue({sublistId: 'item', fieldId: 'custcol_scv_po_qty_unit_m2', line: i}) ||
                        recPo.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_scv_qty_before_tolerance',
                            line: i
                        }),
                    rate:
                        recPo.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_scv_po_converted_unit_price',
                            line: i
                        }) ||
                        recPo.getSublistValue({sublistId: 'item', fieldId: 'rate', line: i})
                    ,
                    taxrate1: recPo.getSublistValue({sublistId: 'item', fieldId: 'taxrate1', line: i}),
                    tax1amt: Number(recPo.getSublistValue({sublistId: 'item', fieldId: 'custcol_scv_amt_tax_bef_tolerance', line: i}))

                        // Number(recPo.getSublistValue({sublistId: 'item', fieldId: 'rate', line: i}))
                        // * Number(recPo.getSublistValue({
                        //     sublistId: 'item',
                        //     fieldId: 'custcol_scv_qty_before_tolerance',
                        //     line: i
                        // }))
                        // * numTaxRate
                    ,
                    grossamt: recPo.getSublistValue({sublistId: 'item', fieldId: 'custcol_scv_gross_amt_bef_tolerance', line: i})
                        // Number(recPo.getSublistValue({
                        //     sublistId: 'item',
                        //     fieldId: 'custcol_scv_qty_before_tolerance',
                        //     line: i
                        // }))
                        // * Number(recPo.getSublistValue({sublistId: 'item', fieldId: 'rate', line: i}))
                        // + (Number(recPo.getSublistValue({
                        //         sublistId: 'item',
                        //         fieldId: 'custcol_scv_qty_before_tolerance',
                        //         line: i
                        //     }))
                        //     * Number(recPo.getSublistValue({sublistId: 'item', fieldId: 'rate', line: i}))
                        //     * numTaxRate)
                    ,
                    description: recPo.getSublistValue({sublistId: 'item', fieldId: 'custcol_scv_memo', line: i}),
                }
                arrItems.push(item);
            }
            return arrItems;
        }

        const getObjEmployee = (recPo) => {
            let idEmployee = recPo.getValue('employee');
            let recEmployee = {};
            if (idEmployee) {
                let lkFieldsEmployee = search.lookupFields({
                    type: search.Type.EMPLOYEE,
                    id: idEmployee,
                    columns: [
                        'custentity_scv_legal_name',
                        'phone',
                        'email',
                        'custentity_scv_position_st',
                    ]
                });
                recEmployee.phone = lkFieldsEmployee['phone'];
                recEmployee.email = lkFieldsEmployee['email'];
                recEmployee.custentity_scv_position_st = lkFieldsEmployee['custentity_scv_position_st'];
                recEmployee.custentity_scv_legal_name = lkFieldsEmployee['custentity_scv_legal_name'];
            }
            return recEmployee;
        }

        const addCustomDataToRenderer = (objRender) => {
            comPdf.addFontVietnamese(objRender);
            comPdf.addImage(objRender, 'Logo-removebg-preview.png');
        }

        const formatDate = (date) => {
            return ' Ngày ' + date.getDate() + ' tháng ' + (date.getMonth() + 1) + ' năm ' + date.getFullYear();
        }

        const isValid = (value) => {
            return value !== null && value !== undefined && value !== '';
        }

        const getTemplateType = (parameters) => {
            return parameters.isExcel === 'T' ? 'excel' : 'word';
        }

        return {onRequest}

    });
