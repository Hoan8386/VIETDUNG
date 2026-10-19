/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/ui/serverWidget'], function(serverWidget) {

    function beforeLoad(context) {
        // Chỉ xử lý khi ở chế độ xem
        if (context.type !== context.UserEventType.VIEW) return;

        var rec = context.newRecord;

        // Kiểm tra field checkbox
        var isDisabled = rec.getValue({
            fieldId: 'custbody_scv_disable_edit'
        });

        if (isDisabled === true) {
            try {
                context.form.removeButton({ id: 'edit' });
            } catch (e) {
                log.error('Lỗi khi ẩn nút Edit', e);
            }
        }
    }

    return {
        beforeLoad: beforeLoad
    };
});