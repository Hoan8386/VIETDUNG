/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  30 May 2025         Khanh Tran			    Init, create file. Báo cáo tiến độ thực hiện mua hàng theo NCC, form mr.Hải(https://app.clickup.com/t/86cz3p99e)
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

function(currentRecord, query, search,
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
    }

    const onSearchResult = async (isExport) =>{
        window.onbeforeunload = null;
        let curRec = currentRecord.get();
        _scvForm.showLoadingDialog(true);
        let params = _scvForm.getParameter();
        let objResErr = {isError: false, msg: []};
        let arrActionFunc = [
            {action: 'getDataPr', params: {...params}, data: []},
            {action: 'getDataPo', params: {...params}, data: []},
            {action: 'getDataInb', params: {...params}, data: []},
            {action: 'getDataItr', params: {...params}, data: []},
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
        let result = [], arrSS1 = [], arrSS2 = [], arrSS3 = [], arrSS4 = [];
        arrActionFunc.forEach(obj => {
            if(obj.action == 'getDataPr'){
                arrSS1 = [...arrSS1, ...obj.data.arrResult]
            }
            else if(obj.action == 'getDataPo'){
                arrSS2 = [...arrSS2, ...obj.data.arrResult]
            }
            else if(obj.action == 'getDataInb'){
                arrSS3 = [...arrSS3, ...obj.data.arrResult]
            }
            else if(obj.action == 'getDataItr'){
                arrSS4 = [...arrSS4, ...obj.data.arrResult]
            }
        });
        
        let arrVendor = lbf.onGroupByArray(arrSS2, ['vendor_display', 'vendor_id']);
        arrVendor.forEach(obj => {
            let objLv1 = {
                pr_no: obj.vendor_display,
                idxRow: lbf.uuidv4(),
                rowPreparedData: {style: {fontWeight: "bold", backgroundColor: "#f9e79f"}}
            }
            result.push(objLv1);

            let arrSS2_ft = arrSS2.filter(e => e.vendor_id == obj.vendor_id);
            arrSS2_ft.forEach((objSS2, i) => {
                let objLv2 = {};
                let objSS1 = arrSS1.find( e => e.subsidiary == objSS2.subsidiary && e.item == objSS2.item && e.ori_lineid == objSS2.ori_lineid) || {
                    pr_no: "",
                    pr_date: "",
                };

                objLv2.so_don_hang = objSS2.po_no;
                objLv2.ngay_don_hang = objSS2.po_date;
                objLv2.upccode = objSS2.upccode;
                objLv2.item_display = objSS2.item_display;
                objLv2.mtcthh = objSS2.mtcthh;
                objLv2.unit = objSS2.unit;
                objLv2.qty_mua_hang = objSS2.qty_po * 1;
                objLv2.dung_sai_pos = objSS2.dung_sai_pos ? ((objSS2.dung_sai_pos.replace("%", "")) * 1)/100 : 0;
                objLv2.dung_sai_neg = objSS2.dung_sai_neg ? ((objSS2.dung_sai_neg.replace("%", "")) * 1)/100 : 0;
                objLv2.rate = objSS2.rate * 1;
                objLv2.amt = objSS2.amt * 1;
                objLv2.ngay_giao_hang = objSS2.ngay_giao_hang;

                objLv2.pr_no = objSS1.pr_no;
                objLv2.pr_date = objSS1.pr_date;

                let arrSS3_ft = arrSS3.filter(e => e.subsidiary == objSS2.subsidiary && e.item == objSS2.item && e.ori_lineid == objSS2.ori_lineid && e.vendor_id == objSS2.vendor_id);
                let tsgtt = 0, qty_mua_hang = objLv2.qty_mua_hang * 1;
                arrSS3_ft.forEach((objSS3, i) => {
                    let objLv3 = {
                        ...objLv2,
                        inb_no: objSS3.inb_no,
                        qty_inb: objSS3.qty_inb * 1,
                        ngay_hang_ve: objSS3.ngay_hang_ve
                    }

                    let arrSS4_ft = arrSS4.filter( e => e.subsidiary == objSS3.subsidiary && e.item == objSS3.item && 
                        e.ori_lineid == objSS3.ori_lineid && e.vendor_id == objSS3.vendor_id && e.itr_no == objSS3.itr_no
                    );
                    arrSS4_ft.forEach((objSS4, i) => {
                        let objRes = {
                            ...objLv3,
                            idxRow: lbf.uuidv4(),
                            idxRowParent: objLv1.idxRow,
                            itr_no: objSS4.itr_no,
                            qty_itr: objSS4.qty_itr * 1
                        }
                        
                        tsgtt += objRes.qty_itr;
                        objRes.tsgtt = tsgtt;
                        objRes.slclcg = qty_mua_hang - tsgtt;
                        objRes.dung_sai_thuc_te = qty_mua_hang ? (objRes.tsgtt/qty_mua_hang) : 0;
                        result.push(objRes);
                    })
                })
            })
        })
        
        return result
    }

    const onExportExcel = async (curRec, result, params) => {
        let workbook = new ExcelJS.Workbook();
        let curSheet = workbook.addWorksheet('Sheet1');
        let idxRowData = 6;
        let columns = $("#custpage_sl_result").dxTreeList("instance").option("columns");
        let objHeader = libCsXLS.renderHeaderExport(curSheet, 3, columns);
        let col_end = objHeader.col_end;
        let rowTitle = curSheet.getRow(1);

        curSheet.mergeCells('A1:'+ `${rowTitle.getCell(col_end).address}`);
        let A1 = curSheet.getCell('A1');
        A1.value = "Báo cáo tiến độ thực hiện mua hàng theo NCC";
        A1.font = { name: 'Tahoma', size: 14, bold: true};
        A1.alignment = { horizontal: 'center', vertical: 'middle' };

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
       
        
        await libCsXLS.saveWorkbook(workbook, "Báo cáo tiến độ thực hiện mua hàng theo NCC.xlsx");
    }

    return {
        pageInit,
        fieldChanged,
        onSearchResult,
    };
    
});
