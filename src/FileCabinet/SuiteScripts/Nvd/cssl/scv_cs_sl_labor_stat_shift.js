/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([
    'N/url', 'N/search', 'N/query', 'N/format',
    '../cons/scv_cons_record.js',
],
function(
    url, search, query, format,
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

    const Suitelet = {
        ID: "customscript_scv_sl_labor_stat_shift",
        DEPLOYID_UI: "customdeploy_scv_sl_labor_stat_shift",
        DEPLOYID_DATA: "customdeploy_scv_sl_labor_stat_shift_svc",
    };

    const ActionType = {
        Add: { ID: "1", NAME: "Add" },
        Edit: { ID: "2", NAME: "Edit" },
    };

    function pageInit(scriptContext) {
        const curRec = scriptContext.currentRecord;

        constRecord.pageInitQuickFindFieldSelect(curRec, [
            "custpage_lot_no", "custpage_sothongke"
        ]);

        addButtonMakeCopy(scriptContext.currentRecord);
        addButtonNextLine(scriptContext.currentRecord);
    }

    const addButtonMakeCopy = (curRec) => {
        let sublistId = "custpage_sl_prod_labor";
        const sublistButtons = document.getElementById(sublistId + "_buttons");
        if(!sublistButtons) return;
        let curRow = sublistButtons.querySelector("table tr");
        
        let cellIndex = (curRow.cells.length - 1);
        let cell = curRow.insertCell(cellIndex);
        let inputElement = createCellElement(cell, sublistId, "Make Copy", "make_copy");
        let parentElement = inputElement.parentElement;

        inputElement.addEventListener("mouseover",  () => {
            parentElement.style.setProperty("background-color", "#E8E8E8", "important");
        });
        inputElement.addEventListener("mouseleave",  () => {
            parentElement.style.setProperty("background-color", "#F2F2F2", "important");
        });
        inputElement.addEventListener("click", (e) => {
            custpage_sl_prod_labor_machine.copyline();
        });
    }

    const addButtonNextLine = (curRec) => {
        let sublistId = "custpage_sl_prod_labor";
        const sublistButtons = document.getElementById(sublistId + "_buttons");
        if(!sublistButtons) return;
        let curRow = sublistButtons.querySelector("table tr");
        
        let cellIndex = (curRow.cells.length - 1);
        let cell = curRow.insertCell(cellIndex);
        let inputElement = createCellElement(cell, sublistId, "Next Line", "next_line");
        let parentElement = inputElement.parentElement;

        inputElement.addEventListener("mouseover",  () => {
            parentElement.style.setProperty("background-color", "#E8E8E8", "important");
        });
        inputElement.addEventListener("mouseleave",  () => {
            parentElement.style.setProperty("background-color", "#F2F2F2", "important");
        });
        inputElement.addEventListener("click", (e) => {
            // custpage_sl_prod_labor_machine.copyline();
            let curLineIdx = curRec.getCurrentSublistIndex('custpage_sl_prod_labor')
            // curRec.commitLine(sublistId);
            try {
                curRec.selectLine(sublistId, curLineIdx + 1);
            } catch (err) {
                curRec.selectNewLine(sublistId);
            }
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
        let sublistId = scriptContext.sublistId;

        fieldChanged_Subsidiary(curRec, fieldId, sublistId);
        fieldChanged_Location(curRec, fieldId, sublistId);
        fieldChanged_DateTimeSublistProdLabor(curRec, fieldId, sublistId);
    }

    const fieldChanged_Subsidiary = async (curRec, fieldId, sublistId) => {
        if(!!sublistId) return;

        if(fieldId === 'custpage_subsidiary') {
            let subsidiary_id = curRec.getValue(fieldId);

            let fLocation = curRec.getField('custpage_location');
            fLocation.removeSelectOption({value: null});

            let fWorkCenter = curRec.getField('custpage_work_center');
            fWorkCenter.removeSelectOption({value: null});

            let fWoTKSX = curRec.getField('custpage_sothongke');
            fWoTKSX.removeSelectOption({value: null});

            if(!!subsidiary_id) {
                _scvForm.showLoadingDialog(true);
                let params = _scvForm.getParameter();
                _scvForm.ajax.postAsync(_scvForm.serviceScript.url, {
                    action: "getDataLocation", 
                    custpage_subsidiary: params.custpage_subsidiary,
                }, function(_res, _paramsCallback){
                    let data = _res.data;
                    insertFieldSelectOption({objField: fLocation, data});

                    _scvForm.showLoadingDialog(false);
                    
                },function(request, status, error, _paramsCallback){
                    _scvForm.showMsgError(error.message||status);
                    _scvForm.showLoadingDialog(false);
                });
            }
        }
    }

    const fieldChanged_Location = async (curRec, fieldId, sublistId) => {
        if(!!sublistId) return;

        if(fieldId === 'custpage_location') {
            let location_id = curRec.getValue(fieldId);

            let fWorkCenter = curRec.getField('custpage_work_center');
            fWorkCenter.removeSelectOption({value: null});

            let fWoTKSX = curRec.getField('custpage_sothongke');
            fWoTKSX.removeSelectOption({value: null});

            if(!!location_id) {
                _scvForm.showLoadingDialog(true);
                let params = _scvForm.getParameter();

                let arrActionFunc = [
                    { action: "getDataEntityGroup", params: {...params}, data: [] },
                    { action: "getDataWoTKSX", params: {...params}, data: [] },
                ];

                _scvForm.ajax.postAsyncMulti(_scvForm.serviceScript.url, arrActionFunc, function (_res){
                    let arrEntityGroup = _res.find(e => e.action == "getDataEntityGroup").data;
                    let arrWoTKSX = _res.find(e => e.action == "getDataWoTKSX").data;

                    insertFieldSelectOption({
                        objField: fWorkCenter, data: arrEntityGroup, keyLabel: "groupname"
                    });
                    insertFieldSelectOption({objField: fWoTKSX, data: arrWoTKSX, isLineEmpty: false});

                    constRecord.initQuickFindFieldSelect(curRec, "custpage_sothongke", {
                        data: curRec.getField("custpage_sothongke").getSelectOptions(),
                        valueExpr: "value",
                        displayExpr: "text",
                        reInsertOption: false
                    }, false);

                    _scvForm.showLoadingDialog(false);
                });
            }
        }
    }

    const insertFieldSelectOption = ({
        objField, 
        data, 
        keyId = "id", 
        keyLabel = "name", 
        isLineEmpty = true
    }) => {
        if(isLineEmpty) {
            objField.insertSelectOption({ value: '', text: '' });
        }

        for(let obj of data) {
            objField.insertSelectOption({ value: obj[keyId], text: obj[keyLabel] });
        }
    }

    const fieldChanged_DateTimeSublistProdLabor = (curRec, fieldId, sublistId) => {
        if(sublistId !== 'custpage_sl_prod_labor') return;

        // TODO: 260904 bỏ logic này cho bản version 2
        // let isChangeShift = curRec.getValue('custpage_ischange_shift');
        // if (isChangeShift) return;

        // if(fieldId === 'custpage_col_shift') {
        //     let shiftId = curRec.getCurrentSublistValue(sublistId, 'custpage_col_shift');
        //     let objShift = retrieveObjByShiftId(shiftId);
        //     let minutes = getMinutesByBetWeenTime(objShift.custrecord_scv_start_time, objShift.custrecord_scv_end_time);

        //     curRec.setValue({ fieldId: 'custpage_ischange_shift', value: true, ignoreFieldChange: true });
        //     curRec.setCurrentSublistText(sublistId, 'custpage_col_start_date', objShift.custrecord_scv_start_time || '');
        //     curRec.setCurrentSublistText(sublistId, 'custpage_col_end_date', objShift.custrecord_scv_end_time || '');
            
        //     // TODO: logic ngày 25/05/25 (thời gian làm việc trong ca bắt buộc = 480 phút). Nếu khác thì cảnh báo
        //     validateShiftMinutes(curRec, sublistId, minutes);

        //     curRec.setValue({ fieldId: 'custpage_ischange_shift', value: false, ignoreFieldChange: true });
        // } 
        // else 
        if(['custpage_col_start_date', 'custpage_col_end_date'].includes(fieldId)) {
            // isChangeShift = curRec.getValue('custpage_ischange_shift');
            // if (isChangeShift) return;

            // TODO: logic ngày 25/05/25 (thời gian làm việc trong ca bắt buộc = 480 phút). Nếu khác thì cảnh báo
            let startDate = curRec.getCurrentSublistValue(sublistId, 'custpage_col_start_date');
            let endDate = curRec.getCurrentSublistValue(sublistId, 'custpage_col_end_date');
            if(!!startDate && !!endDate) {
                let minutes = getMinutesByBetWeenTime(startDate, endDate);
                validateShiftMinutes(curRec, sublistId, minutes);
            } else {
                curRec.setCurrentSublistValue(sublistId, 'custpage_col_times', null);
            }
        }
    }

    function validateShiftMinutes(curRec, sublistId, minutes) {
        if (minutes === 480) {
            curRec.setCurrentSublistValue(sublistId, 'custpage_col_times', minutes);
        } else {
            let message = minutes < 480 
                ? "Số phút của ca làm việc chưa đủ 480 phút!" 
                : "Số phút của ca làm việc vượt quá 480 phút!";
            alert(message);
            curRec.setCurrentSublistValue(sublistId, 'custpage_col_times', minutes);
        }
    }

    const getMinutesByBetWeenTime = (startTime, endTime) => {
        if(!startTime || !endTime) return 0;
        let startDate = startTime, endDate = endTime;

        if(typeof startDate === 'string') {
            startDate = format.parse({ value: startDate, type: "timeofday" });
        }
        if(typeof endDate === 'string') {
            endDate = format.parse({ value: endDate, type: "timeofday" });
        }

        if(endDate < startDate) {
            endDate = endDate.setHours(endDate.getHours() + 24);
        }
        
        let ms = endDate - startDate;
        let minutes = Math.ceil(ms / (1000 * 60));

        return minutes;
    }

    const retrieveObjByShiftId = (shiftId) => {
        if(!shiftId) return {};

        let resultSearch = search.create({
            type: 'customrecord_mfgmob_shift',
            filters: [
                ['isinactive', 'is', 'F'],
                "AND",
                ['internalid', 'anyof', shiftId]
            ],
            columns: ['internalid', 'custrecord_mfgmob_shiftdescription', 'custrecord_scv_mfg_shift_hrs', 'custrecord_scv_start_time', 'custrecord_scv_end_time']
        });
        resultSearch = resultSearch.run().getRange(0, 1);

        let objResult = {};
        for(let objSearch of resultSearch) {
            objResult = {
                internalid: objSearch.getValue('internalid'),
                custrecord_mfgmob_shiftdescription: objSearch.getValue('custrecord_mfgmob_shiftdescription'),
                custrecord_scv_mfg_shift_hrs: objSearch.getValue('custrecord_scv_mfg_shift_hrs'),
                custrecord_scv_start_time: objSearch.getValue('custrecord_scv_start_time'),
                custrecord_scv_end_time: objSearch.getValue('custrecord_scv_end_time'),
            };
        }
        return objResult;
    }

    /**
     * Validation function to be executed when sublist line is committed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateLine(scriptContext) {
        const curRec = scriptContext.currentRecord;
        const sublistId = scriptContext.sublistId;

        if(sublistId === 'custpage_sl_prod_labor') {
            const date = curRec.getCurrentSublistValue(sublistId, 'custpage_col_date');
            const shift = curRec.getCurrentSublistValue(sublistId, 'custpage_col_shift');
            if(!!date && !!shift) {
                curRec.setCurrentSublistValue(sublistId, 'custpage_col_action', ActionType.Add.ID);
            }
        }
        return true;
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

    const onSearchResult = () => {
        window.onbeforeunload = null;

        let isValid = _scvForm.validateFieldMandatory(["custpage_subsidiary", "custpage_location"]);
        if(!isValid) return;

        _scvForm.showLoadingDialog(true);
        const params = _scvForm.getParameter();

        const BASE_URL = url.resolveScript({
            scriptId: Suitelet.ID,
            deploymentId: Suitelet.DEPLOYID_UI,
            returnExternalUrl: false
        });

        let urlDC = BASE_URL + plusParam(params) + "&isrun=T";
        window.location.replace(urlDC);
    }

    const onAutoFill = async () => {
        window.onbeforeunload = null;
        let currRecord = _scvForm.currentRecord;

        _scvForm.showLoadingDialog(true);
        await delay(200);

        let fields = [
            "custpage_col_wocompletion", "custpage_col_date", "custpage_col_shift", "custpage_col_start_date", "custpage_col_end_date",
            "custpage_col_times", "custpage_col_employee1", "custpage_col_employee2", "custpage_col_employee3", "custpage_col_employee4",
            "custpage_col_op_sequence", "custpage_col_qty_completed", "custpage_col_memo"
        ];

        let sublistId = 'custpage_sl_prod_labor';
        let objRes = getDataFirstLineSublist(currRecord, sublistId, fields);
        const objFirstLine = objRes.data;
        const arrFieldMandatory = objRes.arrFieldMandatory;

        if(arrFieldMandatory.length === 0) {
            await updateLineProdLaborNoneAsyn(currRecord, sublistId, objFirstLine, 1);
        } else {
            alert("Vui lòng nhập đầy đủ thông tin bắt buộc và lưu dòng đầu tiên để thực hiện thao tác Auto Fill!");
            _scvForm.showLoadingDialog(false);
        }
    }

    const updateLineProdLaborNoneAsyn = async (currRecord, sublistId, objFirstLine, lineIndex) => {
        let lc = currRecord.getLineCount({ sublistId: sublistId});
        if(lineIndex < lc) {
            currRecord.selectLine({ sublistId: sublistId, line: lineIndex });

            for(let property in objFirstLine) {
                let value = currRecord.getCurrentSublistValue(sublistId, property);
                if(!value && !!objFirstLine[property]) {
                    currRecord.setCurrentSublistValue(sublistId, property, objFirstLine[property]);
                }
            }

            await delay(0).then(() => {
                currRecord.commitLine({ sublistId: sublistId });
            });

            await updateLineProdLaborNoneAsyn(currRecord, sublistId, objFirstLine, lineIndex + 1);
        } else {
            _scvForm.showLoadingDialog(false);
        }
    }

    const delay = (ms) => {
        return new Promise(function (resolve) {
            setTimeout(resolve, ms);
        });
    }

    const getDataFirstLineSublist = (curRec, sublistId, fields) => {
        let obj = {};
        let arrFieldMandatory = [];

        for(let fieldId of fields) {
            let value = curRec.getSublistValue(sublistId, fieldId, 0);
            obj[fieldId] = value;

            if(['custpage_col_date', 'custpage_col_shift'].includes(fieldId) && !value) {
                arrFieldMandatory.push(fieldId);
            }
        }
        return {data: obj, arrFieldMandatory};
    }

    function plusParam(params) {
        return '&custpage_subsidiary=' + params.custpage_subsidiary
            + '&custpage_shift=' + params.custpage_shift
            + '&custpage_work_center=' + params.custpage_work_center
            + '&custpage_lot_no=' + params.custpage_lot_no
            + '&custpage_sothongke=' + params.custpage_sothongke
            + '&custpage_location=' + params.custpage_location
            + '&custpage_fromdt=' + params.custpage_fromdt
            + '&custpage_todt=' + params.custpage_todt
    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        saveRecord: saveRecord,
        validateLine: validateLine,

        onSearchResult: onSearchResult,
        onAutoFill: onAutoFill,
    };
    
});
