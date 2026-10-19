/**
 * Nội dung: 
 * Key:v3
 * * =======================================================================================
 *  Date                Author                  Description
 *  22 Jan 2025         Khanh Tran	    		Init, create file.
 *  15 Apr 2025         Khanh Tran	    		Phát triển tính các giá trị trên PO  và ITR from Ms.Kỳ(https://app.clickup.com/t/86cyknytj)
 *  11 Jul 2025         Khanh Tran	    		Cảnh báo chỉnh sửa số lượng PO vượt số lượng PR ở trạng thái edit PO from Mr.Hải(https://app.clickup.com/t/86czk7kay)
 *  */
/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/search',
    '../cons/scv_cons_search_pr_create_po.js', 
    '../cons/scv_cons_search_list_po.js', 
    '../cons/scv_cons_tolerance_values.js',
],

function(search,
    constSearchPRCrtPO,
    constSearchListPO,
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
        let fieldId = scriptContext.fieldId;
        let sublistId = scriptContext.sublistId;
        if(sublistId === "item"){
            constTolVal.handleFiedTolerance(curRec, fieldId);
        }else{
            if(fieldId == 'custbody_scv_phu_luc'){
                let tranid = curRec.getValue('tranid');
                if(tranid){
                    tranid = tranid.split('-')[0];
                    let phu_luc = curRec.getValue('custbody_scv_phu_luc');
                    if(phu_luc) tranid += "-" + phu_luc;
                    curRec.setValue('tranid', tranid);
                }
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
        let curRec = scriptContext.currentRecord;

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
        window.onbeforeunload = null;
        if(!checkQtyPoOverPr(scriptContext)) return false;

        return true;
    }

    const checkQtyPoOverPr = (scriptContext) => {
        if(!scriptContext.currentRecord.id) return true;

        let curRec = scriptContext.currentRecord;
        let sublistId = 'item';
        let arrSlItem = [], oriLineIds = [];
        let message = '';
        for(let i = 0; i < curRec.getLineCount(sublistId); i++){
            let ori_lineid = curRec.getSublistValue(sublistId, 'custcol_scv_ori_lineid', i);
            let purchase_request_number = curRec.getSublistValue(sublistId, 'custcol_scv_purchase_request_number', i);
            if(!ori_lineid || !purchase_request_number) continue;

            let obj = {ori_lineid};
            obj.item_display = curRec.getSublistValue(sublistId, 'item_display', i);
            obj.quantity = curRec.getSublistValue(sublistId, 'custcol_scv_qty_before_tolerance', i) * 1;
            obj.pr_id = curRec.getSublistValue(sublistId, 'custcol_scv_sumtrans_line_originno', i) * 1;
            oriLineIds.push(ori_lineid);
            arrSlItem.push(obj);
        }

        if(!oriLineIds.length) return true;
        let arrSS1 = constSearchPRCrtPO.getDataSource([
            search.createFilter({name: 'formulanumeric', formula: `CASE WHEN {custcol_scv_ori_lineid} IN (${oriLineIds.map(id => `'${id}'`).join(",")}) THEN 1 ELSE 0 END`, operator: "equalto", values: 1})
        ]);
        let arrSS2 = constSearchListPO.getDataSource([
            search.createFilter({name: 'formulanumeric', formula: `CASE WHEN {custcol_scv_ori_lineid} IN (${oriLineIds.map(id => `'${id}'`).join(",")}) THEN 1 ELSE 0 END`, operator: "equalto", values: 1})
        ]);
        
        arrSS1.forEach(objSS1 => {
            let objSlItem = arrSlItem.find( e => e.ori_lineid == objSS1.ori_lineid && e.pr_id == objSS1.pr_id );
            if (!objSlItem) {
                return;
            }

            let arrSS2_ft = arrSS2.filter( e => e.ori_lineid == objSS1.ori_lineid &&  e.po_id != curRec.id && e.pr_id == objSS1.pr_id );
            let ttlQtyPo = 0;

            arrSS2_ft.forEach(e => {
                ttlQtyPo += e.qty*1;
            })

            if((objSS1.qty*1 - ttlQtyPo - objSlItem.quantity) < 0){
                if (message) message += `, `;
                message += `${objSlItem.item_display}`; 
            }
        })
        

        if(message){
            alert(`Item ${message} đang có số lượng vượt quá số lượng PR`);
            return false;
        }

        return true;
    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        // postSourcing: postSourcing,
        sublistChanged: sublistChanged,
        // lineInit: lineInit,
        // validateField: validateField,
        // validateLine: validateLine,
        // validateInsert: validateInsert,
        // validateDelete: validateDelete,
        saveRecord: saveRecord
    };
    
});
