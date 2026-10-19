/**
 * Nội dung: sử dụng cho màn hình Work Order.
 * ! file scv_cs_workorder bên dưới đang sử dụng cho suitelet
 * TODO:
 * Date               Author            Description
 * 29 Nov 2024        Phu Pham          Chức năng chọn lô trên chứng từ from mr. Bính (https://app.clickup.com/t/86cx6m7h0)
 * 20 Feb 2025        Duy Nguyen        NVD-MFG - Mặc định kho theo line trên lệnh sản xuất , from mr.Viet(https://app.clickup.com/t/86cy1mjww) */
/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['../cons/scv_cons_inventory_balance.js'],

    function (constInvBalance) {

        /**
         * Function to be executed after page is initialized.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
         *
         * @since 2015.2
         */
        function pageInit(scriptContext) {
            let curRec = scriptContext.currentRecord;
            constInvBalance.addButtonSelectLotOnMachineRow(curRec);
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
            const {sublistId, currentRecord, fieldId} = scriptContext;
            if (fieldId === 'item' && sublistId === 'item') {
                setCurrentLocForLineItem(currentRecord, sublistId);
            }
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

        const setCurrentLocForLineItem = (curRec, sublistId) => {
            const locationid = curRec.getValue('location');
            if (!locationid) return;
            const itemid = curRec.getCurrentSublistValue({sublistId: 'item', fieldId: 'item'});
            if (!itemid) return;
            const objRes = postDataSuitelet({
                itemid,
                locationid
            });
            if (typeof objRes !== 'object') return;
            if (!objRes.isSuccess) return;
            const locId = objRes.response || '';
            curRec.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'custcol_scv_default_location',
                value: locId
            });
        };

        const postDataSuitelet = (objParams) => {
            let resCall = window.nlapiRequestURL('/app/site/hosting/scriptlet.nl?script=customscript_scv_get_locs_items&deploy=customdeploy_scv_get_locs_items', {...objParams});
            if (resCall.code === 200) return JSON.parse(resCall.getBody());
            else {
                alert(resCall.error.toString())
            }
            return null;
        };

        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            // saveRecord: saveRecord
        };

    });
