/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/record', 'N/log', 'N/url', 'N/https'], function(serverWidget, record, log, url, https) {
    function onRequest(context) {
        const form = serverWidget.createForm({
            title: 'Open line Transaction'
        });

        if (context.request.method === 'GET') {
            // Xử lý yêu cầu GET để hiển thị form

            const recordId = context.request.parameters.recordId;
            const rectype = context.request.parameters.rectype;
            let poRecord;
            if (rectype === 'purchaseorder') {
                poRecord = record.load({
                    type: record.Type.PURCHASE_ORDER,
                    id: recordId
                });
            }
            if (rectype === 'custompurchase_scv_purchase_request') {
                poRecord = record.load({
                    type: 'custompurchase_scv_purchase_request',
                    id: recordId
                });
            }

            // Thêm trường để lưu ID của PO Record
            const field = form.addField({
                id: 'po_record_id',
                type: serverWidget.FieldType.TEXT,
                label: 'Purchase Order ID'
            });
            field.defaultValue = poRecord.id.toString(); // Gán giá trị mặc định
            field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN }); // Đặt kiểu hiển thị thành ẩn

            const type = form.addField({
                id: 'record_type',
                type: serverWidget.FieldType.TEXT,
                label: 'Purchase Order ID'
            });
            type.defaultValue = poRecord.type; // Gán giá trị mặc định
            type.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN }); // Đặt kiểu hiển thị thành ẩ

            // Tạo sublist để hiển thị thông tin item
            const sublist = form.addSublist({
                id: 'item_sublist',
                label: 'Items',
                type: serverWidget.SublistType.LIST
            });

            // Thêm trường checkbox vào sublist
            sublist.addField({
                id: 'select_line',
                label: 'Select',
                type: serverWidget.FieldType.CHECKBOX
            });

            // Thêm các trường vào sublist
            sublist.addField({
                id: 'item',
                label: 'Item',
                type: serverWidget.FieldType.TEXT
            });

            sublist.addField({
                id: 'quantity',
                label: 'Quantity',
                type: serverWidget.FieldType.INTEGER
            });

            sublist.addField({
                id: 'units_display',
                label: 'Đơn vị tính',
                type: serverWidget.FieldType.TEXT
            });

            sublist.addField({
                id: 'line_id',
                label: 'Ori line ID',
                type: serverWidget.FieldType.TEXT
            });

            // Lấy thông tin item từ Purchase Order
            const lineCount = poRecord.getLineCount({ sublistId: 'item' });
            let sublistIndex = 0; // Biến đếm dòng hợp lệ trong sublist

            for (let i = 0; i < lineCount; i++) {
                let isSelected;
                if (rectype === 'purchaseorder') {
                    isSelected = poRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'isclosed',
                        line: i
                    });
                } else if (rectype === 'custompurchase_scv_purchase_request') {
                    isSelected = poRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_scv_cancel',
                        line: i
                    });
                }

                // Chỉ thêm vào sublist nếu isSelected !== false
                if (isSelected !== false) {
                    const item = poRecord.getSublistText({ sublistId: 'item', fieldId: 'item', line: i }) || '';
                    const quantity = poRecord.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i }) || 0;
                    const unitsDisplay = poRecord.getSublistText({ sublistId: 'item', fieldId: 'units_display', line: i }) || '';
                    const lineId = poRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_scv_ori_lineid', line: i }) || '';

                    // Gán vào sublist với chỉ số dòng mới
                    sublist.setSublistValue({ id: 'item', line: sublistIndex, value: item });
                    sublist.setSublistValue({ id: 'quantity', line: sublistIndex, value: quantity.toString() });
                    sublist.setSublistValue({ id: 'units_display', line: sublistIndex, value: unitsDisplay });
                    sublist.setSublistValue({ id: 'line_id', line: sublistIndex, value: lineId.toString() });

                    sublistIndex++; // Tăng index chỉ khi một dòng hợp lệ được thêm vào sublist
                }
            }


            // Thêm các nút vào form
            form.addButton({
                id: 'select_all',
                label: 'Mark All',
                functionName: 'selectAllCheckboxes'
            });

            form.addButton({
                id: 'deselect_all',
                label: 'Unmark All',
                functionName: 'deselectAllCheckboxes'
            });

            form.addButton({
                id: 'open_line',
                label: 'Open Line',
                functionName: 'openSelectedLines'
            });

            // Thêm JavaScript vào form
            form.clientScriptModulePath = '../cs/scv_cs_close_line_transaction.js';

            // Trả lại form với sublist đã được điền thông tin
            context.response.writePage(form);

        } else if (context.request.method === 'POST') {
            // Lấy dữ liệu từ body POST
            const body = JSON.parse(context.request.body);
            const recordId = body.recordId; // Lấy recordId từ body
            const rectype = body.rectype; // Lấy recordId từ body
            log.audit('body', body);

            if (!recordId) {
                throw new Error('Record ID is missing or invalid.');
            }

            let selectedLines = body.selectedLines; // Lấy selectedLines từ body

            // Kiểm tra nếu selectedLines không phải là mảng, chuyển đổi nó thành mảng
            if (typeof selectedLines === 'string') {
                selectedLines = selectedLines.split(','); // Chia chuỗi thành mảng
            } else if (!Array.isArray(selectedLines)) {
                selectedLines = [selectedLines]; // Chuyển đổi thành mảng nếu không phải là mảng
            }

            let poRecord;
            if (rectype === 'purchaseorder') {
                poRecord = record.load({
                    type: record.Type.PURCHASE_ORDER,
                    id: recordId,
                    isDynamic: false
                });
            } else if (rectype === 'custompurchase_scv_purchase_request') {
                poRecord = record.load({
                    type: 'custompurchase_scv_purchase_request',
                    id: recordId,
                    isDynamic: false
                });
            }

            const poLineCount = poRecord.getLineCount({ sublistId: 'item' });
            // Lặp qua các lineId đã chọn
            selectedLines.forEach(function (lineId) {
                let lineFound = false;

                for (let j = 0; j < poLineCount; j++) {
                    const poLineOriId = poRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_scv_ori_lineid', // Đảm bảo trường này tồn tại
                        line: j
                    });

                    if (poLineOriId && poLineOriId.toString() === lineId.toString()) {
                        // Đánh dấu dòng là đã mở
                        if (rectype === 'purchaseorder') {
                            poRecord.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'isclosed',
                                line: j,
                                value: false
                            });
                        }
                        if (rectype === 'custompurchase_scv_purchase_request') {
                            poRecord.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_scv_cancel',
                                line: j,
                                value: false
                            });
                        }
                        break;
                    }
                    lineFound = true;
                }

                if (!lineFound) {
                    log.error('Line not found', { lineId: lineId });
                }
            });

            // Flag để kiểm tra nếu tất cả các dòng đều được đóng
            let allLinesClosed = true;

            // Kiểm tra trạng thái đóng của dòng sau khi đã đánh dấu
            for (let j = 0; j < poLineCount; j++) {
                const poLineOriId = poRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_scv_ori_lineid', // Đảm bảo trường này tồn tại
                    line: j
                });

                if (poLineOriId) {
                    let isLineClosed = false;
                    if (rectype === 'purchaseorder') {
                        isLineClosed = poRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'isclosed',
                            line: j
                        });
                    }
                    if (rectype === 'custompurchase_scv_purchase_request') {
                        isLineClosed = poRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_scv_cancel',
                            line: j
                        });
                    }

                    if (!isLineClosed) {
                        allLinesClosed = false; // Nếu bất kỳ dòng nào không đóng, set flag thành false
                    }
                }
            }
            log.error('allLinesClosed', allLinesClosed);

            if (allLinesClosed) {
                poRecord.setValue({
                    fieldId: 'custbody_scv_approval_status',
                    value: 5 // Set ID của giá trị bạn muốn
                });
            } else{
                poRecord.setValue({
                    fieldId: 'custbody_scv_approval_status',
                    value: 3 // Set ID của giá trị thành đã phê duyệt
                });
            }

          

            // Lưu lại PO sau khi update
            const poId = poRecord.save({
                enableSourcing: false,
                ignoreMandatoryFields: true
            });

            context.response.writePage(form);

        }
    }

    return {
        onRequest: onRequest
    };
});
