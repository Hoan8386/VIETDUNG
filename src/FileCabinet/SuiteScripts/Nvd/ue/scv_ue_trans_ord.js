/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define([
    'N/ui/serverWidget', 'N/search', 'N/query', 'N/record',
    '../cons/scv_cons_queue_job.js',
    '../common/scv_common_update_build.js',
],

    (
        serverWidget, search, query, record,
        constQueueJob,
        commonUpdateBuild,
    ) => {
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
            let triggerType = scriptContext.type;
            if (triggerType === 'view') {
                let newRec = scriptContext.newRecord;
                let form = scriptContext.form;
                let dataLotItems = getDataInventoryNumberId(newRec);
                if (dataLotItems.length === 0) return;
                const arrLotId = dataLotItems.map(o => o.lotId).flat(1);
                const dataLot = getDataInventoryNumber(arrLotId);
                fillDataLotToLine(form, dataLotItems, dataLot);
            }

            // if (['edit', 'create', 'copy'].includes(triggerType)) {
            //     let form = scriptContext.form;
            //     let sublist = form.getSublist({
            //         id: 'item'
            //     });
            //     ['custcol_scv_lot_serial_selected', 'custcol_scv_qc_serial_code'].forEach(fldId => {
            //         sublist.getField(fldId)?.updateDisplayType({
            //             displayType: 'disabled'
            //         });
            //     })
            // }
        };

        const fillDataLotToLine = (form, dataLotItems, dataLot) => {
            const slId = 'item';
            let sublist = form.getSublist(slId);
            const CustomCol = {
                INVENTORY_NUMBER: 'custpage_scv_lot_serial_number',
                COLOR_SERI: 'custpage_scv_color_seri'
            };
            let objLot = sublist.addField({id: CustomCol.INVENTORY_NUMBER, type: serverWidget.FieldType.TEXT, label: 'Lot/Serial Detail'});
            let objSeri = sublist.addField({id: CustomCol.COLOR_SERI, type: serverWidget.FieldType.TEXT, label: 'Seri màu Detail'});
            sublist.insertField(objLot, 'custcol_scv_memo');
            sublist.insertField(objSeri, 'custcol_scv_memo');
            const szDataLine = dataLotItems.length;
            for (let i = 0; i < szDataLine; i++) {
                let lotId = dataLotItems[i].lotId[0];
                const objFind = dataLot.find(o => o.id === lotId);
                if (objFind === undefined) continue;
                sublist.setSublistValue({id: CustomCol.INVENTORY_NUMBER, line: dataLotItems[i].index, value: objFind.inventorynumber ||'&nbsp;'})
                sublist.setSublistValue({id: CustomCol.COLOR_SERI, line: dataLotItems[i].index, value: objFind.colorSeri || '&nbsp;'});
            }
        };


        const getDataInventoryNumber = (arrLotId) => {
            let searchObj = search.create({
                type: "inventorynumber",
                filters:
                    [
                        search.createFilter({
                            name: 'internalid',
                            operator: 'anyof',
                            values: arrLotId
                        })
                    ],
                columns:
                    [
                        search.createColumn({name: "inventorynumber", label: "Number"}),
                        search.createColumn({name: "custitemnumber_scv_item_num_color_seri", label: "Seri màu"})
                    ]
            });
            let objCols = searchObj.columns;
            let searchResult = searchObj.run().getRange({start: 0, end: 1000});
            const sizeData = searchResult.length;
            let result = [];
            for (let i = 0; i < sizeData; i++) {
                result.push({
                    id: String(searchResult[i].id),
                    inventorynumber: searchResult[i].getValue(objCols[0]),
                    colorSeri: searchResult[i].getValue(objCols[1])
                });
            }
            return result;
        };

        const getDataInventoryNumberId = curRec => {
            const slId = 'item';
            const slInvDetail = "inventoryassignment";
            let lc = curRec.getLineCount(slId);
            let results = [];
            for (let i = 0; i < lc; i++) {
                const inventorydetail = curRec.getSublistValue({sublistId: slId, fieldId: 'inventorydetail', line: i});
                if (!inventorydetail) continue;
                let recSub = curRec.getSublistSubrecord({sublistId: slId, fieldId: 'inventorydetail', line: i});
                const lcDet = recSub.getLineCount(slInvDetail);
                let arrLotId = new Set();
                for (let j = 0; j < lcDet; j++) {
                    let invLotId = recSub.getSublistValue(slInvDetail, 'numberedrecordid', j);
                    if (!invLotId || arrLotId.has(invLotId)) continue;
                    arrLotId.add(invLotId);
                }
                if (arrLotId.size > 0) {
                    results.push({
                        index: i,
                        lotId: [...arrLotId]
                    });
        }
            }
            return results;
        };

        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (scriptContext) => {
            updateQuantityApproved(scriptContext);
        };

        const updateQuantityApproved = (scriptContext) => {
            let triggerType = scriptContext.type;
            if (!['create', 'edit'].includes(triggerType)) return;
            let newRec = scriptContext.newRecord;
            let STATUS_PENDING_INVENTORY_APPROVED = '35';
            const newStatusApprovedId = newRec.getValue('custbody_scv_approval_status');
            if (newStatusApprovedId !== STATUS_PENDING_INVENTORY_APPROVED) return;
            if (triggerType === 'edit') {
                let oldRec = scriptContext.oldRecord;
                let oldStatusApprovedId = oldRec.getValue('custbody_scv_approval_status');
                if (oldStatusApprovedId === newStatusApprovedId) return;
            }
            const SUBLIST_ID = 'item';
            const lc = newRec.getLineCount(SUBLIST_ID);
            for (let i = 0; i < lc; i++) {
                const quantity = newRec.getSublistValue({sublistId: SUBLIST_ID, fieldId: 'quantity', line: i});
                newRec.setSublistValue({
                    sublistId: SUBLIST_ID,
                    fieldId: 'custcol_scv_approved_qty',
                    line: i,
                    value: quantity
                });
            }
        };

        /**
         *
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const afterSubmit = (scriptContext) => {
            afterSubmit_UpdateBuild(scriptContext);
        };

        const afterSubmit_UpdateBuild = (scriptContext) => {
            let triggerType = scriptContext.type;

            if(!["create"].includes(triggerType)) return;
            let newRec = scriptContext.newRecord;
            let sl = "item";
            let tl = newRec.getLineCount(sl);

            const arrBuild = commonUpdateBuild.getDataCreateFromAB(newRec, sl, tl);
            if(arrBuild.length === 0) return;

            if(arrBuild.length > 3) {
                const data = {
                    rectype: "transferorder",
                    id: newRec.id.toString(),
                    arrBuild: arrBuild
                };

                let scriptId = commonUpdateBuild.ScheduledScript.ID;
                let deployId = commonUpdateBuild.ScheduledScript.DEPLOYMENT;
                let inputParam = commonUpdateBuild.ScheduledScript.INPUT_PARAM;

                let queueJobId = constQueueJob.createQueueJob("SCHEDULED_SCRIPT", scriptId, deployId, inputParam, JSON.stringify(data));
                let processingQueueJobId = constQueueJob.processQueueJob(scriptId, deployId);
            } else {
                for(let objBuild of arrBuild) {
                    commonUpdateBuild.updateRelatedTransBuild(objBuild, newRec.id.toString());
                }
            }
        }

        return {
            beforeLoad,
            beforeSubmit,
            afterSubmit
        }

    });
