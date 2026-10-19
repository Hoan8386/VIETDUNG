/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  13 Dec 2024         Huy Pham                Init & create file, Nút Calculate tính toán trên màn hình Kế hoạch mua hàng, from mr.Hải(https://app.clickup.com/t/86cx9p7x4)
 */
/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record','N/redirect', 'N/search', 
    '../cons/scv_cons_purchaseplan.js',
    
],
    
    (record,redirect, search,
        constPurchasePlan
    ) => {

        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (context) => {
            let request = context.request;
            let params = request.parameters;

            let purPlanRec = record.load({type: "custompurchase_scv_purchase_plan", id: params.recid, isDynamic: true});
            let isValid = constPurchasePlan.validBtnCalculate(purPlanRec);

            if(isValid){
                //TO-Do
                constPurchasePlan.calculatePurchasePlan(purPlanRec);
            }

            redirect.toRecord({
                type: "custompurchase_scv_purchase_plan", 
                id: params.recid
            });
        }

        return {onRequest}

    });
