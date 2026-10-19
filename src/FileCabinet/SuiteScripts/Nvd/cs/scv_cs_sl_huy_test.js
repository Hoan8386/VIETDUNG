/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  12 Feb 2025         Huy Pham			    Init, create file
 */
/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */ 
define([
    '../cons/scv_cons_record.js'
],

function(
    constRecord
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
        /* constRecord.initQuickFindSublistFieldSelect(curRec, "custpage_sl_res", "custpage_subsidiary", -1, {

        }); */
        constRecord.addButtonSelectOnMachineRow(curRec, "custpage_sl_res", "Select Employee", "custpage_col_employee_id", {
            isMulti: true,
            displayFieldId: "custpage_col_employee_name",
            data: [
                {id: 1, name: "huy", memo: "test 1"},
                {id: 2, name: "hoang", memo: "test 2"},
            ]
        });
    }

    const addButtonSelectEmpOnMachineRow = (curRec) => {
        let sublistId = "custpage_sl_res";
        const sublistButtons = document.getElementById(sublistId + "_buttons");
        if(!sublistButtons) return;
        let curRow = sublistButtons.querySelector("table tr");
        
        let cellIndex = (curRow.cells.length - 1);
        let cell = curRow.insertCell(cellIndex);
        let inputElement = createCellElement(cell, sublistId, "Select Employee", "select_employee");
        let parentElement = inputElement.parentElement;

        inputElement.addEventListener("mouseover",  () => {
            parentElement.style.setProperty("background-color", "#E8E8E8", "important");
        });
        inputElement.addEventListener("mouseleave",  () => {
            parentElement.style.setProperty("background-color", "#F2F2F2", "important");
        });
        inputElement.addEventListener("click", (e) => {
            let line_number = nlapiGetCurrentLineItemIndex(sublistId);
            let employee_id = curRec.getCurrentSublistValue(sublistId, "custpage_col_employee");

            const BASE_URL = url.resolveScript({
                scriptId: 'customscript_scv_sl_prod_labor_statistic',
                deploymentId: 'customdeploy_scv_sl_prod_labor_statistic',
                returnExternalUrl: false
            });

            let urlDC = BASE_URL + `&isemployee=T&linenumber=${line_number}&employeeid=${employee_id}`;
            nlExtOpenWindow(urlDC, 'popupEmployee', window.innerWidth - 300, window.innerHeight - 200, this, true, "Select Employee");
        });
    }

    const createCellElement = (cell, sublistId, buttonName, id) => {
        let inputId = sublistId + id;

        let inputStyle = "color: #333 !important; font-size: 13px !important; padding: 0px 8px !important;";
        let bntBgCustom = "background: #F2F2F2 !important; border-radius: 3px; border: 1px solid #B2B2B2 !important;";
        cell.innerHTML = `
            <table class="machBnt" id="tbl_${inputId}" cellpadding="0" cellspacing="0" border="0" style="cursor:hand;" role="presentation">
                <tbody>
                    <tr>
                        <td class="bntBgB" style="${bntBgCustom}" valign="top">
                            <input type="button" style="${inputStyle}" class="rndbuttoninpt bntBgT" value="${buttonName}" id="${inputId}" name="${inputId}"/>
                        </td>
                    </tr>
                </tbody>
            </table>`;
        
        return document.getElementById(inputId);
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
        debugger
        switch(fieldId){
            case "custpage_subsidiary":
                
            break;
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
        return true;
    }

    const onSearchResult = () =>{
        window.onbeforeunload = null;

    }

    return {
        pageInit,
        fieldChanged,
        saveRecord,
        onSearchResult
    };
    
});
