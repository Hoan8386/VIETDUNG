/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([
        'N/currentRecord',
        'N/query',
        'N/record',
        'N/search',
        'N/url',
        '../common/scv_common_excel_helper',
        '../cons/scv_cons_record.js',
    ],
    function (
        ccr,
        query,
        record,
        search,
        url,
        excelHelper,
        constRecord
    ) {

        const pageInit = (context) => {

        };

        const fieldChanged = (context) => {
            let fieldId = context.fieldId;
            let curRec = ccr.get();
            if (fieldId === 'custpage_nhom_cap_1') populateNhomCap2();
            if (fieldId === 'custpage_nhom_cap_2') populateNhomCap3();
            if (fieldId === 'custpage_nhom_cap_3') populateNhomCap4();
            if (fieldId === 'custpage_subsidiary') {
                removeSelectOptions(curRec, 'custpage_location');
                let subsidiary = curRec.getValue('custpage_subsidiary');

                    let arrLocation = getLocationBySub(subsidiary);
                    if (arrLocation.length > 0) {
                        constRecord.initLoadFieldClient(curRec.getField('custpage_location'), {
                            displayExpr: "name", valueExpr: "id", data: arrLocation
                        }, true)
                    }
            }
        }

        const removeSelectOptions = (curRec , fieldId) => {
            let options = curRec.getField({fieldId: fieldId}).getSelectOptions();
            let field = curRec.getField({fieldId: fieldId});

            // Loop backward and remove them
            for (let i = options.length - 1; i >= 0; i--) {
                field.removeSelectOption({
                    value: options[i].value
                })
            }
        }

        const getLocationBySub = (subsidiary) => {
            let sql = `
            SELECT location.id, location.name, LocationSubsidiaryMap.subsidiary
            FROM location
            JOIN LocationSubsidiaryMap 
            ON location.id = LocationSubsidiaryMap.location
            WHERE isinactive = 'F'`;
            if(subsidiary) sql += ` AND LocationSubsidiaryMap.subsidiary IN (${subsidiary})`;

            let resultSearch = query.runSuiteQL({query: sql});
            let arrData = resultSearch.asMappedResults();
            return arrData;
        }

        const populateNhomCap2 = () => {
            let currentRecord = ccr.get();
            let idNhomCap1 = currentRecord.getValue('custpage_nhom_cap_1').filter(Boolean).map(item => `'${item}'`).join(',');
            let fieldNhomCap2 = currentRecord.getField({fieldId: 'custpage_nhom_cap_2'});
            setSelectOptionToDefaults(fieldNhomCap2);
            if (idNhomCap1) {
                addSelectOptionByParent(idNhomCap1, fieldNhomCap2);
            } else {
                let fieldNhomCap3 = currentRecord.getField({fieldId: 'custpage_nhom_cap_3'});
                let fieldNhomCap4 = currentRecord.getField({fieldId: 'custpage_nhom_cap_4'});
                setSelectOptionToDefaults(fieldNhomCap3);
                setSelectOptionToDefaults(fieldNhomCap4);
            }
        }

        const populateNhomCap3 = () => {
            let currentRecord = ccr.get();
            let nhomCap2Value = currentRecord.getValue('custpage_nhom_cap_2');
            let fieldNhomCap3 = currentRecord.getField({fieldId: 'custpage_nhom_cap_3'});
            setSelectOptionToDefaults(fieldNhomCap3)
            if (nhomCap2Value) {
                addSelectOptionByParent(`${nhomCap2Value}`, fieldNhomCap3);
            }
        }

        const populateNhomCap4 = () => {
            let currentRecord = ccr.get();
            let nhomCap3Value = currentRecord.getValue('custpage_nhom_cap_3');
            let fieldNhomCap4 = currentRecord.getField({fieldId: 'custpage_nhom_cap_4'});
            setSelectOptionToDefaults(fieldNhomCap4)
            if (nhomCap3Value) {
                addSelectOptionByParent(nhomCap3Value, fieldNhomCap4);
            }
        }

        const getSuiteletPage = (suiteletScriptId, suiteletDeploymentId, pageId) => {
            document.location = url.resolveScript({
                scriptId: suiteletScriptId,
                deploymentId: suiteletDeploymentId,
                params: {
                    'page': pageId
                }
            });
        }

        const refresh = () => {
            window.onbeforeunload = null;
            let urlDC = url.resolveScript({
                scriptId: 'customscript_scv_sl_nhapxuatton_lot',
                deploymentId: 'customdeploy_scv_sl_nhapxuatton_lot',
                returnExternalUrl: false
            });
            window.location.replace(urlDC);
        }

        const plusParam = (currentRecord) => {
            let location_param = currentRecord.getValue('custpage_location');
            let loc_name_param = currentRecord.getText('custpage_location');
            let item_param = currentRecord.getValue('custpage_item');
            let lot_no_param = currentRecord.getText('custpage_lot_no');
            let from_Date_param = currentRecord.getText('custpage_fromdate');
            let to_Date_param = currentRecord.getText('custpage_todate');
            let status_param = currentRecord.getValue('custpage_status');
            let subsidiary_param = currentRecord.getValue('custpage_subsidiary');

            return '&custpage_location=' + location_param + '&custpage_loc_name=' + loc_name_param +
                '&custpage_item=' + item_param + '&custpage_lot_no=' + lot_no_param +
                '&custpage_fromdate=' + from_Date_param + '&custpage_todate=' + to_Date_param +
                '&custpage_status=' + status_param + '&custpage_subsidiary=' + subsidiary_param +
                '&custpage_nhom_cap_1=' + currentRecord.getValue('custpage_nhom_cap_1') +
                '&custpage_nhom_cap_2=' + currentRecord.getValue('custpage_nhom_cap_2') +
                '&custpage_nhom_cap_3=' + currentRecord.getValue('custpage_nhom_cap_3') +
                '&custpage_nhom_cap_4=' + currentRecord.getValue('custpage_nhom_cap_4');
        }

        const onSearch = () => {
            debugger
            window.onbeforeunload = null;
            // if(!checkLocation()) return;
            let currentRecord = ccr.get();
            let urlDC = url.resolveScript({
                scriptId: 'customscript_scv_sl_nhapxuatton_lot',
                deploymentId: 'customdeploy_scv_sl_nhapxuatton_lot',
                returnExternalUrl: false
            });
            if (checkDate()) {
                urlDC = urlDC + plusParam(currentRecord) + '&isSearch=T';
                window.location.replace(urlDC);
            }
        }

        const exportEx = async () => {
            window.onbeforeunload = null;
            let currentRecord = ccr.get();

            let urlSuitelet = url.resolveScript({
                scriptId: 'customscript_scv_sl_ep_nhapxuatton_lot',
                deploymentId: 'customdeploy_scv_sl_ep_nhapxuatton_lot',
                returnExternalUrl: false
            });
            urlSuitelet += plusParam(currentRecord);

            try {
                excelHelper.showLoadingDialog(true);
                let objResponse = await excelHelper.postRequestByAjax(urlSuitelet, {isExcel: 'T'});
                if (objResponse.templatetype === 'excel') {

                    let workbook = await excelHelper.loadWorkbookFromUrl(objResponse.templateUrl);
                    // mẫu dữ liệu thay thế
                    let objCellReplace = objResponse.mappedData;
                    let tableData = objResponse.tableData;
                    tableData.forEach( (item)=> {
                            item.upccode = decodeHtmlEntities(item.upccode);
                            item.displayname = decodeHtmlEntities(item.displayname)
                        }
                    );

                    let colId = objResponse.colId;
                    let idxSourceRow = objResponse.idxSourceRow;
                    let idxRowData = objResponse.idxRowData;
                    let fileName = objResponse.filename;
                    let headerRowFormat = objResponse.headerRowFormat;
                    let curSheet = workbook.worksheets[0];

                    addHeaderLinesToSheet(headerRowFormat, curSheet, idxSourceRow - 2);
                    mergeHeader(curSheet);
                    excelHelper.replaceValueColumn(curSheet, objCellReplace);
                    excelHelper.insertValueTable({curSheet, arrData: tableData, colId, idxSourceRow, idxRowData});
                    await excelHelper.saveWorkbook(workbook, fileName);
                    excelHelper.showLoadingDialog(false);
                }
            } catch (e) {
                console.log('Error: ', e);
                excelHelper.showLoadingDialog(false);
            }
        }

        const mergeHeader = (worksheet) => {
            for (let col = 1; col <= 8; col++) {
                worksheet.mergeCells(5, col, 6, col); // Merge vertically: row 1 to 2 in each column
            }

            worksheet.mergeCells(5, 9, 5, 12);


            for (let col = 13; col <= 21; col++) {
                worksheet.mergeCells(5, col, 6, col); // Merge vertically: row 1 to 2 in each column
            }
        }

        const addHeaderLinesToSheet = (headerRowFormat, curSheet, idxHeaderRow) => {
            let cells = headerRowFormat.cells;
            let idxRow = idxHeaderRow;
            for (let i = 1; i <= 2; i++) {
                excelHelper.addHeaderLine(cells[`line${i}`], headerRowFormat.height, {curSheet, idxRow});
                idxRow++;
            }

        }

        const checkDate = () => {
            let currentRecord = ccr.get();
            let fromDate = currentRecord.getValue('custpage_fromdate');
            let toDate = currentRecord.getValue('custpage_todate');
            if (fromDate && toDate) {
                if (new Date(fromDate) > new Date(toDate)) {
                    alert('Ngày bắt đầu không được lớn hơn ngày kết thúc!');
                    return false;
                }
            } else {
                alert(`Vui lòng chọn 'Từ ngày' và 'Đến ngày'!`);
                return false;
            }
            return true;
        }

        const checkLocation = () => {
            let currentRecord = ccr.get();
            let location = currentRecord.getValue('custpage_location');
            if (!location || (location.length === 1 && location[0] === '')) {
                alert('Vui lòng chọn kho hàng!');
                return false;
            }
            return true;
        }

        const decodeHtmlEntities = (text) => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(text.replace(/&gt;/g, '>'), 'text/html');
            return doc.documentElement.textContent;
        }

        const insertValueTable = (params) => {
            let curSheet = params.curSheet;
            let idxSourceRow = params.idxSourceRow;
            let idxRowData = params.idxRowData;
            let arrData = params.arrData;
            let rowSrc = curSheet.getRow(idxSourceRow);
            let arrLength = arrData.length;
            if (arrLength === 0) {
                let obj = {}
                params.colId.forEach(col => {
                    obj[col] = '';
                })
                arrData.push(obj);
                arrLength = 1;
            }
            for (let i = 0; i < arrLength; i++) {
                let dataRow = getValueRow(arrData[i], params.colId);
                let newRow = curSheet.insertRow(idxRowData, dataRow);
                newRow.height = rowSrc.height;
                newRow.eachCell((cell, colNumber) => {
                    cell.style = {...rowSrc.getCell(colNumber).style};
                    if (!isNaN(Number(cell.value)) && colNumber !== 1) {
                        cell.alignment = {horizontal: 'right', vertical: 'middle'};
                        cell.numFmt = '#,###';
                    }
                    if (isFloat(cell.value) && colNumber !== 1) {
                        cell.alignment = {horizontal: 'right', vertical: 'middle'};
                        cell.numFmt = '#,###.##';
                    }
                });

                idxRowData += 1;
            }
            curSheet.spliceRows(idxSourceRow, 1);
            syncRangeMergeAfterInsertRow(curSheet, idxSourceRow, arrLength - 1);
            return idxRowData - 1;
        }

        const getValueRow = (objData, arrHeader) => {
            let arrResult = [];
            arrHeader.forEach(col => {
                arrResult.push(objData[col] || "")
            })
            return arrResult;
        }

        const setSelectOptionToDefaults = (sublistField) => {
            sublistField.getSelectOptions().forEach(option => {
                sublistField.removeSelectOption({value: option.value});
            });
            sublistField.insertSelectOption({value: '', text: '', isSelected: true});
        }

        const addSelectOptionByParent = (idParent, fieldChild) => {
            let strQuery = `
                SELECT id, name
                FROM customrecord_scv_group_level
                WHERE parent IN (${idParent})
                ORDER BY name ASC
            `;
            let result = query.runSuiteQL({query: strQuery}).asMappedResults();
            if (result && result.length > 0) {
                result.forEach(item => {
                    fieldChild.insertSelectOption({value: item.id, text: `${item.name}`,});
                });
            }
        }

        return {
            fieldChanged: fieldChanged,
            getSuiteletPage: getSuiteletPage,
            exportEx: exportEx,
            refresh: refresh,
            onSearch: onSearch,
            pageInit: pageInit
        };
    }
)
;