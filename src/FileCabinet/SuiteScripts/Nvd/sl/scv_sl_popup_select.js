/**
 * Nội dung:
 * * =======================================================================================
 *  Date                Author                  Description
 *  26 Jun 2024       Duy Nguyen	    		Init, create file, Xử lý dữ liệu show popup field Select, nếu cần sử lý phức tạp
 *  */

/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/file'],

    (ui, file) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            const response = scriptContext.response;
            const params = scriptContext.request.parameters;
            const form = ui.createForm({title: ' ', hideNavBar: true});
            form.addField({
                id: 'custpage_scv_multi_select',
                type: ui.FieldType.INLINEHTML,
                label: '  ',
            }).defaultValue = fnGetDataShow(params);
            response.writePage(form);
        }

        function fnGetDataShow() {
            return file.load({
                id: '../html/scv_html_popup_select.html'
            }).getContents();
        }


        return {onRequest}

    });
