/**
 * =======================================================================================
 *  Date                Author                  Description
 *  ?                   ?                       ?
 *  13 Dec 2024         Phu Pham                Không set empty cho custcol_scv_ori_lineid trên record kế hoạch mua hàng nếu thoả mãn điều kiện from mr. Hải
 */
/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record'],

    function (record) {
        function pageInit(scriptContext) {

        }


        function validateLine(scriptContext) {
            const currentRecord = scriptContext.currentRecord;
            let isValid = checkUpdateEmptyOriLineIdPurPlan(currentRecord);
            if(isValid) return true;
            
            const sublistId = scriptContext.sublistId;
            if (!!sublistId && sublistId === getSublistId(currentRecord.type) && lineIsCopied(currentRecord, sublistId)) {
                currentRecord.setCurrentSublistValue(sublistId, 'custcol_scv_ori_lineid', '', true);
            }
            return true;
        }

        const getSublistId = (recType) => {
            if (recType === record.Type.INVENTORY_ADJUSTMENT) return 'inventory';
            return 'item';
        };

        const lineIsCopied = (curRec, sublistId) => !curRec.getCurrentSublistValue({
            sublistId: sublistId,
            fieldId: 'line'
        });

        const checkUpdateEmptyOriLineIdPurPlan = (curRec) => {
            if(curRec.type !== "custompurchase_scv_purchase_plan") return false;

            let params = getObjParams(curRec);
            if(!!params.fileId && params.rectype === "custompurchase_scv_purchase_plan" && !!params.recid) {
                return true;
            }
            return false;
        }

        function getObjParams (curRec) {
            let strParams = curRec.getValue('entryformquerystring').split('&');
            let objParams = {};
            for (let i = 0; i < strParams.length; i++) {
                let arr = strParams[i].split('=');
                objParams[arr[0]] = arr[1];
            }
            return objParams;
        }

        return {
            pageInit: pageInit,
            validateLine: validateLine
        };

    });
