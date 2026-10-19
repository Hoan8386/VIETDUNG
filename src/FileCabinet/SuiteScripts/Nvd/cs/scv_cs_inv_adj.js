/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  ?                   ?                       ?
 *  2 Mar 2025          Huy Pham			    Chọn được nhiều employee dưới line, from mr.Việt(https://app.clickup.com/t/86cy51581)
 */
/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/search',
    '../cons/scv_cons_record.js',
    '../cons/scv_cons_employee.js',
    '../cons/scv_cons_department.js',
],

    function (currentRecord, search,
        constRecord,
        constEmployee,
        constDepartment
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
        const pageInit = (scriptContext) => {
            commitDataLineMakeCopyIA(scriptContext);

            setTimeout(() => addButtonMultiEmployee(scriptContext.currentRecord), 0);
        }

        const getObjParams = (curRec) => {
            let strParams = curRec.getValue('entryformquerystring').split('&');
            let objParams = {};
            for (let i = 0; i < strParams.length; i++) {
                let arr = strParams[i].split('=');
                objParams[arr[0]] = arr[1];
            }
            return objParams;
        };

        const commitDataLineMakeCopyIA = (scriptContext) => {
            let mode = scriptContext.mode;
            if (['create', 'copy'].indexOf(mode) === -1) return;
            let curRec = currentRecord.get();
            let objParams = getObjParams(curRec);
            if (objParams.makecopy !== 'T') return;
            let slId = 'inventory';
            let lc = curRec.getLineCount(slId);
            for (let i = 0; i < lc; i++) {
                curRec.selectLine(slId, i);
                let avail = curRec.getCurrentSublistValue({sublistId: slId, fieldId: 'inventorydetailavail'});
                if (avail != 'T') {
                    curRec.commitLine(slId);
                    continue;
                }
                let invDetRec = curRec.getCurrentSublistSubrecord({sublistId: slId, fieldId: 'inventorydetail'});
                if (!invDetRec) {
                    curRec.commitLine(slId);
                    continue;
                }
                curRec.commitLine(slId);
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
        const fieldChanged = (scriptContext) => {
        }

        const addButtonMultiEmployee = (curRec) => {
            let arrEmployee = constEmployee.getDataSource(search.createFilter({
                name: 'department',
                operator: "anyof",
                values: [
                    constDepartment.RECORDS.TO_BOC_XEP.ID,
                    constDepartment.RECORDS.PHONG_KHO_VAN.ID,
                    constDepartment.RECORDS.TO_PHU_TRO.ID
                ]
            }));
            arrEmployee.forEach(objEmp =>{
                objEmp.memo = objEmp.department_display||"";
                if(!!objEmp.email){
                    objEmp.memo += " - " + objEmp.email;
                }
            })
            constRecord.addButtonSelectOnMachineRow(curRec, "inventory", "Select Employee", "custcol_scv_emp_process_id", {
                isMulti: true,
                displayFieldId: "custcol_scv_emp_process_name",
                data: arrEmployee,
                valueExpr: "internalid",
                displayExpr: "entityid",
                memoExpr: "memo"
            });
        }
        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged
        };

    });
