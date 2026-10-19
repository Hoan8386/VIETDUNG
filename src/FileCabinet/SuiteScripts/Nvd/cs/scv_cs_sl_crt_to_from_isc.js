/**
 * Nội dung:
 * keyword:
 * - TO: Transfer Order {transferorder}
 * - ISC: Inventory Status Change {inventorystatuschange}
 * =======================================================================================
 *  Date                Author                  Description
 *  01 Apr 2025		    Khanh Tran			    Init, create file. Tạo hàng loạt các lệnh chuyển kho Transfer Order nhóm theo từng kho mr.Huy(https://app.clickup.com/t/86cydnndh)
 */
/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([
    'N/currentRecord', 'N/url', 'N/search',
    '../lib/scv_lib_cs.js', 
    '../cons/scv_cons_record.js',
    '../cons/scv_cons_location.js',
],

function(crr, url, search,
    libCs, 
    constRecord,
    constLocation
) {
    const CUR_SCRIPT = {
        ID: 'customscript_scv_sl_crt_to_from_isc',
        DEPLOYID_UI: 'customdeploy_scv_sl_crt_to_from_isc',
        DEPLOYID_DATA: 'customdeploy_scv_sl_crt_to_from_isc_data'
    }

    const URL_DATA = "/app/site/hosting/scriptlet.nl?script=" + CUR_SCRIPT.ID + "&deploy=" + CUR_SCRIPT.DEPLOYID_UI;
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
        loadFieldDataLocationLine(curRec);
    }

    const loadFieldDataLocationLine = (curRec, arrData) => {
        let sl = 'custpage_sl_result';
        let result = [];
        let hasNull = false;
        if(arrData){
            hasNull = true;
            arrData.forEach(obj => {
                obj.text = obj.name;
                obj.value = obj.internalid;
                result.push(obj);
            })
        }
        else result = curRec.getField('custpage_kho_xuat').getSelectOptions();
        for(let i = 0; i < curRec.getLineCount(sl); i++){
            setTimeout(() => {
                constRecord.initLoadFieldClient(curRec.getSublistField(sl, "custpage_col_kho_nhap", i), {
                    displayExpr: "text", valueExpr: "value", data: result
                }, hasNull);

            }, 0)
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
        let curRec = scriptContext.currentRecord;
        let sl = scriptContext.sublistId;
        let fieldId = scriptContext.fieldId;
        let line = scriptContext.line;
        if(fieldId == 'custpage_cong_ty'){
            setTimeout(() => loadFieldDataLocation(curRec), 0);
        }
    }

    const loadFieldDataLocation = (curRec) => {
        let arrResult = [];
        let subsidiaryId = curRec.getValue("custpage_cong_ty").toString();
        if(!!subsidiaryId){
            arrResult = constLocation.getDataSource(
                search.createFilter({
                    name: 'subsidiary',
                    operator: "anyof",
                    values: subsidiaryId
                })
            );
        }

        constRecord.initQuickFindFieldSelect(curRec, "custpage_kho_xuat", {
            data: arrResult,
            valueExpr: "internalid",
            displayExpr: "name",
            reInsertOption: true
        }, false);

        loadFieldDataLocationLine(curRec, arrResult);

        constRecord.initQuickFindFieldSelect(curRec, "custpage_kho_nhap", {
            data: arrResult,
            valueExpr: "internalid",
            displayExpr: "name",
            reInsertOption: true
        }, false);
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
        let curRec = crr.get();
        let isValid = libCs.validateFieldMandatory(curRec, ['custpage_cong_ty', 'custpage_fromdt', 'custpage_todt', 'custpage_ghi_chu']);
        if(!isValid) return;
        let dataSLResult = getDataSLResult();
        if(dataSLResult.length < 1) {
            return alert('Bạn phải chọn ít nhất 1 line');
        }else{
            for(let obj of dataSLResult){
                if(!obj.kho_nhap && !curRec.getValue('custpage_kho_nhap')) return alert('Bạn chưa chọn kho nhập');
                if((obj.quantity * 1) > (obj.on_hand * 1)) return alert('Không đủ tồn kho, cần kiểm tra lại');
            }
        }

        return true;
    }
    
    const getDataSLResult = () => {
        let arrResult = [];
        let curRec = crr.get();
        let sl = 'custpage_sl_result';
        for(let i = 0; i < curRec.getLineCount(sl); i++){
            let checkbox = curRec.getSublistValue(sl, 'custpage_col_check', i);
            if(checkbox){
                let json_data = curRec.getSublistValue(sl, 'custpage_col_json_data', i);
                let obj = {...JSON.parse(json_data)};
                obj.kho_nhap = curRec.getSublistValue(sl, 'custpage_col_kho_nhap', i);
                arrResult.push(obj)
            }
        }
        
        return arrResult;
    }

    const onSearchResult = () => {
        window.onbeforeunload = null;
        let curRec = crr.get();
        let isValid = libCs.validateFieldMandatory(curRec, ['custpage_cong_ty', 'custpage_fromdt', 'custpage_todt']);
        if(!isValid) return;

        let params = getObjParams();
        let urlDC = url.resolveScript({
            scriptId: CUR_SCRIPT.ID,
            deploymentId: CUR_SCRIPT.DEPLOYID_UI,
            params: params,
        })

        urlDC = urlDC + '&isSearch=T';
        window.location.replace(urlDC);
    }

    const getObjParams = () => {
        let curRec = crr.get();
        return {
            custpage_cong_ty: curRec.getValue('custpage_cong_ty').toString(),
            custpage_phieu_ctt: curRec.getValue('custpage_phieu_ctt'),
            custpage_fromdt: curRec.getText('custpage_fromdt'),
            custpage_todt: curRec.getText('custpage_todt'),
            custpage_kho_xuat: curRec.getValue('custpage_kho_xuat'),
            custpage_gd_goc: curRec.getValue('custpage_gd_goc'),
            custpage_mat_hang: curRec.getValue('custpage_mat_hang').toString(),
            custpage_gd_lien_quan: curRec.getValue('custpage_gd_lien_quan'),
            custpage_so_lo: curRec.getValue('custpage_so_lo'),
            custpage_kho_nhap: curRec.getValue('custpage_kho_nhap'),
            custpage_ghi_chu: curRec.getValue('custpage_ghi_chu'),
        };
    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        saveRecord: saveRecord,
        onSearchResult: onSearchResult
    };
    
});
