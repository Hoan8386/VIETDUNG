/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/https', 'N/url', 'N/log'], function(currentRecord, https, url, log) {

    // Hàm xử lý sự kiện khi form được tải
    function pageInit(context) {
        // Có thể kiểm tra trạng thái của form khi tải
        debugger;  // Kiểm tra khi trang được tải
    }

    // Hàm chọn tất cả checkbox
    function selectAllCheckboxes() {
        var recCurr = currentRecord.get();  // Lấy đối tượng record hiện tại
        var sublistId = 'item_sublist';  // ID của sublist cần thao tác
        var lineCount = recCurr.getLineCount({ sublistId: sublistId });  // Đếm số dòng trong sublist

        // Duyệt qua các dòng trong sublist
        for (var i = 0; i < lineCount; i++) {
            // Chọn từng dòng
            recCurr.selectLine({
                sublistId: sublistId,
                line: i
            });

            // Đặt giá trị checkbox là true
            recCurr.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'select_line',  // ID của trường checkbox
                value: true
            });

            // Commit thay đổi
            recCurr.commitLine({
                sublistId: sublistId
            });
        }
    }

    // Hàm bỏ chọn tất cả checkbox
    function deselectAllCheckboxes() {
        var recCurr = currentRecord.get();  // Lấy đối tượng record hiện tại
        var sublistId = 'item_sublist';  // ID của sublist cần thao tác
        var lineCount = recCurr.getLineCount({ sublistId: sublistId });  // Đếm số dòng trong sublist

        // Duyệt qua các dòng trong sublist
        for (var i = 0; i < lineCount; i++) {
            // Chọn từng dòng
            recCurr.selectLine({
                sublistId: sublistId,
                line: i
            });

            // Đặt giá trị checkbox là false
            recCurr.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'select_line',  // ID của trường checkbox
                value: false
            });

            // Commit thay đổi
            recCurr.commitLine({
                sublistId: sublistId
            });
        }
    }

    // Hàm xử lý đóng các dòng đã chọn
    function closeSelectedLines() {
        var recCurr = currentRecord.get();
        var sublistId = 'item_sublist';
        var selectedLines = [];
        var lineCount = recCurr.getLineCount({ sublistId: sublistId });

        for (var i = 0; i < lineCount; i++) {
            var isSelected = recCurr.getSublistValue({
                sublistId: sublistId,
                fieldId: 'select_line',
                line: i
            });
            if (isSelected) {
                var lineId = recCurr.getSublistValue({
                    sublistId: sublistId,
                    fieldId: 'line_id',
                    line: i
                });
                if (lineId) {
                    selectedLines.push(lineId);
                }
            }
        }

        if (selectedLines.length === 0) {
            alert('Please select at least one line to close.');
            return;
        }

        var recordId = recCurr.getValue({fieldId: 'po_record_id'});;
        var type = recCurr.getValue({fieldId: 'record_type'});;

        var suiteletUrl = url.resolveScript({
            scriptId: 'customscriptsl_close_line_transaction',
            deploymentId: 'customdeploysl_close_line_ts'
        });

        https.post.promise({
            url: suiteletUrl,
            body: JSON.stringify({
                recordId: recordId,
                selectedLines: selectedLines,
                rectype: type,
            }),
            headers: { 'Content-Type': 'application/json' }
        }).then(function(response) {
            log.debug('Response', response.body);
            alert('Close lines completed!');
            window.close();
        }).catch(function(error) {
            log.error('Error posting to Suitelet', error);
            alert('Error occurred while closing lines.');
        });
    }

    // Hàm xử lý đóng các dòng đã chọn
    function openSelectedLines() {
        var recCurr = currentRecord.get();
        var sublistId = 'item_sublist';
        var selectedLines = [];
        var lineCount = recCurr.getLineCount({ sublistId: sublistId });

        for (var i = 0; i < lineCount; i++) {
            var isSelected = recCurr.getSublistValue({
                sublistId: sublistId,
                fieldId: 'select_line',
                line: i
            });
            if (isSelected) {
                var lineId = recCurr.getSublistValue({
                    sublistId: sublistId,
                    fieldId: 'line_id',
                    line: i
                });
                if (lineId) {
                    selectedLines.push(lineId);
                }
            }
        }

        if (selectedLines.length === 0) {
            alert('Please select at least one line to close.');
            return;
        }

        var recordId = recCurr.getValue({fieldId: 'po_record_id'});;
        var type = recCurr.getValue({fieldId: 'record_type'});;

        var suiteletUrl = url.resolveScript({
            scriptId: 'customscript_sl_open_line_transaction',
            deploymentId: 'customdeploy_sl_open_line_ts'
        });

        https.post.promise({
            url: suiteletUrl,
            body: JSON.stringify({
                recordId: recordId,
                selectedLines: selectedLines,
                rectype: type,
            }),
            headers: { 'Content-Type': 'application/json' }
        }).then(function(response) {
            log.debug('Response', response.body);
            alert('Open lines completed!');
            window.close();
        }).catch(function(error) {
            log.error('Error posting to Suitelet', error);
            alert('Error occurred while closing lines.');
        });
    }



    return {
        pageInit: pageInit,
        selectAllCheckboxes: selectAllCheckboxes,
        deselectAllCheckboxes: deselectAllCheckboxes,
        closeSelectedLines: closeSelectedLines,
        openSelectedLines: openSelectedLines,
    };
});
