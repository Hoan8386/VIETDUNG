/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  02 Mar 2025         Huy Pham                Init & create file, Print Label, move from CPC, from mr.Việt(https://app.clickup.com/t/86cy2e9ha)
 */
/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record', '../lib/scv_lib_pdf.js'],

    (record, libPdf) => {
        function onRequest(scriptContext) {
            let request = scriptContext.request;
            let obParam = request.parameters;

            let rec = record.load({
                type: obParam.rectype,
                id: obParam.recid,
                isDynamic: false
            });
            let renderer = libPdf.initTemplateRender(obParam.tmpl);
            renderer.addRecord('record', rec);

            let filename = rec.getValue('name');
            let newfile = renderer.renderAsPdf();
            if (filename) {
                newfile.name = `${filename}.pdf`;
            } else {
                newfile.name = "report.pdf";
            }
            scriptContext.response.writeFile(newfile, true);
        }

        return {onRequest}

    });
