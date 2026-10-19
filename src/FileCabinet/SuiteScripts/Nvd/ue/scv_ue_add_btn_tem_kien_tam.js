/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record','N/url', 'N/search'],

    (record, url, search) => {
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
            if (scriptContext.type === scriptContext.UserEventType.VIEW) {
                let newRecord = scriptContext.newRecord;
                let itemId = newRecord.getValue('item');

                if(itemId){
                    let itemType = getItemType(itemId);
                    log.error('itemType', itemType);
                    let recAssemblyBuild = record.load({
                        type: itemType,
                        id: itemId,
                    });
                    let customForm = recAssemblyBuild.getValue('customform');
                    let custitem_scv_group_lv1 = recAssemblyBuild.getValue('custitem_scv_group_lv1');
                    let itemUppccode = recAssemblyBuild.getValue('upccode');

                    if (customForm === '110' && custitem_scv_group_lv1 === '1') {
                        let urlSl = url.resolveScript({
                            scriptId: 'customscript_scv_sl_tem_kien_tam_print',
                            deploymentId: 'customdeploy_scv_sl_tem_kien_tam_print',
                            params: {
                                recid: newRecord.id,
                                rectype: newRecord.type,
                                itemupccode: itemUppccode,
                                template: 'CUSTTMPL_SCV_TEM_KIEN_TAM'
                            }
                        });
                        scriptContext.form.addButton({
                            id: 'custpage_scv_add_btn_tem_kien_tam',
                            label: 'Tem kiện tấm',
                            functionName: `window.open('${urlSl}', '_blank')`
                        });
                    }
                }


            }
        }

        const getItemType = (itemId) => {
            return search.lookupFields({
                type: 'item',
                id: itemId,
                columns: ['recordtype']
            }).recordtype;
        }


        return {beforeLoad}

    });
