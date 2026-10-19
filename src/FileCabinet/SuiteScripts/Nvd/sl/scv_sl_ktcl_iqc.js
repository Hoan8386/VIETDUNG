/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(["N/record", "N/render", 'N/runtime', 'N/file', 'N/search', 'N/ui/serverWidget', '../lib/scv_lib_report'],
    (record, render, runtime, file, search, serverWidget, lrp ) => {

        const SS_IQC_RESULT_DEV = 'customsearch_scv_iqc_result_dev';

        function onRequest(scriptContext) {
            try {
                let response = scriptContext.response;
                let request = scriptContext.request;
                let params = request.parameters;
                let filtersIQC = [], listDataIQC = [];
                if (params.isSearch === "T" ) {
                    listDataIQC = getData(filtersIQC, listDataIQC, params);
                    // log.error('listDataIQC', listDataIQC)
                }
                let arrLines = [];
                if (params.isAdd === "T" ) {
                    showPopUp(scriptContext, filtersIQC, listDataIQC, params);
                    return;
                }
                // else if(params.isSaved === "T"){
                //     arrLines = params.arrLines ? JSON.parse(params.arrLines) : [];
                // }
                arrLines = params.arrLines ? JSON.parse(params.arrLines) : [];
                if (scriptContext.request.method === "GET") {
                    let MainForm = onCreateFormUI(params, scriptContext);
                    let sublistResult = createSublistResult(MainForm.form);
                    let sublistLo = createSublistLo(MainForm.form);
                    setSublistValue(listDataIQC, arrLines, sublistResult, sublistLo, params)
                    response.writePage(MainForm.form);
                }
            } catch (e) {
                log.error('onRequest error', e);
            }
        }
        function getData(filtersIQC, listDataIQC, params){
            pushFilteIQC(filtersIQC, params);
            lrp.doSearchSSRangeLabelId(SS_IQC_RESULT_DEV, 1000, listDataIQC, filtersIQC);
            listDataIQC = renameFields(listDataIQC);
            return listDataIQC;
        }

        function showPopUp(scriptContext, filtersIQC, listDataIQC, params) {
            listDataIQC = getData(filtersIQC, listDataIQC, params);
            let formPopUp = serverWidget.createForm({
                title: 'Màn hình trung gian thống kê số lượng của lô'
            });
            // formPopUp.addSubmitButton("Save");
            formPopUp.addButton({id: 'custpage_btn_save', label: 'Save', functionName: 'handleSearch'});

            let sublistTrunggian = formPopUp.addSublist({
                id: 'sublist_trunggian',
                type: serverWidget.SublistType.LIST,
                label: 'Result'
            });
           sublistTrunggian.addField({
                id: 'so_lo',
                type: serverWidget.FieldType.TEXT,
                label: 'Số lô'
            });

            let trangthaiField = sublistTrunggian.addField({
                id: 'trang_thai_moi',
                type: serverWidget.FieldType.SELECT,
                label: 'Trạng thái mới'
            });

            trangthaiField.addSelectOption({
                value: '',
                text: ''
            });

            let inventoryStatuses = getInventoryStatuses();

            inventoryStatuses.forEach(status => {
                trangthaiField.addSelectOption({
                    value: status.id,
                    text: status.name
                });
            });

            let soLuongField = sublistTrunggian.addField({
                id: 'so_luong',
                type: serverWidget.FieldType.FLOAT,
                label: 'Số lượng'
            });
            soLuongField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });
            let uniqueHeaderNumbers = [];
            let seen = new Set();

            util.each(listDataIQC, function (row, i) {
                let line = listDataIQC[i];
                let headerNumber = line['8_header_inventory_number_display'];
                // let headerNum = line['8_header_inventory_number'];
                // log.error('headerNumber', headerNumber)
                // log.error('headerNum', headerNum)
                if (headerNumber && headerNumber.trim() !== '') {
                    seen.add(headerNumber);
                    uniqueHeaderNumbers.push(headerNumber);
                }
            });

            uniqueHeaderNumbers.forEach(function (headerNumber, index) {
                sublistTrunggian.setSublistValue({
                    id: 'so_lo',
                    value: unReTextXML(headerNumber),
                    line: index
                });
            });

            formPopUp.clientScriptModulePath = "../cs/scv_cs_show_popup.js";
            scriptContext.response.writePage(formPopUp);
        }

        function getInventoryStatuses() {
            let statuses = [];
            let searchObj = search.create({
                type: 'inventorystatus',
                columns: ['internalid', 'name']
            });

            searchObj.run().each(result => {
                statuses.push({
                    id: result.getValue({ name: 'internalid' }),
                    name: result.getValue({ name: 'name' })
                });
                return true;
            });
            return statuses;
        }

        function setSublistValue(listDataIQC, arrLines, sublistResult, sublistLo, params) {
            log.error('arrLines', arrLines)
            log.error('params', params)
            let lineIndex = 0;
            let linelo = 0;
            const fieldResult = [
                {id: 'internal_id', key: '2_internal_id'},
                {id: 'tt_chi_tieu', key: '3_so_thu_tu'},
                {id: 'so_don_dat_hang', key: '4_header_reicept_from_display'},
                {id: 'so_phieu_nhap_kho', key: '5_header_created_from_display'},
                {id: 'so_phieu_kiem_tra', key: '7_inspection_header_display'},
                {id: 'quy_cach_vat_tu', key: '11_tieu_chuan_noi_bo'},
                {id: 'ma_seri_lo', key: '8_header_inventory_number_display'},
                {id: 'cuon', key: '9_header_cuon_so'},
                {id: 'chi_tieu', key: '10_loai_loi_chi_tieu_display'},
                {id: 'ket_qua_kieu_so', key: 'ket_qua_2'},
                {id: 'ket_qua_kieu_chuoi', key: 'ket_qua'},
                {id: 'dat_khong_dat', key: 'dat_khong_dat_display'},
            ];
            const fieldLo = [
                {id: 'stt', key: 'stt'},
                {id: 'mat_hang', key: '12_head_item_display'},
                {id: 'so_lo', key: 'so_lo'},
                {id: 'kho', key: '14_header_kho_display'},
                {id: 'bins', key: '15_header_bin_display'},
                {id: 'trang_thai_hien_tai', key: '16_header_trang_thai_lo_display'},
                {id: 'trang_thai_moi', key: 'trang_thai_moi'},
                {id: 'so_luong', key: 'so_luong'},
            ];

            for (let internalId in listDataIQC) {
                let rs = listDataIQC[internalId];
                fieldResult.forEach(field => {
                    if (rs[field.key]) {
                        let value = field.join ? rs[field.key].join(', ') : rs[field.key];
                        if (typeof value === 'string' && value.length > 300) {
                            value = value.substring(0, 300);
                        }
                        sublistResult.setSublistValue({id: field.id, value: value, line: lineIndex});
                    }
                });
                lineIndex++;``
            }
            if(params.isSaved === "T") {
                let sttCounter = 1;
                for (let data in listDataIQC) {
                    let line = listDataIQC[data];
                    line.stt = sttCounter;
                    fieldLo.forEach(field => {
                        if (line[field.key]) {
                            let value = field.join ? line[field.key].join(', ') : line[field.key];
                            sublistLo.setSublistValue({id: field.id, value: value, line: linelo});
                        }
                    });
                    linelo++;
                    sttCounter++;
                }
            }
        }

        function createSublistResult(form) {
            let sublistResult = form.addSublist({
                id: 'sublist_result',
                type: serverWidget.SublistType.LIST,
                label: 'Result'
            });
            sublistResult.addField({
                id: 'internal_id',
                type: serverWidget.FieldType.TEXT,
                label: 'Internal Id'
            });
            sublistResult.addField({
                id: 'tt_chi_tieu',
                type: serverWidget.FieldType.TEXT,
                label: 'TT Chỉ tiêu'
            });
            sublistResult.addField({
                id: 'so_don_dat_hang',
                type: serverWidget.FieldType.TEXT,
                label: 'Số đơn đặt hàng'
            });
            sublistResult.addField({
                id: 'so_phieu_nhap_kho',
                type: serverWidget.FieldType.TEXT,
                label: 'Số phiếu nhập kho'
            });
            sublistResult.addField({
                id: 'so_phieu_kiem_tra',
                type: serverWidget.FieldType.TEXT,
                label: 'Số phiếu kiểm tra'
            });
            sublistResult.addField({
                id: 'quy_cach_vat_tu',
                type: serverWidget.FieldType.TEXT,
                label: 'Quy cách vật tư'
            });
            sublistResult.addField({
                id: 'ma_seri_lo',
                type: serverWidget.FieldType.TEXT,
                label: 'Mã Seri/Lô'
            });
            sublistResult.addField({
                id: 'cuon',
                type: serverWidget.FieldType.TEXT,
                label: 'Cuộn'
            });
            sublistResult.addField({
                id: 'chi_tieu',
                type: serverWidget.FieldType.TEXT,
                label: 'Chỉ tiêu'
            });
            sublistResult.addField({
                id: 'ket_qua_kieu_so',
                type: serverWidget.FieldType.TEXT,
                label: 'Kết quả (Kiểu số)'
            });
            sublistResult.addField({
                id: 'ket_qua_kieu_chuoi',
                type: serverWidget.FieldType.TEXT,
                label: 'Kết quả (Kiểu chuỗi)'
            });
            sublistResult.addField({
                id: 'dat_khong_dat',
                type: serverWidget.FieldType.TEXT,
                label: 'Đạt/Không đạt'
            });
            return sublistResult;
        }
        function createSublistLo(form) {
            let sublistlo = form.addSublist({
                id: 'sublist_lo',
                type: serverWidget.SublistType.LIST,
                label: 'Thống kê số lượng'
            });
            sublistlo.addButton({id: "custpage_btn_add", label: "ADD", functionName: "addPopUp"});
            sublistlo.addField({
                id: 'stt',
                type: serverWidget.FieldType.TEXT,
                label: 'STT'
            });
            sublistlo.addField({
                id: 'mat_hang',
                type: serverWidget.FieldType.TEXT,
                label: 'Mặt hàng'
            });
            sublistlo.addField({
                id: 'so_lo',
                type: serverWidget.FieldType.TEXT,
                label: 'Số lô'
            });
            sublistlo.addField({
                id: 'kho',
                type: serverWidget.FieldType.TEXT,
                label: 'Kho'
            });
            sublistlo.addField({
                id: 'bins',
                type: serverWidget.FieldType.TEXT,
                label: 'Bins'
            });
            sublistlo.addField({
                id: 'trang_thai_hien_tai',
                type: serverWidget.FieldType.TEXT,
                label: 'Trạng thái hiện tại'
            });
            sublistlo.addField({
                id: 'trang_thai_moi',
                type: serverWidget.FieldType.TEXT,
                label: 'Trạng thái mới'
            });
            sublistlo.addField({
                id: 'so_luong',
                type: serverWidget.FieldType.TEXT,
                label: 'Số luọng'
            });
            return sublistlo;
        }

        function renameFields(data) {
            const normalizeKey = (key) =>
                key
                    .replace(/[\u0000]/g, "")
                    .trim()
                    .replace(/đ/g, "d")
                    .replace(/D/g, "d")
                    .replace(/Đ/g, "d")
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/[^a-zA-Z0-9]/g, "_")
                    .replace(/_+/g, "_")
                    .replace(/^_|_$/g, "")
                    .toLowerCase();

            const sanitizeValue = (value) => {
                return value === null || value === "- None -" ? "" : value;
            };

            return data.map((item) => {
                const renamedItem = {};
                Object.keys(item).forEach((key) => {
                    const newKey = normalizeKey(key);
                    renamedItem[newKey] = sanitizeValue(item[key]);
                });
                return renamedItem;
            });
        }

        function pushFilteIQC(f, params) {
            if (params.custpage_subsidiary) {
                f.push(search.createFilter({
                    name: 'custrecord_scv_iird_subsidiary',
                    operator: search.Operator.ANYOF,
                    values: params.custpage_subsidiary
                }));
            }
            if (params.kho) {
                f.push(search.createFilter({
                    name: 'custrecord_scv_irt_location',
                    join: 'custrecord_scv_ir_irt',
                    operator: search.Operator.ANYOF,
                    values: params.kho
                }));
            }
            if (params.custpage_phieunhapkho) {
                f.push(search.createFilter({
                    name: 'formulatext',
                    formula: 'TO_CHAR({custrecord_scv_ir_irt.custrecord_scv_irt_receipt_no})',
                    operator: search.Operator.CONTAINS,
                    values: `%${params.custpage_phieunhapkho.trim()}%`
                }));
            }
            if (params.custpage_donmuahang) {
                f.push(search.createFilter({
                    name: 'formulatext',
                    formula: 'TO_CHAR({custrecord_scv_ir_irt.custrecord_scv_irt_receipt_from})',
                    operator: search.Operator.CONTAINS,
                    values: `%${params.custpage_donmuahang.trim()}%`
                }));
            }
            if (params.custpage_solo) {
                f.push(search.createFilter({
                    name: 'formulatext',
                    formula: 'TO_CHAR({custrecord_scv_ir_irt.custrecord_scv_irt_inentory_number})',
                    operator: search.Operator.CONTAINS,
                    values: `%${params.custpage_solo.trim()}%`
                }));
            }
            if (params.custpage_mathang) {
                f.push(search.createFilter({
                    name: 'formulatext',
                    formula: 'TO_CHAR({custrecord_scv_ir_irt.custrecord_scv_irt_item})',
                    operator: search.Operator.CONTAINS,
                    values: `%${params.custpage_mathang.trim()}%`
                }));
            }
            if (params.custpage_mahang) {
                f.push(search.createFilter({
                    name: 'formulatext',
                    formula: 'TO_CHAR({custrecord_scv_ir_irt.custrecord_scv_irt_lot_upccode})',
                    operator: search.Operator.CONTAINS,
                    values: `%${params.custpage_mahang.trim()}%`
                }));
            }
            if (params.custpage_phieukiemtra) {
                f.push(search.createFilter({
                    name: 'formulatext',
                    formula: 'TO_CHAR({custrecord_scv_ir_irt.name})',
                    operator: search.Operator.CONTAINS,
                    values: `%${params.custpage_phieukiemtra.trim()}%`
                }));
            }
        }

        const onCreateFormUI = (params, scriptContext) => {
            if (scriptContext.request.method === "GET") {
                let params = scriptContext.request.parameters;
                let mainForm = serverWidget.createForm({title: "Chức năng cập nhật kết quả kiểm tra chất lượng cho nhiều phiếu kiểm tra cùng lúc"});
                mainForm.clientScriptModulePath = "../cs/scv_cs_sl_ktcl_iqc.js";
                let mainGrp = addFieldGroup(mainForm, "fieldgrp_main", "Criteria");
                mainForm.addButton({id: "custpage_btn_search", label: "Search", functionName: "onSearchResult()"});
                mainForm.addButton({id: 'custpage_bt_export', label: 'Submit', functionName: 'submit()'});
                let sub_user = runtime.getCurrentUser().subsidiary;
                let sub = params.custpage_subsidiary ||  sub_user;
                let emp = params.custpage_nguoikiemtra || runtime.getCurrentUser().id;
                let custpage_subsidiary = mainForm.addField({
                    id: "custpage_subsidiary",
                    type: "select",
                    label: "Công ty/Chi nhánh *",
                    container: mainGrp.id,
                    source: "subsidiary"
                });
                if (params.isSearch === 'T' || params.isAdd === "T" || params.isSaved === "T" ) {
                    custpage_subsidiary.defaultValue = params.custpage_subsidiary || '';
                } else {
                    custpage_subsidiary.defaultValue = sub;
                }
                // custpage_subsidiary.isMandatory = true;
                custpage_subsidiary.updateBreakType({breakType: 'STARTCOL'});
                let custpage_phieunhapkho = mainForm.addField({
                    id: "custpage_phieunhapkho",
                    type: "text",
                    label: "Số phiếu nhập kho/ Lệnh sản xuất *",
                    container: mainGrp.id,
                });
                // custpage_phieunhapkho.isMandatory = true;
                if (params.custpage_phieunhapkho) {
                    custpage_phieunhapkho.defaultValue = params.custpage_phieunhapkho;
                }
                let custpage_donmuahang = mainForm.addField({
                    id: "custpage_donmuahang",
                    type: "text",
                    label: "Số đơn mua hàng",
                    container: mainGrp.id,
                });
                if (params.custpage_donmuahang) {
                    custpage_donmuahang.defaultValue = params.custpage_donmuahang;
                }
                let custpage_phieukiemtra = mainForm.addField({
                    id: "custpage_phieukiemtra",
                    type: "text",
                    label: "Số phiếu kiểm tra",
                    container: mainGrp.id,
                });
                if (params.custpage_phieukiemtra) {
                    custpage_phieukiemtra.defaultValue = params.custpage_phieukiemtra;
                }
                let custpage_kho = mainForm.addField({
                    id: "custpage_kho",
                    type: "select",
                    label: "Kho",
                    container: mainGrp.id,
                });
                custpage_kho.addSelectOption({
                    value: '',
                    text: ''
                });
                custpage_kho.updateBreakType({breakType: 'STARTCOL'});
                let c = ['internalid', 'name'];
                let f;
                if (sub) {
                    f = [['subsidiary', 'anyof', sub]];
                } else {
                    f = [];
                }
                lrp.addSelectionMulti(custpage_kho, 'location', c, f, false, splitComa(params.custpage_kho));
                if (params.custpage_kho) {
                    custpage_kho.defaultValue = params.custpage_kho;
                }

                let custpage_solo = mainForm.addField({
                    id: "custpage_solo",
                    type: "text",
                    label: "Số lô",
                    container: mainGrp.id,
                });
                if (params.custpage_solo) {
                    custpage_solo.defaultValue = params.custpage_solo;
                }
                let custpage_mathang = mainForm.addField({
                    id: "custpage_mathang",
                    type: "text",
                    label: "Mặt hàng *",
                    container: mainGrp.id,
                });
                // custpage_mathang.isMandatory = true;
                if (params.custpage_mathang) {
                    custpage_mathang.defaultValue = params.custpage_mathang;
                }
                let custpage_mahang = mainForm.addField({
                    id: "custpage_mahang",
                    type: "text",
                    label: "Mã hàng",
                    container: mainGrp.id,
                });
                if (params.custpage_mahang) {
                    custpage_mahang.defaultValue = params.custpage_mahang;
                }

                let defaultField = addFieldGroup(mainForm, "default", "Default");
                let custpage_ngaylaymau = mainForm.addField({
                    id: "custpage_ngaylaymau",
                    type: serverWidget.FieldType.DATE,
                    label: "Ngày lấy mẫu *",
                    container: defaultField.id,
                });
                custpage_ngaylaymau.updateBreakType({breakType: 'STARTCOL'});
                if (params.custpage_ngaylaymau) {
                    custpage_ngaylaymau.defaultValue = params.custpage_ngaylaymau;
                }
                let custpage_ngaykiemtra = mainForm.addField({
                    id: "custpage_ngaykiemtra",
                    type: serverWidget.FieldType.DATE,
                    label: "Ngày kiểm tra *",
                    container: defaultField.id,
                });
                if (params.custpage_ngaykiemtra) {
                    custpage_ngaykiemtra.defaultValue = params.custpage_ngaykiemtra;
                }
                let custpage_ngayhtkt = mainForm.addField({
                    id: "custpage_ngayhtkt",
                    type: serverWidget.FieldType.DATE,
                    label: "Ngày hoàn thành kiểm tra *",
                    container:defaultField.id,
                });
                if (params.custpage_ngayhtkt) {
                    custpage_ngayhtkt.defaultValue = params.custpage_ngayhtkt;
                }
                let custpage_nguoikiemtra = mainForm.addField({
                    id: "custpage_nguoikiemtra",
                    type: serverWidget.FieldType.SELECT,
                    label: "Người kiểm tra *",
                    container: defaultField.id,
                    source: "employee"
                });
                if (params.isSearch === 'T' || params.isAdd === "T" || params.isSaved === "T" ) {
                    custpage_nguoikiemtra.defaultValue = params.custpage_nguoikiemtra || '';
                } else {
                    custpage_nguoikiemtra.defaultValue = emp;
                }
                custpage_nguoikiemtra.updateBreakType({breakType: 'STARTCOL'});
                let custpage_diengiai = mainForm.addField({
                    id: "custpage_diengiai",
                    type: serverWidget.FieldType.TEXT,
                    label: "Diễn giải *",
                    container: defaultField.id,
                });
                if (params.custpage_diengiai) {
                    custpage_diengiai.defaultValue = params.custpage_diengiai;
                }
                let custpage_ketluanchung = mainForm.addField({
                    id: "custpage_ketluanchung",
                    type: serverWidget.FieldType.SELECT,
                    label: "Kết luận chung *",
                    container: defaultField.id,
                    source: "customlist_scv_conclustion_list"
                });
                if (params.custpage_ketluanchung) {
                    custpage_ketluanchung.defaultValue = params.custpage_ketluanchung;
                }
                custpage_ketluanchung.updateBreakType({breakType: 'STARTCOL'});
                let custpage_ttqc = mainForm.addField({
                    id: "custpage_ttqc",
                    type: serverWidget.FieldType.TEXT,
                    label: "Số TTQC chỉ định *",
                    container: defaultField.id,
                });
                if (params.custpage_ttqc) {
                    custpage_ttqc.defaultValue = params.custpage_ttqc;
                }
                let custpage_serimau = mainForm.addField({
                    id: "custpage_serimau",
                    type: serverWidget.FieldType.TEXT,
                    label: "Số Seri màu *",
                    container: defaultField.id,
                });
                if (params.custpage_serimau) {
                    custpage_serimau.defaultValue = params.custpage_serimau;
                }
                return {form: mainForm};
            }
        };

        function splitComa(input) {
            return input ? util.isArray(input) ? input : input.split('>>>>>>') : input;
        }

        function addFieldGroup(_form, _id, _label) {
            var _obj = {id: _id, label: _label}
            _form.addFieldGroup(_obj);
            return _obj;
        }


        function unReTextXML(text) {
            let cus_name = text
            if (text) {
                cus_name = cus_name.replace(/&/gi, '&amp;');
                cus_name = cus_name.replace(/>/gi, "&gt;");
                cus_name = cus_name.replace(/</gi, "&lt;");
                cus_name = cus_name.replace(/'/g, "&apos;");
                cus_name = cus_name.replace(/"/g, "&quot;");
            }
            return cus_name;
        }

        return {
            onRequest: onRequest
        };
    });
