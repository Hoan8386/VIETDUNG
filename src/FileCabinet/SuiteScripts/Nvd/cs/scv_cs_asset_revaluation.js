/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define([], function () {
    function fieldChanged(context) {
        var currentRecord = context.currentRecord;

        // Kiểm tra xem các field liên quan có bị chỉnh sửa hay không
        if (
            context.fieldId === 'custrecord_scv_cmms_tc_age_h' ||
            context.fieldId === 'custrecord_scv_cmms_tc_agecheck_h' ||
            context.fieldId === 'custrecord_scv_cmms_tc_origincost_h' ||
            context.fieldId === 'custrecord_scv_cmms_tc_residualstatus_h'
        ) {
            // Lấy giá trị các trường cần thiết
            var ageValue = currentRecord.getValue({ fieldId: 'custrecord_scv_cmms_tc_age_h' }) || 0;
            var ageCheckValue = currentRecord.getValue({ fieldId: 'custrecord_scv_cmms_tc_agecheck_h' }) || 0;
            var originCost = currentRecord.getValue({ fieldId: 'custrecord_scv_cmms_tc_origincost_h' }) || 0;
            var residualStatus = currentRecord.getValue({ fieldId: 'custrecord_scv_cmms_tc_residualstatus_h' }) || 0;

            // Tính toán custrecord_scv_cmms_tc_remainage_h
            var remainageValue = ageValue - ageCheckValue;

            // Tính toán custrecord_scv_cmms_tc_residualpercent_h
            var residualPercent = (ageValue !== 0) 
                ? ((remainageValue / ageValue) * 100).toFixed(2) 
                : 0;

            // Tính toán custrecord_scv_cmms_tc_deprvalue_h
            var deprValue = (originCost * (residualPercent / 100)).toFixed(2);

            // Tính toán custrecord_scv_cmms_tc_residualvalue_h
            var residualValue = (originCost * residualStatus).toFixed(2);

            // Cập nhật các giá trị vào các trường
            currentRecord.setValue({
                fieldId: 'custrecord_scv_cmms_tc_remainage_h',
                value: remainageValue,
                ignoreFieldChange: true
            });

            currentRecord.setValue({
                fieldId: 'custrecord_scv_cmms_tc_residualpercent_h',
                value: residualPercent,
                ignoreFieldChange: true
            });

            currentRecord.setValue({
                fieldId: 'custrecord_scv_cmms_tc_deprvalue_h',
                value: deprValue,
                ignoreFieldChange: true
            });

            currentRecord.setValue({
                fieldId: 'custrecord_scv_cmms_tc_residualvalue_h',
                value: residualValue,
                ignoreFieldChange: true
            });
        }
    }

    return {
        fieldChanged: fieldChanged
    };
});
