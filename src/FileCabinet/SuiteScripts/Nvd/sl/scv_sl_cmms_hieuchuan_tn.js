/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/format', 'N/record', 'N/runtime', 'N/search', 'N/ui/serverWidget', 'N/url',
        '../lib/scv_lib_cmms.js', '../lib/scv_lib_report.js'],
    
    (format, record, runtime, search, serverWidget, url, libCmms, libRep) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            let request =  scriptContext.request;
            let response = scriptContext.response;
            
            let subsidiary = runtime.getCurrentUser().subsidiary;
            
            if(request.method === 'GET') {
                let form = createForm(request.parameters);
                
                response.writePage(form);
            } else {
                let recPurchaseRequest = record.create({type: libCmms.CmmsRecordType.PURCHASE_REQUEST, isDynamic: true});
                setHeaderFieldPurchaseRequest(recPurchaseRequest, subsidiary);
                setCurrentSublistValuePurchaseRequest(recPurchaseRequest, libCmms.CmmsSublistId.ITEM);
                
                let purchaseRequestId = recPurchaseRequest.save({ignoreMandatoryFields: true});
                
                writeRedirectToPurchaseRequest(response, purchaseRequestId);
            }
        }
        
        const createForm = (parameters) => {
            let form = serverWidget.createForm({title: "Mua ngoài", hideNavBar: true});
            form.addSubmitButton({label: 'Mua ngoài'});
            let fieldTextConfirm = form.addField({id: 'custpage_textconfirm', label: ' ', type: serverWidget.FieldType.INLINEHTML});
            fieldTextConfirm.defaultValue = 'Bạn có muốn tạo mua ngoài không?';
            
            libRep.addFieldHidden(form, 'custpage_scbd', parameters.custpage_scbd);
            
            return form;
        }
        
        const writeRedirectToPurchaseRequest = (response, purchaseRequestId) => {
            let redirectUrl = url.resolveRecord({recordType: libCmms.CmmsRecordType.PURCHASE_REQUEST, recordId: purchaseRequestId, isEditMode: false}) + '&whence=';
            response.write(`
                <script>
                    if (window.parent) {
                        window.parent.location.href = "${redirectUrl}";
                        window.close();
                    } else {
                        window.location.href = "${redirectUrl}";
                    }
                </script>
            `);
        }
        
        const setHeaderFieldPurchaseRequest = (recPurchaseRequest, subsidiary) => {
            recPurchaseRequest.setValue('entity', libCmms.Entity.DEFAULT_PURCHASE_REQUEST);
            recPurchaseRequest.setValue('subsidiary', subsidiary);
        }
        
        const setCurrentSublistValuePurchaseRequest = (recPurchaseRequest, sublistId) => {
            recPurchaseRequest.setCurrentSublistValue({sublistId: sublistId, fieldId: 'item', value: libCmms.Item.THUE_NGOAI_SUA_CHUA_MAY_MOC_THIET_BI});
            recPurchaseRequest.setCurrentSublistValue({sublistId: sublistId, fieldId: 'custcol_scv_plan_qty', value: 1});
            recPurchaseRequest.setCurrentSublistText({sublistId: sublistId, fieldId: 'custcol_scv_day_of_needs', text: format.format({type: format.Type.DATE, value: libCmms.getDateNow(7)})});
            
            recPurchaseRequest.commitLine({sublistId: sublistId});
        }
        
        return {onRequest}

    });
