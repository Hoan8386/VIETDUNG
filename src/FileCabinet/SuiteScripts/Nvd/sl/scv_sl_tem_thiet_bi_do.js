/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record', 'N/render', '../common/scv_common_pdf', 'N/search'],
    
    (record, render, comPdf, search) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            if (scriptContext.request.method === "GET") {
                let parameters = scriptContext.request.parameters;
                if (!parameters.templateid || !parameters.rectype || !parameters.recid) {
                    log.error("Missing Parameters", parameters);
                    scriptContext.response.write("Erorr: Parameter missing!");
                    return;
                }
                let pdfFile = buildPdfFile(parameters);
                if (pdfFile) {
                    scriptContext.response.writeFile(pdfFile, true);
                } else {
                    scriptContext.response.write("Error: Cannot create PDF!");
                }
            }
        }

        const buildPdfFile = (parameters) => {
            let objRender = comPdf.initTemplateRender(parameters.templateid);
            let rec = record.load({
                type: parameters.rectype,
                id: parameters.recid
            })
            let items = getItems(rec);
            let seenMaSo = new Set();
            let filteredItems = [];

            items.forEach(item => {
                if (item.maSo && !seenMaSo.has(item.maSo)) {
                    seenMaSo.add(item.maSo);
                    filteredItems.push(item);
                }
            });

            items = filteredItems;

            objRender.addRecord('record', rec);
            comPdf.addFontVietnamese(objRender);
            objRender.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: "dataJson",
                data: {
                    items,
                }
            });
            return objRender.renderAsPdf();
        }

        const getItems = (rec) => {
            let arr = [];
            let lineName;
            let lc;
            lineName = 'recmachcustrecord_scv_hctb_detail_parent';
            lc = rec.getLineCount(lineName);

            for (let i = 0; i < lc; i++) {
                let maSo = rec.getSublistValue(lineName, 'custrecord_scv_hctb_detail_tb_it', i);
                let saiSo = rec.getSublistValue(lineName, 'custrecord_scv_hctb_detail_error', i);
                let modifyDate = rec.getSublistValue(lineName, 'custrecord_scv_hctb_detail_modify_date', i);
                let hanSudung = rec.getSublistValue(lineName, 'custrecord_scv_hctb_nexttime', i);
                let newModifyDate  = formatDateTime(modifyDate);
                let newHanSuDung  = formatDateTime(hanSudung);
                arr.push({
                    maSo,
                    saiSo,
                    newModifyDate,
                    newHanSuDung,
                });
            }
            return arr
        };

        const formatDateTime = (date) => {
            return new Date(date).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit'
            });
        }

        return {onRequest}

    });
