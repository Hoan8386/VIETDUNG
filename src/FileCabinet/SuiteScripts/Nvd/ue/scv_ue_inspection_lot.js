/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/search', 'N/url', '../lib/scv_lib_invnumber', 'N/ui/message'],

    (search, url, lin, message) => {
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
            const triggerType = scriptContext.type;
            if (triggerType === 'view') {
                addBtnInventoryStatusChange(scriptContext);
                addPageMsgDuplicateData(scriptContext);
            }
        }

        const addPageMsgDuplicateData = ({form, newRecord}) => {
            const itemId = newRecord.getValue('custrecord_scv_inspl_item');
            const colorSeri = newRecord.getValue('custrecord_scv_inspl_seri_color') || '';
            const inspLotId = newRecord.id.toString();
            if (!colorSeri) return;
            const objCheckDupData = getDataRecordDuplicate({
                inspLotId,
                colorSeri,
                itemId
            });
            if (!objCheckDupData.isValid) return;
            const msg = createContentLinks(objCheckDupData.response.map(obj => ({
                name: obj.name,
                link: generateLinkInspectionLot(obj.id)
            })));
            form.addPageInitMessage({type: message.Type.WARNING, message: msg, duration: -1});
        };

        const getDataRecordDuplicate = ({inspLotId, colorSeri, itemId}) => {
            let searchObj = search.load('customsearch_scv_inslot_dup_seri');
            let filters = [];
            filters = filters.concat([
                search.createFilter({
                    name: 'custrecord_scv_inspl_item',
                    operator: 'anyof',
                    values: itemId
                }),
                search.createFilter({
                    name: 'internalid',
                    operator: 'noneof',
                    values: inspLotId
                })
            ]);
            filters = filters.concat([
                search.createFilter({
                    name: 'formulatext',
                    formula: 'LOWER({custrecord_scv_inspl_seri_color})',
                    operator: 'is',
                    values: colorSeri.toLowerCase()
                })
            ]);
            const objCols = searchObj.columns;
            searchObj.filters = searchObj.filters.concat(filters);
            let searchData = searchObj.run().getRange(0, 100);
            const sz = searchData.length;
            let result = [], msg = '';
            for (let i = 0; i < sz; i++) {
                const obj = {
                    id: searchData[i].id,
                    name: searchData[i].getValue(objCols[0]),
                };
                result.push(obj);
            }
            return {
                isValid: result.length > 0,
                response: result
            };
        };

        const createContentLinks = (arrLinks) => {
            if (!arrLinks || arrLinks.length === 0) return '';
            let strLink = 'List Records : ';
            arrLinks.forEach((objLink, index) => {
                strLink += '<a href="' + objLink.link + '" target="_blank">' + objLink.name + '</a><br/>';
            });
            return strLink;
        };

        const generateLinkInspectionLot = (id) => 'https://9684031.app.netsuite.com/app/common/custom/custrecordentry.nl?rectype=1668&id=' + id;

        const addBtnInventoryStatusChange = ({form, newRecord, type}) => {
            const statusId = newRecord.getValue('custrecord_scv_inspl_total_status');//
            const statusPheDuyetId = newRecord.getValue('custrecord_scv_inspl_qa_approve_status');//
            const createdFromId = newRecord.getValue('custrecord_scv_inspl_createdfrom');//
            const STATUS_DA_PHE_DUYET = '5';
            const STATUS_CHECK_DA_KIEM_TRA = '3';
            if (!createdFromId || statusId !== STATUS_CHECK_DA_KIEM_TRA || statusPheDuyetId !== STATUS_DA_PHE_DUYET) return;
            const searchObj = search.create({
                type: 'customrecord_scv_inbound_inspection_qty',
                filters: [
                    search.createFilter({
                        name: 'isinactive',
                        operator: 'is',
                        values: false
                    }),
                    search.createFilter({
                        name: 'formulatext',
                        formula: '{custrecord_scv_inbound_qty_stachno.id}',
                        operator: 'isempty',
                        values: ''
                    }),
                    search.createFilter({
                        name: 'custrecord_scv_inspq_insp_lot',
                        operator: 'is',
                        values: newRecord.id.toString()
                    })
                ],
                columns: ['internalid']
            });
            if (searchObj.run().getRange(0, 1).length === 0) return;
            let urlLinkCSI = url.resolveScript({
                scriptId: 'customscript_scv_sl_inv_status_change',
                deploymentId: 'customdeploy_scv_sl_inv_status_change',
                params: {
                    source: 'inspection_lot',
                    isSearch: 'T',
                    inspectionLot: newRecord.id
                }
            });
            form.addButton({
                label: 'Chuyển trạng thái',
                functionName: `window.location.replace('${urlLinkCSI}')`,
                id: 'custpage_btn_inv_status_change'
            });
        }

        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (scriptContext) => {
        }

        /**
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const afterSubmit = (scriptContext) => {
            if (['create', 'edit'].includes(scriptContext.type)) {
                lin.setDataLotNumberRecordFromOriginRecord(scriptContext.newRecord.type, scriptContext.newRecord.id);
            }
        }

        return {beforeLoad, beforeSubmit, afterSubmit}

    });
