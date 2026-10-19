/**
 * Nội dung: 
 * Key:
 * * =======================================================================================
 *  Date                Author                  Description
 *  01 Nov 2024         Huy Pham	    		Init, create file. from mr.Bính(Skype)
 *  27 Feb 2025         Huy Pham                Chặn nhập vượt qty, from mr.Hải(https://app.clickup.com/t/86cy3dgvr)
 *  02 Apr 2025         Huy Pham                Đổi công thức Qty Be Receive, from mr.Hải(https://app.clickup.com/t/86cy3dgvr?comment=90160101554424)        
 * 
 */
/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/search',
    '../cons/scv_cons_datastore.js',
    '../cons/scv_cons_record.js',
    '../cons/scv_cons_format.js',

    '../cons/scv_cons_inboundshipment.js'
],

function(search,
    constDataStore,
    constRecord,
    constFormat,

    constInboundShipment
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
        constRecord.setCurrentRecord(scriptContext.currentRecord);
        
        adjustLimitQuantityInput(scriptContext);

        adjustReceiveitemsMarkAll(scriptContext);
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
        let fieldId = scriptContext.fieldId;
        let sublistId = scriptContext.sublistId;
        
        if(["receiveitem", "quantitytobereceived"].includes(fieldId)){
            let arrLine = constDataStore.getDataStore("lines");
            let uniquekey = curRec.getCurrentSublistValue(sublistId, "uniquekey");

            let objLineInbShip = arrLine.find(e => e.uniquekey == uniquekey);
            if(!objLineInbShip) return;

            let quantitytobereceived = curRec.getCurrentSublistValue(sublistId, "quantitytobereceived") * 1;
            if(quantitytobereceived > objLineInbShip.quantityremaining_calc){
                quantitytobereceived = objLineInbShip.quantityremaining_calc;

                curRec.setCurrentSublistValue({
                    sublistId: sublistId, fieldId: "quantitytobereceived",
                    value: quantitytobereceived, ignoreFieldChange: true
                });
            }
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

    const adjustLimitQuantityInput = (scriptContext) => {
        let curRec = scriptContext.currentRecord;
        let sublistId = "receiveitems";
        let sizeSublist = curRec.getLineCount(sublistId);
        
        let arrItemInbShip = constInboundShipment.getDataSourceItem({inboundshipment: curRec.id});
        let arrLine = [];

        for(let i = 0; i < sizeSublist; i++){
            let objLine = {
                uniquekey: curRec.getSublistValue({sublistId: sublistId, fieldId: "uniquekey", line: i}),
                quantityremaining: curRec.getSublistValue({sublistId: sublistId, fieldId: "quantityremaining", line: i}) * 1,
                quantityreceived: curRec.getSublistValue({sublistId: sublistId, fieldId: "quantityreceived", line: i}) * 1,
                quantityremaining_calc: curRec.getSublistValue({sublistId: sublistId, fieldId: "quantityremaining", line: i}) * 1,
            }

            let objItemInbShip = arrItemInbShip.find(e => e.shipmentitemtransaction == objLine.uniquekey);
            if(!!objItemInbShip){
                objLine.quantityexpected = objItemInbShip.quantityexpected * 1;
                objLine.custrecord_scv_inb_positive_tolerance = objItemInbShip.custrecord_scv_inb_positive_tolerance * 1;
            }

            objLine.quantityremaining_calc = objLine.quantityexpected - objLine.quantityreceived;
            objLine.quantityremaining_calc = constFormat.roundNumber(objLine.quantityremaining_calc);
            arrLine.push(objLine);

            curRec.selectLine(sublistId, i);
            curRec.setCurrentSublistValue({sublistId: sublistId, fieldId: "quantityremaining", value: objLine.quantityremaining_calc, ignoreFieldChange: true})
            curRec.setCurrentSublistValue({sublistId: sublistId, fieldId: "quantitytobereceived", value: objLine.quantityremaining_calc, ignoreFieldChange: true})
            curRec.commitLine(sublistId);
        }

        constDataStore.setDataStore("lines", arrLine);
    }

    const adjustReceiveitemsMarkAll = () =>{
        window.receiveitemsMarkAll = (state = true)=>{
            let curRec = constRecord.getCurrentRecord();
            let sublistId = "receiveitems";
            let sizeSublist = curRec.getLineCount(sublistId);
    
            for(let i = 0; i < sizeSublist; i++){
                curRec.selectLine(sublistId, i);
                curRec.setCurrentSublistValue(sublistId, "receiveitem", state);
                curRec.commitLine(sublistId);
    
                window.haslines=state;
            }
        }
    }
    
    return {
        pageInit,
        fieldChanged,
        // postSourcing: postSourcing,
        // sublistChanged: sublistChanged,
        // lineInit: lineInit,
        // validateField: validateField,
        // validateLine: validateLine,
        // validateInsert: validateInsert,
        // validateDelete: validateDelete,
        // saveRecord: saveRecord
    };
    
});
