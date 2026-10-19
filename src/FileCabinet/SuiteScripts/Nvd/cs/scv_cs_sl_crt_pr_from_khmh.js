/**
 * Nội dung: Tạo PR From KHMH
 * keyword:
 * - PO: Kế hoạch mua hàng {custompurchase_scv_purchase_plan}
 * - PR: Purchase Request {custompurchase_scv_purchase_request}
 * =======================================================================================
 *  Date                Author                  Description
 *  13 Dec 2024		    Khanh Tran			    Init, create file. Tạo Purchase Request từ Kế hoạch mua hàng mr.Hải(https://app.clickup.com/t/86cxa8316)
 */
/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([
    'N/currentRecord', 'N/url', 'N/ui/dialog', 'N/query', 'N/https', 'N/search',
    '../lib/scv_lib_cs.js', '../lib/scv_lib_function.js',
    '../cons/scv_cons_record.js',
    '../cons/scv_cons_purchaseplan.js',
],

function(crr, url, dialog, query, https, search,
    libCs, lbf,
    constRecord,
    constPurchasePlan
) {
    const CUR_SCRIPT = {
        ID: 'customscript_scv_sl_crt_pr_fr_khmh',
        DEPLOYID_UI: 'customdeploy_scv_sl_crt_pr_fr_khmh',
        DEPLOYID_DATA: 'customdeploy_scv_sl_crt_pr_fr_khmh_data'
    }

    const URL_DATA = "/app/site/hosting/scriptlet.nl?script=" + CUR_SCRIPT.ID + "&deploy=" + CUR_SCRIPT.DEPLOYID_DATA;
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
        let sl = scriptContext.sublistId;
        let fieldId = scriptContext.fieldId;
        let line = scriptContext.line;
        if(fieldId == 'custpage_col_qty' || fieldId == 'custpage_col_rate'){
            curRec.selectLine({sublistId: sl, line: line});
            let qty = curRec.getCurrentSublistValue(sl, 'custpage_col_qty') * 1;
            let rate = curRec.getCurrentSublistValue(sl, 'custpage_col_rate') * 1;  
            if(fieldId == 'custpage_col_qty'){
                let qty_remaining = curRec.getSublistValue(sl, 'custpage_col_qty_remaining', line) * 1;
                if(qty > qty_remaining){
                    alert('Đã vượt quá số lượng còn lại')
                    curRec.setCurrentSublistValue({sublistId: sl, fieldId: 'custpage_col_qty', value: qty_remaining,  ignoreFieldChange: true});
                    qty = qty_remaining;
                }
            }

            let amt = qty * rate;
            curRec.setCurrentSublistValue(sl, 'custpage_col_amt', amt, true);
        }else if(fieldId == 'custpage_subsidiary'){
            let arrData = [];
            let custpage_subsidiary = curRec.getValue('custpage_subsidiary');
            if(custpage_subsidiary.join(',')){
                arrData = constPurchasePlan.getDataBySubsidiary(
                    search.createFilter({
                        name: 'subsidiary',
                        operator: "anyof",
                        values: custpage_subsidiary
                    })
                );
            };

            constRecord.initLoadFieldClient(curRec.getField('custpage_khmh'), {
                displayExpr: "tranid", valueExpr: "internalid", data: arrData
            }, false)
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
        window.onbeforeunload = null;
        let progessStatus = libCs.showLoadingDialog(true);
        asynCrtPR(progessStatus)
    }

    const asynCrtPR = async (progessStatus) => {
        try {
            let dataSLResult = getDataSLResult();
            if(dataSLResult.length < 1) {
                libCs.showLoadingDialog(false);
                return alert('You must select at least 1 line');
            }else{
                for(let obj of dataSLResult){
                    if(obj.qty > obj.qty_remaining){
                        libCs.showLoadingDialog(false);
                        return alert('Số lượng nhập đã vượt quá số lượng còn lại');
                    }
                }
            }

            let params = getObjParams();
            let keyGrp = ['internalid'];
            let arrGrp = lbf.onGroupByArray(dataSLResult, keyGrp);
            let ttlPromise = arrGrp.length;
            let objNote = {failed: '', success: ''};
            let objRes = {};
            for(let i = 0; i < ttlPromise; i++){    
                progessStatus.innerHTML = `Create ${i + 1} / ${ttlPromise}`;
                let objGrp = arrGrp[i];
                let arrLine = dataSLResult.filter(e => e.internalid == objGrp.internalid);
                objRes = await https.post.promise({
                    url: URL_DATA, 
                    body: {
                        action: 'createRecord', 
                        objData: JSON.stringify({paramFilter: params, arrLine: arrLine})
                    }
                });
                objRes = JSON.parse(objRes.body);
                if(objRes.isSuccess == true) objNote.success += objRes.msg + '<br/>';
                else objNote.failed += objRes.msg + '<br/>';
            }
            
            libCs.showLoadingDialog(false);
            dialog.alert({title: `Notifications`, message: objNote.failed + objNote.success})
            .then(function() {
                onSearchResult()
            })
        } catch (error) {
            alert(error.toString())
            libCs.showLoadingDialog(false)
        }
    }

    const getDataSLResult = () => {
        let arrResult = [];
        let curRec = crr.get();
        let fieldIds = ['qty', 'json_data'];
        let sl = 'custpage_sl_result';
        for(let i = 0; i < curRec.getLineCount(sl); i++){
            let checkbox = curRec.getSublistValue(sl, 'custpage_col_check', i);
            if(checkbox){
                let obj = {};
                fieldIds.forEach(fieldId => {
                    if(fieldId == 'json_data'){
                        let dataSummary = curRec.getSublistValue(sl, 'custpage_col_json_data', i);
                        obj = {...JSON.parse(dataSummary), ...obj};
                    }
                    else obj[fieldId] = curRec.getSublistValue(sl, 'custpage_col_' + fieldId, i)
                })

                arrResult.push(obj)
            }
        }
        return arrResult;
    }

    const onSearchResult = () => {
        window.onbeforeunload = null; 
        let curRec = crr.get();
        let isValid = libCs.validateFieldMandatory(curRec, [ "custpage_subsidiary"]);
        if(!isValid) return;

        let params = getObjParams();
        let urlDC = url.resolveScript({
            scriptId: CUR_SCRIPT.ID,
            deploymentId: CUR_SCRIPT.DEPLOYID_UI,
            params: params,
        });
        urlDC = urlDC + '&isSearch=T';
        window.location.replace(urlDC);
    }

    const getObjParams = () => {
        let curRec = crr.get();
        return {
            custpage_subsidiary: curRec.getValue('custpage_subsidiary').join(','),
            custpage_khmh: curRec.getValue('custpage_khmh').join(','),
            custpage_fromdt: curRec.getText('custpage_fromdt'),
            custpage_todt: curRec.getText('custpage_todt'),
            custpage_def_date: curRec.getText('custpage_def_date'),
            custpage_item: curRec.getValue('custpage_item').join(','),
            custpage_list_item: curRec.getValue('custpage_list_item').join(','),
        };
    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        saveRecord: saveRecord,
        onSearchResult: onSearchResult
    };
    
});
