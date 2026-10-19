/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([
    'N/url', 'N/currentRecord',
    '../lib/scv_lib_inventorydetail.js',
    '../lib/scv_lib_cs.js'
],

function(
    url, currentRecord,
    libInventoryDetail,
    libCS
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
        // let isSuccess = new URLSearchParams(window.location.search).get('isSuccess');
        // if(isSuccess == "T"){
        //     let iaId = new URLSearchParams(window.location.search).get('iaId');
        //     window.parent.top.location.href = `/app/accounting/transactions/invadjst.nl?id=${iaId}`;
        // }
        
        let mappingFieldPopup = {
            item: "custpage_col_item",
            quantity: "custpage_col_quantity",
            description: "custpage_col_description",
            unit: "custpage_col_units",
            unit_display: "custpage_col_units",
            location: "custpage_location",
        };
        let curRec = scriptContext.currentRecord;
        libInventoryDetail.pageInitParentInventoryDetailSublist("issue", curRec, "custpage_sl_result", "custpage_col_inventorydetail", mappingFieldPopup, true);
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
        onSubmitCreateInvAdjst(scriptContext);
        return false;
    }

    const onSubmitCreateInvAdjst = async (scriptContext) => {
        libCS.showLoadingDialog(true);
        await libCS.delay(200);
        window.onbeforeunload = null;

        let curRec = scriptContext.currentRecord;
        let rectype = curRec.getValue("custpage_rectype");
        let recid = curRec.getValue("custpage_recid");

        let arrSublist = [];
        let sl = "custpage_sl_result";
        let totalLine = curRec.getLineCount(sl);

        for(let i = 0; i < totalLine; i++) {
            let select = curRec.getSublistValue(sl, "custpage_col_select", i);
            let quantity = curRec.getSublistValue(sl, "custpage_col_quantity", i) * 1;
            if(select === true && quantity !== 0) {
                let stringify = curRec.getSublistValue(sl, "custpage_col_json_data", i);
                let objData = JSON.parse(stringify);
                
                let objLine = {};
                objLine.item = objData.component_id;
                objLine.location = objData.location_id;
                objLine.adjustqtyby = quantity;
                objLine.custcol_scv_mro_line_related = objData.mro_related_id;
                objLine.custcol_scv_prod_cost_group = objData.prod_cost_group;
                
                let quantity_inventorydetail = 0;
                let isHasInvDetail = true;
                let keyStore = curRec.getSublistValue(sl, libInventoryDetail.getStoreFieldId("custpage_col_inventorydetail"), i);
                
                objLine.key_inventorydetail = keyStore;
                objLine.inventorydetail = {};

                if(!!keyStore){
                    let objInventoryDetail = libInventoryDetail.getDataStoreInventoryClientSide(keyStore);
                    objLine.inventorydetail = objInventoryDetail;

                    if(!!objInventoryDetail){
                        quantity_inventorydetail = objInventoryDetail.quantity * 1;
                    }
                    if(objInventoryDetail.lines.length == 0){
                        isHasInvDetail = false;
                    }
                } else{
                    isHasInvDetail = false;
                }

                if(isHasInvDetail && quantity_inventorydetail != quantity){
                    let msg_err = `Kiểm tra lại thông tin inventory detail ở dòng ${i + 1} chưa đúng:\n`;
                    msg_err += `{Quantity} = ${quantity};\n`
                    msg_err += `{Quantity Inventory Detail} = ${quantity_inventorydetail}`;
                    libCS.showLoadingDialog(false);
                    return alert(msg_err);
                }

                arrSublist.push(objLine);
            }
        }
        if(arrSublist.length === 0) {
            libCS.showLoadingDialog(false);
            return alert("Vui lòng chọn ít nhất 1 line để tạo Inventory Adjustment!");
        }
        
        let objBody = {rectype, recid, arrSublist};
        let baseUrl = url.resolveScript({
            scriptId: 'customscript_scv_sl_issue_mro_components',
            deploymentId: 'customdeploy_scv_sl_issue_mro_components',
            returnExternalUrl: false,
        });

        let response = await fetchDataMethodPost(baseUrl, objBody);
        if(response?.data?.internalid) {
            window.parent.top.location.href = `/app/accounting/transactions/invadjst.nl?id=${response.data.internalid}`;
        } else {
            libCS.showLoadingDialog(false);
            return alert("Tạo Inventory Adjustment thất bại: " + response.message);
        }
    }

    window._scvCallBackSubmitResult_Completed = (scriptContext) =>{
        let curRec = currentRecord.get();
        
        let inventoryDetalRec = scriptContext.currentRecord;
        let parentSublistId = scriptContext.parentSublistId;
        let parentFieldId = scriptContext.parentFieldId;
        let parentLine = scriptContext.parentLine * 1;

        libInventoryDetail.enableLineInventoryDetail(curRec, parentSublistId, parentFieldId, parentLine);
    }

    const onCancel = () => {
        closePopup(true);
    }

    const fetchDataMethodPost = async (url, data) => {
        try {
            let response = await fetch(url, {
                method: 'POST',
                headers: { 
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                throw new Error(`Error fetching ${url}: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(error.message);
            return null;
        }
    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        onCancel: onCancel,
        saveRecord: saveRecord
    };
    
});
