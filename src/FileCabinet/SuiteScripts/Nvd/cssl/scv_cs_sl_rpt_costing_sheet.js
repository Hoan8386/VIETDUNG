/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  08 Aug 2025         Khanh Tran			    Init, create file. Báo cáo bảng tính giá thành, form mr.TMPhúc(https://app.clickup.com/t/86czxcy1f)
 */
/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */ 
define(['N/currentRecord', 'N/query', 'N/search',
    '../lib/scv_lib_function.js',
    '../lib/scv_lib_cs_xls.js',

    '../cons/scv_cons_format.js',
    '../cons/scv_cons_record.js',
],

function(crr, query, search,
    lbf,
    libCsXLS,

    constFormat,
    constRecord,
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
        let curRec = scriptContext.currentRecord;

        initLoadFieldLocation(curRec);
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
        let fieldId = scriptContext.fieldId;

        if(fieldId == 'custpage_subsidiary'){
            initLoadFieldLocation(curRec);
        }
    }

    const onSearchResult = async (isExport, byCode) => {
        window.onbeforeunload = null;
        
        if(!_scvForm.validateFieldMandatory([
            'custpage_subsidiary', 'custpage_fromdt', 'custpage_todt'
        ])) return;

        let arrLineSelected = [];

        if(isExport == "T"){
            // if (byCode == "T") {
            //     arrLineSelected = _scvDx.getDataSource('custpage_grid_result').filter(e => e.checked).map(e => JSON.parse(e.jsondata));
            // } else {
            //     arrLineSelected = _scvDx.getDataSource('custpage_grid_result').map(e => JSON.parse(e.jsondata));
            // }

            arrLineSelected = _scvDx.getDataSource('custpage_grid_result').filter(e => e.checked).map(e => JSON.parse(e.jsondata));

            if(arrLineSelected.length == 0){
                _scvForm.showMsgError("Vui lòng chọn ít nhất 1 dòng để xuất dữ liệu!");
                return;
            }
        }
        
        _scvForm.showLoadingDialog(true);
        
        let params = _scvForm.getParameter();

        delete params.custpage_subsidiary_display;
        delete params.custpage_location_display;
        delete params.custpage_nvl_display;
        delete params.custpage_pdsp_display;

        let arrActionFunc = isExport ? [
            {action: 'getDataSS02_DetailCost', params: {...params}, data: []},
            {action: 'getDataSS03_BomByWoCost', params: {...params}, data: []},
            {action: 'getDataSS04_BomRevCost', params: {...params}, data: []},
        ] : [
            {action: 'getDataSS01_SummaryCost', params: {...params}, data: []},
            {action: 'getDataSS04_BomRevCost', params: {...params}, data: []},
        ]

        _scvForm.ajax.postAsyncMultiFetchSSPage(_scvForm.serviceScript.url, arrActionFunc, async function (_res){
            let arrSS1 = [], arrSS2 = [], arrSS3 = [], arrSS4 = [];

            _res.forEach(obj => {
                if(obj.action == 'getDataSS01_SummaryCost'){
                    arrSS1 = [...arrSS1, ...obj.data.arrResult]
                }
                else if(obj.action == 'getDataSS02_DetailCost'){
                    arrSS2 = [...arrSS2, ...obj.data.arrResult]
                }
                else if(obj.action == 'getDataSS03_BomByWoCost'){
                    arrSS3 = [...arrSS3, ...obj.data.arrResult]
                }
                else if(obj.action == 'getDataSS04_BomRevCost'){
                    arrSS4 = [...arrSS4, ...obj.data.arrResult]
                }
            });

            if(isExport == "T"){
                let objResult = syncDataExport(arrLineSelected, arrSS2, arrSS3, arrSS4);
                let { arrCosting, arrCostingByCode } = objResult;

                if (byCode == "T") await onExportCostingSheetByCode(arrCostingByCode);
                else await onExportCosting(arrCosting);
            }else{
                let results = syncDataSearch(arrSS1);
                _scvDx.setDataSource('custpage_grid_result', results);
            }

            _scvForm.showLoadingDialog(false);
        });
    }

    const syncDataExport = (arrLineSelected, arrSS2, arrSS3, arrSS4) => {
        let arrCosting = [], arrCostingByCode = [];
        let objTtl = {
            rowPreparedData: {style: {fontWeight: "bold", backgroundColor: "#fafad2"}},
            item_display: 'Tổng cộng:'
        }
        let arrKeyPlus = [
            'tieuhao1dvsp_dinh_muc', 'tieuhao1dvsp_thuc_te',
            'tongtieuhao_dinh_muc', 'tongtieuhao_thuc_te', 'tongtieuhao_chenh_lech',
            'tonggiathanh_dinh_muc', 'tonggiathanh_thuc_te',
            'tang_giam_so_ke_hoach',
            'giathanh1dvsp_dinh_muc', 'giathanh1dvsp_thuc_te', 'giathanh1dvsp_chenh_lech'
        ];

        arrLineSelected.forEach( objLine => {
            let arrSS2_ft = arrSS2.filter( e => e.assembly_id == objLine.assembly );
            if(!arrSS2_ft.length) return;

            let grpItemType = [], arrMapping = [], arrData = [];
            let objTtlGrp = {
                rowPreparedData: {style: {fontWeight: "bold", backgroundColor: "#fafad2"}},
                item_display: 'Tổng cộng',
                thanh_pham: objLine.assembly_name,
                lv: 1,
            }
            let ss1_ttl_qty = objLine.ttl_qty * 1;

            arrSS2_ft.forEach(objSS2 => {
                if(!grpItemType.includes(objSS2.item_type)) grpItemType.push(objSS2.item_type);
                
                let original_item_qty_bom = 0;
                let objSS3 = arrSS3.find( e => e.key_mapping == objSS2.key_mapping );
                if (objSS3) {
                    original_item_qty_bom = objSS3.original_item_qty_bom*1;
                } else {
                    let objSS4 = arrSS4.find( e => e.key_mapping == objSS2.key_mapping );
                    if (objSS4) original_item_qty_bom = objSS4.original_item_qty_bom*1;
                }

                let objMapping = {
                    lv: 3,
                    item_type: objSS2.item_type,
                    item_display: objSS2.item_name,
                    unit_display: objSS2.unit_display,
                    item_code: objSS2.item_code,
                    qty_thanh_pham: ss1_ttl_qty,
                    item_old_code: objSS2.item_old_code?.replace("- None -", ""),
                    do_day_tam: objLine.do_day_tam*1,
                    do_day_nhom: objLine.do_day_nhom*1,
                    chieu_rong: objLine.chieu_rong*1,
                    chieu_dai: objLine.chieu_dai*1,
                    assembly_old_code: objLine.assembly_old_code,
                    thanh_pham: objLine.assembly_name,
                    assembly_name: objLine.assembly_name,
                    assembly_code: objLine.item_code,
                }

                objMapping.tieuhao1dvsp_dinh_muc = original_item_qty_bom;
                objMapping.tieuhao1dvsp_thuc_te = ss1_ttl_qty ? objSS2.ttl_qty/ss1_ttl_qty : 0;

                objMapping.tongtieuhao_dinh_muc = original_item_qty_bom * ss1_ttl_qty;
                objMapping.tongtieuhao_thuc_te = objSS2.ttl_qty * 1;
                objMapping.tongtieuhao_chenh_lech = objMapping.tongtieuhao_thuc_te - objMapping.tongtieuhao_dinh_muc;
                
                objMapping.tonggiathanh_dinh_muc = objMapping.tongtieuhao_dinh_muc * objSS2.unit_cost*1;
                objMapping.tonggiathanh_thuc_te = objSS2.ttl_amt * 1;

                objMapping.tang_giam_so_ke_hoach = objMapping.tonggiathanh_thuc_te - objMapping.tonggiathanh_dinh_muc;
                
                objMapping.giathanh1dvsp_dinh_muc = ss1_ttl_qty ? objMapping.tonggiathanh_dinh_muc/ss1_ttl_qty : 0;
                objMapping.giathanh1dvsp_thuc_te = ss1_ttl_qty ? objMapping.tonggiathanh_thuc_te/ss1_ttl_qty : 0;
                objMapping.giathanh1dvsp_chenh_lech = objMapping.giathanh1dvsp_thuc_te - objMapping.giathanh1dvsp_dinh_muc;
                
                arrMapping.push(objMapping);
            })

            grpItemType.sort((a, b) => (a || '').localeCompare(b || ''));
            grpItemType.forEach( itemType => {
                let objGrp = {
                    rowPreparedData: {style: {fontWeight: "bold", backgroundColor: "#fdf5e6"}},
                    item_display: itemType,
                    thanh_pham: objLine.assembly_name,
                    lv: 2,
                    qty_thanh_pham: ss1_ttl_qty
                }

                let arrMapping_ft = arrMapping.filter( e => e.item_type == itemType);

                arrCosting.push(objGrp);
                arrMapping_ft.forEach( objRes => {
                    arrKeyPlus.forEach(key => {
                        if(!(key in objTtl)) objTtl[key] = 0;
                        if(!(key in objTtlGrp)) objTtlGrp[key] = 0;
                        if(!(key in objGrp)) objGrp[key] = 0;

                        let val = (objRes[key] || 0)  * 1
                        
                        objTtl[key] += val;
                        objTtlGrp[key] += val;
                        objGrp[key] += val;
                    })

                    arrCosting.push(objRes);
                })

                arrData.push(objGrp, ...arrMapping_ft)
            })

            arrCostingByCode.push({
                assembly_display: objLine.assembly_display,
                unit_display: objLine.unit_display,
                ttl_qty: ss1_ttl_qty,
                data: [...arrData, objTtlGrp]
            })
        })
        
        arrCosting.push(objTtl)

        return {
            arrCosting, arrCostingByCode
        }
    }

    const getObjTableQueryByID = (_table, _arrColumns, _id) => {
        if (_arrColumns.length === 0) _arrColumns.push("id")
        let resultSearch = query.runSuiteQL({
            query: `SELECT ` + _arrColumns.join(",") + ` 
            FROM ` + _table + `
            WHERE id = ` + _id
        });

        resultSearch = resultSearch.asMappedResults();
        return resultSearch.length > 0 ? resultSearch[0] : {};
    }

    const onExportCosting = async (results) => {
        let curRec = crr.get();
        let workbook = new ExcelJS.Workbook();
        let curSheet = workbook.addWorksheet('Sheet1');

        curSheet.pageSetup = {
            paperSize: 9,
            orientation: 'landscape',
            fitToPage: true,
            fitToWidth: 1,
            fitToHeight: 0,
            horizontalCentered: true,
            margins: {
                left: 0,
                right: 0,
                top: 0.59,
                bottom: 0.59,
                header: 0,
                footer: 0
            }
        };


        let toDate = curRec.getValue('custpage_todt');
        let subsidiaryId = curRec.getValue('custpage_subsidiary');
        let objSubsidiary = getObjTableQueryByID('subsidiary', ['BUILTIN.DF(mainaddress) as mainaddress_text', 'legalname'], subsidiaryId);
        
        let col_end = 24;
        let styleTemplate  = {
            font: { name: 'Times New Roman', size: 9 },
            alignment: { horizontal: 'left', vertical: 'middle' }
        }

        let arrTwoDecimal = [
            { idxCol: 3, numFmt: '#,##0' },
            { idxCol: 8, numFmt: '#,##0.00' },
            { idxCol: 9, numFmt: '#,##0.00' },
            { idxCol: 10, numFmt: '#,##0.00' },
            { idxCol: 11, numFmt: '#,##0.00' },
            { idxCol: 12, numFmt: '#,##0.00' },
            { idxCol: 13, numFmt: '#,##0.00' },
            { idxCol: 14, numFmt: '#,##0.00' },
            { idxCol: 15, numFmt: '#,##0.00' },
            { idxCol: 16, numFmt: '#,##0.00' },
            { idxCol: 17, numFmt: '#,##0.00' },
            { idxCol: 18, numFmt: '#,##0.00' },
            { idxCol: 19, numFmt: '#,##0.00' },
            { idxCol: 20, numFmt: '#,##0.00' },
            { idxCol: 21, numFmt: '#,##0.00' },
            { idxCol: 22, numFmt: '#,##0.00' },
        ]

        Object.assign(curSheet.getCell(`A1`), {
            value: `${objSubsidiary.legalname}`,
            font: { ...styleTemplate.font, bold: true },
            alignment: styleTemplate.alignment
        });

        Object.assign(curSheet.getCell(`A2`), {
            value: `${objSubsidiary.mainaddress_text}`,
            font: { ...styleTemplate.font, bold: true },
            alignment: styleTemplate.alignment
        });

        libCsXLS.mergeCell(curSheet, 3, 1, 3, col_end);
        Object.assign(curSheet.getCell(`A3`), {
            value: `BẢNG TÍNH GIÁ THÀNH`,
            font: { ...styleTemplate.font, bold: true, size: 14 },
            alignment: {...styleTemplate.alignment,  horizontal: 'center' }
        });

        libCsXLS.mergeCell(curSheet, 4, 1, 4, col_end);
        Object.assign(curSheet.getCell(`A4`), {
            value: `Tháng ${toDate.getMonth() + 1} năm ${toDate.getFullYear()}`,
            font: { ...styleTemplate.font, bold: true, size: 10, italic: true  },
            alignment: {...styleTemplate.alignment,  horizontal: 'center' }
        });
        
        let objHeader = libCsXLS.renderHeaderExport(curSheet, 6, [
            { 
                caption: 'Mã cũ (Thành phẩm)', dataField: 'assembly_old_code', dataType: 'string', width: 150
            },
            { 
                caption: 'Thành phẩm', dataField: 'thanh_pham', dataType: 'string', width: 400
            },
            { 
                caption: 'Số lượng thành phẩm', dataField: 'qty_thanh_pham', dataType: 'number', format: '#,##0', width: 100
            },
            { 
                caption: 'Mã cũ (NVL/Chi phí)', dataField: 'item_old_code', dataType: 'string', width: 250
            },
            { 
                caption: 'Mã nguyên vật liệu/chi phí', dataField: 'item_code', dataType: 'string', width: 250
            },
            { 
                caption: 'Tên nguyên vật liệu/chi phí', dataField: 'item_display', dataType: 'string', width: 400
            },
            { 
                caption: 'Đvt', dataField: 'unit_display', dataType: 'string', width: 50, 
            },
            { 
                caption: 'Tiêu hao 1 đơn vị SP', columns: [
                    {dataField: 'tieuhao1dvsp_dinh_muc', caption: 'Định mức', dataType: 'number', format: '#,##0', width: 100},
                    {dataField: 'tieuhao1dvsp_thuc_te', caption: 'Thực tế', dataType: 'number', format: '#,##0.00', width: 100}, 
                ]
            },
            { 
                caption: 'Tổng tiêu hao', columns: [
                    {dataField: 'tongtieuhao_dinh_muc', caption: 'Định mức', dataType: 'number', format: '#,##0', width: 130},
                    {dataField: 'tongtieuhao_thuc_te', caption: 'Thực tế', dataType: 'number', format: '#,##0', width: 130}, 
                    {dataField: 'tongtieuhao_chenh_lech', caption: 'Chênh lệch', dataType: 'number', format: '#,##0.00', width: 130}, 
                ]
            },
            { 
                caption: 'Tổng giá thành', columns: [
                    {dataField: 'tonggiathanh_dinh_muc', caption: 'Định mức', dataType: 'number', format: '#,##0', width: 110},
                    {dataField: 'tonggiathanh_thuc_te', caption: 'Thực tế', dataType: 'number', format: '#,##0', width: 110}, 
                ]
            },
            { 
                caption: 'Tăng giảm so với kế hoạch', dataField: 'tang_giam_so_ke_hoach', dataType: 'number', format: '#,##0.00', width: 110, 
            }, 
            { 
                caption: 'Giá thành 1 đơn vị SP', columns: [
                    {dataField: 'giathanh1dvsp_dinh_muc', caption: 'Định mức', dataType: 'number', format: '#,##0', width: 120},
                    {dataField: 'giathanh1dvsp_thuc_te', caption: 'Thực tế', dataType: 'number', format: '#,##0.00', width: 130}, 
                    {dataField: 'giathanh1dvsp_chenh_lech', caption: 'Chênh lệch', dataType: 'number', format: '#,##0.00', width: 130}, 
                ]
            },
            {
                caption: 'Độ dày tấm', dataField: 'do_day_tam', dataType: 'number', format: '#,##0', width: 100
            },
            {
                caption: 'Độ dày nhôm', dataField: 'do_day_nhom', dataType: 'number', format: '#,##0', width: 100
            },
            {
                caption: 'Chiều rộng', dataField: 'chieu_rong', dataType: 'number', format: '#,##0', width: 100
            },
            {
                caption: 'Chiều dài', dataField: 'chieu_dai', dataType: 'number', format: '#,##0', width: 100
            },
            {
                caption: 'Mã thành phẩm', dataField: 'assembly_code', dataType: 'string', width: 250
            },
            {
                caption: 'Tên thành phẩm', dataField: 'assembly_name', dataType: 'string', width: 400
            },
        ], {
            font: { ...styleTemplate.font, bold: true },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'fffff0' } }
        });
        
        libCsXLS.renderHeaderExport(curSheet, 8, [
            { caption: '', dataField: '', dataType: 'string', width: 250},
            { caption: '', dataField: 'col_a', dataType: 'string', width: 400},
            { caption: '', dataField: 'col_b', dataType: 'string', width: 150},
            { caption: '', dataField: 'col_c', dataType: 'string', width: 250},
            { caption: '', dataField: 'col_c2', dataType: 'string', width: 250},
            { caption: '', dataField: 'col_d', dataType: 'string', width: 400},
            { caption: '', dataField: 'col_e', dataType: 'string', width: 50},
            { caption: '1', dataField: 'col_f', dataType: 'string', width: 100},
            { caption: '2', dataField: 'col_f', dataType: 'string', width: 100},
            { caption: '3=SL*1', dataField: 'col_h', dataType: 'string', width: 130},
            { caption: '4=SL*2', dataField: 'col_i', dataType: 'string', width: 130},
            { caption: '5=4-3', dataField: 'col_j', dataType: 'string', width: 130},
            { caption: '6', dataField: 'col_k', dataType: 'string', width: 110},
            { caption: '7', dataField: 'col_l', dataType: 'string', width: 110},
            { caption: '8=7-6', dataField: 'col_m', dataType: 'string', width: 110},
            { caption: '9=6/SL', dataField: 'col_n', dataType: 'string', width: 120},
            { caption: '10=7/SL', dataField: 'col_o', dataType: 'string', width: 130},
            { caption: '11=10-9', dataField: 'col_p', dataType: 'string', width: 130},
            { caption: '', dataField: 'col_q', dataType: 'string', width: 100},
            { caption: '', dataField: 'col_r', dataType: 'string', width: 100},
            { caption: '', dataField: 'col_s', dataType: 'string', width: 100},
            { caption: '', dataField: 'col_7', dataType: 'string', width: 100},
            { caption: '', dataField: '', dataType: 'string', width: 250},
            { caption: '', dataField: '', dataType: 'string', width: 400},
        ], {
            font: { ...styleTemplate.font, bold: true },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'fffff0' } }
        })

        curSheet.getRow(6).height = 23;
        curSheet.getRow(7).height = 23;
        curSheet.getRow(8).height = 19;
        
        let idxRowData = 9;
        for(let i = 0; i < results.length; i++){
            let objRes = results[i];
            let rowIndex = i + idxRowData;
            let arrColNumFmt = objRes.lv === 3 ? objHeader.arrColNumFmt : arrTwoDecimal;
            let dataRow = objHeader.arrColHeader.map(obj => {
                return objRes[obj.dataField];
            });

            curSheet.insertRow(rowIndex , dataRow);
            arrColNumFmt.forEach( e => {
                curSheet.getCell(rowIndex, e.idxCol).numFmt = e.numFmt;
            })

            libCsXLS.syncStyleRangeWithRowGrid(curSheet, {row: rowIndex , col: 1}, {row: rowIndex , col: col_end}, objRes);
        }

        libCsXLS.createBorderWithRange(curSheet, 
            {row: idxRowData, col: 1}, 
            {row: results.length + idxRowData - 1, col: col_end},
            "thin", {rowStyle: "dotted", colStyle: "thin"}
        );

        libCsXLS.createFontsWithRange(curSheet, 
            {row: idxRowData, col: 1}, 
            {row: results.length + idxRowData - 1, col: col_end},
            styleTemplate.font
        );

        await libCsXLS.saveWorkbook(workbook, "Bảnh tính giá thành.xlsx");
    }
    
    const onExportCostingSheetByCode = async (resultsGrp) => {
        let curRec = crr.get();
        let workbook = new ExcelJS.Workbook();
        let curSheet = workbook.addWorksheet('Sheet1');
        
        curSheet.pageSetup = {
            paperSize: 9,
            orientation: 'landscape',
            fitToPage: true,
            fitToWidth: 1,
            fitToHeight: 0,
            horizontalCentered: true,
            margins: {
                left: 0,
                right: 0,
                top: 0.59,
                bottom: 0.59,
                header: 0,
                footer: 0
            }
        };

        let toDate = curRec.getValue('custpage_todt');
        let subsidiaryId = curRec.getValue('custpage_subsidiary');
        let objSubsidiary = getObjTableQueryByID('subsidiary', ['BUILTIN.DF(mainaddress) as mainaddress_text', 'legalname'], subsidiaryId);

        let columns = getColumsExport();
        let col_end = 12;
        let idxCurRow = 0;
        let styleTemplate  = {
            font: { name: 'Times New Roman', size: 9 },
            alignment: { horizontal: 'left', vertical: 'middle' }
        }

        let arrTwoDecimal = [
            { idxCol: 3, numFmt: '#,##0.00' },
            { idxCol: 4, numFmt: '#,##0.00' },
            { idxCol: 5, numFmt: '#,##0.00' },
            { idxCol: 6, numFmt: '#,##0.00' },
            { idxCol: 7, numFmt: '#,##0.00' },
            { idxCol: 8, numFmt: '#,##0.00' },
            { idxCol: 9, numFmt: '#,##0.00' },
            { idxCol: 10, numFmt: '#,##0.00' },
            { idxCol: 11, numFmt: '#,##0.00' },
            { idxCol: 12, numFmt: '#,##0.00' }
        ]

        resultsGrp.forEach( (objGrp) => {
            let arrDataGrpItemType = objGrp.data;
            
            idxCurRow += 1;
            Object.assign(curSheet.getCell(`A${idxCurRow}`), {
                value: `${objSubsidiary.legalname}`,
                font: { ...styleTemplate.font, bold: true },
                alignment: styleTemplate.alignment
            });

            idxCurRow += 1;
            Object.assign(curSheet.getCell(`A${idxCurRow}`), {
                value: `${objSubsidiary.mainaddress_text}`,
                font: { ...styleTemplate.font, bold: true },
                alignment: styleTemplate.alignment
            });

            idxCurRow += 1;
            libCsXLS.mergeCell(curSheet, idxCurRow, 1, idxCurRow, col_end);
            Object.assign(curSheet.getCell(`A${idxCurRow}`), {
                value: `BẢNG TÍNH GIÁ THÀNH`,
                font: { ...styleTemplate.font, bold: true, size: 14 },
                alignment: {...styleTemplate.alignment,  horizontal: 'center' }
            });

            idxCurRow += 1;
            libCsXLS.mergeCell(curSheet, idxCurRow, 1, idxCurRow, col_end);
            Object.assign(curSheet.getCell(`A${idxCurRow}`), {
                value: `Tháng ${toDate.getMonth() + 1} năm ${toDate.getFullYear()}`,
                font: { ...styleTemplate.font, bold: true, size: 10, italic: true  },
                alignment: {...styleTemplate.alignment,  horizontal: 'center' }
            });

            idxCurRow += 1;
            libCsXLS.mergeCell(curSheet, idxCurRow, 1, idxCurRow, col_end);
            Object.assign(curSheet.getCell(`A${idxCurRow}`), {
                value: `Sản phẩm: ${objGrp.assembly_display}`,
                font: { ...styleTemplate.font, bold: true, size: 10 },
                alignment: {...styleTemplate.alignment,  horizontal: 'center' }
            });

            idxCurRow += 1;
            libCsXLS.mergeCell(curSheet, idxCurRow, 1, idxCurRow, col_end);
            Object.assign(curSheet.getCell(`A${idxCurRow}`), {
                value: `Số lượng: ${objGrp.ttl_qty} ${objGrp.unit_display}`,
                font: { ...styleTemplate.font, bold: true, size: 10 },
                alignment: {...styleTemplate.alignment,  horizontal: 'center' }
            });

            idxCurRow += 2;
            let objHeader = libCsXLS.renderHeaderExport(curSheet, idxCurRow, columns, {
                font: { name: 'Times New Roman', bold: true, size: 9 },
                fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'fffff0' } }
            });
            
            idxCurRow += 2;
            libCsXLS.renderHeaderExport(curSheet, idxCurRow, [
                { caption: 'A', dataField: 'col_a', dataType: 'string', width: 277},
                { caption: 'B', dataField: 'col_b', dataType: 'string', width: 50},
                { caption: '1', dataField: 'col_1', dataType: 'string', width: 96},
                { caption: '2', dataField: 'col_2', dataType: 'string', width: 96},
                { caption: '3=SL*1', dataField: 'col_3', dataType: 'string', width: 130},
                { caption: '4=SL*2', dataField: 'col_4', dataType: 'string', width: 130},
                { caption: '5=4-3', dataField: 'col_5', dataType: 'string', width: 130},
                { caption: '6', dataField: 'col_6', dataType: 'string', width: 110},
                { caption: '7', dataField: 'col_7', dataType: 'string', width: 110},
                { caption: '8=7-6', dataField: 'col_8', dataType: 'string', width: 110},
                { caption: '9=6/SL', dataField: 'col_9', dataType: 'string', width: 120},
                { caption: '10=7/SL', dataField: 'col_10', dataType: 'string', width: 130},
            ], {
                font: { name: 'Times New Roman', bold: true, size: 9 },
                fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'fffff0' } }
            })

            curSheet.getRow(idxCurRow -2).height = 23;
            curSheet.getRow(idxCurRow - 1).height = 23;
            curSheet.getRow(idxCurRow).height = 19;

            idxCurRow += 1;
            let idxRowData = idxCurRow;
            for(let i = 0; i < arrDataGrpItemType.length; i++){
                let objRes = arrDataGrpItemType[i];
                let rowIndex = i + idxRowData;
                let dataRow = objHeader.arrColHeader.map(obj => {
                    return objRes[obj.dataField];
                });
                let arrColNumFmt = objRes.lv === 3 ? objHeader.arrColNumFmt : arrTwoDecimal;

                curSheet.insertRow(rowIndex , dataRow);
                arrColNumFmt.forEach( e => {
                    curSheet.getCell(rowIndex, e.idxCol).numFmt = e.numFmt;
                })

                libCsXLS.syncStyleRangeWithRowGrid(curSheet, {row: rowIndex , col: 1}, {row: rowIndex , col: col_end}, objRes);
            }

            libCsXLS.createBorderWithRange(curSheet, 
                {row: idxRowData, col: 1}, 
                {row: arrDataGrpItemType.length + idxRowData - 1, col: col_end},
                "thin", {rowStyle: "dotted", colStyle: "thin"}
            );

            libCsXLS.createFontsWithRange(curSheet, 
                {row: idxRowData, col: 1}, 
                {row: arrDataGrpItemType.length + idxRowData - 1, col: col_end},
                styleTemplate.font
            );

            idxCurRow = idxRowData + arrDataGrpItemType.length;
            curSheet.getRow(idxCurRow).addPageBreak();   
        })

        await libCsXLS.saveWorkbook(workbook, "Bảnh tính giá thành (theo mã).xlsx");
    }

    const getColumsExport = () => {
        return [
            { 
                caption: 'Khoản mục', dataField: 'item_display', dataType: 'string', width: 277
            },
            { 
                caption: 'Đvt', dataField: 'unit_display', dataType: 'string', width: 50, 
            },
            { 
                caption: 'Tiêu hao 1 đơn vị SP', columns: [
                    {dataField: 'tieuhao1dvsp_dinh_muc', caption: 'Định mức', dataType: 'number', format: '#,##0', width: 96},
                    {dataField: 'tieuhao1dvsp_thuc_te', caption: 'Thực tế', dataType: 'number', format: '#,##0.00', width: 96}, 
                ]
            },
            { 
                caption: 'Tổng tiêu hao', columns: [
                    {dataField: 'tongtieuhao_dinh_muc', caption: 'Định mức', dataType: 'number', format: '#,##0', width: 130},
                    {dataField: 'tongtieuhao_thuc_te', caption: 'Thực tế', dataType: 'number', format: '#,##0', width: 130}, 
                    {dataField: 'tongtieuhao_chenh_lech', caption: 'Chênh lệch', dataType: 'number', format: '#,##0.00', width: 130}, 
                ]
            },
            { 
                caption: 'Tổng giá thành', columns: [
                    {dataField: 'tonggiathanh_dinh_muc', caption: 'Định mức', dataType: 'number', format: '#,##0', width: 110},
                    {dataField: 'tonggiathanh_thuc_te', caption: 'Thực tế', dataType: 'number', format: '#,##0', width: 110}, 
                ]
            },
            { 
                caption: 'Tăng giảm so với kế hoạch', dataField: 'tang_giam_so_ke_hoach', dataType: 'number', format: '#,##0.00', width: 110, 
            }, 
            { 
                caption: 'Giá thành 1 đơn vị SP', columns: [
                    {dataField: 'giathanh1dvsp_dinh_muc', caption: 'Định mức', dataType: 'number', format: '#,##0', width: 120},
                    {dataField: 'giathanh1dvsp_thuc_te', caption: 'Thực tế', dataType: 'number', format: '#,##0.00', width: 130}, 
                ]
            },
        ]
    }

    const syncDataSearch = (arrSS1) => {
        let results = [];

        arrSS1.forEach(objSS1 => {
            let objRes = {
                item_code: objSS1.item_code,
                item_display: objSS1.item_display,
                unit_display: objSS1.unit_display,
                ttl_qty: objSS1.ttl_qty,
                cost_per_qty: objSS1.cost_per_qty,
                ttl_amt: objSS1.ttl_amt,
                jsondata: JSON.stringify(objSS1),
            }

            results.push(objRes)
        })

        return results;
    }

    const initLoadFieldLocation = (curRec) => {
        let subsidiaryId = curRec.getValue('custpage_subsidiary');
        let arrData = [];

        if(subsidiaryId){
            arrData = getLocationBySubId(subsidiaryId);
        }

        constRecord.initLoadFieldClient(curRec.getField('custpage_location'), {
            data: arrData,
            valueExpr: 'id',
            displayExpr: 'name',
        }, true);

        constRecord.initQuickFindFieldSelect(curRec, 'custpage_location', {
            data: arrData,
            valueExpr: 'id',
            displayExpr: 'name',
            reInsertOption: false
        }, false);
    }

    const getLocationBySubId = (subsidiaryId) => {
        let sql = `
            SELECT location.id, location.name, location.makeinventoryavailable, LocationSubsidiaryMap.subsidiary
            FROM location
            JOIN LocationSubsidiaryMap 
            ON location.id = LocationSubsidiaryMap.location
            WHERE isinactive = 'F' AND
                location.makeinventoryavailable = 'T' AND
                LocationSubsidiaryMap.subsidiary = (${subsidiaryId})
        `;

        let resultSearch = query.runSuiteQL({query: sql});
        let arrData = resultSearch.asMappedResults();
        return arrData;
    }

    return {
        pageInit,
        fieldChanged,
        onSearchResult,
    };
    
});
