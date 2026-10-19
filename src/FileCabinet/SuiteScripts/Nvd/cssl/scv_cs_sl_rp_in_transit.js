/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  28 May 2025         Khanh Tran			    Init, create file. Báo cáo hàng đi đường, form mr.Phúc(https://app.clickup.com/t/86cz2cxnu)
 */
/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */ 
define(['N/currentRecord', 'N/query', 'N/search',
    '../lib/scv_lib_cs_xls.js',

    '../cons/scv_cons_format.js',
    '../cons/scv_cons_record.js',

    '../cons/scv_cons_search_hdd_vendor_list.js',
],

function(currentRecord, query, search,
    libCsXLS,
    constFormat,
    constRecord,

    cSearchVendorList,
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
        if(fieldId == 'custpage_phan_loai_ncc'){
            setTimeout(() => {
                let phan_loai_ncc = curRec.getValue(fieldId);
                let myFilters = []; 
                if(phan_loai_ncc){
                    myFilters.push(
                        search.createFilter({name: 'custentity_scv_vendor_category', operator: 'anyof', values: phan_loai_ncc})
                    )
                }

                let arrResult  = cSearchVendorList.getDataSource(myFilters);
                constRecord.initLoadFieldClient(curRec.getField("custpage_ncc"), {
                    displayExpr: "name",
                    valueExpr: "vendor_id",
                    data: arrResult
                }, true);

            }, 0);
        }
    }

    const onSearchResult = async (isExport) =>{
        window.onbeforeunload = null;
        let curRec = currentRecord.get();
        let isValid = _scvForm.validateFieldMandatory([
            "custpage_subsidiary", "custpage_fromdt_dh", "custpage_todt_dh", "custpage_fromdt_nk", "custpage_todt_nk"
        ]);
        if(!isValid) return;

        _scvForm.showLoadingDialog(true);
        let params = _scvForm.getParameter();
        let objResErr = {isError: false, msg: []};
        let arrActionFunc = [
            {action: 'getDataPoQty', params: {...params}, data: []},
            {action: 'getDataIrQty', params: {...params}, data: []},
        ]

        libCsXLS.asyncPostMultiRequestFetchSSPageByAjax(_scvForm.serviceScript.url, arrActionFunc, async function (_res){
            arrActionFunc = _res;
            if(objResErr.isError){
                objResErr.msg.forEach(_msg => _scvForm.showMsgError(_msg));
            }
            else{
                result = syncDataResultMapped(curRec, arrActionFunc, params);
                _scvDx.setDataSource("custpage_sl_result", result);
                if(isExport == "T"){
                    await onExportExcel(curRec, result, params);
                }
            }

            _scvForm.showLoadingDialog(false);
            
        },function(_res, _paramsCallback){
            
        },function(request, status, error, _paramsCallback){
            objResErr.isError = true;
            objResErr.msg.push(`${_paramsCallback.action} (page ${_paramsCallback.page||0}): ` + (error.message||status))
        });
    }

    const syncDataResultMapped = (curRec, arrActionFunc, params) => {
        let result = [], arrSS1 = [], arrSS2 = [];
        arrActionFunc.forEach(obj => {
            if(obj.action == 'getDataPoQty'){
                arrSS1 = [...arrSS1, ...obj.data.arrResult]
            }
            else if(obj.action == 'getDataIrQty'){
                arrSS2 = [...arrSS2, ...obj.data.arrResult]
            }
        });

        arrSS1.forEach((objSS1, i) => {
            let objRes = {};
            let objSS2 = arrSS2.find(e => e.component_id == objSS1.item && e.po_id == objSS1.po_id && e.oriline_id == objSS1.oriline_id) || {
                qty_da_nhap_kho: 0
            };
            let dung_sai_am_pt = objSS1.dung_sai_am ? (objSS1.dung_sai_am.replace("%", "")) * 1 : 0;

            objRes.po_no = objSS1.po_no;
            objRes.date = objSS1.po_date;
            objRes.ma_hang = objSS1.ma_item;
            objRes.ten_hang = objSS1.item_display;
            objRes.dvt_goc = objSS1.dvt_co_so_display;
            objRes.qty_mua = objSS1.qty_po * 1;
            objRes.qty_da_nhap_kho = objSS2.qty_da_nhap_kho * 1;
            objRes.qty_con_lai_po = (objRes.qty_mua > objRes.qty_da_nhap_kho) ? objRes.qty_mua - objRes.qty_da_nhap_kho : 0;
            objRes.qty_hang_di_duong = (objRes.qty_con_lai_po > objSS1.qty_chenh_lech_cp*1) ? objRes.qty_con_lai_po : 0;
            objRes.dung_sai_am_cp = dung_sai_am_pt/100;
            objRes.qty_chenh_lech_cp = objSS1.qty_chenh_lech_cp * 1;
            objRes.ten_ncc = objSS1.ten_ncc;
            objRes.ma_ncc = objSS1.ma_ncc;
            objRes.ycmh_no = objSS1.pr_no;
            objRes.ngay_ycmh = objSS1.pr_date;

            if(params.custpage_skip_transit_zero === "T" && objRes.qty_hang_di_duong === 0){
                return;
            }

            result.push(objRes);
        })
        
        return result
    }

    const onExportExcel = async (curRec, result, params) => {
        let workbook = new ExcelJS.Workbook();
        let curSheet = workbook.addWorksheet('Sheet1');
        let idxRowData = 9;
        let columns = $("#custpage_sl_result").dxDataGrid("instance").option("columns");
        let objHeader = libCsXLS.renderHeaderExport(curSheet, 8, columns);
        
        let col_end = objHeader.col_end;
        let rowTitle = curSheet.getRow(4);

        let resultSQL = query.runSuiteQL({
			query: `SELECT name, BUILTIN.DF(mainaddress) as mainaddress_display
			FROM subsidiary
			where id = ${params.custpage_subsidiary}`
		});
		let objSub = resultSQL.asMappedResults()[0];

        let A1 = curSheet.getCell('A1');
        A1.value = objSub.name;
        A1.font = { name: 'Tahoma', size: 10, bold: true};

        let A2 = curSheet.getCell('A2');
        A2.value = objSub.mainaddress_display;
        A2.font = { name: 'Tahoma', size: 10, bold: true};

        curSheet.mergeCells('A4:'+ `${rowTitle.getCell(col_end).address}`);
        let A4 = curSheet.getCell('A4');
        A4.value = "BÁO CÁO HÀNG ĐI ĐƯỜNG";
        A4.font = { name: 'Tahoma', size: 14, bold: true};
        A4.alignment = { horizontal: 'center', vertical: 'middle' };

        let E5 = curSheet.getCell('E5');
        E5.value = `Đơn hàng từ ngày: ${params.custpage_fromdt_dh}`;
        E5.font = { name: 'Tahoma', size: 11, bold: true};
        E5.alignment = { horizontal: 'center', vertical: 'middle' };

        let J5 = curSheet.getCell('J5');
        J5.value = `Đơn hàng đến ngày: ${params.custpage_todt_dh}`;
        J5.font = { name: 'Tahoma', size: 11, bold: true};
        J5.alignment = { horizontal: 'center', vertical: 'middle' };

        let E6 = curSheet.getCell('E6');
        E6.value = `Nhập kho từ ngày: ${params.custpage_fromdt_nk}`;
        E6.font = { name: 'Tahoma', size: 11, bold: true};
        E6.alignment = { horizontal: 'center', vertical: 'middle' };

        let J6 = curSheet.getCell('J6');
        J6.value = `Nhập kho đến ngày: ${params.custpage_todt_nk}`;
        J6.font = { name: 'Tahoma', size: 11, bold: true};
        J6.alignment = { horizontal: 'center', vertical: 'middle' };

        for(let i = 0; i < result.length; i++){
            let objRes = result[i];
            let idxCurRow = i + idxRowData;
            let dataRow = objHeader.arrColHeader.map(obj => {
                return objRes[obj.dataField] || '';
            });

            curSheet.insertRow(idxCurRow, dataRow);
            objHeader.arrColNumFmt.forEach(e=>{
                curSheet.getCell(idxCurRow, e.idxCol).numFmt = e.numFmt;
            })

            libCsXLS.syncStyleRangeWithRowGrid(curSheet, {row: idxCurRow, col: 1}, {row: idxCurRow, col: col_end}, objRes);
        }

        libCsXLS.createBorderWithRange(curSheet, 
            {row: idxRowData, col: 1}, 
            {row: result.length + idxRowData - 1, col: col_end},
            "thin", {rowStyle: "dotted", colStyle: "thin"});
       
        
        await libCsXLS.saveWorkbook(workbook, "Báo cáo hàng đi đường.xlsx");
    }

    return {
        pageInit,
        fieldChanged,
        onSearchResult,
    };
    
});
