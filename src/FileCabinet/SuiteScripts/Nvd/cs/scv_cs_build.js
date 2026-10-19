/**
 * Nội dung: 
 * Key:
 * * =======================================================================================
 *  Date                Author                  Description
 *  ?                   ?                       ?
 *  05 Dec 2024         Phu Pham                Tập hợp chi phí đã xuất tiêu hao để đưa vào lệnh sản xuất hoàn thành  from mr. Bính (https://app.clickup.com/t/86cx4b0n5)
 *  */
/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([
    'N/search', 
    '../lib/scv_lib_function.js',
    '../lib/scv_lib_cs.js',
    '../cons/scv_cons_work_order_type.js',
    '../cons/scv_cons_search_mro_issue_amt_for_ab.js'
],
function(
    search, lbf, libCS,
    constWorkOrderType, searchMroIssueAmtAB
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
        pageInit_TransformWO(scriptContext);
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

    const pageInit_TransformWO = (scriptContext) => {
        let curRec = scriptContext.currentRecord;
        let mode = scriptContext.mode;
        let params = getObjParams(curRec);
        if(mode === 'copy' && params.transform === 'workord') {
            let work_order_type = curRec.getValue("custbody_scv_work_order_type");
            if(work_order_type != constWorkOrderType.RECORDS.GIA_CONG_CO_KHI.ID) return;

            libCS.showLoadingDialog(true);
            libCS.delay(200)
                .then(() => {
                    let myFilers = [
                        search.createFilter({
                            name: 'custbody_scv_work_order_no', 
                            operator: search.Operator.ANYOF, 
                            values: params.id
                        })
                    ]
                    let arrMroIssue = searchMroIssueAmtAB.getDataSource(myFilers);
                    
                    let sublistId = "component";
                    let lc = curRec.getLineCount(sublistId);
        
                    for(let i = 0; i < lc; i++) {
                        let item_id = curRec.getSublistValue(sublistId, "item", i);
                        let item_type = lbf.getItemRecordType(item_id);
                        let expenseaccount = "", prod_cost_group = "";
                        if(!!item_type) {
                            let itemLKF = search.lookupFields({ 
                                type: item_type, id: item_id,
                                columns: ["expenseaccount", "custitem_scv_prod_cost_group"]
                            });

                            expenseaccount = itemLKF?.expenseaccount?.[0]?.value || "";
                            prod_cost_group = itemLKF?.custitem_scv_prod_cost_group?.[0]?.value || "";
                        }
        
                        let obj_find_mro = arrMroIssue.find(e => e.account_id == expenseaccount && e.cost_group_id == prod_cost_group);
                        if(!!obj_find_mro && !!expenseaccount && !!prod_cost_group){
                            curRec.selectLine(sublistId, i);
                            curRec.setCurrentSublistValue(sublistId, "quantity", obj_find_mro.amount);
                            curRec.commitLine(sublistId);
                        }
                    }
                })
                .catch((err) => console.error(err))
                .finally(() => libCS.showLoadingDialog(false))
        }
    }

    function getObjParams (curRec) {
        let strParams = curRec.getValue('entryformquerystring').split('&');
        let objParams = {};
        for (let i = 0; i < strParams.length; i++) {
            let arr = strParams[i].split('=');
            objParams[arr[0]] = arr[1];
        }
        return objParams;
    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        // saveRecord: saveRecord
    };
    
});
