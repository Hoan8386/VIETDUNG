/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/search', 'N/record', '../common/scv_common_pdf','N/render'],

    (search, record, comPdf, render) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            if (scriptContext.request.method === 'GET') {
                let parameters = scriptContext.request.parameters;
                let recId = parameters.recid;
                let recType = parameters.rectype;
                let template = parameters.template;

                let rec = record.load({
                    type: recType,
                    id: recId,
                });

                let objRender = comPdf.initTemplateRender(template);

                let seri = getSeriMau(rec);

                log.debug('seri', seri);

                comPdf.addFontVietnamese(objRender);
                comPdf.addImage(objRender, 'Logo-removebg-preview.png');
                objRender.addRecord('recAb',rec);
                objRender.addCustomDataSource({
                    alias: 'item',
                    format: render.DataSource.OBJECT,
                    data: {
                        itemupccode: parameters.itemupccode,
                        seri: seri['inventorynumber.custitemnumber_scv_item_num_color_seri']
                    }
                })

                let pdfFile = objRender.renderAsPdf();

                scriptContext.response.writeFile(pdfFile, true);
            }
        }

        const getSeriMau = (rec) => {
            let inventoryDetail = rec.getValue('inventorydetail');

            let lkFieldsInventoryDetail = search.lookupFields({
                type: 'inventorydetail',
                id: inventoryDetail,
                columns: ['inventorynumber.custitemnumber_scv_item_num_color_seri']
            });

            return lkFieldsInventoryDetail;
        }

        return {onRequest}

    });
