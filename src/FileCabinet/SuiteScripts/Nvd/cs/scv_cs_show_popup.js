/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/search', 'N/url'],

    function (currentRecord, search, url) {

        function handleSearch() {
            window.onbeforeunload = null;
            let currRecord = currentRecord.get();
            let arrLines = [];
            let lineCount = currRecord.getLineCount({ sublistId: 'sublist_trunggian' });
            for (let i = 0; i < lineCount; i++) {
                let soLo = currRecord.getSublistValue({ sublistId: 'sublist_trunggian', fieldId: 'so_lo', line: i });
                let trangThaiMoi = currRecord.getSublistValue({ sublistId: 'sublist_trunggian', fieldId: 'trang_thai_moi', line: i });
                let soLuong = currRecord.getSublistValue({ sublistId: 'sublist_trunggian', fieldId: 'so_luong', line: i });
                if ((trangThaiMoi && trangThaiMoi.trim() !== '') || (soLuong && soLuong.trim() !== '')) {
                    arrLines.push({
                        so_lo: soLo,
                        trang_thai_moi: trangThaiMoi,
                        so_luong: soLuong,
                    });
                }
            }
            let jsonData = JSON.stringify(arrLines);
            let urlDC = url.resolveScript({
                            scriptId: 'customscript_scv_sl_ktcl_iqc',
                            deploymentId: 'customdeploy_scv_sl_ktcl_iqc',
                            params: {
                                arrLines: jsonData,
                            }
                        });

            if (window.opener && window.opener.receiveDataFromPopup) {
                window.opener.receiveDataFromPopup(jsonData);
            }

            window.close();

            window.opener.location.reload(`&isSaved=T`);
            window.location.replace(`${urlDC}&isSaved=T`);
        }

        return {
            // pageInit: pageInit,
            handleSearch: handleSearch
        };

    });
