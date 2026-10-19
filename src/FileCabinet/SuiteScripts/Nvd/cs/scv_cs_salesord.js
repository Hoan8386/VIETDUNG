/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  19 Nov 2024         Khanh Tran              Init, create file. Tính giá cơ sở của Item theo Conversion Rate case 1.3, from ms.Ngọc(https://app.clickup.com/t/86cx3r94u)
 *  03 Dec 2024         Phu Pham                Set Price level = Custom và Rate = 0 trên Sales Order from ms. Ngọc (https://app.clickup.com/t/86cx7rp7m)
 *  03 June 2025        Khanh Tran              Tính các giá trị trên SO (theo dung sai), from ms.Ngọc(https://app.clickup.com/t/86cz4f1c2)
 */
/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([
   '../cons/scv_cons_inventory_balance.js',
   '../cons/scv_cons_saleschannel.js',
   '../cons/scv_cons_format.js',
    '../cons/scv_cons_tolerance_values.js',
],

function(
    constInvBalance,
    constSalesChannel,
    constFormat,
    constTolVal
) {
    
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
        let curRec = scriptContext.currentRecord;
        constInvBalance.addButtonSelectLotOnMachineRow(scriptContext.currentRecord);
          
        constTolVal.setTotalOfFieldsSublist(curRec);
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
        calcRateSalesChannelXuatKhau(scriptContext);   

        if(sublistId === "item"){
            constTolVal.handleFiedTolerance(curRec, fieldId);
        }
    }

    /**
     * Function to be executed when field is slaved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     *
     * @since 2015.2
     */
    function postSourcing(scriptContext) {
        onPostSourcingItemSublist(scriptContext);
    }

    /**
     * Function to be executed after sublist is inserted, removed, or edited.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @since 2015.2
     */
    function sublistChanged(scriptContext) {
        let curRec = scriptContext.currentRecord
        constTolVal.setTotalOfFieldsSublist(curRec);
    }

    /**
     * Function to be executed after line is selected.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @since 2015.2
     */
    function lineInit(scriptContext) {
    }

    /**
     * Validation function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @returns {boolean} Return true if field is valid
     *
     * @since 2015.2
     */
    function validateField(scriptContext) {

    }

    /**
     * Validation function to be executed when sublist line is committed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateLine(scriptContext) {

    }

    /**
     * Validation function to be executed when sublist line is inserted.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateInsert(scriptContext) {

    }

    /**
     * Validation function to be executed when record is deleted.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateDelete(scriptContext) {

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

    }

    const calcRateSalesChannelXuatKhau = (scriptContext) => {
        let curRec = scriptContext.currentRecord;
        let sublistId = scriptContext.sublistId;
        let fieldId = scriptContext.fieldId;
        let salesChannelId = curRec.getValue("cseg_scv_sc");

        if(salesChannelId != constSalesChannel.RECORDS.XUAT_KHAU.ID) return;

        if(
            sublistId === 'item' &&
            ["custcol_scv_so_don_gia_m2", "custcol_scv_so_kho_rong", "custcol_scv_so_chieu_dai"].includes(fieldId)
        ) {
            let don_gia_m2 = curRec.getCurrentSublistValue(sublistId, "custcol_scv_so_don_gia_m2");
            let kho_rong = curRec.getCurrentSublistValue(sublistId, "custcol_scv_so_kho_rong");
            let chieu_dai = curRec.getCurrentSublistValue(sublistId, "custcol_scv_so_chieu_dai");

            // if(!!don_gia_m2) {
                let rate = don_gia_m2 * (kho_rong / 1000) * (chieu_dai / 1000);
                curRec.setCurrentSublistValue(sublistId, "rate", constFormat.roundNumber(rate, 2));
            // }
        }
    }

    const onPostSourcingItemSublist = (scriptContext) => {
        let curRec = scriptContext.currentRecord;
        let sublistId = scriptContext.sublistId;
        let fieldId = scriptContext.fieldId;

        if(sublistId === 'item' && fieldId === 'item') {
            let salesChannelId = curRec.getValue("cseg_scv_sc");
            curRec.setCurrentSublistValue(sublistId, "pricelevel", -1);
            if(salesChannelId != constSalesChannel.RECORDS.XUAT_KHAU.ID) {
                curRec.setCurrentSublistValue(sublistId, "rate", 0);
            }
        }
    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        postSourcing: postSourcing,
        sublistChanged: sublistChanged,
        //lineInit: lineInit,
        // validateField: validateField,
        // validateLine: validateLine,
        // validateInsert: validateInsert,
        // validateDelete: validateDelete,
        // saveRecord: saveRecord
    };
    
});
