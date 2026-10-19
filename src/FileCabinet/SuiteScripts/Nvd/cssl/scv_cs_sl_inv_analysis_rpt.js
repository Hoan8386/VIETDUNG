/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([
    'N/query', 'N/format',
    '../olib/moment.js',
    '../lib/scv_lib_cs_xls.js',
    '../cons/scv_cons_search.js'
],

function(
    query, format, 
    moment,
    libCsXLS,
    constSearch
) {
    
    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */

    const ReportType = {
        InventoryAnalysis: {
            ID: "invanalysis",
            NAME: "Phân tích tồn kho"
        },
        InventoryHistory: {
            ID: "invhistory",
            NAME: "Lịch sử tồn kho"
        }
    }

    function pageInit(scriptContext) {

    }

    /**
     * Function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @since 2015.2
     */
    function fieldChanged(scriptContext) {
        let curRec = scriptContext.currentRecord;
        let sublistId = scriptContext.sublistId;
        let fieldId = scriptContext.fieldId;

        fieldChangedBodyFields(curRec, sublistId, fieldId);
    }

    const fieldChangedBodyFields = (curRec, sublistId, fieldId) => {
        if(!!sublistId) return;

        if(fieldId === 'custpage_report_type') {
            fieldChangedReportType(curRec, sublistId, fieldId);
        }
        else if(fieldId === 'custpage_subsidiary') {
            let subsidiary = curRec.getValue(fieldId);
            let arrLocation = getDataLocationBySub(subsidiary);
            loadOptionLocationField(curRec, arrLocation);
        } 
        else if(fieldId === 'custpage_group_lv1') {
            loadOptionGroupLevel(curRec, fieldId, 'custpage_group_lv2');

            ['custpage_group_lv3', 'custpage_group_lv4'].forEach(fieldId => {
                let objFieldRemove = curRec.getField(fieldId);
                objFieldRemove.removeSelectOption({value: null});
            });
        } 
        else if(fieldId === 'custpage_group_lv2') {
            loadOptionGroupLevel(curRec, fieldId, 'custpage_group_lv3');
            
            ['custpage_group_lv4'].forEach(fieldId => {
                let objFieldRemove = curRec.getField(fieldId);
                objFieldRemove.removeSelectOption({value: null});
            });
        } 
        else if(fieldId === 'custpage_group_lv3') {
            loadOptionGroupLevel(curRec, fieldId, 'custpage_group_lv4');
        } 
    }

    const fieldChangedReportType = (curRec, sublistId, fieldId) => {
        let report_type = curRec.getValue(fieldId);

        let fFromDate = curRec.getField("custpage_fromdt");
        let fToDate = curRec.getField("custpage_todt");
        let fFromDateLSTHXB = curRec.getField("custpage_fromdt_lsthxb");
        let fToDateLSTHXB = curRec.getField("custpage_todt_lsthxb");
        let fChkPSGD = curRec.getField("custpage_chk_psgd");
        let fChkXBNB = curRec.getField("custpage_chk_xbnb");
        let fFromDtIntransit = curRec.getField("custpage_fromdt_intransit");
        let fToDateIntransit = curRec.getField("custpage_todt_intransit");
        let fFromDtNK = curRec.getField("custpage_fromdt_nhapkho");
        let fToDtNK = curRec.getField("custpage_todt_nhapkho");

        let isInvAnalysis = report_type === ReportType.InventoryAnalysis.ID;

        fFromDate.isMandatory = !isInvAnalysis;
        fToDate.isMandatory = true;
        fFromDateLSTHXB.isMandatory = isInvAnalysis;
        fToDateLSTHXB.isMandatory = isInvAnalysis;
        fToDateIntransit.isMandatory = isInvAnalysis;
        fFromDtIntransit.isMandatory = isInvAnalysis;
        fFromDtNK.isMandatory = isInvAnalysis;
        fToDtNK.isMandatory = isInvAnalysis;

        fFromDate.isDisabled = isInvAnalysis;
        fFromDateLSTHXB.isDisabled = !isInvAnalysis;
        fToDateLSTHXB.isDisabled = !isInvAnalysis;
        fChkPSGD.isDisabled = !isInvAnalysis;
        fChkXBNB.isDisabled = !isInvAnalysis;
        fToDateIntransit.isDisabled = !isInvAnalysis;
        fFromDtIntransit.isDisabled = !isInvAnalysis;
        fFromDtNK.isDisabled = !isInvAnalysis;
        fToDtNK.isDisabled = !isInvAnalysis;
    }

    /**
     * Validation function to be executed when record is saved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @returns {boolean} Return true if record is valid
     *
     * @since 2015.2
     */
    function saveRecord(scriptContext) {

    }

    const onSearchResult = async (isExport) => {
        window.onbeforeunload = null;
        let params = _scvForm.getParameter();

        let fields = ["custpage_report_type", "custpage_subsidiary"];
        if(params.custpage_report_type == ReportType.InventoryAnalysis.ID) {
            fields.push(...[
                "custpage_fromdt_lsthxb", "custpage_todt_lsthxb", "custpage_todt", "custpage_fromdt_intransit", 
                "custpage_todt_intransit", "custpage_fromdt_nhapkho", "custpage_todt_nhapkho"
            ]);
        } else if(params.custpage_report_type == ReportType.InventoryHistory.ID) {
            fields.push("custpage_fromdt", "custpage_todt");
        }

        if (!_scvForm.validateFieldMandatory(fields)) return;
        _scvForm.showLoadingDialog(true);

        if(params.custpage_report_type == ReportType.InventoryAnalysis.ID) {
            _scvForm.ajax.postAsync(_scvForm.serviceScript.url, {
                action: "getDataPeriod", 
                ...params
            }, function(_res, _paramsCallback){
                let arrPeriod = _res.data;

                let arrActionFunc = [
                    { action: "getDataSSInvBalanceByStatus", params: {...params}, data: [] },
                    { action: "getDataSSInvSalesComSump", params: {...params}, data: [] },
                    { action: "getDataSSInvOrderAndTransit", params: {...params}, data: [] },
                    { action: "getDataSSInvQtyOrderByPO", params: {...params}, data: [] },
                    { action: "getDataSSInvQtyOrderByITR", params: {...params}, data: [] },
                ];

                _scvForm.ajax.postAsyncMultiFetchSSPage(_scvForm.serviceScript.url, arrActionFunc, async function (_res){
                    let arrResult = [];

                    let arrInvStatus = _scvForm.getResultActionPage(_res, "getDataSSInvBalanceByStatus");
                    let arrInvSales = _scvForm.getResultActionPage(_res, "getDataSSInvSalesComSump");
                    let arrInvOrderTransit = _scvForm.getResultActionPage(_res, "getDataSSInvOrderAndTransit");
                    let arrInvQtyOrderByPOSS06 = _scvForm.getResultActionPage(_res, "getDataSSInvQtyOrderByPO");
                    let arrInvQtyOrderByITRSS07 = _scvForm.getResultActionPage(_res, "getDataSSInvQtyOrderByITR");

                    let objRes = getDataInventoryAnalysis(arrPeriod, arrInvStatus, arrInvSales, arrInvOrderTransit, arrInvQtyOrderByPOSS06, arrInvQtyOrderByITRSS07, params);

                    if(isExport === "F") {
                        _scvDx.setColumns("custpage_sl_result", objRes.columns);
                        _scvDx.setDataSource("custpage_sl_result", objRes.data);
                    } else {
                        onExportInvAnalysis(objRes, arrPeriod, params);
                    }
                    _scvForm.showLoadingDialog(false);
                });
            });
        } 
        else if(params.custpage_report_type == ReportType.InventoryHistory.ID){
            let arrPeriod = getDataPeriodInvHistory(params);
            let arrActionFunc = [
                { action: "getDataSSBeginBalanceItem", params: {...params}, data: [] },
            ];

            for(let objPeriod of arrPeriod) {
                arrActionFunc.push({
                    action: "getDataSSInvBalanceByItem", params: {
                        ...params,
                        custpage_fromdt: objPeriod.startDate,
                        custpage_todt: objPeriod.endDate,
                        period: objPeriod.id
                    }, data: []
                });
            }

            _scvForm.ajax.postAsyncMultiFetchSSPage(_scvForm.serviceScript.url, arrActionFunc, async function (_res){
                let arrBegin = _scvForm.getResultActionPage(_res, "getDataSSBeginBalanceItem");
                let arrBalanceItem = _scvForm.getResultActionPage(_res, "getDataSSInvBalanceByItem");

                let objRes = getDataInventoryHistory(arrPeriod, arrBegin, arrBalanceItem);
                if(isExport === "F") {
                    _scvDx.setColumns("custpage_sl_result", objRes.columns);
                    _scvDx.setDataSource("custpage_sl_result", objRes.data);
                } else {
                    onExportInvHistory(objRes, arrPeriod, params);
                }
                _scvForm.showLoadingDialog(false);
            });
        }
    }

    const onExportInvAnalysis = async (objRes, arrPeriod, params) => {
        let columns = objRes.columns;
        columns = columns.slice(7, columns.length);
        let data = objRes.data;
        let file_export = params.custpage_file_exp_temp01;
        // export excel
        let workbook = await libCsXLS.loadWorkbookFromUrl(file_export);
        let curSheet = workbook.worksheets[0];
        curSheet.properties.defaultColWidth = 17;

        let objSubsidiary = getDataSubsidiary(params.custpage_subsidiary);
        libCsXLS.replaceKeyCellValue(curSheet, "A1", "{pSubLegalname}", objSubsidiary.legalname);
        libCsXLS.replaceKeyCellValue(curSheet, "A2", "{pSubAddress}", objSubsidiary.mainaddress_display);
        libCsXLS.replaceKeyCellValue(curSheet, "A5", "{pFromDate}", params.custpage_fromdt_lsthxb);
        libCsXLS.replaceKeyCellValue(curSheet, "A5", "{pToDate}", params.custpage_todt_lsthxb);

        // create columns table header
        let startRow = 7, endRow = 8;
        let columnIndex = 8, nextColumnIndex = 8;
        let objCopyCell = curSheet.getCell("A7");
        for(let objCol of columns) {
            if(objCol.dataField) {
                curSheet.mergeCells(startRow, columnIndex, endRow, columnIndex);
                let newCell = curSheet.getCell(startRow, columnIndex);
                newCell.value = objCol.caption;
                newCell.style = { ...objCopyCell.style };
            } else {
                nextColumnIndex += objCol.columns.length - 1;
                curSheet.mergeCells(startRow, columnIndex, startRow, nextColumnIndex);
                let newCell = curSheet.getCell(startRow, columnIndex);
                newCell.value = objCol.caption;
                newCell.style = { ...objCopyCell.style };
                addBackgroundCell(objCol, newCell);

                let arrDetail = objCol.columns;
                for(let i = 0; i < arrDetail.length; i++) {
                    let cellIndex = columnIndex + i;
                    curSheet.mergeCells(endRow, cellIndex, endRow, cellIndex);
                    let newCell = curSheet.getCell(endRow, cellIndex);
                    newCell.value = arrDetail[i].caption;
                    newCell.style = { ...objCopyCell.style };
                    addBackgroundCell(objCol, newCell);
                }
            }

            columnIndex = nextColumnIndex + 1;
            nextColumnIndex = nextColumnIndex + 1;
        }

        let idxRow = 9;
        for(let i = 0; i < data.length; i++) {
            let obj = data[i];

            let rowData  = curSheet.getRow(idxRow);
            let idxCurRow = i + 1 + idxRow;

            let arrInsert = [
                obj.item_upccode, obj.item_displayname, obj.unit_display, obj.group_lv1_display,
                obj.group_lv2_display, obj.group_lv3_display, obj.group_lv4_display,
            ];

            for(let objCol of columns) {
                if(objCol.dataField) {
                    arrInsert.push(obj[objCol.dataField]);
                } else {
                    let arrDetail = objCol.columns;
                    for(let i = 0; i < arrDetail.length; i++) {
                        arrInsert.push(obj[arrDetail[i].dataField]);
                    }
                }
            }

            let newRow = curSheet.insertRow(idxCurRow, arrInsert);
            newRow.height = newRow.height * 20 / newRow.width;

            rowData.eachCell((cell, colNumber) => {
                const newCell = newRow.getCell(colNumber);
                newCell.style = { ...cell.style };
            });

            addStyleMultiRowTable(rowData, newRow, columns, 8);
        }

        curSheet.spliceRows(idxRow, 1);
        // create width columns 
        libCsXLS.createBorderWithRange(curSheet, 
            {row: startRow, col: 1}, 
            {row: endRow + data.length, col: nextColumnIndex - 1},
            "thin", {rowStyle: "thin", colStyle: "thin"});
        await libCsXLS.saveWorkbook(workbook, "Phân tích tồn kho.xlsx");
    }

    const onExportInvHistory = async (objRes, arrPeriod, params) => {
        let columns = objRes.columns;
        columns = columns.slice(3, columns.length);
        let data = objRes.data;
        let file_export = params.custpage_file_exp_temp02;
        // export excel
        let workbook = await libCsXLS.loadWorkbookFromUrl(file_export);
        let curSheet = workbook.worksheets[0];
        curSheet.properties.defaultColWidth = 17;

        let objSubsidiary = getDataSubsidiary(params.custpage_subsidiary);
        libCsXLS.replaceKeyCellValue(curSheet, "A1", "{pSubLegalname}", objSubsidiary.legalname);
        libCsXLS.replaceKeyCellValue(curSheet, "A2", "{pSubAddress}", objSubsidiary.mainaddress_display);
        libCsXLS.replaceKeyCellValue(curSheet, "A5", "{pFromDate}", params.custpage_fromdt);
        libCsXLS.replaceKeyCellValue(curSheet, "A5", "{pToDate}", params.custpage_todt);

        // create columns table header
        let startRow = 7, endRow = 8;
        let columnIndex = 4, nextColumnIndex = 4;
        let objCopyCell = curSheet.getCell("A7");
        for(let objCol of columns) {
            if(objCol.dataField) {
                curSheet.mergeCells(startRow, columnIndex, endRow, columnIndex);
                let newCell = curSheet.getCell(startRow, columnIndex);
                newCell.value = objCol.caption;
                newCell.style = { ...objCopyCell.style };
            } else {
                nextColumnIndex += objCol.columns.length - 1;
                curSheet.mergeCells(startRow, columnIndex, startRow, nextColumnIndex);
                let newCell = curSheet.getCell(startRow, columnIndex);
                newCell.value = objCol.caption;
                newCell.style = { ...objCopyCell.style };
                addBackgroundCell(objCol, newCell);

                let arrDetail = objCol.columns;
                for(let i = 0; i < arrDetail.length; i++) {
                    let cellIndex = columnIndex + i;
                    curSheet.mergeCells(endRow, cellIndex, endRow, cellIndex);
                    let newCell = curSheet.getCell(endRow, cellIndex);
                    newCell.value = arrDetail[i].caption;
                    newCell.style = { ...objCopyCell.style };
                    addBackgroundCell(objCol, newCell);
                }
            }

            columnIndex = nextColumnIndex + 1;
            nextColumnIndex = nextColumnIndex + 1;
        }

        let idxRow = 9;
        for(let i = 0; i < data.length; i++) {
            let obj = data[i];

            let rowData  = curSheet.getRow(idxRow);
            let idxCurRow = i + 1 + idxRow;

            let arrInsert = [
                obj.item_upccode, obj.item_displayname, obj.unit_display
            ];

            for(let objCol of columns) {
                if(objCol.dataField) {
                    arrInsert.push(obj[objCol.dataField]);
                } else {
                    let arrDetail = objCol.columns;
                    for(let i = 0; i < arrDetail.length; i++) {
                        arrInsert.push(obj[arrDetail[i].dataField]);
                    }
                }
            }

            let newRow = curSheet.insertRow(idxCurRow, arrInsert);
            newRow.height = newRow.height * 20 / newRow.width;

            rowData.eachCell((cell, colNumber) => {
                const newCell = newRow.getCell(colNumber);
                newCell.style = { ...cell.style };
            });

            addStyleMultiRowTable(rowData, newRow, columns, 4);
        }

        curSheet.spliceRows(idxRow, 1);
        // create width columns 
        libCsXLS.createBorderWithRange(curSheet, 
            {row: startRow, col: 1}, 
            {row: endRow + data.length, col: nextColumnIndex - 1},
            "thin", {rowStyle: "thin", colStyle: "thin"});
        await libCsXLS.saveWorkbook(workbook, "Lịch sử tồn kho.xlsx");
    }

    const addStyleMultiRowTable = (rowData, newRow, columns, index) => {
        let cellString = rowData.getCell(1);
        let cellNumber = rowData.getCell(index);

        for(let objCol of columns) {
            if(objCol.dataField) {
                makeCopyCellStyle(cellString, cellNumber, newRow, objCol, index);
                index++;
            } else {
                let arrDetail = objCol.columns;
                for(let i = 0; i < arrDetail.length; i++) {
                    makeCopyCellStyle(cellString, cellNumber, newRow, arrDetail[i], index);
                    index++;
                }
            }
        }
    }

    const makeCopyCellStyle = (cellString, cellNumber, newRow, objCol, index) => {
        let cell = objCol.dataType === "string" ? cellString : cellNumber;
        const newCell = newRow.getCell(index);
        newCell.style = { ...cell.style };
    }

    const addBackgroundCell = (objCol, newCell) => {
        if(!!objCol.background) {
            newCell.style.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: objCol.background }
            }
        }
    }

    const getDataPeriodInvHistory = (params) => {
        let fromdt = params.custpage_fromdt;
        let todt = params.custpage_todt;

        let data = [];
        if(!!fromdt && !!todt) {
            let startDate = format.parse({ value: fromdt, type: "date" });
            let endDate = format.parse({ value: todt, type: "date" });

            const yearDiff = endDate.getFullYear() - startDate.getFullYear();
            const monthDiff = endDate.getMonth() - startDate.getMonth();

            let monthNum = yearDiff * 12 + monthDiff;

            for(let i = 0; i <= monthNum; i++) {
                let newDate = new Date(startDate);
                newDate.setMonth(newDate.getMonth() + i);

                data.push({
                    id: moment(newDate).format('YYYYMM'),
                    format: moment(newDate).format('YYYY.MM'),
                    name: moment(newDate).format('MM/YYYY'),
                    startDate: getStartDatePeriod(newDate, i),
                    endDate: getEndDatePeriod(newDate, endDate, i, monthNum),
                });
            }
        }
        return data;
    }

    const getEndDatePeriod = (newDate, endDate, i, monthNum) => {
        if(i === monthNum) {
            return moment(endDate).format('DD/MM/YYYY');
        } else {
            let date = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0);
            return moment(date).format('DD/MM/YYYY');
        }
    }

    const getStartDatePeriod = (newDate, i) => {
        if(i === 0) {
            return moment(newDate).format('DD/MM/YYYY');
        } else {
            let date = new Date(newDate.getFullYear(), newDate.getMonth(), 1);
            return moment(date).format('DD/MM/YYYY');
        }
    }

    const getDataSubsidiary = (subsidiary) => {
        if(!subsidiary) return {};

        const resultSQL = query.runSuiteQL({
            query: `SELECT id, legalname, 
                BUILTIN.DF(mainaddress) as mainaddress_display
                FROM subsidiary
                WHERE id = ${subsidiary}`
        });
        const data = resultSQL.asMappedResults();
        return data.length > 0 ? data[0] : {};
    }

    const getDataInventoryAnalysis = (arrPeriod, arrInvStatus, arrInvSales, arrInvOrderTransit, arrInvQtyOrderByPOSS06, arrInvQtyOrderByITRSS07, params) => {
        // TODO: get data columns
        let arrGrpInvStatus = groupDataByFieldId(arrInvStatus, "inventorystatus");
        let columns = getDataColumnsInvAnalysis(arrPeriod, arrGrpInvStatus, arrInvStatus);
        // TODO: get data result
        let data = [];

        let arrDT02 = [];

        arrInvQtyOrderByPOSS06.forEach(e => {
            let objInvQtyOrderByITRSS07 = arrInvQtyOrderByITRSS07.find(i => i.item === e.item && i.po === e.po) || {
                quantity_received: 0
            };

            let order_qty = e.quantity - objInvQtyOrderByITRSS07.quantity_received;
          
            arrDT02.push({
                ...objInvQtyOrderByITRSS07, ...e,
                order_qty: order_qty > (e.allow_difference_quantity*1) ? order_qty : 0
            });
        });

        let arrData = [...arrInvStatus, ...arrInvSales, ...arrInvOrderTransit, ...arrDT02];
        let arrGrpItem = groupDataByFieldId(arrData, "item");

        for(let itemId of arrGrpItem) {
            let arrFilterInvStatus = arrInvStatus.filter(e => e.item == itemId);
            let objInvOrderTransit = arrInvOrderTransit.find(e => e.item == itemId) || {};
            let arrFilterDT02 = arrDT02.filter(e => e.item == itemId);

            let objFindData = arrData.find(e => e.item == itemId) || {};
            let objData = getDataObjDataItem(objFindData);

            // ss01 mapping
            let totalQtyInvStatus = 0, totalVtVdsgHn = 0;
            for(let invStatusId of arrGrpInvStatus) {
                let objInvStatus = arrFilterInvStatus.find(e => e.inventorystatus == invStatusId) || { quantity: 0 };

                if (objInvStatus.vtsg_hn === 'yes') {
                    totalVtVdsgHn += objInvStatus.quantity;
                }if (objInvStatus.vtsg_hn === 'no') {
                    objData["inventorystatus_" + invStatusId] = objInvStatus.quantity;
                    totalQtyInvStatus += objData["inventorystatus_" + invStatusId];
                }
            }
            objData.inventorystatus_total = totalQtyInvStatus;
            objData.vt_vdsg_hn = totalVtVdsgHn;
            // ss02 mapping
            objData.lsthxb_qty_total = 0;
            for(let objPeriod of arrPeriod) {
                let objInvSales = arrInvSales.find(e => e.item == itemId && e.period == objPeriod.format) || {};
                
                objData["lsthxb_qty_" + objPeriod.id] = objInvSales?.quantity || 0;
                objData.lsthxb_qty_total += (objInvSales?.quantity || 0);
            }
            objData.lsthxb_qty_average = (arrPeriod.length > 0) ? (objData.lsthxb_qty_total / arrPeriod.length) : 0;
            // ss03 mapping
            objData.intransit_qty = objInvOrderTransit.intransit_qty || 0;
            objData.product_inprogress_qty = objInvOrderTransit.product_inprogress_qty || 0;
            objData.intransit_qty_inter = objInvOrderTransit.intransit_qty_inter || 0;
            // ss06 mapping
            objData.order_qty = objInvOrderTransit.order_qty || 0;
            for(let objDT02 of arrFilterDT02) {
                objData.order_qty += objDT02.order_qty;
            }

            objData.total_qty = objData.inventorystatus_total + objData.order_qty + objData.intransit_qty + 
                objData.product_inprogress_qty + objData.intransit_qty_inter + objData.lsthxb_qty_total;

            if(params.custpage_chk_psgd !== 'T' || objData.total_qty !== 0) {
                constSearch.replaceValueNoneByKey(objData);
                data.push(objData);
            }
        }

        return { columns, data };
    }

    const getDataObjDataItem = (objFindData) => {
        let keys = [
            "subsidiary", "item", "item_upccode", "item_displayname", "unit", "planing_category", 
            "group_lv1", "group_lv2", "group_lv3", "group_lv4", "trademark", "color_code", "do_day_sp",
			"do_day_nhom", "item_width", "item_length", "lop_son", "hoa_tiet_dot", "kieu_dang",
			"item_step", "unit_conversion_rate", "item_parent", "parent_item_width", "parent_item_length",
			"parent_item_ddsp", "khoi_luong_vtc", "parent_item_hsqdm2"
        ];

        let obj = {};
        for(let key of keys) {
            obj[key] = objFindData[key];
            if(key + "_display" in objFindData) {
                obj[key + "_display"] = objFindData[key + "_display"];
            }
        }
        return obj;
    }

    const getDataColumnsInvAnalysis = (arrPeriod, arrGrpInvStatus, arrInvStatus) => {
        // default
        let columns = [
            {width: 80, dataField: "item_upccode", caption: "Mã sản phẩm", dataType: "string", allowEditing: false},
            {width: 80, dataField: "item_displayname", caption: "Tên sản phẩm", dataType: "string", allowEditing: false},
            {width: 80, dataField: "unit_display", caption: "ĐVT", dataType: "string", allowEditing: false},
            {width: 80, dataField: "group_lv1_display", caption: "Nhóm cấp 1", dataType: "string", allowEditing: false},
            {width: 80, dataField: "group_lv2_display", caption: "Nhóm cấp 2", dataType: "string", allowEditing: false},
            {width: 80, dataField: "group_lv3_display", caption: "Nhóm cấp 3", dataType: "string", allowEditing: false},
            {width: 80, dataField: "group_lv4_display", caption: "Nhóm cấp 4", dataType: "string", allowEditing: false},
        ];
        
        // columns ton kho
        let objColTonKho = {
            caption: "Tồn kho",
            columns: []
        };

        for(let invStatusId of arrGrpInvStatus) {
            let objInvStatus = arrInvStatus.find(e => e.inventorystatus == invStatusId);

            objColTonKho.columns.push({
                width: 80, 
                dataField: "inventorystatus_" + objInvStatus.inventorystatus, 
                caption: objInvStatus.inventorystatus_display, 
                dataType: "number", 
                format: "###,###,##0",
                allowEditing: false
            });
        }

        objColTonKho.columns.push({
            width: 80, dataField: "inventorystatus_total", caption: "Tổng", dataType: "number", format: "###,###,##0", allowEditing: false
        });
        columns.push(objColTonKho);

        // default
        columns.push(
            { width: 80, dataField: "vt_vdsg_hn", caption: "VT VDSG tại Hà Nội", dataType: "number", format: "###,###,##0", allowEditing: false },
            { width: 80, dataField: "order_qty", caption: "Hàng đi đường", dataType: "number", format: "###,###,##0", allowEditing: false },
            { width: 80, dataField: "intransit_qty", caption: "Đang điều chuyển (Cùng sub)", dataType: "number", format: "###,###,##0", allowEditing: false },
            { width: 80, dataField: "intransit_qty_inter", caption: "Đang điều chuyển (Khác sub)", dataType: "number", format: "###,###,##0", allowEditing: false },
            { width: 80, dataField: "product_inprogress_qty", caption: "Lệnh tồn", dataType: "number", format: "###,###,##0", allowEditing: false },
        );

        // columns period
        let objColPeriod = {
            caption: "Lịch sử tiêu hao hoặc xuất bán",
            columns: []
        };

        for(let objPeriod of arrPeriod) {
            objColPeriod.columns.push({
                width: 80, dataField: "lsthxb_qty_" + objPeriod.id, caption: objPeriod.name, dataType: "number", format: "###,###,##0", allowEditing: false
            });
        }
        objColPeriod.columns.push({
            width: 80, dataField: "lsthxb_qty_total", caption: "Tổng", dataType: "number", format: "###,###,##0", allowEditing: false
        });
        objColPeriod.columns.push({
            width: 80, dataField: "lsthxb_qty_average", caption: "Trung bình", dataType: "number", format: "###,###,##0", allowEditing: false
        });

        columns.push(objColPeriod);
        // default (Thông tin, thuộc tính sản phẩm)
        let objColItem = {
            caption: "Thông tin, thuộc tính sản phẩm",
            background: "C9CFDD",
            columns: [
                {width: 80, dataField: "planing_category_display", caption: "Nhóm kế hoạch", dataType: "string", allowEditing: false},
                {width: 80, dataField: "trademark_display", caption: "Thương hiệu", dataType: "string", allowEditing: false},
                {width: 80, dataField: "color_code_display", caption: "Mã màu chính", dataType: "string", allowEditing: false},
                {width: 80, dataField: "do_day_sp", caption: "Độ dày/ Chiều cao", dataType: "string", allowEditing: false},
                {width: 80, dataField: "do_day_nhom", caption: "Độ dày nhôm", dataType: "string", allowEditing: false},
                {width: 80, dataField: "item_width", caption: "Khổ rộng", dataType: "number", format: "###,###,##0", allowEditing: false },
                {width: 80, dataField: "item_length", caption: "Chiều dài", dataType: "number", format: "###,###,##0", allowEditing: false },
                {width: 80, dataField: "lop_son_display", caption: "Lớp sơn", dataType: "string", allowEditing: false},
                {width: 80, dataField: "hoa_tiet_dot_display", caption: "Họa tiết đột", dataType: "string", allowEditing: false},
                {width: 80, dataField: "kieu_dang_display", caption: "Kiểu dáng", dataType: "string", allowEditing: false},
                {width: 80, dataField: "item_step_display", caption: "Bước", dataType: "string", allowEditing: false},
                {width: 80, dataField: "unit_conversion_rate", caption: "Hệ số quy đổi h1", dataType: "number", format: "###,###,##0", allowEditing: false },
            ]
        };
        columns.push(objColItem);
        // default (Vật tư chuẩn liên quan)
        let objColItemParent = {
            caption: "Vật tư chuẩn liên quan",
            background: "C9CFDD",
            columns: [
                {width: 80, dataField: "item_parent", caption: "VTC", dataType: "string", allowEditing: false},
                {width: 80, dataField: "parent_item_width", caption: "Chiều rộng", dataType: "number", format: "###,###,##0", allowEditing: false },
                {width: 80, dataField: "parent_item_length", caption: "Chiều dài", dataType: "number", format: "###,###,##0", allowEditing: false },
                {width: 80, dataField: "parent_item_ddsp", caption: "Độ dày/ Chiều cao", dataType: "string", allowEditing: false},
                {width: 80, dataField: "khoi_luong_vtc", caption: "Khối lượng VTC", dataType: "number", format: "###,###,##0", allowEditing: false },
                {width: 80, dataField: "parent_item_hsqdm2", caption: "Hệ số quy đổi h2", dataType: "number", format: "###,###,##0", allowEditing: false },
            ]
        };
        columns.push(objColItemParent);
        return columns;
    }

    const getDataInventoryHistory = (arrPeriod, arrBegin, arrBalanceItem) => {
        // TODO: get data columns
        let columns = getDataColumnsInvHistory(arrPeriod);
        let data = [];

        console.log(arrPeriod);
        console.log(arrBegin);
        console.log(arrBalanceItem);
        
        let arrItem = groupDataByFieldId(arrBalanceItem, "item");
        for(let itemId of arrItem) {
            let objItem = arrBalanceItem.find(e => e.item == itemId);
            let objRes = {...objItem};
            let objBegin = arrBegin.find(e => e.item == itemId);
            let begin_qty = objBegin?.quantity || 0;

            for(let objPeriod of arrPeriod) {
                let objItemPeriod = arrBalanceItem.find(e => e.item == itemId && e.period == objPeriod.id);

                console.log(objPeriod, objItemPeriod);
                begin_qty += (objItemPeriod?.quantity || 0);
                objRes['qty_' + objPeriod.id] = begin_qty;
            }
            data.push(objRes);
        }

        return {columns, data};
    }

    const getDataColumnsInvHistory = (arrPeriod) => {
        // default
        let columns = [
            {width: 80, dataField: "item_upccode", caption: "Mã sản phẩm", dataType: "string", allowEditing: false},
            {width: 80, dataField: "item_displayname", caption: "Tên sản phẩm", dataType: "string", allowEditing: false},
            {width: 80, dataField: "unit_display", caption: "ĐVT", dataType: "string", allowEditing: false},
        ];

        // columns period
        let objColPeriod = {
            caption: "Lịch sử tồn kho theo tháng",
            columns: []
        };

        for(let objPeriod of arrPeriod) {
            objColPeriod.columns.push({
                width: 80, dataField: "qty_" + objPeriod.id, caption: objPeriod.name, dataType: "number", format: "###,###,##0", allowEditing: false
            });
        }
        columns.push(objColPeriod);
        // default (Thông tin, thuộc tính sản phẩm)
        let objColItem = {
            caption: "Thông tin, thuộc tính sản phẩm",
            background: "C9CFDD",
            columns: [
                {width: 80, dataField: "planing_category_display", caption: "Nhóm kế hoạch", dataType: "string", allowEditing: false},
                {width: 80, dataField: "group_lv1_display", caption: "Nhóm cấp 1", dataType: "string", allowEditing: false},
                {width: 80, dataField: "group_lv2_display", caption: "Nhóm cấp 2", dataType: "string", allowEditing: false},
                {width: 80, dataField: "group_lv3_display", caption: "Nhóm cấp 3", dataType: "string", allowEditing: false},
                {width: 80, dataField: "group_lv4_display", caption: "Nhóm cấp 4", dataType: "string", allowEditing: false},
                {width: 80, dataField: "trademark_display", caption: "Thương hiệu", dataType: "string", allowEditing: false},
                {width: 80, dataField: "color_code_display", caption: "Mã màu chính", dataType: "string", allowEditing: false},
                {width: 80, dataField: "do_day_sp", caption: "Độ dày/ Chiều cao", dataType: "string", allowEditing: false},
                {width: 80, dataField: "do_day_nhom", caption: "Độ dày nhôm", dataType: "string", allowEditing: false},
                {width: 80, dataField: "item_width", caption: "Khổ rộng", dataType: "number", format: "###,###,##0", allowEditing: false },
                {width: 80, dataField: "item_length", caption: "Chiều dài", dataType: "number", format: "###,###,##0", allowEditing: false },
                {width: 80, dataField: "lop_son_display", caption: "Lớp sơn", dataType: "string", allowEditing: false},
                {width: 80, dataField: "hoa_tiet_dot_display", caption: "Họa tiết đột", dataType: "string", allowEditing: false},
                {width: 80, dataField: "kieu_dang_display", caption: "Kiểu dáng", dataType: "string", allowEditing: false},
                {width: 80, dataField: "item_step_display", caption: "Bước", dataType: "string", allowEditing: false},
                {width: 80, dataField: "unit_conversion_rate", caption: "Hệ số quy đổi h1", dataType: "number", format: "###,###,##0", allowEditing: false },
                {width: 80, dataField: "hsqdm2", caption: "Hệ số quy đổi h2", dataType: "number", format: "###,###,##0", allowEditing: false },
                {width: 80, dataField: "class_display", caption: "Phân loại", dataType: "string", allowEditing: false},
                {width: 80, dataField: "luc_ket_dinh_display", caption: "Lực kết dính", dataType: "string", allowEditing: false},
                {width: 80, dataField: "item_tcdb_display", caption: "Tính chất đặc biệt", dataType: "string", allowEditing: false},
            ]
        };
        columns.push(objColItem);
        // default (Vật tư chuẩn liên quan)
        let objColItemParent = {
            caption: "Vật tư chuẩn liên quan",
            background: "C9CFDD",
            columns: [
                {width: 80, dataField: "item_parent", caption: "VTC", dataType: "string", allowEditing: false},
                {width: 80, dataField: "parent_item_width", caption: "Chiều rộng", dataType: "number", format: "###,###,##0", allowEditing: false },
                {width: 80, dataField: "parent_item_length", caption: "Chiều dài", dataType: "number", format: "###,###,##0", allowEditing: false },
                {width: 80, dataField: "parent_item_ddsp", caption: "Độ dày/ Chiều cao", dataType: "string", allowEditing: false},
                {width: 80, dataField: "khoi_luong_vtc", caption: "Khối lượng VTC", dataType: "number", format: "###,###,##0", allowEditing: false },
                {width: 80, dataField: "parent_item_hsqdm2", caption: "Hệ số quy đổi h2", dataType: "number", format: "###,###,##0", allowEditing: false },
            ]
        };
        columns.push(objColItemParent);
        return columns;
    }

    const groupDataByFieldId = (data, field) => {
        let objGroup = {};
        for(let i = 0; i < data.length; i++) {
            let fieldValue = data[i][field];
            if(objGroup[fieldValue] === undefined && !!fieldValue) {
                objGroup[fieldValue] = fieldValue;
            }
        }
        return Object.values(objGroup);
    }

    const loadOptionGroupLevel = (curRec, fieldId, fieldInsertId) => {
        let arrGroupLvId = curRec.getValue(fieldId);

        let objFieldInsert = curRec.getField(fieldInsertId);
        objFieldInsert.removeSelectOption({value: null});
        
        if((arrGroupLvId.length > 1) || (arrGroupLvId.length === 1 && !!arrGroupLvId?.[0])) {
            let arrGroupLevel = getDataGroupLevelByParent(arrGroupLvId);
            for(let objGrpLevel of arrGroupLevel) {
                objFieldInsert.insertSelectOption({
                    value: objGrpLevel.id,
                    text: objGrpLevel.name
                });
            }
        }
    }

    const loadOptionLocationField = (curRec, arrLocation) => {
        let locationField = curRec.getField("custpage_location");
        locationField.removeSelectOption({value: null});

        for(let objLocation of arrLocation) {
            locationField.insertSelectOption({
                value: objLocation.id,
                text: objLocation.name
            });
        }
    }

    const getDataLocationBySub = (subsidiary) => {
        if(!subsidiary) return [];

        const resultSQL = query.runSuiteQL({
            query: `SELECT id, name, fullname, subsidiary
            FROM location
            WHERE makeinventoryavailable = 'T'`
        });
        const data = resultSQL.asMappedResults();

        return data.filter(e => e.subsidiary == subsidiary);
    }

    const getDataGroupLevelByParent = (arrParent) => {
        const resultSQL = query.runSuiteQL({
            query: `SELECT id, name, parent
                FROM customrecord_scv_group_level
                WHERE parent in ('${arrParent.join("', '")}') AND isinactive = 'F'
                ORDER BY name ASC`
        });
        const data = resultSQL.asMappedResults();
        return data;
    }

    const validateFieldsMandatory = (currRecord, fields) => {
        let isValidate = true;
        let notification = "Vui lòng nhập fields: ";

        for(let fieldId of fields) {
            let value = currRecord.getValue(fieldId);
            if(!value) {
                isValidate = false;
                notification += currRecord.getField(fieldId).label + ", ";
            }
        }
        return {
            isValidate, 
            notification: !!isValidate ? "Success!" : (notification.slice(0, notification.length - 2) + ".")
        };
    }

    const plusParam = (currRecord) => {
        return '&custpage_report_type=' + currRecord.getValue('custpage_report_type')
            + '&custpage_subsidiary=' + currRecord.getValue('custpage_subsidiary')
            + '&custpage_item=' + currRecord.getValue('custpage_item')
            + '&custpage_location=' + currRecord.getValue('custpage_location')
            + '&custpage_plan_category=' + currRecord.getValue('custpage_plan_category')
            + '&custpage_group_lv1=' + currRecord.getValue('custpage_group_lv1')
            + '&custpage_group_lv2=' + currRecord.getValue('custpage_group_lv2')
            + '&custpage_group_lv3=' + currRecord.getValue('custpage_group_lv3')
            + '&custpage_group_lv4=' + currRecord.getValue('custpage_group_lv4')
            + '&custpage_fromdt=' + currRecord.getText('custpage_fromdt')
            + '&custpage_todt=' + currRecord.getText('custpage_todt')
            + '&custpage_fromdt_lsthxb=' + currRecord.getText('custpage_fromdt_lsthxb')
            + '&custpage_todt_lsthxb=' + currRecord.getText('custpage_todt_lsthxb');
            
    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        // saveRecord: saveRecord,
        onSearchResult: onSearchResult,
        // onExport: onExport,
    };
    
});
