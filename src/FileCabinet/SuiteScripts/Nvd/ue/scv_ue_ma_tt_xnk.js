/**
 * Nội dung:
 * Key:
 * * =======================================================================================
 *  Date                Author                  Description
 *  ?                   ?                       ?
 *  06 Aug 2025         Thành Ngô                 Create file check trùng mã thanh toán form Ms Kỳ (https://app.clickup.com/t/86czwru9k)
 *
 **/

/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['../common/scv_common_ma_tt_xnk'],

    (comMaTt) => {
        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (scriptContext) => {
            let newRecord = scriptContext.newRecord;
            log.error('new', newRecord.id)
            if (comMaTt.trungMaThanhToan(newRecord)) {
                throw new Error(`Mã thanh toán ${newRecord.getValue('name')} đã tồn tại.`);
            }
        }

        return {
            beforeSubmit,
        }

    });
