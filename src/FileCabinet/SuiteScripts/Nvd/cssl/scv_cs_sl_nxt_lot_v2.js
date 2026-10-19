/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([
        'N/currentRecord',
        'N/url',
        'N/query',
        '../lib/scv_lib_function.js',
        '../common/scv_common_excel_helper',
        '../lib/scv_lib_cs_xls.js',
        '../cons/scv_cons_record',
        '../lib/scv_lib_cs'
    ],

    (
        currentRecord,
        url,
        query,
        lbf,
        excelHelper,
        libCsXLS,
        constRecord,
        libCs
    ) => {

        const CUR_SCRIPT = {
            ID: "customscript_scv_sl_nxt_lot_v2",
            DEPLOYID_UI: "customdeploy_scv_sl_nxt_lot_v2",
            DEPLOYID_DATA: "customdeploy_scv_sl_nxt_lot_v2_data"
        }
        const URL_DATA = "/app/site/hosting/scriptlet.nl?script=" + CUR_SCRIPT.ID + "&deploy=" + CUR_SCRIPT.DEPLOYID_DATA;

        function pageInit(context) {
            let currentRecord = context.currentRecord;
            constRecord.initQuickFindFieldSelect(currentRecord, 'custpage_location', {
                data: currentRecord.getField("custpage_location").getSelectOptions(),
                valueExpr: "value",
                displayExpr: "text",
                reInsertOption: false
            }, false);
        }

        const fieldChanged = (context) => {
            let currentRecord = context.currentRecord;
            let fieldId = context.fieldId;

            if (fieldId === 'custpage_subsidiary') {
                populateLocationField(currentRecord, fieldId);
            }
            if (fieldId === 'custpage_nhom_cap_1') populateNhomCap2();
            if (fieldId === 'custpage_nhom_cap_2') populateNhomCap3();
            if (fieldId === 'custpage_nhom_cap_3') populateNhomCap4();
        };

        const populateLocationField = (currentRecord, fieldId) => {
            let subsidiary = currentRecord.getValue(fieldId);
            let c = ['internalid', 'name'];
            let f = [
                ['subsidiary', 'anyof', subsidiary]
            ];
            let fieldProject = currentRecord.getField('custpage_location');
            fieldProject.removeSelectOption({value: null});
            libCs.insertSelection([fieldProject], 'location', c, f, false, currentRecord.getValue('custpage_location'));

            constRecord.initQuickFindFieldSelect(currentRecord, 'custpage_location', {
                data: currentRecord.getField("custpage_location").getSelectOptions(),
                valueExpr: "value",
                displayExpr: "text",
                reInsertOption: false
            }, false);
        }


        const populateNhomCap2 = () => {
            let curRec = currentRecord.get();
            let idNhomCap1 = curRec.getValue('custpage_nhom_cap_1').filter(Boolean).map(item => `'${item}'`).join(',');
            let fieldNhomCap2 = curRec.getField({fieldId: 'custpage_nhom_cap_2'});
            setSelectOptionToDefaults(fieldNhomCap2);
            if (idNhomCap1) {
                addSelectOptionByParent(idNhomCap1, fieldNhomCap2);
            } else {
                let fieldNhomCap3 = curRec.getField({fieldId: 'custpage_nhom_cap_3'});
                let fieldNhomCap4 = curRec.getField({fieldId: 'custpage_nhom_cap_4'});
                setSelectOptionToDefaults(fieldNhomCap3);
                setSelectOptionToDefaults(fieldNhomCap4);
            }
        }

        const populateNhomCap3 = () => {
            let curRec = currentRecord.get();
            let nhomCap2Value = curRec.getValue('custpage_nhom_cap_2');
            let fieldNhomCap3 = curRec.getField({fieldId: 'custpage_nhom_cap_3'});
            setSelectOptionToDefaults(fieldNhomCap3)
            if (nhomCap2Value) {
                addSelectOptionByParent(`${nhomCap2Value}`, fieldNhomCap3);
            }
        }

        const populateNhomCap4 = () => {
            let curRec = currentRecord.get();
            let nhomCap3Value = curRec.getValue('custpage_nhom_cap_3');
            let fieldNhomCap4 = curRec.getField({fieldId: 'custpage_nhom_cap_4'});
            setSelectOptionToDefaults(fieldNhomCap4)
            if (nhomCap3Value) {
                addSelectOptionByParent(nhomCap3Value, fieldNhomCap4);
            }
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

        const onRefreshForm = () => {
            window.onbeforeunload = null;

            let urlDC = url.resolveScript({
                scriptId: CUR_SCRIPT.ID,
                deploymentId: CUR_SCRIPT.DEPLOYID_UI,
                returnExternalUrl: false
            });
            window.location.replace(urlDC);
        }

        const onSearchResult = (isExport) => {
            window.onbeforeunload = null;
            let currRecord = currentRecord.get();
            let isValid = validateFieldMandatory(currRecord, ["custpage_fromdate", "custpage_todate"]);
            if (!isValid) return;
            showLoadingDialog();
            updateProgessStatus(`Lấy dữ liệu tồn đầu kỳ từ đầu đến ${currRecord.getText('custpage_fromdate')}...`);
            setTimeout(() => {
                asynSearchResult(isExport);
            }, 100);
        }

        const asynSearchResult = (isExport) => {
            let currRecord = currentRecord.get();

            let params = getObjParams(currRecord);

            if (isExport !== "T") {
                arrData.length = 0;
            }
            let cntCallData = 0;
            let ttlPageBegin = getTotalPageSSBegin(params);
            let arrActionFunc = [];
            let isError = false;

            arrActionFunc.push({action: "getDataTrans", params: {...params}, data: []});
            arrActionFunc.push({action: "getPutawayNoBin", params: {...params}, data: []});

            for (let i = 0; i < ttlPageBegin; i++) {
                let objDataReq = {...params};
                objDataReq.page = i;
                arrActionFunc.push({action: "getDataBegin", params: objDataReq, data: []});
            }

            for (let i = 0; i < arrActionFunc.length; i++) {
                let objActionFunc = arrActionFunc[i];
                let paramsFunc = objActionFunc.params;
                paramsFunc.action = objActionFunc.action;

                jQuery.ajax({
                    url: URL_DATA, type: "GET", data: paramsFunc, dataType: "json"
                }).done((response) => {
                    objActionFunc.data = response.data;
                }).fail((request, status, error) => {
                    isError = true;
                    console.log(paramsFunc.action);
                    console.log(error);
                }).always(() => {
                    cntCallData++;
                    updateProgessStatus("Dữ liệu đầu kỳ : " + cntCallData + " / " + arrActionFunc.length);
                    if (cntCallData >= arrActionFunc.length) {
                        let arrResult = finalGetDataResult(params, arrActionFunc, isError);

                        if (isExport === "T") {
                            onExportResult(currRecord, arrResult);
                        } else {
                            arrData = [...arrResult];
                            // Đồng bộ columns của opGrid theo giá trị custpage_check_bins hiện tại trên form
                            // (server chỉ inject opGrid 1 lần lúc load trang, nên cần update lại ở client)
                            let checkBinsVal = currRecord.getValue('custpage_check_bins');
                            let binColIndex = opGrid.columns.findIndex(c => c.dataField === 'bin_number_display');
                            if (checkBinsVal !== true) {
                                if (binColIndex !== -1) opGrid.columns.splice(binColIndex, 1);
                            } else {
                                if (binColIndex === -1) {
                                    // Chèn lại column Bin vào đúng vị trí (index 2, sau location_display)
                                    opGrid.columns.splice(2, 0, {dataField: 'bin_number_display', caption: 'Bin', dataType: 'string'});
                                }
                            }
                            renderGridLogCall();
                        }
                        removeLoadingDialog();
                    }
                });
            }
        }

        const onExportResult = async (curRec, arrResult) => {
            try {
                let arrDummy = [...arrResult];
                let objSum = arrDummy[0];

                arrDummy.shift();
                let params = getObjParams(curRec);
                let location_nm = curRec.getText("custpage_location").join(', ');
                let templateUrl = getTemplateExcel();
                let workbook = await excelHelper.loadWorkbookFromUrl(templateUrl);
                let worksheet = workbook.worksheets[0];

                worksheet.getCell('I2').value = `(Từ ngày ${params.custpage_fromdate} đến ngày ${params.custpage_todate})`;
                worksheet.getCell('B3').value = `${location_nm}`;

                let colId = [
                    'item', 'location_display', 'bin_number_display', 'upc_code', 'item_display_name',
                    'item_primary_stock_unit_display', 'inventory_number_display', 'color_seri', 'item_count', 'qty_in',
                    'qty_out', 'qty_end', 'status_display', 'ghi_chu', 'ngay_sx',
                    'expired_date', 'trong_luong_loi', 'ma_cu', 'luong_dieu_chuyen', 'luong_xuat_ban'
                ];

                // Nếu không hiển thị cột Bin: ẩn cột C (Bin) trên sheet để tránh vỡ merge cells / layout template
                let isBins = params.custpage_check_bins === true;
                if (!isBins) {
                    let binCol = worksheet.getColumn(3);
                    binCol.hidden = true;
                    binCol.width = 0;
                }

                // Ghi giá trị tổng cộng (vị trí không đổi vì cột Bin chỉ bị ẩn, không bị xóa)
                worksheet.getCell('I8').value = objSum.item_count;
                worksheet.getCell('J8').value = objSum.qty_in;
                worksheet.getCell('K8').value = objSum.qty_out;
                worksheet.getCell('L8').value = objSum.qty_end;

                excelHelper.insertValueTable({
                    curSheet : worksheet,
                    idxSourceRow : 7,
                    idxRowData : 8,
                    arrData : arrDummy,
                    colId : colId
                })

                // Write to a file
                const buffer = await workbook.xlsx.writeBuffer();
                const blob = new Blob([buffer], {type: 'application/octet-stream'});
                saveAs(blob, 'Tổng hợp NXT theo lô.xlsx');
            } catch (err) {
                alert(err)
            }
        }

        const getTemplateExcel = () => {
            let params = {};
            params.action = "getTemplateExcel";

            let objUrl = {};
            $.ajax({
                url: URL_DATA, type: "GET", data: params, dataType: "json", async: false
            }).done((response) => {
                objUrl = response.url;
            }).fail((request, status, error) => {
                alert(status);
            });

            return objUrl;
        }

        const onExportResultOnForm = () => {
            let currRecord = currentRecord.get();
            onExportResult(currRecord, arrData)
        }

        const getObjParams = (currRecord) => {
            return {
                custpage_subsidiary : currRecord.getValue('custpage_subsidiary'),
                custpage_location : currRecord.getValue('custpage_location').join(','),
                custpage_location_text : currRecord.getText('custpage_location'),
                custpage_item : currRecord.getValue('custpage_item'),
                custpage_lot_no : currRecord.getValue('custpage_lot_no'),
                custpage_fromdate : currRecord.getText('custpage_fromdate'),
                custpage_todate : currRecord.getText('custpage_todate'),
                custpage_status : currRecord.getValue('custpage_status').join(','),
                custpage_nhom_cap_1:  currRecord.getValue('custpage_nhom_cap_1').join(','),
                custpage_nhom_cap_2:  currRecord.getValue('custpage_nhom_cap_2'),
                custpage_nhom_cap_3:  currRecord.getValue('custpage_nhom_cap_3'),
                custpage_nhom_cap_4:  currRecord.getValue('custpage_nhom_cap_4'),
                custpage_check_bins : currRecord.getValue('custpage_check_bins'),
            };
        }

        const finalGetDataResult = (params, arrActionFunc, isError) => {
            if (isError) {
                alert("error");
                return [];
            }

            let arrResult = [];
            let sumTonDau = 0;
            let sumNhap = 0;
            let sumXuat = 0;
            let sumCuoiKy = 0;
            let arrTrans = arrActionFunc.find(e => e.action === "getDataTrans").data;
            let arrBegin = [];
            arrActionFunc.filter(e => e.action === "getDataBegin").forEach(objData => arrBegin = arrBegin.concat(objData.data));

            arrBegin = Array.from(
                new Map(
                    arrBegin.map((item) => [JSON.stringify(item), item])
                ).values()
            ); // khi lấy dự liệu ra thường xuyeen bị dup dữ liệu, khs
            arrTrans = Array.from(
                new Map(
                    arrTrans.map((item) => [JSON.stringify(item), item])
                ).values()
            ); // khi lấy dự liệu ra thường xuyeen bị dup dữ liệu, khs

            for (let i = 0; i < arrBegin.length; i++) {
                let result_BEG = arrBegin[i];
                let hasCorrespondingTranLine = 0;

                if (Number(result_BEG.item_count) !== 0 ) {
                    let beginQuantity = Number(result_BEG.item_count);
                    let cuoiKy = 0;

                    for (let m = 0; m < arrTrans.length; m++) {
                        let result_I_O = arrTrans[m];

                        if (result_BEG.location === result_I_O.location &&
                            result_BEG.item === result_I_O.item &&
                            result_BEG.inventory_number === result_I_O.inventory_number &&
                            result_BEG.status === result_I_O.status &&
                            result_BEG.bin_number === result_I_O.bin_number
                        ) {
                            if (hasCorrespondingTranLine > 0) {
                                beginQuantity = 0;
                                cuoiKy = Number(result_I_O.qty_in / result_I_O.stock_unit_conversion) - Number(result_I_O.qty_out / result_I_O.stock_unit_conversion);
                            } else {
                                sumTonDau += beginQuantity;
                                cuoiKy = Number(beginQuantity) + Number(result_I_O.qty_in / result_I_O.stock_unit_conversion) - Number(result_I_O.qty_out/ result_I_O.stock_unit_conversion);
                            }

                            sumNhap += Number(result_I_O.qty_in / result_I_O.stock_unit_conversion);
                            sumXuat += Number(result_I_O.qty_out / result_I_O.stock_unit_conversion);
                            sumCuoiKy += cuoiKy;

                            arrResult.push(
                                {
                                    ...result_I_O,
                                    item_count : beginQuantity || 0, //item_count : Math.round((beginQuantity || 0) * 1000) / 1000,
                                    qty_in : Number(result_I_O.qty_in) / result_I_O.stock_unit_conversion, //qty_in : Math.round((Number(result_I_O.qty_in) / result_I_O.stock_unit_conversion) * 1000) / 1000,
                                    qty_out : Number(result_I_O.qty_out) / result_I_O.stock_unit_conversion, //qty_out : Math.round((Number(result_I_O.qty_out) / result_I_O.stock_unit_conversion) * 1000) / 1000,
                                    qty_end: Number(cuoiKy) || 0, //qty_end: Math.round((Number(cuoiKy) || 0) * 1000) / 1000,
                                }
                            );

                            hasCorrespondingTranLine++;
                        }
                    }
                    if (hasCorrespondingTranLine === 0) {
                        arrResult.push({
                                ...result_BEG,
                            item_count: beginQuantity || 0, //item_count: Math.round((beginQuantity || 0) * 1000) / 1000,
                            qty_in: 0,
                            qty_out: 0,
                            qty_end: Number(beginQuantity) || 0, //qty_end: Math.round((Number(beginQuantity) || 0) * 1000) / 1000,
                            luong_xuat_ban : 0, // thêm vào thì mới có dữ liệu
                            luong_dieu_chuyen: Number(result_BEG.luong_dieu_chuyen) || 0,
                            }
                        )
                        sumTonDau += beginQuantity;
                        sumCuoiKy += Number(beginQuantity);
                    }
                }
            }

            arrTrans.forEach((result_I_O) => {
                console.log(result_I_O);
                let tranLineDaLay = 0;
                arrBegin.forEach((result_BEG) => {
                    if (result_BEG.location === result_I_O.location &&
                        result_BEG.item === result_I_O.item &&
                        result_BEG.inventory_number === result_I_O.inventory_number &&
                        result_BEG.status === result_I_O.status &&
                        result_BEG.bin_number === result_I_O.bin_number &&
                        (Number(result_BEG.item_count) !== 0)
                    ) {
                        tranLineDaLay++;
                    }
                });

                if (tranLineDaLay === 0) {
                    arrResult.push({
                        ...result_I_O,
                        item_count:  0,
                        qty_in: Number(result_I_O.qty_in) || 0, //qty_in: Math.round(Number(result_I_O.qty_in) * 1000) / 1000 || 0,
                        qty_out: Number(result_I_O.qty_out) || 0, //qty_out: Math.round(Number(result_I_O.qty_out) * 1000) / 1000 || 0,
                        qty_end: (Number(result_I_O.qty_in / result_I_O.stock_unit_conversion) - Number(result_I_O.qty_out / result_I_O.stock_unit_conversion)) || 0, //qty_end: Math.round((Number(result_I_O.qty_in / result_I_O.stock_unit_conversion) - Number(result_I_O.qty_out / result_I_O.stock_unit_conversion)) * 1000) / 1000 || 0,
                    });

                    sumNhap += Number(result_I_O.qty_in/ result_I_O.stock_unit_conversion);
                    sumXuat += Number(result_I_O.qty_out/ result_I_O.stock_unit_conversion);
                    sumCuoiKy += (Number(result_I_O.qty_in/ result_I_O.stock_unit_conversion) - Number(result_I_O.qty_out/ result_I_O.stock_unit_conversion));
                }
            });

            sumTonDau = sumTonDau.toFixed(3);
            sumNhap = sumNhap.toFixed(3);
            sumXuat = sumXuat.toFixed(3);
            sumCuoiKy = sumCuoiKy.toFixed(3);

            // Nếu không hiển thị cột bin → group các dòng lại (bỏ bin ra khỏi key)
            if (params.custpage_check_bins !== true) {
                arrResult = groupResultNoBins(arrResult);
            }

            let actPutaway = arrActionFunc.find(e => e.action === "getPutawayNoBin");
            let arrPutaway = actPutaway ? (actPutaway.data || []) : [];
            let dBefore = 0, dInPeriod = 0;
            arrPutaway.forEach((pa) => {
                let before   = Number(pa.putaway_before)    || 0;
                let inPeriod = Number(pa.putaway_in_period) || 0;
                let total    = before + inPeriod;
                if (total <= 0) return;

                let row = arrResult.find(r =>
                    (r.bin_number === '' || r.bin_number == null) &&
                    String(r.item)     === String(pa.item) &&
                    String(r.location) === String(pa.location) &&
                    String(r.status)   === String(pa.status) &&
                    String(r.inventory_number || '') === String(pa.inventory_number || '')
                );

                // Chỉ xử lý khi đã có dòng no-bin tương ứng ĐANG hiển thị trên báo cáo.
                // Không có dòng (item ngoài scope hiển thị) -> BỎ QUA: tuyệt đối không tạo
                // dòng mới (tránh tồn âm ảo) và không cộng dồn vào tổng.
                if (!row) return;

                row.item_count = Math.round((Number(row.item_count || 0) - before)   * 1000) / 1000;
                row.qty_out    = Math.round((Number(row.qty_out    || 0) + inPeriod) * 1000) / 1000;
                row.qty_end    = Math.round((Number(row.qty_end    || 0) - total)    * 1000) / 1000;

                dBefore   += before;
                dInPeriod += inPeriod;
            });
            sumTonDau = (Number(sumTonDau) - dBefore).toFixed(3);
            sumXuat   = (Number(sumXuat)   + dInPeriod).toFixed(3);
            sumCuoiKy = (Number(sumCuoiKy) - (dBefore + dInPeriod)).toFixed(3);

            arrResult = finalizeRounding(arrResult);
          
            arrResult.unshift({
                item_display_name : 'Tổng cộng',
                item_count : formatNumber(sumTonDau),
                qty_in : formatNumber( sumNhap),
                qty_out : formatNumber( sumXuat),
                qty_end : formatNumber( sumCuoiKy),
            });
            return arrResult;
        }

        const finalizeRounding = (arrResult) => {
            const QTY_FIELDS = ['item_count', 'qty_in', 'qty_out', 'qty_end', 'luong_dieu_chuyen', 'luong_xuat_ban'];
            return arrResult.map(row => {
                const rounded = {...row};
                QTY_FIELDS.forEach(f => {
                    if (rounded[f] !== undefined) {
                        rounded[f] = Math.round((Number(rounded[f]) || 0) * 1000) / 1000;
                    }
                });
                return rounded;
            });
        }

        /**
         * Group các dòng kết quả theo tất cả field trừ bin và các cột số lượng.
         * Các cột số lượng sẽ được cộng dồn vào dòng đại diện.
         */
        const groupResultNoBins = (arrResult) => {
            const QTY_FIELDS = ['item_count', 'qty_in', 'qty_out', 'qty_end', 'luong_dieu_chuyen', 'luong_xuat_ban'];
            // Chỉ dùng các field định danh cố định làm key thay vì "tất cả field trừ bin"
            // để tránh bị nhiễu bởi các field như stock_unit_conversion, display text, v.v.
            const KEY_FIELDS = ['item', 'location', 'inventory_number', 'status', 'upc_code', 'color_seri', 'ngay_sx', 'expired_date', 'ghi_chu'];

            const map = new Map();
            for (const row of arrResult) {
                // Tạo key chỉ từ các field định danh
                const keyObj = {};
                KEY_FIELDS.forEach(k => { keyObj[k] = row[k] ?? ''; });
                const key = JSON.stringify(keyObj);

                if (map.has(key)) {
                    const existing = map.get(key);
                    QTY_FIELDS.forEach(f => {
                        existing[f] = Number(existing[f] || 0) + Number(row[f] || 0); //existing[f] = Math.round((Number(existing[f] || 0) + Number(row[f] || 0)) * 100) / 100;
                    });
                } else {
                    // Clone dòng, xóa thông tin bin
                    const clone = {...row, bin_number: '', bin_number_display: ''};
                    map.set(key, clone);
                }
            }
            return Array.from(map.values());
        }

        const getTotalPageSSBegin = (_params) => {
            let ttlPage = 0;

            let objDataReq = {..._params};
            objDataReq.action = "getDataBeginTotalPage";

            jQuery.ajax({
                type: "GET", url: URL_DATA, dataType: "json", async: false, data: objDataReq
            }).done((response) => {
                ttlPage = response.data;
                updateProgessStatus("Dữ liệu đầu kỳ : 0 / " + (ttlPage + 1));
            });

            return ttlPage;
        }

        const validateFieldMandatory = (curRec, lstFields) => {
            let isValid = true;
            for (let i = 0; i < lstFields.length; i++) {
                let infoField = curRec.getField(lstFields[i]);
                if (infoField.isMandatory === true) {
                    let valueField = curRec.getValue(lstFields[i]);
                    if (!lbf.isContainValue(valueField)) {
                        isValid = false;
                        alert("Điền dữ liệu cho : " + infoField.label);
                        break;
                    }
                }
            }

            return isValid;
        }

        const showLoadingDialog = () => {
            let mainPopup = document.getElementById("custpage_dxgrid_val");
            let style = "position:fixed; left:0; top:0; width:100%; height:100%; background-color:rgba(127, 140, 141, 0.85); z-index: 1001; display: flex; justify-content:center; align-items:center; flex-direction: column;";
            let mainDiv = document.createElement('div');
            mainDiv.setAttribute('style', style);
            mainDiv.setAttribute('id', 'scv_show_loading');
            mainDiv.innerHTML = "<img width='100px' src='https://5625891.app.netsuite.com/core/media/media.nl?id=80159&c=5625891&h=5d-xvXW767grIFKW4I0h7j_xHVmOOQVuaxyW05RnUfk65KsN&fcts=20220628220717&whence=' alt='loading_gif'/>";
            mainDiv.innerHTML += '<p id="idxProgessStatus" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%)">Processing...</p>';
            mainPopup.appendChild(mainDiv);
        }

        const removeLoadingDialog = () => {
            document.getElementById("scv_show_loading").remove();
        }

        const updateProgessStatus = (_msg) => {
            $("#idxProgessStatus").html(_msg);
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

        const formatNumber = (number) => {
            if (!util.isNumber(number)) {
                number = parseFloat(Number(number).toFixed(3));
            } else {
                number = parseFloat(number.toFixed(3));
            }
            return number;
        }

        return {
            pageInit,
            fieldChanged,
            onRefreshForm,
            onSearchResult,
            onExportResultOnForm,
        };
    });