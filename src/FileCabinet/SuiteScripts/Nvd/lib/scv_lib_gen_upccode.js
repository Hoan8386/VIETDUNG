define(['N/search', 'N/record'], (search, record) => {
    const CustomFormId = {
        THANH_PHAM_HHTM_NHOM_I: '110',
        THANH_PHAM_CO_KHI_NHOM_II: '415',
        NVL_ACP_AC_LCN_NHOM_III: '526',
        VAT_TU_KY_THUAT_CO_NHOM_IV: '111',
        VAT_TU_KY_THUAT_DIEN_NHOM_V: '521',
        TAI_SAN_KY_THUAT_NHOM_VI: '413',
        VAT_TU_VA_TAI_SAN_KHAC_NHOM_VII: '414',
        CCDC_PHUC_VU_VIII: '532',
    };

    const getDataUPCCodeItems = (curRecItem) => {
        const objDataItemConfig = getDataConfigItem(curRecItem);
        let {
            upccode,
            displayName,
            isSuccess
        } = getDataUPCCode(objDataItemConfig);
        if (!isSuccess) {
            return {
                isSuccess: false,
                msg: 'Đã tồn tại số UPCCODE ' + upccode + ' trong hệ thống!',
                itemid : objDataItemConfig.upccodeold +'_' + displayName,
                displayname : displayName
            };
        }
        if (!displayName) displayName = objDataItemConfig.displayname;
        const itemid = upccode + '_' + displayName;
        return {
            isSuccess: isSuccess,
            upccode: upccode,
            itemid: itemid,
            displayname: displayName
        };
    };

    const validFormGenerateUPCCode = (customFormId) => Object.values(CustomFormId).includes(customFormId);

    const isChangeFieldsRelatedWithMakeUPCCode = (scriptContext) => {
        let newRecord = scriptContext.newRecord;
        let oldRecord = scriptContext.oldRecord;
        const customFormId = newRecord.getValue('customform');
        let arrFields = getArrayFields(customFormId, true);
        return arrFields.some(fldId => newRecord.getValue(fldId) !== oldRecord.getValue(fldId));
    };

    const getArrayFields = (customform, isFieldChanged = false) => {
        let arrFields;
        switch (customform) {
            case CustomFormId.THANH_PHAM_HHTM_NHOM_I:
                arrFields = [
                    'custitem_scv_group_lv1',
                    'custitem_scv_group_lv2',
                    'custitem_scv_color_code',
                    'custitem_scv_bottom_color_code',
                    'custitem_scv_ddsp',
                    'custitem_scv_ddn',
                    'custitem_scv_width',
                    'custitem_scv_length',
                    'custitem_scv_pbv',
                    'custitem_scv_ls',
                    'custitem_scv_htd',
                    'custitem_scv_kd',
                    'custitem_scv_step',
                    'custitem_scv_last_symbol'
                ];
                break;
            case CustomFormId.THANH_PHAM_CO_KHI_NHOM_II:
                arrFields = [
                    'custitem_scv_group_lv1',
                    'custitem_scv_kl',
                    'custitem_scv_last_symbol'
                ];
                break;
            case CustomFormId.NVL_ACP_AC_LCN_NHOM_III:
                arrFields = [
                    'custitem_scv_group_lv1',
                    'custitem_scv_group_lv2',
                    'custitem_scv_color_code',
                    'custitem_scv_class',
                    'custitem_svc_lkd',
                    'custitem_scv_dd',
                    'custitem_scv_width',
                    'custitem_scv_tcdb',
                    'custitem_scv_width',
                    'custitem_scv_length',
                    'custitem_scv_ls',
                    'custitem_scv_last_symbol'
                ];
                break;
            case CustomFormId.VAT_TU_KY_THUAT_CO_NHOM_IV:
                arrFields = [
                    'custitem_scv_group_lv1',
                    'custitem_scv_group_lv2',
                    'custitem_scv_group_lv3',
                    'custitem_scv_group_lv4',
                    'custitem_scv_dtlv',
                    'custitem_scv_kl',
                    'custitem_scv_lrktc',
                    'custitem_scv_dkn',
                    'custitem_scv_dkt',
                    'custitem_scv_cdlv',
                    'custitem_scv_length_y',
                    'custitem_scv_width_x',
                    'custitem_scv_cdz',
                    'custitem_scv_cv',
                    'custitem_scv_sr',
                    'custitem_scv_step',
                    'custitem_scv_last_symbol',
                    'custitem_scv_ts'
                ];
                break;
            case CustomFormId.VAT_TU_KY_THUAT_DIEN_NHOM_V:
                arrFields = [
                    'custitem_scv_group_lv1',
                    'custitem_scv_group_lv2',
                    'custitem_scv_group_lv3',
                    'custitem_scv_group_lv4',
                    'custitem_scv_sgt',
                    'custitem_scv_kl',
                    'custitem_scv_dkn',
                    'custitem_scv_cdlv',
                    'custitem_scv_width_x',
                    'custitem_scv_cdz',
                    'custitem_scv_model',
                    'custitem_scv_cs',
                    'custitem_scv_da',
                    'custitem_scv_dda',
                    'custitem_scv_cv',
                    'custitem_scv_last_symbol',
                ];
                if (!isFieldChanged) arrFields.push('custitem_scv_ttbvcs');
                break;
            case CustomFormId.TAI_SAN_KY_THUAT_NHOM_VI:
                arrFields = [
                    'custitem_scv_group_lv1',
                    'custitem_scv_group_lv2',
                    'custitem_scv_group_lv3',
                    'custitem_scv_group_lv4',
                    'custitem_scv_dtlv',
                    'custitem_scv_tt_tan',
                    'custitem_scv_bks',
                    'custitem_scv_dk_mm',
                    'custitem_scv_length',
                    'custitem_scv_da',
                    'custitem_scv_last_symbol',
                ];
                break;
            case CustomFormId.VAT_TU_VA_TAI_SAN_KHAC_NHOM_VII:
            case CustomFormId.CCDC_PHUC_VU_VIII:
                arrFields = [
                    'custitem_scv_group_lv1',
                    'custitem_scv_group_lv2',
                    'custitem_scv_group_lv3',
                    'custitem_scv_group_lv4',
                    'custitem_scv_ktgn',
                    'custitem_scv_ts',
                    'custitem_scv_last_symbol'
                ];
                break;
        }
        return arrFields;
    }

    const getDataConfigItem = (curRec) => {
        const customform = curRec.getValue('customform');
        const displayName = curRec.getValue('displayname');
        const upccode = curRec.getValue('upccode');
        let arrFields = getArrayFields(customform);
        const sizeFields = arrFields.length;
        let objValues = {
            customform: customform,
            displayname: displayName,
            upccodeold : upccode
        };
        let isDynamic = curRec.isDynamic;
        for (let i = 0; i < sizeFields; i++) {
            const objField = curRec.getField(arrFields[i]);
            let val = '';
            if (objField.type === 'select') {
                val = curRec.getValue(arrFields[i]) || '';
                if (val) {
                    val = isDynamic ? curRec.getText(arrFields[i]) : getDataNameOfField(arrFields[i], val);
                }
            } else {
                val = curRec.getValue(arrFields[i]) || '';
            }
            objValues[arrFields[i]] = val;
        }
        return objValues;
    };

    const getDataUPCCode = (objDataConfig) => {
        const upccode = getUpccodeItem(objDataConfig);
        const displayName = getDisplayNameItem(objDataConfig);
        const upcCodeItemDataId = createRecordDataUPCCodeItem(upccode, '', '');
        const isSuccess = !!upcCodeItemDataId;
        return {
            upccode: upccode,
            displayName: displayName,
            upcCodeItemDataId: upcCodeItemDataId,
            isSuccess: isSuccess
        };
    };

    const generateUPCCodeItem = (objDataConfig, maxNumber, counter = 1) => {
        if (counter === 5) return 'notfoundupccode';
        const upccode = getUPCCodeItem(objDataConfig, maxNumber);
        if (createRecordDataUPCCodeItem(upccode, objDataConfig.prefix, maxNumber)) {
            return upccode
        } else {
            return generateUPCCodeItem(objDataConfig, maxNumber + 1, counter + 1);
        }
    };

    const createRecordDataUPCCodeItem = (upccode, prefix, maxNumber) => {
        try {
            let rec = record.create({type: 'customrecord_scv_dt_upccode_item'});
            rec.setValue({fieldId: 'externalid', value: upccode});
            rec.setValue({fieldId: 'name', value: upccode});
            rec.setValue({fieldId: 'custrecord_dt_upc_it_prefix', value: prefix});
            rec.setValue({fieldId: 'custrecord_dt_upc_it_number', value: maxNumber});
            return rec.save({ignoreMandatoryFields: true});
        } catch (e) {
            log.error('error '.concat(upccode), e);
            return null;
        }
    };

    const getUPCCodeItem = (objDataConfig, maxNumber) => {
        const delimiterBeforeNumber = objDataConfig.delimiterBeforeNumber;
        const delimiterAfterNumber = objDataConfig.delimiterAfterNumber;
        let upccode = [
            objDataConfig.prefix,
            maxNumber.toString().padStart(objDataConfig.digit, '0'),
        ]
            .join(delimiterBeforeNumber);
        if (objDataConfig.suffix) {
            upccode += delimiterAfterNumber + objDataConfig.suffix;
        }
        return upccode;
    };

    const joinArray = (arr, char = '.') => {
        const lc = arr.length;
        let str = '';
        for (let i = 0; i < lc; i++) {
            let val = arr[i];
            if (!isValidValue(val)) continue;
            if (typeof val === 'number') val = String(val);
            str += val + char;
        }
        const lenChar = char.length;
        if (lenChar === 0) return str;
        return str.substring(0, str.length - lenChar);
    };

    const extractPrefix = (word, char = ':') => {
        if (typeof word === 'number') return String(word) || '';
        if (Array.isArray(word)) {
            let str = '';
            for (let i = 0; i < word.length; i++) {
                str += extractPrefix(word[i], char);
            }
            return str.trim();
        } else {
            if (!isValidValue(word)) return '';
            const indexChar = word.indexOf(char);
            if (indexChar === -1) return word;
            return word.substring(0, indexChar).trim();
        }
    };

    const extractSuffix = (word, char = ':') => {
        if (typeof word === 'number') return String(word) || '';
        if (Array.isArray(word)) {
            let str = '';
            for (let i = 0; i < word.length; i++) {
                str += extractSuffix(word[i], char);
            }
            return str.trim();
        } else {
            if (!isValidValue(word)) return '';
            const lastIndexChar = word.lastIndexOf(char);
            if (lastIndexChar === -1) return word;
            return word.substring(lastIndexChar + 1).trim();
        }
    }


    const isValidValue = (value) => value !== '' && value !== undefined && value !== null;

    const getRecordTypeOfField = (fieldId) => {
        let recordType = '';
        switch (fieldId) {
            case 'custitem_scv_group_lv1':
            case 'custitem_scv_group_lv2':
            case 'custitem_scv_group_lv3':
            case 'custitem_scv_group_lv4':
                recordType = 'customrecord_scv_group_level';
                break;
            case 'custitem_scv_bottom_color_code':
            case 'custitem_scv_color_code':
                recordType = 'customrecord_scv_color_code_list';
                break;
            case 'custitem_scv_ddsp':
                recordType = 'customlist_scv_ddsp_list';
                break;
            case 'custitem_scv_ddn':
                recordType = 'customlist_scv_ddn_list';
                break;
            case 'custitem_scv_pbv':
                recordType = 'customlist_svc_pbv_list';
                break;
            case 'custitem_scv_ls':
                recordType = 'customlist_scv_ls_list';
                break;
            case 'custitem_scv_kd':
                recordType = 'customlist_scv_kd_list';
                break;
            case 'custitem_scv_htd':
                recordType = 'customlist_scv_htd_list';
                break;
            case 'custitem_scv_lr':
                recordType = 'customlist_scv_lr_list';
                break;
            case 'custitem_scv_class':
                recordType = 'customlist_svc_nhom_nvl_list';
                break;
            case 'custitem_svc_lkd':
                recordType = 'customlist_scv_lkd_list';
                break;
            case 'custitem_scv_dd':
                recordType = 'customlist_scv_dd_list';
                break;
            case 'custitem_scv_tcdb':
                recordType = 'customlist_scv_tcdb_list';
                break;
            // case 'custitem_scv_dtlv':
            //     recordType = 'customlist_scv_dm_dtlv';
            //     break;
            case 'custitem_scv_step':
                recordType = 'customlist_scv_step_list';
                break;
            default:
        }
        return recordType;
    }

    const getDataNameOfField = (fieldId, id) => {
        if (!id) return '';
        const recordType = getRecordTypeOfField(fieldId);
        if (!recordType) {
            log.error('Error getRecordTypeOfField', fieldId);
            return '';
        }
        let arrFields = ['name'];
        if (recordType === 'customrecord_scv_group_level') {
            arrFields.push('parent');
        }
        let lkRecord = search.lookupFields({
            type: recordType,
            id: id,
            columns: arrFields
        });
        let name = lkRecord.name || '';
        if (arrFields.length > 1) {
            let nameParent = lkRecord.parent?.[0]?.text || '';
            if (nameParent.length > 0) {
                name = name.substring(nameParent.length + 2).trim();
            }
        }
        return name;
    };

    const getNewDisplayName = (newRecord, oldRecord) => {
        let result = {
            isChanged: false,
            displayName: ''
        };
        const customFormId = newRecord.getValue('customform');
        if (customFormId === CustomFormId.VAT_TU_KY_THUAT_DIEN_NHOM_V) {
            const isChangedFieldsTenTuyBien = newRecord.getValue('custitem_scv_ttbvcs') !== oldRecord.getValue('custitem_scv_ttbvcs');
            if (isChangedFieldsTenTuyBien) {
                return {
                    displayName: getDisplayNameItem(getDataConfigItem(newRecord)),
                    isChanged: true
                }
            }
        }
        let isChangedDisplay = newRecord.getValue('displayname') !== oldRecord.getValue('displayname');
        if (isChangedDisplay) return Object.assign(result, {
            isChanged: true,
            displayName: newRecord.getValue('displayname')
        });
        return result;
    };

    const reMakeUpdateDisplay = (itemId) => {
        let lkF = search.lookupFields({
            type: search.Type.ITEM, id: itemId, columns: ['type', 'recordtype']
        });
        let recordType = lkF.recordtype;
        let curRec = record.load({type: recordType, id: itemId, isDynamic: true});
        let upccodeOld = curRec.getValue('upccode');
        let objDataUpccode = getDataUPCCodeItems(curRec);
        log.error('objDataUpccode', objDataUpccode);
        if (objDataUpccode.isSuccess) {
            deleteRelatedUPCCode(upccodeOld);
            record.submitFields({
                type: recordType,
                id: itemId,
                options: {
                    ignoreMandatoryFields: true
                },
                values: {
                    displayname: objDataUpccode.displayname,
                    upccode: objDataUpccode.upccode,
                    itemid: objDataUpccode.itemid
                }
            });
        } else {
            record.submitFields({
                type: recordType,
                id: itemId,
                options: {
                    ignoreMandatoryFields: true
                },
                values: {
                    displayname: objDataUpccode.displayname,
                    itemid: objDataUpccode.itemid
                }
            });
            log.error('Error reMakeUpdateDisplay', objDataUpccode.msg);
        }
    };

    const getUpccodeItem = (objDataConfig) => {
        let upccode = '';
        switch (objDataConfig.customform) {
            case CustomFormId.THANH_PHAM_HHTM_NHOM_I:
                upccode = joinArray([
                    extractPrefix(objDataConfig.custitem_scv_group_lv1),
                    extractPrefix(objDataConfig.custitem_scv_group_lv2),
                    extractPrefix(objDataConfig.custitem_scv_color_code),
                    extractPrefix(objDataConfig.custitem_scv_bottom_color_code),
                    extractPrefix([objDataConfig.custitem_scv_ddsp, objDataConfig.custitem_scv_ddn]),
                    extractPrefix([objDataConfig.custitem_scv_width, objDataConfig.custitem_scv_length]),
                    extractPrefix([objDataConfig.custitem_scv_pbv, objDataConfig.custitem_scv_ls]),
                    extractPrefix([objDataConfig.custitem_scv_htd, objDataConfig.custitem_scv_kd, objDataConfig.custitem_scv_step]),
                    extractPrefix(objDataConfig.custitem_scv_last_symbol)
                ]);
                break;
            case CustomFormId.THANH_PHAM_CO_KHI_NHOM_II:
                upccode = joinArray([
                    extractPrefix(objDataConfig.custitem_scv_group_lv1),
                    extractPrefix(objDataConfig.custitem_scv_kl),
                    extractPrefix(objDataConfig.custitem_scv_last_symbol),
                ]);
                break;
            case CustomFormId.NVL_ACP_AC_LCN_NHOM_III:
                upccode = joinArray([
                    extractPrefix(objDataConfig.custitem_scv_group_lv1),
                    extractPrefix(objDataConfig.custitem_scv_group_lv2),
                    extractPrefix(objDataConfig.custitem_scv_color_code),
                    extractPrefix([objDataConfig.custitem_scv_class, objDataConfig.custitem_svc_lkd, objDataConfig.custitem_scv_dd, objDataConfig.custitem_scv_ls]),
                    extractPrefix(objDataConfig.custitem_scv_tcdb)
                        .concat(extractPrefix([objDataConfig.custitem_scv_width, objDataConfig.custitem_scv_length])),
                    extractPrefix(objDataConfig.custitem_scv_last_symbol)
                ]);
                break;
            case CustomFormId.VAT_TU_KY_THUAT_CO_NHOM_IV:
                upccode = joinArray([
                    extractPrefix(objDataConfig.custitem_scv_group_lv1),
                    extractPrefix(objDataConfig.custitem_scv_group_lv2),
                    extractPrefix(objDataConfig.custitem_scv_group_lv3),
                    extractPrefix(objDataConfig.custitem_scv_group_lv4),
                    extractPrefix(objDataConfig.custitem_scv_dtlv),
                    extractPrefix(objDataConfig.custitem_scv_kl),
                    extractPrefix(objDataConfig.custitem_scv_lrktc),
                    extractPrefix(objDataConfig.custitem_scv_dkn),
                    extractPrefix(objDataConfig.custitem_scv_dkt),
                    extractPrefix(objDataConfig.custitem_scv_cdlv),
                    extractPrefix(objDataConfig.custitem_scv_length_y),
                    extractPrefix(objDataConfig.custitem_scv_width_x),
                    extractPrefix(objDataConfig.custitem_scv_cdz),
                    extractPrefix(objDataConfig.custitem_scv_cv),
                    extractPrefix(objDataConfig.custitem_scv_sr),
                    extractPrefix(objDataConfig.custitem_scv_step),
                    extractPrefix(objDataConfig.custitem_scv_ts),
                    extractPrefix(objDataConfig.custitem_scv_last_symbol)
                ]);
                break;
            case CustomFormId.VAT_TU_KY_THUAT_DIEN_NHOM_V:
                upccode = joinArray([
                    extractPrefix(objDataConfig.custitem_scv_group_lv1),
                    extractPrefix(objDataConfig.custitem_scv_group_lv2),
                    extractPrefix(objDataConfig.custitem_scv_group_lv3),
                    extractPrefix(objDataConfig.custitem_scv_group_lv4),
                    extractPrefix(objDataConfig.custitem_scv_sgt),
                    extractPrefix(objDataConfig.custitem_scv_kl),
                    extractPrefix(objDataConfig.custitem_scv_dkn),
                    extractPrefix(objDataConfig.custitem_scv_cdlv),
                    extractPrefix(objDataConfig.custitem_scv_width_x),
                    extractPrefix(objDataConfig.custitem_scv_cdz),
                    extractPrefix(objDataConfig.custitem_scv_model),
                    extractPrefix(objDataConfig.custitem_scv_cs),
                    extractPrefix(objDataConfig.custitem_scv_da),
                    extractPrefix(objDataConfig.custitem_scv_dda),
                    extractPrefix(objDataConfig.custitem_scv_last_symbol)
                ]);
                break;
            case CustomFormId.TAI_SAN_KY_THUAT_NHOM_VI:
                upccode = joinArray([
                    extractPrefix(objDataConfig.custitem_scv_group_lv1),
                    extractPrefix(objDataConfig.custitem_scv_group_lv2),
                    extractPrefix(objDataConfig.custitem_scv_group_lv3),
                    extractPrefix(objDataConfig.custitem_scv_group_lv4),
                    extractPrefix(objDataConfig.custitem_scv_dtlv),
                    extractPrefix(objDataConfig.custitem_scv_tt_tan),
                    extractPrefix(objDataConfig.custitem_scv_bks),
                    extractPrefix(objDataConfig.custitem_scv_dk_mm),
                    extractPrefix(objDataConfig.custitem_scv_length),
                    extractPrefix(objDataConfig.custitem_scv_da),
                    extractPrefix(objDataConfig.custitem_scv_last_symbol)
                ]);
                break;
            case CustomFormId.CCDC_PHUC_VU_VIII:
            case CustomFormId.VAT_TU_VA_TAI_SAN_KHAC_NHOM_VII:
                upccode = joinArray([
                    extractPrefix(objDataConfig.custitem_scv_group_lv1),
                    extractPrefix(objDataConfig.custitem_scv_group_lv2),
                    extractPrefix(objDataConfig.custitem_scv_group_lv3),
                    extractPrefix(objDataConfig.custitem_scv_group_lv4),
                    extractPrefix(objDataConfig.custitem_scv_ktgn),
                    extractPrefix(objDataConfig.custitem_scv_ts),
                    extractPrefix(objDataConfig.custitem_scv_last_symbol)
                ]);
                break;
        }
        return upccode;
    };

    const getDisplayNameItem = (objDataConfig) => {
        let displayName = '';
        switch (objDataConfig.customform) {
            case CustomFormId.THANH_PHAM_CO_KHI_NHOM_II:
                displayName = joinArray([
                    extractSuffix(objDataConfig.custitem_scv_kl),
                    extractSuffix(objDataConfig.custitem_scv_last_symbol)
                ], ' ');
                break;
            case CustomFormId.VAT_TU_KY_THUAT_CO_NHOM_IV:
                displayName = joinArray([
                    extractSuffix(objDataConfig.custitem_scv_group_lv3),
                    extractSuffix(objDataConfig.custitem_scv_group_lv4),
                    extractSuffix(objDataConfig.custitem_scv_dtlv),
                    extractSuffix(objDataConfig.custitem_scv_kl),
                    extractSuffix(objDataConfig.custitem_scv_lrktc),
                    extractSuffix(objDataConfig.custitem_scv_dkn),
                    extractSuffix(objDataConfig.custitem_scv_dkt),
                    extractSuffix(objDataConfig.custitem_scv_cdlv),
                    extractSuffix(objDataConfig.custitem_scv_length_y),
                    extractSuffix(objDataConfig.custitem_scv_width_x),
                    extractSuffix(objDataConfig.custitem_scv_cdz),
                    extractSuffix(objDataConfig.custitem_scv_cv),
                    extractSuffix(objDataConfig.custitem_scv_sr),
                    extractSuffix(objDataConfig.custitem_scv_step),
                    extractSuffix(objDataConfig.custitem_scv_ts),
                    extractSuffix(objDataConfig.custitem_scv_last_symbol)
                ], ' ');
                break;
            case CustomFormId.VAT_TU_KY_THUAT_DIEN_NHOM_V:
                displayName = joinArray([
                    extractSuffix(objDataConfig.custitem_scv_group_lv3),
                    extractSuffix(objDataConfig.custitem_scv_group_lv4),
                    extractSuffix(objDataConfig.custitem_scv_sgt),
                    extractSuffix(objDataConfig.custitem_scv_ttbvcs),
                    extractSuffix(objDataConfig.custitem_scv_kl),
                    extractSuffix(objDataConfig.custitem_scv_dkn),
                    extractSuffix(objDataConfig.custitem_scv_cdlv),
                    extractSuffix(objDataConfig.custitem_scv_width_x),
                    extractSuffix(objDataConfig.custitem_scv_cdz),
                    extractSuffix(objDataConfig.custitem_scv_cs),
                    extractSuffix(objDataConfig.custitem_scv_da),
                    extractSuffix(objDataConfig.custitem_scv_dda),
                    extractSuffix(objDataConfig.custitem_scv_last_symbol)
                ], ' ');
                break;
            case CustomFormId.TAI_SAN_KY_THUAT_NHOM_VI:
                displayName = joinArray([
                        extractSuffix(objDataConfig.custitem_scv_group_lv3),
                        extractSuffix(objDataConfig.custitem_scv_group_lv4),
                        extractSuffix(objDataConfig.custitem_scv_dtlv),
                        extractSuffix(objDataConfig.custitem_scv_tt_tan),
                        extractSuffix(objDataConfig.custitem_scv_bks),
                        extractSuffix(objDataConfig.custitem_scv_dk_mm),
                        extractSuffix(objDataConfig.custitem_scv_length),
                        extractSuffix(objDataConfig.custitem_scv_da),
                        extractSuffix(objDataConfig.custitem_scv_last_symbol)
                    ]
                    , ' ');
                break;
            default:
                displayName = objDataConfig.displayname;
                break;
        }
        return displayName;
    };

    const deleteRelatedUPCCode = (upcCode) => {
        if (!isValidValue(upcCode)) return;
        let searchObj = search.create({
            type: 'customrecord_scv_dt_upccode_item',
            columns: ['internalid'],
            filters: [
                search.createFilter({
                    name: 'name',
                    operator: search.Operator.IS,
                    values: upcCode
                })
            ]
        });
        let searchData = searchObj.run().getRange(0, 1);
        if (searchData.length === 0) return;
        let id = searchData[0].getValue('internalid');
        record.delete({
            type: 'customrecord_scv_dt_upccode_item',
            id: id
        });
    }

    return {
        getDataUPCCodeItems: getDataUPCCodeItems,
        validFormGenerateUPCCode: validFormGenerateUPCCode,
        isChangeFieldsRelatedWithMakeUPCCode: isChangeFieldsRelatedWithMakeUPCCode,
        getNewDisplayName: getNewDisplayName,
        deleteRelatedUPCCode: deleteRelatedUPCCode,
        reMakeUpdateDisplay: reMakeUpdateDisplay
    }
});
