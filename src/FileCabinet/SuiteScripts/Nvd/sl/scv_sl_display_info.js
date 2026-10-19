/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/runtime', 'N/search',
        '../cons/scv_cons_display_info',],
    (runtime, search,
     ConsDisplayInfo) => {
        
        const onRequest = (ctx) => {
            let objParams = ctx.request.parameters;
            let objResult = {
                isSuccess: true,
                response: null,
                msg: ''
            };
            if (objParams.action === ConsDisplayInfo.CUSTOM_ACTION.CHECK_ITEM_TYPE_OTHER_CHARGE) {
                objResult.response = checkItemOtherCharge(objParams.itemid);
            } else if (objParams.action === ConsDisplayInfo.CUSTOM_ACTION.CHECK_PERMISSION_VIEW_COST_OF_ROLE) {
                objResult.response = checkPermissionViewPlanCost();
            }
            ctx.response.write(JSON.stringify(objResult));
        };
        
        const checkPermissionViewPlanCost = () => {
            const roleInternalId = runtime.getCurrentUser().role;
            const lkRole = search.lookupFields({
                type: search.Type.ROLE,
                id: roleInternalId,
                columns: ['custrecord_scv_view_plan_cost']
            });
            return lkRole.custrecord_scv_view_plan_cost;
        };
        
        const checkItemOtherCharge = (id) => {
            if (!id) return;
            let lkItem = search.lookupFields({
                type: search.Type.ITEM,
                id: id,
                columns: ['type']
            });
            return ConsDisplayInfo.ITEM_OTHER_CHARGE === lkItem.type[0].value;
        };
        
        return {
            onRequest
        };
    });