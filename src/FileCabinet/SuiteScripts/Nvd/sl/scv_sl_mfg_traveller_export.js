/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record', 'N/runtime', 'N/search', 'N/url', '../common/scv_common_pdf',
        '../cons/scv_cons_search_wo_printing.js', '../cons/scv_cons_search_wo_printing_details.js',
        'N/file', 'N/render', '../common/scv_common_theo_doi_phieu_in'
    ],
    /**
     * @param{record} record
     * @param{runtime} runtime
     * @param{search} search
     * @param{url} url
     */
    (record, runtime, search, url, comPdf,
     constSearchWOPrint, constSearchWOPrintDtl, file, render, comPhieuIn
    ) => {

        const ProductLossCategory = {
            'PHOI_MAU': '303',
        }

        const ProductLossReason = {
            'KHAC': '20',
        }
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            let request = scriptContext.request;
            let response = scriptContext.response;
            let params = request.parameters;
            let subsidiary = params.custpage_subsidiary;
            let legalName;
            if (subsidiary) {
                let lkFSub = search.lookupFields({
                    type: 'subsidiary',
                    id: subsidiary,
                    columns: ['legalname']
                });
                legalName = lkFSub.legalname

            }
            let fromDate = params.custpage_wo_fromdt;
            let toDate = params.custpage_wo_todt;

            let arrSSWoPrint = getDataSS_woPrint(params);
            let arrSSWoPrintDtl = getDataSS_woPrintDtl(params);
            let trangThai = "";

            if (request.method === 'GET') {
                switch (params.phieutype) {
                    case 'YCSX':

                        if (params.exportType === 'EXCEL') {
                            let excelFile = buildFileExcel(arrSSWoPrint, legalName, fromDate, toDate, trangThai);
                            response.writeFile(excelFile, false);

                        } else if (params.exportType === 'PDF') {
                            let pdfFile = buildFilePdfYCSX(arrSSWoPrint, legalName, fromDate, toDate, trangThai);
                            comPhieuIn.createPhieuTheoDoi4Suitelet('Manufacturing Traveller', 'CUSTTMPL_SCV_YCSX_MT');
                            response.writeFile(pdfFile, true);
                        }
                        break;

                    case 'PGV':
                        if (params.exportType === 'EXCEL') {

                        } else if (params.exportType === 'PDF') {
                            let pdfFile = buildFilePdfPGV(arrSSWoPrint, arrSSWoPrintDtl);
                            comPhieuIn.createPhieuTheoDoi4Suitelet('Manufacturing Traveller', 'CUSTTMPL_SCV_PGV_MT');
                            response.writeFile(pdfFile, true);
                        }
                        break;
                }

            }
        }

        const buildFilePdfPGV = (arrSSWoPrint, arrSSWoPrintDtl) => {
            let objRender = comPdf.initTemplateRender('CUSTTMPL_SCV_PGV_MT');
            comPdf.addFontVietnamese(objRender);
            let result = groupResultByCriteria(arrSSWoPrint, arrSSWoPrintDtl);

            let today = new Date();
            let ngayin = getDateTodate(today)
            let empName = getCurrentEmployeeName();

            objRender.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: 'customData',
                data: {
                    items: result,
                    itemsLength : result.length,
                    ngayin: ngayin,
                    empName: empName
                }
            });

            return objRender.renderAsPdf();
        }

        const getWoByProductsOfWorkOrder = (idWorkOrder) => {
            let recWorkOrder = record.load({
                type: 'workorder',
                id: idWorkOrder
            })

            let itemLines = recWorkOrder.getLineCount('recmachcustrecord_scv_by_product_wo');
            let arrItem = [];

            for (let i = 0; i < itemLines; i++) {

                let lossCategory = recWorkOrder.getSublistValue('recmachcustrecord_scv_by_product_wo', 'custrecord_scv_by_prod_loss_category', i);
                let lossReason = recWorkOrder.getSublistValue('recmachcustrecord_scv_by_product_wo', 'custrecord_scv_by_prod_loss_reason', i);

                if (lossCategory === ProductLossCategory.PHOI_MAU && lossReason === ProductLossReason.KHAC) {
                    let item = {
                        custrecord_scv_by_prod_item_display: recWorkOrder.getSublistValue('recmachcustrecord_scv_by_product_wo', 'custrecord_scv_by_prod_item_display', i)
                            .substring(recWorkOrder.getSublistValue('recmachcustrecord_scv_by_product_wo', 'custrecord_scv_by_prod_item_display', i).indexOf('_') + 1),
                        units : recWorkOrder.getSublistValue('recmachcustrecord_scv_by_product_wo', 'custrecord_scv_uom_display', i),
                        custrecord_scv_by_prod_loss_category_display: recWorkOrder.getSublistValue('recmachcustrecord_scv_by_product_wo', 'custrecord_scv_by_prod_loss_category_display', i),
                        unit: search.lookupFields({
                            type: 'item',
                            id: recWorkOrder.getSublistValue('recmachcustrecord_scv_by_product_wo', 'custrecord_scv_by_prod_item', i),
                            columns: ['unitstype']
                        }),
                        custrecord_scv_by_product_qty: recWorkOrder.getSublistValue('recmachcustrecord_scv_by_product_wo', 'custrecord_scv_by_product_qty', i),
                    };

                    arrItem.push(item);
                }
            }

            return arrItem;

        }

        const getCurrentEmployeeName = () => {
            let empName = '';
            let empUser = runtime.getCurrentUser().id;
            if (empUser) {
                let lkFEmp = search.lookupFields({
                    type: 'employee',
                    id: empUser,
                    columns: ['firstname']
                });
                empName = lkFEmp.firstname;
            }

            return empName;
        }

        const groupResultByCriteria = (arrSSWoPrint, arrSSWoPrintDtl) => {
            let groupedData = groupBy(arrSSWoPrint, arrSSWoPrintDtl, ['subsidiary', 'work_center', 'wo_type']);

            for (let key in groupedData) {
                let [subsidiary, work_center, wo_type] = groupedData[key].key.split('|');
                groupedData[key].subsidiary = subsidiary;
                groupedData[key].work_center = work_center;
                groupedData[key].wo_type = wo_type;

            }
            return groupedData;
        }

        const groupBy = (array, arrSSWoPrintDtl, keys) => {
            let groupedObject = {};

            for (let currentItem of array) {
                const groupKey = keys.map(key => currentItem[key]).join('|');
                if (!groupedObject[groupKey]) {
                    groupedObject[groupKey] = [];
                }

                currentItem.arrItem = joinItemsByWorkOrder(currentItem.wo_name, arrSSWoPrintDtl);
                if(currentItem.memo_one && currentItem.memo_two) {
                    currentItem.memo_one = `${currentItem.memo_one}<br/>${currentItem.memo_two}`;
                }else if(currentItem.memo_two) {
                    currentItem.memo_one = currentItem.memo_two;
                }

                // log.error('currentItem', currentItem.memo_one);
                groupedObject[groupKey].push(currentItem);

                let arrWoByProducts = getWoByProductsOfWorkOrder(currentItem.wo_id);
                currentItem.byProducts = arrWoByProducts.length;
                log.error('currentItembyproduct', currentItem.byProducts);

                if (arrWoByProducts.length > 0) {
                    for (let i = 0; i < arrWoByProducts.length; i++) {
                        let phePham = {...currentItem};
                        phePham.displayname = arrWoByProducts[i].custrecord_scv_by_prod_item_display;
                        phePham.qty = arrWoByProducts[i].custrecord_scv_by_product_qty;
                        phePham.memo_one = arrWoByProducts[i].custrecord_scv_by_prod_loss_category_display;
                        phePham.units = arrWoByProducts[i].units;
                        phePham.byProducts = 0;

                        groupedObject[groupKey].push(phePham);
                    }
                }
            }

            return Object.entries(groupedObject).map(([key, value]) => ({key, value}));
        }

        const joinItemsByWorkOrder = (woName, arrSSWoPrintDtl) => {
            let arrItem = [];
            let stt = 1;
            for (let i = 0; i < arrSSWoPrintDtl.length; i++) {
                if (arrSSWoPrintDtl[i].wo_name === woName) {
                    if(arrSSWoPrintDtl[i].qc_serial) {
                        arrItem.push(`${stt++}. ${arrSSWoPrintDtl[i].displayname} - ${arrSSWoPrintDtl[i].qc_serial}`);
                    }else{
                        arrItem.push(`${stt++}. ${arrSSWoPrintDtl[i].displayname}`);
                    }
                }
            }
            return arrItem.join('<br/>');
        }


        // Hiện tại không sử dụng in EX
        const buildFileExcel = (arrSS_woPrint, legalname, fromdate, todate, trangthai) => {

            let pRowData = "";
            for (let i = 0; i < arrSS_woPrint.length; i++) {
                trangthai = arrSS_woPrint[i].status;
                pRowData += '<Row ss:AutoFitHeight="0">\n' +
                    '    <Cell ss:StyleID="s20"><Data ss:Type="String">' + arrSS_woPrint[i].date + '</Data></Cell>\n' +
                    '    <Cell ss:StyleID="s24"><Data ss:Type="String">' + arrSS_woPrint[i].wo_name + '</Data></Cell>\n' +
                    '    <Cell ss:StyleID="s26"><Data ss:Type="String">' + arrSS_woPrint[i].status + '</Data></Cell>\n' +
                    '    <Cell ss:StyleID="s24"><Data ss:Type="String" >' + arrSS_woPrint[i].so_source + '</Data></Cell>\n' +
                    '    <Cell ss:StyleID="s24"><Data ss:Type="String">' + arrSS_woPrint[i].wo_type + '</Data></Cell>\n' +
                    '    <Cell ss:StyleID="s26"><Data ss:Type="String">' + arrSS_woPrint[i].class + '</Data></Cell>\n' +
                    '    <Cell ss:StyleID="s24"><Data ss:Type="String">' + (arrSS_woPrint[i].qc_serial) + '</Data></Cell>\n' +
                    '    <Cell ss:StyleID="s26"><Data ss:Type="String">' + arrSS_woPrint[i].assembly + '</Data></Cell>\n' +
                    '    <Cell ss:StyleID="s24"><Data ss:Type="String">' + arrSS_woPrint[i].units + '</Data></Cell>\n' +
                    '    <Cell ss:StyleID="s27"><Data ss:Type="String">' + (arrSS_woPrint[i].qty || 0) + '</Data></Cell>\n' +
                    '    <Cell ss:StyleID="s24"><Data ss:Type="String">' + (arrSS_woPrint[i].tolerancemax) + '</Data></Cell>\n' +
                    '    <Cell ss:StyleID="s24"><Data ss:Type="String">' + (arrSS_woPrint[i].tolerancemin) + '</Data></Cell>\n' +
                    '    <Cell ss:StyleID="s24"><Data ss:Type="String">' + arrSS_woPrint[i].thoigian_giaohang + '</Data></Cell>\n' +
                    '    <Cell ss:StyleID="s26"><Data ss:Type="String">' + arrSS_woPrint[i].memo_one + '</Data></Cell>\n' +
                    '   </Row>\n';
            }
            let templatePath = '../xml/scv_xlsx_phieu_ycsx.xml';
            let namefile = 'Phiếu yêu cầu sản xuất.xls';
            let fileObject = file.load({id: templatePath});
            let content = fileObject.getContents();
            content = content.replace(/{pRowData}/gi, pRowData);
            content = content.replace(/{pFromdate}/gi, fromdate);
            content = content.replace(/{pTodate}/gi, todate);
            content = content.replace(/{pSubsidiary}/gi, legalname);
            content = content.replace(/{pTrangthai}/gi, trangthai);
            return file.create({
                name: namefile,
                fileType: file.Type.XMLDOC,
                contents: content,
                encoding: file.Encoding.UTF8,
            });
        }

        const buildFilePdfYCSX = (arrSS_woPrint, legalname, fromdate, todate, trangthai) => {
            for (let i = 0; i < arrSS_woPrint.length; i++) {
                trangthai = arrSS_woPrint[i].status;
            }

            let objRender = comPdf.initTemplateRender('CUSTTMPL_SCV_YCSX_MT');
            comPdf.addFontVietnamese(objRender);

            objRender.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: 'data',
                data: {
                    items: arrSS_woPrint,
                    legalname: legalname,
                    fromdate: fromdate,
                    todate: todate,
                    trangthai: trangthai
                }
            })

            return objRender.renderAsPdf();
        }


        const getColSlComponent = () => {
            return [
                {id: 'wo_name', label: 'WO#', type: 'text'},
                {id: 'so_source', label: 'SO source', type: 'text'},
                {id: 'item', label: 'Items', type: 'text'},
                {id: 'prod_lot', label: 'Prod Lot', type: 'text'},
                {id: 'qc_serial', label: 'QC Serial', type: 'text'},
                {id: 'qty', label: 'Quantity', type: 'float'},
                {id: 'units', label: 'Units', type: 'text'},
                {id: 'wo_type', label: 'WO Type', type: 'text'},
                {id: 'date', label: 'Date', type: 'text'},
                {id: 'status', label: 'Status', type: 'text'},
                {id: 'subsidiary', label: 'Đơn vị', type: 'text'},
            ]
        }

        const getColSlWO = () => {
            return [
                {id: 'check', label: 'Check', type: 'checkbox', displayType: 'entry'},
                {id: 'wo_name', label: 'WO#', type: 'text'},
                {id: 'so_source', label: 'SO source', type: 'text'},
                {id: 'assembly', label: 'Assembly ', type: 'text'},
                {id: 'prod_lot', label: 'Prod Lot', type: 'text', displayType: 'entry'},
                {id: 'qc_serial', label: 'QC Serial', type: 'text'},
                {id: 'qty', label: 'Quantity', type: 'float'},
                {id: 'units', label: 'Units', type: 'text'},
                {id: 'wo_type', label: 'WO Type', type: 'text'},
                {id: 'date', label: 'Date', type: 'text'},
                {id: 'status', label: 'Status', type: 'text'},
                {id: 'memo_one', label: 'Memo 01', type: 'text'},
                {id: 'memo_two', label: 'Memo 02', type: 'text'},
                {id: 'subsidiary', label: 'Subsidiary', type: 'text'},
                {id: 'wo_id', label: 'wo_id', type: 'text', displayType: 'hidden'},
            ]
        }

        const getDataSS_woPrint = (params) => {
            let myFilters = [];
            if (params.custpage_subsidiary) {
                myFilters.push(
                    search.createFilter({name: 'subsidiary', operator: 'anyof', values: params.custpage_subsidiary})
                );
            }

            if (params.custpage_wo_fromdt) {
                myFilters.push(search.createFilter({
                    name: 'custbody_scv_prod_start_date',
                    operator: 'onorafter',
                    values: params.custpage_wo_fromdt
                }));
            }

            if (params.custpage_wo_todt) {
                myFilters.push(search.createFilter({
                    name: 'custbody_scv_prod_start_date',
                    operator: 'onorbefore',
                    values: params.custpage_wo_todt
                }));
            }

            if (params.custpage_so_source) {
                myFilters.push(
                    search.createFilter({
                        name: 'custbody_scv_sales_order',
                        operator: 'anyof',
                        values: params.custpage_so_source.split(',')
                    })
                );
            }

            if (params.custpage_supply_req_date) {
                myFilters.push(
                    search.createFilter({
                        name: 'requesteddate',
                        operator: 'on',
                        values: params.custpage_supply_req_date
                    })
                );
            }

            if (params.custpage_assembly) {
                myFilters.push(
                    search.createFilter({name: 'item', operator: 'anyof', values: params.custpage_assembly})
                );
            }

            if (params.custpage_wo_type) {
                myFilters.push(
                    search.createFilter({
                        name: 'custbody_scv_work_order_type',
                        operator: 'anyof',
                        values: params.custpage_wo_type.split(',')
                    })
                );
            }

            if (params.custpage_status) {
                myFilters.push(
                    search.createFilter({
                        name: 'custbody_scv_approval_status',
                        operator: 'anyof',
                        values: params.custpage_status.split(',')
                    })
                );
            }

            if (params.custpage_location) {
                myFilters.push(
                    search.createFilter({name: 'location', operator: 'anyof', values: params.custpage_location})
                );
            }

            if (params.custpage_work_center) {
                myFilters.push(
                    search.createFilter({
                        name: 'custbody_mfgmob_workcenter',
                        operator: 'anyof',
                        values: params.custpage_work_center.split(',')
                    })
                );
            }

            if (params.custpage_prod_lotno) {
                myFilters.push(search.createFilter({
                    name: "formulatext",
                    formula: "case when {custbody_scv_assembly_lot} in ('" + params.custpage_prod_lotno.split(",").join("','") + "') or {custbody_scv_assembly_lot} is null then 1 else 0 end",
                    operator: "is",
                    values: "1"
                }));
            }

            return constSearchWOPrint.getDataSource(myFilters);
        }

        // const getDataSS_woPrint = (params) => {
        //     let myFilters = [];
        //     if (params.custpage_subsidiary) {
        //         myFilters.push(
        //             search.createFilter({name: 'subsidiary', operator: 'anyof', values: params.custpage_subsidiary})
        //         );
        //     }
        //
        //     if (params.custpage_wo_fromdt) {
        //         myFilters.push(search.createFilter({
        //             name: 'custbody_scv_prod_start_date',
        //             operator: 'onorafter',
        //             values: params.custpage_wo_fromdt
        //         }));
        //     }
        //
        //     if (params.custpage_wo_todt) {
        //         myFilters.push(search.createFilter({
        //             name: 'custbody_scv_prod_start_date',
        //             operator: 'onorbefore',
        //             values: params.custpage_wo_todt
        //         }));
        //     }
        //
        //     if (params.custpage_so_source) {
        //         myFilters.push(
        //             search.createFilter({
        //                 name: 'custbody_scv_sales_order',
        //                 operator: 'anyof',
        //                 values: params.custpage_so_source.split(',')
        //             })
        //         );
        //     }
        //
        //     if (params.custpage_supply_req_date) {
        //         myFilters.push(
        //             search.createFilter({
        //                 name: 'requesteddate',
        //                 operator: 'on',
        //                 values: params.custpage_supply_req_date
        //             })
        //         );
        //     }
        //
        //     if (params.custpage_assembly) {
        //         myFilters.push(
        //             search.createFilter({name: 'item', operator: 'anyof', values: params.custpage_assembly})
        //         );
        //     }
        //
        //     if (params.custpage_wo_type) {
        //         myFilters.push(
        //             search.createFilter({
        //                 name: 'custbody_scv_work_order_type',
        //                 operator: 'anyof',
        //                 values: params.custpage_wo_type.split(',')
        //             })
        //         );
        //     }
        //
        //     if (params.custpage_status) {
        //         myFilters.push(
        //             search.createFilter({
        //                 name: 'custbody_scv_approval_status',
        //                 operator: 'anyof',
        //                 values: params.custpage_status.split(',')
        //             })
        //         );
        //     }
        //
        //     if (params.custpage_location) {
        //         myFilters.push(
        //             search.createFilter({name: 'location', operator: 'anyof', values: params.custpage_location})
        //         );
        //     }
        //
        //     if (params.custpage_work_center) {
        //         myFilters.push(
        //             search.createFilter({
        //                 name: 'custbody_mfgmob_workcenter',
        //                 operator: 'anyof',
        //                 values: params.custpage_work_center.split(',')
        //             })
        //         );
        //     }
        //
        //     return constSearchWOPrint.getDataSource(myFilters);
        // }

        const getDataSS_woPrintDtl = (params) => {
            let myFilters = [];
            if (params.custpage_subsidiary) {
                myFilters.push(
                    search.createFilter({name: 'subsidiary', operator: 'anyof', values: params.custpage_subsidiary})
                );
            }

            if (params.custpage_wo_fromdt) {
                myFilters.push(search.createFilter({
                    name: 'custbody_scv_prod_start_date',
                    operator: 'onorafter',
                    values: params.custpage_wo_fromdt
                }));
            }

            if (params.custpage_wo_todt) {
                myFilters.push(search.createFilter({
                    name: 'custbody_scv_prod_start_date',
                    operator: 'onorbefore',
                    values: params.custpage_wo_todt
                }));
            }

            if (params.custpage_so_source) {
                myFilters.push(
                    search.createFilter({
                        name: 'custbody_scv_sales_order',
                        operator: 'anyof',
                        values: params.custpage_so_source.split(',')
                    })
                );
            }

            if (params.custpage_supply_req_date) {
                myFilters.push(
                    search.createFilter({
                        name: 'requesteddate',
                        operator: 'on',
                        values: params.custpage_supply_req_date
                    })
                );
            }

            if (params.custpage_assembly) {
                myFilters.push(
                    search.createFilter({name: 'item', operator: 'anyof', values: params.custpage_assembly})
                );
            }

            if (params.custpage_wo_type) {
                myFilters.push(
                    search.createFilter({
                        name: 'custbody_scv_work_order_type',
                        operator: 'anyof',
                        values: params.custpage_wo_type.split(',')
                    })
                );
            }

            if (params.custpage_status) {
                myFilters.push(
                    search.createFilter({
                        name: 'custbody_scv_approval_status',
                        operator: 'anyof',
                        values: params.custpage_status.split(',')
                    })
                );
            }

            if (params.custpage_location) {
                myFilters.push(
                    search.createFilter({name: 'location', operator: 'anyof', values: params.custpage_location})
                );
            }

            if (params.custpage_work_center) {
                myFilters.push(
                    search.createFilter({
                        name: 'custbody_mfgmob_workcenter',
                        operator: 'anyof',
                        values: params.custpage_work_center.split(',')
                    })
                );
            }

            return constSearchWOPrintDtl.getDataSource(myFilters);
        }

        const getDateTodate = (trandate) => {
            if (!(trandate instanceof Date) || isNaN(trandate.getTime())) {
                return '....../....../.............';
            }
            let timezoneOffset = trandate.getTimezoneOffset() / 60;
            trandate.setHours(trandate.getHours() + timezoneOffset + 7);
            let dd_now = String(trandate.getDate()).padStart(2, '0');
            let mm_now = String(trandate.getMonth() + 1).padStart(2, '0');
            let yyyy_now = trandate.getFullYear();

            return dd_now + '/' + mm_now + '/' + yyyy_now;
        }

        return {onRequest}

    });
