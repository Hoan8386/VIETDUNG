/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([
    'N/currentRecord', 'N/url', 'N/query', 
    '../lib/scv_lib_cs.js',
    '../lib/scv_lib_function.js', 
    '../cons/scv_cons_color.js',
    '../cons/scv_cons_list_loc_type.js', 
],
function(
    currentRecord, url, query, 
    libCS, lbf, 
    constColor,
    constListLocType
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
    const CurrentScript = {
        ID: "customscript_scv_sl_mass_create_to",
        DEPLOYMENT: "customdeploy_scv_sl_mass_create_to"
    };
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
        let fieldId = scriptContext.fieldId;
        let sublistId = scriptContext.sublistId;

        fieldChanged_Subsidiary(curRec, fieldId, sublistId);
        fieldChanged_Location(curRec, fieldId, sublistId);
        fieldChanged_QtyCreateTO(curRec, fieldId, sublistId);
    }

    const fieldChanged_QtyCreateTO = (curRec, fieldId, sublistId) => {
        if(sublistId === "custpage_sl_result" && fieldId === "custpage_col_qty_create") {
            let qty_create = curRec.getCurrentSublistValue(sublistId, fieldId);
            let qty_remain = curRec.getCurrentSublistValue(sublistId, "custpage_col_qty_remain");

            if(qty_create > qty_remain) {
                alert(`Số lượng điều chuyển không được vượt quá số lượng còn lại: ${qty_remain}!`);
                curRec.setCurrentSublistValue(sublistId, fieldId, qty_remain);
            }

            if(qty_create <= 0) {
                alert(`Bạn đã nhập Số lượng điều chuyển <= 0.`);
                curRec.setCurrentSublistValue(sublistId, fieldId, qty_remain);
            }
        }
    }

    const fieldChanged_Subsidiary = (curRec, fieldId, sublistId) => {
        if(!!sublistId) return;

        if(fieldId === 'custpage_subsidiary') {
            let subsidiary_id = curRec.getValue(fieldId);

            let fLocation = curRec.getField('custpage_location');
            fLocation.removeSelectOption({value: null});

            let fWorkCenter = curRec.getField('custpage_work_center');
            fWorkCenter.removeSelectOption({value: null});

            if(!!subsidiary_id) {
                let sqlQuery = `SELECT id, name, custrecord_scv_loc_type, subsidiary
                    FROM location
                    WHERE custrecord_scv_loc_type = ${constListLocType.RECORDS.KHO_SAN_XUAT.ID} AND isinactive = 'F'\n`;

                let resultSQL = query.runSuiteQL({
                    query: sqlQuery
                });

                let resultQuery = resultSQL.asMappedResults();
                resultQuery = resultQuery.filter(e => e.subsidiary == subsidiary_id);

                fLocation.insertSelectOption({ value: '', text: '' });
                for(let obj of resultQuery) {
                    fLocation.insertSelectOption({ value: obj.id, text: obj.name });
                }
            }
        }
    }

    const fieldChanged_Location = (curRec, fieldId, sublistId) => {
        if(!!sublistId) return;

        if(fieldId === 'custpage_location') {
            insertSelectOptionWorkCenter(curRec, fieldId);
        }
    }

    const insertSelectOptionWorkCenter = (curRec, fieldId) => {
        let location_id = curRec.getValue(fieldId);

        let fWorkCenter = curRec.getField('custpage_work_center');
        fWorkCenter.removeSelectOption({value: null});

        if(!!location_id) {
            fWorkCenter.insertSelectOption({ value: '', text: '' });

            let resultSQL = query.runSuiteQL({
                query: `SELECT id, groupname FROM entitygroup
                    WHERE custentity_mfgmob_wclocation = ${location_id} AND isinactive = 'F'`
            });
            let resultQuery = resultSQL.asMappedResults();

            for(let obj of resultQuery) {
                fWorkCenter.insertSelectOption({ value: obj.id, text: obj.groupname });
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
        let curRec = scriptContext.currentRecord;
        let sl = "custpage_sl_result";
        let totalLine = curRec.getLineCount(sl);

        for(let i = 0; i < totalLine; i++) {
            let isSelect = curRec.getSublistValue(sl, "custpage_col_select", i);
            if(isSelect === true || isSelect === "T") {
                let transferlocation = curRec.getSublistValue(sl, "custpage_col_transferlocation", i);
                if(!transferlocation) {
                    alert("Vui lòng chọn thông tin kho nhập để tạo Transfer Order!");
                    return false;
                }
                return true;
            }
        }
        alert("Vui lòng chọn ít nhất 1 dòng để tạo Transfer Order!");
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
            scriptId: 'customscript_scv_sl_mass_create_to',
            deploymentId: 'customdeploy_scv_sl_mass_create_to',
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

    const onRefresh = () => {
        window.onbeforeunload = null;

        let urlScript = url.resolveScript({
            scriptId: CurrentScript.ID,
            deploymentId: CurrentScript.DEPLOYMENT,
            returnExternalUrl: false
        });
        window.location.replace(urlScript);
    }

    const onSearchResult = () => {
        window.onbeforeunload = null;
        const urlScript = url.resolveScript({
            scriptId: CurrentScript.ID,
            deploymentId: CurrentScript.DEPLOYMENT,
            returnExternalUrl: false
        });
    
        let currRecord = currentRecord.get();
        let objFieldMandatory = validateFieldsMandatory(currRecord, ["custpage_subsidiary", "custpage_location"]);
        if(!objFieldMandatory.isValidate) {
            return alert(objFieldMandatory.notification);
        }
    
        let urlDC = urlScript + plusParam(currRecord) + "&isrun=T";
        window.location.replace(urlDC);
    }

    const validateFieldsMandatory = (currRecord, fields) => {
        let isValidate = true;
        let notification = "Vui lòng nhập fields: ";

        for(let fieldId of fields) {
            let value = currRecord.getValue(fieldId);
            if(!value) {
                isValidate = false;
                notification += currRecord.getField(fieldId).label + ", ";
            }
        }
        return {
            isValidate, 
            notification: !!isValidate ? "Success!" : (notification.slice(0, notification.length - 2) + ".")
        };
    }

    function plusParam(currRecord) {
        return '&custpage_subsidiary=' + currRecord.getValue('custpage_subsidiary')
            + '&custpage_location=' + currRecord.getValue('custpage_location')
            + '&custpage_shift=' + currRecord.getValue('custpage_shift')
            + '&custpage_work_center=' + currRecord.getValue('custpage_work_center')
            + '&custpage_item=' + currRecord.getValue('custpage_item')
            + '&custpage_build=' + currRecord.getValue('custpage_build')
            + '&custpage_fromdt=' + currRecord.getText('custpage_fromdt')
            + '&custpage_todt=' + currRecord.getText('custpage_todt');
    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        saveRecord: saveRecord,
        onRefresh: onRefresh,
        onSearchResult: onSearchResult,
    };
    
});
