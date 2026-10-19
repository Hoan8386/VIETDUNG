/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/runtime', 'N/search',
        '../cons/scv_cons_display_info.js'],
    
    (runtime, search,
     ConsDisplayInfo) => {
        
        /**
         * Defines the function definition that is executed before record is loaded.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @param {Form} scriptContext.form - Current form
         * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
         * @since 2015.2
         */
        const beforeLoad = (scriptContext) => {
            try {
                let triggerType = scriptContext.type;
                if (['edit', 'copy', 'view'].includes(triggerType)) {//, 'create'
                    let newRec = scriptContext.newRecord;
                    const recordType = newRec.type;
                    const roleInternalId = runtime.getCurrentUser().role;
                    if (roleInternalId === ConsDisplayInfo.ROLE_ADMIN_ID) return;
                    const lkRole = search.lookupFields({
                        type: search.Type.ROLE,
                        id: roleInternalId,
                        columns: ['custrecord_scv_view_plan_cost']
                    });
                    const isDisplayCost = lkRole.custrecord_scv_view_plan_cost;
                    if (isDisplayCost) return;
                    let form = scriptContext.form;
                    const objDataConfig = getDataConfig(recordType);
                    let objSublist = form.getSublist(objDataConfig.sublistId);
                    let objField = objSublist.getField(objDataConfig.fieldIdDisplay);
                    let labelColumnQty = objField.label;
                    const dataSublist = getDataSublist(newRec, objDataConfig.sublistId, objDataConfig.fieldIdDisplay);
                    const arrItemId = dataSublist.map(o => o.itemId);
                    const arrIdItemOtherCharge = getArrIdItemOtherCharge(arrItemId);
                    const arrIndexLineHidden = dataSublist.filter(o => arrIdItemOtherCharge.includes(o.itemId)).map(o => (o.index + 1)); // start with 1
                    let objFieldCustomQty = objSublist.addField({
                        id: ConsDisplayInfo.COLUMN_ID_QUANTITY,
                        label: labelColumnQty,
                        type: objField.type
                    }).updateDisplayType({
                        displayType: 'ENTRY'
                    });
                    if (triggerType !== 'view') {
                        objSublist.insertField(objFieldCustomQty, objDataConfig.fieldIdDisplay);
                        objField.updateDisplayType({displayType: 'NODISPLAY'});
                        objField.label = ' ';
                        copyValueQtyColumnToColumnCustom(newRec, objDataConfig.sublistId, objDataConfig.fieldIdDisplay, ConsDisplayInfo.COLUMN_ID_QUANTITY, arrIndexLineHidden);
                        if (newRec.type === ConsDisplayInfo.RECORD_TYPE.WORK_ORDER) {
                            let objFieldQtyUsed = objSublist.getField(ConsDisplayInfo.COLUMN_ID_STD_QUANTITY_USED);
                            let labelQtyUsed = objFieldQtyUsed.label;
                            let objFieldCustomQtyUsed = objSublist.addField({
                                id: ConsDisplayInfo.COLUMN_ID_STD_QUANTITY_USED_CUSTOM,
                                label: labelQtyUsed,
                                type: objFieldQtyUsed.type
                            });
                            objSublist.insertField(objFieldCustomQtyUsed, ConsDisplayInfo.COLUMN_ID_STD_QUANTITY_USED);
                            objFieldQtyUsed.updateDisplayType({displayType: 'HIDDEN'});
                            objFieldCustomQtyUsed.updateDisplayType({displayType: 'DISABLED'});
                            copyValueQtyColumnToColumnCustom(newRec, objDataConfig.sublistId, ConsDisplayInfo.COLUMN_ID_STD_QUANTITY_USED, ConsDisplayInfo.COLUMN_ID_STD_QUANTITY_USED_CUSTOM, arrIndexLineHidden);
                        }
                    }
                    if (arrIndexLineHidden.length === 0) return;
                    let objInlineHtml = form.addField({
                        type: 'inlinehtml',
                        id: 'custpage_scv_inlinehtml_df',
                        label: ' '
                    }).updateLayoutType({layoutType: 'OUTSIDEABOVE'});
                    const fldIdQtyUsed = newRec.type === ConsDisplayInfo.RECORD_TYPE.WORK_ORDER ? ConsDisplayInfo.COLUMN_ID_STD_QUANTITY_USED : '';
                    const labelQtyUsed = newRec.type === ConsDisplayInfo.RECORD_TYPE.WORK_ORDER ? objSublist.getField(ConsDisplayInfo.COLUMN_ID_STD_QUANTITY_USED)?.label : '';
                    objInlineHtml.defaultValue = getContentScript({
                        sublistId: objDataConfig.sublistId,
                        fieldIdQty: objDataConfig.fieldIdDisplay,
                        labelColumnQty: labelColumnQty,
                        triggerType: triggerType,
                        arrIndexLineHidden: arrIndexLineHidden,
                        fldIdQtyUsed: fldIdQtyUsed,
                        labelQtyUsed: labelQtyUsed
                    });
                }
            } catch (e) {
                log.audit('Error Beforeload: ', e);
            }
        };
        
        const copyValueQtyColumnToColumnCustom = (newRec, sublistId, fldIdQty, fldIdQtyCustom, arrIndexLineHidden) => {
            const lc = newRec.getLineCount(sublistId);
            for (let i = 0; i < lc; i++) {
                let valQty = newRec.getSublistValue({sublistId: sublistId, fieldId: fldIdQty, line: i});
                if (arrIndexLineHidden.includes(i + 1)) valQty = '';
                newRec.setSublistValue({sublistId: sublistId, fieldId: fldIdQtyCustom, line: i, value: valQty});
            }
        };
        
        const getContentScript = (options) => {
            let {
                sublistId,
                fieldIdQty,
                labelColumnQty,
                arrIndexLineHidden,
                triggerType,
                fldIdQtyUsed,
                labelQtyUsed
            } = options;
            return `<script type="text/javascript">
            const labelQtyUsed = '${labelQtyUsed}';
            const fldIdQtyUsed = '${fldIdQtyUsed}';
            const sublistId = '${sublistId}';
            const fieldIdQty = '${fieldIdQty}';
            const triggerType = '${triggerType}';
            const labelColumnQty = '${labelColumnQty}';
            const arrIndexLineHidden = '${arrIndexLineHidden.toString()}'.split(',');
            const columnHeaderId = 'columnheader_'+ sublistId + '_' + fieldIdQty;
            const elementIdSublist = sublistId+'_splits';
            const queryStr = 'table#'+elementIdSublist+'>tbody>tr';
            let fnFindIndexWithQty = function (o) { return NS.jQuery(o).attr('data-label') === labelColumnQty; };
            let fnFindIndexQtyUsedBom = function (o) { return NS.jQuery(o).attr('data-label') === labelQtyUsed; };
            document.addEventListener('DOMContentLoaded', function() {
                let timeId;
                let indexFieldQty;
                let indexFieldQtyUsedBom;
                timeId = setInterval(function (){
                    let eleTrSublist = NS.jQuery(queryStr);
                    if (eleTrSublist.length > 0) {
                        eleTrSublist.each(function(){
                        const rowIndex = this.rowIndex;
                        if (rowIndex < 1) {
                            indexFieldQty = [...NS.jQuery(this.children)].findIndex(fnFindIndexWithQty);
                            if (fldIdQtyUsed.length) indexFieldQtyUsedBom = [...NS.jQuery(this.children)].findIndex(fnFindIndexQtyUsedBom);
                        } 
                        else if (arrIndexLineHidden.includes(rowIndex.toString())){
                                const $row = NS.jQuery(this);
                                NS.jQuery([...$row.children()][indexFieldQty]).text('');
                             if (typeof indexFieldQtyUsedBom === 'number') {
                                NS.jQuery([...$row.children()][indexFieldQtyUsedBom]).text('');
                             }
                        }
                        });
                    clearInterval(timeId);
                    }
                }, 500);
            })</script>`;
        };
        
        const getArrIdItemOtherCharge = (arrItemId) => {
            if (arrItemId.length === 0) return [];
            let searchObj = search.create({
                type: search.Type.ITEM,
                filters: [
                    search.createFilter({
                        name: 'internalid',
                        operator: search.Operator.ANYOF,
                        values: arrItemId
                    }),
                    search.createFilter({
                        name: 'type',
                        operator: search.Operator.ANYOF,
                        values: ['OthCharge']
                    })
                ],
                columns: ['itemid']
            });
            let searchData = searchObj.run().getRange(0, 1000);
            const sz = searchData.length;
            let result = [];
            for (let i = 0; i < sz; i++) {
                result.push(searchData[i].id.toString());
            }
            return result;
        }
        
        const getDataConfig = (recordType) => {
            let [sublistId, fieldIdDisplay, nexFieldId] = ['component', 'quantity', 'quantity'];
            if (recordType === ConsDisplayInfo.RECORD_TYPE.WORK_ORDER) {
                sublistId = 'item';
                fieldIdDisplay = 'quantity';
            } else if (recordType === ConsDisplayInfo.RECORD_TYPE.BOM_REVISION) {
                sublistId = 'component';
                fieldIdDisplay = 'bomquantity';
            }
            return {
                sublistId,
                fieldIdDisplay,
                nexFieldId
            };
        };
        
        const getDataSublist = (curRec, sublistId) => {
            let result = [];
            let lc = curRec.getLineCount(sublistId);
            for (let i = 0; i < lc; i++) {
                let itemId = curRec.getSublistValue(sublistId, 'item', i);
                result.push({
                    itemId,
                    index: i
                });
            }
            return result;
        };
        
        
        return {
            beforeLoad
        }
        
    });
