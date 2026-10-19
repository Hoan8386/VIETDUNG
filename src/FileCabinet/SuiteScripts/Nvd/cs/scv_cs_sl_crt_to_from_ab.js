/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([
    'N/currentRecord', 'N/url', '../lib/scv_lib_cs.js',
    '../lib/scv_lib_function.js', '../cons/scv_cons_color.js'
],
function(
    currentRecord, url, libCS, lbf, 
    constColor
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
        onSubmit(scriptContext);
        return false;
    }

    const onSubmit = async (scriptContext) => {
        let btnSubmit = document.getElementById("tdbody_submitter");
        btnSubmit.style.display = "none";
        libCS.showLoadingDialog(true);
        window.onbeforeunload = null;

        let curRec = scriptContext.currentRecord;
        let location = curRec.getValue("custpage_location");
        if(!location) {
            return alert("Vui lòng chọn Kho Nhập!");
        }
        
        const BASE_URL = url.resolveScript({
            scriptId: 'customscript_scv_sl_crt_to_from_ab',
            deploymentId: 'customdeploy_scv_sl_crt_to_from_ab',
            returnExternalUrl: false
        });

        let response = await fetchDataMethodPost(BASE_URL, {
            custpage_rectype: curRec.getValue("custpage_rectype"),
            custpage_build: curRec.getValue("custpage_build"),
            custpage_location: location
        });

        if(response.isSuccess === true) {
            window.parent.onbeforeunload = null;
            let urlRecord = url.resolveRecord({
                recordType: 'transferorder',
                recordId: response.toId
            });
            window.parent.location.replace(urlRecord);
        } else {
            alert("Tạo Transfer Order thất bại!\n" + response.msg);
        }

        btnSubmit.style.removeProperty("display");
        libCS.showLoadingDialog(false);
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
        saveRecord: saveRecord
    };
    
});
