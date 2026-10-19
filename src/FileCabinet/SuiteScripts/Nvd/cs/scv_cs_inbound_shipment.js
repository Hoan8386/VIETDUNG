/**
 * Nội dung:
 * =======================================================================================
 * Date                 Author                  Description
 * 26 Feb 2025          Khanh Tran   		    Init, create file
 * 27 Feb 2025          Khanh Tran              Bổ sung field mapping từ PO, from mr.Hải(https://app.clickup.com/t/86cy2wj9m)
 * 18 Apr 2025          Khanh Tran	 	        Phát triển tính các giá trị trên IB from Mr.Hải(https://app.clickup.com/t/86cyknytj)
 */
/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([
    '../cons/scv_cons_tolerance_values.js',
    '../cons/scv_cons_search.js',
],
function(
    constTolVal,
    constSearch
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
       debugger
       window.scv_currentRecord = scriptContext.currentRecord;
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
    	if(sublistId == "items"){
            if(fieldId == "shipmentitem"){
                fieldChanged_ShipmentItem(curRec, sublistId)
            }

            constTolVal.handleFiedTolerance(curRec, fieldId);
        }
    }

    const fieldChanged_ShipmentItem = (_curRec, _sublistId) =>{
        let poId = _curRec.getCurrentSublistValue(_sublistId, "purchaseorder");
        if(!poId) return;

        let shipmentitem = _curRec.getCurrentSublistValue(_sublistId, "shipmentitem");
        if(!shipmentitem) return;

        let resultSearch = constSearch.createSearchWithFilter({
			type: "transaction",
			filters: [
				["type","anyof","PurchOrd"], 
                "AND", 
                ["lineuniquekey","equalto", shipmentitem], 
                "AND", 
                ["internalid","anyof", poId]
			],
			columns: [
                "lineuniquekey", "item", "custcol_scv_po_properties", 
                "custcol_scv_acceptance_classification", "custcol_scv_item_eng_name", "custcol_scv_so_kho_rong",
                "custcol_scv_so_chieu_dai", "custcol_scv_po_ddn", "custcol_scv_po_ls", "custcol_scv_po_alu_label", 
                "custcol_scv_po_hardness", "custcol_scv_upc_code", "custcol_scv_ori_lineid", "custcol_scv_market_number", 
                "custcol_scv_qty_before_tolerance", "custcol_scv_memo", "custcol_scv_po_unit_conversion_rate", 
                "custcol_scv_po_converted_unit_price", "custcol_scv_po_converted_amount", "custcol_scv_converted_uom"
			]
		});

        let arrResult = constSearch.fetchResultSearchRunEach(resultSearch, function(_objLine, _columns){
            return constSearch.getObjResultFromSearchByKey(_objLine, _columns, [
                "lineuniquekey", "item", "custcol_scv_po_properties", 
                "custcol_scv_acceptance_classification", "custcol_scv_item_eng_name", "custcol_scv_so_kho_rong",
                "custcol_scv_so_chieu_dai", "custcol_scv_po_ddn", "custcol_scv_po_ls", "custcol_scv_po_alu_label", 
                "custcol_scv_po_hardness", "custcol_scv_upc_code", "custcol_scv_ori_lineid", "custcol_scv_market_number", 
                "custcol_scv_qty_before_tolerance", "custcol_scv_memo", "custcol_scv_po_unit_conversion_rate", 
                "custcol_scv_po_converted_unit_price", "custcol_scv_po_converted_amount", "custcol_scv_converted_uom"
            ])
        });

        if(arrResult.length == 0) return;
        
        let objRes = arrResult[0];
        _curRec.setValue("custrecord_scv_inb_po", poId);
        _curRec.setCurrentSublistValue(_sublistId, "custrecord_scv_inb_properties", objRes.custcol_scv_po_properties);
        _curRec.setCurrentSublistValue(_sublistId, "custrecord_scv_inb_ship_accept_classifi", objRes.custcol_scv_acceptance_classification);
        _curRec.setCurrentSublistValue(_sublistId, "custrecord_scv_inb_item_eng_name", objRes.custcol_scv_item_eng_name);
        _curRec.setCurrentSublistValue(_sublistId, "custrecord_scv_inb_kho_rong", objRes.custcol_scv_so_kho_rong);
        _curRec.setCurrentSublistValue(_sublistId, "custrecord_scv_inb_chieu_dai", objRes.custcol_scv_so_chieu_dai);
        _curRec.setCurrentSublistValue(_sublistId, "custrecord_scv_inb_ddn", objRes.custcol_scv_po_ddn);
        _curRec.setCurrentSublistValue(_sublistId, "custrecord_scv_inb_ls", objRes.custcol_scv_po_ls);
        _curRec.setCurrentSublistValue(_sublistId, "custrecord_scv_inb_alu_label", objRes.custcol_scv_po_alu_label);
        _curRec.setCurrentSublistValue(_sublistId, "custrecord_scv_inb_hardness", objRes.custcol_scv_po_hardness);
        _curRec.setCurrentSublistValue(_sublistId, "custrecord_scv_inbound_upc_code", objRes.custcol_scv_upc_code);
        _curRec.setCurrentSublistValue(_sublistId, "custrecord_scv_inbound_ori_lineid", objRes.custcol_scv_ori_lineid);
        _curRec.setCurrentSublistValue(_sublistId, "custrecord_scv_market_number", objRes.custcol_scv_market_number);
        _curRec.setCurrentSublistValue(_sublistId, "custrecord_scv_po_qty_before_tolerance", objRes.custcol_scv_qty_before_tolerance);
        _curRec.setCurrentSublistValue(_sublistId, "custrecord_scv_po_note", objRes.custcol_scv_memo);
        _curRec.setCurrentSublistValue(_sublistId, "custrecord_scv_po_unit_conversion_rate", objRes.custcol_scv_po_unit_conversion_rate);
        _curRec.setCurrentSublistValue(_sublistId, "custrecord_scv_po_converted_unit_price", objRes.custcol_scv_po_converted_unit_price);
        _curRec.setCurrentSublistValue(_sublistId, "custrecord_scv_po_converted_amount", objRes.custcol_scv_po_converted_amount);
        _curRec.setCurrentSublistValue(_sublistId, "custrecord_scv_converted_uom", objRes.custcol_scv_converted_uom);
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
        let curRec = scriptContext.currentRecord;
        let sublistId = scriptContext.sublistId;

    	if(sublistId == "items"){
            try {
                constTolVal.calcLine_ExpectedRate(curRec, sublistId);//Chuyển sang validateLine để tránh khi add po items bị hệ thống ghi đè data 
            } catch (error) {
                console.error('validateLine', error);
            } 
        }

        return true;
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
    
    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        // postSourcing: postSourcing,
        // sublistChanged: sublistChanged,
        // lineInit: lineInit,
        // validateField: validateField,
        validateLine: validateLine,
        // validateInsert: validateInsert,
        // validateDelete: validateDelete,
        // saveRecord: saveRecord,
    };
    
});
