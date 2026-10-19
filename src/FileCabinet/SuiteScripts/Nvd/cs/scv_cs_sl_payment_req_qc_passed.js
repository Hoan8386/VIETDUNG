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
    currentRecord, url, libCS, lbf, constColor
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
    const TypeDeNghiTT = {
        ThanhToanCongNo: {
            ID: 2,
            NAME: "Thanh toán công nợ",
        },
        QuyetToanNVDiMuaHang: {
            ID: 11,
            NAME: "Quyết toán NV đi mua hàng"
        }
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
        let sublistId = scriptContext.sublistId;
        let fieldId = scriptContext.fieldId;
        
        fieldChanged_QtyDNTT(curRec, sublistId, fieldId);
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

        // check dieu kien quyet toan mua hang
        let objQTNVMH = validateQuyetToanNVMH(curRec);
        if(!objQTNVMH.isSuccess) {
            libCS.showMessage(null, objQTNVMH.message);
            return objQTNVMH.isSuccess;
        }
        // check dieu kien thanh toan cong no
        let objTTCN = validateThanhToanCongNo(curRec);
        if(!objTTCN.isSuccess) {
            libCS.showMessage(null, objTTCN.message);
            return objTTCN.isSuccess;
        }

        // check dieu kien sublist
        let objValidate = validateSublistResult(curRec);
        if(!objValidate.isSuccess) {
            libCS.showMessage(null, objValidate.message);
            return objValidate.isSuccess;
        }

        return true;
    }

    const fieldChanged_QtyDNTT = (curRec, sublistId, fieldId) => {
        if(sublistId !== "custpage_sl_result") return;

        if(fieldId === "custpage_col_12") {
            let jsonData = curRec.getCurrentSublistValue(sublistId, "custpage_col_json_data");
            let qty_dntt = curRec.getCurrentSublistValue(sublistId, "custpage_col_12") * 1;

            let objRes = JSON.parse(jsonData);
            if(qty_dntt > (objRes.qty_dntt) && ["Assembly", "InvtPart"].includes(objRes.itemtype)) {
                alert("Cảnh báo ĐNTT không được phép lớn hơn số lượng QC đạt!");

                curRec.setCurrentSublistValue(sublistId, "custpage_col_12", objRes.qty_dntt);
            }
        }
    }

    const validateQuyetToanNVMH = (curRec) => {
        let type_denghitt = curRec.getValue("custpage_type_denghitt");
        if(type_denghitt == TypeDeNghiTT.QuyetToanNVDiMuaHang.ID) {
            let arrResult = [];
            let sublistId = "custpage_sl_result";
            let lc = curRec.getLineCount(sublistId);
            for(let i = 0; i < lc; i++) {
                let isSelected = curRec.getSublistValue(sublistId, "custpage_col_0", i);
                if(isSelected === true || isSelected === "T") {
                    let stringify = curRec.getSublistValue(sublistId, "custpage_col_json_data", i);
                    let jsonData = JSON.parse(stringify);

                    arrResult.push({
                        id: jsonData.id,
                        emp_remaining_amt: jsonData.emp_remaining_amt
                    });
                }
            }

            let arrGroupPO = groupDataByFieldId(arrResult, "id");
            if(arrGroupPO.length > 1) {
                return {isSuccess: false, message: "Không được quyết toán cùng lúc "+ arrGroupPO.length +" đơn hàng"};
            }

            if((arrResult?.[0]?.emp_remaining_amt <= 0) && arrGroupPO.length === 1) {
                return {isSuccess: false, message: "Không thỏa mãn điều kiện quyết toán"};
            }
        }

        return { isSuccess: true, message: "Success." };
    }

    const validateThanhToanCongNo = (curRec) => {
        let type_denghitt = curRec.getValue("custpage_type_denghitt");
        if(type_denghitt == TypeDeNghiTT.ThanhToanCongNo.ID) {
            let sublistId = "custpage_sl_result";
            let lc = curRec.getLineCount(sublistId);
            for(let i = 0; i < lc; i++) {
                let isSelected = curRec.getSublistValue(sublistId, "custpage_col_0", i);
                if(isSelected === true || isSelected === "T") {
                    let stringify = curRec.getSublistValue(sublistId, "custpage_col_json_data", i);
                    let jsonData = JSON.parse(stringify);

                    if(jsonData.emp_prepayment === true) {
                        return {isSuccess: false, message: "Không thỏa mãn điều kiện thanh toán"};
                    }
                }
            }
        }

        return { isSuccess: true, message: "Success." };
    }

    const validateSublistResult = (curRec) => {
        let objResult = {
            isSuccess: true,
            message: "Success."
        };

        let arrResult = [];
        let sublistId = "custpage_sl_result";
        let lc = curRec.getLineCount(sublistId);
        for(let i = 0; i < lc; i++) {
            let isSelected = curRec.getSublistValue(sublistId, "custpage_col_0", i);
            if(isSelected === true || isSelected === "T") {
                let jsonData = curRec.getSublistValue(sublistId, "custpage_col_json_data", i);
                
                let objRes = JSON.parse(jsonData);
                objRes.qty_dntt = curRec.getSublistValue(sublistId, "custpage_col_12", i) * 1;

                if(objRes.qty_dntt > (objRes.qty_passed - objRes.qty_billded) && ["Assembly", "InvtPart"].includes(objRes.itemtype)) {
                    return {
                        isSuccess: false,
                        message: "Cảnh báo ĐNTT không được phép lớn hơn số lượng QC đạt!"
                    };
                }
                if(objRes.qty_dntt === 0) {
                    return {
                        isSuccess: false,
                        message: "Cảnh báo số lượng ĐNTT không được phép bằng 0!"
                    };
                }
                arrResult.push(objRes);
            }
        }
        
        if(arrResult.length == 0) {
            objResult = {
                isSuccess: false,
                message: "Vui lòng chọn ít nhất 1 line để tạo Payment Request!"
            };
        }
        return objResult;
    }

    const onSearchResult = () => {
        window.onbeforeunload = null;
        const BASE_URL = url.resolveScript({
            scriptId: 'customscript_scv_sl_pay_req_qc_passed',
            deploymentId: 'customdeploy_scv_sl_pay_req_qc_passed',
            returnExternalUrl: false
        });

        let currRecord = currentRecord.get();
        let objFieldMandatory = validateFieldsMandatory(currRecord, ["custpage_subsidiary", "custpage_entity"]);
        if(!objFieldMandatory.isValidate) {
            return alert(objFieldMandatory.notification);
        }
        let urlDC = BASE_URL + plusParam(currRecord) + "&isrun=T";
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
            + '&custpage_entity=' + currRecord.getValue('custpage_entity')
            + '&custpage_item=' + currRecord.getValue('custpage_item')
            + '&custpage_location=' + currRecord.getValue('custpage_location')
            + '&custpage_po=' + currRecord.getValue('custpage_po')
            + '&custpage_currency=' + currRecord.getValue('custpage_currency')
            + '&custpage_ordertype=' + currRecord.getValue('custpage_ordertype')
            + '&custpage_fromdt=' + currRecord.getText('custpage_fromdt')
            + '&custpage_todt=' + currRecord.getText('custpage_todt')
            + '&custpage_from_ngaynk=' + currRecord.getText('custpage_from_ngaynk')
            + '&custpage_to_ngaynk=' + currRecord.getText('custpage_to_ngaynk');
    }

    const groupDataByFieldId = (data, field) => {
        let objGroup = {};
        for(let i = 0; i < data.length; i++) {
            let fieldValue = data[i][field];
            if(objGroup[fieldValue] === undefined && !!fieldValue) {
                objGroup[fieldValue] = fieldValue;
            }
        }
        return Object.values(objGroup);
    }

    function isSelectLine(curRec, sublist, fieldId) {
        let lc = curRec.getLineCount(sublist);
        for(let i = 0; i < lc; i++){
            let chk = curRec.getSublistValue(sublist, fieldId, i);
            if(chk == true || chk == "T") return true;
        }
        return false;
	}

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        saveRecord: saveRecord,
        onSearchResult: onSearchResult
    };
    
});
