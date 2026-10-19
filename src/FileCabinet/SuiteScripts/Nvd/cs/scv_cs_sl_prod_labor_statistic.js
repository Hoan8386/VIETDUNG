/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([
    'N/currentRecord', 'N/url', 'N/query', 'N/search', 'N/format',
    '../cons/scv_cons_list_loc_type.js'
],

    function(currentRecord, url, query, search, format, constListLocType) {
        
        /**
         * Function to be executed after page is initialized.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
         *
         * @since 2015.2
         */
    
        const ACTION_TYPE = {
            EMPTY: { ID: "", NAME: "" },
            UNCHANGED: { ID: 1, NAME: "Unchanged" },
            EDIT: { ID: 2, NAME: "Edit" },
            ADD: { ID: 3, NAME: "Add" },
        };
    
        function pageInit(scriptContext) {
            // addButtonSelectEmpOnMachineRow(scriptContext.currentRecord);
            addButtonMakeCopy(scriptContext.currentRecord);
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
            // fieldChanged_EmpDepartment(curRec, fieldId, sublistId);
            fieldChanged_DateTimeSublistProdLabor(curRec, fieldId, sublistId);
        }
    
         /**
         * Function to be executed after sublist is inserted, removed, or edited.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @since 2015.2
         */
         function sublistChanged(scriptContext) {
    
         }
     
         /**
          * Function to be executed after line is selected.
          *
          * @param {Object} scriptContext
          * @param {Record} scriptContext.currentRecord - Current form record
          * @param {string} scriptContext.sublistId - Sublist name
          *
          * @since 2015.2
          */
         function lineInit(scriptContext) {
     
         }
     
         /**
          * Validation function to be executed when field is changed.
          *
          * @param {Object} scriptContext
          * @param {Record} scriptContext.currentRecord - Current form record
          * @param {string} scriptContext.sublistId - Sublist name
          * @param {string} scriptContext.fieldId - Field name
          * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
          * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
          *
          * @returns {boolean} Return true if field is valid
          *
          * @since 2015.2
          */
         function validateField(scriptContext) {
     
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
            let currRecord = scriptContext.currentRecord;
            let sublistId = scriptContext.sublistId;
            if(sublistId !== 'custpage_sl_prod_labor') return true;
    
            let internalid = currRecord.getCurrentSublistValue(sublistId, "custpage_col_internalid");
            let date = currRecord.getCurrentSublistValue(sublistId, "custpage_col_date");
            if(!internalid) {
                if(!date) {
                    currRecord.setCurrentSublistValue(sublistId, "custpage_col_date", new Date());
                }
                currRecord.setCurrentSublistValue(sublistId, "custpage_col_action", ACTION_TYPE.ADD.ID);
                currRecord.setCurrentSublistValue(sublistId, "custpage_col_subsidiary", currRecord.getValue("custpage_subsidiary"));
                currRecord.setCurrentSublistValue(sublistId, "custpage_col_location", currRecord.getValue("custpage_location"));
                currRecord.setCurrentSublistValue(sublistId, "custpage_col_work_center", currRecord.getValue("custpage_work_center"));
            }
            return true;
         }
     
         /**
          * Validation function to be executed when sublist line is inserted.
          *
          * @param {Object} scriptContext
          * @param {Record} scriptContext.currentRecord - Current form record
          * @param {string} scriptContext.sublistId - Sublist name
          *
          * @returns {boolean} Return true if sublist line is valid
          *
          * @since 2015.2
          */
         function validateInsert(scriptContext) {
     
         }
     
         /**
          * Validation function to be executed when record is deleted.
          *
          * @param {Object} scriptContext
          * @param {Record} scriptContext.currentRecord - Current form record
          * @param {string} scriptContext.sublistId - Sublist name
          *
          * @returns {boolean} Return true if sublist line is valid
          *
          * @since 2015.2
          */
         function validateDelete(scriptContext) {
     
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
            // alert("saveRecord");
            return true;
        }
    
        const onSearchResult = () => {
            window.onbeforeunload = null;
            const BASE_URL = url.resolveScript({
                scriptId: 'customscript_scv_sl_prod_labor_statistic',
                deploymentId: 'customdeploy_scv_sl_prod_labor_statistic',
                returnExternalUrl: false
            });
    
            let currRecord = currentRecord.get();
            let objFieldMandatory = validateFieldsMandatory(currRecord, ["custpage_subsidiary", "custpage_location", "custpage_work_center"]);
            if(!objFieldMandatory.isValidate) {
                return alert(objFieldMandatory.notification);
            }
    
            let urlDC = BASE_URL + plusParam(currRecord) + "&isrun=T";
            window.location.replace(urlDC);
        }
    
        const onSubmitEmployee = () => {
            window.onbeforeunload = null;
    
            let gridRight = $("#scvGridRight").dxDataGrid("instance");
            let dataSource = gridRight.getDataSource().items();
            
            let arrEmpId = dataSource.map(e => e.id).join(",") || "";
            let arrEmpName = dataSource.map(e => e.name).join(", ") || "";
    
            window.parent.nlapiSetCurrentLineItemValue("custpage_sl_prod_labor", "custpage_col_employee", arrEmpId);
            window.parent.nlapiSetCurrentLineItemValue("custpage_sl_prod_labor", "custpage_col_employee_display", arrEmpName);
    
            closePopup();
        }
    
        const addButtonSelectEmpOnMachineRow = (curRec) => {
            let sublistId = "custpage_sl_prod_labor";
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
                nlapiSetCurrentLineItemValue(sublistId, "custpage_col_action", ACTION_TYPE.ADD.ID);
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

        const fieldChanged_EmpDepartment = (curRec, fieldId, sublistId) => {
            if(!!sublistId) return;

            if(fieldId === 'custpage_emp_department') {
                let department_id = curRec.getValue(fieldId);
                let emp_default = curRec.getValue("custpage_emp_default");
                if(!department_id) return;

                window.onbeforeunload = null;
                const BASE_URL = url.resolveScript({
                    scriptId: 'customscript_scv_sl_prod_labor_statistic',
                    deploymentId: 'customdeploy_scv_sl_prod_labor_statistic',
                    returnExternalUrl: false
                });
    
                let urlDC = BASE_URL + emp_default + "&department=" + department_id + "&ifrmcntnr=T";
                window.location.replace(urlDC);
            }
        }

        const fieldChanged_Subsidiary = async (curRec, fieldId, sublistId) => {
            if(!!sublistId) return;

            if(fieldId === 'custpage_subsidiary') {
                let subsidiary_id = curRec.getValue(fieldId);

                let fLocation = curRec.getField('custpage_location');
                fLocation.removeSelectOption({value: null});

                let fWorkCenter = curRec.getField('custpage_work_center');
                fWorkCenter.removeSelectOption({value: null});

                if(!!subsidiary_id) {
                    let requestUrl = `/app/site/hosting/scriptlet.nl?script=2182&deploy=2&action=getDataLocation&custpage_subsidiary=${subsidiary_id}`;
                    const response = await fetchDataMethodGet(requestUrl);
                    const data = response.data;

                    fLocation.insertSelectOption({ value: '', text: '' });
                    for(let obj of data) {
                        fLocation.insertSelectOption({ value: obj.id, text: obj.name });
                    }
                }
            }
        }

        const fieldChanged_Location = async (curRec, fieldId, sublistId) => {
            if(!!sublistId) return;

            if(fieldId === 'custpage_location') {
                let fWorkCenter = curRec.getField('custpage_work_center');
                fWorkCenter.removeSelectOption({value: null});
                let location_id = curRec.getValue(fieldId);

                if(!location_id) return;

                let requestUrl = `/app/site/hosting/scriptlet.nl?script=2182&deploy=2&action=getDataEntityGroup&custpage_location=${location_id}`;
                const response = await fetchDataMethodGet(requestUrl);
                const data = response.data;

                fWorkCenter.insertSelectOption({ value: '', text: '' });

                for(let obj of data) {
                    fWorkCenter.insertSelectOption({ value: obj.id, text: obj.groupname });
                }
            }
        }

        const fetchDataMethodGet = async (requestUrl) => {
            try {
                const response = await fetch(requestUrl, {
                    method: 'GET',
                });

                if (!response.ok) {
                    throw new Error(`Error fetching ${requestUrl}: ${response.status}`);
                }

                return await response.json();
            } catch (error) {
                console.error(error.message);
                return null;
            }
        };
    
        const fieldChanged_DateTimeSublistProdLabor = (curRec, fieldId, sublistId) => {
            if(sublistId !== 'custpage_sl_prod_labor') return;
    
            let isChangeShift = curRec.getValue('custpage_ischange_shift');
            if (isChangeShift) return;
    
    
            if(fieldId === 'custpage_col_shift') {
                let shiftId = curRec.getCurrentSublistValue(sublistId, 'custpage_col_shift');
                let objShift = retrieveObjByShiftId(shiftId);
                let minutes = getMinutesByBetWeenTime(objShift.custrecord_scv_start_time, objShift.custrecord_scv_end_time);
    
                curRec.setValue({ fieldId: 'custpage_ischange_shift', value: true, ignoreFieldChange: true });
                curRec.setCurrentSublistText(sublistId, 'custpage_col_start_date', objShift.custrecord_scv_start_time || '');
                curRec.setCurrentSublistText(sublistId, 'custpage_col_end_date', objShift.custrecord_scv_end_time || '');
                
                // TODO: logic ngày 25/05/25 (thời gian làm việc trong ca bắt buộc = 480 phút). Nếu khác thì cảnh báo
                validateShiftMinutes(curRec, sublistId, minutes);
    
                curRec.setValue({ fieldId: 'custpage_ischange_shift', value: false, ignoreFieldChange: true });
            } 
            else if(['custpage_col_start_date', 'custpage_col_end_date'].includes(fieldId)) {
                isChangeShift = curRec.getValue('custpage_ischange_shift');
                if (isChangeShift) return;
    
                // TODO: logic ngày 25/05/25 (thời gian làm việc trong ca bắt buộc = 480 phút). Nếu khác thì cảnh báo
                let startDate = curRec.getCurrentSublistValue(sublistId, 'custpage_col_start_date');
                let endDate = curRec.getCurrentSublistValue(sublistId, 'custpage_col_end_date');

                let minutes = getMinutesByBetWeenTime(startDate, endDate);
                validateShiftMinutes(curRec, sublistId, minutes);

                // let shiftId = curRec.getCurrentSublistValue(sublistId, 'custpage_col_shift');
                // let shiftName = curRec.getCurrentSublistText(sublistId, 'custpage_col_shift');
                // let employeeName = curRec.getCurrentSublistText(sublistId, 'custpage_col_employee_display') || "";
    
                // if(startDate && endDate && !!shiftId) {
                //     let shiftDescription = getHoursShiftDescription(shiftId);
                    
                //     let ms = endDate - startDate;
                //     let hours = Math.ceil(ms / (1000 * 60 * 60));
    
                //     if(shiftDescription > 0 && ((hours > shiftDescription) || (hours < 0 && Math.abs(hours) < shiftDescription))) {
                //         let overtime = hours - shiftDescription;
                //         if(hours < 0) {
                //             overtime = shiftDescription - Math.abs(hours);
                //         }
    
                //         let alert_msg = `Nhân viên [${employeeName}] đã làm việc vượt quá [${overtime} giờ] trong ca làm việc [${shiftName}].`;
                //         alert(alert_msg);
                //         curRec.setCurrentSublistValue(sublistId, 'custpage_col_end_date', '');
                //     }
                // }
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
    
        const getHoursShiftDescription = (shiftId) => {
            if(!shiftId) return 0;
    
            let sqlQuery = `SELECT id, name, custrecord_mfgmob_shiftdescription FROM customrecord_mfgmob_shift
                WHERE id = ${shiftId} AND isinactive = 'F'`;
                
            let resultSearch = query.runSuiteQL({
                query: sqlQuery,
                pageSize: 1
            });
    
            resultSearch = resultSearch.asMappedResults();
            return resultSearch.length > 0 ? (resultSearch[0].custrecord_mfgmob_shiftdescription * 1) : 0;
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
                + '&custpage_shift=' + currRecord.getValue('custpage_shift')
                + '&custpage_work_center=' + currRecord.getValue('custpage_work_center')
                + '&custpage_lot_no=' + currRecord.getValue('custpage_lot_no')
                + '&custpage_location=' + currRecord.getValue('custpage_location')
                + '&custpage_fromdt=' + currRecord.getText('custpage_fromdt')
                + '&custpage_todt=' + currRecord.getText('custpage_todt');
        }
    
        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            onSearchResult: onSearchResult,
            onSubmitEmployee: onSubmitEmployee,
            validateLine: validateLine,
            // saveRecord: saveRecord
        };
        
    });
    