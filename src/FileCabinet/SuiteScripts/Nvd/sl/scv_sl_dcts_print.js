/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record', 'N/render', '../lib/scv_lib_amount_in_word.js',
        '../lib/scv_lib_function.js', '../common/scv_common_pdf', 'N/search'],

    (record, render,
     lamount, lfunc,
     comPdf, search) => {
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
                let pdfFile = buildPdfFile(parameters);
                scriptContext.response.writeFile(pdfFile, true);
            }
        }

        const buildPdfFile = (parameters) => {
            let objRender = comPdf.initTemplateRender(parameters.templateid);
            const recCurrent = record.load({
                type: parameters.rectype,
                id: parameters.recid
            });

            const transferSub = recCurrent.getValue('custrecord_scv_asset_transfer_sub');
            const transferSubInfo = getSubInfo(transferSub);

            const assetTransferFrom = recCurrent.getValue('custrecord_scv_asset_transfer_from');
            const locationInfo = getLocationInfo(assetTransferFrom);
            const recordId = recCurrent.getValue('recordid');
            const newRecordId = recordId + '.DCTS'
            let transferDate = recCurrent.getText('custrecord_scv_asset_transfer_date');
            const createdDate = formatDate(transferDate);

            const creatorId = recCurrent.getValue('custrecord_scv_asset_transfer_creator');
            const creatorName = getEntityInfo(creatorId);

            const {items, totalQuantity} = getItems(recCurrent);

            comPdf.addFontVietnamese(objRender);

            objRender.addRecord('record', recCurrent);
            objRender.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: "dataJson",
                data: {
                    subsidiary: transferSubInfo.subsidiary,
                    mainAddress: locationInfo.mainAddress,
                    createdDate,
                    newRecordId,
                    creatorName: creatorName.creator,
                    items,
                    totalQuantity
                }
            });

            return objRender.renderAsPdf();
        }

        const getEntityInfo = (id) => {
            let entity;
            if (id) {
                entity = search.lookupFields({
                    type: search.Type.ENTITY,
                    id: id,
                    columns: ['custentity_scv_legal_name']
                });
            }
            return {
                creator: entity.custentity_scv_legal_name
            };
        }

        const getItems = (rec) => {
            let lineName = 'recmachcustrecord_scv_asset_transfer'
            let lineNum = rec.getLineCount(lineName);
            let totalQuantity = 0;
            let items = [];

            for (let i = 0; i < lineNum; i++) {
                let transferAss = rec.getSublistValue(lineName, 'custrecord_scv_asset_transfer_ass', i);
                let transferAssDisplay = rec.getSublistValue(lineName, 'custrecord_scv_asset_transfer_ass_display', i);
                let unitDisplay = rec.getSublistValue(lineName, 'custrecord_scv_asset_transfer_ass_unit_display', i);
                let stt = rec.getSublistValue(lineName, 'custrecord_scv_asset_transfer_detail_stt', i);
                let note = rec.getSublistValue(lineName, 'custrecord_scv_asset_transfer_note', i);
                let quantity = rec.getSublistValue(lineName, 'custrecord_scv_asset_transfer_qty', i);

                if (quantity) totalQuantity += Number(quantity);

                let {altName, custrecord_scv_fam_asset_code} = getTransferAssInfo(transferAss);
                items.push({
                    transferAssDisplay,
                    unitDisplay,
                    stt,
                    note,
                    quantity,
                    altName,
                    custrecord_scv_fam_asset_code
                });
            }
            return {items, totalQuantity};
        }

        const getLocationInfo = (locationId) => {
            let locationRec;
            let mainAddress;
            if (locationId) {
                locationRec = record.load({
                    type: search.Type.LOCATION,
                    id: locationId
                })
                mainAddress = locationRec.getValue('mainaddress_text');
            }

            return {
                mainAddress: mainAddress
            };
        };

        const parseLocationName = (name) => {
            const parts = name.split(':');
            return parts[parts.length - 1].trim();
        };

        const getSubInfo = (id) => {
            let subsidiary;
            if (id) {
                subsidiary = search.lookupFields({
                    type: search.Type.SUBSIDIARY,
                    id: id,
                    columns: ['legalname']
                });
            }

            return {
                subsidiary: subsidiary.legalname
            };
        }

        const getTransferAssInfo = (id) => {
            let transferAss;
            if (id) {
                transferAss = search.lookupFields({
                    type: 'customrecord_ncfar_asset',
                    id: id,
                    columns: ['name', 'altname', 'custrecord_scv_asset_unit', 'custrecord_scv_fam_asset_code']
                });
            }

            return {
                name: transferAss.name || '',
                altName: transferAss.altname || '',
                custrecord_scv_asset_unit: transferAss.custrecord_scv_asset_unit[0]?.text || '',
                custrecord_scv_fam_asset_code: transferAss.custrecord_scv_fam_asset_code || ''
            };
        }

        const formatDate = (dateStr) => {
            // Tách chuỗi "dd/mm/yyyy"
            let parts = dateStr.split('/');
            if (parts.length !== 3) return 'Invalid date';

            let day = parseInt(parts[0], 10);
            let month = parseInt(parts[1], 10) - 1; // Tháng bắt đầu từ 0
            let year = parseInt(parts[2], 10);

            let date = new Date(year, month, day);

            // Kiểm tra lại xem date có hợp lệ không (tránh trường hợp 31/02...)
            if (isNaN(date)) return 'Invalid date';

            // Đảm bảo hiển thị 2 chữ số
            let formattedDay = day.toString().padStart(2, '0');
            let formattedMonth = (month + 1).toString().padStart(2, '0');

            return `Ngày ${formattedDay} tháng ${formattedMonth} năm ${year}`;
        }

        return {onRequest}

    });
