/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  25 Aug 2025         Khanh Tran			    Init, create file. Báo cáo tiêu hao sản xuất, form ms.Kỳ(https://app.clickup.com/t/86d02hr1u)
 */
/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */ 
define(['N/currentRecord', 'N/query', 'N/search',
    '../lib/scv_lib_function.js',
    
    '../cons/scv_cons_record.js',
    '../cons/scv_cons_entitygroup.js',
],


function(crr, query, search,
    lbf,
    
    constRecord,
    constEntityGroup,
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

    const reportType = {
        TYPE_1: 'type1',
        TYPE_2: 'type2',
    };

    const AssemblyClass = {
        ACP: "ACP",
        AC: "AC ",
    }

    function pageInit(scriptContext) {
        let curRec = scriptContext.currentRecord;

        setTimeout(() => initLoadFieldLocation(curRec), 0);

        setTimeout(() => initLoadFieldWorkCenter(curRec), 0);

        constRecord.pageInitQuickFindFieldSelect(curRec, ["custpage_grp_lv1"]);
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
            setTimeout(() => initLoadFieldLocation(curRec), 0);

            setTimeout(() => initLoadFieldWorkCenter(curRec), 0);

        } else if(fieldId == 'custpage_grp_lv1'){
            initFieldGroupLevel02(curRec);
        }
    }

    const onSearchResult = async (isExport) => {
        window.onbeforeunload = null;
        
        if(!_scvForm.validateFieldMandatory([
            'custpage_subsidiary', 'custpage_fromdt', 'custpage_todt'
        ])) return;
        
        _scvForm.showLoadingDialog(true);

        let params = _scvForm.getParameter();

        delete params.custpage_subsidiary_display;
        delete params.custpage_location_display;
        delete params.custpage_grp_lv1_display;
        delete params.custpage_grp_lv2_display;
        delete params.custpage_work_center_display;

        let arrActionFunc = [
            {action: 'getDataSS01_BomByWoConsRpt', params: {...params}, data: []},
            {action: 'getDataSS02_ConsAbCostRpt', params: {...params}, data: []},
            {action: 'getDataSS03_ConsAbSumRpt', params: {...params}, data: []},
            {action: 'getDataSS05_TotalScrapByItemRpt', params: {...params}, data: []},
            {action: 'getDataSS07_ConsIaCostRpt', params: {...params}, data: []},
        ]

        if (params.custpage_report_type == reportType.TYPE_2) {
            arrActionFunc = [
                {action: 'getDataSS01_BomByWoConsRpt', params: {...params}, data: []},
                {action: 'getDataSS04_ConsAbNhuaCostRpt', params: {...params}, data: []},
                {action: 'getDataSS05_TotalScrapByItemRpt', params: {...params}, data: []},
                {action: 'getDataSS06_ConsAbNhuaSumRpt', params: {...params}, data: []},
                {action: 'getDataSS07_ConsIaCostRpt', params: {...params}, data: []},
            ]
        }

        _scvForm.ajax.postAsyncMultiFetchSSPage(_scvForm.serviceScript.url, arrActionFunc, async function (_res){
            let arrSS1 = [], arrSS2 = [], arrSS3 = [], arrSS4 = [], arrSS5 = [], arrSS6 = [], arrSS7 = [], results = [];

            _res.forEach(obj => {
                if(obj.action == 'getDataSS01_BomByWoConsRpt'){
                    arrSS1 = [...arrSS1, ...obj.data.arrResult]
                }
                else if(obj.action == 'getDataSS02_ConsAbCostRpt'){
                    arrSS2 = [...arrSS2, ...obj.data.arrResult]
                }
                else if(obj.action == 'getDataSS03_ConsAbSumRpt'){
                    arrSS3 = [...arrSS3, ...obj.data.arrResult]
                }
                else if(obj.action == 'getDataSS04_ConsAbNhuaCostRpt'){
                    arrSS4 = [...arrSS4, ...obj.data.arrResult]
                }
                else if(obj.action == 'getDataSS05_TotalScrapByItemRpt'){
                    arrSS5 = [...arrSS5, ...obj.data.arrResult]
                }
                else if(obj.action == 'getDataSS06_ConsAbNhuaSumRpt'){
                    arrSS6 = [...arrSS6, ...obj.data.arrResult]
                }
                else if(obj.action == 'getDataSS07_ConsIaCostRpt'){
                    arrSS7 = [...arrSS7, ...obj.data.arrResult]
                }
            });
            
            if (params.custpage_report_type == reportType.TYPE_1) {
                results = syncDataResultMappedType1(arrSS1, arrSS2, arrSS3, arrSS5, arrSS7);
            } else {
                results = syncDataResultMappedType2(arrSS1, arrSS4, arrSS5, arrSS6, arrSS7);
            }
            
            let colGrid = getColumnGrid(params.custpage_report_type);

            _scvDx.setColumns('custpage_grid_result', colGrid);
            _scvDx.setDataSource('custpage_grid_result', results);

            if(isExport == "T"){

                if (params.custpage_report_type == reportType.TYPE_1) await onExportExcelType1(results, params);
                else await onExportExcelType2(results, params);
            }
            
            _scvForm.showLoadingDialog(false);
        });
    }

    const getColumnGrid = (custpage_report_type) => {
        if (custpage_report_type == reportType.TYPE_2) {
            return [
                { dataField: 'stt', caption: 'STT', dataType: 'string', width: 80 },
                { dataField: 'upccode', caption: 'Mã vật tư', dataType: 'string', width: 220 },
                { dataField: 'item_display', caption: 'Tên vật tư', dataType: 'string', width: 400 },
                { dataField: 'qty_sp', caption: 'Số lượng sản phẩm', dataType: 'number', format: '#,##0.##', width: 150 },
                { dataField: 'pp_quy_doi_ve_tam', caption: 'Phế phẩm quy đổi (Tấm đối với ACP; kg đối với AC)', dataType: 'number', format: '#,##0.##', width: 150 },
                { dataField: 'ttl_qty', caption: 'Tổng sản phẩm', dataType: 'number', format: '#,##0.##', width: 150 },
                { dataField: 'tieu_hao_theo_dm', caption: 'Tiêu hao theo ĐM', dataType: 'number', format: '#,##0.##', width: 150 },
                { dataField: 'nhua_tron', caption: 'Nhựa trộn (kg)', dataType: 'number', format: '#,##0.##', width: 150 },
                { dataField: 'nhua_xay', caption: 'Nhựa xay chạy trực tiếp', dataType: 'number', format: '#,##0.##', width: 150 },
                { dataField: 'nhua_tam', caption: 'Nhựa tấm', dataType: 'number', format: '#,##0.##', width: 150 },
                { dataField: 'tieu_hao_thuc_te', caption: 'Tiêu hao thực tế', dataType: 'number', format: '#,##0.##', width: 150 },
                { dataField: 'chenh_lech', caption: 'Chênh lệch', dataType: 'number', format: '#,##0.##', width: 150 },
                { dataField: 'ty_le', caption: 'Tỷ lệ tiêu hao %', dataType: 'number', format: '#,##0.##%', width: 100 },
                { dataField: 'tieu_hao_hang_danh_gia', caption: 'Tiêu hao hàng đánh giá', dataType: 'number', format: '#,##0.##', width: 150 },
            ]
        }

        return [
            { dataField: 'stt', caption: 'STT', dataType: 'string', width: 80 },
            { dataField: 'upccode', caption: 'Mã vật tư', dataType: 'string', width: 220 },
            { dataField: 'item_display', caption: 'Tên vật tư', dataType: 'string', width: 400 },
            { dataField: 'qty_sp', caption: 'Số lượng sản phẩm', dataType: 'number', format: '#,##0.##', width: 150 },
            { dataField: 'phe_pham', caption: 'Phế phẩm (Tấm đối với ACP; kg đối với AC)', dataType: 'number', format: '#,##0.##', width: 150 },
            { dataField: 'ttl_qty', caption: 'Tổng sản phẩm', dataType: 'number', format: '#,##0.##', width: 150 },
            { dataField: 'tieu_hao_theo_dm', caption: 'Tiêu hao theo ĐM', dataType: 'number', format: '#,##0.##', width: 150 },
            { dataField: 'tieu_hao_thuc_te', caption: 'Tiêu hao thực tế', dataType: 'number', format: '#,##0.##', width: 150 },
            { dataField: 'chenh_lech', caption: 'Chênh lệch', dataType: 'number', format: '#,##0.##', width: 150 },
            { dataField: 'ty_le', caption: 'Tỷ lệ %', dataType: 'number', format: '#,##0.##%', width: 100 },
            { dataField: 'tieu_hao_hang_danh_gia', caption: 'Tiêu hao hàng đánh giá', dataType: 'number', format: '#,##0.##', width: 150 },
        ]
    }

    const syncDataResultMappedType1 = (arrSS1, arrSS2, arrSS3, arrSS5, arrSS7) => {
        let results = [], arrMapping = [];
        let objTtl = {
            rowPreparedData: {
                style: { fontWeight: "bold" }
            },
            upccode: 'Tổng Cộng',
            qty_sp: 0,
            tieu_hao_theo_dm: 0,
            tieu_hao_thuc_te: 0,
            chenh_lech: 0,
            ty_le: 0,
            phe_pham: 0,
            ttl_qty: 0,
            tieu_hao_hang_danh_gia: 0
        }

        arrSS1.forEach( objSS1 => {
            if (objSS1.nhua_tron != 'no') return;

            let qty_sp = 0, tieu_hao_theo_dm = 0, tieu_hao_thuc_te = 0, tieu_hao_theo_dm_n1 = 0;
            let original_item_qty_bom = objSS1.original_item_qty_bom * 1;
            let arrSS2_ft = arrSS2.filter( e => e.keymapping == objSS1.keymapping );
            let objSS5Mapping = arrSS5.find( e => e.keymapping == objSS1.keymapping ) || {
                phe_pham_tam: 0
            };

            if(arrSS2_ft.length){
                arrSS2_ft.forEach(objSS2 => {
                    if (objSS2.has_consumption == "yes") {
                        let arrIdSS2 = objSS2.ab_internal_related.split('|');
                        let objSS3 = arrSS3.find(e => {
                            if (e.keymapping_detail_cost != objSS2.keymapping_total_cost) {
                                return false;
                            }
                            
                            let arrIdSS3 = e.ab_internal.split('|');
                            
                            return arrIdSS2.every(v => arrIdSS3.includes(v));
                        });

                        if(objSS3){
                            qty_sp += objSS3.total_qty * 1;
                            tieu_hao_theo_dm_n1 += original_item_qty_bom * (objSS3.total_qty*1) * (objSS3.conversion_rate*1);
                        }

                    }
                    
                    tieu_hao_thuc_te += objSS2.total_qty * 1;
                });
            }

            let tieu_hao_theo_dm_n2 = objSS5Mapping.phe_pham_tam*1;
            let ttl_qty = qty_sp;
            if (objSS1.assembly_class == AssemblyClass.ACP) {
                tieu_hao_theo_dm_n2 = original_item_qty_bom * objSS5Mapping.phe_pham_tam;
                ttl_qty = qty_sp + objSS5Mapping.phe_pham_tam*1;
            }
            
            tieu_hao_theo_dm = tieu_hao_theo_dm_n1 + tieu_hao_theo_dm_n2;
            
            let objMap = {
                item_id: objSS1.item_id,
                upccode: objSS1.upccode,
                item_display: objSS1.item_display,
                qty_sp: qty_sp,
                phe_pham: objSS5Mapping.phe_pham_tam*1,
                tieu_hao_theo_dm: tieu_hao_theo_dm,
                tieu_hao_thuc_te: tieu_hao_thuc_te,
                ttl_qty: ttl_qty,
            }

            arrMapping.push(objMap);
        })

        arrMapping.sort((a, b) => (a.upccode || '').localeCompare(b.upccode || ''));

        let groupUpccode = lbf.onGroupByArray(arrMapping, ['upccode']);

        groupUpccode.forEach((obj, i) => {
            let arrMapping_Upccode = arrMapping.filter(e => e.upccode == obj.upccode);
            let objSS07 = arrSS7.find( e => e.item_id == arrMapping_Upccode[0].item_id ) || {
                quantity: 0
            };
            let objRes = {
                qty_sp: 0, tieu_hao_theo_dm: 0, tieu_hao_thuc_te: 0, phe_pham: 0, ttl_qty: 0, tieu_hao_hang_danh_gia: objSS07.quantity*1
            };

            arrMapping_Upccode.forEach(objMap => {
                objRes.qty_sp += objMap.qty_sp;
                objRes.tieu_hao_theo_dm += objMap.tieu_hao_theo_dm;
                objRes.tieu_hao_thuc_te += objMap.tieu_hao_thuc_te;
                objRes.phe_pham += objMap.phe_pham;
                objRes.ttl_qty += objMap.ttl_qty;
            })

            if(!objRes.qty_sp && !objRes.tieu_hao_thuc_te) return;

            objRes.stt = i + 1;
            objRes.upccode = obj.upccode;
            objRes.item_display = arrMapping_Upccode[0].item_display;
            objRes.chenh_lech = objRes.tieu_hao_thuc_te - objRes.tieu_hao_theo_dm;
            objRes.ty_le = objRes.tieu_hao_theo_dm ? objRes.chenh_lech/objRes.tieu_hao_theo_dm : 0;

            ['qty_sp', 'tieu_hao_theo_dm', 'tieu_hao_thuc_te', 'chenh_lech', 'phe_pham', 'ttl_qty', 'tieu_hao_hang_danh_gia'].forEach(key => {
                objRes[key] = objRes[key].toFixed(2)*1;
                objTtl[key] += objRes[key];
            })

            results.push(objRes);
        })

        objTtl.ty_le = objTtl.tieu_hao_theo_dm ? (objTtl.chenh_lech / objTtl.tieu_hao_theo_dm) : 0;

        ['qty_sp', 'tieu_hao_theo_dm', 'tieu_hao_thuc_te', 'chenh_lech', 'phe_pham', 'ttl_qty', 'tieu_hao_hang_danh_gia'].forEach(key => {
            objTtl[key] = objTtl[key].toFixed(2)*1;
        })

        results.push(objTtl);
        
        return results;
    }

    const syncDataResultMappedType2 = (arrSS1, arrSS4, arrSS5, arrSS6, arrSS7) => {
        let results = [], arrMapping = [];
        let objTtl = {
            rowPreparedData: {
                style: { fontWeight: "bold" }
            },
            upccode: 'Tổng Cộng',
            qty_sp: 0,
            pp_quy_doi_ve_tam: 0,
            tieu_hao_theo_dm: 0,
            nhua_tron: 0,
            nhua_xay: 0,
            nhua_tam: 0,
            tieu_hao_thuc_te: 0,
            ty_le: 0,
            chenh_lech: 0,
            ttl_qty: 0,
            tieu_hao_hang_danh_gia: 0
        }

        arrSS1.forEach(objSS1 => {
            if (objSS1.nhua_tron != 'yes') return;
            
            let original_item_qty_bom = objSS1.original_item_qty_bom * 1;
            let arrSS4_ft = arrSS4.filter( e => e.keymapping == objSS1.keymapping );
            let objSS5Mapping = arrSS5.find( e => e.keymapping == objSS1.keymapping ) || {
                phe_pham_tam: 0, nhua_tam_kg: 0
            };
            let qty_sp = 0, nhua_tron = 0, nhua_xay = 0, tieu_hao_theo_dm_n1 = 0;

            if(arrSS4_ft.length){
                arrSS4_ft.forEach( objSS4 => {
                    if (objSS4.has_consumption == "yes") {

                        let arrIdSS4 = objSS4.ab_internal_related.split('|');
                        let objSS6 = arrSS6.find(e => {
                            if (e.keymapping_detail_cost != objSS4.keymapping_total_cost) {
                                return false;
                            }
                            
                            let arrIdSS6 = e.ab_internal_related.split('|');
                            
                            return arrIdSS4.every(v => arrIdSS6.includes(v));
                        });

                        if(objSS6){
                            qty_sp += objSS6.total_qty*1;
                            tieu_hao_theo_dm_n1 += original_item_qty_bom * (objSS6.total_qty*1) * (objSS6.conversion_rate*1);
                        }
                    }

                    nhua_tron += objSS4.total_quantity_nhua_tron*1;
                    nhua_xay += objSS4.total_quantity_nhua_xay*1;
                });
            }

            let tieu_hao_theo_dm_n2 = objSS5Mapping.phe_pham_tam*1;
            let ttl_qty = qty_sp;
            if (objSS1.assembly_class == AssemblyClass.ACP) {
                tieu_hao_theo_dm_n2 = original_item_qty_bom * objSS5Mapping.phe_pham_tam;
                ttl_qty = qty_sp + objSS5Mapping.phe_pham_tam*1;
            }

            let nhua_tam = objSS5Mapping.nhua_tam_kg*1;
            let tieu_hao_thuc_te = nhua_tron + nhua_xay - nhua_tam;
            
            let objMap = {
                upccode: objSS1.upccode,
                item_display: objSS1.item_display,
                qty_sp: qty_sp,
                pp_quy_doi_ve_tam: objSS5Mapping.phe_pham_tam*1,
                tieu_hao_theo_dm: tieu_hao_theo_dm_n1 + tieu_hao_theo_dm_n2,
                nhua_tron: nhua_tron,
                nhua_xay: nhua_xay,
                nhua_tam: nhua_tam,
                tieu_hao_thuc_te: tieu_hao_thuc_te,
                ttl_qty: ttl_qty,
                item_id: objSS1.item_id
            }

            arrMapping.push(objMap);
        })

        arrMapping.sort((a, b) => (a.upccode || '').localeCompare(b.upccode || ''));

        let groupUpccode = lbf.onGroupByArray(arrMapping, ['upccode']);

        groupUpccode.forEach((obj, i) => {
            let arrMapping_Upccode = arrMapping.filter(e => e.upccode == obj.upccode);
            let objSS07 = arrSS7.find(e => e.item_id == arrMapping_Upccode[0].item_id) || {
                quantity: 0
            };
            let objRes = {
                qty_sp: 0, pp_quy_doi_ve_tam: 0, tieu_hao_theo_dm: 0, nhua_tron: 0,
                nhua_xay: 0, nhua_tam: 0, tieu_hao_thuc_te: 0, ttl_qty: 0, tieu_hao_hang_danh_gia: objSS07.quantity*1
            };

            arrMapping_Upccode.forEach(objMap => {
                objRes.qty_sp += objMap.qty_sp;
                objRes.pp_quy_doi_ve_tam += objMap.pp_quy_doi_ve_tam;
                objRes.tieu_hao_theo_dm += objMap.tieu_hao_theo_dm;
                objRes.nhua_tron += objMap.nhua_tron;
                objRes.nhua_xay += objMap.nhua_xay;
                objRes.nhua_tam += objMap.nhua_tam;
                objRes.tieu_hao_thuc_te += objMap.tieu_hao_thuc_te;
                objRes.ttl_qty += objMap.ttl_qty;
            })

            if(!objRes.qty_sp && !objRes.tieu_hao_thuc_te) return;

            objRes.stt = i + 1;
            objRes.upccode = obj.upccode;
            objRes.item_display = arrMapping_Upccode[0].item_display;
            objRes.chenh_lech = objRes.tieu_hao_thuc_te - objRes.tieu_hao_theo_dm;
            objRes.ty_le = objRes.tieu_hao_theo_dm ? objRes.chenh_lech/objRes.tieu_hao_theo_dm : 0;

            [
                'qty_sp', 'pp_quy_doi_ve_tam', 'tieu_hao_theo_dm', 'nhua_tron', 'nhua_xay',
                'nhua_tam', 'tieu_hao_thuc_te', 'chenh_lech', 'ttl_qty', 'tieu_hao_hang_danh_gia'
            ].forEach(key => {
                objRes[key] = objRes[key].toFixed(2)*1;
                objTtl[key] += objRes[key];
            })

            results.push(objRes);
        })

        objTtl.ty_le = objTtl.tieu_hao_theo_dm ? (objTtl.chenh_lech / objTtl.tieu_hao_theo_dm) : 0;

        [
            'qty_sp', 'pp_quy_doi_ve_tam', 'tieu_hao_theo_dm', 'nhua_tron', 'nhua_xay',
            'nhua_tam', 'tieu_hao_thuc_te', 'chenh_lech', 'ttl_qty', 'tieu_hao_hang_danh_gia'
        ].forEach(key => {
            objTtl[key] = objTtl[key].toFixed(2)*1;
        })

        results.push(objTtl);
        
        return results;
    }
    
    const onExportExcelType1 = async (results, params) => {
        let curRec = crr.get();
        let objTmpl = _scvForm.ajax.post(_scvForm.serviceScript.url,{
            custpage_subsidiary: params.custpage_subsidiary,
            action: "getTemplateExcel",
        }).data;
        let workbook = await _scvExcelJS.loadWorkbookFromUrl(objTmpl.url);
        let curSheet = workbook.worksheets[0];
        let toDate = curRec.getValue('custpage_todt');
        let idxRowData = 6;

        if(results.length == 1) idxRowData = 7;
        
        _scvExcelJS.replaceKey(curSheet, [
            "{pToDate}",
            "{pNguoiLap}",
            "{pKiemSoat}"
        ], [
            `Tháng ${toDate.getMonth() + 1} năm ${toDate.getFullYear()}`,
            objTmpl.curUserInfo.custentity_scv_legal_name,
            '',
        ]);

        for (let i = 0; i < results.length; i++){
            let objRes = results[i];

            if(i == 0 || i == results.length - 1){
                let curRow = curSheet.getRow(idxRowData++);
                [
                    'upccode', 'item_display', 'qty_sp', 'phe_pham', 'ttl_qty',
                    'tieu_hao_theo_dm', 'tieu_hao_thuc_te', 'chenh_lech', 'ty_le', 'tieu_hao_hang_danh_gia'
                ].forEach((key, i) => {
                    curRow.getCell(i + 1).value = objRes[key];
                });
                
                continue;
            }

            curSheet.insertRow(idxRowData++, [
                objRes.upccode, objRes.item_display, objRes.qty_sp, objRes.phe_pham, objRes.ttl_qty,
                objRes.tieu_hao_theo_dm, objRes.tieu_hao_thuc_te, objRes.chenh_lech, objRes.ty_le, objRes.tieu_hao_hang_danh_gia
            ], 'i+');
        }

        _scvExcelJS.saveWorkbook(workbook, "Bảnh tính giá thành.xlsx");
    }
    
    const onExportExcelType2 = async (results, params) => {
        let objTmpl = _scvForm.ajax.post(_scvForm.serviceScript.url,{
            custpage_subsidiary: params.custpage_subsidiary,
            action: "getTemplateExcelType2",
        }).data;
        let workbook = await _scvExcelJS.loadWorkbookFromUrl(objTmpl.url);
        let curSheet = workbook.worksheets[0];
        let idxRowData = 9;

        if(results.length == 1) idxRowData = 10;
        
        _scvExcelJS.replaceKey(curSheet, [
            "{pLegalname_subsidiary}",
            "{pMainaddress_subsidiary}",
            "{pPrintDate}",
        ], [
            objTmpl.subsidiary[0].legalname,
            objTmpl.subsidiary[0].mainaddress_display,
            `Từ ngày ${params.custpage_fromdt} đến ngày ${params.custpage_todt}`
        ]);

        for (let i = 0; i < results.length; i++){
            let objRes = results[i];

            if(i == 0 || i == results.length - 1){
                let curRow = curSheet.getRow(idxRowData++);
                [
                    'upccode', 'item_display', 'qty_sp', 'pp_quy_doi_ve_tam', 'ttl_qty', 'tieu_hao_theo_dm',
                    'nhua_tron', 'nhua_xay', 'nhua_tam', 'tieu_hao_thuc_te', 'chenh_lech', 'ty_le', 'tieu_hao_hang_danh_gia'
                ].forEach((key, i) => {
                    curRow.getCell(i + 1).value = objRes[key];
                });
                
                continue;
            }

            curSheet.insertRow(idxRowData++, [
                objRes.upccode, objRes.item_display, objRes.qty_sp, objRes.pp_quy_doi_ve_tam, objRes.ttl_qty, objRes.tieu_hao_theo_dm,
                objRes.nhua_tron, objRes.nhua_xay, objRes.nhua_tam, objRes.tieu_hao_thuc_te, objRes.chenh_lech, objRes.ty_le, objRes.tieu_hao_hang_danh_gia
            ], 'i+');
        }

        _scvExcelJS.saveWorkbook(workbook, "Bảnh tính giá thành (nhựa).xlsx");
    }

    const initFieldGroupLevel02 = (curRec) =>{
        let params = {
            custpage_grp_lv1: curRec.getValue('custpage_grp_lv1'),
            action: "getDataGroupLevel02"
        };

        _scvForm.ajax.postAsync(_scvForm.serviceScript.url, params, function (_res){
            constRecord.initQuickFindFieldSelect(curRec, "custpage_grp_lv2", {
                data: _res.data,
                valueExpr: "internalid",
                displayExpr: "name",
                reInsertOption: true
            });
        });
    }

    const initLoadFieldWorkCenter = (curRec) => {
        let subsidiaryId = curRec.getValue('custpage_subsidiary');
        let arrData = [];

        if(subsidiaryId){
            arrData = constEntityGroup.getDataSource(
                search.createFilter({
                    name: 'custentity_scv_sub',
                    operator: 'anyof',
                    values: subsidiaryId
                })
            );
        }

        constRecord.initQuickFindFieldSelect(curRec, 'custpage_work_center', {
            data: arrData,
            valueExpr: 'internalid',
            displayExpr: 'groupname',
            reInsertOption: true
        }, false);
    }

    const initLoadFieldLocation = (curRec) => {
        let subsidiaryId = curRec.getValue('custpage_subsidiary');
        let arrData = [];

        if(subsidiaryId){
            arrData = getLocationBySubId(subsidiaryId);
        }

        constRecord.initQuickFindFieldSelect(curRec, 'custpage_location', {
            data: arrData,
            valueExpr: 'id',
            displayExpr: 'name',
            reInsertOption: true
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
                LocationSubsidiaryMap.subsidiary = ${subsidiaryId}
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
