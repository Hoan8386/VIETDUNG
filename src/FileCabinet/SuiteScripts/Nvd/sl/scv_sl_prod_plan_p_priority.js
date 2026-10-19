/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  28 May 2025         Huy Pham			    Init, create file, Production Planning, from mr.Trương Phúc(https://app.clickup.com/t/86cxfpxbb?comment=90160112390437)
 */
/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define([
    '../cons/scv_cons_form.js',
],
    
    (
        constForm,
    ) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            constForm.setContext(scriptContext);

            let request = scriptContext.request;
            let params = request.parameters;
    
            onCreateFormUI(params);
    
            constForm.writePage();
        }

        const onCreateFormUI = (_params) =>{
            constForm.createForm({title: "Update Priority", hideNavBar: true}, "../cs/scv_cs_sl_prod_plan_p_priority.js");

            constForm.addButton({id: "custpage_btn_update", label: "Update", functionName: "updateResult()"},{
                styleSubmit: true
            });
            constForm.addButton({id: "custpage_btn_cancel", label: "Cancel", functionName: "canelPopup()"});
            
            constForm.addGridDx({
                id: "custpage_sl_result",
                type: "grid",
                label: 'Update Priority',
                columns: [
                    //{dataField: "custpage_col_stt", caption: "STT", dataType: "number", allowEditing: false},
                    {dataField: "custpage_col_priority", caption: "Ưu tiên", dataType: "number", allowEditing: true},
                    {dataField: "custpage_col_tksx", caption: "Số thống kê sản xuất", dataType: "string", allowEditing: false},
                ],
                optionsDx: {
                    width: "100%",
                    height: "400px",
                    export: {enabled: false},
                    searchPanel: {visible: false},
                    headerFilter: {visible: false},
                    editing: {allowUpdating: true},
                    columnChooser: {enabled: true, mode: "select"},
                }
            });
        }

        return {
            onRequest,
        }

    });
