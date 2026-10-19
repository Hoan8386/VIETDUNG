/**
 * Nội dung:
 * ============================================================================================================
 * 	Date			Author				Description
 * 09 Dec 2024		Huy Pham			Init. move from Cpl, chức năng Điều khoản thanh toán, from ms.Ngọc(https://app.clickup.com/t/86cx9a2j9)
 **/
/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', '../lib/scv_lib_term.js'],
function(record, lbt) {
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function beforeSubmit(scriptContext) {
		let triggerType = scriptContext.type;
		if(!["create", "edit", "copy"].includes(triggerType)) return;

		let newRecord = scriptContext.newRecord;
		let recType = newRecord.type;
		if(!["vendorbill", "invoice"].includes(recType)) return;

		let duedate = lbt.calDueDate(newRecord);
		newRecord.setValue('duedate', duedate);
    }

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function afterSubmit(scriptContext) {
		let tgType = scriptContext.type;
		if(!["create", "edit", "copy"].includes(tgType)) return;

		let newRecord = scriptContext.newRecord;
		let recType = newRecord.type;
		if(!["vendorbill", "invoice"].includes(recType)) return;

		let old_duedate = newRecord.getValue("duedate");
		let duedate = lbt.calDueDate(newRecord);

		if(duedate == old_duedate) return;

		record.submitFields.promise({
			type: recType,
			id: newRecord.id,
			values: {
				duedate: duedate
			},
			options: {enableSourcing: false, ignoreMandatoryFields : true}
		}).catch(function(errReason) {
			log.error("ERROR: afterSubmit.record.submitFields.promise.catch: " + newRec.id, errReason)
		});
    }
	
    return {
        beforeSubmit,
        afterSubmit
    };
    
});
