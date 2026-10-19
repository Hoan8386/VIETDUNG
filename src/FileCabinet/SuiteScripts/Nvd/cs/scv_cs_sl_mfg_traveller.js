/**
 * =======================================================================================
 *  Date                Author                  Description
 *  18 Nov 2024		    Khanh Tran			    Init, create file. Màn hình phiếu giao việc và phiếu in liên quan from mr. Bính(https://app.clickup.com/t/86cx3591d)
 *  19 Dec 2024		    Hung Nguyen			    NVD - MFG - Mẫu in Phiếu yêu cầu sản xuất from Thao(https://app.clickup.com/t/86cxc6ehq)
 *  02 Jun 2025         Thanh Ngo			    NVD - MFG - Sửa mẫu in Phiếu yêu cầu sản xuất from Mr.Phuc Truong
 */
/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([
        'N/currentRecord', 'N/url', 'N/query', 'N/runtime', 'N/search', 'N/record',
        '../lib/scv_lib_cs.js', '../lib/scv_lib_function.js', '../lib/scv_lib_cs_xls.js',
        '../cons/scv_cons_record.js', '../lib/scv_lib_cs.js', '../lib/scv_lib_utils', '../olib/alasql/alasql.min@1.7.3',
        '../cons/scv_cons_location.js', '../cons/scv_cons_search_wo_so_tksx.js',
    ],
    
    function (crr, url, query, runtime, search, record, libCs,
        lbf, libXls, constRecord, lcs, libUtils, alasql,
        constLocation, cSearchWoSoTksx
    ) {
        const CUR_SCRIPT = {
            ID: 'customscript_scv_sl_mfg_traveller',
            DEPLOYID_UI: 'customdeploy_scv_sl_mfg_traveller',
            DEPLOYID_DATA: 'customdeploy_scv_sl_mfg_traveller_data',
            // ID_EXPORT: 'customscript_scv_sl_mfg_traveller_export',
            // DEPLOYID_EXPORT: 'customdeploy_scv_sl_mfg_traveller_export',
        }

        const COLOR_PROCESS = ["#98FB98", "#FFA07A", "#87CEEB", "#FFA500", "#F0E68C", "#3E75F7", "#B945F7"];

        /**
         * Function to be executed after page is initialized.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
         *
         * @since 2015.2
         */
        function pageInit(scriptContext) {
            let curRec = scriptContext.currentRecord;debugger
            setTimeout(setColorDefaultProcess(curRec), 0);
            constRecord.initQuickFindFieldSelect(curRec, "custpage_work_center", {
                data: curRec.getField("custpage_work_center").getSelectOptions(),
                valueExpr: "value",
                displayExpr: "text",
                reInsertOption: false
            }, false);
            
            constRecord.initQuickFindFieldSelect(curRec, "custpage_location", {
                data: curRec.getField("custpage_location").getSelectOptions(),
                valueExpr: "value",
                displayExpr: "text",
                reInsertOption: false
            }, false);
            
            constRecord.initQuickFindFieldSelect(curRec, "custpage_assembly", {
                data: curRec.getField("custpage_assembly").getSelectOptions(),
                valueExpr: "value",
                displayExpr: "text",
                reInsertOption: false
            }, false);
        }
        
        const setColorDefaultProcess = (curRec) => {
            let arrDataSlWos = [];
            let slWorkorders = 'custpage_sl_workorders';
            for (let i = 0; i < curRec.getLineCount(slWorkorders); i++) {
                let objRes = {};
                objRes.line = i;
                objRes.sublistId = slWorkorders;
                objRes.custpage_col_prod_lot = curRec.getSublistValue(slWorkorders, "custpage_col_prod_lot", i);
                arrDataSlWos.push(objRes);
            }
            
            let arrProdLot = alasql(`SELECT DISTINCT custpage_col_prod_lot FROM ?`, [arrDataSlWos]);
            let idxColor = 0;
            for (let i = 0; i < arrProdLot.length; i++) {
                let codeColor = COLOR_PROCESS[idxColor];
                let arrDataOfSublist_filter = arrDataSlWos.filter(e => String(e.custpage_col_prod_lot) === String(arrProdLot[i].custpage_col_prod_lot));
                if (arrDataOfSublist_filter.length === 1) continue;
                
                for (let j = 0; j < arrDataOfSublist_filter.length; j++) {
                    let objDataLine = arrDataOfSublist_filter[j];
                    
                    let columnFirst = jQuery(`#${objDataLine.sublistId}row${objDataLine.line} td`)[0];
                    columnFirst.style = `background-color: ${codeColor} !important; border-radius: 10px`;
                }
                
                idxColor++;
                if (idxColor === COLOR_PROCESS.length) {
                    idxColor = 0;
                }
            }
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
            let sl = scriptContext.sublistId;
            let fieldId = scriptContext.fieldId;
            let line = scriptContext.line;
            if (fieldId === 'custpage_subsidiary') {
                onLoadLocationBySub(curRec, 'custpage_location', 'custpage_subsidiary');
                onLoadWoCenterByLocation(curRec, 'custpage_work_center', 'custpage_location');
            } else if (fieldId === 'custpage_col_check') {
                if (sl === 'custpage_sl_workorders') {
                    let cur_check = curRec.getSublistValue(sl, 'custpage_col_check', line);
                    let cur_priority = curRec.getSublistValue(sl, 'custpage_col_priority', line);
                    let cur_work_center = curRec.getSublistValue(sl, 'custpage_col_work_center', line);
                    let cur_so_tksx = curRec.getSublistValue(sl, 'custpage_col_so_tksx', line);
                    for (let i = 0; i < curRec.getLineCount(sl); i++) {
                        let check = curRec.getSublistValue(sl, 'custpage_col_check', i);
                        if (check !== cur_check) {
                            if (
                                cur_priority === curRec.getSublistValue(sl, 'custpage_col_priority', i) &&
                                cur_work_center === curRec.getSublistValue(sl, 'custpage_col_work_center', i) &&
                                cur_so_tksx === curRec.getSublistValue(sl, 'custpage_col_so_tksx', i)
                            ) {

                                curRec.selectLine({sublistId: sl, line: i});
                                curRec.setCurrentSublistValue(sl, 'custpage_col_check', cur_check, true, true);
                                curRec.commitLine(sl);
                            }
                        }
                    }
                }
            } else if (fieldId === 'custpage_location') {
                onLoadWoCenterByLocation(curRec, 'custpage_work_center', 'custpage_location');
            }
        }

        const onLoadWoCenterByLocation = (curRec, fieldReset, fieldRestrict) => {
            let locationsId = curRec.getValue(fieldRestrict);
            let result = [];
            if (locationsId) result = constLocation.getEntityGroupById(locationsId);
            
            let work_center_field = curRec.getField(fieldReset);
            constRecord.initLoadFieldClient(work_center_field, {
                displayExpr: "groupname", valueExpr: "id", data: result
            }, true)
            
            constRecord.initQuickFindFieldSelect(curRec, "custpage_work_center", {
                data: result,
                valueExpr: "id",
                displayExpr: "groupname",
                reInsertOption: false
            }, false);
        }
        
        const onLoadLocationBySub = (curRec, fieldReset, fieldRestrict) => {
            let subId = curRec.getValue(fieldRestrict);
            let sql = `
            SELECT location.id, location.name, LocationSubsidiaryMap.subsidiary
            FROM location
            JOIN LocationSubsidiaryMap 
            ON location.id = LocationSubsidiaryMap.location
            WHERE isinactive = 'F' and location.custrecord_scv_loc_type = 1`;
            if (subId) sql += ` AND LocationSubsidiaryMap.subsidiary IN (${subId})`;
            
            let resultSQL = query.runSuiteQL({query: sql});
            let resultQuery = resultSQL.asMappedResults();
            let location_field = curRec.getField(fieldReset);
            location_field.removeSelectOption({value: null});
            location_field.insertSelectOption({value: '', text: ''});
            for (let obj of resultQuery) {
                location_field.insertSelectOption({value: obj.id, text: obj.name});
            }
            
            constRecord.initQuickFindFieldSelect(curRec, "custpage_location", {
                data: resultQuery,
                valueExpr: "id",
                displayExpr: "name",
                reInsertOption: false
            }, false);
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
            window.onbeforeunload = null;
            let isSelected = isRowSelected();
            if (!isSelected) {
                return alert('You must select at least 1 line');
            }
            
            return true;
        }

        const getSeletedWoIds = () => {
            let curRec = crr.get();
            let sl = 'custpage_sl_workorders';
            let arrSelectedWoIds = [];
            for (let i = 0; i < curRec.getLineCount(sl); i++) {
                let vCheck = curRec.getSublistValue(sl, 'custpage_col_check', i);
                if (vCheck === true || vCheck === 'T') {
                    let wo_id = curRec.getSublistValue(sl, 'custpage_col_wo_id', i);
                    arrSelectedWoIds.push(wo_id);
                }
            }
            return arrSelectedWoIds.join(',');
        }
        
        const isRowSelected = () => {
            let curRec = crr.get();
            let sl = 'custpage_sl_workorders';
            for (let i = 0; i < curRec.getLineCount(sl); i++) {
                let vCheck = curRec.getSublistValue(sl, 'custpage_col_check', i);
                if (vCheck === true || vCheck === 'T') {
                    return true
                }
            }
            return false;
        }
        
        const onSearchResult = () => {
            window.onbeforeunload = null;
            let curRec = crr.get();
            let isValid = libCs.validateFieldMandatory(curRec, [
                'custpage_subsidiary', 'custpage_location'
            ]);
            if (!isValid) return;
            
            let params = getObjParams();
            let urlDC = url.resolveScript({
                scriptId: CUR_SCRIPT.ID,
                deploymentId: CUR_SCRIPT.DEPLOYID_UI,
                params: params,
            });
            urlDC = urlDC + '&isSearch=T';
            window.location.replace(urlDC);
        }
        
        const onExportYCSX = () => {
            window.onbeforeunload = null;
            let curRec = crr.get();
            let isValid = libCs.validateFieldMandatory(curRec, [
                'custpage_subsidiary', 'custpage_location', 'custpage_wo_type', 'custpage_wo_fromdt', 'custpage_wo_todt'
            ]);
            if (!isValid) return;

            let params = getObjParams();
            let urlDC = url.resolveScript({
                scriptId: CUR_SCRIPT.ID_EXPORT,
                deploymentId: CUR_SCRIPT.DEPLOYID_EXPORT,
                params: params,
            });
            urlDC = urlDC + '&isExport=T&phieutype=YCSX&exportType=EXCEL';
            window.open(urlDC);
        }
        
        const getObjParams = () => {
            let curRec = crr.get();
            return {
                custpage_work_center: curRec.getValue('custpage_work_center').join(','),
                custpage_subsidiary: curRec.getValue('custpage_subsidiary'),
                custpage_location: curRec.getValue('custpage_location'),
                custpage_wo_type: curRec.getValue('custpage_wo_type').join(','),
                custpage_wo_fromdt: curRec.getText('custpage_wo_fromdt'),
                custpage_wo_todt: curRec.getText('custpage_wo_todt'),
                custpage_assembly: curRec.getValue('custpage_assembly'),
                custpage_so_tksx: curRec.getValue('custpage_so_tksx'),
                custpage_approve_fromdt: curRec.getText('custpage_approve_fromdt'),
                custpage_approve_todt: curRec.getText('custpage_approve_todt'),
                custpage_status : curRec.getValue('custpage_status'),
            };
        }
        
        const URL_RQ = '/app/site/hosting/scriptlet.nl?script=customscript_scv_sl_mfg_traveller&deploy=customdeploy_scv_sl_mfg_traveller';
        
        function onExportPGV() {
            window.onbeforeunload = null;
            let currRecord = crr.get();
            let params = getObjParams();
            params.isSearch = 'T';
            params.isgetdata = 'T';
            lcs.showLoadingDialog(true);
            let resCallData = nlapiRequestURL(URL_RQ, params);
            let objDataCol = JSON.parse(resCallData.getBody());
            let objDataConfig = JSON.parse(nlapiRequestURL(URL_RQ, {action: 'getUrlTemplate'}).getBody());
            try {
                exportExcel(params, currRecord, objDataConfig, objDataCol);
            } catch (error) {
                console.log("error", error)
                lcs.showLoadingDialog(false);
            }
            // lcs.showLoadingDialog(false);
        }
        
        const exportExcel = async (params, currRecord, objDataConfig, objDataCol) => {
            const reportName = 'Phiếu giao việc';
            try {
                let workbook = await libXls.loadWorkbookFromUrl(objDataConfig.urlTemplate);
                let result = objDataCol.result;
                let today = new Date();
                let ngayin = getDateTodate(today)
                let empUser = runtime.getCurrentUser().id;
                let empName;
                if (empUser) {
                    let lkFEmp = search.lookupFields({
                        type: 'employee',
                        id: empUser,
                        columns: ['firstname']
                    });
                    empName = lkFEmp.firstname;
                }
                let currentSheetFirst = workbook.worksheets[0];
                currentSheetFirst.name = libUtils.removeVietnameseTones('Sheet 1').slice(0, 31);
                let groupedData = result.reduce((groups, item) => {
                    let groupId = `${item.subsidiary}|${item.work_center}|${item.wo_type}`;
                    if (!groups[groupId]) {
                        groups[groupId] = [];
                    }
                    groups[groupId].push(item);
                    return groups;
                }, {});
                let sheetCounter = 1;
                Object.keys(groupedData).forEach(data => {
                    let nameSheet = `PGV${sheetCounter > 1 ? sheetCounter : ''}`;
                    sheetCounter++;
                    let _currSheet = libXls.fnCloneSheet(workbook, 1, nameSheet);
                    let dataForSheet = groupedData[data];
                    let lines = dataForSheet[0]?.lines;
                    let work_center = dataForSheet[0]?.work_center;
                    let sub = dataForSheet[0]?.subsidiary;
                    let wo_type = dataForSheet[0]?.wo_type;
                    let startRow = 11;
                    updateSheetValues(_currSheet, lines, startRow);
                    let endRow = startRow + lines.length - 1;
                    // updateFooter(_currSheet, endRow);
                    applyBordersToSheetCells(_currSheet, endRow);
                    updateHeader(_currSheet, work_center, wo_type, sub, ngayin, empName);
                });
                workbook.removeWorksheet(1);

                await libXls.saveWorkbook(workbook, reportName + ".xlsx");
            } catch (error) {
                console.log("error", error);
            } finally {
                lcs.showLoadingDialog(false);
            }
        };
        
        const updateSheetValues = (_currSheet, lines, startRow) => {
            lines.sort((a, b) => (a.prod_lot || '').localeCompare(b.prod_lot || ''));
            let stt = 1;
            let previousId = null;
            let mergedProdLot = null;  // Giới hạn merge cho prod_lot
            let itemStringMerged = ""; // Biến để lưu itemString gộp lại

            lines.forEach((dataItem, rowIndex) => {
                let itemString = '';

                // Nếu có wo_id, lấy thông tin item từ WORK_ORDER
                if (dataItem.wo_id) {
                    let recWO = record.load({
                        type: record.Type.WORK_ORDER,
                        id: dataItem.wo_id,
                    });
                    let lineCnt = recWO.getLineCount({sublistId: 'item'});
                    let rsItem = [];
                    for (let i = 0; i < lineCnt; i++) {
                        let itemline = recWO.getSublistText({
                            sublistId: 'item',
                            fieldId: 'item',
                            line: i
                        });
                        rsItem.push(itemline);
                    }
                    itemString = rsItem.join('\n');
                    console.log('itemString', itemString);
                }

                let row = startRow + rowIndex;

                // Cập nhật STT cho các dòng với prod_lot giống nhau
                if (dataItem.prod_lot !== previousId) {
                    previousId = dataItem.prod_lot;
                    updateCellValue(_currSheet, `A${row}`, stt);
                    stt++;
                    mergedProdLot = dataItem.prod_lot; // Gán giá trị prod_lot để kiểm tra merge cột L
                    itemStringMerged = itemString; // Lưu itemString cho dòng đầu tiên trong nhóm
                } else {
                    updateCellValue(_currSheet, `A${row}`, stt - 1);
                    itemStringMerged += '\n' + itemString; // Gộp itemString nếu prod_lot giống nhau
                }

                // Cập nhật các cột khác
                updateCellValue(_currSheet, `B${row}`, dataItem.prod_lot || '');
                updateCellValue(_currSheet, `C${row}`, dataItem.wo_name || '');
                updateCellValue(_currSheet, `D${row}`, dataItem.assembly || '');
                updateCellValue(_currSheet, `E${row}`, dataItem.units || '');
                updateCellValue(_currSheet, `F${row}`, dataItem.qty || '');
                updateCellValue(_currSheet, `G${row}`, dataItem.tolerancemax || '');
                updateCellValue(_currSheet, `H${row}`, dataItem.tolerancemax || '');
                updateCellValue(_currSheet, `I${row}`, dataItem.order_type || '');
                updateCellValue(_currSheet, `J${row}`, dataItem.thoigian_giaohang || '');
                updateCellValue(_currSheet, `K${row}`, dataItem.memo_one || '');

                // Cập nhật cột L với itemStringMerged (gộp lại nếu prod_lot giống nhau)
                if (dataItem.prod_lot === mergedProdLot) {
                    updateCellValue(_currSheet, `L${row}`, itemStringMerged);  // Gộp itemString vào cột L
                } else {
                    updateCellValue(_currSheet, `L${row}`, itemString); // Cập nhật itemString cho dòng đầu tiên
                }
            });
        };

        function updateCellValue(sheet, cellAddress, value) {
            let cell = sheet.getCell(cellAddress);
            cell.value = value;
            let column = cellAddress.charAt(0);

            switch (column) {
                case 'A':
                case 'B':
                case 'C':
                case 'E':
                case 'G':
                case 'H':
                case 'I':
                case 'J':
                    cell.alignment = {
                        vertical: 'middle',
                        horizontal: 'center',
                        wrapText: true
                    };
                    break;
                case 'D':
                case 'K':
                case 'L':
                    cell.alignment = {
                        vertical: 'middle',
                        horizontal: 'left',
                        wrapText: true
                    };
                    break;
                case 'F':
                    cell.alignment = {
                        vertical: 'middle',
                        horizontal: 'right',
                        wrapText: true
                    };
                    break;
            }
        }

        function applyBordersToSheetCells(_currSheet, endRow) {
            for (let row = 10; row <= endRow; row++) {
                for (let col = 'A'.charCodeAt(0); col <= 'L'.charCodeAt(0); col++) {
                    let cellAddress = String.fromCharCode(col) + row;
                    let cell = _currSheet.getCell(cellAddress);
                    cell.border = {
                        top: {style: 'thin', color: {argb: 'FF000000'}},
                        left: {style: 'thin', color: {argb: 'FF000000'}},
                        bottom: {style: 'thin', color: {argb: 'FF000000'}},
                        right: {style: 'thin', color: {argb: 'FF000000'}}
                    };
                    cell.font = {
                        name: 'Times New Roman',
                        size: 11
                    };
                }
            }
        }


        function updateHeader(_currSheet, work_center, wo_type, sub, ngayin, empName) {
            libXls.fnMergeCell(_currSheet, 4, 1, 4, 12);
            libXls.fnMergeCell(_currSheet, 9, 7, 9, 8);
            libXls.fnMergeCell(_currSheet, 9, 1, 10, 1);
            libXls.fnMergeCell(_currSheet, 9, 2, 10, 2);
            libXls.fnMergeCell(_currSheet, 9, 3, 10, 3);
            libXls.fnMergeCell(_currSheet, 9, 4, 10, 4);
            libXls.fnMergeCell(_currSheet, 9, 5, 10, 5);
            libXls.fnMergeCell(_currSheet, 9, 6, 10, 6);
            libXls.fnMergeCell(_currSheet, 9, 9, 10, 9);
            libXls.fnMergeCell(_currSheet, 9, 10, 10, 10);
            libXls.fnMergeCell(_currSheet, 9, 11, 10, 11);
            libXls.fnMergeCell(_currSheet, 9, 12, 10, 12);

            libXls.fnUpdMultiValueToCell(_currSheet, [
                {addressCell: 'C6', keys: '{congty}', values: sub},
                {addressCell: 'C7', keys: '{loaiwo}', values: wo_type},
                {addressCell: 'C8', keys: '{may}', values: work_center},
                {addressCell: 'L5', keys: '{ngayin}', values: ngayin},
                {addressCell: 'L7', keys: '{nguoiin}', values: empName},
            ]);
        }

        function getDateTodate(trandate) {
            if (!(trandate instanceof Date) || isNaN(trandate.getTime())) {
                return '....../....../.............';
            }
            let timezoneOffset = trandate.getTimezoneOffset() / 60;
            trandate.setHours(trandate.getHours() + timezoneOffset + 7);
            let dd_now = String(trandate.getDate()).padStart(2, '0');
            let mm_now = String(trandate.getMonth() + 1).padStart(2, '0');
            let yyyy_now = trandate.getFullYear();

            return dd_now + ' / ' + mm_now + ' / ' + yyyy_now;
        }
        
        const onExportYCSXPdf = () => {
            window.onbeforeunload = null;
            let curRec = crr.get();
            let isValid = libCs.validateFieldMandatory(curRec, [
                'custpage_subsidiary', 'custpage_location', 'custpage_wo_type', 'custpage_wo_fromdt', 'custpage_wo_todt'
            ]);
            if (!isValid) return;
            let params = getObjParams();
            params.isExportYcsxPdf = 'T';
            params.arrWoIds = getSeletedWoIds();
            let urlDC = url.resolveScript({
                scriptId: CUR_SCRIPT.ID,
                deploymentId: CUR_SCRIPT.DEPLOYID_UI,
                params: params,
            });
            window.open(urlDC);
        }
        
        const onExportPGVPdf = () => {
            window.onbeforeunload = null;
            let curRec = crr.get();
            let isValid = libCs.validateFieldMandatory(curRec, [
                'custpage_subsidiary', 'custpage_location', 'custpage_wo_type', 'custpage_wo_fromdt', 'custpage_wo_todt'
            ]);
            if (!isValid) return;

            let params = getObjParams();
            params.isExportPgvPdf = 'T';
            params.arrWoIds = getSeletedWoIds();
            let urlDC = url.resolveScript({
                scriptId: CUR_SCRIPT.ID,
                deploymentId: CUR_SCRIPT.DEPLOYID_UI,
                params: params,
            });
            window.open(urlDC);
        }

        const onExportPGVPdf2 = () => {
            window.onbeforeunload = null;
            let curRec = crr.get();
            let isValid = libCs.validateFieldMandatory(curRec, [
                'custpage_subsidiary', 'custpage_location', 'custpage_wo_type', 'custpage_wo_fromdt', 'custpage_wo_todt'
            ]);
            if (!isValid) return;

            let params = getObjParams();
            params.isExportPgvPdf2 = 'T';
            params.arrWoIds = getSeletedWoIds();
            let urlDC = url.resolveScript({
                scriptId: CUR_SCRIPT.ID,
                deploymentId: CUR_SCRIPT.DEPLOYID_UI,
                params: params,
            });
            window.open(urlDC);
        }
        
        
        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            saveRecord: saveRecord,
            onSearchResult: onSearchResult,
            // tạm thời không dùng
            // onExportYCSX: onExportYCSX,
            // onExportPGV: onExportPGV,
            onExportYCSXPdf: onExportYCSXPdf,
            onExportPGVPdf: onExportPGVPdf,
            onExportPGVPdf2
        };
        
    });
