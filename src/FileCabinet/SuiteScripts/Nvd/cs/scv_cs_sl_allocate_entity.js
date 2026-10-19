/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', '../cons/scv_cons_vendor.js'],

function(currentRecord, constVendor) {
    
    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */
    function pageInit(scriptContext) {

    }

    /**
     * Function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @since 2015.2
     */
    function fieldChanged(scriptContext) {
        let curRec = scriptContext.currentRecord;
        let sublistId = scriptContext.sublistId;
        let fieldId = scriptContext.fieldId;

        if(!sublistId && fieldId === 'custpage_scv_ent_cat') {
            let entCatId = curRec.getValue(fieldId);
            let arrVendor = constVendor.getDataVendorByEntCategory(entCatId);
            loadOptionVendorField(curRec, arrVendor);
        }
    }

    /**
     * Validation function to be executed when record is saved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @returns {boolean} Return true if record is valid
     *
     * @since 2015.2
     */
    function saveRecord(scriptContext) {
        // alert("abc!");
        let sublistId = "custpage_sl_item";
        let curRec = scriptContext.currentRecord;
        
        let objSublist = curRec.getSublist({
            sublistId: sublistId
        });
        if(objSublist === null) {
            return true;
        }

        let objValidAlloQty = checkAllocateQtyVendor(curRec, sublistId);

        if(objValidAlloQty.isConfirm === true) {            
            return confirm(objValidAlloQty.message);
        }
        if(objValidAlloQty.isAllocate === false) {
            alert(objValidAlloQty.message);
            return objValidAlloQty.isAllocate;
        }
        
        return true;
    }

    const checkAllocateQtyVendor = (curRec, sublistId) => {
        let vendor_list = curRec.getValue("custpage_vendor_list");
        let arrVendorId = vendor_list.split(",");

        let totalLine = curRec.getLineCount(sublistId);
        if(totalLine === 0) {
            return {
                isAllocate: false, message: "Không có dữ liệu để thực hiện phân bổ NCC!"
            };
        }
        for(let i = 0; i < totalLine; i++) {
            let total_qty = 0;
            let plan_qty = curRec.getSublistValue(sublistId, "custpage_col_plan_qty", i) * 1;

            arrVendorId.forEach(vendorId => {
                let quantity = curRec.getSublistValue(sublistId, "custpage_col_vendor" + vendorId, i);
                total_qty += quantity * 1;
            });
            if((total_qty > plan_qty) || total_qty == 0) {
                return {
                    isAllocate: false, message: "Bạn đã nhập số lượng phân bổ > plan quantity hoặc chưa nhập số lượng phân bổ!"
                };
            } else if(total_qty < plan_qty) {
                return {
                    isConfirm: true, message: "Bạn đã nhập số lượng phân bổ < plan quantity!"
                };
            }
        }
        return { isAllocate: true, message: "Success." };
    }

    const loadOptionVendorField = (curRec, arrVendor) => {
        let vendorField = curRec.getField("custpage_scv_vendor");
        vendorField.removeSelectOption({value: null});
        for(let objVendor of arrVendor) {
            vendorField.insertSelectOption({
                value: objVendor.internalid,
                text: objVendor.entityid
            });
        }
    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        saveRecord: saveRecord
    };
    
});
