/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/runtime', 'N/record', 'N/query', 'N/ui/message', 'N/url'],
    function (runtime, record, query, message, url) {
        const objCustomRecordType = {
            ENTITY_CATEGORY : 'customrecord_scv_entity_category'
        };

        /**
         * Des: Config Validate Check Duplicate Data
         * @param recType
         * @returns {{
         * recordType: string, // Record Type
         * groupFields: *[], // Check Validate Group Fields
         * fields: *[], // Check Validate Fields
         * validateFieldsSaved: *[] // Check Validate Fields When SaveRecord
         * validateGroupFieldsSaved: *[] // Check Validate Fields When SaveRecord
         * }}
         */
        function getDataConfigFieldsCheckDuplicate(recType) {
            let objFields = {
                recordType: '',
                fields: [],
                groupFields: [],
                validateFieldsSaved: [],
                validateGroupFieldsSaved : []
            };
            switch (recType) {
                case record.Type.SERVICE_ITEM:
                case record.Type.INVENTORY_ITEM:
                case record.Type.LOT_NUMBERED_INVENTORY_ITEM:
                case record.Type.LOT_NUMBERED_ASSEMBLY_ITEM:
                case record.Type.NON_INVENTORY_ITEM:
                case record.Type.ITEM_GROUP:
                    objFields.recordType = query.Type.ITEM;
                    objFields.fields = ['upccode'];
                    objFields.validateFieldsSaved = ['upccode'];
                    break;
                case record.Type.EMPLOYEE :
                    objFields.recordType = query.Type.EMPLOYEE;
                    objFields.fields = ['custentity_scv_internal_code'];
                    objFields.validateFieldsSaved = ['custentity_scv_internal_code'];
                    break;
                case objCustomRecordType.ENTITY_CATEGORY:
                    // objFields.recordType = objCustomRecordType.ENTITY_CATEGORY;
                    // objFields.fields = [];
                    // objFields.validateFieldsSaved = [];
                    // objFields.groupFields = [
                    //     ['custrecord_scv_entity_category_type', 'custrecord_scv_entity_category_code']
                    // ];
                    break;
                default:
                    break;
            }
            return objFields;
        }

        function showMessWarning(msg) {
            message.create({
                title: 'This record may have duplicates',
                message: msg,
                type: message.Type.WARNING,
                duration: 20000
            }).show()
        }

        function checkDuplicateFields(curRec, arrFields, arrFieldsGroup, recordType) {
            if (arrFields.length === 0 && arrFieldsGroup.length === 0) return {};
            let arrRecordType = Array.isArray(recordType) ? recordType : [recordType];
            let sqlQuery = '';
            if (arrRecordType.length === 1) {
                sqlQuery = `SELECT id, '${arrRecordType[0]}' as rec_type, ${arrFields.join(', ')}
                            FROM ${arrRecordType[0]}
                            WHERE `;
            } else {
                sqlQuery = `SELECT *
                            FROM (${arrRecordType.map(recordType => `SELECT id, '${recordType}' as rec_type, ${arrFields.join(', ')}
                                                                      FROM ${recordType}`).join(' UNION ALL ')})
                            WHERE `;
            }
            if (arrFields.length) {
                sqlQuery = sqlQuery.concat(arrFields.map(field => {
                    const val = curRec.getValue(field);
                    if (val === null || val === '') return '1 = 1';
                    return `LOWER(${field}) = '${replaceCharactersSpecific(val)}'`;
                }).join(' OR '))
            }
            if (arrFieldsGroup.length) {
                sqlQuery = sqlQuery.concat(arrFieldsGroup
                    .map(arrFields => {
                        return  '( ' + arrFields.map(field => {
                            const val = curRec.getValue(field);
                            if (val === null || val === '') return '1 = 1';
                            return `LOWER(${field}) = '${replaceCharactersSpecific(val)}'`;
                        }).join(' AND ') + ') ';
                    })
                    .join(' OR '));
            }
            debugger;
            let resultSQL = query.runSuiteQL({query: sqlQuery, params: []});
            let arrResult = resultSQL
                .results
                .map(r => {
                    let objMap = r.asMap();
                    return {
                        id: objMap.id,
                        recType: objMap.rec_type,
                        link: getUrlLinkRecord(objMap.rec_type, objMap.id)
                    }
                });
            if (arrResult.length && curRec.id) {
                arrResult = arrResult.filter(r => r.id.toString() !== curRec.id.toString());
            }
            let tagListDuplicate = createContentLinks(arrResult.map(r => r.link));
            if (arrResult.length > 0) {
                return {
                    id: arrResult[0].id,
                    duplicate: true,
                    tagListDuplicate: tagListDuplicate
                };
            }
            return {
                id: '',
                duplicate: false,
                tagListDuplicate: null
            }
        }

        function replaceCharactersSpecific(val) {
            return val.trim().toLowerCase().replaceAll(/'/g, "''").replaceAll(/</g, '&lt;').replaceAll(/>/g, '&gt;');
        }

        function loadFieldsCheck() {
            return window.SCV.FIELDS_CHECK_DUPLICATE;
        }

        function initDataConfigFieldsCheckDuplicate(recType) {
            window.SCV = window.SCV || {};
            window.SCV.FIELDS_CHECK_DUPLICATE = getDataConfigFieldsCheckDuplicate(recType);
            window.SCV.FIELDS_CHECK_DUPLICATE.isSuccess = true;
            window.SCV.FIELDS_CHECK_DUPLICATE.msg = '';
        }

        function pageInit(scriptContext) {
            try {
                initDataConfigFieldsCheckDuplicate(scriptContext.currentRecord.type);
            } catch (e) {
                alert(e.toString())
            }
        }

        function fieldsChangedCheckDuplicate(scriptContext) {
            let curRec = scriptContext.currentRecord;
            let fieldId = scriptContext.fieldId;
            const objFields = loadFieldsCheck();
            const listFields = [...objFields.fields, ...objFields.groupFields.flat()];
            if (listFields.indexOf(fieldId) !== -1) {
                const resultCheckDup = checkDuplicateData(curRec, objFields, fieldId);
                if (resultCheckDup?.isDuplicate) {
                    showMessWarning(resultCheckDup.msg);
                }
            }
        }

        function checkDuplicateData(curRec, objFields, fieldId) {
            let fields = [], valDuplicate = false, tagListDuplicate = '';
            if (objFields.fields.indexOf(fieldId) !== -1) {
                let val = curRec.getValue(fieldId);
                if (!val) return;
                let resultDuplicate = checkDuplicateFields(curRec, [fieldId], [], objFields.recordType);
                tagListDuplicate = resultDuplicate.tagListDuplicate
                valDuplicate = resultDuplicate.duplicate;
                fields = fields.concat([fieldId]);
            }
            else {
                const allEmpty = objFields.groupFields.flat().every(field => !curRec.getValue(field));
                if (allEmpty) return;
                let resultDuplicate = checkDuplicateFields(curRec, [], objFields.groupFields, objFields.recordType);
                tagListDuplicate = resultDuplicate.tagListDuplicate
                valDuplicate = resultDuplicate.duplicate;
                fields = fields.concat(objFields.groupFields);
            }
            let result = {msg: '', isDuplicate: false};
            if (valDuplicate) {
                result.isDuplicate = true;
                result.msg =
                    fields.join('_') + ' : '
                    + fields.map(field => {
                        const objField = curRec.getField({fieldId: field});
                        if (objField.type === 'select') return curRec.getText(field);
                        return curRec.getValue(field) || '';
                    }).join('_');
                result.msg = result.msg.concat('<br/>').concat(tagListDuplicate);
            }
            return result;
        }


        function savedRecordCheckDuplicate(scriptContext) {
            const objFields = loadFieldsCheck();
            const arrFields = objFields.validateFieldsSaved;
            for (let i = 0; i < arrFields.length; i++) {
                const resultCheckDup = checkDuplicateData(scriptContext.currentRecord, objFields, arrFields[i]);
                if (resultCheckDup?.isDuplicate) {
                    showMessWarning(resultCheckDup.msg);
                    return false;
                }
            }
            // const arrGroupFields = objFields.validateGroupFieldsSaved;
            // if (arrGroupFields.length > 0) {
            //
            // }
            return true;
        }

        function fieldChanged(scriptContext) {
            try {
                fieldsChangedCheckDuplicate(scriptContext);
            } catch (e) {
                // alert(e.toString());
            }
        }

        function saveRecord(scriptContext) {
            try {
                return savedRecordCheckDuplicate(scriptContext);
            } catch (e) {
                alert(e.toString());
            }
            return true;
        }

        function createContentLinks(arrLinks) {
            if (!arrLinks || arrLinks.length === 0) return '';
            let strLink = 'List Records : ';
            arrLinks.forEach((link, index) => {
                strLink += '<a href="' + link + '" target="_blank">' + 'Record ' + (index + 1).toString() + '</a><br/>';
            });
            return strLink;
        }

        function getUrlLinkRecord(recType, id) {
            return (recType === 'item') ? `https://${window.nlapiGetContext().company}.app.netsuite.com/app/common/item/item.nl?id=${id}&whence=` : url.resolveRecord({
                recordType: recType,
                recordId: id
            });
        }

        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            saveRecord: saveRecord
        };

    });
