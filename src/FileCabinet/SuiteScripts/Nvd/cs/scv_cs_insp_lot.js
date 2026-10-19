/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  ?                   ?                       ?
 *  2 Mar 2025          Huy Pham			    Chức năng tính toán Số lượng lỗi lật tấm, from mr.NĐHuy(https://app.clickup.com/t/86cy51faq)
 */
/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/ui/message',
    '../cons/scv_cons_insplot.js'
],

    function (message,
        constInspLot
    ) {

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
            const {sublistId, currentRecord, fieldId} = scriptContext;console.log(fieldId)
            
            if (fieldId === 'custrecord_scv_inspl_seri_color') {
                initializeAlertDuplicateData(currentRecord);
            }

            if(["custrecord_scv_ds_to", "custrecord_scv_ds_error_des"].includes(fieldId)){
                constInspLot.calcCurrentSublistValueDetailShift_SingleError(currentRecord);
            }
            if(["custrecord_scv_ds_error", "custrecord_scv_ds_single_error"].includes(fieldId)){
                constInspLot.calcCurrentSublistValueDetailShift_MultiError(currentRecord);
            }
        }

        const getObjMsgAlert = (msg) => {
            return message.create({
                title: 'This record may have duplicates',
                message: msg,
                type: message.Type.WARNING,
                duration: 20000
            });
        };

        const initializeAlertDuplicateData = (curRec) => {
            const itemId = curRec.getValue('custrecord_scv_inspl_item');
            const colorSeri = curRec.getValue('custrecord_scv_inspl_seri_color') || '';
            if (curRec.id === null || curRec.id === '') return;
            const inspLotId = curRec.id.toString();
            if (window?.SCV?.msgDuplicateId) window?.SCV?.msgDuplicateId?.hide();
            if (!itemId) return;
            if (!colorSeri) return;
            const objRes = postDataSuitelet({itemId, colorSeri, inspLotId});
            if (typeof objRes !== 'object') return;
            if (!objRes.isValid) return;
            const arrDataInspectionLot = objRes.response;
            const msg = createContentLinks(arrDataInspectionLot.map(obj => ({
                name: obj.name,
                link: generateLinkInspectionLot(obj.id)
            })));
            let objMsgAlert = getObjMsgAlert(msg);
            objMsgAlert.show();
            window.SCV = window?.SCV || {};
            window.SCV.msgDuplicateId = objMsgAlert;
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


        const postDataSuitelet = (objParams) => {
            let resCall = window.nlapiRequestURL('/app/site/hosting/scriptlet.nl?script=customscript_scv_sl_check_dup_insp_lot&deploy=customdeploy_scv_sl_check_dup_insp_lot', {...objParams});
            if (resCall.code === 200) return JSON.parse(resCall.getBody());
            else {
                alert(resCall.error.toString())
            }
            return null;
        };

        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
        };

    });
