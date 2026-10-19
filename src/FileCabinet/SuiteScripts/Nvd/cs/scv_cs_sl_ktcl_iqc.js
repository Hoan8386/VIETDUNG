/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/search', 'N/url'],

    function (currentRecord, search, url) {

        function onSearchResult() {
            window.onbeforeunload = null;
            let currRecord = currentRecord.get();

            let urlDC = url.resolveScript({
                scriptId: 'customscript_scv_sl_ktcl_iqc',
                deploymentId: 'customdeploy_scv_sl_ktcl_iqc',
                params: {
                    custpage_subsidiary: currRecord.getValue('custpage_subsidiary'),
                    custpage_phieunhapkho: currRecord.getValue('custpage_phieunhapkho'),
                    custpage_donmuahang: currRecord.getValue('custpage_donmuahang'),
                    custpage_phieukiemtra: currRecord.getValue('custpage_phieukiemtra'),
                    custpage_kho: currRecord.getValue('custpage_kho'),
                    custpage_solo: currRecord.getValue('custpage_solo'),
                    custpage_mathang: currRecord.getValue('custpage_mathang'),
                    custpage_mahang: currRecord.getValue('custpage_mahang'),
                    custpage_ketluanchung: currRecord.getValue('custpage_ketluanchung'),
                    custpage_ngaylaymau: currRecord.getValue('custpage_ngaylaymau'),
                    custpage_ngaykiemtra: currRecord.getValue('custpage_ngaykiemtra'),
                    custpage_ngayhtkt: currRecord.getValue('custpage_ngayhtkt'),
                    custpage_nguoikiemtra: currRecord.getValue('custpage_nguoikiemtra'),
                    custpage_diengiai: currRecord.getValue('custpage_diengiai'),
                    custpage_ttqc: currRecord.getValue('custpage_ttqc'),
                    custpage_serimau: currRecord.getValue('custpage_serimau'),
                }
            });
            window.location.replace(`${urlDC}&isSearch=T`);
        }

        function addPopUp() {
            window.onbeforeunload = null;
            let currRecord = currentRecord.get();
            let urlDC = url.resolveScript({
                scriptId: 'customscript_scv_sl_ktcl_iqc',
                deploymentId: 'customdeploy_scv_sl_ktcl_iqc',
                params: {
                    custpage_subsidiary: currRecord.getValue('custpage_subsidiary'),
                    custpage_phieunhapkho: currRecord.getValue('custpage_phieunhapkho'),
                    custpage_donmuahang: currRecord.getValue('custpage_donmuahang'),
                    custpage_phieukiemtra: currRecord.getValue('custpage_phieukiemtra'),
                    custpage_kho: currRecord.getValue('custpage_kho'),
                    custpage_solo: currRecord.getValue('custpage_solo'),
                    custpage_mathang: currRecord.getValue('custpage_mathang'),
                    custpage_mahang: currRecord.getValue('custpage_mahang'),
                    custpage_ketluanchung: currRecord.getValue('custpage_ketluanchung'),
                    custpage_ngaylaymau: currRecord.getText('custpage_ngaylaymau'),
                    custpage_ngaykiemtra: currRecord.getText('custpage_ngaykiemtra'),
                    custpage_ngayhtkt: currRecord.getText('custpage_ngayhtkt'),
                    custpage_nguoikiemtra: currRecord.getValue('custpage_nguoikiemtra'),
                    custpage_diengiai: currRecord.getValue('custpage_diengiai'),
                    custpage_ttqc: currRecord.getValue('custpage_ttqc'),
                    custpage_serimau: currRecord.getValue('custpage_serimau'),
                }
            });
            window.open(`${urlDC}&isAdd=T`, '_blank', 'width=1200,height=1000,scrollbars=yes,resizable=yes');
        }


        function getParam(currentRecord) {
            return {
                custpage_subsidiary: currentRecord.getValue('custpage_subsidiary'),
                custpage_phieunhapkho: currentRecord.getValue('custpage_phieunhapkho'),
                custpage_donmuahang: currentRecord.getValue('custpage_donmuahang'),
                custpage_phieukiemtra: currentRecord.getValue('custpage_phieukiemtra'),
                custpage_kho: currentRecord.getValue('custpage_kho'),
                custpage_solo: currentRecord.getValue('custpage_solo'),
                custpage_mathang: currentRecord.getValue('custpage_mathang'),
                custpage_mahang: currentRecord.getValue('custpage_mahang'),
                custpage_ketluanchung: currentRecord.getValue('custpage_ketluanchung'),
                custpage_ngaylaymau: currentRecord.getText('custpage_ngaylaymau'),
                custpage_ngaykiemtra: currentRecord.getText('custpage_ngaykiemtra'),
                custpage_ngayhtkt: currentRecord.getText('custpage_ngayhtkt'),
                custpage_nguoikiemtra: currentRecord.getValue('custpage_nguoikiemtra'),
                custpage_diengiai: currentRecord.getValue('custpage_diengiai'),
                custpage_ttqc: currentRecord.getValue('custpage_ttqc'),
                custpage_serimau: currentRecord.getValue('custpage_serimau'),
            }
        }

        // function addPopUp() {
        //     let container = document.createElement('div');
        //     container.style.marginTop = '20px';
        //     container.style.border = '1px solid #ccc';
        //     container.style.padding = '10px';
        //     container.style.width = '500px';
        //
        //     let title = document.createElement('h3');
        //     title.innerText = 'Sublist Mới';
        //     container.appendChild(title);
        //
        //     let table = document.createElement('table');
        //     table.style.width = '100%';
        //     table.style.borderCollapse = 'collapse';
        //
        //     let headerRow = document.createElement('tr');
        //     ['Số lô', 'Trạng thái mới', 'Số lượng'].forEach(text => {
        //         let th = document.createElement('th');
        //         th.innerText = text;
        //         th.style.border = '1px solid #000';
        //         th.style.padding = '5px';
        //         th.style.backgroundColor = '#f2f2f2';
        //         headerRow.appendChild(th);
        //     });
        //     table.appendChild(headerRow);
        //     container.appendChild(table);
        //     document.body.appendChild(container);
        // }
        function fieldChanged(scriptContext) {
            let curRec = scriptContext.currentRecord;
            let fieldId = scriptContext.fieldId;

            if (fieldId === 'custpage_subsidiary') {
                let subsidiary = curRec.getValue(fieldId);

                const updateFieldOptions = (fieldId, recordType, filterField, selectedValue) => {
                    let field = curRec.getField(fieldId);
                    field.removeSelectOption({value: null});
                    let columns = ['internalid', 'name'];

                    field.insertSelectOption({
                        value: '',
                        text: ''
                    });
                    let filters = [];
                    if (subsidiary) {
                        filters.push([filterField, 'anyof', subsidiary]);
                    }

                    insertSelection([field], recordType, columns, filters, false, selectedValue);
                };
                updateFieldOptions('custpage_kho', 'location', 'subsidiary', curRec.getValue('custpage_kho'));
            }
        }

        function insertSelection(list_fields, t, c, f, isaddnull, valuedefault) {
            if (list_fields != null) {
                let custpage_field = null;
                let s = search.create({
                    type: t,
                    filters: f,
                    columns: c
                });
                let r = s.runPaged({pageSize: 1000});
                let numPage = r.pageRanges.length;
                let temp, text, isSelected = false, searchPage, numTemp, tempData;
                for (let i in list_fields) {
                    custpage_field = list_fields[i];
                    if (custpage_field != null) {
                        custpage_field.removeSelectOption({value: null});
                        custpage_field.insertSelectOption({value: '', text: ''});
                        if (isaddnull) {
                        }
                        if (numPage > 0) {
                            for (let np = 0; np < numPage; np++) {
                                searchPage = r.fetch({index: np});
                                tempData = searchPage.data;
                                if (isContainValue(tempData)) {
                                    numTemp = tempData.length;
                                    for (let idx = 0; idx < numTemp; idx++) {
                                        temp = tempData[idx].getValue(c[0]);
                                        text = tempData[idx].getValue(c[1]);
                                        isSelected = valuedefault && (util.isArray(valuedefault) ? valuedefault.includes(temp) : temp === valuedefault);
                                        custpage_field.insertSelectOption({
                                            value: temp,
                                            text: text,
                                            isSelected: isSelected
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        function isContainValue(value) {
            let isContain = false;
            if (value !== undefined && value !== null && value !== '') {
                if (util.isArray(value)) {
                    if (value.length > 0) {
                        isContain = true;
                    }
                } else {
                    isContain = true;
                }
            }
            return isContain;
        }

        // function receiveDataFromPopup(data) {
        //     let arrLines = JSON.parse(data);
        //     let currRecord = currentRecord.get();
        //     let linelo = 0;
        //     console.log('arrLines', arrLines)
        //     console.log('currRecord', currRecord)
        //     // Cập nhật sublist với dữ liệu mới
        //     arrLines.forEach(function (line) {
        //         currRecord.setSublistValue({
        //             sublistId: 'sublist_lo',
        //             fieldId: 'so_lo',
        //             line: linelo,
        //             value: line.so_lo,
        //         });
        //         currRecord.setSublistValue({
        //             sublistId: 'sublist_lo',
        //             fieldId: 'trang_thai_moi',
        //             line: linelo,
        //             value: line.trang_thai_moi,
        //         });
        //         currRecord.setSublistValue({
        //             sublistId: 'sublist_lo',
        //             fieldId: 'so_luong',
        //             line: linelo,
        //             value: line.so_luong,
        //         });
        //         linelo++;
        //     });
        // }


        return {
            fieldChanged: fieldChanged,
            onSearchResult: onSearchResult,
            addPopUp: addPopUp,
            // receiveDataFromPopup: receiveDataFromPopup


        };
    });
