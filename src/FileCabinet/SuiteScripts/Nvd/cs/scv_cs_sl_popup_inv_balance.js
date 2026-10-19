/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([
    'N/url', 'N/currentRecord',
    '../cons/scv_cons_color.js',
    '../cons/scv_cons_inventory_balance.js', 
    '../lib/scv_lib_cs.js'
],

function(
    url, currentRecord, 
    constColor, constInvBalance, libCS
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
    const InventoryStatus = {
        DAT_CHAT_LUONG: 4
    };
    const arrLine = [];
    function pageInit(scriptContext) {
        let curRec = scriptContext.currentRecord;
        let sl = "custpage_sl_result";
        let totalLine = curRec.getLineCount(sl);
        for(let i = 0; i < totalLine; i++) {
            let inventorystatus = curRec.getSublistValue(sl, "custpage_col_invstatus", i);
            if(inventorystatus != InventoryStatus.DAT_CHAT_LUONG) {
                let rowElement = document.getElementById("custpage_sl_resultrow" + i);
                let listNodeCell = rowElement.querySelectorAll("td");
                listNodeCell.forEach(element => {
                    element.style.setProperty('background-color', constColor.TEAL[200], 'important');
                });
            }
        }
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
        fieldChanged_ColumnSelect(scriptContext);
	}

    const fieldChanged_ColumnSelect = (scriptContext) => {
        let curRec = scriptContext.currentRecord;
        let sublistId = scriptContext.sublistId;
        let fieldId = scriptContext.fieldId;
        let line = scriptContext.line;

        if(sublistId === "custpage_sl_result" && fieldId === "custpage_col_select") {
            let select = curRec.getCurrentSublistValue(sublistId, fieldId);
            if(select === true) {
                arrLine.push(line);
            } else {
                if(arrLine.includes(line)) {
                    let index = arrLine.findIndex(e => e === line);
                    if(index !== -1) {
                        arrLine.splice(index, 1);
                    }
                }
            }
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
        libCS.showLoadingDialog(true);
        libCS.delay(200)
            .then(() => {
                constInvBalance.onSubmitPopupInvBalance(scriptContext, arrLine);
            })
            .catch((err) => console.error(err))
            .finally(() => libCS.showLoadingDialog(false))
        
        return false;
    }

    function plusParam(curRec) {
        let location = curRec.getValue('custpage_location');
		return '&line_number=' + curRec.getValue('custpage_line') +
            '&item=' + curRec.getValue('custpage_item') +
            '&location=' + (location.join(",")) +
            '&sublistId=' + curRec.getValue('custpage_sublistid') + 
            '&recType=' + curRec.getValue('custpage_rectype') + 
            '&ifrmcntnr=T';
	}

    function onSearchResult() {
        window.onbeforeunload = null;
        const BASE_URL = url.resolveScript({
            scriptId: 'customscript_scv_sl_popup_inv_balance',
            deploymentId: 'customdeploy_scv_sl_popup_inv_balance',
            returnExternalUrl: false
        });

        let currRecord = currentRecord.get();
        let urlDC = BASE_URL + plusParam(currRecord);
        window.location.replace(urlDC);
    }

    function onCancel() {
        closePopup(true);
    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        saveRecord: saveRecord,
        onSearchResult: onSearchResult,
        onCancel: onCancel,
    };
    
});
