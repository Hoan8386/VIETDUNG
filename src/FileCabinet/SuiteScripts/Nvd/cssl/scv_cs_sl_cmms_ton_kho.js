/**
 * Nội dung:
 * Key:
 * * =======================================================================================
 *  Date                Author                  Description
 *  ?                   ?                       ?
 *  04 Sep 2025         Thành Ngô           Create cs cho file báo cáo So sánh tồn kho Min-Max, from Mr.Tâm (https://app.clickup.com/t/86d04rafd)
 *
 **/
/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([
        'N/currentRecord',
        'N/url',
        'N/query',
        '../lib/scv_lib_cs',
        '../common/scv_common_excel_helper',
        '../lib/scv_lib_custom_form.js'
    ],

    function (
        ccr,
        url,
        query,
        libCs,
        comExcelHelper,
        libCustomForm
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
        function pageInit(scriptContext) {
            if (objProjectData.isearch === "T") {
                // libCustomForm.renderDxGridResult(objProjectData.data, objProjectData.columns, 'scvTabsContainer',);
                renderDxGridResult(objProjectData.data, objProjectData.columns, 'scvTabsContainer');
            }
        }

        const renderDxGridResult = (data, columns, elemnetId) => {
            libCustomForm.resizeGrid(elemnetId);
            let optionGrid = getOptionGrid();
            optionGrid.dataSource.store = data;
            optionGrid.columns = columns;

            $('#' + elemnetId).dxDataGrid(optionGrid);
        }

        const getOptionGrid = () => {
            return {
                dataSource: {
                    store: [],
                    reshapeOnPush: true,
                },
                columns: [],
                columnResizingMode: "widget",
                showBorders: true,
                showColumnLines: true,
                showRowLines: true,
                allowColumnResizing: true,
                columnAutoWidth: true,
                repaintChangesOnly: true,
                wordWrapEnabled: true,
                searchPanel: {visible: true},
                rowAlternationEnabled: false,
                paging: {pageSize: 500},
                loadPanel: {enabled: false},
                columnFixing: {enabled: true},
                pager: {
                    showPageSizeSelector: true,
                    allowedPageSizes: [100, 200, 500, 1000],
                    showInfo: true,
                    showNavigationButtons: true,
                },
                onCellPrepared: function (e) {
                    libCustomForm.createFontReport(e.cellElement);
                    let hidden = false;
                    if (e.rowType == "data" && e.column.allowEditing == true) {
                        if (e.row.data?.level == 1) {
                            e.cellElement.css("font-weight", "bold");
                        }
                        if(e.columnIndex == 0 && e.text.includes('Nhóm cấp')){
                            e.cellElement.attr("colspan", "19");
                            e.cellElement.css("font-weight", "bold");
                            if(e.text.includes('Nhóm cấp 1')){
                                e.cellElement.css("background-color", "lightblue");
                            }
                            if(e.text.includes('Nhóm cấp 2')){
                                e.cellElement.css("background-color", "lightblue");
                            }
                        }
                        if(e.columnIndex != 0 && String(e.row.data.stt)?.includes('Nhóm cấp')){
                            e.cellElement.css("display", "none");
                        }
                        if(e.rowIndex == 0){
                            e.cellElement.css("display", "none");
                        }
                    }
                }
            };
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
            let fieldId = scriptContext.fieldId;
            if (fieldId === 'custpage_nhom_cap_1') {
                populateNhomCap2()
                // populateItem();
            }

            // if (fieldId === 'custpage_nhom_cap_2') populateItem();
        }

        const populateNhomCap2 = () => {
            let currentRecord = ccr.get();
            let idNhomCap1 = currentRecord.getValue('custpage_nhom_cap_1').filter(Boolean).map(item => `'${item}'`).join(',');
            let fieldNhomCap2 = currentRecord.getField({fieldId: 'custpage_nhom_cap_2'});
            setSelectOptionToDefaults(fieldNhomCap2);
            if (idNhomCap1) {
                addSelectOptionByParent(idNhomCap1, fieldNhomCap2);
            }
        }

        const populateItem = () => {
            let currentRecord = ccr.get();
            let idNhomCap1 = currentRecord.getValue('custpage_nhom_cap_1').filter(Boolean).map(item => `'${item}'`).join(',');
            let idNhomCap2 = currentRecord.getValue('custpage_nhom_cap_2').filter(Boolean).map(item => `'${item}'`).join(',');
            let fieldItem = currentRecord.getField({fieldId: 'custpage_item'});
            setSelectOptionToDefaults(fieldItem);
            if (idNhomCap1 || idNhomCap2) {
                let arrParent1 = [];
                let arrParent2 = [];
                if (checkNull(idNhomCap1)) arrParent1.push(...idNhomCap1.split(','));
                if (checkNull(idNhomCap2)) arrParent2.push(...idNhomCap2.split(','));
                let strQuery = `
                    SELECT id, itemid
                    FROM item
                    WHERE
                        custitem_scv_group_lv1 IN (${arrParent1.join(',')})
                    AND
                        custitem_scv_group_lv2 IN (${arrParent2.join(',')})
                    ORDER BY itemid ASC
                `;
                let result = query.runSuiteQL({query: strQuery}).asMappedResults();
                if (result && result.length > 0) {
                    result.forEach(item => {
                        fieldItem.insertSelectOption({value: item.id, text: `${item.itemid}`,});
                    });
                }
            }
        }

        const setSelectOptionToDefaults = (sublistField) => {
            sublistField.removeSelectOption({value: null}); // Clear all options
            sublistField.insertSelectOption({value: '', text: '', isSelected: true});
        }

        const addSelectOptionByParent = (idParent, fieldChild) => {
            if(!idParent) return;
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

        const searchReport = () => {
            window.onbeforeunload = null;
            let currentRecord = ccr.get();
            if (!libCs.validateDate(currentRecord, 19)) {
                return;
            }
            let urlDC = getUrlParam(currentRecord) + '&isearch=T';
            window.location.replace(urlDC);
        }

        function getUrlParam(currentRecord) {
            return url.resolveScript({
                scriptId: 'customscript_scv_sl_cmms_ton_kho',
                deploymentId: 'customdeploy_scv_sl_cmms_ton_kho',
                returnExternalUrl: false,
                params: getParam(currentRecord)
            });
        }

        function getParam(currentRecord) {
            return {
                custpage_subsidiary: currentRecord.getValue('custpage_subsidiary'),
                custpage_nhom_cap_1: currentRecord.getValue('custpage_nhom_cap_1').join(','),
                custpage_nhom_cap_2: currentRecord.getValue('custpage_nhom_cap_2').join(','),
                custpage_item: currentRecord.getValue('custpage_item').join(','),
                custpage_todate: currentRecord.getText('custpage_todate')
            }
        }

        const URL_RQ = '/app/site/hosting/scriptlet.nl?script=customscript_scv_sl_cmms_ton_kho&deploy=customdeploy_scv_sl_cmms_ton_kho';

        function exportReport() {
            window.onbeforeunload = null;
            let currentRecord = ccr.get();
            if (!libCs.validateDate(currentRecord, 19)) {
                return;
            }
            let params = getParam(currentRecord);
            params.isearch = 'T';
            params.isgetdata = 'T';

            try {
            libCs.showLoadingDialog(true);
            let resCallData = JSON.parse(nlapiRequestURL(URL_RQ, params).getBody());
            let objData = resCallData.data;
            let objDataCol = resCallData.excelIdCols;
            let objDataConfig = JSON.parse(nlapiRequestURL(URL_RQ, {
                action: 'getUrlTemplate',
            }).getBody());

                exportExcel(objDataConfig, objDataCol, objData);
            } catch (error) {
                console.log("error", error)
                libCs.showLoadingDialog(false);
            }
            libCs.showLoadingDialog(false);
        }

        const exportExcel = async (objDataConfig, cols, data) => {
            let urlTemplate = objDataConfig.urlTemplate;
            let workbook = await comExcelHelper.loadWorkbookFromUrl(urlTemplate);
            let curSheet = workbook.worksheets[0];
            data.shift(); // Xoá dòng đầu tiên (dòng tiêu đề)
            await comExcelHelper.insertValueTable({
                curSheet,
                idxSourceRow: 6,
                idxRowData: 7,
                arrData : data,
                colId: cols,
            });

            // Loop through rows and merge cells based on a rule
            for (let i = 6; i < curSheet.rowCount; i++) {
                let currentRow = curSheet.getRow(i);
                let cellValue = currentRow.getCell(1).value; // Assuming we are checking the first column (A)
                if(String(cellValue).includes('Nhóm cấp')) {
                    curSheet.mergeCells(`A${i}:S${i}`);
                    currentRow.getCell(1).style = {
                        border : {
                            top: {style: 'thin'},
                            left: {style: 'thin'},
                            bottom: {style: 'thin'},
                            right: {style: 'thin'}
                        },
                        font: {bold: true, size: 13, name: 'Times New Roman'},
                        fill: {type: 'pattern', pattern: 'solid', fgColor: {argb: 'FFE8D6'}},
                        alignment: {vertical: 'middle'}
                    }
                    if(String(cellValue).includes('Nhóm cấp 2')){
                        currentRow.getCell(1).fill = {type: 'pattern', pattern: 'solid', fgColor: {argb: 'E2F5E0'}}
                    }
                }
            }

            await  comExcelHelper.saveWorkbook(workbook, 'Báo cáo so sánh tồn kho Min-Max.xlsx',)
        }

        const checkNull = (value) => value !== null && value !== undefined && value !== "";

        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            searchReport: searchReport,
            exportReport: exportReport
        };

    });
