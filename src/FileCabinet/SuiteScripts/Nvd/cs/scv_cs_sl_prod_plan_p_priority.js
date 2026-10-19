/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  28 May 2025         Huy Pham			    Init, create file, Production Planning, from mr.Trương Phúc(https://app.clickup.com/t/86cxfpxbb?comment=90160112390437)
 */
/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */ 
define([
],

function(
) {
    let windowParent = window.getParent();
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
        setDataSourceResult();
        
    }

    const setDataSourceResult = () =>{debugger;
        let curRecParent = windowParent._scvForm.currentRecord;
        let woScheduleSublistId = "custpage_sl_woschedule";
        let sizeWOSchedule = curRecParent.getLineCount(woScheduleSublistId);

        let arrLineSelected = windowParent._scvArrLineSelected;

        let arrResult = [];
        for(let i = 0; i < sizeWOSchedule; i++){
            let chk = curRecParent.getSublistValue(woScheduleSublistId, "custpage_col_chk", i);
            if(!chk) continue;

            let tksx = curRecParent.getSublistValue(woScheduleSublistId, "custpage_col_tksx", i);

            let idxResExist = arrResult.findIndex(e => e.custpage_col_tksx == tksx);
            if(idxResExist > -1) continue;

            let idxLineSelected = arrLineSelected.findIndex(e => e.line == i);

            let priority = curRecParent.getSublistValue(woScheduleSublistId, "custpage_col_priority", i);

            arrResult.push({
                custpage_col_stt: idxLineSelected + 1,
                custpage_col_priority: priority,
                custpage_col_tksx: tksx
            })
        }

        arrResult = alasql(`SELECT * FROM ? ORDER BY custpage_col_stt::NUMBER ASC`, [arrResult]);

        _scvDx.setDataSource("custpage_sl_result", arrResult);
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
        let line = scriptContext.line;

    }

    const updateResult = () =>{
        window.onbeforeunload = null;

        let curRecParent = windowParent._scvForm.currentRecord;
        let woScheduleSublistId = "custpage_sl_woschedule";
        let sizeWOSchedule = curRecParent.getLineCount(woScheduleSublistId);

        let arrResult = _scvDx.getDataSource("custpage_sl_result");
        for(let i = 0; i < sizeWOSchedule; i++){
            let chk = curRecParent.getSublistValue(woScheduleSublistId, "custpage_col_chk", i);
            if(!chk) continue;

            let tksx = curRecParent.getSublistValue(woScheduleSublistId, "custpage_col_tksx", i);

            let objRes = arrResult.find(e => e.custpage_col_tksx == tksx);
            if(!objRes) continue;

            curRecParent.selectLine(woScheduleSublistId, i);
            
            curRecParent.setCurrentSublistValue(woScheduleSublistId, "custpage_col_priority", objRes.custpage_col_priority);
            
            curRecParent.commitLine(woScheduleSublistId);
        }

        closePopup(true); 
    }

    const canelPopup = () =>{
        window.onbeforeunload = null;
        closePopup(true); 
    }

    return {
        pageInit,
        //fieldChanged,
        updateResult,
        canelPopup
    };
    
});
